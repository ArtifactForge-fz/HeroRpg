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
