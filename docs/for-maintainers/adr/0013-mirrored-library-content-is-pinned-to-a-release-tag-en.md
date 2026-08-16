# ADR-0013 | Mirrored library content is pinned to a release tag

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0013-le-contenu-repris-de-la-bibliotheque-est-epingle-a-un-tag-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-16
**Decision Makers:** Reefact

## Context

The specification's route tree (§7.2) lists `/docs`. No such route exists in `apps/site/src/pages/`,
and the documentation a visitor would read there already exists elsewhere.

The library keeps its user documentation at `doc/handwritten/for-users/` in
[`Reefact/just-dummies`](https://github.com/Reefact/just-dummies). Measured on 2026-08-16, it is 104
Markdown files, every page an English/French pair: eight guides, a generator reference of six pages
and an index, four package pages and an index, and twenty-nine analyzer rule pages and an index.

That corpus is not prose left to itself. `JustDummies.Documentation.UnitTests` holds it to four
contracts, each named in the suite's own words: the French half is *"a twin of the English one, not a
subset of it that drifted"*; every relative link resolves to something that exists; every C# sample
*"is real code that binds against the shipped packages"*; and the samples *"obey the analyzers this
product ships"*. The suite reads the working tree, so each contract is verified across one ref of the
corpus at a time.

The library publishes four packages on trains that version independently, each cut by its own tag:
`lib-v*`, `xunit-v*`, `catalog-v*`, `cli-v*`.

This repository already mirrors one thing from the library. `/release-notes` is built by
`scripts/generate-release-notes.mjs`, which reads each package's `CHANGELOG.md` from the library's
`main` branch and stamps the moment it ran. That script is deliberately outside the mandatory build,
for a reason it states: it reads a file that moves on another repository's schedule, so wiring it
into the build would fail unrelated pull requests whenever the library shipped between a commit and
CI's run. Refreshing it is therefore a manual act, and nothing in this repository signals when it is
due.

`apps/site/src/site.ts` is the single place package names, versions and install commands are written
(§14.1). Measured on 2026-08-16, against nuget.org:

| Package | `site.ts` | Latest published |
|---|---|---|
| `JustDummies` | 1.0.0-preview.1 | 1.0.0-preview.1 |
| `JustDummies.Xunit` | 1.0.0-preview.1 | 1.0.0-preview.1 |
| `JustDummies.Cli` | 1.0.0-beta.1 | **1.1.0-beta.1** |
| `JustDummies.DiagnosticCatalog` | *(not stated)* | 1.0.0-preview.2 |

The site advertises a version of the tool that has been superseded. Nothing in the repository
reported it, and the snapshot behind `/release-notes` is not old — the gap is in a version, not in a
date.

A tag is not proof of a publication. `apps/site/src/generated/release-notes.json` records a case from
the library's own history: a `catalog-v1.0.0-preview.1` tag was pushed and its release run failed at
version resolution, before packing or pushing anything, and the number was skipped rather than
reused.

Four rules of the specification bear on the choice. Information the library sources descends to the
site by a mechanism that fails loudly when the source changes, and copying is forbidden (§2). A page
exists in a locale only if it is genuinely translated there, and a missing content key fails the
build (§6.4). A component presented as available whose version does not resolve fails the build
(§5.7, §16). Comparison freshness, by contrast, is a build **warning** past a declared delay (§11.8).

[ADR-0001](0001-a-release-tag-publishes-not-a-merge-en.md) makes a `release/*` tag the act of
publication, and the deploy job publishes an artefact it downloads and never rebuilds.

`docs/design/decisions-inventory.md` records that the two repositories are separate on purpose (D1).
The cost it names for that separation is drift, *"qu'il faut alors combattre par des mécanismes"* —
the mechanisms being B1, that nothing the site displays is typed by hand.

## Decision

**Content this site mirrors from the library is taken as one atomic snapshot at a published release
tag, and the snapshot records the package versions it describes.**

## Rationale

The corpus in Context arrives carrying four verifications. A mirror inherits all four: the pages the
site serves are the pages whose French is held to parity, whose links resolve, whose samples compile
against the shipped packages, and whose samples trip no analyzer the product ships — that last one
being §14.4 satisfied for free, upstream, on 104 pages this repository would otherwise have to
compile itself. Restating the documentation here forfeits every one of them and re-creates precisely
the drift D1 names as the price of separate repositories. §6.4 is the sharpest case: it is
satisfiable at all only because the source is already fully paired; written here, the translation
burden would land on this repository page for page.

The tag, rather than a branch, follows from what the site promises. The install command and the
documentation are two statements about the same artefact, and only a tag makes them one statement: a
branch describes work that may not be installable, so a reader following it can meet a factory that
resolves to nothing in the package they were just told to install. That is the same failure B2 rules
out for the playground, which references a published package rather than a source build, and it is
worse in documentation than in a playground because the reader copies it into their own test.

Atomicity follows from where the link contract holds. The suite verifies links across one ref, so a
mirror assembled from several refs composes pages that each passed a check that was never run on the
combination — a link taken from one section resolving into another that has since renamed its target.
Nothing downstream would catch it, because the check that would have ran upstream, on a tree that
never existed here. The train remains a good reason to *refresh* the mirror and a poor way to *limit*
what gets refreshed.

Recording the versions is what turns staleness from a judgement into a comparison. The measured gap
in Context is the argument: the CLI is a minor version behind, and no elapsed-time rule would have
found it, because the snapshot's age was never the problem. A snapshot that names what it describes
can be held against the registry and answer yes or no, which is the standard §2 asks for — a
mechanism that fails when the source moves — expressed in the only currency the source actually moves
in.

The trade-off accepted is a deliberate lag: the site's documentation trails the library's `main`, and
a correction merged upstream stays invisible until a version carrying it is published. That is the
same lag the install command has always had, and paying it in one place rather than two is what keeps
the two agreeing.

## Alternatives Considered

### Write the site's documentation here

Considered because it is the only option that lets the documentation be shaped for the site — its
narration, its cross-links, its editorial voice — and because it couples this repository to nothing.

Rejected because it forfeits the four contracts in Context and adopts their cost instead. Translation
parity across 104 pages, link resolution, sample compilation against the shipped packages and sample
conformance to the analyzers would all have to be rebuilt here, against a library this repository
cannot see the internals of — and until they were, §6.4 and §14.4 would rest on attention. It is the
drift D1 warns about, chosen on purpose.

### Mirror from `main`, as `/release-notes` does

Considered because it is the existing precedent in this repository, the simplest thing that works,
and the one that shows a reader the freshest documentation available.

Rejected because the freshest documentation is not the documentation of the package on offer. A
branch can describe a factory, a constraint or a flag that no published version carries, and the
reader who copies it is told to install something where it does not exist. It also leaves staleness
undetectable in the only form it has actually taken here: the measured gap is a version gap, and a
snapshot stamped only with the moment it ran cannot express it.

### Mirror per train, or per section

Considered because it matches how the library actually releases — four trains, versioned
independently — so a CLI release could refresh the CLI pages alone and leave the rest untouched, which
is both cheaper and easier to review.

Rejected because it composes refs that were never verified together, for the reason given in
Rationale. The saving is small — the corpus is a hundred text files — and it is bought by giving up
the one contract that makes a mirror trustworthy across page boundaries.

### Fail the build when the snapshot is behind

Considered because it is the strongest reading of §2: a mechanism that fails loudly when the source
changes, exactly as §5.7 and §16 already do for a component whose version does not resolve.

Rejected because the failure would land on the wrong act. ADR-0001 makes the release tag the moment
of publication, so a build that refuses it is refusing to publish an unrelated change over a fact
about another repository — and the stale page it objects to is already live, so blocking removes
nothing. §11.8 has already drawn this line for the comparison's freshness: what is out of date warns.
The mechanism still has to reach a person, which is a follow-up, not a reason to fail the publish.

## Consequences

### Positive

The documentation the site serves inherits four upstream verifications it did not pay for, including
§14.4 across the whole corpus.

The documentation and the install command name one artefact. A reader who follows both is never told
about something the version on offer does not have.

Staleness becomes an exact question about a version rather than a judgement about an elapsed delay,
and the gap measured in Context becomes reportable rather than invisible.

The decision generalises. `/release-notes` mirrors the same library under the same problem, and can
move onto this footing without a second decision being taken.

### Negative

The site's documentation lags the library's `main` by construction, and a correction merged upstream
is invisible here until a version carrying it is published. A typo fixed in the library is a typo
served by the site until the next release.

The repository gains a mirrored corpus to hold, an order of magnitude larger than the one it holds
today, and it will be read as this site's own writing whatever its provenance.

The snapshot is pinned to one ref while describing four packages that version independently, so the
tag that anchors the corpus and the versions it documents are not the same fact and both have to be
recorded.

### Risks

**A tag can name a release that never published.** The library's own history has one, recorded in
this repository's release-notes snapshot: a tag pushed, a release run that failed before packing, a
number skipped. A snapshot anchored on the tag list alone can therefore document a version no
consumer can install. The mitigation is that the registry, not the tag list, is what the freshness
comparison reads.

**A mirror reads as authorship.** A reader who finds a defect in a mirrored page will report it here,
and a maintainer who fixes it here will have their fix overwritten by the next snapshot. The
mitigation is that each mirrored page names its source and links to it, as `/release-notes` already
does.

**The anchoring tag is a judgement the first time.** Four trains touch one shared corpus, so which
tag a snapshot is taken at is not read off the corpus itself. Left unstated it becomes whatever the
first implementation did, which is how a decision turns into an accident.

## Follow-up Actions

* **What fails when this decision is broken:** `scripts/check-package-freshness.mjs`, run by
  `.github/workflows/package-freshness.yml` on a schedule and again when this site is released. It
  compares the versions this repository declares (`site.ts`, `Directory.Packages.props`) against
  nuget.org and **opens or updates an issue** rather than failing the publish — per ADR-0001 and
  §11.8 above. A warning inside a green pipeline is read by nobody, and the failure this guards
  against is precisely one nobody noticed. It does not yet read a mirrored-content snapshot, because
  none exists — it compares the site's own declared versions directly, which is the same fact for
  every package this repository mirrors nothing about today, and it is the piece a snapshot's own
  freshness check would extend rather than replace.
* **The check exists now, and this record's `Proposed` status is a ratification decision, not a
  missing piece.** It was break-tested before landing, per
  [`CONTRIBUTING.md`](../../../CONTRIBUTING.md#a-decision-comes-with-something-that-fails-when-it-is-broken):
  run against the working tree as it stood, it reported `JustDummies.Cli` declared at `1.0.0-beta.1`
  against nuget.org's `1.1.0-beta.1` — the exact gap measured in Context, found automatically rather
  than by hand. A deliberate mismatch between `site.ts` and `Directory.Packages.props` was reported as
  `inconsistent`, and a version string the script's own regexes could not locate was the one case that
  exits non-zero, all three restored afterward. The specification's §16 carries a row for the rule
  again, now pointing at a real mechanism.
* `/release-notes` mirrors `main` and predates this record. Moving it onto this footing is work this
  decision makes necessary, not a separate decision.
* Which tag anchors a snapshot spanning four trains is settled where the mechanism is documented, not
  left to the first implementation — see the third Risk.
* `site.ts` carries a known duplication of `library.version` with `Directory.Packages.props`, guarded
  today by a comment that asks for *"a build step that compares them"*. The same check reads both
  facts and can close it.
* The page set `/docs` publishes, and how it relates to `/tooling` and `/api`, is information
  architecture: it belongs to the specification (§7.2) and to the issues that track it, not to this
  record.

## References

* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-en.md) — the release tag as the act of
  publication, and why this check warns rather than blocks
* Specification §2 (volatile facts and their sources), §5.7 and §16 (state, and what verifies it),
  §6.4 (partial translation), §11.8 (freshness as a warning), §14 (content governance)
* [`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md) — B1 (nothing is typed
  by hand), B2 (the playground references a published package), D1 (separate repositories, and drift
  as their price)
* `JustDummies.Documentation.UnitTests` in `Reefact/just-dummies` — the four contracts a mirror
  inherits
* Issue [#76](https://github.com/Reefact/justdummies.io/issues/76) — `/docs`, the route this decision
  feeds, and which the specification's §7.5 now describes
