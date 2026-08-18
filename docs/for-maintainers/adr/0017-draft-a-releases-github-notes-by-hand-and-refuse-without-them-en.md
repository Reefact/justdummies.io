# ADR-0017 | Draft a release's GitHub notes by hand, and refuse without them

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0017-rediger-a-la-main-les-notes-github-dune-release-et-refuser-sans-elles-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-18
**Decision Makers:** Reefact

## Context

Since ADR-0001, publication is gated on a `release/*` tag, and the `notes` job of
`.github/workflows/build.yml` gives that tag a GitHub Release page after the deploy job has
already published it. Until now, that page's body came from `gh release create ... --generate-notes`:
GitHub's own mechanical list of the pull requests merged since the previous tag.

That list mixes registers with nothing to tell them apart. A real release's body reads, in
order: `ci: bump the codeql-action group across 1 directory with 2 updates` by `@dependabot[bot]`,
`fix(ci): use rebase merge method in dependabot auto-merge workflow`, `Rebuild the playground
around the landing page's code card`, `docs: ratify ADR-0014` — a dependency bump, a CI
maintenance fix, the one line a visitor might actually care about, and a documentation
housekeeping note, presented as four equally-weighted bullets. Twenty-four releases exist as of
this record, and the pattern repeats in most of them: several carry nothing but dependency bumps
and CI tweaks under a PR-title list that gives no way to tell that apart from a release that
changed what the site shows.

A pull request title is written for a reviewer of that one diff — it names the change, not what
a reader would notice about the result. The deployment guide (Step 7) defended the mechanical
list on exactly the opposite claim: *"What a release brings is the list of commits it embarks,
and CI publishes exactly that list on the release page."* That claim treats "what a release
brings" and "the commits it embarks" as the same fact; they answer different questions, and nothing
in the pipeline distinguished them.

The sibling repository, `Reefact/just-dummies`, faced the equivalent problem for its own GitHub
Releases and recorded its own answer: draft the release's notes by hand, from the (there,
curated) changelog, and refuse to publish rather than fall back to anything commit-derived when
that draft is missing (its ADR-0074). `justdummies.io` differs in two ways that change the
adaptation rather than the conclusion:

