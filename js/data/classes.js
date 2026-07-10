// HeroRPG remake — class database (DESIGN.md §3 Classes; reference/manual/Classes.md).
// Archived (Classes.md, v2.1 era): unlock at level 30; first choice is Warrior, Magician, or
// Rogue via quest; later classes obtained via quests/Relics/monster kills; some classes are
// Legendary — "may only be obtained by one player" (single-player reinterpretation: one-per-save,
// permanent latch, DESIGN.md §3 / phase brief). Primary+Secondary slots, Class XP accrues on
// battle win at the main-XP rate (Primary) or half rate (Secondary); Class Levels buy abilities
// at the Academy.
//
// v1.1 REVISION (user-directed, DESIGN.md §3): the archived single-tier-at-30 model is replaced
// by a two-tier structure using the ARCHIVED 2005-06 tier-era class names
// (reference/site/homepage_2006.md, "Tier 4 Update" news post by Krelian, Jan 5 2006 — lists
// Warrior/Thief/Magician as already-functional Tier-4-eligible classes, and Gladiator/Crusader/
// Shadowknight as already having 2 active skills each, with Wizard/Sage/Magus/Rogue/Gambit/
// Mercenary "to do" for their own 2 active skills — i.e. ALL SIX advanced names used below
// (Gladiator, Crusader, Wizard, Sage, Rogue, Mercenary) are archived, not invented):
//   - Base tier (tier: 1) at level 5 via "First Calling" (js/data/quests.js first_calling):
//     Warrior, Magician, or Thief [archived trio, homepage_2006.md]. 3 modest abilities each.
//   - Advanced tier (tier: 2) at level 30 via "Trials of Ascension" (js/data/quests.js
//     trials_of_eldor, renamed for display), branching 2 ways from the base:
//       Warrior   -> Gladiator (offense) / Crusader (defense)
//       Magician  -> Wizard (damage)     / Sage (healing/support)
//       Thief     -> Rogue (crits/dodge) / Mercenary (versatility)
//     4 stronger abilities each. The base class remains obtained and independently slottable.
//   - The Legendary Runeblade of Kuraan (tier: 3, display-only) is unchanged, above both tiers.
// See js/core/classes.js Game.Classes.advancedOptionsFor(c) for how the 2 advanced options per
// base are resolved at runtime, and js/core/save.js's v6->v7 migration for how old v1 base-tier
// `rogue` entries (obtained under the ARCHIVED level-30 first-choice trio) are re-based to
// `thief`, since the id `rogue` is REUSED here for the new advanced-tier class of that name.
//
// Shape: { id, name, desc, tier: 1 | 2 | 3, baseClass?: '<tier-1 id>', legendary,
//          obtain?: { kind: 'boss_kill', monsterId, minLevel },
//          abilities: [ { id, name, kind: 'passive', effect, power, classLevelCost, desc }
//                     | { id, name, kind: 'tech', techId, classLevelCost, desc } ] }
//   passive effect: 'damage_pct' | 'armor_flat' | 'magic_armor_flat' | 'dodge_flat' |
//                    'energy_max_flat' | 'hp_max_flat' | 'gold_pct' | 'double_attack_flat'
//     ('gold_pct' and 'double_attack_flat' are new in the v1.1 revision — js/core/classes.js
//     classBonus() is effect-name-generic so no core changes were needed beyond adding the two
//     guarded hook points that read them: js/core/battle.js onWin() for gold_pct, and
//     playerDoubleAttackChance() for double_attack_flat.)
//   Concrete roster/abilities beyond the archived tier NAMES: invented (DESIGN.md §3 "Actual
//   class rosters... [invented]"). Every tech-kind ability's techId is defined in
//   js/data/techs.js with classOnly: true (not offered at the Academy's general tech list).

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.classes = [

  // =====================================================================================
  // BASE TIER (tier: 1) — obtained at level 5 via "First Calling" (js/data/quests.js
  // first_calling). // revised: user-directed v1.1, overrides archived level-30 first-class rule
  // (Classes.md: "you must be at least level 30 in order to obtain a class"). 3 modest
  // abilities each: one cheap passive, one mid passive, one active tech.
  // =====================================================================================

  // ---------- Warrior (archived: first-choice roster, Classes.md; homepage_2006.md) ----------
  {
    id: 'warrior',
    name: 'Warrior',
    desc: 'A hardened melee fighter who turns raw Strength into overwhelming battlefield pressure. ' +
      'The first and most common of the Royal Academy\'s first callings.',
    tier: 1,
    legendary: false,
    abilities: [
      {
        id: 'warrior_iron_hide',
        name: 'Iron Hide',
        kind: 'passive',
        effect: 'armor_flat',
        power: 4,
        classLevelCost: 2,
        desc: 'Years of taking hits toughen the skin and temper — flat +4 Armor.'
      },
      {
        id: 'warrior_brutal_strikes',
        name: 'Brutal Strikes',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.06,
        classLevelCost: 3,
        desc: 'Every swing lands with a touch more weight — +6% Damage.'
      },
      {
        id: 'warrior_crushing_blow',
        name: 'Crushing Blow',
        kind: 'tech',
        techId: 'tech_crushing_blow',
        classLevelCost: 3,
        desc: 'A heavy, telegraphed blow that trades finesse for raw physical damage — modest at ' +
          'this tier, retuned from its old level-30-oriented power for a level-5 first calling.'
      }
    ]
  },

  // ---------- Magician (archived: first-choice roster, Classes.md; homepage_2006.md) ----------
  {
    id: 'magician',
    name: 'Magician',
    desc: 'A dedicated spellcaster who channels Anima with unusual force. The second of the ' +
      'Royal Academy\'s first callings.',
    tier: 1,
    legendary: false,
    abilities: [
      {
        id: 'magician_arcane_reserves',
        name: 'Arcane Reserves',
        kind: 'passive',
        effect: 'energy_max_flat',
        power: 15,
        classLevelCost: 2,
        desc: 'A deeper well of Energy to draw spells from — flat +15 max Energy.'
      },
      {
        id: 'magician_spellweave',
        name: 'Spellweave',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.06,
        classLevelCost: 3,
        desc: 'Anima flows more readily through a trained Magician — +6% Damage (all sources).'
      },
      {
        id: 'magician_anima_surge',
        name: 'Anima Surge',
        kind: 'tech',
        techId: 'tech_anima_surge',
        classLevelCost: 3,
        desc: 'A modest nuke of raw, uncategorized Anima — the first spell taught beyond a common ' +
          'Academy curriculum, retuned down from its old level-30-oriented power for a level-5 first calling.'
      }
    ]
  },

  // ---------- Thief (NEW base-tier id; archived NAME/trio-slot, homepage_2006.md lists Thief
  // alongside Warrior/Magician as already Tier-4-functional; the id `rogue` used by the OLD v1
  // base-tier "Rogue" is reused below for the advanced tier, see js/core/save.js v6->v7). ------
  {
    id: 'thief',
    name: 'Thief',
    desc: 'A quick, opportunistic survivor who relies on speed, nerve, and a keen eye for coin ' +
      'over brute force. The third of the Royal Academy\'s first callings.',
    tier: 1,
    legendary: false,
    abilities: [
      {
        id: 'thief_light_fingers',
        name: 'Light Fingers',
        kind: 'passive',
        effect: 'dodge_flat',
        power: 0.04,
        classLevelCost: 2,
        desc: 'Light feet and a wary eye — flat +4% chance to dodge any attack.'
      },
      {
        id: 'thief_silver_tongue',
        name: 'Silver Tongue',
        kind: 'passive',
        effect: 'gold_pct',
        power: 0.08,
        classLevelCost: 3,
        desc: 'A Thief always finds a little extra in a beaten foe\'s pockets — +8% Gold from battle wins.'
      },
      {
        id: 'thief_quick_stab',
        name: 'Quick Stab',
        kind: 'tech',
        techId: 'tech_quick_stab',
        classLevelCost: 3,
        desc: 'A fast, low-effort knife strike aimed at an opening rather than raw power.'
      }
    ]
  },

  // =====================================================================================
  // ADVANCED TIER (tier: 2) — obtained at level 30 via "Trials of Ascension" (js/data/quests.js
  // trials_of_eldor). Two branches per base, ALL SIX NAMES ARCHIVED (homepage_2006.md "Tier 4
  // Update" news). 4 stronger abilities each; the underlying base class remains independently
  // obtained/slottable. classLevelCost totals and ability power are noticeably higher than the
  // base tier — these are the old (pre-revision) level-30-oriented Warrior/Magician/Rogue
  // rosters, retuned and split into differentiated offense/defense (or damage/support, or
  // crit/versatility) pairs per the phase brief.
  // =====================================================================================

  // ---------- Gladiator (baseClass: warrior; archived name, homepage_2006.md) — offense ----------
  {
    id: 'gladiator',
    name: 'Gladiator',
    desc: 'A Warrior who has traded caution for spectacle — every fight is won by hitting first, ' +
      'hitting twice, and hitting hardest. Advances from Warrior.',
    tier: 2,
    baseClass: 'warrior',
    legendary: false,
    abilities: [
      {
        id: 'gladiator_savage_strikes',
        name: 'Savage Strikes',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.11, // revised: Phase balance-sanity pass — kept the level-30 combo within +25% of prior power
        classLevelCost: 2,
        desc: 'Arena-honed aggression behind every blow — +11% Damage.'
      },
      {
        id: 'gladiator_relentless_assault',
        name: 'Relentless Assault',
        kind: 'passive',
        effect: 'double_attack_flat',
        power: 0.05, // revised: Phase balance-sanity pass — kept the level-30 combo within +25% of prior power
        classLevelCost: 3,
        desc: 'A Gladiator rarely lets an opening go to waste — flat +5% chance of a Double Attack.'
      },
      {
        id: 'gladiator_battle_hardened',
        name: 'Battle-Hardened',
        kind: 'passive',
        effect: 'armor_flat',
        power: 10,
        classLevelCost: 3,
        desc: 'Enough scars to know how to take a hit while dealing three more — flat +10 Armor.'
      },
      {
        id: 'gladiator_execution_blow',
        name: 'Execution Blow',
        kind: 'tech',
        techId: 'tech_execution_blow',
        classLevelCost: 4,
        desc: 'A crowd-silencing, full-strength swing meant to end a fight outright.'
      }
    ]
  },

  // ---------- Crusader (baseClass: warrior; archived name, homepage_2006.md) — defense ----------
  {
    id: 'crusader',
    name: 'Crusader',
    desc: 'A Warrior who has taken up the Light as both shield and standard — built to plant ' +
      'their feet and outlast anything thrown at them. Advances from Warrior.',
    tier: 2,
    baseClass: 'warrior',
    legendary: false,
    abilities: [
      {
        id: 'crusader_bulwark',
        name: 'Bulwark',
        kind: 'passive',
        effect: 'armor_flat',
        power: 14,
        classLevelCost: 2,
        desc: 'A Crusader plants like a wall others break against — flat +14 Armor.'
      },
      {
        id: 'crusader_iron_vitality',
        name: 'Iron Vitality',
        kind: 'passive',
        effect: 'hp_max_flat',
        power: 40,
        classLevelCost: 3,
        desc: 'A Crusader keeps fighting through wounds that would fell anyone else — +40 max HP.'
      },
      {
        id: 'crusader_wardskin',
        name: 'Wardskin',
        kind: 'passive',
        effect: 'magic_armor_flat',
        power: 10,
        classLevelCost: 3,
        desc: 'A standing shimmer of protective Anima, blessed at the Shrine — flat +10 Magic Armor.'
      },
      {
        id: 'crusader_radiant_smite',
        name: 'Radiant Smite',
        kind: 'tech',
        techId: 'tech_radiant_smite',
        classLevelCost: 4,
        desc: 'The Crusader calls on Light-grade Anima to mend their own wounds mid-battle — the ' +
          'same grade the archived design ties to healing spells (Recent_Updates.md: "Healing ' +
          'spells use the Light grade").'
      }
    ]
  },

  // ---------- Wizard (baseClass: magician; archived name, homepage_2006.md) — spell damage ----------
  {
    id: 'wizard',
    name: 'Wizard',
    desc: 'A Magician who has pushed raw spell damage past what any common Academy curriculum ' +
      'teaches. Advances from Magician.',
    tier: 2,
    baseClass: 'magician',
    legendary: false,
    abilities: [
      {
        id: 'wizard_arcane_might',
        name: 'Arcane Might',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.16,
        classLevelCost: 2,
        desc: 'Anima answers a Wizard with unusual force — +16% Damage (all sources).'
      },
      {
        id: 'wizard_overcharged_reserves',
        name: 'Overcharged Reserves',
        kind: 'passive',
        effect: 'energy_max_flat',
        power: 30,
        classLevelCost: 3,
        desc: 'A cavernous well of Energy built to feed the biggest spells — flat +30 max Energy.'
      },
      {
        id: 'wizard_mind_over_matter',
        name: 'Mind Over Matter',
        kind: 'passive',
        effect: 'magic_armor_flat',
        power: 12,
        classLevelCost: 3,
        desc: 'A disciplined mind turns aside hostile Anima as readily as it channels its own — flat +12 Magic Armor.'
      },
      {
        id: 'wizard_arcane_cataclysm',
        name: 'Arcane Cataclysm',
        kind: 'tech',
        techId: 'tech_arcane_cataclysm',
        classLevelCost: 4,
        desc: 'A graded nuke of raw, uncategorized Anima far beyond anything a common Academy teaches.'
      }
    ]
  },

  // ---------- Sage (baseClass: magician; archived name, homepage_2006.md) — healing/support ----------
  {
    id: 'sage',
    name: 'Sage',
    desc: 'A Magician who turned inward, toward endurance and restoration rather than raw damage. ' +
      'Advances from Magician.',
    tier: 2,
    baseClass: 'magician',
    legendary: false,
    abilities: [
      {
        id: 'sage_vital_reserves',
        name: 'Vital Reserves',
        kind: 'passive',
        effect: 'hp_max_flat',
        power: 35,
        classLevelCost: 2,
        desc: 'A Sage tempers the body along with the mind — +35 max HP.'
      },
      {
        id: 'sage_deep_wellspring',
        name: 'Deep Wellspring',
        kind: 'passive',
        effect: 'energy_max_flat',
        power: 30,
        classLevelCost: 3,
        desc: 'An unusually deep reserve of Energy, drawn on for long, sustaining casts — flat +30 max Energy.'
      },
      {
        id: 'sage_wardskin',
        name: 'Wardskin',
        kind: 'passive',
        effect: 'magic_armor_flat',
        power: 12,
        classLevelCost: 3,
        desc: 'A standing shimmer of protective Anima — flat +12 Magic Armor.'
      },
      {
        id: 'sage_greater_mending',
        name: 'Greater Mending',
        kind: 'tech',
        techId: 'tech_greater_mending',
        classLevelCost: 4,
        desc: 'A Light-grade restoration far beyond the Academy\'s common mending spells.'
      }
    ]
  },

  // ---------- Rogue (baseClass: thief; archived name, homepage_2006.md; REUSES the id of the
  // OLD v1 BASE-tier Rogue — see js/core/save.js v6->v7 migration, which re-bases any existing
  // `classes.rogue` progress from that old base-tier class to the new base-tier `thief` instead,
  // since this id now means the ADVANCED class below) — crits/dodge ----------
  {
    id: 'rogue',
    name: 'Rogue',
    desc: 'A Thief who has sharpened opportunism into an art — always finding the gap in a ' +
      'guard and the speed to strike through it twice. Advances from Thief.',
    tier: 2,
    baseClass: 'thief',
    legendary: false,
    abilities: [
      {
        id: 'rogue_quickstep',
        name: 'Quickstep',
        kind: 'passive',
        effect: 'dodge_flat',
        power: 0.08,
        classLevelCost: 2,
        desc: 'Light feet and a wary eye, sharpened further than any first calling — flat +8% chance to dodge any attack.'
      },
      {
        id: 'rogue_opportunist',
        name: 'Opportunist',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.12,
        classLevelCost: 3,
        desc: 'A Rogue always finds the gap in an opponent\'s guard for a precise, telling strike — +12% Damage.'
      },
      {
        id: 'rogue_light_frame',
        name: 'Light Frame',
        kind: 'passive',
        effect: 'hp_max_flat',
        power: 18,
        classLevelCost: 2,
        desc: 'Wiry endurance built from a life spent staying just out of reach — +18 max HP.'
      },
      {
        id: 'rogue_shadowstep_strike',
        name: 'Shadowstep Strike',
        kind: 'tech',
        techId: 'tech_shadowstep_strike',
        classLevelCost: 4,
        desc: 'A blur of motion that lands two quick strikes before the enemy can react.'
      }
    ]
  },

  // ---------- Mercenary (baseClass: thief; archived name, homepage_2006.md) — versatility ----------
  {
    id: 'mercenary',
    name: 'Mercenary',
    desc: 'A Thief who traded pure opportunism for professionalism — a versatile blade for hire, ' +
      'equally ready to strike, guard, or haggle. Advances from Thief.',
    tier: 2,
    baseClass: 'thief',
    legendary: false,
    abilities: [
      {
        id: 'mercenary_hired_muscle',
        name: 'Hired Muscle',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.10,
        classLevelCost: 2,
        desc: 'Paid work sharpens a plain, reliable swing — +10% Damage.'
      },
      {
        id: 'mercenary_battle_tested',
        name: 'Battle-Tested',
        kind: 'passive',
        effect: 'armor_flat',
        power: 10,
        classLevelCost: 3,
        desc: 'A Mercenary who survives one contract survives the next — flat +10 Armor.'
      },
      {
        id: 'mercenary_quick_pockets',
        name: 'Quick Pockets',
        kind: 'passive',
        effect: 'gold_pct',
        power: 0.10,
        classLevelCost: 2,
        desc: 'A professional never leaves coin on the field — +10% Gold from battle wins.'
      },
      {
        id: 'mercenary_efficient_strike',
        name: 'Efficient Strike',
        kind: 'tech',
        techId: 'tech_efficient_strike',
        classLevelCost: 4,
        desc: 'A trained, economical weapon technique that spends far less Energy than its damage would suggest.'
      }
    ]
  },

  // ---------- Runeblade of Kuraan (Legendary; invented name, Arkan/Kuraan-lore flavored) ----------
  // Single-player reinterpretation of "may only be obtained by one player" (Classes.md) — a
  // permanent one-per-save unlock (DESIGN.md §3), gated on defeating the estari_ruin_warden
  // (js/data/monsters.js) while at level 30+. See Game.Classes / js/core/battle.js onWin.
  // tier: 3 is display-only (Status Classes tab "Legendary" header) — Runeblade has no baseClass
  // and sits above both tiers, unchanged by the v1.1 revision.
  {
    id: 'runeblade_of_kuraan',
    name: 'Runeblade of Kuraan',
    desc: 'A Legendary class said to descend from the last runeblades of the Forests of Kuraan, ' +
      'lost to the Arkan when the Majiku drove them out. Whoever wakes the old runes stands apart ' +
      'from every other hero of Van Arius — this Legendary class can be claimed by only one hero ' +
      'per journey, forged in the ruin of something far older than either Human or Arkan.',
    tier: 3,
    legendary: true,
    obtain: { kind: 'boss_kill', monsterId: 'estari_ruin_warden', minLevel: 30 },
    abilities: [
      {
        id: 'runeblade_kuraan_ward',
        name: "Kuraan's Ward",
        kind: 'passive',
        effect: 'magic_armor_flat',
        power: 10,
        classLevelCost: 2,
        desc: 'The old runes shield their bearer from hostile Anima — flat +10 Magic Armor.'
      },
      {
        id: 'runeblade_runic_might',
        name: 'Runic Might',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.12,
        classLevelCost: 3,
        desc: 'Runes etched along the blade\'s edge amplify every strike — +12% Damage.'
      },
      {
        id: 'runeblade_ancestral_vigor',
        name: 'Ancestral Vigor',
        kind: 'passive',
        effect: 'hp_max_flat',
        power: 30,
        classLevelCost: 3,
        desc: 'The vigor of a lost people flows into their inheritor — +30 max HP.'
      },
      {
        id: 'runeblade_runic_severance',
        name: 'Runic Severance',
        kind: 'tech',
        techId: 'tech_runic_severance',
        classLevelCost: 5,
        desc: 'A hybrid Light-and-Dark strike that cleaves through both flesh and ward alike.'
      }
    ]
  }
];

window.Game = Game;
