# SPEC — v1.2 "Living Skills, Full Classes, World Fill"

**Status:** In progress (branch `v1.2-skills-classes-content`). Authored 2026-07-10 by the lead.
**Authority:** extends `docs/DESIGN.md`; every number tagged `[archived]`/`[invented]`/`[revised]`
per Cardinal Rule 1. Implementation is delegated to Sonnet subagents per phase; the lead reviews
each delivery (run all 10 suites, read risky modules, sim-check balance) before the next phase.

**Explicitly NOT in scope:** `docs/SPEC-FULL-LEVEL-ARC.md` (the 100-level arc) is a *later*
version. v1.2 stays within the existing ~1–40 range. We DO, however, build the **three-tier class
machinery** now so the arc can extend it without a refactor (arc §5).

Origin: a fidelity review vs `reference/` (14 findings) + user directive to add the "era 3"
(tier-3) classes. Findings #5-Haunting already shipped; this spec addresses the rest.

---

## Save-version plan (coordinate across phases)

Current CURRENT_VERSION = 8. v1.2 introduces exactly one new persisted character field:
- **`c.equipment.offhand`** (Dual Wield, Phase 1) → default `null`.

So a single bump **v8 → v9** in Phase 1 covers the whole version. Later phases add only data
(classes, items, areas, quests, shrine buffs, techs) and battle-scoped/transient state (Curse
status), which need **no** migration. The Runeblade tier renumber (Phase 2) is a data change, not
a save-shape change. If any later phase discovers it needs a new persisted field, it bumps to v10
with its own migration + v1→v10 chain test — but the plan is one bump only.

---

## Phase 1 — Combat engine: use-based skills + fidelity fixes

One agent owns `js/core/battle.js`, `js/core/character.js`, `js/core/inventory.js`,
`js/balance.js` (+ minimal `js/ui/screens.js` for the offhand slot and skill-effect display) to
avoid battle-engine merge conflicts. **Hard gate:** re-run the boss/at-level difficulty sims and
confirm the archived contract still holds (at-level regulars ≥85–100% win; 5-levels-down = death
via Fear; bosses cost HP/consumables) — these skill bonuses compound, so tune caps DOWN if the
contract breaks, and report the numbers.

All constants below are `// invented (user-directed): use-based skill system` unless noted.
Grounding: skills are archived as "the level at which your Character performs a certain action"
(`reference/manual/Skills.md`) and improve by use — so higher skill = better performance, and the
skill must gain XP from the very action it governs. Numbers are the lead's starting caps; the
agent tunes within them and sim-verifies.

