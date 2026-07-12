# Icon credits

The pixel-art icons in `assets/icons/` are drawn from **Dungeon Crawl Stone Soup's 32x32 tile
set** ("Dungeon Crawl 32x32 tiles"), distributed on OpenGameArt.org:

- https://opengameart.org/content/dungeon-crawl-32x32-tiles
- Archive used: `crawl-tiles Oct-5-2010.zip`
- License: CC0 / public domain — no attribution legally required. This credit is offered as a
  courtesy to the Dungeon Crawl Stone Soup development team and tileset contributors.

Only the ~140 individual tiles actually mapped to a HeroRPG remake item/monster/technique id were
copied into this repository (`assets/icons/<gameId>.png`); the full multi-thousand-file tileset
archive itself is NOT checked in. Filenames were renamed to match this project's internal ids —
they no longer match the original tileset's naming.

No tile in this set was drawn for HeroRPG; matches were chosen by closest visual/thematic fit
(e.g. swords for sword items, golems for Estari/Kastengard constructs, etc.) by whoever ran the
Phase 8 icon-integration pass. See `js/ui/screens.js`'s `Game.UI.icon()` helper for how these are
rendered in-game, and `tests/test_icons.js` for the integrity check that every game id has a
matching file here.

## v1.2 icons — real DCSS tiles from the upstream repo

All 24 new v1.2 ids (Phase 1 offhand weapons, Phase 2 tier-3/Legendary class techs, Phase 3
Content-B Crystals/Spheres/stones/materials + `tech_warcry_2`) use real Dungeon Crawl Stone Soup
tiles. The `crawl-tiles Oct-5-2010.zip` archive above wasn't present in the working environment, so
these were pulled directly from the same CC0/public-domain source — the DCSS project repo
`crawl-ref/source/rltiles/…` at https://github.com/crawl/crawl (the same art OpenGameArt's
"Dungeon Crawl 32x32 tiles" page redistributes). Same license (CC0 / public domain).

