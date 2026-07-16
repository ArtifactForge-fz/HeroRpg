// HeroRPG remake — battle engine (DESIGN.md §4 Combat, §5 Techniques).
// Pure state machine: no DOM access anywhere in this file (PLAN.md architecture, Phase 3 spec).
// All randomness is routed through Game.Battle._rng() (default Math.random) so tests can stub it.
//
// Battle end phases:
//   'won'         — monster HP reached 0; rewards granted via onWin().
//   'lost'        — player HP reached 0; deaths+1, no rewards, no loss (New_Player_Guide.md).
//   'fled'        — the player escaped; no rewards; Fury resets (Recent_Updates.md 2007-08-11).
//   'monsterFled' — the monster's energy bar emptied and it "immediately escaped"
//                   (archived: New_Player_Guide.md). Modeled as its own phase, distinct from
//                   'won': the monster was NOT defeated, so NO rewards of any kind are granted.

var Game = window.Game || {};

Game.Battle = (function () {

  function rng() {
    return Game.Battle._rng();
  }

  function getMonsterDef(monsterId) {
    var list = Game.Data.monsters || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === monsterId) return list[i];
    }
    return null;
  }

  function getTech(techId) {
    var list = Game.Data.techs || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === techId) return list[i];
    }
    return null;
  }

  function deepCopyMonster(def) {
    var copy = JSON.parse(JSON.stringify(def));
    copy.hpMax = def.hp;
    copy.energyMax = def.energy;
    copy.statuses = []; // active statuses on the monster (e.g. Poison)
    return copy;
  }

  // ---------------- Fear (archived: Fear.md; Recent_Updates.md 2007-04-06) ----------------

  function fearLevels(battle) {
    var diff = battle.monster.level - battle.player.level;
    return diff > 0 ? diff : 0;
  }

  // Multiplier applied to all player stat-derived numbers, including spell damage but NOT
  // healing ("Fear affects spell damage (not healing)" — Recent_Updates.md 2007-04-06).
  function fearMultiplier(battle) {
    var levels = fearLevels(battle);
    if (levels <= 0) return 1;
    var mult = 1 - levels * BALANCE.FEAR_STAT_PENALTY_PER_LEVEL;
    return mult < 0 ? 0 : mult; // invented floor: Fear cannot push a stat below zero
  }

  // ---------------- Dodge / glancing / double attack (invented scalings, DESIGN.md §4) ----------------

  function playerDodgeChance(c) {
    var dodgeSkill = (c.skills['Dodge'] && c.skills['Dodge'].level) || 0;
    var chance = BALANCE.DODGE_BASE + c.dexterity * BALANCE.DODGE_PER_DEX + dodgeSkill * BALANCE.DODGE_PER_SKILL_LEVEL;
    // Phase 4: Spirit Shrine "Wind's Grace" buff adds a flat dodge-chance bonus (js/data/shrine.js).
    if (Game.World && Game.World.shrineBonus) chance += Game.World.shrineBonus(c, 'dodge');
    // Phase 6a: active-class "dodge_flat" passives (js/core/classes.js classBonus).
    if (Game.Classes && Game.Classes.classBonus) chance += Game.Classes.classBonus(c, 'dodge_flat');
    return Math.min(BALANCE.DODGE_CAP, chance);
  }

  // invented: monsters have no Dexterity stat in the Phase 3 data shape — their dodge scales
  // off their level instead.
  function monsterDodgeChance(monster) {
    // Phase 7 retune: see BALANCE.MONSTER_DODGE_PER_LEVEL — the old level-based scaling made
    // endgame monsters dodge 1-in-3 attacks and stalled fights.
    var chance = Math.min(BALANCE.MONSTER_DODGE_CAP, BALANCE.DODGE_BASE + monster.level * BALANCE.MONSTER_DODGE_PER_LEVEL);
    // v1.4 P4 (G3) Dragon Kick limit-break rider: a flat dodge-chance reduction for the rest of the
    // battle, floored at 0 — transient on the battle's monster COPY only (deepCopyMonster deep-
    // clones the def; this never mutates the shared js/data/monsters.js entry). Cosmetic-scale,
    // not sim-gated (docs/SPEC-V1.4-GAMEPLAY.md §5 G3; balance.js LB_DRAGON_KICK_DODGE_DEBUFF).
    if (monster.dodgeDebuff) chance = Math.max(0, chance - monster.dodgeDebuff);
    return chance;
  }

  // ---------------- Feature A: Escape can fail (relative-power based) ----------------
  // invented (user-directed): replaces the old "fleeing always succeeds" Phase 3 stand-in.
  // Higher relative level, a badly wounded monster (can't give chase), help the escape; a boss
  // fights back harder. Clamped [FLEE_MIN, FLEE_MAX] — see balance.js comment for the archived
  // Energy.md citation on why flee must stay attemptable (not guaranteed) even at 0 Energy.
  function fleeChance(battle) {
    var c = battle.player, m = battle.monster;
    var chance = BALANCE.FLEE_BASE +
      BALANCE.FLEE_PER_LEVEL_DIFF * (c.level - m.level) +
      BALANCE.FLEE_WOUNDED_BONUS * (1 - m.hp / m.hpMax) -
      (m.boss ? BALANCE.FLEE_BOSS_PENALTY : 0);
    return Math.max(BALANCE.FLEE_MIN, Math.min(BALANCE.FLEE_MAX, chance));
  }

  function playerDoubleAttackChance(c) {
    var daSkill = (c.skills['Double Attack'] && c.skills['Double Attack'].level) || 0;
    var chance = BALANCE.DOUBLE_ATTACK_BASE + c.dexterity * BALANCE.DOUBLE_ATTACK_PER_DEX + daSkill * BALANCE.DOUBLE_ATTACK_PER_SKILL_LEVEL;
    // v1.1 revision: active-class "double_attack_flat" passives (e.g. Gladiator's Relentless
    // Assault — js/data/classes.js; js/core/classes.js classBonus, guarded-hook style matching
    // Game.World.shrineBonus).
    if (Game.Classes && Game.Classes.classBonus) chance += Game.Classes.classBonus(c, 'double_attack_flat');
    return Math.min(BALANCE.DOUBLE_ATTACK_CAP, chance);
  }

  function rollVariance(base) {
    var v = BALANCE.DAMAGE_VARIANCE;
    return base * (1 + (rng() * 2 - 1) * v); // uniform in [1-v, 1+v]
  }

  // Monster resistances are stored as "multiplier taken by damage of that grade" (spec shape):
  // 0.5 means the monster takes 50% less of that grade; negative values mean vulnerability.
  function applyResistance(monster, grade, amount) {
    if (!grade) return amount;
    var res = (monster.resistances && typeof monster.resistances[grade] === 'number') ? monster.resistances[grade] : 0;
    return amount * (1 - res);
  }

  function log(battle, message) {
    battle.log.push(message);
  }

  // ---------------- Start ----------------

  function start(monsterId, options) {
    var def = getMonsterDef(monsterId);
    var c = Game.state.character;
    if (!def || !c) return null;

    var monsterCopy = deepCopyMonster(def);

    // Enemy-variety pass: Champion encounters (invented; flavor-credited to the archived
    // "Champion Bosses" forum-thread title, reference/site/homepage_2006.md — see balance.js
    // CHAMPION_* comment). Only the deep COPY is transformed here — the shared def in
    // js/data/monsters.js is never mutated, so every other battle against this monster id stays
    // normal. Rolled only by Game.World.hunt(); never passed by Lair/boss fights or debug.js
    // fight().
    if (options && options.champion) {
      monsterCopy.champion = true;
      monsterCopy.name = 'Champion ' + monsterCopy.name;
      monsterCopy.hp = Math.round(monsterCopy.hp * BALANCE.CHAMPION_HP_MULT);
      monsterCopy.hpMax = Math.round(monsterCopy.hpMax * BALANCE.CHAMPION_HP_MULT);
      monsterCopy.damage = Math.round(monsterCopy.damage * BALANCE.CHAMPION_DAMAGE_MULT);
      // v1.4 P3 (G2): one affix, rolled uniformly through the single rng() stub surface (never a
      // second _rng — CLAUDE.md cardinal rule). docs/SPEC-V1.4-GAMEPLAY.md §4 + P0 RESULTS item 2.
      var affixes = BALANCE.CHAMPION_AFFIXES;
      monsterCopy.affix = affixes[Math.floor(rng() * affixes.length)];
    }

    var battle = {
      monster: monsterCopy,
      player: c, // live character object (single-save game); battle reads/writes it directly
      log: [],
      phase: 'active', // 'active' | 'won' | 'lost' | 'fled' | 'monsterFled'
      pendingLoot: null,
      pendingStolenLoot: null, // v1.2 Phase 1 item 4: Thievery's extra drop-table roll on win
      lootMessage: null,
      // archived: New_Player_Guide.md "Who gets to attack first depends on whose dexterity is
      // higher." Monsters have no modeled Dexterity — invented: a monster's effective dexterity
      // equals its level for turn-order purposes. Tie -> player (spec).
      // Camping risk (Game.World.camp(), reference/forum/t-756.md): an ambush battle always gives
      // the monster first strike regardless of Dexterity — invented: you were asleep.
      playerFirst: (options && options.ambush) ? false : c.dexterity >= (def.dexterity !== undefined ? def.dexterity : def.level),
      ambush: !!(options && options.ambush),
      techsUsedThisBattle: {}, // magic-school skill name -> true (for win skill XP)
      attackedThisBattle: false,
      hitWhileWearingArmor: {}, // equip slot -> true (for win armor-skill XP)
      rewards: null
    };

    // The battle owns a per-battle status list on the player (cleared on start so poison etc.
    // never leaks between battles or into the save).
    battle.playerStatuses = [];

    log(battle, 'A ' + monsterCopy.name + ' (Lv ' + def.level + ') appears!');
    if (monsterCopy.champion) {
      log(battle, 'A Champion prowls the area — it looks far stronger than its kin!');
      if (monsterCopy.affix) log(battle, AFFIX_ANNOUNCE[monsterCopy.affix]);
    }
    if (fearLevels(battle) > 0) {
      log(battle, 'A yellow bar of Fear creeps in — this foe is above your level.');
    }

    Game.state.battle = battle;

    // First strike: if the monster is faster (or this is a camp ambush), it acts once before the
    // player's first action.
    if (!battle.playerFirst) {
      if (battle.ambush) {
        log(battle, 'You are ambushed while you sleep!');
      } else {
        log(battle, 'The ' + battle.monster.name + ' is faster and strikes first!');
      }
      monsterAct(battle);
    }

    return battle;
  }

  // ---------------- End checks ----------------

  function isOver(battle) {
    return battle.phase !== 'active';
  }

  function checkEnd(battle) {
    if (isOver(battle)) return true;
    if (battle.player.hitPoints <= 0) {
      battle.phase = 'lost';
      log(battle, 'You have been defeated...');
      onLoss(battle);
      return true;
    }
    if (battle.monster.hp <= 0) {
      battle.phase = 'won';
      log(battle, 'The ' + battle.monster.name + ' has been defeated!');
      onWin(battle);
      return true;
    }
    if (battle.monster.energy <= 0) {
      // archived: New_Player_Guide.md "If your opponent's energy bar depletes completely, they
      // will immediately escape from battle." Distinct 'monsterFled' phase with NO rewards —
      // the monster was not defeated, and only "If you win, you may get several things".
      battle.phase = 'monsterFled';
      log(battle, "The " + battle.monster.name + "'s energy is spent — it escapes from battle! You gain nothing.");
      // v1.3.1 fix 7: every other battle-end phase (win/loss/flee/cutoff-win) already ticks shrine
      // buffs down and persists (see the same call in onWin/onLoss/flee below) — monsterFled was
      // the one phase that skipped both, closing a player-favorable gap (a free battle-end that
      // cost a shrine buff none of its remaining battles, and could revert on a later un-persisted
      // reload).
      if (Game.World && Game.World.tickShrineBuffsOnBattleEnd) Game.World.tickShrineBuffsOnBattleEnd(battle.player);
      if (Game.persist) Game.persist();
      return true;
    }
    return false;
  }

  // ---------------- Statuses (invented simple effects; names archived in Version_2.1_Changes.md) ----------------

  function playerBuffDamageBonus(battle) {
    var bonus = 0;
    for (var i = 0; i < battle.playerStatuses.length; i++) {
      var st = battle.playerStatuses[i];
      // v1.4 P4 (G3): Rage's armor rider (below) reuses this exact same {type:'buff', name,
      // power, turnsLeft} shape but marks itself statKind:'armor' so it is picked up by
      // playerBuffArmorBonus() instead of being double-counted here as bonus Damage.
      if (st.type === 'buff' && st.statKind !== 'armor') bonus += st.power;
    }
    // Phase 4: Spirit Shrine "Battle Fervor" buff adds flat Damage for its remaining battles
    // (js/data/shrine.js), on top of any in-battle tech buffs above.
    if (Game.World && Game.World.shrineBonus) bonus += Game.World.shrineBonus(battle.player, 'damage');
    return bonus;
  }

  // v1.4 P4 (G3): Rage limit-break rider — flat +Armor for a few turns. Mirrors
  // playerBuffDamageBonus's shape exactly, but sums only the armor-flavored buff entries (see the
  // statKind check above) so a Rage buff never also inflates outgoing Damage.
  function playerBuffArmorBonus(battle) {
    var bonus = 0;
    for (var i = 0; i < battle.playerStatuses.length; i++) {
      var st = battle.playerStatuses[i];
      if (st.type === 'buff' && st.statKind === 'armor') bonus += st.power;
    }
    return bonus;
  }

  // v1.2 Phase 1 item 8 (Curse): true while any 'curse' entry is active among the player's
  // per-battle statuses. NAME [archived] Version_2.1_Changes.md; effect/numbers [invented] — see
  // balance.js CURSE_* comment.
  function playerCurseActive(battle) {
    for (var i = 0; i < battle.playerStatuses.length; i++) {
      if (battle.playerStatuses[i].type === 'curse') return true;
    }
    return false;
  }

  function playerCurseMultiplier(battle) {
    return playerCurseActive(battle) ? BALANCE.CURSE_DAMAGE_MULT : 1;
  }

  // v1.4 P3 (G2): true while any 'poison' entry is active — mirrors playerCurseActive above.
  // Used by the Venomous champion affix so it never stacks a second poison instance.
  function playerPoisoned(battle) {
    for (var i = 0; i < battle.playerStatuses.length; i++) {
      if (battle.playerStatuses[i].type === 'poison') return true;
    }
    return false;
  }

  // Shared application helpers (single definition point for both status pushes) — used by the
  // existing tech-poisonChance/monster-curseChance paths below AND by the new v1.4 P3 (G2)
  // Venomous affix / boss 'curse' script effect, so every caller applies the identical shape.
  function applyPlayerPoison(battle) {
    battle.playerStatuses.push({ type: 'poison', name: 'Poison', turnsLeft: BALANCE.POISON_DURATION_TURNS });
  }

  function applyPlayerCurse(battle) {
    battle.playerStatuses.push({ type: 'curse', name: 'Curse', turnsLeft: BALANCE.CURSE_DURATION });
  }

  // v1.5 P4 (docs/SPEC-TIER3-EXPANSION.md §3a, D4): the Conjurer's Summon Elemental always
  // auto-attunes to the enemy's WEAKEST Anima grade (lowest resistance multiplier — negative
  // values are vulnerabilities, so a vulnerability always wins over an unlisted/neutral grade at
  // 0) so the servitor is always effective, mirroring the archived "align to the enemy's
  // weakness" grade game. Ties resolve to whichever grade sorts first below (arbitrary — spec:
  // "ties -> any"). A monster with no resistances at all (or none of the seven listed grades)
  // naturally falls through to the fixed default 'Fire' (spec D4), since every grade then reads
  // 0 and Fire is checked first.
  var SERVITOR_GRADES = ['Fire', 'Water', 'Wind', 'Earth', 'Star', 'Light', 'Dark']; // archived Anima-grade roster, DESIGN.md §5
  function pickWeaknessGrade(monster) {
    var res = (monster && monster.resistances) || {};
    var best = 'Fire';
    var bestVal = null;
    for (var i = 0; i < SERVITOR_GRADES.length; i++) {
      var g = SERVITOR_GRADES[i];
      var val = typeof res[g] === 'number' ? res[g] : 0;
      if (bestVal === null || val < bestVal) {
        bestVal = val;
        best = g;
      }
    }
    return best;
  }

  // Ticks the monster's per-battle statuses (currently only the Conjurer's 'servitor' rider) once
  // per round, mirroring tickPlayerStatuses below exactly but on the OTHER side of the fight.
  // v1.5 P4 (docs/SPEC-TIER3-EXPANSION.md §3a): the servitor is NOT a second combatant — no HP,
  // never targeted, and this function never calls monsterAct, so it can never grant the monster an
  // extra action. Its damage routes through the SAME variance/grade-resistance/Magic-Armor
  // mitigation pipeline as any other graded tech hit (guardrail: "no unmitigated 'true' tick"),
  // including Fear and Curse — the servitor reads the caster's own Anima the same way a live cast
  // would, so it cannot be used to bypass either debuff's discipline.
  function tickMonsterStatuses(battle) {
    if (isOver(battle)) return;
    var remaining = [];
    var statuses = battle.monster.statuses || [];
    for (var i = 0; i < statuses.length; i++) {
      var st = statuses[i];
      if (st.type === 'servitor' && battle.monster.hp > 0) {
        var fear = fearMultiplier(battle);
        var curseMult = playerCurseMultiplier(battle);
        var base = techEffectivePower(battle.player, { effect: 'damage', power: st.power }) * fear * curseMult;
        var glancing = rng() < BALANCE.GLANCING_CHANCE;
        var raw = rollVariance(base);
        if (glancing) raw *= BALANCE.GLANCING_MULT;
        raw = applyResistance(battle.monster, st.grade, raw);
        var dmg = Math.max(1, Math.round(raw - battle.monster.magicArmor));
        battle.monster.hp = Math.max(0, battle.monster.hp - dmg);
        log(battle, 'Your ' + st.name + ' strikes the ' + battle.monster.name + (glancing ? ' (glancing)' : '') + ' for ' + dmg + ' damage.');
      }
      st.turnsLeft -= 1;
      if (st.turnsLeft > 0) {
        remaining.push(st);
      } else if (st.type === 'servitor') {
        log(battle, 'Your Elemental Servitor fades away.');
      }
    }
    battle.monster.statuses = remaining;
    checkEnd(battle);
  }

  // Ticks the player's per-battle statuses (poison damage, buff duration) once per full round.
  function tickPlayerStatuses(battle) {
    if (isOver(battle)) return;
    var remaining = [];
    for (var i = 0; i < battle.playerStatuses.length; i++) {
      var st = battle.playerStatuses[i];
      if (st.type === 'poison') {
        battle.player.hitPoints = Math.max(0, battle.player.hitPoints - BALANCE.POISON_DAMAGE_PER_TURN);
        log(battle, 'Poison sears you for ' + BALANCE.POISON_DAMAGE_PER_TURN + ' damage.');
      }
      st.turnsLeft -= 1;
      if (st.turnsLeft > 0) {
        remaining.push(st);
      } else if (st.type === 'poison') {
        log(battle, 'The poison wears off.');
      } else if (st.type === 'buff') {
        log(battle, 'Your ' + st.name + ' fades.');
      } else if (st.type === 'curse') {
        log(battle, 'The curse lifts.');
      }
    }
    battle.playerStatuses = remaining;
    checkEnd(battle);
  }

  // ---------------- Monster action (counter after each player action) ----------------

  function monsterAct(battle) {
    if (isOver(battle)) return;
    var monster = battle.monster;
    // v1.4 P3 (G2) Frenzied champion affix: counts monster actions this battle (every action,
    // hit/dodged/tech/telegraph-wind-up alike) — tracked on the battle object, never the shared
    // monster def.
    battle.monsterActionsTaken = (battle.monsterActionsTaken || 0) + 1;

    // Feature C: Defend halves the damage of the monster's very next action, hit or dodged (or a
    // v1.5 telegraph wind-up below, which deals no damage at all) — then clears. Captured up front
    // (moved here unchanged from just before the old dodge-roll spot) so the wind-up branch, which
    // returns before that old capture point ever ran, still consumes any pending guard uniformly —
    // Defend always answers the monster's very next action, whatever it turns out to be.
    var defending = !!battle.playerDefending;
    battle.playerDefending = false;

    // v1.5 P2/P3 (docs/SPEC-V1.5-MONSTER-AI.md §3): archetype -> {windupChance, techChance}. ONE
    // interpreter, no per-monster branches. `behavior` absent/'simple' keeps today's AI exactly
    // (windupChance 0, the original 50% tech inclination). 'telegraph' adds the base wind-up
    // chance on top of that same 50% inclination. 'caster' adds the same wind-up chance but raises
    // tech inclination to CASTER_TECH_CHANCE (casts more, still can charge a heavy hit — the
    // charged release itself is untouched, it reuses the basic-attack pipeline exactly as
    // 'telegraph' does). 'enrage' keeps the 50% tech inclination but multiplies its wind-up chance
    // by ENRAGE_CHARGE_MULT while below ENRAGE_HP_FRAC of its own max HP (more frequent charged
    // hits in its death throes) — no new damage term, just a higher roll into the same charge path.
    // 'reactive' is telegraph-capable at the SAME base wind-up chance (50% tech inclination,
    // unchanged) — its distinguishing behavior is the charge-hold reaction below, not a different
    // windup/tech roll. 'guardian' leaves windupChance/techChance at their defaults entirely (it
    // never telegraphs — its behavior is the pre-action guard check below, not a charge at all).
    var windupChance = 0;
    var techChance = 0.5;
    if (monster.behavior === 'telegraph') {
      windupChance = BALANCE.TELEGRAPH_CHARGE_CHANCE;
    } else if (monster.behavior === 'caster') {
      windupChance = BALANCE.TELEGRAPH_CHARGE_CHANCE;
      techChance = BALANCE.CASTER_TECH_CHANCE;
    } else if (monster.behavior === 'enrage') {
      windupChance = BALANCE.TELEGRAPH_CHARGE_CHANCE;
      if (monster.hp / monster.hpMax < BALANCE.ENRAGE_HP_FRAC) windupChance *= BALANCE.ENRAGE_CHARGE_MULT;
    } else if (monster.behavior === 'reactive') {
      windupChance = BALANCE.TELEGRAPH_CHARGE_CHANCE;
    }

    // v1.5 P1 (docs/SPEC-V1.5-MONSTER-AI.md §2, §2a): telegraph wind-up/release. A charge already
    // pending from a previous turn always releases THIS turn — checked first, so no fresh wind-up
    // roll happens while one is already charging. `behavior` absent/'simple' (windupChance 0) never
    // reaches the wind-up branch at all (today's AI, unchanged).
    var releasing = !!battle.charge;
    var chargeMult = 1;

    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §3 'reactive'): the archived "intelligent reactions
    // based on hero actions" — when a pending charge would release THIS turn and the player
    // Defended this same turn (the `defending` local captured at the very top of this function),
    // a reactive monster HOLDS the charge instead of releasing into the guard, up to
    // REACTIVE_MAX_CHARGE_DELAYS times per charge (so a player cannot Defend-stall a charge
    // forever — past the cap it releases anyway, still subject to that turn's Defend halving via
    // the ordinary `defending` path below). A no-damage hold: costs the monster's turn exactly
    // like a wind-up does, no rng roll (a deterministic read of the player's own action, not a
    // proc). Checked BEFORE the `releasing` branch below so a held charge is never also cleared by
    // it in the same turn.
    if (releasing && monster.behavior === 'reactive' && defending &&
      (battle.charge.delays || 0) < BALANCE.REACTIVE_MAX_CHARGE_DELAYS) {
      battle.charge.delays = (battle.charge.delays || 0) + 1;
      log(battle, 'The ' + monster.name + ' holds its charge, watching your guard.');
      checkEnd(battle);
      return;
    }

    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §3 'guardian'): the mirror of the player's own Defend
    // — before the normal action choice, a guardian monster may guard itself instead of acting:
    // costs its turn, deals no damage, spends no energy, exactly like the player's Defend costs
    // theirs. windupChance is 0 for guardian (never telegraphs, see above), so `releasing` is
    // always false here for it; this check still sits behind `!releasing` defensively in case a
    // future archetype combination ever sets both.
    if (monster.behavior === 'guardian' && !releasing && rng() < BALANCE.GUARDIAN_CHANCE) {
      battle.monsterGuard = true; // battle-transient only, never the shared def, never persisted
      log(battle, 'The ' + monster.name + ' raises its guard!');
      checkEnd(battle);
      return;
    }

    if (releasing) {
      chargeMult = battle.charge.mult;
      battle.charge = null;
    } else if (windupChance > 0 && rng() < windupChance) {
      // Wind up instead of acting: no damage, no energy spent — but it still counts as the
      // monster's turn (monsterActionsTaken already incremented above). battle.charge lives only
      // on the battle object (never the shared monster def, never persisted) — same discipline as
      // the Frenzied affix's monsterActionsTaken counter.
      battle.charge = { mult: BALANCE.AFFIX_CHARGED_MULT };
      log(battle, 'The ' + monster.name + ' rears back, gathering force!');
      checkEnd(battle);
      return;
    }

    // Choose action: a known monster tech (techChance inclination, computed above per archetype)
    // if affordable, else basic attack. A releasing charge always takes the basic-attack path
    // below (no tech roll) — it reuses that exact pipeline verbatim, with `chargeMult` applied to
    // `base` further down (do NOT fork the pipeline — docs/SPEC-V1.5-MONSTER-AI.md §2).
    var usedTech = null;
    if (!releasing) {
      var affordable = [];
      var list = monster.techs || [];
      for (var i = 0; i < list.length; i++) {
        var t = getTech(list[i]);
        if (t && t.energyCost <= monster.energy) affordable.push(t);
      }
      if (affordable.length > 0 && rng() < techChance) {
        usedTech = affordable[Math.floor(rng() * affordable.length)];
      }
    }

    // Energy: monster attacks also cost monster energy (spec). Basic attacks — including a
    // charged release, which is a basic attack — cost the reduced monster rate (see BALANCE.
    // MONSTER_ATTACK_ENERGY_COST); techs cost their listed energyCost.
    var cost = usedTech ? usedTech.energyCost : BALANCE.MONSTER_ATTACK_ENERGY_COST;
    monster.energy = Math.max(0, monster.energy - cost);

    // Player dodge roll (Dodge skill + Dex). v1.2 Phase 1 item 3: a successful dodge grants Dodge
    // skill XP at the proc site (use-based skill system; addSkillXp already enforces the 2L+1 cap).
    if (rng() < playerDodgeChance(battle.player)) {
      log(battle, 'You dodge the ' + monster.name + "'s " + (releasing ? 'charged blow' : (usedTech ? usedTech.name : 'attack')) + '!');
      Game.Character.addSkillXp(battle.player, 'Dodge', BALANCE.DODGE_SKILL_XP_PER_PROC);
      checkEnd(battle);
      return;
    }

    var base = usedTech ? usedTech.power : monster.damage;
    // v1.5 P1: a charged release = normal basic-attack damage x AFFIX_CHARGED_MULT, applied to
    // `base` BEFORE the rest of this pipeline (variance/glancing/mitigation/Fear/defending) below —
    // reuses it verbatim, same as every other action.
    if (releasing) base *= chargeMult;
    // v1.4 P3 (G2) Frenzied champion affix: escalating +5%/action, capped +40% (LOCKED by the P0
    // sim — docs/SPEC-V1.4-GAMEPLAY.md P0 RESULTS item 2; the uncapped version broke the >=85% win
    // floor at L90/100). Applies to the raw base power, upstream of the same variance/glancing/
    // mitigation pipeline every other action already uses.
    if (monster.affix === 'frenzied') {
      var frenzyMult = 1 + Math.min(BALANCE.AFFIX_FRENZIED_RATE * battle.monsterActionsTaken, BALANCE.AFFIX_FRENZIED_CAP);
      base = Math.round(base * frenzyMult);
    }
    var glancing = rng() < BALANCE.GLANCING_CHANCE;
    var raw = rollVariance(base);
    if (glancing) raw *= BALANCE.GLANCING_MULT;

    // Armor mitigates physical hits; Magic Armor mitigates graded tech hits (DESIGN.md §4).
    // Fear also weakens the player's defensive stat-derived numbers (Fear.md: "lower your
    // stats by 10% for each level").
    var fear = fearMultiplier(battle);
    // v1.4 P4 (G3): a Rage limit-break buff (playerBuffArmorBonus) adds flat Armor on top of the
    // character's own Armor stat, same as every other physical-mitigation term here — Fear reduces
    // it identically (Fear.md: "lower your stats by 10% for each level"), it never touches Magic
    // Armor mitigation (Rage grants Armor, not Magic Armor).
    var mitigation = (usedTech && usedTech.grade)
      ? Game.Character.getMagicArmor(battle.player) * fear
      : (Game.Character.getArmor(battle.player) + playerBuffArmorBonus(battle)) * fear;
    // [invented] v1.6 P1 (CB-1, SPEC-V1.6-REBALANCE.md §6): penetration floor, DEFENSIVE-ONLY (this
    // is the monster->player hit site) — a hit always deals at least round(raw*FLOOR) regardless of
    // armor, applied BEFORE Defend halving. LOCKED by the P0 sim gate; deliberately NOT applied to
    // any player->monster damage site (attack()/useTech()/limitBreak() keep the plain
    // max(1, raw-mitigation) form) — see balance.js DAMAGE_PENETRATION_FLOOR comment for why this
    // is one-directional.
    var dmg = Math.max(1, Math.round(raw * BALANCE.DAMAGE_PENETRATION_FLOOR), Math.round(raw - mitigation));
    if (defending) dmg = Math.max(1, Math.round(dmg * BALANCE.DEFEND_DAMAGE_MULT));

    battle.player.hitPoints = Math.max(0, battle.player.hitPoints - dmg);
    log(battle, (releasing ? 'The ' + monster.name + ' unleashes its charged blow' : monster.name + (usedTech ? ' uses ' + usedTech.name : ' attacks')) +
      (glancing ? ' — a glancing blow —' : '') + ' for ' + dmg + ' damage.');

    // v1.4 P3 (G2) Vampiric champion affix: heals the monster for 25% of the damage it just dealt
    // (post-mitigation), capped at its own hpMax. LOCKED by the P0 sim (docs/SPEC-V1.4-GAMEPLAY.md
    // P0 RESULTS item 2).
    if (monster.affix === 'vampiric') {
      var vampiricHeal = Math.round(dmg * BALANCE.AFFIX_VAMPIRIC_LEECH);
      if (vampiricHeal > 0) {
        monster.hp = Math.min(monster.hpMax, monster.hp + vampiricHeal);
        log(battle, 'The ' + monster.name + ' drinks your blood, healing ' + vampiricHeal + ' HP!');
      }
    }

    // Record armor slots worn while being hit, for post-battle armor-skill XP.
    var slots = Game.Inventory.EQUIP_SLOTS;
    for (var s = 0; s < slots.length; s++) {
      var slot = slots[s];
      if (slot === 'weapon') continue;
      if (battle.player.equipment[slot]) battle.hitWhileWearingArmor[slot] = true;
    }

    // On-hit poison from certain monster techs (e.g. Gnawing Bite).
    if (usedTech && usedTech.poisonChance && rng() < usedTech.poisonChance) {
      applyPlayerPoison(battle);
      log(battle, 'You are poisoned!');
    }

    // v1.4 P3 (G2) Venomous champion affix: each successful monster BASIC attack (not techs — a
    // tech that already carries its own poisonChance is unaffected) has a chance to poison the
    // player, but never stacks a second poison instance. LOCKED by the P0 sim
    // (docs/SPEC-V1.4-GAMEPLAY.md P0 RESULTS item 2): 35% on-hit.
    if (!usedTech && monster.affix === 'venomous' && !playerPoisoned(battle) && rng() < BALANCE.AFFIX_VENOMOUS_CHANCE) {
      applyPlayerPoison(battle);
      log(battle, 'The venom takes hold — you are poisoned!');
    }

    // v1.2 Phase 1 item 8: Curse status — a monster-level `curseChance` field (analogous to a
    // tech's poisonChance) rolled on any successful hit, basic attack or tech alike (unlike
    // Poison, which is tied to specific monster techs). Battle-scoped debuff; see
    // playerCurseActive/playerCurseMultiplier below for the outgoing-damage halving.
    if (monster.curseChance && rng() < monster.curseChance) {
      applyPlayerCurse(battle);
      log(battle, 'A creeping curse settles over you!');
    }

    checkEnd(battle);
  }

  // ---------------- Boss scripts (data-driven; docs/SPEC-V1.4-GAMEPLAY.md §4 G2) ----------------
  // ONE interpreter for every scripted boss — no per-boss code branches (the explicit §7 guardrail
  // / scope-creep-magnet warning). js/data/monsters.js gives a boss a
  // `script: [{ atHpFrac, effect, amount, log }, ...]` array; each entry fires exactly once, the
  // first time the monster's HP fraction drops to or below atHpFrac, checked here — after the
  // player's action has resolved and the battle confirmed still active, but before the monster's
  // own counter-attack, so e.g. an 'enrage' entry is already in effect for that very counter.
  // `entry.fired` is set on the battle-transient monster COPY (deepCopyMonster above deep-clones
  // the def via JSON.parse(JSON.stringify(...)), so this never mutates the shared monsters.js def).
  function runBossScript(battle) {
    var monster = battle.monster;
    var script = monster.script;
    if (!script || !script.length) return;
    for (var i = 0; i < script.length; i++) {
      var entry = script[i];
      if (entry.fired) continue;
      if (monster.hp / monster.hpMax > entry.atHpFrac) continue;
      entry.fired = true;
      if (entry.effect === 'enrage') {
        monster.damage = Math.round(monster.damage * entry.amount);
      } else if (entry.effect === 'heal') {
        monster.hp = Math.min(monster.hpMax, monster.hp + Math.round(monster.hpMax * entry.amount));
      } else if (entry.effect === 'curse') {
        applyPlayerCurse(battle);
      } else if (entry.effect === 'fortify') {
        monster.armor += entry.amount;
      }
      log(battle, entry.log);
    }
  }

  // Runs the monster counter + end-of-round status ticks after a player action, unless the
  // battle already ended. Boss scripts (above) are checked first so a threshold crossed by the
  // player's own action can affect the monster's counter-attack that follows in the same round.
  function finishRound(battle) {
    if (isOver(battle)) return;
    runBossScript(battle);
    monsterAct(battle);
    tickPlayerStatuses(battle);
    // v1.5 P4 (docs/SPEC-TIER3-EXPANSION.md §3a): the Conjurer's Elemental Servitor tick, same
    // round-resolution slot as the player-status tick just above it.
    tickMonsterStatuses(battle);
  }

  // ---------------- Player actions ----------------

  // archived: Energy.md — "When you have insufficient energy to attack or perform another
  // action, you may only end the battle by dying or by fleeing."
  function canAct(battle) {
    return battle && !isOver(battle) && battle.player.energy > 0;
  }

  // v1.5 P1 (docs/SPEC-V1.5-MONSTER-AI.md §2a): Interrupt — the offensive answer to a monster's
  // telegraph wind-up. Call sites (attack(), useTech()'s damage/drain branch, limitBreak()) invoke
  // this AFTER the player's damage for that action has fully resolved (all hits/rounds summed into
  // `dealtDamage`). A Limit Break always interrupts regardless of its own damage (even a dodged
  // one); any other action needs to clear INTERRUPT_THRESHOLD_HP_FRAC of the monster's OWN max HP.
  // Below threshold, battle.charge is left UNTOUCHED — it releases in full on the monster's very
  // next turn (the player gambled on the burst check and lost the window). A no-op whenever no
  // charge is pending, so it is safe to call unconditionally after every damaging player action.
  function tryInterruptCharge(battle, dealtDamage, isLimitBreak) {
    if (!battle.charge) return;
    var threshold = Math.round(battle.monster.hpMax * BALANCE.INTERRUPT_THRESHOLD_HP_FRAC);
    if (isLimitBreak || dealtDamage >= threshold) {
      battle.charge = null;
      log(battle, "The " + battle.monster.name + "'s charge collapses!");
    }
  }

  function attack() {
    var battle = Game.state.battle;
    if (!battle || isOver(battle)) return battle;
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §3 'guardian'): snapshot+clear any pending monster
    // guard right at the top, mirroring monsterAct's own `defending` capture exactly — the guard
    // answers whatever the player's very next action in this function turns out to be.
    var guarding = battle.monsterGuard;
    battle.monsterGuard = false;
    if (!canAct(battle)) {
      log(battle, 'You are out of Energy — you can only flee or fall.');
      return battle;
    }
    // archived: New_Player_Guide.md "You may not attack an enemy without a weapon equipped."
    if (!battle.player.equipment.weapon) {
      log(battle, 'You have no weapon equipped and cannot attack.');
      return battle;
    }

    battle.player.energy = Math.max(0, battle.player.energy - BALANCE.ATTACK_ENERGY_COST);
    battle.attackedThisBattle = true;

    var fear = fearMultiplier(battle);
    // v1.2 Phase 1 item 8: Curse reduces outgoing damage by 25% (attacks AND techs) while active.
    var curseMult = playerCurseMultiplier(battle);
    var baseDamage = (Game.Character.getDamage(battle.player) + playerBuffDamageBonus(battle)) * fear * curseMult;

    var doubleAttack = rng() < playerDoubleAttackChance(battle.player);
    var hits = doubleAttack ? 2 : 1;
    if (doubleAttack) {
      log(battle, 'Double attack!');
      // v1.2 Phase 1 item 3: a Double Attack proc grants Double Attack skill XP at the proc site.
      Game.Character.addSkillXp(battle.player, 'Double Attack', BALANCE.DOUBLE_ATTACK_SKILL_XP_PER_PROC);
    }

    // v1.5 P1: sums every hit this action lands (main hit(s) + the dual-wield offhand swing below)
    // so tryInterruptCharge (called once, after all of this action's damage has resolved) checks
    // the ACTION's total against the interrupt threshold, not any single swing in isolation.
    var totalDmgDealt = 0;
    for (var i = 0; i < hits; i++) {
      if (battle.monster.hp <= 0) break;
      if (rng() < monsterDodgeChance(battle.monster)) {
        log(battle, 'The ' + battle.monster.name + ' dodges your attack!');
        continue;
      }
      var glancing = rng() < BALANCE.GLANCING_CHANCE;
      var raw = rollVariance(baseDamage);
      if (glancing) raw *= BALANCE.GLANCING_MULT;
      var dmg = Math.max(1, Math.round(raw - battle.monster.armor));
      // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §3 'guardian'): a pending guard halves THIS action's
      // final damage-to-monster, floored at 1 — mirrors the player's own Defend halving exactly.
      if (guarding) dmg = Math.max(1, Math.round(dmg * (1 - BALANCE.GUARDIAN_REDUCTION)));
      battle.monster.hp = Math.max(0, battle.monster.hp - dmg);
      totalDmgDealt += dmg;
      log(battle, 'You strike the ' + battle.monster.name + (glancing ? ' with a glancing blow' : '') + ' for ' + dmg + ' damage.' + (guarding ? ' (blunted by the guard)' : ''));
    }

    // v1.2 Phase 1 item 5 (Dual Wield): when BOTH the weapon and offhand slots hold a weapon
    // (an offhand Shield has no `.damage` field, so it never triggers this), the basic Attack
    // makes one extra offhand swing after the main hit(s), through the same variance/glancing/
    // fear/armor pipeline, rolling the monster's dodge independently. Dual Wield skill gains XP
    // per swing (use-based skill system).
    if (battle.monster.hp > 0) {
      var offhandItemId = battle.player.equipment.offhand;
      var offhandItem = offhandItemId ? Game.Inventory.getItem(offhandItemId) : null;
      var dualWielding = !!(battle.player.equipment.weapon && offhandItem && offhandItem.damage !== undefined);
      if (dualWielding) {
        var dwSkillLevel = (battle.player.skills['Dual Wield'] && battle.player.skills['Dual Wield'].level) || 0;
        var dwMult = Math.min(
          BALANCE.DUAL_WIELD_OFFHAND_MULT_BASE + BALANCE.DUAL_WIELD_OFFHAND_MULT_PER_LEVEL * dwSkillLevel,
          BALANCE.DUAL_WIELD_OFFHAND_MULT_CAP
        );
        var offhandBase = (Game.Character.getOffhandDamage(battle.player) + playerBuffDamageBonus(battle)) * fear * curseMult * dwMult;
        if (rng() < monsterDodgeChance(battle.monster)) {
          log(battle, 'The ' + battle.monster.name + ' dodges your offhand strike!');
        } else {
          var glancingOff = rng() < BALANCE.GLANCING_CHANCE;
          var rawOff = rollVariance(offhandBase);
          if (glancingOff) rawOff *= BALANCE.GLANCING_MULT;
          var dmgOff = Math.max(1, Math.round(rawOff - battle.monster.armor));
          // v1.5 P3 ('guardian'): the offhand swing is part of the SAME player action, so it is
          // reduced by the same pending guard as the main hit(s) above.
          if (guarding) dmgOff = Math.max(1, Math.round(dmgOff * (1 - BALANCE.GUARDIAN_REDUCTION)));
          battle.monster.hp = Math.max(0, battle.monster.hp - dmgOff);
          totalDmgDealt += dmgOff;
          log(battle, 'Your offhand strikes the ' + battle.monster.name + (glancingOff ? ' with a glancing blow' : '') + ' for ' + dmgOff + ' damage.' + (guarding ? ' (blunted by the guard)' : ''));
        }
        Game.Character.addSkillXp(battle.player, 'Dual Wield', 1);
      }
    }

    // v1.5 P1 (docs/SPEC-V1.5-MONSTER-AI.md §2a): Interrupt check — a no-op unless a telegraph
    // charge is pending.
    tryInterruptCharge(battle, totalDmgDealt, false);

    if (checkEnd(battle)) return battle;
    finishRound(battle);
    return battle;
  }

  function isTechEquipped(c, techId) {
    if (!c.techSets) return false;
    for (var s = 0; s < c.techSets.length; s++) {
      var set = c.techSets[s] || [];
      for (var i = 0; i < set.length; i++) {
        if (set[i] === techId) return true;
      }
    }
    return false;
  }

  // v1.6 P1 (CB-4, SPEC-V1.6-REBALANCE.md §6): true while a Rod is the character's equipped
  // weapon — shared by techEffectivePower's rod spell-power bonus and useTech's rod tech energy
  // discount, so the guarded Game.Inventory lookup lives in one place. Rods carry a caster
  // identity (spell focus), not a plain melee weapon.
  function isRodEquipped(c) {
    var weaponId = c.equipment && c.equipment.weapon;
    var weapon = (weaponId && Game.Inventory && Game.Inventory.getItem) ? Game.Inventory.getItem(weaponId) : null;
    return !!(weapon && weapon.skill === 'Rods');
  }

  // v1.6 P1 (CB-4, SPEC-V1.6-REBALANCE.md §6): the Energy cost useTech actually charges for a
  // given tech — OFFENSIVE techs (damage/drain) cost less while a Rod is equipped (heal/buff/
  // summon are untouched). Takes a bare character, not a battle, so the Techs screen (out of
  // battle) and the in-battle tech grid (js/ui/screens.js) can show the SAME number this will
  // actually charge, rather than duplicating the formula.
  function effectiveTechEnergyCost(c, tech) {
    var offensiveTech = (tech.effect === 'damage' || tech.effect === 'drain');
    return (offensiveTech && isRodEquipped(c))
      ? Math.round(tech.energyCost * (1 - BALANCE.ROD_TECH_ENERGY_DISCOUNT))
      : tech.energyCost;
  }

  // invented: Intelligence spell factors (DESIGN.md §4 "Intelligence factors spell damage";
  // Recent_Updates.md 2007-08-02). Also used by the Techs infobox "effective damage" display
  // (Version_2.1_Changes.md: "Tech dialog boxes show 'effective damage' which figures in
  // intelligence").
  function techEffectivePower(c, tech) {
    if (tech.effect === 'heal') {
      return Math.round(tech.power * (1 + c.intelligence * 0.01)); // invented: mild Int scaling for healing
    }
    if (tech.effect === 'buff') {
      return tech.power; // flat +damage
    }
    // v1.6 P1 (CB-2/CB-4, SPEC-V1.6-REBALANCE.md §6): offensive (damage/drain) spell power also
    // scales with the tech's governing magic-school skill level (parallels the weapon-skill damage
    // term in Game.Character.getDamage), and gets a flat bonus while a Rod is equipped (Rods are
    // the caster's weapon, CB-3/CB-4). Both LOCKED by the P0 sim gate.
    var skillLevel = tech.skill ? ((c.skills[tech.skill] || {}).level || 0) : 0;
    var magicSkillMult = 1 + Math.min(BALANCE.MAGIC_SKILL_DAMAGE_PER_LEVEL * skillLevel, BALANCE.MAGIC_SKILL_DAMAGE_CAP);
    var rodMult = isRodEquipped(c) ? (1 + BALANCE.ROD_SPELL_MULT) : 1;
    return Math.round(tech.power * (1 + c.intelligence * 0.02) * magicSkillMult * rodMult); // invented: Int spell-damage factor
  }

  function useTech(techId) {
    var battle = Game.state.battle;
    if (!battle || isOver(battle)) return battle;
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §3 'guardian'): snapshot+clear any pending monster
    // guard right at the top, same discipline as attack() above.
    var guarding = battle.monsterGuard;
    battle.monsterGuard = false;
    if (!canAct(battle)) {
      log(battle, 'You are out of Energy — you can only flee or fall.');
      return battle;
    }

    var tech = getTech(techId);
    if (!tech || tech.monsterOnly) {
      log(battle, 'Unknown technique.');
      return battle;
    }
    // Must be slotted in one of the equipped sets (Techniques.md: "Before a technique can be
    // used in battle, it must first be added to your spell list").
    if (!isTechEquipped(battle.player, techId)) {
      log(battle, tech.name + ' is not equipped in any technique set.');
      return battle;
    }
    // Phase 6a: a classOnly tech (js/data/techs.js) may only be cast while its owning class is
    // currently active (Primary or Secondary) — single guarded check point, see
    // Game.Classes.isClassTechUsable's comment for why it lives here rather than inside
    // isTechEquipped.
    if (Game.Classes && !Game.Classes.isClassTechUsable(battle.player, tech)) {
      log(battle, tech.name + ' requires its class to be active.');
      return battle;
    }
    // Feature C: weapon techniques (js/data/techs.js `weaponTech: true`) need a weapon equipped,
    // same archived rule as attack() (New_Player_Guide.md: "You may not attack an enemy without a
    // weapon equipped."). Checked before the Energy deduction below, matching attack()'s ordering.
    if (tech.weaponTech && !battle.player.equipment.weapon) {
      log(battle, 'You have no weapon equipped and cannot use ' + tech.name + '.');
      return battle;
    }
    // v1.6 P1 (CB-4, SPEC-V1.6-REBALANCE.md §6): while a Rod is equipped, OFFENSIVE techs
    // (damage/drain only — heal/buff/summon keep full cost) cost less Energy, making casting
    // energy-competitive with a basic attack. Computed once (effectiveTechEnergyCost, shared with
    // the Techs/battle UI so displayed costs never disagree with what's actually charged) and used
    // for BOTH the affordability check below and the actual deduction further down. LOCKED by the
    // P0 sim gate.
    var effectiveEnergyCost = effectiveTechEnergyCost(battle.player, tech);
    if (battle.player.energy < effectiveEnergyCost) {
      log(battle, 'Not enough Energy to use ' + tech.name + '.');
      return battle;
    }
    // v1.2 Phase 3 (Content-B item 4): shard-cost enhancement techs. RULE [archived]
    // (reference/manual/Anima_Shards.md: shards "used when casting certain techniques that
    // bestow enhancements"); numbers [invented] (js/data/techs.js shardCost fields). Checked
    // BEFORE the Energy deduction below so a refusal spends neither Energy nor shards and applies
    // no buff — spends from the same c.animaShards balance Game.World.buyBuff already spends from
    // (js/core/world.js), no second RNG.
    if (tech.effect === 'buff' && tech.shardCost && battle.player.animaShards < tech.shardCost) {
      log(battle, 'You need ' + tech.shardCost + ' Anima Shards to cast ' + tech.name + ' (you have ' + battle.player.animaShards + ').');
      return battle;
    }

    battle.player.energy = Math.max(0, battle.player.energy - effectiveEnergyCost);
    if (tech.skill) battle.techsUsedThisBattle[tech.skill] = true;
    if (tech.effect === 'buff' && tech.shardCost) {
      battle.player.animaShards -= tech.shardCost;
    }

    if (tech.effect === 'heal') {
      // archived: Fear affects spell damage, NOT healing (Recent_Updates.md 2007-04-06).
      var healAmount = techEffectivePower(battle.player, tech);
      // Feature B: Haunting (user-directed mishap) halves magical/consumable healing received —
      // Inn rest is untouched (js/core/world.js innRest) since it's rest, not healing.
      if (Game.Character && Game.Character.hasAffliction && Game.Character.hasAffliction(battle.player, 'haunting')) {
        healAmount = Math.max(1, Math.round(healAmount * BALANCE.HAUNTING_HEAL_MULT));
      }
      battle.player.hitPoints = Math.min(battle.player.hitPointsMax, battle.player.hitPoints + healAmount);
      log(battle, 'You cast ' + tech.name + ' and recover ' + healAmount + ' HP.');
      // v1.2 Phase 1 item 8: an Abjuration tech carrying `clearsStatus: true` (js/data/techs.js
      // tech_mend_wounds_2) cleanses the player's detrimental battle-scoped statuses (Poison,
      // Curse) mid-battle — invented "cleanse" semantics per SPEC-V1.2.md Phase 1 #8.
      if (tech.clearsStatus) {
        var beforeStatusCount = battle.playerStatuses.length;
        battle.playerStatuses = battle.playerStatuses.filter(function (st) {
          return st.type !== 'poison' && st.type !== 'curse';
        });
        if (battle.playerStatuses.length < beforeStatusCount) {
          log(battle, 'The ' + tech.name + ' washes away your afflictions.');
        }
      }
    } else if (tech.effect === 'buff') {
      battle.playerStatuses.push({
        type: 'buff', name: tech.name, power: tech.power,
        turnsLeft: tech.buffDuration || 3
      });
      log(battle, 'You cast ' + tech.name + ' — Damage +' + tech.power + ' for ' + (tech.buffDuration || 3) + ' turns.');
    } else if (tech.effect === 'summon') {
      // v1.5 P4 (docs/SPEC-TIER3-EXPANSION.md §3a): the Conjurer's "Elemental Servitor" — NOT a
      // second combatant (the engine is strictly 1v1; archived dev quote, forum/t-449.md: "there
      // won't be summons in battle. It's just 1v1"). A persistent battle-transient DoT rider
      // stored on the ENEMY's own status list (battle.monster.statuses, already an empty array
      // from deepCopyMonster/start()), so it reuses the identical tick/removal machinery as a
      // player-side status — just ticked by tickMonsterStatuses (above) instead of
      // tickPlayerStatuses. Deals NO immediate damage here — only the round tick strikes. Grade
      // auto-picks the monster's own weakest Anima grade (pickWeaknessGrade, D4) so the Conjurer
      // needs no Fire/Water/Wind/Earth tech variants. One servitor at a time: re-summoning
      // REPLACES the existing entry rather than stacking a second (spec: "One servitor at a time").
      var servitorGrade = pickWeaknessGrade(battle.monster);
      battle.monster.statuses = (battle.monster.statuses || []).filter(function (st) {
        return st.type !== 'servitor';
      });
      battle.monster.statuses.push({
        type: 'servitor',
        name: 'Elemental Servitor',
        turnsLeft: tech.servitorTurns,
        power: tech.servitorPower,
        grade: servitorGrade
      });
      log(battle, 'You summon an Elemental Servitor, attuned to ' + servitorGrade + ' Anima — it will strike the ' + battle.monster.name + ' each round.');
    } else {
      // 'damage' | 'drain'
      // v1.4 P3 (G2) Warded champion affix: the FIRST hostile (damage/drain) tech the player
      // casts this battle is negated outright — Energy is already spent (deducted above), damage
      // is 0, and the one-shot flag never fires again this battle. Covers weaponTech AND magic
      // techs alike (both reach this branch — js/data/techs.js: `effect: 'damage'|'drain'` is the
      // shared shape). LOCKED by the P0 sim (docs/SPEC-V1.4-GAMEPLAY.md P0 RESULTS item 2 — spot-
      // checked against a caster build, not sim-gated on the melee-only fixture).
      if (battle.monster.affix === 'warded' && !battle.wardedTechUsed) {
        battle.wardedTechUsed = true;
        log(battle, 'The ward flares and swallows your technique!');
        if (checkEnd(battle)) return battle;
        finishRound(battle);
        return battle;
      }
      var fear = fearMultiplier(battle);
      // v1.2 Phase 1 item 8: Curse reduces outgoing damage by 25% (attacks AND techs) while active.
      var curseMult = playerCurseMultiplier(battle);
      // Phase 6a: Rogue class tech "Shadowstep Strike" resolves as multiple successive hits
      // (js/data/techs.js `hits: 2`) — invented mechanic, modeled as a simple repeat of the
      // same damage roll/resistance/mitigation pipeline used for a single-hit tech.
      var hitCount = tech.hits || 1;
      var haunted = !!(Game.Character && Game.Character.hasAffliction && Game.Character.hasAffliction(battle.player, 'haunting'));

      // v1.2 Phase 1 item 6: Intelligence spell hit/miss. RULE [archived] Recent_Updates.md
      // 2007-04-21 ("Your intelligence stat now decides whether your spell hits or misses");
      // numbers [invented] (balance.js INT_SPELL_HIT_*). Rolled ONCE per cast for non-weapon
      // offensive techs (damage/drain) — a miss still spends Energy but deals no damage/effect.
      // Weapon techs are physical and instead roll the monster's dodge per-hit below (like a
      // basic attack), not this Int check.
      if (!tech.weaponTech) {
        var hitChance = Math.max(BALANCE.INT_SPELL_HIT_MIN, Math.min(BALANCE.INT_SPELL_HIT_MAX,
          BALANCE.INT_SPELL_HIT_BASE + BALANCE.INT_SPELL_HIT_PER_INT * battle.player.intelligence -
          BALANCE.INT_SPELL_HIT_PER_MON_LEVEL * battle.monster.level));
        if (rng() >= hitChance) {
          log(battle, 'Your ' + tech.name + ' misses the ' + battle.monster.name + '!');
          if (checkEnd(battle)) return battle;
          finishRound(battle);
          return battle;
        }
      }

      // v1.5 P1: sums every hit this cast lands so tryInterruptCharge (below, after the loop)
      // checks the CAST's total against the interrupt threshold, not any single hit in isolation.
      var totalDmgDealt = 0;
      for (var h = 0; h < hitCount; h++) {
        if (battle.monster.hp <= 0) break;
        var base, mitigation;
        if (tech.weaponTech) {
          // Feature C (user-directed): weapon techniques scale off the wielded weapon's physical
          // Damage stat (Game.Character.getDamage), NOT the Intelligence spell factor
          // (techEffectivePower) used by magic-school techs. grade is always null for these, so
          // (regular) Armor mitigates, with armorPierce reducing the armor term first.
          // v1.2 Phase 1 item 6: weapon techs roll the monster's dodge per hit (like a basic
          // attack) rather than the Int hit/miss check above.
          if (rng() < monsterDodgeChance(battle.monster)) {
            log(battle, 'The ' + battle.monster.name + ' dodges your ' + tech.name + '!');
            continue;
          }
          base = Game.Character.getDamage(battle.player) * (tech.powerMult || 1) * fear * curseMult;
          mitigation = battle.monster.armor * (1 - (tech.armorPierce || 0));
        } else {
          base = techEffectivePower(battle.player, tech) * fear * curseMult;
          // v1.2 Phase 1 item 7: non-elemental damage ignores defense — RULE [archived] (DESIGN.md
          // §4 / 2005 note), adopted here: a grade:null tech's mitigation is 0 regardless of the
          // monster's Magic Armor; a graded (elemental) tech is still mitigated by it.
          mitigation = tech.grade ? battle.monster.magicArmor : 0;
        }
        var glancing = rng() < BALANCE.GLANCING_CHANCE;
        var raw = rollVariance(base);
        if (glancing) raw *= BALANCE.GLANCING_MULT;
        raw = applyResistance(battle.monster, tech.grade, raw);
        var dmg = Math.max(1, Math.round(raw - mitigation));
        // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §3 'guardian'): a pending guard halves THIS
        // action's final damage-to-monster per hit, floored at 1 (same as attack()'s main hit).
        if (guarding) dmg = Math.max(1, Math.round(dmg * (1 - BALANCE.GUARDIAN_REDUCTION)));
        battle.monster.hp = Math.max(0, battle.monster.hp - dmg);
        totalDmgDealt += dmg;
        log(battle, (tech.weaponTech ? 'You strike with ' : 'You cast ') + tech.name + (glancing ? ' (glancing)' : '') + ' for ' + dmg + ' damage.' + (guarding ? ' (blunted by the guard)' : ''));

        if (tech.effect === 'drain') {
          var drained = Math.round(dmg * 0.5); // invented: Absorption drains return half the damage as HP
          // Feature B: Haunting halves healing received, including Absorption drain returns.
          if (haunted) drained = Math.max(1, Math.round(drained * BALANCE.HAUNTING_HEAL_MULT));
          battle.player.hitPoints = Math.min(battle.player.hitPointsMax, battle.player.hitPoints + drained);
          log(battle, 'You absorb ' + drained + ' HP from the ' + battle.monster.name + '.');
        }
      }
      // v1.5 P1 (docs/SPEC-V1.5-MONSTER-AI.md §2a): Interrupt check — scoped to this damage/drain
      // branch only (a heal/buff cast never reaches here, so it can never accidentally interrupt
      // with a false dealtDamage=0 >= threshold read). A no-op unless a telegraph charge is pending.
      tryInterruptCharge(battle, totalDmgDealt, false);
    }

    if (checkEnd(battle)) return battle;
    finishRound(battle);
    return battle;
  }

  function useItem(itemId) {
    var battle = Game.state.battle;
    if (!battle || isOver(battle)) return battle;
    if (!canAct(battle)) {
      log(battle, 'You are out of Energy — you can only flee or fall.');
      return battle;
    }

    var item = Game.Inventory.getItem(itemId);
    if (!item || !item.combatUsable) {
      log(battle, 'That item cannot be used in combat.');
      return battle;
    }
    if (battle.player.inventory.indexOf(itemId) === -1) {
      log(battle, 'You do not have that item.');
      return battle;
    }

    battle.player.energy = Math.max(0, battle.player.energy - BALANCE.ATTACK_ENERGY_COST);

    if (item.heal) {
      // Healing is unaffected by Fear (same archived rule as healing techs).
      var itemHeal = item.heal;
      // Feature B: Haunting halves consumable healing received (potions etc.), same as tech healing.
      if (Game.Character && Game.Character.hasAffliction && Game.Character.hasAffliction(battle.player, 'haunting')) {
        itemHeal = Math.max(1, Math.round(itemHeal * BALANCE.HAUNTING_HEAL_MULT));
      }
      battle.player.hitPoints = Math.min(battle.player.hitPointsMax, battle.player.hitPoints + itemHeal);
      log(battle, 'You use ' + item.name + ' and recover ' + itemHeal + ' HP.');
    }
    if (item.energyRestore) {
      battle.player.energy = Math.min(battle.player.energyMax, battle.player.energy + item.energyRestore);
      log(battle, 'You use ' + item.name + ' and recover ' + item.energyRestore + ' Energy.');
    }

    // Consumed on use.
    var idx = battle.player.inventory.indexOf(itemId);
    battle.player.inventory.splice(idx, 1);

    if (checkEnd(battle)) return battle;
    finishRound(battle);
    return battle;
  }

  // Feature A: escape can fail (user-directed; see fleeChance above). Fleeing itself still costs
  // no Energy and is always attemptable regardless of the player's Energy total — it is the
  // escape hatch the archived Energy.md rule requires ("you may only end the battle by dying or
  // by fleeing"); FLEE_MIN keeps a real chance alive even at 0 Energy against a boss.
  function flee() {
    var battle = Game.state.battle;
    if (!battle || isOver(battle)) return battle;
    if (rng() < fleeChance(battle)) {
      battle.phase = 'fled';
      battle.player.fury = 0; // archived: Fury resets on flee (Recent_Updates.md 2007-08-11)
      log(battle, 'You escape from the battle. Your Fury fades.');
      // Phase 4: Spirit Shrine buffs tick down once per battle-end; win/loss/flee all count (spec).
      if (Game.World && Game.World.tickShrineBuffsOnBattleEnd) Game.World.tickShrineBuffsOnBattleEnd(battle.player);
      if (Game.persist) Game.persist();
      return battle;
    }
    // Failure (user-directed): Fury is NOT reset, the battle stays active, and the monster gets
    // its normal counter-attack via the same finishRound path every other action uses.
    log(battle, 'You fail to escape — the ' + battle.monster.name + ' blocks your path!');
    if (checkEnd(battle)) return battle;
    finishRound(battle);
    return battle;
  }

  // Feature C: Defend (user-directed universal battle action). Costs a flat Energy amount and
  // halves the damage of the monster's very next counter-attack (see monsterAct's `defending`
  // capture below) — the flag is consumed by that action whether it hits or is dodged, so
  // guarding does not "carry over" indefinitely. Poison and other per-round statuses tick
  // unhalved (tickPlayerStatuses is untouched by this flag).
  function defend() {
    var battle = Game.state.battle;
    if (!battle || isOver(battle)) return battle;
    if (!canAct(battle)) {
      log(battle, 'You are out of Energy — you can only flee or fall.');
      return battle;
    }
    if (battle.player.energy < BALANCE.DEFEND_ENERGY_COST) {
      log(battle, 'Not enough Energy to Defend.');
      return battle;
    }
    battle.player.energy = Math.max(0, battle.player.energy - BALANCE.DEFEND_ENERGY_COST);
    battle.playerDefending = true;
    log(battle, 'You brace behind your guard.');
    if (checkEnd(battle)) return battle;
    finishRound(battle);
    return battle;
  }

  // ---------------- Limit Breaks (v1.4 P4, G3 — docs/SPEC-V1.4-GAMEPLAY.md §5) ----------------
  // Names [archived] reference/forum/t-796.md (Rage, Dragon Kick, Hurricane Blow — MP-gated
  // specials in the 2005 engine); the P0 engine correction (spec §5) keys them off the SHIPPED
  // Fury mechanic instead of a per-battle gauge: c.fury is a cross-battle kill streak (+1 per
  // at-or-above-level kill in onWin below, resets on flee/death) that already persists on the
  // character — no save change needed. One Limit Break per class LINE (tier-1 base class), granted
  // implicitly by whichever base class the character obtained FIRST — no separate learning step,
  // no new character field.
  var LIMIT_BREAKS = {
    rage: { name: 'Rage' },
    dragon_kick: { name: 'Dragon Kick' },
    hurricane_blow: { name: 'Hurricane Blow' }
  };
  var LIMIT_BREAK_BY_BASE_CLASS = {
    warrior: 'rage',
    thief: 'dragon_kick',
    magician: 'hurricane_blow'
  };

  // Resolves which Limit Break (if any) a character's obtained classes grant, independent of any
  // live battle — js/ui/screens.js uses this to decide button VISIBILITY even before Fury is
  // charged. Game.Classes.baseClassIdsObtained(c) walks Object.keys(c.classes), which iterates in
  // INSERTION order for these string (non-array-index) keys, so bases[0] is genuinely the first
  // tier-1 base class the character ever obtained — "if a character somehow has multiple branches,
  // first obtained wins" (phase brief). A character with no base class at all gets null.
  function getLimitBreakId(c) {
    if (!c || !Game.Classes || !Game.Classes.baseClassIdsObtained) return null;
    var bases = Game.Classes.baseClassIdsObtained(c);
    if (!bases.length) return null;
    return LIMIT_BREAK_BY_BASE_CLASS[bases[0]] || null;
  }

  function getLimitBreak(c) {
    var lbId = getLimitBreakId(c);
    if (!lbId) return null;
    return { id: lbId, name: LIMIT_BREAKS[lbId].name };
  }

  // Consumes the character's ENTIRE Fury streak (sacrificing the +1%/tick XP bonus it was earning
  // on every future win of the streak — "a real tension, not a freebie", spec §5) for a class-line
  // special. Energy cost is 0 — the streak IS the cost. Damage runs the player's normal basic-
  // attack pipeline (same rollVariance/glancing/monster.armor mitigation path as attack()'s main
  // hit — no double-attack roll, no dual-wield offhand swing, those are separate features) with
  // the final number multiplied by BALANCE.LB_DAMAGE_MULT (LOCKED by the P0 sim, P0 RESULTS item
  // 3). Once per battle (battle.limitBreakUsed flag, mirrors battle.wardedTechUsed's one-shot
  // pattern above).
  function limitBreak() {
    var battle = Game.state.battle;
    if (!battle || isOver(battle)) return battle;
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §3 'guardian'): snapshot+clear any pending monster
    // guard right at the top, same discipline as attack()/useTech() above.
    var guarding = battle.monsterGuard;
    battle.monsterGuard = false;
    var c = battle.player;

    var lbId = getLimitBreakId(c);
    if (!lbId) {
      log(battle, 'You have no Limit Break to call on.');
      return battle;
    }
    if (battle.limitBreakUsed) {
      log(battle, 'You have already unleashed your Limit Break this battle.');
      return battle;
    }
    if ((c.fury || 0) < BALANCE.LB_FURY_MIN) {
      log(battle, 'Your Fury streak (' + (c.fury || 0) + ') is not yet strong enough for a Limit Break (needs ' + BALANCE.LB_FURY_MIN + ').');
      return battle;
    }
    // archived: New_Player_Guide.md "You may not attack an enemy without a weapon equipped." — the
    // Limit Break runs the same basic-attack damage pipeline as attack(), so it needs a weapon for
    // the same reason.
    if (!battle.player.equipment.weapon) {
      log(battle, 'You have no weapon equipped and cannot unleash a Limit Break.');
      return battle;
    }

    var lbDef = LIMIT_BREAKS[lbId];
    var streakSpent = c.fury;
    c.fury = 0; // consumes the ENTIRE streak, win or miss, hit or dodged
    battle.limitBreakUsed = true;
    battle.attackedThisBattle = true; // it's a weapon strike — counts for post-battle weapon-skill XP like attack()
    log(battle, 'You unleash ' + lbDef.name.toUpperCase() + '! (Fury streak of ' + streakSpent + ' spent)');

    var fear = fearMultiplier(battle);
    var curseMult = playerCurseMultiplier(battle);
    var baseDamage = (Game.Character.getDamage(battle.player) + playerBuffDamageBonus(battle)) * fear * curseMult;

    // Hurricane Blow (magician line): ignores the monster's dodge roll for this strike — auto-connects.
    var bypassDodge = (lbId === 'hurricane_blow');
    var lbDealtDmg = 0; // v1.5 P1: 0 when dodged — a Limit Break still always interrupts (below)
    if (!bypassDodge && rng() < monsterDodgeChance(battle.monster)) {
      log(battle, 'The ' + battle.monster.name + ' dodges your ' + lbDef.name + '!');
    } else {
      var glancing = rng() < BALANCE.GLANCING_CHANCE;
      var raw = rollVariance(baseDamage);
      if (glancing) raw *= BALANCE.GLANCING_MULT;
      raw *= BALANCE.LB_DAMAGE_MULT;
      var dmg = Math.max(1, Math.round(raw - battle.monster.armor));
      // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §3 'guardian'): a pending guard halves this Limit
      // Break's final damage-to-monster too, floored at 1 — "the whole next player action".
      if (guarding) dmg = Math.max(1, Math.round(dmg * (1 - BALANCE.GUARDIAN_REDUCTION)));
      battle.monster.hp = Math.max(0, battle.monster.hp - dmg);
      lbDealtDmg = dmg;
      log(battle, 'Your ' + lbDef.name + (glancing ? ' — a glancing blow —' : '') + ' slams into the ' + battle.monster.name + ' for ' + dmg + ' damage.' + (guarding ? ' (blunted by the guard)' : ''));
    }

    // v1.5 P1 (docs/SPEC-V1.5-MONSTER-AI.md §2a): a Limit Break ALWAYS interrupts a pending
    // telegraph charge, regardless of its own damage (isLimitBreak=true short-circuits the
    // threshold check in tryInterruptCharge) — even a dodged Limit Break still breaks the charge.
    // A no-op unless a charge is pending.
    tryInterruptCharge(battle, lbDealtDmg, true);

    // Flavor riders (spec §5: "deliberately TINY... not sim-gated, keep them cosmetic-scale").
    // Granted on USE, regardless of whether the strike above connected or was dodged.
    if (lbId === 'rage') {
      battle.playerStatuses.push({
        type: 'buff', name: 'Rage', statKind: 'armor',
        power: BALANCE.LB_RAGE_ARMOR_BONUS, turnsLeft: BALANCE.LB_RAGE_ARMOR_DURATION
      });
      log(battle, 'Rage hardens your guard — Armor +' + BALANCE.LB_RAGE_ARMOR_BONUS + ' for ' + BALANCE.LB_RAGE_ARMOR_DURATION + ' turns.');
    } else if (lbId === 'dragon_kick') {
      battle.monster.dodgeDebuff = (battle.monster.dodgeDebuff || 0) + BALANCE.LB_DRAGON_KICK_DODGE_DEBUFF;
      log(battle, 'Dragon Kick shatters the ' + battle.monster.name + "'s footing — its Dodge falters for the rest of the fight.");
    }

    if (checkEnd(battle)) return battle;
    finishRound(battle);
    return battle;
  }

  // v1.4 P3 (G2) Hoarder champion affix: combat-neutral — replaces the champion drop-chance
  // multiplier (BALANCE.CHAMPION_REWARD_MULT, x2) with BALANCE.AFFIX_HOARDER_DROP_MULT (x3) on
  // this kill's loot rolls only; xp/gold/AP premiums still use CHAMPION_REWARD_MULT untouched in
  // onWin below. LOCKED by the P0 sim (docs/SPEC-V1.4-GAMEPLAY.md P0 RESULTS item 2).
  function dropChanceMult(monster) {
    if (!monster.champion) return 1;
    return monster.affix === 'hoarder' ? BALANCE.AFFIX_HOARDER_DROP_MULT : BALANCE.CHAMPION_REWARD_MULT;
  }

  // ---------------- Win / loss resolution ----------------

  function onWin(battle) {
    var c = battle.player;
    var monster = battle.monster;

    c.monsterKills += 1; // archived: Monster_Kills.md counter

    // Phase 5: quest kill progress (DESIGN.md §7). Placed BEFORE the XP/loot cutoff early-return
    // below, so cutoff wins still count — a kill is a kill (phase spec), even when the monster
    // is too far beneath you to yield XP or loot.
    if (Game.Quests) Game.Quests.recordKill(monster.id);

    // Phase 6a: Legendary class unlock (DESIGN.md §3; js/data/classes.js
    // runeblade_of_kuraan.obtain). Also placed BEFORE the cutoff early-return — a boss kill that
    // meets the level gate unlocks the class even on a cutoff-beneath-level win (mirrors the
    // recordKill placement above: a kill is a kill). A kill below the required level does
    // nothing. v1.2 Phase 2: gate is now per-class (Game.Classes.isObtained), not the shared
    // c.legendaryUnlocked boolean — the roster grew to 3 Legendaries with independent unlock
    // routes (see js/core/classes.js header), so a second kill of the SAME boss still does
    // nothing (already obtained), but obtaining one Legendary no longer blocks another.
    if (Game.Classes) {
      (Game.Data.classes || []).forEach(function (classDef) {
        if (!classDef.legendary || !classDef.obtain || classDef.obtain.kind !== 'boss_kill') return;
        if (classDef.obtain.monsterId !== monster.id) return;
        if (c.level < classDef.obtain.minLevel) return;
        if (Game.Classes.isObtained(c, classDef.id)) return;
        c.legendaryUnlocked = true;
        Game.Classes.obtainClass(c, classDef.id);
        log(battle, 'The runes of a forgotten age answer your victory — you have obtained the Legendary ' + classDef.name + ' class!');
      });
    }

    var levelDiff = c.level - monster.level;
    // v1.3.1 fix 5: snapshot the level BEFORE Game.Character.addXp (below) can raise it, so the
    // Fury check further down judges the kill against the level the player fought at, not a level
    // reached mid-resolution by the very XP this kill grants.
    var levelBeforeXp = c.level;

    // v1.4 P2 (G1): Advantage Points — a kills-only currency, awarded on EVERY win, including a
    // 5-level-cutoff win ("a kill is a kill" — computed and credited BEFORE the cutoff
    // early-return below, same placement precedent as recordKill/the Legendary-class check
    // above). [archived] reference/forum/t-827.md; curve [invented], locked by the P0 sim
    // (docs/SPEC-V1.4-GAMEPLAY.md P0 RESULTS item 5). Champion/boss multipliers mirror the
    // existing CHAMPION_REWARD_MULT / boss xp x3 premium (same P0 line).
    var apMult = monster.champion ? BALANCE.AP_CHAMPION_MULT : (monster.boss ? BALANCE.AP_BOSS_MULT : 1);
    var apGain = Math.round(BALANCE.AP_PER_WIN(monster.level) * apMult);
    c.ap = (c.ap || 0) + apGain;

    // archived: Recent_Updates.md 2007-04-06 "The experience/loot cutoff for monsters is once
    // again 5 levels" — a monster 5+ levels below you yields nothing at all (no XP, skill XP,
    // gold, shards, or loot).
    if (levelDiff >= BALANCE.XP_LOOT_CUTOFF_LEVELS) {
      // v1.3.1 fix 2 [revised] (user-approved; docs/DESIGN.md §4): the loot cutoff above otherwise
      // permanently dead-ends any collect quest whose material source sits 5+ levels below the
      // quest's own accept level (verified: trials_of_eldor, vaultbreakers_reckoning, and 5 lesser
      // collect quests) — a kill that can NEVER drop its own quest material makes the quest
      // uncompletable forever. Quest-material items (id prefix 'quest_') still roll on the drop
      // table even under the cutoff; XP, gold, shards, and any NON-quest_ loot remain fully cut,
      // exactly as before. Same top-down first-hit-wins convention as the main loot roll below
      // (CLAUDE.md "Content conventions"); still routes through the single rng() stub.
      var cutoffLootId = null;
      var cutoffDrops = monster.drops || [];
      for (var cd = 0; cd < cutoffDrops.length; cd++) {
        if (rng() < cutoffDrops[cd].chance) {
          cutoffLootId = cutoffDrops[cd].itemId;
          break;
        }
      }
      if (cutoffLootId && cutoffLootId.indexOf('quest_') !== 0) cutoffLootId = null;
      battle.rewards = { xp: 0, gold: 0, shards: 0, skillXp: {}, loot: cutoffLootId, cutoff: true, ap: apGain };
      battle.pendingLoot = cutoffLootId;
      log(battle, 'The ' + monster.name + ' was far beneath your level. You gain nothing but ' + apGain + ' Advantage Points.');
      if (cutoffLootId) {
        var cutoffItem = Game.Inventory.getItem(cutoffLootId);
        log(battle, 'The ' + monster.name + ' dropped: ' + (cutoffItem ? cutoffItem.name : cutoffLootId) + '. Click Loot to claim it.');
      }
      if (Game.World && Game.World.tickShrineBuffsOnBattleEnd) Game.World.tickShrineBuffsOnBattleEnd(c);
      if (Game.persist) Game.persist();
      return;
    }

    // Combat XP with Fury bonus (archived: +1% per tick, Recent_Updates.md 2007-08-11).
    var furyBonus = 1 + (c.fury || 0) * BALANCE.FURY_XP_PER_TICK;
    // Enemy-variety pass: Champion encounters double XP/gold, guarantee the Anima Shard, and
    // double every drop chance (capped 0.95) — see balance.js CHAMPION_* comment.
    var championMult = monster.champion ? BALANCE.CHAMPION_REWARD_MULT : 1;
    var xpGain = Math.round(monster.xp * furyBonus * championMult);
    Game.Character.addXp(c, xpGain);

    // Phase 6a: Class XP, AFTER the cutoff check above (cutoff wins grant no class XP either —
    // phase brief). Primary gains the same amount as main combat XP; Secondary gains half
    // (Classes.md, DESIGN.md §3); a class with no slot assigned gains nothing.
    if (Game.Classes) Game.Classes.addClassXp(c, xpGain);

    // Gold in [goldMin, goldMax]. Phase 4: Spirit Shrine "Fortune's Favor" buff adds a
    // percentage bonus to gold from battle victories (js/data/shrine.js).
    var goldGain = monster.goldMin + Math.floor(rng() * (monster.goldMax - monster.goldMin + 1));
    var goldPctBonus = (Game.World && Game.World.shrineBonus) ? Game.World.shrineBonus(c, 'goldPct') : 0;
    // v1.1 revision: active-class "gold_pct" passives (e.g. Thief's Silver Tongue, Mercenary's
    // Quick Pockets — js/data/classes.js; js/core/classes.js classBonus).
    if (Game.Classes && Game.Classes.classBonus) goldPctBonus += Game.Classes.classBonus(c, 'gold_pct');
    goldGain = Math.round(goldGain * (1 + goldPctBonus) * championMult);
    Game.Character.addGold(c, goldGain);

    // v1.2 Phase 1 item 4: Thievery -> bonus gold on every win. invented (user-directed):
    // use-based skill system (SPEC-V1.2.md Phase 1 #4; BALANCE.THIEVERY_GOLD_PER_LEVEL/_CAP).
    var thieveryLevel = (c.skills['Thievery'] && c.skills['Thievery'].level) || 0;
    var thieveryGoldPct = Math.min(BALANCE.THIEVERY_GOLD_PER_LEVEL * thieveryLevel, BALANCE.THIEVERY_GOLD_CAP);
    var thieveryGoldGain = Math.floor(goldGain * thieveryGoldPct);
    if (thieveryGoldGain > 0) {
      Game.Character.addGold(c, thieveryGoldGain);
      log(battle, 'Your Thievery turns up an extra ' + thieveryGoldGain + ' gold.');
    }

    // Anima Shards by chance — a Champion guarantees the shard, skipping the roll entirely.
    var shardsGain = monster.champion ? 1 : (rng() < monster.shardChance ? 1 : 0);
    if (shardsGain) Game.Character.addShards(c, shardsGain);

    // Skill XP per use: declines when the player outlevels the monster (archived direction:
    // Recent_Updates.md 2007-04-21 "Skill experience now sharply declines when your level is
    // greater than your opponent's"), from SKILL_XP_PER_USE down to SKILL_XP_MIN_PER_USE at
    // the cutoff. Fury also boosts skill XP (archived: "+1% more combat and skill experience").
    var declineFactor = levelDiff > 0 ? Math.max(0, 1 - levelDiff / BALANCE.XP_LOOT_CUTOFF_LEVELS) : 1;
    var perUse = Math.max(
      BALANCE.SKILL_XP_MIN_PER_USE,
      Math.round(BALANCE.SKILL_XP_PER_USE * declineFactor * furyBonus)
    );

    var skillXpGranted = {};
    // v1.6 P1 (CB-2, SPEC-V1.6-REBALANCE.md §6): Intelligence speeds skill-XP gain for magic-
    // school skills AND Rods — [archived] reference/manual/Intelligence.md ("Increases the
    // Experience gained in ... Rods, Evocation, Conjuration, Alteration, Absorption, Abjuration"),
    // previously unimplemented. Weapon (Swords/Polearms/Knives/Hand to Hand) and armor skill-XP
    // below are UNAFFECTED — the multiplier only applies when the granted skill is in
    // MAGIC_XP_SKILLS (a Rod grants its skill-XP via the WEAPON-skill route below, since Rods is
    // c.equippedWeaponSkill when meleed with, so that loop needs the same check as the
    // magic-school loop). LOCKED by the P0 sim/calc gate.
    var intXpMult = 1 + c.intelligence * BALANCE.INT_SKILL_XP_PER_POINT;
    // Weapon skill, if the player attacked with a weapon this battle.
    if (battle.attackedThisBattle && c.equippedWeaponSkill) {
      var weaponPerUse = MAGIC_XP_SKILLS[c.equippedWeaponSkill]
        ? Math.max(1, Math.round(perUse * intXpMult))
        : perUse;
      Game.Character.addSkillXp(c, c.equippedWeaponSkill, weaponPerUse);
      skillXpGranted[c.equippedWeaponSkill] = weaponPerUse;
    }
    // Magic-school skills for each school of tech used.
    for (var school in battle.techsUsedThisBattle) {
      if (!Object.prototype.hasOwnProperty.call(battle.techsUsedThisBattle, school)) continue;
      var schoolPerUse = MAGIC_XP_SKILLS[school]
        ? Math.max(1, Math.round(perUse * intXpMult))
        : perUse;
      Game.Character.addSkillXp(c, school, schoolPerUse);
      skillXpGranted[school] = schoolPerUse;
    }
    // Armor skills worn while hit — foot armor excluded (archived: Recent_Updates.md
    // 2007-04-14 "Foot armor no longer contributes to skill experience").
    var armorSkillsSeen = {};
    for (var slot in battle.hitWhileWearingArmor) {
      if (!Object.prototype.hasOwnProperty.call(battle.hitWhileWearingArmor, slot)) continue;
      if (slot === 'feet') continue;
      var itemId = c.equipment[slot];
      var item = itemId ? Game.Inventory.getItem(itemId) : null;
      if (item && item.skill && ARMOR_SKILLS.indexOf(item.skill) !== -1 && !armorSkillsSeen[item.skill]) {
        armorSkillsSeen[item.skill] = true;
        Game.Character.addSkillXp(c, item.skill, perUse);
        skillXpGranted[item.skill] = perUse;
      }
    }

    // Loot roll -> pendingLoot, claimed via explicit Loot click (New_Player_Guide.md). A Champion
    // doubles every drop chance (capped 0.95) rather than granting a guaranteed drop outright.
    var lootId = null;
    var drops = monster.drops || [];
    for (var d = 0; d < drops.length; d++) {
      var dropChance = monster.champion ? Math.min(0.95, drops[d].chance * dropChanceMult(monster)) : drops[d].chance;
      if (rng() < dropChance) {
        lootId = drops[d].itemId;
        break;
      }
    }
    battle.pendingLoot = lootId;

    // v1.2 Phase 1 item 4: Thievery -> a steal roll. With probability min(THIEVERY_STEAL_PER_LEVEL
    // * lvl, THIEVERY_STEAL_CAP), take ONE extra roll of the monster's drop table (same top-down
    // first-hit-wins convention as the main loot roll above, CLAUDE.md "Content conventions") as
    // bonus pending loot, logged distinctly. Thievery gains skill XP on every (non-cutoff) win —
    // use-based skill system.
    var thieveryStealChance = Math.min(BALANCE.THIEVERY_STEAL_PER_LEVEL * thieveryLevel, BALANCE.THIEVERY_STEAL_CAP);
    var stolenId = null;
    if (thieveryStealChance > 0 && rng() < thieveryStealChance) {
      for (var sd = 0; sd < drops.length; sd++) {
        var stealDropChance = monster.champion ? Math.min(0.95, drops[sd].chance * dropChanceMult(monster)) : drops[sd].chance;
        if (rng() < stealDropChance) {
          stolenId = drops[sd].itemId;
          break;
        }
      }
    }
    battle.pendingStolenLoot = stolenId;
    if (stolenId) {
      var stolenItem = Game.Inventory.getItem(stolenId);
      log(battle, 'You lift an extra ' + (stolenItem ? stolenItem.name : stolenId) + ' from the ' + monster.name + '.');
    }
    Game.Character.addSkillXp(c, 'Thievery', 1);

    // Fury: +1 tick for kills at-or-above your level (archived: Recent_Updates.md 2007-08-11
    // "Kill monsters your level or above to charge the meter"). invented: a Champion kill counts
    // as one level higher for this check ONLY — Fear stays based on the monster's actual level
    // (fearLevels/fearMultiplier above are untouched by the champion flag).
    var furyEffectiveLevel = monster.champion ? monster.level + 1 : monster.level;
    // v1.3.1 fix 5: compare against levelBeforeXp (snapshotted above, BEFORE addXp could have
    // leveled the player up), not the live c.level — a kill that levels you up must still be judged
    // by the level you were when you fought it, not the level addXp already bumped you to.
    if (furyEffectiveLevel >= levelBeforeXp) {
      c.fury = (c.fury || 0) + 1;
    }

    battle.rewards = {
      xp: xpGain, gold: goldGain, shards: shardsGain,
      skillXp: skillXpGranted, loot: lootId, cutoff: false,
      thieveryGold: thieveryGoldGain, stolenLoot: stolenId, ap: apGain
    };

    log(battle, 'You gain ' + xpGain + ' experience, ' + goldGain + ' gold, and ' + apGain + ' Advantage Points.' +
      (shardsGain ? ' You find an Anima Shard!' : ''));
    if (lootId) {
      var lootItem = Game.Inventory.getItem(lootId);
      log(battle, 'The ' + monster.name + ' dropped: ' + (lootItem ? lootItem.name : lootId) + '. Click Loot to claim it.');
    }

    // Phase 4: Spirit Shrine buffs tick down once per battle-end; win/loss/flee all count (spec).
    if (Game.World && Game.World.tickShrineBuffsOnBattleEnd) Game.World.tickShrineBuffsOnBattleEnd(c);
    if (Game.persist) Game.persist();
  }

  // Feature B (revised, user-directed): death penalties — deliberately OVERRIDES the archived
  // no-loss rule (New_Player_Guide.md "you don't lose anything either"); see balance.js DEATH_*
  // comment for the full citation (precedent: two-tier classes). Both steps below route through
  // rng() in this exact order: gold loss is deterministic math (no roll), then a single mishap
  // roll, then (if the mishap is item-loss) a pool-pick roll — so a stubbed rng sequence for a
  // test only ever needs at most 2 values after the fight itself resolves.
  function onLoss(battle) {
    var c = battle.player;
    c.deaths += 1; // archived: Deaths.md counter
    c.fury = 0; // archived: Fury resets on death (Recent_Updates.md 2007-08-11)
    battle.rewards = null;
    battle.pendingLoot = null;
    battle.pendingStolenLoot = null;

    // (a) Gold loss: ceil(DEATH_GOLD_FRACTION * CARRIED gold) — carried only, vault untouched
    // (revised, user-directed; consistent with the camp-robbery precedent, BALANCE.CAMP_ROBBERY_*,
    // and the archived vault advice, forum/t-756.md). Game.World.spendGold only ever mutates
    // c.gold/c.platinum, never c.vault, so routing through it (rather than a hand-rolled copy)
    // keeps this in sync with every other carried-gold sink in the game.
    var carried = Game.Character.goldTotalAsGold(c);
    var goldLost = Math.ceil(carried * BALANCE.DEATH_GOLD_FRACTION); // revised (user-directed)
    if (goldLost > 0) {
      if (Game.World && Game.World.spendGold) {
        Game.World.spendGold(c, goldLost);
      } else {
        // Replicated carried-only spend logic (mirrors Game.World.spendGold), in case the world
        // module is ever unavailable — never touches c.vault.
        var remaining = carried - goldLost;
        c.platinum = Math.floor(remaining / BALANCE.GOLD_PER_PLATINUM);
        c.gold = remaining % BALANCE.GOLD_PER_PLATINUM;
      }
      log(battle, 'Grave-robbers strip ' + goldLost + ' gold from your fallen body! (Your Vault gold stays safe.)');
    }

    // (b) One mishap roll (revised, user-directed); on a hit, 50/50 between Haunting and losing
    // one random unequipped item where you fell. DEATH_MISHAP_CHANCE / the 50/50 split live in
    // balance.js.
    if (rng() < BALANCE.DEATH_MISHAP_CHANCE) {
      if (rng() < 0.5) {
        // Haunting: persistent affliction (js/core/character.js addAffliction) — halves
        // magical/consumable healing (potions, techs, camp recovery, Absorption drain returns)
        // until cleansed at a Spirit Shrine (js/core/world.js cleanseHaunting). No stacking:
        // addAffliction is a no-op if already haunted.
        var wasAlreadyHaunted = Game.Character && Game.Character.hasAffliction && Game.Character.hasAffliction(c, 'haunting');
        if (Game.Character && Game.Character.addAffliction) Game.Character.addAffliction(c, 'haunting');
        log(battle, wasAlreadyHaunted
          ? 'A cold presence stirs again as you fall, but you are already Haunted.'
          : 'A cold presence clings to you as you fall — you have been Haunted!');
      } else {
        // Item lost where you fell: one uniformly-random UNEQUIPPED inventory item, excluding
        // tags 'unique'/'lore' and ids prefixed 'quest_' (content convention: quest materials use
        // that prefix — see CLAUDE.md "Content conventions"). Equipped items live in c.equipment,
        // never c.inventory, so they are already excluded without special-casing. Empty pool ->
        // NO mishap at all (do NOT fall back to Haunting) — balance.js DEATH_MISHAP_CHANCE comment.
        var pool = [];
        for (var i = 0; i < c.inventory.length; i++) {
          var pItemId = c.inventory[i];
          var pItem = Game.Inventory ? Game.Inventory.getItem(pItemId) : null;
          if (!pItem) continue;
          if (pItem.tags && (pItem.tags.indexOf('unique') !== -1 || pItem.tags.indexOf('lore') !== -1)) continue;
          if (pItemId.indexOf('quest_') === 0) continue;
          pool.push(i);
        }
        if (pool.length > 0) {
          var pickIdx = pool[Math.floor(rng() * pool.length)];
          var lostId = c.inventory[pickIdx];
          var lostItem = Game.Inventory ? Game.Inventory.getItem(lostId) : null;
          c.inventory.splice(pickIdx, 1);
          log(battle, 'You lose your ' + (lostItem ? lostItem.name : lostId) + ' where you fell!');
        }
      }
    }

    // Phase 4: Spirit Shrine buffs tick down once per battle-end; win/loss/flee all count (spec).
    if (Game.World && Game.World.tickShrineBuffsOnBattleEnd) Game.World.tickShrineBuffsOnBattleEnd(c);
    // archived: New_Player_Guide.md "If you die, you get nothing from the battle" — the original
    // rule's "you don't lose anything either" half is deliberately overridden above (revised,
    // user-directed). HP stays at 0 while the defeat screen shows; the player is restored to 1 HP
    // when leaving the battle (endBattle below).
    if (Game.persist) Game.persist();
  }

  // Moves pendingLoot (and, if present, Thievery's pendingStolenLoot — v1.2 Phase 1 item 4) into
  // the inventory. Each is claimed independently; if over capacity, that item stays pending and
  // a message is returned (archived: New_Player_Guide.md "if you are able to hold it. If not,
  // a message will appear telling you so").
  function claimLoot() {
    var battle = Game.state.battle;
    if (!battle || (!battle.pendingLoot && !battle.pendingStolenLoot)) {
      return { ok: false, message: 'There is nothing to loot.' };
    }
    var messages = [];
    var ok = true;

    if (battle.pendingLoot) {
      var item = Game.Inventory.getItem(battle.pendingLoot);
      var added = Game.Inventory.addItem(battle.player, battle.pendingLoot);
      if (!added) {
        ok = false;
        messages.push('You cannot carry ' + (item ? item.name : 'the item') + ' — you are carrying too much weight.');
      } else {
        var name = item ? item.name : battle.pendingLoot;
        battle.pendingLoot = null;
        log(battle, 'You loot the ' + name + '.');
      }
    }

    if (battle.pendingStolenLoot) {
      var stolenItem = Game.Inventory.getItem(battle.pendingStolenLoot);
      var stolenAdded = Game.Inventory.addItem(battle.player, battle.pendingStolenLoot);
      if (!stolenAdded) {
        ok = false;
        messages.push('You cannot carry ' + (stolenItem ? stolenItem.name : 'the stolen item') + ' — you are carrying too much weight.');
      } else {
        var stolenName = stolenItem ? stolenItem.name : battle.pendingStolenLoot;
        battle.pendingStolenLoot = null;
        log(battle, 'You loot the stolen ' + stolenName + '.');
      }
    }

    battle.lootMessage = ok ? null : messages.join(' ');
    if (Game.persist) Game.persist();
    return { ok: ok, message: ok ? '' : battle.lootMessage };
  }

  // Dismisses the finished battle. On a loss the player is restored to 1 HP with no other
  // penalty (spec: "player restored to 1 HP outside battle").
  function endBattle() {
    var battle = Game.state.battle;
    if (battle && battle.phase === 'lost' && battle.player.hitPoints <= 0) {
      battle.player.hitPoints = 1;
    }
    Game.state.battle = null;
    if (Game.persist) Game.persist();
  }

  function getBattle() {
    return Game.state.battle || null;
  }

  var ARMOR_SKILLS = ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'];

  // v1.6 P1 (CB-2, SPEC-V1.6-REBALANCE.md §6): the skills whose skill-XP gain Intelligence speeds
  // up ([archived] reference/manual/Intelligence.md) — the five magic schools plus Rods. Read by
  // onWin's skill-XP award block above (hoisted var, same pattern as ARMOR_SKILLS: the whole IIFE
  // body runs before onWin is ever called).
  var MAGIC_XP_SKILLS = {
    'Evocation': true, 'Conjuration': true, 'Alteration': true, 'Absorption': true, 'Abjuration': true,
    'Rods': true
  };

  // v1.4 P3 (G2): flavor line announced once, at battle start, next to the champion banner
  // (js/ui/screens.js renderBattle also shows the affix name beside [CHAMPION]) — the battle log
  // must teach players the rules (spec §4).
  var AFFIX_ANNOUNCE = {
    vampiric: 'This champion is Vampiric — it drinks the blood it spills!',
    frenzied: 'This champion is Frenzied — it grows more savage with every action!',
    warded: 'This champion is Warded — the first hostile technique cast at it will be swallowed whole!',
    venomous: 'This champion is Venomous — its bite carries a virulent poison!',
    hoarder: 'This champion is a Hoarder — expect richer plunder from its corpse!'
  };

  return {
    start: start,
    attack: attack,
    useTech: useTech,
    useItem: useItem,
    flee: flee,
    fleeChance: fleeChance,
    defend: defend,
    limitBreak: limitBreak,
    getLimitBreak: getLimitBreak,
    getLimitBreakId: getLimitBreakId,
    claimLoot: claimLoot,
    endBattle: endBattle,
    getBattle: getBattle,
    canAct: canAct,
    isTechEquipped: isTechEquipped,
    techEffectivePower: techEffectivePower,
    effectiveTechEnergyCost: effectiveTechEnergyCost,
    fearLevels: fearLevels,
    fearMultiplier: fearMultiplier,
    playerDodgeChance: playerDodgeChance,
    playerDoubleAttackChance: playerDoubleAttackChance,
    playerCurseActive: playerCurseActive,
    playerCurseMultiplier: playerCurseMultiplier,
    getTech: getTech,
    getMonsterDef: getMonsterDef,
    _rng: Math.random // overridable for deterministic tests
  };
})();

window.Game = Game;
