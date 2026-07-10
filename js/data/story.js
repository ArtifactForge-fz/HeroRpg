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
  }
];

window.Game = Game;
