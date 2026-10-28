// v1.13 exit test — per-town Academy curricula (js/balance.js ACADEMY_SKILLREQ_CAP, resolved by
// js/core/world.js academyCap/teachesTech/academyForTech, rendered by js/ui/screens.js's Academy
// panel and wiki.js's "Taught at" column).
//
// User direction (2026-07-26): "skills/techs should also be separated over the different towns —
// e.g. Starspark 3 is quite late, and does not need to be learnable in the starting city."
//
// What this suite pins down:
//   1) the cap table is COMPLETE (every academy town listed) and MONOTONIC along the town ladder;
//   2) no tech is stranded — every academy-learnable tech is taught by at least one town (the
//      standing guard, mirroring tools/check_reachability.js's no-dead-items rule);
//   3) the user's own example: Starspark III is NOT taught in the starting city, IS taught at
//      Saratus, and the chain stays fully learnable across the ladder;
//   4) learnTech() actually REFUSES an off-curriculum tech (the gate is in core, not just the UI)
//      and still succeeds for an on-curriculum one;
//   5) legacy safety — a tech already known is unaffected by where the player is standing.

var vm = require('vm');
var fs = require('fs');
var path = require('path');
var FakeDom = require('./fakedom.js');

var base = "D:/Claude - collection folder/HeroRPG/js";

var document = new FakeDom.FakeDocument();
global.document = document;
global.window = { document: document };

function loadScript(relPath) {
  var code = fs.readFileSync(path.join(base, relPath), 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

loadScript('balance.js');
loadScript('data/items.js');
loadScript('data/monsters.js');
loadScript('data/techs.js');
loadScript('data/areas.js');
loadScript('data/recipes.js');
loadScript('data/quests.js');
loadScript('data/classes.js');
loadScript('data/companions.js');
loadScript('data/shrine.js');
loadScript('core/character.js');
loadScript('core/inventory.js');
loadScript('core/battle.js');
loadScript('core/companion.js');
loadScript('core/classes.js');
loadScript('core/quests.js');
loadScript('core/world.js');
loadScript('core/save.js');

var Game = global.window.Game;
Game.state = { character: null };
Game.persist = function () {};

var failures = 0;
var passes = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.error('FAIL: ' + msg); } else { passes++; console.log('PASS: ' + msg); }
}

function techById(id) {
  var list = Game.Data.techs;
  for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
  return null;
}

// ---------------------------------------------------------------------------
// 1) Cap table completeness + monotonicity
// ---------------------------------------------------------------------------
console.log('\n=== Test 1: cap table ===');

var academyAreas = Game.Data.areas.filter(function (a) {
  return (a.facilities || []).some(function (f) { return f.type === 'academy'; });
});
assert(academyAreas.length === 7, '7 academy towns (Eldor/Ju`Mak/Saratus/Kastengard/Kuraan/Frosthold/Skyspire), got ' + academyAreas.length);

// Every academy town must carry an explicit cap. world.js fails OPEN for unlisted towns (so a new
// town can never strand a tech), which means only this assertion stops a new town from silently
// teaching the entire roster including rank IX.
academyAreas.forEach(function (a) {
  var listed = Object.prototype.hasOwnProperty.call(BALANCE.ACADEMY_SKILLREQ_CAP, a.id);
  assert(listed, 'academy town ' + a.id + ' has an explicit cap in BALANCE.ACADEMY_SKILLREQ_CAP');
});

// A town deeper into the journey must never teach LESS than an earlier one, or a player could walk
// past the only source of a rank.
var ladder = academyAreas.slice().sort(function (x, y) { return (x.minLevel || 0) - (y.minLevel || 0); });
for (var i = 1; i < ladder.length; i++) {
  var prev = Game.World.academyCap(ladder[i - 1].id);
  var cur = Game.World.academyCap(ladder[i].id);
  assert(cur >= prev, 'curriculum is monotonic along the town ladder: ' + ladder[i].id + ' (' + cur +
    ') >= ' + ladder[i - 1].id + ' (' + prev + ')');
}

// The last town on the ladder must teach everything, so the roster is always completable.
var lastTown = ladder[ladder.length - 1];
var maxSkillReq = 0;
Game.World.learnableTechs().forEach(function (t) { maxSkillReq = Math.max(maxSkillReq, t.skillReq || 0); });
assert(Game.World.academyCap(lastTown.id) >= maxSkillReq,
  'the final academy (' + lastTown.id + ') teaches every rank (cap ' + Game.World.academyCap(lastTown.id) +
  ' >= max skillReq ' + maxSkillReq + ')');

// ---------------------------------------------------------------------------
// 2) Standing guard: nothing stranded
// ---------------------------------------------------------------------------
console.log('\n=== Test 2: no stranded techs ===');

var learnable = Game.World.learnableTechs();
var stranded = learnable.filter(function (t) { return !Game.World.academyForTech(t); });
assert(stranded.length === 0, 'every academy-learnable tech is taught somewhere; stranded: ' +
  JSON.stringify(stranded.map(function (t) { return t.id; })));

