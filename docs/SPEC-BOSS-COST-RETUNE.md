# SPEC — Boss Cost Retune (make the 11 shipped bosses meet the boss cost floor)

**Status:** IMPLEMENTED (uncommitted, not released) — D0–D6 resolved by the user 2026-10-23. Sim gate run 2026-10-23 (§3.3): S1, S2 (prepared fixture), S3 and S4 all pass. Implemented 2026-10-23 (uncommitted): boss data, premium tests, shared prepared-warrior fixture; all 15 suites green.
`docs/SPEC-BOSS-COST-BAND.md` (B2/B2f) **cannot be met by retuning boss stats**: "HP left on win"
barely moves when bosses get stronger, and the finale's "≥ 4 consumables" is reachable only when
the win rate has collapsed. This spec therefore proposes a metric amendment to that contract (D0)
and the boss numbers that meet the amended version. No game code changed. Authored 2026-10-23 as
the follow-up named in `docs/SPEC-BOSS-COST-BAND.md` D9.

**Relationship to authority:** retunes the per-boss `hp` / `damage` premiums in
`js/data/monsters.js` (and the F1 premium note in `js/balance.js` §"F1 notes" item 2, lines
355–359; `docs/SPEC-ARC-BANDS.md` line 16). Those premiums are `[invented]` ("tune each real boss
toward prepared player wins but pays"). Retuning shipped constants breaks the ratchet principle;
the user directed it (`docs/SPEC-BOSS-COST-BAND.md` D9, 2026-10-23), for boss constants only.
Archived intent: "Strategic boss battles" `[archived: reference/site/homepage_2006.md]`. Nothing is
[revised]: no archived rule changes. Every number below is `[invented]`.

**Interpretation of the request (confirm — D0):** "Retune the shipped bosses so every lineage's
cheapest class option meets B2/B2f, without breaking B1 or B3." Taken literally that has no
solution (§3.1). The likeliest intent behind B2 is "a boss must take a real bite out of the hero";
this spec reads it that way and measures the bite directly (**HP spent**, §2.1). *Other reading:*
keep B2/B2f exactly as written and accept that no stat retune can meet them; then the follow-up is a
new mechanic, not a retune (§2.4).

---

## 1. What changes

### 1.1 Baseline (from `docs/SPEC-BOSS-COST-BAND.md` §3.3, v1.12.0, 300 seeded trials)

- B1 (win floor) ✅ everywhere; B3 (cost ceiling) ✅ everywhere (≤ 10% of stock).
- B2/B2f ❌ in 76 of 132 boss × lineage cells; every boss fails for 4–12 lineages. Cheapest options
  end at 57–80% HP left and spend 0–1.2 consumables per win.

### 1.2 Why HP-left doesn't respond (P0 finding)

The fixture heals below 40% HP, and a heal at tier restores most of the bar. So "HP left on win"
mostly reflects how long ago the last heal was, not how hard the fight was. In the sweep, bosses at
up to ×1.5 HP and ×1.5 damage still leave the cheapest option at **69–80% HP**; win rates fall
first (e.g. L10 boss at ×1.5 HP: 8–19% weakest-option win). The consumable path (≥ 3) only opens
once fights are deadly: the finale needs ×3 HP × 1.75 damage before the cheapest build spends ≥ 3,
and by then the weakest option wins **1%**.

### 1.3 After

The cost floor measures **HP spent per win** (§2.1), a quantity that does scale with the boss.
Boss HP and damage premiums go up (§2.2) so every lineage's cheapest option spends at least the
floor, while the weakest option still wins ≥ 85% (finale ≥ 75%).

## 2. Design detail

### 2.1 Proposed amendment to the contract (D0)

| Rule | Today (`docs/SPEC-BOSS-COST-BAND.md`) | Proposed | Tag |
|---|---|---|---|
| B2 band bosses | mean HP left on win ≤ 65% OR ≥ 3 consumables | mean **HP spent per win ≥ 35%** OR ≥ 3 consumables | [invented] |
| B2f finale | HP left ≤ 65% AND ≥ 4 consumables | **HP spent ≥ 45%** on every lineage's cheapest option and on the regression fixture; no consumable requirement (D1, D6) | [invented] |
| Judged on | each lineage's cheapest class option | unchanged | — |

**HP spent per win** = (HP at start − HP at end + HP restored by heals) ÷ max HP, averaged over wins.
It is "how much of the hero's HP bar the boss took", heals included. With no heal it equals
100% − HP left, so 35% spent is the same line as 65% left for a fight that needed no potion.
B1, B3, measurement rules and fixtures are unchanged.

### 2.2 Proposed boss numbers (P0 sweep at 100 trials; confirmed on the lineage grid at 300 trials in §3.3 S1)

Multipliers apply to the boss's current `hp` and `damage` (damage also scales boss techs through
`max(tech.power, 0.70 × damage)` and basic attacks through `0.55 × damage`). Cheapest-option HP
spent and weakest-option win are the P0 sweep values.

