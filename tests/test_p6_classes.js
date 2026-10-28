// Phase 6a/v1.1 + v1.2 Phase 2 + v1.5 P4 exit tests — four-tier class system (DESIGN.md §3 v1.1
// revision; docs/SPEC-V1.2.md Phase 2; docs/SPEC-TIER3-EXPANSION.md v1.5 P4): Base tier
// (Warrior/Magician/Thief, level 5, "First Calling") -> Advanced tier (Gladiator/Crusader/Wizard/
// Sage/Rogue/Mercenary, level 30, "Trials of Ascension") -> Third tier (12 classes, level 60
// (re-gated from 38 by level-arc F4), "The Master's Calling", TWO per tier-2 class via v1.5 P4
// BRANCHING — supersedes the old branch-convergence rule) -> Legendary (Runeblade of
// Kuraan/Vaultbreaker/Heir of the Echo, each
// with its own mutually-independent special unlock route). v1.11 (docs/SPEC-CLASS-LINEAGE.md) turned
// the Primary/Secondary slots into the Hero Tree: tier 1/2/3 classes auto-activate into c.lineage
// on obtain, ONE optional Legendary slot (setLegendary, Academy-only), shared class-XP pool, no
// deactivation. Covers obtain/lineage/Legendary slot, class XP/levels, ability purchase incl. passive + tech hooks, class-only tech battle gating,
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
loadScript('data/companions.js');
loadScript('core/character.js');
loadScript('core/inventory.js');
loadScript('core/battle.js');
loadScript('core/companion.js');
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
  // docs/SPEC-MELEE-CLASS-TECHS.md §2.3: the Legendary weapon twins, granted with their spell form.
  'tech_runic_severance_blade', 'tech_vault_reckoning_blade', 'tech_echoing_judgment_blade',
  'tech_shadow_blade', 'tech_anima_reckoning', 'tech_dice_throw', 'tech_vault_reckoning', 'tech_echoing_judgment',
  // v1.5 P4: the 9 new Tier-3 classOnly signature techs (docs/SPEC-TIER3-EXPANSION.md Part B).
  // tech_summon_elemental RETIRED v1.9 (docs/SPEC-COMPANION-SYSTEM.md D0) — replaced below by the
  // Conjurer's 8 new companion-system tech ids (4 Bind + 4 command, granted via `techIds` arrays).
  'tech_berserker_frenzy', 'tech_paladin_smite', 'tech_warden_bulwark',
  'tech_greater_restoration', 'tech_seers_ward', 'tech_lethal_strike', 'tech_ranger_volley', 'tech_dragoon_leap',
  'tech_summon_fire', 'tech_summon_water', 'tech_summon_earth', 'tech_summon_wind',
  'tech_cmd_conflagration', 'tech_cmd_renewing_tide', 'tech_cmd_bulwark', 'tech_cmd_tailwind'
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
// 2 classes per tier-2 (12 total), 3 abilities each (2 passive + 1 signature classOnly tech) —
// EXCEPT the v1.9-redesigned Conjurer (docs/SPEC-COMPANION-SYSTEM.md D4), which deliberately
// exceeds the standard budget with 6 abilities (2 passives + 4 per-element Pacts, each granting a
// Bind + command tech pair via the new `techIds` array field).
var THIRD_TIER_ABILITY_COUNT = { conjurer: 6 };
var THIRD_TIER_IDS = [];
Object.keys(THIRD_TIER_PAIRS).forEach(function (tier2Id) {
  THIRD_TIER_PAIRS[tier2Id].forEach(function (tierId) {
    THIRD_TIER_IDS.push(tierId);
    var cd = Game.Classes.getClass(tierId);
    assert(cd && cd.tier === 3 && !cd.legendary && cd.baseClass === tier2Id,
      tierId + ' is a tier-3 class with baseClass ' + tier2Id + ' (a TIER-2 id, v1.5 P4 branching), got baseClass=' + (cd && cd.baseClass));
    var expectedAbilityCount = THIRD_TIER_ABILITY_COUNT[tierId] || 3;
    assert(cd.abilities.length === expectedAbilityCount, tierId + ' has ' + expectedAbilityCount + ' abilities, got ' + (cd ? cd.abilities.length : 'undefined'));
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
    if (a.kind !== 'tech') return;
    // v1.9 (SPEC-COMPANION-SYSTEM.md §2.5): an ability may carry a single `techId` OR an array
    // `techIds` (the Conjurer's Pact abilities) — resolve and check EVERY tech id either way.
    var idsToCheck = a.techId ? [a.techId] : (a.techIds || []);
    assert(idsToCheck.length > 0, cd.id + ' tech ability ' + a.id + ' has at least one tech id (techId or techIds)');
    idsToCheck.forEach(function (tid) {
      var t = Game.Battle.getTech(tid);
      assert(t && t.classOnly === true && t.classId === cd.id, cd.id + ' tech ability ' + a.id + ' resolves ' + tid + ' to a classOnly tech tagged with classId ' + cd.id);
    });
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
// v1.7 Phase Q (docs/SPEC-V1.7-CONTENT-UX.md §2): re-homed Eldor -> Kastengard Vanguard Camp,
// renamed a second time to match ("The Trials of Eldor" -> "The Trials of Ascension" -> "The
// Trials of the Vanguard") — the id and class-advancement mechanic are unchanged.
assert(trials.name === 'The Trials of the Vanguard', 'trials_of_eldor renamed for display to "The Trials of the Vanguard", got "' + (trials && trials.name) + '"');
assert(trials.giver.areaId === 'kastengard_vanguard_camp', 'trials_of_eldor giver re-homed to kastengard_vanguard_camp, got ' + (trials && trials.giver.areaId));
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
// v1.11 (v11->v12 step, SPEC-CLASS-LINEAGE M1/M2): the v6->v7 rename still re-keys rogue -> thief, and
// the Primary slot (now thief) wins the tier-1 lineage tie against warrior; the slot fields are gone.
assert(loadedV6.character.lineage.tier1 === 'thief', 'old Primary (rogue, renamed thief) fills lineage.tier1, got ' + loadedV6.character.lineage.tier1);
assert(!('primaryClass' in loadedV6.character) && !('secondaryClass' in loadedV6.character), 'primaryClass/secondaryClass deleted by the v11->v12 step');
Game.state = loadedV6;
Game.persist();
var resavedV6 = JSON.parse(localStorageStore['herorpg_save']);
assert(resavedV6.version === 12, 'resaved payload is stamped CURRENT_VERSION 12, got ' + resavedV6.version);


// Second crafted payload: rogue in the SECONDARY slot instead of primary ("incl. active slots").
console.log('\n=== Test 1b: v6 save with rogue in the SECONDARY slot also migrates ===');
var v6Character2 = makeV6Character({ primaryClass: 'warrior', secondaryClass: 'rogue' });
localStorageStore['herorpg_save'] = JSON.stringify({ version: 6, state: { character: v6Character2 } });
var loadedV6b = Game.Save.load();
assert(loadedV6b !== null, 'v6 save (secondary=rogue) loads without error');
assert(loadedV6b.character.lineage.tier1 === 'warrior', 'Primary (warrior) wins the tier-1 lineage slot over Secondary (thief), got ' + loadedV6b.character.lineage.tier1);
assert(Game.Classes.activeClassIds(loadedV6b.character).indexOf('thief') === -1, 'the renamed Secondary thief stays in c.classes but is not active (M2)');
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
assert(loadedV1.character.lineage && loadedV1.character.lineage.tier1 === null && loadedV1.character.lineage.tier2 === null && loadedV1.character.lineage.tier3 === null && loadedV1.character.legendaryClass === null, 'v1->v12: lineage all null + legendaryClass null (v11->v12 step)');
assert(!('primaryClass' in loadedV1.character) && !('secondaryClass' in loadedV1.character), 'v1->v12: no primaryClass/secondaryClass fields remain');
assert(loadedV1.character.legendaryUnlocked === false, 'v1->v7: legendary latch false');
Game.state = loadedV1;
Game.persist();
assert(JSON.parse(localStorageStore['herorpg_save']).version === 12, 'v1->v12 resave stamps version 12');


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
// v1.7 Phase Q: trials_of_eldor re-homed Eldor -> Kastengard Vanguard Camp (minLevel 26).
Game.World.travelTo('kastengard_vanguard_camp');
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
// v1.7 Phase Q: trials_of_eldor re-homed Eldor -> Kastengard Vanguard Camp (minLevel 26).
Game.World.travelTo('kastengard_vanguard_camp');
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

// =================== Test 8: addClassXp — shared pool over active classes, none for non-lineage ===================
console.log('\n=== Test 8: addClassXp shared pool (v1.11) + classLevelsEarned curve ===');
var c8 = makeCharacter({ name: 'XpTester' });
setLevel(c8, 30);
Game.Classes.obtainClass(c8, 'warrior');
Game.Classes.obtainClass(c8, 'gladiator');
Game.Classes.obtainClass(c8, 'thief'); // a SECOND tier-1 class: obtained but never in the lineage, so never active
Game.Classes.addClassXp(c8, 100);
// v1.11 (SPEC-CLASS-LINEAGE R8/D2): ONE pool, floor(100 * CLASS_XP_POOL_FRACTION), split evenly over the 2 active classes.
var pool8 = Math.floor(100 * BALANCE.CLASS_XP_POOL_FRACTION);
assert(c8.classes['warrior'].classXp === Math.floor(pool8 / 2), 'warrior gained floor(pool/2) class XP, got ' + c8.classes['warrior'].classXp);
assert(c8.classes['gladiator'].classXp === Math.floor(pool8 / 2), 'gladiator gained floor(pool/2) class XP, got ' + c8.classes['gladiator'].classXp);
assert(c8.classes['thief'].classXp === 0, 'obtained-but-not-active class (thief) gained 0 class XP');
var c8b = makeCharacter({ name: 'CurveTester' });
setLevel(c8b, 30);
Game.Classes.obtainClass(c8b, 'warrior');
var xpForLevel1 = Game.Classes.classXpForLevel(1);
assert(xpForLevel1 === 0, 'classXpForLevel(1) === 0 (cumulative curve convention), got ' + xpForLevel1);
var xpForLevel2 = Game.Classes.classXpForLevel(2);
// v1.6 P2 (PG-2): steepened round(30*(n-1)^1.6) -> round(120*(n-1)^1.9), LOCKED by the P0 calc.
assert(xpForLevel2 === Math.round(120 * Math.pow(1, 1.9)), 'classXpForLevel(2) matches round(120*(n-1)^1.9), got ' + xpForLevel2);
// addClassXp scales the raw amount down by CLASS_XP_POOL_FRACTION before banking it — divide by
// that fraction here so the lone active class nets exactly xpForLevel2 worth of class XP.
Game.Classes.addClassXp(c8b, xpForLevel2 / BALANCE.CLASS_XP_POOL_FRACTION);
assert(c8b.classes['warrior'].classLevelsEarned === 1, 'classLevelsEarned incremented once at the level-2 threshold, got ' + c8b.classes['warrior'].classLevelsEarned);
var xpForLevel3 = Game.Classes.classXpForLevel(3);
Game.Classes.addClassXp(c8b, (xpForLevel3 - xpForLevel2 + 5) / BALANCE.CLASS_XP_POOL_FRACTION);
assert(c8b.classes['warrior'].classLevelsEarned >= 2, 'classLevelsEarned climbs further with more class XP, got ' + c8b.classes['warrior'].classLevelsEarned);

// =================== Test 9: buyAbility gating ===================
console.log('\n=== Test 9: buyAbility blocked without Academy/active class/levels ===');
var c9 = makeCharacter({ name: 'AbilityBuyer' });
setLevel(c9, 5);
Game.Classes.obtainClass(c9, 'warrior');
Game.Classes.obtainClass(c9, 'thief'); // second tier-1 class: obtained, never in the lineage
c9.currentLocation = 'plains_of_averast'; // no academy here
var buyNoAcademy = Game.Classes.buyAbility(c9, 'warrior', 'warrior_iron_hide');
assert(buyNoAcademy.ok === false, 'buyAbility blocked away from an Academy: ' + buyNoAcademy.message);
c9.currentLocation = 'eldor'; // Eldor has an Academy
c9.classes['thief'].classLevelsEarned = 5;
var buyNotActive = Game.Classes.buyAbility(c9, 'thief', 'thief_light_fingers');
assert(buyNotActive.ok === false, 'buyAbility blocked while thief is obtained but not active (not in the lineage): ' + buyNotActive.message);
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
c10.currentLocation = 'eldor';
var armorBefore10 = Game.Character.getArmor(c10);
// Iron Hide costs 2, Brutal Strikes costs 3 -> need 5 unspent Class Levels. Divide by
// CLASS_XP_POOL_FRACTION so the lone active class nets the full intended raw amount.
Game.Classes.addClassXp(c10, (Game.Classes.classXpForLevel(6) + 20) / BALANCE.CLASS_XP_POOL_FRACTION);
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
Game.Classes.addClassXp(c11, (Game.Classes.classXpForLevel(6) + 10) / BALANCE.CLASS_XP_POOL_FRACTION);
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

// v1.11 (R2): there is no deactivation any more, so "class not active" is simulated by emptying
// the lineage slot directly. The class tech stays known + slotted; only the active-class gate bites.
c11.lineage.tier1 = null;
assert(c11.techs.indexOf('tech_crushing_blow') !== -1 && c11.techSets[0][0] === 'tech_crushing_blow', 'tech stays known and slotted (nothing strips it)');
c11.hitPoints = c11.hitPointsMax; c11.energy = c11.energyMax;
var battle11b = Game.Battle.start('plains_field_rat');
battle11b.monster.hp = 999;
var beforeHp11b = battle11b.monster.hp;
Game.Battle.useTech('tech_crushing_blow');
assert(battle11b.monster.hp === beforeHp11b, 'Crushing Blow does NOT land while Warrior is not an active class, even if slotted (hp unchanged at ' + battle11b.monster.hp + ')');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 11c (v1.3.1 fix 6): current HP clamped down after losing an hp_max_flat passive ===================
console.log('\n=== Test 11c: swapping out a Legendary with an hp_max_flat passive clamps current HP down to the new max ===');
var c11c = makeCharacter({ name: 'HpClampTest' });
setLevel(c11c, 30);
c11c.currentLocation = 'eldor';
Game.Classes.obtainClass(c11c, 'runeblade_of_kuraan'); // first Legendary auto-fills the slot (R4)
// Ancestral Vigor (runeblade_ancestral_vigor, hp_max_flat +30) costs 3 unspent Class Levels.
Game.Classes.addClassXp(c11c, (Game.Classes.classXpForLevel(10) + 100) / BALANCE.CLASS_XP_POOL_FRACTION);
var unspent11c = Game.Classes.unspentClassLevels(c11c, 'runeblade_of_kuraan');
assert(unspent11c >= 3, 'enough unspent class levels for Ancestral Vigor (3), got ' + unspent11c);
var hpMaxBefore11c = c11c.hitPointsMax;
var buyVigor11c = Game.Classes.buyAbility(c11c, 'runeblade_of_kuraan', 'runeblade_ancestral_vigor');
assert(buyVigor11c.ok === true, 'Ancestral Vigor purchased: ' + buyVigor11c.message);
assert(c11c.hitPointsMax === hpMaxBefore11c + 30, 'Ancestral Vigor raises hitPointsMax by +30 (before=' + hpMaxBefore11c + ', after=' + c11c.hitPointsMax + ')');
c11c.hitPoints = c11c.hitPointsMax; // full HP, at the boosted max
var unslot11c = Game.Classes.setLegendary(c11c, null);
assert(unslot11c.ok === true, 'Legendary unslotted at the Academy: ' + unslot11c.message);
assert(c11c.hitPointsMax === hpMaxBefore11c, 'hitPointsMax drops back by 30 after losing Ancestral Vigor');
assert(c11c.hitPoints === c11c.hitPointsMax, 'v1.3.1 fix 6: current hitPoints clamped down to the new (lower) max, not left dangling above it (hitPoints=' + c11c.hitPoints + ', hitPointsMax=' + c11c.hitPointsMax + ')');

// =================== Test 12: no deactivation / no wipe (v1.11 R2) ===================
console.log('\n=== Test 12: there is no deactivate path and nothing is ever wiped (SPEC-CLASS-LINEAGE R2) ===');
assert(typeof Game.Classes.deactivate === 'undefined' && typeof Game.Classes.activate === 'undefined', 'Game.Classes exposes no activate/deactivate');
var c12 = makeCharacter({ name: 'NoDeactivator' });
setLevel(c12, 5);
c12.currentLocation = 'eldor';
Game.Classes.obtainClass(c12, 'magician');
Game.Classes.addClassXp(c12, (Game.Classes.classXpForLevel(4) + 5) / BALANCE.CLASS_XP_POOL_FRACTION);
assert(c12.classes['magician'].classLevelsEarned > 0, 'magician earned some class levels, got ' + c12.classes['magician'].classLevelsEarned);
Game.Classes.buyAbility(c12, 'magician', 'magician_arcane_reserves');
var snap12 = JSON.stringify([c12.lineage, c12.classes['magician']]);
assert(Game.Classes.setLegendary(c12, 'magician').ok === false, 'a lineage class cannot be put in (or removed via) the Legendary slot');
assert(Game.Classes.setLegendary(c12, null).ok === false, 'unslotting an empty Legendary slot is refused; the lineage is untouched');
assert(JSON.stringify([c12.lineage, c12.classes['magician']]) === snap12, 'lineage + class progress identical after every attempt to remove a lineage class');

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

// =================== Test 14: sweep — every class of every tier can obtain/auto-activate/buy ===================
console.log('\n=== Test 14: sweep all classes — obtain/auto-activate/buyAbility correctly for every tier ===');
Game.Data.classes.forEach(function (cd) {
  var sc = makeCharacter({ name: 'Sweep_' + cd.id });
  setLevel(sc, cd.tier === 1 ? 5 : 30);
  sc.currentLocation = 'eldor';
  var obtainRes = Game.Classes.obtainClass(sc, cd.id);
  assert(obtainRes.ok === true, 'sweep: ' + cd.id + ' obtained: ' + obtainRes.message);
  assert(Game.Classes.activeClassIds(sc).indexOf(cd.id) !== -1, 'sweep: ' + cd.id + ' is active immediately on obtain (lineage tier slot or auto-filled Legendary slot)');
  var cheapest = cd.abilities.slice().sort(function (a, b) { return a.classLevelCost - b.classLevelCost; })[0];
  Game.Classes.addClassXp(sc, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_POOL_FRACTION); // plenty of class levels for any tier
  var buyRes = Game.Classes.buyAbility(sc, cd.id, cheapest.id);
  assert(buyRes.ok === true, 'sweep: ' + cd.id + ' bought its cheapest ability (' + cheapest.id + '): ' + buyRes.message);
  assert(sc.classes[cd.id].abilities.indexOf(cheapest.id) !== -1, 'sweep: ' + cd.id + ' ability recorded as owned');
  assert(sc.classes[cd.id].abilities.length === 1 && Game.Classes.activeClassIds(sc).indexOf(cd.id) !== -1, 'sweep: ' + cd.id + ' keeps its ability and stays active (no deactivation exists)');
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
assert(c15.lineage.tier1 === 'thief', 'loop: thief joined the lineage (tier 1) on turn-in');

setLevel(c15, 30);
// v1.7 Phase Q: trials_of_eldor re-homed Eldor -> Kastengard Vanguard Camp (minLevel 26).
c15.currentLocation = 'kastengard_vanguard_camp';
var loopTrialsAccept = Game.Quests.accept('trials_of_eldor');
assert(loopTrialsAccept.ok === true, 'loop: Trials of Ascension accepted (base class already obtained)');
winBattle('estari_ruin_warden');
Game.Inventory.addItem(c15, 'quest_condensed_anima_core');
Game.Inventory.addItem(c15, 'quest_estari_ward_fragment');
assert(Game.Classes.advancedOptionsFor(c15).slice().sort().join(',') === 'mercenary,rogue', 'loop: advancedOptionsFor resolves to [rogue, mercenary] for a thief base');
var loopTrialsTurnIn = Game.Quests.turnIn('trials_of_eldor', 'mercenary');
assert(loopTrialsTurnIn.ok === true, 'loop: turned in Trials of Ascension for mercenary: ' + loopTrialsTurnIn.message);
assert(Game.Classes.isObtained(c15, 'mercenary') === true, 'loop: mercenary obtained');

assert(c15.lineage.tier2 === 'mercenary', 'loop: mercenary joined the lineage (tier 2) on turn-in');

// Grind class XP via Game._debug.addClassXp — enough for Quick Pockets (2) + Efficient Strike (4).
// thief, mercenary AND the Runeblade (auto-slotted by the Trials' estari_ruin_warden boss kill, R4)
// are all active + un-maxed, so the shared pool (CLASS_XP_POOL_FRACTION) is split three ways —
// divide by the fraction and multiply by 3 so mercenary itself nets the target.
assert(Game.Classes.activeClassIds(c15).join(',') === 'thief,mercenary,runeblade_of_kuraan', 'loop: three active classes (thief, mercenary, auto-slotted Runeblade)');
Game._debug.addClassXp(3 * (Game.Classes.classXpForLevel(8) + 20) / BALANCE.CLASS_XP_POOL_FRACTION);
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
  assert(classesText.indexOf('Hero Tree') !== -1 && classesText.indexOf('Calling') !== -1 && classesText.indexOf('Ascension') !== -1 && classesText.indexOf('Mastery') !== -1, 'Classes tab shows the Hero Tree panel rows (Calling / Ascension / Mastery)');
  assert(classesText.indexOf('Unlocks at level 60') !== -1, 'the empty Mastery row shows its unlock hint');
  assert(classesText.indexOf('Primary') === -1 && classesText.indexOf('Secondary') === -1 && classesText.indexOf('Deactivate') === -1 && classesText.indexOf('Inactive Classes') === -1, 'no Primary/Secondary/Deactivate/Inactive Classes UI remains');

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
  assert(townText.indexOf('Legendary Calling') !== -1, 'Academy panel shows the Legendary row');
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
// v1.7 Phase Q: masters_calling re-homed Eldor -> Kuraan Reclamation Camp (minLevel 44).
Game.World.travelTo('kuraan_reclamation_camp');
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

// Full loop: (auto-active lineage) -> buyAbility -> class-tech usable in battle.
c18.currentLocation = 'eldor';
assert(c18.lineage.tier1 === 'warrior' && c18.lineage.tier2 === 'gladiator' && c18.lineage.tier3 === 'shadowknight', 'the full Warrior -> Gladiator -> Shadowknight lineage is active, got ' + JSON.stringify(c18.lineage));
// three un-maxed active classes share the pool 3 ways — multiply so Shadowknight still nets level 20
Game.Classes.addClassXp(c18, 3 * Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_POOL_FRACTION); // plenty of class levels
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
// v1.7 Phase Q: vaultbreakers_reckoning re-homed Eldor -> Kastengard Vanguard Camp (minLevel 26).
Game.World.travelTo('kastengard_vanguard_camp');
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

// =================== Test 22 (v1.5 P4 / v1.11): classBonus sums EVERY active class (lineage + Legendary) ======
console.log('\n=== Test 22 (v1.5 P4 / v1.11): classBonus sums a Tier-3 lineage class + the slotted Legendary; a non-lineage Tier-3 class contributes nothing ===');
var c22 = makeCharacter({ name: 'NewClassTester' });
setLevel(c22, 60);
c22.currentLocation = 'eldor';
var obtainPaladin22 = Game.Classes.obtainClass(c22, 'paladin');
assert(obtainPaladin22.ok === true, 'paladin obtained: ' + obtainPaladin22.message);
var obtainVb22 = Game.Classes.obtainClass(c22, 'vaultbreaker');
assert(obtainVb22.ok === true, 'vaultbreaker obtained: ' + obtainVb22.message);
var obtainRanger22 = Game.Classes.obtainClass(c22, 'ranger'); // a SECOND tier-3 class: never joins the lineage
assert(obtainRanger22.ok === true, 'ranger obtained: ' + obtainRanger22.message);
assert(Game.Classes.activeClassIds(c22).join(',') === 'paladin,vaultbreaker', 'active = paladin (tier 3) + vaultbreaker (Legendary), ranger is not active, got ' + Game.Classes.activeClassIds(c22).join(','));
// paladin + vaultbreaker are both active and un-maxed -> pool split 2 ways
Game.Classes.addClassXp(c22, 2 * Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_POOL_FRACTION);

var dmgPctBefore22 = Game.Classes.classBonus(c22, 'damage_pct');
var buyHolyBulwark22 = Game.Classes.buyAbility(c22, 'paladin', 'paladin_holy_bulwark');
assert(buyHolyBulwark22.ok === true, "Paladin's Holy Bulwark purchased: " + buyHolyBulwark22.message);
var buyRighteousFury22 = Game.Classes.buyAbility(c22, 'paladin', 'paladin_righteous_fury');
assert(buyRighteousFury22.ok === true, "Paladin's Righteous Fury purchased: " + buyRighteousFury22.message);
var buyTwofold22 = Game.Classes.buyAbility(c22, 'vaultbreaker', 'vaultbreaker_twofold_resolve');
assert(buyTwofold22.ok === true, "Vaultbreaker's Twofold Resolve purchased: " + buyTwofold22.message);
var buyPlating22 = Game.Classes.buyAbility(c22, 'vaultbreaker', 'vaultbreaker_vault_forged_plating');
assert(buyPlating22.ok === true, "Vaultbreaker's Vault-Forged Plating purchased: " + buyPlating22.message);
assert(Game.Classes.buyAbility(c22, 'ranger', 'ranger_marksmans_eye').ok === false, 'a non-lineage Ranger cannot buy abilities');

var paladinDef22 = Game.Classes.getClass('paladin');
var vbDef22 = Game.Classes.getClass('vaultbreaker');
var expectedDmgPct22 = Game.Classes.getAbility(paladinDef22, 'paladin_righteous_fury').power +
  Game.Classes.getAbility(vbDef22, 'vaultbreaker_twofold_resolve').power;
var dmgPctAfter22 = Game.Classes.classBonus(c22, 'damage_pct');
assert(Math.abs(dmgPctAfter22 - (dmgPctBefore22 + expectedDmgPct22)) < 1e-9,
  "classBonus(damage_pct) sums BOTH active classes' passives (Paladin's Righteous Fury + Vaultbreaker's Twofold Resolve), expected +" + expectedDmgPct22 + ', got delta ' + (dmgPctAfter22 - dmgPctBefore22));
assert(Game.Classes.classBonus(c22, 'armor_flat') === Game.Classes.getAbility(paladinDef22, 'paladin_holy_bulwark').power + Game.Classes.getAbility(vbDef22, 'vaultbreaker_vault_forged_plating').power,
  "classBonus(armor_flat) sums Paladin's Holy Bulwark + Vaultbreaker's plating, got " + Game.Classes.classBonus(c22, 'armor_flat'));
// Force-own a Ranger passive: still contributes nothing because Ranger is not in activeClassIds.
c22.classes['ranger'].abilities.push('ranger_woodland_step');
assert(Game.Classes.classBonus(c22, 'dodge_pct') === 0, 'a Ranger passive on a non-lineage class contributes nothing to classBonus');

// =================== Test 23 (v1.5 P4): a NEW class's classOnly tech is battle-castable while ===
// =================== active and refused while inactive, incl. a GRADED (Light) tech's mitigation ==
console.log("\n=== Test 23 (v1.5 P4): Paladin's Smite (graded Light tech) usable while active, refused while inactive ===");
var c23 = makeCharacter({ name: 'NewTechBuyer' });
setLevel(c23, 60);
c23.currentLocation = 'eldor';
Game.Classes.obtainClass(c23, 'paladin');
Game.Classes.addClassXp(c23, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_POOL_FRACTION);
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

// v1.11 (R2): no deactivation — simulate "class not active" by emptying the lineage slot directly;
// the tech stays known + slotted, isolating the class-active gate specifically.
c23.lineage.tier3 = null;
assert(c23.techs.indexOf('tech_paladin_smite') !== -1 && c23.techSets[0][0] === 'tech_paladin_smite', 'tech stays known and slotted');
c23.hitPoints = c23.hitPointsMax; c23.energy = c23.energyMax;
var battle23b = Game.Battle.start('plains_field_rat');
battle23b.monster.hp = 999;
var beforeHp23b = battle23b.monster.hp;
Game.Battle.useTech('tech_paladin_smite');
assert(battle23b.monster.hp === beforeHp23b, "Paladin's Smite does NOT land while Paladin is not an active class, even if slotted (hp unchanged at " + battle23b.monster.hp + ')');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 24 (v1.9): the Companion System ===================
// Replaces the retired Conjurer "Elemental Servitor" test (docs/SPEC-COMPANION-SYSTEM.md D0) —
// covers summon-at-full-HP, HP carrying across battles, automatic basic action + Energy tax,
// energy-starve idle, Fire's Burn DoT, Earth's Taunt redirect, a monster tech's `target:'both'`,
// mid-battle death forcing a resummon, and disperse-on-loss (D6).
console.log('\n=== Test 24 (v1.9): Companion System — summon/persist/idle/burn/taunt/target-both/death/loss ===');
function seqRng(values) {
  var i = 0;
  return function () {
    var v = values[Math.min(i, values.length - 1)];
    i++;
    return v;
  };
}

// ---- A) Binding via the Pact's Bind tech sets character.companion at full HP; the SAME battle's
// transient view is rebuilt immediately (useTech's summon branch). ----
var cA = makeCharacter({ name: 'CompanionTesterA' });
setLevel(cA, 60);
cA.currentLocation = 'eldor';
cA.intelligence = 50;
Game.Character.recalcDerived(cA);
Game.Classes.obtainClass(cA, 'conjurer');
Game.Classes.addClassXp(cA, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_POOL_FRACTION);
var buyFireA = Game.Classes.buyAbility(cA, 'conjurer', 'conjurer_pact_fire');
assert(buyFireA.ok === true, 'Pact of Cinders purchased: ' + buyFireA.message);
assert(cA.techs.indexOf('tech_summon_fire') !== -1 && cA.techs.indexOf('tech_cmd_conflagration') !== -1,
  "buying Pact of Cinders grants BOTH tech_summon_fire and tech_cmd_conflagration (js/core/classes.js buyAbility's new techIds-array handling)");
cA.techSets[0][0] = 'tech_summon_fire';
cA.techSets[0][1] = 'tech_cmd_conflagration';
cA.hitPoints = cA.hitPointsMax; cA.energy = cA.energyMax;

assert(cA.companion === null, 'no companion bound before summoning');
setRng(fixedRng(0.99));
var battleA = Game.Battle.start('plains_field_rat');
assert(battleA.companion === null, 'battle starts with no companion view (none bound yet)');
Game.Battle.useTech('tech_summon_fire');
var fireHpMax = Game.Companion.hpMaxFor(cA);
assert(cA.companion !== null && cA.companion.kindId === 'comp_fire', 'summoning binds character.companion to comp_fire');
assert(cA.companion.hp === fireHpMax, 'summoned companion starts at full HP, got ' + cA.companion.hp + ' / ' + fireHpMax);
assert(battleA.companion && battleA.companion.kindId === 'comp_fire' && battleA.companion.hp === fireHpMax,
  "the SAME battle already sees the new companion (useTech's summon branch rebuilds battle.companion immediately)");
Game.Battle.flee();
Game.Battle.endBattle();

// ---- B) HP carries across battles: damage the companion, end the battle (win), start a NEW
// battle, and confirm the SAME (reduced) HP is what the new battle rehydrates from. ----
var cB = makeCharacter({ name: 'CompanionTesterB' });
setLevel(cB, 60);
Game.Companion.summon(cB, 'comp_earth'); // pre-summon directly (isolates from useTech/Pact bookkeeping)
var earthHpMaxB = Game.Companion.hpMaxFor(cB);
cB.hitPoints = cB.hitPointsMax; cB.energy = cB.energyMax;
setRng(fixedRng(0.99));
var battleB1 = Game.Battle.start('plains_field_rat');
assert(battleB1.companion && battleB1.companion.kindId === 'comp_earth' && battleB1.companion.hp === earthHpMaxB,
  'Game.Battle.start() rehydrates a transient battle.companion view from a pre-existing character.companion');
battleB1.monster.hp = 999999; battleB1.monster.hpMax = 999999; battleB1.monster.energy = 999999; battleB1.monster.damage = 0;
var dmgToCompanionB = 20;
battleB1.companion.hp = Math.max(1, battleB1.companion.hp - dmgToCompanionB); // simulate prior damage this battle
setRng(fixedRng(0.01)); // comfortably below fleeChance -> flee succeeds
Game.Battle.flee();
assert(battleB1.phase === 'fled', 'sanity: battle B1 resolved as fled, phase=' + battleB1.phase);
assert(cB.companion.hp === battleB1.companion.hp, "a successful flee writes the companion's current (damaged) HP back to character.companion");
Game.Battle.endBattle();
var hpAfterB1 = cB.companion.hp;
assert(hpAfterB1 < earthHpMaxB, 'sanity: the persisted HP is indeed reduced from max, got ' + hpAfterB1 + ' / ' + earthHpMaxB);
setRng(fixedRng(0.99));
var battleB2 = Game.Battle.start('plains_field_rat');
assert(battleB2.companion && battleB2.companion.hp === hpAfterB1,
  'a NEW battle rehydrates the companion at the SAME persisted (damaged) HP it ended the last battle with — semi-permanent, not restored between battles');
Game.Battle.flee();
Game.Battle.endBattle();

// ---- C) The companion's automatic basic fires each player round and pays the player's Energy;
// also verifies Fire's Burn DoT applies (and already ticks once, same-round). ----
var cC = makeCharacter({ name: 'CompanionTesterC' });
setLevel(cC, 60);
cC.intelligence = 50;
Game.Character.recalcDerived(cC);
Game.Companion.summon(cC, 'comp_fire');
cC.hitPoints = cC.hitPointsMax; cC.energy = cC.energyMax;
setRng(fixedRng(0.99));
var battleC = Game.Battle.start('plains_field_rat');
battleC.monster.hp = battleC.monster.hpMax = 999999; battleC.monster.magicArmor = 0; battleC.monster.resistances = {};
var energyBeforeC = cC.energy;
var hpBeforeC = battleC.monster.hp;
Game.Battle.defend(); // any player action -> finishRound -> Game.Companion.act() fires FIRST
var energyAfterC = cC.energy;
assert(energyAfterC === energyBeforeC - BALANCE.DEFEND_ENERGY_COST - Game.Companion.getKind('comp_fire').basic.energyCost,
  "the companion's basic paid its own energyCost (4) on top of Defend's own cost, got energy " + energyBeforeC + ' -> ' + energyAfterC);
assert(battleC.monster.hp < hpBeforeC, "the Fire companion's Ember Lash already struck the monster this round, hp " + hpBeforeC + ' -> ' + battleC.monster.hp);
var burnAfterFirstTick = battleC.monster.statuses.filter(function (st) { return st.type === 'debuff' && st.debuffKind === 'burn'; });
assert(burnAfterFirstTick.length === 1, 'Ember Lash applied exactly one Burn debuff entry, got ' + JSON.stringify(battleC.monster.statuses));
assert(burnAfterFirstTick[0].turnsLeft === BALANCE.BURN_TURNS - 1, 'Burn already ticked down once this same round (apply-then-tick-this-round convention), got turnsLeft=' + burnAfterFirstTick[0].turnsLeft);
Game.Battle.flee();
Game.Battle.endBattle();

// ---- D) Energy-starve -> idle: a companion with NO status rider (Gale Sylph) makes the
// "zero damage while idle" check unambiguous (no leftover DoT ticking on its own to confound it). ----
var cD = makeCharacter({ name: 'CompanionTesterD' });
setLevel(cD, 60);
Game.Companion.summon(cD, 'comp_wind');
cD.hitPoints = cD.hitPointsMax;
setRng(fixedRng(0.99));
var battleD = Game.Battle.start('plains_field_rat');
battleD.monster.hp = battleD.monster.hpMax = 999999;
cD.energy = 2; // >= Defend's own cost (2) but < the Sylph's basic energyCost (6) -> idles
var hpBeforeD = battleD.monster.hp;
Game.Battle.defend();
assert(cD.energy === 0, "Defend spent its own 2 Energy; the companion's own cost (6) was NOT deducted (idled), energy=" + cD.energy);
assert(battleD.monster.hp === hpBeforeD, 'an idled companion (insufficient Energy) deals NO damage this round, hp unchanged at ' + battleD.monster.hp);
assert(battleD.log.some(function (l) { return /starved of Anima and holds back/.test(l); }), 'an idle round logs the starved-of-Anima message: ' + battleD.log.join(' | '));
Game.Battle.flee();
Game.Battle.endBattle();

// ---- F) Earth's Taunt redirects a monster's plain BASIC attack onto the companion instead of
// the player (no monster techs, so its only action is a basic attack). ----
var cF = makeCharacter({ name: 'CompanionTesterF' });
setLevel(cF, 60);
Game.Companion.summon(cF, 'comp_earth');
cF.hitPoints = cF.hitPointsMax; cF.energy = cF.energyMax;
setRng(fixedRng(0.99)); // no dodge/glancing anywhere (constant stub, safe regardless of call count)
var battleF = Game.Battle.start('plains_field_rat');
battleF.monster.techs = []; // basic attacks only
battleF.monster.hp = battleF.monster.hpMax = 999999;
battleF.monster.damage = 20;
Game.Companion.setTaunt(battleF, BALANCE.COMPANION_TAUNT_TURNS_BASIC);
assert(Game.Companion.tauntActive(battleF) === true, 'Taunt is active on the companion');
var playerHpBeforeF = battleF.player.hitPoints;
var companionHpBeforeF = battleF.companion.hp;
Game.Battle.defend();
assert(battleF.player.hitPoints === playerHpBeforeF, "the monster's basic attack did NOT hit the player while Taunt is active, hp unchanged at " + battleF.player.hitPoints);
assert(battleF.companion.hp < companionHpBeforeF, "the monster's basic attack was redirected onto the taunting companion instead, hp " + companionHpBeforeF + ' -> ' + battleF.companion.hp);
Game.Battle.flee();
Game.Battle.endBattle();

// ---- G) A monster tech with `target:'both'` (mon_cleaving_roar) hits the player AND the
// companion in one action, each rolled/mitigated independently. ----
var cG = makeCharacter({ name: 'CompanionTesterG' });
setLevel(cG, 60);
Game.Companion.summon(cG, 'comp_water'); // any kind — this test is about monster targeting, not the companion's own kit
cG.hitPoints = cG.hitPointsMax; cG.energy = cG.energyMax;
var cleavingRoar = Game.Battle.getTech('mon_cleaving_roar');
assert(cleavingRoar && cleavingRoar.target === 'both' && cleavingRoar.effect === 'damage', 'mon_cleaving_roar exists with target "both"');
setRng(fixedRng(0.99));
var battleG = Game.Battle.start('plains_field_rat');
battleG.monster.techs = ['mon_cleaving_roar'];
battleG.monster.energy = 999999;
battleG.monster.hp = battleG.monster.hpMax = 999999;
cG.energy = 2; // >= Defend's own cost (2) but < the Undine's basic energyCost (4) -> idles this round, isolating the monster's own action
var playerHpBeforeG = battleG.player.hitPoints;
var companionHpBeforeG = battleG.companion.hp;
// rng sequence for monsterAct: [0] tech-inclination roll (<0.5 -> pick a tech), [1] tech-array
// index pick (only 1 affordable tech, any value floors to index 0), [2] damageCompanion's own
// glancing roll, [3] damageCompanion's own variance roll, [4] player's dodge roll, [5] player's
// own glancing roll, [6] player's own variance roll — all kept comfortably away from proc
// thresholds (glancing 0.1, dodge low) except the [0] tech-pick roll.
setRng(seqRng([0.1, 0.1, 0.9, 0.5, 0.9, 0.9, 0.5]));
Game.Battle.defend();
assert(battleG.player.hitPoints < playerHpBeforeG, "target:'both' hit the PLAYER, hp " + playerHpBeforeG + ' -> ' + battleG.player.hitPoints);
assert(battleG.companion.hp < companionHpBeforeG, "target:'both' ALSO hit the COMPANION independently, hp " + companionHpBeforeG + ' -> ' + battleG.companion.hp);
Game.Battle.flee();
Game.Battle.endBattle();

// ---- H) Companion death (hp hits 0) mid-battle disperses it — battle.companionDispersed is set,
// a command tech requiring it is refused, and battle end nulls character.companion (must be
// re-summoned). ----
var cH = makeCharacter({ name: 'CompanionTesterH' });
setLevel(cH, 60);
Game.Classes.obtainClass(cH, 'conjurer');
Game.Classes.addClassXp(cH, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_POOL_FRACTION);
Game.Classes.buyAbility(cH, 'conjurer', 'conjurer_pact_fire');
cH.techSets[0][0] = 'tech_summon_fire';
cH.techSets[0][1] = 'tech_cmd_conflagration';
// Pre-summon directly (rather than via useTech('tech_summon_fire')) so the companion's own
// automatic basic never fires against the field rat's tiny starting HP before the monster.hp
// override below can take effect.
Game.Companion.summon(cH, 'comp_fire');
cH.hitPoints = cH.hitPointsMax; cH.energy = cH.energyMax;
setRng(fixedRng(0.99));
var battleH = Game.Battle.start('plains_field_rat');
battleH.monster.techs = [];
battleH.monster.hp = battleH.monster.hpMax = 999999;
battleH.monster.damage = 999999; // guaranteed one-shot on the companion once redirected
Game.Companion.setTaunt(battleH, 5);
Game.Battle.defend(); // fixedRng(0.99) still active: no dodge/glancing anywhere

assert(battleH.companion.hp === 0, "the companion's HP is driven to exactly 0 by the redirected hit");
assert(battleH.companionDispersed === true, "battle.companionDispersed is set once the companion's hp reaches 0");
assert(battleH.log.some(function (l) { return /is destroyed/.test(l); }), 'a destruction log line was recorded: ' + battleH.log.join(' | '));
cH.energy = cH.energyMax;
var conflagrationRefusalLenBefore = battleH.log.length;
Game.Battle.useTech('tech_cmd_conflagration');
assert(battleH.log.length === conflagrationRefusalLenBefore + 1 && /requires a bound/.test(battleH.log[battleH.log.length - 1]),
  'a command tech refuses to cast once its companion has been dispersed mid-battle: ' + battleH.log[battleH.log.length - 1]);
Game.Battle.flee();
Game.Battle.endBattle();
assert(cH.companion === null, 'battle end nulls character.companion once it was dispersed mid-battle — must be re-summoned');

// ---- I) Disperse on player defeat (D6): a lost battle nulls character.companion unconditionally,
// even if the companion itself is still alive at full HP. Uses Wind (no self-taunt rider) so the
// monster's lethal counter always targets the player, not the companion. ----
var cI = makeCharacter({ name: 'CompanionTesterI' });
setLevel(cI, 60);
Game.Companion.summon(cI, 'comp_wind');
cI.hitPoints = 1; cI.energy = cI.energyMax;
setRng(fixedRng(0.99)); // no dodge
var battleI = Game.Battle.start('plains_field_rat');
assert(cI.companion !== null, 'sanity: the companion is bound and alive before the loss');
battleI.monster.techs = [];
battleI.monster.hp = battleI.monster.hpMax = 999999; // survives the companion's own automatic hit, so the monster still gets its counter-attack
battleI.monster.damage = 999999; // guaranteed lethal counter-attack
Game.Battle.defend();

assert(battleI.phase === 'lost', 'sanity: battle I resolved as lost, phase=' + battleI.phase);
assert(cI.companion === null, 'onLoss disperses the companion unconditionally (D6), even though it was still alive at full HP');
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
assert(loadedLegacyCombo !== null, 'legacy Crusader+Shadowknight save loads without error through the full v6->v12 migration chain');
assert(!!loadedLegacyCombo.character.classes.crusader, 'classes.crusader preserved');
assert(!!loadedLegacyCombo.character.classes.shadowknight, 'classes.shadowknight preserved — an "impossible" combo under the NEW branching rule (Shadowknight now re-homed to gladiator), kept per §5 [revised]: obtaining is permanent, no migration strips or re-keys it');
assert(loadedLegacyCombo.character.classes.shadowknight.abilities.indexOf('shadowknight_inner_fire') !== -1, "shadowknight's previously-purchased ability survives migration untouched");
assert(loadedLegacyCombo.character.lineage.tier2 === 'crusader' && loadedLegacyCombo.character.lineage.tier3 === 'shadowknight', 'M5: the old-convergence combo migrates as-is: crusader = lineage tier 2, shadowknight = lineage tier 3');

Game.state = loadedLegacyCombo;
Game.state.battle = null;
var legacyC = loadedLegacyCombo.character;
legacyC.currentLocation = 'eldor';
var legacyBonus = Game.Classes.classBonus(legacyC, 'damage_pct');
assert(legacyBonus > 0, "the legacy Shadowknight's already-purchased Inner Fire passive still contributes to classBonus while active (damage_pct=" + legacyBonus + ')');

// docs/SPEC-MELEE-CLASS-TECHS.md: Shadow Blade is a weapon tech now, so the hero needs a weapon in hand.
legacyC.equipment.weapon = 'sword_rusty_shortblade';
legacyC.hitPoints = legacyC.hitPointsMax;
legacyC.energy = legacyC.energyMax;
setRng(fixedRng(0.5));
var legacyBattle = Game.Battle.start('plains_field_rat');
legacyBattle.monster.hp = 999;
var legacyHpBefore = legacyBattle.monster.hp;
Game.Battle.useTech('tech_shadow_blade');
assert(legacyBattle.monster.hp < legacyHpBefore, "legacy Shadowknight's class tech is still fully usable in battle (still active in lineage tier 3), hp " + legacyHpBefore + ' -> ' + legacyBattle.monster.hp);
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

// =================== Tests 27-35 (v1.11 Hero Tree; docs/SPEC-CLASS-LINEAGE.md R1-R8a, M1-M6) ==========
// Stubbed RNG throughout (fixedRng via winBattle); Legendary changes always stand in an Academy town.

function atTown(c) { c.currentLocation = 'eldor'; return c; }     // Eldor has an Academy
function atWilds(c) { c.currentLocation = 'plains_of_averast'; return c; } // no Academy here

// ---- Test 27: R1 — every tier 1/2/3 class auto-activates into its lineage slot on obtain ----
console.log('\n=== Test 27 (R1): obtaining a tier 1/2/3 class writes c.lineage.tierN and activates it immediately ===');
Game.Data.classes.filter(function (cd) { return cd.tier >= 1 && cd.tier <= 3; }).forEach(function (cd) {
  var rc = makeCharacter({ name: 'R1_' + cd.id });
  var res = Game.Classes.obtainClass(rc, cd.id);
  assert(res.ok === true && rc.lineage['tier' + cd.tier] === cd.id, 'R1: ' + cd.id + ' fills lineage.tier' + cd.tier);
  assert(Game.Classes.activeClassIds(rc).indexOf(cd.id) !== -1, 'R1: ' + cd.id + ' is in activeClassIds immediately');
  assert(res.message === cd.name + ' joins your Hero Tree.', 'R1: join message for ' + cd.id + ', got "' + res.message + '"');
  assert(rc.legendaryClass === null, 'R1: a lineage class never touches the Legendary slot');
});
var c27 = makeCharacter({ name: 'R1_Order' });
Game.Classes.obtainClass(c27, 'warrior');
Game.Classes.obtainClass(c27, 'thief'); // 2nd tier-1: obtained, never active (the quests can't produce this; debug only)
assert(c27.lineage.tier1 === 'warrior' && Game.Classes.isObtained(c27, 'thief') && Game.Classes.activeClassIds(c27).join(',') === 'warrior', 'R1: a second class of an already-filled tier is obtained but stays out of the lineage');
Game.Classes.obtainClass(c27, 'rogue');
Game.Classes.obtainClass(c27, 'gambit');
assert(JSON.stringify(Game.Classes.lineageOf(c27)) === JSON.stringify([{ tier: 1, classId: 'warrior' }, { tier: 2, classId: 'rogue' }, { tier: 3, classId: 'gambit' }]), 'lineageOf returns [{tier, classId}] for tiers 1-3, got ' + JSON.stringify(Game.Classes.lineageOf(c27)));
assert(JSON.stringify(Game.Classes.lineageOf(makeCharacter({ name: 'R1_Empty' }))) === JSON.stringify([{ tier: 1, classId: null }, { tier: 2, classId: null }, { tier: 3, classId: null }]), 'lineageOf of a fresh hero is three empty tiers');
assert(Game.Classes.activeClassIds(c27).join(',') === 'warrior,rogue,gambit', 'activeClassIds orders tier1, tier2, tier3');
assert(Game.Character.create({ race: 'Human', name: 'Fresh', gender: 'Male', skillPoints: {} }).lineage.tier2 === null, 'character.create() initialises lineage + legendaryClass');

// ---- Test 28: R2 — no deactivate path exists anywhere ----
console.log('\n=== Test 28 (R2): no deactivate/activate path exists; quest-choice warning text ===');
assert(Object.keys(Game.Classes).filter(function (k) { return /activate|deactivate|setPrimary|setSecondary/i.test(k); }).length === 0, 'Game.Classes exposes no activate/deactivate-style function');
assert(Object.keys(Game._debug || {}).filter(function (k) { return /deactivate/i.test(k); }).length === 0, 'no debug helper deactivates a class either');
var c28 = makeCharacter({ name: 'R2_Hero' });
Game.Classes.obtainClass(c28, 'warrior');
var noSlot28 = Game.Classes.obtainClass(c28, 'warrior');
assert(noSlot28.ok === false && c28.lineage.tier1 === 'warrior', 'obtaining a class twice is refused and leaves the lineage intact');
var confirmSeen28 = [];
var oldConfirm28 = global.window.confirm;
global.window.confirm = function (m) { confirmSeen28.push(m); return true; };
var c28q = makeCharacter({ name: 'R2_Quest' });
setLevel(c28q, 5);
c28q.currentLocation = 'eldor';
Game.Quests.accept('first_calling');
for (var q28 = 0; q28 < 4; q28++) winBattle('plains_vermin_swarm');
Game.Screens.navigate('journal');
var jbtn28 = document.getElementById('maincontent').queryAllByClass('button').filter(function (n) { return n.textContent === 'Thief'; })[0];
assert(!!jbtn28, 'journal shows the Thief class-choice button');
if (jbtn28) {
  jbtn28.click();
  assert(confirmSeen28.length === 1 && confirmSeen28[0] === 'This choice is permanent. Thief will join your Hero Tree for good.', 'class-choice confirm warns "This choice is permanent. Thief will join your Hero Tree for good.", got ' + JSON.stringify(confirmSeen28));
  assert(c28q.lineage.tier1 === 'thief', 'confirming the choice puts Thief into lineage.tier1');
}
global.window.confirm = oldConfirm28;

// ---- Test 29: R3 — classBonus sums every active class incl. the Legendary, nothing from an unslotted one ----
console.log('\n=== Test 29 (R3): classBonus/isClassTechUsable use activeClassIds — 3 lineage classes + slotted Legendary, nothing from an unslotted Legendary ===');
var c29 = makeCharacter({ name: 'R3_Hero' });
setLevel(c29, 60);
['warrior', 'gladiator', 'shadowknight', 'vaultbreaker', 'runeblade_of_kuraan'].forEach(function (id) { Game.Classes.obtainClass(c29, id); });
assert(c29.legendaryClass === 'vaultbreaker', 'first Legendary obtained (vaultbreaker) took the slot; runeblade waits');
[['warrior', 'warrior_brutal_strikes'], ['gladiator', 'gladiator_savage_strikes'], ['shadowknight', 'shadowknight_inner_fire'],
 ['vaultbreaker', 'vaultbreaker_twofold_resolve'], ['runeblade_of_kuraan', 'runeblade_runic_might']].forEach(function (pair) {
  c29.classes[pair[0]].abilities.push(pair[1]); // direct grant: this test is about the bonus sum, not the purchase flow
});
var expected29 = 0.06 + 0.11 + 0.13 + 0.15; // runeblade's 0.12 is NOT included
assert(Math.abs(Game.Classes.classBonus(c29, 'damage_pct') - expected29) < 1e-9, 'damage_pct sums warrior+gladiator+shadowknight+slotted vaultbreaker and NOTHING from the unslotted runeblade, expected ' + expected29 + ', got ' + Game.Classes.classBonus(c29, 'damage_pct'));
var techOf = function (id) { return Game.Battle.getTech(id); };
assert(Game.Classes.isClassTechUsable(c29, techOf('tech_shadow_blade')) === true, 'a lineage class tech is usable');
assert(Game.Classes.isClassTechUsable(c29, techOf('tech_vault_reckoning')) === true, 'the slotted Legendary tech is usable');
assert(Game.Classes.isClassTechUsable(c29, techOf('tech_runic_severance')) === false, 'the unslotted Legendary tech is NOT usable');
assert(Game.Classes.isClassTechUsable(c29, techOf('tech_crushing_blow')) === true, 'warrior tech usable (lineage tier 1)');
assert(Game.Classes.isClassTechUsable(c29, techOf('tech_anima_surge')) === false, 'a class never obtained is not usable');

// ---- Test 30: R4 — first Legendary auto-fills an empty slot (any route), later ones wait ----
console.log('\n=== Test 30 (R4): the first Legendary auto-fills an empty Legendary slot wherever obtained; the second waits ===');
var c30 = makeCharacter({ name: 'R4_Hero' });
setLevel(c30, 35);
atWilds(c30);
var legFirst30 = Game.Classes.obtainClass(c30, 'vaultbreaker');
assert(c30.legendaryClass === 'vaultbreaker', 'first Legendary fills the empty slot even outside an Academy town');
assert(legFirst30.message === 'Vaultbreaker now walks beside you as your Legendary calling.', 'auto-fill uses the swap toast wording, got "' + legFirst30.message + '"');
winBattle('estari_ruin_warden'); // boss-kill route (obtainClass in battle.js onWin)
assert(Game.Classes.isObtained(c30, 'runeblade_of_kuraan') && c30.legendaryClass === 'vaultbreaker', 'second Legendary (boss-kill route) is obtained but WAITS: slot unchanged');
Game.Inventory.addItem(c30, 'quest_eidas_echo_seal'); // relic route
assert(Game.Classes.isObtained(c30, 'heir_of_the_echo') && c30.legendaryClass === 'vaultbreaker', 'third Legendary (relic route) also waits');
assert(Game.Classes.activeClassIds(c30).join(',') === 'vaultbreaker', 'only the slotted Legendary is active');
// boss-kill route fills an EMPTY slot too
var c30b = makeCharacter({ name: 'R4_BossKill' });
setLevel(c30b, 35);
winBattle('estari_ruin_warden');
assert(c30b.legendaryClass === 'runeblade_of_kuraan', 'boss-kill route auto-fills an empty slot');
// relic route
var c30c = makeCharacter({ name: 'R4_Relic' });
setLevel(c30c, 35);
Game.Inventory.addItem(c30c, 'quest_eidas_echo_seal');
assert(c30c.legendaryClass === 'heir_of_the_echo', 'relic route auto-fills an empty slot');
// an emptied slot is re-filled by the NEXT Legendary obtained (not by the ones already waiting)
var c30d = makeCharacter({ name: 'R4_Refill' });
Game.Classes.obtainClass(c30d, 'runeblade_of_kuraan');
atTown(c30d);
Game.Classes.setLegendary(c30d, null);
atWilds(c30d);
Game.Classes.obtainClass(c30d, 'vaultbreaker');
assert(c30d.legendaryClass === 'vaultbreaker', 'with the slot empty, the next Legendary obtained auto-fills it (R4)');

// ---- Test 31: R5 — setLegendary refusals and success ----
console.log('\n=== Test 31 (R5): setLegendary only at an Academy, never in battle, only obtained legendary ids ===');
var c31 = makeCharacter({ name: 'R5_Hero' });
setLevel(c31, 35);
['warrior', 'runeblade_of_kuraan', 'vaultbreaker'].forEach(function (id) { Game.Classes.obtainClass(c31, id); });
atWilds(c31);
var r31a = Game.Classes.setLegendary(c31, 'vaultbreaker');
assert(r31a.ok === false && /Academy/.test(r31a.message) && c31.legendaryClass === 'runeblade_of_kuraan', 'refused outside an Academy town: ' + r31a.message);
assert(Game.Classes.setLegendary(c31, null).ok === false && c31.legendaryClass === 'runeblade_of_kuraan', 'unslotting is refused outside an Academy too');
atTown(c31);
setRng(fixedRng(0.99));
var b31 = Game.Battle.start('plains_field_rat');
var r31b = Game.Classes.setLegendary(c31, 'vaultbreaker');
assert(r31b.ok === false && /battle/i.test(r31b.message) && c31.legendaryClass === 'runeblade_of_kuraan', 'refused in battle even at an Academy: ' + r31b.message);
Game.Battle.flee();
Game.Battle.endBattle();
var r31c = Game.Classes.setLegendary(c31, 'warrior');
assert(r31c.ok === false && c31.legendaryClass === 'runeblade_of_kuraan', 'refused for a non-legendary class id: ' + r31c.message);
assert(Game.Classes.setLegendary(c31, 'heir_of_the_echo').ok === false, 'refused for a Legendary that has not been obtained');
assert(Game.Classes.setLegendary(c31, 'no_such_class').ok === false, 'refused for an unknown id');
assert(Game.Classes.setLegendary(c31, 'runeblade_of_kuraan').ok === false, 'refused when it is already the slotted Legendary');
assert(c31.legendaryClass === 'runeblade_of_kuraan', 'slot unchanged after every refusal');
var gold31 = c31.gold, ap31 = c31.trainingPoints;
var r31d = Game.Classes.setLegendary(c31, 'vaultbreaker');
assert(r31d.ok === true && c31.legendaryClass === 'vaultbreaker', 'swap succeeds at an Academy: ' + r31d.message);
assert(r31d.message === 'Vaultbreaker now walks beside you as your Legendary calling.', 'swap toast wording, got "' + r31d.message + '"');
assert(c31.gold === gold31 && c31.trainingPoints === ap31, 'a swap costs nothing');
var r31e = Game.Classes.setLegendary(c31, null);
assert(r31e.ok === true && c31.legendaryClass === null, 'unslot (null) succeeds at an Academy: ' + r31e.message);
assert(r31e.message === 'Vaultbreaker rests. Its techniques have been unslotted, but nothing it taught you is forgotten.', 'unslot toast wording, got "' + r31e.message + '"');
assert(Game.Classes.isObtained(c31, 'vaultbreaker') && Game.Classes.isObtained(c31, 'runeblade_of_kuraan'), 'both Legendaries stay obtained');

// ---- Test 32: R6 — swap-out keeps progress, unslots techs from every techSet, keeps them in c.techs ----
console.log('\n=== Test 32 (R6): swapping a Legendary out keeps xp/levels/abilities, removes its techs from every techSet, keeps them in c.techs; swapping back needs no re-buy ===');
var c32 = makeCharacter({ name: 'R6_Hero' });
setLevel(c32, 60);
atTown(c32);
['warrior', 'runeblade_of_kuraan', 'vaultbreaker'].forEach(function (id) { Game.Classes.obtainClass(c32, id); });
Game.Classes.addClassXp(c32, 2 * Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_POOL_FRACTION);
var buyRs32 = Game.Classes.buyAbility(c32, 'runeblade_of_kuraan', 'runeblade_runic_severance');
assert(buyRs32.ok === true, 'Runic Severance (Legendary tech) purchased: ' + buyRs32.message);
var buyCb32 = Game.Classes.buyAbility(c32, 'warrior', 'warrior_crushing_blow');
assert(buyCb32.ok === true, 'Crushing Blow (lineage tech) purchased: ' + buyCb32.message);
var buyMight32 = Game.Classes.buyAbility(c32, 'runeblade_of_kuraan', 'runeblade_runic_might');
assert(buyMight32.ok === true, 'Runic Might (Legendary passive) purchased: ' + buyMight32.message);
c32.techSets[0][0] = 'tech_runic_severance';
c32.techSets[1][3] = 'tech_runic_severance'; // slotted in a SECOND set as well
c32.techSets[2][2] = 'tech_crushing_blow';
var before32 = JSON.stringify(c32.classes['runeblade_of_kuraan']);
var earned32 = c32.classes['runeblade_of_kuraan'].classLevelsEarned;
assert(earned32 > 0 && c32.classes['runeblade_of_kuraan'].classXp > 0, 'sanity: the Legendary has progress to keep');
var dmgWithRb32 = Game.Classes.classBonus(c32, 'damage_pct');
var swap32 = Game.Classes.setLegendary(c32, 'vaultbreaker');
assert(swap32.ok === true, 'runeblade swapped out for vaultbreaker: ' + swap32.message);
assert(JSON.stringify(c32.classes['runeblade_of_kuraan']) === before32, 'swapped-out Legendary keeps xp, levels earned/spent and bought abilities byte-for-byte');
assert(c32.techs.indexOf('tech_runic_severance') !== -1, "the swapped-out Legendary's tech stays in c.techs (still learned)");
var slotted32 = [];
c32.techSets.forEach(function (set, si) { set.forEach(function (t, ti) { if (t === 'tech_runic_severance') slotted32.push(si + ':' + ti); }); });
assert(slotted32.length === 0, 'the swapped-out tech is removed from EVERY techSet slot, still slotted at: ' + slotted32.join(','));
assert(c32.techSets[0][0] === null && c32.techSets[1][3] === null, 'its former slots are left empty (null), not shifted');
assert(c32.techSets[2][2] === 'tech_crushing_blow', "other classes' slotted techs are untouched");
assert(Math.abs(dmgWithRb32 - 0.12) < 1e-9, 'sanity: runeblade Runic Might (0.12) applied while slotted, got ' + dmgWithRb32);
assert(Math.abs(Game.Classes.classBonus(c32, 'damage_pct') - 0) < 1e-9, 'Runic Might (0.12) no longer applies once runeblade is unslotted (no other damage passives owned)');
assert(Game.Classes.isClassTechUsable(c32, Game.Battle.getTech('tech_runic_severance')) === false, 'the swapped-out tech is not castable');
var swapBack32 = Game.Classes.setLegendary(c32, 'runeblade_of_kuraan');
assert(swapBack32.ok === true, 'swapping back works: ' + swapBack32.message);
assert(JSON.stringify(c32.classes['runeblade_of_kuraan']) === before32, 'progress unchanged after swapping back');
assert(Math.abs(Game.Classes.classBonus(c32, 'damage_pct') - 0.12) < 1e-9, 'Runic Might applies again after swapping back, with no re-buy');
assert(Game.Classes.isClassTechUsable(c32, Game.Battle.getTech('tech_runic_severance')) === true, 'the tech is castable again after swapping back (re-slot it manually)');
assert(Game.Classes.buyAbility(c32, 'runeblade_of_kuraan', 'runeblade_runic_severance').message === 'Already purchased.', 'no re-buy is needed or possible');

// ---- Test 33: R7 — an unslotted Legendary earns no class XP and cannot buy abilities ----
console.log('\n=== Test 33 (R7): an unslotted Legendary earns no class XP and cannot buy Academy abilities ===');
var c33 = makeCharacter({ name: 'R7_Hero' });
setLevel(c33, 35);
atTown(c33);
['warrior', 'runeblade_of_kuraan', 'vaultbreaker'].forEach(function (id) { Game.Classes.obtainClass(c33, id); }); // vaultbreaker waits
c33.classes['vaultbreaker'].classLevelsEarned = 6; // unspent levels on the unslotted one
Game.Classes.addClassXp(c33, 1000);
assert(c33.classes['vaultbreaker'].classXp === 0, 'unslotted Legendary gained no class XP, got ' + c33.classes['vaultbreaker'].classXp);
assert(c33.classes['runeblade_of_kuraan'].classXp > 0 && c33.classes['warrior'].classXp > 0, 'the active classes did earn XP');
var buy33 = Game.Classes.buyAbility(c33, 'vaultbreaker', 'vaultbreaker_twofold_resolve');
assert(buy33.ok === false && /active/.test(buy33.message) && c33.classes['vaultbreaker'].abilities.length === 0, 'unslotted Legendary cannot buy abilities even with unspent levels: ' + buy33.message);
winBattle('plains_vermin_swarm'); // real onWin path
assert(c33.classes['vaultbreaker'].classXp === 0, 'a real battle win still gives the unslotted Legendary nothing');

// ---- Test 34: R8/R8a — shared pool, even split, maxed drops out ----
console.log('\n=== Test 34 (R8/R8a): one shared pool split evenly over active classes that are not maxed ===');
var c34 = makeCharacter({ name: 'R8_Hero' });
setLevel(c34, 60);
['warrior', 'gladiator', 'shadowknight', 'vaultbreaker'].forEach(function (id) { Game.Classes.obtainClass(c34, id); });
var costSum = function (id) { return Game.Classes.getClass(id).abilities.reduce(function (t, a) { return t + a.classLevelCost; }, 0); };
assert(Game.Classes.isClassMaxed(c34, 'warrior') === false, 'a fresh class is not maxed');
Game.Classes.addClassXp(c34, 800);
// pool = floor(800 * 0.5) = 400, 4 earning classes -> 100 each
assert(['warrior', 'gladiator', 'shadowknight', 'vaultbreaker'].every(function (id) { return c34.classes[id].classXp === 100; }), 'pool 400 split evenly 4 ways = 100 each, got ' + ['warrior', 'gladiator', 'shadowknight', 'vaultbreaker'].map(function (id) { return c34.classes[id].classXp; }).join('/'));
// remainder is floored per class
var c34r = makeCharacter({ name: 'R8_Remainder' });
['warrior', 'gladiator', 'shadowknight'].forEach(function (id) { Game.Classes.obtainClass(c34r, id); });
Game.Classes.addClassXp(c34r, 101); // pool 50 -> floor(50/3) = 16 each
assert(['warrior', 'gladiator', 'shadowknight'].every(function (id) { return c34r.classes[id].classXp === 16; }), 'pool 50 over 3 classes -> floor(50/3)=16 each');
// maxed by EARNED levels (R8a), even with every level unspent
assert(costSum('warrior') === 8, 'sanity: warrior abilities cost 8 levels in total, got ' + costSum('warrior'));
c34.classes['warrior'].classLevelsEarned = 7;
assert(Game.Classes.isClassMaxed(c34, 'warrior') === false, '7 of 8 earned levels is not maxed');
c34.classes['warrior'].classLevelsEarned = 8; // none bought: classLevelsSpent stays 0
assert(Game.Classes.isClassMaxed(c34, 'warrior') === true && c34.classes['warrior'].classLevelsSpent === 0, 'maxed by earned levels even though nothing is bought (R8a)');
var warriorXpBefore34 = c34.classes['warrior'].classXp;
var maxedNow34 = Game.Classes.addClassXp(c34, 600); // pool 300 over 3 non-maxed classes -> 100 each
assert(c34.classes['warrior'].classXp === warriorXpBefore34, 'the maxed class earns nothing');
assert(['gladiator', 'shadowknight', 'vaultbreaker'].every(function (id) { return c34.classes[id].classXp === 200; }), "the maxed class's share goes to the others (100 + 100 = 200 each)");
assert(Array.isArray(maxedNow34) && maxedNow34.length === 0, 'addClassXp reports no newly maxed class when none crossed the line');
// newly-maxed report
c34.classes['gladiator'].classLevelsEarned = costSum('gladiator') - 1;
c34.classes['gladiator'].classXp = Game.Classes.classXpForLevel(costSum('gladiator') - 1 + 1) ; // just under the next threshold
var maxedNow34b = Game.Classes.addClassXp(c34, 100000);
assert(maxedNow34b.indexOf('gladiator') !== -1 && Game.Classes.isClassMaxed(c34, 'gladiator'), 'a class that crosses the line is reported as newly maxed: ' + JSON.stringify(maxedNow34b));
// all maxed -> nothing awarded
Object.keys(c34.classes).forEach(function (id) { c34.classes[id].classLevelsEarned = costSum(id); });
var snap34 = JSON.stringify(c34.classes);
var none34 = Game.Classes.addClassXp(c34, 100000);
assert(JSON.stringify(c34.classes) === snap34 && none34.length === 0, 'all active classes maxed -> no class XP awarded at all');
// an unslotted/unobtained maxed state does not matter; battle integration + mastered log
var c34b = makeCharacter({ name: 'R8_Battle' });
Game.Classes.obtainClass(c34b, 'warrior');
c34b.classes['warrior'].classLevelsEarned = costSum('warrior') - 1;
c34b.classes['warrior'].classXp = Game.Classes.classXpForLevel(costSum('warrior')) ;
setRng(fixedRng(0.99));
var mb34 = Game.Battle.start('plains_vermin_swarm');
mb34.monster.hp = 1;
Game.Battle.attack();
assert(mb34.phase === 'won', 'sanity: battle won, phase=' + mb34.phase);
if (Game.Classes.isClassMaxed(c34b, 'warrior')) {
  assert(mb34.log.some(function (l) { return l === 'You have mastered the Warrior class. Its experience now flows to your other callings.'; }), 'the win logs the Mastered line: ' + mb34.log.slice(-4).join(' | '));
} else {
  assert(c34b.classes['warrior'].classXp > 0, 'the win granted class XP via the real onWin path');
}
Game.Battle.endBattle();
var c34c = makeCharacter({ name: 'R8_Zero' });
assert(Game.Classes.addClassXp(c34c, 500).length === 0 && Object.keys(c34c.classes).length === 0, 'a hero with no classes earns nothing and does not throw');

// ---- Test 35: migration v11 -> v12 (M1-M6) + the full v1 -> v12 chain ----
console.log('\n=== Test 35 (M1-M6): save v11 -> v12 lineage migration + the full v1 -> v12 chain ===');
function entry35(earned, xp) { return { classXp: xp || 0, classLevelsEarned: earned || 0, classLevelsSpent: 0, abilities: [] }; }
function v11Load(classes, primary, secondary) {
  var base = makeCharacter({ name: 'Mig' });
  var o = JSON.parse(JSON.stringify(base));
  delete o.lineage; delete o.legendaryClass;
  o.classes = classes;
  o.primaryClass = primary === undefined ? null : primary;
  o.secondaryClass = secondary === undefined ? null : secondary;
  o.legendaryUnlocked = false;
  localStorageStore['herorpg_save'] = JSON.stringify({ version: 11, state: { character: o } });
  return Game.Save.load();
}
// M1: one class per tier fills each slot; M3: Primary legendary wins
var m1 = v11Load({ warrior: entry35(2, 300), gladiator: entry35(1), shadowknight: entry35(0), vaultbreaker: entry35(3), runeblade_of_kuraan: entry35(1) }, 'vaultbreaker', 'warrior');
assert(m1 !== null && m1.character.lineage.tier1 === 'warrior' && m1.character.lineage.tier2 === 'gladiator' && m1.character.lineage.tier3 === 'shadowknight', 'M1: one obtained class per tier fills lineage.tier1/2/3, got ' + JSON.stringify(m1 && m1.character.lineage));
assert(m1.character.legendaryClass === 'vaultbreaker', 'M3: a legendary Primary becomes the Legendary slot, got ' + m1.character.legendaryClass);
assert(!('primaryClass' in m1.character) && !('secondaryClass' in m1.character), 'M4: primaryClass/secondaryClass are deleted');
assert(m1.character.classes.warrior.classXp === 300 && m1.character.classes.warrior.classLevelsEarned === 2 && Object.keys(m1.character.classes).length === 5, 'M4: no c.classes entry is changed or removed');
// M3 variants
var m3b = v11Load({ warrior: entry35(), runeblade_of_kuraan: entry35(), vaultbreaker: entry35() }, 'warrior', 'vaultbreaker');
assert(m3b.character.legendaryClass === 'vaultbreaker', 'M3: else a legendary Secondary becomes the slot, got ' + m3b.character.legendaryClass);
var m3c = v11Load({ warrior: entry35(), vaultbreaker: entry35(), heir_of_the_echo: entry35(), runeblade_of_kuraan: entry35() }, 'warrior', null);
assert(m3c.character.legendaryClass === 'runeblade_of_kuraan', 'M3: else the first obtained Legendary in data order (runeblade precedes vaultbreaker/heir), got ' + m3c.character.legendaryClass);
var m3d = v11Load({ warrior: entry35() }, 'warrior', null);
assert(m3d.character.legendaryClass === null, 'M3: else null');
// M2: duplicates in one tier
var m2a = v11Load({ warrior: entry35(1), thief: entry35(5) }, 'warrior', 'thief');
assert(m2a.character.lineage.tier1 === 'warrior', 'M2: Primary wins among duplicates, got ' + m2a.character.lineage.tier1);
var m2b = v11Load({ warrior: entry35(1), thief: entry35(5) }, null, 'thief');
assert(m2b.character.lineage.tier1 === 'thief', 'M2: then Secondary, got ' + m2b.character.lineage.tier1);
var m2c = v11Load({ warrior: entry35(1), thief: entry35(5) }, null, null);
assert(m2c.character.lineage.tier1 === 'thief', 'M2: then highest classLevelsEarned, got ' + m2c.character.lineage.tier1);
var m2d = v11Load({ thief: entry35(2), warrior: entry35(2) }, null, null);
assert(m2d.character.lineage.tier1 === 'warrior', 'M2: then js/data/classes.js order (warrior precedes thief) on a full tie, got ' + m2d.character.lineage.tier1);
assert(Game.Classes.isObtained(m2c.character, 'warrior') && Game.Classes.activeClassIds(m2c.character).indexOf('warrior') === -1, 'M2: the losing duplicate stays in c.classes but is never active');
// M5: old-convergence combo
var m5 = v11Load({ crusader: entry35(4), shadowknight: entry35(8) }, 'crusader', 'shadowknight');
assert(m5.character.lineage.tier1 === null && m5.character.lineage.tier2 === 'crusader' && m5.character.lineage.tier3 === 'shadowknight', 'M5: Crusader + Shadowknight (old convergence) migrates as-is (tier1 stays empty), got ' + JSON.stringify(m5.character.lineage));
// M6: a once-deactivated (zeroed) class re-enters the lineage at class level 0 (display "Class Lv 0")
var m6 = v11Load({ warrior: entry35(0, 0) }, null, null);
assert(m6.character.lineage.tier1 === 'warrior' && m6.character.classes.warrior.classXp === 0 && m6.character.classes.warrior.classLevelsEarned === 0, 'M6: a zeroed (once-deactivated) class re-enters the lineage with zero progress, nothing refunded');
// empty
var mEmpty = v11Load({}, null, null);
assert(mEmpty.character.lineage.tier1 === null && mEmpty.character.lineage.tier2 === null && mEmpty.character.lineage.tier3 === null && mEmpty.character.legendaryClass === null, 'a v11 hero with no classes gets an empty lineage and a null Legendary slot');
// round trip stamps 12 and keeps the new fields
Game.state = m1; Game.persist();
var rt35 = JSON.parse(localStorageStore['herorpg_save']);
assert(rt35.version === 12 && rt35.state.character.lineage.tier2 === 'gladiator' && rt35.state.character.legendaryClass === 'vaultbreaker', 'resave stamps version 12 and persists lineage + legendaryClass');
var reload35 = Game.Save.load();
assert(reload35 !== null && reload35.character.lineage.tier3 === 'shadowknight' && reload35.character.legendaryClass === 'vaultbreaker', 'a v12 save reloads unchanged (no re-migration)');
// full chain v1 -> v12 with classes arriving at v6 (old slots) — covered end-to-end by Test 1 (v6) and Test 2 (v1);
// here a v1 payload is run once more and checked against the complete current shape.
var v1Chain35 = { version: 1, state: { character: JSON.parse(JSON.stringify(v1Character)) } };
localStorageStore['herorpg_save'] = JSON.stringify(v1Chain35);
var chain35 = Game.Save.load();
assert(chain35 !== null && chain35.character.lineage && chain35.character.legendaryClass === null && chain35.character.companion === null && chain35.character.ap === 0 && !('primaryClass' in chain35.character), 'the full v1 -> v12 chain yields the complete current shape (lineage, legendaryClass, companion, ap; no slot fields)');
Game.state = chain35; Game.persist();
assert(JSON.parse(localStorageStore['herorpg_save']).version === 12, 'v1 -> v12 chain resaves at version 12');

// ---- Test 36: UI — Hero Tree panel, Legendary buttons gated on the Academy ----
console.log('\n=== Test 36: Hero Tree UI — Legendary [Set Legendary]/[Unslot] enabled only at an Academy ===');
try {
  var c36 = makeCharacter({ name: 'UI_Hero' });
  setLevel(c36, 60);
  ['warrior', 'gladiator', 'runeblade_of_kuraan', 'vaultbreaker'].forEach(function (id) { Game.Classes.obtainClass(c36, id); });
  c36.classes['warrior'].classLevelsEarned = 8; // maxed -> "Mastered"
  var openClassesTab = function () {
    Game.Screens.navigate('status');
    document.getElementById('maincontent').queryAllByClass('infobox-tab').filter(function (n) { return n.textContent === 'Classes'; })[0].click();
    return document.getElementById('maincontent');
  };
  atWilds(c36);
  var root36 = openClassesTab();
  var txt36 = root36.textContent;
  assert(txt36.indexOf('Mastered') !== -1, 'a maxed class shows "Mastered" on the Hero Tree');
  assert(txt36.indexOf('Unlocks at level 60') !== -1, 'the empty Mastery row shows its unlock hint');
  assert(txt36.indexOf('Unlocked Legendaries') !== -1 && txt36.indexOf('Visit an Academy to change your Legendary.') !== -1, 'outside an Academy the hint is shown');
  var legBtns36 = root36.queryAllByClass('button').filter(function (n) { return n.textContent === 'Set Legendary' || n.textContent === 'Unslot'; });
  assert(legBtns36.length === 2 && legBtns36.every(function (b) { return b.disabled === 'disabled' || b.attrs && b.attrs.disabled === 'disabled' || b.getAttribute && b.getAttribute('disabled') === 'disabled'; }), 'Set Legendary + Unslot are disabled away from an Academy');
  atTown(c36);
  var root36b = openClassesTab();
  var legBtns36b = root36b.queryAllByClass('button').filter(function (n) { return n.textContent === 'Set Legendary' || n.textContent === 'Unslot'; });
  assert(legBtns36b.length === 2 && legBtns36b.every(function (b) { return !(b.disabled === 'disabled' || (b.attrs && b.attrs.disabled === 'disabled') || (b.getAttribute && b.getAttribute('disabled') === 'disabled')); }), 'Set Legendary + Unslot are enabled at an Academy');
  var setBtn36 = legBtns36b.filter(function (n) { return n.textContent === 'Set Legendary'; })[0];
  setBtn36.click();
  assert(c36.legendaryClass === 'vaultbreaker', 'clicking Set Legendary swaps the slot (runeblade -> vaultbreaker), got ' + c36.legendaryClass);
  var cNo36 = makeCharacter({ name: 'UI_NoLegend' });
  setLevel(cNo36, 60);
  Game.Classes.obtainClass(cNo36, 'warrior');
  var rootNo36 = openClassesTab();
  assert(rootNo36.textContent.indexOf('???') !== -1 && rootNo36.textContent.indexOf('Unlocked Legendaries') === -1, 'with no Legendary unlocked the row shows "???" and no Unlocked Legendaries list');
} catch (e36) {
  failures++;
  console.error('FAIL: Hero Tree UI test threw: ' + e36.stack);
}


// =================== Test 37: a Legendary tech ability grants its spell form AND its weapon twin ===================
console.log('\n=== Test 37: SPEC-MELEE-CLASS-TECHS §2.3 — Legendary tech abilities grant both forms; old saves get the twin on load ===');
[['runeblade_of_kuraan', 'runeblade_runic_severance', 'tech_runic_severance', 'tech_runic_severance_blade'],
  ['vaultbreaker', 'vaultbreaker_reckoning', 'tech_vault_reckoning', 'tech_vault_reckoning_blade'],
  ['heir_of_the_echo', 'heir_echoing_judgment', 'tech_echoing_judgment', 'tech_echoing_judgment_blade']].forEach(function (row) {
  var twin = Game.Battle.getTech(row[3]);
  assert(!!twin && twin.weaponTech === true && twin.grade === null && twin.classOnly === true && twin.classId === row[0],
    row[3] + ' is a classOnly, ungraded weapon tech of ' + row[0]);
  assert(twin.energyCost === Game.Battle.getTech(row[2]).energyCost, row[3] + ' costs the same Energy as its spell form');
  var c37 = makeCharacter({ name: 'TwinBuyer' });
  setLevel(c37, 60);
  Game.Classes.obtainClass(c37, row[0]);
  c37.currentLocation = 'eldor';
  c37.classes[row[0]].classLevelsEarned = 10;
  var res37 = Game.Classes.buyAbility(c37, row[0], row[1]);
  assert(res37.ok === true, row[1] + ' purchased: ' + res37.message);
  assert(c37.techs.indexOf(row[2]) !== -1 && c37.techs.indexOf(row[3]) !== -1, row[1] + ' teaches both ' + row[2] + ' and ' + row[3]);
});

// A save that bought Echoing Judgment before the twin existed gets the twin on load, once, with a notice.
var c37s = makeCharacter({ name: 'TwinMigrator' });
setLevel(c37s, 60);
Game.Classes.obtainClass(c37s, 'heir_of_the_echo');
c37s.classes['heir_of_the_echo'].abilities.push('heir_echoing_judgment');
c37s.techs.push('tech_echoing_judgment');
localStorageStore['herorpg_save'] = JSON.stringify({ version: 12, state: { character: JSON.parse(JSON.stringify(c37s)) } });
var loaded37 = Game.Save.load();
assert(loaded37 !== null && loaded37.character.techs.indexOf('tech_echoing_judgment_blade') !== -1, 'load adds the twin to a save that owns the Legendary tech ability');
assert(loaded37.character.techSets.every(function (set) { return set.indexOf('tech_echoing_judgment_blade') === -1; }), 'the twin is learned but not slotted');
var notes37 = Game.Save.getLastLoadNotes();
assert(notes37.length === 1 && /Echo of the Blade/.test(notes37[0]), 'one load notice names the new twin, got ' + JSON.stringify(notes37));
localStorageStore['herorpg_save'] = JSON.stringify({ version: 12, state: { character: loaded37.character } });
var reloaded37 = Game.Save.load();
assert(reloaded37.character.techs.filter(function (t) { return t === 'tech_echoing_judgment_blade'; }).length === 1 && Game.Save.getLastLoadNotes().length === 0,
  'loading again adds nothing and shows no notice (idempotent)');
var c37n = makeCharacter({ name: 'NoLegendary' });
localStorageStore['herorpg_save'] = JSON.stringify({ version: 12, state: { character: JSON.parse(JSON.stringify(c37n)) } });
var loaded37n = Game.Save.load();
assert(loaded37n.character.techs.indexOf('tech_echoing_judgment_blade') === -1 && Game.Save.getLastLoadNotes().length === 0, 'a save without the ability gets no twin and no notice');


// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
