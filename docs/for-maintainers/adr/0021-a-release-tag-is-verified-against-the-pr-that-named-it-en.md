# ADR-0021 | A release tag is verified against the PR that named it, not its own creation clock

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0021-un-tag-de-release-est-verifie-par-rapport-a-la-pr-qui-la-nomme-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-19
**Accepted:** 2026-08-19
**Decision Makers:** Reefact

## Context

ADR-0001 gives the tagging ritual: read the clock once, name the tag `release/<UTC timestamp>`,
create it, push it. ADR-0017 adds a second requirement on top of that ritual — before the tag is
pushed, `RELEASE_NOTES-en.md`/`fr.md`'s `## Unreleased` section must already be retitled to that
exact tag, because the `notes` job reads the section matching the tag being published and refuses
without it. Retitling needs the tag's final name in hand before the tag exists, so something has
to decide that name ahead of the `git tag` command itself.

Under this repository's actual practice, that something is an agent: the maintainer asks for a
release to be prepared, the agent reads the commits since the previous tag, drafts the two
`RELEASE_NOTES` files, computes `release/<UTC timestamp>` at that moment, retitles `## Unreleased`
to it, and opens a pull request carrying that commit. The maintainer reviews, merges, and only
then runs the tag commands themselves — separately, often minutes later, sometimes longer,
bounded by nothing but how quickly they get to it.

`scripts/check-release-tag.sh`, added under ADR-0017's work, asserted that the tag object's own
creation timestamp (`%(taggerdate)`) fell within 60 seconds of the UTC instant its name claims.
That bound is correct for the ritual ADR-0001 describes — one command reads the clock and creates
the tag in the same breath — and wrong for the one just described, where the name is decided at
PR-preparation time and the tag is made afterward by a different actor. This was not theoretical:
`release/2026-08-19T11-50-00Z` was named at `11:50:00`, prepared in a pull request, merged, and
tagged by the maintainer at `11:54:40` — a 280-second gap an honest release under this protocol
produces routinely — and `check-release-tag.sh` rejected it. Because that check lives in the
`notes` job (`needs: deploy`, per ADR-0017), the rejection landed *after* Cloudflare had already
published the release; the deployment this session watched go out was never at risk, but a tag
that actually deserved rejecting would have shipped first and been refused a release page second.

What the maintainer's process actually needs verified does not depend on elapsed time at all: the
commit the tag names must be exactly the merge commit of the pull request that chose its name —
`ci: prepare <tag>` — and nothing else. If a different commit reaches `main` between that PR
merging and the maintainer tagging — a second PR, a Dependabot auto-merge — `git pull origin main`
before tagging (Step 7) picks it up silently, and the pushed tag would publish work nobody
reviewed as part of this release, under a name that promised only what the PR described.

## Decision

`scripts/check-release-tag.sh` verifies a release tag by asking GitHub which merged pull request
produced the commit the tag points at (`gh api repos/{owner}/{repo}/commits/<sha>/pulls`), and
requires exactly one match titled `ci: prepare <tag>` whose `merge_commit_sha` equals the tag's
own commit — replacing the previous check that the tag's creation timestamp fell within 60 seconds
of its name. This check moves into a new `verify-tag` job that runs before `build`, gating
`build`, `browser-tests`, and `deploy` on it, rather than living in the `notes` job after `deploy`.

## Rationale

**Commit identity is the invariant this protocol actually depends on; elapsed time is not.** Once
a name is deliberately decided ahead of the tag, in a reviewed pull request, no duration between
that decision and the tag being pushed is inherently suspicious — a maintainer reviewing carefully
before merging is not a defect. What would be a defect is the tag ending up somewhere other than
that PR's own output, because reaching it required including something the PR never described.

**Moving the check ahead of `deploy` closes the exact gap this session hit.** ADR-0017 accepted
`notes` running after `deploy` deliberately, so a release page names something that shipped; that
acceptance never extended to the tag-truthfulness check itself; running it there was carried over
from before the two checks were distinguished. A tag that fails verification now blocks the
deployment it would otherwise trigger, not merely the page describing an already-live one.

**Looking up by commit, not by searching PR titles, avoids a second source of flakiness.**
`gh api repos/{owner}/{repo}/commits/<sha>/pulls` returns the pull requests GitHub already
associates with that exact commit — exact and available as soon as the commit lands on the
default branch. A title search (`gh pr list --search`) is tokenized and fuzzy, and its index is
only eventually consistent; either property could produce a false negative moments after a genuine
merge, which is exactly the kind of failure this record exists to stop introducing.

**The write-token isolation ADR-0017 established is unaffected.** `verify-tag` only needs to read
a pull request (`pull-requests: read`); `contents: write` — needed to create the release page —
stays confined to `notes` alone, unchanged.

## Alternatives Considered

