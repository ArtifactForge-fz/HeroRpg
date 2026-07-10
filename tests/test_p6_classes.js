// Phase 6a/v1.1 exit tests — two-tier class system (DESIGN.md §3 v1.1 revision):
// Base tier (Warrior/Magician/Thief, level 5, "First Calling") -> Advanced tier (Gladiator/
// Crusader/Wizard/Sage/Rogue/Mercenary, level 30, "Trials of Ascension") -> Legendary
// (Runeblade of Kuraan, unchanged). Covers obtain/activate/deactivate, class XP/levels, ability
// purchase incl. passive + tech hooks, class-only tech battle gating, advancedOptionsFor,
// classChoice quest turn-ins (fixed array + 'advanced' sentinel), save v6->v7 migration
// (rogue->thief re-basing), and Legendary boss unlock. Via the fakedom shim; randomness stubbed
// via Game.Battle._rng.

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
    race: 'Human',
    name: (opts && opts.name) || 'ClassTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  Game.state.character = c;
  Game.state.battle = null;
  return c;
}

function setLevel(c, n) {
  c.level = n;
  c.xp = BALANCE.XP_TO_LEVEL(n);
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
}

// Wins one battle vs monsterId deterministically (1-HP monster, no dodge/glance rolls land).
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

var BASE_IDS = ['warrior', 'magician', 'thief'];
var ADVANCED_PAIRS = {
  warrior: ['gladiator', 'crusader'],
  magician: ['wizard', 'sage'],
  thief: ['rogue', 'mercenary']
};
var CLASS_TECH_IDS = [
  'tech_crushing_blow', 'tech_anima_surge', 'tech_quick_stab', 'tech_shadowstep_strike',
  'tech_execution_blow', 'tech_radiant_smite', 'tech_arcane_cataclysm', 'tech_greater_mending',
  'tech_efficient_strike', 'tech_runic_severance'
];

// =================== Test 0: data sanity ===================
console.log('\n=== Test 0: two-tier class/tech/quest data sanity ===');
assert(Game.Data.classes.length === 10, '10 classes defined (3 base + 6 advanced + 1 legendary), got ' + Game.Data.classes.length);

BASE_IDS.forEach(function (id) {
  var cd = Game.Classes.getClass(id);
  assert(cd && cd.tier === 1 && !cd.legendary && !cd.baseClass, id + ' is a base-tier (tier 1) class with no baseClass');
  assert(cd.abilities.length === 3, id + ' has 3 abilities, got ' + (cd ? cd.abilities.length : 'undefined'));
});

Object.keys(ADVANCED_PAIRS).forEach(function (baseId) {
  ADVANCED_PAIRS[baseId].forEach(function (advId) {
    var cd = Game.Classes.getClass(advId);
    assert(cd && cd.tier === 2 && !cd.legendary && cd.baseClass === baseId,
      advId + ' is a tier-2 class with baseClass ' + baseId + ', got baseClass=' + (cd && cd.baseClass));
    assert(cd.abilities.length === 4, advId + ' has 4 abilities, got ' + (cd ? cd.abilities.length : 'undefined'));
  });
});

var legendary = Game.Classes.getClass('runeblade_of_kuraan');
assert(legendary && legendary.legendary === true && legendary.tier === 3, 'runeblade_of_kuraan exists, legendary, tier 3');
assert(legendary.obtain.kind === 'boss_kill' && legendary.obtain.monsterId === 'estari_ruin_warden' && legendary.obtain.minLevel === 30,
  'legendary obtain rule unchanged: boss_kill estari_ruin_warden at minLevel 30');
assert(legendary.abilities.length === 4, 'legendary keeps its 4 abilities');

Game.Data.classes.forEach(function (cd) {
  cd.abilities.forEach(function (a) {
    if (a.kind === 'tech') {
      var t = Game.Battle.getTech(a.techId);
      assert(t && t.classOnly === true && t.classId === cd.id, cd.id + ' tech ability ' + a.id + ' resolves to a classOnly tech tagged with classId ' + cd.id);
    }
  });
});
CLASS_TECH_IDS.forEach(function (id) {
  assert(Game.World.learnableTechs().indexOf(Game.Battle.getTech(id)) === -1, id + ' excluded from the general Academy TP tech list');
});

var firstCalling = Game.Data.quests.filter(function (q) { return q.id === 'first_calling'; })[0];
assert(!!firstCalling, 'first_calling quest exists');
assert(firstCalling.levelMin === 5, 'first_calling gates at level 5, got ' + (firstCalling && firstCalling.levelMin));
assert(Array.isArray(firstCalling.rewards.classChoice) &&
  firstCalling.rewards.classChoice.slice().sort().join(',') === 'magician,thief,warrior',
  'first_calling offers exactly warrior/magician/thief, got ' + JSON.stringify(firstCalling.rewards.classChoice));

