// v1.8 P2 exit test — the "no dead items" guard, promoted from docs/AUDIT-ITEM-REACHABILITY.md
// into a standing suite (tools/check_reachability.js does the actual classification; this file
// re-runs it plus asserts the specific v1.8 fixes it was written to unblock).
// NEW FILE — does not touch any existing test_p*.js suite (a concurrent agent owns js/core/* on
// this shared checkout).

var vm = require('vm');
var fs = require('fs');
var path = require('path');

var repoRoot = path.resolve(__dirname, '..');
var base = path.join(repoRoot, 'js');

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
var items = Game.Data.items;
var areas = Game.Data.areas;
var monsters = Game.Data.monsters;
var recipes = Game.Data.recipes;

var failures = 0;
var passes = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error('FAIL: ' + msg);
  } else {
    passes++;
    console.log('PASS: ' + msg);
  }
}

function itemById(id) {
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) return items[i];
  }
  return null;
}

// =================== Test 1: the promoted audit itself — no dead items ===================
console.log('\n=== Test 1: tools/check_reachability.js classification — both lists empty ===');
var checker = require(path.join(repoRoot, 'tools', 'check_reachability.js'));
var result = checker.classify();
assert(result.obtainableButNoSink.length === 0,
  'no item is obtainable-but-sinkless' + (result.obtainableButNoSink.length ? (': ' + result.obtainableButNoSink.join(', ')) : ''));
assert(result.sinkButUnobtainable.length === 0,
  'no item has-a-sink-but-is-unobtainable' + (result.sinkButUnobtainable.length ? (': ' + result.sinkButUnobtainable.join(', ')) : ''));

// =================== Test 2: T1-a — all 8 offhand weapons are shop-purchasable ===================
console.log('\n=== Test 2: the offhand-weapon dual-wield ladder is stocked somewhere reachable at its levelReq ===');

function allShopStockIds() {
  var ids = {};
  areas.forEach(function (a) {
    (a.facilities || []).forEach(function (f) {
      if (f.type !== 'shop' && f.type !== 'exchange') return;
      (f.stock || []).forEach(function (entry) {
        var id = (typeof entry === 'string') ? entry : entry.itemId;
        if (id) ids[id] = true;
      });
    });
  });
  return ids;
}
var shopStockIds = allShopStockIds();

var OFFHAND_LADDER = [
  { id: 'knife_offhand_twinfang', levelReq: 1 },
  { id: 'hth_offhand_cestus', levelReq: 1 },
  { id: 'knife_offhand_swiftfang', levelReq: 10 },
  { id: 'hth_offhand_ironknuckle', levelReq: 10 },
  { id: 'knife_offhand_nightedge', levelReq: 25 },
  { id: 'hth_offhand_stormfist', levelReq: 25 },
  { id: 'knife_offhand_kingsfang', levelReq: 35 },
  { id: 'hth_offhand_titangrip', levelReq: 35 }
];

OFFHAND_LADDER.forEach(function (rung) {
  var item = itemById(rung.id);
  assert(!!item, rung.id + ' is defined in items.js');
  assert(item && item.slot === 'offhand' && item.damage !== undefined,
    rung.id + ' is an offhand WEAPON (damage field, not a shield)');
  assert(item && item.levelReq === rung.levelReq, rung.id + ' has levelReq ' + rung.levelReq);
  assert(!!shopStockIds[rung.id], rung.id + ' is stocked in at least one shop/exchange');
});

// Each rung must be stocked in a town reachable at or before its own levelReq (never gated
// behind a town whose minLevel exceeds the item's own levelReq, or the item is a soft-lock).
OFFHAND_LADDER.forEach(function (rung) {
  var reachableTown = areas.some(function (a) {
    if (a.type !== 'town') return false;
    return (a.facilities || []).some(function (f) {
      if (f.type !== 'shop' && f.type !== 'exchange') return false;
      return (f.stock || []).some(function (entry) {
        var id = (typeof entry === 'string') ? entry : entry.itemId;
        return id === rung.id;
      }) && a.minLevel <= rung.levelReq;
    });
  });
  assert(reachableTown, rung.id + ' (levelReq ' + rung.levelReq + ') is stocked in a town reachable at or before that level');
});

