// HeroRPG remake — save/load (localStorage, versioned, export/import string).

var Game = window.Game || {};

Game.Save = (function () {

  var STORAGE_KEY = 'herorpg_save';
  var CURRENT_VERSION = 12;

  // Ids removed from js/data — kept here so old saves are cleaned on load
  // (docs/SPEC-LEGACY-CONJURER-CLEANUP.md section 2.1). An explicit table, never a generic
  // "drop unknown ids" sweep, so a failed data load can never delete a player's real techs.
  var RETIRED_TECHS = ['tech_summon_elemental'];            // v1.9, SPEC-COMPANION-SYSTEM D4
  var RETIRED_ABILITIES = {                                 // classId -> { abilityId: classLevelCost refunded }
    conjurer: { conjurer_summon_elemental: 5 }              // v1.9, cost per js/data/classes.js @ v1.8
  };

  // Transient (never persisted): the player-facing notes from the most recent load/import.
  var lastLoadNotes = [];


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

  // Retired-id sweep (SPEC-LEGACY-CONJURER-CLEANUP C1-C5). Runs on every load/import of every save
  // version. Idempotent: the refund only happens when the ability id is actually removed.
  // Returns the list of player-facing notes (one per affected class).
  function sanitizeRetired(state) {
    var notes = [];
    var c = state && state.character;
    if (!c) return notes;
    var i, n;
    // C1: c.techs
    if (c.techs && c.techs.length) {
      for (i = c.techs.length - 1; i >= 0; i--) {
        if (RETIRED_TECHS.indexOf(c.techs[i]) !== -1) c.techs.splice(i, 1);
      }
    }
    // C2: tech-bar slots become empty
    if (c.techSets && c.techSets.length) {
      for (i = 0; i < c.techSets.length; i++) {
        var set = c.techSets[i];
        if (!set || !set.length) continue;
        for (n = 0; n < set.length; n++) {
          if (RETIRED_TECHS.indexOf(set[n]) !== -1) set[n] = null;
        }
      }
    }
    // C3: retired class abilities + refund of the Class Levels spent on them
    if (c.classes) {
      for (var classId in RETIRED_ABILITIES) {
        if (!Object.prototype.hasOwnProperty.call(RETIRED_ABILITIES, classId)) continue;
        var entry = c.classes[classId];
        if (!entry || !entry.abilities || !entry.abilities.length) continue;
        var refunded = 0;
        for (var abilityId in RETIRED_ABILITIES[classId]) {
          if (!Object.prototype.hasOwnProperty.call(RETIRED_ABILITIES[classId], abilityId)) continue;
          var idx = entry.abilities.indexOf(abilityId);
          while (idx !== -1) {
            entry.abilities.splice(idx, 1);
            refunded += RETIRED_ABILITIES[classId][abilityId];
            idx = entry.abilities.indexOf(abilityId);
          }
        }
        if (refunded > 0) {
          entry.classLevelsSpent = Math.max(0, (entry.classLevelsSpent || 0) - refunded);
          notes.push('Summon Elemental has been retired from the Conjurer\'s teachings. The ' + refunded +
            ' Class Levels you spent on it have been returned — visit an Academy to learn a Pact.');
        }
      }
    }
    return notes;
  }

  function migrate(payload) {
    lastLoadNotes = [];
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
    // runeblade_of_kuraan is untouched here (tier 3 at the time of this v6->v7 step; later moved
    // to tier 4 in a v1.2 Phase 2 DATA-only change with no save-shape impact — js/data/classes.js).
    // New characters (and pre-existing ones with no `rogue` entry) are unaffected beyond the
    // version bump.
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

    // v8 -> v9: v1.2 Phase 1 (Dual Wield) introduces `c.equipment.offhand`. NOTE: this field was
    // actually already present in every save shape going all the way back to the v1->v2 step
    // above (added early, ahead of Dual Wield, for the Shields-skill offhand slot) — so in
    // practice this step is a defensive no-op for any save that already went through v1->v2.
    // Kept anyway per SPEC-V1.2.md's save-version plan (one coordinated v8->v9 bump for the whole
    // of v1.2) and as a safety net for any hand-built/partial save object missing the field.
    if (version === 8) {
      if (state && state.character) {
        var c9 = state.character;
        if (!c9.equipment || typeof c9.equipment !== 'object') {
          c9.equipment = { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null };
        } else if (c9.equipment.offhand === undefined) {
          c9.equipment.offhand = null;
        }
      }
      version = 9;
    }

    // v9 -> v10: v1.4 P2 (G1) added Advantage Points, character.ap (js/core/character.js create();
    // docs/SPEC-V1.4-GAMEPLAY.md §3). Existing v9 saves are upgraded in place (no data lost); a
    // pre-existing character simply starts with 0 AP, same as a fresh one.
    if (version === 9) {
      if (state && state.character) {
        var c10 = state.character;
        if (typeof c10.ap !== 'number') c10.ap = 0;
      }
      version = 10;
    }

    // v10 -> v11: v1.9 added the companion system, character.companion (js/core/character.js
    // create(); docs/SPEC-COMPANION-SYSTEM.md §2.1/§4). Existing v10 saves are upgraded in place
    // (no data lost); a pre-existing character simply starts with no companion bound, same as a
    // fresh one.
    if (version === 10) {
      if (state && state.character && typeof state.character.companion === 'undefined') {
        state.character.companion = null;
      }
      version = 11;
    }

    // v11 -> v12: v1.11 "Hero Tree" (docs/SPEC-CLASS-LINEAGE.md section 2.4) replaced the
    // Primary/Secondary slots with c.lineage = { tier1, tier2, tier3 } + c.legendaryClass.
    // M1: each tier 1/2/3 is filled by the obtained class of that tier. M2: if several of one tier
    // are obtained (debug helpers only), prefer the one in Primary, then Secondary, then highest
    // classLevelsEarned, then js/data/classes.js order; the others stay in c.classes but are never
    // active. M3: legendaryClass = Primary if legendary, else Secondary if legendary, else the
    // first obtained Legendary in data order, else null. M4: primaryClass/secondaryClass deleted;
    // no c.classes entry is touched (nothing lost or refunded). M5: old-convergence combos migrate
    // as-is. M6: a once-deactivated class is a zeroed entry and simply re-enters at Class Level 1.
    if (version === 11) {
      if (state && state.character) {
        var c12 = state.character;
        var classes12 = (c12.classes && typeof c12.classes === 'object') ? c12.classes : {};
        var defs12 = (Game.Data && Game.Data.classes) || [];
        var tierOf = {}, legendary12 = {}, order12 = [];
        for (var d = 0; d < defs12.length; d++) {
          tierOf[defs12[d].id] = defs12[d].tier;
          if (defs12[d].legendary) legendary12[defs12[d].id] = true;
          order12.push(defs12[d].id);
        }
        var prim = c12.primaryClass || null, sec = c12.secondaryClass || null;
        var lin = { tier1: null, tier2: null, tier3: null };
        [1, 2, 3].forEach(function (t) {
          var cands = order12.filter(function (id) {
            return tierOf[id] === t && Object.prototype.hasOwnProperty.call(classes12, id);
          });
          if (!cands.length) return;
          var best = null;
          if (cands.indexOf(prim) !== -1) best = prim;
          else if (cands.indexOf(sec) !== -1) best = sec;
          else {
            best = cands[0];
            for (var k = 1; k < cands.length; k++) {
              var a = (classes12[cands[k]] || {}).classLevelsEarned || 0;
              var b = (classes12[best] || {}).classLevelsEarned || 0;
              if (a > b) best = cands[k]; // strict: ties keep the earlier data-order class
            }
          }
          lin['tier' + t] = best;
        });
        var leg = null;
        if (prim && legendary12[prim] && Object.prototype.hasOwnProperty.call(classes12, prim)) leg = prim;
        else if (sec && legendary12[sec] && Object.prototype.hasOwnProperty.call(classes12, sec)) leg = sec;
        else {
          for (var o = 0; o < order12.length; o++) {
            if (legendary12[order12[o]] && Object.prototype.hasOwnProperty.call(classes12, order12[o])) { leg = order12[o]; break; }
          }
        }
        c12.lineage = lin;
        c12.legendaryClass = leg;
        delete c12.primaryClass;
        delete c12.secondaryClass;
      }
      version = 12;
    }

    lastLoadNotes = sanitizeRetired(state);

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
    importString: importString,
    getLastLoadNotes: function () { return lastLoadNotes.slice(); }
  };
})();

window.Game = Game;
