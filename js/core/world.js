// HeroRPG remake — world: travel, camping, town facilities (DESIGN.md §2 world/locations,
// §6 economy & towns; New_Player_Guide.md §5.1-5.4 Traveling/Hunting/Battling/Healing).
// Pure state-mutation module (no DOM access), mirroring the PLAN.md architecture rule for
// js/core/battle.js.

var Game = window.Game || {};

Game.World = (function () {

  function getArea(areaId) {
    var list = Game.Data.areas || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === areaId) return list[i];
    }
    return null;
  }

  function currentArea() {
    var c = Game.state.character;
    if (!c) return null;
    return getArea(c.currentLocation);
  }

  function getFacility(area, type) {
    if (!area || !area.facilities) return null;
    for (var i = 0; i < area.facilities.length; i++) {
      if (area.facilities[i].type === type) return area.facilities[i];
    }
    return null;
  }

  // Shared with js/core/battle.js: routes through Game.Battle._rng() (default Math.random) so
  // tests can stub the same single rng surface instead of adding a second one. Both hunt() and
  // camp()'s risk roll (below) go through this one function — deliberately NOT a second
  // Game.World._rng property, so there is exactly one stub point for tests to override.
  function rng() {
    return Game.Battle._rng();
  }

  // Shared by hunt() and camp()'s ambush mishap: the area's regular (non-boss) monster pool.
  // Bosses never come from either random source — they stay explicit Lair fights (area.lair).
  function nonBossPool(area) {
    return (area.monsters || []).filter(function (monsterId) {
      var def = Game.Battle.getMonsterDef(monsterId);
      return def && !def.boss;
    });
  }

  // ---------------- Hunt: random encounter (Phase 8; replaces the old per-monster pick list)
  // ---------------- ----------------
  // archived: New_Player_Guide.md "Hunting" — "Click the 'Hunt' link under the Actions panel.
  // This will bring up a list of monsters that you may fight" describes the ORIGINAL UI; the
  // encounter-chance mechanic itself is archived separately (reference/forum/t-755.md, Nerevar:
  // "the chance of finding a monster has been increased to 95%"). Bosses are never in the random
  // table — they stay explicit "Lair" fights (area.lair, gated by their own minLevel).
  function hunt() {
    var c = Game.state.character;
    if (!c) return { ok: false, encounter: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, encounter: false, message: 'You cannot hunt during a battle.' };
    var area = currentArea();
    if (!area || area.type !== 'hunting') {
      return { ok: false, encounter: false, message: 'There is nothing to hunt here.' };
    }
    if (rng() >= BALANCE.HUNT_ENCOUNTER_CHANCE) {
      return { ok: true, encounter: false, message: 'You find nothing.' };
    }
    var pool = nonBossPool(area);
    if (pool.length === 0) {
      return { ok: true, encounter: false, message: 'You find nothing.' };
    }
    var pick = pool[Math.floor(rng() * pool.length)];
    // Enemy-variety pass: Champion encounters (invented; flavor-credited to the archived
    // "Champion Bosses" forum-thread title, reference/site/homepage_2006.md — see balance.js
    // CHAMPION_* comment). Rolled here ONLY: never for Lair/boss fights (those call
    // Game.Battle.start directly with no options, elsewhere), never from debug.js fight().
    var champion = rng() < BALANCE.CHAMPION_CHANCE;
    var battle = Game.Battle.start(pick, champion ? { champion: true } : null);
    if (!battle) return { ok: false, encounter: false, message: 'Something stirs, then vanishes.' };
    return { ok: true, encounter: true, monsterId: pick, champion: champion, battle: battle };
  }

  // ---------------- Travel (New_Player_Guide.md §5.1 "Traveling") ----------------

  // archived: Level.md "All areas have minimum level requirements."
  function travelTo(areaId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot travel during a battle.' };
    var area = getArea(areaId);
    if (!area) return { ok: false, message: 'Unknown location.' };
    // v1.3.1 fix 4 [invented]: a character's own home town is always reachable, regardless of its
    // minLevel gate — no archived record of this exemption survives, but without it an Arkan
    // character (home: Saratus, js/core/character.js create(); Saratus gated at minLevel 14,
    // js/data/areas.js) cannot accept or turn in their own L1/L6/L8 racial quests at their own
    // starting town until level 14. Game.Character.homeTownId(c) re-derives the home town from
    // race every call — NOT a new persisted field.
    var isHomeTown = Game.Character && Game.Character.homeTownId && Game.Character.homeTownId(c) === areaId;
    if (!isHomeTown && c.level < area.minLevel) {
      return { ok: false, message: 'Requires Level ' + area.minLevel + ' (you are Level ' + c.level + ').' };
    }
    c.currentLocation = areaId;
    // Phase 5: mark visit-step progress on active quests (guarded — same optional-hook style
    // as the Game.World shrine hooks in battle.js).
    if (Game.Quests) Game.Quests.recordVisit(areaId);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'You travel to ' + area.name + '.' };
  }

  // ---------------- Camp (New_Player_Guide.md §5.4 "Healing") ----------------

  // Best tent's tentQuality restores that fraction of max HP AND Energy (fraction+Energy
  // inclusion invented; New_Player_Guide.md only documents HP restore scaled by tent quality:
  // "restore your HP by a percentage depending on whether you have a tent... Better tents
  // restore more HP"). Hunting areas only — "you cannot camp" mid-battle, and camping is
  // presented under the Hunt link in town-less wilderness (archived layout).
  function bestTentQuality(c) {
    var best = BALANCE.CAMP_HEAL_NO_TENT;
    for (var i = 0; i < c.inventory.length; i++) {
      var item = Game.Inventory.getItem(c.inventory[i]);
      if (item && item.tags && item.tags.indexOf('tent') !== -1 && item.tentQuality > best) {
        best = item.tentQuality;
      }
    }
    return best;
  }

  // Camping risk (user-directed feature; makes Inn vs Camp a real decision — camp is free but
  // risky, Inn stays the safe/complete option). archived: reference/forum/t-756.md — a player
  // complained "those damn thieves keep taking all my damn gold whenever I try to rest [camping]
  // ... I have only ever had enough GP to sleep in the inn like one time"; developer Nerevar's
  // reply: "you should use the vault to prevent your gold from being stolen while camping." That
  // exchange is the authority for the mechanic below; BALANCE.CAMP_* rates are invented.
  function camp() {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot camp during a battle.' };
    var area = currentArea();
    if (!area || area.type !== 'hunting') {
      return { ok: false, message: 'You can only camp in a hunting area.' };
    }

    // (a) Heal/energy restore applies FIRST — you did sleep some, even if the night goes wrong
    // afterward.
    var quality = bestTentQuality(c);
    var hpGain = Math.round(c.hitPointsMax * quality);
    var energyGain = Math.round(c.energyMax * quality * BALANCE.CAMP_ENERGY_FRACTION_OF_HEAL);
    // Feature B (user-directed): camp recovery is HEALING (unlike the Inn, which is rest) and is
    // therefore halved while Haunted, consistent with the potion/tech halving in js/core/battle.js
    // useItem/useTech. Energy restore is untouched — Haunting only ever affects HP healing (spec:
    // "ALL magical/consumable healing HALVED").
    if (hpGain > 0 && Game.Character && Game.Character.hasAffliction && Game.Character.hasAffliction(c, 'haunting')) {
      hpGain = Math.max(1, Math.round(hpGain * BALANCE.HAUNTING_HEAL_MULT));
    }
    c.hitPoints = Math.min(c.hitPointsMax, c.hitPoints + hpGain);
    c.energy = Math.min(c.energyMax, c.energy + energyGain);
    var message = 'You make camp and recover ' + hpGain + ' HP and ' + energyGain + ' Energy.';

    // (b) Roll the risk event AFTER healing, through the single shared rng() stub point (the
    // same Game.Battle._rng() surface hunt() already routes through — see rng()'s comment above).
    if (rng() >= BALANCE.CAMP_EVENT_CHANCE) {
      if (Game.persist) Game.persist();
      return { ok: true, message: message, event: 'none' };
    }

    // (c) An event strikes: robbery (CAMP_ROBBERY_WEIGHT of events) or ambush (the remainder) —
    // invented split, the risk itself is archived (t-756.md above).
    var robbery = rng() < BALANCE.CAMP_ROBBERY_WEIGHT;
    var carried = Game.Character.goldTotalAsGold(c);
    var foundNothing = false;
    if (robbery && carried <= 0) {
      // Carrying 0 gold: thieves find nothing to steal — escalate straight to an ambush instead
      // (invented flavor, per the phase brief).
      robbery = false;
      foundNothing = true;
    }

    if (robbery) {
      var stolen = Math.ceil(carried * BALANCE.CAMP_ROBBERY_GOLD_FRACTION);
      spendGold(c, stolen); // carried gold only (platinum+gold) — vault is untouched, per Nerevar's advice
      message += ' Thieves creep into your camp and make off with ' + stolen + ' gold! ' +
        '(Your Vault gold stays safe from camp robberies — archived advice, forum t-756.md.)';
      if (Game.persist) Game.persist();
      return { ok: true, message: message, event: 'robbery', stolen: stolen };
    }

    // (d) Ambush: reuse hunt()'s non-boss pool logic; no champion roll (invented: ambushers
    // caught you sleeping — ordinary monsters, not the rarer Champion encounter).
    var pool = nonBossPool(area);
    if (pool.length === 0) {
      // Nothing to ambush with — degrade gracefully to a no-event camp.
      if (foundNothing) message += ' Thieves creep into your camp but find your pockets empty.';
      if (Game.persist) Game.persist();
      return { ok: true, message: message, event: 'none' };
    }
    var pick = pool[Math.floor(rng() * pool.length)];
    var monsterDef = Game.Battle.getMonsterDef(pick);
    message += foundNothing
      ? ' Thieves creep into your camp but find your pockets empty — before you can rest easy, a ' + (monsterDef ? monsterDef.name : 'monster') + ' catches your scent!'
      : ' You are ambushed in your sleep!';
    var battle = Game.Battle.start(pick, { ambush: true });
    if (Game.persist) Game.persist();
    return { ok: true, message: message, event: 'ambush', monsterId: pick, battle: battle };
  }

  // ---------------- Inn (New_Player_Guide.md §5.4 "Healing" — "pay to stay at an inn") ----------------

  function innFee(c) {
    return BALANCE.INN_FEE_BASE + BALANCE.INN_FEE_PER_LEVEL * c.level; // invented
  }

  function innRest() {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot rest during a battle.' };
    var area = currentArea();
    var inn = getFacility(area, 'inn');
    if (!inn) return { ok: false, message: 'There is no Inn here.' };
    var fee = innFee(c);
    if (Game.Character.goldTotalAsGold(c) < fee) {
      return { ok: false, message: 'You cannot afford the Inn (' + fee + ' gold).' };
    }
    spendGold(c, fee);
    c.hitPoints = c.hitPointsMax;
    c.energy = c.energyMax;
    // DESIGN.md §4 adapted rule: fury resets daily in the original multiplayer game; in this
    // single-player remake it resets on death/flee (Phase 3) and, additionally, on Inn rest —
    // the closest single-player analogue to "a new day" (invented adaptation).
    c.fury = 0;
    if (Game.persist) Game.persist();
    return { ok: true, message: 'You rest at the Inn for ' + fee + ' gold. HP, Energy, and Fury are restored.' };
  }

  // ---------------- Gold helpers (spend, mirrors Character.addGold) ----------------

  function spendGold(c, amountGold) {
    var total = Game.Character.goldTotalAsGold(c) - amountGold;
    if (total < 0) return false;
    c.platinum = Math.floor(total / BALANCE.GOLD_PER_PLATINUM);
    c.gold = total % BALANCE.GOLD_PER_PLATINUM;
    return true;
  }

  // ---------------- Shop (New_Player_Guide.md via DESIGN.md §6; per-town stock in areas.js) ----------------

  function shopStock(area) {
    var shop = getFacility(area, 'shop');
    return shop ? shop.stock : [];
  }

  function buy(itemId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot shop during a battle.' };
    var area = currentArea();
    var stock = shopStock(area);
    if (!area || stock.indexOf(itemId) === -1) return { ok: false, message: 'That item is not sold here.' };
    var item = Game.Inventory.getItem(itemId);
    if (!item) return { ok: false, message: 'Unknown item.' };
    if (Game.Character.goldTotalAsGold(c) < item.value) {
      return { ok: false, message: 'You cannot afford ' + item.name + ' (' + item.value + ' gold).' };
    }
    // Add the item first so a failed addItem (over capacity) never charges the player.
    var added = Game.Inventory.addItem(c, itemId);
    if (!added) {
      return { ok: false, message: 'You cannot carry ' + item.name + ' — too much weight.' };
    }
    spendGold(c, item.value);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'You bought ' + item.name + ' for ' + item.value + ' gold.' };
  }

  // ---------------- AA Exchange (v1.4 P2, G1 — docs/SPEC-V1.4-GAMEPLAY.md §3) ----------------
  // [archived] the "AA list" (reference/site/homepage_2006.md "Added 20+ items to the AA list for
  // all price ranges"); a per-town 'exchange' facility whose stock is priced in Advantage Points
  // (character.ap) instead of gold — mirrors buy() above (same "add item first, so a failed
  // addItem never charges the player" ordering, same battle/facility/afford gates), spending AP
  // instead of gold and reading stock as { itemId, costAp } pairs instead of a plain id list.
  function exchangeStock(area) {
    var exchange = getFacility(area, 'exchange');
    return exchange ? exchange.stock : [];
  }

  function buyAp(itemId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot shop during a battle.' };
    var area = currentArea();
    var stock = exchangeStock(area);
    var entry = null;
    for (var i = 0; i < stock.length; i++) {
      if (stock[i].itemId === itemId) { entry = stock[i]; break; }
    }
    if (!area || !entry) return { ok: false, message: 'That item is not sold here.' };
    var item = Game.Inventory.getItem(itemId);
    if (!item) return { ok: false, message: 'Unknown item.' };
    if ((c.ap || 0) < entry.costAp) {
      return { ok: false, message: 'You cannot afford ' + item.name + ' (' + entry.costAp + ' Advantage Points).' };
    }
    // Add the item first so a failed addItem (over capacity) never spends AP.
    var added = Game.Inventory.addItem(c, itemId);
    if (!added) {
      return { ok: false, message: 'You cannot carry ' + item.name + ' — too much weight.' };
    }
    c.ap -= entry.costAp;
    if (Game.persist) Game.persist();
    return { ok: true, message: 'You bought ' + item.name + ' for ' + entry.costAp + ' Advantage Points.' };
  }

  function sellValue(item) {
    return Math.floor(item.value * BALANCE.SHOP_SELL_RATE); // invented rate
  }

  // Inventory only — equipped items cannot be sold directly (unequip first).
  function sell(itemId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot shop during a battle.' };
    if (c.inventory.indexOf(itemId) === -1) {
      return { ok: false, message: 'You do not have that item (or it is equipped).' };
    }
    var item = Game.Inventory.getItem(itemId);
    if (!item) return { ok: false, message: 'Unknown item.' };
    var payout = sellValue(item);
    Game.Inventory.removeFromInventory(c, itemId);
    Game.Character.addGold(c, payout);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'You sold ' + item.name + ' for ' + payout + ' gold.' };
  }

  // ---------------- Vault (Recent_Updates.md 2007-08-01; account-wide safe storage, no fees) ----------------

  // v1.3.1 fix 8: the four vault ops below were missing BOTH gates every sibling town-facility op
  // already has — a Game.state.battle check (like buy/sell/innRest/camp/travelTo) and a facility
  // presence check (like learnTech/buyBuff gate on 'academy'/'shrine'). Mirroring those exactly
  // (same error-message style) so the Vault behaves like every other facility.
  function depositGold(amountGold) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot use the Vault during a battle.' };
    var area = currentArea();
    if (!getFacility(area, 'vault')) return { ok: false, message: 'There is no Vault here.' };
    if (amountGold <= 0) return { ok: false, message: 'Enter a positive amount.' };
    if (Game.Character.goldTotalAsGold(c) < amountGold) {
      return { ok: false, message: 'You do not have that much gold.' };
    }
    spendGold(c, amountGold);
    vaultAddGold(c, amountGold);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'Deposited ' + amountGold + ' gold into the Vault.' };
  }

  function withdrawGold(amountGold) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot use the Vault during a battle.' };
    var area = currentArea();
    if (!getFacility(area, 'vault')) return { ok: false, message: 'There is no Vault here.' };
    if (amountGold <= 0) return { ok: false, message: 'Enter a positive amount.' };
    var vaultTotal = c.vault.platinum * BALANCE.GOLD_PER_PLATINUM + c.vault.gold;
    if (vaultTotal < amountGold) return { ok: false, message: 'The Vault does not hold that much gold.' };
    vaultSpendGold(c, amountGold);
    Game.Character.addGold(c, amountGold);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'Withdrew ' + amountGold + ' gold from the Vault.' };
  }

  function vaultAddGold(c, amount) {
    c.vault.gold += amount;
    while (c.vault.gold >= BALANCE.GOLD_PER_PLATINUM) {
      c.vault.gold -= BALANCE.GOLD_PER_PLATINUM;
      c.vault.platinum += 1;
    }
  }

  function vaultSpendGold(c, amount) {
    var total = c.vault.platinum * BALANCE.GOLD_PER_PLATINUM + c.vault.gold - amount;
    c.vault.platinum = Math.floor(total / BALANCE.GOLD_PER_PLATINUM);
    c.vault.gold = total % BALANCE.GOLD_PER_PLATINUM;
  }

  // Vault items are weightless storage (archived: "store items and gold (safely)") — they never
  // count toward Game.Inventory.currentWeight, since they live in c.vault.items, not c.inventory.
  // Cursed-equipped items can't be deposited: they live in c.equipment, not c.inventory, until
  // the Shrine's uncurse() moves them back — so the inventory-membership check below already
  // excludes them without any special-casing.
  function depositItem(itemId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot use the Vault during a battle.' };
    var area = currentArea();
    if (!getFacility(area, 'vault')) return { ok: false, message: 'There is no Vault here.' };
    if (c.inventory.indexOf(itemId) === -1) {
      return { ok: false, message: 'You do not have that item (or it is equipped).' };
    }
    var item = Game.Inventory.getItem(itemId);
    Game.Inventory.discard(c, itemId); // removes exactly one copy from c.inventory
    c.vault.items.push(itemId);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'Deposited ' + (item ? item.name : itemId) + ' into the Vault.' };
  }

  function withdrawItem(itemId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    if (Game.state.battle) return { ok: false, message: 'You cannot use the Vault during a battle.' };
    var area = currentArea();
    if (!getFacility(area, 'vault')) return { ok: false, message: 'There is no Vault here.' };
    var idx = c.vault.items.indexOf(itemId);
    if (idx === -1) return { ok: false, message: 'That item is not in your Vault.' };
    var item = Game.Inventory.getItem(itemId);
    var weight = item ? item.weight : 0;
    if (Game.Inventory.currentWeight(c) + weight > Game.Inventory.carryCapacity(c)) {
      return { ok: false, message: 'You cannot carry ' + (item ? item.name : itemId) + ' — too much weight.' };
    }
    c.vault.items.splice(idx, 1);
    c.inventory.push(itemId);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'Withdrew ' + (item ? item.name : itemId) + ' from the Vault.' };
  }

  // ---------------- Academy (Techniques.md, Techs.md; homepage_2007.md chain-gating model) ----------------

  function learnableTechs() {
    // Phase 6a: classOnly techs (js/data/techs.js) are bought with Class Levels in the Academy's
    // Class Abilities section (js/core/classes.js buyAbility), NOT with Training Points here.
    return (Game.Data.techs || []).filter(function (t) { return !t.monsterOnly && !t.classOnly; });
  }

  // Chain gating (invented model, per homepage_2007.md news: "per-spell chains... gated by
  // governing skill level, learned at a trainer"): rank>1 requires the previous rank in the same
  // chain already known, AND the governing skill at or above tech.skillReq.
  function previousRankId(tech) {
    if (tech.rank <= 1) return null;
    var list = Game.Data.techs || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].chain === tech.chain && list[i].rank === tech.rank - 1) return list[i].id;
    }
    return null;
  }

  function canLearn(c, tech) {
    var failures = [];
    if (c.techs.indexOf(tech.id) !== -1) {
      failures.push('Already known.');
      return { ok: false, failures: failures };
    }
    if (tech.rank > 1) {
      var prevId = previousRankId(tech);
      if (!prevId || c.techs.indexOf(prevId) === -1) {
        failures.push('Requires ' + tech.chain + ' rank ' + (tech.rank - 1) + ' to be known first.');
      }
    }
    var skLevel = (tech.skill && c.skills[tech.skill]) ? c.skills[tech.skill].level : 0;
    if (tech.skillReq && skLevel < tech.skillReq) {
      failures.push('Requires ' + tech.skill + ' ' + tech.skillReq + ' (you have ' + skLevel + ').');
    }
    if (c.trainingPoints < tech.trainingCost) {
      failures.push('Requires ' + tech.trainingCost + ' Training Points (you have ' + c.trainingPoints + ').');
    }
    return { ok: failures.length === 0, failures: failures };
  }

  function learnTech(techId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var area = currentArea();
    if (!getFacility(area, 'academy')) return { ok: false, message: 'There is no Academy here.' };
    var tech = null;
    var list = Game.Data.techs || [];
    for (var i = 0; i < list.length; i++) { if (list[i].id === techId) tech = list[i]; }
    // v1.3.1 fix 1: classOnly techs (js/data/techs.js) have no trainingCost field, so the
    // `c.trainingPoints < tech.trainingCost` check in canLearn() above (`x < undefined` is always
    // false) passed vacuously and c.trainingPoints -= undefined below corrupted it to NaN.
    // learnableTechs() already excludes classOnly techs (js/core/world.js above) — this rejection
    // must match it exactly so the Academy's Training-Points path can never reach a classOnly tech
    // (those are bought with Class Levels instead, via Game.Classes.buyAbility).
    if (!tech || tech.monsterOnly || tech.classOnly) return { ok: false, message: 'Unknown technique.' };
    var check = canLearn(c, tech);
    if (!check.ok) return { ok: false, message: check.failures.join(' ') };
    c.trainingPoints -= tech.trainingCost;
    c.techs.push(techId);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'Learned ' + tech.name + '.' };
  }

  // ---------------- Spirit Shrine (Eldor only; Anima_Shards.md, Cursed.md) ----------------

  function buyBuff(buffId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var area = currentArea();
    if (!getFacility(area, 'shrine')) return { ok: false, message: 'There is no Spirit Shrine here.' };
    var buff = null;
    var list = Game.Data.shrine || [];
    for (var i = 0; i < list.length; i++) { if (list[i].id === buffId) buff = list[i]; }
    if (!buff) return { ok: false, message: 'Unknown buff.' };
    if (c.animaShards < buff.shardCost) {
      return { ok: false, message: 'You need ' + buff.shardCost + ' Anima Shards (you have ' + c.animaShards + ').' };
    }
    c.animaShards -= buff.shardCost;
    // Refresh duration if already active, otherwise add a new entry (invented: no stacking of
    // the same buff — Anima_Shards.md does not specify, so the simpler behavior is chosen).
    var existing = null;
    for (var j = 0; j < c.shrineBuffs.length; j++) {
      if (c.shrineBuffs[j].id === buffId) existing = c.shrineBuffs[j];
    }
    if (existing) {
      existing.battlesLeft = buff.battles;
    } else {
      c.shrineBuffs.push({ id: buffId, battlesLeft: buff.battles });
    }
    if (Game.persist) Game.persist();
    return { ok: true, message: 'You are blessed with ' + buff.name + ' for ' + buff.battles + ' battles.' };
  }

  // Feature B (user-directed): Spirit Shrine service that cures the Haunting affliction (see
  // balance.js HAUNTING_* comment / js/core/character.js addAffliction/removeAffliction). Fee
  // mirrors innFee's base+per-level shape. Only meaningful while haunted — the UI (js/ui/screens.js
  // renderShrinePanel) only offers this panel while Game.Character.hasAffliction(c,'haunting').
  function cleanseHauntingFee(c) {
    return BALANCE.HAUNTING_CLEANSE_FEE_BASE + BALANCE.HAUNTING_CLEANSE_FEE_PER_LEVEL * c.level; // invented (user-directed)
  }

  function cleanseHaunting() {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var area = currentArea();
    if (!getFacility(area, 'shrine')) return { ok: false, message: 'There is no Spirit Shrine here.' };
    if (!Game.Character || !Game.Character.hasAffliction || !Game.Character.hasAffliction(c, 'haunting')) {
      return { ok: false, message: 'You are not Haunted.' };
    }
    var fee = cleanseHauntingFee(c);
    if (Game.Character.goldTotalAsGold(c) < fee) {
      return { ok: false, message: 'The Shrine requires ' + fee + ' gold to cleanse the Haunting.' };
    }
    spendGold(c, fee);
    Game.Character.removeAffliction(c, 'haunting');
    if (Game.persist) Game.persist();
    return { ok: true, message: 'The Shrine cleanses the Haunting from you for ' + fee + ' gold.' };
  }

  // archived: Cursed.md "at the cost of a fee depending on the value of the items being removed."
  function uncurse(slot) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var area = currentArea();
    if (!getFacility(area, 'shrine')) return { ok: false, message: 'There is no Spirit Shrine here.' };
    var itemId = c.equipment[slot];
    if (!itemId) return { ok: false, message: 'Nothing is equipped there.' };
    var item = Game.Inventory.getItem(itemId);
    if (!item || !item.tags || item.tags.indexOf('cursed') === -1) {
      return { ok: false, message: 'That item is not cursed.' };
    }
    var fee = item.value;
    if (Game.Character.goldTotalAsGold(c) < fee) {
      return { ok: false, message: 'The Shrine requires ' + fee + ' gold to lift this curse.' };
    }
    spendGold(c, fee);
    c.equipment[slot] = null;
    c.inventory.push(itemId);
    Game.Inventory.refreshWeaponBonus(c);
    Game.Character.recalcDerived(c);
    if (Game.persist) Game.persist();
    return { ok: true, message: 'The Shrine lifts the curse from ' + item.name + ' for ' + fee + ' gold.' };
  }

  // ---------------- Synthesis (Eldor only; Synthesis_Shop.md) ----------------

  function getRecipe(recipeId) {
    var list = Game.Data.recipes || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === recipeId) return list[i];
    }
    return null;
  }

  // Counts how many of each required input id the character has available in c.inventory
  // (unequipped only) so multi-copy recipes (e.g. 2x same dagger) are checked correctly.
  function missingInputs(c, recipe) {
    var have = {};
    for (var i = 0; i < c.inventory.length; i++) {
      have[c.inventory[i]] = (have[c.inventory[i]] || 0) + 1;
    }
    var need = {};
    for (var j = 0; j < recipe.inputs.length; j++) {
      need[recipe.inputs[j]] = (need[recipe.inputs[j]] || 0) + 1;
    }
    var missing = [];
    for (var id in need) {
      if (!Object.prototype.hasOwnProperty.call(need, id)) continue;
      var shortfall = need[id] - (have[id] || 0);
      if (shortfall > 0) missing.push({ itemId: id, shortfall: shortfall });
    }
    return missing;
  }

  function synthesize(recipeId) {
    var c = Game.state.character;
    if (!c) return { ok: false, message: 'No character.' };
    var area = currentArea();
    if (!getFacility(area, 'synthesis')) return { ok: false, message: 'There is no Synthesis Shop here.' };
    var recipe = getRecipe(recipeId);
    if (!recipe) return { ok: false, message: 'Unknown recipe.' };

    var missing = missingInputs(c, recipe);
    if (missing.length > 0) {
      var names = missing.map(function (m) {
        var it = Game.Inventory.getItem(m.itemId);
        return (m.shortfall > 1 ? m.shortfall + 'x ' : '') + (it ? it.name : m.itemId);
      });
      return { ok: false, message: 'Missing: ' + names.join(', ') + '.' };
    }
    if (Game.Character.goldTotalAsGold(c) < recipe.gold) {
      return { ok: false, message: 'You need ' + recipe.gold + ' gold to synthesize this.' };
    }

    var outputItem = Game.Inventory.getItem(recipe.output);

    // Verify the output will fit AFTER the inputs are consumed, BEFORE consuming anything —
    // otherwise a near-capacity synthesis would eat the inputs and gold yet drop the output.
    var inputsWeight = 0;
    for (var w = 0; w < recipe.inputs.length; w++) {
      var inputItem = Game.Inventory.getItem(recipe.inputs[w]);
      if (inputItem) inputsWeight += inputItem.weight;
    }
    var outputWeight = outputItem ? outputItem.weight : 0;
    if (Game.Inventory.currentWeight(c) - inputsWeight + outputWeight > Game.Inventory.carryCapacity(c)) {
      return { ok: false, message: 'You cannot carry ' + (outputItem ? outputItem.name : recipe.output) + ' — too much weight. Free up space first.' };
    }

    // Consume inputs (one inventory copy per listed input id).
    for (var i = 0; i < recipe.inputs.length; i++) {
      Game.Inventory.discard(c, recipe.inputs[i]);
    }
    spendGold(c, recipe.gold);
    Game.Inventory.addItem(c, recipe.output);

    if (Game.persist) Game.persist();
    return { ok: true, message: 'You synthesize a ' + (outputItem ? outputItem.name : recipe.output) + '.' };
  }

  // ---------------- Shrine-buff battle integration hooks (called from js/core/battle.js) ----------------

  function shrineBonus(c, effect) {
    var total = 0;
    for (var i = 0; i < (c.shrineBuffs || []).length; i++) {
      var entry = c.shrineBuffs[i];
      var def = null;
      var list = Game.Data.shrine || [];
      for (var j = 0; j < list.length; j++) { if (list[j].id === entry.id) def = list[j]; }
      if (def && def.effect === effect) total += def.power;
    }
    return total;
  }

  // Decrements every active shrine buff by one battle-end (win/loss/flee all count per spec),
  // dropping any that reach zero. Called once from Game.Battle at the end of a battle.
  function tickShrineBuffsOnBattleEnd(c) {
    if (!c || !Array.isArray(c.shrineBuffs)) return;
    var remaining = [];
    for (var i = 0; i < c.shrineBuffs.length; i++) {
      var entry = c.shrineBuffs[i];
      entry.battlesLeft -= 1;
      if (entry.battlesLeft > 0) remaining.push(entry);
    }
    c.shrineBuffs = remaining;
  }

  return {
    getArea: getArea,
    currentArea: currentArea,
    getFacility: getFacility,
    travelTo: travelTo,
    hunt: hunt,
    camp: camp,
    bestTentQuality: bestTentQuality,
    innFee: innFee,
    innRest: innRest,
    shopStock: shopStock,
    buy: buy,
    sell: sell,
    sellValue: sellValue,
    exchangeStock: exchangeStock,
    buyAp: buyAp,
    depositGold: depositGold,
    withdrawGold: withdrawGold,
    depositItem: depositItem,
    withdrawItem: withdrawItem,
    learnableTechs: learnableTechs,
    canLearn: canLearn,
    learnTech: learnTech,
    buyBuff: buyBuff,
    uncurse: uncurse,
    cleanseHauntingFee: cleanseHauntingFee,
    cleanseHaunting: cleanseHaunting,
    spendGold: spendGold,
    getRecipe: getRecipe,
    missingInputs: missingInputs,
    synthesize: synthesize,
    shrineBonus: shrineBonus,
    tickShrineBuffsOnBattleEnd: tickShrineBuffsOnBattleEnd
  };
})();

window.Game = Game;
