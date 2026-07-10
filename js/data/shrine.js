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
  }
];

window.Game = Game;
