// HeroRPG remake — character model (DESIGN.md §3).

var Game = window.Game || {};

Game.Character = (function () {

  function newSkillTable() {
    var table = {};
    for (var i = 0; i < BALANCE.SKILLS.length; i++) {
      table[BALANCE.SKILLS[i]] = { level: 0, xp: 0 };
    }
    return table;
  }

  function create(opts) {
    var race = opts.race;
    var raceBonus = BALANCE.RACE_BONUS[race] || {};

    var stats = {
      strength: BALANCE.START_STAT,
      vitality: BALANCE.START_STAT,
      dexterity: BALANCE.START_STAT,
      intelligence: BALANCE.START_STAT,
      endurance: BALANCE.START_STAT
    };

    for (var key in raceBonus) {
      if (Object.prototype.hasOwnProperty.call(raceBonus, key)) {
        stats[key] += raceBonus[key];
      }
    }

    var skills = newSkillTable();
    var pointsToSpend = opts.skillPoints || {};
    for (var s in pointsToSpend) {
      if (Object.prototype.hasOwnProperty.call(pointsToSpend, s) && skills[s]) {
        skills[s].level = pointsToSpend[s];
      }
    }

    var character = {
      race: race,
      name: opts.name,
      gender: opts.gender,

      strength: stats.strength,
      vitality: stats.vitality,
      dexterity: stats.dexterity,
      intelligence: stats.intelligence,
      endurance: stats.endurance,

      hitPointsMax: BALANCE.START_HP,
      hitPoints: BALANCE.START_HP,
      energyMax: BALANCE.START_ENERGY,
      energy: BALANCE.START_ENERGY,

      level: 1,
      xp: 0,
      statPoints: 0,
      trainingPoints: 0,

      gold: 0,
      platinum: 0,
      animaShards: 0,

      monsterKills: 0,
      deaths: 0,

      skills: skills,

      weaponDamageBonus: 0, // invented: weapon contribution, wired up via Game.Inventory
      equippedWeaponSkill: null, // invented: governs which stat feeds Damage (Damage.md)

      inventory: [], // Phase 2: array of item ids (Game.Data.items)
      equipment: { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null },

      // Phase 3: known technique ids + 3 equipped sets of 8 slots (Techniques.md: "equip up to
      // three concurrent sets of 8 techs each").
      techs: [],
      techSets: [
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null]
      ],
      fury: 0, // archived: Recent_Updates.md 2007-08-11 "Fury Meter"; ticks, +1% XP each, resets on death/flee

      // Phase 4: world/town state (DESIGN.md §2, §6).
      // v1.2 Phase 3 Content-A (docs/SPEC-V1.2.md Phase 3 Content-A, review #11): Arkan
      // characters start in Saratus, their archived capital (Arkan.md: "There they established
      // the city of Saratus"), instead of Eldor. Creation-time only — NOT a new persisted field
      // (currentLocation already exists), so no save-version bump is needed.
      currentLocation: (race === 'Arkan') ? 'saratus' : 'eldor', // invented: Human starts in Eldor per the original default; Arkan starts in Saratus per Arkan.md
      vault: { platinum: 0, gold: 0, items: [] }, // archived: Recent_Updates.md 2007-08-01 "Vault revamped, can now store items and gold (safely)"
      shrineBuffs: [], // archived: Anima_Shards.md/Spirit Shrine buffs; { id, battlesLeft } entries, applied in battle.js

      // Phase 5: quest journal state (DESIGN.md §7; archived Journal with active/completed tabs).
      // questId -> { status: 'active'|'completed', progress: { kills, touched, visited } } —
      // see js/core/quests.js.
      quests: {},

      // Phase 6a: class system (DESIGN.md §3; reference/manual/Classes.md). classes maps
      // classId -> per-class progress for every OBTAINED class (obtained != active — a class
      // must additionally be slotted into primaryClass/secondaryClass to earn XP or use its
      // abilities). legendaryUnlocked is a one-per-save latch (archived: Legendary classes "may
      // only be obtained by one player" — single-player reinterpretation, DESIGN.md §3).
      classes: {}, // classId -> { classXp: 0, classLevelsEarned: 0, classLevelsSpent: 0, abilities: [] }
      primaryClass: null,
      secondaryClass: null,
      legendaryUnlocked: false,

      // Feature B (user-directed): persistent status conditions, save v7->v8 (js/core/save.js).
      // Entries are { id: 'haunting' } — a plain array of small objects (mirrors shrineBuffs'
      // shape) so a future affliction with its own per-entry state (e.g. a duration) doesn't
      // require another migration.
      afflictions: [],

      // v1.4 P2 (G1): Advantage Points, save v9->v10 (js/core/save.js). A kills-only currency —
      // [archived] reference/forum/t-827.md ("you can now spend kills to get items"); earned only
      // on battle victory (js/core/battle.js onWin, BALANCE.AP_PER_WIN), spent at the AA Exchange
      // town facility (js/core/world.js buyAp). Never gold-convertible (docs/SPEC-V1.4-GAMEPLAY.md
      // §7 guardrail: AP is a parallel currency, not a gold faucet).
      ap: 0,

      // v1.9 (docs/SPEC-COMPANION-SYSTEM.md §2.1): the active companion, save v10->v11
      // (js/core/save.js). null = no companion bound; otherwise { kindId, hp } — hpMax/armor/
      // magicArmor are always DERIVED from the kind def (js/data/companions.js) + character.level
      // (js/core/companion.js hpMaxFor/armorFor/magicArmorFor), never stored. First bound by a
      // Conjurer "Bind" tech (js/data/techs.js tech_summon_*); dispersed (set back to null) on
      // death (D6) or when its hp reaches 0 mid-battle (js/core/battle.js).
      companion: null
    };


    recalcDerived(character);
    character.hitPoints = character.hitPointsMax;
    character.energy = character.energyMax;

    if (Game.Inventory && Game.Inventory.grantStarterKit) {
      Game.Inventory.grantStarterKit(character);
      character.hitPoints = character.hitPointsMax;
      character.energy = character.energyMax;
    }

    grantStarterTech(character, pointsToSpend);

    return character;
  }

  // Phase 3 spec item 7: "Give new characters 1 starter tech known+slotted matching a magic-
  // school creation skill if they took one (else none)." Magic-school skills are Evocation,
  // Conjuration, Alteration, Absorption, Abjuration (DESIGN.md §3). We pick the creation skill
  // the player invested the most points in among those five, break ties by BALANCE.SKILLS order,
  // and grant that school's first rank-1 tech (invented mapping — no starter-tech rule survived).
  var STARTER_TECH_BY_SKILL = {
    'Evocation': 'tech_firebolt_1',
    'Conjuration': 'tech_shadowlash_1',
    'Alteration': 'tech_warcry_1',
    'Absorption': 'tech_lifetap_1',
    'Abjuration': 'tech_mend_wounds_1'
  };

  // Feature C (user-directed): early melee builds got no starter tech at all while magic builds
  // did (the "Attack-spam" problem the phase brief calls out) — weapon skills now grant their
  // chain's rank-I weapon technique using the same "highest creation-skill investment wins" rule
  // as the magic schools above. Kept as a separate table (rather than merged into
  // STARTER_TECH_BY_SKILL) so any other code iterating that table for magic-only purposes is
  // unaffected; grantStarterTech below is the only reader of this one.
  var WEAPON_STARTER_TECH_BY_SKILL = {
    'Swords': 'tech_cleave_1',
    'Polearms': 'tech_impale_1',
    'Knives': 'tech_vital_strike_1',
    'Hand to Hand': 'tech_flurry_1'
  };

  function grantStarterTech(character, creationSkillPoints) {
    var bestMagic = null, bestMagicPoints = 0;
    for (var skillName in STARTER_TECH_BY_SKILL) {
      if (!Object.prototype.hasOwnProperty.call(STARTER_TECH_BY_SKILL, skillName)) continue;
      var pts = (creationSkillPoints && creationSkillPoints[skillName]) || 0;
      if (pts > bestMagicPoints) {
        bestMagicPoints = pts;
        bestMagic = skillName;
      }
    }
    var bestWeapon = null, bestWeaponPoints = 0;
    for (var wSkillName in WEAPON_STARTER_TECH_BY_SKILL) {
      if (!Object.prototype.hasOwnProperty.call(WEAPON_STARTER_TECH_BY_SKILL, wSkillName)) continue;
      var wpts = (creationSkillPoints && creationSkillPoints[wSkillName]) || 0;
      if (wpts > bestWeaponPoints) {
        bestWeaponPoints = wpts;
        bestWeapon = wSkillName;
      }
    }

    if (!bestMagic && !bestWeapon) return; // no magic-school or weapon creation skill taken

    // Higher investment wins; a TIE goes to magic (invented tie-break, per phase brief) —
    // strictly-greater comparison below means bestWeaponPoints must exceed bestMagicPoints to win.
    var techId = (bestWeaponPoints > bestMagicPoints)
      ? WEAPON_STARTER_TECH_BY_SKILL[bestWeapon]
      : STARTER_TECH_BY_SKILL[bestMagic];
    character.techs.push(techId);
    character.techSets[0][0] = techId;
  }

  // ---------------- Feature B: afflictions (persistent status conditions) ----------------

  function hasAffliction(c, id) {
    var list = (c && c.afflictions) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return true;
    }
    return false;
  }

  // No stacking (invented, mirrors shrineBuffs' "no stacking of the same buff" precedent) —
  // re-applying an already-active affliction is a no-op and returns false.
  function addAffliction(c, id) {
    if (!c) return false;
    if (!Array.isArray(c.afflictions)) c.afflictions = [];
    if (hasAffliction(c, id)) return false;
    c.afflictions.push({ id: id });
    return true;
  }

  function removeAffliction(c, id) {
    if (!c || !Array.isArray(c.afflictions)) return false;
    for (var i = 0; i < c.afflictions.length; i++) {
      if (c.afflictions[i].id === id) {
        c.afflictions.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // v1.3.1 fix 4 [invented]: a character's home town, re-derived at runtime from race — mirrors
  // the same race -> start-area mapping create() uses above (currentLocation's initializer), kept
  // here as the single source of truth rather than duplicated in js/core/world.js travelTo. NOT a
  // new persisted field: callers always recompute it from c.race, never read/write it directly.
  // No archived record of an explicit "home town always reachable" exemption survives; designed in
  // the original's spirit so a character's own racial starting town never locks them out of their
  // own early racial quests via that town's minLevel gate (js/core/world.js travelTo).
  function homeTownId(c) {
    return (c && c.race === 'Arkan') ? 'saratus' : 'eldor';
  }

  // Vitality drives max HP. Phase 1 formula: base start HP plus a flat per-point gain.
  // invented: exact HP-per-Vitality growth curve was never archived.
  var HP_PER_VITALITY = 5; // invented

  function recalcDerived(c) {
    var classHpBonus = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'hp_max_flat') : 0;
    var classEnergyBonus = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'energy_max_flat') : 0;
    c.hitPointsMax = BALANCE.START_HP + (c.vitality - BALANCE.START_STAT) * HP_PER_VITALITY + classHpBonus;
    // archived direction: energy is a dynamic pool that grows each level (homepage_2007.md
    // 2007-05-25); see BALANCE.ENERGY_PER_LEVEL for the Phase 7 balance-pass rationale.
    c.energyMax = BALANCE.START_ENERGY + (c.level - 1) * BALANCE.ENERGY_PER_LEVEL + classEnergyBonus;
    // v1.3.1 fix 6: recalcDerived only ever adjusted the maxes, never clamped current hitPoints/
    // energy down to match — deactivating a class (or swapping a slot) that carried an
    // hp_max_flat/energy_max_flat passive could leave current HP/Energy ABOVE the new, lower max
    // (e.g. full HP at the bonus, then deactivate -> hitPointsMax drops but hitPoints does not).
    // Callers that intentionally set current to the (old, higher) max right after calling this
    // (create(), spendStatPoint's vitality branch) are unaffected: they either raise the max first
    // or already re-clamp their own way.
    if (c.hitPoints > c.hitPointsMax) c.hitPoints = c.hitPointsMax;
    if (c.energy > c.energyMax) c.energy = c.energyMax;
  }

  // archived: Damage.md — Swords/Blunt/Polearms<-Str, Knives<-Dex, Rods<-Int, Hand to Hand<-Str
  // (DESIGN.md §3). Ratio 2.5:1 is archived for Strength (Recent_Updates.md 2007-04-06); the
  // Knives/Dex and Rods/Int ratios are invented in parallel, matching the same 2.5:1 factor.
  var DAMAGE_STAT_BY_SKILL = {
    'Swords': 'strength',
    'Polearms': 'strength',
    'Hand to Hand': 'strength',
    'Knives': 'dexterity',
    'Rods': 'intelligence'
  };

  // v1.2 Phase 1 item 1: weapon skill -> damage. The equipped weapon's `.skill` already selects
  // the damage STAT (DAMAGE_STAT_BY_SKILL above); the character's level in that same skill now
  // also adds a capped percentage of damage — invented (user-directed): use-based skill system
  // (SPEC-V1.2.md Phase 1 #1; BALANCE.WEAPON_SKILL_DAMAGE_PER_LEVEL/_CAP).
  function weaponSkillDamageMult(c, skillName) {
    var skillLevel = (skillName && c.skills && c.skills[skillName]) ? c.skills[skillName].level : 0;
    return 1 + Math.min(BALANCE.WEAPON_SKILL_DAMAGE_PER_LEVEL * skillLevel, BALANCE.WEAPON_SKILL_DAMAGE_CAP);
  }

  function getDamage(c) {
    var stat = DAMAGE_STAT_BY_SKILL[c.equippedWeaponSkill] || 'strength';
    var base = Math.round(c[stat] / BALANCE.STRENGTH_DAMAGE_RATIO) + (c.weaponDamageBonus || 0);
    // Phase 6a: active-class "damage_pct" passives multiply the final Damage number (DESIGN.md
    // §3; js/core/classes.js classBonus, guarded-hook style matching Game.World.shrineBonus).
    var classPct = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'damage_pct') : 0;
    return Math.round(base * (1 + classPct) * weaponSkillDamageMult(c, c.equippedWeaponSkill));
  }

  // v1.2 Phase 1 item 5 (Dual Wield): mirrors getDamage above but reads the OFFHAND weapon's own
  // stat/skill/damage directly from c.equipment.offhand rather than the cached main-hand fields
  // (weaponDamageBonus/equippedWeaponSkill are single-slot, main-hand only — refreshWeaponBonus
  // in js/core/inventory.js never touches the offhand). Returns 0 if the offhand slot is empty
  // or holds a non-weapon (e.g. a Shield, which has no `.damage` field) — see battle.js attack()'s
  // dual-wielding check for the same "has .damage" test.
  function getOffhandDamage(c) {
    var itemId = c.equipment && c.equipment.offhand;
    var item = (itemId && Game.Inventory && Game.Inventory.getItem) ? Game.Inventory.getItem(itemId) : null;
    if (!item || item.damage === undefined) return 0;
    var stat = DAMAGE_STAT_BY_SKILL[item.skill] || 'strength';
    var base = Math.round(c[stat] / BALANCE.STRENGTH_DAMAGE_RATIO) + (item.damage || 0);
    var classPct = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'damage_pct') : 0;
    return Math.round(base * (1 + classPct) * weaponSkillDamageMult(c, item.skill));
  }

  function getArmor(c) {
    // archived: Armor.md — equipment + Endurance.
    var equipped = (Game.Inventory && Game.Inventory.equippedArmorTotal) ? Game.Inventory.equippedArmorTotal(c) : 0;
    // Phase 4: Spirit Shrine "Stoneskin" buff adds flat Armor for its remaining battles (js/data/shrine.js).
    var shrineBonus = (Game.World && Game.World.shrineBonus) ? Game.World.shrineBonus(c, 'armor') : 0;
    // Phase 6a: active-class "armor_flat" passives (js/core/classes.js classBonus).
    var classFlat = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'armor_flat') : 0;
    // [revised] v1.6 P1 (CB-1, SPEC-V1.6-REBALANCE.md §6): Endurance's contribution is no longer
    // 1:1 — a mid-level character's Endurance alone used to exceed a same-level monster's whole
    // damage term, floor-ing most hits to 1 (REVIEW-2026-07-16.md CB-1). LOCKED by the P0 sim gate.
    return Math.round(c.endurance * BALANCE.ENDURANCE_ARMOR_RATIO) + equipped + shrineBonus + classFlat;
  }

  function getMagicArmor(c) {
    // archived: DESIGN.md §3 — Magic Armor derived from Intelligence.
    var equipped = (Game.Inventory && Game.Inventory.equippedMagicArmorTotal) ? Game.Inventory.equippedMagicArmorTotal(c) : 0;
    // Phase 4: Spirit Shrine "Spirit Ward" buff adds flat Magic Armor for its remaining battles.
    var shrineBonus = (Game.World && Game.World.shrineBonus) ? Game.World.shrineBonus(c, 'magicArmor') : 0;
    // Phase 6a: active-class "magic_armor_flat" passives (js/core/classes.js classBonus).
    var classFlat = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'magic_armor_flat') : 0;
    // [revised] v1.6 P1 (CB-1/CB-5, SPEC-V1.6-REBALANCE.md §6): symmetric with getArmor above —
    // also trims the CB-5 "Intelligence does everything" overload a notch. LOCKED by the P0 sim gate.
    return Math.round(c.intelligence * BALANCE.INT_MAGIC_ARMOR_RATIO) + equipped + shrineBonus + classFlat;
  }

  function goldTotalAsGold(c) {
    return c.platinum * BALANCE.GOLD_PER_PLATINUM + c.gold;
  }

  function addGold(c, amount) {
    c.gold += amount;
    while (c.gold >= BALANCE.GOLD_PER_PLATINUM) {
      c.gold -= BALANCE.GOLD_PER_PLATINUM;
      c.platinum += 1;
    }
  }

  function addShards(c, amount) {
    c.animaShards = Math.min(BALANCE.ANIMA_SHARDS_CAP, c.animaShards + amount);
  }

  // F1 balance-to-100 (docs/SPEC-FULL-LEVEL-ARC.md D1, BALANCE.LEVEL_CAP): at the cap there is no
  // "next level" to show progress toward, so both helpers report 0/0 rather than a meaningless
  // (or NaN-from-division) number — js/ui/screens.js's two XP-bar renderers special-case a 0
  // xpNeededForNext as "MAX" instead of computing a percentage.
  function xpNeededForNext(c) {
    if (c.level >= BALANCE.LEVEL_CAP) return 0;
    return BALANCE.XP_TO_LEVEL(c.level + 1) - BALANCE.XP_TO_LEVEL(c.level);
  }

  function xpIntoCurrentLevel(c) {
    if (c.level >= BALANCE.LEVEL_CAP) return 0;
    return c.xp - BALANCE.XP_TO_LEVEL(c.level);
  }

  function addXp(c, amount) {
    // F1 balance-to-100: once at the cap, further combat XP has nowhere to go — a no-op rather
    // than letting c.xp grow unbounded (which xpIntoCurrentLevel/xpNeededForNext above would then
    // have to keep guarding against forever, for no gameplay benefit). Excess XP earned in the
    // SAME addXp call that reaches the cap is dropped by the c.xp clamp below the loop, matching
    // the same "excess handled sensibly" rule.
    if (c.level >= BALANCE.LEVEL_CAP) return 0;
    c.xp += amount;
    var leveled = 0;
    while (c.level < BALANCE.LEVEL_CAP && c.xp >= BALANCE.XP_TO_LEVEL(c.level + 1)) {
      c.level += 1;
      c.statPoints += BALANCE.LEVELUP_STAT_POINTS; // archived: Level_Up.md
      c.trainingPoints += BALANCE.LEVELUP_TRAINING_POINTS; // archived: Level_Up.md
      leveled += 1;
    }
    if (c.level >= BALANCE.LEVEL_CAP) {
      c.xp = BALANCE.XP_TO_LEVEL(BALANCE.LEVEL_CAP); // clamp: no dangling excess above the cap's threshold
    }
    if (leveled > 0) {
      recalcDerived(c);
      c.hitPoints = Math.min(c.hitPoints, c.hitPointsMax);
    }
    return leveled;
  }

  function spendStatPoint(c, statName) {
    var validStats = ['strength', 'vitality', 'dexterity', 'intelligence', 'endurance'];
    if (validStats.indexOf(statName) === -1) return false;
    if (c.statPoints <= 0) return false;
    c[statName] += 1;
    c.statPoints -= 1;
    recalcDerived(c);
    if (statName === 'vitality') {
      c.hitPoints = Math.min(c.hitPoints + HP_PER_VITALITY, c.hitPointsMax);
    }
    return true;
  }

  function skillCap(c) {
    return BALANCE.SKILL_CAP(c.level);
  }

  // Grants skill XP to a named skill, respecting the skill cap (Recent_Updates.md 2007-04-30)
  // and auto-leveling the skill using BALANCE.SKILL_XP_FOR_LEVEL. Used by Game.Battle for
  // weapon/school/armor skill XP on battle actions (DESIGN.md §4).
  function addSkillXp(c, skillName, amount) {
    var sk = c.skills[skillName];
    if (!sk) return 0;
    var cap = skillCap(c);
    if (sk.level >= cap) return 0; // already at cap: no further skill XP
    sk.xp += amount;
    var leveled = 0;
    while (sk.level < cap && sk.xp >= BALANCE.SKILL_XP_FOR_LEVEL(sk.level + 1)) {
      sk.xp -= BALANCE.SKILL_XP_FOR_LEVEL(sk.level + 1);
      sk.level += 1;
      leveled += 1;
    }
    if (sk.level >= cap) {
      sk.level = cap;
      sk.xp = 0;
    }
    return leveled;
  }

  return {
    create: create,
    recalcDerived: recalcDerived,
    getDamage: getDamage,
    getOffhandDamage: getOffhandDamage,
    getArmor: getArmor,
    getMagicArmor: getMagicArmor,
    addGold: addGold,
    addShards: addShards,
    addXp: addXp,
    xpNeededForNext: xpNeededForNext,
    xpIntoCurrentLevel: xpIntoCurrentLevel,
    spendStatPoint: spendStatPoint,
    skillCap: skillCap,
    addSkillXp: addSkillXp,
    goldTotalAsGold: goldTotalAsGold,
    hasAffliction: hasAffliction,
    addAffliction: addAffliction,
    removeAffliction: removeAffliction,
    homeTownId: homeTownId
  };
})();

window.Game = Game;
