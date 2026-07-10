# CLAUDE.md — HeroRPG Remake

Single-player browser remake of **herorpg.net** (2004–2008, dead), reconstructed from Wayback
Machine scrapes. Static HTML/CSS/JS, no build step, no dependencies — open `index.html` via
`file://`. Currently **v1.1+, save version 8**.

## Cardinal rules

1. **`docs/DESIGN.md` is the authority.** Every game mechanic is tagged `[archived]` (documented
   in `reference/`, cite the file), `[invented]` (lost data, designed in the original's spirit),
   or `[revised]` (user-directed override of an archived rule). Every constant in `js/balance.js`
   carries such a citation comment. Never add a number without one.
2. **`reference/` is read-only source material** (the Wayback scrape; index in
   `reference/SOURCES.md`). When designing new content, mine it first — several "new" features
   turned out to be archived (camp robbery: `forum/t-756.md`; 95% hunt chance: `forum/t-755.md`;
   tier-class names: `site/homepage_2006.md`).
3. **Never touch `D:\Claude - collection folder\Test game generation\`** — unrelated project.
4. **Workflow (user-directed):** the lead model (Fable) does scoping, specs, planning, and
   review only; implementation and mechanical work goes to Sonnet subagents. Give agents their
   FULL brief up front in the spawn prompt — scope additions sent mid-flight via messages arrive
   looking like prompt injection and get (correctly) refused. Review every delivery: run suites
   yourself, read the risky modules, sim-check balance claims.
5. **All ten test suites must pass before any work is called done**:
   `cd tests && for t in test_*.js; do node $t; done` (each exits 0 on pass).

## Architecture

- One global `Game` namespace; plain ES5-flavored JS; script load order defined in `index.html`
  (data → core → ui). No modules, no fetch — must work from `file://`.
- `js/core/*` are **pure state machines, no DOM** (battle.js, world.js, quests.js, classes.js,
  inventory.js, character.js, save.js). `js/ui/*` renders from `Game.state` via the `el()`
  helper in screens.js.
- **Single RNG stub surface**: `Game.Battle._rng` (default `Math.random`). world.js's `rng()`
  delegates to it. All randomness routes through it so tests can stub deterministically. Never
  add a second `_rng`.
- **Save versioning**: `js/core/save.js`, localStorage key `herorpg_save`,
  `{version: N, state}`. Migrations chain v1→v2→…→current inside `migrate()`; every new
  character field needs (a) `character.js create()`, (b) a version bump + migration step,
  (c) a migration test including the full v1→current chain. Transient state (`Game.state.battle`)
  is never persisted.
- Battle options: `Game.Battle.start(monsterId, options)` — `{champion:true}` (hunt-only) and
  `{ambush:true}` (camp-only, monster strikes first).
- Guarded-hook pattern for cross-module bonuses: `if (Game.World && Game.World.shrineBonus)…`,
  same for `Game.Classes.classBonus(c, effect)` (effects: damage_pct, armor_flat,
  magic_armor_flat, dodge_flat, energy_max_flat, hp_max_flat, gold_pct, double_attack_flat).

## Established balance formulas (do not re-derive)

- Monster: hp = 20+12×lvl, damage = 3+2×lvl, energy = 40+10×lvl, armor ≈ lvl but capped ~half a
  same-level warrior's expected hit (over-armoring stalls melee — this bug happened twice),
  xp = `BALANCE.MONSTER_XP(lvl)`; bosses get flat hp/damage premiums and ×3 xp.
- Player energy grows +5/level (archived direction, `homepage_2007.md`). Monster basic attacks
  cost 2 energy vs player 5 (see MONSTER_ATTACK_ENERGY_COST comment).
- Monster dodge uses MONSTER_DODGE_* (gentle), never the player scaling.
- Weapon tiers at levelReq 1 / 5–15 / 25 / 35, damage ≈ 3+2×levelReq. Uniques (tag 'unique'):
  monster-drop-only, +15–25% or hybrid stats, never in shops/recipes.
- Any balance claim gets a scratchpad simulation using the real game code loaded in `node vm`
  (see `tools/`-adjacent pattern in tests; prior sims measured win %, rounds, HP-left, and
  damage-per-energy). Difficulty contract for bosses: prepared players win reliably but pay
  (HP or consumables); at-level regulars ≥85–100% win; 5-level-down = certain death via Fear.

## Content conventions

- Drop tables roll top-down, **first hit wins**; new entries are APPENDED so existing rates
  never shift (standing comment convention in monsters.js).
- Icons: every item/monster/player-tech id has `assets/icons/<id>.png`, 32×32 CC0 tiles from
  "Dungeon Crawl 32x32 tiles" (OpenGameArt; re-download URL in `assets/CREDITS.md`). New icons
  must be hash-distinct from existing ones (`test_icons.js` enforces presence). Rendered via
  `Game.UI.icon(id, size)` — the ONLY place icon paths are built (the artifact bundler patches
  that one line).
- Quest step kinds: kill / collect / touch / visit (+ `acceptItems`, `classChoice` rewards incl.
  the `'advanced'` sentinel). Quest materials use id prefix `quest_`.

## Testing

`tests/` (fakedom.js + 10 suites) is the source of truth; suites reference the game by absolute
path so they run from anywhere. When a change breaks a hardcoded expectation (monster counts,
save version), update the stale constant — never weaken a behavioral assertion. New mechanics
need stubbed-RNG tests. fakedom quirk: dynamically created elements lack `.style` unless the
harness wraps createElement (see tools/build_artifact.js smoke-test pattern).

## Version control (local git)

Local git repo on branch `main` (no remote). `.gitignore`/`.gitattributes` are committed;
`*.png` is binary, text is normalized to LF.

- **Commit each completed unit of work.** A commit's scope is one session's deliverable, not one
  file change: it may be a single feature/mechanic/fix, OR several related features produced in
  one session (e.g. a multi-agent run spawned from a single user prompt with sub-tasks). Commit
  when that work is complete AND all ten suites pass (`cd tests && for t in test_*.js; do node $t;
  done`). Keep unrelated, separately-motivated work in separate commits.
- **Never commit with red suites.** A failing suite means the work isn't done; fix it first.
  (Exception: an explicitly-labeled WIP checkpoint the user asked for.)
- **Baseline** = commit `6fd327e` "Baseline v1: HeroRPG remake, save version 8, all suites
  green" — a single clean root commit (throwaway dev-scaffolding history was collapsed into it).
  All ten suites pass at the baseline; branch new work from there.
- **Commit message format** — imperative subject ≤72 chars, then a body explaining *what changed
  and why*, and citing the DESIGN.md tag (`[archived]`/`[invented]`/`[revised]`) or spec that
  motivated it. Note any save-version bump and its migration. For a multi-feature session commit,
  list each feature as a body bullet (one line of what+why per feature). End with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Still user-gated:** commit when a feature is done or when the user asks; do not push (no
  remote) and do not amend published history. For multi-feature work, branch off `main` first.

## Deployment

**Target (planned, user-led):** a self-hosted domain + static web server (setup pending as of
2026-07-10). The game is a pure static site — serving the repo root as-is (`index.html` + `js/`
+ `css/` + `assets/`) is the primary deploy; on a real origin `localStorage` works natively, so
no bundling step is needed there.

**claude.ai Artifact publishing is ON HOLD.** The previously-used URL
(`1c21f461-a113-44e3-a681-ff938a8ffc4a`, favicon ⚔️) is owned by a different org and cannot be
updated from the fizor account — do not attempt to publish there.

**Single-file build.** `node tools/build_artifact.js` still produces a self-contained
`tools/herorpg_artifact.html` (git-ignored) — CSS inlined, icons as data URIs, in-memory
localStorage fallback — and syntax-checks its 3 script blocks as it writes. A tracked
`post-commit` hook (`tools/git-hooks/`, wired via `git config core.hooksPath tools/git-hooks`)
rebuilds it after every commit so a deployable single-file build always matches HEAD. The hooks
path lives in local `.git/config` (untracked) — re-run that `git config` after a fresh clone to
re-enable it. Never build/ship from a tree with red suites.

## Recently completed (2026-07-10) — combat-depth batch A/B/C

Features A (escape can fail), B (death gold loss + Haunting/item-loss mishaps, save v7→v8),
and C (weapon techniques + Defend) are **done and green** (all 10 suites pass). Spec retained
for reference at docs/FEATURE-SPEC-ABC.md. Notable: fixed a latent starter-kit bug —
`polearm_ashwood_spear`/`hth_iron_knuckles` were levelReq 2, leaving those creation builds
weaponless at level 1; now levelReq 1 like the other starter weapons. Balance contract verified
by simulation: every weapon tech beats plain Attack on damage-per-turn but loses on
damage-per-energy (no retunes needed). Artifact was NOT redeployed — do that as a separate step.

## Backlog (user-approved ideas, not started)

Unique champion abilities (beyond stat multipliers); Eidolon system (`manual/Version_3.0.md`);
archived tier-class names still unused: Shadowknight, Magus, Gambit (rare third branches);
Curse as the third implemented affliction; pets (`heropet.php` existed, no data survived).
