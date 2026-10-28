# SPEC — Boss Cost Band (one measurable definition of "prepared players win reliably but pay")

**Status:** IN FORCE (as amended). Met by `docs/SPEC-BOSS-COST-RETUNE.md` (commit `73a6c36`) and written into the lead docs (`dfab75f`); both shipped in v1.13.0 (merged to `main` with PR 4 (`dbc83a8`) and deployed with v1.13.0 on 2026-10-28). All decisions resolved by the user 2026-10-23 (D8 dropped). Sim gate S1/S2 run 2026-10-23 (§3.3): B1 and B3 pass, B2/B2f fail (76 of 132 boss × lineage cells), as expected — closed by the boss cost retune follow-up (D9). **Amended 2026-10-23:** B2/B2f now measure HP spent per win (35% band, 45% finale, no finale consumable requirement), because HP left on win does not respond to boss strength (`docs/SPEC-BOSS-COST-RETUNE.md` §1.2); the §3.3 results below use the original HP-left rule.
No game code or combat constant changes in this spec, **but the raised cost floor fails all 11
shipped bosses on lineages' cheapest class options (§3.1), so the shipped bosses get retuned in a follow-up spec (D9).**
Authored 2026-10-23.

**Relationship to authority:** sharpens the boss clause of the difficulty contract (CLAUDE.md
§"Established balance formulas", `.claude/skills/balance-sim/SKILL.md`, `docs/LEAD-PLAYBOOK.md`
line 74). The contract is a **project rule set by the user**, not an archived rule, so changing it
is a user decision and not a [revised] tag. Archived intent this has to serve: "Strategic boss
battles" and monsters that react to the hero `[archived: reference/site/homepage_2006.md]`. The
5-levels-down clause (Fear) `[archived: reference/manual/Fear.md]` and the at-level regular clause
are not touched. Every threshold below is `[invented]`, calibrated on shipped sim data (§3).

