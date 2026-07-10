// Phase 5 exit tests — quests & story (accept/cancel/kill/collect/touch/visit/turn-in,
// multi-rewards, save v5 migration, Journal + Tavern rendering) via the fakedom shim.
// Randomness stubbed via Game.Battle._rng.

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

var alerts = [];
global.alert = function (m) { alerts.push(m); console.log('[alert]', m); };
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
loadScript('data/quests.js');
loadScript('data/story.js');
loadScript('data/classes.js');
loadScript('core/character.js');
loadScript('core/inventory.js');
loadScript('core/battle.js');
loadScript('core/world.js');
loadScript('core/quests.js');
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

function makeCharacter(opts) {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Light Armor'] = 2;
  var c = Game.Character.create({
    race: (opts && opts.race) || 'Human',
    name: (opts && opts.name) || 'QuestTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  Game.state.character = c;
  Game.state.battle = null;
  return c;
}

// Wins one battle vs monsterId deterministically (1-HP monster, no dodge/glance rolls land).
// Heals to full first: faster monsters strike once at battle start plus once per counter, and
// several helper wins in a row would otherwise grind the tester down to a real defeat.
function winBattle(monsterId) {
  var c = Game.state.character;
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  setRng(fixedRng(0.99));
  var battle = Game.Battle.start(monsterId);
  battle.monster.hp = 1;
  Game.Battle.attack();
  if (battle.phase !== 'won') throw new Error('test helper: battle vs ' + monsterId + ' not won, phase=' + battle.phase);
  Game.Battle.endBattle();
}

// =================== Test 0: data sanity ===================
console.log('\n=== Test 0: quest/story data sanity ===');
assert(Game.Data.quests.length === 25, '25 quests defined (22 pre-v1.2-Phase-3 + v1.2 Phase 3 Content-A\'s arkan_first_rite/arkan_battlemage_trial/arkan_red_moon_whispers), got ' + Game.Data.quests.length);
assert(Game.Data.story.length === 3, '3 story chapters, got ' + Game.Data.story.length);
['prelude', 'chapter_1', 'chapter_2'].forEach(function (id) {
  var found = Game.Data.story.some(function (ch) { return ch.id === id; });
  assert(found, 'story chapter exists: ' + id);
});
var badRefs = [];
Game.Data.quests.forEach(function (q) {
  if (!Game.World.getArea(q.giver.areaId)) badRefs.push(q.id + ' giver area ' + q.giver.areaId);
  (q.acceptItems || []).forEach(function (iid) { if (!Game.Inventory.getItem(iid)) badRefs.push(q.id + ' acceptItem ' + iid); });
  ((q.rewards && q.rewards.items) || []).forEach(function (iid) { if (!Game.Inventory.getItem(iid)) badRefs.push(q.id + ' reward ' + iid); });
  q.steps.forEach(function (step) {
    if (step.kind === 'kill' && !Game.Battle.getMonsterDef(step.monsterId)) badRefs.push(q.id + ' kill ' + step.monsterId);
    if (step.kind === 'collect' && !Game.Inventory.getItem(step.itemId)) badRefs.push(q.id + ' collect ' + step.itemId);
    if (step.kind === 'visit' && !Game.World.getArea(step.areaId)) badRefs.push(q.id + ' visit ' + step.areaId);
    if (step.kind === 'touch') {
      step.tokens.forEach(function (t) {
        var area = Game.World.getArea(t.areaId);
        if (!area) { badRefs.push(q.id + ' touch area ' + t.areaId); return; }
        var hasToken = (area.questTokens || []).some(function (qt) { return qt.label === t.label; });
        if (!hasToken) badRefs.push(q.id + ' touch token missing in area data: ' + t.label);
      });
    }
  });
});
assert(badRefs.length === 0, 'all quest data refs resolve' + (badRefs.length ? ': ' + badRefs.join(', ') : ''));
assert(!!Game.Battle.getMonsterDef('oruk_ravager') && Game.Battle.getMonsterDef('oruk_ravager').level === 7, 'oruk_ravager exists at level 7');
var kuraan = Game.World.getArea('kuraan_border_woods');
assert(kuraan.monsters.indexOf('oruk_ravager') !== -1, 'oruk_ravager huntable in Kuraan Border Woods');
['eldor', 'jumak_village', 'laik'].forEach(function (aid) {
  assert(!!Game.World.getFacility(Game.World.getArea(aid), 'tavern'), aid + ' has a tavern');
});
// Verbatim spot-checks against the archived prose.
var prelude = Game.Data.story[0];
assert(prelude.text.indexOf("Van Arius doesn't need a hero") !== -1, 'Prelude contains archived line verbatim');
var ch1 = Game.Data.story[1];
assert(ch1.text.indexOf('ninth-dimensional matter, was the life-force of Exos itself') !== -1, 'Chapter I contains archived line verbatim');
assert(ch1.text.indexOf('Skyspire') !== -1, 'Chapter I mentions the Skyspire');

// =================== Test 1: accept at giver only ===================
console.log('\n=== Test 1: accept requires being at the giver area ===');
var c1 = makeCharacter({ name: 'AcceptTest' });
Game.World.travelTo('plains_of_averast');
var res1a = Game.Quests.accept('tutorial_first_blood');
assert(res1a.ok === false && /Eldor/.test(res1a.message), 'accept blocked away from giver: ' + res1a.message);
Game.World.travelTo('eldor');
var res1b = Game.Quests.accept('tutorial_first_blood');
assert(res1b.ok === true, 'accept succeeds at giver: ' + res1b.message);
assert(c1.quests['tutorial_first_blood'] && c1.quests['tutorial_first_blood'].status === 'active', 'quest entry active');
var res1c = Game.Quests.accept('tutorial_first_blood');
assert(res1c.ok === false, 'double-accept rejected');

// =================== Test 2: Oruk level band ===================
console.log('\n=== Test 2: Oruk band — rejected at 4 and 11, accepted at 7; turn-in re-checks ===');
var c2 = makeCharacter({ name: 'OrukTest' });
c2.level = 6; // pass Ju`Mak's own level gate for travel
Game.World.travelTo('jumak_village');
c2.level = 4;
var res2a = Game.Quests.accept('the_oruk');
assert(res2a.ok === false && /Level 5/.test(res2a.message), 'Oruk rejected at level 4: ' + res2a.message);
c2.level = 11;
var res2b = Game.Quests.accept('the_oruk');
assert(res2b.ok === false && /Level 10/.test(res2b.message), 'Oruk rejected at level 11: ' + res2b.message);
c2.level = 7;
var res2c = Game.Quests.accept('the_oruk');
assert(res2c.ok === true, 'Oruk accepted at level 7');
// Force-satisfy, outlevel the band, then try to turn in.
Game._debug.completeQuestStep('the_oruk');
assert(Game.Quests.canTurnIn('the_oruk') === true, 'Oruk steps force-satisfied');
c2.level = 11;
var res2d = Game.Quests.turnIn('the_oruk');
assert(res2d.ok === false && /Level 10/.test(res2d.message), 'Oruk turn-in rejected at level 11 (band re-checked): ' + res2d.message);
c2.level = 9;
var res2e = Game.Quests.turnIn('the_oruk');
assert(res2e.ok === true, 'Oruk turn-in succeeds back inside the band at level 9');

// =================== Test 3: kill progress only while active; multi-reward turn-in ===================
console.log('\n=== Test 3: kill progress gating + full multi-reward grant (gold+xp+items+TP) ===');
var c3 = makeCharacter({ name: 'KillTest' });
c3.level = 6;
Game.World.travelTo('kuraan_border_woods');
winBattle('majiku_forest_scout'); // kill BEFORE accepting
assert(!c3.quests['veteran_of_averast'], 'no quest entry before accept (pre-accept kill ignored)');
Game.World.travelTo('jumak_village');
var res3a = Game.Quests.accept('veteran_of_averast');
assert(res3a.ok === true, 'veteran quest accepted');
assert((c3.quests['veteran_of_averast'].progress.kills['majiku_forest_scout'] || 0) === 0, 'progress starts at 0 despite earlier kill');
Game.World.travelTo('kuraan_border_woods');
for (var i = 0; i < 6; i++) winBattle('majiku_forest_scout');
assert(c3.quests['veteran_of_averast'].progress.kills['majiku_forest_scout'] === 6, 'kill progress reached 6/6');
winBattle('majiku_forest_scout');
assert(c3.quests['veteran_of_averast'].progress.kills['majiku_forest_scout'] === 6, 'kill progress capped at required count');
assert(Game.Quests.canTurnIn('veteran_of_averast') === true, 'canTurnIn true at count');
var res3b = Game.Quests.turnIn('veteran_of_averast');
assert(res3b.ok === false && /Return to/.test(res3b.message), 'turn-in blocked away from giver: ' + res3b.message);
Game.World.travelTo('jumak_village');
var goldBefore3 = Game.Character.goldTotalAsGold(c3);
var xpBefore3 = c3.xp;
var tpBefore3 = c3.trainingPoints;
var tentBefore3 = Game.Quests.inventoryCount(c3, 'tent_travelers_tent');
var res3c = Game.Quests.turnIn('veteran_of_averast');
assert(res3c.ok === true, 'turn-in succeeds at giver: ' + res3c.message);
assert(Game.Character.goldTotalAsGold(c3) === goldBefore3 + 60, 'gold reward granted (+60)');
assert(c3.xp === xpBefore3 + 90, 'xp reward granted (+90)');
assert(c3.trainingPoints === tpBefore3 + 3, 'Training Point reward granted (+3, archived Training_Points.md)');
assert(Game.Quests.inventoryCount(c3, 'tent_travelers_tent') === tentBefore3 + 1, 'item reward granted (tent upgrade)');
assert(c3.quests['veteran_of_averast'].status === 'completed', 'quest marked completed');
// Kill after completion: no further tracking issues
winBattle('majiku_war_shaman');
assert(c3.quests['veteran_of_averast'].status === 'completed', 'completed entry untouched by later kills');

// =================== Test 4: cutoff wins still count for quests ===================
console.log('\n=== Test 4: cutoff win (5+ levels above) still records the quest kill ===');
var c4 = makeCharacter({ name: 'CutoffTest' });
var res4a = Game.Quests.accept('tutorial_first_blood');
assert(res4a.ok === true, 'tutorial accepted at level 1');
c4.level = 20; // far above the rat — XP/loot cutoff applies
Game.World.travelTo('plains_of_averast');
winBattle('plains_field_rat');
assert(c4.quests['tutorial_first_blood'].progress.kills['plains_field_rat'] === 1, 'cutoff kill still counted (a kill is a kill)');

// =================== Test 5: collect quest ===================
console.log('\n=== Test 5: collect turn-in blocked without items; consumes exactly the required count ===');
var c5 = makeCharacter({ name: 'CollectTest' });
var res5a = Game.Quests.accept('eldor_dr_ferrier');
assert(res5a.ok === true, 'Dr. Ferrier quest accepted in Eldor');
assert(Game.Quests.canTurnIn('eldor_dr_ferrier') === false, 'canTurnIn false with 0/4 glands');
var res5b = Game.Quests.turnIn('eldor_dr_ferrier');
assert(res5b.ok === false, 'turn-in blocked without items: ' + res5b.message);
for (var g = 0; g < 5; g++) Game.Inventory.addItem(c5, 'quest_majiku_venom_gland'); // one surplus
assert(Game.Quests.canTurnIn('eldor_dr_ferrier') === true, 'canTurnIn true with 5/4 glands carried');
var goldBefore5 = Game.Character.goldTotalAsGold(c5);
var res5c = Game.Quests.turnIn('eldor_dr_ferrier');
assert(res5c.ok === true, 'collect turn-in succeeds: ' + res5c.message);
assert(Game.Quests.inventoryCount(c5, 'quest_majiku_venom_gland') === 1, 'exactly 4 glands consumed, surplus kept');
assert(Game.Character.goldTotalAsGold(c5) === goldBefore5 + 90, 'collect quest gold granted');

// =================== Test 6: touch quest (Standing Stones) ===================
console.log('\n=== Test 6: touch only in token area; cancel resets stones; re-accept starts clean ===');
var c6 = makeCharacter({ name: 'StonesTest' });
var res6a = Game.Quests.accept('standing_stones');
assert(res6a.ok === true, 'Standing Stones accepted in Eldor');
var res6b = Game.Quests.touch('standing_stones', 0); // plains stone, but we are in Eldor
assert(res6b.ok === false && /Plains of Averast/.test(res6b.message), 'stone untouchable outside its area: ' + res6b.message);
Game.World.travelTo('plains_of_averast');
var res6c = Game.Quests.touch('standing_stones', 0);
assert(res6c.ok === true, 'plains stone touched in the plains');
var res6d = Game.Quests.touch('standing_stones', 1); // ruins stone from the plains
assert(res6d.ok === false, 'ruins stone untouchable from the plains');
var res6e = Game.Quests.touch('standing_stones', 0);
assert(res6e.ok === false && /already/.test(res6e.message), 'double-touch rejected');
assert(c6.quests['standing_stones'].progress.touched['plains_of_averast'] === true, 'touched progress stored');
// Cancel resets (archived: Recent_Updates.md 2007-05-09)
var res6f = Game.Quests.cancel('standing_stones');
assert(res6f.ok === true, 'Standing Stones canceled via quest module (Journal path tested below)');
assert(!c6.quests['standing_stones'], 'quest entry removed on cancel');
Game.World.travelTo('eldor');
var res6g = Game.Quests.accept('standing_stones');
assert(res6g.ok === true, 're-accept succeeds');
assert(!c6.quests['standing_stones'].progress.touched['plains_of_averast'], 're-accept starts with all stones reset (archived behavior)');
// Complete all three stones and turn in.
c6.level = 8; // clear the level gates for ruins (4) and Kuraan (6)
Game.World.travelTo('plains_of_averast');
Game.Quests.touch('standing_stones', 0);
Game.World.travelTo('estari_ruins');
Game.Quests.touch('standing_stones', 1);
Game.World.travelTo('kuraan_border_woods');
var res6h = Game.Quests.touch('standing_stones', 2);
assert(res6h.ok === true, 'third stone touched');
assert(Game.Quests.canTurnIn('standing_stones') === true, 'all stones touched -> canTurnIn');
Game.World.travelTo('eldor');
var res6i = Game.Quests.turnIn('standing_stones');
assert(res6i.ok === true, 'Standing Stones turned in: ' + res6i.message);

// =================== Test 7: reward item over capacity ===================
console.log('\n=== Test 7: over-capacity reward — nothing lost, quest stays turn-in-able ===');
var c7 = makeCharacter({ name: 'HeavyReward' });
c7.level = 8;
var res7a = Game.Quests.accept('ruin_warden_boss');
assert(res7a.ok === true, 'boss quest accepted in Eldor');
Game._debug.completeQuestStep('ruin_warden_boss');
assert(Game.Quests.canTurnIn('ruin_warden_boss') === true, 'boss quest force-satisfied');
var strengthBackup7 = c7.strength;
c7.strength = 0; // capacity 0 -> reward tablet (weight 2) cannot fit
var goldBefore7 = Game.Character.goldTotalAsGold(c7);
var tpBefore7 = c7.trainingPoints;
var res7b = Game.Quests.turnIn('ruin_warden_boss');
assert(res7b.ok === false && /weight/i.test(res7b.message), 'turn-in refused when reward cannot be carried: ' + res7b.message);
assert(c7.quests['ruin_warden_boss'].status === 'active', 'quest still active after refused turn-in');
assert(Game.Quests.canTurnIn('ruin_warden_boss') === true, 'quest still turn-in-able');
assert(Game.Character.goldTotalAsGold(c7) === goldBefore7 && c7.trainingPoints === tpBefore7, 'no partial rewards granted on refusal');
c7.strength = strengthBackup7;
var res7c = Game.Quests.turnIn('ruin_warden_boss');
assert(res7c.ok === true, 'turn-in succeeds once capacity is restored: ' + res7c.message);
assert(Game.Quests.inventoryCount(c7, 'lore_estari_shard_tablet') === 1, 'reward item landed, nothing lost');
assert(c7.trainingPoints === tpBefore7 + 2, 'TP reward landed (+2)');

// =================== Test 8: boss quest completes off a real Ruin Warden win ===================
console.log('\n=== Test 8: boss quest progress from an actual estari_ruin_warden battle ===');
var c8 = makeCharacter({ name: 'BossTest' });
c8.level = 8;
Game.Character.recalcDerived(c8);
c8.hitPoints = c8.hitPointsMax;
var res8a = Game.Quests.accept('ruin_warden_boss');
assert(res8a.ok === true, 'boss quest accepted');
Game.World.travelTo('estari_ruins');
winBattle('estari_ruin_warden');
assert(c8.quests['ruin_warden_boss'].progress.kills['estari_ruin_warden'] === 1, 'Ruin Warden kill recorded');
assert(Game.Quests.canTurnIn('ruin_warden_boss') === true, 'boss quest complete off the lair win');

// =================== Test 9: delivery quest (acceptItems + visit) ===================
console.log('\n=== Test 9: delivery — crate granted on accept, reclaimed on cancel, visit satisfies ===');
var c9 = makeCharacter({ name: 'DeliveryTest' });
c9.level = 6;
var res9a = Game.Quests.accept('delivery_to_jumak');
assert(res9a.ok === true, 'delivery quest accepted');
assert(Game.Quests.inventoryCount(c9, 'quest_sealed_supply_crate') === 1, 'crate handed over on accept');
Game.Quests.cancel('delivery_to_jumak');
assert(Game.Quests.inventoryCount(c9, 'quest_sealed_supply_crate') === 0, 'crate reclaimed on cancel');
Game.Quests.accept('delivery_to_jumak');
assert(Game.Quests.inventoryCount(c9, 'quest_sealed_supply_crate') === 1, 're-accept grants exactly one crate');
assert(Game.Quests.canTurnIn('delivery_to_jumak') === false, 'not turn-in-able before visiting Ju`Mak');
Game.World.travelTo('jumak_village');
assert(c9.quests['delivery_to_jumak'].progress.visited['jumak_village'] === true, 'visit recorded on travel');
Game.World.travelTo('eldor');
assert(Game.Quests.canTurnIn('delivery_to_jumak') === true, 'turn-in-able back in Eldor with crate + visit done');
var res9b = Game.Quests.turnIn('delivery_to_jumak');
assert(res9b.ok === true, 'delivery turned in: ' + res9b.message);
assert(Game.Quests.inventoryCount(c9, 'quest_sealed_supply_crate') === 0, 'crate consumed at turn-in');

// =================== Test 10: v4 -> v5 migration (and v1 -> v5 chain) ===================
console.log('\n=== Test 10: save migration adds quests:{} ===');
var v4Character = {
  race: 'Human', name: 'V4Timer', gender: 'Male',
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
  fury: 0,
  currentLocation: 'eldor',
  vault: { platinum: 0, gold: 0, items: [] },
  shrineBuffs: []
  // NOTE: no quests field — a real Phase 4 (v4) save.
};
localStorageStore['herorpg_save'] = JSON.stringify({ version: 4, state: { character: v4Character } });
var loaded10 = Game.Save.load();
assert(loaded10 !== null, 'v4 save loads');
assert(loaded10.character.quests && typeof loaded10.character.quests === 'object' && Object.keys(loaded10.character.quests).length === 0, 'migration adds empty quests map');
Game.state = loaded10;
Game.persist();
var resaved10 = JSON.parse(localStorageStore['herorpg_save']);
assert(resaved10.version === 9, 'resave stamps CURRENT_VERSION 9 (v1.2 Phase 1 equipment.offhand migration), got ' + resaved10.version);

// v1 -> v5 chain
var v1c = JSON.parse(JSON.stringify(v4Character));
delete v1c.inventory; delete v1c.equipment; delete v1c.equippedWeaponSkill;
delete v1c.techs; delete v1c.techSets; delete v1c.fury;
delete v1c.currentLocation; delete v1c.vault; delete v1c.shrineBuffs;
localStorageStore['herorpg_save'] = JSON.stringify({ version: 1, state: { character: v1c } });
var loaded1 = Game.Save.load();
assert(loaded1 !== null && Array.isArray(loaded1.character.inventory) && Array.isArray(loaded1.character.techSets) &&
  loaded1.character.currentLocation === 'eldor' && loaded1.character.vault &&
  loaded1.character.quests && Object.keys(loaded1.character.quests).length === 0,
  'v1 save chains through v2/v3/v4 to v5 with quests:{}');

// =================== Test 11: Journal renders (all 3 tabs) ===================
console.log('\n=== Test 11: Journal Active/Completed/Story tabs render ===');
var c11 = makeCharacter({ name: 'JournalTest' });
Game.state.character = c11;
Game.state.battle = null;
Game.Quests.accept('tutorial_first_blood');
Game._debug.acceptQuest('eldor_dr_ferrier');
Game._debug.completeQuestStep('eldor_dr_ferrier');
Game.Quests.turnIn('eldor_dr_ferrier'); // gives one completed quest
try {
  Game.Screens.navigate('journal');
  var journalText = document.getElementById('maincontent').textContent;
  assert(/First Blood/.test(journalText), 'Active tab lists the tutorial quest');
  assert(/slain: 0\/3/.test(journalText), 'Active tab shows kill progress 0/3');
  assert(journalText.indexOf('Cancel') !== -1, 'Active tab has a Cancel button');
} catch (e) { failures++; console.error('FAIL: journal (active) threw: ' + e.stack); }

// Switch to Completed tab
try {
  var tabs = document.getElementById('maincontent').queryAllByClass('infobox-tab');
  var completedTab = tabs.filter(function (t) { return t.textContent === 'Completed'; })[0];
  completedTab.click();
  var completedText = document.getElementById('maincontent').textContent;
  assert(/Dr\. Ferrier/.test(completedText), 'Completed tab lists the finished quest');
  assert(/Splendid specimens/.test(completedText), 'Completed tab shows completion text');
} catch (e) { failures++; console.error('FAIL: journal (completed) threw: ' + e.stack); }

// Switch to Story tab and open a chapter
try {
  var tabs11 = document.getElementById('maincontent').queryAllByClass('infobox-tab');
  var storyTab = tabs11.filter(function (t) { return t.textContent === 'Story'; })[0];
  storyTab.click();
  var storyText = document.getElementById('maincontent').textContent;
  assert(/Prelude/.test(storyText) && /Chapter I(?!I)/.test(storyText) && /Chapter II/.test(storyText), 'Story tab lists all 3 chapters');
  var readButtons = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Read'; });
  assert(readButtons.length === 3, 'Story tab has 3 Read buttons');
  readButtons[0].click();
  var proseText = document.getElementById('maincontent').textContent;
  assert(/Van Arius doesn't need a hero/.test(proseText), 'Prelude prose renders after Read click');
} catch (e) { failures++; console.error('FAIL: journal (story) threw: ' + e.stack); }

// Journal Turn In button appears when ready at giver; Cancel via Journal resets stones.
try {
  Game.Quests.accept('standing_stones');
  Game.World.travelTo('plains_of_averast');
  Game.Quests.touch('standing_stones', 0);
  Game.Screens.navigate('journal');
  // journalTab persists across navigations (module state) — switch back to Active first.
  var tabsBack = document.getElementById('maincontent').queryAllByClass('infobox-tab');
  tabsBack.filter(function (t) { return t.textContent === 'Active'; })[0].click();
  var stonesText = document.getElementById('maincontent').textContent;
  assert(/\[x\] Weathered Standing Stone/.test(stonesText), 'Journal shows touched stone checked');
  assert(/\[ \] Cracked Standing Stone/.test(stonesText), 'Journal shows untouched stone unchecked');
  var cancelBtns = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Cancel'; });
  assert(cancelBtns.length >= 1, 'Cancel buttons render in Journal');
  // Cancel the LAST active quest (standing_stones is listed after tutorial in data order)
  cancelBtns[cancelBtns.length - 1].click();
  assert(!c11.quests['standing_stones'], 'cancel via Journal removes the quest (stones reset)');
} catch (e) { failures++; console.error('FAIL: journal cancel flow threw: ' + e.stack); }

// =================== Test 12: Tavern renders in Eldor with the level-1 quest ===================
console.log('\n=== Test 12: Tavern facility panel in Eldor ===');
var c12 = makeCharacter({ name: 'TavernTest' });
Game.state.character = c12;
try {
  Game.Screens.navigate('town');
  var rows = document.getElementById('maincontent').queryAllByClass('stat-row');
  var tavernHeader = rows.filter(function (r) { return r.textContent.indexOf('Tavern') !== -1; })[0];
  assert(!!tavernHeader, 'Tavern facility header present in Eldor');
  tavernHeader.click();
  var townText = document.getElementById('maincontent').textContent;
  assert(/First Blood/.test(townText), 'Tavern lists the level-1 tutorial quest');
  assert(/Rosalind/.test(townText), 'Tavern shows the giver NPC');
  assert(/The Standing Stones/.test(townText), 'Tavern lists Standing Stones');
  assert(/The Warden of the Ruins/.test(townText), 'Tavern lists the boss quest (greyed at level 1)');
  assert(/Requires Level 8/.test(townText), 'ineligible quest shows the level reason');
  // Accept via the Tavern UI
  var acceptBtns = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Accept'; });
  assert(acceptBtns.length >= 1, 'Accept buttons render for eligible quests');
  acceptBtns[0].click();
  assert(c12.quests['tutorial_first_blood'] && c12.quests['tutorial_first_blood'].status === 'active', 'Accept click accepts the tutorial quest');
  var townText2 = document.getElementById('maincontent').textContent;
  assert(/Already accepted/.test(townText2), 'accepted quest now shown greyed with reason');
} catch (e) { failures++; console.error('FAIL: tavern panel threw: ' + e.stack); }

// =================== Test 13: touch-token link on the Explore screen ===================
console.log('\n=== Test 13: Standing Stone link in hunting-area Explore actions ===');
var c13 = makeCharacter({ name: 'ExploreTouch' });
Game.state.character = c13;
try {
  Game.World.travelTo('plains_of_averast');
  Game.Screens.navigate('explore');
  var beforeText = document.getElementById('maincontent').textContent;
  assert(beforeText.indexOf('Weathered Standing Stone') === -1, 'no stone link without the active quest');
  Game._debug.acceptQuest('standing_stones');
  Game.Screens.navigate('explore');
  var afterText = document.getElementById('maincontent').textContent;
  assert(afterText.indexOf('Weathered Standing Stone') !== -1, 'stone link appears with the quest active');
  var touchBtns = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Touch'; });
  assert(touchBtns.length === 1, 'exactly one Touch button in the plains');
  touchBtns[0].click();
  assert(c13.quests['standing_stones'].progress.touched['plains_of_averast'] === true, 'Touch click marks the stone');
  Game.Screens.navigate('explore');
  var touchedText = document.getElementById('maincontent').textContent;
  assert(touchedText.indexOf('Weathered Standing Stone') === -1, 'stone link hidden once touched');
} catch (e) { failures++; console.error('FAIL: explore touch link threw: ' + e.stack); }

// =================== Test 14: full no-debug loop ===================
console.log('\n=== Test 14: full loop — accept tutorial, kill 3 rats in the Plains, return, turn in ===');
var c14 = makeCharacter({ name: 'LoopTest' });
Game.state.character = c14;
assert(c14.currentLocation === 'eldor', 'loop: starts in Eldor');
var loopAccept = Game.Quests.accept('tutorial_first_blood');
assert(loopAccept.ok === true, 'loop: tutorial accepted at the Eldor tavern');
Game.World.travelTo('plains_of_averast');
for (var r = 0; r < 3; r++) winBattle('plains_field_rat');
assert(c14.quests['tutorial_first_blood'].progress.kills['plains_field_rat'] === 3, 'loop: 3 rats slain');
assert(Game.Quests.canTurnIn('tutorial_first_blood') === true, 'loop: quest ready');
Game.World.travelTo('eldor');
var goldBefore14 = Game.Character.goldTotalAsGold(c14);
var xpBefore14 = c14.xp;
var potionsBefore14 = Game.Quests.inventoryCount(c14, 'potion_minor_healing');
var loopTurnIn = Game.Quests.turnIn('tutorial_first_blood');
assert(loopTurnIn.ok === true, 'loop: turned in: ' + loopTurnIn.message);
assert(Game.Character.goldTotalAsGold(c14) === goldBefore14 + 25, 'loop: +25 gold landed');
assert(c14.xp === xpBefore14 + 20, 'loop: +20 XP landed');
assert(Game.Quests.inventoryCount(c14, 'potion_minor_healing') === potionsBefore14 + 1, 'loop: potion reward landed');
assert(c14.quests['tutorial_first_blood'].status === 'completed', 'loop: quest completed');
// And it no longer shows as available at the tavern.
var avail14 = Game.Quests.availableAt('eldor');
assert(!avail14.some(function (rec) { return rec.quest.id === 'tutorial_first_blood'; }), 'loop: completed quest no longer offered');

// =================== Test 15: Professor Flad relocated to Laik (v1.2 Phase 3 Content-A) ===================
console.log('\n=== Test 15: Professor Flad no longer offered at Ju`Mak, now offered (and level-gated) at Laik ===');
var c15b = makeCharacter({ name: 'FladRelocTest' });
c15b.level = 6; // Ju`Mak's own travel gate
Game.World.travelTo('jumak_village');
var avail15a = Game.Quests.availableAt('jumak_village');
assert(!avail15a.some(function (rec) { return rec.quest.id === 'professor_flad'; }), 'professor_flad no longer offered at Ju`Mak Village');
var resFladJumak = Game.Quests.accept('professor_flad');
assert(resFladJumak.ok === false, 'accepting professor_flad at Ju`Mak fails (wrong giver area): ' + resFladJumak.message);

assert(Game.Quests.getQuest('professor_flad').levelMin === 8, 'professor_flad levelMin bumped to 8, matching Laik\'s own minLevel');
c15b.level = 7;
Game.World.travelTo('jumak_village'); // still below Laik's minLevel 8
var resFladTooLow = Game.World.travelTo('laik');
assert(resFladTooLow.ok === false, 'cannot reach Laik below its minLevel 8: ' + resFladTooLow.message);

c15b.level = 8;
var resFladTravel = Game.World.travelTo('laik');
assert(resFladTravel.ok === true, 'Laik reachable at level 8: ' + resFladTravel.message);
var avail15b = Game.Quests.availableAt('laik');
assert(avail15b.some(function (rec) { return rec.quest.id === 'professor_flad'; }), 'professor_flad now offered at Laik');
var resFladLaik = Game.Quests.accept('professor_flad');
assert(resFladLaik.ok === true, 'professor_flad accepted at Laik: ' + resFladLaik.message);
assert(c15b.quests['professor_flad'] && c15b.quests['professor_flad'].status === 'active', 'professor_flad active for this character');

// =================== Test 16: requiresRace gating — Arkan questline refused for Humans, allowed for Arkan ===================
console.log('\n=== Test 16: requiresRace gate (v1.2 Phase 3 Content-A) refuses Humans, allows Arkan ===');
var c16human = makeCharacter({ name: 'RaceGateHuman' });
Game._debug.goto('saratus'); // bypass the minLevel 14 travel gate — isolate the race check, not the level check
assert(c16human.currentLocation === 'saratus', 'sanity: Human test character placed in Saratus via debug goto');
var resHuman16 = Game.Quests.accept('arkan_first_rite');
assert(resHuman16.ok === false && /Arkan/.test(resHuman16.message), 'Human refused the Arkan questline: ' + resHuman16.message);
assert(!c16human.quests['arkan_first_rite'], 'no quest entry created for the refused Human');
// Not offered to Humans in the tavern list either? availableAt does not filter by requiresRace
// (mirrors the existing level-window behavior — quests can be LISTED and then refused at
// accept() with a clear reason), so this only asserts the accept()-time gate.

// requiresRace also enforced for the other two Arkan quests (isolate the race check by clearing
// the level gate too, same as above). Done BEFORE creating any other character below — makeCharacter's
// Game.Character.create() call reassigns Game.state.character as a side effect, so c16human must
// stay the active Game.state.character for every accept() call made on its behalf.
c16human.level = 6; // clears arkan_battlemage_trial's levelMin so the race gate is the only thing left to trip
var resHumanBattlemage16 = Game.Quests.accept('arkan_battlemage_trial');
assert(resHumanBattlemage16.ok === false && /Arkan/.test(resHumanBattlemage16.message), 'arkan_battlemage_trial also refused for this Human on the race gate specifically: ' + resHumanBattlemage16.message);

var c16arkan = makeCharacter({ name: 'RaceGateArkan', race: 'Arkan' });
assert(c16arkan.currentLocation === 'saratus', 'sanity: fresh Arkan already starts in Saratus, the quest giver area');
var resArkan16 = Game.Quests.accept('arkan_first_rite');
assert(resArkan16.ok === true, 'Arkan allowed to accept the Arkan questline: ' + resArkan16.message);
assert(c16arkan.quests['arkan_first_rite'] && c16arkan.quests['arkan_first_rite'].status === 'active', 'quest entry active for the accepting Arkan');

// =================== Test 17: Arkan questline full flow (accept -> kill -> turn-in -> rewards) ===================
console.log('\n=== Test 17: arkan_first_rite full accept/kill/turn-in flow with multi-reward grant ===');
var c17 = makeCharacter({ name: 'ArkanFlowTest', race: 'Arkan' });
assert(c17.currentLocation === 'saratus', 'sanity: fresh Arkan starts in Saratus');
var resAccept17 = Game.Quests.accept('arkan_first_rite');
assert(resAccept17.ok === true, 'arkan_first_rite accepted: ' + resAccept17.message);
assert(Game.Quests.canTurnIn('arkan_first_rite') === false, 'canTurnIn false with 0/3 rats slain');
for (var k17 = 0; k17 < 3; k17++) winBattle('plains_field_rat');
assert(c17.quests['arkan_first_rite'].progress.kills['plains_field_rat'] === 3, 'kill progress reached 3/3');
assert(Game.Quests.canTurnIn('arkan_first_rite') === true, 'canTurnIn true at count');
assert(c17.currentLocation === 'saratus', 'sanity: still in Saratus (winBattle does not travel), so turn-in needs no extra travel');
var goldBefore17 = Game.Character.goldTotalAsGold(c17);
var xpBefore17 = c17.xp;
var potionsBefore17 = Game.Quests.inventoryCount(c17, 'potion_minor_healing');
var resTurnIn17 = Game.Quests.turnIn('arkan_first_rite');
assert(resTurnIn17.ok === true, 'arkan_first_rite turned in: ' + resTurnIn17.message);
assert(Game.Character.goldTotalAsGold(c17) === goldBefore17 + 25, 'gold reward granted (+25)');
assert(c17.xp === xpBefore17 + 20, 'xp reward granted (+20)');
assert(Game.Quests.inventoryCount(c17, 'potion_minor_healing') === potionsBefore17 + 1, 'item reward granted (potion)');
assert(c17.quests['arkan_first_rite'].status === 'completed', 'quest marked completed');
// A Human cannot even reach this far (refused at accept, per Test 16) — no further cross-race
// regression risk to check here.

// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
