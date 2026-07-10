// Phase 4 exit tests — world/towns (travel, camp, inn, shop, vault, academy, shrine, synthesis)
// driven through the fakedom shim. Randomness stubbed via Game.Battle._rng.

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

var lastAlert = null;
global.alert = function (m) { lastAlert = m; console.log('[alert]', m); };
global.window.alert = global.alert;
global.confirm = function () { return true; };
global.window.confirm = global.confirm;
global.window.prompt = function () { return null; };

function loadScript(relPath) {
  var code = fs.readFileSync(path.join(base, relPath), 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

loadScript('balance.js');
loadScript('data/items.js');
loadScript('data/monsters.js');
loadScript('data/techs.js');
loadScript('data/areas.js');
loadScript('data/shrine.js');
loadScript('data/recipes.js');
loadScript('data/classes.js');
loadScript('core/character.js');
loadScript('core/inventory.js');
loadScript('core/battle.js');
loadScript('core/world.js');
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

function setRng(fn) { Game.Battle._rng = fn; }
function fixedRng(v) { return function () { return v; }; }
function seqRng(values, fallback) {
  var i = 0;
  return function () { return i < values.length ? values[i++] : fallback; };
}

function makeCharacter(opts) {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  if (opts && opts.skills) {
    for (var k in opts.skills) skillPoints[k] = opts.skills[k];
  } else {
    skillPoints['Swords'] = 3;
    skillPoints['Light Armor'] = 2;
  }
  var c = Game.Character.create({
    race: (opts && opts.race) || 'Human',
    name: (opts && opts.name) || 'Tester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  Game.state.character = c;
  Game.state.battle = null;
  return c;
}

// =================== Test 0: data sanity ===================
console.log('\n=== Test 0: areas/monsters/items data sanity ===');
assert(Game.Data.areas.length === 11, '11 areas defined (6 pre-Phase-6b + Saratus + 4 new hunting areas), got ' + Game.Data.areas.length);
assert(Game.Data.monsters.length === 45, '45 monsters (14 pre-Phase-6b + 12 Phase 6b regular + 4 Phase 6b bosses + 15 enemy-variety-pass regulars), got ' + Game.Data.monsters.length);
var gares = Game.World.getArea('gares_riverbanks');
assert(gares && gares.monsters.length === 7, 'Gares Riverbanks lists 7 monsters (4 original + 3 enemy-variety-pass)');
gares.monsters.forEach(function (mid) {
  assert(!!Game.Battle.getMonsterDef(mid), 'Gares monster exists: ' + mid);
});
var badAreaRefs = [];
Game.Data.areas.forEach(function (a) {
  (a.monsters || []).forEach(function (mid) { if (!Game.Battle.getMonsterDef(mid)) badAreaRefs.push(a.id + ' -> ' + mid); });
  (a.facilities || []).forEach(function (f) {
    (f.stock || []).forEach(function (iid) { if (!Game.Inventory.getItem(iid)) badAreaRefs.push(a.id + ' shop -> ' + iid); });
  });
});
assert(badAreaRefs.length === 0, 'all area monster/shop refs resolve' + (badAreaRefs.length ? ': ' + badAreaRefs.join(', ') : ''));
var eldor = Game.World.getArea('eldor');
['shop', 'synthesis', 'inn', 'vault', 'academy', 'shrine'].forEach(function (t) {
  assert(!!Game.World.getFacility(eldor, t), 'Eldor has facility: ' + t);
});
var jumak = Game.World.getArea('jumak_village');
assert(!Game.World.getFacility(jumak, 'synthesis') && !Game.World.getFacility(jumak, 'shrine'), 'Ju`Mak lacks Synthesis/Shrine');
Game.Data.recipes.forEach(function (r) {
  assert(!!Game.Inventory.getItem(r.output), 'recipe output resolves: ' + r.output);
  r.inputs.forEach(function (iid) { assert(!!Game.Inventory.getItem(iid), 'recipe input resolves: ' + iid); });
});

// =================== Test 1: new character starts in Eldor ===================
console.log('\n=== Test 1: new character defaults ===');
var c1 = makeCharacter({ name: 'Fresh' });
assert(c1.currentLocation === 'eldor', 'new character starts in eldor');
assert(c1.vault && c1.vault.platinum === 0 && c1.vault.gold === 0 && c1.vault.items.length === 0, 'new character has empty vault');
assert(Array.isArray(c1.shrineBuffs) && c1.shrineBuffs.length === 0, 'new character has no shrine buffs');

// =================== Test 2: travelTo gating ===================
console.log('\n=== Test 2: travelTo level gate ===');
var res2a = Game.World.travelTo('estari_ruins'); // minLevel 4, player level 1
assert(res2a.ok === false && /Requires Level 4/.test(res2a.message), 'travel blocked under-leveled: ' + res2a.message);
assert(c1.currentLocation === 'eldor', 'location unchanged after blocked travel');

var res2b = Game.World.travelTo('plains_of_averast'); // minLevel 1
assert(res2b.ok === true, 'travel succeeds when leveled: ' + res2b.message);
assert(c1.currentLocation === 'plains_of_averast', 'location updated after successful travel');

// blocked during battle
setRng(fixedRng(0.99));
Game.Battle.start('plains_field_rat');
var res2c = Game.World.travelTo('eldor');
assert(res2c.ok === false && /battle/i.test(res2c.message), 'travel blocked during battle: ' + res2c.message);
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 3: camp ===================
console.log('\n=== Test 3: camp restores tent-scaled HP/Energy, hunting-only ===');
var c3 = makeCharacter({ name: 'CampTest' });
Game.World.travelTo('plains_of_averast');
c3.hitPoints = 1;
c3.energy = 1;
// remove starter tent to test the no-tent fraction
var tentIdx = c3.inventory.indexOf('tent_ragged_bedroll');
if (tentIdx !== -1) c3.inventory.splice(tentIdx, 1);
var res3 = Game.World.camp();
assert(res3.ok === true, 'camp succeeds in hunting area: ' + res3.message);
var expectedHp = Math.min(c3.hitPointsMax, 1 + Math.round(c3.hitPointsMax * BALANCE.CAMP_HEAL_NO_TENT));
assert(c3.hitPoints === expectedHp, 'no-tent camp restores ' + BALANCE.CAMP_HEAL_NO_TENT + ' fraction: got ' + c3.hitPoints + ', expected ' + expectedHp);

// with a tent, restores more
var c3b = makeCharacter({ name: 'CampTentTest' });
Game.World.travelTo('plains_of_averast');
c3b.hitPoints = 1;
c3b.energy = 1;
Game.Inventory.addItem(c3b, 'tent_travelers_tent'); // tentQuality 0.5
var res3b = Game.World.camp();
var expectedHp3b = Math.min(c3b.hitPointsMax, 1 + Math.round(c3b.hitPointsMax * 0.5));
assert(c3b.hitPoints === expectedHp3b, 'better tent restores more HP: got ' + c3b.hitPoints + ', expected ' + expectedHp3b);

// camp fails in town
var c3c = makeCharacter({ name: 'CampTownTest' });
var res3c = Game.World.camp();
assert(res3c.ok === false, 'camp fails in town: ' + res3c.message);

// =================== Test 3d: camping risk (Inn vs Camp real decision) ===================
// archived: reference/forum/t-756.md — player: "those damn thieves keep taking all my damn gold
// whenever I try to rest [camping]"; Nerevar: "you should use the vault to prevent your gold from
// being stolen while camping." Event roll goes through the same Game.Battle._rng() stub camp()'s
// heal step already used (heal is NOT stubbed — it's deterministic math — only the risk roll is).
console.log('\n=== Test 3d: camp risk — no-event, robbery, zero-gold escalation, ambush ===');

// no-event path: high roll on the event check -> heals exactly as before, event: 'none'
var c3d = makeCharacter({ name: 'CampRiskNoEvent' });
Game.World.travelTo('plains_of_averast');
c3d.hitPoints = 1; c3d.energy = 1;
setRng(fixedRng(0.99)); // event roll: 0.99 >= CAMP_EVENT_CHANCE (0.35) -> no event
var res3d = Game.World.camp();
assert(res3d.ok === true && res3d.event === 'none', 'camp: high roll -> no event: ' + JSON.stringify(res3d));
var quality3d = Game.World.bestTentQuality(c3d);
var expectedHp3d = Math.min(c3d.hitPointsMax, 1 + Math.round(c3d.hitPointsMax * quality3d));
assert(c3d.hitPoints === expectedHp3d, 'camp: no-event path still heals the normal tent-scaled amount: got ' + c3d.hitPoints + ', expected ' + expectedHp3d);

// robbery path: low event roll, low robbery-vs-ambush roll, carrying gold > 0
var c3e = makeCharacter({ name: 'CampRiskRobbery' });
Game.World.travelTo('plains_of_averast');
Game.Character.addGold(c3e, 100);
Game.World.depositGold(40); // move some to the Vault first — should stay untouched by the robbery
c3e.hitPoints = 1; c3e.energy = 1;
var carriedBefore3e = Game.Character.goldTotalAsGold(c3e); // 60
var vaultBefore3e = c3e.vault.platinum * BALANCE.GOLD_PER_PLATINUM + c3e.vault.gold; // 40
setRng(seqRng([0.0, 0.0], 0.99)); // event roll forces an event; robbery-vs-ambush roll forces robbery
var res3e = Game.World.camp();
assert(res3e.ok === true && res3e.event === 'robbery', 'camp: forced event+robbery roll -> robbery: ' + JSON.stringify(res3e));
var expectedStolen3e = Math.ceil(carriedBefore3e * BALANCE.CAMP_ROBBERY_GOLD_FRACTION);
assert(res3e.stolen === expectedStolen3e, 'camp: robbery steals ceil(carried * fraction): expected ' + expectedStolen3e + ', got ' + res3e.stolen);
assert(Game.Character.goldTotalAsGold(c3e) === carriedBefore3e - expectedStolen3e, 'camp: carried gold reduced by exactly the stolen amount');
assert((c3e.vault.platinum * BALANCE.GOLD_PER_PLATINUM + c3e.vault.gold) === vaultBefore3e, 'camp: vault gold untouched by robbery');
assert(/vault/i.test(res3e.message), 'camp: robbery message mentions the Vault: ' + res3e.message);
var quality3e = Game.World.bestTentQuality(c3e);
var expectedHp3e = Math.min(c3e.hitPointsMax, 1 + Math.round(c3e.hitPointsMax * quality3e));
assert(c3e.hitPoints === expectedHp3e, 'camp: HP still restored on a robbery — heal applies before the risk roll: got ' + c3e.hitPoints + ', expected ' + expectedHp3e);

// zero carried gold: a robbery roll escalates straight to an ambush instead (thieves find nothing)
var c3f = makeCharacter({ name: 'CampRiskZeroGoldEscalation' });
Game.World.travelTo('plains_of_averast');
c3f.gold = 0; c3f.platinum = 0;
c3f.hitPoints = 1; c3f.energy = 1;
setRng(seqRng([0.0, 0.0, 0.0], 0.99)); // event roll forces event; robbery-vs-ambush roll forces the robbery branch; pool-pick roll picks the first pool entry
var res3f = Game.World.camp();
assert(res3f.ok === true && res3f.event === 'ambush', 'camp: robbery roll with 0 carried gold escalates to ambush: ' + JSON.stringify(res3f));
assert(Game.state.battle !== null && Game.state.battle.phase === 'active', 'camp: zero-gold escalation starts a real battle');
var areaPlains3f = Game.World.getArea('plains_of_averast');
assert(areaPlains3f.monsters.indexOf(res3f.monsterId) !== -1, 'camp: escalated-ambush monster comes from the area\'s non-boss pool');
assert(!Game.state.battle.monster.champion, 'camp: ambush is never a Champion encounter');
Game.Battle.flee();
Game.Battle.endBattle();

// direct ambush path (high robbery-vs-ambush roll), carrying gold > 0 so it's unambiguously NOT
// the zero-gold-escalation path above.
var c3g = makeCharacter({ name: 'CampRiskDirectAmbush' });
Game.World.travelTo('plains_of_averast');
Game.Character.addGold(c3g, 50);
c3g.hitPoints = 1; c3g.energy = 1;
setRng(seqRng([0.0, 0.99, 0.0], 0.99)); // event roll forces event; robbery-vs-ambush roll forces the ambush branch (>= CAMP_ROBBERY_WEIGHT); pool-pick picks the first pool entry
var res3g = Game.World.camp();
assert(res3g.ok === true && res3g.event === 'ambush', 'camp: high robbery-vs-ambush roll -> direct ambush: ' + JSON.stringify(res3g));
assert(Game.state.battle !== null, 'camp: direct ambush starts a battle');
assert(Game.state.battle.ambush === true, 'camp: battle is flagged as an ambush');
assert(Game.state.battle.playerFirst === false, 'camp: ambush always gives the monster first strike regardless of Dexterity');
assert(/ambushed/i.test(Game.state.battle.log.join(' ')), 'camp: ambush battle logs a distinct "ambushed" line');
assert(!Game.state.battle.monster.champion, 'camp: direct ambush is never a Champion encounter');
assert(Game.Character.goldTotalAsGold(c3g) === 50, 'camp: carried gold untouched on an ambush (no robbery occurred)');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 4: inn rest ===================
console.log('\n=== Test 4: innRest charges fee, restores, resets fury ===');
var c4 = makeCharacter({ name: 'InnTest' });
Game.Character.addGold(c4, 100);
c4.hitPoints = 1;
c4.energy = 1;
c4.fury = 7;
var goldBefore4 = Game.Character.goldTotalAsGold(c4);
var expectedFee = BALANCE.INN_FEE_BASE + BALANCE.INN_FEE_PER_LEVEL * c4.level;
var res4 = Game.World.innRest();
assert(res4.ok === true, 'innRest succeeds in Eldor: ' + res4.message);
assert(Game.Character.goldTotalAsGold(c4) === goldBefore4 - expectedFee, 'inn fee charged: expected ' + expectedFee);
assert(c4.hitPoints === c4.hitPointsMax && c4.energy === c4.energyMax, 'HP/Energy fully restored');
assert(c4.fury === 0, 'fury reset by inn rest');

// insufficient gold
var c4b = makeCharacter({ name: 'PoorTest' });
c4b.gold = 0; c4b.platinum = 0;
var res4b = Game.World.innRest();
assert(res4b.ok === false, 'innRest fails without enough gold');

// no inn in hunting area
var c4c = makeCharacter({ name: 'NoInnTest' });
Game.Character.addGold(c4c, 100);
Game.World.travelTo('plains_of_averast');
var res4c = Game.World.innRest();
assert(res4c.ok === false && /Inn/.test(res4c.message), 'no Inn in hunting area: ' + res4c.message);

// =================== Test 4b: Haunting halves camp healing but NOT Inn rest, and Inn does not cure ===================
console.log('\n=== Test 4b: Haunting halves camp recovery (not Inn); Inn rest does not cure Haunting ===');
var c4d = makeCharacter({ name: 'HauntedCampTest' });
Game.World.travelTo('plains_of_averast');
Game.Character.addAffliction(c4d, 'haunting');
c4d.hitPoints = 1; c4d.energy = 1;
var tentIdx4d = c4d.inventory.indexOf('tent_ragged_bedroll');
if (tentIdx4d !== -1) c4d.inventory.splice(tentIdx4d, 1); // no-tent fraction, matches Test 3's baseline
setRng(fixedRng(0.99)); // no camp event
var res4d = Game.World.camp();
assert(res4d.ok === true, 'camp succeeds while Haunted: ' + res4d.message);
var unhaltedHp4d = Math.round(c4d.hitPointsMax * BALANCE.CAMP_HEAL_NO_TENT);
var expectedHauntedHp4d = 1 + Math.max(1, Math.round(unhaltedHp4d * BALANCE.HAUNTING_HEAL_MULT));
assert(c4d.hitPoints === expectedHauntedHp4d, 'Haunting halves camp HP recovery: got ' + c4d.hitPoints + ', expected ' + expectedHauntedHp4d + ' (unhalved would be ' + (1 + unhaltedHp4d) + ')');

// Inn rest is NOT halved (rest, not healing) and does NOT cure the Haunting.
var c4e = makeCharacter({ name: 'HauntedInnTest' });
Game.Character.addAffliction(c4e, 'haunting');
Game.Character.addGold(c4e, 100);
c4e.hitPoints = 1; c4e.energy = 1;
var res4e = Game.World.innRest();
assert(res4e.ok === true, 'innRest succeeds while Haunted: ' + res4e.message);
assert(c4e.hitPoints === c4e.hitPointsMax && c4e.energy === c4e.energyMax, 'Inn rest restores HP/Energy fully even while Haunted (not halved)');
assert(Game.Character.hasAffliction(c4e, 'haunting'), 'Inn rest does NOT cure Haunting');

// =================== Test 4c: Cleanse Haunting (Spirit Shrine service) ===================
console.log('\n=== Test 4c: cleanseHaunting charges fee, removes the affliction, only offered while Haunted ===');
var c4f = makeCharacter({ name: 'CleanseTest' });
var resNotHaunted4f = Game.World.cleanseHaunting();
assert(resNotHaunted4f.ok === false && /not Haunted/i.test(resNotHaunted4f.message), 'cleanseHaunting refuses when not Haunted: ' + resNotHaunted4f.message);

Game.Character.addAffliction(c4f, 'haunting');
Game.Character.addGold(c4f, 0);
var resPoor4f = Game.World.cleanseHaunting();
assert(resPoor4f.ok === false, 'cleanseHaunting fails without enough gold');
assert(Game.Character.hasAffliction(c4f, 'haunting'), 'still Haunted after a failed cleanse attempt');

var expectedCleanseFee4f = BALANCE.HAUNTING_CLEANSE_FEE_BASE + BALANCE.HAUNTING_CLEANSE_FEE_PER_LEVEL * c4f.level;
assert(Game.World.cleanseHauntingFee(c4f) === expectedCleanseFee4f, 'cleanseHauntingFee = BASE + PER_LEVEL*level: got ' + Game.World.cleanseHauntingFee(c4f));
Game.Character.addGold(c4f, expectedCleanseFee4f);
var goldBefore4f = Game.Character.goldTotalAsGold(c4f);
var resOk4f = Game.World.cleanseHaunting();
assert(resOk4f.ok === true, 'cleanseHaunting succeeds with enough gold: ' + resOk4f.message);
assert(!Game.Character.hasAffliction(c4f, 'haunting'), 'Haunting removed after a successful cleanse');
assert(Game.Character.goldTotalAsGold(c4f) === goldBefore4f - expectedCleanseFee4f, 'cleanse charged exactly its fee');

// no Spirit Shrine in Ju`Mak
var c4g = makeCharacter({ name: 'NoShrineCleanseTest' });
c4g.level = 6; // Ju`Mak Village gates travel at minLevel 6
Game.Character.addAffliction(c4g, 'haunting');
Game.Character.addGold(c4g, 1000);
Game.World.travelTo('jumak_village');
var resNoShrine4g = Game.World.cleanseHaunting();
assert(resNoShrine4g.ok === false && /Shrine/.test(resNoShrine4g.message), 'no Spirit Shrine in Ju`Mak: ' + resNoShrine4g.message);

// =================== Test 5: shop buy/sell ===================
console.log('\n=== Test 5: shop buy fails w/o gold or over capacity; sell pays 50% ===');
var c5 = makeCharacter({ name: 'ShopTest' });
c5.gold = 0; c5.platinum = 0;
var res5a = Game.World.buy('potion_minor_healing');
assert(res5a.ok === false && /afford/i.test(res5a.message), 'buy fails without gold: ' + res5a.message);

Game.Character.addGold(c5, 100);
var invBefore5 = c5.inventory.length;
var res5b = Game.World.buy('potion_minor_healing');
assert(res5b.ok === true, 'buy succeeds with gold: ' + res5b.message);
assert(c5.inventory.length === invBefore5 + 1, 'bought item added to inventory');
assert(Game.Character.goldTotalAsGold(c5) === 100 - Game.Inventory.getItem('potion_minor_healing').value, 'gold deducted by item value');

// over capacity
var c5b = makeCharacter({ name: 'HeavyShopTest' });
Game.Character.addGold(c5b, 10000);
c5b.strength = 1; // tiny capacity, starter kit already near the cap
var goldBeforeCap = Game.Character.goldTotalAsGold(c5b);
var res5c = Game.World.buy('heavy_body_plate_cuirass'); // heavy + levelReq 4, but capacity is what matters
// force capacity failure regardless of levelReq by using a guaranteed-too-heavy purchase:
var capFail = false;
while (Game.Inventory.carryCapacity(c5b) - Game.Inventory.currentWeight(c5b) >= 0 && c5b.strength > 0) { break; }
// Simplify: directly assert addItem-over-capacity path via buy() on heaviest cheap item after zeroing capacity.
c5b.strength = 0;
var res5d = Game.World.buy('tent_ragged_bedroll');
assert(res5d.ok === false && /weight/i.test(res5d.message), 'buy fails over capacity: ' + res5d.message);
assert(Game.Character.goldTotalAsGold(c5b) === goldBeforeCap, 'gold not charged when buy fails over capacity');

// sell: inventory only, not equipped; 50% rate
var c5e = makeCharacter({ name: 'SellTest' });
var potion = 'potion_minor_healing';
Game.Inventory.addItem(c5e, potion);
var goldBefore5e = Game.Character.goldTotalAsGold(c5e);
var invCountBefore = c5e.inventory.filter(function (i) { return i === potion; }).length;
var res5e = Game.World.sell(potion);
assert(res5e.ok === true, 'sell succeeds: ' + res5e.message);
var expectedPayout = Math.floor(Game.Inventory.getItem(potion).value * BALANCE.SHOP_SELL_RATE);
assert(Game.Character.goldTotalAsGold(c5e) === goldBefore5e + expectedPayout, 'sell pays floor(value*0.5): expected +' + expectedPayout);
assert(c5e.inventory.filter(function (i) { return i === potion; }).length === invCountBefore - 1, 'sold item removed from inventory');

// cannot sell equipped item
var c5f = makeCharacter({ name: 'SellEquippedTest' });
var weaponId = c5f.equipment.weapon;
assert(!!weaponId, 'sanity: starter weapon equipped');
var res5f = Game.World.sell(weaponId);
assert(res5f.ok === false, 'cannot sell an equipped item: ' + res5f.message);

// =================== Test 6: vault ===================
console.log('\n=== Test 6: vault round-trips gold/items, withdraw blocked over capacity, weightless ===');
var c6 = makeCharacter({ name: 'VaultTest' });
Game.Character.addGold(c6, 50);
var res6a = Game.World.depositGold(30);
assert(res6a.ok === true, 'deposit gold succeeds: ' + res6a.message);
assert(c6.vault.gold === 30 || (c6.vault.platinum * 100 + c6.vault.gold) === 30, 'vault holds deposited gold');
assert(Game.Character.goldTotalAsGold(c6) === 20, 'personal gold reduced by deposit');

var res6b = Game.World.withdrawGold(30);
assert(res6b.ok === true, 'withdraw gold succeeds: ' + res6b.message);
assert(Game.Character.goldTotalAsGold(c6) === 50, 'personal gold restored after withdraw');
assert(c6.vault.platinum === 0 && c6.vault.gold === 0, 'vault empty after full withdraw');

var res6c = Game.World.withdrawGold(9999);
assert(res6c.ok === false, 'withdraw more than vault holds fails');

// item round-trip + weightless storage
var c6b = makeCharacter({ name: 'VaultItemTest' });
var weightBefore = Game.Inventory.currentWeight(c6b);
Game.Inventory.addItem(c6b, 'tent_travelers_tent');
var weightWithTent = Game.Inventory.currentWeight(c6b);
assert(weightWithTent > weightBefore, 'sanity: tent adds weight while in inventory');
var res6d = Game.World.depositItem('tent_travelers_tent');
assert(res6d.ok === true, 'deposit item succeeds: ' + res6d.message);
assert(c6b.vault.items.indexOf('tent_travelers_tent') !== -1, 'item present in vault');
assert(c6b.inventory.indexOf('tent_travelers_tent') === -1, 'item removed from inventory');
assert(Game.Inventory.currentWeight(c6b) === weightBefore, 'vaulted item does not count toward carried weight');

var res6e = Game.World.withdrawItem('tent_travelers_tent');
assert(res6e.ok === true, 'withdraw item succeeds: ' + res6e.message);
assert(c6b.inventory.indexOf('tent_travelers_tent') !== -1, 'item back in inventory after withdraw');

// withdraw blocked over capacity
var c6c = makeCharacter({ name: 'VaultCapTest' });
Game.Inventory.addItem(c6c, 'tent_travelers_tent');
Game.World.depositItem('tent_travelers_tent');
c6c.strength = 0; // capacity collapses to ~0
var res6f = Game.World.withdrawItem('tent_travelers_tent');
assert(res6f.ok === false && /weight/i.test(res6f.message), 'withdraw blocked over capacity: ' + res6f.message);
assert(c6c.vault.items.indexOf('tent_travelers_tent') !== -1, 'item remains in vault after blocked withdraw');

// =================== Test 7: Academy tech chain gating ===================
console.log('\n=== Test 7: Academy chain gating (Firebolt II requires Firebolt I + Evocation skillReq) ===');
var c7 = makeCharacter({ skills: { 'Evocation': 3 }, name: 'AcademyTest' });
c7.trainingPoints = 10;
assert(c7.techs.indexOf('tech_firebolt_1') !== -1, 'sanity: Firebolt I known via starter tech');
var check7a = Game.World.canLearn(c7, Game.Battle.getTech('tech_firebolt_2'));
assert(check7a.ok === false, 'Firebolt II blocked: Evocation skill too low (' + check7a.failures.join(' ') + ')');

c7.skills['Evocation'].level = 8; // meets skillReq 8
var check7b = Game.World.canLearn(c7, Game.Battle.getTech('tech_firebolt_2'));
assert(check7b.ok === true, 'Firebolt II learnable once Evocation >= 8 and rank 1 known');

var tpBefore7 = c7.trainingPoints;
var res7 = Game.World.learnTech('tech_firebolt_2');
assert(res7.ok === true, 'learnTech succeeds: ' + res7.message);
assert(c7.techs.indexOf('tech_firebolt_2') !== -1, 'Firebolt II added to known techs');
assert(c7.trainingPoints === tpBefore7 - Game.Battle.getTech('tech_firebolt_2').trainingCost, 'TP deducted by trainingCost');

// blocked without rank 1 known at all
var c7b = makeCharacter({ name: 'NoRank1Test' });
c7b.trainingPoints = 10;
c7b.skills['Evocation'].level = 10;
var check7c = Game.World.canLearn(c7b, Game.Battle.getTech('tech_firebolt_2'));
assert(check7c.ok === false, 'Firebolt II blocked without Firebolt I known: ' + check7c.failures.join(' '));

// no Academy in hunting area
var c7c = makeCharacter({ skills: { 'Evocation': 3 }, name: 'NoAcademyTest' });
c7c.trainingPoints = 10;
Game.World.travelTo('plains_of_averast');
var res7c = Game.World.learnTech('tech_firebolt_1');
assert(res7c.ok === false && /Academy/.test(res7c.message), 'no Academy in hunting area: ' + res7c.message);

// Feature C (user-directed): the same chain-gating model applies to the new weapon-tech chains
// (Cleave/Impale/Vital Strike/Flurry) — trainingCost 2/3/5, skillReq 0/6/12 for ranks I/II/III.
console.log('\n=== Test 7b: weapon-tech chain gating (Cleave II requires Cleave I + Swords 6) ===');
var c7d = makeCharacter({ skills: { 'Swords': 3 }, name: 'WeaponChainTest' });
c7d.trainingPoints = 10;
assert(c7d.techs.indexOf('tech_cleave_1') !== -1, 'sanity: Cleave I known via starter tech');
var check7d = Game.World.canLearn(c7d, Game.Battle.getTech('tech_cleave_2'));
assert(check7d.ok === false, 'Cleave II blocked: Swords skill too low (' + check7d.failures.join(' ') + ')');

c7d.skills['Swords'].level = 6; // meets skillReq 6
var check7e = Game.World.canLearn(c7d, Game.Battle.getTech('tech_cleave_2'));
assert(check7e.ok === true, 'Cleave II learnable once Swords >= 6 and Cleave I known');
var tpBefore7d = c7d.trainingPoints;
var res7d = Game.World.learnTech('tech_cleave_2');
assert(res7d.ok === true, 'learnTech succeeds: ' + res7d.message);
assert(c7d.techs.indexOf('tech_cleave_2') !== -1, 'Cleave II added to known techs');
assert(c7d.trainingPoints === tpBefore7d - Game.Battle.getTech('tech_cleave_2').trainingCost, 'TP deducted by trainingCost (' + Game.Battle.getTech('tech_cleave_2').trainingCost + ')');

// Cleave III requires Cleave II known + Swords 12
var check7f = Game.World.canLearn(c7d, Game.Battle.getTech('tech_cleave_3'));
assert(check7f.ok === false, 'Cleave III blocked: Swords skill (6) below skillReq 12: ' + check7f.failures.join(' '));
c7d.skills['Swords'].level = 12;
var check7g = Game.World.canLearn(c7d, Game.Battle.getTech('tech_cleave_3'));
assert(check7g.ok === true, 'Cleave III learnable once Swords >= 12 and Cleave II known');

// blocked without rank 1 known at all (a Polearms build has no Cleave I)
var c7e = makeCharacter({ skills: { 'Polearms': 3 }, name: 'NoWeaponRank1Test' });
c7e.trainingPoints = 10;
c7e.skills['Swords'].level = 20;
var check7h = Game.World.canLearn(c7e, Game.Battle.getTech('tech_cleave_2'));
assert(check7h.ok === false, 'Cleave II blocked without Cleave I known: ' + check7h.failures.join(' '));

// =================== Test 8: Spirit Shrine buffs ===================
console.log('\n=== Test 8: shrine buff deducts shards, modifies battle numbers, expires after 5 battle-ends ===');
var c8 = makeCharacter({ name: 'ShrineTest' });
Game.Character.addShards(c8, 50);
var armorBefore8 = Game.Character.getArmor(c8);
var res8 = Game.World.buyBuff('shrine_stoneskin');
assert(res8.ok === true, 'buyBuff succeeds: ' + res8.message);
assert(c8.animaShards === 50 - 15, 'shards deducted by shardCost');
var armorAfter8 = Game.Character.getArmor(c8);
assert(armorAfter8 === armorBefore8 + 3, 'Stoneskin adds +3 Armor: before ' + armorBefore8 + ', after ' + armorAfter8);
assert(c8.shrineBuffs.length === 1 && c8.shrineBuffs[0].battlesLeft === 5, 'buff stored with battlesLeft=5');

// expires after 5 battle-ends (win/loss/flee all count). Feature A (user-directed): flee can now
// fail (BALANCE.FLEE_MAX 0.95), so 0.99 would always fail and the loop below would never actually
// end a battle via flee — the intent here is 5 battle-ends, not flee mechanics, so use a roll that
// guarantees success (0.01 < fleeChance) instead.
for (var i = 0; i < 5; i++) {
  setRng(fixedRng(0.01));
  Game.Battle.start('plains_field_rat');
  Game.Battle.flee();
  Game.Battle.endBattle();
}
assert(c8.shrineBuffs.length === 0, 'buff expired after 5 battle-ends, got battlesLeft entries: ' + JSON.stringify(c8.shrineBuffs));
var armorFinal8 = Game.Character.getArmor(c8);
assert(armorFinal8 === armorBefore8, 'armor bonus gone after buff expires');

// insufficient shards
var c8b = makeCharacter({ name: 'PoorShrineTest' });
c8b.animaShards = 0;
var res8b = Game.World.buyBuff('shrine_stoneskin');
assert(res8b.ok === false, 'buyBuff fails without enough shards');

// no shrine in Ju`Mak
var c8c = makeCharacter({ name: 'NoShrineTest' });
Game.Character.addShards(c8c, 50);
c8c.level = 6;
Game.World.travelTo('jumak_village');
var res8c = Game.World.buyBuff('shrine_stoneskin');
assert(res8c.ok === false && /Shrine/.test(res8c.message), 'no Shrine in Ju`Mak: ' + res8c.message);

// =================== Test 9: uncurse ===================
console.log('\n=== Test 9: uncurse removes cursed ring for its value in gold ===');
var c9 = makeCharacter({ name: 'CurseTest' });
Game.Inventory.addItem(c9, 'ring_of_the_hollow_king');
var equipRes9 = Game.Inventory.equip(c9, 'ring_of_the_hollow_king');
assert(equipRes9.ok === true, 'cursed ring equips: ' + JSON.stringify(equipRes9.failures));
var unequipTry = Game.Inventory.unequip(c9, 'head');
assert(unequipTry.ok === false, 'cursed ring cannot be unequipped conventionally');

var ringValue = Game.Inventory.getItem('ring_of_the_hollow_king').value;
Game.Character.addGold(c9, ringValue + 10);
var goldBefore9 = Game.Character.goldTotalAsGold(c9);
var res9 = Game.World.uncurse('head');
assert(res9.ok === true, 'uncurse succeeds at the Shrine: ' + res9.message);
assert(c9.equipment.head === null, 'ring unequipped after uncurse');
assert(c9.inventory.indexOf('ring_of_the_hollow_king') !== -1, 'ring returned to inventory');
assert(Game.Character.goldTotalAsGold(c9) === goldBefore9 - ringValue, 'uncurse fee = item value');

// =================== Test 10: Synthesis ===================
console.log('\n=== Test 10: synthesis consumes inputs + gold, grants output, fails cleanly when missing ===');
var c10 = makeCharacter({ name: 'SynthTest' });
Game.Character.addGold(c10, 200);
// synth_healing_potion needs 3x potion_minor_healing + 20g
var res10a = Game.World.synthesize('synth_healing_potion');
assert(res10a.ok === false && /Missing/.test(res10a.message), 'synthesize fails cleanly when inputs missing: ' + res10a.message);

Game.Inventory.addItem(c10, 'potion_minor_healing');
Game.Inventory.addItem(c10, 'potion_minor_healing');
Game.Inventory.addItem(c10, 'potion_minor_healing');
var goldBefore10 = Game.Character.goldTotalAsGold(c10);
var potionCountBefore10 = c10.inventory.filter(function (i) { return i === 'potion_minor_healing'; }).length;
var res10b = Game.World.synthesize('synth_healing_potion');
assert(res10b.ok === true, 'synthesize succeeds with inputs+gold: ' + res10b.message);
assert(c10.inventory.filter(function (i) { return i === 'potion_minor_healing'; }).length === potionCountBefore10 - 3, 'inputs consumed (3x minor potion)');
assert(c10.inventory.indexOf('potion_healing') !== -1, 'output granted');
assert(Game.Character.goldTotalAsGold(c10) === goldBefore10 - 20, 'gold cost deducted');

// =================== Test 11: v3 -> v4 migration (and v1 -> v4 chain) ===================
console.log('\n=== Test 11: save migration adds currentLocation/vault/shrineBuffs ===');
var v3Character = {
  race: 'Human', name: 'V3Timer', gender: 'Male',
  strength: 8, vitality: 8, dexterity: 8, intelligence: 8, endurance: 8,
  hitPointsMax: 70, hitPoints: 70, energyMax: 110, energy: 110,
  level: 3, xp: 120, statPoints: 2, trainingPoints: 1,
  gold: 40, platinum: 0, animaShards: 5,
  monsterKills: 4, deaths: 1,
  skills: (function () {
    var t = {};
    BALANCE.SKILLS.forEach(function (s) { t[s] = { level: 0, xp: 0 }; });
    return t;
  })(),
  weaponDamageBonus: 0, equippedWeaponSkill: null,
  inventory: ['potion_minor_healing'],
  equipment: { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null },
  techs: [], techSets: [
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null]
  ],
  fury: 0
  // NOTE: no currentLocation / vault / shrineBuffs — a real Phase 3 (v3) save.
};
localStorageStore['herorpg_save'] = JSON.stringify({ version: 3, state: { character: v3Character } });
var loaded11 = Game.Save.load();
assert(loaded11 !== null, 'v3 save loads');
assert(loaded11.character.currentLocation === 'eldor', 'migration adds currentLocation=eldor');
assert(loaded11.character.vault && loaded11.character.vault.platinum === 0 && loaded11.character.vault.gold === 0 && Array.isArray(loaded11.character.vault.items), 'migration adds empty vault');
assert(Array.isArray(loaded11.character.shrineBuffs) && loaded11.character.shrineBuffs.length === 0, 'migration adds empty shrineBuffs');
assert(Array.isArray(loaded11.character.afflictions) && loaded11.character.afflictions.length === 0, 'v3->v8 chain also runs the v7->v8 step: migration adds empty afflictions');
Game.state = loaded11;
Game.persist();
var resaved11 = JSON.parse(localStorageStore['herorpg_save']);
assert(resaved11.version === 9, 'resave stamps version 9 (v1.2 Phase 1 equipment.offhand migration)');

// v1 -> v4 chain (continues on through v8; the historical "v4" name in the label below refers to
// the fields this specific fixture checks, not the final stamped version)
var v1c = JSON.parse(JSON.stringify(v3Character));
delete v1c.inventory; delete v1c.equipment; delete v1c.equippedWeaponSkill;
delete v1c.techs; delete v1c.techSets; delete v1c.fury;
localStorageStore['herorpg_save'] = JSON.stringify({ version: 1, state: { character: v1c } });
var loaded1 = Game.Save.load();
assert(loaded1 !== null && Array.isArray(loaded1.character.inventory) && Array.isArray(loaded1.character.techSets) &&
  loaded1.character.currentLocation === 'eldor' && loaded1.character.vault && Array.isArray(loaded1.character.shrineBuffs) &&
  Array.isArray(loaded1.character.afflictions) && loaded1.character.afflictions.length === 0,
  'v1 save chains all the way through v8 (inventory/techSets/currentLocation/vault/shrineBuffs/afflictions all present)');

// =================== Test 11b: v7 -> v8 migration (Feature B afflictions) ===================
console.log('\n=== Test 11b: v7 -> v8 migration adds afflictions: [] ===');
var v7Character = JSON.parse(JSON.stringify(v3Character));
v7Character.currentLocation = 'eldor';
v7Character.vault = { platinum: 0, gold: 0, items: [] };
v7Character.shrineBuffs = [];
v7Character.quests = {};
v7Character.classes = {};
v7Character.primaryClass = null;
v7Character.secondaryClass = null;
v7Character.legendaryUnlocked = false;
// NOTE: no `afflictions` field — a real Phase-6/v1.1 (v7) save, pre-Feature-B.
localStorageStore['herorpg_save'] = JSON.stringify({ version: 7, state: { character: v7Character } });
var loaded11b = Game.Save.load();
assert(loaded11b !== null, 'v7 save loads');
assert(Array.isArray(loaded11b.character.afflictions) && loaded11b.character.afflictions.length === 0, 'v7->v8 migration adds empty afflictions array');
assert(loaded11b.character.name === 'V3Timer', 'v7->v8 migration: identity intact');
Game.state = loaded11b;
Game.persist();
assert(JSON.parse(localStorageStore['herorpg_save']).version === 9, 'v7->v9 resave stamps version 9');

// A v7 save that (hypothetically) already carried an afflictions array is left untouched (no
// double-init / data loss).
var v7WithAfflictions = JSON.parse(JSON.stringify(v7Character));
v7WithAfflictions.afflictions = [{ id: 'haunting' }];
localStorageStore['herorpg_save'] = JSON.stringify({ version: 7, state: { character: v7WithAfflictions } });
var loaded11c = Game.Save.load();
assert(loaded11c !== null && loaded11c.character.afflictions.length === 1 && loaded11c.character.afflictions[0].id === 'haunting',
  'v7->v8 migration leaves a pre-existing afflictions array untouched');

// =================== Test 12: full-screen renders ===================
console.log('\n=== Test 12: explore/town screens render without throwing ===');
var c12 = makeCharacter({ name: 'RenderTest' });
Game.state.character = c12;
Game.state.battle = null;
try {
  Game.Screens.navigate('explore');
  console.log('PASS: explore screen (town view) rendered');
} catch (e) { failures++; console.error('FAIL: explore (town) threw: ' + e.stack); }

try {
  Game.Screens.navigate('town');
  console.log('PASS: town screen rendered (Eldor, no facility expanded)');
} catch (e) { failures++; console.error('FAIL: town screen threw: ' + e.stack); }

// Expand every facility panel and render each without throwing.
var facilityHeaders = document.getElementById('maincontent').queryAllByClass('stat-row');
// Click each facility header row (best-effort: re-navigate + click sequentially since renders replace the DOM)
['shop', 'synthesis', 'inn', 'vault', 'academy', 'shrine'].forEach(function (facType) {
  try {
    Game.Screens.navigate('town');
    var rows = document.getElementById('maincontent').queryAllByClass('stat-row');
    var target = rows.filter(function (r) { return r.textContent.indexOf(({
      shop: 'Shop', synthesis: 'Synthesis Shop', inn: 'Inn', vault: 'Vault', academy: 'Academy', shrine: 'Spirit Shrine'
    })[facType]) !== -1; })[0];
    assert(!!target, 'facility header row found: ' + facType);
    if (target) target.click();
    console.log('PASS: ' + facType + ' facility panel expanded without throwing');
  } catch (e) { failures++; console.error('FAIL: ' + facType + ' facility panel threw: ' + e.stack); }
});

// Travel to a hunting area and render Explore with Hunt+Camp visible.
var c12b = makeCharacter({ name: 'HuntRenderTest' });
Game.state.character = c12b;
try {
  Game.Screens.navigate('explore');
  console.log('PASS: explore (Eldor, town) rendered');
} catch (e) { failures++; console.error('FAIL: explore threw: ' + e.stack); }

// Town screen while in a hunting area -> "There is no town here."
Game.World.travelTo('plains_of_averast');
try {
  Game.Screens.navigate('town');
  var bodyText = document.getElementById('maincontent').textContent;
  assert(/no town here/i.test(bodyText), 'Town screen shows "There is no town here." in a hunting area');
} catch (e) { failures++; console.error('FAIL: town-in-wilderness threw: ' + e.stack); }

try {
  Game.Screens.navigate('explore');
  console.log('PASS: explore (hunting area, Hunt+Camp) rendered');
} catch (e) { failures++; console.error('FAIL: explore (hunting) threw: ' + e.stack); }

// =================== Test 13: debug goto/addTP ===================
console.log('\n=== Test 13: debug goto/addTP ===');
var c13 = makeCharacter({ name: 'DebugWorldTest' });
Game.state.character = c13;
Game._debug.goto('estari_ruins'); // minLevel 4, bypasses gate
assert(c13.currentLocation === 'estari_ruins', 'debug goto bypasses level gate');
var tpBefore13 = c13.trainingPoints;
Game._debug.addTP(5);
assert(c13.trainingPoints === tpBefore13 + 5, 'debug addTP adds Training Points');

// =================== Test 14: full no-debug loop ===================
console.log('\n=== Test 14: fresh character full loop (Eldor -> Plains -> hunt -> win -> loot -> travel back -> sell -> buy -> inn rest) ===');
var c14 = makeCharacter({ name: 'LoopTest' });
c14.strength = 40; // hit hard so the rat dies quickly
Game.Character.recalcDerived(c14);
assert(c14.currentLocation === 'eldor', 'loop: starts in Eldor');

var travelOut = Game.World.travelTo('plains_of_averast');
assert(travelOut.ok === true, 'loop: travel to Plains of Averast succeeds');

setRng(fixedRng(0.99));
var loopBattle = Game.Battle.start('plains_field_rat');
loopBattle.monster.hp = 1;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.0, 0.0, 0.0], 0.99)); // guarantee a drop
Game.Battle.attack();
assert(loopBattle.phase === 'won', 'loop: battle won');
var lootedId = loopBattle.pendingLoot;
if (lootedId) {
  var lootRes = Game.Battle.claimLoot();
  assert(lootRes.ok === true, 'loop: loot claimed');
}
Game.Battle.endBattle();

