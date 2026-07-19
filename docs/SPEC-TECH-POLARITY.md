# SPEC — Tech Polarity Expansion (one new technique chain for every skill)

**Status:** DECISIONS RESOLVED (user, 2026-07-17) — D0–D4 all settled on the recommended
option (§5). Combat-affecting numbers remain sim-gated (§3); next step is /balance-sim, then
implementation.
**Relationship to authority:** extends `docs/DESIGN.md` §5 (Techniques) and §3 (Skills). Adds new
engine mechanisms (§2.0) but overrides no archived rule — **no [revised] tags in this spec**.
Tech chain/gating model follows the archived May-2007 trainer/skill-gate design
[archived: reference/site/homepage_2007.md] as already adopted by DESIGN.md §5.

**Interpretation of the request (D0 — confirmed by user, 2026-07-17):** every one of the 18 archived skills
[archived: reference/manual/Skills.md] gets one **additional** technique chain. Skills whose
existing techs are damage-dealing get a buff or debuff chain; skills whose existing techs are
heal/buff (or drain — see D1) get a damage chain; the nine skills that currently have **no techs
at all** (Light/Medium/Heavy Armor, Shields, Rods, Dodge, Thievery, Dual Wield, Double Attack)
get a chain whose type is chosen to fit the skill's archived identity. Each new chain is
upgradeable with skill level via 4 Academy-learned ranks at skillReq 0(±4)/10/25/45 — a looser
spacing than the shipped 9-rank chains, which the request explicitly permits ("does not have to
follow the exact pattern"). The alternative reading — only the 9 skills that already have techs
get a new chain — is D0's alternative.

---

## 1. What changes

Today `js/data/techs.js` ships 75 player techs in 13 chains plus class techs, covering only 9 of
the 18 archived skills (Swords, Polearms, Knives, Hand to Hand, Evocation, Conjuration,
Alteration, Absorption, Abjuration). Nine skills have no techs at all, and every skill that has
techs has only one polarity (all-damage or all-support).

This spec adds **18 new chains × 4 ranks = 72 new player techs**, giving every archived skill an
active technique and every previously-covered skill its missing polarity. It also specifies six
small engine extensions (§2.0) — the first player-castable monster debuffs, three new buff
statKinds, a bleed DoT, equipment-gated techs, and a gold-steal rider — all battle-transient
(no save impact). This directly serves the archived promise that techs cover "healing, stat
increase, and attack" [archived: reference/manual/Techs.md]: "stat increase" existed; stat
*decrease* on the enemy is the [invented] completion of that design line, grounded on machinery
the engine already has (the Dragon Kick limit break's `monster.dodgeDebuff` and the Conjurer
servitor's monster-side status list, `js/core/battle.js`).

## 2. Design detail

### 2.0 Engine extensions (all [invented]; battle-transient; no save impact)

1. **Buff statKind passthrough.** `useTech`'s buff branch forwards `tech.statKind` onto the
   status entry. `'armor'` is already read by `playerBuffArmorBonus` (Rage precedent,
   `js/core/battle.js` ~250–267). New kinds: `'dodge'` (flat add in `playerDodgeChance`),
   `'double_attack'` (flat add in `playerDoubleAttackChance`), `'spellpower'` (flat add to
   `tech.power` inside `techEffectivePower`, damage/drain effects only, applied **before** the
   Int/skill/Rod multipliers). Default (absent statKind) remains the shipped flat +Damage buff.
2. **`effect: 'debuff'`.** Pushes `{type:'debuff', debuffKind, power, turnsLeft}` onto
   `battle.monster.statuses` (the servitor's list — same tick/removal machinery,
   `tickMonsterStatuses`). `debuffKind:'damage'` reduces monster damage (floor 1);
   `'armor'` reduces monster armor (floor 0). Hit roll: magic-school debuffs roll the archived
   Int spell-hit [archived rule: reference/manual/Recent_Updates.md 2007-04-21]; weapon-skill
   debuffs (Sunder Guard, Crippling Thrust, Grave Wound) instead roll monster dodge, like
   weapon techs. Buffs still always land (shipped carve-out).
3. **`debuffKind: 'bleed'`.** End-of-round tick dealing `power` damage, mirroring the servitor
   tick site exactly, including its Fear multiplier discipline (`js/core/battle.js`
   `tickMonsterStatuses`) — bleeds cannot bypass Fear. Not armor-mitigated; grade null.
4. **Re-cast rule.** Re-casting any ranked buff/debuff **replaces** its chain's existing entry
   (the servitor's one-at-a-time replace rule, generalized). No stacking of the same chain;
   different chains stack.
5. **Equipment gating.** New optional fields `requiresShield`, `requiresOffhandWeapon`,
   `requiresArmorClass: 'light'|'medium'|'heavy'` (body slot). Checked at cast before any cost
   is spent, with a friendly refusal log — mirrors the shipped shardCost refusal pattern.
6. **`goldSteal` rider.** On the first landed hit of the tech per battle, banks a flat gold
   bonus that is paid out **with the win gold** (`onWin`) and forfeited on flee/loss — closes
   the steal-and-flee farming exploit by construction.

### 2.1 Weapon skills — the missing debuff/buff polarity

All four chains below: names, mechanics and descs [invented]; numbers are the lead-derived
scaffold (§3). Grade null throughout (physical; grade-null techs bypass grade mitigation —
DESIGN.md §5).

**Swords — Sunder Guard (debuff: armor).** Cleave (the shipped [invented] Swords chain,
`js/data/techs.js`) is raw damage; Sunder Guard is its tactical opposite — shearing the enemy's
guard so every later hit lands harder. An armor-shear also gives melee a designed answer to
armor-stacking, the exact failure mode the balance history warns about twice
(`js/balance.js` F1 CONVENTION NOTES). Monster armor floors at 0.

| id | name | chain | rank | skill | grade | effect | debuffKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_sunder_guard_1 | Sunder Guard I | Sunder Guard | 1 | Swords | null | debuff | armor | 3 | 3 | 12 | 2 | 0 | A precise slash that tests the enemy's guard, opening cracks in their armor. The most basic Swords technique taught at any Academy. [invented] |
| tech_sunder_guard_2 | Sunder Guard II | Sunder Guard | 2 | Swords | null | debuff | armor | 6 | 3 | 16 | 4 | 10 | A deliberate riposte that deepens the fissures, progressively unraveling the foe's defensive layers. [invented] |
| tech_sunder_guard_3 | Sunder Guard III | Sunder Guard | 3 | Swords | null | debuff | armor | 10 | 3 | 22 | 6 | 25 | A masterful counter-cut that shatters the enemy's guard with surgical precision, leaving them vulnerable to follow-up strikes. [invented] |
| tech_sunder_guard_4 | Sunder Guard IV | Sunder Guard | 4 | Swords | null | debuff | armor | 16 | 3 | 28 | 8 | 45 | An elite technique that strips away armor and resolve in one devastating thrust, taught only to the Academy's most accomplished swordsmen. [invented] |
**Polearms — Crippling Thrust (debuff: damage).** Impale trades on armor-piercing
([invented] remake data, `js/data/techs.js`); Crippling Thrust uses the polearm's other
identity — reach — to keep the foe at bay and sap the force of its strikes (floor 1). Flavor
hook: the Arkan "have no standing army, many citizens present themselves as mercenaries"
[archived: reference/manual/Arkan.md] — polearm drill is mercenary drill.

| id | name | chain | rank | skill | grade | effect | debuffKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_crippling_thrust_1 | Crippling Thrust I | Crippling Thrust | 1 | Polearms | null | debuff | damage | 4 | 3 | 12 | 2 | 0 | A driving spear-thrust that keeps the enemy at distance, forcing them to expend effort to close the gap. The most basic Polearms technique taught at any Academy. [invented] |
| tech_crippling_thrust_2 | Crippling Thrust II | Crippling Thrust | 2 | Polearms | null | debuff | damage | 8 | 3 | 16 | 4 | 10 | A measured thrust that disrupts the foe's stance, weakening their ability to mount a coordinated offense. [invented] |
| tech_crippling_thrust_3 | Crippling Thrust III | Crippling Thrust | 3 | Polearms | null | debuff | damage | 14 | 3 | 22 | 6 | 25 | A disciplined feint followed by a full extension that leaves the enemy off-balance and struggling to regain their rhythm. [invented] |
| tech_crippling_thrust_4 | Crippling Thrust IV | Crippling Thrust | 4 | Polearms | null | debuff | damage | 22 | 3 | 28 | 8 | 45 | An expert polearm technique that neutralizes the foe's offensive potential, leaving them unable to mount more than token resistance. [invented] |
**Knives — Grave Wound (debuff: bleed).** Vital Strike is burst; Grave Wound is the knife's
sustained answer — an opened wound that bleeds each round (§2.0.3). Bleed-per-energy is tuned
below Vital Strike burst (§3) so it is a pacing choice, not a strict upgrade.

| id | name | chain | rank | skill | grade | effect | debuffKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_grave_wound_1 | Grave Wound I | Grave Wound | 1 | Knives | null | debuff | bleed | 5 | 3 | 10 | 2 | 0 | A quick, shallow slash that opens a bleeding wound. The most basic Knives technique taught at any Academy. [invented] |
| tech_grave_wound_2 | Grave Wound II | Grave Wound | 2 | Knives | null | debuff | bleed | 10 | 3 | 14 | 4 | 10 | A deeper cut that prolongs the bleeding, each turn draining the foe of strength as the wound refuses to close. [invented] |
| tech_grave_wound_3 | Grave Wound III | Grave Wound | 3 | Knives | null | debuff | bleed | 16 | 3 | 20 | 6 | 25 | A vicious laceration that severs deeper tissues, causing severe bleeding that saps the enemy's vitality turn after turn. [invented] |
| tech_grave_wound_4 | Grave Wound IV | Grave Wound | 4 | Knives | null | debuff | bleed | 24 | 3 | 26 | 8 | 45 | An assassin's masterwork: a precise strike that opens arterial bleeding, leaving the enemy weakened and desperate as they hemorrhage. [invented] |
**Hand to Hand — Steel Resolve (buff: armor).** The unarmed skill's discipline turned inward:
a breathing stance that hardens the body (statKind 'armor' — the Rage limit-break machinery,
`js/core/battle.js` ~250–267, made Academy-learnable). Arkan martial flavor
[archived: reference/manual/Arkan.md].

| id | name | chain | rank | skill | grade | effect | statKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_steel_resolve_1 | Steel Resolve I | Steel Resolve | 1 | Hand to Hand | null | buff | armor | 6 | 3 | 10 | 2 | 0 | A short breathing technique that stiffens the body, raising Armor through disciplined focus. The most basic Hand to Hand technique taught at any Academy. [invented] |
| tech_steel_resolve_2 | Steel Resolve II | Steel Resolve | 2 | Hand to Hand | null | buff | armor | 12 | 3 | 16 | 4 | 10 | A deeper meditative stance that hardens flesh and sinew, significantly bolstering the caster's defensive resilience. [invented] |
| tech_steel_resolve_3 | Steel Resolve III | Steel Resolve | 3 | Hand to Hand | null | buff | armor | 20 | 3 | 22 | 6 | 25 | An advanced martial posture that channels inner strength into an impenetrable guard, the body becoming nearly as unyielding as stone. [invented] |
| tech_steel_resolve_4 | Steel Resolve IV | Steel Resolve | 4 | Hand to Hand | null | buff | armor | 30 | 3 | 28 | 8 | 45 | The pinnacle of martial discipline: a transcendent state where the caster's Armor becomes formidable, their entire being hardened against incoming blows. [invented] |
### 2.2 Magic schools — the missing polarity

(Batch design notes below are per-school; school-role assignment is [invented, docs/DESIGN.md §3].)

### Evocation — Attunement (buff, spellpower)

**Design note.** Evocation's only existing chains (Firebolt/Fire, Starspark/Star, Tidal
Lance/Water — `js/data/techs.js`) are all direct damage, per the school's **[invented,
docs/DESIGN.md §3]** role. Attunement is the school's first non-damage entry: a caster
gathers and kindles a reserve of Anima before their next strikes, expressed mechanically as
a flat `spellpower` bonus added to the caster's offensive tech power before multipliers —
sitting upstream of the existing `MAGIC_SKILL_DAMAGE_CAP`/`ROD_SPELL_MULT` scalars
(`js/balance.js`) and parallel to the `statKind:'armor'` buff mechanism the engine already
supports for Rage (`js/core/battle.js` lines ~250-267), here extended to a new
`statKind:'spellpower'` per the lead's spec. `grade: null` — the buff itself carries no
Anima grade (like Alteration's own buffs, Warrior's Edge/Focus, `js/data/techs.js`); it is
the *reserve*, not the *release*, so it bypasses resistance lookups entirely. Chain name
and mechanics are **[invented]** (no archived name survived attached to an Evocation buff;
the flavor direction — gathering/kindling Anima — is the lead's brief).

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_attunement_1 | Attunement I | Attunement | I | Evocation | null [invented] | buff | statKind: spellpower [invented] | 6 | 3 turns | 10 | 2 | 0 | Draws a slow ember of Anima into the palm, banking it for the next strike. The most basic Evocation technique taught at any Academy. [invented] |
| tech_attunement_2 | Attunement II | Attunement | II | Evocation | null [invented] | buff | statKind: spellpower [invented] | 12 | 3 turns | 16 | 4 | 10 | Holds the gathered ember a beat longer, banking more heat before it is spent. [invented] |
| tech_attunement_3 | Attunement III | Attunement | III | Evocation | null [invented] | buff | statKind: spellpower [invented] | 20 | 3 turns | 22 | 6 | 25 | Kindles a deep well of Anima, banked and ready to feed the next several spells cast. [invented] |
| tech_attunement_4 | Attunement IV | Attunement | IV | Evocation | null [invented] | buff | statKind: spellpower [invented] | 30 | 3 turns | 28 | 8 | 45 | Gathers Anima until it strains against the skin, promising a far harder-hitting spell to follow. [invented] |

---

### Conjuration — Curse (debuff, damage-sap)

**Design note.** Conjuration's only existing chain, Shadowlash (Dark grade, `js/data/techs.js`),
is summon/DoT-flavored direct damage per the school's **[invented, docs/DESIGN.md §3]**
role of "summoned/DoT effects." Curse is the requested opposite polarity: a conjured thing
— a wisp, a swarm, a familiar — harries the enemy for the fight's duration, sapping the
force behind its own strikes (monster Damage reduced, floored at 1, for `debuffDuration`
turns). The **name** is archived-gold, not invented from nothing: "Curse" is a named
detrimental status effect from the shipped game — **[archived: reference/manual/Version_2.1_Changes.md]**
("Added new detrimental effects (Poison, Haunting, Curse)") — whose actual mechanics were
never captured by the scrape. Per the mining rule (reuse the name, invent the mechanics,
tag separately), this chain reuses the name **[archived: reference/manual/Version_2.1_Changes.md]**
and invents a debuff-on-monster mechanic to fill it **[invented]**, distinct from (and not
contradicting) the existing "Curse" *status* already cleared by Mend Wounds II
(`js/data/techs.js`, `tech_mend_wounds_2` desc) — that one is a status effect applied to the
player; this one is a Conjuration tech applied to the monster, a deliberately different
surface reusing the same evocative word. Dark grade matches the Shadowlash precedent and
the 2007-04-20 grade additions **[archived: reference/manual/Recent_Updates.md]**.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_curse_1 | Curse I | Curse | I | Conjuration | Dark | debuff | debuffKind: damage [invented] | 4 | 3 turns | 13 | 3 | 4 | Binds a flickering wisp of Dark-grade Anima to the enemy, its constant harrying dulling their strikes. The most basic Conjuration technique taught at any Academy. [invented] |
| tech_curse_2 | Curse II | Curse | II | Conjuration | Dark | debuff | debuffKind: damage [invented] | 8 | 3 turns | 18 | 4 | 10 | A hungrier wisp clings tighter, sapping more strength from every blow the enemy lands. [invented] |
| tech_curse_3 | Curse III | Curse | III | Conjuration | Dark | debuff | debuffKind: damage [invented] | 14 | 3 turns | 24 | 6 | 25 | A small conjured swarm harries the enemy from every side, wearing their guard to nothing. [invented] |
| tech_curse_4 | Curse IV | Curse | IV | Conjuration | Dark | debuff | debuffKind: damage [invented] | 22 | 3 turns | 30 | 8 | 45 | A gloom-wrought familiar shadows the enemy's every motion, sapping their strikes to almost nothing for as long as it clings. [invented] |

---

### Alteration — Stoneshear (damage, Earth)

**Design note.** Alteration currently has only buffs (Warrior's Edge, Focus —
`js/data/techs.js`), consistent with its **[invented, docs/DESIGN.md §3]** role of
"buffs/debuffs" and the archived note "Alteration is now affected by Spell Powers"
**[archived: reference/manual/Recent_Updates.md]**. Stoneshear is the requested opposite
polarity: the school "alters the world itself," transmuting matter into a weapon. **Grade
choice: Earth**, not Wind. Justification — no *player* chain currently uses either grade
(only monster-only techs do: `mon_stone_slam`/`mon_earthen_crush` for Earth,
`mon_hunters_mark`/`mon_wind_buffet` for Wind, all `js/data/techs.js`), so either was free,
but Earth carries a direct lore hook: Anima itself was first discovered "deep within the
crust of the earth" by Estari runologists **[archived: reference/manual/Chapter_I.md]** —
an Alteration chain that transmutes raw earth into a weapon closes the loop back to Anima's
own origin story, and gives Evocation's existing Fire/Water/Star trio a matching
earth-and-stone counterpart on a different school. Power is flat and scales with
Int/skill/Rod in-engine like every other offensive tech (`MAGIC_SKILL_DAMAGE_PER_LEVEL`/
`ROD_SPELL_MULT`, `js/balance.js`); no `statKind`/`debuffKind`/duration fields apply to a
plain damage effect.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_stoneshear_1 | Stoneshear I | Stoneshear | I | Alteration | Earth | damage | — | 14 | — | 12 | 2 | 0 | Wrenches a shard of raw stone from the ground and hurls it with transmuted force. The most basic Alteration technique taught at any Academy. [invented] |
| tech_stoneshear_2 | Stoneshear II | Stoneshear | II | Alteration | Earth | damage | — | 26 | — | 18 | 4 | 10 | Fuses several shards into a single jagged spear before releasing it at the enemy. [invented] |
| tech_stoneshear_3 | Stoneshear III | Stoneshear | III | Alteration | Earth | damage | — | 40 | — | 24 | 6 | 25 | Transmutes a slab of bedrock into a screaming volley in a single motion. [invented] |
| tech_stoneshear_4 | Stoneshear IV | Stoneshear | IV | Alteration | Earth | damage | — | 56 | — | 30 | 8 | 45 | Rips a column of living rock from the earth and drives it through the enemy whole. [invented] |

---

### Absorption — Nullward (buff, armor)

**Design note.** Absorption's only existing chain, Lifetap (Dark grade drain,
`js/data/techs.js`), covers half of the school's **[invented, docs/DESIGN.md §3]** role —
"drains/shields" — leaving shields unbuilt. Nullward is that missing half: a shroud of
Anima that annuls a portion of incoming force, mechanically a `statKind:'armor'` buff
(the same field the engine already reads for the Rage buff, `js/core/battle.js` lines
~250-267, here reused for a player-learnable Academy tech). **Grade choice: Dark**, not
null. Justification — Absorption's one existing chain is already Dark (`tech_lifetap_1`,
`js/data/techs.js`), so keeping Nullward Dark preserves a single-element identity for a
school that has only ever spoken in one grade: the same hungry, consuming Anima that drains
life also annuls incoming force by devouring it. Grade is flavor-only here (buffs are not
grade-mitigated by monster resistances the way damage/heal effects are, per the existing
`grade:null` convention on Alteration's own buffs) — Dark is a naming/lore choice, not a
mechanical one. duration = `buffDuration`, 3 turns per rank per the fixed scaffold.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_nullward_1 | Nullward I | Nullward | I | Absorption | Dark [invented] | buff | statKind: armor | 6 | 3 turns | 12 | 3 | 4 | Wraps the caster in a skin of hungry Dark-grade Anima that annuls part of each blow it meets. The most basic Absorption technique taught at any Academy. [invented] |
| tech_nullward_2 | Nullward II | Nullward | II | Absorption | Dark [invented] | buff | statKind: armor | 12 | 3 turns | 17 | 4 | 10 | A deeper skein of hungry Anima, annulling more force from every blow it swallows. [invented] |
| tech_nullward_3 | Nullward III | Nullward | III | Absorption | Dark [invented] | buff | statKind: armor | 20 | 3 turns | 23 | 6 | 25 | A greedy shroud of Dark-grade Anima that drinks incoming force nearly whole. [invented] |
| tech_nullward_4 | Nullward IV | Nullward | IV | Absorption | Dark [invented] | buff | statKind: armor | 30 | 3 turns | 29 | 8 | 45 | A near-impenetrable veil of starving Anima, annulling almost everything thrown against it. [invented] |

---

### Abjuration — Censure (damage, Light)

**Design note.** Abjuration's only existing chain, Mend Wounds (Light grade healing,
`js/data/techs.js`), fits the school's **[invented, docs/DESIGN.md §3]** role of
"healing/cleansing," anchored by "Healing spells now use the Light grade"
**[archived: reference/manual/Recent_Updates.md]** (2007-04-20). Censure is the requested
opposite polarity, turning the same sanctified Light-grade Anima outward as a weapon rather
than a mending. This is not a new engine idea: the shipped class-only tech
`tech_runic_severance` (`js/data/techs.js`) already establishes Light as a valid
damage grade in-engine (a hybrid Light+Dark strike using the single `grade` field for the
resistance lookup, Dark as flavor only) — Censure follows that precedent directly for a
general Academy chain rather than a class-locked ability. Flavor: the same Anima an
Abjurer uses to close wounds is bent instead toward condemning the enemy — sanctified
force turned to censure. Flat power, scaling with Int/skill/Rod in-engine like Stoneshear
above; no `statKind`/`debuffKind`/duration fields apply.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind | power | duration | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_censure_1 | Censure I | Censure | I | Abjuration | Light | damage | — | 14 | — | 13 | 3 | 4 | Turns a sliver of Light-grade Anima outward as a censuring lance, condemning the enemy in the same breath the Academy teaches to heal. The most basic Abjuration technique taught at any Academy. [invented] |
| tech_censure_2 | Censure II | Censure | II | Abjuration | Light | damage | — | 26 | — | 19 | 4 | 10 | A harsher censure — the same Light-grade Anima that mends wounds, turned instead to punish them. [invented] |
| tech_censure_3 | Censure III | Censure | III | Abjuration | Light | damage | — | 40 | — | 25 | 6 | 25 | A judgment cast in unflinching Light, striking with the same certainty as the deepest Mend Wounds. [invented] |
| tech_censure_4 | Censure IV | Censure | IV | Abjuration | Light | damage | — | 56 | — | 31 | 8 | 45 | A blinding censure of Light-grade Anima, condemning the enemy with the full weight of the Academy's sanctified teaching. [invented] |
### 2.3 The nine tech-less skills

