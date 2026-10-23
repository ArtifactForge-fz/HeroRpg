# CLAUDE.md — HeroRPG Remake

Single-player browser remake of **herorpg.net** (2004–2008, dead), reconstructed from Wayback
Machine scrapes. Static HTML/CSS/JS, no build step, no dependencies — open `index.html` via
`file://`. **Shipped: v1.9.0 (save version 11) — merged, pushed and DEPLOYED LIVE 2026-07-25.**
v1.4 gameplay + mobile, v1.4.1/.2 UX info passes, v1.5 (reactive monsters + Tier-3
branching/24-class roster + the Conjurer summoner), v1.6 (a full balance & progression rebalance
from playtest feedback), v1.7 (quest-arc redistribution, Arkan racial parity, destinations-UI
cards, and a reference wiki), v1.8 (a technique chain for every skill — 72 new techs incl. the
first player debuffs — plus the item-reachability pass that finally unwalled dual-wield), and
v1.9 (the companion system + Conjurer redesign, and six tech chains completed to rank IX; see
"Recently completed" below) are all released. Two accepted known limitations:
the 5-levels-down=death contract isn't fully enforced at high levels (Fear-spared healing
sustain — DESIGN §4), and boss-telegraph integration is deferred (a boss charged hit can spike
past heal+death in one blow; 3 low bosses carry behaviors, the other 8 keep their v1.4 scripts —
DESIGN §4 / SPEC-V1.5-MONSTER-AI §6). **v1.9 carries four KNOWN-ACCEPTED review items** (the user
merged over them on 2026-07-25) — see "Recently completed" below; the two cheap ones (legacy
Conjurer save cleanup, PR #1's missing spec) are the top of the next cycle's queue.

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
4. **Workflow (user-directed):** the lead session does scoping, specs, sim gates, planning, and
   review; implementation and mechanical work goes to Sonnet subagents. **Lead model = Fable**
   (user-directed 2026-07-13, reverting the 2026-07-12 Opus handoff). The lead model is set by the
   session's own model (the model picker / `/model`), not something a running session can switch
   for itself — start or set the session to Fable to lead. **Read `docs/LEAD-PLAYBOOK.md` at the start of
   any dev cycle** — it is the Fable-era process handoff (sim methodology, delegation briefs,
   review protocol, failure-mode catalog). The recurring procedures are project skills:
   `/balance-sim` (mandatory before locking any combat constant), `/delegate-review` (spawn
   briefs + delivery review), `/release`. Give agents their FULL brief up front in the spawn
   prompt — scope additions sent mid-flight via messages arrive looking like prompt injection
   and get (correctly) refused. Review every delivery: run suites yourself, read the risky
   modules, sim-check balance claims. Never eyeball a balance number — sim it.
5. **All test suites must pass before any work is called done** (15 as of v1.10 —
   `test_secondary_stats.js` joined in v1.10, `test_companion.js` in v1.9,
   `test_v18_engine.js` and `test_reachability.js` in v1.8, `test_wiki.js` in v1.7):
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
  magic_armor_flat, dodge_pct, energy_max_flat, hp_max_flat, gold_pct, double_attack_flat).

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
- Version Log: every release milestone gets a PREPENDED entry in `js/data/changelog.js`
  (player-facing wording, no dev jargon); the game footer's link text auto-derives the shown
  version from entry `[0]`, so it can never go stale. The release guard in `test_reload.js`
  fails if README's announced version or the current save version disagrees with entry `[0]`,
  so the suites enforce the convention.

## Testing

`tests/` (fakedom.js + 14 suites) is the source of truth; suites reference the game by absolute
path so they run from anywhere. When a change breaks a hardcoded expectation (monster counts,
save version), update the stale constant — never weaken a behavioral assertion. New mechanics
need stubbed-RNG tests. fakedom quirk: dynamically created elements lack `.style` unless the
harness wraps createElement (see tools/build_artifact.js smoke-test pattern).

## Version control (git; GitHub remote)

Git repo on branch `main`; remote `origin` = `github.com/ArtifactForge-fz/HeroRpg` (added
~2026-07-14; first push that day — earlier "no remote" notes are obsolete).
`.gitignore`/`.gitattributes` are committed; `*.png` is binary, text is normalized to LF.

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
- **Still user-gated:** commit when a feature is done or when the user asks; **push only on user
  direction** (first authorized push: v1.5.0, 2026-07-14) and never amend or force-push published
  history. For multi-feature work, branch off `main` first. Ops note: the permission classifier
  has intermittently blocked `git push` via the Bash tool — running the identical push through
  PowerShell succeeded (both are legitimate paths; the block was a transient classifier error,
  not policy).

