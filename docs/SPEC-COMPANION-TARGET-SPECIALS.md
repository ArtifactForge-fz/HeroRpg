# SPEC — Companion-targeting monster specials (Cleaving Roar and Banish Conduit go live; Banish backlashes at bosses)

**Status:** IMPLEMENTED on branch `v1.15-contract-fixes` (§8); not released or deployed. D0–D4 approved by
the user 2026-10-29 (D2: Banish Conduit with a flat 30% backlash at all five T3 bosses). P0 sim gate
(§4) passed on a prototype source patch; the implementation re-sim (§8) matches it.
**Relationship to authority:** finishes the deferred half of `docs/SPEC-COMPANION-SYSTEM.md` §2.3 and §6
("which monsters/bosses gain `target:'companion'`/`'both'` specials … a separate monster-AI pass"). Extends
`docs/DESIGN.md` §4 (monster AI: one interpreter, no per-monster branches —
`docs/SPEC-V1.5-MONSTER-AI.md` §3). Nothing archived is touched and nothing is `[revised]`. The two techs
already exist in `js/data/techs.js`; this spec adds two optional tech fields, one balance constant and data
assignments. Closes item 6 of `docs/REVIEW-2026-10-29-V19-QUEUE.md`.

**Interpretation of the request (confirm — D0):** put the two shipped-but-unused monster specials,
`mon_cleaving_roar` (`target: 'both'`) and `mon_banish_conduit` (`target: 'companion'`), on L60+
monsters, so a Conjurer's bound companion faces enemies that deal with it, and make a bound companion a real
cost at the T3 bosses. Only Conjurers at L60+ can bind one, so nothing may change for the other eleven
lineages or a Conjurer without a companion. Archive check: `reference/` records no monster special against
summons (the closest hit is a fan-suggested "Hawkeren Summoner" monster in `reference/forum/t-559.md`;
`reference/site/heropet.md` is a login wall), so every mechanic here is `[invented]`.

---

## 1. What changes

| | Today | After |
|---|---|---|
| `mon_cleaving_roar`, `mon_banish_conduit` | In `js/data/techs.js`, tested (`tests/test_companion.js` Test 7, `tests/test_p6_classes.js` G), on no monster; `power` 40/55 marked PROVISIONAL | Roar on 8 L60+ regulars; Banish on 6 L60+ regulars and all five T3 bosses; picked only while a live, non-suppressed companion is bound; PROVISIONAL dropped |
| Monster tech choice (`js/core/battle.js` `monsterAct`) | Uniform pick among affordable techs at `techChance` | Same, but a tech with the new `vsCompanion: true` is left out of the pool unless a companion is bound, alive and not Fear-suppressed |
| A boss's Banish Conduit | — | Also costs the summoner 30% of max HP (**backlash**) |

## 2. Design detail

### 2.1 The `vsCompanion` field [invented]

Optional boolean on a monster tech (`monsterOnly: true`). In `monsterAct`'s affordable loop, a tech with
`vsCompanion: true` is skipped unless `battle.companion` exists with `hp > 0` **and**
`!Game.Companion.isSuppressed(battle)` (the helper from `docs/SPEC-CONTRACT-FIXES-V19-QUEUE.md` §3).
Absent ⇒ today's behaviour for every other monster tech.

- **Why the gate exists:** without it, a Banish Conduit against a hero with no companion falls back to the
  hero (§2.3 of the companion spec), and a Cleaving Roar hits only the hero, so every class would face two
  new ungraded techs. With it, the pool, and therefore the RNG sequence, is identical to today for anyone
  without a live companion (verified, §4.1).
- **Why the suppression check:** at 5+ levels down the companion idles. A monster that kept aiming at it
  would hand the hero free turns and widen the 5-down hole.

### 2.2 Backlash at bosses [invented] (D2, user 2026-10-29)

A monster tech with `backlash: true` that is used **by a boss** (`monster.boss`) and lands on the companion
also costs the summoner `round(BALANCE.COMPANION_BACKLASH_BOSS_FRAC × hitPointsMax)` HP.

