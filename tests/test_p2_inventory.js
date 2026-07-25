var vm = require('vm');
var fs = require('fs');
var path = require('path');
var FakeDom = require('./fakedom.js');

var base = "D:/Claude - collection folder/HeroRPG/js";

function freshDom() {
  var document = new FakeDom.FakeDocument();
  var maincontent = document.createElement('div');
  document.registerId('maincontent', maincontent);
  var navlist = document.createElement('ul');
  document.registerId('navlist', navlist);
  var statusbars = document.createElement('div');
  statusbars.style = {};
  document.registerId('statusbars', statusbars);
  var savepanel = document.createElement('div');
  document.registerId('savepanel', savepanel);
  document.body = document.createElement('body');
  return document;
}

var localStorageStore = {};
var document = freshDom();

global.document = document;
global.window = {
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(localStorageStore, k) ? localStorageStore[k] : null; },
    setItem: function (k, v) { localStorageStore[k] = String(v); },
    removeItem: function (k) { delete localStorageStore[k]; }
  },
  btoa: function (str) { return Buffer.from(str, 'binary').toString('base64'); },
  atob: function (str) { return Buffer.from(str, 'base64').toString('binary'); }
};
global.window.document = document;
global.console = console;

var lastAlert = null;
global.alert = function (m) { lastAlert = m; console.log('[alert]', m); };

var lastConfirm = true;
global.confirm = function (m) { console.log('[confirm]', m); return lastConfirm; };
global.window.confirm = global.confirm;
global.window.prompt = function () { return null; };

function loadScript(relPath) {
  var code = fs.readFileSync(path.join(base, relPath), 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

loadScript('balance.js');
loadScript('data/items.js');
loadScript('data/classes.js');
loadScript('data/statinfo.js');
loadScript('core/character.js');
loadScript('core/inventory.js');
loadScript('core/save.js');
loadScript('core/classes.js');
loadScript('ui/icons.js');
loadScript('ui/screens.js');
loadScript('ui/dragdrop.js');
loadScript('ui/infobox.js');
loadScript('debug.js');

var Game = global.window.Game;

Game.state = { character: null };
Game.persist = function () { Game.Save.save(Game.state); };
Game.refreshCurrentScreen = function () { Game.Screens.navigate(Game.Screens.getCurrentScreen()); };
Game.renderNav = function () {};
Game.renderStatusBars = function () {};
Game.renderActions = function () {};

var failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error('FAIL: ' + msg);
  } else {
    console.log('PASS: ' + msg);
  }
}

// ================= Test 1: starter kit + damage on equip =================
console.log('\n=== Test 1: starter kit granted; equip changes Damage ===');
var skillPoints = {};
BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
skillPoints['Swords'] = 3;
skillPoints['Heavy Armor'] = 2;

var c1 = Game.Character.create({ race: 'Human', name: 'Testerio', gender: 'Male', skillPoints: skillPoints });

assert(Array.isArray(c1.inventory), 'character has inventory array');
assert(c1.equipment && typeof c1.equipment === 'object', 'character has equipment object');
assert(c1.equipment.weapon === 'sword_rusty_shortblade', 'highest creation skill (Swords) grants Rusty Shortblade, got ' + c1.equipment.weapon);
assert(c1.equipment.body === 'light_body_traveler_tunic', 'starter Light Body armor equipped, got ' + c1.equipment.body);
assert(c1.inventory.indexOf('potion_minor_healing') !== -1, 'has at least one starter healing potion in inventory');
var potionCount = c1.inventory.filter(function (id) { return id === 'potion_minor_healing'; }).length;
assert(potionCount === 2, 'has exactly 2 starter healing potions, got ' + potionCount);
assert(c1.inventory.indexOf('tent_ragged_bedroll') !== -1, 'has starter tent in inventory');

var dmgWithWeapon = Game.Character.getDamage(c1);
console.log('Damage with starter weapon equipped: ' + dmgWithWeapon);

var unresult = Game.Inventory.unequip(c1, 'weapon');
assert(unresult.ok, 'starter weapon can be unequipped (not cursed)');
var dmgWithoutWeapon = Game.Character.getDamage(c1);
console.log('Damage with no weapon: ' + dmgWithoutWeapon);
assert(dmgWithWeapon > dmgWithoutWeapon, 'equipping the weapon increases Damage (' + dmgWithWeapon + ' > ' + dmgWithoutWeapon + ')');