// =================== Test 3: T1-b — the cursed circlet drops somewhere ===================
console.log('\n=== Test 3: ring_of_the_hollow_king (Circlet of the Hollow King) drops from at least one monster ===');
var ringItem = itemById('ring_of_the_hollow_king');
assert(!!ringItem, 'ring_of_the_hollow_king still exists (id unchanged)');
assert(ringItem && ringItem.name === 'Circlet of the Hollow King', 'renamed to Circlet of the Hollow King');
assert(ringItem && ringItem.tags && ringItem.tags.indexOf('cursed') !== -1, 'still cursed-tagged');
var ringDroppers = monsters.filter(function (m) {
  return (m.drops || []).some(function (d) { return d.itemId === 'ring_of_the_hollow_king'; });
});
assert(ringDroppers.length >= 2 && ringDroppers.length <= 3,
  'ring_of_the_hollow_king drops from 2-3 monsters, got ' + ringDroppers.length + ' (' + ringDroppers.map(function (m) { return m.id; }).join(', ') + ')');
ringDroppers.forEach(function (m) {
  assert(m.level >= 14 && m.level <= 32, m.id + ' (dropping the circlet) is in the mid-band (~15-30), got level ' + m.level);
  assert(!m.boss, m.id + ' (dropping the circlet) is a non-boss monster');
});

// =================== Test 4: D-C — the wardframe-shard recipe exists and resolves ===================
console.log('\n=== Test 4: the Wardframe Rune Shard recipe exists, consumes shards, outputs an existing item ===');
var shardRecipe = recipes.filter(function (r) { return (r.inputs || []).indexOf('quest_wardframe_rune_shard') !== -1; })[0];
assert(!!shardRecipe, 'a recipe consuming quest_wardframe_rune_shard exists');
if (shardRecipe) {
  var shardCount = shardRecipe.inputs.filter(function (i) { return i === 'quest_wardframe_rune_shard'; }).length;
  assert(shardCount === 2, 'recipe consumes 2x quest_wardframe_rune_shard, got ' + shardCount);
  assert(shardRecipe.output === 'crystal_pure_anima', 'recipe outputs the EXISTING crystal_pure_anima (no new item), got ' + shardRecipe.output);
  assert(!!itemById(shardRecipe.output), 'recipe output item resolves in items.js');
  shardRecipe.inputs.forEach(function (id) {
    assert(!!itemById(id), 'recipe input ' + id + ' resolves in items.js');
  });
}
// crystal_pure_anima carries no combat stats (energy-restore consumable only) — D-C's own
// no-sim-required condition.
var pureAnima = itemById('crystal_pure_anima');
assert(!!pureAnima && pureAnima.damage === undefined && pureAnima.armor === undefined && pureAnima.magicArmor === undefined,
  'crystal_pure_anima carries no combat stats (damage/armor/magicArmor all undefined)');

// =================== Test 5: D-A — the five trophies/lore items are sellable ===================
console.log('\n=== Test 5: the five trophy/lore items are sellable (D-A option b) ===');
var TROPHY_VALUES = {
  quest_matriarch_horn: 25,
  quest_eidas_echo_seal: 25,
  quest_frostram_hide: 10,
  lore_estari_shard_tablet: 15,
  lore_eidas_final_journal: 20
};
Object.keys(TROPHY_VALUES).forEach(function (id) {
  var item = itemById(id);
  assert(!!item, id + ' is defined in items.js');
  assert(item && item.value === TROPHY_VALUES[id], id + ' has sell value ' + TROPHY_VALUES[id] + ', got ' + (item && item.value));
  assert(item && (!item.tags || item.tags.indexOf('no-trade') === -1), id + ' no longer carries the no-trade tag');
});

console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED (' + passes + ' assertions)');
  process.exit(0);
} else {
  console.log(failures + ' TEST(S) FAILED (' + passes + ' passed)');
  process.exit(1);
}