var travelBack = Game.World.travelTo('eldor');
assert(travelBack.ok === true, 'loop: travel back to Eldor succeeds');

if (lootedId && c14.inventory.indexOf(lootedId) !== -1) {
  var sellLoop = Game.World.sell(lootedId);
  assert(sellLoop.ok === true, 'loop: sell looted item succeeds');
}

var goldBeforeBuyLoop = Game.Character.goldTotalAsGold(c14);
if (goldBeforeBuyLoop >= Game.Inventory.getItem('potion_minor_healing').value) {
  var buyLoop = Game.World.buy('potion_minor_healing');
  assert(buyLoop.ok === true, 'loop: buy potion succeeds');
} else {
  console.log('SKIP: loop buy step (insufficient gold from this RNG run) — non-fatal');
}

Game.Character.addGold(c14, 100); // ensure the Inn is affordable regardless of RNG-dependent gold above
var innLoop = Game.World.innRest();
assert(innLoop.ok === true, 'loop: inn rest succeeds');
assert(c14.hitPoints === c14.hitPointsMax && c14.energy === c14.energyMax, 'loop: fully healed after inn rest');

// =================== Test 15: Hunt (random encounter, Phase 8) ===================
// archived: reference/forum/t-755.md — Nerevar: "the chance of finding a monster has been
// increased to 95%." Replaces the old per-monster pick list; bosses stay Lair-only.
console.log('\n=== Test 15: Game.World.hunt() — encounter roll, non-boss-only, hunting-area-only ===');
var c15 = makeCharacter({ name: 'HuntTest' });
c15.level = 5; // estari_ruins gates at minLevel 4 — a level-1 character would bounce off the
               // travel gate and silently hunt in town, failing every encounter subtest
