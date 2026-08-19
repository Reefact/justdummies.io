# ADR-0019 | The release notes page mirrors the library's release-notes files

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0019-la-page-des-release-notes-reprend-les-fichiers-de-notes-de-la-bibliotheque-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-18
**Accepted:** 2026-08-19
**Decision Makers:** Reefact

## Context

`/release-notes` is built by `scripts/generate-release-notes.mjs`, which reads each package's
`CHANGELOG.md` from the library's `main` branch and turns it into
`apps/site/src/generated/release-notes.json`. The script states its own reason for reading the
changelog rather than GitHub's release bodies: at the time it was written, a release's GitHub notes
were drafted from pull request titles, and the changelog was the only account written for someone
deciding whether to upgrade.

That premise no longer holds upstream. The library's ADR-0074 requires a release's GitHub notes to
be drafted by hand and refuses to tag without them, and its release workflow reads those notes from
a committed file: `<Train>/RELEASE_NOTES-<major>.x.en.md`, one per release train and major version.
Measured on 2026-08-18, at `catalog-v1.0.0-preview.3`, the library holds ten such files — four
trains, five majors, each with a French twin:

| Train | Files |
|---|---|
| `lib` | `JustDummies/RELEASE_NOTES-0.x.{en,fr}.md`, `RELEASE_NOTES-1.x.{en,fr}.md` |
| `xunit` | `JustDummies.Xunit/RELEASE_NOTES-1.x.{en,fr}.md` |
| `catalog` | `JustDummies.DiagnosticCatalog/RELEASE_NOTES-1.x.{en,fr}.md` |
| `cli` | `JustDummies.Cli/RELEASE_NOTES-1.x.{en,fr}.md` |

Each file carries a `#` title, then one `##` per release (`1.0.0-preview.2 — August 18, 2026`),
then one `###` per rubric — `⚠️ Breaking changes`, `✨ New`, `🙌 Improvements`, `🐛 Bug Fixes`, and
in the French twin `⚠️ Changements cassants`, `✨ Nouveautés`, `🙌 Améliorations`, `🐛 Corrections`.
Across all ten files the markup is headings, `- ` bullets, and four inline forms: code spans, bold,
italics and links. The two languages hold the same releases and the same rubrics, release for
release.

The changelogs those files summarise are Keep a Changelog: `### Added`, `### Changed`, `### Fixed`,
`### Notes`, `### Requires`, `### Refused, on purpose`. They exist in English only. To display them
this repository carries a table of ten translation keys (`releaseNotes.category.*`) and a fallback
to the raw English label for a category it does not recognise.

`/fr/release-notes` therefore renders English prose today, marked `lang="en"` so a screen reader
switches pronunciation for it. §6.4 requires that a page exist in a locale only if it is genuinely
translated there.

[ADR-0013](0013-mirrored-library-content-is-pinned-to-a-release-tag-en.md) decided that content this
site mirrors from the library is taken as one atomic snapshot at a published release tag, and named
this page's mirror-from-`main` as the precedent it deliberately does not follow.

The library's tags carry their own timestamps, and the trains are cut independently. Measured on
2026-08-18: `catalog-v1.0.0-preview.3` at 22:31 and `lib-v1.0.0-preview.2` at 22:02. At the `lib`
tag, the `catalog` notes stop one release short; at the `catalog` tag, both trains are complete. The
snapshot this repository currently ships was taken on 2026-08-16 and holds neither release.

## Decision

**What `/release-notes` publishes is the library's own product-facing release-notes files, read in
both languages at the library's most recent release tag.**

## Rationale

The two documents in Context are written for two readers, and this page has only one of them. The
changelog is the technical record — every constraint, every edge case, every ADR, in the words of
the release-notes files' own header — while the release-notes file is the account written for
someone deciding whether to upgrade, which is what the page's lead already promises. Publishing the
changelog was reading the right repository and the wrong document.

§6.4 is the sharpest gain. The French half of the corpus exists, is complete, and is held to parity
upstream; mirroring it satisfies in one step what `lang="en"` currently exists to apologise for. The
same move deletes the ten-key category table: a rubric arrives in the reader's own language because
the file it came from is already in that language, so a rubric the library invents next year is
translated on arrival rather than falling back to English text.

