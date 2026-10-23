# SPEC — Secondary Stats (crit, accuracy, block, Spell Power, armor penetration, Luck)

**Status:** IMPLEMENTED — v1.10.0 release candidate (2026-10-21). P0 sim passed with the D8
Fear rule (§3.1) and was re-run on the implemented code with identical results; all decisions
D1–D9 resolved (§5).
**Relationship to authority:** extends `docs/DESIGN.md` §3 (stats, classes) and §4 (combat).
No archived rule is overridden. Eight existing class passives **gain a
second, smaller effect** (same id, original effect kept), which raises shipped balance — see D3. No [revised]
tags are introduced by this spec.

**Interpretation of the request:** add a layer of *secondary* combat stats on top of the five
archived primary stats (Strength, Vitality, Dexterity, Intelligence, Endurance —
`reference/manual/Strength.md` etc.). Players never spend level-up points on secondary stats;
they come from **gear, class passives, Spirit Shrine buffs** and (existing) typed tech buffs.
First batch, as chosen by the user: Critical Strike Chance, Critical Strike Damage, Accuracy,
Armor Penetration, Block Chance, Spell Power, Luck.

Decisions already made by the user (not re-opened here):

| # | Decision |
|---|---|
| U1 | Secondary stats only — no new point-spend stats, no 6th primary |
| U2 | One shared crit stat — applies to weapon attacks **and** damage techs |
| U3 | Crit and glancing blow resolve on **one three-way roll** |
| U4 | Monsters never crit; no Toughness stat |
| U5 | Player Anima-grade resistances stay removed (`reference/manual/Recent_Updates.md` 2007-04-20) |
| U6 | No Fear Resistance — "5 levels down = certain death" stays untouched |
| U7 | Accuracy does **not** apply to spell techs (weapon techs: yes, D2) |

---

## 1. What changes

| Area | Today (shipped) | After this spec |
|---|---|---|
| Hit outcome | variance → 10% glancing (×0.5) → minus armor (`js/core/battle.js` `attack()`, `useTech()`; `GLANCING_*` in `js/balance.js`) | variance → **three-way roll** glancing / **crit** / normal → minus (pierced) armor |
| Monster dodge vs player | `monsterDodgeChance()`, cap 0.15 | minus player **Accuracy** on weapon attacks and weapon techs |
| Armor vs player hits | flat `monster.armor`; weapon techs carry a per-tech `armorPierce` (0.35/0.5) | + player **Armor Penetration**, stacking additively with `armorPierce` |
| Shields | Armor only (Shields skill scales armor, `js/core/inventory.js` `ARMOR_SKILLS`) | + **Block Chance** (halves a physical hit) |
| Spell damage | `techEffectivePower()`: (power + Attunement buff) × Int × school skill × Rod | + flat **Spell Power** in the same slot as the Attunement buff |
| Forage / XP | uniform pick from area `forage` table; XP × Fury × champion | **Luck** improves forage picks and adds a small XP bonus |
| Bonus sources | class `passive` effects, shrine `effect`s, typed `statKind` buffs | + 7 class effect kinds, + 7 shrine effect kinds, + new optional item field `bonuses` |

**A shipped mismatch this fixes:** Wizard's *Arcane Might* and Magus's *Anima Mastery* say
"+X% Damage (all sources)" in their `desc`, but `damage_pct` is read only by
`Game.Character.getDamage()`/`getOffhandDamage()` (`js/core/character.js`). Those are weapon
damage functions, so the passives never boost spells. Adding a Spell Power effect (§2.9) and
correcting the descs gives the caster classes' signature passives a real effect on casting.

---

## 2. Design detail

### 2.1 Shared plumbing [invented]

One aggregator, so every stat reads the same way:

```
Game.Character.getSecondaryStat(c, key) =
    BASE[key]
  + Σ equipped items' bonuses[key]                       (all 6 EQUIP_SLOTS)
  + Game.Classes.classBonus(c, CLASS_EFFECT[key])        (active Primary + Secondary)
  + Game.World.shrineBonus(c, key)
  → clamped to CAP[key]
```

| key (item `bonuses` + shrine `effect`) | class passive `effect` | BASE | CAP | Unit |
|---|---|---|---|---|
| `critChance` | `crit_chance_flat` | 0.05 | 0.50 | probability |
| `critDamage` | `crit_damage_flat` | 0.50 | 2.00 | bonus over ×1 (0.50 = crits deal ×1.5) |
| `accuracy` | `accuracy_flat` | 0 | 0.15 | flat reduction of monster dodge |
| `armorPen` | `armor_pen_flat` | 0 | 0.30 | fraction of monster Armor ignored |
| `block` | `block_flat` | 0 | 0.35 | probability (needs a shield, §2.5) |
| `spellPower` | `spell_power_flat` | 0 | none | flat tech power |
| `luck` | `luck_flat` | 0 | 50 | points |