Game.World.travelTo('estari_ruins'); // hunting area with 2 regular monsters + a lair boss

// high roll (>= HUNT_ENCOUNTER_CHANCE) -> no encounter, no battle started
setRng(fixedRng(0.99));
var res15a = Game.World.hunt();
assert(res15a.ok === true && res15a.encounter === false, 'hunt: high roll -> no encounter: ' + JSON.stringify(res15a));
assert(/nothing/i.test(res15a.message), 'hunt: no-encounter message reads "You find nothing.": ' + res15a.message);
assert(Game.state.battle === null, 'hunt: no battle started on a no-encounter roll');

// low roll -> guaranteed encounter, picks a monster from the area's own pool, starts a battle
setRng(seqRng([0.0, 0.0], 0.99));
var res15b = Game.World.hunt();
assert(res15b.ok === true && res15b.encounter === true, 'hunt: low roll -> encounter: ' + JSON.stringify(res15b));
assert(Game.state.battle !== null && Game.state.battle.phase === 'active', 'hunt: battle started on encounter');
var areaEstari = Game.World.getArea('estari_ruins');
assert(areaEstari.monsters.indexOf(res15b.monsterId) !== -1, 'hunt: picked monster (' + res15b.monsterId + ') is in the area pool');
Game.Battle.flee();
Game.Battle.endBattle();

