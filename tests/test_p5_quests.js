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
assert(Game.Data.quests.length === 37, '37 quests defined (22 pre-v1.2-Phase-3 + v1.2 Phase 3 Content-A\'s arkan_first_rite/arkan_battlemage_trial/arkan_red_moon_whispers + Level-Arc Band A\'s reclaim_the_fringe/wraiths_of_the_deepwood/the_warlords_end + Band B\'s break_the_majiku_host/storms_over_the_ridge/the_chieftains_reckoning + Band C\'s win_passage_from_the_ukai/what_slips_through_the_ice/the_deep_dwellers_reckoning + Band D\'s the_taboo_wellspring/what_the_wellspring_woke/the_warden_primes_reckoning), got ' + Game.Data.quests.length);
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

// =================== Test 18: Level-Arc Band A quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 18: Band A quests — reclaim_the_fringe / wraiths_of_the_deepwood / the_warlords_end ===');

// 18a) main-spine quest: accept at the camp, force-satisfy its kill/collect/visit steps, turn in
// for the full multi-reward (mirrors Test 2's the_oruk use of Game._debug.completeQuestStep).
var c18 = makeCharacter({ name: 'BandAMainTest' });
c18.level = 44;
Game.World.travelTo('kuraan_reclamation_camp');
var res18a = Game.Quests.accept('reclaim_the_fringe');
assert(res18a.ok === true, 'reclaim_the_fringe accepted at Kuraan Reclamation Camp: ' + res18a.message);
assert(Game.Quests.canTurnIn('reclaim_the_fringe') === false, 'reclaim_the_fringe not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('reclaim_the_fringe');
assert(Game.Quests.canTurnIn('reclaim_the_fringe') === true, 'reclaim_the_fringe steps force-satisfied (5x kill + 3x collect + visit deep_kuraan)');
var gold18a = Game.Character.goldTotalAsGold(c18);
var xp18a = c18.xp;
var tp18a = c18.trainingPoints;
var res18b = Game.Quests.turnIn('reclaim_the_fringe');
assert(res18b.ok === true, 'reclaim_the_fringe turn-in succeeds: ' + res18b.message);
assert(Game.Character.goldTotalAsGold(c18) === gold18a + 900, 'reclaim_the_fringe grants +900 gold');
assert(c18.xp === xp18a + 1400, 'reclaim_the_fringe grants +1400 xp');
assert(c18.trainingPoints === tp18a + 3, 'reclaim_the_fringe grants +3 Training Points');
assert(Game.Quests.inventoryCount(c18, 'sword_kuraan_reclaimers_blade') >= 1, "reclaim_the_fringe grants a Reclaimer's Blade");
assert(c18.quests['reclaim_the_fringe'].status === 'completed', 'reclaim_the_fringe marked completed');

// Band A monsters hit far harder than the 1-40 roster (damage ~3+2*level); a level-46+ test
// character still carries level-1 base HP unless stat points are spent into Vitality (Vitality
// only drives hitPointsMax via HP_PER_VITALITY, js/core/character.js — level alone does not), so
// winBattle's opening "monster strikes first" exchange (js/core/battle.js start(), playerFirst
// compares Dexterity to monster.level) would otherwise one-shot a bare level-1-HP test character
// before the helper ever gets to zero the monster's own hp. Grant this era's worth of stat points
// into Vitality first, mirroring test_p6b_content.js's buildLevel40Warrior pattern.
function grantVitalityForLevel(c, level) {
  c.level = level;
  c.xp = BALANCE.XP_TO_LEVEL(level);
  c.statPoints += (level - 1) * BALANCE.LEVELUP_STAT_POINTS - c.statPoints;
  var pts = c.statPoints;
  for (var i = 0; i < pts; i++) Game.Character.spendStatPoint(c, 'vitality');
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
}

// 18b) side quest: REAL kill progress (not force-satisfied) via winBattle against the new Deep
// Kuraan regulars, same pattern as Test 3's veteran_of_averast loop.
var c19 = makeCharacter({ name: 'BandASideTest' });
grantVitalityForLevel(c19, 46);
Game.World.travelTo('kuraan_reclamation_camp');
var res19a = Game.Quests.accept('wraiths_of_the_deepwood');
assert(res19a.ok === true, 'wraiths_of_the_deepwood accepted: ' + res19a.message);
Game.World.travelTo('deep_kuraan');
for (var w18 = 0; w18 < 4; w18++) winBattle('kuraan_hollow_wraith');
assert(c19.quests['wraiths_of_the_deepwood'].progress.kills['kuraan_hollow_wraith'] === 4, 'real kill progress reached 4/4 via winBattle against kuraan_hollow_wraith');
assert(Game.Quests.canTurnIn('wraiths_of_the_deepwood') === true, 'wraiths_of_the_deepwood turn-in-able after 4 real kills');
Game.World.travelTo('kuraan_reclamation_camp');
var res19b = Game.Quests.turnIn('wraiths_of_the_deepwood');
assert(res19b.ok === true, 'wraiths_of_the_deepwood turn-in succeeds: ' + res19b.message);
assert(Game.Quests.inventoryCount(c19, 'sphere_cclass_2') >= 1, 'wraiths_of_the_deepwood grants a C-Class Sphere II');

// 18c) boss-kill side quest: REAL kill via winBattle against the Band A lair boss itself.
var c20 = makeCharacter({ name: 'BandABossTest' });
grantVitalityForLevel(c20, 50);
Game.World.travelTo('kuraan_reclamation_camp');
var res20a = Game.Quests.accept('the_warlords_end');
assert(res20a.ok === true, 'the_warlords_end accepted: ' + res20a.message);
Game.World.travelTo('deep_kuraan');
winBattle('majiku_warlord');
assert(c20.quests['the_warlords_end'].progress.kills['majiku_warlord'] === 1, 'majiku_warlord kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('kuraan_reclamation_camp');
var res20b = Game.Quests.turnIn('the_warlords_end');
assert(res20b.ok === true, 'the_warlords_end turn-in succeeds: ' + res20b.message);
assert(c20.quests['the_warlords_end'].status === 'completed', 'the_warlords_end marked completed');
assert(Game.Quests.inventoryCount(c20, 'heavy_head_kuraan_warhelm') >= 1, 'the_warlords_end grants the Kuraan Warhelm');

// =================== Test 19: Level-Arc Band B quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 19: Band B quests — break_the_majiku_host / storms_over_the_ridge / the_chieftains_reckoning ===');

// 19a) main-spine quest: accept at the (reused) camp, force-satisfy its kill/collect/visit steps,
// turn in for the full multi-reward (mirrors Test 18a's reclaim_the_fringe pattern).
var c21 = makeCharacter({ name: 'BandBMainTest' });
grantVitalityForLevel(c21, 51);
Game.World.travelTo('kuraan_reclamation_camp');
var res21a = Game.Quests.accept('break_the_majiku_host');
assert(res21a.ok === true, 'break_the_majiku_host accepted at Kuraan Reclamation Camp: ' + res21a.message);
assert(Game.Quests.canTurnIn('break_the_majiku_host') === false, 'break_the_majiku_host not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('break_the_majiku_host');
assert(Game.Quests.canTurnIn('break_the_majiku_host') === true, 'break_the_majiku_host steps force-satisfied (5x kill + 3x collect + visit highland_war_camps)');
var gold21a = Game.Character.goldTotalAsGold(c21);
var xp21a = c21.xp;
var tp21a = c21.trainingPoints;
var res21b = Game.Quests.turnIn('break_the_majiku_host');
assert(res21b.ok === true, 'break_the_majiku_host turn-in succeeds: ' + res21b.message);
assert(Game.Character.goldTotalAsGold(c21) === gold21a + 1100, 'break_the_majiku_host grants +1100 gold');
assert(c21.xp === xp21a + 1700, 'break_the_majiku_host grants +1700 xp');
assert(c21.trainingPoints === tp21a + 3, 'break_the_majiku_host grants +3 Training Points');
assert(Game.Quests.inventoryCount(c21, 'sword_majiku_hostbreaker') >= 1, 'break_the_majiku_host grants a Hostbreaker Blade');
assert(c21.quests['break_the_majiku_host'].status === 'completed', 'break_the_majiku_host marked completed');

// 19b) side quest: REAL kill progress (not force-satisfied) via winBattle against the Highland
// War-Camps regulars, same pattern as Test 18b's wraiths_of_the_deepwood loop.
var c22 = makeCharacter({ name: 'BandBSideTest' });
grantVitalityForLevel(c22, 56);
Game.World.travelTo('kuraan_reclamation_camp');
var res22a = Game.Quests.accept('storms_over_the_ridge');
assert(res22a.ok === true, 'storms_over_the_ridge accepted: ' + res22a.message);
Game.World.travelTo('highland_war_camps');
for (var w19 = 0; w19 < 4; w19++) winBattle('highland_hollow_stormwraith');
assert(c22.quests['storms_over_the_ridge'].progress.kills['highland_hollow_stormwraith'] === 4, 'real kill progress reached 4/4 via winBattle against highland_hollow_stormwraith');
assert(Game.Quests.canTurnIn('storms_over_the_ridge') === true, 'storms_over_the_ridge turn-in-able after 4 real kills');
Game.World.travelTo('kuraan_reclamation_camp');
var res22b = Game.Quests.turnIn('storms_over_the_ridge');
assert(res22b.ok === true, 'storms_over_the_ridge turn-in succeeds: ' + res22b.message);
assert(Game.Quests.inventoryCount(c22, 'sphere_dclass_2') >= 1, 'storms_over_the_ridge grants a D-Class Sphere II');

// 19c) boss-kill side quest: REAL kill via winBattle against the Band B lair boss itself.
var c23 = makeCharacter({ name: 'BandBBossTest' });
grantVitalityForLevel(c23, 60);
Game.World.travelTo('kuraan_reclamation_camp');
var res23a = Game.Quests.accept('the_chieftains_reckoning');
assert(res23a.ok === true, 'the_chieftains_reckoning accepted: ' + res23a.message);
Game.World.travelTo('highland_war_camps');
winBattle('majiku_ridge_chieftain');
assert(c23.quests['the_chieftains_reckoning'].progress.kills['majiku_ridge_chieftain'] === 1, 'majiku_ridge_chieftain kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('kuraan_reclamation_camp');
var res23b = Game.Quests.turnIn('the_chieftains_reckoning');
assert(res23b.ok === true, 'the_chieftains_reckoning turn-in succeeds: ' + res23b.message);
assert(c23.quests['the_chieftains_reckoning'].status === 'completed', 'the_chieftains_reckoning marked completed');
assert(Game.Quests.inventoryCount(c23, 'heavy_head_ridgeplate_helm') >= 1, 'the_chieftains_reckoning grants the Ridgeplate Helm');

// =================== Test 20: Level-Arc Band C quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 20: Band C quests — win_passage_from_the_ukai / what_slips_through_the_ice / the_deep_dwellers_reckoning ===');

// 20a) main-spine quest: accept at Frosthold Waystation, force-satisfy its kill/collect/visit
// steps, turn in for the full multi-reward (mirrors Test 18a/19a's pattern).
var c24 = makeCharacter({ name: 'BandCMainTest' });
grantVitalityForLevel(c24, 65); // Frosthold Waystation gates travel at minLevel 65 (quest levelMin is 61)
Game.World.travelTo('frosthold_waystation');
var res24a = Game.Quests.accept('win_passage_from_the_ukai');
assert(res24a.ok === true, 'win_passage_from_the_ukai accepted at Frosthold Waystation: ' + res24a.message);
assert(Game.Quests.canTurnIn('win_passage_from_the_ukai') === false, 'win_passage_from_the_ukai not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('win_passage_from_the_ukai');
assert(Game.Quests.canTurnIn('win_passage_from_the_ukai') === true, 'win_passage_from_the_ukai steps force-satisfied (5x kill + 3x collect + visit ukai_undercaverns)');
var gold24a = Game.Character.goldTotalAsGold(c24);
var xp24a = c24.xp;
var tp24a = c24.trainingPoints;
var res24b = Game.Quests.turnIn('win_passage_from_the_ukai');
assert(res24b.ok === true, 'win_passage_from_the_ukai turn-in succeeds: ' + res24b.message);
assert(Game.Character.goldTotalAsGold(c24) === gold24a + 1300, 'win_passage_from_the_ukai grants +1300 gold');
assert(c24.xp === xp24a + 2000, 'win_passage_from_the_ukai grants +2000 xp');
assert(c24.trainingPoints === tp24a + 3, 'win_passage_from_the_ukai grants +3 Training Points');
assert(Game.Quests.inventoryCount(c24, 'sword_frosthold_vanguard_blade') >= 1, 'win_passage_from_the_ukai grants a Frosthold Vanguard Blade');
assert(c24.quests['win_passage_from_the_ukai'].status === 'completed', 'win_passage_from_the_ukai marked completed');

// 20b) side quest: REAL kill progress (not force-satisfied) via winBattle against the Ukai
// Undercaverns regulars, same pattern as Test 18b/19b's hunt-quest loop.
var c25 = makeCharacter({ name: 'BandCSideTest' });
grantVitalityForLevel(c25, 66);
Game.World.travelTo('frosthold_waystation');
var res25a = Game.Quests.accept('what_slips_through_the_ice');
assert(res25a.ok === true, 'what_slips_through_the_ice accepted: ' + res25a.message);
Game.World.travelTo('ukai_undercaverns');
for (var w20 = 0; w20 < 4; w20++) winBattle('ukai_hollow_deepling');
assert(c25.quests['what_slips_through_the_ice'].progress.kills['ukai_hollow_deepling'] === 4, 'real kill progress reached 4/4 via winBattle against ukai_hollow_deepling');
assert(Game.Quests.canTurnIn('what_slips_through_the_ice') === true, 'what_slips_through_the_ice turn-in-able after 4 real kills');
Game.World.travelTo('frosthold_waystation');
var res25b = Game.Quests.turnIn('what_slips_through_the_ice');
assert(res25b.ok === true, 'what_slips_through_the_ice turn-in succeeds: ' + res25b.message);
assert(Game.Quests.inventoryCount(c25, 'sphere_eclass_2') >= 1, 'what_slips_through_the_ice grants an E-Class Sphere II');

// 20c) boss-kill side quest: REAL kill via winBattle against the Band C lair boss itself.
var c26 = makeCharacter({ name: 'BandCBossTest' });
grantVitalityForLevel(c26, 70);
Game.World.travelTo('frosthold_waystation');
var res26a = Game.Quests.accept('the_deep_dwellers_reckoning');
assert(res26a.ok === true, 'the_deep_dwellers_reckoning accepted: ' + res26a.message);
Game.World.travelTo('ukai_undercaverns');
winBattle('ukai_deep_dweller');
assert(c26.quests['the_deep_dwellers_reckoning'].progress.kills['ukai_deep_dweller'] === 1, 'ukai_deep_dweller kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('frosthold_waystation');
var res26b = Game.Quests.turnIn('the_deep_dwellers_reckoning');
assert(res26b.ok === true, 'the_deep_dwellers_reckoning turn-in succeeds: ' + res26b.message);
assert(c26.quests['the_deep_dwellers_reckoning'].status === 'completed', 'the_deep_dwellers_reckoning marked completed');
assert(Game.Quests.inventoryCount(c26, 'heavy_head_glacial_warhelm') >= 1, 'the_deep_dwellers_reckoning grants the Glacial Warhelm');

// =================== Test 21: Level-Arc Band D quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 21: Band D quests — the_taboo_wellspring / what_the_wellspring_woke / the_warden_primes_reckoning ===');

// 21a) main-spine quest: accept at Frosthold Waystation, force-satisfy its kill/collect/visit
// steps, turn in for the full multi-reward (mirrors Test 20a's pattern).
var c27 = makeCharacter({ name: 'BandDMainTest' });
grantVitalityForLevel(c27, 71);
Game.World.travelTo('frosthold_waystation');
var res27a = Game.Quests.accept('the_taboo_wellspring');
assert(res27a.ok === true, 'the_taboo_wellspring accepted at Frosthold Waystation: ' + res27a.message);
assert(Game.Quests.canTurnIn('the_taboo_wellspring') === false, 'the_taboo_wellspring not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('the_taboo_wellspring');
assert(Game.Quests.canTurnIn('the_taboo_wellspring') === true, 'the_taboo_wellspring steps force-satisfied (5x kill + 3x collect + visit anima_wellspring)');
var gold27a = Game.Character.goldTotalAsGold(c27);
var xp27a = c27.xp;
var tp27a = c27.trainingPoints;
var res27b = Game.Quests.turnIn('the_taboo_wellspring');
assert(res27b.ok === true, 'the_taboo_wellspring turn-in succeeds: ' + res27b.message);
assert(Game.Character.goldTotalAsGold(c27) === gold27a + 1500, 'the_taboo_wellspring grants +1500 gold');
assert(c27.xp === xp27a + 2300, 'the_taboo_wellspring grants +2300 xp');
assert(c27.trainingPoints === tp27a + 3, 'the_taboo_wellspring grants +3 Training Points');
assert(Game.Quests.inventoryCount(c27, 'sword_estari_wardblade') >= 1, 'the_taboo_wellspring grants an Estari Wardblade');
assert(c27.quests['the_taboo_wellspring'].status === 'completed', 'the_taboo_wellspring marked completed');

// 21b) side quest: REAL kill progress (not force-satisfied) via winBattle against The Anima
// Wellspring regulars, same pattern as Test 20b's hunt-quest loop.
var c28 = makeCharacter({ name: 'BandDSideTest' });
grantVitalityForLevel(c28, 76);
Game.World.travelTo('frosthold_waystation');
var res28a = Game.Quests.accept('what_the_wellspring_woke');
assert(res28a.ok === true, 'what_the_wellspring_woke accepted: ' + res28a.message);
Game.World.travelTo('anima_wellspring');
for (var w21 = 0; w21 < 4; w21++) winBattle('raw_anima_horror');
assert(c28.quests['what_the_wellspring_woke'].progress.kills['raw_anima_horror'] === 4, 'real kill progress reached 4/4 via winBattle against raw_anima_horror');
assert(Game.Quests.canTurnIn('what_the_wellspring_woke') === true, 'what_the_wellspring_woke turn-in-able after 4 real kills');
Game.World.travelTo('frosthold_waystation');
var res28b = Game.Quests.turnIn('what_the_wellspring_woke');
assert(res28b.ok === true, 'what_the_wellspring_woke turn-in succeeds: ' + res28b.message);
assert(Game.Quests.inventoryCount(c28, 'sphere_fclass_2') >= 1, 'what_the_wellspring_woke grants an F-Class Sphere II');

// 21c) boss-kill side quest: REAL kill via winBattle against the Band D lair boss itself.
var c29 = makeCharacter({ name: 'BandDBossTest' });
grantVitalityForLevel(c29, 80);
Game.World.travelTo('frosthold_waystation');
var res29a = Game.Quests.accept('the_warden_primes_reckoning');
assert(res29a.ok === true, 'the_warden_primes_reckoning accepted: ' + res29a.message);
Game.World.travelTo('anima_wellspring');
winBattle('estari_warden_prime');
assert(c29.quests['the_warden_primes_reckoning'].progress.kills['estari_warden_prime'] === 1, 'estari_warden_prime kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('frosthold_waystation');
var res29b = Game.Quests.turnIn('the_warden_primes_reckoning');
assert(res29b.ok === true, 'the_warden_primes_reckoning turn-in succeeds: ' + res29b.message);
assert(c29.quests['the_warden_primes_reckoning'].status === 'completed', 'the_warden_primes_reckoning marked completed');
assert(Game.Quests.inventoryCount(c29, 'heavy_head_warden_helm') >= 1, 'the_warden_primes_reckoning grants the Warden Helm');

// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