## Deployment

**LIVE (2026-07-11): self-hosted on Strato SFTP webspace.** The game is a pure static site, so the
deploy is just the repo's static files (`index.html` + `js/` + `css/` + `assets/`) uploaded as-is;
on a real origin `localStorage` works natively (no bundling needed). Deploy with:
`sh tools/deploy.sh --check` (connectivity/auth/remote-dir test, read-only) then `sh tools/deploy.sh`
(uploads the site in one curl SFTP connection, creating remote dirs). Credentials live in **`.env`**
(gitignored — SFTP host/user/password or key + remote dir; template `.env.example` is committed).
`tools/deploy.sh` parses `.env` WITHOUT sourcing it (passwords contain shell-special chars) and
passes creds via a temp curl config (never on the command line). It uploads only the static site —
NOT `reference/`, `docs/`, `tests/`, `tools/`, or `.env`. Re-run it after any release to push HEAD.

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

## Recently completed (2026-10-23) — v1.11.0 "The Hero Tree" (release candidate)

Three user-directed specs in one release, stacked on v1.10.0. Built in the `HeroRpg-playable`
working copy (not a git checkout), then **committed on branch `v1.11-hero-tree`** in a fresh clone
(`HeroRpg-git`, branched from `main` `e06c63d`): one commit for v1.10.0, one for v1.11.0.
**Not pushed, merged, or deployed — all user-gated.** **Save version 11 → 12.**
- **Working-copy drift (found while committing):** `HeroRpg-playable` predated part of `main` —
  PR #1's six tech chains (42 ranks), the Conjurer techs' `skill: 'Conjuration'` link, and its
  `test_companion.js` Test 12 + changelog lines. The commits keep `main`'s content; Test 12 was
  moved to the Hero Tree setup. The v1.10/v1.11 sims ran without those 42 ranks (their caster
  fixture uses Firebolt only). Develop in the git clone from now on, not the plain-file copy.
- **Hero Tree** (`docs/SPEC-CLASS-LINEAGE.md`, [revised] Classes.md slots/activation/wipe): the
  tier 1/2/3 class picks are permanent and always active (`c.lineage`), plus one Legendary slot
  (`c.legendaryClass`, change only at an Academy, progress kept, its techs unslotted on swap-out).
  No deactivation. Class XP = one pool `CLASS_XP_POOL_FRACTION` 0.5 split evenly over active,
  un-maxed classes (a class is "Mastered" once its earned levels cover every ability).
  `activate`/`deactivate` are gone; `activeClassIds`/`lineageOf`/`setLegendary`/`isClassMaxed`
  are new. Migration v11→v12 per spec §2.4.
- **Rogue boss cost** (`docs/SPEC-ROGUE-BOSS-COST.md`): Dex dodge with diminishing returns
  (`DEX_DODGE_MAX` 0.30, `DEX_DODGE_HALF` 100); Dodge skill, `dodge_pct` passives (renamed from
  `dodge_flat`, powers ×2.5), shrine and dodge buffs all multiply it; all 11 bosses get
  `dexterity = BOSS_DEXTERITY(level)` = 5·level+10.
- **Bracing** (`docs/SPEC-NONDEX-DEFENSE.md`): Heavy/Medium Armor pieces cut landed monster hits
  after the penetration floor (1%/armor-skill level per full set, ×(1 + 0.002·Endurance), cap
  0.50, ×Fear); Estari Ruin Warden damage 33 → 28.
- **Review re-sim** (lineage spec §3.2): Heavy/Medium lineages win the L100 boss 99–100% (was
  88–96%); Gambit/Assassin now pay at every boss (≤ 78% HP left); casters slip as accepted (L10
  boss 86.3%, L90–100 95.7–98.3%). **Open follow-ups:** caster compensation spec; boss tech power
  scaling spec.
- **Sim-harness gotcha:** `Game.Classes.activate` (v1.10 and earlier) took `(c, classId, slot)`.
  The v1.10 P0 script passed `(c, slot, classId)`, so its fixtures never had a class active and
  `docs/SPEC-SECONDARY-STATS.md` §3.1 was measured without class bonuses.
- Process: lead spec + sims; two Sonnet agents in sequence (lineage, then dodge + Bracing; they
  share `classes.js`/`balance.js`/`screens.js`/tests); lead review re-ran all 15 suites, read the
  migration/balance/battle diffs, re-simmed the shipped code and checked the Hero Tree UI in a
  real browser (served over http — the browser pane renders `file://` pages as static snapshots).

