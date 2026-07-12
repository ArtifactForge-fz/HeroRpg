# SPEC — v1.5 Reactive Monster Behavior (telegraphs & behavior archetypes)

**Status:** Backlog, not started. Authored 2026-07-12. **Depends on v1.4 landing** (generalizes the
G2 boss-script/affix machinery to standard monsters). Sequence as the v1.5 headliner, after v1.4
merges to `main`.
**Owner model:** lead (Opus) scopes/reviews + owns the sim gate; Sonnet subagents implement, each
with a full up-front brief (CLAUDE.md cardinal rule 4). `/balance-sim` is mandatory before locking
any combat constant here.
**Relationship to authority:** **[archived intent]** + **[invented]** specifics. It does not change
any archived rule; it deepens monster AI, which the original explicitly planned. Update DESIGN.md §4
(Combat) with a monster-behavior subsection when it ships.

Sourcing (cardinal rule 2): the direction is squarely archived — `reference/site/homepage_2006.md`
(Hero 6.5 plan): *"Revamped Monster AI: Scripted abilities … status effects, item usage;
**Intelligent reactions based on hero actions**; Monster fleeing from battle; **Strategic boss
battles**."* v2.1 also shipped 24 monster techs (DESIGN §4). The telegraph/wind-up mechanic and the
archetype set are **[invented]** within that intent.

---

## 1. Problem & goal

Today every monster runs the same flat AI (`battle.js monsterAct`): if it has an affordable tech,
**50% random chance** to cast it, else basic-attack — with **no wind-up and no reaction to the
player**. Two consequences:

1. **Defend (Feature C) is nearly dead.** Halving *one* hit at the cost of your whole offensive turn
   is a losing trade in a straight race; it's only worth it against a big *incoming* hit — but the
   player can't see one coming, because actions are an untelegraphed coin-flip. (See the 2026-07-12
   design discussion that motivated this spec.)
2. **Combat has no tactical reads.** Varied *content* (78/87 monsters carry techs) doesn't produce
   varied *decisions*, because nothing is anticipatable or reactive.

**Goal:** give combat a reactive layer — **telegraphed heavy attacks** the player can read and
answer (Defend, burst/interrupt, pre-heal, dodge-stack, or flee) — and extend it to **most standard
monsters**, not just bosses. **Grade the complexity along the player journey:** starting areas stay
simple; reads are introduced progressively so new players learn the basic loop first and the
tactical layer unfolds as they travel north through the arc.

---

## 2. Core mechanic — the telegraph (wind-up) [invented]

A monster can **charge** a heavy action instead of acting immediately:

- **Turn N (wind-up):** the monster announces (`"The Ashen Ogre rears back…"`) and takes no damaging
  action. A `charging` marker is set on the **battle-transient monster copy** (never the shared def,
  never persisted — same discipline as the Frenzied-affix `battle.monsterActionsTaken` counter).
- **Turn N+1 (release):** it unleashes a **charged attack** — a heavy hit (~1.8–2.2× its normal, or a
  flagged strong tech; magnitude locked by the sim, §6). This bypasses the 50% roll for that turn.
- **The player's window (turn N):** one turn to respond —
  - **Defend** → halves the charged hit (its reason to exist) — the *defensive* answer;
  - **Interrupt / Limit Break** → break the charge with a heavy enough hit — the *offensive* answer
    (see §2a);
  - **pre-heal / item / dodge-stack / flee** → the telegraph enriches *every* tactical option, not
    just Defend.

The charged attack reuses the existing damage pipeline verbatim — variance, glancing, Armor vs.
Magic-Armor mitigation by grade, Fear, and the Defend halving — it is only a higher base + a
telegraph flag. Battle log **must** announce both wind-up and release (players learn the rules by
seeing them, same principle as G2 affix announcements).

### 2a. Interrupt / stagger — the offensive answer (M2, committed) [invented]

The wind-up turn is a two-sided read, not a "Defend or eat it" prompt:

- **Interrupt:** if the player's action during the wind-up deals **≥ an interrupt threshold**
  (sim-tuned per §6; a **Limit Break always qualifies**), the charge is **canceled** — the monster
  wastes its release turn (`"…its charge collapses!"`), takes no charged hit, and resumes normal
  behavior next turn.
- **The tension that makes it a real choice:** interrupting means *attacking into* the wind-up
  instead of Defending. If your hit **falls short** of the threshold, you did **not** guard — you eat
  the **full** charged hit next turn. So the read is genuine risk/reward: **Defend** = guaranteed
  halving but zero damage dealt; **Interrupt** = deny the hit *and* deal damage, but only if you can
  clear the bar, else you take it full. Burst builds and Limit-Break timing get a distinct payoff
  from mitigation builds.
- Interrupt is a **global rule** of the telegraph system (any telegraphing monster, from V1), read
  off the same charge state — no per-monster code. It composes with the archetypes (§3): a
  `guardian` or `reactive` monster is simply harder to interrupt (higher threshold).

**Frequency is tuned so telegraphs are *events*, not a metronome** — a monster shouldn't wind up
every third turn (that's just tedium). The charge chance is per-archetype and sim-tuned (§6).

---

## 3. Behavior archetypes (data-driven, reusable) [invented]

Instead of bespoke per-monster scripts, define a **small set of reusable archetypes** (the same
philosophy as champion affixes and the G2 boss-script interpreter — one `behavior` field, one
interpreter, no per-monster code branches). Proposed set:

| Archetype | Behavior | Journey placement |
|---|---|---|
| `simple` | current AI (50% affordable tech else attack), **no telegraph** — the default | starting areas / bands 1 |
| `telegraph` | occasionally winds up a charged heavy attack; else `simple` | first taught mid-early |
| `caster` | prioritizes techs; telegraphs a big nuke; weak basic attack | mid |
| `enrage` | below an HP threshold, telegraphs more often / hits harder (boss-lite; related to the Frenzied affix) | mid-late |
| `guardian` | sometimes **guards itself** (reduces the player's next hit), forcing the player to burst through windows — the mirror of the player's Defend | late |
| `reactive` | **reacts to player actions** (archived "intelligent reactions"): e.g. delays its charge if the player Defends; punishes a player buff/limit-break wind-up with its heavy hit | late / bosses (full G2 scripts) |

- **Default is `simple`** when the `behavior` field is absent → the 9 pure-attackers and every
  untagged monster stay exactly as they are today (**backward compatible, no forced data churn**).
- Archetypes compose with existing champion affixes (v1.4 G2) and boss scripts — a champion
  `telegraph` monster with the `frenzied` affix is valid and interesting.

---

## 4. Defend interaction (the payoff, and an optional sweetener)

- **Defend halves a charged hit** (existing `DEFEND_DAMAGE_MULT`). A telegraphed heavy hit is finally
  the situation where spending your turn to halve one hit is clearly correct — Defend becomes a
  *read*, not a blind tempo loss. It is the guaranteed-but-passive answer, paired against the
  Interrupt answer (§2a): halve for certain and deal nothing, or gamble on breaking the charge.
- **Defend stays as-is — no mitigation buffs.** A "perfect guard" (Defend *negating* a telegraphed
  hit) was explicitly **cut** (see §10): improving player mitigation/sustain touches the documented
  5-down Fear limitation (DESIGN §4), and the two-sided Defend/Interrupt read already makes the
  window meaningful without it. `DEFEND_DAMAGE_MULT` is unchanged by this spec.
- **No Defend spam:** telegraph frequency is low enough that Defend stays situational; it must never
  become the mainline action (that would just invert the current problem).

---

## 5. The journey ramp (how complexity unfolds) — data pass

The point of "extend to most standard monsters, but keep starting areas simple." Assign `behavior`
per monster by its area band:

- **Bands 1 — starting areas (~L1–10):** **`simple` only.** New players learn hunt → attack → loot
  → town with zero reactive burden. (Keeps the current feel intact for onboarding.)
- **Bands 2–3 (~L10–40):** introduce **`telegraph`** on a *minority* of monsters — the first
  "watch for the wind-up; consider Defend" lesson. A brief tutorial beat (a signposted first
  telegrapher, or a one-line Journal hint) is optional but recommended (M4). Add `caster` for
  spellcaster monsters.
- **Bands 4–6 — the arc (~L40–100):** telegraphs become **common**; add `enrage` and `guardian`;
  bosses use full `reactive` G2 scripts. By late game the **majority** of standard monsters run a
  non-`simple` behavior — this is the "most standard monsters" target, reached gradually.
- **Endgame (Colosseum):** Arena Trials modifiers (endgame spec) can amplify telegraph frequency or
  charge power as a run-wide modifier — free reuse, no new content.

Net: complexity is a **gradient along the map**, exactly as requested — simple where players start,
rich where they've earned the fluency.

---

## 6. Balance & the sim gate (do FIRST, per `/balance-sim`)

A telegraphed heavy hit is a *counterable spike*, not just more damage — the sim must prove it stays
counterable:

- Measure at-level and ±band win %, rounds, HP-left, damage-per-energy at L10/30/50/70/90/100 with
  each archetype active, **for a player who does NOT optimally react** (worst case) and one who
  does. The **at-level ≥85–100% win floor must hold even against un-Defended charged hits** — a
  telegraph the player can't always answer (no energy to Defend, no burst) must not spike deaths at
  level.
- Lock: charged-attack multiplier, per-archetype charge chance, enrage threshold, guardian
  mitigation, and the **interrupt threshold** (§2a — tuned so interrupting is a genuine burst check,
  not a free default; a Limit Break clears it by design). Each lands in `js/balance.js` with a
  citation comment (cardinal rule 1).
- **Respect the two standing hazards:** don't worsen the 5-down Fear sustain issue (DESIGN §4) and
  don't re-introduce over-armoring (charged *tech* hits route through Magic Armor; charged physical
  through Armor — keep the ~half-a-hit armor cap intact).

---

## 7. Architecture & save impact

- **New data field `behavior: '<archetype>'`** on monster defs in `js/data/monsters.js` (absent →
  `simple`). Charged attacks reuse the tech system: a `telegraph: true` flag on the relevant monster
  tech (or a behavior-driven charged basic attack) — reuse the mitigation-by-grade path, don't fork
  it.
- **One behavior interpreter inside `monsterAct()`** reads `behavior` + transient charge state and
  decides normal-action / begin-wind-up / release-charge. **No per-monster branches** (the scope-
  creep failure mode to reject in review, same rule as G2 boss scripts).
- **All telegraph/charge/guard state is battle-transient** (`battle.monster.charging`, etc.) —
  mirrors `Game.state.battle`, never persisted.
- **Single RNG surface** — all rolls through `rng()` / `Game.Battle._rng`; never a second `_rng`.
- **Save impact: NONE.** No character fields, no version bump. Adding `behavior` to existing monster
  defs is a data pass, not new ids → **no new icons** (test_icons.js unaffected; monster count
  unchanged).

---

## 8. Phasing (green, committable sub-phases; branch off `main` after v1.4 merges)

- **V0 — Sim harness (lead, gating).** Extend the v1.4 P0 sim for telegraph/charged-hit archetypes;
  produce provisional constants. No shipping code. Gates everything (`/balance-sim`).
- **V1 — Telegraph core + Interrupt + `telegraph` archetype.** `behavior` field + interpreter in
  `monsterAct`; wind-up/release + charged attack; **Defend halving AND Interrupt/stagger (§2a) — both
  answers ship together** so the read is two-sided from day one; battle-log announcements; assign
  `telegraph` to a handful of mid-band monsters. Stubbed-RNG tests: forced wind-up → announce →
  charged hit next turn → Defend halves it; hit ≥ threshold cancels the charge; hit < threshold eats
  the full hit; Limit Break always interrupts. *Delivers the reactive read (both sides).*
- **V2 — Archetype set + journey data pass.** `caster` / `enrage` / `guardian`; assign `behavior`
  across all bands per §5 (simple early → majority non-simple late). Reachability/onboarding review:
  confirm starting areas stay `simple`. Stubbed-RNG tests per archetype (incl. `guardian`'s higher
  interrupt threshold).
- **V3 — `reactive` + boss/G2 integration.** Reactive-to-player behavior on late monsters/bosses
  (generalize G2 scripts); endgame Trials telegraph amplifier hook.
- **V4 — Docs.** DESIGN.md §4 monster-behavior subsection (tags + citations); README; CLAUDE.md
  "recently completed"; changelog entry prepended; this spec marked shipped.

All ten suites green before each commit; stale constants updated, behavioral assertions never
weakened.

---

## 9. Risks & guardrails

- **Difficulty contract** (at-level ≥85%, bosses winnable-but-costly): charged hits are the risk —
  V0 sim is the gate; if a telegraph spikes at-level deaths for players who can't always react,
  lower the charge multiplier/frequency, don't rely on the player always having Defend available.
- **Tedium / Defend-spam inversion:** telegraphs must be *events*. If playtest/sim shows combat
  becoming "defend on every wind-up," cut frequency — the read should be occasional and meaningful.
- **Onboarding:** starting areas MUST stay `simple` — a new player hit by an unexplained heavy spike
  before learning Defend is a bad first hour. V2 review walks a fresh low-level playthrough.
- **Scope creep:** archetypes stay data-driven through one interpreter; per-monster code branches are
  rejected in review (the G2 discipline).
- **Known limitation (DESIGN §4):** this spec adds **no** player mitigation/sustain buff (perfect
  guard was cut) — Defend is unchanged, so the 5-down Fear case is not touched on the defensive side.
  The **Interrupt** threshold is the one number to watch: set too low, interrupting trivializes every
  telegraph (deny-the-hit becomes free); the V0 sim tunes it so interrupting is a real burst check,
  not a default, and reports any 5-down interaction.
- **Sequencing:** do not start before v1.4 lands — the telegraph interpreter generalizes G2's boss
  scripts; building it first would mean building that machinery twice.

## 10. Open decisions (resolve at V0 kickoff)

**Resolved (user-directed, 2026-07-12):** **M2 Interrupt/stagger is IN** and ships in V1 as a core
pillar (§2a) — not deferred. **M3 Perfect guard is CUT** — Defend is not buffed; do not build it.

- **M1 — Charged attack: flagged tech vs. charged basic attack?** Recommend a `telegraph: true` tech
  flag (most data-driven, reuses grade/mitigation).
- **M4 — Explicit onboarding beat** for the first telegrapher (signposted monster / Journal hint) vs.
  purely organic? Recommend a light signpost.
- **M5 — How much of the population goes non-`simple`?** "Most" late-game — confirm the exact target
  (e.g. ≥60% of L40+ monsters carry a behavior).
- **M6 — Interrupt threshold shape** (flat vs. scaled to monster level/HP) — a V0 sim question; a
  level-scaled threshold keeps interrupting a real check at every band rather than trivial once
  player damage outgrows a flat number.

## 11. Out of scope

- **Summons / multi-enemy fights** — the engine is strictly 1v1 (`forum/t-449.md`: "no summons in
  battle"); archived AND cut. Telegraphs are single-enemy reads only.
- **Full boss-script authoring** beyond generalizing G2 — bosses already have their own scripted
  beats from v1.4; this spec brings the *standard* population up, and only reuses/extends the boss
  interpreter.
- **New monsters/icons** — this is a behavior pass over existing monsters, not a content-volume
  expansion (that's the level-arc axis, already shipped).