// bosses are never drawn from the random table, even if (hypothetically) present in area.monsters
var areaBossCheck = Game.World.getArea('estari_ruins');
var originalMonsters = areaBossCheck.monsters.slice();
areaBossCheck.monsters = originalMonsters.concat(['estari_ruin_warden']);
var pickedIds = {};
for (var h = 0; h < 20; h++) {
  setRng(seqRng([0.0, h / 20], 0.99));
  var huntRes = Game.World.hunt();
  if (huntRes.encounter) {
    pickedIds[huntRes.monsterId] = true;
    Game.Battle.flee();
    Game.Battle.endBattle();
  }
}
assert(!pickedIds.estari_ruin_warden, 'hunt: boss never drawn from the random table even when present in area.monsters');
areaBossCheck.monsters = originalMonsters; // restore fixture data for later tests

// =================== Test 15b: Champion encounters (enemy-variety pass) ===================
// invented mechanic, flavor-credited to the archived "Champion Bosses" forum-thread title
// (reference/site/homepage_2006.md) — see balance.js CHAMPION_* comment. Rolled only inside
// Game.World.hunt(), after the monster pick; transforms only the battle's deep COPY.
console.log('\n=== Test 15b: Champion encounters (hunt-only, 2x rewards, guaranteed shard) ===');
var c15e = makeCharacter({ name: 'ChampionTest' });
Game.World.travelTo('plains_of_averast'); // pool[0] resolves to plains_field_rat, level 1 <= starter dexterity so playerFirst (no extra rng consumed in start())
var ratDef = Game.Battle.getMonsterDef('plains_field_rat');

