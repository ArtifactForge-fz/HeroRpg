// Phase 6b exit tests — Endgame World Expansion (content-only phase: new areas, monsters, items,
// techs, recipes, quests using EXISTING systems). Two parts:
//   1) Referential-integrity sweep over ALL game data (not just new content) — every id any data
//      file references by string must resolve to a real entry somewhere else.
//   2) Behavioral checks: new areas gate at their minLevels via Game.World.travelTo; the finale
//      boss eidas_echo is beatable-but-not-trivial for a debug level-40 warrior with lvl-35 gear
//      (50 sim battles, real RNG, win rate between 20% and 90%).
// Also re-runs a condensed pass of the prior 5 suites' PASS/FAIL style so this file is a single
// "did Phase 6b break anything" entry point; the 5 original suites remain the source of truth
// and are run separately (see final report).

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
global.alert = function (m) { alerts.push(m); };
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
Game.refreshCurrentScreen = function () {};
Game.renderNav = function () {};
Game.renderStatusBars = function () {};
Game.renderActions = function () {};

var failures = 0;
var passes = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error('FAIL: ' + msg);
  } else {
    passes++;
    console.log('PASS: ' + msg);
  }
}

function setRng(fn) { Game.Battle._rng = fn; }
function fixedRng(v) { return function () { return v; }; }
function realRng() { return Math.random; }
// Sequence rng: consume values in order, then fall back to a default (v1.3.1 fix 3's drop-table test).
function seqRng(values, fallback) {
  var i = 0;
  return function () { return i < values.length ? values[i++] : fallback; };
}

function itemExists(id) { return !!Game.Inventory.getItem(id); }
function monsterExists(id) { return !!Game.Battle.getMonsterDef(id); }
function techExists(id) { return !!Game.Battle.getTech(id); }
function areaExists(id) { return !!Game.World.getArea(id); }
function questExists(id) { return !!Game.Quests.getQuest(id); }

// =====================================================================
// Part 1: referential integrity over ALL game data
// =====================================================================
console.log('\n=== Part 1: referential integrity ===');