- `COMPANION_BACKLASH_BOSS_FRAC: 0.30` in `js/balance.js`, comment
  `// invented, docs/SPEC-COMPANION-TARGET-SPECIALS.md §2.2 (sim-locked §4.3; flat so every pact pays the same)`.
- **Flat, not a share of the companion's damage.** A share would track the companion's Armor: the Earth
  Golem (Armor 64–104 at L60–L100) would pay little and Fire/Wind (12–20) a lot, widening the gap between
  pacts to 25 points (§4.3). A flat share charges every pact the same per Banish.
- **Unmitigated:** no dodge, Armor, Magic Armor, Fear, Block, Bracing or Defend; it's the bond tearing, not a
  blow. It can bring the hero to 0 HP (the battle then ends as a loss through the normal `checkEnd`).
- **Banish only.** Hits the Golem takes through Taunt (the split basic attack) never backlash; otherwise Taunt
  would hand half of every blow straight back to the hero.
- **Applies only when the companion was hit** (Banish's own damage resolved against a live companion).
  Regular monsters' Banish has no backlash.
- Log line: "The severed bond lashes back at you for N damage."
- **Lore hook:** a companion is bound with the summoner's own Anima (`docs/SPEC-COMPANION-SYSTEM.md` §3, S4
  note — the same reason Fear silences it). The strongest enemies can rip at that bond, and the summoner
  feels it.

### 2.3 The two techs (existing entries; only the fields shown change)

