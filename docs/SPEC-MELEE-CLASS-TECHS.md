# SPEC — Melee class techs that work for melee builds (and a Seer's Ward a Seer can use)

**Status:** IMPLEMENTED (commit `93430cd`) on branch `v1.11-hero-tree`; not yet merged to `main`, released or deployed. The package is O6 + W1. D1–D8
were resolved by the user on 2026-10-28, all as recommended, with distinct twin names (§5). The
implementation and its grid re-run are in §7. Authored 2026-10-28 on branch `v1.11-hero-tree`,
on top of the boss-sim fixture of `docs/SPEC-BOSS-SIM-TECHS.md`. Fixes that spec's follow-ups
**F2** (Finding 2, §3.2) and **F3** (Finding 4, §3.4).

**Relationship to authority:** changes the data shape of 13 shipped class techs and one class buff
in `js/data/techs.js`, and adds three Legendary techs. Every number on those techs is `[invented]`
(the archive has no per-technique data, `docs/DESIGN.md` §3), and so is every number below. No
archived rule changes, so nothing is `[revised]`. The bosses, the boss contract
(`docs/SPEC-BOSS-COST-BAND.md` §2, amended by `docs/SPEC-BOSS-COST-RETUNE.md`) and every
`js/balance.js` constant stay as they are. The ratchet principle holds: the thing being tuned is
the broken techs, not the shipped bosses, formulas or the Academy weapon chains.

**Interpretation of the request (confirm — D1):** "A class tech should be a real button for the
class that buys it, without making any boss free." Read that way, the target is: a melee hero's
signature tech beats its basic attack, roughly as a caster's class techs compare with Firebolt,
and every lineage still clears B1/B2/B3. *Other reading:* make the techs as strong as the Academy
weapon chains (Cleave V is ×2.9). That's option O1, and it fails B2 in 59 of 88 melee cells (§3.2).

---

## 1. Problem

### 1.1 Melee class techs scale with the wrong stat (F2)

The 13 damage techs on the warrior and thief lines are non-weapon techs (no `weaponTech`):

| Line | Techs |
|---|---|
| Warrior (T1) / Gladiator, Crusader (T2) | `tech_crushing_blow`; `tech_execution_blow` |
| Shadowknight, Berserker, Paladin, Warden (T3) | `tech_shadow_blade`, `tech_berserker_frenzy`, `tech_paladin_smite`, `tech_warden_bulwark` |
| Thief (T1) / Rogue, Mercenary (T2) | `tech_quick_stab`; `tech_shadowstep_strike`, `tech_efficient_strike` |
| Gambit, Assassin, Ranger, Dragoon (T3) | `tech_dice_throw`, `tech_lethal_strike`, `tech_ranger_volley`, `tech_dragoon_leap` |

So they deal `power × (1 + Int × 0.02)` (`techEffectivePower`, `js/core/battle.js`) and roll the
Intelligence spell hit (`BALANCE.INT_SPELL_HIT_*`: 75% + 1%/Int − 1%/monster level, floor 40%). A
prepared melee hero has Int 5, so the multiplier is ×1.1, and against a boss the hit chance sits at
the 40% floor. The three Legendary techs (`tech_runic_severance`, `tech_vault_reckoning`,
`tech_echoing_judgment`) behave the same way on a melee build.

Probe (this spec, §3.1 method), boss HP removed per action, 100 seeded openings:

| Build, boss | Basic attack | Class techs (× basic) |
|---|---|---|
| Paladin, L10 | 32 | Crushing Blow 13 (0.41) |
| Gambit, L25 | 110 | Quick Stab 10 (0.09) |
| Shadowknight, L60 | 297 | Execution Blow 27 (0.09), Shadow Blade 32 (0.11) |
| Assassin, L70 | 437 | Shadowstep Strike 19 (0.04), Lethal Strike 37 (0.08) |
| Paladin + Heir, L100 | 386 | Smite 4 (0.01), Echoing Judgment 17 (0.04) |
| Berserker + Vaultbreaker, L100 | 515 | Frenzy 33 (0.06), Vaultbreaker's Reckoning 33 (0.06) |
| Magus + Heir, L100 (for contrast) | 575 | Anima Reckoning 291 (0.51), Echoing Judgment 699 (1.22) |

