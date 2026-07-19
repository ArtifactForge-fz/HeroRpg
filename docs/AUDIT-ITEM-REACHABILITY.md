# AUDIT — Item Reachability & Dead Items (2026-07-17)

Triage of items that "have no use," prompted by user playtest feedback (example cited: *Condensed
Anima Core*). This is a **read-only audit** — no code changed. Findings are tiered by severity and
each carries a recommended fix + DESIGN tag for a later cycle. Origin branch: `v1.7-content`
(audit run against the current **working tree**, which includes uncommitted WIP — see §5).

## 1. Method (reproducible)

A script loads the real data files (`js/balance.js` first — `monsters.js` needs the `BALANCE`
global — then `items.js, monsters.js, areas.js, quests.js, recipes.js, story.js, classes.js`) into
one `vm` context (same technique the balance sims use) and classifies all **271 items** on two
axes:

- **Obtainable** — the id appears as: a monster drop (`monsters[].drops[].itemId`), shop stock
  (`facilities[].stock` plain-id entries), **AA Exchange** stock (`facilities[].stock`
  `{itemId, costAp}` entries), forage (`areas[].forage`), a lair drop, a quest reward
  (`rewards.items`), a quest hand-out (`acceptItems`), or a recipe output.
- **Has a sink / use** — it is equippable (a real equip slot), consumable
  (`combatUsable`/`energyRestore`/`hpRestore`/potion·crystal·sphere·stone·tent·provision family,
  etc.), a recipe **input**, or a quest **collect-step** target.

An item is **dead** if obtainable-but-no-sink (you can hold it, it does nothing) or
sink-but-unobtainable (something needs it, but nothing grants it). Two scan bugs were found and
fixed mid-audit and are called out because they are the same traps a human reviewer hits:
1. The AA **Exchange** uses `{itemId, costAp}` stock objects, not plain ids — missing this falsely
   marks all AP-shop stock unobtainable.
2. Consumability must check `combatUsable`/`energyRestore` (not just an `effect` field) — else
   working energy stones like `ap_stone_energy_royal` (energyRestore 600) falsely read as dead.

Totals: 271 items · 184 equippable · ~62 consumable · 88 monsters · 46 quests · 25 recipes.

