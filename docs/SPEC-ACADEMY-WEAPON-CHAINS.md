# SPEC — Academy weapon chains: a monotonic re-taper, multipliers after armor, and Fear on armor pierce

**Status:** READY — D0–D7 resolved by the user 2026-10-28 (§5; D4 and D6 differ from the first
draft's recommendations). Not implemented. Authored 2026-10-28 on
branch `v1.11-hero-tree` (user-directed: "start that spec", follow-up F1 of
`docs/SPEC-BOSS-SIM-FULL-KIT.md`). Screening sims run (§3, 150 trials); the implementation gate
(300 trials, full 12-lineage grid) is owed after the decisions.

**Relationship to authority:** changes combat math in `docs/DESIGN.md` §4 (weapon techniques,
Fear) and the data of six Academy chains in `js/data/techs.js`. No [revised] tag: the weapon-tech
multiplier and armor pierce are [invented] (Feature C, `docs/FEATURE-SPEC-ABC.md`); Fear exists
[archived: reference/manual/Fear.md] but the archive says nothing about armor pierce. Closes or
decides:

| Item | Source | Here |
|---|---|---|
| F1: melee Academy weapon chains under the boss floor (31 cells) | `docs/SPEC-BOSS-SIM-FULL-KIT.md` §8 | §2.2–2.3 |
| F3: twinblade Crosscut at L90–L100 (3 cells) | `docs/SPEC-BOSS-SIM-FULL-KIT.md` §8 | §2.2 |
| F2: Academy rank-I weapon techs open the L10 5-down cell | `docs/SPEC-MELEE-CLASS-TECHS.md` §6 | §2.3–2.4 |
| M2 [deferred]: ranks 6–9 of the weapon chains strictly dominated by rank 5 | `docs/REVIEW-2026-07-11.md` | §2.2 |
| Fixture: the kit slots the *highest* rank, not the strongest | found here | §2.1 |

**Interpretation of the request (D0, confirmed by the user):** fix the boss-cost failures caused by the
Academy *weapon* chains (Cleave, Vital Strike, Impale, Flurry, Crosscut, Channeled Strike) and
the L10 5-levels-down hole they open, in one package, by changing the tools rather than the
bosses (the ratchet principle). Out of scope: the spell chains' identical rank-6 dip (Firebolt,
Starspark, Tidal Lance, Shadowlash, Lifetap), and the Conjurer cells (F2 of the full-kit spec).

---

## 1. Problem

**1.1 The chains are tuned above every other melee tool.** Ranks I–V of the Academy weapon chains
run ×1.3–2.9 of weapon damage. `docs/SPEC-MELEE-CLASS-TECHS.md` D1 deliberately put the class
weapon techs at ×1.3 / 1.5 / 1.7, because the "Academy band" (×1.5–2.6) failed the boss floor in
59 of 88 melee cells. The Academy chains themselves were never brought into line.

**1.2 Ranks VI–IX are weaker than rank V.** The 0.55 taper was applied to ranks 6–9 only, so Cleave
V is ×2.9 and Cleave VI is ×1.76 (`docs/REVIEW-2026-07-11.md` M2, deferred since 2026-07-11). A
player who reaches skill 40 should keep Cleave V forever and never buy ranks VI–IX.

**1.3 The full-kit grid understated the problem.** The fixture slots each chain's *highest* rank,
so from L80 it used Cleave VI. Slotting the *strongest* rank (§3, C0) takes the melee failures
from 31 to **49 of 88**, now including every warrior and twinblade line at L80, L90 and L100.

**1.4 The L10 5-down hole.** Weapon-tech damage is `weapon damage × powerMult × Fear`, and armor
is subtracted *after* the multiplier (`js/core/battle.js`, useTech weapon branch). Five levels
down, Fear cuts a basic hit to about the monster's armor, so it does ~1 damage; ×1.3–1.5 lifts it
clear of the armor. Vital Strike's 50% armor pierce makes it worse. With the kit, a prepared L10
hero beats a monster five levels up 95% (Paladin, Gambit), 72% (Ranger) or 45% (Dragoon) of the
time. The contract says certain death.

