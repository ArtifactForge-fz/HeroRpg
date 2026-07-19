// v1.8 P1 exit tests — the six SPEC-TECH-POLARITY.md §2.0 battle-engine extensions (statKind buff
// passthrough, effect:'debuff', debuffKind:'bleed', re-cast-replace, equipment gating,
// offhandFollowup, physicalRoll, goldSteal). Driven through the fakedom shim, same preamble
// pattern as tests/test_p3_battle.js. Randomness stubbed via Game.Battle._rng — the single RNG
// surface (CLAUDE.md cardinal rule). No new tech/item IDS are added to the shipped data (that is
// P3) — every tech/item used here is a synthetic `tech_test_*`/`item_test_*` fixture pushed into
// Game.Data.techs/Game.Data.items at the top of this file, so it can never collide with shipped
// content or with the id-collision grep.

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
loadScript('data/quests.js');
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
Game.refreshCurrentScreen = function () {};
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

// =================== Synthetic test fixtures (tech_test_ / item_test_ prefixes) ===================
// Pushed once, appended to the shipped arrays — never touches js/data/*, never collides (CLAUDE.md
// content conventions: append-only; distinct prefixes).

var TEST_ITEMS = [
  { id: 'item_test_shield', name: 'Test Shield', slot: 'offhand', skill: 'Shields', armor: 3, weight: 1, levelReq: 1, value: 1, tags: [], desc: 'test fixture' },
  { id: 'item_test_offhand_weapon', name: 'Test Offhand Blade', slot: 'offhand', skill: 'Knives', damage: 6, weight: 1, levelReq: 1, value: 1, tags: [], desc: 'test fixture' },
  { id: 'item_test_light_body', name: 'Test Light Body', slot: 'body', skill: 'Light Armor', armor: 2, weight: 1, levelReq: 1, value: 1, tags: [], desc: 'test fixture' },
  { id: 'item_test_heavy_body', name: 'Test Heavy Body', slot: 'body', skill: 'Heavy Armor', armor: 5, weight: 1, levelReq: 1, value: 1, tags: [], desc: 'test fixture' }
];
TEST_ITEMS.forEach(function (it) { Game.Data.items.push(it); });