The boss-sim `techs` policy casts **no** class tech for any melee lineage (0 of 272 class options,
§3.2). Every one of these techs is a wasted turn for the class that buys it.

### 1.2 Seer's Ward buffs the wrong number (F3)

`tech_seers_ward` is an untyped `buff` (+40 for 4 turns). Untyped buffs feed only weapon damage
(`playerBuffDamageBonus`, read by `attack()`). A Seer's basic action is Firebolt, so the cast only
costs a turn and 26 Energy: in the `techs` policy, Seer fights at L60–L100 take 2.6–4.5 more rounds
and cost 13–43 more points of HP than without it (§3.4).

## 2. Design

### 2.1 Options weighed

| # | Option | Mechanism | New code |
|---|---|---|---|
| O1 | Weapon techs, **Academy band** | `weaponTech: true` + `powerMult` (× `getDamage`, armor-mitigated, monster dodge per hit, no Int roll). Anchors T1 ×1.5 (Cleave I), T2 ×2.3 (Cleave III), T3 ×2.6 (Cleave IV). Legendaries get a weapon "Blade" twin (§2.3) on the T3 anchor | none (data) |
| O2 | Weapon techs, **caster band** | As O1, anchors T1 ×1.3, T2 ×1.5, T3 ×1.7; Legendary twins on ×1.7 | none (data) |
| O3 | **Strength/Dex chassis** | Keep `power`; new field `scaleStat`: the 13 use max(Str, Dex) in place of Int and roll monster dodge (as `physicalRoll`); Legendaries use the best of Int/Str/Dex | `battle.js` (2 sites) |
| O4 | O2 + offhand swing | O2, plus the shipped `offhandFollowup` (Crosscut) on Quick Stab, Shadowstep Strike, Dice Throw, Lethal Strike | none (data) |
| O5 | O2 for the 13, O3 for Legendaries | No twins; the 3 Legendary techs get `scaleStat: 'best'` | `battle.js` (2 sites) |
| **O6** | **O2 for the 13, twins on a lower anchor** | Legendary twins on ×1.3 instead of ×1.7 (**recommended**, D2) | none (data) |
| R | O6 + O4's offhand swing | — | none (data) |

**Per-tech multiplier rule (O1/O2/O6):** `powerMult = tierAnchor × power ÷ anchorPower`. The
anchor techs are Crushing Blow (power 16) for T1, Execution Blow (55) for T2, Shadow Blade (66)
for T3 and the twins. This keeps the shipped power ratios inside each tier (Frenzy stays +9% over
Shadow Blade, Bulwark Strike stays the weakest T3 tech, and so on). **Floor:** a whole cast is
never weaker than the T1 anchor (`powerMult × hits ≥ T1 anchor`). That lifts two-hit techs and the
cheap "economy" techs (Efficient Strike at 10 Energy, Dice Throw at 18), which the ratio would
otherwise push under ×1. Energy costs, `hits`, `classOnly` and `classId` are unchanged. `[invented]`

Why the caster band: a caster's class techs reach 0.4–1.2× Firebolt at L100 (table §1.1), and Echoing
Judgment is the only one that clearly beats it. O2's anchors put a melee T3 tech at 1.0–1.5× a
basic attack on the same probe (§3.1), the same shape.

### 2.2 Recommended: O6 values

Every value `[invented]` (rule above, anchors T1 1.3 / T2 1.5 / T3 1.7 / twins 1.3; sim-locked §3):

