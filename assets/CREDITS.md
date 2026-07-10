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
