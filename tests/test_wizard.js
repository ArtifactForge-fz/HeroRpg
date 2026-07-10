var vm = require('vm');
var fs = require('fs');
var path = require('path');
var FakeDom = require('./fakedom.js');

var base = "D:/Claude - collection folder/HeroRPG/js";

var document = new FakeDom.FakeDocument();
var maincontent = document.createElement('div');
document.registerId('maincontent', maincontent);

global.document = document;
global.window = {
  localStorage: (function () {
    var store = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function (k, v) { store[k] = String(v); },
      removeItem: function (k) { delete store[k]; }
    };
  })(),
  btoa: function (str) { return Buffer.from(str, 'binary').toString('base64'); },
  atob: function (str) { return Buffer.from(str, 'base64').toString('binary'); }
};
global.window.document = document;
global.window.Game = undefined;
global.console = console;

function loadScript(relPath) {
  var code = fs.readFileSync(path.join(base, relPath), 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

loadScript('balance.js');
loadScript('core/character.js');
loadScript('core/save.js');
loadScript('ui/icons.js');
loadScript('ui/screens.js');

var Game = global.window.Game;
Game.state = { character: null };
Game.persist = function () { Game.Save.save(Game.state); };
Game.renderNav = function () {};
Game.renderStatusBars = function () {};
Game.renderActions = function () {};
Game.refreshCurrentScreen = function () { Game.Screens.navigate(Game.Screens.getCurrentScreen()); };

// ---- Step 1: render creation, pick race ----
Game.Screens.navigate('creation');
console.log('Step1 title:', maincontent.children[0].textContent);

var raceBoxes = maincontent.queryAllByClass('race-choice');
console.log('Race choices found:', raceBoxes.length);
console.assert(raceBoxes.length === 2, 'Expected 2 race choices (Human, Arkan)');

// click "Human" box (first one)
raceBoxes[0].click();

// Next button should now exist and not be disabled
var buttons = maincontent.queryAllByTag('button');
var nextBtn = buttons.filter(function (b) { return b.textContent === 'Next'; })[0];
console.log('Next button disabled after race pick:', nextBtn.disabled);
console.assert(nextBtn.disabled === false, 'Next should be enabled after choosing a race');

nextBtn.click();

// ---- Step 2: distribute skill points ----
console.log('Now on step:', maincontent.children[0].textContent);
var rows = maincontent.queryAllByClass('skillpoint-row');
console.log('Skill rows:', rows.length);
console.assert(rows.length === 18, 'Expected 18 skill rows');

// Find the "+" button for the first skill (Swords) and click it 3 times (at cap).
function findPlusButtonForSkillIndex(idx) {
  var row = maincontent.queryAllByClass('skillpoint-row')[idx];
  var btns = row.queryAllByTag('button');
  return btns[1]; // [0]=minus, [1]=plus
}

for (var i = 0; i < 3; i++) {
  var plus = findPlusButtonForSkillIndex(0);
  plus.click();
}
var swordsRow = maincontent.queryAllByClass('skillpoint-row')[0];
var swordsValueSpan = swordsRow.queryAllByClass('stat-value')[0];
console.log('Swords points after 3 clicks:', swordsValueSpan.textContent);
console.assert(swordsValueSpan.textContent === '3', 'Swords should show 3 points');

// try to click + a 4th time -- should be disabled (cap reached) so click does nothing more
var plusAgain = findPlusButtonForSkillIndex(0);
console.log('Swords + button disabled at cap:', plusAgain.disabled);
console.assert(plusAgain.disabled === true, 'Plus button should be disabled at per-skill cap of 3');

// Next should be disabled (only 3/5 points spent)
var nextBtn2 = maincontent.queryAllByTag('button').filter(function (b) { return b.textContent === 'Next'; })[0];
console.log('Next disabled with 3/5 points spent:', nextBtn2.disabled);
console.assert(nextBtn2.disabled === true, 'Next should be disabled until exactly 5 points spent');

// spend remaining 2 points on skill index 1
for (var j = 0; j < 2; j++) {
  var plus2 = findPlusButtonForSkillIndex(1);
  plus2.click();
}

var nextBtn3 = maincontent.queryAllByTag('button').filter(function (b) { return b.textContent === 'Next'; })[0];
console.log('Next disabled with 5/5 points spent:', nextBtn3.disabled);
console.assert(nextBtn3.disabled === false, 'Next should be enabled once exactly 5 points spent');

nextBtn3.click();

// ---- Step 3: name + gender ----
console.log('Now on step:', maincontent.children[0].textContent);
var nameInput = maincontent.queryAllByTag('input')[0];
nameInput.value = 'Test Hero 99!!';
nameInput.dispatch('input', { target: nameInput });
console.log('Sanitized name value:', nameInput.value);
console.assert(nameInput.value === 'TestHero99', 'Name should strip spaces/punctuation, expected "TestHero99" got "' + nameInput.value + '"');

var createBtn = maincontent.queryAllByTag('button').filter(function (b) { return b.textContent === 'Create'; })[0];
console.log('Create button disabled state:', createBtn.disabled);
console.assert(createBtn.disabled === false, 'Create should be enabled with valid name');

createBtn.click();

console.log('Current screen after create:', Game.Screens.getCurrentScreen());
console.assert(Game.Screens.getCurrentScreen() === 'status', 'Should land on status screen after creation');
console.assert(Game.state.character != null, 'Character should be created');
console.log('Character name:', Game.state.character.name, 'race:', Game.state.character.race);
console.assert(Game.state.character.name === 'TestHero99', 'Character name should match sanitized input');
console.assert(Game.state.character.skills['Swords'].level === 3, 'Swords skill level should be 3');
console.assert(Game.state.character.skills['Polearms'].level === 2, 'Polearms skill level should be 2');

// ---- Status screen renders without throwing, shows a + button for stat points ----
console.log('Status screen HTML top text:', maincontent.children[0].textContent);
var statPlusButtons = maincontent.queryAllByTag('button').filter(function (b) { return b.textContent === '+'; });
console.log('Stat + buttons on status screen (statPoints=0 at creation):', statPlusButtons.length);
console.assert(statPlusButtons.length === 0, 'No stat + buttons should show since statPoints is 0 right after creation');

// give stat points via addXp then re-check status screen shows + buttons
Game.Character.addXp(Game.state.character, 100000);
Game.Screens.navigate('status');
var statPlusButtons2 = maincontent.queryAllByTag('button').filter(function (b) { return b.textContent === '+'; });
console.log('Stat + buttons after leveling:', statPlusButtons2.length);
console.assert(statPlusButtons2.length === 5, 'Should show 5 stat + buttons (one per primary stat) once statPoints > 0');

console.log('ALL WIZARD/STATUS DOM TESTS COMPLETE');