Chain names in this subsection are [invented] (the design agent's working titles were replaced
with shipped-voice names by the lead; ids follow). Each note cites the skill's archived
definition. **Era caveat:** several definitions survive only in
`reference/manual/Version_3.0.md`; they are used strictly as *definitional* evidence for skills
that already exist in the v2.1 target era — no v3.0 mechanics (Force/Cunning/Brilliance trees,
Eidolons) are adopted.

### Light Armor — Fleetstep (buff: dodge)

**Design note.** The archived one-line definition is bare: *"Increases the efficiency of your
light armor"* [archived: reference/manual/Version_3.0.md, §2.3.7 "Light Armor"]. Mechanically,
Light Armor already has a passive engine hook — it's one of the four `ARMOR_SKILLS` scoped by
`armorSkillMult`, so worn light-armor pieces get `+min(ARMOR_SKILL_ARMOR_PER_LEVEL * level,
ARMOR_SKILL_ARMOR_CAP)` armor from the skill itself [archived: reference/manual/Version_3.0.md
(rule); js/core/inventory.js lines 152-163, js/balance.js lines 242/250 (numbers, invented)]. That
passive already covers "armor efficiency" in the flat-armor sense, so the active tech chain is
designed to lean into the *other* half of light armor's identity — the tradeoff of wearing less
plate for more freedom of motion — via a dodge buff instead of a redundant armor buff. This also
differentiates Light Armor's active kit from Medium/Heavy Armor below (which double down on flat
armor), giving all three armor skills distinct tech identities while sharing the same passive
per-piece-armor engine hook.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_fleetstep_1 | Fleetstep I | Fleetstep | 1 | Light Armor | null | buff | statKind: dodge | 0.04 | buffDuration: 3; requiresArmorClass: light | 10 | 2 | 0 | Shrugs the weight off a leather cuirass and settles into a lighter stance, adding to Dodge for a few turns. The most basic Light Armor technique taught at any Academy. [invented] |
| tech_fleetstep_2 | Fleetstep II | Fleetstep | 2 | Light Armor | null | buff | statKind: dodge | 0.06 | buffDuration: 3; requiresArmorClass: light | 15 | 4 | 10 | A surer feel for how far unburdened leather and cloth will let a body twist and turn before an incoming blow. [invented] |
| tech_fleetstep_3 | Fleetstep III | Fleetstep | 3 | Light Armor | null | buff | statKind: dodge | 0.09 | buffDuration: 3; requiresArmorClass: light | 20 | 6 | 25 | The wearer moves as if the armor were a second skin, slipping strikes that would stagger a heavier fighter. [invented] |
| tech_fleetstep_4 | Fleetstep IV | Fleetstep | 4 | Light Armor | null | buff | statKind: dodge | 0.12 | buffDuration: 3; requiresArmorClass: light | 26 | 8 | 45 | Mastery of light armor turns evasion into a weapon in itself — a fighter who is never quite where the blow expects. [invented] |