| id | name | target | grade | energyCost | power | vsCompanion | backlash | desc | Tag |
|---|---|---|---|---|---|---|---|---|---|
| `mon_cleaving_roar` | Cleaving Roar | both | null | 10 | 40 (floor; a L60+ monster's own damage replaces it, `docs/SPEC-MONSTER-TECH-POWER.md` §2.1) | **true** | — | "A roar of raw force that buffets everything before it." (unchanged) | [invented] |
| `mon_banish_conduit` | Banish Conduit | companion | null | 10 | 55 (floor, as above) | **true** | **true** | "A focused blow meant to shatter a summoner's bound servant." (unchanged) | [invented] |

Citation comments change from `PROVISIONAL` to `// [invented] floor only — monsterTechPower uses
max(power, round(F x damage)); docs/SPEC-COMPANION-TARGET-SPECIALS.md §2.3`. Icons exist
(`assets/icons/mon_cleaving_roar.png`, `mon_banish_conduit.png`); no new ids.

### 2.4 Who carries them (APPEND to each monster's `techs` array) [invented]

By what the monster is, not by level: **Cleaving Roar** on the heavy wardens, vanguards and ward-constructs
(the shipped descs: "hammering anything that moves"); **Banish Conduit** on the Anima-channelers, Society
casters and Eidas's divine race, who work Anima themselves and can unpick a bound servant, and on the five
T3 bosses.

| Monster | L | Behavior | techs today | Appended |
|---|---|---|---|---|
| `majiku_frost_exile` | 61 | simple | hunters_mark | `mon_cleaving_roar` |
| `ukai_deep_vanguard` | 69 | telegraph | hunters_mark, earthen_crush | `mon_cleaving_roar` |
| `estari_sublevel_warden` | 71 | simple | stone_slam | `mon_cleaving_roar` |
| `estari_ruin_vanguard` | 79 | simple | hunters_mark, earthen_crush | `mon_cleaving_roar` |
| `skyspire_lower_warden` | 81 | telegraph | stone_slam | `mon_cleaving_roar` |
| `skyspire_upper_sentinel` | 86 | simple | hunters_mark, earthen_crush | `mon_cleaving_roar` |
| `moonbridge_ward_sentinel` | 91 | simple | stone_slam | `mon_cleaving_roar` |
| `sanctum_ward_colossus` | 96 | enrage | hunters_mark, earthen_crush | `mon_cleaving_roar` |
| `anima_scarred_frostwalker` | 64 | caster | dark_hex, anima_lance | `mon_banish_conduit` |
| `estari_anima_conduit` | 72 | caster | static_arc | `mon_banish_conduit` |
| `society_remnant_battlemage` | 82 | caster | dark_hex | `mon_banish_conduit` |
| `society_arcanist_prime` | 87 | caster | static_arc | `mon_banish_conduit` |
| `divine_race_initiate` | 92 | caster | radiant_smite | `mon_banish_conduit` |
| `divine_race_exemplar` | 97 | caster | radiant_smite | `mon_banish_conduit` |
| **Boss** `majiku_ridge_chieftain` | 60 | simple | dark_hex, hunters_mark, earthen_crush, anima_lance | `mon_banish_conduit` |
| **Boss** `ukai_deep_dweller` | 70 | simple | dark_hex, hunters_mark, earthen_crush, anima_lance | `mon_banish_conduit` |
| **Boss** `estari_warden_prime` | 80 | simple | dark_hex, hunters_mark, earthen_crush, anima_lance | `mon_banish_conduit` |
| **Boss** `society_anima_horror` | 90 | simple | dark_hex, hunters_mark, earthen_crush, anima_lance | `mon_banish_conduit` |
| **Boss** `eidas_ascendant` | 100 | simple | radiant_smite, dark_hex, earthen_crush, red_moons_judgment | `mon_banish_conduit` |

The other 8 L60+ regulars (the anima-scarred and horror lines, the deepling, the cave and wellspring wardens)
keep their lists. No monster gets both specials; no boss gets Cleaving Roar.

## 3. Balance rationale

- **Power:** no new number. Both techs scale like every monster tech, `max(power, round(F × damage))` with
  F 1.00 for regulars and 0.70 for bosses (`docs/SPEC-MONSTER-TECH-POWER.md`); at L60+ that's 125–298, so the
  40/55 floors never apply. Ungraded, so they meet the hero's full Armor and the companion's `armor`.
- **Frequency:** no new number. A carrier now has one more tech, picked uniformly at its archetype's
  `techChance` (0.5, casters 0.75), and only while the companion is up. At a boss, Banish is one of five techs.
- **Why plain damage can't raise the cost:** every hit aimed at the companion is a turn the monster doesn't
  spend on the hero, so damage-only Banish makes the fight *cheaper* (§4.2, §4.3). The backlash charges the
  hero directly without trading a turn away.
- **Why 30%:** below about 15% a flat backlash only cancels that free turn (10% lands back on today's
  numbers). 30% puts the cheapest Conjurer setup at 40–44% at every T3 boss (§4.3).
- **Regulars:** Banish stays plain there. The hero's fight gets cheaper and the cost moves to the companion's
  HP, which persists between battles (inns and camps don't heal it, `docs/SPEC-COMPANION-SYSTEM.md` D3).
  Regular fights have a floor, not a ceiling, so that passes the contract.

## 4. P0 sim gate (2026-10-29)

`/balance-sim` rules: real code (branch `v1.15-contract-fixes`, i.e. v1.14.0 + the three contract fixes),
§2.1–§2.2 applied as a prototype source patch to `js/core/battle.js` and §2.4 as data; seeded mulberry32
(trials from seed 7000), **300 trials per cell** (100 for §4.1); prepared fixture (`tests/boss_fixture.js`).
Baseline = the same scripts without the patch. Scripts in the session scratchpad.

### 4.1 Nobody without a companion is affected

Paladin, Magus, Gambit, Ranger and a pact-less Conjurer against all 14 regular carriers at-level and all five
T3 bosses (`techs` policy): **identical** to the baseline in all 95 cells (same seeds, same win %, same HP
spent to six decimals). The gate keeps the tech pool, and so the RNG sequence, unchanged.

### 4.2 Conjurer vs every L60+ regular (techs policy; kit noted)

Mean win % / HP spent per win % (baseline → patched) / companion HP lost per fight %:

| Cells | No pact | Fire | Water | Earth | Wind |
|---|---|---|---|---|---|
| At-level, Roar carriers (8) | 100 / 20 | 100 / 19 → 19, comp 17 | 100 / 20 → 20, comp 13 | 100 / 20 → 20, comp 6 | 100 / 21 → 21, comp 17 |
| At-level, Banish carriers (6) | 100 / 19 | 100 / 17 → **11**, comp 28 | 100 / 18 → **11**, comp 21 | 100 / 19 → **13**, comp 9 | 100 / 21 → **14**, comp 27 |
| At-level, untouched (10) | identical | | | | |
| +5 and +6, all 42 cells | identical to the baseline for every pact (suppression gate) | | | | |

- **At-level passes:** 100% win in every cell, every pact, both policies (kit: same pattern, Banish
  carriers 13–16% → 8–10% HP spent).
- **5-levels-down unchanged:** every +5/+6 cell is identical to the baseline.
- No backlash at regulars: this table is identical with and without §2.2.

### 4.3 The T3 bosses

Conjurer at the five T3 bosses, every class option × basic/techs/kit. **Cheapest** = the cheapest option's HP
spent per win on its best policy (contract: ≥ 35%, finale ≥ 45%). Baseline: L60 34.9, L70 37.2, L80 35.6,
L90 36.2, finale 37.8 (L60 and the finale are user-accepted misses, `docs/SPEC-COMPANION-SPELLPOWER.md` §8).

Variants tried (Banish on all five bosses unless noted):

| Variant | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|
| Damage only | 30.2 | 32.1 | 30.8 | 31.4 | 34.5 |
| Unbind (Banish disperses the companion) | 32.9 | 34.9 | 33.4 | 33.4 | 35.7 |
| Splash (boss basic attacks also hit the companion for half; no Banish) | 34.1 | 36.4 | 35.0 | 36.2 | 40.4 |
| Cleaving Roar only (no Banish) | 34.4 | 36.7 | 35.1 | 35.8 | 37.6 |
| Backlash = 100% of the companion's damage | 41.3 | 44.1 | 47.0 | 55.1 | 43.0 |
| Flat backlash 10% of max HP | 34 | 36 | 34 | 35 | 37 |
| Flat backlash 20% | 37 | 39 | 37 | 39 | 41 |
| **Flat backlash 30% (chosen)** | **40.0** | **42.5** | **40.3** | **42.2** | **44.2** |

Per pact under the chosen design (best class option and policy with the companion bound; "none" = the same
Conjurer with nothing bound):

| Boss | None | Fire | Water | Earth | Wind |
|---|---|---|---|---|---|
| L60 | 63 | 46 | 45 | 40 | 45 |
| L70 | 69 | 49 | 50 | 43 | 47 |
| L80 | 60 | 47 | 46 | 40 | 50 |
| L90 | 62 | 49 | 46 | 42 | 49 |
| L100 | 72 | 57 | 54 | 44 | 53 |

- **B2 (cost floor):** every T3 boss passes 35%, including L60 (was 34.9, accepted). The finale reaches 44.2,
  0.8 short of its 45% (was 37.8, accepted).
- **B1 / B3:** every Conjurer option still wins 100%; stock use ≤ 8% everywhere.
- **Every pact is worth binding** at every boss (10–28 points cheaper than none; the closest is Wind at L80,
  50 vs 60), and the pact order stays close to today's: Earth is cheapest by 4–9 points over the next pact
  (today 4–7). Under the proportional 100% variant the dearest pact sat up to 26 points above Earth (Fire at
  the finale), and Wind at L70 cost the same as fighting with nothing bound.
- No other lineage's boss cell moves (§4.1).

### 4.4 Verdict

The chosen design **passes**: at-level 100%, 5-down identical, no other lineage touched, every T3 boss cell
for the Conjurer now above 35% (the finale 0.8 under 45%, improved from an accepted 37.8).

## 5. Conventions & handoff checklist

- [x] Stock/drop tables: not touched. Monster `techs` arrays: APPEND only (§2.4).
- [x] Icons: none new (both tech icons exist).
- [x] Ids: no new ids; two new optional tech fields (`vsCompanion`, `backlash`); one balance constant
  (`COMPANION_BACKLASH_BOSS_FRAC`).
- [x] Save impact: none (battle-transient; save stays 12).
- [x] Engine (`js/core/battle.js` `monsterAct`, ONE interpreter, no per-monster branch): the affordable-loop
  gate (§2.1), guarded `Game.Companion && Game.Companion.isSuppressed`; the backlash after the companion hit
  (§2.2), then `checkEnd`. Comments cite this spec.
- [x] Wiki (`js/ui/wiki.js` ~line 511, the monster-tech note): "Only used against a bound companion." for
  `vsCompanion` techs; for `backlash` techs also "From a boss, the summoner also loses 30% of max HP."
- [x] Tests (`tests/test_companion.js`, stubbed RNG):
  - a carrier never picks a `vsCompanion` tech with no companion, a dead companion, or at 5 levels down; does
    pick it with a live companion at-level;
  - a boss's Banish Conduit damages the companion and costs the hero exactly
    `round(0.30 × hitPointsMax)`, ignoring Defend and Armor, with the log line;
  - a regular monster's Banish Conduit costs the hero nothing;
  - a Taunt-split basic attack on the Golem causes no backlash.
  `tests/test_p3_battle.js` Test 0 and Test 74 stay green with no constant change; existing Test 7 / G keep
  passing.
- [ ] Changelog (player-facing draft): "The strongest foes past level 60 now turn on a summoner's bound
  elemental. Wardens and constructs use Cleaving Roar to strike you both; Anima-casters and every great
  boss use Banish Conduit, and when a boss tears at the bond, the summoner feels it too."

## 6. Open decisions

| # | Question | Recommendation |
|---|---|---|
| D0 | Interpretation: the specials apply only while a companion is bound; nothing changes for heroes without one | **Approved (user, 2026-10-29)** |
| D1 | `vsCompanion` gate (vs letting every class face the two techs) | **Approved (user, 2026-10-29)**: without it, eleven lineages get two new ungraded techs and every L60+ grid needs re-gating |
| D2 | Bosses | **Resolved (user, 2026-10-29):** Banish Conduit on all five T3 bosses with a flat backlash of 30% of the hero's max HP; regulars keep plain Banish |
| D3 | The 14 regular carriers of §2.4 (8 Roar, 6 Banish) | **Approved (user, 2026-10-29)**, as listed |
| D4 | Ship with the contract fixes in v1.15.0 or later | **Approved (user, 2026-10-29)**: with v1.15.0 |

## 7. Out of scope

- The finale's last 0.8 points to 45% (a backlash of about 32% would likely close it; not simmed).
- Modelling companion HP carried over between fights in the sims (the fixture binds at full HP each fight).
- Champion variants of the 14 regular carriers were not simmed separately (the gate is in the shared
  tech-choice loop, so it applies to them too).
- Cleaving Roar at bosses (it lowered every boss cost by 0.2–0.5 points, §4.3).

## 8. Implementation and gate (2026-10-29)

- `js/balance.js`: `COMPANION_BACKLASH_BOSS_FRAC: 0.30`.
- `js/data/techs.js`: `vsCompanion` on both specials, `backlash` on Banish Conduit; PROVISIONAL comments
  replaced. `js/data/monsters.js`: §2.4's 19 appends (8 Roar, 11 Banish).
- `js/core/battle.js` `monsterAct`: the §2.1 pool gate (a `continue`, no `rng()` change) and the §2.2
  backlash after the companion hit (unmitigated, `defending` untouched, then the existing `checkEnd`).
- `js/ui/wiki.js`: monster-tech notes "Only used against a bound companion" and "From a boss, the summoner
  also loses 30% of max HP".
- Tests: `tests/test_companion.js` Test 18 (pool gate with no / dead / suppressed / live companion; boss Banish
  costs exactly 30% of max HP while Defending, with the log line; a regular Banish costs nothing; a
  Taunt-split boss basic causes no backlash). Test 14 now seeds its five `simulate` calls (`seed: 7000`):
  its unseeded 30-fight "every pact beats no companion" check at `estari_warden_prime` turned flaky (about 1
  run in 7) once the boss carries Banish; assertion unchanged (seeded: none 68%, pacts 57–62%). All 16
  suites pass; no dead items.
- **Re-sim on the implemented code** (same scripts and seeds as §4, no patches): identical to the gate in
  every cell: §4.1 (95 cells), §4.2 (both policies), §4.3 (all 240 boss cells).
