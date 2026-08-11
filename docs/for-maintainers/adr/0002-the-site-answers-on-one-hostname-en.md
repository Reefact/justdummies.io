# ADR-0002 | The site answers on one hostname

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0002-the-site-answers-on-one-hostname-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-11
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

Whether a preview URL still resolves once the production `workers.dev` hostname is disabled has
not been verified. Both live on the same subdomain.

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
mechanism.

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

* **Previewing may be collateral damage.** `preview_urls` is a separate setting, and the intent is
  that `pnpm preview` is unaffected — but preview URLs live on the same `workers.dev` subdomain,
  and this has not been verified. The check: cut a release, run `pnpm preview`, and request the URL
  it prints. If it does not resolve, previewing depends on the production hostname and this
  decision is wider than it claims.
* **Nothing takes effect until a release is cut.** The setting is applied by a deployment, and
  publication is gated on a `release/*` tag (ADR-0001). Between merging this and tagging, the
  second hostname is still live — and a reader who checks immediately will conclude the change did
  not work.

## Follow-up Actions

* Run the preview check named under Risks at the first release after this lands, and record the
  answer here — as a supersession if it turns out previewing depended on the production hostname.
* Confirm the `workers.dev` hostname stops answering after that release, rather than assuming the
  setting was applied.

## References

* `wrangler.jsonc`, where the setting and its reasoning live.
* Steps 5, 6 and 9 of the deployment guide, which is where the cost lands —
  [English](../deployment-en.md) · [Français](../deployment-fr.md).
* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-en.md) — why this takes effect on a tag and
  not on the merge.
* **A6** in [`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md), the
  assets-only Worker with no script, which is what rules out the two alternatives that would have
  kept the hostname.
