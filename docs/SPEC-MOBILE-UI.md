# SPEC — Mobile-Enabled UI (v1.4 candidate)

Status: **planned** (spec written 2026-07-11, not started).
Tag: **[invented]** — the 2004–2008 original was desktop-only; nothing in `reference/` describes a
mobile interface. The mobile adaptation is designed in the original's spirit: the archived 2008
palette and page structure (`reference/site/theme_inline.css`) stay authoritative on desktop, and
the mobile layer only *re-arranges and re-sizes* that same theme on small screens. Where a mobile
rule overrides an archived visual (e.g. the 10px verdana body font), it is scoped to a media query
so the desktop presentation remains byte-for-byte the archived look.

Motivation: the backlogged **online/web-hosted mode** (`docs/SPEC-ONLINE-HOSTING.md`) makes the
game reachable from phones; today the game is functionally unusable there. This spec is
independent of hosting and keeps the `file://` build fully working.

---

## 1. Current-state audit (what breaks on a phone today)

Audited 2026-07-11 against `index.html`, `css/theme.css`, `js/ui/*`.

| # | Problem | Where | Severity |
|---|---------|-------|----------|
| A1 | **No `<meta name="viewport">`** — mobile browsers render at ~980px virtual width, zoomed out; everything is illegibly small and pinch-zoom is the only interaction. | `index.html` `<head>` | Blocker |
| A2 | **HTML5 drag-and-drop does not fire on touch devices** (no touch → dragstart mapping in any mobile browser). Equip/unequip/discard drop boxes are dead on touch. *Mitigation already exists:* every draggable row also gets always-visible fallback buttons (`js/ui/dragdrop.js` header comment; wired in the inventory screen). Must be verified exhaustive, and the useless drop boxes hidden on touch. | `js/ui/dragdrop.js`, `js/ui/screens.js:652-756`, `.dropbox-row` in theme.css | High |
| A3 | **Tap targets far below the ~44px minimum**: nav links `padding: 3px 8px` (`.navlist a`), buttons `padding: 2px 6px` + 9px font (`.button`), actions links `3px 8px`, battle action buttons `4px 2px`. | `css/theme.css:103-120, 219-232, 498-510, 624-637` | High |
| A4 | **9–10px verdana body font** — authentic to 2008 but unreadable on a phone; also, iOS Safari auto-zooms any focused input with font-size < 16px (`select`/`input` are 10px, theme.css:122-127). | `css/theme.css:3-18, 103-130` | High |
| A5 | **Small-screen layout**: the single existing breakpoint (`@media (max-width: 800px)`, theme.css:190-203) stacks Navigation + Actions + Save panels *above* the main content — on a phone the first screenful is all chrome, no game. | `css/theme.css:165-203`, `index.html #layout` | High |
| A6 | **Battle layout**: `.battle-left` is fixed `240px` beside a flex `battle-right` (theme.css:477-491) — cramped or overflowing under ~500px. Battle is also the one screen where nav locks, so it must be self-sufficient on mobile. | `css/theme.css:477-511`, `renderBattle` (screens.js:1783) | High |
| A7 | **Hover-only affordances**: `.tech-slot.castable:hover`, `.navlist a:hover`, `.actions-list a:hover`, and the footer's `title` tooltip have no touch equivalent. Cosmetic, but castability feedback in battle matters. | `css/theme.css` various | Medium |
| A8 | **`window.prompt()` save export/import** — functional on mobile but copying a long string out of a native prompt is miserable, especially iOS. | `index.html:253-275` | Medium |
| A9 | **Wide tables** (`.hrpg-table` in shops, inventory, academy, journal) can overflow narrow viewports with no horizontal-scroll containment. | `css/theme.css:289-298`, screens.js facility panels | Medium |
| A10 | **300ms tap delay / double-tap zoom** on some mobile browsers without `touch-action: manipulation`; `100vh` in `#app` mis-sizes under mobile browser chrome (needs `dvh` fallback). | `css/theme.css:146-154` | Low |