## 2. Design

### 2.1 Fixture fix (test tooling)

- `tests/boss_fixture.js` `opts.kit`: for each chain, slot the rank with the highest `powerMult`
  (or `power`), ties to the higher rank — what a player keeps. Today it slots the highest rank.
  This only touches the `kit` build, so `basic` and `techs` stay identical. After §2.2 the six
  weapon chains are monotonic, so for them it picks the highest rank anyway; it still matters for
  the spell and buff chains the kit learns.
- **Not here (D6):** the caster basic action still casts the highest affordable Firebolt rank, so
  from L80 it casts Firebolt VI (51) over V (74). That fix goes with the spell chains' own rank-6
  dip in a separate spec (§6).

### 2.2 Monotonic re-taper of the six chains (C2) — `js/data/techs.js`

Each chain becomes a straight line from today's rank I to a new peak at its last rank. The peak is
**0.85 × today's rank V** (rank IV for the 4-rank chains) — D1. Energy costs, skill requirements,
Training Point costs and armor pierce are unchanged. All values [invented], sim-gated (§3):

| Chain | I | II | III | IV | V | VI | VII | VIII | IX |
|---|---|---|---|---|---|---|---|---|---|
| Cleave | 1.5 → **1.5** | 1.9 → **1.62** | 2.3 → **1.74** | 2.6 → **1.86** | 2.9 → **1.98** | 1.76 → **2.1** | 1.93 → **2.22** | 2.09 → **2.34** | 2.26 → **2.47** |
| Vital Strike | 1.3 → **1.3** | 1.7 → **1.41** | 2 → **1.53** | 2.3 → **1.64** | 2.6 → **1.76** | 1.6 → **1.87** | 1.76 → **1.98** | 1.93 → **2.1** | 2.09 → **2.21** |
| Impale | 1.4 → **1.4** | 1.8 → **1.52** | 2.2 → **1.65** | 2.5 → **1.77** | 2.8 → **1.89** | 1.71 → **2.01** | 1.87 → **2.13** | 2.04 → **2.26** | 2.2 → **2.38** |
| Flurry (2 hits) | 0.9 → **0.9** | 1.1 → **0.96** | 1.3 → **1.02** | 1.45 → **1.07** | 1.6 → **1.13** | 0.96 → **1.19** | 1.05 → **1.25** | 1.13 → **1.3** | 1.21 → **1.36** |
| Crosscut | 1.2 → **1.2** | 1.5 → **1.4** | 1.8 → **1.59** | 2.1 → **1.79** | — | — | — | — | — |
| Channeled Strike | 1.3 → **1.3** | 1.7 → **1.52** | 2 → **1.74** | 2.3 → **1.95** | — | — | — | — | — |

Every rank now beats the one before it, so ranks VI–IX are worth their Training Points (M2). Mid
ranks drop most (Cleave V −32%); the top ranks rise (Cleave IX +9%).

### 2.3 Weapon-tech multiplier after armor (C1) — `js/core/battle.js`

Today: `damage = round(weapon × powerMult × Fear × variance − armor)`. Proposed:
`damage = round((weapon × Fear × variance − armor) × powerMult)`, floor 1, for `weaponTech` techs
only. A tech multiplies what the hero's swing gets *through* armor, so when Fear has cut the
swing to the monster's armor, the tech can't rescue it. Against a lightly armored target the
change is small; against heavy armor it costs `(powerMult − 1) × armor` per hit. [invented]

**It also applies to the 16 class weapon techs** (Crushing Blow, Frenzy, Smite, the Legendary
weapon twins …), which `docs/SPEC-MELEE-CLASS-TECHS.md` tuned with the old formula — D2.

