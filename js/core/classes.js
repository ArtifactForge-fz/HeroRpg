// HeroRPG remake — class system (DESIGN.md §3 Classes; reference/manual/Classes.md).
// Pure state-mutation module (no DOM access), mirroring js/core/world.js and js/core/quests.js.
//
// Character class state (js/core/character.js, save v6): c.classes = { [classId]: entry }
//   entry = { classXp: 0, classLevelsEarned: 0, classLevelsSpent: 0, abilities: [abilityId] }
// c.primaryClass / c.secondaryClass hold a classId or null. c.legendaryUnlocked is a "you have
// obtained at least one Legendary class" flag (Classes.md: "may only be obtained by one player" —
// single-player reinterpretation, DESIGN.md §3); it is NOT a cross-Legendary exclusivity gate —
// v1.2 Phase 2 clarifies (roster grew from 1 to 3 Legendaries) that each Legendary class latches
// independently via isObtained(c, classId): obtaining one does not block obtaining another. See
// js/core/battle.js onWin (boss_kill route) and checkRelicUnlock below (relic route); the third
// Legendary route (boss-combination kill) is a hidden quest and needs no core-code latch at all.

var Game = window.Game || {};

Game.Classes = (function () {

  function getClass(classId) {
    var list = Game.Data.classes || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === classId) return list[i];
    }
    return null;
  }

  function getAbility(classDef, abilityId) {
    if (!classDef) return null;
    for (var i = 0; i < classDef.abilities.length; i++) {
      if (classDef.abilities[i].id === abilityId) return classDef.abilities[i];
    }
    return null;
  }

  function freshEntry() {
    return { classXp: 0, classLevelsEarned: 0, classLevelsSpent: 0, abilities: [] };
  }

  function isObtained(c, classId) {
    return !!(c.classes && c.classes[classId]);
  }

  // ---------------- Tier helpers (v1.1 revision, DESIGN.md §3) ----------------

  // Ids of every tier-1 (base) class the character has OBTAINED (regardless of active/inactive
  // slot). Used by the "Trials of Ascension" quest's acceptance gate (requiresBaseClass,
  // js/core/quests.js accept()) and by advancedOptionsFor below.
  function baseClassIdsObtained(c) {
    if (!c || !c.classes) return [];
    return Object.keys(c.classes).filter(function (id) {
      var cd = getClass(id);
      return cd && cd.tier === 1;
    });
  }

  // The tier-2 (advanced) classes whose baseClass the character has obtained — normally exactly
  // 2 (one base obtained via "First Calling"), but generic over however many base classes are
  // obtained (e.g. via debug helpers), so it never silently drops a legitimately-earned branch.
  // Strictly tier === 2, so Runeblade/Vaultbreaker/Heir of the Echo (tier 4) and the tier-3
  // Shadowknight/Magus/Gambit roster (v1.2 Phase 2) never appear here.
  function advancedOptionsFor(c) {
    var bases = baseClassIdsObtained(c);
    if (!bases.length) return [];
    var list = Game.Data.classes || [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var cd = list[i];
      if (cd.tier === 2 && bases.indexOf(cd.baseClass) !== -1) out.push(cd.id);
    }
    return out;
  }

  // Ids of every tier-2 (advanced) class the character has OBTAINED — used by the "Master's
  // Calling" tier-3 capstone quest's acceptance gate (requiresAdvancedClass, js/core/quests.js
  // accept()), mirroring baseClassIdsObtained above for requiresBaseClass.
  function advancedClassIdsObtained(c) {
    if (!c || !c.classes) return [];
    return Object.keys(c.classes).filter(function (id) {
      var cd = getClass(id);
      return cd && cd.tier === 2;
    });
  }

  // v1.2 Phase 2 (docs/SPEC-V1.2.md Phase 2): the tier-3 class whose baseClass matches the
  // player's obtained tier-1 base class — mirrors advancedOptionsFor exactly, but keyed off
  // baseClassIdsObtained (the TIER-1 line, not the tier-2 branch) per the "branch convergence"
  // rule: Shadowknight/Magus/Gambit's baseClass is 'warrior'/'magician'/'thief', not a tier-2 id,
  // so this naturally resolves to exactly ONE option per obtained base line (not two, unlike
  // advancedOptionsFor) — Runeblade/Vaultbreaker/Heir of the Echo (tier 4) are excluded by the
  // strict tier === 3 check, same as advancedOptionsFor excludes them via tier === 2.
  function thirdTierOptionsFor(c) {
    var bases = baseClassIdsObtained(c);
    if (!bases.length) return [];
    var list = Game.Data.classes || [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var cd = list[i];
      if (cd.tier === 3 && bases.indexOf(cd.baseClass) !== -1) out.push(cd.id);
    }
    return out;
  }

  // ---------------- Obtain ----------------

  // Adds classId to c.classes if not already obtained. Used by the class-choice quest reward
  // (js/core/quests.js turnIn) and by the Legendary boss-kill unlock (js/core/battle.js onWin).
  // Obtaining a class does NOT activate it — the player must still assign it to a slot
  // (archived: "Before a class can be applied to your character, it must be activated" —
  // Classes.md).
  function obtainClass(c, classId) {
    if (!c) return { ok: false, message: 'No character.' };
    var classDef = getClass(classId);
    if (!classDef) return { ok: false, message: 'Unknown class.' };
    if (!c.classes) c.classes = {};
    if (c.classes[classId]) return { ok: false, message: 'You have already obtained ' + classDef.name + '.' };
    c.classes[classId] = freshEntry();
    return { ok: true, message: 'You have obtained the ' + classDef.name + ' class!' };
  }

  // ---------------- Legendary "relic" unlock (v1.2 Phase 2; docs/SPEC-V1.2.md Phase 2) ----------

  // Guarded hook called from js/core/inventory.js addItem() every time an item successfully
  // enters the player's inventory (loot pickup, quest reward, or synthesis output alike — addItem
  // is the single funnel for all three). Grants any Legendary class whose obtain.kind is 'relic'
  // and whose itemId just arrived, provided the level gate is met and the class is not already
  // obtained — mirroring the boss_kill latch in js/core/battle.js onWin, but item-triggered rather
  // than kill-triggered, and per-class (obtaining Heir of the Echo does not block or get blocked
  // by Runeblade/Vaultbreaker — see the header comment's "mutually-independent" note).
  function checkRelicUnlock(c, itemId) {
    if (!c) return;
    var list = Game.Data.classes || [];
    for (var i = 0; i < list.length; i++) {
      var classDef = list[i];
      if (!classDef.legendary || !classDef.obtain || classDef.obtain.kind !== 'relic') continue;
      if (classDef.obtain.itemId !== itemId) continue;
      if (c.level < classDef.obtain.minLevel) continue;
      if (isObtained(c, classDef.id)) continue;
      c.legendaryUnlocked = true; // one-per-save "you have a Legendary" latch, kept for back-compat (see classes.js header)
      obtainClass(c, classDef.id);
    }
  }

  // ---------------- Activate / Deactivate ----------------

  // archived: "Drag this icon to the box labeled 'Primary.'" — our UI substitutes click-to-
  // assign for drag-and-drop (phase brief). A class cannot occupy both slots simultaneously.
  function activate(c, classId, slot) {
    if (!c) return { ok: false, message: 'No character.' };
    if (slot !== 'primary' && slot !== 'secondary') return { ok: false, message: 'Unknown slot.' };
    if (!isObtained(c, classId)) return { ok: false, message: 'You have not obtained that class.' };
    var otherSlot = slot === 'primary' ? 'secondary' : 'primary';
    var otherKey = otherSlot === 'primary' ? 'primaryClass' : 'secondaryClass';
    if (c[otherKey] === classId) {
      return { ok: false, message: 'That class is already active as your ' + otherSlot + ' class.' };
    }
    var key = slot === 'primary' ? 'primaryClass' : 'secondaryClass';
    c[key] = classId;
    if (Game.Character) Game.Character.recalcDerived(c);
    return { ok: true, message: getClass(classId).name + ' is now your ' + slot + ' class.' };
  }

  // archived WARNING (Classes.md): deactivating "PERMANENTLY" wipes that class's XP, levels,
  // and abilities, returning it to "inactive" (still obtained — rebuildable from zero). Also
  // strips any of that class's tech ids from c.techs and every c.techSets slot, since a
  // deactivated class's tech can no longer be cast (js/core/battle.js useTech class-active
  // gate) and leaving it slotted/known would be a dead, un-castable entry.
  function deactivate(c, slot) {
    if (!c) return { ok: false, message: 'No character.' };
    if (slot !== 'primary' && slot !== 'secondary') return { ok: false, message: 'Unknown slot.' };
    var key = slot === 'primary' ? 'primaryClass' : 'secondaryClass';
    var classId = c[key];
    if (!classId) return { ok: false, message: 'No class is active in that slot.' };
    var classDef = getClass(classId);

    // Strip class techs from known techs + every equipped set.
    var entry = c.classes[classId];
    if (entry) {
      for (var i = 0; i < entry.abilities.length; i++) {
        var ability = getAbility(classDef, entry.abilities[i]);
        if (ability && ability.kind === 'tech') {
          removeTech(c, ability.techId);
        }
      }
    }

    c.classes[classId] = freshEntry(); // permanent wipe: xp/levels/abilities all reset to zero
    c[key] = null;
    if (Game.Character) Game.Character.recalcDerived(c);
    return {
      ok: true,
      message: (classDef ? classDef.name : classId) + ' has been deactivated. All of its Class ' +
        'Experience, Class Levels, and abilities are permanently lost; it remains in your ' +
        'Inactive Classes and can be rebuilt from zero.'
    };
  }

  function removeTech(c, techId) {
    var idx = c.techs.indexOf(techId);
    if (idx !== -1) c.techs.splice(idx, 1);
    for (var s = 0; s < c.techSets.length; s++) {
      var set = c.techSets[s];
      for (var slotIdx = 0; slotIdx < set.length; slotIdx++) {
        if (set[slotIdx] === techId) set[slotIdx] = null;
      }
    }
  }

  // ---------------- Class XP / Class Levels ----------------

  // Same curve as character levels, scaled down (invented, per phase brief): classXpForLevel(n)
  // = round(30 * (n-1)^1.6). Cumulative XP needed to REACH class level n (class level 1 = 0 XP,
  // mirroring Game.Character.xpNeededForNext's cumulative-curve convention).
  function classXpForLevel(n) {
    return Math.round(30 * Math.pow(n - 1, 1.6));
  }

  // Called from js/core/battle.js onWin AFTER the XP/loot cutoff check (cutoff kills grant no
  // class XP either, matching main XP — phase brief). Primary gains the full battle-XP amount
  // (archived: "progresses at a rate equal to that of your main experience bar"); Secondary
  // gains half (archived: "the Secondary class will only progress at half the rate"). A class
  // with no slot assigned gains nothing, even if obtained.
  function addClassXp(c, amount) {
    if (!c || !amount) return;
    if (c.primaryClass) grantClassXp(c, c.primaryClass, amount);
    if (c.secondaryClass) grantClassXp(c, c.secondaryClass, Math.floor(amount / 2));
  }

  function grantClassXp(c, classId, amount) {
    if (!amount) return;
    var entry = c.classes && c.classes[classId];
    if (!entry) return; // defensive: a slotted class should always be obtained, but guard anyway
    entry.classXp += amount;
    // classLevelsEarned starts at 0 (freshEntry) and counts LEVELS GAINED, mirroring
    // c.level's cumulative-XP convention but offset by one: classXpForLevel(1) === 0 is the
    // trivial "you start with 0 levels" baseline, so the level-up check below must compare
    // against classXpForLevel(classLevelsEarned + 2) — the threshold for the NEXT level beyond
    // the one already counted — or a freshly-obtained class would instantly "earn" its first
    // level from 0 XP. (Equivalent to Game.Character.addXp's `c.level` starting at 1 instead of
    // 0 — here classLevelsEarned=0 already stands in for "class level 1".)
    while (entry.classXp >= classXpForLevel(entry.classLevelsEarned + 2)) {
      entry.classLevelsEarned += 1;
    }
  }

  function unspentClassLevels(c, classId) {
    var entry = c.classes && c.classes[classId];
    if (!entry) return 0;
    return entry.classLevelsEarned - entry.classLevelsSpent;
  }

  // ---------------- Buy ability (Academy-only, DESIGN.md §6 Academy; Classes.md "Gaining Class
  // Levels will allow you to purchase additional skills and abilities... from the Academy") ----

  function buyAbility(c, classId, abilityId) {
    if (!c) return { ok: false, message: 'No character.' };
    var area = Game.World ? Game.World.currentArea() : null;
    if (!Game.World || !Game.World.getFacility(area, 'academy')) {
      return { ok: false, message: 'There is no Academy here.' };
    }
    if (!isObtained(c, classId)) return { ok: false, message: 'You have not obtained that class.' };
    if (c.primaryClass !== classId && c.secondaryClass !== classId) {
      return { ok: false, message: 'That class must be active (Primary or Secondary) to buy abilities for it.' };
    }
    var classDef = getClass(classId);
    var ability = getAbility(classDef, abilityId);
    if (!ability) return { ok: false, message: 'Unknown ability.' };
    var entry = c.classes[classId];
    if (entry.abilities.indexOf(abilityId) !== -1) return { ok: false, message: 'Already purchased.' };
    var unspent = unspentClassLevels(c, classId);
    if (unspent < ability.classLevelCost) {
      return { ok: false, message: 'Requires ' + ability.classLevelCost + ' unspent Class Levels (you have ' + unspent + ').' };
    }

    entry.classLevelsSpent += ability.classLevelCost;
    entry.abilities.push(abilityId);
    if (ability.kind === 'tech') {
      if (c.techs.indexOf(ability.techId) === -1) c.techs.push(ability.techId);
    }
    if (Game.Character) Game.Character.recalcDerived(c);
    return { ok: true, message: 'Purchased ' + ability.name + ' for ' + classDef.name + '.' };
  }

  // ---------------- Passive effect hook (guarded-hook style, matches Game.World.shrineBonus) ----------------

  // Sums bought passives of the given effect kind across ACTIVE classes only (Primary +
  // Secondary — an obtained-but-inactive class contributes nothing, matching the archived rule
  // that benefits only apply "once a class is activated").
  function classBonus(c, effect) {
    if (!c || !c.classes) return 0;
    var total = 0;
    var slots = [c.primaryClass, c.secondaryClass];
    for (var s = 0; s < slots.length; s++) {
      var classId = slots[s];
      if (!classId) continue;
      var entry = c.classes[classId];
      var classDef = getClass(classId);
      if (!entry || !classDef) continue;
      for (var i = 0; i < entry.abilities.length; i++) {
        var ability = getAbility(classDef, entry.abilities[i]);
        if (ability && ability.kind === 'passive' && ability.effect === effect) {
          total += ability.power;
        }
      }
    }
    return total;
  }

  // ---------------- Class-tech usability gate ----------------

  // A classOnly tech (js/data/techs.js: classOnly + classId) may only be cast while its owning
  // class is active (Primary or Secondary) — even if it is still known in c.techs from a
  // previous activation. Single guarded check point, called from js/core/battle.js useTech()
  // right after the existing isTechEquipped() check, so both the "must be slotted" and "class
  // must be active" gates live in the same short-circuit chain.
  function isClassTechUsable(c, tech) {
    if (!tech || !tech.classOnly) return true; // non-class techs are unaffected by this gate
    return c.primaryClass === tech.classId || c.secondaryClass === tech.classId;
  }

  return {
    getClass: getClass,
    getAbility: getAbility,
    isObtained: isObtained,
    baseClassIdsObtained: baseClassIdsObtained,
    advancedClassIdsObtained: advancedClassIdsObtained,
    advancedOptionsFor: advancedOptionsFor,
    thirdTierOptionsFor: thirdTierOptionsFor,
    obtainClass: obtainClass,
    checkRelicUnlock: checkRelicUnlock,
    activate: activate,
    deactivate: deactivate,
    classXpForLevel: classXpForLevel,
    addClassXp: addClassXp,
    unspentClassLevels: unspentClassLevels,
    buyAbility: buyAbility,
    classBonus: classBonus,
    isClassTechUsable: isClassTechUsable
  };
})();

window.Game = Game;