| Boss | Today hp / damage | Mult (hp × dmg) | New hp / damage | New premium hp / dmg (over 20+12L / 3+2L) | Cheapest HP spent today → new | Weakest win new |
|---|---|---|---|---|---|---|
| L10 Estari Ruin Warden | 260 / 28 | ×1 / ×1 (no change) | 260 / 28 | +120 / +5 | 39% → 39% ✅ | 93% |
| L18 Foothills Matriarch | 452 / 51 | ×1.25 / ×1.1 | 565 / 56 | +329 / +17 | 27% → 38% ✅ | 100% |
| L25 Juneros Leviathan | 620 / 67 | ×1.5 / ×1.3 | 930 / 87 | +610 / +34 | 19% → 41% ✅ | 100% |
| L32 Kastengard Custodian | 788 / 83 | ×1.75 / ×1.3 | 1379 / 108 | +975 / +41 | 16% → 42% ✅ | 100% |
| L40 Eidas' Echo | 980 / 128 | ×1.25 / ×1.3 | 1225 / 166 | +725 / +83 | 22% → 37% ✅ | 100% |
| L50 Majiku Warlord | 1220 / 188 | ×1.25 / ×1.3 | 1525 / 244 | +905 / +141 | 26% → 50% ✅ | 98% |
| L60 Majiku Ridge Chieftain | 1460 / 223 | ×1.25 / ×1.3 | 1825 / 290 | +1085 / +167 | 20% → 38% ✅ | 100% |
| L70 Ukai Deep Dweller | 1700 / 258 | ×1.25 / ×1.3 | 2125 / 335 | +1265 / +192 | 22% → 40% ✅ | 100% |
| L80 Estari Warden Prime | 1940 / 293 | ×1.25 / ×1.3 | 2425 / 381 | +1445 / +218 | 20% → 38% ✅ | 100% |
| L90 Society Anima Horror | 2180 / 328 | ×1.25 / ×1.3 | 2725 / 426 | +1625 / +243 | 20% → 40% ✅ | 100% |
| L100 Eidas Ascendant | 2900 / 363 | ×1.25 / ×1.1 | 3625 / 399 | +2405 / +196 | 31% → 46% ✅ (finale 45%) | 99% |

- **L40–L90 share one rule:** hp × 1.25, damage × 1.3 on top of today's premiums. For the F1
  bosses (L50–L90) that means hp = 1.25 × (20 + 12L + 12L) and damage = 1.3 × (3 + 2L +
  round(1.5L + 10)), rounded. One formula replaces six hand-set values.
- **L25 and L32** were found by the extended S1 search (§3.3): L25 ×1.5 HP / ×1.3 damage, L32 ×1.75
  HP / ×1.3 damage. Both keep the ×1.3 damage pattern and reach 41–42% HP spent.
- **L10 needs nothing** under the amended metric (cheapest option already spends 39%).

