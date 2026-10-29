# SPEC — Boss sims with the full player kit (Academy chains, shrine buffs, Limit Break, Defend) and whole-fight tool choice

**Status:** IMPLEMENTED on branch `v1.11-hero-tree` (fixture + Test 107); not yet merged to `main`.
D0–D7 resolved by the user 2026-10-28 (§5; D1 and D2 differ from the first draft's
recommendations). **Sim gate run 2026-10-28 (§7): B1 and B3 pass in all 132 boss × lineage cells;
B2 fails in 39** — the boss contract does not hold for heroes who use their Academy chains. Authored 2026-10-28 on
branch `v1.11-hero-tree` (user-directed: "start on spec for point 1", the first item of the balance
follow-up priority list). Test tooling and a sim gate only: **no game code, combat constant or
contract changes.** Report only (the ratchet principle): failing cells go to follow-up specs.

**Relationship to authority:** measures the boss contract in `docs/SPEC-BOSS-COST-BAND.md` §2 (as
amended by `docs/SPEC-BOSS-COST-RETUNE.md` D0/D6) on the prepared fixture of
`docs/SPEC-BOSS-SIM-TECHS.md` §2. It extends that fixture; it does not change the contract.
Closes or decides:

| Follow-up | Source | Here |
|---|---|---|
| F4: limit breaks, Defend, shrine buffs not modelled | `docs/SPEC-BOSS-SIM-TECHS.md` §5 | §2.1 |
| F4: boss grid with Academy chains | `docs/SPEC-MELEE-CLASS-TECHS.md` §6 | §2.1 |
| P1: `techs` policy ranks damage techs by opening hit, casts any buff not running | `docs/SPEC-COMPANION-BOSS-COST.md` §6 | §2.2–2.3 |
| P2: companion HP lost isn't a boss cost | `docs/SPEC-COMPANION-BOSS-COST.md` §6 | D5 |
| v1.9 review item 3: the +4 companion cliff, not re-measured since the companion retunes | `CLAUDE.md` v1.9 section | §2.5 |

**Interpretation of the request (D0, confirmed by the user):** "accurate" means the grid models
**what a prepared player brings to a boss and plays sensibly**: every Academy rank their trained
skills allow, the shrine buffs they can afford, Defend against a telegraphed charge — and a policy
that only uses a tool when it makes the whole fight cheaper. It does **not** mean optimal play (a
search for the cheapest possible action sequence). Limit Breaks are reported, not judged (D2).

---

## 1. Problem

The boss grid (`docs/SPEC-BOSS-SIM-TECHS.md` §3, re-run in `docs/SPEC-MELEE-CLASS-TECHS.md` §7 and
`docs/SPEC-COMPANION-BOSS-COST.md` §3) reports **all 132 boss × lineage cells pass**. But its
prepared hero only knows class techs (plus every Firebolt rank, for casters). A real hero at L60
also has Cleave V (×2.9), Impale V, Vital Strike V, Starspark / Tidal Lance, armor-skill stances
and the shrine. The grid can't see any of it, so its "pass" is an upper bound on what bosses cost.

**Sizing probe (2026-10-28, scratch copy of `tests/boss_fixture.js`, 100 seeded trials per cell,
no Legendary, ceiling shrine package of 10 buffs, Fury 5).** HP spent per win % / win %:

| Cell | `techs` today | + Academy chains, today's policy | + Academy + shrine + Limit Break, today's policy | Same full kit, whole-fight tool choice (§2.3 prototype) | Techs kept |
|---|---|---|---|---|---|
| Paladin L60 | 68 / 100 | 110 / 100 | 83 / 100 | **34** / 100 | Cleave V |
| Paladin L100 | 75 / 100 | 170 / 100 | 128 / 100 | 52 / 100 | Cleave VII |
| Gambit L60 | 68 / 100 | 102 / 100 | 76 / 100 | **33** / 100 | Vital Strike V |
| Gambit L100 | 90 / 100 | 144 / 100 | 107 / 100 | 61 / 100 | none (shrine + LB only) |
| Dragoon L60 | 95 / 100 | 139 / 100 | 109 / 100 | 49 / 100 | Impale V |
| Dragoon L100 | 113 / 100 | 245 / 97 | 160 / 100 | 80 / 100 | Impale VII |
| Magus L60 | 63 / 100 | 350 / **24** | 362 / **44** | 61 / 100 | Tidal Lance V |
| Magus L100 | 98 / 100 | 358 / **38** | 360 / **59** | 88 / 100 | none (Firebolt only) |

