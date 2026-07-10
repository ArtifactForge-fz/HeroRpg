# SPEC — Full 100+ Level Arc

**Status:** IN PROGRESS — started 2026-07-10 on branch `level-arc`, after v1.2 landed on main.
Currently in **F1 (balance-to-100)**. Decisions D1–D4 resolved (see §10). NOTE: the third class
tier (F4's roster — Shadowknight/Magus/Gambit + Runeblade→legendary) already shipped in **v1.2** at
unlock level 38; F4 here is reduced to **re-gating tier-3 to ~L60** once content supports it, plus a
class-balance pass across the extended range.
**Owner model:** lead (scoping/spec/review) drafts; Sonnet subagents do the content/mechanical work.
**Relationship to authority:** This spec *extends* `docs/DESIGN.md` §10.3, which deliberately scoped
v1 to "levels 1–40 playable." It does not override any archived mechanic — it grows the content
volume and re-validates the balance formulas across a longer range. When this ships, update
DESIGN.md §10.3's content-volume target and this file's status.

---

## 1. Goal & archival justification

The current remake is a **deliberately condensed** reconstruction: content spans roughly levels
1–40 (final lair *Eidas Echo / The Skyspire Anchor* gates at minLevel 40). The original ran far
longer:

- **Designed for a level-100 cap.** `homepage_2007.md` (2007-05-25): *"The game was originally
  designed based on a level-100 cap, though we have decided to extend that to a dynamic cap that
  can be changed as content is released."* → **[archived]**
- **~109 levels of content in practice** during the 6.x era. `homepage_2006.md`: *"After playing
  the game through all 109 levels for myself…"* → **[archived]**
- **Multi-tier class advancement (Tier 4 *and* Tier 5).** `homepage_2006.md`: *"working on Tier 4
  and 5 advancement for heroes."* → **[archived]** — justifies a class tier beyond the current
  advanced tier across the extended range.

**Tag for this whole feature: [revised]** — it extends the [invented] condensed arc, but the target
scale (100) is itself [archived]. The intermediate content (monsters, quests, items) remains
[invented], mined from `reference/` per the standing convention.

**Design intent:** reach parity with the original's *scale and pacing shape*, not a level-for-level
clone (no server-side numbers survived). The deliverable is a game that plays coherently and stays
balanced from creation to level 100, with the class/skill/tech/economy systems all scaling cleanly.

---

## 2. Level cap & pacing target

- **Hard cap: level 100.** Introduce a single constant `BALANCE.LEVEL_CAP = 100` and route every
  place that currently assumes an open-ended level (XP display, "max level" checks, skill cap,
  area gating) through it. Storing the cap as one constant honors the archived **dynamic-cap**
  direction: a future raise is a one-line change, not a refactor. (Open decision D1 below.)
- **XP curve.** Current: `XP_TO_LEVEL(n) = round(50·(n−1)^1.8)` (invented). Decide whether to keep
  the exponent and simply let it run to 100, or flatten the late curve so 40→100 isn't a wall.
  - At n=40 the curve gives ~28k cumulative; at n=100 ~200k+. Whether that's the right *time* to
    100 is unknown until simulated. **Design target to pick:** e.g. "level 100 ≈ 40–60 h of focused
    play," with level 30 (first advanced class) still ≈ 3–4 h per DESIGN.md §10.1.
  - Any curve change is **content-neutral** (no save fields) — it can ship in the balance phase.
- **Fear & the ±5 XP/loot cutoff** (`FEAR_STAT_PENALTY_PER_LEVEL`, `XP_LOOT_CUTOFF_LEVELS`) are
  archived and unchanged, but their *feel* over 100 levels must be checked: the cutoff means the
  hunting-area level bands must be dense enough that a player always has at-level targets (no
  10-level content gaps), or leveling stalls.

---

## 3. Content-volume gap analysis

Current counts (2026-07-10) vs. rough targets for a 1–100 arc. Targets are ballpark for scoping —
tune during phasing. "Density" is the design rule that generates the target.

| Content | Current | Target (1–100) | Density rule |
|---|---|---|---|
| Hunting areas | 12 (+2 towns) | ~24–28 hunting | one band every ~4–5 levels, spread across the 6 regions of Van Arius |
| Monsters | 45 | ~120–150 | ~4–6 distinct monsters per area band |
| Bosses / lairs | ~6 lairs | ~16–20 | roughly one boss every ~5–6 levels (difficulty-contract checkpoints) |
| Weapons/items | 106 | ~230–280 | extend weapon tiers (see §4); consumables/armor per band |
| Techs | 47 | ~90–120 | extend each magic-school chain + weapon-tech ranks to cover the range |
| Quests | 20 | ~45–55 | continuous main-story spine + side quests per region |
| Classes | 10 | ~13–16 | add a third advancement tier (§5) |
| Towns/facilities | 2 towns | 4–6 settlements | seed from archived settlement names (§6) |

Icons are a **hard gating constraint**: every new item/monster/tech id needs a 32×32 CC0 tile that
is hash-distinct from all existing icons (`test_icons.js` enforces presence; the artifact bundler
data-URIs them). ~+400 new ids ⇒ ~+400 icons sourced from the "Dungeon Crawl 32×32" set (see
`assets/CREDITS.md`). Budget this explicitly — it's the single largest mechanical cost and can be
parallelized but not skipped.

---

## 4. Balance-formula scaling (the critical risk — prove before authoring content)

The core formulas are **linear in level** and were only ever validated to ~level 40. They must be
re-simulated to 100 *before* any content is authored, because content authoring assumes the math
closes. Relevant archived/invented constants (`js/balance.js`):

- Monster: `hp = 20 + 12·lvl` → **1220 HP at lvl 100**; `damage = 3 + 2·lvl` → **203 at lvl 100**;
  `energy = 40 + 10·lvl`.
- Player: `energy = 100 + 5·lvl` → **600 at lvl 100** (≈120 actions at `ATTACK_ENERGY_COST 5`);
  `+5 stat points/level` → ~500 distributable by 100; damage via `STRENGTH_DAMAGE_RATIO 2.5:1`.
- Skill cap = `2·lvl + 1` → **201 at lvl 100** (archived, scales fine); skill XP pacing target
  ≈ 2 skill levels per character level must still hold with `SKILL_XP_FOR_LEVEL`/`SKILL_CAP`.
- `ANIMA_SHARDS_CAP 999` (archived) — fine; but shard *income* over 100 levels may trivialize
  shrine buffs — check.

**Known danger, already seen once:** the Phase 7 note in `balance.js` records that *fixed* energy
pools made endgame fights "mathematically unwinnable." The same class of failure (player output not
keeping pace with `12·lvl` HP growth, or armor over-scaling and stalling melee — the "over-armoring"
bug that "happened twice" per CLAUDE.md) is the top risk at level 100. Do not assume; simulate.

**Weapon tiers** (archived at levelReq 1 / 5–15 / 25 / 35, damage ≈ 3+2·levelReq) must be extended:
add tiers at ~45 / 55 / 65 / 75 / 85 / 95, damage ≈ 3+2·levelReq, uniques (monster-drop-only,
+15–25%) per band. Keep the standing drop-table convention (append-only, first-hit-wins).

**Economy:** gold income vs. shop/inn/synthesis costs (`INN_FEE_BASE + INN_FEE_PER_LEVEL`,
synthesis recipes) must not inflate into irrelevance or starvation by level 100. Re-tune the
per-level fee slopes as part of the balance phase.

---

## 5. Class system across the extended arc

Archived **Tier 4 and Tier 5** advancement (`homepage_2006.md`) supports a class tier beyond the
current advanced tier. Proposal:

- **Third advancement tier (tier: 3 roster slot), obtained ~level 60** via a new capstone quest,
  branching once more from each advanced class. Use the **archived unused names** first (already in
  the CLAUDE.md backlog): **Magus** (from Wizard/Sage line — Magician), **Gambit** (from Rogue/
  Mercenary line — Thief), **Shadowknight** (from Gladiator/Crusader line — Warrior). These three
  are archived (`homepage_2006.md`; item class-restriction line "Class: Sage, Magus, Wizard" in
  `forum/t-787.md`), not invented. A second third-tier branch per line, if needed, is [invented].
- **Reuse the existing tier machinery.** `Game.Classes.advancedOptionsFor()` and the `tier`/
  `baseClass` fields already generalize; a third tier needs a `tier: 3` + `baseClass: '<tier-2 id>'`
  convention and a new quest gate mirroring `trials_of_eldor`. The Legendary Runeblade (currently
  `tier: 3` *display-only*) must be renumbered to avoid colliding with a real gameplay tier 3 —
  bump it to `tier: 4`/`legendary` and confirm `advancedOptionsFor` still ignores it.
- **Class XP curve** (`classXpForLevel(n) = round(30·(n−1)^1.6)`) already runs unbounded; verify a
  third-tier class can realistically reach its ability costs by level 100 given the half-rate
  secondary rule.
- Ability count per third-tier class: ~4–5, powers a controlled step above the advanced tier
  (respect the "balance-sanity: within +25% of prior power" discipline noted in `classes.js`).

---

## 6. World / regions / story

- **Van Arius has six regions**; only **Averast** is archived in detail (`manual/Van_Arius.md`,
  `Averast.md`). The extended arc fills the other five as successive level bands. Seed settlements
  from archived names: **Saratus** (Arkan capital), **Ju`Mak Village**, **Laik / Riverside
  Village**, **Gares Riverbanks** (archived level-20 area), plus lore sites **Kastengard** and the
  **Skyspire** (already used as the level-40 capstone) → push the Estari/Eidas storyline northward
  toward the Majiku lands for the 40–100 span.
- **Story spine:** Chapter II onward was never archived (`Chapter_I.md` is the last captured) →
  **[invented]** continuation, anchored in the archived taboo (Anima mining kills Exos), the
  Society of Modern Magic, and Eidas's "divine race" on the red moon. The main quest should provide
  a narrative reason to climb each region band, so leveling never feels contentless.

---

## 7. Save / migration implications

- Pure content additions (new monster/item/tech/area/quest ids) need **no** schema change or version
  bump — they're data, and transient battle state is never persisted.
- **Requires a version bump + migration** only if character fields change. Likely triggers:
  - Third-tier class entries: none needed if they reuse the existing `c.classes[classId]` shape
    (they do) — no migration.
  - `LEVEL_CAP` constant: no persisted field — no migration.
  - Any new persisted counter (e.g. region-unlock flags, new story flags) **does** need
    `character.js create()` + a migration step + the full v1→current chain test, per CLAUDE.md.
- Net: this feature is likely **migration-light**. Keep it that way by preferring derived/computed
  gates over new stored fields.

---

## 8. Testing

- **Balance simulations (gate for the whole feature):** extend the existing sim pattern (`node vm`
  loading real game code) to measure, at level bands 40 / 60 / 80 / 100: win %, average rounds,
  HP-left, and damage-per-energy, for at-level regulars and for each boss. Enforce the archived
  **difficulty contract** at every tier: prepared players win reliably but pay; at-level regulars
  ≥85–100% win; 5-levels-down = certain death via Fear.
- **Full-arc progression sim:** an optimal-ish build played 1→100 that asserts pacing (no dead
  bands where the ±5 cutoff starves XP; time-to-100 within the §2 target).
- **Update stale hardcoded counts** in the 10 suites (monster count, area count, save version if
  bumped) — never weaken a behavioral assertion; update the constant.
- New mechanics (third class tier, any new status/tech kind) need stubbed-RNG tests.
- All ten suites green before any phase is called done (`cd tests && for t in test_*.js; do node
  $t; done`), and no artifact redeploy while suites are red.

---

## 9. Phasing (ship in green, committable sub-phases)

Each phase ends with all ten suites green and its own commit; content phases branch off `main`.

- **F1 — Balance to 100 (no new content).** Add `LEVEL_CAP`; decide/patch the XP curve; extend the
  weapon-tier table and per-level economy slopes; build the 40/60/80/100 sims and the full-arc sim.
  **Exit gate:** sims prove fights close and pacing holds *before* any content is authored. This is
  the highest-risk phase and must come first.
- **F2 — World & areas.** Region bands + hunting areas + lairs across 40→100, level-gated; no gaps
  wider than the ±5 cutoff.
- **F3 — Content volume.** Monsters, items/weapons (extended tiers + uniques), techs (extended
  chains) to fill the F2 bands; icons sourced hash-distinct. Largest mechanical phase — parallelize
  across Sonnet agents with full per-agent briefs.
- **F4 — Third class tier.** Magus/Gambit/Shadowknight (+ optional branches), capstone quest,
  Runeblade tier renumber, class-balance sanity pass.
- **F5 — Quest & story spine.** Main-quest continuation + side quests per region to carry narrative
  1→100.

Phases are ordered by dependency: F1 de-risks the math, F2 lays the level skeleton, F3 fills it,
F4/F5 add the systems that ride on top. F3–F5 can overlap once F2's bands are fixed.

---

## 10. Open decisions (resolve at F1 kickoff)

- **D1 — Hard cap vs. dynamic.** Recommend a **hard cap of 100** exposed as one constant, matching
  the archived original design; the archived "dynamic cap" becomes trivial to honor later. Confirm
  100 (not 109 or open) is the target.
- **D2 — XP-curve reshape.** Keep `50·(n−1)^1.8` and just extend, or flatten 40→100? Pick a
  concrete time-to-100 target so the sim has an assertion.
- **D3 — Third-tier branch count.** One branch per advanced class (3 new classes, all archived
  names) or two (adds [invented] names)? Recommend start with the three archived names.
- **D4 — Region count actually built.** All six Van Arius regions, or fewer larger ones? Affects
  F2 scope.

### Decisions resolved (2026-07-10, F1 kickoff — lead)

- **D1 → hard cap 100.** Add one constant `BALANCE.LEVEL_CAP = 100` (archived: game "originally
  designed based on a level-100 cap", `homepage_2007.md`); route all level-cap logic through it so a
  future raise is one line (honors the archived "dynamic cap" direction).
- **D2 → keep the low curve, reshape the tail, target ~40–60 h to 100.** Preserve `50·(n−1)^1.8`
  through ~L40 so early pacing is unchanged (level 30 stays ~3–4 h, DESIGN §10.1); if the F1 sim
  shows 40→100 is a grind wall at realistic monster-XP rates, flatten the tail (reduced exponent or
  a gentler segment past ~40) so total time-to-100 lands in ~40–60 h. Content-neutral (no save
  fields); the F1 sim picks the exact numbers and must assert the time-to-100 target.
- **D3 → the three archived names only.** Shadowknight/Magus/Gambit already shipped (v1.2); no new
  invented tier-3 branches this arc. A tier-4/5 advancement (archived direction) is explicitly
  deferred — our Legendaries currently occupy the `tier:4` slot, so a real 4th *advancement* tier
  would need a renumber and is out of scope here.
- **D4 → a single coherent northward progression, ~13 new hunting-area bands + 2–3 settlements**,
  one band per ~4–5 levels across 40→100 (no gap wider than the ±5 XP/loot cutoff). Seed from
  archived lore/names — the Forests of Kuraan, the Majiku lands to the north, deeper Kastengard, and
  the red-moon/Skyspire endgame (DESIGN §2, arc §6) — rather than formally instantiating all six Van
  Arius regions as separate systems. F2 fixes the exact band list.

## 11. Explicitly out of scope

Eidolons and every other v3.0 system (`manual/Version_3.0.md` — the developers explicitly *removed*
classes for v3.0; we are extending the v2.x class game, not adopting v3.0). Multiplayer-derived
features (mail, trade, auction, PvP, factions, pets) remain cut per DESIGN.md §9.

**Online / web-hosted mode** (persistent global chat + cross-device character retention) is a
*separate, orthogonal axis* — see the companion spec `docs/SPEC-ONLINE-HOSTING.md`. It works with
either the condensed or the full-100 arc; "similar to the original" (long arc **and** social/online)
is the two specs combined, but they can ship independently and in either order.
