// HeroRPG remake — quest state machine (DESIGN.md §7 Quests).
// Pure state-mutation module (no DOM access), mirroring js/core/world.js and js/core/battle.js.
//
// Character quest state (js/core/character.js, save v5): c.quests = { [questId]: entry }
//   entry = { status: 'active' | 'completed', progress: { ... } }
//   progress shape depends on the quest's step kinds:
//     kill    -> progress.kills[monsterId] = count so far
//     touch   -> progress.touched[areaId] = true (per Standing-Stones-style token)
//     collect -> no progress needed; checked live against inventory at turn-in
//     visit   -> progress.visited[areaId] = true

var Game = window.Game || {};

Game.Quests = (function () {

  function getQuest(questId) {
    var list = Game.Data.quests || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === questId) return list[i];
    }
    return null;
  }

  function entry(c, questId) {
    if (!c.quests) c.quests = {};
    return c.quests[questId] || null;
  }

  function freshProgress() {
    return { kills: {}, touched: {}, visited: {} };
  }

  // ---------------- Availability ----------------

  // Quests offered at areaId: giver is here and the quest has never been accepted (active or
  // completed). Level-window failures are NOT filtered out here — the Tavern UI greys those out
  // with the reason instead (phase brief), so this returns { quest, eligible, reason } records.
  //
  // v1.4 P1 (G5, docs/SPEC-V1.4-GAMEPLAY.md §2): two additions, both TAVERN OVERLOAD fixes —
  //   1. requiresQuest chain gating: a quest whose prerequisite is not yet 'completed' is skipped
  //      ENTIRELY (not even a greyed record) — chained content simply doesn't clutter the offer
  //      list before its turn comes. Contrast with the level-window case just below, which still
  //      returns a record so the Tavern can grey it out with a reason.
  //   2. active-quest cap: once the hero already has BALANCE.MAX_ACTIVE_QUESTS active quests, any
  //      quest that would otherwise be eligible (giver here, never accepted, level window OK) is
  //      marked ineligible with a cap reason instead. Per the phase brief, level-window
  //      ineligibility keeps PRIORITY over the cap reason when both would apply — a player under
  //      the level requirement should be told that, not told the journal is full, since the level
  //      reason is the more fundamental one (it won't resolve by finishing another quest).
  function availableAt(areaId) {
    var c = Game.state.character;
    if (!c) return [];
    if (!c.quests) c.quests = {};
    var list = Game.Data.quests || [];
    var out = [];
    var atCap = activeQuestCount(c) >= BALANCE.MAX_ACTIVE_QUESTS;
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (q.giver.areaId !== areaId) continue;
      if (c.quests[q.id]) continue; // already active or completed
      // Chain gating (NEW, v1.4 P1): hidden entirely until the prerequisite is completed.
      if (q.requiresQuest) {
        var prereq = c.quests[q.requiresQuest];
        if (!prereq || prereq.status !== 'completed') continue;
      }
      var lvl = levelCheck(c, q);
      if (!lvl.ok) {
        out.push({ quest: q, eligible: false, reason: lvl.reason });
      } else if (atCap) {
        out.push({
          quest: q,
          eligible: false,
          reason: 'Your journal is full (' + activeQuestCount(c) + '/' + BALANCE.MAX_ACTIVE_QUESTS + ' active).'
        });
      } else {
        out.push({ quest: q, eligible: true, reason: null });
      }
    }
    return out;
  }

  // Count of currently-active quest entries (NEW, v1.4 P1 G5) — shared by accept()'s cap refusal,
  // availableAt()'s cap reason, and the Journal's "Active (n/3)" header.
  function activeQuestCount(c) {
    if (!c.quests) return 0;
    var n = 0;
    for (var qid in c.quests) {
      if (c.quests.hasOwnProperty(qid) && c.quests[qid].status === 'active') n++;
    }
    return n;
  }

  // Level-window check shared by accept() and turnIn() (archived: the Oruk quest enforces a
  // level band — Recent_Updates.md 2007-04-06 "can only be completed by heroes greater than
  // level 5 but less than 10" — checked at BOTH accept and turn-in per the phase brief).
  function levelCheck(c, quest) {
    if (typeof quest.levelMin === 'number' && c.level < quest.levelMin) {
      return { ok: false, reason: 'Requires Level ' + quest.levelMin + ' (you are Level ' + c.level + ').' };
    }
    if (typeof quest.levelMax === 'number' && c.level > quest.levelMax) {
      return { ok: false, reason: 'Only for heroes of Level ' + quest.levelMax + ' or below (you are Level ' + c.level + ').' };
    }
    return { ok: true, reason: null };
  }

  // ---------------- Accept ----------------

  function accept(questId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var quest = getQuest(questId);
    if (!quest) return { ok: false, message: 'Unknown quest.' };
    if (!c.quests) c.quests = {};
    if (c.quests[questId]) return { ok: false, message: 'You have already accepted or completed this quest.' };

    // NEW (v1.4 P1, G5 active-quest cap, docs/SPEC-V1.4-GAMEPLAY.md §2): checked right after the
    // already-accepted check and BEFORE the location/level checks below — a full journal is the
    // clearest possible refusal, so the player learns it immediately rather than traveling to the
    // giver (or leveling up) only to be turned away for an unrelated reason. Backward compatible:
    // a save that already carries more than MAX_ACTIVE_QUESTS actives (e.g. from before this
    // patch) keeps them all — this only blocks NEW accepts, cancel() is the relief valve.
    if (activeQuestCount(c) >= BALANCE.MAX_ACTIVE_QUESTS) {
      return { ok: false, message: 'Your journal is full — finish or abandon a quest first.' };
    }

    if (c.currentLocation !== quest.giver.areaId) {
      var giverArea = Game.World.getArea(quest.giver.areaId);
      return { ok: false, message: 'You must be with ' + quest.giver.npc + ' in ' + (giverArea ? giverArea.name : quest.giver.areaId) + ' to accept this quest.' };
    }
    var lvl = levelCheck(c, quest);
    if (!lvl.ok) return { ok: false, message: lvl.reason };

    // NEW (v1.1 revision, DESIGN.md §3): "Trials of Ascension" (trials_of_eldor) requires having
    // obtained a base (tier-1) class via First Calling first — advancing a calling you never
    // answered makes no sense, and Game.Classes.advancedOptionsFor(c) would otherwise resolve to
    // an empty list at turn-in with no clear explanation why.
    if (quest.requiresBaseClass && Game.Classes && Game.Classes.baseClassIdsObtained(c).length === 0) {
      return {
        ok: false,
        message: 'You must first answer a calling — obtain a base class (Warrior, Magician, or ' +
          'Thief) via The First Calling before attempting the Trials of Ascension.'
      };
    }

    // NEW (v1.2 Phase 2, docs/SPEC-V1.2.md Phase 2): "The Master's Calling" (masters_calling)
    // requires having obtained a tier-2 (advanced) class first — converging a calling never
    // advanced makes no sense, mirroring the requiresBaseClass gate one tier up.
    if (quest.requiresAdvancedClass && Game.Classes && Game.Classes.advancedClassIdsObtained(c).length === 0) {
      return {
        ok: false,
        message: 'You must first advance your calling — obtain an advanced (tier-2) class via ' +
          'The Trials of Ascension before attempting The Master\'s Calling.'
      };
    }

    // NEW (v1.2 Phase 3 Content-A, docs/SPEC-V1.2.md Phase 3 Content-A): the Arkan questline
    // (js/data/quests.js arkan_first_rite/arkan_battlemage_trial/arkan_red_moon_whispers) sets
    // requiresRace: 'Arkan' — mirrors requiresBaseClass/requiresAdvancedClass's gate style, just
    // checked against c.race instead of obtained classes.
    if (quest.requiresRace && c.race !== quest.requiresRace) {
      return {
        ok: false,
        message: 'This calling belongs to the ' + quest.requiresRace + ' alone — your people have their own path.'
      };
    }

    // NEW (v1.4 P1, G5 quest chains, docs/SPEC-V1.4-GAMEPLAY.md §2): requiresQuest is enforced
    // here too, in DEFENSE IN DEPTH — availableAt() already hides a chained quest from the Tavern
    // list entirely until its prerequisite is completed, but that's a UI-layer omission, not a
    // guarantee (e.g. Game._debug.acceptQuest bypasses accept() on purpose for test/debug use).
    // A lore-neutral refusal message (no NPC-specific flavor) since any quest can carry this field.
    if (quest.requiresQuest) {
      var prereqEntry = c.quests[quest.requiresQuest];
      if (!prereqEntry || prereqEntry.status !== 'completed') {
        return { ok: false, message: 'You are not ready for this task yet.' };
      }
    }

    // Delivery-style quests hand over items on accept (quest.acceptItems). All of them must fit
    // or the accept is refused outright — never a partial hand-over.
    var acceptItems = quest.acceptItems || [];
    if (acceptItems.length) {
      var weight = Game.Inventory.currentWeight(c);
      var capacity = Game.Inventory.carryCapacity(c);
      for (var a = 0; a < acceptItems.length; a++) {
        var item = Game.Inventory.getItem(acceptItems[a]);
        weight += item ? item.weight : 0;
      }
      if (weight > capacity) {
        return { ok: false, message: 'You cannot carry what ' + quest.giver.npc + ' needs to hand you — too much weight. Free up space first.' };
      }
      for (var g = 0; g < acceptItems.length; g++) {
        Game.Inventory.addItem(c, acceptItems[g]);
      }
    }

    c.quests[questId] = { status: 'active', progress: freshProgress() };
    if (Game.persist) Game.persist();
    return { ok: true, message: 'Quest accepted: ' + quest.name + '.' };
  }

  // ---------------- Cancel ----------------

  // archived: quests can be canceled via the Journal (Recent_Updates.md 2007-04-06 "Quests can
  // now be canceled via the Journal"). Cancelling wipes ALL progress, including touched Standing
  // Stones — archived specifically for that quest (Recent_Updates.md 2007-05-09: "if you cancel
  // it and start it a second time, it will reset the stones you have touched") but applied
  // uniformly, since no other progress kind is meant to survive a cancel either.
  function cancel(questId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var e = entry(c, questId);
    if (!e || e.status !== 'active') return { ok: false, message: 'You do not have that quest active.' };
    // Reclaim any accept-granted delivery items (one copy each, if still carried) so a
    // cancel+re-accept cycle can't stockpile them.
    var quest = getQuest(questId);
    var acceptItems = (quest && quest.acceptItems) || [];
    for (var a = 0; a < acceptItems.length; a++) {
      Game.Inventory.discard(c, acceptItems[a]);
    }
    delete c.quests[questId];
    if (Game.persist) Game.persist();
    return { ok: true, message: 'Quest canceled. All progress has been reset.' };
  }

  // ---------------- Kill tracking (called from js/core/battle.js onWin) ----------------

  // Increments progress for every ACTIVE kill-step quest matching monsterId. A kill counts once
  // the battle reaches its 'won' phase — INCLUDING cutoff wins (a kill is a kill, phase brief);
  // battle.js calls this unconditionally on 'won'.
  function recordKill(monsterId) {
    var c = Game.state.character;
    if (!c || !c.quests) return;
    var list = Game.Data.quests || [];
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      var quest = list[i];
      var e = c.quests[quest.id];
      if (!e || e.status !== 'active') continue;
      for (var s = 0; s < quest.steps.length; s++) {
        var step = quest.steps[s];
        if (step.kind !== 'kill' || step.monsterId !== monsterId) continue;
        if (!e.progress.kills) e.progress.kills = {};
        var current = e.progress.kills[monsterId] || 0;
        if (current < step.count) {
          e.progress.kills[monsterId] = current + 1;
          changed = true;
        }
      }
    }
    if (changed && Game.persist) Game.persist();
  }

  // ---------------- Visit tracking ----------------

  // Marks areaId as visited for every active visit-step quest. Called from Game.World.travelTo
  // (guarded `if (Game.Quests)` there, same optional-hook style as the battle.js shrine hooks).
  // stepSatisfied() ALSO treats "currently standing in the area" as visited, so a visit step can
  // never be stuck unsatisfied while the player is physically there.
  function recordVisit(areaId) {
    var c = Game.state.character;
    if (!c || !c.quests) return;
    var list = Game.Data.quests || [];
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      var quest = list[i];
      var e = c.quests[quest.id];
      if (!e || e.status !== 'active') continue;
      for (var s = 0; s < quest.steps.length; s++) {
        var step = quest.steps[s];
        if (step.kind !== 'visit' || step.areaId !== areaId) continue;
        if (!e.progress.visited) e.progress.visited = {};
        if (!e.progress.visited[areaId]) {
          e.progress.visited[areaId] = true;
          changed = true;
        }
      }
    }
    if (changed && Game.persist) Game.persist();
  }

  // ---------------- Touch (Standing Stones style, DESIGN.md §7) ----------------

  function touch(questId, tokenIndex) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var quest = getQuest(questId);
    if (!quest) return { ok: false, message: 'Unknown quest.' };
    var e = entry(c, questId);
    if (!e || e.status !== 'active') return { ok: false, message: 'You do not have that quest active.' };

    var touchStep = null;
    for (var s = 0; s < quest.steps.length; s++) {
      if (quest.steps[s].kind === 'touch') touchStep = quest.steps[s];
    }
    if (!touchStep || !touchStep.tokens[tokenIndex]) return { ok: false, message: 'Unknown token.' };

    var token = touchStep.tokens[tokenIndex];
    if (c.currentLocation !== token.areaId) {
      var area = Game.World.getArea(token.areaId);
      return { ok: false, message: 'You must be in ' + (area ? area.name : token.areaId) + ' to touch the ' + token.label + '.' };
    }
    if (!e.progress.touched) e.progress.touched = {};
    if (e.progress.touched[token.areaId]) {
      return { ok: false, message: 'You have already touched the ' + token.label + '.' };
    }
    e.progress.touched[token.areaId] = true;
    if (Game.persist) Game.persist();
    return { ok: true, message: 'You touch the ' + token.label + '. It hums faintly beneath your hand.' };
  }

  // ---------------- Step / turn-in checks ----------------

  // Counts how many of itemId the character currently carries (unequipped inventory only, same
  // convention as js/core/world.js synthesis input checks).
  function inventoryCount(c, itemId) {
    var count = 0;
    for (var i = 0; i < c.inventory.length; i++) {
      if (c.inventory[i] === itemId) count += 1;
    }
    return count;
  }

  function stepSatisfied(c, e, step) {
    if (step.kind === 'kill') {
      var kills = (e.progress.kills && e.progress.kills[step.monsterId]) || 0;
      return kills >= step.count;
    }
    if (step.kind === 'collect') {
      // Checked live against the inventory at turn-in time (DESIGN.md §7 / phase brief);
      // items are only consumed when the quest actually completes.
      return inventoryCount(c, step.itemId) >= step.count;
    }
    if (step.kind === 'visit') {
      return !!(e.progress.visited && e.progress.visited[step.areaId]) || c.currentLocation === step.areaId;
    }
    if (step.kind === 'touch') {
      for (var i = 0; i < step.tokens.length; i++) {
        if (!e.progress.touched || !e.progress.touched[step.tokens[i].areaId]) return false;
      }
      return true;
    }
    return false;
  }

  function canTurnIn(questId) {
    var c = Game.state.character;
    if (!c) return false;
    var quest = getQuest(questId);
    if (!quest) return false;
    var e = entry(c, questId);
    if (!e || e.status !== 'active') return false;
    for (var s = 0; s < quest.steps.length; s++) {
      if (!stepSatisfied(c, e, quest.steps[s])) return false;
    }
    return true;
  }

  // Human-readable per-step progress line(s), used by the Journal Active tab
  // (e.g. "Oruk Ravager slain: 2/5", touched-stones checklist).
  function stepProgressText(c, e, step) {
    if (step.kind === 'kill') {
      var m = Game.Battle.getMonsterDef(step.monsterId);
      var kills = Math.min((e.progress.kills && e.progress.kills[step.monsterId]) || 0, step.count);
      return (m ? m.name : step.monsterId) + (step.count > 1 ? 's' : '') + ' slain: ' + kills + '/' + step.count;
    }
    if (step.kind === 'collect') {
      var item = Game.Inventory.getItem(step.itemId);
      var have = Math.min(inventoryCount(c, step.itemId), step.count);
      return (item ? item.name : step.itemId) + ' carried: ' + have + '/' + step.count;
    }
    if (step.kind === 'visit') {
      var area = Game.World.getArea(step.areaId);
      var done = stepSatisfied(c, e, step);
      return 'Visit ' + (area ? area.name : step.areaId) + ': ' + (done ? 'done' : 'not yet');
    }
    if (step.kind === 'touch') {
      return step.tokens.map(function (token) {
        var touched = !!(e.progress.touched && e.progress.touched[token.areaId]);
        var area = Game.World.getArea(token.areaId);
        return (touched ? '[x] ' : '[ ] ') + token.label + ' (' + (area ? area.name : token.areaId) + ')';
      }).join('\n');
    }
    return '';
  }

  // ---------------- Turn in ----------------

  // Grants ALL reward types from the multi-reward model (archived: Recent_Updates.md 2007-07-18
  // "Quest reward system revamped to allow multiple rewards and other types of rewards").
  // Item rewards that don't fit in the backpack are NOT lost: if ANY reward item can't be
  // carried, the whole turn-in is refused up front (quest stays active and turn-in-able) and the
  // player is told to make room — mirroring the pre-check style of world.js synthesize().
  function rewardItemsFit(c, rewards) {
    var items = (rewards && rewards.items) || [];
    if (!items.length) return { ok: true, blocked: [] };
    var weight = Game.Inventory.currentWeight(c);
    var capacity = Game.Inventory.carryCapacity(c);
    var blocked = [];
    for (var i = 0; i < items.length; i++) {
      var item = Game.Inventory.getItem(items[i]);
      var w = item ? item.weight : 0;
      if (weight + w > capacity) {
        blocked.push(item ? item.name : items[i]);
      } else {
        weight += w;
      }
    }
    return { ok: blocked.length === 0, blocked: blocked };
  }

  // `choice` is required only for quests whose rewards carry `classChoice` — either a fixed array
  // of valid class ids (e.g. first_calling: ['warrior','magician','thief'], DESIGN.md §3;
  // vaultbreakers_reckoning: ['vaultbreaker']) or a sentinel string: 'advanced' (trials_of_eldor /
  // "Trials of Ascension"), resolved via Game.Classes.advancedOptionsFor(c) into the 2 advanced
  // options matching whichever base class the hero obtained, or 'tier3' (masters_calling / "The
  // Master's Calling", NEW v1.2 Phase 2), resolved via Game.Classes.thirdTierOptionsFor(c) into
  // the single tier-3 option matching whichever base class the hero obtained — so a warrior-base
  // hero offering 'wizard' or 'magus' (magician-branch classes) is rejected by the same indexOf
  // check used for the fixed-array case below. The chosen class is obtained via
  // Game.Classes.obtainClass — permanent, no re-choice, since the quest immediately flips to
  // 'completed' same as any other turn-in.
  function turnIn(questId, choice) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var quest = getQuest(questId);
    if (!quest) return { ok: false, message: 'Unknown quest.' };
    var e = entry(c, questId);
    if (!e || e.status !== 'active') return { ok: false, message: 'You do not have that quest active.' };

    if (c.currentLocation !== quest.giver.areaId) {
      var giverArea = Game.World.getArea(quest.giver.areaId);
      return { ok: false, message: 'Return to ' + quest.giver.npc + ' in ' + (giverArea ? giverArea.name : quest.giver.areaId) + ' to turn in this quest.' };
    }
    // Level band re-checked at turn-in (archived: Oruk band enforced at completion —
    // Recent_Updates.md 2007-04-06 "can only be COMPLETED by heroes greater than level 5 but
    // less than 10").
    var lvl = levelCheck(c, quest);
    if (!lvl.ok) return { ok: false, message: lvl.reason };

    if (!canTurnIn(questId)) {
      return { ok: false, message: 'You have not yet completed this quest\'s requirements.' };
    }

    var classChoices = (quest.rewards && quest.rewards.classChoice) || null;
    if (classChoices === 'advanced') {
      // NEW sentinel (trials_of_eldor): resolve to the 2 advanced options matching the hero's
      // obtained base class(es). requiresBaseClass at accept() means this should never be empty
      // in normal play, but guard anyway rather than let indexOf(-1) produce a confusing message.
      classChoices = Game.Classes ? Game.Classes.advancedOptionsFor(c) : [];
      if (!classChoices.length) {
        return { ok: false, message: 'You have no base class to advance yet.' };
      }
    } else if (classChoices === 'tier3') {
      // NEW sentinel (v1.2 Phase 2, masters_calling): resolve to the single tier-3 option
      // matching the hero's obtained base class(es) — requiresAdvancedClass at accept() means
      // this should never be empty in normal play, but guard anyway (mirrors 'advanced' above).
      classChoices = Game.Classes ? Game.Classes.thirdTierOptionsFor(c) : [];
      if (!classChoices.length) {
        return { ok: false, message: 'You have no advanced calling to converge yet.' };
      }
    }
    if (classChoices && classChoices.indexOf(choice) === -1) {
      return { ok: false, message: 'Choose one of: ' + classChoices.join(', ') + '.' };
    }

    // Pre-check reward-item capacity ACCOUNTING for the weight freed by consumed collect items —
    // consume nothing and grant nothing if the rewards won't fit, so no reward is ever lost and
    // the quest remains turn-in-able after the player frees up space.
    var freedWeight = 0;
    var s, step;
    for (s = 0; s < quest.steps.length; s++) {
      step = quest.steps[s];
      if (step.kind !== 'collect') continue;
      var collectItem = Game.Inventory.getItem(step.itemId);
      if (collectItem) freedWeight += collectItem.weight * step.count;
    }
    var rewardItems = (quest.rewards && quest.rewards.items) || [];
    if (rewardItems.length) {
      var weight = Game.Inventory.currentWeight(c) - freedWeight;
      var capacity = Game.Inventory.carryCapacity(c);
      var blocked = [];
      for (var r = 0; r < rewardItems.length; r++) {
        var rewardItem = Game.Inventory.getItem(rewardItems[r]);
        var w = rewardItem ? rewardItem.weight : 0;
        if (weight + w > capacity) {
          blocked.push(rewardItem ? rewardItem.name : rewardItems[r]);
        } else {
          weight += w;
        }
      }
      if (blocked.length) {
        return {
          ok: false,
          message: 'You cannot carry your reward (' + blocked.join(', ') + ') — too much weight. ' +
            'Free up space and turn the quest in again; nothing has been lost.'
        };
      }
    }

    // Consume collect-step items (exactly the required count — surplus copies stay with the
    // player). Nothing was consumed before this point, so failed turn-ins above cost nothing.
    for (s = 0; s < quest.steps.length; s++) {
      step = quest.steps[s];
      if (step.kind !== 'collect') continue;
      for (var k = 0; k < step.count; k++) {
        Game.Inventory.discard(c, step.itemId);
      }
    }

    // Multi-reward grant (archived model): gold + xp + items + Training Points, all together.
    var rewards = quest.rewards || {};
    var parts = [];
    if (rewards.gold) {
      Game.Character.addGold(c, rewards.gold);
      parts.push(rewards.gold + ' gold');
    }
    if (rewards.xp) {
      Game.Character.addXp(c, rewards.xp);
      parts.push(rewards.xp + ' XP');
    }
    if (rewards.trainingPoints) {
      // archived: Training_Points.md — "by completing certain quests, from which you may
      // receive a certain amount of Training Points".
      c.trainingPoints += rewards.trainingPoints;
      parts.push(rewards.trainingPoints + ' Training Point' + (rewards.trainingPoints > 1 ? 's' : ''));
    }
    for (var ri = 0; ri < rewardItems.length; ri++) {
      Game.Inventory.addItem(c, rewardItems[ri]); // fit pre-verified above
      var granted = Game.Inventory.getItem(rewardItems[ri]);
      parts.push(granted ? granted.name : rewardItems[ri]);
    }
    // Phase 6a: classChoice reward — obtain exactly the chosen class (validated above).
    if (classChoices && Game.Classes) {
      Game.Classes.obtainClass(c, choice);
      var classDef = Game.Classes.getClass(choice);
      parts.push('Class: ' + (classDef ? classDef.name : choice));
    }

    e.status = 'completed';
    // Progress is retained on the completed entry (harmless, useful for debugging); only
    // status is consulted from here on.

    // NEW (v1.4 P1, G5 quest chains, docs/SPEC-V1.4-GAMEPLAY.md §2): follow-ups. Any quest whose
    // requiresQuest names the quest JUST completed, given by an NPC in the area the hero is
    // standing in right now (turn-in already requires c.currentLocation === quest.giver.areaId,
    // checked above), surfaces immediately so hand-in flows straight into the next chapter. NOT
    // filtered by cap/level here — per the phase brief, a follow-up is never silently lost; if the
    // hero is at the cap or under-leveled it still shows (greyed, with reason) via the very next
    // availableAt() call, which is what the Tavern UI renders from.
    var followUps = [];
    var allQuests = Game.Data.quests || [];
    for (var fu = 0; fu < allQuests.length; fu++) {
      var candidate = allQuests[fu];
      if (candidate.requiresQuest === questId && candidate.giver.areaId === c.currentLocation) {
        followUps.push(candidate.id);
      }
    }

    if (Game.persist) Game.persist();
    return {
      ok: true,
      message: 'Quest complete: ' + quest.name + '.' + (parts.length ? ' Rewards: ' + parts.join(', ') + '.' : ''),
      followUps: followUps
    };
  }

  return {
    getQuest: getQuest,
    entry: entry,
    availableAt: availableAt,
    levelCheck: levelCheck,
    activeQuestCount: activeQuestCount,
    accept: accept,
    cancel: cancel,
    recordKill: recordKill,
    recordVisit: recordVisit,
    touch: touch,
    canTurnIn: canTurnIn,
    stepSatisfied: stepSatisfied,
    stepProgressText: stepProgressText,
    turnIn: turnIn,
    inventoryCount: inventoryCount,
    rewardItemsFit: rewardItemsFit
  };
})();

window.Game = Game;
