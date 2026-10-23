// HeroRPG remake — stat info-window data (v1.4 UX transparency pass, user-directed 2026-07-12).
// Feeds Game.Infobox.openStat() (js/ui/infobox.js) and the Status screen's ⓘ affordances
// (js/ui/screens.js renderStatus). Each entry describes the REMAKE's actual mechanical effect —
// per js/core/character.js and DESIGN.md §3 — grounded in the archived manual stat pages
// (reference/manual/*.md) where those pages exist; the archived pages are terse one-liners, so
// several effects below (the exact ratios/what-feeds-what) are [invented]/[revised] per DESIGN.md
// §3 and cited as such. Display-only data: no character field, no save-version impact.

var Game = window.Game || {};
Game.Data = Game.Data || {};

Game.Data.statInfo = {
  // archived: reference/manual/Strength.md ("Adds to your total Encumbrance. Increases your
  // average amount of Damage. Increases the Experience gained in... Swords, Polearms.") — the
  // remake additionally routes Blunt through Strength and cites the 2.5:1 ratio from
  // Recent_Updates.md 2007-04-06 (DESIGN.md §3, js/balance.js STRENGTH_DAMAGE_RATIO).
  strength: {
    name: 'Strength',
    summary: 'Raw physical might.',
    effects: [
      'Increases weapon Damage for Strength-based weapons — Swords, Polearms, Blunt (about 2.5 Strength per 1 Damage).',
      'Raises your carrying capacity (Encumbrance).',
      'Speeds Swords & Polearms skill growth.'
    ],
    cite: 'archived: reference/manual/Strength.md; DESIGN.md §3'
  },

  // archived: reference/manual/Vitality.md ("Increases your Hit Points.") — the remake's exact
  // HP-per-Vitality rate (js/core/character.js HP_PER_VITALITY) is [invented]; the archived page
  // never specified a number.
  vitality: {
    name: 'Vitality',
    summary: 'Toughness and life force.',
    effects: [
      'Increases your maximum Hit Points.'
    ],
    cite: 'archived: reference/manual/Vitality.md'
  },

  // archived: reference/manual/Dexterity.md ("Increases the possibility to Dodge and Double
  // Attack... Knives, Dodge, Thievery, Dual Wield, Double Attack, Hand to Hand.") — the
  // first-strike-order and Knife-damage roles are [invented]/[revised] per DESIGN.md §3
  // (Damage.md assigns Knives to Dexterity in the same spirit as Strength->Swords).
  dexterity: {
    name: 'Dexterity',
    summary: 'Speed and finesse.',
    effects: [
      // invented: docs/SPEC-ROGUE-BOSS-COST.md §2.1/§2.4 (diminishing-returns dodge curve; the Dodge
      // skill, dodge abilities, shrine blessings and techniques multiply it).
      'Gives you a chance to dodge, with less gained from each point the more you have. Your Dodge skill makes that chance bigger, and so do dodge abilities, shrine blessings and techniques.',
      'Increases Double Attack chance.',
      'Decides who strikes first in battle.',
      'Increases Damage for Knife weapons.',
      'Speeds Knives, Dodge, Thievery, Dual Wield, Double Attack & Hand-to-Hand skills.'
    ],
    cite: 'archived: reference/manual/Dexterity.md; DESIGN.md §3'
  },

  // archived: reference/manual/Intelligence.md ("Increases the Experience gained in... Rods,
  // Evocation, Conjuration, Alteration, Absorption, Abjuration.") — the archived page is a terse
  // skill-XP list only; the spell-damage/hit-chance/Magic-Armor role predates no surviving
  // archived text and is [invented] per DESIGN.md §3 (js/core/battle.js techEffectivePower,
  // js/core/character.js getMagicArmor).
  intelligence: {
    name: 'Intelligence',
    summary: 'Arcane aptitude.',
    effects: [
      'Powers technique (spell) damage and healing.',
      'Improves spell hit chance.',
      'Raises Magic Armor (defense vs. graded techniques).',
      'Increases Damage for Rod weapons.',
      'Speeds Rods and all five magic schools (Evocation, Conjuration, Alteration, Absorption, Abjuration).'
    ],
    cite: 'archived: reference/manual/Intelligence.md (skill XP); DESIGN.md §3 (spell-damage role — the archived page is terse and predates it)'
  },

  // archived: reference/manual/Endurance.md ("Increases the damage reduction ability of your
  // armor... Light Armor, Medium Armor, Heavy Armor.")
  endurance: {
    name: 'Endurance',
    summary: 'Resilience under blows.',
    effects: [
      'Increases your Armor (physical damage reduction).',
      // invented: docs/SPEC-NONDEX-DEFENSE.md §2.3 (Bracing) — Heavy/Medium Armor you know how to wear
      // turns the worst of a blow even when it lands; Endurance strengthens that.
      'Armor you know how to wear turns the worst of a blow even when it lands: each level of Heavy or Medium Armor softens the hits you take while wearing it, and Endurance makes that stronger.',
      'Speeds Light, Medium & Heavy Armor skills.'
    ],
    cite: 'archived: reference/manual/Endurance.md; invented: docs/SPEC-NONDEX-DEFENSE.md §2.1'
  },

  // archived: reference/manual/Hit_Points.md ("Hit Points are equal to the life of your
  // character. If your Hit Points are at 0 in a Battle, you lose.")
  hitPoints: {
    name: 'Hit Points',
    summary: 'Your life — reach 0 and you fall.',
    effects: [
      'Raised by Vitality and by leveling.',
      'Restored at Inns, by camping, and by healing techniques/items.'
    ],
    cite: 'archived: reference/manual/Hit_Points.md'
  },

  // archived: reference/manual/Energy.md ("Energy is expended every time you perform an action in
  // battle. When you have insufficient energy... you may only end the battle by dying or by
  // fleeing.") — per-level growth direction: homepage_2007.md 2007-05-25.
  energy: {
    name: 'Energy',
    summary: 'Fuel for every battle action.',
    effects: [
      'Every attack, technique, Defend and item use costs Energy.',
      'At 0 Energy you can only flee or fall.',
      'Grows a little each level; restored by resting and Energy items.'
    ],
    cite: 'archived: reference/manual/Energy.md; reference/site/homepage_2007.md'
  },

  // docs/SPEC-SECONDARY-STATS.md §2.1/§2.2/§2.11: no crit mechanic survived the archive at all —
  // fully [invented], within the intent the remake's own class data already promises (Rogue
  // "crits/dodge", Assassin "burst crit" — js/data/classes.js).
  critChance: {
    name: 'Critical Strike Chance',
    summary: 'Your odds of landing a critical strike.',
    effects: [
      'A 5% base chance on every weapon attack and damaging technique, before gear/class/shrine bonuses.',
      'A critical strike deals extra damage (see Critical Strike Damage) before armor is applied.',
      'Fades the further below the enemy\'s level you are (Fear), and is suppressed entirely 5+ levels down.'
    ],
    cite: 'invented: docs/SPEC-SECONDARY-STATS.md §2.2; Fear interaction archived: reference/manual/Fear.md'
  },

  critDamage: {
    name: 'Critical Strike Damage',
    summary: 'How much harder your critical strikes hit.',
    effects: [
      'A critical strike deals +50% damage before gear/class/shrine bonuses (a critical hit for x1.5).',
      'Stacks with gear, class passives and Spirit Shrine buffs, up to a cap.',
      'Fades the further below the enemy\'s level you are (Fear), and is suppressed entirely 5+ levels down.'
    ],
    cite: 'invented: docs/SPEC-SECONDARY-STATS.md §2.1/§2.2; Fear interaction archived: reference/manual/Fear.md'
  },

  accuracy: {
    name: 'Accuracy',
    summary: 'Makes your weapon strikes harder to dodge.',
    effects: [
      'Reduces an enemy\'s chance to dodge your basic attacks and weapon techniques (not spells).',
      'Never pushes the enemy\'s dodge chance below zero.',
      'Fades the further below the enemy\'s level you are (Fear), and is suppressed entirely 5+ levels down.'
    ],
    cite: 'invented: docs/SPEC-SECONDARY-STATS.md §2.3; Fear interaction archived: reference/manual/Fear.md'
  },

  armorPen: {
    name: 'Armor Penetration',
    summary: 'Lets your physical strikes bite through armor.',
    effects: [
      'Ignores a fraction of an enemy\'s Armor on basic attacks, weapon techniques and Limit Breaks.',
      'Stacks with a technique\'s own built-in Armor Pierce, up to a combined cap.',
      'Never affects Magic Armor or graded (elemental) techniques.',
      'Fades the further below the enemy\'s level you are (Fear), and is suppressed entirely 5+ levels down.'
    ],
    cite: 'invented: docs/SPEC-SECONDARY-STATS.md §2.4; Fear interaction archived: reference/manual/Fear.md'
  },

  block: {
    name: 'Block Chance',
    summary: 'Your chance to catch a blow on your shield.',
    effects: [
      'Requires a Shields-skill item equipped in your offhand — does nothing without a shield.',
      'Scales with your Shields skill level on top of gear/class/shrine bonuses.',
      'A successful block halves the damage of a physical hit (not graded/elemental techniques).',
      'Fades the further below the enemy\'s level you are (Fear), and is suppressed entirely 5+ levels down.'
    ],
    cite: 'invented mechanic: docs/SPEC-SECONDARY-STATS.md §2.5; Shields skill archived: reference/manual/Shields.md'
  },

  // archived name: reference/manual/Recent_Updates.md 2007-04-06 ("Alteration is now affected by
  // Spell Powers") — the name and the fact that it scales techs are archived; the exact formula
  // (§2.6) is [invented], since no formula survived.
  spellPower: {
    name: 'Spell Power',
    summary: 'Strengthens your damaging and healing techniques.',
    effects: [
      'Adds flat power to every damaging, draining and healing technique, of every magic school.',
      'Has no cap, and is not reduced by Fear at 1-4 levels below the enemy (technique damage is already Fear-scaled), but is suppressed entirely 5+ levels down.',
      'Does not affect weapon techniques, buffs or debuffs.'
    ],
    cite: 'archived name: reference/manual/Recent_Updates.md 2007-04-06; formula invented: docs/SPEC-SECONDARY-STATS.md §2.6'
  },

  // archived 2004-era concept: reference/forum/t-449.md (Nerevar, 11-26-2004) — "Luck ... will
  // determine what kind of items you can Forage for and how much experience you get from battles."
  // Both archived roles are kept; the mechanics implementing them (§2.7) are [invented].
  luck: {
    name: 'Luck',
    summary: 'Fortune favors you in the field and in battle.',
    effects: [
      'Improves your odds of foraging the better of two item candidates.',
      'Grants a small bonus to the Experience you earn from battle wins, on top of Fury.',
      'Never grants anything on a battle too far below your level to reward XP or loot.'
    ],
    cite: 'archived concept: reference/forum/t-449.md (Nerevar, 11-26-2004); mechanics invented: docs/SPEC-SECONDARY-STATS.md §2.7'
  }
};

window.Game = Game;
