// Phase 6a/v1.1 + v1.2 Phase 2 + v1.5 P4 exit tests — four-tier class system (DESIGN.md §3 v1.1
// revision; docs/SPEC-V1.2.md Phase 2; docs/SPEC-TIER3-EXPANSION.md v1.5 P4): Base tier
// (Warrior/Magician/Thief, level 5, "First Calling") -> Advanced tier (Gladiator/Crusader/Wizard/
// Sage/Rogue/Mercenary, level 30, "Trials of Ascension") -> Third tier (12 classes, level 60
// (re-gated from 38 by level-arc F4), "The Master's Calling", TWO per tier-2 class via v1.5 P4
// BRANCHING — supersedes the old branch-convergence rule) -> Legendary (Runeblade of
// Kuraan/Vaultbreaker/Heir of the Echo, each
// with its own mutually-independent special unlock route). Covers obtain/activate/deactivate,
// class XP/levels, ability purchase incl. passive + tech hooks, class-only tech battle gating,
// advancedOptionsFor/thirdTierOptionsFor (now tier-2-keyed), classChoice quest turn-ins (fixed
// array + 'advanced'/'tier3' sentinels), save v6->v7 migration (rogue->thief re-basing), the v1.5
// P4 legacy "impossible combo" load path (§5), and all 3 Legendary unlock routes (boss-kill,
// boss-combination quest, item-triggered relic). Via the fakedom shim; randomness stubbed via
// Game.Battle._rng.

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
loadScript('data/statinfo.js');
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
// v1.5 P4 (docs/SPEC-TIER3-EXPANSION.md): TWO tier-3 classes per TIER-2 class (BRANCHING —
// supersedes the old v1.2 Phase 2 branch-convergence rule). baseClass is now a tier-2 id.
var THIRD_TIER_PAIRS = {
  gladiator: ['shadowknight', 'berserker'],
  crusader: ['paladin', 'warden'],
  wizard: ['magus', 'conjurer'],
  sage: ['cleric', 'seer'],
  rogue: ['gambit', 'assassin'],
  mercenary: ['ranger', 'dragoon']
};
var LEGENDARY_IDS = ['runeblade_of_kuraan', 'vaultbreaker', 'heir_of_the_echo'];
var CLASS_TECH_IDS = [
  'tech_crushing_blow', 'tech_anima_surge', 'tech_quick_stab', 'tech_shadowstep_strike',
  'tech_execution_blow', 'tech_radiant_smite', 'tech_arcane_cataclysm', 'tech_greater_mending',
  'tech_efficient_strike', 'tech_runic_severance',
  'tech_shadow_blade', 'tech_anima_reckoning', 'tech_dice_throw', 'tech_vault_reckoning', 'tech_echoing_judgment',
  // v1.5 P4: the 9 new Tier-3 classOnly signature techs (docs/SPEC-TIER3-EXPANSION.md Part B).
  'tech_berserker_frenzy', 'tech_paladin_smite', 'tech_warden_bulwark', 'tech_summon_elemental',
  'tech_greater_restoration', 'tech_seers_ward', 'tech_lethal_strike', 'tech_ranger_volley', 'tech_dragoon_leap'
];

// =================== Test 0: data sanity ===================
console.log('\n=== Test 0: four-tier class/tech/quest data sanity (v1.5 P4 branching) ===');
assert(Game.Data.classes.length === 24, '24 classes defined (3 base + 6 advanced + 12 third-tier + 3 legendary), got ' + Game.Data.classes.length);

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

// v1.5 P4 (docs/SPEC-TIER3-EXPANSION.md): tier-3 roster — BRANCHING, baseClass is now a TIER-2 id,
// 2 classes per tier-2 (12 total), 3 abilities each (2 passive + 1 signature classOnly tech).
var THIRD_TIER_IDS = [];
Object.keys(THIRD_TIER_PAIRS).forEach(function (tier2Id) {
  THIRD_TIER_PAIRS[tier2Id].forEach(function (tierId) {
    THIRD_TIER_IDS.push(tierId);
    var cd = Game.Classes.getClass(tierId);
    assert(cd && cd.tier === 3 && !cd.legendary && cd.baseClass === tier2Id,
      tierId + ' is a tier-3 class with baseClass ' + tier2Id + ' (a TIER-2 id, v1.5 P4 branching), got baseClass=' + (cd && cd.baseClass));
    assert(cd.abilities.length === 3, tierId + ' has 3 abilities, got ' + (cd ? cd.abilities.length : 'undefined'));
  });
});
assert(THIRD_TIER_IDS.length === 12, '12 tier-3 classes total (2 per tier-2 class), got ' + THIRD_TIER_IDS.length);

var legendary = Game.Classes.getClass('runeblade_of_kuraan');
assert(legendary && legendary.legendary === true && legendary.tier === 4, 'runeblade_of_kuraan exists, legendary, tier 4 (v1.2 Phase 2 renumber off tier 3)');
assert(legendary.obtain.kind === 'boss_kill' && legendary.obtain.monsterId === 'estari_ruin_warden' && legendary.obtain.minLevel === 30,
  'legendary obtain rule unchanged: boss_kill estari_ruin_warden at minLevel 30');
assert(legendary.abilities.length === 4, 'legendary keeps its 4 abilities');

// v1.2 Phase 2: the 2 NEW invented Legendaries, each with a distinct special unlock route.
var vaultbreaker0 = Game.Classes.getClass('vaultbreaker');
assert(vaultbreaker0 && vaultbreaker0.legendary === true && vaultbreaker0.tier === 4 && !vaultbreaker0.baseClass,
  'vaultbreaker exists, legendary, tier 4, no baseClass');
assert(vaultbreaker0.obtain.kind === 'boss_combo_quest' && vaultbreaker0.obtain.questId === 'vaultbreakers_reckoning',
  'vaultbreaker obtain route: boss_combo_quest vaultbreakers_reckoning');
