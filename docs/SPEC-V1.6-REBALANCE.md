# SPEC-V1.6-REBALANCE — rebalance & progression overhaul

Status: **SHIPPED v1.6.0 (2026-07-17)** — all five phases committed on `v1.6-rebalance` (P1
`3768a8c`, P2 `6c1beb2`, P3 `498488b`, P4 `3203ef4`, P5 release), all ten suites green, save
version 10 (no migration). Scoped 2026-07-16 from the playtest triage in
`docs/REVIEW-2026-07-16.md` (18 findings, each cited + tagged). Shipped base: v1.5.0, save
version 10.

## 0. Locked decisions (user, 2026-07-16)

1. **Scope = full v1.6** — all four areas (combat, progression, economy, content), phased.
2. **Defense = penetration floor + constant tuning (BOTH).**
3. **5-levels-down limitation = KEPT accepted.** Sim target is "do not *worsen* the current
   baseline," NOT "close it." This relaxes the P0 gate vs a contract-closing pass.

> This release deliberately re-tunes **shipped** constants per user direction — a conscious
> exception to the ratchet principle (LEAD-PLAYBOOK §0.3). User-directed shipped overrides are
> tagged `[revised]`. Every combat-math constant below is **provisional** until locked by P0.

## 1. Goals (what "fixed" means)

- A same-level regular fight is a real exchange again — **light armor no longer floors most
  hits to 1** (CB-1). Endurance is strong, not invincible.
- **Magic is a viable primary**: school level scales spell power, INT speeds magic-skill XP
  (archived), Rods are the caster's weapon (CB-2/3/4). A basic attack no longer strictly
  dominates a spell for an INT build.
- **Progression re-paced**: character + class leveling slower and steadier; *skill* leveling
  faster and actually meaningful past skill ~8 (PG-1/2/3). No forced TP surplus (PG-4).
- **Economy has friction**: gold no longer trivially buys everything; camp/tent sustain scales
  across the whole level range instead of maxing at L10 (EI-1/6). Item ladder is monotonic
  (EI-2). Quest junk stops cluttering (EI-3). No boss-gear-without-the-boss (EI-4). Shards
  trickle from early game (EI-5/7).
- **Content flow**: a second high-level hub so L61-100 isn't one mega-town (CF-1); the quest
  soft-lock trap is gone (CF-3).

## 2. Phases

Each phase is independently committable, green on all ten suites before commit. **P0 is the
mandatory sim gate — no game code for a combat-math change is written until P0 locks its
constant** (F1/E0/v1.4-P0 precedent).

| Phase | Content | Delegate? |
|---|---|---|
| **P0** | Sim gate: lock all combat-math constants + a progression calc | **Lead** (`/balance-sim`) |
| **P1** | Combat & Stats — CB-1..CB-6 | Sonnet (full brief) |
| **P2** | Progression — PG-1..PG-4 | Sonnet |
| **P3** | Economy & Items — EI-1..EI-7 | Sonnet |
| **P4** | Content & flow — CF-1..CF-3 | Sonnet |
| **P5** | Docs + release (changelog, README, save version, artifact; deploy user-gated) | Lead (`/release`) |

## 3. Proposed constants (provisional — locked by P0)

All new constants live in `js/balance.js` with a citation comment. **P0** = locked by the P0
battle sim; **calc** = locked by the P0 progression calculation; **data** = no sim needed.