**Interpretation of the request (confirm — D0):** today "pays" is written as prose, and the code and
specs turn it into three different numbers (§1). This spec defines **one** pass/fail test for a boss
cell. It covers a win-rate floor, a cost **floor** ("not free"), and a new cost **ceiling** ("not
ruinous"). It also says how to measure it and how in-repo tests relate to sim gates. *Other reading:*
a win-rate **band** with a ceiling (for example 70–95%), so that bosses lose sometimes. This spec
**recommends against it**: almost every shipped boss wins 99–100% for every lineage (§3), so a
ceiling would force retuning shipped bosses, which breaks the ratchet principle. If you want bosses
that can actually beat a prepared player, that's a separate difficulty spec.

---

## 1. What changes

### 1.1 Today: three versions of "pays"

| Where | Win floor | "Pays" test | Fixture / trials |
|---|---|---|---|
| `tests/test_p3_battle.js` (5 band bosses, L50–L90) | ≥ 60% | mean HP left on win ≤ **85%** OR mean consumables/win ≥ 1 | modest geared warrior, 6 spheres + 6 crystals, 30 trials, `Math.random` |
| `tests/test_p6b_content.js` Part 4 (eidas_echo L40) | ≥ 60% | mean HP left on win ≤ **80%** OR mean consumables/win ≥ 1 | L40 warrior, 5 potions + 5 crystals, 50 trials, `Math.random` |
| `tests/test_p3_battle.js` (eidas_ascendant L100) | ≥ 60% | mean consumables/win ≥ **2** (finale premium) | same as band bosses, 60 trials |
| `docs/SPEC-ROGUE-BOSS-COST.md` §0, S1 | "reliably" | mean HP left ≤ **80%** OR ≥ 1 consumable per win, for the **cheapest** class option | v1.10 P0 lineage grid, 3 potions + 3 crystals, 300 seeded trials |
| `docs/SPEC-MONSTER-TECH-POWER.md` §3 | "reliably" | max HP left on a win ≤ 80%, where **a win that uses ≥ 1 consumable counts as paying** (scored per win, not per mean) | lineage grid, 300 trials |
| prose (CLAUDE.md, balance-sim skill, playbook) | "reliably" | "meaningful HP loss or consumed resources — not free" | ≥ 300 trials |

Gaps: (a) 80 vs 85; (b) means vs per-win scoring; (c) "reliably" has no number, so the 60% test
floor is often read as the target; (d) **no ceiling**, so a boss that drains a prepared player's
whole stock still passes; (e) which class option to judge (the cheapest one for the cost floor) is
only written down in one spec.

### 1.2 After

One contract (§2), written once into CLAUDE.md and copied into both balance-sim skill files and the
playbook. Test asserts follow it (§4).

## 2. Design detail — the boss contract

A **boss cell** = one boss, fought at its own level, by one fixture build, ≥ 300 seeded trials.
Wins only are used for the cost metrics.

| # | Rule | Threshold | Judged on | Tag |
|---|---|---|---|---|
| B1 | **Win floor** (band bosses, L10–L90) | win ≥ **85%** | **each lineage's weakest class option** (every lineage must clear it on its own weakest option, as today) | [invented]; same as the at-level regular floor; user-set (D3) |
| B1f | **Win floor** (finale, eidas_ascendant L100) | win ≥ **75%** | each lineage's weakest class option | [invented]; finale may be harder, never unwinnable |
| B2 | **Cost floor — "not free"** (band bosses) | mean **HP spent per win ≥ 35%** OR mean consumables per win ≥ **3** (amended 2026-10-23 from "HP left ≤ 65%", `docs/SPEC-BOSS-COST-RETUNE.md` D0) | **each lineage's cheapest class option** (every lineage must clear it on its own cheapest option) | [invented]; user-set 2026-10-23 (was 80% / 1) |
| B2f | **Cost floor** (finale) | **HP spent per win ≥ 45%** on each lineage's cheapest class option and on the regression fixture; no consumable requirement (amended 2026-10-23, `docs/SPEC-BOSS-COST-RETUNE.md` D0, D1, D6) | each lineage's cheapest class option, and the regression fixture | [invented]; user-set 2026-10-23 (D10; was consumables ≥ 2 only) |
| B3 | **Cost ceiling — "not ruinous"** (new) | mean consumables per win ≤ **50% of the stock carried** (finale too, D8) | the **most expensive** build | [invented] |
| B4 | **No win ceiling** | 100% win is allowed if B2/B2f hold | — | [invented]; see D0 |

**Measurement rules (part of the contract):**
- **"Prepared"** = the v1.10 P0 lineage fixture: best non-unique gear at level, every stat point
  spent, skills at half level, every passive bought, **6 healing + 6 Energy consumables** at tier
  (raised from 3 + 3 so the ≥ 3 / ≥ 4 floors fit under the B3 ceiling, D7).
  Policy: heal below 40% HP, use an Energy consumable at 0 Energy, else best affordable tech or
  attack. (Implemented as `fightOnce()` in `tests/boss_fixture.js`.)
- **Shrine buffs off.** Fully stacked shrine buffs are an accepted edge case
  (`docs/SPEC-SECONDARY-STATS.md` D9: rogue at the L32 boss 81–85% HP left). The contract is
  judged without them.
- **Report**, every boss cell: win %, mean rounds, mean **and 10th-percentile** HP left on win,
  mean consumables per win **and as % of stock**. The 10th percentile is report-only: it shows
  close calls the mean hides.
- **Sim gate vs regression test:** the 300-trial seeded grid is the gate. In-repo tests are a
  regression floor: 30–60 unseeded trials can't tell 85% from 90%, so test win floors stay at
  60% (§4). The cost thresholds in tests match B2/B3 exactly.

## 3. Balance rationale & sim gate

### 3.1 Calibration — shipped numbers against the proposed rules

**Regression fixture** (run 2026-10-23 on `a27ad8d`, the in-repo tests, unseeded):

| Boss | Win | HP left on win | Consumables / win (% of stock) | B2 / B2f (≤ 65% OR ≥ 3; finale ≤ 65% AND ≥ 4) | B3 |
|---|---|---|---|---|---|
| eidas_echo L40 | 100% (50) | 57% | 2.6 of 10 (26%) | ✅ HP | ✅ |
| majiku_warlord L50 | 100% (30) | 64% | 3.4 of 12 (28%) | ✅ both | ✅ |
| majiku_ridge_chieftain L60 | 100% (30) | 69% | 3.6 of 12 (30%) | ✅ consumables | ✅ |
| ukai_deep_dweller L70 | 100% (30) | 70% | 3.5 of 12 (29%) | ✅ consumables | ✅ |
| estari_warden_prime L80 | 100% (30) | 62% | 3.4 of 12 (28%) | ✅ both | ✅ |
| society_anima_horror L90 | 100% (30) | 67% | 3.5 of 12 (29%) | ✅ consumables | ✅ |
| eidas_ascendant L100 | 86.7% (60) | 69% | 5.6 of 12 (47%) | ❌ 5.6 ≥ 4 ✅, but 69% > 65 ❌ | ✅ thin |

The regression fixture passes everywhere except the finale: it spends enough (5.6 ≥ 4) but keeps
4 points too much HP. 60 unseeded trials can't settle a gap that small; S2 decides it.

**Lineage grid, cheapest build overall** (shipped v1.12.0 numbers: `docs/SPEC-MONSTER-TECH-POWER.md` §3,
"chosen" column; 3 + 3 stock). Max HP left on a win, among wins that used no consumable:

| Boss | L10 | L18 | L25 | L32 | L40 | L50 | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| HP left | 76 | 71 | 76 | 80 | 72 | 67 | 73 | 72 | 74 | 74 | 64* |
| B2 / B2f | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌** |

\*L100 is the "Judgment = floor" row; the shipped ×1.3 Judgment is harder, so ≤ 64%.
\*\*L100 passes the HP half of B2f but not the consumable half: the rogue line spends 0.46–0.63
per win there (`docs/SPEC-ROGUE-BOSS-COST.md` S1), far below 4.
Cheapest builds (rogue line, best Heavy-armor lines) spend 0–0.9 consumables per win
(`docs/SPEC-ROGUE-BOSS-COST.md` S1), far below 3. The table is the cheapest build across *all*
lineages, so it shows which bosses fail for **at least one lineage**: all 11 (L10–L90 by 2–15
points of HP, L100 on consumables). Judged per lineage (B2), more lineages per boss may fail; the published sims don't break HP
left out per lineage (the rogue line alone sits at 61–78%, failing L10–L90), so S1 has to give
the full boss × lineage table. Raising the stock to 6 + 6 (D7) doesn't help:
the heal policy only drinks below 40% HP, so a fight that never gets there costs 0 either way.

Win rates on each lineage's weakest class option (B1/B1f): the lowest of them is 87.7% at L10,
≥ 99.7% at L18–L90 and 91.3% at L100 (Dragoon, Judgment ×1.3), so every lineage clears its floor.
✅ B1 thin at L10; ✅ B1f.

Reasoning behind each number:
- **B1 85% / B1f 75%, judged on each lineage's weakest class option:** user-set (D3), keeping
  today's method. The 85% matches the at-level regular floor.
- **B2 65% OR ≥ 3; finale 65% AND ≥ 4:** user-set. A deliberate raise: bosses should cost a
  third of the hero's HP or a real dip into the pack, not a scratch, and the finale must cost both.
- **B3 50% of stock:** if a prepared player spends half of what they brought, the next boss means a
  shop trip. With the 6 + 6 stock (D7), B2's 3 consumables = 25% and B2f's 4 = 33%, both under the
  ceiling, so the finale needs no ceiling of its own (D8).

### 3.2 Sim gate (run before this spec goes READY)

| # | Cells | Metrics | Pass |
|---|---|---|---|
| S1 | All 11 bosses × 12 lineages × every class option, current `main` (v1.12.0), 300 seeded trials, 6 + 6 stock | all §2 report metrics | B1/B1f (each lineage's weakest class option), B2/B2f (each lineage's cheapest class option), B3 (most expensive build) |
| S2 | Regression fixtures (the in-repo boss tests), 300 seeded trials instead of 30–60 | same | B2/B2f, B3; win ≥ 85% / 75% |
| S3 | Every cell failing S1/S2 | per-boss gap to the line (HP points, consumables) | Input to the D9 retune spec: a boss × lineage table of failures. Expected: all 11 bosses fail for at least one lineage; how many lineages per boss is unknown until S1 runs |

### 3.3 Sim gate results (S1, S2 — run 2026-10-23 on `a27ad8d`, v1.12.0)

**Method.** Real game code in node `vm`, unpatched, seeded mulberry32 (seed = trial index),
**300 trials per cell**. Scripts are in the session scratchpad (ephemeral, per the repo's sim
convention); only these results are durable.
- **S1 fixtures** (rebuilt from the v1.10 P0 description, since the old scripts weren't kept):
  Human, all stat points spent vit/end/main/main/main (main = Str, Dex for the rogue line, Int for
  casters), skills at half level (weapon, armor, Dodge, Double Attack, plus Shields / Dual Wield /
  Evocation where used), best non-unique, non-cursed usable gear in every slot, the lineage's tiers
  open at that level (T1 L5, T2 L30, T3 L60) with **every passive bought**, and each Legendary the
  level allows (Runeblade L30, Vaultbreaker L32, Heir L40) as its own class option.
  Archetypes: warrior lines sword + shield + Heavy; rogue line twin knives + Light; Ranger sword +
  Medium; Dragoon polearm + Medium; casters rod + Light + best Firebolt rank their Evocation allows.
  **Stock 6 + 6** (D7): the best pure heal and best Crystal the hero can use.
- **Policy:** use a Crystal when the next action would empty the Energy pool (`useItem` is refused
  at 0 Energy), heal below 40% HP, casters cast Firebolt, everyone else attacks. Class techs are
  not cast; Conjurer has no companion (same limits as the earlier grids).
- **S2:** the 7 in-repo boss sims unchanged except 300 seeded trials instead of 30–60.
- 408 S1 cells (11 bosses × 12 lineages × 1–4 options), 122,400 fights: 122,291 won, 109 monster
  fled (L10 casters), 0 lost.

**B1 / B1f — win floor: ✅ every boss, every lineage.** Weakest option per lineage: L10 casters
92%, L10 Dragoon 97%, every other cell 100%, including L100 (floor 75%).

**B3 — cost ceiling: ✅ everywhere.** The most expensive build at any boss spends 1.2 of 12
consumables (10%, Dragoon at L100).

**B2 / B2f — cost floor: ❌ 76 of 132 boss × lineage cells fail; every boss fails for 4–12
lineages.** Cheapest class option per lineage, HP left on win % / consumables per win
(**x** = fails; band bosses need ≤ 65% or ≥ 3, the finale ≤ 65% and ≥ 4):

| Boss | SK | Bers | Pal | Ward | Magus | Conj | Cleric | Seer | Gambit | Assn | Ranger | Drag | Fails |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| L10 Ruin Warden | 57/0.1 | 57/0.1 | 57/0.1 | 57/0.1 | x77/1.0 | x77/1.0 | x77/1.0 | x77/1.0 | 58/0.0 | 58/0.0 | 60/0.3 | x78/0.9 | 5 |
| L18 Matriarch | x66/0.4 | x66/0.4 | x66/0.4 | x66/0.4 | x68/0.0 | x68/0.0 | x68/0.0 | x68/0.0 | 62/0.1 | 62/0.1 | x68/0.5 | x68/0.5 | 10 |
| L25 Leviathan | 61/0.2 | 61/0.2 | 61/0.2 | 61/0.2 | x75/0.0 | x75/0.0 | x75/0.0 | x75/0.0 | x68/0.0 | x68/0.0 | 62/0.2 | 63/0.3 | 6 |
| L32 Custodian | x68/0.0 | x68/0.0 | x67/0.0 | x67/0.0 | x69/0.0 | x69/0.0 | x70/0.0 | x70/0.0 | x80/0.0 | x80/0.0 | 64/0.0 | 64/0.0 | 10 |
| L40 Eidas' Echo | 65/0.4 | 65/0.4 | 64/0.4 | 64/0.4 | 62/0.0 | 62/0.0 | 64/0.0 | 64/0.0 | x73/0.0 | x73/0.0 | x71/0.7 | x71/0.7 | 4 |
| L50 Warlord | x68/0.6 | x68/0.6 | x71/0.6 | x71/0.6 | 62/0.3 | 62/0.3 | 59/0.2 | 59/0.2 | x69/0.0 | x69/0.0 | x71/0.8 | x70/0.8 | 8 |
| L60 Ridge Chieftain | 62/0.1 | 62/0.1 | 62/0.3 | 61/0.2 | x65/0.0 | 63/0.0 | x67/0.0 | 64/0.0 | x72/0.0 | x73/0.0 | x67/0.6 | x67/0.5 | 6 |
| L70 Deep Dweller | 62/0.1 | 62/0.1 | 62/0.2 | 62/0.2 | 61/0.0 | 59/0.0 | 63/0.0 | 60/0.0 | x71/0.0 | x73/0.0 | x67/0.6 | x67/0.6 | 4 |
| L80 Warden Prime | 64/0.0 | 65/0.0 | 63/0.0 | 63/0.0 | 64/0.4 | x67/0.5 | 62/0.3 | x66/0.5 | x72/0.0 | x75/0.0 | x67/0.5 | 65/0.4 | 5 |
| L90 Anima Horror | 65/0.0 | 64/0.0 | 63/0.0 | 64/0.0 | 64/0.4 | x68/0.6 | 64/0.4 | x68/0.6 | x73/0.0 | x75/0.0 | x67/0.5 | x67/0.5 | 6 |
| L100 Ascendant | x69/0.6 | x70/0.7 | x72/0.7 | x71/0.7 | x73/0.8 | x73/0.8 | x74/0.8 | x74/0.8 | x70/0.4 | x70/0.2 | x72/0.9 | x71/1.2 | 12 |

(Below L30 / L60 lineages share their T1 / T2 class, so the warrior, caster and rogue groups show
identical numbers. "x65" is a cell just over 65.0%.)

**Reading it:**
- **Gaps are small but everywhere.** Distance from the 65% line for failing cells: median 5
  points, max 15 (rogue line at L32, 80%). The rogue line (Gambit/Assassin) fails 9 of 11 bosses,
  Ranger 8, Dragoon 8; warrior lines 4; casters 6–8.
- **The consumable path never triggers on these fixtures.** No cheapest option spends more than
  1.2 consumables per win, so the ≥ 3 path is dead and B2 is in practice "HP left ≤ 65%". Heals
  fire only below 40% HP, and well-geared heroes rarely get there.
- **The finale fails for all 12 lineages on both halves:** HP left 69–74% (needs ≤ 65%) and
  0.2–1.2 consumables (needs ≥ 4).
- **Fixture caveat:** these fixtures win more than the earlier published grids (L10 casters 92%
  here vs 86–88%; L100 100% here vs Dragoon 91.3% in `docs/SPEC-MONSTER-TECH-POWER.md` §3). The
  old scripts weren't kept, so the exact fixtures can't be matched; differences in gear slots
  filled and the Crystal-timing policy are the likely cause. The retune spec should lock its
  fixture first and re-run this grid as its baseline.

**S2 — regression fixtures, 300 seeded trials:**

| Boss | Win | HP left on win | Consumables / win (% of stock) | B2 / B2f | B3 |
|---|---|---|---|---|---|
| eidas_echo L40 | 100% | 56% | 2.7 of 10 (27%) | ✅ HP | ✅ |
| majiku_warlord L50 | 100% | 67% | 3.4 of 12 (28%) | ✅ consumables | ✅ |
| majiku_ridge_chieftain L60 | 100% | 69% | 3.4 of 12 (28%) | ✅ consumables | ✅ |
| ukai_deep_dweller L70 | 100% | 67% | 3.7 of 12 (31%) | ✅ consumables | ✅ |
| estari_warden_prime L80 | 100% | 68% | 3.5 of 12 (29%) | ✅ consumables | ✅ |
| society_anima_horror L90 | 99.3% | 69% | 3.4 of 12 (28%) | ✅ consumables | ✅ |
| eidas_ascendant L100 | 90.3% | **65.45%** | 5.6 of 12 (47%) | ❌ HP over by 0.45 pt (consumables ✅) | ✅ |

The regression fixtures are weaker than the grid (3 gear slots, creation-level skills, no classes),
so they pass band bosses through the consumable path. The finale misses B2f by under half a point.

**Harness finding (tests):** every in-repo boss sim's "use a Crystal when `!canAct`" branch can
never fire, because `useItem` refuses at 0 Energy. The consumables those tests count are all
heals. The policy above (Crystal before the pool empties) is the working version; the tests
should adopt it when they are edited (§4).

**Gate verdict:** B1 ✅, B3 ✅, **B2/B2f ❌** (S1: 76/132 cells; S2: finale by 0.45 pt). As
expected (D9), the contract cannot go live until the boss cost retune lands. Input for that spec:
the B2 table above. Retune target: lower the cheapest option's HP left by about 5–15 points per
boss (more for the rogue line), and at L100 also push consumables to ≥ 4, while keeping B1
(L10 casters are at 92%, 7 points of headroom) and B3 (now ≤ 10% of stock, plenty of headroom).

## 4. Conventions & handoff checklist

- [ ] **Docs:** replace the boss clause in CLAUDE.md, `docs/LEAD-PLAYBOOK.md` line 74,
      `.claude/skills/balance-sim/SKILL.md` and `.agents/skills/balance-sim/SKILL.md` (the two
      copies already differ — sync them) with the §2 table and measurement rules.
- [ ] **Tests (superseded 2026-10-23 by `docs/SPEC-BOSS-COST-RETUNE.md` §4):** the 7 boss sims in
      `tests/test_p3_battle.js` / `tests/test_p6b_content.js` move to one shared prepared-warrior
      fixture and assert win ≥ 85% (finale ≥ 75%), HP spent per win ≥ 35% (finale ≥ 45%, no
      consumable requirement) and consumables ≤ 50% of stock. They ship with the boss retune,
      since the current bosses fail the HP-spent floor. The dead `!canAct` → Crystal branch is
      replaced with "Crystal before the pool empties" (§3.3 harness finding).
- [ ] **Fixture:** sim-gate stock 3 + 3 → 6 + 6 (D7); update the balance-sim skill's fixture line.
- [ ] Drop tables / items / icons / ids: none.
- [ ] Save impact: none (no state change).
- [ ] Changelog: none from this spec. The D9 retune will need a player-facing line ("bosses hit
      harder").
- [ ] Unrelated finding: the test files hard-code `base = "D:/Claude - collection folder/HeroRPG/js"`
      (`tests/test_p3_battle.js:9`, `tests/test_p6b_content.js:17`, `:381`, `:508`), so they fail on
      any other checkout. Out of scope here (§6); worth its own fix.

## 5. Open decisions

| # | Decision | Status / recommendation |
|---|---|---|
| **D0** | Floor + ceiling on **cost**, no win ceiling — vs. a win-rate band (e.g. 70–95%) | **Resolved (user accepted the recommendation, 2026-10-23):** **Cost band, no win ceiling.** A win ceiling fails ~all shipped bosses |
| **D1** | B2 HP line | **Resolved (user, 2026-10-23): 65%**, with the consumable path raised to ≥ 3 (finale: D10) |
| **D2** | B2 scoring: OR of means (tests, rogue spec) or per-win "a win with ≥ 1 consumable pays" (tech-power spec) | **Resolved (user accepted the recommendation, 2026-10-23):** **OR of means.** With a 3-consumable path, per-win scoring would make no sense anyway |
| **D3** | B1 win floor | **Resolved (user, 2026-10-23):** 85% band / 75% finale, judged on **each lineage's weakest class option**, as today (an earlier "single weakest build" version was reversed the same day) |
| **D4** | Known edges: L10 weakest build at 87.7% win; shrine-stacked rogue | **Resolved (user accepted the recommendation, 2026-10-23):** **Accept the L10 cell** if S1 confirms ≥ 85%. Shrine stacking stays out of the contract (`docs/SPEC-SECONDARY-STATS.md` D9). (The old L32 "exactly 80%" edge is now just a B2 fail, D9) |
| **D5** | B3 ceiling: 50% of stock, or also a gold-cost ceiling | **Resolved (user accepted the recommendation, 2026-10-23):** **50% of stock now.** Gold-economy ceiling once boss gold drops are reviewed |
| **D6** | Tests on seeded RNG with ≥ 300 trials? | **Resolved (user accepted the recommendation, 2026-10-23):** **No for now** (suite runtime). Revisit if test and gate disagree |
| **D7** | Sim-gate stock 3 + 3 → 6 + 6 so ≥ 3 / ≥ 4 fit under B3 | **Resolved (user accepted the recommendation, 2026-10-23):** **Raise to 6 + 6**, matching the band-boss regression fixture. With 3 + 3, B2's 3 is exactly the B3 ceiling and B2f's 4 is above it (67%) |
| **D8** | Separate finale B3 ceiling? | **No longer needed:** with D10's ≥ 4, the finale floor is 33% of a 6 + 6 stock, under the shared 50% ceiling (still true: the finale now has no consumable floor) |
| **D9** | **The raised B2/B2f fails all 11 shipped bosses for at least one lineage's cheapest class option.** Retuning shipped bosses breaks the ratchet principle and needs your direction | **Resolved (user, 2026-10-23): retune the shipped bosses in a follow-up spec** (boss cost retune), sim-locked to B2/B2f, using the S1 boss × lineage failure table as input. The retune is user-directed, so it is an explicit exception to the ratchet principle for boss constants only. Likely lever: boss damage premium or boss tech fraction (`BOSS_TECH_DAMAGE_FRACTION`), *not* player-side nerfs, and re-check B1 (L10 is already at 87.7%). |
| **D10** | Finale floor shape | **Resolved (user, 2026-10-23): both required** — HP left ≤ 65% AND ≥ 4 consumables per win (replaces the earlier OR / ≥ 6 draft and the old test's ≥ 2 only) **Superseded 2026-10-23:** the finale rule is now HP spent ≥ 45% only (`docs/SPEC-BOSS-COST-RETUNE.md` D0, D6) |

## 6. Out of scope

- Retuning any boss, monster, item or constant (that's the D9 follow-up spec, boss cost retune).
- The at-level regular clause and the 5-levels-down / Fear clause (and its known past-L50 gap).
- Champions and hunt-only spawns (not bosses).
- The hard-coded `D:/` test path (§4 note).
