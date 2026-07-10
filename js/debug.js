// HeroRPG remake — console-only debug helpers.

var Game = window.Game || {};

Game._debug = {
  addXp: function (n) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var levels = Game.Character.addXp(Game.state.character, n);
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Added ' + n + ' XP. Levels gained: ' + levels + '. Now level ' + Game.state.character.level + '.');
  },

  setLevel: function (n) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var c = Game.state.character;
    c.level = n;
    c.xp = BALANCE.XP_TO_LEVEL(n);
    Game.Character.recalcDerived(c);
    c.hitPoints = c.hitPointsMax;
    c.energy = c.energyMax;
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Level set to ' + n + '.');
  },

  addGold: function (n) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    Game.Character.addGold(Game.state.character, n);
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Added ' + n + ' gold.');
  },

  addShards: function (n) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    Game.Character.addShards(Game.state.character, n);
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Added ' + n + ' Anima Shards.');
  },

  reset: function () {
    Game.Save.wipe();
    Game.state.character = null;
    Game.Screens.resetWizard();
    console.log('Save wiped. Reloading...');
    window.location.reload();
  },

  giveItem: function (id) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var item = Game.Inventory.getItem(id);
    if (!item) { console.warn('No such item id: ' + id + '. Use Game._debug.listItems() to see valid ids.'); return; }
    var added = Game.Inventory.addItem(Game.state.character, id);
    if (!added) { console.warn('Could not add ' + id + ' — over carrying capacity.'); return; }
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Gave item: ' + item.name + ' (' + id + ').');
  },

  listItems: function () {
    Game.Data.items.forEach(function (item) {
      console.log(item.id + '  —  ' + item.name + '  [' + item.slot + (item.skill ? ', ' + item.skill : '') + ']');
    });
    console.log('Total items: ' + Game.Data.items.length);
  },

  // ---------- Phase 3: battle helpers ----------

  fight: function (monsterId) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    if (Game.state.battle) { console.warn('Already in a battle. Finish it first.'); return; }
    var battle = Game.Battle.start(monsterId);
    if (!battle) {
      console.warn('No such monster id: ' + monsterId + '. Use Game._debug.listMonsters() to see valid ids.');
      return;
    }
    Game.Screens.navigate('battle');
    console.log('Battle started vs ' + battle.monster.name + ' (Lv ' + battle.monster.level + '). ' +
      (battle.playerFirst ? 'You strike first.' : 'The monster struck first.'));
  },

  listMonsters: function () {
    (Game.Data.monsters || []).forEach(function (m) {
      console.log(m.id + '  —  ' + m.name + '  [Lv ' + m.level + (m.boss ? ', BOSS' : '') + ']');
    });
    console.log('Total monsters: ' + Game.Data.monsters.length);
  },

  learnTech: function (techId) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var c = Game.state.character;
    var tech = null;
    (Game.Data.techs || []).forEach(function (t) { if (t.id === techId) tech = t; });
    if (!tech) { console.warn('No such tech id: ' + techId + '. Use Game._debug.listTechs() to see valid ids.'); return; }
    if (tech.monsterOnly) { console.warn(techId + ' is a monster-only technique.'); return; }
    if (c.techs.indexOf(techId) !== -1) { console.warn('Already known: ' + tech.name); return; }
    c.techs.push(techId);
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Learned technique: ' + tech.name + ' (' + techId + '). Equip it on the Techs screen.');
  },

  listTechs: function () {
    (Game.Data.techs || []).forEach(function (t) {
      console.log(t.id + '  —  ' + t.name + '  [' + (t.skill || 'monster') + (t.grade ? ', ' + t.grade : '') + (t.monsterOnly ? ', monster-only' : '') + ']');
    });
    console.log('Total techs: ' + Game.Data.techs.length);
  },

  restoreAll: function () {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var c = Game.state.character;
    c.hitPoints = c.hitPointsMax;
    c.energy = c.energyMax;
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('HP and Energy fully restored.');
  },

  // ---------- Phase 4: world/town helpers ----------

  goto: function (areaId) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var area = Game.World.getArea(areaId);
    if (!area) { console.warn('No such area id: ' + areaId + '. Valid ids: ' + Game.Data.areas.map(function (a) { return a.id; }).join(', ')); return; }
    // Debug teleport bypasses the level gate (unlike Game.World.travelTo).
    Game.state.character.currentLocation = areaId;
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Teleported to ' + area.name + ' (' + areaId + ').');
  },

  addTP: function (n) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    Game.state.character.trainingPoints += n;
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Added ' + n + ' Training Points. Now ' + Game.state.character.trainingPoints + '.');
  },

  // ---------- Phase 5: quest helpers ----------

  // Accepts a quest bypassing the giver-location and level-window checks (debug convenience;
  // real accepts go through Game.Quests.accept).
  acceptQuest: function (questId) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var c = Game.state.character;
    var quest = Game.Quests.getQuest(questId);
    if (!quest) { console.warn('No such quest id: ' + questId + '. Use Game._debug.listQuests() to see valid ids.'); return; }
    if (!c.quests) c.quests = {};
    if (c.quests[questId]) { console.warn('Quest already ' + c.quests[questId].status + ': ' + quest.name); return; }
    (quest.acceptItems || []).forEach(function (itemId) { Game.Inventory.addItem(c, itemId); });
    c.quests[questId] = { status: 'active', progress: { kills: {}, touched: {}, visited: {} } };
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Quest accepted (debug, gates bypassed): ' + quest.name + ' (' + questId + ').');
  },

  // Force-satisfies every step of an active quest: fills kill counts, touches all tokens, marks
  // visits, and grants missing collect items (so turnIn's live inventory check passes).
  completeQuestStep: function (questId) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var c = Game.state.character;
    var quest = Game.Quests.getQuest(questId);
    if (!quest) { console.warn('No such quest id: ' + questId + '. Use Game._debug.listQuests() to see valid ids.'); return; }
    var e = c.quests && c.quests[questId];
    if (!e || e.status !== 'active') { console.warn('Quest not active: ' + questId + '. Accept it first (Game._debug.acceptQuest).'); return; }
    quest.steps.forEach(function (step) {
      if (step.kind === 'kill') {
        if (!e.progress.kills) e.progress.kills = {};
        e.progress.kills[step.monsterId] = step.count;
      } else if (step.kind === 'touch') {
        if (!e.progress.touched) e.progress.touched = {};
        step.tokens.forEach(function (token) { e.progress.touched[token.areaId] = true; });
      } else if (step.kind === 'visit') {
        if (!e.progress.visited) e.progress.visited = {};
        e.progress.visited[step.areaId] = true;
      } else if (step.kind === 'collect') {
        var have = Game.Quests.inventoryCount(c, step.itemId);
        for (var i = have; i < step.count; i++) {
          if (!Game.Inventory.addItem(c, step.itemId)) {
            console.warn('Could not grant ' + step.itemId + ' — over carrying capacity.');
            break;
          }
        }
      }
    });
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('All steps force-satisfied for: ' + quest.name + '. canTurnIn=' + Game.Quests.canTurnIn(questId) +
      ' (turn in at ' + quest.giver.npc + ', ' + quest.giver.areaId + ').');
  },

  listQuests: function () {
    var c = Game.state.character;
    (Game.Data.quests || []).forEach(function (q) {
      var status = (c && c.quests && c.quests[q.id]) ? c.quests[q.id].status : 'available';
      var band = (q.levelMin ? 'Lv ' + q.levelMin : 'Lv 1') + (q.levelMax ? '-' + q.levelMax : '+');
      console.log(q.id + '  —  ' + q.name + '  [' + band + ', giver: ' + q.giver.areaId + ', ' + status + ']');
    });
    console.log('Total quests: ' + Game.Data.quests.length);
  },

  // ---------- Phase 6a: class helpers ----------

  giveClass: function (classId) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var c = Game.state.character;
    var res = Game.Classes.obtainClass(c, classId);
    if (!res.ok) { console.warn(res.message); return; }
    Game.persist();
    Game.refreshCurrentScreen();
    console.log(res.message);
  },

  // v1.1 revision: lists all 10 classes (3 Base, 6 Advanced, 1 Legendary — DESIGN.md §3) with
  // their tier and (for Advanced) baseClass lineage, so Game._debug.giveClass(id) has a ready
  // reference for every valid id.
  listClasses: function () {
    (Game.Data.classes || []).forEach(function (cd) {
      var tierName = cd.legendary ? 'Legendary' : (cd.tier === 2 ? 'Advanced' : 'Base');
      var lineage = cd.baseClass ? ' <- ' + cd.baseClass : '';
      console.log(cd.id + '  —  ' + cd.name + '  [' + tierName + lineage + ', ' + cd.abilities.length + ' abilities]');
    });
    console.log('Total classes: ' + Game.Data.classes.length);
  },

  addClassXp: function (n) {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    Game.Classes.addClassXp(Game.state.character, n);
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Granted ' + n + ' class XP (Primary full rate, Secondary half).');
  },

  unlockLegendary: function () {
    if (!Game.state.character) { console.warn('No character yet.'); return; }
    var c = Game.state.character;
    var legendary = (Game.Data.classes || []).filter(function (cl) { return cl.legendary; })[0];
    if (!legendary) { console.warn('No legendary class defined.'); return; }
    if (c.legendaryUnlocked) { console.warn('Legendary class already unlocked.'); return; }
    c.legendaryUnlocked = true;
    var res = Game.Classes.obtainClass(c, legendary.id);
    Game.persist();
    Game.refreshCurrentScreen();
    console.log('Legendary unlocked (debug): ' + (res.ok ? res.message : legendary.name));
  }
};

window.Game = Game;