**1. Weapon skill → damage (review #1).** The equipped weapon's `.skill` already selects the
damage STAT; now the character's *level* in that skill adds damage. In `Character.getDamage`, apply
`× (1 + min(WEAPON_SKILL_DAMAGE_PER_LEVEL × skillLevel, WEAPON_SKILL_DAMAGE_CAP))` where skillLevel
is `c.skills[weapon.skill].level`. Constants: `WEAPON_SKILL_DAMAGE_PER_LEVEL = 0.015`,
`WEAPON_SKILL_DAMAGE_CAP = 0.30`. Rods count (a Rod is the caster's weapon) but spell damage scales
off Intelligence, not weapon Damage — so Rods-skill damage only matters if a Rod is meleed with;
keep the term general (any equipped weapon). This finally makes Rods-skill non-inert.

**2. Armor skill → armor (review #1).** Each equipped armor piece's effective armor scales by the
character's level in that piece's armor `skill` (Light/Medium/Heavy for body/head/legs/feet per the
item's skill; Shields for the shield slot). In `Character.getArmor`/`getMagicArmor` (or the
`equippedArmorTotal` path in inventory.js), multiply each piece's `armor`/`magicArmor` by
`(1 + min(ARMOR_SKILL_ARMOR_PER_LEVEL × skillLevel, ARMOR_SKILL_ARMOR_CAP))`. Constants:
`ARMOR_SKILL_ARMOR_PER_LEVEL = 0.02`, `ARMOR_SKILL_ARMOR_CAP = 0.40`. NOTE the "over-armoring
stalls melee" bug is about *monster* armor; this is *player* armor (reduces incoming damage) — the
sim risk is trivializing at-level fights, so verify the contract.

**3. Dodge & Double Attack gain XP (review #2).** Grant skill XP at the proc site: on a successful
player dodge (battle.js dodge branch) `addSkillXp(c,'Dodge',DODGE_SKILL_XP_PER_PROC)`; on a
double-attack proc `addSkillXp(c,'Double Attack',DOUBLE_ATTACK_SKILL_XP_PER_PROC)`. Both `= 1`.
`addSkillXp` already enforces the archived `2×level+1` cap. (These skills already feed live rolls;
they just never trained.) Prefer direct grants at the proc site over threading a per-battle flag.

**4. Thievery → real effect + XP (review #3).** On win (`onWin`): (a) bonus gold
`floor(gold × min(THIEVERY_GOLD_PER_LEVEL × lvl, THIEVERY_GOLD_CAP))`; (b) a steal roll — with
probability `min(THIEVERY_STEAL_PER_LEVEL × lvl, THIEVERY_STEAL_CAP)`, take ONE extra roll of the
monster's drop table (respecting the existing first-hit-wins convention) as bonus pending loot,
logged distinctly ("You lift an extra <item> from the <monster>."). (c) Thievery gains XP on every
win (`addSkillXp(c,'Thievery',1)`) — use-based. Constants: `THIEVERY_GOLD_PER_LEVEL = 0.01`,
`THIEVERY_GOLD_CAP = 0.25`, `THIEVERY_STEAL_PER_LEVEL = 0.015`, `THIEVERY_STEAL_CAP = 0.30`. All
via `rng()`.

**5. Dual Wield → offhand weapon (review #3).** New equip slot **`offhand`** accepting items with a
weapon `slot`/skill (same equip requirements as main weapon). When BOTH hands hold a weapon, the
basic **Attack** action makes an extra offhand swing after the main hit(s), dealing the offhand
weapon's damage contribution `× min(DUAL_WIELD_OFFHAND_MULT_BASE + DUAL_WIELD_OFFHAND_MULT_PER_LEVEL
× lvl, DUAL_WIELD_OFFHAND_MULT_CAP)`, through the normal variance/glancing/fear/armor pipeline; the
offhand swing rolls monster dodge independently. Dual Wield gains XP per offhand swing
(`addSkillXp(c,'Dual Wield',1)`). Techs are single-weapon (no offhand hit). Constants:
`DUAL_WIELD_OFFHAND_MULT_BASE = 0.40`, `DUAL_WIELD_OFFHAND_MULT_PER_LEVEL = 0.02`,
`DUAL_WIELD_OFFHAND_MULT_CAP = 0.75`. Save: add `c.equipment.offhand = null` (create() + v8→v9
migration + v1→v9 chain test). UI: an offhand equip slot in the inventory/equip screen with the
same click-to-equip fallback; Status/derived-damage display reflects the offhand contribution.

**6. Intelligence spell hit/miss (review #4).** In `useTech`, offensive **magic** techs (non-weapon,
`effect:'damage'`) roll to hit: `hit = clamp(INT_SPELL_HIT_BASE + INT_SPELL_HIT_PER_INT × c.int −
INT_SPELL_HIT_PER_MON_LEVEL × monster.level, INT_SPELL_HIT_MIN, INT_SPELL_HIT_MAX)`. Miss → energy
still spent, no damage, log "Your <tech> misses the <monster>!"; no status/effect applied. Healing
and buff techs ALWAYS land (you can't miss yourself — parallels the Fear "spares healing" rule).
**Weapon techs** are physical: they instead roll the monster's dodge (like a basic attack) rather
than the Int check. Constants: `INT_SPELL_HIT_BASE = 0.75`, `INT_SPELL_HIT_PER_INT = 0.01`,
`INT_SPELL_HIT_PER_MON_LEVEL = 0.01`, `INT_SPELL_HIT_MIN = 0.40`, `INT_SPELL_HIT_MAX = 0.98`.
Archived basis: "intelligence decides whether your spell hits or misses" (`Recent_Updates.md`
2007-04-21) — tag `[archived]` for the rule, `[invented]` for the numbers.

**7. Non-elemental damage ignores defense (review #13).** In `useTech`'s non-weapon branch, set
`mitigation = tech.grade ? battle.monster.magicArmor : 0`. Adopts DESIGN §4's stated 2005 rule
(currently contradicted). This buffs `grade:null` class techs — re-check the affected class techs
(crushing_blow, quick_stab, execution_blow, efficient_strike, etc.) stay within their power band
and note the impact. Tag `[archived]` (rule) — remove the stale "adopt" ambiguity from DESIGN §4
in Phase 4.

**8. Curse status (review #5 remainder).** Adds the last v2.1 status. Curse is a **battle-scoped
debuff** (parallel to Poison, not a persistent affliction like Haunting): while cursed the player's
outgoing damage (attacks AND techs) is `× CURSE_DAMAGE_MULT` for `CURSE_DURATION` turns; cleared at
battle end. Applied by monster attacks carrying a `curseChance` field (analogous to `poisonChance`;
Phase 3 attaches it to thematic monsters — Phase 1 wires the mechanic + gives one existing undead/
anima monster a curseChance so it's testable). Cleansable mid-battle by an Abjuration cleanse tech
(reuse/extend the existing mend/cleanse tech family — if none clears status, add a small
`clearsStatus` flag to an Abjuration tech). Constants: `CURSE_DAMAGE_MULT = 0.75`,
`CURSE_DURATION = 4`, and a per-monster `CURSE_APPLY_CHANCE` example. Tag: status NAME `[archived]`
(`Version_2.1_Changes.md`), effect/numbers `[invented]`.

**Tests (Phase 1):** stubbed-RNG coverage for each — weapon-skill and armor-skill scaling at a
couple of skill levels (assert the multiplier and the cap); Dodge/DA XP granted on proc and capped
at 2L+1; Thievery gold math + steal roll (hit and miss) + XP on win; Dual Wield offhand extra hit
present only with two weapons, damage range, XP, and monster-dodge on the offhand; save v8→v9 and
v1→v9 chains include `equipment.offhand`; Int hit/miss (hit, miss, heals always land, weapon techs
use dodge not Int); non-elemental tech ignores magicArmor while elemental still subtracts it; Curse
halves player damage for N turns, clears at battle end, cleanse removes it. Update any stale
hardcoded counts. **Balance sim reported.** All 10 suites green.

---

## Phase 2 — Classes: three-tier progression + full roster

Build the **tier-3 machinery** and roster. Files: `js/data/classes.js`, `js/core/classes.js`,
`js/data/quests.js`, `js/data/techs.js`, `js/data/quests.js`, icons, tests.

- **Structure:** Tier 1 (base, L5) → Tier 2 (advanced, L30) → **Tier 3 (NEW)**. Tier-3 unlocks via
  a new capstone quest gated at **level 38** (endgame within the current range; the arc re-paces to
  ~60 later), branching once more from the player's tier-2 class.
- **Tier-3 roster (archived names, `homepage_2006.md`):** **Shadowknight** (Warrior line —
  Gladiator/Crusader → Shadowknight; archived abilities to reuse as names: Shadow Blade, Inner Fire,
  Dragon's Fire), **Magus** (Magician line — Wizard/Sage → Magus; corroborated `forum/t-787.md`),
  **Gambit** (Thief line — Rogue/Mercenary → Gambit; archived abilities: Lucky Coin, Dice Throw;
  archived quest name "A Gambler's Life"). These are `[archived]` names; ability *effects/numbers*
  are `[invented]`.
- **Invented additions (user-directed "3 archived + new invented"):** one `[invented]` second
  tier-3 branch is permitted per arc §5 if wanted; at minimum add **1–2 invented Legendary/hidden
  classes** beyond Runeblade (special unlock routes — boss combination or relic). Keep each new
  class's power within the "≤ +25% over the prior tier" discipline already noted in classes.js.
- **Branch convergence:** tier-3 converges **one per base line** — Warrior line (Gladiator OR
  Crusader) → **Shadowknight**; Magician line → **Magus**; Thief line → **Gambit**. So a tier-3
  class's `baseClass` references the **tier-1 line id** (`'warrior'`/`'magician'`/`'thief'`), not a
  tier-2 id. Roster stays at the 3 archived names (no per-tier-2 explosion).
- **Machinery:** add `thirdTierOptionsFor(c)` in `js/core/classes.js` (mirrors
  `advancedOptionsFor`: returns tier-3 classes whose `baseClass` matches the player's obtained
  tier-1 base class) and a new `rewards.classChoice` sentinel `'tier3'` resolved at quest turn-in;
  the capstone quest sets a `requiresAdvancedClass: true` gate (accept() refuses unless the
  character has obtained a tier-2 class — mirror the existing `requiresBaseClass` gate). Reuse
  `obtainClass`/`activate`/class-XP/`buyAbility` unchanged.
- **Invented count (pinned):** exactly **2** invented Legendary classes beyond Runeblade (distinct
  special-unlock routes — e.g. a boss-combination kill and a relic/synthesis route), for 10→15
  total classes. Use archived ability NAMES where they exist: Shadowknight → Shadow Blade / Inner
  Fire / Dragon's Fire; Gambit → Lucky Coin / Dice Throw; Magus + the 2 legendaries → invented
  names. One signature `classOnly` class-tech per new class (add a 2nd only if within balance).
- **Runeblade renumber (arc §5):** move `runeblade_of_kuraan` off `tier: 3` to a `legendary` slot
  (e.g. `tier: 4` + existing `legendary: true`) and confirm `advancedOptionsFor`/`thirdTierOptionsFor`
  both exclude it. Data-only; verify no save migration needed (class entry shape unchanged).
- **Class techs:** define each tier-3 class's `kind:'tech'` abilities in techs.js with
  `classOnly:true, classId:'<id>'` (existing pattern); icons for every new tech + class id
  (hash-distinct, `test_icons.js`).
- **Tests:** tier-3 quest gating (requires an advanced class), `thirdTierOptionsFor` returns the
  correct branch(es), obtain→activate→buyAbility→class-tech-usable path for a tier-3 class,
  Runeblade still excluded from normal advancement, class counts updated. All 10 green.

---

## Phase 3 — Content pass (two sequential agents, DISJOINT file sets)

Run as two agents to avoid conflicts. **Content-B runs first** (self-contained data), **then
Content-A** (references B's item ids when stocking the new shop). Do NOT parallelize. Every number
cited; new ids need hash-distinct icons (the largest mechanical cost — budget it).

### Content-B — Items, economy, shrine & shards
Files: `js/data/items.js`, `js/data/monsters.js` (append-only loot, first-hit-wins), `js/data/recipes.js`,
`js/data/shrine.js`, `js/data/techs.js`, minimal `js/core/battle.js` (shard spend). No save changes.
- **Graded Crystals & Spheres** (review #10; `Recent_Updates.md` Apr–May 2007, names `[archived]`,
  numbers `[invented]`): a **Crystal** line restoring Energy and a **Sphere** line restoring HP, each
  graded across the level-20→40 bands, plus premium **Light** and **Dark** variants (restore both /
  larger). Anchor: "All Crystals restore 70% charge" — use ~70% of max Energy as the mid-grade
  Crystal value and scale grades around it (e.g. 40/55/70/85%). ~8–12 new consumables total, added
  as **append-only** drops in the 20+ hunting areas' loot tables. Icons for each.
- **Level-30+ shop stock incl. energy stones** and a few **30+ synthesis recipes**
  (`Version_2.1_Changes.md`). Define the ITEMS/recipes here (energy stones = purchasable energy
  restore; 30+ tier consumables/materials). Content-A places the shop that sells them.
- **Shrine buffs → ~20** (review #9; archived "over 20", `Version_2.1_Changes.md`): currently 5;
  add ~15 more `js/data/shrine.js` entries using the existing buff schema (effect/power/battles/
  shardCost) consumed by `Game.World.shrineBonus`, thematically varied, balanced shard costs.
- **Shard-cost techs** (`Anima_Shards.md`: shards "used when casting certain techniques that bestow
  enhancements"): add a `shardCost` field to ~2–3 enhancement (buff) techs, consumed in `useTech`
  (spend shards on cast; refuse with a message if insufficient — route through the character's shard
  balance). Rule `[archived]`, numbers `[invented]`.

### Content-A — World, towns & Arkan
Files: `js/data/areas.js`, `js/core/world.js`, `js/data/quests.js`, `js/core/character.js`. No save
bump (Arkan start sets `currentLocation` by race at creation — not a new persisted field; Arkan
quests use existing quest state; prefer computed gates).
- **Laik, Riverside Village** (archived town, `Recent_Updates.md` 2007-08-02) as the 4th town
  (riverside theme, mid-level band) with shop/inn/vault/tavern; **move the Professor Flad quest
  giver from Ju'Mak to Laik** (`js/data/quests.js`).
- **Level-30+ outpost** in the Kastengard band with inn/shop/academy so the 26–40 endgame isn't a
  bare trek (review #8); its shop sells Content-B's 30+ stock incl. energy stones.
- **Arkan race** (review #11; `Arkan.md`): a short **Arkan questline** gated by a new
  `requiresRace: 'Arkan'` quest field; **Arkan characters start in Saratus** (their archived
  capital) instead of Eldor — and to keep a level-1 Arkan playable, add a small **low-level hunting
  area adjacent to Saratus** (minLevel 0–1) so early play works there. Human start unchanged (Eldor).
- **Tests:** town/facility presence, Flad rehosted to Laik, outpost facilities serve 26–40, Arkan
  starts in Saratus + Human in Eldor, requiresRace gating (Arkan quest hidden/blocked for Humans),
  the new low-level area is reachable/huntable. Existing drop-table rates unchanged.

---

## Phase 4 — Docs & audit hygiene

Lead-owned (or a small delegated pass). Fix `README.md` class paragraph (review #14: base
Warrior/Magician/**Thief** at L5 "The First Calling"; advanced at 30 "Trials of Ascension"; **new**
tier-3 at ~38). Add the missing `[revised]` tag for the Gares level compression to DESIGN §2
(review #12). Resolve DESIGN §4's non-elemental-defense note now that Phase 1 implemented it (review
#13). Document all v1.2 systems/content in DESIGN (skill effects, class tier 3, Laik, graded
crystals, Arkan, shrine/shards) with correct tags. Update content-count targets. All 10 green.

---

## Forward note (for the level-arc version)

Using Shadowknight/Magus/Gambit as tier-3 here is deliberate and matches arc §5. When the arc
lands, tier-3 re-gates from L38 to ~L60 (a constant/quest-level change, no roster churn), and any
*additional* tier-3 branches the arc wants are `[invented]` per arc §5/D3. The Runeblade already
sits in the legendary slot after Phase 2, so no tier collision remains.
