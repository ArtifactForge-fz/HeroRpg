// v1.9 exit test — the companion system (docs/SPEC-COMPANION-SYSTEM.md), a new engine subsystem:
// Game.Companion (js/core/companion.js) + js/data/companions.js + the js/core/battle.js
// integration (battle.companion rehydration/write-back, monsterAct targeting incl. Taunt and a
// monster tech's `target` field, useTech's summon/requiresCompanion/detonatesBurn/
// refreshesCompanionTaunt branches). Same preamble pattern as tests/test_v18_engine.js. Randomness
// stubbed via Game.Battle._rng — the single RNG surface (CLAUDE.md cardinal rule), never a
// second one. No synthetic fixtures needed — every id used here (comp_fire/water/earth/wind,
// tech_summon_*/tech_cmd_*, mon_cleaving_roar) is real shipped v1.9 data.

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
function seqRng(values) {
  var i = 0;
  return function () {
    var v = values[Math.min(i, values.length - 1)];
    i++;
    return v;
  };
}

function makeCharacter(opts) {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  var c = Game.Character.create({
    race: (opts && opts.race) || 'Human',
    name: (opts && opts.name) || 'Tester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  c.energy = c.energyMax = 500;
  c.hitPoints = c.hitPointsMax = 5000;
  Game.state.character = c;
  Game.state.battle = null;
  return c;
}

function setLevel(c, n) {
  c.level = n;
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
}

// =================== Test 1: summon sets the companion at full HP (js/core/companion.js summon) ===================
console.log('\n=== Test 1: Game.Companion.summon sets character.companion at full HP; derived from kind + level ===');
(function () {
  var c = makeCharacter({ name: 'SummonTest' });
  setLevel(c, 60);
  assert(c.companion === null, 'no companion bound on a fresh character');
  var ok = Game.Companion.summon(c, 'comp_earth');
  assert(ok === true, 'summon() reports success');
  var expectedHpMax = Math.round(40 + 8 * 60); // comp_earth: hpBase 40, hpPerLevel 8 (js/data/companions.js)
  assert(c.companion !== null && c.companion.kindId === 'comp_earth', 'character.companion is bound to comp_earth');
  assert(c.companion.hp === expectedHpMax, 'bound at full HP: expected ' + expectedHpMax + ', got ' + c.companion.hp);
  assert(Game.Companion.hpMaxFor(c) === expectedHpMax, 'hpMaxFor derives the same value from the kind def + level');
  assert(Game.Companion.armorFor(c) === Math.round(4 + 1.0 * 60), 'armorFor derives from armorBase/armorPerLevel + level');
  assert(Game.Companion.magicArmorFor(c) === Math.round(2 + 0.6 * 60), 'magicArmorFor derives from magicArmorBase/magicArmorPerLevel + level');

  // D2: summoning a DIFFERENT kind REPLACES the outgoing companion outright — discard, new one at
  // full HP, no HP banking.
  c.companion.hp = 5; // simulate prior damage
  Game.Companion.summon(c, 'comp_wind');
  var expectedWindHpMax = Math.round(18 + 4 * 60);
  assert(c.companion.kindId === 'comp_wind' && c.companion.hp === expectedWindHpMax,
    'binding a different kind REPLACES the outgoing companion at full HP, discarding its prior damage (D2)');
})();

// =================== Test 2: Bind tech (useTech) binds mid-battle; the SAME battle sees it immediately ===================
console.log('\n=== Test 2: a Bind tech (js/core/battle.js useTech summon branch) binds the companion mid-battle ===');
(function () {
  var c = makeCharacter({ name: 'BindTechTest' });
  setLevel(c, 60);
  Game.Classes.obtainClass(c, 'conjurer');
  Game.Classes.activate(c, 'conjurer', 'primary');
  Game.Classes.addClassXp(c, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
  var buy = Game.Classes.buyAbility(c, 'conjurer', 'conjurer_pact_water');
  assert(buy.ok === true, 'Pact of Tides purchased: ' + buy.message);
  assert(c.techs.indexOf('tech_summon_water') !== -1 && c.techs.indexOf('tech_cmd_renewing_tide') !== -1,
    "buying a Pact grants BOTH its Bind and command tech (js/core/classes.js buyAbility's techIds-array handling)");
  c.techSets[0][0] = 'tech_summon_water';
  c.techSets[0][1] = 'tech_cmd_renewing_tide';
  c.hitPoints = c.hitPointsMax; c.energy = c.energyMax;

  setRng(fixedRng(0.99));
  var b = Game.Battle.start('plains_field_rat');
  assert(b.companion === null, 'battle starts with no companion view (none bound yet)');
  Game.Battle.useTech('tech_summon_water');
  assert(c.companion !== null && c.companion.kindId === 'comp_water', 'casting the Bind tech sets character.companion');
  assert(b.companion !== null && b.companion.kindId === 'comp_water' && b.companion.hp === Game.Companion.hpMaxFor(c),
    'the SAME battle already sees the new companion at full HP (useTech rebuilds battle.companion immediately)');
  Game.Battle.flee();
  Game.Battle.endBattle();
})();

// =================== Test 3: the companion's basic fires automatically and pays the player's Energy ===================
console.log("\n=== Test 3: Game.Companion.act() fires the companion's basic each round and pays battle.player.energy ===");
(function () {
  var c = makeCharacter({ name: 'BasicActTest' });
  setLevel(c, 60);
  c.intelligence = 50;
  Game.Character.recalcDerived(c);
  Game.Companion.summon(c, 'comp_fire');
  c.hitPoints = c.hitPointsMax; c.energy = c.energyMax;
  setRng(fixedRng(0.99));
  var b = Game.Battle.start('plains_field_rat');
  b.monster.hp = b.monster.hpMax = 999999; b.monster.magicArmor = 0; b.monster.resistances = {};
  var energyBefore = c.energy;
  var hpBefore = b.monster.hp;
  Game.Battle.defend(); // any player action -> finishRound -> Game.Companion.act() fires FIRST
  var fireBasic = Game.Companion.getKind('comp_fire').basic;
  assert(c.energy === energyBefore - BALANCE.DEFEND_ENERGY_COST - fireBasic.energyCost,
    "the companion's basic paid its own energyCost on top of Defend's own cost, energy " + energyBefore + ' -> ' + c.energy);
  assert(b.monster.hp < hpBefore, "the companion's automatic basic already struck the monster this round, hp " + hpBefore + ' -> ' + b.monster.hp);
  Game.Battle.flee();
  Game.Battle.endBattle();
})();

// =================== Test 4: energy-starve -> idle (no roll, no damage, no Energy spent beyond the player's own action) ===================
console.log('\n=== Test 4: insufficient player Energy makes the companion idle for the round ===');
(function () {
  var c = makeCharacter({ name: 'IdleTest' });
  setLevel(c, 60);
  Game.Companion.summon(c, 'comp_wind'); // no DoT/taunt rider — an unambiguous "zero damage" check
  c.hitPoints = c.hitPointsMax;
  setRng(fixedRng(0.99));
  var b = Game.Battle.start('plains_field_rat');
  b.monster.hp = b.monster.hpMax = 999999;
  c.energy = 2; // >= Defend's own cost (2) but < the Sylph's basic energyCost (6)
  var hpBefore = b.monster.hp;
  Game.Battle.defend();
  assert(c.energy === 0, "Defend spent its own 2 Energy; the companion's own cost (6) was NOT deducted (idled), energy=" + c.energy);
  assert(b.monster.hp === hpBefore, 'an idled companion deals NO damage this round, hp unchanged at ' + b.monster.hp);
  assert(b.log.some(function (l) { return /starved of Anima and holds back/.test(l); }), 'an idle round logs the starved-of-Anima message: ' + b.log.join(' | '));
  Game.Battle.flee();
  Game.Battle.endBattle();
})();

// =================== Test 5: Fire's Burn DoT applies and ticks (Fire-resisted, floored at 1) ===================
console.log("\n=== Test 5: the Fire companion's Ember Lash applies a Burn DoT that ticks (and expires) on schedule ===");
(function () {
  var c = makeCharacter({ name: 'BurnTest' });
  setLevel(c, 60);
  c.intelligence = 50;
  Game.Character.recalcDerived(c);
  Game.Companion.summon(c, 'comp_fire');
  c.hitPoints = c.hitPointsMax; c.energy = c.energyMax;
  setRng(fixedRng(0.99));
  var b = Game.Battle.start('plains_field_rat');
  b.monster.hp = b.monster.hpMax = 999999; b.monster.magicArmor = 0; b.monster.resistances = {};
  Game.Battle.defend();
  var burn = b.monster.statuses.filter(function (st) { return st.type === 'debuff' && st.debuffKind === 'burn'; });
  assert(burn.length === 1, 'Ember Lash applied exactly one Burn debuff entry, got ' + JSON.stringify(b.monster.statuses));
  assert(burn[0].turnsLeft === BALANCE.BURN_TURNS - 1, 'Burn already ticked once this same round (apply-then-tick convention), turnsLeft=' + burn[0].turnsLeft);
  var hpBeforeSecondTick = b.monster.hp;
  Game.Battle.defend(); // Ember Lash refreshes Burn to a fresh BURN_TURNS again; the OLD entry's final tick also fires first
  assert(b.monster.hp < hpBeforeSecondTick, 'the Burn DoT dealt further damage on its next tick, hp ' + hpBeforeSecondTick + ' -> ' + b.monster.hp);
  Game.Battle.flee();
  Game.Battle.endBattle();
})();

// =================== Test 6: Earth's Taunt redirects the monster's plain BASIC attack onto the companion ===================
console.log("\n=== Test 6: an active Taunt (js/core/companion.js setTaunt/tauntActive) redirects a monster's basic attack onto the companion ===");
(function () {
  var c = makeCharacter({ name: 'TauntTest' });
  setLevel(c, 60);
  Game.Companion.summon(c, 'comp_earth');
  c.hitPoints = c.hitPointsMax; c.energy = c.energyMax;
  setRng(fixedRng(0.99)); // constant stub: no dodge/glancing anywhere, regardless of call count
  var b = Game.Battle.start('plains_field_rat');
  b.monster.techs = []; // basic attacks only
  b.monster.hp = b.monster.hpMax = 999999;
  b.monster.damage = 20;
  Game.Companion.setTaunt(b, BALANCE.COMPANION_TAUNT_TURNS_BASIC);
  assert(Game.Companion.tauntActive(b) === true, 'Taunt is active on the companion');
  var playerHpBefore = b.player.hitPoints;
  var companionHpBefore = b.companion.hp;
  Game.Battle.defend();
  assert(b.player.hitPoints === playerHpBefore, "the monster's basic attack did NOT hit the player while Taunt is active, hp unchanged at " + b.player.hitPoints);
  assert(b.companion.hp < companionHpBefore, "the monster's basic attack was redirected onto the taunting companion instead, hp " + companionHpBefore + ' -> ' + b.companion.hp);
  Game.Battle.flee();
  Game.Battle.endBattle();
})();

// =================== Test 7: a monster tech with target:'both' (mon_cleaving_roar) hits player AND companion ===================
console.log("\n=== Test 7: a monster tech's target:'both' field (js/core/battle.js monsterAct) hits the player AND the companion independently ===");
(function () {
  var c = makeCharacter({ name: 'TargetBothTest' });
  setLevel(c, 60);
  Game.Companion.summon(c, 'comp_water');
  c.hitPoints = c.hitPointsMax; c.energy = c.energyMax;
  var cleavingRoar = Game.Battle.getTech('mon_cleaving_roar');
  assert(cleavingRoar && cleavingRoar.target === 'both' && cleavingRoar.effect === 'damage', "mon_cleaving_roar exists with target 'both'");
  setRng(fixedRng(0.99));
  var b = Game.Battle.start('plains_field_rat');
  b.monster.techs = ['mon_cleaving_roar'];
  b.monster.energy = 999999;
  b.monster.hp = b.monster.hpMax = 999999;
  c.energy = 2; // < the Undine's basic energyCost (4) -> idles this round, isolating the monster's own action
  var playerHpBefore = b.player.hitPoints;
  var companionHpBefore = b.companion.hp;
  // rng sequence for monsterAct: [0] tech-inclination roll (<0.5 -> pick a tech), [1] tech-array
  // index pick (only 1 affordable tech), [2]/[3] the companion's own glancing/variance roll,
  // [4]/[5]/[6] the player's own dodge/glancing/variance roll — kept away from proc thresholds.
  setRng(seqRng([0.1, 0.1, 0.9, 0.5, 0.9, 0.9, 0.5]));
  Game.Battle.defend();
  assert(b.player.hitPoints < playerHpBefore, "target:'both' hit the PLAYER, hp " + playerHpBefore + ' -> ' + b.player.hitPoints);
  assert(b.companion.hp < companionHpBefore, "target:'both' ALSO hit the COMPANION independently, hp " + companionHpBefore + ' -> ' + b.companion.hp);
  Game.Battle.flee();
  Game.Battle.endBattle();
})();

// =================== Test 8: companion death mid-battle disperses it (nulls character.companion at battle end) ===================
console.log('\n=== Test 8: a companion driven to 0 HP mid-battle is dispersed — battle.companionDispersed + battle-end nulling + command-tech refusal ===');
(function () {
  var c = makeCharacter({ name: 'DeathTest' });
  setLevel(c, 60);
  Game.Classes.obtainClass(c, 'conjurer');
  Game.Classes.activate(c, 'conjurer', 'primary');
  Game.Classes.addClassXp(c, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
  Game.Classes.buyAbility(c, 'conjurer', 'conjurer_pact_fire');
  c.techSets[0][0] = 'tech_summon_fire';
  c.techSets[0][1] = 'tech_cmd_conflagration';
  Game.Companion.summon(c, 'comp_fire'); // pre-summon directly so the field rat's tiny HP survives to the scripted redirect
  c.hitPoints = c.hitPointsMax; c.energy = c.energyMax;
  setRng(fixedRng(0.99));
  var b = Game.Battle.start('plains_field_rat');
  b.monster.techs = [];
  b.monster.hp = b.monster.hpMax = 999999;
  b.monster.damage = 999999; // guaranteed one-shot on the companion once redirected
  Game.Companion.setTaunt(b, 5);
  Game.Battle.defend();
  assert(b.companion.hp === 0, "the companion's HP is driven to exactly 0 by the redirected hit");
  assert(b.companionDispersed === true, "battle.companionDispersed is set once the companion's hp reaches 0");
  assert(b.log.some(function (l) { return /is destroyed/.test(l); }), 'a destruction log line was recorded: ' + b.log.join(' | '));
  var logLenBefore = b.log.length;
  Game.Battle.useTech('tech_cmd_conflagration');
  assert(b.log.length === logLenBefore + 1 && /requires a bound/.test(b.log[b.log.length - 1]),
    'a command tech refuses to cast once its companion has been dispersed mid-battle: ' + b.log[b.log.length - 1]);
  Game.Battle.flee();
  Game.Battle.endBattle();
  assert(c.companion === null, 'battle end nulls character.companion once it was dispersed mid-battle — must be re-summoned');
})();

// =================== Test 9: HP carries across two sequential battles (semi-permanent, D3: not restored between) ===================
console.log('\n=== Test 9: companion HP carries across two sequential battles (write-back on win, rehydrated on the next start) ===');
(function () {
  var c = makeCharacter({ name: 'PersistTest' });
  setLevel(c, 60);
  Game.Companion.summon(c, 'comp_earth');
  var hpMax = Game.Companion.hpMaxFor(c);
  c.hitPoints = c.hitPointsMax; c.energy = c.energyMax;
  setRng(fixedRng(0.99));
  var b1 = Game.Battle.start('plains_field_rat');
  assert(b1.companion && b1.companion.hp === hpMax, 'first battle rehydrates the companion at full HP');
  b1.monster.hp = b1.monster.hpMax = 999999; b1.monster.energy = 999999; b1.monster.damage = 0;
  b1.companion.hp = Math.max(1, b1.companion.hp - 20); // simulate damage taken this battle
  setRng(fixedRng(0.01)); // comfortably below fleeChance -> flee succeeds
  Game.Battle.flee();
  assert(b1.phase === 'fled', 'sanity: battle 1 resolved as fled, phase=' + b1.phase);
  assert(c.companion.hp === b1.companion.hp, "fleeing writes the companion's current (damaged) HP back to character.companion");
  Game.Battle.endBattle();
  var hpAfter1 = c.companion.hp;
  assert(hpAfter1 < hpMax, 'sanity: the persisted HP is indeed reduced from max, got ' + hpAfter1 + ' / ' + hpMax);

  setRng(fixedRng(0.99));
  var b2 = Game.Battle.start('plains_field_rat');
  assert(b2.companion && b2.companion.hp === hpAfter1,
    'the SECOND battle rehydrates the companion at the SAME persisted (damaged) HP — semi-permanent, not restored between battles (D3)');
  Game.Battle.flee();
  Game.Battle.endBattle();
})();

// =================== Test 10: disperse on player defeat (D6) — unconditional, even at full companion HP ===================
console.log('\n=== Test 10: a lost battle disperses the companion unconditionally (D6), even if it is still alive at full HP ===');
(function () {
  var c = makeCharacter({ name: 'LossTest' });
  setLevel(c, 60);
  Game.Companion.summon(c, 'comp_wind'); // no self-taunt rider, so the monster's counter always targets the player
  c.hitPoints = 1; c.energy = c.energyMax;
  setRng(fixedRng(0.99)); // no dodge
  var b = Game.Battle.start('plains_field_rat');
  assert(c.companion !== null, 'sanity: the companion is bound and alive before the loss');
  b.monster.techs = [];
  b.monster.hp = b.monster.hpMax = 999999; // survives the companion's own automatic hit
  b.monster.damage = 999999; // guaranteed lethal counter-attack
  Game.Battle.defend();
  assert(b.phase === 'lost', 'sanity: the battle resolved as lost, phase=' + b.phase);
  assert(c.companion === null, 'onLoss disperses the companion unconditionally (D6), even though it was still alive at full HP');
  Game.Battle.endBattle();
})();

console.log('\n=== Test 11: 5-down Fear cutoff (lead sim ratchet) — a companion idles when the player is >= COMPANION_FEAR_SUPPRESS_LEVELS below the enemy ===');
(function () {
  var c = makeCharacter({ name: 'FearCutoffTest' });
  setLevel(c, 60);
  c.dexterity = 999; // player-first so the +6 monster does not one-shot before the companion ever acts
  Game.Character.recalcDerived(c);
  Game.Companion.summon(c, 'comp_fire'); // Fire so we can also assert NO Burn is applied while idling
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax; // plenty of Energy: any idle must be the Fear cutoff, not an Energy shortfall
  setRng(fixedRng(0.5));
  var b = Game.Battle.start('ukai_cave_warden'); // L66 vs player L60 => 6 levels down, >= the 5-level cutoff
  assert(Game.Battle.fearLevels(b) >= BALANCE.COMPANION_FEAR_SUPPRESS_LEVELS,
    'sanity: this cell is at/beyond the Fear cutoff, fearLevels=' + Game.Battle.fearLevels(b));
  var monsterHpBefore = b.monster.hp;
  b.monster.techs = []; // isolate: the monster's own counter cannot add a Burn or touch its own HP
  b.monster.damage = 0;  // and cannot kill the player before the round's companion action resolves
  Game.Battle.defend(); // player does nothing offensive; finishRound() still fires Game.Companion.act()
  assert(b.monster.hp === monsterHpBefore,
    'the companion idled: it dealt the monster no damage at the cutoff (hp ' + monsterHpBefore + ' -> ' + b.monster.hp + ')');
  assert(!(b.monster.statuses || []).some(function (st) { return st.debuffKind === 'burn'; }),
    'the idling Fire companion applied NO Burn at the cutoff');
  assert(b.log.join(' ').indexOf('overwhelmed') !== -1, 'the idle is logged as the companion being overwhelmed');
  Game.Battle.endBattle();
})();

console.log('\n=== Test 12: the eight Conjurer companion techs are linked to the Conjuration skill and flag it for win-XP ===');
(function () {
  // (a) every summon + command tech carries skill 'Conjuration' (grants Conjuration XP on a win via
  //     js/core/battle.js techsUsedThisBattle -> onWin addSkillXp; damage techs also skill-scale).
  ['tech_summon_fire','tech_summon_water','tech_summon_earth','tech_summon_wind',
   'tech_cmd_conflagration','tech_cmd_renewing_tide','tech_cmd_bulwark','tech_cmd_tailwind'].forEach(function (id) {
    var def = Game.Battle.getTech(id);
    assert(def && def.skill === 'Conjuration', id + " is linked to the Conjuration skill, got " + (def && def.skill));
  });
  assert(BALANCE.SKILLS.indexOf('Conjuration') !== -1, 'Conjuration is a real skill (BALANCE.SKILLS)');

  // (b) casting a Bind tech flags Conjuration on the battle so onWin awards Conjuration skill XP.
  var c = makeCharacter({ name: 'ConjXpTest' });
  setLevel(c, 60);
  Game.Classes.obtainClass(c, 'conjurer');
  Game.Classes.activate(c, 'conjurer', 'primary');
  Game.Classes.addClassXp(c, Game.Classes.classXpForLevel(20) / BALANCE.CLASS_XP_FRACTION_PRIMARY);
  Game.Classes.buyAbility(c, 'conjurer', 'conjurer_pact_fire');
  c.techSets[0][0] = 'tech_summon_fire';
  c.hitPoints = c.hitPointsMax; c.energy = c.energyMax;
  setRng(fixedRng(0.99));
  var b = Game.Battle.start('plains_field_rat');
  assert(!b.techsUsedThisBattle['Conjuration'], 'sanity: Conjuration not yet flagged before casting');
  Game.Battle.useTech('tech_summon_fire');
  assert(b.techsUsedThisBattle['Conjuration'] === true,
    'casting a Bind tech flags Conjuration for the onWin skill-XP award (js/core/battle.js useTech)');
  Game.Battle.flee();
  Game.Battle.endBattle();
})();

console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' FAILURE(S)');
}
process.exit(failures ? 1 : 0);