// re-equip and confirm Status-visible getDamage matches again
var reequip = Game.Inventory.equip(c1, 'sword_rusty_shortblade');
assert(reequip.ok, 're-equip of starter sword succeeds');
assert(Game.Character.getDamage(c1) === dmgWithWeapon, 'Damage restored after re-equip');

// ================= Test 1b: v1.4 P2 (G1) — Advantage Points, current-version round-trip =================
console.log('\n=== Test 1b: character.ap defaults to 0, and a current-version save/load round-trip keeps it ===');
assert(c1.ap === 0, 'fresh character starts with ap: 0');
c1.ap = 742;
Game.state.character = c1;
Game.persist();
var reloadedAp = Game.Save.load();
assert(reloadedAp !== null, 'current-version save reloads');
assert(reloadedAp.character.ap === 742, 'a current-version round-trip keeps character.ap, got ' + reloadedAp.character.ap);

// ================= Test 2: v1 save migration =================
console.log('\n=== Test 2: hand-crafted v1 save migrates cleanly ===');
var v1Character = {
  race: 'Arkan', name: 'OldTimer', gender: 'Female',
  strength: 6, vitality: 7, dexterity: 5, intelligence: 9, endurance: 5,
  hitPointsMax: 60, hitPoints: 60, energyMax: 100, energy: 100,
  level: 3, xp: 120, statPoints: 2, trainingPoints: 1,
  gold: 40, platinum: 0, animaShards: 5,
  monsterKills: 4, deaths: 1,
  skills: (function () {
    var t = {};
    BALANCE.SKILLS.forEach(function (s) { t[s] = { level: 0, xp: 0 }; });
    t['Rods'].level = 2;
    return t;
  })(),
  weaponDamageBonus: 0
  // NOTE: no `inventory` / `equipment` fields — this is what a real Phase 1 save looked like.
};
var v1Payload = { version: 1, state: { character: v1Character } };
localStorageStore['herorpg_save'] = JSON.stringify(v1Payload);

var loaded = Game.Save.load();
assert(loaded !== null, 'v1 save loads without error');
assert(loaded.character.name === 'OldTimer', 'migrated character identity intact (name)');
assert(loaded.character.level === 3, 'migrated character identity intact (level)');
assert(loaded.character.skills['Rods'].level === 2, 'migrated character identity intact (skill level)');
assert(Array.isArray(loaded.character.inventory) && loaded.character.inventory.length === 0, 'migration adds empty inventory array');
assert(loaded.character.equipment && loaded.character.equipment.weapon === null, 'migration adds empty equipment slots');

// Confirm re-saving now stamps the current version (2 at Phase 2; 3 since Phase 3; 4 since
// Phase 4; 5 since Phase 5; 6 since Phase 6a classes)
Game.state = loaded;
Game.persist();
var resaved = JSON.parse(localStorageStore['herorpg_save']);
assert(resaved.version === 11, 'resaved payload is stamped CURRENT_VERSION 11 (v1.9 companion migration), got ' + resaved.version);

assert(loaded.character.ap === 0, 'v1 save migration adds ap:0 (v9->v10 step), got ' + loaded.character.ap);
assert(loaded.character.companion === null, 'v1 save migration adds companion:null (v10->v11 step, full v1->v11 chain), got ' + JSON.stringify(loaded.character.companion));

// =================== Test 2b: v10 -> v11 migration adds companion:null ===================
console.log('\n=== Test 2b: a hand-crafted v10 save (no `companion` field) migrates to v11 with companion:null ===');
var v10Character = JSON.parse(JSON.stringify(v1Character));
v10Character.inventory = []; v10Character.equipment = { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null };
v10Character.techs = []; v10Character.techSets = [
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null]
];
v10Character.fury = 0;
v10Character.currentLocation = 'eldor';
v10Character.vault = { platinum: 0, gold: 0, items: [] };
v10Character.shrineBuffs = [];
v10Character.quests = {};
v10Character.classes = {}; v10Character.primaryClass = null; v10Character.secondaryClass = null; v10Character.legendaryUnlocked = false;
v10Character.afflictions = [];
v10Character.ap = 5;
// NOTE: no `companion` field at all — a real v10 (pre-v1.9) save.
localStorageStore['herorpg_save'] = JSON.stringify({ version: 10, state: { character: v10Character } });
var loadedV10 = Game.Save.load();
assert(loadedV10 !== null, 'v10 save loads without error');
assert(loadedV10.character.ap === 5, 'migrated v10 character identity intact (ap)');
assert(loadedV10.character.companion === null, 'v10->v11 migration adds companion:null, got ' + JSON.stringify(loadedV10.character.companion));
Game.state = loadedV10;
Game.persist();
var resavedV10 = JSON.parse(localStorageStore['herorpg_save']);
assert(resavedV10.version === 11, 'v10->v11 resave stamps CURRENT_VERSION 11, got ' + resavedV10.version);