| Tech | Class | Energy (unchanged) | Hits | Shipped power | **powerMult** | Notes |
|---|---|---|---|---|---|---|
| `tech_crushing_blow` | Warrior | 14 | 1 | 16 | **1.3** | anchor |
| `tech_quick_stab` | Thief | 14 | 1 | 16 | **1.3** | |
| `tech_execution_blow` | Gladiator | 26 | 1 | 55 | **1.5** | anchor |
| `tech_shadowstep_strike` | Rogue | 18 | 2 | 16 | **0.65** per hit | floor (ratio gave 0.44) |
| `tech_efficient_strike` | Mercenary | 10 | 1 | 30 | **1.3** | floor (ratio gave 0.82) |
| `tech_shadow_blade` | Shadowknight | 30 | 1 | 66 | **1.7** | anchor |
| `tech_berserker_frenzy` | Berserker | 32 | 1 | 72 | **1.85** | |
| `tech_paladin_smite` | Paladin | 30 | 1 | 60 | **1.55** | was Light-graded (D4) |
| `tech_warden_bulwark` | Warden | 28 | 1 | 52 | **1.34** | was Light-graded (D4) |
| `tech_dice_throw` | Gambit | 18 | 1 | 45 | **1.3** | floor (ratio gave 1.16) |
| `tech_lethal_strike` | Assassin | 30 | 1 | 68 | **1.75** | |
| `tech_ranger_volley` | Ranger | 30 | 2 | 34 | **0.88** per hit | |
| `tech_dragoon_leap` | Dragoon | 30 | 1 | 65 | **1.67** | |

Each becomes `weaponTech: true`, `grade: null`, `powerMult` as above, and drops `power`. That is
the Feature C shape (Cleave, Impale, Vital Strike). Physical techs are mitigated by Armor, never
Magic Armor (`js/data/techs.js` Feature C header). `infobox.js` already shows Power Multiplier/Hits
for this shape. Descriptions lose "Light-grade" wording where it no longer applies (D4).

### 2.3 Legendary techs: a weapon twin (O6)

The three Legendaries are open to every lineage, and on Int builds their spell form already works
(Finding 3 of `docs/SPEC-BOSS-SIM-TECHS.md`). Converting them would break casters. So each
Legendary tech ability grants **both** forms, through the existing `techIds` array (the Conjurer
pact precedent, `js/core/classes.js` `buyAbility`):

| Legendary | Spell form (unchanged) | New weapon twin (name: D3) | Energy | **powerMult** |
|---|---|---|---|---|
| Runeblade of Kuraan | `tech_runic_severance` (46, Light) | `tech_runic_severance_blade` | 28 | **1.3** (floor; ratio gave 0.91) |
| Vaultbreaker | `tech_vault_reckoning` (73) | `tech_vault_reckoning_blade` | 33 | **1.44** |
| Heir of the Echo | `tech_echoing_judgment` (92, Light) | `tech_echoing_judgment_blade` | 44 | **1.81** |

