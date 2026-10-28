# SPEC — Monster tech power (techs carry the fight; armor counts against them at half)

**Status:** SHIPPED as v1.12.0 "The Whole Arsenal" (commit `a27ad8d`),
merged to `main` with PR 4 (`dbc83a8`) and deployed with v1.13.0 on 2026-10-28. All decisions resolved by the user 2026-10-23 (§5: D0–D4 set the
direction, D5–D7 accepted as recommended). Sim run 2026-10-23 (§3.1). Authored 2026-10-23 (user-directed: "#2", the follow-up promised
by `docs/SPEC-ROGUE-BOSS-COST.md` D7; widened by the user from bosses to every monster).
**Relationship to authority:** extends `docs/DESIGN.md` §4 (combat: monster techs, mitigation). No
archived rule is overridden. Built and simmed on v1.11.0 (`docs/SPEC-CLASS-LINEAGE.md`,
`docs/SPEC-ROGUE-BOSS-COST.md`, `docs/SPEC-NONDEX-DEFENSE.md`), branch `v1.11-hero-tree`.
Supersedes the bosses-only draft (`SPEC-BOSS-TECH-POWER`, never committed).

**The request, as directed by the user (D0–D4):**
1. Scale the techs of **every monster**, not just bosses.
2. Techs should do **the majority of boss damage**.
3. **Armor, Bracing and Block** work against techs, at **half** effectiveness.
4. If that makes fights too hard, **lower monsters' normal attacks** to compensate.

---

## 1. What is wrong today

