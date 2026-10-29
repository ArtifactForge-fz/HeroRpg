# SPEC — Three contract fixes from the v1.9 queue (Shadowlash II, L5 knife/polearm, command techs under Fear)

**Status:** IMPLEMENTED on branch `v1.15-contract-fixes` (stacked on PR #5's `v1.11-hero-tree`; retarget
to `main` once PR #5 merges). Not released or deployed. D1–D5 approved by the user 2026-10-29 as
recommended. P0 sim gate (§4) passed on sim-only patches; the implementation re-sim (§9) matches it
cell for cell. Authored 2026-10-29 (user-directed: "Spec all three", following
`docs/REVIEW-2026-10-29-V19-QUEUE.md` items 3, 4 and 5).

**Relationship to authority:** changes one shipped tech value (F1), adds two weapons (F2) and closes a
gap in an existing `[invented]` ratchet (F3, `docs/SPEC-COMPANION-SYSTEM.md` §3 S4). No archived rule is
touched and nothing is `[revised]`. Each touches shipped content, so each is a user decision (ratchet
principle, `docs/LEAD-PLAYBOOK.md` §0.3). **No save change** (save version stays 12): no new persisted
field; known techs and owned items are never re-checked.

---

## 1. F1 — Shadowlash II needs Conjuration 8, not 5

**Problem** (`docs/SPEC-TECH-CHAIN-COMPLETION.md` §3–§4 F1): every spell chain's rank II needs its
skill at 8; Shadowlash II needs 5 (baseline v1 data, no citation). A level-10 caster who trains
Conjuration casts a power-27 spell while its Firebolt is still rank I (power 14). That opens five
5-levels-down cells at L15–L20 (51–100% win where Firebolt alone wins 0–1%).

**Change** (`js/data/techs.js` `tech_shadowlash_2`): `skillReq: 5` → `skillReq: 8`, citation
`// invented, docs/SPEC-CONTRACT-FIXES-V19-QUEUE.md §1 (the rank-II step of every spell chain, SPEC-TECH-CHAIN-COMPLETION §2.3)`.
Update the rank's `desc` ("Requires Shadowlash I and Conjuration 8.").

**Knock-on:** `BALANCE.ACADEMY_SKILLREQ_CAP` moves Shadowlash II from Eldor (cap 5) to Ju`Mak (cap 10),
the same town as every other rank II. The four `tests/test_academy.js` invariants still hold (rank I
stays in Eldor; rank III, skillReq 12, is taught in Saratus, after Ju`Mak). No test hard-codes the
curriculum sizes. Heroes who already learned it keep it (an already-known tech is never re-checked).
`docs/SPEC-TECH-CHAIN-COMPLETION.md` §2.3 drops its "exception" line and cites this spec.

## 2. F2 — a level-5 knife and a level-5 polearm

**Problem** (review §2): Knives jump from `knife_worn_dagger` (L1, damage 4) to `knife_thieves_edge`
(L6, 15), Polearms from `polearm_ashwood_spear` (L1, 7) to `polearm_militia_halberd` (L7, 17). Swords
have `sword_soldiers_blade` at L5. A prepared level-5 Gambit or Assassin wins **52%** at-level against
`estari_construct_sentinel` (Armor 7); a Dragoon 92% at 60% HP spent.

**Change** (`js/data/items.js`, appended to each family block). Values follow the weapon-tier formula
(`CLAUDE.md`: damage ≈ 3 + 2 × levelReq), mirror the Soldier's Blade (weight, value, statReqs) and take
the family's band-0 signature stat (`docs/SPEC-SECONDARY-STATS.md` §2.8):

| id | name | skill | damage | weight | levelReq | statReqs | value | bonuses |
|---|---|---|---|---|---|---|---|---|
| `knife_scouts_dirk` | Scout's Dirk | Knives | 13 | 3 | 5 | dexterity 12 | 90 | critChance 0.02 |
| `polearm_watchmans_spear` | Watchman's Spear | Polearms | 13 | 6 | 5 | strength 12 | 90 | armorPen 0.05 |

All `[invented]`, citing this spec §2. Descriptions (player-facing, no archive notes): Dirk — "A
scout's double-edged dirk, light enough to draw and strike in one motion."; Spear — "A sturdy
ash-and-iron spear carried by the watchmen on Eldor's walls."

