# SPEC — Rogue Boss Cost (Dexterity-driven dodge with diminishing returns + faster bosses)

**Status:** SHIPPED in v1.11.0 "The Hero Tree" (commit `b51c8fb`) together with `docs/SPEC-NONDEX-DEFENSE.md` and `docs/SPEC-CLASS-LINEAGE.md` (review re-sim of the shipped code: its §3.2). Since merged to `main` with PR 4 (`dbc83a8`) and deployed with v1.13.0 on 2026-10-28. D0–D7 resolved
by the user 2026-10-22/23 (§5). Sim gate run 2026-10-23 (§3.1). The rogue line now pays at every
boss. **Not ready to ship on its own:** the new dodge model takes most dodge away from
non-Dexterity builds, and 6 lineages fall below the boss
contract at the L100 boss (Dragoon 88→31% win). The user accepted this on the condition that a
**compensation follow-up** (D4) lands with or before it. That follow-up is
`docs/SPEC-NONDEX-DEFENSE.md` (Bracing). Ship the two together. No game code changed.
Authored 2026-10-22 as the follow-up promised by `docs/SPEC-CLASS-LINEAGE.md` D7 (option c);
dodge model by the user (2026-10-23).

**Relationship to authority:** extends `docs/DESIGN.md` §4 (Combat) and §2 (Stats). Archived rules
kept: "Who gets to attack first depends on whose dexterity is higher" `[archived:
reference/manual/New_Player_Guide.md]`, and Dexterity "Increases the possibility to Dodge"
`[archived: reference/manual/Dexterity.md]` (it still does, along a curve). The Dodge skill is an
archived skill name `[archived: reference/manual/Skills.md]`; its effect formula has always been
`[invented]`. Every number below is `[invented]`. Nothing is [revised]. Archived intent for boss
behaviour that answers the hero: "Strategic boss battles", "Intelligent reactions based on hero
actions" `[archived: reference/site/homepage_2006.md]`.

**Interpretation of the request (resolved — D0):** Rogue-line heroes (Thief → Rogue → Gambit /
Assassin) must pay against bosses: average HP left on a win ≤ 80% **or** ≥ 1 consumable per win.
That must hold for the **worst** class option the hero could be running (today's 2-slot model and
the lineage model, each with or without any Legendary unlocked at that level). No global monster
HP/damage buff (rejected in `docs/SPEC-CLASS-LINEAGE.md` §3.1). At **L32** the hero is still a
**Rogue** (Tier 3 opens at L60), so Gambit and Assassin are identical there.

---

## 1. What changes

### 1.1 Why rogues get bosses for free (diagnosis, sim-measured)

**(a) Dexterity alone puts a rogue past the 50% dodge cap from about L32 on, so the dodge passives
do nothing.** Today: dodge = 2% + 0.4% × Dex + 1% × Dodge skill + passives + shrine + buffs, capped
at `DODGE_CAP` 0.50 (`js/core/battle.js` playerDodgeChance). Pre-cap totals for the v1.10 P0
fixtures (best gear at level, all stat points spent, skills at half level):

| Level | Rogue line (Dex 3/5 of points) | Ranger (Dex 1/5) | Non-Dex lineages (Dex 5) |
|---|---|---|---|
| L32 | **0.69** (Dex 98 = +0.39, skill +0.16, passives +0.12) | 0.36 | 0.20–0.24 |
| L60 | **1.27** (Dex 182 = +0.73, skill +0.30, passives +0.12–0.22) | 0.70 | 0.34–0.44 |
| L90 | **1.78** (Dex 272 = +1.09, skill +0.45, passives +0.12–0.22) | 0.97 | 0.49–0.59 |

The rogue dodges a measured **51% of boss attacks** from L32 up (warrior and caster lines: 20% at
L32, 32% at L60). The class passives (Light Fingers, Quickstep, Gambler's Nerve) only add surplus
above the cap. Non-Dex builds reach ~50% at L90 from the **Dodge skill alone**.

**(b) Half of every boss's turns barely hurt anyone.** Bosses pick a tech 50% of the time
(`monsterAct` techChance), and boss techs have fixed power 12–26 (`mon_dark_hex` 15,
`mon_earthen_crush` 26, `js/data/techs.js`). They make up ~50% of boss actions but only 4–17% of
boss damage (15–17% at L32, 7–8% at L60, 4–6% at L90). See D7.

**(c) Rogues always strike first.** A boss's Dexterity defaults to its level (`[invented]`,
`js/core/battle.js` start()); a rogue's Dex is ≈ 3 × level. Dex-5 builds always take the boss's
opening strike. The rogue also kills fastest (4.2–6.1 rounds vs 5.3–9.7 for other melee lines).

