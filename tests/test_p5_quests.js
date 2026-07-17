// Phase 5 exit tests — quests & story (accept/cancel/kill/collect/touch/visit/turn-in,
// multi-rewards, save v5 migration, Journal + Tavern rendering) via the fakedom shim.
// Randomness stubbed via Game.Battle._rng.

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
    race: (opts && opts.race) || 'Human',
    name: (opts && opts.name) || 'QuestTester',
    gender: 'Male',
    skillPoints: skillPoints
  });
  Game.state.character = c;
  Game.state.battle = null;
  return c;
}

// Wins one battle vs monsterId deterministically (1-HP monster, no dodge/glance rolls land).
// Heals to full first: faster monsters strike once at battle start plus once per counter, and
// several helper wins in a row would otherwise grind the tester down to a real defeat.
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

// G5 quest chains (docs/SPEC-V1.4-GAMEPLAY.md §2, this phase): marks questId AND every ancestor in
// its requiresQuest chain as 'completed', directly on c.quests, WITHOUT running their accept/
// turnIn flows. accept()'s requiresQuest gate and availableAt()'s chain-hiding both only consult
// `status === 'completed'` — they don't care HOW a quest got there — so this is a legitimate
// test-only shortcut for satisfying a band test's own prerequisite. Deliberately does NOT call the
// real Game.Quests.turnIn() for the ancestors: that would ALSO grant their real gold/xp/item
// rewards, which cascades into unrelated failures further down the chain (extra xp crossing a
// level-up boundary mid-test and granting surprise Training Points; extra reward items pushing
// inventory weight over capacity for a LATER quest's own reward) — none of which the calling test
// is actually trying to exercise (each ancestor's own accept/progress/turn-in flow already has its
// own dedicated test elsewhere in this suite).
function satisfyChain(questId) {
  var c = Game.state.character;
  var quest = Game.Quests.getQuest(questId);
  if (!quest) throw new Error('satisfyChain: unknown quest ' + questId);
  if (quest.requiresQuest) satisfyChain(quest.requiresQuest);
  if (!c.quests) c.quests = {};
  c.quests[questId] = { status: 'completed', progress: { kills: {}, touched: {}, visited: {} } };
}

// =================== Test 0: data sanity ===================
console.log('\n=== Test 0: quest/story data sanity ===');
assert(Game.Data.quests.length === 46, '46 quests defined (22 pre-v1.2-Phase-3 + v1.2 Phase 3 Content-A\'s arkan_first_rite/arkan_battlemage_trial/arkan_red_moon_whispers + Level-Arc Band A\'s reclaim_the_fringe/wraiths_of_the_deepwood/the_warlords_end + Band B\'s break_the_majiku_host/storms_over_the_ridge/the_chieftains_reckoning + Band C\'s win_passage_from_the_ukai/what_slips_through_the_ice/the_deep_dwellers_reckoning + Band D\'s the_taboo_wellspring/what_the_wellspring_woke/the_warden_primes_reckoning + Band E\'s the_skyspire_ascent/what_the_society_grew/the_societys_last_stand + Band F\'s the_red_moon_crossing/what_rennick_deciphered/the_ascendants_fall -- THE ARC FINALE + v1.7 Phase R\'s arkan_calling/arkan_shaman_hunt/arkan_beastmaster_watch), got ' + Game.Data.quests.length);
assert(Game.Data.story.length === 6, '6 story chapters (level-arc F5 adds chapter_3/chapter_4/epilogue), got ' + Game.Data.story.length);
['prelude', 'chapter_1', 'chapter_2', 'chapter_3', 'chapter_4', 'epilogue'].forEach(function (id) {
  var found = Game.Data.story.some(function (ch) { return ch.id === id; });
  assert(found, 'story chapter exists: ' + id);
});
var badRefs = [];
Game.Data.quests.forEach(function (q) {
  if (!Game.World.getArea(q.giver.areaId)) badRefs.push(q.id + ' giver area ' + q.giver.areaId);
  (q.acceptItems || []).forEach(function (iid) { if (!Game.Inventory.getItem(iid)) badRefs.push(q.id + ' acceptItem ' + iid); });
  ((q.rewards && q.rewards.items) || []).forEach(function (iid) { if (!Game.Inventory.getItem(iid)) badRefs.push(q.id + ' reward ' + iid); });
  q.steps.forEach(function (step) {
    if (step.kind === 'kill' && !Game.Battle.getMonsterDef(step.monsterId)) badRefs.push(q.id + ' kill ' + step.monsterId);
    if (step.kind === 'collect' && !Game.Inventory.getItem(step.itemId)) badRefs.push(q.id + ' collect ' + step.itemId);
    if (step.kind === 'visit' && !Game.World.getArea(step.areaId)) badRefs.push(q.id + ' visit ' + step.areaId);
    if (step.kind === 'touch') {
      step.tokens.forEach(function (t) {
        var area = Game.World.getArea(t.areaId);
        if (!area) { badRefs.push(q.id + ' touch area ' + t.areaId); return; }
        var hasToken = (area.questTokens || []).some(function (qt) { return qt.label === t.label; });
        if (!hasToken) badRefs.push(q.id + ' touch token missing in area data: ' + t.label);
      });
    }
  });
});
assert(badRefs.length === 0, 'all quest data refs resolve' + (badRefs.length ? ': ' + badRefs.join(', ') : ''));
assert(!!Game.Battle.getMonsterDef('oruk_ravager') && Game.Battle.getMonsterDef('oruk_ravager').level === 7, 'oruk_ravager exists at level 7');
var kuraan = Game.World.getArea('kuraan_border_woods');
assert(kuraan.monsters.indexOf('oruk_ravager') !== -1, 'oruk_ravager huntable in Kuraan Border Woods');
['eldor', 'jumak_village', 'laik'].forEach(function (aid) {
  assert(!!Game.World.getFacility(Game.World.getArea(aid), 'tavern'), aid + ' has a tavern');
});
// Verbatim spot-checks against the archived prose.
var prelude = Game.Data.story[0];
assert(prelude.text.indexOf("Van Arius doesn't need a hero") !== -1, 'Prelude contains archived line verbatim');
var ch1 = Game.Data.story[1];
assert(ch1.text.indexOf('ninth-dimensional matter, was the life-force of Exos itself') !== -1, 'Chapter I contains archived line verbatim');
assert(ch1.text.indexOf('Skyspire') !== -1, 'Chapter I mentions the Skyspire');

// =================== Test 1: accept at giver only ===================
console.log('\n=== Test 1: accept requires being at the giver area ===');
var c1 = makeCharacter({ name: 'AcceptTest' });
Game.World.travelTo('plains_of_averast');
var res1a = Game.Quests.accept('tutorial_first_blood');
assert(res1a.ok === false && /Eldor/.test(res1a.message), 'accept blocked away from giver: ' + res1a.message);
Game.World.travelTo('eldor');
var res1b = Game.Quests.accept('tutorial_first_blood');
assert(res1b.ok === true, 'accept succeeds at giver: ' + res1b.message);
assert(c1.quests['tutorial_first_blood'] && c1.quests['tutorial_first_blood'].status === 'active', 'quest entry active');
var res1c = Game.Quests.accept('tutorial_first_blood');
assert(res1c.ok === false, 'double-accept rejected');

// =================== Test 2: Oruk level band ===================
console.log('\n=== Test 2: Oruk band — rejected at 4 and 11, accepted at 7; levelMax gates ACCEPT only (CF-3) ===');
var c2 = makeCharacter({ name: 'OrukTest' });
c2.level = 6; // pass Ju`Mak's own level gate for travel
Game.World.travelTo('jumak_village');
c2.level = 4;
var res2a = Game.Quests.accept('the_oruk');
assert(res2a.ok === false && /Level 5/.test(res2a.message), 'Oruk rejected at level 4: ' + res2a.message);
c2.level = 11;
var res2b = Game.Quests.accept('the_oruk');
assert(res2b.ok === false && /Level 10/.test(res2b.message), 'Oruk rejected at level 11: ' + res2b.message);
c2.level = 7;
var res2c = Game.Quests.accept('the_oruk');
assert(res2c.ok === true, 'Oruk accepted at level 7');
// v1.6 P4 CF-3 (docs/SPEC-V1.6-REBALANCE.md §3, REVIEW-2026-07-16.md CF-3): levelMax gates
// ACCEPT only, not turn-in. Accepted in-band at level 7 above; force-satisfy, out-level the band
// far past levelMax 10, and turn-in must STILL SUCCEED — previously this was a permanent soft-lock
// (accept in-band, out-level, and the quest could never be completed, clogging the Journal).
Game._debug.completeQuestStep('the_oruk');
assert(Game.Quests.canTurnIn('the_oruk') === true, 'Oruk steps force-satisfied');
c2.level = 20; // out-level the band far past levelMax 10
var res2d = Game.Quests.turnIn('the_oruk');
assert(res2d.ok === true, 'Oruk turn-in SUCCEEDS at level 20 after out-leveling the band (CF-3: levelMax gates accept only, no soft-lock): ' + res2d.message);

// =================== Test 3: kill progress only while active; multi-reward turn-in ===================
console.log('\n=== Test 3: kill progress gating + full multi-reward grant (gold+xp+items+TP) ===');
var c3 = makeCharacter({ name: 'KillTest' });
c3.level = 6;
Game.World.travelTo('kuraan_border_woods');
winBattle('majiku_forest_scout'); // kill BEFORE accepting
assert(!c3.quests['veteran_of_averast'], 'no quest entry before accept (pre-accept kill ignored)');
Game.World.travelTo('jumak_village');
// G5 quest chain (docs/SPEC-V1.4-GAMEPLAY.md §2, this phase): veteran_of_averast now requiresQuest
// the_oruk (Dorwen's own chain, data pass below) — satisfy it first via the debug backdoor so this
// test still isolates veteran_of_averast's OWN accept/kill-progress behavior (already covered by
// Test 2 above).
Game.Quests.accept('the_oruk');
Game._debug.completeQuestStep('the_oruk');
Game.Quests.turnIn('the_oruk');
var res3a = Game.Quests.accept('veteran_of_averast');
assert(res3a.ok === true, 'veteran quest accepted');
assert((c3.quests['veteran_of_averast'].progress.kills['majiku_forest_scout'] || 0) === 0, 'progress starts at 0 despite earlier kill');
Game.World.travelTo('kuraan_border_woods');
for (var i = 0; i < 6; i++) winBattle('majiku_forest_scout');
assert(c3.quests['veteran_of_averast'].progress.kills['majiku_forest_scout'] === 6, 'kill progress reached 6/6');
winBattle('majiku_forest_scout');
assert(c3.quests['veteran_of_averast'].progress.kills['majiku_forest_scout'] === 6, 'kill progress capped at required count');
assert(Game.Quests.canTurnIn('veteran_of_averast') === true, 'canTurnIn true at count');
var res3b = Game.Quests.turnIn('veteran_of_averast');
assert(res3b.ok === false && /Return to/.test(res3b.message), 'turn-in blocked away from giver: ' + res3b.message);
Game.World.travelTo('jumak_village');
var goldBefore3 = Game.Character.goldTotalAsGold(c3);
var xpBefore3 = c3.xp;
var tpBefore3 = c3.trainingPoints;
var tentBefore3 = Game.Quests.inventoryCount(c3, 'tent_travelers_tent');
var res3c = Game.Quests.turnIn('veteran_of_averast');
assert(res3c.ok === true, 'turn-in succeeds at giver: ' + res3c.message);
assert(Game.Character.goldTotalAsGold(c3) === goldBefore3 + 60, 'gold reward granted (+60)');
assert(c3.xp === xpBefore3 + 90, 'xp reward granted (+90)');
assert(c3.trainingPoints === tpBefore3 + 3, 'Training Point reward granted (+3, archived Training_Points.md)');
assert(Game.Quests.inventoryCount(c3, 'tent_travelers_tent') === tentBefore3 + 1, 'item reward granted (tent upgrade)');
assert(c3.quests['veteran_of_averast'].status === 'completed', 'quest marked completed');
// Kill after completion: no further tracking issues
winBattle('majiku_war_shaman');
assert(c3.quests['veteran_of_averast'].status === 'completed', 'completed entry untouched by later kills');

// =================== Test 4: cutoff wins still count for quests ===================
console.log('\n=== Test 4: cutoff win (5+ levels above) still records the quest kill ===');
var c4 = makeCharacter({ name: 'CutoffTest' });
var res4a = Game.Quests.accept('tutorial_first_blood');
assert(res4a.ok === true, 'tutorial accepted at level 1');
c4.level = 20; // far above the rat — XP/loot cutoff applies
Game.World.travelTo('plains_of_averast');
winBattle('plains_field_rat');
assert(c4.quests['tutorial_first_blood'].progress.kills['plains_field_rat'] === 1, 'cutoff kill still counted (a kill is a kill)');

// =================== Test 5: collect quest ===================
console.log('\n=== Test 5: collect turn-in blocked without items; consumes exactly the required count ===');
var c5 = makeCharacter({ name: 'CollectTest' });
var res5a = Game.Quests.accept('eldor_dr_ferrier');
assert(res5a.ok === true, 'Dr. Ferrier quest accepted in Eldor');
assert(Game.Quests.canTurnIn('eldor_dr_ferrier') === false, 'canTurnIn false with 0/4 glands');
var res5b = Game.Quests.turnIn('eldor_dr_ferrier');
assert(res5b.ok === false, 'turn-in blocked without items: ' + res5b.message);
for (var g = 0; g < 5; g++) Game.Inventory.addItem(c5, 'quest_majiku_venom_gland'); // one surplus
assert(Game.Quests.canTurnIn('eldor_dr_ferrier') === true, 'canTurnIn true with 5/4 glands carried');
var goldBefore5 = Game.Character.goldTotalAsGold(c5);
var res5c = Game.Quests.turnIn('eldor_dr_ferrier');
assert(res5c.ok === true, 'collect turn-in succeeds: ' + res5c.message);
assert(Game.Quests.inventoryCount(c5, 'quest_majiku_venom_gland') === 1, 'exactly 4 glands consumed, surplus kept');
assert(Game.Character.goldTotalAsGold(c5) === goldBefore5 + 90, 'collect quest gold granted');