setRng(seqRng([0.0, 0.0, 0.0], 0.99)); // encounter roll, monster pick, champion roll — all forced
var res15e = Game.World.hunt();
assert(res15e.ok === true && res15e.encounter === true && res15e.champion === true, 'champion: hunt() reports champion:true: ' + JSON.stringify(res15e));
var champBattle = Game.state.battle;
assert(champBattle.monster.champion === true, 'champion: battle.monster.champion flag set');
assert(champBattle.monster.name === 'Champion ' + ratDef.name, 'champion: name prefixed "Champion ": got ' + champBattle.monster.name);
assert(champBattle.monster.hpMax === Math.round(ratDef.hp * BALANCE.CHAMPION_HP_MULT), 'champion: hpMax = round(base hp * ' + BALANCE.CHAMPION_HP_MULT + '): got ' + champBattle.monster.hpMax);
assert(champBattle.monster.hp === champBattle.monster.hpMax, 'champion: starts at full (multiplied) HP');
assert(champBattle.monster.damage === Math.round(ratDef.damage * BALANCE.CHAMPION_DAMAGE_MULT), 'champion: damage = round(base damage * ' + BALANCE.CHAMPION_DAMAGE_MULT + '): got ' + champBattle.monster.damage);
assert(/Champion prowls the area/.test(champBattle.log.join(' ')), 'champion: distinct log line on appearance');

