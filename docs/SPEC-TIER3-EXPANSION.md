# SPEC — Tier-3 Expansion (branching: two options per Tier-2 class at level 60)

**Status:** SHIPPED in v1.5.0 (2026-07-13, branch `v1.5`, T0–T3 as P4–P5 of the v1.5 cycle) — D0–D5
resolved (12-total branching; Shadowknight→Gladiator/Magus→Wizard/Gambit→Rogue re-home; archived
names incl. the summon-based Conjurer; single auto-weakness summon tech; no new classBonus effect
kind needed). P5 sim results LOCKED in §6 (servitorPower 14→50; Warden 12/48; Cleric 42). Authored
2026-07-12 (user-directed).
**Owner model:** lead (Opus) scopes/reviews + owns the balance-sanity sim; Sonnet subagents
implement the data + plumbing with a full up-front brief (CLAUDE.md cardinal rule 4).
**Relationship to authority:** **[revised]** — overrides the v1.2 "branch **convergence**" pinned
decision (docs/SPEC-V1.2.md Phase 2; classes.js §"THIRD TIER") in favour of **branching**. Update
DESIGN.md §3 and the classes.js header when it ships.

**Interpretation of the request (confirm — see D0):** "each Tier-2 class has two options to choose
at level 60" → **each of the 6 Tier-2 classes branches into a choice of 2 Tier-3 classes = 12
Tier-3 classes total.** This makes every tier a symmetric "choose 1 of 2," mirroring the existing
Tier-1→Tier-2 "Trials of Ascension" pattern. (The alternative — *two additional* options on top of
today's convergence, i.e. 3 per Tier-2 = 18 — is D0 if that's what you meant.)

---

## 1. What changes

Today (convergence): the 3 Tier-3 classes each hang off a **Tier-1 line** and converge from *either*
Tier-2 sibling —
- Warrior (Gladiator OR Crusader) → **Shadowknight**
- Magician (Wizard OR Sage) → **Magus**
- Thief (Rogue OR Mercenary) → **Gambit**

Proposed (branching): each **Tier-2 class** gets its own **two** Tier-3 options, chosen at level 60
via the existing "The Master's Calling" quest. The 3 shipped classes are preserved and **re-homed**
under one specific Tier-2 parent; 9 new classes fill the rest. Net: **12 Tier-3 classes**, and the
total roster grows 15 → **24** (3 base + 6 advanced + 12 third + 3 legendary).

---

## 2. Proposed roster (all names archived; mechanics invented)

Sourcing (cardinal rule 2): every name below is drawn from the archived 2004 "Create-A-Class" thread
(`forum/t-449.md`) — **accepted** by the dev, **proposed** in-thread, or **referenced** in an
accepted class's text — plus the two shipped names from `homepage_2006.md`. No invented names.

| Tier-2 (role) | Option A | Option B | Archive source |
|---|---|---|---|
| **Gladiator** (offense) | **Shadowknight** *(shipped)* | **Berserker** | Shadowknight accepted (t-449) + homepage_2006; "Beserker: a brutal warrior, very strong" proposed (t-449) |
| **Crusader** (defense) | **Paladin** | **Warden** | Paladin referenced in Shadowknight's accepted desc ("the opposite of a paladin", t-449); "Warden: powerful defensive mage, adept at creating barriers" proposed, dev "will consider" (t-449) |
| **Wizard** (spell damage) | **Magus** *(shipped)* | **Conjurer** *(summon-based — §3a)* | Magus homepage_2006 + t-787; **Conjurer** derives from the archived **Conjuration** skill (`Skills.md`), which DESIGN §3 already defines as "summoned/DoT effects" — see §3a |
| **Sage** (healing/support) | **Cleric** | **Seer** | Both in the dev's own suggested caster-name list (t-449: "…Channeler, **Cleric**, Enchanter, **Seer**, Adept, Mystic, Priest…") |
| **Rogue** (crits/dodge) | **Gambit** *(shipped)* | **Assassin** | Gambit homepage_2006; "Assassin: cunning hero, adept at stealing and assassination" proposed (t-449) |
| **Mercenary** (versatility) | **Ranger** | **Dragoon** | Both **accepted** by the dev (t-449: "Ranger (formerly Hunter)"; "Dragoon (formerly Dragon Knight)") |

