# SPEC — v1.4 Gameplay Features (Quest Pacing, Advantage Points, Champion Abilities, Limit Breaks, Foraging)

**Status:** proposed (spec written 2026-07-11, not started — awaiting user approval of scope).
**Owner model:** lead (Fable) scopes/reviews; Sonnet subagents implement, each with a full
up-front brief (CLAUDE.md cardinal rule 4).
**Companion spec:** `docs/SPEC-MOBILE-UI.md` (the other v1.4 candidate — UI axis, independent,
own branch + user-acceptance gate). This spec is the gameplay axis. Either can ship first.
**Save impact:** one version bump for the whole spec, **v9 → v10** (G1 only; see §3).

Sourcing: candidates were mined from `reference/` per cardinal rule 2 (full sweep 2026-07-11);
G5 is direct user feedback on the current game. Two of the content features turned out to be
**archived**, not new inventions — including one system absent from every prior backlog:
Advantage Points.

---

## 1. Feature selection (what's in, what's deferred, and why)

### In scope — v1.4

| # | Feature | Tag | Source |
|---|---------|-----|--------|
| G1 | Advantage Points + AA exchange | **[archived]** (partial) | `reference/forum/t-827.md`; `reference/site/homepage_2006.md` patch notes ("Added 20+ items to the AA list for all price ranges") |
| G2 | Champion & boss abilities | **[archived]** intent + **[invented]** specifics | `reference/site/homepage_2006.md` Hero 6.5 plan ("Strategic boss battles … scripted abilities, status effects, item usage"); backlog item "unique champion abilities" (user-approved) |
| G3 | Limit Breaks on the Fury meter | **[archived]** names + **[invented]** numbers | `reference/forum/t-796.md` (Rage, Dragon Kick, Hurricane Blow; MP-gated in the 2005 engine); `reference/forum/f-84.md` ("Warriors replace MP with Fury?") |
| G4 | Foraging & provisions (energy consumables) | **[archived]** concept + **[revised]** keying + **[invented]** provisions (user-requested 2026-07-11) | `reference/forum/t-449.md` ("Luck determines what kind of items you can Forage for"); tradeskill plans (Herb Lore) same thread |
| G5 | Quest pacing: active cap + quest chains | **[revised]** (user-directed, 2026-07-11) + **[invented]** chain mechanic | User feedback: quest offering is "highly overwhelming"; no cap/chain data survived from the original |

