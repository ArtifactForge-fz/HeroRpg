# CONTINUE HERE — Level-Arc build (resume 2026-07-11+)

Handoff note for resuming the level-100 arc. Delete this file once the arc is finished and merged.

## Where we are

- **Branch:** `level-arc` (NOT merged to main). v1.2 is complete on `main`.
- **All 10 suites green.** Working tree clean as of the last commit below.
- **Commits so far on `level-arc`:**
  - `582bf6e` F1 — balance-to-100 (LEVEL_CAP=100 + cap routing + sim gate; proved the math closes at 100; documented the mandatory gear TAPER).
  - `99f36c8` Band A — Forests of Kuraan (levels 41–50): 2 areas + Kuraan Reclamation Camp town + 6 monsters + Majiku Warlord boss + tapered gear + techs + 3 quests + 35 placeholder icons.

## Authorities (read these first, in order)

1. `CLAUDE.md` — cardinal rules, review protocol, save-versioning, testing.
2. `docs/SPEC-FULL-LEVEL-ARC.md` — the arc spec; §10 has the resolved decisions D1–D4.
3. `docs/SPEC-ARC-BANDS.md` — **the band-by-band build plan (the operative authority for the content build)**: the "Hard conventions" block, the 41→100 arc table, per-band targets, and the finalization/phasing list.
4. The **F1 CONVENTION NOTES block at the bottom of `js/balance.js`** — the mandatory taper formula and boss-premium ballpark.

## Approved decisions (do not re-ask)

- **Scope:** build the full arc to level 100. Cap = 100 (one constant, already added).
- **Story arc (user-approved as designed):** single northward progression —
  Kuraan (A, done) → **Majiku Highlands (B)** → Frozen Reaches/Ukai (C) → Estari Ruins (D) →
  Skyspire Ascent (E) → Red Moon / **Eidas Ascendant final boss at L100** (F). All grounded in
  archived lore (DESIGN §2).
- **Pace (user-approved):** **continuous run** — build bands B→F back-to-back, review + commit each,
  then finalize (F4/F5/icons/re-sim/docs). Only stop for a real problem or at completion.

## The exact next action: build Band B

Spawn a Sonnet subagent (general-purpose, model sonnet, run in foreground so you can review) with
the brief below. It was written and ready when the session ended (the user paused before it ran).

> Implement content Band B (levels 51–60, "Majiku Highlands") on branch `level-arc` (F1 + Band A
> committed). Read `CLAUDE.md`, `docs/SPEC-ARC-BANDS.md` (Hard conventions + the Band B row +
> Per-band target), the F1 CONVENTION NOTES in `js/balance.js` (mandatory taper + boss premium), and
> study how Band A was built (read the Kuraan entries in areas.js/monsters.js/items.js/quests.js/
> techs.js) so Band B matches its structure/quality. Do NOT commit/bundle/publish.
> - Two hunting areas: "Majiku Border Steppe" (minLevel 51), "Highland War-Camps" (minLevel 56),
>   level-gated, travel-reachable, ±5-cutoff-safe (Band A's Deep Kuraan is minLevel 46).
> - Lair boss "Majiku Ridge-Chieftain" (~L60): flat hp/damage premiums (damage premium ≈
>   round(1.5*60+10)=100) + ×3 xp, winnable-but-costly.
> - ~5–6 monsters (51–60) on the formulas (hp=20+12·lvl, dmg=3+2·lvl, energy=40+10·lvl, armor≈lvl
>   capped); append-only drops; curseChance on 1–2 thematic ones.
> - Items tier ~55 (+~58 sub-tier), weapons/armor authored off the TAPER
>   effectiveLevelReq=35+0.7*(levelReq−35) (band-55 → effective 49 → weapon dmg ≈ 3+2·49 = 101);
>   2–3 uniques (monster-drop, +15–25% over tapered tier); extend graded Crystal/Sphere/energy
>   consumables into the band; 1–2 synthesis recipes; stock Kuraan Reclamation Camp's shop (Band B
>   has NO new settlement — it covers to L60).
> - Techs: extend a couple magic-school chains and/or weapon-tech ranks one step (skill-gated).
> - Quests: 1 main-spine ("break the Majiku host") + 1–2 side; givers at a reachable settlement.
> - Icons: present + hash-distinct 32×32 placeholder PNGs for every new id (same encoder prior bands
>   used; verify valid + byte-distinct vs the FULL icon set); note in assets/CREDITS.md.
> - Tests: areas gated/huntable/reachable; boss premium + winnable; monsters on formulas; existing
>   drop rates unchanged; assert a band-55 weapon's damage is the TAPERED value not literal 3+2·55;
>   quests accept→progress→turn-in; content-integrity of new refs; update stale counts without
>   weakening assertions. All 10 suites green. Report files changed, key numbers (show the taper),
>   travel/gap confirmation, icon validity, and the 10/10 output.