var trials = Game.Data.quests.filter(function (q) { return q.id === 'trials_of_eldor'; })[0];
assert(!!trials, 'trials_of_eldor quest exists (id unchanged for old-save coherence)');
assert(trials.name === 'The Trials of Ascension', 'trials_of_eldor renamed for display to "The Trials of Ascension", got "' + (trials && trials.name) + '"');
assert(trials.levelMin === 30, 'trials_of_eldor still gates at level 30');
assert(trials.requiresBaseClass === true, 'trials_of_eldor requires a base class (new field)');
assert(trials.rewards.classChoice === 'advanced', 'trials_of_eldor classChoice is the "advanced" sentinel, got ' + JSON.stringify(trials.rewards.classChoice));

// =================== Test 1: save v6 -> v7 migration (rogue -> thief, incl. active slots) ===================
console.log('\n=== Test 1: hand-crafted v6 save (old base-tier Rogue) migrates to v7 as thief ===');
function makeV6Character(overrides) {
  var c = {
    race: 'Human', name: 'V6Hero', gender: 'Male',
    strength: 10, vitality: 10, dexterity: 10, intelligence: 10, endurance: 10,
    hitPointsMax: 90, hitPoints: 90, energyMax: 240, energy: 240,
    level: 30, xp: BALANCE.XP_TO_LEVEL(30), statPoints: 0, trainingPoints: 1,
    gold: 40, platinum: 0, animaShards: 5,
    monsterKills: 4, deaths: 1,
    skills: (function () {
      var t = {};
      BALANCE.SKILLS.forEach(function (s) { t[s] = { level: 0, xp: 0 }; });
      return t;
    })(),
    weaponDamageBonus: 0, equippedWeaponSkill: null,
    inventory: [], equipment: { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null },
    techs: ['tech_shadowstep_strike'],
    techSets: [['tech_shadowstep_strike', null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null]],
    fury: 0,
    currentLocation: 'eldor', vault: { platinum: 0, gold: 0, items: [] }, shrineBuffs: [],
    quests: {},
    classes: {
      rogue: { classXp: 120, classLevelsEarned: 3, classLevelsSpent: 2, abilities: ['rogue_quickstep'] },
      warrior: { classXp: 40, classLevelsEarned: 1, classLevelsSpent: 0, abilities: [] }
    },
    primaryClass: 'rogue',
    secondaryClass: 'warrior',
    legendaryUnlocked: false
  };
  for (var k in (overrides || {})) c[k] = overrides[k];
  return c;
}

var v6Character = makeV6Character();
localStorageStore['herorpg_save'] = JSON.stringify({ version: 6, state: { character: v6Character } });
var loadedV6 = Game.Save.load();
assert(loadedV6 !== null, 'v6 save loads without error');
assert(loadedV6.character.name === 'V6Hero', 'migrated character identity intact (name)');
assert(!loadedV6.character.classes.rogue, 'classes.rogue key removed after migration');
assert(!!loadedV6.character.classes.thief, 'classes.thief key added after migration');
assert(loadedV6.character.classes.thief.classXp === 120, 'thief.classXp carried over from old rogue entry, got ' + loadedV6.character.classes.thief.classXp);
assert(loadedV6.character.classes.thief.classLevelsEarned === 3, 'thief.classLevelsEarned carried over, got ' + loadedV6.character.classes.thief.classLevelsEarned);
assert(loadedV6.character.classes.thief.classLevelsSpent === 2, 'thief.classLevelsSpent carried over (not refunded), got ' + loadedV6.character.classes.thief.classLevelsSpent);
assert(Array.isArray(loadedV6.character.classes.thief.abilities) && loadedV6.character.classes.thief.abilities.length === 0,
  'thief.abilities reset to empty (old rogue_* ability ids do not exist on the new thief roster)');
assert(!!loadedV6.character.classes.warrior, 'unrelated classes.warrior entry untouched by the rename');
assert(loadedV6.character.classes.warrior.classXp === 40, 'classes.warrior progress untouched, got ' + loadedV6.character.classes.warrior.classXp);
assert(loadedV6.character.primaryClass === 'thief', 'primaryClass (active slot) renamed rogue -> thief, got ' + loadedV6.character.primaryClass);
Game.state = loadedV6;
Game.persist();
var resavedV6 = JSON.parse(localStorageStore['herorpg_save']);
assert(resavedV6.version === 8, 'resaved payload is stamped CURRENT_VERSION 8, got ' + resavedV6.version);

// Second crafted payload: rogue in the SECONDARY slot instead of primary ("incl. active slots").
console.log('\n=== Test 1b: v6 save with rogue in the SECONDARY slot also migrates ===');
var v6Character2 = makeV6Character({ primaryClass: 'warrior', secondaryClass: 'rogue' });
localStorageStore['herorpg_save'] = JSON.stringify({ version: 6, state: { character: v6Character2 } });
var loadedV6b = Game.Save.load();
assert(loadedV6b !== null, 'v6 save (secondary=rogue) loads without error');
assert(loadedV6b.character.primaryClass === 'warrior', 'primaryClass (warrior) untouched');
assert(loadedV6b.character.secondaryClass === 'thief', 'secondaryClass (active slot) renamed rogue -> thief, got ' + loadedV6b.character.secondaryClass);
assert(!!loadedV6b.character.classes.thief, 'classes.thief present after secondary-slot migration too');