Twins: `weaponTech: true`, `grade: null`, `classOnly: true`, `classId` = the Legendary, same
Energy as the spell form. `[invented]`. The player slots whichever suits the build. On a Rod caster
the twin is the weaker form (Magus + Heir at L100: Blade 0.73× basic vs the spell's 1.22×), so
casters are unaffected (§3.3). The alternative (O5) needs no new ids and no save migration, but it
changes `battle.js` and puts the Warden L60 cell exactly on the 35% floor (D2).

### 2.4 Seer's Ward becomes a Spell Power buff (W1)

`tech_seers_ward` gains `statKind: 'spellpower'`. Its power stays 40, its duration 4 and its cost
26. It joins the typed-buff path that Attunement already uses: flat power added before the
Int/skill/Rod multipliers in `techEffectivePower` (`js/core/battle.js`; SPEC-TECH-POLARITY §2.2).
40 sits between Attunement III (40, 5 turns) and IV (60), which fits a T3 class signature
`[invented]`. It no longer adds to weapon damage. A Seer swinging a sword loses a buff it never had
a reason to use (D6). Ability and tech descriptions change "adding to Damage" to "adding to Spell
Power".

Alternative W2 (same, power 24) was strictly worse: it costs the same turn for less (§3.4).

## 3. Sim gate (run 2026-10-28)

### 3.1 Method

`/balance-sim` on the in-repo fixture: real game code in node `vm` (the working tree at `191d395`
plus the uncommitted `tests/boss_fixture.js` of `docs/SPEC-BOSS-SIM-TECHS.md`). Variants are
patched into `Game.Data` in memory. O3/O5 also patch `battle.js` source in memory, at the two sites
named in §2.1. Nothing on disk changed. `BossFixture.simulate(…, { policy: 'techs', seed: 1000 })`,
**300 seeded trials per cell**, 11 bosses × every lineage × every `classOptions` option. Judging
follows `docs/SPEC-BOSS-SIM-TECHS.md` §3: the player picks the policy per option (B1 best win, B2
lowest HP spent, B3 most consumables), against a `basic` grid on the same seeds. Probes: the boss HP
removed by an opening action, 100 seeded openings (seeds 60000+). Scripts are in the session
scratchpad (ephemeral, the repo's sim convention).

**Baseline reproduces the 2026-10-28 grid** within 1–4 points on other seeds (e.g. Shadowknight
L25 93% vs 95%, Ranger L50 117% vs 121%), and B1/B2/B3 pass for every melee and non-Conjurer
caster lineage.

**Conjurer not judged here.** During this run another session was editing the Water pact
(`js/core/companion.js`, `js/data/companions.js`, uncommitted), so Conjurer cells reflect a moving
target. None of these options touches a Conjurer tech. The twins can't be cast by a Rod caster
(§3.3). Re-check the Conjurer in the Water-pact spec's own grid.

### 3.2 Melee lineages: options compared (88 boss × lineage cells)

| Option | B2 fails | Closest band cell (≥ 35%) | Closest finale cell (≥ 45%) | Options casting ≥ 1 tech per win | Mean casts / win | Mean rounds | HP spent drop vs baseline (mean / max) |
|---|---|---|---|---|---|---|---|
| Baseline | 0 | 43% (L10 Gambit) | 58% (Assassin) | 0 / 272 | 0.0 | 9.6 | — |
| O1 Academy band | **59** ❌ | 23% (L40 Gambit) | 27% (Assassin) | 263 / 272 | 4.6 | 5.0 | 37 / 95 |
| O2 caster band | **5** ❌ | 33% (L40 Gambit/Assassin) | 38% (Assassin) | 216 / 272 | 4.9 | 7.2 | 19 / 75 |
| O3 Str/Dex chassis | 0 | 35% (L60 Warden) | 58% (Assassin) | 130 / 272 | 3.4 | 8.9 | 6 / 74 |
| O4 (O2 + offhand) | **5** ❌ | 33% | 38% | — (twinblades only) | — | — | — |
| O5 (O2 + `best` Legendaries) | 0 | 35% (L60 Warden) | 50% (Assassin) | 199 / 272 | 5.0 | 7.8 | 15 / 74 |
| **O6** (recommended) | **0** ✅ | **37%** (L10 warrior line) | **49%** (Assassin) | 196 / 272 | 5.0 | 8.0 | 14 / 52 |
| R (O6 + offhand) | **1** ❌ | 37% | 43% (Assassin + Vaultbreaker) | 221 / 272 | 5.5 | 7.9 | 14 / 52 |

B1 and B3 hold for every option: weakest melee option ≥ 98% win, at most 2.5 of 12 consumables.
- **O1** makes melee techs ~2–3× a basic attack (Echoing Judgment Blade 3.1×, Frenzy 2.3×). Fights
  halve in length, and every lineage with a Legendary falls to 23–33% at L32–L100.
- **O2's five failures** are all twinblades with the Heir's twin (×2.37, 2.0× basic): Gambit and
  Assassin at L40 (33%), Assassin at L60 (33%), and both at the finale (45%→44.9%, 38%). Lowering
  only the twin anchor (O6) clears all five.
- **O3** passes, but most techs still lose to the basic attack (Crushing Blow 0.2×, Quick Stab
  0.2–0.3×, Shadow Blade 0.86× at L60). Fewer than half the options ever cast a tech. It also opens
  the L10 5-down cell widest (§3.5).
- **O4/R:** the offhand swing lifts twinblade techs by about 0.2× basic (Lethal Strike 1.00→1.17×)
  and costs the finale: Assassin + Vaultbreaker drops to 43%.

**O6 grid, melee lineages**: cheapest option HP spent per win % / weakest option win %. All pass.
Band bosses need ≥ 35%, the finale ≥ 45%:

| Boss | SK | Bers | Pal | Ward | Gambit | Assn | Ranger | Drag |
|---|---|---|---|---|---|---|---|---|
| L10 | 37/100 | 37/100 | 37/100 | 37/100 | 43/100 | 43/100 | 41/100 | 56/100 |
| L18 | 61/100 | 61/100 | 61/100 | 61/100 | 66/100 | 66/100 | 67/100 | 68/100 |
| L25 | 79/100 | 79/100 | 79/100 | 79/100 | 66/100 | 66/100 | 88/100 | 89/100 |
| L32 | 74/100 | 74/100 | 74/100 | 74/100 | 46/100 | 46/100 | 73/100 | 74/100 |
| L40 | 49/100 | 49/100 | 48/100 | 48/100 | 44/100 | 44/100 | 67/100 | 68/100 |
| L50 | 62/100 | 62/100 | 58/100 | 58/100 | 55/100 | 55/100 | 90/98 | 90/99 |
| L60 | 49/100 | 47/100 | 49/100 | 47/100 | 47/100 | 50/100 | 72/100 | 68/100 |
| L70 | 52/100 | 48/100 | 52/100 | 51/100 | 52/100 | 52/100 | 77/100 | 75/100 |
| L80 | 47/100 | 45/100 | 49/100 | 48/100 | 53/100 | 50/100 | 72/100 | 69/100 |
| L90 | 49/100 | 47/100 | 52/100 | 51/100 | 53/99 | 51/100 | 73/100 | 73/100 |
| L100 | 59/100 | 55/100 | 62/100 | 62/100 | 59/100 | 49/100 | 81/100 | 86/100 |

Baseline for comparison (same seeds): warrior line 49/78/93/74/72/85/66–68/66–70/61–65/63–67/79–82,
Gambit/Assassin 43/66/66/46/47/61/50–54/52–56/50–53/51–53/58–64. The biggest cost drops come where
the Heir's Blade or the T3 tech lands: warrior line −12 (L10), −24 (L40), −14 to −23 (L60–L100);
Ranger/Dragoon −10 to −33.

O6 probe (× basic attack; the 13 techs share O2's anchors): Crushing Blow 0.87–1.19, Quick Stab
0.73–1.04 (twinblades lose the offhand swing), Efficient Strike 0.99–1.04, Execution Blow 1.02–1.18,
Shadow Blade 1.18, Frenzy 1.48, Smite 1.25, Bulwark 0.90, Lethal Strike 1.00, Volley 1.25, Echoing
Judgment Blade 1.48 (Paladin), Vaultbreaker's Reckoning Blade 1.13 (Berserker), Runic Severance
Blade 0.74 (Gambit). Dragoon's Leap wasn't probed separately; the grid casts it. Techs under 1.0× are still not
cast by the policy. That's mostly the twinblade kit and Bulwark Strike late (D5).

### 3.3 Casters (Magus, Cleric, Seer) under the final package (O6 + W1)

Magus and Cleric: **0 of 66 class-option cells changed** against the baseline grid, bit for bit.
The twins exist on their Legendaries, but none out-damages Firebolt, so the policy never casts one.
B1/B2/B3 pass for all three lineages (closest: Cleric 40% at L32/L60).

### 3.4 Seer's Ward

`techs` policy, Seer HP spent per win (baseline → W1) and rounds:

| Boss | Seer (no Legendary) | + Heir (the cheapest option) | Rounds, Seer |
|---|---|---|---|
| L60 | 92% → 61% | 61% → 44% | 8.2 → 5.2 |
| L70 | 102% → 69% | 70% → 49% | 8.9 → 5.9 |
| L80 | 137% → 83% | 68% → 49% | 12.1 → 7.2 |
| L90 | 141% → 88% | 72% → 52% | 11.9 → 7.2 |
| L100 | 147% → 95% | 108% → 79% | 14.3 → 9.0 |

The Ward goes from a penalty (the `basic` policy beat `techs` in every cell) to a gain. Casting it
now beats not casting it (`basic`: L60 Seer 65%, 5.6 rounds). Player's-choice verdict, cheapest
Seer option: 44 / 49 / 49 / 52 / 79 (baseline 57 / 64 / 68 / 72 / 95). B2 holds, with the L60
cell 9 points over the floor. W2 (power 24): every cell is 5–16 points costlier than W1 and still
casts, so it fixes the bug at less payoff.

### 3.5 At-level regulars and 5-levels-down (melee, `techs` policy, 300 trials)

At-level: 100% win for every option at L10/29/46/56/64/76/91 (Paladin, Gambit, Dragoon).
5-down (regular monster 5 levels above), win %:

| Level | Baseline (Pal / Gam / Drag) | **O6** | O3 | Baseline + Academy rank-I weapon tech |
|---|---|---|---|---|
| L10 | 1 / 0 / 0 | **69 / 6 / 0** | 86 / 29 / 45 | **91 / 72 / 65** |
| L29 | 91 / 83 / 75 | 92 / 82 / 84 | 91 / 83 / 75 | 95 / 90 / 91 |
| L46, L56 | 100 / 100 / 100 | 100 / 100 / 100 | — | — |
| L64 | 99 / 87 / 93 | 100 / 89 / 98 | — | — |
| L76 | 100 / 90 / 96 | 100 / 91 / 99 | — | — |
| L91 | 100 / 89 / 95 | 100 / 88 / 99 | — | — |

**New finding (pre-existing, not caused here):** the L10 5-down cell is already open in the
shipped game. Cleave I, Vital Strike I and Impale I (Academy, 2 Training Points, skill 0) take a
prepared L10 melee hero from 0–1% to 65–91% against a monster 5 levels up. The boss fixture never
learns Academy techs, so no grid has seen it. Any ×>1 weapon multiplier does this: before the armor
subtraction it turns a fear-reduced hit of ~armor into real damage. O6's Crushing Blow (×1.3)
opens L10 for the Paladin (69%), less than Cleave I does. From L29 up, 5-down is already broken
(the accepted Fear-sustain limitation, `docs/DESIGN.md` §4), and O6 moves it by 0–9 points. Lowering
the T1 anchor closes L10 at a cost: ×1.15 → Paladin 18%, ×1.0 → 3%, but then no T1 tech is cast
at-level either (D7).

## 4. Conventions & handoff checklist (for the implementer, once D1–D8 are settled)

- [ ] `js/data/techs.js`: the 13 techs → `weaponTech: true`, `grade: null`, `powerMult` (§2.2),
  drop `power`; each value with an `[invented]` citation comment naming this spec and the rule.
  Keep `hits`, `energyCost`, `classOnly`, `classId`. Update the class-tech block header comments
  (they currently say "non-weapon … Intelligence hit/miss check").
- [ ] `js/data/techs.js`: three `_blade` twins (§2.3); `js/data/classes.js`: the three Legendary
  tech abilities → `techIds: [spell, twin]`. Ability descs mention both forms.
- [ ] `js/data/techs.js` `tech_seers_ward`: `statKind: 'spellpower'`; tech + ability desc wording.
- [ ] **Save migration** (v12 → v13): owners of a Legendary tech ability get the twin added to
  `c.techs` (unslotted). Chain test v1→v13 (CLAUDE.md "Save versioning").
- [ ] **Icons:** three new `assets/icons/<twin id>.png`, hash-distinct (`test_icons.js`).
- [ ] Tests: `test_p6_classes.js` `CLASS_TECH_IDS` gains the twins. `test_p3_battle.js` Test 25
  uses Crushing Blow as its "grade:null non-weapon tech ignores Magic Armor" example, so it moves to
  `tech_vault_reckoning`, the only such tech left. `test_p6_classes.js` ~l.556–579 casts Crushing
  Blow with RNG 0.5 to pass the Int roll. It now rolls monster dodge, so re-check that the stub
  still lands it. New stubbed-RNG test: a converted tech deals `getDamage × powerMult − armor`,
  and a twin is granted with its Legendary. New regression cell in `test_p3_battle.js`: a melee
  lineage with techs at a boss casts class techs (`avgCasts > 0`) and still pays B2 (e.g. Assassin
  + Heir at L100, sim 49%; the test floor stays at the B2 line, per `docs/SPEC-BOSS-COST-BAND.md`
  §2 measurement rules).
- [ ] Re-run this grid (all 12 lineages, Conjurer included once the Water pact lands) on the
  implemented code, and paste the table into the implementation report.
- [ ] Wiki/changelog wording at release (player-facing: "Warrior and Thief class techniques now
  strike with your weapon"; "Seer's Ward now adds Spell Power").
- [ ] All 15 suites from a scratch copy with the `D:/` base path rewritten (CLAUDE.md ops note).

## 5. Open decisions

| # | Decision | Recommendation |
|---|---|---|
| **D1** | Target strength: caster band (a T3 melee tech ~1.0–1.5× a basic attack) or the Academy band (×1.5/2.3/2.6, ~2–3×) | **Caster band.** The Academy band fails B2 in 59 of 88 cells; the caster band mirrors what Int classes get from theirs |
| **D2** | Legendary techs on melee builds: weapon twin at ×1.3 anchor (O6), twin at ×1.7 (O2: fails 5 cells), or Str/Dex/Int "best" chassis on the existing tech (O5: new `battle.js` field, no new ids/icons/migration, L60 Warden exactly at 35%) | **O6 twin at ×1.3.** Data-only engine-wise, widest margins (37% / 49%). Cost: 3 ids, 3 icons, a save migration |
| **D3** | Twin names | "Runic Severance (Blade)" style, or distinct names (e.g. "Severing Edge", "Vault-Breaker's Blow", "Echo of the Blade"). Recommend distinct names: the techs list shows names, not ids |
| **D4** | Smite / Bulwark Strike lose the Light grade (physical techs are graded null by convention; the sim ran with null) | **Drop the grade**, keep the Light flavor in the desc. Keeping it would make the first graded weapon techs (resistance + Armor both apply), unsimmed |
| **D5** | Twinblade techs (Quick Stab, Shadowstep, Dice Throw) and late Bulwark Strike stay under 1.0× basic, so Gambit/Assassin rarely cast them | **Accept for now.** The offhand follow-up (R) fixes the feel but breaks the finale for Assassin + Vaultbreaker (43%). Revisit with a per-tech tune if playtest says so |
| **D6** | Seer's Ward: Spell Power at 40 (W1), at 24 (W2), or leave it untyped (melee-only buff) | **W1 (40, Spell Power).** Turns a wasted turn into the Seer's best opener; Seer still pays ≥ 44% |
| **D7** | T1 anchor ×1.3 opens the L10 5-down cell for the warrior line (Paladin 1%→69%) | **Keep ×1.3** and log it with the pre-existing Academy hole (rank-I weapon techs already give 65–91%). ×1.15 → 18%, ×1.0 → 3% but T1 techs go unused at-level. Fixing L10 5-down properly is the follow-up F2 below, not this spec |
| **D8** | Radiant Smite (Crusader heal tech) also scales with Int (`1 + Int × 0.01`) and heals ~50 on a melee build, under the heal item | **Out of scope here**; listed as follow-up F3. Same root cause; the fix is a heal-side mechanic, not a `powerMult` |

## 6. Follow-ups (not decided here)

| # | Item | Notes |
|---|---|---|
| F1 | Conjurer under this package | Re-run once the Water-pact change lands; no Conjurer tech changes here |
| F2 | Academy weapon techs vs 5-down at L10 — **done** (`docs/SPEC-ACADEMY-WEAPON-CHAINS.md`: 45–95% → 0–24%, accepted) | Pre-existing hole found in §3.5 (Cleave I / Vital Strike I / Impale I: 65–91% win, 5 levels down). No grid models Academy chains |
| F3 | Radiant Smite on melee builds | D8 |
| F4 | Boss grid with Academy chains | Real melee players have Cleave V (×2.9) at L60. The `techs` policy only knows class techs, so melee boss costs are optimistic. Same gap as F4 of `docs/SPEC-BOSS-SIM-TECHS.md` (limit breaks, Defend, shrine buffs) |

## Checklist

- [x] Problem probed on the real code (§1).
- [x] Seven options simmed on the full boss grid, 300 seeded trials, every lineage × class option
  (§3.2; Conjurer excepted, §3.1).
- [x] Casters unchanged under the final package (§3.3); Seer's Ward variants (§3.4).
- [x] At-level and 5-down spot checks (§3.5).
- [x] D-table for the user (§5). No game code changed.

## 7. Implementation (2026-10-28)

**Decisions as resolved by the user:** D1 caster band; D2 O6, weapon twins at ×1.3; D3 distinct names (Severing Edge, Vault-Breaker's Blow, Echo of the Blade); D4 drop the Light grade; D5 accept; D6 W1; D7 keep ×1.3; D8 out of scope.

**What changed**

| File | Change |
|---|---|
| `js/data/techs.js` | The 13 techs → `weaponTech: true`, `grade: null`, `powerMult` (§2.2 values), `power` removed; descriptions of Crushing Blow, Smite and Bulwark Strike reworded as weapon blows. Three twins added (§2.3). `tech_seers_ward`: `statKind: 'spellpower'`, `chain: 'SeersWard'`, new desc. Class-tech header comment notes the change. |
| `js/data/classes.js` | The three Legendary tech abilities grant `techIds: [spell, twin]`, with descriptions that name both forms. Smite, Bulwark Strike and Seer's Ward ability descriptions match the techs. |
| `js/core/save.js` | New `grantAbilityTechs()`, run on every load next to `sanitizeRetired()`. It adds any tech a bought ability grants but the save lacks, unslotted, with one load notice per tech. |
| `assets/icons/` + `assets/CREDITS.md` | Three twin icons, derived from the spell-form tiles (mirrored, steel-tinted, blade line), byte-distinct. |
| `tests/test_p3_battle.js` | Test 25 uses `tech_vault_reckoning` (the last grade-null non-weapon class tech). New Tests 104 (the 13 values, exact `getDamage × powerMult − Armor` damage, no-weapon refusal), 105 (Seer's Ward: +40 Spell Power exactly, no weapon Damage, refresh instead of stack) and 106 (Paladin with techs at L80 casts techs and still pays B2). |
| `tests/test_p6_classes.js` | `CLASS_TECH_IDS` gains the twins. The legacy Shadowknight test equips a sword before casting Shadow Blade. New Test 37: each Legendary ability grants both forms; a save that owns Echoing Judgment gets the twin on load, unslotted, with one notice, idempotent. |

**Departures from the §4 checklist (for review)**
- **No save-version bump.** The checklist asked for a v12 → v13 migration. No character field is added (the twins go into the existing `c.techs`), and `test_reload.js` ties `CURRENT_VERSION` to the newest changelog entry, so a bump would force a release entry. The load-time sweep follows the `sanitizeRetired()` precedent (`docs/SPEC-LEGACY-CONJURER-CLEANUP.md`): it runs on every load and is idempotent.
- **Seer's Ward has a `chain`.** Typed buffs only re-cast-replace when they have both `statKind` and `chain` (`js/core/battle.js` `useTech`). Without one, re-casting the Ward would stack +40 Spell Power per cast, which the sim never modelled. The sim policy casts it only when it isn't running, so the grid is unaffected.

**Grid re-run on the implemented code.** 936 cells, 300 seeded trials, all 12 lineages, Conjurer included (with the Water-pact fix of `docs/SPEC-WATER-PACT-COST.md`). 280,800 fights: 280,668 won, 113 monster fled, 19 lost.
- **Melee lineages:** B1/B2/B3 pass in all 88 cells. Closest band cell 37% (L10 warrior line), finale 50% (Assassin). 196 of 272 melee class options now cast class techs, 5.0 per win on average; before, none did. This matches §3.2.
- **Seer:** cheapest option 44 / 49 / 49 / 52 / 78% at L60–L100 (§3.4: 44 / 49 / 49 / 52 / 79).
- **Unchanged cells:** only `techs`-policy cells of the 8 melee lineages and the Seer changed. Every `basic` cell, and every Magus, Cleric and Conjurer cell, is identical to the pre-change grid.
- **Conjurer:** still fails B2 at the five T3 bosses (31–34%), unchanged by this spec. It's the remaining pact issue in `docs/SPEC-WATER-PACT-COST.md` §3.3.
- **Not re-run here:** the §3.5 5-down spot checks. D7 accepts the L10 result.

**Suites:** all 15 pass (scratch copy, `D:/` path rewritten).

**Changelog draft (for the release that ships this)**

> **Class techniques for fighters.** Warrior and Thief class techniques now strike with your weapon
> instead of drawing on Intelligence, so they finally hit hard for the heroes who learn them.
> Legendary classes also teach a weapon form of their signature technique (Severing Edge,
> Vault-Breaker's Blow, Echo of the Blade); if you already know the spell, you'll find the new form
> in your technique list. Seer's Ward now adds Spell Power instead of weapon damage.
