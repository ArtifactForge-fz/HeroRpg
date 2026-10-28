# SPEC — Boss sims with class techs and the Conjurer companion

**Status:** IMPLEMENTED (uncommitted) on branch `v1.11-hero-tree`, on top of the boss cost retune
(`73a6c36`). Test tooling and a sim gate only: **no game code or combat constant changed.**
Authored 2026-10-28 (user-directed: "update the boss balance sims to include class techs and the
conjurer companion", the gap named in `docs/SPEC-BOSS-COST-BAND.md` §3.3 and the boss cost retune
report). Scope decisions (user, 2026-10-28): fixture + 300-trial grid + in-repo test cells; all
four Conjurer pacts as separate class options; **report only**, so failing cells go to a
follow-up spec, not a fix here (the ratchet principle).

**Relationship to authority:** measures the boss contract in `docs/SPEC-BOSS-COST-BAND.md` §2 (as
amended by `docs/SPEC-BOSS-COST-RETUNE.md` D0/D6) on the same prepared fixture. It does not change
the contract.

## 1. Problem

Every boss grid so far (`docs/SPEC-BOSS-COST-BAND.md` §3.3, `docs/SPEC-BOSS-COST-RETUNE.md` §3.3)
had the same limit: casters cast Firebolt, everyone else attacks, **class techs are never cast and
the Conjurer has no companion**. The S1 scripts were also ephemeral, and the in-repo fixture
(`tests/boss_fixture.js`) only built the Paladin-line warrior. So the grid could not be re-run,
and nobody knew whether a hero who uses their class kit still pays at bosses.

## 2. Design — the fixture (`tests/boss_fixture.js`)

**Builds.** `build(Game, level, opts)` now builds any of the 12 lineages. These are the
`docs/SPEC-BOSS-COST-BAND.md` §3.3 S1 fixtures, now kept in the repo:

| Archetype | Lineages | Main stat | Gear | Half-level skills |
|---|---|---|---|---|
| warrior | Shadowknight, Berserker, Paladin, Warden | Str | Sword + Shield + Heavy | Swords, Heavy Armor, Shields, Dodge, Double Attack |
| twinblade | Gambit, Assassin | Dex | Knife + offhand Knife + Light | Knives, Light Armor, Dual Wield, Dodge, Double Attack |
| ranger | Ranger | Str | Sword + Medium | Swords, Medium Armor, Dodge, Double Attack |
| dragoon | Dragoon | Str | Polearm + Medium | Polearms, Medium Armor, Dodge, Double Attack |
| caster | Magus, Conjurer, Cleric, Seer | Int | Rod + Light, every Firebolt rank Evocation allows | Rods, Light Armor, Dodge, Double Attack, Evocation (+ Conjuration with a pact) |

Stat points are spent vit/end/main/main/main. Tiers open at L5 / L30 / L60, and every passive is
bought. `classOptions(lineage, level)` lists the class options: no Legendary, plus each Legendary
the level allows (Runeblade L30, Vaultbreaker L32, Heir L40). A Conjurer at T3 multiplies these by
its four pacts. With no options, `build` is the Paladin-line warrior the in-repo boss tests have
always used.

**Policies.** `fightOnce` / `simulate` take `opts.policy`:
- **`basic`** (default, unchanged): Crystal before the next action would empty the Energy pool,
  heal item below 40% HP, otherwise attack (casters: the best affordable Firebolt).
- **`techs`**: the build also learns and slots its class techs (one pact for a Conjurer). A
  Conjurer enters the fight with its pact's companion bound at full HP. Each turn, in order:
  1. Crystal, as in `basic`.
  2. Below 40% HP: a heal tech, but only if it heals at least as much as the heal item;
     otherwise the heal item.
  3. Re-bind a fallen companion.
  4. Cast a buff tech that isn't running.
  5. Cast the strongest damage tech that **out-damages the basic action**.
  6. Otherwise, the basic action.

  Step 5 uses a damage probe. Before the trials, each damage tech and the basic action fire as
  the opening action of 20 seeded fights (seeds 50000+, never the trial stream). Only techs whose
  average boss-HP removed beats the basic action's are used. The heal check in step 2 uses
  `techEffectivePower`, which is exact. Without these two filters, the first grid run cast weak
  techs blindly: melee builds lost up to 100% of fights, and heal techs that out-heal nothing
  became a death loop.

