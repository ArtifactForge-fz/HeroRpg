---
name: release
description: Release checklist for shipping a HeroRPG version — changelog, README version, save version, suites, commit format, single-file artifact, deploy. Use when a milestone is complete and about to be committed, merged, or released.
---

# Release checklist

`test_reload.js` is the release guard — it fails if README's announced version or the
current save version disagrees with changelog entry `[0]`. Work through this list in
order; the `herorpg-ops-hazards` memory records how each item bit during a real release.

1. **Check the tree first.** `git status` + `git log` — concurrent sessions share this
   checkout; another session's commit lands on whatever branch is checked out. Never
   trust the conversation-start snapshot.
2. **Prepend a changelog entry** in `js/data/changelog.js` (player-facing wording, no dev
   jargon). The footer's version link auto-derives from entry `[0]`.
3. **Bump README** "Development status: **vX.Y[.Z]**" (guard regex accepts vX.Y.Z).
4. **Save version:** if character fields changed, confirm the bump + migration + migration
   test (v1→current chain) all landed; transient `Game.state.battle` is never persisted.
5. **Run all ten suites:** `cd tests && for t in test_*.js; do node $t; done` — each must
   exit 0. Never commit red (only exception: an explicitly user-requested WIP checkpoint).
6. **Commit:** imperative subject ≤72 chars; body says what+why, cites the DESIGN.md tag
   or spec, notes any save-version bump + migration; one bullet per feature for
   multi-feature sessions. End with the Co-Authored-By trailer per CLAUDE.md.
7. **Artifact:** the tracked post-commit hook (`tools/git-hooks/`, wired via
   `git config core.hooksPath tools/git-hooks`) rebuilds `tools/herorpg_artifact.html`
   automatically. On a fresh clone re-run that `git config` — the hooks path lives in
   untracked `.git/config`. Never build/ship from a tree with red suites.
8. **Deploy is user-gated.** `sh tools/deploy.sh --check` (read-only) then
   `sh tools/deploy.sh` — but the deploy itself is permission-gated; hand it to the user
   and report it as pending rather than retrying. Credentials in gitignored `.env`.
   Any NEW root-level HTML page must be added to `deploy.sh`'s find list or it won't
   upload. Deploy uploads only the static site — never `reference/`, `docs/`, `tests/`,
   `tools/`, `.env`.
9. **claude.ai Artifact publishing is ON HOLD** (URL owned by a different org) — do not
   attempt to publish there.
