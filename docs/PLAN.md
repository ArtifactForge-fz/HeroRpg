# HeroRPG Remake — Implementation Plan

Workflow per phase: **Fable** writes the phase spec (referencing DESIGN.md sections) → **Sonnet**
subagent implements → **Fable** reviews the diff and playtests before the next phase starts.
Each phase ends in a state that loads and runs in a browser.

## Architecture

Static site, no build step:

```
HeroRPG/
  index.html          app shell: left nav, status bars, content panel
  css/theme.css       ported from reference/site/theme_inline.css (authentic 2008 palette)
  js/
    balance.js        every tunable number; archived values commented with source file
    data/             content as plain JS objects (no JSON fetch — file:// friendly)
      items.js  monsters.js  areas.js  techs.js  quests.js  classes.js  shrine.js
    core/
      character.js    stats, derived stats, leveling, skills
      battle.js       turn engine, damage, fear, fury, statuses, loot
      inventory.js    weight, equip slots, requirements, cursed
      world.js        travel, hunting, camping, town facilities
      quests.js       journal state machine
      save.js         localStorage, versioned, export/import
    ui/
      screens.js      status/inventory/techs/explore/town/journal/battle renderers
      dragdrop.js     inventory + tech-set drag and drop
      infobox.js      item/tech double-click windows
    debug.js          Game._debug(): give gold/items, set level, force encounters
  docs/               DESIGN.md, PLAN.md, phase specs (SPEC-P1.md, …)
  reference/          scraped source material (read-only)
```

State lives in one `Game.state` object; screens re-render from state (no framework).

## Phases

### P1 — Shell & character core
App shell with authentic theme; character creation (race → 5 skill points cap 3 → name/gender);
Status screen with all stats, derived values, counters, level-progress bar; save/load; debug
harness. **Exit test:** create an Arkan, refresh browser, character persists, stats correct.

### P2 — Inventory & items
`items.js` starter set (~25 items: weapons of each skill type, armor tiers, tents, potions,
crystals); weight/encumbrance; drag-and-drop equip/unequip/discard; requirements; item info
window; derived Damage/Armor/Magic Armor update on equip. **Exit test:** equip flows, red
requirements block, discard confirms.

### P3 — Battle engine
Turn engine per DESIGN §4: dex-order, attack/tech/item/flee, energy costs, fear, fury meter,
dodge/double-attack/glancing, Anima-grade resistances, statuses (Poison/Haunting/Curse), win
rewards (XP, skill XP with cap `2L+1`, gold, shards), explicit Loot click, death (no loss, back
to town). First 8 monsters + 1 boss. **Exit test:** scripted battle log sanity + manual fights at
level 1–5 feel survivable but tense.

### P4 — World & towns
Explore/travel with level gates; Hunt monster list; Camp (tent tiers); towns Eldor + Ju`Mak with
Shop (buy/sell), Inn, Vault, Academy (tech chains via Training Points), Spirit Shrine (buffs for
shards, uncurse fee), Synthesis (recipes). Areas: 5 hunting zones levels 1–40. **Exit test:** full
loop hunt→loot→sell→train→buff without debug commands.

### P5 — Quests & story
Journal (active/completed/cancel); ~12 quests including archived names (Standing Stones, Oruk,
Dr. Ferrier, Professor Flad); Prelude/Chapter I lore readable in-game (verbatim from archive);
invented Chapter II continuation. **Exit test:** quest chain playable 1→30.

### P6 — Classes & endgame
Class quest at 30 (Warrior/Magician/Rogue), class XP, primary/secondary, Academy class abilities;
one hidden class via monster-kill route; boss ladder to level 40. **Exit test:** reach 30 via
debug, complete class quest, class abilities usable in battle.

### P7 — Balance & polish pass
Playtest sweep (Fable), tune `balance.js`, empty-state/edge cases, save-version migration, README
for players. Optional homages: farewell.png easter egg, "Powered by RadiantRPG" footer.

## Milestone gates

- After P3: core loop review — does combat feel like a 2007 text MMO? Adjust before content build-out.
- After P6: feature-complete review against DESIGN.md checklist.

## Risks

- **Invented balance drift** — mitigated by balance.js single source + archived-constant comments.
- **Scope creep toward v3.0 ideas (Eidolons)** — explicitly out of v1; park in FUTURE.md if tempted.
- **Drag-and-drop jank without framework** — keep fallback click-to-equip buttons from P2 onward.
