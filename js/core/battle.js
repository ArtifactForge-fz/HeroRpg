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
    return Math.min(BALANCE.MONSTER_DODGE_CAP, BALANCE.DODGE_BASE + monster.level * BALANCE.MONSTER_DODGE_PER_LEVEL);
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
      return true;
    }
    return false;
  }

  // ---------------- Statuses (invented simple effects; names archived in Version_2.1_Changes.md) ----------------

  function playerBuffDamageBonus(battle) {
    var bonus = 0;
    for (var i = 0; i < battle.playerStatuses.length; i++) {
      var st = battle.playerStatuses[i];
      if (st.type === 'buff') bonus += st.power;
    }
    // Phase 4: Spirit Shrine "Battle Fervor" buff adds flat Damage for its remaining battles
    // (js/data/shrine.js), on top of any in-battle tech buffs above.
    if (Game.World && Game.World.shrineBonus) bonus += Game.World.shrineBonus(battle.player, 'damage');
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

    // Choose action: a known monster tech (50% inclination) if affordable, else basic attack.
    var usedTech = null;
    var affordable = [];
    var list = monster.techs || [];
    for (var i = 0; i < list.length; i++) {
      var t = getTech(list[i]);
      if (t && t.energyCost <= monster.energy) affordable.push(t);
    }
    if (affordable.length > 0 && rng() < 0.5) {
      usedTech = affordable[Math.floor(rng() * affordable.length)];
    }

    // Energy: monster attacks also cost monster energy (spec). Basic attacks cost the reduced
    // monster rate (see BALANCE.MONSTER_ATTACK_ENERGY_COST); techs cost their listed energyCost.
    var cost = usedTech ? usedTech.energyCost : BALANCE.MONSTER_ATTACK_ENERGY_COST;
    monster.energy = Math.max(0, monster.energy - cost);

    // Feature C: Defend halves the damage of the monster's very next action, hit or dodged, then
    // clears — captured now so a dodged attack still consumes the guard (the monster "acted";
    // only its resulting damage, if any, is affected by the flag).
    var defending = !!battle.playerDefending;
    battle.playerDefending = false;

    // Player dodge roll (Dodge skill + Dex). v1.2 Phase 1 item 3: a successful dodge grants Dodge
    // skill XP at the proc site (use-based skill system; addSkillXp already enforces the 2L+1 cap).
    if (rng() < playerDodgeChance(battle.player)) {
      log(battle, 'You dodge the ' + monster.name + "'s " + (usedTech ? usedTech.name : 'attack') + '!');
      Game.Character.addSkillXp(battle.player, 'Dodge', BALANCE.DODGE_SKILL_XP_PER_PROC);
      checkEnd(battle);
      return;
    }

    var base = usedTech ? usedTech.power : monster.damage;
    var glancing = rng() < BALANCE.GLANCING_CHANCE;
    var raw = rollVariance(base);
    if (glancing) raw *= BALANCE.GLANCING_MULT;

    // Armor mitigates physical hits; Magic Armor mitigates graded tech hits (DESIGN.md §4).
    // Fear also weakens the player's defensive stat-derived numbers (Fear.md: "lower your
    // stats by 10% for each level").
    var fear = fearMultiplier(battle);
    var mitigation = (usedTech && usedTech.grade)
      ? Game.Character.getMagicArmor(battle.player) * fear
      : Game.Character.getArmor(battle.player) * fear;
    var dmg = Math.max(1, Math.round(raw - mitigation));
    if (defending) dmg = Math.max(1, Math.round(dmg * BALANCE.DEFEND_DAMAGE_MULT));

    battle.player.hitPoints = Math.max(0, battle.player.hitPoints - dmg);
    log(battle, monster.name + (usedTech ? ' uses ' + usedTech.name : ' attacks') +
      (glancing ? ' — a glancing blow —' : '') + ' for ' + dmg + ' damage.');

    // Record armor slots worn while being hit, for post-battle armor-skill XP.
    var slots = Game.Inventory.EQUIP_SLOTS;
    for (var s = 0; s < slots.length; s++) {
      var slot = slots[s];
      if (slot === 'weapon') continue;
      if (battle.player.equipment[slot]) battle.hitWhileWearingArmor[slot] = true;
    }

    // On-hit poison from certain monster techs (e.g. Gnawing Bite).
    if (usedTech && usedTech.poisonChance && rng() < usedTech.poisonChance) {
      battle.playerStatuses.push({ type: 'poison', name: 'Poison', turnsLeft: BALANCE.POISON_DURATION_TURNS });
      log(battle, 'You are poisoned!');
    }

    // v1.2 Phase 1 item 8: Curse status — a monster-level `curseChance` field (analogous to a
    // tech's poisonChance) rolled on any successful hit, basic attack or tech alike (unlike
    // Poison, which is tied to specific monster techs). Battle-scoped debuff; see
    // playerCurseActive/playerCurseMultiplier below for the outgoing-damage halving.
    if (monster.curseChance && rng() < monster.curseChance) {
      battle.playerStatuses.push({ type: 'curse', name: 'Curse', turnsLeft: BALANCE.CURSE_DURATION });
      log(battle, 'A creeping curse settles over you!');
    }

    checkEnd(battle);
  }

  // Runs the monster counter + end-of-round status ticks after a player action, unless the
  // battle already ended.
  function finishRound(battle) {
    if (isOver(battle)) return;
    monsterAct(battle);
    tickPlayerStatuses(battle);
  }

  // ---------------- Player actions ----------------

  // archived: Energy.md — "When you have insufficient energy to attack or perform another
  // action, you may only end the battle by dying or by fleeing."
  function canAct(battle) {
    return battle && !isOver(battle) && battle.player.energy > 0;
  }

  function attack() {
    var battle = Game.state.battle;
    if (!battle || isOver(battle)) return battle;
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
    // v1.2 Phase 1 item 8: Curse halves outgoing damage (attacks AND techs) while active.
    var curseMult = playerCurseMultiplier(battle);
    var baseDamage = (Game.Character.getDamage(battle.player) + playerBuffDamageBonus(battle)) * fear * curseMult;

    var doubleAttack = rng() < playerDoubleAttackChance(battle.player);
    var hits = doubleAttack ? 2 : 1;
    if (doubleAttack) {
      log(battle, 'Double attack!');
      // v1.2 Phase 1 item 3: a Double Attack proc grants Double Attack skill XP at the proc site.
      Game.Character.addSkillXp(battle.player, 'Double Attack', BALANCE.DOUBLE_ATTACK_SKILL_XP_PER_PROC);
    }

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
      battle.monster.hp = Math.max(0, battle.monster.hp - dmg);
      log(battle, 'You strike the ' + battle.monster.name + (glancing ? ' with a glancing blow' : '') + ' for ' + dmg + ' damage.');
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
          battle.monster.hp = Math.max(0, battle.monster.hp - dmgOff);
          log(battle, 'Your offhand strikes the ' + battle.monster.name + (glancingOff ? ' with a glancing blow' : '') + ' for ' + dmgOff + ' damage.');
        }
        Game.Character.addSkillXp(battle.player, 'Dual Wield', 1);
      }
    }

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
    return Math.round(tech.power * (1 + c.intelligence * 0.02)); // invented: Int spell-damage factor
  }

  function useTech(techId) {
    var battle = Game.state.battle;
    if (!battle || isOver(battle)) return battle;
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
    if (battle.player.energy < tech.energyCost) {
      log(battle, 'Not enough Energy to use ' + tech.name + '.');
      return battle;
    }

    battle.player.energy = Math.max(0, battle.player.energy - tech.energyCost);
    if (tech.skill) battle.techsUsedThisBattle[tech.skill] = true;

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
    } else {
      // 'damage' | 'drain'
      var fear = fearMultiplier(battle);
      // v1.2 Phase 1 item 8: Curse halves outgoing damage (attacks AND techs) while active.
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
        battle.monster.hp = Math.max(0, battle.monster.hp - dmg);
        log(battle, (tech.weaponTech ? 'You strike with ' : 'You cast ') + tech.name + (glancing ? ' (glancing)' : '') + ' for ' + dmg + ' damage.');

        if (tech.effect === 'drain') {
          var drained = Math.round(dmg * 0.5); // invented: Absorption drains return half the damage as HP
          // Feature B: Haunting halves healing received, including Absorption drain returns.
          if (haunted) drained = Math.max(1, Math.round(drained * BALANCE.HAUNTING_HEAL_MULT));
          battle.player.hitPoints = Math.min(battle.player.hitPointsMax, battle.player.hitPoints + drained);
          log(battle, 'You absorb ' + drained + ' HP from the ' + battle.monster.name + '.');
        }
      }
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

    // archived: Recent_Updates.md 2007-04-06 "The experience/loot cutoff for monsters is once
    // again 5 levels" — a monster 5+ levels below you yields nothing at all (no XP, skill XP,
    // gold, shards, or loot).
    if (levelDiff >= BALANCE.XP_LOOT_CUTOFF_LEVELS) {
      battle.rewards = { xp: 0, gold: 0, shards: 0, skillXp: {}, loot: null, cutoff: true };
      battle.pendingLoot = null;
      log(battle, 'The ' + monster.name + ' was far beneath your level. You gain nothing.');
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
    // Weapon skill, if the player attacked with a weapon this battle.
    if (battle.attackedThisBattle && c.equippedWeaponSkill) {
      Game.Character.addSkillXp(c, c.equippedWeaponSkill, perUse);
      skillXpGranted[c.equippedWeaponSkill] = perUse;
    }
    // Magic-school skills for each school of tech used.
    for (var school in battle.techsUsedThisBattle) {
      if (!Object.prototype.hasOwnProperty.call(battle.techsUsedThisBattle, school)) continue;
      Game.Character.addSkillXp(c, school, perUse);
      skillXpGranted[school] = perUse;
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
      var dropChance = monster.champion ? Math.min(0.95, drops[d].chance * BALANCE.CHAMPION_REWARD_MULT) : drops[d].chance;
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
        var stealDropChance = monster.champion ? Math.min(0.95, drops[sd].chance * BALANCE.CHAMPION_REWARD_MULT) : drops[sd].chance;
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
    if (furyEffectiveLevel >= c.level) {
      c.fury = (c.fury || 0) + 1;
    }

    battle.rewards = {
      xp: xpGain, gold: goldGain, shards: shardsGain,
      skillXp: skillXpGranted, loot: lootId, cutoff: false,
      thieveryGold: thieveryGoldGain, stolenLoot: stolenId
    };

    log(battle, 'You gain ' + xpGain + ' experience and ' + goldGain + ' gold.' +
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

  return {
    start: start,
    attack: attack,
    useTech: useTech,
    useItem: useItem,
    flee: flee,
    fleeChance: fleeChance,
    defend: defend,
    claimLoot: claimLoot,
    endBattle: endBattle,
    getBattle: getBattle,
    canAct: canAct,
    isTechEquipped: isTechEquipped,
    techEffectivePower: techEffectivePower,
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