---

### Medium Armor — Battle Harness (buff: armor)

**Design note.** Archived identity: *"Affects the efficiency of your medium armor"*
[archived: reference/manual/Medium_Armor.md]. Version_3.0.md further frames Medium Armor as sitting
in the "Cunning" family alongside Dodge and Double Attack, worn by characters who "maneuver in
combat" rather than plant themselves [archived: reference/manual/Version_3.0.md, §2.2.5]. Medium
Armor is scoped by the same `ARMOR_SKILLS` passive as Light/Heavy Armor (`armorSkillMult`,
`ARMOR_SKILL_ARMOR_PER_LEVEL`/`_CAP`) [archived rule: reference/manual/Version_3.0.md; js/core/
inventory.js lines 152-163, js/balance.js lines 242/250 invented numbers]. Unlike Light Armor, the
brief's mechanic for this chain is a straight armor buff (statKind: armor), so the active tech
doubles down on the same stat the passive already grants — appropriate for the "middle" armor
class, which the archive doesn't tie to any special maneuver (unlike Light Armor's mobility or
Heavy Armor's immovability). The desc flavor ("settling into the harness") reflects a straps-and-
plates hybrid rather than full plate or bare leather.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_battle_harness_1 | Battle Harness I | Battle Harness | 1 | Medium Armor | null | buff | statKind: armor | 6 | buffDuration: 4; requiresArmorClass: medium | 11 | 2 | 0 | Cinches the harness and straps tight mid-fight, adding to Armor for a few turns. The most basic Medium Armor technique taught at any Academy. [invented] |
| tech_battle_harness_2 | Battle Harness II | Battle Harness | 2 | Medium Armor | null | buff | statKind: armor | 12 | buffDuration: 4; requiresArmorClass: medium | 16 | 4 | 10 | Braces the straps and plates as one unit, turning a glancing hit into a shrugged-off one. [invented] |
| tech_battle_harness_3 | Battle Harness III | Battle Harness | 3 | Medium Armor | null | buff | statKind: armor | 20 | buffDuration: 4; requiresArmorClass: medium | 22 | 6 | 25 | The wearer reads an incoming blow's angle and rolls the reinforced hide to meet it squarely. [invented] |
| tech_battle_harness_4 | Battle Harness IV | Battle Harness | 4 | Medium Armor | null | buff | statKind: armor | 30 | buffDuration: 4; requiresArmorClass: medium | 28 | 8 | 45 | Mastery of the harness and plate hybrid, holding a line no lighter fighter could and no heavier one could match for speed. [invented] |

