# SPEC — Spell chains that keep rising, and monster Armor against hero spells

**Status:** IMPLEMENTED on branch `v1.11-hero-tree`; not yet merged to `main`, released or deployed.
D0–D6 resolved by the user 2026-10-29, all as recommended (§5). **Implementation gate run 2026-10-29
(§8): passes** — casters at L10 five levels up 96% → 0%, no boss cell newly failing; the L10 boss
for Firebolt-only casters drops to 12% (§8.1, follow-up). Test 103 moved to L50 (§7, user). Authored 2026-10-29 on
branch `v1.11-hero-tree` (user-directed: "start on the follow-ups", F1 and F2 of
`docs/SPEC-ACADEMY-WEAPON-CHAINS.md` §9; the user then asked why enemy Armor doesn't apply against
magic damage, which became option S6). Screening sims run (§3, 150 trials); the implementation
gate (300 trials, full 12-lineage grid) is owed after the decisions.

**Relationship to authority:** changes `docs/DESIGN.md` §4 (spell mitigation) and the data of five
Academy spell chains in `js/data/techs.js`. Fear stays exactly as archived (10% per level,
including spell damage, not healing) [archived: reference/manual/Fear.md,
reference/manual/Recent_Updates.md 2007-04-06]. The archived rule that non-elemental damage ignores
defense (`docs/DESIGN.md` §4) is kept: S6 touches graded (elemental) spells only. No [revised] tag.
Closes or decides:

| Item | Source | Here |
|---|---|---|
| F1: the spell chains' rank-6 dip | `docs/SPEC-ACADEMY-WEAPON-CHAINS.md` §9; `docs/REVIEW-2026-07-11.md` M2 | §2.1 |
| D6 there: the fixture casts the highest Firebolt rank, not the strongest | `docs/SPEC-ACADEMY-WEAPON-CHAINS.md` §5 | §2.3 |
| F2: casters win 96% at L10, five levels up | `docs/SPEC-ACADEMY-WEAPON-CHAINS.md` §8 | §2.2 |
| "Why doesn't enemy Armor apply against magic damage?" (user, 2026-10-29) | v1.12 `docs/SPEC-MONSTER-TECH-POWER.md` §2.3 | §1.2, §2.2 |

**Interpretation of the request (D0, confirmed by the user):** finish the M2 cleanup for the five Academy spell
chains, and close the casters' L10 five-levels-down hole, without changing Fear itself or making
casters fare worse than melee at any level. The Conjurer cells (F3) stay separate.

---

## 1. Problem