// A v6 save with NO rogue entry at all is unaffected beyond the version bump.
console.log('\n=== Test 1c: v6 save with no rogue entry is unaffected beyond the version bump ===');
var v6Character3 = makeV6Character({ classes: { warrior: { classXp: 5, classLevelsEarned: 0, classLevelsSpent: 0, abilities: [] } }, primaryClass: 'warrior', secondaryClass: null });
localStorageStore['herorpg_save'] = JSON.stringify({ version: 6, state: { character: v6Character3 } });
var loadedV6c = Game.Save.load();
assert(loadedV6c !== null && !loadedV6c.character.classes.thief && !!loadedV6c.character.classes.warrior,
  'v6 save with no rogue entry migrates cleanly with no spurious thief entry');

// =================== Test 2: full v1 -> v7 migration chain ===================
console.log('\n=== Test 2: hand-crafted v1 save migrates all the way to v7 ===');
var v1Character = {
  race: 'Arkan', name: 'AncientSave', gender: 'Female',
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
};
var v1Payload = { version: 1, state: { character: v1Character } };
localStorageStore['herorpg_save'] = JSON.stringify(v1Payload);
var loadedV1 = Game.Save.load();
assert(loadedV1 !== null, 'v1 save loads without error through the full migration chain');
assert(loadedV1.character.name === 'AncientSave', 'v1->v7: identity intact');
assert(Array.isArray(loadedV1.character.inventory), 'v1->v7: inventory array added (v1->v2 step)');
assert(Array.isArray(loadedV1.character.techs), 'v1->v7: techs array added (v2->v3 step)');
assert(loadedV1.character.currentLocation === 'eldor', 'v1->v7: currentLocation added (v3->v4 step)');
assert(loadedV1.character.quests && typeof loadedV1.character.quests === 'object', 'v1->v7: quests map added (v4->v5 step)');
assert(loadedV1.character.classes && typeof loadedV1.character.classes === 'object' && Object.keys(loadedV1.character.classes).length === 0, 'v1->v7: classes map added (v5->v6 step)');
assert(loadedV1.character.primaryClass === null && loadedV1.character.secondaryClass === null, 'v1->v7: class slots null');
assert(loadedV1.character.legendaryUnlocked === false, 'v1->v7: legendary latch false');
Game.state = loadedV1;
Game.persist();
assert(JSON.parse(localStorageStore['herorpg_save']).version === 8, 'v1->v8 resave stamps version 8');

// =================== Test 3: first_calling gates at level 5 ===================
console.log('\n=== Test 3: first_calling gated at level 5 ===');
var c3 = makeCharacter({ name: 'TooYoung' });
setLevel(c3, 4);
var avail3 = Game.Quests.availableAt('eldor');
var callRec3 = avail3.filter(function (r) { return r.quest.id === 'first_calling'; })[0];
assert(!!callRec3, 'first_calling is listed at the Eldor tavern even below level 5 (greyed, not hidden)');
assert(callRec3.eligible === false, 'first_calling is NOT eligible at level 4');
var acceptAttempt3 = Game.Quests.accept('first_calling');
assert(acceptAttempt3.ok === false, 'accept refused below level 5: ' + acceptAttempt3.message);
setLevel(c3, 5);
var acceptAt5 = Game.Quests.accept('first_calling');
assert(acceptAt5.ok === true, 'first_calling accepted at level 5: ' + acceptAt5.message);

// =================== Test 4: first_calling turn-in grants exactly the chosen base class ===================
console.log('\n=== Test 4: first_calling turn-in grants exactly the chosen base class, no re-choice ===');
var c4 = makeCharacter({ name: 'FirstChoice' });
setLevel(c4, 5);
var acceptCalling4 = Game.Quests.accept('first_calling');
assert(acceptCalling4.ok === true, 'first_calling accepted: ' + acceptCalling4.message);
for (var i4 = 0; i4 < 4; i4++) winBattle('plains_vermin_swarm');
assert(Game.Quests.canTurnIn('first_calling') === true, 'first_calling ready to turn in after 4 vermin swarm kills');
var badChoice4 = Game.Quests.turnIn('first_calling', 'gladiator'); // not a base-tier option
assert(badChoice4.ok === false, 'turnIn rejects a choice outside the fixed classChoice list: ' + badChoice4.message);
var turnInThief = Game.Quests.turnIn('first_calling', 'thief');
assert(turnInThief.ok === true, 'turnIn with choice thief succeeds: ' + turnInThief.message);
assert(Game.Classes.isObtained(c4, 'thief') === true, 'thief obtained after turn-in');
assert(Game.Classes.isObtained(c4, 'warrior') === false, 'warrior NOT obtained (only the chosen class)');
assert(Game.Classes.isObtained(c4, 'magician') === false, 'magician NOT obtained (only the chosen class)');
assert(c4.quests['first_calling'].status === 'completed', 'first_calling marked completed');
var reTurnIn4 = Game.Quests.turnIn('first_calling', 'warrior');
assert(reTurnIn4.ok === false, 'cannot turn in first_calling a second time: ' + reTurnIn4.message);