The same pass also **replaced one member of each of 6 pre-existing byte-identical icon pairs** with a
distinct real tile, so the whole `assets/icons/` set is now byte-hash-distinct (verified: no
duplicate groups across all 199 files — stricter than `test_icons.js`'s presence check). Ids given
distinct tiles: `tech_arcane_cataclysm`, `tech_efficient_strike`, `tech_execution_blow`,
`tech_greater_mending`, `tech_radiant_smite`, `tech_quick_stab`.

Source-tile mapping (game id ← `rltiles` path), chosen by closest visual/thematic fit:

| game id | rltiles source |
|---|---|
| crystal_bclass_1..4 | item/gem/{dungeon,lair,snake,vaults}_found_whole |
| crystal_light / crystal_dark | item/gem/{shoals,crypt}_found_whole |
| sphere_bclass_1..4 | item/misc/orb_of_zot{1..4} |
| sphere_light / sphere_dark | item/misc/orb_of_zot5 / uncollected_orb |
| material_refined_anima_dust | item/misc/misc_sack |
| potion_vault_reserve | item/potion/i-heal-wounds |
| stone_energy_lesser / greater | item/misc/misc_stone / misc_tremorstones |
| knife_offhand_twinfang | item/weapon/quickblade1 |
| hth_offhand_cestus | item/weapon/club2 |
| tech_shadow_blade | gui/spells/necromancy/excruciating_wounds |
| tech_anima_reckoning | gui/spells/air/chain_lightning |
| tech_dice_throw | gui/spells/misc/scattershot |
| tech_vault_reckoning | gui/spells/earth/shatter |
| tech_echoing_judgment | gui/spells/misc/bolt_of_light |
| tech_warcry_2 | gui/spells/enchantment/berserker_rage |
| tech_arcane_cataclysm | gui/spells/conjuration/orb_of_destruction |
| tech_efficient_strike | gui/spells/enchantment/sure_blade |
| tech_execution_blow | gui/spells/conjuration/momentum_strike |
| tech_greater_mending | item/potion/i-curing |
| tech_radiant_smite | gui/spells/fire/starburst |
| tech_quick_stab | item/weapon/dagger3 |

All were verified as valid 32x32 PNGs and byte-hash-distinct from every other icon in this
directory. (This supersedes an earlier session note that these tiles were procedural placeholders.)

## Level-Arc Band A icons — procedural placeholders (pending the lead's real-tile pass)

The 35 new ids introduced by Level-Arc Band A (Forests of Kuraan, levels 41-50 —
`docs/SPEC-ARC-BANDS.md`) use hand-generated procedural placeholder tiles, not real Dungeon Crawl
art: 7 new monsters (`majiku_reclaimer_knight`, `kuraan_bramble_stalker`, `anima_scarred_revenant`,
`majiku_deepwood_witch`, `kuraan_hollow_wraith`, `majiku_ironclad_vanguard`, `majiku_warlord`),
6 weapons/shield (`sword_kuraan_reclaimers_blade`, `polearm_arkan_vanguard_lance`,
`knife_fringewood_fang`, `rod_majiku_wardbreaker`, `hth_reclaimers_gauntlets`,
`shield_kuraan_wardbulwark`), 9 armor pieces (`light_body_kuraan_windweave`,
`light_head_kuraan_windveil`, `medium_body_reclaimers_hauberk`, `medium_legs_reclaimers_greaves`,
`heavy_body_kuraan_bulwark_plate`, `heavy_head_kuraan_warhelm`, `light_legs_kuraan_ward_leggings`,
`medium_feet_reclaimers_boots`, `heavy_legs_kuraan_greatplate_legguards`), 5 consumables
(`crystal_cclass_1`, `crystal_cclass_2`, `sphere_cclass_1`, `sphere_cclass_2`,
`stone_energy_kuraan`), 1 quest material (`quest_majiku_warband_sigil`), 3 unique items
(`light_body_kuraan_ashcloak`, `rod_ashenbrand_conduit`, `sword_warlords_broken_oath`), and 4
techs (`tech_firebolt_4`, `tech_mend_wounds_4`, `tech_cleave_4`, `tech_impale_4`).

Per `docs/SPEC-ARC-BANDS.md`'s Icons convention, band agents' environments cannot reach the
`crawl-ref/source/rltiles` repo, so these were generated with the same hand-rolled PNG encoder as
the pre-P5 placeholder pass (deterministic per-id hash -> fill/accent colors + one of 5 simple
patterns — border ring, diagonal stripes, checker quadrants, cross, or concentric ring — plus a
small corner mark), guaranteeing every tile is a valid 32x32 RGBA PNG and byte-hash-distinct from
every other icon in this directory (verified programmatically against the full `assets/icons/`
set, not just against each other). The lead's real-DCSS-tile pass at the end of the Level-Arc work
(`docs/SPEC-ARC-BANDS.md` "Phasing" section) should replace these 35 placeholders the same way the
P5 pass replaced the v1.2 ones above.

## Level-Arc Band B icons — procedural placeholders (pending the lead's real-tile pass)

The 35 new ids introduced by Level-Arc Band B (Majiku Highlands, levels 51-60 —
`docs/SPEC-ARC-BANDS.md`) use hand-generated procedural placeholder tiles, not real Dungeon Crawl
art: 7 new monsters (`majiku_steppe_lancer`, `highland_ridgehawk`, `anima_scarred_highlander`,
`majiku_hostcaller_shaman`, `highland_hollow_stormwraith`, `majiku_hostguard_vanguard`,
`majiku_ridge_chieftain`), 6 weapons/shield (`sword_majiku_hostbreaker`, `polearm_ridgewar_pike`,
`knife_steppewind_edge`, `rod_hostcallers_ruin`, `hth_ridgeguard_knuckles`,
`shield_highland_bulwark`), 9 armor pieces (`light_body_steppewind_mantle`,
`light_head_steppewind_cowl`, `medium_body_hostguard_brigandine`, `medium_legs_hostguard_greaves`,
`heavy_body_ridgeplate_cuirass`, `heavy_head_ridgeplate_helm`, `light_legs_steppewind_leggings`,
`medium_feet_hostguard_boots`, `heavy_legs_ridgeplate_legguards`), 5 consumables
(`crystal_dclass_1`, `crystal_dclass_2`, `sphere_dclass_1`, `sphere_dclass_2`,
`stone_energy_majiku`), 1 quest material (`quest_majiku_host_standard`), 3 unique items
(`light_body_highland_ashmantle`, `rod_stormwraiths_core`, `polearm_chieftains_warpike`), and 4
techs (`tech_firebolt_5`, `tech_mend_wounds_5`, `tech_cleave_5`, `tech_impale_5`).

Generated with the same hand-rolled per-id-hash placeholder approach as Band A above (deterministic
fill/accent colors + one of 5 patterns + a corner mark); the PNG container itself is built with
Node's `zlib.deflateSync`/manual chunk+CRC32 writer, guaranteeing a structurally valid stream. All
35 were verified programmatically as valid 32x32 RGBA PNGs and byte-hash-distinct from every other
icon in `assets/icons/` (269 files total, zero duplicate hashes) — not just against each other. The
lead's real-DCSS-tile pass at the end of the Level-Arc work should replace these 35 placeholders
the same way the P5 pass replaced the v1.2 ones and Band A's are slated to be replaced.

## Level-Arc Band C icons — procedural placeholders (pending the lead's real-tile pass)

The 35 new ids introduced by Level-Arc Band C (The Frozen Reaches / Ukai approach, levels 61-70 —
`docs/SPEC-ARC-BANDS.md`) use hand-generated procedural placeholder tiles, not real Dungeon Crawl
art: 7 new monsters (`majiku_frost_exile`, `glacial_frost_stalker`, `anima_scarred_frostwalker`,
`ukai_cave_warden`, `ukai_hollow_deepling`, `ukai_deep_vanguard`, `ukai_deep_dweller`),
6 weapons/shield (`sword_frosthold_vanguard_blade`, `polearm_glacial_warpike`, `knife_icebound_fang`,
`rod_ukai_wardstone`, `hth_frostbound_knuckles`, `shield_frosthold_bulwark`), 9 armor pieces
(`light_body_frosthold_veilcloak`, `light_head_frosthold_veilhood`, `medium_body_waystation_hauberk`,
`medium_legs_waystation_greaves`, `heavy_body_glacial_bulwark_plate`, `heavy_head_glacial_warhelm`,
`light_legs_frosthold_ward_leggings`, `medium_feet_waystation_boots`,
`heavy_legs_glacial_greatplate_legguards`), 5 consumables (`crystal_eclass_1`, `crystal_eclass_2`,
`sphere_eclass_1`, `sphere_eclass_2`, `stone_energy_frosthold`), 1 quest material
(`quest_ukai_deep_rune`), 3 unique items (`light_body_frostwalkers_shroud`, `rod_deeplings_core`,
`hth_deep_dwellers_claw`), and 4 techs (`tech_firebolt_6`, `tech_mend_wounds_6`, `tech_cleave_6`,
`tech_impale_6`).

Generated with the same hand-rolled per-id-hash placeholder approach as Bands A/B above
(deterministic fill/accent colors + one of 5 patterns — border ring, diagonal stripes, checker
quadrants, cross, or concentric ring — plus a small corner mark); the PNG container itself is built
with Node's `zlib.deflateSync`/manual chunk+CRC32 writer, guaranteeing a structurally valid stream.
All 35 were verified programmatically as valid 32x32 RGBA PNGs and byte-hash-distinct from every
other icon in `assets/icons/` (304 files total, zero duplicate hashes) — not just against each
other. The lead's real-DCSS-tile pass at the end of the Level-Arc work should replace these 35
placeholders the same way the P5 pass replaced the v1.2 ones and Bands A/B's are slated to be
replaced.

## Level-Arc Band D icons — procedural placeholders (pending the lead's real-tile pass)

The 35 new ids introduced by Level-Arc Band D (Estari Ruins Deep, levels 71-80 —
`docs/SPEC-ARC-BANDS.md`) use hand-generated procedural placeholder tiles, not real Dungeon Crawl
art: 7 new monsters (`estari_sublevel_warden`, `estari_anima_conduit`, `anima_scarred_excavator`,
`estari_wellspring_warden`, `raw_anima_horror`, `estari_ruin_vanguard`, `estari_warden_prime`),
6 weapons/shield (`sword_estari_wardblade`, `polearm_estari_warpike`, `knife_estari_shard_fang`,
`rod_wellspring_conduit`, `hth_warden_gauntlets`, `shield_estari_bulwark`), 9 armor pieces
(`light_body_wellspring_veil`, `light_head_wellspring_hood`, `medium_body_estari_brigandine`,
`medium_legs_estari_greaves`, `heavy_body_warden_plate`, `heavy_head_warden_helm`,
`light_legs_wellspring_leggings`, `medium_feet_estari_boots`, `heavy_legs_warden_legguards`),
5 consumables (`crystal_fclass_1`, `crystal_fclass_2`, `sphere_fclass_1`, `sphere_fclass_2`,
`stone_energy_wellspring`), 1 quest material (`quest_anima_taint_sample`), 3 unique items
(`light_body_estari_anima_shroud`, `rod_wellspring_heartcore`, `sword_warden_primes_relic`), and
4 techs (`tech_firebolt_7`, `tech_mend_wounds_7`, `tech_cleave_7`, `tech_impale_7`).

Generated with the same hand-rolled per-id-hash placeholder approach as Bands A/B/C above
(deterministic fill/accent colors + one of 5 patterns — border ring, diagonal stripes, checker
quadrants, cross, or concentric ring — plus a small corner mark); the PNG container itself is built
with Node's `zlib.deflateSync`/manual chunk+CRC32 writer, guaranteeing a structurally valid stream.
All 35 were verified programmatically as valid 32x32 RGBA PNGs and byte-hash-distinct from every
other icon in `assets/icons/` (339 files total, zero duplicate hashes) — not just against each
other. The lead's real-DCSS-tile pass at the end of the Level-Arc work should replace these 35
placeholders the same way the P5 pass replaced the v1.2 ones and Bands A/B/C's are slated to be
replaced.

## Level-Arc Band E icons — procedural placeholders (pending the lead's real-tile pass)

The 35 new ids introduced by Level-Arc Band E (Ascent to the Skyspire, levels 81-90 —
`docs/SPEC-ARC-BANDS.md`) use hand-generated procedural placeholder tiles, not real Dungeon Crawl
art: 7 new monsters (`skyspire_lower_warden`, `society_remnant_battlemage`, `anima_horror_stalker`,
`skyspire_upper_sentinel`, `society_arcanist_prime`, `anima_horror_ravager`,
`society_anima_horror`), 6 weapons/shield (`sword_spireward_blade`, `polearm_skyspire_halberd`,
`knife_society_renegade_dirk`, `rod_anima_channeling_rod`, `hth_spireguard_gauntlets`,
`shield_spireward_aegis`), 9 armor pieces (`light_body_skysilk_shroud`, `light_head_skysilk_hood`,
`medium_body_spireguard_brigandine`, `medium_legs_spireguard_greaves`, `heavy_body_spireward_plate`,
`heavy_head_spireward_helm`, `light_legs_stormline_leggings`, `medium_feet_stormline_boots`,
`heavy_legs_stormline_legguards`), 5 consumables (`crystal_gclass_1`, `crystal_gclass_2`,
`sphere_gclass_1`, `sphere_gclass_2`, `stone_energy_skyspire`), 1 quest material
(`quest_society_cipher_page`), 3 unique items (`light_body_anima_scoured_wraps`,
`rod_anima_horrors_core`, `sword_anima_horrors_edge`), and 4 techs (`tech_firebolt_8`,
`tech_mend_wounds_8`, `tech_cleave_8`, `tech_impale_8`).

Generated with the same hand-rolled per-id-hash placeholder approach as Bands A/B/C/D above
(deterministic fill/accent colors + one of 5 patterns — border ring, diagonal stripes, checker
quadrants, cross, or concentric ring — plus a small corner mark); the PNG container itself is built
with Node's `zlib.deflateSync`/manual chunk+CRC32 writer, guaranteeing a structurally valid stream.
All 35 were verified programmatically as valid 32x32 RGBA PNGs and byte-hash-distinct from every
other icon in `assets/icons/` (374 files total, zero duplicate hashes) — not just against each
other. The lead's real-DCSS-tile pass at the end of the Level-Arc work should replace these 35
placeholders the same way the P5 pass replaced the v1.2 ones and Bands A/B/C/D's are slated to be
replaced.

## Level-Arc Band F icons — procedural placeholders (pending the lead's real-tile pass)

The 35 new ids introduced by Level-Arc Band F (The Red Moon / Eidas's Sanctum, levels 91-100 —
`docs/SPEC-ARC-BANDS.md`, THE ARC FINALE) use hand-generated procedural placeholder tiles, not real
Dungeon Crawl art: 7 new monsters (`moonbridge_ward_sentinel`, `divine_race_initiate`,
`moon_anima_stalker`, `sanctum_ward_colossus`, `divine_race_exemplar`, `moon_anima_devourer`,
`eidas_ascendant` — the arc's final boss), 6 weapons/shield (`sword_redmoon_blade`,
`polearm_moonbridge_halberd`, `knife_sanctum_fang`, `rod_lunar_conduit`, `hth_sanctum_gauntlets`,
`shield_redmoon_aegis`), 9 armor pieces (`light_body_moonveil_shroud`, `light_head_moonveil_hood`,
`medium_body_sanctum_brigandine`, `medium_legs_sanctum_greaves`, `heavy_body_redmoon_plate`,
`heavy_head_redmoon_helm`, `light_legs_moonveil_leggings`, `medium_feet_sanctum_boots`,
`heavy_legs_redmoon_legguards`), 5 consumables (`crystal_hclass_1`, `crystal_hclass_2`,
`sphere_hclass_1`, `sphere_hclass_2`, `stone_energy_moonbridge`), 1 quest material
(`quest_eidas_sigil_shard`), 3 unique items (`light_body_voidmoon_wraps`, `rod_devourers_core`,
`sword_ascendants_judgment` — the arc's final capstone drop), and 4 techs (`tech_firebolt_9`,
`tech_mend_wounds_9`, `tech_cleave_9`, `tech_impale_9`).

Generated with the same hand-rolled per-id-hash placeholder approach as Bands A/B/C/D/E above
(deterministic fill/accent colors + one of 5 patterns — border ring, diagonal stripes, checker
quadrants, cross, or concentric ring — plus a small corner mark); the PNG container itself is built
with Node's `zlib.deflateSync`/manual chunk+CRC32 writer, guaranteeing a structurally valid stream.
All 35 were verified programmatically as valid 32x32 RGBA PNGs and byte-hash-distinct from every
other icon in `assets/icons/` (409 files total, zero duplicate hashes) — not just against each
other. The lead's real-DCSS-tile pass at the end of the Level-Arc work should replace these 35
placeholders the same way the P5 pass replaced the v1.2 ones and Bands A/B/C/D/E's are slated to
be replaced.

## Level-Arc real-icon pass — SUPERSEDES all six band placeholder sections above

**All 210 Level-Arc band ids (Bands A–F) now use real art**, replacing the procedural placeholders
documented in the six sections above (those notes are historical). Sourced by the lead's pass
(`test_icons.js` requires presence for all icons and byte-distinctness only among monsters, so
items/techs may reuse tiles):
- **Monsters (42)** — real Dungeon Crawl tiles from the upstream repo (`mon/{humanoids,undead,
  animals,nonliving,statues}/…` at https://github.com/crawl/crawl), each mapped by theme and
  verified mutually byte-distinct (length + first-64-byte check, per `test_icons.js` Test 2).
- **Weapons** — swords/polearms/knives from `item/weapon/…`; rods from `item/staff/i-staff_*`;
  hand-to-hand from `item/armour/glove*`.
- **Armor bodies** from `item/armour/{robe,leather,ring/scale/chain_mail,plate,…}`; **feet** from
  `item/armour/boots*`. **Heads, legs, and shields** — DCSS has no separate tiles for those slots,
  so each reuses an existing real repo icon of the same slot/weight (e.g. `heavy_head_great_helm`,
  `medium_legs_banded_greaves`, `shield_ironbound_kite`) — allowed since only monsters need
  distinctness.
- **Crystals** from `item/gem/*_found_whole`; **spheres** from `item/misc/orb_of_zot*` +
  `item/potion/*`; **stones** from `item/misc` + `item/wand/gem_*`; **quest items** from `item/misc`.
- **Techs (24)** from `gui/spells/…` by chain theme (firebolt→fire, cleave→physical/earth,
  impale→earth/air/conjuration, mend_wounds→light/restoration).
All CC0 / public domain. Every tile verified a valid 32×32 PNG. Mapping script (not committed):
scratchpad `real_icons_arc.js`.

## v1.4 icons — AP-exclusive items (AA exchange, docs/SPEC-V1.4-GAMEPLAY.md G1)

Pulled by the lead from the DCSS repo (same CC0 source/pipeline as the v1.2/v1.3 passes),
verified 32x32 PNGs and byte-hash-distinct from every existing icon:

| game id | rltiles source |
|---|---|
| ap_boots_steel_plated | item/armour/boots_ego2 |
| ap_boots_gold_plated | item/armour/april_boots2 |
| ap_helm_gilded_crest | item/armour/headgear/helmet_art1 |
| ap_body_tourney_regalia | item/armour/golden_dragon_armour_art |
| ap_blade_veterans_edge | item/weapon/blessed_blade |
| ap_stone_energy_royal | item/misc/misc_crystal |
| ap_sphere_royal | item/potion/i-magic |

## v1.4 icons — provisions (foraging & provisions, docs/SPEC-V1.4-GAMEPLAY.md G4/G4b)

Same CC0 source/pipeline; verified PNGs, byte-hash-distinct:

| game id | rltiles source |
|---|---|
| provision_trail_rations | item/food/bread_ration |
| provision_honeyed_mead | item/food/honeycomb |
| provision_spice_tea | item/potion/orange |
| provision_foragers_bundle | item/food/fruit |