**1.1 Ranks VI–IX are weaker than rank V.** The same 0.55 taper as the weapon chains: Firebolt V is
power 74, Firebolt VI 51; ranks VI–VIII never beat rank V, and rank IX (84) barely does
(`docs/REVIEW-2026-07-11.md` M2). The boss fixture's caster basic action casts the *highest*
affordable Firebolt, so every boss grid so far gave L80+ casters Firebolt VI. (Measured here: it
changes no verdict — casters' cheapest boss options use other techs.)

**1.2 Monster Armor never applies to hero spells.** v1.12 made the hero's Armor, shields and Bracing
count at half against *monster* magic (`js/core/battle.js` monster hit: Magic Armor + 0.5 × Armor,
`BALANCE.TECH_PHYSICAL_DEFENSE_SHARE`). The other direction was never changed: a hero's graded
spell meets only the monster's Magic Armor (`js/core/battle.js` useTech, `mitigation = tech.grade ?
monster.magicArmor : 0`). The v1.12 spec was about monster techs, so this is a gap, not a decision.

**1.3 Why it breaks five-levels-down for casters.** Fear halves a spell five levels down, but
almost nothing subtracts from the rest, while a feared weapon hit is eaten by Armor
(`docs/SPEC-ACADEMY-WEAPON-CHAINS.md` §1.4). With the full kit, an L10 Magus beats a monster five
levels up **96%** of the time (Tidal Lance I); plain Firebolt alone wins 13%. Melee is at 0–24%.

## 2. Design

### 2.1 Spell chains keep rising (SP-A) — `js/data/techs.js`

Ranks I–V keep their power. Ranks VI–IX continue upward from rank V at **half the average rank
I–V step**. Energy, skill requirements, Training Points and grades are unchanged. [invented],
sim-gated (§3):

| Chain | I | II | III | IV | V | VI | VII | VIII | IX |
|---|---|---|---|---|---|---|---|---|---|
| Firebolt | 14 | 26 | 40 | 56 | 74 | 51 → **82** | 62 → **89** | 73 → **97** | 84 → **104** |
| Starspark | 16 | 28 | 42 | 58 | 76 | 52 → **84** | 63 → **91** | 74 → **99** | 85 → **106** |
| Tidal Lance | 15 | 27 | 41 | 57 | 75 | 51 → **83** | 62 → **90** | 73 → **98** | 84 → **105** |
| Shadowlash | 15 | 27 | 42 | 58 | 76 | 52 → **84** | 63 → **91** | 74 → **99** | 85 → **107** |
| Lifetap (drain) | 12 | 22 | 34 | 48 | 64 | 45 → **71** | 55 → **77** | 65 → **84** | 75 → **90** |

Unlike the weapon chains, casters pass the boss floor everywhere (§3), so mid ranks don't need to
drop; only the dip is removed. The alternative SP-B (one straight line from rank I to today's rank
V at rank IX, like the weapon re-taper) is D1.

### 2.2 Half monster Armor against graded hero spells (S6) — `js/core/battle.js`

A graded (elemental) hero spell is mitigated by the monster's **Magic Armor + 0.5 × Armor**
(`BALANCE.TECH_PHYSICAL_DEFENSE_SHARE`) — the same rule v1.12 gave the hero against monster magic.
Ungraded spells keep ignoring defense (archived). It covers every damage/drain spell that isn't a
weapon tech: the five Academy chains, Stoneshear, Censure, the class spells (Anima Surge, Arcane
Cataclysm, Anima Reckoning, Runic Severance, Echoing Judgment) and companion commands
(Conflagration). Vaultbreaker's Reckoning is ungraded and unchanged. Monster Armor is not scaled by
Fear (it's the monster's stat). [invented]

Effect: five levels down, the feared spell meets half of a monster's Armor and mostly bounces, as a
weapon hit does. At level, it's a small tax: monster Armor is about its level, so half of it is a
few points per cast.

### 2.3 Fixture (test tooling) — `tests/boss_fixture.js`

The caster basic action casts the affordable Firebolt with the highest `power` (ties to the higher
rank). After §2.1 that is always the highest rank anyway; the change makes the fixture right for any
future dip. It changes `basic`/`techs` caster results only where the old order picked a weaker rank.

### 2.4 Player-facing

Changelog draft: "Advanced spell ranks are now worth learning: Firebolt, Starspark, Tidal Lance,
Shadowlash and Lifetap ranks VI–IX each hit harder than the rank before. And just as your armor
blunts enemy magic, a monster's armor now blunts your elemental spells at half strength — so a
spell cast in fear against a much stronger foe no longer slips past its guard."

## 3. Sim gate (screening run 2026-10-29)

**Method.** Real game code in node `vm`, patched in memory per option (scratch scripts; the repo's
game code unchanged). Full-kit fixture with the §2.3 Firebolt fix; seeded, **150 trials per cell**.
Boss grid: 11 bosses × the four caster lineages (Magus, Conjurer, Cleric, Seer) × every class
option × `basic`/`techs`/`kit`, judged as in `docs/SPEC-BOSS-SIM-FULL-KIT.md` §3. Regular checks:
Magus, Cleric, Seer, Paladin, Gambit, `basic` and `kit`, at-level and five levels up, at
L10/29/46/64/91.

| Option | Caster boss cells failing B2 | Casters at L10, five levels up (win %, basic / kit) | Casters five levels up, L29–L91 (kit) | L10 boss, casters (HP spent / weakest win %) |
|---|---|---|---|---|
| K0: today + Firebolt fix | 5 (Conjurer) | 13 / 96 | 99–100 | 61 / 98 |
| SP-A: ranks VI–IX keep rising | 5 | 13 / 96 | 99–100 | 61 / 98 (finale 70 → 62) |
| SP-B: straight line I → IX | 5 | 13 / 96 | 95–100 (L29 basic 84 → 59) | 61 / 98 (L18 41 → 51, L25 46 → 67) |
| S3: damage techs fizzle 5+ levels down | — | 0 / 0 | **0** at every level | — |
| S4: Fear lowers Int in the spell hit roll | — | 1 / 66 | 98–100 | — |
| S5: spell hit chance × Fear | — | 0 / 0 | 95–100 | — |
| **S6: half monster Armor vs graded spells** | **5** | **0 / 0** | 98–100 | **80 / 86** |
| S4 + S6 | 5 | 0 / 0 | 96–100 | 80 / 86 |

- **At-level regulars: 100% win** for every lineage under every option.
- **Melee is unaffected** by every option except S3 (Paladin/Gambit at L10 five levels up stay
  0 / 22–23).
- **The 5 failing boss cells are the known Conjurer + Attunement + Heir cells** in every option
  (`docs/SPEC-BOSS-SIM-FULL-KIT.md` F2, separate).
- **S3 is rejected on the numbers:** casters lose every fight five levels up at every level, while
  melee keeps 87–100% from L29 — a new, large asymmetry.
- **S6's cost is the L10 boss for casters:** HP spent 61 → 80%, and the weakest option wins 86% —
  one point over B1's 85% (D3). From L18 up, S6 moves caster boss costs by 0–4 points.

**Proposed package: SP-A + S6 + the §2.3 fixture fix.** SP-A and S6 were screened separately; SP-A
only moves ranks VI–IX (L80+), S6 matters most at L10, so the gate checks them together.

**Implementation gate (owed, 300 trials):** the full 12-lineage kit grid plus the regular checks.
Pass bar: B1/B3 in all 132 cells (the L10 caster B1 per D3); no cell newly failing B2 apart from the
known Conjurer five; casters at L10 five levels up ≤ melee's 0–24%; at-level 100%.

## 4. Conventions & handoff checklist

- [x] `js/data/techs.js`: §2.1 `power` values on ranks VI–IX of the five chains, each `[invented]`
  citing this spec (replacing the "pre-tapered ×0.55" comments).
- [x] `js/core/battle.js` useTech spell branch: graded mitigation = Magic Armor +
  `TECH_PHYSICAL_DEFENSE_SHARE` × Armor (S6); comment citing §2.2 and the v1.12 mirror.
- [x] `tests/boss_fixture.js`: Firebolt by power (§2.3).
- [x] Tests: stale constants only (spell damage expectations that assumed Magic Armor alone, the old
  rank VI–IX powers) — update, never weaken. New stubbed-RNG tests: (a) a graded hero spell against
  a monster with Armor A and Magic Armor M loses `M + 0.5 × A`; (b) an ungraded spell still loses
  nothing; (c) every rank of the five chains is stronger than the one before.
- [x] Wiki / tech info box show the new powers.
- [x] Save impact: none. Icons, ids, drop tables: none.
- [ ] Changelog entry (§2.4) in the release that ships this.
- [x] All 16 suites green.

## 5. Decisions

All resolved by the user on 2026-10-29, all as recommended.

| # | Question | Decision |
|---|---|---|
| **D0** | Scope: the five spell chains + the casters' L10 five-down hole + the fixture fix; Fear itself unchanged; Conjurer separate | **Agreed** |
| **D1** | Spell re-taper: SP-A (ranks I–V unchanged, VI–IX keep rising at half step), SP-B (straight line), or leave the dip | **SP-A.** Casters pass the boss floor everywhere, so mid ranks don't need to drop; only the dip goes (finale 70 → 62% HP spent, above 45%) |
| **D2** | Five-levels-down fix for casters: S6, S4, S5, S3 or none | **S6: half monster Armor against graded hero spells**, the mirror of the v1.12 rule. Closes L10 fully (96 → 0%) and leaves casters where melee is at higher levels |
| **D3** | If the L10 boss's weakest caster option wins under 85% at 300 trials | **Tune that one boss** (e.g. lower `estari_ruin_warden`'s Magic Armor, today 12) to the value the gate needs; S6 stays as specified |
| **D4** | Ungraded spells keep ignoring all defense | **Keep** (archived). Only Vaultbreaker's Reckoning is ungraded today |
| **D5** | Companion command spells (Conflagration) also meet half Armor | **Yes**, one rule for every graded spell |
| **D6** | Player-facing change | **Changelog line in §2.4.** No save change |

## 6. Out of scope

- Fear's archived 10%-per-level rule, and five-levels-down from L29 up (the accepted Fear-sustain
  limitation; S6 doesn't move it).
- The Conjurer + Attunement + Heir boss cells (`docs/SPEC-BOSS-SIM-FULL-KIT.md` F2).
- Monster magic against the hero (v1.12, unchanged).
- The class spells' own power values.

## 7. Implementation (2026-10-29)

- `js/data/techs.js`: the §2.1 powers on ranks VI–IX of the five spell chains, each citing this spec.
- `js/core/battle.js` useTech spell branch: a graded hero spell is mitigated by Magic Armor +
  `TECH_PHYSICAL_DEFENSE_SHARE` × Armor (S6). Weapon techs, `attack()`, Limit Breaks and monster
  techs are unchanged. **Not changed (outside this spec):** the companion's own automatic attacks
  (`js/core/companion.js` `dealDamageToMonster`, e.g. Ember Lash) still subtract Magic Armor only;
  companion *command* spells (Conflagration) go through useTech and follow the new rule (D5).
- `tests/boss_fixture.js`: the caster basic action casts the strongest affordable Firebolt (§2.3).
- `tests/test_p3_battle.js`:
  - Tests 9 and 25 (graded spell vs Magic Armor) updated as stale constants to the new mitigation
    (12 → 11 damage), same assertions.
  - New Test 109: a graded spell loses Magic Armor + ½ Armor, an ungraded spell loses nothing, and
    every rank of the five chains beats the one before.
  - **Test 103 moved from the L90 boss to the L50 boss** (user, 2026-10-29). Once the fixture casts
    the strongest Firebolt, a T3 Magus never finds a class spell that out-damages it, so the
    `techs` policy cast none at L90 and the "actually casts class techs" assertion failed. At L50
    the Wizard-tier Magus still casts Arcane Cataclysm (≈ 6 casts per win, 100% win, 86–93% HP
    spent). See finding 8.3.
- All 16 suites pass.

## 8. Implementation gate results (run 2026-10-29 on the implemented code)

**Method** as `docs/SPEC-BOSS-SIM-FULL-KIT.md` §3: real game code, unpatched; seeded, **300 trials
per cell**; 1,404 cells (11 bosses × 12 lineages × every class option × `basic`/`techs`/`kit`).
Regular checks: Paladin, Gambit, Dragoon, Ranger, Magus, Cleric and Seer with the kit, at-level and
five levels up, at L10/29/46/64/91.

**Verdict: passes the §3 bar.** B1 ✅ 132/132, B3 ✅ 132/132, B2 ❌ 8/132 — exactly the 8 that failed
before this spec (the 3 melee cells `docs/SPEC-ACADEMY-WEAPON-CHAINS.md` D4 accepted, and the 5
Conjurer cells, `docs/SPEC-BOSS-SIM-FULL-KIT.md` F2). No cell newly fails.

| Boss | SK | Bers | Pal | Ward | Magus | Conj | Cleric | Seer | Gambit | Assn | Ranger | Drag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| L10 | 36/100 | 36/100 | 36/100 | 36/100 | 81/**87** | 81/**87** | 81/**87** | 81/**87** | **x34**/100 | **x34**/100 | 39/100 | 45/100 |
| L18 | 52/100 | 52/100 | 52/100 | 52/100 | 46/100 | 46/100 | 46/100 | 46/100 | 55/100 | 55/100 | 56/100 | 54/100 |
| L25 | 61/100 | 61/100 | 61/100 | 61/100 | 51/100 | 51/100 | 51/100 | 51/100 | 66/100 | 66/100 | 69/100 | 67/100 |
| L32 | 52/100 | 52/100 | 51/100 | 51/100 | 46/100 | 46/100 | 41/100 | 41/100 | 48/100 | 48/100 | 58/100 | 56/100 |
| L40 | 51/100 | 51/100 | 49/100 | 49/100 | 59/100 | 59/100 | 55/100 | 55/100 | 45/100 | 45/100 | 60/100 | 61/100 |
| L50 | 62/100 | 62/100 | 58/100 | 58/100 | 43/100 | 43/100 | 41/100 | 41/100 | 56/100 | 56/100 | 81/99 | 83/99 |
| L60 | 47/100 | 49/100 | 47/100 | 45/100 | 42/100 | **x32**/100 | 38/100 | 42/100 | 47/100 | 45/100 | 62/100 | 64/100 |
| L70 | 48/100 | 49/100 | 49/100 | 47/100 | 47/100 | **x34**/100 | 44/100 | 47/100 | 51/100 | 48/100 | 65/100 | 67/100 |
| L80 | 43/100 | 44/100 | 42/100 | 41/100 | 45/100 | **x33**/100 | 42/100 | 45/100 | 43/100 | 41/100 | 57/100 | 61/100 |
| L90 | 45/100 | 46/100 | 44/100 | 42/100 | 47/100 | **x27**/100 | 44/100 | 47/100 | 45/100 | 42/100 | 60/100 | 65/100 |
| L100 | 48/100 | 48/100 | 49/100 | 48/100 | 65/100 | **x28**/100 | 62/100 | 66/100 | 47/100 | **x43**/100 | 67/100 | 68/100 |

**Regular checks (win %, kit):**

| Level | At-level (Pal / Gam / Drag / Rng / Magus / Cleric / Seer) | Five levels up (same order) |
|---|---|---|
| L10 | 100 for all seven | 24 / 24 / 0 / 0 / **0 / 0 / 0** (casters were 96) |
| L29 | 100 for all seven | 99 / 99 / 97 / 96 / 99 / 99 / 99 |
| L46 | 100 for all seven | 100 / 100 / 100 / 99 / 100 / 100 / 100 |
| L64 | 100 for all seven | 100 / 93 / 98 / 95 / 99 / 100 / 100 |
| L91 | 100 for all seven | 100 / 97 / 99 / 98 / 98 / 100 / 100 |

### 8.1 The L10 boss for casters (D3)

The weakest caster option wins **87%** on the player's best policy, so D3's trigger (below 85%)
didn't fire and the boss is unchanged. But the per-policy picture moved a lot:

| Caster at `estari_ruin_warden` (Armor 12, Magic Armor 12) | Before | After |
|---|---|---|
| Firebolt only (`basic`) | 90% win, 80% HP spent | **12%** win, 108% |
| + class spells (`techs`) | 99%, 61% | 77%, 84% |
| + Academy kit (`kit`) | 99%, 61% | 87%, 81% |

A caster who hasn't trained a second spell chain by L10 now mostly loses this boss: half its Armor
(6) comes off every low-rank Firebolt. The contract judges the prepared hero, so this passes; it is
recorded as follow-up F1 below for a decision.

### 8.2 Spell ranks VI–IX

Every chain now rises rank by rank. At the finale casters' cheapest option costs 62–66% HP (was
67–72%), well above 45%.

### 8.3 T3 Magus class spells fall behind (found by Test 103)

With the fixture casting the strongest Firebolt, a Magus at L60–L100 never casts a class damage
spell: Anima Reckoning (flat 84) and Arcane Cataclysm (flat 70) never out-damage Firebolt V–VII
(74–89) on the opening probe. Measured on the previous commit too: at L60–L70 this was already
true; at L80–L90 the Magus only "cast" before because the old fixture used the weak Firebolt VI (51).
So the T3 Magus's class damage spells are dead weight from L60 — older than this spec, made visible
by it. Follow-up F2.

## 9. Follow-ups

| # | Item | Notes |
|---|---|---|
| F1 | Casters at the L10 boss without a second spell chain (Firebolt only 12% win) | §8.1. Options: lower `estari_ruin_warden`'s Armor or Magic Armor, or accept (the contract judges the prepared hero) |
| F2 | Flat-power class damage spells fall behind Academy ranks from L60 (Anima Reckoning 84, Arcane Cataclysm 70, Echoing Judgment 92) | §8.3. Same shape as the melee class-tech problem `docs/SPEC-MELEE-CLASS-TECHS.md` fixed; needs its own spec and sims |
| F3 | Companion automatic attacks still ignore monster Armor | `js/core/companion.js` `dealDamageToMonster`; decide whether S6 applies to them too |
| F4 | Conjurer + Attunement + Heir (5 boss cells) | Unchanged; `docs/SPEC-BOSS-SIM-FULL-KIT.md` F2 |