---

### Heavy Armor — Ironroot Stance (buff: armor)

**Design note.** Archived identity: *"Affects the efficiency of your heavy armor"*
[archived: reference/manual/Heavy_Armor.md]. Version_3.0.md places Heavy Armor under "Force," the
tree that "governs the use of heavy weaponry... as well as the ability to don heavier armor"
[archived: reference/manual/Version_3.0.md, §2.1.4] — the archive's most plant-your-feet-and-tank
skill. Same passive hook as Light/Medium Armor (`ARMOR_SKILLS`, `armorSkillMult`)
[archived rule: reference/manual/Heavy_Armor.md; js/core/inventory.js lines 152-163, js/balance.js
lines 242/250 invented numbers]. The active chain here pushes the highest flat armor numbers of
the three armor buffs (9/16/26/38 vs Medium's 6/12/20/30), which matches "immovable plate" — heavy
armor should feel like the least mobile, most damage-absorbing of the three, reinforcing rather
than contradicting its passive per-piece armor bonus.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_ironroot_stance_1 | Ironroot Stance I | Ironroot Stance | 1 | Heavy Armor | null | buff | statKind: armor | 9 | buffDuration: 3; requiresArmorClass: heavy | 13 | 2 | 0 | Sets the plate and locks the stance, adding to Armor for a few turns. The most basic Heavy Armor technique taught at any Academy. [invented] |
| tech_ironroot_stance_2 | Ironroot Stance II | Ironroot Stance | 2 | Heavy Armor | null | buff | statKind: armor | 16 | buffDuration: 3; requiresArmorClass: heavy | 19 | 4 | 10 | Turns the full weight of plate into a wall, angling it to shed a blow rather than absorb it whole. [invented] |
| tech_ironroot_stance_3 | Ironroot Stance III | Ironroot Stance | 3 | Heavy Armor | null | buff | statKind: armor | 26 | buffDuration: 3; requiresArmorClass: heavy | 25 | 6 | 25 | An immovable stance, plate locked joint to joint, that no ordinary strike can shift. [invented] |
| tech_ironroot_stance_4 | Ironroot Stance IV | Ironroot Stance | 4 | Heavy Armor | null | buff | statKind: armor | 38 | buffDuration: 3; requiresArmorClass: heavy | 32 | 8 | 45 | Mastery of heavy plate: a fighter who simply refuses to be moved, let alone felled. [invented] |

---

### Shields — Shield Bash (damage)

**Design note.** Archived identity: *"Affects the efficiency with which you use shields"*
[archived: reference/manual/Shields.md]. Shields is also one of the four `ARMOR_SKILLS` — it scales
the flat armor of an equipped offhand shield the same way Light/Medium/Heavy Armor scale their body
pieces [archived rule: reference/manual/Shields.md; js/core/inventory.js lines 152-163, js/balance.js
lines 242/250]. That passive is purely defensive, so the active chain is designed to give Shields an
offensive option it otherwise lacks: a flat-power (non-elemental, `grade: null`) damage tech gated on
`requiresShield: true`, i.e. a shield bash. This complements rather than competes with the passive —
a Shields-trained character still gets steadily better armor from the piece just by wearing it, and
now also gets a punishing option when they'd rather not just block.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_shield_bash_1 | Shield Bash I | Shield Bash | 1 | Shields | null | damage | n/a | 12 | requiresShield: true | 12 | 2 | 0 | Slams the shield's rim into the enemy like a blunt weapon. The most basic Shields technique taught at any Academy. [invented] |
| tech_shield_bash_2 | Shield Bash II | Shield Bash | 2 | Shields | null | damage | n/a | 22 | requiresShield: true | 16 | 4 | 10 | A full-body check with the shield face, driving the rim into ribs or skull. [invented] |
| tech_shield_bash_3 | Shield Bash III | Shield Bash | 3 | Shields | null | damage | n/a | 34 | requiresShield: true | 22 | 6 | 25 | Turns a raised guard into a sudden charge, the shield's edge leading. [invented] |
| tech_shield_bash_4 | Shield Bash IV | Shield Bash | 4 | Shields | null | damage | n/a | 48 | requiresShield: true | 28 | 8 | 45 | Mastery of the shield as a weapon: a single blow that can drop an opponent as surely as any blade. [invented] |

---

### Rods — Channeled Strike (weapon damage)

**Design note.** No standalone archived Rods page survives, but Version_3.0.md places Rods under
"Brilliance," the tree that "governs the use of rods and staves" and explicitly states *"Rods
Increases your damage done with rods"* [archived: reference/manual/Version_3.0.md, §2.3.4]. In the
current engine, Rods is a `WEAPON_SKILL` in the same sense as Swords/Polearms/Knives/Hand to Hand:
its passive is `WEAPON_SKILL_DAMAGE_PER_LEVEL`/`_CAP` scaling `Game.Character.getDamage`, and the
balance.js comment spells out the caveat that "a Rod only benefits when meleed with, since spell
damage scales off Intelligence, not this term" [archived rule (weapon-skill-to-damage relationship
implied by Version_3.0.md); js/balance.js lines 216-236 (invented numbers, comment at line 217)].
The active chain follows the shipped `weaponTech: true` + `powerMult` shape used by the Cleave/
Impale/Vital Strike/Flurry chains (js/data/techs.js lines 865-1040), i.e. channeled melee strikes
with the rod itself, reinforcing that same "rod as physical weapon" identity rather than treating it
as a spell-casting focus.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_channeled_strike_1 | Channeled Strike I | Channeled Strike | 1 | Rods | null | damage | weaponTech: true | 1.3 | n/a | 12 | 2 | 0 | A short, snapping strike with the rod's haft, the caster's cudgel. The most basic Rods technique taught at any Academy. [invented] |
| tech_channeled_strike_2 | Channeled Strike II | Channeled Strike | 2 | Rods | null | damage | weaponTech: true | 1.7 | n/a | 16 | 4 | 10 | Channels a crack of will through the rod on impact, hardening the wood or rune-etched core against the swing itself. [invented] |
| tech_channeled_strike_3 | Channeled Strike III | Channeled Strike | 3 | Rods | null | damage | weaponTech: true | 2.0 | n/a | 22 | 6 | 25 | A full two-handed swing that treats the rod as cudgel first, focus second. [invented] |
| tech_channeled_strike_4 | Channeled Strike IV | Channeled Strike | 4 | Rods | null | damage | weaponTech: true | 2.3 | n/a | 26 | 8 | 45 | Mastery of the rod as a melee weapon: every swing lands with the full weight of the caster's training behind it. [invented] |