Net effect: a rogue takes about one basic boss hit per fight.

### 1.2 Before / after

| | Today (shipped) | Proposed |
|---|---|---|
| Dodge from Dexterity | +0.4% per point, linear; 112 Dex reaches the cap alone | **Diminishing:** 30% × Dex / (Dex + 100). Never above 30%, so Dex alone can't reach the cap |
| Dodge skill | Flat +1% per skill level | **Multiplier** on Dex dodge: ×(1 + 1% per skill level) |
| Dodge passives, shrine buffs, dodge techs | Flat +N% dodge | **Multiplier** on the result: ×(1 + sum of all their %) |
| `DODGE_BASE` 2%, `DODGE_CAP` 50% | — | Unchanged (2% is still added flat at the end) |
| Boss turn order | Boss Dexterity = its level | All 11 bosses: Dexterity = 5 × level + 10 |
| Monster dodge, Accuracy, regulars' Dexterity | — | Unchanged |

---

## 2. Design detail

### 2.1 The dodge formula (user-directed model)

```
dexDodge  = DEX_DODGE_MAX × Dex / (Dex + DEX_DODGE_HALF)               // 0.30, 100
baseDodge = dexDodge × (1 + DODGE_PER_SKILL_LEVEL × DodgeSkill)        // 0.01 (existing constant, new role)
bonus     = Σ dodge_pct (class passives) + Σ shrine 'dodge' + Σ typed 'dodge' buffs
dodge     = min(DODGE_CAP, DODGE_BASE + baseDodge × (1 + bonus))
```

New constants in `js/balance.js`: `DEX_DODGE_MAX: 0.30`, `DEX_DODGE_HALF: 100` **[invented]**.
`DODGE_PER_DEX` is removed. `DODGE_PER_SKILL_LEVEL` keeps its value; its comment changes to "per-level
multiplier on Dexterity dodge". Dex 100 gives exactly half the curve (15%). At low Dex the curve
gives 0.3% per point, a little below today's 0.4%.

What it does, per fixture (dodge vs any monster, capped):

| Level | Gambit | Assassin | Ranger | Non-Dex lineages |
|---|---|---|---|---|
| L10 | 0.24 → **0.10** | 0.24 → 0.10 | 0.17 → 0.06 | 0.09 → **0.04** |
| L32 | 0.50 → **0.24** | 0.50 → 0.24 | 0.36 → 0.12 | 0.20–0.24 → **0.04** |
| L60 | 0.50 → **0.41** | 0.50 → 0.35 | 0.50 → 0.22 | 0.34–0.44 → **0.04** |
| L90 | 0.50 → **0.50** (0.51 pre-cap) | 0.50 → 0.43 | 0.50 → 0.29 | 0.49–0.50 → **0.04–0.05** |
| L100 | 0.50 → 0.50 (0.54) | 0.50 → 0.46 | 0.50 → 0.32 | 0.50 → **0.04–0.05** |

Dodge now belongs to Dexterity builds. A Dex-5 warrior or caster keeps about 4% whatever their
Dodge skill or passives (D4).

### 2.2 Dodge passives, shrine buffs and techs become multipliers

The `dodge_flat` passive effect is renamed **`dodge_pct`** (`js/core/classes.js` classBonus effect list,
`js/core/battle.js`), so nobody reads the new numbers as flat dodge. Shrine `effect: 'dodge'` and tech
`statKind: 'dodge'` keep their keys; their `power` now means "% added to the dodge multiplier".
New values are 2.5 × the old flat value (the simmed `pm 2.5`):

