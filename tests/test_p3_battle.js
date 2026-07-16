// Phase 3 exit tests — battle engine + battle/techs/explore screens, driven through the
// fakedom shim. Randomness stubbed via Game.Battle._rng.

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
loadScript('data/statinfo.js');
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

// RNG stubbing helpers -------------------------------------------------------
// fixedRng(0.99) -> no dodge / no glancing / no double attack / no shard / no drop,
// monster never picks a tech (tech pick requires rng < 0.5).
function setRng(fn) { Game.Battle._rng = fn; }
function fixedRng(v) { return function () { return v; }; }
// Sequence rng: consume values in order, then fall back to a default.
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
console.log('\n=== Test 0: data sanity (monsters reference real items/techs) ===');
assert(Game.Data.monsters.length === 87, '87 monsters defined (14 pre-Phase-6b + 12 Phase 6b regular + 4 Phase 6b bosses + 15 enemy-variety-pass regulars + 6 Level-Arc Band A regulars + 1 Band A boss + 6 Level-Arc Band B regulars + 1 Band B boss + 6 Level-Arc Band C regulars + 1 Band C boss + 6 Level-Arc Band D regulars + 1 Band D boss + 6 Level-Arc Band E regulars + 1 Band E boss + 6 Level-Arc Band F regulars + 1 Band F boss), got ' + Game.Data.monsters.length);
var bosses = Game.Data.monsters.filter(function (m) { return m.boss; });
assert(bosses.length === 11, 'exactly 11 bosses defined (Phase 6b adds 4 to the original estari_ruin_warden, Level-Arc Band A adds majiku_warlord, Band B adds majiku_ridge_chieftain, Band C adds ukai_deep_dweller, Band D adds estari_warden_prime, Band E adds society_anima_horror, Band F adds eidas_ascendant -- the arc\'s FINAL boss), got ' + bosses.length);
var badRefs = [];
Game.Data.monsters.forEach(function (m) {
  (m.drops || []).forEach(function (d) {
    if (!Game.Inventory.getItem(d.itemId)) badRefs.push(m.id + ' -> ' + d.itemId);
  });
  (m.techs || []).forEach(function (tid) {
    if (!Game.Battle.getTech(tid)) badRefs.push(m.id + ' -> tech ' + tid);
  });
});
assert(badRefs.length === 0, 'all monster drops/techs reference real ids' + (badRefs.length ? ': ' + badRefs.join(', ') : ''));
var playerTechs = Game.Data.techs.filter(function (t) { return !t.monsterOnly; });
assert(playerTechs.length >= 8, 'at least 8 player techniques, got ' + playerTechs.length);
['Fire', 'Star', 'Dark'].forEach(function (grade) {
  assert(playerTechs.some(function (t) { return t.grade === grade && (t.effect === 'damage' || t.effect === 'drain'); }),
    'damage tech exists for grade ' + grade);
});
assert(playerTechs.some(function (t) { return t.grade === 'Light' && t.effect === 'heal'; }), 'Light healing tech exists');
assert(playerTechs.some(function (t) { return t.skill === 'Alteration' && t.effect === 'buff'; }), 'Alteration buff tech exists');
assert(playerTechs.some(function (t) { return t.skill === 'Absorption' && t.effect === 'drain'; }), 'Absorption drain tech exists');

// =================== Test 1: starter tech on creation ===================
console.log('\n=== Test 1: starter tech granted for magic-school OR weapon creation skill ===');
var cMage = makeCharacter({ skills: { 'Abjuration': 3, 'Rods': 2 }, name: 'Mage' });
assert(cMage.techs.indexOf('tech_mend_wounds_1') !== -1, 'Abjuration creation skill grants Mend Wounds I');
assert(cMage.techSets[0][0] === 'tech_mend_wounds_1', 'starter tech is slotted in Set 1 slot 1');
// Feature C (user-directed): weapon creation builds now grant a starter weapon tech too (the
// "Attack-spam" problem the phase brief calls out) — Swords creation build gets Cleave I.
var cWarrior = makeCharacter({ skills: { 'Swords': 3, 'Heavy Armor': 2 }, name: 'Warrior' });
assert(cWarrior.techs.indexOf('tech_cleave_1') !== -1, 'Swords creation skill grants Cleave I');
assert(cWarrior.techSets[0][0] === 'tech_cleave_1', 'Cleave I is slotted in Set 1 slot 1');
assert(cWarrior.fury === 0 && Array.isArray(cWarrior.techSets) && cWarrior.techSets.length === 3, 'new character has fury=0 and 3 tech sets');
// A build with neither a magic-school nor a weapon-skill creation investment still gets nothing.
var cNoStarter = makeCharacter({ skills: { 'Heavy Armor': 3, 'Shields': 2 }, name: 'Blank' });
assert(cNoStarter.techs.length === 0, 'no starter tech without a magic-school or weapon creation skill');
// Tie between a magic school and a weapon skill goes to magic (invented tie-break, phase brief).
var cTie = makeCharacter({ skills: { 'Evocation': 2, 'Swords': 2 }, name: 'TieBuild' });
assert(cTie.techs.indexOf('tech_firebolt_1') !== -1 && cTie.techs.indexOf('tech_cleave_1') === -1, 'tied magic/weapon creation investment goes to magic (Firebolt I, not Cleave I)');

// =================== Test 2: dex order ===================
console.log('\n=== Test 2: higher-dex monster strikes first ===');
var c2 = makeCharacter({ name: 'DexTest' });
c2.dexterity = 3; // below Field Rat's effective dex? rat level 1 -> player 3 >= 1: player first.
setRng(fixedRng(0.99));
var b2 = Game.Battle.start('plains_field_rat');
assert(b2.playerFirst === true, 'player (dex 3) strikes first vs level-1 rat');
assert(b2.player.hitPoints === c2.hitPointsMax, 'no first-strike damage taken when player is faster');
Game.Battle.endBattle();

c2.dexterity = 3;
var hpBefore = c2.hitPoints = c2.hitPointsMax;
var b2b = Game.Battle.start('majiku_forest_scout'); // level 6 monster, effective dex 6 > 3
assert(b2b.playerFirst === false, 'level-6 monster (effective dex 6) strikes first vs dex-3 player');
assert(c2.hitPoints < hpBefore, 'monster first strike dealt damage before any player action (' + c2.hitPoints + ' < ' + hpBefore + ')');
Game.Battle.endBattle();

// tie -> player first
var c2c = makeCharacter({ name: 'TieTest' });
c2c.dexterity = 1;
var b2c = Game.Battle.start('plains_field_rat'); // level 1 == dex 1
assert(b2c.playerFirst === true, 'dexterity tie goes to the player');
Game.Battle.endBattle();

// =================== Test 3: Fear ===================
console.log('\n=== Test 3: Fear reduces player damage ~20% vs +2-level monster; healing unaffected ===');
var c3 = makeCharacter({ skills: { 'Abjuration': 3 }, name: 'FearTest' });
c3.level = 1;
// rng = 0.5 -> variance factor exactly 1.0, no dodge (0.5 > caps), no glancing, no double attack.
setRng(fixedRng(0.5));
var b3 = Game.Battle.start('plains_vermin_swarm'); // level 3 vs level 1 => fear 2 levels => x0.8
assert(Game.Battle.fearLevels(b3) === 2, 'fear levels = 2');
assert(Math.abs(Game.Battle.fearMultiplier(b3) - 0.8) < 1e-9, 'fear multiplier = 0.8');

var weaponDamage = Game.Character.getDamage(c3);
var expectedFearDmg = Math.max(1, Math.round(weaponDamage * 0.8 - b3.monster.armor));
var mHpBefore = b3.monster.hp;
Game.Battle.attack();
var actualDmg = mHpBefore - b3.monster.hp;
assert(actualDmg === expectedFearDmg, 'feared attack dealt ' + actualDmg + ', expected ' + expectedFearDmg + ' (=' + weaponDamage + ' dmg x0.8 - ' + b3.monster.armor + ' armor)');

// healing unaffected by fear: expected = round(power * (1 + int*0.01)) regardless of fear
c3.hitPoints = 10;
var healTech = Game.Battle.getTech('tech_mend_wounds_1');
var expectedHeal = Math.round(healTech.power * (1 + c3.intelligence * 0.01));
var hpBeforeHeal = c3.hitPoints;
Game.Battle.useTech('tech_mend_wounds_1');
// monster counter also hits us after the heal — count only the heal delta via log inspection:
var healLine = b3.log.filter(function (l) { return l.indexOf('Mend Wounds') !== -1 && l.indexOf('recover') !== -1; }).pop();
assert(!!healLine, 'heal log line present: ' + healLine);
var healed = healLine ? parseInt(healLine.match(/recover (\d+) HP/)[1], 10) : -1;
assert(healed === expectedHeal, 'healing (' + healed + ') matches un-feared formula (' + expectedHeal + ') — Fear did not reduce it');
Game.Battle.endBattle();

// =================== Test 4: energy rules ===================
console.log('\n=== Test 4: player at 0 energy can only flee; monster at 0 energy flees ===');
var c4 = makeCharacter({ name: 'EnergyTest' });
setRng(fixedRng(0.99));
var b4 = Game.Battle.start('plains_field_rat');
c4.energy = 0;
assert(Game.Battle.canAct(b4) === false, 'canAct=false at 0 energy');
var logLenBefore = b4.log.length;
Game.Battle.attack();
assert(b4.monster.hp === b4.monster.hpMax, 'attack at 0 energy does nothing');
assert(b4.log.length > logLenBefore && /out of Energy/.test(b4.log[b4.log.length - 1]), 'out-of-energy message logged');
// UI check: render battle screen, Attack/Item/Defend disabled at 0 energy, Escape enabled
// (Feature A/C: flee is always attemptable regardless of Energy — Energy.md; Defend costs Energy
// like any other action and is disabled here).
Game.Screens.navigate('battle');
var mc = document.getElementById('maincontent');
var actionButtons = mc.queryAllByClass('battle-action');
assert(actionButtons.length === 4, 'four action buttons rendered (Attack/Item/Defend/Escape)');
assert(actionButtons[0].disabled === true, 'Attack disabled at 0 energy');
assert(actionButtons[1].disabled === true, 'Item disabled at 0 energy');
assert(actionButtons[2].disabled === true, 'Defend disabled at 0 energy');
assert(actionButtons[3].disabled === false, 'Escape still enabled at 0 energy');
assert(/Escape \(\d+%\)/.test(actionButtons[3].title), 'Escape title shows the live flee percentage: ' + actionButtons[3].title);

// Feature A (user-directed): escape can now fail. Level 1 player vs level-1 full-HP rat, not a
// boss -> fleeChance = FLEE_BASE (0.65) exactly (no level diff, no wounded bonus, no boss penalty).
assert(Math.abs(Game.Battle.fleeChance(b4) - BALANCE.FLEE_BASE) < 1e-9, 'sanity: fleeChance = FLEE_BASE for an even, full-HP, non-boss fight');
var furyBeforeFleeFail = c4.fury = 5;
setRng(fixedRng(0.99)); // 0.99 >= 0.65 -> flee fails
Game.Battle.flee();
assert(b4.phase === 'active', 'failed flee (roll >= fleeChance) leaves the battle active');
assert(c4.fury === furyBeforeFleeFail, 'failed flee does NOT reset Fury');
assert(b4.log.some(function (l) { return /fail to escape/.test(l); }), 'failed-flee log line present');
setRng(fixedRng(0.01)); // 0.01 < 0.65 -> flee succeeds
Game.Battle.flee();
assert(b4.phase === 'fled', 'successful flee (roll < fleeChance) -> phase fled');
assert(c4.fury === 0, 'successful flee resets Fury');
// v1.4 P2 (G1): AP is a kills-only currency — fleeing (successful or not) grants none.
assert(c4.ap === 0, 'fleeing grants no Advantage Points');
Game.Battle.endBattle();

// monster energy drain -> monsterFled with no rewards
var c4b = makeCharacter({ name: 'DrainTest' });
c4b.level = 5; // strong enough not to die
Game.Character.recalcDerived(c4b);
c4b.hitPoints = c4b.hitPointsMax = 500; // survive long fight
c4b.energy = c4b.energyMax = 10000;
setRng(fixedRng(0.99)); // monster never uses techs, always basic attack (cost 5)
var b4b = Game.Battle.start('plains_field_rat'); // rat energy 30 -> 6 counters until 0
// Make sure we can't accidentally kill it first: give it huge hp and the player tiny damage.
b4b.monster.hp = b4b.monster.hpMax = 100000;
var xpBefore = c4b.xp, goldBefore = c4b.gold, killsBefore = c4b.monsterKills;
var guard = 0;
while (b4b.phase === 'active' && guard++ < 50) {
  Game.Battle.attack();
}
assert(b4b.phase === 'monsterFled', 'monster at 0 energy flees -> phase monsterFled (got ' + b4b.phase + ' after ' + guard + ' rounds)');
assert(c4b.xp === xpBefore && c4b.gold === goldBefore, 'no XP/gold rewards when the monster escapes');
assert(c4b.monsterKills === killsBefore, 'no monster-kill credit when the monster escapes');
assert(b4b.pendingLoot === null, 'no loot when the monster escapes');
Game.Battle.endBattle();

// =================== Test 4b: fleeChance formula (Feature A) ===================
console.log('\n=== Test 4b: fleeChance — monster-hp monotonicity, boss penalty, clamps ===');
var c4b1 = makeCharacter({ name: 'FleeFormulaTest' });
setRng(fixedRng(0.99));
var b4b1 = Game.Battle.start('plains_field_rat');
var chanceFullHp = Game.Battle.fleeChance(b4b1);
b4b1.monster.hp = Math.round(b4b1.monster.hpMax * 0.5);
var chanceHalfHp = Game.Battle.fleeChance(b4b1);
b4b1.monster.hp = 1;
var chanceNearDeadHp = Game.Battle.fleeChance(b4b1);
assert(chanceHalfHp > chanceFullHp, 'fleeChance rises as the monster is wounded (half HP > full HP): ' + chanceHalfHp + ' > ' + chanceFullHp);
assert(chanceNearDeadHp > chanceHalfHp, 'fleeChance keeps rising the more wounded the monster is: ' + chanceNearDeadHp + ' > ' + chanceHalfHp);
var expectedNearDead = BALANCE.FLEE_BASE + BALANCE.FLEE_WOUNDED_BONUS * (1 - 1 / b4b1.monster.hpMax);
assert(Math.abs(chanceNearDeadHp - Math.max(BALANCE.FLEE_MIN, Math.min(BALANCE.FLEE_MAX, expectedNearDead))) < 1e-9, 'fleeChance formula matches BASE + WOUNDED*(1-hp/hpMax): got ' + chanceNearDeadHp);
Game.Battle.endBattle();

// boss penalty: same setup but flagged boss -> lower chance than an identical non-boss fight
var c4b2 = makeCharacter({ name: 'FleeBossTest' });
setRng(fixedRng(0.99));
var b4b2 = Game.Battle.start('plains_field_rat');
var chanceNonBoss = Game.Battle.fleeChance(b4b2);
b4b2.monster.boss = true;
var chanceBoss = Game.Battle.fleeChance(b4b2);
assert(Math.abs((chanceNonBoss - chanceBoss) - BALANCE.FLEE_BOSS_PENALTY) < 1e-9, 'boss penalty subtracts FLEE_BOSS_PENALTY exactly: non-boss ' + chanceNonBoss + ', boss ' + chanceBoss);
Game.Battle.endBattle();

// clamps: an extreme level gap or wound bonus never exceeds FLEE_MAX, and a boss fresh fight
// against a much-higher-level monster never drops below FLEE_MIN.
var c4b3 = makeCharacter({ name: 'FleeClampTest' });
c4b3.level = 50;
setRng(fixedRng(0.99));
var b4b3 = Game.Battle.start('plains_field_rat');
b4b3.monster.hp = 1; // near-dead on top of a huge level advantage
assert(Game.Battle.fleeChance(b4b3) === BALANCE.FLEE_MAX, 'fleeChance clamps at FLEE_MAX: got ' + Game.Battle.fleeChance(b4b3));
Game.Battle.endBattle();

var c4b4 = makeCharacter({ name: 'FleeClampMinTest' });
c4b4.level = 1;
setRng(fixedRng(0.99));
var b4b4 = Game.Battle.start('estari_ruin_warden'); // boss, far above level 1
assert(Game.Battle.fleeChance(b4b4) === BALANCE.FLEE_MIN, 'fleeChance clamps at FLEE_MIN vs a fresh, far-higher-level boss: got ' + Game.Battle.fleeChance(b4b4));
// still attemptable at 0 Energy against that same boss (archived: Energy.md escape hatch).
b4b4.player.energy = 0;
setRng(fixedRng(0.01)); // 0.01 < FLEE_MIN -> succeeds
Game.Battle.flee();
assert(b4b4.phase === 'fled', 'flee remains attemptable (and can succeed) at 0 Energy even vs a boss: got phase ' + b4b4.phase);
Game.Battle.endBattle();

// =================== Test 5: win path ===================
console.log('\n=== Test 5: win rewards, skill xp cap, loot claim, over-capacity ===');
var c5 = makeCharacter({ name: 'WinTest' });
c5.level = 1;
// Set Swords skill at cap to verify no growth past cap: cap = 2*1+1 = 3; creation gave 3 already.
assert(c5.skills['Swords'].level === 3, 'sanity: Swords at creation level 3 (== cap at level 1)');
c5.strength = 40; // hit hard so the rat dies before its energy runs out
Game.Character.recalcDerived(c5);
// rng sequence: attack rolls use [dodge, doubleAttack?, ...]. Simplest: rng that returns 0.99
// for combat rolls, then 0.0 for the drop roll. We stub per-phase instead: fight with 0.99,
// then before the killing blow switch to a sequence that makes gold=min, shard=yes, drop=yes.
setRng(fixedRng(0.99));
var b5 = Game.Battle.start('plains_field_rat');
// Reduce rat to 1 hp so next attack kills, then control the reward rolls exactly:
b5.monster.hp = 1;
// attack() rolls: doubleAttack, monsterDodge, glancing, variance -> then onWin rolls: gold, shard, drop
setRng(seqRng([0.99, 0.99, 0.99, 0.5, /* gold */ 0.0, /* shard */ 0.0, /* drop */ 0.0], 0.99));
var furyBefore = c5.fury;
Game.Battle.attack();
assert(b5.phase === 'won', 'battle won');
assert(c5.monsterKills === 1, 'monsterKills incremented');
var r5 = b5.rewards;
assert(r5 && r5.xp === b5.monster.xp, 'combat XP = monster xp (' + r5.xp + '), fury 0 -> no bonus');
assert(r5.gold === b5.monster.goldMin, 'gold roll 0.0 -> goldMin (' + r5.gold + ')');
assert(r5.shards === 1, 'shard roll 0.0 < shardChance -> 1 shard');
assert(b5.pendingLoot === 'potion_minor_healing', 'drop roll 0.0 -> first drop pending (potion)');
assert(c5.fury === furyBefore + 1, 'fury +1 tick for killing an at-or-above-level monster');
// v1.4 P2 (G1): Advantage Points — a kills-only currency, awarded on every win.
assert(r5.ap === BALANCE.AP_PER_WIN(b5.monster.level), 'regular win grants BALANCE.AP_PER_WIN(monster level), got ' + r5.ap);
assert(c5.ap === r5.ap, 'character.ap credited with the AP reward');
// skill xp: Swords was at cap 3 -> addSkillXp must not raise it
assert(c5.skills['Swords'].level === 3, 'weapon skill did not exceed cap 2L+1=3');
// v1.6 P2 (PG-3, SPEC-V1.6-REBALANCE.md §6.2): skill-XP-per-use now scales with the monster's
// level (SKILL_XP_PER_MON_LEVEL) instead of a flat rate — plains_field_rat is level 1, so
// round(1*0.6)=1, still at the SKILL_XP_MIN_PER_USE floor (no decline, no Fury bonus here).
var expectedSwordsXp5 = Math.max(BALANCE.SKILL_XP_MIN_PER_USE, Math.round(b5.monster.level * BALANCE.SKILL_XP_PER_MON_LEVEL));
assert(r5.skillXp['Swords'] === expectedSwordsXp5, 'weapon skill XP scales with monster level (monster not below player), expected ' + expectedSwordsXp5 + ', got ' + r5.skillXp['Swords']);

// loot claim success
var potions = c5.inventory.filter(function (i) { return i === 'potion_minor_healing'; }).length;
var res5 = Game.Battle.claimLoot();
assert(res5.ok, 'claimLoot succeeds with capacity');
assert(c5.inventory.filter(function (i) { return i === 'potion_minor_healing'; }).length === potions + 1, 'loot added to inventory');
assert(b5.pendingLoot === null, 'pendingLoot cleared after claim');
Game.Battle.endBattle();

// over-capacity loot claim
var c5b = makeCharacter({ name: 'HeavyTest' });
c5b.strength = 40;
Game.Character.recalcDerived(c5b);
setRng(fixedRng(0.99));
var b5b = Game.Battle.start('plains_field_rat');
b5b.monster.hp = 1;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.0, 0.0, 0.0], 0.99));
Game.Battle.attack();
assert(b5b.pendingLoot === 'potion_minor_healing', 'loot pending for over-capacity test');
// v1.6 P1 (CB-6, SPEC-V1.6-REBALANCE.md §6): carryCapacity now carries a flat base term
// (BALANCE.CARRY_CAPACITY_BASE=50), so a bare strength=1 no longer forces a tiny capacity the
// way the old strength*10 formula did — force a deeply negative capacity instead so the starter
// kit alone still outweighs it (the test's intent, "starter kit alone outweighs it", unchanged).
c5b.strength = -1000;
var res5b = Game.Battle.claimLoot();
assert(res5b.ok === false && /weight/i.test(res5b.message), 'over-capacity claim fails with a message: "' + res5b.message + '"');
assert(b5b.pendingLoot === 'potion_minor_healing', 'pendingLoot remains after failed claim');
Game.Battle.endBattle();

// =================== Test 6: loss path ===================
console.log('\n=== Test 6: loss -> deaths+1, restored to 1 HP, nothing lost ===');
var c6 = makeCharacter({ name: 'LossTest' });
c6.hitPoints = 1;
var goldBefore6 = c6.gold, invBefore6 = c6.inventory.length, deathsBefore6 = c6.deaths;
c6.fury = 5;
setRng(fixedRng(0.5)); // guaranteed monster hit (no player dodge at 0.5)
var b6 = Game.Battle.start('skyspire_wisp'); // level 8, hits hard, strikes first (dex 5 < 8)
assert(b6.phase === 'lost', 'player at 1 HP dies to the first strike -> phase lost (got ' + b6.phase + ')');
assert(c6.deaths === deathsBefore6 + 1, 'deaths incremented');
assert(c6.fury === 0, 'fury reset on death');
assert(c6.gold === goldBefore6 && c6.inventory.length === invBefore6, 'nothing lost on death');
// v1.4 P2 (G1): AP is a kills-only currency — a loss grants none.
assert(c6.ap === 0, 'a loss grants no Advantage Points');
assert(c6.hitPoints === 0, 'HP is 0 while the defeat screen is showing');
Game.Battle.endBattle();
assert(c6.hitPoints === 1, 'player restored to 1 HP outside battle');
assert(Game.state.battle === null, 'battle cleared');

// =================== Test 7: 5-level cutoff ===================
console.log('\n=== Test 7: level-10 player vs level-1 monster -> zero rewards ===');
var c7 = makeCharacter({ name: 'CutoffTest' });
c7.level = 10;
c7.xp = BALANCE.XP_TO_LEVEL(10);
c7.strength = 60;
Game.Character.recalcDerived(c7);
c7.hitPoints = c7.hitPointsMax;
setRng(fixedRng(0.99));
var b7 = Game.Battle.start('plains_field_rat');
b7.monster.hp = 1;
var xpBefore7 = c7.xp, goldBefore7 = c7.gold, shardsBefore7 = c7.animaShards;
var swordsXpBefore7 = c7.skills['Swords'].xp, swordsLvBefore7 = c7.skills['Swords'].level;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.0, 0.0, 0.0], 0.99)); // even "lucky" rolls must yield nothing
Game.Battle.attack();
assert(b7.phase === 'won', 'battle won');
assert(b7.rewards.cutoff === true, 'rewards flagged as cutoff');
assert(c7.xp === xpBefore7, 'zero combat XP');
assert(c7.gold === goldBefore7 && c7.animaShards === shardsBefore7, 'zero gold/shards');
// v1.4 P2 (G1): AP is awarded on EVERY win, including a 5-level-cutoff win ("a kill is a kill") —
// XP/gold/shards/skill-XP are cut, but AP is not.
assert(b7.rewards.ap === BALANCE.AP_PER_WIN(b7.monster.level), 'cutoff win still grants BALANCE.AP_PER_WIN(monster level), got ' + b7.rewards.ap);
assert(c7.ap === b7.rewards.ap, 'character.ap credited even on a cutoff win');
assert(b7.pendingLoot === null, 'zero loot');
assert(c7.skills['Swords'].xp === swordsXpBefore7 && c7.skills['Swords'].level === swordsLvBefore7, 'zero skill XP');
assert(c7.monsterKills === 1, 'kill still counted');
Game.Battle.endBattle();

// =================== Test 7b (v1.3.1 fix 2): [revised] quest-material drops survive the cutoff ===================
console.log('\n=== Test 7b: [revised] a quest_-prefixed drop still rolls under the 5-level cutoff; a non-quest drop does not ===');
var c7g = makeCharacter({ name: 'CutoffQuestDropTest' });
c7g.level = 9; // estari_loose_rubble is level 4 -> levelDiff 5, cutoff applies
c7g.xp = BALANCE.XP_TO_LEVEL(9);
c7g.strength = 60;
Game.Character.recalcDerived(c7g);
c7g.hitPoints = c7g.hitPointsMax;
setRng(fixedRng(0.99));
var b7g = Game.Battle.start('estari_loose_rubble'); // drops: [shield_wooden_buckler 0.05, quest_animate_rubble_core 0.5]
b7g.monster.hp = 1;
var xpBefore7g = c7g.xp, goldBefore7g = c7g.gold, shardsBefore7g = c7g.animaShards;
// attack(): [dbl, dodge, glancing, variance]; cutoff's own drop loop: [shield miss, quest hit]
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.99, 0.0], 0.99));
Game.Battle.attack();
assert(b7g.phase === 'won', 'battle won');
assert(b7g.rewards.cutoff === true, 'rewards flagged as cutoff');
assert(c7g.xp === xpBefore7g, 'zero combat XP under the cutoff, unchanged by the quest-material exemption');
assert(c7g.gold === goldBefore7g && c7g.animaShards === shardsBefore7g, 'zero gold/shards under the cutoff, unchanged by the quest-material exemption');
assert(b7g.pendingLoot === 'quest_animate_rubble_core', 'v1.3.1 fix 2: a quest_-prefixed item still rolls (and can drop) under the cutoff, got pendingLoot=' + b7g.pendingLoot);
var claim7g = Game.Battle.claimLoot();
assert(claim7g.ok === true && c7g.inventory.indexOf('quest_animate_rubble_core') !== -1, 'quest material is actually claimable into inventory');
Game.Battle.endBattle();

var c7h = makeCharacter({ name: 'CutoffNonQuestDropTest' });
c7h.level = 9;
c7h.xp = BALANCE.XP_TO_LEVEL(9);
c7h.strength = 60;
Game.Character.recalcDerived(c7h);
c7h.hitPoints = c7h.hitPointsMax;
setRng(fixedRng(0.99));
var b7h = Game.Battle.start('estari_loose_rubble');
b7h.monster.hp = 1;
var xpBefore7h = c7h.xp, goldBefore7h = c7h.gold;
// cutoff's own drop loop: shield_wooden_buckler (0.05 chance) hits first -> NOT quest_-prefixed -> discarded
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.0], 0.99));
Game.Battle.attack();
assert(b7h.rewards.cutoff === true, 'rewards flagged as cutoff');
assert(c7h.xp === xpBefore7h && c7h.gold === goldBefore7h, 'zero XP/gold under the cutoff (non-quest-drop case)');
assert(b7h.pendingLoot === null, 'v1.3.1 fix 2: a non-quest_ drop that hits under the cutoff is discarded, not granted, got pendingLoot=' + b7h.pendingLoot);
Game.Battle.endBattle();

// =================== Test 7c (v1.3.1 fix 5): Fury still ticks on a kill that levels the player up ===================
console.log('\n=== Test 7c: Fury ticks for an at-or-above-level kill even when that same kill levels the player up ===');
var c7i = makeCharacter({ name: 'FuryLevelUpTest' });
c7i.level = 1;
c7i.xp = BALANCE.XP_TO_LEVEL(2) - 1; // one XP short of leveling to 2
c7i.fury = 0;
setRng(fixedRng(0.99));
var b7i = Game.Battle.start('plains_field_rat'); // level 1, same level as the player
b7i.monster.hp = 1;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.0, 0.0, 0.99], 0.99)); // attack + onWin gold/shard/drop rolls
Game.Battle.attack();
assert(b7i.phase === 'won', 'battle won');
assert(c7i.level === 2, 'sanity: the kill leveled the player up to 2 (was exactly 1 XP short of the level-2 threshold)');
assert(c7i.fury === 1, 'v1.3.1 fix 5: Fury ticks for an at-or-above-level kill judged by the PRE-kill level, even though this very kill leveled the player up (got fury=' + c7i.fury + ')');
Game.Battle.endBattle();

// =================== Test 8: skill xp scales with monster level, then declines 1-4 levels above ===================
console.log('\n=== Test 8: skill XP scales with monster level, then declines when outleveling the monster ===');
var c8 = makeCharacter({ name: 'DeclineTest' });
// v1.6 P2 (PG-3, SPEC-V1.6-REBALANCE.md §6.2): skill-XP-per-use now scales with the monster's
// level (base = round(monsterLevel*0.6)) instead of a flat rate — a level-1 monster's base is
// already at the SKILL_XP_MIN_PER_USE floor and can't demonstrate the decline any more, so this
// test now uses a level-20 regular (juneros_riptide_hunter: no behavior/poison/curse, a clean
// fixture) instead of plains_field_rat, to keep the archived decline (Recent_Updates.md
// 2007-04-21) a real, visible effect on top of the level-scaled base.
c8.level = 23; // 3 levels above the level-20 monster below -> decline factor 1 - 3/5 = 0.4
c8.xp = BALANCE.XP_TO_LEVEL(23);
c8.strength = 60;
c8.dexterity = 999; // act first regardless of the monster's effective dex (= its level, 20)
Game.Character.recalcDerived(c8);
c8.hitPoints = c8.hitPointsMax;
setRng(fixedRng(0.99));
var b8 = Game.Battle.start('juneros_riptide_hunter');
b8.monster.hp = 1;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.99, 0.99, 0.99], 0.99));
Game.Battle.attack();
var expectedPerUse = Math.max(BALANCE.SKILL_XP_MIN_PER_USE, Math.round(b8.monster.level * BALANCE.SKILL_XP_PER_MON_LEVEL * (1 - 3 / BALANCE.XP_LOOT_CUTOFF_LEVELS)));
assert(b8.rewards.skillXp['Swords'] === expectedPerUse, 'declined skill XP (level-scaled base then declined): got ' + b8.rewards.skillXp['Swords'] + ', expected ' + expectedPerUse);
Game.Battle.endBattle();

// =================== Test 9: tech gating + resistance ===================
console.log('\n=== Test 9: tech must be equipped; grade resistance applies ===');
var c9 = makeCharacter({ skills: { 'Evocation': 3 }, name: 'CasterTest' });
assert(c9.techs.indexOf('tech_firebolt_1') !== -1 && c9.techSets[0][0] === 'tech_firebolt_1', 'Evocation starter tech known+slotted');
c9.techs.push('tech_starspark_1'); // known but NOT slotted
setRng(fixedRng(0.5));
var b9 = Game.Battle.start('plains_field_rat');
var mHp9 = b9.monster.hp;
var e9 = c9.energy;
Game.Battle.useTech('tech_starspark_1');
assert(b9.monster.hp === mHp9 && c9.energy === e9, 'unequipped tech refuses to cast (no damage, no energy)');
assert(/not equipped/.test(b9.log[b9.log.length - 1]), 'log explains the tech is not equipped');

// Firebolt vs Animate Rubble (Fire: -0.25 -> takes 25% MORE fire damage)
Game.Battle.endBattle();
c9.hitPoints = c9.hitPointsMax = 500; // survive
var b9b = Game.Battle.start('estari_loose_rubble');
var tech9 = Game.Battle.getTech('tech_firebolt_1');
var effPower = Game.Battle.techEffectivePower(c9, tech9); // int factor
var fear9 = Game.Battle.fearMultiplier(b9b); // level 1 vs 4 -> 0.7
var expected9 = Math.max(1, Math.round(effPower * fear9 * 1.25 - b9b.monster.magicArmor));
var mHp9b = b9b.monster.hp;
Game.Battle.useTech('tech_firebolt_1');
var dealt9 = mHp9b - b9b.monster.hp;
assert(dealt9 === expected9, 'Fire vulnerability (-0.25) applied: dealt ' + dealt9 + ', expected ' + expected9);
assert(b9b.techsUsedThisBattle['Evocation'] === true, 'Evocation recorded for post-battle skill XP');
Game.Battle.endBattle();

