// Phase 8 exit test — icon integrity sweep. Every item in js/data/items.js, every monster in
// js/data/monsters.js, and every player-usable tech in js/data/techs.js (monsterOnly techs are
// optional per the phase brief) must have a matching assets/icons/<gameId>.png file. Also checks
// that the Dungeon Crawl tileset credit file exists (assets/CREDITS.md) and that Game.UI.icon()
// builds the expected <img> shape.

var vm = require('vm');
var fs = require('fs');
var path = require('path');

var root = "D:/Claude - collection folder/HeroRPG";
var base = root + "/js";
var iconsDir = root + "/assets/icons";

function loadScript(relPath) {
  var code = fs.readFileSync(path.join(base, relPath), 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

global.window = {};
loadScript('balance.js');
loadScript('data/items.js');
loadScript('data/monsters.js');
loadScript('data/techs.js');

var Game = global.window.Game;

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

function hasIcon(id) {
  return fs.existsSync(path.join(iconsDir, id + '.png'));
}

// =================== Test 1: every item has an icon ===================
console.log('\n=== Test 1: every item in items.js has assets/icons/<id>.png ===');
var missingItems = [];
Game.Data.items.forEach(function (item) {
  if (!hasIcon(item.id)) missingItems.push(item.id);
});
assert(missingItems.length === 0, 'all ' + Game.Data.items.length + ' items have icons' + (missingItems.length ? (': missing ' + missingItems.join(', ')) : ''));

// =================== Test 2: every monster has an icon ===================
console.log('\n=== Test 2: every monster in monsters.js has assets/icons/<id>.png ===');
var missingMonsters = [];
Game.Data.monsters.forEach(function (m) {
  if (!hasIcon(m.id)) missingMonsters.push(m.id);
});
assert(missingMonsters.length === 0, 'all ' + Game.Data.monsters.length + ' monsters have icons' + (missingMonsters.length ? (': missing ' + missingMonsters.join(', ')) : ''));
// distinct-tile spot check: no two monsters may share a tile (phase brief: "Distinct enemies
// should get distinct tiles (no two monsters sharing one tile)").
var seenMonsterHashes = {};
var dupedMonsters = [];
Game.Data.monsters.forEach(function (m) {
  var file = path.join(iconsDir, m.id + '.png');
  if (!fs.existsSync(file)) return;
  var bytes = fs.readFileSync(file);
  var hash = bytes.length + ':' + bytes.slice(0, 64).toString('hex');
  if (seenMonsterHashes[hash]) dupedMonsters.push(m.id + ' == ' + seenMonsterHashes[hash]);
  else seenMonsterHashes[hash] = m.id;
});
assert(dupedMonsters.length === 0, 'no two monsters share an identical icon file' + (dupedMonsters.length ? (': ' + dupedMonsters.join(', ')) : ''));

// =================== Test 3: every player-usable tech has an icon (monsterOnly optional) ===================
console.log('\n=== Test 3: every player-usable tech in techs.js has assets/icons/<id>.png ===');
var playerTechs = Game.Data.techs.filter(function (t) { return !t.monsterOnly; });
var missingTechs = [];
playerTechs.forEach(function (t) {
  if (!hasIcon(t.id)) missingTechs.push(t.id);
});
assert(missingTechs.length === 0, 'all ' + playerTechs.length + ' player-usable techs (incl. classOnly) have icons' + (missingTechs.length ? (': missing ' + missingTechs.join(', ')) : ''));
assert(playerTechs.some(function (t) { return t.classOnly; }), 'sanity: at least one classOnly tech exists and was checked');

// =================== Test 4: credits file exists ===================
console.log('\n=== Test 4: assets/CREDITS.md exists ===');
assert(fs.existsSync(path.join(root, 'assets/CREDITS.md')), 'assets/CREDITS.md exists');

// =================== Test 5: Game.UI.icon() shape ===================
console.log('\n=== Test 5: Game.UI.icon(id, size) returns the expected <img> shape ===');
var created = [];
global.document = {
  createElement: function (tag) {
    var node = { tagName: tag, className: '', src: '', alt: '', onerror: null, style: {} };
    created.push(node);
    return node;
  }
};
loadScript('ui/icons.js');
var img32 = Game.UI.icon('sword_rusty_shortblade', 32);
assert(img32.className === 'icon32', 'icon(id) with no/other size defaults to icon32 class: got ' + img32.className);
assert(img32.src === 'assets/icons/sword_rusty_shortblade.png', 'icon src points at assets/icons/<id>.png: got ' + img32.src);
assert(typeof img32.onerror === 'function', 'icon has an onerror handler (graceful when a file is missing)');
img32.onerror(); // should not throw, and should hide the element
assert(img32.style.display === 'none', 'onerror hides the image element');

var img64 = Game.UI.icon('eidas_echo', 64);
assert(img64.className === 'icon64', 'icon(id, 64) uses the icon64 class: got ' + img64.className);

// =================== Summary ===================
console.log('\n===================================');
console.log(passes + ' passed, ' + failures + ' failed.');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
