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
// v1.2 Phase 2 REVISION (docs/SPEC-V1.2.md Phase 2; docs/SPEC-FULL-LEVEL-ARC.md §5): the two-tier
// model above becomes THREE tiers, and Runeblade of Kuraan moves off tier 3 into a dedicated
// Legendary slot (tier: 4) alongside two brand-new invented Legendaries, so tier 3 is exclusively
// the archived third-branch roster:
//   - Third tier (tier: 3) at level 38 via "The Master's Calling" (js/data/quests.js
//     masters_calling), converging ONE PER BASE LINE from whichever tier-2 branch the hero took
//     (arc §5 "branch convergence" — pinned decision, NOT a second branch-of-2 like tier 2):
//       Warrior (Gladiator OR Crusader) -> Shadowknight
//       Magician (Wizard OR Sage)       -> Magus
//       Thief (Rogue OR Mercenary)      -> Gambit
//     So a tier-3 class's `baseClass` is the TIER-1 line id ('warrior'/'magician'/'thief'), NOT a
//     tier-2 id — Game.Classes.thirdTierOptionsFor(c) resolves it off baseClassIdsObtained(c),
//     mirroring advancedOptionsFor(c)'s baseClass matching. Shadowknight/Gambit ability NAMES are
//     archived (homepage_2006.md); Magus's ability names and all three classes' concrete
//     numbers/effects are invented. 3 abilities each (2 passive + 1 signature classOnly tech) —
//     tuned roughly +20% over the stronger of the two tier-2 sibling abilities per effect (the
//     "≤+25% over the prior tier" discipline already used for the tier-2 pass, see gladiator's
//     comments below), a controlled step up, NOT the tier-1->tier-2 jump repeated.
//   - Legendary tier (tier: 4, display-only "Legendary" header) now holds THREE classes, each
//     with its own special, mutually-independent unlock route (obtaining one does not block
//     obtaining another — see js/core/battle.js onWin and js/core/classes.js checkRelicUnlock):
//       Runeblade of Kuraan — unchanged single boss-kill route (obtain.kind: 'boss_kill').
//       Vaultbreaker        — NEW invented route: a hidden capstone quest
//                              (js/data/quests.js vaultbreakers_reckoning) requiring BOTH the
//                              Juneros Leviathan and the Kastengard Custodian dead — a genuine
//                              "boss combination kill," reusing the existing multi-step kill-quest
//                              machinery rather than new battle.js code.
//       Heir of the Echo    — NEW invented route: obtain.kind: 'relic' — granted the moment
//                              `quest_eidas_echo_seal` (Eidas' Echo's own drop) enters the
//                              player's inventory by ANY means (loot, quest reward, or synthesis),
//                              checked via a guarded hook in js/core/inventory.js addItem().
//     Legendary abilities: 4 each (3 passive + 1 signature classOnly tech), tuned a further ~+10%
//     ("a touch above") over the tier-3 band above.
// See js/core/classes.js Game.Classes.advancedOptionsFor(c)/thirdTierOptionsFor(c) for how the
// tier-2/tier-3 options are resolved at runtime.
//
// Shape: { id, name, desc, tier: 1 | 2 | 3 | 4, baseClass?: '<tier-1 id>', legendary,
//          obtain?: { kind: 'boss_kill', monsterId, minLevel }
//                  | { kind: 'boss_combo_quest', questId }   // documentation only; see quests.js
//                  | { kind: 'relic', itemId, minLevel },
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

  // =====================================================================================
  // THIRD TIER (tier: 3) — obtained at level 38 via "The Master's Calling" (js/data/quests.js
  // masters_calling), converging ONE PER BASE LINE from either tier-2 sibling (v1.2 Phase 2;
  // docs/SPEC-V1.2.md Phase 2 "branch convergence" — pinned). baseClass is the TIER-1 line id,
  // not a tier-2 id, per Game.Classes.thirdTierOptionsFor. 3 abilities each (2 passive + 1
  // signature classOnly tech), tuned ~+20% over the stronger tier-2 sibling per effect.
  // =====================================================================================

  // ---------- Shadowknight (baseClass: warrior; archived name + ability names, homepage_2006.md
  // "Tier 4 Update") — converges Gladiator (offense) OR Crusader (defense) ----------
  {
    id: 'shadowknight',
    name: 'Shadowknight',
    desc: 'A Warrior who has walked past both the arena\'s spectacle and the standard\'s discipline ' +
      'into something darker — battle-scarred, dark-Anima-touched, and answerable to neither ' +
      'Gladiator nor Crusader alone. Converges from Warrior, whichever advanced path was taken.',
    tier: 3,
    baseClass: 'warrior',
    legendary: false,
    abilities: [
      {
        id: 'shadowknight_inner_fire',
        name: 'Inner Fire',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.13, // invented: +18% over Gladiator's Savage Strikes (0.11), within the ≤+25% discipline
        classLevelCost: 3,
        desc: 'A smoldering resolve that never quite goes out, archived as one of the Shadowknight\'s ' +
          'two active skills (homepage_2006.md) — +13% Damage (all sources).'
      },
      {
        id: 'shadowknight_dragons_fire',
        name: "Dragon's Fire",
        kind: 'passive',
        effect: 'magic_armor_flat',
        power: 12, // invented: +20% over Crusader's Wardskin (10)
        classLevelCost: 3,
        desc: 'The other of the Shadowknight\'s two archived active skills — a smoldering, ' +
          'draconic-flame ward of protective Anima — flat +12 Magic Armor.'
      },
      {
        id: 'shadowknight_shadow_blade',
        name: 'Shadow Blade',
        kind: 'tech',
        techId: 'tech_shadow_blade',
        classLevelCost: 5,
        desc: 'A blade wreathed in living shadow, driven home with the full weight of the ' +
          'Shadowknight\'s dark training — the archived signature that gives the class its name.'
      }
    ]
  },

  // ---------- Magus (baseClass: magician; archived name, homepage_2006.md; corroborated
  // forum/t-787.md) — converges Wizard (damage) OR Sage (healing/support); invented abilities ---
  {
    id: 'magus',
    name: 'Magus',
    desc: 'A Magician who has pushed past both raw spell damage and restorative craft into true ' +
      'command over uncategorized Anima — the Academy\'s rarely-awarded caster capstone. ' +
      'Converges from Magician, whichever advanced path was taken.',
    tier: 3,
    baseClass: 'magician',
    legendary: false,
    abilities: [
      {
        id: 'magus_anima_mastery',
        name: 'Anima Mastery',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.19, // invented: +19% over Wizard's Arcane Might (0.16)
        classLevelCost: 3,
        desc: 'Full command over uncategorized Anima, beyond even a Wizard\'s reach — +19% Damage (all sources).'
      },
      {
        id: 'magus_overflowing_wellspring',
        name: 'Overflowing Wellspring',
        kind: 'passive',
        effect: 'energy_max_flat',
        power: 36, // invented: +20% over Wizard/Sage's Overcharged Reserves/Deep Wellspring (30)
        classLevelCost: 3,
        desc: 'A well of Energy deeper than either the Wizard\'s or the Sage\'s — flat +36 max Energy.'
      },
      {
        id: 'magus_anima_reckoning',
        name: 'Anima Reckoning',
        kind: 'tech',
        techId: 'tech_anima_reckoning',
        classLevelCost: 5,
        desc: 'A single, world-shaking verdict of pure Anima far beyond even a Wizard\'s Arcane Cataclysm.'
      }
    ]
  },

  // ---------- Gambit (baseClass: thief; archived name + ability names, homepage_2006.md;
  // archived quest name "A Gambler's Life") — converges Rogue (crits/dodge) OR Mercenary
  // (versatility) ----------
  {
    id: 'gambit',
    name: 'Gambit',
    desc: 'A Thief who has turned pure opportunism into a professional gamble — every fight a bet ' +
      'placed on nerve, luck, and a blade thrown true. Converges from Thief, whichever advanced ' +
      'path was taken.',
    tier: 3,
    baseClass: 'thief',
    legendary: false,
    abilities: [
      {
        id: 'gambit_lucky_coin',
        name: 'Lucky Coin',
        kind: 'passive',
        effect: 'gold_pct',
        power: 0.12, // invented: +20% over Mercenary's Quick Pockets (0.10)
        classLevelCost: 3,
        desc: 'Archived as one of the Gambit\'s two active skills (homepage_2006.md) — a coin that ' +
          'always seems to land the Gambit\'s way — +12% Gold from battle wins.'
      },
      {
        id: 'gambit_gamblers_nerve',
        name: "Gambler's Nerve",
        kind: 'passive',
        effect: 'dodge_flat',
        power: 0.10, // invented: +25% over Rogue's Quickstep (0.08) — exactly at the tier discipline's cap
        classLevelCost: 3,
        desc: 'Nothing rattles a Gambit mid-wager — flat +10% chance to dodge any attack.'
      },
      {
        id: 'gambit_dice_throw',
        name: 'Dice Throw',
        kind: 'tech',
        techId: 'tech_dice_throw',
        classLevelCost: 5,
        desc: 'The archived signature that gives the class its name — a thrown blade gambled on a ' +
          'roll of the dice, hitting far harder than a careful strike ever could when the roll goes well.'
      }
    ]
  },

  // ---------- Runeblade of Kuraan (Legendary; invented name, Arkan/Kuraan-lore flavored) ----------
  // Single-player reinterpretation of "may only be obtained by one player" (Classes.md) — a
  // permanent one-per-save unlock (DESIGN.md §3), gated on defeating the estari_ruin_warden
  // (js/data/monsters.js) while at level 30+. See Game.Classes / js/core/battle.js onWin.
  // v1.2 Phase 2: moved off tier 3 (now the archived Shadowknight/Magus/Gambit roster above) to
  // its own Legendary slot (tier: 4) — data-only renumber, no save-shape change (the
  // c.classes[id] entry shape and c.legendaryUnlocked latch are untouched; see
  // js/core/classes.js/js/core/battle.js for the (now per-class) unlock gate).
  {
    id: 'runeblade_of_kuraan',
    name: 'Runeblade of Kuraan',
    desc: 'A Legendary class said to descend from the last runeblades of the Forests of Kuraan, ' +
      'lost to the Arkan when the Majiku drove them out. Whoever wakes the old runes stands apart ' +
      'from every other hero of Van Arius — this Legendary class can be claimed by only one hero ' +
      'per journey, forged in the ruin of something far older than either Human or Arkan.',
    tier: 4,
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
  },

  // ---------- Vaultbreaker (Legendary; invented name/lore) — v1.2 Phase 2 "boss combination
  // kill" route. Unlocked via the hidden capstone quest js/data/quests.js
  // vaultbreakers_reckoning, which requires killing BOTH the Juneros Leviathan (level 25 gate-
  // boss) and the Kastengard Custodian (level 32 gate-boss) and handing over a material each
  // already drops (quest_leviathan_scale, quest_custodian_core_shard) — a genuine two-boss
  // combination, reusing the existing multi-step kill-quest + classChoice machinery rather than
  // new battle.js code (see js/core/quests.js turnIn's fixed-array classChoice path, identical to
  // first_calling's). No baseClass — sits above the tier chain like every Legendary. ----------
  {
    id: 'vaultbreaker',
    name: 'Vaultbreaker',
    desc: 'A Legendary class earned only by breaking BOTH of Van Arius\'s last great guardians — ' +
      'the Kastengard Custodian sealed in the Society of Modern Magic\'s deepest vault, and the ' +
      'Juneros Leviathan that has held the deep shoal since before living memory. Whoever proves ' +
      'their mettle against both fuses the vault\'s old Anima-discipline with the sea\'s crushing ' +
      'patience into something neither guardian could withstand alone.',
    tier: 4,
    legendary: true,
    obtain: { kind: 'boss_combo_quest', questId: 'vaultbreakers_reckoning' }, // documentation only — js/data/quests.js grants the class via rewards.classChoice on turn-in
    abilities: [
      {
        id: 'vaultbreaker_twofold_resolve',
        name: 'Twofold Resolve',
        kind: 'passive',
        effect: 'damage_pct',
        power: 0.15, // invented: "a touch above" tier 3's damage_pct band (0.13-0.19)
        classLevelCost: 2,
        desc: 'The resolve to end two guardians burns undiminished in a third fight — +15% Damage.'
      },
      {
        id: 'vaultbreaker_vault_forged_plating',
        name: 'Vault-Forged Plating',
        kind: 'passive',
        effect: 'armor_flat',
        power: 19, // invented: ~+20% over Crusader's Bulwark (14, the highest tier-2 armor_flat) x1.2, then a touch above tier 3
        classLevelCost: 3,
        desc: 'Custodian-grade plate, quenched in the Leviathan\'s own deep water — flat +19 Armor.'
      },
      {
        id: 'vaultbreaker_deep_current_ward',
        name: 'Deep Current Ward',
        kind: 'passive',
        effect: 'magic_armor_flat',
        power: 14, // invented: a touch above Shadowknight's Dragon's Fire (12)
        classLevelCost: 3,
        desc: 'A standing ward drawn from both a sealed vault and a drowned shoal — flat +14 Magic Armor.'
      },
      {
        id: 'vaultbreaker_reckoning',
        name: "Vaultbreaker's Reckoning",
        kind: 'tech',
        techId: 'tech_vault_reckoning',
        classLevelCost: 5,
        desc: 'A single blow that carries the full weight of two fallen guardians at once.'
      }
    ]
  },

  // ---------- Heir of the Echo (Legendary; invented name/lore) — v1.2 Phase 2 "relic" route.
  // Unlocked the moment quest_eidas_echo_seal (Eidas' Echo's own drop, js/data/monsters.js
  // eidas_echo) enters the player's inventory BY ANY MEANS (loot, quest reward, or synthesis) —
  // checked via a guarded hook in js/core/inventory.js addItem() -> Game.Classes.checkRelicUnlock,
  // distinct in kind from both Runeblade's silent on-kill latch and Vaultbreaker's quest route.
  // No baseClass — sits above the tier chain like every Legendary. ----------
  {
    id: 'heir_of_the_echo',
    name: 'Heir of the Echo',
    desc: 'A Legendary class said to awaken only in the presence of Eidas\' own lingering ' +
      'Echo-Seal — the crystallized remnant of the Skyspire\'s fallen founder. Whoever carries the ' +
      'seal inherits a sliver of Eidas\' own hybrid mastery over Light and Dark Anima alike, the ' +
      'same twin grades the old stories say a "divine race" founder once commanded together.',
    tier: 4,
    legendary: true,
    obtain: { kind: 'relic', itemId: 'quest_eidas_echo_seal', minLevel: 35 },
    abilities: [
      {
        id: 'heir_echo_vitality',
        name: "Echo's Vitality",
        kind: 'passive',
        effect: 'hp_max_flat',
        power: 50, // invented: a touch above tier 2's highest hp_max_flat (Crusader's Iron Vitality, 40) via the tier-3-implied band
        classLevelCost: 2,
        desc: 'A sliver of Eidas\' own endurance, inherited along with the seal — +50 max HP.'
      },
      {
        id: 'heir_echo_reserves',
        name: "Echo's Reserves",
        kind: 'passive',
        effect: 'energy_max_flat',
        power: 40, // invented: a touch above Magus's Overflowing Wellspring (36)
        classLevelCost: 3,
        desc: 'A well of Energy as deep as the Skyspire once flew high — flat +40 max Energy.'
      },
      {
        id: 'heir_echo_step',
        name: "Echo's Step",
        kind: 'passive',
        effect: 'dodge_flat',
        power: 0.11, // invented: a touch above Gambit's Gambler's Nerve (0.10)
        classLevelCost: 3,
        desc: 'A half-step out of phase with the world, the way an Echo always was — flat +11% chance to dodge any attack.'
      },
      {
        id: 'heir_echoing_judgment',
        name: 'Echoing Judgment',
        kind: 'tech',
        techId: 'tech_echoing_judgment',
        classLevelCost: 5,
        desc: 'A judgment cast in Eidas\' own hybrid Light-and-Dark Anima, echoing a founder\'s ' +
          'long-silent verdict onto the battlefield.'
      }
    ]
  }
];

window.Game = Game;
