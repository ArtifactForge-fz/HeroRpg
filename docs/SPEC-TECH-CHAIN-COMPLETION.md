# SPEC — Tech Chain Completion (six chains to rank IX) — retroactive record + owed sim gate

**Status:** RETROACTIVE. The content shipped in v1.9.0 from external PR #1 (commit `21031ec`,
2026-07-21), whose commit message cites this file; the file itself was never committed (v1.9 review
item 1, `CLAUDE.md`). Written 2026-10-29 from the shipped data so the 19 code comments that cite it
point at a real authority. **The owed sim gate (v1.9 review item 2) ran 2026-10-29: §3.** No game
code changes in this spec; failing cells go to follow-ups (§4), per the ratchet principle.

**Relationship to authority:** extends `docs/DESIGN.md` §5 (Academy tech chains). No archived rule
touched. Every value below is `[invented]` and continues a pattern the chain already shipped with.
Two later specs have since replaced part of what PR #1 authored, and are the authority for those
fields today:
- spell powers of ranks VI–IX: `docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §2.1 (PR #1's ×0.55 pre-taper
  made ranks VI dip under rank V; that spec made every rank rise);
- weapon `powerMult` of every rank: `docs/SPEC-ACADEMY-WEAPON-CHAINS.md` §2.2 (monotonic re-taper).

---

## 1. What PR #1 added (42 entries, 160 → 202 techs)

| Chain | Skill | Grade | Shipped before | Added by PR #1 |
|---|---|---|---|---|
| Starspark | Evocation | Star | I | II–IX (8) |
| Tidal Lance | Evocation | Water | I–II | III–IX (7) |
| Shadowlash | Conjuration | Dark | I–III | IV–IX (6) |
| Lifetap | Absorption | Dark (drain) | I | II–IX (8) |
| Vital Strike | Knives | — (weapon tech) | I–III | IV–IX (6) |
| Flurry | Hand to Hand | — (weapon tech) | I–II | III–IX (7) |

Alteration chains (Warrior's Edge, Focus) were left out on purpose (PR #1 commit message). Each new
entry has a hue-shifted copy of its chain's top-rank icon (`assets/icons/tech_*.png`).

## 2. Field rules (as shipped; still in force unless §0 says otherwise)

### 2.1 Spell power, ranks II–V [invented]
Continue Firebolt's rank deltas (+12, +14, +16, +18) from each chain's rank I:
Starspark = Firebolt + 2, Tidal Lance = Firebolt + 1, Shadowlash = Firebolt + 1 (+2 from rank III).
Ranks VI–IX: see `docs/SPEC-SPELL-CHAINS-AND-ARMOR.md` §2.1.

### 2.2 Lifetap power [invented]
About 10–15% under the same Firebolt rank (12/22/34/48/64, then 71/77/84/90), pricing in its 50%
self-heal (`effect: 'drain'`).

### 2.3 Skill requirement ladder [invented]
Every chain uses the same steps per rank (rank I is the chain's own): spells II 8, III 12, IV 20,
V 30, VI 40, VII 50, VIII 60, IX 70; weapon chains II 6, then the same 12…70. These steps are also
what `BALANCE.ACADEMY_SKILLREQ_CAP` sorts into towns (v1.13). **Exception, older than PR #1:**
Shadowlash II needs Conjuration **5**, not 8 (baseline v1 data, no citation). See §4 F1.

### 2.4 Training Point ladder [invented]
Ranks II–IX cost 4, 5, 6, 8, 10, 12, 14, 16 TP (weapon chains: rank II 3), the same as Firebolt.

### 2.5 Energy cost [invented]
Spells: +6 per rank from rank I (Firebolt 12 → 60; Starspark 14 → 62; Tidal Lance 13 → 61;
Shadowlash 13 → 62; Lifetap 15 → 63). Vital Strike +4 per rank (10 → 42). Flurry +6 to rank III,
then +4 (14 → 50).

### 2.6 Descriptions and icons
One "<Town>-era form of …" description per rank; icons as §1.

### 2.7 Vital Strike armor pierce [invented]
`armorPierce: 0.5` on every new rank, unchanged from ranks I–III.

### 2.8 Flurry hits [invented]
`hits: 2` on every new rank, unchanged from ranks I–II.

## 3. Sim gate (owed since v1.9; run 2026-10-29)

**Question (v1.9 review item 2):** four rank-IX spell chains in four Anima grades let a caster pick
the best grade per monster ("grade coverage" 1.270× vs Firebolt-only 0.965×, about +32% top-end
damage). Does that break the at-level or 5-levels-down contract on regular monsters?

**Method:** `/balance-sim` rules on the real code (v1.14.0, unpatched); seeded mulberry32 (trials from
seed 7000), **300 trials per cell**. Prepared hero from `tests/boss_fixture.js` `build()` with the kit
(Academy chains + shrine budget), for Magus, Cleric and Seer. Every one of the **77 regular monsters**
(the 11 bosses are covered by the boss grid of `docs/SPEC-BOSS-SIM-FULL-KIT.md`), at-level (hero =
monster level, at least L3, the first level the fixture has a Crystal) and five levels down (hero =
monster level − 5, 62 cells). Turn policy: Crystal before the Energy pool empties, heal item under 40%
HP, else the strongest affordable spell of the set (ranked by a 10-fight opening-hit probe per
monster), else Attack. Three spell sets on the same build:
- **fb** — Firebolt only (the baseline `OFFENSE_TECH_TAPER` was locked to);
- **evo** — + Starspark and Tidal Lance (Evocation, the skill the fixture trains);
- **all4** — + Shadowlash and Lifetap, with Conjuration and Absorption also at half level.

**At-level: passes.** 100% win in all 77 cells for every lineage and every set. Average HP spent per
win falls 30–31% (fb) → 27–28% (evo) → 24–25% (all4); rounds 4.4 → 4.0 → 3.6. In all4 the opening
probe picks Starspark at 40 monsters, Firebolt 20, Shadowlash 14, Tidal Lance 3.

**Five levels down** (Magus; Cleric and Seer within 2 points), mean win % by monster level:

| Monster level | Cells | fb | evo | all4 |
|---|---|---|---|---|
| L8–15 | 14 | 0 | 1 | **11** |
| L16–29 | 9 | 33 | 38 | **64** |
| L30–49 | 9 | 71 | 79 | 79 |
| L50–69 | 12 | 86 | 91 | 91 |
| L70–99 | 18 | 96 | 98 | 98 |

- **From about L29 up** every set already wins most 5-down fights: the accepted Fear-sustain
  limitation (`CLAUDE.md`, DESIGN §4). PR #1's chains add 0–8 points on average there; the largest
  single moves are the two wraiths, `kuraan_hollow_wraith` (L48) and `highland_hollow_stormwraith`
  (L58), 52–55% → 90% with Starspark.
- **Below L29 all4 widens the hole, and the cause is not PR #1.** Five cells go from 0–1% (fb) to
  51–100%: `foothills_stoneback_giant` and `foothills_ridge_hound` (L15), `juneros_tidewalker` (L19),
  `juneros_reefstalker` and `juneros_riptide_hunter` (L20). In every one the probe picks
  **Shadowlash II**, which needs Conjuration 5 (§2.3), so a level-10 hero has it while its Firebolt is
  still rank I. Under five levels of Fear, Firebolt I deals 6.6 a cast to `foothills_ridge_hound`;
  Shadowlash II deals 18.3. Shadowlash II has shipped with that requirement since baseline v1, before
  PR #1. Follow-up F1.
- **Below L29, Firebolt alone also wins some fights:** `juneros_coral_warden` (L21) 74%,
  `kastengard_wardframe` (L26) 41%, `kastengard_earthbound_sentinel` (L28) 84%. Older than PR #1
  (fb is the shipped baseline); evo lifts the last two to 56% and 100%. Follow-up F2.

**Verdict:** PR #1's own chains pass the at-level contract and don't open a new 5-down hole; the
only one below L29 traces to Shadowlash II's older skill requirement. The grade-coverage gain is real
(about −6 points HP spent per at-level fight) and lands inside the accepted limitation from L29 up.

## 4. Follow-ups

| # | Item | Notes |
|---|---|---|
| F1 | Shadowlash II needs Conjuration 5; every other rank II needs 8 — **fixed** (`docs/SPEC-CONTRACT-FIXES-V19-QUEUE.md` §1, branch `v1.15-contract-fixes`) | Breaks 5-down at L15–L20 for a caster who trains Conjuration (51–100% win where Firebolt-only is 0%). Candidate fix: skillReq 8, the ladder value. A shipped constant, so it's a user decision; it needs its own sim and a check of `ACADEMY_SKILLREQ_CAP` (Shadowlash II would move from Eldor's curriculum to Ju`Mak's) |
| F2 | Casters win some 5-down fights at L21–L28 with Firebolt alone | Below the L29 line where the accepted Fear-sustain limitation starts; older than PR #1 |
