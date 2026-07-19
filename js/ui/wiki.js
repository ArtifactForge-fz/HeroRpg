// HeroRPG remake — reference wiki renderer (docs/SPEC-V1.7-CONTENT-UX.md §6, Phase W).
// Standalone page (wiki.html) generated at load time from Game.Data.* — mirrors the
// changelog.html standalone-page pattern (js/data/changelog.js). NO game data is duplicated
// here: every table is built by reading Game.Data.items / .monsters / .areas / .techs / .recipes
// straight off whatever the page loaded.
//
// Deliberately pure-data-first: every buildXRows()/findX() function below returns plain objects
// with no DOM, so tests/test_wiki.js can assert on the underlying cross-references (e.g. "does
// this monster's drop chance come out as a rounded percentage") without scraping rendered HTML.
// render() then turns those rows into DOM using the same el()-helper pattern as
// js/ui/screens.js. Lives in js/ui/ rather than js/core/ per CLAUDE.md's "js/core/* are pure
// state machines, no DOM" rule — this module touches the DOM directly (even though wiki.html is
// a standalone page, not one of the game's screens).

var Game = window.Game || {};

Game.Wiki = (function () {

  function indexBy(list, keyFn) {
    var map = {};
    (list || []).forEach(function (entry) {
      map[keyFn(entry)] = entry;
    });
    return map;
  }

  function itemIndex() { return indexBy(Game.Data && Game.Data.items, function (i) { return i.id; }); }
  function monsterIndex() { return indexBy(Game.Data && Game.Data.monsters, function (m) { return m.id; }); }

  function itemName(id, items) {
    items = items || itemIndex();
    return (items[id] && items[id].name) || id;
  }
  function monsterName(id, monsters) {
    monsters = monsters || monsterIndex();
    return (monsters[id] && monsters[id].name) || id;
  }

  // ---------- Cross-references (the wiki's headline ask: "where is this sold / dropped / found") ----------
  // Drop tables roll top-down, first-hit-wins (CLAUDE.md content convention) — that ordering
  // matters for actual gameplay resolution, not for this reference display, so entries are just
  // listed in their authored (first-hit-wins) order here.

  // Every shop-type facility, across every area, whose stock[] contains itemId.
  function itemShopSources(itemId) {
    var out = [];
    (Game.Data.areas || []).forEach(function (area) {
      (area.facilities || []).forEach(function (f) {
        if (f.type !== 'shop' || !f.stock) return;
        if (f.stock.indexOf(itemId) !== -1) out.push(area.name);
      });
    });
    return out;
  }

  // Every monster whose drops[] contains itemId, with that entry's rate as a rounded percentage.
  function itemDropSources(itemId) {
    var out = [];
    (Game.Data.monsters || []).forEach(function (m) {
      (m.drops || []).forEach(function (d) {
        if (d.itemId === itemId) out.push({ monsterId: m.id, monsterName: m.name, pct: Math.round(d.chance * 100) });
      });
    });
    return out;
  }

  // v1.8 P4 (Task B, audit §6): the remaining Source axes the v1.7 wiki never covered — forage,
  // quest rewards, quest hand-outs, recipe outputs, and AA-Exchange stock. All read straight from
  // Game.Data at render time, same discipline as itemShopSources/itemDropSources above.

  // Every area whose forage[] table (js/data/areas.js) contains itemId.
  function itemForageSources(itemId) {
    var out = [];
    (Game.Data.areas || []).forEach(function (area) {
      if ((area.forage || []).indexOf(itemId) !== -1) out.push(area.name);
    });
    return out;
  }

  // Every quest whose rewards.items[] (js/data/quests.js) contains itemId — a turn-in reward.
  function itemQuestRewardSources(itemId) {
    var out = [];
    (Game.Data.quests || []).forEach(function (q) {
      if (q.rewards && (q.rewards.items || []).indexOf(itemId) !== -1) out.push(q.name);
    });
    return out;
  }

  // Every quest whose acceptItems[] (js/data/quests.js) hands itemId to the player on accept —
  // distinct from a turn-in reward (e.g. quest_sealed_supply_crate, handed over then carried
  // back for its own collect step).
  function itemQuestHandoutSources(itemId) {
    var out = [];
    (Game.Data.quests || []).forEach(function (q) {
      if ((q.acceptItems || []).indexOf(itemId) !== -1) out.push(q.name);
    });
    return out;
  }

  // Every recipe whose output === itemId (js/data/recipes.js) — a synthesized item.
  function itemRecipeOutputSources(itemId) {
    var out = [];
    (Game.Data.recipes || []).forEach(function (r) {
      if (r.output === itemId) out.push(r.id);
    });
    return out;
  }

  // Every AA-Exchange facility stocking itemId. AUDIT-ITEM-REACHABILITY.md §1 scan-bug note: the
  // Exchange's stock array holds `{itemId, costAp}` OBJECTS, not plain ids like a shop's stock —
  // missing this falsely marks all AP-shop stock unobtainable, so it's checked explicitly here
  // rather than reusing itemShopSources' plain-id `.indexOf`.
  function itemExchangeSources(itemId) {
    var out = [];
    (Game.Data.areas || []).forEach(function (area) {
      (area.facilities || []).forEach(function (f) {
        if (f.type !== 'exchange' || !f.stock) return;
        f.stock.forEach(function (entry) {
          if (entry && entry.itemId === itemId) out.push({ areaName: area.name, costAp: entry.costAp });
        });
      });
    });
    return out;
  }

  // ---------- "Used for" (audit §6's other half — what consumes a drop-only material) ----------

  // Every recipe whose inputs[] (js/data/recipes.js) includes itemId — a crafting ingredient.
  function itemRecipeInputTargets(itemId) {
    var out = [];
    (Game.Data.recipes || []).forEach(function (r) {
      if ((r.inputs || []).indexOf(itemId) !== -1) out.push(r);
    });
    return out;
  }

  // Every quest with a `{kind:'collect', itemId}` step (js/data/quests.js) targeting itemId — the
  // Condensed-Anima-Core class of confusion this audit exists to close.
  function itemQuestCollectTargets(itemId) {
    var out = [];
    (Game.Data.quests || []).forEach(function (q) {
      (q.steps || []).forEach(function (step) {
        if (step.kind === 'collect' && step.itemId === itemId) out.push(q.name);
      });
    });
    return out;
  }

  // Every area whose hunt list or lair carries monsterId.
  function monsterLocations(monsterId) {
    var out = [];
    (Game.Data.areas || []).forEach(function (area) {
      if ((area.monsters || []).indexOf(monsterId) !== -1) {
        out.push({ areaId: area.id, areaName: area.name, kind: 'hunt' });
      }
      if (area.lair && area.lair.monsterId === monsterId) {
        out.push({ areaId: area.id, areaName: area.name, kind: 'lair', lairName: area.lair.name });
      }
    });
    return out;
  }

  // Recommended level range for an area, derived from its own monster roster — same approach as
  // js/ui/screens.js's destLevelRange (Explore's Destinations cards), reimplemented against
  // Game.Data.monsters directly since wiki.html never loads js/core/battle.js (no Game.Battle
  // .getMonsterDef available on this standalone page).
  function areaLevelRange(area) {
    var monsters = monsterIndex();
    var ids = (area.monsters || []).slice();
    if (area.lair && area.lair.monsterId) ids.push(area.lair.monsterId);
    var levels = ids
      .map(function (id) { return monsters[id]; })
      .filter(function (m) { return !!m; })
      .map(function (m) { return m.level; });
    if (levels.length === 0) return null;
    var min = Math.min.apply(null, levels);
    var max = Math.max.apply(null, levels);
    return min === max ? ('Lv ' + min) : ('Lv ' + min + '–' + max);
  }

  // ---------- Row builders (pure data; DOM-free, directly testable) ----------

  function buildItemRows() {
    var items = itemIndex();
    return (Game.Data.items || []).map(function (item) {
      return {
        item: item,
        // ---- Source ----
        shops: itemShopSources(item.id),
        drops: itemDropSources(item.id),
        forage: itemForageSources(item.id),
        questRewards: itemQuestRewardSources(item.id),
        questHandouts: itemQuestHandoutSources(item.id),
        recipeOutputs: itemRecipeOutputSources(item.id),
        exchanges: itemExchangeSources(item.id),
        // ---- Used for ----
        recipeInputs: itemRecipeInputTargets(item.id).map(function (r) {
          return r.id + ' -> ' + itemName(r.output, items);
        }),
        collectTargets: itemQuestCollectTargets(item.id)
      };
    });
  }

  function buildMonsterRows() {
    var items = itemIndex();
    return (Game.Data.monsters || []).map(function (m) {
      return {
        monster: m,
        locations: monsterLocations(m.id),
        drops: (m.drops || []).map(function (d) {
          return { itemId: d.itemId, itemName: itemName(d.itemId, items), pct: Math.round(d.chance * 100) };
        })
      };
    });
  }

  function buildAreaRows() {
    var monsters = monsterIndex();
    return (Game.Data.areas || []).map(function (area) {
      return {
        area: area,
        levelRange: areaLevelRange(area),
        monsterNames: (area.monsters || []).map(function (id) { return monsterName(id, monsters); }),
        lairName: area.lair ? monsterName(area.lair.monsterId, monsters) : null,
        forage: (area.forage || []).slice()
      };
    });
  }

  // Techniques grouped by chain (spec: "group by chain if easy"); chains sorted alphabetically,
  // ranks within a chain sorted numerically. Monster-only techs (id prefix mon_, per
  // js/data/techs.js header comment) have no `chain` field — each falls into its own
  // single-entry group keyed by name so nothing is silently dropped.
  function buildTechChains() {
    var chains = {};
    var order = [];
    (Game.Data.techs || []).forEach(function (t) {
      var key = t.chain || t.name;
      if (!chains[key]) { chains[key] = []; order.push(key); }
      chains[key].push(t);
    });
    var names = order.slice().sort();
    return names.map(function (name) {
      var techs = chains[name].slice().sort(function (a, b) { return (a.rank || 0) - (b.rank || 0); });
      return { chain: name, techs: techs };
    });
  }

  function buildRecipeRows() {
    var items = itemIndex();
    return (Game.Data.recipes || []).map(function (r) {
      return {
        recipe: r,
        inputNames: (r.inputs || []).map(function (id) { return itemName(id, items); }),
        outputName: itemName(r.output, items)
      };
    });
  }

  // ---------- DOM rendering ----------

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        if (attrs[k] === null || attrs[k] === undefined) continue;
        if (k === 'class') e.className = attrs[k];
        else if (k === 'id') e.id = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      children.forEach(function (child) {
        if (child == null) return;
        e.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
      });
    }
    return e;
  }

  function statReqText(reqs) {
    if (!reqs) return '';
    return Object.keys(reqs).map(function (k) { return k + ' ' + reqs[k]; }).join(', ');
  }

  // A per-section text filter: toggles the `.wiki-hidden` class (CSS `display:none`, defined
  // inline in wiki.html) rather than writing `.style` directly — fakedom's dynamically-created
  // elements don't carry a live `.style` object (see CLAUDE.md's testing note / test_wiki.js),
  // and className is the one toggle every row supports identically in the browser and the
  // harness.
  function attachFilter(input, entries) {
    input.addEventListener('keyup', function () {
      var q = (input.value || '').toLowerCase();
      entries.forEach(function (e) {
        var hit = !q || e.text.toLowerCase().indexOf(q) !== -1;
        e.node.className = hit ? '' : 'wiki-hidden';
      });
    });
  }

  function filterBox(placeholder) {
    return el('input', { type: 'text', class: 'wiki-filter smallfont', placeholder: placeholder || 'Filter...' });
  }

  function section(id, title) {
    var wrap = el('div', { id: id, class: 'wiki-section mt8' });
    wrap.appendChild(el('div', { class: 'tcat' }, [title]));
    return wrap;
  }

  function table(headers) {
    var t = el('table', { class: 'hrpg-table' });
    var thead = el('tr', { class: 'thead' });
    headers.forEach(function (h) { thead.appendChild(el('th', {}, [h])); });
    t.appendChild(thead);
    return t;
  }

  function scrollWrap(node) {
    var wrap = el('div', { class: 'scroll-x' });
    wrap.appendChild(node);
    return wrap;
  }

  function icon(id) {
    return el('img', { class: 'icon32', src: 'assets/icons/' + id + '.png', alt: id });
  }

  function renderItemsSection() {
    var rows = buildItemRows();
    var wrap = section('wiki-items', 'Items (' + rows.length + ')');
    var box = filterBox('Filter items by name, slot, skill, id, or tag...');
    wrap.appendChild(el('div', { class: 'panel mb8' }, [box]));

    var t = table(['Icon', 'Name', 'Slot', 'Skill', 'Stats', 'Value', 'Tags', 'Source', 'Used for']);
    var entries = [];
    rows.forEach(function (r) {
      var item = r.item;
      var stats = [];
      if (item.damage) stats.push('Dmg ' + item.damage);
      if (item.armor) stats.push('Armor ' + item.armor);
      if (item.magicArmor) stats.push('MArmor ' + item.magicArmor);
      var reqText = statReqText(item.statReqs);
      if (reqText) stats.push('Req: ' + reqText);

      // v1.8 P4 (Task B, audit §6): Source now covers every acquisition path the audit's own
      // reachability scan checks (js/ui/wiki.js buildItemRows) — shops, drops, forage, quest
      // rewards, quest hand-outs, recipe outputs, and AA-Exchange stock.
      var sourceParts = [];
      if (r.shops.length) sourceParts.push('Sold: ' + r.shops.join(', '));
      if (r.drops.length) {
        sourceParts.push('Drops: ' + r.drops.map(function (d) { return d.monsterName + ' (' + d.pct + '%)'; }).join(', '));
      }
      if (r.forage.length) sourceParts.push('Forage: ' + r.forage.join(', '));
      if (r.questRewards.length) sourceParts.push('Quest reward: ' + r.questRewards.join(', '));
      if (r.questHandouts.length) sourceParts.push('Quest hand-out: ' + r.questHandouts.join(', '));
      if (r.recipeOutputs.length) sourceParts.push('Synthesized: ' + r.recipeOutputs.join(', '));
      if (r.exchanges.length) {
        sourceParts.push('AA Exchange: ' + r.exchanges.map(function (x) { return x.areaName + ' (' + x.costAp + ' AP)'; }).join(', '));
      }
      if (!sourceParts.length) sourceParts.push('—');

      // NEW "Used for" column (audit §6): recipe inputs + quest collect-step targets — the exact
      // cross-reference that would have made a drop-only quest material like
      // quest_condensed_anima_core legible without reading js/data/quests.js by hand.
      var usedForParts = [];
      if (r.recipeInputs.length) usedForParts.push('Recipe input: ' + r.recipeInputs.join(', '));
      if (r.collectTargets.length) usedForParts.push('Quest collect target: ' + r.collectTargets.join(', '));
      if (!usedForParts.length) usedForParts.push('—');

      var tr = el('tr', { title: item.desc || '' }, [
        el('td', {}, [icon(item.id)]),
        el('td', {}, [item.name]),
        el('td', { class: 'tinyfont' }, [item.slot || '']),
        el('td', { class: 'tinyfont' }, [item.skill || '']),
        el('td', { class: 'tinyfont' }, [stats.join(' / ') || '—']),
        el('td', { class: 'tinyfont right' }, [item.value != null ? String(item.value) : '']),
        el('td', { class: 'tinyfont' }, [(item.tags || []).join(', ')]),
        el('td', { class: 'tinyfont' }, [sourceParts.join('  —  ')]),
        el('td', { class: 'tinyfont' }, [usedForParts.join('  —  ')])
      ]);
      var text = [item.name, item.id, item.slot, item.skill, (item.tags || []).join(' ')].join(' ');
      entries.push({ node: tr, text: text });
      t.appendChild(tr);
    });
    attachFilter(box, entries);
    wrap.appendChild(scrollWrap(t));
    return wrap;
  }

  function renderMonstersSection() {
    var rows = buildMonsterRows();
    var wrap = section('wiki-monsters', 'Monsters (' + rows.length + ')');
    var box = filterBox('Filter monsters by name, id, or location...');
    wrap.appendChild(el('div', { class: 'panel mb8' }, [box]));

    var t = table(['Icon', 'Name', 'Lvl', 'HP', 'Dmg', 'Armor', 'MArmor', 'XP', 'Gold', 'Shard%', 'Drops (rate)', 'Found in']);
    var entries = [];
    rows.forEach(function (r) {
      var m = r.monster;
      var dropsText = r.drops.length
        ? r.drops.map(function (d) { return d.itemName + ' (' + d.pct + '%)'; }).join(', ')
        : '—';
      var locText = r.locations.length
        ? r.locations.map(function (l) { return l.kind === 'lair' ? (l.areaName + ' [Lair: ' + l.lairName + ']') : l.areaName; }).join(', ')
        : '—';
      var tr = el('tr', { title: m.desc || '' }, [
        el('td', {}, [icon(m.id)]),
        el('td', {}, [m.name]),
        el('td', { class: 'tinyfont right' }, [String(m.level)]),
        el('td', { class: 'tinyfont right' }, [String(m.hp)]),
        el('td', { class: 'tinyfont right' }, [String(m.damage)]),
        el('td', { class: 'tinyfont right' }, [String(m.armor)]),
        el('td', { class: 'tinyfont right' }, [String(m.magicArmor || 0)]),
        el('td', { class: 'tinyfont right' }, [String(m.xp)]),
        el('td', { class: 'tinyfont right' }, [m.goldMin + '–' + m.goldMax]),
        el('td', { class: 'tinyfont right' }, [Math.round((m.shardChance || 0) * 100) + '%']),
        el('td', { class: 'tinyfont' }, [dropsText]),
        el('td', { class: 'tinyfont' }, [locText])
      ]);
      var text = [m.name, m.id, locText].join(' ');
      entries.push({ node: tr, text: text });
      t.appendChild(tr);
    });
    attachFilter(box, entries);
    wrap.appendChild(scrollWrap(t));
    return wrap;
  }

  function renderAreasSection() {
    var rows = buildAreaRows();
    var wrap = section('wiki-areas', 'Areas (' + rows.length + ')');
    var box = filterBox('Filter areas by name or monster...');
    wrap.appendChild(el('div', { class: 'panel mb8' }, [box]));

    var t = table(['Name', 'Type', 'Min Lvl', 'Level Range', 'Monsters', 'Lair', 'Forage']);
    var entries = [];
    rows.forEach(function (r) {
      var area = r.area;
      var lairText = area.lair ? (r.lairName + ' (Lv ' + area.lair.minLevel + ')') : '—';
      var tr = el('tr', { title: area.desc || '' }, [
        el('td', {}, [area.name]),
        el('td', { class: 'tinyfont' }, [area.type === 'town' ? 'Town' : 'Wilds']),
        el('td', { class: 'tinyfont right' }, [String(area.minLevel)]),
        el('td', { class: 'tinyfont' }, [r.levelRange || '—']),
        el('td', { class: 'tinyfont' }, [r.monsterNames.join(', ') || '—']),
        el('td', { class: 'tinyfont' }, [lairText]),
        el('td', { class: 'tinyfont' }, [r.forage.join(', ') || '—'])
      ]);
      var text = [area.name, area.id, r.monsterNames.join(' ')].join(' ');
      entries.push({ node: tr, text: text });
      t.appendChild(tr);
    });
    attachFilter(box, entries);
    wrap.appendChild(scrollWrap(t));
    return wrap;
  }

  // v1.8 P4 (Task B, SPEC-TECH-POLARITY.md §2.0): plain-English summary of a tech's new v1.8 P1
  // fields (typed statKind buffs, debuffs incl. bleed, equipment gates, goldSteal) — a standalone
  // copy of js/ui/screens.js's techEffectSummary, kept independent because wiki.html is a
  // standalone page that never loads screens.js (only js/data/*.js + this file). Purely
  // tech-field-driven so the concurrent P3 agent's 72 new techs render with no changes here.
  var WIKI_STAT_KIND_LABEL = { armor: 'Armor', dodge: 'Dodge', double_attack: 'Double Attack', spellpower: 'Spell Power' };
  var WIKI_DEBUFF_KIND_LABEL = { damage: 'Damage', armor: 'Armor' };
  var WIKI_ARMOR_CLASS_LABEL = { light: 'Light Armor', medium: 'Medium Armor', heavy: 'Heavy Armor' };

  function techDetailText(tech) {
    var parts = [];
    if (tech.effect === 'buff' && tech.statKind) {
      var buffLabel = WIKI_STAT_KIND_LABEL[tech.statKind] || tech.statKind;
      var buffDuration = tech.buffDuration || 3;
      parts.push((tech.statKind === 'dodge' || tech.statKind === 'double_attack')
        ? ('+' + Math.round(tech.power * 100) + '% ' + buffLabel + ' (' + buffDuration + ' turns)')
        : ('+' + tech.power + ' ' + buffLabel + ' (' + buffDuration + ' turns)'));
    }
    if (tech.effect === 'debuff') {
      var debuffDuration = tech.debuffDuration || 3;
      parts.push(tech.debuffKind === 'bleed'
        ? ('Bleed ' + tech.power + '/turn (' + debuffDuration + ' turns)')
        : ('Weakens enemy ' + (WIKI_DEBUFF_KIND_LABEL[tech.debuffKind] || tech.debuffKind) + ' (' + debuffDuration + ' turns)'));
    }
    if (tech.requiresShield) parts.push('Requires Shield');
    if (tech.requiresOffhandWeapon) parts.push('Requires offhand weapon');
    if (tech.requiresArmorClass) parts.push('Requires ' + (WIKI_ARMOR_CLASS_LABEL[tech.requiresArmorClass] || tech.requiresArmorClass));
    if (tech.goldSteal) parts.push('Steals ' + tech.goldSteal + ' gold on hit');
    return parts.join('; ') || '—';
  }

  function renderTechsSection() {
    var chains = buildTechChains();
    var totalCount = (Game.Data.techs || []).length;
    var wrap = section('wiki-techs', 'Techniques (' + totalCount + ')');
    var box = filterBox('Filter techniques by name, chain, or skill...');
    wrap.appendChild(el('div', { class: 'panel mb8' }, [box]));

    var t = table(['Chain', 'Name', 'Skill', 'Grade', 'Effect', 'Power', 'Details', 'Energy', 'Skill Req', 'Shard Cost', 'Class Only']);
    var entries = [];
    chains.forEach(function (group) {
      group.techs.forEach(function (tech) {
        var tr = el('tr', { title: tech.desc || '' }, [
          el('td', { class: 'tinyfont' }, [group.chain]),
          el('td', {}, [tech.name]),
          el('td', { class: 'tinyfont' }, [tech.skill || '']),
          el('td', { class: 'tinyfont' }, [tech.grade || '—']),
          el('td', { class: 'tinyfont' }, [tech.effect || '']),
          el('td', { class: 'tinyfont right' }, [tech.power != null ? String(tech.power) : (tech.powerMult != null ? ('x' + tech.powerMult) : '')]),
          // v1.8 P4 (Task B): the new effect types (debuff / typed statKind buff) and their key
          // numbers — equipment gates and goldSteal riders, which can accompany any effect type.
          el('td', { class: 'tinyfont' }, [techDetailText(tech)]),
          el('td', { class: 'tinyfont right' }, [tech.energyCost != null ? String(tech.energyCost) : '']),
          el('td', { class: 'tinyfont right' }, [tech.skillReq != null ? String(tech.skillReq) : '']),
          el('td', { class: 'tinyfont right' }, [tech.shardCost != null ? String(tech.shardCost) : '']),
          el('td', { class: 'tinyfont' }, [tech.classOnly ? 'Yes' : ''])
        ]);
        var text = [tech.name, tech.id, group.chain, tech.skill].join(' ');
        entries.push({ node: tr, text: text });
        t.appendChild(tr);
      });
    });
    attachFilter(box, entries);
    wrap.appendChild(scrollWrap(t));
    return wrap;
  }

  function renderRecipesSection() {
    var rows = buildRecipeRows();
    var wrap = section('wiki-recipes', 'Recipes (' + rows.length + ')');
    var box = filterBox('Filter recipes by input or output name...');
    wrap.appendChild(el('div', { class: 'panel mb8' }, [box]));

    var t = table(['Inputs', 'Gold', 'Output', 'Description']);
    var entries = [];
    rows.forEach(function (r) {
      var tr = el('tr', {}, [
        el('td', { class: 'tinyfont' }, [r.inputNames.join(' + ')]),
        el('td', { class: 'tinyfont right' }, [String(r.recipe.gold)]),
        el('td', {}, [r.outputName]),
        el('td', { class: 'tinyfont' }, [r.recipe.desc || ''])
      ]);
      var text = [r.inputNames.join(' '), r.outputName, r.recipe.id].join(' ');
      entries.push({ node: tr, text: text });
      t.appendChild(tr);
    });
    attachFilter(box, entries);
    wrap.appendChild(scrollWrap(t));
    return wrap;
  }

  // Top jump-nav — five anchors, one per section, so a long single-page wiki (270+ items) is
  // still easy to get around without a build step's worth of routing.
  function renderNav() {
    var nav = el('div', { class: 'panel wiki-nav mb8' }, [
      el('a', { href: '#wiki-items' }, ['Items']),
      ' · ',
      el('a', { href: '#wiki-monsters' }, ['Monsters']),
      ' · ',
      el('a', { href: '#wiki-areas' }, ['Areas']),
      ' · ',
      el('a', { href: '#wiki-techs' }, ['Techniques']),
      ' · ',
      el('a', { href: '#wiki-recipes' }, ['Recipes'])
    ]);
    return nav;
  }

  function render(rootEl) {
    rootEl.innerHTML = '';
    rootEl.appendChild(renderNav());
    rootEl.appendChild(renderItemsSection());
    rootEl.appendChild(renderMonstersSection());
    rootEl.appendChild(renderAreasSection());
    rootEl.appendChild(renderTechsSection());
    rootEl.appendChild(renderRecipesSection());
  }

  return {
    // cross-references
    itemShopSources: itemShopSources,
    itemDropSources: itemDropSources,
    // v1.8 P4 (Task B, audit §6): the remaining Source/Used-for axes.
    itemForageSources: itemForageSources,
    itemQuestRewardSources: itemQuestRewardSources,
    itemQuestHandoutSources: itemQuestHandoutSources,
    itemRecipeOutputSources: itemRecipeOutputSources,
    itemExchangeSources: itemExchangeSources,
    itemRecipeInputTargets: itemRecipeInputTargets,
    itemQuestCollectTargets: itemQuestCollectTargets,
    monsterLocations: monsterLocations,
    areaLevelRange: areaLevelRange,
    techDetailText: techDetailText,
    // row builders
    buildItemRows: buildItemRows,
    buildMonsterRows: buildMonsterRows,
    buildAreaRows: buildAreaRows,
    buildTechChains: buildTechChains,
    buildRecipeRows: buildRecipeRows,
    // rendering
    renderItemsSection: renderItemsSection,
    renderMonstersSection: renderMonstersSection,
    renderAreasSection: renderAreasSection,
    renderTechsSection: renderTechsSection,
    renderRecipesSection: renderRecipesSection,
    render: render
  };
})();

window.Game = Game;
