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
  }
];

window.Game = Game;
