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
// skill xp: Swords was at cap 3 -> addSkillXp must not raise it
assert(c5.skills['Swords'].level === 3, 'weapon skill did not exceed cap 2L+1=3');
assert(r5.skillXp['Swords'] === BALANCE.SKILL_XP_PER_USE, 'weapon skill XP granted at full rate (monster not below player)');

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
c5b.strength = 1; // capacity 10, starter kit alone outweighs it
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
assert(b7.pendingLoot === null, 'zero loot');
assert(c7.skills['Swords'].xp === swordsXpBefore7 && c7.skills['Swords'].level === swordsLvBefore7, 'zero skill XP');
assert(c7.monsterKills === 1, 'kill still counted');
Game.Battle.endBattle();

// =================== Test 8: skill xp decline between 1 and 4 levels above ===================
console.log('\n=== Test 8: skill XP declines when outleveling the monster ===');
var c8 = makeCharacter({ name: 'DeclineTest' });
c8.level = 4; // 3 levels above the rat -> decline factor 1 - 3/5 = 0.4 -> round(8*0.4)=3
c8.xp = BALANCE.XP_TO_LEVEL(4);
c8.strength = 60;
Game.Character.recalcDerived(c8);
c8.hitPoints = c8.hitPointsMax;
setRng(fixedRng(0.99));
var b8 = Game.Battle.start('plains_field_rat');
b8.monster.hp = 1;
setRng(seqRng([0.99, 0.99, 0.99, 0.5, 0.99, 0.99, 0.99], 0.99));
Game.Battle.attack();
var expectedPerUse = Math.max(BALANCE.SKILL_XP_MIN_PER_USE, Math.round(BALANCE.SKILL_XP_PER_USE * (1 - 3 / BALANCE.XP_LOOT_CUTOFF_LEVELS)));
assert(b8.rewards.skillXp['Swords'] === expectedPerUse, 'declined skill XP: got ' + b8.rewards.skillXp['Swords'] + ', expected ' + expectedPerUse);
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
assert(resaved.version === 9, 'resave stamps current version 9 (v1.2 Phase 1 equipment.offhand migration on top)');

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
assert(resavedV9.version === 9, 'resave stamps CURRENT_VERSION 9, got ' + resavedV9.version);

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
  'rod_majiku_wardbreaker', 'hth_reclaimers_gauntlets'
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
  'rod_hostcallers_ruin', 'hth_ridgeguard_knuckles'
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
  'rod_ukai_wardstone', 'hth_frostbound_knuckles'
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
  'rod_wellspring_conduit', 'hth_warden_gauntlets'
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
  'rod_anima_channeling_rod', 'hth_spireguard_gauntlets'
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
  'rod_lunar_conduit', 'hth_sanctum_gauntlets'
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

// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