| Source (file) | id | Old | New (`power`) | New desc (shipped voice) |
|---|---|---|---|---|
| Thief T1 (`js/data/classes.js`) | `thief_light_fingers` | +0.04 flat | **0.10** | Light feet and a wary eye — your Dexterity turns aside 10% more blows. |
| Rogue T2 | `rogue_quickstep` | +0.08 | **0.20** | Light feet and a wary eye, sharpened further than any first calling — your dodge is 20% more effective. |
| Gambit T3 | `gambit_gamblers_nerve` | +0.10 | **0.25** | Nothing rattles a Gambit mid-wager — your dodge is 25% more effective. |
| Ranger T3 | `ranger_woodland_step` | +0.08 | **0.20** | Light, practiced footwork honed for a skirmisher who never plans to stand still — your dodge is 20% more effective. |
| Seer T3 | `seer_foresight` | +0.10 | **0.25** | A half-second's warning before a blow lands is all a Seer needs — your dodge is 25% more effective. |
| Heir of the Echo (T4) | `heir_echo_step` | +0.11 | **0.275** | A half-step out of phase with the world, the way an Echo always was — your dodge is 27.5% more effective. |
| Shrine (`js/data/shrine.js`) | `shrine_light_footing` / `shrine_winds_grace` / `shrine_shadowstep_grace` / `shrine_phantom_step` | 0.03 / 0.05 / 0.08 / 0.12 | **0.075 / 0.125 / 0.20 / 0.30** | "…making your dodge N% more effective for your next X battles." |
| Techs (`js/data/techs.js`) | `tech_fleetstep_1..4` | 0.04 / 0.06 / 0.09 / 0.12 | **0.10 / 0.15 / 0.225 / 0.30** | desc unchanged ("adding to Dodge for a few turns"); the infobox line shows "+N% Dodge effectiveness" |
| Techs | `tech_sidestep_1..4` | 0.05 / 0.08 / 0.12 / 0.16 | **0.125 / 0.20 / 0.30 / 0.40** | same |

Ability ids, costs and counts don't change. Saves are safe: abilities are stored by id, and the new
power is read live. Seer and Heir passives are now worth little on a Dex-5 caster (×1.25 of ~2%).
That's a direct consequence of the model and is part of D4.

### 2.3 Boss Dexterity (all 11 bosses)

`BALANCE.BOSS_DEXTERITY(level) = 5 × level + 10` **[invented]**. A hero earns 5 stat points per level,
so even an all-Dex hero of the boss's level (Dex ≤ 5 × level) can't out-speed it. A hero about two
levels above it can. Ties still go to the player. Each boss gets
`dexterity: BALANCE.BOSS_DEXTERITY(<level>), // invented: SPEC-ROGUE-BOSS-COST §2.3` right after
`boss: true`:

| Boss id | Level | `dexterity` |
|---|---|---|
| `estari_ruin_warden` | 10 | 60 |
| `foothills_matriarch` | 18 | 100 |
| `juneros_leviathan` | 25 | 135 |
| `kastengard_custodian` | 32 | 170 |
| `eidas_echo` | 40 | 210 |
| `majiku_warlord` | 50 | 260 |
| `majiku_ridge_chieftain` | 60 | 310 |
| `ukai_deep_dweller` | 70 | 360 |
| `estari_warden_prime` | 80 | 410 |
| `society_anima_horror` | 90 | 460 |
| `eidas_ascendant` | 100 | 510 |

The existing log line "The \<boss\> is faster and strikes first!" already explains it to the player.

### 2.4 Player-facing text

- Dodge skill info (`js/data/statinfo.js`) and the Dexterity line in DESIGN §2: *"Dexterity gives you a
  chance to dodge, with less gained from each point the more you have. Your Dodge skill makes that
  chance bigger, and so do dodge abilities, shrine blessings and techniques."*
- Status → Skills, Dodge line (`js/ui/screens.js` skillEffectLine) keeps showing "`NN% Dodge chance`"
  (the formula is read live).

---

## 3. Balance rationale & sim gate

**Why the model works for the rogue.** It takes away both of the rogue's dodge advantages over a
boss: the cap reached from Dex alone, and the extra stacked on top. Rogue boss dodge falls from 51%
to 24% (L32), 35–41% (L60) and 43–50% (L90). Boss Dexterity removes the free first strike, which
matters most at L90, where a Gambit still reaches the cap.