**Sources** (same paths as the Soldier's Blade, so the three L5 weapons are equally reachable):
- shops: appended to the Ju`Mak Village and Laik stock lists (`js/data/areas.js`), next to the
  Soldier's Blade;
- drops: appended to `estari_construct_sentinel`'s drops at 0.04 each (append-only; the list has no
  chance-1 entry);
- recipe (Polearm only; Eldor synthesis): `synth_watchmans_spear` = 2 × `polearm_ashwood_spear` +
  40 gold, mirroring `synth_soldiers_blade`. No knife recipe: two Worn Daggers already make the
  Thieves' Edge (`synth_thieves_edge`).

**Icons:** `assets/icons/knife_scouts_dirk.png` and `polearm_watchmans_spear.png`, real 32×32 DCSS
tiles pulled by the lead (sub-agents have no network), mapping added to `assets/CREDITS.md`. Items may
reuse tiles, but prefer an unused one.

**Knock-on:** `tools/check_reachability.js` / `tests/test_reachability.js` must stay at zero dead
items; the wiki picks both up from `Game.Data` (`test_wiki.js` counts rows from the data, no
hard-coded total). The boss fixture's L10 build is unchanged (it already prefers `knife_gares_fang`,
L9, and the halberd at L7+).

## 3. F3 — command techs can't be cast while Fear overwhelms the companion

**Problem** (review §3): at 5+ levels below the enemy the companion idles
(`COMPANION_FEAR_SUPPRESS_LEVELS`, `js/core/companion.js`), but the player can still cast its command
techs (`requiresCompanion`: Conflagration, Renewing Tide, Bulwark, Tailwind). With Bulwark or Tailwind,
a Conjurer wins 89% of fights 6 levels up where no pact wins 80%, so the pact widens the 5-down hole
the ratchet was built to keep closed.

**Change** — `[invented]`, extends the S4 ratchet of `docs/SPEC-COMPANION-SYSTEM.md` §3 ("the companion
draws on the player's Anima…"):
1. One helper, `Game.Companion.isSuppressed(battle)`: a bound companion exists and
   `Game.Battle.fearLevels(battle) >= BALANCE.COMPANION_FEAR_SUPPRESS_LEVELS`. `act()` and the
   battle-screen note in `js/ui/screens.js` switch to it (no behaviour change there).
2. `js/core/battle.js` `useTech`, in the existing `requiresCompanion` gate (before any Energy or
   shard cost): if `Game.Companion.isSuppressed(battle)`, log "Your <companion> is overwhelmed and
   cannot answer your command." and return. Guarded-hook pattern (`if (Game.Companion && …)`).
3. `tests/boss_fixture.js` `usableNow`: also require `!Game.Companion.isSuppressed(battle)` for a
   `requiresCompanion` tech, so sims model a player who doesn't press a refused button (otherwise the
   `techs` policy retries the refused buff every turn).

No new constant. Only the 5-down zone changes; at +0 to +4 and in every boss fight (hero at the boss's
level) the gate never fires.

## 4. P0 sim gate (2026-10-29)

`/balance-sim` rules: real code, seeded mulberry32 (trials from seed 7000), **300 trials per cell**,
prepared fixture (`tests/boss_fixture.js` `build()`). Each fix applied as a sim-only patch on top of
unpatched v1.14.0 and compared cell by cell with the baseline. Scripts in the session scratchpad.

### 4.1 F1 (Magus and Cleric, all 77 regular monsters, at-level + 5-down; sets as SPEC-TECH-CHAIN-COMPLETION §3)

- Only the four-grade set (`all4`) changes, in 14 cells per lineage, and only at hero L10–L15
  (Conjuration 5–7). Firebolt-only and Evocation sets are identical.
- **5-down:** the five failing cells close — `foothills_stoneback_giant` 51 → 0%,
  `juneros_tidewalker` 67 → 0%, `juneros_reefstalker` 69 → 0%, `juneros_riptide_hunter` 100 → 1%,
  `foothills_ridge_hound` 98 → 18% (18% is what the Evocation set already wins there with Starspark I).
  Band means: L8–15 11 → 1%, L16–29 64 → 38% (Firebolt alone 33%).
- **At-level:** still 100% in all 77 cells. At hero L10–L15 the four-grade caster's HP spent per win
  rises from 20–32% to 43–57%, exactly the Evocation set's numbers — it loses a rank's head start no
  other chain had.

### 4.2 F2 (Paladin, Gambit, Assassin, Ranger, Dragoon; every regular monster up to L20; basic Attack)

- The new weapons are picked only at hero L5 (Gambit, Assassin: Scout's Dirk) and L5–L6 (Dragoon:
  Watchman's Spear). Every other build is unchanged.
- **At-level:** `estari_construct_sentinel` Gambit/Assassin 52 → **100%** (HP spent 73 → 27%), Dragoon
  92 → 100% (60 → 30%); `estari_anima_scavenger` twinblades 98 → 100%. No at-level cell under 85%.
- **5-down:** every cell identical to the baseline, including the L10–L11 monsters whose 5-down
  heroes (L5–L6) now carry the new weapons: Fear still wins those fights.

### 4.3 F3 (Conjurer, every regular monster from L65 up, 5 and 6 levels above the hero, `techs` policy)

Gate modelled as the policy never casting a command tech while the companion is suppressed (= §3
items 2 + 3):

| Above hero | No pact | Earth before → after | Wind before → after |
|---|---|---|---|
| +5 | 96 / 91 | 98 / 92 → **96 / 91** | 97 / 79 → **96 / 91** |
| +6 | 80 / 183 | 89 / 172 → **80 / 183** | 89 / 138 → **80 / 183** |

(win % / HP spent per win %). Every pact is now identical to no pact at +5 and +6, which is what the S4
ratchet promised. +3/+4 and boss cells are unchanged by construction (Fear below 5).

### 4.4 Verdict

All three pass: each closes its failing cells, no at-level cell drops under 85%, no 5-down cell gets
easier, and no boss cell moves (F1 and F2 don't change any L10+ boss build; F3 never fires at a boss).

## 5. Tests

- **F1:** in `tests/test_academy.js`, assert Shadowlash II is taught in Ju`Mak and not in Eldor, and that
  every spell chain's rank II needs 8 (guards the ladder against the next outlier).
- **F2:** in `tests/test_p2_inventory.js` (or `test_p6b_content.js`), assert both weapons exist at
  levelReq 5, damage 13, with their band-0 bonus, and are sold in Ju`Mak; the recipe turns 2 Ashwood
  Spears + 40 gold into a Watchman's Spear. Icons via `test_icons.js`, reachability via
  `test_reachability.js` (both already generic).
- **F3:** in `tests/test_companion.js`, stubbed RNG: with a bound Wind companion, at 5 levels below the
  monster `useTech('tech_cmd_tailwind')` is refused — no Energy spent, no buff, the log line present; at
  4 levels below the same cast works. `isSuppressed` false with no companion.
- Never weaken an assertion; all 16 suites green.

## 6. Out of scope (found while gating)

- **Some L9–L20 monsters can be beaten 5 levels up with a basic Attack.** In the F2 baseline,
  `foothills_ridge_hound` (L15) and `juneros_riptide_hunter` (L20) lose 74–100% of fights to every melee
  line 5 levels down; `foothills_gale_harrier`, `foothills_barrier_wolf`, `juneros_reefstalker` and
  `juneros_tidewalker` lose 24–96% to some. This is below the L29 line where the accepted Fear-sustain
  limitation starts. Unchanged by these fixes; needs its own look (likely the monsters' damage or
  armor, not the hero side).
- Firebolt-only casters winning 5-down at L21–L28 (`docs/SPEC-TECH-CHAIN-COMPLETION.md` F2).
- `target` specials on monsters and companion icons (review §4–§5).

## 7. Decisions

| # | Question | Recommendation |
|---|---|---|
| D1 | F1: Shadowlash II skillReq 5 → 8 | Yes (the ladder value) |
| D2 | F2: two new L5 weapons (vs moving Thieves' Edge / the Halberd down to L5, or lowering the Sentinel's Armor) | New weapons: the only option that keeps both the tier formula and the shipped items; moving the Halberd to L5 would put damage 17 at L5 (+4 over the curve) |
| D3 | F2 sources: Ju`Mak + Laik shops, Sentinel drops, a Polearm recipe | Yes (the Soldier's Blade's paths) |
| D4 | F3: refuse command techs while the companion is suppressed | Yes |
| D5 | Ship as one release (v1.15.0) after PR #5 merges, or stack on PR #5 | After PR #5, on a new branch from `main` |

## 8. Checklist

- [x] Problems measured on the real code (`docs/REVIEW-2026-10-29-V19-QUEUE.md`)
- [x] P0 sim gate, 300 trials, all three pass (§4)
- [x] User approval of D1–D5 (2026-10-29, as recommended)
- [x] Implementation (Sonnet subagent per `/delegate-review`; lead pulled the two icons)
- [x] Lead review: suites, diff read, re-sim §4 on the real implementation (§9)
- [ ] Browser check of the two weapons in the Ju`Mak shop and the refused-command log line
- [ ] Changelog entry + release per `/release` (v1.15.0, after PR #5 merges)

## 9. Implementation and gate (2026-10-29)

- `js/data/techs.js` `tech_shadowlash_2`: skillReq 8, desc updated.
- `js/data/items.js`: `knife_scouts_dirk`, `polearm_watchmans_spear`; `js/data/areas.js` Ju`Mak and Laik
  stock; `js/data/monsters.js` two appended Sentinel drops; `js/data/recipes.js` `synth_watchmans_spear`.
  Icons `item/weapon/short_sword1` and `item/weapon/spear3` (`assets/CREDITS.md`).
- `js/core/companion.js` `isSuppressed(battle)`, used by `act()`, by the new `useTech` refusal in
  `js/core/battle.js` (before any cost) and by the battle-screen note in `js/ui/screens.js`.
- `tests/boss_fixture.js` `usableNow` skips a command tech while the companion is suppressed.
- Tests: `test_academy.js` Test 6 (Shadowlash II in Ju`Mak, not Eldor; every spell chain's rank II needs
  8); `test_p6b_content.js` "Contract fixes §2" (stats, stock, drops, the recipe through
  `Game.World.synthesize`); `test_companion.js` Test 17 (Tailwind refused at 5 levels down with no
  Energy spent, cast at 4). Stale constant: `test_secondary_stats.js` Test 10 family counts Knives
  17 → 18, Polearms 13 → 14. All 16 suites pass; `tools/check_reachability.js` reports no dead items.
- **Re-sim on the implemented code** (same scripts and seeds as §4, no patches): F1 Magus sweep identical
  to the gated run in all 139 cells × 3 sets; F2 melee sweep identical in all 49 cells × 5 lineages;
  F3 +5/+6 cells: every pact 96 / 91 at +5 and 80 / 183 at +6, the no-pact numbers.
