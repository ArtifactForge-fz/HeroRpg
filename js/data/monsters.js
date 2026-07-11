// HeroRPG remake — monster database (DESIGN.md §4 combat, §2 world/lore).
// All entries invented (no monster archive survived — see reference/SOURCES.md), original-
// flavored around the Averast/Van Arius setting (plains around Eldor, Estari ruins, Majiku
// raiders/scouts threatening the Arkan). No copyrighted names/creatures.
//
// Balance ballpark (Phase 3 spec): hp ~= 20 + 12*level, damage ~= 3 + 2*level, armor ~= level.
// xp uses BALANCE.MONSTER_XP(level). gold/shard/drops are invented flavoring within that budget.

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.monsters = [

  // ---------- Level 1 ----------
  {
    id: 'plains_field_rat',
    name: 'Field Rat',
    level: 1,
    hp: 32,
    energy: 50, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 5,
    armor: 1,
    magicArmor: 0,
    element: null,
    resistances: {},
    techs: [],
    xp: BALANCE.MONSTER_XP(1),
    goldMin: 1,
    goldMax: 4,
    shardChance: 0.02,
    drops: [
      { itemId: 'potion_minor_healing', chance: 0.1 }
    ],
    desc: 'A mangy rat grown fat on scraps from the Eldor grain wagons. Common as dirt on the Averast plains.'
  },

  // =====================================================================
  // Enemy-variety pass: 15 new regulars across existing areas (js/data/areas.js monster lists),
  // filling out level bands with lore-consistent invented flavor (DESIGN.md §2 Averast plains,
  // Estari ruins, Majiku, Anima). Same balance ballpark as the header comment: hp = 20+12*level,
  // damage = 3+2*level, armor ~= level (deliberately varied per archetype — see each entry's
  // comment), energy = 40+10*level, xp = BALANCE.MONSTER_XP(level). No copyrighted creatures.
  // =====================================================================

  // ---------- Level 2 ----------
  {
    id: 'plains_windrunner_kestrel',
    name: 'Windrunner Kestrel',
    level: 2,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 2,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 2,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 2,
    armor: 2, // balanced profile: armor ~= level
    magicArmor: 1,
    element: 'Wind',
    resistances: { Wind: 0.5 }, // no vulnerability entry (variation lever: "some with none")
    techs: [],
    xp: BALANCE.MONSTER_XP(2),
    goldMin: 2,
    goldMax: 6,
    shardChance: 0.02,
    drops: [
      { itemId: 'potion_minor_healing', chance: 0.1 }
    ],
    desc: 'A hawk-swift bird that rides the wind currents over the Averast plains, diving on anything smaller than itself.'
  },

  // ---------- Level 3 ----------
  {
    id: 'plains_cutpurse_vole',
    name: 'Cutpurse Vole',
    level: 3,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 3,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 3,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 3,
    armor: 1, // glass cannon: thin-skinned, relies on speed rather than hide
    magicArmor: 0,
    element: null,
    resistances: {},
    techs: ['mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(3),
    goldMin: 3,
    goldMax: 8,
    shardChance: 0.03,
    drops: [
      { itemId: 'knife_worn_dagger', chance: 0.02 },
      { itemId: 'potion_minor_healing', chance: 0.12 }
    ],
    desc: 'A quick, needle-toothed vole that darts in to nip and steal shiny scraps before a hunter can react.'
  },

  // ---------- Level 2 ----------
  {
    id: 'plains_wild_boar',
    name: 'Wild Boar',
    level: 2,
    hp: 44,
    energy: 60, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 7,
    armor: 2,
    magicArmor: 0,
    element: 'Earth',
    resistances: { Earth: 0.5 },
    techs: [],
    xp: BALANCE.MONSTER_XP(2),
    goldMin: 2,
    goldMax: 6,
    shardChance: 0.02,
    drops: [
      { itemId: 'potion_minor_healing', chance: 0.12 }
    ],
    desc: 'A tusked boar that roots through the plains grass, quick to charge anything that startles it.'
  },

  // ---------- Level 3 ----------
  {
    id: 'plains_vermin_swarm',
    name: 'Vermin Swarm',
    level: 3,
    hp: 56,
    energy: 70, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 9,
    armor: 2,
    magicArmor: 1,
    element: null,
    resistances: {},
    techs: ['mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(3),
    goldMin: 3,
    goldMax: 8,
    shardChance: 0.03,
    drops: [
      { itemId: 'sword_rusty_shortblade', chance: 0.03 },
      { itemId: 'potion_minor_healing', chance: 0.1 },
      // Phase 9: unique equipment (js/data/items.js). Appended last so prior loot rates are
      // unchanged (drops roll top-down, first hit wins).
      { itemId: 'knife_vermin_kings_fang', chance: 0.02 }
    ],
    desc: 'A writhing knot of rats and stinging insects that moves as one hungry creature.'
  },

  // ---------- Level 4 ----------
  {
    id: 'estari_loose_rubble',
    name: 'Animate Rubble',
    level: 4,
    hp: 60, // retuned at milestone gate: 68/armor-5 stalled 38% of melee fights (player energy exhausted)
    energy: 80, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 11,
    armor: 3, // retuned at milestone gate (was 5); Earth resistance + Fire weakness stays the magic-counter flavor
    magicArmor: 2,
    element: 'Earth',
    resistances: { Earth: 0.5, Fire: -0.25 },
    techs: [],
    xp: BALANCE.MONSTER_XP(4),
    goldMin: 3,
    goldMax: 9,
    shardChance: 0.04,
    drops: [
      { itemId: 'shield_wooden_buckler', chance: 0.05 },
      // Phase 5: quest material for "Professor Flad" (js/data/quests.js). Appended after the
      // existing entry so prior loot rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'quest_animate_rubble_core', chance: 0.5 }
    ],
    desc: 'Loose stone from a collapsed Estari wall, stirred into shambling motion by lingering Anima residue.'
  },

  // ---------- Level 5 ----------
  {
    id: 'estari_construct_sentinel',
    name: 'Estari Construct',
    level: 5,
    hp: 80,
    energy: 90, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 13,
    armor: 7,
    magicArmor: 4,
    element: 'Earth',
    resistances: { Earth: 0.5, Water: -0.25 },
    techs: ['mon_stone_slam'],
    xp: BALANCE.MONSTER_XP(5),
    goldMin: 4,
    goldMax: 10,
    shardChance: 0.05,
    drops: [
      { itemId: 'sword_soldiers_blade', chance: 0.04 },
      { itemId: 'medium_body_studded_jerkin', chance: 0.04 }
    ],
    desc: 'A squat guardian of carved Estari stone, still standing watch over ruins long since buried in the plains.'
  },

  // ---------- Level 4 ----------
  {
    id: 'estari_clay_husk',
    name: 'Estari Clay Husk',
    level: 4,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 4,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 4,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 4,
    armor: 6, // tank profile: above the level ~= armor baseline, but not so high it stalls a level-4 warrior's thin early weapons (Phase-3-milestone-gate-style retune after a sim check)
    magicArmor: 2,
    element: 'Earth',
    resistances: { Earth: 0.5, Water: -0.35 }, // fired clay slumps and cracks under running water
    techs: [],
    xp: BALANCE.MONSTER_XP(4),
    goldMin: 3,
    goldMax: 9,
    shardChance: 0.04,
    drops: [
      { itemId: 'shield_wooden_buckler', chance: 0.04 },
      { itemId: 'potion_minor_healing', chance: 0.1 }
    ],
    desc: 'A cruder cousin of the Estari\'s animate rubble, fired-clay shards fused into a lumbering husk by centuries of leaking Anima. Water seams its cracks and, given enough of it, brings the whole thing down.'
  },

  // ---------- Level 5 ----------
  {
    id: 'estari_anima_scavenger',
    name: 'Anima-Touched Scavenger',
    level: 5,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 5,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 5,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 5,
    armor: 3, // spell-wall profile: thin hide, but magicArmor well above armor
    magicArmor: 8,
    element: 'Star',
    resistances: { Star: 0.4, Earth: -0.25 },
    techs: ['mon_static_arc'],
    xp: BALANCE.MONSTER_XP(5),
    goldMin: 4,
    goldMax: 10,
    shardChance: 0.06,
    drops: [
      { itemId: 'crystal_energy_shard', chance: 0.06 },
      { itemId: 'potion_healing', chance: 0.08 }
    ],
    desc: 'A carrion-feeder grown strange from years scavenging near a leaking Anima seam in the ruins, its raw Star-grade discharges as much a threat as its bite.'
  },

  // ---------- Level 6 ----------
  {
    id: 'majiku_forest_scout',
    name: 'Majiku Scout',
    level: 6,
    hp: 92,
    energy: 100, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 15,
    armor: 6,
    magicArmor: 3,
    element: 'Wind',
    resistances: { Wind: 0.5 },
    techs: ['mon_hunters_mark'],
    xp: BALANCE.MONSTER_XP(6),
    goldMin: 5,
    goldMax: 12,
    shardChance: 0.05,
    drops: [
      { itemId: 'knife_thieves_edge', chance: 0.05 },
      { itemId: 'potion_healing', chance: 0.08 },
      // Phase 5: quest material for "Eldor: Dr. Ferrier" (js/data/quests.js); appended last so
      // prior loot rates are unchanged.
      { itemId: 'quest_majiku_venom_gland', chance: 0.5 },
      // Phase 9: unique equipment (js/data/items.js). Appended last so prior loot rates (incl.
      // the quest-material roll above) are unchanged.
      { itemId: 'light_body_ashroot_ward_cloak', chance: 0.015 }
    ],
    desc: 'A Majiku raider ranging far south from the Forests of Kuraan, quick and quiet as the wind.'
  },

  // ---------- Level 7 ----------
  {
    id: 'majiku_war_shaman',
    name: 'Majiku War-Shaman',
    level: 7,
    hp: 104,
    energy: 110, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 17,
    armor: 6,
    magicArmor: 9,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_hunters_mark'],
    xp: BALANCE.MONSTER_XP(7),
    goldMin: 6,
    goldMax: 14,
    shardChance: 0.06,
    drops: [
      { itemId: 'rod_saratus_conduit', chance: 0.03 },
      { itemId: 'crystal_energy_shard', chance: 0.1 },
      // Phase 5: quest material for "Eldor: Dr. Ferrier" (js/data/quests.js); appended last.
      { itemId: 'quest_majiku_venom_gland', chance: 0.5 }
    ],
    desc: 'A tribal spellcaster who channels the Majiku ancestral spirits into curses of creeping dark.'
  },

  // ---------- Level 8 ----------
  {
    id: 'skyspire_wisp',
    name: 'Skyspire Wisp',
    level: 8,
    hp: 116,
    energy: 120, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 19,
    armor: 4,
    magicArmor: 12,
    element: 'Star',
    resistances: { Star: 0.5, Earth: -0.25 },
    techs: ['mon_static_arc'],
    xp: BALANCE.MONSTER_XP(8),
    goldMin: 7,
    goldMax: 16,
    shardChance: 0.08,
    drops: [
      { itemId: 'light_legs_supple_leggings', chance: 0.05 },
      { itemId: 'potion_healing', chance: 0.1 }
    ],
    desc: 'A crackling mote of stray Anima said to have drifted down from Eidas’ abandoned Skyspire.'
  },

  // ---------- Level 6 (Kuraan Border Woods variety) ----------
  {
    id: 'kuraan_prowler',
    name: 'Kuraan Prowler',
    level: 6,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 6,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 6,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 6,
    armor: 6, // balanced physical profile: armor ~= level
    magicArmor: 2,
    element: null, // no grade, no vulnerability: pure physical predator
    resistances: {},
    techs: ['mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(6),
    goldMin: 5,
    goldMax: 12,
    shardChance: 0.05,
    drops: [
      { itemId: 'potion_healing', chance: 0.08 },
      { itemId: 'crystal_energy_shard', chance: 0.04 }
    ],
    desc: 'A lean forest predator that has learned to trail the Majiku raiding parties south, picking off whatever they leave behind.'
  },

  // ---------- Level 7 (Kuraan Border Woods variety) ----------
  {
    id: 'kuraan_wind_spirit',
    name: 'Whispering Wind Spirit',
    level: 7,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 7,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 7,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 7,
    armor: 3, // spell-wall profile: near-formless, but magicArmor well above armor
    magicArmor: 10,
    element: 'Wind',
    resistances: { Wind: 0.6, Earth: -0.3 }, // an air spirit grounded and battered by Earth-grade force
    techs: [],
    xp: BALANCE.MONSTER_XP(7),
    goldMin: 6,
    goldMax: 14,
    shardChance: 0.06,
    drops: [
      { itemId: 'crystal_energy_shard', chance: 0.08 },
      { itemId: 'potion_healing', chance: 0.08 }
    ],
    desc: 'A near-formless eddy of wind given fitful will by stray Anima, said by Kuraan hunters to murmur half-words in no language they know.'
  },

  // ---------- Level 8 (Kuraan Border Woods variety) ----------
  {
    id: 'majiku_beastmaster',
    name: 'Majiku Beastmaster',
    level: 8,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 8,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 8,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 8,
    armor: 9, // tank profile: armor above level, backed by two techs
    magicArmor: 5,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 }, // matches the established Majiku Dark/Light profile
    techs: ['mon_hunters_mark', 'mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(8),
    goldMin: 7,
    goldMax: 16,
    shardChance: 0.06,
    drops: [
      { itemId: 'hth_monks_wraps', chance: 0.03 },
      { itemId: 'potion_healing', chance: 0.1 }
    ],
    desc: 'A Majiku tribesman who fights alongside a pack of trained forest beasts, directing their attacks with sharp whistles and old ancestor-curses.'
  },

  // ---------- Boss (level 10) ----------
  {
    id: 'estari_ruin_warden',
    name: 'Ruin Warden of the Estari',
    level: 10,
    boss: true,
    hp: 20 + 12 * 10 + 120, // invented: boss gets a flat HP premium over the regular-monster ballpark
    energy: 140, // invented: 40 + 10*level (retuned at Phase 3 milestone gate; see BALANCE.MONSTER_ATTACK_ENERGY_COST)
    damage: 3 + 2 * 10 + 10, // invented: boss gets a flat damage premium
    armor: 12,
    magicArmor: 12,
    element: 'Dark',
    resistances: { Dark: 0.5, Earth: 0.25, Light: -0.5 },
    techs: ['mon_stone_slam', 'mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(10) * 3, // invented: boss XP premium
    goldMin: 30,
    goldMax: 60,
    shardChance: 0.5,
    drops: [
      { itemId: 'sword_arkan_runeblade', chance: 0.1 },
      { itemId: 'heavy_legs_warplate_legguards', chance: 0.08 },
      { itemId: 'lore_estari_shard_tablet', chance: 0.25 },
      // Phase 6a: class quest materials for "The Trials of Eldor" (js/data/quests.js).
      // Appended last so prior loot rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'quest_condensed_anima_core', chance: 0.6 },
      { itemId: 'quest_estari_ward_fragment', chance: 0.6 },
      // Phase 9: unique equipment (js/data/items.js) — boss signature. Appended last so prior
      // loot rates are unchanged.
      { itemId: 'rod_wardens_anima_core', chance: 0.04 }
    ],
    desc: 'The last active guardian of a buried Estari excavation site, its stone core corrupted by centuries of restless Anima.'
  },

  // =====================================================================
  // Phase 4: Gares Riverbanks (level 9-12) — river/wetland flavored, invented, lore-consistent
  // with the Majiku raids and Anima-touched wildlife described in DESIGN.md §2/§7. Same balance
  // ballpark as the header comment: hp ~= 20 + 12*level, damage ~= 3 + 2*level, armor ~= level
  // (capped well under a same-level warrior's damage output per the milestone-gate retune),
  // energy = 40 + 10*level (reviewer patch, BALANCE.MONSTER_ATTACK_ENERGY_COST comment).
  // =====================================================================

  // ---------- Level 7: Oruk (Phase 5 quest monster) ----------
  // archived: Recent_Updates.md 2007-04-06 "The Oruk quest can only be completed by heroes
  // greater than level 5 but less than 10" — that level-5-to-10 band is the only archived fact
  // about the Oruk; the monster itself, its stats, and its lair are invented. Placed in Kuraan
  // Border Woods alongside the Majiku (Oruk reinterpreted as a savage, tribal raider distinct
  // from the Majiku scouts/shamans already hunted there).
  {
    id: 'oruk_ravager',
    name: 'Oruk Ravager',
    level: 7,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 7,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 7,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 7,
    armor: 7,
    magicArmor: 2,
    element: null,
    resistances: {},
    techs: ['mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(7),
    goldMin: 6,
    goldMax: 14,
    shardChance: 0.05,
    drops: [
      { itemId: 'potion_healing', chance: 0.08 }
    ],
    desc: 'A hulking raider of the Oruk tribes, driven south into the Kuraan borderlands by hunger or by worse.'
  },

  // ---------- Level 9 ----------
  {
    id: 'gares_river_stalker',
    name: 'River Stalker',
    level: 9,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 9,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 9,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 9,
    armor: 9, // invented: armor ~= level (capped well under a same-level warrior's damage — milestone-gate retune)
    magicArmor: 3,
    element: 'Water',
    resistances: { Water: 0.5 },
    techs: ['mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(9),
    goldMin: 8,
    goldMax: 18,
    shardChance: 0.08,
    drops: [
      { itemId: 'knife_gares_fang', chance: 0.05 },
      { itemId: 'potion_healing', chance: 0.1 },
      // Phase 5: quest material for "Riverweed for the Synthesis Shop" (js/data/quests.js).
      { itemId: 'quest_riverweed_bundle', chance: 0.5 }
    ],
    desc: 'A sinewy amphibious predator that lurks in the reeds of the Gares delta, dragging prey under with a crushing bite.'
  },

  // ---------- Level 10 ----------
  {
    id: 'gares_majiku_raider',
    name: 'Majiku River Raider',
    level: 10,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 10,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 10,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 10,
    armor: 10,
    magicArmor: 5,
    element: 'Wind',
    resistances: { Wind: 0.5 },
    techs: ['mon_hunters_mark'],
    xp: BALANCE.MONSTER_XP(10),
    goldMin: 9,
    goldMax: 20,
    shardChance: 0.08,
    drops: [
      { itemId: 'sword_riverguard_falchion', chance: 0.05 },
      { itemId: 'medium_body_riverguard_brigandine', chance: 0.05 },
      // Phase 5: quest material for "Eldor: Dr. Ferrier" (js/data/quests.js) — Majiku raiders
      // this far south carry the same blade-tip venom glands.
      { itemId: 'quest_majiku_venom_gland', chance: 0.5 },
      // Phase 9: unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'sword_raiders_ironclaw_blade', chance: 0.01 }
    ],
    desc: 'A Majiku raiding party has pushed this far south along the river, striking Eldor trade barges before melting back into the reeds.'
  },

  // ---------- Level 11 ----------
  {
    id: 'gares_anima_touched_heron',
    name: 'Anima-Touched Heron',
    level: 11,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 11,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 11,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 11,
    armor: 8,
    magicArmor: 14,
    element: 'Light',
    resistances: { Light: 0.5, Dark: -0.25 },
    techs: ['mon_static_arc'],
    xp: BALANCE.MONSTER_XP(11),
    goldMin: 10,
    goldMax: 22,
    shardChance: 0.1,
    drops: [
      { itemId: 'rod_anima_touched_branch', chance: 0.05 },
      { itemId: 'light_head_wetland_cowl', chance: 0.06 },
      // Phase 5: quest material for "Riverweed for the Synthesis Shop" (js/data/quests.js) —
      // the heron nests in the same riverweed beds the alchemist wants harvested.
      { itemId: 'quest_riverweed_bundle', chance: 0.5 }
    ],
    desc: 'A wading bird grown unnaturally large and luminous from decades near a leaking Anima seam beneath the riverbed.'
  },

  // ---------- Level 12 ----------
  {
    id: 'gares_current_wraith',
    name: 'Current Wraith',
    level: 12,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 12,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 12,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 12,
    armor: 9,
    magicArmor: 16,
    element: 'Dark',
    resistances: { Dark: 0.5, Fire: -0.25 },
    techs: ['mon_dark_hex', 'mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(12),
    goldMin: 12,
    goldMax: 26,
    shardChance: 0.12,
    drops: [
      { itemId: 'potion_greater_healing', chance: 0.1 },
      { itemId: 'medium_feet_reinforced_boots', chance: 0.05 }
    ],
    desc: 'A drowned soul bound to the river’s current, said to be a Majiku raider who drank too deep of unrefined Anima runoff.'
  },

  // ---------- Level 9 (Gares Riverbanks variety) ----------
  {
    id: 'gares_bog_adder',
    name: 'Gares Bog Adder',
    level: 9,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 9,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 9,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 9,
    armor: 5, // glass cannon: thin scales, relies on venom over hide
    magicArmor: 2,
    element: null,
    resistances: {},
    techs: ['mon_venomous_bite'],
    xp: BALANCE.MONSTER_XP(9),
    goldMin: 8,
    goldMax: 18,
    shardChance: 0.08,
    drops: [
      { itemId: 'potion_healing', chance: 0.1 },
      { itemId: 'knife_gares_fang', chance: 0.02 }
    ],
    desc: 'A fat-bodied adder that suns itself on the Gares mudflats, striking with a venom far deadlier than its size suggests.'
  },

  // ---------- Level 11 (Gares Riverbanks variety) ----------
  {
    id: 'gares_shellback',
    name: 'Riverbank Shellback',
    level: 11,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 11,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 11,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 11,
    armor: 16, // tank profile: armored shellback, well above the level ~= armor baseline
    magicArmor: 3,
    element: 'Water',
    resistances: { Water: 0.5 }, // thick shell resists broadly; no vulnerability entry
    techs: [],
    xp: BALANCE.MONSTER_XP(11),
    goldMin: 10,
    goldMax: 22,
    shardChance: 0.09,
    drops: [
      { itemId: 'medium_body_riverguard_brigandine', chance: 0.03 },
      { itemId: 'potion_healing', chance: 0.1 }
    ],
    desc: 'A broad-shelled river turtle grown to the size of a rowboat, content to let hunters batter themselves against its hide.'
  },

  // ---------- Level 12 (Gares Riverbanks variety) ----------
  {
    id: 'gares_torrent_naga',
    name: 'Gares Torrent Naga',
    level: 12,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 12,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 12,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 12,
    armor: 6, // spell-wall profile: magicArmor well above armor
    magicArmor: 15,
    element: 'Water',
    resistances: { Water: 0.5, Fire: -0.3 },
    techs: ['mon_water_torrent'],
    xp: BALANCE.MONSTER_XP(12),
    goldMin: 12,
    goldMax: 26,
    shardChance: 0.12,
    drops: [
      { itemId: 'rod_anima_touched_branch', chance: 0.03 },
      { itemId: 'potion_greater_healing', chance: 0.08 },
      // Phase 9: unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'rod_tideglass_conduit', chance: 0.01 }
    ],
    desc: 'A serpentine naga that hunts the deeper Gares channels, hurling driving torrents of Water-grade Anima at anything that strays too close.'
  },

  // =====================================================================
  // Phase 6b: Endgame World Expansion (DESIGN.md §2/§10) — Northern Barrier Foothills, Isle of
  // Juneros, Ruins of Kastengard, Kastengard: The Deep Vaults (js/data/areas.js). Same balance
  // ballpark as the header comment: hp = 20+12*level, damage = 3+2*level, armor ~= level (capped
  // well under a same-level warrior's expected total damage — weapon + stat — per the
  // estari_loose_rubble milestone-gate retune comment), energy = 40+10*level
  // (BALANCE.MONSTER_ATTACK_ENERGY_COST), xp = BALANCE.MONSTER_XP(level).
  // =====================================================================

  // ---------- Northern Barrier Foothills (level 13-15) ----------
  {
    id: 'foothills_frost_ram',
    name: 'Frost Ram',
    level: 13,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 13,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 13,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 13,
    armor: 13,
    magicArmor: 4,
    element: 'Earth',
    resistances: { Earth: 0.5, Fire: -0.25 },
    techs: ['mon_stone_slam'],
    xp: BALANCE.MONSTER_XP(13),
    goldMin: 12,
    goldMax: 28,
    shardChance: 0.1,
    drops: [
      { itemId: 'medium_legs_foothills_greaves', chance: 0.05 },
      { itemId: 'potion_greater_healing', chance: 0.1 }
    ],
    desc: 'A shaggy, thick-horned ram that charges downslope from the mountain wall no Human or Arkan has ever crossed (Averast.md).'
  },

  // ---------- Level 14 ----------
  {
    id: 'foothills_barrier_wolf',
    name: 'Barrier Wolf',
    level: 14,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 14,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 14,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 14,
    armor: 10,
    magicArmor: 6,
    element: 'Wind',
    resistances: { Wind: 0.5 },
    techs: ['mon_hunters_mark', 'mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(14),
    goldMin: 13,
    goldMax: 30,
    shardChance: 0.1,
    drops: [
      { itemId: 'knife_juneros_tidefang', chance: 0.03 },
      { itemId: 'potion_greater_healing', chance: 0.1 }
    ],
    desc: 'A lean, pale-furred wolf that runs the foothills in tireless packs, said to howl at the mountain wind for hours.'
  },

  // ---------- Level 15 ----------
  {
    id: 'foothills_stoneback_giant',
    name: 'Stoneback Giant',
    level: 15,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 15,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 15,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 15,
    armor: 15,
    magicArmor: 5,
    element: 'Earth',
    resistances: { Earth: 0.5, Water: -0.25 },
    techs: ['mon_stone_slam'],
    xp: BALANCE.MONSTER_XP(15),
    goldMin: 14,
    goldMax: 32,
    shardChance: 0.12,
    drops: [
      { itemId: 'sword_saratus_battlemage_blade', chance: 0.03 },
      { itemId: 'heavy_body_juneros_scaleplate', chance: 0.04 },
      { itemId: 'quest_frostram_hide', chance: 0.5 },
      // Phase 9: unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'heavy_body_stoneback_warplate', chance: 0.01 }
    ],
    desc: 'A hulking, lichen-crusted giant said to be part of the mountain wall itself, roused only when something disturbs its slope.'
  },

  // ---------- Level 14 (Northern Barrier Foothills variety) ----------
  {
    id: 'foothills_gale_harrier',
    name: 'Gale Harrier',
    level: 14,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 14,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 14,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 14,
    armor: 8, // balanced flier: armor a little under level, mobility over hide
    magicArmor: 5,
    element: 'Wind',
    resistances: { Wind: 0.5 },
    techs: ['mon_wind_buffet'],
    xp: BALANCE.MONSTER_XP(14),
    goldMin: 13,
    goldMax: 30,
    shardChance: 0.1,
    drops: [
      { itemId: 'knife_juneros_tidefang', chance: 0.02 },
      { itemId: 'potion_greater_healing', chance: 0.1 }
    ],
    desc: 'A great taloned raptor that rides the gale off the mountain wall, buffeting hunters off their footing before it strikes.'
  },

  // ---------- Level 15 (Northern Barrier Foothills variety) ----------
  {
    id: 'foothills_ridge_hound',
    name: 'Foothills Ridge Hound',
    level: 15,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 15,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 15,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 15,
    armor: 9, // glass cannon: below the Stoneback Giant's tank armor at the same level
    magicArmor: 2,
    element: null,
    resistances: {},
    techs: [],
    xp: BALANCE.MONSTER_XP(15),
    goldMin: 14,
    goldMax: 32,
    shardChance: 0.11,
    drops: [
      { itemId: 'medium_legs_foothills_greaves', chance: 0.03 },
      { itemId: 'potion_greater_healing', chance: 0.1 }
    ],
    desc: 'A rangy, pack-hunting hound that runs the high ridgelines in tireless bursts, trading hide for raw speed.'
  },

  // ---------- Boss: Foothills Matriarch (level 18, gate-boss) ----------
  {
    id: 'foothills_matriarch',
    name: 'Matriarch of the High Camp',
    level: 18,
    boss: true,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 18 + 12 * 18, // invented: boss flat HP premium, ~12*level pattern
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 18,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 18 + 12, // invented: boss flat damage premium
    armor: 16,
    magicArmor: 10,
    element: 'Wind',
    resistances: { Wind: 0.5, Earth: 0.25, Fire: -0.5 },
    techs: ['mon_hunters_mark', 'mon_stone_slam', 'mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(18) * 3, // invented: boss XP premium
    goldMin: 45,
    goldMax: 85,
    shardChance: 0.5,
    drops: [
      { itemId: 'polearm_foothills_pike', chance: 0.12 },
      { itemId: 'medium_body_foothills_hauberk', chance: 0.1 },
      { itemId: 'quest_matriarch_horn', chance: 0.6 },
      // Phase 9: unique equipment (js/data/items.js) — boss signature. Appended last so prior
      // loot rates are unchanged.
      { itemId: 'hth_matriarchs_fang_wraps', chance: 0.04 }
    ],
    desc: 'The eldest and largest of the Barrier Wolves\' pack-mothers, who has driven every hunting party back from the western passes for a generation. The Isle of Juneros lies beyond her camp — nothing crosses without her leave.'
  },

  // ---------- Isle of Juneros (level 19-22) ----------
  {
    id: 'juneros_tidewalker',
    name: 'Tidewalker',
    level: 19,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 19,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 19,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 19,
    armor: 14,
    magicArmor: 10,
    element: 'Water',
    resistances: { Water: 0.5, Fire: -0.25 },
    techs: ['mon_tidal_crush'],
    xp: BALANCE.MONSTER_XP(19),
    goldMin: 16,
    goldMax: 36,
    shardChance: 0.12,
    drops: [
      { itemId: 'knife_juneros_tidefang', chance: 0.05 },
      { itemId: 'potion_greater_healing', chance: 0.12 },
      // Phase 9: unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'polearm_tidewalkers_harpoon', chance: 0.008 }
    ],
    desc: 'A brine-slick predator that stalks the tideline of the isle\'s small human settlements (Averast.md), never straying far from the surf.'
  },

  // ---------- Level 20 ----------
  {
    id: 'juneros_reefstalker',
    name: 'Reefstalker',
    level: 20,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 20,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 20,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 20,
    armor: 20,
    magicArmor: 8,
    element: 'Water',
    resistances: { Water: 0.5 },
    techs: ['mon_tidal_crush', 'mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(20),
    goldMin: 18,
    goldMax: 40,
    shardChance: 0.14,
    drops: [
      { itemId: 'heavy_head_juneros_scalehelm', chance: 0.05 },
      { itemId: 'crystal_pure_anima', chance: 0.08 },
      // v1.2 Phase 3 (Content-B): graded Crystal (js/data/items.js). Appended last so prior loot
      // rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'crystal_bclass_1', chance: 0.06 }
    ],
    desc: 'A scale-plated reef predator, its hide the model for the armor Juneros militia wear on patrol.'
  },

  // ---------- Level 20 (Isle of Juneros variety) ----------
  {
    id: 'juneros_riptide_hunter',
    name: 'Riptide Hunter',
    level: 20,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 20,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 20,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 20,
    armor: 14, // glass cannon: below the Reefstalker's tank armor at the same level
    magicArmor: 6,
    element: 'Water',
    resistances: { Water: 0.5, Wind: -0.25 },
    techs: [],
    xp: BALANCE.MONSTER_XP(20),
    goldMin: 18,
    goldMax: 40,
    shardChance: 0.14,
    drops: [
      { itemId: 'heavy_head_juneros_scalehelm', chance: 0.04 },
      { itemId: 'crystal_pure_anima', chance: 0.06 },
      // v1.2 Phase 3 (Content-B): graded Sphere (js/data/items.js). Appended last so prior loot
      // rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'sphere_bclass_1', chance: 0.06 }
    ],
    desc: 'A quicksilver eel-thing that rides the isle\'s riptides, striking fast and hard with none of the Reefstalker\'s armored patience.'
  },

  // ---------- Level 21 (Isle of Juneros variety) ----------
  {
    id: 'juneros_coral_warden',
    name: 'Coral Warden',
    level: 21,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 21,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 21,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 21,
    armor: 10, // spell-wall profile: magicArmor well above armor
    magicArmor: 22,
    element: 'Water',
    resistances: { Water: 0.6, Fire: -0.3 },
    techs: ['mon_water_torrent'],
    xp: BALANCE.MONSTER_XP(21),
    goldMin: 19,
    goldMax: 42,
    shardChance: 0.14,
    drops: [
      { itemId: 'light_head_arkan_silk_hood', chance: 0.04 },
      { itemId: 'crystal_pure_anima', chance: 0.08 },
      // Phase 9: unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'shield_coral_wardens_bulwark', chance: 0.008 }
    ],
    desc: 'A merfolk adept who has made a shrine of a sunken reef, wreathed in coral wards that shrug off blades far better than spells.'
  },

  // ---------- Level 22 ----------
  {
    id: 'juneros_drowned_settler',
    name: 'Drowned Settler',
    level: 22,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 22,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 22,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 22,
    armor: 16,
    magicArmor: 18,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_tidal_crush'],
    xp: BALANCE.MONSTER_XP(22),
    goldMin: 20,
    goldMax: 44,
    shardChance: 0.16,
    drops: [
      { itemId: 'light_head_arkan_silk_hood', chance: 0.05 },
      { itemId: 'quest_settler_locket', chance: 0.5 },
      // v1.2 Phase 3 (Content-B): graded Crystal/Sphere (js/data/items.js). Appended last so
      // prior loot rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'crystal_bclass_1', chance: 0.05 },
      { itemId: 'sphere_bclass_1', chance: 0.05 }
    ],
    desc: 'A settler lost to the isle\'s waters long ago, still walking the tideline with the sea\'s own restlessness in place of breath.'
  },

  // ---------- Boss: Juneros Leviathan (level 25, gate-boss) ----------
  {
    id: 'juneros_leviathan',
    name: 'The Juneros Leviathan',
    level: 25,
    boss: true,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 25 + 12 * 25,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 25,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 25 + 14,
    armor: 22,
    magicArmor: 16,
    element: 'Water',
    resistances: { Water: 0.6, Fire: -0.4 },
    techs: ['mon_tidal_crush', 'mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(25) * 3,
    goldMin: 60,
    goldMax: 110,
    shardChance: 0.55,
    drops: [
      { itemId: 'polearm_foothills_pike', chance: 0.08 },
      { itemId: 'heavy_body_juneros_scaleplate', chance: 0.12 },
      { itemId: 'quest_leviathan_scale', chance: 0.6 },
      // Phase 9: unique equipment (js/data/items.js) — boss signature. Appended last so prior
      // loot rates are unchanged.
      { itemId: 'heavy_body_leviathanhide_bulwark', chance: 0.04 }
    ],
    desc: 'A vast, water-graded shape that surfaces only for the settlements\' oldest fishing grounds, guarding the deep shoal the way the Matriarch once guarded the western passes.'
  },

  // ---------- Ruins of Kastengard (level 26-29) ----------
  {
    id: 'kastengard_wardframe',
    name: 'Kastengard Wardframe',
    level: 26,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 26,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 26,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 26,
    armor: 24,
    magicArmor: 14,
    element: 'Star',
    resistances: { Star: 0.5, Earth: -0.25 },
    techs: ['mon_static_arc'],
    xp: BALANCE.MONSTER_XP(26),
    goldMin: 24,
    goldMax: 50,
    shardChance: 0.18,
    drops: [
      { itemId: 'medium_body_custodian_plate', chance: 0.04 },
      { itemId: 'crystal_pure_anima', chance: 0.1 },
      // v1.2 Phase 3 (Content-B): graded Crystal (js/data/items.js). Appended last so prior loot
      // rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'crystal_bclass_2', chance: 0.07 }
    ],
    // archived: Chapter_I.md — "the Society established a base of operations known as Kastengard...
    // discovered many uses for Anima, particularly in magic and technology."
    desc: 'An old Society of Modern Magic sentry-construct, reactivated by whatever has been re-arming Kastengard\'s halls after three centuries of silence (js/data/story.js chapter_2).'
  },

  // ---------- Level 27 ----------
  {
    id: 'kastengard_anima_wraith',
    name: 'Anima Wraith',
    level: 27,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 27,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 27,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 27,
    armor: 18,
    magicArmor: 26,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_anima_lance'],
    // v1.2 Phase 1 item 8: Curse status. NAME [archived] Version_2.1_Changes.md ("Added new
    // detrimental effects (Poison, Haunting, Curse)"); rate [invented] (BALANCE.CURSE_APPLY_CHANCE).
    // Given to this monster specifically for testability — a "raw... Anima given a fleeting will
    // of its own" is exactly the thematic undead/anima flavor Phase 1 asked for; Phase 3 attaches
    // curseChance to further thematic monsters.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    xp: BALANCE.MONSTER_XP(27),
    goldMin: 26,
    goldMax: 54,
    shardChance: 0.2,
    drops: [
      { itemId: 'rod_arkan_runic_conduit', chance: 0.04 },
      { itemId: 'light_body_kastengard_wardweave', chance: 0.05 },
      // v1.2 Phase 3 (Content-B): graded Sphere (js/data/items.js). Appended last so prior loot
      // rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'sphere_bclass_2', chance: 0.07 }
    ],
    desc: 'Raw, ninth-dimensional Anima given a fleeting will of its own, escaped from some cracked seal deep in Kastengard\'s vaults.'
  },

  // ---------- Level 28 (Ruins of Kastengard variety) ----------
  {
    id: 'kastengard_earthbound_sentinel',
    name: 'Earthbound Sentinel',
    level: 28,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 28,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 28,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 28,
    armor: 30, // tank profile: heaviest of the Kastengard trio, well above the level ~= armor baseline
    magicArmor: 10,
    element: 'Earth',
    resistances: { Earth: 0.5, Water: -0.3 },
    techs: ['mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(28),
    goldMin: 27,
    goldMax: 56,
    shardChance: 0.19,
    drops: [
      { itemId: 'medium_body_custodian_plate', chance: 0.04 },
      { itemId: 'crystal_pure_anima', chance: 0.1 },
      // Phase 9: unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'hth_custodian_wrought_gauntlets', chance: 0.006 }
    ],
    desc: 'The oldest and heaviest of the Society\'s sentry-constructs, built from Estari-quarried stone long before the Wardframes ever walked Kastengard\'s halls.'
  },

  // ---------- Level 29 ----------
  {
    id: 'kastengard_society_remnant',
    name: 'Society Remnant',
    level: 29,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 29,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 29,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 29,
    armor: 22,
    magicArmor: 22,
    element: 'Light',
    resistances: { Light: 0.4, Dark: 0.4, Earth: -0.25 },
    techs: ['mon_anima_lance', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(29),
    goldMin: 30,
    goldMax: 60,
    shardChance: 0.22,
    drops: [
      { itemId: 'knife_juneros_tidefang', chance: 0.04 },
      { itemId: 'quest_society_ledger_page', chance: 0.5 },
      // v1.2 Phase 3 (Content-B): graded Crystal (js/data/items.js). Appended last so prior loot
      // rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'crystal_bclass_2', chance: 0.06 }
    ],
    // archived: Chapter_I.md — "the runologist research group dispersed" when the Council
    // condemned the Society; a remnant left behind, still following orders three centuries stale.
    desc: 'A preserved runologist of the old underground Society, sustained past death by the same Anima it once studied, still cataloguing a research group that dispersed three hundred years ago.'
  },

  // ---------- Boss: Kastengard Custodian (level 32, gate-boss) ----------
  {
    id: 'kastengard_custodian',
    name: 'The Kastengard Custodian',
    level: 32,
    boss: true,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 32 + 12 * 32,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 32,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 32 + 16,
    armor: 30,
    magicArmor: 24,
    element: 'Star',
    resistances: { Star: 0.5, Dark: 0.25, Earth: -0.5 },
    techs: ['mon_static_arc', 'mon_anima_lance', 'mon_stone_slam'],
    xp: BALANCE.MONSTER_XP(32) * 3,
    goldMin: 80,
    goldMax: 140,
    shardChance: 0.6,
    drops: [
      { itemId: 'sword_kastengard_relic_blade', chance: 0.1 },
      { itemId: 'heavy_body_vault_bulwark', chance: 0.08 },
      { itemId: 'quest_custodian_core_shard', chance: 0.6 },
      // v1.2 Phase 3 (Content-B): graded Crystal/Sphere (js/data/items.js). Appended last so
      // prior loot rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'crystal_bclass_3', chance: 0.15 },
      { itemId: 'sphere_bclass_3', chance: 0.15 }
    ],
    // invented successor to the Estari construct line (estari_construct_sentinel/estari_ruin_warden)
    // — the Society's own attempt at a lasting guardian, built from what it learned excavating
    // the Estari ruins before departing for Kastengard (Chapter_I.md).
    desc: 'The largest and last-functioning construct the Society of Modern Magic ever built, an Estari-inspired successor left to guard the vault below while its makers climbed aboard the Skyspire.'
  },

  // ---------- Kastengard: The Deep Vaults (level 33-35, final zone) ----------
  {
    id: 'vault_anima_construct',
    name: 'Vault Anima Construct',
    level: 33,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 33,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 33,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 33,
    armor: 30,
    magicArmor: 20,
    element: 'Earth',
    resistances: { Earth: 0.5, Water: -0.25 },
    techs: ['mon_stone_slam', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(33),
    goldMin: 34,
    goldMax: 68,
    shardChance: 0.24,
    drops: [
      { itemId: 'polearm_vault_reaver', chance: 0.04 },
      { itemId: 'medium_body_custodian_plate', chance: 0.05 },
      // v1.2 Phase 3 (Content-B): graded Crystal/Sphere (js/data/items.js). Appended last so
      // prior loot rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'crystal_bclass_4', chance: 0.08 },
      { itemId: 'sphere_bclass_4', chance: 0.08 }
    ],
    desc: 'A hulking construct built from the same Anima-bearing stone the Estari once carved, three centuries idle in the Society\'s deepest vault.'
  },

  // ---------- Level 34 ----------
  {
    id: 'vault_runic_horror',
    name: 'Runic Horror',
    level: 34,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 34,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 34,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 34,
    armor: 24,
    magicArmor: 30,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.3 },
    techs: ['mon_dark_hex', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(34),
    goldMin: 36,
    goldMax: 72,
    shardChance: 0.26,
    drops: [
      { itemId: 'knife_custodian_needle', chance: 0.04 },
      { itemId: 'crystal_pure_anima', chance: 0.14 },
      // v1.2 Phase 3 (Content-B): premium Crystal/Sphere (js/data/items.js). Appended last so
      // prior loot rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'crystal_light', chance: 0.03 },
      { itemId: 'sphere_dark', chance: 0.03 }
    ],
    desc: 'A tangle of failed warding runes given monstrous, malicious shape — the Society\'s own experiments turned against whoever disturbs their rest.'
  },

  // ---------- Level 35 ----------
  {
    id: 'vault_forsaken_archivist',
    name: 'Forsaken Archivist',
    level: 35,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 35,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 35,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 35,
    armor: 28,
    magicArmor: 32,
    element: 'Light',
    resistances: { Light: 0.4, Dark: 0.4, Star: -0.25 },
    techs: ['mon_anima_lance', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(35),
    goldMin: 38,
    goldMax: 76,
    shardChance: 0.28,
    drops: [
      { itemId: 'rod_eidas_remnant_wand', chance: 0.04 },
      { itemId: 'heavy_body_vault_bulwark', chance: 0.05 },
      { itemId: 'quest_archivist_key', chance: 0.5 },
      // v1.2 Phase 3 (Content-B): premium Crystal/Sphere (js/data/items.js). Appended last so
      // prior loot rates are unchanged (drops roll top-down, first hit wins).
      { itemId: 'crystal_dark', chance: 0.03 },
      { itemId: 'sphere_light', chance: 0.03 }
    ],
    desc: 'The last preserved record-keeper of the Society of Modern Magic, still guarding the vault\'s deepest archive from researchers who left for the red moon three centuries ago.'
  },

  // ---------- FINAL BOSS: Eidas' Echo (level 40) ----------
  // invented Chapter II payoff (js/data/story.js chapter_2: "somewhere above Van Arius, past the
  // clouds, a twinkling light still crosses the night sky on quiet evenings, exactly where the
  // old stories say the Skyspire vanished"). An Anima-projection remnant of Eidas himself, cast
  // down (or reaching down) from the red moon into the Skyspire's old ground anchor. Light+Dark
  // resist profile (a "divine race" founder who commanded both healing and cursing Anima grades),
  // vulnerable to nothing (final-boss floor), big HP/damage premiums matching the
  // estari_ruin_warden pattern scaled to level 40.
  {
    id: 'eidas_echo',
    name: "Eidas' Echo",
    level: 40,
    boss: true,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 40 + 12 * 40, // invented: boss flat HP premium, ~12*level pattern (matches estari_ruin_warden's +120 at level 10)
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 40,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 40 + 45, // invented: boss flat damage premium — raised at the Phase 7 balance pass (was +20): after the monster-dodge and weapon-tier fixes, a rested level-40 warrior won 100% barely scratched; the final boss must land meaningful hits through ~90 endgame Armor
    armor: 34,
    magicArmor: 34,
    element: 'Dark',
    resistances: { Light: 0.4, Dark: 0.4 }, // vulnerable to nothing: no negative (weakness) entries
    techs: ['mon_dark_hex', 'mon_anima_lance', 'mon_static_arc', 'mon_stone_slam'],
    xp: BALANCE.MONSTER_XP(40) * 3, // invented: boss XP premium
    goldMin: 150,
    goldMax: 260,
    shardChance: 0.75,
    drops: [
      { itemId: 'sword_kastengard_relic_blade', chance: 0.1 },
      { itemId: 'rod_eidas_remnant_wand', chance: 0.1 },
      { itemId: 'heavy_body_vault_bulwark', chance: 0.1 },
      { itemId: 'lore_eidas_final_journal', chance: 1 },
      { itemId: 'quest_eidas_echo_seal', chance: 0.7 },
      // Phase 9: unique equipment (js/data/items.js) — boss signature, the roster's capstone.
      // Appended last so prior loot rates (including the guaranteed journal above) are unchanged.
      { itemId: 'sword_skyspire_ember_blade', chance: 0.05 }
    ],
    desc: 'Not Eidas himself — no living thing could have lasted three centuries — but something of him all the same: an Anima-projection anchored to the old Skyspire ground works, still murmuring about a "divine race" that never came to pass. The last guardian of Kastengard\'s deepest vault, and, perhaps, the answer to what the twinkling light in the night sky has truly been all this time.'
  },

  // =====================================================================
  // Level-Arc Band A (docs/SPEC-ARC-BANDS.md, F2/F3): Forests of Kuraan, levels 41-50 — Kuraan
  // Fringe Woods / Deep Kuraan (js/data/areas.js). Same header formulas, unchanged past level 40:
  // hp = 20+12*level, damage = 3+2*level, energy = 40+10*level, xp = BALANCE.MONSTER_XP(level);
  // armor ~= level (varied per archetype, capped well under a same-level warrior's expected hit,
  // per the estari_loose_rubble milestone-gate retune). Two thematic undead/anima monsters carry
  // curseChance (v1.2 Curse mechanic, BALANCE.CURSE_APPLY_CHANCE) per the phase brief.
  // =====================================================================

  // ---------- Kuraan Fringe Woods (level 41-44) ----------
  {
    id: 'majiku_reclaimer_knight',
    name: 'Majiku Reclaimer Knight',
    level: 41,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 41,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 41,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 41,
    armor: 46, // tank profile: level+5, a Majiku officer dug in to hold the fringe
    magicArmor: 14,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark'],
    xp: BALANCE.MONSTER_XP(41),
    goldMin: 50,
    goldMax: 100,
    shardChance: 0.32,
    drops: [
      { itemId: 'sword_kuraan_reclaimers_blade', chance: 0.03 },
      { itemId: 'crystal_cclass_1', chance: 0.08 },
      { itemId: 'quest_majiku_warband_sigil', chance: 0.5 }
    ],
    desc: 'A Majiku officer dug into the fringe woods with the remnant of his warband, fighting to hold ground the reclamation column means to take back tree by tree.'
  },

  // ---------- Level 42 ----------
  {
    id: 'kuraan_bramble_stalker',
    name: 'Kuraan Bramble Stalker',
    level: 42,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 42,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 42,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 42,
    armor: 28, // glass cannon: thorn-hide over speed, well under level
    magicArmor: 6,
    element: 'Earth',
    resistances: { Earth: 0.5, Fire: -0.25 },
    techs: ['mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(42),
    goldMin: 52,
    goldMax: 104,
    shardChance: 0.34,
    drops: [
      { itemId: 'knife_fringewood_fang', chance: 0.03 },
      { itemId: 'sphere_cclass_1', chance: 0.08 }
    ],
    desc: 'A bramble-hided predator that has learned to nest in the fringe\'s tangled undergrowth, striking from cover before the reclamation column can form a line.'
  },

  // ---------- Level 44 (curse-flavored anima/undead) ----------
  {
    id: 'anima_scarred_revenant',
    name: 'Anima-Scarred Revenant',
    level: 44,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 44,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 44,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 44,
    armor: 32, // spell-wall profile: thin hide, magicArmor well above armor
    magicArmor: 50,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE), same convention as kastengard_anima_wraith
    // — a thematic undead/anima monster for Band A's curse coverage (phase brief).
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_dark_hex', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(44),
    goldMin: 56,
    goldMax: 112,
    shardChance: 0.38,
    drops: [
      { itemId: 'sphere_cclass_1', chance: 0.08 },
      // Band A unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'light_body_kuraan_ashcloak', chance: 0.02 }
    ],
    desc: 'A Majiku dead left to rot in the fringe long enough for stray Anima to scar itself into the corpse, walking still and hungrier than anything that lives.'
  },

  // ---------- Deep Kuraan (level 46-49) ----------
  {
    id: 'majiku_deepwood_witch',
    name: 'Majiku Deepwood Witch',
    level: 46,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 46,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 46,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 46,
    armor: 34, // spell-wall profile: magicArmor well above armor
    magicArmor: 60,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(46),
    goldMin: 60,
    goldMax: 120,
    shardChance: 0.42,
    drops: [
      { itemId: 'rod_majiku_wardbreaker', chance: 0.03 },
      { itemId: 'crystal_cclass_2', chance: 0.08 }
    ],
    desc: 'A Majiku war-shaman grown stronger in the deep woods, drawing on ancestral spirits far older and angrier than any the fringe scouts answer to.'
  },

  // ---------- Level 48 (curse-flavored anima/undead) ----------
  {
    id: 'kuraan_hollow_wraith',
    name: 'Kuraan Hollow Wraith',
    level: 48,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 48,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 48,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 48,
    armor: 36,
    magicArmor: 64,
    element: 'Dark',
    resistances: { Dark: 0.5, Star: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE) — Band A's second thematic curse carrier.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_anima_lance', 'mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(48),
    goldMin: 64,
    goldMax: 128,
    shardChance: 0.46,
    drops: [
      { itemId: 'sphere_cclass_2', chance: 0.08 },
      // Band A unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'rod_ashenbrand_conduit', chance: 0.02 }
    ],
    desc: 'A Majiku Deepwood Witch\'s own failed ritual, hollowed out by the Anima it tried to bind rather than empowered by it — what is left drifts through Deep Kuraan looking for whatever it lost.'
  },

  // ---------- Level 49 ----------
  {
    id: 'majiku_ironclad_vanguard',
    name: 'Majiku Ironclad Vanguard',
    level: 49,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 49,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 49,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 49,
    armor: 56, // tank profile: level+7, the Warlord's own heavy vanguard
    magicArmor: 18,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark', 'mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(49),
    goldMin: 66,
    goldMax: 132,
    shardChance: 0.48,
    drops: [
      { itemId: 'stone_energy_kuraan', chance: 0.08 },
      { itemId: 'quest_majiku_warband_sigil', chance: 0.5 }
    ],
    desc: 'One of the Majiku Warlord\'s own ironclad vanguard, held in reserve at the deep camp to answer for anything the fringe scouts and shamans fail to turn back.'
  },

  // ---------- Lair boss: Majiku Warlord (level 50) ----------
  // invented Band A capstone (docs/SPEC-ARC-BANDS.md): flat hp/damage premiums per the F1
  // CONVENTION NOTES block (js/balance.js) — hp premium +12*level (matches the estari_ruin_warden/
  // foothills_matriarch/juneros_leviathan/kastengard_custodian/eidas_echo pattern), damage premium
  // round(1.5*level+10) = round(85) = 85 (F1's sim-tuned starting ballpark for a real level-50
  // boss), xp premium x3. "Winnable but costly" per the difficulty contract, CLAUDE.md.
  {
    id: 'majiku_warlord',
    name: 'The Majiku Warlord',
    level: 50,
    boss: true,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 50 + 12 * 50, // 620 + 600 = 1220
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 50,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 50 + Math.round(1.5 * 50 + 10), // 103 + 85 = 188
    armor: 46,
    magicArmor: 44,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_hunters_mark', 'mon_earthen_crush', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(50) * 3, // invented: boss XP premium
    goldMin: 220,
    goldMax: 380,
    shardChance: 0.55,
    drops: [
      { itemId: 'heavy_head_kuraan_warhelm', chance: 0.1 },
      { itemId: 'quest_majiku_warband_sigil', chance: 0.6 },
      // Band A unique equipment (js/data/items.js) — boss signature. Appended last so prior loot
      // rates (including the guaranteed-ish sigil above) are unchanged.
      { itemId: 'sword_warlords_broken_oath', chance: 0.05 }
    ],
    desc: 'The Majiku commander who has held the Forests of Kuraan for a generation, dug into a deep camp behind wardframes and ironclad vanguard alike. Breaking him is the whole reason the Reclamation Camp exists — costly, but not, at last, impossible.'
  },

  // =====================================================================
  // Level-Arc Band B (docs/SPEC-ARC-BANDS.md, F2/F3): Majiku Highlands, levels 51-60 — Majiku
  // Border Steppe / Highland War-Camps (js/data/areas.js). Same header formulas, unchanged:
  // hp = 20+12*level, damage = 3+2*level, energy = 40+10*level, xp = BALANCE.MONSTER_XP(level);
  // armor ~= level (varied per archetype, capped well under a same-level warrior's expected hit,
  // per the estari_loose_rubble milestone-gate retune). goldMin/goldMax/shardChance continue the
  // Band A linear trend (goldMin = 50+2*(level-41), goldMax = 2*goldMin, shardChance =
  // 0.32+0.02*(level-41)). Two thematic undead/anima monsters carry curseChance (v1.2 Curse
  // mechanic, BALANCE.CURSE_APPLY_CHANCE), continuing Band A's coverage.
  // =====================================================================

  // ---------- Majiku Border Steppe (level 51-54) ----------
  {
    id: 'majiku_steppe_lancer',
    name: 'Majiku Steppe Lancer',
    level: 51,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 51,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 51,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 51,
    armor: 56, // tank profile: level+5, a Majiku officer riding patrol for the host, same profile as majiku_reclaimer_knight
    magicArmor: 14,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark'],
    xp: BALANCE.MONSTER_XP(51),
    goldMin: 70,
    goldMax: 140,
    shardChance: 0.52,
    drops: [
      { itemId: 'sword_majiku_hostbreaker', chance: 0.03 },
      { itemId: 'crystal_dclass_1', chance: 0.08 },
      { itemId: 'quest_majiku_host_standard', chance: 0.5 }
    ],
    desc: 'A Majiku lancer riding patrol along the border steppe, still carrying the host\'s own orders to hold this ground no matter how far the fringe has fallen.'
  },

  // ---------- Level 52 ----------
  {
    id: 'highland_ridgehawk',
    name: 'Highland Ridgehawk',
    level: 52,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 52,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 52,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 52,
    armor: 38, // glass cannon: level-14, same profile as kuraan_bramble_stalker
    magicArmor: 6,
    element: 'Wind',
    resistances: { Wind: 0.5, Earth: -0.25 },
    techs: ['mon_wind_buffet'],
    xp: BALANCE.MONSTER_XP(52),
    goldMin: 72,
    goldMax: 144,
    shardChance: 0.54,
    drops: [
      { itemId: 'knife_steppewind_edge', chance: 0.03 },
      { itemId: 'sphere_dclass_1', chance: 0.08 }
    ],
    desc: 'A ridge-nesting raptor grown huge and vicious on the high steppe wind, diving on the border patrols before they ever see it coming.'
  },

  // ---------- Level 54 (curse-flavored anima/undead) ----------
  {
    id: 'anima_scarred_highlander',
    name: 'Anima-Scarred Highlander',
    level: 54,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 54,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 54,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 54,
    armor: 42, // spell-wall profile: level-12, thin hide, magicArmor well above armor
    magicArmor: 68,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE), continuing Band A's anima_scarred_revenant
    // coverage one band north.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_dark_hex', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(54),
    goldMin: 76,
    goldMax: 152,
    shardChance: 0.58,
    drops: [
      { itemId: 'sphere_dclass_1', chance: 0.08 },
      // Band B unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'light_body_highland_ashmantle', chance: 0.02 }
    ],
    desc: 'A border-steppe rider left for dead long enough that stray Anima scarred itself into the corpse — kin to the anima-scarred revenants of Kuraan, but hardened by highland cold instead of fringe rot.'
  },

  // ---------- Highland War-Camps (level 56-59) ----------
  {
    id: 'majiku_hostcaller_shaman',
    name: 'Majiku Hostcaller Shaman',
    level: 56,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 56,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 56,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 56,
    armor: 44, // spell-wall profile: level-12, magicArmor well above armor
    magicArmor: 74,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(56),
    goldMin: 80,
    goldMax: 160,
    shardChance: 0.62,
    drops: [
      { itemId: 'rod_hostcallers_ruin', chance: 0.03 },
      { itemId: 'crystal_dclass_2', chance: 0.08 }
    ],
    desc: "A war-shaman who calls the whole host to muster from her ridgeline camp, drawing on ancestral spirits older and angrier than any the border steppe riders answer to."
  },

  // ---------- Level 58 (curse-flavored anima/undead) ----------
  {
    id: 'highland_hollow_stormwraith',
    name: 'Highland Hollow Stormwraith',
    level: 58,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 58,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 58,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 58,
    armor: 46,
    magicArmor: 78,
    element: 'Dark',
    resistances: { Dark: 0.5, Star: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE) — Band B's second thematic curse carrier.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_anima_lance', 'mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(58),
    goldMin: 84,
    goldMax: 168,
    shardChance: 0.66,
    drops: [
      { itemId: 'sphere_dclass_2', chance: 0.08 },
      // Band B unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'rod_stormwraiths_core', chance: 0.02 }
    ],
    desc: "A Hostcaller Shaman's own failed ritual, hollowed out by the highland storm-anima it tried to bind rather than empowered by it — kin to Deep Kuraan's hollow wraiths, but crackling with ridgeline static."
  },

  // ---------- Level 59 ----------
  {
    id: 'majiku_hostguard_vanguard',
    name: 'Majiku Hostguard Vanguard',
    level: 59,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 59,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 59,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 59,
    armor: 66, // tank profile: level+7, the Ridge-Chieftain's own vanguard, same profile as majiku_ironclad_vanguard
    magicArmor: 20,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark', 'mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(59),
    goldMin: 86,
    goldMax: 172,
    shardChance: 0.68,
    drops: [
      { itemId: 'stone_energy_majiku', chance: 0.08 },
      { itemId: 'quest_majiku_host_standard', chance: 0.5 }
    ],
    desc: "One of the Ridge-Chieftain's own hostguard vanguard, held behind the war-camp's palisade to answer for anything the border steppe riders and shamans fail to turn back."
  },

  // ---------- Lair boss: Majiku Ridge-Chieftain (level 60) ----------
  // invented Band B capstone (docs/SPEC-ARC-BANDS.md): flat hp/damage premiums per the F1
  // CONVENTION NOTES block (js/balance.js) — hp premium +12*level (matches the majiku_warlord/
  // estari_ruin_warden/eidas_echo pattern), damage premium round(1.5*level+10) = round(100) = 100
  // (F1's sim-tuned starting ballpark for a real level-60 boss), xp premium x3. "Winnable but
  // costly" per the difficulty contract, CLAUDE.md.
  {
    id: 'majiku_ridge_chieftain',
    name: 'The Majiku Ridge-Chieftain',
    level: 60,
    boss: true,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 60 + 12 * 60, // 740 + 720 = 1460
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 60,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 60 + Math.round(1.5 * 60 + 10), // 123 + 100 = 223
    armor: 52,
    magicArmor: 50,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_hunters_mark', 'mon_earthen_crush', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(60) * 3, // invented: boss XP premium
    goldMin: 260,
    goldMax: 440,
    shardChance: 0.6,
    drops: [
      { itemId: 'heavy_head_ridgeplate_helm', chance: 0.1 },
      { itemId: 'quest_majiku_host_standard', chance: 0.6 },
      // Band B unique equipment (js/data/items.js) — boss signature. Appended last so prior loot
      // rates (including the guaranteed-ish standard above) are unchanged.
      { itemId: 'polearm_chieftains_warpike', chance: 0.05 }
    ],
    desc: 'The Majiku commander who holds the whole host together from the ridgeline war-camps, dug in behind shamans, hostguard vanguard, and the highland cold itself. Breaking him breaks the host — the whole reason Serath\'s column pushed this far north.'
  },

  // =====================================================================
  // Level-Arc Band C (docs/SPEC-ARC-BANDS.md, F2/F3): The Frozen Reaches / Ukai approach, levels
  // 61-70 — Glacial Approach / Ukai Undercaverns (js/data/areas.js). Same header formulas,
  // unchanged: hp = 20+12*level, damage = 3+2*level, energy = 40+10*level, xp =
  // BALANCE.MONSTER_XP(level); armor ~= level (varied per archetype, capped well under a
  // same-level warrior's expected hit, per the estari_loose_rubble milestone-gate retune).
  // goldMin/goldMax/shardChance continue the Band A/B linear trend (goldMin = 50+2*(level-41),
  // goldMax = 2*goldMin, shardChance = 0.32+0.02*(level-41)). Two thematic undead/anima monsters
  // carry curseChance (v1.2 Curse mechanic, BALANCE.CURSE_APPLY_CHANCE), continuing Band A/B's
  // coverage.
  // =====================================================================

  // ---------- Glacial Approach (level 61-64) ----------
  {
    id: 'majiku_frost_exile',
    name: 'Majiku Frost-Exile',
    level: 61,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 61,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 61,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 61,
    armor: 66, // tank profile: level+5, a Majiku officer surviving on the ice rather than answering for the Chieftain's defeat, same profile as majiku_reclaimer_knight/majiku_steppe_lancer
    magicArmor: 14,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark'],
    xp: BALANCE.MONSTER_XP(61),
    goldMin: 90,
    goldMax: 180,
    shardChance: 0.72,
    drops: [
      { itemId: 'sword_frosthold_vanguard_blade', chance: 0.03 },
      { itemId: 'crystal_eclass_1', chance: 0.08 },
      { itemId: 'quest_ukai_deep_rune', chance: 0.5 }
    ],
    desc: 'A Majiku officer cast out onto the ice rather than face the reckoning for the Ridge-Chieftain\'s fall, holding what remains of his own honor guard together against the cold and worse.'
  },

  // ---------- Level 62 ----------
  {
    id: 'glacial_frost_stalker',
    name: 'Glacial Frost Stalker',
    level: 62,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 62,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 62,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 62,
    armor: 48, // glass cannon: level-14, same profile as kuraan_bramble_stalker/highland_ridgehawk
    magicArmor: 6,
    element: 'Water',
    resistances: { Water: 0.5, Fire: -0.3 },
    techs: ['mon_water_torrent'],
    xp: BALANCE.MONSTER_XP(62),
    goldMin: 92,
    goldMax: 184,
    shardChance: 0.74,
    drops: [
      { itemId: 'knife_icebound_fang', chance: 0.03 },
      { itemId: 'sphere_eclass_1', chance: 0.08 }
    ],
    desc: 'A predator grown huge and near-invisible against the ice-fields, striking from a snowdrift before a column ever sees it move.'
  },

  // ---------- Level 64 (curse-flavored anima/undead) ----------
  {
    id: 'anima_scarred_frostwalker',
    name: 'Anima-Scarred Frostwalker',
    level: 64,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 64,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 64,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 64,
    armor: 52, // spell-wall profile: level-12, thin hide, magicArmor well above armor
    magicArmor: 86,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE), continuing Band A/B's anima-scarred
    // lineage one band further north.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_dark_hex', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(64),
    goldMin: 96,
    goldMax: 192,
    shardChance: 0.78,
    drops: [
      { itemId: 'sphere_eclass_1', chance: 0.08 },
      // Band C unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'light_body_frostwalkers_shroud', chance: 0.02 }
    ],
    desc: 'A Majiku exile left for dead on the ice long enough that stray Anima scarred itself into the corpse — kin to the anima-scarred revenants of Kuraan and highlanders of the steppe, but hardened by glacial cold instead of fringe rot.'
  },

  // ---------- Ukai Undercaverns (level 66-69) ----------
  {
    id: 'ukai_cave_warden',
    name: 'Ukai Cave Warden',
    level: 66,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 66,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 66,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 66,
    armor: 54, // spell-wall profile: level-12, magicArmor well above armor
    magicArmor: 88,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(66),
    goldMin: 100,
    goldMax: 200,
    shardChance: 0.82,
    drops: [
      { itemId: 'rod_ukai_wardstone', chance: 0.03 },
      { itemId: 'crystal_eclass_2', chance: 0.08 }
    ],
    desc: 'A Ukai warden set to hold the outer undercaverns, drawing on ward-craft the proud cavern-dwellers have never once shared with an outsider column.'
  },

  // ---------- Level 68 (curse-flavored anima/undead) ----------
  {
    id: 'ukai_hollow_deepling',
    name: 'Ukai Hollow Deepling',
    level: 68,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 68,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 68,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 68,
    armor: 56, // spell-wall profile: level-12
    magicArmor: 92,
    element: 'Dark',
    resistances: { Dark: 0.5, Star: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE) — Band C's second thematic curse carrier.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_anima_lance', 'mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(68),
    goldMin: 104,
    goldMax: 208,
    shardChance: 0.86,
    drops: [
      { itemId: 'sphere_eclass_2', chance: 0.08 },
      // Band C unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'rod_deeplings_core', chance: 0.02 }
    ],
    desc: 'A Ukai Cave Warden\'s own failed ward-rite, hollowed out by the deep-cavern Anima it tried to bind rather than empowered by it — kin to Deep Kuraan\'s hollow wraiths and the Highland War-Camps\' stormwraiths, but colder and quieter than either.'
  },

  // ---------- Level 69 ----------
  {
    id: 'ukai_deep_vanguard',
    name: 'Ukai Deep Vanguard',
    level: 69,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 69,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 69,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 69,
    armor: 76, // tank profile: level+7, the Deep-Dweller's own vanguard, same profile as majiku_ironclad_vanguard/majiku_hostguard_vanguard
    magicArmor: 22,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark', 'mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(69),
    goldMin: 106,
    goldMax: 212,
    shardChance: 0.88,
    drops: [
      { itemId: 'stone_energy_frosthold', chance: 0.08 },
      { itemId: 'quest_ukai_deep_rune', chance: 0.5 }
    ],
    desc: 'One of the Ukai Deep-Dweller\'s own vanguard, held at the undercaverns\' heart to answer for anything the cave wardens and hollow deeplings fail to turn back.'
  },

  // ---------- Lair boss: Ukai Deep-Dweller (level 70) ----------
  // invented Band C capstone (docs/SPEC-ARC-BANDS.md): flat hp/damage premiums per the F1
  // CONVENTION NOTES block (js/balance.js) — hp premium +12*level (matches the majiku_warlord/
  // majiku_ridge_chieftain pattern), damage premium round(1.5*level+10) = round(115) = 115 (F1's
  // sim-tuned starting ballpark for a real level-70 boss), xp premium x3. "Winnable but costly"
  // per the difficulty contract, CLAUDE.md.
  {
    id: 'ukai_deep_dweller',
    name: 'The Ukai Deep-Dweller',
    level: 70,
    boss: true,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 70 + 12 * 70, // 860 + 840 = 1700
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 70,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 70 + Math.round(1.5 * 70 + 10), // 143 + 115 = 258
    armor: 58,
    magicArmor: 56,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_hunters_mark', 'mon_earthen_crush', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(70) * 3, // invented: boss XP premium
    goldMin: 300,
    goldMax: 500,
    shardChance: 0.65,
    drops: [
      { itemId: 'heavy_head_glacial_warhelm', chance: 0.1 },
      { itemId: 'quest_ukai_deep_rune', chance: 0.6 },
      // Band C unique equipment (js/data/items.js) — boss signature. Appended last so prior loot
      // rates (including the guaranteed-ish rune above) are unchanged.
      { itemId: 'hth_deep_dwellers_claw', chance: 0.05 }
    ],
    desc: 'Whatever the Ukai actually mean by "Deep-Dweller" — something old, cave-shaped, and utterly unimpressed by an outsider column, held in reserve at the undercaverns\' heart for exactly this kind of trespass. Breaking it, per every Ukai elder who will still speak to outsiders, is the only argument the cavern-dwellers have ever respected. Costly, but not, at last, impossible.'
  },

  // =====================================================================
  // Level-Arc Band D (docs/SPEC-ARC-BANDS.md, F2/F3): Estari Ruins Deep, levels 71-80 — Estari
  // Sublevels / The Anima Wellspring (js/data/areas.js). Same header formulas, unchanged: hp =
  // 20+12*level, damage = 3+2*level, energy = 40+10*level, xp = BALANCE.MONSTER_XP(level); armor
  // varied per archetype, capped well under a same-level warrior's expected hit (per the
  // estari_loose_rubble milestone-gate retune). goldMin/goldMax continue the Band A/B/C linear
  // trend (goldMin = 50+2*(level-41), goldMax = 2*goldMin); shardChance continues the same
  // 0.32+0.02*(level-41) trend but is capped at 0.95 from this band on (the raw formula crosses
  // 1.0 -- an invalid probability -- around level 75, so a hard cap keeps the roll meaningfully
  // probabilistic instead of functionally guaranteed). Two thematic anima-scarred/anima-horror
  // monsters carry curseChance (v1.2 Curse mechanic, BALANCE.CURSE_APPLY_CHANCE), continuing
  // Bands A/B/C's coverage; monster techs reuse the existing mon_* roster (js/data/techs.js),
  // including mon_anima_lance -- explicitly credited there as "the signature strike of the
  // Society of Modern Magic's constructs and remnants at Kastengard", which doubles as a quiet
  // foreshadow of Band E's Society Anima-Horror.
  // =====================================================================

  // ---------- Estari Sublevels (level 71-74) ----------
  {
    id: 'estari_sublevel_warden',
    name: 'Estari Sublevel Warden',
    level: 71,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 71,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 71,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 71,
    armor: 76, // tank profile: level+5, a construct ward-guardian, same profile as majiku_frost_exile/ukai_cave_warden's tank kin
    magicArmor: 16,
    element: null,
    resistances: {},
    techs: ['mon_stone_slam'],
    xp: BALANCE.MONSTER_XP(71),
    goldMin: 110,
    goldMax: 220,
    shardChance: 0.92,
    drops: [
      { itemId: 'sword_estari_wardblade', chance: 0.03 },
      { itemId: 'crystal_fclass_1', chance: 0.08 },
      { itemId: 'quest_anima_taint_sample', chance: 0.5 }
    ],
    desc: 'A construct ward-guardian dug up out of the Estari sublevels, hammering anything that moves with the same crushing, ancient purpose it was built for before the Council of Three ever banned a single seam of Anima.'
  },

  // ---------- Level 72 ----------
  {
    id: 'estari_anima_conduit',
    name: 'Estari Anima Conduit',
    level: 72,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 72,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 72,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 72,
    armor: 58, // glass cannon: level-14, same profile as glacial_frost_stalker/highland_ridgehawk
    magicArmor: 8,
    element: 'Star',
    resistances: { Star: 0.5, Earth: -0.3 },
    techs: ['mon_static_arc'],
    xp: BALANCE.MONSTER_XP(72),
    goldMin: 112,
    goldMax: 224,
    shardChance: 0.94,
    drops: [
      { itemId: 'knife_estari_shard_fang', chance: 0.03 },
      { itemId: 'sphere_fclass_1', chance: 0.08 }
    ],
    desc: 'A sublevel ward-stone still channeling raw, stray Anima the way it has for millennia, arcing wild current at anything that crosses its old sentry line.'
  },

  // ---------- Level 74 (curse-flavored anima/undead) ----------
  {
    id: 'anima_scarred_excavator',
    name: 'Anima-Scarred Excavator',
    level: 74,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 74,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 74,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 74,
    armor: 62, // spell-wall profile: level-12, thin hide, magicArmor well above armor
    magicArmor: 100,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE), continuing Band A/B/C's anima-scarred
    // lineage — here the excavator who ignored the Council of Three's ban and mined the seam
    // raw, scarred by the very Anima it dug for.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_dark_hex', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(74),
    goldMin: 116,
    goldMax: 232,
    shardChance: 0.95,
    drops: [
      { itemId: 'sphere_fclass_1', chance: 0.08 },
      // Band D unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'light_body_estari_anima_shroud', chance: 0.02 }
    ],
    desc: "An excavator who broke the old taboo and mined the Wellspring's seam raw, kin to the anima-scarred revenants of Kuraan, the highlanders of the steppe, and the frostwalkers of the ice — but scarred by the very Anima the Council of Three always warned would kill for the taking."
  },

  // ---------- The Anima Wellspring (level 76-79) ----------
  {
    id: 'estari_wellspring_warden',
    name: 'Estari Wellspring Warden',
    level: 76,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 76,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 76,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 76,
    armor: 64, // spell-wall profile: level-12, magicArmor well above armor
    magicArmor: 104,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(76),
    goldMin: 120,
    goldMax: 240,
    shardChance: 0.95,
    drops: [
      { itemId: 'rod_wellspring_conduit', chance: 0.03 },
      { itemId: 'crystal_fclass_2', chance: 0.08 }
    ],
    desc: "A ward-guardian set to hold the Wellspring's own outer seal, drawing on the same Estari ward-craft that has kept the taboo seam bound since before the Council of Three's ban was even needed."
  },

  // ---------- Level 78 (curse-flavored anima/undead) ----------
  {
    id: 'raw_anima_horror',
    name: 'Raw Anima-Horror',
    level: 78,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 78,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 78,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 78,
    armor: 66, // spell-wall profile: level-12
    magicArmor: 108,
    element: 'Dark',
    resistances: { Dark: 0.5, Star: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE) — Band D's second thematic curse carrier,
    // and the first monster born directly of raw, unmined Anima rather than a scarred survivor
    // (a deliberate escalation, previewing Band E's Society Anima-Horror capstone).
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_anima_lance', 'mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(78),
    goldMin: 124,
    goldMax: 248,
    shardChance: 0.95,
    drops: [
      { itemId: 'sphere_fclass_2', chance: 0.08 },
      // Band D unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'rod_wellspring_heartcore', chance: 0.02 }
    ],
    desc: "Something the Wellspring itself grew rather than scarred — raw Anima given a shape and a hunger the instant the old seal cracked, exactly the outcome the Council of Three's ban was written to prevent."
  },

  // ---------- Level 79 ----------
  {
    id: 'estari_ruin_vanguard',
    name: 'Estari Ruin Vanguard',
    level: 79,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 79,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 79,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 79,
    armor: 86, // tank profile: level+7, the Warden-Prime's own vanguard, same profile as majiku_ironclad_vanguard/ukai_deep_vanguard
    magicArmor: 24,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark', 'mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(79),
    goldMin: 126,
    goldMax: 252,
    shardChance: 0.95,
    drops: [
      { itemId: 'stone_energy_wellspring', chance: 0.08 },
      { itemId: 'quest_anima_taint_sample', chance: 0.5 }
    ],
    desc: "One of the Warden-Prime's own vanguard, held at the Wellspring's threshold to answer for anything the wellspring wardens and anima-horrors fail to turn back."
  },

  // ---------- Lair boss: Estari Warden-Prime (level 80) ----------
  // invented Band D capstone (docs/SPEC-ARC-BANDS.md): flat hp/damage premiums per the F1
  // CONVENTION NOTES block (js/balance.js) — hp premium +12*level (matches the majiku_warlord/
  // majiku_ridge_chieftain/ukai_deep_dweller pattern), damage premium round(1.5*level+10) =
  // round(130) = 130 (F1's sim-tuned starting ballpark for a real level-80 boss), xp premium x3.
  // "Winnable but costly" per the difficulty contract, CLAUDE.md.
  {
    id: 'estari_warden_prime',
    name: 'Estari Warden-Prime',
    level: 80,
    boss: true,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 80 + 12 * 80, // 980 + 960 = 1940
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 80,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 80 + Math.round(1.5 * 80 + 10), // 163 + 130 = 293
    armor: 60,
    magicArmor: 58,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_hunters_mark', 'mon_earthen_crush', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(80) * 3, // invented: boss XP premium
    goldMin: 340,
    goldMax: 560,
    shardChance: 0.7,
    drops: [
      { itemId: 'heavy_head_warden_helm', chance: 0.1 },
      { itemId: 'quest_anima_taint_sample', chance: 0.6 },
      // Band D unique equipment (js/data/items.js) — boss signature. Appended last so prior loot
      // rates (including the guaranteed-ish sample above) are unchanged.
      { itemId: 'sword_warden_primes_relic', chance: 0.05 }
    ],
    desc: "The Estari's own last answer to anyone who would break the Council of Three's ban: an ancient ward-construct grown huge and merciless at the Wellspring's own heart, unable to tell a careless excavator from a hero who never meant to mine a single seam. It does not negotiate. It only enforces."
  }
];

window.Game = Game;
