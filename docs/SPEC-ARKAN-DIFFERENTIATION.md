# SPEC — Arkan Racial Differentiation (doorstep zone + quest/class parity)

**Status: DRAFT — not started.** Pending lead (Fable) review + reference sign-off before
implementation (cardinal rule 4: lead does specs; this draft was written at the user's direct
request during triage). Targets a content-only release; **no save-version bump expected**
(mirrors v1.2 Phase 3 Content-A — data-only, no persisted character field changes). Origin:
user playtest feedback 2026-07-14 (an Arkan character finds their starting experience is a
reduced copy of the Human one).

## 1. Problem

Choosing the **Arkan** race (vs Human) currently changes almost nothing about the early game
beyond the starting town. Two concrete gaps, both confirmed in the shipped data:

### 1a. The Arkan doorstep hunting zone is a strict *subset* of the Human one
- `plains_of_averast` (Eldor's, [`js/data/areas.js`](../js/data/areas.js) `id: plains_of_averast`):
  5 monsters — `plains_field_rat, plains_wild_boar, plains_vermin_swarm, plains_windrunner_kestrel,
  plains_cutpurse_vole` — 3 forage items, **plus** the Standing Stones touch-quest token.
- `saratus_plains` (Arkan's, same file): 3 monsters — `plains_field_rat, plains_windrunner_kestrel,
  plains_wild_boar` (a subset), 2 forage items, no Standing Stones.

So the Arkan doorstep is not just *similar* — it is a reduced version of the Human doorstep.
This was a deliberate v1.2 budget shortcut (Content-A brief: "reuse existing data, no new
`monsters.js` entries"), reference-anchored on shared geography (Averast.md: Saratus sits in the
same Plains of Averast region as Eldor). That anchor is legitimate — the fauna *should* overlap —
but nothing gives the Arkan side any distinct character.

### 1b. An Arkan has no in-city path to the game's core early systems, especially a class
Quest givers by home city (before the L14 regional content opens):
- **Eldor** (Human capital): the whole early general spine **and every class-progression quest** —
  `first_calling` (L5, base class), `trials_of_eldor` (L30, advanced), `masters_calling` (L60,
  tier-3), `vaultbreakers_reckoning`. **None are race-gated.**
- **Saratus** (Arkan capital): exactly 3 racial quests before L14 — `arkan_first_rite` (L1),
  `arkan_battlemage_trial` (L6), `arkan_red_moon_whispers` (L8) — then nothing until Anje's L14+
  foothills/Juneros line.

Consequences:
1. **Class acquisition is Eldor-only.** An Arkan must travel to the *Human* capital to obtain a
   class at all — the single most important early system has no Arkan-side presence.
2. The two gaps intersect: `first_calling`'s kill step is **4× `plains_vermin_swarm`**, and
   `plains_vermin_swarm` is one of the two monsters *missing* from `saratus_plains`. So an Arkan
   pursuing a class can't even complete the step near home — they must hunt in the Human plains.
3. The net "Arkan experience" is cosmetic: a different starting town + 3 flavor quests, then the
   player funnels into Human content regardless of race.

## 2. Design authority & reference grounding

- Arkan is a genuine **archived playable race** — DESIGN.md §"Races" (`[archived]`, `Arkan.md`,
  `Human.md`, `New_Player_Guide.md` creation flow §73). But the archive gives **lore/flavor, not a
  parallel questline**, so a richer Arkan path is `[invented]`, designed in the original's spirit.
- Arkan flavor to mine ([`reference/manual/Arkan.md`](../reference/manual/Arkan.md)): "a proud
  people who once called the **Forests of Kuraan** their home… overrun by a tribal race known as the
  **Majiku**… forced to the Plains of Averast… established the city of **Saratus**, a grand circular
  city focused on the **study of magic and technology**… fight with **runic blades or bows**…
  **Battlemages** reinforce the front with white and black magic derived from the study of runes."
- Constraint (Averast.md): Saratus is in the *same region* as Eldor, so the doorstep fauna
  legitimately overlaps — differentiation should be **cultural/technological** (runic constructs,
  battlemage training) layered onto shared wildlife, not a wholesale alien biome.
- Existing in-spirit hooks already in the data: the Arkan racial line (`arkan_first_rite`,
  `arkan_battlemage_trial`, `arkan_red_moon_whispers`) and its NPCs (Elder Meilin, **Battlemage
  Instructor Renjiro**, Rune-Archivist Kaida) in Saratus; the Kastengard wardframes/Custodian
  constructs as a precedent for Arkan magic-and-technology foes; the Kuraan reclamation arc
  (L41+) as the eventual homeland-reclamation payoff.

## 3. Proposed changes

Two independent workstreams; ship-order A → B. Each phase committed green (cardinal rule 5).

### Phase A — Differentiate the Arkan doorstep (`saratus_plains`)
Recommended: **A2** (flavor), with **A1** as a scope-floor.

- **A1 (parity floor, prerequisite for B):** add the two missing regional monsters
  (`plains_vermin_swarm`, `plains_cutpurse_vole`) to `saratus_plains` so it is at least not a
  downgrade, and so a local Arkan class quest (Phase B) has its kill target available. Data-only,
  no new monsters. `[revised]` (undoes the subset shortcut).
- **A2 (recommended flavor):** additionally introduce **1–2 Arkan-cultural low-level foes** unique
  to `saratus_plains` — e.g. a *Runic Training Ward* / *Saratus Wardframe* (a training construct;
  magic-and-technology culture, echoing Kastengard constructs) — plus one Arkan-flavored forage
  token (a rune-etched material). `[invented]`, Arkan.md-anchored. **New monster(s) ⇒** stats,
  mandatory `/balance-sim` before locking (cardinal rule 4/5), a **byte-distinct icon**
  (`test_icons.js` Test 2), and an appended drop-table entry (top-down, first-hit-wins convention).
- **A3 (rejected):** a wholly distinct biome — contradicts the shared-region lore anchor.

### Phase B — Arkan class/quest parity
Recommended: **B2** for the near-term fix; **B3** noted as the larger backlog vision.

- **B2 (recommended, base-tier parity):** add an **Arkan-flavored mirror of `first_calling`**,
  given in Saratus (reuse Battlemage Instructor Renjiro), `requiresRace: 'Arkan'`, granting the
  **same base-class choice** through the existing `rewards.classChoice: ['warrior','magician',
  'thief']` mechanism (no new class code). Kill step targets a monster present in `saratus_plains`
  after Phase A. This slots into the existing `arkan_*` racial line and closes the "no class in my
  own city" gap at the tier that matters (L5). `[invented]`, mechanism `[archived]`.
  - The **advanced (L30) and tier-3 (L60)** class quests stay Eldor-hosted: by then cross-region
    travel is trivial and the central Royal Academy is the narratively correct site for higher
    callings. Mirroring them is optional/low-priority; note it, don't build it now.
- **B-fill (recommended alongside B2):** add 1–2 more low-level Arkan racial quests to carry the
  Arkan's own city across the L1–13 gap into Anje's L14 line (runic-training / Majiku-scouting /
  red-moon threads already seeded by `arkan_red_moon_whispers`). Pure content, reference-flavored.
- **B1 (alternative):** dual-home the existing class quests (offer from both capitals). Rejected —
  needs multi-giver quest-model code and muddies the single-"calling" narrative; B2 is cleaner.
- **B3 (backlog, out of scope here):** a full parallel Arkan arc (reclaim Kuraan from the Majiku)
  replacing the Human spine for Arkan characters — dovetails with the existing L41+ Kuraan
  reclamation content but is expansion-scale. Record in the backlog, don't attempt in this cycle.

## 4. Save/versioning, testing, sims

- **Save version:** no bump. All changes are area/quest/monster **data** + at most a new
  `requiresRace` flag on a new quest — no persisted character field changes (same footing as v1.2
  Content-A). Legacy saves (Human and Arkan) must stay fully functional; add a test asserting a
  pre-existing Arkan save still loads and its quest log is coherent.
- **Suites (all ten must pass):** update the monster-count / quest-count / area-content constants
  the suites hardcode (never weaken an assertion — update the stale constant). New content needs
  **stubbed-RNG tests**: (a) any new monster is huntable and drops correctly; (b) a fresh **L1
  Arkan** has a class-obtain path *in Saratus* (the B2 quest is offered and its kill target exists
  in `saratus_plains`); (c) the new Arkan quests are `requiresRace`-gated (Humans can't accept).
- **Balance sim:** required **only if** Phase A adds a new monster (new low-level stats → `/balance-sim`
  per cardinal rule 4/5). Quest/class-choice changes carry no combat math, so B needs no sim.
- **Icons:** any new monster needs a hash-distinct `assets/icons/<id>.png` (DCSS CC0 tile); items/
  forage tokens may reuse tiles (only monsters need byte-distinctness).

## 5. Open decisions for lead/user

1. **Phase A scope:** A1 (parity floor, data-only, no sim) vs A2 (new Arkan-cultural foe, needs a
   sim + icon). Recommendation: A2 if a monster slot is worth the flavor; A1 if keeping this a
   pure content patch.
2. **B-fill volume:** how many extra low-level Arkan racial quests (0 / 1 / 2) to bridge L1–13.
3. **Mirror the higher class quests?** Leave advanced/tier-3 Eldor-only (recommended) or also
   provide Saratus-given mirrors.
4. **Human parity check:** should this cycle also *add* anything to the Human doorstep, or is the
   Human side the intended baseline and only the Arkan side is brought up to it? (Recommend the
   latter — do not inflate both.)

## 6. Related

- Sibling deferred bug (same Arkan/Saratus thread): the home-town **travel-UI** gap — an Arkan
  can't reach Saratus via the Explore list below L14 (`renderExplore` missing the home-town
  exemption that `travelTo` has). Logged separately; worth fixing in the same cycle since both
  touch the Arkan early-game experience.