---

### Dodge — Sidestep (buff: dodge)

**Design note.** Archived identity is the plainest of the nine: *"Dodge Increases your chance of
dodging in combat"* [archived: reference/manual/Version_3.0.md, §2.2.2], and Dexterity is archived
as increasing "the possibility to Dodge" and the XP gained specifically in the Dodge skill
[archived: reference/manual/Dexterity.md]. In the current engine, Dodge's passive is entirely
formulaic and unconditional — every player rolls `DODGE_BASE + dexterity * DODGE_PER_DEX + dodgeLevel
* DODGE_PER_SKILL_LEVEL` on every incoming hit, with no equipment gate [archived rule: reference/
manual/Version_3.0.md, Dexterity.md; js/core/battle.js lines 64-68, js/balance.js lines 90-92
(invented numbers)]. The active chain gives the player a way to spike that same stat on demand for a
few turns rather than only benefiting passively — a burst of "reading the enemy's rhythm" right
before an exchange the player expects to be dangerous, e.g. before a monster's telegraphed heavy
swing.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_sidestep_1 | Sidestep I | Sidestep | 1 | Dodge | null | buff | statKind: dodge | 0.05 | buffDuration: 3 | 10 | 2 | 0 | Reads the first beat of the enemy's rhythm and steps just wide of it, adding to Dodge for a few turns. The most basic Dodge technique taught at any Academy. [invented] |
| tech_sidestep_2 | Sidestep II | Sidestep | 2 | Dodge | null | buff | statKind: dodge | 0.08 | buffDuration: 3 | 15 | 4 | 10 | A trained eye for the half-second before a swing commits, enough to slip clear of it. [invented] |
| tech_sidestep_3 | Sidestep III | Sidestep | 3 | Dodge | null | buff | statKind: dodge | 0.12 | buffDuration: 3 | 21 | 6 | 25 | The body moves before the mind finishes deciding to — pure reflex built from countless close calls. [invented] |
| tech_sidestep_4 | Sidestep IV | Sidestep | 4 | Dodge | null | buff | statKind: dodge | 0.16 | buffDuration: 3 | 27 | 8 | 45 | Mastery of Dodge: for a few turns, the enemy's rhythm holds no surprises left. [invented] |

