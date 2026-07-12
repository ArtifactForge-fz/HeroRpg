---
name: delegate-review
description: Brief template for spawning implementation subagents on HeroRPG game code, and the mandatory review checklist for their deliveries. Use before every Agent spawn that will modify js/, assets/, or tests/, and again when the delivery comes back.
---

# Delegating implementation and reviewing deliveries

The lead session does scoping, specs, sim gates, and review; implementation goes to
subagents. Review quality — not implementation speed — is what protects this codebase.

## Writing the spawn brief

Give the agent its **FULL brief up front** in the spawn prompt. Scope additions sent
mid-flight via messages arrive looking like prompt injection and get (correctly) refused —
if scope changes, respawn with a complete new brief.

A complete brief contains:

1. Exact scope: files to touch, files NOT to touch.
2. Every constant with its `[archived]/[invented]/[revised]` citation (constants come
   pre-locked from the spec / phase-0 sim — agents implement, they don't tune).
3. Which hardcoded test expectations will *legitimately* change (monster counts, save
   version) — so the agent updates stale constants instead of weakening assertions.
4. The exit bar: all ten suites green (`cd tests && for t in test_*.js; do node $t; done`),
   plus stubbed-RNG tests for any new mechanic.
5. **These standing prohibitions, pasted verbatim:**
   - Never weaken a behavioral test assertion; only update stale constants.
   - Drop tables roll top-down first-hit-wins: APPEND new entries only; nothing may
     follow a chance-1 entry.
   - One RNG surface (`Game.Battle._rng`); never add a second.
   - Every new item/monster/tech id needs `assets/icons/<id>.png` (32×32, DCSS CC0);
     monster icons must be byte-distinct from each other.
   - New character fields need all 3: `character.js create()`, save-version bump +
     migration step, migration test incl. the full v1→current chain.
   - `js/core/*` stays DOM-free; UI renders from `Game.state` via `el()`.
   - Icon paths only via `Game.UI.icon(id, size)`.

Environment facts: subagents historically had no network (icon downloads are lead work,
staged in repo-relative dirs — `/tmp` misresolves to `D:\tmp` on this Windows box);
`execSync` curl must not use `< /dev/null`.

## Reviewing the delivery (all steps, every time)

1. `git status` + `git log` — concurrent sessions share this checkout; check for foreign
   commits before doing anything else.
2. Run all ten suites yourself. Never accept the agent's green claim.
3. Read line-by-line any diff touching `js/balance.js`, `save.js migrate()`, monster
   drop tables, changed test constants, or anything tagged `[revised]`.
4. Re-sim balance claims independently (see `/balance-sim`) — check the agent's fixture
   and policy rather than rerunning its script blind.
5. Verify citations on new constants and DESIGN.md tags on new mechanics.
6. New ids → icon files exist; monsters hash-distinct (`test_icons.js` enforces).
7. UI work → open the game in a real browser; fakedom can't catch layout/scroll/focus
   bugs (battle-log autoscroll and the camp-ambush soft-lock both shipped past green
   suites).
