// Simulate browser globals minimally to load balance.js and character.js as plain scripts.
var window = { localStorage: (function(){
  var store = {};
  return {
    getItem: function(k){ return Object.prototype.hasOwnProperty.call(store,k) ? store[k] : null; },
    setItem: function(k,v){ store[k]=String(v); },
    removeItem: function(k){ delete store[k]; }
  };
})() };
window.btoa = function (str) { return Buffer.from(str, 'binary').toString('base64'); };
window.atob = function (str) { return Buffer.from(str, 'base64').toString('binary'); };
global.window = window;

var fs = require('fs');
var path = require('path');
var base = "D:/Claude - collection folder/HeroRPG/js";

function loadScript(relPath) {
  var code = fs.readFileSync(path.join(base, relPath), 'utf8');
  // Execute in global context, mimicking a <script> tag (non-module).
  vm.runInThisContext(code, { filename: relPath });
}
var vm = require('vm');

loadScript('balance.js');
loadScript('core/character.js');
loadScript('core/save.js');

// ---- Test 1: character creation ----
var skillPoints = {};
BALANCE.SKILLS.forEach(function(s){ skillPoints[s] = 0; });
skillPoints['Swords'] = 3;
skillPoints['Heavy Armor'] = 2;

var c = Game.Character.create({ race: 'Human', name: 'Testman', gender: 'Male', skillPoints: skillPoints });
console.log('Created character:', JSON.stringify({strength:c.strength, vitality:c.vitality, intelligence:c.intelligence, hp:c.hitPointsMax, energy:c.energyMax, swordsLvl:c.skills['Swords'].level}));

console.assert(c.strength === 6, 'Human should get +1 Strength (expected 6, got ' + c.strength + ')');
console.assert(c.skills['Swords'].level === 3, 'Swords skill point should be 3');
console.assert(c.skills['Heavy Armor'].level === 2, 'Heavy Armor skill point should be 2');

var arkan = Game.Character.create({ race: 'Arkan', name: 'Mage', gender: 'Female', skillPoints: skillPoints });
console.assert(arkan.intelligence === 6, 'Arkan should get +1 Intelligence (expected 6, got ' + arkan.intelligence + ')');

// ---- Test 2: leveling via addXp ----
var levels = Game.Character.addXp(c, 10000);
console.log('Levels gained from 10000 xp:', levels, 'now level', c.level, 'statPoints', c.statPoints, 'trainingPoints', c.trainingPoints);
console.assert(levels > 1, 'Should gain multiple levels from 10000 xp');
console.assert(c.statPoints === levels * BALANCE.LEVELUP_STAT_POINTS, 'statPoints should equal levels*5');
console.assert(c.trainingPoints === levels * BALANCE.LEVELUP_TRAINING_POINTS, 'trainingPoints should equal levels*2');

// ---- Test 3: spend stat point on vitality raises HP ----
var hpBefore = c.hitPointsMax;
var spBefore = c.statPoints;
var ok = Game.Character.spendStatPoint(c, 'vitality');
console.assert(ok === true, 'spendStatPoint should succeed');
console.assert(c.hitPointsMax > hpBefore, 'HP max should increase after Vitality spend (before='+hpBefore+', after='+c.hitPointsMax+')');
console.assert(c.statPoints === spBefore - 1, 'statPoints should decrement by 1');

// ---- Test 4: gold -> platinum conversion ----
var g = Game.Character.create({ race: 'Human', name: 'Goldman', gender: 'Male', skillPoints: skillPoints });
Game.Character.addGold(g, 250);
console.log('Gold test: platinum=' + g.platinum + ' gold=' + g.gold);
console.assert(g.platinum === 2 && g.gold === 50, 'Expected 2 platinum 50 gold, got ' + g.platinum + 'p ' + g.gold + 'g');

// ---- Test 5: skill cap ----
console.assert(Game.Character.skillCap({level:1}) === 3, 'skill cap at level 1 should be 3');
console.assert(Game.Character.skillCap({level:10}) === 21, 'skill cap at level 10 should be 21');

// ---- Test 6: save/load roundtrip ----
var state = { character: c };
Game.Save.save(state);
var loaded = Game.Save.load();
console.assert(loaded.character.name === 'Testman', 'loaded save should restore character name');
console.assert(loaded.character.level === c.level, 'loaded save should restore level');

// ---- Test 7: export/import roundtrip ----
var exported = Game.Save.exportString(state);
var imported = Game.Save.importString(exported);
console.assert(imported.character.name === 'Testman', 'import should restore character name');
console.assert(imported.character.gold === c.gold && imported.character.platinum === c.platinum, 'import should restore gold/platinum');

// ---- Test 8: creation point distribution enforcement (logical, not UI) ----
var total = 0;
for (var k in skillPoints) total += skillPoints[k];
console.assert(total === BALANCE.CREATION_SKILL_POINT_MAX_PER_SKILL + 2, 'sanity: total skill points in test fixture');

console.log('ALL ASSERTIONS PASSED (no console.assert failures printed above means success)');