// Win the fight with fully controlled RNG to check reward multipliers + guaranteed shard +
// doubled drop chance (plains_field_rat has exactly one drop entry: potion_minor_healing @ 0.1 —
// doubled to 0.2 for a Champion; a roll of 0.15 misses the base rate but hits the doubled rate).
champBattle.monster.hp = 1;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.5, 0.15], 0.99));
Game.Battle.attack();
assert(champBattle.phase === 'won', 'champion: battle won');
var furyBonus15e = 1; // fresh character, fury 0
var expectedChampXp = Math.round(ratDef.xp * furyBonus15e * BALANCE.CHAMPION_REWARD_MULT);
assert(champBattle.rewards.xp === expectedChampXp, 'champion: xp doubled: expected ' + expectedChampXp + ', got ' + champBattle.rewards.xp);
var baseGold = ratDef.goldMin + Math.floor(0.5 * (ratDef.goldMax - ratDef.goldMin + 1));
var expectedChampGold = Math.round(baseGold * BALANCE.CHAMPION_REWARD_MULT);
assert(champBattle.rewards.gold === expectedChampGold, 'champion: gold doubled: expected ' + expectedChampGold + ', got ' + champBattle.rewards.gold);
assert(champBattle.rewards.shards === 1, 'champion: shard guaranteed (shardChance roll skipped entirely): got ' + champBattle.rewards.shards);
assert(champBattle.pendingLoot === 'potion_minor_healing', 'champion: doubled drop chance (0.1 -> 0.2) hit on a 0.15 roll that would miss the base rate: got ' + champBattle.pendingLoot);
Game.Battle.endBattle();

