# SPEC — Online / Web-Hosted Mode (character persistence + global chat)

**Status:** Backlog, not started. Authored 2026-07-10. Companion to `docs/SPEC-FULL-LEVEL-ARC.md`
(orthogonal axis — online mode works with either the condensed or the full-100 arc).
**Owner model:** lead drafts/reviews; Sonnet subagents do the adapter refactor and integration work.
**Relationship to authority:** This **[revised]** reopens two features DESIGN.md §9 / level-arc spec
§11 list as "cut for v1": **persistent chat** and **cross-session character retention across
devices**. Everything else cut in §9 (mail, trade, auction, PvP, factions, pets) stays cut here —
they are deferred to the server-authoritative track (Option 3) if ever. The original was the online,
social version, so this is "similar to the original" by design.

---

## 1. What's being asked, and the hard constraint

Two asks:
1. **Retain characters between sessions** — save state that survives across devices/browsers, not
   just per-browser localStorage.
2. **Persistent chat between all players** — a shared, history-backed message channel.

**The hard constraint:** cross-player chat cannot be done from pure static files — it requires a
backend of some kind. Character retention *can* be done without one (localStorage or an export
string), but only per-device. So the design question is **how much backend**, and the options below
are a ladder from zero to a full server-authoritative revival.

**Load-bearing architectural principle (applies to every option):** the current
"no-server / `file://` / no-deps / single global `Game` namespace / pure-state-machine core"
architecture is a cardinal rule *and* an asset — the entire game logic is already portable and
self-contained. Online mode must be **additive and optional**, layered behind a thin persistence/
network seam, so:
- the **offline single-file artifact keeps working unchanged** (default deployment),
- the ten test suites and `js/core/*` purity are untouched,
- online is a *deployment target*, not a rewrite.

This mirrors the existing discipline of a single RNG stub surface (`Game.Battle._rng`): introduce a
**single persistence-adapter surface** and route all save/load and chat through it. See §4.

---

## 2. Options ladder

| # | Option | Char retention | Chat | Backend | Cost | Effort | Keeps offline build? |
|---|---|---|---|---|---|---|---|
| 0 | **Static host, local saves** | Per-device localStorage + export/import string | ❌ none | none | free | ~0 | yes (unchanged) |
| 1 | **BaaS (managed auth+DB+realtime)** ← recommended | Cloud save keyed to identity | ✅ persistent global | managed (Supabase/Firebase) | free tier → low-$ | moderate | yes (online is a separate target) |
| 2 | **Custom lightweight backend** | Cloud save via REST | ✅ WebSocket/SSE | you run a small service + DB | low–moderate + ops | high | yes |
| 3 | **Server-authoritative MMO-lite** | Server owns state | ✅ + full social layer | full stack | moderate + real ops | very high | partially (client becomes a view) |

### Option 0 — Static host, local saves only
Deploy the existing files to any static host (GitHub Pages, Netlify, Cloudflare Pages, itch.io, or
the current Claude artifact). Character retention = localStorage per browser, plus the **export/
import save string** already planned in DESIGN.md §10.2 for manual backup/transfer. **No chat.**
This is the honest zero-backend baseline — "web-hosted" but not the original's social experience.
Value: it's essentially free and already built (`tools/build_artifact.js` produces the single file).

