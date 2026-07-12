# SPEC — Endgame Loop (the Colosseum: Ascension, Relics, Honor)

**Status:** Backlog, not started. Authored 2026-07-12. **Depends on v1.4 landing** (reuses AP and
the champion-affix machinery — see §9). Sequence after `SPEC-V1.4-GAMEPLAY.md`.
**Owner model:** lead (Fable) scopes/reviews; Sonnet subagents implement, each with a full up-front
brief (CLAUDE.md cardinal rule 4).
**Relationship to authority:** **[revised]** — adds a new post-cap progression layer. It does not
change any archived leveling mechanic; it adds a horizontal loop *above* level 100. Anchors are
[archived] names/concepts (Colosseum, Honor, Relics); the mechanics hung on them are [invented] in
the original's spirit. Update DESIGN.md (new §) and this file's status when it ships.

Sourcing (cardinal rule 2 sweep, 2026-07-12): the endgame's three pillars each have an archived
anchor — **Colosseum** (`forum/f-84.md` thread title "Colliseum"), **Honor** (`forum/f-87.md`:
"Honor", "how do i get honer?", "New players reach top?" — a prestige/ranking concept players
actively asked about), and **Relics** (`manual/Classes.md`: classes obtainable "by creating a
Relic" — an archived system the remake never implemented). Arena boss names available from the
archived 2005 boss roster (`homepage_2006.md`: Swamp Dragon, Beregard of the Trees, Coveter,
Validor).

---

## 1. The problem this solves

v1.3 shipped the full 1→100 arc; the `SPEC-V1.4-GAMEPLAY.md` spec states the structural gap
plainly: *"at `LEVEL_CAP=100` the XP reward stream goes dead (`character.js` clamps at cap), so a
finished character has nothing left to earn."* v1.4's **AP** keeps individual fights *rewarding* at
cap, but a currency is not a **loop**: once Eidas Ascendant (L100 final boss) falls, there is no
escalating challenge, no chase worth grinding for, and no reason to keep playing.

A *proper* endgame loop needs three things the game currently lacks:
1. **Repeatable, escalating challenge** — content that stays hard after the level ceiling is fixed.
2. **Horizontal progression** — power/prestige axes that advance *without* more character levels.
3. **Meaningful sinks** — chases worth the grind, bounded so they don't power-creep the base game.

This spec delivers all three as one cycle centered on a new **Colosseum**.

---

## 2. The core loop (one sentence, then the cycle)

> At level 100, fight escalating **Ascension**-tier gauntlets in the **Colosseum** to earn **Honor**
> and **Relic Shards**, spend them on **Relics** (build-defining artifacts) and **Honor ranks**,
> and use that power to clear the next Ascension tier.

The repeating cycle:

1. **Enter the Colosseum** (new facility, capital town) and pick an **Ascension tier** T (difficulty
   multiplier — the post-cap progression axis; see §3).
2. **Run the gauntlet** — a fixed sequence of scaled battles (champions → boss finale) with **no
   free town heal between fights** (limited in-run recovery only), so the run tests build + resource
   management, not attrition farming (§4).
3. **Clear it → earn** Honor + Relic Shards + AP, all scaled by T (§5, §6).
4. **Spend** — forge/upgrade **Relics** at the Relic Forge with Relic Shards; buy **Honor ranks /
   titles / convenience** with Honor; unlock the next Ascension tier (§6).
5. **Re-equip, raise T, repeat.** Your **highest tier cleared** is a persistent personal-best rank —
   the single-player answer to the archived "New players reach top?" ambition (§7).

Three currencies → three distinct sinks (Honor→prestige/tiers, Relic Shards→Relics, AP→v1.4
catalog), one escalating difficulty axis (Ascension) that yields *infinite challenge from finite
authored content*. That is the loop.

---

## 3. Ascension — the post-cap difficulty axis [invented]

Because `LEVEL_CAP=100` is fixed (level-arc spec D1), challenge scales by **multiplying monster
power**, not by adding levels — the standard "paragon/greater-rift" pattern, and the only one
compatible with a hard cap.

- **Ascension tier T** (integer, starts at 1; unbounded in principle, gated by clears). Colosseum
  monsters use their normal level-band stats scaled by an Ascension multiplier:
  `power(T) = base × (1 + ASCENSION_STEP × (T − 1))`, applied to monster HP and damage (armor
  scales gently or not at all — the "over-armoring stalls melee" bug, CLAUDE.md, must not recur).
  `ASCENSION_STEP` comes from the sim (§8); ballpark ~0.15–0.25 per tier.
- **Reward scales with T** so higher tiers are worth the risk (§5). A soft "recommended tier"
  hint is shown from the character's gear/relic power so players self-select difficulty.
- **Tier unlock:** clearing tier T unlocks T+1. No skipping — the ladder *is* the progression.
- **This replaces "more levels" entirely.** Post-100 player power comes from **Relics + gear
  optimization + skill/tech mastery**, never from new levels. Ascension is the treadmill; Relics
  are how you keep up with it.

---

## 4. The gauntlet (the Colosseum battle flow) [invented]

Reuses the existing battle engine; adds a thin gauntlet controller.

- A run = **5 battles**: 3 champion-tier monsters + 1 mini-boss + 1 boss finale (counts tunable).
  Monsters drawn from the arc's roster, scaled by Ascension T (§3). Boss finale uses an arc/archived
  boss (Swamp Dragon / Beregard / Coveter / Validor available as arena-only champions if new
  variety is wanted — no new monsters *required*).
- **Between fights:** no town heal, no camp. Recovery is limited to a small fixed between-round
  restore and whatever consumables the player brought — so the run rewards a *built, provisioned*
  character (ties into v1.4 G4b provisions and the energy economy) and respects the difficulty
  contract as a *run-length* test, not a single-fight test.
- **Death/flee ends the run**; partial credit for rounds cleared (some Honor, no Relic Shards, no
  tier unlock) so a failed push isn't pure loss but a clear isn't cheap.
- **Arena Trials (rotating modifiers)** — each run rolls 0–2 run-wide modifiers via the single RNG
  surface (`Game.Battle._rng` — NEVER a second `_rng`), reusing the v1.4 **G2 champion-affix
  machinery** applied arena-wide: e.g. *all monsters Frenzied*, *healing halved*, *first tech
  negated*, plus reward modifiers (*+50% Honor this run*). This is the anti-staleness lever — variety
  without new content. (Optional D4: a date-seeded "featured Trial" for a daily bonus — flagged for
  the determinism cost it adds to tests; default OFF.)
- New pure state machine **`Game.Arena`** (`js/core/arena.js`, no DOM) owns run state; battle.js
  gains an `options.arena` flag (same pattern as the existing `{champion}` / `{ambush}` options).
  Arena run state is **transient** where possible (like `Game.state.battle`) — only the *results*
  (currencies, highest tier) persist.

---

## 5. Rewards [invented, sim-locked]

Per cleared run, scaled by Ascension tier T:
- **Honor** — the prestige currency. `HONOR_PER_CLEAR(T)` (balance.js). Also the gate currency for
  higher-tier *cosmetic/convenience* unlocks (never power).
- **Relic Shards** — the crafting currency for Relics (§6). Rarer than Honor; the primary chase.
- **AP** (v1.4) — arena wins grant AP on the existing curve, so the arena feeds the v1.4 catalog too.
- **A rare Relic-drop chance** on boss-finale clears at high T (the "jackpot" that makes pushing
  tiers exciting), APPEND-only in the drop table (content convention).
- **Bounty board [invented, MMO daily-quest inspiration]:** a small set of rotating objectives
  ("clear a T≥5 run with the Frenzied Trial", "clear without a limit break", "forage 3 Kuraan
  herbs") that pay bonus Honor/Shards on completion and reroll on completion (not on a real clock —
  see D4). This is the single-player variant of MMO dailies/bounties: it gives each session a
  concrete goal and nudges players to engage the different systems (Trials, foraging, tiers) rather
  than grinding one optimal run. Reroll-on-completion keeps it clock-free and testable.

All numbers come from the §8 sim, aiming: cheapest Honor reward ≈ a few runs, a full Relic ≈ a
sustained grind (dozens of runs), so the loop has a long, legible tail.

---

## 6. Relics — the horizontal power chase [invented, archived anchor]

Archived anchor: `manual/Classes.md` — classes could be obtained "by creating a **Relic**." The
remake never built Relic creation; the endgame is where it belongs, reinterpreted as **build-defining
endgame artifacts** rather than class-unlocks.

- **Relic slots:** the character gains 1–2 **Relic slots** (separate from equipment/tech slots).
- **Relic effects** ride the existing **guarded-hook bonus pattern** — add
  `Game.Relics.relicBonus(c, effect)` mirroring `Game.Classes.classBonus` / `Game.World.shrineBonus`
  (same effect vocabulary: `damage_pct`, `armor_flat`, `magic_armor_flat`, `dodge_flat`,
  `energy_max_flat`, `hp_max_flat`, `gold_pct`, `double_attack_flat`, plus any new endgame effect
  added generically). No new battle-math branches — relics sum into the existing hooks.
- **Forging:** the **Relic Forge** (a Colosseum sub-facility) turns Relic Shards + a rare boss drop
  into a Relic; **upgrading** a Relic costs more Shards for higher tiers. This is the Relic Shard
  sink and the loot chase.
- **Build-defining, not power-creeping:** Relic power is balanced so a relic'd character can clear
  *higher Ascension tiers*, not trivialize the *base 1–100 game*. Because Ascension scales monster
  power in lockstep, Relics keep you on the treadmill rather than flattening it. **Hard rule** (like
  AP items, v1.4): Relics are endgame-only, never resellable for gold above trash price, never
  outclass same-slot base gear *outside* their Ascension context.
- Distinct Relics offer *different* build directions (e.g. crit/dodge relic vs. sustain relic vs.
  burst-tech relic) so the chase has variety and interacts with the class the player built.
- **Relic sets [invented, MMO tier-set inspiration]:** some Relics belong to a named set; equipping
  2 of a set grants a small bonus effect (via the same `relicBonus` hook — a set bonus is just an
  additional guarded effect gated on set-count). Sets give the chase a *collection* goal beyond raw
  power and reward committing to a build direction. Optional for E2 launch (D2).

---

## 7. Honor rank & the personal-best ladder [invented, archived anchor]

Archived anchor: `forum/f-87.md` — "Honor", "how do i get honer?", "New players reach top?" Honor
was a real prestige/ranking concept players chased.

- **Honor ranks / titles:** spend Honor on ascending prestige titles (cosmetic display + tiny
  convenience perks, never combat power) — the visible badge of endgame investment.
- **Highest Ascension tier cleared** is a persisted personal-best "rank" shown on the Status screen —
  the single-player realization of "reach top." (If the online track `SPEC-ONLINE-HOSTING.md` ever
  ships, this value is the natural **leaderboard** entry — noted as a bridge, out of scope here.)
- Honor is deliberately a *prestige* currency, not a power currency, so chasing rank never
  destabilizes the difficulty contract.
- **Codex / achievements [invented, MMO completionist inspiration]:** a completion tracker (bestiary
  entries filled, Ascension milestones, Relic sets collected, boss-script "no-death" clears) that
  pays out **Honor** for milestones. This is the second Honor faucet and the single-player answer to
  MMO achievement/collection systems — a low-combat progression axis for players who prefer chasing
  100%-completion over pushing tiers. Data-driven (a list of achievement defs with a predicate +
  Honor reward); persisted as a small set of earned-ids (§10).

---

## 8. Balance & the sim gate (do this FIRST, before content)

Same gating role F1 played for the arc and P0 for v1.4: an endgame that isn't sim-proven will either
be trivial (loop dies) or impossible (loop never starts).

- **Scratchpad sim in `node vm`** loading real game code; measure win %, rounds, HP-left,
  damage-per-energy for a *fully-built L100 character* (best gear + tech + class + provisions, with
  and without Relics) across Ascension tiers T=1…N, for both the gauntlet as a whole and its
  hardest single fight.
- **Lock the curves:** `ASCENSION_STEP`, `HONOR_PER_CLEAR(T)`, `RELIC_SHARDS_PER_CLEAR(T)`, relic
  effect magnitudes. Target: a freshly-capped, no-Relic character clears ~T1–T3; each Relic tier
  buys a few more tiers; the ladder never hard-walls (always *some* achievable next tier) but always
  eventually out-scales a given build (the treadmill must move).
- **Difficulty contract, endgame form:** a well-built + provisioned character wins their
  *recommended* tier reliably but pays; pushing +2–3 tiers above recommended = high risk. Bosses
  inside the gauntlet stay winnable-but-costly.
- **Respect the accepted known limitation:** the 5-down Fear/healing sustain issue (DESIGN §4) —
  the arena's "no free heal between fights" + finite provisions is the design lever that keeps
  sustain from trivializing high tiers; the sim must confirm provisions can't turn a high-T run into
  unlimited attrition (per the v1.4 G4b guardrail).
- Every resulting constant lands in `js/balance.js` with a citation comment ([invented]/[archived
  anchor]) per cardinal rule 1.

---

## 9. Dependencies & reuse (why this comes after v1.4)

- **Reuses v1.4 G1 AP** — arena grants AP; no new work, but AP (`character.ap`, save v10) must exist.
- **Reuses v1.4 G2 champion affixes** — Arena Trials modifiers are the same affix system applied
  run-wide. Building the endgame before G2 would mean building affixes twice. **Hard sequencing:
  v1.4 first.**
- **Reuses v1.4 G3 limit breaks & G4b provisions** — both are load-bearing for gauntlet pacing
  (limit breaks as a burst tool; provisions as the finite between-fight sustain).
- **Reuses v1.3 arc bosses/monsters** — the arena scales existing content; no new monsters required
  (new arena-only champion variants optional).

---

## 10. Save impact

New persisted character fields ⇒ **one version bump** (v10 after v1.4 → **v11**; adjust if v1.4's
final version differs):
- `honor` (int, 0), `relicShards` (int, 0), `relics` (owned + equipped-slot structure),
  `ascensionHigh` (int, 0 = personal best), `honorRank`/titles.
- `achievements` (array of earned achievement ids, `[]`) and `bounties` (current rotating-bounty
  state) for the Codex and Bounty board — small, list-shaped, default empty.
- `character.js create()` adds them; `save.js migrate()` gains the v10→v11 step (default all to
  0/empty/`[]`); the migration test extends the **full v1→v11 chain** (cardinal rule / save
  discipline).
- **Arena run state is transient** (mirrors `Game.state.battle`) — never persisted; a run in progress
  is abandoned on reload, by design. (Bounty *definitions* are transient/derived; only which are
  active + their progress persist.)

---

## 11. Phasing (green, committable sub-phases; branch off `main` after v1.4 merges)

- **E0 — Sim harness (lead, gating).** Build the §8 sim; produce provisional constants. No shipping
  code. Gates everything.
- **E1 — Colosseum + Ascension + gauntlet skeleton.** `Game.Arena` state machine; `options.arena`
  in battle.js; Colosseum facility; tier select; gauntlet flow with limited recovery; **Honor**
  currency + `ascensionHigh` personal best (save v11 + migration + chain test). Stubbed-RNG tests
  for gauntlet sequencing and tier scaling. *Delivers a playable loop skeleton* (fight → Honor →
  tier up).
- **E2 — Relics.** `Game.Relics` + `relicBonus` guarded hook; Relic slots; Relic Forge; Relic Shards
  drop/spend; 8–12 launch Relics [invented] with distinct build directions. Icons pulled by lead
  (DCSS pipeline; subagents have no network — v1.3/v1.4 icon notes). *Delivers the chase.*
- **E3 — Arena Trials + Honor prestige + completionist axis.** Rotating run modifiers (reuse G2
  affixes via the single RNG surface); Honor ranks/titles + Honor sink catalog (cosmetic/convenience
  only); the **Codex/achievements** tracker and **Bounty board** (both data-driven, Honor/Shard
  faucets — §5, §7). Stubbed-RNG tests for Trial rolls, bounty reroll-on-completion, and achievement
  predicates. *Delivers variety, prestige, and a low-combat completion axis.*
- **E4 — Balance re-sim + docs.** Re-run §8 with real content; finalize constants; DESIGN.md new
  section (tags + citations); README; CLAUDE.md "recently completed"; this spec marked shipped;
  changelog entry prepended.

All ten suites green before each commit; stale constants (item/monster/facility counts, save
version) updated, behavioral assertions never weakened; new item/relic ids each get
`assets/icons/<id>.png` (presence enforced by `test_icons.js`); drop tables APPEND-only.

---

## 12. Risks & guardrails

- **Power-creep into the base game** is the #1 risk. Relics/AP/Honor must never trivialize 1–100.
  Mitigation: Relics are endgame-only and Ascension scales in lockstep; the sim explicitly checks a
  relic'd character against *base-game* content, not just arena content.
- **Grind fatigue.** Reward tail must be long but legible (§5 targets) and Trials must supply real
  variety, or the loop feels like a treadmill (because it is one — the modifiers are what make it
  fun). If E3 Trials feel thin, that's a launch-blocker, not a nice-to-have.
- **Difficulty contract at extreme T.** The ladder must always offer an achievable next tier for a
  given build yet eventually out-scale it. Sim-gated; if a tier hard-walls all builds, lower
  `ASCENSION_STEP` rather than buffing Relics into base-game creep.
- **Determinism / testing.** All arena randomness routes through `Game.Battle._rng`; the optional
  date-seeded featured Trial (D4) is OFF by default precisely because real-`Date` seeding is hard to
  test deterministically.
- **Scope creep.** Keep Trials data-driven (reuse the G2 affix interpreter — no per-modifier code
  branches) and the arena a thin controller over the existing battle engine (no combat-rule fork).
- **Sequencing.** Do not start before v1.4 lands (§9) — half the machinery is v1.4's.

## 13. Open decisions (resolve at E0 kickoff)

- **D1 — Post-cap axis.** Confirm **horizontal (Ascension + Relics + Honor)** vs. an alternative
  "infinite leveling / paragon points" model. Recommend horizontal: it fits the fixed cap, reuses
  content, and matches the archived Colosseum/Honor/Relic anchors. (An infinite-XP paragon system
  would re-open the balance-to-∞ problem the cap was chosen to avoid.)
- **D2 — Relic slot count** (1 vs 2) and whether Relics are class-line-restricted (like tier-3
  classes) or universal. Recommend 2 universal slots with class-synergy effects.
- **D3 — Entry gate.** Level 100 only, or a scaled "practice" entry from ~L90? Recommend L100 (it's
  the *endgame* loop); mid-game already enriched by v1.4 AP/champions.
- **D4 — Featured daily Trial** (date-seeded bonus run). Recommend deferring (determinism cost);
  ship rotating Trials without a real-clock dependency first.

## 14. Out of scope

- **New levels past 100** — that's the level-arc axis (`SPEC-FULL-LEVEL-ARC.md`), already shipped and
  deliberately capped; the endgame is horizontal by design.
- **Online leaderboards / PvP arena** — `ascensionHigh` is leaderboard-*ready* but the social layer
  belongs to `SPEC-ONLINE-HOSTING.md`; PvP stays cut (DESIGN §9). Archived "PvP system? any plans?"
  (`forum/f-87.md`) was answered "no" by the original dev too.
- **Relic-as-class-unlock** — the archived Relic system unlocked *classes*; we reinterpret Relics as
  artifacts. Reviving Relic→class-unlock is a separate future idea, not this loop.

---

## 15. Appendix — MMO-pattern inspirations, single-player variants

The loop is deliberately built from proven MMO endgame patterns, each stripped of its multiplayer
dependency so it works fully offline (no server, no other players, no real-time clock required — all
per the cardinal architecture rules). Every mechanic above maps to a genre staple:

| MMO pattern | What makes it work there | Single-player variant here | Where |
|---|---|---|---|
| **Mythic+ / Greater Rifts** (scaling keyed dungeons with weekly affixes) | infinite difficulty from finite dungeons; affixes force build flex | **Ascension tiers + Arena Trials** — monster power multiplier + rolled run-wide modifiers | §3, §4 |
| **Raids** (scripted multi-phase bosses) | mechanics-check, not stat-check | **Gauntlet boss finale + G2 boss scripts** (HP-threshold behaviors), solo 1v1 | §4 |
| **Gear treadmill / item level** | vertical chase that keeps pace with content | **Relics + Relic Forge** — endgame artifacts that scale with Ascension, not the base game | §6 |
| **Tier sets / set bonuses** | committing to a set = a build identity | **Relic sets** (2-piece bonus via the `relicBonus` hook) | §6 |
| **Reputation / prestige ranks** | long horizontal grind, cosmetic status | **Honor ranks & titles** (prestige, never power) | §7 |
| **Achievements / collections / bestiary** | completionist axis for non-pushers | **Codex** — completion tracker paying Honor | §7 |
| **Daily / weekly quests & bounties** | a reason to log in; directs play at varied content | **Bounty board** — rotating objectives, **reroll-on-completion (no real clock)** | §5 |
| **Leaderboards / server-first races** | social status for top clears | **Personal-best `ascensionHigh` rank**; true leaderboard only if the online track ships | §7, §14 |
| **Catch-up mechanics** | returning/new-cap players aren't infinitely behind | low Ascension tiers stay quick + rewarding; Relic Shard floor per clear | §3, §5 |

**Deliberately NOT borrowed** (they need other players or a live service, and the game is offline
single-player): raid *groups*, guilds, world bosses as shared events, auction-house economies,
trading, PvP arenas/ladders, FOMO-timed limited events, gacha/monetized loot. The online track
(`SPEC-ONLINE-HOSTING.md`) is the *only* place any social variant (a real leaderboard) could return;
it stays out of this spec.

**Design guardrail carried from MMOs:** the two failure modes this spec most guards against are the
genre's own worst habits — a **treadmill with no variety** (mitigated by Trials + Bounties + the
Codex offering three different reasons to play) and **power-creep that invalidates old content**
(mitigated by lockstep Ascension scaling + the endgame-only Relic rule, §6/§12). Borrow the loops,
not the grind fatigue.
