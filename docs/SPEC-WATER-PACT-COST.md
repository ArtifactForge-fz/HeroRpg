# SPEC — Water pact boss cost (the Tidal Undine heals only when you're hurt)

**Status:** IMPLEMENTED (uncommitted) on branch `v1.11-hero-tree`. D0–D1 resolved by the user
2026-10-28 (§4). Sim gate run 2026-10-28 (§3) on the real code: passes. Authored 2026-10-28
(user-directed: "fix the water-pact first", follow-up F1 of `docs/SPEC-BOSS-SIM-TECHS.md`).

**Relationship to authority:** retunes the Water companion from `docs/SPEC-COMPANION-SYSTEM.md`
(v1.9: `comp_water` basic action Soothing Spray, `[invented][sim-gated]`). Measured against the
boss contract in `docs/SPEC-BOSS-COST-BAND.md` §2 (as amended). No archived rule changes: the heal
stays Fear-exempt (`Recent_Updates.md` 2007-04-06). Following the ratchet principle, the
companion changes, not the bosses.

## 1. Problem

`docs/SPEC-BOSS-SIM-TECHS.md` §3.1: a Water Conjurer pays only 17–25% of its HP bar per boss win at
all five T3 bosses (L60–L100). The floor is 35%, and 45% at the finale. It wins 100% and drinks
nothing.

Cause: Soothing Spray heals `round(5 + 0.5·L)` power every round, scaled by the hero's
Intelligence (`techEffectivePower` heal path, × (1 + Int × 0.01)). A prepared T3 caster has
182–302 Int, so one spray restores **36–50% of the HP bar**, and T3 bosses only land about 15% of
it per round. The Undine erases every hit while the hero is at full HP.

The heal's size alone can't fix this. At ×0.2 power (68 per spray at L80) a spray still covers one
boss hit, and HP spent stays at 18–24%. A per-round cap of 10% of max HP only reaches 21–36%
(§3.1).

## 2. Design

| # | Change | Value | Tag |
|---|---|---|---|
| W1 | Soothing Spray **heals only while the hero is below 60% HP**. Above it, the Undine still chips the foe and still costs 4 Energy. The log reads "holds its spray". New optional field `basic.healBelow` (schema in `js/data/companions.js`). Only `comp_water` sets it. | `healBelow: 0.6` | [invented][sim-gated], user-set (D0) |
| W2 | Soothing Spray's per-level growth is halved | `powerPerLevel` 0.5 → **0.25** (`powerBase` stays 5) | [invented][sim-gated], user-directed (D1) |

Code: `js/core/companion.js` `act()`, heal branch. Data: `js/data/companions.js` `comp_water`.
No save impact (companion state is still `{ kindId, hp }`), no new ids, no icons.

Heal per spray after W2, on the prepared T3 Conjurer build: L60 82 (24% of the bar), L80 123 (28%),
L100 173 (32%). It was 124 / 192 / 273 before. A level-up never lowers it: the level term and the
Int multiplier only grow. This was checked level by level from L60 to L100, on the caster and on a
0-Int hero: 0 drops.

## 3. Sim gate

**Method.** Real game code in node `vm`, seeded mulberry32, `tests/boss_fixture.js` (`docs/SPEC-BOSS-SIM-TECHS.md` §2):
- **Boss cells:** Water pact × 4 Legendary options × 5 T3 bosses, 300 trials, `techs` policy.
- **Regular cells:** all 24 regular monsters from L61 to L99, each fought at its own level and at
  5 levels down, 100 trials.

### 3.1 Options compared (patched in the sim; HP spent per win on the cheapest option / weakest win)

