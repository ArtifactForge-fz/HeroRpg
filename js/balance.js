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
  DEFEND_DAMAGE_MULT: 0.5 // invented (user-directed): halves the next monster hit, applied after mitigation
};
