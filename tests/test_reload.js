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
loadScript('data/changelog.js');
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

// ============================================================================================
// Version-log release guard
// ----------------------------------------------------------------------------------------------
// js/data/changelog.js (Game.Data.changelog, newest-first) is the player-facing version log
// rendered by changelog.html. Nothing forces a release to update it, so this guard cross-checks
// entry [0] against the two places a release actually announces itself:
//   1. README.md's "Development status: **vX.Y" line (every release's docs pass touches it) —
//      bumping the announced version without prepending a changelog entry must fail.
//   2. js/core/save.js's CURRENT_VERSION (a save-format bump that skips the version log must
//      fail too).
// Plus cheap structural sanity on every entry so future entries stay honest.
//
// NOTE on style: the reload assertions above use console.assert(), which only *logs* on failure
// and does not affect the process exit code (verified: `node -e "console.assert(false,'x')"`
// still exits 0) — so it can't actually redden a suite run. A release guard with no teeth isn't a
// guard, so the checks below use guardAssert(), which throws (uncaught -> non-zero exit) instead.
function guardAssert(cond, msg) {
  if (!cond) {
    throw new Error('VERSION LOG RELEASE GUARD FAILED: ' + msg);
  }
}

// ---- 1. README version <-> changelog[0].version ----
var readmePath = path.join(base, '..', 'README.md');
var readmeText = fs.readFileSync(readmePath, 'utf8');
var readmeVersionMatch = readmeText.match(/Development status:\s*\*\*v(\d+\.\d+)/);
guardAssert(readmeVersionMatch, 'could not find "Development status: **vX.Y" line in README.md');
var readmeVersion = 'v' + readmeVersionMatch[1];
var changelogTop = Game.Data.changelog[0];
guardAssert(
  readmeVersion === changelogTop.version,
  'README announces ' + readmeVersion + ' but js/data/changelog.js[0].version is "' +
    changelogTop.version + '" — prepend a changelog entry for the new release.'
);

// ---- 2. save.js CURRENT_VERSION <-> changelog[0].saveVersion ----
// CURRENT_VERSION is a private var inside Game.Save's IIFE (not exposed on the Game.Save object),
// so it's extracted from the source text rather than read off Game.Save.
var savePath = path.join(base, 'core/save.js');
var saveText = fs.readFileSync(savePath, 'utf8');
var saveVersionMatch = saveText.match(/CURRENT_VERSION\s*=\s*(\d+)/);
guardAssert(saveVersionMatch, 'could not find "CURRENT_VERSION = N" in js/core/save.js');
var currentSaveVersion = parseInt(saveVersionMatch[1], 10);
guardAssert(
  changelogTop.saveVersion === currentSaveVersion,
  'js/core/save.js CURRENT_VERSION is ' + currentSaveVersion + ' but js/data/changelog.js[0].' +
    'saveVersion is ' + changelogTop.saveVersion + ' — the version log is out of sync with the ' +
    'save format.'
);

// ---- 3. Structural sanity of the changelog ----
guardAssert(
  Array.isArray(Game.Data.changelog) && Game.Data.changelog.length > 0,
  'Game.Data.changelog must be a non-empty array'
);
Game.Data.changelog.forEach(function (entry, i) {
  guardAssert(
    typeof entry.version === 'string' && /^v\d+\.\d+$/.test(entry.version),
    'changelog[' + i + '].version must match /^v\\d+\\.\\d+$/, got "' + entry.version + '"'
  );
  guardAssert(
    typeof entry.title === 'string' && entry.title.length > 0,
    'changelog[' + i + '].title must be a non-empty string'
  );
  guardAssert(
    typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date),
    'changelog[' + i + '].date must match /^\\d{4}-\\d{2}-\\d{2}$/, got "' + entry.date + '"'
  );
  guardAssert(
    typeof entry.saveVersion === 'number' && Number.isInteger(entry.saveVersion) && entry.saveVersion >= 1,
    'changelog[' + i + '].saveVersion must be an integer >= 1, got ' + entry.saveVersion
  );
  guardAssert(
    Array.isArray(entry.highlights) && entry.highlights.length > 0,
    'changelog[' + i + '].highlights must be a non-empty array'
  );
  entry.highlights.forEach(function (h, j) {
    guardAssert(
      typeof h === 'string' && h.length > 0,
      'changelog[' + i + '].highlights[' + j + '] must be a non-empty string'
    );
  });
  if (i + 1 < Game.Data.changelog.length) {
    var next = Game.Data.changelog[i + 1];
    guardAssert(
      entry.date >= next.date,
      'changelog entries must be newest-first by date: entry ' + i + ' (' + entry.date +
        ') is older than entry ' + (i + 1) + ' (' + next.date + ')'
    );
    guardAssert(
      entry.saveVersion >= next.saveVersion,
      'changelog saveVersion must be non-increasing newest-first: entry ' + i + ' (' +
        entry.saveVersion + ') < entry ' + (i + 1) + ' (' + next.saveVersion + ')'
    );
  }
});

console.log('VERSION LOG RELEASE GUARD PASSED');