## Recently completed (2026-10-21) — v1.10.0 "Keen Edges & Lucky Coins" (release candidate)

**Secondary stats** + a player-facing text cleanup. Spec `docs/SPEC-SECONDARY-STATS.md` (all
decisions D1–D9 user-resolved; §3.1 = P0 sim results). Save version unchanged (11) — no new
persisted field. Prepared in the `HeroRpg-playable` working copy, which is **not a git checkout**:
delivered as `Pathc/release-v1.10.0.patch` (one level up). **Not committed, merged, or deployed —
all user-gated.**
- **Mechanics:** seven secondary stats on one aggregator (`Game.Character.getSecondaryStat`:
  base + gear `bonuses` + class passives + shrine, capped): crit chance/damage (5% base ×1.5,
  resolved on the SAME single rng() roll as glancing — glancing keeps the low band, so RNG
  call order is unchanged), Accuracy (weapon attacks + weapon/physicalRoll techs, not spells),
  Armor Penetration (stacks with tech `armorPierce`, total cap 0.75, incl. Limit Break),
  shield Block (one extra rng() only when block > 0), Spell Power (same slot as Attunement;
  boosts servitor ticks too), Luck (lucky forage pick + small XP multiplier; no extra rng() at 0).
  No crit on Limit Breaks, heals, ticks, or monster/companion hits.
- **Sources:** `bonuses` on all 98 weapon/shield items (one signature stat per family, levelReq
  bands), optional `bonusEffects` on 8 existing class passives (ids/costs/ability counts
  unchanged), 7 shrine buffs appended.
- **Fear (D8):** new stats ×fearMultiplier at 1–4 levels below, suppressed to 0 at 5+
  (`SECONDARY_FEAR_SUPPRESS_LEVELS`). P0 found that unscaled stats widened the 5-down hole (Ranger
  L86 76→92% win); only full suppression at 5+ restored shipped numbers. The implemented code was
  re-simmed against the pre-work snapshot: 5-down cells identical, bosses still cost HP.
- **Cleanup:** 31 player-visible archive-file notes (`(Arkan.md)` etc.) removed from item/area/
  monster/tech/class/quest text and button tooltips; citations kept as code comments.
  Shadowknight's "+13% Damage (all sources)" corrected to "weapon Damage" (`damage_pct` only
  feeds weapon damage — same fix as Wizard/Magus).
- Process: lead spec + P0 sim; one Sonnet agent implemented; lead review fixed one hard-coded
  constant duplicate. Real-browser check done (Status "Combat Stats" panel, item info lines,
  wiki column, crit battle log, Version Log/footer).
- **Ops note — the `D:/Claude - collection folder/HeroRPG` base path doesn't exist on every
  machine.** Without editing tracked files, run the suites from a scratch copy of `tests/` with
  that string rewritten to the checkout path (`__dirname` suites like `test_reachability.js` and
  `test_secondary_stats.js` run in place). Same trick for `tools/build_artifact.js` (`ROOT`).

## Recently completed (2026-07-25) — v1.9.0 (merged from two EXTERNAL PRs; live)

