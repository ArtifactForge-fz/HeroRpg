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
  {
    id: 'synth_kastengard_wardweave',
    inputs: ['light_body_arkan_silkweave', 'quest_society_ledger_page', 'quest_settler_locket'],
    gold: 400,
    output: 'light_body_kastengard_wardweave',
    desc: 'Reweave an Arkan Silkweave Robe with warding thread pulled from a Society ledger page and a drowned settler\'s keepsake.'
  }
];

window.Game = Game;