A monster tech deals its flat `power` (`js/core/battle.js` monsterAct: `actionBase = usedTech ?
usedTech.power : monster.damage`). Powers are 10–26 (one exception, Red Moon's Judgment 240) and
never grow, while a monster's basic `damage` follows `3 + 2 × level` (plus a boss premium). Graded
techs are mitigated by **Magic Armor only**, get **full Bracing**, and can't be **Blocked**.

Share of the damage the player takes that comes from tech turns (v1.11, all 12 lineages, §3.1):

| | L10–12 | L25–35 | L60 | L90 | L100 |
|---|---|---|---|---|---|
| At-level regular monsters | 56% | 42% | 12% | 9% | 9% |
| Bosses | 49% | 15–19% | 9% | 6% | 28% (almost all Judgment) |

From L40 up, a monster's tech turn is close to a wasted turn. The archive only gives the
direction ("Enhanced spells … Strategic boss battles", `[archived: reference/site/homepage_2006.md]`),
so every number below is **[invented]**.

---

## 2. Design

### 2.1 Tech power scales with the monster

```
techPower = max(tech.power, round(F × monster.damage))
   F = MONSTER_TECH_DAMAGE_FRACTION = 1.00   (regular monsters)
   F = BOSS_TECH_DAMAGE_FRACTION    = 0.70   (bosses)
```

- `max()`: no tech ever gets weaker than today.
- `monster.damage` is read at the moment of the action, after any boss `enrage` script (one pipeline).
- **Signature tech:** Red Moon's Judgment (`mon_red_moons_judgment`, Eidas Ascendant only) gets
  `round(SIGNATURE_TECH_MULT × F × damage)`, `SIGNATURE_TECH_MULT = 1.3`, marked by a new tech field
  `signature: true` (D6). Without it, the floor (254) would overtake its own 240 and the final boss's
  nuke would hit no harder than its other techs.
- Ungraded techs (Gnawing Bite, Venomous Bite) scale the same way and keep their full physical
  mitigation.

### 2.2 Boss normal attacks are cut to compensate

```
boss basic attack = round(BOSS_BASIC_ATTACK_MULT × monster.damage),   BOSS_BASIC_ATTACK_MULT = 0.55
```

**Bosses only.** The sim showed that cutting *regular* monsters' normal attacks lowers their total
damage at mid levels and makes 5-levels-down fights easier (Ranger L30: 70.7% → 100% win at a 0.6
cut), which the contract forbids. Regular monsters don't need the cut: they stay at 100% at-level
with full normal attacks (§3.1). The boss charged release (`releasing`, × charge multiplier) is
built on the basic attack, so it shrinks by the same 0.55; a companion hit by a basic attack too.

### 2.3 Physical defenses count against graded techs at half

For a **graded** tech hitting the player (`js/core/battle.js` monsterAct):

| Defense | Today | New | Constant |
|---|---|---|---|
| Magic Armor | full | full (unchanged) | — |
| Armor (+ Rage buff) | — | **+ 0.5 × Armor**, added to Magic Armor before Fear | `TECH_PHYSICAL_DEFENSE_SHARE` 0.5 |
| Bracing | **full** | **half** (`brace × 0.5`) | same constant |
| Block | none | **half chance** (`blockChance × 0.5`) | same constant |

Note on Bracing (D5): it already applies in full to tech hits today (`docs/SPEC-NONDEX-DEFENSE.md`
§2.1), so "half effectiveness" *lowers* Bracing against techs. Armor and Block newly count. The sim
uses exactly this. Defend, the penetration floor and Fear are unchanged. One Block `rng()` roll
still happens only when the (halved) chance is above 0.

### 2.4 What it looks like (effective power before mitigation)

| Monster | Basic attack | Techs |
|---|---|---|
| Regular L12 (e.g. Gares Current Wraith, damage 27) | 27 (unchanged) | 27 each |
| Regular L35 (Vault Forsaken Archivist, 73) | 73 | Anima Lance 22 → 73, Static Arc 17 → 73 |
| Estari Ruin Warden L10 (28) | 28 → **15** | 16/15/17 → **20** |
| Foothills Matriarch L18 (51) | 51 → 28 | → 36 |
| Juneros Leviathan L25 (67) | 67 → 37 | → 47 |
| Kastengard Custodian L32 (83) | 83 → 46 | → 58 |
| Eidas' Echo L40 (128) | 128 → 70 | → 90 |
| Majiku Ridge Chieftain L60 (223) | 223 → 123 | → 156 |
| Society Anima Horror L90 (328) | 328 → 180 | → 230 |
| Eidas Ascendant L100 (363) | 363 → 200 | 254; **Judgment 330** |

---

## 3. Balance rationale & sim gate

### 3.1 Sim results (2026-10-23)

**Method.** Real v1.11.0 code (branch `v1.11-hero-tree`, incl. `main`'s 42 extra tech ranks) in
node `vm`, seeded, **300 trials per cell**, the rules above patched in at the monsterAct sites.
Fixtures as in `docs/SPEC-CLASS-LINEAGE.md` §3.1. Cells: **all 11 bosses** at their level, every
at-level regular at L12/35/60/90/100, and a true 5-levels-down regular at each of those levels —
**× all 12 lineages × (no Legendary + each available Legendary)**. Damage taken tallied by source.
Limits: class techs not cast; Conjurer without its companion. 23 variants were run; the path:

| Variant (regular F / boss F / boss basic) | Regulars worst win, tech share | Bosses worst win / max HP left / tech share | 5-down |
|---|---|---|---|
| today (v1.11) | 100%, 23% | 86.3 / 78 / 13% | — |
| 0.8 / 0.8 / 1.0 (no cut) | 100%, 52% | **51.3** / 73 / 48% | unchanged |
| 0.8 / 0.8 / 0.8 | 100%, 57% | 68.3 / 75 / 54% | **+5.7** |
| 0.6 / 0.6 / 0.6 (cut on everyone) | 100%, 57% | 89.0 / 80 / 52% | **+6.0** (Ranger L30) |
| 1.0 / 1.0 / 0.4 (cut on everyone) | 100%, 77% | 40.3 / 78 / 76% | +4.3 |
| 1.0 / 0.6 / 0.6 (boss-only cut) | 100%, 57% | 89.0 / 80 / 52% | unchanged |
| **1.0 / 0.7 / 0.55 (chosen)** | **100%, 52–72%** | **87.7 / 80 / 48–63%** | **unchanged** |
| 0.8 / 0.6 / 0.5 | 100%, 52% | 88.7 / **82** / 57% | unchanged |

Per boss, chosen variant (worst win over every lineage+option / max HP left on a win, where a win
using ≥ 1 consumable counts as paying / tech share):

| Boss | today | chosen |
|---|---|---|
| L10 Estari Ruin Warden | 86.3 / 72 / 49% | **87.7** / 76 / 57% |
| L18 Foothills Matriarch | 99.7 / 72 / 17% | 100 / 71 / **48%** |
| L25 Juneros Leviathan | 100 / 75 / 19% | 100 / 76 / 50% |
| L32 Kastengard Custodian | 100 / 78 / 15% | 100 / **80** / 51% |
| L40 Eidas' Echo | 100 / 75 / 13% | 100 / 72 / 58% |
| L50 Majiku Warlord | 100 / 72 / 10% | 100 / 67 / 59% |
| L60 Majiku Ridge Chieftain | 100 / 77 / 9% | 100 / 73 / 59% |
| L70 Ukai Deep Dweller | 100 / 76 / 7% | 100 / 72 / 60% |
| L80 Estari Warden Prime | 99.7 / 78 / 7% | 100 / 74 / 62% |
| L90 Society Anima Horror | 97.3 / 78 / 6% | 99.7 / 74 / 63% |
| L100 Eidas Ascendant, Judgment = floor | 95.7 / 64 / 28% | 97.7 / 64 / 62% |
| L100, Judgment × 1.2 / **× 1.3** / × 1.5 / × 2 | | 93.0 / **91.3** / 73.3 / 51.7 (worst: Dragoon) |

**Reading it.**
- **Techs now carry the fight:** 48–63% of boss damage (a majority at every boss but L18, which is
  at 48%), and 52–72% of regular monsters' damage. Today: 6–19% from L18 up.
- **The contract holds:** at-level regulars 100% everywhere; every boss ≥ 87.7% for the weakest
  lineage+option (today 86.3%), every boss from L18 to L90 ≥ 99.7%, and L100 at 91.3% with the
  ×1.3 Judgment (97.7% without it; worst build Dragoon);
  bosses still cost HP (max 80% left, at the line, at L32); **5-levels-down cells are unchanged**.
- **Why techs needed a much higher share than a basic attack:** graded techs still get the
  lighter mitigation (Magic Armor + half Armor) and half Bracing/Block, so per point they hurt more.
  A boss with full-strength basic attacks plus scaled techs was far too strong (0.8 / 0.8 / no cut:
  51.3%), so the boss normal attack is cut to 0.55 as the user directed.
- **Casters now do better at the top:** with half Armor counting against techs and boss basic
  attacks cut, casters go from 95.7–98.3% to 99.7–100% at L90–100; their weak spot remains the L10 boss
  (87.7%, up from 86.3%).

### Sim gate (before implementation is called done)

| # | Check | Pass line |
|---|---|---|
| G1 | Re-run this grid on the implemented code (not the patch) | Within ±2 points of the chosen column |
| G2 | Eidas Ascendant battle log | Judgment hits for its scaled 330 base; the other techs for 254 |
| G3 | Regular 5-down cells | Identical to v1.11 within noise |
| G4 | Shipped boss floors (`tests/test_p6b_content.js` Part 4, `tests/test_p3_battle.js` boss tests) | Still pass unchanged; if not, stop and report |

**Gate results (lead review, 2026-10-23):** G1 ✅ — the implemented code, unpatched, reproduces the
chosen column **exactly** on every cell (same seeds, 300 trials, all 12 lineages): bosses 87.7%
worst (L10), L100 91.3% with the ×1.3 Judgment, tech share 48–65%, regulars 100% / 52–72%.
G2 ✅ — pinned by `tests/test_p3_battle.js` Test 102 (Judgment 330, other Ascendant techs 254).
G3 ✅ — every 5-levels-down cell identical to v1.11. G4 ✅ — all 15 suites pass with the boss
floors untouched. Real-browser check of the wiki found that a browser holding a cached pre-v1.12
`battle.js` crashed the monster table; `js/ui/wiki.js` now falls back to the raw damage.

---

## 4. Conventions & handoff checklist

- [x] Drop tables, icons, quests, ids, save: not touched (**no save impact**)
- [ ] `js/balance.js`: `MONSTER_TECH_DAMAGE_FRACTION` 1.00, `BOSS_TECH_DAMAGE_FRACTION` 0.70,
  `BOSS_BASIC_ATTACK_MULT` 0.55, `SIGNATURE_TECH_MULT` 1.3, `TECH_PHYSICAL_DEFENSE_SHARE` 0.5 — each
  `[invented]` citing this spec
- [ ] `js/core/battle.js`: `monsterTechPower(monster, tech)` and `monsterBasicPower(monster)` on the
  `actionBase` line; graded mitigation + half Armor; Bracing × 0.5 and Block chance × 0.5 for graded
  techs. Both helpers exported for tests and the wiki
- [ ] `js/data/techs.js`: `signature: true` on `mon_red_moons_judgment` (comment citing this spec);
  no `power` changes
- [ ] `js/ui/wiki.js`: monster-tech rows note "Scales with the monster: at least its attack damage
  (bosses: 70%)"; the monster table's damage column for bosses shows the cut basic attack
- [ ] `docs/DESIGN.md` §4: bullets for tech scaling, the boss basic-attack cut, and half physical
  defense against graded techs; `docs/SPEC-NONDEX-DEFENSE.md` §2.1 note that Bracing is halved against
  graded techs
- [ ] **Tests (new, stubbed RNG):** a regular L35 tech uses `round(1.0 × 73)`; a boss L90 tech
  `round(0.7 × 328)` = 230 and its basic attack 180; Judgment 330 at L100; a tech whose own power is
  higher keeps it; an enrage script raises both; graded mitigation = MA + 0.5 × Armor (× Fear);
  Bracing halved and Block chance halved on graded hits, unchanged on ungraded; Block still makes no
  `rng()` call at chance 0. **Stale constants to expect:** any test pinning a monster tech's damage or
  a boss basic hit. **Behavioural boss floors must still pass unchanged**
- [ ] Changelog (draft): *"Monsters fight with their whole arsenal. Every monster's special attacks
  now grow with the monster, so the spells of the far north hurt like the far north. Bosses lean on
  their techniques more and swing less, and the red moon's judgment is the most terrible blow in the
  game. Armor, shields and braced stances now also blunt magical attacks, at half strength."*

---

## 5. Decisions

**Set by the user (2026-10-23):**

| # | Question | Decision |
|---|---|---|
| **D0** | Bosses only, or every monster | **Every monster** |
| **D1** | How strong | **Techs do the majority of boss damage** |
| **D2** | Mitigation of techs | **Armor, Bracing and Block at half effectiveness** |
| **D3** | If too hard | **Lower monsters' normal attacks** — applied to bosses only (§2.2: a regular-monster cut widens 5-levels-down fights; regulars don't need it) |
| **D4** | Release; casters | **Own release after v1.11; accept caster changes** (casters end up better at L90–100, §3.1) |

**Resolved after the sim (user accepted the recommendations, 2026-10-23):**

| # | Question | Decision |
|---|---|---|
| **D5** | Bracing already applied fully to techs; "half" lowers it against techs | **Resolved: halve it.** Simmed that way; keeps all three physical defenses consistent against techs |
| **D6** | Red Moon's Judgment: ×1.3 signature (330 vs 254), or let it equal the other techs | **Resolved: ×1.3.** Keeps the final boss's signature attack; L100 weakest build 91.3% |
| **D7** | L18 boss techs deal 48% of its damage, just under a majority | **Resolved: accept.** Raising it needs a higher boss fraction, which costs the L10 caster cell |

---

## 6. Out of scope

- Boss telegraphs / charged-hit rework for the script-only bosses (separate backlog item).
- New monster techs or changing any tech's own `power`.
- Caster compensation (open follow-up; less urgent after this spec).
