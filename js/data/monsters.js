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

  // =====================================================================
  // v1.7 Phase R (docs/SPEC-V1.7-CONTENT-UX.md §3 R-A/A2, SPEC-ARKAN-DIFFERENTIATION.md §3 A2):
  // one new Arkan-cultural doorstep foe for saratus_plains — a runic training construct, echoing
  // the Kastengard wardframes (kastengard_wardframe, above in this file) but at doorstep scale.
  // [invented], Arkan.md-anchored ("a grand circular city focused on the study of magic and
  // technology... Battlemages reinforce the front with white and black magic derived from the
  // study of runes"). Stats LOCKED by the lead's /balance-sim gate (scratchpad
  // sim_v17_wardframe.js, 300-400 trials, L3 warrior + L3 caster fixtures) — DO NOT re-tune:
  // warrior 100% win / 68% HP left / 9.4 rounds, caster 100% win / 82% HP left / 5.8 rounds, both
  // in the ≥85-100% at-level contract with no melee stall. Identity is elevated magicArmor (6)
  // over modest armor (4) — a warded construct that resists magic but is weak to melee (armor 8
  // over-armored to a 77%-win/20-round melee stall in the sim; armor 6 was still grindy at 13
  // rounds; armor 4 is the locked value).
  // =====================================================================
  {
    id: 'saratus_wardframe',
    name: 'Saratus Wardframe',
    level: 3,
    hp: 56,
    energy: 70,
    damage: 9,
    armor: 4,
    magicArmor: 6,
    element: null,
    resistances: {},
    techs: [],
    xp: BALANCE.MONSTER_XP(3),
    goldMin: 2,
    goldMax: 6,
    shardChance: 0.05,
    drops: [
      // Appended (top-down, first-hit-wins convention); no chance-1 entry precedes it.
      { itemId: 'quest_wardframe_rune_shard', chance: 0.3 }
    ],
    desc: 'A runic training construct of the Saratus battlemage academy, its ward-plated frame humming faintly with stored spellcraft. Every young Arkan learns to break one before they are trusted with a blade of their own.'
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
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): data-driven, one interpreter in
    // js/core/battle.js (runBossScript) — no per-boss code. MODEST per the §7 guardrail: fortify
    // amount 2 is ~6% of this boss's own damage stat (33), well under the ~15% ceiling.
    script: [
      { atHpFrac: 0.5, effect: 'fortify', amount: 2, log: "The Ruin Warden's stone core flares — its hide hardens like fresh-poured rock!" }
    ],
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Anima-Touched" is a
    // magic-flavored name (§3 mid-band criterion) and its lone tech is graded Star; a minority of
    // bands 2-3 (~L10-40) monsters get a non-simple archetype (see foothills_stoneback_giant's
    // comment for the full mechanic citation).
    behavior: 'caster',
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): re-typed from P1's placeholder 'telegraph' to
    // 'caster' — "wraith" is a magic-flavored name (§3 mid-band criterion) and its kit is a graded
    // Dark tech, so the raised tech inclination (BALANCE.CASTER_TECH_CHANCE) fits better than a
    // plain heavy-hit windup. Still telegraph-capable (same TELEGRAPH_CHARGE_CHANCE windup).
    behavior: 'caster',
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
    // v1.5 P1/P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): a minority of bands 2-3 (~L10-40) monsters get
    // a non-simple archetype — the first "watch for the wind-up" lesson. See js/core/battle.js
    // monsterAct's archetype interpreter; js/balance.js TELEGRAPH_CHARGE_CHANCE/AFFIX_CHARGED_MULT/
    // CASTER_TECH_CHANCE. telegraph here — a hulking giant winding up a heavy blow is an apt
    // thematic fit.
    behavior: 'telegraph',
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
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): telegraph archetype — a pack
    // matriarch winding up a heavy blow is an apt thematic fit for the first real "watch the
    // wind-up" boss lesson. `behavior` (per-turn action choice) is independent of `script` below
    // (HP-threshold trigger) — both fire; see js/core/battle.js monsterAct/runBossScript.
    behavior: 'telegraph',
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): MODEST enrage (amount 1.12, under
    // the 1.25 ceiling) — the Matriarch rallies her pack for a last stand.
    script: [
      { atHpFrac: 0.4, effect: 'enrage', amount: 1.12, log: 'The Matriarch throws back her head and howls — the whole pack answers, and she strikes harder!' }
    ],
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
    // v1.5 P1 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype (see foothills_stoneback_
    // giant's comment above for the full citation).
    behavior: 'telegraph',
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype — a heavy defensive "warden"
    // winding up before it strikes is an apt thematic fit; a minority of bands 2-3 (~L10-40)
    // monsters get a non-simple archetype (see foothills_stoneback_giant's comment for the full
    // mechanic citation).
    behavior: 'telegraph',
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
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): enrage archetype — a brutish
    // beast boss (boss-lite death-throes escalation) fits a Leviathan better than a magic-flavored
    // caster. `behavior` and `script` are independent and both fire (see foothills_matriarch's
    // comment above for the full citation).
    behavior: 'enrage',
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): MODEST heal (amount 0.10, under
    // the 0.15 ceiling) — the Leviathan retreats into its own element to mend.
    script: [
      { atHpFrac: 0.5, effect: 'heal', amount: 0.10, log: 'The Leviathan dives beneath the shoal — the deep water knits its wounds!' }
    ],
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
    // v1.5 P1 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype (see foothills_stoneback_
    // giant's comment above for the full citation) — a sentry-construct visibly powering up before
    // it strikes is an apt thematic fit.
    behavior: 'telegraph',
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Anima Wraith" is a doubly
    // magic-flavored name (§3 mid-band criterion) with two graded Dark techs; a minority of bands
    // 2-3 (~L10-40) monsters get a non-simple archetype (see foothills_stoneback_giant's comment
    // for the full mechanic citation).
    behavior: 'caster',
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
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): telegraph archetype — a sentry
    // construct visibly powering up before it strikes, same thematic fit as the regular Kastengard
    // Wardframe (js/data/monsters.js L26) sharing this flavor. `behavior` and `script` are
    // independent and both fire (see foothills_matriarch's comment above for the full citation).
    behavior: 'telegraph',
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): MODEST fortify (amount 6, ~7% of
    // this boss's own damage stat 83, under the ~15% ceiling) — the construct reroutes power to
    // its shell.
    script: [
      { atHpFrac: 0.5, effect: 'fortify', amount: 6, log: "The Custodian's runic wardplate reroutes power to its outer shell!" }
    ],
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype — "Construct" reads as a
    // physical heavy-hitter (armor 30 >> magicArmor 20) despite the graded Anima tech, so the
    // heavy-hit windup fits better than caster; a minority of bands 2-3 (~L10-40) monsters get a
    // non-simple archetype (see foothills_stoneback_giant's comment for the full mechanic
    // citation).
    behavior: 'telegraph',
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): re-typed from P1's placeholder 'telegraph' to
    // 'caster' — "Runic" is a magic-flavored name (§3 mid-band criterion: name reads mage/wraith/
    // anima/rune/spirit) and both its techs are graded Dark. Still telegraph-capable.
    behavior: 'caster',
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — an "Archivist" is a
    // spellcaster-flavored name (§3 mid-band criterion) with two graded techs; a minority of
    // bands 2-3 (~L10-40) monsters get a non-simple archetype (see foothills_stoneback_giant's
    // comment for the full mechanic citation).
    behavior: 'caster',
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
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): NO behavior assigned —
    // empirically reverted. An earlier pass assigned 'enrage' here, but a real-RNG re-sim
    // (tests/test_p6b_content.js Part 4, "eidas_echo simulated beats-check") showed a charged
    // telegraph release can bypass this fight's HP-threshold-triggered healing (a single
    // AFFIX_CHARGED_MULT=2.0 spike can cross the sim AI's heal-at-<40%-HP check AND the death
    // threshold in the same hit, whereas the sim's own healing logic can only react BETWEEN
    // actions) — win rate collapsed from ~70-85% to 30% (floor is >=60%). See
    // foothills_matriarch/juneros_leviathan/kastengard_custodian for the archetype set that DID
    // clear their re-sim; this and the other lair/finale bosses with a real-RNG win-rate floor
    // test are left without a P3 behavior pending a dedicated boss-tuned re-sim (deferred).
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): two MODEST entries (heal 0.10 under
    // the 0.15 ceiling; enrage 1.15 under the 1.25 ceiling) — the projection first restabilizes,
    // then burns hottest as its own unmaking nears (a mild prelude to eidas_ascendant's later,
    // deliberately mild curse script — see that boss's own script comment).
    script: [
      { atHpFrac: 0.6, effect: 'heal', amount: 0.10, log: 'The projection flickers and steadies — anima knits its edges whole again.' },
      { atHpFrac: 0.25, effect: 'enrage', amount: 1.15, log: "Faced with its own unmaking, the echo's light burns cold and furious." }
    ],
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
    // v1.3.1 fix 3 [revised] (docs/REVIEW-2026-07-11.md Part 3 C1; user-approved): the guaranteed
    // lore_eidas_final_journal (chance 1) originally sat BEFORE quest_eidas_echo_seal and
    // sword_skyspire_ember_blade — first-hit-wins made both of those permanently unreachable
    // (effective 0% — the Heir of the Echo Legendary's only obtain route, and the roster's
    // capstone unique, were both dead code). Reordered so the append-last convention's rarer/
    // gated entries (seal, then the unique) roll BEFORE the guaranteed fallback; the journal (pure
    // lore, value 0, consumed by no quest — see js/data/quests.js/story.js) now sits LAST as the
    // true fallback that only fires when nothing rarer hit. STANDING RULE going forward: a
    // chance-1 (or any guaranteed) drop must never be followed by anything else in a monster's
    // drops array — first-hit-wins means every entry after it is dead. Effective per-kill
    // probabilities with this order: sword_kastengard_relic_blade 0.1, rod_eidas_remnant_wand
    // 0.9*0.1=0.09, heavy_body_vault_bulwark 0.81*0.1=0.081, quest_eidas_echo_seal
    // 0.729*0.7=0.5103 (~51%, ~2 kills expected), sword_skyspire_ember_blade
    // 0.729*0.3*0.05=0.01094 (~1.1%, ~91 kills expected, matching this game's other boss-unique
    // rates, e.g. foothills_matriarch's hth_matriarchs_fang_wraps at ~1.3%), lore_eidas_final_journal
    // (fallback) 0.729*0.3*0.95=0.2078 (~21%, ~5 kills expected) — eidas_echo is a repeatable Lair
    // fight (js/data/areas.js kastengard_deep.lair), so all four remain comfortably obtainable.
    drops: [
      { itemId: 'sword_kastengard_relic_blade', chance: 0.1 },
      { itemId: 'rod_eidas_remnant_wand', chance: 0.1 },
      { itemId: 'heavy_body_vault_bulwark', chance: 0.1 },
      { itemId: 'quest_eidas_echo_seal', chance: 0.7 },
      // Phase 9: unique equipment (js/data/items.js) — boss signature, the roster's capstone.
      { itemId: 'sword_skyspire_ember_blade', chance: 0.05 },
      // Guaranteed fallback — MUST stay last (see standing rule above).
      { itemId: 'lore_eidas_final_journal', chance: 1 }
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
  // v1.6 P3 EI-1 (SPEC-V1.6-REBALANCE.md §3, REVIEW-2026-07-16.md EI-1) [revised]: every REGULAR
  // (non-boss) L41+ monster's goldMin/goldMax below (this band and every later one, through Band
  // F) is the original goldMin=50+2*(level-41)/goldMax=2*goldMin trend x0.75 (rounded) -- one of
  // three EI-1 gold-curbing levers (with SHOP_SELL_RATE 0.5->0.35 and top-tier equipment value
  // x1.5, js/balance.js/js/data/items.js). Boss goldMin/goldMax are a SEPARATE hand-tuned premium,
  // not this formula, and are UNCHANGED. The formula comments below still state the PRE-trim
  // trend for provenance; read each actual goldMin/goldMax value as trend x0.75.
  // =====================================================================

  // ---------- Kuraan Fringe Woods (level 41-44) ----------
  {
    id: 'majiku_reclaimer_knight',
    name: 'Majiku Reclaimer Knight',
    level: 41,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): late bands (~L41-100) — telegraphs become common;
    // caster on magic-flavored monsters, enrage on brutish/beast/boss-adjacent flavor, telegraph
    // (heavy melee) on the rest, targeting >=60% of L40+ non-boss monsters non-simple (see
    // js/core/battle.js monsterAct's archetype interpreter; js/balance.js CASTER_TECH_CHANCE/
    // ENRAGE_HP_FRAC/ENRAGE_CHARGE_MULT/TELEGRAPH_CHARGE_CHANCE/AFFIX_CHARGED_MULT for the full
    // mechanic citation). telegraph here — a Majiku officer, a heavy melee flavor.
    behavior: 'telegraph',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 41,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 41,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 41,
    armor: 46, // tank profile: level+5, a Majiku officer dug in to hold the fringe
    magicArmor: 14,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark'],
    xp: BALANCE.MONSTER_XP(41),
    goldMin: 38,
    goldMax: 75,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): enrage archetype — a beast "stalker" with no
    // graded tech, brutish flavor; see majiku_reclaimer_knight's comment for the full mechanic
    // citation.
    behavior: 'enrage',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 42,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 42,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 42,
    armor: 28, // glass cannon: thorn-hide over speed, well under level
    magicArmor: 6,
    element: 'Earth',
    resistances: { Earth: 0.5, Fire: -0.25 },
    techs: ['mon_gnawing_bite'],
    xp: BALANCE.MONSTER_XP(42),
    goldMin: 39,
    goldMax: 78,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Anima-Scarred Revenant" is
    // magic-flavored with two graded Dark techs; see majiku_reclaimer_knight's comment for the
    // full mechanic citation.
    behavior: 'caster',
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
    goldMin: 42,
    goldMax: 84,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Witch" is a magic-flavored
    // name with graded techs; see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'caster',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 46,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 46,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 46,
    armor: 34, // spell-wall profile: magicArmor well above armor
    magicArmor: 60,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(46),
    goldMin: 45,
    goldMax: 90,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Wraith" is a magic-flavored
    // name with two graded Dark techs; see majiku_reclaimer_knight's comment for the full
    // mechanic citation.
    behavior: 'caster',
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
    goldMin: 48,
    goldMax: 96,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype — "Ironclad Vanguard" is a
    // heavy melee flavor; see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'telegraph',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 49,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 49,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 49,
    armor: 56, // tank profile: level+7, the Warlord's own heavy vanguard
    magicArmor: 18,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark', 'mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(49),
    goldMin: 50,
    goldMax: 99,
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
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): NO behavior assigned —
    // empirically reverted. An earlier pass assigned 'telegraph' here, but the real-RNG re-sim
    // (tests/test_p3_battle.js Test 32) collapsed from 87% win rate to 14-20% (floor is >=60%): a
    // charged release (AFFIX_CHARGED_MULT=2.0) can bypass this fight's HP-threshold-triggered
    // healing in one hit, which the sim's item-AI (mirrors a non-optimal player) can only react to
    // BETWEEN actions. See eidas_echo's comment (same file) for the full citation; left without a
    // P3 behavior pending a dedicated boss-tuned re-sim (deferred).
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): MODEST enrage (amount 1.15, under
    // the 1.25 ceiling) — the Warlord rallies his war-camp for the killing blow. Re-simmed (P3):
    // majiku_warlord's real-RNG win-rate floor test (tests/test_p3_battle.js Test 32) stays
    // comfortably above its >=60% floor with this script in place.
    script: [
      { atHpFrac: 0.5, effect: 'enrage', amount: 1.15, log: 'The Warlord roars for a killing blow, and his war-camp answers with him!' }
    ],
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
    goldMin: 53,
    goldMax: 105,
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
    goldMin: 54,
    goldMax: 108,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype — "Highlander" reads as a
    // heavy melee warrior despite the graded Anima techs; see majiku_reclaimer_knight's comment
    // for the full mechanic citation.
    behavior: 'telegraph',
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
    goldMin: 57,
    goldMax: 114,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Shaman" is a magic-flavored
    // name with graded techs; see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'caster',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 56,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 56,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 56,
    armor: 44, // spell-wall profile: level-12, magicArmor well above armor
    magicArmor: 74,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(56),
    goldMin: 60,
    goldMax: 120,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Wraith" is a magic-flavored
    // name with two graded Dark techs; see majiku_reclaimer_knight's comment for the full
    // mechanic citation.
    behavior: 'caster',
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
    goldMin: 63,
    goldMax: 126,
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
    goldMin: 65,
    goldMax: 129,
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
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): NO behavior assigned —
    // empirically reverted (same real-RNG win-rate-floor collapse documented on majiku_warlord's
    // and eidas_echo's entries in this file, tests/test_p3_battle.js Test 35); left without a P3
    // behavior pending a dedicated boss-tuned re-sim (deferred).
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): MODEST fortify (amount 16, ~7% of
    // this boss's own damage stat 223, under the ~15% ceiling) — the Chieftain digs in behind his
    // host's shieldwall. Re-simmed (P3): test_p3_battle.js Test 35's real-RNG floor stays
    // comfortably above its >=60% floor with this script in place.
    script: [
      { atHpFrac: 0.5, effect: 'fortify', amount: 16, log: "The Chieftain plants his standard — the host's shieldwall closes around him!" }
    ],
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
    goldMin: 68,
    goldMax: 135,
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
    goldMin: 69,
    goldMax: 138,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Anima-Scarred" is
    // magic-flavored with two graded Dark techs; see majiku_reclaimer_knight's comment for the
    // full mechanic citation.
    behavior: 'caster',
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
    goldMin: 72,
    goldMax: 144,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype — a heavy defensive "warden";
    // see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'telegraph',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 66,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 66,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 66,
    armor: 54, // spell-wall profile: level-12, magicArmor well above armor
    magicArmor: 88,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(66),
    goldMin: 75,
    goldMax: 150,
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
    goldMin: 78,
    goldMax: 156,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype — a "Vanguard" heavy melee
    // flavor; see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'telegraph',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 69,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 69,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 69,
    armor: 76, // tank profile: level+7, the Deep-Dweller's own vanguard, same profile as majiku_ironclad_vanguard/majiku_hostguard_vanguard
    magicArmor: 22,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark', 'mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(69),
    goldMin: 80,
    goldMax: 159,
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
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): NO behavior assigned —
    // empirically reverted (same real-RNG win-rate-floor collapse documented on majiku_warlord's
    // and eidas_echo's entries in this file, tests/test_p3_battle.js Test 38); left without a P3
    // behavior pending a dedicated boss-tuned re-sim (deferred).
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): MODEST heal (amount 0.10, under the
    // 0.15 ceiling) — the cave-dwelling thing draws strength from the old stone. Re-simmed (P3):
    // test_p3_battle.js Test 38's real-RNG floor stays comfortably above its >=60% floor with this
    // script in place.
    script: [
      { atHpFrac: 0.5, effect: 'heal', amount: 0.10, log: 'The Deep-Dweller presses flat against the cavern wall, and the old stone feeds it strength.' }
    ],
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
    goldMin: 83,
    goldMax: 165,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Anima Conduit" is a
    // strongly magic-flavored name with a graded Star tech; see majiku_reclaimer_knight's comment
    // for the full mechanic citation.
    behavior: 'caster',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 72,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 72,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 72,
    armor: 58, // glass cannon: level-14, same profile as glacial_frost_stalker/highland_ridgehawk
    magicArmor: 8,
    element: 'Star',
    resistances: { Star: 0.5, Earth: -0.3 },
    techs: ['mon_static_arc'],
    xp: BALANCE.MONSTER_XP(72),
    goldMin: 84,
    goldMax: 168,
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
    goldMin: 87,
    goldMax: 174,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype — a heavy defensive "warden";
    // see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'telegraph',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 76,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 76,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 76,
    armor: 64, // spell-wall profile: level-12, magicArmor well above armor
    magicArmor: 104,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_static_arc'],
    xp: BALANCE.MONSTER_XP(76),
    goldMin: 90,
    goldMax: 180,
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
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): enrage archetype — "Horror" is brutish/
    // boss-adjacent flavor (previews Band E's Society Anima-Horror capstone); see
    // majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'enrage',
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
    goldMin: 93,
    goldMax: 186,
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
    goldMin: 95,
    goldMax: 189,
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
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): NO behavior assigned —
    // empirically reverted (same real-RNG win-rate-floor collapse documented on majiku_warlord's
    // and eidas_echo's entries in this file, tests/test_p3_battle.js Test 41); left without a P3
    // behavior pending a dedicated boss-tuned re-sim (deferred).
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): MODEST fortify (amount 21, ~7% of
    // this boss's own damage stat 293, under the ~15% ceiling) — the ward-construct channels the
    // Wellspring itself. Re-simmed (P3): test_p3_battle.js Test 41's real-RNG floor stays
    // comfortably above its >=60% floor with this script in place.
    script: [
      { atHpFrac: 0.5, effect: 'fortify', amount: 21, log: 'The Warden-Prime channels the Wellspring itself through its wardframe!' }
    ],
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
  },

  // =====================================================================
  // Level-Arc Band E (docs/SPEC-ARC-BANDS.md, F2/F3): Ascent to the Skyspire, levels 81-90 —
  // Skyspire Lower Spans / Skyspire Upper Spans (js/data/areas.js). Same header formulas,
  // unchanged: hp = 20+12*level, damage = 3+2*level, energy = 40+10*level, xp =
  // BALANCE.MONSTER_XP(level); armor varied per archetype, capped well under a same-level
  // warrior's expected hit (per the estari_loose_rubble milestone-gate retune). goldMin/goldMax
  // continue the Band A/B/C/D linear trend (goldMin = 50+2*(level-41), goldMax = 2*goldMin);
  // shardChance continues the same 0.32+0.02*(level-41) trend, but that formula now exceeds 1.0
  // for every Band E level (>=81), so every regular here is capped at 0.95 (the same cap Band D
  // introduced once the raw formula first crossed 1.0 around level 75). Two thematic
  // Society-remnant/anima-horror monsters carry curseChance (v1.2 Curse mechanic,
  // BALANCE.CURSE_APPLY_CHANCE), continuing Bands A/B/C/D's coverage; monster techs reuse the
  // existing mon_* roster (js/data/techs.js), including mon_anima_lance — explicitly credited
  // there as "the signature strike of the Society of Modern Magic's constructs and remnants at
  // Kastengard", which is exactly the Society remnant garrisoning the Skyspire itself.
  // =====================================================================

  // ---------- Skyspire Lower Spans (level 81-84) ----------
  {
    id: 'skyspire_lower_warden',
    name: 'Skyspire Lower Warden',
    level: 81,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): telegraph archetype — a heavy defensive
    // "warden"; see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'telegraph',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 81,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 81,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 81,
    armor: 86, // tank profile: level+5, a ward-construct guardian, same profile as estari_sublevel_warden/ukai_cave_warden's tank kin
    magicArmor: 18,
    element: null,
    resistances: {},
    techs: ['mon_stone_slam'],
    xp: BALANCE.MONSTER_XP(81),
    goldMin: 98,
    goldMax: 195,
    shardChance: 0.95,
    drops: [
      { itemId: 'sword_spireward_blade', chance: 0.03 },
      { itemId: 'crystal_gclass_1', chance: 0.08 },
      { itemId: 'quest_society_cipher_page', chance: 0.5 }
    ],
    desc: "A ward-construct set to guard the Skyspire's lowest span since before Eidas ever sailed for the red moon, still hammering intruders with the same crushing purpose it was built for."
  },

  // ---------- Level 82 ----------
  {
    id: 'society_remnant_battlemage',
    name: 'Society Remnant Battlemage',
    level: 82,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Battlemage" is an explicitly
    // magic-flavored name; see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'caster',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 82,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 82,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 82,
    armor: 68, // glass cannon: level-14, same profile as estari_anima_conduit/highland_ridgehawk
    magicArmor: 10,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.3 },
    techs: ['mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(82),
    goldMin: 99,
    goldMax: 198,
    shardChance: 0.95,
    drops: [
      { itemId: 'knife_society_renegade_dirk', chance: 0.03 },
      { itemId: 'sphere_gclass_1', chance: 0.08 }
    ],
    desc: "A battlemage who never followed Eidas to the red moon, left behind to hold the Skyspire's lower wards with whatever Dark-grade Anima the Society ever managed to master."
  },

  // ---------- Level 84 (curse-flavored anima/undead) ----------
  {
    id: 'anima_horror_stalker',
    name: 'Anima-Horror Stalker',
    level: 84,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): enrage archetype — "Horror" is brutish/
    // boss-adjacent flavor (previews Band E's Society Anima-Horror capstone); see
    // majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'enrage',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 84,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 84,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 84,
    armor: 72, // spell-wall profile: level-12, thin hide, magicArmor well above armor
    magicArmor: 112,
    element: 'Dark',
    resistances: { Dark: 0.5, Star: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE), continuing Band A/B/C/D's anima-scarred
    // lineage — here raw Anima given a shape and a hunger, prowling the lower spans for
    // whatever the Society's own remnant hasn't already claimed.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_dark_hex', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(84),
    goldMin: 102,
    goldMax: 204,
    shardChance: 0.95,
    drops: [
      { itemId: 'crystal_gclass_1', chance: 0.08 },
      // Band E unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'light_body_anima_scoured_wraps', chance: 0.02 }
    ],
    desc: "Raw Anima given shape and hunger the instant something cracked the Skyspire's own lower wards, kin to the anima-horrors of the Wellspring but hungrier still, stalking anything that moves along the lower spans."
  },

  // ---------- Skyspire Upper Spans (level 86-89) ----------
  {
    id: 'skyspire_upper_sentinel',
    name: 'Skyspire Upper Sentinel',
    level: 86,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 86,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 86,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 86,
    armor: 93, // tank profile: level+7, the sanctum's own vanguard, same profile as estari_ruin_vanguard/ukai_deep_vanguard
    magicArmor: 26,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark', 'mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(86),
    goldMin: 105,
    goldMax: 210,
    shardChance: 0.95,
    drops: [
      { itemId: 'stone_energy_skyspire', chance: 0.08 },
      { itemId: 'quest_society_cipher_page', chance: 0.5 }
    ],
    desc: "One of the Skyspire's own upper sentinels, held at the threshold of the Society's last sanctum to answer for anything the lower wards and stalking horrors fail to turn back."
  },

  // ---------- Level 87 ----------
  {
    id: 'society_arcanist_prime',
    name: 'Society Arcanist Prime',
    level: 87,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — "Arcanist" is an explicitly
    // magic-flavored name; see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'caster',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 87,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 87,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 87,
    armor: 73, // glass cannon: level-14, same profile as society_remnant_battlemage/estari_anima_conduit
    magicArmor: 12,
    element: 'Star',
    resistances: { Star: 0.5, Earth: -0.3 },
    techs: ['mon_static_arc'],
    xp: BALANCE.MONSTER_XP(87),
    goldMin: 107,
    goldMax: 213,
    shardChance: 0.95,
    drops: [
      { itemId: 'rod_anima_channeling_rod', chance: 0.03 },
      { itemId: 'sphere_gclass_2', chance: 0.08 }
    ],
    desc: "The senior-most of the Society's last remnant still willing to speak Eidas's name, arcing raw Star-grade Anima at anything that reaches the upper spans uninvited."
  },

  // ---------- Level 89 (curse-flavored anima/undead) ----------
  {
    id: 'anima_horror_ravager',
    name: 'Anima-Horror Ravager',
    level: 89,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): enrage archetype — "Horror"/"Ravager" is brutish/
    // boss-adjacent flavor, right before the level-90 Society Anima-Horror lair boss; see
    // majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'enrage',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 89,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 89,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 89,
    armor: 77, // spell-wall profile: level-12
    magicArmor: 116,
    element: 'Dark',
    resistances: { Dark: 0.5, Star: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE) — Band E's second thematic curse
    // carrier, grown huge on whatever raw Anima the Society's sanctum has been leaking since
    // Eidas left, previewing the boss's own scale.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_anima_lance', 'mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(89),
    goldMin: 110,
    goldMax: 219,
    shardChance: 0.95,
    drops: [
      { itemId: 'sphere_gclass_2', chance: 0.08 },
      // Band E unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'rod_anima_horrors_core', chance: 0.02 }
    ],
    desc: "Something the sanctum grew rather than leashed — raw Anima given a ravager's shape and an appetite to match, the last and largest thing standing between the upper spans and whatever the Society is still hiding at the top."
  },

  // ---------- Lair boss: Society Anima-Horror (level 90) ----------
  // invented Band E capstone (docs/SPEC-ARC-BANDS.md): flat hp/damage premiums per the F1
  // CONVENTION NOTES block (js/balance.js) — hp premium +12*level (matches the majiku_warlord/
  // majiku_ridge_chieftain/ukai_deep_dweller/estari_warden_prime pattern), damage premium
  // round(1.5*level+10) = round(145) = 145 (F1's sim-tuned starting ballpark for a real level-90
  // boss), xp premium x3. "Winnable but costly" per the difficulty contract, CLAUDE.md.
  {
    id: 'society_anima_horror',
    name: 'Society Anima-Horror',
    level: 90,
    boss: true,
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): NO behavior assigned —
    // empirically reverted (same real-RNG win-rate-floor collapse documented on majiku_warlord's
    // and eidas_echo's entries in this file, tests/test_p3_battle.js Test 44); left without a P3
    // behavior pending a dedicated boss-tuned re-sim (deferred).
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): MODEST enrage (amount 1.12, under
    // the 1.25 ceiling) — the Horror's hunger sharpens as it nears its own end. Re-simmed (P3):
    // test_p3_battle.js Test 44's real-RNG floor stays comfortably above its >=60% floor with this
    // script in place.
    script: [
      { atHpFrac: 0.4, effect: 'enrage', amount: 1.12, log: "The Horror's hunger sharpens to a single point — it lashes out harder!" }
    ],
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 90 + 12 * 90, // 1100 + 1080 = 2180
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 90,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 90 + Math.round(1.5 * 90 + 10), // 183 + 145 = 328
    armor: 62,
    magicArmor: 60,
    element: 'Dark',
    resistances: { Dark: 0.5, Light: -0.25 },
    techs: ['mon_dark_hex', 'mon_hunters_mark', 'mon_earthen_crush', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(90) * 3, // invented: boss XP premium
    goldMin: 380,
    goldMax: 620,
    shardChance: 0.75,
    drops: [
      { itemId: 'heavy_head_spireward_helm', chance: 0.1 },
      { itemId: 'quest_society_cipher_page', chance: 0.6 },
      // Band E unique equipment (js/data/items.js) — boss signature. Appended last so prior loot
      // rates (including the guaranteed-ish page above) are unchanged.
      { itemId: 'sword_anima_horrors_edge', chance: 0.05 }
    ],
    desc: "The last thing the Society of Modern Magic ever built, or the first thing it stopped being able to control — raw Anima given a shape vast enough to fill the sanctum Eidas left behind. It does not remember the Council of Three's ban, or the Society's own founding purpose. It only remembers that it is hungry, and that the Skyspire is its own."
  },

  // =====================================================================
  // Level-Arc Band F (docs/SPEC-ARC-BANDS.md, F2/F3): The Red Moon / Eidas's Sanctum, levels
  // 91-100 — THE ARC FINALE. Same header formulas, unchanged: hp = 20+12*level, damage =
  // 3+2*level, energy = 40+10*level, xp = BALANCE.MONSTER_XP(level); armor varied per archetype,
  // capped well under a same-level warrior's expected hit (per the estari_loose_rubble
  // milestone-gate retune). goldMin/goldMax continue the Band A-E linear trend (goldMin =
  // 50+2*(level-41), goldMax = 2*goldMin); shardChance continues the same 0.32+0.02*(level-41)
  // trend, but that formula has exceeded 1.0 since around level 75 (Band D), so every regular
  // here is capped at 0.95 (same cap Bands D/E used). Two thematic moon-anima-horror monsters
  // carry curseChance (v1.2 Curse mechanic, BALANCE.CURSE_APPLY_CHANCE), continuing Bands A-E's
  // coverage; monster techs mostly reuse the existing mon_* roster (js/data/techs.js), plus ONE
  // new Light-grade monster tech (mon_radiant_smite) for Eidas's "divine race" servitors — no
  // existing mon_* tech carried the Light grade, and Light fits the "divine race" flavor better
  // than reusing Dark (already the moon-anima-horrors' signature grade here, same as Bands D/E's
  // anima-horror lineage).
  //
  // FINALE BOSS (eidas_ascendant, level 100): this is Eidas HIMSELF, not the L36-40 "Eidas' Echo"
  // act-break boss (js/data/monsters.js eidas_echo, kept untouched and unrenamed) — that Echo was
  // explicitly "not Eidas himself... an Anima-projection... murmuring about a 'divine race' that
  // never came to pass" (eidas_echo's own desc). Band F is the payoff: the divine race DID come
  // to pass, out on the red moon, and Eidas Ascendant is what Eidas became. As the arc's capstone
  // fight it goes past the F1 CONVENTION NOTES starting ballpark on purpose (docs/SPEC-ARC-BANDS.md
  // Band F row: "make it the toughest fight in the game"): hp premium is 1.4x the standard
  // +12*level pattern (round(12*100*1.4) = 1680, not the standard 1200) and it carries a NEW
  // signature tech (mon_red_moons_judgment, grade Star, monsterOnly) whose power (240) is
  // deliberately close to its own premiumed basic-attack damage — unlike every other mon_* tech,
  // which caps out around power 26 because those are shared flavor moves used across the WHOLE
  // 1-100 level range and can't scale to any one boss. The damage premium itself stays at the F1
  // ballpark (round(1.5*100+10) = 160) so the "signature toughness" comes from HP + the signature
  // tech's spike potential, not from inflating the convention's damage-premium formula itself.
  // Sim-verified (tests/test_p3_battle.js): winnable but the costliest fight in the game — see
  // that test's sim numbers.
  // =====================================================================

  // ---------- The Moon-Bridge (level 91-94) ----------
  {
    id: 'moonbridge_ward_sentinel',
    name: 'Moon-Bridge Ward Sentinel',
    level: 91,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 91,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 91,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 91,
    armor: 96, // tank profile: level+5, a ward-construct guardian, same profile as skyspire_lower_warden/estari_sublevel_warden's tank kin
    magicArmor: 20,
    element: null,
    resistances: {},
    techs: ['mon_stone_slam'],
    xp: BALANCE.MONSTER_XP(91),
    goldMin: 113,
    goldMax: 225,
    shardChance: 0.95,
    drops: [
      { itemId: 'sword_redmoon_blade', chance: 0.03 },
      { itemId: 'crystal_hclass_1', chance: 0.08 },
      { itemId: 'quest_eidas_sigil_shard', chance: 0.5 }
    ],
    desc: "A ward-construct set to guard the Moon-Bridge crossing since before Eidas ever sailed for the red moon, still hammering intruders with the same crushing purpose it was built for."
  },

  // ---------- Level 92 ----------
  {
    id: 'divine_race_initiate',
    name: 'Divine-Race Initiate',
    level: 92,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — a graded Light (radiant)
    // spell-flinger; see majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'caster',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 92,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 92,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 92,
    armor: 78, // glass cannon: level-14, same profile as society_remnant_battlemage/estari_anima_conduit
    magicArmor: 13,
    element: 'Light',
    resistances: { Light: 0.5, Dark: -0.3 },
    techs: ['mon_radiant_smite'],
    xp: BALANCE.MONSTER_XP(92),
    goldMin: 114,
    goldMax: 228,
    shardChance: 0.95,
    drops: [
      { itemId: 'knife_sanctum_fang', chance: 0.03 },
      { itemId: 'sphere_hclass_1', chance: 0.08 }
    ],
    desc: "One of the first of Eidas's 'divine race' progeny, newly touched by the red moon's own Light and set to guard the bridge he never came back across."
  },

  // ---------- Level 94 (curse-flavored anima/undead) ----------
  {
    id: 'moon_anima_stalker',
    name: 'Moon-Anima Stalker',
    level: 94,
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 94,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 94,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 94,
    armor: 82, // spell-wall profile: level-12, thin hide, magicArmor well above armor
    magicArmor: 120,
    element: 'Dark',
    resistances: { Dark: 0.5, Star: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE), continuing Band A-E's anima-scarred
    // lineage — here raw Anima warped by the red moon's own light into a hunting shape.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_dark_hex', 'mon_anima_lance'],
    xp: BALANCE.MONSTER_XP(94),
    goldMin: 117,
    goldMax: 234,
    shardChance: 0.95,
    drops: [
      { itemId: 'crystal_hclass_1', chance: 0.08 },
      // Band F unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'light_body_voidmoon_wraps', chance: 0.02 }
    ],
    desc: "Raw Anima warped by the red moon's own light into a hunting shape, kin to the anima-horrors of the Skyspire sanctum but hungrier still, stalking anything that crosses the bridge."
  },

  // ---------- Eidas's Sanctum (level 96-99) ----------
  {
    id: 'sanctum_ward_colossus',
    name: 'Sanctum Ward Colossus',
    level: 96,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): enrage archetype — "Colossus" is brutish/
    // boss-adjacent flavor, four levels from the arc's final boss (Eidas Ascendant, L100); see
    // majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'enrage',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 96,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 96,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 96,
    armor: 103, // tank profile: level+7, the sanctum's own vanguard, same profile as skyspire_upper_sentinel/estari_ruin_vanguard
    magicArmor: 28,
    element: null,
    resistances: {},
    techs: ['mon_hunters_mark', 'mon_earthen_crush'],
    xp: BALANCE.MONSTER_XP(96),
    goldMin: 120,
    goldMax: 240,
    shardChance: 0.95,
    drops: [
      { itemId: 'stone_energy_moonbridge', chance: 0.08 },
      { itemId: 'quest_eidas_sigil_shard', chance: 0.5 }
    ],
    desc: "One of the sanctum's own ward-colossi, held at the threshold to answer for anything the bridge's own wardens and stalking horrors fail to turn back."
  },

  // ---------- Level 97 ----------
  {
    id: 'divine_race_exemplar',
    name: 'Divine-Race Exemplar',
    level: 97,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): caster archetype — a graded Light (radiant)
    // spell-flinger, same lineage as divine_race_initiate; see majiku_reclaimer_knight's comment
    // for the full mechanic citation.
    behavior: 'caster',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 97,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 97,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 97,
    armor: 83, // glass cannon: level-14, same profile as divine_race_initiate/society_remnant_battlemage
    magicArmor: 15,
    element: 'Light',
    resistances: { Light: 0.5, Dark: -0.3 },
    techs: ['mon_radiant_smite'],
    xp: BALANCE.MONSTER_XP(97),
    goldMin: 122,
    goldMax: 243,
    shardChance: 0.95,
    drops: [
      { itemId: 'rod_lunar_conduit', chance: 0.03 },
      { itemId: 'sphere_hclass_2', chance: 0.08 }
    ],
    desc: "A fuller-formed exemplar of Eidas's divine race, closer to whatever he truly intended it to become before the red moon changed the plan."
  },

  // ---------- Level 99 (curse-flavored anima/undead) ----------
  {
    id: 'moon_anima_devourer',
    name: 'Moon-Anima Devourer',
    level: 99,
    // v1.5 P2 (docs/SPEC-V1.5-MONSTER-AI.md §5): enrage archetype — "Devourer" is brutish/
    // boss-adjacent flavor, one level from the arc's final boss (Eidas Ascendant, L100); see
    // majiku_reclaimer_knight's comment for the full mechanic citation.
    behavior: 'enrage',
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 99,
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 99,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 99,
    armor: 87, // spell-wall profile: level-12
    magicArmor: 124,
    element: 'Dark',
    resistances: { Dark: 0.5, Star: -0.3 },
    // v1.2 Curse mechanic (BALANCE.CURSE_APPLY_CHANCE) — Band F's second thematic curse
    // carrier, grown huge on whatever red-moon Anima the sanctum has been leaking, previewing
    // the boss's own scale.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_anima_lance', 'mon_dark_hex'],
    xp: BALANCE.MONSTER_XP(99),
    goldMin: 125,
    goldMax: 249,
    shardChance: 0.95,
    drops: [
      { itemId: 'sphere_hclass_2', chance: 0.08 },
      // Band F unique equipment (js/data/items.js). Appended last so prior loot rates are unchanged.
      { itemId: 'rod_devourers_core', chance: 0.02 }
    ],
    desc: "The largest thing the red moon has grown yet, its appetite scaled to match — the last and hungriest thing standing between the sanctum's outer halls and Eidas himself."
  },

  // ---------- Lair boss: Eidas Ascendant (level 100) — THE FINAL BOSS ----------
  // invented Band F capstone (docs/SPEC-ARC-BANDS.md): the arc's FINALE, deliberately tuned
  // ABOVE the F1 CONVENTION NOTES starting ballpark (js/balance.js) so it reads as the toughest
  // fight in the game: hp premium is 1.4x the standard +12*level pattern (round(12*100*1.4) =
  // 1680, not the standard 1200 every other Level-Arc boss uses), while the damage premium stays
  // at the F1 ballpark itself (round(1.5*level+10) = round(160) = 160) — the extra difficulty
  // comes from raw HP plus a new signature tech (mon_red_moons_judgment) rather than from
  // inflating the shared damage-premium formula every other boss in the arc was tuned against.
  // xp premium x3, matching every other Level-Arc boss. "Winnable but costly" per the difficulty
  // contract, CLAUDE.md — sim-verified in tests/test_p3_battle.js as the costliest fight in the
  // game (lower avg HP left / more consumables spent on a win than any prior band boss).
  {
    id: 'eidas_ascendant',
    name: 'Eidas Ascendant',
    level: 100,
    boss: true,
    // v1.5 P3 (docs/SPEC-V1.5-MONSTER-AI.md §5, boss integration): NO behavior assigned —
    // empirically reverted. This fight is ALREADY the game's costliest by design (header comment
    // above) with the least win-rate headroom of any boss; the same real-RNG collapse documented
    // on majiku_warlord's and eidas_echo's entries in this file (tests/test_p3_battle.js Test 47)
    // applies here too. Left without a P3 behavior pending a dedicated boss-tuned re-sim (deferred).
    // v1.4 P3 (G2) boss script (docs/SPEC-V1.4-GAMEPLAY.md §4): deliberately the flavor-richest
    // but NUMERICALLY MILDEST script in the game — this fight is already the hardest in the game
    // (see the header comment above), so it gets a single scripted Curse (25% outgoing-damage
    // reduction, BALANCE.CURSE_DAMAGE_MULT, for BALANCE.CURSE_DURATION turns — the exact existing
    // Curse status, reused via applyPlayerCurse in js/core/battle.js) rather than an enrage/fortify
    // stack on top of his already-amplified HP/damage premiums. Re-simmed (P3): test_p3_battle.js
    // Test 47's real-RNG floor (>=60%, currently ~83%) stays comfortably clear with this script in
    // place — see tests/test_p3_battle.js for the 5-consecutive-run verification.
    script: [
      { atHpFrac: 0.5, effect: 'curse', amount: 0, log: 'Ascendant Eidas turns his gaze upon you, and the unfinished weight of a divine race settles over your soul.' }
    ],
    hp: BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 100 + Math.round(12 * 100 * 1.4), // 1220 + 1680 = 2900
    energy: BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * 100,
    damage: BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 100 + Math.round(1.5 * 100 + 10), // 203 + 160 = 363
    armor: 64,
    magicArmor: 62,
    element: 'Star',
    resistances: { Star: 0.5, Earth: -0.3 },
    // v1.2 Curse mechanic — the ascended Eidas carries it too, matching his moon-anima-horror
    // creations and making the fight costlier still.
    curseChance: BALANCE.CURSE_APPLY_CHANCE,
    techs: ['mon_radiant_smite', 'mon_dark_hex', 'mon_earthen_crush', 'mon_red_moons_judgment'],
    xp: BALANCE.MONSTER_XP(100) * 3, // invented: boss XP premium
    goldMin: 420,
    goldMax: 660,
    shardChance: 0.8,
    drops: [
      { itemId: 'heavy_head_redmoon_helm', chance: 0.1 },
      { itemId: 'quest_eidas_sigil_shard', chance: 0.6 },
      // Band F unique equipment (js/data/items.js) — boss signature, the arc's FINAL capstone
      // drop. Appended last so prior loot rates (including the guaranteed-ish shard above) are
      // unchanged.
      { itemId: 'sword_ascendants_judgment', chance: 0.05 }
    ],
    desc: "Not an echo this time. Eidas himself, three centuries gone and changed past anything Kastengard's Society ever imagined — the 'divine race' was never a failure, hero, only unfinished, and he finished it on himself first. Whatever answers you were chasing since the Skyspire, they end here, in the light of the moon he built his sanctum to reach."
  }
];

window.Game = Game;