### 2.4 Fear scales a tech's armor pierce (C3) — `js/core/battle.js`

A weapon tech's armor pierce (`armorPierce` plus the Armor Penetration stat) is multiplied by the
Fear multiplier. Five levels down, a frightened hero can't find the gaps. Without this, Vital
Strike's 50% pierce keeps the Gambit's L10 5-down win at 85% even with C1. The Armor Penetration
stat alone is already suppressed at 5+ levels down (`docs/SPEC-SECONDARY-STATS.md` D8); this
extends the same idea to a tech's own pierce. [invented]

### 2.5 Player-facing

Players who learned Cleave V, Impale V or Vital Strike V will see them hit about a third softer;
ranks VI–IX become the upgrades their names promise. No save change: `powerMult` is data, read
live. Changelog draft: "Weapon techniques have been rebalanced: every rank of Cleave, Impale,
Vital Strike, Flurry, Crosscut and Channeled Strike now hits harder than the one before it, so
the advanced ranks are worth learning. The middle ranks hit a little softer, and techniques no
longer punch through armor when you're fighting far above your level."

## 3. Sim gate (screening run 2026-10-28)

**Method.** Real game code in node `vm`, patched in memory per option (scratch scripts, nothing in
the repo changed). Full-kit fixture with the §2.1 strongest-rank fix; seeded, **150 trials per
cell**. Boss grid: 11 bosses × the 8 melee lineages × every class option × `basic`/`techs`/`kit`,
judged as in `docs/SPEC-BOSS-SIM-FULL-KIT.md` §3. Regular checks: Paladin, Gambit, Dragoon and
Ranger with the kit at L10/29/46/64/91, against an at-level regular and one five levels up.

| Option | Melee boss cells failing B2 (of 88) | Where they fail | L10 5-down win % (Pal / Gam / Drag / Rng) |
|---|---|---|---|
| C0: today (strongest rank slotted) | **49** | L10, L32, L40, L60–L100 | 95 / 95 / 45 / 72 |
| C1: multiplier after armor | 29 | L10 twinblades, L40 twinblades, L60–L100 | 22 / 85 / 0 / 0 |
| C2: re-taper, peak 1.0 × rank V | 17 | L10, L80–L100 | 95 / 95 / 45 / 72 |
| C1 + C2 | 8 | L10 twinblades, finale | 22 / 85 / 0 / 0 |
| C1 + C2 + C3 | 8 | L10 twinblades (34%), finale (39–42%) | 22 / **23** / 0 / 0 |
| C1 + C2 + C3, peak 0.9 | 6 | L10 twinblades (34%), finale (42–45%) | 22 / 23 / 0 / 0 |
| **C1 + C2 + C3, peak 0.85 (proposed)** | **≤ 3** | L10 twinblades (34%); finale: Assassin 44% only | 22 / 23 / 0 / 0 |

