# HeroRPG Remake

A recreation of **HeroRPG** (herorpg.net, ~2005–2008), a free text-based multiplayer browser RPG by a developer known as "Eden" (successor to *Legend of Arcadia*). The original was shut down on March 11, 2008, mid-way through its v3.0 rewrite. This project rebuilds a faithful single-player/local version of its systems, world, and feel.

## How to play

Open `index.html` in any browser (double-click — no server or install needed). Your character saves automatically in the browser (localStorage); use the Save panel to export/import a save string as backup.

- Create a character (race → 5 skill points → name), then hunt on the **Plains of Averast**, loot, sell in **Eldor**, learn techniques at the **Academy**, and take quests from the **Tavern**.
- Levels 1–40 are playable across 6 hunting regions and 3 towns. **Classes unlock at level 30** (Warrior/Magician/Rogue via "The Trials of Eldor"; one hidden Legendary class exists). The finale quest "The Echo of Eidas" opens at level 36.
- The **Journal → Story** tab holds the original 2007 lore (Prelude, Chapter I) plus a new Chapter II.
- Console debug helpers for tinkering: `Game._debug` (e.g. `.setLevel(30)`, `.addGold(500)`, `.listQuests()`).

Development status: **v1 complete** — all seven build phases (shell/character, inventory, battle engine, world/towns, quests/story, classes, endgame + balance pass) are done; eight regression suites cover the systems.

**This project is unrelated to the Avatar tactics game** in `Test game generation` — keep contexts separate.

## Layout

- `reference/` — raw material scraped from the Wayback Machine (manual wiki, forum archive, site pages, CSS). See `reference/SOURCES.md` for the index. Treat as read-only source material.
- `docs/` — distilled design documents (`DESIGN.md`: reconstructed game systems; `PLAN.md`: implementation roadmap).
- Game source will live at the root (structure decided in PLAN.md).

## Ground truth vs. invention

The archive preserves the **systems and world** (stats, classes, skills, armor tiers, town facilities, races, locations, lore) but not the **server-side numbers** (damage formulas, XP curves, item/monster databases, drop rates). Design docs must mark each mechanic as `[archived]` (documented in reference/) or `[invented]` (new balance/content in the original's spirit).

## Workflow

- **Fable**: scoping, planning, design decisions, code review.
- **Sonnet** (subagents): implementation and mechanical tasks.