Non-issues (checked): the infobox overlay is already viewport-relative (`max-width: 90vw`,
`max-height: 60vh`); `alert()`/`confirm()` work on mobile (jarring but functional — polish only);
icons use `image-rendering: pixelated` which scales cleanly.

---

## 2. Design principles

1. **Desktop is untouched.** At ≥ 800px CSS width the rendered page must be visually identical to
   today. All mobile rules live inside `@media (max-width: 640px)` and
   `@media (pointer: coarse)` blocks appended to `theme.css`. No existing selector above those
   blocks is edited except where a rule is provably inert (none expected).
2. **One stylesheet, no build step, no JS framework** — same `file://` constraint as everything
   else (CLAUDE.md architecture rules). Mobile detection is CSS media queries only; the only JS
   additions are small, guarded, ES5-flavored (touch handlers, nav toggle), living in `js/ui/`.
3. **Same DOM, re-flowed** — screens.js render functions are not forked per device. Where mobile
   needs different chrome (bottom nav), the *same* nav data (`NAV_ITEMS`) renders into an
   additional container that CSS shows/hides by breakpoint.
4. **Every pointer interaction must have a tap path.** Drag-and-drop stays for desktop; buttons
   are the canonical path (they already exist per the dragdrop.js risk note — verify, don't
   assume).
5. **Authenticity boundary:** palette, panel borders, gold-on-slate identity, and pixel icons are
   preserved at every size. Only *metrics* (font sizes, paddings, layout direction) adapt.

## 3. Key layout decision — bottom tab bar (recommended)

On < 640px screens:

- **Top (sticky):** compressed status bars (HP/Energy/XP as slim stacked bars + weight inline).
- **Middle (scrolls):** `#maincontent` full-width — the game screen is the first thing visible.
- **Bottom (fixed):** a 6-tab bar from `NAV_ITEMS` (Status / Inventory / Techs / Explore / Town /
  Journal), 48px tall, icons+labels, thumb-reachable. During battle it renders the "In battle…"
  lock state exactly like the desktop nav does today (screens can't be escaped —
  `New_Player_Guide.md` rule, already enforced in `Game.renderNav`).
- **Actions panel** (Explore/Hunt/Camp/facility quick-links + quest touch tokens): becomes a
  horizontal chip row rendered directly *above* `#maincontent` (contextual, scrolls with
  content). Same data source as `Game.renderActions`.
- **Save panel**: moves behind a "⚙" item — either a 7th slot on the tab bar or a small header
  button opening the existing infobox-overlay pattern with Export/Import/New Game. (Implementer
  may choose; infobox reuse preferred — zero new overlay code.)

Alternative considered and rejected: hamburger drawer — hides navigation behind a tap in a game
where nav switching is the core loop; the tab count (6) fits a tab bar exactly.