| Variant | L60 | L70 | L80 | L90 | L100 (needs 45%) | Boss fails | At-level regulars |
|---|---|---|---|---|---|---|---|
| Shipped | 17 / 100 | 18 / 100 | 18 / 100 | 19 / 100 | 21 / 100 | 5 | all 100% |
| Heal × 0.2 | 19 / 100 | 18 / 100 | 18 / 100 | 19 / 100 | 21 / 100 | 5 | all 100% |
| Cap 10% of max HP per spray | 21 / 100 | 22 / 100 | 22 / 100 | 24 / 100 | 25 / 100 | 5 | all 100% |
| Heal below 40% | 41 / 100 | 44 / 100 | 42 / 100 | 43 / 100 | 61 / 100 | 0 | all 100% |
| Heal below 50% | 41 / 100 | 44 / 100 | 42 / 100 | 43 / 100 | 57 / 100 | 0 | all 100% |
| Heal below 60% | 40 / 100 | 42 / 100 | 40 / 100 | 42 / 100 | 53 / 100 | 0 | all 100% |
| Below 60% + growth 0.35 | 40 / 100 | 42 / 100 | 40 / 100 | 42 / 100 | 52 / 100 | 0 | all 100% |
| **Below 60% + growth 0.25 (chosen)** | 40 / 100 | 42 / 100 | 40 / 100 | 42 / 100 | 52 / 100 | 0 | all 100% |
| Below 60% + growth 0.15 | 40 / 100 | 41 / 100 | 40 / 100 | 42 / 100 | 51 / 100 | 0 | all 100% |

### 3.2 Result on the implemented code (no patches)

| Water option | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|
| no Legendary | 49 | 51 | 54 | 53 | 62 |
| + Runeblade | 48 | 49 | 52 | 51 | 60 |
| + Vaultbreaker | 49 | 51 | 50 | 50 | 59 |
| + Heir | 40 | 42 | 40 | 42 | 52 |

HP spent per win %. Every cell wins 100%, uses ≤ 0.04 of 12 consumables, and lasts 3.1–6.1 rounds.
- **B1 ✅, B2 / B2f ✅, B3 ✅** for the Water pact at every T3 boss.
- **At-level regulars:** 24 of 24 won 100% (floor 85%).
- **5 levels down:** the Water pact still wins there, but so does every prepared T3 build without
  Water: a Paladin 98–100%, a Conjurer with no companion 52–100%, and the other pacts 82–100%. This
  is the already-accepted Fear limitation past ~L50 (CLAUDE.md, DESIGN §4). The change doesn't
  widen it.
- **Full grid re-run** (936 cells, 280,800 fights, same seeds): only the 20 Water-pact cells
  changed. The other 916 are identical, byte for byte.

### 3.3 Still open (not this spec): the other three pacts

With Water fixed, the Conjurer lineage still fails B2 at all five T3 bosses, on its cheapest
options:

| Boss | Options under the floor (HP spent %) |
|---|---|
| L60 | Fire + Heir 35 (just under), Earth + Heir 33, Wind + Heir 33 |
| L70 | Earth + Heir 35 (just under), Wind + Heir 32 |
| L80 | Fire + Heir 34, Earth + Heir 33, Wind + Heir 32 |
| L90 | Fire + Heir 33, Earth + Heir 32, Wind + Heir 31 |
| L100 (45%) | Earth 34–40 on every option, Wind 36–41 on every option, Fire + Heir 42 |

These are 1–4 points short at the band bosses (only with the Heir Legendary) and 3–11 at the
finale. Recorded as the remaining part of follow-up F1 in `docs/SPEC-BOSS-SIM-TECHS.md` §5.

## 4. Decisions

| # | Decision | Resolution |
|---|---|---|
| D0 | Lever for the Water pact: smaller heal, per-spray cap, or heal-below threshold (and which threshold) | **Resolved (user, 2026-10-28): heal below 60% HP.** Size cuts and caps can't reach the floor (§3.1). 60% lets Water help soonest of the passing thresholds |
| D1 | Also lower how fast the heal grows (user request) | **Resolved (user, 2026-10-28): `powerPerLevel` 0.25** (from 0.5). Confirmed that a level-up never lowers the heal (§2) |

## 5. Tests

- `tests/test_companion.js` **Test 15** (new, deterministic): at full HP and at exactly 60% the
  Undine doesn't heal; below 60% it does. The chip and the 4 Energy apply every round.
- `tests/test_companion.js` **Test 14**: now asserts the B2 cost floor for the Water pact at L80
  (≥ 35% HP spent or ≥ 3 consumables). The other pacts are still logged only (§3.3).

## Changelog draft (for the release that ships this)

> **The Tidal Undine saves its strength.** The Conjurer's Water companion now only mends you once
> you drop below 60% health, and its heal grows more slowly with level. Bosses will no longer
> bounce off a Water Conjurer — expect to take real hits before the Undine steps in.
