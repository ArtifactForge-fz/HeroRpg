# SPEC — Companion-targeting monster specials (Cleaving Roar and Banish Conduit go live on L60+ regulars)

**Status:** DRAFT — open decisions D0–D4 unresolved. P0 sim gate run 2026-10-29 on branch
`v1.15-contract-fixes` with a prototype source patch (§4): the recommended option passes.
**Relationship to authority:** finishes the deferred half of `docs/SPEC-COMPANION-SYSTEM.md` §2.3 and §6
("which monsters/bosses gain `target:'companion'`/`'both'` specials … a separate monster-AI pass"). Extends
`docs/DESIGN.md` §4 (monster AI: one interpreter, no per-monster branches —
`docs/SPEC-V1.5-MONSTER-AI.md` §3). Nothing archived is touched and nothing is `[revised]`. The two techs
already exist in `js/data/techs.js`; this spec adds one optional tech field and data assignments.
Closes item 6 of `docs/REVIEW-2026-10-29-V19-QUEUE.md`.

**Interpretation of the request (confirm — D0):** put the two shipped-but-unused monster specials,
`mon_cleaving_roar` (`target: 'both'`) and `mon_banish_conduit` (`target: 'companion'`), on L60+
monsters, so a Conjurer's bound companion faces enemies that deal with it. Only Conjurers at L60+ can
bind one, so the specials should change **nothing** for the other eleven lineages or a Conjurer without a
companion. The alternative reading, that they should make companion play harder overall (raise the
Conjurer's cost), is what §4 shows they can't do: damage aimed at the companion is damage not aimed at
the hero.

---

## 1. What changes

| | Today | After |
|---|---|---|
| `mon_cleaving_roar`, `mon_banish_conduit` | In `js/data/techs.js`, tested (`tests/test_companion.js` Test 7, `tests/test_p6_classes.js` G), on no monster; `power` 40/55 marked PROVISIONAL | On 14 of the 22 L60+ regular monsters; picked only while a live, non-suppressed companion is bound; PROVISIONAL dropped |
| Monster tech choice (`js/core/battle.js` `monsterAct`) | Uniform pick among affordable techs at `techChance` | Same, but a tech with the new `vsCompanion: true` is left out of the pool unless a companion is bound, alive and not Fear-suppressed |
| Bosses | — | Unchanged (D2) |

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
- **Lore hook:** a companion is bound with the summoner's own Anima (`docs/SPEC-COMPANION-SYSTEM.md` §3 S4
  note). Enemies only turn on it while it's a real threat. [invented]

### 2.2 The two techs (existing entries; only the fields shown change)

| id | name | target | grade | energyCost | power | vsCompanion | desc | Tag |
|---|---|---|---|---|---|---|---|---|
| `mon_cleaving_roar` | Cleaving Roar | both | null | 10 | 40 (floor; a L60+ monster's own damage replaces it, `docs/SPEC-MONSTER-TECH-POWER.md` §2.1) | **true** | "A roar of raw force that buffets everything before it." (unchanged) | [invented] |
| `mon_banish_conduit` | Banish Conduit | companion | null | 10 | 55 (floor, as above) | **true** | "A focused blow meant to shatter a summoner's bound servant." (unchanged) | [invented] |

Citation comments change from `PROVISIONAL` to `// [invented] floor only — monsterTechPower uses
max(power, round(F x damage)); docs/SPEC-COMPANION-TARGET-SPECIALS.md §2.2`. Icons exist
(`assets/icons/mon_cleaving_roar.png`, `mon_banish_conduit.png`); no new ids.

### 2.3 Who carries them (APPEND to each monster's `techs` array) [invented]

By what the monster is, not by level: **Cleaving Roar** on the heavy wardens, vanguards and ward-constructs
(the shipped descs: "hammering anything that moves"); **Banish Conduit** on the Anima-channelers, Society
casters and Eidas's divine race, who work Anima themselves and can unpick a bound servant.

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

The other 8 L60+ regulars (the anima-scarred and horror lines, the deepling, the cave and wellspring wardens)
keep their lists, so the specials stay a feature of particular enemies. No monster gets both.

## 3. Balance rationale

- **Power:** no new number. Both techs already scale like every monster tech, `max(power, round(F ×
  damage))` with F 1.00 for regulars (`docs/SPEC-MONSTER-TECH-POWER.md`); at L60+ that's 125–201, so the
  40/55 floors never apply. Ungraded, so they meet the hero's full Armor and the companion's `armor`.
- **Frequency:** no new number. A carrier with one or two techs now has two or three, picked uniformly at
  its archetype's `techChance` (0.5, casters 0.75), so a special is about a third to a half of its tech
  actions, and only while the companion is up.
- **Cost moves to the companion.** Banish Conduit spends a monster turn on the companion, so the hero takes
  less (§4.2). The price is the companion's HP, which persists between battles (inns and camps don't heal
  it, `docs/SPEC-COMPANION-SYSTEM.md` D3): about a quarter of its bar per fight against a Banish carrier,
  so a rebind (30 Energy and a turn) every few fights, or Water's healing. Regular fights have a floor, not a
  ceiling, so cheaper at-level fights pass the contract.

## 4. P0 sim gate (2026-10-29)

`/balance-sim` rules: real code (branch `v1.15-contract-fixes`, i.e. v1.14.0 + the three contract fixes),
§2.1 applied as a prototype source patch to `js/core/battle.js` and §2.3 as data; seeded mulberry32 (trials
from seed 7000), **300 trials per cell**; prepared fixture (`tests/boss_fixture.js`). Baseline = the same
scripts without the patch. Scripts in the session scratchpad.

### 4.1 Nobody without a companion is affected