// =================== Test 5: trials_of_eldor accept blocked without a base class ===================
console.log('\n=== Test 5: Trials of Ascension accept blocked without a base class ===');
var c5 = makeCharacter({ name: 'NoCalling' });
setLevel(c5, 30);
var acceptNoBase5 = Game.Quests.accept('trials_of_eldor');
assert(acceptNoBase5.ok === false, 'accept refused with no base class obtained: ' + acceptNoBase5.message);
assert(/base class/i.test(acceptNoBase5.message), 'refusal message explains the base-class requirement');
Game.Classes.obtainClass(c5, 'warrior'); // simulate having answered First Calling
var acceptWithBase5 = Game.Quests.accept('trials_of_eldor');
assert(acceptWithBase5.ok === true, 'accept succeeds once a base class is obtained: ' + acceptWithBase5.message);

// =================== Test 6: advancedOptionsFor returns the right pair per base ===================
console.log('\n=== Test 6: advancedOptionsFor(c) resolves the correct 2-option pair per base ===');
var c6 = makeCharacter({ name: 'OptionsTester' });
assert(Game.Classes.advancedOptionsFor(c6).length === 0, 'no base class obtained -> no advanced options');
Game.Classes.obtainClass(c6, 'warrior');
assert(Game.Classes.advancedOptionsFor(c6).slice().sort().join(',') === 'crusader,gladiator', 'warrior base -> [gladiator, crusader], got ' + JSON.stringify(Game.Classes.advancedOptionsFor(c6)));
var c6b = makeCharacter({ name: 'OptionsTester2' });
Game.Classes.obtainClass(c6b, 'magician');
assert(Game.Classes.advancedOptionsFor(c6b).slice().sort().join(',') === 'sage,wizard', 'magician base -> [wizard, sage], got ' + JSON.stringify(Game.Classes.advancedOptionsFor(c6b)));
var c6c = makeCharacter({ name: 'OptionsTester3' });
Game.Classes.obtainClass(c6c, 'thief');
assert(Game.Classes.advancedOptionsFor(c6c).slice().sort().join(',') === 'mercenary,rogue', 'thief base -> [rogue, mercenary], got ' + JSON.stringify(Game.Classes.advancedOptionsFor(c6c)));

// =================== Test 7: trials_of_eldor turn-in — wrong-branch choice rejected ===================
console.log('\n=== Test 7: Trials of Ascension turn-in rejects a wrong-branch choice, accepts the right one ===');
var c7 = makeCharacter({ name: 'BranchTester' });
setLevel(c7, 30);
Game.Classes.obtainClass(c7, 'warrior'); // warrior base -> gladiator/crusader only
var acceptTrials7 = Game.Quests.accept('trials_of_eldor');
assert(acceptTrials7.ok === true, 'trials_of_eldor accepted with warrior base: ' + acceptTrials7.message);
winBattle('estari_ruin_warden');
Game.Inventory.addItem(c7, 'quest_condensed_anima_core');
Game.Inventory.addItem(c7, 'quest_estari_ward_fragment');
assert(Game.Quests.canTurnIn('trials_of_eldor') === true, 'trials_of_eldor ready to turn in after boss kill + materials');
var wrongBranch7 = Game.Quests.turnIn('trials_of_eldor', 'wizard'); // magician-branch class, warrior base
assert(wrongBranch7.ok === false, 'turnIn rejects wizard for a warrior-base hero: ' + wrongBranch7.message);
assert(Game.Classes.isObtained(c7, 'wizard') === false, 'wizard NOT obtained after the rejected attempt');
var rightBranch7 = Game.Quests.turnIn('trials_of_eldor', 'gladiator');
assert(rightBranch7.ok === true, 'turnIn accepts gladiator for a warrior-base hero: ' + rightBranch7.message);
assert(Game.Classes.isObtained(c7, 'gladiator') === true, 'gladiator obtained');
assert(Game.Classes.isObtained(c7, 'crusader') === false, 'crusader NOT obtained (only the chosen branch)');
assert(c7.quests['trials_of_eldor'].status === 'completed', 'trials_of_eldor marked completed');