**Why it hurts non-Dex builds at L100.** Today those builds get ~49% dodge at L90–100 from the Dodge
skill alone. In this model the skill multiplies a near-zero Dex term, so they keep ~4%. They take
about twice as many hits. Most bosses are still won 99–100% of the time, but not Eidas Ascendant
(§3.1 S3).

**Earlier proposals (superseded, sim results kept for the record):**
- *Boss Dexterity on L25–L90 bosses + boss-only dodge ceiling (12% + 0.5 pt per boss level)*:
  passed the rogue gate with no other lineage below today's except Ranger (−0.1…−0.4 pt). The user
  dropped the ceiling in favour of fixing the dodge model itself (D1).
- *Flat lower dodge cap vs bosses* (0.20–0.40): broke L100 for every melee line (Ranger 89→64%,
  Dragoon 89→71% at 0.30). *Boss accuracy, dodge multipliers vs bosses, undodgeable boss
  techs/charged blows, "can't dodge twice in a row"*: all left L32 at 84–87%.
- *User model with the Dodge skill kept flat* (+1%/level): rogue still reached the cap from L60
  through skill + Dex; Assassin L60 stayed at 81% ❌. This led to the skill-as-multiplier step (D1).

### Sim gate (`/balance-sim`, real game code)

| # | Scenario | Metric | Must uphold |
|---|---|---|---|
| S1 | Gambit, Assassin vs every boss (L10–L100) at the boss's level, every class option | HP left on win, consumables, win % | Worst option ≤ 80% HP left or ≥ 1 consumable |
| S2 | Robustness: Dodge skill = level (2× the fixture) | S1 metrics | Still passes |
| S3 | The other 10 lineages vs every boss, every class option | win % vs today's | No lineage below today's (**fails at L100, D3/D4**) |
| S4 | All 12 lineages vs every at-level regular, L35/L60/L90 | win %, rounds | ≥ 85% win; rounds within ±25% |
| S5 | 5-levels-down (L35/60/90 grid; L12/L22 early) | win % | Not widened vs today |
| S6 | Early game L12/L22 (T1 only), 6 lineages | win % | ≥ 85% regulars |

### 3.1 Sim results (2026-10-23)

**Method.** Real game code (v1.10 working copy, save v11) in node `vm`, seeded mulberry32 (seed
1000 + trial), **300 trials per cell**. The harness is the lineage spec's
(`docs/SPEC-CLASS-LINEAGE.md` §3.1) rebuilt in the scratchpad. Active classes are set explicitly
through a source patch, so class bonuses really apply (this sidesteps the `activate(c, classId, slot)`
argument-order trap). Fixtures: v1.10 P0 builds (best non-unique gear at level, every stat point
spent, skills at half level, 3 potions + 3 crystals, every passive bought). Rogue line = Knives +
offhand Knives + Light Armor, stats vit/end/dex/dex/dex. Every boss is fought at its own level with
every class option (today / lineage, each with every unlocked Legendary). Prototype patches on
`js/core/battle.js`: the §2.1 formula in `playerDodgeChance` (old flat passive/shrine/buff values ×
2.5 = the §2.2 table), and boss Dexterity in `start()`. Limits: class techs are not cast, Conjurer
has no companion, and no dodge buffs are cast.

**S1 — rogue line, worst class option per boss (HP left; consumables per win; lowest win %).**

| Boss (level) | Today | Gambit | Assassin |
|---|---|---|---|
| Estari Ruin Warden (10) | 68% | 68%, c0.92, 100% | same |
| Foothills Matriarch (18) | 73% | 69%, c0.43, 99.7% | same |
| Juneros Leviathan (25) | **83%** | 71%, c0.12, 100% | same |
| **Kastengard Custodian (32)** | **89%** | **78%**, c0.00, 100% | **78%**, 100% |
| Eidas Echo (40) | **86%** | 75%, c0.03, 100% | same |
| Majiku Warlord (50) | **83%** | 72%, c0.12, 100% | same |
| **Majiku Ridge-Chieftain (60)** | 82% / **85%** | **76%**, c0.06, 100% | **77%**, c0.05, 100% |
| Ukai Deep-Dweller (70) | 81% / 84% | 75%, c0.10, 100% | 76%, c0.06, 100% |
| Estari Warden-Prime (80) | 81% / 84% | 76%, c0.08, 100% | 78%, c0.07, 100% |
| **Society Anima-Horror (90)** | 81% / **84%** | **76%**, c0.14, 99.7% | **77%**, c0.10, 100% |
| Eidas Ascendant (100) | 68% / 72% | 61%, c0.63, 95.3% | 64%, c0.46, 96.3% |

