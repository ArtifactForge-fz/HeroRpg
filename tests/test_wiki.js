// Phase W exit test (docs/SPEC-V1.7-CONTENT-UX.md §6) — smoke test for the reference wiki
// (wiki.html + js/ui/wiki.js). NEW FILE, does not touch any existing test_p*.js suite (a
// concurrent agent owns those + js/data/*.js on this shared checkout).
//
// Loads wiki.html's own data-script set (balance.js + items/monsters/techs/areas/recipes) plus
// js/ui/wiki.js through the same vm+fakedom harness the other suites use, then checks:
//   1) the pure-data cross-reference builders (item->shop, item->monster-drop%, monster->area,
//      area level range) against known, hand-verified entries in the real data;
//   2) Game.Wiki.render() produces all five sections with the right row counts using a fakedom
//      root element, and that a monster's drop rate renders as a literal "NN%" string somewhere
//      in its row (the spec's headline ask: drop rates readable at a glance).

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

// Same script set + order wiki.html itself loads (see wiki.html <script src> list) — no
// js/core/* modules, since the wiki reads Game.Data.* directly and never touches battle/world
// state. v1.8 P4 (Task B): quests.js added, mirroring wiki.html's own new <script> line, so the
// Source/Used-for quest cross-references (quest reward / hand-out / collect target) have
// Game.Data.quests to read.
loadScript('balance.js');
loadScript('data/items.js');
loadScript('data/monsters.js');
loadScript('data/techs.js');
loadScript('data/areas.js');
loadScript('data/recipes.js');
loadScript('data/quests.js');
loadScript('ui/wiki.js');

// Every data/ui file ends with `window.Game = Game;`, so the fully-populated object lives at
// global.window.Game — grab a reference for readability below.
var Game = global.window.Game;

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

// ---------------------------------------------------------------------------
// 1) Pure-data cross-references
// ---------------------------------------------------------------------------

// sword_rusty_shortblade: sold in Eldor's shop (js/data/areas.js eldor facilities[0].stock).
var swordShops = Game.Wiki.itemShopSources('sword_rusty_shortblade');
assert(swordShops.indexOf('Royal City of Eldor') !== -1,
  'sword_rusty_shortblade should be sourced to Royal City of Eldor\'s shop, got ' + JSON.stringify(swordShops));

// potion_minor_healing: dropped by plains_field_rat at chance 0.1 -> 10%.
var potionDrops = Game.Wiki.itemDropSources('potion_minor_healing');
var ratDrop = potionDrops.filter(function (d) { return d.monsterId === 'plains_field_rat'; })[0];
assert(!!ratDrop, 'potion_minor_healing should list plains_field_rat as a drop source');
assert(ratDrop && ratDrop.pct === 10, 'plains_field_rat drop chance should render as 10%, got ' + (ratDrop && ratDrop.pct));

// plains_field_rat is found in the Plains of Averast hunt list.
var ratLocations = Game.Wiki.monsterLocations('plains_field_rat');
var ratHunt = ratLocations.filter(function (l) { return l.areaId === 'plains_of_averast' && l.kind === 'hunt'; })[0];
assert(!!ratHunt, 'plains_field_rat should be located in plains_of_averast, got ' + JSON.stringify(ratLocations));

// estari_ruin_warden is the Estari Ruins lair boss (level 10).
var wardenLocations = Game.Wiki.monsterLocations('estari_ruin_warden');
var wardenLair = wardenLocations.filter(function (l) { return l.areaId === 'estari_ruins' && l.kind === 'lair'; })[0];
assert(!!wardenLair, 'estari_ruin_warden should be located as the estari_ruins lair, got ' + JSON.stringify(wardenLocations));

// Estari Ruins level range spans its regular hunt list (4-5) through its lair boss (10).
var estariArea = Game.Data.areas.filter(function (a) { return a.id === 'estari_ruins'; })[0];
var estariRange = Game.Wiki.areaLevelRange(estariArea);
assert(estariRange === 'Lv 4–10', 'estari_ruins level range should be "Lv 4–10", got ' + estariRange);

// ---------------------------------------------------------------------------
// 1b) v1.8 P4 (Task B, audit §6): the new Source axes (forage/quest-reward/quest-handout/
// recipe-output/AA-Exchange) and the new "Used for" axis (recipe input / quest collect target).
// Fixtures per the phase brief: quest_wardframe_rune_shard (forage + drop source, AND a recipe
// input after v1.8 P2's D-C sink landed) and quest_condensed_anima_core (drop source + collect
// target of the advanced-class quest — the audit's own headline "not dead" example).
// ---------------------------------------------------------------------------

// quest_wardframe_rune_shard: foraged at Saratus's plains (js/data/areas.js saratus_plains).
var shardForage = Game.Wiki.itemForageSources('quest_wardframe_rune_shard');
assert(shardForage.indexOf('Plains East of Saratus') !== -1,
  'quest_wardframe_rune_shard should list "Plains East of Saratus" as a forage source, got ' + JSON.stringify(shardForage));

