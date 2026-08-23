# ADR-0026 | /docs topics pin to the tag of the train that owns them

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0026-les-sujets-de-docs-sepinglent-au-tag-du-train-qui-les-possede-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-23
**Decision Makers:** Reefact

## Context

ADR-0013 decided that content this site mirrors from the library is taken as one atomic snapshot at
a published release tag, and left open, as a named risk and a Follow-up Action, which tag a `/docs`
snapshot spanning four independently-versioned trains should anchor to: *"Four trains touch one
shared corpus, so which tag a snapshot is taken at is not read off the corpus itself. Left unstated
it becomes whatever the first implementation did, which is how a decision turns into an accident."*
This record is that implementation, made a decision rather than an accident.

`doc/handwritten/for-users/` in [`Reefact/just-dummies`](https://github.com/Reefact/just-dummies)
holds four kinds of page: eight guides, a generator reference of six pages, four package pages — one
per published package — and thirty-three analyzer rule pages. The four packages ship on trains that
version independently, each cut by its own tag (`lib-v*`, `xunit-v*`, `catalog-v*`, `cli-v*`); the
analyzers ship bundled inside `JustDummies` itself, on the `lib` train
(`tools/trains.sh`). Guides and the generator reference describe the library as a whole and are not
owned by any one package.

`/release-notes` (ADR-0019, ADR-0020) answers a related question differently: it takes the single
newest tag across every train, whichever train cut it, because a release-notes page for one train
still has to be read against what every other train most recently said. A `/docs` package page has
no such need — a reader of `packages/justdummies-cli.md` is reading about the CLI, not about
whichever package happened to release last.

Building the generator (`scripts/generate-docs.mjs`) surfaced a fact ADR-0013's Context could not:
`packages/justdummies-xunit.md` does not exist at `xunit-v1.0.0-preview.1`, the only tag the xunit
train has ever cut — the page was written after that release, and no later xunit release has
happened since. Pinning strictly to "the topic's own train's newest tag" is therefore not always
answerable from what has been published.

## Decision

**A guide, a generator-reference page or an analyzer rule pins to the `lib` train's newest tag; a
package page pins to its own train's newest tag that actually contains the file, and falls back to
the chronologically newest tag of any train, in that order, if its own train has none.**

## Rationale

Pinning package pages to their own train, rather than to the single newest tag `/release-notes`
uses, keeps a page's version numbering meaningful to the one thing a reader of that page is
installing: `packages/justdummies-cli.md` names the CLI's own version, not whichever package shipped
most recently. A CLI-only release then refreshes only the CLI page's pin, which is the same
narrowing ADR-0013's "mirror per train, or per section" alternative rejected *for `/release-notes`*
on the grounds that it composes refs the library's own link-and-sample verification never ran
together — a constraint that does not weaken here: this generator still refuses two languages of one
topic read at different refs (§6.4), it simply allows two different *topics* to be pinned at two
different refs, which `/release-notes` already does across trains today.

Guides, the generator reference and the analyzers are not any package's own documentation — they
describe the library — so `lib`, the train that publishes the library itself and the one every other
train depends on, is the one train a page about `Any.Int32()` or `JD014` can meaningfully be said to
belong to.

The cross-train fallback is not a weaker rule adopted for convenience; it is the same
"newest published tag that actually contains the file" reasoning `fetchTopic` already applies within
one train, extended past that train only when the train's own tags cannot answer it. `main` is never
read — every candidate is still a tag some release run actually cut. The alternative, refusing the
snapshot outright until the xunit train releases again, was rejected: it would keep a real,
published, correct page dark over a fact about *when* a different train last tagged, which is exactly
the kind of accidental coupling this record exists to name and settle rather than repeat.

## Alternatives Considered

### One tag for the whole `/docs` snapshot, as `/release-notes` does

Considered because it is the existing precedent (ADR-0013's own prior art) and the simplest rule to
state: one ref, every page pinned to it.

Rejected because a package page's version would then read as whichever train happened to release
last, unrelated to the package the page is actually about — a CLI page could carry a `lib-v*` tag the
day the library ships and the CLI does not, which misstates what "pinned to a release tag" is meant
to promise: the version the reader is being told to install.

### Refuse the snapshot when a topic's own train has no tag containing it

Considered as the strictest reading of "pinned to a published tag": if the xunit train has not
re-released since its own package page was written, `/docs` should not claim otherwise.

Rejected because the file is real, published, and correct at a real tag — just not one of xunit's
own. Refusing the whole snapshot over that fact blocks 50 unrelated topics for one train's release
cadence, and does so silently: nothing about the *content* is wrong, only the train that happens to
have most recently tagged it.

## Consequences

### Positive

A package page's pinned tag is the version a reader installing that package actually cares about,
most of the time — the common case, where a train has released since its own docs were last touched.

Guides, generators and analyzers move together with the library's own releases, which is what they
describe.

### Negative

A page's frontmatter `ref` is not always predictable from its `section` alone — the cross-train
fallback means a package page can occasionally carry a tag from a different train, and a reader
inspecting the pin has to read it rather than infer it from the page's URL.

### Risks

**The fallback can mask a train that has genuinely stopped releasing.** A package whose train never
tags again keeps serving a stale page pinned to another train's tag indefinitely, with nothing
flagging it — the same staleness ADR-0013 assigns to `scripts/check-package-freshness.mjs`, which
does not yet read this snapshot.

## Follow-up Actions

* `scripts/check-package-freshness.mjs` (ADR-0013) does not read `/docs`'s snapshot. Extending it to
  compare each package page's pinned `ref` against that train's latest published tag would surface
  the risk above the same way it already does for `site.ts`.
* `JustDummies.Documentation.UnitTests`, which ADR-0013's Context names as the four contracts a
  mirror inherits, verifies the corpus at one ref at a time in the library's own repository. Each
  `/docs` topic here is pinned independently, so the guarantee this site inherits is "each topic was
  verified at the ref it is pinned to," not "the whole `/docs` corpus was verified together" — worth
  restating precisely if a future reader assumes the latter.

## References

* [ADR-0013](0013-mirrored-library-content-is-pinned-to-a-release-tag-en.md) — the pinning rule this
  record settles the open question of, and the risk it names
* [ADR-0019](0019-the-release-notes-page-mirrors-the-librarys-release-notes-files-en.md),
  [ADR-0020](0020-one-release-notes-page-per-train-and-major-en.md) — `/release-notes`'s own pinning,
  contrasted with the per-train choice here
* `tools/trains.sh` in `Reefact/just-dummies` — the train partition, and where analyzers are declared
  bundled into `lib`
* `scripts/generate-docs.mjs` — the generator this decision governs
