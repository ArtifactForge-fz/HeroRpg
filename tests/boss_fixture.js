// Shared boss-fight fixture for the boss sims in test_p3_battle.js and test_p6b_content.js.
// docs/SPEC-BOSS-COST-RETUNE.md §4 (D5): the boss contract (docs/SPEC-BOSS-COST-BAND.md §2) is
// judged on a PREPARED hero, so every boss sim uses this one builder instead of a per-band
// under-geared warrior: Human, stat points vit/end/str/str/str, skills at half level, the best
// non-unique, non-cursed gear the hero can use in every slot, the warrior lineage open at that
// level (Warrior L5 -> Crusader L30 -> Paladin L60) with every passive bought, and 6 of the best
// heal + 6 of the best Crystal the hero can use.
//
// Policy (the in-repo boss sims' policy, with one fix): use a Crystal BEFORE the next action would
// empty the Energy pool (useItem is refused at 0 Energy, so the old "Crystal once !canAct" branch
// could never fire), heal below 40% HP, otherwise attack. Metrics are over wins: HP spent =
// (HP at start - HP at end + HP restored by heals) / max HP, consumables used, HP left.
//
// Usage: var BossFixture = require('./boss_fixture.js'); var sim = BossFixture.simulate(Game, 'majiku_warlord', 50, 30);

var WARRIOR_LINEAGE = [['warrior', 5], ['crusader', 30], ['paladin', 60]];
var HALF_LEVEL_SKILLS = ['Swords', 'Heavy Armor', 'Shields', 'Dodge', 'Double Attack'];
var ARMOR_SLOTS = ['body', 'head', 'legs', 'feet'];
var STOCK_EACH = 6;
var HEAL_BELOW = 0.4;

function list(x) { return Array.isArray(x) ? x : Object.keys(x).map(function (k) { return x[k]; }); }

function best(items, key) {
  var b = null;
  items.forEach(function (it) { if (!b || (it[key] || 0) > (b[key] || 0)) b = it; });
  return b;
}

function buildPreparedWarrior(Game, level) {
  var BALANCE = global.BALANCE;
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  var c = Game.Character.create({ race: 'Human', name: 'PreparedWarrior', gender: 'Male', skillPoints: skillPoints });
  c.level = level;
  c.xp = BALANCE.XP_TO_LEVEL(level);
  c.statPoints = (level - 1) * BALANCE.LEVELUP_STAT_POINTS;
  var total = c.statPoints, i;
  for (i = 0; i < total; i++) {
    Game.Character.spendStatPoint(c, i % 5 === 0 ? 'vitality' : (i % 5 === 1 ? 'endurance' : 'strength'));
  }
  HALF_LEVEL_SKILLS.forEach(function (s) { c.skills[s].level = Math.floor(level / 2); });

  // Classes: obtainClass fills the Hero Tree tier; passives are bought directly on the class entry
  // (the Academy facility check is a UI gate, not part of what is being measured).
  var classes = list(Game.Data.classes);
  WARRIOR_LINEAGE.forEach(function (step) {
    if (level < step[1]) return;
    var res = Game.Classes.obtainClass(c, step[0]);
    if (!res.ok) throw new Error('boss fixture: could not obtain ' + step[0] + ': ' + res.message);
    var def = classes.filter(function (k) { return k.id === step[0]; })[0];
    c.classes[step[0]].abilities = def.abilities.filter(function (a) { return a.kind === 'passive'; }).map(function (a) { return a.id; });
  });

  var items = list(Game.Data.items);
  function usable(it) {
    var tags = it.tags || [];
    return Game.Inventory.canUse(c, it).ok && tags.indexOf('unique') === -1 && tags.indexOf('cursed') === -1;
  }
  var gear = [best(items.filter(function (it) { return it.slot === 'weapon' && it.skill === 'Swords' && usable(it); }), 'damage'),
    best(items.filter(function (it) { return it.slot === 'offhand' && it.skill === 'Shields' && usable(it); }), 'armor')];
  ARMOR_SLOTS.forEach(function (slot) {
    gear.push(best(items.filter(function (it) { return it.slot === slot && it.skill === 'Heavy Armor' && usable(it); }), 'armor'));
  });
  gear.forEach(function (it) {
    if (!it) return;
    Game.Inventory.addItem(c, it.id);
    var res = Game.Inventory.equip(c, it.id);
    if (!res.ok) throw new Error('boss fixture: could not equip ' + it.id + ': ' + res.failures.join(' '));
  });

  // Only the fixture stock counts as consumables: drop any starter consumables first.
  c.inventory = c.inventory.filter(function (id) { var it = Game.Inventory.getItem(id); return it && it.slot !== 'none'; });
  var heal = best(items.filter(function (it) { return it.heal && !it.energyRestore && it.combatUsable && usable(it); }), 'heal');
  var crystal = best(items.filter(function (it) { return /^crystal_/.test(it.id) && it.energyRestore && !it.heal && it.combatUsable && usable(it); }), 'energyRestore');
  for (i = 0; i < STOCK_EACH; i++) { c.inventory.push(heal.id); c.inventory.push(crystal.id); }

  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return { character: c, healId: heal.id, crystalId: crystal.id, stock: 2 * STOCK_EACH };
}

