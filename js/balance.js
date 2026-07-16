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
  // [revised] v1.6 P1 (SPEC-V1.6-REBALANCE.md §6, PG-3/CB-3): re-tuned UP 0.10 -> 0.25, the lead's
  // P0 sim-gate LOCKED value — 90% of the archived skill range (2*lvl+1) bought zero benefit past
  // skill ~8 at the old cap (REVIEW-2026-07-16.md PG-3); P0 re-verified 5-levels-down is not
  // worsened by the raise. Deliberate exception to the ratchet principle (user-directed re-tune of
  // a shipped constant, CLAUDE.md cardinal rule 4 / LEAD-PLAYBOOK §0.3).
  WEAPON_SKILL_DAMAGE_CAP: 0.25,

  // 2. Armor skill -> per-piece armor/magicArmor (js/core/inventory.js equippedArmorTotal/
  // equippedMagicArmorTotal). Scoped to items whose governing skill IS an armor skill (Light/
  // Medium/Heavy Armor body/head/legs/feet pieces, Shields for the offhand shield) — a weapon's
  // own hybrid +Magic Armor stat is untouched by this term (that is a weapon, not "armor worn").
  ARMOR_SKILL_ARMOR_PER_LEVEL: 0.02, // invented (user-directed): use-based skill system
  // retuned DOWN from the lead's starting cap 0.40 — see WEAPON_SKILL_DAMAGE_CAP's comment above;
  // the same balance-sim gate found 0.15 restores 5-levels-down lethality when combined with the
  // retuned weapon cap.
  // [revised] v1.6 P1 (SPEC-V1.6-REBALANCE.md §6, PG-3/CB-3): re-tuned UP 0.15 -> 0.30 in lockstep
  // with WEAPON_SKILL_DAMAGE_CAP above — same PG-3 finding (armor-skill investment above ~skill 8
  // bought nothing), same P0 sim-gate re-verification that 5-levels-down is not worsened.
  // Deliberate exception to the ratchet principle (CLAUDE.md cardinal rule 4 / LEAD-PLAYBOOK §0.3).
  ARMOR_SKILL_ARMOR_CAP: 0.30,

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
  AP_BOSS_MULT: 3, // invented, matches the archived boss xp x3 premium

  // ==================== v1.4 P3: G2 Champion affixes + boss scripts (docs/SPEC-V1.4-GAMEPLAY.md §4) ====================
  // Champion affixes: intent [archived] ("strategic boss battles ... scripted abilities, summons,
  // status effects, item usage" + the "Champion Bosses" forum-thread title, homepage_2006.md);
  // the five affixes and every number below are [invented] within that intent, LOCKED by the P0
  // sim (docs/SPEC-V1.4-GAMEPLAY.md P0 RESULTS item 2). Rolled ONCE, uniformly, through the single
  // rng() stub surface, only when options.champion (js/core/battle.js start()) — never a second
  // roll, never on a non-champion fight or a boss/Lair fight (champion and boss are mutually
  // exclusive encounter types in this game).
  CHAMPION_AFFIXES: ['vampiric', 'frenzied', 'warded', 'venomous', 'hoarder'],
  AFFIX_VAMPIRIC_LEECH: 0.25, // invented, LOCKED P0 RESULTS item 2: monster heals 25% of the damage it just dealt (post-mitigation), capped at its own hpMax
  AFFIX_FRENZIED_RATE: 0.05, // invented, LOCKED P0 RESULTS item 2: +5% monster damage per monster action taken so far this battle
  AFFIX_FRENZIED_CAP: 0.40, // invented, LOCKED P0 RESULTS item 2: escalation capped at +40% — the UNCAPPED +5%/action design broke the >=85% win floor at L90/100 (62-64% win over 16-round fights); WITH the cap it holds 93.7-100% at every checkpoint
  AFFIX_VENOMOUS_CHANCE: 0.35, // invented, LOCKED P0 RESULTS item 2: 35% chance per successful monster BASIC attack (not techs) to poison the player, only while the player is not already poisoned
  AFFIX_HOARDER_DROP_MULT: 3, // invented, LOCKED P0 RESULTS item 2: replaces CHAMPION_REWARD_MULT (x2) on drop-CHANCE rolls only — xp/gold/AP premiums (and CHAMPION_REWARD_MULT itself) are untouched

  // ==================== v1.4 P4: G3 Limit Breaks (docs/SPEC-V1.4-GAMEPLAY.md §5) ====================
  // Names [archived] reference/forum/t-796.md (Rage, Dragon Kick, Hurricane Blow — MP-gated
  // specials in the 2005 engine, "Warriors replace MP with Fury?"); numbers [invented], LOCKED by
  // the P0 sim (docs/SPEC-V1.4-GAMEPLAY.md P0 RESULTS item 3: "Limit break locked at x2.0 of the
  // player's average basic hit... x2.5 reached 85% — too strong for a repeatable button"). A
  // Limit Break unlocks once the character's cross-battle Fury kill-streak (c.fury, unchanged
  // mechanic) reaches this floor, and consuming it spends the WHOLE streak (js/core/battle.js
  // limitBreak()) — energy cost is 0 (the streak IS the cost).
  LB_DAMAGE_MULT: 2.0, // invented, LOCKED P0 RESULTS item 3
  LB_FURY_MIN: 5, // invented, LOCKED P0 RESULTS item 3

  // Flavor riders (docs/SPEC-V1.4-GAMEPLAY.md §5: "deliberately TINY... they were not sim-gated —
  // keep them cosmetic-scale"). Not part of the P0 sim's locked damage number above; small enough
  // that removing them would not change the P0 win/loss numbers.
  LB_RAGE_ARMOR_BONUS: 3, // invented: Rage grants the player flat +3 Armor for LB_RAGE_ARMOR_DURATION turns
  LB_RAGE_ARMOR_DURATION: 3, // invented
  // "2" is expressed in the same percentage-point convention as every other dodge constant in this
  // file (e.g. DODGE_BASE 0.02 = a flat 2%) — Dragon Kick knocks 2 percentage points off the
  // monster's dodge chance for the rest of the battle, floored at 0 (js/core/battle.js
  // monsterDodgeChance's monster.dodgeDebuff term).
  LB_DRAGON_KICK_DODGE_DEBUFF: 0.02, // invented

  // ==================== v1.4 P4: G4 Foraging (docs/SPEC-V1.4-GAMEPLAY.md §5) ====================
  // [archived] concept, reference/forum/t-449.md ("Luck determines what kind of items you can
  // Forage for"); [revised] keying — the remake has no Luck stat, so availability instead follows
  // the area's own forage table (js/data/areas.js `forage: [itemIds]`), hunting-areas-only, same as
  // Game.World.camp(). Numbers [invented].
  FORAGE_SUCCESS: 0.70, // invented
  FORAGE_SECOND_ITEM: 0.30, // invented: chance of a SECOND item on an already-successful forage

  // ==================== v1.5 P1: Monster telegraph core + Interrupt (docs/SPEC-V1.5-MONSTER-AI.md §2, §2a) ====================
  // Intent [archived]: reference/site/homepage_2006.md (Hero 6.5 plan) "Revamped Monster AI:
  // Scripted abilities ... status effects, item usage; Intelligent reactions based on hero
  // actions ... Strategic boss battles." The telegraph wind-up/release mechanic and the
  // Interrupt/stagger answer are [invented] within that intent. Numbers LOCKED by the P0 sim
  // (docs/SPEC-V1.5-MONSTER-AI.md §6 "P0 RESULTS — LOCKED"): a uniform-monster-damage-multiplier
  // sweep (trusted warrior fixture vs at-level regular, 250 trials/cell) found L100 the binding
  // cell — a NON-reacting player held 98-99.6% win up to the avgDPS +20% budget (D=1.2); +30%
  // (D=1.5) collapsed to a ragged 49.6% and was rejected. V1's real-burst re-sim requirement is
  // tracked in the spec, not re-run here (P1 ships the LOCKED provisional numbers).
  AFFIX_CHARGED_MULT: 2.0, // invented, LOCKED v1.5 P0: a charged telegraph hit = 2x a normal hit (~40-50% of an L100 player's HP after mitigation — a real threat, not a one-shot)
  TELEGRAPH_CHARGE_CHANCE: 0.15, // invented, LOCKED v1.5 P0: per eligible telegraph-monster turn; avg DPS +15% (L100 ~99% win for a non-reacting player, comfortable margin under the +20% sim budget)
  INTERRUPT_THRESHOLD_HP_FRAC: 0.15, // invented, LOCKED v1.5 P0 (provisional per spec §10 M6 — a flat fraction, not yet level-scaled): a player hit >= 15% of the monster's OWN max HP cancels its charge; a Limit Break always cancels regardless of its damage

  // ==================== v1.5 P2: caster + enrage archetypes (docs/SPEC-V1.5-MONSTER-AI.md §3) ====================
  // Provisional [invented] — the lead runs a P2 acceptance re-sim + the P3 full-grid re-sim
  // validates the final numbers (spec §3 table + §6). Both archetypes reuse the P0-simmed
  // telegraph/charged-hit math verbatim (windup chance / AFFIX_CHARGED_MULT); neither adds a new
  // damage term.
  CASTER_TECH_CHANCE: 0.75, // invented (v1.5 P2): caster-behavior monsters' tech inclination (vs the default 0.5); reuses the existing, already-balanced monster-tech path
  ENRAGE_HP_FRAC: 0.30, // invented (v1.5 P2): an enrage-behavior monster is "enraged" below this fraction of its max HP
  ENRAGE_CHARGE_MULT: 1.5, // invented (v1.5 P2, RETUNED by the P2 acceptance re-sim): while enraged, wind-up chance x1.5 (0.15 -> 0.225). The initial 2.0 (->0.30) blew past the P0 +20% avg-DPS budget and dropped the L99 enrage cell to 80% win (contract floor 85%); 1.5 restores it while keeping a real death-throes threat. Ratchet: tune the new mechanic to the shipped contract (LEAD-PLAYBOOK §0.3)

  // ==================== v1.5 P3: guardian + reactive archetypes (docs/SPEC-V1.5-MONSTER-AI.md §3) ====================
  // guardian is the mirror of the player's own Defend (a self-mitigation term, not a damage term) --
  // gated by the P3 sim (`/balance-sim`, N=350, docs/SPEC-V1.5-MONSTER-AI.md §6 "P3 guardian
  // sim-gate"): modelled as monster effective-HP x 1/(1-chance*reduction) (the over-armoring/
  // energy-stall lens used by the v1.2 armor-cap incidents). Even a generous effHP x1.40 envelope
  // held 100% win / 0 stall at L40 and L100 (fights only stretch ~9->13 rounds against a ~120-action
  // energy budget). LOCKED at effHP x1.18 (P_g*R=0.15) for a comfortable margin under that envelope.
  GUARDIAN_CHANCE: 0.30, // invented, LOCKED v1.5 P3 sim-gate: per-turn chance a guardian monster guards instead of acting
  GUARDIAN_REDUCTION: 0.50, // invented, LOCKED v1.5 P3 sim-gate: a guard reduces the damage of the player's NEXT action (attack/useTech/limitBreak) against this monster by this fraction
  // reactive re-times the EXISTING telegraph (§2) based on the player's Defend -- it adds no new
  // damage or HP term of its own (the charge it eventually releases is the same AFFIX_CHARGED_MULT
  // hit telegraph/caster/enrage already use), so per the P3 sim-gate it needs no numeric gate; its
  // only free parameter is how many times a single charge may be held off, bounded here so a player
  // cannot Defend-stall a charge forever ("the player can't stall forever" -- spec §3 table).
  REACTIVE_MAX_CHARGE_DELAYS: 1, // invented (v1.5 P3): a reactive monster may hold a pending charge past a player Defend at most this many times before releasing regardless

  // ==================== v1.6 P1: Combat & Stats (docs/SPEC-V1.6-REBALANCE.md §3/§6, CB-1..CB-6) ====================
  // Playtest triage: docs/REVIEW-2026-07-16.md. All numbers LOCKED by the lead's P0 sim gate
  // (SPEC-V1.6-REBALANCE.md §6.1) — implemented verbatim here, not re-tuned.

  // CB-1: penetration floor. DEFENSIVE-ONLY (monster->player, js/core/battle.js monsterAct) — a
  // monster hit always deals >= round(raw*FLOOR) regardless of the player's Armor/Magic Armor,
  // applied BEFORE Defend halving. Deliberately one-directional: a symmetric player->monster floor
  // let under-levelled players guarantee-chunk high-armor monsters and blew open 5-levels-down in
  // the P0 sim (SPEC-V1.6-REBALANCE.md §6.1) — the playtest complaint (light armor floors monster
  // hits to 1) is entirely about the PLAYER taking too little, so only that direction is floored.
  // [invented], LOCKED P0.
  DAMAGE_PENETRATION_FLOOR: 0.30,

  // CB-1: Endurance/Intelligence no longer feed Armor/Magic Armor 1:1 — [revised] (overrides the
  // shipped 1:1 ratio, character.js getArmor/getMagicArmor). RECONCILED from the P0-provisional 0.5
  // to 0.9 by the P1 review re-sim (scratchpad sim_v16_reconcile.js): the shipped lair-boss damage
  // was tuned against the OLD 1:1 armor, so 0.5 crashed the modest 2-armor-slot boss fixture from
  // ~85% win to 46%/31% (L50/L100), breaking the >=60% "winnable" contract (test_p3_battle.js Tests
  // 32-47) — a ratchet violation (LEAD-PLAYBOOK §0.3: don't re-tune shipped bosses to fit a new
  // constant). 0.9 keeps those bosses at ~78%/73% (safe 30-trial margin) while still trimming
  // over-defense; the penetration floor above is the real fix for "regulars floor to 1" (it barely
  // touches bosses, where the hit exceeds armor). A larger endurance nerf would require a separate
  // boss-damage retune pass. LOCKED by the P1 review re-sim.
  ENDURANCE_ARMOR_RATIO: 0.9,
  INT_MAGIC_ARMOR_RATIO: 0.9,

  // CB-2: magic-school skill level -> +% offensive (damage/drain) tech power, parallel to
  // WEAPON_SKILL_DAMAGE_PER_LEVEL/_CAP above (js/core/battle.js techEffectivePower). [invented],
  // LOCKED P0 — kept modest (0.15 cap, not the provisional 0.25 in SPEC §3) because a larger cap
  // pushed the top-level 5-down caster cell too far (SPEC-V1.6-REBALANCE.md §6.1/§6.3).
  MAGIC_SKILL_DAMAGE_PER_LEVEL: 0.015,
  MAGIC_SKILL_DAMAGE_CAP: 0.15,

  // CB-4: Rod caster identity (js/core/battle.js techEffectivePower/useTech). While a Rod is the
  // equipped weapon: offensive-tech base power x(1+ROD_SPELL_MULT), and offensive-tech Energy cost
  // x(1-ROD_TECH_ENERGY_DISCOUNT) — the discount is the lever that makes casting energy-competitive
  // with a basic attack (SPEC-V1.6-REBALANCE.md §6.1: "0.5 reopened mid 5-down, 0.3 keeps it
  // lethal"). Paired with the Rod `damage` halving (js/data/items.js) so a Rod's own melee swing no
  // longer out-damages casting with it (CB-3/CB-4). [invented], LOCKED P0.
  ROD_SPELL_MULT: 0.15,
  ROD_TECH_ENERGY_DISCOUNT: 0.3,

  // CB-2: Intelligence speeds skill-XP gain for magic-school skills AND Rods (js/core/battle.js
  // onWin's skill-XP award block) — granted amount x(1+INT*rate). [archived]
  // reference/manual/Intelligence.md: "Increases the Experience gained in ... Rods, Evocation,
  // Conjuration, Alteration, Absorption, Abjuration" — previously unimplemented. Rate [invented]
  // (no formula survived), LOCKED P0. Weapon (Swords/Polearms/Knives/Hand to Hand) and armor
  // skill-XP are unaffected.
  INT_SKILL_XP_PER_POINT: 0.01,

  // CB-6: carry capacity (js/core/inventory.js carryCapacity) — was a bare strength*10 with no
  // base term, punishing any non-STR build (a Dex/Int caster at STR 5 capped at 50 weight).
  // [invented], LOCKED calc (SPEC-V1.6-REBALANCE.md §6.1). capacity = BASE + STR*PER_STR.
  CARRY_CAPACITY_BASE: 50,
  CARRY_CAPACITY_PER_STR: 6
};
