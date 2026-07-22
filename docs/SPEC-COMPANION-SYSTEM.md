# SPEC — Companion System & Summoner (Conjurer) Redesign (a persistent, targetable second combatant framework, first consumed by the Conjurer's four elementals)

**Status:** DRAFT — open decisions **D0–D6 RESOLVED 2026-07-22** (see §5); ready for implementation planning. **No combat constant below is locked**; every number is a formula-derived proposal pending `/balance-sim`.

**Relationship to authority:**
- Extends `docs/DESIGN.md` §3 (Classes — the Conjurer), §4 (Combat/Fear/monster AI), §5 (Techs & Anima grades).
- Introduces a new engine subsystem (`Game.Companion`) and a new persisted character field, so it touches `js/core/battle.js`, `js/core/character.js`, `js/core/save.js`, a new `js/data/companions.js`, and `js/data/classes.js`/`js/data/techs.js`.
- **Deliberately overrides one archived rule (a `[revised]`).** The archive records an explicit dev decision that there are **no summons in battle — "It's just 1v1"** (`reference/forum/t-449.md`, Nerevar, 2004-11-26), and the shipped code treats this as a hard guardrail, restating it in three places: `docs/SPEC-TIER3-EXPANSION.md`, `docs/SPEC-V1.5-MONSTER-AI.md`, and a comment in `js/core/battle.js`. The current Conjurer was built specifically to *honour* that rule (its "servitor" is a damage-over-time rider on the enemy, **not** a combatant). This spec's central premise — a companion that is its own actor, has its own HP, and can be targeted by the enemy — cannot coexist with that rule. **Per the project's discipline, a `[revised]` override is never taken on the designer's authority; it is D0 below for your explicit sign-off.** The user request *is* the directive, but because it contradicts a triple-cited guardrail it is surfaced, not assumed. **(D0 APPROVED 2026-07-22 — this `[revised]` is now authorised; the three guardrail comments in `docs/DESIGN.md`, `docs/SPEC-TIER3-EXPANSION.md`, and `docs/SPEC-V1.5-MONSTER-AI.md` are to be updated to cite this spec.)**

**Interpretation of the request (confirm — D0):** You want the summoner reworked from a single DoT-rider into a genuine **companion system**: a reusable, class-agnostic framework (so future pets/summons/mounts can plug in) whose first consumer is a redesigned **Conjurer** commanding **four elemental summons — Fire, Water, Earth, Wind**. A companion (a) is summoned by a technique, (b) then **acts by itself each player round**, (c) is **semi-permanent** — it carries HP from battle to battle and only needs re-summoning once killed, (d) can be **targeted by enemies** (player, companion, or both-via-a-special), (e) has a **basic action + a special ability, each costing the player's Energy**, and (f) is **limited to one active at a time** — summoning a different elemental replaces the current one. Elemental themes: **Fire = damage-over-time, Earth = tanking/mitigation, Water = healing, Wind = buff/direct-damage.**

---

## 1. What changes

**Today (shipped, v1.8.0 / save version 10):**

| Thing | Current state | Source |
|---|---|---|
| Battle model | Strictly 1v1. No second player-side actor exists anywhere in the engine. | `js/core/battle.js`; guardrail cited `reference/forum/t-449.md` |
| The "summoner" | The **Conjurer** (Tier-3, `baseClass: wizard`): two passives + one signature tech. | `js/data/classes.js` (`id: 'conjurer'`); `docs/DESIGN.md` §3 |
| Its summon | `tech_summon_elemental` → an **Elemental Servitor**: an entry pushed onto `battle.monster.statuses` (`{type:'servitor', turnsLeft, power, grade}`) that ticks damage against the enemy each round, auto-attuned to the enemy's weakest grade, replace-not-stack, **fades after 5 turns and never persists past a battle.** Not a combatant: no HP, no turn, cannot be targeted. | `js/data/techs.js` (`tech_summon_elemental`); tick in `js/core/battle.js` `tickMonsterStatuses`; test `tests/test_p6_classes.js` Test 24 |
| Status framework | Two battle-transient arrays: `battle.playerStatuses` (poison/curse/buff) and `battle.monster.statuses` (servitor/debuff incl. `bleed` DoT). Ticked in `tickPlayerStatuses`/`tickMonsterStatuses` inside `finishRound`. Nothing survives `endBattle()`. | `js/core/battle.js` |
| Save | `CURRENT_VERSION = 10`; unchanged since v1.4 because no new *persisted* field has been added since. | `js/core/save.js` |

**After this spec:**

1. A new **`Game.Companion` engine module** and a new **persisted** `character.companion` field (the first save field since v1.4 → **save version 11**). The companion is a real actor: it has HP that carries between battles, it acts each round, and it can be the target of an enemy attack.
2. A new **`js/data/companions.js`** data file defining companion *kinds* (four elementals) with a documented schema — the extension point for future pets.
3. The **Conjurer redesigned**: its signature ability becomes an **Elemental Pact** that grants four "Bind" summon techs (one per element) plus each element's special-command tech. The old `tech_summon_elemental` servitor is retired (superseded).
4. **Enemy targeting** extended: a taunt mechanic redirects the enemy's basic attack onto a companion, and monster techs gain an optional `target` field (`'player' | 'companion' | 'both'`) so a "special attack" can strike the summon or hit both. Existing monsters are untouched (field defaults to `'player'`).

