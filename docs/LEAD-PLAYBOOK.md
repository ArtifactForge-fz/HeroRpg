# LEAD-PLAYBOOK.md — how to lead HeroRPG development

Written 2026-07-12 as the Fable→Opus handoff. Audience: the **lead session** (the strongest
model available — Opus as of this writing). `CLAUDE.md` holds the *facts* (rules, formulas,
conventions); this document holds the *process* — the working discipline that produced
v1.0→v1.4 at the quality bar the shipped releases set. Read this at the start of any dev
cycle. The recurring procedures are also packaged as project skills: `/balance-sim`,
`/delegate-review`, `/release` (in `.claude/skills/`).

## 0. What actually made this work (principles, in priority order)

1. **Quantify before deciding.** Every balance question was converted into a measurable
   simulation using the *real game code* — never settled by eyeballing numbers in prose.
   This also applies outside combat: drop reachability, quest-chain connectivity, and icon
   distinctness were all checked with 20-line node scripts, not by reading. When you catch
   yourself reasoning "that constant looks about right," stop and write the script.
2. **Adversarial stance toward every claim — including your own.** Subagents report green
   suites that aren't; your own implementation has bugs your own review can find. The
   v1.3.1 review found Heir of the Echo *unobtainable* only because a script checked
   reachability of every drop instead of trusting the data "looked complete."
3. **The ratchet principle: shipped balance is frozen.** When a sim violates the difficulty
   contract, adjust the NEW mechanic to fit the shipped game — never re-tune shipped
   constants to fit the new mechanic. Precedents: gear taper applies only levelReq>35;
   tech-power tap only levelReq>35 (levels 1–40 untouched); Frenzied affix capped at +40%;
   limit break cut ×2.5→×2.0. (Pre-ship retunes are fine — the v1.2 skill caps were cut
   0.30/0.40→0.10/0.15 before release.)
4. **Extract standing rules from bugs.** When a bug reveals a *class* of bugs, write the
   rule into CLAUDE.md/DESIGN.md so it can't recur silently. Examples: "nothing may follow
   a chance-1 drop entry" (from eidas_echo), "drop entries are APPEND-only" (rate-shift
   class), "over-armoring stalls melee" (happened twice before it became a formula cap).
   Continue this practice: every post-mortem produces a written rule.
5. **User-gate product feel, not mechanics.** Decisions about difficulty feel, feature
   cuts, and accepted limitations go to the user (precedent: the Fear-sustain limitation
   was explicitly user-accepted, not silently shipped). Mechanical decisions (which file,
   which pattern) don't need to be asked.

## 1. The development cycle (the shape every feature followed)

1. **Spec first.** Every feature cycle starts with `docs/SPEC-<NAME>.md`: goals, archived
   citations from `reference/` (mine it before inventing — camp robbery, hunt chance, and
   tier names all turned out to be archived), phases, proposed constants each carrying an
   `[archived]/[invented]/[revised]` tag, save-version plan, test plan. Get user approval
   on the spec before implementation starts.
2. **Phase 0 is a sim gate** whenever combat math is touched. Precedents: F1 (proved the
   40→100 math closes, found the gear taper), E0 (Ascension scaling), v1.4 P0 (locked
   affix/LB/AP constants — commit `3a1effd`). Constants get locked by simulation *before*
   any agent writes game code; sim results go into the spec and the commit message.
3. **Phases are independently committable**, each green on all ten suites before commit.
4. **Every delivery gets the review protocol** (§4) — no exceptions for "simple" phases.
5. **Release mechanics** are a checklist, not judgment — see `/release` and the
   `herorpg-ops-hazards` memory.

For bugfix releases, the v1.3.1 pattern worked well: spawn 3 parallel review agents with
*different lenses* (core correctness / UX / mechanics+data), merge findings into a committed
`docs/REVIEW-<date>.md`, triage every finding `[vX.Y.Z]` (fix now) or `[deferred]` (seeded
backlog), then fix in one pass. Deferred findings become the next cycle's queue.

## 2. Balance simulation methodology

Full recipe in `/balance-sim`. The essentials:

- **Harness:** node `vm`, loading `js/balance.js` + `js/data/*` + `js/core/*` in the
  index.html order (core is DOM-free by architecture; copy the load preamble from
  `tests/test_p3_battle.js`). Stub `Game.Battle._rng` with a seeded PRNG (mulberry32) —
  it is the single RNG surface, world.js delegates to it.
