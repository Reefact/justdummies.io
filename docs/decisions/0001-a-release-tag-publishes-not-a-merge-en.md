# 0001 — A release tag publishes, not a merge

*🇫🇷 [Version française](0001-a-release-tag-publishes-not-a-merge-fr.md)*

**Decided** 2026-08-11 · **Lives in** `.github/workflows/build.yml`, and in step 7 of the
deployment guide.

## Decision

Publication is gated on a deliberate release marker, not on integration.

A push to `main` builds the artefact and verifies it, and publishes nothing. A tag matching
`release/*` publishes. The tag's name is a UTC timestamp — `release/2026-08-11T19-33-42Z` —
and the tag is annotated, so it carries the reason the release was cut.

```bash
git tag -a "release/$(date -u +%Y-%m-%dT%H-%M-%SZ)" -m "what this release brings"
git push origin --tags
```

The condition is the ref alone, `refs/tags/release/*`. No event can publish something that was
never tagged, and a tag reaches the job whether it was pushed or picked from the Run workflow
dialog — so re-publishing a release needs no second mechanism.

## Context

The pipeline first shipped publishing on every push to `main`. Nothing was wrong with it: a
static site with no server script and no consumers can be continuously deployed safely, and the
artefact is verified twice before it goes out.

What made it wrong here is what `main` receives. This repository merges documentation fixes,
copy changes, tooling adjustments — on the day this was decided, eight pull requests landed in
under three hours, all of them corrections to a setup guide. Every one of them moved the live
site. Publication had become a side effect of integration rather than an act.

The counter-question is worth recording because it will be asked again: if every merge is
verified, why not publish every merge? Because "verified" and "intended" are different claims.
The checks prove the artefact is well formed; they cannot know whether a half-written narrative
act was meant to be read by anyone yet.

## Consequences

**What reaches production carries a name.** `wrangler deployments list` prints timestamps, and
so does the tag, so the two line up directly. Before this, matching a live deployment to a
commit meant reading a clock.

**`main` can run ahead of production indefinitely, and nothing says so.** This is the real cost
and it has no mitigation in place. A job comparing the newest tag against `main` and annotating
the run would provide one; it does not exist yet.

**A skipped `Deploy` on a push to `main` is the expected state.** It is not a symptom, and
anything that teaches a reader to treat a skipped job as a fault has to say so — the deployment
guide was corrected on exactly this point, having briefly taught the opposite.

**Releasing is now a decision someone makes.** That is the point, and it is also a step that can
be forgotten. The site lagging its repository is a failure mode this design accepts in exchange
for never publishing by accident.

## Rejected alternatives

**Publishing on every push to `main`** — what was there. Rejected above: it makes publication a
consequence of merging.

**Semantic versions, `v1.2.0`.** The shape "like a NuGet package" suggests, and the first thing
built. Semver answers one question — *is this compatible with what I have* — and nothing consumes
this site, so the question never arises. What remains is its cost: deciding whether a change to
a landing page is a minor or a patch, every single time, for an answer no one reads. Note that
this is a property of *this* repository and not of the library beside it, where semver earns its
keep.

**A date with a same-day counter, `2026-08-11.2`.** Proposed and abandoned within the hour. It
was argued for on the grounds that a date is produced without deliberating, and then required
reading `git tag` to learn whether the next release is `.1` or `.2` — reintroducing exactly the
deliberation it claimed to remove. A timestamp is produced by `date -u` alone.

**A plain counter, `release-7`.** Orders releases without informing: it cannot tell you whether
the live site is three days or eight months old.

**Mirroring the library's version.** The playground ships against a published JustDummies
package, so coupling the site's releases to it is tempting. Rejected: the site changes far more
often, and for reasons unrelated to the library, which would force releases that mean nothing.
What the deployment should record is which library version it shipped with — metadata, not a
version number, and the playground already reads that from what it actually loaded.

**Semver derived from commit types**, as release-please and similar tools do. Adds a tool in
order to compute a number that, per the second rejection above, nobody reads.

## When this will be questioned

At the first release someone forgot to cut, and discovers the site is weeks behind `main`. The
answer then is not to remove the gate but to add the warning this record says is missing.

Also whenever a preview environment is wanted for a branch. That is a different mechanism —
`pnpm preview` uploads a version without promoting it — and confusing the two would put branch
deployments back in production's path.

## Relation to other records

This refines **D1** in `docs/design/decisions-inventory.md`. That entry separates a repository
publishing versioned packages from one publishing a deployment; the deployment now has versions
too. The separation still holds — the two repositories version different things for different
reasons, which is the substance of D1, not the absence of versions here.
