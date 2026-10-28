// Shared boss-fight fixture for the boss sims in test_p3_battle.js and test_p6b_content.js, and for
// the boss sim grid (docs/SPEC-BOSS-SIM-TECHS.md).
// docs/SPEC-BOSS-COST-RETUNE.md §4 (D5): the boss contract (docs/SPEC-BOSS-COST-BAND.md §2) is
// judged on a PREPARED hero: Human, stat points vit/end/main/main/main, skills at half level, the
// best non-unique, non-cursed gear the hero can use in every slot its archetype fills, the lineage's
// tiers open at that level (T1 L5 -> T2 L30 -> T3 L60) with every passive bought, and 6 of the best
// heal + 6 of the best Crystal the hero can use. The default build (no options) is the Paladin-line
// warrior the in-repo boss tests have always used.
//
// Policies (docs/SPEC-BOSS-SIM-TECHS.md §2):
// - 'basic' (default): use a Crystal BEFORE the next action would empty the Energy pool (useItem is
//   refused at 0 Energy), heal below 40% HP, otherwise attack (casters: best affordable Firebolt).
// - 'techs': the same, plus the hero's class techs. Below 40% HP a heal tech goes before a heal
//   item; a Conjurer re-binds a fallen companion; a buff tech is cast when it isn't running; then
//   the strongest affordable damage tech, else the basic action. A Conjurer enters the fight with
//   its pact's companion bound at full HP.
// Metrics are over wins: HP spent = HP lost summed over every action / max HP (a heal in one action
// never offsets a hit in another; a companion heal and a hit inside the same action do net out —
// HP a free heal covers is HP the hero didn't pay), consumables used, HP left, rounds.
//
// Usage: var BossFixture = require('./boss_fixture.js');
//        var sim = BossFixture.simulate(Game, 'majiku_warlord', 50, 30);
//        var sim = BossFixture.simulate(Game, 'eidas_ascendant', 100, 30, { lineage: 'conjurer', pact: 'comp_wind', policy: 'techs' });

var LINEAGES = {
  shadowknight: { classes: ['warrior', 'gladiator', 'shadowknight'], archetype: 'warrior' },
  berserker: { classes: ['warrior', 'gladiator', 'berserker'], archetype: 'warrior' },
  paladin: { classes: ['warrior', 'crusader', 'paladin'], archetype: 'warrior' },
  warden: { classes: ['warrior', 'crusader', 'warden'], archetype: 'warrior' },
  magus: { classes: ['magician', 'wizard', 'magus'], archetype: 'caster' },
  conjurer: { classes: ['magician', 'wizard', 'conjurer'], archetype: 'caster' },
  cleric: { classes: ['magician', 'sage', 'cleric'], archetype: 'caster' },
  seer: { classes: ['magician', 'sage', 'seer'], archetype: 'caster' },
  gambit: { classes: ['thief', 'rogue', 'gambit'], archetype: 'twinblade' },
  assassin: { classes: ['thief', 'rogue', 'assassin'], archetype: 'twinblade' },
  ranger: { classes: ['thief', 'mercenary', 'ranger'], archetype: 'ranger' },
  dragoon: { classes: ['thief', 'mercenary', 'dragoon'], archetype: 'dragoon' }
};
var TIER_LEVELS = [5, 30, 60];
// The level each Legendary first becomes a class option (docs/SPEC-BOSS-COST-BAND.md §3.3).
var LEGENDARIES = [['runeblade_of_kuraan', 30], ['vaultbreaker', 32], ['heir_of_the_echo', 40]];
var PACTS = { comp_fire: 'conjurer_pact_fire', comp_water: 'conjurer_pact_water', comp_earth: 'conjurer_pact_earth', comp_wind: 'conjurer_pact_wind' };

