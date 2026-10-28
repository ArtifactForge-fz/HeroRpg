# SPEC — Anima Reckoning: an untyped T3 spell that keeps up with Firebolt

**Status:** READY — the direction (untyped, T3 spell only, a power bump, L80–L90 counts as fine) was
set by the user on 2026-10-29 while workshopping; the open decisions D1–D3 (§5) are recommendations
for the remaining details. Not implemented. Authored 2026-10-29 on branch `v1.11-hero-tree`
(user-directed: "pick up the first follow-up", F2 of `docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §9).
Screened at 300 trials (§3); the implementation gate is owed.

**Relationship to authority:** changes one data entry in `js/data/techs.js`. Uses the archived rule
"non-elemental damage ignores defense" (`docs/DESIGN.md` §4, v1.2 Phase 1 item 7) as shipped; adds
no mechanic and no [revised] tag. Precedent for an ungraded class spell: Vaultbreaker's Reckoning
(`tech_vault_reckoning`, `grade: null`, power 73).

**Interpretation of the request:** the T3 Magus's class damage spell should be worth casting at every
T3 boss (L60–L100), as a Star spell it no longer is once Firebolt's ranks keep rising. Only the T3
spell changes: the T1 (Anima Surge), T2 (Arcane Cataclysm) and Legendary spells keep their elements,
so the L10 five-levels-down fix of `docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` stays intact.

---

## 1. Problem

`docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §8.3: once the boss fixture casts a caster's strongest
Firebolt, a Magus at L60–L100 never casts its class damage spell. Effective power for a prepared
Magus (Int, school skill and Rod included):

| Level | Best Firebolt | Anima Reckoning (T3 Magus, flat 84) | Gap |
|---|---|---|---|
| L60 | V: 577 | 555 | −4% |
| L80 | VI: 803 | 712 | −11% |
| L100 | VII: 1052 | 874 | −17% |

Class spells have one flat power and no school skill (`skill: null`), so they miss the magic-school
bonus (up to +15%, `BALANCE.MAGIC_SKILL_DAMAGE_CAP`) and never gain ranks. At L60–L70 this was already
true before the spell re-taper; at L80–L90 the old fixture only "cast" it because it used the weak
Firebolt VI (51). It is why Test 103 was moved from the L90 boss to L50.

Among the T3 classes only the Magus has a class damage spell: the Cleric's and Seer's T3 techs are
heals and buffs, and the Conjurer's Conflagration is a companion command.

## 2. Design — `js/data/techs.js`, `tech_anima_reckoning`

| Field | Today | New | Tag |
|---|---|---|---|
| `grade` | `'Star'` | **`null`** (non-elemental) | [invented] — fits its desc, "a verdict of pure Anima"; follows the Vaultbreaker's Reckoning precedent |
| `power` | 84 | **95** | [invented], sim-gated (§3); +13%, about +36% over Arcane Cataclysm (70) |

Everything else unchanged: `energyCost` 40, `classOnly`, `classId: 'magus'`, the class ability
`magus_anima_reckoning` (5 Class Levels), the icon and the desc. Effects of `grade: null`:
- no Magic Armor or Armor mitigation (archived non-elemental rule); the half-Armor rule of
  `docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §2.2 doesn't apply to it;
- no elemental resistance or weakness: monsters weak to Star take less from it than before,
  monsters resistant to Star take more;
- the wiki's grade column shows it as non-elemental.

The comments on both fields cite this spec. No save change: the fields are read live.

## 3. Sim gate (screening run 2026-10-29, 300 trials)

**Method.** Real game code in node `vm`, the Anima Reckoning entry patched in memory (scratch
scripts). Full-kit fixture; Magus lineage, every class option, `basic`/`techs`/`kit`, the five T3
bosses; regular checks at-level and five levels up at L10/29/46/64/91.

**Options workshopped** (all class damage spells unless stated):

| Option | Magus casts it, L60–L90 | At L100 | Casters at L10, five levels up | New boss failures |
|---|---|---|---|---|
| Today | never | never | 0% | — |
| Steeper Int factor for class spells | — dropped by the user before screening | | | |
| All class damage spells untyped | yes | never | **97%** (Anima Surge bypasses half Armor) | none |
| +15% school-skill bonus for class spells | yes | never | 0% | **3** (Legendary spells) |
| Anima Reckoning untyped, power 84 | yes (kit keeps it L60–L70 only) | never | 0% | none |
| **Anima Reckoning untyped, power 95** | **yes** | **yes** | 0% | none |

**Power sweep, Anima Reckoning untyped** (Magus; casts per win on `techs` / class options whose `kit`
keeps it, of 4 / cheapest boss HP spent %):

| Power | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|
| 84 | 4.2 / 3 / 42 | 4.5 / 3 / 47 | 4.3 / 0 / 45 | 4.3 / 0 / 47 | 0.0 / 0 / 65 |
| **95** | 3.8 / 3 / 42 | 4.2 / 3 / 47 | 3.9 / 3 / 45 | 3.9 / 3 / 47 | **5.6 / 4 / 64** |
| 100 | 3.6 / 3 / 42 | 4.0 / 3 / 47 | 3.8 / 3 / 45 | 3.8 / 3 / 47 | 5.4 / 4 / 61 |
| 105 | 3.5 / 4 / 42 | 3.9 / 4 / 47 | 3.6 / 3 / 45 | 3.6 / 3 / 47 | 5.2 / 4 / 59 |
| 110 | 3.4 / 4 / 41 | 3.7 / 4 / 45 | 3.5 / 4 / 44 | 3.5 / 4 / 46 | 5.0 / 4 / 57 |

- **95 is the smallest tested power that works at L100**, and it moves the Magus's cheapest boss
  cost by at most 1 point (finale 64%, floor 45%). Every Magus boss cell wins 100%.
- **Regular checks unchanged at every power:** Magus L10 five levels up 0%, at-level 100%, L29+
  five levels up 99–100% (the accepted limitation).
- Not tested: power 90 (D1).

**Implementation gate (owed, 300 trials):** the full 12-lineage kit grid plus the regular checks.
Pass bar: no boss cell newly failing B1/B2/B3; Magus casts it at every T3 boss (`techs` policy, avg
casts > 0) and the kit keeps it in at least one class option at L100; regular checks unchanged.

## 4. Conventions & handoff checklist

- [ ] `js/data/techs.js` `tech_anima_reckoning`: `grade: null`, `power: 95`, comments citing §2.
- [ ] Tests: any expectation built on its grade or power is a stale constant — update, never weaken.
  `tests/test_p6_classes.js` lists the id only. New test: it is ungraded, so a monster's Armor and
  Magic Armor don't reduce it (stubbed RNG, as Test 109 (b) does for a temporary null grade).
- [ ] Test 103 (D2).
- [ ] Wiki shows it as non-elemental, power 95.
- [ ] Save impact: none. Icons, ids, drop tables: none.
- [ ] Changelog line (D3) in the release that ships this.
- [ ] All 16 suites green.

## 5. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| **D1** | Power: 95 (smallest tested that works), or screen 90 first | **95.** The sweep shows a flat cost curve (95 vs 84 moves bosses ≤ 1 point), so a smaller value saves little; 90 risks missing L100 again |
| **D2** | Test 103: keep it at the L50 boss, or move it back to its original L90 boss (`society_anima_horror`), where the Magus casts its class spell again (3.9 per win at power 95) | **Move it back to L90.** It then tests a T3 class spell again, which was its point; record the round trip in the test comment |
| **D3** | Player-facing wording | Changelog draft: "Anima Reckoning, the Magus's verdict of pure Anima, is no longer an elemental spell: it now ignores a monster's armor and magic armor, and hits harder." |

## 6. Out of scope

- The other class damage spells (Anima Surge, Arcane Cataclysm, Runic Severance, Echoing Judgment,
  Vaultbreaker's Reckoning) and the Conjurer's Conflagration.
- A general scaling rule for class spells (class-level ranks, an Academy anchor) — workshopped, not
  chosen.
- The Conjurer + Attunement + Heir boss cells.
