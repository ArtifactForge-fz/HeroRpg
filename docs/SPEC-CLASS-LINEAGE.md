# SPEC — Class Lineage (the Hero Tree: fixed T1+T2+T3, plus one swappable Legendary)

**Status:** IMPLEMENTED in v1.11.0 "The Hero Tree" (save v12), commit `b51c8fb`, together with
`docs/SPEC-ROGUE-BOSS-COST.md` + `docs/SPEC-NONDEX-DEFENSE.md`; review re-sim in §3.2. In
open PR 4 (`v1.11-hero-tree` → `main`); not merged, released or deployed. Decisions D0–D7 resolved by the user 2026-10-22 (§5).
Sim gate run 2026-10-22 (§3.1): passes, with the rogue-line boss cost accepted under D7 and moved
to a separate follow-up spec. No monster buff ships (`MONSTER_HP_MULT` / `MONSTER_DAMAGE_MULT` are
not added).
Authored 2026-10-22 (user-directed).
**Relationship to authority:** **[revised]** — overrides three archived v2.1 rules that
`docs/DESIGN.md` §3 "Classes" says still govern (`[archived: reference/manual/Classes.md]`):
1. the **Primary + Secondary** two-slot activation model ("You may activate both a Primary and
   Secondary class");
2. **manual activation** ("Before a class can be applied to your character, it must be activated");
3. the **deactivation wipe** ("you will lose all skills, abilities, Class Experience, and Class
   Levels in that class … This action cannot be undone").

All three overrides are user-directed (this request). Update DESIGN.md §3 (the "Original v2.1
archived design below (still governs …)" paragraph) and the `js/core/classes.js` header when it
ships.

**Interpretation of the request (confirm — D0):** A hero no longer *slots* classes. Each class
choice made through the tier quests becomes a permanent, always-active link in the hero's
**lineage**: the Tier-1 class from "The First Calling", the Tier-2 class from "The Trials of
Ascension", the Tier-3 class from "The Master's Calling". Their passives always apply, their
signature techs are always castable, and they cannot be deactivated or swapped. On top of that
sits **one** optional **Legendary slot**: any one unlocked Tier-4 class may occupy it and can be
swapped freely for another unlocked Legendary (or emptied). A level-60+ hero with a Legendary
therefore runs **4 classes at once** (today: at most 2). *Alternative reading:* every unlocked
Legendary stacks at once (no slot). The words "choose **an** additional tier 4 class" point to
one slot — recommended.

---

## 1. What changes

| | Today (shipped, `js/core/classes.js`) | Proposed |
|---|---|---|
| Obtaining T1/T2/T3 | One permanent pick per tier via quest `classChoice` (`js/core/quests.js` turnIn → `obtainClass`) | **Unchanged** — the pick is already one-shot |
| Activation | Obtained ≠ active; player drags any 2 obtained classes into Primary / Secondary | T1/T2/T3 **auto-active on obtain**, forever |
| Deactivation | Allowed; wipes XP, Class Levels, abilities, strips techs | **Removed** for lineage classes; no wipe anywhere |
| Legendaries (tier 4) | Compete with lineage for the 2 slots | Own **Legendary slot**, stacks on top; swap at an Academy, no cost, progress kept |
| Max active classes | 2 | 3 lineage + 1 Legendary = **4** |
| Class XP | Primary ×0.5, Secondary ×0.25 of battle XP (`BALANCE.CLASS_XP_FRACTION_*`) | One **shared pool** of ×0.5, split evenly over active classes that are not yet maxed (D2) |
| Academy purchases | Only for Primary/Secondary class | For any active class (lineage + slotted Legendary) |
| Class techs usable | Only if owning class is Primary/Secondary (`isClassTechUsable`) | If owning class is in lineage or the Legendary slot |

The panel name **"Hero Tree"** reuses an archived phrase: the 2006 Tier-4 news post lists "Ability
to name your class based on your hero tree" as planned work `[archived:
reference/site/homepage_2006.md]`. The 2005–06 tier era was explicitly cumulative ("Tier 4 and 5
advancement for heroes", same file) — stacking tiers into one lineage is in that spirit
**[invented mechanics, archived name]**. The class-naming feature itself is out of scope (§6).

---

## 2. Design detail

### 2.1 Character state (save v11 → v12)

| Field | Type | Tag | Notes |
|---|---|---|---|
| `c.lineage` | `{ tier1: classId\|null, tier2: classId\|null, tier3: classId\|null }` | [invented] | Set once by `obtainClass` when the obtained class's tier slot is empty; never cleared |
| `c.legendaryClass` | `classId\|null` | [invented] | Must be an obtained `legendary: true` class |
| `c.primaryClass`, `c.secondaryClass` | — | — | **Deleted** by the migration |
| `c.classes[id]` | unchanged entry shape | — | Progress is stored per class as today; nothing is wiped |
| `c.legendaryUnlocked` | unchanged | — | Back-compat latch, untouched |

### 2.2 Rules

| # | Rule | Tag |
|---|---|---|
| R1 | `obtainClass` for a tier 1/2/3 class writes `c.lineage.tierN` if empty → the class is active immediately. Message: "*{Name}* joins your Hero Tree." | [invented] |
| R2 | Lineage classes can never be deactivated, swapped or removed. The quest choice dialog for T2/T3 warns: "This choice is permanent. *{Name}* will join your Hero Tree for good." (T1 already permanent today; same warning added.) | [revised] (deactivation rule, `reference/manual/Classes.md`) |
| R3 | `activeClassIds(c)` = non-null of `[lineage.tier1, lineage.tier2, lineage.tier3, legendaryClass]`. **Every** consumer of `[primaryClass, secondaryClass]` switches to it: `classBonus`, `isClassTechUsable`, `buyAbility`, `addClassXp`, Academy roster (`js/ui/screens.js` ~1844). | [invented] |
| R4 | The first Legendary obtained auto-fills an empty Legendary slot (boss-kill latch in `js/core/battle.js` onWin, `checkRelicUnlock`, and the Vaultbreaker quest turn-in all go through `obtainClass`). Later ones wait in the "Unlocked Legendaries" list. | [invented] |
| R5 | `setLegendary(c, classId\|null)`: allowed only **at an Academy** (same `Game.World.getFacility(area, 'academy')` check as `buyAbility`) and never during battle (D3). No cost, no cooldown. Rejects non-obtained or non-legendary ids. Unslotting (`null`) follows the same rule. The R4 auto-fill is the one exception: it happens wherever the Legendary is obtained. | [revised] (free swap vs. archived wipe); Academy as class hub [archived: reference/manual/Classes.md — abilities bought "from the Academy"] |
| R6 | Swapping a Legendary **out** keeps its Class XP, Class Levels and bought abilities. Its passives stop applying (R3). Its class techs stay in `c.techs` (so swapping back needs no re-buy) but are **unslotted** from every `c.techSets` entry, so no dead, un-castable slot is left behind. | [invented] |
| R7 | An unslotted Legendary earns no Class XP and cannot buy Academy abilities. | [archived spirit: reference/manual/Classes.md — benefits apply "once a class is activated"] |
| R8 | Class XP is **one shared pool**: `pool = floor(battleXp × CLASS_XP_POOL_FRACTION)` (0.5, today's Primary value). It is split **evenly** over the *earning* classes: active classes that are **not yet maxed**. Each gets `floor(pool / n)`. A class is **maxed** once `classLevelsEarned ≥` the sum of `classLevelCost` over all its abilities, so it could buy everything. A maxed class drops out of the split and earns nothing more; its share goes to the others. If every active class is maxed, no class XP is awarded. `CLASS_XP_FRACTION_PRIMARY` is renamed `CLASS_XP_POOL_FRACTION`; `CLASS_XP_FRACTION_SECONDARY` is retired (D2). | [revised] |
| R8a | Maxed is about class levels **earned**, not abilities **bought**: a maxed class with unspent levels still drops out, because it already has enough to buy everything. | [invented] |
| R9 | `classXpForLevel` curve, ability costs and every ability number are **unchanged**. | — |

### 2.3 API changes (`js/core/classes.js`)

| Removed | Added | Changed |
|---|---|---|
| `activate(c, classId, slot)` | `activeClassIds(c)` | `obtainClass` — R1/R4 |
| `deactivate(c, slot)` | `setLegendary(c, classId)` — R5/R6 | `classBonus`, `isClassTechUsable`, `buyAbility`, `addClassXp` — R3/R8 |
| | `lineageOf(c)` → `[{ tier, classId\|null }]` for the UI | |
| | `isClassMaxed(c, classId)` — R8/R8a; also drives a "Mastered" badge in the UI | |

### 2.4 Save migration v11 → v12 (`js/core/save.js`)

| Step | Behaviour |
|---|---|
| M1 | For each tier 1/2/3, collect obtained classes of that tier. One → it fills `lineage.tierN`. |
| M2 | More than one at a tier (debug helpers only — the quests can't produce this): pick the one in Primary, then Secondary, then highest `classLevelsEarned`, then `js/data/classes.js` order. The others stay in `c.classes` but are never active (hidden from the UI). |
| M3 | `legendaryClass` = Primary if it is legendary, else Secondary if legendary, else the first obtained Legendary in data order, else `null`. |
| M4 | Delete `primaryClass` / `secondaryClass`. No `c.classes` entry is changed — nothing is lost or refunded. |
| M5 | Old-convergence combos (e.g. Crusader + Shadowknight, `docs/SPEC-TIER3-EXPANSION.md` §5) migrate as-is; the lineage need not match today's branching tree. |
| M6 | A class the player once deactivated still exists as a zeroed entry, so it re-enters the lineage at Class Level 1. Accepted: the old wipe already happened. |

### 2.5 UI (`js/ui/screens.js` Status → Classes tab)

Replace the Primary/Secondary boxes and "Inactive Classes" list with a **Hero Tree** panel:

| Row | Filled | Empty |
|---|---|---|
| **Calling** (Tier 1) | Class name, Class Level, XP bar; a maxed class shows **Mastered** instead of the bar | "Unlocks at level 5 — *The First Calling*" |
| **Ascension** (Tier 2) | same | "Unlocks at level 30 — *The Trials of Ascension*" |
| **Mastery** (Tier 3) | same | "Unlocks at level 60 — *The Master's Calling*" |
| **Legendary** | Slotted class + [Unslot] | "No Legendary chosen" — or, if none unlocked, "???" (no spoilers) |
| *Unlocked Legendaries* | one row each with [Set Legendary] | hidden when none unlocked |

[Set Legendary] and [Unslot] are enabled only while standing in a town with an Academy (R5);
elsewhere they are disabled with the hint "Visit an Academy to change your Legendary." The
Academy screen also shows the Legendary row with the same buttons.

Row labels are [invented], taken from the three shipped quest names. The header line
(`index.html:224`, today shows the Primary class) shows the **highest filled lineage class**,
falling back to "No calling". The wiki/class info text describing Primary/Secondary is rewritten to
match.

### 2.6 Player-facing wording

- Quest choice warning (R2): "This choice is permanent. *{Name}* will join your Hero Tree for good."
- Swap toast (R5): "*{Name}* now walks beside you as your Legendary calling."
- Mastered toast (R8): "You have mastered the *{Name}* class. Its experience now flows to your other callings."
- Unslot toast (R6): "*{Name}* rests. Its techniques have been unslotted, but nothing it taught you is forgotten."

---

## 3. Balance rationale & sim gate

**Power delta.** Every ability number stays the same, but at endgame a hero now stacks up to 4
classes' passives instead of 2. Worst cases, summed from `js/data/classes.js` (bought passives
only):

| Lineage + Legendary | Stat | Today's best 2 slots | Proposed (4 active) |
|---|---|---|---|
| Magician → Wizard → Magus + Vaultbreaker | damage_pct | 0.34 (Magus + Vaultbreaker) | **0.56** (+ Spell Power +9) |
| Warrior → Gladiator → Berserker + Vaultbreaker | damage_pct | 0.31 | **0.48** |
| Warrior → Crusader → Paladin + Vaultbreaker | armor_flat | 35 | **53** |
| Thief → Rogue → Gambit + Heir of the Echo | dodge_flat | 0.21 | **0.33** (under `DODGE_CAP` 0.5, before Dex/skill) |

Mid-game (levels 30–59) gains less: T1 adds its 3 modest abilities on top of today's T2 +
Legendary pair. T1 contributes the least power per class, so the extra slot is mostly felt at
Tier 3 + Legendary.

**Class-XP pacing.** R8 keeps **total** class XP per battle at today's Primary amount (×0.5),
which is less than today's Primary + Secondary (×0.75). It splits that amount over the classes
still learning. The locked P0 calc (`docs/SPEC-V1.6-REBALANCE.md` §6.2: T3 ~37 kills, T2 ~86,
T1 ~192 to full unlock at the full Primary rate) becomes:

| Situation | Earning classes | Each class's share | Effect on pacing |
|---|---|---|---|
| L5–29, T1 only | 1 | ×0.5 | Same as today's Primary |
| Just reached T2, T1 not mastered | 2 | ×0.25 | T2 ~2× slower until T1 masters, then full rate |
| L60, T1+T2 mastered, no Legendary | 1 (T3) | ×0.5 | T3 at today's ~37 kills |
| L60, T1+T2 mastered, + Legendary | 2 | ×0.25 | T3 and Legendary each ~2× slower |
| Worst case: 4 classes still learning | 4 | ×0.125 | Each ~4× slower until the older ones master |

The self-correcting effect is intended: older tiers master quickly against higher-level monsters,
then drop out and hand their share to the newest class. The calc (S5) has to confirm that a T1
left unmastered at L30 doesn't keep T2 at half speed for too long.

**Fallback if the sim fails (D5): buff all monsters, never nerf the classes.** Two new constants,
`BALANCE.MONSTER_HP_MULT` and `BALANCE.MONSTER_DAMAGE_MULT` [invented], default 1.0, applied on
top of the established formulas (hp = 20+12×lvl, damage = 3+2×lvl) to every regular and boss.
Tune them to the smallest values that restore the contract.
**Risk:** at L5–29 a hero has only T1 (no extra power from this change), so a global buff makes
the early game harder than today. S6 checks this. If S6 fails, come back to the user with a
band-limited buff (levels ≥ 30) as an alternative rather than shipping a broken early game.

### Sim gate (`/balance-sim`, real game code)

| # | Scenario | Metric | Must uphold |
|---|---|---|---|
| S1 | All 12 L60+ lineages, no Legendary, vs at-level regulars in each band ≥ 60 | win %, rounds-to-kill | ≥85–100% win; fights not trivial (rounds within ±25% of today's T2+T3 baseline) |
| S2 | The 4 worst-case rows above vs the band's bosses | win %, HP-left, consumables used | Prepared players win reliably **but pay** |
| S3 | L30–59: T1+T2(+each Legendary) vs today's T2+Legendary | win %, rounds | Same contract; delta reported |
| S4 | 5 levels under any band | outcome | Still certain death via Fear |
| S5 | Class-XP pacing under R8, realistic play path L5→L100 | kills to master each tier, with and without a Legendary | No class takes more than 2× its P0 kill count (~37 / ~86 / ~192); report the actual numbers |
| S6 | Only if the monster buff is applied: L5–29 T1-only heroes, and L30–59 heroes, vs buffed monsters | win %, rounds | Same contract as S1/S4; if broken, escalate to the user (see risk above) |

If S1/S2 break the contract, apply the monster buff, re-run S1–S4 and S6, and record the locked
values in this §3.

### 3.1 Sim results (2026-10-22)

**Method.** Real game code (v1.10 working copy, save v11) loaded in node `vm`, seeded mulberry32,
**300 trials per cell**. One source patch: `classBonus` / `isClassTechUsable` read a list of active
class ids, so the same engine runs today's 2-slot model and the lineage model. The fixtures are the
v1.10 P0 builds (best non-unique gear at level, all stat points spent, skills at half level, 3
potions + 3 crystals). **Every passive is bought on every active class**, the strongest case.
- **12 lineages × 3 bands** (L35 with T1+T2, L60 and L90 with T1+T2+T3). Cells: every at-level
  regular (±1 level), the band's boss (Kastengard Custodian L32, Majiku Ridge Chieftain L60,
  Society Anima Horror L90), and a true 5-levels-down regular.
- **Each cell is run 2 + 2×(Legendaries available) ways:** today (top two tiers), today + each
  Legendary, lineage, and lineage + each Legendary (Runeblade from L30, Vaultbreaker L32, Heir L40).
  The comparison is **best option today vs best option with the lineage**.
- **Limits:** class techs are not cast (passives only), and Conjurer runs without its companion.
  The monster buff scales `hp`, `hpMax` and basic `damage` only, the same fields the Champion
  multipliers touch.

| Gate | Result | Verdict |
|---|---|---|
| **S1** at-level regulars, 72 cells | **100% win** in every cell, every Legendary choice. Rounds −5% on average, at most −17% (Shadowknight L60 3.6 → 3.0) | ✅ (within ±25%) |
| **S2** bosses, 36 cells | Win 99.7–100%, unchanged. Rounds −5% on average, at most −16%. HP left on win 64–79% for 10 of 12 lineages | ✅ except the rogue line, below |
| **S2** rogue line (Gambit, Assassin) bosses | HP left on win: Gambit L60 79→**82%**, L90 76→**81%**; Assassin L60 83→**85%**, L90 81→**84%** (best today → best lineage, both with Vaultbreaker or Runeblade; ~0 consumables). Assassin **already fails** the "pay" line in the shipped game, and so do both at the L32 boss (88%, unchanged) | ❌ narrow: +3–5 points of HP left |
| **S3** L30–59 | T1+T2 equals today's T1+T2 (identical numbers). With a Legendary the extra tier 1 adds ≤0.6 rounds faster at the L32 boss | ✅ |
| **S4** 5-levels-down, 36 cells | Shipped game already wins 91–100% from L30 up (the known limitation). Lineage changes win % by at most +1.6 points (Ranger L30 91.7 → 93.3, inside the ±1.6-point standard error) and shortens fights up to 20% | ✅ not meaningfully widened |
| **S5** class-XP pacing (calc, real formulas, L1→100 at-level kills) | T1 always masters at L17, before T2 arrives, so 4 classes never share the pool on a normal path. Without a Legendary every class matches today (T1 102, T2 67–77, T3 37 kills; Conjurer 89). Worst slowdown: T2 sharing with an L30 Runeblade, 77 → 141 kills (**1.83×**, mastered L44 instead of L38). A late Legendary (L62) slows T3 37 → 54 kills. The Legendary itself masters faster than today (151 vs 160 kills) | ✅ (all < 2×) |

**D5 fallback: monster buff (gambit/assassin bosses, lineage + best Legendary, HP left on win).**

| Buff | Gambit L60 | Gambit L90 | Assassin L60 | Assassin L90 |
|---|---|---|---|---|
| none | 82% | 81% | 85% | 84% |
| damage ×1.10 | 81% | 78% | 84% | 81% |
| damage ×1.15 | 79% | 77% | 83% | 80% |
| hp ×1.10 + damage ×1.05 | 80% | 77% | 83% | 81% |
| hp ×1.10 + damage ×1.10 | 79% | 76% | 82% | 80% |
| damage ×1.30 | — | — | 80% | — |

The rogue line wins by dodging, so extra monster damage mostly misses: it takes **+30% monster
damage** to bring one cell to the line.

**S6: what a global buff does to levels 10–25** (T1-only heroes; the lineage changes nothing here):

| Cell | none | damage ×1.10 | hp ×1.10 + damage ×1.10 |
|---|---|---|---|
| Magus vs Estari Ruin Warden (L10 boss) | 88.7% | 86.0% | **72.7%** |
| Dragoon vs Estari Ruin Warden | 92.3% | 93.3% | 87.0% |
| Ranger vs Juneros Leviathan (L25 boss) | 99.7% | 97.3% | 96.7% |
| Ranger L17, 5 levels down | 74.3% | 62.0% | 36.0% |

Even a buff far too small to fix the rogue cells already costs the early casters a boss. The
5-levels-down cells improve, which the shipped game needs anyway, but that is a separate problem.
**Verdict: the D5 fallback fails S6.** Per the risk note above, this goes back to the user (D7).

### 3.2 Review re-sim of the implemented v1.11.0 (2026-10-23)

The real code of all three specs (lineage + new dodge model + Bracing), unpatched, against the
v1.10 snapshot. Same fixtures, 300 trials/cell, 12 lineages × L10/L32/L60/L90/L100 bosses, their
at-level regulars and 5-levels-down cells, each with no Legendary and each available Legendary.

| Check | v1.10 → v1.11 | Verdict |
|---|---|---|
| At-level regulars | Every option ≥ 85% (all 100% but the expected early casters) | ✅ |
| Heavy/Medium lineages, L100 boss (weakest option) | warrior lines 94.7–96.0 → **99.7–100%**, Ranger 88.7 → 99.7, Dragoon 88.3 → 99.0 | ✅ as `SPEC-NONDEX-DEFENSE` §3.1 |
| Rogue line pays (highest HP left on win, any option) | Gambit/Assassin L32 89 → **78%**, L60 79/83 → **76/77%**, L90 76/81 → **76/77%**, L100 63/68 → 61/64% | ✅ every boss ≤ 80% |
| Casters (accepted follow-up) | L10 boss 88.7 → 86.3%; L90–100 bosses 100 → 95.7–98.3% | ⚠️ as predicted, follow-up spec |
| 5 levels down (best option) | All cells within ±2 points except Ranger L30 + Runeblade 91.7 → 94.0 (+2.3, ≈1 SE of the difference). The no-Legendary options get harder (Ranger 83.3 → 70.7) | ✅ not meaningfully widened |

Side finding (not part of this spec): even with a single tier-1 class, today's shipped game wins
5-levels-down fights at L17 (Ranger 74%, Dragoon 98%). The accepted 5-down limitation (DESIGN §4)
starts well before the documented ~L50.

---

## 4. Conventions & handoff checklist

- [x] Drop tables / stock lists: not touched
- [x] Icons: none new (Hero Tree rows reuse the class icons)
- [x] Ids: `lineage`, `legendaryClass`, `activeClassIds`, `setLegendary`, `lineageOf` — camelCase, matching `js/core/classes.js`
- [x] Quest gates/chains: unchanged (`requiresBaseClass` / `requiresAdvancedClass` read *obtained*, not active)
- [ ] **Save impact: v11 → v12** — `c.lineage`, `c.legendaryClass` added; `primaryClass` / `secondaryClass` removed; migration §2.4 + tests for M1–M6 and the full v1→v12 chain; `character.js create()` initialises both fields; the `tests/test_reload.js` release guard expects the new save version to match the changelog entry
- [ ] **Tests affected:** `tests/test_p6_classes.js` (19 `activate`, 6 `deactivate`, Primary/Secondary XP-fraction cases — rewrite), `tests/test_p3_battle.js`, `tests/test_p2_inventory.js`, `tests/test_p4_world.js` (save-shape fields), `tests/test_secondary_stats.js`, `tests/test_companion.js` (use `activate` to set up a Conjurer — switch to lineage). New tests: R1–R8, migration M1–M6, Legendary swap keeps progress and unslots techs, no deactivate path exists
- [ ] **Built artifact:** `tools/herorpg_artifact.html` regenerated via `tools/build_artifact.js` (it inlines the old slot code)
- [ ] `js/balance.js`: rename `CLASS_XP_FRACTION_PRIMARY` → `CLASS_XP_POOL_FRACTION`, delete `CLASS_XP_FRACTION_SECONDARY` (D2), with [revised] citation comments; no monster multipliers (D5 fallback rejected, D7)
- [ ] `tests/test_p4_world.js` / `tests/test_secondary_stats.js`: any test that changes a Legendary must stand in an Academy town (R5)
- [ ] DESIGN.md §3 + `js/core/classes.js` header updated; wiki class text updated
- [ ] Changelog entry (draft):
  > **The Hero Tree.** Your classes now grow together. The callings you choose at levels 5, 30
  > and 60 are permanent and always active: no more Primary and Secondary slots, and no more
  > losing a class by deactivating it. Class experience is shared between the classes still
  > learning; once a class is mastered, its share goes to the others. Legendary classes get a slot
  > of their own on top, and you can swap between the ones you've unlocked at any Academy without
  > losing their progress. Existing heroes keep every class level and ability they've earned.

---

## 5. Open decisions

All resolved by the user on 2026-10-22.

| # | Question | Decision |
|---|---|---|
| **D0** | One Legendary slot vs. all unlocked Legendaries stacking | **One slot** |
| **D1** | Override the archived Primary/Secondary model, manual activation and deactivation wipe ([revised]) | **Approved** — record in DESIGN.md §3 |
| **D2** | How class XP is shared | **One shared pool (×0.5), split evenly over active classes that are not yet maxed**; a maxed class drops out of the split (R8/R8a) |
| **D3** | Where Legendary swaps are allowed | **Only at an Academy**, never in battle (R5) |
| **D4** | Swapped-out Legendary techs | **Removed from the tech bar**, kept learned (R6) |
| **D5** | Extra power from 4 active classes | **Sim first; if the contract breaks, buff all monsters** (`MONSTER_HP_MULT` / `MONSTER_DAMAGE_MULT`), never nerf classes. Early-game risk → S6 |
| **D6** | Once-deactivated classes returning at Class Level 1 in old saves | **Accepted** — no refund |

**Resolved after the sim (§3.1), user 2026-10-22:**

| # | Question | Decision |
|---|---|---|
| **D7** | The rogue line (Gambit/Assassin) leaves bosses at 81–85% HP instead of ≤80%, and a global monster buff can't fix it without breaking levels 10–25 | **Accepted for this spec (option a):** the +3–5 points of HP left ship as-is, every win/loss number holds, and the D5 monster buff is not applied. **Follow-up (option c):** the rogue line's boss cost gets its own spec, since Assassin already fails this check in the shipped game. **Done:** `docs/SPEC-ROGUE-BOSS-COST.md` + `docs/SPEC-NONDEX-DEFENSE.md` (both READY, ship together); all three specs ship in one release, lineage first |

---

## 6. Out of scope

- Naming your class from your hero tree (archived as planned work in `reference/site/homepage_2006.md`; separate spec if wanted).
- Any change to class rosters, ability numbers, costs, or the `classXpForLevel` curve.
- Respec / re-choosing a T2 or T3 class: there is deliberately no way to undo a lineage pick.
- Tier-1→2→3 offer logic (`advancedOptionsFor`, `thirdTierOptionsFor`) and the quests themselves.
- A fifth tier or a second Legendary slot.
- The rogue line's boss cost (Gambit/Assassin finishing bosses above 80% HP) — separate follow-up spec (D7).
- Any monster stat buff (the D5 fallback was simmed and rejected, §3.1).