---

## 2. Design detail

### 2.1 The companion actor — data model & lifecycle

**Persisted state** — new field on the character object (`js/core/character.js` `create()`), the only new persisted data:

```
character.companion = null            // no companion bound
  | { kindId: 'comp_fire'|'comp_water'|'comp_earth'|'comp_wind',
      hp: <int> }                     // current HP; carries between battles
```

Design rules (all **[invented]** — no archive precedent for a persistent pet; the nearest archived concept, the v3.0 "Eidolon", is explicitly *passive and non-combatant* per `reference/manual/Version_3.0.md` and is out of scope, so it informs flavor only):

- **One active companion.** `character.companion` is a single slot. Casting a different "Bind" tech overwrites it: **the outgoing companion is discarded and the new one arrives at full HP** (D2 resolved — no HP banking; keeps one persisted field and a clean "one active" rule).
- **`hpMax` is derived, never stored** — recomputed from character level on summon and on level-up via the per-kind formula in §2.2, so a persisted save only carries `kindId` + current `hp` (minimises save surface). On recompute, `hp` is clamped to the new `hpMax`.
- **Semi-permanent.** `hp` persists across a won / fled / monster-fled `endBattle()`. It is **not** restored by winning, fleeing, or resting at an inn/camp (D3 resolved — inns/camps do **not** mend the companion). It is restored only by (a) re-summoning (fresh full HP) or (b) the Water elemental's heals.
- **Death → dispersal.** When `companion.hp` reaches 0 the companion is set to `null` and must be re-summoned (paying Energy again). This is the core cost that keeps the mechanic honest.
- **Dispersed on player defeat (D6 resolved).** On a **lost** battle (`onLoss`), the companion is likewise dispersed (`character.companion = null`) and must be re-summoned — an extra Energy tax layered on the existing death penalty, so dying with a bound companion stings a little more.
- **Battle rehydration.** On `Game.Battle.start`, if `character.companion` is non-null, a transient `battle.companion` view is built from it (kind def + live `hp`/`hpMax` + empty per-battle `statuses: []`), mirroring how `deepCopyMonster` builds `battle.monster`. Writes to `hp` during battle write through to `character.companion.hp` at battle end (parallel to how `battle.player` is already a live reference to the character). `battle.companion` itself is transient and never persisted (same rule as `battle` — `js/core/save.js` strips `state.battle`).

**Companion kind schema** (new `js/data/companions.js` — proposed shape, the reusable extension point):

```
{ id, name, element,            // element = Anima grade string (DESIGN.md §5); drives resistances & the grade of its damage
  role,                          // 'dps'|'tank'|'healer'|'support' — documentation/flavor only, no engine branch
  hpBase, hpPerLevel,            // hpMax = round(hpBase + hpPerLevel * character.level)
  armorBase, armorPerLevel,      // armor  = round(armorBase + armorPerLevel * character.level)
  magicArmorBase, magicArmorPerLevel,
  basic: { name, effect, grade, energyCost, power,   // the auto-action fired each player round
           dotKind?, dotPower?, dotTurns?,           // Fire: applies a Burn DoT
           healFlat?,                                 // Water: flat player heal riding the basic
           tauntTurns? },                             // Earth: threat generated by the basic
  desc, icon }
```

Special abilities are **not** on the kind def — they are player-cast techs (§2.4) so they flow through the existing `useTech` Energy/targeting/hit pipeline unchanged.

### 2.2 The four elementals

Classical Paracelsian elementals (public-domain names — Salamander/Undine/Gnome/Sylph; Earth uses "Golem", also public-domain folklore, for a tankier read). **All stat/number fields are [invented] and [sim-gated]** — see §3. Element grades are **[archived: `reference/manual/Recent_Updates.md`** 2007-04-20, the Fire/Water/Wind/Earth/Star/Light/Dark grade list, mirrored in `js/balance.js` Anima-grade notes**]**.

