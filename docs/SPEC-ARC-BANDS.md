# SPEC — Level-Arc content bands (F2+F3), 41→100

Authority for the world/content build of `docs/SPEC-FULL-LEVEL-ARC.md` F2 (world skeleton) + F3
(content fill), combined **band by band** because areas need monsters and content-integrity tests
need valid refs. Branch `level-arc`, after F1. Lead designs this plan; Sonnet agents implement one
band each, sequentially (shared data files — never parallel). Every band ends with all 10 suites
green and its own commit. Read `CLAUDE.md` + `docs/SPEC-FULL-LEVEL-ARC.md` (esp. the F1 CONVENTION
NOTES block in `js/balance.js`) before implementing.

## Hard conventions every band MUST follow (from F1)

- **Monster formulas** (balance.js): hp = 20+12·lvl, damage = 3+2·lvl, energy = 40+10·lvl, armor
  ≈ lvl but capped ~half a same-level warrior's expected hit (over-armoring stalls melee). xp =
  `BALANCE.MONSTER_XP(lvl)`. Append-only drop tables, first-hit-wins.
- **Bosses/lairs**: flat hp/damage premiums + ×3 xp; the F1 sim's costly-but-winnable target is a
  damage premium ≈ `round(1.5·lvl + 10)` — tune each real boss toward "prepared player wins but
  pays HP/consumables; at-level regulars ≥85–100%; 5-down = death via Fear."
- **Weapon/armor tiers past band 35 MUST taper** (F1 finding — else the game trivializes by L100):
  author damage/armor off `effectiveLevelReq = 35 + 0.7·(levelReq−35)`, NOT the literal levelReq.
  So a levelReq-95 weapon carries damage ≈ 3+2·(35+0.7·60) ≈ 157, not 193. Uniques (tag 'unique'):
  monster-drop-only, +15–25% over the tapered tier, never in shops/recipes.
- **Icons**: every new item/monster/player-tech id needs a 32×32 icon file present + hash-distinct
  (`test_icons.js`). Band agents may use placeholder icons; the LEAD runs a real-DCSS-tile pass over
  all new ids at the end (the lead's Bash can pull `crawl-ref/source/rltiles` tiles; sub-agents' env
  cannot — do not burn effort trying).
- **No save changes** unless a band genuinely needs a new persisted field (prefer computed gates;
  coordinate a single bump with the lead if unavoidable).
- **No gap wider than the ±5 XP/loot cutoff**: consecutive huntable bands must overlap so a player
  always has at-level targets. Travel connectivity must be verified (each new area reachable).

## The 41→100 arc — a single northward story (D4)

From the L36–40 Skyspire/Eidas act-break, the story pushes north to reclaim the Arkan homeland, then
ever deeper toward Eidas's red-moon "divine race" — using the archived lore races/places (Arkan,
Majiku, Ukai, Estari, Eidas, Skyspire, red moon; DESIGN §2, arc §6). ~2 hunting areas per band
(every ~4–5 levels), 1 lair boss per band, 2 new settlements, a main-quest spine beat per band + a
couple of side quests.

| Band | Levels | Region (theme) | Hunting areas (minLevel) | Lair boss (~lvl) | Story beat |
|---|---|---|---|---|---|
| A | 41–50 | **Forests of Kuraan** (lost Arkan homeland, Majiku-held) | Kuraan Fringe Woods (41), Deep Kuraan (46) | Majiku Warlord (50) | Reclaim the Kuraan fringe from the Majiku |
| B | 51–60 | **Majiku Highlands** (northern tribal war-lands) | Border Steppe (51), Highland War-Camps (56) | Majiku Ridge-Chieftain (60) | Break the Majiku host; tier-3 class re-gates here (F4) |
| C | 61–70 | **The Frozen Reaches / Ukai approach** | Glacial Approach (61), Ukai Undercaverns (66) | Ukai Deep-Dweller (70) | Descend to the cavern Ukai for passage north |
| D | 71–80 | **Estari Ruins Deep** (precursor ruins, raw Anima) | Estari Sublevels (71), The Anima Wellspring (76) | Estari Warden-Prime (80) | The taboo Anima wellspring — mining it kills Exos |
| E | 81–90 | **Ascent to the Skyspire** | Skyspire Lower Spans (81), Upper Spans (86) | Society Anima-Horror (90) | Climb Eidas's Skyspire; the Society's last remnant |
| F | 91–100 | **The Red Moon / Eidas's Sanctum** (endgame) | The Moon-Bridge (91), Eidas's Sanctum (96) | **Eidas Ascendant (100)** — final boss | Confront Eidas and his divine race — the finale |

**Settlements (2 new):** *Kuraan Reclamation Camp* (~L44, in band A) — shop/inn/vault/academy for the
41–60 range; *Frosthold Waystation* (~L66, band C) — shop/inn/vault/academy/shrine for 61–90. Stock
their shops from each era's tapered gear + consumables. (The v1.2 Kastengard Vanguard Camp covers 26–40.)

## Per-band content target (F3)

Each band adds, at its level range and honoring the conventions above:
- **~5–6 monsters** across its two areas (append-only drops), + **1 lair boss**.
- **Weapons** covering the band's tier(s) — at least one per relevant weapon skill family across the
  band, TAPERED; **armor** pieces (Light/Medium/Heavy + shields) for the band; a few **uniques**
  (monster-drop). Shop stock at the band's settlement; a couple of **synthesis recipes**.
- **Consumables**: extend the graded Crystal/Sphere/energy-stone line into the band as drops.
- **Techs**: extend magic-school chains and weapon-tech ranks a step (a few new techs/band), gated by
  skill level per the existing Academy chain model.
- **Quests**: 1 main-spine quest (the story beat) + 1–2 side quests (kill/collect/visit); wire givers
  at the band's settlement or a reachable town. Use the existing quest kinds/reward shapes.
- **Icons** for every new id (placeholder ok; lead does the real-tile pass at the end).

## Phasing / order

Bands A→F in order (each depends on the prior for travel continuity and story). After the bands:
- **F4 (class re-gate):** move the tier-3 "Master's Calling" unlock from L38 to ~L60 (Band B era);
  verify class-XP reaches tier-3 ability costs by 100; class-balance spot check.
- **F5 (story spine):** stitch the per-band beats into a coherent Chapter II→III arc in `story.js`
  and the Journal; ensure the L91–100 finale (Eidas Ascendant) reads as the capstone.
- **Lead real-icon pass** over all new ids (DCSS tiles), then de-dup check.
- **Balance re-sim** with the REAL authored content (not synthetic) at 50/70/90/100; adjust outliers.
- **Docs**: update DESIGN §2/§10 + README counts; flip SPEC-FULL-LEVEL-ARC status toward done.