## Review protocol per band (the lead does this before committing)

1. Run all 10 suites yourself: `cd tests && for t in test_*.js; do node "$t" || echo FAIL $t; done`.
2. Spot-check: the band's top weapon uses the TAPER (not literal 3+2·levelReq); the boss premium
   matches round(1.5·bossLvl+10); travel reachability + no ±5 gap; content-integrity green.
3. Commit with the established message format (imperative subject ≤72; body with what/why + tags;
   note "no save change"; `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`). The post-commit
   hook rebuilds the artifact bundle automatically.

## Then bands C, D, E, F — same recipe

Follow `docs/SPEC-ARC-BANDS.md` rows C–F (mirror the Band B brief, swap the region/areas/boss/level
range/story beat). C adds the 2nd new settlement "Frosthold Waystation" (~L66). F's L96–100 area +
"Eidas Ascendant" boss is the finale capstone.

## Finalization after all bands (in order)

1. **F4 — class re-gate:** move the tier-3 "The Master's Calling" unlock from L38 to ~L60 (quest
   levelMin + any class-unlock level); verify class XP reaches tier-3 ability costs by L100.
2. **F5 — story spine:** stitch the per-band beats into a coherent Chapter II→III arc in
   `js/data/story.js` + the Journal; make the L100 Eidas finale read as the capstone.
3. **Real-icon pass (LEAD ONLY — sub-agents' Bash has no network; the lead's does):** replace every
   placeholder icon added across the bands with real DCSS CC0 tiles. Proven pipeline (see the v1.2
   icon commit `30c1962` and `assets/CREDITS.md`): download from
   `https://raw.githubusercontent.com/crawl/crawl/master/crawl-ref/source/rltiles/<path>.png` into a
   **repo-relative staging dir** (NOT /tmp — mktemp gives an MSYS path Node reads as `D:\tmp\...`;
   stage under the repo so curl+node agree), validate each is a 32×32 PNG, then move in and confirm
   ZERO byte-identical duplicate groups across all icons. Browse tile dirs via the GitHub contents
   API to pick real filenames. Update `assets/CREDITS.md`.
4. **Re-sim with REAL content** (not synthetic) at bands 50/70/90/100 using the scratchpad sim
   pattern; enforce the difficulty contract (at-level ≥85–100% win; 5-down = death; bosses costly);
   tune outliers.
5. **Docs:** update `README.md` (level cap, region/content), `DESIGN.md` §2/§10 (new regions,
   content-volume actuals), and flip `docs/SPEC-FULL-LEVEL-ARC.md` status toward done.
6. **Merge `level-arc` → `main`** (fast-forward if possible), confirm 10/10 green on main.

## Gotchas learned this run

- **Taper is mandatory** past band 35 or the game trivializes by L100 (F1 sim finding). Every band's
  gear must use it; a test should assert it.
- **Sub-agents can't reach the network** (they fall back to placeholder icons) — that's expected;
  the lead does the single real-icon pass at the end. Don't have band agents fight the tileset.
- **Windows path trap:** `mktemp -d` → `/tmp/...` which Node (a Windows binary) resolves as
  `D:\tmp\...`. Stage downloads in a repo-relative dir so curl (MSYS) and node (Windows) agree.
- **No save-version bump** is needed for the whole arc (all content is data; LEVEL_CAP is a
  constant). Keep it that way — prefer computed gates over new persisted fields.
- **Review every subagent delivery** (run suites yourself, read risky bits, sim-check balance) — do
  not trust the report; that's the workflow.