function fightOnce(Game, bossId, level) {
  var BALANCE = global.BALANCE;
  var fx = buildPreparedWarrior(Game, level), c = fx.character;
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = Math.random; // real RNG, as the boss sims always used
  function stockLeft() { return c.inventory.filter(function (id) { return id === fx.healId || id === fx.crystalId; }).length; }
  var before = stockLeft(), hpStart = c.hitPoints, healed = 0, rounds = 0;
  var battle = Game.Battle.start(bossId);
  while (battle.phase === 'active' && rounds < 500) {
    rounds++;
    if (c.energy <= 0) { Game.Battle.attack(); continue; } // out of Energy: only falling or fleeing left
    if (c.energy <= BALANCE.ATTACK_ENERGY_COST && c.inventory.indexOf(fx.crystalId) !== -1) {
      Game.Battle.useItem(fx.crystalId);
      continue;
    }
    if (c.hitPoints < c.hitPointsMax * HEAL_BELOW && c.inventory.indexOf(fx.healId) !== -1) {
      var hpBefore = c.hitPoints;
      Game.Battle.useItem(fx.healId);
      healed += Math.max(0, c.hitPoints - hpBefore);
      continue;
    }
    Game.Battle.attack();
  }
  var hpEnd = Math.max(0, c.hitPoints);
  var result = { phase: battle.phase, hpLeftFrac: hpEnd / c.hitPointsMax, hpSpentFrac: (hpStart - hpEnd + healed) / c.hitPointsMax,
    consumablesUsed: before - stockLeft(), stock: fx.stock, rounds: rounds };
  return result;
}

// Runs `trials` fights and returns win rate plus means over wins.
function simulate(Game, bossId, level, trials) {
  var wins = 0, hpLeft = 0, hpSpent = 0, used = 0, outcomes = {}, stock = 0;
  for (var t = 0; t < trials; t++) {
    var r = fightOnce(Game, bossId, level);
    outcomes[r.phase] = (outcomes[r.phase] || 0) + 1;
    stock = r.stock;
    if (r.phase === 'won') { wins++; hpLeft += r.hpLeftFrac; hpSpent += r.hpSpentFrac; used += r.consumablesUsed; }
  }
  return { winRate: wins / trials, avgHpLeft: wins ? hpLeft / wins : 0, avgHpSpent: wins ? hpSpent / wins : 0,
    avgConsumed: wins ? used / wins : 0, stock: stock, outcomes: outcomes, trials: trials };
}

function describe(bossId, s) {
  return bossId + ' sim results over ' + s.trials + ' battles: ' + JSON.stringify(s.outcomes) + ' — win rate ' +
    (s.winRate * 100).toFixed(1) + '%, avg HP spent per win ' + (s.avgHpSpent * 100).toFixed(0) + '%, avg HP left on win ' +
    (s.avgHpLeft * 100).toFixed(0) + '%, avg consumables spent ' + s.avgConsumed.toFixed(1) + ' of ' + s.stock;
}

module.exports = { buildPreparedWarrior: buildPreparedWarrior, fightOnce: fightOnce, simulate: simulate, describe: describe };