✅ every cell, L10–L100.

**S2 — Dodge skill = level.** Every rogue boss cell L25–L90 still passes: 71–79% HP left, with
Assassin L60 and L80 exactly on the 80% line. ✅ (thin margin; D5)

**S3 — other lineages vs bosses (lowest win % over all class options, today → proposed).**

| Lineage | L10 | L18–L80 | L90 | **L100** | Best-option HP left shift, mean (worst) |
|---|---|---|---|---|---|
| Shadowknight | 100 → 100 | ≥ 99 | 100 → 99.7 | **96 → 62** | −6.8 (−23) pt |
| Berserker | 100 → 100 | ≥ 99 | 100 → 100 | **96 → 63** | −7.1 (−25) pt |
| Paladin | 100 → 100 | ≥ 99 | 100 → 99 | **95 → 55** | −8.0 (−27) |
| Warden | 100 → 100 | ≥ 99 | 100 → 99 | **95 → 54** | −8.1 (−26) |
| Magus / Conjurer / Cleric / Seer | **89 → 83** | 100 | 100 → 97–98 | 100 → 95–97 | −8.9…−9.8 (−22) |
| Ranger | 99 → 98 | ≥ 99 | 99 → 98 | **89 → 63** | −8.0 (−14) |
| Dragoon | 92 → 94 | ≥ 99 | 100 → **93** | **88 → 31** | −7.8 (−23) |

❌ against "no lineage below today's": L100 fails the boss contract for 6 lineages (Dragoon 31%, the
four warrior lines 54–63%, Ranger 63%). L10 casters fall below 85% (T1 Magician, dodge 9% → 4%). All other
bosses stay ≥ 93%, mostly 99–100%. Every lineage pays more HP at bosses (−7 to −10 points on average).
**Accepted by the user pending compensation (D3/D4).**

**S4 — at-level regulars, all 12 lineages at L35/L60/L90.** 100% win in every cell, today and
proposed. Rounds +0.0…+0.1. ✅

**S5 — 5-levels-down.** L35/L60/L90 grid: 100% → 100% (the known accepted limitation, DESIGN §4;
not widened). Early game: Ranger L17 74.3% → **40.7%**, Dragoon 97.7% → 90.0%, the others unchanged
(99.7–100%). The new model *narrows* the 5-down hole at low levels. ✅

**S6 — early game (L12/L22, T1 only; Berserker, Warden, Magus, Assassin, Ranger, Dragoon).** Regulars
100% win, rounds +0.0…+0.1. ✅

---

## 4. Conventions & handoff checklist

- [x] Drop tables / stock lists: not touched. Icons: none new. Quest gates: not touched
- [x] **Save impact: none.** Ability/shrine/tech ids unchanged; powers are read live; `dexterity` is
  static monster data. Save version unchanged
- [ ] `js/balance.js`: add `DEX_DODGE_MAX`, `DEX_DODGE_HALF`, `BOSS_DEXTERITY(level)`; remove
  `DODGE_PER_DEX`; re-comment `DODGE_PER_SKILL_LEVEL`. Each with an `[invented]` citation to this spec
- [ ] `js/core/battle.js` playerDodgeChance: §2.1 formula; block header comment
- [ ] `js/core/classes.js` + `js/data/classes.js`: `dodge_flat` → `dodge_pct` (effect list, 6 passives,
  new powers and descs per §2.2). CLAUDE.md's classBonus effect list also names `dodge_flat`
- [ ] `js/data/shrine.js` (4 entries) and `js/data/techs.js` (8 entries): new powers and descs; infobox
  formatting for `statKind: 'dodge'` (`js/core/battle.js` ~L1243) → "+N% Dodge effectiveness"