---

### Thievery — Cutpurse Strike (damage + gold)

**Design note.** No standalone archived Thievery page survives, but it's listed as one of the core
Skills [archived: reference/manual/Skills.md] and the world already treats theft as a live threat —
a player forum post warns "those damn thieves keep taking all my damn gold whenever I try to rest"
and the reply advises using the vault to protect gold while camping [archived: reference/forum/
t-756.md]. Thievery's passive engine effect already leans hard into "coin on a win": every victory
grants bonus gold (`THIEVERY_GOLD_PER_LEVEL`/`_CAP`) and a chance at one extra drop-table roll
(`THIEVERY_STEAL_PER_LEVEL`/`_CAP`) [archived rule: reference/forum/t-756.md (thieves stealing gold
is a named world hazard); js/core/battle.js lines 1395-1501, js/balance.js lines 233-236 (invented
numbers)]. The active chain mirrors that identity directly in combat rather than only on the post-
battle roll: a flat-power damage tech with a `goldSteal` rider that grants bonus gold on a landed
hit (once per battle), so a Thievery-trained character is visibly lifting coin off the monster
mid-fight, not just after it's dead.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_cutpurse_strike_1 | Cutpurse Strike I | Cutpurse Strike | 1 | Thievery | null | damage | n/a | 10 | goldSteal: 3 | 11 | 2 | 0 | A dirty, opportunistic strike that lifts a coin purse in the same motion. The most basic Thievery technique taught at any Academy. [invented] |
| tech_cutpurse_strike_2 | Cutpurse Strike II | Cutpurse Strike | 2 | Thievery | null | damage | n/a | 18 | goldSteal: 6 | 15 | 4 | 10 | A quick cut followed by quicker fingers, leaving the enemy hurt and lighter in the pocket. [invented] |
| tech_cutpurse_strike_3 | Cutpurse Strike III | Cutpurse Strike | 3 | Thievery | null | damage | n/a | 28 | goldSteal: 12 | 21 | 6 | 25 | A practiced thief's strike, timed to land exactly when the enemy is too busy reeling to notice the theft. [invented] |
| tech_cutpurse_strike_4 | Cutpurse Strike IV | Cutpurse Strike | 4 | Thievery | null | damage | n/a | 40 | goldSteal: 20 | 27 | 8 | 45 | Mastery of Thievery: a wound and a windfall dealt in the same breath. [invented] |

---

### Dual Wield — Crosscut (weapon damage)

