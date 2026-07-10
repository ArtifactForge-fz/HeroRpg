# HeroRPG Remake — Design Document

Distilled from the Wayback Machine reference material in `reference/` (see `reference/SOURCES.md`).
Every mechanic is tagged **[archived]** (documented in the source material, cite file) or **[invented]** (lost server-side data or new content, designed in the original's spirit).

## 1. Which HeroRPG are we remaking?

The archive spans three incompatible eras of the same project, run by one developer under successive
handles (Nerevar → Krelian → Eden) on his own "RadiantRPG" PHP engine:

| Era | Years | Character model | Source files |
|---|---|---|---|
| Hero RPG 2.0–5.1 (vBulletin add-on) | 2004–05 | Str/Def/Mag/Luck, HP/MP, ~16 community-made classes, world "Arca", Terakar storyline | `forum/t-449, t-559, t-587, t-597, t-631` |
| Hero RPG Network 6.x (tier system) | 2005–06 | 109 levels, class tiers (Warrior→Gladiator→…), stock market plans | `site/homepage_2006.md` |
| **HeroRPG v2.x** (standalone, wiki manual) | 2007–08 | 7 stats, 18 use-based skills, techniques, Anima, classes at 30, world "Exos" | `manual/*`, `site/homepage_2007/2008a` |
| v3.0 (announced, never shipped) | 2008 | Force/Cunning/Brilliance trees, Eidolons, elemental alignment | `manual/Version_3.0.md` |

**Target: HeroRPG v2.1, the 2007–08 era.** It is by far the best documented (the entire wiki manual
survives), it is the version the name "HeroRPG" properly refers to, and it is what a player from that
time would remember. The earlier eras contribute flavor (monster names, class concepts) as invention
fuel; v3.0 ideas (Eidolons) are explicitly out of scope for v1 of the remake — they were never the
game people played.

**Format: single-player browser game, no server.** The original was multiplayer, but its core loop
(hunt → battle → loot → town → level) is fully single-player; Eden himself noted it "can be played
solo." Multiplayer-only features (mail, trade, auction, chat, player top list) are cut or reworked as
NPC flavor. Persistence via localStorage. Static HTML/CSS/JS, no build step, no dependencies — same
delivery model as the original ("text-based, web 2.0", AJAX-era) and as the Avatar project.

## 2. World & story — [archived], near-complete

- World **Exos**; sole inhabited continent **Van Arius**, six regions. Region **Averast**: flat
  plains, mountain barrier north, Sea of Stars east, Ocean of Asterius south, isle of Juneros west
  (`manual/Van_Arius.md`, `Averast.md`).
- Races: **Human** (kingdom of Eldor, traders) and **Arkan** (oriental-flavored magic/technology
  culture, city of Saratus, displaced from the Forests of Kuraan by the **Majiku**) are playable.
  **Majiku** (northern tribal) and **Ukai** (cavern-dwelling) planned but never playable
  (`Human.md`, `Arkan.md`, `Prelude.md`, `New_Player_Guide.md`).
- Backstory (Prelude + Chapter I, verbatim in archive): the precursor race **Estari** discovered
  **Anima** — ninth-dimensional matter that is the life-force of Exos itself. Mining it would kill
  the planet; the Council of Three banned it. Renegade runologist **Eidas** reformed the Society of
  Modern Magic at **Kastengard**, built the **Skyspire**, and departed for the red moon to found a
  "divine race." Chapter II existed but was not captured — **[invented]** continuation needed.
- Known settlements/areas: **Royal City of Eldor** (human capital, has Spirit Shrine + Synthesis),
  **Saratus** (Arkan capital), **Ju`Mak Village**, **Laik, Riverside Village**, **Gares Riverbanks**
  (level 20 area) (`Recent_Updates.md`). All other hunting areas **[invented]** (the 2004-era names —
  Lochhollow Forest, Lost Dungeon, Springwyn Island, Mt. Tenyra — may be reused as homage).

## 3. Character system

### Stats — [archived] (`manual/<stat>.md`, `New_Player_Guide.md`)
- **Hit Points** — life; 0 = defeat. Raised by **Vitality**.
- **Energy** — spent on every battle action; empty bar = can only flee or die. (Enemy with empty
  energy immediately flees.)
- **Strength** — melee damage (ratio 2.5:1 damage, per `Recent_Updates.md` 2007-04-06), carrying
  capacity (encumbrance), feeds XP of Swords/Polearms skills.
- **Vitality** — HP.
- **Dexterity** — dodge & double-attack chance, battle turn order, feeds Knives/Dodge/Thievery/
  Dual Wield/Double Attack/Hand-to-Hand skill XP.
- **Intelligence** — spell damage factor & spell hit/miss, "Magic Armor" (caster defense), feeds
  the five magic-school skill XPs.
- **Endurance** — armor damage reduction, feeds armor-skill XP.
- Derived: **Damage** (weapon + Str/Dex/Int depending on weapon class: Swords/Blunt/Polearms←Str,
  Knives←Dex, Rods←Int), **Armor** (equipment + Endurance), **Magic Armor** (Int).
- Counters: Monster Kills, Player Kills (unimplemented in original — omit), Deaths.

### Creation — [archived] (`New_Player_Guide.md`)
Race (Human/Arkan) → distribute **5 skill points, max 3 per skill** → name + gender.

### Progression — [archived numbers]
- Level up grants **+2 Training Points** (buy techniques at Academy) and **+5 Stat Points**
  (`Level_Up.md`). Quests can grant extra TP (`Training_Points.md`).
- Areas and items gate on level (`Level.md`).
- **XP curve: [invented]** — nothing archived. Design target: level 30 (first class) reachable in a
  few hours of play.

### Skills — [archived list, use-based]
18 skills, leveled by use in combat (`Skills.md`): Swords, Polearms, Knives, Light/Medium/Heavy
Armor, Shields, Rods, Evocation, Conjuration, Alteration, Absorption, Abjuration, Dodge, Thievery,
Dual Wield, Double Attack, Hand to Hand.
Archived balance rules (`Recent_Updates.md`):
- Skill cap = **2 × CharLevel + 1**.
- Pacing target ≈ 2 skill levels per character level in a focused skill.
- Skill XP declines sharply when your level exceeds the enemy's; no bonus for low-level skills vs
  high-level monsters.
- Foot armor contributes no skill XP (still uses armor skills).
- Per-skill effects of the magic schools (what Evocation vs Conjuration etc. actually govern):
  **[invented]** — assign: Evocation=direct damage, Conjuration=summoned/DoT effects, Alteration=
  buffs/debuffs, Absorption=drains/shields, Abjuration=healing/cleansing (consistent with
  "Alteration is affected by Spell Powers" and "Healing spells use the Light grade").

### Classes — [archived design] (`Classes.md`), revised v1.1 to two tiers

**v1.1 revision (user-directed):** two-tier structure, using the archived 2005–06 tier-era
class names (`homepage_2006.md` Tier 4 news):
- **Base class at level 5** via the "First Calling" tavern quest: **Warrior, Magician, or Thief**
  [archived trio]. 3 modest abilities each.
- **Advanced class at level 30** via "Trials of Ascension", branching 2 ways from the base:
  Warrior → **Gladiator** (offense) / **Crusader** (defense); Magician → **Wizard** (damage) /
  **Sage** (healing/support); Thief → **Rogue** (crits/dodge) / **Mercenary** (versatility)
  [all six names archived]. 4 stronger abilities each. Base class remains obtained and slottable.
- The hidden Legendary class (Runeblade of Kuraan) is unchanged, above both tiers.
- The v2.1-era rule that the first classes arrive at level 30 (`Classes.md`) is intentionally
  overridden here — marked **[revised]** rather than [archived].

Original v2.1 archived design below (still governs XP rates, Primary/Secondary, Academy
purchases, deactivation wipe):
- Unlock at **level 30**; first choice: **Warrior, Magician, or Rogue** (via quest).
- Later classes via multi-step quests, Relic creation, or specific monster kills; some **Legendary**
  (one per server — reinterpret single-player as "one per save, permanent choice").
- Primary + Secondary slots; class XP accrues on battle wins at main-XP rate, Secondary at half
  rate. Class levels buy class skills/abilities at the Academy. Deactivation wipes class progress
  (permanent).
- Actual class rosters beyond the first three, their abilities, and Relics: **[invented]** — mine
  the 2004 create-a-class thread (`forum/t-449.md`) for names/flavor (Gladiator, Crusader, Sage,
  Dragoon, Gambler, Shadowknight…).

## 4. Combat — [archived flow] (`New_Player_Guide.md`, `Fear.md`, `Energy.md`, `Recent_Updates.md`)

- 1v1, turn-based; player action → enemy counters. First strike decided by higher Dexterity.
- Player actions: weapon attack (requires equipped weapon), item use (combat-usable items),
  technique (from equipped sets), flee. Every action costs Energy.
- **Fear**: fighting above your level shows a yellow bar; stats −10% per level difference; affects
  spell damage but not healing.
- **Fury Meter**: kills at-or-above your level add ticks, +1% combat & skill XP each; resets on
  death, flee, or daily — single-player: reset on death/flee/inn rest **[adapted]**.
- Monsters: have levels, elements/resistances by Anima grade, can use techniques (v2.1 added 24
  monster techs), bosses are harder. XP/loot cutoff: enemy more than 5 levels below you yields
  nothing.
- Status effects: **Poison, Haunting, Curse** (v2.1 set; Blind/Silence were removed).
- Win yields: combat XP, skill XP, gold, Anima Shards, and a possible item drop claimed via an
  explicit **Loot** click.
- Damage formulas: **[invented]**, constrained by archived facts (Str ratio 2.5:1, Int decides
  spell hit, glancing blows exist, Keen-style defense ignore existed for monsters, non-elemental
  damage ignores defense — 2005 note, adopt).

## 5. Techniques (Techs) — [archived structure] (`Techniques.md`, `Techs.md`)

- Bought at the **Academy** with Training Points; organized in **chains** (learn predecessor first).
  The May-2007 news (`homepage_2007.md`) describes the final intended model: per-spell chains
  ("Fireball I → II → III"), gated by governing skill level, learned at a trainer — adopt this.
- Equipped via drag-and-drop into **3 sets × 8 slots**; clicking an icon in battle casts it.
- Uses: attack, healing, stat buffs; double-click any icon for info; "effective damage" display
  factors Intelligence.
- **Anima grades**: elemental system — Fire, Water, Wind, Earth + **Star** (lightning) + **Light**
  (healing) + **Dark** (`Recent_Updates.md` 2007-04-20). Monsters have per-grade resistances.
  Crystals/Spheres by grade exist as items (B-class at 20+); crystals restore 70% tech charge —
  simplify to an Energy/charge economy **[adapted]**: techs cost Energy, crystals restore it.
- Concrete tech list: **[invented]** (~5 chains per magic school + weapon techs).

## 6. Economy & towns — [archived] 

- **Gold**: 100 gold = 1 platinum, auto-converted (`Gold.md`). **Anima Shards**: buff/shrine
  currency, cap 999 (`Anima_Shards.md`).
- Town facilities (`New_Player_Guide.md` §5.1): **Shop** (buy/sell; per-town stock), **Synthesis
  Shop** (combine items + gold into better items, Eldor; recipes **[invented]**), **Inn** (paid full
  heal), **Vault** (store gold/items safely), **Tavern** (quests), **Academy** (techs, class
  skills), **Spirit Shrine** (20+ temporary buffs for Anima Shards; removes **Cursed** items for a
  value-based fee — `Cursed.md`, `Version_2.1_Changes.md`).
- Camping in hunting areas: partial HP restore, scaled by tent quality; tents sold in shops.
- Items: weight/encumbrance vs Strength-based capacity; skill affinity; level/stat requirements
  (red = unusable); slots incl. foot armor; tags (lore, no-trade); cursed items equip-lock.
  Item database: **[invented]** (only one item id, #3273, was ever archived — and it 404s).
- Alchemy/transmutation recipes existed (v2.1) — fold into Synthesis for v1.

## 7. Quests — [archived names, lost text]

Journal with active/completed tabs, cancellable, multi-reward (gold/items/TP/class unlocks).
Known quest names: The Standing Stones, the Oruk quest (level 5–10 band), Eldor: Dr. Ferrier,
Laik: Professor Flad, tavern quests. All quest content: **[invented]**, anchored in the archived
lore (Estari ruins, Anima excavation taboo, Majiku raids, Skyspire mythology).

## 8. Presentation — [archived]

- Authentic 2008 theme extracted to `reference/site/theme_inline.css`: near-black `#1b2127`
  background, panel `#3d5056`, headers `#34404b`, gold text `#c4bb4b`, light panels `#bec7cc`,
  10px Verdana, table-panel layout, battlefield `#0B0F15`.
- Layout: left nav (Status / Inventory / Techs / Explore / Town / Journal + Actions panel), main
  content panel, status bars top-left (HP red, Energy green, XP purple, Fear yellow, weight icon).
- Drag-and-drop inventory (Auto-Equip / Unequip / Discard drop boxes), double-click item/tech info
  windows — all described in `New_Player_Guide.md`.
- No copyrighted icons (the original used ripped Blizzard/Square-Enix GIFs — replace with CSS/
  unicode/simple pixel art **[invented]**).

## 9. Cut from v1 (was multiplayer or never shipped)

Mail, trading, auction house, player top list, chat, PvP, factions, premium membership, sailing,
Eidolons/v3.0 systems, arcade. Pets (`heropet.php` existed) — deferred, no design info survived.

## 10. Open design decisions (resolved)

1. **XP curve**: quadratic-ish (`xpToLevel(n) = 50·n^1.8` ballpark), tune so level 30 ≈ 3–4 h.
2. **Save**: localStorage, versioned JSON, export/import string for backup.
3. **Content volume v1**: levels 1–40 playable; 2 towns (Eldor, Ju`Mak) + 5 hunting areas; ~60
   items; ~35 monsters + 4 bosses; ~30 techs; ~12 quests; 3 classes.
4. **Balance oracle**: encode every archived number as a named constant in one `balance.js` file
   with a comment citing its reference file, so archived vs invented stays auditable in code.