- **Drive loop:** copy `fightOnce()` from `tests/boss_fixture.js` — it drives
  `Game.Battle.start/attack/useItem` with the standard policy (Crystal before the Energy
  pool empties, since `useItem` is refused at 0 Energy; heal below 40% HP) and tallies HP
  spent. Its prepared warrior is the standard boss player; boss gates run the full lineage
  grid (12 lineages × every class option, `docs/SPEC-BOSS-COST-BAND.md` §3.3) on the same
  prepared build rules.
  Gotcha: set `c.dexterity = 999` when you need deterministic player-first initiative
  (a monster's opening strike consumes RNG and desyncs seeded comparisons).
- **Grid:** ≥300 trials per cell; cells = at-level regular, boss (prepared player),
  5-levels-down. Metrics: win %, rounds, HP spent per win (heals included), damage-per-energy,
  consumables spent.
- **Contract:** at-level regulars ≥85–100% win; bosses per `docs/SPEC-BOSS-COST-BAND.md` §2
  (amended by `docs/SPEC-BOSS-COST-RETUNE.md`): each lineage's weakest option wins ≥ 85%
  (finale ≥ 75%), its cheapest option spends ≥ 35% of the HP bar per win or ≥ 3 consumables
  (finale ≥ 45% HP spent), no build spends > 50% of its stock; 5-down = certain death
  via Fear (known limitation past ~L50, DESIGN §4 — new mechanics must not *widen* it;
  v1.4 P0 verified provisions leave true 5-down cells at 0.0%).
- Sim scripts are **ephemeral** (scratchpad, not committed); the *results* are durable
  (spec + commit message, like `3a1effd`).

## 3. Delegation protocol (spawning implementation agents)

The lead does scoping, specs, sim gates, and review; implementation goes to subagents
(historically Sonnet). This split exists because **review quality, not implementation
speed, protected the codebase** — don't absorb implementation into the lead session at
the cost of reviewing your own work less skeptically.

- **Full brief in the spawn prompt.** Scope additions sent mid-flight look like prompt
  injection and get (correctly) refused — respawn with a new full brief instead.
- A complete brief contains: exact scope and files, every constant with its citation tag,
  which hardcoded test expectations will *legitimately* change (counts, save version),
  and the standing prohibitions below.
- **Standing prohibitions to paste into every game-code brief:**
  - Never weaken a behavioral test assertion; only update stale constants.
  - Drop tables: APPEND only; nothing may follow a chance-1 entry.
  - One RNG surface (`Game.Battle._rng`); never add a second.
  - Every new item/monster/tech id needs `assets/icons/<id>.png`; monster icons must be
    byte-distinct from each other.
  - New character fields = 3 parts: `create()`, version bump + migration, migration test
    incl. full v1→current chain.
  - `js/core/*` stays DOM-free; UI renders from `Game.state` only.
  - Every constant needs an `[archived]/[invented]/[revised]` citation comment.
- **Environment facts:** subagents historically had no network access (the lead's Bash
  does — icon downloads are lead work); `/tmp` paths misresolve to `D:\tmp` for the
  Windows node/curl — stage downloads in repo-relative dirs; `execSync` curl must not
  use `< /dev/null` (cmd.exe).

## 4. Review protocol (what "review every delivery" means)

1. `git status` + `git log` first — concurrent sessions share this checkout and foreign
   commits land on whatever branch is checked out (see `herorpg-ops-hazards` memory).
2. Run all ten suites yourself: `cd tests && for t in test_*.js; do node $t; done`.
   Never accept the agent's green claim.
3. Read line-by-line any diff touching: `js/balance.js`, `save.js migrate()`, monster
   drop tables, changed test constants, anything tagged `[revised]`.
4. **Re-sim balance claims independently** — don't rerun the agent's sim script blindly;
   check its fixture and policy first (a too-strong fixture hides losses).
5. Check citations on every new constant, and DESIGN.md tags on every new mechanic.
6. New ids → icon files exist and (for monsters) are hash-distinct (`test_icons.js`).
7. **Open the game in a browser for UI work.** fakedom can't catch layout, scroll, or
   focus issues — the battle-log autoscroll bug and the camp-ambush soft-lock both
   shipped past green suites.

## 5. Failure-mode catalog (specific bugs that recurred or nearly shipped)

| Failure | Lesson |
|---|---|
| Over-armoring stalled melee — **twice**, then again in v1.3 (5 armor slots stacked ~1.5× a monster's damage term → `ARMOR_STACK_DIVISOR=2`) | Armor is the most dangerous stat to add; always sim melee time-to-kill |
| eidas_echo drop after a chance-1 entry → Heir of the Echo unobtainable | First-hit-wins tables: verify reachability programmatically |
| v1.2 skill caps (0.30/0.40) broke "5-down = death" | New player-power sources must be simmed against the contract, not just at-level |
| Quest materials blocked by the 5-level loot cutoff → tier-2→3 class quest walled | Cross-feature interactions (loot rules × quest requirements) need a connectivity check |
| CRLF checkout broke `build_artifact.js` regex mid-release | Tools that regex repo text must normalize line endings on read |
| `learnTech` classOnly NaN; camp-ambush UI soft-lock | Guard cross-module hooks (`if (Game.X && Game.X.fn)`); browser-test UI flows |
| Agents claiming green suites without running them | Review protocol step 2 exists for a reason |

## 6. Where knowledge lives (lookup map)

- `CLAUDE.md` — rules, formulas, conventions (always in context; keep it current).
- `docs/DESIGN.md` — the mechanic authority; every mechanic tagged.
- `reference/SOURCES.md` — archive index. Mine before inventing.
- `docs/REVIEW-2026-07-11.md` — `[deferred]` findings = seeded backlog.
- `js/balance.js` — constant-by-constant rationale comments (incl. F1 notes).
- `tests/` — behavioral spec; `test_p6b_content.js` has the canonical battle-drive
  fixture; `test_reload.js` is the release guard.
- `.claude/skills/` — balance-sim, delegate-review, release procedures.
- Memory (`~/.claude/projects/.../memory/`) — ops hazards, handoff notes.

## 7. When to slow down

Lead-level line-by-line attention (don't just delegate and skim): save migrations,
anything touching the difficulty contract or established formulas, drop tables, the
release guard, deploy tooling. Ask the user for: difficulty-feel calls, feature cuts,
accepting a known limitation, anything irreversible (deploys are permission-gated —
hand them to the user).