// ---- 1a) every monster drop itemId exists ----
(function () {
  var bad = [];
  Game.Data.monsters.forEach(function (m) {
    (m.drops || []).forEach(function (d) {
      if (!itemExists(d.itemId)) bad.push(m.id + ' -> drop ' + d.itemId);
    });
  });
  assert(bad.length === 0, 'every monster drop itemId exists in items.js' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1b) every monster tech id resolves in techs.js ----
(function () {
  var bad = [];
  Game.Data.monsters.forEach(function (m) {
    (m.techs || []).forEach(function (tid) {
      if (!techExists(tid)) bad.push(m.id + ' -> tech ' + tid);
    });
  });
  assert(bad.length === 0, 'every monster tech id exists in techs.js' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1c) every area monster id (regular + lair) exists ----
(function () {
  var bad = [];
  Game.Data.areas.forEach(function (a) {
    (a.monsters || []).forEach(function (mid) {
      if (!monsterExists(mid)) bad.push(a.id + ' -> monster ' + mid);
    });
    if (a.lair && !monsterExists(a.lair.monsterId)) bad.push(a.id + ' -> lair monster ' + a.lair.monsterId);
  });
  assert(bad.length === 0, 'every area monster/lair id exists in monsters.js' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1d) every shop stock itemId exists ----
(function () {
  var bad = [];
  Game.Data.areas.forEach(function (a) {
    (a.facilities || []).forEach(function (f) {
      if (f.type !== 'shop') return;
      (f.stock || []).forEach(function (iid) {
        if (!itemExists(iid)) bad.push(a.id + ' -> shop stock ' + iid);
      });
    });
  });
  assert(bad.length === 0, 'every shop stock itemId exists in items.js' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1e) every recipe input/output itemId exists ----
(function () {
  var bad = [];
  Game.Data.recipes.forEach(function (r) {
    r.inputs.forEach(function (iid) {
      if (!itemExists(iid)) bad.push(r.id + ' -> input ' + iid);
    });
    if (!itemExists(r.output)) bad.push(r.id + ' -> output ' + r.output);
  });
  assert(bad.length === 0, 'every recipe input/output itemId exists in items.js' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1f) every quest: step monsterId/itemId/areaId, giver areaId, reward itemId, acceptItems ----
(function () {
  var bad = [];
  Game.Data.quests.forEach(function (q) {
    if (!areaExists(q.giver.areaId)) bad.push(q.id + ' -> giver area ' + q.giver.areaId);
    (q.acceptItems || []).forEach(function (iid) {
      if (!itemExists(iid)) bad.push(q.id + ' -> acceptItem ' + iid);
    });
    q.steps.forEach(function (step, i) {
      if (step.kind === 'kill') {
        if (!monsterExists(step.monsterId)) bad.push(q.id + ' step' + i + ' -> monster ' + step.monsterId);
      } else if (step.kind === 'collect') {
        if (!itemExists(step.itemId)) bad.push(q.id + ' step' + i + ' -> item ' + step.itemId);
      } else if (step.kind === 'visit') {
        if (!areaExists(step.areaId)) bad.push(q.id + ' step' + i + ' -> visit area ' + step.areaId);
      } else if (step.kind === 'touch') {
        step.tokens.forEach(function (tok) {
          if (!areaExists(tok.areaId)) bad.push(q.id + ' step' + i + ' -> touch area ' + tok.areaId);
        });
      }
    });
    (q.rewards && q.rewards.items || []).forEach(function (iid) {
      if (!itemExists(iid)) bad.push(q.id + ' -> reward item ' + iid);
    });
    if (q.rewards && q.rewards.classChoice) {
      // v1.1 revision: classChoice is either a fixed array of class ids, or the sentinel string
      // 'advanced' (resolved at runtime via Game.Classes.advancedOptionsFor(c) — js/core/quests.js
      // turnIn()); only fixed arrays are checked against Game.Classes.getClass here. v1.2 Phase 2
      // adds the 'tier3' sentinel (Game.Classes.thirdTierOptionsFor(c), masters_calling).
      if (Array.isArray(q.rewards.classChoice)) {
        q.rewards.classChoice.forEach(function (cid) {
          if (!Game.Classes.getClass(cid)) bad.push(q.id + ' -> classChoice ' + cid);
        });
      } else if (q.rewards.classChoice !== 'advanced' && q.rewards.classChoice !== 'tier3') {
        bad.push(q.id + ' -> unrecognized classChoice sentinel ' + q.rewards.classChoice);
      }
    }
  });
  assert(bad.length === 0, 'every quest monsterId/itemId/areaId/giver/reward/acceptItem resolves' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1g) every tech skill name is one of BALANCE.SKILLS (skip null skill: monster/buff techs) ----
(function () {
  var bad = [];
  Game.Data.techs.forEach(function (t) {
    if (t.skill == null) return;
    if (BALANCE.SKILLS.indexOf(t.skill) === -1) bad.push(t.id + ' -> skill ' + t.skill);
  });
  assert(bad.length === 0, 'every tech skill name is one of BALANCE.SKILLS' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1h) every class ability techId exists in techs.js (incl. v1.9 `techIds` array form) ----
(function () {
  var bad = [];
  Game.Data.classes.forEach(function (cd) {
    cd.abilities.forEach(function (a) {
      if (a.kind !== 'tech') return;
      if (a.techId && !techExists(a.techId)) bad.push(cd.id + ' -> ability tech ' + a.techId);
      if (Array.isArray(a.techIds)) {
        a.techIds.forEach(function (tid) {
          if (!techExists(tid)) bad.push(cd.id + ' -> ability tech ' + tid);
        });
      }
      if (!a.techId && !Array.isArray(a.techIds)) bad.push(cd.id + ' -> ability ' + a.id + ' has neither techId nor techIds');
    });
  });
  assert(bad.length === 0, 'every class ability techId/techIds resolves in techs.js' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();


// ---- 1i) every class boss_kill obtain.monsterId exists ----
(function () {
  var bad = [];
  Game.Data.classes.forEach(function (cd) {
    if (cd.obtain && cd.obtain.kind === 'boss_kill' && !monsterExists(cd.obtain.monsterId)) {
      bad.push(cd.id + ' -> obtain monster ' + cd.obtain.monsterId);
    }
  });
  assert(bad.length === 0, 'every class boss_kill obtain monsterId exists' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1i-2) v1.2 Phase 2: every class relic obtain.itemId exists; every boss_combo_quest
// obtain.questId exists (Vaultbreaker/Heir of the Echo's special unlock routes) ----
(function () {
  var bad = [];
  Game.Data.classes.forEach(function (cd) {
    if (!cd.obtain) return;
    if (cd.obtain.kind === 'relic' && !itemExists(cd.obtain.itemId)) {
      bad.push(cd.id + ' -> relic obtain item ' + cd.obtain.itemId);
    }
    if (cd.obtain.kind === 'boss_combo_quest' && !questExists(cd.obtain.questId)) {
      bad.push(cd.id + ' -> boss_combo_quest obtain quest ' + cd.obtain.questId);
    }
  });
  assert(bad.length === 0, 'every class relic/boss_combo_quest obtain reference resolves' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- 1j) tech chain rank gating is coherent (rank>1 has a rank-1 predecessor in the same chain) ----
(function () {
  var bad = [];
  Game.Data.techs.forEach(function (t) {
    if (t.monsterOnly || t.classOnly) return;
    if (t.rank > 1) {
      var prevId = null;
      Game.Data.techs.forEach(function (t2) {
        if (t2.chain === t.chain && t2.rank === t.rank - 1) prevId = t2.id;
      });
      if (!prevId) bad.push(t.id + ' (chain ' + t.chain + ' rank ' + t.rank + ') has no rank ' + (t.rank - 1) + ' predecessor');
    }
  });
  assert(bad.length === 0, 'every rank>1 tech chain has a predecessor rank in techs.js' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// =====================================================================
// Part 2: Phase 6b specific content sanity
// =====================================================================
console.log('\n=== Part 2: Phase 6b content roster sanity ===');

var newAreaIds = ['saratus', 'northern_foothills', 'isle_of_juneros', 'kastengard_ruins', 'kastengard_deep'];
newAreaIds.forEach(function (id) {
  assert(areaExists(id), 'new area exists: ' + id);
});
assert(Game.World.getArea('saratus').minLevel === 14, 'saratus minLevel 14');
assert(Game.World.getArea('northern_foothills').minLevel === 13, 'northern_foothills minLevel 13');
assert(Game.World.getArea('isle_of_juneros').minLevel === 19, 'isle_of_juneros minLevel 19');
assert(Game.World.getArea('kastengard_ruins').minLevel === 26, 'kastengard_ruins minLevel 26');
assert(Game.World.getArea('kastengard_deep').minLevel === 33, 'kastengard_deep minLevel 33');
assert(!!Game.World.getFacility(Game.World.getArea('saratus'), 'tavern'), 'saratus has a tavern facility');
assert(!Game.World.getFacility(Game.World.getArea('saratus'), 'synthesis'), 'saratus has NO synthesis facility (Eldor-exclusive)');

var newBossIds = ['foothills_matriarch', 'juneros_leviathan', 'kastengard_custodian', 'eidas_echo'];
newBossIds.forEach(function (id) {
  var m = Game.Battle.getMonsterDef(id);
  assert(m && m.boss === true, 'boss monster exists and boss:true: ' + id);
});
assert(Game.Battle.getMonsterDef('eidas_echo').level === 40, 'eidas_echo is level 40');

var newRegularIds = [
  'foothills_frost_ram', 'foothills_barrier_wolf', 'foothills_stoneback_giant',
  'juneros_tidewalker', 'juneros_reefstalker', 'juneros_drowned_settler',
  'kastengard_wardframe', 'kastengard_anima_wraith', 'kastengard_society_remnant',
  'vault_anima_construct', 'vault_runic_horror', 'vault_forsaken_archivist'
];
assert(newRegularIds.length === 12, 'sanity: 12 new regular monster ids listed in this test');
newRegularIds.forEach(function (id) {
  assert(monsterExists(id), 'new regular monster exists: ' + id);
});

// =====================================================================
// Part 2b: Enemy-variety pass — 15 new regulars across existing areas (js/data/areas.js), 4 new
// monster-only techs, and Champion encounters (js/core/battle.js / world.js). Referential
// integrity for these ids is already covered generically by Part 1 above (every area's monster
// list and every monster's drops/techs are swept for ALL monsters, not just pre-existing ones);
// this section adds the id-existence, icon, and formula-shape checks specific to the phase brief.
// =====================================================================
console.log('\n=== Part 2b: enemy-variety-pass content sanity ===');

var newVarietyIds = [
  'plains_windrunner_kestrel', 'plains_cutpurse_vole',
  'estari_clay_husk', 'estari_anima_scavenger',
  'kuraan_prowler', 'kuraan_wind_spirit', 'majiku_beastmaster',
  'gares_bog_adder', 'gares_shellback', 'gares_torrent_naga',
  'foothills_gale_harrier', 'foothills_ridge_hound',
  'juneros_riptide_hunter', 'juneros_coral_warden',
  'kastengard_earthbound_sentinel'
];
assert(newVarietyIds.length === 15, 'sanity: 15 enemy-variety-pass monster ids listed in this test');
newVarietyIds.forEach(function (id) {
  assert(monsterExists(id), 'enemy-variety-pass monster exists: ' + id);
});

var newVarietyAreas = {
  plains_of_averast: ['plains_windrunner_kestrel', 'plains_cutpurse_vole'],
  estari_ruins: ['estari_clay_husk', 'estari_anima_scavenger'],
  kuraan_border_woods: ['kuraan_prowler', 'kuraan_wind_spirit', 'majiku_beastmaster'],
  gares_riverbanks: ['gares_bog_adder', 'gares_shellback', 'gares_torrent_naga'],
  northern_foothills: ['foothills_gale_harrier', 'foothills_ridge_hound'],
  isle_of_juneros: ['juneros_riptide_hunter', 'juneros_coral_warden'],
  kastengard_ruins: ['kastengard_earthbound_sentinel']
};
Object.keys(newVarietyAreas).forEach(function (areaId) {
  var area = Game.World.getArea(areaId);
  newVarietyAreas[areaId].forEach(function (mid) {
    assert(area.monsters.indexOf(mid) !== -1, mid + ' is registered in area ' + areaId + '.monsters');
  });
});

var newVarietyTechIds = ['mon_water_torrent', 'mon_wind_buffet', 'mon_venomous_bite', 'mon_earthen_crush'];
newVarietyTechIds.forEach(function (tid) {
  assert(techExists(tid), 'enemy-variety-pass monster tech exists: ' + tid);
});

// ---- every new monster has an icon (fs-level check; test_icons.js is the authoritative sweep
// over ALL monsters — this just confirms the 15 new ones specifically didn't get missed) ----
(function () {
  var iconsDir = "D:/Claude - collection folder/HeroRPG/assets/icons";
  var missing = newVarietyIds.filter(function (id) { return !fs.existsSync(path.join(iconsDir, id + '.png')); });
  assert(missing.length === 0, 'every enemy-variety-pass monster has an icon' + (missing.length ? (': missing ' + missing.join(', ')) : ''));
})();

// ---- data-shape check: hp/damage/energy/xp match the header formulas within +-15% (bosses
// exempt — DESIGN.md/monsters.js header: hp=20+12*lvl, damage=3+2*lvl, energy=40+10*lvl,
// xp=BALANCE.MONSTER_XP(lvl)) ----
(function () {
  var bad = [];
  function within15(actual, expected, label, id) {
    if (expected === 0) return;
    var pct = Math.abs(actual - expected) / expected;
    if (pct > 0.15) bad.push(id + ' ' + label + ': got ' + actual + ', formula ' + expected + ' (' + (pct * 100).toFixed(1) + '% off)');
  }
  newVarietyIds.forEach(function (id) {
    var m = Game.Battle.getMonsterDef(id);
    if (!m || m.boss) return;
    within15(m.hp, BALANCE.MONSTER_HP_BASE + BALANCE.MONSTER_HP_PER_LEVEL * m.level, 'hp', id);
    within15(m.damage, BALANCE.MONSTER_DAMAGE_BASE + BALANCE.MONSTER_DAMAGE_PER_LEVEL * m.level, 'damage', id);
    within15(m.energy, BALANCE.MONSTER_ENERGY_BASE + BALANCE.MONSTER_ENERGY_PER_LEVEL * m.level, 'energy', id);
    within15(m.xp, BALANCE.MONSTER_XP(m.level), 'xp', id);
  });
  assert(bad.length === 0, 'every enemy-variety-pass monster\'s hp/damage/energy/xp is within +-15% of the header formula' + (bad.length ? (': ' + bad.join('; ')) : ''));
})();

var newQuestIds = [
  'saratus_foothills_intro', 'foothills_matriarch_boss', 'juneros_settlements_1',
  'juneros_leviathan_boss', 'kastengard_investigation', 'echo_of_eidas'
];
newQuestIds.forEach(function (id) {
  assert(Game.Data.quests.some(function (q) { return q.id === id; }), 'new quest exists: ' + id);
});
var finale = Game.Data.quests.filter(function (q) { return q.id === 'echo_of_eidas'; })[0];
assert(finale.levelMin === 36, 'echo_of_eidas levelMin 36');
// v1.7 Phase Q (docs/SPEC-V1.7-CONTENT-UX.md §2) [revised]: re-homed Eldor -> Kastengard Vanguard
// Camp (minLevel 26, below this quest's own levelMin 36) so the mid-arc band owns its own finale
// hub instead of routing back to Eldor; rewards/steps unchanged.
assert(finale.giver.areaId === 'kastengard_vanguard_camp', 'echo_of_eidas given at kastengard_vanguard_camp');
assert(finale.rewards.trainingPoints === 5, 'echo_of_eidas grants 5 Training Points');
assert(finale.rewards.items.indexOf('tent_expedition_pavilion') !== -1, 'echo_of_eidas grants tent_expedition_pavilion');
// v1.6 P3 EI-6 (SPEC-V1.6-REBALANCE.md §3/§6.2, REVIEW-2026-07-16.md EI-6): tent_expedition_pavilion
// is NO LONGER the top-tier tent -- it was re-stated to rung 3/6 of the new full-range camp-heal
// ladder (tentQuality 0.75 -> 0.45); the new top rung is tent_skysilk_sanctuary (levelReq 85,
// tentQuality 0.75). echo_of_eidas (js/data/quests.js, a level-36 finale reward) still grants
// tent_expedition_pavilion unchanged -- the reward ITSELF (same item id, same effect) is
// unaffected; only its "reward the top-tier tent" description was stale, FIXED in v1.6 P4
// (docs/SPEC-V1.6-REBALANCE.md §3, the "stale content flag from P3" item) by correcting the
// reward comment in js/data/quests.js to describe the tent accurately. This assertion checks the
// item's own LOCKED rung value instead of a "genuinely the max" claim that is no longer true by
// design.
var topTent = Game.Inventory.getItem('tent_expedition_pavilion');
assert(topTent.tentQuality === 0.45, 'tent_expedition_pavilion carries its v1.6 P3 EI-6 rung-3/6 value (0.45), got ' + topTent.tentQuality);

// =====================================================================
// Part 2c: Phase 9 unique equipment (js/data/items.js) — monster-only, never sold, never
// synthesized. archived concept: reference/forum/t-756.md namedrops "Unique" items directly
// ("Meh, three uniques?") in the same thread that anchors the camping-robbery mechanic below.
// =====================================================================
console.log('\n=== Part 2c: unique equipment integrity (dropped once, never shopped/synthesized, has an icon) ===');

var uniqueItems = Game.Data.items.filter(function (it) { return it.tags && it.tags.indexOf('unique') !== -1; });
assert(uniqueItems.length === 30, 'sanity: 30 unique items defined in items.js (12 pre-Level-Arc + Band A\'s light_body_kuraan_ashcloak/rod_ashenbrand_conduit/sword_warlords_broken_oath + Band B\'s light_body_highland_ashmantle/rod_stormwraiths_core/polearm_chieftains_warpike + Band C\'s light_body_frostwalkers_shroud/rod_deeplings_core/hth_deep_dwellers_claw + Band D\'s light_body_estari_anima_shroud/rod_wellspring_heartcore/sword_warden_primes_relic + Band E\'s light_body_anima_scoured_wraps/rod_anima_horrors_core/sword_anima_horrors_edge + Band F\'s light_body_voidmoon_wraps/rod_devourers_core/sword_ascendants_judgment -- THE ARC FINALE\'s capstone drop), got ' + uniqueItems.length);

// ---- every unique item is dropped by EXACTLY ONE monster ----
(function () {
  var bad = [];
  uniqueItems.forEach(function (it) {
    var droppers = Game.Data.monsters.filter(function (m) {
      return (m.drops || []).some(function (d) { return d.itemId === it.id; });
    });
    if (droppers.length !== 1) bad.push(it.id + ' dropped by ' + droppers.length + ' monsters (' + droppers.map(function (m) { return m.id; }).join(', ') + ')');
  });
  assert(bad.length === 0, 'every unique item is dropped by exactly one monster' + (bad.length ? (': ' + bad.join('; ')) : ''));
})();

// ---- every unique item is appended LAST in its dropping monster's drops array (established
// convention: appended entries don't disturb existing rates) — EXCEPT eidas_echo's
// sword_skyspire_ember_blade. v1.3.1 fix 3 (docs/REVIEW-2026-07-11.md Part 3 C1) reordered
// eidas_echo's drops so its guaranteed lore_eidas_final_journal (chance 1) sits LAST, as the true
// fallback — a chance-1 entry must never be followed by anything else (first-hit-wins makes every
// later entry dead code), which now outranks the "unique is always last" convention specifically
// on this one monster. See js/data/monsters.js eidas_echo's own drops comment for the full
// rationale and effective-probability math.
(function () {
  var bad = [];
  var GUARANTEED_FALLBACK_EXCEPTIONS = { 'sword_skyspire_ember_blade|eidas_echo': true };
  uniqueItems.forEach(function (it) {
    Game.Data.monsters.forEach(function (m) {
      var idx = (m.drops || []).map(function (d) { return d.itemId; }).indexOf(it.id);
      if (idx === -1) return;
      if (GUARANTEED_FALLBACK_EXCEPTIONS[it.id + '|' + m.id]) return;
      if (idx !== m.drops.length - 1) bad.push(it.id + ' is not the LAST drop entry on ' + m.id);
    });
  });
  assert(bad.length === 0, 'every unique item is the last drop entry on its monster (except the documented eidas_echo guaranteed-fallback exception)' + (bad.length ? (': ' + bad.join('; ')) : ''));
})();

// ---- zero unique items appear in any shop stock ----
(function () {
  var bad = [];
  Game.Data.areas.forEach(function (a) {
    (a.facilities || []).forEach(function (f) {
      if (f.type !== 'shop') return;
      (f.stock || []).forEach(function (iid) {
        if (uniqueItems.some(function (it) { return it.id === iid; })) bad.push(a.id + ' shop stocks unique ' + iid);
      });
    });
  });
  assert(bad.length === 0, 'zero unique items appear in any shop stock' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- zero unique items appear as a recipe input or output ----
(function () {
  var bad = [];
  Game.Data.recipes.forEach(function (r) {
    r.inputs.forEach(function (iid) {
      if (uniqueItems.some(function (it) { return it.id === iid; })) bad.push(r.id + ' input uses unique ' + iid);
    });
    if (uniqueItems.some(function (it) { return it.id === r.output; })) bad.push(r.id + ' output is a unique ' + r.output);
  });
  assert(bad.length === 0, 'zero unique items appear in any synthesis recipe' + (bad.length ? (': ' + bad.join(', ')) : ''));
})();

// ---- every unique item has an icon (fs-level; test_icons.js is the authoritative sweep over ALL
// items — this just confirms the 12 new ones specifically weren't missed) ----
(function () {
  var iconsDir = "D:/Claude - collection folder/HeroRPG/assets/icons";
  var missing = uniqueItems.filter(function (it) { return !fs.existsSync(path.join(iconsDir, it.id + '.png')); });
  assert(missing.length === 0, 'every unique item has an icon' + (missing.length ? (': missing ' + missing.map(function (it) { return it.id; }).join(', ')) : ''));
})();

// ---- boss-signature spread: exactly one unique per named boss band (10/18/25/32-40) ----
(function () {
  var bossHolders = {
    estari_ruin_warden: 'rod_wardens_anima_core',
    foothills_matriarch: 'hth_matriarchs_fang_wraps',
    juneros_leviathan: 'heavy_body_leviathanhide_bulwark',
    eidas_echo: 'sword_skyspire_ember_blade'
  };
  Object.keys(bossHolders).forEach(function (monsterId) {
    var m = Game.Battle.getMonsterDef(monsterId);
    assert(m && m.boss === true, 'boss-signature holder is a real boss: ' + monsterId);
    var has = (m.drops || []).some(function (d) { return d.itemId === bossHolders[monsterId]; });
    assert(has, monsterId + ' drops its signature unique ' + bossHolders[monsterId]);
  });
})();

// ---- at most one unique item carries the 'cursed' tag ----
(function () {
  var cursedUniques = uniqueItems.filter(function (it) { return it.tags.indexOf('cursed') !== -1; });
  assert(cursedUniques.length <= 1, 'at most one unique item is cursed, got ' + cursedUniques.length);
})();

// =====================================================================
// Part 3: new areas gate at their minLevels via Game.World.travelTo
// =====================================================================
console.log('\n=== Part 3: new-area level gating via Game.World.travelTo ===');

function makeCharacter(opts) {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Light Armor'] = 2;
  var c = Game.Character.create({
    race: 'Human',
    name: (opts && opts.name) || 'ContentTester',
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

[
  { id: 'saratus', minLevel: 14 },
  { id: 'northern_foothills', minLevel: 13 },
  { id: 'isle_of_juneros', minLevel: 19 },
  { id: 'kastengard_ruins', minLevel: 26 },
  { id: 'kastengard_deep', minLevel: 33 }
].forEach(function (spec) {
  var c = makeCharacter();
  setLevel(c, spec.minLevel - 1);
  var blocked = Game.World.travelTo(spec.id);
  assert(blocked.ok === false, spec.id + ' rejects travel one level below its gate (Lv ' + (spec.minLevel - 1) + ')');
  assert(c.currentLocation !== spec.id, spec.id + ' currentLocation unchanged after rejected travel');

  setLevel(c, spec.minLevel);
  var allowed = Game.World.travelTo(spec.id);
  assert(allowed.ok === true, spec.id + ' allows travel exactly at its gate (Lv ' + spec.minLevel + ')');
  assert(c.currentLocation === spec.id, spec.id + ' currentLocation updated after accepted travel');
});

// =====================================================================
// Part 4: eidas_echo beats-check — debug level-40 warrior with lvl-35 gear, 50 sim battles,
// real RNG. Assert win rate between 20% and 90% (beatable but not trivial, per phase brief).
// =====================================================================
console.log('\n=== Part 4: eidas_echo simulated beats-check (50 battles, real RNG) ===');

function countConsumables(c) {
  var n = 0;
  for (var i = 0; i < c.inventory.length; i++) {
    if (c.inventory[i] === 'potion_greater_healing' || c.inventory[i] === 'crystal_pure_anima') n++;
  }
  return n;
}

function buildLevel40Warrior() {
  var skillPoints = {};
  BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
  skillPoints['Swords'] = 3;
  skillPoints['Heavy Armor'] = 2;
  var c = Game.Character.create({
    race: 'Human',
    name: 'FinalBossTester',
    gender: 'Male',
    skillPoints: skillPoints
  });

  setLevel(c, 40);
  // Level 40 grants 5 stat points/level from level 2 on (39 levels * 5 = 195), spend them all
  // into Strength/Vitality/Endurance for a melee-focused build (a "debug-level-40 warrior").
  c.statPoints += 39 * BALANCE.LEVELUP_STAT_POINTS - c.statPoints; // normalize to exactly 39 levels' worth, in case create() granted any
  var totalPoints = c.statPoints;
  var i;
  for (i = 0; i < totalPoints; i++) {
    var stat = (i % 5 === 0) ? 'vitality' : (i % 5 === 1 ? 'endurance' : 'strength');
    Game.Character.spendStatPoint(c, stat);
  }

  // Gear: lvl-35 weapon + armor (Phase 6b tier-2 gear), all requirements should be met at Lv 40
  // with the stat spend above (statReqs strength 44 for the tier-2 weapons/heavy armor).
  var gearIds = [
    'sword_kastengard_relic_blade', // weapon, str req 44
    'heavy_body_vault_bulwark', // body armor, str req 40
    'shield_arkan_wardplate' // offhand shield
  ];
  gearIds.forEach(function (id) {
    Game.Inventory.addItem(c, id);
    var res = Game.Inventory.equip(c, id);
    if (!res.ok) throw new Error('test setup: could not equip ' + id + ': ' + res.failures.join(' '));
  });

  // A stack of healing potions/energy crystals so the sim isn't gated purely by consumables
  // (we want the boss's own difficulty curve, not an inventory-management puzzle).
  for (i = 0; i < 5; i++) {
    Game.Inventory.addItem(c, 'potion_greater_healing');
    Game.Inventory.addItem(c, 'crystal_pure_anima');
  }

  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return c;
}

function simulateOneBattle() {
  var c = buildLevel40Warrior();
  Game.state.character = c;
  Game.state.battle = null;
  Game.Battle._rng = Math.random; // real RNG for this sim (phase brief)

  var consumablesBefore = countConsumables(c);
  var battle = Game.Battle.start('eidas_echo');
  var rounds = 0;
  var MAX_ROUNDS = 500; // safety valve against infinite loops
  while (battle.phase === 'active' && rounds < MAX_ROUNDS) {
    rounds++;
    if (!Game.Battle.canAct(battle)) {
      // Out of Energy: try an energy crystal, else forced to keep "acting" (attack) until the
      // battle resolves via monster action / status ticks, matching the archived "flee or die"
      // rule loosely — for sim purposes, use a crystal if carried, else attack (which will just
      // log the no-Energy message and let the round continue via monster pressure).
      var crystalIdx = c.inventory.indexOf('crystal_pure_anima');
      if (crystalIdx !== -1) {
        Game.Battle.useItem('crystal_pure_anima');
        continue;
      }
    }
    // Heal below 40% HP if a potion is carried.
    if (c.hitPoints < c.hitPointsMax * 0.4 && c.inventory.indexOf('potion_greater_healing') !== -1) {
      Game.Battle.useItem('potion_greater_healing');
      continue;
    }
    Game.Battle.attack();
  }
  var consumablesAfter = countConsumables(c);
  return {
    phase: battle.phase, // 'won' | 'lost' | 'fled' | 'monsterFled' | 'active' (timed out)
    hpLeftFrac: c.hitPoints / c.hitPointsMax,
    consumablesConsumed: consumablesBefore - consumablesAfter
  };
}

var SIM_COUNT = 50;
var wins = 0;
var outcomes = {};
var hpLeftSum = 0;
var consumedSum = 0;
for (var run = 0; run < SIM_COUNT; run++) {
  var result = simulateOneBattle();
  outcomes[result.phase] = (outcomes[result.phase] || 0) + 1;
  if (result.phase === 'won') {
    wins++;
    hpLeftSum += result.hpLeftFrac;
    consumedSum += result.consumablesConsumed;
  }
}
var winRate = wins / SIM_COUNT;
var avgHpLeft = wins ? hpLeftSum / wins : 0;
var avgConsumed = wins ? consumedSum / wins : 0;
console.log('eidas_echo sim results over ' + SIM_COUNT + ' battles: ' + JSON.stringify(outcomes) +
  ' — win rate ' + (winRate * 100).toFixed(1) + '%, avg HP left on win ' + (avgHpLeft * 100).toFixed(0) +
  '%, avg consumables spent ' + avgConsumed.toFixed(1));
// Phase 7 balance-pass contract (replaces the pre-retune 20-90% band): a PREPARED max-level
// character (best gear, rested, potions+crystals stocked) should win reliably, but the final
// boss must extract a real cost — either meaningful HP loss or consumed resources.
assert(winRate >= 0.6, 'eidas_echo is reliably beatable by a prepared level-40 warrior (win rate ' + (winRate * 100).toFixed(1) + '%, want >= 60%)');
assert(avgHpLeft <= 0.8 || avgConsumed >= 1, 'eidas_echo extracts a real cost on wins (avg HP left ' + (avgHpLeft * 100).toFixed(0) + '%, avg consumables spent ' + avgConsumed.toFixed(1) + ')');

// =====================================================================
// Part 5 (v1.3.1 fix 3): eidas_echo's reordered drop table (js/data/monsters.js). Before the fix,
// the guaranteed lore_eidas_final_journal (chance 1) sat AHEAD of quest_eidas_echo_seal (0.7) and
// sword_skyspire_ember_blade (0.05) — first-hit-wins made both of those permanently unreachable
// (the Heir of the Echo Legendary's only obtain route, and the roster's capstone unique). Now the
// journal sits last, as the true fallback. Stubbed-RNG, deterministic sequence through the single
// Game.Battle._rng() stub — proves each of the two previously-shadowed drops CAN fire.
// =====================================================================
console.log('\n=== Part 5: eidas_echo drop-table reorder — seal and sword can each drop (v1.3.1 fix 3) ===');

function makeDropTestCharacter() {
  var c = makeCharacter({ name: 'EidasDropTester' });
  c.dexterity = 999; // guarantees playerFirst (avoids the level-40 boss's rng-consuming opening strike)
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
  return c;
}

// (a) quest_eidas_echo_seal (0.7) can drop: 3 gear entries (0.1 each) miss, then the seal hits.
var cSeal = makeDropTestCharacter();
setRng(fixedRng(0.99));
var battleSeal = Game.Battle.start('eidas_echo');
assert(battleSeal.playerFirst === true, 'sanity: boosted Dexterity gives the player first strike (keeps the scripted rng sequence below deterministic)');
battleSeal.monster.hp = 1;
setRng(seqRng([
  0.99, 0.99, 0.99, 0.5, // attack(): no double-attack, no monster dodge, no glancing, variance roll
  0.0,                   // onWin: gold roll
  0.0,                   // onWin: shard roll
  0.99, 0.99, 0.99,      // drop loop: the 3 gear entries (chance 0.1 each) miss
  0.0                    // drop loop: quest_eidas_echo_seal (chance 0.7) hits
], 0.99));
Game.Battle.attack();
assert(battleSeal.phase === 'won', 'eidas_echo killed (seal test)');
assert(battleSeal.pendingLoot === 'quest_eidas_echo_seal', 'v1.3.1 fix 3: quest_eidas_echo_seal can drop, got pendingLoot=' + battleSeal.pendingLoot);
Game.Battle.endBattle();

// (b) sword_skyspire_ember_blade (0.05) can drop: gear + the seal all miss, then the sword hits.
var cSword = makeDropTestCharacter();
setRng(fixedRng(0.99));
var battleSword = Game.Battle.start('eidas_echo');
battleSword.monster.hp = 1;
setRng(seqRng([
  0.99, 0.99, 0.99, 0.5,
  0.0,                   // gold roll
  0.0,                   // shard roll
  0.99, 0.99, 0.99,      // 3 gear entries miss
  0.99,                  // quest_eidas_echo_seal (chance 0.7) misses
  0.0                    // sword_skyspire_ember_blade (chance 0.05) hits
], 0.99));
Game.Battle.attack();
assert(battleSword.phase === 'won', 'eidas_echo killed (sword test)');
assert(battleSword.pendingLoot === 'sword_skyspire_ember_blade', 'v1.3.1 fix 3: sword_skyspire_ember_blade can drop, got pendingLoot=' + battleSword.pendingLoot);
Game.Battle.endBattle();

// =====================================================================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED (' + passes + ' assertions)');
  process.exit(0);
} else {
  console.log(failures + ' TEST(S) FAILED (' + passes + ' passed)');
  process.exit(1);
}