// =================== Test 10: save v2 -> v3 migration ===================
console.log('\n=== Test 10: v2 save migrates to v3 (techs/techSets/fury added) ===');
var v2Character = {
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
  weaponDamageBonus: 0,
  equippedWeaponSkill: null,
  inventory: ['potion_minor_healing'],
  equipment: { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null }
  // NOTE: no techs / techSets / fury — a real Phase 2 (v2) save.
};
localStorageStore['herorpg_save'] = JSON.stringify({ version: 2, state: { character: v2Character } });
var loaded = Game.Save.load();
assert(loaded !== null, 'v2 save loads');
assert(loaded.character.name === 'OldTimer' && loaded.character.level === 3, 'character identity preserved');
assert(loaded.character.skills['Rods'].level === 2, 'skills preserved');
assert(loaded.character.inventory.length === 1, 'inventory preserved');
assert(Array.isArray(loaded.character.techs) && loaded.character.techs.length === 0, 'migration adds empty techs list');
assert(Array.isArray(loaded.character.techSets) && loaded.character.techSets.length === 3 &&
  loaded.character.techSets.every(function (s) { return s.length === 8; }), 'migration adds 3x8 techSets');
assert(loaded.character.fury === 0, 'migration adds fury=0');
Game.state = loaded;
Game.persist();
var resaved = JSON.parse(localStorageStore['herorpg_save']);
assert(resaved.version === 10, 'resave stamps current version 10 (v1.4 P2 Advantage Points migration on top), got ' + resaved.version);

// v1 chain still works end-to-end (v1 -> v2 -> v3 -> v4)
var v1c = JSON.parse(JSON.stringify(v2Character));
delete v1c.inventory; delete v1c.equipment; delete v1c.equippedWeaponSkill;
localStorageStore['herorpg_save'] = JSON.stringify({ version: 1, state: { character: v1c } });
var loaded1 = Game.Save.load();
assert(loaded1 !== null && Array.isArray(loaded1.character.inventory) && Array.isArray(loaded1.character.techSets),
  'v1 save chains through v2 to v3');

// battle excluded from persistence
Game.state = { character: makeCharacter({ name: 'PersistTest' }) };
setRng(fixedRng(0.99));
Game.Battle.start('plains_field_rat');
Game.persist();
var savedMid = JSON.parse(localStorageStore['herorpg_save']);
assert(savedMid.state.battle === undefined, 'mid-battle save does not persist the battle object');
Game.Battle.endBattle();

// =================== Test 10b: v8 -> v9 migration (Dual Wield equipment.offhand) ===================
console.log('\n=== Test 10b: v8 -> v9 migration backfills equipment.offhand; v1->v9 chain intact ===');
var v8Character = JSON.parse(JSON.stringify(v2Character));
v8Character.techs = [];
v8Character.techSets = [
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null]
];
v8Character.fury = 0;
v8Character.currentLocation = 'eldor';
v8Character.vault = { platinum: 0, gold: 0, items: [] };
v8Character.shrineBuffs = [];
v8Character.quests = {};
v8Character.classes = {};
v8Character.primaryClass = null;
v8Character.secondaryClass = null;
v8Character.legendaryUnlocked = false;
v8Character.afflictions = [];
// A real v8 save's equipment shape (pre-Dual-Wield) — the `offhand` key is entirely absent, not
// just null, exercising the actual backfill branch of the v8->v9 migration step.
v8Character.equipment = { weapon: null, head: null, body: null, legs: null, feet: null };
localStorageStore['herorpg_save'] = JSON.stringify({ version: 8, state: { character: v8Character } });
var loadedV9 = Game.Save.load();
assert(loadedV9 !== null, 'v8 save loads');
assert(loadedV9.character.equipment.offhand === null, 'v8->v9 migration backfills equipment.offhand=null');
Game.state = loadedV9;
Game.persist();
var resavedV9 = JSON.parse(localStorageStore['herorpg_save']);
assert(resavedV9.version === 10, 'resave stamps CURRENT_VERSION 10, got ' + resavedV9.version);

// v1 -> v9 full chain also ends up with equipment.offhand present (SPEC-V1.2.md Phase 1 #5).
var v1ToV9 = JSON.parse(JSON.stringify(v8Character));
delete v1ToV9.inventory; delete v1ToV9.equipment; delete v1ToV9.equippedWeaponSkill;
delete v1ToV9.techs; delete v1ToV9.techSets; delete v1ToV9.fury;
delete v1ToV9.currentLocation; delete v1ToV9.vault; delete v1ToV9.shrineBuffs;
delete v1ToV9.quests; delete v1ToV9.classes; delete v1ToV9.primaryClass; delete v1ToV9.secondaryClass; delete v1ToV9.legendaryUnlocked;
delete v1ToV9.afflictions;
localStorageStore['herorpg_save'] = JSON.stringify({ version: 1, state: { character: v1ToV9 } });
var loadedV1toV9 = Game.Save.load();
assert(loadedV1toV9 !== null && loadedV1toV9.character.equipment && loadedV1toV9.character.equipment.offhand === null,
  'v1 save chains all the way through v9 with equipment.offhand present');

// =================== Test 11: full screen renders ===================
// Phase 4 note: Explore is now area-scoped (js/data/areas.js) rather than a flat list of every
// monster in the game — travel to a hunting area first to exercise the Hunt list, matching the
// real player flow (Eldor -> Plains of Averast).
console.log('\n=== Test 11: techs / explore / battle screens render without throwing ===');
var c11 = makeCharacter({ skills: { 'Evocation': 3 }, name: 'RenderTest' });
Game.state.character = c11;
Game.state.battle = null;
Game.World.travelTo('plains_of_averast');
try {
  Game.Screens.navigate('techs');
  console.log('PASS: techs screen rendered');
} catch (e) { failures++; console.error('FAIL: techs screen threw: ' + e.stack); }
try {
  Game.Screens.navigate('explore');
  console.log('PASS: explore screen rendered');
} catch (e) { failures++; console.error('FAIL: explore screen threw: ' + e.stack); }

// Explore shows a single Hunt button (Phase 8: random encounter replaces the old per-monster
// pick list — regular monsters are only reachable through Hunt now).
var huntButtons = document.getElementById('maincontent').queryAllByTag('button')
  .filter(function (b) { return b.textContent === 'Hunt'; });
assert(huntButtons.length === 1, 'explore shows a single Hunt button (' + huntButtons.length + ')');

// Click Hunt -> guarantee an encounter (roll under the 95% threshold) and a deterministic
// monster pick (first entry in the area's pool) -> battle starts and battle screen renders.
setRng(seqRng([0.0, 0.0], 0.99));
try {
  huntButtons[0].click();
  console.log('PASS: Hunt click started a battle and rendered the battle screen');
} catch (e) { failures++; console.error('FAIL: battle screen threw: ' + e.stack); }
assert(Game.state.battle !== null && Game.state.battle.phase === 'active', 'battle active after Hunt click');
assert(Game.Screens.getCurrentScreen() === 'battle', 'router is on the battle screen');

// battle lock: navigating away is refused while battle exists
Game.Screens.navigate('inventory');
assert(Game.Screens.getCurrentScreen() === 'battle', 'navigation locked to battle screen during battle');

// cast the slotted starter tech via the tech-slot click
var slots = document.getElementById('maincontent').queryAllByClass('tech-slot');
assert(slots.length === 8, '8 tech slots rendered in battle (got ' + slots.length + ')');
var mHp11 = Game.state.battle.monster.hp;
setRng(fixedRng(0.5));
slots[0].click();
assert(Game.state.battle.monster.hp < mHp11 || Game.state.battle.phase !== 'active', 'clicking a filled tech slot cast the tech');

// battle log panel exists and has lines
var logPanels = document.getElementById('maincontent').queryAllByClass('battle-log');
assert(logPanels.length === 1 && logPanels[0].children.length > 0, 'battle log panel rendered with entries');

// Fear bar only when feared: rat is level 1 vs player 1 -> no fear bar
var fearBars = [];
document.getElementById('maincontent').queryAllByClass('statbar-fill').forEach(function (n) {
  if ((n.className || '').indexOf('fear') !== -1) fearBars.push(n);
});
assert(fearBars.length === 0, 'no Fear bar vs same-level monster');
// force-fear: start a fight vs a higher-level monster
Game.Battle.endBattle();
Game.Screens.navigate('explore');
setRng(fixedRng(0.99));
Game._debug.fight('estari_ruin_warden'); // level 10 boss vs level 1 player
fearBars = [];
document.getElementById('maincontent').queryAllByClass('statbar-fill').forEach(function (n) {
  if ((n.className || '').indexOf('fear') !== -1) fearBars.push(n);
});
assert(fearBars.length === 1, 'yellow Fear bar rendered vs higher-level monster');
Game.Battle.flee();
Game.Battle.endBattle();

// Techs screen: select + assign to a slot, then remove
Game.Screens.navigate('techs');
var techRows = document.getElementById('maincontent').queryAllByClass('tech-row');
assert(techRows.length === 1, 'known tech listed on Techs screen');
techRows[0].click(); // select
var techSlots = document.getElementById('maincontent').queryAllByClass('tech-slot');
techSlots[3].click(); // assign to set 1 slot 4
assert(c11.techSets[0][3] === 'tech_firebolt_1', 'click-to-assign placed the tech in slot 4');
techSlots = document.getElementById('maincontent').queryAllByClass('tech-slot');
techSlots[3].click(); // click filled slot without selection -> remove
assert(c11.techSets[0][3] === null, 'click-to-remove cleared the slot');

// Tech infobox (double-click info)
try {
  Game.Infobox.openTech(Game.Battle.getTech('tech_firebolt_1'), c11);
  Game.Infobox.close();
  console.log('PASS: tech infobox open/close did not throw');
} catch (e) { failures++; console.error('FAIL: tech infobox threw: ' + e.stack); }

// =================== Test 12: debug helpers ===================
console.log('\n=== Test 12: debug fight/learnTech/restoreAll ===');
var c12 = makeCharacter({ name: 'DebugTest' });
Game.state.character = c12;
Game._debug.learnTech('tech_focus_1');
assert(c12.techs.indexOf('tech_focus_1') !== -1, 'learnTech adds the tech');
Game._debug.learnTech('mon_dark_hex');
assert(c12.techs.indexOf('mon_dark_hex') === -1, 'learnTech refuses monster-only techs');
c12.hitPoints = 3; c12.energy = 2;
Game._debug.restoreAll();
assert(c12.hitPoints === c12.hitPointsMax && c12.energy === c12.energyMax, 'restoreAll refills HP and Energy');
setRng(fixedRng(0.99));
Game._debug.fight('plains_wild_boar');
assert(Game.state.battle && Game.state.battle.monster.id === 'plains_wild_boar', 'debug fight starts the named battle');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 13: poison status ===================
console.log('\n=== Test 13: poison applies and ticks ===');
var c13 = makeCharacter({ name: 'PoisonTest' });
c13.hitPoints = c13.hitPointsMax = 500;
c13.endurance = 0; // ensure hits land visibly
// Force the swarm to use its poison tech and land poison:
// monsterAct rolls: techPick(<0.5), techIndex, playerDodge(>=dodge), glancing(>=0.1 to skip), variance, poison(<0.35)
setRng(fixedRng(0.99));
var b13 = Game.Battle.start('plains_vermin_swarm');
setRng(seqRng([
  0.99, 0.99, 0.99, 0.5, // player attack: doubleAtk, monDodge, glancing, variance
  0.3, 0.0,              // monster: tech pick (0.3<0.5), tech index 0 -> gnawing bite
  0.99, 0.99, 0.5,       // player dodge fail, glancing no, variance
  0.1                    // poison roll 0.1 < 0.35 -> poisoned
], 0.99));
Game.Battle.attack();
assert(b13.playerStatuses.some(function (s) { return s.type === 'poison'; }), 'poison status applied by Gnawing Bite');
var hp13 = c13.hitPoints;
setRng(fixedRng(0.99));
Game.Battle.attack(); // next round: poison ticks
var poisonLines = b13.log.filter(function (l) { return /Poison sears/.test(l); });
assert(poisonLines.length >= 1, 'poison ticked for damage (' + poisonLines.length + ' tick lines)');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 14: weapon techniques (Feature C) ===================
console.log('\n=== Test 14: weapon techniques — damage from weapon, armorPierce, Flurry double-hit, energy costs ===');

// Cleave I: damage derives from Game.Character.getDamage (physical), not the Intelligence spell
// factor; no armorPierce, so the monster's full Armor mitigates.
var c14w = makeCharacter({ name: 'WeaponTechTest' }); // default skills: Swords 3 -> starter Cleave I known+slotted
assert(c14w.techs.indexOf('tech_cleave_1') !== -1, 'sanity: Cleave I known via starter grant');
setRng(fixedRng(0.5)); // variance factor exactly 1.0, no dodge/glancing (both thresholds < 0.5)
var b14w = Game.Battle.start('plains_field_rat');
var cleave1 = Game.Battle.getTech('tech_cleave_1');
var weaponDmg14 = Game.Character.getDamage(c14w);
var expectedCleave = Math.max(1, Math.round(weaponDmg14 * cleave1.powerMult - b14w.monster.armor));
var mHpBefore14 = b14w.monster.hp;
var energyBefore14 = c14w.energy;
Game.Battle.useTech('tech_cleave_1');
var dealt14 = mHpBefore14 - b14w.monster.hp;
assert(dealt14 === expectedCleave, 'Cleave I damage = round(getDamage()*powerMult - armor): dealt ' + dealt14 + ', expected ' + expectedCleave);
assert(energyBefore14 - c14w.energy === cleave1.energyCost, 'Cleave I costs exactly its listed energyCost (' + cleave1.energyCost + ')');
Game.Battle.endBattle();

// Impale I: armorPierce (0.35) reduces the armor term before it's subtracted. Use a monster with
// nonzero armor (majiku_forest_scout, armor 6) so the pierce is visible; level 1 player vs level 6
// monster also feeds Fear into the same formula (fear affects weaponTech damage too — already-
// implemented pipeline, not something this batch changes).
var c14p = makeCharacter({ skills: { 'Polearms': 3 }, name: 'ImpaleTest' });
assert(c14p.techs.indexOf('tech_impale_1') !== -1, 'sanity: Impale I known via starter grant');
c14p.hitPoints = c14p.hitPointsMax = 500; // survive the level-6 monster's first strike
setRng(fixedRng(0.5));
var b14p = Game.Battle.start('majiku_forest_scout');
var impale1 = Game.Battle.getTech('tech_impale_1');
var weaponDmg14p = Game.Character.getDamage(c14p);
var fear14p = Game.Battle.fearMultiplier(b14p);
var expectedImpale = Math.max(1, Math.round(weaponDmg14p * impale1.powerMult * fear14p - b14p.monster.armor * (1 - impale1.armorPierce)));
var mHpBefore14p = b14p.monster.hp;
Game.Battle.useTech('tech_impale_1');
var dealt14p = mHpBefore14p - b14p.monster.hp;
assert(dealt14p === expectedImpale, 'Impale I armorPierce (0.35) reduces the armor term: dealt ' + dealt14p + ', expected ' + expectedImpale);
Game.Battle.endBattle();

// Vital Strike I: armorPierce 0.5, energy cost 10.
var c14v = makeCharacter({ skills: { 'Knives': 3 }, name: 'VitalStrikeTest' });
assert(c14v.techs.indexOf('tech_vital_strike_1') !== -1, 'sanity: Vital Strike I known via starter grant');
setRng(fixedRng(0.5));
var b14v = Game.Battle.start('plains_field_rat');
var vital1 = Game.Battle.getTech('tech_vital_strike_1');
var weaponDmg14v = Game.Character.getDamage(c14v);
var expectedVital = Math.max(1, Math.round(weaponDmg14v * vital1.powerMult - b14v.monster.armor * (1 - vital1.armorPierce)));
var mHpBefore14v = b14v.monster.hp;
var energyBefore14v = c14v.energy;
Game.Battle.useTech('tech_vital_strike_1');
var dealt14v = mHpBefore14v - b14v.monster.hp;
assert(dealt14v === expectedVital, 'Vital Strike I armorPierce (0.5) math: dealt ' + dealt14v + ', expected ' + expectedVital);
assert(energyBefore14v - c14v.energy === vital1.energyCost, 'Vital Strike I costs exactly its listed energyCost (' + vital1.energyCost + ')');
Game.Battle.endBattle();

// Flurry I: hits:2 resolves as two successive strikes, each independently mitigated.
var c14f = makeCharacter({ skills: { 'Hand to Hand': 3 }, name: 'FlurryTest' });
assert(c14f.techs.indexOf('tech_flurry_1') !== -1, 'sanity: Flurry I known via starter grant');
setRng(fixedRng(0.5));
var b14f = Game.Battle.start('plains_field_rat');
var flurry1 = Game.Battle.getTech('tech_flurry_1');
assert(flurry1.hits === 2, 'sanity: Flurry I is a 2-hit tech');
var weaponDmg14f = Game.Character.getDamage(c14f);
var perHitExpected14f = Math.max(1, Math.round(weaponDmg14f * flurry1.powerMult - b14f.monster.armor));
var mHpBefore14f = b14f.monster.hp;
var energyBefore14f = c14f.energy;
Game.Battle.useTech('tech_flurry_1');
var dealt14f = mHpBefore14f - b14f.monster.hp;
assert(dealt14f === perHitExpected14f * 2, 'Flurry I deals 2 independently-mitigated hits: dealt ' + dealt14f + ', expected ' + (perHitExpected14f * 2));
assert(energyBefore14f - c14f.energy === flurry1.energyCost, 'Flurry I costs exactly its listed energyCost (' + flurry1.energyCost + ')');
Game.Battle.endBattle();

// =================== Test 14b: balance contract (Feature C spec) — every weapon tech beats
// Attack on damage-per-TURN but loses on damage-per-ENERGY (Attack costs 5 energy) ===================
// Checked at a representative mid-game level (10), matching the balance sim reported to the lead
// (scratchpad balance_sim_weapon_techs.js) — a level-1-vs-level-6-monster-armor comparison would
// be a false negative here: at level 1 a plain Attack's damage is nearly fully canceled by that
// monster's armor (floored at the Math.max(1,...) minimum), making Attack's own damage-per-energy
// look artificially tiny rather than reflecting the intended mid-game balance.
console.log('\n=== Test 14b: balance contract — weapon techs beat Attack on DPT, lose on DPE (representative level 10) ===');
var BAL_LEVEL = 10;
var balChars = {};
['Swords', 'Polearms', 'Knives', 'Hand to Hand'].forEach(function (skillName) {
  var c = makeCharacter({ skills: (function () { var sp = {}; sp[skillName] = 3; return sp; })(), name: 'Bal' + skillName.replace(/\s/g, '') });
  c.level = BAL_LEVEL;
  var statName = (skillName === 'Knives') ? 'dexterity' : 'strength';
  c[statName] = 5 + (BAL_LEVEL - 1) * 3; // representative mid-game stat spread, matches the scratchpad sim
  Game.Character.recalcDerived(c);
  balChars[skillName] = c;
});
var balMonster = Game.Battle.getMonsterDef('majiku_forest_scout'); // level 6 regular, armor 6 — below the level-10 reference build, matching the sim
Game.Data.techs.filter(function (t) { return t.weaponTech; }).forEach(function (tech) {
  var c = balChars[tech.skill];
  var weaponDamage = Game.Character.getDamage(c);
  var armorTerm = balMonster.armor * (1 - (tech.armorPierce || 0));
  var perHit = Math.max(1, Math.round(weaponDamage * tech.powerMult - armorTerm));
  var techDpt = perHit * (tech.hits || 1);
  var techDpe = techDpt / tech.energyCost;
  var attackPerHit = Math.max(1, Math.round(weaponDamage - balMonster.armor));
  var attackDpe = attackPerHit / BALANCE.ATTACK_ENERGY_COST;
  assert(techDpt > attackPerHit, tech.name + ': damage/turn (' + techDpt + ') beats a plain Attack (' + attackPerHit + ')');
  assert(techDpe < attackDpe, tech.name + ': damage/energy (' + techDpe.toFixed(2) + ') loses to a plain Attack (' + attackDpe.toFixed(2) + ')');
});

// =================== Test 15: Defend (Feature C) ===================
console.log('\n=== Test 15: Defend halves the monster\'s next hit, costs 2 Energy, poison unaffected ===');

function monsterCounterDamage(useDefend) {
  var c = makeCharacter({ name: useDefend ? 'DefendYes' : 'DefendNo' });
  c.endurance = 0; // minimize mitigation noise so the halving is unambiguous
  Game.Character.recalcDerived(c);
  setRng(fixedRng(0.99)); // no monster tech pick, no player dodge, no glancing; identical, deterministic variance factor for both runs
  var b = Game.Battle.start('plains_field_rat');
  var hpBefore = c.hitPoints;
  if (useDefend) {
    Game.Battle.defend();
  } else {
    Game.Battle.attack(); // deals damage to the monster too, but we only compare the resulting counter-hit on the player
  }
  var dmgTaken = hpBefore - c.hitPoints;
  Game.Battle.endBattle();
  return dmgTaken;
}
var dmgNoDefend = monsterCounterDamage(false);
var dmgWithDefend = monsterCounterDamage(true);
assert(dmgWithDefend === Math.max(1, Math.round(dmgNoDefend * BALANCE.DEFEND_DAMAGE_MULT)),
  "Defend halves the monster's next hit: no-defend " + dmgNoDefend + ', with-defend ' + dmgWithDefend);

var c15e = makeCharacter({ name: 'DefendEnergyTest' });
setRng(fixedRng(0.99));
var b15e = Game.Battle.start('plains_field_rat');
var energyBefore15e = c15e.energy;
Game.Battle.defend();
assert(energyBefore15e - c15e.energy === BALANCE.DEFEND_ENERGY_COST, 'Defend costs exactly DEFEND_ENERGY_COST (' + BALANCE.DEFEND_ENERGY_COST + ') energy');
Game.Battle.endBattle();

// Poison ticks unaffected by Defend (tickPlayerStatuses is untouched by the playerDefending flag).
var c15p = makeCharacter({ name: 'DefendPoisonTest' });
c15p.hitPoints = c15p.hitPointsMax = 500;
setRng(fixedRng(0.99));
var b15p = Game.Battle.start('plains_field_rat');
b15p.playerStatuses.push({ type: 'poison', name: 'Poison', turnsLeft: 3 });
Game.Battle.defend();
var poisonLine15p = b15p.log.filter(function (l) { return /Poison sears/.test(l); });
assert(poisonLine15p.length === 1, 'poison ticked once during a Defend round');
var poisonDmgMatch15p = poisonLine15p[0] && poisonLine15p[0].match(/for (\d+) damage/);
assert(!!poisonDmgMatch15p && parseInt(poisonDmgMatch15p[1], 10) === BALANCE.POISON_DAMAGE_PER_TURN,
  'poison damage is the full, unhalved BALANCE.POISON_DAMAGE_PER_TURN while Defending: got ' + (poisonDmgMatch15p && poisonDmgMatch15p[1]));
Game.Battle.endBattle();

// =================== Test 16: death penalties (Feature B) ===================
console.log('\n=== Test 16: death penalties — gold loss, both mishaps, item-loss exclusions, empty-pool no-fallback ===');

// (a) Gold loss: ceil(10% of CARRIED gold), vault untouched; high mishap roll -> no mishap.
var c16a = makeCharacter({ name: 'DeathGoldTest' });
Game.Character.addGold(c16a, 137);
c16a.vault.gold = 40; // stashed — must stay untouched by the death
c16a.hitPoints = 1;
var carriedBefore16a = Game.Character.goldTotalAsGold(c16a);
setRng(fixedRng(0.99)); // guaranteed hit (kills at 1 HP); mishap roll 0.99 >= DEATH_MISHAP_CHANCE -> no mishap
var b16a = Game.Battle.start('skyspire_wisp'); // level 8, strikes first, hits hard
assert(b16a.phase === 'lost', 'sanity: dies to the boss\'s first strike');
var expectedGoldLost16a = Math.ceil(carriedBefore16a * BALANCE.DEATH_GOLD_FRACTION);
assert(Game.Character.goldTotalAsGold(c16a) === carriedBefore16a - expectedGoldLost16a,
  'death loses ceil(10% of carried gold): lost ' + (carriedBefore16a - Game.Character.goldTotalAsGold(c16a)) + ', expected ' + expectedGoldLost16a);
assert(c16a.vault.gold === 40, 'vault gold untouched by death');
assert(!Game.Character.hasAffliction(c16a, 'haunting'), 'no mishap on a high roll (>= DEATH_MISHAP_CHANCE)');
Game.Battle.endBattle();

// (b) Haunting mishap: 4 rng calls resolve the boss's lethal first strike (tech-pick/dodge/
// glancing/variance, all miss/skip at 0.99), then the mishap roll hits (0.0 < 0.12) and the
// 50/50 type roll picks Haunting (0.0 < 0.5).
var c16b = makeCharacter({ name: 'DeathHauntTest' });
c16b.hitPoints = 1;
assert(!Game.Character.hasAffliction(c16b, 'haunting'), 'sanity: not haunted before death');
setRng(seqRng([0.99, 0.99, 0.99, 0.99, 0.0, 0.0], 0.99));
var b16b = Game.Battle.start('skyspire_wisp');
assert(b16b.phase === 'lost', 'sanity: dies to the first strike');
assert(Game.Character.hasAffliction(c16b, 'haunting'), 'Haunting mishap applied the affliction');
assert(/Haunted/.test(b16b.log.join(' ')), 'defeat log states the Haunting mishap');
Game.Battle.endBattle();

// (c) Item-loss mishap with exclusions: tags 'unique'/'lore' and ids prefixed 'quest_' all survive;
// exactly one eligible (untagged) item is lost, chosen uniformly at random from the eligible pool.
var c16c = makeCharacter({ name: 'DeathItemLossTest' });
c16c.hitPoints = 1;
Game.Inventory.addItem(c16c, 'knife_vermin_kings_fang'); // tag 'unique'
Game.Inventory.addItem(c16c, 'lore_eidas_final_journal'); // tag 'lore'
Game.Inventory.addItem(c16c, 'quest_majiku_venom_gland'); // id prefix quest_
Game.Inventory.addItem(c16c, 'potion_minor_healing'); // eligible (starter kit already carries 2 + this = 3)
var potionsBefore16c = c16c.inventory.filter(function (i) { return i === 'potion_minor_healing'; }).length;
var invLenBefore16c = c16c.inventory.length;
setRng(seqRng([0.99, 0.99, 0.99, 0.99, 0.0, 0.99, 0.0], 0.99)); // 4 pre-death rolls, mishap hit, type roll -> item-loss (>= 0.5), pool-pick index 0
var b16c = Game.Battle.start('skyspire_wisp');
assert(b16c.phase === 'lost', 'sanity: dies to the first strike');
assert(c16c.inventory.indexOf('knife_vermin_kings_fang') !== -1, 'unique-tagged item survives the item-loss mishap');
assert(c16c.inventory.indexOf('lore_eidas_final_journal') !== -1, 'lore-tagged item survives the item-loss mishap');
assert(c16c.inventory.indexOf('quest_majiku_venom_gland') !== -1, 'quest_-prefixed item survives the item-loss mishap');
assert(c16c.inventory.length === invLenBefore16c - 1, 'exactly one eligible item was lost');
assert(c16c.inventory.filter(function (i) { return i === 'potion_minor_healing'; }).length === potionsBefore16c - 1,
  'the lost item came from the eligible (untagged, non-quest_) pool');
assert(/lose your/.test(b16c.log.join(' ')), 'defeat log states exactly what was lost');
Game.Battle.endBattle();

// (d) Empty eligible pool -> NO mishap at all (does NOT fall back to Haunting).
var c16d = makeCharacter({ name: 'DeathEmptyPoolTest' });
c16d.hitPoints = 1;
c16d.inventory = []; // wipe the starter kit's carried potions/tent — equipped gear is unaffected (lives in c.equipment)
Game.Inventory.addItem(c16d, 'quest_majiku_venom_gland'); // only an excluded item remains
setRng(seqRng([0.99, 0.99, 0.99, 0.99, 0.0, 0.99], 0.99)); // mishap hits, type roll picks item-loss, but the pool is empty
var b16d = Game.Battle.start('skyspire_wisp');
assert(b16d.phase === 'lost', 'sanity: dies to the first strike');
assert(!Game.Character.hasAffliction(c16d, 'haunting'), 'empty item-loss pool does NOT fall back to Haunting');
assert(c16d.inventory.length === 1 && c16d.inventory[0] === 'quest_majiku_venom_gland', 'the only (excluded) item survives; nothing was lost');
Game.Battle.endBattle();

// =================== Test 17: Haunting halves potion/tech healing in battle (Feature B) ===================
console.log('\n=== Test 17: Haunting halves potion and tech healing (battle-side; camp/inn covered in test_p4_world.js) ===');
// Note (mirrors Test 3's Fear/healing pattern above): the monster's counter-attack also lands
// after the heal within the same useTech()/useItem() call (finishRound), so the healed amount is
// read from the battle log rather than the net HP delta.
var c17 = makeCharacter({ skills: { 'Abjuration': 3 }, name: 'HauntedHealTest' });
Game.Character.addAffliction(c17, 'haunting');
c17.hitPoints = c17.hitPointsMax; // full HP so the monster's counter can't obscure the heal via a HP-cap clamp
setRng(fixedRng(0.5));
var b17 = Game.Battle.start('plains_field_rat');
var healTech17 = Game.Battle.getTech('tech_mend_wounds_1');
var rawHeal17 = Game.Battle.techEffectivePower(c17, healTech17);
var expectedHalvedHeal17 = Math.max(1, Math.round(rawHeal17 * BALANCE.HAUNTING_HEAL_MULT));
Game.Battle.useTech('tech_mend_wounds_1');
var healLine17 = b17.log.filter(function (l) { return l.indexOf('Mend Wounds') !== -1 && l.indexOf('recover') !== -1; }).pop();
assert(!!healLine17, 'heal log line present: ' + healLine17);
var healed17 = healLine17 ? parseInt(healLine17.match(/recover (\d+) HP/)[1], 10) : -1;
assert(healed17 === expectedHalvedHeal17, 'Haunting halves tech healing: healed ' + healed17 + ', expected ' + expectedHalvedHeal17);
Game.Battle.endBattle();

var c17b = makeCharacter({ name: 'HauntedPotionTest' });
Game.Character.addAffliction(c17b, 'haunting');
c17b.hitPoints = c17b.hitPointsMax; // full HP, same reasoning as above
setRng(fixedRng(0.5));
var b17b = Game.Battle.start('plains_field_rat');
var potionItem17b = Game.Inventory.getItem('potion_minor_healing');
var expectedHalvedPotion17b = Math.max(1, Math.round(potionItem17b.heal * BALANCE.HAUNTING_HEAL_MULT));
Game.Battle.useItem('potion_minor_healing');
var potionLine17b = b17b.log.filter(function (l) { return l.indexOf(potionItem17b.name) !== -1 && l.indexOf('recover') !== -1; }).pop();
assert(!!potionLine17b, 'potion heal log line present: ' + potionLine17b);
var healed17b = potionLine17b ? parseInt(potionLine17b.match(/recover (\d+) HP/)[1], 10) : -1;
assert(healed17b === expectedHalvedPotion17b, 'Haunting halves potion healing: healed ' + healed17b + ', expected ' + expectedHalvedPotion17b);
Game.Battle.endBattle();

// =================== Test 18: weapon skill -> damage bonus (v1.2 Phase 1 #1) ===================
console.log('\n=== Test 18: weapon skill -> damage bonus, capped (v1.2 Phase 1 #1) ===');
var c18 = makeCharacter({ name: 'WeaponSkillDmgTest' }); // default: Swords 3
var base18 = Math.round(c18.strength / BALANCE.STRENGTH_DAMAGE_RATIO) + (c18.weaponDamageBonus || 0);
var mult18 = 1 + Math.min(BALANCE.WEAPON_SKILL_DAMAGE_PER_LEVEL * c18.skills['Swords'].level, BALANCE.WEAPON_SKILL_DAMAGE_CAP);
assert(Game.Character.getDamage(c18) === Math.round(base18 * mult18),
  'getDamage includes the weapon-skill multiplier at Swords level ' + c18.skills['Swords'].level + ': got ' + Game.Character.getDamage(c18) + ', expected ' + Math.round(base18 * mult18));

c18.skills['Swords'].level = 0;
assert(Game.Character.getDamage(c18) === base18, 'zero weapon skill -> no damage bonus (multiplier 1)');

c18.skills['Swords'].level = 999;
assert(Game.Character.getDamage(c18) === Math.round(base18 * (1 + BALANCE.WEAPON_SKILL_DAMAGE_CAP)),
  'weapon-skill damage multiplier clamps at WEAPON_SKILL_DAMAGE_CAP');

// A Rod only benefits when meleed with (getDamage), not via spell damage (techEffectivePower uses
// Intelligence, not this term) — sanity-check the multiplier is keyed off c.equippedWeaponSkill.
var c18b = makeCharacter({ skills: { 'Rods': 10 }, name: 'RodSkillDmgTest' });
assert(c18b.equippedWeaponSkill === 'Rods', 'sanity: Rods creation build auto-equips a Rod');
var base18b = Math.round(c18b.intelligence / BALANCE.STRENGTH_DAMAGE_RATIO) + (c18b.weaponDamageBonus || 0);
var mult18b = 1 + Math.min(BALANCE.WEAPON_SKILL_DAMAGE_PER_LEVEL * 10, BALANCE.WEAPON_SKILL_DAMAGE_CAP);
assert(Game.Character.getDamage(c18b) === Math.round(base18b * mult18b), 'Rods skill scales melee getDamage() when a Rod is the equipped weapon');