// quest_wardframe_rune_shard: also drops from the saratus_wardframe construct at 30%.
var shardDrops = Game.Wiki.itemDropSources('quest_wardframe_rune_shard');
var shardDrop = shardDrops.filter(function (d) { return d.monsterId === 'saratus_wardframe'; })[0];
assert(!!shardDrop && shardDrop.pct === 30,
  'quest_wardframe_rune_shard should drop from saratus_wardframe at 30%, got ' + JSON.stringify(shardDrop));

// quest_wardframe_rune_shard: v1.8 P2 (D-C) added a recipe input consuming it — "Used for" should
// surface that recipe by id, resolving to its output item name.
var shardRecipeTargets = Game.Wiki.itemRecipeInputTargets('quest_wardframe_rune_shard');
var shardRecipe = shardRecipeTargets.filter(function (r) { return r.id === 'synth_pure_anima_from_wardframe_shards'; })[0];
assert(!!shardRecipe && shardRecipe.output === 'crystal_pure_anima',
  'quest_wardframe_rune_shard should be a recipe input for synth_pure_anima_from_wardframe_shards -> crystal_pure_anima, got ' + JSON.stringify(shardRecipe));
// And the built item row should render that recipe with its resolved output name, not a bare id.
var shardRow = Game.Wiki.buildItemRows().filter(function (r) { return r.item.id === 'quest_wardframe_rune_shard'; })[0];
assert(!!shardRow && shardRow.recipeInputs.some(function (s) { return s.indexOf('Crystal of Pure Anima') !== -1; }),
  'quest_wardframe_rune_shard\'s item row "Used for" should name Crystal of Pure Anima, got ' + JSON.stringify(shardRow && shardRow.recipeInputs));

// quest_condensed_anima_core: drops from estari_ruin_warden at 60% (the audit's headline example).
var animaCoreDrops = Game.Wiki.itemDropSources('quest_condensed_anima_core');
var animaCoreDrop = animaCoreDrops.filter(function (d) { return d.monsterId === 'estari_ruin_warden'; })[0];
assert(!!animaCoreDrop && animaCoreDrop.pct === 60,
  'quest_condensed_anima_core should drop from estari_ruin_warden at 60%, got ' + JSON.stringify(animaCoreDrop));

// quest_condensed_anima_core: the collect-step target of trials_of_eldor, now named "The Trials
// of the Vanguard" (v1.7 Phase Q re-homed + renamed it — the audit doc and this phase's own brief
// cite the STALE pre-v1.7 name "The Trials of Ascension"; the wiki must show the CURRENT
// quest.name field, since that's what a player actually sees in the Journal).
var animaCoreTargets = Game.Wiki.itemQuestCollectTargets('quest_condensed_anima_core');
assert(animaCoreTargets.indexOf('The Trials of the Vanguard') !== -1,
  'quest_condensed_anima_core should be a collect target of "The Trials of the Vanguard", got ' + JSON.stringify(animaCoreTargets));

// The rendered items table should show BOTH new columns' text for these two known items.
var shardRootCheck = document.createElement('div');
Game.Wiki.render(shardRootCheck);
var itemsSectionCheck = shardRootCheck.children.filter(function (c) { return c.id === 'wiki-items'; })[0];
var itemsTableText = itemsSectionCheck.textContent;
assert(itemsTableText.indexOf('Forage: Plains East of Saratus') !== -1,
  'rendered items table should show the Wardframe Rune Shard\'s forage source');
assert(itemsTableText.indexOf('Recipe input: synth_pure_anima_from_wardframe_shards -> Crystal of Pure Anima') !== -1,
  'rendered items table should show the Wardframe Rune Shard\'s recipe "Used for" entry');
assert(itemsTableText.indexOf('Quest collect target: The Trials of the Vanguard') !== -1,
  'rendered items table should show the Condensed Anima Core\'s quest collect "Used for" entry');

// Techs table: the "Details" column renders the v1.8 P1 debuff/statKind-buff fields for any tech
// that carries them — degrades to '—' for every pre-v1.8 tech with none of those fields.
var plainTech = (Game.Data.techs || []).filter(function (t) { return !t.statKind && t.effect !== 'debuff' && !t.requiresShield && !t.requiresOffhandWeapon && !t.requiresArmorClass && !t.goldSteal; })[0];
assert(!!plainTech && Game.Wiki.techDetailText(plainTech) === '—',
  'a pre-v1.8 tech with none of the new fields should render Details as "—"');

// ---------------------------------------------------------------------------
// 2) Row builders match the loaded data's shape/counts
// ---------------------------------------------------------------------------

var itemRows = Game.Wiki.buildItemRows();
assert(itemRows.length === Game.Data.items.length, 'buildItemRows should return one row per item, got ' + itemRows.length + ' vs ' + Game.Data.items.length);