var TEST_TECHS = [
  { id: 'tech_test_dodge_small', name: 'Test Dodge Small', chain: 'TestDodgeSmall', skill: 'Dodge', grade: null, effect: 'buff', statKind: 'dodge', power: 0.05, buffDuration: 5, energyCost: 5, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_dodge_big', name: 'Test Dodge Big', chain: 'TestDodgeBig', skill: 'Dodge', grade: null, effect: 'buff', statKind: 'dodge', power: 0.9, buffDuration: 5, energyCost: 5, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_da_small', name: 'Test DA Small', chain: 'TestDASmall', skill: 'Double Attack', grade: null, effect: 'buff', statKind: 'double_attack', power: 0.05, buffDuration: 5, energyCost: 5, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_da_big', name: 'Test DA Big', chain: 'TestDABig', skill: 'Double Attack', grade: null, effect: 'buff', statKind: 'double_attack', power: 0.9, buffDuration: 5, energyCost: 5, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_spellpower', name: 'Test Attunement', chain: 'TestSpellpower', skill: 'Evocation', grade: null, effect: 'buff', statKind: 'spellpower', power: 20, buffDuration: 5, energyCost: 5, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_untyped_buff', name: 'Test Untyped Buff', chain: null, skill: 'Alteration', grade: null, effect: 'buff', power: 15, buffDuration: 5, energyCost: 5, trainingCost: 0, skillReq: 0, desc: 'test fixture (legacy shape: no statKind, no chain)' },
  { id: 'tech_test_armor_buff_a', name: 'Test Armor Buff A', chain: 'TestArmorBuffA', skill: 'Alteration', grade: null, effect: 'buff', statKind: 'armor', power: 20, buffDuration: 5, energyCost: 5, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_armor_buff_b', name: 'Test Armor Buff B', chain: 'TestArmorBuffB', skill: 'Alteration', grade: null, effect: 'buff', statKind: 'armor', power: 10, buffDuration: 5, energyCost: 5, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_plain_damage', name: 'Test Plain Damage', chain: null, skill: null, grade: null, effect: 'damage', power: 30, energyCost: 10, trainingCost: 0, skillReq: 0, desc: 'test fixture (Int-hit-roll damage tech)' },
  { id: 'tech_test_debuff_damage', name: 'Test Sunder', chain: 'TestDebuffDmg', skill: 'Conjuration', grade: null, effect: 'debuff', debuffKind: 'damage', power: 5, debuffDuration: 3, energyCost: 8, trainingCost: 0, skillReq: 0, desc: 'test fixture (magic-school debuff, Int hit roll)' },
  { id: 'tech_test_debuff_armor', name: 'Test Sunder Armor', chain: 'TestDebuffArmor', skill: 'Conjuration', grade: null, effect: 'debuff', debuffKind: 'armor', power: 5, debuffDuration: 3, energyCost: 8, trainingCost: 0, skillReq: 0, desc: 'test fixture (magic-school debuff, Int hit roll)' },
  { id: 'tech_test_weapon_debuff', name: 'Test Weapon Debuff', chain: 'TestWeaponDebuff', skill: 'Swords', grade: null, effect: 'debuff', debuffKind: 'damage', power: 5, debuffDuration: 3, weaponDebuff: true, energyCost: 8, trainingCost: 0, skillReq: 0, desc: 'test fixture (weapon-skill debuff, monster-dodge roll)' },
  { id: 'tech_test_bleed', name: 'Test Bleed', chain: 'TestBleed', skill: 'Knives', grade: null, effect: 'debuff', debuffKind: 'bleed', power: 10, debuffDuration: 3, weaponDebuff: true, energyCost: 8, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_physicalroll', name: 'Test Physical Roll', chain: null, skill: null, grade: null, effect: 'damage', power: 20, physicalRoll: true, energyCost: 10, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_requires_shield', name: 'Test Requires Shield', chain: null, skill: 'Shields', grade: null, effect: 'damage', power: 15, physicalRoll: true, requiresShield: true, energyCost: 10, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_requires_offhand', name: 'Test Requires Offhand Weapon', chain: null, skill: 'Dual Wield', grade: null, effect: 'damage', power: 15, physicalRoll: true, requiresOffhandWeapon: true, energyCost: 10, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_requires_light', name: 'Test Requires Light Armor', chain: 'TestGateLight', skill: 'Light Armor', grade: null, effect: 'buff', statKind: 'dodge', power: 0.05, buffDuration: 3, requiresArmorClass: 'light', energyCost: 10, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_crosscut', name: 'Test Crosscut', chain: 'TestCrosscut', skill: 'Dual Wield', grade: null, effect: 'damage', weaponTech: true, powerMult: 1.5, offhandFollowup: true, energyCost: 14, trainingCost: 0, skillReq: 0, desc: 'test fixture' },
  { id: 'tech_test_goldsteal', name: 'Test Cutpurse', chain: 'TestGoldSteal', skill: 'Thievery', grade: null, effect: 'damage', power: 50, physicalRoll: true, goldSteal: 7, energyCost: 10, trainingCost: 0, skillReq: 0, desc: 'test fixture' }
];
TEST_TECHS.forEach(function (t) { Game.Data.techs.push(t); });

var ALL_TEST_TECH_IDS = TEST_TECHS.map(function (t) { return t.id; });

function makeCharacter(opts) {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  if (opts && opts.skills) {
    for (var k in opts.skills) skillPoints[k] = opts.skills[k];
  }
  var c = Game.Character.create({
    race: (opts && opts.race) || 'Human',
    name: (opts && opts.name) || 'Tester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  // Every test character knows + has slotted every synthetic tech above (24 techSet slots is
  // plenty for 19 fixtures) — keeps each test body focused on the mechanic, not tech-equip
  // bookkeeping.
  var set = 0, idx = 0;
  ALL_TEST_TECH_IDS.forEach(function (id) {
    c.techs.push(id);
    if (idx >= 8) { idx = 0; set++; }
    c.techSets[set][idx] = id;
    idx++;
  });
  c.energy = c.energyMax = 500; // headroom for many casts per test
  c.hitPoints = c.hitPointsMax = 5000; // survive many monster counters within one battle
  Game.state.character = c;
  Game.state.battle = null;
  return c;
}

// Starts a battle vs. the level-1 Field Rat, then applies monster-field overrides (level/hp/
// damage/armor/energy/etc.) for deterministic per-test math. fixedRng(0.5) at start (before any
// override) keeps the pre-battle first-strike roll harmless.
function freshBattle(overrides) {
  setRng(fixedRng(0.5));
  var b = Game.Battle.start('plains_field_rat');
  b.monster.hp = b.monster.hpMax = 100000;
  b.monster.energy = 100000;
  b.monster.damage = 0; // no player-HP interference unless a test overrides it back up
  if (overrides) {
    for (var k in overrides) b.monster[k] = overrides[k];
  }
  return b;
}

// =================== Test 1: dodge/double_attack statKind buffs ===================
console.log('\n=== Test 1: typed dodge/double_attack buffs raise chance; DODGE_CAP/DOUBLE_ATTACK_CAP still hold ===');
(function () {
  var c = makeCharacter({ name: 'DodgeBuffTest' });
  var before = Game.Battle.playerDodgeChance(c);
  freshBattle();
  setRng(fixedRng(0.99)); // no dodge/glancing/double-attack procs on the monster's own counter
  Game.Battle.useTech('tech_test_dodge_small');
  var after = Game.Battle.playerDodgeChance(c);
  assert(Math.abs((after - before) - 0.05) < 1e-9, 'small dodge buff (+0.05) raised playerDodgeChance by exactly 0.05: before=' + before + ' after=' + after);
  Game.Battle.endBattle();

  var c2 = makeCharacter({ name: 'DodgeCapTest' });
  freshBattle();
  setRng(fixedRng(0.99));
  Game.Battle.useTech('tech_test_dodge_big'); // +0.9, should clamp to DODGE_CAP
  assert(Math.abs(Game.Battle.playerDodgeChance(c2) - BALANCE.DODGE_CAP) < 1e-9, 'huge dodge buff (+0.9) clamps at DODGE_CAP (' + BALANCE.DODGE_CAP + '), got ' + Game.Battle.playerDodgeChance(c2));
  Game.Battle.endBattle();

  var c3 = makeCharacter({ name: 'DABuffTest' });
  var daBefore = Game.Battle.playerDoubleAttackChance(c3);
  freshBattle();
  setRng(fixedRng(0.99));
  Game.Battle.useTech('tech_test_da_small');
  var daAfter = Game.Battle.playerDoubleAttackChance(c3);
  assert(Math.abs((daAfter - daBefore) - 0.05) < 1e-9, 'small double_attack buff (+0.05) raised playerDoubleAttackChance by exactly 0.05: before=' + daBefore + ' after=' + daAfter);
  Game.Battle.endBattle();

  var c4 = makeCharacter({ name: 'DACapTest' });
  freshBattle();
  setRng(fixedRng(0.99));
  Game.Battle.useTech('tech_test_da_big');
  assert(Math.abs(Game.Battle.playerDoubleAttackChance(c4) - BALANCE.DOUBLE_ATTACK_CAP) < 1e-9, 'huge double_attack buff (+0.9) clamps at DOUBLE_ATTACK_CAP (' + BALANCE.DOUBLE_ATTACK_CAP + '), got ' + Game.Battle.playerDoubleAttackChance(c4));
  Game.Battle.endBattle();

  assert(Game.Battle.playerDodgeChance(makeCharacter({ name: 'Outside' })) >= 0, 'playerDodgeChance stays callable with Game.state.battle=null (out-of-battle screens.js display path)');
})();

// =================== Test 2: spellpower buff (pre-multiplier) + P0 finding (d): also boosts a servitor-shaped tick ===================
console.log('\n=== Test 2: spellpower buff raises techEffectivePower pre-multiplier; ALSO boosts a servitor-shaped tick (P0 finding d, intentional) ===');
(function () {
  var c = makeCharacter({ name: 'SpellpowerTest' });
  var plainTech = Game.Battle.getTech('tech_test_plain_damage');
  var b = freshBattle();
  var before = Game.Battle.techEffectivePower(c, plainTech);
  var expectedBefore = Math.round(plainTech.power * (1 + c.intelligence * 0.02));
  assert(before === expectedBefore, 'baseline techEffectivePower (no buff) = ' + expectedBefore + ', got ' + before);

  setRng(fixedRng(0.99));
  Game.Battle.useTech('tech_test_spellpower');
  var after = Game.Battle.techEffectivePower(c, plainTech);
  var expectedAfter = Math.round((plainTech.power + 20) * (1 + c.intelligence * 0.02));
  assert(after === expectedAfter, 'techEffectivePower WITH +20 spellpower buff = ' + expectedAfter + ' (power+buff, then Int factor), got ' + after);
  assert(after > before, 'spellpower buff strictly raised the offensive tech\'s effective power');

  // P0 finding (d): the buff flows through the SAME techEffectivePower pipeline the Conjurer
  // servitor tick calls (tickMonsterStatuses passes a synthetic {effect:'damage', power} tech
  // through it) — so it also boosts servitor ticks. Documented here via a synthetic servitor
  // status entry + a real tick (triggered by any subsequent player action -> finishRound ->
  // tickMonsterStatuses), with grade:null and magicArmor 0 so the tick damage is EXACTLY
  // round(techEffectivePower(...)) at fixedRng(0.5) (variance factor 1, no glancing).
  b.monster.magicArmor = 0;
  b.monster.statuses.push({ type: 'servitor', name: 'Test Servitor', turnsLeft: 2, power: 50, grade: null });
  var expectedTick = Math.round(Game.Battle.techEffectivePower(c, { effect: 'damage', power: 50 }));
  var hpBefore = b.monster.hp;
  setRng(fixedRng(0.5)); // variance-neutral, no glancing, no monster dodge/tech proc against the player
  Game.Battle.defend(); // any action triggers finishRound -> tickMonsterStatuses
  var tickDealt = hpBefore - b.monster.hp;
  assert(tickDealt === expectedTick, 'servitor tick WITH the spellpower buff active dealt ' + tickDealt + ', expected ' + expectedTick + ' (buff flows into the shared techEffectivePower pipeline)');
  var expectedTickNoBuff = Math.round(50 * (1 + c.intelligence * 0.02));
  assert(tickDealt > expectedTickNoBuff, 'the buffed servitor tick (' + tickDealt + ') is strictly larger than the no-buff baseline (' + expectedTickNoBuff + ')');
  Game.Battle.endBattle();
})();

// =================== Test 3: typed buff does NOT add flat Damage; untyped buff still does ===================
console.log('\n=== Test 3: playerBuffDamageBonus — typed buffs excluded, untyped (legacy) buffs still add flat Damage ===');
(function () {
  var c = makeCharacter({ name: 'BuffDamageTest' });
  var b = freshBattle({ armor: 3 });
  setRng(fixedRng(0.5)); // no monster dodge/glancing, variance factor exactly 1, no double-attack
  var hp0 = b.monster.hp;
  Game.Battle.attack();
  var dmgNoBuff = hp0 - b.monster.hp;

  var hp1 = b.monster.hp;
  Game.Battle.useTech('tech_test_armor_buff_a'); // typed (statKind:'armor'), should NOT add Damage
  Game.Battle.attack();
  var dmgTypedBuff = hp1 - b.monster.hp;
  assert(dmgTypedBuff === dmgNoBuff, 'a typed (statKind) buff active does not change basic-attack damage: ' + dmgTypedBuff + ' === ' + dmgNoBuff);

  var hp2 = b.monster.hp;
  Game.Battle.useTech('tech_test_untyped_buff'); // untyped legacy buff, +15 flat Damage
  Game.Battle.attack();
  var dmgUntypedBuff = hp2 - b.monster.hp;
  assert(dmgUntypedBuff === dmgNoBuff + 15, 'an untyped (legacy) buff still adds its flat power (+15) to basic-attack damage: ' + dmgUntypedBuff + ' === ' + (dmgNoBuff + 15));
  Game.Battle.endBattle();
})();

// =================== Test 4: typed re-cast replaces same chain; different chains stack ===================
console.log('\n=== Test 4: typed buff re-cast replaces same-chain entry (no stacking); different chains stack ===');
(function () {
  var c = makeCharacter({ name: 'RecastTest' });
  var b = freshBattle();
  setRng(fixedRng(0.99));
  Game.Battle.useTech('tech_test_armor_buff_a'); // chain TestArmorBuffA, power 20
  Game.Battle.useTech('tech_test_armor_buff_a'); // re-cast, same chain
  var sameChainEntries = b.playerStatuses.filter(function (st) { return st.type === 'buff' && st.chain === 'TestArmorBuffA'; });
  assert(sameChainEntries.length === 1, 're-casting the same typed/chained buff leaves exactly ONE entry for that chain (no stacking), got ' + sameChainEntries.length);
  assert(sameChainEntries[0].power === 20, 're-cast entry keeps the (re-applied) power 20, got ' + sameChainEntries[0].power);

  Game.Battle.useTech('tech_test_armor_buff_b'); // DIFFERENT chain, power 10 -> stacks alongside A
  var totalArmorBuffPower = b.playerStatuses
    .filter(function (st) { return st.type === 'buff' && st.statKind === 'armor'; })
    .reduce(function (sum, st) { return sum + st.power; }, 0);
  assert(totalArmorBuffPower === 30, 'two DIFFERENT chains stack (20 + 10 = 30), got ' + totalArmorBuffPower);
  Game.Battle.endBattle();
})();

// =================== Test 5: debuff damage — floor 1, revert on expiry, re-cast reverts-then-applies (no drift) ===================
console.log('\n=== Test 5: effect:debuff damage — floors at 1, reverts exactly on expiry and on re-cast ===');
(function () {
  var c = makeCharacter({ name: 'DebuffDmgTest' });
  var b = freshBattle({ damage: 10 });
  setRng(fixedRng(0.05)); // well under the Int spell-hit-chance floor (0.40) -> always lands
  Game.Battle.useTech('tech_test_debuff_damage'); // power 5
  assert(b.monster.damage === 5, 'monster.damage reduced by the debuff power (10 -> 5), got ' + b.monster.damage);
  var entry = b.monster.statuses.filter(function (s) { return s.chain === 'TestDebuffDmg'; })[0];
  assert(!!entry && entry.applied === 5, 'debuff entry.applied records the full 5 (no floor bite), got ' + (entry && entry.applied));

  // Floor case: damage already low enough that the full power would push below 1.
  var b2 = freshBattle({ damage: 3 });
  setRng(fixedRng(0.05));
  Game.Battle.useTech('tech_test_debuff_damage'); // power 5 vs damage 3 -> floors at 1
  assert(b2.monster.damage === 1, 'monster.damage floors at 1 when the debuff power would exceed it (3, power 5), got ' + b2.monster.damage);

  // Revert on expiry: debuffDuration on the fixture is 3 turns, and the CAST's own finishRound
  // already consumes the first tick (every action, including the cast itself, ends its round via
  // finishRound -> tickMonsterStatuses) — so only 2 MORE actions are needed to reach expiry: one
  // that leaves it active (turnsLeft 2->1) and one that reverts it (turnsLeft 1->0).
  var b3 = freshBattle({ damage: 20 });
  setRng(fixedRng(0.05));
  Game.Battle.useTech('tech_test_debuff_damage'); // -> damage 15; this action's own finishRound already ticks turnsLeft 3->2
  assert(b3.monster.damage === 15, 'sanity: debuff applied (20 -> 15)');
  setRng(fixedRng(0.99)); // no further debuff casts; just tick turns via Defend
  Game.Battle.defend(); // turnsLeft 2 -> 1
  assert(b3.monster.damage === 15, 'debuff still active after one more tick (damage stays 15), got ' + b3.monster.damage);
  Game.Battle.defend(); // turnsLeft 1 -> 0 -> revert
  assert(b3.monster.damage === 20, 'debuff reverted EXACTLY to the original value (20) on expiry, got ' + b3.monster.damage);
  assert(b3.log.some(function (l) { return /wears off/.test(l); }), 'a "wears off" log line was recorded on expiry');

  // Re-cast reverts old before applying new: no drift.
  var b4 = freshBattle({ damage: 20 });
  setRng(fixedRng(0.05));
  Game.Battle.useTech('tech_test_debuff_damage'); // power 5 -> 20-5=15
  assert(b4.monster.damage === 15, 'sanity: first cast applied (20 -> 15)');
  // Re-cast the SAME chain with a different power via a throwaway variant tech object appended to
  // Game.Data.techs would collide with the id-stability convention, so instead re-cast the exact
  // same tech twice in a row (same chain, same power 5) — the no-drift guarantee still shows: if
  // the engine naively stacked without reverting first, damage would be 20-5-5=10 instead of the
  // correct re-applied 15.
  Game.Battle.useTech('tech_test_debuff_damage');
  assert(b4.monster.damage === 15, 'a same-chain re-cast reverts the OLD entry before applying the new one (still 15, not 10 — no drift), got ' + b4.monster.damage);
  var chainEntries4 = b4.monster.statuses.filter(function (s) { return s.chain === 'TestDebuffDmg'; });
  assert(chainEntries4.length === 1, 're-cast leaves exactly one debuff entry for the chain, got ' + chainEntries4.length);
  Game.Battle.endBattle();
})();

// =================== Test 6: debuff armor — floor 0, same revert discipline ===================
console.log('\n=== Test 6: effect:debuff armor — floors at 0, reverts exactly on expiry ===');
(function () {
  var b = freshBattle({ armor: 8 });
  setRng(fixedRng(0.05));
  Game.Battle.useTech('tech_test_debuff_armor'); // power 5
  assert(b.monster.armor === 3, 'monster.armor reduced by the debuff power (8 -> 3), got ' + b.monster.armor);

  var b2 = freshBattle({ armor: 2 });
  setRng(fixedRng(0.05));
  Game.Battle.useTech('tech_test_debuff_armor'); // power 5 vs armor 2 -> floors at 0
  assert(b2.monster.armor === 0, 'monster.armor floors at 0 (2, power 5), got ' + b2.monster.armor);

  var b3 = freshBattle({ armor: 8 });
  setRng(fixedRng(0.05));
  Game.Battle.useTech('tech_test_debuff_armor'); // -> armor 3
  setRng(fixedRng(0.99));
  Game.Battle.defend(); Game.Battle.defend(); Game.Battle.defend(); // 3 turns -> expiry
  assert(b3.monster.armor === 8, 'armor debuff reverts exactly to the original value (8) on expiry, got ' + b3.monster.armor);
  Game.Battle.endBattle();
})();

// =================== Test 7: bleed — flat tick, Fear discipline preserved, no armor mitigation ===================
console.log('\n=== Test 7: debuffKind bleed — flat per-round tick, ignores armor, Fear still reduces it ===');
(function () {
  var b = freshBattle({ armor: 99999 }); // huge armor: bleed must ignore it completely
  setRng(fixedRng(0.5)); // >= monster dodge chance -> weaponDebuff hit lands
  Game.Battle.useTech('tech_test_bleed'); // power 10
  var hpBefore = b.monster.hp;
  setRng(fixedRng(0.5));
  Game.Battle.defend(); // triggers tickMonsterStatuses
  var tickDmg = hpBefore - b.monster.hp;
  assert(tickDmg === 10, 'bleed tick dealt exactly its flat power (10) despite armor=99999 (no mitigation), got ' + tickDmg);

  // Fear multiplier: monster 3 levels above the player -> fearMultiplier = 1 - 3*0.10 = 0.70.
  var b2 = freshBattle({ armor: 99999 });
  setRng(fixedRng(0.5));
  Game.Battle.useTech('tech_test_bleed');
  b2.monster.level = b2.player.level + 3;
  var hpBefore2 = b2.monster.hp;
  setRng(fixedRng(0.5));
  Game.Battle.defend();
  var tickDmg2 = hpBefore2 - b2.monster.hp;
  var expectedFeared = Math.max(1, Math.round(10 * 0.70));
  assert(tickDmg2 === expectedFeared, 'a 3-level Fear gap reduces the bleed tick to ' + expectedFeared + ' (cannot bypass Fear), got ' + tickDmg2);
  assert(tickDmg2 < tickDmg, 'the feared bleed tick (' + tickDmg2 + ') is strictly smaller than the unfeared tick (' + tickDmg + ')');
  Game.Battle.endBattle();
})();

// =================== Test 8: hit-roll split — weaponDebuff rolls monster dodge; magic debuff rolls Int spell-hit ===================
console.log('\n=== Test 8: debuff hit-roll split — weaponDebuff forces a monster-dodge miss; magic debuff forces an Int-hit miss; energy spent either way ===');
(function () {
  var b = freshBattle({ damage: 10 });
  var energyBefore = b.player.energy;
  setRng(fixedRng(0.001)); // well under monster dodge chance -> forced dodge
  Game.Battle.useTech('tech_test_weapon_debuff');
  assert(b.monster.statuses.length === 0, 'a dodged weaponDebuff applies no status');
  assert(b.monster.damage === 10, 'a dodged weaponDebuff leaves monster.damage untouched');
  assert(b.log.some(function (l) { return /avoids your Test Weapon Debuff/.test(l); }), 'the dodge log names the tech: ' + b.log[b.log.length - 1]);
  var tech = Game.Battle.getTech('tech_test_weapon_debuff');
  assert(energyBefore - b.player.energy === tech.energyCost, 'Energy was still spent on a dodged cast (' + tech.energyCost + '), got delta ' + (energyBefore - b.player.energy));
  Game.Battle.endBattle();

  var b2 = freshBattle({ damage: 10 });
  var energyBefore2 = b2.player.energy;
  setRng(fixedRng(0.99)); // 0.99 >= INT_SPELL_HIT_MAX (0.98) -> always a forced miss
  Game.Battle.useTech('tech_test_debuff_damage');
  assert(b2.monster.statuses.length === 0, 'a missed magic debuff applies no status');
  assert(b2.monster.damage === 10, 'a missed magic debuff leaves monster.damage untouched');
  assert(b2.log.some(function (l) { return /fails to take hold/.test(l); }), 'the miss log fires: ' + b2.log[b2.log.length - 1]);
  var techMagic = Game.Battle.getTech('tech_test_debuff_damage');
  assert(energyBefore2 - b2.player.energy === techMagic.energyCost, 'Energy was still spent on a missed magic-debuff cast (' + techMagic.energyCost + '), got delta ' + (energyBefore2 - b2.player.energy));
  Game.Battle.endBattle();
})();

// =================== Test 9: physicalRoll — rolls monster dodge instead of the Int spell-hit check ===================
console.log('\n=== Test 9: physicalRoll — forced monster dodge misses; forced hit lands with NO Int roll consumed ===');
(function () {
  var b = freshBattle();
  setRng(fixedRng(0.001)); // forced monster dodge
  var hpBefore = b.monster.hp;
  Game.Battle.useTech('tech_test_physicalroll');
  assert(b.monster.hp === hpBefore, 'a forced monster-dodge on a physicalRoll tech deals no damage');
  assert(b.log.some(function (l) { return /dodges your Test Physical Roll/.test(l); }), 'the dodge log names the tech: ' + b.log[b.log.length - 1]);
  Game.Battle.endBattle();

  // Demonstrate the Int roll is genuinely skipped: a 0-Intelligence character vs a level-30
  // monster under fixedRng(0.5) would MISS the archived Int spell-hit roll (hitChance = 0.75 -
  // 0.01*30 = 0.45, and 0.5 >= 0.45 is a miss) for a PLAIN (non-physicalRoll) damage tech — but
  // the SAME setup on the physicalRoll tech instead rolls monster dodge, capped at 0.15
  // (MONSTER_DODGE_CAP), so 0.5 (>= 0.15) is a HIT. Same character, same monster, same rng,
  // opposite outcome — proof the Int roll never fires for physicalRoll.
  var c2 = makeCharacter({ name: 'ZeroIntTest' });
  c2.intelligence = 0;
  var bPlain = freshBattle({ level: 30 });
  setRng(fixedRng(0.5));
  var hpBeforePlain = bPlain.monster.hp;
  Game.Battle.useTech('tech_test_plain_damage'); // NOT physicalRoll -> Int hit-roll applies
  assert(bPlain.monster.hp === hpBeforePlain, 'sanity: the plain (Int-rolled) damage tech MISSED under these conditions (0 Int, monster level 30, rng 0.5)');
  Game.Battle.endBattle();

  var c3 = makeCharacter({ name: 'ZeroIntPhysicalTest' });
  c3.intelligence = 0;
  var bPhys = freshBattle({ level: 30 });
  setRng(fixedRng(0.5));
  var hpBeforePhys = bPhys.monster.hp;
  Game.Battle.useTech('tech_test_physicalroll'); // physicalRoll -> monster-dodge roll instead
  assert(bPhys.monster.hp < hpBeforePhys, 'the SAME character/monster/rng HITS on the physicalRoll tech (Int roll was skipped, dodge roll used instead) — hp dropped from ' + hpBeforePhys + ' to ' + bPhys.monster.hp);
  Game.Battle.endBattle();
})();

// =================== Test 10: equipment gates — refused before any cost, satisfied -> proceeds ===================
console.log('\n=== Test 10: requiresShield / requiresOffhandWeapon / requiresArmorClass — refused pre-cost, met -> cast proceeds ===');
(function () {
  // requiresShield
  var c = makeCharacter({ name: 'ShieldGateTest' });
  var b = freshBattle();
  var energyBefore = c.energy;
  setRng(fixedRng(0.5));
  Game.Battle.useTech('tech_test_requires_shield');
  assert(c.energy === energyBefore, 'requiresShield refusal spends NO energy (empty offhand), before=' + energyBefore + ' after=' + c.energy);
  assert(b.log.some(function (l) { return /Shield equipped in your offhand/.test(l); }), 'friendly refusal log names what is missing: ' + b.log[b.log.length - 1]);
  Game.Inventory.addItem(c, 'item_test_shield');
  Game.Inventory.equip(c, 'item_test_shield');
  var hpBeforeShield = b.monster.hp;
  Game.Battle.useTech('tech_test_requires_shield');
  assert(c.energy < energyBefore, 'with a Shield equipped, the cast proceeds and spends Energy');
  assert(b.monster.hp < hpBeforeShield, 'with the gate satisfied, the tech actually lands damage');
  Game.Battle.endBattle();

  // requiresOffhandWeapon
  var c2 = makeCharacter({ name: 'OffhandGateTest' });
  var b2 = freshBattle();
  var energyBefore2 = c2.energy;
  setRng(fixedRng(0.5));
  Game.Battle.useTech('tech_test_requires_offhand');
  assert(c2.energy === energyBefore2, 'requiresOffhandWeapon refusal spends NO energy (empty offhand)');
  assert(b2.log.some(function (l) { return /weapon equipped in your offhand/.test(l); }), 'friendly refusal log names what is missing: ' + b2.log[b2.log.length - 1]);
  Game.Inventory.addItem(c2, 'item_test_offhand_weapon');
  Game.Inventory.equip(c2, 'item_test_offhand_weapon');
  Game.Battle.useTech('tech_test_requires_offhand');
  assert(c2.energy < energyBefore2, 'with an offhand weapon equipped, the cast proceeds and spends Energy');
  Game.Battle.endBattle();

  // requiresArmorClass: 'light'. NOTE: Game.Inventory.grantStarterKit auto-equips
  // 'light_body_traveler_tunic' on every fresh character (a friendlier first Status screen), so
  // the body slot must be explicitly stripped first to exercise the "no body armor" refusal.
  var c3 = makeCharacter({ name: 'ArmorClassGateTest' });
  Game.Inventory.unequip(c3, 'body');
  var b3 = freshBattle();
  var energyBefore3 = c3.energy;
  setRng(fixedRng(0.5));
  Game.Battle.useTech('tech_test_requires_light');
  assert(c3.energy === energyBefore3, 'requiresArmorClass:light refusal spends NO energy (no body armor)');
  assert(b3.log.some(function (l) { return /Light Armor worn on your body/.test(l); }), 'friendly refusal log names what is missing: ' + b3.log[b3.log.length - 1]);
  // Wrong armor class also refuses.
  Game.Inventory.addItem(c3, 'item_test_heavy_body');
  Game.Inventory.equip(c3, 'item_test_heavy_body');
  Game.Battle.useTech('tech_test_requires_light');
  assert(c3.energy === energyBefore3, 'requiresArmorClass:light still refuses with the WRONG armor class (Heavy) equipped');
  Game.Inventory.unequip(c3, 'body');
  Game.Inventory.addItem(c3, 'item_test_light_body');
  Game.Inventory.equip(c3, 'item_test_light_body');
  Game.Battle.useTech('tech_test_requires_light');
  assert(c3.energy < energyBefore3, 'with Light Armor worn on the body, the cast proceeds and spends Energy');
  Game.Battle.endBattle();
})();

// =================== Test 11: offhandFollowup — Crosscut's guaranteed extra swing ===================
console.log('\n=== Test 11: offhandFollowup — an extra offhand swing fires only when dual-wielding ===');
(function () {
  var c = makeCharacter({ name: 'CrosscutNoOffhandTest' });
  var b = freshBattle({ armor: 0 });
  setRng(fixedRng(0.5)); // hit, no glancing, variance-neutral, for both the main hit and (if any) follow-up
  var hp0 = b.monster.hp;
  Game.Battle.useTech('tech_test_crosscut'); // weaponTech, no offhand equipped
  var dmgNoOffhand = hp0 - b.monster.hp;
  assert(dmgNoOffhand > 0, 'sanity: the main weaponTech hit landed without an offhand equipped');
  Game.Battle.endBattle();

  var c2 = makeCharacter({ name: 'CrosscutWithOffhandTest' });
  Game.Inventory.addItem(c2, 'item_test_offhand_weapon');
  Game.Inventory.equip(c2, 'item_test_offhand_weapon');
  var b2 = freshBattle({ armor: 0 });
  setRng(fixedRng(0.5));
  var hp2 = b2.monster.hp;
  Game.Battle.useTech('tech_test_crosscut'); // same tech, now dual-wielding
  var dmgWithOffhand = hp2 - b2.monster.hp;
  assert(dmgWithOffhand > dmgNoOffhand, 'dual-wielding triggers the guaranteed offhand follow-up: total damage (' + dmgWithOffhand + ') exceeds the main-hit-only case (' + dmgNoOffhand + ')');
  assert(b2.log.some(function (l) { return /offhand strikes/.test(l); }), 'an offhand-strike log line was recorded: ' + b2.log.join(' | '));
  Game.Battle.endBattle();
})();

// =================== Test 12: goldSteal — banked once per chain, paid with win gold, forfeited on flee ===================
console.log('\n=== Test 12: goldSteal — pays base gold + N exactly once even landing twice; forfeited on flee ===');
(function () {
  var c = makeCharacter({ name: 'GoldStealWinTest' });
  var b = freshBattle({ goldMin: 20, goldMax: 20, hp: 1, hpMax: 1000 }); // survives 2 casts, dies to a 3rd hit
  b.monster.hp = 1000; // override AFTER freshBattle's own override so it sticks
  var goldBefore = Game.Character.goldTotalAsGold(c);
  setRng(fixedRng(0.5)); // physicalRoll hit lands (monster dodge capped well under 0.5)
  Game.Battle.useTech('tech_test_goldsteal'); // lands hit #1, banks 7
  Game.Battle.useTech('tech_test_goldsteal'); // lands hit #2, same chain -> NOT banked again
  assert(b.goldStealBanked === 7, 'goldSteal banked exactly once (7) even though the chain landed twice, got ' + b.goldStealBanked);
  b.monster.hp = 1; // finish it off with a plain attack to reach onWin
  Game.Battle.attack();
  assert(b.phase === 'won', 'sanity: the battle actually resolved as a win, phase=' + b.phase);
  var goldAfter = Game.Character.goldTotalAsGold(c);
  assert(goldAfter === goldBefore + 20 + 7, 'onWin paid base gold (20) + the banked goldSteal (7) exactly once: expected ' + (goldBefore + 27) + ', got ' + goldAfter);
  assert(b.log.some(function (l) { return /lift 7 gold from the corpse/.test(l); }), 'a goldSteal payout log line was recorded: ' + b.log.join(' | '));
  Game.Battle.endBattle();

  // Forfeited on flee: the tech lands (banks 7), but the player flees instead of winning -> the
  // bank is never paid (battle.goldStealBanked lives only on the transient, discarded battle
  // object; onWin is never reached).
  var c2 = makeCharacter({ name: 'GoldStealFleeTest' });
  var b2 = freshBattle({ goldMin: 20, goldMax: 20 });
  var goldBefore2 = Game.Character.goldTotalAsGold(c2);
  setRng(fixedRng(0.5));
  Game.Battle.useTech('tech_test_goldsteal'); // lands, banks 7
  assert(b2.goldStealBanked === 7, 'sanity: the flee-case battle also banked 7 before fleeing');
  setRng(fixedRng(0.01)); // well under fleeChance -> flee succeeds
  Game.Battle.flee();
  assert(b2.phase === 'fled', 'sanity: the battle resolved as fled, phase=' + b2.phase);
  var goldAfter2 = Game.Character.goldTotalAsGold(c2);
  assert(goldAfter2 === goldBefore2, 'fleeing after landing goldSteal pays NOTHING (banked total forfeited by construction): before=' + goldBefore2 + ' after=' + goldAfter2);
  Game.Battle.endBattle();
})();

console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' FAILURE(S)');
}
process.exit(failures ? 1 : 0);
