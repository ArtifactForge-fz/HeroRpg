# SPEC-V1.7-CONTENT-UX — quest arc, Arkan parity, destinations UI

Status: **DRAFT — in progress.** Origin: user requests 2026-07-17 (post-v1.6): (1) quests are
front-loaded in the first town — spread them into an arc across town taverns; (2) address the
backlogged Arkan feedback; (3) a clearer destinations UI (cards, level ranges). User-gated scope
decisions (2026-07-17): **full quest redistribution** (incl. class advancement), Arkan **A2** (new
doorstep foe), Arkan **B2 + bridge quests**. Shipped base: v1.6.0, save version 10. **No
save-version bump expected** (data + UI only; no persisted character field).

## 1. Phase U — Destinations UI (`js/ui/screens.js` renderExplore)

Replace the `stat-row` table (~L1176) with a **card grid**. Each destination card shows: area
name + a **Town / Wilds** badge, a **recommended level range** (min–max of the area's monster
levels; for a lair area include the lair boss level; towns show "Town · enter at Lv N"), the
description, and either an **Explore** button or a locked "Requires Level N" state.
- **Home-town exemption (closes the backlogged Arkan travel-UI bug):** a card is locked by
  `!isHome && c.level < dest.minLevel`, where `isHome = Game.Character.homeTownId(c) === dest.id`
  — mirroring `Game.World.travelTo` so an Arkan sees Saratus reachable pre-L14. `[revised]`
- Responsive, theme-agnostic (reuse existing CSS tokens); browser-verify (fakedom can't catch
  layout). No new persisted state.

## 2. Phase Q — Quest arc redistribution (`js/data/quests.js`, `js/data/areas.js`)

