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
      'Increases Dodge and Double Attack chance.',
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
      'Speeds Light, Medium & Heavy Armor skills.'
    ],
    cite: 'archived: reference/manual/Endurance.md'
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
  }
};

window.Game = Game;