// =================== Test 19: armor skill -> per-piece armor/magicArmor (v1.2 Phase 1 #2) ===================
console.log('\n=== Test 19: armor skill -> per-piece armor scaling, capped (v1.2 Phase 1 #2) ===');
var c19 = makeCharacter({ skills: { 'Light Armor': 5 }, name: 'ArmorSkillTest' });
var tunic19 = Game.Inventory.getItem('light_body_traveler_tunic'); // starter-kit body armor, Light Armor skill
var mult19 = 1 + Math.min(BALANCE.ARMOR_SKILL_ARMOR_PER_LEVEL * 5, BALANCE.ARMOR_SKILL_ARMOR_CAP);
assert(Game.Inventory.equippedArmorTotal(c19) === Math.round(tunic19.armor * mult19),
  'equippedArmorTotal scales body armor by Light Armor skill level 5: got ' + Game.Inventory.equippedArmorTotal(c19) + ', expected ' + Math.round(tunic19.armor * mult19));

c19.skills['Light Armor'].level = 999;
assert(Game.Inventory.equippedArmorTotal(c19) === Math.round(tunic19.armor * (1 + BALANCE.ARMOR_SKILL_ARMOR_CAP)),
  'armor-skill multiplier clamps at ARMOR_SKILL_ARMOR_CAP');

c19.skills['Light Armor'].level = 0;
assert(Game.Inventory.equippedArmorTotal(c19) === tunic19.armor, 'zero armor skill -> no bonus (multiplier 1)');

// Shields skill governs the offhand Shield slot specifically.
var c19b = makeCharacter({ skills: { 'Shields': 4 }, name: 'ShieldSkillTest' });
Game.Inventory.addItem(c19b, 'shield_wooden_buckler');
var eqShield19b = Game.Inventory.equip(c19b, 'shield_wooden_buckler');
assert(eqShield19b.ok, 'equip shield succeeds: ' + eqShield19b.failures.join(';'));
var shield19b = Game.Inventory.getItem('shield_wooden_buckler');
var multShield19b = 1 + Math.min(BALANCE.ARMOR_SKILL_ARMOR_PER_LEVEL * 4, BALANCE.ARMOR_SKILL_ARMOR_CAP);
var expectedTotal19b = tunic19.armor + Math.round(shield19b.armor * multShield19b); // Light Armor skill is 0 here
assert(Game.Inventory.equippedArmorTotal(c19b) === expectedTotal19b,
  'Shields skill scales the offhand shield piece independently: got ' + Game.Inventory.equippedArmorTotal(c19b) + ', expected ' + expectedTotal19b);

// =================== Test 20: armor-skill scaling excludes a weapon's own hybrid Magic Armor ===================
console.log('\n=== Test 20: armor-skill scaling applies to armor pieces, not a weapon\'s hybrid Magic Armor stat ===');
var c20 = makeCharacter({ skills: { 'Heavy Armor': 6, 'Rods': 6 }, name: 'HybridMagicArmorTest' });
c20.level = 15; c20.strength = 28; c20.intelligence = 22;
Game.Inventory.addItem(c20, 'heavy_body_stoneback_warplate');
var eqBody20 = Game.Inventory.equip(c20, 'heavy_body_stoneback_warplate');
assert(eqBody20.ok, 'equip heavy body armor succeeds: ' + eqBody20.failures.join(';'));
Game.Inventory.addItem(c20, 'rod_tideglass_conduit');
var eqRod20 = Game.Inventory.equip(c20, 'rod_tideglass_conduit');
assert(eqRod20.ok, 'equip hybrid rod succeeds: ' + eqRod20.failures.join(';'));

var bodyItem20 = Game.Inventory.getItem('heavy_body_stoneback_warplate');
var rodItem20 = Game.Inventory.getItem('rod_tideglass_conduit');
var heavyMult20 = 1 + Math.min(BALANCE.ARMOR_SKILL_ARMOR_PER_LEVEL * 6, BALANCE.ARMOR_SKILL_ARMOR_CAP);
var expectedMagicArmor20 = Math.round(bodyItem20.magicArmor * heavyMult20) + rodItem20.magicArmor;
assert(Game.Inventory.equippedMagicArmorTotal(c20) === expectedMagicArmor20,
  'equippedMagicArmorTotal scales the Heavy Armor piece but leaves the Rod\'s hybrid Magic Armor stat unscaled: got ' +
  Game.Inventory.equippedMagicArmorTotal(c20) + ', expected ' + expectedMagicArmor20);

// =================== Test 21: Dodge/Double Attack skill XP at proc site, capped at 2L+1 ===================
console.log('\n=== Test 21: Dodge/Double Attack skill XP granted at proc site, capped at 2L+1 (v1.2 Phase 1 #3) ===');
var c21 = makeCharacter({ name: 'DodgeDoubleAttackXpTest' });
c21.dexterity = 200; // saturates both Dodge and Double Attack chances to their caps
setRng(fixedRng(0.01)); // well under both capped chances -> both procs fire
var b21 = Game.Battle.start('plains_field_rat');
Game.Battle.attack();
assert(c21.skills['Dodge'].xp === BALANCE.DODGE_SKILL_XP_PER_PROC, 'Dodge skill gained exactly DODGE_SKILL_XP_PER_PROC XP from a successful dodge: got ' + c21.skills['Dodge'].xp);
assert(c21.skills['Double Attack'].xp === BALANCE.DOUBLE_ATTACK_SKILL_XP_PER_PROC, 'Double Attack skill gained exactly DOUBLE_ATTACK_SKILL_XP_PER_PROC XP from a proc: got ' + c21.skills['Double Attack'].xp);
Game.Battle.flee();
Game.Battle.endBattle();

var c21b = makeCharacter({ name: 'DodgeDoubleAttackCapTest' });
c21b.dexterity = 200;
var cap21b = Game.Character.skillCap(c21b);
c21b.skills['Dodge'].level = cap21b;
c21b.skills['Double Attack'].level = cap21b;
setRng(fixedRng(0.01));
Game.Battle.start('plains_field_rat');
Game.Battle.attack();
assert(c21b.skills['Dodge'].level === cap21b && c21b.skills['Dodge'].xp === 0, 'Dodge XP/level does not exceed the 2L+1 cap');
assert(c21b.skills['Double Attack'].level === cap21b && c21b.skills['Double Attack'].xp === 0, 'Double Attack XP/level does not exceed the 2L+1 cap');
Game.Battle.flee();
Game.Battle.endBattle();

// =================== Test 22: Thievery — bonus gold, steal roll, XP on win (v1.2 Phase 1 #4) ===================
console.log('\n=== Test 22: Thievery — bonus gold, steal roll (hit and miss), XP on win (v1.2 Phase 1 #4) ===');

function setupThieveryWin(thieveryLevel, name) {
  var c = makeCharacter({ name: name });
  c.level = 6;
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax = 500;
  c.skills['Thievery'].level = thieveryLevel;
  setRng(fixedRng(0.99));
  var b = Game.Battle.start('majiku_forest_scout'); // level 6, matches player level -> no cutoff
  b.monster.hp = 1; // next hit kills
  b.monster.goldMin = b.monster.goldMax = 40; // deterministic gold regardless of the gold-roll rng
  b.monster.drops = [{ itemId: 'potion_minor_healing', chance: 0.1 }]; // single deterministic drop entry
  return { c: c, b: b };
}

// (a) steal roll HITS: bonus gold + a distinct stolen item; main loot roll misses.
var setup22a = setupThieveryWin(12, 'ThieveryHitTest'); // goldPct=min(0.12,0.25)=0.12; stealChance=min(0.18,0.30)=0.18
setRng(seqRng([
  0.99, 0.99, 0.99, 0.5, // player attack: doubleAttack(false), monsterDodge(false), glancing(false), variance(neutral)
  0.5,  // onWin gold roll (irrelevant: goldMin===goldMax)
  0.99, // shard roll -> miss
  0.99, // main loot roll (chance 0.1) -> miss
  0.05, // Thievery steal-chance roll (0.05 < 0.18) -> hit
  0.01  // steal drop-table roll (0.01 < 0.1) -> hits the potion
], 0.99));
Game.Battle.attack();
var r22a = setup22a.b.rewards;
assert(r22a.thieveryGold === Math.floor(40 * 0.12), 'Thievery bonus gold = floor(gold * min(THIEVERY_GOLD_PER_LEVEL*lvl, cap)): got ' + r22a.thieveryGold);
assert(setup22a.b.pendingLoot === null, 'sanity: main loot roll missed');
assert(setup22a.b.pendingStolenLoot === 'potion_minor_healing' && r22a.stolenLoot === 'potion_minor_healing', 'Thievery steal roll hit -> extra pending loot');
assert(setup22a.b.log.some(function (l) { return /lift an extra/.test(l); }), 'distinct steal log line present');
assert(setup22a.c.skills['Thievery'].xp === 1, 'Thievery gains 1 XP on the (non-cutoff) win');
var invBefore22a = setup22a.c.inventory.length;
var claim22a = Game.Battle.claimLoot();
assert(claim22a.ok && setup22a.c.inventory.length === invBefore22a + 1 && setup22a.b.pendingStolenLoot === null,
  'stolen loot is claimable via the normal Loot flow');
Game.Battle.endBattle();

// (b) steal roll MISSES: no stolen loot, but the gold bonus still applies.
var setup22b = setupThieveryWin(12, 'ThieveryMissTest');
setRng(seqRng([
  0.99, 0.99, 0.99, 0.5,
  0.5, 0.99, 0.99,
  0.99 // steal-chance roll (0.99 >= 0.18) -> miss; no further roll consumed
], 0.99));
Game.Battle.attack();
var r22b = setup22b.b.rewards;
assert(setup22b.b.pendingStolenLoot === null && r22b.stolenLoot === null, 'Thievery steal roll miss -> no stolen loot');
assert(r22b.thieveryGold === Math.floor(40 * 0.12), 'gold bonus still applies on a steal-roll miss');
Game.Battle.endBattle();

// (c) zero Thievery investment -> no bonus gold, no steal roll consumed at all.
var setup22c = setupThieveryWin(0, 'ThieveryZeroTest');
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.5, 0.99, 0.99], 0.99)); // no 8th value: stealChance=0 short-circuits before rng()
Game.Battle.attack();
var r22c = setup22c.b.rewards;
assert(r22c.thieveryGold === 0 && r22c.stolenLoot === null, 'zero Thievery skill -> no bonus gold, no steal roll');
Game.Battle.endBattle();

// =================== Test 23: Dual Wield offhand swing (v1.2 Phase 1 #5) ===================
console.log('\n=== Test 23: Dual Wield offhand swing (v1.2 Phase 1 #5) ===');

// (a) No offhand swing without a second weapon equipped.
var c23a = makeCharacter({ name: 'NoOffhandTest' });
setRng(fixedRng(0.99));
var b23a = Game.Battle.start('plains_field_rat');
var dwXpBefore23a = c23a.skills['Dual Wield'].xp;
Game.Battle.attack();
assert(!/offhand/i.test(b23a.log.join(' ')), 'no offhand swing logged without a second weapon equipped');
assert(c23a.skills['Dual Wield'].xp === dwXpBefore23a, 'Dual Wield gains no XP without dual wielding');
Game.Battle.flee();
Game.Battle.endBattle();

// (b) No offhand swing with a Shield (armor, not a weapon) in the offhand slot.
var c23b = makeCharacter({ name: 'ShieldOffhandTest' });
Game.Inventory.addItem(c23b, 'shield_wooden_buckler');
Game.Inventory.equip(c23b, 'shield_wooden_buckler');
setRng(fixedRng(0.99));
var b23b = Game.Battle.start('plains_field_rat');
Game.Battle.attack();
assert(!/offhand/i.test(b23b.log.join(' ')), 'no offhand swing with a Shield (not a weapon) in the offhand slot');
Game.Battle.flee();
Game.Battle.endBattle();

// (c) Offhand swing present with two weapons; damage formula matches getOffhandDamage * dwMult;
// Dual Wield skill gains 1 XP per swing.
var c23c = makeCharacter({ skills: { 'Dual Wield': 8 }, name: 'DualWieldDamageTest' });
c23c.level = 5; // skill cap 2*5+1=11, comfortably above Dual Wield 8 so the XP-grant assertion below is meaningful
Game.Character.recalcDerived(c23c);
Game.Inventory.addItem(c23c, 'knife_offhand_twinfang');
var eqOff23c = Game.Inventory.equip(c23c, 'knife_offhand_twinfang');
assert(eqOff23c.ok, 'equip offhand dagger succeeds: ' + eqOff23c.failures.join(';'));
setRng(fixedRng(0.5)); // no double attack, no monster dodge, no glancing, neutral variance
var b23c = Game.Battle.start('plains_field_rat');
var mHpBefore23c = b23c.monster.hp;
var fear23c = Game.Battle.fearMultiplier(b23c);
var dwLevel23c = c23c.skills['Dual Wield'].level;
var dwMult23c = Math.min(BALANCE.DUAL_WIELD_OFFHAND_MULT_BASE + BALANCE.DUAL_WIELD_OFFHAND_MULT_PER_LEVEL * dwLevel23c, BALANCE.DUAL_WIELD_OFFHAND_MULT_CAP);
var mainDmg23c = Math.max(1, Math.round(Game.Character.getDamage(c23c) * fear23c - b23c.monster.armor));
var offhandBase23c = Game.Character.getOffhandDamage(c23c) * fear23c * dwMult23c;
var offhandDmg23c = Math.max(1, Math.round(offhandBase23c - b23c.monster.armor));
var dwXpBefore23c = c23c.skills['Dual Wield'].xp;
Game.Battle.attack();
var dealt23c = mHpBefore23c - b23c.monster.hp;
assert(dealt23c === mainDmg23c + offhandDmg23c,
  'main-hand + offhand damage both land: dealt ' + dealt23c + ', expected ' + (mainDmg23c + offhandDmg23c) + ' (main ' + mainDmg23c + ' + offhand ' + offhandDmg23c + ')');
assert(/offhand strikes/i.test(b23c.log.join(' ')), 'offhand strike logged');
assert(c23c.skills['Dual Wield'].xp === dwXpBefore23c + 1, 'Dual Wield skill gains 1 XP per offhand swing');
Game.Battle.endBattle();

// (d) offhand swing rolls the monster's dodge independently of the main-hand hit.
var c23d = makeCharacter({ skills: { 'Dual Wield': 5 }, name: 'DualWieldDodgeTest' });
Game.Inventory.addItem(c23d, 'knife_offhand_twinfang');
Game.Inventory.equip(c23d, 'knife_offhand_twinfang');
setRng(fixedRng(0.99));
var b23d = Game.Battle.start('plains_field_rat');
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.0], 0.99)); // DA=false, main monDodge=false, main glancing=false, main variance=neutral, offhand monDodge(0.0) = true
Game.Battle.attack();
assert(/dodges your offhand/i.test(b23d.log.join(' ')), 'offhand strike can be dodged independently of the main hand');
Game.Battle.endBattle();

// =================== Test 24: Intelligence spell hit/miss (v1.2 Phase 1 #6) ===================
console.log('\n=== Test 24: Intelligence spell hit/miss; weapon techs roll dodge instead (v1.2 Phase 1 #6) ===');

// Hit case: rng below the Int-based hit chance -> full damage pipeline proceeds.
var c24 = makeCharacter({ skills: { 'Evocation': 3 }, name: 'IntHitTest' });
setRng(fixedRng(0.5));
var b24 = Game.Battle.start('plains_field_rat');
var hitChance24 = Math.max(BALANCE.INT_SPELL_HIT_MIN, Math.min(BALANCE.INT_SPELL_HIT_MAX,
  BALANCE.INT_SPELL_HIT_BASE + BALANCE.INT_SPELL_HIT_PER_INT * c24.intelligence - BALANCE.INT_SPELL_HIT_PER_MON_LEVEL * b24.monster.level));
assert(hitChance24 > 0.5, 'sanity: this matchup\'s Int hit chance is above the 0.5 rng used below');
var mHpBefore24 = b24.monster.hp;
Game.Battle.useTech('tech_firebolt_1');
assert(b24.monster.hp < mHpBefore24, 'spell hits and deals damage when rng < Int hit chance');
Game.Battle.endBattle();

// Miss case: rng above the hit chance -> no damage, Energy still spent, distinct log line.
var c24b = makeCharacter({ skills: { 'Evocation': 3 }, name: 'IntMissTest' });
setRng(fixedRng(0.99));
var b24b = Game.Battle.start('plains_field_rat');
var hitChance24b = Math.max(BALANCE.INT_SPELL_HIT_MIN, Math.min(BALANCE.INT_SPELL_HIT_MAX,
  BALANCE.INT_SPELL_HIT_BASE + BALANCE.INT_SPELL_HIT_PER_INT * c24b.intelligence - BALANCE.INT_SPELL_HIT_PER_MON_LEVEL * b24b.monster.level));
assert(hitChance24b < 0.99, 'sanity: 0.99 is above this matchup\'s Int hit chance');
var mHpBefore24b = b24b.monster.hp;
var energyBefore24b = c24b.energy;
Game.Battle.useTech('tech_firebolt_1');
assert(b24b.monster.hp === mHpBefore24b, 'spell miss deals no damage');
assert(energyBefore24b - c24b.energy === Game.Battle.getTech('tech_firebolt_1').energyCost, 'Energy is still spent on a miss');
assert(b24b.log.some(function (l) { return /misses the/.test(l); }), 'distinct miss log line present');
Game.Battle.endBattle();

// Healing techs always land, ignoring the Int hit/miss roll entirely (parallels Fear's "spares
// healing" carve-out) — same rng (0.99) that would miss an offensive spell above.
var c24c = makeCharacter({ skills: { 'Abjuration': 3 }, name: 'HealAlwaysLandsTest' });
c24c.hitPoints = 1;
setRng(fixedRng(0.99));
Game.Battle.start('plains_field_rat');
Game.Battle.useTech('tech_mend_wounds_1');
assert(c24c.hitPoints > 1, 'healing technique always lands, ignoring the Int hit/miss roll');
Game.Battle.endBattle();

// Weapon techs roll the monster's dodge instead of the Int check: at rng 0.99 (which just missed
// a magic tech above), a weapon tech still lands, because it only rolls the monster's tiny dodge
// chance rather than the Int-based hit chance.
var c24d = makeCharacter({ name: 'WeaponTechDodgeTest' }); // Swords 3 -> Cleave I known+slotted
setRng(fixedRng(0.99));
var b24d = Game.Battle.start('plains_field_rat');
var mHpBefore24d = b24d.monster.hp;
Game.Battle.useTech('tech_cleave_1');
assert(b24d.monster.hp < mHpBefore24d, 'weapon tech lands at rng 0.99 (would miss a magic tech\'s Int check, but weapon techs roll monster dodge instead)');
Game.Battle.endBattle();

// ...and that monster-dodge roll can independently miss the weapon tech when it IS rolled low.
var c24e = makeCharacter({ name: 'WeaponTechDodgeMissTest' });
setRng(fixedRng(0.99));
var b24e = Game.Battle.start('plains_field_rat');
setRng(fixedRng(0.0)); // 0.0 < monsterDodgeChance -> the monster dodges the weapon tech
var mHpBefore24e = b24e.monster.hp;
Game.Battle.useTech('tech_cleave_1');
assert(b24e.monster.hp === mHpBefore24e, 'the monster\'s dodge (not Int) can make a weapon tech miss entirely');
assert(/dodges your Cleave/.test(b24e.log.join(' ')), 'dodge log line present for the weapon tech');
Game.Battle.endBattle();

// =================== Test 25: non-elemental tech damage ignores defense (v1.2 Phase 1 #7) ===================
console.log('\n=== Test 25: non-elemental (grade:null) tech damage ignores Magic Armor; graded techs still mitigated (v1.2 Phase 1 #7) ===');

var c25 = makeCharacter({ name: 'NonElementalTest' });
c25.primaryClass = 'warrior'; // minimal setup: isClassTechUsable only checks primaryClass/secondaryClass
c25.techs.push('tech_crushing_blow');
c25.techSets[0][1] = 'tech_crushing_blow'; // slot 0 already holds the Swords starter tech (Cleave I)
setRng(fixedRng(0.99));
var b25 = Game.Battle.start('estari_loose_rubble'); // magicArmor 2, nonzero -> the fix is visible
setRng(fixedRng(0.5)); // hit-chance check passes, no glancing, neutral variance
var tech25 = Game.Battle.getTech('tech_crushing_blow');
var fear25 = Game.Battle.fearMultiplier(b25);
var expectedDmg25 = Math.max(1, Math.round(Game.Battle.techEffectivePower(c25, tech25) * fear25)); // mitigation=0 for grade:null
var mHpBefore25 = b25.monster.hp;
Game.Battle.useTech('tech_crushing_blow');
var dealt25 = mHpBefore25 - b25.monster.hp;
assert(dealt25 === expectedDmg25,
  'grade:null non-weapon tech ignores monster.magicArmor (' + b25.monster.magicArmor + ') entirely: dealt ' + dealt25 + ', expected ' + expectedDmg25);
Game.Battle.endBattle();

// Contrast: a GRADED (elemental) non-weapon tech is still mitigated by Magic Armor as before.
var c25b = makeCharacter({ skills: { 'Evocation': 3 }, name: 'ElementalStillMitigatedTest' });
setRng(fixedRng(0.99));
var b25b = Game.Battle.start('estari_loose_rubble');
setRng(fixedRng(0.5));
var tech25b = Game.Battle.getTech('tech_firebolt_1');
var fear25b = Game.Battle.fearMultiplier(b25b);
var raw25b = Game.Battle.techEffectivePower(c25b, tech25b) * fear25b * 1.25; // Fire vulnerability (-0.25 resistance)
var expectedDmg25b = Math.max(1, Math.round(raw25b - b25b.monster.magicArmor));
var mHpBefore25b = b25b.monster.hp;
Game.Battle.useTech('tech_firebolt_1');
var dealt25b = mHpBefore25b - b25b.monster.hp;
assert(dealt25b === expectedDmg25b, 'graded (elemental) tech is still mitigated by Magic Armor: dealt ' + dealt25b + ', expected ' + expectedDmg25b);
Game.Battle.endBattle();

// =================== Test 26: Curse status (v1.2 Phase 1 #8) ===================
console.log('\n=== Test 26: Curse status — apply, halves outgoing damage, expires, cleanse (v1.2 Phase 1 #8) ===');

// Applying: a monster hit carrying curseChance (forced to 1 for testability) applies Curse.
var c26 = makeCharacter({ name: 'CurseApplyTest' });
c26.hitPoints = c26.hitPointsMax = 500;
setRng(fixedRng(0.99));
var b26 = Game.Battle.start('majiku_forest_scout'); // opening strike happens here, before curseChance is set below
b26.monster.curseChance = 1; // force-testable proc (analogous to a tech's poisonChance)
Game.Battle.attack(); // triggers the monster's counter via finishRound -> monsterAct
assert(Game.Battle.playerCurseActive(b26), 'Curse status applied by a curseChance-carrying monster hit');
assert(b26.log.some(function (l) { return /curse settles/i.test(l); }), 'distinct Curse-applied log line');

// Halves outgoing attack damage while active.
var fearCurse26 = Game.Battle.fearMultiplier(b26);
var curseDmg26 = Math.max(1, Math.round(Game.Character.getDamage(c26) * fearCurse26 * BALANCE.CURSE_DAMAGE_MULT - b26.monster.armor));
setRng(fixedRng(0.5)); // no monster dodge on our attack, no glancing, neutral variance
var mHpBefore26 = b26.monster.hp;
Game.Battle.attack();
var dealt26 = mHpBefore26 - b26.monster.hp;
assert(dealt26 === curseDmg26, 'Curse halves outgoing attack damage: dealt ' + dealt26 + ', expected ' + curseDmg26);
Game.Battle.endBattle();

// Clears at battle end (battle-scoped, never persisted on the character).
setRng(fixedRng(0.99));
var b26fresh = Game.Battle.start('plains_field_rat');
assert(!Game.Battle.playerCurseActive(b26fresh), 'Curse does not carry over into a new battle');
Game.Battle.flee();
Game.Battle.endBattle();

// Halves outgoing TECH damage too (not just Attack).
var c26t = makeCharacter({ skills: { 'Evocation': 3 }, name: 'CurseTechTest' });
setRng(fixedRng(0.5));
var b26t = Game.Battle.start('plains_field_rat');
var tech26t = Game.Battle.getTech('tech_firebolt_1');
var fear26t = Game.Battle.fearMultiplier(b26t);
var expectedCursedTechDmg26t = Math.max(1, Math.round(Game.Battle.techEffectivePower(c26t, tech26t) * fear26t * BALANCE.CURSE_DAMAGE_MULT - b26t.monster.magicArmor));
b26t.playerStatuses.push({ type: 'curse', name: 'Curse', turnsLeft: BALANCE.CURSE_DURATION });
var mHpBefore26t = b26t.monster.hp;
Game.Battle.useTech('tech_firebolt_1');
var dealt26t = mHpBefore26t - b26t.monster.hp;
assert(dealt26t === expectedCursedTechDmg26t, 'Curse halves outgoing tech damage too: dealt ' + dealt26t + ', expected ' + expectedCursedTechDmg26t);
Game.Battle.endBattle();

// Duration: expires after exactly CURSE_DURATION turns, then a fade log line and normal damage resume.
var c26d = makeCharacter({ name: 'CurseDurationTest' });
setRng(fixedRng(0.99));
var b26d = Game.Battle.start('plains_field_rat');
b26d.monster.hp = b26d.monster.hpMax = 100000; // survive many rounds
b26d.playerStatuses.push({ type: 'curse', name: 'Curse', turnsLeft: BALANCE.CURSE_DURATION });
for (var ci = 0; ci < BALANCE.CURSE_DURATION - 1; ci++) {
  assert(Game.Battle.playerCurseActive(b26d), 'Curse still active before turn ' + (ci + 1) + ' of ' + BALANCE.CURSE_DURATION);
  Game.Battle.attack();
}
Game.Battle.attack(); // final tick: turnsLeft reaches 0 and the status is removed
assert(!Game.Battle.playerCurseActive(b26d), 'Curse expired after exactly CURSE_DURATION turns');
assert(b26d.log.some(function (l) { return /curse lifts/i.test(l); }), 'distinct Curse-expired log line');
Game.Battle.endBattle();

// Cleansable mid-battle by Mend Wounds II (Abjuration, clearsStatus: true) — also clears Poison.
var c26e = makeCharacter({ skills: { 'Abjuration': 5 }, name: 'CurseCleanseTest' });
c26e.techs.push('tech_mend_wounds_2');
c26e.techSets[0][1] = 'tech_mend_wounds_2';
setRng(fixedRng(0.99));
var b26e = Game.Battle.start('plains_field_rat');
b26e.playerStatuses.push({ type: 'curse', name: 'Curse', turnsLeft: BALANCE.CURSE_DURATION });
b26e.playerStatuses.push({ type: 'poison', name: 'Poison', turnsLeft: BALANCE.POISON_DURATION_TURNS });
assert(Game.Battle.playerCurseActive(b26e), 'sanity: cursed before cleansing');
Game.Battle.useTech('tech_mend_wounds_2');
assert(!Game.Battle.playerCurseActive(b26e), 'Mend Wounds II (clearsStatus) removes Curse mid-battle');
assert(!b26e.playerStatuses.some(function (s) { return s.type === 'poison'; }), 'Mend Wounds II also removes Poison');
assert(b26e.log.some(function (l) { return /washes away/i.test(l); }), 'distinct cleanse log line');
Game.Battle.endBattle();

// =================== Test 27: append-only Crystal/Sphere drops (v1.2 Phase 3 Content-B item 1) ===================
console.log('\n=== Test 27: new Crystal/Sphere drops are append-only — pre-existing drop entries on modified monsters resolve identically under a fixed rng ===');

function killForLoot(monsterId, dropRngSeq) {
  var c = makeCharacter({ name: 'LootAppendTest' });
  c.dexterity = 999; // guarantees playerFirst, so no monster opening-strike rng noise
  setRng(fixedRng(0.99));
  var b = Game.Battle.start(monsterId);
  b.monster.hp = 1; // any landed hit kills it (Test 5 precedent)
  // combat rolls: doubleAttack(miss), monsterDodge(miss->hit lands), glancing(no), variance(neutral);
  // then onWin: gold, shard, then one rng() per drop entry (top-down, first-hit-wins) per dropRngSeq.
  setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.99, 0.99].concat(dropRngSeq), 0.99));
  Game.Battle.attack();
  var loot = b.pendingLoot;
  Game.Battle.endBattle();
  return loot;
}

// juneros_reefstalker drops = [heavy_head_juneros_scalehelm 0.05, crystal_pure_anima 0.08,
// crystal_bclass_1 0.06 (v1.2 Phase 3 append, LAST)]
assert(killForLoot('juneros_reefstalker', [0.03]) === 'heavy_head_juneros_scalehelm',
  'juneros_reefstalker: pre-existing FIRST drop entry (0.05) still resolves identically under a fixed rng that hits it, unaffected by the appended Crystal entry');
assert(killForLoot('juneros_reefstalker', [0.07, 0.07]) === 'crystal_pure_anima',
  'juneros_reefstalker: pre-existing SECOND drop entry (0.08) still resolves identically when the first misses, unaffected by the appended Crystal entry');
assert(killForLoot('juneros_reefstalker', [0.9, 0.9, 0.03]) === 'crystal_bclass_1',
  'juneros_reefstalker: the appended B-Class Crystal I entry is reachable once both pre-existing entries miss');

// juneros_riptide_hunter drops = [heavy_head_juneros_scalehelm 0.04, crystal_pure_anima 0.06,
// sphere_bclass_1 0.06 (v1.2 Phase 3 append, LAST)]
assert(killForLoot('juneros_riptide_hunter', [0.02]) === 'heavy_head_juneros_scalehelm',
  'juneros_riptide_hunter: pre-existing FIRST drop entry (0.04) still resolves identically, unaffected by the appended Sphere entry');
assert(killForLoot('juneros_riptide_hunter', [0.9, 0.9, 0.03]) === 'sphere_bclass_1',
  'juneros_riptide_hunter: the appended B-Class Sphere I entry is reachable once both pre-existing entries miss');

// =================== Test 28: graded/premium Crystal & Sphere restore amounts (v1.2 Phase 3 Content-B item 1) ===================
console.log('\n=== Test 28: new Crystal/Sphere consumables restore exactly their specified Energy/HP ===');

var c28 = makeCharacter({ name: 'CrystalSphereRestoreTest' });
setRng(fixedRng(0.99));
var b28 = Game.Battle.start('plains_field_rat');
Game.Inventory.addItem(c28, 'crystal_bclass_3');
Game.Inventory.addItem(c28, 'sphere_bclass_3');
Game.Inventory.addItem(c28, 'crystal_light');

Game.Battle.useItem('crystal_bclass_3');
var energyLine28 = b28.log.filter(function (l) { return l.indexOf('B-Class Crystal III') !== -1; }).pop();
assert(!!energyLine28 && /recover 170 Energy/.test(energyLine28), 'B-Class Crystal III restores exactly its specified 170 Energy: "' + energyLine28 + '"');

Game.Battle.useItem('sphere_bclass_3');
var healLine28 = b28.log.filter(function (l) { return l.indexOf('B-Class Sphere III') !== -1; }).pop();
assert(!!healLine28 && /recover 420 HP/.test(healLine28), 'B-Class Sphere III restores exactly its specified 420 HP: "' + healLine28 + '"');

Game.Battle.useItem('crystal_light');
var hybridLines28 = b28.log.filter(function (l) { return l.indexOf('Light Crystal') !== -1; });
assert(hybridLines28.some(function (l) { return /recover 130 HP/.test(l); }), 'Light Crystal ALSO restores its specified 130 HP (hybrid premium): ' + hybridLines28.join(' | '));
assert(hybridLines28.some(function (l) { return /recover 260 Energy/.test(l); }), 'Light Crystal restores its specified 260 Energy (hybrid premium): ' + hybridLines28.join(' | '));
Game.Battle.endBattle();

// =================== Test 29: shard-cost enhancement techs (v1.2 Phase 3 Content-B item 4) ===================
console.log('\n=== Test 29: shard-cost techs spend Anima Shards on cast, refuse cleanly when short ===');

// Refusal: insufficient shards -> no Energy spent, no buff applied, shards untouched, distinct message.
var c29 = makeCharacter({ name: 'ShardTechPoorTest' });
c29.techs.push('tech_warcry_1');
c29.techSets[0][1] = 'tech_warcry_1'; // slot 0 already holds the Swords starter tech (Cleave I)
c29.animaShards = 4; // tech_warcry_1's shardCost is 5
setRng(fixedRng(0.99));
var b29 = Game.Battle.start('plains_field_rat');
var energyBefore29 = b29.player.energy;
Game.Battle.useTech('tech_warcry_1');
assert(b29.player.energy === energyBefore29, 'insufficient shards: no Energy spent');
assert(c29.animaShards === 4, 'insufficient shards: shards unchanged');
assert(!b29.playerStatuses.some(function (s) { return s.type === 'buff'; }), 'insufficient shards: no buff applied');
assert(b29.log.some(function (l) { return /Anima Shards/.test(l); }), 'distinct insufficient-shards message logged: ' + b29.log.join(' | '));
Game.Battle.endBattle();

// Success: sufficient shards -> shards deducted by shardCost, Energy spent normally, buff applied.
var c29b = makeCharacter({ name: 'ShardTechRichTest' });
c29b.techs.push('tech_warcry_1');
c29b.techSets[0][1] = 'tech_warcry_1';
Game.Character.addShards(c29b, 20);
setRng(fixedRng(0.99));
var b29b = Game.Battle.start('plains_field_rat');
var tech29b = Game.Battle.getTech('tech_warcry_1');
var energyBefore29b = b29b.player.energy;
Game.Battle.useTech('tech_warcry_1');
assert(c29b.animaShards === 20 - tech29b.shardCost, 'sufficient shards: shardCost (' + tech29b.shardCost + ') deducted');
assert(b29b.player.energy === energyBefore29b - tech29b.energyCost, 'sufficient shards: Energy still spent normally');
assert(b29b.playerStatuses.some(function (s) { return s.type === 'buff' && s.power === tech29b.power; }), 'sufficient shards: buff applied');
Game.Battle.endBattle();

