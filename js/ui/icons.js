// HeroRPG remake — shared icon helper (Phase 8: pixel-art icons, layout, Actions panel, Hunt).
// Icons are individual Dungeon Crawl Stone Soup 32x32 tiles (CC0/public domain; see
// assets/CREDITS.md) copied to assets/icons/<gameId>.png — filename == the item/monster/tech id
// already used throughout js/data/*.js, so NO data-file changes were needed to wire this up.
//
// Game.UI.icon(id, size) returns an <img> (class icon32 by default, icon64 if size===64) whose
// onerror hides the element — so a missing/unmapped id degrades gracefully instead of showing a
// broken-image glyph.

var Game = window.Game || {};

Game.UI = Game.UI || {};

Game.UI.icon = function (id, size) {
  var img = document.createElement('img');
  img.className = size === 64 ? 'icon64' : 'icon32';
  img.src = 'assets/icons/' + id + '.png';
  img.alt = '';
  img.onerror = function () { img.style.display = 'none'; };
  return img;
};

window.Game = Game;