Why these five: G5 fixes the game's loudest current UX problem (quest overload — user
feedback); G1–G4 deepen the three core loops the game already has (fight → reward,
camp → risk/reward, materials → synthesis) without adding a new screen-heavy subsystem, with
archived grounding for most; and together they fix the one structural gap v1.3 left —
**at `LEVEL_CAP=100` the XP reward stream goes dead** (`character.js` clamps at cap), so a
finished character has nothing left to earn. AP (G1) is a victory-keyed currency that keeps
every fight rewarding at cap, exactly the role the archived system played ("spend kills to
get items").

### Deferred — explicitly out of this release

- **Pets** — name-only survival (`reference/site/heropet.md` is a login wall; DESIGN.md §9:
  "no design info survived"). Needs a full [invented] design of its own; v1.5 candidate.
- **Eidolons** — full mechanic survived (`reference/manual/Version_3.0.md`) but it *replaces
  the class system* and DESIGN.md §1 rules v3.0 out of scope. A future major version, if ever.
- **Interactive tutorial / newbie zone** — archived plan (`homepage_2006.md`); polish, not
  gameplay depth. Candidate rider for the mobile-UI branch where onboarding matters most.
- **Fear/healing/energy sustain pass** — the accepted v1.3 known limitation (DESIGN §4).
  Stays deferred; G2 must not silently change it (see §6 risks).
- **Multiplayer economy** (player shops, trading, auction, honor, leaderboards) — cut per
  DESIGN.md §9; the online track (`SPEC-ONLINE-HOSTING.md`) is the only path that could
  reopen any of it.

---

## 2. G5 — Quest pacing: active cap + quest chains (scheduled FIRST — live pain point)

**Problem (user feedback, 2026-07-11):** `Game.Quests.availableAt()` (quests.js:38) offers
*every* not-yet-accepted quest whose giver is in the area, and there is no limit on active
quests — so taverns dump their whole list at once and the Journal floods. With ~40+ quests
after the level-100 arc this is overwhelming. There is also no prerequisite-quest mechanism
(only class/race/level gates), so multi-part storylines like the Arkan line all appear
simultaneously.

**Design — two mechanisms, both data + one core-module change:**

1. **Active-quest cap [revised].** `BALANCE.MAX_ACTIVE_QUESTS = 3` (citation: user-directed
   pacing override, this spec; the original documents no cap). `accept()` counts entries with
   `status === 'active'` and refuses at the cap ("Your journal is full — finish or abandon a
   quest first."). The Tavern UI greys out offers at cap with that reason (same
   `{ eligible, reason }` record pattern `availableAt()` already returns for level windows).
   The Journal shows "Active (n/3)". **Backward compatible:** an existing save already above
   the cap keeps its actives — the cap only blocks *new* accepts; `cancel()` (already
   implemented, archived) is the relief valve.

2. **Quest chains [invented].** New optional quest field `requiresQuest: '<questId>'`:
   - `availableAt()` hides a quest whose prerequisite is not `status === 'completed'` —
     chained quests no longer clutter the offer list before their turn comes.
   - **Follow-up on hand-in:** `turnIn()` returns a `followUps: [questId…]` array — quests
     whose `requiresQuest` just completed AND whose giver is at the current area. The Tavern
     UI surfaces them immediately after the turn-in message ("Rennick has more work for
     you…") with an accept button, so handing in flows straight into the next chapter. If
     the player is at the cap or under-leveled, the follow-up still lists (greyed, with
     reason) — it is never silently lost, it simply appears via `availableAt()` whenever
     they return.
   - `cancel()` of a completed chain's *prerequisite* is impossible (cancel only works on
     actives), so chains cannot be broken retroactively. Cancelling an active mid-chain
     quest resets only that quest, per existing cancel semantics.

3. **Data pass over `js/data/quests.js`:** organize existing quests into chains so each
   giver exposes at most 1–2 entry quests at a time — natural chains already exist in
   fiction (Arkan first_rite → battlemage_trial → red_moon_whispers; Rennick's cipher line;
   per-band side quests follow their band's main-spine quest). Rule: main story-spine quests
   are chain HEADS (never `requiresQuest`-gated behind side content); side quests chain
   behind their region's spine entry. No quest becomes unreachable: every quest must remain
   completable in a fresh playthrough (test-enforced, see below).

**Save impact: none.** Both mechanisms read existing `c.quests` state; no new character
field, no version bump.

**Tests:** extend the quests suite — cap refusal at 3 actives + accept-after-cancel;
`requiresQuest` hides/reveals around prerequisite completion; `turnIn().followUps` contents
(same-giver only); a reachability check that walks every chain from its head and asserts
every quest id is offered eventually (catches dangling `requiresQuest` typos).

---

## 3. G1 — Advantage Points + the AA exchange

**What survived:** a second currency earned from battle **victories** ("you can now spend
kills to get items" — t-827), optional and integrated with wins, redeemable against an "AA
list" catalog spanning "all price ranges" (20+ items). Exact earn rates and the item list did
not survive → those specifics are **[invented]**, designed to the archived shape.

**Design:**
- `character.ap` (integer, starts 0). Earned **only on victory**: `AP_PER_WIN(monsterLevel)`
  in balance.js — proposed shape `1 + floor(level/20)`, champions ×2, bosses ×3 (mirrors the
  existing champion/boss reward premiums; final numbers from the G1 sim, see §5). No AP from
  fleeing, quests, or sales — it is strictly a kills currency, per the source.
- **AA exchange** = new town facility type `'exchange'` in areas.js (same pattern as
  `'shop'`). Place ONE in a mid-arc town (Laik or Ju'Mak) and one late (Estari/Skyspire town)
  — archived placement is unknown, [invented] to serve both mid-game and capped players.
- **Catalog (~20 items, "all price ranges"):** mostly *existing* item ids at AP prices
  (consumables, energy stones, mid-tier gear — no new icons needed) plus **6–8 new
  AP-exclusive items [invented]** with new icons: convenience/prestige, NOT power-creep —
  e.g. a gold-find charm, a weight-capacity pack, cosmetic-grade gear reskins, one late-game
  consumable bundle. **Hard rule: no AP item may outclass same-levelReq drops or uniques**
  (uniques stay monster-drop-only per content conventions).
- UI: AP shown on the Status screen next to gold; exchange screen reuses the shop renderer
  with `costAp` instead of gold cost.

**Save:** v9 → v10. `character.js create()` gains `ap: 0`; `save.js migrate()` adds the
v9→v10 step (`ap = 0` if missing); migration test extends the full v1→v10 chain. Battle
transient state untouched.

## 4. G2 — Champion & boss abilities

**What survived:** intent only — "strategic boss battles", "scripted abilities, summons,
status effects, item usage", plus a "Champion Bosses" thread title. The engine is strictly
1v1 (`reference/forum/t-449.md`: "no summons in battle"), so summons are out; the rest is
**[invented]** within that intent.

**Design:**
- **Champion affixes:** when `options.champion` rolls, the monster copy additionally gains
  ONE affix rolled via `Game.Battle._rng` (single RNG surface — no second `_rng`):
  - *Vampiric* — heals for 25% of damage dealt
  - *Frenzied* — +1 fury-style escalation: damage +5% per round elapsed
  - *Warded* — first hostile tech each battle is negated
  - *Venomous* — basic attacks apply Poison (existing status)
  - *Hoarder* — no combat change; drop chances ×3 instead of ×2 (reward-shaped affix)
  Affix replaces nothing: the existing HP/damage multipliers stay (re-simmed in §5; if
  stacking breaks the at-level ≥85% contract, the flat multipliers come DOWN, the affix
  stays — affixes are the interesting part).
- **Boss scripts:** the 6 arc bosses (Band A–F) plus the 3 pre-arc bosses each get one
  scripted behavior keyed to HP thresholds (e.g. Eidas Ascendant casts a heal-block Curse at
  50%; Swamp-Dragon-style enrage at 25%) — data-driven via a `script:` field on the monster
  def read by battle.js, not per-boss code branches. Names Swamp Dragon / Beregard / Coveter
  / Validor (archived 2005 bosses, `homepage_2006.md`) are available if any new champion-tier
  monsters are wanted, but no new monsters are required by this spec.
- Battle log must announce affix/script triggers (players must be able to learn the rules).
- **No save change** — all of it lives on the battle-transient monster copy.

## 5. G3 — Limit Breaks, and G4 — Foraging

**G3 Limit Breaks.** Archived names Rage / Dragon Kick / Hurricane Blow were MP-gated
specials in the 2005 engine; the remake's Fury meter (archived, +1% XP per tick) is the
natural modern host — the forum itself proposed exactly that bridge ("Warriors replace MP
with Fury?"). **P0 engine correction (2026-07-12):** Fury in the shipped engine is a
CROSS-BATTLE kill streak on the character (`c.fury`, battle.js — +1 per kill at-or-above
your level, resets on flee/death, persists between fights), not a per-battle gauge. That
makes the trade sharper, so the design keys off the streak: **[invented] mechanics:** when
`c.fury >= 5`, a Limit Break action unlocks in battle; using it **consumes the entire
streak** (sacrificing the accumulated +1%/tick XP bonus on every future win of the streak —
a real tension, not a freebie) for a class-line special: Rage (warrior line — heavy hit +
self armor buff), Dragon Kick (rogue/gambit line — hit + dodge-debuff), Hurricane Blow
(mage line — non-elemental burst, bypasses the Int hit-roll). Damage tuned by the P0 sim
(target ≈1.6–2.0× an average basic hit — strong but not degenerate; one use per battle).
Energy cost 0 (the streak IS the cost). No save change needed beyond none: `c.fury` already
persists on the character. One rank each, granted automatically at the class tier that fits
(base tier at L5+); shown in the battle UI only when charged.

**G4 Foraging.** Archived concept keyed Foraging to Luck; the remake has no Luck stat →
**[revised]:** Forage is a new **camp action** beside the existing camp options. One forage
per camp; success 70% base (sim-checked), yielding 1–2 area-keyed synthesis materials
(existing material ids per region band — no new items required; optionally 2–3 new herb ids
[invented, Herb Lore flavor] if Synthesis wants new recipes). Class hook via the existing
guarded pattern (`Game.Classes.classBonus(c, 'gold_pct')` stays untouched; add effect
`forage_flat` only if a class needs it — otherwise skip). Camp robbery risk
(`forum/t-756.md`, archived, already implemented) applies unchanged — foraging doesn't dodge
the camp's existing risk profile. Rolls through `Game.Battle._rng`-backed `rng()` in
world.js. No save change.

**G4b Provisions — energy consumables [invented], user-requested 2026-07-11.** The game
already has a deep energy-restore line (Energy Shards in level-1 town shops, graded B–H
Class Crystals 80→540+, Energy Stones at level-30+ outposts, all `energyRestore`
combat-usables) — so provisions fill the *low-cost convenience* niche rather than adding
sustain power: 3–4 cheap food/tonic items (e.g. Trail Rations, Honeyed Mead, Kuraan Spice
Tea) sold at taverns/inns, appearing in early shops, and yielded by G4 foraging alongside
synthesis materials. Same `energyRestore` item path as the existing consumables — no new
mechanic. Deliberately shaped as early-game items: small flat restores (~40–80), low gold
cost, but heavier weight than Crystals — convenient when Energy pools are small, inefficient
to stockpile late. **Guardrail:** energy-consumable sustain is precisely the lever behind
the accepted 5-down Fear limitation (DESIGN §4) — the P0 sim must measure the 5-down delta
with provisions in the kit, and per-gold energy efficiency must stay strictly below Energy
Stones at level 30+ so provisions never become the late-game sustain optimum. New item ids
need icons (presence-checked by test_icons.js; lead pulls DCSS tiles per the v1.3 pipeline
notes). Drop/forage tables APPEND only. No save change.

---

## 6. Phasing & verification

Branch **`v1.4-gameplay`** off `main`. Each phase: full-brief Sonnet subagent → lead review
(read risky modules, run all ten suites, sim-check balance claims) → one green commit.

- **P1 — G5 quest pacing (FIRST — live pain point, no sim dependency).** Cap + chains in
  quests.js + Tavern/Journal UI + the quests.js data pass into chains; extended quests suite
  incl. the chain-reachability check. Independent of P0 — may run in parallel with it.
- **P0 — Sim harness (lead, gating de-risk for G1–G3, same role F1 played for the arc).**
  Scratchpad sim in `node vm` loading the real game code; measures win %, rounds, HP-left,
  damage-per-energy at L10/30/50/70/90/100 for: champion+affix fights, boss scripts, limit-
  break usage. Locks the G1 AP earn curve against gold/xp pacing (AP catalog prices come from
  measured wins-per-hour, aiming: cheapest item ≈ 15 wins, top item ≈ 300). Output: final
  constants for balance.js, each with its citation comment.
- **P2 — G1 Advantage Points** (save v10 + migration + migration-chain test; exchange
  facility + catalog + UI; stubbed-RNG not needed — AP is deterministic on victory). Icons
  for the 6–8 new items: **lead pulls DCSS tiles** (subagents' env has no network;
  repo-relative staging dir; no `< /dev/null` in execSync curl — v1.3 icon-pipeline notes).
- **P3 — G2 champion affixes + boss scripts** (stubbed-RNG tests: forced affix rolls, each
  script threshold; re-run P0 sim with real data; battle-log assertions).
- **P4 — G3 limit breaks + G4 foraging & provisions** (stubbed-RNG tests for forage tables
  and fury threshold; sim confirms limit-break damage-per-energy stays in band AND the
  provisions 5-down delta; provisions icons pulled by lead; drop tables APPEND only —
  first-hit-wins order preserved).
- **P5 — Docs**: DESIGN.md sections for all five (tags + citations), README, CLAUDE.md
  "recently completed" rollover; this spec marked shipped.

All ten suites green before every commit (`cd tests && for t in test_*.js; do node $t; done`);
stale constants (item/monster counts, save version) updated, behavioral assertions never
weakened. New item/tech ids each need `assets/icons/<id>.png` (presence enforced by
test_icons.js; only monsters need mutual byte-distinctness — no new monsters planned).

### P0 RESULTS (run 2026-07-12, scratchpad `sim_v14_p0.js`, 300 trials/cell, real RNG)

Fixture: the "modest geared warrior" of the shipped boss tests (best-in-band weapon/body/
shield, Swords 3 / Heavy Armor 2, str-heavy stats, 6+6 best-grade heal/energy consumables),
at checkpoints L10/30/50/70/90/100 vs the nearest at-level non-boss (regular + champion) and
nearest boss. Findings, binding on P2–P4:

1. **Champion baseline (existing 1.5×hp / 1.35×dmg) holds**: 100% win at every checkpoint,
   HP-left 60→72%. CHAMPION_HP/DAMAGE_MULT stay untouched.
2. **Affix constants (locked)**: Vampiric heals **25% of damage dealt** (100% win everywhere,
   ≈+1 round); Venomous applies the existing Poison status at **35% on-hit** when unpoisoned
   (100% win everywhere); **Frenzied = +5% damage per round elapsed, CAPPED at +40%** — the
   uncapped +5%/round design broke the ≥85% floor at L90/100 (62–64% win over 16-round
   fights); with the cap it holds 93.7–100% at every checkpoint. Warded (first hostile tech
   negated) is a one-action tax, not sim-gated here — P3 must spot-check it with a caster
   build (it does nothing to the pure-attack fixture). Hoarder is combat-neutral (drops ×3
   replaces the ×2 reward premium).
3. **Limit break locked at ×2.0 of the player's average basic hit**, one use per battle,
   requires `c.fury >= 5`, consumes the whole streak. On the hardest boss (eidas_ascendant,
   66.3% baseline win for this modest fixture) LB ×2.0 lifts win to ~77% and shaves ~1.5
   rounds without changing HP-cost; ×2.5 reached 85% — too strong for a repeatable button.
4. **Provisions are contract-safe**: 8 cheap 60-energy provisions changed NOTHING at true
   5-down cells (0.0% win with and without, L10/15/20); the marathon-stall shape of those
   losses (400+ rounds of Fear-floored damage) is the known accepted limitation, unchanged.
5. **AP curve (arithmetic; at-level win rates are 100%, so wins ≈ battles):**
   `AP_PER_WIN(monsterLevel) = 1 + floor(monsterLevel/20)` (1 at L1–19 → 6 at L100),
   champions ×2, bosses ×3. Catalog anchors: cheapest item ≈15 AP; mid-band gear 90–180 AP;
   top prestige item ≈1800 AP (≈300 L100 wins).
6. **Fixture caveat**: melee-only. P3 re-runs the affix cells against its real implementation
   with this sim's driver, plus the caster spot-check for Warded (constraint-(b) style,
   balance.js F1 notes §3).

## 7. Risks & guardrails

- **Difficulty contract** (bosses winnable-but-costly; at-level ≥85–100%): G2 affixes stack
  on existing champion multipliers — the P0/P2 sims are the gate; if the contract breaks,
  reduce CHAMPION_HP/DAMAGE_MULT rather than gutting affixes.
- **Known limitation stays known:** G2/G3 must not accidentally "fix" or worsen the
  5-down≠death Fear sustain issue in untracked ways — P2 sim re-checks the 5-down case and
  reports the delta; any change is surfaced to the user, not silently shipped.
- **Economy:** AP is a parallel currency, not a gold faucet — AA items are AP-only, never
  resellable for gold above vendor-trash price (prevents AP→gold arbitrage).
- **Scope creep magnet:** G2 boss scripts must stay data-driven (one `script:` field, one
  interpreter in battle.js) — per-boss code branches are the failure mode to reject in
  review.
- **Quest reachability (G5):** the chain data pass is the riskiest mechanical edit — a
  mistyped `requiresQuest` strands content invisibly. The chain-reachability test is
  non-negotiable, and class/race-gated quests must chain only behind quests with compatible
  gates (an Arkan-only quest may not be the sole gateway to race-neutral content).
- **Cap vs. story flow (G5):** `MAX_ACTIVE_QUESTS = 3` must never soft-lock the story spine —
  spine quests are chain heads and the cap is bypassable by abandoning side quests, but P1
  review should walk a fresh playthrough (debug-leveled) to confirm the spine is always
  acceptable within the cap.

## 8. Release framing

**v1.4 = this spec + `SPEC-MOBILE-UI.md`**, developed on separate branches
(`v1.4-gameplay`, `mobile-ui`), independently gated (suites for gameplay; suites + user
device acceptance for mobile), merged to `main` when each is done. Deployment then ships
both via the existing static-site path (`tools/deploy.sh`). No dependency between the two
branches; either may land first.
