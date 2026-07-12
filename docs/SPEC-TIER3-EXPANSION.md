# SPEC — Tier-3 Expansion (branching: two options per Tier-2 class at level 60)

**Status:** Backlog, not started. Authored 2026-07-12 (user-directed). Un-versioned (candidate for a
future content release; orthogonal to the v1.5 monster-AI work).
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
| **Wizard** (spell damage) | **Magus** *(shipped)* | **Archmage** | Magus homepage_2006 + t-787; "Archmage: powerful mages which achieve perfection into magic" proposed (t-449) |
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
- **Wizard** → Magus (uncategorised-Anima nuke: damage + energy) **vs.** Archmage (elemental
  mastery: damage + magic-armor, an elemental cataclysm tech).
- **Sage** → Cleric (restoration: HP + energy + a greater-heal tech) **vs.** Seer (foresight/support:
  dodge + energy + a buff/foresight tech).
- **Rogue** → Gambit (luck/gamble: gold + dodge, dice tech) **vs.** Assassin (burst: damage +
  double-attack + a lethal-strike tech).
- **Mercenary** → Ranger (skirmisher: damage + dodge + gold, ranged-volley tech) **vs.** Dragoon
  (heavy hybrid: damage + armor + HP, leaping-strike tech).

Exact per-ability numbers are locked in phase T0 within the band above; effects reuse the existing
`classBonus` vocabulary (`damage_pct`/`armor_flat`/`magic_armor_flat`/`dodge_flat`/`energy_max_flat`/
`hp_max_flat`/`gold_pct`/`double_attack_flat`) — **no new effect kinds, no core changes**.

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

Lower-risk than a new mechanic: this adds **options, not a new power band**. The gate is a
**sanity sim**, not a full re-derive:
- Confirm every new Tier-3 class sits inside the established Tier-3 envelope (§3) and none exceeds the
  strongest shipped Tier-3 combo. Special attention to **Berserker** (glass cannon): its top-of-band
  damage must be paid for with the missing defensive passive — sim its survivability so it's a
  high-risk/high-reward pick, not a strict upgrade.
- **Two-slot combos:** re-check that the best new Primary+Secondary pairings (e.g. Berserker +
  a Legendary, or Assassin + Gambit) don't exceed the difficulty-contract ceiling the shipped roster
  already respects. Use `/balance-sim` at L60/80/100.
- No change to the boss/at-level difficulty contract is expected; the sim's job is to prove that.

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
- **D2 — Second-option names.** Confirm Berserker / Paladin / Warden / Archmage / Cleric / Seer /
  Assassin / Ranger / Dragoon (all archived), or swap any from the t-449 pool (also available:
  Necromancer, Witch, Bard, Geomancer, Enchanter, Mystic, Priest, Healer, Shaman…).
- **D3 — Legendary interaction.** None planned — the 3 Legendaries (tier 4) are unaffected. Confirm
  they stay convergence-free capstones above the branch.