- `classBonus()` is effect-name-generic (`js/core/classes.js`), so new effect kinds need no
  new code. Its only change is reading the new `bonusEffects` field (§2.9). `shrineBonus()`
  is also generic (`js/core/world.js`).
- Typed tech buffs (`playerStatKindBuff`, `js/core/battle.js`) are **not** routed through the
  aggregator. The existing `'spellpower'` buff (Attunement) keeps its current read in
  `techEffectivePower()`, so nothing is counted twice.
- **Fear (D8, sim-locked §3.1):** inside a battle, every new stat except Luck is multiplied by
  `Game.Battle.fearMultiplier(battle)` (×0.9 per level below the enemy,
  `reference/manual/Fear.md`). That includes the base 5% crit and the crit-damage bonus, and
  applies after the cap. At **5+ levels below** the enemy, every new stat is **0**. Spell
  Power needs no extra Fear factor at 1–4 levels below, because tech damage is already
  multiplied by Fear downstream. It is still set to 0 at 5+. Outside battle (Status screen)
  the unscaled value is shown.
- **No primary-stat feeds in this batch** (see D5). Dexterity already drives dodge, double
  attack, turn order and Knife damage. The repo has already trimmed an "Intelligence does
  everything" overload once (`docs/SPEC-V1.6-REBALANCE.md`, CB-5). Stacking more onto one
  primary stat would repeat that problem.
- New BALANCE constants (all `// invented`, sim-gated): `CRIT_BASE_CHANCE`,
  `CRIT_CHANCE_CAP`, `CRIT_BASE_DAMAGE`, `CRIT_DAMAGE_CAP`, `ACCURACY_CAP`, `ARMOR_PEN_CAP`,
  `ARMOR_PEN_TOTAL_CAP`, `BLOCK_CAP`, `BLOCK_PER_SKILL_LEVEL`, `BLOCK_REDUCTION`,
  `BLOCK_SKILL_XP_PER_PROC`, `LUCK_CAP`, `LUCK_FORAGE_PICK_PER_POINT`, `LUCK_XP_PER_POINT`.

### 2.2 Critical Strike Chance and Critical Strike Damage [invented]

No crit mechanic exists anywhere in the archive or in `js/`. The remake's class data already
promises it: Rogue is "(crits/dodge)" and Assassin is "burst crit"
(`js/data/classes.js` header and Assassin entry).

**The three-way roll (U3).** At every player hit site, the existing single glancing roll
becomes:

```
r = rng()                                   // ONE call, same position as today's glancing roll
if      r < GLANCING_CHANCE                 → glancing: raw × GLANCING_MULT (0.5)
else if r < GLANCING_CHANCE + critChance    → crit:     raw × (1 + critDamage)
else                                        → normal
```

- Glancing keeps the low band, so existing stubbed tests with `r < 0.10` still glance. The RNG
  call count and order do not change.
