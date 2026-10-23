// HeroRPG remake — class system (DESIGN.md §3 Classes; reference/manual/Classes.md).
// Pure state-mutation module (no DOM access), mirroring js/core/world.js and js/core/quests.js.
//
// Character class state (js/core/character.js, save v12): c.classes = { [classId]: entry }
//   entry = { classXp: 0, classLevelsEarned: 0, classLevelsSpent: 0, abilities: [abilityId] }
// [revised] v1.11 "Hero Tree" (docs/SPEC-CLASS-LINEAGE.md): the archived Primary/Secondary slots,
// manual activation and the deactivation wipe (reference/manual/Classes.md) are REPLACED by a fixed
// lineage. c.lineage = { tier1, tier2, tier3 } (classId|null) is filled once by obtainClass and is
// auto-active forever (no deactivate, no swap); c.legendaryClass (classId|null) is ONE optional
// slot for an obtained Legendary (tier 4), changeable only at an Academy and never in battle
// (setLegendary). activeClassIds(c) is the single source of "which classes count" for classBonus,
// isClassTechUsable, buyAbility and addClassXp. Class XP is one shared pool split evenly over
// active classes that are not yet maxed (R8/R8a). c.legendaryUnlocked is a "you have obtained at
// least one Legendary class" back-compat flag (Classes.md: "may only be obtained by one player" --
// single-player reinterpretation, DESIGN.md section 3); it is NOT a cross-Legendary exclusivity
// gate: each Legendary latches independently via isObtained(c, classId). See js/core/battle.js
// onWin (boss_kill route) and checkRelicUnlock below (relic route); the third Legendary route
// (boss-combination kill) is a hidden quest and needs no core-code latch at all.

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

  // Ids of every tier-1 (base) class the character has OBTAINED (regardless of lineage). Used by the "Trials of Ascension" quest's acceptance gate (requiresBaseClass,
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
  // accept()), mirroring baseClassIdsObtained above for requiresBaseClass. Also drives
  // thirdTierOptionsFor below (v1.5 P4 branching, docs/SPEC-TIER3-EXPANSION.md).
  function advancedClassIdsObtained(c) {
    if (!c || !c.classes) return [];
    return Object.keys(c.classes).filter(function (id) {
      var cd = getClass(id);
      return cd && cd.tier === 2;
    });
  }

  // v1.5 P4 (docs/SPEC-TIER3-EXPANSION.md §1/§4): [revised] BRANCHING — supersedes the v1.2
  // Phase 2 "branch convergence" rule (docs/SPEC-V1.2.md Phase 2). Each TIER-2 class now offers
  // its own two Tier-3 options, mirroring advancedOptionsFor exactly, one tier up: keyed off
  // advancedClassIdsObtained(c) (the TIER-2 branch actually taken), NOT baseClassIdsObtained(c)
  // (the tier-1 line) — a tier-3 class's `baseClass` is now a TIER-2 id (js/data/classes.js), so
  // e.g. a Gladiator is offered Shadowknight/Berserker while a Crusader (same tier-1 Warrior line)
  // is offered Paladin/Warden instead — a real, differentiated choice per tier-2 branch rather
  // than one class converged from either sibling. Runeblade/Vaultbreaker/Heir of the Echo (tier 4)
  // are excluded by the strict tier === 3 check, same as advancedOptionsFor excludes them via
  // tier === 2. A character holding several tier-2 classes (e.g. via debug helpers) gets the
  // union of their options, matching advancedOptionsFor's own generic-over-multiple-bases
  // behavior. Legacy note (§5): a save with an "impossible" combo obtained under the OLD
  // convergence rule (e.g. a Crusader who obtained Shadowknight) keeps that class fully
  // functional — only future OFFERS are affected, never anything already obtained.
  function thirdTierOptionsFor(c) {
    var bases = advancedClassIdsObtained(c);
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
  // [revised] v1.11 (SPEC-CLASS-LINEAGE R1/R4): a tier 1/2/3 class is written into its empty
  // c.lineage.tierN slot and is active immediately (permanent); the FIRST Legendary obtained
  // auto-fills an empty Legendary slot, wherever it is obtained; later ones wait unslotted.
  function obtainClass(c, classId) {
    if (!c) return { ok: false, message: 'No character.' };
    var classDef = getClass(classId);
    if (!classDef) return { ok: false, message: 'Unknown class.' };
    if (!c.classes) c.classes = {};
    if (c.classes[classId]) return { ok: false, message: 'You have already obtained ' + classDef.name + '.' };
    c.classes[classId] = freshEntry();
    var msg = 'You have obtained the ' + classDef.name + ' class!';
    if (classDef.tier === 1 || classDef.tier === 2 || classDef.tier === 3) {
      if (!c.lineage || typeof c.lineage !== 'object') c.lineage = { tier1: null, tier2: null, tier3: null };
      var key = 'tier' + classDef.tier;
      if (!c.lineage[key]) {
        c.lineage[key] = classId;
        msg = classDef.name + ' joins your Hero Tree.';
      }
    } else if (classDef.legendary && !c.legendaryClass) {
      c.legendaryClass = classId;
      msg = classDef.name + ' now walks beside you as your Legendary calling.';
    }
    return { ok: true, message: msg };
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

  // ---------------- Lineage / active classes (SPEC-CLASS-LINEAGE R3/R5/R6) ----------------

  // Non-null of [tier1, tier2, tier3, legendaryClass]. Every consumer that used to read
  // [primaryClass, secondaryClass] goes through this.
  function activeClassIds(c) {
    if (!c) return [];
    var l = c.lineage || {};
    return [l.tier1, l.tier2, l.tier3, c.legendaryClass].filter(function (id) { return !!id; });
  }

  // [{ tier: 1|2|3, classId|null }] for the Hero Tree UI.
  function lineageOf(c) {
    var l = (c && c.lineage) || {};
    return [
      { tier: 1, classId: l.tier1 || null },
      { tier: 2, classId: l.tier2 || null },
      { tier: 3, classId: l.tier3 || null }
    ];
  }

  // R5: set (or, with null, empty) the Legendary slot. Only at an Academy (same facility check as
  // buyAbility), never during battle. Rejects non-obtained / non-legendary ids. No cost. R6: the
  // outgoing Legendary keeps XP/levels/abilities and its techs stay in c.techs, but its techs are
  // unslotted from every c.techSets entry so no dead slot is left behind.
  function setLegendary(c, classId) {
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state && Game.state.battle) {
      return { ok: false, message: 'You cannot change your Legendary calling in battle.' };
    }
    var area = Game.World ? Game.World.currentArea() : null;
    if (!Game.World || !Game.World.getFacility(area, 'academy')) {
      return { ok: false, message: 'Visit an Academy to change your Legendary.' };
    }
    var newDef = null;
    if (classId !== null && classId !== undefined) {
      newDef = getClass(classId);
      if (!newDef || !newDef.legendary) return { ok: false, message: 'That is not a Legendary class.' };
      if (!isObtained(c, classId)) return { ok: false, message: 'You have not obtained that class.' };
      if (c.legendaryClass === classId) return { ok: false, message: newDef.name + ' is already your Legendary calling.' };
    } else if (!c.legendaryClass) {
      return { ok: false, message: 'No Legendary is slotted.' };
    }
    var oldId = c.legendaryClass || null;
    var oldDef = oldId ? getClass(oldId) : null;
    if (oldId) unslotClassTechs(c, oldId);
    c.legendaryClass = newDef ? classId : null;
    if (Game.Character) Game.Character.recalcDerived(c);
    if (newDef) return { ok: true, message: newDef.name + ' now walks beside you as your Legendary calling.' };
    return {
      ok: true,
      message: (oldDef ? oldDef.name : oldId) + ' rests. Its techniques have been unslotted, but nothing it taught you is forgotten.'
    };
  }

  // Remove (only) the tech SLOTTING of every tech the class's bought abilities taught; c.techs
  // keeps them so swapping back needs no re-buy.
  function unslotClassTechs(c, classId) {
    var classDef = getClass(classId);
    var entry = c.classes && c.classes[classId];
    if (!classDef || !entry || !c.techSets) return;
    function unslot(techId) {
      for (var s = 0; s < c.techSets.length; s++) {
        var set = c.techSets[s];
        for (var k = 0; k < set.length; k++) if (set[k] === techId) set[k] = null;
      }
    }
    for (var i = 0; i < entry.abilities.length; i++) {
      var ability = getAbility(classDef, entry.abilities[i]);
      if (ability && ability.kind === 'tech') {
        if (ability.techId) unslot(ability.techId);
        if (Array.isArray(ability.techIds)) ability.techIds.forEach(unslot);
      }
    }
  }

  // R8/R8a: maxed once classLevelsEarned >= sum of classLevelCost over ALL the class's abilities
  // (earned, not bought -- unspent levels still count).
  function isClassMaxed(c, classId) {
    var entry = c && c.classes && c.classes[classId];
    var classDef = getClass(classId);
    if (!entry || !classDef) return false;
    var total = 0;
    for (var i = 0; i < classDef.abilities.length; i++) total += classDef.abilities[i].classLevelCost || 0;
    return entry.classLevelsEarned >= total;
  }

  // ---------------- Class XP / Class Levels ----------------

  // Cumulative XP needed to REACH class level n (class level 1 = 0 XP, mirroring
  // Game.Character.xpNeededForNext's cumulative-curve convention).
  // [revised] v1.6 P2 (SPEC-V1.6-REBALANCE.md §6.2, PG-2): steepened from round(30*(n-1)^1.6) to
  // round(120*(n-1)^1.9) — the old curve capped out at ~class level 8-13, so a tier-3 class fully
  // unlocked in ~2-3 kills and a tier-1 class in ~13 (REVIEW-2026-07-16.md PG-2). LOCKED by the
  // lead's P0 progression calc: tier-3 full-unlock ~2-3 -> ~37 kills, tier-2 -> ~86, tier-1 ->
  // ~192 (paired with the award-fraction cut in addClassXp below). Tiers land unevenly in absolute
  // kills (higher-tier monsters give more XP per kill) — an accepted imperfection, not fixed here.
  // LEGACY-SAFE: classLevelsEarned/classLevelsSpent are STORED per-character (js/core/character.js
  // create(), c.classes[id].classLevelsEarned) and only ever INCREMENT going forward inside
  // grantClassXp's while-loop below — nothing anywhere recomputes classLevelsEarned retroactively
  // from classXp against this curve, so an existing save's already-banked class levels/abilities
  // are untouched by steepening the curve; only FUTURE class-Xp grants level up more slowly.
  function classXpForLevel(n) {
    return Math.round(120 * Math.pow(n - 1, 1.9));
  }

  // Called from js/core/battle.js onWin AFTER the XP/loot cutoff check (cutoff kills grant no
  // class XP either, matching main XP). [revised] v1.11 (SPEC-CLASS-LINEAGE R8/D2): ONE shared
  // pool, floor(amount * BALANCE.CLASS_XP_POOL_FRACTION), split evenly (floor(pool / n)) over the
  // active classes that are not yet maxed. A maxed class drops out and its share goes to the rest;
  // all maxed -> nothing awarded. An unslotted Legendary earns nothing (R7). Returns the ids of
  // classes that just became maxed (callers may toast them) -- ignoring it is fine.
  function addClassXp(c, amount) {
    var newlyMaxed = [];
    if (!c || !amount) return newlyMaxed;
    var earning = activeClassIds(c).filter(function (id) { return !isClassMaxed(c, id); });
    if (!earning.length) return newlyMaxed;
    var pool = Math.floor(amount * BALANCE.CLASS_XP_POOL_FRACTION);
    var share = Math.floor(pool / earning.length);
    for (var i = 0; i < earning.length; i++) {
      grantClassXp(c, earning[i], share);
      if (isClassMaxed(c, earning[i])) newlyMaxed.push(earning[i]);
    }
    return newlyMaxed;
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
    if (activeClassIds(c).indexOf(classId) === -1) {
      return { ok: false, message: 'That class must be active (in your Hero Tree or Legendary slot) to buy abilities for it.' };
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
      if (ability.techId && c.techs.indexOf(ability.techId) === -1) c.techs.push(ability.techId);
      // v1.9 (SPEC-COMPANION-SYSTEM.md §2.5): a tech ability may instead carry `techIds` (array) —
      // e.g. the Conjurer's Pact abilities grant a Bind (summon) tech + its command tech together.
      // Back-compatible: every pre-existing ability keeps its single `techId` untouched above.
      if (Array.isArray(ability.techIds)) {
        ability.techIds.forEach(function (tid) {
          if (c.techs.indexOf(tid) === -1) c.techs.push(tid);
        });
      }
    }
    if (Game.Character) Game.Character.recalcDerived(c);
    return { ok: true, message: 'Purchased ' + ability.name + ' for ' + classDef.name + '.' };

  }

  // ---------------- Passive effect hook (guarded-hook style, matches Game.World.shrineBonus) ----------------

  // Sums bought passives of the given effect kind across ACTIVE classes only (lineage + slotted
  // Legendary, R3 — an obtained-but-unslotted Legendary contributes nothing, matching the archived rule
  // that benefits only apply "once a class is activated").
  function classBonus(c, effect) {
    if (!c || !c.classes) return 0;
    var total = 0;
    var slots = activeClassIds(c);
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
        // docs/SPEC-SECONDARY-STATS.md §2.9 (D3): a bought passive may ALSO carry bonusEffects, a
        // second, smaller effect on top of its original one. Summed the same way as the main
        // effect above — only for bought abilities of an ACTIVE class, same guard as above.
        if (ability && ability.kind === 'passive' && ability.bonusEffects) {
          for (var be = 0; be < ability.bonusEffects.length; be++) {
            if (ability.bonusEffects[be].effect === effect) total += ability.bonusEffects[be].power;
          }
        }
      }
    }
    return total;
  }

  // ---------------- Class-tech usability gate ----------------

  // A classOnly tech (js/data/techs.js: classOnly + classId) may only be cast while its owning
  // class is active (lineage or the Legendary slot) — even if it is still known in c.techs from a
  // swapped-out Legendary. Single guarded check point, called from js/core/battle.js useTech()
  // right after the existing isTechEquipped() check, so both the "must be slotted" and "class
  // must be active" gates live in the same short-circuit chain.
  function isClassTechUsable(c, tech) {
    if (!tech || !tech.classOnly) return true; // non-class techs are unaffected by this gate
    return activeClassIds(c).indexOf(tech.classId) !== -1;
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
    activeClassIds: activeClassIds,
    lineageOf: lineageOf,
    setLegendary: setLegendary,
    isClassMaxed: isClassMaxed,
    classXpForLevel: classXpForLevel,
    addClassXp: addClassXp,
    unspentClassLevels: unspentClassLevels,
    buyAbility: buyAbility,
    classBonus: classBonus,
    isClassTechUsable: isClassTechUsable
  };
})();

window.Game = Game;