// =================== Test 8: addClassXp — primary full, secondary half, none unassigned ===================
console.log('\n=== Test 8: addClassXp rates + classLevelsEarned curve ===');
var c8 = makeCharacter({ name: 'XpTester' });
setLevel(c8, 30);
Game.Classes.obtainClass(c8, 'warrior');
Game.Classes.obtainClass(c8, 'magician');
Game.Classes.obtainClass(c8, 'thief'); // obtained but left inactive on purpose
Game.Classes.activate(c8, 'warrior', 'primary');
Game.Classes.activate(c8, 'magician', 'secondary');
Game.Classes.addClassXp(c8, 100);
assert(c8.classes['warrior'].classXp === 100, 'primary (warrior) gained full 100 class XP, got ' + c8.classes['warrior'].classXp);
assert(c8.classes['magician'].classXp === 50, 'secondary (magician) gained half, 50 class XP, got ' + c8.classes['magician'].classXp);
assert(c8.classes['thief'].classXp === 0, 'inactive obtained class (thief) gained 0 class XP');
var c8b = makeCharacter({ name: 'CurveTester' });
setLevel(c8b, 30);
Game.Classes.obtainClass(c8b, 'warrior');
Game.Classes.activate(c8b, 'warrior', 'primary');
var xpForLevel1 = Game.Classes.classXpForLevel(1);
assert(xpForLevel1 === 0, 'classXpForLevel(1) === 0 (cumulative curve convention), got ' + xpForLevel1);
var xpForLevel2 = Game.Classes.classXpForLevel(2);
assert(xpForLevel2 === Math.round(30 * Math.pow(1, 1.6)), 'classXpForLevel(2) matches round(30*(n-1)^1.6), got ' + xpForLevel2);
Game.Classes.addClassXp(c8b, xpForLevel2);
assert(c8b.classes['warrior'].classLevelsEarned === 1, 'classLevelsEarned incremented once at the level-2 threshold, got ' + c8b.classes['warrior'].classLevelsEarned);
var xpForLevel3 = Game.Classes.classXpForLevel(3);
Game.Classes.addClassXp(c8b, xpForLevel3 - xpForLevel2 + 5);
assert(c8b.classes['warrior'].classLevelsEarned >= 2, 'classLevelsEarned climbs further with more class XP, got ' + c8b.classes['warrior'].classLevelsEarned);

// =================== Test 9: buyAbility gating ===================
console.log('\n=== Test 9: buyAbility blocked without Academy/active slot/levels ===');
var c9 = makeCharacter({ name: 'AbilityBuyer' });
setLevel(c9, 5);
Game.Classes.obtainClass(c9, 'warrior');
c9.currentLocation = 'plains_of_averast'; // no academy here
var buyNoAcademy = Game.Classes.buyAbility(c9, 'warrior', 'warrior_iron_hide');
assert(buyNoAcademy.ok === false, 'buyAbility blocked away from an Academy: ' + buyNoAcademy.message);
c9.currentLocation = 'eldor'; // Eldor has an Academy
var buyNotActive = Game.Classes.buyAbility(c9, 'warrior', 'warrior_iron_hide');
assert(buyNotActive.ok === false, 'buyAbility blocked while warrior is obtained but not active: ' + buyNotActive.message);
Game.Classes.activate(c9, 'warrior', 'primary');
var buyNoLevels = Game.Classes.buyAbility(c9, 'warrior', 'warrior_iron_hide');
assert(buyNoLevels.ok === false, 'buyAbility blocked with 0 unspent Class Levels: ' + buyNoLevels.message);

// =================== Test 10: passive ability changes derived stats measurably (base tier) ===================
console.log('\n=== Test 10: passive abilities measurably change derived stats (base tier, Warrior) ===');
var c10 = makeCharacter({ name: 'PassiveTester' });
setLevel(c10, 5);
c10.strength = 60; // representative mid-strength build so a 6% damage_pct bump is visible after rounding
c10.equippedWeaponSkill = 'Swords';
Game.Character.recalcDerived(c10);
Game.Classes.obtainClass(c10, 'warrior');
Game.Classes.activate(c10, 'warrior', 'primary');
c10.currentLocation = 'eldor';
var armorBefore10 = Game.Character.getArmor(c10);
// Iron Hide costs 2, Brutal Strikes costs 3 -> need 5 unspent Class Levels.
Game.Classes.addClassXp(c10, Game.Classes.classXpForLevel(6) + 20);
var unspent10 = Game.Classes.unspentClassLevels(c10, 'warrior');
assert(unspent10 >= 5, 'enough unspent class levels for Iron Hide (2) + Brutal Strikes (3), got ' + unspent10);
var buyIronHide = Game.Classes.buyAbility(c10, 'warrior', 'warrior_iron_hide');
assert(buyIronHide.ok === true, 'Iron Hide purchased: ' + buyIronHide.message);
var armorAfter10 = Game.Character.getArmor(c10);
assert(armorAfter10 === armorBefore10 + 4, 'Iron Hide adds flat +4 Armor (before=' + armorBefore10 + ', after=' + armorAfter10 + ')');

