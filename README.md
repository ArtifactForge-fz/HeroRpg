# HeroRPG Remake

A recreation of **HeroRPG** (herorpg.net, ~2005–2008), a free text-based multiplayer browser RPG by a developer known as "Eden" (successor to *Legend of Arcadia*). The original was shut down on March 11, 2008, mid-way through its v3.0 rewrite. This project rebuilds a faithful single-player/local version of its systems, world, and feel.

## How to play

Open `index.html` in any browser (double-click — no server or install needed). Your character saves automatically in the browser (localStorage); use the Save panel to export/import a save string as backup.

- Create a character (**Human** starts in **Eldor**, **Arkan** in **Saratus**) → 5 skill points → name. Skills are use-based and now matter in play: weapon/armor skills scale your damage and defense, Dodge/Double Attack/Thievery/Dual Wield all train and pay off. Hunt, loot, sell, learn techniques at the **Academy**, take quests from the **Tavern**.
- **Levels 1–100 are playable** (`BALANCE.LEVEL_CAP`). The early game (1–40) spans Eldor, Ju`Mak, **Laik**, Saratus and a Kastengard outpost; a level-40+ **northward story arc** then climbs the Forests of Kuraan → Majiku Highlands → the Frozen Reaches/Ukai → the Estari Anima ruins → Eidas's Skyspire → the **Red Moon**, ending in the **Eidas Ascendant** capstone boss at level 100 (Frosthold Waystation is the late-game hub). **Classes are three tiers:** base **Warrior/Magician/Thief** at level 5 ("The First Calling") → advanced (Gladiator/Crusader, Wizard/Sage, Rogue/Mercenary) at level 30 ("The Trials of Ascension") → tier-3 **Shadowknight/Magus/Gambit** at level 60 ("The Master's Calling"). Three hidden **Legendary** classes exist. (The "The Echo of Eidas" quest at level 36 is a mid-arc act-break, not the finale.)
- The **Journal → Story** tab holds the original 2007 lore (Prelude, Chapter I) plus the invented continuation through Chapter IV and an Epilogue.
- Console debug helpers for tinkering: `Game._debug` (e.g. `.setLevel(60)`, `.addGold(500)`, `.listQuests()`).

Development status: **v1.3 — the level-100 arc** (save version 9). On top of v1.2 it extends the playable range from 40 to the archived level-100 cap: ~13 new hunting areas + 2 settlements across six regions, ~40 new monsters and bosses, tapered high-tier gear, extended tech chains, the Arkan/Estari/Eidas story spine, and a balance pass proven by simulation (at-level fights and bosses hold the difficulty contract; see the known-limitation note below). Ten regression suites cover the systems.

> **Known limitation (v1.3):** the archived "fighting 5+ levels above you = near-certain death (Fear)" rule isn't fully enforced at high levels — a fully-supplied character can out-sustain a deeply-out-leveled fight via healing (which Fear deliberately spares) plus energy items. At-level and boss balance are unaffected. A deeper Fear/healing/energy pass is deferred (see `js/balance.js` F1 notes and `docs/SPEC-FULL-LEVEL-ARC.md`).

**This project is unrelated to the Avatar tactics game** in `Test game generation` — keep contexts separate.

## Layout

- `reference/` — raw material scraped from the Wayback Machine (manual wiki, forum archive, site pages, CSS). See `reference/SOURCES.md` for the index. Treat as read-only source material.
- `docs/` — distilled design documents (`DESIGN.md`: reconstructed game systems; `PLAN.md`: implementation roadmap).
- Game source will live at the root (structure decided in PLAN.md).

## Ground truth vs. invention

The archive preserves the **systems and world** (stats, classes, skills, armor tiers, town facilities, races, locations, lore) but not the **server-side numbers** (damage formulas, XP curves, item/monster databases, drop rates). Design docs mark each mechanic as `[archived]` (documented in reference/), `[invented]` (lost data, designed in the original's spirit), or `[revised]` (a user-directed override of an archived rule).

## Workflow

- **Fable**: scoping, planning, design decisions, code review.
- **Sonnet** (subagents): implementation and mechanical tasks.