- [ ] `js/data/monsters.js`: `dexterity` on all 11 bosses (§2.3)
- [ ] `js/data/statinfo.js` + `docs/DESIGN.md` §2/§4: wording per §2.4
- [ ] **Tests that will go stale (update the constants, keep the behaviour checks):**
  `tests/test_v18_engine.js` Test 1 (a +0.05 dodge buff raises dodge by exactly 0.05; now
  multiplicative). `tests/test_p6_classes.js` ~L958 (`classBonus(c, 'dodge_flat')`).
  `tests/test_p4_world.js` ~L1709–1722 (shrine dodge before/after). `tests/test_p3_battle.js` ~L1116
  (`dexterity = 200` "saturates Dodge to its cap"; Dex alone now can't, so add Dodge skill and
  passives). Boss turn-order tests that pin a Dex-heavy hero first against a boss.
  **New tests:** Dex alone never reaches `DODGE_CAP` (Dex 10,000 → < 0.33); skill and passives scale
  the Dex term (a Dex-5 hero with skill 100 stays < 0.06); a Dex-heavy hero at a boss's level gets
  `playerFirst === false`
- [ ] Re-sim during review: S1–S6 on the implemented code
- [ ] Changelog (draft):
  > **Footwork rewritten.** Dodging now comes from Dexterity, with less gained from each point the
  > more you have, so even the nimblest hero can't slip every blow. Your Dodge skill, dodge abilities,
  > shrine blessings and footwork techniques now make that chance bigger instead of adding a fixed
  > amount. Thieves, Rogues, Gambits and Assassins finally get full use from their dodge abilities.
  > Bosses are also quicker: most will strike first unless you clearly outclass them.

---

## 5. Decisions

| # | Question | Decision / recommendation |
|---|---|---|
| **D0** | Pay line on the worst or the best class option | **Resolved: worst option** (user, 2026-10-22) |
| **D1** | Which fix | **Resolved (user, 2026-10-22/23):** drop the boss dodge ceiling. Dex dodge with diminishing returns; Dodge skill as a multiplier on Dex dodge; passives and dodge buffs as a further multiplier (§2.1–2.2). Plus boss Dexterity |
| **D2** | Boss Dexterity on which bosses | **Resolved: all 11** (user, 2026-10-22) |
| **D3** | Non-rogue lineages lose boss win rate | **Resolved: accepted, with compensation** (user, 2026-10-23). Ranger's small first-strike loss was accepted earlier; the large L100 / L10 drops (§3.1 S3) are accepted on the condition of D4 |
| **D4** | **Compensation for non-Dex builds** | They lose ~45 points of dodge at L90–100 and fail the L100 boss (Dragoon 31%, warrior lines 54–63%, Ranger 63%) and the L10 caster cell (83%). **Specced in `docs/SPEC-NONDEX-DEFENSE.md` (Bracing: Heavy/Medium Armor skill × Endurance cuts hit damage after the penetration floor, + Estari Ruin Warden 33 → 28 damage); ships in the same release.** With both specs, every Heavy/Medium lineage wins the L100 boss 98–100%, and the rogue cost still holds. Casters (Light Armor, no Bracing) stay at 95–98% at L90–100 and 86.3% at L10, with their own follow-up spec (its D3) |
| **D5** | Curve constants | **Resolved (user, 2026-10-23): `DEX_DODGE_MAX` 0.30 / `DEX_DODGE_HALF` 100 / passive values ×2.5, as simmed.** Known thin margin: at Dodge skill = level the Assassin sits exactly on 80% at L60 and L80 |
| **D6** | Gambit still reaches the cap at L90+ (0.51 pre-cap) with all passives | **Resolved (user): accept.** That's Dex + skill + passives together, which the model allows; only Dex *alone* is barred, and boss Dexterity carries L90 |
| **D7** | Boss techs have fixed power 12–26 even at L90–100 (§1.1 b) | **Resolved (user): separate follow-up spec later** (scale boss tech power with level, own sim gate), after this spec and `docs/SPEC-NONDEX-DEFENSE.md` ship |

---

## 6. Out of scope

- The compensation for non-Dex builds (D4): its own spec.
- Boss tech power scaling (D7) and the deferred boss-telegraph pass (DESIGN §4 accepted limitation).
- Global monster HP/damage buffs (rejected in `docs/SPEC-CLASS-LINEAGE.md` §3.1).
- Monster dodge (`MONSTER_DODGE_*`), Accuracy, Double Attack's Dex scaling, initiative for regular monsters.
- Class abilities other than the 6 dodge passives.
