// HeroRPG remake — save/load (localStorage, versioned, export/import string).

var Game = window.Game || {};

Game.Save = (function () {

  var STORAGE_KEY = 'herorpg_save';
  var CURRENT_VERSION = 8;

  // Transient fields are never persisted: `battle` (Phase 3) holds a live reference to the
  // character plus per-fight state; reloading mid-battle simply abandons the battle.
  function persistableState(state) {
    var copy = {};
    for (var k in state) {
      if (!Object.prototype.hasOwnProperty.call(state, k)) continue;
      if (k === 'battle') continue;
      copy[k] = state[k];
    }
    return copy;
  }

  function save(state) {
    var payload = { version: CURRENT_VERSION, state: persistableState(state) };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error('HeroRPG: save failed', e);
      return false;
    }
  }

  function load() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.error('HeroRPG: load failed', e);
      return null;
    }
    if (!raw) return null;
    var payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      console.error('HeroRPG: save data corrupt', e);
      return null;
    }
    return migrate(payload);
  }

  function migrate(payload) {
    if (!payload || typeof payload.version !== 'number') return null;

    var state = payload.state;
    var version = payload.version;

    // v1 -> v2: Phase 2 added inventory/equipment fields to the character. Existing v1 saves
    // are upgraded in place (no data lost) rather than rejected.
    if (version === 1) {
      if (state && state.character) {
        var c = state.character;
        if (!c.inventory) c.inventory = [];
        if (!c.equipment) {
          c.equipment = { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null };
        }
        if (typeof c.weaponDamageBonus !== 'number') c.weaponDamageBonus = 0;
        if (c.equippedWeaponSkill === undefined) c.equippedWeaponSkill = null;
      }
      version = 2;
    }

    // v2 -> v3: Phase 3 added techniques (known list + 3 equipped sets of 8) and the Fury Meter.
    // Existing v2 saves are upgraded in place (no data lost).
    if (version === 2) {
      if (state && state.character) {
        var c3 = state.character;
        if (!Array.isArray(c3.techs)) c3.techs = [];
        if (!Array.isArray(c3.techSets) || c3.techSets.length !== 3) {
          c3.techSets = [
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null]
          ];
        } else {
          // defensive: make sure each set has exactly 8 slots
          for (var si = 0; si < 3; si++) {
            var set = c3.techSets[si] || [];
            while (set.length < 8) set.push(null);
            c3.techSets[si] = set.slice(0, 8);
          }
        }
        if (typeof c3.fury !== 'number') c3.fury = 0;
      }
      version = 3;
    }

    // v3 -> v4: Phase 4 added world/town state — currentLocation, vault, shrineBuffs. Existing
    // v3 saves are upgraded in place (no data lost); new characters start in Eldor.
    if (version === 3) {
      if (state && state.character) {
        var c4 = state.character;
        if (typeof c4.currentLocation !== 'string') c4.currentLocation = 'eldor';
        if (!c4.vault || typeof c4.vault !== 'object') {
          c4.vault = { platinum: 0, gold: 0, items: [] };
        } else {
          if (typeof c4.vault.platinum !== 'number') c4.vault.platinum = 0;
          if (typeof c4.vault.gold !== 'number') c4.vault.gold = 0;
          if (!Array.isArray(c4.vault.items)) c4.vault.items = [];
        }
        if (!Array.isArray(c4.shrineBuffs)) c4.shrineBuffs = [];
      }
      version = 4;
    }

    // v4 -> v5: Phase 5 added the quest journal (DESIGN.md §7). Existing v4 saves are upgraded
    // in place (no data lost); the migration adds an empty quest map.
    if (version === 4) {
      if (state && state.character) {
        var c5 = state.character;
        if (!c5.quests || typeof c5.quests !== 'object' || Array.isArray(c5.quests)) {
          c5.quests = {};
        }
      }
      version = 5;
    }

    // v5 -> v6: Phase 6a added the class system (DESIGN.md §3). Existing v5 saves are upgraded
    // in place (no data lost); new characters (and pre-existing ones) start with no classes
    // obtained/active and the Legendary latch un-set.
    if (version === 5) {
      if (state && state.character) {
        var c6 = state.character;
        if (!c6.classes || typeof c6.classes !== 'object' || Array.isArray(c6.classes)) {
          c6.classes = {};
        }
        if (c6.primaryClass === undefined) c6.primaryClass = null;
        if (c6.secondaryClass === undefined) c6.secondaryClass = null;
        if (typeof c6.legendaryUnlocked !== 'boolean') c6.legendaryUnlocked = false;
      }
      version = 6;
    }

    // v6 -> v7: v1.1 revision (DESIGN.md §3) split classes into a two-tier structure and renamed
    // the OLD base-tier "Rogue" (id `rogue`, one of the archived level-30 first-choice trio) to
    // `thief`, since the id `rogue` is now REUSED for the NEW advanced-tier class of that name
    // (js/data/classes.js). Any v6 save with a `classes.rogue` entry belonged to the old
    // base-tier Rogue — re-key it to `thief` (classXp/classLevelsEarned/classLevelsSpent
    // preserved verbatim — no XP or Class Levels are lost), and update primaryClass/
    // secondaryClass (incl. an active slot) if either pointed at 'rogue'. The `abilities` list is
    // reset to empty: the OLD base-tier Rogue's ability ids (rogue_quickstep, etc.) don't exist
    // on the NEW `thief` class definition (which has an entirely different 3-ability roster), so
    // carrying them over would leave dangling ids that resolve to nothing; classLevelsSpent is
    // deliberately left untouched (not refunded) so no free respec windfall results — the player
    // simply re-buys `thief`'s actual abilities with those same already-spent Class Levels...
    // effectively: none are refunded, matching the archived deactivation-wipe spirit of "spent
    // levels are spent." warrior/magician entries are untouched (ids unchanged, now tier 1);
    // runeblade_of_kuraan is untouched (tier 3, unaffected by the revision). New characters (and
    // pre-existing ones with no `rogue` entry) are unaffected beyond the version bump.
    if (version === 6) {
      if (state && state.character) {
        var c7 = state.character;
        if (c7.classes && typeof c7.classes === 'object' && !Array.isArray(c7.classes) &&
            Object.prototype.hasOwnProperty.call(c7.classes, 'rogue') &&
            !Object.prototype.hasOwnProperty.call(c7.classes, 'thief')) {
          var oldRogueEntry = c7.classes.rogue;
          c7.classes.thief = {
            classXp: oldRogueEntry.classXp || 0,
            classLevelsEarned: oldRogueEntry.classLevelsEarned || 0,
            classLevelsSpent: oldRogueEntry.classLevelsSpent || 0,
            abilities: [] // old ability ids don't exist on the new `thief` roster — see comment above
          };
          delete c7.classes.rogue;
        }
        if (c7.primaryClass === 'rogue') c7.primaryClass = 'thief';
        if (c7.secondaryClass === 'rogue') c7.secondaryClass = 'thief';
      }
      version = 7;
    }

    // v7 -> v8: Feature B (user-directed) added persistent status conditions — c.afflictions,
    // entries { id: 'haunting' } (js/core/character.js create()/addAffliction). Existing v7 saves
    // are upgraded in place (no data lost); a pre-existing character simply starts un-Haunted.
    if (version === 7) {
      if (state && state.character) {
        var c8 = state.character;
        if (!Array.isArray(c8.afflictions)) c8.afflictions = [];
      }
      version = 8;
    }

    if (version === CURRENT_VERSION) return state;
    return null;
  }

  function wipe() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('HeroRPG: wipe failed', e);
    }
  }

  function exportString(state) {
    var payload = { version: CURRENT_VERSION, state: persistableState(state) };
    var json = JSON.stringify(payload);
    return window.btoa(unescape(encodeURIComponent(json)));
  }

  function importString(b64) {
    var json;
    try {
      json = decodeURIComponent(escape(window.atob(b64.trim())));
    } catch (e) {
      console.error('HeroRPG: import decode failed', e);
      return null;
    }
    var payload;
    try {
      payload = JSON.parse(json);
    } catch (e) {
      console.error('HeroRPG: import parse failed', e);
      return null;
    }
    return migrate(payload);
  }

  return {
    save: save,
    load: load,
    wipe: wipe,
    exportString: exportString,
    importString: importString
  };
})();

window.Game = Game;
