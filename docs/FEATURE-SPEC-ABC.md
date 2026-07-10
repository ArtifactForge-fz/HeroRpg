# Feature Spec A/B/C — combat depth batch (user-directed, IN FLIGHT)

Status: partially implemented, see CLAUDE.md "IN-FLIGHT WORK" for the verified done/missing
split. These specs are the implementation authority; hand them (plus a fresh disk-state gap
list) to the implementing agent in its spawn prompt.

## A. Escape can fail (relative-power based)

balance.js (all `// invented (user-directed)`): FLEE_BASE 0.65; FLEE_PER_LEVEL_DIFF 0.03
(+ per player level above the monster, − below); FLEE_WOUNDED_BONUS 0.30 scaled by
(1 − monsterHp/hpMax) — a badly wounded monster can't give chase (user's explicit design note);
FLEE_BOSS_PENALTY 0.15; FLEE_MIN 0.25; FLEE_MAX 0.95.

Exported `fleeChance(battle)` = clamp(BASE + PER_LEVEL_DIFF×(playerLvl−monsterLvl) +
WOUNDED×(1−hp/hpMax) − (boss ? PENALTY : 0), MIN, MAX).

flee(): roll rng() < fleeChance. Success = previous behavior exactly (phase 'fled', fury reset).
Failure: "You fail to escape — the <name> blocks your path!", fury NOT reset, battle stays
active, monster counters via the normal finishRound path. Fleeing stays FREE and always
attemptable at 0 energy — archived constraint (Energy.md: at 0 energy "you may only end the
battle by dying or by fleeing"); FLEE_MIN prevents guaranteed death. Ambush battles use the same
formula. UI: Escape button title shows current % ("Escape (72%)").

## B. Death penalties (gold loss + rare mishaps) — save v7→v8

Deliberately OVERRIDES the archived no-loss rule (New_Player_Guide.md "you don't lose anything
either") — constants marked `// revised (user-directed)`, precedent: two-tier classes.

- DEATH_GOLD_FRACTION 0.10 — every death loses ceil(10% of CARRIED gold); vault gold safe
  (consistent with camp robbery + archived vault advice, t-756.md).
- DEATH_MISHAP_CHANCE 0.12 — one roll per death; on hit, 50/50 between:
  - **Haunting** (archived status NAME, Version_2.1_Changes.md; effect invented): persistent
    affliction in new `c.afflictions: []` (entries `{id:'haunting'}`) — ALL magical/consumable
    healing HALVED (healing techs, potions, camp recovery, Absorption drain returns). Inn
    restore NOT halved (rest, not healing) and does NOT cure. Cure: Spirit Shrine service
    "Cleanse Haunting", fee 25 + 5×level gold, listed only while haunted.
  - **Item lost where you fell**: one uniformly-random UNEQUIPPED inventory item permanently
    lost. Excluded: tags 'unique'/'lore', ids starting `quest_`. Empty pool → no mishap (do NOT
    fall back to Haunting).
- onLoss(): gold first, then mishap roll, all via rng(). Defeat log states exactly what was
  lost. Existing behavior kept: deaths+1, fury reset, 1 HP on Continue, no rewards.
- save.js: CURRENT_VERSION 7→8; v7→v8 migration adds `afflictions: []`; verify v1→v8 chain.
- UI: afflictions in dark red on Status + battle "Your Vitality" panel; shrine cleanse panel.

## C. Weapon techniques + Defend action

Problem: early melee is Attack-spam; magic builds get a starter tech, weapon builds get nothing.

- New tech fields: `weaponTech: true`, `powerMult` (× current weapon Damage), optional
  `armorPierce` (fraction of monster armor ignored). useTech(): weaponTech requires a weapon
  equipped (same archived rule as attack); base = Character.getDamage(player) × powerMult
  (physical — NOT the Intelligence spell factor); then the normal variance/glancing/fear/armor
  pipeline with armorPierce reducing the armor term; grade null. Win-time skill XP credits the
  tech's `skill` (a weapon skill) — verify the win handler doesn't filter to magic schools.
- Academy chains (trainingCost 2/3/5, skillReq 0/6/12 for ranks I/II/III):
  Swords "Cleave I–III" powerMult 1.5/1.9/2.3, energy 12/16/22;
  Polearms "Impale I–III" 1.4/1.8/2.2, armorPierce 0.35, energy 12/16/22;
  Knives "Vital Strike I–III" 1.3/1.7/2.0, armorPierce 0.5, energy 10/14/18;
  Hand to Hand "Flurry I–II" 0.9/1.1 with hits: 2, energy 14/20.
- Balance contract (sim-verify, report numbers): every weapon tech beats plain attack on
  damage-per-TURN but LOSES on damage-per-ENERGY (attack costs 5). Retune violators down.
- Starter grant (character.js — ALREADY IMPLEMENTED): highest creation-skill investment wins
  between magic and weapon tables; tie → magic.
- **Defend**: battle.js `defend()`, 2 energy, sets battle.playerDefending; monster's counter
  damage vs player HALVED (after mitigation, round, min 1), flag clears after that monster
  action; statuses (poison) tick unhalved. UI: Defend button (shield glyph) in the action row,
  tooltip "Halve the next hit (2 Energy)". Monster AI unchanged.
- Icons for all 11 new techs (CC0 crawl tileset, effect//gui folders, hash-distinct).

## Test additions required (stub Game.Battle._rng)

Flee: success unchanged; failure → battle active + monster countered + fury preserved;
fleeChance monotonic in monster hp; boss penalty; clamps; attemptable at 0 energy.
Death: exact ceil(10%) carried-gold loss, vault untouched; both mishaps; haunting halves
potion+tech+camp healing but not inn; inn doesn't cure; cleanse charges fee + removes;
item-loss exclusions + empty-pool fallback; v7→v8 and v1→v8 migrations.
Weapon techs: damage derives from weapon (stubbed char, assert range); armorPierce math; Flurry
double-hit; energy costs; starter grants (Swords build gets cleave I; Evocation build unchanged);
chain skillReq gating; DPE < attack for every tech. Defend: halves exactly one hit, poison
unaffected, costs 2. ALL suites green.
