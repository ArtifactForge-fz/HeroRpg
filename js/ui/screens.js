// HeroRPG remake — screen router + Phase 1 screens (creation wizard, Status).

var Game = window.Game || {};

Game.Screens = (function () {

  var LORE = {
    Human: 'Humans were the first race to populate the world. They are a taller race whose appearance differs greatly from person to person. Their homeland is found on the plains of Averast where their kingdom of Eldor flourishes. Humans have their own unique endeavors that other races don’t care to bother with. They have become obsessed with trade and making their economy thrive between their cities.',
    Arkan: 'The Arkan are a proud people who once called the Forests of Kuraan their home. However, they were overrun by a tribal race known as the Majiku. They were forced to the Plains of Averast where the Humans reside. There they established the city of Saratus, a grand circular city focused on the study of magic and technology. The Arkan culture reflects the oriental culture in both appearance and tradition. While the Arkan have no standing army, many citizens present themselves as mercenaries to fight for the cause of the nation. They traditionally fight with runic blades or bows and arrows. Battlemages reinforce the front with white and black magic derived from the study of runes.'
  };

  var wizard = {
    step: 1,
    race: null,
    skillPoints: {},
    name: '',
    gender: 'Male'
  };

  function resetWizard() {
    wizard = { step: 1, race: null, skillPoints: {}, name: '', gender: 'Male' };
    for (var i = 0; i < BALANCE.SKILLS.length; i++) {
      wizard.skillPoints[BALANCE.SKILLS[i]] = 0;
    }
  }
  resetWizard();

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        if (attrs[k] === null || attrs[k] === undefined) continue;
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        if (children[i] == null) continue;
        e.appendChild(typeof children[i] === 'string' ? document.createTextNode(children[i]) : children[i]);
      }
    }
    return e;
  }

  // v1.4 Mobile M2 (SPEC-MOBILE-UI.md §4 M2, audit A9): wraps a wide row-panel node in a
  // `.scroll-x` container (css/theme.css, overflow-x:auto) so a narrow viewport scrolls just
  // that panel, never the page body. Caller appends the returned wrapper instead of `node`.
  function scrollX(node) {
    var wrap = el('div', { class: 'scroll-x' });
    wrap.appendChild(node);
    return wrap;
  }

  // v1.6 P3 (EI-3b, SPEC-V1.6-REBALANCE.md §3, REVIEW-2026-07-16.md EI-3) [invented]: a quest_
  // material nothing can still need (Game.Quests.materialStillUseful, EI-3a) is pure inventory
  // clutter — sell/discard confirms below skip the extra click ONLY for this case, never for a
  // quest_ item some quest is still actively collecting (that keeps the normal confirm — an
  // accidental discard mid-collection would cost real progress) and never for a non-quest_ item.
  // Defensive default: if the helper is ever unavailable, treat the item as STILL useful (keep
  // the confirm) rather than silently dropping the safety net.
  function isSpentQuestMaterial(c, itemId) {
    if (!itemId || itemId.indexOf('quest_') !== 0) return false;
    if (!(Game.Quests && Game.Quests.materialStillUseful)) return false;
    return !Game.Quests.materialStillUseful(c, itemId);
  }

  // v1.4 Mobile M3 (SPEC-MOBILE-UI.md §4 M3, audit A8/high-frequency-alert item): replaces
  // alert() for the high-frequency Hunt/Camp/Forage/touch-token results with the shared
  // Game.UI.toast helper (defined near the end of this file). Guarded the same defensive way as
  // Game.renderActions' other cross-module hooks (CLAUDE.md "guarded-hook pattern") so an
  // environment that never wired up Game.UI.toast (or a #toastbar element) falls back to the
  // original alert() instead of silently losing the message.
  function notify(message) {
    if (Game.UI && Game.UI.toast) { Game.UI.toast(message); } else { alert(message); }
  }

  function skillPointTotal() {
    var total = 0;
    for (var s in wizard.skillPoints) {
      if (Object.prototype.hasOwnProperty.call(wizard.skillPoints, s)) total += wizard.skillPoints[s];
    }
    return total;
  }

  // ---------- Creation wizard ----------

  function renderCreation(root) {
    root.innerHTML = '';
    var panelWrap = el('div', { class: 'tcat' }, ['Character Creation — Step ' + wizard.step + ' of 3']);
    var body = el('div', { class: 'panel' });

    if (wizard.step === 1) body.appendChild(renderStep1());
    else if (wizard.step === 2) body.appendChild(renderStep2());
    else body.appendChild(renderStep3());

    root.appendChild(panelWrap);
    root.appendChild(body);
  }

  function renderStep1() {
    var wrap = el('div', {});
    wrap.appendChild(el('p', {}, ['Choose your race.']));

    BALANCE.RACES.forEach(function (race) {
      var selected = wizard.race === race;
      var box = el('div', {
        class: 'race-choice' + (selected ? ' selected' : ''),
        onclick: function () {
          wizard.race = race;
          renderCreation(document.getElementById('maincontent'));
        }
      }, [
        el('h3', {}, [race]),
        el('div', { class: 'smallfont' }, [LORE[race]])
      ]);
      wrap.appendChild(box);
    });

    var footer = el('div', { class: 'wizard-footer' }, [
      el('span', {}, ['']),
      el('button', {
        class: 'button',
        disabled: wizard.race ? null : 'disabled',
        onclick: function () {
          if (!wizard.race) return;
          wizard.step = 2;
          renderCreation(document.getElementById('maincontent'));
        }
      }, ['Next'])
    ]);
    wrap.appendChild(footer);
    return wrap;
  }

  function renderStep2() {
    var wrap = el('div', {});
    var total = skillPointTotal();
    var remaining = BALANCE.CREATION_SKILL_POINTS - total;

    wrap.appendChild(el('p', {}, [
      'Distribute ' + BALANCE.CREATION_SKILL_POINTS + ' skill points. Max ' +
      BALANCE.CREATION_SKILL_POINT_MAX_PER_SKILL + ' per skill. Remaining: ',
      el('b', {}, [String(remaining)])
    ]));

    var table = el('div', { class: 'contentpage' });
    BALANCE.SKILLS.forEach(function (skill) {
      var value = wizard.skillPoints[skill];
      var row = el('div', { class: 'skillpoint-row alt' + (BALANCE.SKILLS.indexOf(skill) % 2) }, [
        el('span', { class: 'sp-name' }, [skill]),
        el('button', {
          class: 'button',
          disabled: value <= 0 ? 'disabled' : null,
          onclick: function () {
            wizard.skillPoints[skill] = Math.max(0, wizard.skillPoints[skill] - 1);
            renderCreation(document.getElementById('maincontent'));
          }
        }, ['-']),
        el('span', { class: 'stat-value' }, [String(value)]),
        el('button', {
          class: 'button',
          disabled: (value >= BALANCE.CREATION_SKILL_POINT_MAX_PER_SKILL || remaining <= 0) ? 'disabled' : null,
          onclick: function () {
            if (wizard.skillPoints[skill] < BALANCE.CREATION_SKILL_POINT_MAX_PER_SKILL && skillPointTotal() < BALANCE.CREATION_SKILL_POINTS) {
              wizard.skillPoints[skill] += 1;
              renderCreation(document.getElementById('maincontent'));
            }
          }
        }, ['+'])
      ]);
      table.appendChild(row);
    });
    wrap.appendChild(table);

    var footer = el('div', { class: 'wizard-footer' }, [
      el('button', { class: 'button', onclick: function () { wizard.step = 1; renderCreation(document.getElementById('maincontent')); } }, ['Back']),
      el('button', {
        class: 'button',
        disabled: remaining !== 0 ? 'disabled' : null,
        onclick: function () {
          if (remaining !== 0) return;
          wizard.step = 3;
          renderCreation(document.getElementById('maincontent'));
        }
      }, ['Next'])
    ]);
    wrap.appendChild(footer);
    return wrap;
  }

  function sanitizeName(raw) {
    return raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
  }

  function renderStep3() {
    var wrap = el('div', {});
    wrap.appendChild(el('p', {}, ['Name your character (letters/numbers, max 20 characters) and choose a gender.']));

    var nameInput = el('input', { type: 'text', value: wizard.name, maxlength: '20' });
    nameInput.addEventListener('input', function (ev) {
      wizard.name = sanitizeName(ev.target.value);
      if (ev.target.value !== wizard.name) ev.target.value = wizard.name;
      updateNextState();
    });

    var genderSelect = el('select', {});
    ['Male', 'Female'].forEach(function (g) {
      var opt = el('option', { value: g }, [g]);
      if (wizard.gender === g) opt.setAttribute('selected', 'selected');
      genderSelect.appendChild(opt);
    });
    genderSelect.addEventListener('change', function (ev) { wizard.gender = ev.target.value; });

    var nextBtn = el('button', {
      class: 'button',
      onclick: function () {
        if (!isNameValid()) return;
        finishCreation();
      }
    }, ['Create']);

    function isNameValid() {
      return wizard.name.length > 0 && wizard.name.length <= 20;
    }

    function updateNextState() {
      nextBtn.disabled = !isNameValid();
    }

    wrap.appendChild(el('div', { class: 'stat-row' }, [el('span', { class: 'stat-name' }, ['Name']), nameInput]));
    wrap.appendChild(el('div', { class: 'stat-row' }, [el('span', { class: 'stat-name' }, ['Gender']), genderSelect]));

    var footer = el('div', { class: 'wizard-footer' }, [
      el('button', { class: 'button', onclick: function () { wizard.step = 2; renderCreation(document.getElementById('maincontent')); } }, ['Back']),
      nextBtn
    ]);
    wrap.appendChild(footer);
    updateNextState();
    return wrap;
  }

  function finishCreation() {
    var character = Game.Character.create({
      race: wizard.race,
      name: wizard.name,
      gender: wizard.gender,
      skillPoints: wizard.skillPoints
    });
    Game.state.character = character;
    Game.persist();
    resetWizard();
    navigate('status');
  }

  // ---------- Status screen ----------

  // Phase 6a: Status gains a Classes tab alongside the original single-panel layout (archived:
  // "going to the Status page... clicking the Classes tab" — Classes.md). 'stats' preserves the
  // exact Phase 1-5 layout; 'classes' is new.
  var statusTab = 'stats';

  function refreshStatusScreen() {
    renderStatus(document.getElementById('maincontent'));
    Game.renderStatusBars();
    if (Game.renderActions) Game.renderActions();
  }

  function classLabel(c) {
    var primary = c.primaryClass ? (Game.Classes.getClass(c.primaryClass) || {}).name : null;
    if (!primary) return 'None';
    var secondary = c.secondaryClass ? (Game.Classes.getClass(c.secondaryClass) || {}).name : null;
    return primary + (secondary ? ' (' + secondary + ')' : '');
  }

  function renderStatus(root) {
    root.innerHTML = '';
    var c = Game.state.character;

    root.appendChild(el('div', { class: 'tcat' }, ['Status']));

    var tabs = el('div', { class: 'techset-tabs' });
    [['stats', 'Stats & Skills'], ['classes', 'Classes']].forEach(function (pair) {
      tabs.appendChild(el('span', {
        class: 'infobox-tab' + (statusTab === pair[0] ? ' active' : ''),
        onclick: function () { statusTab = pair[0]; refreshStatusScreen(); }
      }, [pair[1]]));
    });
    root.appendChild(tabs);

    if (statusTab === 'classes') {
      renderStatusClasses(root, c);
      return;
    }

    var top = el('div', { class: 'panel mt8' });

    var identity = el('div', { class: 'mt4' }, [
      el('b', {}, [c.name]), ' the ', c.race, ' (', c.gender, ')'
    ]);
    top.appendChild(identity);

    var levelRow = el('div', { class: 'hrpg-table mt8' });
    levelRow.appendChild(makeInfoRow('Level', String(c.level) + (c.level >= BALANCE.LEVEL_CAP ? ' (MAX)' : '')));
    levelRow.appendChild(makeInfoRow('Class', classLabel(c)));
    levelRow.appendChild(makeInfoRow('Monster Kills', String(c.monsterKills)));
    levelRow.appendChild(makeInfoRow('Deaths', String(c.deaths)));
    top.appendChild(scrollX(levelRow));

    var xpNeeded = Game.Character.xpNeededForNext(c);
    var xpInto = Game.Character.xpIntoCurrentLevel(c);
    // F1 balance-to-100: at BALANCE.LEVEL_CAP, xpNeededForNext returns 0 (nothing left to show
    // progress toward) — guard the percentage so it reads 100%/"MAX LEVEL" instead of NaN from a
    // 0/0 division.
    var atCap = c.level >= BALANCE.LEVEL_CAP;
    var xpPct = atCap ? 100 : Math.max(0, Math.min(100, Math.round((xpInto / xpNeeded) * 100)));
    top.appendChild(el('div', { class: 'mt8' }, [el('b', {}, ['Level Progress'])]));
    top.appendChild(el('div', { class: 'statbar-track', style: 'width:300px;' }, [
      el('div', { class: 'statbar-fill xp', style: 'width:' + xpPct + '%;' }),
      el('div', { class: 'statbar-text' }, [atCap ? 'MAX LEVEL' : (xpInto + ' / ' + xpNeeded + ' XP')])
    ]));

    top.appendChild(el('div', { class: 'mt8' }, [
      el('b', {}, ['Stat Points available: ' + c.statPoints + '   Training Points: ' + c.trainingPoints])
    ]));

    // v1.4 UX transparency pass (user-directed 2026-07-12): a level-up frequently lands a player
    // on the Status screen with unspent Stat Points and no explanation of what to do with them —
    // this banner spells it out and points at both the spend (+) and info (ⓘ) affordances below.
    if (c.statPoints > 0) {
      top.appendChild(el('div', { class: 'levelup-hint mt8' }, [
        'You have ' + c.statPoints + ' unspent Stat Point' + (c.statPoints === 1 ? '' : 's') +
        ' from leveling — click + to raise a stat, or ⓘ to see what it does.'
      ]));
    }

    var wealth = el('div', { class: 'mt8' }, [
      el('b', {}, ['Gold: ']), c.platinum + 'p ' + c.gold + 'g', '   ',
      el('b', {}, ['Anima Shards: ']), String(c.animaShards), '   ',
      // v1.4 P2 (G1): Advantage Points, a kills-only currency spent at a town's AA Exchange.
      el('b', {}, ['Advantage Points: ']), String(c.ap || 0)
    ]);
    top.appendChild(wealth);

    // Feature B (user-directed): afflictions shown in dark red (also shown on the battle "Your
    // Vitality" panel — see renderBattle above).
    if (Game.Character && Game.Character.hasAffliction && Game.Character.hasAffliction(c, 'haunting')) {
      top.appendChild(el('div', { class: 'mt8 affliction-red' }, ['Haunted — magical/consumable healing halved. Cleanse at a Spirit Shrine.']));
    }

    root.appendChild(top);

    // v1.4 UX transparency pass (user-directed 2026-07-12): "ⓘ" affordance next to a stat/pool
    // that has a Game.Data.statInfo entry (js/data/statinfo.js) — opens Game.Infobox.openStat,
    // which reuses the same overlay plumbing as the item/tech info windows. A plain unicode glyph
    // (not an icon asset) per the brief, so no new assets/test_icons.js coverage is needed.
    function statInfoGlyph(key, label) {
      return el('span', {
        class: 'info-btn',
        title: 'About ' + label,
        onclick: function (ev) {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          Game.Infobox.openStat(key, c);
        }
      }, ['ⓘ']);
    }

    // ---- Two-column reflow: left = primary stats + derived stats, right = skills ----
    // (v1.4 UX transparency pass; collapses to a single column at <=640px, see css/theme.css
    // .status-columns — matches the existing Mobile M1 640px breakpoint.)
    var columns = el('div', { class: 'status-columns' });
    var leftCol = el('div', { class: 'status-col status-col-left' });
    var rightCol = el('div', { class: 'status-col status-col-right' });

    var statNames = [
      ['strength', 'Strength'],
      ['vitality', 'Vitality'],
      ['dexterity', 'Dexterity'],
      ['intelligence', 'Intelligence'],
      ['endurance', 'Endurance']
    ];

    leftCol.appendChild(el('div', { class: 'tcat mt8' }, ['Primary Stats']));
    var statsPanel = el('div', { class: 'panel' });
    var statsBlock = el('div', { class: 'mt4' });
    statNames.forEach(function (pair) {
      var key = pair[0], label = pair[1];
      var row = el('div', { class: 'stat-row' }, [
        el('span', { class: 'stat-name' }, [label]),
        el('span', { class: 'stat-value' }, [String(c[key])]),
        statInfoGlyph(key, label),
        c.statPoints > 0 ? el('button', {
          class: 'button',
          onclick: function () {
            Game.Character.spendStatPoint(c, key);
            Game.persist();
            renderStatus(document.getElementById('maincontent'));
            Game.renderStatusBars();
          }
        }, ['+']) : null
      ]);
      statsBlock.appendChild(row);
    });
    statsPanel.appendChild(statsBlock);
    leftCol.appendChild(statsPanel);

    leftCol.appendChild(el('div', { class: 'tcat mt8' }, ['Derived Stats']));
    var derivedPanel = el('div', { class: 'panel' });
    var derivedBlock = el('div', { class: 'mt4' });
    derivedBlock.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Damage']),
      el('span', { class: 'stat-value' }, [String(Game.Character.getDamage(c))])
    ]));
    derivedBlock.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Armor']),
      el('span', { class: 'stat-value' }, [String(Game.Character.getArmor(c))])
    ]));
    derivedBlock.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Magic Armor']),
      el('span', { class: 'stat-value' }, [String(Game.Character.getMagicArmor(c))])
    ]));
    derivedBlock.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Hit Points']),
      el('span', { class: 'stat-value' }, [c.hitPoints + ' / ' + c.hitPointsMax]),
      statInfoGlyph('hitPoints', 'Hit Points')
    ]));
    derivedBlock.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Energy']),
      el('span', { class: 'stat-value' }, [c.energy + ' / ' + c.energyMax]),
      statInfoGlyph('energy', 'Energy')
    ]));
    derivedPanel.appendChild(derivedBlock);
    leftCol.appendChild(derivedPanel);

    // Skills table
    rightCol.appendChild(el('div', { class: 'tcat mt8' }, ['Skills']));
    var skillsPanel = el('div', { class: 'panel' });
    var cap = Game.Character.skillCap(c);
    skillsPanel.appendChild(el('div', { class: 'smallfont mt4' }, ['Skill cap at your level: ' + cap]));

    var skillTable = el('div', { class: 'hrpg-table mt4' });
    BALANCE.SKILLS.forEach(function (skillName, idx) {
      var sk = c.skills[skillName];
      var xpForNext = skillXpForLevel(sk.level + 1);
      var pct = xpForNext > 0 ? Math.min(100, Math.round((sk.xp / xpForNext) * 100)) : 0;
      var row = el('div', { class: 'stat-row alt' + (idx % 2) }, [
        el('span', { class: 'stat-name' }, [skillName]),
        el('span', { class: 'stat-value' }, ['Lv ' + sk.level]),
        el('span', { class: 'skill-xp-track' }, [el('span', { class: 'skill-xp-fill', style: 'width:' + pct + '%; display:block;' })]),
        el('span', { class: 'tinyfont skill-effect' }, [skillEffectFor(c, skillName)])
      ]);
      skillTable.appendChild(row);
    });
    skillsPanel.appendChild(scrollX(skillTable));
    rightCol.appendChild(skillsPanel);

    columns.appendChild(leftCol);
    columns.appendChild(rightCol);
    root.appendChild(columns);
  }

  // ---------- Status: Classes tab (Phase 6a; DESIGN.md §3, Classes.md) ----------
  // Archived layout: "On the right side of the page you will now notice an icon representing
  // your newly-obtained class. Drag this icon to the box labeled 'Primary.'" Our UI substitutes
  // click-to-assign buttons for drag-and-drop (phase brief), and a Deactivate button carries the
  // archived permanent-wipe warning text verbatim in its confirm dialog.
  // v1.1 revision (DESIGN.md §3): 'Base' / 'Advanced' / 'Legendary', keyed off classDef.tier.
  // v1.2 Phase 2 (docs/SPEC-V1.2.md Phase 2) adds 'Third Tier' for tier 3 (Shadowknight/Magus/
  // Gambit) and moves Legendary to tier 4 (Runeblade/Vaultbreaker/Heir of the Echo) — checked via
  // classDef.legendary first so the label is robust to the exact tier number.
  function tierLabel(classDef) {
    if (classDef.legendary) return 'Legendary';
    if (classDef.tier === 3) return 'Third Tier';
    if (classDef.tier === 2) return 'Advanced';
    return 'Base';
  }

  // Baseline lineage suffix for an advanced (tier 2) class, e.g. " (advances Warrior)".
  function lineageSuffix(classDef) {
    if (!classDef.baseClass) return '';
    var baseDef = Game.Classes.getClass(classDef.baseClass);
    return ' (advances ' + (baseDef ? baseDef.name : classDef.baseClass) + ')';
  }

  function renderStatusClasses(root, c) {
    if (!c.classes) c.classes = {};

    // revised: user-directed v1.1, overrides archived level-30 first-class rule (Classes.md:
    // "you must be at least level 30 in order to obtain a class") — the base trio now arrives at
    // level 5 via "The First Calling" (js/data/quests.js first_calling).
    if (c.level < 5 && Object.keys(c.classes).length === 0) {
      root.appendChild(el('div', { class: 'panel mt8' }, [
        el('div', { class: 'smallfont' }, [
          'Your first class awaits at level 5 — seek the tavern in Eldor.'
        ])
      ]));
      return;
    }

    // ---- Primary / Secondary boxes ----
    root.appendChild(el('div', { class: 'tcat mt8' }, ['Active Classes']));
    var activePanel = el('div', { class: 'panel' });
    ['primary', 'secondary'].forEach(function (slot) {
      var key = slot === 'primary' ? 'primaryClass' : 'secondaryClass';
      var classId = c[key];
      var classDef = classId ? Game.Classes.getClass(classId) : null;
      var row = el('div', { class: 'stat-row' });
      row.appendChild(el('span', { class: 'stat-name' }, [slot === 'primary' ? 'Primary' : 'Secondary']));
      row.appendChild(el('span', { class: 'stat-value' }, [
        classDef ? (classDef.name + lineageSuffix(classDef)) : '(empty box)'
      ]));
      if (classDef) {
        var entry = c.classes[classId] || { classXp: 0, classLevelsEarned: 0, classLevelsSpent: 0 };
        // +2/+1 offset matches Game.Classes.grantClassXp's level-up threshold convention (see
        // that function's comment): classLevelsEarned already counts "class level 1" at zero.
        var xpForNext = Game.Classes.classXpForLevel(entry.classLevelsEarned + 2);
        var xpBase = Game.Classes.classXpForLevel(entry.classLevelsEarned + 1);
        var xpPct = xpForNext > xpBase ? Math.min(100, Math.round(((entry.classXp - xpBase) / (xpForNext - xpBase)) * 100)) : 0;
        row.appendChild(el('span', { class: 'tinyfont' }, [
          ' Class Lv ' + entry.classLevelsEarned + ' (' + Math.max(0, entry.classXp - xpBase) + '/' + Math.max(1, xpForNext - xpBase) + ' XP), unspent: ' +
          Game.Classes.unspentClassLevels(c, classId)
        ]));
        row.appendChild(el('button', {
          class: 'button',
          onclick: function () {
            // archived WARNING (Classes.md): deactivating permanently wipes that class's XP,
            // Class Levels, and abilities — confirm text mirrors the manual almost verbatim.
            var warn = 'Deactivate ' + classDef.name + '? You will lose all skills, abilities, ' +
              'Class Experience, and Class Levels in that class. This action cannot be undone and ' +
              'is completely permanent. If you wish to rebuild the class, you will need to simply ' +
              'activate it again.';
            if (!window.confirm(warn)) return;
            var res = Game.Classes.deactivate(c, slot);
            if (!res.ok) alert(res.message);
            Game.persist();
            refreshStatusScreen();
          }
        }, ['Deactivate']));
      }
      activePanel.appendChild(row);
    });
    root.appendChild(activePanel);

    // Sorts class ids by tier (Base 1 -> Advanced 2 -> Third Tier 3 -> Legendary 4, DESIGN.md §3
    // v1.1 revision + v1.2 Phase 2), dropping any id with no resolvable definition. Used by both
    // the Inactive Classes list and the Class Abilities roster below so each groups consistently.
    function sortByTier(ids) {
      return ids
        .map(function (id) { return { id: id, def: Game.Classes.getClass(id) }; })
        .filter(function (rec) { return !!rec.def; })
        .sort(function (a, b) { return (a.def.tier || 1) - (b.def.tier || 1); });
    }

    // ---- Inactive (obtained-but-not-slotted) classes: click to assign ----
    root.appendChild(el('div', { class: 'tcat mt8' }, ['Inactive Classes']));
    var inactivePanel = el('div', { class: 'panel' });
    var inactiveIds = Object.keys(c.classes).filter(function (id) {
      return c.primaryClass !== id && c.secondaryClass !== id;
    });
    var inactiveRecs = sortByTier(inactiveIds);
    if (inactiveRecs.length === 0) {
      inactivePanel.appendChild(el('div', { class: 'smallfont' }, ['No inactive classes.']));
    } else {
      var lastInactiveTier = null;
      inactiveRecs.forEach(function (rec, idx) {
        var classId = rec.id;
        var classDef = rec.def;
        if (tierLabel(classDef) !== lastInactiveTier) {
          lastInactiveTier = tierLabel(classDef);
          inactivePanel.appendChild(el('div', { class: 'tcat2' + (idx > 0 ? ' mt8' : '') }, [lastInactiveTier]));
        }
        var entry = c.classes[classId];
        var row = el('div', { class: 'stat-row alt' + (idx % 2) }, [
          el('span', { class: 'stat-name' }, [classDef.name + lineageSuffix(classDef)]),
          el('span', { class: 'tinyfont' }, [' Class Lv ' + entry.classLevelsEarned]),
          el('button', {
            class: 'button',
            disabled: c.primaryClass ? 'disabled' : null,
            onclick: function () {
              var res = Game.Classes.activate(c, classId, 'primary');
              if (!res.ok) alert(res.message);
              Game.persist();
              refreshStatusScreen();
            }
          }, ['Set Primary']),
          el('button', {
            class: 'button',
            disabled: c.secondaryClass ? 'disabled' : null,
            onclick: function () {
              var res = Game.Classes.activate(c, classId, 'secondary');
              if (!res.ok) alert(res.message);
              Game.persist();
              refreshStatusScreen();
            }
          }, ['Set Secondary'])
        ]);
        inactivePanel.appendChild(row);
      });
    }
    root.appendChild(inactivePanel);

    // ---- Ability roster per obtained class (owned + available, read-only here; purchased at
    // the Academy's Class Abilities section) ----
    root.appendChild(el('div', { class: 'tcat mt8' }, ['Class Abilities']));
    var abilitiesPanel = el('div', { class: 'panel' });
    var obtainedRecs = sortByTier(Object.keys(c.classes));
    if (obtainedRecs.length === 0) {
      abilitiesPanel.appendChild(el('div', { class: 'smallfont' }, ['You have not obtained any classes yet.']));
    } else {
      var lastAbilityTier = null;
      obtainedRecs.forEach(function (rec, idx) {
        var classId = rec.id;
        var classDef = rec.def;
        var entry = c.classes[classId];
        if (tierLabel(classDef) !== lastAbilityTier) {
          lastAbilityTier = tierLabel(classDef);
          abilitiesPanel.appendChild(el('div', { class: idx > 0 ? 'tcat mt8' : 'tcat' }, [lastAbilityTier]));
        }
        abilitiesPanel.appendChild(el('div', { class: 'tcat2 mt4' }, [classDef.name + lineageSuffix(classDef)]));
        classDef.abilities.forEach(function (ability) {
          var owned = entry.abilities.indexOf(ability.id) !== -1;
          abilitiesPanel.appendChild(el('div', { class: 'stat-row' + (owned ? ' greyed' : '') }, [
            el('span', { class: 'stat-name' }, [ability.name]),
            el('span', { class: 'tinyfont' }, [ability.classLevelCost + ' Class Lv' + (owned ? ' — owned' : '')]),
            el('span', { class: 'tinyfont' }, [ability.desc])
          ]));
        });
      });
      abilitiesPanel.appendChild(el('div', { class: 'smallfont mt8' }, ['Purchase abilities at an Academy (Town screen) while the class is active.']));
    }
    root.appendChild(abilitiesPanel);
  }

  function skillXpForLevel(lvl) {
    return BALANCE.SKILL_XP_FOR_LEVEL(lvl); // invented curve, centralized in balance.js (Phase 3)
  }

  function makeInfoRow(label, value) {
    return el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, [label]),
      el('span', {}, [value])
    ]);
  }

  // v1.2 Phase 1: skill-effect display (SPEC-V1.2.md Phase 1 file list — "minimal js/ui/
  // screens.js for the offhand slot and skill-effect display"). Read-only: mirrors the same
  // formulas js/core/character.js, js/core/inventory.js, and js/core/battle.js apply, so the
  // Status screen's Skills table shows what each skill is currently worth in combat.
  var SKILL_EFFECT_WEAPON_SKILLS = ['Swords', 'Polearms', 'Knives', 'Rods', 'Hand to Hand'];
  var SKILL_EFFECT_ARMOR_SKILLS = ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields'];

  function skillEffectFor(c, skillName) {
    var lvl = (c.skills[skillName] && c.skills[skillName].level) || 0;
    if (SKILL_EFFECT_WEAPON_SKILLS.indexOf(skillName) !== -1) {
      var dmgPct = Math.min(BALANCE.WEAPON_SKILL_DAMAGE_PER_LEVEL * lvl, BALANCE.WEAPON_SKILL_DAMAGE_CAP);
      return '+' + Math.round(dmgPct * 100) + '% Damage when wielded';
    }
    if (SKILL_EFFECT_ARMOR_SKILLS.indexOf(skillName) !== -1) {
      var armorPct = Math.min(BALANCE.ARMOR_SKILL_ARMOR_PER_LEVEL * lvl, BALANCE.ARMOR_SKILL_ARMOR_CAP);
      return '+' + Math.round(armorPct * 100) + '% Armor when worn';
    }
    if (skillName === 'Dodge' && Game.Battle && Game.Battle.playerDodgeChance) {
      return Math.round(Game.Battle.playerDodgeChance(c) * 100) + '% Dodge chance';
    }
    if (skillName === 'Double Attack' && Game.Battle && Game.Battle.playerDoubleAttackChance) {
      return Math.round(Game.Battle.playerDoubleAttackChance(c) * 100) + '% Double Attack chance';
    }
    if (skillName === 'Thievery') {
      var goldPct = Math.min(BALANCE.THIEVERY_GOLD_PER_LEVEL * lvl, BALANCE.THIEVERY_GOLD_CAP);
      var stealPct = Math.min(BALANCE.THIEVERY_STEAL_PER_LEVEL * lvl, BALANCE.THIEVERY_STEAL_CAP);
      return '+' + Math.round(goldPct * 100) + '% bonus gold, ' + Math.round(stealPct * 100) + '% steal chance';
    }
    if (skillName === 'Dual Wield') {
      var dwPct = Math.min(BALANCE.DUAL_WIELD_OFFHAND_MULT_BASE + BALANCE.DUAL_WIELD_OFFHAND_MULT_PER_LEVEL * lvl, BALANCE.DUAL_WIELD_OFFHAND_MULT_CAP);
      return Math.round(dwPct * 100) + '% offhand damage';
    }
    return '';
  }

  // ---------- Inventory screen (DESIGN.md §6, §8; New_Player_Guide.md "The Inventory Screen") ----------

  var SLOT_LABELS = {
    weapon: 'Weapon', offhand: 'Offhand', head: 'Head',
    body: 'Body', legs: 'Legs', feet: 'Feet'
  };

  function refreshInventoryScreen() {
    renderInventory(document.getElementById('maincontent'));
    Game.renderStatusBars();
    if (Game.renderActions) Game.renderActions();
  }

  function renderInventory(root) {
    root.innerHTML = '';
    var c = Game.state.character;
    Game.Inventory.ensureFields(c);

    root.appendChild(el('div', { class: 'tcat' }, ['Inventory']));

    var top = el('div', { class: 'panel' });
    var weight = Game.Inventory.currentWeight(c);
    var capacity = Game.Inventory.carryCapacity(c);
    top.appendChild(el('div', { class: 'mt4' }, [
      el('b', {}, ['Weight: ']), weight + ' / ' + capacity
    ]));
    root.appendChild(top);

    // ---- Equipment panel ----
    root.appendChild(el('div', { class: 'tcat mt8' }, ['Equipment']));
    var equipPanel = el('div', { class: 'panel' });
    Game.Inventory.EQUIP_SLOTS.forEach(function (slot, idx) {
      var itemId = c.equipment[slot];
      var item = itemId ? Game.Inventory.getItem(itemId) : null;

      var row = el('div', { class: 'stat-row alt' + (idx % 2) });
      row.appendChild(el('span', { class: 'stat-name' }, [SLOT_LABELS[slot]]));
      row.appendChild(item ? Game.UI.icon(item.id, 32) : el('span', { class: 'icon32' }));
      var label = el('span', {
        class: 'equip-slot-label',
        ondblclick: function () { if (item) Game.Infobox.open(item, c); }
      }, [item ? item.name : 'empty']);
      row.appendChild(label);

      if (item) {
        row.appendChild(el('button', {
          class: 'button',
          onclick: function () {
            var result = Game.Inventory.unequip(c, slot);
            if (!result.ok) { alert(result.message); return; }
            Game.persist();
            refreshInventoryScreen();
          }
        }, ['Unequip']));
        row.appendChild(el('button', {
          class: 'button',
          onclick: function () { Game.Infobox.open(item, c); }
        }, ['Info']));
      }

      Game.DragDrop.makeDropTarget(row, function (droppedId) {
        var dropped = Game.Inventory.getItem(droppedId);
        // Fix #8: dropping an item on the wrong equipment slot used to fail silently. Give the
        // same kind of feedback the Auto-Equip box already gives on a failed drop.
        if (!dropped || dropped.slot !== slot) { alert("That item doesn't fit that slot."); return; }
        var result = Game.Inventory.equip(c, droppedId);
        if (!result.ok) { alert('Cannot equip: ' + result.failures.join('; ')); return; }
        Game.persist();
        refreshInventoryScreen();
      });

      if (item) {
        Game.DragDrop.makeDraggable(row, itemId);
      }

      equipPanel.appendChild(row);
    });
    root.appendChild(scrollX(equipPanel));

    // ---- Drop boxes: Auto-Equip / Unequip / Discard (New_Player_Guide.md) ----
    root.appendChild(el('div', { class: 'tcat mt8' }, ['Drag & Drop']));
    var dropBoxWrap = el('div', { class: 'panel dropbox-row' });

    var autoEquipBox = el('div', { class: 'dropbox' }, [el('b', {}, ['Auto-Equip'])]);
    Game.DragDrop.makeDropTarget(autoEquipBox, function (droppedId) {
      var item = Game.Inventory.getItem(droppedId);
      if (!item || item.slot === 'none') { alert('This item cannot be equipped.'); return; }
      var result = Game.Inventory.equip(c, droppedId);
      if (!result.ok) { alert('Cannot equip: ' + result.failures.join('; ')); return; }
      Game.persist();
      refreshInventoryScreen();
    });

    var unequipBox = el('div', { class: 'dropbox' }, [el('b', {}, ['Unequip'])]);
    Game.DragDrop.makeDropTarget(unequipBox, function (droppedId) {
      var slot = null;
      Game.Inventory.EQUIP_SLOTS.forEach(function (s) { if (c.equipment[s] === droppedId) slot = s; });
      // Fix #8: dropping a non-equipped item on the Unequip box used to fail silently.
      if (!slot) { alert('That item is not currently equipped.'); return; }
      var result = Game.Inventory.unequip(c, slot);
      if (!result.ok) { alert(result.message); return; }
      Game.persist();
      refreshInventoryScreen();
    });

    var discardBox = el('div', { class: 'dropbox' }, [el('b', {}, ['Discard'])]);
    Game.DragDrop.makeDropTarget(discardBox, function (droppedId) {
      if (c.inventory.indexOf(droppedId) === -1) return; // only unequipped items
      var item = Game.Inventory.getItem(droppedId);
      // v1.6 P3 EI-3b: one-click discard for a quest_ material nothing can still need — see
      // isSpentQuestMaterial above. Everything else keeps the confirm, unchanged.
      if (!isSpentQuestMaterial(c, droppedId) &&
          !window.confirm('Discard ' + (item ? item.name : droppedId) + ' forever?')) return;
      Game.Inventory.discard(c, droppedId);
      Game.persist();
      refreshInventoryScreen();
    });

    dropBoxWrap.appendChild(autoEquipBox);
    dropBoxWrap.appendChild(unequipBox);
    dropBoxWrap.appendChild(discardBox);
    root.appendChild(dropBoxWrap);

    // ---- Inventory list ----
    root.appendChild(el('div', { class: 'tcat mt8' }, ['Backpack']));
    var listPanel = el('div', { class: 'panel' });

    if (c.inventory.length === 0) {
      listPanel.appendChild(el('div', { class: 'smallfont' }, ['Your backpack is empty.']));
    } else {
      c.inventory.forEach(function (itemId, idx) {
        var item = Game.Inventory.getItem(itemId);
        if (!item) return;
        var usable = Game.Inventory.canUse(c, item);

        var row = el('div', {
          class: 'stat-row alt' + (idx % 2),
          ondblclick: function () { Game.Infobox.open(item, c); }
        });
        row.appendChild(Game.UI.icon(item.id, 32));
        row.appendChild(el('span', { class: 'stat-name' + (usable.ok ? '' : ' req-bad') }, [item.name]));
        row.appendChild(el('span', { class: 'tinyfont' }, ['(' + (item.skill || item.tags.join(',') || 'misc') + ', wt ' + item.weight + ')']));

        if (item.slot !== 'none') {
          row.appendChild(el('button', {
            class: 'button',
            onclick: function () {
              var result = Game.Inventory.equip(c, itemId);
              if (!result.ok) { alert('Cannot equip: ' + result.failures.join('; ')); return; }
              Game.persist();
              refreshInventoryScreen();
            }
          }, ['Equip']));
        }

        row.appendChild(el('button', {
          class: 'button',
          onclick: function () {
            // v1.6 P3 EI-3b: one-click discard for a quest_ material nothing can still need.
            if (!isSpentQuestMaterial(c, itemId) &&
                !window.confirm('Discard ' + item.name + ' forever?')) return;
            Game.Inventory.discard(c, itemId);
            Game.persist();
            refreshInventoryScreen();
          }
        }, ['Discard']));

        row.appendChild(el('button', {
          class: 'button',
          onclick: function () { Game.Infobox.open(item, c); }
        }, ['Info']));

        Game.DragDrop.makeDraggable(row, itemId);
        listPanel.appendChild(row);
      });
    }

    root.appendChild(scrollX(listPanel));
  }

  // ---------- Techs screen (Phase 3; Techniques.md, Techs.md) ----------

  var techsSelectedId = null; // tech id selected in the known list, pending slot assignment
  var techsActiveSet = 0; // which of the 3 sets is shown on the Techs screen
  // v1.8 P4 (Task A): the "techs page" type tabs — archived precedent "Added tabs to the techs
  // page to sort techniques by type" [archived: reference/manual/Version_2.1_Changes.md].
  var techsTypeTab = 'all';

  function getTechById(id) {
    var list = Game.Data.techs || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function refreshTechsScreen() {
    renderTechs(document.getElementById('maincontent'));
  }

  function renderTechs(root) {
    root.innerHTML = '';
    var c = Game.state.character;

    root.appendChild(el('div', { class: 'tcat' }, ['Techs']));

    // ---- Known techniques list ----
    var listPanel = el('div', { class: 'panel' });
    listPanel.appendChild(el('div', { class: 'smallfont' }, [
      'Click a technique to select it, then click a set slot to equip it. ' +
      'Click a filled slot to clear it. Double-click a technique for info.'
    ]));

    if (!c.techs || c.techs.length === 0) {
      listPanel.appendChild(el('div', { class: 'smallfont mt8' }, ['You know no techniques yet. Visit an Academy to learn some.']));
    } else {
      var knownTechDefs = c.techs.map(getTechById).filter(function (t) { return !!t; });
      listPanel.appendChild(techCategoryTabs(techsTypeTab, function (cat) {
        techsTypeTab = cat;
        refreshTechsScreen();
      }, knownTechDefs));

      var shownTechIds = techsTypeTab === 'all'
        ? c.techs
        : c.techs.filter(function (techId) {
          var t = getTechById(techId);
          return t && techCategory(t) === techsTypeTab;
        });

      if (shownTechIds.length === 0) {
        listPanel.appendChild(el('div', { class: 'smallfont mt8' }, ['No known techniques in this category.']));
      }
      shownTechIds.forEach(function (techId, idx) {
        var tech = getTechById(techId);
        if (!tech) return;
        var selected = techsSelectedId === techId;
        var row = el('div', {
          class: 'stat-row tech-row alt' + (idx % 2) + (selected ? ' selected' : ''),
          onclick: function () {
            techsSelectedId = selected ? null : techId;
            refreshTechsScreen();
          },
          ondblclick: function () { Game.Infobox.openTech(tech, c); }
        }, [
          techIcon(tech),
          el('span', { class: 'stat-name' }, [techDisplayName(tech)]),
          // v1.6 P1 (CB-4, SPEC-V1.6-REBALANCE.md §6): show the ACTUAL Energy cost (Rod-discounted
          // for an offensive tech while a Rod is equipped), via the same helper useTech charges
          // from, so this readout never disagrees with battle.
          el('span', { class: 'tinyfont' }, ['(' + (tech.skill || '?') + (tech.grade ? ', ' + tech.grade : '') + ', ' + Game.Battle.effectiveTechEnergyCost(c, tech) + ' energy)']),
          el('button', {
            class: 'button',
            onclick: function (ev) { if (ev && ev.stopPropagation) ev.stopPropagation(); Game.Infobox.openTech(tech, c); }
          }, ['Info'])
        ]);
        listPanel.appendChild(row);
        // v1.8 P4 (Task A): second line naming the tech's buff/debuff/gate/goldSteal fields.
        var summary = techEffectSummary(tech);
        if (summary) {
          listPanel.appendChild(el('div', { class: 'tinyfont mt2', style: 'padding-left:38px;' }, [summary]));
        }
      });
    }
    root.appendChild(listPanel);

    // ---- 3 set tabs x 8 slots (Techniques.md: "equip up to three concurrent sets of 8 techs each") ----
    root.appendChild(el('div', { class: 'tcat mt8' }, ['Technique Sets']));
    var setsPanel = el('div', { class: 'panel' });

    var tabs = el('div', { class: 'techset-tabs' });
    for (var t = 0; t < 3; t++) {
      (function (tabIdx) {
        tabs.appendChild(el('span', {
          class: 'infobox-tab' + (techsActiveSet === tabIdx ? ' active' : ''),
          onclick: function () { techsActiveSet = tabIdx; refreshTechsScreen(); }
        }, ['Set ' + (tabIdx + 1)]));
      })(t);
    }
    setsPanel.appendChild(tabs);

    var grid = el('div', { class: 'techset-grid mt4' });
    var set = c.techSets[techsActiveSet];
    for (var s = 0; s < 8; s++) {
      (function (slotIdx) {
        var slottedId = set[slotIdx];
        var slotted = slottedId ? getTechById(slottedId) : null;
        var slot = el('div', {
          class: 'tech-slot' + (slotted ? ' filled' : ''),
          title: slotted ? slotted.name : 'Empty slot',
          onclick: function () {
            if (techsSelectedId) {
              set[slotIdx] = techsSelectedId;
              techsSelectedId = null;
            } else if (set[slotIdx]) {
              set[slotIdx] = null;
            }
            refreshTechsScreen();
          },
          ondblclick: function () { if (slotted) Game.Infobox.openTech(slotted, c); }
        }, [slotted ? techIcon(slotted) : el('span', { class: 'tinyfont' }, ['—'])]);
        grid.appendChild(slot);
      })(s);
    }
    setsPanel.appendChild(grid);

    // Save Settings persists the sets (Techniques.md: "Now click the 'Save Settings' button
    // in order to save the current technique setup.")
    setsPanel.appendChild(el('div', { class: 'mt8' }, [
      el('button', {
        class: 'button',
        onclick: function () {
          Game.persist();
          alert('Settings saved.');
        }
      }, ['Save Settings'])
    ]));

    root.appendChild(setsPanel);
  }

  // Phase 1-7: techs rendered as a unicode glyph by grade (DESIGN.md §8, "no copyrighted icons").
  // Phase 8: every player-usable tech now has a mapped pixel icon (assets/icons/, CC0 Dungeon
  // Crawl tiles — assets/CREDITS.md), so the glyph is kept only as the onerror-safe fallback
  // look-and-feel reference; the rendered element is the pixel icon (name via title tooltip on
  // the containing tech-slot/tech-row, set by callers).
  function techIcon(tech) {
    return Game.UI.icon(tech.id, 32);
  }

  // v1.8 P4 (SPEC-TECH-POLARITY.md §2.0; SPEC-V1.8-TECHS-AND-REACHABILITY.md §3 Task A): UI-only
  // presentation copies of js/core/battle.js's STAT_KIND_LABEL / debuffKind wording. Kept
  // independent rather than reading them off Game.Battle — js/core/battle.js is DOM-free per
  // CLAUDE.md and out of scope for this phase; the engine's own battle-log lines (useTech) remain
  // the single source of truth for what actually happens in a fight. This is purely how a tech's
  // details render BEFORE it's cast (Academy list, Techs screen, battle grid, infobox), and is
  // deliberately data-driven off the tech object's own fields — never a hardcoded id/count, so the
  // concurrent P3 agent's 72 new techs (js/data/techs.js) render correctly with zero changes here.
  var UI_STAT_KIND_LABEL = { armor: 'Armor', dodge: 'Dodge', double_attack: 'Double Attack', spellpower: 'Spell Power' };
  var UI_DEBUFF_KIND_LABEL = { damage: 'Damage', armor: 'Armor' };
  var UI_ARMOR_CLASS_LABEL = { light: 'Light Armor', medium: 'Medium Armor', heavy: 'Heavy Armor' };

  // D2 (SPEC-TECH-POLARITY.md §5, resolved): the Conjuration tech "Curse" (tech.chain === 'Curse')
  // must never be confusable with the player-afflicting Curse STATUS anywhere its name renders in
  // a list — disambiguated by appending its owning skill. A chain-name check, not a hardcoded id.
  function techDisplayName(tech) {
    if (!tech) return '';
    if (tech.chain === 'Curse') return tech.name + ' — ' + (tech.skill || 'Conjuration');
    return tech.name;
  }

  // One-line plain-English summary of a tech's v1.8 P1 fields (statKind buff / debuff / equipment
  // gates / goldSteal) — empty string for techs that carry none (every pre-v1.8 tech). Used
  // wherever a tech's details render outside the full infobox (Academy learn list, Techs screen
  // known-list, battle tech-slot tooltip).
  function techEffectSummary(tech) {
    if (!tech) return '';
    var parts = [];
    if (tech.effect === 'buff' && tech.statKind) {
      var buffLabel = UI_STAT_KIND_LABEL[tech.statKind] || tech.statKind;
      var buffDuration = tech.buffDuration || 3;
      if (tech.statKind === 'dodge' || tech.statKind === 'double_attack') {
        parts.push('+' + Math.round(tech.power * 100) + '% ' + buffLabel + ' for ' + buffDuration + ' turns');
      } else {
        parts.push('+' + tech.power + ' ' + buffLabel + ' for ' + buffDuration + ' turns');
      }
    }
    if (tech.effect === 'debuff') {
      var debuffDuration = tech.debuffDuration || 3;
      if (tech.debuffKind === 'bleed') {
        parts.push('Bleed ' + tech.power + '/turn for ' + debuffDuration + ' turns');
      } else {
        var debuffLabel = UI_DEBUFF_KIND_LABEL[tech.debuffKind] || tech.debuffKind;
        parts.push('Weakens enemy ' + debuffLabel + ' for ' + debuffDuration + ' turns');
      }
    }
    if (tech.requiresShield) parts.push('Requires: Shield');
    if (tech.requiresOffhandWeapon) parts.push('Requires: offhand weapon');
    if (tech.requiresArmorClass) parts.push('Requires: ' + (UI_ARMOR_CLASS_LABEL[tech.requiresArmorClass] || tech.requiresArmorClass) + ' worn');
    if (tech.goldSteal) parts.push('Steals ' + tech.goldSteal + ' gold on first hit, paid on victory');
    return parts.join(' — ');
  }

  // Category the Academy/Techs type tabs group by — purely tech.effect-driven. Order is fixed
  // (a stable enum of engine effect kinds, not tech ids/counts), but a tab only appears if at
  // least one tech in the list being shown actually uses that category.
  var TECH_CATEGORY_LABEL = { damage: 'Damage', drain: 'Drain', heal: 'Heal', buff: 'Buff', debuff: 'Debuff', summon: 'Summon' };
  var TECH_CATEGORY_ORDER = ['damage', 'drain', 'heal', 'buff', 'debuff', 'summon'];
  function techCategory(tech) {
    return (tech && tech.effect) || 'damage';
  }
  function techCategoryTabs(activeVal, onPick, availableTechs) {
    var present = {};
    (availableTechs || []).forEach(function (t) { present[techCategory(t)] = true; });
    var tabsWrap = el('div', { class: 'techset-tabs mt4' });
    tabsWrap.appendChild(el('span', {
      class: 'infobox-tab' + (activeVal === 'all' ? ' active' : ''),
      onclick: function () { onPick('all'); }
    }, ['All']));
    TECH_CATEGORY_ORDER.forEach(function (cat) {
      if (!present[cat]) return;
      tabsWrap.appendChild(el('span', {
        class: 'infobox-tab' + (activeVal === cat ? ' active' : ''),
        onclick: function () { onPick(cat); }
      }, [TECH_CATEGORY_LABEL[cat]]));
    });
    return tabsWrap;
  }

  // Re-exported on Game.UI (established by icons.js, loaded before this file — index.html script
  // order) so js/ui/infobox.js, loaded AFTER screens.js, can reuse the exact same wording without
  // duplicating it a third time.
  Game.UI = Game.UI || {};
  Game.UI.techDisplayName = techDisplayName;
  Game.UI.techEffectSummary = techEffectSummary;
  Game.UI.techCategory = techCategory;

  // ---------- Explore screen (Phase 4; New_Player_Guide.md §5.1-5.2 Traveling/Hunting) ----------
  // Current location panel, destination list with level-gated Explore buttons, and — in
  // hunting areas — a Hunt button (Phase 8: random encounter, replacing the old per-monster pick
  // list) + Camp, mirroring the sidebar ".: Actions" panel (Game.renderActions, index.html).

  function refreshExploreScreen() {
    renderExplore(document.getElementById('maincontent'));
    Game.renderStatusBars();
    if (Game.renderActions) Game.renderActions();
  }

  // Shared Hunt trigger — called from both this screen's Hunt button and the sidebar Actions
  // panel link (index.html Game.renderActions). archived encounter chance: forum/t-755.md.
  function performHunt() {
    var res = Game.World.hunt();
    if (!res.ok) { notify(res.message); return; }
    Game.persist();
    if (res.encounter) {
      battleReturnScreen = 'explore';
      navigate('battle');
    } else {
      notify(res.message);
      refreshExploreScreen();
    }
  }

  function renderExplore(root) {
    root.innerHTML = '';
    var c = Game.state.character;
    var area = Game.World.currentArea();

    root.appendChild(el('div', { class: 'tcat' }, ['Explore']));

    // ---- Current location panel ----
    var here = el('div', { class: 'panel' });
    here.appendChild(el('div', {}, [el('b', {}, [area ? area.name : 'Unknown']), area && area.boss ? ' [BOSS]' : '']));
    here.appendChild(el('div', { class: 'smallfont mt4' }, [area ? area.desc : '']));
    root.appendChild(here);

    // ---- Hunting-area section: Hunt (random encounter) + Lair(s) + quest tokens + Camp ----
    if (area && area.type === 'hunting') {
      root.appendChild(el('div', { class: 'tcat mt8' }, ['Hunting Grounds']));
      var actions = el('div', { class: 'panel' });

      // Flavor line naming what prowls the area (no direct fight buttons — regular monsters are
      // only reachable through Hunt's random encounter now).
      var regularMonsters = (area.monsters || [])
        .map(function (monsterId) { return Game.Battle.getMonsterDef(monsterId); })
        .filter(function (m) { return m && !m.boss; });
      if (regularMonsters.length > 0) {
        var flavorRow = el('div', { class: 'mt4' }, [el('b', {}, ['Prowling here:'])]);
        var flavorList = el('div', { class: 'mt4', style: 'display:flex; flex-wrap:wrap; gap:8px;' });
        regularMonsters.forEach(function (m) {
          flavorList.appendChild(el('span', { class: 'smallfont', style: 'display:flex; align-items:center; gap:3px;' }, [
            Game.UI.icon(m.id, 32), m.name
          ]));
        });
        actions.appendChild(flavorRow);
        actions.appendChild(flavorList);
      }

      actions.appendChild(el('div', { class: 'mt8' }, [
        el('button', {
          class: 'button',
          title: '95% chance to find a monster (archived: forum t-755.md)',
          onclick: performHunt
        }, ['Hunt'])
      ]));

      // Lair entry (e.g. Estari Ruin Warden): separate boss fight, gated at a higher minLevel
      // than the area itself. Bosses are never in the random Hunt table.
      if (area.lair) {
        var lairMonster = Game.Battle.getMonsterDef(area.lair.monsterId);
        if (lairMonster) {
          var lairLocked = c.level < area.lair.minLevel;
          var lairRow = el('div', { class: 'stat-row mt8' }, [
            Game.UI.icon(lairMonster.id, 32),
            lairLocked ? el('span', { class: 'tinyfont req-bad' }, ['Requires Level ' + area.lair.minLevel]) : el('button', {
              class: 'button',
              title: 'Fight ' + lairMonster.name,
              onclick: function () {
                battleReturnScreen = 'explore';
                var battle = Game.Battle.start(lairMonster.id);
                if (battle) navigate('battle');
              }
            }, ['⚔']),
            el('span', { class: 'stat-name', style: 'width:150px; flex:0 0 150px;' }, [area.lair.name + ': ' + lairMonster.name + ' [BOSS]']),
            el('span', { class: 'stat-value' }, ['Lv ' + lairMonster.level])
          ]);
          actions.appendChild(lairRow);
        }
      }

      // ---- Phase 5: quest touch-tokens (Standing Stones, DESIGN.md §7) ----
      // A token link appears only while an ACTIVE quest has an untouched touch-step token in
      // THIS area; touched or quest-less tokens stay hidden, keeping the panel uncluttered.
      // (Phase 8: the same links also appear in the sidebar Actions panel — shown in both.)
      if (Game.Quests) {
        (Game.Data.quests || []).forEach(function (quest) {
          var qEntry = Game.Quests.entry(c, quest.id);
          if (!qEntry || qEntry.status !== 'active') return;
          quest.steps.forEach(function (step) {
            if (step.kind !== 'touch') return;
            step.tokens.forEach(function (token, tokenIdx) {
              if (token.areaId !== area.id) return;
              if (qEntry.progress.touched && qEntry.progress.touched[token.areaId]) return;
              actions.appendChild(el('div', { class: 'mt8' }, [
                el('b', {}, [token.label]), ' ',
                el('button', {
                  class: 'button',
                  title: 'Touch the ' + token.label + ' (' + quest.name + ')',
                  onclick: function () {
                    var res = Game.Quests.touch(quest.id, tokenIdx);
                    notify(res.message);
                    refreshExploreScreen();
                  }
                }, ['Touch']),
                el('span', { class: 'tinyfont' }, [' Quest: ' + quest.name])
              ]));
            });
          });
        });
      }

      actions.appendChild(el('div', { class: 'mt8' }, [
        el('b', {}, ['Camp']), ' ',
        el('button', {
          class: 'button',
          title: 'Free, but risky — thieves or an ambush may find you in the night (archived: forum t-756.md).',
          onclick: function () {
            var res = Game.World.camp();
            if (!res.ok) { notify(res.message); return; }
            Game.persist();
            // Camping-risk ambush (js/core/world.js): lands on the battle screen, same as a Hunt
            // encounter (performHunt above), instead of just alerting the message. The toast is
            // called before navigate() but survives the transition anyway — #toastbar lives
            // outside #maincontent (index.html), so navigate()'s re-render of #maincontent into
            // the battle screen never wipes it; the ambush message stays visible on top of the
            // freshly-rendered battle screen for its full ~4s (or until tapped).
            if (res.event === 'ambush' && res.battle) {
              notify(res.message);
              battleReturnScreen = 'explore';
              navigate('battle');
            } else {
              notify(res.message);
              refreshExploreScreen();
            }
          }
        }, ['Camp'])
      ]));
      var tentQuality = Game.World.bestTentQuality(c);
      actions.appendChild(el('div', { class: 'tinyfont mt4' }, [
        'Camping restores ' + Math.round(tentQuality * 100) + '% of your max HP and Energy (best tent in your pack) — but risks a robbery or ambush in the night. Deposit gold at a Vault first to keep it safe.'
      ]));

      // ---- v1.4 P4 (G4): Forage — beside Camp, same risk profile, no HP/Energy recovery ----
      actions.appendChild(el('div', { class: 'mt8' }, [
        el('b', {}, ['Forage']), ' ',
        el('button', {
          class: 'button',
          title: 'Search the area for materials and provisions — free, but shares Camp\'s risk of robbery or ambush (archived: forum t-756.md).',
          onclick: function () {
            var res = Game.World.forage();
            if (!res.ok) { notify(res.message); return; }
            Game.persist();
            // Forage's ambush risk (js/core/world.js) lands on the battle screen, same as Camp's
            // (see the toast/navigate ordering note on the Camp handler above).
            if (res.event === 'ambush' && res.battle) {
              notify(res.message);
              battleReturnScreen = 'explore';
              navigate('battle');
            } else {
              notify(res.message);
              refreshExploreScreen();
            }
          }
        }, ['Forage'])
      ]));
      actions.appendChild(el('div', { class: 'tinyfont mt4' }, [
        'Foraging never restores HP or Energy, but can turn up local materials or provisions — it shares Camp\'s same risk of a robbery or ambush.'
      ]));

      root.appendChild(actions);
    }

    // ---- Destinations ----
    // Phase U (v1.7 SPEC-V1.7-CONTENT-UX.md §1): card grid instead of a plain stat-row table, each
    // card showing a Town/Wilds badge and a recommended level range derived from the area's own
    // monster roster (see destLevelRange below).
    root.appendChild(el('div', { class: 'tcat mt8' }, ['Destinations']));
    var destGrid = el('div', { class: 'dest-grid' });
    (Game.Data.areas || []).forEach(function (dest, idx) {
      if (area && dest.id === area.id) return; // don't list the current location as a destination
      // v1.3.1 fix 4 [invented] home-town exemption (js/core/world.js travelTo mirrors this same
      // check): a character's own racial home town is always reachable regardless of minLevel, so
      // the UI lock must agree with what travelTo will actually allow — fixes the backlogged bug
      // where an Arkan below L14 saw Saratus as locked despite travelTo letting them in.
      var isHome = Game.Character && Game.Character.homeTownId && Game.Character.homeTownId(c) === dest.id;
      var locked = !isHome && c.level < dest.minLevel;

      var card = el('div', { class: 'dest-card' });
      card.appendChild(el('div', { class: 'dest-card-head' }, [
        el('span', { class: 'dest-card-name' }, [dest.name]),
        el('span', { class: 'dest-badge' }, [dest.type === 'town' ? 'Town' : 'Wilds'])
      ]));
      var rangeText = destLevelRange(dest);
      if (rangeText) {
        card.appendChild(el('div', { class: 'tinyfont dest-levels' }, [rangeText]));
      }
      card.appendChild(el('div', { class: 'smallfont dest-card-desc' }, [dest.desc]));
      card.appendChild(el('div', { class: 'dest-card-action' }, [
        locked
          ? el('span', { class: 'tinyfont req-bad' }, ['Requires Level ' + dest.minLevel])
          : el('button', {
              class: 'button',
              onclick: function () {
                var res = Game.World.travelTo(dest.id);
                if (!res.ok) { alert(res.message); return; }
                refreshExploreScreen();
              }
            }, ['Explore'])
      ]));
      destGrid.appendChild(card);
    });
    root.appendChild(destGrid);
  }

  // Recommended level range for a Destinations card, derived from the area's own monster roster
  // (dest.monsters, plus dest.lair.monsterId when present) rather than a separate authored field —
  // js/data/areas.js has no such field, and monster .level is already the source of truth for
  // per-area difficulty elsewhere (e.g. the XP/loot-cutoff gap checks in tests/test_p4_world.js).
  // Towns carry no monsters: shows the town's own minLevel gate instead (omitted for Eldor's Lv 0,
  // since "enter at Lv 0" is not meaningful information).
  function destLevelRange(dest) {
    var ids = (dest.monsters || []).slice();
    if (dest.lair && dest.lair.monsterId) ids.push(dest.lair.monsterId);
    var levels = ids
      .map(function (id) { return Game.Battle.getMonsterDef(id); })
      .filter(function (m) { return !!m; })
      .map(function (m) { return m.level; });
    if (levels.length === 0) {
      if (dest.type === 'town') {
        return dest.minLevel > 0 ? ('Town · enter at Lv ' + dest.minLevel) : null;
      }
      return null;
    }
    var min = Math.min.apply(null, levels);
    var max = Math.max.apply(null, levels);
    return min === max ? ('Lv ' + min) : ('Lv ' + min + '–' + max);
  }

  // ---------- Town screen (Phase 4; DESIGN.md §6, New_Player_Guide.md §5.1 facility order) ----------
  // Facility list for the current town: Shop / Synthesis / Inn / Vault / Academy / Spirit
  // Shrine, each an expandable sub-panel. If currentLocation is not a town, shows the archived
  // "There is no town here." message.

  var townOpenFacility = null; // which facility panel is expanded ('shop'|'synthesis'|'inn'|'vault'|'academy'|'shrine')
  var townVaultGoldAmount = '';

  function refreshTownScreen() {
    renderTown(document.getElementById('maincontent'));
    Game.renderStatusBars();
    if (Game.renderActions) Game.renderActions();
  }

  var FACILITY_LABELS = {
    shop: 'Shop', synthesis: 'Synthesis Shop', inn: 'Inn',
    vault: 'Vault', academy: 'Academy', shrine: 'Spirit Shrine',
    tavern: 'Tavern', exchange: 'AA Exchange' // v1.4 P2 (G1): the AA Exchange facility
  };

  // Order per New_Player_Guide.md §5.1 facility mention order (Tavern is §5.1.5, between Vault
  // and Academy in the guide; appended after Shrine here to keep the Phase 4 layout stable).
  // v1.4 P2 (G1): 'exchange' inserted right after 'shop' — same buy-facing facility shape, just
  // priced in Advantage Points instead of gold.
  var FACILITY_ORDER = ['shop', 'exchange', 'synthesis', 'inn', 'vault', 'academy', 'shrine', 'tavern'];

  function renderTown(root) {
    root.innerHTML = '';
    var c = Game.state.character;
    var area = Game.World.currentArea();

    root.appendChild(el('div', { class: 'tcat' }, ['Town']));

    if (!area || area.type !== 'town') {
      root.appendChild(el('div', { class: 'panel' }, ['There is no town here.']));
      return;
    }

    var here = el('div', { class: 'panel' });
    here.appendChild(el('div', {}, [el('b', {}, [area.name])]));
    here.appendChild(el('div', { class: 'smallfont mt4' }, [area.desc]));
    root.appendChild(here);

    var presentTypes = {};
    (area.facilities || []).forEach(function (f) { presentTypes[f.type] = f; });

    root.appendChild(el('div', { class: 'tcat mt8' }, ['Facilities']));
    var facPanel = el('div', { class: 'panel' });

    // [revised] user-directed UI change (v1.4, 2026-07-11): master->detail instead of the old
    // accordion that stacked EVERY facility on one screen (duplicating the Actions panel's
    // quick-link list). Nothing selected -> a plain directory, one row per facility; selected
    // (here or via an Actions quick-link -> openTownFacility) -> ONLY that facility's options,
    // with a back row to return to the directory.
    if (townOpenFacility && !presentTypes[townOpenFacility]) {
      // Stale selection carried over from another town (e.g. opened the Shrine in Eldor, then
      // traveled somewhere without one) — reset to the directory instead of an empty panel.
      townOpenFacility = null;
    }

    if (!townOpenFacility) {
      var rowIdx = 0;
      FACILITY_ORDER.forEach(function (type) {
        if (!presentTypes[type]) return;
        var header = el('div', {
          class: 'stat-row alt' + (rowIdx % 2),
          style: 'cursor:pointer;',
          onclick: function () {
            townOpenFacility = type;
            refreshTownScreen();
          }
        }, [
          el('span', { class: 'stat-name' }, ['▸ ' + FACILITY_LABELS[type]])
        ]);
        facPanel.appendChild(header);
        rowIdx++;
      });
    } else {
      var type = townOpenFacility;
      var header = el('div', {
        class: 'stat-row alt0',
        style: 'cursor:pointer;',
        onclick: function () {
          townOpenFacility = null;
          refreshTownScreen();
        }
      }, [
        el('span', { class: 'stat-name' }, ['◂ ' + FACILITY_LABELS[type] + ' — back to all facilities'])
      ]);
      facPanel.appendChild(header);
      var body = el('div', { class: 'mt4 mb8' });
      if (type === 'shop') renderShopPanel(body, c, area, presentTypes.shop);
      else if (type === 'exchange') renderExchangePanel(body, c, area, presentTypes.exchange);
      else if (type === 'synthesis') renderSynthesisPanel(body, c);
      else if (type === 'inn') renderInnPanel(body, c);
      else if (type === 'vault') renderVaultPanel(body, c);
      else if (type === 'academy') renderAcademyPanel(body, c);
      else if (type === 'shrine') renderShrinePanel(body, c);
      else if (type === 'tavern') renderTavernPanel(body, c, area);
      // v1.4 Mobile M2 (audit A9): a single wrap here covers every facility sub-panel's wide
      // rows (shop/exchange/synthesis/academy/shrine/etc. all render into this shared `body`).
      facPanel.appendChild(scrollX(body));
    }
    root.appendChild(facPanel);
  }

  // ---- Shop sub-panel: buy list w/ prices + sellable inventory w/ sale prices ----
  function renderShopPanel(body, c, area, shopFacility) {
    body.appendChild(el('div', { class: 'tcat2' }, ['Buy']));
    var stock = shopFacility.stock || [];
    stock.forEach(function (itemId, idx) {
      var item = Game.Inventory.getItem(itemId);
      if (!item) return;
      var afford = Game.Character.goldTotalAsGold(c) >= item.value;
      var row = el('div', { class: 'stat-row alt' + (idx % 2) }, [
        Game.UI.icon(item.id, 32),
        el('span', { class: 'stat-name', style: 'width:170px; flex:0 0 170px;' }, [item.name]),
        el('span', { class: 'tinyfont' }, [item.value + 'g']),
        el('button', {
          class: 'button',
          disabled: afford ? null : 'disabled',
          onclick: function () {
            var res = Game.World.buy(itemId);
            if (!res.ok) alert(res.message);
            refreshTownScreen();
          }
        }, ['Buy']),
        el('button', { class: 'button', onclick: function () { Game.Infobox.open(item, c); } }, ['Info'])
      ]);
      body.appendChild(row);
    });

    body.appendChild(el('div', { class: 'tcat2 mt8' }, ['Sell (your inventory)']));
    if (!c.inventory.length) {
      body.appendChild(el('div', { class: 'smallfont mt4' }, ['Nothing to sell.']));
    } else {
      c.inventory.forEach(function (itemId, idx) {
        var item = Game.Inventory.getItem(itemId);
        if (!item) return;
        var row = el('div', { class: 'stat-row alt' + (idx % 2) }, [
          Game.UI.icon(item.id, 32),
          el('span', { class: 'stat-name', style: 'width:170px; flex:0 0 170px;' }, [item.name]),
          el('span', { class: 'tinyfont' }, [Game.World.sellValue(item) + 'g']),
          el('button', {
            class: 'button',
            onclick: function () {
              // Fix #5: js/core/world.js sell() will happily sell 'unique' (monster-drop-only,
              // never restockable) or 'quest_'-prefixed items with no warning. Confirm those two
              // cases only; ordinary items keep the existing 1-click sell. Wording mirrors the
              // Discard confirm above ("Discard X forever?").
              // v1.6 P3 EI-3b: a quest_ material nothing can still need (isSpentQuestMaterial,
              // EI-3a) is exempted from the confirm too — it's pure zero-utility junk at that
              // point, the exact per-item nag the feedback called out. A quest_ item some quest
              // is STILL actively collecting keeps the confirm (selling it away mid-collection
              // would cost real progress).
              var isIrreplaceable = (item.tags && item.tags.indexOf('unique') !== -1) ||
                (itemId.indexOf('quest_') === 0 && !isSpentQuestMaterial(c, itemId));
              if (isIrreplaceable && !window.confirm('Sell ' + item.name + ' forever? This item cannot be bought back.')) return;
              var res = Game.World.sell(itemId);
              if (!res.ok) alert(res.message);
              refreshTownScreen();
            }
          }, ['Sell'])
        ]);
        body.appendChild(row);
      });
    }
  }

  // ---- AA Exchange sub-panel (v1.4 P2, G1): buy list priced in Advantage Points instead of
  // gold — mirrors renderShopPanel's Buy list exactly (icon, name, cost, Buy/Info), but reads
  // stock as { itemId, costAp } pairs and calls Game.World.buyAp instead of buy(). No Sell
  // section: the Exchange is AP-in/item-out only (spec §7 — AP is never gold-convertible, and
  // items bought here are ordinary inventory items sellable for gold at any shop like any other).
  function renderExchangePanel(body, c, area, exchangeFacility) {
    body.appendChild(el('div', { class: 'tcat2' }, ['Buy with Advantage Points']));
    body.appendChild(el('div', { class: 'smallfont mt4 mb4' }, ['You have ' + (c.ap || 0) + ' Advantage Points.']));
    var stock = exchangeFacility.stock || [];
    stock.forEach(function (entry, idx) {
      var item = Game.Inventory.getItem(entry.itemId);
      if (!item) return;
      var afford = (c.ap || 0) >= entry.costAp;
      var row = el('div', { class: 'stat-row alt' + (idx % 2) }, [
        Game.UI.icon(item.id, 32),
        el('span', { class: 'stat-name', style: 'width:170px; flex:0 0 170px;' }, [item.name]),
        el('span', { class: 'tinyfont' }, [entry.costAp + ' AP']),
        el('button', {
          class: 'button',
          disabled: afford ? null : 'disabled',
          onclick: function () {
            var res = Game.World.buyAp(entry.itemId);
            if (!res.ok) alert(res.message);
            refreshTownScreen();
          }
        }, ['Buy']),
        el('button', { class: 'button', onclick: function () { Game.Infobox.open(item, c); } }, ['Info'])
      ]);
      body.appendChild(row);
    });
  }

  // ---- Synthesis sub-panel: recipe list, inputs have/missing color, gold + output ----
  function renderSynthesisPanel(body, c) {
    (Game.Data.recipes || []).forEach(function (recipe, idx) {
      var missing = Game.World.missingInputs(c, recipe);
      var missingIds = {};
      missing.forEach(function (m) { missingIds[m.itemId] = m.shortfall; });
      var outputItem = Game.Inventory.getItem(recipe.output);

      var inputCounts = {};
      recipe.inputs.forEach(function (id) { inputCounts[id] = (inputCounts[id] || 0) + 1; });

      var inputSpans = Object.keys(inputCounts).map(function (id) {
        var it = Game.Inventory.getItem(id);
        var need = inputCounts[id];
        var have = missingIds[id] !== undefined;
        return el('span', { class: 'stat-row', style: 'margin-right:6px; display:inline-flex;' }, [
          Game.UI.icon(id, 32),
          el('span', { class: have ? 'req-bad' : '' }, [(need > 1 ? need + 'x ' : '') + (it ? it.name : id)])
        ]);
      });

      var canAfford = Game.Character.goldTotalAsGold(c) >= recipe.gold;
      var canMake = missing.length === 0 && canAfford;

      var row = el('div', { class: 'stat-row alt' + (idx % 2) }, [
        el('span', { style: 'display:flex; flex-wrap:wrap;' }, inputSpans),
        el('span', { class: 'tinyfont', style: 'display:inline-flex; align-items:center; gap:3px;' }, [
          ' -> ', Game.UI.icon(recipe.output, 32), (outputItem ? outputItem.name : recipe.output) + ' (' + recipe.gold + 'g) '
        ]),
        el('button', {
          class: 'button',
          disabled: canMake ? null : 'disabled',
          onclick: function () {
            var res = Game.World.synthesize(recipe.id);
            if (!res.ok) alert(res.message);
            refreshTownScreen();
          }
        }, ['Synthesize'])
      ]);
      body.appendChild(row);
    });
  }

  // ---- Inn sub-panel: fee + Rest button ----
  function renderInnPanel(body, c) {
    var fee = Game.World.innFee(c);
    body.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Rest Fee']),
      el('span', {}, [fee + ' gold — full HP/Energy restore, Fury reset'])
    ]));
    // Contrast cue vs. the risky, free Camp option (js/core/world.js camp()) — the Inn is safe
    // lodging: no robbery or ambush chance.
    body.appendChild(el('div', { class: 'tinyfont mt4' }, [
      'Safe lodging — unlike camping in the wild, an Inn stay is never robbed or ambushed.'
    ]));
    body.appendChild(el('div', { class: 'mt4' }, [
      el('button', {
        class: 'button',
        onclick: function () {
          var res = Game.World.innRest();
          alert(res.message);
          refreshTownScreen();
        }
      }, ['Rest'])
    ]));
  }

  // ---- Vault sub-panel: gold in/out fields, item lists both directions ----
  function renderVaultPanel(body, c) {
    Game.Inventory.ensureFields(c);
    body.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Your Gold']),
      el('span', {}, [c.platinum + 'p ' + c.gold + 'g'])
    ]));
    body.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Vault Gold']),
      el('span', {}, [c.vault.platinum + 'p ' + c.vault.gold + 'g'])
    ]));

    var goldInput = el('input', { type: 'text', value: townVaultGoldAmount, style: 'width:70px;' });
    goldInput.addEventListener('input', function (ev) { townVaultGoldAmount = ev.target.value; });

    var goldRow = el('div', { class: 'mt4' }, [
      goldInput,
      el('button', {
        class: 'button',
        onclick: function () {
          var amt = parseInt(townVaultGoldAmount, 10);
          if (!amt || amt <= 0) { alert('Enter a positive amount.'); return; }
          var res = Game.World.depositGold(amt);
          if (!res.ok) alert(res.message);
          refreshTownScreen();
        }
      }, ['Deposit']),
      el('button', {
        class: 'button',
        onclick: function () {
          var amt = parseInt(townVaultGoldAmount, 10);
          if (!amt || amt <= 0) { alert('Enter a positive amount.'); return; }
          var res = Game.World.withdrawGold(amt);
          if (!res.ok) alert(res.message);
          refreshTownScreen();
        }
      }, ['Withdraw'])
    ]);
    body.appendChild(goldRow);

    body.appendChild(el('div', { class: 'tcat2 mt8' }, ['Your Inventory -> Vault']));
    if (!c.inventory.length) {
      body.appendChild(el('div', { class: 'smallfont mt4' }, ['Nothing to deposit.']));
    } else {
      c.inventory.forEach(function (itemId, idx) {
        var item = Game.Inventory.getItem(itemId);
        if (!item) return;
        body.appendChild(el('div', { class: 'stat-row alt' + (idx % 2) }, [
          Game.UI.icon(item.id, 32),
          el('span', { class: 'stat-name' }, [item.name]),
          el('button', {
            class: 'button',
            onclick: function () {
              var res = Game.World.depositItem(itemId);
              if (!res.ok) alert(res.message);
              refreshTownScreen();
            }
          }, ['Deposit'])
        ]));
      });
    }

    body.appendChild(el('div', { class: 'tcat2 mt8' }, ['Vault -> Your Inventory']));
    if (!c.vault.items.length) {
      body.appendChild(el('div', { class: 'smallfont mt4' }, ['Your Vault is empty.']));
    } else {
      c.vault.items.forEach(function (itemId, idx) {
        var item = Game.Inventory.getItem(itemId);
        if (!item) return;
        body.appendChild(el('div', { class: 'stat-row alt' + (idx % 2) }, [
          Game.UI.icon(item.id, 32),
          el('span', { class: 'stat-name' }, [item.name]),
          el('button', {
            class: 'button',
            onclick: function () {
              var res = Game.World.withdrawItem(itemId);
              if (!res.ok) alert(res.message);
              refreshTownScreen();
            }
          }, ['Withdraw'])
        ]));
      });
    }
  }

  // ---- Academy sub-panel: TP readout, learnable techs (met/unmet/learned) ----
  // v1.8 P4 (Task A, SPEC-V1.8-TECHS-AND-REACHABILITY.md §3): archived precedent "Added tabs to
  // the techs page to sort techniques by type" [archived: reference/manual/Version_2.1_Changes.md]
  // — the Academy learn list gains type tabs (All/Damage/Drain/Heal/Buff/Debuff/Summon), purely
  // tech.effect-driven so it sorts the concurrent P3 agent's 72 new techs with no changes here.
  var academyTypeTab = 'all';

  function renderAcademyPanel(body, c) {
    body.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Training Points']),
      el('span', {}, [String(c.trainingPoints)])
    ]));

    var allLearnable = Game.World.learnableTechs();
    body.appendChild(techCategoryTabs(academyTypeTab, function (cat) {
      academyTypeTab = cat;
      refreshTownScreen();
    }, allLearnable));

    var shownLearnable = academyTypeTab === 'all'
      ? allLearnable
      : allLearnable.filter(function (t) { return techCategory(t) === academyTypeTab; });

    shownLearnable.forEach(function (tech, idx) {
      var known = c.techs.indexOf(tech.id) !== -1;
      var check = Game.World.canLearn(c, tech);
      var row = el('div', { class: 'stat-row alt' + (idx % 2) + (known ? ' greyed' : '') });
      row.appendChild(Game.UI.icon(tech.id, 32));
      row.appendChild(el('span', { class: 'stat-name', style: 'width:150px; flex:0 0 150px;' }, [
        techDisplayName(tech) + (tech.chain ? ' (' + tech.chain + ' ' + tech.rank + ')' : '')
      ]));
      // v1.4.2 (user feedback): the Academy learn list had no way to inspect a technique before
      // paying for it. Same ⓘ affordance as the Status/battle screens — opens the full tech info
      // window (Game.Infobox.openTech: desc, Scales with, effective damage/heal range, grade, etc.).
      row.appendChild(el('span', {
        class: 'info-btn',
        title: 'About ' + techDisplayName(tech),
        onclick: function (ev) {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          Game.Infobox.openTech(tech, c);
        }
      }, ['ⓘ']));
      row.appendChild(el('span', { class: 'tinyfont' }, [tech.trainingCost + ' TP']));
      if (known) {
        row.appendChild(el('span', { class: 'tinyfont' }, [' Known']));
      } else if (check.ok) {
        row.appendChild(el('button', {
          class: 'button',
          onclick: function () {
            var res = Game.World.learnTech(tech.id);
            if (!res.ok) alert(res.message);
            refreshTownScreen();
          }
        }, ['Learn']));
      } else {
        row.appendChild(el('span', { class: 'tinyfont req-bad' }, [check.failures.join(' ')]));
      }
      body.appendChild(row);
      // v1.8 P4 (Task A): a second, indented line naming the tech's buff/debuff/gate/goldSteal
      // fields sensibly, when it has any (empty string for every pre-v1.8 tech — no visual noise
      // added to the shipped 75).
      var summary = techEffectSummary(tech);
      if (summary) {
        body.appendChild(el('div', { class: 'tinyfont mt2', style: 'padding-left:38px;' }, [summary]));
      }
    });

    // ---- Phase 6a: Class Abilities section (Classes.md: "Gaining Class Levels will allow you
    // to purchase additional skills and abilities for that class from the Academy"). One
    // sub-list per ACTIVE class (Primary/Secondary) — an obtained-but-inactive class must be
    // slotted first on the Status > Classes tab before its abilities can be bought here. ----
    var activeClassIds = [c.primaryClass, c.secondaryClass].filter(function (id) { return id; });
    if (activeClassIds.length > 0) {
      body.appendChild(el('div', { class: 'tcat2 mt8' }, ['Class Abilities']));
      activeClassIds.forEach(function (classId) {
        var classDef = Game.Classes.getClass(classId);
        if (!classDef) return;
        var entry = c.classes[classId];
        var unspent = Game.Classes.unspentClassLevels(c, classId);
        body.appendChild(el('div', { class: 'mt4' }, [
          el('b', {}, [classDef.name]), ' ',
          el('span', { class: 'tinyfont' }, ['— unspent Class Levels: ' + unspent])
        ]));
        classDef.abilities.forEach(function (ability, idx) {
          var owned = entry.abilities.indexOf(ability.id) !== -1;
          var canBuy = !owned && unspent >= ability.classLevelCost;
          var row = el('div', { class: 'stat-row alt' + (idx % 2) + (owned ? ' greyed' : '') });
          row.appendChild(el('span', { class: 'stat-name', style: 'width:150px; flex:0 0 150px;' }, [ability.name]));
          row.appendChild(el('span', { class: 'tinyfont' }, [ability.classLevelCost + ' Class Lv']));
          if (owned) {
            row.appendChild(el('span', { class: 'tinyfont' }, [' Owned']));
          } else if (canBuy) {
            row.appendChild(el('button', {
              class: 'button',
              onclick: function () {
                var res = Game.Classes.buyAbility(c, classId, ability.id);
                if (!res.ok) alert(res.message);
                refreshTownScreen();
              }
            }, ['Buy']));
          } else {
            row.appendChild(el('span', { class: 'tinyfont req-bad' }, [
              'Requires ' + ability.classLevelCost + ' unspent Class Levels (you have ' + unspent + ').'
            ]));
          }
          row.appendChild(el('span', { class: 'tinyfont' }, [ability.desc]));
          body.appendChild(row);
        });
      });
    }
  }

  // ---- Spirit Shrine sub-panel: buffs, active buffs w/ battlesLeft, uncurse list ----
  function renderShrinePanel(body, c) {
    body.appendChild(el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, ['Anima Shards']),
      el('span', {}, [String(c.animaShards)])
    ]));

    body.appendChild(el('div', { class: 'tcat2 mt8' }, ['Buffs']));
    (Game.Data.shrine || []).forEach(function (buff, idx) {
      var afford = c.animaShards >= buff.shardCost;
      var row = el('div', { class: 'stat-row alt' + (idx % 2) }, [
        el('span', { class: 'stat-name', style: 'width:150px; flex:0 0 150px;' }, [buff.name]),
        el('span', { class: 'tinyfont' }, [buff.shardCost + ' shards']),
        el('button', {
          class: 'button',
          disabled: afford ? null : 'disabled',
          onclick: function () {
            var res = Game.World.buyBuff(buff.id);
            if (!res.ok) alert(res.message);
            refreshTownScreen();
          }
        }, ['Buy']),
        el('span', { class: 'tinyfont' }, [buff.desc])
      ]);
      body.appendChild(row);
    });

    body.appendChild(el('div', { class: 'tcat2 mt8' }, ['Active Buffs']));
    if (!c.shrineBuffs.length) {
      body.appendChild(el('div', { class: 'smallfont mt4' }, ['No active buffs.']));
    } else {
      c.shrineBuffs.forEach(function (entry, idx) {
        var def = null;
        (Game.Data.shrine || []).forEach(function (b) { if (b.id === entry.id) def = b; });
        body.appendChild(el('div', { class: 'stat-row alt' + (idx % 2) }, [
          el('span', { class: 'stat-name' }, [def ? def.name : entry.id]),
          el('span', { class: 'tinyfont' }, [entry.battlesLeft + ' battles left'])
        ]));
      });
    }

    // Feature B (user-directed): Cleanse Haunting — offered ONLY while the character is Haunted
    // (spec: "listed only while haunted"), matching Game.World.cleanseHaunting's own guard.
    if (Game.Character && Game.Character.hasAffliction && Game.Character.hasAffliction(c, 'haunting')) {
      body.appendChild(el('div', { class: 'tcat2 mt8' }, ['Cleanse Haunting']));
      var fee = Game.World.cleanseHauntingFee(c);
      var affordCleanse = Game.Character.goldTotalAsGold(c) >= fee;
      body.appendChild(el('div', { class: 'stat-row' }, [
        el('span', { class: 'stat-name affliction-red', style: 'width:150px; flex:0 0 150px;' }, ['Haunted']),
        el('span', { class: 'tinyfont' }, [fee + ' gold']),
        el('button', {
          class: 'button',
          disabled: affordCleanse ? null : 'disabled',
          onclick: function () {
            var res = Game.World.cleanseHaunting();
            if (!res.ok) alert(res.message);
            refreshTownScreen();
          }
        }, ['Cleanse']),
        el('span', { class: 'tinyfont' }, ['Removes the Haunting affliction (halved magical/consumable healing).'])
      ]));
    }

    body.appendChild(el('div', { class: 'tcat2 mt8' }, ['Remove Curses']));
    var anyCursed = false;
    Game.Inventory.EQUIP_SLOTS.forEach(function (slot, idx) {
      var itemId = c.equipment[slot];
      var item = itemId ? Game.Inventory.getItem(itemId) : null;
      if (!item || !item.tags || item.tags.indexOf('cursed') === -1) return;
      anyCursed = true;
      body.appendChild(el('div', { class: 'stat-row alt' + (idx % 2) }, [
        el('span', { class: 'stat-name' }, [item.name + ' (' + slot + ')']),
        el('span', { class: 'tinyfont' }, [item.value + 'g']),
        el('button', {
          class: 'button',
          onclick: function () {
            var res = Game.World.uncurse(slot);
            if (!res.ok) alert(res.message);
            refreshTownScreen();
          }
        }, ['Uncurse'])
      ]));
    });
    if (!anyCursed) {
      body.appendChild(el('div', { class: 'smallfont mt4' }, ['No cursed items equipped.']));
    }
  }

  // NEW (v1.4 P1, G5 quest chains, docs/SPEC-V1.4-GAMEPLAY.md §2): set right after a successful
  // turnIn() that returned a non-empty followUps array (see the Journal turn-in handlers below),
  // consumed exactly once by the next renderTavernPanel() call for the matching area — surfaces
  // "<npc> has more work for you…" above each newly-unlocked follow-up row, then clears itself so
  // it doesn't reappear on later, unrelated visits to the same tavern.
  var pendingFollowUpNotice = null; // { areaId, ids: [questId, ...] } | null

  // ---- Tavern sub-panel (Phase 5; archived quest source — New_Player_Guide.md §5.1.5,
  // Recent_Updates.md 2007-05-15 "Added a new quest to the tavern in Eldor"). Lists every quest
  // whose giver is this town: available+eligible get an Accept button; ineligible (level window
  // or, NEW v1.4 P1, the active-quest cap) and already-accepted/completed quests are shown greyed
  // with the reason. A quest whose requiresQuest prerequisite isn't complete is OMITTED entirely
  // (Game.Quests.availableAt() already drops it — chain-hidden content never clutters this list,
  // the whole point of G5's chain mechanic) rather than greyed. ----
  function renderTavernPanel(body, c, area) {
    var allQuests = (Game.Data.quests || []).filter(function (q) { return q.giver.areaId === area.id; });
    if (!allQuests.length) {
      body.appendChild(el('div', { class: 'smallfont mt4' }, ['No one here has work for you.']));
      return;
    }

    // Not-yet-accepted/completed quests route through availableAt() so the cap reason and
    // requiresQuest chain-hiding are computed in exactly ONE place (js/core/quests.js) instead of
    // being re-derived here; already-accepted/completed quests keep the pre-existing greyed
    // display (availableAt() itself omits those, since they're no longer "offered").
    var records = {};
    Game.Quests.availableAt(area.id).forEach(function (rec) { records[rec.quest.id] = rec; });

    var displayList = [];
    allQuests.forEach(function (quest) {
      var qEntry = Game.Quests.entry(c, quest.id);
      if (qEntry) {
        displayList.push({
          quest: quest,
          eligible: false,
          reason: qEntry.status === 'completed' ? 'Completed.' : 'Already accepted — see your Journal.'
        });
      } else if (records[quest.id]) {
        displayList.push(records[quest.id]);
      }
      // else: hidden by the requiresQuest chain gate — not shown at all, per G5.
    });

    if (!displayList.length) {
      body.appendChild(el('div', { class: 'smallfont mt4' }, ['No one here has work for you right now.']));
      return;
    }

    var showFollowUpBanner = pendingFollowUpNotice && pendingFollowUpNotice.areaId === area.id;

    displayList.forEach(function (rec, idx) {
      var quest = rec.quest;
      var unavailableReason = rec.eligible ? null : rec.reason;

      if (showFollowUpBanner && pendingFollowUpNotice.ids.indexOf(quest.id) !== -1) {
        body.appendChild(el('div', { class: 'smallfont mt8', style: 'font-style:italic;' }, [
          quest.giver.npc + ' has more work for you…'
        ]));
      }

      var row = el('div', { class: 'mt8' + (unavailableReason ? ' greyed' : '') });
      row.appendChild(el('div', {}, [
        el('b', {}, [quest.name]),
        el('span', { class: 'tinyfont' }, ['  — ' + quest.giver.npc])
      ]));
      row.appendChild(el('div', { class: 'smallfont mt4' }, [quest.intro]));
      if (unavailableReason) {
        row.appendChild(el('div', { class: 'tinyfont req-bad mt4' }, [unavailableReason]));
      } else {
        row.appendChild(el('div', { class: 'mt4' }, [
          el('button', {
            class: 'button',
            onclick: function () {
              var res = Game.Quests.accept(quest.id);
              alert(res.message);
              refreshTownScreen();
            }
          }, ['Accept'])
        ]));
      }
      body.appendChild(row);
      if (idx < displayList.length - 1) body.appendChild(el('div', { class: 'tcat2 mt8' }, ['']));
    });

    // One-shot: the banner only announces the follow-up(s) from the turn-in that just happened.
    if (showFollowUpBanner) pendingFollowUpNotice = null;
  }

  // NEW (v1.4 P1, G5 quest chains): called from the Journal's turn-in handlers right after a
  // successful Game.Quests.turnIn() — arms the one-shot Tavern banner (see pendingFollowUpNotice
  // above) if the turn-in produced any follow-ups. Turn-in already requires standing at the
  // giver's area, so every followUps entry shares c.currentLocation; that's the area whose next
  // Tavern render should carry the banner.
  function noteFollowUps(res) {
    if (res && res.followUps && res.followUps.length) {
      pendingFollowUpNotice = { areaId: Game.state.character.currentLocation, ids: res.followUps };
    }
  }

  // ---------- Journal screen (Phase 5; DESIGN.md §7 — archived: Journal with active/completed
  // tabs + cancel via Journal, Recent_Updates.md 2007-04-06 '"Completed Quests" section of the
  // Journal works' / 'Quests can now be canceled via the Journal'; Story tab invented as the
  // reader for the archived Prelude/Chapter I prose + invented Chapter II) ----------

  var journalTab = 'active'; // 'active' | 'completed' | 'story'
  var journalStoryChapter = null; // chapter id currently open in the Story tab

  function refreshJournalScreen() {
    renderJournal(document.getElementById('maincontent'));
    Game.renderStatusBars();
    if (Game.renderActions) Game.renderActions();
  }

  function renderJournal(root) {
    root.innerHTML = '';
    var c = Game.state.character;
    if (!c.quests) c.quests = {};

    root.appendChild(el('div', { class: 'tcat' }, ['Journal']));

    var panel = el('div', { class: 'panel' });

    // ---- Tabs ----
    // NEW (v1.4 P1, G5 active-quest cap, docs/SPEC-V1.4-GAMEPLAY.md §2): the Active tab's own
    // label carries the "n/MAX" count so the cap is visible at a glance, built from
    // BALANCE.MAX_ACTIVE_QUESTS (never hardcode the 3).
    var activeLabel = 'Active (' + Game.Quests.activeQuestCount(c) + '/' + BALANCE.MAX_ACTIVE_QUESTS + ')';
    var tabs = el('div', { class: 'techset-tabs' });
    [['active', activeLabel], ['completed', 'Completed'], ['story', 'Story']].forEach(function (pair) {
      tabs.appendChild(el('span', {
        class: 'infobox-tab' + (journalTab === pair[0] ? ' active' : ''),
        onclick: function () { journalTab = pair[0]; refreshJournalScreen(); }
      }, [pair[1]]));
    });
    panel.appendChild(tabs);

    var body = el('div', { class: 'mt8' });
    if (journalTab === 'active') renderJournalActive(body, c);
    else if (journalTab === 'completed') renderJournalCompleted(body, c);
    else renderJournalStory(body);
    panel.appendChild(scrollX(body)); // v1.4 Mobile M2 (audit A9): wide quest rows scroll-x

    root.appendChild(panel);
  }

  function questsByStatus(c, status) {
    return (Game.Data.quests || []).filter(function (q) {
      var e = c.quests[q.id];
      return e && e.status === status;
    });
  }

  function renderJournalActive(body, c) {
    var active = questsByStatus(c, 'active');
    if (!active.length) {
      body.appendChild(el('div', { class: 'smallfont' }, ['No active quests. Visit a town Tavern to find work.']));
      return;
    }
    active.forEach(function (quest, idx) {
      var e = c.quests[quest.id];
      var giverArea = Game.World.getArea(quest.giver.areaId);
      var wrap = el('div', { class: 'mt8' });
      wrap.appendChild(el('div', {}, [
        el('b', {}, [quest.name]),
        el('span', { class: 'tinyfont' }, ['  — ' + quest.giver.npc + ', ' + (giverArea ? giverArea.name : quest.giver.areaId)])
      ]));

      // Per-step progress lines (touch steps expand to one checklist line per stone).
      quest.steps.forEach(function (step) {
        Game.Quests.stepProgressText(c, e, step).split('\n').forEach(function (line) {
          wrap.appendChild(el('div', { class: 'smallfont mt4' }, [line]));
        });
      });

      var buttons = el('div', { class: 'mt4' });

      // Turn In: enabled only when all steps are satisfied AND the player is at the giver's
      // area; otherwise a "Return to <npc> in <area>" hint is shown once the steps are done.
      var ready = Game.Quests.canTurnIn(quest.id);
      var atGiver = c.currentLocation === quest.giver.areaId;
      var classChoices = (quest.rewards && quest.rewards.classChoice) || null;
      // NEW sentinel (v1.1 revision): trials_of_eldor's classChoice is the string 'advanced'
      // rather than a fixed array — resolve it here via Game.Classes.advancedOptionsFor(c) so the
      // Journal renders exactly the 2 options matching whichever base class the hero obtained
      // (js/core/quests.js turnIn() resolves the same sentinel server-side for validation).
      if (classChoices === 'advanced') {
        classChoices = Game.Classes ? Game.Classes.advancedOptionsFor(c) : [];
      } else if (classChoices === 'tier3') {
        // NEW sentinel (v1.2 Phase 2): masters_calling's classChoice is the string 'tier3' —
        // resolve via Game.Classes.thirdTierOptionsFor(c), mirroring 'advanced' above.
        classChoices = Game.Classes ? Game.Classes.thirdTierOptionsFor(c) : [];
      }
      if (ready && atGiver && classChoices && classChoices.length) {
        // "The First Calling" (archived TRIO, homepage_2006.md) offers 3 buttons; "The Trials of
        // Ascension" (archived NAMES, homepage_2006.md "Tier 4 Update") offers the 2 resolved
        // advanced options. Either way: buttons instead of one Turn In button; the choice is
        // permanent (quest goes 'completed' immediately, same as any other turn-in — no
        // re-choice is possible).
        buttons.appendChild(el('div', { class: 'smallfont mb4' }, ['Choose your class — this choice is permanent:']));
        classChoices.forEach(function (classId) {
          var classDef = Game.Classes.getClass(classId);
          buttons.appendChild(el('button', {
            class: 'button',
            style: 'margin-right:4px;',
            onclick: function () {
              if (!window.confirm('Become a ' + (classDef ? classDef.name : classId) + '? This choice is permanent.')) return;
              var res = Game.Quests.turnIn(quest.id, classId);
              alert(res.message);
              if (res.ok) {
                var q = Game.Quests.getQuest(quest.id);
                if (q && q.completionText) alert(q.completionText);
                noteFollowUps(res);
              }
              refreshJournalScreen();
            }
          }, [classDef ? classDef.name : classId]));
        });
      } else if (ready && atGiver) {
        buttons.appendChild(el('button', {
          class: 'button',
          onclick: function () {
            var res = Game.Quests.turnIn(quest.id);
            alert(res.message);
            if (res.ok) {
              var q = Game.Quests.getQuest(quest.id);
              if (q && q.completionText) alert(q.completionText);
              noteFollowUps(res);
            }
            refreshJournalScreen();
          }
        }, ['Turn In']));
      } else if (ready) {
        buttons.appendChild(el('span', { class: 'tinyfont' }, [
          'Return to ' + quest.giver.npc + ' in ' + (giverArea ? giverArea.name : quest.giver.areaId) + ' to turn in.'
        ]));
        buttons.appendChild(el('span', {}, [' ']));
      }

      // Cancel via the Journal (archived). The Standing Stones cancel confirm carries the
      // archived reset warning (Recent_Updates.md 2007-05-09); other quests get a plain confirm.
      var hasTouchStep = quest.steps.some(function (s) { return s.kind === 'touch'; });
      buttons.appendChild(el('button', {
        class: 'button',
        onclick: function () {
          var warning = 'Cancel "' + quest.name + '"? All progress will be lost.';
          if (hasTouchStep) {
            warning = 'Cancel "' + quest.name + '"? All progress will be lost — including every ' +
              'stone you have touched. If you start it a second time, the stones reset.';
          }
          if (!window.confirm(warning)) return;
          var res = Game.Quests.cancel(quest.id);
          if (!res.ok) alert(res.message);
          refreshJournalScreen();
        }
      }, ['Cancel']));

      wrap.appendChild(buttons);
      body.appendChild(wrap);
      if (idx < active.length - 1) body.appendChild(el('div', { class: 'tcat2 mt8' }, ['']));
    });
  }

  function renderJournalCompleted(body, c) {
    var completed = questsByStatus(c, 'completed');
    if (!completed.length) {
      body.appendChild(el('div', { class: 'smallfont' }, ['No completed quests yet.']));
      return;
    }
    completed.forEach(function (quest, idx) {
      var wrap = el('div', { class: 'mt8' });
      wrap.appendChild(el('div', {}, [el('b', {}, [quest.name])]));
      wrap.appendChild(el('div', { class: 'smallfont mt4' }, [quest.completionText]));
      body.appendChild(wrap);
      if (idx < completed.length - 1) body.appendChild(el('div', { class: 'tcat2 mt8' }, ['']));
    });
  }

  function renderJournalStory(body) {
    var chapters = Game.Data.story || [];
    var open = null;
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].id === journalStoryChapter) open = chapters[i];
    }

    if (open) {
      body.appendChild(el('div', {}, [el('b', {}, [open.title])]));
      // Paragraph breaks are stored as \n\n in js/data/story.js.
      open.text.split('\n\n').forEach(function (para) {
        body.appendChild(el('div', { class: 'smallfont mt8' }, [para]));
      });
      body.appendChild(el('div', { class: 'mt8' }, [
        el('button', {
          class: 'button',
          onclick: function () { journalStoryChapter = null; refreshJournalScreen(); }
        }, ['Back to chapters'])
      ]));
      return;
    }

    body.appendChild(el('div', { class: 'smallfont' }, ['The story so far, as the chroniclers of Van Arius tell it.']));
    chapters.forEach(function (chapter, idx) {
      body.appendChild(el('div', { class: 'stat-row alt' + (idx % 2) }, [
        el('span', { class: 'stat-name' }, [chapter.title]),
        el('button', {
          class: 'button',
          onclick: function () { journalStoryChapter = chapter.id; refreshJournalScreen(); }
        }, ['Read'])
      ]));
    });
  }

  // ---------- Battle screen (Phase 3; DESIGN.md §4, New_Player_Guide.md "Battling") ----------

  var battleReturnScreen = 'explore'; // where 'Continue' goes after the battle ends
  var battleActiveSet = 0; // which tech set tab is shown in battle
  var battleShowItems = false; // bag icon toggles the combat-usable item list

  function refreshBattleScreen() {
    renderBattle(document.getElementById('maincontent'));
    Game.renderStatusBars();
    if (Game.renderActions) Game.renderActions();
  }

  function battleBar(label, cls, value, max, text) {
    var pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
    return el('div', { class: 'statbar-row' }, [
      el('span', { class: 'statbar-label' }, [label]),
      el('span', { class: 'statbar-track' }, [
        el('span', { class: 'statbar-fill ' + cls, style: 'width:' + pct + '%; display:block; height:100%;' }),
        el('span', { class: 'statbar-text' }, [text || (value + ' / ' + max)])
      ])
    ]);
  }

  // ---------- In-combat action info (v1.4 UX transparency pass, user-directed 2026-07-12) ----------
  // A VISIBLE, tappable "ⓘ" affordance next to every battle action (Attack/Defend/Limit Break
  // buttons, each filled tech slot, each item-use row) — clicking it opens an info window instead
  // of performing the action. Tech slots use Game.Infobox.openTech and item rows use
  // Game.Infobox.open directly (existing windows); Attack/Defend/Limit Break have no existing
  // per-action window, so this small helper reuses Game.Infobox.openPanel (same overlay plumbing,
  // zero new overlay code) to build one on the fly.
  function actionInfoGlyph(onOpen, title) {
    return el('span', {
      class: 'info-btn',
      title: title || 'Info',
      onclick: function (ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        onOpen();
      }
    }, ['ⓘ']);
  }

  function actionInfoRow(label, value) {
    return el('div', { class: 'stat-row' }, [
      el('span', { class: 'stat-name' }, [label]),
      el('span', {}, [value])
    ]);
  }

  function openActionInfo(title, lines) {
    Game.Infobox.openPanel(title, function (body) {
      lines.forEach(function (line) {
        if (typeof line === 'string') {
          body.appendChild(el('div', { class: 'smallfont mt4' }, [line]));
        } else {
          body.appendChild(actionInfoRow(line[0], line[1]));
        }
      });
    });
  }

  function damageRangeText(base) {
    var lo = Math.round(base * (1 - BALANCE.DAMAGE_VARIANCE));
    var hi = Math.round(base * (1 + BALANCE.DAMAGE_VARIANCE));
    return lo + '–' + hi + ' (before enemy defenses)';
  }

  function openAttackInfo(c) {
    openActionInfo('Attack', [
      'Strike the enemy with your equipped weapon.',
      ['Energy Cost', String(BALANCE.ATTACK_ENERGY_COST)],
      ['Scales with', "your weapon's Damage"],
      ['Damage', damageRangeText(Game.Character.getDamage(c))]
    ]);
  }

  function openDefendInfo() {
    openActionInfo('Defend', [
      'Brace — halves the next incoming hit.',
      ['Energy Cost', String(BALANCE.DEFEND_ENERGY_COST)]
    ]);
  }

  // Limit Break flavor text — Game.Battle.getLimitBreak(c) only returns {id, name} (no effect
  // string), so the short mechanical description is mirrored here from js/core/battle.js
  // limitBreak()'s own comments/flavor riders (LIMIT_BREAKS/LIMIT_BREAK_BY_BASE_CLASS).
  var LIMIT_BREAK_EFFECT = {
    rage: 'A devastating weapon strike that also hardens your guard (bonus Armor for a few turns).',
    dragon_kick: "A devastating weapon strike that cripples the enemy's footing (its Dodge falters for the rest of the fight).",
    hurricane_blow: "A devastating weapon strike that always connects (bypasses the enemy's Dodge)."
  };

  function openLimitBreakInfo(c, lb) {
    var base = Game.Character.getDamage(c) * BALANCE.LB_DAMAGE_MULT;
    openActionInfo(lb.name, [
      LIMIT_BREAK_EFFECT[lb.id] || 'A devastating class-line special attack.',
      ['Energy Cost', '0 (consumes your Fury streak; needs Fury ' + BALANCE.LB_FURY_MIN + '+)'],
      ['Scales with', "your weapon's Damage"],
      ['Damage', damageRangeText(base)]
    ]);
  }

  function renderBattle(root) {
    var battle = Game.Battle.getBattle();
    root.innerHTML = '';
    if (!battle) {
      // No active battle: bounce to the return screen instead of rendering a dead battlefield.
      navigate(battleReturnScreen);
      return;
    }
    var c = battle.player;
    var m = battle.monster;
    var over = battle.phase !== 'active';
    var canAct = Game.Battle.canAct(battle);

    root.appendChild(el('div', { class: 'tcat' }, ['Battle — ' + m.name + ' (Lv ' + m.level + ')']));

    var layout = el('div', { class: 'battle-layout' });

    // ---- Left: "Your Vitality" (archived layout, New_Player_Guide.md "Battling") ----
    var left = el('div', { class: 'battle-left' });
    left.appendChild(el('div', { class: 'tcat2' }, ['Your Vitality']));
    var vit = el('div', { class: 'panel' });
    vit.appendChild(battleBar('HP', 'hp', c.hitPoints, c.hitPointsMax));
    vit.appendChild(battleBar('Energy', 'energy', c.energy, c.energyMax));
    var xpNeeded = Game.Character.xpNeededForNext(c);
    var xpInto = Game.Character.xpIntoCurrentLevel(c);
    // F1 balance-to-100: at BALANCE.LEVEL_CAP both are 0 — battleBar's default text ("0 / 0 XP")
    // would read as nonsense at the cap, so pass an explicit "MAX LEVEL" label instead.
    vit.appendChild(battleBar('XP', 'xp', xpInto, xpNeeded, c.level >= BALANCE.LEVEL_CAP ? 'MAX LEVEL' : null));
    // Yellow Fear bar only when feared (archived: New_Player_Guide.md "There may be a fourth
    // (yellow) bar which tells how much Fear you have").
    var fearLv = Game.Battle.fearLevels(battle);
    if (fearLv > 0) {
      vit.appendChild(battleBar('Fear', 'fear', fearLv * 10, 100, '-' + (fearLv * 10) + '% stats'));
    }
    if (c.fury > 0) {
      // v1.4 P4 (G3): make the Limit Break trade-off legible right on the meter that pays for it —
      // spending a streak sacrifices this same +N% XP bonus on every future win of the streak.
      var lbHint = Game.Battle.getLimitBreak(c);
      var furyLine = 'Fury: ' + c.fury + ' (+' + c.fury + '% XP)';
      if (lbHint) {
        furyLine += (c.fury >= BALANCE.LB_FURY_MIN) ? ' — ' + lbHint.name + ' ready!' : ' — ' + lbHint.name + ' at Fury ' + BALANCE.LB_FURY_MIN;
      }
      vit.appendChild(el('div', { class: 'smallfont mt4' }, [furyLine]));
    }

    // Feature B (user-directed): afflictions shown in dark red on the "Your Vitality" panel (also
    // shown on Status — see renderStatus below).
    if (Game.Character && Game.Character.hasAffliction && Game.Character.hasAffliction(c, 'haunting')) {
      vit.appendChild(el('div', { class: 'smallfont mt4 affliction-red' }, ['Haunted (magical/consumable healing halved)']));
    }

    // ---- Action icons: Attack (sword) / Item (bag) / Defend (shield) / Escape (tornado) —
    // original terminology plus Feature C's Defend action ----
    var canDefend = !over && canAct && c.energy >= BALANCE.DEFEND_ENERGY_COST;
    // Fix #6: canAct (js/core/battle.js) is just `energy > 0`; when it's false the core's "out of
    // Energy — you can only flee or fall" message (battle.js attack()/useItem()) never surfaces
    // because the disabled buttons prevent the calls that would log it. Reuse the exact wording
    // for the disabled buttons' title AND a visible note (below).
    var outOfEnergyMsg = 'You are out of Energy — you can only flee or fall.';
    var actions = el('div', { class: 'battle-actions mt8' }, [
      el('button', {
        class: 'button battle-action',
        title: (!over && !canAct) ? outOfEnergyMsg : 'Attack with your equipped weapon (' + BALANCE.ATTACK_ENERGY_COST + ' Energy)',
        disabled: (over || !canAct) ? 'disabled' : null,
        onclick: function () {
          Game.Battle.attack();
          Game.persist();
          refreshBattleScreen();
        }
      }, ['🗡 Attack']),
      actionInfoGlyph(function () { openAttackInfo(c); }, 'About Attack'),
      el('button', {
        class: 'button battle-action',
        title: (!over && !canAct) ? outOfEnergyMsg : 'Use a combat item',
        disabled: (over || !canAct) ? 'disabled' : null,
        onclick: function () {
          battleShowItems = !battleShowItems;
          refreshBattleScreen();
        }
      }, ['👜 Item']),
      el('button', {
        class: 'button battle-action',
        title: 'Halve the next hit (' + BALANCE.DEFEND_ENERGY_COST + ' Energy)',
        disabled: !canDefend ? 'disabled' : null,
        onclick: function () {
          Game.Battle.defend();
          Game.persist();
          refreshBattleScreen();
        }
      }, ['🛡 Defend']),
      actionInfoGlyph(function () { openDefendInfo(); }, 'About Defend'),
      el('button', {
        class: 'button battle-action',
        // Feature A (user-directed): Escape can fail — the title shows the live percentage
        // (fleeChance is always attemptable, even at 0 Energy — Energy.md).
        title: 'Escape (' + Math.round(Game.Battle.fleeChance(battle) * 100) + '%)',
        disabled: over ? 'disabled' : null,
        onclick: function () {
          Game.Battle.flee();
          Game.persist();
          refreshBattleScreen();
        }
      }, ['🌪 Escape (' + Math.round(Game.Battle.fleeChance(battle) * 100) + '%)'])
    ]);
    vit.appendChild(actions);

    // Fix #6 (visible half): the tooltip alone is easy to miss, so also render the same
    // explanation as a small note near the action buttons whenever the player is stuck.
    if (!over && !canAct) {
      vit.appendChild(el('div', { class: 'tinyfont req-bad mt4' }, [outOfEnergyMsg]));
    }

    // ---- Combat item list (bag) ----
    if (battleShowItems && !over) {
      var itemList = el('div', { class: 'mt4' });
      var usable = c.inventory.filter(function (id) {
        var item = Game.Inventory.getItem(id);
        return item && item.combatUsable;
      });
      if (usable.length === 0) {
        itemList.appendChild(el('div', { class: 'tinyfont' }, ['No combat-usable items.']));
      } else {
        usable.forEach(function (itemId) {
          var item = Game.Inventory.getItem(itemId);
          itemList.appendChild(el('div', { class: 'stat-row' }, [
            el('span', { class: 'tinyfont', style: 'flex:1 1 auto;' }, [item.name]),
            actionInfoGlyph(function () { Game.Infobox.open(item, c); }, 'About ' + item.name),
            el('button', {
              class: 'button',
              disabled: !canAct ? 'disabled' : null,
              onclick: function () {
                Game.Battle.useItem(itemId);
                battleShowItems = false;
                Game.persist();
                refreshBattleScreen();
              }
            }, ['Use'])
          ]));
        });
      }
      vit.appendChild(itemList);
    }

    // ---- Equipped tech sets (3 tabs x 8 slots, click icon to cast) ----
    var techTabs = el('div', { class: 'techset-tabs mt8' });
    for (var t = 0; t < 3; t++) {
      (function (tabIdx) {
        techTabs.appendChild(el('span', {
          class: 'infobox-tab' + (battleActiveSet === tabIdx ? ' active' : ''),
          onclick: function () { battleActiveSet = tabIdx; refreshBattleScreen(); }
        }, ['Set ' + (tabIdx + 1)]));
      })(t);
    }
    vit.appendChild(techTabs);

    var techGrid = el('div', { class: 'techset-grid' });
    var set = c.techSets[battleActiveSet];
    for (var s = 0; s < 8; s++) {
      (function (slotIdx) {
        var slottedId = set[slotIdx];
        var tech = slottedId ? getTechById(slottedId) : null;
        // v1.6 P1 (CB-4, SPEC-V1.6-REBALANCE.md §6): a Rod-discounted offensive tech may be
        // affordable below its listed energyCost — check/display the SAME effective cost
        // useTech will actually charge, so "castable" and the shown cost never disagree with
        // what happens on click.
        var techCost = tech ? Game.Battle.effectiveTechEnergyCost(c, tech) : 0;
        var castable = tech && !over && canAct && c.energy >= techCost;
        // Fix #6: techs are also gated by canAct — explain why a tech is unusable when the
        // player is simply out of Energy, same wording as the Attack/Item buttons above.
        // v1.8 P4 (Task A, D2): techDisplayName disambiguates the Curse tech from the Curse
        // status; techEffectSummary appends the new buff/debuff/gate/goldSteal fields to the
        // tooltip so a hovered battle-grid slot is self-explanatory without opening the infobox.
        var slotSummary = tech ? techEffectSummary(tech) : '';
        var slotTitle = tech
          ? ((!over && !canAct) ? (techDisplayName(tech) + ' — ' + outOfEnergyMsg) : (techDisplayName(tech) + ' (' + techCost + ' energy)' + (slotSummary ? ' — ' + slotSummary : '')))
          : 'Empty slot';
        var slotChildren = [tech ? techIcon(tech) : el('span', { class: 'tinyfont' }, ['—'])];
        if (tech) {
          slotChildren.push(el('span', {
            class: 'info-btn tech-slot-info',
            title: 'About ' + techDisplayName(tech),
            onclick: function (ev) {
              if (ev && ev.stopPropagation) ev.stopPropagation();
              Game.Infobox.openTech(tech, c);
            }
          }, ['ⓘ']));
        }
        var slot = el('div', {
          class: 'tech-slot' + (tech ? ' filled' : '') + (castable ? ' castable' : ''),
          title: slotTitle,
          onclick: function () {
            if (!tech || over || !canAct) return;
            Game.Battle.useTech(tech.id);
            Game.persist();
            refreshBattleScreen();
          },
          ondblclick: function () { if (tech) Game.Infobox.openTech(tech, c); }
        }, slotChildren);
        techGrid.appendChild(slot);
      })(s);
    }
    vit.appendChild(techGrid);

    // ---- Limit Break (v1.4 P4, G3 — docs/SPEC-V1.4-GAMEPLAY.md §5) ----
    // Visible only when the character's class LINE grants one (Game.Battle.getLimitBreak reads
    // Game.Classes.baseClassIdsObtained — a classless character never sees this button at all);
    // enabled only once charged (Fury >= BALANCE.LB_FURY_MIN) and not yet spent this battle. The
    // label always shows the live Fury count so the fury-vs-XP trade stays legible even before
    // it's charged.
    var lb = Game.Battle.getLimitBreak(c);
    if (lb) {
      var lbCharged = !over && (c.fury || 0) >= BALANCE.LB_FURY_MIN && !battle.limitBreakUsed;
      vit.appendChild(el('div', { class: 'mt8' }, [
        el('button', {
          class: 'button battle-action',
          title: battle.limitBreakUsed
            ? lb.name + ' already unleashed this battle.'
            : lb.name + ' — consumes your whole Fury streak (needs ' + BALANCE.LB_FURY_MIN + '+; costs 0 Energy)',
          disabled: !lbCharged ? 'disabled' : null,
          onclick: function () {
            Game.Battle.limitBreak();
            Game.persist();
            refreshBattleScreen();
          }
        }, ['⚔ ' + lb.name + ' (Fury: ' + (c.fury || 0) + ')']),
        actionInfoGlyph(function () { openLimitBreakInfo(c, lb); }, 'About ' + lb.name)
      ]));
    }

    left.appendChild(vit);
    layout.appendChild(left);

    // ---- Right: monster panel on the battlefield background ----
    var right = el('div', { class: 'battle-right' });
    var field = el('div', { class: 'battlefield' });
    field.appendChild(el('div', { style: 'display:flex; align-items:center; gap:6px;' }, [
      Game.UI.icon(m.id, 64),
      el('span', {}, [
        el('b', { class: 'orangetext' }, [m.name]),
        el('span', { class: 'smallfont' }, [' — Level ' + m.level + (m.boss ? ' [BOSS]' :
          (m.champion ? ' [CHAMPION' + (m.affix ? ' - ' + m.affix.charAt(0).toUpperCase() + m.affix.slice(1) : '') + ']' : ''))])
      ])
    ]));
    field.appendChild(el('div', { class: 'smallfont mt4' }, [m.desc]));
    field.appendChild(el('div', { class: 'mt8' }, [battleBar('HP', 'hp', m.hp, m.hpMax)]));
    field.appendChild(battleBar('Energy', 'energy', m.energy, m.energyMax));
    if (m.element) {
      field.appendChild(el('div', { class: 'tinyfont mt4' }, ['Element: ' + m.element]));
    }
    right.appendChild(field);

    // ---- Outcome panel (win/loss/fled/monsterFled) ----
    if (over) {
      var outcome = el('div', { class: 'panel mt8' });
      if (battle.phase === 'won') {
        outcome.appendChild(el('div', {}, [el('b', {}, ['Victory!'])]));
        var r = battle.rewards;
        if (r && !r.cutoff) {
          outcome.appendChild(el('div', { class: 'smallfont mt4' }, ['Experience: ' + r.xp + '   Gold: ' + r.gold +
            (r.ap ? '   +' + r.ap + ' AP' : '') + (r.shards ? '   Anima Shards: ' + r.shards : '')]));
          var skillNames = Object.keys(r.skillXp || {});
          if (skillNames.length > 0) {
            outcome.appendChild(el('div', { class: 'tinyfont mt4' }, [
              'Skill XP: ' + skillNames.map(function (n) { return n + ' +' + r.skillXp[n]; }).join(', ')
            ]));
          }
        } else {
          // v1.4 P2 (G1): AP is a kills-only currency awarded on EVERY win, including a
          // 5-level-cutoff win ("a kill is a kill") — shown here even though XP/gold/loot are cut.
          outcome.appendChild(el('div', { class: 'smallfont mt4' }, ['This monster was too far below your level — no rewards.' +
            (r && r.ap ? ' +' + r.ap + ' AP' : '')]));
        }
        if (battle.pendingLoot || battle.pendingStolenLoot) {
          var lootRow = el('div', { class: 'mt8', style: 'display:flex; align-items:center; gap:4px; flex-wrap:wrap;' });
          if (battle.pendingLoot) {
            var lootItem = Game.Inventory.getItem(battle.pendingLoot);
            lootRow.appendChild(Game.UI.icon(battle.pendingLoot, 32));
            lootRow.appendChild(el('span', { class: 'loot-icon', title: lootItem ? lootItem.name : battle.pendingLoot }, ['🎁 ' + (lootItem ? lootItem.name : battle.pendingLoot) + ' ']));
          }
          if (battle.pendingStolenLoot) {
            // v1.2 Phase 1 item 4 (Thievery): a distinct icon/label for the bonus stolen item.
            var stolenItem = Game.Inventory.getItem(battle.pendingStolenLoot);
            lootRow.appendChild(Game.UI.icon(battle.pendingStolenLoot, 32));
            lootRow.appendChild(el('span', { class: 'loot-icon', title: stolenItem ? stolenItem.name : battle.pendingStolenLoot }, ['🗝️ ' + (stolenItem ? stolenItem.name : battle.pendingStolenLoot) + ' ']));
          }
          lootRow.appendChild(el('button', {
            class: 'button',
            onclick: function () {
              var res = Game.Battle.claimLoot();
              if (!res.ok) alert(res.message);
              Game.persist();
              refreshBattleScreen();
            }
          }, ['Loot']));
          outcome.appendChild(lootRow);
          if (battle.lootMessage) {
            outcome.appendChild(el('div', { class: 'tinyfont req-bad mt4' }, [battle.lootMessage]));
            // Fix #4a: name the exact shortfall (item weight vs. free capacity) instead of just
            // "too much weight" — read-only math against js/core/inventory.js's own formulas.
            var freeCapacity = Game.Inventory.carryCapacity(c) - Game.Inventory.currentWeight(c);
            var stillPendingIds = [];
            if (battle.pendingLoot) stillPendingIds.push(battle.pendingLoot);
            if (battle.pendingStolenLoot) stillPendingIds.push(battle.pendingStolenLoot);
            stillPendingIds.forEach(function (pendingId) {
              var pendingItem = Game.Inventory.getItem(pendingId);
              if (!pendingItem) return;
              outcome.appendChild(el('div', { class: 'tinyfont mt4' }, [
                pendingItem.name + ' weighs ' + pendingItem.weight + ' — you have ' + Math.max(0, freeCapacity) + ' free capacity.'
              ]));
            });
          }
        }
      } else if (battle.phase === 'lost') {
        outcome.appendChild(el('div', {}, [el('b', { class: 'req-bad' }, ['Defeat...'])]));
        outcome.appendChild(el('div', { class: 'smallfont mt4' }, ["You get nothing from the battle (but you don't lose anything either)."]));
      } else if (battle.phase === 'monsterFled') {
        outcome.appendChild(el('div', {}, [el('b', {}, ['The enemy escaped!'])]));
        outcome.appendChild(el('div', { class: 'smallfont mt4' }, ['Its energy was spent and it fled the battle. You gain nothing.']));
      } else { // 'fled'
        outcome.appendChild(el('div', {}, [el('b', {}, ['You escaped.'])]));
        outcome.appendChild(el('div', { class: 'smallfont mt4' }, ['You live to fight another day. Your Fury has reset.']));
      }
      outcome.appendChild(el('div', { class: 'mt8' }, [
        el('button', {
          class: 'button',
          onclick: function () {
            // Fix #4b: js/core/battle.js endBattle() discards pendingLoot/pendingStolenLoot with
            // no warning, and uniques are monster-drop-only (never in shops/recipes) — so a missed
            // claim can be unrecoverable. Confirm before forfeiting.
            if (battle.pendingLoot || battle.pendingStolenLoot) {
              var forfeitNames = [];
              if (battle.pendingLoot) {
                var forfeitLoot = Game.Inventory.getItem(battle.pendingLoot);
                forfeitNames.push(forfeitLoot ? forfeitLoot.name : battle.pendingLoot);
              }
              if (battle.pendingStolenLoot) {
                var forfeitStolen = Game.Inventory.getItem(battle.pendingStolenLoot);
                forfeitNames.push(forfeitStolen ? forfeitStolen.name : battle.pendingStolenLoot);
              }
              if (!window.confirm('You still have unclaimed loot (' + forfeitNames.join(', ') + ') — leaving now forfeits it forever. Continue?')) return;
            }
            Game.Battle.endBattle();
            battleShowItems = false;
            Game.persist();
            navigate(battleReturnScreen);
          }
        }, ['Continue'])
      ]));
      right.appendChild(outcome);
    }

    // ---- Scrolling battle log ----
    var logPanel = el('div', { class: 'panel battle-log mt8' });
    battle.log.forEach(function (line) {
      logPanel.appendChild(el('div', { class: 'tinyfont' }, [line]));
    });
    right.appendChild(logPanel);

    layout.appendChild(right);
    root.appendChild(layout);

    // Fix #3: css/theme.css .battle-log is a fixed-height overflow-y:auto panel rebuilt on every
    // action; a freshly-built panel scrolls to the top by default, hiding the newest line(s) below
    // the fold. Scroll to the bottom — this MUST run after root.appendChild above: a detached
    // element's scrollHeight is 0, so scrolling before attachment is a silent no-op.
    // scrollHeight/scrollTop only exist on a real browser element (fakedom's FakeNode has
    // neither), so this is wrapped defensively rather than asserted on in tests.
    try {
      logPanel.scrollTop = logPanel.scrollHeight;
    } catch (e) { /* no-op under fakedom / non-DOM test harness */ }
  }

  // ---------- Router ----------

  var routes = {
    creation: function (root) { renderCreation(root); },
    status: function (root) { renderStatus(root); },
    inventory: function (root) { renderInventory(root); },
    techs: function (root) { renderTechs(root); },
    explore: function (root) { renderExplore(root); },
    battle: function (root) { renderBattle(root); },
    town: function (root) { renderTown(root); },
    journal: function (root) { renderJournal(root); }
  };

  var currentScreen = 'creation';

  function navigate(screenName) {
    if (!routes[screenName]) return;
    // Battle lock (New_Player_Guide.md: "once you've started a battle, you cannot access your
    // inventory or techniques"): while a battle exists, only the battle screen may render. Fix #2:
    // previously this was a silent `return`, which left a stale screen on-screen (soft lock) if
    // anything triggered a refresh/nav while a battle was live (e.g. a Camp ambush — see fix #1).
    // Redirect to the battle screen instead of blanking. The reassignment (rather than a nested
    // navigate() call) means this cannot recurse: the guard's condition is false once
    // screenName === 'battle'.
    if (Game.state.battle && screenName !== 'battle') {
      screenName = 'battle';
    }
    currentScreen = screenName;
    var root = document.getElementById('maincontent');
    routes[screenName](root);
    Game.renderNav();
    Game.renderStatusBars();
    if (Game.renderActions) Game.renderActions();
  }

  function getCurrentScreen() {
    return currentScreen;
  }

  // Opens the Town screen with a given facility panel pre-expanded — used by the sidebar
  // Actions panel's town quick-links (Game.renderActions, index.html).
  function openTownFacility(type) {
    townOpenFacility = type;
    navigate('town');
  }

  return {
    navigate: navigate,
    getCurrentScreen: getCurrentScreen,
    resetWizard: resetWizard,
    performHunt: performHunt,
    openTownFacility: openTownFacility,
    el: el
  };
})();