(The 0.85 row re-ran the finale only; the peak doesn't touch rank I, so L10 is the 0.9 row.)

- **At-level regulars: 100% win** for all four lineages at every level, under every option.
- **B1 and B3 hold** in every option: every melee boss cell wins 99–100%, and none spends more than
  half its consumables.
- **5-down from L29 up stays broken** (93–100% under every option). That is the accepted
  Fear-sustain limitation (`CLAUDE.md`, `docs/DESIGN.md` §4); this spec doesn't target it.
- **What's left at 150 trials:** Gambit/Assassin at the L10 boss (34% vs 35%) and Assassin at the
  finale (44% vs 45%), each one point short. **Accepted (D4).**

**Implementation gate (owed, 300 trials):** the full 12-lineage kit grid, because C1 and C3
also change the casters' Channeled Strike and every class weapon tech. Pass bar: B1/B3 in all 132
cells; B2 in every melee cell except the three D4 accepts (each may land up to ~2 points under);
no non-melee cell newly failing; the regular checks above unchanged or better (the L10 5-down
residue is accepted, D5). `basic` and `techs` change only through C1/C3 (the class weapon techs);
they are re-run in the grid, not compared fight-for-fight.

## 4. Conventions & handoff checklist

- [ ] `js/data/techs.js`: the §2.2 `powerMult` values, each with an `[invented]` comment citing this
  spec (replacing the "pre-tapered ×0.55" comments).
- [ ] `js/core/battle.js` useTech weapon branch: multiplier after armor (C1), Fear on pierce (C3).
- [ ] `tests/boss_fixture.js`: strongest-rank slotting in the `kit` build (§2.1). Not the Firebolt
  ordering (D6).
- [ ] Tests: weapon-tech damage expectations in `tests/test_p3_battle.js` / `test_v18_engine.js` that
  hard-code the old formula or values are stale constants — update them, never weaken. New
  stubbed-RNG tests: (a) a ×2 weapon tech against armor A deals `2 × (hit − A)`; (b) five levels
  down, a weapon tech's pierce is scaled by Fear; (c) every rank of the six chains is strictly
  stronger than the rank before.
- [ ] Wiki / tech info box: they read `powerMult` live — check the "×N" text still renders.
- [ ] Save impact: none. Icons, ids, drop tables: none.
- [ ] Changelog entry (§2.5) in the release that ships this.
- [ ] All 16 suites green.

## 5. Decisions

All resolved by the user on 2026-10-28.

| # | Question | Decision |
|---|---|---|
| **D0** | Scope: the six Academy weapon chains + the L10 5-down hole + the fixture fix, tuning tools not bosses | **Agreed** (as recommended). The spell chains' rank-6 dip and the Conjurer cells are separate follow-ups |
| **D1** | Re-taper peak: 1.0, 0.9 or 0.85 × today's rank V | **0.85** (as recommended). Closest at the finale: only Assassin, 1 point short. Mid ranks land near the class-tech band (Cleave V ×1.98 vs a T3 class tech ×1.7) |
| **D2** | Multiplier after armor (C1): all weapon techs including the 16 class ones, Academy chains only, or not at all | **All weapon techs** (as recommended). One rule, and it closes the 5-down hole for every ×>1 tech. The class techs get weaker against armored bosses; the implementation gate measures it |
| **D3** | Fear scales a tech's armor pierce (C3) | **Yes** (as recommended). Closes the twinblades' L10 5-down hole (85% → 23%) |
| **D4** | Cells one point short at 150 trials: twinblades at the L10 boss (34%), Assassin at the finale (44%) | **Accepted now** (the first draft recommended re-checking at 300 trials and tuning Vital Strike I). They stay accepted whatever the 300-trial gate shows, as long as they stay near the floor (§3) |
| **D5** | L10 5-down after the fix: Paladin and Gambit still win 22–23% (contract: certain death; today 95%) | **Accept and record** (as recommended), like `docs/SPEC-MELEE-CLASS-TECHS.md` D7 accepted 69% for Crushing Blow |
| **D6** | Fixture: also make the caster basic action pick Firebolt by power | **Separate follow-up** (the first draft recommended doing it here). It goes with the spell chains' rank-6 dip (§6) |
| **D7** | Players' already-learned Cleave V / Impale V / Vital Strike V hit ~⅓ softer | **Changelog note only** (as recommended, §2.5). No refund, no save change |

## 6. Out of scope

- The spell chains' rank-6 dip (Firebolt, Starspark, Tidal Lance, Shadowlash, Lifetap) — same
  M2 problem, separate spec; casters pass the boss floor today. That spec also takes the fixture's
  Firebolt ordering (D6): the caster basic action should cast the strongest affordable rank.
- Conjurer + Attunement + Heir (`docs/SPEC-BOSS-SIM-FULL-KIT.md` F2).
- 5-levels-down from L29 up (accepted limitation).
- Boss stats, the boss contract, the class weapon techs' own `powerMult` values.