**Re-homing the 3 shipped classes** (D1): Shadowknight → **Gladiator** (dark bruiser fits offense),
Magus → **Wizard** (pure-Anima nuker fits spell-damage), Gambit → **Rogue** (luck/dodge fits
crit/dodge). Their existing abilities are unchanged.

---

## 3. Class identity (so the two options per Tier-2 don't overlap)

Each new class = **3 abilities (2 passive + 1 signature `classOnly` tech)**, tuned within the
**existing Tier-3 power band** (Shadowknight/Magus/Gambit already define it: `damage_pct` 0.13–0.19,
`magic_armor_flat` 12, `energy_max_flat` 36, `gold_pct` 0.12, `dodge_flat` 0.10), i.e. ~+20% over the
parent Tier-2 per effect, ≤+25% discipline. The two options within a Tier-2 lean into **different
effects** so the choice is real:

- **Gladiator** → Shadowknight (damage + magic-armor, dark tech) **vs.** Berserker (glass cannon:
  top-of-band damage + double-attack, **no** defensive passive; a high-risk frenzy tech).
- **Crusader** → Paladin (offense-leaning holy: armor + damage + a smite/self-heal tech) **vs.**
  Warden (anti-magic wall: max magic-armor + HP + a barrier tech).
- **Wizard** → Magus (uncategorised-Anima **burst** nuker: damage + energy, one big hit) **vs.**
  **Conjurer** (**summon-based sustained** elemental damage — §3a). The two split Wizard's "spell
  damage" role cleanly into *burst* (Magus, best for quick kills) vs. *sustained pet-DoT* (Conjurer,
  best for long boss fights) — a real playstyle choice, not two flavours of the same nuke.
- **Sage** → Cleric (restoration: HP + energy + a greater-heal tech) **vs.** Seer (foresight/support:
  dodge + energy + a buff/foresight tech).
- **Rogue** → Gambit (luck/gamble: gold + dodge, dice tech) **vs.** Assassin (burst: damage +
  double-attack + a lethal-strike tech).
- **Mercenary** → Ranger (skirmisher: damage + dodge + gold, ranged-volley tech) **vs.** Dragoon
  (heavy hybrid: damage + armor + HP, leaping-strike tech).

Exact per-ability numbers are locked in phase T0 within the band above; passive effects reuse the
existing `classBonus` vocabulary (`damage_pct`/`armor_flat`/`magic_armor_flat`/`dodge_flat`/
`energy_max_flat`/`hp_max_flat`/`gold_pct`/`double_attack_flat`) — **no new effect kinds**. **One
exception:** the **Conjurer** (§3a) is the single class here that needs a small new *battle*
mechanic (its summoned elemental) — every other new class is pure data. Its two passives still use
the existing `classBonus` vocabulary; only its signature tech introduces new behaviour.

### 3a. The Conjurer's summon — "Elemental Servitor" (invented, 1v1-safe) — **SUPERSEDED v1.9**

> **[SUPERSEDED] v1.9 (`docs/SPEC-COMPANION-SYSTEM.md`, D0 APPROVED 2026-07-22):** the "hard
> constraint" this section describes below is no longer absolute — it has been deliberately
> overridden for the Conjurer's companion system, which is now a genuine second combatant (its
> own HP, an automatic action each round, and it can be targeted). `tech_summon_elemental` and the
> "Elemental Servitor" design described in this section were RETIRED and replaced by four
> per-element Bind techs + companion kinds. This section is kept below verbatim as the historical
> record of the ORIGINAL (v1.5 P4) design; it no longer describes the shipped Conjurer — see
> `docs/SPEC-COMPANION-SYSTEM.md` for the current system.

**The hard constraint (historical, as of v1.5 P4 — see the superseded-notice above):** the battle
engine is strictly **1v1** and the original developer explicitly rejected summons-as-a-second-
combatant (*"there won't be summons in battle. It's just 1v1"* — `forum/t-449.md`). So the
Conjurer's "summon" is **not** a second combatant with its own HP/turn/targeting — it is a
**persistent battle-transient damage rider**, reusing the existing DoT/status-tick pipeline (the
same machinery as Poison — `BALANCE.POISON_*`, `tickPlayerStatuses`, buff durations).


**How it plays:**
- The Conjurer's signature `classOnly` tech is **Summon Elemental** — a new tech `effect: 'summon'`
  carrying `{ grade, servitorPower, turns }`. Casting it costs Energy **once** and places an
  **Elemental Servitor** on the battle object (`battle.servitor = { grade, power, turnsLeft }`) —
  transient state, exactly like `battle` itself; never persisted, wiped on battle end/flee/reload.
