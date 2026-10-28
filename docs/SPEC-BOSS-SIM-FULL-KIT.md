# SPEC — Boss sims with the full player kit (Academy chains, shrine buffs, Limit Break, Defend) and whole-fight tool choice

**Status:** READY — D0–D7 resolved by the user 2026-10-28 (§5; D1 and D2 differ from the first
draft's recommendations). Not implemented. Authored 2026-10-28 on
branch `v1.11-hero-tree` (user-directed: "start on spec for point 1", the first item of the balance
follow-up priority list). Test tooling and a sim gate only: **no game code, combat constant or
contract changes.** Report only (the ratchet principle): failing cells go to follow-up specs.

**Relationship to authority:** measures the boss contract in `docs/SPEC-BOSS-COST-BAND.md` §2 (as
amended by `docs/SPEC-BOSS-COST-RETUNE.md` D0/D6) on the prepared fixture of
`docs/SPEC-BOSS-SIM-TECHS.md` §2. It extends that fixture; it does not change the contract.
Closes or decides:

| Follow-up | Source | Here |
|---|---|---|
| F4: limit breaks, Defend, shrine buffs not modelled | `docs/SPEC-BOSS-SIM-TECHS.md` §5 | §2.1 |
| F4: boss grid with Academy chains | `docs/SPEC-MELEE-CLASS-TECHS.md` §6 | §2.1 |
| P1: `techs` policy ranks damage techs by opening hit, casts any buff not running | `docs/SPEC-COMPANION-BOSS-COST.md` §6 | §2.2–2.3 |
| P2: companion HP lost isn't a boss cost | `docs/SPEC-COMPANION-BOSS-COST.md` §6 | D5 |
| v1.9 review item 3: the +4 companion cliff, not re-measured since the companion retunes | `CLAUDE.md` v1.9 section | §2.5 |

**Interpretation of the request (D0, confirmed by the user):** "accurate" means the grid models
**what a prepared player brings to a boss and plays sensibly**: every Academy rank their trained
skills allow, the shrine buffs they can afford, Defend against a telegraphed charge — and a policy
that only uses a tool when it makes the whole fight cheaper. It does **not** mean optimal play (a
search for the cheapest possible action sequence). Limit Breaks are reported, not judged (D2).

---

## 1. Problem

The boss grid (`docs/SPEC-BOSS-SIM-TECHS.md` §3, re-run in `docs/SPEC-MELEE-CLASS-TECHS.md` §7 and
`docs/SPEC-COMPANION-BOSS-COST.md` §3) reports **all 132 boss × lineage cells pass**. But its
prepared hero only knows class techs (plus every Firebolt rank, for casters). A real hero at L60
also has Cleave V (×2.9), Impale V, Vital Strike V, Starspark / Tidal Lance, armor-skill stances
and the shrine. The grid can't see any of it, so its "pass" is an upper bound on what bosses cost.

**Sizing probe (2026-10-28, scratch copy of `tests/boss_fixture.js`, 100 seeded trials per cell,
no Legendary, ceiling shrine package of 10 buffs, Fury 5).** HP spent per win % / win %:

| Cell | `techs` today | + Academy chains, today's policy | + Academy + shrine + Limit Break, today's policy | Same full kit, whole-fight tool choice (§2.3 prototype) | Techs kept |
|---|---|---|---|---|---|
| Paladin L60 | 68 / 100 | 110 / 100 | 83 / 100 | **34** / 100 | Cleave V |
| Paladin L100 | 75 / 100 | 170 / 100 | 128 / 100 | 52 / 100 | Cleave VII |
| Gambit L60 | 68 / 100 | 102 / 100 | 76 / 100 | **33** / 100 | Vital Strike V |
| Gambit L100 | 90 / 100 | 144 / 100 | 107 / 100 | 61 / 100 | none (shrine + LB only) |
| Dragoon L60 | 95 / 100 | 139 / 100 | 109 / 100 | 49 / 100 | Impale V |
| Dragoon L100 | 113 / 100 | 245 / 97 | 160 / 100 | 80 / 100 | Impale VII |
| Magus L60 | 63 / 100 | 350 / **24** | 362 / **44** | 61 / 100 | Tidal Lance V |
| Magus L100 | 98 / 100 | 358 / **38** | 360 / **59** | 88 / 100 | none (Firebolt only) |

Two findings drive this spec:
1. **Today's policy can't take more tools.** It casts every buff that isn't running and every
   damage tech that out-hits the basic action on the opening exchange, whatever it costs over the
   fight. Given the Academy kit, every build gets *worse*, and the Magus collapses to 24–59% wins.
   So the policy fix (P1) is a precondition for modelling the kit, not a side item.
2. **With a sane policy, the kit cuts boss cost a lot.** Paladin and Gambit at L60 land at 33–34%,
   just under the 35% band floor — **the live contract is probably already broken** for melee
   heroes who use their Academy weapon chain. The probe is small (100 trials, one option) and used
   assumptions the decisions then softened: all 10 shrine buffs and a Limit Break. The judged kit
   (D1 shard budget, no Limit Break) will cost more than the probe's last column; §3 is the real
   gate.

## 2. Design — the fixture (`tests/boss_fixture.js`)

### 2.1 The kit

`build(Game, level, opts)` gains `opts.kit` (default off, so every existing caller is unchanged):

| Tool | How the fixture models it | Tag / source | Decision |
|---|---|---|---|
| **Academy chains** | For each skill the archetype trains (`ARCHETYPES[*].skills`, + Conjuration with a pact), learn the **highest rank of every non-class chain** with `skillReq ≤` the skill's half level, and slot it. Firebolt keeps today's every-rank handling. Debuff chains (Sunder Guard, Crippling Thrust, Grave Wound, Curse) included. Every rank must be taught by an Academy at or below the hero's level: assert `Game.World.academyForTech` resolves to a town whose `minLevel ≤ level` (`BALANCE.ACADEMY_SKILLREQ_CAP`). | Chains [invented] (`js/data/techs.js`); 2 Training Points per level [archived: reference/manual/Level_Up.md] | D4 (Training Point budget), D7 (which skills) |
| **Shrine buffs** | `c.shrineBuffs` set to the package bought with the level's shard budget (§2.6), `battlesLeft` high enough to outlast the fight. Different buffs stack; the same buff doesn't (`Game.World.buyBuff`). The Eldor-only facility check is a UI gate, skipped like the Academy one today. | Shrine concept [archived: reference/manual/Anima_Shards.md]; buff list [invented] (`js/data/shrine.js`); budget [invented] (§2.6) | D1 |
| **Limit Break** | **Not in the judged kit** (D2). A sensitivity run only: `c.fury = BALANCE.LB_FURY_MIN` (5) before the fight, and the class line's Limit Break (Rage / Dragon Kick / Hurricane Blow) fires on the first turn (§3 report item 3). | Fury meter [archived: reference/manual/Recent_Updates.md, 2007-08-11]; Limit Break names [archived: reference/forum/t-796.md]; ×2.0 [invented, LOCKED `docs/SPEC-V1.4-GAMEPLAY.md` P0] | D2 |
| **Defend** | A tool: Defend when the boss has a telegraphed charge pending (`battle.charge`). Only the L18 (telegraph), L25 (enrage) and L32 (telegraph) bosses wind up; the 8 script-only bosses never do, so Defend is a no-op there. | Defend [invented, user-directed] (`BALANCE.DEFEND_*`) | D3 |

`classOptions` is unchanged: the kit sits on top of every lineage × Legendary × pact option.

### 2.2 The `kit` policy

A third policy next to `basic` and `techs`. `basic` and `techs` stay **exactly** as they are (the
in-repo regression cells and every earlier grid depend on them). Each turn, in order:
1. Crystal before the next action would empty the Energy pool (as today).
2. Below 40% HP: a kept heal tech that heals at least as much as the heal item, else the heal item.
3. Re-bind a fallen companion (Conjurer).
4. Limit Break — **only in the D2 sensitivity run**: if unused this battle.
5. Defend, if kept and `battle.charge` is pending.
6. A kept buff that isn't running.
7. A kept debuff that isn't on the boss.
8. The strongest kept damage tech (opening-hit probe order, as today), if affordable.
9. The basic action.

"Kept" is the per-cell result of §2.3. Steps 4–7 are the only new branches.

### 2.3 Whole-fight tool choice (closes P1)

Before a cell's trials, choose the tools once, by **backward elimination on whole fights**:
1. Start with every tool the build has: class techs, Academy techs, Defend.
2. Score the kit on 30 seeded whole fights (seeds 90000+, separate from the damage probe's 50000+
   and the trial seeds): win rate first, then mean HP spent per win.
3. Try removing each tool in a fixed order: buffs, debuffs, damage techs from the weakest probe
   value up, heal techs, Defend. Keep a removal if the score doesn't get worse
   (equal win rate and HP spent ≤ current counts as not worse, so ties favour the smaller kit).
4. One pass. The kept set feeds §2.2; `simulate` returns it as `kit` for the report.

Why this shape: it asks the player's question, "does this tool make *this* fight cheaper?", and
needs no per-tool heuristics. The prototype (§1, techs only; it kept shrine and Limit Break fixed)
dropped 7 of 8 techs for the Paladin and 14–17 for the Magus, and every pruned kit was cheaper than
both `techs` and the naive kit. Cost: about (tools + 1) × 30
extra fights per cell, roughly 250–550 per cell, against 300 for the trials (D6).

Shrine buffs are not in the elimination: they are passive, cost no turn and can only help.

### 2.4 Metrics

Unchanged: win rate, HP spent per win, consumables, HP left, rounds, casts. New in the `simulate`
result:

| Field | Meaning |
|---|---|
| `kit` | Tool ids kept by §2.3 |
| `companionHpLost` | Mean companion HP lost per win / companion max HP (Conjurer only); D5 decides whether it enters the verdict |
| `tpSpent` / `tpBudget` | Training Points the kept Academy ranks cost (whole chain up to the kept rank) vs `2 × (level − 1)`; D4 |
| `shardBudget` / `shrine` | The level's shard budget and the buffs it bought (§2.6) |
| `defends` | Defends per win |

### 2.5 The +4 companion cliff cell (v1.9 review item 3)

The original measurement (`CLAUDE.md` v1.9 item 3) gave a companion to the shipped L40 warrior
fixture. Companions are now the Conjurer's alone (pacts open at T3, L60), and PR #5 retuned all four
(`docs/SPEC-WATER-PACT-COST.md`, `docs/SPEC-COMPANION-BOSS-COST.md`). Re-measure on the real owner:
- Conjurer at L60 and L80, each pact and no companion, `basic` and `kit` policies.
- Against a regular monster (non-boss, non-champion) at exactly level +4 and +5; if a level has
  none, the nearest level above it. The implementer lists the monster ids used.
- 300 seeded trials per cell. Report win rate and HP spent. The contract here is the
  5-levels-down rule ("certain death via Fear", `docs/DESIGN.md` §4): +5 must stay at ~0% for every
  pact. +4 has no contract number; report the jump from no companion to each pact.

### 2.6 The shard budget (D1)

A hero spends on shrine buffs what they earned **since the previous boss** (D1). The fixture computes
the budget from game data, so it follows any later change to XP or drop rates:

`shardBudget(level) = floor( Σ_{l = prev .. level−1} kills(l) × chance(l) )`, where
- `prev` is the previous boss's level (1 for the L10 boss);
- `kills(l) = (XP_TO_LEVEL(l+1) − XP_TO_LEVEL(l)) / mean xp` of the regular monsters (non-boss,
  non-champion) within ±2 levels of `l` — the at-level hunting it takes to level up;
- `chance(l)` = their mean `max(BALANCE.SHARD_CHANCE_FLOOR, shardChance)`, the shipped drop roll
  (`js/core/battle.js` onWin).

[invented] estimate. It ignores quest XP (fewer kills, so fewer shards) and champions (a guaranteed
shard each); the two pull in opposite directions. Values on today's data (2026-10-28):

| Boss | L10 | L18 | L25 | L32 | L40 | L50 | L60 | L70 | L80 | L90 | L100 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Budget (shards) | 5 | 8 | 9 | 13 | 18 | 38 | 57 | 77 | 91 | 93 | 93 |

**Buying, a fixed priority list (D1):** go through the effects in this order — offense (`damage`;
casters `spellPower`), `armor`, `dodge`, `magicArmor`, `critChance`, `critDamage`, `accuracy`,
`armorPen`, `block` (only with a shield) — and for each, buy the strongest buff of that effect whose
`shardCost` fits what's left. One pass. Example: at L60 (57 shards) a warrior buys Berserker's Wrath
(+7 Damage, 50) and has 7 left, too few for any armor buff; at L10 (5 shards) no buff fits. Shrine
buffs are passive, so they sit outside §2.3's tool choice.

## 3. Sim gate

**Method.** Real game code in node `vm`, unpatched. Seeded mulberry32, 300 trials per cell. 11
bosses × 12 lineages × every class option × three policies (`basic`, `techs`, `kit`) — 1,404
cells, about 420,000 trial fights plus the §2.3 choice fights. Scripts in the session scratchpad
(the repo's sim convention); the fixture changes are in the repo, so the grid can be re-run.

**Judging** (same as `docs/SPEC-BOSS-SIM-TECHS.md` §3): per boss × lineage, B1 on the weakest option,
B2/B2f on the cheapest, B3 on the most expensive; a player picks the policy per option, so the
verdict takes the player's best of the three. Report:
1. The grid table (cheapest HP spent / weakest win %), with the kept kit per failing cell.
2. A delta table: `kit` vs `techs`, cheapest option, per boss × lineage.
3. The D2 sensitivity column: the cheapest option re-run with a Limit Break ready (Fury 5, fired
   on the first turn), and the cells it would tip under the floor. Not part of the verdict.
4. TP-over-budget cells (D4), companion HP lost (D5), and the shrine buffs each level's budget
   bought (§2.6).
5. The §2.5 cliff table.

**Report only.** No constant changes in this spec. Failing cells become one follow-up spec, which
decides the fix (boss stats, tech power, or the Academy weapon chains themselves) under its own
sim gate.

**Regression gate for the fixture itself:** with `opts.kit` off, `basic` and `techs` give identical
fights to the current fixture on the same seeds (the check `docs/SPEC-BOSS-SIM-TECHS.md` §2 ran on
440 seeded fights; re-run it on the same set).

## 4. Conventions & handoff checklist

- [ ] `tests/boss_fixture.js`: `opts.kit` build, `kit` policy (§2.2), tool choice (§2.3), new metrics
  (§2.4). `basic` / `techs` unchanged (seeded equality check).
- [ ] New in-repo cell, `tests/test_p3_battle.js`: Paladin L60 with the kit, 30 trials — wins ≥ 85%,
  B3 holds, the kept kit includes a Cleave rank. **B2 not asserted** (report only, as the Conjurer
  cell in `docs/SPEC-BOSS-SIM-TECHS.md` §4 was); the test logs HP spent.
- [ ] Every existing boss test keeps the default build and policy, results unchanged.
- [ ] Drop tables / stock lists: n/a. Icons: none. Ids: none new.
- [ ] Save impact: none (tooling only).
- [ ] Changelog: none (no player-facing change).
- [ ] All 16 suites green.

## 5. Decisions

All resolved by the user on 2026-10-28.

| # | Question | Decision |
|---|---|---|
| **D0** | Model a prepared player playing sensibly (§2.3), or an optimizer that finds the cheapest possible play | **Prepared player playing sensibly** (as recommended). The contract is about what players pay |
| **D1** | Shrine buffs: none, a fixed 3-buff package (120–150 shards), the 10-buff ceiling (315), or a level-scaled budget | **Level-scaled budget** (the first draft recommended the fixed package): the shards earned since the previous boss, spent down a fixed priority list (§2.6). Shrine buffs barely matter before L40 (budget ≤ 18 shards) and buy about one strong buff from L50 |
| **D2** | Assume a Limit Break is ready (Fury streak ≥ 5) at every boss, or not | **No** (the first draft recommended yes). Limit Breaks stay out of the verdict and are reported as a sensitivity column (§3 item 3) |
| **D3** | Defend only against a telegraphed charge, or also below a fixed HP line | **Charge only** (as recommended). Matters at L18/L25/L32 only |
| **D4** | Training Points: learn every rank the skills allow, or enforce 2 × (level − 1) TP. Melee fits (warrior 84 of 118 TP at L60, 146 of 198 at L100); casters don't (137 of 118, 243 of 198) | **Learn every rank, report `tpSpent`** (as recommended); flag cells where the kept kit goes over budget |
| **D5** | Companion HP lost: not counted, counted into HP spent with a weight, or a separate column | **Separate column, not in the verdict** (as recommended). Revisit if it's large |
| **D6** | Tool choice: one-pass backward elimination on 30 fights, forward greedy, or exhaustive subsets | **One-pass backward elimination, 30 fights** (as recommended; not changed by the other decisions) |
| **D7** | Academy chains only for the skills the fixture trains, or also side skills (Alteration, Abjuration, Absorption, Hand to Hand, Thievery) | **Trained skills only** (as recommended). Casters still gain Starspark and Tidal Lance, which answers the boss half of the owed PR #1 caster-damage sim (priority step 3) |

## 6. Out of scope

- Any fix for failing cells (boss stats, tech power, Academy chain numbers) — the follow-up spec.
- The L10 5-levels-down hole from Academy rank-I weapon techs (`docs/SPEC-MELEE-CLASS-TECHS.md` F2;
  priority step 2).
- PR #1's caster damage on all 88 monsters, and its missing spec (priority step 3).
- Caster compensation (step 4), Radiant Smite on melee builds (step 6).
- Changing the contract's numbers or the prepared-fixture definition beyond adding the kit.