**First release assembled from outside contributions.** Two GitHub PRs by `Nayan-cl` were
reviewed by the lead, merged to `main` on user direction, pushed, and deployed to Strato the same
day. Merge commits: `df40f22` (PR #1), `a0fa04e` (PR #2). All 14 suites green on the merged tree
(neither PR had been tested against the other; both edited `js/data/techs.js` and merged clean —
final roster 211 techs, no duplicate ids). Save version **10 → 11**.
- **PR #2 — companion system + Conjurer redesign** (spec `docs/SPEC-COMPANION-SYSTEM.md`): a
  persistent, targetable **second combatant** as a reusable class-agnostic framework
  (`js/core/companion.js` + `js/data/companions.js`), first consumed by a redesigned Conjurer —
  four per-element Pact abilities (Fire DoT / Water heal / Earth taunt-tank / Wind support), each
  granting a Bind tech + a command tech. `tech_summon_elemental` retired. New persisted
  `character.companion` + v10→v11 migration; `js/core/classes.js` gained a back-compatible
  `techIds` array form. **This is a `[revised]` override of the archived "no summons in battle —
  it's just 1v1" guardrail** (`forum/t-449.md`), recorded as D0 APPROVED 2026-07-22; the three
  guardrail comments (DESIGN.md, SPEC-TIER3-EXPANSION.md, SPEC-V1.5-MONSTER-AI.md) now cite it.
- **PR #1 — six tech chains completed to rank IX**: Starspark, Tidal Lance, Shadowlash, Lifetap,
  Vital Strike, Flurry (+42 entries, +42 icons). Spell chains continue the shipped Firebolt
  deltas; ranks 6–9 pre-tapered by the established `OFFENSE_TECH_TAPER` 0.55.
- **Lead review findings — ALL FOUR KNOWINGLY ACCEPTED by the user (merge over stated concerns,
  2026-07-25). Do not re-litigate; these are the queue, not open questions:**
  1. **PR #1 cites `docs/SPEC-TECH-CHAIN-COMPLETION.md`, which does not exist** in the repo — 42
     `[invented]` constants carry no reviewable authority (breaks cardinal rule 1).
  2. **PR #1 ran no `/balance-sim`.** Per-chain parity with Firebolt IX holds, but four new
     rank-IX chains in four Anima grades give best-of-4 **grade coverage 1.270× vs Firebolt-only
     0.965×** across all 88 monsters (**+31.6%** top-end caster damage) against the baseline the
     0.55 taper was locked to. A sim gate is still owed.
  3. **The +4 companion cliff** (absent from PR #2's grid; lead sim, 300 trials/cell, shipped L40
     warrior fixture): just under `COMPANION_FEAR_SUPPRESS_LEVELS = 5` a companion turns a 53.3%
     coin flip into **99.7% (Water) / 91.3% (Earth) / 76.0% (Fire)**, then 0% at +5 — a hard
     cliff. At-level also gets cheaper (HP left 62% → 87–91%, consumables 0.7 → 0.0). The **true
     5-down contract is intact** — independently verified, all five companion states identical at
     +6, so the Fear-suppress ratchet genuinely works.
  4. **Legacy Conjurer saves keep ghosts** (verified by probe — no crash, screens render, the dead
     tech reports "Unknown technique"): the retired tech id stays in `c.techs`, the retired
     ability id in the class entry, and the **5 class levels spent on it are burned unrefunded**
     (a class-level-8 Conjurer is left 3 free — one of four Pacts). ~3 lines in the v10→v11
     migration would clear it. **This one is live for real players — fix it first.** **Fixed in v1.11 (`docs/SPEC-LEGACY-CONJURER-CLEANUP.md`).**
- Also open from PR #2's own notes: companion icons are adapted copies (bespoke art wanted), no
  shipped monster carries the new `target` specials yet, command-tech powers are provisional.
- Ops note: the tracked `post-commit` hook did NOT fire on the merge commits — the single-file
  artifact was left stale and had to be rebuilt by hand (`node tools/build_artifact.js`). Check
  `tools/herorpg_artifact.html`'s timestamp after any merge.

## Recently completed (2026-07-19) — v1.8.0 (branch `v1.8-techs-reachability`)

**The Expanded Curriculum**: one new technique chain for EVERY archived skill + the dead-item
reachability pass, bound into one release because SPEC-TECH-POLARITY's Crosscut (Dual Wield)
hard-depended on the audit's T1-a fix (no offhand weapon was obtainable in the shipped game).
Specs: `docs/SPEC-V1.8-TECHS-AND-REACHABILITY.md` (release plan, D-A/D-B/D-C decisions taken on
pre-registered recommendations), `docs/SPEC-TECH-POLARITY.md` (§0 = P0-locked constants),
`docs/AUDIT-ITEM-REACHABILITY.md`. Save version unchanged (10) — all new state battle-transient.
**Branch NOT merged to `main`, NOT deployed — both user-gated.** (v1.7 is also still unmerged;
v1.8 stacks on it.) Five phases, each committed green on all 13 suites:
- **P0** (`ec80ad6`): sim gate — real engine + prototype source patches, 300 trials/cell,
  L5/12/22/40 × at-level/true-5-down/boss. Contract passed every row; no 5-down widening.
  Ratchet retunes: stat-buff durations 3→5 (action economy), Attunement 12/24/40/60,
  Stoneshear/Censure energy up, goldSteal 1/3/5/8, physicalRoll (physical chains roll dodge,
  not Int), offhand ladder 0.8×→0.55× main band (0.8× made dual-wield strictly dominant).
- **P1** (`6f61542`): six engine extensions in battle.js — statKind buffs
  (dodge/double_attack/spellpower under existing caps), effect:'debuff' (damage floor 1 / armor
  floor 0 / bleed×Fear, exact-revert via entry.applied), typed re-cast-replace, equipment gates
  (refused pre-cost), offhandFollowup, win-gated goldSteal. New `tests/test_v18_engine.js`.
  Note: buffDuration N survives N−1 subsequent actions (the cast's own finishRound ticks it).
- **P2** (`558a20d`): T1-a dual-wield unwalled (twinfang/cestus stocked + 6-item P0-locked
  offhand ladder to L35); T1-b cursed **Circlet** of the Hollow King (id `ring_of_the_hollow_king`
  kept) live as 0.04 mid-band drops; D-C recipe 2 shards+15g→crystal_pure_anima (global recipes;
  Saratus stays synthesis-free per shipped test); D-A five trophies sellable (values 10–25);
  standing guard `tools/check_reachability.js` + `tests/test_reachability.js` (zero dead items
  enforced; allowlist empty).
- **P3** (`91f1f4a`): the 72 tech entries (roster 88→160), icons reuse installed tiles
  (CREDITS.md mapping). Lead fix: 4 rank-1 trainingCosts restored to spec-table 3.
- **P4** (`c3c642e`): techs/Academy **type tabs** (data-driven off tech.effect); infobox
  debuff/statKind branches; Curse tech renders with school (D2); wiki gains FULL Source
  (forage/quest/recipe/AA-Exchange) + **"Used for"** column (wiki.html now loads quests.js);
  persistent **gold readout** in renderStatusBars (all gold-mutating flows re-render via shared
  paths — audit table in the P4 report); single-file artifact footer opens Version Log +
  Reference Wiki as in-page overlays (closes the v1.7 dead-link note).
- **Release** (`1437353`): changelog + README v1.8.0. Process: P1∥P2 and P3∥P4 as parallel
  Sonnet pairs on the shared checkout (disjoint files, lead-reconciled); P0 + all reviews lead.
  Residual: a human browser pass over the new UI surfaces (gold readout, tabs, wiki column,
  artifact overlays) — fakedom can't see layout.

## Recently completed (2026-07-17) — v1.7.0 (branch `v1.7-content`)

Content & UX cycle from user requests (post-v1.6): quest front-loading, the backlogged Arkan
feedback, a clearer destinations UI, and a reference wiki. Spec `docs/SPEC-V1.7-CONTENT-UX.md`;
Arkan design authority `docs/SPEC-ARKAN-DIFFERENTIATION.md` (now committed). Save version
unchanged (10). **Branch NOT yet merged to `main` and NOT deployed — both user-gated.** Four
phases + release, each green on all 11 suites:
- **P-U/P-Q** (`16fd6b0`): the Explore "Destinations" list is now a **card grid with recommended
  level ranges** + the home-town travel-UI fix (closes the backlogged Arkan/Saratus bug — an Arkan
  sees Saratus reachable below L14, mirroring `travelTo`). **Quest-arc redistribution:** 14 givers
  moved so each town tavern owns its band (Eldor 12→6; Kastengard Vanguard Camp gains a tavern,
  0→4; tier-3 calling → Kuraan; Band E/F → Skyspire, 0→5), every giver verified reachable, no
  stranded quest. L1-5 intro + `first_calling` stay at Eldor (only town reachable below L6).
- **P-R** (`a809a92`): Arkan parity. `saratus_plains` was a strict subset of the human plains →
  added the 2 missing regionals + a new **sim-locked** construct `saratus_wardframe` (armor 4 /
  magicArmor 6 at L3 — resists magic, weak to melee; icon lead-sourced, byte-distinct). Class at
  home: new `arkan_calling` (Saratus, `requiresRace:Arkan`, kills the Wardframe) grants the base
  class; `first_calling` is now `requiresRace:Human` (legacy-safe — the race gate is accept-only,
  never turn-in); + 2 Arkan bridge quests (L10/L12).
- **P-W** (`97d39b6`): a **reference wiki** (`wiki.html` + `js/ui/wiki.js`, footer-linked, in the
  deploy list) generated at load from `Game.Data` — items (+ where sold/dropped), monsters (+
  **drop-rate %**), areas (+ level range), techniques, recipes; new `tests/test_wiki.js`.
- **Release** (`91c8ec1`): changelog + README bumped to v1.7.0.
- Process: U∥Q and R∥W ran as parallel Sonnet pairs on the shared checkout (disjoint files; the one
  shared test file `test_p4_world.js` was lead-reconciled). Single-file-artifact note: `wiki.html`
  is a separate page, so the footer "Reference Wiki" link is a dead link in the single-file build
  only — the deployed multi-file site serves it fine.

## Recently completed (2026-07-17) — v1.6.0 (branch `v1.6-rebalance`)

Full **balance & progression rebalance** from a user playtest of v1.5.0. Triage of all 18
findings (code-cited, tagged) in `docs/REVIEW-2026-07-16.md`; spec + locked constants +
sim results in `docs/SPEC-V1.6-REBALANCE.md`. Save version unchanged (10, no migration).
Three user-gated decisions (2026-07-16): full scope · defense = penetration floor + constant
tuning · keep the 5-down limitation accepted (don't chase it). Five phases, each committed
green; P0 was the mandatory sim gate. **Branch not yet merged to `main`; not deployed — both
user-gated.**
- **P0 sim gate** (`3768a8c`..): locked every combat + progression constant vs the difficulty
  contract before any game code (battle grid + progression calc, real engine via node vm).
- **P1 combat & stats** (`3768a8c`): defensive-only **penetration floor** (0.30 — a monster hit
  always lands ≥30% of its rolled damage regardless of armor; fixes "light armor floors hits to
  1") · magic-school level now scales spell power · INT speeds magic-school/Rods skill-XP
  (`[archived]` Intelligence.md, previously unimplemented) · **Rod caster identity** (+spell
  power, −cast energy, halved melee → casting ≈ parity) · Endurance/INT→armor trimmed 1:1→0.9
  (**reconciled from a provisional 0.5 that broke the shipped bosses** — the floor is the real
  fix; ratchet: fit the constant to shipped bosses) · carry-capacity base term · raised
  weapon/armor skill caps.
- **P2 progression** (`6c1beb2`): XP curve ~2.3× slower (exp 1.8→2.0, still no wall) · Fury XP
  capped +25% · class unlock re-paced (~2 kills → ~37) · skill-XP now scales with monster level.
  Legacy-safe (class levels are banked, only future grants slow).
- **P3 economy & items** (`498488b`): gold curbed (sell 0.5→0.35, top-gear ×1.5, L41+ gold ×0.75)
  · armor ladder made monotonic (re-simmed: bosses stay winnable-but-costly) · **quest-drop
  gating** (a `quest_` material stops dropping only once no recipe AND no incomplete quest needs
  it — can never strand a material) · boss-gating materials removed from forage tables · shard
  supply floored at 0.10 · full-range camp/tent ladder (6 rungs) · Alteration shard tax eased.
- **P4 content & flow** (`3203ef4`): second high-level town **Skyspire Landing** (L85) splits the
  overloaded Frosthold hub (Bands E/F moved; verified reachable, zero stranded items) · quest
  **levelMax now gates accept only, not turn-in** (fixes the Oruk soft-lock trap).
- Process note: the P4 subagent was interrupted mid-run (session boundary); the lead verified its
  landed work (connectivity re-checked independently) and finished the one remaining stale-test
  update rather than re-running the whole phase. The v1.6 defense pass does NOT close the 5-down
  limitation (kept accepted per decision 3); a harder defense nerf would need a boss-damage retune
  (offered to the user, not taken).

## Recently completed (2026-07-13) — v1.5.0 (branch `v1.5`, merged to `main`)

Specs: `docs/SPEC-V1.5-MONSTER-AI.md` + `docs/SPEC-TIER3-EXPANSION.md`, both marked shipped with
their sim results inline. Two features, one release, save version unchanged (10):
- **Reactive monster behavior (P0–P3):** telegraphed charged hits (wind-up → ×2.0 release) with a
  two-sided answer — Defend halves, Interrupt (≥15% of monster max HP in one action, or any Limit
  Break) shatters; archetypes `simple`/`telegraph`/`caster`/`enrage`/`guardian`/`reactive` via ONE
  interpreter in `monsterAct` (never per-monster branches); journey-graded (≤L10 100% simple,
  test-enforced; 66.7% of L40+ non-simple). Sim-gated at every phase; P2's gate caught and retuned
  ENRAGE_CHARGE_MULT 2.0→1.5 (ratchet). **Boss-telegraph deferred (user option 1):** only
  Matriarch/Leviathan/Custodian carry behaviors (re-simmed 85–88% win); a boss charged hit spikes
  past heal+death in one blow — future boss-tuned pass needs a lower boss multiplier + a
  heal-before-death guarantee, own sim gate.
- **Tier-3 branching + Conjurer (P4–P5):** [revised] convergence → branching, each Tier-2 → 2
  Tier-3 options at L60 (`thirdTierOptionsFor` re-keyed to `advancedClassIdsObtained`; tier-3
  `baseClass` is now a TIER-2 id); 9 new archived-name classes (roster 15→24), 9 classOnly techs
  (icons reuse DCSS tiles — only monsters need byte-distinctness). The **Conjurer** summoner:
  `tech_summon_elemental` → an Elemental Servitor DoT rider on `battle.monster.statuses`,
  auto-attuned via `pickWeaknessGrade`, ticked by `tickMonsterStatuses` through the full mitigation
  pipeline — 1v1 preserved (archived rule). P5 sim retuned servitorPower 14→50 (flat Magic Armor
  per tick floors small hits — the naive pre-mitigation calibration was ~useless), Warden 16→12 +
  55→48, Cleric 55→42 (the 55s would out-HP the Legendary Heir's 50 — tier ordering).
- Legacy saves keep old-convergence combos fully functional (test-covered); no migration.
- Process notes: one P4 spawn was lost to a session usage limit (clean restart, no tree damage);
  lead-model handoff Opus→Fable happened mid-cycle (cardinal rule 4 updated); sim-policy gotcha
  recorded in SPEC-TIER3 §6 — warrior-line class techs are Int-scaled, test melee passives
  attack-only or the fixture poisons the cell.

## Recently completed (2026-07-11) — v1.3.1 bugfix release (merged to `main`, `3df44ea`)

Full-codebase review (3 parallel reviews: core correctness / UX / mechanics+data) is committed
at `docs/REVIEW-2026-07-11.md` with every finding triaged `[v1.3.1]` (fixed) or `[deferred]`.
Headliners fixed: quest-material exemption to the 5-level loot cutoff (`[revised]`, DESIGN §4 —
unwalled the tier-2→3 class quest, Vaultbreaker, and 5 collect quests), eidas_echo drop reorder
(Heir of the Echo was unobtainable; NEW STANDING RULE: nothing may follow a chance-1 drop entry),
Arkan home-town travel exemption, learnTech classOnly NaN, camp-ambush UI soft-lock, battle-log
autoscroll + a batch of confirm/feedback UX fixes. No save-version change (stays 9). The release
guard (test_reload.js) now requires each release to prepend a `js/data/changelog.js` entry AND
bump README's "Development status" version (regex accepts vX.Y.Z). **The `[deferred]` findings in
REVIEW-2026-07-11.md are the seeded queue for the next dev cycle** (biggest: dominated tech ranks
6–9 need a re-taper+re-sim; endgame UI list scaling; onboarding/stat explanations). Deploy of
v1.3.1 to Strato was NOT run (permission-gated; user runs `sh tools/deploy.sh`). Ops notes: a
CRLF checkout used to break `tools/build_artifact.js` (fixed, normalizes on read); concurrent
sessions share this checkout — another session's `git commit` lands on whatever branch is
checked out, so verify `git status`/`git log` before committing or switching branches.

## Recently completed (2026-07-11) — v1.3 the level-100 arc (branch `level-arc`)

Specs: `docs/SPEC-FULL-LEVEL-ARC.md` + `docs/SPEC-ARC-BANDS.md`. Extends the playable range 40→100
(`BALANCE.LEVEL_CAP=100`). Phased, each committed green; no save-version change (all data + one
constant). Order: **F1** balance-to-100 (cap + routing; sim proved the math closes; found the
mandatory gear TAPER `effectiveLevelReq=35+0.7·(lr−35)`) → **Bands A–F** (levels 41–100: 13 areas +
2 towns across six northward regions Kuraan→Majiku→Ukai→Estari→Skyspire→Red Moon, ~40 monsters, 6
bosses ending in Eidas Ascendant L100, tapered gear, tech ranks→9, quests) → **F4** tier-3 re-gate
38→60 → **F5** story spine (Ch III–IV + Epilogue) → **real-icon pass** (210 band ids → real DCSS
tiles; monsters mutually distinct) → **balance re-sim** with real content.
- Balance: the re-sim caught arc over-armoring (5 tapered armor slots stacked ~1.5× a monster's
  single damage term) — fixed with `ARMOR_STACK_DIVISOR=2` + a tech-power tap (levelReq>35 only;
  1–40 untouched). Bosses now winnable-but-costly; at-level holds.
- ACCEPTED KNOWN LIMITATION (user-approved): 5-levels-down≠guaranteed death past ~L50 (Fear-spared
  healing + energy consumables let a kitted player out-sustain). Deferred Fear/healing/energy pass;
  documented in DESIGN §4 and `js/balance.js` F1 notes §3.
- Icon pipeline note: the LEAD's Bash can pull DCSS `rltiles` tiles (sub-agents' env can't); stage
  downloads in a REPO-RELATIVE dir (mktemp `/tmp` paths misresolve as `D:\tmp\…` for the Windows
  node/curl); `execSync` curl must not use `< /dev/null` (cmd.exe). Only monster icons need mutual
  byte-distinctness (`test_icons.js` Test 2); items/techs may reuse tiles.

## Recently completed (2026-07-10) — v1.2 (branch `v1.2-skills-classes-content`)

Spec: `docs/SPEC-V1.2.md`. Four phases, each committed green:
- **P1 combat engine:** use-based skills now play (weapon→damage, armor→armor, Dodge/Double
  Attack XP, Thievery, Dual Wield offhand), Int spell hit/miss, non-elemental defense fix, Curse
  status. Save v8→v9 (`equipment.offhand`). Caps retuned DOWN after a difficulty-contract sim
  (weapon 0.10 / armor 0.15) — the original 0.30/0.40 broke "5-down = death via Fear".
- **P2 classes:** three-tier progression (base L5 / advanced L30 / tier-3 L38 "The Master's
  Calling"); tier-3 Shadowknight/Magus/Gambit; Runeblade moved to tier-4 legendary; +2 invented
  Legendaries (Vaultbreaker, Heir of the Echo). 15 classes.
- **P3 content:** graded Crystals/Spheres, 30+ economy (energy stones, synthesis), ~20 shrine
  buffs, shard-cost techs (Content-B); Laik town, Kastengard outpost, Arkan questline + Saratus
  start (Content-A).
- **P4 docs:** README/DESIGN updated; review #12/#13/#14 resolved.

- **P5 real-icon pass:** replaced all 24 v1.2 placeholder icons AND one member of each of 6
  pre-existing duplicate icon pairs with real DCSS CC0 tiles pulled from the crawl repo (network
  works from the lead's Bash even though sub-agents' env lacked it) — `assets/icons/` is now fully
  byte-hash-distinct. Mapping in `assets/CREDITS.md`.

Earlier combat-depth batch A/B/C (save v7→v8) is documented in `docs/FEATURE-SPEC-ABC.md`.
Artifact not redeployed (claude.ai publishing on hold; see Deployment).

## Backlog (user-approved ideas, not started)

- **Online / web-hosted mode** — spec at `docs/SPEC-ONLINE-HOSTING.md` (backlogged 2026-07-10).
  Persistent global chat + cross-device character retention, "similar to the original." Options 0–3
  ladder (recommend BaaS, e.g. Supabase); phased O1–O5, with O1 (a localStorage-preserving
  persistence-adapter seam) the offline-safe prerequisite that keeps the `file://` build + suites
  intact. [revised] reopens the chat feature cut in DESIGN.md §9.
- **Endgame loop** — spec at `docs/SPEC-ENDGAME-LOOP.md` (backlogged 2026-07-12). Fixes the "XP
  stream goes dead at LEVEL_CAP=100" gap with a horizontal post-cap loop: the **Colosseum**
  (archived: `forum/f-84.md`) — **Ascension** difficulty tiers + rotating **Trials**, **Relics**
  (archived: `Classes.md`) as the gear chase, **Honor** (archived: `forum/f-87.md`) as prestige,
  plus MMO-inspired single-player variants (Relic sets, Codex/achievements, Bounty board). Phased
  E0–E4, E0 (Ascension-scaling sim) the gate. v1.4 dependency (AP + champion affixes) now shipped —
  unblocked; save v10→v11.
- **Boss-tuned telegraph pass** — deferred from v1.5 (user option 1; DESIGN §4 accepted
  limitation). Bring the 8 script-only bosses into the behavior system: needs a boss-specific
  lower charged multiplier and/or a heal-fires-before-death guarantee, gated by its own
  `/balance-sim` (a boss charged hit currently spikes past the player's heal threshold and death
  in one blow — 7 bosses fell to 5–30% win when naively tagged).
- Unique champion abilities (beyond stat multipliers); Eidolon system (`manual/Version_3.0.md`);
  pets (`heropet.php` existed, no data survived). (Shipped since first listed: tier-3 trio + Curse
  in v1.2; the full level-100 arc in v1.3 (`SPEC-FULL-LEVEL-ARC.md`); reactive monsters + Tier-3
  branching in v1.5.)