Reading at a tag rather than at `main` is ADR-0013's argument applied where ADR-0013 said it was not
yet applied, and it costs nothing here that it did not already cost for documentation. That the ref
must be the most recent tag *whatever train cut it* follows from the measurement in Context: two
tags twenty-nine minutes apart do not contain the same release notes, and only the later one
contains everything published so far.

Nothing about this weakens the guarantee that the site displays no fact typed by hand. The mirror
fails loudly instead: a major version named by a tag whose notes file is missing, or two languages
holding different sets of releases, stop the generator rather than publishing a page that is
complete in one language and short in the other.

## Alternatives Considered

### Keep reading the changelogs

Considered because it is the existing precedent, it needs no change at all, and the changelog holds
strictly more detail than the notes do — every entry, including the ones a release note collapses
into a sentence.

Rejected because more detail is not the page's job, and because the detail is only available in
English. Publishing it means either keeping `/fr/release-notes` in English, which §6.4 forbids as
soon as a translated source exists, or translating a corpus here that is already translated
upstream — the duplication D1 names as the price of separate repositories, paid for nothing.

### Read the GitHub Releases API

Considered because a release's body on GitHub is literally what the library publishes to its
readers, and it is the same text this decision mirrors.

Rejected because it is the same text arriving by a worse route. The bodies are English only, since
the library's packaging script emits the `-en` file; an API read carries a rate limit and an
authentication story that a file read does not; and what the API returns was frozen when the release
was cut, so a correction made to a notes file afterwards would never reach the site. The files are
the source the release bodies themselves are built from.

### Mirror both — the notes for prose, the changelog for detail

Considered because it loses nothing: the page could lead with the release note and offer the
changelog entries underneath for a reader who wants the full record.

Rejected because two accounts of one release on one page make the reader work out which is which,
and the second account is the one with no French. The changelog stays one click away, linked per
train, which is where a reader who wants the technical record is already used to finding it.

## Consequences

### Positive

* `/fr/release-notes` becomes genuinely French, and `lang="en"` comes off the prose.
* The `releaseNotes.category.*` keys and their fallback disappear; rubrics are no longer this
  repository's to translate.
* The page shows the account the library writes for consumers, matching the GitHub release bodies a
  reader may have arrived from.
* The snapshot records the tag it was taken at, so staleness is a version comparison rather than a
  judgement about a date.

### Negative

* The site's release notes trail the library's `main` by design: a correction merged upstream stays
  invisible until a tag carries it. This is the lag ADR-0013 already accepted for documentation.
* The generator now needs the library's tag list, not just a file path — one more thing that can be
  unreachable when it runs.

### Risks

* **The upstream file shape changes** — a rubric at `##` instead of `###`, a release heading that
  stops naming its date. The generator refuses rather than publishing a page with an empty section,
  and the refusal names the file.
* **A train is added upstream** and nothing here notices, so its notes are never published. The
  trains are named in this repository, as they already are; the mismatch is visible the first time
  the new train's tag appears in the tag list without a matching train.

## Follow-up Actions

* `scripts/generate-release-notes.mjs` reads the notes files at the library's most recent tag and
  refuses on a missing file or a language mismatch — the refusal is what fails when this decision is
  broken, and it is exercised by pointing the generator at a tag whose files are incomplete.
* `tests/browser/release-notes.spec.ts` asserts that the French page renders a French rubric label,
  which is what would go red if the page ever went back to the English changelog.
* `docs/design/specification.md` §7.2 records the section's routes; see
  [ADR-0020](0020-one-release-notes-page-per-train-and-major-en.md) for what they are.

## References

* [ADR-0013](0013-mirrored-library-content-is-pinned-to-a-release-tag-en.md) — mirrored library
  content is pinned to a release tag.
* [ADR-0017](0017-draft-a-releases-github-notes-by-hand-and-refuse-without-them-en.md) — the same
  decision, taken here for this repository's own releases.
* `Reefact/just-dummies`, ADR-0074 — draft a release's GitHub notes by hand, and refuse without
  them.
