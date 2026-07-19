// HeroRPG — standing "no dead items" guard (v1.8 P2, promoted from docs/AUDIT-ITEM-REACHABILITY.md
// §1). Loads the real game data (same node-vm technique the balance sims and test suites use —
// js/balance.js FIRST, since monsters.js reads the BALANCE global, then js/data/{items,monsters,
// areas,quests,recipes,story,classes}.js in one context) and classifies every item on two axes:
//
//   obtainable  — a monster drop (monsters[].drops[].itemId, incl. lair/boss monsters — they are
//                 plain entries in the same monsters array), shop stock (facilities[].stock plain
//                 ids), AA-Exchange stock (facilities[].stock {itemId, costAp} objects — a common
//                 scan trap: missing this falsely flags all AP-shop stock unobtainable, audit §1),
//                 forage (areas[].forage), a quest reward (quests[].rewards.items), a quest
//                 hand-out (quests[].acceptItems), or a recipe output (recipes[].output).
//   has a sink  — equippable (a real equip slot, i.e. slot !== 'none'), consumable
//                 (combatUsable, OR energyRestore, OR the HP-restore field — items.js calls it
//                 `heal`, not `hpRestore`; the audit's prose used the conceptual name, this script
//                 uses the real field — OR id belongs to the potion_/crystal_/sphere_/stone_/
//                 tent_/provision_ family, the second scan trap: consumables like
//                 ap_stone_energy_royal only carry energyRestore, no generic `effect` field), a
//                 recipe INPUT (recipes[].inputs), a quest COLLECT-step target
//                 (quests[].steps[].kind === 'collect'), or sellable (value > 0 AND no 'no-trade'
//                 tag — a WEAK sink, resolves flavor trophies by design, per D-A option b).
//
// An item is dead if obtainable-but-no-sink (you can hold it, it does nothing) or
// sink-but-unobtainable (something needs it, but nothing grants it).
//
// Usage: node tools/check_reachability.js
// Exit 0 when both lists are empty (modulo ALLOWLIST below, which should be EMPTY after the v1.8
// P2 fixes — anything left in it must carry a justification comment).

var vm = require('vm');
var fs = require('fs');
var path = require('path');

var repoRoot = path.resolve(__dirname, '..');
var base = path.join(repoRoot, 'js');

// Minimal fake DOM/window — items/monsters/areas/quests/recipes/story/classes only read
// `window.Game`, they don't touch the DOM, but every data file opens with
// `var Game = window.Game || {};` so `window` must exist.
global.window = {};