assert(vaultbreaker0.abilities.length === 4, 'vaultbreaker has 4 abilities, got ' + vaultbreaker0.abilities.length);

var heirOfEcho0 = Game.Classes.getClass('heir_of_the_echo');
assert(heirOfEcho0 && heirOfEcho0.legendary === true && heirOfEcho0.tier === 4 && !heirOfEcho0.baseClass,
  'heir_of_the_echo exists, legendary, tier 4, no baseClass');
assert(heirOfEcho0.obtain.kind === 'relic' && heirOfEcho0.obtain.itemId === 'quest_eidas_echo_seal',
  'heir_of_the_echo obtain route: relic quest_eidas_echo_seal');
assert(heirOfEcho0.abilities.length === 4, 'heir_of_the_echo has 4 abilities, got ' + heirOfEcho0.abilities.length);

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
assert(resavedV6.version === 10, 'resaved payload is stamped CURRENT_VERSION 10, got ' + resavedV6.version);

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
assert(JSON.parse(localStorageStore['herorpg_save']).version === 10, 'v1->v10 resave stamps version 10');

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

// =================== Test 8: addClassXp — primary/secondary fractions, none unassigned ===================
console.log('\n=== Test 8: addClassXp rates + classLevelsEarned curve ===');
var c8 = makeCharacter({ name: 'XpTester' });
setLevel(c8, 30);
Game.Classes.obtainClass(c8, 'warrior');
Game.Classes.obtainClass(c8, 'magician');
Game.Classes.obtainClass(c8, 'thief'); // obtained but left inactive on purpose
Game.Classes.activate(c8, 'warrior', 'primary');
Game.Classes.activate(c8, 'magician', 'secondary');
Game.Classes.addClassXp(c8, 100);
// v1.6 P2 (PG-2, SPEC-V1.6-REBALANCE.md §6.2): primary/secondary no longer gain the full/half raw
// amount outright — both are further scaled by CLASS_XP_FRACTION_PRIMARY (0.5) / _SECONDARY (0.25).
assert(c8.classes['warrior'].classXp === Math.floor(100 * BALANCE.CLASS_XP_FRACTION_PRIMARY), 'primary (warrior) gained 100*CLASS_XP_FRACTION_PRIMARY class XP, got ' + c8.classes['warrior'].classXp);
assert(c8.classes['magician'].classXp === Math.floor(100 * BALANCE.CLASS_XP_FRACTION_SECONDARY), 'secondary (magician) gained 100*CLASS_XP_FRACTION_SECONDARY class XP, got ' + c8.classes['magician'].classXp);
assert(c8.classes['thief'].classXp === 0, 'inactive obtained class (thief) gained 0 class XP');
var c8b = makeCharacter({ name: 'CurveTester' });
setLevel(c8b, 30);
Game.Classes.obtainClass(c8b, 'warrior');
Game.Classes.activate(c8b, 'warrior', 'primary');
var xpForLevel1 = Game.Classes.classXpForLevel(1);
assert(xpForLevel1 === 0, 'classXpForLevel(1) === 0 (cumulative curve convention), got ' + xpForLevel1);
var xpForLevel2 = Game.Classes.classXpForLevel(2);
// v1.6 P2 (PG-2): steepened round(30*(n-1)^1.6) -> round(120*(n-1)^1.9), LOCKED by the P0 calc.
assert(xpForLevel2 === Math.round(120 * Math.pow(1, 1.9)), 'classXpForLevel(2) matches round(120*(n-1)^1.9), got ' + xpForLevel2);
// addClassXp scales the raw amount down by CLASS_XP_FRACTION_PRIMARY before banking it — divide by
// that fraction here so the character's PRIMARY slot nets exactly xpForLevel2 worth of class XP.
Game.Classes.addClassXp(c8b, xpForLevel2 / BALANCE.CLASS_XP_FRACTION_PRIMARY);
assert(c8b.classes['warrior'].classLevelsEarned === 1, 'classLevelsEarned incremented once at the level-2 threshold, got ' + c8b.classes['warrior'].classLevelsEarned);
var xpForLevel3 = Game.Classes.classXpForLevel(3);
Game.Classes.addClassXp(c8b, (xpForLevel3 - xpForLevel2 + 5) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
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
// Iron Hide costs 2, Brutal Strikes costs 3 -> need 5 unspent Class Levels. Divide by
// CLASS_XP_FRACTION_PRIMARY (v1.6 P2) so the primary slot nets the full intended raw amount.
Game.Classes.addClassXp(c10, (Game.Classes.classXpForLevel(6) + 20) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
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
Game.Classes.addClassXp(c11, (Game.Classes.classXpForLevel(6) + 10) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
var buyCrushingBlow = Game.Classes.buyAbility(c11, 'warrior', 'warrior_crushing_blow');
assert(buyCrushingBlow.ok === true, 'Crushing Blow purchased: ' + buyCrushingBlow.message);
assert(c11.techs.indexOf('tech_crushing_blow') !== -1, 'tech_crushing_blow added to c.techs');
c11.techSets[0][0] = 'tech_crushing_blow';

c11.hitPoints = c11.hitPointsMax; c11.energy = c11.energyMax;
setRng(fixedRng(0.99));
var battle11 = Game.Battle.start('plains_field_rat');
battle11.monster.hp = 999;
var beforeHp11 = battle11.monster.hp;
// v1.2 Phase 1 item 6: non-weapon damage techs now roll an Intelligence-based hit chance before
// dealing damage — 0.99 (used above for battle setup) would roll a miss here, so drop to 0.5
// (well under this build's hit chance) just for the cast itself.
setRng(fixedRng(0.5));
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

// =================== Test 11c (v1.3.1 fix 6): current HP clamped down after losing an hp_max_flat passive ===================
console.log('\n=== Test 11c: deactivating an hp_max_flat passive clamps current HP down to the new max ===');
var c11c = makeCharacter({ name: 'HpClampTest' });
setLevel(c11c, 30);
c11c.currentLocation = 'eldor';
Game.Classes.obtainClass(c11c, 'crusader');
Game.Classes.activate(c11c, 'crusader', 'primary');
// Iron Vitality (crusader_iron_vitality, hp_max_flat +40) costs 3 unspent Class Levels.
Game.Classes.addClassXp(c11c, (Game.Classes.classXpForLevel(10) + 100) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
var unspent11c = Game.Classes.unspentClassLevels(c11c, 'crusader');
assert(unspent11c >= 3, 'enough unspent class levels for Iron Vitality (3), got ' + unspent11c);
var hpMaxBefore11c = c11c.hitPointsMax;
var buyIronVitality11c = Game.Classes.buyAbility(c11c, 'crusader', 'crusader_iron_vitality');
assert(buyIronVitality11c.ok === true, 'Iron Vitality purchased: ' + buyIronVitality11c.message);
assert(c11c.hitPointsMax === hpMaxBefore11c + 40, 'Iron Vitality raises hitPointsMax by +40 (before=' + hpMaxBefore11c + ', after=' + c11c.hitPointsMax + ')');
c11c.hitPoints = c11c.hitPointsMax; // full HP, at the boosted max
var deactivate11c = Game.Classes.deactivate(c11c, 'primary');
assert(deactivate11c.ok === true, 'crusader deactivated: ' + deactivate11c.message);
assert(c11c.hitPointsMax === hpMaxBefore11c, 'hitPointsMax drops back by 40 after losing Iron Vitality');
assert(c11c.hitPoints === c11c.hitPointsMax, 'v1.3.1 fix 6: current hitPoints clamped down to the new (lower) max, not left dangling above it (hitPoints=' + c11c.hitPoints + ', hitPointsMax=' + c11c.hitPointsMax + ')');

// =================== Test 12: deactivate wipes xp/levels/abilities; reactivate starts at zero ===================
console.log('\n=== Test 12: deactivate permanently wipes progress; reactivating rebuilds from zero ===');
var c12 = makeCharacter({ name: 'Deactivator' });
setLevel(c12, 5);
c12.currentLocation = 'eldor';
Game.Classes.obtainClass(c12, 'magician');
Game.Classes.activate(c12, 'magician', 'primary');
Game.Classes.addClassXp(c12, (Game.Classes.classXpForLevel(4) + 5) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
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
  Game.Classes.addClassXp(sc, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY); // plenty of class levels for any tier
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
// mercenary is the SECONDARY slot here (thief is primary), so addClassXp only grants it
// CLASS_XP_FRACTION_SECONDARY (0.25, v1.6 P2 — was 0.5) of the raw amount — divide by that
// fraction so mercenary itself nets the target.
Game._debug.addClassXp((Game.Classes.classXpForLevel(8) + 20) / BALANCE.CLASS_XP_FRACTION_SECONDARY);
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
// v1.2 Phase 1 item 6: drop to 0.5 (well under this build's Int-based hit chance) just for the
// cast itself — see the identical Crushing Blow comment above.
setRng(fixedRng(0.5));
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

// =================== Test 17: thirdTierOptionsFor — correct 2-option pair per obtained tier-2 ===
// =================== class (v1.5 P4 BRANCHING); union for multi-tier-2 characters; Runeblade/ =====
// =================== legendaries excluded from BOTH advancedOptionsFor and thirdTierOptionsFor ====
console.log('\n=== Test 17: thirdTierOptionsFor(c) resolves the correct 2-option pair per obtained tier-2 class (v1.5 P4 branching); Runeblade/legendaries excluded from advancement options ===');
var c17 = makeCharacter({ name: 'ThirdTierOptionsTester' });
assert(Game.Classes.thirdTierOptionsFor(c17).length === 0, 'no tier-2 class obtained -> no tier-3 options');
// Obtaining only the TIER-1 base (no tier-2) grants no tier-3 options either — thirdTierOptionsFor
// is keyed off advancedClassIdsObtained (tier-2), not baseClassIdsObtained (tier-1), under branching.
Game.Classes.obtainClass(c17, 'warrior');
assert(Game.Classes.thirdTierOptionsFor(c17).length === 0, 'tier-1 base alone (no tier-2) -> still no tier-3 options under v1.5 P4 branching');

Object.keys(THIRD_TIER_PAIRS).forEach(function (tier2Id) {
  var probe = makeCharacter({ name: 'ThirdTierPair_' + tier2Id });
  Game.Classes.obtainClass(probe, tier2Id);
  var expected = THIRD_TIER_PAIRS[tier2Id].slice().sort().join(',');
  var got = Game.Classes.thirdTierOptionsFor(probe).slice().sort().join(',');
  assert(got === expected, tier2Id + ' (tier-2) -> [' + expected + '], got ' + got);
});

// A character holding SEVERAL tier-2 classes gets the union of their tier-3 options.
var c17u = makeCharacter({ name: 'ThirdTierUnion' });
Game.Classes.obtainClass(c17u, 'gladiator');
Game.Classes.obtainClass(c17u, 'wizard');
var unionOpts17 = Game.Classes.thirdTierOptionsFor(c17u).slice().sort().join(',');
assert(unionOpts17 === 'berserker,conjurer,magus,shadowknight', 'union of gladiator+wizard tier-3 options, got ' + unionOpts17);

BASE_IDS.forEach(function (baseId) {
  var probe = makeCharacter({ name: 'ExcludeProbe_' + baseId });
  Game.Classes.obtainClass(probe, baseId);
  var advOpts = Game.Classes.advancedOptionsFor(probe);
  LEGENDARY_IDS.forEach(function (legId) {
    assert(advOpts.indexOf(legId) === -1, legId + ' excluded from advancedOptionsFor (' + baseId + ' base)');
  });
  Object.keys(THIRD_TIER_PAIRS).forEach(function (t2) {
    THIRD_TIER_PAIRS[t2].forEach(function (t3) {
      assert(advOpts.indexOf(t3) === -1, t3 + ' (tier-3) excluded from advancedOptionsFor');
    });
  });
});

Object.keys(THIRD_TIER_PAIRS).forEach(function (tier2Id) {
  var probe2 = makeCharacter({ name: 'ExcludeProbe2_' + tier2Id });
  Game.Classes.obtainClass(probe2, tier2Id);
  var tierOpts = Game.Classes.thirdTierOptionsFor(probe2);
  LEGENDARY_IDS.forEach(function (legId) {
    assert(tierOpts.indexOf(legId) === -1, legId + ' excluded from thirdTierOptionsFor (' + tier2Id + ' tier-2)');
  });
  // Cross-tier exclusion: the tier-2 id itself (and every OTHER tier-2 id) never leaks into
  // thirdTierOptionsFor's own output (distinct namespace — tier === 3 check).
  Object.keys(ADVANCED_PAIRS).forEach(function (b) {
    ADVANCED_PAIRS[b].forEach(function (advId) {
      assert(tierOpts.indexOf(advId) === -1, advId + ' (tier-2) excluded from thirdTierOptionsFor');
    });
  });
});

// =================== Test 18: masters_calling gating + full tier-3 loop ===================
console.log('\n=== Test 18: masters_calling accept blocked without an advanced class; full tier-3 loop (obtain -> activate -> buyAbility -> class-tech usable in battle) ===');
var c18 = makeCharacter({ name: 'MastersCallingTester' });
setLevel(c18, 60); // masters_calling levelMin re-gated 38 -> 60 (level-arc F4)
var acceptNoAdv18 = Game.Quests.accept('masters_calling');
assert(acceptNoAdv18.ok === false, 'accept refused with no advanced class obtained: ' + acceptNoAdv18.message);
assert(/advanced/i.test(acceptNoAdv18.message), 'refusal message explains the advanced-class requirement');
Game.Classes.obtainClass(c18, 'warrior'); // simulate having answered First Calling
Game.Classes.obtainClass(c18, 'gladiator'); // simulate having completed the Trials of Ascension
var acceptWithAdv18 = Game.Quests.accept('masters_calling');
assert(acceptWithAdv18.ok === true, 'accept succeeds once an advanced (tier-2) class is obtained: ' + acceptWithAdv18.message);
// eidas_echo (level 40) outpaces this bare test character's Dexterity, so without help the
// monster would strike first (js/core/battle.js start() playerFirst) before our forced 1-hp kill
// lands — bump Dexterity so the player acts first; the quest step only needs kill credit, not a
// realistic fight (see js/data/quests.js/tests/test_p6b_content.js for the actual difficulty sim).
c18.dexterity = 999;
winBattle('eidas_echo');
assert(Game.Quests.canTurnIn('masters_calling') === true, 'masters_calling ready to turn in after the eidas_echo kill');
// v1.5 P4 branching: c18 obtained the TIER-2 'gladiator' (not just the tier-1 'warrior' base), so
// thirdTierOptionsFor now resolves to Gladiator's OWN pair, not a single warrior-line convergence.
assert(Game.Classes.thirdTierOptionsFor(c18).slice().sort().join(',') === 'berserker,shadowknight', 'thirdTierOptionsFor resolves to [berserker, shadowknight] for a gladiator (tier-2), got ' + JSON.stringify(Game.Classes.thirdTierOptionsFor(c18)));
var wrongBranch18 = Game.Quests.turnIn('masters_calling', 'magus'); // wrong tier-2 line (magus now hangs off wizard, c18 has gladiator)
assert(wrongBranch18.ok === false, 'turnIn rejects magus for a gladiator hero: ' + wrongBranch18.message);
assert(Game.Classes.isObtained(c18, 'magus') === false, 'magus NOT obtained after the rejected attempt');
var rightBranch18 = Game.Quests.turnIn('masters_calling', 'shadowknight');
assert(rightBranch18.ok === true, 'turnIn accepts shadowknight for a warrior-base hero: ' + rightBranch18.message);
assert(Game.Classes.isObtained(c18, 'shadowknight') === true, 'shadowknight obtained');
assert(c18.quests['masters_calling'].status === 'completed', 'masters_calling marked completed');

// Full loop: activate(primary) -> buyAbility -> class-tech usable in battle.
c18.currentLocation = 'eldor';
var activateSk18 = Game.Classes.activate(c18, 'shadowknight', 'primary');
assert(activateSk18.ok === true, 'shadowknight activated as primary: ' + activateSk18.message);
Game.Classes.addClassXp(c18, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY); // plenty of class levels
var buySk18 = Game.Classes.buyAbility(c18, 'shadowknight', 'shadowknight_shadow_blade');
assert(buySk18.ok === true, 'Shadow Blade purchased: ' + buySk18.message);
assert(c18.techs.indexOf('tech_shadow_blade') !== -1, 'tech_shadow_blade added to c.techs');
c18.techSets[0][0] = 'tech_shadow_blade';
c18.hitPoints = c18.hitPointsMax; c18.energy = c18.energyMax;
setRng(fixedRng(0.99));
var battle18 = Game.Battle.start('plains_field_rat');
battle18.monster.hp = 999;
var beforeHp18 = battle18.monster.hp;
// v1.2 Phase 1 item 6: drop to 0.5 (well under this build's Int-based hit chance) just for the cast.
setRng(fixedRng(0.5));
Game.Battle.useTech('tech_shadow_blade');
assert(battle18.monster.hp < beforeHp18, 'Shadow Blade lands damage while Shadowknight is active (hp ' + beforeHp18 + ' -> ' + battle18.monster.hp + ')');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 19: Vaultbreaker unlock — boss-combination kill quest ===================
console.log('\n=== Test 19: Vaultbreaker unlock — a genuine boss-COMBINATION kill via a hidden quest (distinct from Runeblade\'s silent single boss-kill latch) ===');
var c19 = makeCharacter({ name: 'VaultbreakerHunter' });
setLevel(c19, 33);
var acceptVb19 = Game.Quests.accept('vaultbreakers_reckoning');
assert(acceptVb19.ok === true, 'vaultbreakers_reckoning accepted: ' + acceptVb19.message);
assert(Game.Quests.canTurnIn('vaultbreakers_reckoning') === false, 'not ready before either boss is killed');
// Both gate-bosses (level 25/32) outpace this bare test character's Dexterity — see the identical
// eidas_echo comment in Test 18 above.
c19.dexterity = 999;
winBattle('juneros_leviathan');
assert(Game.Quests.canTurnIn('vaultbreakers_reckoning') === false, 'not ready after only ONE of the two required bosses is killed');
winBattle('kastengard_custodian');
Game.Inventory.addItem(c19, 'quest_leviathan_scale');
Game.Inventory.addItem(c19, 'quest_custodian_core_shard');
assert(Game.Quests.canTurnIn('vaultbreakers_reckoning') === true, 'ready to turn in once BOTH bosses are dead and both materials are held');
assert(Game.Classes.isObtained(c19, 'vaultbreaker') === false, 'vaultbreaker NOT obtained before turn-in (quest route, not a silent battle.js latch)');
var turnInVb19 = Game.Quests.turnIn('vaultbreakers_reckoning', 'vaultbreaker');
assert(turnInVb19.ok === true, 'turnIn grants vaultbreaker: ' + turnInVb19.message);
assert(Game.Classes.isObtained(c19, 'vaultbreaker') === true, 'vaultbreaker obtained after turn-in');

// =================== Test 20: Heir of the Echo unlock — relic route ===================
console.log('\n=== Test 20: Heir of the Echo unlock — item-triggered relic route (Game.Inventory.addItem), not a kill or a quest ===');
var c20 = makeCharacter({ name: 'RelicHunter' });
setLevel(c20, 34);
Game.Inventory.addItem(c20, 'quest_eidas_echo_seal');
assert(Game.Classes.isObtained(c20, 'heir_of_the_echo') === false, 'relic below minLevel (35) grants nothing at level 34');
setLevel(c20, 35);
Game.Inventory.addItem(c20, 'quest_eidas_echo_seal');
assert(Game.Classes.isObtained(c20, 'heir_of_the_echo') === true, 'relic at level 35 grants Heir of the Echo');
assert(c20.legendaryUnlocked === true, 'legendaryUnlocked latch set true by the relic route too');
var classesCountBefore20 = Object.keys(c20.classes).length;
Game.Inventory.addItem(c20, 'quest_eidas_echo_seal'); // a second copy must not re-obtain
var classesCountAfter20 = Object.keys(c20.classes).length;
assert(classesCountAfter20 === classesCountBefore20, 'a second seal does not obtain a duplicate legendary class entry');

// =================== Test 21: Legendary independence — obtaining one does not block another =====
console.log('\n=== Test 21: Legendary independence — the 3 Legendaries unlock via mutually-independent routes (v1.2 Phase 2 roster growth from 1 to 3) ===');
var c21 = makeCharacter({ name: 'MultiLegendary' });
setLevel(c21, 35);
winBattle('estari_ruin_warden'); // level 10 boss, well beneath level 35 -> XP/loot cutoff, but the Legendary check runs BEFORE that cutoff (a kill is a kill)
assert(Game.Classes.isObtained(c21, 'runeblade_of_kuraan') === true, 'Runeblade obtained via its boss-kill route');
Game.Inventory.addItem(c21, 'quest_eidas_echo_seal');
assert(Game.Classes.isObtained(c21, 'heir_of_the_echo') === true, 'Heir of the Echo ALSO obtained — Runeblade did not block it');
assert(Game.Classes.isObtained(c21, 'vaultbreaker') === false, 'vaultbreaker still NOT obtained (its own route was never triggered here)');

// =================== Test 22 (v1.5 P4): obtain/activate/buyAbility/classBonus for two of the ===
// =================== new Tier-3 classes at once (Paladin primary + Ranger secondary) ============
console.log('\n=== Test 22 (v1.5 P4): obtain/activate/buyAbility/classBonus for two NEW Tier-3 classes held simultaneously (Paladin + Ranger) ===');
var c22 = makeCharacter({ name: 'NewClassTester' });
setLevel(c22, 60);
c22.currentLocation = 'eldor';
var obtainPaladin22 = Game.Classes.obtainClass(c22, 'paladin');
assert(obtainPaladin22.ok === true, 'paladin obtained: ' + obtainPaladin22.message);
var obtainRanger22 = Game.Classes.obtainClass(c22, 'ranger');
assert(obtainRanger22.ok === true, 'ranger obtained: ' + obtainRanger22.message);
assert(Game.Classes.activate(c22, 'paladin', 'primary').ok === true, 'paladin activated as primary');
assert(Game.Classes.activate(c22, 'ranger', 'secondary').ok === true, 'ranger activated as secondary');
Game.Classes.addClassXp(c22, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY); // plenty of class levels (grants to BOTH slots, primary CLASS_XP_FRACTION_PRIMARY + secondary CLASS_XP_FRACTION_SECONDARY)

var dmgPctBefore22 = Game.Classes.classBonus(c22, 'damage_pct');
var buyHolyBulwark22 = Game.Classes.buyAbility(c22, 'paladin', 'paladin_holy_bulwark');
assert(buyHolyBulwark22.ok === true, "Paladin's Holy Bulwark purchased: " + buyHolyBulwark22.message);
var buyRighteousFury22 = Game.Classes.buyAbility(c22, 'paladin', 'paladin_righteous_fury');
assert(buyRighteousFury22.ok === true, "Paladin's Righteous Fury purchased: " + buyRighteousFury22.message);
var buyMarksmansEye22 = Game.Classes.buyAbility(c22, 'ranger', 'ranger_marksmans_eye');
assert(buyMarksmansEye22.ok === true, "Ranger's Marksman's Eye purchased: " + buyMarksmansEye22.message);
var buyWoodlandStep22 = Game.Classes.buyAbility(c22, 'ranger', 'ranger_woodland_step');
assert(buyWoodlandStep22.ok === true, "Ranger's Woodland Step purchased: " + buyWoodlandStep22.message);

var paladinDef22 = Game.Classes.getClass('paladin');
var rangerDef22 = Game.Classes.getClass('ranger');
var expectedDmgPct22 = Game.Classes.getAbility(paladinDef22, 'paladin_righteous_fury').power +
  Game.Classes.getAbility(rangerDef22, 'ranger_marksmans_eye').power;
var dmgPctAfter22 = Game.Classes.classBonus(c22, 'damage_pct');
assert(Math.abs(dmgPctAfter22 - (dmgPctBefore22 + expectedDmgPct22)) < 1e-9,
  'classBonus(damage_pct) sums BOTH active new classes\' passives (Paladin\'s Righteous Fury + Ranger\'s Marksman\'s Eye), expected +' + expectedDmgPct22 + ', got delta ' + (dmgPctAfter22 - dmgPctBefore22));
assert(Game.Classes.classBonus(c22, 'armor_flat') === Game.Classes.getAbility(paladinDef22, 'paladin_holy_bulwark').power,
  'classBonus(armor_flat) reflects Paladin\'s Holy Bulwark alone (Ranger has none), got ' + Game.Classes.classBonus(c22, 'armor_flat'));
assert(Game.Classes.classBonus(c22, 'dodge_flat') === Game.Classes.getAbility(rangerDef22, 'ranger_woodland_step').power,
  'classBonus(dodge_flat) reflects Ranger\'s Woodland Step alone (Paladin has none), got ' + Game.Classes.classBonus(c22, 'dodge_flat'));

var deactivatePaladin22 = Game.Classes.deactivate(c22, 'primary');
assert(deactivatePaladin22.ok === true, 'paladin deactivated: ' + deactivatePaladin22.message);
assert(Game.Classes.classBonus(c22, 'armor_flat') === 0, 'deactivating Paladin drops classBonus(armor_flat) back to 0');

// =================== Test 23 (v1.5 P4): a NEW class's classOnly tech is battle-castable while ===
// =================== active and refused while inactive, incl. a GRADED (Light) tech's mitigation ==
console.log("\n=== Test 23 (v1.5 P4): Paladin's Smite (graded Light tech) usable while active, refused while inactive ===");
var c23 = makeCharacter({ name: 'NewTechBuyer' });
setLevel(c23, 60);
c23.currentLocation = 'eldor';
Game.Classes.obtainClass(c23, 'paladin');
Game.Classes.activate(c23, 'paladin', 'primary');
Game.Classes.addClassXp(c23, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
var buySmite23 = Game.Classes.buyAbility(c23, 'paladin', 'paladin_smite');
assert(buySmite23.ok === true, 'Smite purchased: ' + buySmite23.message);
assert(c23.techs.indexOf('tech_paladin_smite') !== -1, 'tech_paladin_smite added to c.techs');
c23.techSets[0][0] = 'tech_paladin_smite';

c23.hitPoints = c23.hitPointsMax; c23.energy = c23.energyMax;
setRng(fixedRng(0.5));
var battle23 = Game.Battle.start('plains_field_rat');
battle23.monster.hp = 999;
var beforeHp23 = battle23.monster.hp;
Game.Battle.useTech('tech_paladin_smite');
assert(battle23.monster.hp < beforeHp23, "Paladin's Smite (Light-grade, Magic-Armor-mitigated) lands damage while Paladin is active (hp " + beforeHp23 + ' -> ' + battle23.monster.hp + ')');
Game.Battle.flee();
Game.Battle.endBattle();

var deactivatePaladin23 = Game.Classes.deactivate(c23, 'primary');
assert(deactivatePaladin23.ok === true, 'paladin deactivated: ' + deactivatePaladin23.message);
c23.techs.push('tech_paladin_smite'); // re-add to c.techs to isolate the class-active gate specifically (deactivate already stripped it, matching Test 11's pattern)
c23.techSets[0][0] = 'tech_paladin_smite';
c23.hitPoints = c23.hitPointsMax; c23.energy = c23.energyMax;
var battle23b = Game.Battle.start('plains_field_rat');
battle23b.monster.hp = 999;
var beforeHp23b = battle23b.monster.hp;
Game.Battle.useTech('tech_paladin_smite');
assert(battle23b.monster.hp === beforeHp23b, "Paladin's Smite does NOT land while Paladin is inactive, even if slotted (hp unchanged at " + battle23b.monster.hp + ')');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 24 (v1.5 P4 §3a): the Conjurer's Elemental Servitor ===================
console.log("\n=== Test 24 (v1.5 P4 §3a): Conjurer's Elemental Servitor — auto-weakness grade, per-round tick, replace-not-stack, expiry, transient on battle end ===");
var summonTechDef24 = Game.Battle.getTech('tech_summon_elemental');
assert(summonTechDef24 && summonTechDef24.effect === 'summon' && summonTechDef24.classOnly === true && summonTechDef24.classId === 'conjurer',
  'tech_summon_elemental exists with effect "summon", classOnly, classId conjurer');

var c24 = makeCharacter({ name: 'ConjurerTester' });
setLevel(c24, 60);
c24.currentLocation = 'eldor';
c24.intelligence = 50; // representative caster build so the servitor's tick is clearly, measurably nonzero
Game.Character.recalcDerived(c24);
Game.Classes.obtainClass(c24, 'conjurer');
Game.Classes.activate(c24, 'conjurer', 'primary');
Game.Classes.addClassXp(c24, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
var buySummon24 = Game.Classes.buyAbility(c24, 'conjurer', 'conjurer_summon_elemental');
assert(buySummon24.ok === true, 'Summon Elemental purchased: ' + buySummon24.message);
c24.techSets[0][0] = 'tech_summon_elemental';

c24.hitPoints = c24.hitPointsMax; c24.energy = c24.energyMax;
// rng fixed at 0.5: no dodge, no glancing, and rollVariance's uniform-in-[1-v,1+v] formula
// collapses to exactly the base value at the midpoint — deterministic tick damage.
setRng(fixedRng(0.5));
// estari_construct_sentinel: resistances { Earth: 0.5, Water: -0.25 } — Water is its ONLY
// vulnerability (lowest resistance value), so the auto-weakness pick must be Water, not the
// Fire default (D4's default only applies when NO grade is negative/lower than the others).
var battle24 = Game.Battle.start('estari_construct_sentinel');
assert(battle24.monster.statuses.length === 0, 'no servitor present before casting');
var actionsBeforeSummon24 = battle24.monsterActionsTaken || 0;
var hpBeforeSummon24 = battle24.monster.hp;
Game.Battle.useTech('tech_summon_elemental');
assert(battle24.monster.statuses.length === 1, 'exactly one servitor status present after casting');
var servitor24 = battle24.monster.statuses[0];
assert(servitor24.type === 'servitor' && servitor24.name === 'Elemental Servitor', 'servitor entry shaped correctly, got ' + JSON.stringify(servitor24));
assert(servitor24.grade === 'Water', "auto-weakness picked the monster's ONLY vulnerability (Water, -0.25) over its Earth resistance (+0.5) or any neutral grade, got " + servitor24.grade);
assert(servitor24.turnsLeft === summonTechDef24.servitorTurns - 1, 'servitor.turnsLeft already decremented once by the SAME-ROUND tick in finishRound (mirrors Poison\'s own apply-then-tick-this-round convention), got ' + servitor24.turnsLeft + ' (servitorTurns=' + summonTechDef24.servitorTurns + ')');
assert(battle24.monster.hp < hpBeforeSummon24, "the servitor's same-round tick already dealt damage this round (hp " + hpBeforeSummon24 + ' -> ' + battle24.monster.hp + ')');
assert((battle24.monsterActionsTaken || 0) === actionsBeforeSummon24 + 1, 'the servitor granted the monster NO extra action — exactly one monsterAct (the normal counter-attack) ran this round, not two');

// Re-summon REPLACES, not stacks.
Game.Battle.useTech('tech_summon_elemental');
assert(battle24.monster.statuses.length === 1, 'STILL exactly one servitor after re-summoning (replace, not stack)');
assert(battle24.monster.statuses[0].turnsLeft === summonTechDef24.servitorTurns - 1, "the replaced servitor is freshly re-ticked from a FULL servitorTurns, not stacked on top of the old one's remaining turns");

// Tick it down to expiry (defend() needs no weapon, so it isolates the servitor tick cleanly).
var turnsToExpire24 = summonTechDef24.servitorTurns - 1;
for (var t24 = 0; t24 < turnsToExpire24 && battle24.phase === 'active'; t24++) {
  Game.Battle.defend();
}
if (battle24.phase === 'active') {
  assert(battle24.monster.statuses.filter(function (st) { return st.type === 'servitor'; }).length === 0,
    'servitor removed once its servitorTurns (' + summonTechDef24.servitorTurns + ') fully elapse, got statuses=' + JSON.stringify(battle24.monster.statuses));
} else {
  // The servitor's own recurring damage killed the monster before it expired naturally — an
  // equally valid outcome of "strong vs. a long fight" (spec §3a) and still proves the tick fired
  // every round; the battle-end branch below re-covers the transience assertion independently.
  assert(battle24.phase === 'won', 'if the battle ended before the servitor expired, it must be because the servitor\'s own ticks won the fight, got phase=' + battle24.phase);
  Game.Battle.endBattle();
}

// Battle-transient: absent on a fresh battle, even against the same monster with the same class active.
var battle24b = Game.Battle.start('estari_construct_sentinel');
assert(battle24b.monster.statuses.length === 0, 'a fresh battle starts with NO servitor carried over from the previous battle (battle-transient, never persisted)');
Game.Battle.useTech('tech_summon_elemental');
assert(battle24b.monster.statuses.length === 1, 'servitor re-summoned in the new battle');
Game.Battle.flee();
Game.Battle.endBattle();
assert(Game.state.battle === null, 'battle object (and its monster.statuses) discarded after endBattle');

// D4 default: a monster with NO resistances at all falls through to the fixed default grade (Fire).
var c24c = makeCharacter({ name: 'ConjurerDefaultGrade' });
setLevel(c24c, 60);
c24c.currentLocation = 'eldor';
Game.Classes.obtainClass(c24c, 'conjurer');
Game.Classes.activate(c24c, 'conjurer', 'primary');
Game.Classes.addClassXp(c24c, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
Game.Classes.buyAbility(c24c, 'conjurer', 'conjurer_summon_elemental');
c24c.techSets[0][0] = 'tech_summon_elemental';
c24c.hitPoints = c24c.hitPointsMax; c24c.energy = c24c.energyMax;
setRng(fixedRng(0.5));
var battle24c = Game.Battle.start('plains_field_rat'); // resistances: {} — no grade is more negative than any other
Game.Battle.useTech('tech_summon_elemental');
assert(battle24c.monster.statuses[0].grade === 'Fire', 'a monster with no resistances at all defaults to Fire (D4), got ' + battle24c.monster.statuses[0].grade);
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 25 (v1.5 P4 §5, legacy): a hand-crafted save with a Crusader who ======
// =================== obtained Shadowknight under the OLD convergence rule (now "impossible" =====
// =================== under branching, since Shadowknight's baseClass is now gladiator) loads =====
// =================== intact and BOTH classes remain fully usable — no migration strips anything ===
console.log('\n=== Test 25 (v1.5 P4 §5): legacy Crusader+Shadowknight combo (impossible under new branching) loads intact and both remain usable ===');
var legacyComboChar = makeV6Character({
  level: 60, xp: BALANCE.XP_TO_LEVEL(60),
  classes: {
    crusader: { classXp: 200, classLevelsEarned: 4, classLevelsSpent: 0, abilities: [] },
    shadowknight: { classXp: 500, classLevelsEarned: 8, classLevelsSpent: 3, abilities: ['shadowknight_inner_fire'] }
  },
  primaryClass: 'crusader',
  secondaryClass: 'shadowknight',
  techs: ['tech_shadow_blade'],
  techSets: [['tech_shadow_blade', null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null]]
});
localStorageStore['herorpg_save'] = JSON.stringify({ version: 6, state: { character: legacyComboChar } });
var loadedLegacyCombo = Game.Save.load();
assert(loadedLegacyCombo !== null, 'legacy Crusader+Shadowknight save loads without error through the full v6->v10 migration chain');
assert(!!loadedLegacyCombo.character.classes.crusader, 'classes.crusader preserved');
assert(!!loadedLegacyCombo.character.classes.shadowknight, 'classes.shadowknight preserved — an "impossible" combo under the NEW branching rule (Shadowknight now re-homed to gladiator), kept per §5 [revised]: obtaining is permanent, no migration strips or re-keys it');
assert(loadedLegacyCombo.character.classes.shadowknight.abilities.indexOf('shadowknight_inner_fire') !== -1, "shadowknight's previously-purchased ability survives migration untouched");
assert(loadedLegacyCombo.character.primaryClass === 'crusader' && loadedLegacyCombo.character.secondaryClass === 'shadowknight', 'both active slots preserved');

Game.state = loadedLegacyCombo;
Game.state.battle = null;
var legacyC = loadedLegacyCombo.character;
legacyC.currentLocation = 'eldor';
var legacyBonus = Game.Classes.classBonus(legacyC, 'damage_pct');
assert(legacyBonus > 0, "the legacy Shadowknight's already-purchased Inner Fire passive still contributes to classBonus while active (damage_pct=" + legacyBonus + ')');

legacyC.hitPoints = legacyC.hitPointsMax;
legacyC.energy = legacyC.energyMax;
setRng(fixedRng(0.5));
var legacyBattle = Game.Battle.start('plains_field_rat');
legacyBattle.monster.hp = 999;
var legacyHpBefore = legacyBattle.monster.hp;
Game.Battle.useTech('tech_shadow_blade');
assert(legacyBattle.monster.hp < legacyHpBefore, "legacy Shadowknight's class tech is still fully usable in battle (still active in the secondary slot), hp " + legacyHpBefore + ' -> ' + legacyBattle.monster.hp);
Game.Battle.flee();
Game.Battle.endBattle();

// Only the OFFER logic changed, not the already-obtained class: this Crusader is now offered
// Paladin/Warden (its own tier-2 pair), NOT Shadowknight — Shadowknight remains obtained but is
// no longer re-offerable, matching §5/§10's "returning players see new offers" note.
var legacyOffers = Game.Classes.thirdTierOptionsFor(legacyC).slice().sort().join(',');
assert(legacyOffers === 'paladin,warden', "thirdTierOptionsFor now offers [paladin, warden] for this Crusader (only future OFFERS changed), got " + legacyOffers);
assert(legacyOffers.indexOf('shadowknight') === -1, 'shadowknight no longer appears as a future OFFER for a Crusader, even though it remains obtained and usable');

// =================== Test 26 (v1.6 P2, PG-2): class pacing — a freshly-obtained class needs =====
// =================== MANY more wins to reach its first ability than the old curve/fractions ======
console.log('\n=== Test 26 (v1.6 P2): class-XP pacing (PG-2) — a class needs many more wins to reach its first ability than before ===');
var c26 = makeCharacter({ name: 'ClassPacingTest' });
setLevel(c26, 5);
c26.currentLocation = 'eldor';
Game.Classes.obtainClass(c26, 'warrior');
Game.Classes.activate(c26, 'warrior', 'primary');
var cheapestWarriorAbility26 = Game.Classes.getClass('warrior').abilities.slice().sort(function (a, b) { return a.classLevelCost - b.classLevelCost; })[0];

// Drive the REAL addClassXp function repeatedly with a representative per-win combat-XP amount
// (a level-5 kill) — the same integration point js/core/battle.js onWin uses
// (Game.Classes.addClassXp(c, xpGain)) — counting how many "wins" it takes before enough Class
// Levels are earned to afford the class's cheapest ability.
var perWinXp26 = BALANCE.MONSTER_XP(5);
var winsNeeded26 = 0;
while (Game.Classes.unspentClassLevels(c26, 'warrior') < cheapestWarriorAbility26.classLevelCost && winsNeeded26 < 100000) {
  Game.Classes.addClassXp(c26, perWinXp26);
  winsNeeded26++;
}
assert(Game.Classes.unspentClassLevels(c26, 'warrior') >= cheapestWarriorAbility26.classLevelCost, 'sanity: enough class levels eventually earned to afford the cheapest ability, got winsNeeded=' + winsNeeded26);

// Comparison yardstick ONLY (not a live game formula): the shipped pre-v1.6 curve
// (round(30*(n-1)^1.6)) with the shipped pre-v1.6 fraction (primary received the FULL combat-XP
// amount, no scale-down) — how many wins THAT would have needed for the same ability.
function oldClassXpForLevel26(n) { return Math.round(30 * Math.pow(n - 1, 1.6)); }
var oldEarned26 = 0, oldXp26 = 0, oldWins26 = 0;
while (oldEarned26 < cheapestWarriorAbility26.classLevelCost && oldWins26 < 100000) {
  oldXp26 += perWinXp26; // old: primary received the FULL combat-XP amount, no fraction
  while (oldXp26 >= oldClassXpForLevel26(oldEarned26 + 2)) oldEarned26++;
  oldWins26++;
}
assert(winsNeeded26 > oldWins26 * 3, 'v1.6 P2 (PG-2): a freshly-obtained class needs MANY more wins to reach its first ability than the old curve/fraction (' + winsNeeded26 + ' wins vs old ' + oldWins26 + ' wins)');

// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