// A second shard-cost tech (rank-2, gated behind rank 1 like the Cleave/Impale chains) also
// refuses/spends correctly — confirms the wiring is generic (keyed off tech.shardCost), not a
// tech_warcry_1 special case.
var c29c = makeCharacter({ name: 'ShardTechRank2Test' });
c29c.techs.push('tech_warcry_1', 'tech_warcry_2');
c29c.techSets[0][1] = 'tech_warcry_2';
c29c.animaShards = 10; // tech_warcry_2's shardCost is 15
setRng(fixedRng(0.99));
var b29c = Game.Battle.start('plains_field_rat');
Game.Battle.useTech('tech_warcry_2');
assert(c29c.animaShards === 10, 'rank-2 shard tech also refuses cleanly when short (10 < 15)');
assert(!b29c.playerStatuses.some(function (s) { return s.type === 'buff'; }), 'rank-2 shard tech refusal applies no buff');
Game.Character.addShards(c29c, 10); // now has 20 >= 15
var tech29c = Game.Battle.getTech('tech_warcry_2');
Game.Battle.useTech('tech_warcry_2');
assert(c29c.animaShards === 20 - tech29c.shardCost, 'rank-2 shard tech spends its shardCost once affordable');
assert(b29c.playerStatuses.some(function (s) { return s.type === 'buff' && s.power === tech29c.power; }), 'rank-2 shard tech applies its buff once affordable');
Game.Battle.endBattle();

// Third shard-cost tech (Focus I) is also wired — sanity on the data side.
assert(Game.Battle.getTech('tech_focus_1').shardCost === 8, 'sanity: Focus I (the third shard-cost tech) carries shardCost 8');

// =================== Test 30: Level-Arc Band A (Forests of Kuraan) monster formulas + boss premiums ===================
console.log('\n=== Test 30: Band A regulars match the header formulas; majiku_warlord carries the F1 boss premiums ===');
var bandARegularIds = [
  'majiku_reclaimer_knight', 'kuraan_bramble_stalker', 'anima_scarred_revenant',
  'majiku_deepwood_witch', 'kuraan_hollow_wraith', 'majiku_ironclad_vanguard'
];
assert(bandARegularIds.length === 6, 'sanity: 6 Band A regular monster ids listed in this test');
bandARegularIds.forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(!!m, 'Band A regular monster exists: ' + id);
  if (!m) return;
  assert(m.hp === BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * m.level, id + ' hp matches the header formula exactly');
  assert(m.damage === BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * m.level, id + ' damage matches the header formula exactly');
  assert(m.energy === BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * m.level, id + ' energy matches the header formula exactly');
  assert(m.xp === BALANCE.MONSTER_XP(m.level), id + ' xp matches BALANCE.MONSTER_XP(level)');
});
// Two thematic undead/anima monsters carry the v1.2 Curse mechanic (phase brief).
['anima_scarred_revenant', 'kuraan_hollow_wraith'].forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(m.curseChance === BALANCE.CURSE_APPLY_CHANCE, id + ' carries curseChance BALANCE.CURSE_APPLY_CHANCE');
});

var warlord = Game.Battle.getMonsterDef('majiku_warlord');
assert(!!warlord && warlord.boss === true, 'majiku_warlord exists and is a boss');
assert(warlord.level === 50, 'majiku_warlord is level 50');
var wlBaseHp = BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 50;
var wlBaseDmg = BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 50;
assert(warlord.hp === wlBaseHp + 12 * 50, 'majiku_warlord hp carries the +12*level boss premium (' + wlBaseHp + ' + 600 = ' + (wlBaseHp + 600) + '), got ' + warlord.hp);
assert(warlord.damage === wlBaseDmg + Math.round(1.5 * 50 + 10), 'majiku_warlord damage carries the F1 round(1.5*level+10) boss premium (' + wlBaseDmg + ' + 85 = ' + (wlBaseDmg + 85) + '), got ' + warlord.damage);
assert(warlord.xp === BALANCE.MONSTER_XP(50) * 3, 'majiku_warlord xp carries the x3 boss premium');

// =================== Test 31: Level-Arc Band A weapon damage is TAPERED, not literal ===================
console.log('\n=== Test 31: Band A levelReq-45/48 weapons carry TAPERED damage per the F1 finding (js/balance.js) ===');
function taperedEffectiveLevelReq(levelReq) {
  return levelReq <= 35 ? levelReq : 35 + 0.7 * (levelReq - 35);
}
// js/balance.js F1 CONVENTION NOTES note 3 (post-launch re-sim, real Band A-F content): a full
// 5-slot matched armor set at the note-1 tapered value alone overshoots a same-level monster's
// whole damage term, silently breaking the 5-levels-down Fear contract again -- ARMOR_STACK_DIVISOR
// further divides the tapered armor/magicArmor number (levelReq > 35 only; weapon damage is NOT
// divided).
var ARMOR_STACK_DIVISOR = 2;
function correctedArmor(levelReq) {
  return Math.max(1, Math.round(Math.round(1 + taperedEffectiveLevelReq(levelReq)) / ARMOR_STACK_DIVISOR));
}
var band45WeaponIds = [
  'sword_kuraan_reclaimers_blade', 'polearm_arkan_vanguard_lance', 'knife_fringewood_fang',
  'hth_reclaimers_gauntlets'
];
var literalDamage45 = 3 + 2 * 45; // 93 -- what a NON-tapered literal read would give
var taperedDamage45 = 3 + 2 * taperedEffectiveLevelReq(45); // 87
band45WeaponIds.forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band A tier-45 weapon exists: ' + id);
  if (!it) return;
  assert(it.damage === taperedDamage45, id + ' damage (' + it.damage + ') equals the TAPERED value ' + taperedDamage45);
  assert(it.damage !== literalDamage45, id + ' damage is NOT the literal-formula value ' + literalDamage45 + ' (the F1 taper must be applied)');
});
// v1.6 P1 (CB-4, SPEC-V1.6-REBALANCE.md §6): Rods carry the SAME tapered weapon damage as every
// other weapon class above, further HALVED — Rods are now spell foci, not melee clubs; a Rod's
// own basic-attack swing was cut so that casting with it, not meleeing with it, is the caster's
// best play (js/data/items.js).
var rodDamage45 = Math.max(1, Math.round(taperedDamage45 * 0.5));
var rod45 = Game.Inventory.getItem('rod_majiku_wardbreaker');
assert(!!rod45, 'Band A tier-45 weapon exists: rod_majiku_wardbreaker');
if (rod45) {
  assert(rod45.damage === rodDamage45, 'rod_majiku_wardbreaker damage (' + rod45.damage + ') equals the v1.6 P1 HALVED-tapered value ' + rodDamage45);
  assert(rod45.damage !== literalDamage45, 'rod_majiku_wardbreaker damage is NOT the literal-formula value ' + literalDamage45);
}
// Armor tapers the same way (1 + effectiveLevelReq), THEN the ARMOR-STACK CORRECTION divides that
// by ARMOR_STACK_DIVISOR (js/balance.js F1 CONVENTION NOTES note 3).
var literalArmor45 = 1 + 45; // 46 -- literal read
var taperedArmor45 = correctedArmor(45); // 43 / 2 = 22
['light_body_kuraan_windweave', 'medium_body_reclaimers_hauberk', 'heavy_body_kuraan_bulwark_plate', 'shield_kuraan_wardbulwark'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band A tier-45 armor/shield exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor45, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED value ' + taperedArmor45);
  assert(it.armor !== literalArmor45, id + ' armor is NOT the literal-formula value ' + literalArmor45);
});

// =================== Test 32: majiku_warlord lair fight — winnable but costly (real RNG sim) ===================
console.log('\n=== Test 32: majiku_warlord (Band A lair boss) is winnable-but-costly for a geared level-50 warrior ===');
function buildLevel50KuraanWarrior() {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Heavy Armor'] = 2;
  var c = Game.Character.create({
    race: 'Human',
    name: 'WarlordTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  c.level = 50;
  c.xp = BALANCE.XP_TO_LEVEL(50);
  // 49 levels' worth of stat points, spent mostly into Strength with some Vitality/Endurance
  // (same split style as the eidas_echo debug-warrior build, test_p6b_content.js).
  c.statPoints = 49 * BALANCE.LEVELUP_STAT_POINTS;
  var totalPoints = c.statPoints;
  for (var i = 0; i < totalPoints; i++) {
    var stat = (i % 5 === 0) ? 'vitality' : (i % 5 === 1 ? 'endurance' : 'strength');
    Game.Character.spendStatPoint(c, stat);
  }
  var gearIds = ['sword_kuraan_reclaimers_blade', 'heavy_body_kuraan_bulwark_plate', 'shield_kuraan_wardbulwark'];
  gearIds.forEach(function (id) {
    Game.Inventory.addItem(c, id);
    var res = Game.Inventory.equip(c, id);
    if (!res.ok) throw new Error('test setup: could not equip ' + id + ': ' + res.failures.join(' '));
  });
  for (i = 0; i < 6; i++) {
    Game.Inventory.addItem(c, 'sphere_cclass_1');
    Game.Inventory.addItem(c, 'crystal_cclass_1');
  }
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return c;
}

function countBandAConsumables(c) {
  var n = 0;
  for (var i = 0; i < c.inventory.length; i++) {
    if (c.inventory[i] === 'sphere_cclass_1' || c.inventory[i] === 'crystal_cclass_1') n++;
  }
  return n;
}

function simulateWarlordBattle() {
  var c = buildLevel50KuraanWarrior();
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = Math.random; // real RNG for this sim

  var consumablesBefore = countBandAConsumables(c);
  var battle = Game.Battle.start('majiku_warlord');
  var rounds = 0;
  var MAX_ROUNDS = 500;
  while (battle.phase === 'active' && rounds < MAX_ROUNDS) {
    rounds++;
    if (!Game.Battle.canAct(battle)) {
      var crystalIdx = c.inventory.indexOf('crystal_cclass_1');
      if (crystalIdx !== -1) {
        Game.Battle.useItem('crystal_cclass_1');
        continue;
      }
    }
    if (c.hitPoints < c.hitPointsMax * 0.4 && c.inventory.indexOf('sphere_cclass_1') !== -1) {
      Game.Battle.useItem('sphere_cclass_1');
      continue;
    }
    Game.Battle.attack();
  }
  var consumablesAfter = countBandAConsumables(c);
  return {
    phase: battle.phase,
    hpLeftFrac: c.hitPoints / c.hitPointsMax,
    consumablesConsumed: consumablesBefore - consumablesAfter
  };
}

var WARLORD_SIM_COUNT = 30;
var wlWins = 0;
var wlOutcomes = {};
var wlHpLeftSum = 0;
var wlConsumedSum = 0;
for (var wlRun = 0; wlRun < WARLORD_SIM_COUNT; wlRun++) {
  var wlResult = simulateWarlordBattle();
  wlOutcomes[wlResult.phase] = (wlOutcomes[wlResult.phase] || 0) + 1;
  if (wlResult.phase === 'won') {
    wlWins++;
    wlHpLeftSum += wlResult.hpLeftFrac;
    wlConsumedSum += wlResult.consumablesConsumed;
  }
}
var wlWinRate = wlWins / WARLORD_SIM_COUNT;
var wlAvgHpLeft = wlWins ? wlHpLeftSum / wlWins : 0;
var wlAvgConsumed = wlWins ? wlConsumedSum / wlWins : 0;
console.log('majiku_warlord sim results over ' + WARLORD_SIM_COUNT + ' battles: ' + JSON.stringify(wlOutcomes) +
  ' — win rate ' + (wlWinRate * 100).toFixed(1) + '%, avg HP left on win ' + (wlAvgHpLeft * 100).toFixed(0) +
  '%, avg consumables spent ' + wlAvgConsumed.toFixed(1));
// Difficulty contract (CLAUDE.md): prepared players win reliably but pay HP/consumables.
assert(wlWinRate >= 0.6, 'majiku_warlord is reliably beatable by a geared level-50 warrior (win rate ' + (wlWinRate * 100).toFixed(1) + '%, want >= 60%)');
assert(wlAvgHpLeft <= 0.85 || wlAvgConsumed >= 1, 'majiku_warlord extracts a real cost on wins (avg HP left ' + (wlAvgHpLeft * 100).toFixed(0) + '%, avg consumables spent ' + wlAvgConsumed.toFixed(1) + ')');

// =================== Test 33: Level-Arc Band B (Majiku Highlands) monster formulas + boss premiums ===================
console.log('\n=== Test 33: Band B regulars match the header formulas; majiku_ridge_chieftain carries the F1 boss premiums ===');
var bandBRegularIds = [
  'majiku_steppe_lancer', 'highland_ridgehawk', 'anima_scarred_highlander',
  'majiku_hostcaller_shaman', 'highland_hollow_stormwraith', 'majiku_hostguard_vanguard'
];
assert(bandBRegularIds.length === 6, 'sanity: 6 Band B regular monster ids listed in this test');
bandBRegularIds.forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(!!m, 'Band B regular monster exists: ' + id);
  if (!m) return;
  assert(m.hp === BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * m.level, id + ' hp matches the header formula exactly');
  assert(m.damage === BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * m.level, id + ' damage matches the header formula exactly');
  assert(m.energy === BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * m.level, id + ' energy matches the header formula exactly');
  assert(m.xp === BALANCE.MONSTER_XP(m.level), id + ' xp matches BALANCE.MONSTER_XP(level)');
});
// Two thematic undead/anima monsters carry the v1.2 Curse mechanic (phase brief).
['anima_scarred_highlander', 'highland_hollow_stormwraith'].forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(m.curseChance === BALANCE.CURSE_APPLY_CHANCE, id + ' carries curseChance BALANCE.CURSE_APPLY_CHANCE');
});

var chieftain = Game.Battle.getMonsterDef('majiku_ridge_chieftain');
assert(!!chieftain && chieftain.boss === true, 'majiku_ridge_chieftain exists and is a boss');
assert(chieftain.level === 60, 'majiku_ridge_chieftain is level 60');
var mrcBaseHp = BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 60;
var mrcBaseDmg = BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 60;
assert(chieftain.hp === mrcBaseHp + 12 * 60, 'majiku_ridge_chieftain hp carries the +12*level boss premium (' + mrcBaseHp + ' + 720 = ' + (mrcBaseHp + 720) + '), got ' + chieftain.hp);
assert(chieftain.damage === mrcBaseDmg + Math.round(1.5 * 60 + 10), 'majiku_ridge_chieftain damage carries the F1 round(1.5*level+10) boss premium (' + mrcBaseDmg + ' + 100 = ' + (mrcBaseDmg + 100) + '), got ' + chieftain.damage);
assert(chieftain.xp === BALANCE.MONSTER_XP(60) * 3, 'majiku_ridge_chieftain xp carries the x3 boss premium');

// =================== Test 34: Level-Arc Band B weapon damage is TAPERED, not literal ===================
console.log('\n=== Test 34: Band B levelReq-55/58 weapons carry TAPERED damage per the F1 finding (js/balance.js) ===');
var band55WeaponIds = [
  'sword_majiku_hostbreaker', 'polearm_ridgewar_pike', 'knife_steppewind_edge',
  'hth_ridgeguard_knuckles'
];
var literalDamage55 = 3 + 2 * 55; // 113 -- what a NON-tapered literal read would give
var taperedDamage55 = 3 + 2 * taperedEffectiveLevelReq(55); // 101
band55WeaponIds.forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band B tier-55 weapon exists: ' + id);
  if (!it) return;
  assert(it.damage === taperedDamage55, id + ' damage (' + it.damage + ') equals the TAPERED value ' + taperedDamage55);
  assert(it.damage !== literalDamage55, id + ' damage is NOT the literal-formula value ' + literalDamage55 + ' (the F1 taper must be applied)');
});
// v1.6 P1 (CB-4): Rods carry the tapered weapon damage further HALVED (js/data/items.js).
var rodDamage55 = Math.max(1, Math.round(taperedDamage55 * 0.5));
var rod55 = Game.Inventory.getItem('rod_hostcallers_ruin');
assert(!!rod55, 'Band B tier-55 weapon exists: rod_hostcallers_ruin');
if (rod55) {
  assert(rod55.damage === rodDamage55, 'rod_hostcallers_ruin damage (' + rod55.damage + ') equals the v1.6 P1 HALVED-tapered value ' + rodDamage55);
  assert(rod55.damage !== literalDamage55, 'rod_hostcallers_ruin damage is NOT the literal-formula value ' + literalDamage55);
}
// Armor tapers the same way (1 + effectiveLevelReq), THEN the ARMOR-STACK CORRECTION divides that
// by ARMOR_STACK_DIVISOR (js/balance.js F1 CONVENTION NOTES note 3).
var literalArmor55 = 1 + 55; // 56 -- literal read
var taperedArmor55 = correctedArmor(55); // 50 / 2 = 25
['light_body_steppewind_mantle', 'medium_body_hostguard_brigandine', 'heavy_body_ridgeplate_cuirass', 'shield_highland_bulwark'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band B tier-55 armor/shield exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor55, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED value ' + taperedArmor55);
  assert(it.armor !== literalArmor55, id + ' armor is NOT the literal-formula value ' + literalArmor55);
});
// Sub-tier (levelReq 58) tapers to a DIFFERENT pre-correction value than the main tier (levelReq
// 55), confirming the taper is re-derived per levelReq rather than a fixed band-wide constant --
// (ARMOR_STACK_DIVISOR's rounding happens to keep these particular adjacent tapered values
// distinct at divisor 2, unlike some larger divisors swept during the fix, so this stays strict).
var literalArmor58 = 1 + 58; // 59 -- literal read
var taperedArmor58 = correctedArmor(58); // 52 / 2 = 26
['light_legs_steppewind_leggings', 'medium_feet_hostguard_boots', 'heavy_legs_ridgeplate_legguards'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band B sub-tier-58 armor exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor58, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED sub-tier value ' + taperedArmor58);
  assert(it.armor !== literalArmor58, id + ' armor is NOT the literal-formula value ' + literalArmor58);
  assert(it.armor !== taperedArmor55, id + ' sub-tier armor (' + it.armor + ') differs from the main-tier corrected value ' + taperedArmor55 + ' (taper is re-derived per levelReq)');
});

// =================== Test 35: majiku_ridge_chieftain lair fight — winnable but costly (real RNG sim) ===================
console.log('\n=== Test 35: majiku_ridge_chieftain (Band B lair boss) is winnable-but-costly for a geared level-60 warrior ===');
function buildLevel60MajikuWarrior() {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Heavy Armor'] = 2;
  var c = Game.Character.create({
    race: 'Human',
    name: 'ChieftainTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  c.level = 60;
  c.xp = BALANCE.XP_TO_LEVEL(60);
  // 59 levels' worth of stat points, spent mostly into Strength with some Vitality/Endurance
  // (same split style as buildLevel50KuraanWarrior above / the eidas_echo debug-warrior build).
  c.statPoints = 59 * BALANCE.LEVELUP_STAT_POINTS;
  var totalPoints60 = c.statPoints;
  for (var i = 0; i < totalPoints60; i++) {
    var stat = (i % 5 === 0) ? 'vitality' : (i % 5 === 1 ? 'endurance' : 'strength');
    Game.Character.spendStatPoint(c, stat);
  }
  var gearIds60 = ['sword_majiku_hostbreaker', 'heavy_body_ridgeplate_cuirass', 'shield_highland_bulwark'];
  gearIds60.forEach(function (id) {
    Game.Inventory.addItem(c, id);
    var res = Game.Inventory.equip(c, id);
    if (!res.ok) throw new Error('test setup: could not equip ' + id + ': ' + res.failures.join(' '));
  });
  for (i = 0; i < 6; i++) {
    Game.Inventory.addItem(c, 'sphere_dclass_1');
    Game.Inventory.addItem(c, 'crystal_dclass_1');
  }
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return c;
}

function countBandBConsumables(c) {
  var n = 0;
  for (var i = 0; i < c.inventory.length; i++) {
    if (c.inventory[i] === 'sphere_dclass_1' || c.inventory[i] === 'crystal_dclass_1') n++;
  }
  return n;
}

function simulateChieftainBattle() {
  var c = buildLevel60MajikuWarrior();
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = Math.random; // real RNG for this sim

  var consumablesBefore = countBandBConsumables(c);
  var battle = Game.Battle.start('majiku_ridge_chieftain');
  var rounds = 0;
  var MAX_ROUNDS = 500;
  while (battle.phase === 'active' && rounds < MAX_ROUNDS) {
    rounds++;
    if (!Game.Battle.canAct(battle)) {
      var crystalIdx = c.inventory.indexOf('crystal_dclass_1');
      if (crystalIdx !== -1) {
        Game.Battle.useItem('crystal_dclass_1');
        continue;
      }
    }
    if (c.hitPoints < c.hitPointsMax * 0.4 && c.inventory.indexOf('sphere_dclass_1') !== -1) {
      Game.Battle.useItem('sphere_dclass_1');
      continue;
    }
    Game.Battle.attack();
  }
  var consumablesAfter = countBandBConsumables(c);
  return {
    phase: battle.phase,
    hpLeftFrac: c.hitPoints / c.hitPointsMax,
    consumablesConsumed: consumablesBefore - consumablesAfter
  };
}

var CHIEFTAIN_SIM_COUNT = 30;
var mrcWins = 0;
var mrcOutcomes = {};
var mrcHpLeftSum = 0;
var mrcConsumedSum = 0;
for (var mrcRun = 0; mrcRun < CHIEFTAIN_SIM_COUNT; mrcRun++) {
  var mrcResult = simulateChieftainBattle();
  mrcOutcomes[mrcResult.phase] = (mrcOutcomes[mrcResult.phase] || 0) + 1;
  if (mrcResult.phase === 'won') {
    mrcWins++;
    mrcHpLeftSum += mrcResult.hpLeftFrac;
    mrcConsumedSum += mrcResult.consumablesConsumed;
  }
}
var mrcWinRate = mrcWins / CHIEFTAIN_SIM_COUNT;
var mrcAvgHpLeft = mrcWins ? mrcHpLeftSum / mrcWins : 0;
var mrcAvgConsumed = mrcWins ? mrcConsumedSum / mrcWins : 0;
console.log('majiku_ridge_chieftain sim results over ' + CHIEFTAIN_SIM_COUNT + ' battles: ' + JSON.stringify(mrcOutcomes) +
  ' — win rate ' + (mrcWinRate * 100).toFixed(1) + '%, avg HP left on win ' + (mrcAvgHpLeft * 100).toFixed(0) +
  '%, avg consumables spent ' + mrcAvgConsumed.toFixed(1));
// Difficulty contract (CLAUDE.md): prepared players win reliably but pay HP/consumables.
assert(mrcWinRate >= 0.6, 'majiku_ridge_chieftain is reliably beatable by a geared level-60 warrior (win rate ' + (mrcWinRate * 100).toFixed(1) + '%, want >= 60%)');
assert(mrcAvgHpLeft <= 0.85 || mrcAvgConsumed >= 1, 'majiku_ridge_chieftain extracts a real cost on wins (avg HP left ' + (mrcAvgHpLeft * 100).toFixed(0) + '%, avg consumables spent ' + mrcAvgConsumed.toFixed(1) + ')');

// =================== Test 36: Level-Arc Band C (The Frozen Reaches / Ukai approach) monster formulas + boss premiums ===================
console.log('\n=== Test 36: Band C regulars match the header formulas; ukai_deep_dweller carries the F1 boss premiums ===');
var bandCRegularIds = [
  'majiku_frost_exile', 'glacial_frost_stalker', 'anima_scarred_frostwalker',
  'ukai_cave_warden', 'ukai_hollow_deepling', 'ukai_deep_vanguard'
];
assert(bandCRegularIds.length === 6, 'sanity: 6 Band C regular monster ids listed in this test');
bandCRegularIds.forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(!!m, 'Band C regular monster exists: ' + id);
  if (!m) return;
  assert(m.hp === BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * m.level, id + ' hp matches the header formula exactly');
  assert(m.damage === BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * m.level, id + ' damage matches the header formula exactly');
  assert(m.energy === BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * m.level, id + ' energy matches the header formula exactly');
  assert(m.xp === BALANCE.MONSTER_XP(m.level), id + ' xp matches BALANCE.MONSTER_XP(level)');
});
// Two thematic undead/anima monsters carry the v1.2 Curse mechanic (phase brief).
['anima_scarred_frostwalker', 'ukai_hollow_deepling'].forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(m.curseChance === BALANCE.CURSE_APPLY_CHANCE, id + ' carries curseChance BALANCE.CURSE_APPLY_CHANCE');
});

var deepDweller = Game.Battle.getMonsterDef('ukai_deep_dweller');
assert(!!deepDweller && deepDweller.boss === true, 'ukai_deep_dweller exists and is a boss');
assert(deepDweller.level === 70, 'ukai_deep_dweller is level 70');
var uddBaseHp = BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 70;
var uddBaseDmg = BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 70;
assert(deepDweller.hp === uddBaseHp + 12 * 70, 'ukai_deep_dweller hp carries the +12*level boss premium (' + uddBaseHp + ' + 840 = ' + (uddBaseHp + 840) + '), got ' + deepDweller.hp);
assert(deepDweller.damage === uddBaseDmg + Math.round(1.5 * 70 + 10), 'ukai_deep_dweller damage carries the F1 round(1.5*level+10) boss premium (' + uddBaseDmg + ' + 115 = ' + (uddBaseDmg + 115) + '), got ' + deepDweller.damage);
assert(deepDweller.xp === BALANCE.MONSTER_XP(70) * 3, 'ukai_deep_dweller xp carries the x3 boss premium');

// =================== Test 37: Level-Arc Band C weapon damage is TAPERED, not literal ===================
console.log('\n=== Test 37: Band C levelReq-65/68 weapons carry TAPERED damage per the F1 finding (js/balance.js) ===');
var band65WeaponIds = [
  'sword_frosthold_vanguard_blade', 'polearm_glacial_warpike', 'knife_icebound_fang',
  'hth_frostbound_knuckles'
];
var literalDamage65 = 3 + 2 * 65; // 133 -- what a NON-tapered literal read would give
var taperedDamage65 = 3 + 2 * taperedEffectiveLevelReq(65); // 115
assert(taperedDamage65 === 115, 'sanity: the band-65 TAPERED damage value is 115, per the phase brief, got ' + taperedDamage65);
band65WeaponIds.forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band C tier-65 weapon exists: ' + id);
  if (!it) return;
  assert(it.damage === taperedDamage65, id + ' damage (' + it.damage + ') equals the TAPERED value ' + taperedDamage65);
  assert(it.damage !== literalDamage65, id + ' damage is NOT the literal-formula value ' + literalDamage65 + ' (the F1 taper must be applied)');
});
// v1.6 P1 (CB-4): Rods carry the tapered weapon damage further HALVED (js/data/items.js).
var rodDamage65 = Math.max(1, Math.round(taperedDamage65 * 0.5));
var rod65 = Game.Inventory.getItem('rod_ukai_wardstone');
assert(!!rod65, 'Band C tier-65 weapon exists: rod_ukai_wardstone');
if (rod65) {
  assert(rod65.damage === rodDamage65, 'rod_ukai_wardstone damage (' + rod65.damage + ') equals the v1.6 P1 HALVED-tapered value ' + rodDamage65);
  assert(rod65.damage !== literalDamage65, 'rod_ukai_wardstone damage is NOT the literal-formula value ' + literalDamage65);
}
// Armor tapers the same way (round(1 + effectiveLevelReq)), THEN the ARMOR-STACK CORRECTION
// divides that by ARMOR_STACK_DIVISOR (js/balance.js F1 CONVENTION NOTES note 3).
var literalArmor65 = 1 + 65; // 66 -- literal read
var taperedArmor65 = correctedArmor(65); // 57 / 2 = 29
['light_body_frosthold_veilcloak', 'medium_body_waystation_hauberk', 'heavy_body_glacial_bulwark_plate', 'shield_frosthold_bulwark'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band C tier-65 armor/shield exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor65, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED value ' + taperedArmor65);
  assert(it.armor !== literalArmor65, id + ' armor is NOT the literal-formula value ' + literalArmor65);
});
// Sub-tier (levelReq 68) tapers to a DIFFERENT pre-correction value than the main tier (levelReq
// 65), confirming the taper is re-derived per levelReq rather than a fixed band-wide constant --
// (57 and 59 correct to distinct integers 29/30 at divisor 2, so this stays strict).
var literalArmor68 = 1 + 68; // 69 -- literal read
var taperedArmor68 = correctedArmor(68); // 59 / 2 = 30
['light_legs_frosthold_ward_leggings', 'medium_feet_waystation_boots', 'heavy_legs_glacial_greatplate_legguards'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band C sub-tier-68 armor exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor68, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED sub-tier value ' + taperedArmor68);
  assert(it.armor !== literalArmor68, id + ' armor is NOT the literal-formula value ' + literalArmor68);
  assert(it.armor !== taperedArmor65, id + ' sub-tier armor (' + it.armor + ') differs from the main-tier corrected value ' + taperedArmor65 + ' (taper is re-derived per levelReq)');
});

// =================== Test 38: ukai_deep_dweller lair fight — winnable but costly (real RNG sim) ===================
console.log('\n=== Test 38: ukai_deep_dweller (Band C lair boss) is winnable-but-costly for a geared level-70 warrior ===');
function buildLevel70FrostholdWarrior() {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Heavy Armor'] = 2;
  var c = Game.Character.create({
    race: 'Human',
    name: 'DeepDwellerTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  c.level = 70;
  c.xp = BALANCE.XP_TO_LEVEL(70);
  // 69 levels' worth of stat points, spent mostly into Strength with some Vitality/Endurance
  // (same split style as buildLevel60MajikuWarrior above / the eidas_echo debug-warrior build).
  c.statPoints = 69 * BALANCE.LEVELUP_STAT_POINTS;
  var totalPoints70 = c.statPoints;
  for (var i = 0; i < totalPoints70; i++) {
    var stat = (i % 5 === 0) ? 'vitality' : (i % 5 === 1 ? 'endurance' : 'strength');
    Game.Character.spendStatPoint(c, stat);
  }
  var gearIds70 = ['sword_frosthold_vanguard_blade', 'heavy_body_glacial_bulwark_plate', 'shield_frosthold_bulwark'];
  gearIds70.forEach(function (id) {
    Game.Inventory.addItem(c, id);
    var res = Game.Inventory.equip(c, id);
    if (!res.ok) throw new Error('test setup: could not equip ' + id + ': ' + res.failures.join(' '));
  });
  for (i = 0; i < 6; i++) {
    Game.Inventory.addItem(c, 'sphere_eclass_1');
    Game.Inventory.addItem(c, 'crystal_eclass_1');
  }
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return c;
}

function countBandCConsumables(c) {
  var n = 0;
  for (var i = 0; i < c.inventory.length; i++) {
    if (c.inventory[i] === 'sphere_eclass_1' || c.inventory[i] === 'crystal_eclass_1') n++;
  }
  return n;
}

function simulateDeepDwellerBattle() {
  var c = buildLevel70FrostholdWarrior();
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = Math.random; // real RNG for this sim

  var consumablesBefore = countBandCConsumables(c);
  var battle = Game.Battle.start('ukai_deep_dweller');
  var rounds = 0;
  var MAX_ROUNDS = 500;
  while (battle.phase === 'active' && rounds < MAX_ROUNDS) {
    rounds++;
    if (!Game.Battle.canAct(battle)) {
      var crystalIdx = c.inventory.indexOf('crystal_eclass_1');
      if (crystalIdx !== -1) {
        Game.Battle.useItem('crystal_eclass_1');
        continue;
      }
    }
    if (c.hitPoints < c.hitPointsMax * 0.4 && c.inventory.indexOf('sphere_eclass_1') !== -1) {
      Game.Battle.useItem('sphere_eclass_1');
      continue;
    }
    Game.Battle.attack();
  }
  var consumablesAfter = countBandCConsumables(c);
  return {
    phase: battle.phase,
    hpLeftFrac: c.hitPoints / c.hitPointsMax,
    consumablesConsumed: consumablesBefore - consumablesAfter
  };
}

var DEEP_DWELLER_SIM_COUNT = 30;
var uddWins = 0;
var uddOutcomes = {};
var uddHpLeftSum = 0;
var uddConsumedSum = 0;
for (var uddRun = 0; uddRun < DEEP_DWELLER_SIM_COUNT; uddRun++) {
  var uddResult = simulateDeepDwellerBattle();
  uddOutcomes[uddResult.phase] = (uddOutcomes[uddResult.phase] || 0) + 1;
  if (uddResult.phase === 'won') {
    uddWins++;
    uddHpLeftSum += uddResult.hpLeftFrac;
    uddConsumedSum += uddResult.consumablesConsumed;
  }
}
var uddWinRate = uddWins / DEEP_DWELLER_SIM_COUNT;
var uddAvgHpLeft = uddWins ? uddHpLeftSum / uddWins : 0;
var uddAvgConsumed = uddWins ? uddConsumedSum / uddWins : 0;
console.log('ukai_deep_dweller sim results over ' + DEEP_DWELLER_SIM_COUNT + ' battles: ' + JSON.stringify(uddOutcomes) +
  ' — win rate ' + (uddWinRate * 100).toFixed(1) + '%, avg HP left on win ' + (uddAvgHpLeft * 100).toFixed(0) +
  '%, avg consumables spent ' + uddAvgConsumed.toFixed(1));
// Difficulty contract (CLAUDE.md): prepared players win reliably but pay HP/consumables.
assert(uddWinRate >= 0.6, 'ukai_deep_dweller is reliably beatable by a geared level-70 warrior (win rate ' + (uddWinRate * 100).toFixed(1) + '%, want >= 60%)');
assert(uddAvgHpLeft <= 0.85 || uddAvgConsumed >= 1, 'ukai_deep_dweller extracts a real cost on wins (avg HP left ' + (uddAvgHpLeft * 100).toFixed(0) + '%, avg consumables spent ' + uddAvgConsumed.toFixed(1) + ')');

// =================== Test 39: Level-Arc Band D (Estari Ruins Deep) monster formulas + boss premiums ===================
console.log('\n=== Test 39: Band D regulars match the header formulas; estari_warden_prime carries the F1 boss premiums ===');
var bandDRegularIds = [
  'estari_sublevel_warden', 'estari_anima_conduit', 'anima_scarred_excavator',
  'estari_wellspring_warden', 'raw_anima_horror', 'estari_ruin_vanguard'
];
assert(bandDRegularIds.length === 6, 'sanity: 6 Band D regular monster ids listed in this test');
bandDRegularIds.forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(!!m, 'Band D regular monster exists: ' + id);
  if (!m) return;
  assert(m.hp === BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * m.level, id + ' hp matches the header formula exactly');
  assert(m.damage === BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * m.level, id + ' damage matches the header formula exactly');
  assert(m.energy === BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * m.level, id + ' energy matches the header formula exactly');
  assert(m.xp === BALANCE.MONSTER_XP(m.level), id + ' xp matches BALANCE.MONSTER_XP(level)');
});
// Two thematic anima-scarred/anima-horror monsters carry the v1.2 Curse mechanic (phase brief).
['anima_scarred_excavator', 'raw_anima_horror'].forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(m.curseChance === BALANCE.CURSE_APPLY_CHANCE, id + ' carries curseChance BALANCE.CURSE_APPLY_CHANCE');
});