### Widen the 60-second tolerance instead of replacing the check

Considered because it is a one-line change. Rejected: any fixed bound is still a proxy for the
property that actually matters, and picking one trades one arbitrary number for another — too
short for a maintainer who reviews carefully, too long to mean anything if widened enough to
never trip. The gap that failed this session was 280 seconds; nothing says the next one will not
be 28 minutes.

### Keep the timestamp check alongside the new one

Considered as a belt-and-braces option. Rejected: once commit identity is verified, the timestamp
adds no safety the identity check does not already provide, and keeping it would reproduce the
exact spurious failure that prompted this record on every release that takes the reviewer more
than a minute.

### Search pull request titles (`gh pr list --search`) instead of the commit-to-PR endpoint

Considered because it needs no per-commit lookup. Rejected: GitHub's search is tokenized rather
than exact even with a quoted phrase, and its index is eventually consistent — both properties this
check cannot afford moments after a merge, when the pipeline it gates is already running.

### Have the maintainer read the clock and tag first, then have an agent retitle the release notes and push a follow-up commit before the tag counts as final

Considered as a way to keep ADR-0001's ritual exactly as written. Rejected: `## Unreleased` has to
carry the tag's exact name before the `notes` job can read it (ADR-0017), so a tag made first would
still need a second, synchronized round trip afterward — slower and no safer than deciding the name
once, up front, in the pull request that already needs writing.

### Leave the check in the `notes` job, only changing its logic

Considered as the smallest diff. Rejected: it satisfies the letter of "verify the tag" while
missing the point of this record, which is that a bad tag must be refused *before* `deploy`, not
alongside a release page for a deployment that already happened.

## Consequences

### Positive

* A release tag can no longer publish work that reached `main` between the preparing PR's merge
  and the tag being pushed, whether from a second PR or an automated merge.
* A tag that fails verification blocks the deployment itself, not only the release page describing
  one that already shipped.
* The maintainer's own process — prepare in a PR, tag separately — is what the check now measures,
  instead of an assumption that no longer held.

### Negative

* Every release now requires a pull request titled exactly `ci: prepare <tag>`; a tag pushed
  without one, or against a differently-titled or differently-merged PR, is refused even if the
  underlying commit is otherwise fine.
* The check depends on GitHub's API rather than local git state alone. This is not a new class of
  dependency for the pipeline as a whole — `notes` already needed `gh` to create the release — but
  `check-release-tag.sh` itself could previously run fully offline, and no longer can.

### Risks

* **GitHub's commit-to-PR association could lag briefly right after a merge.** No such lag has
  been observed at this repository's scale; if one is, the mitigation is to retry once rather than
  widen the check back toward what it replaced.
* **This mechanism has not yet been exercised against a tag it was written to accept** — the one
  release prepared so far under this protocol (`release/2026-08-19T11-50-00Z`) predates it and was
  titled `docs: prepare <tag>`, not `ci: prepare <tag>`. The next release is this check's first
  real run in both directions; a maintainer watching `verify-tag` on that tag is the mitigation
  until then.
* **Two pull requests could, by mistake, carry the identical title.** The script's more-than-one-
  match branch fails loudly rather than picking either silently.

## Follow-up Actions

* `.claude/skills/release-notes/SKILL.md`'s before-tagging ritual is rewritten to the two-actor
  protocol this record assumes: an agent computes the tag, drafts and retitles the release notes,
  and opens a PR titled `ci: prepare <tag>`; the maintainer reviews, merges, and runs the tag
  commands themselves, handed over one per copy-pasteable block.
* Step 7 of the deployment guide (both languages) is updated to describe this flow as the primary
  path, alongside the direct `date -u`/PowerShell commands it already documents for running the
  tag side by hand.
* What fails when this decision is broken: `scripts/check-release-tag.sh`, run by the `verify-tag`
  job on every `release/*` tag push, before `build`/`browser-tests`/`deploy` are allowed to run —
  see Risks above for the one respect in which this has not yet been observed to fail correctly on
  a real tag.

## References

* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-en.md) — unaffected in its core claim that a
  tag publishes; this record changes what makes a tag trustworthy enough to reach that gate, not
  whether reaching it publishes.
* [ADR-0017](0017-draft-a-releases-github-notes-by-hand-and-refuse-without-them-en.md) — unaffected
  in its refusal-on-missing-note behavior and in keeping `contents: write` confined to `notes`;
  this record moves only the tag-truthfulness check, out of that job and ahead of `deploy`.
* `.claude/skills/release-notes/SKILL.md`, `scripts/check-release-tag.sh`,
  `.github/workflows/build.yml` (`verify-tag` job) — where the mechanism lives.
* Step 7 of the deployment guide — [English](../deployment-en.md) ·
  [Français](../deployment-fr.md) — updated alongside this record.