- Glancing blows are archived (`reference/manual/Recent_Updates.md` 2007-04-09, "Glancing
  blows work properly again"). Their 10% / ×0.5 numbers are invented and unchanged here.
- With crit at its 0.50 cap plus 0.10 glancing, at least 40% of hits stay normal.
- The multiplier is applied to `raw` **before** mitigation, the same as glancing.
- Log text: `"Critical strike! You strike the X for N damage."` /
  `"You cast Firebolt (critical) for N damage."`

| Hit site (`js/core/battle.js`) | Crit? | Note |
|---|---|---|
| `attack()` main hit(s), incl. double attack | ✅ | each hit rolls separately |
| `attack()` dual-wield offhand swing | ✅ | |
| `useTech()` weapon techs | ✅ | |
| `useTech()` damage / drain spell techs | ✅ | U2. A drain heals from damage dealt, so a crit drain heals more |
| `limitBreak()` | ❌ | keeps its plain glancing roll. Already ×2.0 (D4) |
| heals, buffs, DoT / bleed / servitor ticks | ❌ | no glancing roll today, no crit roll either |
| companion attacks, monster → player hits | ❌ | U4 |

### 2.3 Accuracy [invented]

```
effectiveMonsterDodge = max(0, monsterDodgeChance(monster) − accuracy)
```

- Applies to every `monsterDodgeChance()` roll against a player weapon action: `attack()` main
  hit(s), the offhand swing, and in `useTech()` both the per-hit roll of `weaponTech`s and the
  pre-cast roll of `physicalRoll` techs (D2). Spell techs keep the Intelligence
  hit check (`INT_SPELL_HIT_*`, rule archived at `reference/manual/Recent_Updates.md`
  2007-04-21).
- Stacks with the existing Dragon Kick `dodgeDebuff`. Both reduce the chance, floored at 0.
- `ACCURACY_CAP` 0.15 = `MONSTER_DODGE_CAP`, because any Accuracy above that does nothing.
- Monster dodge reaches its 0.15 cap at monster level ~33 (0.02 + 0.004·L). Accuracy is
  therefore worth less early on. This is intentional, since most Accuracy sources are
  mid-game or later.

### 2.4 Armor Penetration [invented]

```
pierce     = min(ARMOR_PEN_TOTAL_CAP 0.75, (tech.armorPierce || 0) + armorPen)
mitigation = monster.armor × (1 − pierce)
```

- Applies to physical player hits: `attack()` main and offhand, weapon techs, `limitBreak()`.
  It never touches Magic Armor; graded spells are unaffected.
- The guardian halving and the `max(1, …)` floor still apply afterwards, as today.
- This also gives melee classes a way around the "over-armored monster stalls melee"
  failure mode that shipped twice (cheat-sheet §Balance).

### 2.5 Block Chance [invented mechanic; archived skill]

The Shields skill is archived (`reference/manual/Shields.md`: "Affects the efficiency with
which you use shields."; added `reference/manual/Recent_Updates.md` 2007-04-22). Block gives
shields a role besides Armor.

```
blockChance = 0                                          if offhand is not a Shields-skill item
            = min(BLOCK_CAP 0.35, shield.bonuses.block
                  + Shields skill level × BLOCK_PER_SKILL_LEVEL 0.0015
                  + class block_flat + shrine block)     otherwise
```

- Rolled in `monsterAct()` **after** the player's dodge roll fails, and only against physical
  hits: monster basic attacks, charged releases, and `grade: null` monster techs. Graded
  (elemental) hits are Magic Armor's job and cannot be blocked.
- The roll uses one extra `rng()` call, made **only** when `blockChance > 0`.
- On a block, the final damage is `max(1, round(dmg × (1 − BLOCK_REDUCTION 0.5)))`. This comes
  after mitigation and the `DAMAGE_PENETRATION_FLOOR`, and before Defend halving, so
  Block + Defend leaves 25% of the hit.
- Each block grants `BLOCK_SKILL_XP_PER_PROC` = 1 Shields skill XP, the same use-based pattern
  as Dodge (`DODGE_SKILL_XP_PER_PROC`).
- Log text: `"You catch the X's attack on your shield! You take N damage."`
- Shrine and class `block` bonuses do nothing without a shield. Their `desc` must say so.
- Block only reduces damage. Dodge (cap 0.5) remains the only way to avoid a hit completely.

### 2.6 Spell Power [archived name; invented formula]

`reference/manual/Recent_Updates.md` 2007-04-06: "Alteration is now affected by Spell
Powers". The name and the fact that it scales techs are archived. The formula was never
documented.

```
techEffectivePower (damage/drain):
  round((tech.power + attunementBuff + spellPower) × (1 + Int×0.02) × magicSkillMult × rodMult)
techEffectivePower (heal):
  round((tech.power + spellPower) × (1 + Int×0.01))
buff / debuff techs: unchanged
```

- Applies to techs of every school, including Alteration's damage chain (Stoneshear). That
  matches the archived line.
- It does **not** apply to `weaponTech`s, because those scale off weapon Damage.
- Servitor ticks run through this same function (Attunement precedent,
  `docs/SPEC-TECH-POLARITY.md` §0 finding d), so Spell Power boosts them too (D7).
- Scale reference: player damage techs have power 14 → 92 (`js/data/techs.js`,
  Firebolt I–IX); Attunement I–IV gives +12 / +24 / +40 / +60.

### 2.7 Luck [archived 2004-era concept; invented mechanics]

Archived as a 2004-era primary stat. The game's creator defined it as determining "what kind
of items you can Forage for and how much experience you get from battles"
(`reference/forum/t-449.md`, Nerevar, 11-26-2004). That era is invention fuel (`docs/DESIGN.md` §1).
This spec keeps both archived roles as a secondary stat (U1).

| Effect | Formula | At 20 Luck | At cap (50) |
|---|---|---|---|
| **Lucky pick (forage):** chance to roll a second candidate from the area's `forage` table and keep the one with the higher `value` | `luck × LUCK_FORAGE_PICK_PER_POINT 0.01` | 20% | 50% |
| **Battle XP:** applied to `xpGain` in `onWin()`, multiplying with Fury and the champion bonus | `× (1 + luck × LUCK_XP_PER_POINT 0.002)` | +4% | +10% |

- The lucky-pick roll uses one extra `rng()` call, made **only** when `luck > 0`. It applies to
  both the first item and the second-item roll in `Game.World.forage()`. `FORAGE_SUCCESS`
  (0.70) and `FORAGE_SECOND_ITEM` (0.30) are unchanged.
- Luck XP does not count toward the Fury cap (`FURY_XP_CAP` 0.25). It is a separate,
  smaller multiplier.
- The XP/loot cutoff (5 levels, `reference/manual/Fear.md`) is untouched. Luck never grants
  XP on cutoff wins.
- Reachable Luck in this batch: 10 (Gambit) + 10 (shrine) = 20. The cap of 50 leaves room for
  later gear.

### 2.8 Gear: item `bonuses` field by weapon family [invented]

**Schema addition** (`js/data/items.js`): optional `bonuses: { <key>: number }`, using the
keys from §2.1. Every item carrying it adds its values while equipped in any slot. Offhand
weapons count too, so twin knives stack crit (sim-gated).

Each weapon family gets a signature stat:

```
band = floor(levelReq / 20)        // L1–19: 0 · 20–39: 1 · 40–59: 2 · 60–79: 3 · 80–99: 4
uniques (tag 'unique'): band + 1   // the +15–25%-over-curve rule for uniques
AP items: band as-is               // the AP rule: never above non-unique gear
```

| Family (item `skill`) | Key | Formula | Band 0 → 4 | Items | Source |
|---|---|---|---|---|---|
| Swords | `accuracy` | 0.02 + 0.01·band | 0.02 → 0.06 | 20 (incl. `ap_blade_veterans_edge` → 0.04) | [invented] |
| Knives (main + offhand) | `critChance` | 0.02 + 0.01·band | 0.02 → 0.06 | 17 | [invented] |
| Polearms | `armorPen` | 0.05 + 0.025·band | 0.05 → 0.15 | 13 | [invented]. Echoes the Polearm techs' shipped `armorPierce` |
| Hand to Hand (main + offhand) | `critDamage` | 0.10 + 0.05·band | 0.10 → 0.30 | 18 | [invented] |
| Rods | `spellPower` | 1 + 2·band | 1 → 9 | 20 | [invented] |
| Shields | `block` | 0.05 + 0.02·band | 0.05 → 0.13 | 10 | [invented] |

- The item counts are a snapshot of `js/data/items.js` (v1.9.0). The implementer applies the
  formula to **every** item of each family, so new items picked up later follow the same rule.
- Armor pieces get no `bonuses` in this batch.
- `desc` fields are unchanged. The item info box shows the bonuses as their own lines
  (e.g. "+4% Critical Strike Chance").
- No new ids, so no new icons are needed.

### 2.9 Classes: extended passives (D3)

Eight existing passives **keep their original effect and gain a second, smaller one** (D3).
The **id, name and `classLevelCost` stay the same**, so purchased abilities in saves keep
working with no migration. The per-tier ability counts locked by `tests/test_p6_classes.js`
(3 / 4 / 3–4 / 4) are unchanged.

**Schema addition** (`js/data/classes.js` passive abilities): optional
`bonusEffects: [{ effect, power }]`. `Game.Classes.classBonus(c, effect)` (`js/core/classes.js`)
adds every matching `bonusEffects` entry of a bought passive, alongside its main
`effect`/`power`. Abilities without the field behave exactly as today. The class-sheet and
Academy UI list both effects.

| Class (tier) | Ability id | Name | Main effect (unchanged) | **+ bonusEffects** | New `desc` | Tag |
|---|---|---|---|---|---|---|
| Rogue (2) | `rogue_opportunist` | Opportunist | damage_pct 0.12 | **crit_chance_flat 0.06** | A Rogue always finds the gap in an opponent's guard — +12% Damage and +6% chance to land a critical strike. | [invented] |
| Assassin (3) | `assassin_killing_instinct` | Killing Instinct | damage_pct 0.15 | **crit_damage_flat 0.25** | Every strike aimed at the fastest way to end the fight — +15% Damage, and critical strikes deal +25% more. | [invented] |
| Ranger (3) | `ranger_marksmans_eye` | Marksman's Eye | damage_pct 0.12 | **accuracy_flat 0.05** | A trained eye finds the opening a plain Mercenary's swing would miss — +12% Damage, and enemies are 5% less likely to dodge your weapon strikes. | [invented] |
| Dragoon (3) | `dragoon_dragons_might` | Dragon's Might | damage_pct 0.12 | **armor_pen_flat 0.08** | Old dragon-sworn discipline behind every swing — +12% Damage, and your blows ignore 8% of an enemy's Armor. | [invented] |
| Warden (3) | `warden_barrier_ward` | Barrier Ward | magic_armor_flat 12 | **block_flat 0.05** | A standing barrier of protective Anima — flat +12 Magic Armor, and +5% chance to block while a shield is equipped. | [invented] |
| Wizard (2) | `wizard_arcane_might` | Arcane Might | damage_pct 0.16 | **spell_power_flat 4** | Anima answers a Wizard with unusual force — +16% weapon Damage and +4 Spell Power to every damaging or healing technique. | [invented] |
| Magus (3) | `magus_anima_mastery` | Anima Mastery | damage_pct 0.19 | **spell_power_flat 5** | Full command over raw Anima, beyond even a Wizard's reach — +19% weapon Damage and +5 Spell Power to every damaging or healing technique. | [invented] |
| Gambit (3) | `gambit_lucky_coin` | Lucky Coin | gold_pct 0.12 | **luck_flat 10** | A coin that always seems to land the Gambit's way — +12% Gold from battle wins and +10 Luck. | [archived name: reference/site/homepage_2006.md]; effects [invented] |

- The add-on values are about half of a stand-alone passive (D3 follow-up: "smaller
  add-on"), because these passives now get strictly stronger.
- The Wizard and Magus descs now say "weapon Damage". The shipped "+X% Damage (all sources)"
  wording was inaccurate (§1). The Spell Power add-on gives them a real caster effect.
- The Gambit desc drops the shipped dev note ("Archived as one of…") from player-facing text.
  The citation moves to a code comment.
- Tier discipline: these are new stat lines with no parent value to stay within +25% of, so
  they are provisional, like Assassin's *Predator's Speed* ("Provisional, pending lead's P5
  sim", `js/data/classes.js`). Magus's 5 is +25% over Wizard's 4, exactly the cap.

### 2.10 Spirit Shrine: new buffs [invented]

Shrine schema `{ id, name, shardCost, effect, power, battles, desc }` (`js/data/shrine.js`).
These are **appended** after `shrine_kings_ransom`. Costs and durations sit in the 15–25 shard
mid-tier band, matching *Wind's Grace* (20 shards, 5 battles).

| id | name | shardCost | effect | power | battles | desc |
|---|---|---|---|---|---|---|
| `shrine_hunters_eye` | Hunter's Eye | 20 | critChance | 0.05 | 5 | Sharpens your eye for a weak point, adding +5% Critical Strike Chance for your next 5 battles. |
| `shrine_killing_edge` | Killing Edge | 25 | critDamage | 0.25 | 5 | Lends cruel weight to your finishing blows — critical strikes deal +25% more damage for your next 5 battles. |
| `shrine_true_aim` | True Aim | 15 | accuracy | 0.05 | 5 | Steadies your hand so foes find it harder to slip your swings — +5% Accuracy for your next 5 battles. |
| `shrine_sundering_rite` | Sundering Rite | 20 | armorPen | 0.08 | 5 | A rite of breaking that lets your blows bite past armor — ignore 8% of enemy Armor for your next 5 battles. |
| `shrine_shield_oath` | Shield Oath | 20 | block | 0.06 | 5 | An oath sworn on the shield arm — +6% chance to block for your next 5 battles. Only works with a shield equipped. |
| `shrine_anima_kindling` | Anima Kindling | 20 | spellPower | 6 | 5 | Kindles the Anima in your techniques, adding +6 Spell Power for your next 5 battles. |
| `shrine_wayfarers_charm` | Wayfarer's Charm | 15 | luck | 10 | 5 | A small charm blessed for travellers, adding +10 Luck for your next 5 battles. |

`shrineBonus()` sums every active buff of a kind. *Shield Oath* + Warden + a band-4 shield +
skill is capped by `BLOCK_CAP`. These buffs count down on battle-ends but apply between battles too
(`shrineBonus()` reads `c.shrineBuffs` directly), so *Wayfarer's Charm* also improves forage
picks while it lasts, and foraging does not use up its charges.

### 2.11 Display [invented]

- `js/data/statinfo.js`: seven new entries (`critChance`, `critDamage`, `accuracy`, `armorPen`,
  `block`, `spellPower`, `luck`), each with a `summary`, `effects`, and a `cite` line in the
  existing style.
- The Status screen (`js/ui/screens.js` `renderStatus`) gets a "Combat Stats" block showing
  each aggregated value with an ⓘ link. Hide a stat while it is at 0 and has no source,
  so new characters don't see a wall of zeros (critChance and critDamage always show).
- The item info box shows the `bonuses` lines.
- Changes to the Wiki page (`wiki.html`, `tests/test_wiki.js`) only if that page lists stats.
  The implementer checks.

---

## 3. Balance rationale and sim gate

**Expected-value anchors** (EV = average damage gain from crits = critChance × critDamage):

| Case | Before | After | Comment |
|---|---|---|---|
| Everyone (base) | glancing −5% EV | glancing −5%, crit **+2.5%** | small global player buff (D1) |
| Rogue, knives L95 main + offhand | ×1.12 | ×1.12 × crit (0.05+0.06+0.06+0.06 = 0.23 × 0.5 = 1.115) ≈ **+25%** | net gain ≈ +11% over before |
| Rogue (secondary) + Assassin (primary), twin L95 knives | ×1.12 × 1.15 ≈ +29% | ×1.288 × crit (0.23 × 0.75 = 1.17) ≈ **+51%** | **largest jump in the spec**. Sim S2 is the key check |
| Assassin without Rogue | ×1.15 | ×1.15 × crit (0.17 × 0.75) ≈ +30% | the knife crit band carries it |
| Ranger L60+ | +12% damage | ×1.12 × hits 85% → 90% (+5.9%) ≈ **+18.6%** | modest gain |
| Dragoon | +12% damage | + 8% of monster Armor ignored | small. Matters most vs armored monsters |
| Wizard, Firebolt IV (56) / IX (84) | +16% weapon damage only (nothing for spells) | + 4 power ≈ **+7% / +4.8% spell damage** | first real caster effect on this passive |
| Warden | +12 Magic Armor | + 5% block with a shield | small defensive gain |
| Gambit | +12% gold | +12% gold, +2% XP, 10% lucky picks | small utility gain |

**Sim gate** — run the repo's balance simulation against the real game code before locking any
of these:

| # | Constant(s) | Metric | Contract to uphold |
|---|---|---|---|
| S1 | `CRIT_BASE_CHANCE`, `CRIT_BASE_DAMAGE` | at-level regular win %, mean rounds, all bands | ≥85–100% win; mean rounds must not collapse (bosses still cost HP or consumables) |
| S2 | `CRIT_CHANCE_CAP`, `CRIT_DAMAGE_CAP`, Rogue / Assassin / H2H / knife values | Rogue + Assassin with best-in-band twin knives vs every boss | bosses: prepared players win reliably **but pay**. No one-round boss kills |
| S3 | Wizard 4 / Magus 5 / Rod `spellPower` / *Anima Kindling* 6, incl. Conjurer servitor ticks (D7) | caster win % and Energy left after fights, L30–100 | ≥85% at level. Casters must not out-damage melee per Energy spent |
| S4 | `ARMOR_PEN_CAP`, `ARMOR_PEN_TOTAL_CAP`, Dragoon 0.08, polearm band | rounds vs the most heavily armored monster in each band | no stalls (the over-armor bug) and no armor made irrelevant |
| S5 | `BLOCK_*`, Warden 0.05, shield band, *Shield Oath* | Warden + Crusader with shield vs bosses; HP left | bosses still cost HP. 5 levels down still means certain death via Fear (`reference/manual/Fear.md`) |
| S6 | `ACCURACY_CAP`, Ranger 0.05, sword band; basic attacks **and weapon techs** | hit % and win % L30–100 | ≥85% at level |
| S7 | `LUCK_XP_PER_POINT` | time to level 100 at 20 Luck | stays near the ~11.7h pacing. Flag if it drops more than 10% |
| S8 | every new shrine buff | win % with all buffs stacked at once vs bosses | bosses still cost HP or consumables |

### 3.1 Sim results (P0, 2026-10-21)

**Method.** The real game code (v1.9.0, save v11) was loaded in node `vm`. The spec was applied
as in-memory source patches to `battle.js` and `classes.js` plus data edits (v1.8 P0
precedent). Shipped and spec builds were run on identical fixtures and seeds (mulberry32),
**300 trials per cell**.

- **Six build fixtures:** Warrior (sword + shield), Rogue (twin knives), Wizard (rod +
  Firebolt), Warden (sword + shield), Dragoon (polearm), Ranger (sword).
- **Each fixture has:** the best non-unique gear at its level, all stat points spent, skills
  at half level, 3 potions + 3 crystals, and both classes (tier-1+2 at L30+, tier-2+3 at
  L60+) with all passives bought.
- **Cells:** every at-level regular, the boss nearest each level (L10/32/60/90), and a true
  5-levels-down regular.
- The script is ephemeral (scratchpad), per the repo's sim convention.

| Gate | Result | Verdict |
|---|---|---|
| At-level regulars (S1, S6) | **100% win** in every cell, shipped and spec | ✅ |
| Bosses (S1–S6) | spec win 83–100%, never below shipped. Mean rounds −5 to −20%. HP left on win 56–79% | ✅ "win but pay" holds everywhere |
| Rogue + Assassin burst (S2) | L60/L90 boss rounds 7.9→7.3 and 7.5→6.9. No one-round kills | ✅ far below the +51% paper EV |
| Casters (S3) | Wizard L10 boss 52%→83% (shipped wizard is weak there). L32–90 bosses ~0.5 rounds faster | ✅ |
| 5-levels-down (all) | **Widened.** Ranger L86 76.0%→92.0%, Ranger L30 61.0%→71.7%, Dragoon L30 63.0%→73.0%, Warden L56 97.3%→100%. L7 cells stay 0% | ❌ **fails "must not widen"** |
| Shrine stack (S8) | Rogue L32 vs Kastengard Custodian with every tier-3 buff stacked: shipped 80% HP left (already at the line), spec 85%. Halving the new buffs gives 84%. Allowing only one new buff gives 81–82% | ⚠️ narrow fail, mostly pre-existing |
| Luck pacing (S7) | Analytic: max reachable Luck in this batch is 20 → +4% XP → about −4% time to level 100 | ✅ under the 10% flag |

Note on the fixture: with these fixtures the **shipped** game already loses the 5-down
contract from L30 (e.g. Warrior L30 87% win 5 levels down). That is the known accepted
limitation (DESIGN §4), and it appears earlier than "~L50" with fully-bought classes. The
gate checked is the ratchet rule: the spec must not *widen* it.

**Fixing the 5-down widening (ratchet: adjust the new mechanic, not shipped constants).**
New stats ignored Fear (`reference/manual/Fear.md`: "lower your stats by 10% for each
level"). Variants tested, 5-down win %:

| Cell | shipped | spec | × Fear | × Fear² | **off under Fear** |
|---|---|---|---|---|---|
| Ranger L86 | 76.0 | 92.0 | 83.0 | 80.7 | **76.0** |
| Ranger L30 | 61.0 | 71.7 | 66.3 | 63.0 | **61.0** |
| Dragoon L30 | 63.0 | 73.0 | 66.7 | 64.7 | **63.0** |
| Dragoon L86 | 96.0 | 99.3 | 98.0 | 97.0 | **96.0** |
| Warden L56 | 97.3 | 100.0 | 98.3 | 98.0 | **96.7** |
| Warden L86 | 96.3 | 99.7 | 98.7 | 98.0 | **97.7** (noise, SE ≈ 1pt) |

Only "off" brings 5-down back to shipped. Adopted rule (**D8**, user-approved): new secondary stats are
**scaled by Fear** like every other stat (archived) at 1–4 levels below, and **suppressed
entirely at 5+ levels below**, which is the same threshold as the XP/loot cutoff. At exactly
5 down this behaves the same as the "off" column above by construction. The 1–4-levels-down
band is not in the contract and was not simmed.

---

## 4. Conventions and handoff checklist

- [x] **Drop tables / stock lists:** untouched. The 7 shrine entries are **appended** after
  `shrine_kings_ransom`.
- [x] **Icons:** none. No new item, monster or player-tech ids. The new shrine ids need no
  icons (they aren't covered by `tests/test_icons.js`).
- [x] **Ids:** shrine `shrine_` prefix, snake_case. Class ability ids are unchanged.
- [x] **Quests:** not touched.
- [x] **Save impact: none.** `bonuses` lives on item definitions, class/shrine effects are data,
  and `shrineBuffs` stores `{ id, battlesLeft }` (new ids are fine). No new character field,
  no version bump (stays at `CURRENT_VERSION = 11`, `js/core/save.js`). **Behavior change for
  existing saves:** characters that already bought one of the 8 extended passives get the
  added effect on load, on top of what they had. No one loses power.
- [ ] **Tests affected** (all suites must stay green):
  - `tests/test_p3_battle.js` and any stubbed-RNG test: rolls in **[0.10, 0.15)** at a player
    hit site that used to be "normal" now **crit** with base 5%. Sweep for constant stubs in
    that range.
  - Tests that equip a **shield** and run `monsterAct()` now consume **one extra rng() call**
    per physical monster hit (the block roll). Sequenced stubs shift.
  - `tests/test_p6_classes.js`: ability counts are unchanged. Add coverage for `bonusEffects`
    in `classBonus()` (counted only when bought and the class is active, Primary or Secondary).
  - Shrine count or listing assertions (`tests/test_p4_world.js`, if any).
  - `tests/test_wiki.js` if stat lists are enumerated.
  - **New tests** (stubbed `Game.Battle._rng`, never a second RNG): three-way roll band edges;
    crit excluded from Limit Break / heals / ticks; Accuracy floor at 0, applied to weapon
    techs but not to spells; armor-pen additive cap 0.75; block only with a shield and only vs graded:null
    hits; block XP proc; lucky pick keeps the higher `value`; no extra rng() when luck 0 /
    no shield; aggregator caps; Fear scaling at 1–4 levels below and all new stats at 0 at 5+
    levels below (D8).
- [x] **Changelog** (prepend to `js/data/changelog.js`, next version after v1.9.0):

  > **New combat stats.** Your hero now has Critical Strike Chance, Critical Strike Damage,
  > Accuracy, Armor Penetration, Block, Spell Power and Luck — check the new Combat Stats
  > section of your Status screen.
  > - Every weapon type now carries a signature stat: Swords add Accuracy, Knives add Critical
  >   Strike Chance, Polearms pierce Armor, Hand-to-Hand weapons add Critical Strike Damage,
  >   Rods add Spell Power, and Shields can now block blows.
  > - Eight class abilities gained a bonus effect on top of what they already did:
  >   Opportunist (Rogue), Killing Instinct (Assassin), Marksman's Eye (Ranger), Dragon's
  >   Might (Dragoon), Barrier Ward (Warden), Arcane Might (Wizard), Anima Mastery (Magus) and
  >   Lucky Coin (Gambit). If you already learned one, you have the bonus now.
  > - Arcane Might and Anima Mastery now also strengthen your techniques, and their
  >   descriptions now say exactly what they do.
  > - Seven new blessings at the Spirit Shrine.

---

## 5. Decisions (all resolved by the user)

| # | Question | Decision |
|---|---|---|
| D1 | Base crit chance for every hero? | **5% base** (×1.5 damage) |
| D2 | Does Accuracy apply to weapon techs? | **Yes**: basic attacks, offhand swings and weapon techs. Not spells |
| D3 | How do classes get the new stats? | **8 existing passives keep their effect and gain a smaller add-on** via `bonusEffects` (§2.9). No new abilities, no repurposing |
| D4 | Can Limit Breaks crit? | **No** |
| D5 | Do primary stats feed secondary stats? | **No feeds** in this batch. Revisit after the sim |
| D6 | *(superseded by D3)* Gambit's *Lucky Coin* | Keeps +12% Gold and adds +10 Luck |
| D7 | Does Spell Power boost Conjurer servitor ticks? | **Yes**: same pipeline as the Attunement buff |
| D8 | How do new stats interact with **Fear**? (opened by the P0 sim) | **Scaled by Fear at 1–4 levels below, suppressed at 5+ levels below** (§2.1). Keeps 5-down at shipped levels |
| D9 | Fully shrine-stacked Rogue vs the L32 boss at 81–85% HP left (rule ≤80%; shipped already 80%) | **Accepted as an edge case.** It needs about 400 shards of tier-3 buffs at once. No value change |

---

## 6. Out of scope

- Further stats from the suggestion list: HP/Energy regen, lifesteal, healing received,
  Initiative, flee chance, status duration, Item Find, Thorns.
- Toughness / crit resistance (U4), player grade resistances (U5), Fear Resistance (U6).
- New items, uniques or armor pieces with `bonuses`. A follow-up content spec can add them,
  with icons.
- Monster-side changes of any kind.
- The tier-1 Magician's `damage_pct` (also weapon-only). It's left alone because base-tier
  casters are expected to use weapons early on. Worth a separate look.
- Tech-granted typed buffs for the new stats (e.g. a crit stance). Existing `statKind`
  plumbing makes this easy later.
