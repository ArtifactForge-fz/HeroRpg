// HeroRPG remake — player-facing version log, rendered by changelog.html (linked from the
// game's footer). Convention: entries are NEWEST-FIRST — PREPEND new releases here, never
// append. Every release milestone gets an entry. Keep the wording player-facing (what a player
// would notice in-game: new areas, classes, monsters, systems) — no branch names, no test-suite
// or agent-workflow talk. `saveVersion` records the save-format version that release shipped
// with (see js/core/save.js CURRENT_VERSION + migrate()).

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.changelog = [

  {
    version: 'v1.4.0',
    date: '2026-07-12',
    title: 'Advantage Points & Quest Pacing',
    saveVersion: 10,
    highlights: [
      'Every battle victory now also earns Advantage Points, a second currency you can spend ' +
        'without ever opening your coin purse.',
      'A new AA Exchange has opened in Laik and Frosthold Waystation, selling gear, crystals, ' +
        'spheres, and energy stones for Advantage Points instead of gold — including a handful ' +
        'of Exchange-only items, up to a level-100 prestige set of Tourney Regalia.',
      'Your quest journal is now capped at 3 active quests at a time, so taverns no longer dump ' +
        'their entire quest list on you at once; finish or abandon a quest to make room for more.',
      'Multi-part questlines now unlock their next chapter automatically as you hand in the one ' +
        'before it, instead of every chapter appearing at once.',
      'Some champion monsters now fight with a trick of their own: a few drink back the blood ' +
        'they draw, some grow steadily more savage the longer a fight runs, some shrug off the ' +
        'first spell you throw at them, some poison every bite, and some simply guard a far ' +
        'richer prize. Bosses, too, now pull a scripted trick or two of their own once a battle ' +
        'has run long enough.',
      'Building a big enough Fury kill-streak now unlocks a class Limit Break in battle — Rage, ' +
        'Dragon Kick, or Hurricane Blow depending on your calling — a devastating strike that ' +
        'spends your entire streak in one go.',
      'You can now Forage in any hunting ground for local materials and provisions, right ' +
        'alongside Hunt and Camp — though it shares Camp\'s same risk of a robbery or ambush.',
      'New cheap tavern provisions — Trail Rations, Honeyed Mead, and Kuraan Spice Tea — restore ' +
        'Energy for a few gold at early and mid-level towns; a rarer Forager\'s Bundle can only ' +
        'be found while foraging.',
      'The Town screen now shows one facility at a time (Shop, Inn, Vault, and so on) instead of ' +
        'stacking every service onto a single crowded page.',
      'Fixed a display bug where some status bars (Health, Energy, and others) could render with ' +
        'no visible color fill.'
    ]
  },

  {
    version: 'v1.3.1',
    date: '2026-07-11',
    title: 'Bugfix Release',
    saveVersion: 9,
    highlights: [
      'Fixed camping from the sidebar freezing the game when you were ambushed in your sleep.',
      'Quest materials now drop even from monsters far below your level, so collect quests — ' +
        'including "The Trials of Ascension" and "Vaultbreaker\'s Reckoning" — can no longer ' +
        'become permanently uncompletable if you out-level their hunting grounds.',
      'Eidas\' Echo now actually drops its seal and its unique blade, making the Heir of the ' +
        'Echo class obtainable.',
      'Arkan heroes can now always return to their home town of Saratus, whatever their level.',
      'The battle log now follows the newest events, the Attack button shows its energy cost, ' +
        'and running out of energy in battle is explained instead of silently disabling buttons.',
      'Selling a unique or quest item and importing a save over an existing hero now ask for ' +
        'confirmation, and loot too heavy to carry warns you before it is forfeited.',
      'Assorted fixes: Fury now counts a kill that levels you up, health no longer exceeds its ' +
        'maximum after deactivating a class, shrine blessings tick when a monster flees, and ' +
        'drag-and-drop highlights no longer get stuck.'
    ]
  },

  {
    version: 'v1.3',
    date: '2026-07-11',
    title: 'The Level-100 Arc',
    saveVersion: 9,
    highlights: [
      'Playable level range extended from 40 all the way to 100.',
      'Six new northward regions to explore: the Forests of Kuraan, the Majiku Highlands, the ' +
        'Frozen Reaches (Ukai), the Estari Ruins, the Skyspire, and the Red Moon.',
      'Around 13 new hunting grounds plus 2 new settlements, including Frosthold Waystation as ' +
        'the new late-game hub.',
      'Roughly 40 new monsters and 6 new bosses, culminating in the capstone battle against ' +
        'Eidas Ascendant at level 100.',
      'New high-tier weapons and armor, and technique ranks extended up to rank 9.',
      'Tier-3 classes (Shadowknight, Magus, Gambit) now unlock at level 60 via "The Master\'s ' +
        'Calling".',
      'The story continues through Chapter III, Chapter IV, and a new Epilogue.'
    ]
  },

  {
    version: 'v1.2',
    date: '2026-07-10',
    title: 'Skills, Classes & Content',
    saveVersion: 9,
    highlights: [
      'Use-based skills now shape combat directly: weapon and armor skills scale your damage ' +
        'and defense as they train up.',
      'Dodge, Double Attack, Thievery, and Dual Wield all train with use and pay off in battle; ' +
        'a new offhand equipment slot supports Dual Wield.',
      'Spellcasting now checks Intelligence for hit/miss, and a new Curse status can afflict ' +
        'you in battle.',
      'Full three-tier class progression across 15 classes, including tier-3 Shadowknight, ' +
        'Magus, and Gambit, plus three hidden Legendary classes.',
      'Graded Crystals and Spheres, energy stones, and a synthesis economy with over 30 new ' +
        'recipes; around 20 new Spirit Shrine buffs.',
      'New town of Laik and a Kastengard outpost; the Arkan race is playable with its own start ' +
        'in Saratus.'
    ]
  },

  {
    version: 'v1.1',
    date: '2026-07-10',
    title: 'Combat Depth',
    saveVersion: 8,
    highlights: [
      'Champion hunts and camp ambushes (with a chance of robbery while you sleep) add risk and ' +
        'reward to hunting and camping.',
      'Escaping a battle can now fail, depending on how outmatched you are and how badly ' +
        'wounded your foe is.',
      'Elemental damage types and elemental defenses arrive in combat.',
      'Death now has real consequences: you can lose a share of your carried gold, be cursed ' +
        'with the Haunting affliction, or lose an item where you fell.',
      'New weapon techniques (Cleave, Impale, Vital Strike, Flurry) and a Defend action that ' +
        'halves an incoming blow.',
      'Boss fights and new Spirit Shrine buffs.'
    ]
  },

  {
    version: 'v1.0',
    date: '2026-07-10',
    title: 'The Remake',
    saveVersion: 8,
    highlights: [
      'The original herorpg.net (2004-2008) reconstructed as a single-player browser game.',
      'Character creation for Humans (starting in Eldor) and Arkan (starting in Saratus), with ' +
        'skill points and a name of your choosing.',
      'Hunting, battles, and looting across the towns of Eldor, Ju\'Mak, and Saratus.',
      'Techniques learned at the Academy and quests taken from the Tavern.',
      'Warrior, Magician, and Thief classes with an advanced tier to grow into.',
      'Save export/import so you can back up or move your character.',
      'Levels 1 through 40 playable.'
    ]
  }

];

window.Game = Game;