// Gear and skills per archetype (docs/SPEC-BOSS-COST-BAND.md §3.3 S1 fixtures).
var ARCHETYPES = {
  warrior: { main: 'strength', weapon: 'Swords', offhand: 'Shields', armor: 'Heavy Armor',
    skills: ['Swords', 'Heavy Armor', 'Shields', 'Dodge', 'Double Attack'] },
  twinblade: { main: 'dexterity', weapon: 'Knives', offhand: 'Knives', armor: 'Light Armor',
    skills: ['Knives', 'Light Armor', 'Dual Wield', 'Dodge', 'Double Attack'] },
  ranger: { main: 'strength', weapon: 'Swords', offhand: null, armor: 'Medium Armor',
    skills: ['Swords', 'Medium Armor', 'Dodge', 'Double Attack'] },
  dragoon: { main: 'strength', weapon: 'Polearms', offhand: null, armor: 'Medium Armor',
    skills: ['Polearms', 'Medium Armor', 'Dodge', 'Double Attack'] },
  caster: { main: 'intelligence', weapon: 'Rods', offhand: null, armor: 'Light Armor',
    skills: ['Rods', 'Light Armor', 'Dodge', 'Double Attack', 'Evocation'] }
};
var ARMOR_SLOTS = ['body', 'head', 'legs', 'feet'];
var STOCK_EACH = 6;
var HEAL_BELOW = 0.4;

function list(x) { return Array.isArray(x) ? x : Object.keys(x).map(function (k) { return x[k]; }); }

function best(items, key) {
  var b = null;
  items.forEach(function (it) { if (!b || (it[key] || 0) > (b[key] || 0)) b = it; });
  return b;
}

// Seeded RNG for the sim grid (.claude/skills/balance-sim/SKILL.md).
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function equipTech(c, techId) {
  if (c.techs.indexOf(techId) === -1) c.techs.push(techId);
  for (var s = 0; s < c.techSets.length; s++) {
    if (c.techSets[s].indexOf(techId) !== -1) return;
  }
  for (s = 0; s < c.techSets.length; s++) {
    var slot = c.techSets[s].indexOf(null);
    if (slot !== -1) { c.techSets[s][slot] = techId; return; }
  }
  throw new Error('boss fixture: no free tech slot for ' + techId);
}

// The class options a lineage has at `level`: no Legendary, then each Legendary the level allows;
// a Conjurer at T3 multiplies those by its four pacts. Each option is an opts object for build().
function classOptions(lineage, level) {
  var legendaries = [null];
  LEGENDARIES.forEach(function (l) { if (level >= l[1]) legendaries.push(l[0]); });
  var pacts = (lineage === 'conjurer' && level >= TIER_LEVELS[2]) ? Object.keys(PACTS) : [null];
  var out = [];
  pacts.forEach(function (pact) {
    legendaries.forEach(function (legendary) { out.push({ lineage: lineage, legendary: legendary, pact: pact }); });
  });
  return out;
}

function optionLabel(opts) {
  return (opts.lineage || 'paladin') + (opts.pact ? '/' + opts.pact.replace('comp_', '') : '') + (opts.legendary ? '+' + opts.legendary : '');
}

