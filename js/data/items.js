// HeroRPG remake — item database (DESIGN.md §6).
// Only one item id (#3273) was ever archived by the Wayback Machine, and it 404s — so the
// entire item list below is // invented, in the original's spirit (plain fantasy names, no
// copyrighted references). Slot/skill/requirement/weight/tag shape follows DESIGN.md §6 and
// the "Item Window" section of reference/manual/New_Player_Guide.md.
//
// Formulas used (invented, per Phase 2 spec):
//   weapon damage  ~= 3 + 2 * levelReq
//   armor piece    ~= 1 + levelReq
//   weight: light armor ~2, medium ~5, heavy ~9; weapons 3-8; potions 1

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.items = [

  // ---------- Weapons: Swords (Str, archived Damage.md ratio) ----------
  {
    id: 'sword_rusty_shortblade',
    name: 'Rusty Shortblade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 5,
    weight: 3,
    levelReq: 1,
    value: 15,
    tags: [],
    desc: 'A pitted shortsword that has seen better days, but still holds an edge.'
  },
  {
    id: 'sword_soldiers_blade',
    name: "Soldier's Blade",
    slot: 'weapon',
    skill: 'Swords',
    damage: 13,
    weight: 5,
    levelReq: 5,
    statReqs: { strength: 12 },
    value: 90,
    tags: [],
    desc: 'A well-balanced sword favored by the Eldor city guard.'
  },
  {
    id: 'sword_arkan_runeblade',
    name: 'Arkan Runeblade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 23,
    weight: 6,
    levelReq: 10,
    statReqs: { strength: 20 },
    value: 260,
    tags: [],
    desc: 'A curved blade etched with faint runes from the forges of Saratus.'
  },

  // ---------- Weapons: Polearms (Str) ----------
  {
    id: 'polearm_ashwood_spear',
    name: 'Ashwood Spear',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 7,
    weight: 5,
    // fix: was levelReq 2, the only tier-1 starter weapon requiring a level a brand-new character
    // doesn't have — Game.Inventory.grantStarterKit's auto-equip silently failed at creation,
    // leaving Polearms-creation characters weaponless (unable to Attack OR use their new Feature C
    // starter weapon tech, Impale I) until level 2. Matches every other tier-1 starter weapon
    // (sword_rusty_shortblade/knife_worn_dagger/rod_apprentice_wand, all levelReq 1).
    levelReq: 1,
    value: 25,
    tags: [],
    desc: 'A simple hunting spear cut from ashwood and tipped with iron.'
  },
  {
    id: 'polearm_militia_halberd',
    name: 'Militia Halberd',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 17,
    weight: 8,
    levelReq: 7,
    statReqs: { strength: 16 },
    value: 150,
    tags: [],
    desc: 'A heavy polearm issued to Eldor militia levies.'
  },

  // ---------- Weapons: Knives (Dex, invented-parallel to Damage.md ratio) ----------
  {
    id: 'knife_worn_dagger',
    name: 'Worn Dagger',
    slot: 'weapon',
    skill: 'Knives',
    damage: 4,
    weight: 3,
    levelReq: 1,
    value: 12,
    tags: [],
    desc: 'A small dagger, favored for its speed rather than its power.'
  },
  {
    id: 'knife_thieves_edge',
    name: "Thieves' Edge",
    slot: 'weapon',
    skill: 'Knives',
    damage: 15,
    weight: 3,
    levelReq: 6,
    statReqs: { dexterity: 14 },
    value: 120,
    tags: [],
    desc: 'A slender blade balanced for a quick, precise strike.'
  },

  // ---------- Weapons: Rods (Int, invented-parallel to Damage.md ratio) ----------
  {
    id: 'rod_apprentice_wand',
    name: "Apprentice's Wand",
    slot: 'weapon',
    skill: 'Rods',
    damage: 5,
    weight: 3,
    levelReq: 1,
    value: 15,
    tags: [],
    desc: 'A plain wand carved from birch, given to new students of the arcane.'
  },
  {
    id: 'rod_saratus_conduit',
    name: 'Saratus Conduit Rod',
    slot: 'weapon',
    skill: 'Rods',
    damage: 21,
    weight: 4,
    levelReq: 9,
    statReqs: { intelligence: 18 },
    value: 230,
    tags: [],
    desc: 'A slender rod inlaid with a channeling crystal from the Saratus workshops.'
  },

  // ---------- Weapons: Hand to Hand (Str, per DESIGN.md §3) ----------
  {
    id: 'hth_iron_knuckles',
    name: 'Iron Knuckles',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 6,
    weight: 4,
    // fix: was levelReq 2 — same starter-kit auto-equip bug as polearm_ashwood_spear above, fixed
    // to match the other tier-1 starter weapons (all levelReq 1).
    levelReq: 1,
    value: 20,
    tags: [],
    desc: 'A set of banded iron knuckles worn over the fist.'
  },
  {
    id: 'hth_monks_wraps',
    name: "Monk's Wraps",
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 19,
    weight: 3,
    levelReq: 8,
    statReqs: { strength: 17 },
    value: 180,
    tags: [],
    desc: 'Weighted cloth wraps used by wandering monks to harden their strikes.'
  },

  // ---------- Offhand: Shield (Shields skill) ----------
  {
    id: 'shield_wooden_buckler',
    name: 'Wooden Buckler',
    slot: 'offhand',
    skill: 'Shields',
    armor: 3,
    weight: 4,
    levelReq: 1,
    value: 18,
    tags: [],
    desc: 'A small round shield of banded wood, better than nothing.'
  },
  {
    id: 'shield_ironbound_kite',
    name: 'Ironbound Kite Shield',
    slot: 'offhand',
    skill: 'Shields',
    armor: 9,
    weight: 7,
    levelReq: 6,
    statReqs: { strength: 13 },
    value: 140,
    tags: [],
    desc: 'A kite shield reinforced with iron banding along its face.'
  },

  // ---------- Armor: Light Armor (body/head/legs/feet) ----------
  {
    id: 'light_body_traveler_tunic',
    name: "Traveler's Tunic",
    slot: 'body',
    skill: 'Light Armor',
    armor: 2,
    weight: 2,
    levelReq: 1,
    value: 14,
    tags: [],
    desc: 'A padded cloth tunic favored by scouts and mages alike.'
  },
  {
    id: 'light_head_hood_of_wayfaring',
    name: 'Hood of Wayfaring',
    slot: 'head',
    skill: 'Light Armor',
    armor: 2,
    weight: 2,
    levelReq: 1,
    value: 12,
    tags: [],
    desc: 'A soft hood that keeps the sun and rain off a traveler.'
  },
  {
    id: 'light_legs_supple_leggings',
    name: 'Supple Leggings',
    slot: 'legs',
    skill: 'Light Armor',
    armor: 6,
    weight: 2,
    levelReq: 5,
    value: 70,
    tags: [],
    desc: 'Leggings of treated leather, light enough to run in.'
  },
  {
    id: 'light_feet_soft_boots',
    name: 'Soft Boots',
    slot: 'feet',
    skill: 'Light Armor',
    armor: 6,
    weight: 2,
    levelReq: 5,
    value: 65,
    tags: [],
    desc: 'Quiet boots stitched from soft hide.'
  },

  // ---------- Armor: Medium Armor (body/head/legs/feet) ----------
  {
    id: 'medium_body_studded_jerkin',
    name: 'Studded Jerkin',
    slot: 'body',
    skill: 'Medium Armor',
    armor: 4,
    weight: 5,
    levelReq: 3,
    value: 40,
    tags: [],
    desc: 'A leather jerkin reinforced with rows of iron studs.'
  },
  {
    id: 'medium_head_riveted_cap',
    name: 'Riveted Cap',
    slot: 'head',
    skill: 'Medium Armor',
    armor: 4,
    weight: 5,
    levelReq: 3,
    value: 38,
    tags: [],
    desc: 'A simple riveted steel cap worn by town militia.'
  },
  {
    id: 'medium_legs_banded_greaves',
    name: 'Banded Greaves',
    slot: 'legs',
    skill: 'Medium Armor',
    armor: 9,
    weight: 5,
    levelReq: 8,
    value: 190,
    tags: [],
    desc: 'Greaves of overlapping metal bands over boiled leather.'
  },
  {
    id: 'medium_feet_reinforced_boots',
    name: 'Reinforced Boots',
    slot: 'feet',
    skill: 'Medium Armor',
    armor: 9,
    weight: 5,
    levelReq: 8,
    value: 175,
    tags: [],
    desc: 'Sturdy boots with a reinforced steel toe.'
  },

  // ---------- Armor: Heavy Armor (body/head/legs/feet) ----------
  {
    id: 'heavy_body_plate_cuirass',
    name: 'Plate Cuirass',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 5,
    weight: 9,
    levelReq: 4,
    statReqs: { strength: 12 },
    value: 60,
    tags: [],
    desc: 'A heavy steel cuirass hammered from a single plate.'
  },
  {
    id: 'heavy_head_great_helm',
    name: 'Great Helm',
    slot: 'head',
    skill: 'Heavy Armor',
    armor: 5,
    weight: 9,
    levelReq: 4,
    statReqs: { strength: 12 },
    value: 58,
    tags: [],
    desc: 'A heavy enclosed helm that trades sight for safety.'
  },
  {
    id: 'heavy_legs_warplate_legguards',
    name: 'Warplate Legguards',
    slot: 'legs',
    skill: 'Heavy Armor',
    armor: 11,
    weight: 9,
    levelReq: 10,
    statReqs: { strength: 20 },
    value: 300,
    tags: [],
    desc: 'Massive plate legguards worn by Eldor heavy infantry.'
  },
  {
    id: 'heavy_feet_ironclad_sabatons',
    name: 'Ironclad Sabatons',
    slot: 'feet',
    skill: 'Heavy Armor',
    armor: 11,
    weight: 9,
    levelReq: 10,
    statReqs: { strength: 20 },
    value: 290,
    tags: [],
    desc: 'Solid steel sabatons that ring with every step.'
  },
  {
    id: 'heavy_head_riverguard_greathelm',
    name: 'Riverguard Greathelm',
    slot: 'head',
    skill: 'Heavy Armor',
    armor: 14,
    weight: 10,
    levelReq: 13,
    statReqs: { strength: 24 },
    value: 340,
    tags: [],
    desc: 'A reinforced greathelm issued to the river-patrol militia captains guarding the Gares delta.'
  },

  // ---------- Phase 4: level 8-14 gear for Gares Riverbanks/Ju`Mak stock (invented, follows the
  // same formulas as the Phase 2 header: weapon damage ~= 3 + 2*levelReq, armor ~= 1 + levelReq) ----------
  {
    id: 'sword_riverguard_falchion',
    name: 'Riverguard Falchion',
    slot: 'weapon',
    skill: 'Swords',
    damage: 27,
    weight: 6,
    levelReq: 12,
    statReqs: { strength: 22 },
    value: 320,
    tags: [],
    desc: 'A broad, curved blade carried by the river-patrol militia that guards the Gares delta trade barges.'
  },
  {
    id: 'knife_gares_fang',
    name: 'Gares Fang',
    slot: 'weapon',
    skill: 'Knives',
    damage: 23,
    weight: 3,
    levelReq: 9,
    statReqs: { dexterity: 18 },
    value: 240,
    tags: [],
    desc: 'A serrated blade fashioned from a River Stalker\'s tooth, still faintly cold to the touch.'
  },
  {
    id: 'rod_anima_touched_branch',
    name: 'Anima-Touched Branch',
    slot: 'weapon',
    skill: 'Rods',
    damage: 29,
    weight: 3,
    levelReq: 11,
    statReqs: { intelligence: 20 },
    value: 300,
    tags: [],
    desc: 'A gnarled branch that glows faintly with residual Anima, plucked from a riverbank tree grown strange.'
  },
  {
    id: 'medium_body_riverguard_brigandine',
    name: 'Riverguard Brigandine',
    slot: 'body',
    skill: 'Medium Armor',
    armor: 13,
    weight: 6,
    levelReq: 12,
    value: 260,
    tags: [],
    desc: 'Boiled leather studded with iron rivets, favored by the river-patrol militia against wetland ambushes.'
  },
  {
    id: 'light_head_wetland_cowl',
    name: 'Wetland Cowl',
    slot: 'head',
    skill: 'Light Armor',
    armor: 9,
    magicArmor: 3,
    weight: 2,
    levelReq: 11,
    value: 210,
    tags: [],
    desc: 'A water-resistant cowl woven with faint warding stitching against the delta\'s stray Anima.'
  },

  // ---------- Tents (DESIGN.md §6: camping heal fraction, used Phase 4) ----------
  {
    id: 'tent_ragged_bedroll',
    name: 'Ragged Bedroll',
    slot: 'none',
    skill: null,
    weight: 4,
    levelReq: 1,
    value: 10,
    tags: ['tent'],
    tentQuality: 0.25,
    desc: 'A thin bedroll that takes the worst of the chill off the ground.'
  },
  {
    id: 'tent_travelers_tent',
    name: "Traveler's Tent",
    slot: 'none',
    skill: null,
    weight: 7,
    levelReq: 5,
    value: 80,
    tags: ['tent'],
    tentQuality: 0.5,
    desc: 'A proper canvas tent that makes camping in the wild almost comfortable.'
  },
  {
    id: 'tent_expedition_pavilion',
    name: 'Expedition Pavilion',
    slot: 'none',
    skill: null,
    weight: 10,
    levelReq: 10,
    value: 260,
    tags: ['tent'],
    tentQuality: 0.75,
    desc: 'A sturdy waxed-canvas pavilion used by Eldor survey expeditions into the ruins and riverlands.'
  },

  // ---------- Potions (combat-usable, heal) ----------
  {
    id: 'potion_minor_healing',
    name: 'Minor Healing Potion',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 8,
    tags: [],
    combatUsable: true,
    heal: 25,
    desc: 'A small vial of red tonic that mends light wounds.'
  },
  {
    id: 'potion_healing',
    name: 'Healing Potion',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 5,
    value: 35,
    tags: [],
    combatUsable: true,
    heal: 60,
    desc: 'A stoppered flask brewed by Eldor apothecaries.'
  },
  {
    id: 'potion_greater_healing',
    name: 'Greater Healing Potion',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 10,
    value: 90,
    tags: [],
    combatUsable: true,
    heal: 120,
    desc: 'A shimmering elixir that closes even grievous wounds.'
  },
  {
    id: 'potion_riverbank_elixir',
    name: 'Riverbank Elixir',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 14,
    value: 150,
    tags: [],
    combatUsable: true,
    heal: 190,
    desc: 'A murky green tonic brewed from Gares riverweed and refined Anima runoff — potent, if foul-tasting.'
  },

  // ---------- Energy crystal (combat-usable, energyRestore) ----------
  {
    id: 'crystal_energy_shard',
    name: 'Energy Shard',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 3,
    value: 45,
    tags: [],
    combatUsable: true,
    energyRestore: 40,
    desc: 'A faintly glowing shard of Anima that restores spent energy. Simplifies the archived tech-charge economy into a direct Energy restore (DESIGN.md §5).'
  },

  // ---------- Cursed item (classic trap: good stats, tag 'cursed') ----------
  {
    id: 'ring_of_the_hollow_king',
    name: 'Ring of the Hollow King',
    slot: 'head',
    skill: 'Light Armor',
    armor: 18,
    weight: 1,
    levelReq: 1,
    value: 1,
    tags: ['cursed'],
    desc: 'A cold band of black iron. Its previous wearer is nowhere to be found. It fits suspiciously well, and does not want to come off.'
  },

  // ---------- Lore item (no stats, flavor only) ----------
  {
    id: 'lore_estari_shard_tablet',
    name: 'Estari Shard-Tablet',
    slot: 'none',
    skill: null,
    weight: 2,
    levelReq: 1,
    value: 0,
    tags: ['lore'],
    desc: 'A fragment of dark stone covered in Estari glyphs, cool to the touch. Scholars in Eldor say its markings speak of a "ninth dimension" long before the first Anima mines were sunk.'
  },

  // =====================================================================
  // Phase 5: quest-only collect materials (DESIGN.md §7). Invented — no archived item ids
  // survived (see js/data/items.js header comment). No combat/equip stats; value is a small
  // sell-back so an over-collected surplus isn't a dead weight sink.
  // =====================================================================
  {
    id: 'quest_majiku_venom_gland',
    name: 'Majiku Venom Gland',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 4,
    tags: ['no-trade'],
    desc: "A preserved gland harvested from a Majiku raider's blade-tip poison. Dr. Ferrier in Eldor pays well for these — for research, he insists."
  },
  {
    id: 'quest_animate_rubble_core',
    name: 'Animate Rubble Core',
    slot: 'none',
    skill: null,
    weight: 2,
    levelReq: 1,
    value: 6,
    tags: ['no-trade'],
    desc: 'A fist-sized chunk of Estari stone still humming faintly with residual Anima — the "core" that keeps loose rubble shambling.'
  },
  {
    id: 'quest_riverweed_bundle',
    name: 'Riverweed Bundle',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 3,
    tags: ['no-trade'],
    desc: "A dripping bundle of Gares riverweed, prized by Eldor's Synthesis Shop for its Anima-touched potency."
  },
  {
    id: 'quest_sealed_supply_crate',
    name: 'Sealed Supply Crate',
    slot: 'none',
    skill: null,
    weight: 6,
    levelReq: 1,
    value: 0,
    tags: ['no-trade', 'lore'],
    desc: "A crate stamped with the Eldor merchant guild's seal, bound for Ju`Mak Village. Best not to look inside."
  },

  // =====================================================================
  // Phase 6a: class quest ("The Trials of Eldor") collect materials — invented, Anima-flavored,
  // dropped by the estari_ruin_warden alongside its existing loot table (js/data/monsters.js).
  // =====================================================================
  {
    id: 'quest_condensed_anima_core',
    name: 'Condensed Anima Core',
    slot: 'none',
    skill: null,
    weight: 2,
    levelReq: 1,
    value: 10,
    tags: ['no-trade'],
    desc: "A knot of Anima condensed at the Ruin Warden's heart, still faintly warm. Eldor's Academy examiners want it intact."
  },
  {
    id: 'quest_estari_ward_fragment',
    name: 'Estari Ward Fragment',
    slot: 'none',
    skill: null,
    weight: 2,
    levelReq: 1,
    value: 10,
    tags: ['no-trade'],
    desc: 'A shard of the wardstone that bound the Ruin Warden to its post for centuries, humming faintly with unspent Anima.'
  },

  // =====================================================================
  // Phase 6b: Endgame World Expansion (DESIGN.md §2/§10) — level 14-36 gear for Saratus/the
  // Foothills/Juneros/Kastengard content below. Same invented formulas as the Phase 2 header:
  // weapon damage ~= 3 + 2*levelReq, armor ~= 1 + levelReq. Weight/value conventions match the
  // existing Phase 4 tier (light ~2, medium ~5-6, heavy ~9-10; weapons 3-8).
  // =====================================================================

  // ---------- Weapons: tier 1 (~level 15), one per weapon skill ----------
  {
    id: 'sword_saratus_battlemage_blade',
    name: 'Saratus Battlemage Blade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 33,
    weight: 6,
    levelReq: 15,
    statReqs: { strength: 26 },
    value: 380,
    tags: [],
    desc: 'A rune-etched blade carried by Saratus battlemages, who reinforce the front line with white and black magic (Arkan.md).'
  },
  {
    id: 'polearm_foothills_pike',
    name: 'Foothills Pike',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 33,
    weight: 8,
    levelReq: 15,
    statReqs: { strength: 26 },
    value: 380,
    tags: [],
    desc: 'A long, iron-shod pike favored by hunters who track game along the northern barrier\'s rocky slopes.'
  },
  {
    id: 'knife_juneros_tidefang',
    name: 'Juneros Tidefang',
    slot: 'weapon',
    skill: 'Knives',
    damage: 33,
    weight: 3,
    levelReq: 15,
    statReqs: { dexterity: 26 },
    value: 380,
    tags: [],
    desc: 'A curved knife carved from a reef predator\'s tooth, salt-worn and still razor-sharp.'
  },
  {
    id: 'rod_arkan_runic_conduit',
    name: 'Arkan Runic Conduit',
    slot: 'weapon',
    skill: 'Rods',
    damage: 33,
    weight: 4,
    levelReq: 15,
    statReqs: { intelligence: 26 },
    value: 380,
    tags: [],
    desc: 'A channeling rod inscribed with the runic script Saratus battlemages study for a lifetime.'
  },
  {
    id: 'hth_stormward_wraps',
    name: 'Stormward Wraps',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 33,
    weight: 3,
    levelReq: 15,
    statReqs: { strength: 26 },
    value: 380,
    tags: [],
    desc: 'Weighted wraps humming faintly with Star-grade Anima, favored by monks who train in the foothills\' thin air.'
  },

  // ---------- Weapons: tier 2 (~level 25), one per weapon skill ----------
  // Phase 7 balance pass: this tier was missing entirely — the ladder jumped from level 15
  // (damage 33) to level 35 (damage 73), leaving levels 20-34 fighting with stale gear and
  // stalling endgame battles. Damage follows the established 3 + 2*levelReq formula.
  {
    id: 'sword_juneros_tidebrand',
    name: 'Juneros Tidebrand',
    slot: 'weapon',
    skill: 'Swords',
    damage: 53,
    weight: 7,
    levelReq: 25,
    statReqs: { strength: 34 },
    value: 950,
    tags: [],
    desc: 'A cutlass forged in the isle settlements of Juneros, its edge stained the grey-green of the inland sea (Averast.md).'
  },
  {
    id: 'polearm_barrier_glaive',
    name: 'Barrier Glaive',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 53,
    weight: 9,
    levelReq: 25,
    statReqs: { strength: 34 },
    value: 950,
    tags: [],
    desc: 'A long glaive patterned after the watch-pikes of the northern mountain garrisons no Human or Arkan has ever crossed beyond (Averast.md).'
  },
  {
    id: 'knife_leviathan_fang',
    name: 'Leviathan Fang',
    slot: 'weapon',
    skill: 'Knives',
    damage: 53,
    weight: 4,
    levelReq: 25,
    statReqs: { dexterity: 34 },
    value: 950,
    tags: [],
    desc: 'A curved dagger ground from a tooth of the Juneros leviathan, still cold to the touch.'
  },
  {
    id: 'rod_kuraan_runewood',
    name: 'Kuraan Runewood Rod',
    slot: 'weapon',
    skill: 'Rods',
    damage: 53,
    weight: 5,
    levelReq: 25,
    statReqs: { intelligence: 34 },
    value: 950,
    tags: [],
    desc: 'A rod of dark runewood salvaged from the lost Forests of Kuraan, humming with old Arkan rune-craft (Arkan.md).'
  },
  {
    id: 'hth_construct_gauntlets',
    name: 'Construct Gauntlets',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 53,
    weight: 6,
    levelReq: 25,
    statReqs: { strength: 34 },
    value: 950,
    tags: [],
    desc: 'Stone-plated gauntlets pried from a fallen Estari construct, heavy as a wall and twice as hard.'
  },

  // ---------- Weapons: tier 3 (~level 35), one per weapon skill ----------
  {
    id: 'sword_kastengard_relic_blade',
    name: 'Kastengard Relic Blade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 73,
    weight: 7,
    levelReq: 35,
    statReqs: { strength: 44 },
    value: 1400,
    tags: [],
    desc: 'A blade recovered from the Society of Modern Magic\'s deepest vaults, its edge still holding a centuries-old charge.'
  },
  {
    id: 'polearm_vault_reaver',
    name: 'Vault Reaver',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 73,
    weight: 9,
    levelReq: 35,
    statReqs: { strength: 44 },
    value: 1400,
    tags: [],
    desc: 'A massive polearm salvaged from a Kastengard wardframe\'s broken halberd-arm, reforged for a human grip.'
  },
  {
    id: 'knife_custodian_needle',
    name: "Custodian's Needle",
    slot: 'weapon',
    skill: 'Knives',
    damage: 73,
    weight: 3,
    levelReq: 35,
    statReqs: { dexterity: 44 },
    value: 1400,
    tags: [],
    desc: 'A precision blade drawn from the Custodian construct\'s own dismantled targeting spike.'
  },
  {
    id: 'rod_eidas_remnant_wand',
    name: "Eidas' Remnant Wand",
    slot: 'weapon',
    skill: 'Rods',
    damage: 73,
    weight: 4,
    levelReq: 35,
    statReqs: { intelligence: 44 },
    value: 1400,
    tags: [],
    desc: 'A wand grown from crystallized Anima runoff deep in the Kastengard vaults, said to still resonate faintly with the red moon.'
  },
  {
    id: 'hth_vault_gauntlets',
    name: 'Vault-Forged Gauntlets',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 73,
    weight: 4,
    levelReq: 35,
    statReqs: { strength: 44 },
    value: 1400,
    tags: [],
    desc: 'Gauntlets forged in the Society\'s deepest workshop, their knuckles set with inert but still-warm Anima studs.'
  },

  // ---------- Offhand: Shield (Saratus tier) ----------
  {
    id: 'shield_arkan_wardplate',
    name: 'Arkan Wardplate',
    slot: 'offhand',
    skill: 'Shields',
    armor: 16,
    magicArmor: 6,
    weight: 8,
    levelReq: 15,
    statReqs: { strength: 24 },
    value: 400,
    tags: [],
    desc: 'A Saratus-forged shield warded against both blade and Anima alike.'
  },

  // ---------- Armor: tier 1 (~level 15) — light/medium/heavy, two pieces each ----------
  {
    id: 'light_body_arkan_silkweave',
    name: 'Arkan Silkweave Robe',
    slot: 'body',
    skill: 'Light Armor',
    armor: 16,
    magicArmor: 5,
    weight: 3,
    levelReq: 15,
    value: 360,
    tags: [],
    desc: 'A finely woven Saratus robe, light enough for spellwork but stitched with warding thread.'
  },
  {
    id: 'light_head_arkan_silk_hood',
    name: 'Arkan Silk Hood',
    slot: 'head',
    skill: 'Light Armor',
    armor: 16,
    magicArmor: 5,
    weight: 2,
    levelReq: 15,
    value: 350,
    tags: [],
    desc: 'A matching hood to the Silkweave Robe, favored by Saratus battlemages between engagements.'
  },
  {
    id: 'medium_body_foothills_hauberk',
    name: 'Foothills Hauberk',
    slot: 'body',
    skill: 'Medium Armor',
    armor: 16,
    weight: 6,
    levelReq: 15,
    value: 370,
    tags: [],
    desc: 'A riveted leather hauberk worn by hunters who range the barrier foothills for weeks at a time.'
  },
  {
    id: 'medium_legs_foothills_greaves',
    name: 'Foothills Greaves',
    slot: 'legs',
    skill: 'Medium Armor',
    armor: 16,
    weight: 6,
    levelReq: 15,
    value: 365,
    tags: [],
    desc: 'Reinforced greaves suited to steep, rocky ground near the mountain wall.'
  },
  {
    id: 'heavy_body_juneros_scaleplate',
    name: 'Juneros Scaleplate',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 16,
    weight: 10,
    levelReq: 15,
    statReqs: { strength: 26 },
    value: 380,
    tags: [],
    desc: 'Plate armor scaled like a reef predator\'s hide, favored by Juneros militia against the isle\'s tidewalkers.'
  },
  {
    id: 'heavy_head_juneros_scalehelm',
    name: 'Juneros Scalehelm',
    slot: 'head',
    skill: 'Heavy Armor',
    armor: 16,
    weight: 10,
    levelReq: 15,
    statReqs: { strength: 26 },
    value: 375,
    tags: [],
    desc: 'A helm plated to match the Juneros Scaleplate, salt-stained from long patrols on the isle\'s shore.'
  },

  // ---------- Armor: tier 2 (~level 30-35) — one body piece each of light/medium/heavy ----------
  {
    id: 'light_body_kastengard_wardweave',
    name: 'Kastengard Wardweave',
    slot: 'body',
    skill: 'Light Armor',
    armor: 31,
    magicArmor: 10,
    weight: 4,
    levelReq: 30,
    value: 900,
    tags: [],
    desc: 'Cloth woven with thread reclaimed from a wardframe\'s inner lining, still faintly resistant to hostile Anima.'
  },
  {
    id: 'medium_body_custodian_plate',
    name: 'Custodian-Plate Vest',
    slot: 'body',
    skill: 'Medium Armor',
    armor: 31,
    weight: 7,
    levelReq: 32,
    value: 950,
    tags: [],
    desc: 'Segmented plate salvaged from the Custodian construct\'s outer shell, refitted to a hero\'s frame.'
  },
  {
    id: 'heavy_body_vault_bulwark',
    name: 'Vault Bulwark Plate',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 37,
    weight: 11,
    levelReq: 35,
    statReqs: { strength: 40 },
    value: 1350,
    tags: [],
    desc: 'Heavy plate forged in the deepest Kastengard vault, dense enough to have outlasted three centuries of silence.'
  },

  // ---------- Potions / crystals ----------
  {
    id: 'crystal_pure_anima',
    name: 'Crystal of Pure Anima',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 20,
    value: 220,
    tags: [],
    combatUsable: true,
    energyRestore: 90,
    desc: 'A larger, unrefined shard of Anima drawn straight from a deep seam — restores far more spent Energy than a common shard (DESIGN.md §5).'
  },

  // =====================================================================
  // Phase 6b: quest-only collect materials (DESIGN.md §7), same convention as the Phase 5/6a
  // blocks above — no combat/equip stats, small sell-back value, no-trade tagged.
  // =====================================================================
  {
    id: 'quest_frostram_hide',
    name: 'Frost Ram Hide',
    slot: 'none',
    skill: null,
    weight: 2,
    levelReq: 1,
    value: 8,
    tags: ['no-trade'],
    desc: 'A thick, frost-flecked hide from a Stoneback Giant\'s favorite prey, prized by Saratus tailors for cold-weather cloaks.'
  },
  {
    id: 'quest_matriarch_horn',
    name: "Matriarch's Horn",
    slot: 'none',
    skill: null,
    weight: 3,
    levelReq: 1,
    value: 20,
    tags: ['no-trade'],
    desc: 'A cracked horn taken from the fallen Matriarch of the High Camp, still warm to the touch long after the fight.'
  },
  {
    id: 'quest_settler_locket',
    name: "Drowned Settler's Locket",
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 5,
    tags: ['no-trade'],
    desc: 'A tarnished locket recovered from a Drowned Settler, its portrait long since washed away by the tide.'
  },
  {
    id: 'quest_leviathan_scale',
    name: 'Leviathan Scale',
    slot: 'none',
    skill: null,
    weight: 4,
    levelReq: 1,
    value: 24,
    tags: ['no-trade'],
    desc: 'A single scale the size of a shield, shed by the Juneros Leviathan — still faintly damp no matter how long it dries.'
  },
  {
    id: 'quest_society_ledger_page',
    name: 'Society Ledger Page',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 10,
    tags: ['no-trade'],
    desc: 'A brittle page from a Society of Modern Magic research ledger, its handwriting meticulous even three centuries on.'
  },
  {
    id: 'quest_custodian_core_shard',
    name: 'Custodian Core Shard',
    slot: 'none',
    skill: null,
    weight: 3,
    levelReq: 1,
    value: 26,
    tags: ['no-trade'],
    desc: 'A fragment of the Kastengard Custodian\'s inner core, still humming faintly with the same Anima the Estari once mined.'
  },
  {
    id: 'quest_archivist_key',
    name: "Archivist's Key",
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 16,
    tags: ['no-trade'],
    desc: 'An intricate key taken from the Forsaken Archivist, said to open the Society\'s deepest sealed record-cases.'
  },
  {
    id: 'quest_eidas_echo_seal',
    name: "Eidas' Echo-Seal",
    slot: 'none',
    skill: null,
    weight: 2,
    levelReq: 1,
    value: 50,
    tags: ['no-trade'],
    desc: 'A seal of crystallized Anima that held the Echo bound to the Skyspire\'s old ground anchor. It no longer hums, now that the Echo is finally, truly gone.'
  },

  // ---------- Lore item: closes the story arc (dropped by eidas_echo) ----------
  {
    id: 'lore_eidas_final_journal',
    name: "Eidas' Final Journal",
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 0,
    tags: ['lore'],
    // invented continuation, closing chapter_2 (js/data/story.js) — the journal is the payoff
    // for "somewhere above Van Arius, past the clouds, a twinkling light still crosses the night
    // sky on quiet evenings, exactly where the old stories say the Skyspire vanished."
    desc: 'A water-stained journal, its last legible entry unmistakably in Eidas\' own hand: "...the red moon does not answer as it once did, and I begin to wonder if we shepherds have been shepherded ourselves. If this echo is ever found and read, know that Van Arius was never abandoned — only watched. Watched, and, I think now, envied." The final page is blank but for a single sketch of a moon, waning.'
  },

  // =====================================================================
  // Phase 9: Unique equipment (DESIGN.md §2 lore: Estari, Majiku, Anima, Kuraan, the Skyspire).
  // Invented items, monster-only — tag 'unique' below. Never sold in any shop stock (js/data/
  // areas.js) and never a synthesis input/output (js/data/recipes.js); each is dropped by exactly
  // ONE monster (js/data/monsters.js, appended as that monster's LAST drop entry — the established
  // "append-last, first-hit-wins" convention so existing drop rates are undisturbed). The concept
  // itself is archived: reference/forum/t-756.md ("Meh, three uniques?... those damn thieves keep
  // taking all my damn gold whenever I try to rest") — the same thread that anchors Feature 2's
  // camping robbery names "Unique items" directly as a known v1 rarity tier; their contents here
  // are invented (no archived item ids survived — see this file's header comment).
  // Spread: 2 early (levelReq 3-6), 3 mid (9-15), 3 upper (19-28), 4 boss signatures (bands 10,
  // 18, 25, and 32-40 — one boss per band, matching estari_ruin_warden/foothills_matriarch/
  // juneros_leviathan/eidas_echo). Each is either ~+15-25% over its tier's shop-equivalent stat,
  // or trades a hybrid stat shop gear never carries (a weapon with +magicArmor, an armor piece
  // with +damage, a shield with +damage, or a knife trading extra damage for a heavier statReq).
  // =====================================================================

  // ---------- Early tier (levelReq 3-6) ----------
  {
    id: 'knife_vermin_kings_fang',
    name: "Vermin King's Fang",
    slot: 'weapon',
    skill: 'Knives',
    damage: 14, // hybrid: high damage for its level (formula ~9) traded for a heavier Dex req below
    weight: 3,
    levelReq: 3,
    statReqs: { dexterity: 16 }, // hybrid: unusually heavy statReq for a level-3 knife
    value: 90,
    tags: ['unique'],
    desc: "A needle-fine blade pried from something that once led the Averast plains' vermin swarms — too well-balanced to have been gnawed into shape by anything with paws."
  },
  {
    id: 'light_body_ashroot_ward_cloak',
    name: 'Ashroot Ward-Cloak',
    slot: 'body',
    skill: 'Light Armor',
    armor: 9,
    damage: 4, // hybrid: armor granting a weapon-like Damage bonus (thorn-strips woven through the weave), a stat shop light armor never carries
    weight: 2,
    levelReq: 6,
    value: 130,
    tags: ['unique'],
    desc: "A Majiku scout's cloak, its lining threaded with barbed ashwood strips from the Forests of Kuraan — soft as cloth until something grabs hold of the wearer."
  },

  // ---------- Mid tier (levelReq 9-15) ----------
  {
    id: 'sword_raiders_ironclaw_blade',
    name: "Raider's Ironclaw Blade",
    slot: 'weapon',
    skill: 'Swords',
    damage: 29, // +26% over sword_arkan_runeblade (lvl10, dmg 23), same levelReq
    weight: 6,
    levelReq: 10,
    statReqs: { strength: 24 }, // heavier than sword_arkan_runeblade's 20
    value: 300,
    tags: ['unique'],
    desc: 'A river-raider\'s prized blade, its edge notched from Gares delta skirmishes and never once dulled past a whetstone\'s reach.'
  },
  {
    id: 'rod_tideglass_conduit',
    name: 'Tideglass Conduit Rod',
    slot: 'weapon',
    skill: 'Rods',
    damage: 31, // +15% over formula (3+2*12=27)
    magicArmor: 5, // hybrid: a weapon carrying +Magic Armor, a stat shop rods never have
    weight: 3,
    levelReq: 12,
    statReqs: { intelligence: 22 },
    value: 340,
    tags: ['unique'],
    desc: 'A rod of fused river-glass, channeling the Gares current\'s own Water-grade Anima back around its caster like a second skin.'
  },
  {
    id: 'heavy_body_stoneback_warplate',
    name: 'Stoneback Warplate',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 19, // +19% over heavy_body_juneros_scaleplate (lvl15, armor 16)
    magicArmor: 6, // hybrid: heavy armor with +Magic Armor, a stat shop heavy armor never has
    weight: 10,
    levelReq: 15,
    statReqs: { strength: 28 },
    value: 420,
    tags: ['unique'],
    desc: "Lichen-crusted plate hammered from a foothills giant's own shed hide-stone, heavier than it has any right to be and warm with old Earth-grade Anima."
  },

  // ---------- Upper tier (levelReq 19-28) ----------
  {
    id: 'polearm_tidewalkers_harpoon',
    name: "Tidewalker's Harpoon",
    slot: 'weapon',
    skill: 'Polearms',
    damage: 48, // +17% over formula (3+2*19=41)
    magicArmor: 5, // hybrid: a weapon carrying +Magic Armor
    weight: 8,
    levelReq: 19,
    statReqs: { strength: 30 },
    value: 650,
    tags: ['unique'],
    desc: 'A barbed harpoon salvaged from the isle\'s own tideline predators, its haft still faintly slick with brine that never quite dries.'
  },
  {
    id: 'shield_coral_wardens_bulwark',
    name: "Coral Warden's Bulwark",
    slot: 'offhand',
    skill: 'Shields',
    armor: 22,
    magicArmor: 9,
    damage: 6, // hybrid: a shield with +Damage (spiked coral edge), a stat shop shields never have
    weight: 9,
    levelReq: 21,
    statReqs: { strength: 30 },
    value: 700,
    tags: ['unique'],
    desc: "A merfolk adept's coral shrine-shield, its spiked rim as good for a riposte as for turning aside a blade."
  },
  {
    id: 'hth_custodian_wrought_gauntlets',
    name: 'Custodian-Wrought Gauntlets',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 70, // +19% over formula (3+2*28=59)
    armor: 8, // hybrid: an HTH weapon carrying +Armor, a stat shop HTH weapons never have
    weight: 5,
    levelReq: 28,
    statReqs: { strength: 46 },
    value: 1050,
    tags: ['unique'],
    desc: "Segmented knuckle-plate stripped from the heaviest of Kastengard's sentry-constructs, still cold with the Society's old craft."
  },

  // ---------- Boss signatures (bands 10 / 18 / 25 / 32-40) ----------
  {
    id: 'rod_wardens_anima_core',
    name: "Warden's Anima Core",
    slot: 'weapon',
    skill: 'Rods',
    damage: 27, // +17% over rod_saratus_conduit (lvl9, dmg 21)
    magicArmor: 6, // hybrid: a weapon carrying +Magic Armor
    weight: 4,
    levelReq: 10,
    statReqs: { intelligence: 22 },
    value: 320,
    tags: ['unique'],
    // boss signature: estari_ruin_warden (js/data/monsters.js), level 10 band
    desc: "A fist-sized core pried from the Ruin Warden's stone chest, still humming with the same restless Anima that kept it standing watch for centuries."
  },
  {
    id: 'hth_matriarchs_fang_wraps',
    name: "Matriarch's Fang-Wraps",
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 48, // +23% over formula (3+2*18=39)
    magicArmor: 5, // hybrid: an HTH weapon carrying +Magic Armor (Wind-grade, matching the Matriarch's element)
    weight: 3,
    levelReq: 18,
    statReqs: { strength: 28 },
    value: 8, // invented: kept low like the existing cursed ring — the Shrine uncurse fee equals item.value
    tags: ['unique', 'cursed'],
    // boss signature: foothills_matriarch (js/data/monsters.js), level 18 band. Cursed per the
    // "one unique may carry 'cursed' if flavorful" allowance — the pack-mother's fangs bind
    // ferally to the wearer's knuckles and will not come off without a Spirit Shrine visit
    // (js/core/inventory.js unequip / js/core/world.js uncurse already handle 'cursed' generically).
    desc: "Wrapped fangs torn from the Matriarch of the High Camp herself, still hungry. They bite into the wearer's grip and do not want to let go — a Spirit Shrine can lift the curse."
  },
  {
    id: 'heavy_body_leviathanhide_bulwark',
    name: 'Leviathanhide Bulwark',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 32, // +18% over an interpolated tier-25 heavy body (juneros_scaleplate 16 @ lvl15 -> vault_bulwark_plate 37 @ lvl35, ~27 at lvl25)
    magicArmor: 8, // hybrid: heavy armor with +Magic Armor (Water-grade)
    weight: 11,
    levelReq: 25,
    statReqs: { strength: 36 },
    value: 1150,
    tags: ['unique'],
    // boss signature: juneros_leviathan (js/data/monsters.js), level 25 band
    desc: "Scaled plate cut from the Juneros Leviathan's own flank, cured by the deep shoal's cold currents until it turned harder than any forge-tempered steel."
  },
  {
    id: 'sword_skyspire_ember_blade',
    name: 'Skyspire Ember-Blade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 92, // +26% over sword_kastengard_relic_blade (lvl35, dmg 73), the best pre-existing sword
    magicArmor: 10, // hybrid: a weapon carrying +Magic Armor (Light/Dark, "divine race" flavor)
    weight: 7,
    levelReq: 38,
    statReqs: { strength: 50 },
    value: 1800,
    tags: ['unique'],
    // boss signature: eidas_echo (js/data/monsters.js), the 32-40 band's final boss — the true
    // capstone of the roster, closing out the story alongside lore_eidas_final_journal above.
    desc: "A blade that fell burning from the Skyspire's old ground anchor when Eidas' Echo was finally laid to rest, its edge still warm with red-moon ember-light."
  }
];

window.Game = Game;