var dmgBefore10 = Game.Character.getDamage(c10);
var buyBrutal = Game.Classes.buyAbility(c10, 'warrior', 'warrior_brutal_strikes');
assert(buyBrutal.ok === true, 'Brutal Strikes purchased: ' + buyBrutal.message);
var dmgAfter10 = Game.Character.getDamage(c10);
assert(dmgAfter10 > dmgBefore10, 'Brutal Strikes (+6% Damage) measurably raises getDamage (before=' + dmgBefore10 + ', after=' + dmgAfter10 + ')');

// =================== Test 11: tech ability — c.techs + battle castability gated on active class ===================
console.log('\n=== Test 11: class tech ability — c.techs + battle castability gated on active class ===');
var c11 = makeCharacter({ name: 'TechBuyer' });
setLevel(c11, 5);
c11.currentLocation = 'eldor';
Game.Classes.obtainClass(c11, 'warrior');
Game.Classes.activate(c11, 'warrior', 'primary');
Game.Classes.addClassXp(c11, Game.Classes.classXpForLevel(6) + 10);
var buyCrushingBlow = Game.Classes.buyAbility(c11, 'warrior', 'warrior_crushing_blow');
assert(buyCrushingBlow.ok === true, 'Crushing Blow purchased: ' + buyCrushingBlow.message);
assert(c11.techs.indexOf('tech_crushing_blow') !== -1, 'tech_crushing_blow added to c.techs');
c11.techSets[0][0] = 'tech_crushing_blow';

c11.hitPoints = c11.hitPointsMax; c11.energy = c11.energyMax;
setRng(fixedRng(0.99));
var battle11 = Game.Battle.start('plains_field_rat');
battle11.monster.hp = 999;
var beforeHp11 = battle11.monster.hp;
Game.Battle.useTech('tech_crushing_blow');
assert(battle11.monster.hp < beforeHp11, 'Crushing Blow lands damage while Warrior is active (hp ' + beforeHp11 + ' -> ' + battle11.monster.hp + ')');
Game.Battle.flee();
Game.Battle.endBattle();

var deactivateWarrior11 = Game.Classes.deactivate(c11, 'primary');
assert(deactivateWarrior11.ok === true, 'warrior deactivated: ' + deactivateWarrior11.message);
assert(c11.techs.indexOf('tech_crushing_blow') === -1, 'tech_crushing_blow removed from c.techs on deactivate');
assert(c11.techSets[0][0] === null, 'tech_crushing_blow removed from the equipped set slot on deactivate');
c11.techs.push('tech_crushing_blow');
c11.techSets[0][0] = 'tech_crushing_blow';
c11.hitPoints = c11.hitPointsMax; c11.energy = c11.energyMax;
var battle11b = Game.Battle.start('plains_field_rat');
battle11b.monster.hp = 999;
var beforeHp11b = battle11b.monster.hp;
Game.Battle.useTech('tech_crushing_blow');
assert(battle11b.monster.hp === beforeHp11b, 'Crushing Blow does NOT land while Warrior is inactive, even if slotted (hp unchanged at ' + battle11b.monster.hp + ')');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 12: deactivate wipes xp/levels/abilities; reactivate starts at zero ===================
console.log('\n=== Test 12: deactivate permanently wipes progress; reactivating rebuilds from zero ===');
var c12 = makeCharacter({ name: 'Deactivator' });
setLevel(c12, 5);
c12.currentLocation = 'eldor';
Game.Classes.obtainClass(c12, 'magician');
Game.Classes.activate(c12, 'magician', 'primary');
Game.Classes.addClassXp(c12, Game.Classes.classXpForLevel(4) + 5);
var preWipeLevels = c12.classes['magician'].classLevelsEarned;
assert(preWipeLevels > 0, 'magician earned some class levels before wipe test, got ' + preWipeLevels);
Game.Classes.buyAbility(c12, 'magician', 'magician_arcane_reserves');
assert(c12.classes['magician'].abilities.length === 1, 'magician has 1 purchased ability before deactivate');
var deactivate12 = Game.Classes.deactivate(c12, 'primary');
assert(deactivate12.ok === true, 'deactivate succeeds: ' + deactivate12.message);
assert(c12.primaryClass === null, 'primaryClass cleared after deactivate');
assert(Game.Classes.isObtained(c12, 'magician') === true, 'magician remains obtained (latch stays) after deactivate');
assert(c12.classes['magician'].classXp === 0, 'classXp wiped to 0');
assert(c12.classes['magician'].classLevelsEarned === 0, 'classLevelsEarned wiped to 0');
assert(c12.classes['magician'].classLevelsSpent === 0, 'classLevelsSpent wiped to 0');
assert(c12.classes['magician'].abilities.length === 0, 'abilities array wiped empty');
Game.Classes.activate(c12, 'magician', 'primary');
assert(c12.classes['magician'].classXp === 0 && c12.classes['magician'].classLevelsEarned === 0, 'reactivated magician starts at zero XP/levels');

