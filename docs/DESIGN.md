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
  **Saratus** (Arkan capital), **Ju`Mak Village**, **Laik, Riverside Village** (implemented as the
  4th town in v1.2), **Gares Riverbanks** (archived as "the level 20 area", `Recent_Updates.md`).
  All other hunting areas **[invented]** (the 2004-era names — Lochhollow Forest, Lost Dungeon,
  Springwyn Island, Mt. Tenyra — may be reused as homage).
- **[revised] level compression:** the remake condenses the arc to ~1–40, so Gares Riverbanks is
  placed at minLevel 9 rather than its archived level-20 band (see `js/data/areas.js`). The archived
  level bands are the reference; their remake placements are a `[revised]` pacing decision. (The
  future 100-level arc, `docs/SPEC-FULL-LEVEL-ARC.md`, restores the fuller spread.)

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
- **v1.6 P1 — Endurance/Intelligence armor ratios trimmed to 0.9 [revised]** (`docs/SPEC-V1.6-REBALANCE.md`
  §6, CB-1/CB-5; playtest triage `docs/REVIEW-2026-07-16.md`): Armor and Magic Armor no longer take
  Endurance/Intelligence 1:1 — both are now `round(stat * 0.9)` (`ENDURANCE_ARMOR_RATIO` /
  `INT_MAGIC_ARMOR_RATIO`, `js/balance.js`). The real fix for "a mid-level character's Endurance
  alone exceeds a same-level monster's whole hit, flooring damage to 1" (CB-1) is the penetration
  floor below; this ratio is only a mild extra trim. It was RECONCILED from a provisional 0.5 during
  the P1 review re-sim: 0.5 crashed the shipped modest-fixture lair bosses (~85%→46%/31% win at
  L50/L100), breaking their `>=60%` contract, because shipped boss damage was tuned against the old
  1:1 armor — re-tuning shipped bosses to fit a new constant would violate the ratchet principle, so
  the constant was fit to the bosses instead. A larger defense nerf would need a separate boss-damage
  retune pass. Still a deliberate, user-directed re-tune of shipped constants (ratchet exception).
- **v1.6 P1 — carrying capacity gained a base term [invented]** (CB-6): `carryCapacity` is now
  `CARRY_CAPACITY_BASE + strength * CARRY_CAPACITY_PER_STR` (50 + STR·6), not a bare `STR·10` — the
  old formula gave a STR-5 caster only a 50-weight cap, punishing any non-Strength build for no
  archived reason.

### Creation — [archived] (`New_Player_Guide.md`)
Race (Human/Arkan) → distribute **5 skill points, max 3 per skill** → name + gender.

### Progression — [archived numbers]
- Level up grants **+2 Training Points** (buy techniques at Academy) and **+5 Stat Points**
  (`Level_Up.md`). Quests can grant extra TP (`Training_Points.md`).
- Areas and items gate on level (`Level.md`).
- **XP curve: [invented]** — nothing archived. Design target: level 30 (first class) reachable in a
  few hours of play.
- **v1.6 P2 re-pace [revised]** (`docs/SPEC-V1.6-REBALANCE.md` §6.2, PG-1/PG-3; playtest triage
  `docs/REVIEW-2026-07-16.md`): the shipped curve leveled far too fast (flat ~3.5-5 kills/level
  across the whole 1-100 range) and skill leveling was far too slow (flat 8 skill-XP/win, ~3,200
  wins to reach skill 50) — opposite problems from the same review. `XP_TO_LEVEL`'s exponent went
  1.8 → 2.0 (~2.3x more kills to L100, still no grind wall); skill-XP-per-use now scales with the
  **defeated monster's level** (`SKILL_XP_PER_MON_LEVEL`) instead of a flat rate, so a mained skill
  reaches useful levels by mid-game rather than never; the Fury XP bonus (previously uncapped) is
  capped at +25% (`FURY_XP_CAP`), mirroring the Frenzied champion affix's own +40% cap. All numbers
  LOCKED by the lead's P0 progression calc, a deliberate ratchet exception (CLAUDE.md cardinal rule
  4 / LEAD-PLAYBOOK §0.3) — the user directed a re-tune of shipped constants because the shipped
  pace was judged wrong in both directions.

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
- **v1.2 — skill *level* now has combat effect [invented numbers], honoring the archived rule that a
  skill is "the level at which your Character performs a certain action" (`Skills.md`):** weapon
  skill scales weapon Damage (capped); each armor skill scales its worn piece's armor (Shields for
  the offhand shield); Dodge and Double Attack gain XP on a successful dodge / proc (previously
  frozen); Thievery grants bonus win-gold + an item-steal chance and trains on wins; Dual Wield
  enables an offhand weapon (shares the shield slot) for a skill-scaled extra Attack swing. Caps
  live in `js/balance.js` (tuned down after a difficulty-contract sim). This closes the review gap
  where weapon/armor/Thievery/Dual-Wield/Dodge/Double-Attack skills were cosmetic.

### Classes — [archived design] (`Classes.md`), revised to three tiers (v1.1 → v1.2)

**Three-tier structure (user-directed), using the archived 2005–06 tier-era class names
(`homepage_2006.md` Tier 4 news):**
- **Base class at level 5** via the "The First Calling" tavern quest: **Warrior, Magician, or
  Thief** [archived trio]. 3 modest abilities each.
- **Advanced class at level 30** via "The Trials of Ascension", branching 2 ways from the base:
  Warrior → **Gladiator** (offense) / **Crusader** (defense); Magician → **Wizard** (damage) /
  **Sage** (healing/support); Thief → **Rogue** (crits/dodge) / **Mercenary** (versatility)
  [all six names archived]. 4 stronger abilities each. Base class remains obtained and slottable.
- **Tier-3 class at level 60** via "The Master's Calling" (shipped at level 38 in v1.2; re-gated
  to 60 by the level-arc's F4 phase). **[revised] v1.5 BRANCHING** (`docs/SPEC-TIER3-EXPANSION.md`,
  supersedes the v1.2 one-per-line convergence): each **Tier-2** class offers its own two Tier-3
  options — Gladiator → **Shadowknight** / **Berserker**; Crusader → **Paladin** / **Warden**;
  Wizard → **Magus** / **Conjurer**; Sage → **Cleric** / **Seer**; Rogue → **Gambit** /
  **Assassin**; Mercenary → **Ranger** / **Dragoon**. **12 Tier-3 classes**, 2 passives + 1
  signature classOnly tech each. All names **[archived]** (`homepage_2006.md`, `forum/t-449.md`
  create-a-class thread, `forum/t-787.md`; Conjurer from the archived Conjuration skill,
  `Skills.md`); effects/numbers **[invented]**, tuned inside the Tier-3 band (≤+25% per effect
  over the Tier-2 parent, below the Legendary tier; sim-locked, spec §6).
  - **The Conjurer is summon-based [invented, 1v1-safe]:** its Summon Elemental places an
    "Elemental Servitor" — a battle-transient DoT rider on the enemy, auto-attuned to the enemy's
    weakest Anima grade, ticking Int-scaled damage each round through the full mitigation
    pipeline. NOT a second combatant (the archived 1v1 rule, `forum/t-449.md` "no summons in
    battle", is preserved — the servitor has no HP, is never targeted, and never grants the
    monster an action). Its niche is energy-efficient attrition vs the Magus's burst.
  - Legacy note: saves holding an old-convergence combo (e.g. a Crusader with Shadowknight) keep
    it fully functional; only future offers follow the new branching.
  - **v1.6 P2 — class pacing steepened [revised]** (`docs/SPEC-V1.6-REBALANCE.md` §6.2, PG-2;
    `docs/REVIEW-2026-07-16.md`): the shipped class-XP curve capped out at ~class level 8-13, so a
    tier-3 class fully unlocked its abilities in ~2-3 kills and a tier-1 class in ~13 — "all
    abilities in a few combats" per the playtest. `classXpForLevel` steepened round(30·(n-1)^1.6)
    → round(120·(n-1)^1.9), AND the Primary/Secondary award itself is now further scaled down
    (`CLASS_XP_FRACTION_PRIMARY` 0.5 / `CLASS_XP_FRACTION_SECONDARY` 0.25, `js/core/classes.js
    addClassXp`) instead of the shipped full/half combat-XP rate. Net (P0 calc): tier-3 full-unlock
    ~2-3 → ~37 kills, tier-2 → ~86, tier-1 → ~192 — a class now grows across a meaningful slice of
    play. Legacy-safe: `classLevelsEarned`/`classLevelsSpent` are banked per-character and only
    ever increment forward from new class-XP grants, never recomputed retroactively from
    `classXp` against the curve — an existing save keeps every already-earned class level and
    ability untouched; only future leveling slows down. LOCKED by the P0 progression calc.
- **Three hidden Legendary classes (tier 4):** Runeblade of Kuraan (boss kill), Vaultbreaker
  (boss-combination quest), Heir of the Echo (relic route) — each obtained independently, one per
  save. **[invented]** beyond the archived "Legendary, one per server" concept.
- The v2.1-era rule that the first classes arrive at level 30 (`Classes.md`) is intentionally
  overridden (base tier at L5) — marked **[revised]** rather than [archived].

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
  - **Known limitation (v1.3 level arc):** because Fear spares healing (archived) and the extended
    arc hands out abundant healing techs + energy consumables, a fully-supplied high-level character
    can out-sustain a fight 5+ levels above them — so the archived "deep underdog = near-certain
    death" outcome isn't strictly enforced past ~L50. At-level and boss balance are unaffected
    (proven by the real-content re-sim). Fixing it fully needs a Fear/healing/energy pass (deferred,
    user-accepted); see `js/balance.js` F1 CONVENTION NOTES §3 and `docs/SPEC-FULL-LEVEL-ARC.md`.
    **v1.4 re-check:** the P0 sim confirmed the new low-cost energy provisions (§6) don't move
    this needle — true 5-down cells stayed at 0.0% win with and without provisions in the kit
    (`docs/SPEC-V1.4-GAMEPLAY.md` P0 RESULTS §4); the known limitation is unchanged, not worsened.
- **Fury Meter**: kills at-or-above your level add ticks, +1% combat & skill XP each; resets on
  death, flee, or daily — single-player: reset on death/flee/inn rest **[adapted]**.
  - **v1.4 — Limit Breaks, spent from the same streak [archived names, `forum/t-796.md`;
    invented mechanics]:** Rage, Dragon Kick, and Hurricane Blow were MP-gated specials in the
    2005 engine; the forum itself proposed bridging them onto a Fury-style resource
    (`forum/f-84.md`, "Warriors replace MP with Fury?"). At `c.fury >= 5` (`LB_FURY_MIN`) a
    Limit Break action unlocks in battle; using it **consumes the entire streak** — a real
    trade-off, since it forfeits the accumulated +1%/tick XP bonus on every future win of that
    streak, not a free action — for a class-line special at **×2.0 of the player's average
    basic hit** (`LB_DAMAGE_MULT`), once per battle, 0 Energy cost (the streak *is* the cost):
    Rage (warrior line — hit + self +3 Armor for 3 turns), Dragon Kick (rogue/gambit line — hit
    + −2 percentage points off the monster's Dodge for the rest of the fight), Hurricane Blow
    (mage line — non-elemental burst that ignores the monster's dodge roll entirely, i.e. it
    auto-connects). One rank each, granted automatically at the class tier that fits. The ×2.0
    multiplier and the fury-5 floor are **locked by the P0 sim**
    (`docs/SPEC-V1.4-GAMEPLAY.md` P0 RESULTS §3): ×2.5 pushed win rate on the hardest boss
    (Eidas Ascendant) to 85% — too strong for a repeatable button — while ×2.0 lifted that
    fight's baseline 66.3% win to ~77% without changing its HP cost, which is the intended
    "strong but not degenerate" shape.
- **v1.4 — Champion hunts, affixes, and boss scripts** [archived intent, `site/homepage_2006.md`
  Hero 6.5 plan: "strategic boss battles… scripted abilities, summons, status effects, item
  usage" + a "Champion Bosses" forum-thread title; specifics **[invented]** within that intent,
  P0-locked]: a champion hunt (`Game.Battle.start(id, {champion:true})`) already carried flat
  HP/damage multipliers (1.5× / 1.35×, unchanged); v1.4 adds ONE affix on top, rolled uniformly
  through the single `Game.Battle._rng` surface (never a second RNG): **Vampiric** (heals the
  monster for 25% of the damage it deals), **Frenzied** (damage escalates +5% per action taken
  this battle, **capped at +40%**), **Warded** (negates the first hostile technique the player
  casts each battle), **Venomous** (35% chance per successful *basic* attack — not techs — to
  poison an unpoisoned player), **Hoarder** (combat-neutral: drop chance ×3 instead of the
  champion's usual ×2). The battle log announces the affix at the start of the fight and again
  on each trigger, so the rule is always learnable in play. The engine's own 1v1 constraint
  (`forum/t-449.md`: "no summons in battle") rules summons out — the affix roster is the
  invented substitute within the archived intent. **Boss scripts:** all 11 bosses (the 3 pre-arc
  bosses plus the level-100 arc's 6 band bosses) carry a data-driven `script:` array (HP-fraction
  thresholds → a named effect, e.g. the Ruin Warden of the Estari fortifies its Armor at 50%
  HP), read by one interpreter in `battle.js` — never per-boss code branches. Script effects are
  kept modest (well under the boss's own damage stat) so they read as flavor, not a difficulty
  spike. **P0 sim as balance authority** (`docs/SPEC-V1.4-GAMEPLAY.md` P0 RESULTS §2, locked
  constants in `js/balance.js`'s v1.4 P3 block): the existing champion multipliers held 100% win
  at every checkpoint L10–100 unmodified; Vampiric/Venomous held 100% win everywhere; an
  *uncapped* +5%/action Frenzied broke the ≥85% at-level win floor at L90/100 (62–64% win over
  16-round fights) — the **+40% cap is load-bearing**, not decorative, and restored 93.7–100%.
  Warded is a one-action tax the pure-attack sim fixture can't exercise (no techs); it is
  spot-checked against a caster build in P3's own suite instead.
- **v1.5 — Reactive monster behavior (telegraphs & archetypes)** [archived intent,
  `homepage_2006.md` Hero 6.5 plan: "Revamped Monster AI… **Intelligent reactions based on hero
  actions**"; mechanics **[invented]**, sim-locked — `docs/SPEC-V1.5-MONSTER-AI.md`]: standard
  monsters carry a data-driven `behavior` field read by ONE interpreter in `monsterAct` (never
  per-monster branches). **`simple`** (absent — the default, today's AI); **`telegraph`** — winds
  up one turn ("rears back, gathering force!") then releases a **charged hit at ×2.0** through
  the normal damage pipeline; **`caster`** — telegraph-capable with a raised (0.75) tech
  inclination; **`enrage`** — wind-up chance ×1.5 below 30% of its max HP; **`guardian`** — never
  telegraphs, instead may spend its turn raising a guard that halves the player's whole next
  action (the mirror of Defend); **`reactive`** — holds a pending charge if the player Defends
  into it (once — then it releases regardless), punishing pre-Defending and rewarding a timed
  read. **The player's two answers:** Defend halves a charged hit; **Interrupt** — any player
  action dealing ≥15% of the monster's max HP (or any Limit Break, even a dodged one) shatters
  the charge outright — the risk being that a failed burst eats the full hit. All state is
  battle-transient (`battle.charge` / `battle.monsterGuard`); one RNG surface; no save change.
  **Complexity is graded along the journey:** starting areas (≤L10) stay 100% `simple`
  (test-enforced); mid-bands seed a minority of telegraphs/casters; **66.7% of L40+ standard
  monsters run a non-simple behavior** (≥60% target, test-enforced). Constants locked by the
  P0/P2/P3 sim gates (spec §6): charge chance 0.15 (avg-DPS budget ≤+20%, binding cell L100 at
  87.8–98% for a never-reacting player), `ENRAGE_CHARGE_MULT` retuned 2.0→1.5 when the L99
  enrage cell hit 80% (ratchet), guardian 0.30/0.50 (effHP ×1.18 — bounded, no energy-stall).
  **Accepted limitation (user-approved, option 1):** boss-telegraph integration is DEFERRED — a
  boss's charged release can spike past the player's heal threshold and death in one hit (7
  bosses fell to 5–30% win in the suite's floor tests), so only 3 lower-level bosses
  (Matriarch/telegraph, Leviathan/enrage, Custodian/telegraph — re-simmed 85–88% win,
  winnable-but-costly) carry a behavior; the other 8 keep their v1.4 G2 scripts unchanged. A
  boss-tuned telegraph pass (lower boss charge multiplier + heal-before-death guarantee, own sim
  gate) is future work.
- Monsters: have levels, elements/resistances by Anima grade, can use techniques (v2.1 added 24
  monster techs), bosses are harder. XP/loot cutoff: enemy more than 5 levels below you yields
  nothing.
  - **[revised] v1.3.1 quest-material exemption** (user-approved; `js/core/battle.js` onWin cutoff
    branch): items whose id starts with `quest_` still roll on the drop table even when the
    cutoff applies; XP, gold, shards, and any non-`quest_` loot remain fully cut, unchanged. The
    unqualified cutoff otherwise permanently dead-ends every collect quest whose material source
    sits 5+ levels below the quest's own accept level (verified uncompletable: `trials_of_eldor`,
    `vaultbreakers_reckoning`, and 5 lesser collect quests) — a kill that can never drop its own
    required material makes the quest uncompletable forever, which the archived 5-level rule was
    never meant to do.
- Status effects: **Poison, Haunting, Curse** (v2.1 set; Blind/Silence were removed) — **all three
  now implemented**: Poison (battle DoT) and Curse (battle-scoped −25% player damage, v1.2) as
  battle statuses; Haunting as a persistent affliction (halves magical/consumable healing until
  cleansed at the Spirit Shrine). Curse is applied by monster `curseChance`, cleansed by an
  Abjuration `clearsStatus` tech; effect numbers **[invented]**.
- Win yields: combat XP, skill XP, gold, Anima Shards, **Advantage Points (v1.4, see §6)**, and a
  possible item drop claimed via an explicit **Loot** click.
- Damage formulas: **[invented]**, constrained by archived facts (Str ratio 2.5:1, glancing blows
  exist, Keen-style defense ignore existed for monsters). Two of these are **implemented as of
  v1.2**: **Intelligence decides spell hit/miss** for offensive magic techs (`Recent_Updates.md`
  2007-04-21; heals/buffs always land, weapon techs roll monster dodge), and **non-elemental
  (grade:null) damage ignores defense** (2005 note — a grade:null tech's mitigation is 0; elemental
  techs still subtract Magic Armor). This resolves the prior code-vs-DESIGN contradiction.
- **v1.6 P1 — combat & stats rebalance** (`docs/SPEC-V1.6-REBALANCE.md` §6, CB-1..CB-6; playtest
  triage `docs/REVIEW-2026-07-16.md`), all numbers LOCKED by the lead's P0 sim gate:
  - **Penetration floor [invented], DEFENSIVE-ONLY (CB-1):** a monster's hit on the player always
    deals at least `round(raw * DAMAGE_PENETRATION_FLOOR)` (0.30) regardless of Armor/Magic Armor,
    applied before Defend halving — answers "light armor floors nearly every hit to 1." Deliberately
    one-directional: the player→monster damage sites (`attack`/`useTech`/`limitBreak`) are
    UNCHANGED — a symmetric floor let under-levelled players guarantee-chunk high-armor monsters
    and reopened the 5-levels-down contract in the P0 sim.
  - **Weapon/armor skill caps raised [revised]:** `WEAPON_SKILL_DAMAGE_CAP` 0.10→0.25 and
    `ARMOR_SKILL_ARMOR_CAP` 0.15→0.30 (§3 Skills) — the shipped caps left 90% of the archived skill
    range (`2·lvl+1`) buying zero benefit past skill ~8 (PG-3); the P0 gate re-verified the
    5-levels-down contract is not worsened by the raise. A user-directed exception to the ratchet
    principle (shipped constants re-tuned).
  - **Magic-school skill scales spell power [invented] (CB-2):** an offensive (damage/drain)
    tech's power now also multiplies by `1 + min(MAGIC_SKILL_DAMAGE_PER_LEVEL · skillLevel,
    MAGIC_SKILL_DAMAGE_CAP)` (0.015/level, capped +15%), keyed on the tech's own governing skill —
    parallel to the weapon-skill damage term, so magic-school investment finally does something
    past gating which tech ranks you can learn.
  - **Rods are a caster's weapon, not a plain club [invented] (CB-4):** while a Rod is the equipped
    weapon, offensive-tech power ×1.15 (`ROD_SPELL_MULT`) and offensive-tech Energy cost ×0.7
    (`ROD_TECH_ENERGY_DISCOUNT`) — heal/buff/summon techs are unaffected. Paired with halving every
    Rod's own `damage` field (`js/data/items.js`) so casting, not meleeing with the Rod, is the
    caster's best play (CB-3).
  - **Intelligence speeds magic-skill XP [archived]** (`reference/manual/Intelligence.md`:
    "Increases the Experience gained in … Rods, Evocation, Conjuration, Alteration, Absorption,
    Abjuration") — previously unimplemented. Skill-XP granted to a magic school or Rods is now
    ×`(1 + intelligence · INT_SKILL_XP_PER_POINT)` (0.01/point, floor 1); weapon and armor skill-XP
    are unaffected.

## 5. Techniques (Techs) — [archived structure] (`Techniques.md`, `Techs.md`)

- Bought at the **Academy** with Training Points; organized in **chains** (learn predecessor first).
  The May-2007 news (`homepage_2007.md`) describes the final intended model: per-spell chains
  ("Fireball I → II → III"), gated by governing skill level, learned at a trainer — adopt this.
- Equipped via drag-and-drop into **3 sets × 8 slots**; clicking an icon in battle casts it.
- Uses: attack, healing, stat buffs; double-click any icon for info; "effective damage" display
  factors Intelligence.
- **Anima grades**: elemental system — Fire, Water, Wind, Earth + **Star** (lightning) + **Light**
  (healing) + **Dark** (`Recent_Updates.md` 2007-04-20). Monsters have per-grade resistances.
- **Crystals & Spheres (implemented v1.2):** graded **B-class Crystals** (restore Energy) and
  **Spheres** (restore HP) across the 20–40 bands, plus premium **Light & Dark** variants, as
  append-only drops (`Recent_Updates.md` Apr–May 2007; names **[archived]**, values **[invented]**).
  The mid-grade Crystal is anchored at ~70% of max Energy ("All Crystals restore 70% charge",
  2007-04-06). Techs cost Energy; crystals restore it, spheres restore HP. Shard-cost enhancement
  techs (`shardCost`) spend Anima Shards on cast (`Anima_Shards.md`).
- Concrete tech list: **[invented]** (~5 chains per magic school + weapon techs).

## 6. Economy & towns — [archived] 

- **Gold**: 100 gold = 1 platinum, auto-converted (`Gold.md`). **Anima Shards**: buff/shrine
  currency, cap 999 (`Anima_Shards.md`).
- Town facilities (`New_Player_Guide.md` §5.1): **Shop** (buy/sell; per-town stock), **Synthesis
  Shop** (combine items + gold into better items, Eldor; recipes **[invented]**), **Inn** (paid full
  heal), **Vault** (store gold/items safely), **Tavern** (quests), **Academy** (techs, class
  skills), **Spirit Shrine** (temporary buffs for Anima Shards — expanded to ~20 in v1.2 toward the
  archived "over 20", `Version_2.1_Changes.md`; removes **Cursed** items for a value-based fee and
  cleanses **Haunting** — `Cursed.md`).
- Camping in hunting areas: partial HP restore, scaled by tent quality; tents sold in shops.
  - **v1.6 — Economy re-tune (P3, `SPEC-V1.6-REBALANCE.md` §3/§6, playtest triage
    `REVIEW-2026-07-16.md` EI-1..EI-7).** Gold flowed too fast and bought too much too soon; the
    tent ladder maxed out at level 10; a synthesized mid-arc robe outclassed two full gear tiers;
    boss materials leaked into forage tables; Anima Shards were a rare early-game trickle; quest
    junk never stopped cluttering the backpack. All **[revised]/[invented]** (deliberate re-tune
    of shipped constants, CLAUDE.md cardinal rule 4 / ratchet exception, user-directed):
    - **Camp/tent ladder [invented]/[revised]**: extended from 3 tents (capping at 0.75 quality by
      level 10) to a full 6-rung ladder spanning the whole level range — levelReq/tentQuality/value
      1/0.20/10, 10/0.35/120, 25/0.45/500, 45/0.55/1500, 65/0.65/4000, 85/0.75/9000 (LOCKED by the
      lead's P0 sim gate). Camp-heal code is unchanged; it already reads the best owned tent
      generically.
    - **Gold curbing [revised]**: `SHOP_SELL_RATE` 0.5→0.35; the L41+ regular-monster gold formula
      (`goldMin = 50+2·(level−41)`, `goldMax = 2·goldMin`) trimmed ×0.75 (boss premiums untouched,
      a separate hand-tuned formula); top-tier shop equipment (levelReq ≥45, non-unique) value
      ×1.5 — three independent levers so best-in-slot gear and the top tent are real, late-game
      gold sinks rather than a quick buy.
    - **Item-ladder monotonicity [revised]**: `ARMOR_STACK_DIVISOR` (`js/balance.js` F1 CONVENTION
      NOTES, `SPEC-FULL-LEVEL-ARC.md`) had halved only
      levelReq>35 arc armor, leaving several arc tiers reading numerically worse than the
      unchanged levelReq≤35 piece directly below them (a synthesized levelReq-30 robe beating
      levelReq-45/55 shop armor). Re-derived so armor/magicArmor is non-decreasing by levelReq
      within each armor class+slot (levelReq≤35 pieces themselves untouched); uniques and
      AA-Exchange items stay excluded from this ladder (a separate premium/convenience tier, per
      the existing AP no-arbitrage guardrail above). The offending synthesis recipe
      (`synth_kastengard_wardweave`) also gained a gate-boss material requirement, bringing it in
      line with its levelReq 30–35 sibling recipes (which all already required one).
    - **Boss-forage leak fix [revised]**: the three lair-boss-only materials
      (Matriarch's Horn/Leviathan Scale/Custodian Core Shard) are removed from their hunting
      areas' `forage:` tables — **standing rule**: materials that gate boss-tier gear/content are
      boss-drop-only, never also placed in a location forage table.
    - **Anima Shard supply floor [invented]**: the effective shard chance on a kill is floored at
      `SHARD_CHANCE_FLOOR` (0.10) rather than editing ~100 monster entries, so early monsters (as
      low as 0.02) still give a meaningful trickle from level 1; champions are unaffected (already
      an unconditional guarantee). Paired with an Alteration shard-tax rebalance
      (`tech_warcry_1` 5→0 shards, `tech_focus_1` 8→5, `tech_warcry_2` 15→10 — Alteration was the
      only school taxed at all).
    - **Quest-material drop gating [invented]**: a `quest_`-prefixed material stops being rolled
      on a kill once nothing can still need it (`Game.Quests.materialStillUseful` — active/
      unaccepted quests, and any synthesis recipe still consuming it, both count as "still
      needed"). **Standing safety rule** (documented past-bug class — an earlier drop-table edit
      once made a Legendary-class material unobtainable): a quest material must never stop
      dropping while anything could still need it; when in doubt, keep it dropping. The existing
      5-level loot-cutoff exemption for quest materials is preserved, now also subject to this
      gate. Paired with a UI fix: the sell/discard confirmation prompt is skipped for a quest
      material that has become genuinely spent this way (still shown for one a quest is actively
      collecting, and for `unique` items).
  - **v1.4 — Foraging**, a second camp-style action **[archived concept, `forum/t-449.md`:
    "Luck determines what kind of items you can Forage for"; [revised] keying]**: the remake has
    no Luck stat, so availability instead follows each hunting area's own `forage:` item table
    (21 areas covered) rather than a stat roll. One forage attempt per visit, hunting areas only:
    70% base success (`FORAGE_SUCCESS`), with a further 30% chance of a second item on a
    successful roll (`FORAGE_SECOND_ITEM`) — both **[invented]**, no HP/Energy recovery (that
    stays camp's role). Foraging shares camp's existing ambush/robbery risk profile unchanged
    (`forum/t-756.md`, archived) via the same shared risk roll — foraging does not dodge it.
  - **v1.4 — Provisions [invented]**, user-requested: four cheap food/tonic Energy consumables
    (Trail Rations, Honeyed Mead, Kuraan Spice Tea — sold at early/mid taverns and shops, and
    foraged; plus the foraging-only Forager's Bundle, which also restores a little HP) fill a
    low-cost convenience niche beneath the existing Energy Shard / graded Crystal / Energy Stone
    line, not a new sustain tier: small flat Energy restores, heavier weight-per-Energy than a
    Crystal, and every sold provision's Energy-per-gold ratio is held **strictly below** the
    cheapest Crystal's and Energy Stone's (0.5 vs. the lowest archived/invented alternative's
    0.683–0.889) so provisions can never become the gold-efficient sustain optimum — see the
    Fear known-limitation re-check in §4.
- Items: weight/encumbrance vs Strength-based capacity; skill affinity; level/stat requirements
  (red = unusable); slots incl. foot armor; tags (lore, no-trade); cursed items equip-lock.
  Item database: **[invented]** (only one item id, #3273, was ever archived — and it 404s).
- Alchemy/transmutation recipes existed (v2.1) — fold into Synthesis for v1.
- **v1.4 — Advantage Points (AP) & the AA Exchange** **[archived]** (partial): a second currency
  earned from battle **victories** survives in the record — "you can now spend kills to get
  items" (`forum/t-827.md`) — redeemable against an "AA list" catalog spanning "all price ranges"
  (`site/homepage_2006.md` patch notes, "Added 20+ items to the AA list"). Exact earn rate and
  item list did not survive; both are **[invented]**, designed to the archived shape and locked
  by the P0 sim (`docs/SPEC-V1.4-GAMEPLAY.md` P0 RESULTS §5):
  - `character.ap` is earned **only on victory** — never from fleeing, quests, or sales, per the
    "spend kills" framing. `AP_PER_WIN(monsterLevel) = 1 + floor(level/20)` (1 AP at L1–19,
    rising to 6 at L100); champions ×2 (mirrors the existing champion reward multiplier exactly),
    bosses ×3 (mirrors the archived boss XP ×3 premium, §4) — reusing the game's existing
    reward-multiplier shape rather than inventing a third curve.
  - A new town facility type, **`exchange`** (same pattern as `shop`), opened in **Laik**
    (mid-arc) and **Frosthold Waystation** (late-arc) — the archived placement is unknown; the
    two-town split is **[invented]** to serve both mid-game and capped players.
  - The ~20-item catalog is mostly *existing* item ids at AP prices (including graded B-class
    Crystal/Sphere entries that are otherwise monster-drop/synthesis-only, giving AP a second
    route to them) plus six new AP-exclusive items with new icons — two of them, **Steel-Plated
    Boots** and **Gold-Plated Boots**, reuse an **[archived] item name** ("players bought 'steel
    plated boots' from the AA list", `forum/t-827.md`); the rest (Gilded Crest Helm, the
    level-100 prestige **Tourney Regalia**, Veteran's Edge, Royal Energy Stone, Royal Sphere) are
    **[invented]**. **Hard rule (no-arbitrage guardrail):** every AP item's stats sit at or below
    the best non-unique gear of the same level requirement (AP is convenience/prestige, not
    power creep — uniques remain monster-drop-only per §6's own item conventions) and every AP
    item's gold `value` is ≤50 (vendor-trash), so selling one back for gold can never out-earn
    the AP spent buying it.

## 7. Quests — [archived names, lost text]

Journal with active/completed tabs, cancellable, multi-reward (gold/items/TP/class unlocks).
Known quest names: The Standing Stones, the Oruk quest (level 5–10 band), Eldor: Dr. Ferrier,
Laik: Professor Flad, tavern quests. All quest content: **[invented]**, anchored in the archived
lore (Estari ruins, Anima excavation taboo, Majiku raids, Skyspire mythology).

- **v1.4 — pacing: active cap + quest chains.** The original documented no limit, but by the
  level-100 arc the Tavern was offering every not-yet-accepted quest in the area simultaneously
  with no prerequisite mechanism (only class/race/level gates) — with 40+ quests this flooded the
  Journal and dumped multi-part storylines (the Arkan line, Rennick's cipher line) on the player
  all at once. Fixed with two mechanisms, both **[revised]/[invented]** (user-directed, no
  archived cap or chain data survives):
  - **`BALANCE.MAX_ACTIVE_QUESTS = 3` [revised]** — accepting a new quest is refused once the
    Journal holds 3 `active` entries ("Your journal is full — finish or abandon a quest first."),
    surfaced in the Tavern as a greyed-out offer with that reason (the same `{eligible, reason}`
    record pattern already used for level-window gates). Backward compatible: a save already
    above the cap keeps its existing actives — the cap only blocks new accepts — and the
    already-archived `cancel()` is the relief valve. The cap can never soft-lock the story
    spine: main story-spine quests are always chain heads (never gated behind side content), so
    abandoning side quests always makes room.
  - **`requiresQuest` chains [invented]** — an optional quest field naming a prerequisite quest
    id. `availableAt()` hides a quest until its prerequisite reaches `status: 'completed'`, so
    chained content no longer clutters the offer list before its turn. `turnIn()` returns a
    `followUps` array — any quest whose `requiresQuest` just completed and whose giver is at the
    current area — which the Tavern UI surfaces immediately after the turn-in message ("Rennick
    has more work for you…") with an accept button; if the player is at the cap or
    under-leveled, the follow-up simply reappears later via `availableAt()` rather than being
    lost. 28 chain edges organize existing quests so each giver exposes at most 1–2 entry quests
    at a time (main-spine quests as chain heads; regional side quests chained behind their band's
    spine entry). A reachability check (extended quests suite) walks every chain from its head
    and asserts every quest id is eventually offered in a fresh playthrough, catching dangling
    `requiresQuest` typos that would otherwise strand content invisibly.
  - **No save impact** — both mechanisms read existing `c.quests` state; no new character field,
    no version bump.

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
- **v1.4 — Town screen master→detail [revised]**, user-directed: the Town screen previously
  stacked an accordion of every facility present in the town, duplicating the Actions panel's own
  quick-link list. It now shows either a plain facility directory (nothing selected) or only the
  selected facility's panel with a back row — reached from the directory or from an Actions
  quick-link. A facility selected in one town that isn't present in the next (e.g. the Shrine)
  resets to the directory rather than rendering empty.

## 9. Cut from v1 (was multiplayer or never shipped)

Mail, trading, auction house, player top list, chat, PvP, factions, premium membership, sailing,
Eidolons/v3.0 systems, arcade. Pets (`heropet.php` existed) — deferred, no design info survived.

## 10. Open design decisions (resolved)

1. **XP curve**: quadratic-ish (`xpToLevel(n) = 50·n^1.8` ballpark), tune so level 30 ≈ 3–4 h.
   - **v1.6 P2 [revised]** (`docs/SPEC-V1.6-REBALANCE.md` §6.2): exponent 1.8 → 2.0 (playtest:
     leveling was judged far too fast); see the §3 Progression subsection above for the full note
     (also covers the paired skill-XP and class-XP re-pace, PG-1..PG-3).
2. **Save**: localStorage, versioned JSON, export/import string for backup.
3. **Content volume v1**: levels 1–40 playable; 2 towns (Eldor, Ju`Mak) + 5 hunting areas; ~60
   items; ~35 monsters + 4 bosses; ~30 techs; ~12 quests; 3 classes.
   - **v1.2 actual (exceeds v1 targets):** 5 settlements (Eldor, Ju`Mak, Laik, Saratus, Kastengard
     Vanguard Camp outpost) + more hunting areas incl. a low-level Arkan start zone; ~120 items
     (graded Crystals/Spheres, 30+ economy); ~20 Spirit Shrine buffs; 25 quests (incl. the Arkan
     race line + tier-3 class capstone); **15 classes across 3 tiers + 3 Legendaries.**
   - **v1.3 actual — level-100 arc** (`docs/SPEC-FULL-LEVEL-ARC.md`, `SPEC-ARC-BANDS.md`): playable
     range extended to `BALANCE.LEVEL_CAP = 100`. +13 hunting areas + 2 settlements (Kuraan
     Reclamation Camp, Frosthold Waystation) across six northward regions (Kuraan → Majiku
     Highlands → Frozen Reaches/Ukai → Estari ruins → Skyspire → Red Moon); +~40 monsters incl. 6
     band bosses ending in Eidas Ascendant (L100); high-tier gear on a **tapered** damage/armor
     curve (F1 finding — literal 3+2·levelReq breaks at scale); extended tech chains (ranks to 9);
     Chapters III–IV + Epilogue. Tier-3 class unlock moved 38→60. XP curve unchanged (sim: ~12 h to
     100). See the §4 Fear known-limitation note.
   - **v1.4 actual — gameplay pass** (`docs/SPEC-V1.4-GAMEPLAY.md`): no new areas/monsters/
     classes; XP-stream-at-cap fix via **Advantage Points** (a second kills-only currency, §6)
     spent at a new **AA Exchange** facility (Laik + Frosthold Waystation, ~20-item catalog incl.
     6 new AP-exclusive items); **champion affixes** (5, one per champion fight) and **data-driven
     boss scripts** on all 11 bosses (§4); class-line **Limit Breaks** off the existing Fury
     streak (§4); **Foraging** as a second camp action across all 21 hunting areas plus 4
     **Provisions** items (§6); quest-journal **active cap of 3** + **28 `requiresQuest` chain
     edges** (§7); Town screen master→detail (§8). Save v9→v10 (AP only). Balance gated by a
     dedicated P0 simulation (below).
   - **v1.5 actual — reactive monsters + Tier-3 branching** (`docs/SPEC-V1.5-MONSTER-AI.md`,
     `docs/SPEC-TIER3-EXPANSION.md`): monster behavior archetypes with telegraphed charged hits +
     the Defend/Interrupt read, graded along the journey (§4); Tier-3 convergence → **branching**
     — 9 new archived-name classes (roster **15 → 24 across 3 tiers + 3 Legendaries**) incl. the
     summon-based **Conjurer** (§3); 9 new class techs. No save change (stays v10); every
     constant locked by the P0/P2/P3/P5 sim gates recorded in the two specs.
4. **Balance oracle**: encode every archived number as a named constant in one `balance.js` file
   with a comment citing its reference file, so archived vs invented stays auditable in code.
   - **v1.4 P0 sim** (`docs/SPEC-V1.4-GAMEPLAY.md` P0 RESULTS, 2026-07-12, 300 trials/cell, real
     RNG, checkpoints L10/30/50/70/90/100): the methodology that gated the level-100 arc (F1) was
     reused to lock every new v1.4 constant before implementation — champion-affix numbers
     (Vampiric 25% leech, Frenzied +5%/action capped +40%, Venomous 35% on-hit, Hoarder ×3
     drops), the Limit Break multiplier (×2.0) and Fury floor (5), the AP earn curve
     (`1 + floor(level/20)`, champion ×2, boss ×3), and confirmation that cheap Provisions don't
     move the §4 Fear known-limitation needle. See each constant's citation comment in
     `js/balance.js`'s v1.4 P1–P4 blocks for the exact numbers this sim locked.