// Fury: a champion kill counts as one level higher for the at-or-above-level fury check ONLY
// (Fear stays based on the monster's real level — untouched here). Player level 2 vs a level-1
// monster: non-champion gives no fury tick (1 >= 2 is false); champion gives a tick (1+1 >= 2).
var c15f = makeCharacter({ name: 'ChampionFuryTest' });
c15f.level = 2;
Game.World.travelTo('plains_of_averast');

setRng(seqRng([0.0, 0.0], 0.99)); // encounter roll, monster pick — no champion this time
var nonChampBattle = Game.World.hunt().battle;
assert(!nonChampBattle.monster.champion, 'champion-fury: sanity, this encounter is not a champion');
nonChampBattle.monster.hp = 1;
setRng(fixedRng(0.99));
Game.Battle.attack();
assert(nonChampBattle.phase === 'won' && c15f.fury === 0, 'champion-fury: non-champion level-1 kill vs level-2 player does NOT tick fury: got ' + c15f.fury);
Game.Battle.endBattle();

setRng(seqRng([0.0, 0.0, 0.0], 0.99)); // encounter roll, monster pick, champion roll — forced champion
var champFuryBattle = Game.World.hunt().battle;
assert(champFuryBattle.monster.champion, 'champion-fury: sanity, this encounter IS a champion');
champFuryBattle.monster.hp = 1;
setRng(fixedRng(0.99));
Game.Battle.attack();
assert(champFuryBattle.phase === 'won' && c15f.fury === 1, 'champion-fury: champion level-1 kill vs level-2 player DOES tick fury (effective level 1+1=2 >= 2): got ' + c15f.fury);
Game.Battle.endBattle();

// Champions never come from Lair/boss fights or debug fight() — both call Game.Battle.start()
// with no options object, so the champion roll (which only happens inside Game.World.hunt())
// never runs, regardless of what the RNG would have produced.
var c15g = makeCharacter({ name: 'NoLairChampionTest' });
setRng(fixedRng(0.0)); // would force a champion roll to succeed, IF one were ever taken here
var lairBattle = Game.Battle.start('estari_ruin_warden');
assert(!lairBattle.monster.champion, 'champion: Lair/boss fights (Game.Battle.start with no options) never produce a champion');
assert(lairBattle.monster.name === Game.Battle.getMonsterDef('estari_ruin_warden').name, 'champion: Lair boss name unprefixed');
Game.state.battle = null; // no flee needed against a manually-started battle we never advanced

// hunting-area-only: fails in a town
var c15c = makeCharacter({ name: 'HuntTownTest' });
var res15c = Game.World.hunt();
assert(res15c.ok === false && res15c.encounter === false, 'hunt: fails outside a hunting area: ' + res15c.message);

