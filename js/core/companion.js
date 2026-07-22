// HeroRPG remake — companion engine (docs/SPEC-COMPANION-SYSTEM.md §2.1/§2.6). Pure state
// machine, no DOM access anywhere in this file (same discipline as js/core/battle.js).
//
// A companion is a persistent, targetable second combatant. The ONLY persisted state is
// `character.companion = null | { kindId, hp }` (save v11, js/core/character.js create() /
// js/core/save.js migrate()) — hpMax/armor/magicArmor are always DERIVED from the kind def
// (js/data/companions.js) + character.level, never stored, so a level-up between battles is
// picked up automatically the next time a battle starts. This module owns:
//   - hpMaxFor/armorFor/magicArmorFor: derive current caps from a character (+ optional kindId).
//   - summon(character, kindId): bind/replace the active companion at full HP (D2: discard the
//     outgoing companion, the new one arrives at full HP — no HP banking, one persisted slot).
//   - act(battle): the companion's automatic basic action, called at the TOP of
//     js/core/battle.js finishRound() — the player's own turn, before the monster's counter. Pays
//     battle.player.energy; idles (no roll, no damage) if the player can't afford the cost. ALL
//     rolls route through Game.Battle._rng (CLAUDE.md cardinal rule: one RNG surface, never a
//     second) via the Game.Battle.rollVariance/applyResistance/techEffectivePower/fearMultiplier/
//     playerCurseMultiplier exports.
//   - tauntActive/setTaunt: the Earth companion's threat mechanic, queried by
//     js/core/battle.js monsterAct (redirects a monster's plain basic attack onto the companion)
//     and set by both this module's own act() (Stone Fist) and js/core/battle.js's useTech
//     (Bulwark refreshes it to a longer duration).
// Battle rehydration (`battle.companion` built from `character.companion` on Game.Battle.start),
// monster-on-companion damage (damageCompanion), per-round taunt decay (tickCompanionStatuses),
// and the win/loss/flee write-back/dispersal are owned by js/core/battle.js itself — mirroring
// how js/data/monsters.js's deepCopyMonster/battle.monster split already works: the data+derive
// layer lives here, the battle-transient lifecycle lives in battle.js.

var Game = window.Game || {};