- **Each round thereafter, the servitor automatically strikes the enemy** for elemental damage of its
  `grade`, scaled by the caster's Intelligence (the spell factor, via the existing
  `techEffectivePower`-style path) and mitigated by the enemy's **Magic Armor + that grade's
  resistance** — so it interacts with the archived Anima-grade resistance system. The tick fires in
  the round-resolution step next to the existing status ticks. The servitor has **no HP, cannot be
  targeted, and never takes the enemy's turn** — the enemy still only ever faces the player. 1v1 is
  preserved.
- The point of the class: **pay Energy once, then get free recurring elemental damage** while you
  spend your own turns on other actions (attack, defend, another spell). That is the summoner's
  identity — action economy, not raw burst.
- **One servitor at a time** (re-summoning replaces it). Grade is chosen at cast (Fire/Water/Wind/
  Earth variants of the tech, or a single tech that picks the enemy's-weakness grade — D-below), so
  the Conjurer plays the archived "align to the enemy's weakness" game.

**Passives (support the summon, still plain `classBonus`):**
- one that **empowers the servitor** — modelled as `energy_max_flat` (deeper well to keep re-summoning)
  or a small `damage_pct` (the servitor's ticks read the player's damage scalars); pick in T0 so the
  servitor benefits without a new effect kind, OR add ONE narrow new effect `summon_power_pct` if the
  sim shows the plain scalars don't give the class enough identity (kept generic in `classBonus`, one
  guarded read in the servitor tick — mirrors how `gold_pct`/`double_attack_flat` were added in v1.1).
- one defensive/utility passive from the standard band (`magic_armor_flat` or `energy_max_flat`).

