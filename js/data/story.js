// HeroRPG remake — story/lore chapters, read in the Journal's Story tab (DESIGN.md §7, §2).
// 'prelude' and 'chapter_1' are VERBATIM prose from the archived wiki manual (MediaWiki nav
// boilerplate, "Retrieved from", categories, and page-view footers stripped — see
// reference/manual/Prelude.md and reference/manual/Chapter_I.md for the raw scrape).
// 'chapter_2' was never archived (DESIGN.md §2: "Chapter II existed but was not captured") and
// is an invented continuation — clearly marked below.

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.story = [

  // archived verbatim: reference/manual/Prelude.md
  {
    id: 'prelude',
    title: 'Prelude',
    text: 'The world of Exos is vast and its lands are innumerable. Many lands have had their own ' +
      'stories, complete with their own heroes and saviors - but those stories were in ages past, ' +
      'now forgotten and collecting dust in ancient tomes. This particular tale takes place on a ' +
      'small region of the world known as Van Arius.\n\n' +
      'Now, let\'s not beat around the bush. Van Arius doesn\'t need a hero. It doesn\'t need a ' +
      'savior. That\'s all too cliche and has happened far too many times. There is no looming evil, ' +
      'nor a great threat to the world. The simple fact is that Van Arius has become distant, both ' +
      'of itself and of the world.\n\n' +
      'Many eras have passed since Van Arius was settled, each one bringing the inhabitants of the ' +
      'land further apart. The four races that dwell in distant reaches have no regrets about their ' +
      'decision to separate; why should they, when they all prosper as they do now? War and strife ' +
      'has scattered what remained of their cordiality and tossed it into the wind. The Majiku of ' +
      'the north live in solitude; the Ukai are too proud of their cavernous home to think about ' +
      'anything else; the Humans, wrapped up in trade and commerce, wouldn\'t think of it; and the ' +
      'Arkan, calling themselves a divine race, would never be so humble.\n\n' +
      'The events of three centuries ago have torn apart what was once a great brotherhood and ' +
      'companionship. The original race to settle Van Arius, the Estari, flourished for many eons ' +
      'in the great plains of Averast. Secluded from the world, Van Arius was by no means threatened ' +
      'by the events of surrounding continents. The Estari constructed great cities and castles, ' +
      'their architecture knowing no bounds. They reached the pinnacle of technology, mastering the ' +
      'ways of man, machine, and magic.\n\n' +
      'But that golden age came to an abrupt end when their greatest discovery became their greatest ' +
      'failure....'
  },

  // archived verbatim: reference/manual/Chapter_I.md
  {
    id: 'chapter_1',
    title: 'Chapter I',
    text: 'Deep within the crust of the earth, some Estari runologists discovered a power greater ' +
      'than any they had seen before. This power, dubbed Anima, was a mysterious embodiment of ' +
      'energy that allowed access to great powers that mere mortals should not have been able to ' +
      'invoke. Many thought these runologists were dabbling in the powers of the Ancients themselves ' +
      'and feared their end was near, though research continued nonetheless.\n\n' +
      'The runologists insisted that this power could be used for the greater good and could help ' +
      'the Estari reach new heights in advancement. Finally convincing the Council of Three to ' +
      'agree, the runologists established the Society of Modern Magic, an organization dedicated to ' +
      'studying Anima and producing technology based upon it.\n\n' +
      'It was not long before one runologist discovered that the Anima could be used as propulsion ' +
      'energy; it could move objects great distances with no consumption of the Anima itself. It ' +
      'was at first suggested that this be used to move the entire continent of Van Arius, so that ' +
      'it may be further from other regions of the world in order to prevent conflict with other ' +
      'nations. This idea was rejected by the common citizens and the Council alike, as they feared ' +
      'a drastic change in climate, or worse.\n\n' +
      'While studying further, the researchers came to realize that the Anima was not, in fact, a ' +
      'form of energy. It was a form of life. The Anima itself was alive! By contacting it with ' +
      'their bare hands, the runologists were able to commune with it. However, the message they ' +
      'received was far from what was expected. The Anima force, which was revealed to be ' +
      'ninth-dimensional matter, was the life-force of Exos itself. Expending it would mean the ' +
      'death of the planet and, consequently, every living thing on its surface.\n\n' +
      'This news was too much for the Council to bear. At once they condemned the Society of Modern ' +
      'Magic and the runologist research group dispersed. They order that all excavated Anima be ' +
      'replaced and never unearthed again. This order was followed - for the most part.\n\n' +
      'A small amount of energy was kept, in secret, by one of the runologists by the name of Eidas. ' +
      'Eidas reformed the Society of Modern Magic, which was now an underground research group, and ' +
      'relocated away from Averast. Far to the northeast the Society established a base of ' +
      'operations known as Kastengard. There they discovered many uses for Anima, particularly in ' +
      'magic and technology.\n\n' +
      'As they had discovered before, Anima could be used as a form of propulsion. With this in ' +
      'mind, the Society began looking to the stars. In the night sky could be seen the planet\'s ' +
      'red moon, which bore no name. There they would establish a new race - a divine race - which ' +
      'would oversee the primitive land dwellers as a shepherd would a flock of sheep.\n\n' +
      'It took many years to construct their vessel, but at last it was complete and ready to depart ' +
      'the planet of Exos for the first and last time. The Society climbed aboard the Skyspire and ' +
      'bode farewell to the land they called home for so long. With a fiery blast that could be seen ' +
      'and heard around the world, Skyspire left the ground and broke through the planet\'s ' +
      'atmosphere, leaving but a twinkling light in the sky as its final traces...'
  },

  // invented continuation — Chapter II was never archived (DESIGN.md §2: "Chapter II existed but
  // was not captured — [invented] continuation needed"). Bridges the Skyspire's departure toward
  // the game's present day: the four races drifting further apart, the Estari's abandoned ruins
  // stirring with residual Anima, and the Majiku pressure/Ruin Warden threads the player meets
  // in-game (js/data/monsters.js estari_ruin_warden, js/data/areas.js estari_ruins/kuraan_border_woods).
  {
    id: 'chapter_2',
    title: 'Chapter II', // invented continuation — Chapter II was never archived
    text: 'For a generation after the Skyspire\'s departure, Van Arius held its breath. The Council ' +
      'of Three that remained in Averast declared the matter closed: Anima was buried, the Society ' +
      'was gone, and the world could return to what it had been before the runologists ever laid ' +
      'bare the earth\'s secret. But a wound like that does not simply close because a council wills ' +
      'it so.\n\n' +
      'The Estari themselves dwindled in the centuries that followed — not through war or plague, ' +
      'but through a slow, quiet forgetting, as though the world itself had lost interest in ' +
      'remembering them. Their great cities crumbled into what the newer peoples would come to call, ' +
      'simply, the ruins. Where the Estari went, no one can say for certain; some scholars in Eldor ' +
      'insist they followed Eidas to the red moon in smaller vessels never recorded, others that ' +
      'they simply faded as the Anima beneath their feet grew restless without hands to tend it. ' +
      'Either way, Averast\'s plains passed to the Humans, who built the trading kingdom of Eldor ' +
      'atop foundations they did not fully understand.\n\n' +
      'The Arkan came later still, driven from the Forests of Kuraan by the encroaching Majiku ' +
      'tribes, and raised the circular city of Saratus on the Humans\' doorstep — a proud, displaced ' +
      'people who called themselves divine in the same breath the Skyspire\'s builders once had, ' +
      'though whether by memory or coincidence, none can say. The Majiku pushed south in slow, ' +
      'grinding raids, never quite an army, never quite at peace, and the border woods of Kuraan ' +
      'became a line no map fully agreed on. Deeper still, the Ukai kept to their caverns, content ' +
      'to let the surface quarrel without them.\n\n' +
      'It was the surveyors and treasure-seekers of Eldor who first noticed something had changed. ' +
      'Excavations into the old Estari ruins — begun as idle curiosity, a way to fund the Crown\'s ' +
      'coffers with recovered relics — kept finding less rubble and more resistance. Stone that ' +
      'should have been inert for three centuries shifted when no one was looking. Constructs long ' +
      'thought dormant rose to bar the deeper halls, as if some old directive had quietly re-armed ' +
      'itself. The Council\'s decree that "all excavated Anima be replaced and never unearthed ' +
      'again" had held, more or less — but holding a wound shut is not the same as healing it, and ' +
      'the Anima beneath Averast had spent three hundred years remembering that it was alive.\n\n' +
      'Whether the Majiku raids into the border woods are opportunism, desperation, or something ' +
      'stirred loose by the same restlessness troubling the ruins, no one in Eldor or Saratus can ' +
      'yet say. What is certain is that the deepest chambers beneath the Estari ruins now answer to ' +
      'a warden that answers to no living order — and that somewhere above Van Arius, past the ' +
      'clouds, a twinkling light still crosses the night sky on quiet evenings, exactly where the ' +
      'old stories say the Skyspire vanished.\n\n' +
      'It does not need a hero. It has not needed one in three hundred years. But something, at ' +
      'last, is stirring — and stirring things have a way of finding heroes whether the world asked ' +
      'for them or not.'
  },

  // invented continuation — level-arc F5 (docs/SPEC-FULL-LEVEL-ARC.md §6; docs/SPEC-ARC-BANDS.md
  // Bands A-C). Chapter II ends with the ruin warden stirring beneath Averast; Chapter III picks up
  // once the hero has broken that warden's line and pushed the Kuraan/Majiku/Ukai front all the way
  // to the Frozen Reaches (js/data/quests.js reclaim_the_fringe / the_warlords_end /
  // break_the_majiku_host / the_chieftains_reckoning / win_passage_from_the_ukai /
  // the_deep_dwellers_reckoning). Never archived — [invented], consistent with the archived
  // Arkan/Majiku/Ukai lore set up in the Prelude.
  {
    id: 'chapter_3',
    title: 'Chapter III',
    text: 'Whatever answered from beneath the Estari ruins did not hold for long once a hero actually ' +
      'went looking for it. Word of it reached Saratus before the dust had settled, and from Saratus ' +
      'it reached the Forests of Kuraan — Arkan ground once, Majiku-held for a generation since, and ' +
      'the one wound on the map that every displaced Arkan elder still called by its old name. Camp ' +
      'Marshal Serath had been holding a fringe-line trench there for longer than she cared to admit ' +
      'when the hero arrived asking, not for permission, but for a map.\n\n' +
      'The reclaiming went the way these things rarely do: quickly, once someone finally pushed. The ' +
      'reclaimer knights fell, the warband sigils came back three and five at a time, and Deep Kuraan ' +
      '— which Serath\'s scouts had circled on their maps for a decade without ever quite entering — ' +
      'opened its own deep camp to a single stubborn visitor. At the bottom of it waited the Majiku ' +
      'Warlord, who had commanded that occupation since before the hero was born, and who did not ' +
      'survive being asked to stop. For the first time since the old surveys were drawn, the Forests ' +
      'of Kuraan answered to a Crown patrol again instead of a war-camp.\n\n' +
      'It was not, as Serath had warned, the end of it. The Majiku host itself had never lived in ' +
      'Kuraan at all — Kuraan was only ever its forward edge. North of the fringe, the land rose into ' +
      'the Majiku Highlands proper: steppe lancers riding picket lines, ridgeline war-camps mustering ' +
      'behind them, and at the top of it the Majiku Ridge-Chieftain, who had held the whole host ' +
      'together the way the Warlord alone never could. The same hero who had ended a generation\'s ' +
      'occupation in a single season did the same to the host that had raised it, standard by ' +
      'captured standard, until the Chieftain\'s own warpike was the only thing left of him worth ' +
      'carrying home.\n\n' +
      'Past the Highlands the land did not so much end as give up on being hospitable at all — ice- ' +
      'fields, and beneath them, the undercaverns of the Ukai, who had kept to their caverns since ' +
      'the world was younger and had never once been asked to share them. Waystation Commander ' +
      'Thessaly built Frosthold at the edge of that ice specifically to ask anyway. The Ukai did not ' +
      'answer with welcome — Majiku frost-exiles still raided the approach, and the Deep-Dweller that ' +
      'the Ukai elders had always deferred to was in no hurry to be argued with — but a hero who had ' +
      'already ended a Warlord and a Chieftain in the same year did not particularly need welcome. ' +
      'Passage north stopped being something Frosthold was asking for. It became something it had ' +
      'won.\n\n' +
      'Three names, three seasons, three generations of holding undone: the Warlord\'s, the ' +
      'Chieftain\'s, the Deep-Dweller\'s. Thessaly kept all three trophies on the same table, not as ' +
      'decoration, but as a running tally of how far north this had already gone — and how much ' +
      'farther the maps still pinned beside them suggested it had left to go.'
  },

  // invented continuation — level-arc F5 (docs/SPEC-FULL-LEVEL-ARC.md §6; docs/SPEC-ARC-BANDS.md
  // Bands D-E). Anchored in the archived Anima taboo (Chapter I: "expending it would mean the death
  // of the planet") and the archived Society of Modern Magic / Skyspire (also Chapter I). Covers the
  // Estari Ruins Deep / Anima Wellspring arc and the Skyspire ascent (js/data/quests.js
  // the_taboo_wellspring / the_warden_primes_reckoning / the_skyspire_ascent / the_societys_last_stand).
  {
    id: 'chapter_4',
    title: 'Chapter IV',
    text: 'The Ukai, once passage was won rather than requested, turned out to know something Frosthold ' +
      'did not: that the tremors reaching their undercaverns from the south did not come from the ' +
      'surface war at all. They came from deeper still, out of the Estari sublevels the old runologists ' +
      'had sealed three centuries before — the same sublevels the Council of Three had ordered closed ' +
      'forever, on the same day they condemned the Society of Modern Magic and swore that Anima, once ' +
      'buried, would never be unearthed again. Someone had unearthed it anyway.\n\n' +
      'The sublevel wardens the hero broke on the way down were built to enforce exactly that ban, and ' +
      'the taint samples pulled from their wreckage were not Estari make at all — fresh work, done ' +
      'recently, by someone who understood precisely what the Council had forbidden and dug into the ' +
      'Wellspring regardless. Anima-Warden Yulei recognized the shape of what was growing down there ' +
      'before anyone wanted her to: raw Anima given form and hunger with no scarred victim standing ' +
      'between the seam and the surface, exactly the failure the runologists had warned of when they ' +
      'first discovered the Anima was alive. The Estari Warden-Prime, the last ward the precursors had ' +
      'left to guard the seal, held the line until the hero ended it — and ended, with it, any comfort ' +
      'that the mining had already run its course. It had not. Something had only just begun it again.\n\n' +
      'The trail from the Wellspring led north and up, past the Frozen Reaches, past the ruins, ' +
      'further than Thessaly\'s maps had ever needed to reach before: to the Skyspire itself, the very ' +
      'vessel Eidas and his Society had ridden off the face of Exos three centuries earlier. It had ' +
      'never fully left. A remnant of the Society remained, cloistered in the tower\'s lower spans, ' +
      'and it had not spent three hundred years idle — cipher pages recovered from its lower wardens ' +
      'were written in a hand later than anything on record, describing "ravagers" grown, not found, ' +
      'in the sanctum above.\n\n' +
      'Cipher-Adept Rennick, who joined the column at Frosthold specifically because she could read ' +
      'what nobody else could, put it plainer than Thessaly ever had: the Society had never stopped ' +
      'working, Eidas or no Eidas, ban or no ban. What the hero found waiting at the top of the upper ' +
      'spans was not a leaderless cult clinging to a dead man\'s tower. It was the Society\'s own last ' +
      'and largest creation — a horror built or lost, nobody could say which — standing guard over ' +
      'the one door in Van Arius that still opened onto the sky. When it fell, Thessaly did not reach ' +
      'for another map. She only said what everyone standing there already suspected: that whatever ' +
      'waited past that door was not a remnant anymore. It was Eidas himself.'
  },

  // invented continuation — level-arc F5 (docs/SPEC-FULL-LEVEL-ARC.md §6; docs/SPEC-ARC-BANDS.md
  // Band F, the arc finale). The Prelude's "divine race" on the red moon and Chapter I's Skyspire
  // departure both pay off here; capstone beat for js/data/quests.js the_red_moon_crossing /
  // what_rennick_deciphered / the_ascendants_fall (final lair boss eidas_ascendant, level 100).
  {
    id: 'epilogue',
    title: 'Epilogue',
    text: 'Past the Skyspire\'s highest platform, the bridge Eidas left behind three centuries ago was ' +
      'still exactly where the old stories said it would be — a span of rune-stone arcing up and out, ' +
      'past the sky, toward the red moon that had never once been given a name. Thessaly walked the ' +
      'hero to its foot and no further; her scouts had gone that far before and none had come back to ' +
      'report what waited past it. The moon-bridge\'s own ward sentinels fell the way everything since ' +
      'Kuraan had fallen, and the sigil-shards recovered from them were cut too recently to be ' +
      'anything but current work — Eidas\'s own hand, unmistakable to Rennick now that she had every ' +
      'page and every shard laid out together at last.\n\n' +
      'What Rennick found in that hand was not the quiet failure the Council of Three had once hoped ' +
      'for when they exiled the Society to Kastengard. The "divine race" Eidas had promised to found ' +
      'on the red moon was real, and growing, in things the sanctum itself called Devourers — Anima ' +
      'given shape on a scale the Estari runologists who first touched it could never have imagined. ' +
      'It was not a remnant losing control of its own creations. It was a design three hundred years ' +
      'in the making, working exactly as intended, and there was only one hand left that could have ' +
      'intended it.\n\n' +
      'Eidas himself waited at the heart of his own sanctum, ascended past whatever he had been when ' +
      'he first pried a small measure of the world\'s life-force loose from Averast and never gave it ' +
      'back. He did not flee, and he did not bargain. Three centuries is a long time to wait for an ' +
      'ending, and he met his without surprise — only, in the last moment, something almost like ' +
      'relief, as though being stopped had been the one outcome his plan had never quite accounted ' +
      'for.\n\n' +
      'The Warlord had held Kuraan. The Chieftain had held the Highlands. The Deep-Dweller had held ' +
      'the undercaverns. The Warden-Prime had held the Wellspring. The Society\'s last horror had held ' +
      'the Skyspire. And Eidas had held all of it — every league from Kastengard to the red moon and ' +
      'back, every century since the runologists first learned the earth was alive — until a single ' +
      'hero climbed the whole road he\'d built and ended it at the top. Van Arius still does not need ' +
      'a hero, not really, not the way the old stories always insisted it did. But it had one anyway, ' +
      'and whatever the four races make of Exos now that its oldest, quietest wound has finally ' +
      'closed, they will tell it as the chroniclers always do: that something was stirring, and it ' +
      'found the right person standing in its way.'
  }
];

window.Game = Game;