// opts: { lineage (default 'paladin'), legendary (class id or null), pact (companion kind id, Conjurer
// only), techs (true: learn and slot the class techs, bind the pact's companion) }.
function build(Game, level, opts) {
  opts = opts || {};
  var BALANCE = global.BALANCE;
  var line = LINEAGES[opts.lineage || 'paladin'];
  if (!line) throw new Error('boss fixture: unknown lineage ' + opts.lineage);
  var arch = ARCHETYPES[line.archetype];
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  var c = Game.Character.create({ race: 'Human', name: 'Prepared', gender: 'Male', skillPoints: skillPoints });
  c.level = level;
  c.xp = BALANCE.XP_TO_LEVEL(level);
  c.statPoints = (level - 1) * BALANCE.LEVELUP_STAT_POINTS;
  var total = c.statPoints, i;
  for (i = 0; i < total; i++) {
    Game.Character.spendStatPoint(c, i % 5 === 0 ? 'vitality' : (i % 5 === 1 ? 'endurance' : arch.main));
  }
  var skills = arch.skills.slice();
  if (opts.pact) skills.push('Conjuration');
  skills.forEach(function (s) { c.skills[s].level = Math.floor(level / 2); });

  // Classes: obtainClass fills the Hero Tree tier (or the Legendary slot); abilities are bought
  // directly on the class entry (the Academy facility check is a UI gate, not part of what is
  // being measured).
  var classes = list(Game.Data.classes);
  var classIds = line.classes.filter(function (id, tier) { return level >= TIER_LEVELS[tier]; });
  if (opts.legendary) classIds.push(opts.legendary);
  classIds.forEach(function (id) {
    var res = Game.Classes.obtainClass(c, id);
    if (!res.ok) throw new Error('boss fixture: could not obtain ' + id + ': ' + res.message);
    var def = classes.filter(function (k) { return k.id === id; })[0];
    c.classes[id].abilities = def.abilities.filter(function (a) { return a.kind === 'passive'; }).map(function (a) { return a.id; });
    if (!opts.techs) return;
    def.abilities.forEach(function (a) {
      if (a.kind !== 'tech') return;
      if (id === 'conjurer' && a.id !== PACTS[opts.pact]) return; // one pact per class option
      c.classes[id].abilities.push(a.id);
      (a.techIds || [a.techId]).forEach(function (tid) { equipTech(c, tid); });
    });
  });

  var items = list(Game.Data.items);
  function usable(it) {
    var tags = it.tags || [];
    return Game.Inventory.canUse(c, it).ok && tags.indexOf('unique') === -1 && tags.indexOf('cursed') === -1;
  }
  var gear = [best(items.filter(function (it) { return it.slot === 'weapon' && it.skill === arch.weapon && usable(it); }), 'damage')];
  if (arch.offhand) {
    gear.push(best(items.filter(function (it) { return it.slot === 'offhand' && it.skill === arch.offhand && usable(it); }),
      arch.offhand === 'Shields' ? 'armor' : 'damage'));
  }
  ARMOR_SLOTS.forEach(function (slot) {
    gear.push(best(items.filter(function (it) { return it.slot === slot && it.skill === arch.armor && usable(it); }), 'armor'));
  });
  gear.forEach(function (it) {
    if (!it) return;
    Game.Inventory.addItem(c, it.id);
    var res = Game.Inventory.equip(c, it.id);
    if (!res.ok) throw new Error('boss fixture: could not equip ' + it.id + ': ' + res.failures.join(' '));
  });

  // Casters learn every Firebolt rank their Evocation allows; the best affordable one is their basic action.
  var firebolts = [];
  if (line.archetype === 'caster') {
    list(Game.Data.techs).forEach(function (t) {
      if (t.chain === 'Firebolt' && (t.skillReq || 0) <= c.skills.Evocation.level) firebolts.push(t);
    });
    firebolts.sort(function (a, b) { return b.rank - a.rank; });
    firebolts.forEach(function (t) { equipTech(c, t.id); });
  }

  // Only the fixture stock counts as consumables: drop any starter consumables first.
  c.inventory = c.inventory.filter(function (id) { var it = Game.Inventory.getItem(id); return it && it.slot !== 'none'; });
  var heal = best(items.filter(function (it) { return it.heal && !it.energyRestore && it.combatUsable && usable(it); }), 'heal');
  var crystal = best(items.filter(function (it) { return /^crystal_/.test(it.id) && it.energyRestore && !it.heal && it.combatUsable && usable(it); }), 'energyRestore');
  for (i = 0; i < STOCK_EACH; i++) { c.inventory.push(heal.id); c.inventory.push(crystal.id); }

  Game.Character.recalcDerived(c);
  if (opts.techs && opts.pact) Game.Companion.summon(c, opts.pact);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return { character: c, healId: heal.id, crystalId: crystal.id, stock: 2 * STOCK_EACH,
    firebolts: firebolts.map(function (t) { return t.id; }) };
}

function buildPreparedWarrior(Game, level) { return build(Game, level); }

// The class techs the 'techs' policy can cast, grouped by what the policy does with them.
function classTechs(Game, c) {
  var out = { heal: [], damage: [], buff: [], summon: [] };
  c.techs.forEach(function (id) {
    var t = Game.Battle.getTech(id);
    if (!t || !t.classOnly || !out[t.effect]) return;
    out[t.effect].push(t);
  });
  out.damage.sort(function (a, b) { return b.power - a.power; });
  out.heal.sort(function (a, b) { return b.power - a.power; });
  return out;
}