**Balance identity & the sim (this is the class that most needs `/balance-sim`):**
- Recurring damage rewards **long** fights and is weak in **short** ones — the deliberate inverse of
  Magus's burst. Tune `servitorPower` + `turns` so total damage-per-summon and damage-per-Energy over
  a *representative boss fight* land inside the Tier-3 band next to Magus's nuke — **strong vs.
  bosses is the intended niche**, but it must not trivialise a long fight (cap `turns`, or decay the
  tick, so an endless boss doesn't become a free win). Sim at L60/80/100 vs. both a regular and a
  boss; report damage-per-Energy vs. Magus.
- **Guardrail:** the servitor's per-turn damage must route through the same variance/grade-resistance/
  Magic-Armor mitigation every other hit uses — no unmitigated "true" tick (that would break the
  over-armoring/contract discipline).

**Save impact: still none.** `battle.servitor` is transient like all battle state; the class + tech
are data; the tick is code. No new character field, no version bump.

---

## 4. Plumbing (reuses the existing tier machinery — small, surgical)

The Tier-1→Tier-2 branching already works exactly this way; Tier-3 just needs to key off Tier-2
instead of Tier-1:

- **Data:** each Tier-3 class's `baseClass` becomes a **Tier-2 id** (e.g. `shadowknight.baseClass =
  'gladiator'`), not a Tier-1 id. New classes appended to `js/data/classes.js`; new `classOnly` techs
  appended to `js/data/techs.js`.
- **Resolution:** add `advancedClassIdsObtained(c)` to `js/core/classes.js` (a mirror of the existing
  `baseClassIdsObtained`, but `tier === 2`), and change `thirdTierOptionsFor(c)` to return Tier-3
  classes whose `baseClass ∈ advancedClassIdsObtained(c)` — a one-function change mirroring
  `advancedOptionsFor(c)` exactly, one tier up.
- **Quest:** **no data change.** "The Master's Calling" (`masters_calling`) already resolves its
  `classChoice: 'tier3'` sentinel through `thirdTierOptionsFor(c)` (screens.js:1893, quests.js:417),
  and the UI already renders a variable-length option list — so it now simply offers the 2 options of
  whichever Tier-2 class the hero holds (or the union, if they somehow hold several). The
  `requiresAdvancedClass` accept-gate is unchanged.

---

## 5. Save / migration

- **No save-version bump.** New classes and techs are pure data; `thirdTierOptionsFor` is code; the
  quest sentinel is unchanged. No new persisted character field (`c.classes` only ever holds obtained
  ids). This mirrors the level-arc content additions, which shipped with no save change.
- **Legacy states are preserved and harmless.** A pre-existing save may hold an "impossible"
  combination under the new rules (e.g. a **Crusader** who obtained **Shadowknight** back when it
  converged from either Warrior sibling). Obtaining is permanent and `classBonus`/activation never
  read `baseClass`, so that character keeps Shadowknight fully functional; only the *offer* logic
  changes going forward. Document this as accepted [revised] behaviour — do **not** write a migration
  that strips or re-keys anything.
- The full v1→current migration-chain test still runs green (no new step), but re-run it to confirm
  the legacy-combo load path.

---

## 6. Balance & sim gate

For the 11 data-only classes this adds **options, not a new power band**, so the gate is a
**sanity sim**, not a full re-derive. The **Conjurer is the exception** — its summon is genuinely new
combat math and needs a real sim of its own (§3a). Both are covered below:
- Confirm every new Tier-3 class sits inside the established Tier-3 envelope (§3) and none exceeds the
  strongest shipped Tier-3 combo. Special attention to **Berserker** (glass cannon): its top-of-band
  damage must be paid for with the missing defensive passive — sim its survivability so it's a
  high-risk/high-reward pick, not a strict upgrade.
- **Two-slot combos:** re-check that the best new Primary+Secondary pairings (e.g. Berserker +
  a Legendary, or Assassin + Gambit) don't exceed the difficulty-contract ceiling the shipped roster
  already respects. Use `/balance-sim` at L60/80/100.
- No change to the boss/at-level difficulty contract is expected; the sim's job is to prove that.

### P5 SIM RESULTS — LOCKED 2026-07-13 (`/balance-sim`, N=300, L70 fixtures, seeded)

- **Servitor retuned 14→50** (`tech_summon_elemental.servitorPower`). The provisional 14 (naive
  "5 ticks ≈ one Reckoning" pre-mitigation math) floored at ~1 dmg/tick — flat Magic Armor per tick
  punishes multi-hit (L70 Int-build: eff(14)=54 vs boss MA 56; scaling is eff ≈ P×(1+Int/50)). At 50,
  each tick ≈55–60% of a Magus Reckoning post-mitigation. **Result:** at-level Conjurer 3.0 rounds vs
  Magus 3.5 (both 100%); vs a Light-weak/Dark-resistant boss Conjurer 98.3%/6.7 rounds/1.2 consumables
  vs Magus 93.3%/10.9/2.8 — the auto-weakness niche working (a Star-resistant boss flips it); baseline
  classless mage 54.7% on the same boss, so capstones help without making bosses free (real cost:
  ~50% HP + consumables). energyCost 35 / turns 5 unchanged.
- **Band retunes (tier ordering):** Warden `magic_armor_flat` 16→**12** (+20%, the Tier-3 ceiling,
  = Shadowknight's Dragon's Fire), Warden `hp_max_flat` 55→**48** (+20% over Iron Vitality 40; stays
  below the Legendary Heir's 50), Cleric `hp_max_flat` 55→**42** (+20% over Vital Reserves 35).
  The provisional 55s would have out-HP'd a Legendary — wrong tier ordering.
- **Berserker (attack-only passives):** at-level vs a telegraph monster **98.7%** (floor 85%), faster
  than classless (6.9 vs 9.3 rounds); vs the boss 20.7% for a bare auto-attacker — the glass-cannon
  risk is real (high-risk/high-reward, not a strict upgrade); the suite's canonical prepared-fixture
  boss floors stay green.
- Sim-policy note for future reads: warrior-line class techs are Int-scaled (`techEffectivePower`)
  like the shipped trio — a pure-Str fixture must NOT spam them (that artifact produced a bogus 34.7%
  berserker cell in the first sim pass); test melee passives attack-only.

---

## 7. Content volume & icons

- **9 new classes × 3 abilities = 27 abilities; 9 new `classOnly` signature techs.**
- **Icons:** the 9 new techs each need `assets/icons/<techId>.png` (presence enforced by
  `test_icons.js`), sourced hash-distinct from the DCSS set (lead pulls them — sub-agents have no
  network; repo-relative staging; v1.3/v1.4 icon-pipeline notes). Classes themselves have no icon id
  (the UI renders abilities/techs, not a per-class tile) — confirm during T1; budget 9 tech icons.

---

## 8. Testing

- Class suite: `thirdTierOptionsFor(c)` returns exactly the 2 options for each obtained Tier-2 class
  (and the correct union for multi-Tier-2 characters); obtain/activate/deactivate each new class;
  `buyAbility` respects class levels; `classBonus` sums the new passives on active slots; new techs
  are `classOnly` and gated to their class.
- **Conjurer summon (stubbed-RNG, battle suite):** casting Summon Elemental sets `battle.servitor`;
  the servitor deals its grade damage each round through the normal variance/Magic-Armor/grade-
  resistance path (assert damage lands and respects resistance); it is never targeted and never
  grants the enemy an extra action (assert enemy HP/turn count unaffected by its presence); re-summon
  replaces (not stacks); it expires after `turns` and is absent after battle end/flee (transient).
- Migration/legacy: a fabricated legacy save (Crusader + obtained Shadowknight) loads and both remain
  usable; full v1→current chain passes.
- Update the hardcoded class-count constant (15 → 24) and any tier-count assertions — never weaken a
  behavioural assertion.
- Icon presence for the 9 new techs.
- All ten suites green before any commit.

---

## 9. Phasing

- **T0 — Roster & numbers lock (lead).** Confirm D0–D3; finalise the 27 abilities' exact effects/
  numbers within the Tier-3 band and the 9 signature-tech designs. No code.
- **T1 — Data + plumbing (Sonnet, full brief).** 9 classes in classes.js (+ re-home the 3 shipped
  `baseClass` fields), 9 `classOnly` techs in techs.js, `advancedClassIdsObtained` +
  `thirdTierOptionsFor` change. Lead pulls the 9 tech icons.
- **T2 — Balance sanity sim + tests (lead sim, Sonnet tests).** `/balance-sim` per §6; class-suite
  extensions per §8.
- **T3 — Docs.** DESIGN.md §3 + classes.js header (convergence→branching, [revised]); changelog
  entry; README bump; CLAUDE.md. (Release framing/version decided at ship time.)

---

## 10. Risks & guardrails

- **Redundant twins.** The two options per Tier-2 must feel distinct (§3 effect-leans) — if a sim/
  playtest shows one strictly dominates its sibling, re-differentiate rather than power-creep.
- **Re-homing changes offers for existing Tier-2 characters.** A current Crusader will now be offered
  Paladin/Warden, not Shadowknight. That's the intended [revised] behaviour; legacy obtains are kept
  (§5). Flag it in the changelog so returning players aren't surprised.
- **Icon budget (9).** Real but bounded; parallelisable, not skippable.
- **Scope creep.** No new effect kinds, no new core class mechanics, no quest re-write — if any of
  those seem needed, stop and re-scope (the whole point is that the tier machinery already generalises).

## 11. Open decisions

- **D0 — Interpretation.** 2 options per Tier-2 (12 total, this spec) vs. 2 *additional* on top of
  today's convergence (18 total). Recommend the 12-total branching model (symmetry with Tier-1→2).
- **D1 — Re-home mapping** of the 3 shipped classes (Shadowknight→Gladiator, Magus→Wizard,
  Gambit→Rogue). Recommend as written; the alternative is a hybrid where the 3 stay available to both
  siblings (messier, breaks the clean 1-of-2 symmetry).
- **D2 — Second-option names.** Confirm Berserker / Paladin / Warden / **Conjurer** / Cleric / Seer /
  Assassin / Ranger / Dragoon (all archived), or swap any from the t-449 pool (also available:
  Archmage, Necromancer, Witch, Bard, Geomancer, Enchanter, Mystic, Priest, Healer, Shaman…). For the
  summoner specifically, **Conjurer** (from the Conjuration skill) is recommended; **Shaman** or
  **Spiritist** (both in the dev's own archived caster-name list, t-449) are alternates.
- **D3 — Legendary interaction.** None planned — the 3 Legendaries (tier 4) are unaffected. Confirm
  they stay convergence-free capstones above the branch.
- **D4 — Summon grade model (§3a).** One Summon Elemental tech that auto-picks the enemy's-weakness
  grade (simpler, always-useful) vs. Fire/Water/Wind/Earth variant techs the player chooses between
  (more archived "align to the enemy" depth, more tech ids/icons). Recommend starting with the
  single auto-weakness tech; add grade variants later if the class wants more decisions.
- **D5 — `summon_power_pct` effect?** Whether the Conjurer's servitor-empowering passive reuses an
  existing scalar (`damage_pct`/`energy_max_flat`) or justifies ONE narrow new `classBonus` effect
  read only by the servitor tick (§3a). Recommend try the existing scalars first; add the new effect
  only if the T2 sim shows the class lacks identity without it.