**Design note.** No standalone archived Dual Wield page survives, but it's listed as a core Skill
[archived: reference/manual/Skills.md] and Dexterity is archived as increasing XP gained in Dual
Wield alongside Knives/Dodge/Thievery/Double Attack/Hand to Hand [archived: reference/manual/
Dexterity.md] — the "two blades, quick hands" cluster of skills. The passive engine effect already
gives a guaranteed offhand follow-up swing on every basic Attack when both hand slots hold weapons,
scaled by `DUAL_WIELD_OFFHAND_MULT_BASE + level * _PER_LEVEL` (capped) [archived rule: reference/
manual/Dexterity.md/Skills.md; js/core/battle.js lines 733-761, js/balance.js lines 258-261
(invented numbers)]. The active chain is designed to extend that exact passive rather than add a
new mechanic: it's a `weaponTech` main-hand strike (`requiresOffhandWeapon: true`) whose swing also
triggers the same guaranteed offhand follow-up at the character's current Dual Wield multiplier —
"both blades in one motion" is literally the tech applying the passive's follow-up on top of a
stronger primary hit instead of a plain Attack.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_crosscut_1 | Crosscut I | Crosscut | 1 | Dual Wield | null | damage | weaponTech: true | 1.2 | requiresOffhandWeapon: true (triggers guaranteed offhand follow-up) | 14 | 3 | 4 | Both blades move as one — a main strike immediately trailed by the offhand. The most basic Dual Wield technique taught at any Academy. [invented] |
| tech_crosscut_2 | Crosscut II | Crosscut | 2 | Dual Wield | null | damage | weaponTech: true | 1.5 | requiresOffhandWeapon: true (triggers guaranteed offhand follow-up) | 18 | 4 | 10 | The gap between the two blades closes further, the offhand arriving almost before the eye registers the first cut. [invented] |
| tech_crosscut_3 | Crosscut III | Crosscut | 3 | Dual Wield | null | damage | weaponTech: true | 1.8 | requiresOffhandWeapon: true (triggers guaranteed offhand follow-up) | 24 | 6 | 25 | Both edges committed in a single fluid motion, each strike disguising the other's angle. [invented] |
| tech_crosscut_4 | Crosscut IV | Crosscut | 4 | Dual Wield | null | damage | weaponTech: true | 2.1 | requiresOffhandWeapon: true (triggers guaranteed offhand follow-up) | 30 | 8 | 45 | Mastery of Dual Wield: two blades that strike as a single weapon, no gap left to answer. [invented] |

---

### Double Attack — Tempo (buff: double_attack)

**Design note.** Archived identity: *"Double Attack Increases your chance of attacking twice in a
single turn"* [archived: reference/manual/Version_3.0.md, §2.2.3], and Dexterity again lists Double
Attack among the skills it accelerates [archived: reference/manual/Dexterity.md]. The passive engine
effect is unconditional per-attack: every basic Attack rolls `DOUBLE_ATTACK_BASE + dexterity *
DOUBLE_ATTACK_PER_DEX + level * DOUBLE_ATTACK_PER_SKILL_LEVEL` for a second hit [archived rule:
reference/manual/Version_3.0.md, Dexterity.md; js/core/battle.js lines 103-107, js/balance.js lines
103-105 (invented numbers)]. Like Dodge above, the active chain gives the player an on-demand spike
of that same passive stat for a few turns — "striking in the gap between heartbeats" is the flavor
of temporarily raising the double-attack roll rather than introducing a separate mechanic, keeping
Double Attack's kit consistent with how it already behaves passively.

| id | name | chain | rank | skill | grade | effect | statKind/debuffKind/other | power(or powerMult) | extra (duration/goldSteal/requires) | energyCost | trainingCost | skillReq | desc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tech_tempo_1 | Tempo I | Tempo | 1 | Double Attack | null | buff | statKind: double_attack | 0.05 | buffDuration: 3 | 10 | 2 | 0 | Finds the gap between the enemy's heartbeats and strikes twice into it, adding to Double Attack chance for a few turns. The most basic Double Attack technique taught at any Academy. [invented] |
| tech_tempo_2 | Tempo II | Tempo | 2 | Double Attack | null | buff | statKind: double_attack | 0.08 | buffDuration: 3 | 15 | 4 | 10 | A tightening sense of tempo, letting the second strike land closer on the heels of the first. [invented] |
| tech_tempo_3 | Tempo III | Tempo | 3 | Double Attack | null | buff | statKind: double_attack | 0.12 | buffDuration: 3 | 21 | 6 | 25 | The fighter's rhythm outpaces the enemy's own, fitting a second blow into a beat that shouldn't have one. [invented] |
| tech_tempo_4 | Tempo IV | Tempo | 4 | Double Attack | null | buff | statKind: double_attack | 0.15 | buffDuration: 3 | 27 | 8 | 45 | Mastery of Double Attack: every strike arrives as a pair, with no beat left uncovered. [invented] |

## 3. Balance rationale & sim gate

### Scaffold derivation (do-not-re-derive sources: `js/balance.js`, shipped chain data)

- **Rank spacing** skillReq 0(±4)/10/25/45. Skill cap = 2·L+1 [archived:
  reference/manual/Recent_Updates.md 2007-04-30], so ranks unlock for a trained skill at
  roughly character levels 1 / 5 / 12 / 22 — a mid-game-complete arc, deliberately looser than
  the shipped 0–70 nine-rank chains (request permits deviating from the exact pattern).
- **Energy / trainingCost** per rank follow the shipped rank-to-rank deltas (Firebolt/Cleave
  bands: en +5–6/rank, tc 2/4/6/8 at these reqs — matches Warrior's Edge and the Band-A/B
  extension conventions in `js/data/techs.js`).
- **Buff powers (damage/armor/spellpower)** 6/12/20/30 extend Warrior's Edge's shipped 6@0 →
  12@6 line to the new rank spacing. Heavy Armor's Ironroot Stance runs a deliberately hotter
  9/16/26/38 (slowest, most committed archetype); Fleetstep/Sidestep dodge buffs are
  +4/6/9/12% and +5/8/12/16% flat dodge chance; Tempo +5/8/12/15% double-attack chance.
- **Debuff powers.** Monster damage = 3+2·L and armor ≈ L (`js/balance.js`). At the character
  levels where ranks unlock (≈1/5/12/22), damage-debuff powers 4/8/14/22 shave ≈30–45% of an
  at-level monster's damage; armor-debuff powers 3/6/10/16 remove roughly the at-level
  monster's full armor at floor 0. Both floors prevent degenerate zeroing.
- **Bleed ticks** 5/10/16/24 ≈ three-round totals of 15/30/48/72 vs monster hp 20+12·L —
  intentionally below Vital Strike burst per energy so bleed is a commit-early tempo tool.
- **Flat damage chains** (Stoneshear, Censure, Shield Bash, Cutpurse Strike) track the Firebolt
  band (14/26/40/56 at req 0/10/25/45 — rank IV sits between the shipped tapered Firebolt VI
  51@40 and VII 62@50, i.e. already on the post-ARMOR-STACK-CORRECTION curve). Shield Bash and
  Cutpurse Strike run slightly under-band (48 / 40 at rank IV) because their casters keep a
  shield's armor / a gold rider respectively.
- **Weapon multipliers.** Crosscut 1.2/1.5/1.8/2.1 and Channeled Strike 1.3/1.7/2.0/2.3. NOTE:
  both rank-IV mults sit **above** the tapered Cleave/Impale line at req 40–50 (≈1.76–1.93,
  OFFENSE_TECH_TAPER 0.55, `js/balance.js` F1) — justified as: Crosscut requires two weapons
  (forgoing shield armor), Channeled Strike rides the weakest weapon class (Rods are caster
  sticks). Explicitly sim-gated below (D4).

### Sim gate (nothing below is final until /balance-sim passes it)

Difficulty contract to uphold: at-level regulars ≥85–100% player win rate; bosses — prepared
players win reliably but pay (HP or consumables); 5 levels down = certain death via Fear.