// =================== Test 13: Legendary boss-kill unlock (unchanged by the v1.1 revision) ===================
console.log('\n=== Test 13: Legendary unlock — level gate + one-per-save latch ===');
var c13 = makeCharacter({ name: 'LegendaryHunter' });
setLevel(c13, 29);
winBattle('estari_ruin_warden');
assert(Game.Classes.isObtained(c13, 'runeblade_of_kuraan') === false, 'boss kill at level 29 grants nothing');
assert(c13.legendaryUnlocked === false, 'legendaryUnlocked stays false at level 29');

setLevel(c13, 30);
winBattle('estari_ruin_warden');
assert(Game.Classes.isObtained(c13, 'runeblade_of_kuraan') === true, 'boss kill at level 30 unlocks the Legendary class');
assert(c13.legendaryUnlocked === true, 'legendaryUnlocked latch set true');

var classesCountBefore13 = Object.keys(c13.classes).length;
winBattle('estari_ruin_warden');
var classesCountAfter13 = Object.keys(c13.classes).length;
assert(classesCountAfter13 === classesCountBefore13, 'second boss kill does not obtain a duplicate legendary class entry');

// =================== Test 14: sweep — every class of every tier can obtain/activate/buy/deactivate ===================
console.log('\n=== Test 14: sweep all 10 classes — activate/deactivate/buyAbility correctly for every tier ===');
Game.Data.classes.forEach(function (cd) {
  var sc = makeCharacter({ name: 'Sweep_' + cd.id });
  setLevel(sc, cd.tier === 1 ? 5 : 30);
  sc.currentLocation = 'eldor';
  var obtainRes = Game.Classes.obtainClass(sc, cd.id);
  assert(obtainRes.ok === true, 'sweep: ' + cd.id + ' obtained: ' + obtainRes.message);
  var activateRes = Game.Classes.activate(sc, cd.id, 'primary');
  assert(activateRes.ok === true, 'sweep: ' + cd.id + ' activated as primary: ' + activateRes.message);
  var cheapest = cd.abilities.slice().sort(function (a, b) { return a.classLevelCost - b.classLevelCost; })[0];
  Game.Classes.addClassXp(sc, Game.Classes.classXpForLevel(20)); // plenty of class levels for any tier
  var buyRes = Game.Classes.buyAbility(sc, cd.id, cheapest.id);
  assert(buyRes.ok === true, 'sweep: ' + cd.id + ' bought its cheapest ability (' + cheapest.id + '): ' + buyRes.message);
  assert(sc.classes[cd.id].abilities.indexOf(cheapest.id) !== -1, 'sweep: ' + cd.id + ' ability recorded as owned');
  var deactivateRes = Game.Classes.deactivate(sc, 'primary');
  assert(deactivateRes.ok === true, 'sweep: ' + cd.id + ' deactivated: ' + deactivateRes.message);
  assert(sc.classes[cd.id].abilities.length === 0, 'sweep: ' + cd.id + ' abilities wiped after deactivate');
});

// =================== Test 15: full no-debug loop — base then advanced, across both quests ===================
console.log('\n=== Test 15: full loop — First Calling (thief) -> grind -> Trials of Ascension (mercenary) -> grind -> tech ===');
var c15 = makeCharacter({ name: 'FullLoop' });
Game.state.character = c15;
setLevel(c15, 5);
c15.currentLocation = 'eldor';

var loopCalling = Game.Quests.accept('first_calling');
assert(loopCalling.ok === true, 'loop: first_calling accepted');
for (var lk = 0; lk < 4; lk++) winBattle('plains_vermin_swarm');
var loopCallingTurnIn = Game.Quests.turnIn('first_calling', 'thief');
assert(loopCallingTurnIn.ok === true, 'loop: turned in First Calling for thief: ' + loopCallingTurnIn.message);
assert(Game.Classes.isObtained(c15, 'thief') === true, 'loop: thief obtained');
var loopActivateThief = Game.Classes.activate(c15, 'thief', 'primary');
assert(loopActivateThief.ok === true, 'loop: thief activated as primary');

setLevel(c15, 30);
c15.currentLocation = 'eldor';
var loopTrialsAccept = Game.Quests.accept('trials_of_eldor');
assert(loopTrialsAccept.ok === true, 'loop: Trials of Ascension accepted (base class already obtained)');
winBattle('estari_ruin_warden');
Game.Inventory.addItem(c15, 'quest_condensed_anima_core');
Game.Inventory.addItem(c15, 'quest_estari_ward_fragment');
assert(Game.Classes.advancedOptionsFor(c15).slice().sort().join(',') === 'mercenary,rogue', 'loop: advancedOptionsFor resolves to [rogue, mercenary] for a thief base');
var loopTrialsTurnIn = Game.Quests.turnIn('trials_of_eldor', 'mercenary');
assert(loopTrialsTurnIn.ok === true, 'loop: turned in Trials of Ascension for mercenary: ' + loopTrialsTurnIn.message);
assert(Game.Classes.isObtained(c15, 'mercenary') === true, 'loop: mercenary obtained');