Game.Companion = (function () {

  function rng() {
    return Game.Battle._rng();
  }

  function getKind(kindId) {
    if (!kindId) return null;
    var list = Game.Data.companions || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === kindId) return list[i];
    }
    return null;
  }

  function resolveKindId(character, kindId) {
    return kindId || (character && character.companion && character.companion.kindId) || null;
  }

  function hpMaxFor(character, kindId) {
    var kind = getKind(resolveKindId(character, kindId));
    if (!kind || !character) return 0;
    return Math.round(kind.hpBase + kind.hpPerLevel * character.level);
  }

  function armorFor(character, kindId) {
    var kind = getKind(resolveKindId(character, kindId));
    if (!kind || !character) return 0;
    return Math.round(kind.armorBase + kind.armorPerLevel * character.level);
  }

  function magicArmorFor(character, kindId) {
    var kind = getKind(resolveKindId(character, kindId));
    if (!kind || !character) return 0;
    return Math.round(kind.magicArmorBase + kind.magicArmorPerLevel * character.level);
  }

  // D2 (spec §2.1): casting a different Bind tech REPLACES the active companion outright — the
  // outgoing one is discarded (no HP banking) and the new one arrives at full HP.
  // COMPANION_MAX_ACTIVE (js/balance.js) = 1 is enforced structurally here: character.companion is
  // a single object field, never an array/roster, so "summon" can only ever mean "replace".
  function summon(character, kindId) {
    var kind = getKind(kindId);
    if (!character || !kind) return false;
    character.companion = {
      kindId: kindId,
      hp: Math.round(kind.hpBase + kind.hpPerLevel * character.level)
    };
    return true;
  }

  // ---------------- Taunt (Earth's threat mechanic, §2.3) ----------------

  function tauntActive(battle) {
    if (!battle || !battle.companion || battle.companion.hp <= 0) return false;
    var statuses = battle.companion.statuses || [];
    for (var i = 0; i < statuses.length; i++) {
      if (statuses[i].type === 'taunt' && statuses[i].turnsLeft > 0) return true;
    }
    return false;
  }

  // Replace-not-stack, shared by this module's own act() (Stone Fist, COMPANION_TAUNT_TURNS_BASIC)
  // and js/core/battle.js's useTech (Bulwark refreshes it to COMPANION_TAUNT_TURNS_BULWARK) — one
  // source of truth for "push/refresh the companion's Taunt".
  function setTaunt(battle, turns) {
    if (!battle || !battle.companion) return;
    battle.companion.statuses = (battle.companion.statuses || []).filter(function (st) {
      return st.type !== 'taunt';
    });
    battle.companion.statuses.push({ type: 'taunt', turnsLeft: turns });
  }

  // ---------------- The companion's own damage output (mirrors the retired servitor tick) ----------------

  // Deals graded damage to the monster through the SAME pipeline the old Elemental Servitor tick
  // used (js/core/battle.js tickMonsterStatuses, pre-v1.9): techEffectivePower (Int/magic-skill/
  // Rod-scaled, since it is fed a synthetic {effect:'damage', power} tech just like the servitor
  // was), Fear (fearMultiplier) and Curse (playerCurseMultiplier) on the base, a variance roll,
  // an independent glancing-blow roll, the monster's grade resistance (applyResistance), and
  // finally its flat Magic Armor — floored at 1. Every roll here goes through Game.Battle._rng via
  // the exported helpers (single RNG surface).
  function dealDamageToMonster(battle, power, grade) {
    var player = battle.player;
    var fear = Game.Battle.fearMultiplier(battle);
    var curseMult = Game.Battle.playerCurseMultiplier(battle);
    var base = Game.Battle.techEffectivePower(player, { effect: 'damage', power: power }) * fear * curseMult;
    var raw = Game.Battle.rollVariance(base);
    var glancing = rng() < BALANCE.GLANCING_CHANCE;
    if (glancing) raw *= BALANCE.GLANCING_MULT;
    raw = Game.Battle.applyResistance(battle.monster, grade, raw);
    var dmg = Math.max(1, Math.round(raw - battle.monster.magicArmor));
    battle.monster.hp = Math.max(0, battle.monster.hp - dmg);
    return dmg;
  }

  // ---------------- The automatic basic action (§2.2/§2.6) ----------------

  function act(battle) {
    if (!battle || battle.phase !== 'active') return;
    if (!battle.companion || battle.companion.hp <= 0) return;
    var def = battle.companion.def;
    if (!def) return;
    var basic = def.basic;
    var player = battle.player;

    // [invented][sim-gated] ratchet (lead sim 2026-07-22, spec §3 S4): the companion draws on the
    // player's Anima, so the archived 5-level Fear cutoff (reference/manual/Fear.md; DESIGN.md §4,
    // "5-down = certain death") overwhelms it exactly as it does the player. At or beyond the
    // cutoff below the enemy's level the companion idles — without this a Wind companion beat +6
    // enemies 87% of the time, breaking the 5-down contract; with it, all four return to ~0% there.
    // Triggers ONLY in the certain-death zone, so at/near-level play is completely unaffected.
    if (Game.Battle.fearLevels(battle) >= BALANCE.COMPANION_FEAR_SUPPRESS_LEVELS) {
      battle.log.push('Your ' + def.name + ' is overwhelmed by the enemy\'s presence and cannot act.');
      return;
    }

    // Energy tax (§2.2, [invented]): idles — no roll, no damage, no message beyond the log line —
    // if the player can't afford this round's basic. The ongoing tension against the player's own
    // tech casts that same round.
    if (player.energy < basic.energyCost) {
      battle.log.push('Your ' + def.name + ' is starved of Anima and holds back.');
      return;
    }
    player.energy = Math.max(0, player.energy - basic.energyCost);

    var L = player.level;
    var power = Math.round(basic.powerBase + basic.powerPerLevel * L);

    if (basic.effect === 'heal') {
      // Water: heals the player (Fear-exempt, archived: Recent_Updates.md 2007-04-06) plus a
      // token graded chip hit on the enemy, riding the same cast.
      var healAmount = Game.Battle.techEffectivePower(player, { effect: 'heal', power: power });
      player.hitPoints = Math.min(player.hitPointsMax, player.hitPoints + healAmount);
      battle.log.push('Your ' + def.name + ' uses ' + basic.name + ' — you recover ' + healAmount + ' HP.');
      if (basic.chipPowerBase && battle.monster.hp > 0) {
        var chipPower = Math.round(basic.chipPowerBase + basic.chipPowerPerLevel * L);
        var chipDmg = dealDamageToMonster(battle, chipPower, basic.grade);
        battle.log.push('Your ' + def.name + ' also chips the ' + battle.monster.name + ' for ' + chipDmg + ' damage.');
      }
      return;
    }

    // Fire/Earth/Wind: a graded damage tick against the monster, identical pipeline to the
    // retired servitor tick.
    if (battle.monster.hp <= 0) return;
    var dmg = dealDamageToMonster(battle, power, basic.grade);
    battle.log.push('Your ' + def.name + ' uses ' + basic.name + ' on the ' + battle.monster.name + ' for ' + dmg + ' damage.');

    // Fire: applies/refreshes a Burn DoT on the monster (replace-not-stack — mirrors the existing
    // 'bleed' debuff convention, js/core/battle.js tickMonsterStatuses).
    if (basic.dotKind && battle.monster.hp > 0) {
      var dotPower = Math.round(basic.dotPowerBase + basic.dotPowerPerLevel * L);
      battle.monster.statuses = (battle.monster.statuses || []).filter(function (st) {
        return !(st.type === 'debuff' && st.debuffKind === basic.dotKind);
      });
      battle.monster.statuses.push({
        type: 'debuff', debuffKind: basic.dotKind, name: 'Burn',
        power: dotPower, turnsLeft: basic.dotTurns
      });
      battle.log.push('The ' + battle.monster.name + ' catches fire!');
    }

    // Earth: generates/refreshes Taunt, redirecting the monster's own basic attack onto the
    // companion (js/core/battle.js monsterAct).
    if (basic.tauntTurns) {
      setTaunt(battle, basic.tauntTurns);
      battle.log.push('Your ' + def.name + ' plants itself between you and the ' + battle.monster.name + '.');
    }
  }

  return {
    getKind: getKind,
    hpMaxFor: hpMaxFor,
    armorFor: armorFor,
    magicArmorFor: magicArmorFor,
    summon: summon,
    act: act,
    tauntActive: tauntActive,
    setTaunt: setTaunt
  };
})();

window.Game = Game;
