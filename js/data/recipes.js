// HeroRPG remake — Synthesis Shop recipes (DESIGN.md §6; reference/manual/Synthesis_Shop.md
// "you exchange both Platinum and/or Gold as well as items for new items... The resulting item
// will often have greater stats than the items used to craft it."). Concrete recipe list is
// invented (no recipe data survived the archive).
//
// Shape: { id, inputs: [itemIds], gold, output: itemId, desc }
// Inputs are consumed from inventory (not equipped); gold is paid on top; output is a single item.

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.recipes = [
  {
    id: 'synth_soldiers_blade',
    inputs: ['sword_rusty_shortblade', 'sword_rusty_shortblade'],
    gold: 40,
    output: 'sword_soldiers_blade',
    desc: 'Reforge two rusty shortblades into a single well-balanced Soldier\'s Blade.'
  },
  {
    id: 'synth_thieves_edge',
    inputs: ['knife_worn_dagger', 'knife_worn_dagger'],
    gold: 60,
    output: 'knife_thieves_edge',
    desc: 'Grind down two worn daggers and reforge them into a slender Thieves\' Edge.'
  },
  {
    id: 'synth_ironbound_kite',
    inputs: ['shield_wooden_buckler', 'shield_wooden_buckler'],
    gold: 70,
    output: 'shield_ironbound_kite',
    desc: 'Band a pair of wooden bucklers with reclaimed iron to produce an Ironbound Kite Shield.'
  },
  {
    id: 'synth_studded_jerkin',
    inputs: ['light_body_traveler_tunic', 'medium_head_riveted_cap'],
    gold: 30,
    output: 'medium_body_studded_jerkin',
    desc: 'Reinforce a traveler\'s tunic with studs salvaged from a riveted cap.'
  },
  {
    id: 'synth_healing_potion',
    inputs: ['potion_minor_healing', 'potion_minor_healing', 'potion_minor_healing'],
    gold: 20,
    output: 'potion_healing',
    desc: 'Combine three minor healing potions into one stronger Healing Potion.'
  },
  {
    id: 'synth_greater_healing_potion',
    inputs: ['potion_healing', 'potion_healing', 'crystal_energy_shard'],
    gold: 50,
    output: 'potion_greater_healing',
    desc: 'Infuse two healing potions with an Energy Shard to distill a Greater Healing Potion.'
  },

  // =====================================================================
  // Phase 6b: endgame recipes (DESIGN.md §6 Synthesis, Eldor-only). Combine mid-tier hunting
  // drops from the new areas into the level 25/35 gear introduced in js/data/items.js/monsters.js.
  // Gold costs scaled roughly to a fraction of the output item's value, matching the existing
  // synth_* precedent above.
  // =====================================================================
  {
    id: 'synth_kastengard_relic_blade',
    inputs: ['sword_saratus_battlemage_blade', 'quest_custodian_core_shard'],
    gold: 500,
    output: 'sword_kastengard_relic_blade',
    desc: 'Reforge a Saratus Battlemage Blade around a Custodian Core Shard to strike a Kastengard Relic Blade.'
  },
  {
    id: 'synth_vault_reaver',
    inputs: ['polearm_foothills_pike', 'quest_custodian_core_shard'],
    gold: 500,
    output: 'polearm_vault_reaver',
    desc: 'Fit a Foothills Pike with a salvaged Custodian Core Shard to forge the massive Vault Reaver.'
  },
  {
    id: 'synth_vault_bulwark_plate',
    inputs: ['heavy_body_juneros_scaleplate', 'quest_leviathan_scale', 'quest_archivist_key'],
    gold: 550,
    output: 'heavy_body_vault_bulwark',
    desc: 'Layer a Juneros Scaleplate with a shed Leviathan Scale and key the wards with an Archivist\'s Key to temper a Vault Bulwark Plate.'
  },
  // v1.6 P3 EI-2 (SPEC-V1.6-REBALANCE.md §3/§6.1, REVIEW-2026-07-16.md EI-2) [revised]: this recipe's
  // OWN natural floor was already ~level 26 (quest_society_ledger_page only drops/forages in
  // kastengard_ruins, minLevel 26 -- js/data/areas.js), not level 15 as the base input's own
  // levelReq (light_body_arkan_silkweave, 15) suggested; the real problem the review flagged is
  // that every OTHER levelReq 30-35 synthesis recipe in this tier (synth_kastengard_relic_blade,
  // synth_vault_reaver, synth_vault_bulwark_plate) requires a GATE-BOSS drop, while this one didn't
  // -- the only levelReq-30+ recipe skippable without ever beating a lair boss, letting it (now
  // correctly re-valued by the EI-2 armor fix above, tied with the levelReq-45 tier) be assembled
  // straight off forage/regular-monster drops. Added quest_custodian_core_shard (Kastengard's own
  // gate-boss material, kastengard_custodian, minLevel 32 -- already boss-drop-only per EI-4) to
  // bring it in line with its levelReq 30-35 sibling recipes, and raised gold 400->900 (still below
  // the sibling recipes' cost-to-output-value ratio, but no longer the cheapest levelReq-30+ recipe
  // in the game). No item id changed (saves store ids).
  {
    id: 'synth_kastengard_wardweave',
    inputs: ['light_body_arkan_silkweave', 'quest_society_ledger_page', 'quest_settler_locket', 'quest_custodian_core_shard'],
    gold: 900,
    output: 'light_body_kastengard_wardweave',
    desc: 'Reweave an Arkan Silkweave Robe with warding thread pulled from a Society ledger page, a drowned settler\'s keepsake, and a shard of the Kastengard Custodian\'s own broken core.'
  },

  // =====================================================================
  // v1.2 Phase 3 (docs/SPEC-V1.2.md Content-B item 2): a few level-30+ synthesis recipes.
  // Archived: reference/manual/Version_2.1_Changes.md "Added synthesis shop items for levels
  // 30+" / "Added new predefined transmutation recipes." Two progression recipes (2x a lower
  // B-Class grade -> the next grade up, same pattern as synth_healing_potion/
  // synth_greater_healing_potion above) plus one capstone recipe combining a top-grade Crystal
  // with the new Refined Anima Dust material (js/data/items.js) into a premium Light Crystal.
  // Gold costs scaled to a fraction of the output item's value, matching the existing precedent.
  // =====================================================================
  {
    id: 'synth_bclass_crystal_3',
    inputs: ['crystal_bclass_2', 'crystal_bclass_2'],
    gold: 300,
    output: 'crystal_bclass_3',
    desc: 'Fuse two B-Class Crystal IIs into a single, denser B-Class Crystal III.'
  },
  {
    id: 'synth_bclass_sphere_3',
    inputs: ['sphere_bclass_2', 'sphere_bclass_2'],
    gold: 250,
    output: 'sphere_bclass_3',
    desc: 'Fuse two B-Class Sphere IIs into a single, denser B-Class Sphere III.'
  },
  {
    id: 'synth_light_crystal',
    inputs: ['crystal_bclass_4', 'material_refined_anima_dust'],
    gold: 700,
    output: 'crystal_light',
    desc: 'Bind a top-grade B-Class Crystal IV with Refined Anima Dust to forge a premium Light Crystal.'
  },

  // =====================================================================
  // Level-Arc Band A (docs/SPEC-ARC-BANDS.md, F2/F3): two synthesis recipes for the Forests of
  // Kuraan band — a gear-tier reforge using a Band A quest material, and a graded-consumable
  // progression recipe matching the synth_bclass_crystal_3 precedent above.
  // =====================================================================
  {
    id: 'synth_kuraan_reclaimers_blade',
    inputs: ['sword_kastengard_relic_blade', 'quest_majiku_warband_sigil'],
    gold: 700,
    output: 'sword_kuraan_reclaimers_blade',
    desc: "Reforge a Kastengard Relic Blade around a captured Majiku Warband Sigil to strike a fresh Reclaimer's Blade."
  },
  {
    id: 'synth_cclass_crystal_2',
    inputs: ['crystal_cclass_1', 'crystal_cclass_1'],
    gold: 400,
    output: 'crystal_cclass_2',
    desc: 'Fuse two C-Class Crystal Is into a single, denser C-Class Crystal II.'
  },

  // =====================================================================
  // Level-Arc Band B (docs/SPEC-ARC-BANDS.md, F2/F3): two synthesis recipes for the Majiku
  // Highlands band — a gear-tier reforge using a Band B quest material, and a graded-consumable
  // progression recipe matching the synth_cclass_crystal_2 precedent above.
  // =====================================================================
  {
    id: 'synth_majiku_hostbreaker',
    inputs: ['sword_kuraan_reclaimers_blade', 'quest_majiku_host_standard'],
    gold: 750,
    output: 'sword_majiku_hostbreaker',
    desc: "Reforge a Reclaimer's Blade around a captured Majiku Host Standard to strike a fresh Hostbreaker Blade."
  },
  {
    id: 'synth_dclass_crystal_2',
    inputs: ['crystal_dclass_1', 'crystal_dclass_1'],
    gold: 450,
    output: 'crystal_dclass_2',
    desc: 'Fuse two D-Class Crystal Is into a single, denser D-Class Crystal II.'
  },

  // =====================================================================
  // Level-Arc Band C (docs/SPEC-ARC-BANDS.md, F2/F3): two synthesis recipes for the Frozen
  // Reaches / Ukai approach band — a gear-tier reforge using a Band C quest material, and a
  // graded-consumable progression recipe matching the synth_dclass_crystal_2 precedent above.
  // =====================================================================
  {
    id: 'synth_frosthold_vanguard_blade',
    inputs: ['sword_majiku_hostbreaker', 'quest_ukai_deep_rune'],
    gold: 800,
    output: 'sword_frosthold_vanguard_blade',
    desc: "Reforge a Hostbreaker Blade around a captured Ukai Deep-Rune to strike a fresh Frosthold Vanguard Blade."
  },
  {
    id: 'synth_eclass_crystal_2',
    inputs: ['crystal_eclass_1', 'crystal_eclass_1'],
    gold: 500,
    output: 'crystal_eclass_2',
    desc: 'Fuse two E-Class Crystal Is into a single, denser E-Class Crystal II.'
  },

  // =====================================================================
  // Level-Arc Band D (docs/SPEC-ARC-BANDS.md, F2/F3): two synthesis recipes for Estari Ruins
  // Deep — a gear-tier reforge using a Band D quest material, and a graded-consumable
  // progression recipe matching the synth_eclass_crystal_2 precedent above.
  // =====================================================================
  {
    id: 'synth_estari_wardblade',
    inputs: ['sword_frosthold_vanguard_blade', 'quest_anima_taint_sample'],
    gold: 850,
    output: 'sword_estari_wardblade',
    desc: "Reforge a Frosthold Vanguard Blade around a catalogued Anima Taint Sample to strike a fresh Estari Wardblade."
  },
  {
    id: 'synth_fclass_crystal_2',
    inputs: ['crystal_fclass_1', 'crystal_fclass_1'],
    gold: 550,
    output: 'crystal_fclass_2',
    desc: 'Fuse two F-Class Crystal Is into a single, denser F-Class Crystal II.'
  },

  // =====================================================================
  // Level-Arc Band E (docs/SPEC-ARC-BANDS.md, F2/F3): two synthesis recipes for the Ascent to
  // the Skyspire — a gear-tier reforge using a Band E quest material, and a graded-consumable
  // progression recipe matching the synth_fclass_crystal_2 precedent above.
  // =====================================================================
  {
    id: 'synth_spireward_blade',
    inputs: ['sword_estari_wardblade', 'quest_society_cipher_page'],
    gold: 900,
    output: 'sword_spireward_blade',
    desc: "Reforge an Estari Wardblade around a deciphered Society Cipher Page to strike a fresh Spireward Blade."
  },
  {
    id: 'synth_gclass_crystal_2',
    inputs: ['crystal_gclass_1', 'crystal_gclass_1'],
    gold: 600,
    output: 'crystal_gclass_2',
    desc: 'Fuse two G-Class Crystal Is into a single, denser G-Class Crystal II.'
  },

  // =====================================================================
  // Level-Arc Band F (docs/SPEC-ARC-BANDS.md, F2/F3): two synthesis recipes for The Red Moon /
  // Eidas's Sanctum — a gear-tier reforge using a Band F quest material, and a graded-consumable
  // progression recipe matching the synth_gclass_crystal_2 precedent above.
  // =====================================================================
  {
    id: 'synth_redmoon_blade',
    inputs: ['sword_spireward_blade', 'quest_eidas_sigil_shard'],
    gold: 950,
    output: 'sword_redmoon_blade',
    desc: "Reforge a Spireward Blade around a deciphered Eidas Sigil Shard to strike a fresh Redmoon Blade."
  },
  {
    id: 'synth_hclass_crystal_2',
    inputs: ['crystal_hclass_1', 'crystal_hclass_1'],
    gold: 650,
    output: 'crystal_hclass_2',
    desc: 'Fuse two H-Class Crystal Is into a single, denser H-Class Crystal II.'
  }
];

window.Game = Game;
