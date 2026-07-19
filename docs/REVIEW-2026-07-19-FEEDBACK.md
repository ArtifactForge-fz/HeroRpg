# REVIEW — user playtest feedback (received 2026-07-19, post-v1.8.0)

The feedback referenced by the v1.8 cycle-opening prompt (the SPEC-V1.8 §0 placeholder),
delivered after v1.8.0 shipped. Five findings (originally in Dutch, translated), triaged
against the shipped tree. Three were already fixed by v1.7/v1.8; the two open ones shipped
as **v1.8.1** (same session).

| # | Finding (translated) | Status | Resolution |
|---|---|---|---|
| 1 | Start town Saratus only reachable from L14 for an Arkan after leaving | **[fixed in v1.7]** | P-U home-town travel-UI exemption — renderExplore mirrors `travelTo`'s race-aware exemption (SPEC-V1.7-CONTENT-UX; memory `bug-arkan-saratus-travel-ui`) |
| 2 | Money is not shown in the shop | **[fixed in v1.8.0]** | Persistent gold readout in `Game.renderStatusBars` (index.html), visible on every screen incl. shops; every gold-mutating flow re-renders (P4 audit) |
| 3 | Vault shows Platinum+Gold; the rest of the game speaks plain gold; deposit/withdraw gold-only | **[v1.8.1]** | Display-only inconsistency — platinum is archived (`Gold.md`: 100g = 1p) and `depositGold`/`withdrawGold` always auto-converted. Fix: shared `Game.UI.formatMoney` (screens.js) used by the Status wealth line, both vault balance rows, and the status-bar readout — plain `Ng` until platinum exists, then `Xp Yg (Ng total)`; plus a vault hint line stating the 1p=100g rate and that field amounts are gold with automatic conversion |
| 4 | Dual Wield is a skill but no weapon can be equipped offhand | **[fixed in v1.8.0]** | Audit T1-a — twinfang/cestus shop-stocked + the six-item P0-locked offhand ladder to L35 (`558a20d`) |
| 5 | Magic skills don't show the scaling v1.6 added | **[v1.8.1]** | `skillEffectFor` (screens.js) returned `''` for all five schools — the v1.6 CB-2 scaling (`MAGIC_SKILL_DAMAGE_PER_LEVEL`, battle.js `techEffectivePower`) was live but invisible. Fix: magic-school branch mirroring the shipped formula: `+X% spell power with <school> techniques` |

Both v1.8.1 fixes are display-only mirrors of shipped formulas — no combat constant changed,
no sim required, save version unchanged (10).
