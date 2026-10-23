# SPEC — Bracing (Heavy and Medium Armor turn blows; compensation for non-Dexterity builds)

**Implemented 2026-10-23 in v1.11.0 "The Hero Tree"** together with `docs/SPEC-CLASS-LINEAGE.md` (review re-sim of the shipped code: `docs/SPEC-CLASS-LINEAGE.md` §3.2). Not committed, merged or deployed (user-gated).

**Status:** READY FOR IMPLEMENTATION together with `docs/SPEC-ROGUE-BOSS-COST.md` (its D4). D0–D5
resolved by the user 2026-10-23 (§5). Sim gate run 2026-10-23 (§3.1): every Heavy/Medium Armor
lineage wins the L100 boss at or above today's rate, and the rogue line's new boss cost holds.
**Casters are deliberately not covered** (no Bracing for Light Armor): they stay 1–5 win points below
today at L80–L100 and at L10, and get **their own follow-up spec** (D3). No game code changed.
This spec only makes sense on top of the `SPEC-ROGUE-BOSS-COST` dodge model; on today's dodge it
would make every Heavy/Medium build stronger.
Authored 2026-10-23 (user-directed: "write the compensation spec for non-Dex builds, simmed against the
L100 and L10 cells").

**Relationship to authority:** extends `docs/DESIGN.md` §2 (Skills/Stats) and §4 (Combat). The armor
skills are archived as "Affects the efficiency of your heavy armor" / "…of your medium armor"
`[archived: reference/manual/Heavy_Armor.md]` `[archived: reference/manual/Medium_Armor.md]`, and
Endurance as "Increases the damage reduction ability of your armor" `[archived:
reference/manual/Endurance.md]`. The archive gives no formula. Today the armor skills raise the Armor
stat (`ARMOR_SKILL_ARMOR_PER_LEVEL` 0.02, cap 0.30) and Endurance feeds Armor (both `[invented]`).
Bracing adds a second effect: armor you know how to wear, and the Endurance behind it, softens blows
that get through. The mechanic and every number are **[invented]**. Fear scaling is archived: "lower
your stats by 10% for each level you are under an enemy's level" `[archived:
reference/manual/Fear.md]`. Nothing is [revised].

**Interpretation of the request (resolved — D0):** The new dodge model leaves builds with little
Dexterity at ~4% dodge, where today they get ~20–50% from the Dodge skill. That breaks the boss contract
at L100 (Dragoon 88→31% win, warrior lines 95–96→54–63%, Ranger 89→63%) and at L10 for casters
(89→83%). "Compensate" means: every compensated lineage's boss win rate is back at or above today's.
The HP cost does not have to match today's exactly. It must not undo the rogue line's new boss cost,
and it must not be a global monster change.

---

## 1. What changes

### 1.1 Why armor can't fill the gap (diagnosis, sim-measured)

At L100 the Eidas Ascendant hits for 363 against 260–350 armor, so its basic hits already land on the
**30% penetration floor** (`DAMAGE_PENETRATION_FLOOR`). Extra Armor would change nothing. The new dodge
model roughly **doubles** the damage non-Dex builds take (Paladin 393 → 836 per fight, Dragoon 430 →
853). Only something applied **after** the floor can help.

At L10 only casters fall short. A T1 Magician goes from 9% to 3% dodge, about 8% more damage taken,
and its 88.7% win was already the lowest boss cell in the game (`docs/SPEC-CLASS-LINEAGE.md` §3.1 S6).
Skills are level 5 there, so no skill lever reaches it. Handled by the Warden damage trim (§2.2) and
the caster follow-up (D3).

### 1.2 Before / after

| | Today | With `SPEC-ROGUE-BOSS-COST` only | Proposed (both specs) |
|---|---|---|---|
| Heavy/Medium Armor build at L90–100 | ~49% dodge | ~4% dodge | ~4% dodge **+ Bracing 50% (cap)** |
| Heavy/Medium Armor build at L32 / L60 | 20% / 34% dodge | 4% | 4% + Bracing 17% / 34% |
| Caster or rogue (Light Armor) | 9–50% dodge | 4–50% | **unchanged** (no Bracing; casters → D3) |
| Estari Ruin Warden (L10) basic damage | 33 | 33 | **28** |

---

## 2. Design detail

### 2.1 Bracing

On every monster hit that lands on the player (`js/core/battle.js` monsterAct, right after the `dmg`
line that applies the penetration floor, before Block and Defend):

```
skillBrace = Σ over worn head / body / legs / feet pieces whose item.skill is Heavy or Medium Armor:
               BRACE_PER_ARMOR_SKILL_LEVEL × (that armor skill's level) / 4
brace      = min(BRACE_CAP, skillBrace × (1 + BRACE_PER_ENDURANCE × Endurance)) × fearMultiplier(battle)
dmg        = max(1, round(dmg × (1 − brace)))
```

| Constant (`js/balance.js`) | Value | Tag | Why |
|---|---|---|---|
| `BRACE_PER_ARMOR_SKILL_LEVEL` | 0.01 | [invented] | The same 1% per level the Dodge skill used to give everyone. Heavy/Medium builds get back roughly the avoidance they lost, as damage reduction |
| `BRACE_PER_ENDURANCE` | 0.002 | [invented] | Endurance multiplies the armor-skill brace (archived: "Increases the damage reduction ability of your armor"). +20% at 100 Endurance; it brings the warrior lines back to today's HP cost (§3.1) |
| `BRACE_CAP` | 0.50 | [invented] | Same ceiling as `DODGE_CAP` |

Notes:
- **Heavy and Medium Armor only** (D1/D3). Light Armor pieces count for nothing, so rogues and casters
  are unaffected. This gives the heavier armor types a defensive identity of their own: quick feet
  for Light Armor, braced blows for Medium and Heavy.
- **Per piece, /4:** a mixed set gives a partial brace (one heavy helmet = a quarter of the Heavy
  rate). Shields don't count (they have Block, `docs/SPEC-SECONDARY-STATS.md` §2.5).
- **Endurance only multiplies:** with no Heavy/Medium Armor worn it does nothing for Bracing (it
  still gives Armor as today).
- **Applies to physical and graded hits alike**, as dodge did. Not to poison/bleed ticks, not to
  companion hits (`damageCompanion`), not to the player's own attacks.
- **Fear:** ×`fearMultiplier` (−10% per level under the enemy). **Not** switched off at 5+ levels under
  (D4): the 5-down cells narrow with Bracing on (§3.1 S5).
- **Skill XP:** unchanged. Armor skills already gain XP when the hero is hit while wearing them
  (`hitWhileWearingArmor`), and with less dodge that happens more often.
- Values at the P0 fixture (skills at half level, ~1 Endurance per level): L32 17%, L60 34%, L90 50%
  (cap), L100 50%.

### 2.2 Estari Ruin Warden (L10) — D2, resolved: 28

`estari_ruin_warden.damage: 3 + 2 * 10 + 10` (33) → **`3 + 2 * 10 + 5`** (28) **[invented]**: a boss
premium of +5 instead of +10. Casters vs the L10 boss: 83.3 → 86.3% win (over the 85% line; still 2.4
points under today's 88.7%, accepted). Its techs are not touched.

### 2.3 Player-facing text

- Status → Skills, Heavy/Medium Armor line (`js/ui/screens.js` skillEffectLine): today
  "`+N% Armor when worn`". New: "`+N% Armor and −M% damage taken when worn`" (M = the brace from a full
  set of that type, Endurance included, before the cap). Light Armor line unchanged.
- Heavy and Medium Armor skill info (`js/data/statinfo.js`): *"Armor you know how to wear turns the worst
  of a blow even when it lands: each level softens the hits you take while wearing it, and Endurance
  makes that stronger."* Endurance info gets: *"…and makes heavy and medium armor soften blows more."*
- No battle-log change.

---

## 3. Balance rationale & sim gate

**Levers tried** (all on top of the `SPEC-ROGUE-BOSS-COST` dodge model + boss Dexterity; lowest win % /
worst-option rogue HP left; 300 trials):

| Variant | Paladin L100 | Dragoon L100 | Ranger L100 | Magus L10 | Magus L100 | Rogue L32 HP left |
|---|---|---|---|---|---|---|
| Today (shipped dodge) | 95 | 88 | 89 | 89 | 100 | 89% |
| Dodge model only | 55 | 31 | 63 | 83 | 96 | 78% |
| Bracing 1%/lvl every armor type, × (1 − dodge/cap) | 99 | 98 | 85 | 83 | 100 | 80% (on the line) |
| Bracing 0.8%/lvl, cap 0.45, dodge-scaled | 97 | 88 | 81 | 83 | 100 | 79% |
| Bracing Heavy/Medium 1% + Light 0.5% × (1 − dodge/cap) | 99 | 98 | 100 | 83 | 100 | 79% |
| **Bracing Heavy/Medium 1% only (chosen, D1/D3)** | **99** | **98** | **100** | 83 → **86** with the Warden trim | 96 | **78%** |
| Boss retune only (Eidas ×0.6, Warden ×0.9, all damage) | 99 | 95 | 99 | 86 | 100 | 78% |
| Warden basic damage ×0.85 (28) / ×0.75 (25) | — | — | — | 86 / 88 | — | — |

**Endurance variants** (Heavy/Medium Bracing, Warden 28; full gate each):

| Variant | Win rates | Best-option HP left vs today, mean: warriors / Dragoon / Ranger |
|---|---|---|
| E0: 1%/lvl, no Endurance | identical across E0–E2 (§3.1 S3) | −0.8…−1.2 / −2.5 / −3.1 pt |
| **E1: 1%/lvl × (1 + 0.2% per Endurance) (chosen)** | identical | **−0.1…−0.3 / −1.6 / −2.4** |
| E2: 0.8%/lvl × (1 + 0.25% per Endurance) (budget-neutral) | identical | −1.1…−1.6 / −2.6 / −3.3 |

Endurance never changes a win rate on the fixture: at L90–100 Bracing is already at its 50% cap, and
below that every compensated lineage already wins 99–100%. Its effect is the HP cost and player choice
(an Endurance-heavy warrior braces more at mid levels). E1 puts the warrior lines back almost exactly
at today's HP cost.

- **Boss-only retunes** fix L100 but help only that boss, change a shipped constant, and give the rogue
  line its L100 cost back (61% → 74% HP left). Kept only for the L10 corner case.
- **More Armor:** at L100 every build is already on the penetration floor (§1.1).

### Sim gate (`/balance-sim`, real game code)

| # | Scenario | Must uphold |
|---|---|---|
| S1 | Rogue line, every boss, every class option | `SPEC-ROGUE-BOSS-COST` S1 still passes |
| S2 | Heavy/Medium lineages (Shadowknight, Berserker, Paladin, Warden, Ranger, Dragoon), every boss | Boss win ≥ today's |
| S3 | Casters, every boss | Reported; their compensation is a separate spec (D3) |
| S4 | All 12 lineages, at-level regulars L35/L60/L90 + early L12/L22 | ≥ 85% win; rounds ±25% |
| S5 | 5-levels-down (L35/60/90 grid; L7/L17 early) | Not widened vs today |

### 3.1 Sim results (2026-10-23, chosen config E1 + Warden 28)

**Method.** As in `docs/SPEC-ROGUE-BOSS-COST.md` §3.1: real game code (v1.10 working copy, save v11) in
node `vm`, seeded mulberry32, **300 trials per cell**, v1.10 P0 fixtures (melee/polearm/ranger stats
include 1/5 Endurance) with class bonuses explicitly active. Every boss is fought at its own level with
every class option. Prototype patches on `js/core/battle.js`: the `SPEC-ROGUE-BOSS-COST` dodge model and
boss Dexterity, Bracing (§2.1) after the penetration floor, and the Warden's basic damage 33 → 28.
Baseline = shipped game.

**S1 + S2 + S3 — lowest boss win % over all class options, today → proposed (both specs).**

| Lineage | L10 | L18–L80 | L90 | **L100** | Best-option HP left vs today, mean (worst) |
|---|---|---|---|---|---|
| Berserker | 100 → 100 | 100 | 100 → 100 | **96 → 99** | −0.1 (−6) pt |
| Paladin | 100 → 100 | 100 | 100 → 100 | **95 → 99** | −0.3 (−5) |
| Warden | 100 → 100 | 100 | 100 → 100 | **95 → 100** | −0.2 (−5) |
| Shadowknight | 100 → 100 | 100 | 100 → 100 | **96 → 99** | 0.0 (−5) |
| Ranger | 99 → 98 (1 loss in 300) | 99–100 → 100 | 99 → 100 | **89 → 100** | −2.4 (−8) |
| Dragoon | 92 → 93 | 99–100 → 100 | 100 → 100 | **88 → 98** | −1.6 (−6) |
| Gambit / Assassin | 100 → 100 | 100 | 100 | 97–99 → 95–96 | rogue cost: L32 78%, L60 76/77%, L90 76/77%, L100 61/64% HP left ✅ |
| *Magus / Conjurer / Cleric / Seer* | *89 → 86* | *100 (L80 one loss in 300)* | *100 → 97–98* | *100 → 95–97* | *−9.1…−10.0 (−22) — D3* |

✅ S1, ✅ S2 (no compensated lineage below today's except Ranger L10 by one fight in 300, which is
noise). S3: casters 1–5 points under today at L80–L100 and L10, accepted for the caster follow-up.

**S4 — regulars.** All 12 lineages at L35/L60/L90 and the 6 early lineages at L12/L22: 100% win in every
cell, rounds +0.0…+0.1. ✅

**S5 — 5-levels-down.** L35/60/90 grid: 100% → 100% (the accepted DESIGN §4 limitation; not widened).
Early L17: Ranger 74.3 → 60.7%, Dragoon 97.7 → 93.3%, the others 100 → 99.7–100%. L7: 0% everywhere.
✅ narrowed.

---

## 4. Conventions & handoff checklist

- [x] Drop tables, icons, quests: not touched. **Save impact: none**
- [ ] `js/balance.js`: `BRACE_PER_ARMOR_SKILL_LEVEL` 0.01, `BRACE_PER_ENDURANCE` 0.002, `BRACE_CAP` 0.50,
  each `[invented]` citing this spec (archived intent: `reference/manual/Heavy_Armor.md`,
  `reference/manual/Endurance.md`)
- [ ] `js/core/battle.js`: a `playerBraceFraction(battle)` helper next to `playerDodgeChance` (exported
  for the UI line and tests); applied in monsterAct after the penetration-floor line, before Block/Defend
- [ ] `js/data/monsters.js`: `estari_ruin_warden.damage` `3 + 2 * 10 + 10` → `3 + 2 * 10 + 5` (= 28),
  with a comment citing this spec
- [ ] `js/ui/screens.js` skillEffectLine (Heavy/Medium Armor) + `js/data/statinfo.js` (Heavy Armor,
  Medium Armor, Endurance): text per §2.3
- [ ] **Tests (new, stubbed RNG):** (1) a full Heavy set at skill 20 with Endurance 0 takes exactly
  `round(dmg × 0.8)` after the floor; (2) Endurance 100 → ×1.2 of that brace; (3) a full Light Armor set
  gives 0; (4) `BRACE_CAP` holds at skill 200; (5) Fear 2 levels under → ×0.8; (6) Block and Defend
  still apply after Bracing. **Re-check** the shipped boss floors that use a Heavy-Armor warrior fixture
  (`tests/test_p6b_content.js` Part 4 eidas_echo ≥ 60% win + "real cost", `tests/test_p3_battle.js`
  Tests 35/44/47). Their Heavy Armor skill is 2, so expect them unchanged; run all 15 suites
- [ ] Re-sim during review: S1–S5 with both specs implemented
- [ ] `docs/DESIGN.md` §2 (armor skills, Endurance) + §4: Bracing bullet
- [ ] Changelog (merge with the `SPEC-ROGUE-BOSS-COST` entry):
  > **Armor that holds.** Heavy and medium armor now pay off when a blow lands: the better you know
  > your armor, and the more Endurance behind it, the less each hit hurts. Light armor stays the
  > armor of quick feet.

---

## 5. Decisions

All resolved by the user on 2026-10-23.

| # | Question | Decision |
|---|---|---|
| **D0** | What the compensation restores | **Boss win rate ≥ today's**; the HP cost may differ |
| **D1** | Bracing rates | **Heavy/Medium Armor 1% per level, cap 50%, as simmed.** It over-restores Ranger (L100 89 → 100%) and Dragoon (88 → 98%), accepted |
| **D2** | L10 casters | **Estari Ruin Warden damage 28** (casters 86.3%, 2.4 points under today, accepted) |
| **D3** | Light Armor Bracing | **None.** It complicated the setup for Light Armor dodgers, and keeping Bracing to Medium/Heavy gives those armor types their own identity. **The caster (mage-line) balance gap gets a separate spec**: casters sit at 95–98% win at L90–L100 (today 100%) and 86.3% at L10 (today 88.7%), and pay 9–10 more HP points per boss |
| **D4** | Bracing at 5+ levels under the enemy | **Keep it on**, Fear-scaled only (5-down narrows with it, §3.1 S5) |
| **D5** | Endurance | **Added now:** Bracing × (1 + 0.2% per Endurance), variant E1. The constant was my pick among the simmed variants. E2 (0.8%/lvl × (1 + 0.25%/End)) gives the same win rates with ~1 point more HP cost, if a budget-neutral version is preferred |

---

## 6. Out of scope

- **Caster compensation** (D3): its own spec. Targets from §3.1: L80–L100 back to 100% win, L10 back to ≥ 88.7%.
- The dodge model and boss Dexterity (`docs/SPEC-ROGUE-BOSS-COST.md`).
- Shields (Block covers them), Magic Armor, HP/Vitality changes.
- Retuning any boss other than the Estari Ruin Warden; boss tech power (`SPEC-ROGUE-BOSS-COST` D7).
- Companion defense.