### Option 1 — Backend-as-a-Service *(recommended sweet spot)*
Use a managed platform that bundles auth + database + realtime pub/sub with row-level security —
e.g. **Supabase** (Postgres + Auth + Realtime + RLS; a Supabase connector is even wired into this
project's tooling) or **Firebase** (Firestore + Auth + Realtime).
- **Character retention:** on session start the client signs in (anonymous device identity, or an
  optional email/OAuth account), loads its `saves` row (the same versioned JSON blob we store today),
  and autosaves on change. **The existing client-side `migrate()` chain still runs on load** — a
  cloud save at an older version upgrades exactly as a localStorage save does today.
- **Chat:** a `messages` table + a realtime subscription gives persistent global chat with history
  essentially out of the box; RLS + a rate-limit policy provides baseline abuse control.
- **Game logic stays 100% client-side.** The BaaS is only persistence + pub/sub; little or no custom
  server code (maybe a couple of edge functions for validation later).
- **Trade-off:** the online build introduces a dependency and a build step and does **not** run from
  `file://` — which is exactly why it must be a *separate, optional target* behind the §4 seam while
  the offline artifact stays pristine. Generous free tiers; scales to low single-digit $/mo at hobby
  player counts.

### Option 2 — Custom lightweight backend
A small Node/Deno/Cloudflare-Workers service + a DB (SQLite/Postgres/D1) + WebSocket or SSE for
chat; auth via a library or a hosted pub/sub (Cloudflare Durable Objects, Ably, Pusher).
- More control: can add **server-side save validation** (reduce cheating), presence ("who's online"
  like the original's *Online Users* list), and is the natural stepping stone to the social layer.
- More to build, secure, operate, and pay for. Choose this only if BaaS limits actually bite.

### Option 3 — Server-authoritative MMO-lite (faithful to the original)
Move the game state machine (or a validating subset) server-side so battles/economy/leaderboards are
authoritative; the client becomes a view. Unlocks the original's real social systems — cross-player
economy, **mail/trade/auction**, PvP, factions, global top list. This is effectively rebuilding what
the original PHP/MySQL server did: a fundamentally different project with ongoing ops, security, and
moderation. Only pursue if the ambition is a genuine persistent-world revival.

**Recommendation:** target **Option 1**. It delivers both asks (cloud character retention + persistent
global chat) with minimal backend, preserves the offline build and the pure core, and leaves a clean
upgrade path to Option 2/3. Ship Option 0 immediately as the free public baseline regardless.

---

## 3. Cross-cutting concerns (apply from Option 1 up)

- **Identity model.** *Anonymous* (a generated device key) = lowest friction but characters are lost
  if the key is lost and can't move devices. *Accounts* (email/OAuth) = cross-device + recoverable
  but adds friction and data-handling duties. **Recommend:** start anonymous, offer an optional
  "claim your character" upgrade to a real account (BaaS anon→permanent linking supports this).
- **Save authority / anti-cheat.** Client-authoritative saves are trivial to edit (localStorage/JSON).
  For a friendly hobby revival that's mostly fine — cheating hurts only the cheater — **except** it
  pollutes anything *shared* (chat identity, leaderboards). If leaderboards/social matter, add
  server-side validation (Option 2/3). Note this explicitly; don't let it surprise anyone later.
- **Chat is a public service, not a feature toggle.** Persistent global chat obliges you to run:
  rate-limiting, profanity/spam filtering, block/report, a retention policy, and **XSS-safe
  rendering** — chat text must go through the `el()` text-node path (as `textContent`), never
  `innerHTML`. A dedicated **security review** (`/security-review`) is mandatory before any chat
  goes live: XSS, auth-token handling, and RLS-policy correctness are the top risks.
- **Minor-safety & privacy/legal.** The original's audience skewed young (its forum enforced
  "no offensive names"). Accounts + chat + minors implies COPPA/GDPR-style obligations (age gating,
  data deletion, a privacy policy, moderation). Decide the posture *before* launch, not after.
- **Cost & ownership.** Someone must own uptime, backups, abuse response, and the bill. Free tiers
  cover small scale; name the operator/moderator as part of the decision, not an afterthought.
- **Forward-safe migrations across clients.** Multiple clients at different code/save versions will
  hit the same DB. Keep saves as opaque versioned blobs migrated **client-side on load** (reuse the
  existing chain); keep any server schema (chat, identity) additive and back-compatible. Never let
  the DB assume a single save version.
- **The Claude artifact can't host this.** The current deploy target is a single static HTML
  artifact — no cross-user backend. Chat/cloud-save need a real host (Option 1+); the artifact stays
  as the offline demo.

---

## 4. The persistence-adapter seam (the enabling refactor — do this first, offline-only)

Introduce one indirection so online is additive:

- Define a small adapter interface, e.g. `Game.Persistence` with `load()`, `save(state)`, and
  (online only) chat hooks `sendMessage(text)` / `onMessage(cb)`. `js/core/save.js` calls the
  adapter instead of touching `localStorage` directly.
- **Default adapter = localStorage** — byte-for-byte current behavior; the offline artifact and all
  ten suites are unchanged (this is the acceptance test for the refactor: zero behavioral diff
  offline).
- **Online adapter = BaaS** — swapped in only in the hosted build via the existing bundler's
  patch-one-line pattern (same mechanism `Game.UI.icon` uses for the artifact). Core `js/core/*`
  modules stay DOM-free and network-free; only the adapter and a thin chat UI panel are online-aware.
- Chat UI is a new `js/ui/*` panel that renders from adapter events via `el()`; it is inert (hidden)
  in the offline build.

This seam is the single most important design decision — it's what lets "similar to the original"
coexist with the cardinal offline rules instead of replacing them.

---

## 5. Phasing (green, committable sub-phases)

- **O1 — Persistence-adapter seam (offline-only, no backend).** Refactor `save.js` behind the
  adapter; localStorage adapter reproduces current behavior exactly; suites green; artifact
  unchanged. Pure de-risk, zero new dependencies. **Do this even if online never ships** — it's
  clean regardless.
- **O2 — Hosted static + cloud saves.** Stand up the BaaS project; anonymous identity; save
  row + autosave/load with the existing migration chain running on cloud loads. **Delivers
  character retention.**
- **O3 — Persistent global chat.** `messages` table + realtime subscription; XSS-safe `el()`
  rendering; rate-limit + report/block + basic moderation; security review. **Delivers chat.**
- **O4 — Accounts & cross-device (optional).** Email/OAuth upgrade from anonymous; "claim your
  character"; privacy policy + data-deletion path.
- **O5 — (optional, later) hardening / social.** Server-side save validation, presence/"online
  users," leaderboards — the on-ramp to Option 3 if desired.

O1 is prerequisite for all; O2 and O3 are independent after it; O4/O5 are optional.

---

## 6. Open decisions (resolve at O2 kickoff)

- **N1 — Ambition level.** Option 1 (recommended) vs. committing to Option 2/3? Sets the whole scope.
- **N2 — Identity.** Anonymous-only, accounts-only, or anon-with-optional-upgrade (recommended)?
- **N3 — BaaS choice.** Supabase (Postgres/RLS; connector already in tooling) vs. Firebase vs. custom.
- **N4 — Save authority.** Trust the client (simple, cheatable) or server-validate (needed only if
  leaderboards/competitive social matter)?
- **N5 — Chat scope & moderation ownership.** Single global room (like the original's chatbox) vs.
  rooms; and *who* moderates + the minor-safety/legal posture.
- **N6 — Operator & budget.** Who owns uptime, backups, abuse response, and the (small) bill?

## 7. Out of scope (for this spec)

Server-authoritative gameplay and the full original social layer (mail, trade, auction, PvP,
factions, pets) — those live in Option 3 and are not planned here. This spec covers exactly the two
asks: cross-session character retention and persistent global chat, delivered with the least backend
that does the job while preserving the offline build.
