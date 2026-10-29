# REVIEW 2026-10-29 — the v1.9 review queue, re-measured

The v1.9 merge (2026-07-25) left four known-accepted review items plus three open notes from PR #2
(`CLAUDE.md`, "Recently completed — v1.9.0"). Item 4 (legacy Conjurer ghosts) was fixed in v1.11.
This note measures the rest on the current code (v1.14.0, branch `v1.11-hero-tree`) and puts them
in order. Sims follow `/balance-sim`: real code, unpatched, seeded mulberry32 (trials from seed
7000), 300 trials per cell, prepared fixture from `tests/boss_fixture.js`. Scripts are in the session
scratchpad (not committed). **No game code changed.**

## Priority order

| # | Item | Status after this pass | Next step | Size |
|---|---|---|---|---|
| 1 | PR #1's missing spec (v1.9 item 1) | **Done**: `docs/SPEC-TECH-CHAIN-COMPLETION.md` (retroactive record) | — | — |
| 2 | PR #1's owed sim (v1.9 item 2) | **Done**: passes at-level; no new 5-down hole from PR #1's own chains (§1) | Q1 below | — |
| 3 | Shadowlash II needs Conjuration 5 (found by item 2) | **Fixed** on `v1.15-contract-fixes` (skillReq 8) | Release | — |
| 4 | Knives and Polearms have no L5 weapon (SPEC-TECH-POLARITY finding c) | **Fixed** on `v1.15-contract-fixes` (Scout's Dirk, Watchman's Spear) | Release | — |
| 5 | The +4 companion cliff (v1.9 item 3) | **Gone** (§3); the command-tech leak it uncovered is **fixed** on `v1.15-contract-fixes` | Release | — |
| 6 | No monster carries the `target` specials | **Fixed** on `v1.15-contract-fixes` (`docs/SPEC-COMPANION-TARGET-SPECIALS.md`) | Release | — |
| 7 | Companion icons are adapted copies | **Fixed** on `v1.15-contract-fixes` (real DCSS elemental tiles, §5) | Release | — |

**Fix spec for items 3, 4 and the item-5 leak:** `docs/SPEC-CONTRACT-FIXES-V19-QUEUE.md` (P0 sim
gate passed; awaiting approval). It also records a further finding: some L9–L20 monsters can be
beaten 5 levels up with a basic Attack by every melee line (its §6).

Items 3, 4 and the item-5 leak are the only contract failures found. Each is a small change, but all
three touch shipped constants or rules, so they need the user's call (ratchet principle).

## 1. PR #1's caster damage on every monster (items 1–2)

Full method and tables: `docs/SPEC-TECH-CHAIN-COMPLETION.md` §3. Summary:
- **At-level: 100% win in all 77 regular monsters** for Magus, Cleric and Seer with Firebolt only,
  with the Evocation chains, and with all four spell grades. HP spent per win drops 30% → 25%.
- **Five levels down,** the four-grade set wins more, but every gap traces to something older than
  PR #1: Shadowlash II's skill requirement at L15–L20 (item 3), Firebolt-only wins at L21–L28, and
  the accepted Fear-sustain limitation from about L29 up.

## 2. The L5 knife/polearm gap (item 4)

At-level sweep, every regular monster, Paladin / Gambit / Ranger / Dragoon, basic Attack only:
**76 of 77 monsters pass for every lineage.** The one failure:

| `estari_construct_sentinel` (L5, Armor 7) | Paladin | Gambit | Ranger | Dragoon |
|---|---|---|---|---|
| Win % | 100 | **52** | 100 | 92 |
| HP spent per win % | 28 | 73 | 30 | 60 |
| Damage per hit | 13.4 | 5.2 | 12.9 | 7.0 |

Cause: the weapon ladder. Swords get `sword_soldiers_blade` (L5, damage 13). Knives jump from
`knife_worn_dagger` (L1, 4) to `knife_thieves_edge` (L6, 15), and Polearms from `polearm_ashwood_spear`
(L1, 7) to `polearm_militia_halberd` (L7, 17). A level-5 knife user swings a 4-damage dagger into
Armor 7. The "floor-1" wording in SPEC-TECH-POLARITY finding c is out of date: since v1.6's
penetration floor only 4% of hits deal 1, but the hits are too small. Fix options for the user:
- **(a)** add a L5 knife and a L5 polearm at the formula damage (3 + 2×5 = 13), new ids + icons;
- **(b)** move `knife_thieves_edge` to levelReq 5 (and the halberd to 5), no new content;
- **(c)** lower the Sentinel's Armor 7 → 5 (the formula's "armor ≈ level").
(a) follows the weapon-tier convention (`CLAUDE.md`: tiers at 1 / 5–15 / 25 / 35); each option needs a
re-run of the L3–L10 at-level and 5-down cells.

