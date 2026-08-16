# ADR-0012 | The site runs one Worker script, and only for measurement

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-16
**Decision Makers:** Reefact

## Context

The specification asks the measurement for two different things. §15.1 asks for privacy-respecting
audience and performance figures. §15.2 asks for something narrower and harder: an event that
carries a **placement** and a **variant**, because an install-command copy emitted without
dimensions says only "people copy", while the question the landing page is built to answer is which
moment convinced them and which door they left by. §15.3 forbids the scene ordinal as an identifier,
on an empirical motive — the page went from eleven scenes to fourteen between two drafts and the
final exit changed ordinal — and permits it only as a secondary field.

Half of that already exists. `CopyableCommand.astro` dispatches a DOM event carrying a placement and
a variant, and deliberately calls no analytics library; its comment says the component has no
business knowing who is listening. Nothing listens. The placements in service are `hero`,
`act-one-exit`, `act-two-exit` and `act-three-exit`: stable names, no ordinals.

The privacy page states today that Cloudflare Web Analytics is used and that no finer-grained
measurement — "knowing which button you clicked, for instance" — is active.

Cloudflare Web Analytics is free, sets no cookie, identifies nobody, and has no quota of any kind.
It supplies visit counts and Core Web Vitals. It has **no custom-event API**: its own documentation
answers "Not yet, but we may add support for this in the future", and it refuses posts that its
beacon did not originate — "all requests should originate from our beacon JavaScript". It therefore
serves §15.1 and cannot serve §15.2.

§12.3 states that the site runs no server script, and gives the reason: requests served as static
assets are free and unmetered, requests that invoke a script count against a quota, and exhausting
that quota answers an error rather than falling back to the assets — "la différence entre un script
et pas de script est celle entre un site qui se dégrade et un site qui tombe". The same section
states that introducing one is "une décision à prendre exprès, jamais à découvrir dans un diff".
`wrangler.jsonc` carried that reasoning and no `main`.

How Cloudflare routes a Worker that has both a script and static assets bears directly on that cost
model. A request matching a static asset is served from the asset store **without invoking the
script**, and is free and unlimited. A request matching no asset is answered by `not_found_handling`
— also without invoking it. `run_worker_first` accepts a list of path patterns, and only the paths
it names reach the script.

The free-plan allowances are 100,000 script requests a day, and, for Workers Analytics Engine,
100,000 data points written and 10,000 read queries a day. Cloudflare states it does not bill
Analytics Engine usage today and has announced that it will. A free-plan account is not moved onto a
paid plan by an overage: the answer to exhaustion is refusal, not an invoice.

Zaraz offers `zaraz.track()`, is Cloudflare, and is served from `/cdn-cgi/` on this site's own
origin. Its free allowance is 1,000,000 events a month, **page views included in that count**, and
exceeding it disables Zaraz until the next billing cycle.

Two constraints were set for this decision: nothing that costs money, and nothing that stops.

§13.2 requires that no inline script or style go uncovered by the policy, and that any change to the
policy be validated by a real load rather than by review. §12.5 lists the properties that only a
real deployment settles.

## Decision

**The site runs one Worker script, reachable on a single path and used only to record §15.2's
dimensioned events into Workers Analytics Engine, while every page, asset and 404 continues to be
served without invoking it.**

## Rationale

§15.2 is not an embellishment on §15.1; it is the part of the measurement that answers the question
the landing page exists to pose. Web Analytics cannot carry it, and that is not a gap to work around
but a documented refusal in two places — no custom-event API, and an endpoint that rejects anything
its beacon did not send. So either §15.2 goes unserved, or something else receives it. That is the
whole of what had to be decided.

§12.3's objection to a script is a cost and failure model, and the model is about a script that
sits **in the path of the site**. That is what makes exhaustion catastrophic: if the script answers
for pages, its quota is the site's quota. It is not what is being built here. With the script
confined to one path, a page request, an asset request and a 404 each reach their answer without the
script running at all, so the quota this script can exhaust is its own. The objection is answered by
construction rather than by promise, and that distinction is the reason this ADR can exist without
contradicting §12.3 — which, in any case, asks for a deliberate decision rather than forbidding one.