Two findings drive this spec:
1. **Today's policy can't take more tools.** It casts every buff that isn't running and every
   damage tech that out-hits the basic action on the opening exchange, whatever it costs over the
   fight. Given the Academy kit, every build gets *worse*, and the Magus collapses to 24–59% wins.
   So the policy fix (P1) is a precondition for modelling the kit, not a side item.
2. **With a sane policy, the kit cuts boss cost a lot.** Paladin and Gambit at L60 land at 33–34%,
   just under the 35% band floor — **the live contract is probably already broken** for melee
   heroes who use their Academy weapon chain. The probe is small (100 trials, one option) and used
   assumptions the decisions then softened: all 10 shrine buffs and a Limit Break. The judged kit
   (D1 shard budget, no Limit Break) will cost more than the probe's last column; §3 is the real
   gate.

## 2. Design — the fixture (`tests/boss_fixture.js`)

### 2.1 The kit

`build(Game, level, opts)` gains `opts.kit` (default off, so every existing caller is unchanged):

| Tool | How the fixture models it | Tag / source | Decision |
|---|---|---|---|
| **Academy chains** | For each skill the archetype trains (`ARCHETYPES[*].skills`, + Conjuration with a pact), learn the **highest rank of every non-class chain** with `skillReq ≤` the skill's half level, and slot it. Firebolt keeps today's every-rank handling. Debuff chains (Sunder Guard, Crippling Thrust, Grave Wound, Curse) included. Every rank must be taught by an Academy at or below the hero's level: assert `Game.World.academyForTech` resolves to a town whose `minLevel ≤ level` (`BALANCE.ACADEMY_SKILLREQ_CAP`). | Chains [invented] (`js/data/techs.js`); 2 Training Points per level [archived: reference/manual/Level_Up.md] | D4 (Training Point budget), D7 (which skills) |
| **Shrine buffs** | `c.shrineBuffs` set to the package bought with the level's shard budget (§2.6), `battlesLeft` high enough to outlast the fight. Different buffs stack; the same buff doesn't (`Game.World.buyBuff`). The Eldor-only facility check is a UI gate, skipped like the Academy one today. | Shrine concept [archived: reference/manual/Anima_Shards.md]; buff list [invented] (`js/data/shrine.js`); budget [invented] (§2.6) | D1 |
| **Limit Break** | **Not in the judged kit** (D2). A sensitivity run only: `c.fury = BALANCE.LB_FURY_MIN` (5) before the fight, and the class line's Limit Break (Rage / Dragon Kick / Hurricane Blow) fires on the first turn (§3 report item 3). | Fury meter [archived: reference/manual/Recent_Updates.md, 2007-08-11]; Limit Break names [archived: reference/forum/t-796.md]; ×2.0 [invented, LOCKED `docs/SPEC-V1.4-GAMEPLAY.md` P0] | D2 |
| **Defend** | A tool: Defend when the boss has a telegraphed charge pending (`battle.charge`). Only the L18 (telegraph), L25 (enrage) and L32 (telegraph) bosses wind up; the 8 script-only bosses never do, so Defend is a no-op there. | Defend [invented, user-directed] (`BALANCE.DEFEND_*`) | D3 |

`classOptions` is unchanged: the kit sits on top of every lineage × Legendary × pact option.

### 2.2 The `kit` policy

A third policy next to `basic` and `techs`. `basic` and `techs` stay **exactly** as they are (the
in-repo regression cells and every earlier grid depend on them). Each turn, in order:
1. Crystal before the next action would empty the Energy pool (as today).
2. Below 40% HP: a kept heal tech that heals at least as much as the heal item, else the heal item.
3. Re-bind a fallen companion (Conjurer).
4. Limit Break — **only in the D2 sensitivity run**: if unused this battle.
5. Defend, if kept and `battle.charge` is pending.
6. A kept buff that isn't running.
7. A kept debuff that isn't on the boss.
8. The strongest kept damage tech (opening-hit probe order, as today), if affordable.
9. The basic action.

