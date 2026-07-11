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
//   requiresRace (NEW, v1.2 Phase 3 Content-A, docs/SPEC-V1.2.md Phase 3 Content-A): enforced in
//   js/core/quests.js accept() — the hero's c.race must equal this string exactly, or acceptance
//   is refused with a clear message (mirrors requiresBaseClass/requiresAdvancedClass's style of
//   gate). Used by the Arkan questline (arkan_first_rite / arkan_battlemage_trial /
//   arkan_red_moon_whispers) so it stays unavailable to Human heroes.
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
  // 5) Professor Flad — archived NAME and HOME (Recent_Updates.md 2007-08-02: "New town (Laik,
  // Riverside Village)... New quest (Laik: Professor Flad)"). Originally relocated to Ju`Mak
  // Village as a stand-in because Laik did not yet exist in the v1 world; v1.2 Phase 3 Content-A
  // adds Laik (js/data/areas.js) as the 4th town, so Flad moves back to his archived home and the
  // levelMin is bumped to match Laik's own travel gate (minLevel 8) — otherwise a hero could
  // accept this quest before being able to reach the giver at all.
  // =====================================================================
  {
    id: 'professor_flad',
    name: 'Professor Flad',
    giver: { areaId: 'laik', npc: 'Professor Flad' }, // archived home: Recent_Updates.md 2007-08-02
    levelMin: 8, // matches Laik's own minLevel (js/data/areas.js) so the quest is reachable exactly when the giver is
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
  },

  // =====================================================================
  // v1.2 Phase 3 Content-A (docs/SPEC-V1.2.md Phase 3 Content-A, review #11): a short Arkan
  // questline, all given in Saratus (the Arkan's own start location, js/core/character.js
  // create()) and gated by the NEW requiresRace: 'Arkan' field (enforced in js/core/quests.js
  // accept(), mirroring requiresBaseClass/requiresAdvancedClass) so it stays unavailable to
  // Humans. Flavor drawn from Arkan.md ("runic blades or bows and arrows... Battlemages
  // reinforce the front with white and black magic derived from the study of runes") and the
  // archived "red moon" lore already told in js/data/story.js chapter_1 (Eidas leading the
  // Society to a nameless red moon). Content/text invented; monsters/items/areas all reused from
  // existing data (no new items.js/monsters.js entries, per the phase brief).
  // =====================================================================

  // ---------- Arkan 1) The First Rite of Saratus — levelMin 1, the doorstep hunting ground ----------
  {
    id: 'arkan_first_rite',
    name: 'The First Rite of Saratus',
    giver: { areaId: 'saratus', npc: 'Elder Meilin' },
    levelMin: 1,
    requiresRace: 'Arkan', // NEW (v1.2 Phase 3 Content-A): enforced at accept() — Humans cannot take this quest
    intro: 'Elder Meilin studies you the way she studies every young Arkan who first steps out ' +
      'past the wardplate gates. "Every runic blade is dulled on something small before it is ' +
      'ever raised against the Majiku, hero. The plains east of the city are thick with rats — ' +
      'thin them out, three will do, and I\'ll see you carry a proper edge from here on."',
    steps: [
      { kind: 'kill', monsterId: 'plains_field_rat', count: 3 }
    ],
    rewards: { gold: 25, xp: 20, items: ['potion_minor_healing'] },
    completionText: 'Elder Meilin nods, satisfied. "A dull blade first, a runic one later. You\'ve made your first cut, hero — Saratus will remember it."'
  },

  // ---------- Arkan 2) Trial of the Battlemage — levelMin 6, Kuraan Border Woods (ancestral Arkan homeland) ----------
  {
    id: 'arkan_battlemage_trial',
    name: 'Trial of the Battlemage',
    giver: { areaId: 'saratus', npc: 'Battlemage Instructor Renjiro' },
    levelMin: 6,
    requiresRace: 'Arkan', // NEW (v1.2 Phase 3 Content-A): enforced at accept()
    intro: 'Battlemage Instructor Renjiro traces a rune in the air, and for a moment it holds its ' +
      'own pale light. "White and black magic, drawn from the study of runes — that is how we ' +
      'reinforce the front, hero (Arkan.md holds as much). But a battlemage is untested until ' +
      'they\'ve stood in the Forests of Kuraan itself, the home the Majiku took from us. Put down ' +
      'four of their forest scouts there, and I\'ll know your runes hold under real pressure."',
    steps: [
      { kind: 'kill', monsterId: 'majiku_forest_scout', count: 4 }
    ],
    rewards: { gold: 90, xp: 110, trainingPoints: 1 },
    completionText: 'Renjiro\'s rune flares brighter before fading. "Four Majiku scouts, and your runes never faltered. Kuraan remembers the Arkan who once called it home, hero — and today, it remembered you too."'
  },

  // ---------- Arkan 3) Whispers of the Red Moon — levelMin 8, Skyspire wisps (red-moon lore) ----------
  {
    id: 'arkan_red_moon_whispers',
    name: 'Whispers of the Red Moon',
    giver: { areaId: 'saratus', npc: 'Rune-Archivist Kaida' },
    levelMin: 8,
    requiresRace: 'Arkan', // NEW (v1.2 Phase 3 Content-A): enforced at accept()
    intro: 'Rune-Archivist Kaida keeps her voice low, as if the archive itself were listening. ' +
      '"Our own runic study owes more to the Society of Modern Magic than most Arkan care to admit ' +
      '— and the stray Anima wisps drifting down from the Skyspire into Kuraan\'s border woods ' +
      'still carry a whisper of wherever Eidas actually took his people, that nameless red moon no ' +
      'one living has seen. Bring me three of the wisps intact, and maybe the runes in them will ' +
      'finally say something plain."',
    steps: [
      { kind: 'kill', monsterId: 'skyspire_wisp', count: 3 }
    ],
    rewards: { gold: 130, xp: 160, items: ['crystal_energy_shard'] },
    completionText: 'Kaida turns the last wisp\'s residue over in her hands, frowning at whatever pattern it traces. "Still no name for the moon. But the pattern\'s the same every time now — the Skyspire went somewhere, hero, and it isn\'t finished with Van Arius yet. Thank you for the runes. I\'ll need every one I can get."'
  },

  // =====================================================================
  // Level-Arc Band A (docs/SPEC-ARC-BANDS.md, F2/F3): Forests of Kuraan, levels 41-50 — the story
  // beat "Reclaim the Kuraan fringe from the Majiku," the first band past the L36-40 Skyspire/
  // Eidas act-break. Main-spine quest + two side quests, all given at the new settlement, Kuraan
  // Reclamation Camp (js/data/areas.js).
  // =====================================================================

  // ---------- Band A main-spine quest ----------
  {
    id: 'reclaim_the_fringe',
    name: 'Reclaim the Fringe',
    giver: { areaId: 'kuraan_reclamation_camp', npc: 'Camp Marshal Serath' },
    levelMin: 41,
    intro: 'Camp Marshal Serath doesn\'t look up from the trench-line map pinned to her table. "The Forests of Kuraan were Arkan ground before the Majiku ever set foot in them, hero — Arkan.md says as much, if you care to read the old surveys. I mean to have the fringe woods back under Crown patrol by season\'s end. Break their reclaimer knights, recover their warband sigils so I know how many banners are left standing, and get eyes on Deep Kuraan itself. That\'s where whoever\'s actually commanding this occupation is hiding."',
    steps: [
      { kind: 'kill', monsterId: 'majiku_reclaimer_knight', count: 5 },
      { kind: 'collect', itemId: 'quest_majiku_warband_sigil', count: 3 },
      { kind: 'visit', areaId: 'deep_kuraan' }
    ],
    rewards: { gold: 900, xp: 1400, items: ['sword_kuraan_reclaimers_blade'], trainingPoints: 3 },
    completionText: 'Serath spreads the sigils across her map, counting under her breath. "Three fewer warbands, five fewer knights, and you\'ve seen Deep Kuraan with your own eyes. Good. Now we know exactly how deep this occupation runs — and exactly how far you\'ll have to go to end it. Take the blade; you\'ve more than earned it."'
  },

  // ---------- Band A side quest 1: Deep Kuraan hunt ----------
  {
    id: 'wraiths_of_the_deepwood',
    name: 'What the Anima Left Behind',
    giver: { areaId: 'kuraan_reclamation_camp', npc: 'Anima-Warden Yulei' },
    levelMin: 46,
    intro: 'Anima-Warden Yulei keeps a careful distance from the camp\'s own supply of raw Anima. "Deep Kuraan is shedding hollow wraiths again — Majiku ritual-work gone wrong, more likely than not, the Anima taking more than it gave back. They\'re dangerous to leave wandering near the fringe line. Put down four of them before one drifts far enough south to find the camp itself."',
    steps: [
      { kind: 'kill', monsterId: 'kuraan_hollow_wraith', count: 4 }
    ],
    rewards: { gold: 700, xp: 1100, items: ['sphere_cclass_2'] },
    completionText: 'Yulei exhales, some of the tension leaving her shoulders. "Four less hollow things drifting the deep woods. Whatever the Majiku were trying to bind out there, I\'d rather we never find out firsthand what it was supposed to become."'
  },

  // ---------- Band A side quest 2: Majiku Warlord boss kill ----------
  {
    id: 'the_warlords_end',
    name: "The Warlord's End",
    giver: { areaId: 'kuraan_reclamation_camp', npc: 'Camp Marshal Serath' },
    levelMin: 50,
    intro: 'Serath finally looks up from the map. "You\'ve seen his deep camp with your own eyes by now, hero. The Majiku Warlord has held Kuraan for a generation — every knight, every witch, every ironclad vanguard we\'ve broken answers to him first. End him, and the fringe doesn\'t just get quieter. It gets ours again."',
    steps: [
      { kind: 'kill', monsterId: 'majiku_warlord', count: 1 }
    ],
    rewards: { gold: 1800, xp: 2600, items: ['heavy_head_kuraan_warhelm'], trainingPoints: 4 },
    completionText: 'Serath turns the Warlord\'s own broken oath over in her hands, and for a long moment says nothing at all. "A generation, hero. He held these woods for a generation, and you ended it in one season. The Forests of Kuraan are Arkan ground again — for the first time since before either of us was born. Whatever comes next out of the Majiku Highlands, we\'ll meet it from here, not from behind a fringe-line trench."'
  },

  // =====================================================================
  // Level-Arc Band B (docs/SPEC-ARC-BANDS.md, F2/F3): Majiku Highlands, levels 51-60 — the story
  // beat "Break the Majiku host," one band north of Kuraan. NO new settlement this band (per the
  // phase brief); all three quests are given at the existing Kuraan Reclamation Camp
  // (js/data/areas.js), which is spec'd to cover the whole 41-60 range.
  // =====================================================================

  // ---------- Band B main-spine quest ----------
  {
    id: 'break_the_majiku_host',
    name: 'Break the Majiku Host',
    giver: { areaId: 'kuraan_reclamation_camp', npc: 'Camp Marshal Serath' },
    levelMin: 51,
    intro: 'Serath has a new map pinned up beside the old one, the border steppe inked in north of the fringe line. "The Kuraan reclamation was only ever the opening move, hero. The Majiku host itself is dug into the highlands proper now — lancers riding the steppe, war-camps mustering on the ridgelines behind them. Break their steppe lancers, recover their host standards so I know how many regiments are still flying them, and get eyes on the Highland War-Camps. Whoever commands that host from up there is the reason this war hasn\'t ended."',
    steps: [
      { kind: 'kill', monsterId: 'majiku_steppe_lancer', count: 5 },
      { kind: 'collect', itemId: 'quest_majiku_host_standard', count: 3 },
      { kind: 'visit', areaId: 'highland_war_camps' }
    ],
    rewards: { gold: 1100, xp: 1700, items: ['sword_majiku_hostbreaker'], trainingPoints: 3 },
    completionText: 'Serath spreads the standards across her new map, counting under her breath just as she did with the sigils. "Three fewer regiments, five fewer lancers, and you\'ve seen the war-camps with your own eyes. The host is dug in deep up there — deeper than Kuraan ever was. But now we know exactly how far north this goes. Take the blade; you\'ve more than earned it."'
  },

  // ---------- Band B side quest 1: Highland War-Camps hunt ----------
  {
    id: 'storms_over_the_ridge',
    name: 'Storms Over the Ridge',
    giver: { areaId: 'kuraan_reclamation_camp', npc: 'Anima-Warden Yulei' },
    levelMin: 56,
    intro: 'Yulei has traded her careful distance from raw Anima for something closer to alarm. "It\'s happening again, hero — worse, this time. The Highland War-Camps are shedding hollow stormwraiths, the same ritual-work-gone-wrong I saw in Deep Kuraan, but crackling with ridgeline static this time. Put down four of them before one drifts far enough south to find the Reclamation Camp itself."',
    steps: [
      { kind: 'kill', monsterId: 'highland_hollow_stormwraith', count: 4 }
    ],
    rewards: { gold: 900, xp: 1400, items: ['sphere_dclass_2'] },
    completionText: 'Yulei exhales, the alarm easing but not quite gone. "Four less hollow things crackling through the war-camps. Whatever the hostcallers are trying to bind up there, it\'s worse than what the deepwood witches were doing. I\'d still rather we never find out firsthand what it was supposed to become."'
  },

  // ---------- Band B side quest 2: Majiku Ridge-Chieftain boss kill ----------
  {
    id: 'the_chieftains_reckoning',
    name: "The Chieftain's Reckoning",
    giver: { areaId: 'kuraan_reclamation_camp', npc: 'Camp Marshal Serath' },
    levelMin: 60,
    intro: 'Serath doesn\'t look up from the map this time either. "You\'ve seen the war-camps with your own eyes, hero. The Majiku Ridge-Chieftain commands the whole host from up there — every lancer, every hostcaller, every hostguard vanguard we\'ve broken answers to him first, same as the Warlord did for Kuraan. End him, and the host doesn\'t just fall back. It breaks."',
    steps: [
      { kind: 'kill', monsterId: 'majiku_ridge_chieftain', count: 1 }
    ],
    rewards: { gold: 2200, xp: 3100, items: ['heavy_head_ridgeplate_helm'], trainingPoints: 4 },
    completionText: 'Serath turns the Chieftain\'s own warpike over in her hands, and this time she does look up. "The Warlord held Kuraan for a generation, and you ended him in a season. The Chieftain held the whole host together — and you\'ve just ended that too. The Majiku Highlands aren\'t won yet, hero, but the host that was supposed to hold them is broken. Whatever comes next out of the Frozen Reaches, we\'ll meet it standing on ground we actually hold."'
  },

  // =====================================================================
  // Level-Arc Band C (docs/SPEC-ARC-BANDS.md, F2/F3): The Frozen Reaches / Ukai approach, levels
  // 61-70 — the story beat "Descend to the cavern Ukai for passage north." Main-spine quest + two
  // side quests, all given at the new settlement, Frosthold Waystation (js/data/areas.js).
  // =====================================================================

  // ---------- Band C main-spine quest ----------
  {
    id: 'win_passage_from_the_ukai',
    name: 'Passage From the Ukai',
    giver: { areaId: 'frosthold_waystation', npc: 'Waystation Commander Thessaly' },
    levelMin: 61,
    intro: 'Waystation Commander Thessaly doesn\'t bother pretending the ice-fields are the real obstacle. "The Ukai are too proud of their cavernous home to think twice about an outsider column, hero — the old lore says as much, and three centuries hasn\'t softened them any. We won\'t so much as reach the undercaverns\' gate while Majiku exiles are still raiding the approach. Break their frost-exiles, recover their deep-runes so I know what the ice is actually hiding, and get eyes on the Ukai Undercaverns themselves. After that, it\'s between us and them."',
    steps: [
      { kind: 'kill', monsterId: 'majiku_frost_exile', count: 5 },
      { kind: 'collect', itemId: 'quest_ukai_deep_rune', count: 3 },
      { kind: 'visit', areaId: 'ukai_undercaverns' }
    ],
    rewards: { gold: 1300, xp: 2000, items: ['sword_frosthold_vanguard_blade'], trainingPoints: 3 },
    completionText: 'Thessaly spreads the deep-runes across her table, turning one over to catch the light. "Five fewer exiles, three runes neither of us can read, and you\'ve stood at the undercaverns\' own gate. Whatever the Ukai make of that, hero, they can\'t claim we didn\'t knock first. Take the blade; you\'ve more than earned it out on that ice."'
  },

  // ---------- Band C side quest 1: Ukai Undercaverns hunt ----------
  {
    id: 'what_slips_through_the_ice',
    name: 'What Slips Through the Ice',
    giver: { areaId: 'frosthold_waystation', npc: 'Anima-Warden Yulei' },
    levelMin: 66,
    intro: 'Anima-Warden Yulei has followed the column all the way north, and likes what she\'s found even less than Deep Kuraan or the Highland War-Camps. "It\'s happening again, hero — a Ukai warden\'s own ward-rite gone wrong, same as the deepwood witches and hostcaller shamans before them, the Anima taking more than it gave back. The undercaverns are shedding hollow deeplings now. Put down four of them before one drifts far enough south to find the waystation itself."',
    steps: [
      { kind: 'kill', monsterId: 'ukai_hollow_deepling', count: 4 }
    ],
    rewards: { gold: 1100, xp: 1700, items: ['sphere_eclass_2'] },
    completionText: 'Yulei exhales, the alarm easing but not quite gone. "Four less hollow things drifting the undercaverns. Deepwood witches, hostcaller shamans, cave wardens — whatever they\'re each called, it\'s the same mistake every time. I\'d still rather we never find out firsthand what it was supposed to become."'
  },

  // ---------- Band C side quest 2: Ukai Deep-Dweller boss kill ----------
  {
    id: 'the_deep_dwellers_reckoning',
    name: "The Deep-Dweller's Reckoning",
    giver: { areaId: 'frosthold_waystation', npc: 'Waystation Commander Thessaly' },
    levelMin: 70,
    intro: 'Thessaly has a third map pinned up now, the undercaverns inked in north of the ice-fields. "You\'ve stood at the gate, hero — you\'ve seen what the Ukai keep at the heart of it. The Deep-Dweller is the only argument their elders have ever respected, from what little of the old lore survived. End it, and passage stops being something we\'re asking for. It becomes something we\'ve won."',
    steps: [
      { kind: 'kill', monsterId: 'ukai_deep_dweller', count: 1 }
    ],
    rewards: { gold: 2600, xp: 3600, items: ['heavy_head_glacial_warhelm'], trainingPoints: 4 },
    completionText: 'Thessaly turns the Deep-Dweller\'s own claw over in her hands, and for a long moment says nothing at all. "The Warlord held Kuraan for a generation. The Chieftain held the whole Majiku host. And the Ukai held this cave since before either of them were born — and you\'ve just ended that too. Whatever waits past the undercaverns, hero, we\'re not asking the Ukai for anything. We\'re walking through."'
  },

  // =====================================================================
  // Level-Arc Band D (docs/SPEC-ARC-BANDS.md, F2/F3): Estari Ruins Deep, levels 71-80 — the story
  // beat "The taboo Anima wellspring — mining it kills Exos." Main-spine quest + two side quests,
  // all given at Frosthold Waystation (js/data/areas.js) since Band D adds no new settlement.
  // =====================================================================

  // ---------- Band D main-spine quest ----------
  {
    id: 'the_taboo_wellspring',
    name: 'The Taboo Wellspring',
    giver: { areaId: 'frosthold_waystation', npc: 'Waystation Commander Thessaly' },
    levelMin: 71,
    intro: 'Waystation Commander Thessaly has a fourth map pinned up now, and this one worries her more than the undercaverns ever did. "Tremors out of the Estari sublevels, hero — the ones sealed since before the Ukai\'s own lore remembers. The old story says the Estari found something down there called Anima and the Council of Three banned anyone from ever mining it, on pain of killing the world itself. Something\'s woken the sublevel wardens regardless. Break them, bring me samples of whatever they\'re leaking, and get eyes on the Wellspring the Estari sealed it all to protect."',
    steps: [
      { kind: 'kill', monsterId: 'estari_sublevel_warden', count: 5 },
      { kind: 'collect', itemId: 'quest_anima_taint_sample', count: 3 },
      { kind: 'visit', areaId: 'anima_wellspring' }
    ],
    rewards: { gold: 1500, xp: 2300, items: ['sword_estari_wardblade'], trainingPoints: 3 },
    completionText: 'Thessaly holds a sample up to the light, and whatever she sees in it drains the color from her face. "Anima-Warden Yulei will want to look at this herself — these traces aren\'t Estari make, hero. Somebody\'s been down there recently, and whoever it was knew exactly what the Council of Three banned and dug into the Wellspring anyway. Take the blade. You\'re not done here — none of us are."'
  },

  // ---------- Band D side quest 1: Anima Wellspring hunt ----------
  {
    id: 'what_the_wellspring_woke',
    name: 'What the Wellspring Woke',
    giver: { areaId: 'frosthold_waystation', npc: 'Anima-Warden Yulei' },
    levelMin: 76,
    intro: 'Anima-Warden Yulei has spread the taint samples across Thessaly\'s table, and none of it sits right with her. "It\'s never been like this, hero — not the deepwood witches, not the hostcaller shamans, not even the Ukai\'s own hollow deeplings. This is raw Anima given shape and hunger straight out of the seam itself, no scarred victim in between. The Wellspring is growing them now. Put down four Raw Anima-Horrors before one drifts far enough to reach Frosthold."',
    steps: [
      { kind: 'kill', monsterId: 'raw_anima_horror', count: 4 }
    ],
    rewards: { gold: 1300, xp: 1900, items: ['sphere_fclass_2'] },
    completionText: 'Yulei sets the last of her instruments down, and for once looks more grim than relieved. "Four fewer horrors out of the Wellspring. But they were never the disease, hero — they\'re the symptom. Something cracked that seal on purpose. I need to know what, and I need to know soon."'
  },

  // ---------- Band D side quest 2: Estari Warden-Prime boss kill ----------
  {
    id: 'the_warden_primes_reckoning',
    name: "The Warden-Prime's Reckoning",
    giver: { areaId: 'frosthold_waystation', npc: 'Waystation Commander Thessaly' },
    levelMin: 80,
    intro: 'Thessaly has a fifth map now, the Wellspring itself inked in past the sublevels. "You\'ve seen the taint, hero, and you\'ve seen what it\'s growing. The Warden-Prime is the last thing standing between us and whoever cracked that seal — the Estari built it to enforce the Council of Three\'s ban against anyone, and right now that includes us. End it, and the Wellspring finally answers to someone who isn\'t trying to mine it to exhaustion."',
    steps: [
      { kind: 'kill', monsterId: 'estari_warden_prime', count: 1 }
    ],
    rewards: { gold: 2900, xp: 3900, items: ['heavy_head_warden_helm'], trainingPoints: 4 },
    completionText: 'Thessaly turns the Warden-Prime\'s own relic-blade over in her hands, and for once she doesn\'t reach for a fourth map. "The Warlord held Kuraan. The Chieftain held the highlands. The Deep-Dweller held the undercaverns. And the Warden-Prime held the one thing all three of them were only guarding the way to. Whatever cracked that seal, hero, it wanted the Wellspring badly enough to wake a ward that\'s slept since before written history. We\'d better find out why before it finishes what it started."'
  },

  // =====================================================================
  // Level-Arc Band E (docs/SPEC-ARC-BANDS.md, F2/F3): Ascent to the Skyspire, levels 81-90 — the
  // story beat "Climb Eidas's Skyspire; confronting the Society's last remnant" (DESIGN.md §2).
  // Main-spine quest + two side quests, all given at Frosthold Waystation (js/data/areas.js)
  // since Band E adds no new settlement.
  // =====================================================================

  // ---------- Band E main-spine quest ----------
  {
    id: 'the_skyspire_ascent',
    name: 'The Skyspire Ascent',
    giver: { areaId: 'frosthold_waystation', npc: 'Waystation Commander Thessaly' },
    levelMin: 81,
    intro: 'Waystation Commander Thessaly has a sixth map pinned up now, and this one points somewhere she never expected to send anyone: straight up Eidas\'s own Skyspire. "The Wellspring was the Estari\'s taboo, hero, but the Skyspire is Kastengard\'s. Eidas reformed his Society there, built that tower, and sailed for the red moon to found his \'divine race\' without ever standing it down. His last remnant never left — and neither did whatever anima-horrors they\'ve been growing since. Break the lower wardens, gather what pages of the Society\'s own ciphers you can carry, and get eyes on the upper spans."',
    steps: [
      { kind: 'kill', monsterId: 'skyspire_lower_warden', count: 5 },
      { kind: 'collect', itemId: 'quest_society_cipher_page', count: 3 },
      { kind: 'visit', areaId: 'skyspire_upper_spans' }
    ],
    rewards: { gold: 1700, xp: 2600, items: ['sword_spireward_blade'], trainingPoints: 3 },
    completionText: 'Thessaly hands the cipher pages off before she\'s even finished reading them. "Cipher-Adept Rennick will want these worse than I do — this isn\'t Estari make, hero, and it isn\'t Ukai either. It\'s the Society\'s own hand, later than anything on record. Eidas has been gone a long time. Somebody up there hasn\'t stopped working."'
  },

  // ---------- Band E side quest 1: Skyspire Upper Spans hunt ----------
  {
    id: 'what_the_society_grew',
    name: 'What the Society Grew',
    giver: { areaId: 'frosthold_waystation', npc: 'Cipher-Adept Rennick' },
    levelMin: 86,
    intro: 'Cipher-Adept Rennick has every cipher page spread across a borrowed table, and none of it sits right with her. "The Society never stopped, hero — not when Eidas left, not when the Council of Three\'s old ban should have scared anyone else off Anima for good. These pages talk about \'ravagers,\' shaped and grown right there in the sanctum. Put down four Anima-Horror Ravagers before one grows large enough to come down off the spans on its own."',
    steps: [
      { kind: 'kill', monsterId: 'anima_horror_ravager', count: 4 }
    ],
    rewards: { gold: 1500, xp: 2100, items: ['sphere_gclass_2'] },
    completionText: 'Rennick sets the last page down and doesn\'t look relieved at all. "Four fewer ravagers off the upper spans. But they were never the Society\'s goal, hero — they\'re what happens when nobody\'s left to hold the leash. I need to know what the last remnant is actually building up there, and I need to know before it finishes."'
  },

  // ---------- Band E side quest 2: Society Anima-Horror boss kill ----------
  {
    id: 'the_societys_last_stand',
    name: "The Society's Last Stand",
    giver: { areaId: 'frosthold_waystation', npc: 'Waystation Commander Thessaly' },
    levelMin: 90,
    intro: 'Thessaly has a seventh map now, the Skyspire\'s own sanctum inked in past the upper spans. "You\'ve seen the pages, hero, and you\'ve seen what they grew. The Anima-Horror is the last thing the Society of Modern Magic ever built, or the last thing it lost control of — either way, it\'s standing between us and whatever\'s left of Eidas\'s own tower. End it, and the Skyspire finally answers to someone who isn\'t chasing a dead man to the red moon."',
    steps: [
      { kind: 'kill', monsterId: 'society_anima_horror', count: 1 }
    ],
    rewards: { gold: 3200, xp: 4200, items: ['heavy_head_spireward_helm'], trainingPoints: 4 },
    completionText: 'Thessaly turns the Anima-Horror\'s own edge over in her hands, and for a long moment neither of them says a word. "The Warlord held Kuraan. The Chieftain held the highlands. The Deep-Dweller held the undercaverns. The Warden-Prime held the Wellspring. And this thing held the Society\'s own tower — the last of Eidas\'s work still standing watch since he sailed for the red moon. Whatever\'s waiting for you up there now, hero, it isn\'t a remnant anymore. It\'s him."'
  },

  // =====================================================================
  // Level-Arc Band F (docs/SPEC-ARC-BANDS.md, F2/F3): The Red Moon / Eidas's Sanctum, levels
  // 91-100 — THE ARC FINALE. Main-spine quest (the crossing itself) + one side quest (Rennick's
  // cipher research pays off) + THE FINALE quest, which culminates the entire 41->100 arc and
  // requires defeating eidas_ascendant, the arc's final lair boss. All three given at Frosthold
  // Waystation (js/data/areas.js), the last hub before the final push — Band F adds no new
  // settlement.
  // =====================================================================

  // ---------- Band F main-spine quest ----------
  {
    id: 'the_red_moon_crossing',
    name: 'The Red Moon Crossing',
    giver: { areaId: 'frosthold_waystation', npc: 'Waystation Commander Thessaly' },
    levelMin: 91,
    intro: 'Waystation Commander Thessaly leads you past the Skyspire\'s own highest platform to a span of rune-stone that has no business existing — arcing up and out, past the sky, toward the red moon itself. "This is as far as any of my scouts have gone and come back, hero. Eidas built this bridge three centuries ago and never came down it again. Break his sentinels, gather what sigil-shards you can carry off them, and get your own eyes on his sanctum. After that, it isn\'t my map anymore."',
    steps: [
      { kind: 'kill', monsterId: 'moonbridge_ward_sentinel', count: 5 },
      { kind: 'collect', itemId: 'quest_eidas_sigil_shard', count: 3 },
      { kind: 'visit', areaId: 'eidas_sanctum' }
    ],
    rewards: { gold: 1900, xp: 2900, items: ['sword_redmoon_blade'], trainingPoints: 3 },
    completionText: 'Thessaly turns the sigil-shards over to Cipher-Adept Rennick without a word of protest this time. "The Society\'s pages, the Warden-Prime\'s ward-stone, and now this. Eidas\'s own sigil, cut fresh, on shards that can\'t be more than a few years old. Whatever he\'s been doing out there, hero, he never stopped. Rennick will want to know exactly what these say before you go any further."'
  },

  // ---------- Band F side quest: Rennick's cipher research pays off ----------
  {
    id: 'what_rennick_deciphered',
    name: 'What Rennick Deciphered',
    giver: { areaId: 'frosthold_waystation', npc: 'Cipher-Adept Rennick' },
    levelMin: 96,
    intro: 'Cipher-Adept Rennick has every page and every shard laid out edge to edge, and for the first time since Kastengard she looks less like a scholar than someone who wishes she\'d been wrong. "It\'s all one hand, hero — the Society\'s ciphers, the sigil-shards, all of it Eidas\'s own work, decades apart but never abandoned. The \'divine race\' wasn\'t a failure. It\'s out there, growing, in the thing the sanctum calls a Devourer. Put down four Moon-Anima Devourers and bring me back proof it can still be killed."',
    steps: [
      { kind: 'kill', monsterId: 'moon_anima_devourer', count: 4 }
    ],
    rewards: { gold: 1700, xp: 2300, items: ['sphere_hclass_2'] },
    completionText: 'Rennick doesn\'t look relieved so much as resigned. "Four dead, and the sanctum barely noticed. That\'s not a remnant losing control of its own creations anymore, hero — that\'s a design working exactly as intended. There\'s only one hand left that could have intended it. You know which one."'
  },

  // ---------- Band F FINALE quest: confront Eidas Ascendant — culminates the 41->100 arc ----------
  {
    id: 'the_ascendants_fall',
    name: "The Ascendant's Fall",
    giver: { areaId: 'frosthold_waystation', npc: 'Waystation Commander Thessaly' },
    levelMin: 100,
    intro: 'Thessaly has no map left to pin up. Everything Frosthold has sent north for the last forty levels — the Kuraan fringe, the Majiku highlands, the Ukai passage, the Wellspring, the Skyspire, and now this bridge to the red moon itself — has been pointing at the same place, and the same name. "The Warlord, the Chieftain, the Deep-Dweller, the Warden-Prime, the Society\'s last horror — every one of them was only ever guarding the road to Eidas, hero, whether they knew it or not. He\'s waiting at the heart of his own sanctum, ascended and unhurried, three centuries into a plan nobody else ever got to see finished. Finish it for him. End Eidas Ascendant, and end the arc that\'s carried you from Kuraan to the red moon."',
    steps: [
      { kind: 'kill', monsterId: 'eidas_ascendant', count: 1 }
    ],
    rewards: { gold: 4000, xp: 5000, items: ['heavy_head_redmoon_helm'], trainingPoints: 5 },
    completionText: 'Thessaly holds the Ascendant\'s Judgment up to the light of the very moon it was cut from, and for once she has nothing clever to say. "The Warlord held Kuraan. The Chieftain held the highlands. The Deep-Dweller held the undercaverns. The Warden-Prime held the Wellspring. The Society\'s horror held the Skyspire. And Eidas — Eidas held all of it, hero, the whole reach of his \'divine race,\' from Kastengard to the red moon and back. He doesn\'t hold any of it anymore. Whatever comes next for Exos, it starts today, and it starts because of you."'
  }
];

window.Game = Game;
