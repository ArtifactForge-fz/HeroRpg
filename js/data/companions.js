// HeroRPG remake — companion kinds (docs/SPEC-COMPANION-SYSTEM.md §2.1/§2.2). DOM-free data file;
// the class-agnostic extension point for future pets/summons/mounts (spec D1: js/core/companion.js
// Game.Companion consumes this array by id). First and only current consumer: the redesigned
// Conjurer's four elemental Binds (js/data/techs.js tech_summon_*, js/data/classes.js
// conjurer_pact_*).
//
// Schema: { id, name, element, role, hpBase, hpPerLevel, armorBase, armorPerLevel, magicArmorBase,
//   magicArmorPerLevel, basic, desc, icon }
//   element: the Anima grade (DESIGN.md §5) the kind is themed around — drives its basic's grade
//            and (for future use) any grade-based interactions.
//   role: 'dps'|'tank'|'healer'|'support' — documentation/flavor only, no engine branch keys off it.
//   hpMax      = round(hpBase + hpPerLevel * character.level)
//   armor      = round(armorBase + armorPerLevel * character.level)
//   magicArmor = round(magicArmorBase + magicArmorPerLevel * character.level)
//   (js/core/companion.js hpMaxFor/armorFor/magicArmorFor; D5: companion HP/armor scale off
//   character LEVEL ONLY, never a player stat — computed fresh every battle, never stored.)
//   basic: { name, effect ('damage'|'heal'), grade, energyCost, powerBase, powerPerLevel,
//            dotKind?, dotPowerBase?, dotPowerPerLevel?, dotTurns?,   // Fire: Burn DoT rider
//            chipPowerBase?, chipPowerPerLevel?,                      // Water: token damage rider
//            tauntTurns? }                                            // Earth: threat rider
//     The auto-action fired once per player round (js/core/companion.js act(), called from the
//     TOP of js/core/battle.js finishRound). `power` at any given moment = round(powerBase +
//     powerPerLevel * character.level), computed in js/core/companion.js — NEVER hardcode a level
//     here; coefficients only. Riders reuse the same per-level formula shape. `dotTurns`/
//     `tauntTurns` read the shared global levers in js/balance.js (BURN_TURNS/
//     COMPANION_TAUNT_TURNS_BASIC) rather than repeating the same magic number four times.
//   Special (command) abilities are NOT part of this schema — they are player-cast techs
//   (js/data/techs.js tech_cmd_*, gated by `requiresCompanion`) so they flow through the existing
//   useTech Energy/targeting pipeline unchanged (spec §2.1).
//
// ALL numbers below are [invented] — no archive precedent for a persistent companion survives;
// the nearest archived concept, the v3.0 "Eidolon" (reference/manual/Version_3.0.md), was
// explicitly passive/non-combatant and informs flavor only. Every number is PROVISIONAL pending
// the lead's /balance-sim (docs/SPEC-COMPANION-SYSTEM.md §3, sim gate S1-S7) — nothing here is
// locked yet. Public-domain Paracelsian elemental names (Salamander/Undine/Sylph) plus folklore
// "Golem" for Earth — no copyrighted creatures.

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.companions = [

  {
    id: 'comp_fire',
    name: 'Ember Salamander',
    element: 'Fire', // archived grade roster: reference/manual/Recent_Updates.md 2007-04-20 (Fire/Water/Wind/Earth/Star/Light/Dark), mirrored in js/balance.js Anima-grade notes
    role: 'dps',
    // [invented][sim-gated] anchored ~1/3 of the monster HP curve (20+12*level, js/data/monsters.js
    // header) — a squishy DoT-focused kind that dies to a few focused hits and forces a resummon.
    hpBase: 20, hpPerLevel: 4,
    armorBase: 0, armorPerLevel: 0.2, // [invented][sim-gated] near-zero — redirecting a hit onto it is a real risk
    magicArmorBase: 0, magicArmorPerLevel: 0.2, // [invented][sim-gated]
    basic: {
      name: 'Ember Lash',
      effect: 'damage', grade: 'Fire',
      energyCost: 4, // [invented][sim-gated]
      powerBase: 6, powerPerLevel: 0.7, // [invented][sim-gated] power = round(6 + 0.7*L), fed through Game.Battle.techEffectivePower (Int-scaled, Fear-affected, like any spell tick)
      dotKind: 'burn',
      dotPowerBase: 3, dotPowerPerLevel: 0.4, // [invented][sim-gated] dotPower = round(3 + 0.4*L), flat per-tick (no Int scaling — mirrors the existing 'bleed' debuff convention, js/core/battle.js tickMonsterStatuses)
      dotTurns: BALANCE.BURN_TURNS // refreshed, never stacked (js/core/companion.js act())
    },
    desc: 'A patient arsonist bound from living Anima — it lashes a whip of fire that leaves the wound smouldering long after the strike lands.',
    icon: 'comp_fire'
  },

  {
    id: 'comp_water',
    name: 'Tidal Undine',
    element: 'Water', // archived grade roster: reference/manual/Recent_Updates.md 2007-04-20
    role: 'healer',
    hpBase: 25, hpPerLevel: 5, // [invented][sim-gated]
    armorBase: 0, armorPerLevel: 0.3, // [invented][sim-gated]
    magicArmorBase: 0, magicArmorPerLevel: 0.3, // [invented][sim-gated]
    basic: {
      name: 'Soothing Spray',
      effect: 'heal', grade: null,
      energyCost: 4, // [invented][sim-gated]
      powerBase: 5, powerPerLevel: 0.5, // [invented][sim-gated] heals the player, Fear-exempt (archived: "Fear affects spell damage, NOT healing" — Recent_Updates.md 2007-04-06)
      chipPowerBase: 2, chipPowerPerLevel: 0.2 // [invented][sim-gated] a token Water-grade hit on the enemy riding the same cast
    },
    desc: 'A gentle current given living shape — it mists cool water over your wounds, and what spills past you still stings the foe.',
    icon: 'comp_water'
  },

  {
    id: 'comp_earth',
    name: 'Granite Golem',
    element: 'Earth', // archived grade roster: reference/manual/Recent_Updates.md 2007-04-20
    role: 'tank',
    // [invented][sim-gated] anchored to ~two-thirds of a same-level monster's HP (20+12*level) —
    // a credible damage sponge that still dies to sustained focus fire.
    hpBase: 40, hpPerLevel: 8,
    armorBase: 4, armorPerLevel: 1.0, // [invented][sim-gated] reads like a same-level monster wall (armor ~= level, monsters.js header)
    magicArmorBase: 2, magicArmorPerLevel: 0.6, // [invented][sim-gated]
    basic: {
      name: 'Stone Fist',
      effect: 'damage', grade: 'Earth',
      energyCost: 4, // [invented][sim-gated]
      powerBase: 4, powerPerLevel: 0.5, // [invented][sim-gated] lowest direct damage of the four — it earns its keep by tanking, not hitting
      tauntTurns: BALANCE.COMPANION_TAUNT_TURNS_BASIC // refreshed, never stacked (js/core/companion.js act()/setTaunt)
    },
    desc: 'A squat guardian of bound stone — it hammers a fist down and plants itself between you and the foe, daring the next blow to land on it instead.',
    icon: 'comp_earth'
  },

  {
    id: 'comp_wind',
    name: 'Gale Sylph',
    element: 'Wind', // archived grade roster: reference/manual/Recent_Updates.md 2007-04-20
    role: 'support',
    hpBase: 18, hpPerLevel: 4, // [invented][sim-gated]
    armorBase: 0, armorPerLevel: 0.2, // [invented][sim-gated]
    magicArmorBase: 0, magicArmorPerLevel: 0.2, // [invented][sim-gated]
    basic: {
      name: 'Gale Slash',
      effect: 'damage', grade: 'Wind',
      energyCost: 6, // [invented][sim-gated]
      powerBase: 8, powerPerLevel: 1.1 // [invented][sim-gated] highest direct damage of the four, anchored a little above a mid player nuke — the DPS/support role
    },
    desc: 'A near-formless eddy of wind given fitful will — it carves the air itself into a razor gale.',
    icon: 'comp_wind'
  }
];

window.Game = Game;
