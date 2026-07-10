// HeroRPG remake — Spirit Shrine buffs (DESIGN.md §6; reference/manual/Anima_Shards.md,
// Cursed.md, Version_2.1_Changes.md). Concrete buff list is invented — only the shrine concept
// ("20+ temporary buffs for Anima Shards") and the uncurse fee mechanic are archived.
//
// Shape: { id, name, shardCost, effect, power, battles }
//   effect: 'armor' | 'damage' | 'dodge' | 'magicArmor' | 'goldPct'
//   power: the flat bonus (or, for 'goldPct', a fractional multiplier bonus e.g. 0.10 = +10%)
//   battles: how many battle-ENDS (win/loss/flee all count, per DESIGN.md/Phase 4 spec) the buff
//            lasts once purchased — stored on character.shrineBuffs as { id, battlesLeft }.

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.shrine = [
  {
    id: 'shrine_stoneskin',
    name: 'Stoneskin',
    shardCost: 15,
    effect: 'armor',
    power: 3,
    battles: 5,
    desc: 'Hardens the skin like stone, adding +3 Armor for your next 5 battles.'
  },
  {
    id: 'shrine_battle_fervor',
    name: 'Battle Fervor',
    shardCost: 15,
    effect: 'damage',
    power: 2,
    battles: 5,
    desc: 'A battle-trance that adds +2 Damage for your next 5 battles.'
  },
  {
    id: 'shrine_winds_grace',
    name: "Wind's Grace",
    shardCost: 20,
    effect: 'dodge',
    power: 0.05,
    battles: 5,
    desc: 'Lightens your step, adding +5% Dodge chance for your next 5 battles.'
  },
  {
    id: 'shrine_spirit_ward',
    name: 'Spirit Ward',
    shardCost: 15,
    effect: 'magicArmor',
    power: 3,
    battles: 5,
    desc: 'Wraps you in a warding spirit, adding +3 Magic Armor for your next 5 battles.'
  },
  {
    id: 'shrine_fortunes_favor',
    name: "Fortune's Favor",
    shardCost: 25,
    effect: 'goldPct',
    power: 0.10,
    battles: 5,
    desc: 'Calls on good fortune, adding +10% gold from your next 5 battle victories.'
  },

  // =====================================================================
  // v1.2 Phase 3 (docs/SPEC-V1.2.md Content-B item 3): 15 new buffs, bringing the Shrine to 20
  // total. Archived: reference/manual/Version_2.1_Changes.md "Added over 20 buffs to the Spirit
  // Shrine for purchase." Concrete names/numbers [invented] — three tiers (Minor/Greater/Superior)
  // per each of the five EXISTING effect types (armor/damage/dodge/magicArmor/goldPct), so
  // Game.World.shrineBonus (which sums power by effect name) picks every one of these up
  // unchanged — no new effect type needed, matching the spec's "exact existing buff schema"
  // instruction. Shard costs and battle durations scale with tier (Minor < Greater < Superior)
  // for a spread across the level range.
  // =====================================================================
  {
    id: 'shrine_hardened_hide',
    name: 'Hardened Hide',
    shardCost: 10,
    effect: 'armor',
    power: 2,
    battles: 5,
    desc: 'Toughens the skin, adding +2 Armor for your next 5 battles.'
  },
  {
    id: 'shrine_bulwark_blessing',
    name: 'Bulwark Blessing',
    shardCost: 25,
    effect: 'armor',
    power: 5,
    battles: 6,
    desc: 'A shrine-blessing that hardens the whole body, adding +5 Armor for your next 6 battles.'
  },
  {
    id: 'shrine_aegis_of_the_ancients',
    name: 'Aegis of the Ancients',
    shardCost: 45,
    effect: 'armor',
    power: 8,
    battles: 8,
    desc: 'Wraps you in the favor of long-dead guardians, adding +8 Armor for your next 8 battles.'
  },
  {
    id: 'shrine_honed_edge',
    name: 'Honed Edge',
    shardCost: 8,
    effect: 'damage',
    power: 1,
    battles: 5,
    desc: 'Sharpens every strike, adding +1 Damage for your next 5 battles.'
  },
  {
    id: 'shrine_warriors_rage',
    name: "Warrior's Rage",
    shardCost: 30,
    effect: 'damage',
    power: 4,
    battles: 6,
    desc: 'Stokes a battle-rage, adding +4 Damage for your next 6 battles.'
  },
  {
    id: 'shrine_berserkers_wrath',
    name: "Berserker's Wrath",
    shardCost: 50,
    effect: 'damage',
    power: 7,
    battles: 8,
    desc: 'A shrine-fueled fury that adds +7 Damage for your next 8 battles.'
  },
  {
    id: 'shrine_light_footing',
    name: 'Light Footing',
    shardCost: 12,
    effect: 'dodge',
    power: 0.03,
    battles: 5,
    desc: 'Steadies your footwork, adding +3% Dodge chance for your next 5 battles.'
  },
  {
    id: 'shrine_shadowstep_grace',
    name: 'Shadowstep Grace',
    shardCost: 35,
    effect: 'dodge',
    power: 0.08,
    battles: 6,
    desc: 'Lends a hunted grace to your step, adding +8% Dodge chance for your next 6 battles.'
  },
  {
    id: 'shrine_phantom_step',
    name: 'Phantom Step',
    shardCost: 55,
    effect: 'dodge',
    power: 0.12,
    battles: 8,
    desc: 'Blurs your footing to the edge of the unseen, adding +12% Dodge chance for your next 8 battles.'
  },
  {
    id: 'shrine_anima_veil',
    name: 'Anima Veil',
    shardCost: 10,
    effect: 'magicArmor',
    power: 2,
    battles: 5,
    desc: 'A thin veil of warding Anima, adding +2 Magic Armor for your next 5 battles.'
  },
  {
    id: 'shrine_warding_sigil',
    name: 'Warding Sigil',
    shardCost: 25,
    effect: 'magicArmor',
    power: 5,
    battles: 6,
    desc: 'Traces a warding sigil over you, adding +5 Magic Armor for your next 6 battles.'
  },
  {
    id: 'shrine_sanctum_of_the_shrine',
    name: 'Sanctum of the Shrine',
    shardCost: 45,
    effect: 'magicArmor',
    power: 9,
    battles: 8,
    desc: 'Cloaks you in the Shrine\'s own sanctum-warding, adding +9 Magic Armor for your next 8 battles.'
  },
  {
    id: 'shrine_merchants_eye',
    name: "Merchant's Eye",
    shardCost: 15,
    effect: 'goldPct',
    power: 0.05,
    battles: 5,
    desc: 'Sharpens your eye for value, adding +5% gold from your next 5 battle victories.'
  },
  {
    id: 'shrine_traders_fortune',
    name: "Trader's Fortune",
    shardCost: 35,
    effect: 'goldPct',
    power: 0.15,
    battles: 6,
    desc: 'Calls on a trader\'s luck, adding +15% gold from your next 6 battle victories.'
  },
  {
    id: 'shrine_kings_ransom',
    name: "King's Ransom",
    shardCost: 60,
    effect: 'goldPct',
    power: 0.25,
    battles: 8,
    desc: 'A shrine-blessing fit for royalty, adding +25% gold from your next 8 battle victories.'
  }
];

window.Game = Game;
