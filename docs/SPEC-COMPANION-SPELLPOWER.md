# SPEC — Companion attacks stop drawing on Attunement and Spell Power (and the armor question)

**Status:** DRAFT — open decisions D0–D4 unresolved (§5). Not implemented. Authored 2026-10-29 on
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

**Interpretation of the request (confirm — D0):** fix the five Conjurer boss cells by changing the
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

Optional: companion damage attacks pay the monster's Magic Armor + `TECH_PHYSICAL_DEFENSE_SHARE` × Armor
when graded, mirroring the hero-spell rule. Screened; see §3 for why it's a decision, not part of
the package.

### 2.3 Player-facing

Changelog draft: "Attunement and Spell Power now strengthen your own spells only. A Conjurer's
companion still grows with your Intelligence, but no longer draws on those bonuses."

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

**Implementation gate (owed, 300 trials):** the full 12-lineage kit grid plus regular checks. Pass
bar: the five Conjurer cells pass; no other cell newly fails; Conjurer at-level 100% (best policy).

## 4. Conventions & handoff checklist

- [ ] `js/core/companion.js`: the `companion: true` flag on the synthetic damage techs (basic attack,
  Water chip, Fire Burn). Not the Water heal.
- [ ] `js/core/battle.js` `techEffectivePower`: skip the `spellpower` buff and the Spell Power stat
  when `tech.companion`; comment citing §2.1 and the two decisions it reverses.
- [ ] A1 only if D2 says so.
- [ ] Tests: `tests/test_v18_engine.js` Test 2 asserts the buff *does* boost a companion tick — that is
  the behavior this spec reverses, so the assertion changes to "does not" (a design change recorded
  here, not a weakened test). Other expectations built on companion damage with Attunement/Spell
  Power are stale constants. New stubbed-RNG test: a companion attack deals the same damage with and
  without Attunement running, while a hero spell still gains from it.
- [ ] `docs/SPEC-TECH-POLARITY.md` §0 finding d and `docs/SPEC-SECONDARY-STATS.md` D7: add a line
  noting they are superseded for companions by this spec.
- [ ] Save impact: none. Ids, icons, drop tables: none.
- [ ] Changelog line (§2.3) in the release that ships this.
- [ ] All 16 suites green.

## 5. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| **D0** | Fix the Conjurer cells through companion damage (tools, not bosses) | **Yes** |
| **D1** | A2: take Attunement and Spell Power out of companion damage — reversing `docs/SPEC-SECONDARY-STATS.md` D7 (your "Yes") and `docs/SPEC-TECH-POLARITY.md` finding d | **Yes.** Those were decided for the retired servitor; flat bonuses sized for hero spells more than double a companion's small hits. A2 alone fixes all five cells |
| **D2** | A1: companion attacks also pay half monster Armor | **Leave it out for now.** It's consistent with hero spells but changes almost nothing (±1 point), and with A2 it put L60 at 34.9%. Revisit if a later grid shows companions too strong against armored targets |
| **D3** | Water's heal keeps Spell Power (heals aren't the problem) | **Keep** |
| **D4** | Player-facing wording | §2.3 draft |

## 6. Out of scope / follow-ups

- **Fixture:** the `kit` policy's 30-fight tool choice sometimes keeps a bad set (§3). Options: compare
  the chosen set against `techs` on the same 30 fights and fall back when it's worse, or use more
  fights.
- Companion HP lost as a boss cost (still a report column, `docs/SPEC-BOSS-SIM-FULL-KIT.md` D5).
- Companion command spells and Water's heal.