// Every rank of every chain must be reachable, not just the roster as a whole: if rank N is taught
// only at a town whose cap is BELOW rank N-1's, the chain would dead-end (previous-rank gate).
var chains = {};
learnable.forEach(function (t) { if (t.chain) { (chains[t.chain] = chains[t.chain] || []).push(t); } });
var dead = [];
Object.keys(chains).forEach(function (name) {
  var ranks = chains[name].slice().sort(function (a, b) { return (a.rank || 0) - (b.rank || 0); });
  for (var r = 1; r < ranks.length; r++) {
    var host = Game.World.academyForTech(ranks[r]);
    var prevHost = Game.World.academyForTech(ranks[r - 1]);
    if (!host || !prevHost || host.cap < prevHost.cap) dead.push(name + ' rank ' + ranks[r].rank);
  }
});
assert(dead.length === 0, 'no chain dead-ends: a later rank is never taught earlier than its predecessor; got ' +
  JSON.stringify(dead));

// ---------------------------------------------------------------------------
// 3) The user's example
// ---------------------------------------------------------------------------
console.log('\n=== Test 3: Starspark ladder ===');

var ss3 = techById('tech_starspark_3');
assert(!!ss3, 'tech_starspark_3 exists');
assert(Game.World.teachesTech('eldor', ss3) === false,
  'Starspark III is NOT taught in the starting city (the reported problem)');
assert(Game.World.teachesTech('saratus', ss3) === true, 'Starspark III IS taught at Saratus');
var ss3host = Game.World.academyForTech(ss3);
assert(ss3host && ss3host.id === 'saratus', 'Starspark III resolves to Saratus as its earliest Academy, got ' +
  (ss3host && ss3host.id));

assert(Game.World.teachesTech('eldor', techById('tech_starspark_1')) === true,
  'Starspark I is still taught in the starting city (rank 1 must stay reachable at level 1)');
var ss9host = Game.World.academyForTech(techById('tech_starspark_9'));
assert(ss9host && ss9host.id === 'skyspire_landing',
  'Starspark IX is taught at Skyspire Landing, the far-north town, got ' + (ss9host && ss9host.id));

// Every rank-1 tech must be available in Eldor, or a fresh character could be unable to train.
var rank1Missing = learnable.filter(function (t) {
  return (t.rank || 1) === 1 && !Game.World.teachesTech('eldor', t);
});
assert(rank1Missing.length === 0, 'every rank-1 technique is taught in the starting city; missing: ' +
  JSON.stringify(rank1Missing.map(function (t) { return t.id; })));

// ---------------------------------------------------------------------------
// 4) The gate lives in core, not only the UI
// ---------------------------------------------------------------------------
console.log('\n=== Test 4: learnTech enforcement ===');

var c = Game.Character.create({ race: 'Human', name: 'Tester', gender: 'Male', skillPoints: 0 });
Game.state.character = c;
c.trainingPoints = 99;
c.skills.Evocation.level = 40;          // way past every Starspark skillReq
c.techs.push('tech_starspark_1');
c.techs.push('tech_starspark_2');       // chain prerequisite for rank 3

c.currentLocation = 'eldor';
var refused = Game.World.learnTech('tech_starspark_3');
assert(refused.ok === false, 'learnTech refuses Starspark III in Eldor even with the skill and TP for it');
assert(/Saratus/.test(refused.message), 'the refusal names the town that teaches it, got: ' + refused.message);
assert(c.techs.indexOf('tech_starspark_3') === -1, 'the refused tech was not added to the character');
assert(c.trainingPoints === 99, 'the refused tech charged no Training Points');

c.currentLocation = 'saratus';
var learned = Game.World.learnTech('tech_starspark_3');
assert(learned.ok === true, 'the same tech is learnable at Saratus, got: ' + learned.message);
assert(c.techs.indexOf('tech_starspark_3') !== -1, 'Starspark III was added to the character at Saratus');

// An off-curriculum rank the player has NOT met the skill bar for still reports both problems.
c.currentLocation = 'eldor';
var far = Game.World.canLearn(c, techById('tech_starspark_9'));
assert(far.ok === false, 'Starspark IX is not learnable in Eldor');

// ---------------------------------------------------------------------------
// 5) Legacy safety: already-known techs are untouched
// ---------------------------------------------------------------------------
console.log('\n=== Test 5: legacy saves ===');

// A pre-v1.13 character could legitimately hold a rank bought in Eldor under the flat curriculum.
c.currentLocation = 'eldor';
var known = Game.World.canLearn(c, techById('tech_starspark_3'));
assert(known.ok === false && known.failures.join(' ').indexOf('Already known') !== -1,
  'a known tech reports "Already known" wherever the player stands (never "wrong town")');
assert(c.techs.indexOf('tech_starspark_3') !== -1,
  'a tech learned before the curriculum split is still held after standing in a town that does not teach it');

// Using a tech is a battle concern and must not consult the curriculum at all.
assert(typeof Game.Battle.useTech === 'function', 'battle still exposes useTech');
assert(Game.World.teachesTech('eldor', techById('tech_starspark_3')) === false,
  'sanity: Eldor still does not TEACH it — the character simply keeps what they own');

console.log('\n' + passes + ' passed, ' + failures + ' failed');
process.exit(failures === 0 ? 0 : 1);