**Not dead (the reported example):** `quest_condensed_anima_core` drops from
`estari_ruin_warden` (60%, [monsters.js:460](../js/data/monsters.js#L460)) and is the collect
turn-in for the advanced-class quest *The Trials of Ascension*
([quests.js:429](../js/data/quests.js#L429)). It only *reads* as useless because nothing in-game
surfaces which quest consumes a drop-only material — see §6.

## 2. Tier 1 — genuine bugs (feature is built, but the enabling item is unreachable)

### T1-a — Dual-wielding is impossible: no offhand weapon can be obtained  `[bug]`
`knife_offhand_twinfang` (Twinfang Dirk) and `hth_offhand_cestus` (Brawler's Cestus) are the
**only two offhand items carrying a `damage` field** — every other offhand item is a shield
(`armor`/`magicArmor`). Neither is sold, dropped, foraged, crafted, or quest-rewarded (confirmed:
each id appears *only* in [items.js:212](../js/data/items.js#L212) / [items.js:224](../js/data/items.js#L224),
nowhere else in `js/`). The dual-wield mechanic keys on an equipped offhand weapon
(`offhandItem.damage !== undefined`, [battle.js attack()](../js/core/battle.js)), so **the shipped
v1.2 dual-wield feature never activates for any player.**
- **Fix:** both are `levelReq 1` — add to an early shop (Eldor + Saratus weapon stock). Ideally
  also introduce a small offhand-weapon ladder (mirroring the shield tiers) as shop/drop items so
  Knives/Hand-to-Hand builds can dual-wield past level 1. `[revised]` (unwalls a shipped mechanic).
  If new items get combat stats → mandatory `/balance-sim` before locking.

### T1-b — The cursed-item trap never triggers: its only cursed item is unobtainable  `[bug]`
`ring_of_the_hollow_king` is the **sole `'cursed'`-tagged item**
([items.js:629](../js/data/items.js#L629)). The cursed mechanic is fully implemented — unequip is
blocked ([inventory.js:135](../js/core/inventory.js#L135)) and a Spirit Shrine cleanse exists
([world.js:643](../js/core/world.js#L643), [screens.js:1749](../js/ui/screens.js#L1749)) — but
nothing places the ring in the world, so **the entire cursed-trap feature is inert.**
- **Data smell:** it is a "ring" that equips in the **`head`** slot with `armor 18` at
  `levelReq 1` (trap bait). There is no `ring` slot in the game; decide whether the head slot is
  intended or the item should be reslotted.
- **Fix:** place it as a chest/drop/deceptive reward so the trap can fire; resolve the slot
  question. `[invented]` (archived basis: `Cursed.md` — "cannot be removed").

## 3. Tier 2 — items that drop but have no sink (no-trade → permanent inventory clutter)

These roll on drop tables and cannot be sold (`no-trade`) or consumed, so they accumulate forever.
The quest-material drop-gate (`materialStillUseful`, [quests.js:610](../js/core/quests.js#L610))
deliberately keeps unreferenced `quest_` trophies dropping ("vacuously still-useful" — the code
names `quest_matriarch_horn` as intentional flavor), so this is largely **by design**, but the
clutter is real.

| id | name | source | tag | note |
|---|---|---|---|---|
| `quest_matriarch_horn` | Matriarch's Horn | Matriarch boss drop | no-trade | flavor trophy (referenced only in completion text) |
| `quest_eidas_echo_seal` | Eidas' Echo-Seal | Eidas' Echo drop | no-trade | trophy |
| `quest_frostram_hide` | Frost Ram Hide | Stoneback Giant drop + forage | no-trade | trophy |
| `lore_estari_shard_tablet` | Estari Shard-Tablet | drop + 2 quest rewards | lore | flavor |
| `lore_eidas_final_journal` | Eidas' Final Journal | Eidas' Echo drop | lore | flavor |

- **Options (design, pick one):** (a) accept as flavor and route `lore`/trophy items to a
  Journal/codex display instead of the inventory bag; (b) give them a small sell value (drop
  `no-trade`); (c) add a real sink — a "hand in your trophies" turn-in or a Relic recipe. Pure
  content, no sim.

## 4. Tier 3 — resolved / non-findings (documented so a re-audit doesn't re-flag them)

- `ap_stone_energy_royal` (Royal Energy Stone) — **not dead.** A working consumable
  (`combatUsable`, `energyRestore: 600`) sold at the Frosthold AA Exchange; only a scan
  false-positive (see §1). The `ap_*` family (Tourney Regalia, Gilded Crest Helm, Veteran's Edge,
  Royal Sphere, plated boots, …) are AA-Exchange stock for the kills-currency economy and are all
  reachable via `{itemId, costAp}` entries.

## 5. WIP — not a bug (user-confirmed in-progress)

`quest_wardframe_rune_shard` (drops from the new `saratus_wardframe`, forageable in
`saratus_plains`) currently has **no consuming quest or recipe**, so the audit flags it as
sinkless. This is **user-confirmed in-progress work** — uncommitted: `js/data/{areas,monsters,
items,quests}.js` are modified and `assets/icons/{saratus_wardframe,quest_wardframe_rune_shard}.png`
are untracked. It appears to implement Phase A of
[`SPEC-ARKAN-DIFFERENTIATION.md`](SPEC-ARKAN-DIFFERENTIATION.md) (an Arkan-cultural construct in
the doorstep zone + a rune-shard material). **Remaining to finish:** wire the shard's sink — the
quest collect-step and/or recipe that consumes it — or it ships as Tier-2 clutter. New monster
(`saratus_wardframe`) also needs a `/balance-sim` and a byte-distinct icon (`test_icons.js`).

## 6. Meta-finding — the game never surfaces an item's source or use

Every Tier-1/Tier-2 item "reads as useless" to a player because no screen answers *where does this
come from* / *what is it for*. The new **wiki** ([`wiki.html`](../wiki.html) / `js/ui/wiki.js`,
also WIP) is the natural home for a per-item **"Source"** (drops/shops/forage/recipes) and
**"Used for"** (recipes/quests) cross-reference, computed from exactly the reachability data this
audit builds. Adding that would (a) make drop-only quest materials legible (the Condensed Anima
Core confusion) and (b) act as a live guard against future dead items.

## 7. Recommended order

1. **T1-a dual-wield source** — highest impact (a whole shipped mechanic is unreachable), smallest
   fix (shop stock). Sim if new stats.
2. **T1-b cursed ring placement + slot decision.**
3. **Wiki Source/Used-for cross-reference** (§6) — turns this audit into a permanent, player-facing
   guard.
4. **Tier-2 clutter policy** — one design decision applied across the 5 trophy/lore items.
5. Finish the Wardframe WIP sink (§5) under the Arkan-differentiation spec.

Reachability script (repeatable): kept in scratchpad this run; can be promoted to `tools/` as a
standing "no dead items" check (and asserted in a suite) if you want it enforced.
