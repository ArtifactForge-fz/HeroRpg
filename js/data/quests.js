// HeroRPG remake — quest database (DESIGN.md §7 Quests; Recent_Updates.md archived facts).
// All quest TEXT is invented (no quest prose survived the archive — DESIGN.md §7: "All quest
// content: [invented]"); every quest is anchored in the archived lore (Estari ruins, Anima
// excavation taboo, Majiku raids, Skyspire mythology — DESIGN.md §2) and, where a quest name or
// mechanical fact IS archived, that fact is cited and implemented exactly (see per-quest notes).
//
// Shape: { id, name, giver: { areaId, npc }, levelMin?, levelMax?, requiresBaseClass?,
//          requiresAdvancedClass?, intro, steps: [step],
//          rewards: { gold?, xp?, items?: [ids], trainingPoints?, classChoice? }, completionText,
//          acceptItems?: [ids] } — acceptItems are handed over by the giver on accept (delivery
//          quests); they are reclaimed on cancel and consumed by their collect step at turn-in.
//   requiresBaseClass (NEW, v1.1 revision, DESIGN.md §3): enforced in js/core/quests.js accept() —
//   the hero must have obtained at least one tier-1 class (Game.Classes.baseClassIdsObtained)
//   before accepting. Used by trials_of_eldor ("Trials of Ascension").
//   requiresAdvancedClass (NEW, v1.2 Phase 2, docs/SPEC-V1.2.md Phase 2): enforced in
//   js/core/quests.js accept() — the hero must have obtained at least one tier-2 class
//   (Game.Classes.advancedClassIdsObtained) before accepting. Used by masters_calling
//   ("The Master's Calling"), mirroring requiresBaseClass one tier up.
//   rewards.classChoice: either a fixed array of class ids (first_calling: the base trio;
//   vaultbreakers_reckoning: a single-entry array) or a sentinel string — 'advanced'
//   (trials_of_eldor, resolved via Game.Classes.advancedOptionsFor(c)) or 'tier3' (masters_calling,
//   NEW v1.2 Phase 2, resolved via Game.Classes.thirdTierOptionsFor(c)) — see js/core/quests.js
//   turnIn().
// Step kinds:
//   { kind: 'kill', monsterId, count }
//   { kind: 'collect', itemId, count }             — checked live against inventory at turn-in,
//                                                      consumed on completion (not on accept)
//   { kind: 'visit', areaId }                        — satisfied once the player's currentLocation
//                                                      has ever equaled areaId while this quest is active
//   { kind: 'touch', tokens: [{ areaId, label }] }    — Standing Stones style; each token must be
//                                                      touched via Game.Quests.touch() while in
//                                                      its areaId

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.quests = [

  // =====================================================================
  // 1) Tutorial kill quest — level 1, Eldor tavern. Invented content; anchored by the archived
  // fact that Eldor's tavern is the earliest-attested quest source (Recent_Updates.md 2007-05-08
  // "A new quest in Eldor is available for all characters").
  // =====================================================================
  {
    id: 'tutorial_first_blood',
    name: 'First Blood',
    giver: { areaId: 'eldor', npc: 'Tavern Keeper Rosalind' },
    levelMin: 1,
    intro: 'Rosalind wipes down the bar and nods at the door. "Every hero starts somewhere, friend. ' +
      'The plains outside town are lousy with field rats gnawing through the grain stores. Thin their ' +
      'numbers — three ought to prove you can hold a blade — and I\'ll see you paid."',
    steps: [
      { kind: 'kill', monsterId: 'plains_field_rat', count: 3 }
    ],
    rewards: { gold: 25, xp: 20, items: ['potion_minor_healing'] },
    completionText: 'Rosalind slides a few coins and a vial across the bar. "Not bad. The plains are safer for it — for now."'
  },

  // =====================================================================
  // 2) The Standing Stones — touch-type. Archived quest NAME and the cancel-resets-progress
  // behavior (Recent_Updates.md 2007-05-09: "The Standing Stones quest was fixed so that if you
  // cancel it and start it a second time, it will reset the stones you have touched"). Stone
  // content/placement invented; anchored in Estari lore (ancient waymarkers predating the ruins).
  // =====================================================================
  {
    id: 'standing_stones',
    name: 'The Standing Stones',
    giver: { areaId: 'eldor', npc: 'Tavern Keeper Rosalind' },
    levelMin: 1,
    intro: 'An old surveyor nurses his ale beside the hearth. "Three stones stand scattered across ' +
      'Averast — plains, ruin, and border wood — older than Eldor itself, carved by hands that ' +
      'weren\'t human or Arkan. Touch all three and tell me what you feel. Mind you: give up partway, ' +
      'and whatever you\'ve touched resets. The stones don\'t like being visited half-heartedly."',
    steps: [
      {
        kind: 'touch',
        tokens: [
          { areaId: 'plains_of_averast', label: 'Weathered Standing Stone' },
          { areaId: 'estari_ruins', label: 'Cracked Standing Stone' },
          { areaId: 'kuraan_border_woods', label: 'Moss-Grown Standing Stone' }
        ]
      }
    ],
    // archived: cancelling THIS quest resets all touched stones (Recent_Updates.md 2007-05-09) —
    // enforced in js/core/quests.js cancel(), not here; comment kept alongside the data for
    // discoverability.
    rewards: { gold: 60, xp: 50, items: ['lore_estari_shard_tablet'] },
    completionText: 'The surveyor turns the shard-tablet over in his hands, eyes distant. "So the old wounds run through all three... Thank you, traveler. Keep watch — stones like these are rarely silent for long."'
  },

  // =====================================================================
  // 3) The Oruk — archived NAME and level BAND (Recent_Updates.md 2007-04-06: "The Oruk quest
  // can only be completed by heroes greater than level 5 but less than 10"). Enforced at both
  // accept and turn-in per the phase brief. Monster/content invented.
  // =====================================================================
  {
    id: 'the_oruk',
    name: 'The Oruk',
    giver: { areaId: 'jumak_village', npc: 'Militia Captain Dorwen' },
    levelMin: 5,
    levelMax: 10, // archived band: Recent_Updates.md 2007-04-06 ("greater than level 5 but less than 10")
    intro: 'Captain Dorwen grips his spear a little tighter. "Oruk Ravagers have been raiding the ' +
      'border woods — bigger and meaner than the usual Majiku scrap. Bring me the heads of five and ' +
      'Ju`Mak will rest easier. This is a job for a blooded hero, mind — not a green recruit, and not ' +
      'someone who\'s already outgrown the fight."',
    steps: [
      { kind: 'kill', monsterId: 'oruk_ravager', count: 5 }
    ],
    rewards: { gold: 150, xp: 180, items: ['knife_thieves_edge'] },
    completionText: 'Dorwen counts the tally and grunts approval. "Five down. The woods breathe easier tonight — so do I."'
  },

  // =====================================================================
  // 4) Eldor: Dr. Ferrier — archived NAME (Recent_Updates.md 2007-08-01: "New quest (Eldor: Dr.
  // Ferrier)"). Collect-type; content invented, anchored in the Majiku-raid/Anima-taboo lore.
  // =====================================================================
  {
    id: 'eldor_dr_ferrier',
    name: 'Eldor: Dr. Ferrier',
    giver: { areaId: 'eldor', npc: 'Dr. Ferrier' },
    levelMin: 1,
    intro: 'Dr. Ferrier barely looks up from his cluttered desk. "Majiku raiders carry a venom gland ' +
      'in their blade-tips — fascinating chemistry, if you can call raiding a science. Bring me four ' +
      'intact glands and I\'ll make it worth your while. Don\'t ask what I\'m studying them for."',
    steps: [
      { kind: 'collect', itemId: 'quest_majiku_venom_gland', count: 4 }
    ],
    rewards: { gold: 90, xp: 70 },
    completionText: 'Ferrier plucks the glands away with tweezers, already muttering about assays. "Splendid specimens. Splendid. Off with you now."'
  },

  // =====================================================================
  // 5) Professor Flad — archived NAME under a DIFFERENT giver in the original (Recent_Updates.md
  // 2007-08-02: "New town (Laik, Riverside Village)... New quest (Laik: Professor Flad)"). Laik
  // does not exist in the v1 world (DESIGN.md §2), so Professor Flad is relocated to Ju`Mak
  // Village per the phase brief — his archived home is preserved as a comment, not invented away.
  // =====================================================================
  {
    id: 'professor_flad',
    name: 'Professor Flad',
    // archived home: "Laik, Riverside Village" (Recent_Updates.md 2007-08-02) — Laik is not yet
    // part of the v1 world (DESIGN.md §2 lists only Eldor/Saratus/Ju`Mak/Laik/Gares as archived
    // settlements, and only Eldor+Ju`Mak are built in Phase 4). Relocated to Ju`Mak Village so
    // the archived quest name survives; revisit if/when Laik is added to the world.
    giver: { areaId: 'jumak_village', npc: 'Professor Flad' },
    levelMin: 1,
    intro: 'Professor Flad adjusts his spectacles. "The Estari left more than ruins, you know — their ' +
      'constructs still walk, powered by cores of captured Anima. I need one such core for study. ' +
      'The Animate Rubble in the ruins outside Eldor sheds them when destroyed. Bring me one."',
    steps: [
      { kind: 'collect', itemId: 'quest_animate_rubble_core', count: 1 }
    ],
    rewards: { gold: 55, xp: 45, trainingPoints: 1 },
    completionText: 'Flad cradles the core like a newborn. "Remarkable — still warm with Anima after all these centuries. You have my thanks, and a little more besides."'
  },

  // =====================================================================
  // 6) Scouting/visit quest — invented, Eldor giver.
  // =====================================================================
  {
    id: 'scouting_kuraan',
    name: 'Eyes on the Border',
    giver: { areaId: 'eldor', npc: 'Tavern Keeper Rosalind' },
    levelMin: 5,
    intro: 'Rosalind lowers her voice. "Merchants coming down from Ju`Mak say the Kuraan border woods ' +
      'have gone quiet — too quiet. The Crown wants eyes out there, not swords. Just travel out, see ' +
      'what\'s moving among the trees, and report back."',
    steps: [
      { kind: 'visit', areaId: 'kuraan_border_woods' }
    ],
    rewards: { gold: 40, xp: 60 },
    completionText: 'Rosalind listens to your report and frowns. "Oruk in the border woods, you say. The Crown will want to hear that. Thank you for the eyes, hero."'
  },

  // =====================================================================
  // 7) Delivery quest — invented, Eldor giver, collect+visit combo (a "sealed crate" carried and
  // delivered to Ju`Mak Village).
  // =====================================================================
  {
    id: 'delivery_to_jumak',
    name: 'A Sealed Crate',
    giver: { areaId: 'eldor', npc: 'Tavern Keeper Rosalind' },
    levelMin: 3,
    intro: 'Rosalind hefts a heavy crate onto the bar, sealed with the merchant guild\'s wax stamp. ' +
      '"This needs to reach the shopkeep in Ju`Mak Village, and the roads aren\'t what they used to ' +
      'be. Carry it there yourself and I\'ll make sure you\'re compensated for the trouble."',
    // The crate is handed over on accept (acceptItems), must still be carried at turn-in
    // (collect step), and Ju`Mak must have been reached with it (visit step).
    acceptItems: ['quest_sealed_supply_crate'],
    steps: [
      { kind: 'collect', itemId: 'quest_sealed_supply_crate', count: 1 },
      { kind: 'visit', areaId: 'jumak_village' }
    ],
    rewards: { gold: 70, xp: 50 },
    completionText: 'Rosalind takes the crate back and cracks the seal: straw and bricks. "Don\'t look so wounded. The guild needed to know the Ju`Mak road was safe for a REAL shipment — and you just proved it, seal intact the whole way. Easiest coin you\'ll ever earn."'
  },

  // =====================================================================
  // 8) Boss quest — kill estari_ruin_warden. Invented, anchored in Estari-ruins/Anima lore.
  // =====================================================================
  {
    id: 'ruin_warden_boss',
    name: 'The Warden of the Ruins',
    // Giver placed in Eldor (quests are offered at town taverns — New_Player_Guide.md §5.1.5);
    // the foreman recruits in the capital between digs.
    giver: { areaId: 'eldor', npc: 'Survey Foreman Idrissa' },
    levelMin: 8,
    intro: 'Foreman Idrissa spreads dig-site sketches across the tavern table. "The Crown pays my ' +
      'crew to open the Estari ruins, but we can\'t dig deeper while that thing still guards the ' +
      'lower halls. Bring down the Ruin Warden and the surveyors can finally do their work. Fair ' +
      'warning — it hits harder than anything else out there."',
    steps: [
      { kind: 'kill', monsterId: 'estari_ruin_warden', count: 1 }
    ],
    rewards: { gold: 220, xp: 260, items: ['lore_estari_shard_tablet'], trainingPoints: 2 },
    completionText: 'Idrissa lets out a breath she\'d clearly been holding for weeks. "It\'s down. Truly down. The Society of Modern Magic vanished centuries ago, but their guardians don\'t know when to quit. Well done, hero."'
  },

  // =====================================================================
  // 9) Gares Riverbanks chain, part 1 — invented, Ju`Mak giver (nearest town to Gares).
  // =====================================================================
  {
    id: 'gares_riverbanks_1',
    name: 'Trouble on the Delta, Part I',
    giver: { areaId: 'jumak_village', npc: 'Militia Captain Dorwen' },
    levelMin: 9,
    intro: 'Dorwen unrolls a damp map of the river delta. "Trade barges keep getting dragged under at ' +
      'the Gares Riverbanks — River Stalkers, mostly, but the river\'s stirred up something worse ' +
      'lately too. Start by clearing out the Stalkers so my barge crews can breathe."',
    steps: [
      { kind: 'kill', monsterId: 'gares_river_stalker', count: 4 }
    ],
    rewards: { gold: 100, xp: 130 },
    completionText: 'Dorwen nods slowly. "That\'ll help. But I\'ve a feeling the Stalkers weren\'t the real problem — come back when you\'re ready to hear the rest."'
  },

  // =====================================================================
  // 10) Gares Riverbanks chain, part 2 — invented, unlocks narratively after part 1 (no hard
  // prerequisite enforced in code per DESIGN.md §7 shape — both quests are independently
  // available; the intro text implies the chain).
  // =====================================================================
  {
    id: 'gares_riverbanks_2',
    name: 'Trouble on the Delta, Part II',
    giver: { areaId: 'jumak_village', npc: 'Militia Captain Dorwen' },
    levelMin: 11,
    intro: 'Dorwen\'s voice drops. "Current Wraiths. Drowned souls, the old-timers call them — Majiku ' +
      'raiders who drank deep of raw Anima runoff and never came back right. Put down three of them ' +
      'and maybe the river will let my barges through in peace."',
    steps: [
      { kind: 'kill', monsterId: 'gares_current_wraith', count: 3 }
    ],
    rewards: { gold: 160, xp: 200, items: ['potion_greater_healing'] },
    completionText: 'Dorwen exhales like a man setting down a heavy pack. "Three Wraiths less in this world. I owe you more than this, hero, but it\'s what the militia purse allows."'
  },

  // =====================================================================
  // 11) Synthesis-flavored collect quest — invented, Eldor giver (Synthesis Shop is Eldor-only,
  // DESIGN.md §6).
  // =====================================================================
  {
    id: 'synthesis_supplies',
    name: 'Riverweed for the Synthesis Shop',
    giver: { areaId: 'eldor', npc: 'Synthesis Shop Alchemist' },
    levelMin: 9,
    intro: 'The alchemist barely glances up from her bubbling retorts. "Gares riverweed holds its ' +
      'Anima charge better than anything I can grow in a pot. Bring me five bundles fresh from the ' +
      'delta and I\'ll cut you in on the results."',
    steps: [
      { kind: 'collect', itemId: 'quest_riverweed_bundle', count: 5 }
    ],
    rewards: { gold: 85, xp: 110, items: ['crystal_energy_shard'] },
    completionText: 'She holds a bundle up to the light, satisfied. "Potent. Very potent. This will do nicely — here, take this for your trouble."'
  },

  // =====================================================================
  // 12) Training-Points quest — archived: quests CAN grant Training Points (Training_Points.md:
  // "by completing certain quests, from which you may receive a certain amount of Training
  // Points"). Content invented; rewards a tent upgrade per the phase brief.
  // =====================================================================
  {
    id: 'veteran_of_averast',
    name: 'Veteran of Averast',
    giver: { areaId: 'jumak_village', npc: 'Militia Captain Dorwen' },
    levelMin: 6,
    intro: 'Dorwen looks you over, appraising. "You\'ve got the look of someone who\'s survived a few ' +
      'fights. Prove it — put down six Majiku Scouts prowling the border woods, and the militia ' +
      'trainers will see you\'re worth teaching properly. We\'ll even throw in a decent tent; you look ' +
      'like you\'ve been sleeping on rocks."',
    steps: [
      { kind: 'kill', monsterId: 'majiku_forest_scout', count: 6 }
    ],
    // archived: Training_Points.md — quests may grant Training Points on top of gold/xp/items.
    rewards: { gold: 60, xp: 90, items: ['tent_travelers_tent'], trainingPoints: 3 },
    completionText: 'Dorwen claps you on the shoulder hard enough to sting. "Six down. You\'ve earned the tent — and the Academy\'s attention. Go put those Training Points to use."'
  },

  // =====================================================================
  // 13a) NEW (v1.1 revision, DESIGN.md §3): First Calling — the base-tier class-choice quest.
  // // revised: user-directed v1.1, overrides archived level-30 first-class rule (Classes.md:
  // "you must be at least level 30 in order to obtain a class") — the base trio now arrives at
  // level 5 via the Eldor tavern instead. Archived TRIO (Warrior/Magician/Thief) per
  // homepage_2006.md; quest text/giver invented, anchored in the Royal Academy (Eldor's capital
  // Academy facility, DESIGN.md §6) recognizing a hero's potential early rather than at 30.
  // =====================================================================
  {
    id: 'first_calling',
    name: 'The First Calling',
    giver: { areaId: 'eldor', npc: 'Tavern Keeper Rosalind' },
    levelMin: 5, // revised: user-directed v1.1, overrides archived level-30 first-class rule
    intro: 'Rosalind sets down her rag and looks at you properly for the first time. "Word\'s ' +
      'reached the tavern that a Royal Academy proctor is in town, taking the measure of anyone ' +
      'who has survived their first few fights — you\'ve clearly got the makings of something. ' +
      'Thin the vermin swarms plaguing the plains road so the proctor can see you in earnest, and ' +
      'I\'ll walk you to her myself."',
    steps: [
      { kind: 'kill', monsterId: 'plains_vermin_swarm', count: 4 }
    ],
    // No plain rewards — the sole reward is the class choice, granted via turnIn's `choice` param
    // (js/core/quests.js). classChoice lists the three valid base-tier ids for the UI to offer.
    rewards: { classChoice: ['warrior', 'magician', 'thief'] },
    completionText: 'The Royal Academy proctor studies your tally with real interest. "The Academy ' +
      'recognizes your calling, hero. Choose your path — Warrior, Magician, or Thief — and we\'ll ' +
      'see it trained properly from here."'
  },

  // =====================================================================
  // 13b) The Trials of Ascension (formerly "The Trials of Eldor") — the archived ADVANCED class
  // choice quest (Classes.md: "Your first class choices are offered at level 30..."; the level-30
  // gate is now the ADVANCED tier's gate under the v1.1 revision, so this archived fact still
  // applies here, just one tier later). Invented name/text/giver; anchored by killing the existing
  // estari_ruin_warden boss + collecting Anima-flavored materials from it (DESIGN.md §2/§3). Quest
  // id kept as `trials_of_eldor` so old completed saves stay coherent — only the display NAME
  // changed. Reward kind `classChoice: 'advanced'` is a NEW sentinel (js/core/quests.js turnIn)
  // meaning "resolve via Game.Classes.advancedOptionsFor(c) at turn-in time" rather than a fixed
  // array — the two options depend on which base class the hero obtained via First Calling.
  // requiresBaseClass: true is a NEW quest field enforced at accept() (js/core/quests.js): a hero
  // who never took First Calling has no base class to advance, so acceptance is refused with a
  // clear message rather than silently offering an empty choice at turn-in.
  // =====================================================================
  {
    id: 'trials_of_eldor',
    name: 'The Trials of Ascension',
    giver: { areaId: 'eldor', npc: 'Eldor' },
    levelMin: 30, // archived: Classes.md "you must be at least level 30 in order to obtain a class"
    requiresBaseClass: true, // NEW (v1.1 revision): must have obtained a base class via First Calling
    intro: 'The old tactician who lends his name to the city looks you over with the appraisal of ' +
      'someone who has seen a great many heroes come and go. "Level 30, and already answered your ' +
      'first calling — good. Then it\'s time you proved yourself beyond simple soldiering. Bring ' +
      'down the Ruin Warden that still guards the Estari excavation, and bring me back a Condensed ' +
      'Anima Core and an Estari Ward Fragment from its remains — proof you faced it and won. Do ' +
      'that, and I\'ll see your calling advanced into something greater. Choose carefully. The ' +
      'choice, once made, is yours to keep."',
    steps: [
      { kind: 'kill', monsterId: 'estari_ruin_warden', count: 1 },
      { kind: 'collect', itemId: 'quest_condensed_anima_core', count: 1 },
      { kind: 'collect', itemId: 'quest_estari_ward_fragment', count: 1 }
    ],
    // classChoice: 'advanced' — resolved at turn-in via Game.Classes.advancedOptionsFor(c)
    // (js/core/quests.js turnIn), NOT a fixed array; see header comment above.
    rewards: { classChoice: 'advanced' },
    completionText: 'Eldor claps a firm hand on your shoulder. "Welcome to your advancement, hero. Make it count."'
  },

  // =====================================================================
  // v1.2 Phase 2 (docs/SPEC-V1.2.md Phase 2): "The Master's Calling" — the NEW tier-3 capstone
  // class quest, converging one tier-3 class per base line from whichever tier-2 branch the hero
  // took (Shadowknight/Magus/Gambit — archived homepage_2006.md names, see js/data/classes.js).
  // requiresAdvancedClass: true is a NEW quest field enforced at accept() (js/core/quests.js),
  // mirroring trials_of_eldor's requiresBaseClass: a hero who never advanced past their base
  // class has nothing to converge from. classChoice: 'tier3' is a NEW sentinel resolved at
  // turn-in via Game.Classes.thirdTierOptionsFor(c) (js/core/quests.js turnIn), mirroring the
  // 'advanced' sentinel exactly. Gated on the final story boss (eidas_echo, js/data/monsters.js)
  // dead at level 38+ — the Academy's highest calling is only proven at the same threshold that
  // closes the current story arc (js/data/quests.js echo_of_eidas); the two quests can be active
  // and satisfied by the very same kill (recordKill increments every active matching kill-step).
  // =====================================================================
  {
    id: 'masters_calling',
    name: "The Master's Calling",
    giver: { areaId: 'eldor', npc: 'Eldor' },
    levelMin: 38,
    requiresAdvancedClass: true, // NEW (v1.2 Phase 2): must have obtained a tier-2 (advanced) class
    intro: 'Eldor sets down the same maps he pored over when you first stood before him at level ' +
      '30. "There\'s one calling higher than advancement, hero — the Academy only ever grants it to ' +
      'those who\'ve already proven an advanced calling AND faced down whatever it is that still ' +
      'answers to Eidas\' name in Kastengard\'s deepest vault. Finish that fight, and come back. I\'ll ' +
      'know by the look of you whether the Academy has anything left to teach."',
    steps: [
      { kind: 'kill', monsterId: 'eidas_echo', count: 1 }
    ],
    // classChoice: 'tier3' — resolved at turn-in via Game.Classes.thirdTierOptionsFor(c)
    // (js/core/quests.js turnIn), NOT a fixed array; mirrors the 'advanced' sentinel above.
    rewards: { classChoice: 'tier3' },
    completionText: 'Eldor studies you for a long moment before he finally nods. "The Academy has ' +
      'exactly one calling left to give you, hero. Wear it well — you\'ve more than earned it."'
  },

  // =====================================================================
  // v1.2 Phase 2 (docs/SPEC-V1.2.md Phase 2): "Vaultbreaker's Reckoning" — a HIDDEN capstone quest
  // (not tied to any class-tier progression) whose entire purpose is to grant the Legendary
  // Vaultbreaker class via a genuine "boss combination kill": both the Juneros Leviathan (level
  // 25 gate-boss, js/data/monsters.js juneros_leviathan) and the Kastengard Custodian (level 32
  // gate-boss, kastengard_custodian) dead, proven by materials both already drop
  // (quest_leviathan_scale, quest_custodian_core_shard — neither required by any other quest, so
  // no collect-step conflict). rewards.classChoice is a FIXED single-entry array (same mechanism
  // as first_calling's fixed trio, just with one option) rather than a sentinel, since there is
  // only ever one class to grant here — Game.Classes.obtainClass does the rest via the existing
  // turnIn classChoice path, so this route needed NO new battle.js/core code at all.
  // =====================================================================
  {
    id: 'vaultbreakers_reckoning',
    name: "Vaultbreaker's Reckoning",
    giver: { areaId: 'eldor', npc: 'Eldor' },
    levelMin: 33,
    intro: 'Eldor lowers his voice, the way he only does for the stories he doesn\'t quite believe ' +
      'himself. "There\'s an old rumor among the Academy\'s oldest instructors — that a hero who ' +
      'breaks BOTH the Juneros Leviathan and the Kastengard Custodian, the deep shoal\'s guardian ' +
      'and the vault\'s, awakens something in themselves that no ordinary calling can teach. I\'ve ' +
      'never seen it happen. Prove the rumor true, and bring me proof of both kills, and we\'ll find ' +
      'out together what the Academy has never had to name."',
    steps: [
      { kind: 'kill', monsterId: 'juneros_leviathan', count: 1 },
      { kind: 'kill', monsterId: 'kastengard_custodian', count: 1 },
      { kind: 'collect', itemId: 'quest_leviathan_scale', count: 1 },
      { kind: 'collect', itemId: 'quest_custodian_core_shard', count: 1 }
    ],
    rewards: { classChoice: ['vaultbreaker'] },
    completionText: 'Eldor turns the scale and the core shard over in his hands, and for once he has ' +
      'nothing dry to say. "Two guardians, one hero. Whatever this makes you, hero, the Academy has ' +
      'no lesson plan for it — you\'ll have to write your own from here."'
  },

  // =====================================================================
  // Phase 6b: Endgame World Expansion (DESIGN.md §2/§10) — six quests spanning Saratus, the
  // Northern Barrier Foothills, the Isle of Juneros, and Kastengard, closing on chapter_2's
  // waking-ruins/Skyspire threads (js/data/story.js).
  // =====================================================================

  // ---------- 14) Saratus tavern intro quest ----------
  {
    id: 'saratus_foothills_intro',
    name: 'Beyond the Wardplate',
    giver: { areaId: 'saratus', npc: 'Tavern Keeper Anje' },
    levelMin: 14,
    intro: 'Anje sets down a cup of Arkan spiced wine and studies you. "The foothills north of here ' +
      'climb straight for the barrier no Human or Arkan has ever crossed — and lately the wolves and ' +
      'rams up there have been coming down meaner than usual. Thin the Barrier Wolves for me, and ' +
      'Saratus will remember the favor."',
    steps: [
      { kind: 'kill', monsterId: 'foothills_barrier_wolf', count: 5 }
    ],
    rewards: { gold: 200, xp: 260 },
    completionText: 'Anje refills your cup without being asked. "Five less howling in the night. The Academy will want to hear the wolves are stirred up at all — something\'s got them running scared, and wolves don\'t scare easy."'
  },

  // ---------- 15) Foothills boss quest -> unlocks narrative for Juneros ----------
  {
    id: 'foothills_matriarch_boss',
    name: 'The Matriarch of the High Camp',
    giver: { areaId: 'saratus', npc: 'Tavern Keeper Anje' },
    levelMin: 18,
    intro: 'Anje leans in, voice low. "There\'s an old pack-mother up in the high camp who\'s held the ' +
      'western passes against every hunting party for a generation. Nothing gets past her — not us, ' +
      'not whatever\'s coming down from the barrier. Bring her down, and maybe we finally learn ' +
      'what\'s on the other side of those passes."',
    steps: [
      { kind: 'kill', monsterId: 'foothills_matriarch', count: 1 }
    ],
    rewards: { gold: 420, xp: 620, items: ['medium_body_foothills_hauberk'], trainingPoints: 2 },
    completionText: 'Anje turns the Matriarch\'s Horn over in her hands, quiet for once. "So she really was ' +
      'guarding the western passes all along — not just wolves and rams up there, then. Word from the coast ' +
      'says there\'s an isle out past the inland sea, small human settlements clinging to it. Might be time ' +
      'someone from Saratus went to see for themselves, now that the way\'s finally clear."'
  },

  // ---------- 16) Juneros chain, part 1: collect ----------
  {
    id: 'juneros_settlements_1',
    name: 'Small Settlements, Small Mercies',
    giver: { areaId: 'saratus', npc: 'Tavern Keeper Anje' },
    levelMin: 19,
    intro: 'Anje unrolls a salt-stained chart of the inland sea. "The isle of Juneros has held on with ' +
      'a scatter of small human settlements since before anyone can remember (Averast.md, or so the ' +
      'scholars tell me). Something\'s been dragging their dead into the tide instead of letting them ' +
      'rest. Bring me what the drowned settlers left behind, and we\'ll see what\'s owed them."',
    steps: [
      { kind: 'collect', itemId: 'quest_settler_locket', count: 4 }
    ],
    rewards: { gold: 260, xp: 340 },
    completionText: 'Anje lays the lockets out gently, one by one. "Four families who\'ll finally know. ' +
      'Whatever\'s dragging them under the water isn\'t finished, though — you\'ve seen the size of what ' +
      'surfaces out past the shoals."'
  },

  // ---------- 17) Juneros chain, part 2: boss kill ----------
  {
    id: 'juneros_leviathan_boss',
    name: 'The Deep Shoal',
    giver: { areaId: 'saratus', npc: 'Tavern Keeper Anje' },
    levelMin: 25,
    intro: 'Anje\'s chart is marked now with a single heavy circle, far past the settlements\' oldest ' +
      'fishing grounds. "That\'s the Leviathan. Water-graded, they say, and old enough to have been ' +
      'guarding that shoal since before Saratus was a city. The settlements can\'t fish those grounds ' +
      'while it\'s down there. Put it down, and the isle finally gets its sea back."',
    steps: [
      { kind: 'kill', monsterId: 'juneros_leviathan', count: 1 }
    ],
    rewards: { gold: 500, xp: 900, items: ['heavy_head_juneros_scalehelm'], trainingPoints: 3 },
    completionText: 'Anje holds the Leviathan Scale up to the lamplight, awed despite herself. "The deep ' +
      'shoal, open again. The settlements will fish those grounds for the first time in longer than anyone ' +
      'can say. You\'ve done more for Juneros today than Saratus has managed in a generation."'
  },

  // ---------- 18) Kastengard investigation quest ----------
  {
    id: 'kastengard_investigation',
    name: 'What Wakes at Kastengard',
    giver: { areaId: 'saratus', npc: 'Academy Archivist Toven' },
    levelMin: 26,
    // ties to story.js chapter_2's waking-ruins premise, relocated from the Estari ruins near
    // Eldor to Kastengard itself — the Society of Modern Magic's own abandoned base far to the
    // northeast (Chapter_I.md).
    intro: 'Archivist Toven speaks carefully, as though the words themselves might wake something. ' +
      '"Eldor\'s surveyors found the Estari ruins stirring again — stone that should be inert for ' +
      'centuries, moving when no one watches. If that restlessness has reached all the way to ' +
      'Kastengard, where the Society itself once dug even deeper into Anima than the Estari ever dared, ' +
      'the Academy needs to know. Travel there, see what its wardframes and remnants are carrying, and ' +
      'bring back proof of what you find."',
    steps: [
      { kind: 'visit', areaId: 'kastengard_ruins' },
      { kind: 'kill', monsterId: 'kastengard_wardframe', count: 3 },
      { kind: 'collect', itemId: 'quest_society_ledger_page', count: 2 }
    ],
    rewards: { gold: 380, xp: 520, items: ['crystal_pure_anima'] },
    completionText: 'Toven reads the ledger pages twice through, then a third time. "Meticulous, even ' +
      'after three hundred years — whatever woke the wardframes didn\'t erase the Society\'s own records. ' +
      'The Academy will want everything you can carry out of those vaults. Something down there hasn\'t ' +
      'finished what it started."'
  },

  // ---------- 19) FINALE: The Echo of Eidas ----------
  {
    id: 'echo_of_eidas',
    name: 'The Echo of Eidas',
    // archived: the Royal Academy is Eldor's (DESIGN.md §6/§2); the finale is sent from the
    // capital's tavern per the phase brief, closing the arc that began with the Estari ruins
    // outside Eldor and the estari_ruin_warden (js/data/quests.js ruin_warden_boss/trials_of_eldor).
    giver: { areaId: 'eldor', npc: 'Royal Academy Envoy Castellan' },
    levelMin: 36,
    intro: 'The envoy speaks with the flat calm of someone repeating an order she does not fully ' +
      'believe herself. "The Royal Academy has had Kastengard\'s deepest vault under watch since word ' +
      'came back from Saratus. What\'s down there isn\'t a construct, and it isn\'t a remnant. It ' +
      'answers to Eidas\' name, or something that still thinks it is him, three centuries after the ' +
      'Skyspire left the ground. The Academy cannot send an army into a vault that size. It can send ' +
      'one hero. Go to the Skyspire Anchor, hero, and finish what the Council of Three failed to end ' +
      'when they only buried the wound instead of closing it."',
    steps: [
      { kind: 'kill', monsterId: 'eidas_echo', count: 1 }
    ],
    rewards: {
      gold: 1200, xp: 2000,
      items: ['tent_expedition_pavilion'], // invented: top-tier tent per the phase brief (highest tentQuality currently defined)
      trainingPoints: 5
    },
    // Completion text closes the arc: the twinkling light chapter_2 describes, the "stirring
    // things have a way of finding heroes" closing line, and the Council's original, incomplete
    // decree to bury Anima rather than heal the wound.
    completionText: 'The envoy reads your account of the Echo\'s last words twice before she can speak. ' +
      '"Watched, and envied — that\'s what it said the light in the sky had been, all this time." She ' +
      'looks north, though Kastengard is nowhere near sight of Eldor\'s walls. "Three hundred years ago ' +
      'the Council buried the wound instead of healing it, and called that an ending. You\'ve done what ' +
      'they couldn\'t: you\'ve actually closed it. Van Arius didn\'t need a hero for three centuries, or ' +
      'so the old stories say. It certainly needed one today. Rest, hero. You have more than earned it — ' +
      'and somewhere above us, for the first time in longer than anyone living can remember, the sky is ' +
      'well and truly quiet."'
  }
];

window.Game = Game;