// =================== Test 6: touch quest (Standing Stones) ===================
console.log('\n=== Test 6: touch only in token area; cancel resets stones; re-accept starts clean ===');
var c6 = makeCharacter({ name: 'StonesTest' });
// G5 quest chain (docs/SPEC-V1.4-GAMEPLAY.md §2, this phase): standing_stones now requiresQuest
// tutorial_first_blood (Rosalind's own chain, data pass below) — satisfy it first so accept()
// below is exercising the REAL post-chain-unlock path, not a bypass.
Game.Quests.accept('tutorial_first_blood');
Game._debug.completeQuestStep('tutorial_first_blood');
Game.Quests.turnIn('tutorial_first_blood');
var res6a = Game.Quests.accept('standing_stones');
assert(res6a.ok === true, 'Standing Stones accepted in Eldor');
var res6b = Game.Quests.touch('standing_stones', 0); // plains stone, but we are in Eldor
assert(res6b.ok === false && /Plains of Averast/.test(res6b.message), 'stone untouchable outside its area: ' + res6b.message);
Game.World.travelTo('plains_of_averast');
var res6c = Game.Quests.touch('standing_stones', 0);
assert(res6c.ok === true, 'plains stone touched in the plains');
var res6d = Game.Quests.touch('standing_stones', 1); // ruins stone from the plains
assert(res6d.ok === false, 'ruins stone untouchable from the plains');
var res6e = Game.Quests.touch('standing_stones', 0);
assert(res6e.ok === false && /already/.test(res6e.message), 'double-touch rejected');
assert(c6.quests['standing_stones'].progress.touched['plains_of_averast'] === true, 'touched progress stored');
// Cancel resets (archived: Recent_Updates.md 2007-05-09)
var res6f = Game.Quests.cancel('standing_stones');
assert(res6f.ok === true, 'Standing Stones canceled via quest module (Journal path tested below)');
assert(!c6.quests['standing_stones'], 'quest entry removed on cancel');
Game.World.travelTo('eldor');
var res6g = Game.Quests.accept('standing_stones');
assert(res6g.ok === true, 're-accept succeeds');
assert(!c6.quests['standing_stones'].progress.touched['plains_of_averast'], 're-accept starts with all stones reset (archived behavior)');
// Complete all three stones and turn in.
c6.level = 8; // clear the level gates for ruins (4) and Kuraan (6)
Game.World.travelTo('plains_of_averast');
Game.Quests.touch('standing_stones', 0);
Game.World.travelTo('estari_ruins');
Game.Quests.touch('standing_stones', 1);
Game.World.travelTo('kuraan_border_woods');
var res6h = Game.Quests.touch('standing_stones', 2);
assert(res6h.ok === true, 'third stone touched');
assert(Game.Quests.canTurnIn('standing_stones') === true, 'all stones touched -> canTurnIn');
Game.World.travelTo('eldor');
var res6i = Game.Quests.turnIn('standing_stones');
assert(res6i.ok === true, 'Standing Stones turned in: ' + res6i.message);

// =================== Test 7: reward item over capacity ===================
console.log('\n=== Test 7: over-capacity reward — nothing lost, quest stays turn-in-able ===');
var c7 = makeCharacter({ name: 'HeavyReward' });
c7.level = 8;
// v1.7 Phase Q (docs/SPEC-V1.7-CONTENT-UX.md §2): ruin_warden_boss re-homed Eldor -> Laik
// (minLevel 8, exactly this quest's own levelMin) — travel there before accepting.
Game.World.travelTo('laik');
var res7a = Game.Quests.accept('ruin_warden_boss');
assert(res7a.ok === true, 'boss quest accepted in Laik: ' + res7a.message);
Game._debug.completeQuestStep('ruin_warden_boss');
assert(Game.Quests.canTurnIn('ruin_warden_boss') === true, 'boss quest force-satisfied');
var strengthBackup7 = c7.strength;
// v1.6 P1 (CB-6, SPEC-V1.6-REBALANCE.md §6): carryCapacity now carries a flat base term
// (BALANCE.CARRY_CAPACITY_BASE=50), so strength=0 no longer zeroes capacity — force it deeply
// negative instead so the reward tablet (weight 2) still cannot fit.
c7.strength = -1000;
var goldBefore7 = Game.Character.goldTotalAsGold(c7);
var tpBefore7 = c7.trainingPoints;
var res7b = Game.Quests.turnIn('ruin_warden_boss');
assert(res7b.ok === false && /weight/i.test(res7b.message), 'turn-in refused when reward cannot be carried: ' + res7b.message);
assert(c7.quests['ruin_warden_boss'].status === 'active', 'quest still active after refused turn-in');
assert(Game.Quests.canTurnIn('ruin_warden_boss') === true, 'quest still turn-in-able');
assert(Game.Character.goldTotalAsGold(c7) === goldBefore7 && c7.trainingPoints === tpBefore7, 'no partial rewards granted on refusal');
c7.strength = strengthBackup7;
var res7c = Game.Quests.turnIn('ruin_warden_boss');
assert(res7c.ok === true, 'turn-in succeeds once capacity is restored: ' + res7c.message);
assert(Game.Quests.inventoryCount(c7, 'lore_estari_shard_tablet') === 1, 'reward item landed, nothing lost');
assert(c7.trainingPoints === tpBefore7 + 2, 'TP reward landed (+2)');

// =================== Test 8: boss quest completes off a real Ruin Warden win ===================
console.log('\n=== Test 8: boss quest progress from an actual estari_ruin_warden battle ===');
var c8 = makeCharacter({ name: 'BossTest' });
c8.level = 8;
Game.Character.recalcDerived(c8);
c8.hitPoints = c8.hitPointsMax;
// v1.7 Phase Q: ruin_warden_boss re-homed Eldor -> Laik — travel there before accepting.
Game.World.travelTo('laik');
var res8a = Game.Quests.accept('ruin_warden_boss');
assert(res8a.ok === true, 'boss quest accepted');
Game.World.travelTo('estari_ruins');
winBattle('estari_ruin_warden');
assert(c8.quests['ruin_warden_boss'].progress.kills['estari_ruin_warden'] === 1, 'Ruin Warden kill recorded');
assert(Game.Quests.canTurnIn('ruin_warden_boss') === true, 'boss quest complete off the lair win');

// =================== Test 9: delivery quest (acceptItems + visit) ===================
console.log('\n=== Test 9: delivery — crate granted on accept, reclaimed on cancel, visit satisfies ===');
var c9 = makeCharacter({ name: 'DeliveryTest' });
c9.level = 6;
// G5 quest chain (docs/SPEC-V1.4-GAMEPLAY.md §2, this phase): delivery_to_jumak now requiresQuest
// standing_stones, which itself requiresQuest tutorial_first_blood (Rosalind's chain) — satisfy
// both first via the debug backdoor (completeQuestStep force-touches every Standing Stones token
// regardless of location, so no travel is needed to clear this prerequisite).
Game.Quests.accept('tutorial_first_blood');
Game._debug.completeQuestStep('tutorial_first_blood');
Game.Quests.turnIn('tutorial_first_blood');
Game.Quests.accept('standing_stones');
Game._debug.completeQuestStep('standing_stones');
Game.Quests.turnIn('standing_stones');
var res9a = Game.Quests.accept('delivery_to_jumak');
assert(res9a.ok === true, 'delivery quest accepted');
assert(Game.Quests.inventoryCount(c9, 'quest_sealed_supply_crate') === 1, 'crate handed over on accept');
Game.Quests.cancel('delivery_to_jumak');
assert(Game.Quests.inventoryCount(c9, 'quest_sealed_supply_crate') === 0, 'crate reclaimed on cancel');
Game.Quests.accept('delivery_to_jumak');
assert(Game.Quests.inventoryCount(c9, 'quest_sealed_supply_crate') === 1, 're-accept grants exactly one crate');
assert(Game.Quests.canTurnIn('delivery_to_jumak') === false, 'not turn-in-able before visiting Ju`Mak');
Game.World.travelTo('jumak_village');
assert(c9.quests['delivery_to_jumak'].progress.visited['jumak_village'] === true, 'visit recorded on travel');
Game.World.travelTo('eldor');
assert(Game.Quests.canTurnIn('delivery_to_jumak') === true, 'turn-in-able back in Eldor with crate + visit done');
var res9b = Game.Quests.turnIn('delivery_to_jumak');
assert(res9b.ok === true, 'delivery turned in: ' + res9b.message);
assert(Game.Quests.inventoryCount(c9, 'quest_sealed_supply_crate') === 0, 'crate consumed at turn-in');

// =================== Test 10: v4 -> v5 migration (and v1 -> v5 chain) ===================
console.log('\n=== Test 10: save migration adds quests:{} ===');
var v4Character = {
  race: 'Human', name: 'V4Timer', gender: 'Male',
  strength: 8, vitality: 8, dexterity: 8, intelligence: 8, endurance: 8,
  hitPointsMax: 70, hitPoints: 70, energyMax: 110, energy: 110,
  level: 3, xp: 120, statPoints: 2, trainingPoints: 1,
  gold: 40, platinum: 0, animaShards: 5,
  monsterKills: 4, deaths: 1,
  skills: (function () {
    var t = {};
    BALANCE.SKILLS.forEach(function (s) { t[s] = { level: 0, xp: 0 }; });
    return t;
  })(),
  weaponDamageBonus: 0, equippedWeaponSkill: null,
  inventory: ['potion_minor_healing'],
  equipment: { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null },
  techs: [], techSets: [
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null]
  ],
  fury: 0,
  currentLocation: 'eldor',
  vault: { platinum: 0, gold: 0, items: [] },
  shrineBuffs: []
  // NOTE: no quests field — a real Phase 4 (v4) save.
};
localStorageStore['herorpg_save'] = JSON.stringify({ version: 4, state: { character: v4Character } });
var loaded10 = Game.Save.load();
assert(loaded10 !== null, 'v4 save loads');
assert(loaded10.character.quests && typeof loaded10.character.quests === 'object' && Object.keys(loaded10.character.quests).length === 0, 'migration adds empty quests map');
Game.state = loaded10;
Game.persist();
var resaved10 = JSON.parse(localStorageStore['herorpg_save']);
assert(resaved10.version === 10, 'resave stamps CURRENT_VERSION 10 (v1.4 P2 Advantage Points migration on top), got ' + resaved10.version);

// v1 -> v5 chain
var v1c = JSON.parse(JSON.stringify(v4Character));
delete v1c.inventory; delete v1c.equipment; delete v1c.equippedWeaponSkill;
delete v1c.techs; delete v1c.techSets; delete v1c.fury;
delete v1c.currentLocation; delete v1c.vault; delete v1c.shrineBuffs;
localStorageStore['herorpg_save'] = JSON.stringify({ version: 1, state: { character: v1c } });
var loaded1 = Game.Save.load();
assert(loaded1 !== null && Array.isArray(loaded1.character.inventory) && Array.isArray(loaded1.character.techSets) &&
  loaded1.character.currentLocation === 'eldor' && loaded1.character.vault &&
  loaded1.character.quests && Object.keys(loaded1.character.quests).length === 0,
  'v1 save chains through v2/v3/v4 to v5 with quests:{}');

// =================== Test 11: Journal renders (all 3 tabs) ===================
console.log('\n=== Test 11: Journal Active/Completed/Story tabs render ===');
var c11 = makeCharacter({ name: 'JournalTest' });
Game.state.character = c11;
Game.state.battle = null;
Game.Quests.accept('tutorial_first_blood');
Game._debug.acceptQuest('eldor_dr_ferrier');
Game._debug.completeQuestStep('eldor_dr_ferrier');
Game.Quests.turnIn('eldor_dr_ferrier'); // gives one completed quest
try {
  Game.Screens.navigate('journal');
  var journalText = document.getElementById('maincontent').textContent;
  assert(/First Blood/.test(journalText), 'Active tab lists the tutorial quest');
  assert(/slain: 0\/3/.test(journalText), 'Active tab shows kill progress 0/3');
  assert(journalText.indexOf('Cancel') !== -1, 'Active tab has a Cancel button');
} catch (e) { failures++; console.error('FAIL: journal (active) threw: ' + e.stack); }

// Switch to Completed tab
try {
  var tabs = document.getElementById('maincontent').queryAllByClass('infobox-tab');
  var completedTab = tabs.filter(function (t) { return t.textContent === 'Completed'; })[0];
  completedTab.click();
  var completedText = document.getElementById('maincontent').textContent;
  assert(/Dr\. Ferrier/.test(completedText), 'Completed tab lists the finished quest');
  assert(/Splendid specimens/.test(completedText), 'Completed tab shows completion text');
} catch (e) { failures++; console.error('FAIL: journal (completed) threw: ' + e.stack); }

