// HeroRPG remake — inventory, equipment, weight/encumbrance (DESIGN.md §6).

var Game = window.Game || {};

Game.Inventory = (function () {

  var EQUIP_SLOTS = ['weapon', 'offhand', 'head', 'body', 'legs', 'feet'];

  function getItem(id) {
    var items = Game.Data.items;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function ensureFields(c) {
    if (!c.inventory) c.inventory = [];
    if (!c.equipment) {
      c.equipment = { weapon: null, offhand: null, head: null, body: null, legs: null, feet: null };
    }
  }

  // Strength-based carrying capacity — invented, matches Phase 1 status-bar readout (index.html).
  function carryCapacity(c) {
    return c.strength * 10; // invented
  }

  function currentWeight(c) {
    ensureFields(c);
    var total = 0;
    for (var i = 0; i < c.inventory.length; i++) {
      var item = getItem(c.inventory[i]);
      if (item) total += item.weight;
    }
    for (var slot in c.equipment) {
      if (!Object.prototype.hasOwnProperty.call(c.equipment, slot)) continue;
      var equippedId = c.equipment[slot];
      if (equippedId) {
        var eq = getItem(equippedId);
        if (eq) total += eq.weight;
      }
    }
    return total;
  }

  function canUse(c, item) {
    var failures = [];
    if (item.levelReq && c.level < item.levelReq) {
      failures.push('Requires Level ' + item.levelReq + ' (you are Level ' + c.level + ')');
    }
    if (item.statReqs) {
      for (var stat in item.statReqs) {
        if (!Object.prototype.hasOwnProperty.call(item.statReqs, stat)) continue;
        var need = item.statReqs[stat];
        var have = c[stat] || 0;
        if (have < need) {
          failures.push('Requires ' + capitalize(stat) + ' ' + need + ' (you have ' + have + ')');
        }
      }
    }
    return { ok: failures.length === 0, failures: failures };
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // addItem: false if adding would exceed carrying capacity.
  function addItem(c, itemId) {
    ensureFields(c);
    var item = getItem(itemId);
    if (!item) return false;
    if (currentWeight(c) + item.weight > carryCapacity(c)) return false;
    c.inventory.push(itemId);
    return true;
  }

  function removeFromInventory(c, itemId) {
    ensureFields(c);
    var idx = c.inventory.indexOf(itemId);
    if (idx === -1) return false;
    c.inventory.splice(idx, 1);
    return true;
  }

  function refreshWeaponBonus(c) {
    // invented: weapon contribution to Damage, wired to Game.Character.getDamage via c.weaponDamageBonus.
    ensureFields(c);
    var weaponId = c.equipment.weapon;
    var weapon = weaponId ? getItem(weaponId) : null;
    c.weaponDamageBonus = weapon && weapon.damage ? weapon.damage : 0;
    c.equippedWeaponSkill = weapon ? weapon.skill : null;
  }

  // equip: moves itemId from inventory to its slot; swaps any currently-equipped item back to inventory.
  function equip(c, itemId) {
    ensureFields(c);
    var item = getItem(itemId);
    if (!item) return { ok: false, failures: ['Unknown item.'] };
    if (item.slot === 'none') return { ok: false, failures: ['This item cannot be equipped.'] };
    if (c.inventory.indexOf(itemId) === -1) return { ok: false, failures: ['Item is not in your inventory.'] };

    var usable = canUse(c, item);
    if (!usable.ok) return usable;

    var slot = item.slot;
    var previous = c.equipment[slot];

    removeFromInventory(c, itemId);
    c.equipment[slot] = itemId;
    if (previous) {
      c.inventory.push(previous);
    }

    refreshWeaponBonus(c);
    Game.Character.recalcDerived(c);
    return { ok: true, failures: [] };
  }

  // unequip: blocked if the equipped item has tag 'cursed' (Cursed.md — "cannot be removed
  // conventionally... visit a Spirit Shrine").
  function unequip(c, slot) {
    ensureFields(c);
    var itemId = c.equipment[slot];
    if (!itemId) return { ok: false, message: 'Nothing is equipped there.' };
    var item = getItem(itemId);
    if (item && item.tags && item.tags.indexOf('cursed') !== -1) {
      return { ok: false, message: 'This item is cursed and cannot be removed. Visit a Spirit Shrine.' };
    }
    c.equipment[slot] = null;
    c.inventory.push(itemId);
    refreshWeaponBonus(c);
    Game.Character.recalcDerived(c);
    return { ok: true, message: '' };
  }

  // discard: inventory items only (caller should confirm with the player first).
  function discard(c, itemId) {
    ensureFields(c);
    if (c.inventory.indexOf(itemId) === -1) return false;
    removeFromInventory(c, itemId);
    return true;
  }

  // Sum of equipped armor/magicArmor, added to the Endurance/Intelligence stat contribution
  // in Game.Character.getArmor / getMagicArmor.
  function equippedArmorTotal(c) {
    ensureFields(c);
    var total = 0;
    for (var i = 0; i < EQUIP_SLOTS.length; i++) {
      var itemId = c.equipment[EQUIP_SLOTS[i]];
      if (!itemId) continue;
      var item = getItem(itemId);
      if (item && item.armor) total += item.armor;
    }
    return total;
  }

  function equippedMagicArmorTotal(c) {
    ensureFields(c);
    var total = 0;
    for (var i = 0; i < EQUIP_SLOTS.length; i++) {
      var itemId = c.equipment[EQUIP_SLOTS[i]];
      if (!itemId) continue;
      var item = getItem(itemId);
      if (item && item.magicArmor) total += item.magicArmor;
    }
    return total;
  }

  // Starter kit granted on character creation (Phase 2 spec): a level-1 weapon matching the
  // character's highest creation skill (fallback: sword), a Light Body armor, 2 healing
  // potions, 1 basic tent.
  var STARTER_WEAPON_BY_SKILL = {
    'Swords': 'sword_rusty_shortblade',
    'Polearms': 'polearm_ashwood_spear',
    'Knives': 'knife_worn_dagger',
    'Rods': 'rod_apprentice_wand',
    'Hand to Hand': 'hth_iron_knuckles'
  };

  function highestCreationSkill(c) {
    var best = null;
    var bestLevel = -1;
    for (var skillName in STARTER_WEAPON_BY_SKILL) {
      if (!Object.prototype.hasOwnProperty.call(STARTER_WEAPON_BY_SKILL, skillName)) continue;
      var sk = c.skills[skillName];
      if (sk && sk.level > bestLevel) {
        bestLevel = sk.level;
        best = skillName;
      }
    }
    return bestLevel > 0 ? best : null;
  }

  function grantStarterKit(c) {
    ensureFields(c);
    var skillName = highestCreationSkill(c);
    var weaponId = (skillName && STARTER_WEAPON_BY_SKILL[skillName]) || STARTER_WEAPON_BY_SKILL['Swords'];

    c.inventory.push(weaponId);
    c.inventory.push('light_body_traveler_tunic');
    c.inventory.push('potion_minor_healing');
    c.inventory.push('potion_minor_healing');
    c.inventory.push('tent_ragged_bedroll');

    // Auto-equip the starter weapon and armor for a friendlier first Status screen.
    equip(c, weaponId);
    equip(c, 'light_body_traveler_tunic');
  }

  return {
    getItem: getItem,
    ensureFields: ensureFields,
    carryCapacity: carryCapacity,
    currentWeight: currentWeight,
    canUse: canUse,
    addItem: addItem,
    removeFromInventory: removeFromInventory,
    equip: equip,
    unequip: unequip,
    discard: discard,
    equippedArmorTotal: equippedArmorTotal,
    equippedMagicArmorTotal: equippedMagicArmorTotal,
    refreshWeaponBonus: refreshWeaponBonus,
    grantStarterKit: grantStarterKit,
    EQUIP_SLOTS: EQUIP_SLOTS
  };
})();

window.Game = Game;