### P1 — Combat & Stats
| Const / change | From → to (provisional) | Tag | Gate |
|---|---|---|---|
| `DAMAGE_PENETRATION_FLOOR` | new = **0.30** — a resolved hit deals ≥ `round(raw·FLOOR)` regardless of armor; applies **both** directions in the `max(1, raw−mitigation)` sites ([battle.js:549](../js/core/battle.js#L549),[:718](../js/core/battle.js#L718),[:977](../js/core/battle.js#L977)), *before* Defend/guard halving | `[invented]` | P0 |
| `ENDURANCE_ARMOR_RATIO` | new = **0.5** — `getArmor` uses `round(endurance·0.5)` not 1:1 ([character.js:313](../js/core/character.js#L313)) | `[revised]` | P0 |
| `INT_MAGIC_ARMOR_RATIO` | new = **0.5** — `getMagicArmor` symmetric; also trims INT overload (CB-5) ([character.js:323](../js/core/character.js#L323)) | `[revised]` | P0 |
| `MAGIC_SKILL_DAMAGE_PER_LEVEL` / `_CAP` | new = **0.015 / 0.25** — school level → +% offensive-tech power in `techEffectivePower` ([battle.js:792](../js/core/battle.js#L792)), keyed on `tech.skill` level; parallels the weapon-skill term | `[invented]` | P0 |
| `WEAPON_SKILL_DAMAGE_CAP` | **0.10 → ~0.25** (raise so skill>8 keeps paying; was cut to 0.10 for 5-down — re-verify) | `[revised]` | P0 |
| `ARMOR_SKILL_ARMOR_CAP` | **0.15 → ~0.30** | `[revised]` | P0 |
| INT → magic-skill XP | new `INT_SKILL_XP_PER_POINT` = **0.01** — magic-school + Rods skill-XP award ×(1+INT·rate) ([battle.js:1371](../js/core/battle.js#L1371)) | `[archived]` [Intelligence.md](../reference/manual/Intelligence.md) | P0/calc |
| Rod identity (`spellPower`) | new item field on Rods; while a Rod is equipped, offensive-tech base power += equipped `spellPower` in `techEffectivePower`; magnitude ~ per-tier (e.g. 4/12/24…) | `[invented]` | P0 |
| `CARRY_CAPACITY_BASE` / `_PER_STR` | new **50** / **6** — capacity = `BASE + STR·PER_STR` (was `STR·10`, no base) ([inventory.js:24](../js/core/inventory.js#L24)) | `[invented]` | calc |

### P2 — Progression
| Const / change | From → to (provisional) | Tag | Gate |
|---|---|---|---|
| `XP_TO_LEVEL` exponent | `50·(n−1)^1.8` → **`50·(n−1)^2.0`** (≈2× kills/level, still flat, no wall) — re-verify hours-to-100 vs the 40-60h target | `[revised]` | calc |
| `FURY_XP_CAP` | new = **0.25** — `furyBonus = 1+min(fury·0.01, CAP)` ([battle.js:1318](../js/core/battle.js#L1318)); precedent: Frenzied capped +40% | `[revised]` | calc |
| Class XP pacing | steepen `classXpForLevel` ([classes.js:220](../js/core/classes.js#L220)) and/or add `CLASS_XP_FRACTION_PRIMARY/SECONDARY` (<1) so a class spans ~⅓ of its tier band and higher tiers don't unlock *faster* in kills | `[revised]` | calc |
| Skill XP scaling | `SKILL_XP_PER_USE` flat 8 → **scales with monster level** (`round(monLvl·~0.6·decline·fury)`, floor 1); keep the >5-level decline (archived) | `[revised]` | calc |
| PG-4 TP surplus | primarily unblocked by faster skills (higher-rank `skillReq` becomes reachable); if surplus persists, trim `LEVELUP_TRAINING_POINTS` or add an Academy sink | `[invented]` | calc |

### P3 — Economy & Items (mostly data + economy calc)
| Change | Detail | Tag |
|---|---|---|
| EI-1 gold | `SHOP_SELL_RATE` **0.5 → 0.35**; trim the L41+ gold slope ~25%; make 1-2 best-in-slot pieces drop/AP-only; camp-tier tents become a real gold sink (EI-6) | `[revised]` |
| EI-2 ordering | re-derive L36-55 (audit through L100) armor so values are **monotonic non-decreasing by levelReq**; raise the wardweave-synthesis reqs so it isn't best-in-slot at L15 | `[revised]` |
| EI-3 quest clutter | quest_ materials drop **only while their quest is active and unsatisfied** (battle.js drop loop gains a `Game.Quests` guard); remove the extra sell/discard confirm for zero-value quest junk (or add bulk-discard) | `[invented]/[revised]` |
| EI-4 boss-forage leak | remove `quest_matriarch_horn`/`leviathan_scale`/`custodian_core_shard` from forage tables ([areas.js:339](../js/data/areas.js#L339)+). **Standing rule:** materials that gate boss-tier gear are boss-drop-only | `[revised]` |
| EI-5 shard supply | flatten `shardChance`: early floor ~0.10 from L1, soften the late near-cap ramp; optionally small quest shard rewards | `[invented]` |
| EI-6 camp/tent | rescale to a full-range ladder (lower early quality; the 0.75 tier moves to ~L60; add L25/45/65/85 tents at rising gold cost); camp heal scales with tent tier across all 100 levels | `[invented]/[revised]` |
| EI-7 Alteration tax | drop `tech_warcry_1` shardCost 5→0 (early buff free); keep only higher-rank buffs a modest shard cost; pairs with EI-5 | `[invented]` |

### P4 — Content & flow
| Change | Detail | Tag |
|---|---|---|
| CF-1 town split | add a second high-level hub (~L85, Skyspire/Red Moon region); move Band E/F shop stock + services there; Frosthold keeps C/D | `[invented]` |
| CF-2 flow/variety | falls out of the PG-1/EI-1 retune; optionally +1-2 monster types to the sparsest late zones | `[revised]` |
| CF-3 quest soft-lock | `levelCheck` no longer re-applies `levelMax` at turn-in for an already-accepted quest ([quests.js:438](../js/core/quests.js#L438)) — enforce `levelMax` at accept only | `[revised]` |

## 4. P0 sim gate (the lead's job before any P1-P4 code)

Per `/balance-sim`: node `vm` harness, seeded PRNG on `Game.Battle._rng`, drive loop from
`test_p6b_content.js`, ≥300 trials/cell.

**Battle-sim cells** (checkpoints L10/30/60/100): at-level regular, boss (prepared player),
5-levels-down. **Contract (given decision 3):**
- at-level regular **≥85%** win (target ~90-100%) at every checkpoint;
- boss **winnable-but-costly** for a prepared player (high win %, real HP/consumable cost);
- 5-down: **must not rise above the current shipped baseline** — measure baseline first, then
  confirm the P1 changes don't worsen it. (Closing it is explicitly *not* a target.)

Constants locked here: `DAMAGE_PENETRATION_FLOOR`, `ENDURANCE_ARMOR_RATIO`,
`INT_MAGIC_ARMOR_RATIO`, `MAGIC_SKILL_DAMAGE_*`, raised weapon/armor caps, Rod `spellPower`
magnitude, and the camp/tent sustain ladder (bosses stay costly, not unwinnable). Two fixtures:
the shipped "modest-geared warrior" **and** a light-armor INT caster (Rod + Firebolt), so the
magic/rod/defense changes are validated for both.

**Progression calc** (deterministic, not a battle sim): kills/level, kills-to-class-unlock
per tier, pure-combat hours-to-100 (vs the 40-60h target), and skill-level-reached-by-endgame
for a mained skill — locks the XP exponent, Fury cap, class-XP pacing, skill-XP scaling, and
carry-capacity numbers.

Sim scripts are ephemeral (scratchpad); results go into this spec (§6) and the P1/P2 commit
messages.

## 5. Save version & test plan

- **Save version: expected to stay 10.** No new *persisted character field* is planned (Rod
  `spellPower` is item data; quest-drop gating reads existing quest state; all else is
  constants/formulas/data). **Do not rename or remove existing item ids** (saved inventories
  store ids) — only add new ids and adjust stats on existing ones. If any change forces a new
  persisted field, bump to 11 with a full v1→11 migration + migration test (CLAUDE.md).
- **New/updated tests** (never weaken a behavioral assertion — update stale constants only):
  penetration-floor damage math (stubbed RNG, both directions); magic-skill→damage scaling;
  INT→magic-skill-XP; Rod spellPower effect on tech damage; carry-capacity base; XP/Fury-cap
  and class-XP pacing; camp-heal ladder; quest-drop gating (drops while active, stops after);
  boss-forage tables no longer contain boss mats; CF-3 turn-in no longer soft-locks; item-order
  monotonicity check. Update the hardcoded shop/monster/area counts the town split (CF-1) shifts.
- New ids (tents, town, any new tech/item) need `assets/icons/<id>.png`; monster icons stay
  byte-distinct (`test_icons.js`).

## 6. P0 RESULTS — LOCKED (lead sim gate, 2026-07-16)

Sims (ephemeral, scratchpad): `sim_v16_p0.js` (battle grid: baseline vs source-patched engine,
300 trials/cell, warrior + light-armor INT-caster fixtures, L10/30/60/100 × at-level/boss/5-down)
and `sim_v16_prog.js` (deterministic progression calc). Harness validated against the shipped
`eidas_echo` behaviour.

### 6.1 Locked combat constants (P1)
| Constant | LOCKED value | Notes |
|---|---|---|
| `DAMAGE_PENETRATION_FLOOR` | **0.30** | **DEFENSIVE-ONLY** — applies only monster→player (`monsterAct`), NOT player→monster. A player→monster floor let under-levelled players guarantee-chunk high-armor monsters and blew open 5-down; the feedback is entirely about the player taking too little, so the floor is one-directional. |
| `ENDURANCE_ARMOR_RATIO` | **0.9** (was 0.5) | `getArmor` uses `round(endurance·0.9)`. **RECONCILED during P1 review:** the provisional 0.5 crashed the shipped modest-fixture lair bosses (~85%→46%/31% win) — shipped boss damage was tuned against 1:1 armor, so per the ratchet the constant fits the bosses, not vice-versa. The penetration floor is the real over-defense fix; this is a mild trim. (sim: `sim_v16_reconcile.js`) |
| `INT_MAGIC_ARMOR_RATIO` | **0.9** (was 0.5) | `getMagicArmor` symmetric; keeps casters' magic defense near shipped. |
| `MAGIC_SKILL_DAMAGE_PER_LEVEL` / `_CAP` | **0.015 / 0.15** | school level → +% offensive-tech power. Kept modest — larger caps push the top-level 5-down caster cell (see 6.3). |
| `ROD_SPELL_MULT` | **0.15** | Rod equipped → offensive-tech base ×1.15 (caster identity). |
| `ROD_TECH_ENERGY_DISCOUNT` | **0.3** | Rod equipped → offensive-tech energy cost ×0.7. This is the lever that makes casting energy-competitive; 0.5 reopened mid 5-down, 0.3 keeps it lethal (≤2%). |
| Rod `damage` values | **×0.5** (data) | Rod melee halved so casting ≥ rod-melee — otherwise a caster's best play stays "swing the rod" (the CB-4/CB-3 complaint). Fear-halved at 5-down, so no 5-down effect. |
| `WEAPON_SKILL_DAMAGE_CAP` | **0.10 → 0.25** | skill>8 keeps paying; re-verified 5-down not worsened. |
| `ARMOR_SKILL_ARMOR_CAP` | **0.15 → 0.30** | ditto. |
| `INT_SKILL_XP_PER_POINT` | **0.01** | magic-school + Rods skill-XP ×(1+INT·0.01) — `[archived]` Intelligence.md. |
| `CARRY_CAPACITY_BASE` / `_PER_STR` | **50 / 6** | capacity = 50 + STR·6 (was STR·10, no base). |

### 6.2 Locked progression constants (P2/P3)
| Constant | LOCKED value | Notes |
|---|---|---|
| `XP_TO_LEVEL` exponent | **1.8 → 2.0** | 396→912 total kills to L100 (~2.3× slower), still flat, no grind wall. |
| `FURY_XP_CAP` | **0.25** | caps the previously-uncapped Fury XP bonus at +25%. |
| Class XP pacing | **curve `120·(n−1)^1.9`, primary XP ×0.5, secondary ×0.25** | tier-3 full-unlock 2.3→~37 kills; P2 may fine-tune so tiers are more even (higher tiers should not unlock faster in kills). |
| Skill XP per use | **`max(1, round(monsterLevel·0.6))`**, keep the >5-level decline | mained skill reaches useful levels by mid-game vs ~3,200 wins today. |
| Camp/tent ladder | **levelReq/quality/value:** 1/0.20/10, 10/0.35/120, 25/0.45/500, 45/0.55/1500, 65/0.65/4000, 85/0.75/9000 | 0.75 heal becomes a late-game gold sink; sustain scales with progression. |

### 6.3 Contract verification (patched grid, 300 trials)
- **At-level regular:** 100% win, both builds, at every checkpoint; HP-left now **81–95%** (was ~100%
  / floored-to-1). The defense fix makes fights a real exchange without breaking the ≥85% floor. ✔
- **Bosses:** the sim fixture over-gears (auto-best gear), so its boss cells read rosy; the **real
  boss gate is the shipped `test_p3_battle.js` boss suite** (modest fixture) — P1 must keep it green.
- **5-down:** warriors **unchanged** vs baseline (57/99/99/100 — the pre-existing documented
  limitation). Casters stay **lethal at low/mid** (0/2/0%) — *not* worsened. **Accepted nuance:** the
  top cell (L95-vs-L100) rises 28%→100%, an unavoidable consequence of making magic scale at all (an
  L95 caster's INT is enormous); it lands casters where warriors already sit and stays within the
  documented "past ~L50" limitation. Consistent with decision 3 (keep accepted); flagged to the user.
- **Magic viability (CB-3):** casting damage-per-energy rose from ~22% of a basic attack to **~parity
  at mid-game (13.9 vs 15.3 dpe) and ~67% at L100** — with spells' elemental/defense-ignore/status/
  drain upside, casting is now a genuine choice, and (rod-melee halved) rods are spell foci, not clubs.

Save version: **stays 10** (no new persisted character field; all constants/formulas/data).