// v1.4 Mobile M3 (SPEC-MOBILE-UI.md §4 M3): shared toast helper for the high-frequency
// Hunt/Camp/Forage/touch-token results that used to alert(). Exposed on Game.UI (the namespace
// icons.js already establishes, loaded just before this file — see index.html script order) so
// BOTH this file's `notify()` above and index.html's Actions-panel handlers can reach it through
// the one Game namespace, with no new global.
//
// Renders into the static #toastbar element (index.html, a sibling placed immediately before
// #maincontent so re-rendering the current screen never wipes an in-flight toast — see the
// Camp/Forage ambush note above). Looked up by id and guarded exactly like Game.renderNav's
// #mobiletabs lookup: environments that never register #toastbar (every fakedom test bootstrap
// in tests/) just no-op instead of throwing, and since nothing above ever creates a live
// setTimeout in that case, the fakedom quirk about elements lacking `.style` never comes into
// play either — this helper only ever toggles `className`, never touches `.style`.
(function () {
  var toastTimer = null;

  function hideToast() {
    var bar = document.getElementById('toastbar');
    if (!bar) return;
    bar.className = 'toastbar';
    bar.textContent = '';
    toastTimer = null;
  }

  Game.UI = Game.UI || {};
  Game.UI.toast = function (message) {
    var bar = document.getElementById('toastbar');
    if (!bar) return; // no container in this environment (e.g. test fakedom) -- silent no-op
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    bar.textContent = message;
    bar.className = 'toastbar toastbar-visible';
    // Tap-to-dismiss: bind once per element rather than once per toast() call.
    if (!bar._toastClickBound) {
      bar._toastClickBound = true;
      bar.addEventListener('click', hideToast);
    }
    // Multiple calls replace the previous toast, never stack (single timer, single message).
    toastTimer = setTimeout(hideToast, 4000);
    // Belt-and-suspenders for a hypothetical future Node/fakedom harness that DOES register
    // #toastbar: don't let a live timer keep the process alive after the script's done with it.
    // Browsers' setTimeout return value has no .unref, so this is a no-op there.
    if (toastTimer && typeof toastTimer.unref === 'function') toastTimer.unref();
  };
})();

window.Game = Game;