`hpMax = round(hpBase + hpPerLevel·L)`, `armor = round(armorBase + armorPerLevel·L)`, where `L = character.level`. Sample column is at **L = 60** (Conjurer's Tier-3 unlock level per `js/data/quests.js` "The Master's Calling").

| id | name | element | role | hpBase | hpPerLvl | HP@60 | armorBase | armorPerLvl | armor@60 | magicArmorBase | magicArmorPerLvl |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `comp_fire` | Ember Salamander | Fire | dps (DoT) | 20 | 4 | 260 | 0 | 0.2 | 12 | 0 | 0.2 |
| `comp_water` | Tidal Undine | Water | healer | 25 | 5 | 325 | 0 | 0.3 | 18 | 0 | 0.3 |
| `comp_earth` | Granite Golem | Earth | tank | 40 | 8 | 520 | 4 | 1.0 | 64 | 2 | 0.6 |
| `comp_wind` | Gale Sylph | Wind | support/dps | 18 | 4 | 258 | 0 | 0.2 | 12 | 0 | 0.2 |

**Basic actions** (fire automatically each player round; pay the player's Energy; **[invented]** magnitudes, **[sim-gated]**). `power` feeds the existing `techEffectivePower(battle.player, {effect, power})` so it scales with Intelligence/skill exactly like a player tech, and Fear (`fearMultiplier`) applies exactly as it already does to the servitor tick in `js/core/battle.js` `tickMonsterStatuses`.

> **D5 resolved:** companion **HP** (and armor) scale off **character level only** — no Intelligence term (the `hp`/`armor` formulas in §2.2 take `L` alone). Companion **damage** *does* additionally scale off **Intelligence**, which it gets for free by routing `power` through `techEffectivePower` — that function already applies the `× (1 + Intelligence · 0.02)` multiplier to `effect:'damage'`/`'drain'` (`js/core/battle.js` `techEffectivePower`). So a high-Int Conjurer hits harder with the companion but does not make it tankier — exactly the split you asked for.

| companion | basic name | effect | grade | energyCost | power | rider | desc (shipped voice) |
|---|---|---|---|---|---|---|---|
| `comp_fire` | Ember Lash | damage | Fire | 4 | round(6 + 0.7·L) | applies **Burn** DoT: `dotKind:'burn'`, `dotPower: round(3 + 0.4·L)`, `dotTurns: 2` (refreshes, replace-not-stack) | "The Salamander lashes a whip of fire, leaving the wound smouldering." |
| `comp_water` | Soothing Spray | heal | — | 4 | round(5 + 0.5·L) (heals the player) | also chips the enemy for a token `round(2 + 0.2·L)` Water damage | "The Undine mists cool water over your wounds." |
| `comp_earth` | Stone Fist | damage | Earth | 4 | round(4 + 0.5·L) | `tauntTurns: 2` — generates Taunt (see §2.3) | "The Golem hammers a stone fist down and plants itself between you and the foe." |
| `comp_wind` | Gale Slash | damage | Wind | 6 | round(8 + 1.1·L) | — (highest direct damage) | "The Sylph carves the air into a razor gale." |

Energy rule (**[invented]**): the basic fires in `Game.Companion.act(battle)` (called at the top of `finishRound`, i.e. on the player's turn, before the monster acts). If the player has `< energyCost` Energy, the companion **idles** that round (log: "Your <name> is starved of Anima and holds back."). This is the ongoing Energy tax the request asks for and the tactical tension with the player's own techs.

### 2.3 Enemy targeting & the taunt/threat mechanic

Default (unchanged for every existing monster): the monster's basic attack targets the **player**.

**Taunt (Earth's job)** — **[invented]**; the *name-concept* of a companion pulling enemy hatred is archive-adjacent (the proposed "Shadow Hag… creating hatred into their hearts", `reference/forum/t-449.md`), mechanics invented. A `taunt` status (`{type:'taunt', turnsLeft}`) lives on `battle.companion.statuses`. While `turnsLeft > 0`, the monster's **basic** attack is redirected onto the companion (resolved against the companion's `armor`/`magicArmor` via the existing monster→target damage formula in `js/core/battle.js`). Generated by Stone Fist (2 turns) and refreshed/extended by Bulwark (§2.4). When no taunt is active, the basic hits the player.

**Monster "special attacks" that can hit the summon** — a new **optional** field on monster techs (`js/data/techs.js`, `mon_`-prefixed entries), consumed by `monsterAct`:

```
target: 'player' | 'companion' | 'both'   // optional; ABSENT ⇒ 'player' (all shipped monster techs unchanged)
```

- `'player'` — as today.
- `'companion'` — the special strikes the companion; if none is bound, it falls back to the player.
- `'both'` — a cleave/AoE special that damages player and companion in one action (each rolled/mitigated independently).

Two example monster techs to demonstrate the field (both **[invented]**, **[sim-gated]**; **APPENDED** to `js/data/techs.js`'s monster-tech block so no existing indices shift):

| id | name | effect | grade | power | target | desc |
|---|---|---|---|---|---|---|
| `mon_cleaving_roar` | Cleaving Roar | damage | null | round(3 + 1.6·L) | both | "A roar of raw force that buffets everything before it." |
| `mon_banish_conduit` | Banish Conduit | damage | null | round(3 + 2.2·L) | companion | "A focused blow meant to shatter a summoner's bound servant." |

These are **spec examples only** — which monsters/bosses receive them is deferred to a monster-AI pass (out of scope, §6). The engine field is what this spec adds.

### 2.4 Techs — the Conjurer's new kit

All **APPENDED** to `js/data/techs.js`; all `classOnly: true, classId: 'conjurer'`. Two new tech-schema fields are introduced (both optional, back-compatible): `summonKind` (on `effect:'summon'` techs — which companion to bind) and `requiresCompanion` (on the command techs — the active companion element they need). Grades **[archived: `reference/manual/Recent_Updates.md`]**; magnitudes **[invented]**, **[sim-gated]**.

**Bind (summon) techs** — `effect:'summon'`, replace the active companion, restore it to full HP:

| id | name | chain | rank | skill | grade | energyCost | summonKind | desc |
|---|---|---|---|---|---|---|---|---|
| `tech_summon_fire` | Bind Salamander | null | 1 | null | Fire | 30 | `comp_fire` | "Bind an Ember Salamander to your side — a patient arsonist that sears foes over time. Replaces any companion already bound." |
| `tech_summon_water` | Bind Undine | null | 1 | null | Water | 30 | `comp_water` | "Bind a Tidal Undine — a healer that mends your wounds each round. Replaces any companion already bound." |
| `tech_summon_earth` | Bind Golem | null | 1 | null | Earth | 30 | `comp_earth` | "Bind a Granite Golem — a bulwark that draws blows away from you. Replaces any companion already bound." |
| `tech_summon_wind` | Bind Sylph | null | 1 | null | Wind | 30 | `comp_wind` | "Bind a Gale Sylph — a swift striker whose winds sharpen your own magic. Replaces any companion already bound." |

**Special-command techs** — cast on the player's turn, gated by the active companion via `requiresCompanion` (checked in `useTech` alongside the existing `Game.Classes.isClassTechUsable`); each pays the player's Energy through the normal `effectiveTechEnergyCost` path. Effects **[invented]**, **[sim-gated]**:

| id | name | effect | grade | energyCost | key fields | requiresCompanion | desc |
|---|---|---|---|---|---|---|---|
| `tech_cmd_conflagration` | Conflagration | damage | Fire | 24 | `power: round(10 + 1.2·L)`; detonates the enemy's active Burn: deals its remaining `dotPower·turnsLeft` immediately, then clears it | `comp_fire` | "Command the Salamander to blast the foe and ignite every smouldering wound at once." |
| `tech_cmd_renewing_tide` | Renewing Tide | heal | — | 22 | `power: round(18 + 1.4·L)` (heals player); `clearsStatus: true` (cleanses Poison/Curse, reusing the existing `clearsStatus` handler) | `comp_water` | "Command the Undine to wash over you — a surging heal that flushes out poison and curses." |
| `tech_cmd_bulwark` | Bulwark | buff | — | 20 | `statKind:'armor'`, `power: round(6 + 0.5·L)`, `buffDuration: 5` (existing typed-buff framework); also sets Taunt to 3 turns on the Golem | `comp_earth` | "The Golem raises a wall of stone — your Armor climbs and the foe fixes on your guardian." |
| `tech_cmd_tailwind` | Tailwind | buff | — | 20 | `statKind:'spellpower'`, `power: round(8 + 0.6·L)`, `buffDuration: 5` (existing typed-buff framework) | `comp_wind` | "The Sylph wraps you in a rising wind — your techniques strike harder." |

**Skill link (updated 2026-07-22 — user-directed).** All eight techs use `skill: 'Conjuration'` (was `null`): casting one flags Conjuration on the battle (`battle.techsUsedThisBattle`) so a win awards Conjuration skill XP via `onWin` — the same use-based rule every magic-school tech follows (`reference/manual/New_Player_Guide.md`; `reference/manual/Recent_Updates.md` 2007-08-02). Because `learnableTechs()` excludes `classOnly` techs, they still never appear in the Academy. Only `tech_cmd_conflagration` (the lone damage tech) additionally gains the standard magic-skill damage scaling (+15% at the 2·L+1 cap); the summon techs (no power) and the heal/buff commands grant XP but are unchanged in magnitude. Re-sim-confirmed (§3).

Notes: Conflagration's "detonate the DoT" is the one genuinely new tech behavior (a small `useTech` branch reading the enemy's `burn` status). Renewing Tide, Bulwark, and Tailwind reuse **existing** v1.8 handlers (`clearsStatus`, `statKind:'armor'`, `statKind:'spellpower'`) — no new engine work beyond the `requiresCompanion` gate. Burn DoT reuses the `bleed` tick shape in `tickMonsterStatuses` but carries `grade:'Fire'` so `applyResistance` treats it as Fire (a `debuffKind:'burn'` branch mirroring the existing `'bleed'` branch).

### 2.5 The Conjurer, redesigned (`js/data/classes.js`)

Tier/parent/unlock unchanged (Tier-3, `baseClass: 'wizard'`, sibling of `magus`, unlocked at L60). The two passives are **kept** (the `[archived]`-named Conjurer identity — energy for re-summoning, warding — already fits a pet-commander). The single servitor ability is **replaced** by **four per-element Pact abilities** (D4 resolved), each granting that element's Bind tech + special-command tech. This **intentionally exceeds** the standard Tier-3 budget: peers spend `3/3/5 = 11` class levels (`js/data/classes.js`); the redesigned Conjurer spends **`3/3` on passives + `3` per elemental = 21**. That is deliberate — a Conjurer brings one usable elemental online early and unlocks the rest with further class-XP investment, and there is **no hard class-level cap** (`js/core/classes.js` keeps awarding class levels from class XP, so full kit-out simply takes longer than a peer's). Proposed object:

```js
{
  id: 'conjurer',
  name: 'Conjurer',
  desc: 'A Wizard who binds living Anima into an elemental servant that fights at their side — ' +
    'commanding fire, water, earth, or wind. Where the Magus ends a fight in one verdict, the ' +
    'Conjurer wages it two-against-one. The Wizard\'s summon-based Tier-3 calling.',   // [revised] desc: now a true companion, not a rider
  tier: 3, baseClass: 'wizard', legendary: false,
  abilities: [
    { id: 'conjurer_bound_conduit', name: 'Bound Conduit', kind: 'passive',
      effect: 'energy_max_flat', power: 36, classLevelCost: 3,          // [archived-carried] unchanged
      desc: 'A deeper well of Energy, kept full for binding and commanding your elemental — flat +36 max Energy.' },
    { id: 'conjurer_warding_sigil', name: 'Warding Sigil', kind: 'passive',
      effect: 'magic_armor_flat', power: 12, classLevelCost: 3,          // [archived-carried] unchanged
      desc: 'A standing sigil of protective Anima — flat +12 Magic Armor.' },
    { id: 'conjurer_pact_fire', name: 'Pact of Cinders', kind: 'tech',
      techIds: ['tech_summon_fire', 'tech_cmd_conflagration'], classLevelCost: 3,   // [invented]
      desc: 'Bind the Ember Salamander and learn to command its Conflagration — a patient arsonist that burns foes over time.' },
    { id: 'conjurer_pact_water', name: 'Pact of Tides', kind: 'tech',
      techIds: ['tech_summon_water', 'tech_cmd_renewing_tide'], classLevelCost: 3,   // [invented]
      desc: 'Bind the Tidal Undine and learn its Renewing Tide — a healer that mends and cleanses you.' },
    { id: 'conjurer_pact_earth', name: 'Pact of Stone', kind: 'tech',
      techIds: ['tech_summon_earth', 'tech_cmd_bulwark'], classLevelCost: 3,         // [invented]
      desc: 'Bind the Granite Golem and learn its Bulwark — a guardian that draws blows away from you.' },
    { id: 'conjurer_pact_wind', name: 'Pact of Gales', kind: 'tech',
      techIds: ['tech_summon_wind', 'tech_cmd_tailwind'], classLevelCost: 3,         // [invented]
      desc: 'Bind the Gale Sylph and learn its Tailwind — a swift striker whose winds sharpen your magic.' }
  ]
}
```

This needs **one small class-schema extension**: `kind:'tech'` abilities may carry `techIds: [...]` (array) in addition to the existing single `techId` (here two tech ids per ability — a summon + its command). Back-compatible — every shipped ability keeps `techId`; `Game.Classes` grants either. **Design consequence of D4:** because the four elementals are separate purchases, a player may run only the elementals they have unlocked; the "one active at a time" rule (§2.1) still holds, they simply may own fewer than four to switch between until fully invested.

### 2.6 Round order (where the companion acts)

`finishRound(battle)` today: `runBossScript → monsterAct → tickPlayerStatuses → tickMonsterStatuses`. Proposed:

```
Game.Companion.act(battle)   // NEW — companion's automatic basic, on the player's turn, before the enemy
runBossScript(battle)
monsterAct(battle)           // now consults taunt + tech .target for its target
tickPlayerStatuses(battle)   // player poison/curse/buffs (unchanged)
tickMonsterStatuses(battle)  // enemy servitor(retired)/bleed/burn/debuffs
tickCompanionStatuses(battle)// NEW — decrements taunt; (future: companion-side DoTs)
```

The player's own **special-command** techs are their turn action (via `useTech`) and are independent of the automatic basic. `Game.Companion.act` and every companion roll route through the single RNG surface `Game.Battle._rng` (CLAUDE.md cardinal rule; `js/core/battle.js`) — **no second RNG**.

**Battle-end write-back (`js/core/battle.js` `onWin`/`onLoss`/`endBattle`):** on a won/fled/monster-fled end, `battle.companion.hp` is written back to `character.companion.hp` (persists). On `onLoss`, `character.companion` is set to `null` (D6 — dispersed).

---

## 3. Balance rationale & sim gate

**Formula provenance** (from `js/balance.js` / `js/data/monsters.js` header / cheat-sheet §Balance):
- Companion **damage** uses `power` through the *existing* `techEffectivePower` so it scales identically to player techs and inherits Fear (`fearMultiplier`) and resistance (`applyResistance`) exactly as the servitor already does (`js/core/battle.js` `tickMonsterStatuses`). Wind's basic power `≈8+1.1·L` is anchored a little above a mid player nuke (the DPS role); Earth's `≈4+0.5·L` sits well below (it earns its keep by tanking, not hitting).
- Companion **HP** is anchored to the monster HP curve `20 + 12·L` (`js/data/monsters.js`): Earth's `40+8·L` ≈ two-thirds of a same-level monster's HP (a credible damage sponge); the DPS/healer kinds sit at ~a third so focus-fire kills them in a few hits and forces a re-summon.
- Companion **armor** follows the monster guideline `armor ≈ L`: Earth at `≈1.0·L` reads like a same-level monster wall; the others near-zero, so redirecting a hit onto a squishy elemental is a real risk, not a free block.
- **Energy** costs (basic 4–6, specials 20–24, binds 30) are set against the Conjurer's Energy pool (`START_ENERGY 100 + 5/level` from `js/balance.js`, plus Bound Conduit's +36) so a per-round basic is affordable but competes with the player's own techs — the intended tension. Bind cost 30 ≈ the retired servitor's 35, so re-summoning stays a meaningful tax.

**New constants to add to `js/balance.js`** (all **[invented]**, each carrying a citation comment per house style; the per-kind HP/armor/power coefficients live as data in `js/data/companions.js`, only the global levers live here): `COMPANION_MAX_ACTIVE = 1`; `COMPANION_TAUNT_TURNS_BASIC = 2`; `COMPANION_TAUNT_TURNS_BULWARK = 3`; `BURN_TURNS = 2`. No number is locked until the sim signs off.

**Sim gate** (mandatory `/balance-sim` before any of these locks; difficulty contract from cheat-sheet §Balance — at-level regulars ≥85–100% player win; bosses winnable but costly; 5-levels-down = certain death via Fear):

| # | Constant(s) | Metric to check | Contract it must uphold |
|---|---|---|---|
| S1 | All four `hpBase`/`hpPerLevel` | Rounds a companion survives under focus fire at-level and at +3/+5 levels | A companion must be killable (esp. DPS/healer kinds); 5-down Fear still kills the *player* despite the pet |
| S2 | Basic `power` per element (esp. Wind) + basic `energyCost` | At-level win %, rounds-to-kill, player HP-left, damage-per-Energy | Regulars stay ≥85–100% but the companion must not trivialise them (watch for <2-round kills) |
| S3 | `comp_fire` Burn (`dotPower`,`dotTurns`) + Conflagration detonation | DoT share of total damage; burst spike on detonate | No one-shot; DoT+detonate must not exceed a Magus burst of equal investment |
| S4 | `comp_water` basic heal + Renewing Tide `power` | Player effective-HP over a boss fight; sustain ratio | Must **not** re-introduce the "Fear-spared healing sustain" exploit already flagged in `docs/DESIGN.md` §4 / `CLAUDE.md` — healer companion cannot make 5-down fights survivable |
| S5 | `comp_earth` HP/armor + Taunt turns + Bulwark mitigation | Damage redirected off player; boss single-hit spike vs companion HP | Earth soaks meaningfully but a boss charged hit still threatens; taunt cannot perma-lock a boss into a stone wall |
| S6 | `comp_wind` Tailwind `spellpower` buff + basic power | Player tech damage uplift; combined player+pet DPS | Buff+DPS combined stays within the regular/boss bands |
| S7 | `mon_cleaving_roar` / `mon_banish_conduit` power + `target` handling | Companion & player damage from `'both'`/`'companion'` specials | Enemy specials give counterplay without making a bound companion strictly punishing to run |

---

### Sim results — LOCKED 2026-07-22 (lead `/balance-sim`, 300 trials/cell, seeded mulberry32, modest-geared L60 caster-Conjurer fixture)

| Cell | none | Fire | Water | Earth | Wind |
|---|---|---|---|---|---|
| At-level regular (L60) — win% | 99% | 100% | 100% | 100% | 100% |
| — avg rounds | 8.7 | 4.9 | 7.5 | 6.7 | 3.6 |
| — avg HP left | 52% | 62% | 86% | 86% | 72% |
| 5-down (L66, +6) — win% *before* ratchet | 0% | — | 0% | — | **87% (FAIL)** |
| 5-down — win% *after* ratchet | 0% | 0% | 0% | 0% | 0% |

**Contract outcome:** at-level regulars pass (≥85–100%); the 5-down=certain-death contract was **violated by the Wind companion (87%)** and restored to ~0% across all four by the ratchet below. Earth's Taunt correctly draws focus (disperses ~28–31% under a `target:'both'` cleave), the other kinds are rarely hit. Wind is the strongest at-level (3.6 rounds) — within contract, flagged for optional future down-tuning if a boss pass wants it.

**Conjuration-skill re-sim (2026-07-22, Conjuration at cap — worst case for Conflagration's new skill-scaling):** at-level Fire 100% win / 4.5 rounds (was 4.9), Wind unchanged (Tailwind is a buff, no scaling), 5-down all four still 0%. Linking the techs to Conjuration is balance-safe.

**Ratchet applied (new-mechanic only, no shipped constant touched):** `BALANCE.COMPANION_FEAR_SUPPRESS_LEVELS = 5` — a companion draws on the player's Anima, so at/beyond the archived 5-level Fear cutoff (`reference/manual/Fear.md`; DESIGN §4) it is overwhelmed and idles (`js/core/companion.js act()`). Triggers only in the certain-death zone, so at/near-level play is unaffected (verified). Covered by `tests/test_companion.js` Test 11.


## 4. Conventions & handoff checklist

- [x] **Drop tables / stock lists:** none touched. All new techs/monster-techs are **APPENDED** to `js/data/techs.js` (no index shift). New `js/data/companions.js` is additive.
- [ ] **Icons (test-enforced, `tests/test_icons.js`):** new 32×32 CC0 "Dungeon Crawl 32×32" PNGs (hash-distinct) required in `assets/icons/` for: `comp_fire`, `comp_water`, `comp_earth`, `comp_wind`, `tech_summon_fire`, `tech_summon_water`, `tech_summon_earth`, `tech_summon_wind`, `tech_cmd_conflagration`, `tech_cmd_renewing_tide`, `tech_cmd_bulwark`, `tech_cmd_tailwind`, `mon_cleaving_roar`, `mon_banish_conduit`. Confirm whether `test_icons.js` iterates companion-kind ids; if not, companion portraits may render from the summon-tech icons (implementer to verify).
- [x] **Ids:** snake_case with type prefixes — `comp_` (companion kinds), `tech_summon_*` / `tech_cmd_*` (player techs), `mon_` (monster techs), `conjurer_pact_*` (class abilities). Compliant.
- [ ] **Class-level budget (D4):** the Conjurer's ability total rises from the standard `11` to `21`. Confirm no code assumes a fixed per-class ability-cost sum; `js/core/classes.js` has no hard cap, so this is data-only — but any test asserting a Tier-3 ability count/cost total must be updated.
- [ ] **Quest gates/chains:** none added. (Conjurer already unlocks via the existing "The Master's Calling" chain in `js/data/quests.js`; no change.)
- [ ] **Save impact — YES.** New persisted field `character.companion` → bump `js/core/save.js CURRENT_VERSION` **10 → 11**; add migration step `if (version === 10) { if (state.character && typeof state.character.companion === 'undefined') state.character.companion = null; version = 11; }`; add it to `character.js create()` as `companion: null`; add a migration test (extend the v1→current chain, pattern in `tests/test_p5_quests.js`). **`js/data/changelog.js` top entry must carry `saveVersion: 11`** or `tests/test_reload.js` fails (it asserts the two match).
- [ ] **Tests affected:** `tests/test_p6_classes.js` **Test 24** (the servitor test) must be rewritten for the new system; `tests/test_p6b_content.js` hardcoded content-counts (tech count, class-ability count) go stale and must be updated; `tests/test_p3_battle.js` risk — new `Game.Companion.act` call in `finishRound` changes RNG call ordering, so its hand-rolled fixtures may need re-stubbing; add a new engine suite (pattern: `tests/test_v18_engine.js`) covering summon/switch/persist-across-battle/death-resummon/taunt-redirect/`target:'both'`/Energy-starve-idle/Burn-detonate. All suites must pass (`cd tests && for t in test_*.js; do node $t; done`).
- [ ] **Changelog:** PREPEND to `js/data/changelog.js`, player-facing, `saveVersion: 11`. Draft: *"The Conjurer walks with a servant again — and this time it fights. Bind one of four elementals (Salamander, Undine, Golem, or Sylph); it battles at your side, keeps its wounds between fights, and answers your commands. Fire burns, Earth guards, Water mends, Wind quickens."*
- [x] **No copyrighted names/creatures:** Salamander/Undine/Sylph (Paracelsian, public domain), Golem (folklore, public domain).
- [x] **DESIGN.md:** update §3 (Conjurer) and §4 (add the companion/targeting subsystem) to describe the `[revised]` 1v1 override (D0 approved) and the new framework, and update the three guardrail comments to cite this spec.

---

## 5. Open decisions — ALL RESOLVED 2026-07-22

| # | Decision | Resolution | Effect on spec |
|---|---|---|---|
| **D0** | `[revised]` override of the archived "1v1 / no summons in battle" guardrail (`reference/forum/t-449.md`, re-affirmed in `docs/DESIGN.md`, `docs/SPEC-TIER3-EXPANSION.md`, `docs/SPEC-V1.5-MONSTER-AI.md`). | **APPROVED.** The override is authorised; a true second combatant is in scope. | The three guardrail comments get updated to cite this spec as the authorising `[revised]` (§4). |
| **D1** | Reusable framework vs. Conjurer-only. | **Class-agnostic framework** (`Game.Companion` + `js/data/companions.js` as the extension point). | As specced (§2.1); future pets/mounts plug in. |
| **D2** | Fate of the outgoing companion when switching. | **Discard; new one arrives at full HP.** No HP banking. | §2.1 updated — one HP slot, one persisted field. |
| **D3** | Out-of-combat mending. | **Water elemental / re-summon only.** Inns & camps do **not** heal the companion. | §2.1 updated; preserves the Water elemental's niche. |
| **D4** | Conjurer ability layout. | **Four per-element abilities** (Pact of Cinders/Tides/Stone/Gales), each granting a summon + its special. | §2.5 rewritten; class-level budget rises from 11 to 21 (intentional; no hard cap — players unlock elementals progressively). |
| **D5** | Companion scaling input. | **HP/armor: character level only. Damage: also Intelligence** (free via `techEffectivePower`'s existing Int multiplier). | §2.2 note added; HP formulas take `L` alone. |
| **D6** | Fate on player defeat. | **Disperse on defeat** — a lost battle sets `character.companion = null`; must re-summon. | §2.1 & §2.6 updated — extra Energy tax on dying. |

---

## 6. Out of scope

- **Which monsters/bosses gain `target:'companion'`/`'both'` specials** — this spec adds the engine field and two example techs; assigning them across the bestiary is a separate monster-AI pass (`docs/SPEC-V1.5-MONSTER-AI.md` territory).
- **Companion leveling/XP/gear** — companions scale off the player's level; they do not earn XP or wear equipment (the archived Eidolon precedent also gave companions no XP, `reference/manual/Version_3.0.md`).
- **v3.0 systems** — Eidolon collection, elemental *alignment* percentages, Force/Cunning/Brilliance (`reference/manual/Version_3.0.md`) are out of scope per the target-era rule; used here only as flavor lineage.
- **Non-Conjurer companion sources** (tamed pets, quest-reward summons) — enabled by the framework but not designed here.
- **UI/rendering** of the companion's HP bar and command buttons — NOW SPECCED in §7 (v1.9.1 follow-up).
- **Implementation** — this deliverable is the design spec. Building it follows the repo's own `CLAUDE.md` workflow (Fable lead → Sonnet subagents, `/balance-sim` before locking any S1–S7 number, `/delegate-review`, all suites green).

## 7. Companion UI (v1.9.1 — UI-only follow-up)

`[invented]`; **no combat effect, no save impact, no sim.** The v1.9 engine shipped headless (§6 deferred it). This renders existing state (`battle.companion`, `character.companion`) via the `el()` helper (js/ui/screens.js) and touches no combat math. The battle "Your Vitality" panel it extends is `[archived: reference/manual/New_Player_Guide.md]` ("Battling": HP/Energy/XP bars + a fourth yellow Fear bar); the companion additions are `[invented]` (the original's pet screen, `heropet.php`, was login-walled in the scrape — `reference/SOURCES.md` — so no layout survives to copy).

### 7.1 In battle — the ally on "Your Vitality"
`renderBattle` (js/ui/screens.js), after the player HP/Energy/XP/Fear/Fury bars and before the action buttons, rendered only when `battle.companion` is non-null:
- Icon row: `Game.UI.icon(kindId, 32)` + the companion's name.
- HP bar via the existing `battleBar('Ally', 'companion', hp, hpMax)` helper (new `companion` bar color).
- A one-line state note (`tinyfont`), whichever applies: **overwhelmed** (`fearLevels >= COMPANION_FEAR_SUPPRESS_LEVELS`) → "cannot act while you are this outmatched"; **taunting** (`Game.Companion.tauntActive`) → "drawing the enemy's attacks onto itself"; **destroyed** (hp 0 mid-battle) → "bind a new elemental to summon one again"; else a short element/role blurb.
The four command techs already render as castable tech-grid slots (they are techs) — no new casting UI. `[invented]`

### 7.2 Out of battle — the Status screen
`renderStatus` (js/ui/screens.js): a "Companion" row in the identity/level table — bound kind name + `current hp / Game.Companion.hpMaxFor(c)`, or "None bound". Makes the semi-permanent carries-between-fights HP legible so the player knows to re-bind or heal before the next fight. `[invented]`

### 7.4 Persistent header (top status bar)

`Game.renderStatusBars` (index.html) — the always-visible character overview (name/class/level, HP/Energy/XP bars, Weight/Gold). When `character.companion` is non-null, a compact "Companion: <name>" line + an "Ally" HP bar (companion color) are appended after the XP bar; hidden entirely when no companion is bound. During a battle it reads the **live** `battle.companion` HP (the header re-renders each action via `refreshBattleScreen`), so it tracks the "Your Vitality" panel round-by-round; out of battle it reads the persisted `character.companion.hp` that carries between fights. `[invented]` (user-directed follow-up, 2026-07-22).

### 7.3 Files & handoff
- `js/ui/screens.js` — companion block in `renderBattle`; Companion row in `renderStatus`. `index.html` — companion line + Ally bar in `renderStatusBars` (§7.4). DOM-only, guarded for a null companion and for the fakedom harness.
- `css/theme.css` — `.statbar-fill.companion` (Anima purple `#7a4dbd`), matching the hp/energy/xp/fear bar convention.
- No save impact, no new balance constants, no new ids/icons (reuses the companion-kind icons). `test_p3_battle` renders the battle screen under fakedom — the block must not crash it (guarded).
- **Real-browser check recommended** (fakedom misses layout/scroll/focus): bar widths, panel placement, icon render.