| Constant family | Metric to check |
|---|---|
| Damage debuffs (Crippling Thrust, Curse powers 4/8/14/22) | **5-down must stay certain death** (debuff + Fear interplay — the single most contract-critical gate here); boss fights must still cost HP/consumables |
| Armor debuffs (Sunder Guard 3/6/10/16) | rounds-to-kill delta vs at-level regulars & bosses; no regular-fight trivialization |
| Bleed (Grave Wound 5/10/16/24 × 3 rounds) | damage-per-energy vs Vital Strike; Fear multiplier applies |
| Armor buffs (Steel Resolve/Nullward/Battle Harness 6/12/20/30; Ironroot 9/16/26/38) | stacking with Spirit Shrine armor buffs + Rage; boss damage-taken floor |
| Dodge / double-attack buffs (+0.04–0.16 / +0.05–0.15) | combined ceiling with DODGE_*/DOUBLE_ATTACK_* passives — define a hard total cap if sim shows >50% dodge uptime |
| Spellpower buff (Attunement 6/12/20/30, pre-multiplier) | Attunement→Firebolt nova turn damage-per-energy vs back-to-back Firebolt; MAGIC_SKILL/ROD multiplier interaction |
| Flat damage chains (Stoneshear/Censure 14–56; Shield Bash 12–48; Cutpurse 10–40) | damage-per-energy parity with Firebolt band; Int-scaling parity |
| Weapon mults (Crosscut 2.1, Channeled Strike 2.3 @ rank IV) | vs OFFENSE_TECH_TAPER band (D4); Crosscut + guaranteed offhand follow-up total |
| goldSteal 3/6/12/20 (win-gated) | economy: gold-per-hunt uplift vs Thievery passive caps (THIEVERY_GOLD_CAP 0.25); must stay below AP/provision no-arbitrage spirit (DESIGN.md §6) |
| All 72 energyCosts | energy-per-battle envelope vs monster energy curve 40+10·L |

## 4. Conventions & handoff checklist

- [x] Drop tables / stock lists: **not touched** — techs are Academy-learned, and the Academy
  list is data-driven from `js/data/techs.js`. New entries are APPENDED to the end of the file,
  grouped per chain, per the Band-A/B precedent.
- [ ] Icons: **72 new** `assets/icons/<id>.png` (32×32, CC0 Dungeon Crawl set, hash-distinct —
  test-enforced): `tech_sunder_guard_1..4`, `tech_crippling_thrust_1..4`, `tech_grave_wound_1..4`,
  `tech_steel_resolve_1..4`, `tech_attunement_1..4`, `tech_curse_1..4`, `tech_stoneshear_1..4`,
  `tech_nullward_1..4`, `tech_censure_1..4`, `tech_fleetstep_1..4`, `tech_battle_harness_1..4`,
  `tech_ironroot_stance_1..4`, `tech_shield_bash_1..4`, `tech_channeled_strike_1..4`,
  `tech_sidestep_1..4`, `tech_cutpurse_strike_1..4`, `tech_crosscut_1..4`, `tech_tempo_1..4`.
- [x] Ids: lowercase snake_case, `tech_` prefix throughout; no collisions (grep-verified against
  `js/data/techs.js` name/chain/id fields by all three design passes).
- [x] Quest gates/chains: n/a (no quests).
- [x] Save impact: **none.** No new persisted character fields — learned techs persist by id in
  the existing list; all new statuses are battle-transient; new fields are data-side only.
- [ ] Tests: all six engine extensions need stubbed-RNG tests via `Game.Battle._rng` (single RNG
  surface — no second RNG); content-suite tech-count constants go stale (75 → 147 player techs);
  icon hash test covers the 72 new icons.
- [ ] Changelog (PREPEND to `js/data/changelog.js`, player-facing): "The Academies of Averast
  have expanded their curriculum: every skill now has its own technique chain — 72 new
  techniques, including the first guard-breaking and strike-sapping debuffs, bleeding wounds,
  battle stances, shield blows, and coin-lifting strikes."
- [ ] UI: buff/debuff log lines must name the affected stat; the archived techs-page type tabs
  ("Added tabs to the techs page to sort techniques by type"
  [archived: reference/manual/Version_2.1_Changes.md]) gain buff/debuff categories.

## 5. Open decisions — ALL RESOLVED (user, 2026-07-17)

- **D0 — Interpretation: RESOLVED — all 18 skills.** The nine tech-less skills get chains too;
  the spec stands as written.
- **D1 — Absorption polarity: RESOLVED — shield buff.** Drain counts as damage-dealing;
  Nullward (buff, statKind armor) stands.
- **D2 — "Curse" name reuse: RESOLVED — keep "Curse".** Archive-first naming stands; the
  battle-log UI note in §4 should disambiguate the tech from the player-afflicting status.
- **D3 — Engine-extension scope: RESOLVED — ship all six** extensions in §2.0, including the
  goldSteal rider.
- **D4 — Taper-band multipliers: RESOLVED — sim decides.** Crosscut IV 2.1 / Channeled Strike IV
  2.3 go to /balance-sim as proposed, with pre-registered fallbacks 1.85 / 1.95 if the sim
  shows fight-compression.

## 6. Out of scope

Class-only techs, monster techs (`mon_`), shrine buffs, new Anima grades, limit breaks, new
skills, quest/trainer NPC placement beyond the existing Academy facility, any v3.0 system
(Eidolons, Force/Cunning/Brilliance, elemental alignment), and all implementation (repo
CLAUDE.md workflow: delegate-review, tests, /balance-sim).

## Archive files cited (merged)

- `reference/manual/Skills.md` — the 18-skill roster
- `reference/manual/Techs.md` — "healing, stat increase, and attack"; Academy/Training Points
- `reference/manual/Techniques.md` — chain learning/equipping model
- `reference/site/homepage_2007.md` — May-2007 per-spell chain + trainer/skill-gate design
- `reference/manual/Recent_Updates.md` — Anima grades incl. Light/Dark (2007-04-20); Int
  spell hit/miss (2007-04-21); skill cap 2·L+1 (2007-04-30); "Alteration is now affected by
  Spell Powers" (2007-04-06)
- `reference/manual/Version_2.1_Changes.md` — detrimental effects (Poison, Haunting, Curse);
  techs-page type tabs; "Rebalanced techniques to match melee weapons of equivalent level"
- `reference/manual/Version_3.0.md` — definitional skill one-liners only (era caveat, §2.3)
- `reference/manual/Medium_Armor.md`, `reference/manual/Heavy_Armor.md`,
  `reference/manual/Shields.md` — armor/shield skill definitions
- `reference/manual/Dexterity.md` — Dex ties to Dodge/Double Attack/Dual Wield/Thievery
- `reference/manual/Arkan.md` — Arkan mercenary/martial culture
- `reference/manual/Chapter_I.md` — Anima "deep within the crust of the earth" (Stoneshear)
- `reference/forum/t-756.md` — thieves stealing gold as a live world hazard (Cutpurse Strike)
