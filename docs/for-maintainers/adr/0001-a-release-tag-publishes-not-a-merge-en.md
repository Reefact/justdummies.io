# ADR-0001 | A release tag publishes, not a merge

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0001-a-release-tag-publishes-not-a-merge-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-11
**Accepted:** 2026-08-11
**Decision Makers:** Reefact

## Context

The site is a single static deployment: an application built into one directory and uploaded
whole. There is no server script, and no consumer — no package references this deployment, no
build depends on it, nothing installs it.

The pipeline, as first built, published on every push to `main`. Publication was safe by
construction: the artefact is checked on disk, checked again by starting the runtime and asking
what it actually serves, and checked a third time after the round trip through the artefact store,
so what reaches production has been verified three times.

What `main` receives is documentation fixes, copy changes and tooling adjustments. On the day this
was decided, eight pull requests landed in under three hours, every one of them a correction to a
setup guide. Each moved the live site.

The repository has one deployment target. There is no staging environment; previewing is a
separate mechanism, a version uploaded without being promoted.

Cloudflare reports deployments as times, not as names: the deployment list a maintainer reads to
answer "what is live?" is a list of timestamps.

Git refs cannot contain a colon, which constrains any timestamp used as a tag name.

The credentials that publish live in the repository's secrets, readable by any job the workflow
permits to read them.

## Decision

Publication is gated on a `release/*` tag whose name is a UTC timestamp; a push to any branch,
`main` included, builds and verifies but publishes nothing.

## Rationale

Publishing on merge conflated two claims the context keeps separate. The three checks establish
that the artefact is *well formed*; nothing in them establishes that it was *meant to be read*. A
half-written narrative act passes every check that exists, because none of them is about
readiness. Eight corrections to a guide moving the live site eight times is that conflation
observable: publication had become a side effect of integration rather than an act someone
performed.

Gating on a marker restores the distinction at the only place the maintainer can express it — a
deliberate step, taken once per release, on the commit they choose.

The marker is a timestamp rather than a version because of two facts above. Nothing consumes this
deployment, so the question a semantic version answers — *is this compatible with what I have* —
is never asked here; what would remain of semver is its cost, the arbitration between a minor and
a patch, demanded on every release for an answer no reader has. And Cloudflare reports times, so a
timestamped release name lines up directly against the list a maintainer reads to see what is
live. Lining up with that list is the whole reason for naming releases at all.

A timestamp also needs nothing to be known before it is produced: no existing tag has to be
consulted to learn what the next name is, two releases cannot collide, and lexical order is
chronological order.

The gate is the ref, not the event. One condition then covers a tag that was pushed and a tag that
was selected to re-run, so re-publishing an existing release needs no second mechanism — and no
event, whatever triggers it, can publish something that was never tagged.

The tag is annotated rather than lightweight so that the reason for the release travels with it.
The release list is the only place that reason can live; a lightweight tag would leave the record
naming *when* and never *why*.

## Alternatives Considered

### Publishing on every push to `main`

Considered because it was what already worked, and because it is defensible in general: a static
site with no server script and no consumers can be continuously deployed safely, which is why it
was built that way first.

Rejected because it makes publication a consequence of merging. The eight-pull-request afternoon
is not a pathological case to guard against but the repository's normal traffic, and no gate
placed inside the checks can distinguish a correction worth shipping from one that merely passes.

### Semantic versions

Considered because "publish like a NuGet package" was the shape asked for, and the library beside
this repository does version that way, so the convention was to hand.

Rejected because semver's question is not asked here. Its cost, on the other hand, is charged on
every release: deciding whether a change to a landing page is a minor or a patch. This is a
property of *this* repository, not of the library, where the same scheme earns its keep because
consumers depend on the answer.

### A date with a same-day counter

Considered because a date is produced without deliberating, which is exactly the property semver
lacks.

Rejected because the counter reintroduces the deliberation the date removed: naming the next
release requires learning whether today already has one. That is a lookup before every release,
for a distinction that carries no information a timestamp does not.

### A plain incrementing counter

Considered because it is the smallest thing that orders releases.

Rejected because it orders without informing. It cannot answer whether the live site is three days
or eight months old, which is the question the release name exists to answer.

### Mirroring the library's version

Considered because the playground ships against a published library package, so the two are
genuinely related.

Rejected because the site changes far more often than the library, and for unrelated reasons.
Coupling the names would force releases that mean nothing and withhold names from releases that
mean something. What a deployment should record is which library version it shipped with — and
that is metadata the playground already reads from what it actually loaded, not a version number
for the site.

### Semantic versions derived from commit types

Considered because tooling exists to compute them, which would remove the arbitration that sank
the plain semver option.

Rejected because it adds a tool in order to produce a number that, per that same option, no reader
consumes.

## Consequences

### Positive

* What is live carries a name a maintainer put there, and that name lines up against the
  deployment list without translation. Before this, matching a live deployment to a commit meant
  reading a clock.
* Releasing is an act with an author, a date and a stated reason, recorded in the tag.
* Re-publishing a release is the same mechanism as publishing it, because the gate is the ref.
* A branch can no longer reach production, whatever event runs the pipeline.

### Negative

* `main` can run ahead of production indefinitely, and nothing in the pipeline says so.
* Releasing is a step that can be forgotten, where before it could not be.
* A skipped deploy job is now the expected outcome of a push, which makes a skipped job a weaker
  signal than it was: it no longer distinguishes "nothing to publish" from "misconfigured".

### Risks

* **The site silently lags its repository.** No mitigation is in place. The drift is invisible
  until someone looks at both, and the pipeline is the natural place to surface it.
* **A skipped job is read as a fault.** The deployment guide taught the opposite for a short while
  and was corrected; anything else describing the pipeline has to state that a skipped deploy on a
  branch is normal, or it will generate false alarms.
* **A release is cut from an unintended commit.** The tag names a commit, and nothing checks that
  the commit is the one the maintainer meant. The annotated message is the only record of intent.

## Follow-up Actions

* Surface the drift the Negative section names: compare the newest release tag against `main` and
  annotate the run, so a repository ahead of production says so without being asked.
* State in the deployment guide, at the point a reader meets it, that a skipped deploy job on a
  branch is the expected state.

## References

* Step 7 of the deployment guide, which is this decision's operating half —
  [English](../deployment-en.md) · [Français](../deployment-fr.md).
* `.github/workflows/build.yml`, where the gate lives.
* **D1** in [`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md) — a repository
  publishing versioned packages against one publishing a deployment. This record refines it rather
  than retiring it: the deployment now has release names too, and the separation D1 draws still
  holds, because the two repositories name different things for different reasons.