The two constraints then decide between the candidates. Nothing here costs money: every allowance
named in Context is a free-plan allowance, and every overage answer is a refusal rather than a bill.
"Nothing that stops" is the constraint that actually discriminates, and it is why the measurement is
built as **two independent lanes** rather than one. The half that must never stop — the audience and
performance figures — sits on the one product with no quota at all. The half that has an allowance is
the half whose loss costs a single dimension, and its threshold is 100,000 copied commands in one
day, on a site whose page views do not consume it because they are served as assets.

That framing is what rejects Zaraz, which otherwise fits well. Its allowance is consumed by page
views as well as by events, so its counter advances whether or not anybody copies anything; and
exceeding it disables Zaraz outright. Because it would be the same product carrying both lanes,
its failure mode reaches the half that must not stop. It is the only candidate that can genuinely
stop, and it stops everything.

Keeping the collector on this origin also keeps two other things still. Cloudflare remains the sole
subprocessor the privacy page has to name, and the events need nothing added to the content policy,
because `connect-src 'self'` already covers a post to this site's own path. The only policy widening
in this work belongs to the audience beacon, and it is derived from the built artefact so the policy
is never wider than what was built.

The cost that is real is not architectural. The privacy page's sentence promising that no
finer-grained measurement is active becomes false the day the first event is sent, and it has to be
rewritten in both locales. That is the price of §15.2, and it is paid in the copy.

## Alternatives Considered

### Cloudflare Web Analytics alone, leaving §15.2 unserved

Considered because it is genuinely the cheapest honest answer: free, unlimited, no script, no ADR,
no privacy copy to rewrite, and it serves §15.1 completely. Keeping the existing emitter dispatching
to nobody would even be defensible under ADR-0004's spirit — nothing would claim to measure what
nothing measures.

Rejected because it settles for the half of §15 that was never in doubt while abandoning the half
the section was written for. §15.2 states the reason in its own words: an undimensioned copy event
says only that people copy. A measurement that cannot say which moment convinced a reader leaves the
page's central editorial claim unmeasured, which is the one thing the whole narrative is built to
test.

### Zaraz

Considered seriously, and it is the closest alternative. `zaraz.track()` is exactly the custom-event
API this needs; it is Cloudflare, so the privacy page keeps naming one subprocessor; it is served
from `/cdn-cgi/` on this origin, so `script-src 'self'` already admits it; and it requires no script
to be written or maintained here at all.

Rejected on the "nothing that stops" constraint specifically. Its monthly allowance counts page
views alongside custom events, so the counter advances on ordinary traffic rather than only on the
rare event this site cares about — and exceeding it disables Zaraz until the next cycle. Since one
product would then be carrying both lanes, that stop would take the audience figures down together
with the events. Every other candidate fails at worst by losing a dimension; this one fails by
losing the measurement.

### A third-party analytics service

Considered because several are cookieless, event-capable, and would need no server code here —
including options that can be self-hosted, which answers the cost constraint differently.

Rejected because it buys nothing the collector does not, and costs three things it does not. It adds
a second subprocessor to name on the privacy page, it adds a third-party host to the content policy
on the path of every page, and it is either a subscription or a server to run. Where a hosted plan is
free, its free tier is a commercial decision that can be withdrawn, which is a worse footing than a
documented platform allowance.

### Posting to a path that matches no asset, and reading the host's request logs

Considered because it needs no script whatsoever: a beacon to `/_e/<placement>/<variant>` would be
answered by the existing 404 handling, and the dimensions would survive in the host's own analytics.

Rejected because it is measurement by side effect. Every event would cost a full 404 page in
response, the dimensions would live only as the shape of a URL inside logs with their own retention
and granularity, and nothing would connect the two halves of the pair. It works exactly until
somebody tidies the 404 handling, and it would fail silently when they did.