"Kept" is the per-cell result of §2.3. Steps 4–7 are the only new branches.

### 2.3 Whole-fight tool choice (closes P1)

Before a cell's trials, choose the tools once, by **backward elimination on whole fights**:
1. Start with every tool the build has: class techs, Academy techs, Defend.
2. Score the kit on 30 seeded whole fights (seeds 90000+, separate from the damage probe's 50000+
   and the trial seeds): win rate first, then mean HP spent per win.
3. Try removing each tool in a fixed order: buffs, debuffs, damage techs from the weakest probe
   value up, heal techs, Defend. Keep a removal if the score doesn't get worse
   (equal win rate and HP spent ≤ current counts as not worse, so ties favour the smaller kit).
4. One pass. The kept set feeds §2.2; `simulate` returns it as `kit` for the report.
5. **Amended 2026-10-29 (D6):** then also score *no tools* and *every tool on its own* on the same 30
   fights, and keep the best of those and the removal result (ties keep the smaller set). The
   one-pass removal can get stuck: at the L60 boss a Conjurer (Earth + Heir) kept Bulwark and four
   buffs at 165% HP spent, where Echoing Judgment alone spends 33%. Cost: about one more 30-fight
   score per tool per cell.
   **Re-run with the amended choice (2026-10-29, 1,404 cells, 300 trials, code at `2a52d8e`):** the same
   8 cells fail B2 and B1/B3 pass everywhere; 26 cells moved, most of them cheaper (largest: casters at
   the L10 boss 81 → 54% HP spent with Attunement I alone, weakest option 87 → 100% win), a few up by
   1–4 points (30-fight choices that do slightly worse over 300). None crossed a floor.

Why this shape: it asks the player's question, "does this tool make *this* fight cheaper?", and
needs no per-tool heuristics. The prototype (§1, techs only; it kept shrine and Limit Break fixed)
dropped 7 of 8 techs for the Paladin and 14–17 for the Magus, and every pruned kit was cheaper than
both `techs` and the naive kit. Cost: about (tools + 1) × 30
extra fights per cell, roughly 250–550 per cell, against 300 for the trials (D6).

Shrine buffs are not in the elimination: they are passive, cost no turn and can only help.

### 2.4 Metrics

Unchanged: win rate, HP spent per win, consumables, HP left, rounds, casts. New in the `simulate`
result:

| Field | Meaning |
|---|---|
| `kit` | Tool ids kept by §2.3 |
| `companionHpLost` | Mean companion HP lost per win / companion max HP (Conjurer only); D5 decides whether it enters the verdict |
| `tpSpent` / `tpBudget` | Training Points the kept Academy ranks cost (whole chain up to the kept rank) vs `2 × (level − 1)`; D4 |
| `shardBudget` / `shrine` | The level's shard budget and the buffs it bought (§2.6) |
| `defends` | Defends per win |

### 2.5 The +4 companion cliff cell (v1.9 review item 3)

The original measurement (`CLAUDE.md` v1.9 item 3) gave a companion to the shipped L40 warrior
fixture. Companions are now the Conjurer's alone (pacts open at T3, L60), and PR #5 retuned all four
(`docs/SPEC-WATER-PACT-COST.md`, `docs/SPEC-COMPANION-BOSS-COST.md`). Re-measure on the real owner:
- Conjurer at L60 and L80, each pact and no companion, `basic` and `kit` policies.
- Against a regular monster (non-boss, non-champion) at exactly level +4 and +5; if a level has
  none, the nearest level above it. The implementer lists the monster ids used.
- 300 seeded trials per cell. Report win rate and HP spent. The contract here is the
  5-levels-down rule ("certain death via Fear", `docs/DESIGN.md` §4): +5 must stay at ~0% for every
  pact. +4 has no contract number; report the jump from no companion to each pact.

### 2.6 The shard budget (D1)