**Metrics.** HP spent is now the HP lost summed over every action, the boss's opening strike
inside `Battle.start` included. For a build with no companion this equals the old formula (HP at
start − HP at end + heals) fight for fight. 440 seeded fights across all 11 bosses were identical
under the old and new fixture. With a companion, heals in a different action than a hit no longer
offset damage taken. A companion heal and a boss hit in the same round still net out, because both
happen inside one player action. That is the intended reading of cost: HP a free heal covers is HP
the hero didn't pay. `simulate` adds `p10HpLeft`, `avgRounds` and `avgCasts`, and a `seed` option (trial t runs on
mulberry32(seed + t)).

**Not modelled** (same as earlier grids, plus one new limit): limit breaks, shrine buffs, the
Defend action. **Companion HP lost** is a real cost the metric doesn't count: it carries between
battles until the companion is re-bound.

## 3. Sim gate results (run 2026-10-28 on `dfab75f` + this fixture)

**Method.** Real game code in node `vm`, unpatched. Seeded mulberry32, 300 trials per cell. 11
bosses × 12 lineages × every class option × both policies = 936 cells, 280,800 fights: 280,656
won, 122 monster fled (L10 casters, `basic`), 22 lost. Scripts are in the session scratchpad
(ephemeral, the repo's sim convention). The fixture they drive is in the repo now, so the grid can
be re-run.

**Judging.** Per boss × lineage: B1 on the weakest option (lowest win rate), B2/B2f on the
cheapest (lowest HP spent), B3 on the most expensive (most consumables). With techs available, a
player picks the policy per option, so the verdict uses the better policy for the player: highest
win for B1, lowest HP spent for B2, most consumables for B3.

**`basic` only: ✅ B1, B2, B3 pass in all 132 boss × lineage cells.** This reproduces the retune's
S1 verdict on the in-repo fixture.

**With techs (player's choice): B1 ✅ 132/132, B3 ✅ 132/132, B2 ❌ 5 of 132 — all Conjurer.**
Cheapest option HP spent per win % / weakest option win % (**x** = fails B2; band bosses need
HP spent ≥ 35% or ≥ 3 consumables, the finale ≥ 45%):

| Boss | SK | Bers | Pal | Ward | Magus | Conj | Cleric | Seer | Gambit | Assn | Ranger | Drag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| L10 | 49/100 | 49/100 | 49/100 | 49/100 | 61/100 | 61/100 | 61/100 | 61/100 | 43/100 | 43/100 | 55/100 | 72/97 |
| L18 | 78/100 | 78/100 | 78/100 | 78/100 | 44/100 | 44/100 | 44/100 | 44/100 | 65/100 | 65/100 | 84/100 | 84/100 |
| L25 | 95/100 | 95/100 | 95/100 | 95/100 | 48/100 | 48/100 | 48/100 | 48/100 | 66/100 | 66/100 | 106/100 | 107/100 |
| L32 | 75/100 | 75/100 | 76/100 | 76/100 | 47/100 | 47/100 | 42/100 | 42/100 | 46/100 | 46/100 | 87/100 | 88/100 |
| L40 | 73/100 | 73/100 | 73/100 | 73/100 | 57/100 | 57/100 | 55/100 | 55/100 | 46/100 | 46/100 | 92/100 | 94/100 |
| L50 | 87/100 | 87/100 | 85/100 | 85/100 | 44/100 | 44/100 | 42/100 | 42/100 | 59/100 | 59/100 | 121/99 | 122/99 |
| L60 | 69/100 | 70/100 | 70/100 | 67/100 | 43/100 | **x17**/100 | 40/100 | 57/100 | 54/100 | 49/100 | 96/100 | 95/100 |
| L70 | 71/100 | 73/100 | 71/100 | 68/100 | 49/100 | **x18**/100 | 45/100 | 64/100 | 56/100 | 52/100 | 97/100 | 99/100 |
| L80 | 66/100 | 67/100 | 66/100 | 63/100 | 46/100 | **x18**/100 | 44/100 | 69/100 | 53/100 | 49/100 | 91/100 | 93/100 |
| L90 | 68/100 | 70/100 | 69/100 | 66/100 | 48/100 | **x19**/100 | 47/100 | 74/100 | 54/100 | 51/100 | 93/100 | 97/100 |
| L100 | 80/100 | 81/100 | 82/100 | 81/100 | 74/100 | **x21**/100 | 71/100 | 94/100 | 62/100 | 56/100 | 107/99 | 111/100 |

Below L30 / L60, lineages share their T1 / T2 class, so groups show identical numbers.

### 3.1 Finding 1 — the Conjurer companion makes T3 bosses cheap (B2 ❌, 5 cells)


HP spent per win, range over the four Legendary options, `techs` policy (all 100% win):

| Pact | L60 | L70 | L80 | L90 | L100 (needs ≥ 45%) |
|---|---|---|---|---|---|
| Fire | 35–45 | 36–46 | 34–45 | 33–46 | 42–48 |
| Water | **17–21** | **18–22** | **18–23** | **19–24** | **21–25** |
| Earth | 33–42 | 35–43 | 33–43 | 32–43 | 34–40 |
| Wind | 33–43 | 32–41 | 32–42 | 31–40 | 36–41 |
| No companion (`basic`) | 59 | 66 | 86 | 89 | 94 |

- **Water** fails every band boss by 11–18 points and the finale by about 22. Its companion heals
  the hero every round, so the hero never reaches the 40% heal line (0.0 consumables per win).
- **Earth, Wind and Fire** pass the band floor on most options. They fall just under 35% with the
  Heir Legendary (31–35%), and every one of them misses the finale's 45% except Fire on some
  options.
- A companion cuts the Conjurer's HP spent by 40–75 points against the same build without one.
  Fights also end in 2.3–6.1 rounds, against 5.2–9.3 without.
- B1 and B3 hold: every pact wins 100%, and none spends more than 0.2 of 12 consumables.

This confirms the companion spec's own flag (`docs/SPEC-COMPANION-SYSTEM.md`: Wind "the strongest
at-level … flagged for optional future down-tuning if a boss pass wants it"). By the boss
contract, though, **Water** is the outlier.

### 3.2 Finding 2 — melee class techs don't work for the builds that own them

The `techs` policy casts **no** class tech for any warrior, rogue, Ranger or Dragoon lineage, at any
level, Legendary techs included. All of them are non-weapon techs (no `weaponTech`). So they:
- scale with Intelligence: `techEffectivePower`, × (1 + Int × 0.02);
- roll the Intelligence spell hit: `INT_SPELL_HIT_*`, floor 40%.

A prepared melee hero has Int 5. Probe averages (boss HP removed per action, 20 seeded openings):

| Build | Basic attack | Class techs |
|---|---|---|
| Paladin + Heir, L100 | 447 | Echoing Judgment 27, Crushing Blow 12, Smite 6 |
| Dragoon, L50 | 183 | Efficient Strike 9, Quick Stab 5 |
| Gambit, L25 | 106 | Quick Stab 11 |

Casting one is a wasted turn. The Crusader's heal tech, Radiant Smite, heals about 50 on these
builds, well under the heal item, so it's skipped too. The cost verdict for these lineages is
therefore unchanged. But the 13 damage techs on the warrior and thief lines, and the 3 Legendary
techs on a melee build, are dead weight for the classes that buy them. This is a design bug for a
follow-up spec (e.g. make them `weaponTech` / `physicalRoll` techs). Any change there must re-run
this grid: working melee techs would lower HP spent, and several lineages sit 2–10 points above
35%.

### 3.3 Finding 3 — caster techs help but stay within the contract

Arcane Cataclysm, Anima Reckoning, Greater Restoration and the Legendary techs (on Int builds)
lower casters' HP spent by up to 37 points. The biggest drops come with the Heir or Vaultbreaker:
Cleric/Seer + Vaultbreaker at L32 go from 79% to 42%. At L10, Anima Surge raises casters' win rate
from 92% to 100%. Every caster lineage except the Conjurer still clears B2 on its cheapest option
(Cleric 40% at L60 is the closest).

### 3.4 Finding 4 — Seer's Ward is a wasted turn for a Seer

Seer's Ward is an untyped buff: +40 flat damage, which only weapon attacks read
(`playerBuffDamageBonus`, `js/core/battle.js` attack path). A Seer's basic action is Firebolt, so
the cast only costs a turn. With the Ward cast, Seer fights take up to 4.3 more rounds and cost up
to 44 more points of HP. The player's-choice verdict skips it, so it changes no verdict. It's worth a
look in the same follow-up as Finding 2 (e.g. a typed `spellpower` buff, like Tailwind).

## 4. In-repo regression cells

These are regression floors, 30 unseeded trials. The grid above is the gate.
- **`tests/test_p3_battle.js` Test 103:** a Magus with class techs at L90
  (`society_anima_horror`) wins ≥ 85%, pays ≥ 35% HP spent or ≥ 3 consumables (B2), spends ≤ half
  its stock (B3), and actually casts class techs. It's at L90, not the finale, because at L100 no
  Magus class tech out-damages its top Firebolt, so the policy casts none there.
- **`tests/test_companion.js` Test 14:** each Conjurer pact at L80 (`estari_warden_prime`) wins
  ≥ 85%, spends ≤ half its stock, and costs less HP than the same Conjurer without a companion.
  This shows the companion is wired into the fixture. It lives in the companion suite because
  `test_p3_battle.js` doesn't load `js/core/companion.js`. **The B2 cost floor is not asserted for
  the Conjurer** (Finding 1, report only). The test logs each pact's HP spent so the gap stays
  visible.

Every existing boss test keeps the default build and policy and gives the same results. The new
fixture is also loaded by `tests/test_p6b_content.js` (Part 4, unchanged).

## 5. Follow-ups (not decided here)

| # | Item | Notes |
|---|---|---|
| F1 | Conjurer boss cost (Finding 1) | Water fails B2 at all five T3 bosses, and Earth/Wind/Fire miss the finale's 45%. Per the ratchet principle, tune the companion, not the bosses. Should also decide whether companion HP lost counts as boss cost |
| F2 | Melee class techs (Finding 2) | The 13 warrior/thief-line damage techs, and the Legendary techs on melee builds, do almost nothing for their owners. Spec a physical/weapon variant, then re-run this grid |
| F3 | Seer's Ward (Finding 4) | Make it useful for a caster, or accept it as a melee-only buff |
| F4 | Limit breaks, Defend, shrine buffs | Still not modelled by any boss grid |

## Checklist

- [x] `tests/boss_fixture.js`: lineage builds, class options, `techs` policy with damage probe and
  heal check, seeded `simulate`, loss-summed HP spent (identical to the old fixture without a
  companion).
- [x] 300-trial seeded grid, both policies (§3).
- [x] `tests/test_p3_battle.js` Test 103, `tests/test_companion.js` Test 14.
- [x] All 15 test suites pass (2026-10-28, run from a scratch copy with the hard-coded `D:/` test
  path rewritten).