var loopActivateMerc = Game.Classes.activate(c15, 'mercenary', 'secondary');
assert(loopActivateMerc.ok === true, 'loop: mercenary activated as secondary: ' + loopActivateMerc.message);

// Grind class XP via Game._debug.addClassXp — enough for Quick Pockets (2) + Efficient Strike (4).
// mercenary is the SECONDARY slot here (thief is primary), so addClassXp only grants it half rate
// (js/core/classes.js addClassXp) — double the raw amount so mercenary itself nets the target.
Game._debug.addClassXp(2 * (Game.Classes.classXpForLevel(8) + 20));
var unspentLoop = Game.Classes.unspentClassLevels(c15, 'mercenary');
assert(unspentLoop >= 6, 'loop: ground enough class levels for Quick Pockets (2) + Efficient Strike (4), unspent=' + unspentLoop);

var buyQuickPockets = Game.Classes.buyAbility(c15, 'mercenary', 'mercenary_quick_pockets');
assert(buyQuickPockets.ok === true, 'loop: bought Quick Pockets passive: ' + buyQuickPockets.message);
var buyEfficientStrike = Game.Classes.buyAbility(c15, 'mercenary', 'mercenary_efficient_strike');
assert(buyEfficientStrike.ok === true, 'loop: bought Efficient Strike tech ability: ' + buyEfficientStrike.message);
assert(c15.techs.indexOf('tech_efficient_strike') !== -1, 'loop: Efficient Strike known');
c15.techSets[0][0] = 'tech_efficient_strike';

c15.hitPoints = c15.hitPointsMax; c15.energy = c15.energyMax;
setRng(fixedRng(0.99));
var loopBattle = Game.Battle.start('plains_field_rat');
loopBattle.monster.hp = 999;
var loopHpBefore = loopBattle.monster.hp;
Game.Battle.useTech('tech_efficient_strike');
assert(loopBattle.monster.hp < loopHpBefore, 'loop: Efficient Strike (class tech) lands damage in battle while Mercenary active');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 16: UI smoke — Status Classes tab tier headers + lineage; Academy panel ===================
console.log('\n=== Test 16: Status Classes tab (tier headers + baseClass lineage) + Academy panel render ===');
try {
  Game.state.character = c15;
  Game.state.battle = null;
  Game.Screens.navigate('status');
  var maincontent = document.getElementById('maincontent');
  var tabButtons = maincontent.queryAllByClass('infobox-tab');
  var classesTabBtn = tabButtons.filter(function (n) { return n.textContent === 'Classes'; })[0];
  assert(!!classesTabBtn, 'Status screen renders a Classes tab button');
  classesTabBtn.click();
  var classesText = document.getElementById('maincontent').textContent;
  assert(classesText.indexOf('Thief') !== -1, 'Classes tab shows the obtained Thief (base) class');
  assert(classesText.indexOf('Mercenary') !== -1, 'Classes tab shows the obtained Mercenary (advanced) class');
  assert(classesText.indexOf('Base') !== -1, 'Classes tab shows a "Base" tier header');
  assert(classesText.indexOf('Advanced') !== -1, 'Classes tab shows an "Advanced" tier header');
  assert(classesText.indexOf('(advances Thief)') !== -1, 'Classes tab shows baseClass lineage "(advances Thief)" on the Mercenary entry');
  assert(classesText.indexOf('Primary') !== -1, 'Classes tab shows the Primary box');

  // Empty-state hint for a fresh sub-5 character with no classes (level-5 gate, v1.1 revision).
  var cEmpty = makeCharacter({ name: 'NoClassesYet' });
  setLevel(cEmpty, 3);
  Game.Screens.navigate('status');
  var tabButtons2 = document.getElementById('maincontent').queryAllByClass('infobox-tab');
  tabButtons2.filter(function (n) { return n.textContent === 'Classes'; })[0].click();
  var emptyText = document.getElementById('maincontent').textContent;
  assert(emptyText.indexOf('Your first class awaits at level 5') !== -1, 'empty-state hint shown for a sub-5 character with no classes');

  // Academy Class Abilities section (Town screen, Eldor).
  Game.state.character = c15;
  c15.currentLocation = 'eldor';
  Game.Screens.navigate('town');
  var townRoot = document.getElementById('maincontent');
  var academyHeader = townRoot.queryAllByClass('stat-name').filter(function (n) { return n.textContent.indexOf('Academy') !== -1; })[0];
  assert(!!academyHeader, 'Town screen lists the Academy facility');
  academyHeader.parent.click(); // expand the facility panel
  var townText = document.getElementById('maincontent').textContent;
  assert(townText.indexOf('Class Abilities') !== -1, 'Academy panel shows the Class Abilities section for an active class');
} catch (e) {
  failures++;
  console.error('FAIL: UI smoke test threw: ' + e.stack);
}

// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
