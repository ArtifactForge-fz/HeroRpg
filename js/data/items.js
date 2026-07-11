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

  // ---------- Offhand: Dual Wield weapons (v1.2 Phase 1 item 5) ----------
  // invented (user-directed): use-based skill system. These share the `offhand` slot with the
  // Shields above but carry a `damage` field instead of `armor` — js/core/battle.js attack()'s
  // dual-wielding check (`offhandItem.damage !== undefined`) is what tells the two apart, so a
  // player equips either a shield OR an offhand weapon there, never both. Same equip requirements
  // (levelReq/statReqs) as an equivalent main-hand weapon of the same skill/tier.
  {
    id: 'knife_offhand_twinfang',
    name: 'Twinfang Dirk',
    slot: 'offhand',
    skill: 'Knives',
    damage: 4,
    weight: 2,
    levelReq: 1,
    value: 16,
    tags: [],
    desc: 'A short, balanced dirk meant to be paired with a main-hand blade rather than carried alone.'
  },
  {
    id: 'hth_offhand_cestus',
    name: "Brawler's Cestus",
    slot: 'offhand',
    skill: 'Hand to Hand',
    damage: 5,
    weight: 2,
    levelReq: 1,
    value: 16,
    tags: [],
    desc: 'A weighted leather cestus worn on the off hand to double up a bare-knuckle fighter\'s strikes.'
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
  },

  // =====================================================================
  // v1.2 Phase 3 (docs/SPEC-V1.2.md Content-B item 1): graded Crystals & Spheres. Names
  // [archived] (reference/manual/Recent_Updates.md 2007-05-14 "Added B Class Crystals and
  // Spheres to areas level 20+"; 2007-04-20 "Added Light & Dark Crystals as well as Light & Dark
  // Spheres"). Numbers [invented], anchored to the one archived hard number: 2007-04-06 "All
  // Crystals restore 70% charge" — Grade III below sits at 70% of a level-30 character's
  // energyMax (BALANCE.START_ENERGY + (level-1)*BALANCE.ENERGY_PER_LEVEL, no stat dependency),
  // with the other three grades scaled around it per the spec's own example ladder
  // (40/55/70/85%): energyMax(20)=195*0.40=78->80, (25)=220*0.55=121->120,
  // (30)=245*0.70=171.5->170 (the 70% anchor), (35)=270*0.85=229.5->230. Crystal restores Energy
  // only; Sphere restores HP only. Max HP has no clean level-only formula (vitality-driven, per
  // character.js HP_PER_VITALITY) so the Sphere line instead extrapolates the existing potion
  // heal curve (potion_minor_healing/potion_healing/potion_greater_healing/potion_riverbank_elixir
  // = 25/60/120/190 at levelReq 1/5/10/14) forward at the same four-grade cadence — invented, no
  // archived HP% exists. The Light & Dark premium variants sit above BOTH graded ceilings (a
  // "restore both, and more" premium per the spec): Light/Dark Crystal beats Crystal IV's Energy
  // number (260 > 230) plus a smaller HP bonus; Light/Dark Sphere beats Sphere IV's HP number
  // (560 > 500) plus a smaller Energy bonus. Light and Dark are mechanically identical (flavor-
  // only pair, matching how several other Light/Dark entries in this data set mirror each other).
  // Placement: appended (never inserted before) to the drops of 10 of the 14 level-20-to-40
  // hunting monsters in js/data/monsters.js — the other 4 (juneros_coral_warden, juneros_leviathan,
  // kastengard_earthbound_sentinel, eidas_echo) already end their drops array with a pinned
  // 'unique'-tagged or guaranteed (chance:1) entry that test_p6b_content.js requires stay LAST, so
  // those four are left untouched rather than displacing that entry.
  // =====================================================================
  {
    id: 'crystal_bclass_1',
    name: 'B-Class Crystal I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 20,
    value: 200,
    tags: [],
    combatUsable: true,
    energyRestore: 80,
    desc: 'The weakest of the B-Class Crystals mined from the deeper Gares/Juneros seams — restores a modest measure of spent Energy.'
  },
  {
    id: 'crystal_bclass_2',
    name: 'B-Class Crystal II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 25,
    value: 300,
    tags: [],
    combatUsable: true,
    energyRestore: 120,
    desc: 'A denser B-Class Crystal, humming with more Anima than its lesser kin.'
  },
  {
    id: 'crystal_bclass_3',
    name: 'B-Class Crystal III',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 30,
    value: 420,
    tags: [],
    combatUsable: true,
    energyRestore: 170,
    desc: 'A B-Class Crystal cut to the standard grade sold across every level-20-and-up outpost — restores roughly seven-tenths of a hero\'s Energy in one draught.'
  },
  {
    id: 'crystal_bclass_4',
    name: 'B-Class Crystal IV',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 35,
    value: 560,
    tags: [],
    combatUsable: true,
    energyRestore: 230,
    desc: 'The finest B-Class Crystal grade, nearly saturated with raw, undirected Anima.'
  },
  {
    id: 'sphere_bclass_1',
    name: 'B-Class Sphere I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 20,
    value: 210,
    tags: [],
    combatUsable: true,
    heal: 260,
    desc: 'The weakest of the B-Class Spheres, a smooth Anima-touched orb that mends flesh rather than restoring Energy.'
  },
  {
    id: 'sphere_bclass_2',
    name: 'B-Class Sphere II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 25,
    value: 280,
    tags: [],
    combatUsable: true,
    heal: 340,
    desc: 'A denser B-Class Sphere, warm to the touch and quicker to close a wound.'
  },
  {
    id: 'sphere_bclass_3',
    name: 'B-Class Sphere III',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 30,
    value: 350,
    tags: [],
    combatUsable: true,
    heal: 420,
    desc: 'A B-Class Sphere cut to the standard grade sold across every level-20-and-up outpost.'
  },
  {
    id: 'sphere_bclass_4',
    name: 'B-Class Sphere IV',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 35,
    value: 430,
    tags: [],
    combatUsable: true,
    heal: 500,
    desc: 'The finest B-Class Sphere grade, closing even grievous wounds in a single use.'
  },
  {
    id: 'crystal_light',
    name: 'Light Crystal',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 38,
    value: 750,
    tags: [],
    combatUsable: true,
    energyRestore: 260,
    heal: 130,
    desc: 'A Crystal cut through with Light-grade Anima — restores more Energy than any B-Class grade, and a measure of HP besides.'
  },
  {
    id: 'crystal_dark',
    name: 'Dark Crystal',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 38,
    value: 750,
    tags: [],
    combatUsable: true,
    energyRestore: 260,
    heal: 130,
    desc: 'A Crystal shot through with Dark-grade Anima — mechanically identical to its Light-grade twin, restoring the same Energy and HP.'
  },
  {
    id: 'sphere_light',
    name: 'Light Sphere',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 38,
    value: 800,
    tags: [],
    combatUsable: true,
    heal: 560,
    energyRestore: 90,
    desc: 'A Sphere cut through with Light-grade Anima — mends more than any B-Class grade, and restores a measure of Energy besides.'
  },
  {
    id: 'sphere_dark',
    name: 'Dark Sphere',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 38,
    value: 800,
    tags: [],
    combatUsable: true,
    heal: 560,
    energyRestore: 90,
    desc: 'A Sphere shot through with Dark-grade Anima — mechanically identical to its Light-grade twin, restoring the same HP and Energy.'
  },

  // =====================================================================
  // v1.2 Phase 3 (docs/SPEC-V1.2.md Content-B item 2): level-30+ shop stock. Concept [archived]
  // (reference/manual/Version_2.1_Changes.md: "10 levels of new content for players level 30+",
  // "Added energy stones to level 30+ shop", "Added synthesis shop items for levels 30+"). Item
  // definitions only — Content-A's later agent attaches the level-30+ outpost shop that stocks
  // these (js/data/areas.js); "energy stones" are archived as their own distinct item family from
  // the Crystal line above, so kept as a separate id/name here. Numbers [invented].
  // =====================================================================
  {
    id: 'stone_energy_lesser',
    name: 'Lesser Energy Stone',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 30,
    value: 240,
    tags: [],
    combatUsable: true,
    energyRestore: 200,
    desc: 'A smooth, palm-sized stone sold at the level-30+ outposts for its dependable Energy restoration — cheaper and more common than a mined Crystal.'
  },
  {
    id: 'stone_energy_greater',
    name: 'Greater Energy Stone',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 35,
    value: 320,
    tags: [],
    combatUsable: true,
    energyRestore: 260,
    desc: 'A larger, more tightly-bound Energy Stone, favored by heroes who range the level-30+ frontier for long stretches between towns.'
  },
  {
    id: 'material_refined_anima_dust',
    name: 'Refined Anima Dust',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 30,
    value: 40,
    tags: [],
    desc: 'A pouch of finely-ground, stabilized Anima dust — a level-30+ Synthesis Shop staple, too diffuse to restore anything on its own but a common transmutation-recipe component.'
  },
  {
    id: 'potion_vault_reserve',
    name: 'Vault Reserve Tonic',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 33,
    value: 480,
    tags: [],
    combatUsable: true,
    heal: 620,
    desc: 'A dense, bitter tonic stocked by the level-30+ outposts, distilled from reserves the Society of Modern Magic left sealed in Kastengard\'s vaults.'
  },

  // =====================================================================
  // Level-Arc Band A (docs/SPEC-ARC-BANDS.md, F2/F3): Forests of Kuraan, levels 41-50. First band
  // past the L36-40 Skyspire/Eidas act-break. Weapon/armor damage and armor values below are
  // TAPERED per the F1 CONVENTION NOTES block in js/balance.js (F1 finding, mandatory past band
  // 35): effectiveLevelReq = 35 + 0.7*(levelReq-35). Main tier at levelReq 45 (effectiveLevelReq
  // 42 -> damage 3+2*42=87, armor 1+42=43 — NOT the literal 3+2*45=93 / 1+45=46); a levelReq-48
  // sub-tier (effectiveLevelReq 44.1 -> damage ~91, armor ~45). Bands <=35 are unchanged (kept
  // literal, per the F1 note). statReqs continue the existing levelReq+9-ish trend (e.g.
  // sword_kastengard_relic_blade levelReq35/statReq44); value is an invented economy continuation
  // of the existing per-tier growth curve (no archived value formula survived — see this file's
  // header comment).
  // =====================================================================

  // ---------- Weapons: tier (levelReq 45), one per weapon skill ----------
  {
    id: 'sword_kuraan_reclaimers_blade',
    name: "Reclaimer's Blade",
    slot: 'weapon',
    skill: 'Swords',
    damage: 87, // TAPERED: effectiveLevelReq 35+0.7*10=42 -> 3+2*42=87 (F1 finding; NOT the literal 3+2*45=93)
    weight: 7,
    levelReq: 45,
    statReqs: { strength: 54 },
    value: 1750,
    tags: [],
    desc: 'A reforged blade carried by the first heroes to push back into the Forests of Kuraan, its edge marked with a reclamation-band sigil.'
  },
  {
    id: 'polearm_arkan_vanguard_lance',
    name: 'Arkan Vanguard Lance',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 87, // TAPERED, see header comment above
    weight: 9,
    levelReq: 45,
    statReqs: { strength: 54 },
    value: 1750,
    tags: [],
    desc: 'A long Arkan lance carried at the front of the reclamation column, its runework updated for the fight to take Kuraan back.'
  },
  {
    id: 'knife_fringewood_fang',
    name: 'Fringewood Fang',
    slot: 'weapon',
    skill: 'Knives',
    damage: 87, // TAPERED, see header comment above
    weight: 3,
    levelReq: 45,
    statReqs: { dexterity: 54 },
    value: 1750,
    tags: [],
    desc: "A curved knife shaped from Kuraan fringewood and a Majiku scout's own fang, favored by scouts retaking the border."
  },
  {
    id: 'rod_majiku_wardbreaker',
    name: 'Majiku Wardbreaker Rod',
    slot: 'weapon',
    skill: 'Rods',
    damage: 87, // TAPERED, see header comment above
    weight: 4,
    levelReq: 45,
    statReqs: { intelligence: 54 },
    value: 1750,
    tags: [],
    desc: "A captured Majiku ward-rod, its bindings unpicked and reforged by Arkan battlemages into a conduit that turns the enemy's own wards against them."
  },
  {
    id: 'hth_reclaimers_gauntlets',
    name: "Reclaimer's Gauntlets",
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 87, // TAPERED, see header comment above
    weight: 4,
    levelReq: 45,
    statReqs: { strength: 54 },
    value: 1750,
    tags: [],
    desc: "Banded gauntlets issued to the reclamation camp's front-line brawlers, heavy enough to break a Majiku shield-wall."
  },

  // ---------- Offhand: Shield (levelReq 45) ----------
  {
    id: 'shield_kuraan_wardbulwark',
    name: 'Kuraan Wardbulwark',
    slot: 'offhand',
    skill: 'Shields',
    armor: 43, // TAPERED: 1+42=43
    magicArmor: 14,
    weight: 8,
    levelReq: 45,
    statReqs: { strength: 54 },
    value: 1840,
    tags: [],
    desc: 'A broad shield banded with reclaimed Arkan wardplate, warded against both Majiku steel and Majiku hexcraft alike.'
  },

  // ---------- Armor: tier (levelReq 45) — light/medium/heavy ----------
  {
    id: 'light_body_kuraan_windweave',
    name: 'Kuraan Windweave Robe',
    slot: 'body',
    skill: 'Light Armor',
    armor: 43, // TAPERED, see header comment above
    magicArmor: 14,
    weight: 3,
    levelReq: 45,
    value: 1850,
    tags: [],
    desc: 'A silk-and-ward weave cut for scouts moving quietly through the reclaimed fringe woods.'
  },
  {
    id: 'light_head_kuraan_windveil',
    name: 'Kuraan Windveil Hood',
    slot: 'head',
    skill: 'Light Armor',
    armor: 43,
    magicArmor: 14,
    weight: 2,
    levelReq: 45,
    value: 1820,
    tags: [],
    desc: "A matching hood to the Windweave Robe, its warding thread tuned against the Majiku's own war-shaman curses."
  },
  {
    id: 'medium_body_reclaimers_hauberk',
    name: "Reclaimer's Hauberk",
    slot: 'body',
    skill: 'Medium Armor',
    armor: 43,
    weight: 6,
    levelReq: 45,
    value: 1850,
    tags: [],
    desc: 'Boiled leather and iron rivets, standard issue to every hero mustered at the Kuraan Reclamation Camp.'
  },
  {
    id: 'medium_legs_reclaimers_greaves',
    name: "Reclaimer's Greaves",
    slot: 'legs',
    skill: 'Medium Armor',
    armor: 43,
    weight: 6,
    levelReq: 45,
    value: 1830,
    tags: [],
    desc: "Greaves fitted for long marches through Kuraan's reclaimed undergrowth."
  },
  {
    id: 'heavy_body_kuraan_bulwark_plate',
    name: 'Kuraan Bulwark Plate',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 43,
    weight: 10,
    levelReq: 45,
    statReqs: { strength: 48 },
    value: 1900,
    tags: [],
    desc: "Heavy plate hammered at the reclamation camp's own forge, thick enough to stand a Majiku Warlord's charge."
  },
  {
    id: 'heavy_head_kuraan_warhelm',
    name: 'Kuraan Warhelm',
    slot: 'head',
    skill: 'Heavy Armor',
    armor: 43,
    weight: 10,
    levelReq: 45,
    statReqs: { strength: 48 },
    value: 1880,
    tags: [],
    desc: 'A war-helm forged for the officers leading the push back into the fringe woods.'
  },

  // ---------- Armor: sub-tier (levelReq 48) ----------
  {
    id: 'light_legs_kuraan_ward_leggings',
    name: 'Kuraan Ward-Leggings',
    slot: 'legs',
    skill: 'Light Armor',
    armor: 45, // TAPERED: effectiveLevelReq 35+0.7*13=44.1 -> 1+44.1=45.1
    magicArmor: 15,
    weight: 3,
    levelReq: 48,
    value: 1950,
    tags: [],
    desc: 'Warded leggings woven for the deeper reaches of Kuraan, where the fringe gives way to older, stranger wood.'
  },
  {
    id: 'medium_feet_reclaimers_boots',
    name: "Reclaimer's Boots",
    slot: 'feet',
    skill: 'Medium Armor',
    armor: 45,
    weight: 6,
    levelReq: 48,
    value: 1930,
    tags: [],
    desc: 'Sturdy boots re-soled at the reclamation camp for heroes ranging into the deep woods.'
  },
  {
    id: 'heavy_legs_kuraan_greatplate_legguards',
    name: 'Kuraan Greatplate Legguards',
    slot: 'legs',
    skill: 'Heavy Armor',
    armor: 45,
    weight: 10,
    levelReq: 48,
    statReqs: { strength: 50 },
    value: 2000,
    tags: [],
    desc: "Massive plate legguards salvaged and reforged from a fallen Majiku vanguard's own armor."
  },

  // ---------- Consumables: C-Class Crystal/Sphere + Energy Stone, extending the graded line
  // (B-Class I-IV / Light-Dark, levelReq 20-38) into Band A ----------
  {
    id: 'crystal_cclass_1',
    name: 'C-Class Crystal I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 41,
    value: 650,
    tags: [],
    combatUsable: true,
    energyRestore: 300,
    desc: 'A denser grade of Anima crystal mined from the reclaimed Kuraan fringe, restoring more Energy than any B-Class grade.'
  },
  {
    id: 'crystal_cclass_2',
    name: 'C-Class Crystal II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 46,
    value: 780,
    tags: [],
    combatUsable: true,
    energyRestore: 340,
    desc: 'The deeper-grade C-Class Crystal, cut from seams found only past the fringe, in Deep Kuraan itself.'
  },
  {
    id: 'sphere_cclass_1',
    name: 'C-Class Sphere I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 41,
    value: 680,
    tags: [],
    combatUsable: true,
    heal: 600,
    desc: 'A denser grade of Anima sphere, closing wounds faster than any B-Class grade.'
  },
  {
    id: 'sphere_cclass_2',
    name: 'C-Class Sphere II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 46,
    value: 760,
    tags: [],
    combatUsable: true,
    heal: 660,
    desc: 'The deeper-grade C-Class Sphere, mended from Anima found only in Deep Kuraan.'
  },
  {
    id: 'stone_energy_kuraan',
    name: 'Kuraan Energy Stone',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 45,
    value: 420,
    tags: [],
    combatUsable: true,
    energyRestore: 320,
    desc: 'A dependable Energy Stone sold at the Kuraan Reclamation Camp for heroes pushing deeper into the fringe.'
  },

  // ---------- Band A quest material ----------
  {
    id: 'quest_majiku_warband_sigil',
    name: 'Majiku Warband Sigil',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 12,
    tags: ['no-trade'],
    desc: 'A banner-sigil torn from a Majiku warband retreating deeper into Kuraan. Camp Marshal Serath wants a tally of how many warbands remain.'
  },

  // ---------- Band A unique equipment (monster-drop only; tag 'unique', +15-25% over the
  // tapered tier per CLAUDE.md / SPEC-ARC-BANDS.md — never sold, never a synthesis input/output) ----------
  {
    id: 'light_body_kuraan_ashcloak',
    name: 'Kuraan Ashcloak',
    slot: 'body',
    skill: 'Light Armor',
    armor: 52, // +21% over the tapered tier-45 body armor (43)
    damage: 5, // hybrid: armor granting a weapon-like Damage bonus, matching the ashroot_ward_cloak precedent
    weight: 3,
    levelReq: 45,
    value: 2200,
    tags: ['unique'],
    desc: "A cloak burned grey by whatever anima-scarred the Revenant that wore it, its ash-dark weave sharp enough to cut on contact."
  },
  {
    id: 'rod_ashenbrand_conduit',
    name: 'Ashenbrand Conduit',
    slot: 'weapon',
    skill: 'Rods',
    damage: 109, // +20% over the tapered levelReq-48 damage (~91)
    armor: 6, // hybrid: a weapon carrying +Armor, a stat shop rods never have
    weight: 4,
    levelReq: 48,
    statReqs: { intelligence: 60 },
    value: 2500,
    tags: ['unique'],
    desc: "A rod grown from the Hollow Wraith's own ash-brand core, warding its wielder even as it channels the same Anima that hollowed the wraith out."
  },
  {
    id: 'sword_warlords_broken_oath',
    name: "Warlord's Broken Oath",
    slot: 'weapon',
    skill: 'Swords',
    damage: 108, // +24% over the tapered levelReq-45 damage (87)
    magicArmor: 12, // hybrid: a weapon carrying +Magic Armor
    weight: 7,
    levelReq: 45,
    statReqs: { strength: 58 },
    value: 2600,
    tags: ['unique'],
    // boss signature: majiku_warlord (js/data/monsters.js), the Band A lair boss.
    desc: "The Majiku Warlord's own blade, snapped from its haft and reforged whole — the oath it was sworn on broken along with its wielder."
  },

  // =====================================================================
  // Level-Arc Band B (docs/SPEC-ARC-BANDS.md, F2/F3): Majiku Highlands, levels 51-60. Weapon/armor
  // damage and armor values below are TAPERED per the F1 CONVENTION NOTES block in js/balance.js
  // (mandatory past band 35): effectiveLevelReq = 35 + 0.7*(levelReq-35). Main tier at levelReq 55
  // (effectiveLevelReq 35+0.7*20=49 -> damage 3+2*49=101, armor 1+49=50 — NOT the literal
  // 3+2*55=113 / 1+55=56); a levelReq-58 sub-tier (effectiveLevelReq 35+0.7*23=51.1 -> damage
  // ~105, armor ~52). Bands <=35 are unchanged (kept literal, per the F1 note). statReqs continue
  // the levelReq+9-ish weapon/shield trend and levelReq+3-ish heavy-armor trend established at
  // tier 45 (js/data/items.js Band A header); value is an invented economy continuation of the
  // existing per-tier growth curve (~1.25x per 10 levelReq, matching 1400->1750 tier35->45 — no
  // archived value formula survived, see this file's header comment).
  // =====================================================================

  // ---------- Weapons: tier (levelReq 55), one per weapon skill ----------
  {
    id: 'sword_majiku_hostbreaker',
    name: 'Hostbreaker Blade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 101, // TAPERED: effectiveLevelReq 35+0.7*20=49 -> 3+2*49=101 (F1 finding; NOT the literal 3+2*55=113)
    weight: 7,
    levelReq: 55,
    statReqs: { strength: 64 },
    value: 2190,
    tags: [],
    desc: 'A heavy reforged blade carried by the column pushing north into the Majiku\'s own border steppe, meant to break the host one lancer at a time.'
  },
  {
    id: 'polearm_ridgewar_pike',
    name: 'Ridgewar Pike',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 101, // TAPERED, see header comment above
    weight: 9,
    levelReq: 55,
    statReqs: { strength: 64 },
    value: 2190,
    tags: [],
    desc: 'A long Arkan-forged pike updated for the ridgeline fighting north of Kuraan, its head weighted to punch through Majiku hostguard plate.'
  },
  {
    id: 'knife_steppewind_edge',
    name: 'Steppewind Edge',
    slot: 'weapon',
    skill: 'Knives',
    damage: 101, // TAPERED, see header comment above
    weight: 3,
    levelReq: 55,
    statReqs: { dexterity: 64 },
    value: 2190,
    tags: [],
    desc: 'A curved knife shaped from a Ridgehawk\'s own talon, favored by scouts ranging the open border steppe.'
  },
  {
    id: 'rod_hostcallers_ruin',
    name: "Hostcaller's Ruin",
    slot: 'weapon',
    skill: 'Rods',
    damage: 101, // TAPERED, see header comment above
    weight: 4,
    levelReq: 55,
    statReqs: { intelligence: 64 },
    value: 2190,
    tags: [],
    desc: "A captured hostcaller shaman's own binding-rod, unpicked and reforged by Arkan battlemages into a conduit that turns the host's own ritual-craft back on it."
  },
  {
    id: 'hth_ridgeguard_knuckles',
    name: 'Ridgeguard Knuckles',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 101, // TAPERED, see header comment above
    weight: 4,
    levelReq: 55,
    statReqs: { strength: 64 },
    value: 2190,
    tags: [],
    desc: 'Banded knuckles issued to the column\'s front-line brawlers, heavy enough to break a hostguard shield-wall on the ridgeline.'
  },

  // ---------- Offhand: Shield (levelReq 55) ----------
  {
    id: 'shield_highland_bulwark',
    name: 'Highland Bulwark',
    slot: 'offhand',
    skill: 'Shields',
    armor: 50, // TAPERED: 1+49=50
    magicArmor: 16,
    weight: 8,
    levelReq: 55,
    statReqs: { strength: 64 },
    value: 2300,
    tags: [],
    desc: 'A broad shield banded with reclaimed Arkan wardplate, warded against both Majiku steel and hostcaller hexcraft alike.'
  },

  // ---------- Armor: tier (levelReq 55) — light/medium/heavy ----------
  {
    id: 'light_body_steppewind_mantle',
    name: 'Steppewind Mantle',
    slot: 'body',
    skill: 'Light Armor',
    armor: 50, // TAPERED, see header comment above
    magicArmor: 16,
    weight: 3,
    levelReq: 55,
    value: 2310,
    tags: [],
    desc: 'A wind-cut, ward-threaded mantle for scouts ranging the open border steppe ahead of the column.'
  },
  {
    id: 'light_head_steppewind_cowl',
    name: 'Steppewind Cowl',
    slot: 'head',
    skill: 'Light Armor',
    armor: 50,
    magicArmor: 16,
    weight: 2,
    levelReq: 55,
    value: 2280,
    tags: [],
    desc: "A matching cowl to the Steppewind Mantle, its warding thread tuned against the host's own hostcaller curses."
  },
  {
    id: 'medium_body_hostguard_brigandine',
    name: 'Hostguard Brigandine',
    slot: 'body',
    skill: 'Medium Armor',
    armor: 50,
    weight: 6,
    levelReq: 55,
    value: 2310,
    tags: [],
    desc: 'Riveted brigandine standard-issue to every hero mustered against the Majiku host, patterned on captured hostguard plate.'
  },
  {
    id: 'medium_legs_hostguard_greaves',
    name: 'Hostguard Greaves',
    slot: 'legs',
    skill: 'Medium Armor',
    armor: 50,
    weight: 6,
    levelReq: 55,
    value: 2290,
    tags: [],
    desc: 'Greaves fitted for long marches across the open steppe and the colder ridgelines beyond it.'
  },
  {
    id: 'heavy_body_ridgeplate_cuirass',
    name: 'Ridgeplate Cuirass',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 50,
    weight: 10,
    levelReq: 55,
    statReqs: { strength: 58 },
    value: 2380,
    tags: [],
    desc: "Heavy plate hammered at the reclamation camp's forge from Majiku ridgeline steel, thick enough to stand a Ridge-Chieftain's charge."
  },
  {
    id: 'heavy_head_ridgeplate_helm',
    name: 'Ridgeplate Helm',
    slot: 'head',
    skill: 'Heavy Armor',
    armor: 50,
    weight: 10,
    levelReq: 55,
    statReqs: { strength: 58 },
    value: 2350,
    tags: [],
    desc: 'A war-helm forged for the officers leading the push into the Majiku Highlands proper.'
  },

  // ---------- Armor: sub-tier (levelReq 58) ----------
  {
    id: 'light_legs_steppewind_leggings',
    name: 'Steppewind Leggings',
    slot: 'legs',
    skill: 'Light Armor',
    armor: 52, // TAPERED: effectiveLevelReq 35+0.7*23=51.1 -> 1+51.1=52.1
    magicArmor: 17,
    weight: 3,
    levelReq: 58,
    value: 2440,
    tags: [],
    desc: 'Warded leggings woven for the higher ridgelines, where the border steppe gives way to the Majiku host\'s own war-camps.'
  },
  {
    id: 'medium_feet_hostguard_boots',
    name: 'Hostguard Boots',
    slot: 'feet',
    skill: 'Medium Armor',
    armor: 52,
    weight: 6,
    levelReq: 58,
    value: 2410,
    tags: [],
    desc: 'Sturdy boots re-soled at the reclamation camp for heroes ranging deep into the war-camps.'
  },
  {
    id: 'heavy_legs_ridgeplate_legguards',
    name: 'Ridgeplate Legguards',
    slot: 'legs',
    skill: 'Heavy Armor',
    armor: 52,
    weight: 10,
    levelReq: 58,
    statReqs: { strength: 60 },
    value: 2500,
    tags: [],
    desc: "Massive plate legguards salvaged and reforged from a fallen hostguard vanguard's own armor."
  },

  // ---------- Consumables: D-Class Crystal/Sphere + Energy Stone, extending the graded line
  // (C-Class I-II, levelReq 41-46) into Band B ----------
  {
    id: 'crystal_dclass_1',
    name: 'D-Class Crystal I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 51,
    value: 810,
    tags: [],
    combatUsable: true,
    energyRestore: 380,
    desc: 'A denser grade of Anima crystal mined from the Majiku border steppe, restoring more Energy than any C-Class grade.'
  },
  {
    id: 'crystal_dclass_2',
    name: 'D-Class Crystal II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 56,
    value: 975,
    tags: [],
    combatUsable: true,
    energyRestore: 420,
    desc: 'The deeper-grade D-Class Crystal, cut from seams found only in the Highland War-Camps themselves.'
  },
  {
    id: 'sphere_dclass_1',
    name: 'D-Class Sphere I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 51,
    value: 850,
    tags: [],
    combatUsable: true,
    heal: 720,
    desc: 'A denser grade of Anima sphere, closing wounds faster than any C-Class grade.'
  },
  {
    id: 'sphere_dclass_2',
    name: 'D-Class Sphere II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 56,
    value: 950,
    tags: [],
    combatUsable: true,
    heal: 780,
    desc: 'The deeper-grade D-Class Sphere, mended from Anima found only in the Highland War-Camps.'
  },
  {
    id: 'stone_energy_majiku',
    name: 'Majiku Energy Stone',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 55,
    value: 520,
    tags: [],
    combatUsable: true,
    energyRestore: 380,
    desc: 'A dependable Energy Stone sold at the Kuraan Reclamation Camp for heroes pushing north into the Majiku Highlands.'
  },

  // ---------- Band B quest material ----------
  {
    id: 'quest_majiku_host_standard',
    name: 'Majiku Host Standard',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 12,
    tags: ['no-trade'],
    desc: "A war-standard torn from a Majiku host regiment falling back into the highlands. Camp Marshal Serath wants a count of how many the host still has flying."
  },

  // ---------- Band B unique equipment (monster-drop only; tag 'unique', +15-25% over the
  // tapered tier per CLAUDE.md / SPEC-ARC-BANDS.md — never sold, never a synthesis input/output) ----------
  {
    id: 'light_body_highland_ashmantle',
    name: 'Highland Ashmantle',
    slot: 'body',
    skill: 'Light Armor',
    armor: 60, // +20% over the tapered tier-55 body armor (50)
    damage: 6, // hybrid: armor granting a weapon-like Damage bonus, matching the kuraan_ashcloak precedent
    weight: 3,
    levelReq: 55,
    value: 2750,
    tags: ['unique'],
    desc: "A mantle burned grey by whatever anima-scarred the Highlander that wore it, its ash-dark weave sharp enough to cut on contact."
  },
  {
    id: 'rod_stormwraiths_core',
    name: "Stormwraith's Core",
    slot: 'weapon',
    skill: 'Rods',
    damage: 126, // +20% over the tapered levelReq-58 damage (~105)
    armor: 7, // hybrid: a weapon carrying +Armor, a stat shop rods never have
    weight: 4,
    levelReq: 58,
    statReqs: { intelligence: 70 },
    value: 3130,
    tags: ['unique'],
    desc: "A rod grown from the Hollow Stormwraith's own crackling core, warding its wielder even as it channels the same storm-anima that hollowed the wraith out."
  },
  {
    id: 'polearm_chieftains_warpike',
    name: "The Chieftain's Warpike",
    slot: 'weapon',
    skill: 'Polearms',
    damage: 125, // +24% over the tapered levelReq-55 damage (101)
    magicArmor: 14, // hybrid: a weapon carrying +Magic Armor
    weight: 9,
    levelReq: 55,
    statReqs: { strength: 68 },
    value: 3250,
    tags: ['unique'],
    // boss signature: majiku_ridge_chieftain (js/data/monsters.js), the Band B lair boss.
    desc: "The Majiku Ridge-Chieftain's own warpike, wrenched from the ridgeline camp's standard-pole — proof the host's own commander could not hold this ground."
  },

  // =====================================================================
  // Level-Arc Band C (docs/SPEC-ARC-BANDS.md, F2/F3): The Frozen Reaches / Ukai approach, levels
  // 61-70. Weapon/armor damage and armor values below are TAPERED per the F1 CONVENTION NOTES
  // block in js/balance.js (mandatory past band 35): effectiveLevelReq = 35 + 0.7*(levelReq-35).
  // Main tier at levelReq 65 (effectiveLevelReq 35+0.7*30=56 -> damage 3+2*56=115, armor
  // round(1+56)=57 — NOT the literal 3+2*65=133 / 1+65=66); a levelReq-68 sub-tier
  // (effectiveLevelReq 35+0.7*33=58.1 -> damage ~119, armor round(1+58.1)=59). Bands <=35 are
  // unchanged (kept literal, per the F1 note). statReqs continue the levelReq+9-ish
  // weapon/shield trend and levelReq+3-ish heavy-armor trend established at tier 45/55
  // (js/data/items.js Band A/B headers); value is an invented economy continuation of the
  // existing per-tier growth curve (~1.2x per 10 levelReq, matching 2190->2630 tier55->65 — no
  // archived value formula survived, see this file's header comment).
  // =====================================================================

  // ---------- Weapons: tier (levelReq 65), one per weapon skill ----------
  {
    id: 'sword_frosthold_vanguard_blade',
    name: 'Frosthold Vanguard Blade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 115, // TAPERED: effectiveLevelReq 35+0.7*30=56 -> 3+2*56=115 (F1 finding; NOT the literal 3+2*65=133)
    weight: 7,
    levelReq: 65,
    statReqs: { strength: 74 },
    value: 2630,
    tags: [],
    desc: 'A heavy blade forged for the waystation garrison holding the last Crown ground before the ice-fields give way to the Ukai\'s own undercaverns.'
  },
  {
    id: 'polearm_glacial_warpike',
    name: 'Glacial Warpike',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 115, // TAPERED, see header comment above
    weight: 9,
    levelReq: 65,
    statReqs: { strength: 74 },
    value: 2630,
    tags: [],
    desc: 'A long pike updated for fighting on open ice, its head weighted to punch through a frost-exile\'s banded plate.'
  },
  {
    id: 'knife_icebound_fang',
    name: 'Icebound Fang',
    slot: 'weapon',
    skill: 'Knives',
    damage: 115, // TAPERED, see header comment above
    weight: 3,
    levelReq: 65,
    statReqs: { dexterity: 74 },
    value: 2630,
    tags: [],
    desc: 'A curved knife shaped from a glacial stalker\'s own frozen talon, favored by scouts ranging the open ice-fields.'
  },
  {
    id: 'rod_ukai_wardstone',
    name: 'Ukai Wardstone Rod',
    slot: 'weapon',
    skill: 'Rods',
    damage: 115, // TAPERED, see header comment above
    weight: 4,
    levelReq: 65,
    statReqs: { intelligence: 74 },
    value: 2630,
    tags: [],
    desc: "A captured Ukai cave warden's own ward-stone, unpicked and reforged by Arkan battlemages into a conduit that turns the cavern-dwellers' pride back on them."
  },
  {
    id: 'hth_frostbound_knuckles',
    name: 'Frostbound Knuckles',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 115, // TAPERED, see header comment above
    weight: 4,
    levelReq: 65,
    statReqs: { strength: 74 },
    value: 2630,
    tags: [],
    desc: 'Banded knuckles issued to the waystation\'s front-line brawlers, heavy enough to crack a frost-exile\'s shield-wall on the ice.'
  },

  // ---------- Offhand: Shield (levelReq 65) ----------
  {
    id: 'shield_frosthold_bulwark',
    name: 'Frosthold Bulwark',
    slot: 'offhand',
    skill: 'Shields',
    armor: 57, // TAPERED: round(1+56)=57
    magicArmor: 18,
    weight: 8,
    levelReq: 65,
    statReqs: { strength: 74 },
    value: 2760,
    tags: [],
    desc: 'A broad shield banded with reforged Majiku ridgeplate, warded against both frost-exile steel and Ukai ward-craft alike.'
  },

  // ---------- Armor: tier (levelReq 65) — light/medium/heavy ----------
  {
    id: 'light_body_frosthold_veilcloak',
    name: 'Frosthold Veilcloak',
    slot: 'body',
    skill: 'Light Armor',
    armor: 57, // TAPERED, see header comment above
    magicArmor: 18,
    weight: 3,
    levelReq: 65,
    value: 2770,
    tags: [],
    desc: 'A wind-and-ward weave cut for scouts moving quietly across the open ice ahead of the waystation garrison.'
  },
  {
    id: 'light_head_frosthold_veilhood',
    name: 'Frosthold Veilhood',
    slot: 'head',
    skill: 'Light Armor',
    armor: 57,
    magicArmor: 18,
    weight: 2,
    levelReq: 65,
    value: 2740,
    tags: [],
    desc: "A matching hood to the Veilcloak, its warding thread tuned against the frostwalkers' own anima-scarred curse."
  },
  {
    id: 'medium_body_waystation_hauberk',
    name: 'Waystation Hauberk',
    slot: 'body',
    skill: 'Medium Armor',
    armor: 57,
    weight: 6,
    levelReq: 65,
    value: 2770,
    tags: [],
    desc: 'Boiled leather and iron rivets, standard issue to every hero mustered at Frosthold Waystation.'
  },
  {
    id: 'medium_legs_waystation_greaves',
    name: 'Waystation Greaves',
    slot: 'legs',
    skill: 'Medium Armor',
    armor: 57,
    weight: 6,
    levelReq: 65,
    value: 2750,
    tags: [],
    desc: "Greaves fitted for long marches across the open ice-fields toward the Ukai's own cave-mouths."
  },
  {
    id: 'heavy_body_glacial_bulwark_plate',
    name: 'Glacial Bulwark Plate',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 57,
    weight: 10,
    levelReq: 65,
    statReqs: { strength: 68 },
    value: 2860,
    tags: [],
    desc: "Heavy plate hammered at Frosthold's own forge, thick enough to stand a Deep-Dweller's own vanguard."
  },
  {
    id: 'heavy_head_glacial_warhelm',
    name: 'Glacial Warhelm',
    slot: 'head',
    skill: 'Heavy Armor',
    armor: 57,
    weight: 10,
    levelReq: 65,
    statReqs: { strength: 68 },
    value: 2820,
    tags: [],
    desc: 'A war-helm forged for the officers leading the push across the ice toward the Ukai Undercaverns.'
  },

  // ---------- Armor: sub-tier (levelReq 68) ----------
  {
    id: 'light_legs_frosthold_ward_leggings',
    name: 'Frosthold Ward-Leggings',
    slot: 'legs',
    skill: 'Light Armor',
    armor: 59, // TAPERED: effectiveLevelReq 35+0.7*33=58.1 -> round(1+58.1)=59
    magicArmor: 19,
    weight: 3,
    levelReq: 68,
    value: 2930,
    tags: [],
    desc: 'Warded leggings woven for the deeper approach, where the open ice gives way to the Ukai\'s own cave-mouths.'
  },
  {
    id: 'medium_feet_waystation_boots',
    name: 'Waystation Boots',
    slot: 'feet',
    skill: 'Medium Armor',
    armor: 59,
    weight: 6,
    levelReq: 68,
    value: 2890,
    tags: [],
    desc: 'Sturdy boots re-soled at Frosthold for heroes ranging into the undercaverns proper.'
  },
  {
    id: 'heavy_legs_glacial_greatplate_legguards',
    name: 'Glacial Greatplate Legguards',
    slot: 'legs',
    skill: 'Heavy Armor',
    armor: 59,
    weight: 10,
    levelReq: 68,
    statReqs: { strength: 70 },
    value: 3000,
    tags: [],
    desc: "Massive plate legguards salvaged and reforged from a fallen Ukai deep vanguard's own armor."
  },

  // ---------- Consumables: E-Class Crystal/Sphere + Energy Stone, extending the graded line
  // (D-Class I-II, levelReq 51-56) into Band C ----------
  {
    id: 'crystal_eclass_1',
    name: 'E-Class Crystal I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 61,
    value: 970,
    tags: [],
    combatUsable: true,
    energyRestore: 460,
    desc: 'A denser grade of Anima crystal mined from the Glacial Approach\'s ice-fields, restoring more Energy than any D-Class grade.'
  },
  {
    id: 'crystal_eclass_2',
    name: 'E-Class Crystal II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 66,
    value: 1170,
    tags: [],
    combatUsable: true,
    energyRestore: 500,
    desc: 'The deeper-grade E-Class Crystal, cut from seams found only in the Ukai Undercaverns themselves.'
  },
  {
    id: 'sphere_eclass_1',
    name: 'E-Class Sphere I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 61,
    value: 1020,
    tags: [],
    combatUsable: true,
    heal: 840,
    desc: 'A denser grade of Anima sphere, closing wounds faster than any D-Class grade.'
  },
  {
    id: 'sphere_eclass_2',
    name: 'E-Class Sphere II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 66,
    value: 1140,
    tags: [],
    combatUsable: true,
    heal: 900,
    desc: 'The deeper-grade E-Class Sphere, mended from Anima found only in the Ukai Undercaverns.'
  },
  {
    id: 'stone_energy_frosthold',
    name: 'Frosthold Energy Stone',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 65,
    value: 620,
    tags: [],
    combatUsable: true,
    energyRestore: 440,
    desc: 'A dependable Energy Stone sold at Frosthold Waystation for heroes pushing into the Ukai\'s frozen approach.'
  },

  // ---------- Band C quest material ----------
  {
    id: 'quest_ukai_deep_rune',
    name: 'Ukai Deep-Rune',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 12,
    tags: ['no-trade'],
    desc: 'A ward-rune torn from an Ukai vanguard or a Majiku exile alike, its script unreadable to anyone Waystation Commander Thessaly has asked. She wants a tally regardless.'
  },

  // ---------- Band C unique equipment (monster-drop only; tag 'unique', +15-25% over the
  // tapered tier per CLAUDE.md / SPEC-ARC-BANDS.md — never sold, never a synthesis input/output) ----------
  {
    id: 'light_body_frostwalkers_shroud',
    name: "Frostwalker's Shroud",
    slot: 'body',
    skill: 'Light Armor',
    armor: 68, // +19% over the tapered tier-65 body armor (57)
    damage: 7, // hybrid: armor granting a weapon-like Damage bonus, matching the ashcloak/ashmantle precedent
    weight: 3,
    levelReq: 65,
    value: 3300,
    tags: ['unique'],
    desc: "A shroud burned grey by whatever anima-scarred the Frostwalker that wore it, its ash-dark weave sharp enough to cut on contact even through the cold."
  },
  {
    id: 'rod_deeplings_core',
    name: "Deepling's Core",
    slot: 'weapon',
    skill: 'Rods',
    damage: 143, // +20% over the tapered levelReq-68 damage (~119)
    armor: 8, // hybrid: a weapon carrying +Armor, a stat shop rods never have
    weight: 4,
    levelReq: 68,
    statReqs: { intelligence: 80 },
    value: 3760,
    tags: ['unique'],
    desc: "A rod grown from the Hollow Deepling's own frozen core, warding its wielder even as it channels the same deep-cavern Anima that hollowed the deepling out."
  },
  {
    id: 'hth_deep_dwellers_claw',
    name: "The Deep-Dweller's Claw",
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 143, // +24% over the tapered levelReq-65 damage (115)
    magicArmor: 16, // hybrid: a weapon carrying +Magic Armor
    weight: 4,
    levelReq: 65,
    statReqs: { strength: 78 },
    value: 3900,
    tags: ['unique'],
    // boss signature: ukai_deep_dweller (js/data/monsters.js), the Band C lair boss.
    desc: "A claw wrenched whole from the Deep-Dweller itself, still cold enough to numb the hand that wields it — proof even the Ukai's own proudest guardian could not hold its hollow."
  },

  // =====================================================================
  // Level-Arc Band D (docs/SPEC-ARC-BANDS.md, F2/F3): Estari Ruins Deep, levels 71-80. Weapon/
  // armor damage and armor values below are TAPERED per the F1 CONVENTION NOTES block in
  // js/balance.js (mandatory past band 35): effectiveLevelReq = 35 + 0.7*(levelReq-35). Main tier
  // at levelReq 75 (effectiveLevelReq 35+0.7*40=63 -> damage 3+2*63=129, armor round(1+63)=64 —
  // NOT the literal 3+2*75=153 / 1+75=76); a levelReq-78 sub-tier (effectiveLevelReq
  // 35+0.7*43=65.1 -> armor round(1+65.1)=66). Bands <=35 are unchanged (kept literal, per the F1
  // note). statReqs continue the levelReq+9-ish weapon/shield trend and levelReq+3-ish
  // heavy-armor trend established at tier 45/55/65 (js/data/items.js Band A/B/C headers); value
  // is an invented economy continuation of the existing per-tier growth curve (a steady +440-500
  // per 10 levelReq — no archived value formula survived, see this file's header comment).
  // =====================================================================

  // ---------- Weapons: tier (levelReq 75), one per weapon skill ----------
  {
    id: 'sword_estari_wardblade',
    name: 'Estari Wardblade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 129, // TAPERED: effectiveLevelReq 35+0.7*40=63 -> 3+2*63=129 (F1 finding; NOT the literal 3+2*75=153)
    weight: 7,
    levelReq: 75,
    statReqs: { strength: 84 },
    value: 3070,
    tags: [],
    desc: "A heavy blade forged from a fallen sublevel warden's own ward-plating, tuned by Frosthold's smiths to strike where Estari construct-hide runs thinnest."
  },
  {
    id: 'polearm_estari_warpike',
    name: 'Estari Warpike',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 129, // TAPERED, see header comment above
    weight: 9,
    levelReq: 75,
    statReqs: { strength: 84 },
    value: 3070,
    tags: [],
    desc: "A long pike weighted to punch clean through a ruin vanguard's reforged plating, its haft warded against the Wellspring's own stray discharge."
  },
  {
    id: 'knife_estari_shard_fang',
    name: 'Estari Shard Fang',
    slot: 'weapon',
    skill: 'Knives',
    damage: 129, // TAPERED, see header comment above
    weight: 3,
    levelReq: 75,
    statReqs: { dexterity: 84 },
    value: 3070,
    tags: [],
    desc: "A curved blade shaped from a shattered anima conduit's own crystal casing, favored by scouts working the Estari sublevels' tighter corridors."
  },
  {
    id: 'rod_wellspring_conduit',
    name: 'Wellspring Conduit Rod',
    slot: 'weapon',
    skill: 'Rods',
    damage: 129, // TAPERED, see header comment above
    weight: 4,
    levelReq: 75,
    statReqs: { intelligence: 84 },
    value: 3070,
    tags: [],
    desc: "A captured wellspring warden's own ward-core, unpicked and reforged by Arkan battlemages into a conduit that draws on the taboo seam without breaking the Council of Three's ban outright."
  },
  {
    id: 'hth_warden_gauntlets',
    name: 'Warden Gauntlets',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 129, // TAPERED, see header comment above
    weight: 4,
    levelReq: 75,
    statReqs: { strength: 84 },
    value: 3070,
    tags: [],
    desc: "Banded gauntlets cast from a sublevel warden's own broken fists, heavy enough to crack a ruin vanguard's plating in a single blow."
  },

  // ---------- Offhand: Shield (levelReq 75) ----------
  {
    id: 'shield_estari_bulwark',
    name: 'Estari Bulwark',
    slot: 'offhand',
    skill: 'Shields',
    armor: 64, // TAPERED: round(1+63)=64
    magicArmor: 20,
    weight: 8,
    levelReq: 75,
    statReqs: { strength: 84 },
    value: 3220,
    tags: [],
    desc: "A broad shield banded with reforged construct plating, warded against both the sublevels' crushing blows and the Wellspring's own stray Anima discharge."
  },

  // ---------- Armor: tier (levelReq 75) — light/medium/heavy ----------
  {
    id: 'light_body_wellspring_veil',
    name: 'Wellspring Veil',
    slot: 'body',
    skill: 'Light Armor',
    armor: 64, // TAPERED, see header comment above
    magicArmor: 20,
    weight: 3,
    levelReq: 75,
    value: 3230,
    tags: [],
    desc: 'A ward-weave cut for scouts moving quietly through the Estari sublevels ahead of the waystation column.'
  },
  {
    id: 'light_head_wellspring_hood',
    name: 'Wellspring Hood',
    slot: 'head',
    skill: 'Light Armor',
    armor: 64,
    magicArmor: 20,
    weight: 2,
    levelReq: 75,
    value: 3200,
    tags: [],
    desc: "A matching hood to the Wellspring Veil, its warding thread tuned against the excavators' own anima-scarred curse."
  },
  {
    id: 'medium_body_estari_brigandine',
    name: 'Estari Brigandine',
    slot: 'body',
    skill: 'Medium Armor',
    armor: 64,
    weight: 6,
    levelReq: 75,
    value: 3230,
    tags: [],
    desc: 'Boiled leather and salvaged construct-plate rivets, standard issue to every hero pushing into the Estari sublevels.'
  },
  {
    id: 'medium_legs_estari_greaves',
    name: 'Estari Greaves',
    slot: 'legs',
    skill: 'Medium Armor',
    armor: 64,
    weight: 6,
    levelReq: 75,
    value: 3210,
    tags: [],
    desc: 'Greaves fitted for the long, careful descent through sealed sublevels toward the Anima Wellspring itself.'
  },
  {
    id: 'heavy_body_warden_plate',
    name: 'Warden Plate',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 64,
    weight: 10,
    levelReq: 75,
    statReqs: { strength: 78 },
    value: 3340,
    tags: [],
    desc: "Heavy plate hammered at Frosthold's own forge from salvaged warden-plating, thick enough to stand a ruin vanguard's own charge."
  },
  {
    id: 'heavy_head_warden_helm',
    name: 'Warden Helm',
    slot: 'head',
    skill: 'Heavy Armor',
    armor: 64,
    weight: 10,
    levelReq: 75,
    statReqs: { strength: 78 },
    value: 3290,
    tags: [],
    desc: 'A war-helm forged for the officers leading the push down through the Estari sublevels toward the Wellspring.'
  },

  // ---------- Armor: sub-tier (levelReq 78) ----------
  {
    id: 'light_legs_wellspring_leggings',
    name: 'Wellspring Leggings',
    slot: 'legs',
    skill: 'Light Armor',
    armor: 66, // TAPERED: effectiveLevelReq 35+0.7*43=65.1 -> round(1+65.1)=66
    magicArmor: 21,
    weight: 3,
    levelReq: 78,
    value: 3420,
    tags: [],
    desc: 'Warded leggings woven for the deepest approach, where the sublevels finally open onto the Anima Wellspring itself.'
  },
  {
    id: 'medium_feet_estari_boots',
    name: 'Estari Boots',
    slot: 'feet',
    skill: 'Medium Armor',
    armor: 66,
    weight: 6,
    levelReq: 78,
    value: 3370,
    tags: [],
    desc: 'Sturdy boots re-soled at Frosthold for heroes ranging into the Wellspring proper.'
  },
  {
    id: 'heavy_legs_warden_legguards',
    name: 'Warden Legguards',
    slot: 'legs',
    skill: 'Heavy Armor',
    armor: 66,
    weight: 10,
    levelReq: 78,
    statReqs: { strength: 80 },
    value: 3500,
    tags: [],
    desc: "Massive plate legguards salvaged and reforged from a fallen Estari ruin vanguard's own armor."
  },

  // ---------- Consumables: F-Class Crystal/Sphere + Energy Stone, extending the graded line
  // (E-Class I-II, levelReq 61-66) into Band D ----------
  {
    id: 'crystal_fclass_1',
    name: 'F-Class Crystal I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 71,
    value: 1130,
    tags: [],
    combatUsable: true,
    energyRestore: 540,
    desc: "A denser grade of Anima crystal cut from the Estari Sublevels' own leaking seams, restoring more Energy than any E-Class grade."
  },
  {
    id: 'crystal_fclass_2',
    name: 'F-Class Crystal II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 76,
    value: 1365,
    tags: [],
    combatUsable: true,
    energyRestore: 580,
    desc: "The deeper-grade F-Class Crystal, cut only from seams within a stone's throw of the Anima Wellspring itself."
  },
  {
    id: 'sphere_fclass_1',
    name: 'F-Class Sphere I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 71,
    value: 1190,
    tags: [],
    combatUsable: true,
    heal: 960,
    desc: 'A denser grade of Anima sphere, closing wounds faster than any E-Class grade.'
  },
  {
    id: 'sphere_fclass_2',
    name: 'F-Class Sphere II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 76,
    value: 1330,
    tags: [],
    combatUsable: true,
    heal: 1020,
    desc: "The deeper-grade F-Class Sphere, mended from Anima drawn only from the Wellspring's own edge."
  },
  {
    id: 'stone_energy_wellspring',
    name: 'Wellspring Energy Stone',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 75,
    value: 720,
    tags: [],
    combatUsable: true,
    energyRestore: 500,
    desc: 'A dependable Energy Stone sold at Frosthold Waystation for heroes pushing down into the Estari sublevels.'
  },

  // ---------- Band D quest material ----------
  {
    id: 'quest_anima_taint_sample',
    name: 'Anima Taint Sample',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 12,
    tags: ['no-trade'],
    desc: "A vial of tainted Anima drawn from a sublevel construct or ruin vanguard alike, its residue unlike anything Anima-Warden Yulei has catalogued before. She wants every sample she can get."
  },

  // ---------- Band D unique equipment (monster-drop only; tag 'unique', +15-25% over the
  // tapered tier per CLAUDE.md / SPEC-ARC-BANDS.md — never sold, never a synthesis input/output) ----------
  {
    id: 'light_body_estari_anima_shroud',
    name: 'Estari Anima Shroud',
    slot: 'body',
    skill: 'Light Armor',
    armor: 76, // +19% over the tapered tier-75 body armor (64)
    damage: 9, // hybrid: armor granting a weapon-like Damage bonus, matching the ashcloak/ashmantle/frostwalker's-shroud precedent
    weight: 3,
    levelReq: 75,
    value: 3900,
    tags: ['unique'],
    desc: "A shroud burned grey by the same raw Anima that scarred the excavator who wore it, its ash-dark weave sharp enough to cut on contact even this deep below the sublevels."
  },
  {
    id: 'rod_wellspring_heartcore',
    name: "Wellspring Heartcore",
    slot: 'weapon',
    skill: 'Rods',
    damage: 160, // +20% over the tapered levelReq-78 weapon-equivalent damage (~133)
    armor: 9, // hybrid: a weapon carrying +Armor, a stat shop rods never have
    weight: 4,
    levelReq: 78,
    statReqs: { intelligence: 88 },
    value: 4060,
    tags: ['unique'],
    desc: "A rod grown whole from the raw Anima-Horror's own core, warding its wielder even as it channels the same unmined Anima the Council of Three's ban was written to keep sealed."
  },
  {
    id: 'sword_warden_primes_relic',
    name: "The Warden-Prime's Relic",
    slot: 'weapon',
    skill: 'Swords',
    damage: 160, // +24% over the tapered levelReq-75 damage (129)
    magicArmor: 18, // hybrid: a weapon carrying +Magic Armor
    weight: 7,
    levelReq: 75,
    statReqs: { strength: 88 },
    value: 4200,
    tags: ['unique'],
    // boss signature: estari_warden_prime (js/data/monsters.js), the Band D lair boss.
    desc: "A blade struck whole from the Warden-Prime's own core-plating, still humming with the same ancient enforcement-ward that has guarded the Anima Wellspring since before the Council of Three's ban was ever needed."
  },

  // =====================================================================
  // Level-Arc Band E (docs/SPEC-ARC-BANDS.md, F2/F3): Ascent to the Skyspire, levels 81-90.
  // Weapon/armor damage and armor values below are TAPERED per the F1 CONVENTION NOTES block in
  // js/balance.js (mandatory past band 35): effectiveLevelReq = 35 + 0.7*(levelReq-35). Main tier
  // at levelReq 85 (effectiveLevelReq 35+0.7*50=70 -> damage 3+2*70=143, armor round(1+70)=71 —
  // NOT the literal 3+2*85=173 / 1+85=86); a levelReq-88 sub-tier (effectiveLevelReq
  // 35+0.7*53=72.1 -> armor round(1+72.1)=73). Bands <=35 are unchanged (kept literal, per the F1
  // note). statReqs continue the levelReq+9-ish weapon/shield trend and levelReq+3-ish
  // heavy-armor trend established at tier 45/55/65/75 (js/data/items.js Band A/B/C/D headers);
  // value is an invented economy continuation of the existing per-tier growth curve (a steady
  // +440-500 per 10 levelReq — no archived value formula survived, see this file's header comment).
  // =====================================================================

  // ---------- Weapons: tier (levelReq 85), one per weapon skill ----------
  {
    id: 'sword_spireward_blade',
    name: 'Spireward Blade',
    slot: 'weapon',
    skill: 'Swords',
    damage: 143, // TAPERED: effectiveLevelReq 35+0.7*50=70 -> 3+2*70=143 (F1 finding; NOT the literal 3+2*85=173)
    weight: 7,
    levelReq: 85,
    statReqs: { strength: 94 },
    value: 3540,
    tags: [],
    desc: "A heavy blade forged from a fallen Skyspire warden's own ward-plating, tuned by Frosthold's smiths to strike where a Society remnant's own hexwork runs thinnest."
  },
  {
    id: 'polearm_skyspire_halberd',
    name: 'Skyspire Halberd',
    slot: 'weapon',
    skill: 'Polearms',
    damage: 143, // TAPERED, see header comment above
    weight: 9,
    levelReq: 85,
    statReqs: { strength: 94 },
    value: 3540,
    tags: [],
    desc: "A long halberd weighted to punch clean through a sentinel's reforged plating, its haft warded against the sanctum's own stray discharge."
  },
  {
    id: 'knife_society_renegade_dirk',
    name: "Society Renegade's Dirk",
    slot: 'weapon',
    skill: 'Knives',
    damage: 143, // TAPERED, see header comment above
    weight: 3,
    levelReq: 85,
    statReqs: { dexterity: 94 },
    value: 3540,
    tags: [],
    desc: "A curved blade taken off a battlemage who never followed Eidas to the red moon, favored by scouts working the Skyspire's tighter spans."
  },
  {
    id: 'rod_anima_channeling_rod',
    name: 'Anima-Channeling Rod',
    slot: 'weapon',
    skill: 'Rods',
    damage: 143, // TAPERED, see header comment above
    weight: 4,
    levelReq: 85,
    statReqs: { intelligence: 94 },
    value: 3540,
    tags: [],
    desc: "A captured arcanist's own ward-core, unpicked and reforged by Arkan battlemages into a conduit that draws on the Skyspire's stray Anima without repeating the Society's own mistakes."
  },
  {
    id: 'hth_spireguard_gauntlets',
    name: 'Spireguard Gauntlets',
    slot: 'weapon',
    skill: 'Hand to Hand',
    damage: 143, // TAPERED, see header comment above
    weight: 4,
    levelReq: 85,
    statReqs: { strength: 94 },
    value: 3540,
    tags: [],
    desc: "Banded gauntlets cast from a lower warden's own broken fists, heavy enough to crack a sentinel's plating in a single blow."
  },

  // ---------- Offhand: Shield (levelReq 85) ----------
  {
    id: 'shield_spireward_aegis',
    name: 'Spireward Aegis',
    slot: 'offhand',
    skill: 'Shields',
    armor: 71, // TAPERED: round(1+70)=71
    magicArmor: 22,
    weight: 8,
    levelReq: 85,
    statReqs: { strength: 94 },
    value: 3700,
    tags: [],
    desc: "A broad shield banded with reforged construct plating, warded against both the spans' crushing blows and the sanctum's own stray Anima discharge."
  },

  // ---------- Armor: tier (levelReq 85) — light/medium/heavy ----------
  {
    id: 'light_body_skysilk_shroud',
    name: 'Skysilk Shroud',
    slot: 'body',
    skill: 'Light Armor',
    armor: 71, // TAPERED, see header comment above
    magicArmor: 22,
    weight: 3,
    levelReq: 85,
    value: 3710,
    tags: [],
    desc: 'A ward-weave cut for scouts moving quietly through the Skyspire\'s lower spans ahead of the waystation column.'
  },
  {
    id: 'light_head_skysilk_hood',
    name: 'Skysilk Hood',
    slot: 'head',
    skill: 'Light Armor',
    armor: 71,
    magicArmor: 22,
    weight: 2,
    levelReq: 85,
    value: 3680,
    tags: [],
    desc: "A matching hood to the Skysilk Shroud, its warding thread tuned against the Society remnant's own hexwork."
  },
  {
    id: 'medium_body_spireguard_brigandine',
    name: 'Spireguard Brigandine',
    slot: 'body',
    skill: 'Medium Armor',
    armor: 71,
    weight: 6,
    levelReq: 85,
    value: 3710,
    tags: [],
    desc: 'Boiled leather and salvaged construct-plate rivets, standard issue to every hero pushing onto the Skyspire\'s lower spans.'
  },
  {
    id: 'medium_legs_spireguard_greaves',
    name: 'Spireguard Greaves',
    slot: 'legs',
    skill: 'Medium Armor',
    armor: 71,
    weight: 6,
    levelReq: 85,
    value: 3690,
    tags: [],
    desc: 'Greaves fitted for the long climb up the Skyspire\'s lower spans toward the Society\'s last sanctum.'
  },
  {
    id: 'heavy_body_spireward_plate',
    name: 'Spireward Plate',
    slot: 'body',
    skill: 'Heavy Armor',
    armor: 71,
    weight: 10,
    levelReq: 85,
    statReqs: { strength: 88 },
    value: 3820,
    tags: [],
    desc: "Heavy plate hammered at Frosthold's own forge from salvaged ward-plating, thick enough to stand a sentinel's own charge."
  },
  {
    id: 'heavy_head_spireward_helm',
    name: 'Spireward Helm',
    slot: 'head',
    skill: 'Heavy Armor',
    armor: 71,
    weight: 10,
    levelReq: 85,
    statReqs: { strength: 88 },
    value: 3770,
    tags: [],
    desc: 'A war-helm forged for the officers leading the climb up the Skyspire toward the Society\'s last sanctum.'
  },

  // ---------- Armor: sub-tier (levelReq 88) ----------
  {
    id: 'light_legs_stormline_leggings',
    name: 'Stormline Leggings',
    slot: 'legs',
    skill: 'Light Armor',
    armor: 73, // TAPERED: effectiveLevelReq 35+0.7*53=72.1 -> round(1+72.1)=73
    magicArmor: 23,
    weight: 3,
    levelReq: 88,
    value: 3900,
    tags: [],
    desc: 'Warded leggings woven for the highest approach, where the spans finally open onto the Society\'s own upper sanctum.'
  },
  {
    id: 'medium_feet_stormline_boots',
    name: 'Stormline Boots',
    slot: 'feet',
    skill: 'Medium Armor',
    armor: 73,
    weight: 6,
    levelReq: 88,
    value: 3850,
    tags: [],
    desc: 'Sturdy boots re-soled at Frosthold for heroes ranging into the Skyspire\'s upper spans.'
  },
  {
    id: 'heavy_legs_stormline_legguards',
    name: 'Stormline Legguards',
    slot: 'legs',
    skill: 'Heavy Armor',
    armor: 73,
    weight: 10,
    levelReq: 88,
    statReqs: { strength: 90 },
    value: 3980,
    tags: [],
    desc: "Massive plate legguards salvaged and reforged from a fallen Skyspire sentinel's own armor."
  },

  // ---------- Consumables: G-Class Crystal/Sphere + Energy Stone, extending the graded line
  // (F-Class I-II, levelReq 71-76) into Band E ----------
  {
    id: 'crystal_gclass_1',
    name: 'G-Class Crystal I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 81,
    value: 1290,
    tags: [],
    combatUsable: true,
    energyRestore: 620,
    desc: "A denser grade of Anima crystal cut from the Skyspire's own lower spans, restoring more Energy than any F-Class grade."
  },
  {
    id: 'crystal_gclass_2',
    name: 'G-Class Crystal II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 86,
    value: 1560,
    tags: [],
    combatUsable: true,
    energyRestore: 660,
    desc: "The deeper-grade G-Class Crystal, cut only from seams within the Society's own upper sanctum."
  },
  {
    id: 'sphere_gclass_1',
    name: 'G-Class Sphere I',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 81,
    value: 1360,
    tags: [],
    combatUsable: true,
    heal: 1080,
    desc: 'A denser grade of Anima sphere, closing wounds faster than any F-Class grade.'
  },
  {
    id: 'sphere_gclass_2',
    name: 'G-Class Sphere II',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 86,
    value: 1520,
    tags: [],
    combatUsable: true,
    heal: 1140,
    desc: "The deeper-grade G-Class Sphere, mended from Anima drawn only from the Society's own upper sanctum."
  },
  {
    id: 'stone_energy_skyspire',
    name: 'Skyspire Energy Stone',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 85,
    value: 820,
    tags: [],
    combatUsable: true,
    energyRestore: 560,
    desc: 'A dependable Energy Stone sold at Frosthold Waystation for heroes climbing the Skyspire\'s spans.'
  },

  // ---------- Band E quest material ----------
  {
    id: 'quest_society_cipher_page',
    name: 'Society Cipher Page',
    slot: 'none',
    skill: null,
    weight: 1,
    levelReq: 1,
    value: 12,
    tags: ['no-trade'],
    desc: "A page torn from the Society of Modern Magic's own ciphered ledgers, dropped by a lower warden or arcanist alike. Cipher-Adept Rennick wants every page she can get, hoping to piece together what Eidas's last remnant was really working on."
  },

  // ---------- Band E unique equipment (monster-drop only; tag 'unique', +15-25% over the
  // tapered tier per CLAUDE.md / SPEC-ARC-BANDS.md — never sold, never a synthesis input/output) ----------
  {
    id: 'light_body_anima_scoured_wraps',
    name: 'Anima-Scoured Wraps',
    slot: 'body',
    skill: 'Light Armor',
    armor: 85, // +20% over the tapered tier-85 body armor (71)
    damage: 10, // hybrid: armor granting a weapon-like Damage bonus, matching the estari_anima_shroud/ashmantle precedent
    weight: 3,
    levelReq: 85,
    value: 4260,
    tags: ['unique'],
    // boss-adjacent drop: anima_horror_stalker (js/data/monsters.js).
    desc: "Wraps scoured raw by the same unleashed Anima that gave the stalker wearing them its shape, its ash-dark weave sharp enough to cut on contact this high above the lower spans."
  },
  {
    id: 'rod_anima_horrors_core',
    name: "Anima-Horror's Core",
    slot: 'weapon',
    skill: 'Rods',
    damage: 176, // +20% over the tapered levelReq-88 weapon-equivalent damage (~147)
    armor: 11, // hybrid: a weapon carrying +Armor, a stat shop rods never have
    weight: 4,
    levelReq: 88,
    statReqs: { intelligence: 98 },
    value: 4340,
    tags: ['unique'],
    // boss-adjacent drop: anima_horror_ravager (js/data/monsters.js).
    desc: "A rod grown whole from the ravager's own core, warding its wielder even as it channels the same unleashed Anima the Society of Modern Magic could never fully leash."
  },
  {
    id: 'sword_anima_horrors_edge',
    name: "The Anima-Horror's Edge",
    slot: 'weapon',
    skill: 'Swords',
    damage: 177, // +24% over the tapered levelReq-85 damage (143)
    magicArmor: 20, // hybrid: a weapon carrying +Magic Armor
    weight: 7,
    levelReq: 85,
    statReqs: { strength: 98 },
    value: 4480,
    tags: ['unique'],
    // boss signature: society_anima_horror (js/data/monsters.js), the Band E lair boss.
    desc: "A blade struck whole from the Anima-Horror's own hide, still humming with the same raw, uncategorized Anima that the Society of Modern Magic spent itself trying and failing to control."
  }
];

window.Game = Game;
