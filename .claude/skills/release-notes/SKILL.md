---
name: release-notes
description: Draft or refresh justdummies.io's GitHub release note — a product-facing account of what changed since the previous release/* tag, kept as the "Unreleased" section of RELEASE_NOTES-en.md / RELEASE_NOTES-fr.md. Use when asked to draft, write, or update release notes, or before tagging a release.
---

# Release notes

**A release note is not a commit log.** This repository has no curated `CHANGELOG.md` to draft
from — unlike the library beside it (`Reefact/just-dummies`), justdummies.io publishes one
artefact, not versioned packages (`CONTRIBUTING.md`, "No release trains"). So the source here is
the commit and pull-request history since the previous `release/*` tag, read and rewritten by
hand into product terms — never pasted verbatim, never a list of PR titles. `git log
<previous-release-tag>..HEAD --oneline` and the merged PRs' own descriptions are where you start
reading, not what you publish.

## Where it lives

One pair of files, at the repository root: `RELEASE_NOTES-en.md` and `RELEASE_NOTES-fr.md`.
Keep-a-Changelog-shaped:

* `## Unreleased` — always present, even when empty (`_Nothing pending yet._`). This is where a
  release is drafted, before it has a tag.
* One `## release/<tag> — <Month> <day>, <year>` section per past release, newest first.

## Format

```
## release/<tag> — <Month> <day>, <year>

_<optional one-line theme, the way a maintainer would summarise it to someone deciding
whether to look at what's new — omit rather than force one>_

### ✨ New
### 🙌 Improvements
### 🐛 Fixes
```

Rules:

* **Keep only the categories that have content**; delete the empty ones, never print an empty
  heading. If a release genuinely carried nothing a visitor would notice (a dependency bump, a
  CI-only change, a maintainer-doc wording fix), skip the categories entirely and write one calm
  sentence instead — e.g. *"Internal maintenance only — no visible change on the site."* — never
  an empty section: `scripts/release-notes.sh` refuses a release whose section is empty.
* **One bullet, one sentence you could read aloud.** Say what a reader would notice — a new page,
  a fixed bug, a changed layout — not which pull request carried it. No PR numbers, no
  commit-type prefixes (`feat`/`fix`/`docs`/`ci`), no internal filenames unless a reader would
  genuinely care.
* **Collapse, don't enumerate.** Several pull requests often build one visible thing in stages
  (a page's three sections landing across three PRs, a bug fixed and then refined in a
  follow-up). Describe the outcome once, not once per commit.
* **Invent nothing beyond what the commits and PR descriptions state.** If it isn't there, it
  isn't in the note.
* **Calm, not marketing.** No superlatives the change itself doesn't earn — a product
  announcement, not a press release.
* **Every link is a full `https://github.com/Reefact/justdummies.io/blob/main/...` URL, never a
  relative one.** This file is read two ways a repository file normally is not: as a file here
  (where a relative link works) and pasted verbatim into a GitHub Release body, which has no
  directory of its own — a bare `docs/...` resolves to nothing there.
* **One physical line per paragraph and per bullet — never hard-wrap prose inside a list item.**
  A GitHub Release body is "user content" like an issue or a pull-request comment: GitHub
  renders a lone newline there as a literal line break, not as the collapsed space a repository
  file's CommonMark rendering gives it. Let the editor soft-wrap on display; do not insert the
  newline into the file yourself.
* **French follows English**, same section order, same heading depths — `RELEASE_NOTES-fr.md`
  has no automated parity check (unlike the library's `TranslationParityTests`), so this is kept
  by discipline. Product terms travel unchanged (`playground`, `JustDummies`, a URL) — see how
  `apps/site/src/i18n/ui.ts` treats the same words. `release note`/`release notes` is one of
  these: the audience is developers, so keep the English term — never "note de version".

## Before tagging a release

`scripts/release-notes.sh <tag>` reads the section headed exactly `## <tag>` from
`RELEASE_NOTES-en.md` at tag time and refuses the release — loudly, in CI, before the release
page is written — rather than falling back to anything commit-derived, if that section does not
exist (ADR-0017). Because a `release/*` tag here is a UTC timestamp decided at the moment of
tagging (ADR-0001), not a version chosen in advance, the section has to be titled *after* you
know the exact tag and *before* you push it:

1. Review `git log <previous-release-tag>..HEAD` and the merged PRs since the last release, and
   write or refresh `## Unreleased` in both files, following the format above.
2. Once ready to release: compute the tag exactly as the deployment guide's Step 7 does (read
   the clock once), then **retitle `## Unreleased` to that exact tag** — `## release/<tag> —
   <Month> <day>, <year>` — in both files, and add a fresh, empty `## Unreleased` above it for
   next time.
3. Commit that to `main` and let CI go green, **then** run the tag-and-push ritual.

**Tagging and pushing stay the maintainer's own action.** This skill prepares the release; it
does not push a release tag on its own authority.
