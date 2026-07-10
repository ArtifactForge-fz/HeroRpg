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
      currentLocation: 'eldor', // invented: new characters start in the Royal City of Eldor
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
      afflictions: []
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

  function getDamage(c) {
    var stat = DAMAGE_STAT_BY_SKILL[c.equippedWeaponSkill] || 'strength';
    var base = Math.round(c[stat] / BALANCE.STRENGTH_DAMAGE_RATIO) + (c.weaponDamageBonus || 0);
    // Phase 6a: active-class "damage_pct" passives multiply the final Damage number (DESIGN.md
    // §3; js/core/classes.js classBonus, guarded-hook style matching Game.World.shrineBonus).
    var classPct = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'damage_pct') : 0;
    return Math.round(base * (1 + classPct));
  }

  function getArmor(c) {
    // archived: Armor.md — equipment + Endurance.
    var equipped = (Game.Inventory && Game.Inventory.equippedArmorTotal) ? Game.Inventory.equippedArmorTotal(c) : 0;
    // Phase 4: Spirit Shrine "Stoneskin" buff adds flat Armor for its remaining battles (js/data/shrine.js).
    var shrineBonus = (Game.World && Game.World.shrineBonus) ? Game.World.shrineBonus(c, 'armor') : 0;
    // Phase 6a: active-class "armor_flat" passives (js/core/classes.js classBonus).
    var classFlat = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'armor_flat') : 0;
    return c.endurance + equipped + shrineBonus + classFlat; // invented ratio (1:1) for the Endurance contribution
  }

  function getMagicArmor(c) {
    // archived: DESIGN.md §3 — Magic Armor derived from Intelligence.
    var equipped = (Game.Inventory && Game.Inventory.equippedMagicArmorTotal) ? Game.Inventory.equippedMagicArmorTotal(c) : 0;
    // Phase 4: Spirit Shrine "Spirit Ward" buff adds flat Magic Armor for its remaining battles.
    var shrineBonus = (Game.World && Game.World.shrineBonus) ? Game.World.shrineBonus(c, 'magicArmor') : 0;
    // Phase 6a: active-class "magic_armor_flat" passives (js/core/classes.js classBonus).
    var classFlat = (Game.Classes && Game.Classes.classBonus) ? Game.Classes.classBonus(c, 'magic_armor_flat') : 0;
    return c.intelligence + equipped + shrineBonus + classFlat; // invented ratio (1:1) for the Intelligence contribution
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

  function xpNeededForNext(c) {
    return BALANCE.XP_TO_LEVEL(c.level + 1) - BALANCE.XP_TO_LEVEL(c.level);
  }

  function xpIntoCurrentLevel(c) {
    return c.xp - BALANCE.XP_TO_LEVEL(c.level);
  }

  function addXp(c, amount) {
    c.xp += amount;
    var leveled = 0;
    while (c.xp >= BALANCE.XP_TO_LEVEL(c.level + 1)) {
      c.level += 1;
      c.statPoints += BALANCE.LEVELUP_STAT_POINTS; // archived: Level_Up.md
      c.trainingPoints += BALANCE.LEVELUP_TRAINING_POINTS; // archived: Level_Up.md
      leveled += 1;
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
    removeAffliction: removeAffliction
  };
})();

window.Game = Game;
