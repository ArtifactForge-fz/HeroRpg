# SPEC — Companion attacks stop drawing on Attunement and Spell Power (and the armor question)

**Status:** IMPLEMENTED on branch `v1.11-hero-tree`; not yet merged to `main`, released or deployed.
D0–D4 resolved by the user 2026-10-29 (§5). **Implementation gate run 2026-10-29 (§7): partial** —
L70–L90 pass; L60 (near-miss) and the finale (38% vs 45%) are accepted by the user (§8). Authored 2026-10-29 on
branch `v1.11-hero-tree` (user-directed: "pick up the last two follow-up points together, as
companion attacks ignoring armor has an effect on the conjurer boss cells" — F3 and F4 of
`docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §9). Screened at 300 trials (§3); the implementation gate is
owed.

**Relationship to authority:** reverses two earlier [invented] design decisions, both made for the
retired Conjurer servitor whose damage pipeline the companions inherited:
`docs/SPEC-TECH-POLARITY.md` §0 finding d (the Attunement buff also boosts the servitor tick,
"intentional") and `docs/SPEC-SECONDARY-STATS.md` D7 (user-resolved: "Does Spell Power boost
Conjurer servitor ticks? Yes"). No archived rule involved; no [revised] tag. The boss contract
(`docs/SPEC-BOSS-COST-BAND.md` §2) is unchanged.

**Interpretation of the request (D0, confirmed by the user):** fix the five Conjurer boss cells by changing the
companion's damage, not the bosses, and settle whether companion attacks should pay monster Armor like
hero spells do.

---

## 1. Problem

**1.1 The cells.** With the full kit (`docs/SPEC-BOSS-SIM-FULL-KIT.md`) the Conjurer spends 27–34% HP
per win at every T3 boss (floor 35%, finale 45%): L60 32, L70 34, L80 33, L90 27, L100 28. The
cheapest option is the Earth or Fire pact with Heir of the Echo, and the kit keeps **Attunement**.

**1.2 Why the companion retunes didn't hold.** `docs/SPEC-COMPANION-BOSS-COST.md` passed all 132 cells,
but its grid gave the hero class techs only. Attunement is an Academy tech (Evocation), so that grid
never saw it.

**1.3 The mechanism.** A companion attack is computed as a spell (`js/core/companion.js`
`dealDamageToMonster` → `Game.Battle.techEffectivePower`). Attunement (+12/+24/+40/+60) and the Spell
Power stat are **flat** additions applied before the Int multiplier — sized for hero spells (power
50–107), but companion attacks are small (Stone Fist at L60: 4 + 0.5 × 60 = 34). Attunement III more
than doubles the Golem's damage; Spell Power from gear and the Anima Kindling shrine adds on top.

**1.4 The armor question (F3).** Companion attacks subtract only the monster's Magic Armor; since
`docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` a graded hero spell also pays half the monster's Armor.

## 2. Design

### 2.1 Attunement and Spell Power no longer feed companion attacks (A2) — `js/core/companion.js`, `js/core/battle.js`

A companion's damage — its basic attack (Ember Lash, Stone Fist, Gale Slash), Water's chip hit and
Fire's Burn — is computed without the hero's `spellpower` buffs (Attunement) and without the Spell
Power stat. Everything else stays: the attack's own power, the hero's Intelligence, the magic-school
and Rod multipliers, `COMPANION_DAMAGE_MULT`, Fear, curse. Hero spells, companion *command* spells
(Conflagration, cast by the hero through useTech) and Water's heal are unchanged. [invented]

Implementation shape: `companion.js` passes a `companion: true` flag in the synthetic tech it hands
to `techEffectivePower`; `techEffectivePower` skips the two flat terms when it's set.

### 2.2 Half Armor on companion attacks (A1) — D2

Part of the package (D2): graded companion damage attacks (Ember Lash, Stone Fist, Gale Slash) pay
the monster's Magic Armor + `TECH_PHYSICAL_DEFENSE_SHARE` × Armor, mirroring the hero-spell rule of
`docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §2.2. [invented] Fire's Burn ticks are status damage and
unchanged. **Correction (found in implementation):** Water's chip is ungraded in the data
(`comp_water` `grade: null`), so it keeps today's Magic-Armor-only rule; it's a token hit
(2 + 0.2 × level), so no data change was made.

### 2.3 Player-facing

Changelog line (D4): "Your companion no longer draws on Attunement or Spell Power, and elemental
companion attacks now meet half a monster's armor, like your own spells."

## 3. Sim gate (screening run 2026-10-29, 300 trials)

**Method.** Real game code in node `vm`, patched in memory per option (scratch scripts). Full-kit
fixture; Conjurer, every class option (4 pacts × Legendaries), `basic`/`techs`/`kit`, the five T3
bosses. Regular checks: Conjurer with each pact and without one, at-level, four and five levels up,
at L60/70/80/91.

**Boss cells** (cheapest option HP spent per win %, **x** = fails; every cell wins 100%):

| Option | L60 | L70 | L80 | L90 | L100 (needs 45) |
|---|---|---|---|---|---|
| Today | x32 | x34 | x33 | x27 | x28 |
| A1: half Armor on companion attacks | x32 | x33 | x33 | x28 | x29 |
| **A2: no Attunement / Spell Power in companion attacks** | **40** | **43** | **42** | **43** | **48** |
| A1 + A2 | x35 (34.9) | 44 | 42 | 43 | 49 |

- **A2 fixes all five cells**; the finale lands at 48% (floor 45).
- **A1 barely matters on its own** (±1 point): companion hits are small, so half a boss's Armor takes
  off a few points per hit. The link the user suspected is real but tiny; Attunement is the driver.
- With A1 + A2, L60 lands at 34.9% — within selection noise of A2's 40%, but under the floor (D2).

**Regular checks** (best of `basic` / `techs` / `kit`, win %): at-level 100% for every pact under
every option. Four levels up: 98–100% under every option. Five levels up: unchanged by every option
(companions are suppressed there; the L29+ limitation is accepted).

**Fixture artifact found:** in four regular cells (Wind four levels up at L60/L70, Earth four up at
L80, Earth at-level L70) the `kit` policy alone scored much worse under A2 / A1+A2 (down to 2% win)
while `basic` and `techs` won 99–100%. The `kit` tool choice is made on 30 fights and occasionally keeps
a set that plays badly over 300. The boss verdict takes the player's best policy, so it isn't
affected; it's a follow-up for the fixture (§6).

### 3.1 Share sweep (user D1: "keep both, scale down"), half Armor on

Companion attacks keep a share of Attunement and Spell Power (cheapest HP spent %, all 100% win):

| Share | L60 | L70 | L80 | L90 | L100 (needs 45) |
|---|---|---|---|---|---|
| 100% (today) | x31.9 | x32.5 | x33.1 | x27.5 | x28.6 |
| 75% | x32.4 | x33.4 | x34.5 | x31.3 | x32.1 |
| 50% | x33.1 | x33.9 | x34.6 | x34.3 | x32.3 |
| 25% | x34.5 | 36.4 | 35.2 | 35.8 | **x34.6** |
| **0%** | **x34.9** | **43.8** | **42.3** | **43.2** | **48.9** |

- No partial share clears the finale; only 0% does. Regular checks (best policy) at every share:
  at-level 100%, four and five levels up 99–100%.
- **Correction to §3's A2 row:** its L60 40% came from a `kit` tool-choice failure — the Earth + Heir
  option kept five buffs and spent 169% HP, so a different option looked cheapest. With half Armor on,
  the same option chose Echoing Judgment only and reached 34.9%, the real cheapest play. So L60 sits at
  the floor with or without half Armor.

**Implementation gate (owed, 300 trials):** the full 12-lineage kit grid plus regular checks. Pass
bar: the Conjurer cells at L70–L100 pass and L60 stays within ~1 point of 35% (accepted, D1); no other cell newly fails; Conjurer at-level 100% (best policy).

## 4. Conventions & handoff checklist

- [x] `js/core/companion.js`: the `companion: true` flag on the synthetic damage techs (basic attack,
  Water chip, Fire Burn). Not the Water heal.
- [x] `js/core/battle.js` `techEffectivePower`: skip the `spellpower` buff and the Spell Power stat
  when `tech.companion`; comment citing §2.1 and the two decisions it reverses.
- [x] A1 (D2): `js/core/companion.js` `dealDamageToMonster` — a graded companion attack is mitigated by
  Magic Armor + `TECH_PHYSICAL_DEFENSE_SHARE` × Armor (mirror of `docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §2.2).
- [x] Tests: `tests/test_v18_engine.js` Test 2 asserts the buff *does* boost a companion tick — that is
  the behavior this spec reverses, so the assertion changes to "does not" (a design change recorded
  here, not a weakened test). Other expectations built on companion damage with Attunement/Spell
  Power are stale constants. New stubbed-RNG test: a companion attack deals the same damage with and
  without Attunement running, while a hero spell still gains from it.
- [x] `docs/SPEC-TECH-POLARITY.md` §0 finding d and `docs/SPEC-SECONDARY-STATS.md` D7: add a line
  noting they are superseded for companions by this spec.
- [x] Save impact: none. Ids, icons, drop tables: none.
- [ ] Changelog line (§2.3) in the release that ships this.
- [x] All 16 suites green.

## 5. Decisions

All resolved by the user on 2026-10-29.

| # | Question | Decision |
|---|---|---|
| **D0** | Fix the Conjurer cells through companion damage (tools, not bosses) | **Yes** (as recommended) |
| **D1** | Attunement and Spell Power in companion damage | The user first chose "keep both, scale down"; the sweep (§3.1) found no partial share that clears the finale, so the user chose **0%: companion attacks get neither** (reversing `docs/SPEC-SECONDARY-STATS.md` D7 and `docs/SPEC-TECH-POLARITY.md` finding d for companions), and **accepted L60 at 34.9%** as a near-miss |
| **D2** | Companion attacks also pay half monster Armor (A1) | **Include it** (the first draft recommended leaving it out): one rule for all elemental damage. It changes the Conjurer cells by about a point |
| **D3** | The Water companion's heal keeps Spell Power | **Keep** (as recommended) |
| **D4** | Player-facing wording | "Your companion no longer draws on Attunement or Spell Power, and elemental companion attacks now meet half a monster's armor, like your own spells." (the user approved the scale-down wording; reworded for 0%) |

## 6. Out of scope / follow-ups

- **Fixture — done 2026-10-29:** the choice now runs on 60 fights (`docs/SPEC-BOSS-SIM-FULL-KIT.md` D6). Was: the `kit` policy's 30-fight tool choice sometimes keeps a bad set (§3). Options: compare
  the chosen set against `techs` on the same 30 fights and fall back when it's worse, or use more
  fights.
- Companion HP lost as a boss cost (still a report column, `docs/SPEC-BOSS-SIM-FULL-KIT.md` D5).
- Companion command spells and Water's heal.

## 7. Implementation and gate (2026-10-29)

- `js/core/companion.js`: companion damage (basic attack, Water chip, Fire Burn power) passes
  `companion: true` to `techEffectivePower`; a graded companion hit is mitigated by Magic Armor +
  `TECH_PHYSICAL_DEFENSE_SHARE` × Armor. Water's chip is ungraded in the data and keeps Magic Armor only (§2.2).
- `js/core/battle.js` `techEffectivePower`: the `spellpower` buff and the Spell Power stat are 0 for
  `tech.companion`.
- Tests: `tests/test_v18_engine.js` Test 2 reversed by design (a companion tick deals the same damage
  with and without the spellpower buff; a hero spell still gains); new `tests/test_companion.js` Test 16
  (half Armor on a graded companion hit; no gain from Attunement or Spell Power). All 16 suites pass.
- `docs/SPEC-TECH-POLARITY.md` finding d and `docs/SPEC-SECONDARY-STATS.md` D7 marked superseded for companions.

**Gate** (real code, 300 trials, 1,404 cells, with the amended kit tool choice of
`docs/SPEC-BOSS-SIM-FULL-KIT.md` D6):

| Conjurer, cheapest HP spent % | L60 | L70 | L80 | L90 | L100 (needs 45) |
|---|---|---|---|---|---|
| Before | x32 | x34 | x33 | x27 | x28 |
| **After** | **x35** (accepted, D1) | **37** | **36** | **36** | **x38** |

- Every Conjurer cell improved; no other lineage's cheapest cost moved. B1/B3 pass everywhere. B2 fails:
  the 3 accepted melee near-misses, the accepted L60 cell, and the Conjurer finale.
- **Why the finale differs from the screening (48.9%):** the screening ran on the old, stuck tool choice.
  The amended choice finds Earth Golem + Heir keeping only Attunement IV (which now only boosts the
  hero's Firebolt), with the Golem's Taunt taking half of each boss hit: 38%.
- Conjurer regular fights (best policy): at-level 100%, four and five levels up 99–100%.

## 8. Open after the gate

| # | Item | Notes |
|---|---|---|
| O1 | The Conjurer finale at 38% (needs 45%) | **Accepted by the user 2026-10-29.** Cheapest play: Earth + Heir + Attunement IV. If it's revisited, the candidate levers are the Golem's Taunt share (`COMPANION_TAUNT_SHARE` 0.5) or the Earth pact at the finale |
| O2 | Casters at L10 five levels up: 27% win (Magus, Cleric, Seer) | **Accepted by the user 2026-10-29**, alongside melee's 22–24% (`docs/SPEC-ACADEMY-WEAPON-CHAINS.md` D5). Not caused by this spec: the amended kit tool choice found "Attunement I alone", which the old choice never tried. `docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §8 reported 0% |
