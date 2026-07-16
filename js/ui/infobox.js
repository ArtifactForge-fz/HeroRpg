// HeroRPG remake — item info window (DESIGN.md §8; "The Item Window", New_Player_Guide.md).
// Double-click an item (or its Info button) to open this modal: name, desc, stats granted,
// weight, and a 'Reqs' tab where unmet requirements render in red (class req-bad).

var Game = window.Game || {};

Game.Infobox = (function () {

  var el = null; // bound lazily to Game.Screens.el once screens.js has loaded

  function getEl() {
    if (!el) el = Game.Screens.el;
    return el;
  }

  var activeTab = 'info';

  function statLines(item) {
    var e = getEl();
    var lines = [];
    if (item.damage) lines.push(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Damage']), e('span', {}, ['+' + item.damage])]));
    if (item.armor) lines.push(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Armor']), e('span', {}, ['+' + item.armor])]));
    if (item.magicArmor) lines.push(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Magic Armor']), e('span', {}, ['+' + item.magicArmor])]));
    if (item.heal) lines.push(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Heals']), e('span', {}, [String(item.heal)])]));
    if (item.energyRestore) lines.push(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Restores Energy']), e('span', {}, [String(item.energyRestore)])]));
    if (item.tags && item.tags.indexOf('tent') !== -1) lines.push(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Camp Heal']), e('span', {}, [Math.round(item.tentQuality * 100) + '%'])]));
    return lines;
  }

  function renderReqs(item, c) {
    var e = getEl();
    var wrap = e('div', {});
    var rows = [];

    if (item.levelReq) {
      var levelOk = c.level >= item.levelReq;
      rows.push(e('div', { class: 'stat-row' + (levelOk ? '' : ' req-bad') }, [
        e('span', { class: 'stat-name' }, ['Level']),
        e('span', {}, [String(item.levelReq) + (levelOk ? '' : ' (you: ' + c.level + ')')])
      ]));
    }
    if (item.statReqs) {
      for (var stat in item.statReqs) {
        if (!Object.prototype.hasOwnProperty.call(item.statReqs, stat)) continue;
        var need = item.statReqs[stat];
        var have = c[stat] || 0;
        var ok = have >= need;
        var label = stat.charAt(0).toUpperCase() + stat.slice(1);
        rows.push(e('div', { class: 'stat-row' + (ok ? '' : ' req-bad') }, [
          e('span', { class: 'stat-name' }, [label]),
          e('span', {}, [String(need) + (ok ? '' : ' (you: ' + have + ')')])
        ]));
      }
    }
    if (rows.length === 0) {
      wrap.appendChild(e('div', { class: 'smallfont' }, ['No requirements.']));
    } else {
      rows.forEach(function (r) { wrap.appendChild(r); });
    }
    return wrap;
  }

  function close() {
    var overlay = document.getElementById('infobox-overlay');
    if (overlay) overlay.parentNode.removeChild(overlay);
  }

  function open(item, character) {
    var e = getEl();
    activeTab = 'info';
    close();

    var overlay = document.createElement('div');
    overlay.id = 'infobox-overlay';
    overlay.className = 'infobox-overlay';
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) close();
    });

    var box = e('div', { class: 'infobox panelsurround' });

    function renderBody() {
      box.innerHTML = '';
      box.appendChild(e('div', { class: 'tcat' }, [
        Game.UI.icon(item.id, 32),
        ' ' + item.name,
        e('span', { class: 'infobox-close', onclick: close }, [' [x]'])
      ]));

      var tabs = e('div', { class: 'infobox-tabs' }, [
        e('span', {
          class: 'infobox-tab' + (activeTab === 'info' ? ' active' : ''),
          onclick: function () { activeTab = 'info'; renderBody(); }
        }, ['Info']),
        e('span', {
          class: 'infobox-tab' + (activeTab === 'reqs' ? ' active' : ''),
          onclick: function () { activeTab = 'reqs'; renderBody(); }
        }, ['Reqs'])
      ]);
      box.appendChild(tabs);

      var body = e('div', { class: 'panel infobox-body' });

      if (activeTab === 'info') {
        // Phase 9: unique (monster-only) equipment gets a gold-colored "Unique" line (reuses the
        // theme gold #c4bb4b via the .item-unique CSS class — see css/theme.css).
        if (item.tags && item.tags.indexOf('unique') !== -1) {
          body.appendChild(e('div', { class: 'item-unique mt4' }, ['Unique']));
        }
        body.appendChild(e('div', { class: 'smallfont mt4' }, [item.desc]));
        body.appendChild(e('div', { class: 'mt8' }, [
          e('span', { class: 'stat-row' }, [
            e('span', { class: 'stat-name' }, ['Slot']),
            e('span', {}, [item.slot === 'none' ? 'None' : item.slot])
          ])
        ]));
        if (item.skill) {
          body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Skill']), e('span', {}, [item.skill])]));
        }
        body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Weight']), e('span', {}, [String(item.weight)])]));
        body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Value']), e('span', {}, [String(item.value) + 'g'])]));
        statLines(item).forEach(function (row) { body.appendChild(row); });
        if (item.tags && item.tags.length) {
          body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Tags']), e('span', {}, [item.tags.join(', ')])]));
        }
      } else {
        body.appendChild(renderReqs(item, character));
      }

      box.appendChild(body);
    }

    renderBody();
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ---------- Tech info window (Phase 3; Techniques.md "double-click it to see information",
  // Version_2.1_Changes.md: "Tech dialog boxes show 'effective damage' which figures in
  // intelligence") ----------

  function openTech(tech, character) {
    var e = getEl();
    close();

    var overlay = document.createElement('div');
    overlay.id = 'infobox-overlay';
    overlay.className = 'infobox-overlay';
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) close();
    });

    var box = e('div', { class: 'infobox panelsurround' });
    box.appendChild(e('div', { class: 'tcat' }, [
      Game.UI.icon(tech.id, 32),
      ' ' + tech.name,
      e('span', { class: 'infobox-close', onclick: close }, [' [x]'])
    ]));

    var body = e('div', { class: 'panel infobox-body' });
    body.appendChild(e('div', { class: 'smallfont mt4' }, [tech.desc]));

    if (tech.skill) {
      body.appendChild(e('div', { class: 'stat-row mt8' }, [e('span', { class: 'stat-name' }, ['Skill']), e('span', {}, [tech.skill])]));
    }
    if (tech.grade) {
      body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Grade']), e('span', {}, [tech.grade])]));
    }
    if (tech.chain) {
      body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Chain']), e('span', {}, [tech.chain + ' (rank ' + tech.rank + ')'])]));
    }
    // v1.6 P1 (CB-4, SPEC-V1.6-REBALANCE.md §6): show the Rod-discounted effective cost (when
    // applicable) via the same helper useTech charges from, so this readout matches battle.
    var displayEnergyCost = (character && Game.Battle && Game.Battle.effectiveTechEnergyCost)
      ? Game.Battle.effectiveTechEnergyCost(character, tech)
      : tech.energyCost;
    body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Energy Cost']), e('span', {}, [String(displayEnergyCost)])]));

    // Feature C: weapon techniques carry no `power` field (js/data/techs.js) — their damage is a
    // multiplier on the wielded weapon's physical Damage stat, not a flat spell power, so the
    // Power/Effective-Damage rows below (which assume the Intelligence spell factor via
    // Game.Battle.techEffectivePower) are replaced with Power Multiplier/Armor Pierce/Hits and a
    // getDamage-based effective damage.
    //
    // v1.4 UX transparency pass (user-directed 2026-07-12): every tech now states which stat
    // "Scales with" it (weapon Damage for weapon techs, Intelligence for spells — DESIGN.md §3),
    // and the effective damage/healing number is shown as a RANGE (BALANCE.DAMAGE_VARIANCE, the
    // same +-20% roll js/core/battle.js applies at cast time — rollVariance) rather than a single
    // figure that silently omits the variance every real cast actually has.
    if (tech.weaponTech) {
      body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Scales with']), e('span', {}, ["your weapon's Damage (follows the weapon's governing stat)"])]));
      body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Power Multiplier']), e('span', {}, ['x' + tech.powerMult])]));
      if (tech.armorPierce) {
        body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Armor Pierce']), e('span', {}, [Math.round(tech.armorPierce * 100) + '%'])]));
      }
      if (tech.hits && tech.hits > 1) {
        body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Hits']), e('span', {}, [String(tech.hits)])]));
      }
      if (character && Game.Character && Game.Character.getDamage) {
        var weaponEffective = Math.round(Game.Character.getDamage(character) * (tech.powerMult || 1)) * (tech.hits || 1);
        var wLo = Math.round(weaponEffective * (1 - BALANCE.DAMAGE_VARIANCE));
        var wHi = Math.round(weaponEffective * (1 + BALANCE.DAMAGE_VARIANCE));
        body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Effective Damage']), e('span', {}, [wLo + '–' + wHi + (tech.hits > 1 ? ' (total, ' + tech.hits + ' hits)' : '') + ' (before enemy defenses)'])]));
      }
    } else {
      body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Scales with']), e('span', {}, ['Intelligence'])]));
      body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Power']), e('span', {}, [String(tech.power)])]));

      // "Effective damage" (or healing) factoring Intelligence, via the same formula battle uses,
      // shown as a lo-hi range around the +-DAMAGE_VARIANCE roll.
      if (character && Game.Battle && Game.Battle.techEffectivePower) {
        var effective = Game.Battle.techEffectivePower(character, tech);
        var eLo = Math.round(effective * (1 - BALANCE.DAMAGE_VARIANCE));
        var eHi = Math.round(effective * (1 + BALANCE.DAMAGE_VARIANCE));
        var label = tech.effect === 'heal' ? 'Effective Healing'
          : tech.effect === 'buff' ? 'Damage Bonus'
          : 'Effective Damage';
        var note = (tech.effect !== 'heal' && tech.effect !== 'buff') ? ' (before enemy defenses)' : '';
        body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, [label]), e('span', {}, [eLo + '–' + eHi + note])]));
      }
    }
    if (tech.effect === 'buff' && tech.buffDuration) {
      body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Duration']), e('span', {}, [tech.buffDuration + ' turns'])]));
    }
    if (typeof tech.trainingCost === 'number') {
      body.appendChild(e('div', { class: 'stat-row' }, [e('span', { class: 'stat-name' }, ['Training Cost']), e('span', {}, [tech.trainingCost + ' TP'])]));
    }
    if (tech.skillReq && character && tech.skill) {
      var sk = character.skills[tech.skill];
      var haveLevel = sk ? sk.level : 0;
      var ok = haveLevel >= tech.skillReq;
      body.appendChild(e('div', { class: 'stat-row' + (ok ? '' : ' req-bad') }, [
        e('span', { class: 'stat-name' }, ['Requires']),
        e('span', {}, [tech.skill + ' ' + tech.skillReq + (ok ? '' : ' (you: ' + haveLevel + ')')])
      ]));
    }

    box.appendChild(body);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ---------- Stat info window (v1.4 UX transparency pass, user-directed 2026-07-12) ----------
  // Reuses the SAME overlay/box/close plumbing as open()/openTech() above — no second overlay
  // implementation. Backed by Game.Data.statInfo (js/data/statinfo.js). Opened from the Status
  // screen's per-stat "ⓘ" affordance (js/ui/screens.js renderStatus).

  // "Nice to have" live readout (spec: "the stat's current live derived contribution if trivially
  // available") — kept deliberately simple/safe: the character's own current value for that stat
  // or pool, never a derived formula that might not actually be in effect for this character
  // (e.g. Strength only feeds Damage while a Strength-based weapon is equipped) and so could
  // mislead rather than inform.
  function currentStatValue(statKey, c) {
    if (!c) return null;
    switch (statKey) {
      case 'strength':
      case 'vitality':
      case 'dexterity':
      case 'intelligence':
      case 'endurance':
        return String(c[statKey]);
      case 'hitPoints':
        return c.hitPoints + ' / ' + c.hitPointsMax;
      case 'energy':
        return c.energy + ' / ' + c.energyMax;
      default:
        return null;
    }
  }

  function openStat(statKey, character) {
    var e = getEl();
    close();

    var info = (Game.Data && Game.Data.statInfo) ? Game.Data.statInfo[statKey] : null;
    if (!info) return; // no data registered for this key -- nothing to show

    var overlay = document.createElement('div');
    overlay.id = 'infobox-overlay';
    overlay.className = 'infobox-overlay';
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) close();
    });

    var box = e('div', { class: 'infobox panelsurround' });
    box.appendChild(e('div', { class: 'tcat' }, [
      info.name,
      e('span', { class: 'infobox-close', onclick: close }, [' [x]'])
    ]));

    var body = e('div', { class: 'panel infobox-body' });
    body.appendChild(e('div', { class: 'smallfont mt4' }, [info.summary]));
    (info.effects || []).forEach(function (line) {
      body.appendChild(e('div', { class: 'smallfont mt4' }, ['• ' + line]));
    });

    var current = currentStatValue(statKey, character);
    if (current) {
      body.appendChild(e('div', { class: 'stat-row mt8' }, [
        e('span', { class: 'stat-name' }, ['Current']),
        e('span', {}, [current])
      ]));
    }

    box.appendChild(body);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ---------- Generic overlay panel (v1.4 Mobile M3; SPEC-MOBILE-UI.md §4 M3, audit A8) ----------
  // A minimal generic entry point that reuses the SAME overlay/box/close plumbing as open()/
  // openTech() above, for callers with no item/tech object to show — just a plain title and a
  // body they build themselves. Added so the save-panel Export/Import modal (index.html
  // renderSavePanel) can drop window.prompt() (audit A8: "functional... but miserable, especially
  // iOS") without a second overlay implementation ("infobox reuse preferred — zero new overlay
  // code", SPEC-MOBILE-UI.md §3).
  //
  // buildBody(bodyEl, closePanel) is called once, synchronously, with the empty `.infobox-body`
  // node to populate and a bound reference to this box's close() so callers don't need to reach
  // back into Game.Infobox themselves.
  function openPanel(title, buildBody) {
    var e = getEl();
    close();

    var overlay = document.createElement('div');
    overlay.id = 'infobox-overlay';
    overlay.className = 'infobox-overlay';
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) close();
    });

    var box = e('div', { class: 'infobox panelsurround infobox-wide' });
    box.appendChild(e('div', { class: 'tcat' }, [
      title,
      e('span', { class: 'infobox-close', onclick: close }, [' [x]'])
    ]));

    var body = e('div', { class: 'panel infobox-body' });
    if (typeof buildBody === 'function') buildBody(body, close);
    box.appendChild(body);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  return {
    open: open,
    openTech: openTech,
    openStat: openStat,
    openPanel: openPanel,
    close: close
  };
})();

window.Game = Game;
