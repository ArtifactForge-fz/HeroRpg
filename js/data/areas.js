// HeroRPG remake — world areas: towns and hunting grounds (DESIGN.md §2 world/locations, §6
// economy & towns). Level gates are archived (Level.md: "All areas have minimum level
// requirements"); the specific v1 world list below follows PLAN.md P4 scope.
//
// Shape: { id, name, type: 'town'|'hunting', minLevel, monsters: [ids], facilities: [...], desc }
// Town facility entries: { type: 'shop'|'inn'|'vault'|'academy'|'synthesis'|'shrine'|'tavern', stock?: [itemIds] }
// Hunting areas carry `monsters` (regular hunt list) and optionally `lair` (boss entries gated
// separately, e.g. Estari Ruin Warden — "Lair" fight unlocked at a higher minLevel than the area).
// Phase 5: hunting areas may also carry `questTokens: [{ id, label }]` — Standing-Stones-style
// touch objects for Game.Quests touch-kind steps (DESIGN.md §7); towns may carry a `tavern`
// facility, the archived quest-giver location (New_Player_Guide.md §5.1.5).

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.areas = [

  // ---------- Eldor: the starting town ----------
  {
    id: 'eldor',
    name: 'Royal City of Eldor',
    type: 'town',
    minLevel: 0,
    monsters: [],
    // archived: Royal_City_of_Eldor.md ("trading city, abundant with products"); Recent_Updates.md
    // 2007-04-27 ("Synthesis Shop is now open for business in the Royal City of Eldor"),
    // 2007-05-08 ("Added a Spirit Shrine to Eldor") — Eldor is the only v1 town with ALL facilities.
    facilities: [
      {
        type: 'shop',
        // invented: broad low-level stock (weapons of every creation skill, light/starter armor,
        // tents, potions) so a fresh character can gear up without traveling first.
        stock: [
          'sword_rusty_shortblade', 'polearm_ashwood_spear', 'knife_worn_dagger',
          'rod_apprentice_wand', 'hth_iron_knuckles',
          'shield_wooden_buckler',
          'light_body_traveler_tunic', 'light_head_hood_of_wayfaring',
          'medium_body_studded_jerkin', 'medium_head_riveted_cap',
          'heavy_body_plate_cuirass', 'heavy_head_great_helm',
          'tent_ragged_bedroll', 'tent_travelers_tent',
          'potion_minor_healing', 'potion_healing',
          'crystal_energy_shard'
        ]
      },
      { type: 'synthesis' },
      { type: 'inn' },
      { type: 'vault' },
      { type: 'academy' },
      { type: 'shrine' },
      // archived: New_Player_Guide.md §5.1.5 "Tavern" (quests); Recent_Updates.md 2007-05-15
      // "Added a new quest to the tavern in Eldor" and 2007-05-08 "A new quest in Eldor is
      // available for all characters" — Eldor's tavern is the earliest-attested quest source.
      { type: 'tavern' }
    ],
    desc: 'The human capital of Averast, a trading city abundant with goods. Home to the Academy, Vault, Synthesis Shop, a Spirit Shrine, and a Tavern where travelers trade rumors of work.'
  },

  // ---------- Plains of Averast: level 1 hunting ground (existing from Phase 3) ----------
  {
    id: 'plains_of_averast',
    name: 'Plains of Averast',
    type: 'hunting',
    minLevel: 1,
    // archived: Averast.md — the flat plains region surrounding Eldor.
    monsters: ['plains_field_rat', 'plains_wild_boar', 'plains_vermin_swarm', 'plains_windrunner_kestrel', 'plains_cutpurse_vole'],
    facilities: [],
    // Standing Stones touch-quest token (DESIGN.md §7, "The Standing Stones"; archived quest
    // name/behavior — Recent_Updates.md 2007-05-09 — content/placement invented). One of three
    // stones scattered across hunting grounds.
    questTokens: [{ id: 'standing_stone_plains', label: 'Weathered Standing Stone' }],
    desc: 'The flat, wind-swept plains surrounding Eldor. Rats, boar, and vermin swarms are common nuisances here.'
  },

  // ---------- Estari Ruins: level 4-5 hunting + boss lair ----------
  {
    id: 'estari_ruins',
    name: 'Estari Ruins',
    type: 'hunting',
    minLevel: 4,
    monsters: ['estari_loose_rubble', 'estari_construct_sentinel', 'estari_clay_husk', 'estari_anima_scavenger'],
    // The boss is a separate "Lair" entry, fightable only once the party is closer to its own
    // level (invented gate, matches DESIGN.md §4 boss-difficulty framing).
    lair: { monsterId: 'estari_ruin_warden', minLevel: 8, name: 'Ruin Warden’s Lair' },
    facilities: [],
    questTokens: [{ id: 'standing_stone_ruins', label: 'Cracked Standing Stone' }],
    desc: 'A buried excavation of the precursor Estari race, its stonework still stirred by restless Anima. Something older and stronger stands guard deeper in.'
  },

  // ---------- Ju`Mak Village: second town ----------
  {
    id: 'jumak_village',
    name: 'Ju‘Mak Village',
    type: 'town',
    minLevel: 6,
    // archived name: Recent_Updates.md 2007-04-20 ("A new quest has been added in the new town of
    // Ju‘Mak Village"); facilities invented per PLAN.md P4 scope (no Synthesis/Shrine — those
    // stay Eldor-exclusive per DESIGN.md §6).
    monsters: [],
    facilities: [
      {
        type: 'shop',
        // archived flavor: Recent_Updates.md 2007-05-06 ("A new shop was added to Ju‘Mak
        // Village containing expensive items") — mid/high-level stock, including the new
        // level 8-14 gear from the Phase 4 item additions.
        stock: [
          'sword_soldiers_blade', 'sword_arkan_runeblade', 'sword_riverguard_falchion',
          'polearm_militia_halberd',
          'knife_thieves_edge', 'knife_gares_fang',
          'rod_saratus_conduit', 'rod_anima_touched_branch',
          'hth_monks_wraps',
          'shield_ironbound_kite',
          'light_legs_supple_leggings', 'light_feet_soft_boots', 'light_head_wetland_cowl',
          'medium_legs_banded_greaves', 'medium_feet_reinforced_boots', 'medium_body_riverguard_brigandine',
          'heavy_legs_warplate_legguards', 'heavy_feet_ironclad_sabatons',
          'tent_travelers_tent',
          'potion_healing', 'potion_greater_healing',
          'crystal_energy_shard'
        ]
      },
      { type: 'inn' },
      { type: 'vault' },
      { type: 'academy' },
      { type: 'tavern' }
    ],
    desc: 'A frontier village on the edge of the Forests of Kuraan, known for stocking pricier goods than Eldor’s market.'
  },

  // ---------- Kuraan Border Woods: level 6-8 hunting ----------
  {
    id: 'kuraan_border_woods',
    name: 'Kuraan Border Woods',
    type: 'hunting',
    minLevel: 6,
    // archived region name: Forests of Kuraan (DESIGN.md §2 — Arkan homeland, overrun by the Majiku).
    monsters: ['majiku_forest_scout', 'majiku_war_shaman', 'skyspire_wisp', 'oruk_ravager', 'kuraan_prowler', 'kuraan_wind_spirit', 'majiku_beastmaster'],
    facilities: [],
    questTokens: [{ id: 'standing_stone_kuraan', label: 'Moss-Grown Standing Stone' }],
    desc: 'The southern fringe of the Forests of Kuraan, where Majiku raiders range, Oruk tribesmen have been sighted of late, and stray Anima wisps drift down from the distant Skyspire.'
  },

  // =====================================================================
  // v1.2 Phase 3 Content-A (docs/SPEC-V1.2.md Phase 3 Content-A): Laik, Riverside Village —
  // archived: Recent_Updates.md 2007-08-02 ("New town (Laik, Riverside Village) - New quest
  // (Laik: Professor Flad)"). The v1 world previously lacked Laik (Professor Flad's quest was
  // relocated to Ju`Mak Village as a stand-in, js/data/quests.js professor_flad); Laik now exists
  // as the world's 4th town and Flad's quest moves back to its archived home.
  // =====================================================================
  {
    id: 'laik',
    name: 'Laik, Riverside Village',
    type: 'town',
    minLevel: 8, // invented: a riverside waypoint between Ju`Mak Village (6) and Gares Riverbanks (9)
    monsters: [],
    facilities: [
      {
        type: 'shop',
        // invented: mid-level river-trade stock, leaning on the archived "Riverguard" gear line
        // (js/data/items.js — sword_riverguard_falchion/medium_body_riverguard_brigandine/
        // heavy_head_riverguard_greathelm) already introduced for Ju`Mak's pricier stock. It fits
        // Laik's actual riverside setting even better than Ju`Mak's frontier-woods one, so it is
        // stocked here too — shared stock ids across towns is an established pattern (e.g.
        // potion_healing/crystal_energy_shard already appear in multiple town shops).
        stock: [
          'sword_soldiers_blade', 'sword_riverguard_falchion',
          'polearm_militia_halberd', 'knife_thieves_edge',
          'rod_saratus_conduit', 'hth_monks_wraps',
          'shield_ironbound_kite',
          'light_legs_supple_leggings', 'light_feet_soft_boots',
          'medium_legs_banded_greaves', 'medium_feet_reinforced_boots', 'medium_body_riverguard_brigandine',
          'heavy_head_riverguard_greathelm',
          'tent_travelers_tent',
          'potion_healing', 'potion_greater_healing',
          'crystal_energy_shard'
        ]
      },
      { type: 'inn' },
      { type: 'vault' },
      // archived: New_Player_Guide.md §5.1.5 "Tavern" (quest source) — Laik's Tavern is where
      // Professor Flad now offers his quest, restoring the archived giver location (see
      // js/data/quests.js professor_flad).
      { type: 'tavern' }
    ],
    desc: 'A riverside waypoint along the Gares delta trade route (Recent_Updates.md 2007-08-02). Traders favor it for goods too fine for Ju`Mak\'s frontier market and too far upriver for an Eldor merchant to bother hauling. Professor Flad keeps rooms above the tavern, cataloguing whatever the ruins upstream shed into the current.'
  },

  // ---------- Gares Riverbanks: level 9-12 hunting (repurposed archived area name) ----------
  {
    id: 'gares_riverbanks',
    name: 'Gares Riverbanks',
    type: 'hunting',
    minLevel: 9,
    // archived name: Recent_Updates.md 2007-04-25 ("The level 20 area, Gares Riverbanks, is now
    // open."). In the original it was a level-20 zone; PLAN.md P4 scope calls for a level 9-12
    // band here instead (invented level repurposing, name kept for lore continuity — comment
    // preserved per the phase brief).
    monsters: ['gares_river_stalker', 'gares_majiku_raider', 'gares_anima_touched_heron', 'gares_current_wraith', 'gares_bog_adder', 'gares_shellback', 'gares_torrent_naga'],
    facilities: [],
    desc: 'Marshy banks along the Gares river delta. Riverbank predators, Majiku raiding parties, and Anima-touched wildlife haunt the reeds. (Archived as a level-20 zone in the original; repurposed here for the v1 level 9-12 band.)'
  },

  // =====================================================================
  // Phase 6b: Endgame World Expansion (DESIGN.md §2/§10). Saratus + four new hunting areas
  // carrying the level 13-40 band to the story's close (js/data/story.js chapter_2).
  // =====================================================================

  // ---------- Saratus: the Arkan capital (archived name/facilities) ----------
  {
    id: 'saratus',
    name: 'Saratus',
    type: 'town',
    minLevel: 14,
    // archived: Arkan.md ("they established the city of Saratus, a grand circular city focused
    // on the study of magic and technology"); DESIGN.md §2 ("Saratus (Arkan capital)").
    monsters: [],
    facilities: [
      {
        type: 'shop',
        // invented: high-level stock — the level 13-22 gear introduced below, plus Saratus's own
        // rod/runeblade lines (Arkan "runic blades" and battlemage tradition, Arkan.md).
        stock: [
          'sword_saratus_battlemage_blade', 'polearm_foothills_pike', 'knife_juneros_tidefang',
          'rod_arkan_runic_conduit', 'hth_stormward_wraps',
          // Phase 7 balance pass: the previously missing level-25 weapon tier (items.js).
          'sword_juneros_tidebrand', 'polearm_barrier_glaive', 'knife_leviathan_fang',
          'rod_kuraan_runewood', 'hth_construct_gauntlets',
          'shield_arkan_wardplate',
          'light_body_arkan_silkweave', 'light_head_arkan_silk_hood',
          'medium_body_foothills_hauberk', 'medium_legs_foothills_greaves',
          'heavy_body_juneros_scaleplate', 'heavy_head_juneros_scalehelm',
          'tent_expedition_pavilion',
          'potion_healing', 'potion_greater_healing',
          'crystal_energy_shard', 'crystal_pure_anima'
        ]
      },
      { type: 'inn' },
      { type: 'vault' },
      // archived: Arkan.md "battlemages reinforce the front with white and black magic derived
      // from the study of runes" — Saratus's Academy trains the Arkan magic tradition.
      { type: 'academy' },
      // archived: DESIGN.md §6 facility list includes Spirit Shrine at any major city; the
      // Arkan magic-and-technology capital is a natural second Shrine site. NO synthesis here —
      // Synthesis Shop stays Eldor-exclusive (DESIGN.md §6, archived: "Synthesis Shop is now open
      // for business in the Royal City of Eldor").
      { type: 'shrine' },
      { type: 'tavern' }
    ],
    desc: 'The grand circular Arkan capital, a city devoted to the study of magic and technology (Arkan.md). Runic blades and battlemage traditions are traded openly in its high-level markets.'
  },

  // =====================================================================
  // v1.2 Phase 3 Content-A (docs/SPEC-V1.2.md Phase 3 Content-A): a low-level hunting ground on
  // Saratus's own doorstep, so a level-1 Arkan (who now starts in Saratus instead of Eldor —
  // js/core/character.js create(), Arkan.md) has somewhere to hunt from the very first battle,
  // exactly as a level-1 Human has the Plains of Averast right outside Eldor.
  // =====================================================================
  {
    id: 'saratus_plains',
    name: 'Plains East of Saratus',
    type: 'hunting',
    minLevel: 0,
    // archived geography: Arkan.md ("they were forced to the Plains of Averast where the Humans
    // reside. There they established the city of Saratus") — Saratus sits within the same Plains
    // of Averast region as Eldor (Averast.md), so this doorstep hunting ground reuses the SAME
    // early fauna already defined for the plains around Eldor (js/data/monsters.js plains_* ids)
    // rather than inventing new low-level monsters (Content-B already owns monsters.js).
    monsters: ['plains_field_rat', 'plains_windrunner_kestrel', 'plains_wild_boar'],
    facilities: [],
    desc: 'The same windswept plains that shelter Eldor stretch east all the way to Saratus\'s gates (Averast.md) — rats, kestrels, and boar are as common a nuisance on the Arkan side of the region as on the Human one.'
  },

  // ---------- Northern Barrier Foothills: level 13-18 hunting + gate-boss ----------
  {
    id: 'northern_foothills',
    name: 'Northern Barrier Foothills',
    type: 'hunting',
    minLevel: 13,
    // archived geography: Averast.md "the northern border is a natural mountainous barrier that
    // Humans and Arkan have never crossed" — the foothills are as far as any hunter goes.
    monsters: ['foothills_frost_ram', 'foothills_barrier_wolf', 'foothills_stoneback_giant', 'foothills_gale_harrier', 'foothills_ridge_hound'],
    lair: { monsterId: 'foothills_matriarch', minLevel: 18, name: 'Matriarch’s High Camp' },
    facilities: [],
    desc: 'Rocky slopes climbing toward the mountain wall no Human or Arkan has ever crossed (Averast.md). Something with teeth guards the high passes.'
  },

  // ---------- Isle of Juneros: level 19-24 hunting + gate-boss ----------
  {
    id: 'isle_of_juneros',
    name: 'Isle of Juneros',
    type: 'hunting',
    minLevel: 19,
    // archived geography: Averast.md "the western border is an inland sea that contains the isle
    // of Juneros which contains small human settlements."
    monsters: ['juneros_tidewalker', 'juneros_reefstalker', 'juneros_drowned_settler', 'juneros_riptide_hunter', 'juneros_coral_warden'],
    lair: { monsterId: 'juneros_leviathan', minLevel: 25, name: 'The Deep Shoal' },
    facilities: [],
    desc: 'A wind-scoured isle in the inland sea west of Averast, home to a scatter of small human settlements clinging to its shores (Averast.md). The deep shoal beyond them holds something far older than any settler.'
  },

  // ---------- Ruins of Kastengard: level 26-31 hunting + gate-boss ----------
  {
    id: 'kastengard_ruins',
    name: 'Ruins of Kastengard',
    type: 'hunting',
    minLevel: 26,
    // archived: Chapter_I.md — Eidas relocated "far to the northeast" and "the Society
    // established a base of operations known as Kastengard"; chapter_2 (js/data/story.js) picks
    // up the thread of the ruins waking with restless Anima.
    monsters: ['kastengard_wardframe', 'kastengard_anima_wraith', 'kastengard_society_remnant', 'kastengard_earthbound_sentinel'],
    lair: { monsterId: 'kastengard_custodian', minLevel: 32, name: 'The Custodian’s Vault' },
    facilities: [],
    desc: 'Far to the northeast, the abandoned base the Society of Modern Magic called Kastengard (Chapter_I.md). Its outer halls stir with old wardframes and Anima long left untended.'
  },

  // =====================================================================
  // v1.2 Phase 3 Content-A (docs/SPEC-V1.2.md Phase 3 Content-A, review #8): a level-30+ outpost
  // in the Kastengard band so the 26-40 endgame stretch isn't a bare trek between Saratus
  // (minLevel 14) and the ruins themselves. [invented] name/site, Kastengard-flavored — the
  // Crown/Academy expedition camp that grew up outside the ruins once heroes started delving
  // them in earnest (Chapter_I.md: the Society of Modern Magic "established a base of operations
  // known as Kastengard"). Its Shop stocks Content-B's level-30+ items (js/data/items.js;
  // Version_2.1_Changes.md "10 levels of new content for players level 30+", "Added energy
  // stones to level 30+ shop") alongside the level-25/28/30/32/35 gear already named for the
  // Kastengard/Custodian/Vault lore line.
  // =====================================================================
  {
    id: 'kastengard_vanguard_camp',
    name: 'Kastengard Vanguard Camp',
    type: 'town',
    minLevel: 26, // matches kastengard_ruins's own gate, so the outpost is available as soon as the band opens
    monsters: [],
    facilities: [
      {
        type: 'shop',
        stock: [
          'sword_kastengard_relic_blade', 'polearm_vault_reaver', 'knife_custodian_needle',
          'rod_eidas_remnant_wand', 'hth_vault_gauntlets',
          'light_body_kastengard_wardweave', 'medium_body_custodian_plate', 'heavy_body_vault_bulwark',
          'tent_expedition_pavilion',
          'potion_greater_healing', 'potion_vault_reserve',
          'crystal_pure_anima', 'crystal_bclass_3', 'crystal_bclass_4',
          'sphere_bclass_3', 'sphere_bclass_4',
          'stone_energy_lesser', 'stone_energy_greater',
          'material_refined_anima_dust'
        ]
      },
      { type: 'inn' },
      // archived: Arkan.md battlemage/rune-study tradition already trains at Saratus's own
      // Academy; this forward camp offers the same Training-Points-for-techs service (New
      // Vault or Spirit Shrine this far out — those stay Eldor/Saratus-exclusive per DESIGN.md §6).
      { type: 'academy' }
    ],
    desc: 'A fortified camp of Crown surveyors and Academy proctors, thrown up outside Kastengard\'s outer halls once heroes began delving them in earnest. No Vault or Spirit Shrine this far from a real city — just an Inn, a well-stocked Shop selling the frontier\'s toughest gear and energy stores, and Academy proctors willing to train anyone hardy enough to have survived the walk here.'
  },

  // ---------- Kastengard: The Deep Vaults: level 33-40 hunting + final boss ----------
  {
    id: 'kastengard_deep',
    name: 'Kastengard: The Deep Vaults',
    type: 'hunting',
    minLevel: 33,
    // Final zone: the innermost chambers beneath Kastengard, where the Society's last, deepest
    // work waited three centuries undisturbed (chapter_2, js/data/story.js).
    monsters: ['vault_anima_construct', 'vault_runic_horror', 'vault_forsaken_archivist'],
    lair: { monsterId: 'eidas_echo', minLevel: 40, name: 'The Skyspire Anchor' },
    facilities: [],
    desc: 'The deepest vaults beneath Kastengard, sealed since the Skyspire\'s departure. Something of Eidas himself still answers here — an echo cast down from the red moon, and the last thing standing between Van Arius and its oldest, quietest wound.'
  },

  // =====================================================================
  // Level-Arc Band A (docs/SPEC-ARC-BANDS.md, F2/F3): Forests of Kuraan, levels 41-50 — the first
  // band past the L36-40 Skyspire/Eidas act-break, pushing the story north to reclaim the archived
  // Arkan homeland (Arkan.md: "they were forced to the Plains of Averast... they established the
  // city of Saratus") from the Majiku who displaced them (DESIGN.md §2). Two overlapping hunting
  // bands (Kuraan Fringe Woods 41-44, Deep Kuraan 46-49; no gap wider than the archived ±5 XP/loot
  // cutoff, BALANCE.XP_LOOT_CUTOFF_LEVELS) plus a new settlement, Kuraan Reclamation Camp.
  // Destinations are travel-reachable from anywhere once minLevel is met (js/ui/screens.js
  // renderExplore lists ALL of Game.Data.areas as destinations, gated only by
  // Game.World.travelTo's level check) — a fresh level-41 character can reach Kuraan Fringe Woods
  // immediately, no separate adjacency graph to satisfy.
  // =====================================================================

  // ---------- Kuraan Fringe Woods: level 41-44 hunting ----------
  {
    id: 'kuraan_fringe_woods',
    name: 'Kuraan Fringe Woods',
    type: 'hunting',
    minLevel: 41,
    // archived region name: Forests of Kuraan (DESIGN.md §2 — Arkan homeland, overrun by the
    // Majiku); this is the SAME forest as the level 6-8 kuraan_border_woods further south, revisited
    // at the story's next act — the fringe the reclamation push is fighting to hold.
    monsters: ['majiku_reclaimer_knight', 'kuraan_bramble_stalker', 'anima_scarred_revenant'],
    facilities: [],
    desc: 'The southern fringe of the Forests of Kuraan, where the first heroes mustered at the Reclamation Camp are pushing the Majiku back tree by tree. The deeper woods — Deep Kuraan — still answer to a Majiku Warlord who has not yet been made to answer for it.'
  },

  // ---------- Deep Kuraan: level 46-49 hunting + lair boss ----------
  {
    id: 'deep_kuraan',
    name: 'Deep Kuraan',
    type: 'hunting',
    minLevel: 46,
    monsters: ['majiku_deepwood_witch', 'kuraan_hollow_wraith', 'majiku_ironclad_vanguard'],
    // The boss is a separate "Lair" entry, fightable only once the party is closer to its own
    // level (invented gate, matches the estari_ruin_warden/foothills_matriarch precedent).
    lair: { monsterId: 'majiku_warlord', minLevel: 50, name: "The Warlord's Deep Camp" },
    facilities: [],
    desc: 'The old-growth heart of Kuraan, where the Arkan homeland\'s oldest trees still stand — and where the Majiku Warlord who has commanded the occupation for a generation has made his deep camp. Nothing the reclamation has fielded so far has been strong enough to reach him.'
  },

  // ---------- Kuraan Reclamation Camp: level 44 settlement ----------
  {
    id: 'kuraan_reclamation_camp',
    name: 'Kuraan Reclamation Camp',
    type: 'town',
    minLevel: 44, // invented: opens partway through the Fringe Woods band, before Deep Kuraan (46)
    monsters: [],
    facilities: [
      {
        type: 'shop',
        // Band A's tapered levelReq-45/48 gear (js/data/items.js) plus its own C-Class Crystal/
        // Sphere/Energy Stone consumables, alongside a couple of the prior band's top items for a
        // smooth handoff (established pattern — every town shop mixes in at least one older item).
        // Level-Arc Band B (Majiku Highlands, levels 51-60) has NO new settlement (per
        // docs/SPEC-ARC-BANDS.md — this camp covers the whole 41-60 range) — its tapered
        // levelReq-55/58 gear and D-Class Crystal/Sphere/Energy Stone consumables are appended
        // here rather than opening a second shop.
        stock: [
          'sword_kuraan_reclaimers_blade', 'polearm_arkan_vanguard_lance', 'knife_fringewood_fang',
          'rod_majiku_wardbreaker', 'hth_reclaimers_gauntlets',
          'shield_kuraan_wardbulwark',
          'light_body_kuraan_windweave', 'light_head_kuraan_windveil',
          'medium_body_reclaimers_hauberk', 'medium_legs_reclaimers_greaves',
          'heavy_body_kuraan_bulwark_plate', 'heavy_head_kuraan_warhelm',
          'light_legs_kuraan_ward_leggings', 'medium_feet_reclaimers_boots', 'heavy_legs_kuraan_greatplate_legguards',
          'tent_expedition_pavilion',
          'potion_vault_reserve',
          'crystal_cclass_1', 'crystal_cclass_2', 'sphere_cclass_1', 'sphere_cclass_2',
          'stone_energy_kuraan', 'stone_energy_greater',
          'sword_majiku_hostbreaker', 'polearm_ridgewar_pike', 'knife_steppewind_edge',
          'rod_hostcallers_ruin', 'hth_ridgeguard_knuckles',
          'shield_highland_bulwark',
          'light_body_steppewind_mantle', 'light_head_steppewind_cowl',
          'medium_body_hostguard_brigandine', 'medium_legs_hostguard_greaves',
          'heavy_body_ridgeplate_cuirass', 'heavy_head_ridgeplate_helm',
          'light_legs_steppewind_leggings', 'medium_feet_hostguard_boots', 'heavy_legs_ridgeplate_legguards',
          'crystal_dclass_1', 'crystal_dclass_2', 'sphere_dclass_1', 'sphere_dclass_2',
          'stone_energy_majiku'
        ]
      },
      { type: 'inn' },
      { type: 'vault' },
      { type: 'academy' },
      // archived: New_Player_Guide.md §5.1.5 "Tavern" (quest source) — the camp's own quest-giver
      // location, mirroring every other quest-giving settlement (Eldor/Ju`Mak/Saratus/Laik).
      { type: 'tavern' }
    ],
    desc: 'A fortified muster point on the Kuraan fringe, thrown up by the Crown and Academy once the reclamation push began in earnest. Camp Marshal Serath commands the column from here — Inn, Vault, Academy, and a well-stocked Shop selling the reclamation\'s own reforged gear.'
  },

  // =====================================================================
  // Level-Arc Band B (docs/SPEC-ARC-BANDS.md, F2/F3): Majiku Highlands, levels 51-60 — the story
  // pushes past the reclaimed Kuraan fringe into the Majiku's own northern tribal war-lands
  // (DESIGN.md §2), breaking the host that has been staging its counter-attacks from up here. NO
  // new settlement this band (per SPEC-ARC-BANDS.md — Kuraan Reclamation Camp, js/data/areas.js
  // above, is spec'd to cover the whole 41-60 range); quest givers and shop stock are added to
  // that existing camp instead. Two overlapping hunting bands (Majiku Border Steppe 51-54,
  // Highland War-Camps 56-59; gap of 2 levels, under the archived ±5 XP/loot cutoff,
  // BALANCE.XP_LOOT_CUTOFF_LEVELS) plus the band's lair boss. Same travel-reachability note as
  // Band A: js/ui/screens.js renderExplore lists ALL of Game.Data.areas as destinations, gated
  // only by Game.World.travelTo's level check — no separate adjacency graph to satisfy.
  // =====================================================================

  // ---------- Majiku Border Steppe: level 51-54 hunting ----------
  {
    id: 'majiku_border_steppe',
    name: 'Majiku Border Steppe',
    type: 'hunting',
    minLevel: 51,
    // archived region: the Majiku's own northern tribal war-lands (DESIGN.md §2), the open
    // highland steppe north of the Forests of Kuraan the reclamation push has just cleared.
    monsters: ['majiku_steppe_lancer', 'highland_ridgehawk', 'anima_scarred_highlander'],
    facilities: [],
    desc: 'Windswept high steppe north of the reclaimed Kuraan fringe, where Majiku lancers still ride patrol for a host that has not yet accepted the fringe is lost. Further north, dug into the ridgelines proper, the Highland War-Camps still muster in force.'
  },

  // ---------- Highland War-Camps: level 56-59 hunting + lair boss ----------
  {
    id: 'highland_war_camps',
    name: 'Highland War-Camps',
    type: 'hunting',
    minLevel: 56,
    monsters: ['majiku_hostcaller_shaman', 'highland_hollow_stormwraith', 'majiku_hostguard_vanguard'],
    // The boss is a separate "Lair" entry, fightable only once the party is closer to its own
    // level (invented gate, matches the majiku_warlord/estari_ruin_warden precedent).
    lair: { monsterId: 'majiku_ridge_chieftain', minLevel: 60, name: "The Ridge-Chieftain's Camp" },
    facilities: [],
    desc: "The Majiku host's own ridgeline war-camps, dug into the highlands proper — shamans, vanguards, and worse held in reserve behind palisade and ward alike. The Majiku Ridge-Chieftain who commands the whole host still holds this ground, and means to keep it."
  },

  // =====================================================================
  // Level-Arc Band C (docs/SPEC-ARC-BANDS.md, F2/F3): The Frozen Reaches / Ukai approach, levels
  // 61-70 — the story descends from the broken Majiku Highlands into the frozen north, toward the
  // cavern-dwelling Ukai (DESIGN.md §2; archived, Prelude.md: "the Ukai are too proud of their
  // cavernous home to think about anything else"). The Majiku host's remnants fled this far north
  // after Band B; the Ukai themselves, proud and territorial, will not simply let a column pass
  // into their undercaverns — passage has to be won. Two overlapping hunting bands (Glacial
  // Approach 61-64, Ukai Undercaverns 66-69; gap of 2 levels, under the archived ±5 XP/loot
  // cutoff, BALANCE.XP_LOOT_CUTOFF_LEVELS) plus the band's lair boss, and a new settlement,
  // Frosthold Waystation (the 2nd and last new settlement per SPEC-ARC-BANDS.md, serving the whole
  // 61-90 range). Same travel-reachability note as Bands A/B: js/ui/screens.js renderExplore
  // lists ALL of Game.Data.areas as destinations, gated only by Game.World.travelTo's level check
  // — no separate adjacency graph to satisfy.
  // =====================================================================

  // ---------- Glacial Approach: level 61-64 hunting ----------
  {
    id: 'glacial_approach',
    name: 'Glacial Approach',
    type: 'hunting',
    minLevel: 61,
    // The open ice-fields north of the broken Majiku Highlands, where the host's own remnants
    // have scattered to survive rather than surrender.
    monsters: ['majiku_frost_exile', 'glacial_frost_stalker', 'anima_scarred_frostwalker'],
    facilities: [],
    desc: 'The windswept ice-fields north of the Majiku Highlands, where the host\'s broken remnants have fled to freeze or die free rather than answer for the Chieftain\'s defeat. Further north the ice gives way to bare rock and the first cave-mouths of the Ukai Undercaverns — ground the Ukai have never once let an outsider column cross uninvited.'
  },

  // ---------- Ukai Undercaverns: level 66-69 hunting + lair boss ----------
  {
    id: 'ukai_undercaverns',
    name: 'Ukai Undercaverns',
    type: 'hunting',
    minLevel: 66,
    monsters: ['ukai_cave_warden', 'ukai_hollow_deepling', 'ukai_deep_vanguard'],
    // The boss is a separate "Lair" entry, fightable only once the party is closer to its own
    // level (invented gate, matches the majiku_warlord/majiku_ridge_chieftain precedent).
    lair: { monsterId: 'ukai_deep_dweller', minLevel: 70, name: "The Deep-Dweller's Hollow" },
    facilities: [],
    desc: 'The Ukai\'s own cavern-halls, warded and guarded exactly as proudly as the old lore said they would be (Prelude.md). Something the cavern-dwellers call the Deep-Dweller keeps its own hollow at the undercaverns\' heart — and until it answers for the column at the gate, no Ukai elder will so much as discuss passage north.'
  },

  // ---------- Frosthold Waystation: level 65 settlement ----------
  {
    id: 'frosthold_waystation',
    name: 'Frosthold Waystation',
    type: 'town',
    minLevel: 65, // invented: opens partway through the Glacial Approach band, before Ukai Undercaverns (66) — same gating shape as Kuraan Reclamation Camp (44, before Deep Kuraan's 46)
    monsters: [],
    facilities: [
      {
        type: 'shop',
        // Band C's tapered levelReq-65/68 gear (js/data/items.js) plus its own E-Class Crystal/
        // Sphere/Energy Stone consumables. Established pattern: every town shop mixes in at least
        // one older item for a smooth handoff — here, a couple of Band B's top items.
        stock: [
          'sword_frosthold_vanguard_blade', 'polearm_glacial_warpike', 'knife_icebound_fang',
          'rod_ukai_wardstone', 'hth_frostbound_knuckles',
          'shield_frosthold_bulwark',
          'light_body_frosthold_veilcloak', 'light_head_frosthold_veilhood',
          'medium_body_waystation_hauberk', 'medium_legs_waystation_greaves',
          'heavy_body_glacial_bulwark_plate', 'heavy_head_glacial_warhelm',
          'light_legs_frosthold_ward_leggings', 'medium_feet_waystation_boots', 'heavy_legs_glacial_greatplate_legguards',
          'tent_expedition_pavilion',
          'potion_vault_reserve',
          'crystal_eclass_1', 'crystal_eclass_2', 'sphere_eclass_1', 'sphere_eclass_2',
          'stone_energy_frosthold',
          'sword_majiku_hostbreaker', 'shield_highland_bulwark',
          // Level-Arc Band D (docs/SPEC-ARC-BANDS.md): the Estari Ruins Deep tier-75/78 gear and
          // F-Class consumables (js/data/items.js) — Frosthold Waystation still serves the whole
          // 61-90 range, so Band D adds no new settlement and simply extends this stock.
          'sword_estari_wardblade', 'polearm_estari_warpike', 'knife_estari_shard_fang',
          'rod_wellspring_conduit', 'hth_warden_gauntlets', 'shield_estari_bulwark',
          'light_body_wellspring_veil', 'light_head_wellspring_hood',
          'medium_body_estari_brigandine', 'medium_legs_estari_greaves',
          'heavy_body_warden_plate', 'heavy_head_warden_helm',
          'light_legs_wellspring_leggings', 'medium_feet_estari_boots', 'heavy_legs_warden_legguards',
          'crystal_fclass_1', 'crystal_fclass_2', 'sphere_fclass_1', 'sphere_fclass_2',
          'stone_energy_wellspring',
          // Level-Arc Band E (docs/SPEC-ARC-BANDS.md): the Ascent to the Skyspire tier-85/88
          // gear and G-Class consumables (js/data/items.js) — Frosthold Waystation still serves
          // the whole 61-90 range, so Band E adds no new settlement and simply extends this stock.
          'sword_spireward_blade', 'polearm_skyspire_halberd', 'knife_society_renegade_dirk',
          'rod_anima_channeling_rod', 'hth_spireguard_gauntlets', 'shield_spireward_aegis',
          'light_body_skysilk_shroud', 'light_head_skysilk_hood',
          'medium_body_spireguard_brigandine', 'medium_legs_spireguard_greaves',
          'heavy_body_spireward_plate', 'heavy_head_spireward_helm',
          'light_legs_stormline_leggings', 'medium_feet_stormline_boots', 'heavy_legs_stormline_legguards',
          'crystal_gclass_1', 'crystal_gclass_2', 'sphere_gclass_1', 'sphere_gclass_2',
          'stone_energy_skyspire'
        ]
      },
      { type: 'inn' },
      { type: 'vault' },
      { type: 'academy' },
      // archived: Anima_Shards.md / Cursed.md Spirit Shrine services — Frosthold is the first
      // Level-Arc settlement to carry one (Kuraan Reclamation Camp did not), matching the
      // per-band brief's facility list for the 61-90 range's waystation.
      { type: 'shrine' },
      // archived: New_Player_Guide.md §5.1.5 "Tavern" (quest source), same as every other
      // quest-giving settlement (Eldor/Ju`Mak/Saratus/Laik/Kuraan Reclamation Camp).
      { type: 'tavern' }
    ],
    desc: 'A wind-scoured waystation thrown up at the edge of the ice-fields, the last Crown-held ground before the Ukai\'s own undercaverns. Waystation Commander Thessaly holds the line here — Inn, Vault, Academy, Spirit Shrine, and a well-stocked Shop selling gear fit for the frozen approach.'
  },

  // =====================================================================
  // Level-Arc Band D (docs/SPEC-ARC-BANDS.md, F2/F3): Estari Ruins Deep, levels 71-80 — the story
  // descends past the won Ukai passage into the precursor Estari's own sealed sublevels, down to
  // the taboo Anima Wellspring itself (DESIGN.md §2 lore: the precursor race Estari discovered
  // Anima, ninth-dimensional matter that is the life-force of Exos itself; mining it would kill
  // the planet, so the Council of Three banned it — archived, Prelude.md/Chapter I). The low-level
  // Estari Ruins (js/data/areas.js `estari_ruins`, level 4-5) were only the outer shell; these
  // sublevels are the real depth the archived lore gestures at. Two overlapping hunting bands
  // (Estari Sublevels 71-74, The Anima Wellspring 76-79; gap of 2 levels, under the archived ±5
  // XP/loot cutoff, BALANCE.XP_LOOT_CUTOFF_LEVELS) plus the band's lair boss. NO new settlement —
  // Frosthold Waystation (Band C) already serves the whole 61-90 range. Same travel-reachability
  // note as Bands A/B/C: js/ui/screens.js renderExplore lists ALL of Game.Data.areas as
  // destinations, gated only by Game.World.travelTo's level check — no separate adjacency graph.
  // =====================================================================

  // ---------- Estari Sublevels: level 71-74 hunting ----------
  {
    id: 'estari_sublevels',
    name: 'Estari Sublevels',
    type: 'hunting',
    minLevel: 71,
    // The sealed lower levels of the Estari ruins, dug deeper than anything Eldor's own Ruin
    // Warden ever guarded — wardens, raw-anima constructs, and the first scarred remnants of
    // whoever last excavated this deep.
    monsters: ['estari_sublevel_warden', 'estari_anima_conduit', 'anima_scarred_excavator'],
    facilities: [],
    desc: "The Estari ruins run far deeper than Eldor's own excavated shell ever let on — sealed sublevels, still warded by constructs older than the Ukai's own undercaverns. Something down here is leaking raw Anima again, badly enough that even long-dead ward-stone is waking to stop it. Further down, the sublevels open onto whatever the Estari themselves were guarding: the Anima Wellspring."
  },

  // ---------- The Anima Wellspring: level 76-79 hunting + lair boss ----------
  {
    id: 'anima_wellspring',
    name: 'The Anima Wellspring',
    type: 'hunting',
    minLevel: 76,
    monsters: ['estari_wellspring_warden', 'raw_anima_horror', 'estari_ruin_vanguard'],
    // The boss is a separate "Lair" entry, fightable only once the party is closer to its own
    // level (invented gate, matches the majiku_warlord/majiku_ridge_chieftain/ukai_deep_dweller
    // precedent).
    lair: { monsterId: 'estari_warden_prime', minLevel: 80, name: "The Warden-Prime's Sanctum" },
    facilities: [],
    desc: "The taboo itself: a raw seam of Anima the Estari sealed away rather than mine to exhaustion, exactly as the Council of Three's ban demanded (Prelude.md). Somebody — or something — has cracked that seal again, and the Estari Warden-Prime that answers to the wellspring's own old wards has started treating anything that moves, hero included, as the trespass the ban was written to prevent."
  },

  // =====================================================================
  // Level-Arc Band E (docs/SPEC-ARC-BANDS.md, F2/F3): Ascent to the Skyspire, levels 81-90 — the
  // story climbs out of the Estari depths and north to Kastengard, then up Eidas's own Skyspire
  // itself (DESIGN.md §2 lore: renegade runologist Eidas reformed the Society of Modern Magic at
  // Kastengard, built the Skyspire, and departed for the red moon to found a "divine race" —
  // archived, Prelude.md/Chapter I). Eidas is long gone, but the Society's last remnant never
  // left, and neither did whatever anima-horrors it built or awakened while its master's back was
  // turned. Two overlapping hunting bands (Skyspire Lower Spans 81-84, Skyspire Upper Spans
  // 86-89; gap of 2 levels, under the archived ±5 XP/loot cutoff, BALANCE.XP_LOOT_CUTOFF_LEVELS)
  // plus the band's lair boss. NO new settlement — Frosthold Waystation (Band C) already serves
  // the whole 61-90 range. Same travel-reachability note as Bands A/B/C/D: js/ui/screens.js
  // renderExplore lists ALL of Game.Data.areas as destinations, gated only by
  // Game.World.travelTo's level check — no separate adjacency graph.
  // =====================================================================

  // ---------- Skyspire Lower Spans: level 81-84 hunting ----------
  {
    id: 'skyspire_lower_spans',
    name: 'Skyspire Lower Spans',
    type: 'hunting',
    minLevel: 81,
    // The lowest ring of Eidas's tower, its wardens never stood down after their maker left for
    // the red moon — patrolled now by the last remnant of the Society of Modern Magic and the
    // raw-Anima horrors it never managed to fully leash.
    monsters: ['skyspire_lower_warden', 'society_remnant_battlemage', 'anima_horror_stalker'],
    facilities: [],
    desc: "Eidas's Skyspire rises straight out of Kastengard's own rooftops, its lower spans still held by ward-constructs that answer to no one now — and by the Society of Modern Magic's last remnant, holed up in the tower its master abandoned for the red moon. Higher up, past the spans still open to the sky, the Society's own inner sanctum waits."
  },

  // ---------- Skyspire Upper Spans: level 86-89 hunting + lair boss ----------
  {
    id: 'skyspire_upper_spans',
    name: 'Skyspire Upper Spans',
    type: 'hunting',
    minLevel: 86,
    monsters: ['skyspire_upper_sentinel', 'society_arcanist_prime', 'anima_horror_ravager'],
    // The boss is a separate "Lair" entry, fightable only once the party is closer to its own
    // level (invented gate, matches the majiku_warlord/majiku_ridge_chieftain/ukai_deep_dweller/
    // estari_warden_prime precedent).
    lair: { monsterId: 'society_anima_horror', minLevel: 90, name: "The Society's Last Sanctum" },
    facilities: [],
    desc: "The spans thin out this high, open on every side to the wind and to whatever the Society of Modern Magic was still working on when Eidas sailed for the red moon without them. Something down in the tower's own sanctum has outgrown every leash the Society ever put on it — Anima given shape and hunger, exactly the outcome the Council of Three's old ban was written to prevent."
  }
];

window.Game = Game;