A hero spends on shrine buffs what they earned **since the previous boss** (D1). The fixture computes
the budget from game data, so it follows any later change to XP or drop rates:

`shardBudget(level) = round( Σ_{l = prev .. level−1} kills(l) × chance(l) )` (to the nearest
shard; the table below was computed that way, floor gives 1 less at six levels), where
- `prev` is the previous boss's level (1 for the L10 boss);
- `kills(l) = (XP_TO_LEVEL(l+1) − XP_TO_LEVEL(l)) / mean xp` of the regular monsters (non-boss,
  non-champion) within ±2 levels of `l` — the at-level hunting it takes to level up;
- `chance(l)` = their mean `max(BALANCE.SHARD_CHANCE_FLOOR, shardChance)`, the shipped drop roll
  (`js/core/battle.js` onWin).

[invented] estimate. It ignores quest XP (fewer kills, so fewer shards) and champions (a guaranteed
shard each); the two pull in opposite directions. Values on today's data (2026-10-28):

| Boss | L10 | L18 | L25 | L32 | L40 | L50 | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Budget (shards) | 5 | 8 | 9 | 13 | 18 | 38 | 57 | 77 | 91 | 93 | 93 |

**Buying, a fixed priority list (D1):** go through the effects in this order — offense (`damage`;
casters `spellPower`), `armor`, `dodge`, `magicArmor`, `critChance`, `critDamage`, `accuracy`,
`armorPen`, `block` (only with a shield) — and for each, buy the strongest buff of that effect whose
`shardCost` fits what's left. One pass. Example: at L60 (57 shards) a warrior buys Berserker's Wrath
(+7 Damage, 50) and has 7 left, too few for any armor buff; at L10 (5 shards) no buff fits. Shrine
buffs are passive, so they sit outside §2.3's tool choice.

## 3. Sim gate