// Switch to Story tab and open a chapter
try {
  var tabs11 = document.getElementById('maincontent').queryAllByClass('infobox-tab');
  var storyTab = tabs11.filter(function (t) { return t.textContent === 'Story'; })[0];
  storyTab.click();
  var storyText = document.getElementById('maincontent').textContent;
  assert(/Prelude/.test(storyText) && /Chapter I(?!I)/.test(storyText) && /Chapter II(?!I)/.test(storyText) &&
    /Chapter III(?!I)/.test(storyText) && /Chapter IV/.test(storyText) && /Epilogue/.test(storyText),
    'Story tab lists all 6 chapters (level-arc F5 adds chapter_3/chapter_4/epilogue)');
  var readButtons = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Read'; });
  assert(readButtons.length === 6, 'Story tab has 6 Read buttons');
  readButtons[0].click();
  var proseText = document.getElementById('maincontent').textContent;
  assert(/Van Arius doesn't need a hero/.test(proseText), 'Prelude prose renders after Read click');
} catch (e) { failures++; console.error('FAIL: journal (story) threw: ' + e.stack); }

// Journal Turn In button appears when ready at giver; Cancel via Journal resets stones.
try {
  // G5 quest chain (docs/SPEC-V1.4-GAMEPLAY.md §2, this phase): standing_stones now requiresQuest
  // tutorial_first_blood. c11 has tutorial_first_blood ACTIVE (not completed) at this point in the
  // test on purpose (the Journal Active-tab assertions above rely on it staying active with 0/3
  // kill progress) — so this specific accept uses the debug backdoor, which bypasses accept()'s
  // gates entirely (documented in js/debug.js), same as the pre-existing Explore-touch test below.
  Game._debug.acceptQuest('standing_stones');
  Game.World.travelTo('plains_of_averast');
  Game.Quests.touch('standing_stones', 0);
  Game.Screens.navigate('journal');
  // journalTab persists across navigations (module state) — switch back to Active first. The
  // Active tab's own label now carries the "(n/3)" cap count (v1.4 P1, G5), so match by prefix.
  var tabsBack = document.getElementById('maincontent').queryAllByClass('infobox-tab');
  tabsBack.filter(function (t) { return /^Active/.test(t.textContent); })[0].click();
  var stonesText = document.getElementById('maincontent').textContent;
  assert(/\[x\] Weathered Standing Stone/.test(stonesText), 'Journal shows touched stone checked');
  assert(/\[ \] Cracked Standing Stone/.test(stonesText), 'Journal shows untouched stone unchecked');
  var cancelBtns = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Cancel'; });
  assert(cancelBtns.length >= 1, 'Cancel buttons render in Journal');
  // Cancel the LAST active quest (standing_stones is listed after tutorial in data order)
  cancelBtns[cancelBtns.length - 1].click();
  assert(!c11.quests['standing_stones'], 'cancel via Journal removes the quest (stones reset)');
} catch (e) { failures++; console.error('FAIL: journal cancel flow threw: ' + e.stack); }

// =================== Test 12: Tavern renders in Eldor with the level-1 quest ===================
console.log('\n=== Test 12: Tavern facility panel in Eldor ===');
var c12 = makeCharacter({ name: 'TavernTest' });
Game.state.character = c12;
try {
  Game.Screens.navigate('town');
  var rows = document.getElementById('maincontent').queryAllByClass('stat-row');
  var tavernHeader = rows.filter(function (r) { return r.textContent.indexOf('Tavern') !== -1; })[0];
  assert(!!tavernHeader, 'Tavern facility header present in Eldor');
  tavernHeader.click();
  var townText = document.getElementById('maincontent').textContent;
  assert(/First Blood/.test(townText), 'Tavern lists the level-1 tutorial quest');
  assert(/Rosalind/.test(townText), 'Tavern shows the giver NPC');
  // G5 quest chain (docs/SPEC-V1.4-GAMEPLAY.md §2, this phase): standing_stones now requiresQuest
  // tutorial_first_blood — for a fresh character it's hidden ENTIRELY (not even greyed), the whole
  // point of the chain mechanic (a giver no longer dumps its whole quest list at once).
  assert(!/The Standing Stones/.test(townText), 'Standing Stones hidden before tutorial_first_blood is completed (G5 chain)');
  // v1.7 Phase Q (docs/SPEC-V1.7-CONTENT-UX.md §2): ruin_warden_boss re-homed Eldor -> Laik, so it
  // no longer appears in Eldor's own Tavern list at all — first_calling (levelMin 5, no
  // requiresQuest gate, so it's listed-but-greyed rather than hidden) now exercises the same
  // "ineligible quest still shown with a level reason" behavior.
  assert(/The First Calling/.test(townText), 'Tavern lists the level-5 class quest (greyed at level 1)');
  assert(/Requires Level 5/.test(townText), 'ineligible quest shows the level reason');
  // Accept via the Tavern UI
  var acceptBtns = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Accept'; });
  assert(acceptBtns.length >= 1, 'Accept buttons render for eligible quests');
  acceptBtns[0].click();
  assert(c12.quests['tutorial_first_blood'] && c12.quests['tutorial_first_blood'].status === 'active', 'Accept click accepts the tutorial quest');
  var townText2 = document.getElementById('maincontent').textContent;
  assert(/Already accepted/.test(townText2), 'accepted quest now shown greyed with reason');

  // G5 follow-up banner (docs/SPEC-V1.4-GAMEPLAY.md §2): completing tutorial_first_blood unlocks
  // standing_stones (same giver, Rosalind) — force-satisfy, then turn in via an ACTUAL Journal
  // "Turn In" button click (not a direct Game.Quests.turnIn() call) so the Tavern's one-shot
  // pendingFollowUpNotice gets armed exactly the way a real playthrough would (it's set inside the
  // UI click handler, js/ui/screens.js noteFollowUps), then re-open the Tavern.
  Game._debug.completeQuestStep('tutorial_first_blood');
  Game.Screens.navigate('journal');
  var journalTabs12 = document.getElementById('maincontent').queryAllByClass('infobox-tab');
  journalTabs12.filter(function (t) { return /^Active/.test(t.textContent); })[0].click();
  var turnInBtns12 = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Turn In'; });
  assert(turnInBtns12.length === 1, 'exactly one Turn In button (tutorial_first_blood)');
  turnInBtns12[0].click();
  assert(c12.quests['tutorial_first_blood'].status === 'completed', 'tutorial_first_blood completed via the Journal Turn In button');
  // townOpenFacility (module state) is still 'tavern' from the earlier header click, so the panel
  // re-renders already-open — clicking the header again here would TOGGLE IT CLOSED instead.
  Game.Screens.navigate('town');
  var townText3 = document.getElementById('maincontent').textContent;
  assert(/Rosalind has more work for you/.test(townText3), 'Tavern shows the follow-up banner after turn-in');
  assert(/The Standing Stones/.test(townText3), 'Standing Stones now listed (chain unlocked)');
} catch (e) { failures++; console.error('FAIL: tavern panel threw: ' + e.stack); }

// =================== Test 13: touch-token link on the Explore screen ===================
console.log('\n=== Test 13: Standing Stone link in hunting-area Explore actions ===');
var c13 = makeCharacter({ name: 'ExploreTouch' });
Game.state.character = c13;
try {
  Game.World.travelTo('plains_of_averast');
  Game.Screens.navigate('explore');
  var beforeText = document.getElementById('maincontent').textContent;
  assert(beforeText.indexOf('Weathered Standing Stone') === -1, 'no stone link without the active quest');
  Game._debug.acceptQuest('standing_stones');
  Game.Screens.navigate('explore');
  var afterText = document.getElementById('maincontent').textContent;
  assert(afterText.indexOf('Weathered Standing Stone') !== -1, 'stone link appears with the quest active');
  var touchBtns = document.getElementById('maincontent').queryAllByTag('button').filter(function (b) { return b.textContent === 'Touch'; });
  assert(touchBtns.length === 1, 'exactly one Touch button in the plains');
  touchBtns[0].click();
  assert(c13.quests['standing_stones'].progress.touched['plains_of_averast'] === true, 'Touch click marks the stone');
  Game.Screens.navigate('explore');
  var touchedText = document.getElementById('maincontent').textContent;
  assert(touchedText.indexOf('Weathered Standing Stone') === -1, 'stone link hidden once touched');
} catch (e) { failures++; console.error('FAIL: explore touch link threw: ' + e.stack); }

// =================== Test 14: full no-debug loop ===================
console.log('\n=== Test 14: full loop — accept tutorial, kill 3 rats in the Plains, return, turn in ===');
var c14 = makeCharacter({ name: 'LoopTest' });
Game.state.character = c14;
assert(c14.currentLocation === 'eldor', 'loop: starts in Eldor');
var loopAccept = Game.Quests.accept('tutorial_first_blood');
assert(loopAccept.ok === true, 'loop: tutorial accepted at the Eldor tavern');
Game.World.travelTo('plains_of_averast');
for (var r = 0; r < 3; r++) winBattle('plains_field_rat');
assert(c14.quests['tutorial_first_blood'].progress.kills['plains_field_rat'] === 3, 'loop: 3 rats slain');
assert(Game.Quests.canTurnIn('tutorial_first_blood') === true, 'loop: quest ready');
Game.World.travelTo('eldor');
var goldBefore14 = Game.Character.goldTotalAsGold(c14);
var xpBefore14 = c14.xp;
var potionsBefore14 = Game.Quests.inventoryCount(c14, 'potion_minor_healing');
var loopTurnIn = Game.Quests.turnIn('tutorial_first_blood');
assert(loopTurnIn.ok === true, 'loop: turned in: ' + loopTurnIn.message);
assert(Game.Character.goldTotalAsGold(c14) === goldBefore14 + 25, 'loop: +25 gold landed');
assert(c14.xp === xpBefore14 + 20, 'loop: +20 XP landed');
assert(Game.Quests.inventoryCount(c14, 'potion_minor_healing') === potionsBefore14 + 1, 'loop: potion reward landed');
assert(c14.quests['tutorial_first_blood'].status === 'completed', 'loop: quest completed');
// And it no longer shows as available at the tavern.
var avail14 = Game.Quests.availableAt('eldor');
assert(!avail14.some(function (rec) { return rec.quest.id === 'tutorial_first_blood'; }), 'loop: completed quest no longer offered');

// =================== Test 15: Professor Flad relocated to Laik (v1.2 Phase 3 Content-A) ===================
console.log('\n=== Test 15: Professor Flad no longer offered at Ju`Mak, now offered (and level-gated) at Laik ===');
var c15b = makeCharacter({ name: 'FladRelocTest' });
c15b.level = 6; // Ju`Mak's own travel gate
Game.World.travelTo('jumak_village');
var avail15a = Game.Quests.availableAt('jumak_village');
assert(!avail15a.some(function (rec) { return rec.quest.id === 'professor_flad'; }), 'professor_flad no longer offered at Ju`Mak Village');
var resFladJumak = Game.Quests.accept('professor_flad');
assert(resFladJumak.ok === false, 'accepting professor_flad at Ju`Mak fails (wrong giver area): ' + resFladJumak.message);

assert(Game.Quests.getQuest('professor_flad').levelMin === 8, 'professor_flad levelMin bumped to 8, matching Laik\'s own minLevel');
c15b.level = 7;
Game.World.travelTo('jumak_village'); // still below Laik's minLevel 8
var resFladTooLow = Game.World.travelTo('laik');
assert(resFladTooLow.ok === false, 'cannot reach Laik below its minLevel 8: ' + resFladTooLow.message);

c15b.level = 8;
var resFladTravel = Game.World.travelTo('laik');
assert(resFladTravel.ok === true, 'Laik reachable at level 8: ' + resFladTravel.message);
var avail15b = Game.Quests.availableAt('laik');
assert(avail15b.some(function (rec) { return rec.quest.id === 'professor_flad'; }), 'professor_flad now offered at Laik');
var resFladLaik = Game.Quests.accept('professor_flad');
assert(resFladLaik.ok === true, 'professor_flad accepted at Laik: ' + resFladLaik.message);
assert(c15b.quests['professor_flad'] && c15b.quests['professor_flad'].status === 'active', 'professor_flad active for this character');

// =================== Test 16: requiresRace gating — Arkan questline refused for Humans, allowed for Arkan ===================
console.log('\n=== Test 16: requiresRace gate (v1.2 Phase 3 Content-A) refuses Humans, allows Arkan ===');
var c16human = makeCharacter({ name: 'RaceGateHuman' });
Game._debug.goto('saratus'); // bypass the minLevel 14 travel gate — isolate the race check, not the level check
assert(c16human.currentLocation === 'saratus', 'sanity: Human test character placed in Saratus via debug goto');
var resHuman16 = Game.Quests.accept('arkan_first_rite');
assert(resHuman16.ok === false && /Arkan/.test(resHuman16.message), 'Human refused the Arkan questline: ' + resHuman16.message);
assert(!c16human.quests['arkan_first_rite'], 'no quest entry created for the refused Human');
// Not offered to Humans in the tavern list either? availableAt does not filter by requiresRace
// (mirrors the existing level-window behavior — quests can be LISTED and then refused at
// accept() with a clear reason), so this only asserts the accept()-time gate.

// requiresRace also enforced for the other two Arkan quests (isolate the race check by clearing
// the level gate too, same as above). Done BEFORE creating any other character below — makeCharacter's
// Game.Character.create() call reassigns Game.state.character as a side effect, so c16human must
// stay the active Game.state.character for every accept() call made on its behalf.
c16human.level = 6; // clears arkan_battlemage_trial's levelMin so the race gate is the only thing left to trip
var resHumanBattlemage16 = Game.Quests.accept('arkan_battlemage_trial');
assert(resHumanBattlemage16.ok === false && /Arkan/.test(resHumanBattlemage16.message), 'arkan_battlemage_trial also refused for this Human on the race gate specifically: ' + resHumanBattlemage16.message);

var c16arkan = makeCharacter({ name: 'RaceGateArkan', race: 'Arkan' });
assert(c16arkan.currentLocation === 'saratus', 'sanity: fresh Arkan already starts in Saratus, the quest giver area');
var resArkan16 = Game.Quests.accept('arkan_first_rite');
assert(resArkan16.ok === true, 'Arkan allowed to accept the Arkan questline: ' + resArkan16.message);
assert(c16arkan.quests['arkan_first_rite'] && c16arkan.quests['arkan_first_rite'].status === 'active', 'quest entry active for the accepting Arkan');

// =================== Test 17: Arkan questline full flow (accept -> kill -> turn-in -> rewards) ===================
console.log('\n=== Test 17: arkan_first_rite full accept/kill/turn-in flow with multi-reward grant ===');
var c17 = makeCharacter({ name: 'ArkanFlowTest', race: 'Arkan' });
assert(c17.currentLocation === 'saratus', 'sanity: fresh Arkan starts in Saratus');
var resAccept17 = Game.Quests.accept('arkan_first_rite');
assert(resAccept17.ok === true, 'arkan_first_rite accepted: ' + resAccept17.message);
assert(Game.Quests.canTurnIn('arkan_first_rite') === false, 'canTurnIn false with 0/3 rats slain');
for (var k17 = 0; k17 < 3; k17++) winBattle('plains_field_rat');
assert(c17.quests['arkan_first_rite'].progress.kills['plains_field_rat'] === 3, 'kill progress reached 3/3');
assert(Game.Quests.canTurnIn('arkan_first_rite') === true, 'canTurnIn true at count');
assert(c17.currentLocation === 'saratus', 'sanity: still in Saratus (winBattle does not travel), so turn-in needs no extra travel');
var goldBefore17 = Game.Character.goldTotalAsGold(c17);
var xpBefore17 = c17.xp;
var potionsBefore17 = Game.Quests.inventoryCount(c17, 'potion_minor_healing');
var resTurnIn17 = Game.Quests.turnIn('arkan_first_rite');
assert(resTurnIn17.ok === true, 'arkan_first_rite turned in: ' + resTurnIn17.message);
assert(Game.Character.goldTotalAsGold(c17) === goldBefore17 + 25, 'gold reward granted (+25)');
assert(c17.xp === xpBefore17 + 20, 'xp reward granted (+20)');
assert(Game.Quests.inventoryCount(c17, 'potion_minor_healing') === potionsBefore17 + 1, 'item reward granted (potion)');
assert(c17.quests['arkan_first_rite'].status === 'completed', 'quest marked completed');
// A Human cannot even reach this far (refused at accept, per Test 16) — no further cross-race
// regression risk to check here.

// =================== Test 18: Level-Arc Band A quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 18: Band A quests — reclaim_the_fringe / wraiths_of_the_deepwood / the_warlords_end ===');

// 18a) main-spine quest: accept at the camp, force-satisfy its kill/collect/visit steps, turn in
// for the full multi-reward (mirrors Test 2's the_oruk use of Game._debug.completeQuestStep).
var c18 = makeCharacter({ name: 'BandAMainTest' });
c18.level = 44;
Game.World.travelTo('kuraan_reclamation_camp');
var res18a = Game.Quests.accept('reclaim_the_fringe');
assert(res18a.ok === true, 'reclaim_the_fringe accepted at Kuraan Reclamation Camp: ' + res18a.message);
assert(Game.Quests.canTurnIn('reclaim_the_fringe') === false, 'reclaim_the_fringe not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('reclaim_the_fringe');
assert(Game.Quests.canTurnIn('reclaim_the_fringe') === true, 'reclaim_the_fringe steps force-satisfied (5x kill + 3x collect + visit deep_kuraan)');
var gold18a = Game.Character.goldTotalAsGold(c18);
var xp18a = c18.xp;
var tp18a = c18.trainingPoints;
var res18b = Game.Quests.turnIn('reclaim_the_fringe');
assert(res18b.ok === true, 'reclaim_the_fringe turn-in succeeds: ' + res18b.message);
assert(Game.Character.goldTotalAsGold(c18) === gold18a + 900, 'reclaim_the_fringe grants +900 gold');
assert(c18.xp === xp18a + 1400, 'reclaim_the_fringe grants +1400 xp');
assert(c18.trainingPoints === tp18a + 3, 'reclaim_the_fringe grants +3 Training Points');
assert(Game.Quests.inventoryCount(c18, 'sword_kuraan_reclaimers_blade') >= 1, "reclaim_the_fringe grants a Reclaimer's Blade");
assert(c18.quests['reclaim_the_fringe'].status === 'completed', 'reclaim_the_fringe marked completed');

// Band A monsters hit far harder than the 1-40 roster (damage ~3+2*level); a level-46+ test
// character still carries level-1 base HP unless stat points are spent into Vitality (Vitality
// only drives hitPointsMax via HP_PER_VITALITY, js/core/character.js — level alone does not), so
// winBattle's opening "monster strikes first" exchange (js/core/battle.js start(), playerFirst
// compares Dexterity to monster.level) would otherwise one-shot a bare level-1-HP test character
// before the helper ever gets to zero the monster's own hp. Grant this era's worth of stat points
// into Vitality first, mirroring test_p6b_content.js's buildLevel40Warrior pattern.
function grantVitalityForLevel(c, level) {
  c.level = level;
  c.xp = BALANCE.XP_TO_LEVEL(level);
  c.statPoints += (level - 1) * BALANCE.LEVELUP_STAT_POINTS - c.statPoints;
  var pts = c.statPoints;
  for (var i = 0; i < pts; i++) Game.Character.spendStatPoint(c, 'vitality');
  Game.Character.recalcDerived(c);
  c.hitPoints = c.hitPointsMax;
  c.energy = c.energyMax;
}

// 18b) side quest: REAL kill progress (not force-satisfied) via winBattle against the new Deep
// Kuraan regulars, same pattern as Test 3's veteran_of_averast loop.
var c19 = makeCharacter({ name: 'BandASideTest' });
grantVitalityForLevel(c19, 46);
Game.World.travelTo('kuraan_reclamation_camp');
satisfyChain('reclaim_the_fringe'); // G5 chain: wraiths_of_the_deepwood requiresQuest reclaim_the_fringe
var res19a = Game.Quests.accept('wraiths_of_the_deepwood');
assert(res19a.ok === true, 'wraiths_of_the_deepwood accepted: ' + res19a.message);
Game.World.travelTo('deep_kuraan');
for (var w18 = 0; w18 < 4; w18++) winBattle('kuraan_hollow_wraith');
assert(c19.quests['wraiths_of_the_deepwood'].progress.kills['kuraan_hollow_wraith'] === 4, 'real kill progress reached 4/4 via winBattle against kuraan_hollow_wraith');
assert(Game.Quests.canTurnIn('wraiths_of_the_deepwood') === true, 'wraiths_of_the_deepwood turn-in-able after 4 real kills');
Game.World.travelTo('kuraan_reclamation_camp');
var res19b = Game.Quests.turnIn('wraiths_of_the_deepwood');
assert(res19b.ok === true, 'wraiths_of_the_deepwood turn-in succeeds: ' + res19b.message);
assert(Game.Quests.inventoryCount(c19, 'sphere_cclass_2') >= 1, 'wraiths_of_the_deepwood grants a C-Class Sphere II');

// 18c) boss-kill side quest: REAL kill via winBattle against the Band A lair boss itself.
var c20 = makeCharacter({ name: 'BandABossTest' });
grantVitalityForLevel(c20, 50);
Game.World.travelTo('kuraan_reclamation_camp');
satisfyChain('reclaim_the_fringe'); // G5 chain: the_warlords_end requiresQuest reclaim_the_fringe
var res20a = Game.Quests.accept('the_warlords_end');
assert(res20a.ok === true, 'the_warlords_end accepted: ' + res20a.message);
Game.World.travelTo('deep_kuraan');
winBattle('majiku_warlord');
assert(c20.quests['the_warlords_end'].progress.kills['majiku_warlord'] === 1, 'majiku_warlord kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('kuraan_reclamation_camp');
var res20b = Game.Quests.turnIn('the_warlords_end');
assert(res20b.ok === true, 'the_warlords_end turn-in succeeds: ' + res20b.message);
assert(c20.quests['the_warlords_end'].status === 'completed', 'the_warlords_end marked completed');
assert(Game.Quests.inventoryCount(c20, 'heavy_head_kuraan_warhelm') >= 1, 'the_warlords_end grants the Kuraan Warhelm');

// =================== Test 19: Level-Arc Band B quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 19: Band B quests — break_the_majiku_host / storms_over_the_ridge / the_chieftains_reckoning ===');

// 19a) main-spine quest: accept at the (reused) camp, force-satisfy its kill/collect/visit steps,
// turn in for the full multi-reward (mirrors Test 18a's reclaim_the_fringe pattern).
var c21 = makeCharacter({ name: 'BandBMainTest' });
grantVitalityForLevel(c21, 51);
Game.World.travelTo('kuraan_reclamation_camp');
satisfyChain('reclaim_the_fringe'); // G5 chain: break_the_majiku_host requiresQuest reclaim_the_fringe (spine-behind-spine, never behind Band A's own side/boss quests)
var res21a = Game.Quests.accept('break_the_majiku_host');
assert(res21a.ok === true, 'break_the_majiku_host accepted at Kuraan Reclamation Camp: ' + res21a.message);
assert(Game.Quests.canTurnIn('break_the_majiku_host') === false, 'break_the_majiku_host not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('break_the_majiku_host');
assert(Game.Quests.canTurnIn('break_the_majiku_host') === true, 'break_the_majiku_host steps force-satisfied (5x kill + 3x collect + visit highland_war_camps)');
var gold21a = Game.Character.goldTotalAsGold(c21);
var xp21a = c21.xp;
var tp21a = c21.trainingPoints;
var res21b = Game.Quests.turnIn('break_the_majiku_host');
assert(res21b.ok === true, 'break_the_majiku_host turn-in succeeds: ' + res21b.message);
assert(Game.Character.goldTotalAsGold(c21) === gold21a + 1100, 'break_the_majiku_host grants +1100 gold');
assert(c21.xp === xp21a + 1700, 'break_the_majiku_host grants +1700 xp');
assert(c21.trainingPoints === tp21a + 3, 'break_the_majiku_host grants +3 Training Points');
assert(Game.Quests.inventoryCount(c21, 'sword_majiku_hostbreaker') >= 1, 'break_the_majiku_host grants a Hostbreaker Blade');
assert(c21.quests['break_the_majiku_host'].status === 'completed', 'break_the_majiku_host marked completed');

// 19b) side quest: REAL kill progress (not force-satisfied) via winBattle against the Highland
// War-Camps regulars, same pattern as Test 18b's wraiths_of_the_deepwood loop.
var c22 = makeCharacter({ name: 'BandBSideTest' });
grantVitalityForLevel(c22, 56);
Game.World.travelTo('kuraan_reclamation_camp');
satisfyChain('break_the_majiku_host'); // G5 chain: storms_over_the_ridge requiresQuest break_the_majiku_host (recursively satisfies reclaim_the_fringe too)
var res22a = Game.Quests.accept('storms_over_the_ridge');
assert(res22a.ok === true, 'storms_over_the_ridge accepted: ' + res22a.message);
Game.World.travelTo('highland_war_camps');
for (var w19 = 0; w19 < 4; w19++) winBattle('highland_hollow_stormwraith');
assert(c22.quests['storms_over_the_ridge'].progress.kills['highland_hollow_stormwraith'] === 4, 'real kill progress reached 4/4 via winBattle against highland_hollow_stormwraith');
assert(Game.Quests.canTurnIn('storms_over_the_ridge') === true, 'storms_over_the_ridge turn-in-able after 4 real kills');
Game.World.travelTo('kuraan_reclamation_camp');
var res22b = Game.Quests.turnIn('storms_over_the_ridge');
assert(res22b.ok === true, 'storms_over_the_ridge turn-in succeeds: ' + res22b.message);
assert(Game.Quests.inventoryCount(c22, 'sphere_dclass_2') >= 1, 'storms_over_the_ridge grants a D-Class Sphere II');

// 19c) boss-kill side quest: REAL kill via winBattle against the Band B lair boss itself.
var c23 = makeCharacter({ name: 'BandBBossTest' });
grantVitalityForLevel(c23, 60);
Game.World.travelTo('kuraan_reclamation_camp');
satisfyChain('break_the_majiku_host'); // G5 chain: the_chieftains_reckoning requiresQuest break_the_majiku_host
var res23a = Game.Quests.accept('the_chieftains_reckoning');
assert(res23a.ok === true, 'the_chieftains_reckoning accepted: ' + res23a.message);
Game.World.travelTo('highland_war_camps');
winBattle('majiku_ridge_chieftain');
assert(c23.quests['the_chieftains_reckoning'].progress.kills['majiku_ridge_chieftain'] === 1, 'majiku_ridge_chieftain kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('kuraan_reclamation_camp');
var res23b = Game.Quests.turnIn('the_chieftains_reckoning');
assert(res23b.ok === true, 'the_chieftains_reckoning turn-in succeeds: ' + res23b.message);
assert(c23.quests['the_chieftains_reckoning'].status === 'completed', 'the_chieftains_reckoning marked completed');
assert(Game.Quests.inventoryCount(c23, 'heavy_head_ridgeplate_helm') >= 1, 'the_chieftains_reckoning grants the Ridgeplate Helm');

// =================== Test 20: Level-Arc Band C quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 20: Band C quests — win_passage_from_the_ukai / what_slips_through_the_ice / the_deep_dwellers_reckoning ===');

// 20a) main-spine quest: accept at Frosthold Waystation, force-satisfy its kill/collect/visit
// steps, turn in for the full multi-reward (mirrors Test 18a/19a's pattern).
var c24 = makeCharacter({ name: 'BandCMainTest' });
grantVitalityForLevel(c24, 65); // Frosthold Waystation gates travel at minLevel 65 (quest levelMin is 61)
Game.World.travelTo('frosthold_waystation');
satisfyChain('break_the_majiku_host'); // G5 chain: win_passage_from_the_ukai requiresQuest break_the_majiku_host (spine-behind-spine, crosses from Kuraan Reclamation Camp to Frosthold Waystation)
var res24a = Game.Quests.accept('win_passage_from_the_ukai');
assert(res24a.ok === true, 'win_passage_from_the_ukai accepted at Frosthold Waystation: ' + res24a.message);
assert(Game.Quests.canTurnIn('win_passage_from_the_ukai') === false, 'win_passage_from_the_ukai not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('win_passage_from_the_ukai');
assert(Game.Quests.canTurnIn('win_passage_from_the_ukai') === true, 'win_passage_from_the_ukai steps force-satisfied (5x kill + 3x collect + visit ukai_undercaverns)');
var gold24a = Game.Character.goldTotalAsGold(c24);
var xp24a = c24.xp;
var tp24a = c24.trainingPoints;
var res24b = Game.Quests.turnIn('win_passage_from_the_ukai');
assert(res24b.ok === true, 'win_passage_from_the_ukai turn-in succeeds: ' + res24b.message);
assert(Game.Character.goldTotalAsGold(c24) === gold24a + 1300, 'win_passage_from_the_ukai grants +1300 gold');
assert(c24.xp === xp24a + 2000, 'win_passage_from_the_ukai grants +2000 xp');
assert(c24.trainingPoints === tp24a + 3, 'win_passage_from_the_ukai grants +3 Training Points');
assert(Game.Quests.inventoryCount(c24, 'sword_frosthold_vanguard_blade') >= 1, 'win_passage_from_the_ukai grants a Frosthold Vanguard Blade');
assert(c24.quests['win_passage_from_the_ukai'].status === 'completed', 'win_passage_from_the_ukai marked completed');

// 20b) side quest: REAL kill progress (not force-satisfied) via winBattle against the Ukai
// Undercaverns regulars, same pattern as Test 18b/19b's hunt-quest loop.
var c25 = makeCharacter({ name: 'BandCSideTest' });
grantVitalityForLevel(c25, 66);
Game.World.travelTo('frosthold_waystation');
satisfyChain('win_passage_from_the_ukai'); // G5 chain: what_slips_through_the_ice requiresQuest win_passage_from_the_ukai
var res25a = Game.Quests.accept('what_slips_through_the_ice');
assert(res25a.ok === true, 'what_slips_through_the_ice accepted: ' + res25a.message);
Game.World.travelTo('ukai_undercaverns');
for (var w20 = 0; w20 < 4; w20++) winBattle('ukai_hollow_deepling');
assert(c25.quests['what_slips_through_the_ice'].progress.kills['ukai_hollow_deepling'] === 4, 'real kill progress reached 4/4 via winBattle against ukai_hollow_deepling');
assert(Game.Quests.canTurnIn('what_slips_through_the_ice') === true, 'what_slips_through_the_ice turn-in-able after 4 real kills');
Game.World.travelTo('frosthold_waystation');
var res25b = Game.Quests.turnIn('what_slips_through_the_ice');
assert(res25b.ok === true, 'what_slips_through_the_ice turn-in succeeds: ' + res25b.message);
assert(Game.Quests.inventoryCount(c25, 'sphere_eclass_2') >= 1, 'what_slips_through_the_ice grants an E-Class Sphere II');

// 20c) boss-kill side quest: REAL kill via winBattle against the Band C lair boss itself.
var c26 = makeCharacter({ name: 'BandCBossTest' });
grantVitalityForLevel(c26, 70);
Game.World.travelTo('frosthold_waystation');
satisfyChain('win_passage_from_the_ukai'); // G5 chain: the_deep_dwellers_reckoning requiresQuest win_passage_from_the_ukai
var res26a = Game.Quests.accept('the_deep_dwellers_reckoning');
assert(res26a.ok === true, 'the_deep_dwellers_reckoning accepted: ' + res26a.message);
Game.World.travelTo('ukai_undercaverns');
winBattle('ukai_deep_dweller');
assert(c26.quests['the_deep_dwellers_reckoning'].progress.kills['ukai_deep_dweller'] === 1, 'ukai_deep_dweller kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('frosthold_waystation');
var res26b = Game.Quests.turnIn('the_deep_dwellers_reckoning');
assert(res26b.ok === true, 'the_deep_dwellers_reckoning turn-in succeeds: ' + res26b.message);
assert(c26.quests['the_deep_dwellers_reckoning'].status === 'completed', 'the_deep_dwellers_reckoning marked completed');
assert(Game.Quests.inventoryCount(c26, 'heavy_head_glacial_warhelm') >= 1, 'the_deep_dwellers_reckoning grants the Glacial Warhelm');

// =================== Test 21: Level-Arc Band D quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 21: Band D quests — the_taboo_wellspring / what_the_wellspring_woke / the_warden_primes_reckoning ===');

// 21a) main-spine quest: accept at Frosthold Waystation, force-satisfy its kill/collect/visit
// steps, turn in for the full multi-reward (mirrors Test 20a's pattern).
var c27 = makeCharacter({ name: 'BandDMainTest' });
grantVitalityForLevel(c27, 71);
Game.World.travelTo('frosthold_waystation');
satisfyChain('win_passage_from_the_ukai'); // G5 chain: the_taboo_wellspring requiresQuest win_passage_from_the_ukai (spine-behind-spine, never behind Band C's own side/boss quests)
var res27a = Game.Quests.accept('the_taboo_wellspring');
assert(res27a.ok === true, 'the_taboo_wellspring accepted at Frosthold Waystation: ' + res27a.message);
assert(Game.Quests.canTurnIn('the_taboo_wellspring') === false, 'the_taboo_wellspring not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('the_taboo_wellspring');
assert(Game.Quests.canTurnIn('the_taboo_wellspring') === true, 'the_taboo_wellspring steps force-satisfied (5x kill + 3x collect + visit anima_wellspring)');
var gold27a = Game.Character.goldTotalAsGold(c27);
var xp27a = c27.xp;
var tp27a = c27.trainingPoints;
var res27b = Game.Quests.turnIn('the_taboo_wellspring');
assert(res27b.ok === true, 'the_taboo_wellspring turn-in succeeds: ' + res27b.message);
assert(Game.Character.goldTotalAsGold(c27) === gold27a + 1500, 'the_taboo_wellspring grants +1500 gold');
assert(c27.xp === xp27a + 2300, 'the_taboo_wellspring grants +2300 xp');
assert(c27.trainingPoints === tp27a + 3, 'the_taboo_wellspring grants +3 Training Points');
assert(Game.Quests.inventoryCount(c27, 'sword_estari_wardblade') >= 1, 'the_taboo_wellspring grants an Estari Wardblade');
assert(c27.quests['the_taboo_wellspring'].status === 'completed', 'the_taboo_wellspring marked completed');

// 21b) side quest: REAL kill progress (not force-satisfied) via winBattle against The Anima
// Wellspring regulars, same pattern as Test 20b's hunt-quest loop.
var c28 = makeCharacter({ name: 'BandDSideTest' });
grantVitalityForLevel(c28, 76);
Game.World.travelTo('frosthold_waystation');
satisfyChain('the_taboo_wellspring'); // G5 chain: what_the_wellspring_woke requiresQuest the_taboo_wellspring
var res28a = Game.Quests.accept('what_the_wellspring_woke');
assert(res28a.ok === true, 'what_the_wellspring_woke accepted: ' + res28a.message);
Game.World.travelTo('anima_wellspring');
for (var w21 = 0; w21 < 4; w21++) winBattle('raw_anima_horror');
assert(c28.quests['what_the_wellspring_woke'].progress.kills['raw_anima_horror'] === 4, 'real kill progress reached 4/4 via winBattle against raw_anima_horror');
assert(Game.Quests.canTurnIn('what_the_wellspring_woke') === true, 'what_the_wellspring_woke turn-in-able after 4 real kills');
Game.World.travelTo('frosthold_waystation');
var res28b = Game.Quests.turnIn('what_the_wellspring_woke');
assert(res28b.ok === true, 'what_the_wellspring_woke turn-in succeeds: ' + res28b.message);
assert(Game.Quests.inventoryCount(c28, 'sphere_fclass_2') >= 1, 'what_the_wellspring_woke grants an F-Class Sphere II');

// 21c) boss-kill side quest: REAL kill via winBattle against the Band D lair boss itself.
var c29 = makeCharacter({ name: 'BandDBossTest' });
grantVitalityForLevel(c29, 80);
Game.World.travelTo('frosthold_waystation');
satisfyChain('the_taboo_wellspring'); // G5 chain: the_warden_primes_reckoning requiresQuest the_taboo_wellspring
var res29a = Game.Quests.accept('the_warden_primes_reckoning');
assert(res29a.ok === true, 'the_warden_primes_reckoning accepted: ' + res29a.message);
Game.World.travelTo('anima_wellspring');
winBattle('estari_warden_prime');
assert(c29.quests['the_warden_primes_reckoning'].progress.kills['estari_warden_prime'] === 1, 'estari_warden_prime kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('frosthold_waystation');
var res29b = Game.Quests.turnIn('the_warden_primes_reckoning');
assert(res29b.ok === true, 'the_warden_primes_reckoning turn-in succeeds: ' + res29b.message);
assert(c29.quests['the_warden_primes_reckoning'].status === 'completed', 'the_warden_primes_reckoning marked completed');
assert(Game.Quests.inventoryCount(c29, 'heavy_head_warden_helm') >= 1, 'the_warden_primes_reckoning grants the Warden Helm');

// =================== Test 22: Level-Arc Band E quests (accept -> progress -> turn-in) ===================
console.log('\n=== Test 22: Band E quests — the_skyspire_ascent / what_the_society_grew / the_societys_last_stand ===');

// 22a) main-spine quest: accept at Frosthold Waystation, force-satisfy its kill/collect/visit
// steps, turn in for the full multi-reward (mirrors Test 21a's pattern).
var c30 = makeCharacter({ name: 'BandEMainTest' });
grantVitalityForLevel(c30, 81);
Game.World.travelTo('frosthold_waystation');
satisfyChain('the_taboo_wellspring'); // G5 chain: the_skyspire_ascent requiresQuest the_taboo_wellspring (spine-behind-spine, never behind Band D's own side/boss quests)
var res30a = Game.Quests.accept('the_skyspire_ascent');
assert(res30a.ok === true, 'the_skyspire_ascent accepted at Frosthold Waystation: ' + res30a.message);
assert(Game.Quests.canTurnIn('the_skyspire_ascent') === false, 'the_skyspire_ascent not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('the_skyspire_ascent');
assert(Game.Quests.canTurnIn('the_skyspire_ascent') === true, 'the_skyspire_ascent steps force-satisfied (5x kill + 3x collect + visit skyspire_upper_spans)');
var gold30a = Game.Character.goldTotalAsGold(c30);
var xp30a = c30.xp;
var tp30a = c30.trainingPoints;
var res30b = Game.Quests.turnIn('the_skyspire_ascent');
assert(res30b.ok === true, 'the_skyspire_ascent turn-in succeeds: ' + res30b.message);
assert(Game.Character.goldTotalAsGold(c30) === gold30a + 1700, 'the_skyspire_ascent grants +1700 gold');
assert(c30.xp === xp30a + 2600, 'the_skyspire_ascent grants +2600 xp');
assert(c30.trainingPoints === tp30a + 3, 'the_skyspire_ascent grants +3 Training Points');
assert(Game.Quests.inventoryCount(c30, 'sword_spireward_blade') >= 1, 'the_skyspire_ascent grants a Spireward Blade');
assert(c30.quests['the_skyspire_ascent'].status === 'completed', 'the_skyspire_ascent marked completed');

// 22b) side quest: REAL kill progress (not force-satisfied) via winBattle against Skyspire Upper
// Spans regulars, same pattern as Test 21b's hunt-quest loop.
var c31 = makeCharacter({ name: 'BandESideTest' });
grantVitalityForLevel(c31, 86);
// v1.7 Phase Q (docs/SPEC-V1.7-CONTENT-UX.md §2): what_the_society_grew re-homed Frosthold
// Waystation -> Skyspire Landing (minLevel 85) — the_skyspire_ascent itself (its requiresQuest
// prereq) stays at Frosthold, satisfied via the debug backdoor below regardless of location.
Game.World.travelTo('skyspire_landing');
satisfyChain('the_skyspire_ascent'); // G5 chain: what_the_society_grew requiresQuest the_skyspire_ascent
var res31a = Game.Quests.accept('what_the_society_grew');
assert(res31a.ok === true, 'what_the_society_grew accepted: ' + res31a.message);
Game.World.travelTo('skyspire_upper_spans');
for (var w22 = 0; w22 < 4; w22++) winBattle('anima_horror_ravager');
assert(c31.quests['what_the_society_grew'].progress.kills['anima_horror_ravager'] === 4, 'real kill progress reached 4/4 via winBattle against anima_horror_ravager');
assert(Game.Quests.canTurnIn('what_the_society_grew') === true, 'what_the_society_grew turn-in-able after 4 real kills');
Game.World.travelTo('skyspire_landing');
var res31b = Game.Quests.turnIn('what_the_society_grew');
assert(res31b.ok === true, 'what_the_society_grew turn-in succeeds: ' + res31b.message);
assert(Game.Quests.inventoryCount(c31, 'sphere_gclass_2') >= 1, 'what_the_society_grew grants a G-Class Sphere II');

// 22c) boss-kill side quest: REAL kill via winBattle against the Band E lair boss itself.
var c32 = makeCharacter({ name: 'BandEBossTest' });
grantVitalityForLevel(c32, 90);
// v1.7 Phase Q: the_societys_last_stand re-homed Frosthold Waystation -> Skyspire Landing.
Game.World.travelTo('skyspire_landing');
satisfyChain('the_skyspire_ascent'); // G5 chain: the_societys_last_stand requiresQuest the_skyspire_ascent
var res32a = Game.Quests.accept('the_societys_last_stand');
assert(res32a.ok === true, 'the_societys_last_stand accepted: ' + res32a.message);
Game.World.travelTo('skyspire_upper_spans');
winBattle('society_anima_horror');
assert(c32.quests['the_societys_last_stand'].progress.kills['society_anima_horror'] === 1, 'society_anima_horror kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button)');
Game.World.travelTo('skyspire_landing');
var res32b = Game.Quests.turnIn('the_societys_last_stand');
assert(res32b.ok === true, 'the_societys_last_stand turn-in succeeds: ' + res32b.message);
assert(c32.quests['the_societys_last_stand'].status === 'completed', 'the_societys_last_stand marked completed');
assert(Game.Quests.inventoryCount(c32, 'heavy_head_spireward_helm') >= 1, 'the_societys_last_stand grants the Spireward Helm');

// =================== Test 23: Level-Arc Band F quests (accept -> progress -> turn-in) — THE ARC FINALE ===================
console.log('\n=== Test 23: Band F quests — the_red_moon_crossing / what_rennick_deciphered / the_ascendants_fall ===');

// 23a) main-spine quest: accept at Frosthold Waystation, force-satisfy its kill/collect/visit
// steps, turn in for the full multi-reward (mirrors Test 22a's pattern).
var c33 = makeCharacter({ name: 'BandFMainTest' });
grantVitalityForLevel(c33, 91);
// v1.7 Phase Q: the_red_moon_crossing re-homed Frosthold Waystation -> Skyspire Landing.
Game.World.travelTo('skyspire_landing');
satisfyChain('the_skyspire_ascent'); // G5 chain: the_red_moon_crossing requiresQuest the_skyspire_ascent (spine-behind-spine, never behind Band E's own side/boss quests)
var res33a = Game.Quests.accept('the_red_moon_crossing');
assert(res33a.ok === true, 'the_red_moon_crossing accepted at Skyspire Landing: ' + res33a.message);
assert(Game.Quests.canTurnIn('the_red_moon_crossing') === false, 'the_red_moon_crossing not yet turn-in-able (steps unsatisfied)');
Game._debug.completeQuestStep('the_red_moon_crossing');
assert(Game.Quests.canTurnIn('the_red_moon_crossing') === true, 'the_red_moon_crossing steps force-satisfied (5x kill + 3x collect + visit eidas_sanctum)');
var gold33a = Game.Character.goldTotalAsGold(c33);
var xp33a = c33.xp;
var tp33a = c33.trainingPoints;
var res33b = Game.Quests.turnIn('the_red_moon_crossing');
assert(res33b.ok === true, 'the_red_moon_crossing turn-in succeeds: ' + res33b.message);
assert(Game.Character.goldTotalAsGold(c33) === gold33a + 1900, 'the_red_moon_crossing grants +1900 gold');
assert(c33.xp === xp33a + 2900, 'the_red_moon_crossing grants +2900 xp');
assert(c33.trainingPoints === tp33a + 3, 'the_red_moon_crossing grants +3 Training Points');
assert(Game.Quests.inventoryCount(c33, 'sword_redmoon_blade') >= 1, 'the_red_moon_crossing grants a Redmoon Blade');
assert(c33.quests['the_red_moon_crossing'].status === 'completed', 'the_red_moon_crossing marked completed');

// 23b) side quest: REAL kill progress (not force-satisfied) via winBattle against Eidas's
// Sanctum regulars, same pattern as Test 22b's hunt-quest loop.
var c34 = makeCharacter({ name: 'BandFSideTest' });
grantVitalityForLevel(c34, 96);
// v1.7 Phase Q: what_rennick_deciphered re-homed Frosthold Waystation -> Skyspire Landing.
Game.World.travelTo('skyspire_landing');
satisfyChain('the_red_moon_crossing'); // G5 chain: what_rennick_deciphered requiresQuest the_red_moon_crossing
var res34a = Game.Quests.accept('what_rennick_deciphered');
assert(res34a.ok === true, 'what_rennick_deciphered accepted: ' + res34a.message);
Game.World.travelTo('eidas_sanctum');
for (var w23 = 0; w23 < 4; w23++) winBattle('moon_anima_devourer');
assert(c34.quests['what_rennick_deciphered'].progress.kills['moon_anima_devourer'] === 4, 'real kill progress reached 4/4 via winBattle against moon_anima_devourer');
assert(Game.Quests.canTurnIn('what_rennick_deciphered') === true, 'what_rennick_deciphered turn-in-able after 4 real kills');
Game.World.travelTo('skyspire_landing');
var res34b = Game.Quests.turnIn('what_rennick_deciphered');
assert(res34b.ok === true, 'what_rennick_deciphered turn-in succeeds: ' + res34b.message);
assert(Game.Quests.inventoryCount(c34, 'sphere_hclass_2') >= 1, 'what_rennick_deciphered grants an H-Class Sphere II');

// 23c) THE FINALE quest: REAL kill via winBattle against eidas_ascendant, the arc's FINAL lair
// boss — the quest that culminates the entire 41->100 level arc.
var c35 = makeCharacter({ name: 'BandFFinaleTest' });
grantVitalityForLevel(c35, 100);
// v1.7 Phase Q: the_ascendants_fall (THE FINALE) re-homed Frosthold Waystation -> Skyspire Landing.
Game.World.travelTo('skyspire_landing');
satisfyChain('the_red_moon_crossing'); // G5 chain: the_ascendants_fall (THE FINALE) requiresQuest the_red_moon_crossing — spine-behind-spine only, never behind what_rennick_deciphered (side content)
var res35a = Game.Quests.accept('the_ascendants_fall');
assert(res35a.ok === true, 'the_ascendants_fall accepted: ' + res35a.message);
Game.World.travelTo('eidas_sanctum');
winBattle('eidas_ascendant');
assert(c35.quests['the_ascendants_fall'].progress.kills['eidas_ascendant'] === 1, 'eidas_ascendant kill recorded via winBattle (lair fight, same Game.Battle.start call as the Explore screen\'s lair button) -- THE FINALE quest gate');
Game.World.travelTo('skyspire_landing');
var gold35a = Game.Character.goldTotalAsGold(c35);
var xp35a = c35.xp;
var tp35a = c35.trainingPoints;
var res35b = Game.Quests.turnIn('the_ascendants_fall');
assert(res35b.ok === true, 'the_ascendants_fall turn-in succeeds: ' + res35b.message);
assert(c35.quests['the_ascendants_fall'].status === 'completed', 'the_ascendants_fall marked completed -- THE ARC FINALE is complete');
assert(Game.Character.goldTotalAsGold(c35) === gold35a + 4000, 'the_ascendants_fall grants +4000 gold');
// c35 is already at BALANCE.LEVEL_CAP (100) -- Game.Character.addXp is a deliberate no-op once at
// the cap (js/core/character.js, F1 balance-to-100 decision: "further combat XP has nowhere to
// go"). The quest's xp:5000 reward is still authored (matching every other boss-kill quest's
// reward shape) for a player who turns it in a level below 100, but a level-100 turn-in absorbs
// it as a no-op rather than growing c.xp unbounded past the cap.
assert(c35.xp === xp35a, 'the_ascendants_fall\'s xp reward is a no-op at BALANCE.LEVEL_CAP (addXp\'s cap guard, js/core/character.js) -- xp stays at the capped value');
assert(c35.trainingPoints === tp35a + 5, 'the_ascendants_fall grants +5 Training Points (uncapped, unlike combat/quest XP at LEVEL_CAP)');
assert(Game.Quests.inventoryCount(c35, 'heavy_head_redmoon_helm') >= 1, 'the_ascendants_fall grants the Redmoon Helm');

// =================== Test 24: G5 active-quest cap (docs/SPEC-V1.4-GAMEPLAY.md §2) ===================
console.log('\n=== Test 24: active-quest cap — 4th accept refused, cancel frees a slot, accept succeeds ===');
var c24cap = makeCharacter({ name: 'CapTest' });
c24cap.level = 10; // clears every Eldor head quest's own levelMin (max is ruin_warden_boss/synthesis_supplies at 8/9)
var cap24a = Game.Quests.accept('tutorial_first_blood');
var cap24b = Game.Quests.accept('eldor_dr_ferrier');
// v1.7 Phase Q: ruin_warden_boss re-homed Eldor -> Laik — travel there before accepting (tutorial_
// first_blood/eldor_dr_ferrier stay at Eldor, accepted above before this travel).
Game.World.travelTo('laik');
var cap24c = Game.Quests.accept('ruin_warden_boss');
assert(cap24a.ok && cap24b.ok && cap24c.ok, 'three quests accepted, filling BALANCE.MAX_ACTIVE_QUESTS (3)');
assert(Game.Quests.activeQuestCount(c24cap) === 3, 'activeQuestCount reports 3');
var cap24d = Game.Quests.accept('synthesis_supplies');
assert(cap24d.ok === false && cap24d.message === 'Your journal is full — finish or abandon a quest first.',
  '4th accept refused with the journal-full message: ' + cap24d.message);
assert(!c24cap.quests['synthesis_supplies'], 'no quest entry created for the capped refusal');
var cancel24 = Game.Quests.cancel('eldor_dr_ferrier');
assert(cancel24.ok === true, 'cancel frees a slot: ' + cancel24.message);
assert(Game.Quests.activeQuestCount(c24cap) === 2, 'activeQuestCount back down to 2 after cancel');
// synthesis_supplies re-homed Eldor -> Ju`Mak Village (v1.7 Phase Q) — travel there before accepting.
Game.World.travelTo('jumak_village');
var cap24e = Game.Quests.accept('synthesis_supplies');
assert(cap24e.ok === true, 'accept succeeds once back under the cap: ' + cap24e.message);

// =================== Test 25: G5 availableAt() cap reason + level-window priority ===================
console.log('\n=== Test 25: availableAt() — cap reason when otherwise eligible; level reason wins when both apply ===');
var c25cap = makeCharacter({ name: 'CapAvailTest' });
c25cap.level = 9; // clears tutorial_first_blood/eldor_dr_ferrier/first_calling AND ruin_warden_boss(8)/synthesis_supplies(9)
Game.Quests.accept('tutorial_first_blood');
Game.Quests.accept('eldor_dr_ferrier');
Game.Quests.accept('first_calling');
assert(Game.Quests.activeQuestCount(c25cap) === 3, 'three actives, at the cap');
// v1.7 Phase Q: ruin_warden_boss/synthesis_supplies/trials_of_eldor no longer live at Eldor —
// availableAt() doesn't consult the character's current location at all (only the queried
// areaId), so querying each quest's own new giver town directly is valid regardless of where
// c25cap actually stands.
var avail25laik = Game.Quests.availableAt('laik');
var ruinRec25 = avail25laik.filter(function (r) { return r.quest.id === 'ruin_warden_boss'; })[0];
assert(!!ruinRec25 && ruinRec25.eligible === false && ruinRec25.reason === 'Your journal is full (3/3 active).',
  'ruin_warden_boss (level satisfied, 8<=9) shows the cap reason built from BALANCE.MAX_ACTIVE_QUESTS: ' + (ruinRec25 && ruinRec25.reason));
var avail25jumak = Game.Quests.availableAt('jumak_village');
var synthRec25 = avail25jumak.filter(function (r) { return r.quest.id === 'synthesis_supplies'; })[0];
assert(!!synthRec25 && synthRec25.eligible === false && /journal is full/.test(synthRec25.reason),
  'synthesis_supplies (level satisfied, 9<=9) also shows the cap reason');
var avail25kastengard = Game.Quests.availableAt('kastengard_vanguard_camp');
var trialsRec25 = avail25kastengard.filter(function (r) { return r.quest.id === 'trials_of_eldor'; })[0];
assert(!!trialsRec25 && trialsRec25.eligible === false && /Requires Level 30/.test(trialsRec25.reason),
  'trials_of_eldor (level 30 unmet AND at cap) shows the LEVEL reason, not the cap reason — level-window priority wins: ' + (trialsRec25 && trialsRec25.reason));

// =================== Test 26: G5 requiresQuest chain — hide/reveal + accept() defense-in-depth ===================
console.log('\n=== Test 26: requiresQuest — hidden before prereq completes, listed after, accept() refuses directly ===');
var c26chain = makeCharacter({ name: 'ChainTest' });
var avail26a = Game.Quests.availableAt('eldor');
assert(!avail26a.some(function (r) { return r.quest.id === 'standing_stones'; }), 'standing_stones hidden entirely before tutorial_first_blood completes (not even greyed)');
var acceptChain26a = Game.Quests.accept('standing_stones');
assert(acceptChain26a.ok === false && acceptChain26a.message === 'You are not ready for this task yet.',
  'accept() refuses standing_stones directly (defense in depth): ' + acceptChain26a.message);
Game.Quests.accept('tutorial_first_blood');
Game._debug.completeQuestStep('tutorial_first_blood');
Game.Quests.turnIn('tutorial_first_blood');
var avail26b = Game.Quests.availableAt('eldor');
var standingRec26 = avail26b.filter(function (r) { return r.quest.id === 'standing_stones'; })[0];
assert(!!standingRec26 && standingRec26.eligible === true, 'standing_stones now listed and eligible once tutorial_first_blood is completed');
var acceptChain26b = Game.Quests.accept('standing_stones');
assert(acceptChain26b.ok === true, 'accept() now succeeds: ' + acceptChain26b.message);

// =================== Test 27: G5 turnIn() followUps — same-area present, different-area absent ===================
console.log('\n=== Test 27: turnIn().followUps — same-giver-area follow-ups present, cross-area follow-up absent ===');
var c27fu = makeCharacter({ name: 'FollowUpTest' });
grantVitalityForLevel(c27fu, 51);
Game.World.travelTo('kuraan_reclamation_camp');
satisfyChain('reclaim_the_fringe');
var acceptBmh27 = Game.Quests.accept('break_the_majiku_host');
assert(acceptBmh27.ok === true, 'break_the_majiku_host accepted: ' + acceptBmh27.message);
Game._debug.completeQuestStep('break_the_majiku_host');
var turnInBmh27 = Game.Quests.turnIn('break_the_majiku_host');
assert(turnInBmh27.ok === true, 'break_the_majiku_host turned in: ' + turnInBmh27.message);
assert(Array.isArray(turnInBmh27.followUps), 'turnIn() result carries a followUps array');
assert(turnInBmh27.followUps.indexOf('storms_over_the_ridge') !== -1, 'same-area follow-up storms_over_the_ridge present (Yulei, kuraan_reclamation_camp)');
assert(turnInBmh27.followUps.indexOf('the_chieftains_reckoning') !== -1, 'same-area follow-up the_chieftains_reckoning present (Serath, kuraan_reclamation_camp)');
assert(turnInBmh27.followUps.indexOf('win_passage_from_the_ukai') === -1, 'cross-area follow-up win_passage_from_the_ukai (frosthold_waystation) absent — it will surface via availableAt() once the hero travels there');
// A quest with no follow-ups at all reports an empty array, not undefined.
var c27empty = makeCharacter({ name: 'NoFollowUpTest' });
Game.Quests.accept('eldor_dr_ferrier');
for (var g27 = 0; g27 < 4; g27++) Game.Inventory.addItem(c27empty, 'quest_majiku_venom_gland');
var turnInEmpty27 = Game.Quests.turnIn('eldor_dr_ferrier');
assert(turnInEmpty27.ok === true && Array.isArray(turnInEmpty27.followUps) && turnInEmpty27.followUps.length === 0, 'a quest with no chained dependents reports followUps: []');

// =================== Test 28: G5 quest-chain graph — reachability, cycles, gate-compatibility ===================
console.log('\n=== Test 28: requiresQuest graph — no cycles, all targets resolve, every quest reachable from a head, gates compatible ===');
(function () {
  var quests = Game.Data.quests;
  var byId = {};
  quests.forEach(function (q) { byId[q.id] = q; });

  // 1. Every requiresQuest target must name a real quest id (catches typos).
  var dangling = [];
  quests.forEach(function (q) {
    if (q.requiresQuest && !byId[q.requiresQuest]) dangling.push(q.id + ' -> ' + q.requiresQuest);
  });
  assert(dangling.length === 0, 'no dangling requiresQuest targets' + (dangling.length ? ': ' + dangling.join(', ') : ''));

  // 2. No cycles: walk each quest's ancestry chain; revisiting a node means a cycle.
  var cyclic = [];
  quests.forEach(function (q) {
    var seen = {};
    var cur = q;
    var guard = 0;
    while (cur && cur.requiresQuest && guard < 200) {
      if (seen[cur.id]) { cyclic.push(q.id); break; }
      seen[cur.id] = true;
      cur = byId[cur.requiresQuest];
      guard++;
    }
  });
  assert(cyclic.length === 0, 'no requiresQuest cycles' + (cyclic.length ? ': ' + cyclic.join(', ') : ''));

  // 3. Every quest reaches a chain HEAD (a quest with no requiresQuest at all) by walking backward
  // — this is what "no quest becomes unreachable" (phase brief) actually guarantees mechanically:
  // a fresh playthrough can always start from a head and work forward to any quest in the graph.
  var unreachable = [];
  quests.forEach(function (q) {
    var cur = q;
    var guard = 0;
    while (cur && cur.requiresQuest && guard < 200) {
      cur = byId[cur.requiresQuest];
      guard++;
    }
    if (!cur) unreachable.push(q.id); // only possible via a dangling target, already caught above
  });
  assert(unreachable.length === 0, 'every quest reaches a chain head' + (unreachable.length ? ': ' + unreachable.join(', ') : ''));

  // 4. Gate compatibility (§7 guardrail, generalized from requiresRace to all three gate fields):
  // a quest's requiresQuest prerequisite must never carry a STRICTER
  // requiresRace/requiresBaseClass/requiresAdvancedClass gate than the quest itself — an
  // Arkan-only (or base/advanced-class-only) prerequisite must never be the sole gateway to
  // content without that same gate. Equal gates (both sides the same value) are fine.
  var gateFields = ['requiresRace', 'requiresBaseClass', 'requiresAdvancedClass'];
  var gateViolations = [];
  quests.forEach(function (q) {
    if (!q.requiresQuest) return;
    var prereq = byId[q.requiresQuest];
    if (!prereq) return;
    gateFields.forEach(function (field) {
      if (prereq[field] && prereq[field] !== q[field]) {
        gateViolations.push(q.id + ' (' + field + '=' + q[field] + ') chained behind ' + prereq.id + ' (' + field + '=' + prereq[field] + ')');
      }
    });
  });
  assert(gateViolations.length === 0, 'no gate-compatibility violations in the chain graph' + (gateViolations.length ? ': ' + gateViolations.join('; ') : ''));

  // 5. Level-window sanity: a chain member's levelMin should be >= its prerequisite's levelMin —
  // never force out-of-window backtracking (phase brief).
  var levelViolations = [];
  quests.forEach(function (q) {
    if (!q.requiresQuest) return;
    var prereq = byId[q.requiresQuest];
    if (!prereq) return;
    var ownMin = typeof q.levelMin === 'number' ? q.levelMin : 0;
    var prereqMin = typeof prereq.levelMin === 'number' ? prereq.levelMin : 0;
    if (ownMin < prereqMin) levelViolations.push(q.id + ' (levelMin ' + ownMin + ') behind ' + prereq.id + ' (levelMin ' + prereqMin + ')');
  });
  assert(levelViolations.length === 0, 'no chain member has a lower levelMin than its prerequisite' + (levelViolations.length ? ': ' + levelViolations.join('; ') : ''));

  // 6. The single highest-stakes link in the whole graph (§7 guardrail): THE FINALE must chain
  // behind the Band F main-spine quest, never behind the side quest (What Rennick Deciphered).
  assert(byId['the_ascendants_fall'].requiresQuest === 'the_red_moon_crossing',
    'THE FINALE (the_ascendants_fall) chains behind the Band F spine quest the_red_moon_crossing, never behind side content');
})();

// =================== Test 29: v1.6 P3 EI-3a — Game.Quests.materialStillUseful drop gating ===================
// SPEC-V1.6-REBALANCE.md §3, REVIEW-2026-07-16.md EI-3. This is the READ-ONLY helper js/core/
// battle.js's drop loop consults to stop rolling a quest_ material once nothing can still need
// it. CRITICAL SAFETY (documented past-bug class: "Heir of the Echo was unobtainable"): a
// material must NEVER stop dropping while anything could still need it -- proven below via (i)
// still-useful before/during a quest, (ii) stops once its only quest completes, and (iii) stays
// useful as long as ANY referencing quest (of two) remains incomplete, plus the recipe safety net.
console.log('\n=== Test 29: materialStillUseful — drops while active/unaccepted, stops once completed, never while ANY referencing quest remains incomplete ===');

// Test subject: quest_majiku_venom_gland, required ONLY by eldor_dr_ferrier (levelMin 1, giver
// Eldor -- a Human's own starting town, no travel/level-up needed). Deliberately NOT one of the
// materials also consumed by a synthesis recipe (js/data/recipes.js) -- this test isolates the
// pure quest-completion gating; the separate recipe safety net is proven further below with
// quest_custodian_core_shard, which IS also a recipe input.
var c29q = makeCharacter({ name: 'MaterialGateTest' });

// (i) Not yet accepted (no c.quests entry at all) -- "when in doubt, keep dropping": the quest
// hasn't even been offered/accepted yet, so its material must still be considered useful.
assert(Game.Quests.materialStillUseful(c29q, 'quest_majiku_venom_gland') === true,
  '(i) quest_majiku_venom_gland is still useful before eldor_dr_ferrier is even accepted');

// (i) Active: accept the real quest through the real accept() flow.
var accept29 = Game.Quests.accept('eldor_dr_ferrier');
assert(accept29.ok, 'sanity: eldor_dr_ferrier accepted: ' + accept29.message);
assert(Game.Quests.materialStillUseful(c29q, 'quest_majiku_venom_gland') === true,
  '(i) quest_majiku_venom_gland is still useful while eldor_dr_ferrier is ACTIVE');

// (ii) Completed (its ONLY referencing quest) -> the material finally stops being useful.
c29q.quests['eldor_dr_ferrier'].status = 'completed';
assert(Game.Quests.materialStillUseful(c29q, 'quest_majiku_venom_gland') === false,
  '(ii) quest_majiku_venom_gland STOPS being useful once eldor_dr_ferrier (its only referencing quest) is completed');

// (iii) CRITICAL SAFETY: inject a temporary SECOND quest requiring the SAME material (reversible
// -- popped in the finally block below) and confirm the material keeps dropping for as long as
// EITHER quest remains incomplete, only stopping once BOTH are completed.
var fakeQuest29 = {
  id: 'test_fake_quest_sharing_gland',
  name: 'Test Fixture Quest (never real content)',
  giver: { areaId: 'eldor', npc: 'Test' },
  steps: [{ kind: 'collect', itemId: 'quest_majiku_venom_gland', count: 1 }],
  rewards: {}
};
Game.Data.quests.push(fakeQuest29);
try {
  assert(Game.Quests.materialStillUseful(c29q, 'quest_majiku_venom_gland') === true,
    '(iii) quest_majiku_venom_gland KEEPS dropping -- a second quest needing it is not yet accepted, even though eldor_dr_ferrier is already completed');
  c29q.quests['test_fake_quest_sharing_gland'] = { status: 'active', progress: { kills: {}, touched: {}, visited: {} } };
  assert(Game.Quests.materialStillUseful(c29q, 'quest_majiku_venom_gland') === true,
    '(iii) quest_majiku_venom_gland KEEPS dropping while the second quest is ACTIVE (shared material, one quest still incomplete)');
  c29q.quests['test_fake_quest_sharing_gland'].status = 'completed';
  assert(Game.Quests.materialStillUseful(c29q, 'quest_majiku_venom_gland') === false,
    'quest_majiku_venom_gland stops being useful only once EVERY referencing quest is completed');
} finally {
  Game.Data.quests.pop(); // never leave the fixture quest polluting Game.Data.quests for later runs
}
assert(Game.Data.quests.length === 46, 'sanity: fixture quest fully removed, back to 46 real quests');

// Vacuously useful: an item referenced by NEITHER a quest NOR a recipe is never gated off (e.g.
// quest_matriarch_horn, a pure boss-trophy per EI-4 -- "when in doubt, keep dropping").
assert(Game.Quests.materialStillUseful(c29q, 'quest_matriarch_horn') === true,
  'an unreferenced quest_ item (no quest, no recipe) is vacuously still-useful (never gated off)');

// Recipe safety net (broader than the brief's literal wording, required by its OWN CRITICAL
// clause): quest_custodian_core_shard feeds BOTH a one-shot quest (vaultbreakers_reckoning) AND
// several repeatable synthesis recipes (js/data/recipes.js synth_kastengard_relic_blade/
// synth_vault_reaver/synth_kastengard_wardweave) -- completing the quest must NOT strand the
// still-repeatable synthesis route.
var c29r = makeCharacter({ name: 'MaterialGateRecipeTest' });
c29r.quests['vaultbreakers_reckoning'] = { status: 'completed', progress: { kills: {}, touched: {}, visited: {} } };
assert(Game.Quests.materialStillUseful(c29r, 'quest_custodian_core_shard') === true,
  'quest_custodian_core_shard stays useful after its only QUEST completes, because synthesis recipes still need it (recipes never complete)');

// =================== Test 30: v1.7 Phase Q — quest arc redistribution ===================
// docs/SPEC-V1.7-CONTENT-UX.md §2: quests were front-loaded in Eldor (12 givers) with Skyspire
// Landing at zero; givers were reassigned so each town tavern owns its own level band. Only
// giver.areaId/npc (+ retheme text for the 3 re-homed class quests) changed — ids, objectives,
// chains, and rewards did not.
console.log('\n=== Test 30: Phase Q redistribution — new givers reachable exactly at levelMin, rejected below the giver town\'s gate, class quests still grant their class choice, no orphan/stranded quest ===');

// 30a) Every moved quest's new giver town matches the redistribution map, and the town's own
// minLevel never exceeds the quest's own levelMin (the hard reachability constraint).
(function () {
  var moved = [
    { id: 'ruin_warden_boss', town: 'laik' },
    { id: 'synthesis_supplies', town: 'jumak_village' },
    { id: 'gares_riverbanks_1', town: 'laik' },
    { id: 'gares_riverbanks_2', town: 'laik' },
    { id: 'kastengard_investigation', town: 'kastengard_vanguard_camp' },
    { id: 'trials_of_eldor', town: 'kastengard_vanguard_camp' },
    { id: 'vaultbreakers_reckoning', town: 'kastengard_vanguard_camp' },
    { id: 'echo_of_eidas', town: 'kastengard_vanguard_camp' },
    { id: 'masters_calling', town: 'kuraan_reclamation_camp' },
    { id: 'what_the_society_grew', town: 'skyspire_landing' },
    { id: 'the_societys_last_stand', town: 'skyspire_landing' },
    { id: 'the_red_moon_crossing', town: 'skyspire_landing' },
    { id: 'what_rennick_deciphered', town: 'skyspire_landing' },
    { id: 'the_ascendants_fall', town: 'skyspire_landing' }
  ];
  moved.forEach(function (spec) {
    var q = Game.Quests.getQuest(spec.id);
    assert(!!q, 'moved quest exists: ' + spec.id);
    assert(q.giver.areaId === spec.town, spec.id + ' giver areaId is ' + spec.town + ', got ' + (q && q.giver.areaId));
    var area = Game.World.getArea(spec.town);
    assert(!!area, spec.id + '\'s giver town ' + spec.town + ' exists');
    assert(area.minLevel <= q.levelMin, spec.id + ' (levelMin ' + q.levelMin + ') is reachable at its giver town ' + spec.town + ' (minLevel ' + area.minLevel + ')');
  });
})();

// 30b) ruin_warden_boss: travel (and so acceptance) rejected one level below Laik's own gate,
// acceptable exactly at levelMin 8 once Laik itself is reached.
var c30q1below = makeCharacter({ name: 'RehomeBelowGate' });
c30q1below.level = 7;
var travelBelow30 = Game.World.travelTo('laik');
assert(travelBelow30.ok === false, 'Laik (minLevel 8) rejects travel at Level 7, so ruin_warden_boss is unreachable one level below its new giver town\'s gate');
var c30q1at = makeCharacter({ name: 'RehomeAtGate' });
c30q1at.level = 8;
Game.World.travelTo('laik');
var acceptAt30 = Game.Quests.accept('ruin_warden_boss');
assert(acceptAt30.ok === true, 'ruin_warden_boss acceptable at Laik exactly at levelMin 8: ' + acceptAt30.message);

// 30c) synthesis_supplies: Ju`Mak Village's own gate (6) is looser than this quest's levelMin (9),
// so the BINDING constraint is the quest's own level window, not the town's — still refused below
// levelMin 9 even once the town itself is reachable, accepted exactly at 9.
var c30q2 = makeCharacter({ name: 'RehomeSynthesis' });
c30q2.level = 8;
Game.World.travelTo('jumak_village'); // town already reachable at Lv 8 (its own gate is 6)
var synthTooLow30 = Game.Quests.accept('synthesis_supplies');
assert(synthTooLow30.ok === false && /Requires Level 9/.test(synthTooLow30.message), 'synthesis_supplies still refused below ITS OWN levelMin 9 even though Ju`Mak\'s town gate (6) is already met: ' + synthTooLow30.message);
c30q2.level = 9;
var synthAt30 = Game.Quests.accept('synthesis_supplies');
assert(synthAt30.ok === true, 'synthesis_supplies acceptable at Ju`Mak Village exactly at levelMin 9: ' + synthAt30.message);

// 30d) The three re-homed CLASS quests still grant their class choice from their new giver towns.
var c30cls1 = makeCharacter({ name: 'RehomeTrialsClass' });
c30cls1.level = 30;
Game.Classes.obtainClass(c30cls1, 'warrior');
Game.World.travelTo('kastengard_vanguard_camp');
var acceptTrials30 = Game.Quests.accept('trials_of_eldor');
assert(acceptTrials30.ok === true, 'trials_of_eldor (re-homed to Kastengard Vanguard Camp) still acceptable: ' + acceptTrials30.message);
Game._debug.completeQuestStep('trials_of_eldor');
var turnInTrials30 = Game.Quests.turnIn('trials_of_eldor', 'gladiator');
assert(turnInTrials30.ok === true, 'trials_of_eldor turn-in from its new giver town still grants the classChoice: ' + turnInTrials30.message);
assert(Game.Classes.isObtained(c30cls1, 'gladiator') === true, 'gladiator obtained via the re-homed trials_of_eldor');

var c30cls2 = makeCharacter({ name: 'RehomeVaultbreakerClass' });
c30cls2.level = 33;
Game.World.travelTo('kastengard_vanguard_camp');
var acceptVb30 = Game.Quests.accept('vaultbreakers_reckoning');
assert(acceptVb30.ok === true, 'vaultbreakers_reckoning (re-homed to Kastengard Vanguard Camp) still acceptable: ' + acceptVb30.message);
Game._debug.completeQuestStep('vaultbreakers_reckoning');
var turnInVb30 = Game.Quests.turnIn('vaultbreakers_reckoning', 'vaultbreaker');
assert(turnInVb30.ok === true, 'vaultbreakers_reckoning turn-in from its new giver town still grants the classChoice: ' + turnInVb30.message);
assert(Game.Classes.isObtained(c30cls2, 'vaultbreaker') === true, 'vaultbreaker obtained via the re-homed vaultbreakers_reckoning');

var c30cls3 = makeCharacter({ name: 'RehomeMastersClass' });
c30cls3.level = 60;
Game.Classes.obtainClass(c30cls3, 'warrior');
Game.Classes.obtainClass(c30cls3, 'gladiator');
Game.World.travelTo('kuraan_reclamation_camp');
var acceptMc30 = Game.Quests.accept('masters_calling');
assert(acceptMc30.ok === true, 'masters_calling (re-homed to Kuraan Reclamation Camp) still acceptable: ' + acceptMc30.message);
Game._debug.completeQuestStep('masters_calling');
var turnInMc30 = Game.Quests.turnIn('masters_calling', 'shadowknight');
assert(turnInMc30.ok === true, 'masters_calling turn-in from its new giver town still grants the classChoice: ' + turnInMc30.message);
assert(Game.Classes.isObtained(c30cls3, 'shadowknight') === true, 'shadowknight obtained via the re-homed masters_calling');

// 30e) Connectivity, generalized to the WHOLE table (not just the moved rows): no orphan givers
// anywhere — every quest's giver.areaId resolves to a real Game.Data.areas entry, so nothing can
// ever be offered from a town that doesn't exist. (A stricter "town minLevel <= quest levelMin"
// check does NOT generalize to the whole table: several PRE-EXISTING, un-moved quests are
// reachable only because of the home-town travel exemption — arkan_first_rite/
// arkan_battlemage_trial/arkan_red_moon_whispers, requiresRace: 'Arkan', given at Saratus, an
// Arkan's own home town regardless of its minLevel 14 gate — or because the town's own gate is
// simply the practical floor above the quest's nominal levelMin (the_oruk, reclaim_the_fringe,
// win_passage_from_the_ukai). That per-quest reachability claim is instead scoped to exactly the
// 14 rows THIS phase moved, in 30a above, where it must hold by the phase brief's hard constraint.)
(function () {
  var orphan = [];
  Game.Data.quests.forEach(function (q) {
    var area = Game.World.getArea(q.giver.areaId);
    if (!area) orphan.push(q.id + ' -> ' + q.giver.areaId);
  });
  assert(orphan.length === 0, 'no quest has an orphan giver (unknown areaId)' + (orphan.length ? ': ' + orphan.join(', ') : ''));
})();

// 30f) The Frosthold <-> Skyspire Landing split leaves BOTH towns' questlines completable:
// Frosthold keeps a nonzero questline (Bands C/D + the_skyspire_ascent, its own levelMin 81, which
// stays behind since Skyspire Landing's gate of 85 is above it); Skyspire Landing carries exactly
// the 5 re-homed Band E/F quests; and the cross-town chain edge (the_red_moon_crossing at Skyspire
// Landing requiresQuest the_skyspire_ascent at Frosthold) still resolves.
(function () {
  var frostholdQuests = Game.Data.quests.filter(function (q) { return q.giver.areaId === 'frosthold_waystation'; });
  var skyspireQuests = Game.Data.quests.filter(function (q) { return q.giver.areaId === 'skyspire_landing'; });
  assert(frostholdQuests.length > 0, 'Frosthold Waystation still gives quests after the split (Bands C/D + the_skyspire_ascent), got ' + frostholdQuests.length);
  assert(skyspireQuests.length === 5, 'Skyspire Landing gives exactly the 5 re-homed Band E/F quests, got ' + skyspireQuests.length);
  var ascent = Game.Quests.getQuest('the_skyspire_ascent');
  var crossing = Game.Quests.getQuest('the_red_moon_crossing');
  assert(ascent.giver.areaId === 'frosthold_waystation', 'the_skyspire_ascent (the cross-town chain link\'s prerequisite) stays at Frosthold — its own levelMin 81 is below Skyspire Landing\'s gate of 85');
  assert(crossing.requiresQuest === 'the_skyspire_ascent', 'the_red_moon_crossing (Skyspire Landing) still chains behind the_skyspire_ascent (Frosthold) across the town split');
  assert(Game.World.getArea('frosthold_waystation').minLevel <= ascent.levelMin, 'the_skyspire_ascent reachable at Frosthold before the split-off quests can even chain from it');
  assert(Game.World.getArea('skyspire_landing').minLevel <= crossing.levelMin, 'the_red_moon_crossing reachable at Skyspire Landing once chained');
})();

// =================== Test 31: v1.7 Phase R — Arkan base-class parity (arkan_calling) + legacy safety ===================
console.log('\n=== Test 31: Phase R — arkan_calling (B2), requiresRace gating on both sides, bridge quests, legacy-save safety ===');

// 31a) data sanity
var arkanCalling31 = Game.Data.quests.filter(function (q) { return q.id === 'arkan_calling'; })[0];
assert(!!arkanCalling31, 'arkan_calling quest exists');
assert(arkanCalling31.levelMin === 5, 'arkan_calling gates at level 5 (same tier as first_calling), got ' + (arkanCalling31 && arkanCalling31.levelMin));
assert(arkanCalling31.requiresRace === 'Arkan', 'arkan_calling requires race Arkan');
assert(arkanCalling31.requiresQuest === 'arkan_first_rite', 'arkan_calling chains behind arkan_first_rite');
assert(JSON.stringify(arkanCalling31.rewards.classChoice) === JSON.stringify(['warrior', 'magician', 'thief']),
  'arkan_calling offers exactly the same base trio as first_calling, got ' + JSON.stringify(arkanCalling31.rewards.classChoice));
var wardframeDef31 = Game.Battle.getMonsterDef('saratus_wardframe');
assert(!!wardframeDef31, 'saratus_wardframe monster exists');
assert(arkanCalling31.steps[0].kind === 'kill' && arkanCalling31.steps[0].monsterId === 'saratus_wardframe',
  'arkan_calling\'s kill step targets saratus_wardframe');
var saratusPlains31 = Game.World.getArea('saratus_plains');
assert(saratusPlains31.monsters.indexOf('saratus_wardframe') !== -1, 'saratus_wardframe is present in saratus_plains (R-A), so arkan_calling\'s kill target is reachable at home');
assert(saratusPlains31.monsters.indexOf('plains_vermin_swarm') !== -1 && saratusPlains31.monsters.indexOf('plains_cutpurse_vole') !== -1,
  'A1 parity floor: saratus_plains also carries the two previously-missing regional monsters');

// 31b) requiresRace gates BOTH directions: a Human cannot take arkan_calling; an Arkan cannot take first_calling
// (isolate the race check by bypassing the giver-location check via Game._debug.goto, same
// approach as Test 16's requiresRace check above)
var c31human = makeCharacter({ name: 'PhaseRHuman' });
c31human.level = 5;
Game._debug.goto('saratus');
var resHumanArkanCalling31 = Game.Quests.accept('arkan_calling');
assert(resHumanArkanCalling31.ok === false && /Arkan/.test(resHumanArkanCalling31.message), 'Human refused arkan_calling on the race gate: ' + resHumanArkanCalling31.message);
Game._debug.goto('eldor');
var resHumanFirstCalling31 = Game.Quests.accept('first_calling');
assert(resHumanFirstCalling31.ok === true, 'sanity: Human still allowed first_calling: ' + resHumanFirstCalling31.message);

var c31arkanNoClass = makeCharacter({ name: 'PhaseRArkanNoClass', race: 'Arkan' });
c31arkanNoClass.level = 5;
Game._debug.goto('eldor');
var resArkanFirstCalling31 = Game.Quests.accept('first_calling');
assert(resArkanFirstCalling31.ok === false && /Human/.test(resArkanFirstCalling31.message), 'Arkan refused first_calling (now Human-gated): ' + resArkanFirstCalling31.message);
assert(!c31arkanNoClass.quests['first_calling'], 'no quest entry created for the refused Arkan');

// 31c) full flow: a fresh Arkan completes arkan_first_rite, then arkan_calling, at home in Saratus
var c31 = makeCharacter({ name: 'ArkanCallingFlow', race: 'Arkan' });
c31.level = 5;
assert(c31.currentLocation === 'saratus', 'sanity: fresh Arkan starts in Saratus');
var acceptRite31 = Game.Quests.accept('arkan_first_rite');
assert(acceptRite31.ok === true, 'arkan_first_rite accepted: ' + acceptRite31.message);
for (var kr31 = 0; kr31 < 3; kr31++) winBattle('plains_field_rat');
var turnInRite31 = Game.Quests.turnIn('arkan_first_rite');
assert(turnInRite31.ok === true, 'arkan_first_rite turned in: ' + turnInRite31.message);

var acceptCalling31 = Game.Quests.accept('arkan_calling');
assert(acceptCalling31.ok === true, 'arkan_calling accepted (prereq satisfied, still Level 5+, still in Saratus): ' + acceptCalling31.message);
assert(Game.Quests.canTurnIn('arkan_calling') === false, 'canTurnIn false with 0/3 wardframes broken');
for (var kw31 = 0; kw31 < 3; kw31++) winBattle('saratus_wardframe');
assert(c31.quests['arkan_calling'].progress.kills['saratus_wardframe'] === 3, 'kill progress reached 3/3 wardframes');
assert(Game.Quests.canTurnIn('arkan_calling') === true, 'canTurnIn true at count');
var turnInCalling31 = Game.Quests.turnIn('arkan_calling', 'magician');
assert(turnInCalling31.ok === true, 'arkan_calling turned in: ' + turnInCalling31.message);
assert(Game.Classes.isObtained(c31, 'magician') === true, 'magician obtained via arkan_calling — an Arkan now has a class-obtain path entirely within Saratus');

// 31d) legacy-save safety: requiresRace is an ACCEPT-time-only gate (js/core/quests.js accept()).
// turnIn() never re-checks it, so quest entries already on a character (from before this patch)
// keep working regardless of race. Simulated here by writing c.quests entries directly, exactly
// like the suite's own satisfyChain()/fixture patterns above (Test 29) do for the same reason.
console.log('--- 31d: legacy-save safety (requiresRace is accept()-time only) ---');

// (i) an Arkan who already COMPLETED first_calling pre-patch: untouched, re-accept still refused
// (but for the ordinary "already accepted/completed" reason, not a race refusal) and the class
// obtained via it stays intact.
var c31legacyDone = makeCharacter({ name: 'LegacyArkanDoneCalling', race: 'Arkan' });
c31legacyDone.quests['first_calling'] = { status: 'completed', progress: { kills: {}, touched: {}, visited: {} } };
Game.Classes.obtainClass(c31legacyDone, 'thief');
assert(Game.Classes.isObtained(c31legacyDone, 'thief') === true, 'legacy Arkan\'s pre-patch class from first_calling is intact after the requiresRace patch');
var reAccept31 = Game.Quests.accept('first_calling');
assert(reAccept31.ok === false && /already accepted or completed/.test(reAccept31.message),
  'legacy Arkan cannot re-accept the completed first_calling, refused for the ordinary reason (not the new race gate): ' + reAccept31.message);

// (ii) an Arkan who had first_calling ACTIVE pre-patch (accepted before this patch, not yet
// turned in): must still be able to finish it normally — turnIn() has no requiresRace check.
var c31legacyActive = makeCharacter({ name: 'LegacyArkanActiveCalling', race: 'Arkan' });
c31legacyActive.level = 5; // first_calling's own levelMin, re-checked at turn-in regardless of the ignoreMax flag
c31legacyActive.quests['first_calling'] = { status: 'active', progress: { kills: {}, touched: {}, visited: {} } };
for (var ka31 = 0; ka31 < 4; ka31++) winBattle('plains_vermin_swarm');
assert(c31legacyActive.quests['first_calling'].progress.kills['plains_vermin_swarm'] === 4, 'legacy active first_calling: kill progress still tracked normally');
Game._debug.goto('eldor'); // turnIn requires standing with the giver; kill progress is location-independent
assert(Game.Quests.canTurnIn('first_calling') === true, 'legacy active first_calling: canTurnIn true at count (turnIn has no requiresRace gate)');
var legacyTurnIn31 = Game.Quests.turnIn('first_calling', 'warrior');
assert(legacyTurnIn31.ok === true, 'legacy Arkan with a PRE-PATCH active first_calling can still complete it: ' + legacyTurnIn31.message);
assert(Game.Classes.isObtained(c31legacyActive, 'warrior') === true, 'class granted normally to the legacy Arkan despite the new Human-only accept gate');

// (iii) a classless legacy Arkan (never touched first_calling at all) is correctly routed to the
// NEW arkan_calling instead — no stranding. Already proven end-to-end in 31c/31b above; this is
// just the explicit "never had the quest" case, distinct from (i)/(ii)'s "already had it" cases.
var c31legacyNone = makeCharacter({ name: 'LegacyArkanNeverCalled', race: 'Arkan' });
c31legacyNone.level = 5; // clear first_calling's own levelMin so the race gate is the only thing left to trip
assert(!c31legacyNone.quests['first_calling'], 'sanity: classless legacy Arkan has no first_calling entry at all');
Game._debug.goto('eldor');
var refusedLegacyNone31 = Game.Quests.accept('first_calling');
assert(refusedLegacyNone31.ok === false && /Human/.test(refusedLegacyNone31.message),
  'classless legacy Arkan refused first_calling on the race gate, not stranded — arkan_calling (proven in 31c) is their path: ' + refusedLegacyNone31.message);

// 31e) B-fill bridge quests: race-gated, chain correctly, reachable in Saratus
console.log('--- 31e: B-fill bridge quests (arkan_shaman_hunt / arkan_beastmaster_watch) ---');
var shamanHunt31 = Game.Quests.getQuest('arkan_shaman_hunt');
var beastmasterWatch31 = Game.Quests.getQuest('arkan_beastmaster_watch');
assert(!!shamanHunt31 && shamanHunt31.requiresRace === 'Arkan' && shamanHunt31.requiresQuest === 'arkan_red_moon_whispers' && shamanHunt31.levelMin === 10,
  'arkan_shaman_hunt: Arkan-gated, chains behind arkan_red_moon_whispers, levelMin 10');
assert(!!beastmasterWatch31 && beastmasterWatch31.requiresRace === 'Arkan' && beastmasterWatch31.requiresQuest === 'arkan_shaman_hunt' && beastmasterWatch31.levelMin === 12,
  'arkan_beastmaster_watch: Arkan-gated, chains behind arkan_shaman_hunt, levelMin 12');

var c31human2 = makeCharacter({ name: 'PhaseRHumanBridge' });
c31human2.level = 10;
Game._debug.goto('saratus');
var resHumanShaman31 = Game.Quests.accept('arkan_shaman_hunt');
assert(resHumanShaman31.ok === false && /Arkan/.test(resHumanShaman31.message), 'Human refused arkan_shaman_hunt on the race gate: ' + resHumanShaman31.message);

var c31bridge = makeCharacter({ name: 'ArkanBridgeFlow', race: 'Arkan' });
c31bridge.level = 12;
satisfyChain('arkan_red_moon_whispers');
var acceptShaman31 = Game.Quests.accept('arkan_shaman_hunt');
assert(acceptShaman31.ok === true, 'arkan_shaman_hunt acceptable once arkan_red_moon_whispers is completed: ' + acceptShaman31.message);
for (var ks31 = 0; ks31 < 4; ks31++) winBattle('majiku_war_shaman');
var turnInShaman31 = Game.Quests.turnIn('arkan_shaman_hunt');
assert(turnInShaman31.ok === true, 'arkan_shaman_hunt turned in: ' + turnInShaman31.message);
var acceptBeastmaster31 = Game.Quests.accept('arkan_beastmaster_watch');
assert(acceptBeastmaster31.ok === true, 'arkan_beastmaster_watch acceptable once arkan_shaman_hunt is completed: ' + acceptBeastmaster31.message);
for (var kb31 = 0; kb31 < 3; kb31++) winBattle('majiku_beastmaster');
var turnInBeastmaster31 = Game.Quests.turnIn('arkan_beastmaster_watch');
assert(turnInBeastmaster31.ok === true, 'arkan_beastmaster_watch turned in, bridging the Arkan line up to the existing L14 saratus_foothills_intro gate: ' + turnInBeastmaster31.message);

// =================== Summary ===================
console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED');
} else {
  console.log(failures + ' TEST(S) FAILED');
  process.exitCode = 1;
}