// ================= Test 3: level/stat requirement gating =================

console.log('\n=== Test 3: equip blocked with red reqs when unmet; cursed item traps ===');
var c3 = Game.Character.create({ race: 'Human', name: 'Newbie', gender: 'Male', skillPoints: skillPoints });
// Give a level-10 item the level-1 character cannot use.
Game.Inventory.addItem(c3, 'sword_arkan_runeblade');
var reqCheck = Game.Inventory.canUse(c3, Game.Inventory.getItem('sword_arkan_runeblade'));
assert(!reqCheck.ok, 'canUse reports failure for level-10 item on level-1 char');
assert(reqCheck.failures.length > 0, 'failures array populated: ' + JSON.stringify(reqCheck.failures));

var blockedEquip = Game.Inventory.equip(c3, 'sword_arkan_runeblade');
assert(!blockedEquip.ok, 'equip() itself refuses the item due to unmet level/stat reqs');
assert(c3.equipment.weapon !== 'sword_arkan_runeblade', 'item did not get equipped');

// Cursed item: equips fine, but cannot be unequipped.
Game.Inventory.addItem(c3, 'ring_of_the_hollow_king');
var cursedEquip = Game.Inventory.equip(c3, 'ring_of_the_hollow_king');
assert(cursedEquip.ok, 'cursed item equips normally');
assert(c3.equipment.head === 'ring_of_the_hollow_king', 'cursed ring occupies head slot');
var cursedUnequip = Game.Inventory.unequip(c3, 'head');
assert(!cursedUnequip.ok, 'cursed item refuses to unequip');
assert(/cursed/i.test(cursedUnequip.message) && /Spirit Shrine/i.test(cursedUnequip.message), 'cursed message matches Cursed.md phrasing: "' + cursedUnequip.message + '"');
assert(c3.equipment.head === 'ring_of_the_hollow_king', 'cursed ring remains equipped after failed unequip');

// ================= Test 4: weight/encumbrance =================
console.log('\n=== Test 4: weight readout + over-capacity add fails ===');
var c4 = Game.Character.create({ race: 'Human', name: 'PackMule', gender: 'Female', skillPoints: skillPoints });
c4.strength = 1; // force a small capacity to make the cap reachable
var capBefore = Game.Inventory.carryCapacity(c4);
console.log('Capacity forced to: ' + capBefore);
var weightBefore = Game.Inventory.currentWeight(c4);
console.log('Weight before extra adds: ' + weightBefore);

// v1.6 P1 (CB-6, SPEC-V1.6-REBALANCE.md §6): capacity now carries a flat base term
// (BALANCE.CARRY_CAPACITY_BASE), so a single or even a couple of heavy adds no longer overflows a
// forced-tiny-STR capacity the way a bare strength*10 used to. Add heavy plate pieces (weight 9
// each — addItem doesn't slot-check at add time, so duplicates are allowed) until one is refused,
// then confirm that refusal left the weight untouched — behavior-driven, not tied to the exact
// capacity number.
var addedCount = 0;
var lastAddResult = true;
while (lastAddResult) {
  lastAddResult = Game.Inventory.addItem(c4, 'heavy_legs_warplate_legguards'); // weight 9
  if (lastAddResult) addedCount++;
}
var weightAfterFailure = Game.Inventory.currentWeight(c4);
console.log('Heavy pieces added before overflow: ' + addedCount + ', weight after failed add attempt: ' + weightAfterFailure);
assert(lastAddResult === false, 'addItem returns false when addition would exceed capacity');
assert(weightAfterFailure === weightBefore + addedCount * 9, 'weight unchanged after rejected add (matches the successful adds only)');
assert(weightAfterFailure + 9 > capBefore, 'sanity: the rejected add really would have exceeded capacity');

// Confirm the live status-bar weight formula matches Game.Inventory directly.
assert(Game.Inventory.currentWeight(c4) === weightAfterFailure, 'currentWeight is stable/idempotent');

// ================= Test 5: discard with confirm + equip swap =================
console.log('\n=== Test 5: discard removes after confirm; equip swap returns previous item ===');
var c5 = Game.Character.create({ race: 'Human', name: 'Swapper', gender: 'Male', skillPoints: skillPoints });
var startingWeapon = c5.equipment.weapon;
assert(startingWeapon === 'sword_rusty_shortblade', 'sanity: starter weapon as expected');

