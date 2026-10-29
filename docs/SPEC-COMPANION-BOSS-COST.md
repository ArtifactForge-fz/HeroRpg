# SPEC — Companion boss cost (Fire, Earth and Wind pacts)

**Status:** IMPLEMENTED (commit `2d7f59e`) on branch `v1.11-hero-tree`; not yet merged to `main`, released or deployed. Every change was directed by the
user on 2026-10-28 (§4). Sim gate run 2026-10-28 on the implemented code (§3): **all 132 boss ×
lineage cells pass B1/B2/B3**. Follows `docs/SPEC-WATER-PACT-COST.md` (Water) and closes the rest of
follow-up F1 of `docs/SPEC-BOSS-SIM-TECHS.md`.

**Relationship to authority:** retunes the companion system of `docs/SPEC-COMPANION-SYSTEM.md`
(v1.9, every number `[invented][sim-gated]`), measured against the boss contract in
`docs/SPEC-BOSS-COST-BAND.md` §2 (as amended). No archived rule changes. Following the ratchet
principle, the companions change; bosses and shipped player formulas stay as they are.

## 1. Problem

With Water fixed, the Conjurer still paid under the cost floor at all five T3 bosses (HP spent per
win on the cheapest option; floor 35%, finale 45%):

| Pact | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|
| Fire | 35 | 36 | 34 | 33 | 42 |
| Earth | 33 | 35 | 33 | 32 | 34 |
| Wind | 33 | 32 | 32 | 31 | 36 |

- **Earth:** the Golem's Taunt moved every boss basic attack off the hero entirely.
- **Fire and Wind:** their companion damage ended fights in 2–4 rounds.

## 2. Design

| # | Change | Where | Value | Tag |
|---|---|---|---|---|
| C1 | All companion damage scaled down: basic attacks, Water's chip, Fire's Burn, and the `requiresCompanion` command damage (Conflagration) | `BALANCE.COMPANION_DAMAGE_MULT`; `js/core/companion.js` `dealDamageToMonster` + Burn; `js/core/battle.js` `useTech` | **0.85** | [invented][sim-gated], user-directed |
| C2 | Taunt **splits** a monster basic attack. The companion takes a share, and the hero takes the rest through the normal hit path (dodge, armor, Bracing). | `BALANCE.COMPANION_TAUNT_SHARE`; `js/core/battle.js` `monsterAct` | **0.5** | [invented][sim-gated], user-directed |
| C3 | Fire's **Burn scales with Intelligence**, like Ember Lash. The raw `round(3 + 0.4·L)` goes through `techEffectivePower` × C1 when applied; Fear still applies per tick. | `js/core/companion.js` `act()` | — | [invented][sim-gated], user-directed |
| C4 | **Ember Lash** lowered to offset C3 | `js/data/companions.js` `comp_fire` | `6 + 0.7·L` → **`1.5 + 0.175·L`** (×0.25) | [invented][sim-gated], user-set (D2) |
| C5 | **Gale Slash** lowered; with C1 it hits for half its old damage | `js/data/companions.js` `comp_wind` | `8 + 1.1·L` → **`4.7 + 0.65·L`** (×0.59 × 0.85 ≈ ×0.5) | [invented][sim-gated], user-directed (D1) |

Fire's damage per L80 boss fight after the change, on the Conflagration-first play: Ember Lash 197,
Burn ticks 559, Burn detonation 421, Conflagration 1,374. The Burn is now Fire's main source of
companion damage, as the Salamander's "patient arsonist" description suggests.

Player-facing texts updated: Bind Golem, Bulwark, Pact of Stone and the Golem's own description
now say it takes half of each blow (`js/data/techs.js`, `js/data/classes.js`,
`js/data/companions.js`). Fire and Wind texts still fit.

No save impact, no new ids or icons.

## 3. Sim gate

**Method.** Real game code in node `vm`, seeded mulberry32, `tests/boss_fixture.js` `techs` policy
(`docs/SPEC-BOSS-SIM-TECHS.md` §2), 300 trials per boss cell; regulars 100 trials. Options were
first simmed as in-memory patches, then re-checked on the implemented code. Scripts are in the
session scratchpad (ephemeral).

### 3.1 What was tried

| Variant | Fire | Earth | Wind | Conjurer cells failing (of 5) |
|---|---|---|---|---|
| Before | 35/36/34/33/42 | 33/35/33/32/34 | 33/32/32/31/36 | 5 |
| C1 only | 37/39/36/36/45 | 34/36/35/34/37 | 37/37/36/35/39 | 4 |
| C2 only (share 50%) | unchanged | 40/43/39/39/43 | unchanged | 5 |
| C1 + C2 (share 25/50/75%) | as C1 | 46–48 at 25%; 42/44/42/41/46 at 50%; fails L100 at 75% | as C1 | 2 (Wind L90, L100) |

**Wind's lever.** Weakening Tailwind made Wind *more* expensive, because fights got longer. A Wind
Conjurer who never casts Tailwind had the cheapest fights of all (30–39%). So Tailwind can't be the
fix: a player can skip it. Cutting Gale Slash further worked: at ×0.6 total it passed thinly, and at
**×0.5** with 3–5 points to spare, with or without Tailwind.