var wardenPrime = Game.Battle.getMonsterDef('estari_warden_prime');
assert(!!wardenPrime && wardenPrime.boss === true, 'estari_warden_prime exists and is a boss');
assert(wardenPrime.level === 80, 'estari_warden_prime is level 80');
var ewpBaseHp = BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 80;
var ewpBaseDmg = BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 80;
assert(wardenPrime.hp === ewpBaseHp + 12 * 80, 'estari_warden_prime hp carries the +12*level boss premium (' + ewpBaseHp + ' + 960 = ' + (ewpBaseHp + 960) + '), got ' + wardenPrime.hp);
assert(wardenPrime.damage === ewpBaseDmg + Math.round(1.5 * 80 + 10), 'estari_warden_prime damage carries the F1 round(1.5*level+10) boss premium (' + ewpBaseDmg + ' + 130 = ' + (ewpBaseDmg + 130) + '), got ' + wardenPrime.damage);
assert(wardenPrime.xp === BALANCE.MONSTER_XP(80) * 3, 'estari_warden_prime xp carries the x3 boss premium');

// =================== Test 40: Level-Arc Band D weapon damage is TAPERED, not literal ===================
console.log('\n=== Test 40: Band D levelReq-75/78 weapons carry TAPERED damage per the F1 finding (js/balance.js) ===');
var band75WeaponIds = [
  'sword_estari_wardblade', 'polearm_estari_warpike', 'knife_estari_shard_fang',
  'hth_warden_gauntlets'
];
var literalDamage75 = 3 + 2 * 75; // 153 -- what a NON-tapered literal read would give
var taperedDamage75 = 3 + 2 * taperedEffectiveLevelReq(75); // 129
assert(taperedDamage75 === 129, 'sanity: the band-75 TAPERED damage value is 129, per the phase brief, got ' + taperedDamage75);
band75WeaponIds.forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band D tier-75 weapon exists: ' + id);
  if (!it) return;
  assert(it.damage === taperedDamage75, id + ' damage (' + it.damage + ') equals the TAPERED value ' + taperedDamage75);
  assert(it.damage !== literalDamage75, id + ' damage is NOT the literal-formula value ' + literalDamage75 + ' (the F1 taper must be applied)');
});
// v1.6 P1 (CB-4): Rods carry the tapered weapon damage further HALVED (js/data/items.js).
var rodDamage75 = Math.max(1, Math.round(taperedDamage75 * 0.5));
var rod75 = Game.Inventory.getItem('rod_wellspring_conduit');
assert(!!rod75, 'Band D tier-75 weapon exists: rod_wellspring_conduit');
if (rod75) {
  assert(rod75.damage === rodDamage75, 'rod_wellspring_conduit damage (' + rod75.damage + ') equals the v1.6 P1 HALVED-tapered value ' + rodDamage75);
  assert(rod75.damage !== literalDamage75, 'rod_wellspring_conduit damage is NOT the literal-formula value ' + literalDamage75);
}
// Armor tapers the same way (round(1 + effectiveLevelReq)), THEN the ARMOR-STACK CORRECTION
// divides that by ARMOR_STACK_DIVISOR (js/balance.js F1 CONVENTION NOTES note 3).
var literalArmor75 = 1 + 75; // 76 -- literal read
var taperedArmor75 = correctedArmor(75); // 64 / 2 = 32
['light_body_wellspring_veil', 'medium_body_estari_brigandine', 'heavy_body_warden_plate', 'shield_estari_bulwark'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band D tier-75 armor/shield exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor75, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED value ' + taperedArmor75);
  assert(it.armor !== literalArmor75, id + ' armor is NOT the literal-formula value ' + literalArmor75);
});
// Sub-tier (levelReq 78) tapers to a DIFFERENT pre-correction value than the main tier (levelReq
// 75), confirming the taper is re-derived per levelReq rather than a fixed band-wide constant --
// (64 and 66 correct to distinct integers 32/33 at divisor 2, so this stays strict).
var literalArmor78 = 1 + 78; // 79 -- literal read
var taperedArmor78 = correctedArmor(78); // 66 / 2 = 33
['light_legs_wellspring_leggings', 'medium_feet_estari_boots', 'heavy_legs_warden_legguards'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band D sub-tier-78 armor exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor78, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED sub-tier value ' + taperedArmor78);
  assert(it.armor !== literalArmor78, id + ' armor is NOT the literal-formula value ' + literalArmor78);
  assert(it.armor !== taperedArmor75, id + ' sub-tier armor (' + it.armor + ') differs from the main-tier corrected value ' + taperedArmor75 + ' (taper is re-derived per levelReq)');
});

// =================== Test 41: estari_warden_prime lair fight — winnable but costly (real RNG sim) ===================
console.log('\n=== Test 41: estari_warden_prime (Band D lair boss) is winnable-but-costly for a geared level-80 warrior ===');
function buildLevel80WellspringWarrior() {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Heavy Armor'] = 2;
  var c = Game.Character.create({
    race: 'Human',
    name: 'WardenPrimeTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  c.level = 80;
  c.xp = BALANCE.XP_TO_LEVEL(80);
  // 79 levels' worth of stat points, spent mostly into Strength with some Vitality/Endurance
  // (same split style as buildLevel70FrostholdWarrior above).
  c.statPoints = 79 * BALANCE.LEVELUP_STAT_POINTS;
  var totalPoints80 = c.statPoints;
  for (var i = 0; i < totalPoints80; i++) {
    var stat = (i % 5 === 0) ? 'vitality' : (i % 5 === 1 ? 'endurance' : 'strength');
    Game.Character.spendStatPoint(c, stat);
  }
  var gearIds80 = ['sword_estari_wardblade', 'heavy_body_warden_plate', 'shield_estari_bulwark'];
  gearIds80.forEach(function (id) {
    Game.Inventory.addItem(c, id);
    var res = Game.Inventory.equip(c, id);
    if (!res.ok) throw new Error('test setup: could not equip ' + id + ': ' + res.failures.join(' '));
  });
  for (i = 0; i < 6; i++) {
    Game.Inventory.addItem(c, 'sphere_fclass_1');
    Game.Inventory.addItem(c, 'crystal_fclass_1');
  }
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return c;
}

function countBandDConsumables(c) {
  var n = 0;
  for (var i = 0; i < c.inventory.length; i++) {
    if (c.inventory[i] === 'sphere_fclass_1' || c.inventory[i] === 'crystal_fclass_1') n++;
  }
  return n;
}

function simulateWardenPrimeBattle() {
  var c = buildLevel80WellspringWarrior();
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = Math.random; // real RNG for this sim

  var consumablesBefore = countBandDConsumables(c);
  var battle = Game.Battle.start('estari_warden_prime');
  var rounds = 0;
  var MAX_ROUNDS = 500;
  while (battle.phase === 'active' && rounds < MAX_ROUNDS) {
    rounds++;
    if (!Game.Battle.canAct(battle)) {
      var crystalIdx = c.inventory.indexOf('crystal_fclass_1');
      if (crystalIdx !== -1) {
        Game.Battle.useItem('crystal_fclass_1');
        continue;
      }
    }
    if (c.hitPoints < c.hitPointsMax * 0.4 && c.inventory.indexOf('sphere_fclass_1') !== -1) {
      Game.Battle.useItem('sphere_fclass_1');
      continue;
    }
    Game.Battle.attack();
  }
  var consumablesAfter = countBandDConsumables(c);
  return {
    phase: battle.phase,
    hpLeftFrac: c.hitPoints / c.hitPointsMax,
    consumablesConsumed: consumablesBefore - consumablesAfter
  };
}

var WARDEN_PRIME_SIM_COUNT = 30;
var ewpWins = 0;
var ewpOutcomes = {};
var ewpHpLeftSum = 0;
var ewpConsumedSum = 0;
for (var ewpRun = 0; ewpRun < WARDEN_PRIME_SIM_COUNT; ewpRun++) {
  var ewpResult = simulateWardenPrimeBattle();
  ewpOutcomes[ewpResult.phase] = (ewpOutcomes[ewpResult.phase] || 0) + 1;
  if (ewpResult.phase === 'won') {
    ewpWins++;
    ewpHpLeftSum += ewpResult.hpLeftFrac;
    ewpConsumedSum += ewpResult.consumablesConsumed;
  }
}
var ewpWinRate = ewpWins / WARDEN_PRIME_SIM_COUNT;
var ewpAvgHpLeft = ewpWins ? ewpHpLeftSum / ewpWins : 0;
var ewpAvgConsumed = ewpWins ? ewpConsumedSum / ewpWins : 0;
console.log('estari_warden_prime sim results over ' + WARDEN_PRIME_SIM_COUNT + ' battles: ' + JSON.stringify(ewpOutcomes) +
  ' — win rate ' + (ewpWinRate * 100).toFixed(1) + '%, avg HP left on win ' + (ewpAvgHpLeft * 100).toFixed(0) +
  '%, avg consumables spent ' + ewpAvgConsumed.toFixed(1));
// Difficulty contract (CLAUDE.md): prepared players win reliably but pay HP/consumables.
assert(ewpWinRate >= 0.6, 'estari_warden_prime is reliably beatable by a geared level-80 warrior (win rate ' + (ewpWinRate * 100).toFixed(1) + '%, want >= 60%)');
assert(ewpAvgHpLeft <= 0.85 || ewpAvgConsumed >= 1, 'estari_warden_prime extracts a real cost on wins (avg HP left ' + (ewpAvgHpLeft * 100).toFixed(0) + '%, avg consumables spent ' + ewpAvgConsumed.toFixed(1) + ')');

// =================== Test 42: Level-Arc Band E (Ascent to the Skyspire) monster formulas + boss premiums ===================
console.log('\n=== Test 42: Band E regulars match the header formulas; society_anima_horror carries the F1 boss premiums ===');
var bandERegularIds = [
  'skyspire_lower_warden', 'society_remnant_battlemage', 'anima_horror_stalker',
  'skyspire_upper_sentinel', 'society_arcanist_prime', 'anima_horror_ravager'
];
assert(bandERegularIds.length === 6, 'sanity: 6 Band E regular monster ids listed in this test');
bandERegularIds.forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(!!m, 'Band E regular monster exists: ' + id);
  if (!m) return;
  assert(m.hp === BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * m.level, id + ' hp matches the header formula exactly');
  assert(m.damage === BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * m.level, id + ' damage matches the header formula exactly');
  assert(m.energy === BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * m.level, id + ' energy matches the header formula exactly');
  assert(m.xp === BALANCE.MONSTER_XP(m.level), id + ' xp matches BALANCE.MONSTER_XP(level)');
});
// Two thematic anima-horror monsters carry the v1.2 Curse mechanic (phase brief).
['anima_horror_stalker', 'anima_horror_ravager'].forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(m.curseChance === BALANCE.CURSE_APPLY_CHANCE, id + ' carries curseChance BALANCE.CURSE_APPLY_CHANCE');
});

var animaHorror = Game.Battle.getMonsterDef('society_anima_horror');
assert(!!animaHorror && animaHorror.boss === true, 'society_anima_horror exists and is a boss');
assert(animaHorror.level === 90, 'society_anima_horror is level 90');
var sahBaseHp = BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 90;
var sahBaseDmg = BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 90;
assert(animaHorror.hp === sahBaseHp + 12 * 90, 'society_anima_horror hp carries the +12*level boss premium (' + sahBaseHp + ' + 1080 = ' + (sahBaseHp + 1080) + '), got ' + animaHorror.hp);
assert(animaHorror.damage === sahBaseDmg + Math.round(1.5 * 90 + 10), 'society_anima_horror damage carries the F1 round(1.5*level+10) boss premium (' + sahBaseDmg + ' + 145 = ' + (sahBaseDmg + 145) + '), got ' + animaHorror.damage);
assert(animaHorror.xp === BALANCE.MONSTER_XP(90) * 3, 'society_anima_horror xp carries the x3 boss premium');

// =================== Test 43: Level-Arc Band E weapon damage is TAPERED, not literal ===================
console.log('\n=== Test 43: Band E levelReq-85/88 weapons carry TAPERED damage per the F1 finding (js/balance.js) ===');
var band85WeaponIds = [
  'sword_spireward_blade', 'polearm_skyspire_halberd', 'knife_society_renegade_dirk',
  'hth_spireguard_gauntlets'
];
var literalDamage85 = 3 + 2 * 85; // 173 -- what a NON-tapered literal read would give
var taperedDamage85 = 3 + 2 * taperedEffectiveLevelReq(85); // 143
assert(taperedDamage85 === 143, 'sanity: the band-85 TAPERED damage value is 143, per the phase brief, got ' + taperedDamage85);
band85WeaponIds.forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band E tier-85 weapon exists: ' + id);
  if (!it) return;
  assert(it.damage === taperedDamage85, id + ' damage (' + it.damage + ') equals the TAPERED value ' + taperedDamage85);
  assert(it.damage !== literalDamage85, id + ' damage is NOT the literal-formula value ' + literalDamage85 + ' (the F1 taper must be applied)');
});
// v1.6 P1 (CB-4): Rods carry the tapered weapon damage further HALVED (js/data/items.js).
var rodDamage85 = Math.max(1, Math.round(taperedDamage85 * 0.5));
var rod85 = Game.Inventory.getItem('rod_anima_channeling_rod');
assert(!!rod85, 'Band E tier-85 weapon exists: rod_anima_channeling_rod');
if (rod85) {
  assert(rod85.damage === rodDamage85, 'rod_anima_channeling_rod damage (' + rod85.damage + ') equals the v1.6 P1 HALVED-tapered value ' + rodDamage85);
  assert(rod85.damage !== literalDamage85, 'rod_anima_channeling_rod damage is NOT the literal-formula value ' + literalDamage85);
}
// Armor tapers the same way (round(1 + effectiveLevelReq)), THEN the ARMOR-STACK CORRECTION
// divides that by ARMOR_STACK_DIVISOR (js/balance.js F1 CONVENTION NOTES note 3).
var literalArmor85 = 1 + 85; // 86 -- literal read
var taperedArmor85 = correctedArmor(85); // 71 / 2 = 36
['light_body_skysilk_shroud', 'medium_body_spireguard_brigandine', 'heavy_body_spireward_plate', 'shield_spireward_aegis'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band E tier-85 armor/shield exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor85, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED value ' + taperedArmor85);
  assert(it.armor !== literalArmor85, id + ' armor is NOT the literal-formula value ' + literalArmor85);
});
// Sub-tier (levelReq 88) tapers to a DIFFERENT pre-correction value than the main tier (levelReq
// 85), confirming the taper is re-derived per levelReq rather than a fixed band-wide constant --
// (71 and 73 correct to distinct integers 36/37 at divisor 2, so this stays strict).
var literalArmor88 = 1 + 88; // 89 -- literal read
var taperedArmor88 = correctedArmor(88); // 73 / 2 = 37
['light_legs_stormline_leggings', 'medium_feet_stormline_boots', 'heavy_legs_stormline_legguards'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band E sub-tier-88 armor exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor88, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED sub-tier value ' + taperedArmor88);
  assert(it.armor !== literalArmor88, id + ' armor is NOT the literal-formula value ' + literalArmor88);
  assert(it.armor !== taperedArmor85, id + ' sub-tier armor (' + it.armor + ') differs from the main-tier corrected value ' + taperedArmor85 + ' (taper is re-derived per levelReq)');
});

// =================== Test 44: society_anima_horror lair fight — winnable but costly (real RNG sim) ===================
console.log('\n=== Test 44: society_anima_horror (Band E lair boss) is winnable-but-costly for a geared level-90 warrior ===');
function buildLevel90SkyspireWarrior() {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Heavy Armor'] = 2;
  var c = Game.Character.create({
    race: 'Human',
    name: 'AnimaHorrorTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  c.level = 90;
  c.xp = BALANCE.XP_TO_LEVEL(90);
  // 89 levels' worth of stat points, spent mostly into Strength with some Vitality/Endurance
  // (same split style as buildLevel80WellspringWarrior above).
  c.statPoints = 89 * BALANCE.LEVELUP_STAT_POINTS;
  var totalPoints90 = c.statPoints;
  for (var i = 0; i < totalPoints90; i++) {
    var stat = (i % 5 === 0) ? 'vitality' : (i % 5 === 1 ? 'endurance' : 'strength');
    Game.Character.spendStatPoint(c, stat);
  }
  var gearIds90 = ['sword_spireward_blade', 'heavy_body_spireward_plate', 'shield_spireward_aegis'];
  gearIds90.forEach(function (id) {
    Game.Inventory.addItem(c, id);
    var res = Game.Inventory.equip(c, id);
    if (!res.ok) throw new Error('test setup: could not equip ' + id + ': ' + res.failures.join(' '));
  });
  for (i = 0; i < 6; i++) {
    Game.Inventory.addItem(c, 'sphere_gclass_1');
    Game.Inventory.addItem(c, 'crystal_gclass_1');
  }
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return c;
}

function countBandEConsumables(c) {
  var n = 0;
  for (var i = 0; i < c.inventory.length; i++) {
    if (c.inventory[i] === 'sphere_gclass_1' || c.inventory[i] === 'crystal_gclass_1') n++;
  }
  return n;
}

function simulateAnimaHorrorBattle() {
  var c = buildLevel90SkyspireWarrior();
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = Math.random; // real RNG for this sim

  var consumablesBefore = countBandEConsumables(c);
  var battle = Game.Battle.start('society_anima_horror');
  var rounds = 0;
  var MAX_ROUNDS = 500;
  while (battle.phase === 'active' && rounds < MAX_ROUNDS) {
    rounds++;
    if (!Game.Battle.canAct(battle)) {
      var crystalIdx = c.inventory.indexOf('crystal_gclass_1');
      if (crystalIdx !== -1) {
        Game.Battle.useItem('crystal_gclass_1');
        continue;
      }
    }
    if (c.hitPoints < c.hitPointsMax * 0.4 && c.inventory.indexOf('sphere_gclass_1') !== -1) {
      Game.Battle.useItem('sphere_gclass_1');
      continue;
    }
    Game.Battle.attack();
  }
  var consumablesAfter = countBandEConsumables(c);
  return {
    phase: battle.phase,
    hpLeftFrac: c.hitPoints / c.hitPointsMax,
    consumablesConsumed: consumablesBefore - consumablesAfter
  };
}

var ANIMA_HORROR_SIM_COUNT = 30;
var sahWins = 0;
var sahOutcomes = {};
var sahHpLeftSum = 0;
var sahConsumedSum = 0;
for (var sahRun = 0; sahRun < ANIMA_HORROR_SIM_COUNT; sahRun++) {
  var sahResult = simulateAnimaHorrorBattle();
  sahOutcomes[sahResult.phase] = (sahOutcomes[sahResult.phase] || 0) + 1;
  if (sahResult.phase === 'won') {
    sahWins++;
    sahHpLeftSum += sahResult.hpLeftFrac;
    sahConsumedSum += sahResult.consumablesConsumed;
  }
}
var sahWinRate = sahWins / ANIMA_HORROR_SIM_COUNT;
var sahAvgHpLeft = sahWins ? sahHpLeftSum / sahWins : 0;
var sahAvgConsumed = sahWins ? sahConsumedSum / sahWins : 0;
console.log('society_anima_horror sim results over ' + ANIMA_HORROR_SIM_COUNT + ' battles: ' + JSON.stringify(sahOutcomes) +
  ' — win rate ' + (sahWinRate * 100).toFixed(1) + '%, avg HP left on win ' + (sahAvgHpLeft * 100).toFixed(0) +
  '%, avg consumables spent ' + sahAvgConsumed.toFixed(1));
// Difficulty contract (CLAUDE.md): prepared players win reliably but pay HP/consumables.
assert(sahWinRate >= 0.6, 'society_anima_horror is reliably beatable by a geared level-90 warrior (win rate ' + (sahWinRate * 100).toFixed(1) + '%, want >= 60%)');
assert(sahAvgHpLeft <= 0.85 || sahAvgConsumed >= 1, 'society_anima_horror extracts a real cost on wins (avg HP left ' + (sahAvgHpLeft * 100).toFixed(0) + '%, avg consumables spent ' + sahAvgConsumed.toFixed(1) + ')');

// =================== Test 45: Level-Arc Band F (The Red Moon / Eidas's Sanctum) monster formulas + boss premiums ===================
console.log('\n=== Test 45: Band F regulars match the header formulas; eidas_ascendant carries the amplified FINALE boss premiums ===');
var bandFRegularIds = [
  'moonbridge_ward_sentinel', 'divine_race_initiate', 'moon_anima_stalker',
  'sanctum_ward_colossus', 'divine_race_exemplar', 'moon_anima_devourer'
];
assert(bandFRegularIds.length === 6, 'sanity: 6 Band F regular monster ids listed in this test');
bandFRegularIds.forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(!!m, 'Band F regular monster exists: ' + id);
  if (!m) return;
  assert(m.hp === BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * m.level, id + ' hp matches the header formula exactly');
  assert(m.damage === BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * m.level, id + ' damage matches the header formula exactly');
  assert(m.energy === BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * m.level, id + ' energy matches the header formula exactly');
  assert(m.xp === BALANCE.MONSTER_XP(m.level), id + ' xp matches BALANCE.MONSTER_XP(level)');
});
// Two thematic moon-anima-horror monsters carry the v1.2 Curse mechanic (phase brief).
['moon_anima_stalker', 'moon_anima_devourer'].forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(m.curseChance === BALANCE.CURSE_APPLY_CHANCE, id + ' carries curseChance BALANCE.CURSE_APPLY_CHANCE');
});

var eidasAscendant = Game.Battle.getMonsterDef('eidas_ascendant');
assert(!!eidasAscendant && eidasAscendant.boss === true, 'eidas_ascendant exists and is a boss');
assert(eidasAscendant.level === 100, 'eidas_ascendant is level 100 -- the arc\'s final boss');
var eaBaseHp = BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * 100;
var eaBaseDmg = BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * 100;
var eaStandardHpPremium = 12 * 100; // the F1 CONVENTION NOTES starting ballpark every other Level-Arc boss uses
var eaAmplifiedHpPremium = Math.round(12 * 100 * 1.4); // Band F's deliberate FINALE amplification
assert(eidasAscendant.hp === eaBaseHp + eaAmplifiedHpPremium, 'eidas_ascendant hp carries the amplified 1.4x hp premium (' + eaBaseHp + ' + ' + eaAmplifiedHpPremium + ' = ' + (eaBaseHp + eaAmplifiedHpPremium) + '), got ' + eidasAscendant.hp);
assert(eidasAscendant.hp > eaBaseHp + eaStandardHpPremium, 'eidas_ascendant hp premium (' + eaAmplifiedHpPremium + ') exceeds the standard +12*level premium (' + eaStandardHpPremium + ') other Level-Arc bosses use -- the FINALE is deliberately tougher');
assert(eidasAscendant.damage === eaBaseDmg + Math.round(1.5 * 100 + 10), 'eidas_ascendant damage carries the F1 round(1.5*level+10) boss premium (' + eaBaseDmg + ' + 160 = ' + (eaBaseDmg + 160) + '), got ' + eidasAscendant.damage);
assert(eidasAscendant.xp === BALANCE.MONSTER_XP(100) * 3, 'eidas_ascendant xp carries the x3 boss premium');
assert(eidasAscendant.curseChance === BALANCE.CURSE_APPLY_CHANCE, 'eidas_ascendant carries curseChance BALANCE.CURSE_APPLY_CHANCE, matching his moon-anima-horror creations');
// The signature tech (mon_red_moons_judgment) is unique to this boss: no other monster in the
// game knows it, and its power is far above the shared mon_* tech ceiling (~26) used by every
// other monster tech in the game (those are shared flavor moves spanning the whole 1-100 range).
var redMoonsJudgment = Game.Battle.getTech ? Game.Battle.getTech('mon_red_moons_judgment') : Game.Data.techs.filter(function (t) { return t.id === 'mon_red_moons_judgment'; })[0];
assert(!!redMoonsJudgment, 'mon_red_moons_judgment tech exists');
assert(redMoonsJudgment.power > 200, 'mon_red_moons_judgment power (' + redMoonsJudgment.power + ') is a real signature-strike spike, not a shared flavor move (want > 200)');
assert(eidasAscendant.techs.indexOf('mon_red_moons_judgment') !== -1, 'eidas_ascendant knows its own signature tech mon_red_moons_judgment');
Game.Data.monsters.forEach(function (m) {
  if (m.id === 'eidas_ascendant') return;
  assert((m.techs || []).indexOf('mon_red_moons_judgment') === -1, 'mon_red_moons_judgment is exclusive to eidas_ascendant, not known by ' + m.id);
});

// =================== Test 46: Level-Arc Band F weapon damage is TAPERED, not literal ===================
console.log('\n=== Test 46: Band F levelReq-95/98 weapons carry TAPERED damage per the F1 finding (js/balance.js) ===');
var band95WeaponIds = [
  'sword_redmoon_blade', 'polearm_moonbridge_halberd', 'knife_sanctum_fang',
  'hth_sanctum_gauntlets'
];
var literalDamage95 = 3 + 2 * 95; // 193 -- what a NON-tapered literal read would give
var taperedDamage95 = 3 + 2 * taperedEffectiveLevelReq(95); // 157
assert(taperedDamage95 === 157, 'sanity: the band-95 TAPERED damage value is 157, per the phase brief, got ' + taperedDamage95);
band95WeaponIds.forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band F tier-95 weapon exists: ' + id);
  if (!it) return;
  assert(it.damage === taperedDamage95, id + ' damage (' + it.damage + ') equals the TAPERED value ' + taperedDamage95);
  assert(it.damage !== literalDamage95, id + ' damage is NOT the literal-formula value ' + literalDamage95 + ' (the F1 taper must be applied)');
});
// v1.6 P1 (CB-4): Rods carry the tapered weapon damage further HALVED (js/data/items.js).
var rodDamage95 = Math.max(1, Math.round(taperedDamage95 * 0.5));
var rod95 = Game.Inventory.getItem('rod_lunar_conduit');
assert(!!rod95, 'Band F tier-95 weapon exists: rod_lunar_conduit');
if (rod95) {
  assert(rod95.damage === rodDamage95, 'rod_lunar_conduit damage (' + rod95.damage + ') equals the v1.6 P1 HALVED-tapered value ' + rodDamage95);
  assert(rod95.damage !== literalDamage95, 'rod_lunar_conduit damage is NOT the literal-formula value ' + literalDamage95);
}
// Armor tapers the same way (round(1 + effectiveLevelReq)), THEN the ARMOR-STACK CORRECTION
// divides that by ARMOR_STACK_DIVISOR (js/balance.js F1 CONVENTION NOTES note 3).
var literalArmor95 = 1 + 95; // 96 -- literal read
var taperedArmor95 = correctedArmor(95); // 78 / 2 = 39
['light_body_moonveil_shroud', 'medium_body_sanctum_brigandine', 'heavy_body_redmoon_plate', 'shield_redmoon_aegis'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band F tier-95 armor/shield exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor95, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED value ' + taperedArmor95);
  assert(it.armor !== literalArmor95, id + ' armor is NOT the literal-formula value ' + literalArmor95);
});
// Sub-tier (levelReq 98) tapers to a DIFFERENT pre-correction value than the main tier (levelReq
// 95), confirming the taper is re-derived per levelReq rather than a fixed band-wide constant --
// (78 and 80 correct to distinct integers 39/40 at divisor 2, so this stays strict).
var literalArmor98 = 1 + 98; // 99 -- literal read
var taperedArmor98 = correctedArmor(98); // 80 / 2 = 40
['light_legs_moonveil_leggings', 'medium_feet_sanctum_boots', 'heavy_legs_redmoon_legguards'].forEach(function (id) {
  var it = Game.Inventory.getItem(id);
  assert(!!it, 'Band F sub-tier-98 armor exists: ' + id);
  if (!it) return;
  assert(it.armor === taperedArmor98, id + ' armor (' + it.armor + ') equals the ARMOR-STACK-CORRECTED sub-tier value ' + taperedArmor98);
  assert(it.armor !== literalArmor98, id + ' armor is NOT the literal-formula value ' + literalArmor98);
  assert(it.armor !== taperedArmor95, id + ' sub-tier armor (' + it.armor + ') differs from the main-tier corrected value ' + taperedArmor95 + ' (taper is re-derived per levelReq)');
});

// =================== Test 47: eidas_ascendant lair fight — THE ARC FINALE, winnable but the costliest fight in the game (real RNG sim) ===================
console.log('\n=== Test 47: eidas_ascendant (Band F FINAL lair boss) is winnable but the costliest fight in the game for a geared level-100 warrior ===');
function buildLevel100RedMoonWarrior() {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Heavy Armor'] = 2;
  var c = Game.Character.create({
    race: 'Human',
    name: 'EidasAscendantTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  c.level = 100;
  c.xp = BALANCE.XP_TO_LEVEL(100);
  // 99 levels' worth of stat points, spent mostly into Strength with some Vitality/Endurance
  // (same split style as buildLevel90SkyspireWarrior above).
  c.statPoints = 99 * BALANCE.LEVELUP_STAT_POINTS;
  var totalPoints100 = c.statPoints;
  for (var i = 0; i < totalPoints100; i++) {
    var stat = (i % 5 === 0) ? 'vitality' : (i % 5 === 1 ? 'endurance' : 'strength');
    Game.Character.spendStatPoint(c, stat);
  }
  var gearIds100 = ['sword_redmoon_blade', 'heavy_body_redmoon_plate', 'shield_redmoon_aegis'];
  gearIds100.forEach(function (id) {
    Game.Inventory.addItem(c, id);
    var res = Game.Inventory.equip(c, id);
    if (!res.ok) throw new Error('test setup: could not equip ' + id + ': ' + res.failures.join(' '));
  });
  for (i = 0; i < 8; i++) {
    Game.Inventory.addItem(c, 'sphere_hclass_1');
    Game.Inventory.addItem(c, 'crystal_hclass_1');
  }
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return c;
}

function countBandFConsumables(c) {
  var n = 0;
  for (var i = 0; i < c.inventory.length; i++) {
    if (c.inventory[i] === 'sphere_hclass_1' || c.inventory[i] === 'crystal_hclass_1') n++;
  }
  return n;
}

function simulateEidasAscendantBattle() {
  var c = buildLevel100RedMoonWarrior();
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = Math.random; // real RNG for this sim

  var consumablesBefore = countBandFConsumables(c);
  var battle = Game.Battle.start('eidas_ascendant');
  var rounds = 0;
  var MAX_ROUNDS = 800;
  while (battle.phase === 'active' && rounds < MAX_ROUNDS) {
    rounds++;
    if (!Game.Battle.canAct(battle)) {
      var crystalIdx = c.inventory.indexOf('crystal_hclass_1');
      if (crystalIdx !== -1) {
        Game.Battle.useItem('crystal_hclass_1');
        continue;
      }
    }
    if (c.hitPoints < c.hitPointsMax * 0.4 && c.inventory.indexOf('sphere_hclass_1') !== -1) {
      Game.Battle.useItem('sphere_hclass_1');
      continue;
    }
    Game.Battle.attack();
  }
  var consumablesAfter = countBandFConsumables(c);
  return {
    phase: battle.phase,
    hpLeftFrac: c.hitPoints / c.hitPointsMax,
    consumablesConsumed: consumablesBefore - consumablesAfter
  };
}

var EIDAS_ASCENDANT_SIM_COUNT = 60;
var eaWins = 0;
var eaOutcomes = {};
var eaHpLeftSum = 0;
var eaConsumedSum = 0;
for (var eaRun = 0; eaRun < EIDAS_ASCENDANT_SIM_COUNT; eaRun++) {
  var eaResult = simulateEidasAscendantBattle();
  eaOutcomes[eaResult.phase] = (eaOutcomes[eaResult.phase] || 0) + 1;
  if (eaResult.phase === 'won') {
    eaWins++;
    eaHpLeftSum += eaResult.hpLeftFrac;
    eaConsumedSum += eaResult.consumablesConsumed;
  }
}
var eaWinRate = eaWins / EIDAS_ASCENDANT_SIM_COUNT;
var eaAvgHpLeft = eaWins ? eaHpLeftSum / eaWins : 0;
var eaAvgConsumed = eaWins ? eaConsumedSum / eaWins : 0;
console.log('eidas_ascendant sim results over ' + EIDAS_ASCENDANT_SIM_COUNT + ' battles: ' + JSON.stringify(eaOutcomes) +
  ' — win rate ' + (eaWinRate * 100).toFixed(1) + '%, avg HP left on win ' + (eaAvgHpLeft * 100).toFixed(0) +
  '%, avg consumables spent ' + eaAvgConsumed.toFixed(1));
// Difficulty contract (CLAUDE.md): prepared players win reliably but pay HP/consumables --
// but as the FINALE, eidas_ascendant should be the COSTLIEST fight in the game (not unwinnable).
assert(eaWinRate >= 0.6, 'eidas_ascendant is winnable by a geared level-100 warrior (win rate ' + (eaWinRate * 100).toFixed(1) + '%, want >= 60%, per the difficulty contract\'s "not unwinnable" floor)');
assert(eaAvgConsumed >= 2, 'eidas_ascendant extracts a heavier cost than a normal band boss (avg consumables spent ' + eaAvgConsumed.toFixed(1) + ', want >= 2 -- society_anima_horror\'s Band E sim spent ~1.4)');

// =================== Test 48: v1.4 P2 (G1) — AP boss multiplier (BALANCE.AP_BOSS_MULT) ===================
console.log('\n=== Test 48: AP boss win grants BALANCE.AP_PER_WIN(monster level) x BALANCE.AP_BOSS_MULT ===');
var c48 = makeCharacter({ name: 'ApBossTest' });
c48.level = 10; // matches estari_ruin_warden's own level -> no 5-level cutoff
c48.xp = BALANCE.XP_TO_LEVEL(10);
Game.Character.recalcDerived(c48);
c48.hitPoints = c48.hitPointsMax = 5000; // survive the boss's first strike (dex 10 >= player's) unscathed either way
setRng(fixedRng(0.99));
var b48 = Game.Battle.start('estari_ruin_warden'); // level 10 boss (monster.boss === true)
assert(b48.monster.boss === true, 'sanity: estari_ruin_warden is flagged boss');
b48.monster.hp = 1;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.99, 0.99, 0.99], 0.99)); // no dbl/dodge/glancing/variance skew; gold/shard/drop rolls all miss
Game.Battle.attack();
assert(b48.phase === 'won', 'boss battle won');
var expectedBossAp = Math.round(BALANCE.AP_PER_WIN(10) * BALANCE.AP_BOSS_MULT);
assert(b48.rewards.ap === expectedBossAp, 'boss win grants AP_PER_WIN(10) x AP_BOSS_MULT = ' + expectedBossAp + ', got ' + b48.rewards.ap);
assert(c48.ap === expectedBossAp, 'character.ap credited with the boss AP reward');
Game.Battle.endBattle();