function buildOpts(opts, techs) { return { lineage: opts.lineage, legendary: opts.legendary, pact: opts.pact, techs: techs }; }

function basicAction(Game, c, firebolts) {
  for (var i = 0; i < firebolts.length; i++) {
    var fb = Game.Battle.getTech(firebolts[i]);
    if (c.energy > Game.Battle.effectiveTechEnergyCost(c, fb)) { Game.Battle.useTech(fb.id); return; }
  }
  Game.Battle.attack();
}

// Damage probe for the 'techs' policy: the boss HP each action takes off in the opening exchange,
// averaged over PROBE_FIGHTS seeded fights. Returns the class damage techs that out-damage the basic
// action, strongest first. Probes run on their own seeds, so they never touch a trial's RNG stream.
var PROBE_FIGHTS = 20;
function rankDamageTechs(Game, bossId, level, opts) {
  var fx = build(Game, level, buildOpts(opts, true));
  var candidates = [null].concat(classTechs(Game, fx.character).damage.map(function (t) { return t.id; }));
  var avg = candidates.map(function (techId) {
    var total = 0, n = 0;
    for (var s = 0; s < PROBE_FIGHTS; s++) {
      var p = build(Game, level, buildOpts(opts, true)), c = p.character;
      Game.state.character = c;
      Game.state.battle = null;
      Game.Battle._rng = mulberry32(50000 + s);
      var battle = Game.Battle.start(bossId);
      if (battle.phase !== 'active') continue;
      var hpBefore = battle.monster.hp;
      if (techId) Game.Battle.useTech(techId); else basicAction(Game, c, p.firebolts);
      total += hpBefore - battle.monster.hp;
      n++;
    }
    return n ? total / n : 0;
  });
  var out = [];
  for (var i = 1; i < candidates.length; i++) { if (avg[i] > avg[0]) out.push([candidates[i], avg[i]]); }
  out.sort(function (a, b) { return b[1] - a[1]; });
  Game.state.battle = null;
  return out.map(function (x) { return x[0]; });
}

function fightOnce(Game, bossId, level, opts) {
  opts = opts || {};
  var BALANCE = global.BALANCE;
  var techPolicy = opts.policy === 'techs';
  var ranked = techPolicy ? (opts.ranking || rankDamageTechs(Game, bossId, level, opts)) : null;
  var fx = build(Game, level, buildOpts(opts, techPolicy));
  var c = fx.character;
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = opts.rng || Math.random; // real RNG unless the grid passes a seeded one
  function stockLeft() { return c.inventory.filter(function (id) { return id === fx.healId || id === fx.crystalId; }).length; }
  var before = stockLeft(), rounds = 0, casts = 0;
  var known = techPolicy ? classTechs(Game, c) : null;
  if (techPolicy) {
    known.damage = ranked.map(function (id) { return Game.Battle.getTech(id); });
    // A heal tech goes before the heal item only when it heals at least as much (else it wastes the turn).
    var itemHeal = Game.Inventory.getItem(fx.healId).heal;
    known.heal = known.heal.filter(function (t) { return Game.Battle.techEffectivePower(c, t) >= itemHeal; });
  }
  var hpStart = c.hitPoints;
  var battle = Game.Battle.start(bossId);
  var lost = Math.max(0, hpStart - c.hitPoints); // a boss that wins initiative strikes inside start()

  function affordable(t) {
    return Game.Classes.isClassTechUsable(c, t) && c.energy > Game.Battle.effectiveTechEnergyCost(c, t);
  }
  function companionUp(kindId) { return battle.companion && battle.companion.hp > 0 && battle.companion.kindId === kindId; }
  function usableNow(t) { return affordable(t) && (!t.requiresCompanion || companionUp(t.requiresCompanion)); }
  function buffRunning(t) {
    return battle.playerStatuses.some(function (st) { return st.type === 'buff' && st.name === t.name && st.turnsLeft > 0; });
  }
  function cast(t) { casts++; Game.Battle.useTech(t.id); }
  function act() {
    if (c.energy <= 0) { Game.Battle.attack(); return; } // out of Energy: only falling or fleeing left
    if (c.energy <= BALANCE.ATTACK_ENERGY_COST && c.inventory.indexOf(fx.crystalId) !== -1) {
      Game.Battle.useItem(fx.crystalId);
      return;
    }
    var i, t;
    if (c.hitPoints < c.hitPointsMax * HEAL_BELOW) {
      if (techPolicy) {
        for (i = 0; i < known.heal.length; i++) { if (usableNow(known.heal[i])) { cast(known.heal[i]); return; } }
      }
      if (c.inventory.indexOf(fx.healId) !== -1) { Game.Battle.useItem(fx.healId); return; }
    }
    if (techPolicy) {
      for (i = 0; i < known.summon.length; i++) {
        t = known.summon[i];
        if (!companionUp(t.summonKind) && affordable(t)) { cast(t); return; }
      }
      for (i = 0; i < known.buff.length; i++) {
        t = known.buff[i];
        if (!buffRunning(t) && usableNow(t)) { cast(t); return; }
      }
      for (i = 0; i < known.damage.length; i++) {
        if (usableNow(known.damage[i])) { cast(known.damage[i]); return; }
      }
    }
    basicAction(Game, c, fx.firebolts);
  }

  while (battle.phase === 'active' && rounds < 500) {
    rounds++;
    var hpBefore = c.hitPoints;
    act();
    lost += Math.max(0, hpBefore - Math.max(0, c.hitPoints));
  }
  var hpEnd = Math.max(0, c.hitPoints);
  return { phase: battle.phase, hpLeftFrac: hpEnd / c.hitPointsMax, hpSpentFrac: lost / c.hitPointsMax,
    consumablesUsed: before - stockLeft(), stock: fx.stock, rounds: rounds, casts: casts };
}

