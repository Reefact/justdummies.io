# ADR-0020 | One release notes page per train and major

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0020-une-page-de-release-notes-par-train-et-par-majeure-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-18
**Decision Makers:** Reefact

## Context

`/release-notes` is one page holding everything the library has ever published. The four trains are
stacked in the markup, one panel each, and a script turns them into a tab widget at run time —
attaching `role="tab"`, `role="tabpanel"` and the selection state, then unhiding the tablist, which
is the shape [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) requires of a control
that cannot act without scripting.

Inside a panel, every release of that train is rendered, and every section shows three bullets
before folding the rest behind a `<details>` labelled "+N more". The fold exists because the page
holds four trains' entire histories at once.

[ADR-0019](0019-the-release-notes-page-mirrors-the-librarys-release-notes-files-en.md) changes what
the page is built from: one file per train and major version, ten of them today, with `lib` carrying
two majors and the other three trains one each. The file's own structure is three levels — the
major, its releases, and each release's rubrics.

The site's other reference section is already a set of sibling pages: `/api` is eight routes sharing
a sticky sidebar that collapses into a native disclosure below 56rem, with no widget to build at run
time.

`/release-notes` is linked from the footer of every page on the site.

Route segments are identical in every locale and the default locale is unprefixed (§7.1, §7.2).
`apps/site/src/i18n/routing.ts` reads the set of known routes from the page files themselves at
build time, and states that dynamic routes are not handled: adding one means teaching that module
about it deliberately, rather than discovering that a language selector quietly stopped appearing.

`public/_redirects` is hand-written and carries forty lines documenting two Cloudflare behaviours
that were measured rather than reasoned about — a splat rule silently discarded as an infinite loop,
and a rewrite target that destroys the URL it exists to preserve. Redirects there are evaluated
before `_headers`. The site builds with `format: 'directory'`, and the host canonicalises the bare
spelling of a route to the slashed one with a temporary, uncached 307.

## Decision

**The release notes are published one page per train and major version, at
`/release-notes/{train}/v{major}`, with `/release-notes` an index of the trains rather than a
redirect into one of them.**

## Rationale

A page bounded by one major is a page whose weight stops growing with the product. The fold in
Context goes with it — it was a symptom of stacking four histories, and it costs more than it saves
once a table of contents points into the page: a link that lands on a rubric showing three bullets
of eight, with the rest behind a control, is a link that misleads, and the browser's own find
misses the folded text entirely.

Turning the trains into links rather than tabs satisfies ADR-0004 by removing the control instead of
hiding it. A link acts before any script has run, needs no roles attached at run time, and cannot
present a widget that announces itself and does nothing. It also makes the state addressable:
a reader can send someone `/release-notes/cli/v1`, which no tab selection ever allowed.

The index earns its place rather than standing in for a redirect. `/release-notes` is in the footer
of every page, so a redirect would put an extra, uncached hop on the normal path rather than on an
edge case, and its target would move with every new major — which means generating part of a
hand-written file whose forty lines exist precisely because its rules are subtle and were got wrong
twice. And the index answers something no per-train page answers: what moved most recently, across
all four trains, which is the question a visitor arriving from the footer usually has.

The major is spelled `v1`, not `1.x`, although the upstream file is named `RELEASE_NOTES-1.x`. A dot
in a path segment reads as a file extension to the host's canonicalisation, and this repository has
already paid twice for assuming how that canonicalisation behaves. `v1` has no such ambiguity, and
the mapping back to the file is the generator's business, not the reader's.

Teaching `routing.ts` about these routes is the deliberate act its own comment asks for, and it is
cheap here because both locales always exist for a page: ADR-0019's generator refuses a major whose
two languages disagree, so a route that exists in one locale exists in the other.

## Alternatives Considered

### Keep one page and switch majors in the client

Considered because it changes no route, keeps the footer link landing on content, and the data is
already per-major after ADR-0019.

Rejected because it needs scripting to reach content — the failure ADR-0004 exists to prevent — and
because the page's weight would still grow with every release the library ever publishes, which is
the problem the fold was invented to hide.

### One page per train, with every major stacked

Considered because it is fewer routes, needs no index, and keeps a train's whole history in one
place for a reader who wants to scroll it.

Rejected because it re-creates the unbounded page one train at a time, and it makes the major level
of the sidebar decorative: every entry would be an anchor into the same document, so the reader
never gets a page that is about one major.

### Redirect `/release-notes` to the newest major of `lib`

Considered because it is the shortest path to content for a reader who clicks the footer, and it
keeps one advertised URL for the section.

Rejected for the cost named in Rationale: a moving target inside a hand-written rules file, and an
uncached hop on the site's most-linked route. The index gives the same reader a useful page instead
of a wait.

## Consequences

### Positive

* No script is needed to reach any release note, in any train, in any major.
* Every major has a URL that can be shared, indexed and linked from the library's own documentation.
* Each page's weight is bounded by one major rather than by the product's whole history.
* The "+N more" fold disappears, so what the table of contents points at is what the reader sees.

### Negative

* The section grows from two routes to twelve, and every one of them must exist in both locales.
* A reader who clicks the footer link now lands on an index and chooses a train, where previously
  the core library's notes were already on screen.
* `routing.ts` gains knowledge of a route shape it does not read from the file system.

### Risks

* **A major is published and its route never appears**, because the index the routes are generated
  from was not refreshed. That is the same refresh ADR-0019 already governs, and the page states the
  tag it was taken at.
* **The `v{major}` segment behaves unexpectedly on the host**, as two other path assumptions did.
  The browser checks request each generated route and assert a 200 rather than trusting the build.

## Follow-up Actions

* `tests/browser/release-notes.spec.ts` requests every train-and-major route in both locales and
  asserts each answers 200 with its own content — that is what fails if a route stops being
  generated or the host mangles the segment.
* The same suite checks that a train page is reachable and readable with scripting refused, which is
  what would fail if a control ever came back between the reader and the content.
* `docs/design/specification.md` §7.2 records the section's route shape; the majors themselves are
  snapshot facts and stay unlisted, as §7.2 already requires of leaf pages.

## References

* [ADR-0019](0019-the-release-notes-page-mirrors-the-librarys-release-notes-files-en.md) — what the
  pages are built from.
* [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) — a control appears only when it can
  act.
