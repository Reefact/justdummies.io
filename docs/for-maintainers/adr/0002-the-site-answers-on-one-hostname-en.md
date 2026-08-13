# ADR-0002 | The site answers on one hostname

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0002-the-site-answers-on-one-hostname-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-11
**Accepted:** 2026-08-12
**Decision Makers:** Reefact

## Context

The deployment is a Worker serving static assets. A Worker is reachable on
`<name>.<subdomain>.workers.dev` by default, and separately on any custom domain attached to it.
Since `justdummies.io` was attached, both answered — the same bytes, under two names, both
publicly resolvable.

The `workers.dev` hostname carries the account's subdomain in its name, so it names the account
rather than the site.

Two wrangler settings govern two different hostnames, independently: `workers_dev` governs
`<name>.<subdomain>.workers.dev`, and `preview_urls` governs
`<version>-<name>.<subdomain>.workers.dev`. The preview mechanism — a version uploaded without
being promoted, which is what `pnpm preview` does — uses the second form.

The `workers.dev` hostname was the only address the site had between the first deployment and the
day the domain was attached. The deployment guide's steps 5 and 6 verify a deployment against it,
and step 6's compression measurement was taken there.

`preview_urls` has never been declared in this repository's configuration, and its default is off.
A version upload therefore returns a version identifier and no URL. That is measured rather than
inferred: the first upload after the production hostname was disabled printed no URL, and the
hostname a preview URL would occupy answers 404.

## Decision

The `workers.dev` hostname is disabled, so `justdummies.io` is the site's only public address.

## Rationale

A second public hostname serving identical content is not a spare address, it is a second site
that nobody maintains. Search engines index it, visitors bookmark it, and links written against it
keep working — so the duplicate is not a transient state that decays but one that accumulates
references. Nothing in the deployment distinguishes the two, which means nothing will ever prompt
whoever finds the second one to prefer the first.

The name is also wrong for a public address in a way that cannot be fixed: it contains the
account's subdomain, so it advertises who hosts the site rather than what the site is.

Keeping it would buy one thing — an address that works before a domain is attached. That is worth
exactly one moment in the repository's life, the moment already passed, and it is recoverable on
demand by anyone who needs it again.

Turning it off does not turn off previewing, because the two hostnames are governed by two
settings. That is what makes this decision narrow enough to take: it removes an address, not a
mechanism. A version upload still uploads a version — what it has never done here is hand back a
URL, and that is `preview_urls` being off rather than anything this decision does.

## Alternatives Considered

### Keeping both hostnames

Considered because the `workers.dev` address costs nothing to leave in place, and because it is
genuinely useful for checking a deployment without involving the domain — which is how every check
in the guide was run before the domain existed.

Rejected because the usefulness is occasional and the duplication is permanent. A maintainer who
needs the address back can have it in one line, whereas an indexed duplicate cannot be withdrawn
once it has been linked to.

### Keeping it and excluding it from indexing

Considered as a way to keep the address while removing the search-engine consequence — a
`robots.txt` or a canonical header conditioned on the host.

Rejected because it needs the deployment to distinguish the two hostnames, which an assets-only
Worker cannot do: telling them apart means inspecting the request, and inspecting the request means
adding a script. The Worker has no script deliberately (see the reasoning recorded in
`wrangler.jsonc`), so this alternative would trade a duplicate hostname for a metered request path
and a site that fails closed when a quota runs out.

### Redirecting `workers.dev` to `justdummies.io`

Considered because it would keep old links working while making the domain canonical.

Rejected for the same reason: an assets-only Worker has nothing that can issue a
host-conditional redirect. The redirect rules it does parse are path-based and apply to every
hostname the Worker answers on.

## Consequences

### Positive

* The site has one address, so a link to it is unambiguous and nothing indexes a duplicate.
* The public address stops naming the hosting account.

### Negative

* **A first deployment has no hostname at all** until a custom domain is attached. Anyone setting
  this up from scratch cannot verify step 5 the way the guide describes without either attaching
  the domain first or re-enabling the setting temporarily.
* The convenience of checking a deployment without touching the domain is gone.

### Risks

* **Previewing was checked and is not collateral damage** — for a reason worth recording, because
  it was not the reason expected. A version upload after the change printed no URL, and the
  hostname one would occupy answers 404. But `preview_urls` had never been declared, so no upload
  in this repository has ever produced a URL: nothing was lost here because there was nothing to
  lose. What the check actually found was a false claim in the deployment guide, which promised a
  URL the command has never returned. The guide is corrected; whether to declare
  `preview_urls: true` is an open question below, not something this decision settles.
* **Nothing took effect until a release was cut.** The setting is applied by a deployment, and
  publication is gated on a `release/*` tag (ADR-0001). Between merging this and tagging, the
  second hostname stayed live — a reader checking in that window would have concluded the change
  did not work. Settled on `release/2026-08-11T23-48-02Z`: the hostname answers 404, and
  `/version.json` names that tag.

## Follow-up Actions

* ~~Confirm the `workers.dev` hostname stops answering, rather than assuming the setting was
  applied.~~ Done on the first release: `404` where it answered `200`.
* **Decide whether to declare `preview_urls: true`.** Left open here on purpose. Reviewing a visual
  change on a shareable URL before merging is a real want, and today nothing serves it — `pnpm serve`
  runs the same runtime locally but only for whoever runs it. Enabling preview URLs puts a
  `workers.dev` hostname back, though not the one this record removed: a preview URL is per-version
  and unadvertised, so the duplicate-address argument above does not apply to it unchanged. That is
  a decision of its own, and it needs its own record.

## References

* `wrangler.jsonc`, where the setting and its reasoning live.
* Steps 5, 6 and 9 of the deployment guide, which is where the cost lands —
  [English](../deployment-en.md) · [Français](../deployment-fr.md).
* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-en.md) — why this takes effect on a tag and
  not on the merge.
* **A6** in [`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md), the
  assets-only Worker with no script, which is what rules out the two alternatives that would have
  kept the hostname.