### 2.3 Side effects to expect

- **Expensive builds pay much more.** At ×1.25 / ×1.3 the most expensive option spends up to
  77–171% of its HP bar per win (it drinks 1–3 heals). Still within B3: in the first sweep the
  most expensive option used at most 2.8 of 12 consumables (the finale) at these settings.
- **The cheapest build is almost always the rogue line** (Gambit/Assassin with Runeblade,
  Vaultbreaker or Heir), and casters at L18/L25. A uniform boss buff lifts every lineage to pull
  the rogue line over the line, so warrior and caster lines pay most of the increase.
- **XP/gold unchanged:** premiums for xp (×3) and gold are not touched.

### 2.4 Alternatives considered

| Option | What it does | Why not (now) |
|---|---|---|
| Keep B2/B2f as written | Contract unchanged | No stat retune reaches it (§1.2); bosses stay non-compliant |
| Change the sim's heal policy (heal earlier) | Lowers HP-left numbers | Changes the measurement, not the game; real players won't follow it |
| Boss accuracy vs player dodge (new mechanic) | Targets the rogue line only, leaves others as they are | New `[invented]` mechanic, not a retune. Boss Dexterity can't do it: in the shipped code it only decides who strikes first (`js/core/battle.js:250`), and raising it ×3 changed nothing in P0. Worth its own spec if the uniform buff is judged too harsh on non-rogues (D3) |
| Finale ≥ 4 consumables on every lineage | As written | Needs ≈ ×3 HP × 1.75 damage; weakest option then wins ~1% |

## 3. Balance rationale & sim gate

### 3.1 P0 sweep (2026-10-23, v1.12.0 `a27ad8d`)

Same harness and fixtures as `docs/SPEC-BOSS-COST-BAND.md` §3.3 (12 lineages × every class
option, 6 + 6 stock), 100 seeded trials per cell. Boss `hp` × {1, 1.25, 1.5} and `damage` ×
{1.0 … 1.5}; finale also hp × {2, 2.5, 3}, damage × {1.75, 2}.