// Runs `trials` fights and returns win rate plus means over wins. opts as for fightOnce, plus
// `seed`: when set, trial t runs on mulberry32(seed + t) instead of Math.random.
function simulate(Game, bossId, level, trials, opts) {
  opts = opts || {};
  var wins = 0, hpLeft = 0, hpSpent = 0, used = 0, rounds = 0, casts = 0, outcomes = {}, stock = 0, lefts = [];
  var ranking = opts.policy === 'techs' ? rankDamageTechs(Game, bossId, level, opts) : null; // once per cell
  for (var t = 0; t < trials; t++) {
    var fightOpts = { ranking: ranking };
    Object.keys(opts).forEach(function (k) { fightOpts[k] = opts[k]; });
    if (opts.seed !== undefined) fightOpts.rng = mulberry32(opts.seed + t);
    var r = fightOnce(Game, bossId, level, fightOpts);
    outcomes[r.phase] = (outcomes[r.phase] || 0) + 1;
    stock = r.stock;
    if (r.phase === 'won') {
      wins++; hpLeft += r.hpLeftFrac; hpSpent += r.hpSpentFrac; used += r.consumablesUsed; rounds += r.rounds; casts += r.casts;
      lefts.push(r.hpLeftFrac);
    }
  }
  lefts.sort(function (a, b) { return a - b; });
  return { winRate: wins / trials, avgHpLeft: wins ? hpLeft / wins : 0, p10HpLeft: wins ? lefts[Math.floor(0.1 * (wins - 1))] : 0,
    avgHpSpent: wins ? hpSpent / wins : 0, avgConsumed: wins ? used / wins : 0, avgRounds: wins ? rounds / wins : 0,
    avgCasts: wins ? casts / wins : 0, stock: stock, outcomes: outcomes, trials: trials };
}

function describe(bossId, s) {
  return bossId + ' sim results over ' + s.trials + ' battles: ' + JSON.stringify(s.outcomes) + ' — win rate ' +
    (s.winRate * 100).toFixed(1) + '%, avg HP spent per win ' + (s.avgHpSpent * 100).toFixed(0) + '%, avg HP left on win ' +
    (s.avgHpLeft * 100).toFixed(0) + '%, avg consumables spent ' + s.avgConsumed.toFixed(1) + ' of ' + s.stock;
}

module.exports = { LINEAGES: LINEAGES, classOptions: classOptions, optionLabel: optionLabel, build: build,
  buildPreparedWarrior: buildPreparedWarrior, fightOnce: fightOnce, simulate: simulate, describe: describe, mulberry32: mulberry32 };
