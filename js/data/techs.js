// HeroRPG remake — technique database (DESIGN.md §5; reference/manual/Techniques.md, Techs.md).
// Concrete tech list is invented (only the chain/skill/grade *structure* is archived). Player
// techs are organized into per-spell chains ("<Name> I") as described in homepage_2007.md /
// Techniques.md. Monster-only techs (ids prefixed mon_) are simpler, single-rank, and referenced
// directly by js/data/monsters.js.
//
// Shape: { id, name, chain, rank, skill, grade, energyCost, power, effect, trainingCost,
//          skillReq, desc }
//   effect: 'damage' | 'heal' | 'buff' | 'drain' | 'debuff' | 'summon'
//   grade: the Anima grade (DESIGN.md §5) used for resistance lookups; null for physical/no grade.
//
// v1.9 (docs/SPEC-COMPANION-SYSTEM.md): companion-system tech fields, all optional/back-compatible
// (every pre-existing tech is unaffected):
//   summonKind: on effect:'summon' techs — the js/data/companions.js kind id to bind
//               (js/core/battle.js useTech -> Game.Companion.summon).
//   requiresCompanion: the companion kind id that must be bound AND alive this battle for a
//               command tech to be castable (js/core/battle.js useTech).
//   detonatesBurn: true on a damage tech that detonates the Fire companion's active Burn DoT.
//   refreshesCompanionTaunt: true on a buff tech that also refreshes the Earth companion's Taunt.
// Monster techs (js/data/monsters.js `techs` arrays) may also carry:
//   target: 'player' | 'companion' | 'both' — who a monster's tech strikes (js/core/battle.js
//           monsterAct); ABSENT ⇒ 'player' (every shipped monster tech is unaffected).

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
    // v1.2 Phase 3 (Content-B item 4): shard-cost enhancement tech. RULE [archived]
    // (reference/manual/Anima_Shards.md: shards "used when casting certain techniques that
    // bestow enhancements"); number [invented]. Consumed in js/core/battle.js useTech before the
    // Energy deduction — insufficient shards refuses the cast entirely (no Energy spent, no buff
    // applied), via the character's own animaShards balance (same field Game.World.buyBuff spends
    // from), no second RNG.
    // v1.6 P3 EI-7 (SPEC-V1.6-REBALANCE.md §3, REVIEW-2026-07-16.md EI-7) [invented]: 5 -> 0 --
    // Alteration was the ONLY school taxed at all (every other school's techs cost 0 shards), and
    // this was its rank-1 (earliest, most-used) buff; making it free removes the tax where it hurt
    // most while EI-5's flatter shard supply still lets the higher-rank Alteration buffs keep a
    // real (now easier to afford) cost below.
    shardCost: 0,
    trainingCost: 2,
    skillReq: 0,
    desc: 'A short battle-chant that hardens the caster\'s resolve, adding to Damage for a few turns.'
  },
  {
    id: 'tech_warcry_2',
    name: "Warrior's Edge II",
    chain: "Warrior's Edge",
    rank: 2,
    skill: 'Alteration',
    grade: null,
    energyCost: 16,
    power: 12,
    buffDuration: 4, // invented: turns the +damage buff persists
    effect: 'buff',
    // v1.2 Phase 3 (Content-B item 4): shard-cost enhancement tech, same rule/citation as
    // tech_warcry_1 above; a stronger buff commands a steeper shard cost.
    // v1.6 P3 EI-7 (SPEC-V1.6-REBALANCE.md §3, REVIEW-2026-07-16.md EI-7) [invented]: 15 -> 10 --
    // paired with tech_warcry_1's shard tax going to 0 and the flatter EI-5 shard supply, so the
    // Alteration chain's real cost is still meaningful at higher ranks without being "enormously
    // high" (the exact playtest complaint).
    shardCost: 10,
    trainingCost: 4,
    skillReq: 6,
    desc: 'A deeper battle-chant, requiring Warrior\'s Edge I and Alteration 6, adding more to Damage for a few turns. Costs 10 Anima Shards to cast.'
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
    // v1.2 Phase 3 (Content-B item 4): shard-cost enhancement tech, same rule/citation as
    // tech_warcry_1 (reference/manual/Anima_Shards.md), consumed in js/core/battle.js useTech.
    // v1.6 P3 EI-7 (SPEC-V1.6-REBALANCE.md §3, REVIEW-2026-07-16.md EI-7) [invented]: 8 -> 5 --
    // same Alteration shard-tax rebalance as tech_warcry_1/tech_warcry_2 above.
    shardCost: 5,
    trainingCost: 2,
    skillReq: 0,
    desc: 'A moment of stillness that sharpens the mind, adding to Damage for several turns. Costs 5 Anima Shards to cast.'
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
  // v1.5 P4 (docs/SPEC-TIER3-EXPANSION.md): the 9 NEW Tier-3 classOnly signature techs, one per
  // js/data/classes.js's 9 new Tier-3 classes (branching — see that file's THIRD TIER header
  // comment). Same shape/mitigation precedent as the v1.2 Phase 2 block above: non-graded
  // (grade: null) damage ignores Magic Armor and is rolled against the Intelligence hit/miss
  // check; a graded (elemental) tech is mitigated by Magic Armor and resistances as normal.
  // Power/energyCost numbers are PROVISIONAL (Part B brief) within the established Tier-3 band —
  // the lead's P5 balance-sanity sim tunes final numbers; see js/data/classes.js's per-ability
  // comments for how each anchors (or deliberately doesn't) to its Tier-2 parent.
  // =====================================================================
  {
    id: 'tech_berserker_frenzy',
    name: 'Frenzy',
    chain: null,
    rank: 1,
    skill: null,
    grade: null, // invented: non-elemental, matches the Warrior-line precedent (tech_crushing_blow/tech_execution_blow/tech_shadow_blade) — ignores Magic Armor per Phase 1 item 7
    energyCost: 32, // invented: provisional Part B brief number, pending lead's P5 balance-sanity sim
    power: 72, // invented: +9% over Shadowknight's Shadow Blade (66) — Berserker's glass-cannon identity is carried mostly by its passives (Bloodlust/Frenzied Pace), not a runaway tech number
    effect: 'damage',
    classOnly: true,
    classId: 'berserker',
    desc: 'A reckless, all-or-nothing flurry of blows that abandons any pretense of defense for raw physical damage. Berserker class technique.'
  },
  {
    id: 'tech_paladin_smite',
    name: 'Smite',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light', // archived: "Healing spells use the Light grade" (Recent_Updates.md) — Paladin's holy damage reuses the same grade, mitigated by Magic Armor/resistances like any elemental tech
    energyCost: 30, // invented: provisional Part B brief number, pending lead's P5 balance-sanity sim
    power: 60, // invented: provisional Part B brief number, within the tier-3 elemental-damage band
    effect: 'damage',
    classOnly: true,
    classId: 'paladin',
    desc: 'A Light-grade blow called down on an enemy with the full weight of the Crusader\'s faith behind it. Paladin class technique.'
  },
  {
    id: 'tech_warden_bulwark',
    name: 'Bulwark Strike',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light', // invented: same Light-grade convention as tech_radiant_smite/tech_paladin_smite (Crusader line's Light-Anima flavor) — mitigated by Magic Armor/resistances
    energyCost: 28, // invented: provisional Part B brief number, pending lead's P5 balance-sanity sim
    power: 52, // invented: provisional Part B brief number, within the tier-3 elemental-damage band
    effect: 'damage',
    classOnly: true,
    classId: 'warden',
    desc: 'A Light-grade blow driven through the Warden\'s own barrier, turning defense briefly into attack. Warden class technique.'
  },
  // v1.9 (docs/SPEC-COMPANION-SYSTEM.md D0): the Conjurer's old "Elemental Servitor"
  // (tech_summon_elemental, effect:'summon') that used to live here is RETIRED/superseded — see
  // the new companion-system Bind/command techs appended at the end of this file, and
  // js/data/classes.js's redesigned Conjurer (four Pact abilities).
  {
    id: 'tech_greater_restoration',

    name: 'Greater Restoration',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light', // archived: "Healing spells use the Light grade" (Recent_Updates.md)
    energyCost: 34, // invented: provisional Part B brief number, pending lead's P5 balance-sanity sim
    power: 96, // invented: +37% over Sage's Greater Mending (70) — Cleric is Sage's dedicated restoration option, so its signature heal leads the healing-tech band. Provisional (Part B).
    effect: 'heal',
    classOnly: true,
    classId: 'cleric',
    desc: 'A Light-grade restoration deeper than even a Sage\'s Greater Mending. Cleric class technique.'
  },
  {
    id: 'tech_seers_ward',
    name: "Seer's Ward",
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light', // invented: foresight/protective flavor, matches the archived Light-grade convention for support/ward effects used elsewhere (Wardskin/Crusader line)
    energyCost: 26, // invented: provisional Part B brief number, pending lead's P5 balance-sanity sim
    power: 40, // invented: provisional Part B brief number — flat +Damage buff, well above tech_warcry_2's 12 since Seer has no other damage passive to lean on (Foresight/Clairvoyant Reserves are both non-offensive)
    buffDuration: 4, // invented: matches tech_warcry_2/tech_focus_1's buff-duration convention (no separate `buffType` field exists in the shipped buff-tech shape — see js/core/battle.js useTech's `effect === 'buff'` branch, which reads only `power`/`buffDuration`)
    effect: 'buff',
    classOnly: true,
    classId: 'seer',
    desc: 'A moment of foresight woven into a battle-chant, hardening resolve and adding to Damage for a few turns. Seer class technique.'
  },
  {
    id: 'tech_lethal_strike',
    name: 'Lethal Strike',
    chain: null,
    rank: 1,
    skill: null,
    grade: null, // invented: non-elemental, matches the Thief-line precedent (tech_quick_stab/tech_efficient_strike/tech_dice_throw) — ignores Magic Armor per Phase 1 item 7
    energyCost: 30, // invented: provisional Part B brief number, pending lead's P5 balance-sanity sim
    power: 68, // invented: provisional Part B brief number, within the tier-3 non-elemental band (Shadow Blade 66 / Vault Reckoning 73)
    effect: 'damage',
    classOnly: true,
    classId: 'assassin',
    desc: 'A precise, brutal strike aimed at ending the fight in a single opening. Assassin class technique.'
  },
  {
    id: 'tech_ranger_volley',
    name: "Ranger's Volley",
    chain: null,
    rank: 1,
    skill: null,
    grade: null, // invented: non-elemental physical volley — matches the Thief-line precedent, ignores Magic Armor
    energyCost: 30, // invented: provisional Part B brief number, pending lead's P5 balance-sanity sim
    power: 34, // invented: provisional Part B brief number — PER HIT (see hits: 2 below); mirrors tech_shadowstep_strike's two-hit shape (js/core/battle.js useTech `hits` loop)
    hits: 2, // invented: this tech resolves as two successive strikes (see js/core/battle.js useTech), same mechanic as Rogue's Shadowstep Strike
    effect: 'damage',
    classOnly: true,
    classId: 'ranger',
    desc: 'Two quick, ranged-leaning strikes loosed in close succession. Ranger class technique.'
  },
  {
    id: 'tech_dragoon_leap',
    name: "Dragoon's Leap",
    chain: null,
    rank: 1,
    skill: null,
    grade: null, // invented: non-elemental physical strike — Dragoon's lineage is a heavy hybrid melee fighter, not a caster
    energyCost: 30, // invented: provisional Part B brief number, pending lead's P5 balance-sanity sim
    power: 65, // invented: provisional Part B brief number, within the tier-3 non-elemental band
    effect: 'damage',
    classOnly: true,
    classId: 'dragoon',
    desc: 'A heavy, leaping strike that lands with the full weight of Dragoon plate behind it. Dragoon class technique.'
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
  },

  // =====================================================================
  // Level-Arc Band A (docs/SPEC-ARC-BANDS.md, F2/F3): one step further into two magic-school
  // chains and two weapon-tech chains, gated by skill level per the existing Academy chain model
  // (js/core/world.js previousRankId/canLearn — rank>1 requires the previous rank known AND the
  // governing skill >= skillReq). skillReq 20 is comfortably inside a level 41+ character's skill
  // cap (BALANCE.SKILL_CAP(41) = 83) for anyone who has actually trained the skill.
  // =====================================================================
  {
    id: 'tech_firebolt_4',
    name: 'Firebolt IV',
    chain: 'Firebolt',
    rank: 4,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 30,
    power: 56,
    effect: 'damage',
    trainingCost: 6,
    skillReq: 20,
    desc: 'The Kuraan-era form of Firebolt, taught only to Evocation adepts who have proven the first three ranks. Requires Firebolt III and Evocation 20.'
  },
  {
    id: 'tech_mend_wounds_4',
    name: 'Mend Wounds IV',
    chain: 'Mend Wounds',
    rank: 4,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 28,
    power: 84,
    effect: 'heal',
    trainingCost: 6,
    skillReq: 20,
    desc: 'A Kuraan-era working of Light-grade Anima, mending wounds no earlier rank could close. Requires Mend Wounds III and Abjuration 20. Unaffected by Fear (Fear.md).'
  },
  {
    id: 'tech_cleave_4',
    name: 'Cleave IV',
    chain: 'Cleave',
    rank: 4,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 2.6, // invented (user-directed)
    energyCost: 26,
    effect: 'damage',
    trainingCost: 6,
    skillReq: 20,
    desc: 'The Kuraan-era form of Cleave, taught only once a swordsman has proven the first three ranks. Requires Cleave III and Swords 20.'
  },
  {
    id: 'tech_impale_4',
    name: 'Impale IV',
    chain: 'Impale',
    rank: 4,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 2.5, // invented (user-directed)
    armorPierce: 0.35, // invented (user-directed)
    energyCost: 26,
    effect: 'damage',
    trainingCost: 6,
    skillReq: 20,
    desc: 'The Kuraan-era form of Impale, taught only once a polearm-wielder has proven the first three ranks. Requires Impale III and Polearms 20.'
  },

  // =====================================================================
  // Level-Arc Band B (docs/SPEC-ARC-BANDS.md, F2/F3): one further rank into the same two magic-
  // school chains and two weapon-tech chains Band A extended, gated by skill level per the
  // existing Academy chain model (js/core/world.js previousRankId/canLearn — rank>1 requires the
  // previous rank known AND the governing skill >= skillReq). skillReq 30 is comfortably inside a
  // level 51+ character's skill cap (BALANCE.SKILL_CAP(51) = 103) for anyone who has actually
  // trained the skill. Numeric progressions (power/powerMult/energyCost/trainingCost) continue
  // each chain's existing rank-to-rank deltas (e.g. Firebolt's power deltas 12/14/16 -> +18 here).
  // =====================================================================
  {
    id: 'tech_firebolt_5',
    name: 'Firebolt V',
    chain: 'Firebolt',
    rank: 5,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 36,
    power: 74,
    effect: 'damage',
    trainingCost: 8,
    skillReq: 30,
    desc: 'The Majiku-Highlands-era form of Firebolt, taught only to Evocation adepts who have proven the first four ranks. Requires Firebolt IV and Evocation 30.'
  },
  {
    id: 'tech_mend_wounds_5',
    name: 'Mend Wounds V',
    chain: 'Mend Wounds',
    rank: 5,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 34,
    power: 110,
    effect: 'heal',
    trainingCost: 8,
    skillReq: 30,
    desc: 'A Majiku-Highlands-era working of Light-grade Anima, mending wounds no earlier rank could close. Requires Mend Wounds IV and Abjuration 30. Unaffected by Fear (Fear.md).'
  },
  {
    id: 'tech_cleave_5',
    name: 'Cleave V',
    chain: 'Cleave',
    rank: 5,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 2.9, // invented (user-directed)
    energyCost: 30,
    effect: 'damage',
    trainingCost: 8,
    skillReq: 30,
    desc: 'The Majiku-Highlands-era form of Cleave, taught only once a swordsman has proven the first four ranks. Requires Cleave IV and Swords 30.'
  },
  {
    id: 'tech_impale_5',
    name: 'Impale V',
    chain: 'Impale',
    rank: 5,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 2.8, // invented (user-directed)
    armorPierce: 0.35, // invented (user-directed)
    energyCost: 30,
    effect: 'damage',
    trainingCost: 8,
    skillReq: 30,
    desc: 'The Majiku-Highlands-era form of Impale, taught only once a polearm-wielder has proven the first four ranks. Requires Impale IV and Polearms 30.'
  },

  // =====================================================================
  // Level-Arc Band C (docs/SPEC-ARC-BANDS.md, F2/F3): one further rank into the same two magic-
  // school chains and two weapon-tech chains Bands A/B extended, gated by skill level per the
  // existing Academy chain model (js/core/world.js previousRankId/canLearn — rank>1 requires the
  // previous rank known AND the governing skill >= skillReq). skillReq 40 is comfortably inside a
  // level 61+ character's skill cap (BALANCE.SKILL_CAP(61) = 123) for anyone who has actually
  // trained the skill. Numeric progressions (power/powerMult/energyCost/trainingCost) continue
  // each chain's existing rank-to-rank deltas (e.g. Firebolt's power deltas 12/14/16/18 -> +18 here).
  // =====================================================================
  {
    id: 'tech_firebolt_6',
    name: 'Firebolt VI',
    chain: 'Firebolt',
    rank: 6,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 42,
    power: 51, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 92 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 50.6 -> 51. Cleave/Impale/Firebolt ranks 6-9 were compressing fights (killing before Fear/armor could matter); armor fix alone wasn't enough, see balance.js.
    effect: 'damage',
    trainingCost: 10,
    skillReq: 40,
    desc: 'The Frozen-Reaches-era form of Firebolt, taught only to Evocation adepts who have proven the first five ranks. Requires Firebolt V and Evocation 40.'
  },
  {
    id: 'tech_mend_wounds_6',
    name: 'Mend Wounds VI',
    chain: 'Mend Wounds',
    rank: 6,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 40,
    power: 136,
    effect: 'heal',
    trainingCost: 10,
    skillReq: 40,
    desc: 'A Frozen-Reaches-era working of Light-grade Anima, mending wounds no earlier rank could close. Requires Mend Wounds V and Abjuration 40. Unaffected by Fear (Fear.md).'
  },
  {
    id: 'tech_cleave_6',
    name: 'Cleave VI',
    chain: 'Cleave',
    rank: 6,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 1.76, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 3.2 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 1.76 (was invented 3.2).
    energyCost: 34,
    effect: 'damage',
    trainingCost: 10,
    skillReq: 40,
    desc: 'The Frozen-Reaches-era form of Cleave, taught only once a swordsman has proven the first five ranks. Requires Cleave V and Swords 40.'
  },
  {
    id: 'tech_impale_6',
    name: 'Impale VI',
    chain: 'Impale',
    rank: 6,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 1.71, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 3.1 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 1.705 -> 1.71 (was invented 3.1).
    armorPierce: 0.35, // invented (user-directed)
    energyCost: 34,
    effect: 'damage',
    trainingCost: 10,
    skillReq: 40,
    desc: 'The Frozen-Reaches-era form of Impale, taught only once a polearm-wielder has proven the first five ranks. Requires Impale V and Polearms 40.'
  },

  // =====================================================================
  // Level-Arc Band D (docs/SPEC-ARC-BANDS.md, F2/F3): one further rank into the same two magic-
  // school chains and two weapon-tech chains Bands A/B/C extended, gated by skill level per the
  // existing Academy chain model (js/core/world.js previousRankId/canLearn — rank>1 requires the
  // previous rank known AND the governing skill >= skillReq). skillReq 50 is comfortably inside a
  // level 71+ character's skill cap (BALANCE.SKILL_CAP(71) = 143) for anyone who has actually
  // trained the skill. Numeric progressions (power/powerMult/energyCost/trainingCost) continue
  // each chain's existing rank-to-rank deltas (e.g. Firebolt's power deltas 16/18/18 -> +20 here).
  // =====================================================================
  {
    id: 'tech_firebolt_7',
    name: 'Firebolt VII',
    chain: 'Firebolt',
    rank: 7,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 48,
    power: 62, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 112 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 61.6 -> 62.
    effect: 'damage',
    trainingCost: 12,
    skillReq: 50,
    desc: 'The Estari-Wellspring-era form of Firebolt, taught only to Evocation adepts who have proven the first six ranks. Requires Firebolt VI and Evocation 50.'
  },
  {
    id: 'tech_mend_wounds_7',
    name: 'Mend Wounds VII',
    chain: 'Mend Wounds',
    rank: 7,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 46,
    power: 162,
    effect: 'heal',
    trainingCost: 12,
    skillReq: 50,
    desc: 'An Estari-Wellspring-era working of Light-grade Anima, mending wounds no earlier rank could close. Requires Mend Wounds VI and Abjuration 50. Unaffected by Fear (Fear.md).'
  },
  {
    id: 'tech_cleave_7',
    name: 'Cleave VII',
    chain: 'Cleave',
    rank: 7,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 1.93, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 3.5 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 1.925 -> 1.93 (was invented 3.5).
    energyCost: 38,
    effect: 'damage',
    trainingCost: 12,
    skillReq: 50,
    desc: 'The Estari-Wellspring-era form of Cleave, taught only once a swordsman has proven the first six ranks. Requires Cleave VI and Swords 50.'
  },
  {
    id: 'tech_impale_7',
    name: 'Impale VII',
    chain: 'Impale',
    rank: 7,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 1.87, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 3.4 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 1.87 (was invented 3.4).
    armorPierce: 0.35, // invented (user-directed)
    energyCost: 38,
    effect: 'damage',
    trainingCost: 12,
    skillReq: 50,
    desc: 'The Estari-Wellspring-era form of Impale, taught only once a polearm-wielder has proven the first six ranks. Requires Impale VI and Polearms 50.'
  },

  // =====================================================================
  // Level-Arc Band E (docs/SPEC-ARC-BANDS.md, F2/F3): one further rank into the same two magic-
  // school chains and two weapon-tech chains Bands A/B/C/D extended, gated by skill level per the
  // existing Academy chain model (js/core/world.js previousRankId/canLearn — rank>1 requires the
  // previous rank known AND the governing skill >= skillReq). skillReq 60 is comfortably inside a
  // level 81+ character's skill cap (BALANCE.SKILL_CAP(81) = 163) for anyone who has actually
  // trained the skill. Numeric progressions (power/powerMult/energyCost/trainingCost) continue
  // each chain's existing rank-to-rank deltas (e.g. Firebolt's power deltas 18/18/20 -> +20 here).
  // =====================================================================
  {
    id: 'tech_firebolt_8',
    name: 'Firebolt VIII',
    chain: 'Firebolt',
    rank: 8,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 54,
    power: 73, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 132 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 72.6 -> 73.
    effect: 'damage',
    trainingCost: 14,
    skillReq: 60,
    desc: 'The Skyspire-era form of Firebolt, taught only to Evocation adepts who have proven the first seven ranks. Requires Firebolt VII and Evocation 60.'
  },
  {
    id: 'tech_mend_wounds_8',
    name: 'Mend Wounds VIII',
    chain: 'Mend Wounds',
    rank: 8,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 52,
    power: 188,
    effect: 'heal',
    trainingCost: 14,
    skillReq: 60,
    desc: 'A Skyspire-era working of Light-grade Anima, mending wounds no earlier rank could close. Requires Mend Wounds VII and Abjuration 60. Unaffected by Fear (Fear.md).'
  },
  {
    id: 'tech_cleave_8',
    name: 'Cleave VIII',
    chain: 'Cleave',
    rank: 8,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 2.09, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 3.8 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 2.09 (was invented 3.8).
    energyCost: 42,
    effect: 'damage',
    trainingCost: 14,
    skillReq: 60,
    desc: 'The Skyspire-era form of Cleave, taught only once a swordsman has proven the first seven ranks. Requires Cleave VII and Swords 60.'
  },
  {
    id: 'tech_impale_8',
    name: 'Impale VIII',
    chain: 'Impale',
    rank: 8,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 2.04, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 3.7 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 2.035 -> 2.04 (was invented 3.7).
    armorPierce: 0.35, // invented (user-directed)
    energyCost: 42,
    effect: 'damage',
    trainingCost: 14,
    skillReq: 60,
    desc: 'The Skyspire-era form of Impale, taught only once a polearm-wielder has proven the first seven ranks. Requires Impale VII and Polearms 60.'
  },

  // =====================================================================
  // Level-Arc Band F (docs/SPEC-ARC-BANDS.md, F2/F3): THE ARC FINALE. One further rank into the
  // same two magic-school chains and two weapon-tech chains Bands A-E extended, gated by skill
  // level per the existing Academy chain model (js/core/world.js previousRankId/canLearn —
  // rank>1 requires the previous rank known AND the governing skill >= skillReq). skillReq 70 is
  // comfortably inside a level 91+ character's skill cap (BALANCE.SKILL_CAP(91) = 183) for anyone
  // who has actually trained the skill. Numeric progressions (power/powerMult/energyCost/
  // trainingCost) continue each chain's existing rank-to-rank deltas (e.g. Firebolt's power
  // deltas 20/20/20 -> +20 here) — these are the top-tier player techs in the game.
  // =====================================================================
  {
    id: 'tech_firebolt_9',
    name: 'Firebolt IX',
    chain: 'Firebolt',
    rank: 9,
    skill: 'Evocation',
    grade: 'Fire',
    energyCost: 60,
    power: 84, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 152 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 83.6 -> 84.
    effect: 'damage',
    trainingCost: 16,
    skillReq: 70,
    desc: 'The Red-Moon-era form of Firebolt, the highest rank ever taught — reserved for Evocation adepts who have proven the first eight ranks. Requires Firebolt VIII and Evocation 70.'
  },
  {
    id: 'tech_mend_wounds_9',
    name: 'Mend Wounds IX',
    chain: 'Mend Wounds',
    rank: 9,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 58,
    power: 214,
    effect: 'heal',
    trainingCost: 16,
    skillReq: 70,
    desc: 'A Red-Moon-era working of Light-grade Anima, the highest rank ever taught, mending wounds no earlier rank could close. Requires Mend Wounds VIII and Abjuration 70. Unaffected by Fear (Fear.md).'
  },
  {
    id: 'tech_cleave_9',
    name: 'Cleave IX',
    chain: 'Cleave',
    rank: 9,
    skill: 'Swords',
    grade: null,
    weaponTech: true,
    powerMult: 2.26, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 4.1 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 2.255 -> 2.26 (was invented 4.1).
    energyCost: 46,
    effect: 'damage',
    trainingCost: 16,
    skillReq: 70,
    desc: 'The Red-Moon-era form of Cleave, the highest rank ever taught — reserved for swordsmen who have proven the first eight ranks. Requires Cleave VIII and Swords 70.'
  },
  {
    id: 'tech_impale_9',
    name: 'Impale IX',
    chain: 'Impale',
    rank: 9,
    skill: 'Polearms',
    grade: null,
    weaponTech: true,
    powerMult: 2.2, // ARMOR-STACK CORRECTION companion tap (re-sim finding, js/balance.js F1 CONVENTION NOTES): 4.0 * 0.55 (OFFENSE_TECH_TAPER, ranks 6-9 only) = 2.2 (was invented 4.0).
    armorPierce: 0.35, // invented (user-directed)
    energyCost: 46,
    effect: 'damage',
    trainingCost: 16,
    skillReq: 70,
    desc: 'The Red-Moon-era form of Impale, the highest rank ever taught — reserved for polearm-wielders who have proven the first eight ranks. Requires Impale VIII and Polearms 70.'
  },

  // =====================================================================
  // Level-Arc Band F monster-only techniques. mon_radiant_smite is a Light-grade signature strike
  // for Eidas's "divine race" servitors (divine_race_initiate/divine_race_exemplar,
  // js/data/monsters.js) — no prior mon_* tech carried the Light grade. mon_red_moons_judgment is
  // eidas_ascendant's OWN signature strike (js/data/monsters.js): unlike every other mon_* tech,
  // which is shared flavor used across the whole 1-100 level range and so caps its power around
  // 26 (it can't scale to any one boss), this one is used ONLY by the arc's final boss, so its
  // power is deliberately close to that boss's own premiumed basic-attack damage — the "signature
  // high-damage tech" the Band F brief (docs/SPEC-ARC-BANDS.md) calls for, making the finale
  // costlier without inflating the shared boss damage-premium formula every other Level-Arc boss
  // was tuned against.
  // =====================================================================
  {
    id: 'mon_radiant_smite',
    name: 'Radiant Smite',
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Light',
    energyCost: 18,
    power: 24,
    effect: 'damage',
    monsterOnly: true,
    desc: "A blinding lance of Light-grade Anima, the signature strike of Eidas's divine-race servitors."
  },
  {
    id: 'mon_red_moons_judgment',
    name: "Red Moon's Judgment",
    chain: null,
    rank: 1,
    skill: null,
    grade: 'Star',
    energyCost: 70,
    power: 240,
    effect: 'damage',
    monsterOnly: true,
    desc: "Eidas's own working, a devastating lance of Star-grade Anima drawn straight from the red moon itself — used by nothing else in Exos."
  },

  // =====================================================================
  // v1.8 P3 (docs/SPEC-TECH-POLARITY.md §2.1-2.3; constants P0-locked §0, 2026-07-19 sim gate):
  // 18 new chains x 4 ranks = 72 techs, one additional chain per archived skill
  // [archived: reference/manual/Skills.md] -- the missing damage/buff/debuff polarity for the
  // 9 skills that already had techs, and a from-scratch chain for the 9 skills that had none.
  // Rank spacing is looser than the shipped 9-rank chains (skillReq 0(+-4)/10/25/45, request
  // explicitly permits this) and Band-A/B precedent (group per chain, APPEND only, never touch
  // existing entries). Locked engine field names per js/core/battle.js v1.8 P1 comments:
  // statKind ('armor'|'dodge'|'double_attack'|'spellpower'), debuffKind ('armor'|'damage'|
  // 'bleed'), buffDuration/debuffDuration, weaponDebuff, physicalRoll, requiresShield,
  // requiresOffhandWeapon, requiresArmorClass, offhandFollowup, goldSteal. Every chain below
  // carries the P0-locked retunes verbatim (buffDuration 5, Battle Harness 6; Attunement
  // 12/24/40/60; Stoneshear/Censure energy retuned; Cutpurse goldSteal 1/3/5/8; Shield
  // Bash/Cutpurse physicalRoll) -- these WIN over the earlier §2.1-2.3 table drafts, which the
  // spec itself documents as superseded by the P0 sim gate.
  // =====================================================================

  // ---------- Swords: Sunder Guard (debuff, armor) [invented] (SPEC-TECH-POLARITY.md §2.1) ----------
  {
    id: 'tech_sunder_guard_1',
    name: 'Sunder Guard I',
    chain: 'Sunder Guard',
    rank: 1,
    skill: 'Swords',
    grade: null,
    energyCost: 12,
    power: 3,
    debuffKind: 'armor',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 2,
    skillReq: 0,
    desc: "A precise slash that tests the enemy's guard, opening cracks in their armor. The most basic Swords technique taught at any Academy."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_sunder_guard_2',
    name: 'Sunder Guard II',
    chain: 'Sunder Guard',
    rank: 2,
    skill: 'Swords',
    grade: null,
    energyCost: 16,
    power: 6,
    debuffKind: 'armor',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A deliberate riposte that deepens the fissures, progressively unraveling the foe\'s defensive layers.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_sunder_guard_3',
    name: 'Sunder Guard III',
    chain: 'Sunder Guard',
    rank: 3,
    skill: 'Swords',
    grade: null,
    energyCost: 22,
    power: 10,
    debuffKind: 'armor',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 6,
    skillReq: 25,
    desc: "A masterful counter-cut that shatters the enemy's guard with surgical precision, leaving them vulnerable to follow-up strikes."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_sunder_guard_4',
    name: 'Sunder Guard IV',
    chain: 'Sunder Guard',
    rank: 4,
    skill: 'Swords',
    grade: null,
    energyCost: 28,
    power: 16,
    debuffKind: 'armor',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 8,
    skillReq: 45,
    desc: "An elite technique that strips away armor and resolve in one devastating thrust, taught only to the Academy's most accomplished swordsmen."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)

  // ---------- Polearms: Crippling Thrust (debuff, damage) [invented] (SPEC-TECH-POLARITY.md §2.1) ----------
  {
    id: 'tech_crippling_thrust_1',
    name: 'Crippling Thrust I',
    chain: 'Crippling Thrust',
    rank: 1,
    skill: 'Polearms',
    grade: null,
    energyCost: 12,
    power: 4,
    debuffKind: 'damage',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A driving spear-thrust that keeps the enemy at distance, forcing them to expend effort to close the gap. The most basic Polearms technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_crippling_thrust_2',
    name: 'Crippling Thrust II',
    chain: 'Crippling Thrust',
    rank: 2,
    skill: 'Polearms',
    grade: null,
    energyCost: 16,
    power: 8,
    debuffKind: 'damage',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 4,
    skillReq: 10,
    desc: "A measured thrust that disrupts the foe's stance, weakening their ability to mount a coordinated offense."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_crippling_thrust_3',
    name: 'Crippling Thrust III',
    chain: 'Crippling Thrust',
    rank: 3,
    skill: 'Polearms',
    grade: null,
    energyCost: 22,
    power: 14,
    debuffKind: 'damage',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 6,
    skillReq: 25,
    desc: 'A disciplined feint followed by a full extension that leaves the enemy off-balance and struggling to regain their rhythm.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_crippling_thrust_4',
    name: 'Crippling Thrust IV',
    chain: 'Crippling Thrust',
    rank: 4,
    skill: 'Polearms',
    grade: null,
    energyCost: 28,
    power: 22,
    debuffKind: 'damage',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 8,
    skillReq: 45,
    desc: "An expert polearm technique that neutralizes the foe's offensive potential, leaving them unable to mount more than token resistance."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)

  // ---------- Knives: Grave Wound (debuff, bleed) [invented] (SPEC-TECH-POLARITY.md §2.1) ----------
  {
    id: 'tech_grave_wound_1',
    name: 'Grave Wound I',
    chain: 'Grave Wound',
    rank: 1,
    skill: 'Knives',
    grade: null,
    energyCost: 10,
    power: 5,
    debuffKind: 'bleed',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A quick, shallow slash that opens a bleeding wound. The most basic Knives technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_grave_wound_2',
    name: 'Grave Wound II',
    chain: 'Grave Wound',
    rank: 2,
    skill: 'Knives',
    grade: null,
    energyCost: 14,
    power: 10,
    debuffKind: 'bleed',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 4,
    skillReq: 10,
    desc: "A deeper cut that prolongs the bleeding, each turn draining the foe of strength as the wound refuses to close."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_grave_wound_3',
    name: 'Grave Wound III',
    chain: 'Grave Wound',
    rank: 3,
    skill: 'Knives',
    grade: null,
    energyCost: 20,
    power: 16,
    debuffKind: 'bleed',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 6,
    skillReq: 25,
    desc: "A vicious laceration that severs deeper tissues, causing severe bleeding that saps the enemy's vitality turn after turn."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_grave_wound_4',
    name: 'Grave Wound IV',
    chain: 'Grave Wound',
    rank: 4,
    skill: 'Knives',
    grade: null,
    energyCost: 26,
    power: 24,
    debuffKind: 'bleed',
    weaponDebuff: true,
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 8,
    skillReq: 45,
    desc: "An assassin's masterwork: a precise strike that opens arterial bleeding, leaving the enemy weakened and desperate as they hemorrhage."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)

  // ---------- Hand to Hand: Steel Resolve (buff, armor) [invented] (SPEC-TECH-POLARITY.md §2.1) ----------
  {
    id: 'tech_steel_resolve_1',
    name: 'Steel Resolve I',
    chain: 'Steel Resolve',
    rank: 1,
    skill: 'Hand to Hand',
    grade: null,
    energyCost: 10,
    power: 6,
    statKind: 'armor',
    buffDuration: 5, // P0-locked retune 3->5 (§0 finding 1): a whole-action buff at 3 turns starved action economy
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A short breathing technique that stiffens the body, raising Armor through disciplined focus. The most basic Hand to Hand technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_steel_resolve_2',
    name: 'Steel Resolve II',
    chain: 'Steel Resolve',
    rank: 2,
    skill: 'Hand to Hand',
    grade: null,
    energyCost: 16,
    power: 12,
    statKind: 'armor',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A deeper meditative stance that hardens flesh and sinew, significantly bolstering the caster\'s defensive resilience.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_steel_resolve_3',
    name: 'Steel Resolve III',
    chain: 'Steel Resolve',
    rank: 3,
    skill: 'Hand to Hand',
    grade: null,
    energyCost: 22,
    power: 20,
    statKind: 'armor',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 6,
    skillReq: 25,
    desc: "An advanced martial posture that channels inner strength into an impenetrable guard, the body becoming nearly as unyielding as stone."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)
  {
    id: 'tech_steel_resolve_4',
    name: 'Steel Resolve IV',
    chain: 'Steel Resolve',
    rank: 4,
    skill: 'Hand to Hand',
    grade: null,
    energyCost: 28,
    power: 30,
    statKind: 'armor',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 8,
    skillReq: 45,
    desc: "The pinnacle of martial discipline: a transcendent state where the caster's Armor becomes formidable, their entire being hardened against incoming blows."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.1; constants P0-locked §0)

  // ---------- Evocation: Attunement (buff, spellpower) [invented] (SPEC-TECH-POLARITY.md §2.2) ----------
  {
    id: 'tech_attunement_1',
    name: 'Attunement I',
    chain: 'Attunement',
    rank: 1,
    skill: 'Evocation',
    grade: null,
    energyCost: 10,
    power: 12, // P0-locked retune 6->12 (§0 finding 2): at spec power the wind-up was parity-at-best with recasting Firebolt
    statKind: 'spellpower',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'Draws a slow ember of Anima into the palm, banking it for the next strike. The most basic Evocation technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_attunement_2',
    name: 'Attunement II',
    chain: 'Attunement',
    rank: 2,
    skill: 'Evocation',
    grade: null,
    energyCost: 16,
    power: 24, // P0-locked retune 12->24 (§0 finding 2)
    statKind: 'spellpower',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'Holds the gathered ember a beat longer, banking more heat before it is spent.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_attunement_3',
    name: 'Attunement III',
    chain: 'Attunement',
    rank: 3,
    skill: 'Evocation',
    grade: null,
    energyCost: 22,
    power: 40, // P0-locked retune 20->40 (§0 finding 2)
    statKind: 'spellpower',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 6,
    skillReq: 25,
    desc: 'Kindles a deep well of Anima, banked and ready to feed the next several spells cast.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_attunement_4',
    name: 'Attunement IV',
    chain: 'Attunement',
    rank: 4,
    skill: 'Evocation',
    grade: null,
    energyCost: 28,
    power: 60, // P0-locked retune 30->60 (§0 finding 2)
    statKind: 'spellpower',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Gathers Anima until it strains against the skin, promising a far harder-hitting spell to follow.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)

  // ---------- Conjuration: Curse (debuff, damage) -- name [archived: reference/manual/Version_2.1_Changes.md]
  // ("Added new detrimental effects (Poison, Haunting, Curse)"), mechanics [invented] (SPEC-TECH-POLARITY.md
  // §2.2; distinct from the existing player-afflicting Curse STATUS, tech_mend_wounds_2) ----------
  {
    id: 'tech_curse_1',
    name: 'Curse I',
    chain: 'Curse',
    rank: 1,
    skill: 'Conjuration',
    grade: 'Dark',
    energyCost: 13,
    power: 4,
    debuffKind: 'damage',
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 3,
    skillReq: 4,
    desc: 'Binds a flickering wisp of Dark-grade Anima to the enemy, its constant harrying dulling their strikes. The most basic Conjuration technique taught at any Academy.'
  }, // name [archived: reference/manual/Version_2.1_Changes.md]; mechanics [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_curse_2',
    name: 'Curse II',
    chain: 'Curse',
    rank: 2,
    skill: 'Conjuration',
    grade: 'Dark',
    energyCost: 18,
    power: 8,
    debuffKind: 'damage',
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A hungrier wisp clings tighter, sapping more strength from every blow the enemy lands.'
  }, // name [archived: reference/manual/Version_2.1_Changes.md]; mechanics [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_curse_3',
    name: 'Curse III',
    chain: 'Curse',
    rank: 3,
    skill: 'Conjuration',
    grade: 'Dark',
    energyCost: 24,
    power: 14,
    debuffKind: 'damage',
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 6,
    skillReq: 25,
    desc: 'A small conjured swarm harries the enemy from every side, wearing their guard to nothing.'
  }, // name [archived: reference/manual/Version_2.1_Changes.md]; mechanics [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_curse_4',
    name: 'Curse IV',
    chain: 'Curse',
    rank: 4,
    skill: 'Conjuration',
    grade: 'Dark',
    energyCost: 30,
    power: 22,
    debuffKind: 'damage',
    debuffDuration: 3,
    effect: 'debuff',
    trainingCost: 8,
    skillReq: 45,
    desc: "A gloom-wrought familiar shadows the enemy's every motion, sapping their strikes to almost nothing for as long as it clings."
  }, // name [archived: reference/manual/Version_2.1_Changes.md]; mechanics [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)

  // ---------- Alteration: Stoneshear (damage, Earth) [invented] (SPEC-TECH-POLARITY.md §2.2) ----------
  {
    id: 'tech_stoneshear_1',
    name: 'Stoneshear I',
    chain: 'Stoneshear',
    rank: 1,
    skill: 'Alteration',
    grade: 'Earth',
    energyCost: 12,
    power: 14,
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: 'Wrenches a shard of raw stone from the ground and hurls it with transmuted force. The most basic Alteration technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_stoneshear_2',
    name: 'Stoneshear II',
    chain: 'Stoneshear',
    rank: 2,
    skill: 'Alteration',
    grade: 'Earth',
    energyCost: 18,
    power: 26,
    effect: 'damage',
    trainingCost: 4,
    skillReq: 10,
    desc: 'Fuses several shards into a single jagged spear before releasing it at the enemy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_stoneshear_3',
    name: 'Stoneshear III',
    chain: 'Stoneshear',
    rank: 3,
    skill: 'Alteration',
    grade: 'Earth',
    energyCost: 28, // P0-locked retune 24->28 (§0 finding 3): at spec cost this undercut the shipped tapered Firebolt band
    power: 40,
    effect: 'damage',
    trainingCost: 6,
    skillReq: 25,
    desc: 'Transmutes a slab of bedrock into a screaming volley in a single motion.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_stoneshear_4',
    name: 'Stoneshear IV',
    chain: 'Stoneshear',
    rank: 4,
    skill: 'Alteration',
    grade: 'Earth',
    energyCost: 38, // P0-locked retune 30->38 (§0 finding 3)
    power: 56,
    effect: 'damage',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Rips a column of living rock from the earth and drives it through the enemy whole.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)

  // ---------- Absorption: Nullward (buff, armor, Dark) [invented] (SPEC-TECH-POLARITY.md §2.2) ----------
  {
    id: 'tech_nullward_1',
    name: 'Nullward I',
    chain: 'Nullward',
    rank: 1,
    skill: 'Absorption',
    grade: 'Dark',
    energyCost: 12,
    power: 6,
    statKind: 'armor',
    buffDuration: 5, // P0-locked retune 3->5 (§0 finding 1)
    effect: 'buff',
    trainingCost: 3,
    skillReq: 4,
    desc: 'Wraps the caster in a skin of hungry Dark-grade Anima that annuls part of each blow it meets. The most basic Absorption technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_nullward_2',
    name: 'Nullward II',
    chain: 'Nullward',
    rank: 2,
    skill: 'Absorption',
    grade: 'Dark',
    energyCost: 17,
    power: 12,
    statKind: 'armor',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A deeper skein of hungry Anima, annulling more force from every blow it swallows.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_nullward_3',
    name: 'Nullward III',
    chain: 'Nullward',
    rank: 3,
    skill: 'Absorption',
    grade: 'Dark',
    energyCost: 23,
    power: 20,
    statKind: 'armor',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 6,
    skillReq: 25,
    desc: 'A greedy shroud of Dark-grade Anima that drinks incoming force nearly whole.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_nullward_4',
    name: 'Nullward IV',
    chain: 'Nullward',
    rank: 4,
    skill: 'Absorption',
    grade: 'Dark',
    energyCost: 29,
    power: 30,
    statKind: 'armor',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 8,
    skillReq: 45,
    desc: 'A near-impenetrable veil of starving Anima, annulling almost everything thrown against it.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)

  // ---------- Abjuration: Censure (damage, Light) [invented] (SPEC-TECH-POLARITY.md §2.2) ----------
  {
    id: 'tech_censure_1',
    name: 'Censure I',
    chain: 'Censure',
    rank: 1,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 13,
    power: 14,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 4,
    desc: 'Turns a sliver of Light-grade Anima outward as a censuring lance, condemning the enemy in the same breath the Academy teaches to heal. The most basic Abjuration technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_censure_2',
    name: 'Censure II',
    chain: 'Censure',
    rank: 2,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 19,
    power: 26,
    effect: 'damage',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A harsher censure — the same Light-grade Anima that mends wounds, turned instead to punish them.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_censure_3',
    name: 'Censure III',
    chain: 'Censure',
    rank: 3,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 29, // P0-locked retune 25->29 (§0 finding 3)
    power: 40,
    effect: 'damage',
    trainingCost: 6,
    skillReq: 25,
    desc: 'A judgment cast in unflinching Light, striking with the same certainty as the deepest Mend Wounds.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)
  {
    id: 'tech_censure_4',
    name: 'Censure IV',
    chain: 'Censure',
    rank: 4,
    skill: 'Abjuration',
    grade: 'Light',
    energyCost: 39, // P0-locked retune 31->39 (§0 finding 3)
    power: 56,
    effect: 'damage',
    trainingCost: 8,
    skillReq: 45,
    desc: "A blinding censure of Light-grade Anima, condemning the enemy with the full weight of the Academy's sanctified teaching."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.2; constants P0-locked §0)

  // ---------- Light Armor: Fleetstep (buff, dodge) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_fleetstep_1',
    name: 'Fleetstep I',
    chain: 'Fleetstep',
    rank: 1,
    skill: 'Light Armor',
    grade: null,
    energyCost: 10,
    power: 0.04,
    statKind: 'dodge',
    buffDuration: 5, // P0-locked retune 3->5 (§0 finding 1)
    requiresArmorClass: 'light',
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'Shrugs the weight off a leather cuirass and settles into a lighter stance, adding to Dodge for a few turns. The most basic Light Armor technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_fleetstep_2',
    name: 'Fleetstep II',
    chain: 'Fleetstep',
    rank: 2,
    skill: 'Light Armor',
    grade: null,
    energyCost: 15,
    power: 0.06,
    statKind: 'dodge',
    buffDuration: 5,
    requiresArmorClass: 'light',
    effect: 'buff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A surer feel for how far unburdened leather and cloth will let a body twist and turn before an incoming blow.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_fleetstep_3',
    name: 'Fleetstep III',
    chain: 'Fleetstep',
    rank: 3,
    skill: 'Light Armor',
    grade: null,
    energyCost: 20,
    power: 0.09,
    statKind: 'dodge',
    buffDuration: 5,
    requiresArmorClass: 'light',
    effect: 'buff',
    trainingCost: 6,
    skillReq: 25,
    desc: 'The wearer moves as if the armor were a second skin, slipping strikes that would stagger a heavier fighter.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_fleetstep_4',
    name: 'Fleetstep IV',
    chain: 'Fleetstep',
    rank: 4,
    skill: 'Light Armor',
    grade: null,
    energyCost: 26,
    power: 0.12,
    statKind: 'dodge',
    buffDuration: 5,
    requiresArmorClass: 'light',
    effect: 'buff',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Mastery of light armor turns evasion into a weapon in itself — a fighter who is never quite where the blow expects.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // ---------- Medium Armor: Battle Harness (buff, armor) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_battle_harness_1',
    name: 'Battle Harness I',
    chain: 'Battle Harness',
    rank: 1,
    skill: 'Medium Armor',
    grade: null,
    energyCost: 11,
    power: 6,
    statKind: 'armor',
    buffDuration: 6, // P0-locked exception (§0 finding 1): Battle Harness is 6, not 5, per the locked-constants list
    requiresArmorClass: 'medium',
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'Cinches the harness and straps tight mid-fight, adding to Armor for a few turns. The most basic Medium Armor technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_battle_harness_2',
    name: 'Battle Harness II',
    chain: 'Battle Harness',
    rank: 2,
    skill: 'Medium Armor',
    grade: null,
    energyCost: 16,
    power: 12,
    statKind: 'armor',
    buffDuration: 6,
    requiresArmorClass: 'medium',
    effect: 'buff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'Braces the straps and plates as one unit, turning a glancing hit into a shrugged-off one.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_battle_harness_3',
    name: 'Battle Harness III',
    chain: 'Battle Harness',
    rank: 3,
    skill: 'Medium Armor',
    grade: null,
    energyCost: 22,
    power: 20,
    statKind: 'armor',
    buffDuration: 6,
    requiresArmorClass: 'medium',
    effect: 'buff',
    trainingCost: 6,
    skillReq: 25,
    desc: "The wearer reads an incoming blow's angle and rolls the reinforced hide to meet it squarely."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_battle_harness_4',
    name: 'Battle Harness IV',
    chain: 'Battle Harness',
    rank: 4,
    skill: 'Medium Armor',
    grade: null,
    energyCost: 28,
    power: 30,
    statKind: 'armor',
    buffDuration: 6,
    requiresArmorClass: 'medium',
    effect: 'buff',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Mastery of the harness and plate hybrid, holding a line no lighter fighter could and no heavier one could match for speed.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // ---------- Heavy Armor: Ironroot Stance (buff, armor) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_ironroot_stance_1',
    name: 'Ironroot Stance I',
    chain: 'Ironroot Stance',
    rank: 1,
    skill: 'Heavy Armor',
    grade: null,
    energyCost: 13,
    power: 9,
    statKind: 'armor',
    buffDuration: 5, // P0-locked retune 3->5 (§0 finding 1)
    requiresArmorClass: 'heavy',
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: 'Sets the plate and locks the stance, adding to Armor for a few turns. The most basic Heavy Armor technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_ironroot_stance_2',
    name: 'Ironroot Stance II',
    chain: 'Ironroot Stance',
    rank: 2,
    skill: 'Heavy Armor',
    grade: null,
    energyCost: 19,
    power: 16,
    statKind: 'armor',
    buffDuration: 5,
    requiresArmorClass: 'heavy',
    effect: 'buff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'Turns the full weight of plate into a wall, angling it to shed a blow rather than absorb it whole.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_ironroot_stance_3',
    name: 'Ironroot Stance III',
    chain: 'Ironroot Stance',
    rank: 3,
    skill: 'Heavy Armor',
    grade: null,
    energyCost: 25,
    power: 26,
    statKind: 'armor',
    buffDuration: 5,
    requiresArmorClass: 'heavy',
    effect: 'buff',
    trainingCost: 6,
    skillReq: 25,
    desc: 'An immovable stance, plate locked joint to joint, that no ordinary strike can shift.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_ironroot_stance_4',
    name: 'Ironroot Stance IV',
    chain: 'Ironroot Stance',
    rank: 4,
    skill: 'Heavy Armor',
    grade: null,
    energyCost: 32,
    power: 38,
    statKind: 'armor',
    buffDuration: 5,
    requiresArmorClass: 'heavy',
    effect: 'buff',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Mastery of heavy plate: a fighter who simply refuses to be moved, let alone felled.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // ---------- Shields: Shield Bash (damage) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_shield_bash_1',
    name: 'Shield Bash I',
    chain: 'Shield Bash',
    rank: 1,
    skill: 'Shields',
    grade: null,
    energyCost: 12,
    power: 12,
    requiresShield: true,
    physicalRoll: true, // P0-locked retune (§0 finding 5): flat damage on a non-Int chassis rolls monster dodge, not the Int spell-hit
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: 'Slams the shield\'s rim into the enemy like a blunt weapon. The most basic Shields technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_shield_bash_2',
    name: 'Shield Bash II',
    chain: 'Shield Bash',
    rank: 2,
    skill: 'Shields',
    grade: null,
    energyCost: 16,
    power: 22,
    requiresShield: true,
    physicalRoll: true,
    effect: 'damage',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A full-body check with the shield face, driving the rim into ribs or skull.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_shield_bash_3',
    name: 'Shield Bash III',
    chain: 'Shield Bash',
    rank: 3,
    skill: 'Shields',
    grade: null,
    energyCost: 22,
    power: 34,
    requiresShield: true,
    physicalRoll: true,
    effect: 'damage',
    trainingCost: 6,
    skillReq: 25,
    desc: "Turns a raised guard into a sudden charge, the shield's edge leading."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_shield_bash_4',
    name: 'Shield Bash IV',
    chain: 'Shield Bash',
    rank: 4,
    skill: 'Shields',
    grade: null,
    energyCost: 28,
    power: 48,
    requiresShield: true,
    physicalRoll: true,
    effect: 'damage',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Mastery of the shield as a weapon: a single blow that can drop an opponent as surely as any blade.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // ---------- Rods: Channeled Strike (weapon damage) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_channeled_strike_1',
    name: 'Channeled Strike I',
    chain: 'Channeled Strike',
    rank: 1,
    skill: 'Rods',
    grade: null,
    energyCost: 12,
    weaponTech: true,
    powerMult: 1.3,
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: "A short, snapping strike with the rod's haft, the caster's cudgel. The most basic Rods technique taught at any Academy."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_channeled_strike_2',
    name: 'Channeled Strike II',
    chain: 'Channeled Strike',
    rank: 2,
    skill: 'Rods',
    grade: null,
    energyCost: 16,
    weaponTech: true,
    powerMult: 1.7,
    effect: 'damage',
    trainingCost: 4,
    skillReq: 10,
    desc: 'Channels a crack of will through the rod on impact, hardening the wood or rune-etched core against the swing itself.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_channeled_strike_3',
    name: 'Channeled Strike III',
    chain: 'Channeled Strike',
    rank: 3,
    skill: 'Rods',
    grade: null,
    energyCost: 22,
    weaponTech: true,
    powerMult: 2.0,
    effect: 'damage',
    trainingCost: 6,
    skillReq: 25,
    desc: 'A full two-handed swing that treats the rod as cudgel first, focus second.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_channeled_strike_4',
    name: 'Channeled Strike IV',
    chain: 'Channeled Strike',
    rank: 4,
    skill: 'Rods',
    grade: null,
    energyCost: 26,
    weaponTech: true,
    powerMult: 2.3, // D4 primary lock (SPEC-TECH-POLARITY.md §0/§2.3): rod melee stays slower than Cleave, the v1.6 halving holds
    effect: 'damage',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Mastery of the rod as a melee weapon: every swing lands with the full weight of the caster\'s training behind it.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // ---------- Dodge: Sidestep (buff, dodge) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_sidestep_1',
    name: 'Sidestep I',
    chain: 'Sidestep',
    rank: 1,
    skill: 'Dodge',
    grade: null,
    energyCost: 10,
    power: 0.05,
    statKind: 'dodge',
    buffDuration: 5, // P0-locked retune 3->5 (§0 finding 1)
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: "Reads the first beat of the enemy's rhythm and steps just wide of it, adding to Dodge for a few turns. The most basic Dodge technique taught at any Academy."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_sidestep_2',
    name: 'Sidestep II',
    chain: 'Sidestep',
    rank: 2,
    skill: 'Dodge',
    grade: null,
    energyCost: 15,
    power: 0.08,
    statKind: 'dodge',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A trained eye for the half-second before a swing commits, enough to slip clear of it.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_sidestep_3',
    name: 'Sidestep III',
    chain: 'Sidestep',
    rank: 3,
    skill: 'Dodge',
    grade: null,
    energyCost: 21,
    power: 0.12,
    statKind: 'dodge',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 6,
    skillReq: 25,
    desc: "The body moves before the mind finishes deciding to — pure reflex built from countless close calls."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_sidestep_4',
    name: 'Sidestep IV',
    chain: 'Sidestep',
    rank: 4,
    skill: 'Dodge',
    grade: null,
    energyCost: 27,
    power: 0.16,
    statKind: 'dodge',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 8,
    skillReq: 45,
    desc: "Mastery of Dodge: for a few turns, the enemy's rhythm holds no surprises left."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // ---------- Thievery: Cutpurse Strike (damage + gold) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_cutpurse_strike_1',
    name: 'Cutpurse Strike I',
    chain: 'Cutpurse Strike',
    rank: 1,
    skill: 'Thievery',
    grade: null,
    energyCost: 11,
    power: 10,
    physicalRoll: true, // P0-locked retune (§0 finding 5): flat damage on a non-Int chassis rolls monster dodge
    goldSteal: 1, // P0-locked retune 3->1 (§0 finding 4): spec values were +35-86%/kill vs the Thievery passive cap
    effect: 'damage',
    trainingCost: 2,
    skillReq: 0,
    desc: 'A dirty, opportunistic strike that lifts a coin purse in the same motion. The most basic Thievery technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_cutpurse_strike_2',
    name: 'Cutpurse Strike II',
    chain: 'Cutpurse Strike',
    rank: 2,
    skill: 'Thievery',
    grade: null,
    energyCost: 15,
    power: 18,
    physicalRoll: true,
    goldSteal: 3, // P0-locked retune 6->3 (§0 finding 4)
    effect: 'damage',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A quick cut followed by quicker fingers, leaving the enemy hurt and lighter in the pocket.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_cutpurse_strike_3',
    name: 'Cutpurse Strike III',
    chain: 'Cutpurse Strike',
    rank: 3,
    skill: 'Thievery',
    grade: null,
    energyCost: 21,
    power: 28,
    physicalRoll: true,
    goldSteal: 5, // P0-locked retune 12->5 (§0 finding 4)
    effect: 'damage',
    trainingCost: 6,
    skillReq: 25,
    desc: 'A practiced thief\'s strike, timed to land exactly when the enemy is too busy reeling to notice the theft.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_cutpurse_strike_4',
    name: 'Cutpurse Strike IV',
    chain: 'Cutpurse Strike',
    rank: 4,
    skill: 'Thievery',
    grade: null,
    energyCost: 27,
    power: 40,
    physicalRoll: true,
    goldSteal: 8, // P0-locked retune 20->8 (§0 finding 4)
    effect: 'damage',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Mastery of Thievery: a wound and a windfall dealt in the same breath.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // ---------- Dual Wield: Crosscut (weapon damage) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_crosscut_1',
    name: 'Crosscut I',
    chain: 'Crosscut',
    rank: 1,
    skill: 'Dual Wield',
    grade: null,
    energyCost: 14,
    weaponTech: true,
    powerMult: 1.2,
    requiresOffhandWeapon: true,
    offhandFollowup: true,
    effect: 'damage',
    trainingCost: 3,
    skillReq: 4,
    desc: 'Both blades move as one — a main strike immediately trailed by the offhand. The most basic Dual Wield technique taught at any Academy.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_crosscut_2',
    name: 'Crosscut II',
    chain: 'Crosscut',
    rank: 2,
    skill: 'Dual Wield',
    grade: null,
    energyCost: 18,
    weaponTech: true,
    powerMult: 1.5,
    requiresOffhandWeapon: true,
    offhandFollowup: true,
    effect: 'damage',
    trainingCost: 4,
    skillReq: 10,
    desc: 'The gap between the two blades closes further, the offhand arriving almost before the eye registers the first cut.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_crosscut_3',
    name: 'Crosscut III',
    chain: 'Crosscut',
    rank: 3,
    skill: 'Dual Wield',
    grade: null,
    energyCost: 24,
    weaponTech: true,
    powerMult: 1.8,
    requiresOffhandWeapon: true,
    offhandFollowup: true,
    effect: 'damage',
    trainingCost: 6,
    skillReq: 25,
    desc: "Both edges committed in a single fluid motion, each strike disguising the other's angle."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_crosscut_4',
    name: 'Crosscut IV',
    chain: 'Crosscut',
    rank: 4,
    skill: 'Dual Wield',
    grade: null,
    energyCost: 30,
    weaponTech: true,
    powerMult: 2.1, // D4 primary lock (SPEC-TECH-POLARITY.md §0/§2.3): Cleave stays the faster at-level killer
    requiresOffhandWeapon: true,
    offhandFollowup: true,
    effect: 'damage',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Mastery of Dual Wield: two blades that strike as a single weapon, no gap left to answer.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // ---------- Double Attack: Tempo (buff, double_attack) [invented] (SPEC-TECH-POLARITY.md §2.3) ----------
  {
    id: 'tech_tempo_1',
    name: 'Tempo I',
    chain: 'Tempo',
    rank: 1,
    skill: 'Double Attack',
    grade: null,
    energyCost: 10,
    power: 0.05,
    statKind: 'double_attack',
    buffDuration: 5, // P0-locked retune 3->5 (§0 finding 1)
    effect: 'buff',
    trainingCost: 2,
    skillReq: 0,
    desc: "Finds the gap between the enemy's heartbeats and strikes twice into it, adding to Double Attack chance for a few turns. The most basic Double Attack technique taught at any Academy."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_tempo_2',
    name: 'Tempo II',
    chain: 'Tempo',
    rank: 2,
    skill: 'Double Attack',
    grade: null,
    energyCost: 15,
    power: 0.08,
    statKind: 'double_attack',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 4,
    skillReq: 10,
    desc: 'A tightening sense of tempo, letting the second strike land closer on the heels of the first.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_tempo_3',
    name: 'Tempo III',
    chain: 'Tempo',
    rank: 3,
    skill: 'Double Attack',
    grade: null,
    energyCost: 21,
    power: 0.12,
    statKind: 'double_attack',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 6,
    skillReq: 25,
    desc: "The fighter's rhythm outpaces the enemy's own, fitting a second blow into a beat that shouldn't have one."
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)
  {
    id: 'tech_tempo_4',
    name: 'Tempo IV',
    chain: 'Tempo',
    rank: 4,
    skill: 'Double Attack',
    grade: null,
    energyCost: 27,
    power: 0.15,
    statKind: 'double_attack',
    buffDuration: 5,
    effect: 'buff',
    trainingCost: 8,
    skillReq: 45,
    desc: 'Mastery of Double Attack: every strike arrives as a pair, with no beat left uncovered.'
  }, // [invented] (SPEC-TECH-POLARITY.md §2.3; constants P0-locked §0)

  // =====================================================================
  // v1.9: Companion System — Conjurer Bind (summon) + command techs (docs/SPEC-COMPANION-
  // SYSTEM.md §2.4). APPENDED (no index shift). All classOnly:true, classId:'conjurer',
  // chain:null, rank:1, skill:null, trainingCost:0, skillReq:0 (granted directly by the Conjurer's
  // Pact abilities, js/data/classes.js conjurer_pact_*, never trained at the Academy).
  //
  // Two NEW optional tech-schema fields, both back-compatible (every other tech is unaffected):
  //   summonKind: on effect:'summon' techs — which js/data/companions.js kind id to bind
  //               (js/core/battle.js useTech -> Game.Companion.summon).
  //   requiresCompanion: on the command techs — the companion kind id that must be bound AND
  //               alive this battle for the tech to be castable (js/core/battle.js useTech).
  // Two further per-tech behavior flags (also optional/back-compatible), each read by a small
  // dedicated js/core/battle.js useTech branch: `detonatesBurn` (Conflagration) and
  // `refreshesCompanionTaunt` (Bulwark).
  //
  // IMPORTANT (as with every tech in this file): `power` is a FLAT number that
  // Game.Battle.techEffectivePower scales by Intelligence/magic-skill/Rod at cast time — it is
  // NOT written as a formula-of-level. The command techs' flat `power` values below are
  // PROVISIONAL placeholders picked to sit in the same ballpark as other classOnly Tier-3
  // signature techs (e.g. tech_anima_reckoning/tech_shadow_blade), sim-gated pending the lead's
  // /balance-sim — none are locked. (Companion BASIC powers, by contrast, DO scale with
  // character level — js/data/companions.js coefficients, computed per-battle in
  // js/core/companion.js — that is intentional, not an inconsistency.)
  // =====================================================================

  {
    id: 'tech_summon_fire',
    name: 'Bind Salamander',
    chain: null,
    rank: 1,
    skill: 'Conjuration',
    grade: 'Fire',
    energyCost: 30, // [invented][sim-gated] docs/SPEC-COMPANION-SYSTEM.md §2.2 — anchored near the retired servitor's 35 so re-summoning stays a meaningful Energy tax
    summonKind: 'comp_fire',
    effect: 'summon',
    classOnly: true,
    classId: 'conjurer',
    desc: 'Bind an Ember Salamander to your side — a patient arsonist that sears foes over time. Replaces any companion already bound.'
  },
  {
    id: 'tech_summon_water',
    name: 'Bind Undine',
    chain: null,
    rank: 1,
    skill: 'Conjuration',
    grade: 'Water',
    energyCost: 30, // [invented][sim-gated]
    summonKind: 'comp_water',
    effect: 'summon',
    classOnly: true,
    classId: 'conjurer',
    desc: 'Bind a Tidal Undine — a healer that mends your wounds each round. Replaces any companion already bound.'
  },
  {
    id: 'tech_summon_earth',
    name: 'Bind Golem',
    chain: null,
    rank: 1,
    skill: 'Conjuration',
    grade: 'Earth',
    energyCost: 30, // [invented][sim-gated]
    summonKind: 'comp_earth',
    effect: 'summon',
    classOnly: true,
    classId: 'conjurer',
    desc: 'Bind a Granite Golem — a bulwark that draws blows away from you. Replaces any companion already bound.'
  },
  {
    id: 'tech_summon_wind',
    name: 'Bind Sylph',
    chain: null,
    rank: 1,
    skill: 'Conjuration',
    grade: 'Wind',
    energyCost: 30, // [invented][sim-gated]
    summonKind: 'comp_wind',
    effect: 'summon',
    classOnly: true,
    classId: 'conjurer',
    desc: 'Bind a Gale Sylph — a swift striker whose winds sharpen your own magic. Replaces any companion already bound.'
  },

  {
    id: 'tech_cmd_conflagration',
    name: 'Conflagration',
    chain: null,
    rank: 1,
    skill: 'Conjuration',
    grade: 'Fire',
    energyCost: 24,
    power: 70, // [invented][sim-gated] PROVISIONAL flat value — same order of magnitude as other classOnly Tier-3 damage signatures; pending the lead's sim (spec §3 S3: DoT+detonate must not exceed a Magus burst of equal investment)
    detonatesBurn: true, // js/core/battle.js useTech: detonates the Fire companion's active Burn (remaining dotPower*turnsLeft, Fire-resisted) then removes it
    requiresCompanion: 'comp_fire',
    effect: 'damage',
    classOnly: true,
    classId: 'conjurer',
    desc: 'Command the Salamander to blast the foe and ignite every smouldering wound at once.'
  },
  {
    id: 'tech_cmd_renewing_tide',
    name: 'Renewing Tide',
    chain: null,
    rank: 1,
    skill: 'Conjuration',
    grade: null,
    energyCost: 22,
    power: 90, // [invented][sim-gated] PROVISIONAL flat value, pending the lead's sim
    clearsStatus: true, // reuses the existing clearsStatus handler (cleanses Poison/Curse)
    requiresCompanion: 'comp_water',
    effect: 'heal',
    classOnly: true,
    classId: 'conjurer',
    desc: 'Command the Undine to wash over you — a surging heal that flushes out poison and curses.'
  },
  {
    id: 'tech_cmd_bulwark',
    name: 'Bulwark',
    chain: null,
    rank: 1,
    skill: 'Conjuration',
    grade: null,
    energyCost: 20,
    statKind: 'armor',
    power: 30, // [invented][sim-gated] PROVISIONAL flat value, pending the lead's sim
    buffDuration: 5,
    refreshesCompanionTaunt: true, // js/core/battle.js useTech: also refreshes the Golem's Taunt to BALANCE.COMPANION_TAUNT_TURNS_BULWARK
    requiresCompanion: 'comp_earth',
    effect: 'buff',
    classOnly: true,
    classId: 'conjurer',
    desc: 'The Golem raises a wall of stone — your Armor climbs and the foe fixes on your guardian.'
  },
  {
    id: 'tech_cmd_tailwind',
    name: 'Tailwind',
    chain: null,
    rank: 1,
    skill: 'Conjuration',
    grade: null,
    energyCost: 20,
    statKind: 'spellpower',
    power: 25, // [invented][sim-gated] PROVISIONAL flat value, pending the lead's sim
    buffDuration: 5,
    requiresCompanion: 'comp_wind',
    effect: 'buff',
    classOnly: true,
    classId: 'conjurer',
    desc: 'The Sylph wraps you in a rising wind — your techniques strike harder.'
  },

  // =====================================================================
  // v1.9: monster-example techs demonstrating the new optional `target` field on monster techs
  // (docs/SPEC-COMPANION-SYSTEM.md §2.3) — `target: 'player'|'companion'|'both'`, ABSENT ⇒
  // 'player' (every existing monster tech is unaffected). These two are SPEC EXAMPLES ONLY and are
  // NOT wired to any monster's `techs` list — which monsters/bosses receive them is deferred to a
  // future monster-AI pass (out of scope here, per spec §6). PROVISIONAL/[invented][sim-gated].
  // =====================================================================
  {
    id: 'mon_cleaving_roar',
    name: 'Cleaving Roar',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 10,
    power: 40, // [invented][sim-gated] PROVISIONAL — a cleave/AoE special hitting player AND companion
    target: 'both',
    effect: 'damage',
    monsterOnly: true,
    desc: 'A roar of raw force that buffets everything before it.'
  },
  {
    id: 'mon_banish_conduit',
    name: 'Banish Conduit',
    chain: null,
    rank: 1,
    skill: null,
    grade: null,
    energyCost: 10,
    power: 55, // [invented][sim-gated] PROVISIONAL — a focused special aimed squarely at a bound companion
    target: 'companion',
    effect: 'damage',
    monsterOnly: true,
    desc: "A focused blow meant to shatter a summoner's bound servant."
  }
];

window.Game = Game;

