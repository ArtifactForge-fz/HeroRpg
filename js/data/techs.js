// HeroRPG remake — technique database (DESIGN.md §5; reference/manual/Techniques.md, Techs.md).
// Concrete tech list is invented (only the chain/skill/grade *structure* is archived). Player
// techs are organized into per-spell chains ("<Name> I") as described in homepage_2007.md /
// Techniques.md. Monster-only techs (ids prefixed mon_) are simpler, single-rank, and referenced
// directly by js/data/monsters.js.
//
// Shape: { id, name, chain, rank, skill, grade, energyCost, power, effect, trainingCost,
//          skillReq, desc }
//   effect: 'damage' | 'heal' | 'buff' | 'drain'
//   grade: the Anima grade (DESIGN.md §5) used for resistance lookups; null for physical/no grade.

var Game = window.Game || {};

Game.Data = Game.Data || {};

Game.Data.techs = [

  // ---------- Evocation: direct damage (Fire) ----------
  {
    id: 'tech_firebolt_1',
    name: 'Firebolt I',
    chain: 'Firebolt',
    rank: 1,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 12,
    power: 14,
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: 'Hurls a lance of raw fire at the enemy. The most basic Evocation technique taught at any Academy.'
  },

  // ---------- Evocation: direct damage (Star / lightning, per Recent_Updates.md 2007-04-20) ----------
  {
    id: 'tech_starspark_1',
    name: 'Starspark I',
    chain: 'Starspark',
    rank: 1,
    skill: 'Evocation',
    grade: 'Star',
    energyCost: 14,
    power: 16,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 4,
    desc: 'Calls down a crackling arc of Star-grade Anima, the technique that replaced the old "lightning" spells.'
  },

  // ---------- Conjuration: summoned/DoT-flavored damage (Dark) ----------
  {
    id: 'tech_shadowlash_1',
    name: 'Shadowlash I',
    chain: 'Shadowlash',
    rank: 1,
    skill: 'Conjuration',
    grade: 'Dark',
    energyCost: 13,
    power: 15,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 4,
    desc: 'Conjures a whip of clinging shadow-stuff to lash at the enemy.'
  },

  // ---------- Abjuration: healing (Light grade, per Recent_Updates.md 2007-04-20) ----------
  {
    id: 'tech_mend_wounds_1',
    name: 'Mend Wounds I',
    chain: 'Mend Wounds',
    rank: 1,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 10,
    power: 22,
    effect: 'heal',
    trainingCost: 2,
    skillReq: 0,
    desc: 'Knits shallow wounds closed with a wash of Light-grade Anima. Unaffected by Fear (Fear.md: "affects spell damage, not healing").'
  },

  // ---------- Alteration: buff (+damage a few turns), per Recent_Updates.md 2007-04-06 "Alteration is now affected by Spell Powers" ----------
  {
    id: 'tech_warcry_1',
    name: "Warrior's Edge I",
    chain: "Warrior's Edge",
    rank: 1,
    skill: 'Alteration',
    grade: null,
    energyCost: 10,
    power: 6,
    buffDuration: 3, // invented: turns the +damage buff persists
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A short battle-chant that hardens the caster\'s resolve, adding to Damage for a few turns.'
  },

  // ---------- Absorption: drain (invented per DESIGN.md §3 "Absorption=drains/shields") ----------
  {
    id: 'tech_lifetap_1',
    name: 'Lifetap I',
    chain: 'Lifetap',
    rank: 1,
    skill: 'Absorption',
    grade: 'Dark',
    energyCost: 15,
    power: 12,
    effect: 'drain',
    trainingCost: 3,
    skillReq: 4,
    desc: 'Siphons a portion of the enemy\'s vitality into the caster as damage is dealt.'
  },

  // ---------- Second damage tech (Fire chain rank 2) so the Fire chain has depth ----------
  {
    id: 'tech_firebolt_2',
    name: 'Firebolt II',
    chain: 'Firebolt',
    rank: 2,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 18,
    power: 26,
    effect: 'damage',
    trainingCost: 4,
    skillReq: 8,
    desc: 'A stronger Firebolt, requiring the first rank be learned and a proven Evocation skill.'
  },

  // ---------- Phase 4: rank-2 techs for the Abjuration/Conjuration chains, modeled on the
  // Firebolt II precedent (homepage_2007.md: reach a governing-skill level, then train the next
  // rank in the chain at the Academy — archived model, see js/core/world.js learnTech) ----------
  {
    id: 'tech_mend_wounds_2',
    name: 'Mend Wounds II',
    chain: 'Mend Wounds',
    rank: 2,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 16,
    power: 40,
    effect: 'heal',
    // v1.2 Phase 1 item 8: Mend Wounds II doubles as the Abjuration "cleanse" step — no existing
    // tech cleared a status, so this small flag was added per SPEC-V1.2.md Phase 1 #8 (reuse/
    // extend the existing mend/cleanse tech family). Clears Poison and Curse mid-battle in
    // addition to its usual healing (js/core/battle.js useTech).
    clearsStatus: true,
    trainingCost: 3,
    skillReq: 5,
    desc: 'A deeper working of Light-grade Anima that closes far graver wounds than the first rank, and washes away lingering Poison or Curse. Requires Mend Wounds I and Abjuration 5.'
  },
  {
    id: 'tech_shadowlash_2',
    name: 'Shadowlash II',
    chain: 'Shadowlash',
    rank: 2,
    skill: 'Conjuration',
    grade: 'Dark',
    energyCost: 20,
    power: 27,
    effect: 'damage',
    trainingCost: 4,
    skillReq: 5,
    desc: 'A second, crueler lash of clinging shadow-stuff. Requires Shadowlash I and Conjuration 5.'
  },

  // ---------- Weapon-adjacent Alteration debuff-flavored second buff (kept simple: another +damage buff on a different chain) ----------
  {
    id: 'tech_focus_1',
    name: 'Focus I',
    chain: 'Focus',
    rank: 1,
    skill: 'Alteration',
    grade: null,
    energyCost: 8,
    power: 4,
    buffDuration: 4,
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A moment of stillness that sharpens the mind, adding to Damage for several turns.'
  },

  // =====================================================================
  // Phase 6b: rank-III chain extensions (Firebolt/Mend Wounds/Shadowlash), following the exact
  // rank-II precedent above (homepage_2007.md chain model, js/core/world.js previousRankId gate:
  // rank III requires rank II known AND the governing skill >= skillReq).
  // =====================================================================
  {
    id: 'tech_firebolt_3',
    name: 'Firebolt III',
    chain: 'Firebolt',
    rank: 3,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 24,
    power: 40,
    effect: 'damage',
    trainingCost: 5,
    skillReq: 12,
    desc: 'The master Evocation form of Firebolt, taught only once a caster has proven the first two ranks. Requires Firebolt II and Evocation 12.'
  },
  {
    id: 'tech_mend_wounds_3',
    name: 'Mend Wounds III',
    chain: 'Mend Wounds',
    rank: 3,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 22,
    power: 62,
    effect: 'heal',
    trainingCost: 5,
    skillReq: 12,
    desc: 'A profound working of Light-grade Anima that can pull a hero back from the brink. Requires Mend Wounds II and Abjuration 12. Unaffected by Fear (Fear.md).'
  },
  {
    id: 'tech_shadowlash_3',
    name: 'Shadowlash III',
    chain: 'Shadowlash',
    rank: 3,
    skill: 'Conjuration',
    grade: 'Dark',
    energyCost: 26,
    power: 42,
    effect: 'damage',
    trainingCost: 5,
    skillReq: 12,
    desc: 'A third, consuming lash of shadow-stuff, taught only to Conjurers who have mastered the first two ranks. Requires Shadowlash II and Conjuration 12.'
  },

  // ---------- Phase 6b: new Water-grade chain (fills the missing element, DESIGN.md §3 school
  // assignments — Evocation=direct damage, per the Firebolt/Starspark precedent above) ----------
  {
    id: 'tech_tidal_lance_1',
    name: 'Tidal Lance I',
    chain: 'Tidal Lance',
    rank: 1,
    skill: 'Evocation',
    grade: 'Water',
    energyCost: 13,
    power: 15,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 4,
    desc: 'Hurls a driving lance of Water-grade Anima, taught alongside Firebolt and Starspark as the third of the Evocation school\'s elemental strikes.'
  },
  {
    id: 'tech_tidal_lance_2',
    name: 'Tidal Lance II',
    chain: 'Tidal Lance',
    rank: 2,
    skill: 'Evocation',
    grade: 'Water',
    energyCost: 19,
    power: 27,
    effect: 'damage',
    trainingCost: 4,
    skillReq: 8,
    desc: 'A stronger Tidal Lance, requiring the first rank be learned and a proven Evocation skill. Requires Tidal Lance I and Evocation 8.'
  },

  // =====================================================================
  // Monster-only techniques (Recent_Updates.md/Version_2.1_Changes.md: "Added the ability
  // for monsters to use techniques" / "24 new techniques unique to monsters"). Referenced by
  // id from js/data/monsters.js `techs` arrays. Not learnable/equippable by the player.
  // =====================================================================

  {
    id: 'mon_gnawing_bite',
    name: 'Gnawing Bite',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 6,
    power: 10,
    effect: 'damage',
    monsterOnly: true,
    poisonChance: 0.35, // invented: on-hit chance to apply the Poison status (DESIGN.md §4)
    desc: 'A swarm of gnashing teeth that can leave festering, poisoned wounds.'
  },
  {
    id: 'mon_stone_slam',
    name: 'Stone Slam',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Earth',
    energyCost: 10,
    power: 16,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A crushing blow of animated stone.'
  },
  {
    id: 'mon_hunters_mark',
    name: "Hunter's Mark",
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Wind',
    energyCost: 8,
    power: 12,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A precise, wind-quick strike aimed at an exposed weakness.'
  },
  {
    id: 'mon_dark_hex',
    name: 'Dark Hex',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Dark',
    energyCost: 12,
    power: 15,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A muttered curse drawn from unquiet Majiku ancestor-spirits.'
  },
  {
    id: 'mon_static_arc',
    name: 'Static Arc',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Star',
    energyCost: 12,
    power: 17,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A wild discharge of stray Anima, snapping outward like lightning.'
  },

  // ---------- Phase 6b: new monster-only techs (Isle of Juneros / Kastengard flavor) ----------
  {
    id: 'mon_tidal_crush',
    name: 'Tidal Crush',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Water',
    energyCost: 14,
    power: 20,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A crushing wave of Water-grade Anima, favored by the tide-dwelling creatures of the Isle of Juneros.'
  },
  {
    id: 'mon_anima_lance',
    name: 'Anima Lance',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Dark',
    energyCost: 16,
    power: 22,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A concentrated lance of raw, uncategorized Anima, the signature strike of the Society of Modern Magic\'s constructs and remnants at Kastengard.'
  },

  // ---------- Enemy-variety pass: 4 new monster-only techs (damage/poisonChance fields only,
  // within existing engine capabilities), referenced by the new regulars in js/data/monsters.js ----------
  {
    id: 'mon_water_torrent',
    name: 'Water Torrent',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Water',
    energyCost: 11,
    power: 17,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A driving torrent of Water-grade Anima, weaker than a full Tidal Crush but common among the Gares wetland creatures.'
  },
  {
    id: 'mon_wind_buffet',
    name: 'Wind Buffet',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Wind',
    energyCost: 12,
    power: 18,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A heavy gust of Wind-grade Anima that staggers with sheer force rather than precision, unlike a Hunter\'s Mark.'
  },
  {
    id: 'mon_venomous_bite',
    name: 'Venomous Bite',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 8,
    power: 14,
    effect: 'damage',
    monsterOnly: true,
    poisonChance: 0.45, // invented: a second, deadlier tier of Gnawing Bite's poison chance
    desc: 'A precise, venom-laced bite that festers into a deeper poison than a common Gnawing Bite.'
  },
  {
    id: 'mon_earthen_crush',
    name: 'Earthen Crush',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Earth',
    energyCost: 16,
    power: 26,
    effect: 'damage',
    monsterOnly: true,
    desc: 'A heavier, later-tier Stone Slam that buries the target under a collapsing wall of animated earth — favored by the oldest Kastengard sentries.'
  },

  // =====================================================================
  // Class-only battle techs (DESIGN.md §3; js/data/classes.js). Bought with Class Levels at the
  // Academy's Class Abilities section, NOT the general Training-Point tech list (classOnly: true
  // excludes them from Game.World.learnableTechs()). Usable in battle only while the owning class
  // is active in a slot — enforced in js/core/battle.js useTech() via Game.Classes.isClassTechUsable
  // (single guarded check point, see that file's comment).
  //
  // v1.1 revision (DESIGN.md §3 / js/data/classes.js header): base-tier (level-5) techs below are
  // deliberately modest — tech_crushing_blow and tech_anima_surge are retuned DOWN from their old
  // level-30-oriented power/energyCost now that Warrior/Magician grant them at level 5 instead
  // (js/data/classes.js warrior_crushing_blow / magician_anima_surge). The six NEW advanced-tier
  // techs below (one per Gladiator/Crusader/Wizard/Sage/Rogue's sibling Mercenary — Rogue itself
  // reuses tech_shadowstep_strike verbatim) keep the old, stronger level-30-oriented power.
  // =====================================================================
  {
    id: 'tech_crushing_blow',
    name: 'Crushing Blow',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 14,
    power: 16, // revised: down from 34 — base-tier (level 5) power, was level-30-oriented
    effect: 'damage',
    classOnly: true,
    classId: 'warrior',
    desc: 'A heavy, telegraphed blow that trades finesse for raw physical damage. Warrior class technique.'
  },
  {
    id: 'tech_anima_surge',
    name: 'Anima Surge',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Star',
    energyCost: 16,
    power: 18, // revised: down from 38 — base-tier (level 5) power, was level-30-oriented
    effect: 'damage',
    classOnly: true,
    classId: 'magician',
    desc: 'A modest nuke of raw, uncategorized Anima. Magician class technique.'
  },
  {
    id: 'tech_quick_stab',
    name: 'Quick Stab',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 14,
    power: 16,
    effect: 'damage',
    classOnly: true,
    classId: 'thief',
    desc: 'A fast, low-effort knife strike aimed at an opening rather than raw power. Thief class technique.'
  },
  {
    id: 'tech_shadowstep_strike',
    name: 'Shadowstep Strike',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 18,
    power: 16,
    hits: 2, // invented: this tech resolves as two successive strikes (see js/core/battle.js useTech)
    effect: 'damage',
    classOnly: true,
    classId: 'rogue',
    desc: 'A blur of motion that lands two quick strikes before the enemy can react. Rogue class technique.'
  },
  {
    id: 'tech_execution_blow',
    name: 'Execution Blow',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 26,
    power: 55,
    effect: 'damage',
    classOnly: true,
    classId: 'gladiator',
    desc: 'A crowd-silencing, full-strength swing meant to end a fight outright. Gladiator class technique.'
  },
  {
    id: 'tech_radiant_smite',
    name: 'Radiant Smite',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light', // archived: "Healing spells use the Light grade" (Recent_Updates.md)
    energyCost: 24,
    power: 48,
    effect: 'heal',
    classOnly: true,
    classId: 'crusader',
    desc: 'The Crusader calls on Light-grade Anima to mend their own wounds mid-battle. Crusader class technique.'
  },
  {
    id: 'tech_arcane_cataclysm',
    name: 'Arcane Cataclysm',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Star',
    energyCost: 34,
    power: 70,
    effect: 'damage',
    classOnly: true,
    classId: 'wizard',
    desc: 'A graded nuke of raw, uncategorized Anima far beyond anything a common Academy teaches. Wizard class technique.'
  },
  {
    id: 'tech_greater_mending',
    name: 'Greater Mending',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light', // archived: "Healing spells use the Light grade" (Recent_Updates.md)
    energyCost: 30,
    power: 70,
    effect: 'heal',
    classOnly: true,
    classId: 'sage',
    desc: 'A Light-grade restoration far beyond the Academy\'s common mending spells. Sage class technique.'
  },
  {
    id: 'tech_efficient_strike',
    name: 'Efficient Strike',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 10,
    power: 30,
    effect: 'damage',
    classOnly: true,
    classId: 'mercenary',
    desc: 'A trained, economical weapon technique that spends far less Energy than its damage would suggest. Mercenary class technique.'
  },
  {
    id: 'tech_runic_severance',
    name: 'Runic Severance',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light', // invented: hybrid Light+Dark — resistance lookup uses Light; Dark is flavor only (single grade field in data shape)
    energyCost: 28,
    power: 46,
    effect: 'damage',
    classOnly: true,
    classId: 'runeblade_of_kuraan',
    desc: 'A hybrid Light-and-Dark strike that cleaves through both flesh and ward alike. Runeblade of Kuraan class technique.'
  },

  // =====================================================================
  // v1.2 Phase 2 (docs/SPEC-V1.2.md Phase 2): tier-3 + Legendary class-only techs. All five are
  // non-weapon classOnly techs (weaponTech omitted/false), following the SAME shape/mitigation
  // precedent as the tier-1/tier-2 techs above (Phase 1 items 6/7): a non-graded (grade: null)
  // tech's damage ignores the monster's Magic Armor entirely and is rolled against the
  // Intelligence hit/miss check like every other non-weapon offensive tech, while a graded
  // (elemental) tech is mitigated by Magic Armor and resistances as normal. Power/energyCost are
  // tuned per each ability's own comment in js/data/classes.js (tier 3 ~+20% over the stronger
  // tier-2 sibling tech, Legendaries a further "touch above" that).
  // =====================================================================
  {
    id: 'tech_shadow_blade',
    name: 'Shadow Blade',
    chain: null,
    rank: 1,
    skill: null,
    grade: null, // invented: non-elemental, matches the Warrior-line precedent (tech_crushing_blow/tech_execution_blow) — ignores Magic Armor per Phase 1 item 7
    energyCost: 30,
    power: 66, // invented: +20% over Gladiator's Execution Blow (55)
    effect: 'damage',
    classOnly: true,
    classId: 'shadowknight',
    desc: 'A blade wreathed in living shadow, driven home with the full weight of the Shadowknight\'s dark training. Shadowknight class technique.'
  },
  {
    id: 'tech_anima_reckoning',
    name: 'Anima Reckoning',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Star', // invented: elemental, matches the Magician-line precedent (tech_arcane_cataclysm) — mitigated by Magic Armor/resistances
    energyCost: 40,
    power: 84, // invented: +20% over Wizard's Arcane Cataclysm (70)
    effect: 'damage',
    classOnly: true,
    classId: 'magus',
    desc: 'A single, world-shaking verdict of pure Anima far beyond even a Wizard\'s Arcane Cataclysm. Magus class technique.'
  },
  {
    id: 'tech_dice_throw',
    name: 'Dice Throw',
    chain: null,
    rank: 1,
    skill: null,
    grade: null, // invented: non-elemental, matches the Thief-line precedent (tech_quick_stab/tech_efficient_strike) — ignores Magic Armor per Phase 1 item 7
    energyCost: 18,
    power: 45, // invented: +50% over Mercenary's Efficient Strike (30) — a bigger single gamble at a higher Energy cost (economy-tech niche, not a pure nuke; see js/data/classes.js gambit_dice_throw comment for the "high-variance" flavor reasoning)
    effect: 'damage',
    classOnly: true,
    classId: 'gambit',
    desc: 'A thrown blade gambled on a roll of the dice — no finesse, just a bigger swing than a careful strike would risk. Gambit class technique.'
  },
  {
    id: 'tech_vault_reckoning',
    name: "Vaultbreaker's Reckoning",
    chain: null,
    rank: 1,
    skill: null,
    grade: null, // invented: non-elemental — Vaultbreaker's lineage is physical (two constructs/guardians broken by force), ignores Magic Armor per Phase 1 item 7
    energyCost: 33,
    power: 73, // invented: a touch (+~10%) above Shadow Blade (66), the tier-3 band's non-elemental ceiling
    effect: 'damage',
    classOnly: true,
    classId: 'vaultbreaker',
    desc: 'A single blow that carries the full weight of two fallen guardians at once. Vaultbreaker class technique.'
  },
  {
    id: 'tech_echoing_judgment',
    name: 'Echoing Judgment',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light', // invented: hybrid Light+Dark flavor (matches tech_runic_severance's convention — single grade field, Light used for the resistance lookup, Dark is flavor only)
    energyCost: 44,
    power: 92, // invented: a touch (+~10%) above Anima Reckoning (84), the tier-3 band's elemental ceiling
    effect: 'damage',
    classOnly: true,
    classId: 'heir_of_the_echo',
    desc: 'A judgment cast in Eidas\' own hybrid Light-and-Dark Anima, echoing a founder\'s long-silent verdict onto the battlefield. Heir of the Echo class technique.'
  },

  // =====================================================================
  // Feature C (user-directed): weapon techniques. Early melee play was Attack-spam while magic
  // builds got a starter tech (see character.js grantStarterTech); these give the four weapon
  // skills their own Academy-learnable chains. Shape: `weaponTech: true` + `powerMult` (a
  // multiplier on Game.Character.getDamage(player), the PHYSICAL weapon-damage stat — NOT the
  // Intelligence spell factor techEffectivePower() applies to magic-school techs) + optional
  // `armorPierce` (fraction of the monster's Armor term ignored) + optional `hits` (successive
  // strikes, same mechanic as the Rogue's Shadowstep Strike above). grade is always null: these
  // are physical, so (regular) Armor mitigates, never Magic Armor. No `power` field — display-only
  // "Power"/"Effective Damage" rows are skipped for weaponTech in js/ui/infobox.js, which instead
  // shows Power Multiplier/Armor Pierce/Hits and a getDamage-based effective damage. Academy chain
  // gating (trainingCost 2/3/5, skillReq 0/6/12 for ranks I/II/III) mirrors the Firebolt/Mend
  // Wounds/Shadowlash precedent above (js/core/world.js previousRankId/canLearn). All numeric
  // values below are user-directed and invented (no archived per-technique weapon data survived);
  // powerMult values are sim-verified in balance.js FEATURE_C comment / tools sim to beat a plain
  // Attack on damage-per-turn while losing to it on damage-per-energy (Attack costs 5 energy).
  // =====================================================================
  {
    id: 'tech_cleave_1',
    name: 'Cleave I',
    chain: 'Cleave',
    rank: 1,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 1.5, // invented (user-directed)
    energyCost: 12,
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A broad, sweeping sword-stroke that trades precision for raw weight. The most basic Swords technique taught at any Academy.'
  },
  {
    id: 'tech_cleave_2',
    name: 'Cleave II',
    chain: 'Cleave',
    rank: 2,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 1.9, // invented (user-directed)
    energyCost: 16,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 6,
    desc: 'A stronger Cleave, requiring the first rank be learned and a proven Swords skill. Requires Cleave I and Swords 6.'
  },
  {
    id: 'tech_cleave_3',
    name: 'Cleave III',
    chain: 'Cleave',
    rank: 3,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 2.3, // invented (user-directed)
    energyCost: 22,
    effect: 'damage',
    trainingCost: 5,
    skillReq: 12,
    desc: 'The master form of Cleave, taught only once a swordsman has proven the first two ranks. Requires Cleave II and Swords 12.'
  },
  {
    id: 'tech_impale_1',
    name: 'Impale I',
    chain: 'Impale',
    rank: 1,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 1.4, // invented (user-directed)
    armorPierce: 0.35, // invented (user-directed): a driven spear-thrust ignores part of the target's Armor
    energyCost: 12,
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A driving spear-thrust aimed at the gaps in armor. The most basic Polearms technique taught at any Academy.'
  },
  {
    id: 'tech_impale_2',
    name: 'Impale II',
    chain: 'Impale',
    rank: 2,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 1.8, // invented (user-directed)
    armorPierce: 0.35, // invented (user-directed)
    energyCost: 16,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 6,
    desc: 'A stronger Impale, requiring the first rank be learned and a proven Polearms skill. Requires Impale I and Polearms 6.'
  },
  {
    id: 'tech_impale_3',
    name: 'Impale III',
    chain: 'Impale',
    rank: 3,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 2.2, // invented (user-directed)
    armorPierce: 0.35, // invented (user-directed)
    energyCost: 22,
    effect: 'damage',
    trainingCost: 5,
    skillReq: 12,
    desc: 'The master form of Impale, taught only once a polearm-wielder has proven the first two ranks. Requires Impale II and Polearms 12.'
  },
  {
    id: 'tech_vital_strike_1',
    name: 'Vital Strike I',
    chain: 'Vital Strike',
    rank: 1,
    skill: 'Knives',
    grade: null,
    weaponTech: true,
    powerMult: 1.3, // invented (user-directed)
    armorPierce: 0.5, // invented (user-directed): a knife finds the seams in armor even more readily than a spear
    energyCost: 10,
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A precise stab aimed at an exposed vital. The most basic Knives technique taught at any Academy.'
  },
  {
    id: 'tech_vital_strike_2',
    name: 'Vital Strike II',
    chain: 'Vital Strike',
    rank: 2,
    skill: 'Knives',
    grade: null,
    weaponTech: true,
    powerMult: 1.7, // invented (user-directed)
    armorPierce: 0.5, // invented (user-directed)
    energyCost: 14,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 6,
    desc: 'A stronger Vital Strike, requiring the first rank be learned and a proven Knives skill. Requires Vital Strike I and Knives 6.'
  },
  {
    id: 'tech_vital_strike_3',
    name: 'Vital Strike III',
    chain: 'Vital Strike',
    rank: 3,
    skill: 'Knives',
    grade: null,
    weaponTech: true,
    powerMult: 2.0, // invented (user-directed)
    armorPierce: 0.5, // invented (user-directed)
    energyCost: 18,
    effect: 'damage',
    trainingCost: 5,
    skillReq: 12,
    desc: 'The master form of Vital Strike, taught only once a knife-fighter has proven the first two ranks. Requires Vital Strike II and Knives 12.'
  },
  {
    id: 'tech_flurry_1',
    name: 'Flurry I',
    chain: 'Flurry',
    rank: 1,
    skill: 'Hand to Hand',
    grade: null,
    weaponTech: true,
    powerMult: 0.9, // invented (user-directed): each of the 2 hits is individually weaker than a plain Attack
    hits: 2, // invented (user-directed): resolves as two successive strikes (js/core/battle.js useTech, same mechanic as Shadowstep Strike above)
    energyCost: 14,
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A rapid one-two of bare-knuckle strikes. The most basic Hand to Hand technique taught at any Academy.'
  },
  {
    id: 'tech_flurry_2',
    name: 'Flurry II',
    chain: 'Flurry',
    rank: 2,
    skill: 'Hand to Hand',
    grade: null,
    weaponTech: true,
    powerMult: 1.1, // invented (user-directed)
    hits: 2, // invented (user-directed)
    energyCost: 20,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 6,
    desc: 'A stronger Flurry, requiring the first rank be learned and a proven Hand to Hand skill. Requires Flurry I and Hand to Hand 6.'
  }
];

window.Game = Game;