## Consequences

### Positive

§15.2 gets an answer, and the emitter that has been dispatching into an empty room since it was
written finally has a listener. The question the landing page was built to pose becomes one the
maintainer can read.

The half of the measurement that must never stop is on the one product that has no quota to exhaust.
Losing the event lane costs a dimension; it costs neither the audience figures nor a single thing a
visitor sees.

§15.3 gains a second enforcement point. The build already refuses to ship a placement carrying a
digit; the collector now refuses to record one, so the rule holds where the data enters as well as
where it is produced. The ordinal is written among the measured numbers rather than the grouping
dimensions, which puts the prohibition into the shape of the data instead of a comment above it.

Cloudflare stays the only subprocessor, and the events add nothing to the content policy.

### Negative

The repository now contains server-side code. It has been a static artefact and a set of scripts
throughout, and this is a different kind of thing to reason about, test and keep working.

The privacy page has to say more than it did, in both locales, and the sentence that promised no
finer-grained measurement is gone.

Analytics Engine ships no dashboard. Reading what was recorded means writing SQL against its API,
and whatever displays the answer is work this decision creates and does not do.

The confinement in `wrangler.jsonc` is now load-bearing in a way a line of configuration does not
look. Widening `run_worker_first`, or removing it, puts the site back in front of the quota and
re-opens everything §12.3 objected to.

### Risks

**Cloudflare has announced that Analytics Engine will be billed.** The free-plan allowance is
documented and this site is far below it, and a free-plan account answers exhaustion with refusal
rather than an invoice — but the terms are Cloudflare's to change, and this is the line to re-read
when they do.

**A confinement is a configuration, and configurations get widened.** The next person with a reason
to run the Worker on a second path will find nothing in their way but a comment. It is named here so
that widening it is a decision somebody takes rather than a drift nobody notices.

**The routing behaviour and the beacon's hosts are asserted from documentation, not from this
deployment.** That two hosts are the right two, and that a page request never invokes the script,
are exactly the class of property §12.5 says a real deployment settles. Until then they are
documented expectations, and Follow-up Actions says how they get checked.

## Follow-up Actions

* `scripts/verify-output.sh` gains three assertions, each break-tested before it lands: no placement
  in the artefact carries a digit (§15.3), no placement and variant pair reports two different
  commands or links (§15.2) — the pair is deliberately repeated where two elements do the same thing,
  so what is checked is the payload rather than the count — and the audience beacon and the content
  policy agree in both directions: a beacon the policy would
  block fails the build, and a policy naming hosts no document contacts fails it too.
* The collector validates every field against a shape rather than trusting it, and refuses a
  digit-bearing placement, so §15.3 is enforced at the point the data enters the dataset.
* The [deployment guide](../deployment-en.md) gains the step that turns the measurement on — the
  dashboard site, the public beacon token, and the dataset. How it is wired is specification and
  lives there, not here.
* Declaring the binding makes an account setting mandatory for **every** deployment, measurement or
  not: Analytics Engine has to be enabled on the account, once, or the API refuses to create a
  version. The guide's step 5 carries it, because it precedes the first publish rather than the
  measurement.
* Two things to confirm on a real deployment, and to add to §12.5's list until they are: that the
  beacon loads and reports under the generated policy, and that a request for a page never invokes
  the Worker.
* Reading the data — the query, and anything that displays it — is not part of this decision and is
  not implied by it.

## References

* [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) — the rule that keeps the beacon out
  of a build with no token to report to
* [`docs/design/specification.md`](../../design/specification.md) §15 (measurement), §12.3 (no server
  script), §12.5 (what a real deployment settles), §13.2 (the content policy)
* Cloudflare Web Analytics FAQ, on the absence of custom events and the refusal of direct posts
* Cloudflare Workers documentation on static-asset routing, `run_worker_first`, and the free-plan
  allowances for Workers and Analytics Engine