Paladin, Magus, Gambit and a pact-less Conjurer against all 14 carriers at-level, plus Paladin and Magus at
`eidas_ascendant`: **identical** to the baseline in all 58 cells (same seeds, same win %, same HP spent to
six decimals). The gate keeps the tech pool, and so the RNG sequence, unchanged.

### 4.2 Conjurer vs every L60+ regular (techs policy; kit in brackets)

Mean win % / HP spent per win % / companion HP lost per fight %:

| Cells | No pact | Fire | Water | Earth | Wind |
|---|---|---|---|---|---|
| At-level, Roar carriers (8) | 100 / 20 | 100 / 19 → 19, comp 17 | 100 / 20 → 20, comp 13 | 100 / 20 → 20, comp 6 | 100 / 21 → 21, comp 17 |
| At-level, Banish carriers (6) | 100 / 19 | 100 / 17 → **11**, comp 28 | 100 / 18 → **11**, comp 21 | 100 / 19 → **13**, comp 9 | 100 / 21 → **14**, comp 27 |
| At-level, untouched (10) | identical | | | | |
| +5 and +6, all 42 cells | identical to the baseline for every pact (suppression gate) | | | | |

- **At-level passes:** 100% win in every cell, every pact, both policies (kit: same pattern, Banish
  carriers 13–16% → 8–10% HP spent).
- **5-levels-down unchanged:** every +5/+6 cell is identical to the baseline, so the accepted Fear-sustain
  numbers neither widen nor narrow.
- **Cleaving Roar** costs the companion 6–17% of its HP and leaves the hero's cost unchanged. **Banish
  Conduit** makes the hero's fight cheaper (17–21% → 11–14%) and costs the companion 9–28%.

### 4.3 Bosses (why D2 recommends none)

Conjurer at the five T3 bosses, every class option × basic/techs/kit, judged as the boss grid does
(cheapest option's HP spent per win, best policy; weakest option's win %). Baseline cheapest: L60 34.9,
L70 37.2, L80 35.6, L90 36.2, finale 37.8 (needs 35 / 45; L60 and the finale are user-accepted misses).

| Bosses get | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|
| Roar at L60–L80 + finale, Banish at L90 + finale | 34.4 | 36.7 | 35.1 | **31.4 ✗** | 35.3 |
| Same, Banish at ×2 damage (variant) | 34.4 | 36.7 | 35.1 | **31.6 ✗** | 35.5 |
| Cleaving Roar only, all five | 34.4 | 36.7 | 35.1 | 35.8 | 37.6 |

Weakest option wins 100% and stock use stays ≤ 4% in every row. Every variant makes the Conjurer's boss
fights **cheaper**: Banish drops the L90 boss under its 35% floor even at double damage (the cheapest option
is Earth + Heir, whose Golem soaks the hit), and Roar alone still shaves 0.2–0.5 points off cells that already
sit at or under the floor. So bosses stay as they are (D2).

### 4.4 Verdict

The recommended option (regulars only, §2.3; bosses untouched) **passes**: at-level 100%, 5-down identical,
no other lineage touched, no boss cell moves.

## 5. Conventions & handoff checklist

- [x] Stock/drop tables: not touched. Monster `techs` arrays: APPEND only (§2.3).
- [x] Icons: none new (both tech icons exist).
- [x] Ids: no new ids; one new optional tech field `vsCompanion`.
- [x] Save impact: none (battle-transient; save stays 12).
- [ ] Engine: `js/core/battle.js` `monsterAct` affordable loop (§2.1), guarded `Game.Companion &&
  Game.Companion.isSuppressed`; comment citing this spec. ONE interpreter, no per-monster branch.
- [ ] Wiki: the monster-tech note (`js/ui/wiki.js` ~line 511) adds "Only used against a bound companion."
  for `vsCompanion` techs.
- [ ] Tests (`tests/test_companion.js`, stubbed RNG): a carrier never picks a `vsCompanion` tech with no
  companion, with a dead companion, or at 5 levels down; does pick it with a live companion at-level;
  Banish Conduit's damage lands on the companion only. `tests/test_p3_battle.js` Test 0 (monsters reference
  real techs) and Test 74 (behaviors) stay green with no constant change. Existing Test 7 / G keep passing
  (they set `b.monster.techs` and bind a companion).
- [ ] Changelog (player-facing draft): "Some of the strongest wardens and Anima-casters past level 60 now
  turn on a summoner's bound elemental: watch for Cleaving Roar and Banish Conduit."

## 6. Open decisions

| # | Question | Recommendation |
|---|---|---|
| D0 | Interpretation: give the specials to L60+ monsters without changing anything for heroes who have no companion | Yes |
| D1 | `vsCompanion` gate (vs letting every class face the two techs) | Yes: without it, eleven lineages get two new ungraded techs and every L60+ grid needs re-gating |
| D2 | Bosses: none / Cleaving Roar only / both | **None.** Every variant lowers the Conjurer's boss cost (§4.3); Banish breaks the L90 floor |
| D3 | The 14 carriers of §2.3 (8 Roar, 6 Banish) | As listed; any swap within the L60+ regulars needs only the §4.2 re-run |
| D4 | Ship with the contract fixes in v1.15.0 or later | With v1.15.0 (same branch, no save change) |

## 7. Out of scope

- A special that makes companion play *more* expensive for the hero (e.g. one that unbinds the companion
  outright). §4.3 shows damage aimed at the companion can't do that; it would be a new effect, its own spec.
- The Conjurer's boss cells at L60 and the finale (user-accepted, `docs/SPEC-COMPANION-SPELLPOWER.md` §8).
- Modelling companion HP carried over between fights in the sims (the fixture binds at full HP each fight).
- Champion variants of the 14 carriers were not simmed separately (the gate is in the shared tech-choice loop, so it applies to them too).
