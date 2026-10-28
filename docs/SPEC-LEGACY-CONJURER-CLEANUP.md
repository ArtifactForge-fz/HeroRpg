# SPEC — Legacy Conjurer cleanup (clear the retired Summon Elemental from old saves, refund its levels)

**Status:** IMPLEMENTED in v1.11.0 (commit `a0b6cab`, branch `v1.11-hero-tree`), open PR 4 (`v1.11-hero-tree` → `main`); not merged, released or deployed. D0–D2 resolved by the user 2026-10-23 (§5): ships inside v1.11 (option B), with the refund and the one-time notice. Authored 2026-10-23 (user-directed: "start on #5", the
top item of the v1.9 review queue in `CLAUDE.md`, item 4: "This one is live for real players — fix
it first").
**Relationship to authority:** fixes a data-migration gap left by `docs/SPEC-COMPANION-SYSTEM.md`
(v1.9, D0/D4), which retired the Conjurer's original signature. No game rule changes. One
deliberate break with an in-repo precedent (D1, the refund) is flagged below.

**Interpretation of the request (confirm — D0):** clean up every save that still carries the
Conjurer's retired **Summon Elemental** — the dead technique and the dead ability — and give back
the 5 Class Levels the player spent on it, so a v1.8-era Conjurer can buy a Pact with them. Because
real players are on v1.9 (save v11) **today**, the fix is designed to run on every load,
independent of the save version, so it can ship as a hotfix on `main` *and* ride along in v1.11.
The alternative — folding it into the unreleased v11→v12 migration only — would leave live players
waiting for v1.11 (D0).

---

## 1. What is wrong today

v1.9 (`docs/SPEC-COMPANION-SYSTEM.md`) replaced the Conjurer's single signature, the ability
`conjurer_summon_elemental` (cost **5** Class Levels) granting the tech `tech_summon_elemental`, with
four Pact abilities. The data entries were removed, but the v10→v11 migration
(`js/core/save.js`, `if (version === 10)`) only adds `character.companion = null`. A Conjurer who
bought Summon Elemental before v1.9 still has:

| Leftover | Where in the save | What the player sees today |
|---|---|---|
| `tech_summon_elemental` | `c.techs` | A dead entry; casting it logs "Unknown technique." (`js/core/battle.js`) |
| `tech_summon_elemental` | any `c.techSets[n][slot]` | A dead tech-bar slot |
| `conjurer_summon_elemental` | `c.classes.conjurer.abilities` | Nothing visible; the id resolves to no ability |
| 5 spent Class Levels | `c.classes.conjurer.classLevelsSpent` | Burned. A class-level-8 Conjurer has 3 free instead of 8: one Pact (cost 3) instead of two |

Verified by the v1.9 lead review (probe, `CLAUDE.md` v1.9 item 4): no crash, screens render.

**Scope check — nothing else is affected.** A scan of every `js/data/techs.js`, `js/data/classes.js`
and `js/data/items.js` version in git history against today's data finds exactly **one** retired
tech id (`tech_summon_elemental`), **one** retired ability id (`conjurer_summon_elemental`) and
**no** retired item ids. (The v6→v7 Rogue→Thief re-id already has its own migration.)

---

## 2. Design

### 2.1 A retired-id sweep that runs on every load

In `js/core/save.js`, a new `sanitizeRetired(state)` runs inside `migrate()` right before
`if (version === CURRENT_VERSION) return state;` — so it runs on **every** load and import, on every
save version, after all version steps. **[invented]**

Two module-level tables, so a future retirement is one line each:

```js
// Ids removed from js/data — kept here so old saves are cleaned on load (SPEC-LEGACY-CONJURER-CLEANUP).
var RETIRED_TECHS = ['tech_summon_elemental'];            // v1.9, SPEC-COMPANION-SYSTEM D4
var RETIRED_ABILITIES = {                                 // classId -> { abilityId: classLevelCost refunded }
  conjurer: { conjurer_summon_elemental: 5 }              // v1.9, cost per js/data/classes.js @ v1.8
};
```

| # | Rule |
|---|---|
| C1 | Remove every `RETIRED_TECHS` id from `c.techs`. |
| C2 | Set every `c.techSets[n][slot]` holding a `RETIRED_TECHS` id to `null` (same as an empty slot). |
| C3 | For each class in `RETIRED_ABILITIES` present in `c.classes`: remove each listed ability id found in `abilities`, and for each one removed lower `classLevelsSpent` by its cost, floored at 0. |
| C4 | **Idempotent.** The refund only happens when the ability id is actually removed, so a second load changes nothing. A save that never had the ids is untouched. |
| C5 | Guarded like the rest of `migrate()`: missing `c.techs` / `c.techSets` / `c.classes` entries are skipped, never created. |
| C6 | Battle state is never persisted, so no in-battle summon can survive (nothing to clean there). |

Why not a generic "drop any id that isn't in `Game.Data`" sweep: if a data file ever failed to load,
a generic sweep would silently delete a player's real techs. An explicit table can only ever remove
ids we deliberately retired. **[invented]**

### 2.2 Telling the player (D2)

`sanitizeRetired` returns what it changed. `Game.Save` keeps it in a **transient**
`lastLoadNotes` array (never written to the save). After the boot-time load, the UI shows each note
once with `Game.UI.toast`:

> *"Summon Elemental has been retired from the Conjurer's teachings. The 5 Class Levels you spent
> on it have been returned — visit an Academy to learn a Pact."*

Shown only to affected players, once (the next load finds nothing to clean). Plus one changelog
highlight in whichever release ships this.

### 2.3 Delivery (D0)

| Option | How | Who gets it when |
|---|---|---|
| A — hotfix on `main` | v1.9.1: `sanitizeRetired` + notice + tests on `main`, changelog + README bump, **no save-version change** (stays 11). Then merge `main` into `v1.11-hero-tree` (one small conflict area in `save.js`, both sides additive) | Live players on the next deploy |
| **B — ride with v1.11 (chosen, D0)** | Add it on the `v1.11-hero-tree` branch only | Live players only when v1.10/v1.11 ship |

Both work unchanged, because the sweep doesn't depend on the save version.

---

## 3. Balance rationale & sim gate

No combat constant changes. The refund gives back exactly what was spent (5 Class Levels =
`conjurer_summon_elemental.classLevelCost` in `js/data/classes.js` at `df40f22`). A refunded level-8
Conjurer can afford two Pacts (3 + 3) instead of one — the same as a Conjurer created after v1.9.
**No sim gate needed.**

---

## 4. Conventions & handoff checklist

- [x] Drop tables, icons, quests, ids: not touched
- [x] **Save impact: none on the format.** No new persisted field, no version bump; `lastLoadNotes`
  is transient. Works for save v11 (live) and v12 (v1.11)
- [ ] `js/core/save.js`: `RETIRED_TECHS`, `RETIRED_ABILITIES`, `sanitizeRetired`, `lastLoadNotes`
  exported read-only; cite this spec
- [ ] Boot code (`index.html` / `js/ui/screens.js`, wherever the load result is applied): toast each
  note once
- [ ] **Tests (new):** a v10 save with a legacy Conjurer (tech in `c.techs` and in two tech-set
  slots, ability bought, `classLevelsSpent` 8) loads with the tech gone from both, the ability gone,
  `classLevelsSpent` 3, one note; loading again changes nothing and gives no note; a Conjurer that
  never bought it is untouched; a non-Conjurer save is untouched; `classLevelsSpent` 2 with the ability
  floors at 0; the full v1→current chain still passes. In `tests/test_companion.js` (v1.9 home of the
  Conjurer migration test)
- [ ] `docs/SPEC-COMPANION-SYSTEM.md`: one line pointing to this spec in its migration section;
  `CLAUDE.md` v1.9 item 4 marked fixed
- [ ] Changelog (draft): *"Old Conjurers made whole. If your Conjurer learned Summon Elemental before
  the companion update, that retired technique is now cleared away and the 5 Class Levels you spent
  on it are returned, ready for a Pact."*

---

## 5. Decisions (resolved by the user, 2026-10-23)

| # | Question | Decision |
|---|---|---|
| **D0** | Ship as a v1.9.1 hotfix on `main` now (A), or only inside v1.11 (B) | **Resolved: B — inside v1.11 only.** The sweep is version-independent, so nothing in §2.1 changes; it goes on branch `v1.11-hero-tree` |
| **D1** | Refund the 5 Class Levels. This breaks the in-repo precedent of the v6→v7 Rogue→Thief migration, which deliberately refunded nothing ("spent levels are spent", `js/core/save.js`). | **Resolved: refund.** There the player kept a class they chose; here the game took the ability away, and the v1.9 review already called the burned levels a defect |
| **D2** | Show a one-time in-game notice, or changelog only | **Resolved: notice.** Affected players otherwise find 5 surprise free levels and a missing technique with no explanation |

---

## 6. Out of scope

- The other v1.9 review items (PR #1's missing spec, the unsimmed tech ranks, the companion +4 cliff).
- Any change to the Pacts, the companion, or Conjurer balance.
- A generic dead-id sweep (rejected in §2.1).