Cheapest-option **HP left** on win at the two extremes (it doesn't move):

| Boss | ×1 / ×1 | ×1.5 / ×1.5 | Weakest win at ×1.5 / ×1.5 |
|---|---|---|---|
| L10 | 79% | 69% | 8% |
| L32 | 80% | 77% | 100% |
| L60 | 74% | 72% | 96% |
| L100 | 74% | 75% | 78% |

Cheapest-option **HP spent** (it moves):

| Boss | ×1 / ×1 | ×1.25 / ×1.3 | Weakest win at ×1.25 / ×1.3 |
|---|---|---|---|
| L18 | 27% | 45% | 100% |
| L25 | 19% | 33% | 100% |
| L32 | 16% | 27% | 100% |
| L40 | 22% | 37% | 100% |
| L60 | 20% | 38% | 100% |
| L90 | 20% | 40% | 100% |
| L100 | 31% | 61% | 96% |

### 3.2 Sim gate (before READY)

| # | Cells | Metrics | Pass |
|---|---|---|---|
| S1 | All 11 bosses with §2.2 numbers × 12 lineages × every option, 300 seeded trials; for L25/L32 extend the search (hp × 1.25–2, damage × 1.3–1.8) and pick the smallest change that passes | win, HP spent, HP left, consumables, rounds | B1/B1f on the weakest option; amended B2/B2f on the cheapest option with ≥ 2 points of margin; B3 on the most expensive build |
| S2 | The 7 in-repo regression boss sims (weaker fixtures), 300 seeded trials | same | Win ≥ 85% (finale ≥ 75%); B2f on the finale (HP spent ≥ 45%) |
| S3 | At-level regulars and 5-levels-down cells | win | Unchanged (only boss defs change; confirm no shared-def side effect) |
| S4 | Boss scripts (fortify / enrage / heal amounts scale with the new stats?) | — | Check each `script` amount stays under the §7 "modest" guardrail of `docs/SPEC-V1.4-GAMEPLAY.md` (~15% of the boss's own damage for fortify) |

### 3.3 Sim gate results (2026-10-23, v1.12.0 `a27ad8d` + the §2.2 numbers patched onto the boss defs)

Harness and fixtures as in `docs/SPEC-BOSS-COST-BAND.md` §3.3, plus an HP-spent tally
(damage taken including healed damage, over max HP). Seeded mulberry32, 300 trials per cell.

**S1 — lineage grid ✅ (408 cells, 122,400 fights: 122,280 won, 109 monster fled, 11 lost).**

| Boss | Weakest win (lineage/option) | Cheapest HP spent (lineage/option) | Floor | Max consumables (% of 12) | Rounds |
|---|---|---|---|---|---|
| L10 Ruin Warden | 92% (Magus) | 38% (Gambit) | 35% ✅ | 1.0 (8%) | 9–17 |
| L18 Matriarch | 100% | 38% (Magus) | 35% ✅ | 1.0 (8%) | 6–13 |
| L25 Leviathan | 100% | 41% (Magus) | 35% ✅ | 1.3 (10%) | 7–15 |
| L32 Custodian | 100% | 42% (Gambit/Runeblade) | 35% ✅ | 1.5 (12%) | 9–17 |
| L40 Eidas' Echo | 100% | 38% (Gambit/Runeblade) | 35% ✅ | 1.8 (15%) | 6–12 |
| L50 Warlord | 99% (Ranger) | 49% (Gambit/Runeblade) | 35% ✅ | 2.5 (21%) | 6–12 |
| L60 Ridge Chieftain | 100% | 38% (Assassin/Vaultbreaker) | 35% ✅ | 1.7 (14%) | 5–11 |
| L70 Deep Dweller | 100% | 41% (Assassin/Vaultbreaker) | 35% ✅ | 1.8 (15%) | 6–11 |
| L80 Warden Prime | 100% | 40% (Assassin/Vaultbreaker) | 35% ✅ | 1.6 (14%) | 5–11 |
| L90 Anima Horror | 100% | 41% (Assassin/Vaultbreaker) | 35% ✅ | 1.7 (14%) | 5–10 |
| L100 Ascendant | 99% (Ranger) | 48% (Assassin/Vaultbreaker) | 45% ✅ | 1.9 (16%) | 7–15 |

Every lineage clears B1 on its weakest option and the amended B2/B2f on its cheapest option, with
≥ 3 points of margin everywhere. B3 ✅ (≤ 21% of stock).

**S2 — regression fixtures ❌.** The 7 in-repo boss sims (300 seeded trials):

| Boss | Today: win / HP spent / consumables | Retuned: win / HP spent / consumables | Pass (win ≥ 85%, finale ≥ 75%) |
|---|---|---|---|
| eidas_echo L40 | 100% / 134% / 2.7 | **33%** / 222% / 4.9 | ❌ |
| majiku_warlord L50 | 100% / 202% / 3.4 | **38%** / 322% / 5.6 | ❌ |
| majiku_ridge_chieftain L60 | 100% / 202% / 3.4 | **45%** / 331% / 5.6 | ❌ |
| ukai_deep_dweller L70 | 100% / 217% / 3.7 | **34%** / 344% / 5.7 | ❌ |
| estari_warden_prime L80 | 100% / 207% / 3.5 | **39%** / 337% / 5.8 | ❌ |
| society_anima_horror L90 | 99% / 204% / 3.4 | **28%** / 315% / 5.6 | ❌ |
| eidas_ascendant L100 | 90% / 322% / 5.6 | **52%** / 423% / 7.3 | ❌ |

The regression fixtures are far below the contract's "prepared" build: 3 of 6 gear slots, the 3 / 2
skill points from character creation, no classes. Today they already spend **134–322%** of their HP
bar per boss win, 4–9× the floor, against 16–39% for the cheapest grid build. Any boss buff large
enough to make the strongest builds pay also makes these heroes lose. The in-repo asserts (60% win
floor) would fail for all 7 bosses.

**S3 — regulars ✅.** Only the 11 boss defs change (0 non-boss defs touched). 28 probe cells
(4 lineages × at-level L12/35/60/90 and 5-down L35/60/90, 100 trials) are byte-identical before
and after.

**S4 — boss scripts ✅.** Fortify amounts are flat, so they shrink relative to the new damage
(5.5–7.1% of damage, under the ~15% guardrail). Heals are 10% of max HP, so they grow with the new
HP (e.g. Deep Dweller 170 → 213). Enrage multipliers and the finale's curse are unchanged.

**S2 re-scoped (D5 = a): the regression tests move to the prepared fixture.** The prepared
warrior is the shipped test hero fully geared: sword + shield + Heavy armor in every slot,
half-level skills, its lineage's passives. From the S1 grid, retuned bosses, 300 trials,
Paladin / Shadowknight lines, worst class option:

| Boss | Win | HP spent (floor) | Consumables / win |
|---|---|---|---|
| eidas_echo L40 | 100% | 65–66% (35%) ✅ | 0.8–1.1 |
| majiku_warlord L50 | 100% | 76–77% (35%) ✅ | 1.0–1.5 |
| majiku_ridge_chieftain L60 | 100% | 59–61% (35%) ✅ | 0.7–1.0 |
| ukai_deep_dweller L70 | 100% | 62% (35%) ✅ | 0.7–1.0 |
| estari_warden_prime L80 | 100% | 56–57% (35%) ✅ | 0.6–0.9 |
| society_anima_horror L90 | 100% | 58–60% (35%) ✅ | 0.6–1.0 |
| eidas_ascendant L100 | 100% | 71–74% (45%) ✅ | 0.9–1.2 (no consumable rule, D6) |

**Gate verdict:** S1 ✅, S2 ✅ on the prepared fixture (the finale rule is HP spent ≥ 45% only,
D6), S3 ✅, S4 ✅ — READY. Under-geared heroes (the old test fixtures) are expected to lose most boss
fights after this retune: 28–52% win. That's the accepted design (D5): bosses check preparation.

## 4. Conventions & handoff checklist

- [x] `js/data/monsters.js`: 10 boss `hp` / `damage` lines (L10 unchanged), each
      with a citation comment pointing at this spec.
- [x] `js/balance.js` F1 notes item 2 (lines 355–359) and `docs/SPEC-ARC-BANDS.md` line 16: record
      the new L40–L90 rule.
- [x] `docs/SPEC-BOSS-COST-BAND.md`: D0 amendment applied to the B2/B2f rows and status line (2026-10-23). After D6, update the B2f row again.
- [x] Tests: `tests/test_p3_battle.js` Tests 30/33/36/39/42/45 assert the old premiums exactly
      (`hp === base + 12 * L`, `damage === base + round(1.5L + 10)`, the finale's 1.4× HP premium) —
      update the constants, keep the "finale premium exceeds the standard one" checks. Boss sim
      asserts follow `docs/SPEC-BOSS-COST-BAND.md` §4, rewritten for HP spent. Any test that
      hard-codes a boss's HP or damage elsewhere (grep the 11 ids) goes stale.
- [x] **Regression fixture (D5):** (`tests/boss_fixture.js`) replace the 7 boss-sim builders (`buildLevel40Warrior` in
      `tests/test_p6b_content.js`, `buildLevel50KuraanWarrior` and its 5 siblings in
      `tests/test_p3_battle.js`) with one shared prepared-warrior builder: Human, stats
      vit/end/str/str/str, skills at half level (Swords, Heavy Armor, Shields, Dodge, Double Attack),
      best non-unique non-cursed gear in every slot (weapon, shield, body, head, legs, feet), the
      warrior lineage open at that level with every passive bought (Warrior → Crusader → Paladin),
      6 best heals + 6 best Crystals. Policy: Crystal before the Energy pool empties (fixes the dead
      `!canAct` branch), heal below 40%. Track HP spent (heals included). Asserts: win ≥ 85%
      (finale ≥ 75%), HP spent ≥ 35% (finale ≥ 45%), consumables ≤ 50% of stock. Keep 30–60
      unseeded trials (`docs/SPEC-BOSS-COST-BAND.md` D6); the expected margins (§3.3) are wide.
- [x] Drop tables, items, icons, ids: none. Save impact: none (monster defs aren't saved).
- [ ] Changelog (player-facing draft): "Bosses fight harder: every boss from the Foothills
      Matriarch on has more health and hits harder. Come prepared."
- [x] Wiki: boss HP/damage columns update automatically (generated from `Game.Data`).

## 5. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| **D0** | Amend B2/B2f to **HP spent per win** (§2.1), or keep the contract as written and drop the retune | **Resolved (user accepted the recommendation, 2026-10-23):** **Amend.** HP left can't be moved by boss stats, so as written the contract is unreachable |
| **D1** | Finale "≥ 4 consumables": keep it for every lineage (unreachable), judge it on the regression fixture only, or drop it | **Resolved (user accepted the recommendation, 2026-10-23):** **Regression fixture only** (it already spends 5.6), with HP spent ≥ 45% on every lineage's cheapest option (superseded by D6: the consumable half was dropped) |
| **D2** | One rule for L40–L90 (×1.25 HP, ×1.3 damage) or per-boss minimal values | **Resolved (user accepted the recommendation, 2026-10-23):** **One rule.** Simpler, testable as a formula; every boss in that range passes with margin |
| **D3** | A uniform buff makes warrior and caster lines pay much more to catch the rogue line | **Resolved (user accepted the recommendation, 2026-10-23):** **Accept for now**; if playtests find L40+ bosses too punishing for non-rogues, a boss-accuracy spec (§2.4) can lower the buff again |
| **D4** | HP-spent floor values: 35% band, 45% finale | **Resolved (user accepted the recommendation, 2026-10-23):** **35 / 45.** 35% matches today's 65%-left line for a potion-free fight; 45% gives the finale its premium |
| **D5** | **S2 fails:** the retune that makes prepared heroes pay drops the in-repo test fixtures (a modest warrior: 3 gear slots, creation skills, no classes) to 28–52% boss win. Options: (a) accept that bosses check preparation, and move the regression tests to the contract's prepared fixture (best gear in every slot, half-level skills, every passive); (b) a smaller uniform buff plus a rogue-targeted boss-accuracy mechanic (its own spec), though non-rogue prepared builds still sit at 25–31% HP spent at L32–L90 and need some buff; (c) lower the floor | **Resolved (user, 2026-10-23): (a).** Bosses check preparation; the regression tests move to the prepared fixture (§4). Under-geared heroes are expected to lose most boss fights |
| **D6** | With the prepared fixture, the finale's "≥ 4 consumables on the regression fixture" (D1) can't hold: the prepared warrior spends 0.9–1.2 per win. Options: (a) drop the consumable half, so the finale rule is HP spent ≥ 45% everywhere; (b) lower it to what prepared builds spend (≥ 1); (c) keep ≥ 4 and buff the finale further (P0: needs about ×3 HP × 1.75 damage, weakest option then wins ~1%) | **Resolved (user, 2026-10-23): (a).** The finale rule is HP spent ≥ 45% everywhere, with no consumable requirement. HP spent ≥ 45% (vs 35% for band bosses) already gives the finale its premium; prepared heroes spend 71–74% there |

## 6. Out of scope

- New mechanics (boss accuracy vs dodge, boss-tuned telegraphs).
- Regular monsters, champions, the 5-levels-down / Fear clause.
- XP, gold and drop tables of bosses.
- The hard-coded `D:/` test path (`docs/SPEC-BOSS-COST-BAND.md` §4).
