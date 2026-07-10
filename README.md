# HeroRPG Remake

A recreation of **HeroRPG** (herorpg.net, ~2005–2008), a free text-based multiplayer browser RPG by a developer known as "Eden" (successor to *Legend of Arcadia*). The original was shut down on March 11, 2008, mid-way through its v3.0 rewrite. This project rebuilds a faithful single-player/local version of its systems, world, and feel.

## How to play

Open `index.html` in any browser (double-click — no server or install needed). Your character saves automatically in the browser (localStorage); use the Save panel to export/import a save string as backup.

- Create a character (**Human** starts in **Eldor**, **Arkan** in **Saratus**) → 5 skill points → name. Skills are use-based and now matter in play: weapon/armor skills scale your damage and defense, Dodge/Double Attack/Thievery/Dual Wield all train and pay off. Hunt, loot, sell, learn techniques at the **Academy**, take quests from the **Tavern**.
- Levels 1–40 are playable across the hunting regions and towns (Eldor, Ju`Mak, **Laik**, Saratus, plus a Kastengard endgame outpost). **Classes are three tiers:** base **Warrior/Magician/Thief** at level 5 ("The First Calling") → advanced (Gladiator/Crusader, Wizard/Sage, Rogue/Mercenary) at level 30 ("The Trials of Ascension") → tier-3 **Shadowknight/Magus/Gambit** at level 38 ("The Master's Calling"). Three hidden **Legendary** classes exist. The finale quest "The Echo of Eidas" opens at level 36.
- The **Journal → Story** tab holds the original 2007 lore (Prelude, Chapter I) plus a new Chapter II.
- Console debug helpers for tinkering: `Game._debug` (e.g. `.setLevel(30)`, `.addGold(500)`, `.listQuests()`).

Development status: **v1.2** (save version 9) — on top of the complete v1, adds the use-based skill system, Intelligence spell hit/miss, the Curse status, the three-tier class roster (15 classes), and a content pass (Laik town, a level-30+ outpost, graded Crystals & Spheres, an Arkan questline, expanded Spirit Shrine buffs and shard-cost techs). Ten regression suites cover the systems.

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