// blocked during battle
var c15d = makeCharacter({ name: 'HuntBattleTest' });
Game.World.travelTo('plains_of_averast');
setRng(fixedRng(0.99));
Game.Battle.start('plains_field_rat');
var res15d = Game.World.hunt();
assert(res15d.ok === false && /battle/i.test(res15d.message), 'hunt: blocked during battle: ' + res15d.message);
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 16: Shrine buffs grown to ~20 (v1.2 Phase 3 Content-B item 3) ===================
console.log('\n=== Test 16: Spirit Shrine buff roster grown from 5 to 20; a new buff\'s shrineBonus applies via the unchanged Game.World.shrineBonus ===');
assert(Game.Data.shrine.length === 20, '20 shrine buffs defined (5 original + 15 v1.2 Phase 3 additions), got ' + Game.Data.shrine.length);
['armor', 'damage', 'dodge', 'magicArmor', 'goldPct'].forEach(function (effect) {
  var count = Game.Data.shrine.filter(function (b) { return b.effect === effect; }).length;
  assert(count === 4, 'exactly 4 buffs use the existing effect "' + effect + '" (1 original + 3 new), got ' + count);
});

// A brand-new buff (not one of the original 5) still flows through the UNCHANGED
// Game.World.shrineBonus/buyBuff — no new effect type, no new consuming code needed.
var c16 = makeCharacter({ name: 'NewShrineBuffTest' });
Game.Character.addShards(c16, 100);
var dodgeBefore16 = Game.Battle.playerDodgeChance(c16);
var res16 = Game.World.buyBuff('shrine_shadowstep_grace');
assert(res16.ok === true, 'buyBuff succeeds for a new v1.2 buff: ' + res16.message);
assert(c16.animaShards === 100 - 35, 'shardCost (35) deducted for Shadowstep Grace');
var dodgeAfter16 = Game.Battle.playerDodgeChance(c16);
assert(Math.abs(dodgeAfter16 - dodgeBefore16 - 0.08) < 1e-9, 'Shadowstep Grace adds +8% Dodge via the existing shrineBonus hook: before ' + dodgeBefore16 + ', after ' + dodgeAfter16);

// A new goldPct buff also stacks additively with the original Fortune's Favor via the same hook.
var c16b = makeCharacter({ name: 'StackedGoldBuffTest' });
Game.Character.addShards(c16b, 100);
Game.World.buyBuff('shrine_fortunes_favor'); // +0.10 (original)
Game.World.buyBuff('shrine_kings_ransom'); // +0.25 (new)
var goldPctTotal16b = Game.World.shrineBonus(c16b, 'goldPct');
assert(Math.abs(goldPctTotal16b - 0.35) < 1e-9, 'goldPct shrineBonus sums an original + a new buff: got ' + goldPctTotal16b);

// =================== Test 17: level-30+ shop items — purchasable + consumable (v1.2 Phase 3 Content-B item 2) ===================
console.log('\n=== Test 17: energy stones are purchasable via the generic shop mechanism and consumable in battle ===');
// Content-A (a later agent) attaches the real level-30+ outpost shop that stocks these; here we
// only own/verify the ITEM + the generic Game.World.buy() mechanism works for it — so temporarily
// list it in Eldor's existing shop stock, exactly like any other purchasable item, then restore.
var eldorShop = null;
Game.World.getArea('eldor').facilities.forEach(function (f) { if (f.type === 'shop') eldorShop = f; });
assert(!!eldorShop, 'sanity: Eldor has a shop facility');
assert(eldorShop.stock.indexOf('stone_energy_lesser') === -1, 'sanity: Lesser Energy Stone is not (yet) stocked anywhere — Content-A owns that');
eldorShop.stock.push('stone_energy_lesser');

var c17 = makeCharacter({ name: 'EnergyStoneShopTest' });
Game.World.travelTo('eldor');
Game.Character.addGold(c17, 500);
var stoneItem17 = Game.Inventory.getItem('stone_energy_lesser');
var goldBefore17 = Game.Character.goldTotalAsGold(c17);
var resBuy17 = Game.World.buy('stone_energy_lesser');
assert(resBuy17.ok === true, 'Lesser Energy Stone is purchasable via the generic shop mechanism: ' + resBuy17.message);
assert(Game.Character.goldTotalAsGold(c17) === goldBefore17 - stoneItem17.value, 'gold deducted by its value');
assert(c17.inventory.indexOf('stone_energy_lesser') !== -1, 'stone added to inventory');
eldorShop.stock.pop(); // restore Eldor's stock to its original list

setRng(fixedRng(0.99));
var b17 = Game.Battle.start('plains_field_rat');
Game.Battle.useItem('stone_energy_lesser');
var stoneLine17 = b17.log.filter(function (l) { return l.indexOf('Lesser Energy Stone') !== -1; }).pop();
assert(!!stoneLine17 && /recover 200 Energy/.test(stoneLine17), 'Lesser Energy Stone is consumable in battle and restores exactly its specified 200 Energy: "' + stoneLine17 + '"');
Game.Battle.endBattle();

// =================== Test 18: level-30+ synthesis recipes (v1.2 Phase 3 Content-B item 2) ===================
console.log('\n=== Test 18: new 30+ synthesis recipes produce their output and consume inputs ===');
var c18 = makeCharacter({ name: 'Synth30Test' });
Game.Character.addGold(c18, 2000);

// synth_bclass_crystal_3: 2x crystal_bclass_2 + 300g -> crystal_bclass_3
Game.Inventory.addItem(c18, 'crystal_bclass_2');
Game.Inventory.addItem(c18, 'crystal_bclass_2');
var goldBefore18a = Game.Character.goldTotalAsGold(c18);
var res18a = Game.World.synthesize('synth_bclass_crystal_3');
assert(res18a.ok === true, 'synth_bclass_crystal_3 succeeds: ' + res18a.message);
assert(c18.inventory.filter(function (i) { return i === 'crystal_bclass_2'; }).length === 0, 'both crystal_bclass_2 inputs consumed');
assert(c18.inventory.indexOf('crystal_bclass_3') !== -1, 'crystal_bclass_3 output granted');
assert(Game.Character.goldTotalAsGold(c18) === goldBefore18a - 300, 'gold cost (300) deducted');

// synth_bclass_sphere_3: 2x sphere_bclass_2 + 250g -> sphere_bclass_3
Game.Inventory.addItem(c18, 'sphere_bclass_2');
Game.Inventory.addItem(c18, 'sphere_bclass_2');
var goldBefore18b = Game.Character.goldTotalAsGold(c18);
var res18b = Game.World.synthesize('synth_bclass_sphere_3');
assert(res18b.ok === true, 'synth_bclass_sphere_3 succeeds: ' + res18b.message);
assert(c18.inventory.filter(function (i) { return i === 'sphere_bclass_2'; }).length === 0, 'both sphere_bclass_2 inputs consumed');
assert(c18.inventory.indexOf('sphere_bclass_3') !== -1, 'sphere_bclass_3 output granted');
assert(Game.Character.goldTotalAsGold(c18) === goldBefore18b - 250, 'gold cost (250) deducted');

// synth_light_crystal: crystal_bclass_4 + material_refined_anima_dust + 700g -> crystal_light
Game.Inventory.addItem(c18, 'crystal_bclass_4');
Game.Inventory.addItem(c18, 'material_refined_anima_dust');
var goldBefore18c = Game.Character.goldTotalAsGold(c18);
var res18c = Game.World.synthesize('synth_light_crystal');
assert(res18c.ok === true, 'synth_light_crystal succeeds: ' + res18c.message);
assert(c18.inventory.indexOf('crystal_bclass_4') === -1, 'crystal_bclass_4 input consumed');
assert(c18.inventory.indexOf('material_refined_anima_dust') === -1, 'material_refined_anima_dust input consumed');
assert(c18.inventory.indexOf('crystal_light') !== -1, 'crystal_light output granted');
assert(Game.Character.goldTotalAsGold(c18) === goldBefore18c - 700, 'gold cost (700) deducted');

// fails cleanly when inputs are missing (established synthesize() contract).
var res18d = Game.World.synthesize('synth_bclass_crystal_3');
assert(res18d.ok === false && /Missing/.test(res18d.message), 'synth_bclass_crystal_3 fails cleanly once inputs are gone again: ' + res18d.message);

// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