**Method.** Real game code in node `vm`, unpatched. Seeded mulberry32, 300 trials per cell. 11
bosses × 12 lineages × every class option × three policies (`basic`, `techs`, `kit`) — 1,404
cells, about 420,000 trial fights plus the §2.3 choice fights. Scripts in the session scratchpad
(the repo's sim convention); the fixture changes are in the repo, so the grid can be re-run.

**Judging** (same as `docs/SPEC-BOSS-SIM-TECHS.md` §3): per boss × lineage, B1 on the weakest option,
B2/B2f on the cheapest, B3 on the most expensive; a player picks the policy per option, so the
verdict takes the player's best of the three. Report:
1. The grid table (cheapest HP spent / weakest win %), with the kept kit per failing cell.
2. A delta table: `kit` vs `techs`, cheapest option, per boss × lineage.
3. The D2 sensitivity column: the cheapest option re-run with a Limit Break ready (Fury 5, fired
   on the first turn), and the cells it would tip under the floor. Not part of the verdict.
4. TP-over-budget cells (D4), companion HP lost (D5), and the shrine buffs each level's budget
   bought (§2.6).
5. The §2.5 cliff table.

**Report only.** No constant changes in this spec. Failing cells become one follow-up spec, which
decides the fix (boss stats, tech power, or the Academy weapon chains themselves) under its own
sim gate.

**Regression gate for the fixture itself:** with `opts.kit` off, `basic` and `techs` give identical
fights to the current fixture on the same seeds (the check `docs/SPEC-BOSS-SIM-TECHS.md` §2 ran on
440 seeded fights; re-run it on the same set).

## 4. Conventions & handoff checklist

- [x] `tests/boss_fixture.js`: `opts.kit` build, `kit` policy (§2.2), `chooseKit` (§2.3), `shardBudget`
  (§2.6), new metrics (§2.4). `basic` / `techs` unchanged: 380 seeded fights (4 lineages × every valid
  boss × both policies × 5 seeds) identical to the previous fixture.
- [x] `tests/test_p3_battle.js` Test 107: Paladin L60 with the kit, 30 seeded trials — wins ≥ 85%, B3
  holds, the kept kit includes a Cleave rank. B2 not asserted; it logs 36% HP spent.
- [x] Every existing boss test keeps the default build and policy, results unchanged.
- [x] Drop tables, icons, ids, save, changelog: none.
- [x] All 16 suites green (2026-10-28).
- Implementation choices the sections above leave open: tools that can never fire (a heal tech
  weaker than the heal item) are not offered to §2.3; with `kit`, a cast the engine refuses without
  spending Energy falls through to the next step instead of stalling; Defend needs
  `DEFEND_ENERGY_COST` Energy.

## 5. Decisions

All resolved by the user on 2026-10-28.

| # | Question | Decision |
|---|---|---|
| **D0** | Model a prepared player playing sensibly (§2.3), or an optimizer that finds the cheapest possible play | **Prepared player playing sensibly** (as recommended). The contract is about what players pay |
| **D1** | Shrine buffs: none, a fixed 3-buff package (120–150 shards), the 10-buff ceiling (315), or a level-scaled budget | **Level-scaled budget** (the first draft recommended the fixed package): the shards earned since the previous boss, spent down a fixed priority list (§2.6). Shrine buffs barely matter before L40 (budget ≤ 18 shards) and buy about one strong buff from L50 |
| **D2** | Assume a Limit Break is ready (Fury streak ≥ 5) at every boss, or not | **No** (the first draft recommended yes). Limit Breaks stay out of the verdict and are reported as a sensitivity column (§3 item 3) |
| **D3** | Defend only against a telegraphed charge, or also below a fixed HP line | **Charge only** (as recommended). Matters at L18/L25/L32 only |
| **D4** | Training Points: learn every rank the skills allow, or enforce 2 × (level − 1) TP. Melee fits (warrior 84 of 118 TP at L60, 146 of 198 at L100); casters don't (137 of 118, 243 of 198) | **Learn every rank, report `tpSpent`** (as recommended); flag cells where the kept kit goes over budget |
| **D5** | Companion HP lost: not counted, counted into HP spent with a weight, or a separate column | **Separate column, not in the verdict** (as recommended). Revisit if it's large |
| **D6** | Tool choice: one-pass backward elimination on 30 fights, forward greedy, or exhaustive subsets | **One-pass backward elimination, 30 fights** (as recommended). **Amended by the user 2026-10-29:** also score no tools and each single tool, keep the best (§2.3 step 5), after the removal pass was found stuck on a five-tool set (`docs/SPEC-COMPANION-SPELLPOWER.md` §3.1). Grids before this date may over-report boss cost where that happened |
| **D7** | Academy chains only for the skills the fixture trains, or also side skills (Alteration, Abjuration, Absorption, Hand to Hand, Thievery) | **Trained skills only** (as recommended). Casters still gain Starspark and Tidal Lance, which answers the boss half of the owed PR #1 caster-damage sim (priority step 3) |

## 6. Out of scope

- Any fix for failing cells (boss stats, tech power, Academy chain numbers) — the follow-up spec.
- The L10 5-levels-down hole from Academy rank-I weapon techs (`docs/SPEC-MELEE-CLASS-TECHS.md` F2;
  priority step 2).
- PR #1's caster damage on all 88 monsters, and its missing spec (priority step 3).
- Caster compensation (step 4), Radiant Smite on melee builds (step 6).
- Changing the contract's numbers or the prepared-fixture definition beyond adding the kit.

## 7. Sim gate results (run 2026-10-28)

**Method** as §3: real game code, unpatched; seeded mulberry32 (trials from seed 7000), 300 trials
per cell; 1,404 cells (11 bosses × 12 lineages × every class option × `basic`/`techs`/`kit`),
421,200 trial fights plus the §2.3 choice fights; 468 Limit Break cells; 24 cliff cells. Scripts in
the session scratchpad.

**`basic` + `techs` only: 0 failures**, the same verdict as `docs/SPEC-COMPANION-BOSS-COST.md` §3.

**With the kit (player's best of the three policies): B1 ✅ 132/132, B3 ✅ 132/132, B2 ❌ 39/132.**
Cheapest option HP spent per win % / weakest option win % (**x** = fails B2; band bosses need ≥ 35%
or ≥ 3 consumables, the finale ≥ 45%):

| Boss | SK | Bers | Pal | Ward | Magus | Conj | Cleric | Seer | Gambit | Assn | Ranger | Drag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| L10 | **x32**/100 | **x32**/100 | **x32**/100 | **x32**/100 | 61/99 | 61/99 | 61/99 | 61/99 | **x32**/100 | **x32**/100 | **x34**/100 | 41/100 |
| L18 | 38/100 | 38/100 | 38/100 | 38/100 | 42/100 | 42/100 | 42/100 | 42/100 | 42/100 | 42/100 | 40/100 | 40/100 |
| L25 | 38/100 | 38/100 | 38/100 | 38/100 | 47/100 | 47/100 | 47/100 | 47/100 | 44/100 | 44/100 | 43/100 | 44/100 |
| L32 | **x33**/100 | **x33**/100 | **x32**/100 | **x32**/100 | 46/100 | 46/100 | 41/100 | 41/100 | **x33**/100 | **x33**/100 | 36/100 | 37/100 |
| L40 | **x33**/100 | **x33**/100 | **x32**/100 | **x32**/100 | 56/100 | 56/100 | 55/100 | 55/100 | **x32**/100 | **x32**/100 | 40/100 | 43/100 |
| L50 | 40/100 | 40/100 | 38/100 | 38/100 | 42/100 | 42/100 | 39/100 | 39/100 | 41/100 | 41/100 | 54/100 | 56/99 |
| L60 | **x31**/100 | **x32**/100 | **x30**/100 | **x27**/100 | 41/100 | **x31**/100 | 36/100 | 40/100 | **x32**/100 | **x30**/100 | 40/100 | 44/100 |
| L70 | **x32**/100 | **x32**/100 | **x30**/100 | **x29**/100 | 45/100 | **x33**/100 | 42/100 | 45/100 | **x34**/100 | **x32**/100 | 41/100 | 46/100 |
| L80 | 46/100 | 45/100 | 46/100 | 44/100 | 44/100 | **x32**/100 | 41/100 | 43/100 | 39/100 | 38/100 | 61/100 | 67/100 |
| L90 | 48/100 | 49/100 | 48/100 | 46/100 | 46/100 | **x27**/100 | 43/100 | 46/100 | 37/100 | **x35**/100 | 64/100 | 72/100 |
| L100 | 50/100 | 51/100 | 51/100 | 50/100 | 70/100 | **x29**/100 | 67/100 | 72/100 | **x40**/100 | **x36**/100 | 70/100 | 75/100 |

The kit lowers the cheapest option's HP spent in 112 of 132 cells. Median drop per boss: L10 6,
L18 23, L25 40, L32 37, L40 16, L50 21, L60 18, L70 21, L80 5, L90 6, L100 10 points (largest:
Dragoon and Ranger at L25, 44–45). L18, L25 and L50 drop a lot but stay above the floor.

### 7.1 Finding 1 — the Academy weapon chains (31 cells)

Every warrior line (Shadowknight, Berserker, Paladin, Warden) and both twinblade lines (Gambit,
Assassin) fail at L10, L32, L40, L60 and L70; the Ranger fails at L10. The cheapest option keeps a
single tool: the top **Cleave** rank (warriors, Ranger) or **Vital Strike** rank (twinblades) —
rank I at L10, III–V later — with the Runeblade or Heir Legendary from L32. They land at 27–34% HP
spent (Warden at L60 lowest). The chain is cheap in Training Points (16 of 78 TP at L40). This is
the boss side of the hole `docs/SPEC-MELEE-CLASS-TECHS.md` F2 found at L10 against regular monsters.

### 7.2 Finding 2 — the Conjurer with Attunement and the Heir (5 cells)

The Conjurer fails at all five T3 bosses (L60–L100, 27–33%; the finale's 29% is 16 points under its
45%). The cheapest option is the Earth or Fire pact with Heir of the Echo, keeping **Attunement**
(the Evocation Academy buff) and Echoing Judgment. `docs/SPEC-COMPANION-BOSS-COST.md` passed these
cells without Academy techs; Attunement is the new part.

### 7.3 Finding 3 — twinblades at the top end with Crosscut (3 cells)

Assassin at L90 (35%, just under) and L100 (36%), and Gambit at L100 (40%), fail on the **Crosscut**
(Dual Wield) chain with a Legendary.

### 7.4 Report columns

- **Limit Break (D2 sensitivity):** with Fury 5 and a first-turn Limit Break, the cheapest option
  drops by at most 4 points (median 0). **No cell tips under the floor.**
- **Defend (D3):** the tool choice kept Defend in 0 of 468 cells. It was never worth a turn,
  including at the three bosses that wind up.
- **Training Points (D4):** no kept kit goes over budget (largest share: Conjurer/Wind at L60, 48 of
  118 TP). The caster overshoot in §5 D4 only applies to learning *everything*.
- **Companion HP lost (D5):** non-zero in 20 cells; median 3%, max 8% (Conjurer/Earth + Heir, L70).
  Small, so it stays out of the verdict.
- **Shrine (§2.6):** melee buys Honed Edge at L18–L32, Battle Fervor at L40, Warrior's Rage at L50,
  Berserker's Wrath from L60, plus Bulwark Blessing from L70 and Light Footing from L80. Casters buy
  Hardened Hide / Stoneskin early, Anima Kindling from L50, then armor and dodge buffs.
- **Kept tools across the 468 kit cells:** Cleave 154, Attunement 80, Vital Strike 44, Starspark 36,
  Echoing Judgment 33, Impale 32, Sidestep 32, Crosscut 24, Vault Reckoning 22, Fleetstep 22,
  Tailwind 20, Tempo 19; 14 cells keep nothing.

### 7.5 The +4 companion cliff (§2.5)

Conjurer, 300 trials, win % / HP spent %:

| Hero | Monster | No companion (`basic`) | No companion (`kit`) | Fire | Water | Earth | Wind |
|---|---|---|---|---|---|---|---|
| L60 | +4 `anima_scarred_frostwalker` (L64) | 100 / 52 | 100 / 43 | 100 / 28 | 100 / 35 | 100 / 26 | 100 / 52 |
| L60 | +6 `ukai_cave_warden` (L66; no L65 regular) | 79 / 171 | 95 / 96 | 100 / 160 | 100 / 160 | 100 / 160 | 100 / 160 |
| L80 | +4 `anima_horror_stalker` (L84) | 94 / 104 | 100 / 42 | 100 / 41 | 100 / 33 | 100 / 21 | 100 / 47 |
| L80 | +6 `skyspire_upper_sentinel` (L86; no L85 regular) | 100 / 132 | 100 / 106 | 100 / 106 | 100 / 106 | 100 / 106 | 100 / 106 |

- **The +4 cliff is gone as a win-rate cliff:** a prepared T3 Conjurer already wins +4 fights 94–100%
  without a companion, so a companion only makes them cheaper (Earth: 43% → 26% HP spent at L60).
- **Fear suppression still works:** at +6 all four pacts give identical fights, as in the v1.9 check.
- **The 5-levels-down rule doesn't hold for this build:** the Conjurer wins +6 fights 79–100%. This
  is the accepted known limitation in `CLAUDE.md` (Fear-spared healing sustain at high levels), not
  something this spec changes.

## 8. Follow-ups

| # | Item | Notes |
|---|---|---|
| F1 | Melee Academy weapon chains under the boss floor (Finding 1, 31 cells) — **done** (`docs/SPEC-ACADEMY-WEAPON-CHAINS.md`; 3 cells accepted 1–2 points under) | Fix in one spec together with `docs/SPEC-MELEE-CLASS-TECHS.md` F2 (the L10 5-down hole): same tools, same root cause. Options include the chains' `powerMult` / energy cost, or boss stats; decided there under its own sim gate |
| F2 | Conjurer + Attunement + Heir (Finding 2, 5 cells) | Check how Attunement feeds companion damage, or the Heir on a Conjurer |
| F3 | Twinblade Crosscut at L90–L100 (Finding 3, 3 cells) — **done** (`docs/SPEC-ACADEMY-WEAPON-CHAINS.md`) | Likely the same fix family as F1 |
