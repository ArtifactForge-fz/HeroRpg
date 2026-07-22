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
    version: 'v1.9.0',
    date: '2026-07-22',
    title: 'The Conjurer Binds a Companion',
    saveVersion: 11,
    highlights: [
      'The Conjurer walks with a servant again — and this time it fights. Bind one of four ' +
        'elementals (an Ember Salamander, Tidal Undine, Granite Golem, or Gale Sylph); it battles ' +
        'at your side, keeps its wounds between fights, and answers your commands. Fire burns ' +
        'foes over time, Water heals and cleanses you, Earth draws blows onto itself, and Wind ' +
        'sharpens your own magic. Bind a different elemental and the old one steps aside; let it ' +
        'fall in battle (or fall yourself) and you\'ll need to bind again.',
      'Enemies can now strike at your companion directly — a guardian\'s Taunt pulls a foe\'s ' +
        'plain attacks off you, and a few foes have learned specials that can hit your companion, ' +
        'or you both at once.',
      'Your companion is right there on the battle screen — its own health bar sits with your ' +
        'Vitality, showing when it is guarding you or overwhelmed by a far stronger foe — and its ' +
        'health is listed on your Status page between fights.'
    ]
  },

  {
    version: 'v1.8.1',

    date: '2026-07-19',
    title: 'Clearer Coin & Visible Magic',
    saveVersion: 10,
    highlights: [
      'Money now reads the same everywhere: your balance shows plain gold until you\'ve earned ' +
        'your first Platinum piece, and from then on always shows its full gold value alongside ' +
        '(1 Platinum = 100 Gold) — so what you carry is always directly comparable to a shop ' +
        'price. The Vault also explains that deposits and withdrawals are entered in gold, with ' +
        'conversion handled for you.',
      'The five magic schools finally show their worth on the Skills panel: each one now ' +
        'displays the bonus spell power your training grants its techniques — a bonus that has ' +
        'been quietly strengthening your spells since the great rebalance, just never shown.'
    ]
  },

  {
    version: 'v1.8.0',
    date: '2026-07-19',
    title: 'The Expanded Curriculum',
    saveVersion: 10,
    highlights: [
      'The Academies of Averast have expanded their curriculum: every skill now has its own ' +
        'technique chain — 72 new techniques across 18 chains, including the first guard-breaking ' +
        'and strike-sapping debuffs, bleeding wounds, defensive battle stances, a caster\'s ' +
        'power-gathering attunement, shield blows, rod strikes, and coin-lifting cutpurse work. ' +
        'The Techniques and Academy pages now sort everything with type tabs (damage, buff, ' +
        'debuff, and more), and every technique explains exactly what it does before you learn it.',
      'The armories have restocked: paired offhand blades and cesti are finally on sale — from ' +
        'the humble Twinfang Dirk all the way to the King\'s Fang — so fighting with a weapon in ' +
        'each hand truly works at last, crowned by the new Crosscut technique that strikes with ' +
        'both blades in one motion.',
      'Lost things have resurfaced: a too-tempting circlet with a hollow king\'s curse now waits ' +
        'in mid-level hunting grounds (choose your headwear carefully — a Spirit Shrine can free ' +
        'you, for a price), battle trophies and lore curios can now be sold to any shopkeeper, ' +
        'and Arkan runecraft can distill Wardframe Rune Shards into Crystals of Pure Anima.',
      'The Reference Wiki now answers the two questions every pack-rat asks: where does this come ' +
        'from, and what is it for? Every item lists its full sources (shops, drops, foraging, ' +
        'quests, recipes, the AA Exchange) and everything that consumes it. And a small mercy: ' +
        'your gold now sits in plain view beside your health and energy bars, updating as you ' +
        'earn and spend.'
    ]
  },

  {
    version: 'v1.7.0',
    date: '2026-07-17',
    title: 'The Traveler\'s Arc & the Reference Wiki',
    saveVersion: 10,
    highlights: [
      'Quests now unfold as a journey across the realm. Instead of the capital handing out nearly ' +
        'every early calling, each town\'s tavern offers the tasks suited to its own lands — and a ' +
        'new frontier hall, Skyspire Landing, opens in the far north for the final leg (the ' +
        'Kastengard outpost has gained a tavern of its own, too).',
      'The Explore map is clearer: destinations are now cards, each showing a recommended level ' +
        'range at a glance, so you know what you\'re walking into before you set out.',
      'Arkan heroes come into their own. Your homeland\'s plains now hold dangers of their own — ' +
        'including the runic Saratus Wardframe, a warded training construct — and you can answer ' +
        'your first calling and choose a class in Saratus itself, no longer forced to travel to the ' +
        'human capital. New Arkan trials carry your early path, and you can always journey home to ' +
        'Saratus even before the usual level gate.',
      'A new Reference Wiki, linked in the footer, is a full field guide to Van Arius — every item ' +
        '(and where it\'s sold or dropped), every monster with its stats and drop rates, every ' +
        'area and its level range, plus all techniques and synthesis recipes.'
    ]
  },

  {
    version: 'v1.6.0',
    date: '2026-07-17',
    title: 'Sharper Battles & the Skyspire Landing',
    saveVersion: 10,
    highlights: [
      'Armour no longer makes you all but untouchable. Every blow now lands at least a share of ' +
        'its force no matter how well-armoured you are, so ordinary monsters are a real threat ' +
        'again — while prepared heroes still win their boss fights, at a price.',
      'Magic comes into its own. Your magic-school skills now sharpen your spells as they grow, ' +
        'Intelligence trains those schools faster, and a Rod is finally a caster\'s weapon — with ' +
        'one equipped your techniques cost less Energy and strike harder, so casting keeps pace ' +
        'with the blade instead of falling behind it.',
      'Levelling is slower and steadier, and your class no longer masters every ability in a ' +
        'handful of fights. In return, your weapon, armour and magic skills finally climb as you ' +
        'take on tougher foes — a veteran hero is no longer stuck with a novice\'s skills.',
      'The purse is tighter and more interesting: shops pay less for your cast-offs and the very ' +
        'best gear costs more, Anima Shards begin trickling in from your earliest fights instead ' +
        'of only late in the journey, and camping gear now improves gradually across the whole ' +
        'road north rather than maxing out within a few levels.',
      'Quest trinkets stop cluttering your pack once no quest or recipe still needs them, and ' +
        'boss-only materials can no longer be foraged out of the wilds — the boss must be faced.',
      'A new far-northern haven, Skyspire Landing, opens at level 85, so the endgame\'s shops and ' +
        'quests are no longer all crammed into a single town.',
      'Fixed a long-standing trap: The Oruk could become impossible to complete if you out-levelled ' +
        'it after accepting — once accepted, a quest can now always be turned in.',
      'A top-to-bottom balance and progression pass — every combat number was locked by simulation ' +
        'before shipping, and your existing save carries over unchanged.'
    ]
  },

  {
    version: 'v1.5.0',
    date: '2026-07-13',
    title: 'Living Monsters & The Twelve Callings',
    saveVersion: 10,
    highlights: [
      'Monsters can now fight with intent. Many will rear back to gather force for a heavy ' +
        'charged blow — when you see the wind-up, brace with Defend to blunt it, or answer with ' +
        'a hard enough strike (any Limit Break will do) to shatter the charge outright. Gamble ' +
        'on a weak hit, though, and you will eat the full blow.',
      'Different foes bring different tempers: casters weave far more techniques, brutes grow ' +
        'more eager to charge as they near death, guardians raise their shield and blunt your ' +
        'next swing, and a rare few will hold their charge back until your guard drops. The ' +
        'lands near home stay as simple as ever — the deeper north you travel, the craftier ' +
        'the wilds become.',
      'Three bosses — the Foothills Matriarch, the Juneros Leviathan, and the Kastengard ' +
        'Custodian — now fight with tempers of their own.',
      'The Master\'s Calling at level 60 has grown from three paths to twelve: every advanced ' +
        'class now faces a true choice between two callings. Gladiators may become the ' +
        'Shadowknight or the reckless Berserker; Crusaders the Paladin or the unbreakable ' +
        'Warden; Wizards the Magus or the Conjurer; Sages the Cleric or the Seer; Rogues the ' +
        'Gambit or the Assassin; Mercenaries the Ranger or the Dragoon.',
      'The new Conjurer commands what no hero of Van Arius has before: its Summon Elemental ' +
        'binds an Elemental Servitor to the battle, attuned to whichever Anima grade your enemy ' +
        'resists least, striking on its own each round while you fight on — pay Energy once and ' +
        'let it work.',
      'Nine new class techniques arrive with the new callings, from the Berserker\'s frenzy to ' +
        'the Dragoon\'s leaping strike.'
    ]
  },

  {
    version: 'v1.4.2',
    date: '2026-07-12',
    title: 'Academy Technique Info',
    saveVersion: 10,
    highlights: [
      'You can now inspect any technique at the Academy before you learn it — click the ⓘ next to ' +
        'it to see exactly what it does, which stat it scales with, and its damage or healing ' +
        'range, so you always know what you are paying Training Points for.'
    ]
  },

  {
    version: 'v1.4.1',
    date: '2026-07-12',
    title: 'Clearer Stats & Combat Info',
    saveVersion: 10,
    highlights: [
      'Every stat on the Status screen now has an ⓘ button — click it to see exactly what that ' +
        'stat does for your character.',
      'When you level up, the Status screen now spells out your unspent Stat Points and what ' +
        'they are for, so a fresh level-up is never a mystery.',
      'The Status screen is reorganised into two easier-to-read columns — your stats (now with a ' +
        'Derived Stats panel showing Damage, Armor, Magic Armor, Hit Points and Energy) on one ' +
        'side, your skills on the other.',
      'Technique info now tells you which stat a technique scales with, and shows its damage or ' +
        'healing as a range rather than a single number.',
      'In battle, every action — Attack, Defend, your techniques, items, and Limit Breaks — now ' +
        'has an ⓘ you can open to see its effect, Energy cost, and damage or healing range before ' +
        'you commit to it.'
    ]
  },

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
      'The bars at the top of the screen now carry your hero\'s name, calling, level, and ' +
        'lifetime monster kills at a glance.',
      'Fixed a display bug where some status bars (Health, Energy, and others) could render with ' +
        'no visible color fill.',
      'Exporting or importing your save now opens a proper copy/paste window with a Copy button, ' +
        'instead of a clunky browser popup — and results from Hunting, Camping, and Foraging now ' +
        'show up as a quick on-screen message instead of an interrupting popup.'
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