function loadScript(relPath) {
  var code = fs.readFileSync(path.join(base, relPath), 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

loadScript('balance.js');
loadScript('data/items.js');
loadScript('data/monsters.js');
loadScript('data/areas.js');
loadScript('data/quests.js');
loadScript('data/recipes.js');
loadScript('data/story.js');
loadScript('data/classes.js');

var Game = global.window.Game;
var items = Game.Data.items || [];
var monsters = Game.Data.monsters || [];
var areas = Game.Data.areas || [];
var quests = Game.Data.quests || [];
var recipes = Game.Data.recipes || [];

// Explicit allowlist for items that are LEGITIMATELY exempt from one side of the check (must
// carry a justification). Empty after the v1.8 P2 fixes (T1-a offhand ladder, T1-b cursed
// circlet placement, D-C wardframe-shard recipe, D-A trophy sell values) — see
// docs/AUDIT-ITEM-REACHABILITY.md and docs/SPEC-V1.8-TECHS-AND-REACHABILITY.md §2/§3 P2.
var ALLOWLIST = [];

var CONSUMABLE_PREFIXES = ['potion_', 'crystal_', 'sphere_', 'stone_', 'tent_', 'provision_'];

function isConsumablePrefixFamily(id) {
  for (var i = 0; i < CONSUMABLE_PREFIXES.length; i++) {
    if (id.indexOf(CONSUMABLE_PREFIXES[i]) === 0) return true;
  }
  return false;
}

// ---------------- Obtainability ----------------

var obtainableIds = {};

monsters.forEach(function (m) {
  (m.drops || []).forEach(function (d) { obtainableIds[d.itemId] = true; });
});

areas.forEach(function (a) {
  (a.facilities || []).forEach(function (f) {
    (f.stock || []).forEach(function (entry) {
      // Scan trap 1 (audit §1): AA-Exchange stock is {itemId, costAp}, not a plain string.
      var id = (typeof entry === 'string') ? entry : entry.itemId;
      if (id) obtainableIds[id] = true;
    });
  });
  (a.forage || []).forEach(function (id) { obtainableIds[id] = true; });
});

quests.forEach(function (q) {
  if (q.rewards && q.rewards.items) {
    q.rewards.items.forEach(function (id) { obtainableIds[id] = true; });
  }
  (q.acceptItems || []).forEach(function (id) { obtainableIds[id] = true; });
});

recipes.forEach(function (r) {
  if (r.output) obtainableIds[r.output] = true;
});

// ---------------- Sinks ----------------

var recipeInputIds = {};
recipes.forEach(function (r) {
  (r.inputs || []).forEach(function (id) { recipeInputIds[id] = true; });
});

var questCollectIds = {};
quests.forEach(function (q) {
  (q.steps || []).forEach(function (s) {
    if (s.kind === 'collect' && s.itemId) questCollectIds[s.itemId] = true;
  });
});

function hasSink(item) {
  if (item.slot && item.slot !== 'none') return true; // equippable
  // Scan trap 2 (audit §1): consumability must check combatUsable/energyRestore/heal, not a
  // generic `effect` field — else energy stones like ap_stone_energy_royal (energyRestore only)
  // falsely read as dead.
  if (item.combatUsable) return true;
  if (item.energyRestore) return true;
  if (item.heal) return true;
  if (isConsumablePrefixFamily(item.id)) return true;
  if (recipeInputIds[item.id]) return true;
  if (questCollectIds[item.id]) return true;
  // Sellable — a WEAK sink, resolves flavor trophies by design (D-A option b).
  if (item.value > 0 && (!item.tags || item.tags.indexOf('no-trade') === -1)) return true;
  return false;
}

// ---------------- Classify ----------------

var obtainableButNoSink = [];
var sinkButUnobtainable = [];

items.forEach(function (item) {
  if (ALLOWLIST.indexOf(item.id) !== -1) return;
  var obtainable = !!obtainableIds[item.id];
  var sink = hasSink(item);
  if (obtainable && !sink) obtainableButNoSink.push(item.id);
  if (sink && !obtainable) sinkButUnobtainable.push(item.id);
});

// ---------------- Report ----------------

console.log('HeroRPG reachability check — ' + items.length + ' items scanned.');
console.log('');
console.log('=== Obtainable but NO sink (' + obtainableButNoSink.length + ') ===');
if (obtainableButNoSink.length === 0) {
  console.log('(none)');
} else {
  obtainableButNoSink.forEach(function (id) { console.log('  ' + id); });
}
console.log('');
console.log('=== Has a sink but UNOBTAINABLE (' + sinkButUnobtainable.length + ') ===');
if (sinkButUnobtainable.length === 0) {
  console.log('(none)');
} else {
  sinkButUnobtainable.forEach(function (id) { console.log('  ' + id); });
}

var ok = obtainableButNoSink.length === 0 && sinkButUnobtainable.length === 0;
console.log('');
console.log(ok ? 'PASS: no dead items.' : 'FAIL: dead items found.');

module.exports = {
  classify: function () {
    return { obtainableButNoSink: obtainableButNoSink, sinkButUnobtainable: sinkButUnobtainable };
  }
};

if (require.main === module) {
  process.exit(ok ? 0 : 1);
}