// =================== Test 49: v1.4 P3 (G2) — champion affix roll (forced rng); non-champion gets none ===================
console.log('\n=== Test 49: champion affix — each of the 5 reachable via a forced roll; a non-champion battle never gets one ===');
var AFFIX_ROLL_CASES = [
  { rng: 0.05, expected: 'vampiric' },
  { rng: 0.25, expected: 'frenzied' },
  { rng: 0.45, expected: 'warded' },
  { rng: 0.65, expected: 'venomous' },
  { rng: 0.85, expected: 'hoarder' }
];
AFFIX_ROLL_CASES.forEach(function (tc) {
  var cAffix = makeCharacter({ name: 'AffixRoll' });
  cAffix.dexterity = 20; // playerFirst vs a level-1 monster -> start() does not consume extra rng before we inspect
  setRng(fixedRng(tc.rng));
  var bAffix = Game.Battle.start('plains_field_rat', { champion: true });
  assert(bAffix.monster.affix === tc.expected, 'rng ' + tc.rng + ' rolls affix ' + tc.expected + ', got ' + bAffix.monster.affix);
  var expectedCap = tc.expected.charAt(0).toUpperCase() + tc.expected.slice(1);
  assert(bAffix.log.some(function (l) { return l.indexOf(expectedCap) !== -1; }), 'affix announced in the battle log at start: ' + tc.expected);
  Game.Battle.endBattle();
});

var cNoChampAffix = makeCharacter({ name: 'NoChampionAffix' });
setRng(fixedRng(0.99));
var bNoChampAffix = Game.Battle.start('plains_field_rat');
assert(bNoChampAffix.monster.affix === undefined, 'a non-champion battle never gets an affix, got ' + bNoChampAffix.monster.affix);
Game.Battle.endBattle();

// =================== Test 50: v1.4 P3 (G2) — Vampiric champion affix ===================
console.log('\n=== Test 50: Vampiric champion affix — monster heals 25% of damage dealt to the player, capped at hpMax ===');
var cVamp = makeCharacter({ name: 'VampiricTest' });
cVamp.dexterity = 20; // playerFirst
Game.Character.recalcDerived(cVamp);
cVamp.hitPoints = cVamp.hitPointsMax = 100000; // survive regardless of the monster's counter
cVamp.energy = cVamp.energyMax = 100000;
setRng(fixedRng(0.5)); // Test 3/13 idiom: neutral variance, no dodge/glancing/double-attack
var bVamp = Game.Battle.start('plains_field_rat');
bVamp.monster.techs = []; // isolate to basic attacks only
bVamp.monster.affix = 'vampiric';
bVamp.monster.damage = 100; // large enough that round(dmg * 0.25) is unambiguously > 0 after mitigation
bVamp.monster.hpMax = 10000;
bVamp.monster.hp = bVamp.monster.hpMax - 200; // headroom so the heal is visible, not capped
var hpBeforeVamp = bVamp.monster.hp;
Game.Battle.attack();
var vampLog = bVamp.log.filter(function (l) { return l.indexOf('drinks your blood') !== -1; }).pop();
assert(!!vampLog, 'vampiric heal log line present');
var strikeLineVamp = bVamp.log.filter(function (l) { return /^You strike the/.test(l); }).pop();
var playerDealtDmgVamp = parseInt(strikeLineVamp.match(/for (\d+) damage/)[1], 10);
var healedAmtVamp = parseInt(vampLog.match(/healing (\d+) HP/)[1], 10);
var counterLineVamp = bVamp.log.filter(function (l) { return / attacks for \d+ damage\.$/.test(l); }).pop();
var dealtToPlayerVamp = parseInt(counterLineVamp.match(/for (\d+) damage/)[1], 10);
assert(healedAmtVamp === Math.round(dealtToPlayerVamp * BALANCE.AFFIX_VAMPIRIC_LEECH), 'heal = round(' + BALANCE.AFFIX_VAMPIRIC_LEECH + ' x ' + dealtToPlayerVamp + ') = ' + Math.round(dealtToPlayerVamp * BALANCE.AFFIX_VAMPIRIC_LEECH) + ', got ' + healedAmtVamp);
assert(bVamp.monster.hp === hpBeforeVamp - playerDealtDmgVamp + healedAmtVamp, 'monster.hp reflects the player\'s hit then the vampiric heal exactly: ' + bVamp.monster.hp);
Game.Battle.endBattle();

// =================== Test 51: v1.4 P3 (G2) — Frenzied champion affix ===================
console.log('\n=== Test 51: Frenzied champion affix — damage escalates +5%/action, caps at +40% ===');
var cFz = makeCharacter({ name: 'FrenziedTest' });
cFz.dexterity = 60; // playerFirst vs a level-50 boss (used only for its large, rounding-friendly damage stat)
Game.Character.recalcDerived(cFz);
cFz.hitPoints = cFz.hitPointsMax = 1000000;
cFz.energy = cFz.energyMax = 1000000;
setRng(fixedRng(0.5)); // neutral: no dodge/glancing/double-attack, variance factor 1.0 (Test 3/13/50 idiom)
var bFz = Game.Battle.start('majiku_warlord');
bFz.monster.techs = []; // isolate to basic attacks (base = monster.damage, not a tech's power)
bFz.monster.script = []; // isolate from majiku_warlord's own boss script (covered by Test 55)
bFz.monster.affix = 'frenzied';
bFz.monster.hp = bFz.monster.hpMax = 10000000;
bFz.monster.energy = bFz.monster.energyMax = 10000000;
var baseDamageFz = bFz.monster.damage;
var dmgHistoryFz = [];
for (var roundFz = 1; roundFz <= 12; roundFz++) {
  Game.Battle.attack();
  var lastLineFz = bFz.log[bFz.log.length - 1];
  dmgHistoryFz.push(parseInt(lastLineFz.match(/for (\d+) damage\.$/)[1], 10));
}
assert(bFz.monsterActionsTaken === 12, 'monsterActionsTaken tracked 12 monster actions, got ' + bFz.monsterActionsTaken);
for (var fzI = 1; fzI < 7; fzI++) {
  assert(dmgHistoryFz[fzI] > dmgHistoryFz[fzI - 1], 'frenzied damage still escalating at action ' + (fzI + 1) + ': ' + dmgHistoryFz[fzI] + ' > ' + dmgHistoryFz[fzI - 1]);
}
var plateauFz = dmgHistoryFz.slice(7); // actions 8-12: multiplier pinned at the +40% cap
assert(plateauFz.every(function (d) { return d === plateauFz[0]; }), 'frenzied damage plateaus once the +40% cap is reached (actions 8-12): ' + JSON.stringify(plateauFz));
var expectedCapDmgFz = Math.round(baseDamageFz * (1 + BALANCE.AFFIX_FRENZIED_CAP));
assert(plateauFz[0] === expectedCapDmgFz, 'plateau damage matches round(baseDamage x (1+cap)) = ' + expectedCapDmgFz + ', got ' + plateauFz[0]);
Game.Battle.endBattle();

// =================== Test 52: v1.4 P3 (G2) — Warded champion affix ===================
console.log('\n=== Test 52: Warded champion affix — first hostile tech this battle is negated (energy spent, damage 0); only once ===');
var cWard = makeCharacter({ skills: { 'Evocation': 3 }, name: 'WardedTest' });
cWard.dexterity = 20; // playerFirst
cWard.hitPoints = cWard.hitPointsMax = 100000;
cWard.energy = cWard.energyMax = 100000;
setRng(fixedRng(0.1)); // < INT_SPELL_HIT_MIN floor (0.40) -> every cast hits; harmless elsewhere (all other proc chances here are well above 0.1)
var bWard = Game.Battle.start('plains_field_rat');
bWard.monster.techs = [];
bWard.monster.affix = 'warded';
bWard.monster.hp = bWard.monster.hpMax = 100000;
var techW = Game.Battle.getTech('tech_firebolt_1');
var energyBeforeWard = cWard.energy;
var monsterHpBeforeWard = bWard.monster.hp;
Game.Battle.useTech('tech_firebolt_1');
assert(cWard.energy === energyBeforeWard - techW.energyCost, 'Energy is still spent on the warded (negated) cast');
assert(bWard.monster.hp === monsterHpBeforeWard, 'the warded tech dealt 0 damage — monster HP unchanged');
assert(bWard.wardedTechUsed === true, 'the one-shot warded flag is now consumed');
assert(bWard.log.indexOf('The ward flares and swallows your technique!') !== -1, 'warded log line present');

// A SECOND hostile tech the same battle casts normally — the ward already fired once.
var monsterHpBeforeWard2 = bWard.monster.hp;
var energyBeforeWard2 = cWard.energy;
Game.Battle.useTech('tech_firebolt_1');
assert(bWard.monster.hp < monsterHpBeforeWard2, 'a SECOND hostile tech this battle casts normally and damages the monster (ward already spent)');
assert(cWard.energy === energyBeforeWard2 - techW.energyCost, 'the second cast also spends energy normally');
Game.Battle.endBattle();

// =================== Test 53: v1.4 P3 (G2) — Venomous champion affix ===================
console.log('\n=== Test 53: Venomous champion affix — poisons on a successful BASIC attack (forced rng), never stacks a second poison ===');
var cVeno = makeCharacter({ name: 'VenomousTest' });
cVeno.dexterity = 20; // playerFirst
cVeno.hitPoints = cVeno.hitPointsMax = 100000;
cVeno.energy = cVeno.energyMax = 100000;
setRng(fixedRng(0.3)); // < AFFIX_VENOMOUS_CHANCE (0.35); clears every dodge/glancing/double-attack check in this fixture
var bVeno = Game.Battle.start('plains_field_rat');
bVeno.monster.techs = [];
bVeno.monster.affix = 'venomous';
bVeno.monster.hp = bVeno.monster.hpMax = 100000;
Game.Battle.attack();
var poisonCountAfter1 = bVeno.playerStatuses.filter(function (s) { return s.type === 'poison'; }).length;
assert(poisonCountAfter1 === 1, 'a successful monster basic attack applies poison (rng 0.3 < 0.35), got count ' + poisonCountAfter1);
assert(bVeno.log.some(function (l) { return l.indexOf('venom takes hold') !== -1; }), 'venomous poison log line present');

Game.Battle.attack();
var poisonCountAfter2 = bVeno.playerStatuses.filter(function (s) { return s.type === 'poison'; }).length;
assert(poisonCountAfter2 === 1, 'venomous never stacks a second poison instance even on another successful proc, got count ' + poisonCountAfter2);
Game.Battle.endBattle();

// =================== Test 54: v1.4 P3 (G2) — Hoarder champion affix ===================
console.log('\n=== Test 54: Hoarder champion affix — drop chance x3 (not x2), while xp/gold stay at the normal champion x2 ===');
var cHoard = makeCharacter({ name: 'HoarderTest' });
setRng(fixedRng(0.99));
var bHoard = Game.Battle.start('plains_field_rat', { champion: true });
bHoard.monster.affix = 'hoarder';
bHoard.monster.hp = 1; // next attack kills
// attack(): [dbl, monsterDodge, glancing, variance] -> onWin: [gold, drop] (champion skips the shard roll entirely)
setRng(seqRng([0.99, 0.99, 0.99, 0.5, /* gold */ 0.0, /* drop (hoarder probe) */ 0.25], 0.99));
Game.Battle.attack();
assert(bHoard.phase === 'won', 'champion battle won');
var rHoard = bHoard.rewards;
assert(rHoard.xp === bHoard.monster.xp * BALANCE.CHAMPION_REWARD_MULT, 'champion xp premium (x' + BALANCE.CHAMPION_REWARD_MULT + ') unaffected by Hoarder, got ' + rHoard.xp);
assert(rHoard.gold === bHoard.monster.goldMin * BALANCE.CHAMPION_REWARD_MULT, 'champion gold premium (x' + BALANCE.CHAMPION_REWARD_MULT + ') unaffected by Hoarder, got ' + rHoard.gold);
// probe: drop chance 0.1 x2 (normal champion) = 0.2 -> rng 0.25 would MISS; x3 (Hoarder) = 0.3 -> rng 0.25 HITS.
assert(rHoard.loot === 'potion_minor_healing', 'Hoarder replaces the x2 champion drop-chance premium with x3 (probe rng 0.25 misses at x2=0.2 but hits at x3=0.3), got loot=' + rHoard.loot);
Game.Battle.endBattle();

// =================== Test 55: v1.4 P3 (G2) — boss script fires exactly once at its threshold ===================
console.log('\n=== Test 55: boss script (kastengard_custodian, fortify @ 50%) fires exactly once when HP first crosses its threshold ===');
var cScript = makeCharacter({ name: 'BossScriptTest' });
cScript.dexterity = 60; // playerFirst vs a level-32 boss
cScript.level = 32; // avoid Fear complicating the player's own hit (irrelevant to what's asserted, but keeps it simple)
cScript.strength = 100;
Game.Character.recalcDerived(cScript);
cScript.hitPoints = cScript.hitPointsMax = 100000;
cScript.energy = cScript.energyMax = 100000;
setRng(fixedRng(0.99));
var bScript = Game.Battle.start('kastengard_custodian');
bScript.monster.techs = [];
bScript.monster.hpMax = 100000;
bScript.monster.hp = 50001; // one point above the 50% threshold -- any positive hit crosses it, without killing the boss
var armorBefore = bScript.monster.armor;
var scriptEntry = bScript.monster.script[0];
assert(scriptEntry.effect === 'fortify' && scriptEntry.atHpFrac === 0.5, 'sanity: kastengard_custodian carries the expected fortify script entry');
assert(!scriptEntry.fired, 'sanity: the script entry has not fired yet');

Game.Battle.attack(); // crosses the 50% threshold this round without killing the boss
assert(bScript.monster.hp / bScript.monster.hpMax <= 0.5, 'sanity: the hit brought the boss to/below the 50% threshold');
assert(scriptEntry.fired === true, 'the script entry fired once its threshold was crossed');
assert(bScript.monster.armor === armorBefore + scriptEntry.amount, 'fortify applied its flat amount exactly once: armor ' + armorBefore + ' -> ' + bScript.monster.armor);
var scriptLogHits1 = bScript.log.filter(function (l) { return l === scriptEntry.log; }).length;
assert(scriptLogHits1 === 1, 'the script log line was written exactly once, got ' + scriptLogHits1);

// A further round (well clear of the threshold either way) must NOT re-fire the one-shot entry.
var armorAfterFirstFire = bScript.monster.armor;
Game.Battle.attack();
assert(bScript.monster.armor === armorAfterFirstFire, 'fortify does not re-apply on a later round: armor stays ' + bScript.monster.armor);
var scriptLogHits2 = bScript.log.filter(function (l) { return l === scriptEntry.log; }).length;
assert(scriptLogHits2 === 1, 'the script log line still appears exactly once after a second round, got ' + scriptLogHits2);
Game.Battle.endBattle();

// =================== Test 56: v1.4 P4 (G3) — Limit Break gating (classless / under-fury) ===================
console.log('\n=== Test 56: Limit Break unavailable when classless or under the Fury floor; no fury spent on refusal ===');
var c56 = makeCharacter({ name: 'LbGateClassless' });
c56.dexterity = 20; // playerFirst
c56.fury = 10;
assert(Game.Battle.getLimitBreak(c56) === null, 'a classless character has no Limit Break, got ' + JSON.stringify(Game.Battle.getLimitBreak(c56)));
setRng(fixedRng(0.5));
var b56a = Game.Battle.start('plains_field_rat');
b56a.monster.hp = b56a.monster.hpMax = 100000;
var hpBefore56a = b56a.monster.hp;
Game.Battle.limitBreak();
assert(b56a.monster.hp === hpBefore56a, 'classless limitBreak() deals no damage');
assert(c56.fury === 10, 'classless limitBreak() spends no Fury');
assert(b56a.log[b56a.log.length - 1].indexOf('no Limit Break') !== -1, 'log explains no Limit Break is available');
Game.Battle.endBattle();

var c56b = makeCharacter({ name: 'LbGateUnderFury' });
c56b.dexterity = 20;
Game.Classes.obtainClass(c56b, 'warrior');
c56b.fury = BALANCE.LB_FURY_MIN - 1;
setRng(fixedRng(0.5));
var b56b = Game.Battle.start('plains_field_rat');
b56b.monster.hp = b56b.monster.hpMax = 100000;
var hpBefore56b = b56b.monster.hp;
Game.Battle.limitBreak();
assert(b56b.monster.hp === hpBefore56b, 'under-fury limitBreak() deals no damage');
assert(c56b.fury === BALANCE.LB_FURY_MIN - 1, 'under-fury limitBreak() spends no Fury');
assert(b56b.log[b56b.log.length - 1].indexOf('not yet strong enough') !== -1, 'log explains the Fury streak is not yet strong enough');
Game.Battle.endBattle();

// =================== Test 57: v1.4 P4 (G3) — Limit Break damage, Fury cost, once per battle ===================
console.log('\n=== Test 57: Limit Break consumes the whole Fury streak, deals ~' + BALANCE.LB_DAMAGE_MULT + 'x a basic hit, once per battle ===');
function lbFixture(name) {
  var c = makeCharacter({ name: name });
  c.dexterity = 20; // playerFirst
  Game.Character.recalcDerived(c);
  return c;
}

var c57base = lbFixture('LbBaselineHit');
setRng(fixedRng(0.5)); // neutral variance, no dodge/glancing/double-attack (Test 3/13/50 idiom)
var b57base = Game.Battle.start('plains_field_rat');
b57base.monster.techs = [];
b57base.monster.armor = 0; // isolate the raw damage-vs-mitigation math from any armor rounding skew
b57base.monster.hp = b57base.monster.hpMax = 1000000;
Game.Battle.attack();
var baseLine57 = b57base.log.filter(function (l) { return /^You strike the/.test(l); }).pop();
var baseDmg57 = parseInt(baseLine57.match(/for (\d+) damage/)[1], 10);
Game.Battle.endBattle();

var c57lb = lbFixture('LbHit');
Game.Classes.obtainClass(c57lb, 'warrior');
c57lb.fury = 6;
setRng(fixedRng(0.5));
var b57lb = Game.Battle.start('plains_field_rat');
b57lb.monster.techs = [];
b57lb.monster.armor = 0;
b57lb.monster.hp = b57lb.monster.hpMax = 1000000;
Game.Battle.limitBreak();
var lbLine57 = b57lb.log.filter(function (l) { return l.indexOf('slams into') !== -1; }).pop();
assert(!!lbLine57, 'limit break strike logged');
var lbDmg57 = parseInt(lbLine57.match(/for (\d+) damage/)[1], 10);
assert(Math.abs(lbDmg57 - baseDmg57 * BALANCE.LB_DAMAGE_MULT) <= 1, 'Limit Break damage ~= ' + BALANCE.LB_DAMAGE_MULT + 'x a basic hit (base ' + baseDmg57 + ', LB ' + lbDmg57 + ', expected ~' + (baseDmg57 * BALANCE.LB_DAMAGE_MULT) + ')');
assert(c57lb.fury === 0, 'Limit Break consumes the ENTIRE Fury streak, got ' + c57lb.fury);
assert(b57lb.limitBreakUsed === true, 'battle.limitBreakUsed flag set after use');

// once per battle: fury re-primed mid-battle must still refuse a second use this same battle.
c57lb.fury = 10;
var hpBeforeSecond57 = b57lb.monster.hp;
Game.Battle.limitBreak();
assert(b57lb.monster.hp === hpBeforeSecond57, 'a second Limit Break this battle deals no further damage');
assert(c57lb.fury === 10, 'a refused second Limit Break does not touch Fury');
assert(b57lb.log[b57lb.log.length - 1].indexOf('already unleashed') !== -1, 'log explains the Limit Break was already used this battle');
Game.Battle.endBattle();

// =================== Test 58: v1.4 P4 (G3) — Limit Break maps to the class LINE ===================
console.log('\n=== Test 58: Limit Break maps to the class LINE (warrior->Rage, thief->Dragon Kick, magician->Hurricane Blow); first obtained wins ===');
var LB_MAP_CASES = [
  { base: 'warrior', expectedId: 'rage', expectedName: 'Rage' },
  { base: 'thief', expectedId: 'dragon_kick', expectedName: 'Dragon Kick' },
  { base: 'magician', expectedId: 'hurricane_blow', expectedName: 'Hurricane Blow' }
];
LB_MAP_CASES.forEach(function (tc) {
  var c58 = makeCharacter({ name: 'LbMap_' + tc.base });
  Game.Classes.obtainClass(c58, tc.base);
  var lb58 = Game.Battle.getLimitBreak(c58);
  assert(!!lb58 && lb58.id === tc.expectedId && lb58.name === tc.expectedName, tc.base + ' base class grants ' + tc.expectedName + ', got ' + JSON.stringify(lb58));
});

var c58multi = makeCharacter({ name: 'LbMapMultiBase' });
Game.Classes.obtainClass(c58multi, 'warrior');
Game.Classes.obtainClass(c58multi, 'thief');
var lb58multi = Game.Battle.getLimitBreak(c58multi);
assert(lb58multi && lb58multi.id === 'rage', 'a character with multiple base classes keeps the FIRST obtained (warrior -> Rage), got ' + JSON.stringify(lb58multi));

// =================== Test 59: v1.4 P4 (G3) — Rage's armor buff rider ===================
console.log('\n=== Test 59: Rage limit-break rider — +' + BALANCE.LB_RAGE_ARMOR_BONUS + ' Armor for ' + BALANCE.LB_RAGE_ARMOR_DURATION + ' turns, then reverts ===');
var c59 = makeCharacter({ name: 'RageArmorTest' });
c59.dexterity = 60; // playerFirst
c59.level = 1; // matches plains_field_rat's own level -> no Fear complicating the mitigation math
Game.Character.recalcDerived(c59);
c59.hitPoints = c59.hitPointsMax = 1000000;
c59.energy = c59.energyMax = 1000000;
Game.Classes.obtainClass(c59, 'warrior');
c59.fury = BALANCE.LB_FURY_MIN;
setRng(fixedRng(0.5)); // neutral: no dodge/glancing/double-attack on either side (Test 3/13/50 idiom)
var b59 = Game.Battle.start('plains_field_rat');
b59.monster.techs = [];
b59.monster.damage = 500; // large enough that +-3 Armor is unambiguous after rounding
b59.monster.energy = b59.monster.energyMax = 1000000;
b59.monster.hp = b59.monster.hpMax = 1000000;

Game.Battle.limitBreak(); // Rage fires -> +Armor buff pushed BEFORE finishRound's monster counter
var hit1Line59 = b59.log.filter(function (l) { return / attacks for \d+ damage\.$/.test(l); }).pop();
var hit1_59 = parseInt(hit1Line59.match(/for (\d+) damage/)[1], 10);

Game.Battle.attack(); // 2nd monster counter — buff still active
var hit2Line59 = b59.log.filter(function (l) { return / attacks for \d+ damage\.$/.test(l); }).pop();
var hit2_59 = parseInt(hit2Line59.match(/for (\d+) damage/)[1], 10);

Game.Battle.attack(); // 3rd monster counter — buff still active; ticks to 0 (expires) at round end
var hit3Line59 = b59.log.filter(function (l) { return / attacks for \d+ damage\.$/.test(l); }).pop();
var hit3_59 = parseInt(hit3Line59.match(/for (\d+) damage/)[1], 10);
assert(b59.log.some(function (l) { return l.indexOf('Rage fades') !== -1; }), 'Rage buff expiry logged after its 3rd turn');

Game.Battle.attack(); // 4th monster counter — buff already expired, mitigation reverts
var hit4Line59 = b59.log.filter(function (l) { return / attacks for \d+ damage\.$/.test(l); }).pop();
var hit4_59 = parseInt(hit4Line59.match(/for (\d+) damage/)[1], 10);

assert(hit1_59 === hit2_59 && hit2_59 === hit3_59, 'all 3 buffed hits take identical (reduced) damage: ' + JSON.stringify([hit1_59, hit2_59, hit3_59]));
assert(hit4_59 === hit1_59 + BALANCE.LB_RAGE_ARMOR_BONUS, 'once the buff expires, damage rises by exactly the ' + BALANCE.LB_RAGE_ARMOR_BONUS + ' Armor it granted: buffed ' + hit1_59 + ', unbuffed ' + hit4_59);
Game.Battle.endBattle();

// =================== Test 60: v1.4 P4 (G3) — Dragon Kick's dodge-debuff rider ===================
console.log('\n=== Test 60: Dragon Kick limit-break rider — flat dodge-chance reduction, floored at 0 ===');
var c60 = makeCharacter({ name: 'DragonKickTest' });
c60.dexterity = 20; // playerFirst
c60.hitPoints = c60.hitPointsMax = 1000000;
c60.energy = c60.energyMax = 1000000;
Game.Classes.obtainClass(c60, 'thief');
c60.fury = BALANCE.LB_FURY_MIN;
setRng(fixedRng(0.5));
var b60 = Game.Battle.start('plains_field_rat');
b60.monster.techs = [];
b60.monster.hp = b60.monster.hpMax = 1000000;
assert(b60.monster.dodgeDebuff === undefined, 'sanity: no dodge debuff before the Limit Break');
Game.Battle.limitBreak();
assert(b60.log.some(function (l) { return l.indexOf('shatters') !== -1; }), 'Dragon Kick rider logged');
assert(b60.monster.dodgeDebuff === BALANCE.LB_DRAGON_KICK_DODGE_DEBUFF, 'Dragon Kick applies its flat dodge-chance debuff exactly once, got ' + b60.monster.dodgeDebuff);

// Floor at 0: force the debuff far past the monster's own dodge chance, then confirm even a
// forced rng=0 (which would otherwise dodge ANY positive chance) fails to dodge a plain Attack.
b60.monster.dodgeDebuff = 999;
setRng(fixedRng(0.0));
var monsterHpBefore60 = b60.monster.hp;
Game.Battle.attack();
assert(monsterHpBefore60 > b60.monster.hp, 'a monster whose dodge chance is floored at 0 can never dodge — the attack connected');
assert(!b60.log.some(function (l) { return l.indexOf('dodges your attack') !== -1; }), 'no dodge log line — the floor at 0 held even against a forced rng=0 roll');
Game.Battle.endBattle();

// =================== Test 61: v1.4 P4 (G3) — Hurricane Blow's no-dodge rider ===================
console.log('\n=== Test 61: Hurricane Blow limit-break rider — bypasses the monster\'s dodge roll for this strike ===');
var c61 = makeCharacter({ name: 'HurricaneBlowTest' });
c61.dexterity = 20; // playerFirst
c61.hitPoints = c61.hitPointsMax = 1000000;
c61.energy = c61.energyMax = 1000000;
Game.Classes.obtainClass(c61, 'magician');
c61.fury = BALANCE.LB_FURY_MIN;
setRng(fixedRng(0.0)); // 0.0 would dodge ANY positive dodge chance, if the roll were even made
var b61 = Game.Battle.start('plains_field_rat');
b61.monster.techs = [];
b61.monster.hp = b61.monster.hpMax = 1000000;
var monsterHpBefore61 = b61.monster.hp;
Game.Battle.limitBreak();
assert(b61.monster.hp < monsterHpBefore61, 'Hurricane Blow auto-connects even at a forced rng=0 dodge roll — monster HP dropped');
assert(!b61.log.some(function (l) { return l.indexOf('dodges your Hurricane Blow') !== -1; }), 'no dodge log line for Hurricane Blow — its dodge roll is skipped entirely');
Game.Battle.endBattle();

// =================== Test 62: v1.4 P4 (G3) — Fury still ticks on the NEXT win after a Limit Break ===================
console.log('\n=== Test 62: using a Limit Break then winning still grants the next Fury tick ===');
var c62 = makeCharacter({ name: 'LbThenWinFuryTick' });
c62.dexterity = 20; // playerFirst
Game.Character.recalcDerived(c62);
c62.hitPoints = c62.hitPointsMax = 1000000;
c62.energy = c62.energyMax = 1000000;
Game.Classes.obtainClass(c62, 'warrior');
c62.fury = BALANCE.LB_FURY_MIN;
setRng(fixedRng(0.5));
var b62 = Game.Battle.start('plains_field_rat'); // level 1, at-or-above the player's own level (1) -> qualifies for the fury tick
b62.monster.techs = [];
b62.monster.energy = b62.monster.energyMax = 1000000;
Game.Battle.limitBreak();
assert(c62.fury === 0, 'sanity: Limit Break spent the whole streak');
b62.monster.hp = 1; // next hit kills, regardless of exact damage (the 1-damage floor always applies)
setRng(fixedRng(0.99)); // clears every dodge/glancing/double-attack/gold/shard/drop check that follows
Game.Battle.attack();
assert(b62.phase === 'won', 'battle won after the Limit Break');
assert(c62.fury === 1, 'a fresh Fury tick (+1) is still granted on the very next win after spending a Limit Break, got ' + c62.fury);
Game.Battle.endBattle();

// =================== Test 63: v1.4 UX transparency pass — statInfo data + openStat/openTech ranges ===================
console.log('\n=== Test 63: Game.Data.statInfo presence + openStat renders + openTech damage/heal RANGES ===');

var STAT_INFO_KEYS = ['strength', 'vitality', 'dexterity', 'intelligence', 'endurance', 'hitPoints', 'energy'];
STAT_INFO_KEYS.forEach(function (key) {
  var info = Game.Data.statInfo && Game.Data.statInfo[key];
  assert(!!info && typeof info.name === 'string' && typeof info.summary === 'string' &&
    Array.isArray(info.effects) && info.effects.length > 0 && typeof info.cite === 'string',
    'Game.Data.statInfo has a complete {name, summary, effects[], cite} entry for "' + key + '"');
});

// fakedom quirk (tests/fakedom.js): the overlay div infobox.js creates is never registered via
// document.registerId, so document.getElementById('infobox-overlay') (what the real browser DOM
// would resolve automatically) always returns null here, and close()'s own `if (overlay)` guard
// then makes it a harmless no-op instead of throwing. The freshest overlay is instead just the
// last child appended to document.body (every open* call ends with document.body.appendChild).
function lastOverlay() {
  var kids = document.body.children;
  return kids.length ? kids[kids.length - 1] : null;
}

function overlayRowValue(overlay, label) {
  var rows = overlay.queryAllByClass('stat-row');
  for (var i = 0; i < rows.length; i++) {
    var nameSpan = rows[i].queryAllByClass('stat-name')[0];
    if (nameSpan && nameSpan.textContent === label) {
      var kids = rows[i].children;
      return kids[kids.length - 1].textContent;
    }
  }
  return null;
}

var c63 = makeCharacter({ name: 'InfoTest63' });
Game.state.character = c63;
Game.state.battle = null;

