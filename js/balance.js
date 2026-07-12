// HeroRPG remake — Phase 1 balance constants.
// Every number cites its archived source file, or is marked "invented" where the
// original's server-side data was never captured by the archive.

var BALANCE = {
  CREATION_SKILL_POINTS: 5, // archived: New_Player_Guide.md (Step 2: "distribute 5 skill points")
  CREATION_SKILL_POINT_MAX_PER_SKILL: 3, // archived: New_Player_Guide.md ("may not spend more than 3 points on a single skill")

  LEVELUP_TRAINING_POINTS: 2, // archived: Level_Up.md ("You gain 2 Training Points to spend at the Academy")
  LEVELUP_STAT_POINTS: 5, // archived: Level_Up.md ("You gain 5 Stat Points to spend on the Status page")

  SKILL_CAP: function (lvl) { return 2 * lvl + 1; }, // archived: Recent_Updates.md 2007-04-30 ("A skill cap of (2 x CharLevel + 1) was implemented for all skills.")
  SKILL_XP_FOR_LEVEL: function (lvl) { return 20 * lvl; }, // invented: simple linear per-skill xp curve (moved here from ui/screens.js Phase 1 so js/core/battle.js can share it)

  STRENGTH_DAMAGE_RATIO: 2.5, // archived: Recent_Updates.md 2007-04-06 ("Strength:Damage ratio is 2.5:1 now instead of 3:1"), DESIGN.md §3

  GOLD_PER_PLATINUM: 100, // archived: Gold.md ("100 Gold pieces equals 1 Platinum piece")
  ANIMA_SHARDS_CAP: 999, // archived: Anima_Shards.md ("maximum of 999 Anima Shards at any time")

  XP_TO_LEVEL: function (n) { return Math.round(50 * Math.pow(n - 1, 1.8)); }, // invented: DESIGN.md §10 open decision 1; cumulative XP to reach level n, so level 1 = 0 (characters start at 0 XP)
  // F1 balance-to-100 (docs/SPEC-FULL-LEVEL-ARC.md §2/§9-F1, D1): the game's archived design target
  // was a level cap, not an open-ended climb -- homepage_2007.md (2007-05-25): "The game was
  // originally designed based on a level-100 cap, though we have decided to extend that to a
  // dynamic cap that can be changed as content is released" [archived]; homepage_2006.md: "After
  // playing the game through all 109 levels for myself" [archived]. D1 resolved: hard cap of 100
  // (round number, matches the 2007 design target exactly), stored as ONE constant so a future
  // raise (the archived "dynamic cap" direction) is a one-line change. Game.Character.addXp is the
  // single point that reads this to stop leveling; xpNeededForNext/xpIntoCurrentLevel special-case
  // level >= LEVEL_CAP so the "XP to next level" UI never divides by a zero/undefined delta.
  LEVEL_CAP: 100,
  // F1 balance-to-100 sim finding (docs/SPEC-FULL-LEVEL-ARC.md D2): the F1 exit-gate sim
  // (scratchpad sim_f1_progression.js, real engine via node vm, sampled actions-per-kill at 15
  // levels 1-100 against at-level regulars) extended XP_TO_LEVEL UNCHANGED through level 100 and
  // found NO grind wall: kills-needed-per-level and rounds-per-kill both stay nearly flat across
  // the whole range (the exponent's marginal XP growth, ~n^0.8, is outpaced by MONSTER_XP's linear
  // 10/level reward, so late levels need slightly FEWER kills than mid-game ones). Calibrated
  // against the accepted "level 30 ~= 3-4h" anchor (DESIGN.md §10.1), pure-combat time-to-100 comes
  // out to ~11.7h -- comfortably under the ~40-60h target (D2), even before F2/F3 add the
  // travel/shopping/quest overhead a finished 1-100 arc will carry. D2's contingency ("if 40->100
  // is a grind wall, flatten the tail") therefore does NOT trigger -- XP_TO_LEVEL is intentionally
  // left unchanged, extended as-is to level 100.

  // Starting stats — invented (DESIGN.md leaves numeric starting stats unspecified).
  START_HP: 50, // invented
  START_ENERGY: 100, // invented
  ENERGY_PER_LEVEL: 5, // archived direction: homepage_2007.md 2007-05-25 news — mana "will become a dynamic pool rather than fixed at 100 and will increase with each level"; exact rate invented (Phase 7 balance pass: fixed-100 pools made endgame fights mathematically unwinnable — players capped at 20 actions vs monster HP scaling 12/level)
  START_STAT: 5, // invented — all seven primary stats begin equal

  // Race flavor bonuses — invented, consistent with lore (Human.md trade/economy culture with
  // no stated stat lean; Arkan.md "study of magic and technology" / battlemages using runic magic).
  RACE_BONUS: {
    Human: { strength: 1 }, // invented
    Arkan: { intelligence: 1 } // invented
  },

  SKILLS: [
    'Swords', 'Polearms', 'Knives',
    'Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields',
    'Rods',
    'Evocation', 'Conjuration', 'Alteration', 'Absorption', 'Abjuration',
    'Dodge', 'Thievery', 'Dual Wield', 'Double Attack', 'Hand to Hand'
  ], // archived: Skills.md (18 skills, verbatim list)

  RACES: ['Human', 'Arkan'], // archived: New_Player_Guide.md Step 1, DESIGN.md §1/§3

  // ---------------- Phase 3: Battle engine (DESIGN.md §4, §5) ----------------

  FEAR_STAT_PENALTY_PER_LEVEL: 0.10, // archived: Fear.md ("lower your stats by 10% for each level you are under an enemy's level")
  FURY_XP_PER_TICK: 0.01, // archived: Recent_Updates.md 2007-08-11 ("Each tick on the meter is +1% more combat and skill experience")
  XP_LOOT_CUTOFF_LEVELS: 5, // archived: Recent_Updates.md 2007-04-06 ("The experience/loot cutoff for monsters is once again 5 levels")

  ATTACK_ENERGY_COST: 5, // invented: flat Energy cost per battle action (attack/tech/item); DESIGN.md §4 leaves exact cost unspecified
  MONSTER_ATTACK_ENERGY_COST: 2, // invented: monsters pay less per basic attack than players, so "monster flees at 0 energy" (New_Player_Guide.md) stays a rare anti-turtling event instead of the default outcome — milestone-gate simulation showed 85-100% of fights ending in monsterFled at cost 5
  DAMAGE_VARIANCE: 0.2, // invented: damage rolls vary +-20% around the base value
  GLANCING_CHANCE: 0.1, // invented: 10% chance any hit is a "glancing blow"
  GLANCING_MULT: 0.5, // invented: glancing blows deal half damage

  // invented: Dodge chance scales off Dexterity plus the Dodge skill (archived: Dexterity.md
  // "Increases the possibility to Dodge"); numbers chosen so a naked level-1 has a small
  // baseline chance and a dedicated Dodge build can meaningfully avoid hits.
  DODGE_BASE: 0.02,
  DODGE_PER_DEX: 0.004,
  DODGE_PER_SKILL_LEVEL: 0.01,
  DODGE_CAP: 0.5,
  // invented (Phase 7 balance pass): monsters use their own gentler dodge scaling. The Phase 3
  // stand-in (level x DODGE_PER_SKILL_LEVEL) reached 33-40% at endgame levels and stalled fights;
  // monsters now dodge like a modestly dexterous player, capped well below the player cap.
  MONSTER_DODGE_PER_LEVEL: 0.004,
  MONSTER_DODGE_CAP: 0.15,

  // invented: Double Attack chance scales off Dexterity plus the Double Attack skill (archived:
  // Dexterity.md "Increases the possibility to ... Double Attack"); player-only per DESIGN §4
  // hit-resolution note.
  DOUBLE_ATTACK_BASE: 0.0,
  DOUBLE_ATTACK_PER_DEX: 0.003,
  DOUBLE_ATTACK_PER_SKILL_LEVEL: 0.01,
  DOUBLE_ATTACK_CAP: 0.35,

  MONSTER_XP: function (mLvl) { return 15 + 10 * mLvl; }, // invented: DESIGN.md §4 combat XP formula

  // invented: skill XP granted per use, declining once the player outlevels the monster.
  // archived direction only: Recent_Updates.md 2007-04-21 ("Skill experience now sharply
  // declines when your level is greater than your opponent's").
  SKILL_XP_PER_USE: 8,
  SKILL_XP_MIN_PER_USE: 1,

  // invented: simple flat DoT status length/damage for the Phase 3 Poison effect (DESIGN.md §4
  // "Status effects" lists Poison/Haunting/Curse as archived names for v2.1; only Poison is
  // implemented as a concrete mechanic in Phase 3, Haunting/Curse deferred).
  POISON_DAMAGE_PER_TURN: 3,
  POISON_DURATION_TURNS: 3,

  // ---------------- Phase 4: World & towns (DESIGN.md §2, §6) ----------------

  MONSTER_HP_BASE: 20, MONSTER_HP_PER_LEVEL: 12, // invented ballpark, restated from monsters.js header comment
  MONSTER_DAMAGE_BASE: 3, MONSTER_DAMAGE_PER_LEVEL: 2, // invented ballpark, restated from monsters.js header comment
  MONSTER_ENERGY_BASE: 40, MONSTER_ENERGY_PER_LEVEL: 10, // archived reviewer patch (Phase 3 milestone gate): "monster energy = 40+10*level"

  CAMP_HEAL_NO_TENT: 0.15, // invented: fraction of max HP/Energy restored camping with no tent (New_Player_Guide.md "restore your HP by a percentage depending on whether you have a tent")
  CAMP_ENERGY_FRACTION_OF_HEAL: 1, // invented: Camp restores the same fraction of Energy as HP (New_Player_Guide.md only documents HP; Energy inclusion+fraction invented)

  INN_FEE_BASE: 5, INN_FEE_PER_LEVEL: 2, // invented: New_Player_Guide.md documents the Inn but not its price
  // F1 balance-to-100 economy check (docs/SPEC-FULL-LEVEL-ARC.md §4/§9-F1): verified INN_FEE and
  // HAUNTING_CLEANSE_FEE (below) against a fitted at-level gold-income curve out to level 100 (sim
  // sim_f1_level100.js's getGold()). Both fees are a SMOOTHLY DECREASING fraction of a full
  // energy-bar's income at every level sampled (INN_FEE: ~21% of income at L40 down to ~11% at
  // L100; no cliff, no reversal) -- this is the SAME shape the fee already has across the shipped
  // 1-40 range (it declines there too), so the 40-100 extension does not introduce a NEW
  // inflate-into-irrelevance regression; it continues an already-accepted trend, still a real
  // (double-digit-percent) cost at the cap. Left UNCHANGED -- no slope retune needed.

  SHOP_SELL_RATE: 0.5, // invented: sale price = floor(item.value * 0.5); no archived sell-back rate survived

  VAULT_DEPOSIT_FEE: 0, // archived: Recent_Updates.md 2007-08-01 "Vault revamped, can now store items and gold (safely)" — no fee mentioned, so none charged

  // invented: Academy tech-chain gating model, per homepage_2007.md news ("reach a skill level,
  // then train the next technique in the chain at a trainer") — rank>1 requires the previous
  // rank known AND the governing skill at or above tech.skillReq.
  ACADEMY_CHAIN_GATE: true,

  // ---------------- Phase 8: Hunt (random encounter) ----------------
  // archived: reference/forum/t-755.md — a player asked Nerevar (dev) to raise the encounter
  // chance above the old low rate ("clicking it 60-70 times... isn't fun"); Nerevar's reply:
  // "the chance of finding a monster has been increased to 95%." Bosses are excluded from the
  // random table — they stay explicit "Lair" fights (js/data/areas.js `lair` entries).
  HUNT_ENCOUNTER_CHANCE: 0.95,

  // ---------------- Camping risk (Inn vs Camp real decision) ----------------
  // archived: reference/forum/t-756.md — player: "those damn thieves keep taking all my damn
  // gold whenever I try to rest [camping]. I swear to God, I have only ever had enough GP to
  // sleep in the inn like one time."; developer Nerevar: "you should use the vault to prevent
  // your gold from being stolen while camping." The rule that camping can be robbed (and that
  // the Vault is the counter) is archived; the exact rates below are invented.
  CAMP_EVENT_CHANCE: 0.35, // invented rate; the risk itself is archived (t-756.md)
  CAMP_ROBBERY_WEIGHT: 0.6, // of events: 60% robbery, 40% ambush (invented split)
  CAMP_ROBBERY_GOLD_FRACTION: 0.15, // archived mechanic (t-756.md: gold stolen while camping; vault gold is safe — Nerevar's advice), fraction invented

  // ---------------- Enemy-variety pass: Champion encounters ----------------
  // invented mechanic; flavor-credited to the archived "Champion Bosses" forum-thread title
  // (reference/site/homepage_2006.md lists a thread titled "Champion Bosses" — only the title
  // survived, not its content, so the mechanic itself below is invented in that thread's spirit).
  // Rolled only inside Game.World.hunt() — never in a Lair/boss fight, never in debug.js fight().
  CHAMPION_CHANCE: 0.08, // invented
  CHAMPION_HP_MULT: 1.5, // invented
  CHAMPION_DAMAGE_MULT: 1.35, // invented
  CHAMPION_REWARD_MULT: 2, // invented

  // ---------------- Feature A: Escape can fail (relative-power based) ----------------
  // invented (user-directed): fleeing was previously guaranteed (Phase 3 simplicity note in
  // js/core/battle.js). Chance scales with relative level, how wounded the monster already is
  // (a badly wounded monster can't give chase), and a boss penalty; clamped so it's never a sure
  // thing nor a sure death. Fleeing itself stays FREE and always attemptable at 0 Energy —
  // archived: Energy.md ("you may only end the battle by dying or by fleeing") — FLEE_MIN keeps
  // that escape hatch meaningfully open even against a fresh, higher-level boss.
  FLEE_BASE: 0.65, // invented (user-directed)
  FLEE_PER_LEVEL_DIFF: 0.03, // invented (user-directed)
  FLEE_WOUNDED_BONUS: 0.30, // invented (user-directed)
  FLEE_BOSS_PENALTY: 0.15, // invented (user-directed)
  FLEE_MIN: 0.25, // invented (user-directed)
  FLEE_MAX: 0.95, // invented (user-directed)

  // ---------------- Feature B: Death penalties (gold loss + rare mishaps) ----------------
  // revised (user-directed): overrides archived no-loss rule, New_Player_Guide.md ("If you die,
  // you get nothing from the battle (but you don't lose anything either)") — precedent: the
  // two-tier class [revised] note in DESIGN.md §3. Vault gold is untouched by a death, consistent
  // with the camping-robbery precedent (BALANCE.CAMP_ROBBERY_GOLD_FRACTION above) and the archived
  // vault advice (reference/forum/t-756.md: "you should use the vault to prevent your gold from
  // being stolen").
  DEATH_GOLD_FRACTION: 0.10, // revised (user-directed)
  DEATH_MISHAP_CHANCE: 0.12, // revised (user-directed); on a hit, 50/50 between Haunting and item-loss
  // Haunting cure fee at the Spirit Shrine (invented rate, mirrors innFee's base+per-level shape).
  HAUNTING_CLEANSE_FEE_BASE: 25, // invented (user-directed)
  HAUNTING_CLEANSE_FEE_PER_LEVEL: 5, // invented (user-directed)
  HAUNTING_HEAL_MULT: 0.5, // invented (user-directed): magical/consumable healing halved while Haunted

  // ---------------- Feature C: Weapon techniques + Defend ----------------
  DEFEND_ENERGY_COST: 2, // invented (user-directed)
  DEFEND_DAMAGE_MULT: 0.5, // invented (user-directed): halves the next monster hit, applied after mitigation

  // ==================== v1.2 Phase 1: use-based skills + fidelity fixes ====================
  // Grounding: skills are archived as "the level at which your Character performs a certain
  // action" (reference/manual/Skills.md) and improve by use — SPEC-V1.2.md Phase 1. All numbers
  // below are invented (user-directed): use-based skill system, unless individually tagged.

  // 1. Weapon skill -> damage (Character.getDamage). Applies to whichever weapon skill governs
  // the weapon actually swung (main-hand or, via getOffhandDamage, the offhand weapon) — a Rod
  // only benefits when meleed with, since spell damage scales off Intelligence, not this term.
  WEAPON_SKILL_DAMAGE_PER_LEVEL: 0.015, // invented (user-directed): use-based skill system
  // retuned DOWN from the lead's starting cap 0.30 (balance-sim gate, docs/SPEC-V1.2.md Phase 1):
  // combined with ARMOR_SKILL_ARMOR_CAP at a maxed skill investment, 0.30/0.40 turned an exact
  // 5-levels-down fight (certain death via Fear at skill=0, 0% win in 250-300 real-RNG trials)
  // into a 15-54% win rate across three exact +5 level pairs — breaking the archived "5-levels-
  // down is still lethal" contract. 0.10 brings the same maxed-investment matchups back down to
  // ~1-4% (in line with the skill=0 noise floor) while still meaningfully improving at-level and
  // boss fights (see the Phase-1 balance-sim report).
  WEAPON_SKILL_DAMAGE_CAP: 0.10,

  // 2. Armor skill -> per-piece armor/magicArmor (js/core/inventory.js equippedArmorTotal/
  // equippedMagicArmorTotal). Scoped to items whose governing skill IS an armor skill (Light/
  // Medium/Heavy Armor body/head/legs/feet pieces, Shields for the offhand shield) — a weapon's
  // own hybrid +Magic Armor stat is untouched by this term (that is a weapon, not "armor worn").
  ARMOR_SKILL_ARMOR_PER_LEVEL: 0.02, // invented (user-directed): use-based skill system
  // retuned DOWN from the lead's starting cap 0.40 — see WEAPON_SKILL_DAMAGE_CAP's comment above;
  // the same balance-sim gate found 0.15 restores 5-levels-down lethality when combined with the
  // retuned weapon cap.
  ARMOR_SKILL_ARMOR_CAP: 0.15,

  // 3. Dodge & Double Attack gain skill XP at the proc site (js/core/battle.js monsterAct's dodge
  // branch / attack()'s double-attack branch) — addSkillXp already enforces the 2*level+1 cap.
  DODGE_SKILL_XP_PER_PROC: 1, // invented (user-directed): use-based skill system
  DOUBLE_ATTACK_SKILL_XP_PER_PROC: 1, // invented (user-directed): use-based skill system

  // 4. Thievery -> bonus gold + a steal roll (one extra drop-table roll) + XP on every win
  // (js/core/battle.js onWin).
  THIEVERY_GOLD_PER_LEVEL: 0.01, // invented (user-directed): use-based skill system
  THIEVERY_GOLD_CAP: 0.25, // invented (user-directed): use-based skill system
  THIEVERY_STEAL_PER_LEVEL: 0.015, // invented (user-directed): use-based skill system
  THIEVERY_STEAL_CAP: 0.30, // invented (user-directed): use-based skill system

  // 5. Dual Wield -> offhand weapon. Basic Attack makes one extra offhand swing (js/core/
  // battle.js attack()) when both the weapon and offhand slots hold a weapon (not a shield);
  // the swing's damage is scaled by this multiplier (based on Dual Wield skill level) and rolls
  // the monster's dodge independently of the main-hand hit(s).
  DUAL_WIELD_OFFHAND_MULT_BASE: 0.40, // invented (user-directed): use-based skill system
  DUAL_WIELD_OFFHAND_MULT_PER_LEVEL: 0.02, // invented (user-directed): use-based skill system
  DUAL_WIELD_OFFHAND_MULT_CAP: 0.75, // invented (user-directed): use-based skill system

  // 6. Intelligence spell hit/miss (js/core/battle.js useTech). RULE is [archived]:
  // reference/manual/Recent_Updates.md, "Saturday, April 21st 2007 — Your intelligence stat now
  // decides whether your spell hits or misses yourself or an opponent." Applies to non-weapon
  // offensive techs (damage/drain); weapon techs instead roll the monster's dodge (like a basic
  // attack); healing/buff techs always land (parallels Fear's "spares healing" carve-out). The
  // NUMBERS below are [invented] (no formula survived).
  INT_SPELL_HIT_BASE: 0.75, // invented: RULE [archived] Recent_Updates.md 2007-04-21, number invented
  INT_SPELL_HIT_PER_INT: 0.01, // invented: RULE [archived] Recent_Updates.md 2007-04-21, number invented
  INT_SPELL_HIT_PER_MON_LEVEL: 0.01, // invented: RULE [archived] Recent_Updates.md 2007-04-21, number invented
  INT_SPELL_HIT_MIN: 0.40, // invented: RULE [archived] Recent_Updates.md 2007-04-21, number invented
  INT_SPELL_HIT_MAX: 0.98, // invented: RULE [archived] Recent_Updates.md 2007-04-21, number invented

  // 7. Non-elemental damage ignores defense (js/core/battle.js useTech's non-weapon branch):
  // mitigation = tech.grade ? monster.magicArmor : 0. RULE is [archived] — DESIGN.md §4 / a 2005
  // note ("non-elemental damage ignores defense"), previously contradicted by the Phase 3
  // stand-in that always subtracted magicArmor. No new constant: a behavior change to the
  // existing mitigation assignment.

  // 8. Curse status (battle-scoped debuff, parallel to Poison — not a persistent affliction like
  // Haunting): reduces the player's outgoing damage by 25% (attacks AND techs) for CURSE_DURATION turns;
  // cleared automatically at battle end (battle.playerStatuses is never persisted). Applied by a
  // monster's `curseChance` field (analogous to a tech's poisonChance), rolled on any successful
  // monster hit. Cleansable mid-battle by an Abjuration tech carrying `clearsStatus: true`
  // (js/data/techs.js tech_mend_wounds_2). NAME is [archived]: reference/manual/
  // Version_2.1_Changes.md ("Added new detrimental effects (Poison, Haunting, Curse)"); the
  // effect and numbers below are [invented].
  CURSE_DAMAGE_MULT: 0.75, // invented: NAME [archived] Version_2.1_Changes.md, number invented
  CURSE_DURATION: 4, // invented: NAME [archived] Version_2.1_Changes.md, number invented
  // Example per-monster curseChance (js/data/monsters.js kastengard_anima_wraith) — Phase 1 wires
  // the mechanic on one existing thematic undead/anima monster so it's testable; Phase 3 attaches
  // curseChance to further thematic monsters.
  CURSE_APPLY_CHANCE: 0.3, // invented: NAME [archived] Version_2.1_Changes.md, number invented

  // ==================== F1: balance-to-100 (docs/SPEC-FULL-LEVEL-ARC.md §9-F1) ====================
  // F1 authors NO content (monsters/items/areas) -- these are CONVENTION NOTES for F3 content
  // authors, proven out against a real-engine sim (scratchpad sim_f1_level100.js) using synthetic
  // representative gear/monsters, not new gameplay constants wired into any code path yet.
  //
  // 1. Weapon-tier extension (CLAUDE.md: "levelReq 1 / 5-15 / 25 / 35, damage ~= 3+2*levelReq").
  //    §4/§9-F1 asks for new bands every ~10 levels past 35: 45/55/65/75/85/95, damage ~=
  //    3+2*levelReq, same as every prior tier. THE SIM FOUND A PROBLEM with reading that formula
  //    literally all the way to band 95: total player power (weapon-bonus damage stacking on top
  //    of Strength-derived damage; per-piece armor stacking on top of Endurance-derived armor)
  //    grows roughly 2x faster than monster hp/damage's fixed +12/+2-per-level slope, because the
  //    gear term is ADDITIVE on top of an already-scaling stat term. Fear's fixed 10%/level penalty
  //    (archived, Fear.md -- not tunable) can only claw back a bounded PERCENTAGE of that; once the
  //    ABSOLUTE margin grows large enough, a 5-levels-down fight stops being lethal (measured: 0%
  //    win at band 35->45 but 99% win at band 95->105 with a literal linear read of the formula --
  //    silently breaking the archived "5-levels-down = certain death via Fear" contract by L100).
  //    FIX (sim-tuned): past band 35, F3 should gate new weapon/armor tiers' damage/armor values
  //    off a TAPERED effective levelReq — effectiveLevelReq = 35 + 0.7*(levelReq-35) for
  //    levelReq > 35 — rather than the literal levelReq. E.g. the band-95 weapon should carry
  //    damage ~= 3+2*(35+0.7*60) = 3+2*77 = ~157, not 3+2*95 = 193. Bands <=35 are UNCHANGED (real,
  //    shipped items keep the literal formula). 0.7 is the LEAST aggressive taper that still drove
  //    5-levels-down win% to 0% at every checkpoint 40/50/60/70/80/90/100 in the sim (400-trial
  //    runs); see the F1 sim report for the full sweep. Armor pieces taper the same way.
  //
  // 2. Boss premiums (CLAUDE.md: "bosses get flat hp/damage premiums and x3 xp", e.g.
  //    estari_ruin_warden's +120hp/+10dmg at L10, eidas_echo's +45dmg at L40 -- each hand-tuned per
  //    boss via its own sim check). For the F1 exit-gate sim's SYNTHETIC bosses (no real boss
  //    content exists past L40 yet), hp premium = +12*level (matches the "~12*level pattern" the
  //    existing bosses already use) and damage premium = round(1.5*level + 10) (sim-tuned so a
  //    boss is winnable 99-100% of the time by a same-level prepared player while costing 29-56% of
  //    their HP, scaling from ~29% at L40 to ~56% at L100 -- "winnable but costly", per the archived
  //    difficulty contract, CLAUDE.md). F3 should tune each REAL 41-100 boss individually the same
  //    way the 1-40 bosses were (this is a starting ballpark, not a hard rule).
  //
  // No new runtime constants are added for either note above: F1 authors no content, so there is
  // nothing yet to wire a real BALANCE.* formula into. F3 should re-derive/re-cite these when real
  // 41-100 items/monsters are authored (and re-sim-check each boss individually, per CLAUDE.md).
  //
  // 3. ARMOR-STACK CORRECTION (post-launch re-sim finding, once bands A-F were actually authored):
  //    note 1 above says "Armor pieces taper the same way [as weapon damage]" -- true for a SINGLE
  //    piece, but a real geared character wears up to 5 armor slots (head/body/legs/feet/offhand)
  //    simultaneously, all stacking ADDITIVELY into one flat mitigation number (js/core/
  //    inventory.js equippedArmorTotal), while a monster's damage is a SINGLE linear term (3+2*lvl).
  //    A holistic re-sim with the REAL Band A-F items (scratchpad sim_realcontent_100.js) found
  //    that note 1's single-item taper, once multiplied by 5 slots, still overshoots a same-level
  //    monster's entire damage term by ~1.3-1.6x -- so even halved by Fear at 5-levels-down, the
  //    player's mitigated incoming damage rounds down to the 1-HP floor almost every hit, and the
  //    "5-levels-down = certain death" contract silently broke again (measured before this fix:
  //    100% win / ~99% HP left / 0 consumables at every checkpoint 50/70/90/100, on a full 5-slot
  //    matched set of the note-1 tapered values -- i.e. the note-1 taper alone is NOT sufficient
  //    once real full sets exist; it was only ever sim-validated against a single weapon-damage
  //    term, not N-slot armor stacking).
  //    FIX (sim-swept): ARMOR_STACK_DIVISOR = 2 -- every arc armor/magicArmor field with
  //    levelReq > 35 (js/data/items.js) is the note-1 tapered value further divided by 2 (rounded,
  //    floor 1), e.g. Band A's tapered body armor 43 -> 22; weapon damage is NOT divided. A LARGER
  //    divisor (3-10) drove the 5-levels-down win rate down much further in an isolated sim using a
  //    maximally-optimized 6-slot/max-tech/grade-II-consumable "prepared player" build -- but every
  //    divisor above 2 was sim-checked and rejected because it broke one of two OTHER, harder
  //    constraints discovered along the way:
  //      (a) the EXISTING, already-shipped hand-rolled boss-fight tests (tests/test_p3_battle.js
  //          Tests 32/35/38/41/44/47), which model a more modest "geared" warrior (weapon+body+
  //          shield only -- 2 armor slots, not 5 -- pure basic Attack, grade-I consumables): for
  //          THAT weaker/partial-gear build the divisor's ONLY lever is armor (no tech involved),
  //          and divisor >=3 crashed eidas_ascendant (the hardest, "amplified" final boss) as low as
  //          a 56-75%-and-falling win rate across repeated 60-trial runs (real, unseeded RNG) --
  //          too close to (and sometimes under) the suite's existing >=60% "not unwinnable" floor
  //          to be safe from flakiness. Divisor 2 keeps that same fixture at a comfortable, stable
  //          ~78-85% across repeated runs.
  //      (b) a LIGHT-armor/caster spot-check (Intelligence/Vitality/Endurance, Rods+Firebolt, Light
  //          Armor) added specifically to verify this fix doesn't unfairly cripple a non-tank build:
  //          a caster ALREADY carries less armor than the melee build, so pushing the companion tech
  //          tap (below) much past 0.55 dropped the caster's Band-A boss (majiku_warlord) win rate
  //          as low as 25-28% in the same re-sim -- an unintended, unacceptable caster regression,
  //          not a deliberate target of this fix.
  //    Divisor 2 is therefore the LARGEST value compatible with both constraints, not merely the
  //    value that best serves the fuller-gear 5-down check in isolation. NOTE: this means arc armor
  //    pieces can read as numerically "worse" than the levelReq<=35 tier immediately below them
  //    (e.g. Band A's corrected body armor 22 vs the levelReq-35 heavy_body_vault_bulwark's
  //    unchanged 37) -- an accepted, sim-forced trade-off, not an authoring error; levelReq<=35
  //    items are explicitly OUT OF SCOPE and were not touched.
  //    OFFENSE_TECH_TAPER = 0.55 (companion tap, js/data/techs.js): the re-sim also found the armor
  //    fix alone was not sufficient for a geared, tech-using player -- Cleave/Impale/Firebolt ranks
  //    6-9 (added in Bands C-F, powerMult up to 4.1x / power up to 152) let such a player kill a
  //    monster in ~2-4 actions REGARDLESS of the monster's own damage, so the fight ends before
  //    enough monster hits land for Fear-reduced armor to matter -- compressed fights, not just
  //    over-mitigation, were silently defeating the contract too. Ranks 6-9 of those three chains
  //    only (Mend Wounds heal power was deliberately left untouched -- nerfing it in the sweep made
  //    bosses swing from "winnable" to "coin-flip" at Lv100 without meaningfully helping 5-down,
  //    since abundant energy-restore crystals mean Mend Wounds is rarely the bottleneck) have their
  //    powerMult/power multiplied by 0.55, sim-picked as the largest tap that still kept the caster
  //    Band-A boss spot-check comfortably above ~85% (see constraint (b) above); the pre-existing
  //    hand-rolled boss tests are unaffected by this lever (they use plain Attack, never a tech).
  //    RESULT (sim-verified, scratchpad sim_realcontent_100.js, 300-trial runs, divisor 2 / tap 0.55):
  //    at-level stays 100% win / ~97-99% HP left at every checkpoint (comfortably clear of the
  //    >=85% floor); bosses stay 98.7-100% win (melee) / 89-100% win (caster) at a real cost of
  //    74-91% HP left -- Eidas Ascendant is close to the costliest melee boss encounter (99.7% win,
  //    75% HP left, ~10-15 rounds); 5-levels-down win% drops from 100% to 73-100% (melee, worse at
  //    low checkpoints, back to ~100% by L90-100) / 55-100% (caster, same pattern) -- a real,
  //    measurable improvement over the pre-fix 100%/99%/0-consumables baseline but NOT the literal
  //    "~0% win" ideal at every checkpoint. Two structural reasons this divisor/tap pairing cannot
  //    close that last gap without breaking constraint (a) or (b) above: a sustain ceiling (Mend
  //    Wounds heal + an abundant graded-consumable stockpile, both intentionally part of a "prepared
  //    player" loadout and both out of this fix's scope) lets a well-supplied player grind out a long
  //    fight almost indefinitely rather than dying outright; and a caster's Intelligence-scaled
  //    Firebolt/armor-skill math resists this correction more at L100 than at L50 (its L100
  //    5-levels-down check stayed ~100% win at every divisor/tap combo tried). Flagged for F3/a
  //    future balance pass (a per-band or per-boss ARMOR_STACK_DIVISOR, or updating the existing
  //    hand-rolled boss-test fixtures to a fuller gear loadout so a larger divisor becomes safe)
  //    rather than solved here by further nerfing consumables, Mend Wounds, or monster stats (all
  //    out of this fix's scope).

  // ==================== v1.4 P1: G5 quest pacing (docs/SPEC-V1.4-GAMEPLAY.md §2) ====================
  MAX_ACTIVE_QUESTS: 3, // [revised] user-directed pacing override (docs/SPEC-V1.4-GAMEPLAY.md §2, 2026-07-11); the original documents no cap

  // ==================== v1.4 P2: G1 Advantage Points + the AA exchange (docs/SPEC-V1.4-GAMEPLAY.md §3) ====================
  // [archived] kills-as-currency (reference/forum/t-827.md "you can now spend kills to get
  // items"); the earn CURVE below is [invented] (no rate survived), locked by the P0 sim
  // (docs/SPEC-V1.4-GAMEPLAY.md P0 RESULTS item 5): 1 AP at L1-19, rising by 1 every 20 levels up
  // to 6 AP at L100. Awarded on every battle victory, including 5-level-cutoff wins ("a kill is a
  // kill" — js/core/battle.js onWin places this ahead of the cutoff early-return, same placement
  // precedent as recordKill/the Legendary-class check above it); never on flee or loss.
  AP_PER_WIN: function (monsterLevel) { return 1 + Math.floor(monsterLevel / 20); },
  // Champion/boss AP premiums reuse the EXACT existing reward-multiplier pattern (same P0 sim
  // line): CHAMPION_REWARD_MULT already doubles xp/gold for a champion kill (js/core/battle.js
  // onWin championMult), and CLAUDE.md documents the archived boss premium as "bosses get flat
  // hp/damage premiums and x3 xp" — AP mirrors both exactly (x2 champion, x3 boss) rather than
  // inventing a third curve.
  AP_CHAMPION_MULT: 2, // invented, matches CHAMPION_REWARD_MULT
  AP_BOSS_MULT: 3 // invented, matches the archived boss xp x3 premium
};