* It publishes one artefact, not four independently-versioned packages (`CONTRIBUTING.md`, "No
  release trains") — one release-notes file pair, not one per package.
* It keeps no curated `CHANGELOG.md` to draft from — nothing here reviews a technical record
  ahead of a release the way the library's `changelog` workflow does — so the source has to be
  read directly from commits and merged pull requests, not from an intermediate document.
* Its release tags are UTC timestamps decided at the moment of tagging (ADR-0001), not version
  numbers a maintainer already knows in advance, so a hand-drafted section cannot be titled with
  its final identity until the moment the tag is about to be pushed.

The `notes` job runs after `deploy` (`needs: deploy`): by the time it can fail, the artefact this
release names is already live. A missing or empty note therefore fails the release *page*, not
the deployment.

## Decision

A published GitHub Release's notes are read verbatim from `RELEASE_NOTES-en.md`, a committed,
hand-drafted, product-facing file kept at the repository root, and the `notes` job refuses to
publish — rather than falling back to anything derived from commits or pull requests — when the
section for the tag being released does not exist.

## Rationale

**A pull-request title and a release note answer different questions.** One explains a diff to a
reviewer; the other explains a release to a reader deciding whether it's worth a look. The
evidence in Context is what deriving the second from the first mechanically produces: a
dependency bump sitting beside the one line a visitor would care about, with nothing to tell them
apart. Reading the actual commits and pull requests by hand, and keeping only what a reader would
notice, is a presentation step a maintainer (or an agent, reviewed before it merges) performs
once per release — not a generation step the pipeline performs unreviewed.

**Refusing on a missing section follows the precedent `just-dummies`' ADR-0074 already set**, for
the same reason: a release published with a commit-derived placeholder looks like a release note
and is not one, while a failed `notes` job is loud, immediate, and points exactly at what is
missing. Because this job already runs after `deploy`, that failure was already accepted to cost
the release *page*, never the deployment — refusing here adds nothing to that cost.

**Generation happens ahead of the tag, not against it.** The release-notes skill's own
before-tagging checklist — retitle `## Unreleased` to the tag about to be pushed, commit, let CI
go green, *then* tag — keeps this file's authorship out of the tag-triggered pipeline entirely.
No model call, and no hand-drafting, ever races the publish of an immutable, already-live
deployment.

**One file pair, not one per release train**, because `CONTRIBUTING.md` already settled that this
repository publishes a single artefact — mirroring `just-dummies`' four-file structure here would
build machinery for a partition that does not exist.

## Alternatives Considered

### Keep `--generate-notes`, and tighten the commit-message convention instead

Considered because it needs no new file and no new manual step; the deployment guide's own
Step 7 defended it on that basis. Rejected: a pull-request title is bound to describe a diff,
because that is what a title is for — no wording convention turns `ci: bump the codeql-action
group across 1 directory with 2 updates` into something a reader deciding whether to look at the
site would want to read, without inventing content the title was never written to carry.

### Generate the release note in CI at tag time, from the diff since the previous release

Considered because it needs no manual step beyond writing commit messages well. Rejected for the
same reason `just-dummies`' ADR-0074 rejected its equivalent: the `notes` job runs against a
release whose deployment has already gone live; reaching that point with unreviewed, freshly
generated prose about to become the release's public text removes the one check — a human or an
agent's draft, read before it is committed — this decision exists to keep.

### Keep the commit-derived list as a fallback when the hand-authored section is missing

Considered as a softer landing than refusing outright. Rejected: a fallback that silently
produces the exact artefact this decision turns away from defeats the purpose of writing one by
hand at all. A missing release note should surface as a gap to fill before the next tag, not be
quietly patched over by the mechanism it replaces.

### One `RELEASE_NOTES` file pair per area of the site (site, playground, API reference)

Considered by analogy with `just-dummies`' per-package trains. Rejected on the fact already
settled in `CONTRIBUTING.md`: this repository has no release trains, because it publishes one
artefact — inventing a partition here would be the cargo-cult import that document already warns
against.

## Consequences

### Positive

* A GitHub Release's body is legible to anyone deciding whether to look at what's new on the
  site, instead of a PR-title list mixing dependency bumps with visible changes.
* A missing release note is caught by a failed `notes` job, before the release page is written,
  rather than published silently as a wall of commit titles.
* The deployment guide's Step 7 no longer has to defend a mechanical list as if it were the
  announcement; it can describe what the announcement actually says.

### Negative

* Writing the release note is now a manual step — the `release-notes` skill's before-tagging
  checklist — that a maintainer or agent must remember to run; nothing in the repository still
  produces it end-to-end automatically the way `--generate-notes` did.
* `RELEASE_NOTES-en.md` and the actual diff since the previous tag can drift apart if the note is
  written carelessly; nothing but review catches that, the same way nothing but review catches a
  stale doc anywhere else in this repository.

### Risks

* **A tag pushed before its section is retitled fails the release outright.** Mitigation: the
  release-notes skill's before-tagging steps list this ahead of the tag ritual, and failing
  loudly here is the point, not a defect to route around.
* **The always-timestamped nature of a release tag (ADR-0001) means the section's heading cannot
  be written until the maintainer is already mid-release.** Mitigation: the skill's ritual keeps
  this to one extra commit — retitle, commit, let CI go green, then tag — not a second review
  cycle.

## Follow-up Actions

* None required. `.claude/skills/release-notes/SKILL.md` carries the operative instruction,
  `scripts/release-notes.sh` enforces the refusal, and the `notes` job calls it at tag time.

## References

* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-en.md) — unaffected; still governs the tag
  as the publication gate. This record changes what fills the release page a tag already
  produces, not whether a tag publishes.
* `Reefact/just-dummies`, ADR-0074 ("Draft a release's GitHub notes by hand from the changelog,
  and refuse without them") — the precedent this record adapts to one artefact, no curated
  changelog, and timestamp-named tags.
* `CONTRIBUTING.md`, "What this repository does not inherit" — "No release trains", the fact this
  record's one-file-pair shape rests on.
* `.claude/skills/release-notes/SKILL.md`, `scripts/release-notes.sh` — where the format and the
  procedure live.
* Step 7 of the deployment guide — [English](../deployment-en.md) ·
  [Français](../deployment-fr.md) — updated alongside this record to describe the new mechanism.