try {
  STAT_INFO_KEYS.forEach(function (key) {
    Game.Infobox.openStat(key, c63);
    var ov = lastOverlay();
    var expectedName = Game.Data.statInfo[key].name;
    assert(!!ov && ov.textContent.indexOf(expectedName) !== -1, 'openStat(' + key + ') renders its name (' + expectedName + ') without throwing');
    Game.Infobox.close();
  });
  console.log('PASS: openStat renders for every statInfo key without throwing');
} catch (e) { failures++; console.error('FAIL: openStat threw: ' + e.stack); }

var RANGE_RE = /^\d+–\d+/;

// weapon tech: Cleave I (tech_cleave_1, weaponTech:true) — "Scales with" cites the weapon, and
// Effective Damage is a lo-hi range with the enemy-defenses caveat.
Game.Infobox.openTech(Game.Battle.getTech('tech_cleave_1'), c63);
var cleaveOverlay = lastOverlay();
var cleaveScales = overlayRowValue(cleaveOverlay, 'Scales with');
var cleaveDmg = overlayRowValue(cleaveOverlay, 'Effective Damage');
assert(!!cleaveScales && cleaveScales.indexOf("weapon's Damage") !== -1, 'weapon tech "Scales with" cites the weapon\'s Damage, got "' + cleaveScales + '"');
assert(!!cleaveDmg && RANGE_RE.test(cleaveDmg), 'weapon tech Effective Damage shows a lo–hi range, got "' + cleaveDmg + '"');
assert(!!cleaveDmg && cleaveDmg.indexOf('(before enemy defenses)') !== -1, 'weapon tech Effective Damage notes "(before enemy defenses)", got "' + cleaveDmg + '"');
Game.Infobox.close();

// spell damage tech: Firebolt I (tech_firebolt_1) — "Scales with" is Intelligence.
Game.Infobox.openTech(Game.Battle.getTech('tech_firebolt_1'), c63);
var fireOverlay = lastOverlay();
var fireScales = overlayRowValue(fireOverlay, 'Scales with');
var fireDmg = overlayRowValue(fireOverlay, 'Effective Damage');
assert(fireScales === 'Intelligence', 'spell tech "Scales with" is Intelligence, got "' + fireScales + '"');
assert(!!fireDmg && RANGE_RE.test(fireDmg), 'spell tech Effective Damage shows a lo–hi range, got "' + fireDmg + '"');
Game.Infobox.close();

// healing tech: Mend Wounds I (tech_mend_wounds_1, effect:'heal') — Effective Healing is a range
// too, but with NO "(before enemy defenses)" caveat (healing isn't mitigated).
Game.Infobox.openTech(Game.Battle.getTech('tech_mend_wounds_1'), c63);
var healOverlay = lastOverlay();
var healValue = overlayRowValue(healOverlay, 'Effective Healing');
assert(!!healValue && RANGE_RE.test(healValue), 'healing tech Effective Healing shows a lo–hi range, got "' + healValue + '"');
assert(!!healValue && healValue.indexOf('before enemy defenses') === -1, 'healing tech range has no "before enemy defenses" caveat, got "' + healValue + '"');
Game.Infobox.close();

// =================== Test 64: v1.4 UX transparency pass — in-combat "ⓘ" affordances ===================
console.log('\n=== Test 64: battle-screen ⓘ affordances (Attack/Defend/Limit Break/tech slot/item row) never trigger the action ===');
var c64 = makeCharacter({ name: 'BattleInfoTest' });
c64.dexterity = 20; // playerFirst, deterministic ordering
Game.Character.recalcDerived(c64);
Game.Classes.obtainClass(c64, 'warrior'); // grants the Rage limit break so its ⓘ renders too
Game.state.character = c64;
Game.state.battle = null;
setRng(fixedRng(0.99));
var b64 = Game.Battle.start('plains_field_rat');
b64.monster.techs = [];
Game.Screens.navigate('battle');

var infoBtns64 = mc.queryAllByClass('info-btn');
assert(infoBtns64.length > 0, 'battle screen renders at least one ⓘ info-btn');

// Attack ⓘ opens an info window and does NOT spend Energy or attack the monster.
var actionBtns64 = mc.queryAllByClass('battle-action');
// 4 base actions (Attack/Item/Defend/Escape) + the Limit Break button (also class="battle-action",
// unlike Test 4's classless character above) — this character obtained the warrior base class, so
// Game.Battle.getLimitBreak renders one. Confirms the new ⓘ siblings (class "info-btn" only)
// don't get swept into this count.
assert(actionBtns64.length === 5, 'Attack/Item/Defend/Escape + Limit Break all render as .battle-action, got ' + actionBtns64.length);
var actionsDiv64 = actionBtns64[0].parent;
var attackInfoBtn = actionsDiv64.children[actionsDiv64.children.indexOf(actionBtns64[0]) + 1];
assert(!!attackInfoBtn && attackInfoBtn.className.indexOf('info-btn') !== -1, 'Attack button is immediately followed by its ⓘ sibling');
var energyBefore64 = c64.energy, monsterHpBefore64 = b64.monster.hp;
attackInfoBtn.click();
assert(c64.energy === energyBefore64 && b64.monster.hp === monsterHpBefore64, 'clicking the Attack ⓘ spent no Energy and dealt no damage');
var attackOverlay = lastOverlay();
assert(overlayRowValue(attackOverlay, 'Scales with') === "your weapon's Damage", 'Attack info window cites "your weapon\'s Damage"');
var attackDmgRow = overlayRowValue(attackOverlay, 'Damage');
assert(!!attackDmgRow && RANGE_RE.test(attackDmgRow), 'Attack info window shows a lo–hi Damage range, got "' + attackDmgRow + '"');
Game.Infobox.close();

// Defend ⓘ opens an info window and does NOT spend Energy or brace.
var defendInfoBtn = actionsDiv64.children[actionsDiv64.children.indexOf(actionBtns64[2]) + 1];
assert(!!defendInfoBtn && defendInfoBtn.className.indexOf('info-btn') !== -1, 'Defend button is immediately followed by its ⓘ sibling');
var energyBeforeDefendInfo = c64.energy;
defendInfoBtn.click();
assert(c64.energy === energyBeforeDefendInfo && !b64.playerDefending, 'clicking the Defend ⓘ spent no Energy and did not brace');
assert(lastOverlay().textContent.indexOf('Brace') !== -1, 'Defend info window shows the Brace description');
Game.Infobox.close();

// Tech slot ⓘ opens tech info and does NOT cast the tech.
var slotInfoBtns64 = mc.queryAllByClass('tech-slot-info');
assert(slotInfoBtns64.length === 1, 'exactly one filled tech slot (the starter tech) carries a ⓘ badge, got ' + slotInfoBtns64.length);
var mHpBeforeSlotInfo = b64.monster.hp;
slotInfoBtns64[0].click();
assert(b64.monster.hp === mHpBeforeSlotInfo, "clicking a tech slot's ⓘ badge did not cast the tech");
assert(lastOverlay().textContent.indexOf('Cleave') !== -1, 'tech-slot ⓘ opened Cleave I\'s info window');
Game.Infobox.close();

// Limit Break ⓘ opens an info window and does NOT consume the Fury streak.
var lb64 = Game.Battle.getLimitBreak(c64);
assert(!!lb64 && lb64.name === 'Rage', 'sanity: the warrior base class grants the Rage limit break');
var lbInfoBtn = mc.queryAllByClass('info-btn').filter(function (n) { return n.title === 'About ' + lb64.name; })[0];
assert(!!lbInfoBtn, 'Limit Break button carries a ⓘ info affordance');
var furyBeforeLbInfo = c64.fury;
lbInfoBtn.click();
assert(c64.fury === furyBeforeLbInfo, 'clicking the Limit Break ⓘ did not consume the Fury streak');
var lbDmgRow = overlayRowValue(lastOverlay(), 'Damage');
assert(!!lbDmgRow && RANGE_RE.test(lbDmgRow), 'Limit Break info window shows a lo–hi Damage range, got "' + lbDmgRow + '"');
Game.Infobox.close();

// Item ⓘ (in the expanded combat-item list) opens the item's own info window and does NOT use it.
actionBtns64[1].click(); // toggle the item list open (re-renders the battle screen)
var itemRows64 = mc.queryAllByClass('stat-row').filter(function (row) {
  return row.queryAllByTag('button').some(function (b) { return b.textContent === 'Use'; });
});
assert(itemRows64.length > 0, 'expanded item list renders at least one combat-usable item row');
var itemInfoBtn = itemRows64[0].queryAllByClass('info-btn')[0];
assert(!!itemInfoBtn, 'item row carries an ⓘ info affordance');
var energyBeforeItemInfo = c64.energy;
itemInfoBtn.click();
assert(c64.energy === energyBeforeItemInfo, "clicking an item row's ⓘ did not use the item (Energy unchanged)");
var itemOverlayHasTabs = lastOverlay().queryAllByClass('infobox-tabs').length > 0;
assert(itemOverlayHasTabs, 'item ⓘ opened the item info window (Info/Reqs tabs — Game.Infobox.open, not openPanel/openTech)');
Game.Infobox.close();
Game.Battle.endBattle();

// =================== Test 65: v1.5 P1 — telegraph wind-up (forced rng) ===================
console.log('\n=== Test 65: v1.5 P1 telegraph wind-up — forced rng winds up instead of acting: charge set, no damage, logged ===');
function windUpFixture(name, skills) {
  var c = makeCharacter({ name: name, skills: skills });
  c.dexterity = 20; // playerFirst vs a level-1 monster
  c.level = 1; // matches plains_field_rat's level -> no Fear complicating the mitigation math
  c.endurance = 0; // zero the player's own Endurance mitigation term
  c.equipment.body = null; // strip the auto-equipped starter tunic so getArmor() is exactly 0
  return c;
}
function finalizeFixture(c) {
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax = 100000;
  c.energy = c.energyMax = 100000;
}

var cTel65 = windUpFixture('TelegraphWindup');
finalizeFixture(cTel65);
// rng 0.10 is < TELEGRAPH_CHARGE_CHANCE (0.15) -- forces the wind-up. Harmless elsewhere in this
// fixture: double-attack chance (dex 20 -> 0.06) and the level-1 monster's own dodge chance
// (~0.024) are both well under 0.10, and GLANCING_CHANCE (0.10) is not itself < 0.10.
setRng(fixedRng(0.10));
var b65 = Game.Battle.start('plains_field_rat');
b65.monster.behavior = 'telegraph'; // battle-transient override — never touches the shared def
b65.monster.techs = [];
b65.monster.hp = b65.monster.hpMax = 100000;
b65.monster.damage = 100;
var playerHpBefore65 = b65.player.hitPoints;
Game.Battle.attack(); // player's turn; the monster's counter winds up instead of attacking
assert(!!b65.charge && b65.charge.mult === BALANCE.AFFIX_CHARGED_MULT, 'monster winds up: battle.charge set with mult=' + BALANCE.AFFIX_CHARGED_MULT + ', got ' + JSON.stringify(b65.charge));
assert(b65.player.hitPoints === playerHpBefore65, 'the wind-up deals no damage — player HP unchanged this monster turn');
assert(b65.log.some(function (l) { return l.indexOf('rears back') !== -1; }), 'wind-up announced in the battle log');

// =================== Test 66: v1.5 P1 — telegraph release ~= 2x a normal hit; charge cleared ===================
console.log('\n=== Test 66: v1.5 P1 telegraph release — charged damage ~= ' + BALANCE.AFFIX_CHARGED_MULT + 'x a normal hit (same fixed rng), battle.charge cleared ===');
Game.Battle.attack(); // b65 is still Game.state.battle -- player's 2nd turn; the monster releases
var releaseLine65 = b65.log.filter(function (l) { return l.indexOf('unleashes its charged blow') !== -1; }).pop();
assert(!!releaseLine65, 'release logged');
var chargedDmg65 = parseInt(releaseLine65.match(/for (\d+) damage/)[1], 10);
assert(b65.charge === null, 'battle.charge cleared after the release');
Game.Battle.endBattle();

// Baseline: a FRESH, non-telegraph battle (behavior left absent -> 'simple'), same fixed rng,
// same character/monster setup — measures what a plain (unmultiplied) hit deals through the
// IDENTICAL pipeline, so the ratio to chargedDmg65 above isolates AFFIX_CHARGED_MULT alone.
var cBase66 = windUpFixture('TelegraphBaseline');
finalizeFixture(cBase66);
setRng(fixedRng(0.10));
var bBase66 = Game.Battle.start('plains_field_rat');
bBase66.monster.techs = [];
bBase66.monster.hp = bBase66.monster.hpMax = 100000;
bBase66.monster.damage = 100;
Game.Battle.attack(); // a normal (non-telegraph) monster counter-attack
var baseLine66 = bBase66.log.filter(function (l) { return / attacks for \d+ damage\.$/.test(l); }).pop();
var baseDmg66 = parseInt(baseLine66.match(/for (\d+) damage/)[1], 10);
assert(Math.abs(chargedDmg65 - baseDmg66 * BALANCE.AFFIX_CHARGED_MULT) <= 1, 'charged release damage ~= ' + BALANCE.AFFIX_CHARGED_MULT + 'x a normal hit (baseline ' + baseDmg66 + ', charged ' + chargedDmg65 + ', expected ~' + (baseDmg66 * BALANCE.AFFIX_CHARGED_MULT) + ')');
Game.Battle.endBattle();

// =================== Test 67: v1.5 P1 — Defend halves the released charged hit ===================
console.log('\n=== Test 67: v1.5 P1 — Defending during the wind-up window halves the released charged hit ===');
var cDef67 = windUpFixture('TelegraphDefend');
finalizeFixture(cDef67);
setRng(fixedRng(0.10));
var b67 = Game.Battle.start('plains_field_rat');
b67.monster.behavior = 'telegraph';
b67.monster.techs = [];
b67.monster.hp = b67.monster.hpMax = 100000;
b67.monster.damage = 100;
Game.Battle.attack(); // wind-up
assert(!!b67.charge, 'sanity: charge pending going into the defended release');
Game.Battle.defend(); // the player's window: Defend instead of attacking
var defendedLine67 = b67.log.filter(function (l) { return l.indexOf('unleashes its charged blow') !== -1; }).pop();
assert(!!defendedLine67, 'defended release still logged');
var defendedDmg67 = parseInt(defendedLine67.match(/for (\d+) damage/)[1], 10);
assert(Math.abs(defendedDmg67 - Math.round(chargedDmg65 * BALANCE.DEFEND_DAMAGE_MULT)) <= 1, 'Defend halves the released charged hit: undefended ' + chargedDmg65 + ', defended ' + defendedDmg67 + ', expected ~' + Math.round(chargedDmg65 * BALANCE.DEFEND_DAMAGE_MULT));
assert(b67.charge === null, 'charge cleared after the defended release');
Game.Battle.endBattle();

// =================== Test 68: v1.5 P1 — Interrupt (the offensive answer) ===================
console.log('\n=== Test 68: v1.5 P1 Interrupt — a hit >= threshold cancels the charge; a hit < threshold leaves it for a full release; a Limit Break always cancels ===');

// All four cases below use a two-phase rng swap: a LOW constant (0.05, < TELEGRAPH_CHARGE_CHANCE
// 0.15) for the wind-up-triggering turn, then a fresh constant for the interrupt-attempt turn.
// This matters because interrupting clears battle.charge SYNCHRONOUSLY inside the player's own
// action function, before that same action's finishRound->monsterAct call runs — so by the time
// monsterAct checks `releasing = !!battle.charge`, it already reads false and falls through to a
// FRESH wind-up roll (the monster "resumes normal behavior next turn", which can legitimately
// include re-telegraphing). A single constant rng across both turns would make that fresh roll
// re-fire every time (since 0.05 < 0.15 unconditionally), masking whether the interrupt itself
// worked. Using >= 0.15 for the second phase's own wind-up-reroll keeps the post-interrupt
// assertions unambiguous.

// Case A: a hit >= INTERRUPT_THRESHOLD_HP_FRAC of the monster's max HP cancels the charge.
var cA68 = windUpFixture('InterruptAboveThreshold');
finalizeFixture(cA68);
setRng(fixedRng(0.05));
var bA68 = Game.Battle.start('plains_field_rat');
bA68.monster.behavior = 'telegraph';
bA68.monster.techs = [];
bA68.monster.armor = 0;
bA68.monster.hp = bA68.monster.hpMax = 100000; // threshold = round(100000*0.15) = 15000
Game.Battle.attack(); // wind-up (a weak default-stat hit to the monster -- negligible against 100000 hp)
assert(!!bA68.charge, 'sanity: charge pending before the interrupt attempt');

cA68.strength = 100000; // NOW boost strength so this turn's hit clears the 15000 threshold
Game.Character.recalcDerived(cA68);
cA68.hitPoints = cA68.hitPointsMax = 100000;
cA68.energy = cA68.energyMax = 100000;
setRng(fixedRng(0.99)); // clean single-hit turn: no double-attack/monster-dodge/glancing, and >= 0.15 avoids a fresh wind-up reroll after the clear
Game.Battle.attack(); // the player's window: a heavy hit
assert(bA68.charge === null, 'a hit >= the interrupt threshold cancels the charge');
assert(bA68.log.some(function (l) { return l.indexOf('charge collapses') !== -1; }), 'interrupt logged');
Game.Battle.endBattle();

// Case B: a hit BELOW the threshold leaves the charge untouched -- the monster's own counter to
// that SAME failed-interrupt turn then releases in full (charge persists -> monsterAct's
// `releasing` branch fires directly, bypassing the wind-up reroll entirely).
var cB68 = windUpFixture('InterruptBelowThreshold');
finalizeFixture(cB68);
setRng(fixedRng(0.05));
var bB68 = Game.Battle.start('plains_field_rat');
bB68.monster.behavior = 'telegraph';
bB68.monster.techs = [];
bB68.monster.armor = 0;
bB68.monster.hp = bB68.monster.hpMax = 100000; // threshold 15000, far above a default-character hit
Game.Battle.attack(); // wind-up
assert(!!bB68.charge, 'sanity: charge pending before the sub-threshold attack');
setRng(fixedRng(0.99)); // default (un-boosted) stats -> a weak hit, comfortably below 15000 either way; clean single-hit turn
Game.Battle.attack(); // the player's window: a weak hit (fails to interrupt) -- the monster's own counter to THIS turn releases in full
assert(bB68.log.some(function (l) { return l.indexOf('unleashes its charged blow') !== -1; }), 'the full release happens on schedule when the weak hit failed to interrupt it');
assert(bB68.charge === null, 'charge cleared after releasing in full');
Game.Battle.endBattle();

// Case C: a Limit Break ALWAYS interrupts, regardless of its own damage -- even when DODGED
// (0 damage dealt).
var cC68 = windUpFixture('InterruptLimitBreak');
Game.Classes.obtainClass(cC68, 'warrior');
cC68.fury = BALANCE.LB_FURY_MIN;
finalizeFixture(cC68);
setRng(fixedRng(0.05));
var bC68 = Game.Battle.start('plains_field_rat');
bC68.monster.behavior = 'telegraph';
bC68.monster.techs = [];
bC68.monster.hp = bC68.monster.hpMax = 100000;
Game.Battle.attack(); // wind-up
assert(!!bC68.charge, 'sanity: charge pending before the Limit Break');
// First rng() call (the LB's own dodge-of-attack roll) forces a DODGE (< the level-1 monster's
// ~0.024 dodge chance); every call after (the fresh wind-up-reroll, etc.) falls back to 0.99.
setRng(seqRng([0.01], 0.99));
Game.Battle.limitBreak();
assert(bC68.log.some(function (l) { return l.indexOf('dodges your') !== -1; }), 'sanity: the Limit Break itself was dodged (0 damage dealt)');
assert(bC68.charge === null, 'a Limit Break cancels a pending charge even when dodged (0 damage) -- "regardless of its damage"');
assert(bC68.log.some(function (l) { return l.indexOf('charge collapses') !== -1; }), 'interrupt logged for the dodged Limit Break');
Game.Battle.endBattle();

// Case D: Interrupt also fires from a damaging tech cast (useTech), not just attack()/limitBreak().
var cD68 = windUpFixture('InterruptViaTech', { 'Evocation': 3 });
finalizeFixture(cD68);
setRng(fixedRng(0.05));
var bD68 = Game.Battle.start('plains_field_rat');
bD68.monster.behavior = 'telegraph';
bD68.monster.techs = [];
bD68.monster.armor = 0;
bD68.monster.magicArmor = 0;
bD68.monster.hp = bD68.monster.hpMax = 100000; // threshold 15000
Game.Battle.attack(); // wind-up (a plain weak attack this turn, not the tech)
assert(!!bD68.charge, 'sanity: charge pending before the tech cast');

cD68.intelligence = 100000; // NOW boost Intelligence so the cast both guarantees a hit (Int hit/miss) and clears the threshold
Game.Character.recalcDerived(cD68);
cD68.hitPoints = cD68.hitPointsMax = 100000;
cD68.energy = cD68.energyMax = 100000;
setRng(fixedRng(0.20)); // < INT_SPELL_HIT_MAX (0.98, so the cast always hits) and >= GLANCING_CHANCE (0.1, no glancing); also >= TELEGRAPH_CHARGE_CHANCE (0.15) so it avoids a fresh wind-up reroll after the clear
Game.Battle.useTech('tech_firebolt_1');
assert(bD68.charge === null, 'a damaging tech cast (useTech) also interrupts a pending charge when it clears the threshold');
Game.Battle.endBattle();

// =================== Test 69: v1.5 P1 regression — a simple monster never sets battle.charge ===================
console.log('\n=== Test 69: v1.5 P1 regression — a simple (behavior absent) monster never sets battle.charge across several rounds ===');
var c69 = makeCharacter({ name: 'SimpleRegression' });
c69.dexterity = 20;
c69.hitPoints = c69.hitPointsMax = 100000;
c69.energy = c69.energyMax = 100000;
setRng(fixedRng(0.01)); // well below TELEGRAPH_CHARGE_CHANCE -- would trigger a wind-up if this monster telegraphed
var b69 = Game.Battle.start('plains_field_rat'); // behavior absent -> 'simple' (today's AI, unchanged)
assert(b69.monster.behavior === undefined, 'sanity: plains_field_rat carries no behavior field (defaults to simple)');
for (var round69 = 0; round69 < 5; round69++) {
  if (b69.phase !== 'active') break;
  Game.Battle.attack();
}
assert(!b69.charge, 'a simple monster never sets battle.charge across 5 rounds, got ' + JSON.stringify(b69.charge));
Game.Battle.endBattle();

// =================== Test 70: v1.5 P2 — caster raises tech inclination ===================
console.log('\n=== Test 70: v1.5 P2 caster — raised tech inclination (CASTER_TECH_CHANCE) casts where a simple monster at the same rng would basic-attack ===');
// rng = 0.6: below CASTER_TECH_CHANCE (0.75, so a caster's tech roll fires) but above the default
// 0.5 (so a simple monster's tech roll does NOT fire) -- isolates the raised inclination alone.
// Also well above TELEGRAPH_CHARGE_CHANCE (0.15), so neither battle winds up this turn, and above
// every other small proc threshold in this fixture (monster dodge, GLANCING_CHANCE 0.10,
// double-attack chance for dex 20 ~0.06) -- a clean single-action turn, same discipline as the
// 0.20 constant used in Test 68 Case D above.
var cCaster70 = windUpFixture('CasterTechChance');
finalizeFixture(cCaster70);
setRng(fixedRng(0.6));
var b70 = Game.Battle.start('plains_field_rat');
b70.monster.behavior = 'caster';
b70.monster.techs = ['mon_gnawing_bite'];
b70.monster.energy = 1000;
b70.monster.hp = b70.monster.hpMax = 100000;
b70.monster.damage = 100;
Game.Battle.attack();
assert(!b70.charge, 'sanity: rng 0.6 is above TELEGRAPH_CHARGE_CHANCE (0.15) -- no wind-up this turn');
assert(b70.log.some(function (l) { return l.indexOf('uses Gnawing Bite') !== -1; }), 'caster monster (techChance=' + BALANCE.CASTER_TECH_CHANCE + ') casts its tech at rng 0.6');
Game.Battle.endBattle();

var cSimple70 = windUpFixture('SimpleTechChanceBaseline');
finalizeFixture(cSimple70);
setRng(fixedRng(0.6));
var bBase70 = Game.Battle.start('plains_field_rat'); // behavior absent -> 'simple', techChance 0.5
bBase70.monster.techs = ['mon_gnawing_bite'];
bBase70.monster.energy = 1000;
bBase70.monster.hp = bBase70.monster.hpMax = 100000;
bBase70.monster.damage = 100;
Game.Battle.attack();
assert(bBase70.log.some(function (l) { return / attacks for \d+ damage\.$/.test(l); }), 'a simple monster at the SAME rng (0.6, above its default 0.5 tech inclination) basic-attacks instead');
assert(!bBase70.log.some(function (l) { return l.indexOf('uses Gnawing Bite') !== -1; }), 'sanity: the simple baseline did not cast the tech');
Game.Battle.endBattle();

// =================== Test 71: v1.5 P2 — caster can still wind up ===================
console.log('\n=== Test 71: v1.5 P2 caster — still telegraph-capable at the normal TELEGRAPH_CHARGE_CHANCE ===');
var cCasterWindup71 = windUpFixture('CasterWindup');
finalizeFixture(cCasterWindup71);
setRng(fixedRng(0.10)); // < TELEGRAPH_CHARGE_CHANCE (0.15) -- forces the wind-up, same as Test 65
var b71 = Game.Battle.start('plains_field_rat');
b71.monster.behavior = 'caster';
b71.monster.techs = [];
b71.monster.hp = b71.monster.hpMax = 100000;
b71.monster.damage = 100;
Game.Battle.attack();
assert(!!b71.charge && b71.charge.mult === BALANCE.AFFIX_CHARGED_MULT, 'a caster monster winds up too (same TELEGRAPH_CHARGE_CHANCE as telegraph): battle.charge set, got ' + JSON.stringify(b71.charge));
assert(b71.log.some(function (l) { return l.indexOf('rears back') !== -1; }), 'caster wind-up announced in the battle log');
Game.Battle.endBattle();

// =================== Test 72: v1.5 P2 — enrage at full HP uses the base wind-up chance ===================
console.log('\n=== Test 72: v1.5 P2 enrage at full HP — wind-up chance is the base TELEGRAPH_CHARGE_CHANCE (0.15), not the boosted rate ===');
// rng = 0.20 sits between TELEGRAPH_CHARGE_CHANCE (0.15) and TELEGRAPH_CHARGE_CHANCE*ENRAGE_CHARGE_MULT
// (0.30) -- it must NOT fire the base rate (this test) but MUST fire the boosted enraged rate
// (Test 73), isolating the multiplier's effect.
var cEnrageFull72 = windUpFixture('EnrageFullHP');
finalizeFixture(cEnrageFull72);
setRng(fixedRng(0.20));
var b72 = Game.Battle.start('plains_field_rat');
b72.monster.behavior = 'enrage';
b72.monster.techs = [];
b72.monster.hp = b72.monster.hpMax = 100000; // full HP -- well above ENRAGE_HP_FRAC even after this turn's hit
b72.monster.damage = 100;
Game.Battle.attack();
assert(b72.monster.hp / b72.monster.hpMax >= BALANCE.ENRAGE_HP_FRAC, 'sanity: monster stays at/above ENRAGE_HP_FRAC after taking the player\'s hit this turn');
assert(!b72.charge, 'enrage monster at full HP: base wind-up chance (0.15) does not fire at rng 0.20, got ' + JSON.stringify(b72.charge));
Game.Battle.endBattle();

// =================== Test 73: v1.5 P2 — enrage below ENRAGE_HP_FRAC boosts the wind-up chance ===================
console.log('\n=== Test 73: v1.5 P2 enrage below ENRAGE_HP_FRAC — wind-up chance x' + BALANCE.ENRAGE_CHARGE_MULT + ' fires at an rng value that would NOT have fired at full HP ===');
var cEnrageLow73 = windUpFixture('EnrageLowHP');
finalizeFixture(cEnrageLow73);
setRng(fixedRng(0.20)); // identical rng to Test 72 -- only the HP fraction differs
var b73 = Game.Battle.start('plains_field_rat');
b73.monster.behavior = 'enrage';
b73.monster.techs = [];
b73.monster.hpMax = 100000;
b73.monster.hp = 25000; // 25% of hpMax -- below ENRAGE_HP_FRAC (0.30): wind-up chance x2.0 -> 0.30
b73.monster.damage = 100;
Game.Battle.attack();
assert(b73.monster.hp / b73.monster.hpMax < BALANCE.ENRAGE_HP_FRAC, 'sanity: monster remains below ENRAGE_HP_FRAC after taking the player\'s hit this turn');
assert(!!b73.charge && b73.charge.mult === BALANCE.AFFIX_CHARGED_MULT, 'enraged monster (wind-up chance ' + BALANCE.TELEGRAPH_CHARGE_CHANCE + 'x' + BALANCE.ENRAGE_CHARGE_MULT + '=' + (BALANCE.TELEGRAPH_CHARGE_CHANCE * BALANCE.ENRAGE_CHARGE_MULT) + ') winds up at rng 0.20 -- the SAME rng that did not fire at full HP in Test 72 -- proving the boost, got ' + JSON.stringify(b73.charge));
assert(b73.log.some(function (l) { return l.indexOf('rears back') !== -1; }), 'enraged wind-up announced in the battle log');
Game.Battle.endBattle();

// =================== Test 74: v1.5 P2 — data integrity: journey-ramp behavior assignment ===================
console.log('\n=== Test 74: v1.5 P2 data integrity — level<=10 monsters stay simple; >=60% of L40+ non-boss monsters carry a non-simple behavior ===');
var lowLevelNonSimple = Game.Data.monsters.filter(function (m) {
  return m.level <= 10 && m.behavior !== undefined && m.behavior !== 'simple';
});
assert(lowLevelNonSimple.length === 0, 'every level<=10 monster has no behavior set (or simple) -- new players never meet a telegraph before learning the basics, got: ' + lowLevelNonSimple.map(function (m) { return m.id + '=' + m.behavior; }).join(', '));

var lateNonBoss = Game.Data.monsters.filter(function (m) { return m.level >= 40 && !m.boss; });
var lateNonSimple = lateNonBoss.filter(function (m) { return m.behavior !== undefined && m.behavior !== 'simple'; });
var lateNonSimplePct = lateNonSimple.length / lateNonBoss.length;
assert(lateNonSimplePct >= 0.60, '>=60% of level>=40 non-boss monsters carry a non-simple behavior (the journey-ramp target, spec §5/§10 M5): got ' + lateNonSimple.length + '/' + lateNonBoss.length + ' = ' + (lateNonSimplePct * 100).toFixed(1) + '%');
// Every non-simple behavior actually used must be one of the archetypes shipped so far (P1's
// telegraph + P2's caster/enrage + P3's guardian/reactive).
var knownBehaviors = { telegraph: true, caster: true, enrage: true, guardian: true, reactive: true };
var unknownBehaviors = Game.Data.monsters.filter(function (m) { return m.behavior !== undefined && !knownBehaviors[m.behavior]; });
assert(unknownBehaviors.length === 0, 'no monster carries an unknown behavior, got: ' + unknownBehaviors.map(function (m) { return m.id + '=' + m.behavior; }).join(', '));

// =================== Test 74b: v1.5 P3 data integrity — boss behavior integration ===================
// A first pass assigned telegraph/enrage/reactive to all 10 non-gate bosses, but a real-RNG re-sim
// (this file's own Test 32/35/38/41/44/47 win-rate floors, plus test_p6b_content.js's eidas_echo
// beats-check) caught a genuine difficulty-contract regression: a charged release
// (BALANCE.AFFIX_CHARGED_MULT=2.0) can land as a single spike that crosses BOTH the sim AI's
// heal-at-low-HP trigger AND the death threshold in the same hit -- something the item-reactive AI
// (a stand-in for a non-optimal real player) can only respond to BETWEEN actions, not mid-hit. Win
// rates on majiku_warlord/majiku_ridge_chieftain/ukai_deep_dweller/estari_warden_prime/
// society_anima_horror/eidas_ascendant/eidas_echo collapsed from ~70-90% down to 5-30% (floor
// >=60%) -- far beyond the documented P0/P1 telegraph-tax envelope, because those bosses were
// tuned+sim-verified WITHOUT a burst term. Reverted on those 7 (see each one's own comment in
// js/data/monsters.js for the citation); this test locks in the resulting, EMPIRICALLY SAFE set —
// only the 3 bosses with no stochastic real-RNG floor test in the suite (foothills_matriarch,
// juneros_leviathan, kastengard_custodian) carry a P3 behavior. The other 8 (the level-10 gate
// boss + the 7 reverted lair/finale bosses) stay simple pending a dedicated boss-tuned re-sim.
console.log('\n=== Test 74b: v1.5 P3 data integrity -- only the 3 bosses with no real-RNG win-rate floor test carry a behavior (empirically safe set); the other 8 stay simple ===');
var allBosses = Game.Data.monsters.filter(function (m) { return m.boss; });
var bossesWithBehavior = ['foothills_matriarch', 'juneros_leviathan', 'kastengard_custodian'];
var bossBehaviorAllowed = { telegraph: true, enrage: true, reactive: true };
allBosses.forEach(function (m) {
  if (bossesWithBehavior.indexOf(m.id) !== -1) {
    assert(m.behavior !== undefined && bossBehaviorAllowed[m.behavior], m.id + ' carries a telegraph/enrage/reactive behavior, got ' + m.behavior);
  } else {
    assert(m.behavior === undefined, m.id + ' has no P3 behavior (Band 1 gate boss or a real-RNG-floor-tested lair/finale boss reverted after the sim regression above), got ' + m.behavior);
  }
});
var bossesWithScriptAndBehavior = allBosses.filter(function (m) { return m.script && m.script.length && m.behavior !== undefined; });
assert(bossesWithScriptAndBehavior.length === 3, '3 of the 11 bosses carry both a script AND a behavior, got ' + bossesWithScriptAndBehavior.length);