// Give a second, higher-level sword and equip it -> should swap old one back to inventory.
Game.Inventory.addItem(c5, 'sword_soldiers_blade');
c5.level = 5; c5.strength = 12; // meet its reqs
var swapResult = Game.Inventory.equip(c5, 'sword_soldiers_blade');
assert(swapResult.ok, 'second weapon equips successfully');
assert(c5.equipment.weapon === 'sword_soldiers_blade', 'new weapon now equipped');
assert(c5.inventory.indexOf(startingWeapon) !== -1, 'previous weapon returned to inventory after swap');

// Discard flow (confirm = true)
lastConfirm = true;
var invCountBefore = c5.inventory.length;
var discardOk = Game.Inventory.discard(c5, startingWeapon);
assert(discardOk, 'discard() removes item from inventory');
assert(c5.inventory.indexOf(startingWeapon) === -1, 'discarded item no longer present');
assert(c5.inventory.length === invCountBefore - 1, 'inventory length decremented by exactly one');

// Discard should refuse to touch equipped items (only inventory items).
var discardEquipped = Game.Inventory.discard(c5, 'sword_soldiers_blade');
assert(discardEquipped === false, 'discard() refuses to discard a currently-equipped item');

// ================= Test 6: full screen render smoke test (no console errors) =================
console.log('\n=== Test 6: render Inventory + Status screens without throwing ===');
Game.state.character = c5;
try {
  Game.Screens.navigate('inventory');
  console.log('PASS: inventory screen rendered without throwing');
} catch (e) {
  failures++;
  console.error('FAIL: inventory screen threw: ' + e.stack);
}
try {
  Game.Screens.navigate('status');
  console.log('PASS: status screen rendered without throwing');
} catch (e) {
  failures++;
  console.error('FAIL: status screen threw: ' + e.stack);
}

// Item info window smoke test
try {
  Game.Infobox.open(Game.Inventory.getItem('sword_soldiers_blade'), c5);
  Game.Infobox.close();
  console.log('PASS: infobox open/close did not throw');
} catch (e) {
  failures++;
  console.error('FAIL: infobox threw: ' + e.stack);
}

// ================= Test 7: debug.js giveItem / listItems =================
console.log('\n=== Test 7: debug helpers ===');
Game.state.character = c1;
var beforeLen = c1.inventory.length;
Game._debug.giveItem('potion_healing');
assert(c1.inventory.indexOf('potion_healing') !== -1, 'giveItem adds a valid item id');
Game._debug.giveItem('not_a_real_item');
console.log('(expected warning above for invalid id)');

var listOutput = [];
var origLog = console.log;
console.log = function (m) { listOutput.push(m); origLog(m); };
Game._debug.listItems();
console.log = origLog;
assert(listOutput.some(function (l) { return String(l).indexOf('Total items:') === 0; }), 'listItems prints a total count line');

// ================= Test 8: v1.6 P1 (CB-6) — carry capacity = BASE + STR*PER_STR =================
console.log('\n=== Test 8: v1.6 P1 carry capacity formula (CB-6, SPEC-V1.6-REBALANCE.md §6) ===');
var strengthBackup8 = c1.strength;
c1.strength = 10;
var expectedCap10 = BALANCE.CARRY_CAPACITY_BASE + 10 * BALANCE.CARRY_CAPACITY_PER_STR;
assert(Game.Inventory.carryCapacity(c1) === expectedCap10,
  'carryCapacity(STR=10) = CARRY_CAPACITY_BASE + 10*CARRY_CAPACITY_PER_STR = ' + expectedCap10 + ', got ' + Game.Inventory.carryCapacity(c1));
c1.strength = 0;
assert(Game.Inventory.carryCapacity(c1) === BALANCE.CARRY_CAPACITY_BASE,
  'zero Strength still gets the flat base capacity (no longer zero, CB-6), got ' + Game.Inventory.carryCapacity(c1));
c1.strength = 25;
var expectedCap25 = BALANCE.CARRY_CAPACITY_BASE + 25 * BALANCE.CARRY_CAPACITY_PER_STR;
assert(Game.Inventory.carryCapacity(c1) === expectedCap25,
  'carryCapacity(STR=25) = CARRY_CAPACITY_BASE + 25*CARRY_CAPACITY_PER_STR = ' + expectedCap25 + ', got ' + Game.Inventory.carryCapacity(c1));
c1.strength = strengthBackup8;

// ================= Summary =================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