**Fire with an Int-scaled Burn.** On the default policy, C3 alone made Fire cheaper (33–39%).
Ember Lash was then swept. The default policy ranks techs only by their opening hit, so it never
casts Conflagration, whose detonation of the Int-scaled Burn is now large. So a
**Conflagration-first** play was simmed too, and Fire is judged on the cheaper of the two:

| Ember Lash | Cheapest L60/70/80/90/100 (either play) | Fails |
|---|---|---|
| ×1 | 33.5 / 33.4 / 31.6 / 30.2 / 38.2 | 5 |
| ×0.65 | 36.9 / 37.1 / 36.9 / 35.6 / 42.1 | 1 |
| ×0.5 | 37.8 / 38.2 / 38.4 / 38.6 / 43.5 | 1 |
| ×0.35 | 38.2 / 39.3 / 39.3 / 40.6 / 45.8 | 0 |
| **×0.25 (chosen)** | 38.3 / 40.0 / 39.9 / 41.4 / 47.6 | 0 |

### 3.2 Result on the implemented code (no patches)

**Full grid** (936 cells, 280,800 fights): **B1 ✅, B2 ✅, B3 ✅ in all 132 boss × lineage cells.**
This is the first time with class techs and companions included. Only the 80 Conjurer `techs`-policy cells changed
against the previous grid; every other cell is identical.

Conjurer, HP spent per win on the cheapest–costliest option / lowest win %:

| Pact | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|
| Fire | 38–53 / 100 | 40–56 / 100 | 40–58 / 100 | 41–57 / 100 | 50–61 / 100 |
| Fire, Conflagration-first | 44 | 47 | 41 | 43 | 48 |
| Water | 40–50 / 100 | 43–53 / 100 | 41–56 / 100 | 42–56 / 100 | 53–65 / 100 |
| Earth | 42–55 / 100 | 44–57 / 100 | 42–57 / 100 | 41–55 / 100 | 46–56 / 100 |
| Wind | 39–47 / 100 | 40–49 / 100 | 40–49 / 100 | 42–49 / 100 | 46–54 / 100 |
| Wind, never casting Tailwind | 38 | 39 | 38 | 38 | 48 |

- **At-level regulars:** all 24 regular monsters from L61–99 still won 100% by every pact.
- **5 levels down:** unchanged (98–99% mean win). This is the accepted Fear limitation past L50,
  which every prepared T3 build already has (`docs/SPEC-WATER-PACT-COST.md` §3.2).
- **Tightest cells:** Earth at the finale 45.7% and Wind at the finale 46.3%, each against 45%.

## 4. Decisions

| # | Decision | Resolution |
|---|---|---|
| D0 | Levers for the remaining pacts | **User, 2026-10-28:** all companion damage −15% (C1) and a partial taunt (C2). Simmed at 25/50/75%; the package uses 50% |
| D1 | Wind: Tailwind or Gale Slash | **User:** Gale Slash at ×0.5 total ("as recommended"), since Tailwind can be skipped (§3.1) |
| D2 | Fire: Burn scales with Int, Ember Lash lowered to compensate | **User:** Burn Int-scaled (C3); Ember Lash ×0.25 (C4), chosen over ×0.35 for more finale margin |
| D3 | Package scope | **User:** include C1 and C2 with the Fire and Wind changes |

## 5. Tests

- `tests/test_companion.js` Test 6: while taunted, the hero takes part of the basic attack (116 vs
  236 untaunted in the stubbed case) and the Golem takes its share. Test 8: the hero survives its
  half of the 999,999 test hit, so the dispersal path is still exercised.
- `tests/test_p6_classes.js`: the same two cases in the class suite (F, H).
- `tests/test_v18_engine.js`: the Spell-Power-buffed companion tick includes
  `COMPANION_DAMAGE_MULT`.
- `tests/test_companion.js` Test 14 still asserts B2 for Water. The other pacts now pass in the
  grid, but stay logged rather than asserted in the 30-trial in-repo cell.
- All 15 suites pass.

## 6. Follow-ups

| # | Item |
|---|---|
| P1 | The boss-sim `techs` policy ranks damage techs by their opening hit only, and casts any buff that isn't running. That misjudged Conflagration (its detonation needs a Burn up) and Tailwind (skipping it is cheaper). Fire and Wind were checked by hand on both plays here. The fixture should rank by whole-fight value, so later grids catch this automatically. |
| P2 | Companion HP lost isn't counted as a boss cost. It carries between fights until the companion is re-bound (`docs/SPEC-BOSS-SIM-TECHS.md` §2). |

## Changelog draft (for the release that ships this)

> **Companions retuned for boss fights.** Conjurer companions hit a little softer. The Granite Golem
> now takes half of each blow while the foe is fixed on it, rather than all of it. The Ember
> Salamander's Burn now grows with your Intelligence, while its Ember Lash hits lighter — let the
> fire do the work. The Gale Sylph's Gale Slash hits for about half as much as before.