var monsterRows = Game.Wiki.buildMonsterRows();
assert(monsterRows.length === Game.Data.monsters.length, 'buildMonsterRows should return one row per monster, got ' + monsterRows.length + ' vs ' + Game.Data.monsters.length);
var ratRow = monsterRows.filter(function (r) { return r.monster.id === 'plains_field_rat'; })[0];
assert(!!ratRow, 'buildMonsterRows should include plains_field_rat');
var ratRowDrop = ratRow && ratRow.drops.filter(function (d) { return d.itemId === 'potion_minor_healing'; })[0];
assert(!!ratRowDrop && ratRowDrop.itemName === 'Minor Healing Potion' && ratRowDrop.pct === 10,
  'plains_field_rat monster row should resolve its drop to "Minor Healing Potion" at 10%, got ' + JSON.stringify(ratRowDrop));

var areaRows = Game.Wiki.buildAreaRows();
assert(areaRows.length === Game.Data.areas.length, 'buildAreaRows should return one row per area, got ' + areaRows.length + ' vs ' + Game.Data.areas.length);

var techChains = Game.Wiki.buildTechChains();
var techCountFromChains = techChains.reduce(function (sum, g) { return sum + g.techs.length; }, 0);
assert(techCountFromChains === Game.Data.techs.length, 'buildTechChains should account for every technique, got ' + techCountFromChains + ' vs ' + Game.Data.techs.length);

var recipeRows = Game.Wiki.buildRecipeRows();
assert(recipeRows.length === Game.Data.recipes.length, 'buildRecipeRows should return one row per recipe, got ' + recipeRows.length + ' vs ' + Game.Data.recipes.length);
var firstRecipe = recipeRows[0];
var firstRecipeOutputItem = Game.Data.items.filter(function (i) { return i.id === firstRecipe.recipe.output; })[0];
assert(!!firstRecipeOutputItem && firstRecipe.outputName === firstRecipeOutputItem.name,
  'recipe output should resolve to the real item name, not a bare id, got ' + firstRecipe.outputName);

// ---------------------------------------------------------------------------
// 3) render() end-to-end against a fakedom root
// ---------------------------------------------------------------------------

var root = document.createElement('div');
Game.Wiki.render(root);

var sectionIds = root.children.filter(function (c) { return c.className && c.className.indexOf('wiki-section') !== -1; }).map(function (c) { return c.id; });
['wiki-items', 'wiki-monsters', 'wiki-areas', 'wiki-techs', 'wiki-recipes'].forEach(function (id) {
  assert(sectionIds.indexOf(id) !== -1, 'render() should produce a #' + id + ' section, got sections ' + JSON.stringify(sectionIds));
});

var tables = root.queryAllByTag('table');
assert(tables.length === 5, 'render() should produce 5 tables (one per section), got ' + tables.length);

// Items table: header row + one row per item.
var itemsSection = root.children.filter(function (c) { return c.id === 'wiki-items'; })[0];
var itemTable = itemsSection.queryAllByTag('table')[0];
var itemTrs = itemTable.queryAllByTag('tr');
assert(itemTrs.length === Game.Data.items.length + 1, 'items table should have header + ' + Game.Data.items.length + ' rows, got ' + itemTrs.length);

// Monsters table: the drop-rate column must render the known 10% literally, as text.
var monstersSection = root.children.filter(function (c) { return c.id === 'wiki-monsters'; })[0];
var monsterTableText = monstersSection.textContent;
assert(monsterTableText.indexOf('Minor Healing Potion (10%)') !== -1,
  'rendered monsters table should show "Minor Healing Potion (10%)" among plains_field_rat\'s drops');

// Areas table: rendered text should include the computed level range for Estari Ruins.
var areasSection = root.children.filter(function (c) { return c.id === 'wiki-areas'; })[0];
assert(areasSection.textContent.indexOf('Lv 4–10') !== -1, 'rendered areas table should show the Estari Ruins level range');

// Recipes table: at least one row, gold values present.
var recipesSection = root.children.filter(function (c) { return c.id === 'wiki-recipes'; })[0];
var recipeTrs = recipesSection.queryAllByTag('table')[0].queryAllByTag('tr');
assert(recipeTrs.length === Game.Data.recipes.length + 1, 'recipes table should have header + ' + Game.Data.recipes.length + ' rows, got ' + recipeTrs.length);

// Techniques table: header + one row per technique (grouped by chain, but every tech still gets its own row).
var techsSection = root.children.filter(function (c) { return c.id === 'wiki-techs'; })[0];
var techTrs = techsSection.queryAllByTag('table')[0].queryAllByTag('tr');
assert(techTrs.length === Game.Data.techs.length + 1, 'techniques table should have header + ' + Game.Data.techs.length + ' rows, got ' + techTrs.length);

console.log('\n===================================');
if (failures === 0) {
  console.log('ALL TESTS PASSED (' + passes + ' assertions)');
  process.exit(0);
} else {
  console.log(failures + ' TEST(S) FAILED (' + passes + ' passed)');
  process.exit(1);
}
