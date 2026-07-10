var vm = require('vm');
var fs = require('fs');
var path = require('path');
var FakeDom = require('./fakedom.js');

var base = "D:/Claude - collection folder/HeroRPG/js";

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

var localStorageStore = {};
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
global.console = console;
global.alert = function (m) { console.log('[alert]', m); };

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

// Inline boot logic mirrors index.html
Game.state = { character: null };
Game.persist = function () { Game.Save.save(Game.state); };
Game.refreshCurrentScreen = function () { Game.Screens.navigate(Game.Screens.getCurrentScreen()); };
Game.renderNav = function () {};
Game.renderStatusBars = function () {};
Game.renderActions = function () {};

function boot() {
  var loaded = Game.Save.load();
  if (loaded && loaded.character) {
    Game.state = loaded;
    Game.Screens.navigate('status');
  } else {
    Game.state = { character: null };
    Game.Screens.navigate('creation');
  }
}

// ---- "First load": no save exists ----
boot();
console.log('First boot screen (expect creation):', Game.Screens.getCurrentScreen());
console.assert(Game.Screens.getCurrentScreen() === 'creation', 'Fresh load should show creation wizard');

// Create a character directly via Character.create + persist (simulating wizard completion)
var skillPoints = {};
BALANCE.SKILLS.forEach(function (s) { skillPoints[s] = 0; });
skillPoints['Rods'] = 3;
skillPoints['Evocation'] = 2;

var character = Game.Character.create({ race: 'Arkan', name: 'ReloadTest', gender: 'Female', skillPoints: skillPoints });
Game.state.character = character;
Game.persist();
Game.Screens.navigate('status');

console.log('After creation, screen:', Game.Screens.getCurrentScreen());

// ---- Simulate a page reload: fresh Game.state, re-run boot() ----
Game.state = { character: null };
boot();
console.log('Second boot (after reload) screen:', Game.Screens.getCurrentScreen());
console.assert(Game.Screens.getCurrentScreen() === 'status', 'Reload with existing save should land on Status');
console.assert(Game.state.character && Game.state.character.name === 'ReloadTest', 'Reloaded character name should persist');
console.assert(Game.state.character.race === 'Arkan', 'Reloaded character race should persist');
console.assert(Game.state.character.skills['Rods'].level === 3, 'Reloaded skill levels should persist');

console.log('RELOAD PERSISTENCE TEST PASSED');
