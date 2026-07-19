# SPEC — v1.8 "The Expanded Curriculum": Tech Polarity Expansion + Reachability Fixes

**Status:** DRAFT — awaiting user approval (lead, 2026-07-19). No sim run yet; P0 is the gate.
**Baseline:** branch `v1.7-content` at `1607411` (v1.7.0 complete; **not yet merged to `main`,
not deployed — both remain user-gated and are independent of this spec**). v1.8 work branches
from `v1.7-content` (or from `main` after the v1.7 merge, whichever the user does first).
**Save version: unchanged (10).** No new persisted character fields anywhere in this release —
learned techs persist by id in the existing list; all new battle statuses are transient; new
item/tech fields are data-side only. No migration, no version bump.

> **PLACEHOLDER — user playtest feedback.** The prompt that opened this cycle referenced
> feedback ("the following feedback") that did not arrive with the message. This spec covers
> SPEC-T~2 + AUDIT-ITEM-REACHABILITY; when the feedback lands, triage it into the phase plan
> below (or into a REVIEW-triage doc if it's large) before implementation starts.

## 0. What this release is

Two workstreams that turn out to be one:

- **Workstream A — Tech Polarity Expansion** (`docs/SPEC-T~2.MD`, decisions D0–D4 all resolved
  by user 2026-07-17): 18 new chains × 4 ranks = 72 new player techs (75 → 147), one chain per
  archived skill, plus six battle-transient engine extensions (debuffs, new buff statKinds,
  bleed, equipment gating, goldSteal).
- **Workstream B — Reachability & dead-item fixes** (`docs/AUDIT-ITEM-REACHABILITY.md`,
  2026-07-17): dual-wield unwalling (T1-a), cursed-ring trap activation (T1-b), Wardframe
  rune-shard sink (§5), trophy/lore clutter policy (§3), wiki Source/Used-for cross-reference
  (§6), and a standing no-dead-items guard.
- **QoL rider (user-directed, 2026-07-19):** a **persistent gold readout** in the status-bar
  panel, next to HP/Energy/XP and the weight line. `[invented]`, user-directed. Detail in P4.

**The coupling that makes them one release:** SPEC-T~2's Crosscut chain (Dual Wield) hard-gates
on `requiresOffhandWeapon` — and audit T1-a proves **no offhand weapon is obtainable in the
shipped game** (`knife_offhand_twinfang` / `hth_offhand_cestus` exist only as definitions,
items.js:212/224; re-verified on this tree 2026-07-19). Shipping A without B ships a second
dead-on-arrival dual-wield feature on top of the first. B's T1-a is therefore a **blocking
dependency** of A's Crosscut chain, sequenced in the same phase.

Also re-verified on this tree (the audit ran pre-commit; these survived the v1.7 commits):
- `ring_of_the_hollow_king` still unplaced (items.js:629 only) — T1-b live.
- `quest_wardframe_rune_shard` drops (monsters.js:175, 30%) and forages (areas.js:337) but has
  **no consuming quest step or recipe** — audit §5 live; `arkan_calling` kills the Wardframe but
  nothing collects the shard.
- The v1.7 wiki ships item **Source** for shops + drops only (`js/ui/wiki.js`
  itemShopSources/itemDropSources); forage/quest-reward/recipe-output sources and the whole
  **"Used for"** axis (recipe inputs, quest collect targets) are missing — audit §6 half-open.

## 1. Analysis of SPEC-T~2 (lead review, 2026-07-19)

Coverage check passes: 18/18 archived skills each get exactly one 4-rank chain; polarity
assignments match D0/D1; ids are `tech_` snake_case with no collisions against `js/data/techs.js`
(spec §4 grep claim, to be re-verified at delivery review). The ±4 skillReq variance at rank 1
(0 vs 4) is intentional per the spec's own scaffold. Findings that amend or annotate it:

1. **[BLOCKER — resolved by sequencing] Crosscut requires what T1-a proves unobtainable.** See
   §0. P2 (reachability) lands before or with P3 (tech data), and the P0 sim's Crosscut cell
   must use an offhand weapon from the NEW ladder, not the two orphan level-1 items.
2. **[SIM-GRID GAP] Cross-chain stacking is under-specified.** SPEC-T~2 §2.0.4 lets *different*
   chains stack, and §3's grid only checks each family against passives/shrine/Rage. Two real
   ceilings it misses:
   - **Dodge:** Fleetstep IV (+0.12) + Sidestep IV (+0.16) stack to +28% on top of
     `DODGE_BASE + dex·DODGE_PER_DEX + skill·DODGE_PER_SKILL_LEVEL`. The grid's ">50% dodge
     uptime → hard cap" trigger must be evaluated with BOTH chains up, not each alone.
   - **Armor:** Steel Resolve IV (30) + Nullward IV (30) + Battle Harness IV (30, or Ironroot
     IV 38) + Rage + Spirit Shrine can stack 90+ flat armor. The v1.6 **penetration floor
     (0.30)** guarantees monster hits still land ≥30% of rolled damage — this is the release's
     structural safety net and the reason full immunity is impossible — but the sim must
     confirm boss fights remain "winnable-but-costly" under a max-stacked defensive kit, and
     that 5-down stays certain death with everything stacked. Added as P0 grid rows (§3).
3. **[NIT — spec text] Icon distinctness overclaim.** SPEC-T~2 §4 says the 72 icons must be
   "hash-distinct — test-enforced." The standing convention (CLAUDE.md, v1.5 precedent) is:
   only MONSTER icons need mutual byte-distinctness; item/tech icons may reuse DCSS tiles;
   `test_icons.js` enforces *presence* for all. Implement to the standing convention.
4. **[NOTE] Rod interaction is post-v1.6-consistent.** Channeled Strike's above-taper 2.3 mult
   rides melee damage that v1.6's Rod caster identity already halved — the justification holds,
   and D4 pre-registered fallbacks (1.85/1.95) apply if the sim disagrees.
5. **[UI DEBT] The Academy list grows 75 → 147 entries.** Endgame UI list scaling is already a
   `[deferred]` REVIEW-2026-07-11 finding; +72 techs aggravates it. SPEC-T~2 §4's own remedy
   (the archived techs-page type tabs gaining buff/debuff categories) is REQUIRED scope for the
   Academy/techs screens in P4, not optional polish.
6. **[HOUSEKEEPING] The spec file needs a real name.** `docs/SPEC-T~2.MD` is a Windows 8.3
   short-name artifact and is untracked. At P1 start, rename to `docs/SPEC-TECH-POLARITY.md`
   and commit it together with `docs/AUDIT-ITEM-REACHABILITY.md` and this spec.

## 2. Decisions (user-gated — product feel; recommendations pre-registered)

- **D-A — Trophy/lore clutter policy (audit §3, 5 items).** Options: (a) route `lore`/trophy
  tags to a codex/journal display; (b) drop `no-trade`, give small sell value; (c) add a
  trophy turn-in sink. **Recommendation: (b)** — smallest surface (data-only, no new UI or
  quest machinery), immediately ends the "accumulates forever" complaint, and keeps (a) open
  for the backlogged endgame-loop cycle where a codex already appears (SPEC-ENDGAME-LOOP
  Codex/achievements). Pure content, no sim.
- **D-B — Cursed ring slot + placement (audit T1-b).** The sole cursed item is a "ring" in the
  `head` slot at levelReq 1 with armor 18 (trap bait). **Recommendation:** keep the `head` slot
  but rename/reflavor the item to a circlet ("Circlet of the Hollow King") — no `ring` slot
  exists and inventing one for a single trap item is scope creep; a too-good-to-be-true head
  piece is exactly how the archived trap ("cannot be removed", `Cursed.md`) should bait. Place
  it as a rare drop on 2–3 mid-band monsters and/or a deceptive chest reward, positioned where
  a Spirit Shrine (the cleanse, world.js:643) is reachable but costs a trip. `[invented]`,
  armor 18@L1 is deliberately over-stat trap bait — sim not required (it's armor a player
  chooses, and the cleanse exists), but the P0 run should sanity-check it doesn't beat the
  at-level body-armor curve so hard that keeping it cursed is optimal.
- **D-C — Wardframe rune-shard sink (audit §5).** Options: recipe input vs. quest collect
  step. **Recommendation: recipe** — a Saratus-crafted minor rune consumable (e.g. a one-battle
  weapon-damage or armor rune, Arkan battlemage flavor per SPEC-ARKAN-DIFFERENTIATION), because
  the Arkan quest line was just rebuilt in v1.7 and adding a collect step to a shipped quest
  retroactively changes turn-in requirements for in-flight saves, while a new recipe is purely
  additive. If the recipe output has combat stats → it joins the P0 sim.

## 3. Phase plan

Every phase independently committable, all **11 suites** green before each commit
(`cd tests && for t in test_*.js; do node $t; done`). Lead does P0 and all reviews;
implementation phases go to subagents via `/delegate-review` with full briefs up front.

### P0 — /balance-sim gate (lead; mandatory before any game code)
Real engine via node vm, seeded `Game.Battle._rng`, ≥300 trials/cell, standard fixture
(test_p6b_content.js), cells: at-level regular / boss-prepared / 5-down.
Runs the FULL SPEC-T~2 §3 grid (all ten rows, incl. D4's Crosscut 2.1 / Channeled Strike 2.3
with pre-registered fallbacks 1.85/1.95), **plus** these release-added rows:

| Added row | Metric |
|---|---|
| Cross-chain dodge stack (Fleetstep IV + Sidestep IV + passives + dex) | total dodge uptime; if >50% sustained → define hard total dodge cap before implementation |
| Cross-chain armor stack (Steel Resolve + Nullward + Battle Harness/Ironroot + Rage + shrine) | boss damage-taken vs penetration floor 0.30; boss stays costly; 5-down stays 0% win |
| Offhand-weapon ladder (T1-a new items) | dual-wield build (ladder offhand + DUAL_WIELD_* passives + Crosscut) vs difficulty contract at each ladder rung's level |
| Debuff + charged-hit interplay | Crippling Thrust/Curse damage-debuff vs telegraph release ×2.0 and enrage ×1.5 — must not trivialize the v1.5 telegraph answer or the boss premium |
| D-C recipe output (if it has combat stats) | at-level uplift; no-arbitrage vs AP/provision spirit (DESIGN §6) |

Locked constants + results go into SPEC-TECH-POLARITY.md (updated in place) and the P0 commit
message. Ratchet applies: new mechanics bend to shipped balance, never the reverse.

### P1 — Engine extensions (subagent; js/core/battle.js + tests)
The six SPEC-T~2 §2.0 mechanisms: statKind passthrough ('dodge'/'double_attack'/'spellpower'),
`effect:'debuff'` (damage/armor kinds, floors 1/0, hit-roll split: Int spell-hit for magic
schools, monster-dodge for weapon skills), `debuffKind:'bleed'` (servitor tick site, Fear
discipline preserved), re-cast-replaces-per-chain, equipment gating (requiresShield /
requiresOffhandWeapon / requiresArmorClass, checked pre-cost with friendly refusal log),
goldSteal rider (banked, paid with onWin gold, forfeited on flee/loss). All battle-transient —
nothing touches save.js. Stubbed-RNG tests for every mechanism through `Game.Battle._rng`
(single surface). Crosscut's guaranteed offhand follow-up reuses the existing dual-wield
follow-up path at the character's current multiplier.

### P2 — Reachability fixes (subagent; data + one UI decision applied)
- **T1-a:** stock `knife_offhand_twinfang` + `hth_offhand_cestus` in Eldor AND Saratus weapon
  shops (both levelReq 1); add the P0-locked offhand-weapon ladder (≈4 rungs mirroring the
  shield tiers' levelReqs, Knives + Hand-to-Hand coverage) as shop stock / appended drops.
  `[revised]` (unwalls the shipped v1.2 mechanic). Drop entries APPEND-only.
- **T1-b:** per D-B — reflavor to circlet, place as appended rare drops / chest reward.
- **D-C sink:** the Saratus rune recipe consuming `quest_wardframe_rune_shard`.
- **D-A policy** applied across the 5 trophy/lore items.
- **Guard:** promote the audit's reachability script to `tools/check_reachability.js` and add
  its two assertions (no obtainable-but-sinkless non-flavor item; no sink-but-unobtainable
  item, with an explicit flavor allowlist for intentional trophies) to a suite — either a new
  `tests/test_reachability.js` (suite count 11 → 12; update CLAUDE.md rule 5 wording at
  release) or folded into test_p6b_content. New suite preferred: it's the audit made permanent.

### P3 — Tech data (subagent; js/data/techs.js + icons)
72 entries appended per chain group with P0-locked numbers, every constant carrying its
citation tag from SPEC-TECH-POLARITY.md (predominantly `[invented]`, Curse's name
`[archived: Version_2.1_Changes.md]`). 72 icons `assets/icons/tech_*.png` (32×32 DCSS CC0,
lead downloads if agent env lacks network; tech icons MAY reuse tiles per standing convention).
Stale count constants updated (75 → 147 player techs), never behavioral assertions.

### P4 — UI (subagent; js/ui/*)
- Techs/Academy screens: type tabs gain buff/debuff categories (archived tabs precedent,
  Version_2.1_Changes.md) — required, see §1.5; battle log lines name the affected stat and
  disambiguate the Curse TECH from the player-afflicting Curse STATUS (D2 note).
- Equipment-gate refusals surface the friendly message (shardCost refusal pattern).
- **Wiki completion (audit §6):** item Source gains forage / quest-reward / recipe-output;
  new **"Used for"** column (recipe inputs, quest collect targets) — computed from the same
  data the P2 guard reads. This closes the Condensed-Anima-Core class of confusion and makes
  the wiki the player-facing face of the no-dead-items guard. Browser-check UI work by hand —
  fakedom can't catch layout/scroll (standing lesson).
- **Persistent gold readout (user-directed QoL):** `Game.renderStatusBars()`
  (index.html:207–238) gains a gold line beside the weight readout, formatted
  `Gold: <platinum>p <gold>g` exactly like the Status screen (screens.js:341, via
  `c.platinum`/`c.gold`). **The load-bearing part is refresh, not rendering:** the bars only
  re-render on `Game.renderStatusBars()` calls, and gold mutates in flows that don't currently
  call it (shop buy/sell, AA has no gold but Synthesis does, vault deposit/withdraw, inn fee,
  shrine cleanse, quest turn-in, camp robbery, battle win incl. goldSteal payout from P1).
  Brief: audit every gold-mutation site and ensure a `renderStatusBars()` follows —
  prefer adding the call inside the shared post-action re-render paths over sprinkling it
  per-handler where such a path exists. Also verify the goldSteal rider's payout (P1) updates
  the readout at battle end. No save impact; tests already stub `renderStatusBars` (fakedom),
  so coverage is the browser check.

### P5 — Release (lead; /release checklist)
Changelog PREPEND (player-facing; SPEC-T~2 §4 draft + a reachability line: "…and the armories
of Averast have restocked: paired offhand blades return to the shops, lost relics have
resurfaced, and the wiki now tells you where everything comes from and what it's for. Your
gold pouch now sits in plain view beside your health and energy.");
README version bump; save version stays 10 (release guard asserts consistency); single-file
artifact rebuilds via post-commit hook. Merge to `main` and deploy remain user-gated.

## 4. Test plan summary

- P1: stubbed-RNG unit tests per engine extension (debuff floors, bleed×Fear, re-cast replace,
  gate refusals pre-cost, goldSteal forfeit-on-flee).
- P2: reachability suite (the promoted audit) + shop/drop presence; dual-wield activation test
  (offhand equipped → follow-up swing fires).
- P3: tech-count + icon presence; id-collision grep.
- P4: wiki Used-for/Source rendering against known fixtures (test_wiki.js extension).
- Cross-cutting: full 11-suite run before every commit; release guard at P5.

## 5. Out of scope

Everything SPEC-T~2 §6 excludes (class/monster techs, new grades, limit breaks, v3.0 systems);
the v1.7 merge/deploy (user-gated, independent); the backlogged endgame loop, online mode, and
boss-telegraph pass; audit §3 option (a)'s codex UI (deferred to the endgame-loop cycle).

## 6. Documents of record

- `docs/SPEC-T~2.MD` → to be committed as `docs/SPEC-TECH-POLARITY.md` (P1 start) — Workstream
  A authority; its §3 sim grid + §5 resolved decisions are normative.
- `docs/AUDIT-ITEM-REACHABILITY.md` — Workstream B authority (commit alongside).
- This file — release plan, sequencing, added sim rows, D-A/D-B/D-C decisions.
