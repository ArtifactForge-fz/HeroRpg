---
name: balance-sim
description: Run a deterministic battle simulation with the real game code before locking any combat-affecting constant or mechanic (damage, armor, HP, energy, techs, affixes, consumables, XP/AP curves). Mandatory phase-0 gate for any spec that touches combat math; also use to verify an agent's balance claim during review.
---

# Balance simulation

Never eyeball a combat number. Every constant that affects battle outcomes gets locked by
simulation BEFORE implementation (phase-0 gate: precedents F1, E0, v1.4 P0 / commit
`3a1effd`), and every balance claim in an agent delivery gets re-simmed during review.

## Harness

Write the sim to the scratchpad (sims are ephemeral; only the *results* are durable — they
go in the spec and the commit message). Run with `node`.

1. **Load the real game code** in node `vm` — copy the preamble from
   `tests/test_p3_battle.js` (absolute base path, `vm.runInThisContext`). For pure combat
   sims load only `balance.js` + `js/data/*` + `js/core/*` in the `index.html` order —
   core is DOM-free by architecture, so no fakedom needed. If you must load `save.js`,
   stub `window.localStorage`.
2. **Seed the RNG.** `Game.Battle._rng` is the single RNG surface (world.js delegates to
   it). Replace it with a seeded mulberry32:
   ```js
   function mulberry32(seed) { return function () {
     seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
     var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
     t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
     return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
   Game.Battle._rng = mulberry32(runIndex);
   ```
   Never add a second `_rng`.
3. **Drive loop:** copy `fightOnce()` from `tests/boss_fixture.js` — it drives
   `Game.Battle.start(monsterId, options)` / `attack()` / `useItem()` with the standard policy:
   use a Crystal *before* the next action would empty the Energy pool (`useItem` is refused at
   0 Energy), heal below 40% HP, else attack (casters: best affordable Firebolt rank). It also
   tallies HP spent (HP lost + HP healed). Fixture: the **prepared** build — best non-unique,
   non-cursed gear in every slot, half-level skills, the lineage open at that level with every
   passive bought, 6 best heals + 6 best Crystals (`buildPreparedWarrior()` there is the warrior
   case). Boss gates run every lineage × class option on these rules
   (`docs/SPEC-BOSS-COST-BAND.md` §3.3). Don't gate bosses on an under-geared build: the
   contract is written for prepared heroes.
   Gotcha: set `c.dexterity = 999` when you need deterministic player-first initiative —
   a monster opening strike consumes RNG and desyncs seeded comparisons.

## Grid and metrics

- **≥300 trials per cell** (the v1.4 P0 standard).
- **Cells:** at-level regular monster; boss with a *prepared* player (consumables,
  at-tier gear); 5-levels-down.
- **Metrics:** win %, rounds, **HP spent per win** (heals included), HP left, damage-per-energy,
  consumables spent (and as % of stock). HP left alone is not a cost metric: heals reset it, so it
  barely moves with boss strength (`docs/SPEC-BOSS-COST-RETUNE.md` §1.2).

## The difficulty contract (pass/fail)

- At-level regulars: **≥85–100% win**.
- Bosses (`docs/SPEC-BOSS-COST-BAND.md` §2, amended by `docs/SPEC-BOSS-COST-RETUNE.md`):
  each lineage's **weakest** class option wins **≥ 85%** (finale ≥ 75%); its **cheapest** option
  spends **≥ 35% of the HP bar per win** or ≥ 3 consumables (finale: ≥ 45% HP spent); the most
  expensive build spends **≤ 50% of its stock**. No win ceiling — 100% is fine if it pays.
- 5-levels-down: certain death via Fear. Known accepted limitation: not fully enforced
  past ~L50 (Fear-spared healing sustain, DESIGN §4). New mechanics must not *widen*
  this hole — verify true 5-down cells stay at ~0% win.

## The ratchet principle

When a sim violates the contract, adjust the **new** mechanic (cap it, taper it, gate it
by levelReq) — never re-tune shipped constants. Precedents: gear taper and tech-power tap
apply only levelReq>35; Frenzied affix capped +40%; limit break ×2.5→×2.0. Established
formulas in AGENTS.md §"Established balance formulas" are not re-derived.