The existing 800px breakpoint stays as-is for tablets/narrow desktop windows (640–800px keeps
today's stacked-panels behavior).

---

## 4. Phases

Phased like v1.2/v1.3: each phase implemented by a Sonnet subagent with a full up-front brief,
reviewed by the lead, all ten suites green before commit, one commit per phase.

**Branch policy (user-directed):** all work happens on a feature branch off `main`
(suggested name: `mobile-ui`). Each phase is committed green on that branch, but the branch is
**not merged to `main` until the user has personally tested the result on their own device(s)
and signed off** — user acceptance testing is a hard gate on top of the suite gate. Do not
merge, and do not treat lead review + green suites as sufficient for this spec.

### M0 — Foundation (tiny, zero visual change on desktop)
- Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to `index.html`.
- Verify `tools/build_artifact.js` carries the meta into `herorpg_artifact.html` (it templates
  from `index.html`; confirm, don't assume — and keep its 3-script-block syntax check green).
- CSS hygiene appended to theme.css: `html { -webkit-text-size-adjust: 100%; }`,
  `button, a { touch-action: manipulation; }`, `#app { min-height: 100dvh; }` guarded with the
  `100vh` fallback line kept first.
- **Gate:** 10 suites green; desktop rendering pixel-identical (manual before/after at 1100px and
  800px widths).

### M1 — Responsive shell (the layout decision in §3)
- New mobile-only DOM: `#mobiletabs` (bottom bar) + relocation of status bars/actions per §3.
  Built by the same `renderNav`/`renderActions`/`renderStatusBars` functions targeting both
  containers; CSS media queries decide visibility. No screens.js render-function forks.
- Battle: below 640px, `.battle-layout` stacks (`battle-left` full-width above `battlefield`),
  battle action buttons become a full-width grid ≥ 44px tall.
- `@media (max-width: 640px)` block in theme.css implementing all of the above; 800px block
  untouched.
- **Gate:** 10 suites green (fakedom doesn't do CSS, but the dual-container render must not break
  DOM assertions — update stale selectors in tests only if they hardcode container ids, never
  weaken behavior assertions); manual walkthrough at 390×844 (iPhone-class) and 360×800
  (Android-class) via DevTools device mode: create character → explore → hunt → win battle →
  shop → save export.

### M2 — Touch ergonomics
- `@media (pointer: coarse)` block: nav/actions/list links min-height 44px; `.button` padding up
  to ≥ 10px 14px; `select`/`input` font-size 16px (kills iOS focus-zoom); `.tech-slot` 44×44 with
  the 32px icon centered; battle log taller touch scroll area.
- Font scale on small screens: body 10px → 13px inside the 640px query (structural sizes in `em`
  where needed so panels scale coherently). Desktop stays 10px verdana **[archived]**.
- Drag-and-drop on touch: audit that *every* `makeDraggable` row has a visible button equivalent
  (equip, unequip, discard, vault deposit/withdraw if drag-wired); hide `.dropbox-row` under
  `pointer: coarse`; replace `:hover` cues with `:active` equivalents and a `.castable` static
  outline so castable techs are identifiable without hover.
- Wide tables: wrap facility/inventory tables in a `.scroll-x { overflow-x: auto; }` container
  (one helper in screens.js `el()` style, applied at each table site).
- **Gate:** 10 suites green; touch walkthrough on at least one real device (user-assisted): full
  loop incl. equipping via buttons, casting a tech in battle, buying/selling.

### M3 — Mobile UX polish (optional, separately committable)
- Replace `window.prompt` save export/import with an infobox-pattern modal containing a
  `<textarea>` (select-all on focus) + a clipboard-API copy button when available (guarded — the
  API needs a secure context; on `file://` the textarea path is the fallback).
- Replace high-frequency `alert()` results (Hunt/Camp/touch tokens) with a small inline toast
  under the actions row. Low-frequency confirms (`New Game`) stay native.
- Landscape-phone sanity pass (tab bar stays usable at ~430px height).
- **Gate:** 10 suites green; regression walkthrough of M1's script on both orientations.

Out of scope (explicitly): PWA manifest/service worker and offline install — belongs with
`SPEC-ONLINE-HOSTING.md` (a service worker is pointless on `file://`); dark/light theming; any
gameplay change. No save-version change anywhere in this spec — it is purely presentational.

---

## 5. Testing & risks

- **Suites:** the ten suites are behavioral/DOM, not visual — the risk is M1's dual-container nav
  breaking hardcoded element lookups. Rule per CLAUDE.md: update stale constants/selectors, never
  weaken behavioral assertions. Add one new cheap assertion where natural: `index.html` contains
  the viewport meta (can live in the artifact-builder smoke test, which already parses
  `index.html`).
- **fakedom quirk** (CLAUDE.md Testing): dynamically created elements lack `.style` unless the
  harness wraps `createElement` — the new mobile-tab render code must tolerate that the same way
  screens.js does.
- **Manual matrix:** DevTools device emulation every phase; at least one real iOS Safari and one
  Android Chrome session before calling the spec done (Safari is where input-zoom, `dvh`, and
  clipboard quirks live).
- **Biggest risk:** CSS regressions bleeding into desktop. Containment strategy is structural
  (all new rules inside the two media-query blocks, appended at file end) — review checks the
  diff touches nothing above the append point.
- **Artifact build:** rebuild via the post-commit hook each phase and spot-check
  `herorpg_artifact.html` on a phone-sized viewport — the artifact inlines this CSS and must
  inherit the fixes for free.