// =================== Test 75: v1.5 P3 — guardian archetype (forced rng) ===================
console.log('\n=== Test 75: v1.5 P3 guardian — forced rng guards instead of acting: battle.monsterGuard set, no damage, logged; rng >= GUARDIAN_CHANCE acts normally instead ===');
var cGuard75 = windUpFixture('GuardianTrigger');
finalizeFixture(cGuard75);
setRng(fixedRng(0.10)); // < GUARDIAN_CHANCE (0.30); same safe constant as Test 65 (no dodge/glancing/double-attack surprises in this fixture)
var b75 = Game.Battle.start('plains_field_rat');
b75.monster.behavior = 'guardian'; // battle-transient override — never touches the shared def
b75.monster.techs = [];
b75.monster.hp = b75.monster.hpMax = 100000;
b75.monster.damage = 100;
var playerHpBefore75 = b75.player.hitPoints;
Game.Battle.attack(); // player's turn deals its normal hit; the monster's counter guards instead of attacking
assert(b75.monsterGuard === true, 'guardian monster guards: battle.monsterGuard set, got ' + b75.monsterGuard);
assert(b75.player.hitPoints === playerHpBefore75, 'the guard deals no damage — player HP unchanged this monster turn');
assert(b75.log.some(function (l) { return l.indexOf('raises its guard') !== -1; }), 'guard announced in the battle log');
Game.Battle.endBattle();

var cGuardMiss75 = windUpFixture('GuardianNoTrigger');
finalizeFixture(cGuardMiss75);
setRng(fixedRng(0.99)); // >= GUARDIAN_CHANCE (0.30) — acts normally instead
var b75b = Game.Battle.start('plains_field_rat');
b75b.monster.behavior = 'guardian';
b75b.monster.techs = [];
b75b.monster.hp = b75b.monster.hpMax = 100000;
b75b.monster.damage = 100;
var playerHpBefore75b = b75b.player.hitPoints;
Game.Battle.attack();
assert(!b75b.monsterGuard, 'a guardian monster at rng >= GUARDIAN_CHANCE does not guard, got ' + b75b.monsterGuard);
assert(b75b.player.hitPoints < playerHpBefore75b, 'it acted normally instead — the player took damage');
assert(b75b.log.some(function (l) { return / attacks for \d+ damage\.$/.test(l); }), 'normal-attack log line present');
Game.Battle.endBattle();

// =================== Test 76: v1.5 P3 — guardian halves the player's next action, then clears ===================
console.log('\n=== Test 76: v1.5 P3 — a pending monster guard halves the player\'s next attack() damage to the monster (~GUARDIAN_REDUCTION vs a same-rng unguarded baseline), then clears ===');
// Isolates the CONSUMPTION mechanic in attack() from the archetype's own trigger roll: the guard
// is set directly on the battle (battle.monsterGuard is read/cleared in attack()/useTech()/
// limitBreak() regardless of monster.behavior — the guardian archetype above is just ONE way it
// gets set). A 'simple' (behavior absent) monster is used here so it never re-arms the guard on
// its own turn, letting a clean 3-attack before/during/after comparison isolate the halving.
var cGuardHalf76 = windUpFixture('GuardianHalving');
finalizeFixture(cGuardHalf76);
setRng(fixedRng(0.10)); // clean single-hit turn (see Test 65's rng-safety analysis for this fixture)
var b76 = Game.Battle.start('plains_field_rat'); // behavior absent -> simple
b76.monster.techs = [];
b76.monster.hp = b76.monster.hpMax = 100000;
b76.monster.armor = 0;
var monsterHpBefore76a = b76.monster.hp;
Game.Battle.attack(); // baseline, UNGUARDED hit
var baselineDmg76 = monsterHpBefore76a - b76.monster.hp;
assert(baselineDmg76 > 0, 'sanity: baseline unguarded hit dealt damage');

b76.monsterGuard = true; // simulate a pending guard directly, isolating attack()'s consumption logic
var monsterHpBefore76b = b76.monster.hp;
Game.Battle.attack(); // this attack() should be halved
var guardedDmg76 = monsterHpBefore76b - b76.monster.hp;
assert(Math.abs(guardedDmg76 - Math.round(baselineDmg76 * (1 - BALANCE.GUARDIAN_REDUCTION))) <= 1, 'a pending guard halves the player\'s next attack() damage: baseline ' + baselineDmg76 + ', guarded ' + guardedDmg76 + ', expected ~' + Math.round(baselineDmg76 * (1 - BALANCE.GUARDIAN_REDUCTION)));
assert(b76.log.some(function (l) { return l.indexOf('blunted by the guard') !== -1; }), 'the blunted hit is logged');
assert(b76.monsterGuard === false, 'the guard flag is cleared after being consumed');

var monsterHpBefore76c = b76.monster.hp;
Game.Battle.attack(); // guard already consumed on the previous action -- this hit should be FULL damage again
var afterDmg76 = monsterHpBefore76c - b76.monster.hp;
assert(Math.abs(afterDmg76 - baselineDmg76) <= 1, 'after the guard is consumed, the next attack() deals full (unguarded) damage again: ' + afterDmg76 + ' ~= baseline ' + baselineDmg76);
Game.Battle.endBattle();

// =================== Test 77: v1.5 P3 — reactive holds a charge against a Defend, then releases past the cap ===================
console.log('\n=== Test 77: v1.5 P3 reactive — a pending charge is HELD (not released) the first time the player Defends on the release turn (delays=1); a second consecutive Defend exceeds REACTIVE_MAX_CHARGE_DELAYS and it releases anyway, halved by that same Defend ===');
var cReactive77 = windUpFixture('ReactiveHold');
finalizeFixture(cReactive77);
setRng(fixedRng(0.10)); // < TELEGRAPH_CHARGE_CHANCE (0.15) -- forces the wind-up, same safe constant as Test 65
var b77 = Game.Battle.start('plains_field_rat');
b77.monster.behavior = 'reactive';
b77.monster.techs = [];
b77.monster.hp = b77.monster.hpMax = 100000;
b77.monster.damage = 100;
Game.Battle.attack(); // player's turn; the monster's counter winds up
assert(!!b77.charge && b77.charge.mult === BALANCE.AFFIX_CHARGED_MULT, 'sanity: a reactive monster winds up like telegraph, got ' + JSON.stringify(b77.charge));

var playerHpBeforeHold77 = b77.player.hitPoints;
Game.Battle.defend(); // the release turn -- but the player Defends instead of attacking
assert(!!b77.charge, 'the charge is still pending -- it was HELD, not released');
assert(b77.charge.delays === 1, 'the held charge records one delay, got ' + b77.charge.delays);
assert(b77.player.hitPoints === playerHpBeforeHold77, 'a held charge deals no damage this turn');
assert(b77.log.some(function (l) { return l.indexOf('holds its charge') !== -1; }), 'the hold is announced in the battle log');
assert(!b77.log.some(function (l) { return l.indexOf('unleashes its charged blow') !== -1; }), 'sanity: no release happened this turn');

Game.Battle.defend(); // Defend again -- delays (1) is no longer < REACTIVE_MAX_CHARGE_DELAYS (1), so it releases anyway
var releaseLine77 = b77.log.filter(function (l) { return l.indexOf('unleashes its charged blow') !== -1; }).pop();
assert(!!releaseLine77, 'the second consecutive Defend exceeds the delay cap -- the charge releases anyway');
var releasedDmg77 = parseInt(releaseLine77.match(/for (\d+) damage/)[1], 10);
assert(b77.charge === null, 'the charge is cleared after releasing');
Game.Battle.endBattle();

// Baseline: same fixture/rng, but the player does NOT Defend on the release turn (an ordinary
// attack() instead) -- isolates the magnitude of the Defend halving on the release itself. The
// hold doesn't change the release's own magnitude (chargeMult is fixed regardless of hold count),
// so this baseline is a valid comparison for the delayed-then-released case above.
var cBase77 = windUpFixture('ReactiveBaseline');
finalizeFixture(cBase77);
setRng(fixedRng(0.10));
var bBase77 = Game.Battle.start('plains_field_rat');
bBase77.monster.behavior = 'reactive';
bBase77.monster.techs = [];
bBase77.monster.hp = bBase77.monster.hpMax = 100000;
bBase77.monster.damage = 100;
Game.Battle.attack(); // wind-up
assert(!!bBase77.charge, 'sanity: baseline also winds up');
Game.Battle.attack(); // release turn, NOT defended -- no hold condition (defending is false), releases immediately on schedule
var baseReleaseLine77 = bBase77.log.filter(function (l) { return l.indexOf('unleashes its charged blow') !== -1; }).pop();
assert(!!baseReleaseLine77, 'baseline release happened on schedule (undefended, so no hold)');
var baseReleasedDmg77 = parseInt(baseReleaseLine77.match(/for (\d+) damage/)[1], 10);
assert(bBase77.charge === null, 'baseline charge cleared after releasing');
assert(Math.abs(releasedDmg77 - Math.round(baseReleasedDmg77 * BALANCE.DEFEND_DAMAGE_MULT)) <= 1, 'the delayed-then-released charge is halved by the Defend that finally let it through: undefended baseline ' + baseReleasedDmg77 + ', delayed+defended ' + releasedDmg77 + ', expected ~' + Math.round(baseReleasedDmg77 * BALANCE.DEFEND_DAMAGE_MULT));
Game.Battle.endBattle();

// =================== Test 78: v1.5 P3 — boss script + behavior coexist ===================
console.log('\n=== Test 78: v1.5 P3 boss integration — a boss with BOTH a `script` (HP-threshold) and a `behavior` (per-turn telegraph) still fires its script at the threshold AND exhibits its behavior ===');
var c78 = makeCharacter({ name: 'BossCoexistTest' });
c78.dexterity = 60; // playerFirst vs a level-32 boss
c78.level = 32; // avoid Fear complicating the player's own hit (same fixture shape as Test 55)
c78.strength = 100;
Game.Character.recalcDerived(c78);
c78.hitPoints = c78.hitPointsMax = 100000;
c78.energy = c78.energyMax = 100000;
setRng(fixedRng(0.99)); // clean hit: no monster dodge (~0.148 < 0.99), no wind-up (0.15 < 0.99)
var b78 = Game.Battle.start('kastengard_custodian');
assert(b78.monster.behavior === 'telegraph', 'sanity: kastengard_custodian carries the P3 telegraph behavior');
b78.monster.techs = [];
b78.monster.hpMax = 100000;
b78.monster.hp = 50001; // one point above the 50% script threshold, same setup as Test 55
var scriptEntry78 = b78.monster.script[0];
var armorBefore78 = b78.monster.armor;

Game.Battle.attack(); // crosses the script's 50% threshold this round; the monster's own counter this round does NOT wind up (rng 0.99)
assert(scriptEntry78.fired === true, 'the boss script fired at its HP threshold, unaffected by the added behavior field');
assert(b78.monster.armor === armorBefore78 + scriptEntry78.amount, 'the fortify script effect applied its usual flat amount, unchanged by v1.5 P3');
assert(!b78.charge, 'sanity: no wind-up yet at rng 0.99');

b78.monster.hp = b78.monster.hpMax; // reset well clear of the (already-fired, one-shot) threshold before forcing a wind-up
setRng(fixedRng(0.10)); // < TELEGRAPH_CHARGE_CHANCE (0.15) -- forces the SAME boss's behavior to wind up on a later turn
Game.Battle.attack();
assert(!!b78.charge && b78.charge.mult === BALANCE.AFFIX_CHARGED_MULT, 'the SAME boss also exhibits its telegraph behavior (winds up) — script and behavior are independent and both fire, got ' + JSON.stringify(b78.charge));
assert(b78.log.some(function (l) { return l.indexOf('rears back') !== -1; }), 'the wind-up is announced, same as any other telegraph-behavior monster');
Game.Battle.endBattle();

// =================== Test 79: v1.5 P3 regression — a simple monster never guards or holds a charge ===================
console.log('\n=== Test 79: v1.5 P3 regression — a simple (behavior absent) monster never sets battle.monsterGuard across several rounds; a non-reactive telegraph monster never holds a released charge ===');
var c79 = makeCharacter({ name: 'P3SimpleRegression' });
c79.dexterity = 20;
c79.hitPoints = c79.hitPointsMax = 100000;
c79.energy = c79.energyMax = 100000;
setRng(fixedRng(0.10)); // well below GUARDIAN_CHANCE (0.30) and TELEGRAPH_CHARGE_CHANCE (0.15) -- would trigger either if this monster carried guardian/telegraph/reactive
var b79 = Game.Battle.start('plains_field_rat'); // behavior absent -> simple
assert(b79.monster.behavior === undefined, 'sanity: plains_field_rat carries no behavior field');
for (var round79 = 0; round79 < 5; round79++) {
  if (b79.phase !== 'active') break;
  Game.Battle.attack();
}
assert(!b79.monsterGuard, 'a simple monster never sets battle.monsterGuard across 5 rounds, got ' + b79.monsterGuard);
assert(!b79.charge, 'a simple monster never sets battle.charge across 5 rounds (regression, same as Test 69)');
Game.Battle.endBattle();

// Also confirm the reactive-hold branch itself never fires for a non-reactive telegraph monster:
// force a wind-up, then Defend during the would-be release turn -- it must release IMMEDIATELY,
// not hold (holding is 'reactive'-exclusive).
var cNoHold79 = windUpFixture('TelegraphNeverHolds');
finalizeFixture(cNoHold79);
setRng(fixedRng(0.10));
var b79b = Game.Battle.start('plains_field_rat');
b79b.monster.behavior = 'telegraph'; // NOT reactive
b79b.monster.techs = [];
b79b.monster.hp = b79b.monster.hpMax = 100000;
b79b.monster.damage = 100;
Game.Battle.attack(); // wind-up
assert(!!b79b.charge, 'sanity: telegraph monster winds up');
Game.Battle.defend(); // the release turn, Defended -- a telegraph (non-reactive) monster must NOT hold
assert(b79b.charge === null, 'a non-reactive telegraph monster releases on schedule even when Defended -- it never holds (holding is reactive-exclusive)');
assert(b79b.log.some(function (l) { return l.indexOf('unleashes its charged blow') !== -1; }), 'the release happened this turn, not held');
assert(!b79b.log.some(function (l) { return l.indexOf('holds its charge') !== -1; }), 'sanity: no hold logged for a non-reactive monster');
Game.Battle.endBattle();

// =================== Test 80: v1.6 P1 (CB-1) — penetration floor is DEFENSIVE-ONLY ===================
console.log('\n=== Test 80: v1.6 P1 penetration floor (CB-1, SPEC-V1.6-REBALANCE.md §6) — defensive-only ===');
var c80 = makeCharacter({ name: 'FloorTest' });
c80.level = 20; // matches the monster's level so Fear does not zero out the inflated Armor below
c80.endurance = 100000; // absurdly high Armor so raw-mitigation would go deeply negative
Game.Character.recalcDerived(c80);
c80.hitPoints = c80.hitPointsMax;
setRng(seqRng([0.99, 0.99, 0.5], 0.5)); // dodge fail, glancing fail, variance neutral (x1.0)
var hpBefore80 = c80.hitPoints;
var b80 = Game.Battle.start('juneros_riptide_hunter'); // level 20, damage 43, no techs/behavior/curse -> clean rng sequence
assert(b80.playerFirst === false, 'sanity: the level-20 monster (effective dex 20) outpaces the default-dex player, so it strikes first inside start()');
var raw80 = b80.monster.damage; // neutral variance above, no frenzied/tech modifiers on a simple monster
var expectedFloorDmg80 = Math.max(1, Math.round(raw80 * BALANCE.DAMAGE_PENETRATION_FLOOR));
var actualDmg80 = hpBefore80 - c80.hitPoints;
assert(actualDmg80 === expectedFloorDmg80,
  'monster->player hit floors to round(raw*DAMAGE_PENETRATION_FLOOR)=' + expectedFloorDmg80 + ' despite huge Armor, got ' + actualDmg80);
assert(actualDmg80 > 1, 'sanity: the floor is meaningfully above the old bare max(1,...) floor for this raw damage, got ' + actualDmg80);
Game.Battle.endBattle();

// The SAME huge-armor trick on the MONSTER side must NOT floor a player->monster hit — that
// direction keeps the old max(1, raw-mitigation) with no percentage floor (LOCKED P0: a symmetric
// floor let under-levelled players guarantee-chunk high-armor monsters and reopened 5-levels-down).
var c80b = makeCharacter({ name: 'FloorTestOffense' });
setRng(seqRng([0.99, 0.99, 0.99, 0.5], 0.5)); // double-attack fail, monster-dodge fail, glancing fail, variance neutral
var b80b = Game.Battle.start('plains_field_rat');
b80b.monster.armor = 100000; // absurdly high monster Armor
var raw80b = Game.Character.getDamage(c80b); // fear=1, no curse/buff at level 1 vs level 1
var mHpBefore80b = b80b.monster.hp;
Game.Battle.attack();
var actualDmg80b = mHpBefore80b - b80b.monster.hp;
var wouldBeFloorDmg80b = Math.max(1, Math.round(raw80b * BALANCE.DAMAGE_PENETRATION_FLOOR));
assert(actualDmg80b === 1, 'player->monster hit still floors to a bare 1 against absurd monster Armor (no percentage floor this direction), got ' + actualDmg80b);
if (wouldBeFloorDmg80b > 1) {
  assert(actualDmg80b !== wouldBeFloorDmg80b, 'sanity: confirms the 30% floor was NOT applied here (that would have been ' + wouldBeFloorDmg80b + ')');
}
Game.Battle.endBattle();

// =================== Test 81: v1.6 P1 (CB-2) — magic-school skill level scales offensive tech power ===================
console.log('\n=== Test 81: v1.6 P1 magic-school skill scaling of offensive tech power (CB-2, SPEC-V1.6-REBALANCE.md §6) ===');
var techFirebolt81 = Game.Battle.getTech('tech_firebolt_1'); // Evocation, effect 'damage'
var c81 = makeCharacter({ skills: { 'Evocation': 0 }, name: 'MagicSkillTest' });
c81.intelligence = 20;
var basePower81 = Game.Battle.techEffectivePower(c81, techFirebolt81); // skill level 0 -> magicSkillMult = 1
var expectedBase81 = Math.round(techFirebolt81.power * (1 + c81.intelligence * 0.02));
assert(basePower81 === expectedBase81, 'sanity: skill level 0 gives the unmodified Int-scaled power, got ' + basePower81 + ' expected ' + expectedBase81);
c81.skills['Evocation'].level = 10;
var raisedPower81 = Game.Battle.techEffectivePower(c81, techFirebolt81);
var expectedMagicMult81 = 1 + Math.min(BALANCE.MAGIC_SKILL_DAMAGE_PER_LEVEL * 10, BALANCE.MAGIC_SKILL_DAMAGE_CAP);
var expectedRaised81 = Math.round(techFirebolt81.power * (1 + c81.intelligence * 0.02) * expectedMagicMult81);
assert(raisedPower81 === expectedRaised81, 'Evocation skill level 10 raises Firebolt I effective power to ' + expectedRaised81 + ', got ' + raisedPower81);
assert(raisedPower81 > basePower81, 'magic-school skill investment raises offensive-tech damage');
// the cap holds: an absurd skill level cannot exceed MAGIC_SKILL_DAMAGE_CAP's multiplier
c81.skills['Evocation'].level = 999;
var cappedPower81 = Game.Battle.techEffectivePower(c81, techFirebolt81);
var expectedCapped81 = Math.round(techFirebolt81.power * (1 + c81.intelligence * 0.02) * (1 + BALANCE.MAGIC_SKILL_DAMAGE_CAP));
assert(cappedPower81 === expectedCapped81, 'magic-school damage mult caps at MAGIC_SKILL_DAMAGE_CAP, got ' + cappedPower81 + ' expected ' + expectedCapped81);
// heal techs are UNAFFECTED by the magic-school-skill mult (only the damage/drain branch reads it)
var healTech81 = Game.Battle.getTech('tech_mend_wounds_1');
c81.skills['Abjuration'].level = 15;
var healPower81 = Game.Battle.techEffectivePower(c81, healTech81);
var expectedHeal81 = Math.round(healTech81.power * (1 + c81.intelligence * 0.01));
assert(healPower81 === expectedHeal81, 'heal techs are NOT scaled by the magic-school-skill mult, got ' + healPower81 + ' expected ' + expectedHeal81);

// =================== Test 82: v1.6 P1 (CB-4) — Rod equipped boosts tech damage, cuts tech energy cost ===================
console.log('\n=== Test 82: v1.6 P1 Rod caster identity — ROD_SPELL_MULT + ROD_TECH_ENERGY_DISCOUNT (CB-4) ===');
var techFirebolt82 = Game.Battle.getTech('tech_firebolt_1');
var c82 = makeCharacter({ skills: {}, name: 'RodTest' }); // no creation-skill investment -> starter kit equips a Sword, not a Rod
c82.intelligence = 20;
assert(Game.Inventory.getItem(c82.equipment.weapon).skill !== 'Rods', 'sanity: no Rod equipped yet');
var powerNoRod82 = Game.Battle.techEffectivePower(c82, techFirebolt82);
var costNoRod82 = Game.Battle.effectiveTechEnergyCost(c82, techFirebolt82);
assert(costNoRod82 === techFirebolt82.energyCost, 'sanity: full Energy cost with no Rod equipped');
Game.Inventory.addItem(c82, 'rod_apprentice_wand');
var eqRod82 = Game.Inventory.equip(c82, 'rod_apprentice_wand');
assert(eqRod82.ok, 'rod equips: ' + eqRod82.failures.join(';'));
var powerWithRod82 = Game.Battle.techEffectivePower(c82, techFirebolt82);
var expectedPowerWithRod82 = Math.round(techFirebolt82.power * (1 + c82.intelligence * 0.02) * (1 + BALANCE.ROD_SPELL_MULT));
assert(powerWithRod82 === expectedPowerWithRod82,
  'Rod equipped raises Firebolt I power by ROD_SPELL_MULT, expected ' + expectedPowerWithRod82 + ', got ' + powerWithRod82);
assert(powerWithRod82 > powerNoRod82, 'Rod equipped strictly raises offensive-tech damage');
var costWithRod82 = Game.Battle.effectiveTechEnergyCost(c82, techFirebolt82);
var expectedCostWithRod82 = Math.round(techFirebolt82.energyCost * (1 - BALANCE.ROD_TECH_ENERGY_DISCOUNT));
assert(costWithRod82 === expectedCostWithRod82,
  'Rod equipped cuts Firebolt I Energy cost by ROD_TECH_ENERGY_DISCOUNT, expected ' + expectedCostWithRod82 + ', got ' + costWithRod82);
assert(costWithRod82 < costNoRod82, 'Rod equipped strictly lowers offensive-tech Energy cost');
// heal techs are unaffected by either Rod bonus (spell power OR energy discount)
var healTech82 = Game.Battle.getTech('tech_mend_wounds_1');
var healCostWithRod82 = Game.Battle.effectiveTechEnergyCost(c82, healTech82);
assert(healCostWithRod82 === healTech82.energyCost, 'heal techs keep full Energy cost even with a Rod equipped');
var healPowerWithRod82 = Game.Battle.techEffectivePower(c82, healTech82);
var expectedHealPowerWithRod82 = Math.round(healTech82.power * (1 + c82.intelligence * 0.01));
assert(healPowerWithRod82 === expectedHealPowerWithRod82, 'heal techs keep their unmodified power even with a Rod equipped');

// =================== Test 83: v1.6 P1 (CB-2) — INT speeds magic-school/Rod skill-XP, not weapon skill-XP ===================
console.log('\n=== Test 83: v1.6 P1 INT-scaled skill-XP for magic schools + Rods, weapon skills unaffected (CB-2) ===');
var c83 = makeCharacter({ skills: {}, name: 'IntSkillXpTest' });
c83.intelligence = 50;
c83.techs.push('tech_firebolt_1');
c83.techSets[0][0] = 'tech_firebolt_1';
setRng(fixedRng(0.99)); // fails dodge/glancing/double-attack throughout; techsUsedThisBattle is set regardless of hit/miss
var b83 = Game.Battle.start('plains_field_rat');
b83.monster.hp = b83.monster.hpMax = 100000; // survive two non-lethal actions
Game.Battle.attack(); // sets attackedThisBattle + equippedWeaponSkill='Swords' (starter weapon)
Game.Battle.useTech('tech_firebolt_1'); // Evocation -> techsUsedThisBattle['Evocation']=true regardless of hit/miss
b83.monster.hp = 1; // let the next hit land the killing blow
Game.Battle.attack();
assert(b83.phase === 'won', 'sanity: the rat died on the finishing blow');
// v1.6 P2 (PG-3, SPEC-V1.6-REBALANCE.md §6.2): base skill-XP-per-use now scales with the
// monster's level (plains_field_rat is level 1 -> round(1*0.6)=1, at the floor) instead of the
// removed flat SKILL_XP_PER_USE; fury=0, at/above the monster's level -> no decline, no fury bonus.
var expectedPerUse83 = Math.max(BALANCE.SKILL_XP_MIN_PER_USE, Math.round(b83.monster.level * BALANCE.SKILL_XP_PER_MON_LEVEL));
var expectedMagicXp83 = Math.max(1, Math.round(expectedPerUse83 * (1 + c83.intelligence * BALANCE.INT_SKILL_XP_PER_POINT)));
assert(b83.rewards.skillXp['Swords'] === expectedPerUse83,
  'weapon skill-XP (Swords) is UNAFFECTED by Intelligence, expected ' + expectedPerUse83 + ', got ' + b83.rewards.skillXp['Swords']);
assert(b83.rewards.skillXp['Evocation'] === expectedMagicXp83,
  'magic-school skill-XP (Evocation) IS Int-scaled, expected ' + expectedMagicXp83 + ', got ' + b83.rewards.skillXp['Evocation']);
assert(b83.rewards.skillXp['Evocation'] > b83.rewards.skillXp['Swords'],
  'the Int-scaled magic-school skill-XP exceeds the flat weapon skill-XP for the same kill');
Game.Battle.endBattle();

// Rods grant skill-XP via the WEAPON-skill route (c.equippedWeaponSkill = 'Rods' when meleed
// with) — that route must ALSO get the Int multiplier (Intelligence.md names Rods explicitly,
// alongside the five magic schools).
var c83b = makeCharacter({ skills: {}, name: 'IntSkillXpRodTest' });
c83b.intelligence = 50;
Game.Inventory.addItem(c83b, 'rod_apprentice_wand');
Game.Inventory.equip(c83b, 'rod_apprentice_wand');
setRng(fixedRng(0.99));
var b83b = Game.Battle.start('plains_field_rat');
b83b.monster.hp = 1;
Game.Battle.attack();
assert(b83b.phase === 'won', 'sanity: the rat died to the rod-wielder\'s attack');
assert(b83b.rewards.skillXp['Rods'] === expectedMagicXp83,
  'Rods skill-XP is ALSO Int-scaled via the weapon-skill route (same rate as a magic school), expected ' + expectedMagicXp83 + ', got ' + b83b.rewards.skillXp['Rods']);
Game.Battle.endBattle();

// =================== Test 84 (v1.6 P2): XP_TO_LEVEL exponent 2.0, Fury XP cap, skill-XP monster-level scaling ===================
console.log('\n=== Test 84 (v1.6 P2): XP_TO_LEVEL exponent 2.0 (PG-1), Fury XP bonus capped at +25% (PG-1), skill-XP-per-use scales with monster level (PG-3) ===');

// --- XP_TO_LEVEL exponent 1.8 -> 2.0: spot-check a few cumulative values, and confirm the total
// kills/XP-to-100 roughly doubled vs the old curve (SPEC-V1.6-REBALANCE.md §6.2: 396->912 kills,
// ~2.3x). Math.pow(k, 2) is exact for these small integers, so these are precise, not float-fuzzy.
assert(BALANCE.XP_TO_LEVEL(1) === 0, 'XP_TO_LEVEL(1) === 0 (level-1 baseline), got ' + BALANCE.XP_TO_LEVEL(1));
assert(BALANCE.XP_TO_LEVEL(2) === 50, 'XP_TO_LEVEL(2) === 50 under the v1.6 exponent-2.0 curve (50*(1)^2), got ' + BALANCE.XP_TO_LEVEL(2));
assert(BALANCE.XP_TO_LEVEL(30) === 42050, 'XP_TO_LEVEL(30) === 42050 under the v1.6 exponent-2.0 curve (50*29^2), got ' + BALANCE.XP_TO_LEVEL(30));
assert(BALANCE.XP_TO_LEVEL(100) === 490050, 'XP_TO_LEVEL(100) === 490050 under the v1.6 exponent-2.0 curve (50*99^2), got ' + BALANCE.XP_TO_LEVEL(100));
var oldXpToLevel100 = Math.round(50 * Math.pow(99, 1.8)); // pre-v1.6 curve, computed inline ONLY as this test's own comparison yardstick (not a live game formula)
var xpRatio100 = BALANCE.XP_TO_LEVEL(100) / oldXpToLevel100;
assert(xpRatio100 > 2 && xpRatio100 < 3, 'v1.6 P2 (PG-1): total XP-to-100 roughly doubled vs the old 1.8-exponent curve (old=' + oldXpToLevel100 + ', new=' + BALANCE.XP_TO_LEVEL(100) + ', ratio=' + xpRatio100.toFixed(2) + ')');

// --- Fury XP bonus caps at BALANCE.FURY_XP_CAP (+25%), was uncapped ---
var cFuryCap = makeCharacter({ name: 'FuryCapTest' });
cFuryCap.fury = 100; // 100*FURY_XP_PER_TICK(0.01) = +100% uncapped -- far past the +25% cap
cFuryCap.strength = 60;
Game.Character.recalcDerived(cFuryCap);
cFuryCap.hitPoints = cFuryCap.hitPointsMax;
setRng(fixedRng(0.99));
var bFuryCap = Game.Battle.start('plains_field_rat');
bFuryCap.monster.hp = 1;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.99, 0.99, 0.99], 0.99));
Game.Battle.attack();
assert(bFuryCap.phase === 'won', 'sanity: the rat died to the finishing blow');
var expectedCappedFuryXp = Math.round(bFuryCap.monster.xp * (1 + BALANCE.FURY_XP_CAP));
var uncappedFuryXp = Math.round(bFuryCap.monster.xp * (1 + 100 * BALANCE.FURY_XP_PER_TICK));
assert(expectedCappedFuryXp < uncappedFuryXp, 'sanity: the capped expectation is strictly less than the old uncapped formula would have given');
assert(bFuryCap.rewards.xp === expectedCappedFuryXp, 'combat XP uses the Fury bonus CAPPED at +' + (BALANCE.FURY_XP_CAP * 100) + '% (FURY_XP_CAP), not the uncapped 1+fury*FURY_XP_PER_TICK (' + uncappedFuryXp + '), expected ' + expectedCappedFuryXp + ', got ' + bFuryCap.rewards.xp);
Game.Battle.endBattle();

// --- skill-XP-per-use scales with the DEFEATED MONSTER's level: a level-49 kill grants more
// skill XP than a level-10 kill, both fought exactly at-level (levelDiff=0 -> no decline, isolating
// the level-scaling term from the archived decline term, which Tests 7/7b/8 already cover). ---
function killAtLevelAndGetSwordsXp(monsterId, playerLevel) {
  var c = makeCharacter({ name: 'MonLevelSkillXpTest_' + monsterId });
  c.level = playerLevel;
  c.xp = BALANCE.XP_TO_LEVEL(playerLevel);
  c.strength = 60;
  c.dexterity = 999; // act first regardless of the monster's effective dex (= its level)
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  setRng(fixedRng(0.99));
  var b = Game.Battle.start(monsterId);
  b.monster.hp = 1;
  setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.99, 0.99, 0.99], 0.99));
  Game.Battle.attack();
  var swordsXp = b.rewards.skillXp['Swords'];
  var monsterLevel = b.monster.level;
  Game.Battle.endBattle();
  return { swordsXp: swordsXp, monsterLevel: monsterLevel };
}

var lowLevelKill84 = killAtLevelAndGetSwordsXp('gares_majiku_raider', 10); // level 10, no behavior/poison/curse
var highLevelKill84 = killAtLevelAndGetSwordsXp('majiku_ironclad_vanguard', 49); // level 49, telegraph behavior (harmless at rng 0.99)
assert(highLevelKill84.swordsXp > lowLevelKill84.swordsXp,
  'v1.6 P2 (PG-3): a level-' + highLevelKill84.monsterLevel + ' kill grants more skill XP than a level-' + lowLevelKill84.monsterLevel + ' kill (' + highLevelKill84.swordsXp + ' > ' + lowLevelKill84.swordsXp + ')');
var expectedLow84 = Math.max(BALANCE.SKILL_XP_MIN_PER_USE, Math.round(lowLevelKill84.monsterLevel * BALANCE.SKILL_XP_PER_MON_LEVEL));
var expectedHigh84 = Math.max(BALANCE.SKILL_XP_MIN_PER_USE, Math.round(highLevelKill84.monsterLevel * BALANCE.SKILL_XP_PER_MON_LEVEL));
assert(lowLevelKill84.swordsXp === expectedLow84, 'level-10 kill skill XP matches round(monsterLevel*SKILL_XP_PER_MON_LEVEL), expected ' + expectedLow84 + ', got ' + lowLevelKill84.swordsXp);
assert(highLevelKill84.swordsXp === expectedHigh84, 'level-49 kill skill XP matches round(monsterLevel*SKILL_XP_PER_MON_LEVEL), expected ' + expectedHigh84 + ', got ' + highLevelKill84.swordsXp);

// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