## 3. The +4 companion cliff (item 5)

The July measurement used an L40 warrior with a companion bound by hand; companions can only be
bound by a T3 Conjurer (L60+), so it is re-measured on the prepared Conjurer: every regular monster
from L63 up, 3–6 levels above the hero, no pact vs each of the four pacts, policies `techs` and `kit`.

Mean win % / HP spent per win % (22 cells at +3 and +4, 21 at +5 and +6):

| Monster above hero | Policy | No pact | Fire | Water | Earth | Wind |
|---|---|---|---|---|---|---|
| +3 | `techs` | 100 / 35 | 100 / 28 | 100 / 32 | 100 / 33 | 100 / 34 |
| +4 | `techs` | 100 / 45 | 100 / 35 | 100 / 40 | 100 / 42 | 100 / 42 |
| +5 | `techs` | 96 / 91 | 96 / 91 | 96 / 91 | **98 / 92** | **97 / 79** |
| +6 | `techs` | 80 / 183 | 80 / 183 | 80 / 183 | **89 / 172** | **89 / 138** |
| +3 | `kit` | 100 / 29 | 100 / 24 | 100 / 26 | 100 / 21 | 100 / 24 |
| +4 | `kit` | 100 / 36 | 100 / 30 | 100 / 33 | 100 / 26 | 100 / 31 |
| +5 | `kit` | 99 / 63 | 99 / 62 | 99 / 62 | 99 / 63 | 99 / 62 |
| +6 | `kit` | 99 / 118 | 99 / 121 | 99 / 121 | 99 / 121 | 99 / 121 |

- **The +4 cliff is gone.** A prepared T3 Conjurer wins every +4 fight with or without a companion
  (98–100% in each of the 22 cells); a pact only makes the fight cheaper (up to −10 points HP spent).
  The July 53% → 99.7% jump came from an L40 fixture that can't have a companion in real play.
- **The Fear-suppress ratchet leaks through command techs (new finding).** At +5 and +6 the companion
  idles (`js/core/companion.js` `act`), but the player can still cast its command techs: Earth's
  Bulwark (+30 Armor buff) and Wind's Tailwind (+25 Spell Power buff), both `requiresCompanion`, both
  marked PROVISIONAL. With them, Earth and Wind win 89% at +6 where no pact wins 80%. A sim-only patch
  that makes command techs unusable while the companion is suppressed brings every pact to exactly
  the no-pact numbers at +5 and +6. Candidate fix: in `useTech`'s `requiresCompanion` gate
  (`js/core/battle.js`), refuse a command tech (before any Energy is spent) while
  `fearLevels(battle) >= COMPANION_FEAR_SUPPRESS_LEVELS`. This is the zone of the accepted Fear-sustain
  limitation (no pact already wins 80–99%), but the standing rule is that new mechanics must not
  widen it. User decision; needs a test and a re-run of these cells.
- With the full kit the tool choice drops the command techs at +5/+6, so all pacts tie there; the
  kit Conjurer wins 99% of +6 fights with no companion at all — the accepted limitation, unchanged.

## 4. `target` specials on monsters (item 6)

`mon_cleaving_roar` (`target: 'both'`, power 40) and `mon_banish_conduit` (`target: 'companion'`,
power 55) exist and are tested (`tests/test_companion.js` Test 7, `tests/test_p6_classes.js` G), but
no monster's `techs` list has them, and both powers are marked PROVISIONAL. They only matter against a
bound companion, so only for T3 Conjurers at L60+. Since v1.12 monster tech power scales with the
monster (`max(power, round(F × damage))`), so the provisional 40/55 are floors that L60+ monsters
already exceed. A content spec should: pick which L60+ monsters (and bosses) carry them, through the
archetype interpreter rather than per-monster code; re-run the Conjurer boss cells (they already sit
at the edge: L60 34.9%, finale 38%, both accepted) and the cliff cells of §3; and then drop the
PROVISIONAL tags.

## 5. Companion icons (item 7)

`assets/icons/comp_{fire,water,earth,wind}.png` are adapted copies. DCSS has real elemental tiles
(fire, water, earth and air elementals) under its monster set; the lead's Bash can fetch them
(icon pipeline notes in `CLAUDE.md`). Not test-gated for distinctness (only monster icons are), and
no balance impact, so this can go into any release.