**Principle:** each town tavern owns the quests in its level band; giver `areaId` + `npc` (+ title/
intro text for re-homed class quests) change, but quest ids, objectives, chains, and rewards do
NOT (ids are referenced by saves/tests). Reachability is absolute: **giver town minLevel ≤ quest
levelMin**. Chains preserved (a follow-up's giver must be reachable when its prereq completes).

**Enabler:** add a **tavern** facility to `kastengard_vanguard_camp` (L26) so the L26-40 band has a
hub. `[invented]`

**Redistribution map** (only rows that MOVE; all others stay):

| Quest | L | old giver → NEW giver | note |
|---|---|---|---|
| ruin_warden_boss | 8 | eldor → **laik** | |
| synthesis_supplies | 9 | eldor → **jumak_village** | |
| gares_riverbanks_1 | 9 | jumak_village → **laik** | chain stays reachable (Laik L8) |
| gares_riverbanks_2 | 11 | jumak_village → **laik** | |
| kastengard_investigation | 26 | saratus → **kastengard_vanguard_camp** | |
| trials_of_eldor (CLASS advanced) | 30 | eldor → **kastengard_vanguard_camp** | re-theme giver/title to the Vanguard/Society outpost; class-choice mechanic unchanged |
| vaultbreakers_reckoning (CLASS) | 33 | eldor → **kastengard_vanguard_camp** | re-theme |
| echo_of_eidas | 36 | eldor → **kastengard_vanguard_camp** | |
| masters_calling (CLASS tier3) | 60 | eldor → **kuraan_reclamation_camp** | re-theme to the reclamation master; mechanic unchanged |
| what_the_society_grew | 86 | frosthold → **skyspire_landing** | |
| the_societys_last_stand | 90 | frosthold → **skyspire_landing** | |
| the_red_moon_crossing | 91 | frosthold → **skyspire_landing** | |
| what_rennick_deciphered | 96 | frosthold → **skyspire_landing** | |
| the_ascendants_fall | 100 | frosthold → **skyspire_landing** | |

**Stays at Eldor (reachability-forced):** the L1-5 intro chain + `first_calling` (L5) — no town
but Eldor is reachable below L6, so the base-class *obtain* quest must start here. (Class
*advancement* redistributes per the map; base obtain cannot.) Arkans get their own base-class quest
at home via Phase R-B2.

**Result:** Eldor 12→6, Ju'Mak→3, Laik→4, Saratus→4 general (+Arkan), Kastengard 0→4 (new hub),
Kuraan→7, Frosthold 12→7, Skyspire 0→5. Every town owns its band.

**Tests:** each moved quest is offerable at its new giver town at its levelMin and NOT before its
town's gate; chains still complete end-to-end; no quest is stranded (a connectivity walk); update
the per-area quest-count constants the suites hardcode (never weaken an assertion).

## 3. Phase R — Arkan parity (`js/data/areas.js`, `js/data/monsters.js`, `js/data/quests.js`)

Locks the SPEC-ARKAN-DIFFERENTIATION.md §5 decisions: **A2** + **B2 + bridge quests**.

### R-A (doorstep — A2)
- **A1 floor:** add the 2 missing regional monsters (`plains_vermin_swarm`, `plains_cutpurse_vole`)
  to `saratus_plains` so it's no longer a strict subset of the Human plains. `[revised]`
- **A2 foe:** add a new Arkan-cultural low-level enemy — **`saratus_wardframe`** (a runic training
  construct; Arkan magic-and-technology culture, echoing the Kastengard constructs) — to
  `saratus_plains`, plus one rune-etched forage token. **Stats LOCKED by the lead sim (§5 below);
  needs a byte-distinct icon (lead-sourced); appended drop entry (top-down, first-hit-wins).**
  `[invented]`, Arkan.md-anchored.

### R-B (class/quest parity — B2 + bridge)
- **B2:** add an **Arkan base-class quest** given in **Saratus** (Battlemage Instructor Renjiro),
  `requiresRace: 'Arkan'`, granting the same `rewards.classChoice: ['warrior','magician','thief']`
  as `first_calling` (no new class code). Kill step targets a monster present in `saratus_plains`
  after R-A. Reachable at L5 because Arkans START in Saratus (home-town). `[invented]`, mechanism
  `[archived]`.
- **Bridge (B-fill):** add 1-2 low-level Arkan racial quests to carry the Arkan's own city across
  the L1-13 gap into the existing L14 Saratus line (runic-training / Majiku-scouting threads,
  reference-flavored). `[invented]`
- Higher class quests (advanced/tier-3) are NOT Arkan-mirrored — after Phase Q they live at
  Kastengard/Kuraan, reachable by both races; that's the shared mid/late arc.

**Tests:** new monster huntable + drops (stubbed RNG); a fresh **L1 Arkan** has a class-obtain path
in Saratus (B2 offered, kill target present in saratus_plains); new Arkan quests are
`requiresRace`-gated (Humans can't accept); a pre-existing Arkan save still loads coherently.

## 4. Save/version/tests
No save-version bump (all data + UI). Do not rename existing ids. New monster id needs a
hash-distinct icon (`test_icons.js` Test 2); forage token may reuse a tile. All ten suites green
per phase.

## 5. Wardframe sim gate (lead) — LOCKED

`saratus_wardframe` LOCKED stats (scratchpad `sim_v17_wardframe.js`, 300-400 trials, L3 warrior +
L3 caster fixtures, real formula): **level 3, hp 56 (20+12·3), damage 9 (3+2·3), energy 70
(40+10·3), armor 4, magicArmor 6, xp MONSTER_XP(3)=45, shardChance 0.05, gold 2-6.** A runic
construct: **armor kept at 4** (armor 8 over-armored → warrior stalled to 77% win / 20 rounds, the
documented melee-stall pitfall; armor 6 was grindy at 13 rounds), identity comes from the elevated
**magicArmor 6** (resists magic, weak to melee). Verified: warrior 100% win / 68% HP / 9.4 rounds,
caster 100% win / 82% HP / 5.8 rounds — in contract (≥85%), no stall. Drop table: one appended
rune-etched forage/quest token (top-down, first-hit-wins). Needs a byte-distinct icon (`test_icons`
Test 2), lead-sourced.

## 6. Phase W — Reference wiki (new request 2026-07-17)
A browsable, in-app **reference wiki** generated from `Game.Data` (mirrors the standalone
`changelog.html` pattern, linked from the game footer): sections for **Items** (stats/value/where
sold or dropped), **Monsters** (level/hp/damage/armor, gold/xp, and **drop tables with rates**,
where found), **Areas** (level range, monsters, forage), **Techniques**, and **Recipes**. Static,
self-contained, reads the same `Game.Data.*` the game loads — no data duplication. Add `wiki.html`
to `tools/deploy.sh`'s find list (CLAUDE.md: a new root HTML page won't upload otherwise). `[invented]`

## 7. Phases & delegation
P-U (UI, delegate + browser review) · P-Q (quest arc + Kastengard tavern, delegate) · P-R (Arkan
content, delegate — Wardframe **stats LOCKED §5** + **icon installed** `assets/icons/saratus_wardframe.png`)
· P-W (reference wiki, delegate + browser review) · P-Rel (release; deploy/merge/push user-gated).
U ∥ Q may run in parallel (disjoint files: screens.js vs quests.js/areas.js); R follows Q (shared
quests.js/areas.js); W after R so the wiki documents final v1.7 data.
