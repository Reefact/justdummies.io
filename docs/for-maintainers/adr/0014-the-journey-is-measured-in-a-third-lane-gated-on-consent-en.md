# ADR-0014 | The journey is measured in a third lane, gated on consent

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0014-le-parcours-est-mesure-dans-une-troisieme-voie-soumise-au-consentement-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-17
**Decision Makers:** Reefact

## Context

[ADR-0012](0012-the-site-runs-one-worker-script-for-measurement-en.md) settled how §15 is served:
Cloudflare Web Analytics for §15.1's audience and performance figures, and a Worker collector on one
path for §15.2's dimensioned copy event. Both are free, both are without quota or nearly so, and
neither sets a cookie or identifies anybody. Cloudflare is the only subprocessor the privacy page has
to name.

Those two answer how many people arrived and how many copied a command. Neither can say what happened
between the two. The landing page is a narrative of three acts and sixteen named scenes; §15.2 states
that the useful information is **which moment convinced them**, and a count of copies carries the
answer only for readers who reached a copy button. Where a reader stopped, which scenes were read
before the one that convinced them, what they compared first, and whether a second visit is the same
person returning are all outside what either lane can express. Web Analytics has no custom-event API
at all, and the collector records no identifier, no timestamp beyond its own, and no page dimension —
by design, and that design is what makes it exempt from consent.

Google Analytics 4 answers those questions, through session-scoped path and funnel exploration. It is
free at this site's volume. It writes first-party cookies holding a random client identifier, which
is what lets two visits from one browser count as one reader.

The CNIL has never exempted Google Analytics from consent, in any version, and states that no
configuration of it meets the exemption criteria: the `_ga` cookies do not have audience measurement
as their exclusive purpose. Since 1 January 2026 the CNIL's evaluation programme is replaced by
self-assessment against published criteria, which does not change that finding. A consent mechanism
is therefore required, and this repository has none: it contains no cookie, no `localStorage`, no
`sessionStorage`, and no occurrence of the word consent anywhere.

Google's consent mode has two shapes. The advanced one loads the tag immediately and sends cookieless
pings while consent is withheld, which Google models into the reports. The basic one loads nothing
until consent is granted. A cookieless ping still reaches Google's servers, and the EDPB-aligned
reading is that it is processing requiring a legal basis that consent mode does not itself supply.

Since 15 June 2026, `ad_storage` is the only control governing whether data collected by a Google tag
reaches a Google Ads account; the Google Signals switch in the Analytics console no longer restricts
that flow.

ADR-0012 considered and rejected "a third-party analytics service", on three costs: a second
subprocessor to name on the privacy page, a third-party host in the content policy on the path of
every page, and either a subscription or a server to run. Every candidate it weighed was cookieless.

§12.3's objection to a server script is a cost-and-failure model about a script on the site's path.
§13.2 forbids broad authorisation in the content policy — `unsafe-inline` and `unsafe-eval` — and
requires that every policy change be validated by a real load rather than by review. §13.3 requires
a numbered budget for the landing page's own JavaScript, measured every build.

`scripts/generate-headers.mjs` derives third-party hosts from the built artefact rather than from a
flag, so that the policy is never wider than what was built. `scripts/verify-output.sh` asserts the
beacon and the policy against each other in both directions.

Astro collects bundled `<script>` tags from the module graph rather than from the render tree, and
registers each as a build entry. A script in a component that is never rendered is therefore still
emitted as a chunk.

## Decision

**The journey is measured by Google Analytics in a third lane that starts only on an explicit yes,
leaving the two existing lanes untouched and asking nobody, and governed by a build switch that is
separate from the measurement id.**

## Rationale

The question §15.2 exists to ask — which moment convinced a reader — is only half answered by
counting copies, because a count says nothing about the readers who never reached one. The page is
built as a sequence of named beats, and the sequence is the thing the editorial claim rests on. Since
neither existing lane can express a path, either the question stays half answered or something that
can express one is added. That is the whole of what had to be decided.

Adding it as a **third lane rather than a replacement** is what keeps the cost proportionate. The
figures that must not stop are already carried by the lane with no quota, and the conversion count is
already carried by a collector that measures everyone; leaving both untouched means a refusal costs a
journey and never a total. It also means the measurement most likely to be refused is the one whose
loss is least expensive, and that the site's totals stay unbiased by the refusal rate — which a
single-lane Google setup would not be, since its denominator would be the consenting fraction.

Consent is not a design choice here but the CNIL's stated position, so the only real choice is which
consent mode. **Basic is chosen over advanced** because the advanced mode's cookieless pings are the
one thing this site would find hardest to defend: a transfer to Google occurring before the visitor
answered, in exchange for modelled figures. Nothing loading before an answer is also the only version
of the promise that a check can prove, and it is proved rather than asserted.

The three advertising signals stay denied permanently rather than following the answer, because
`ad_storage` is now the sole gate on the Ads flow and this site has no advertising purpose to serve.
Keeping the advertising hosts out of the content policy makes that denial something the browser
enforces: a granted signal produces a refused request and a reported violation, rather than a silent
change of behaviour. This turns the weakest part of the decision — a console setting nobody here can
read — into an artefact assertion and a browser check.

ADR-0012's three costs are accepted rather than argued away, and one of them is worse than it was
there: every candidate it weighed was cookieless, and this one is not. What has changed is not the
price but the requirement — that ADR was answering §15.1 and §15.2, and neither of them asks for a
path. The two policy costs are also smaller than they read: §13.2's prohibition is on broad
authorisation, and this needs none — the tag is a named host, and the one inline script it adds is
covered by a hash like every other. What genuinely widens is that the policy names a third-party host
on the path of every page.

The switch is **two variables because they do two jobs**. An id is a value looked up once and kept;
a state is a decision. Folding them into one would mean that switching the measurement off costs the
id and that switching it back on means fetching it again, which makes the reversible thing expensive
and therefore unlikely. Both are required and a misspelling fails the build, because a state variable
whose typo silently means "off" buys none of the explicitness it was chosen for. That is stricter
than the beacon token next door, and the asymmetry is the point: a missing token can only measure
less, while a missing state leaves the question answered by an absence.

Making the switch a build-time one keeps it in the artefact and in the repository's history, so that
turning the measurement off is a recorded act rather than a console setting nobody can date. It is
the slower option, and it is chosen knowing that; the immediate lever, when one is needed, is outside
this repository and is deleting the data stream.

The tag is inline rather than bundled for a reason that is not style. Because Astro registers scripts
from the module graph, a bundled tag would leave a chunk naming a Google host on a build that renders
it nowhere — a host no document loads, no policy can honestly admit, and the size budget counts in
full. Inline never enters the graph, so "switched off means the string is absent" holds by
construction. Carrying the id on an attribute rather than in the body keeps the hashed bytes
identical across every page and every build, so rotating the id does not churn the policy.

## Alternatives Considered

### Leaving §15 as ADR-0012 settled it

Considered because it is the honest cheap answer, and because ADR-0012 is recent, coherent, and
already pays for §15.1 and §15.2 in full. It costs no consent banner, no second subprocessor, no
cookie, and no rewriting of a privacy page that was rewritten a day earlier.

Rejected because the question the landing page is built to ask is not fully answered by what it
settles. A count of copies describes the readers who arrived at an offer and says nothing about those
who left before one — which is the larger group, and the one whose behaviour would change the page.
The editorial claim that the narrative is what convinces is exactly the claim that stays unmeasured.

### A cookieless third-party analytics service

Considered because several exist, several can express a path, several would need no consent banner at
all, and one of them would leave the privacy page's cookie promises intact. It is also the option
ADR-0012's rejected alternative was actually describing.

Rejected because the exploration this site needs — where a reader stopped, along which path, across
sessions — is the part these do least well, since most of them deliberately do not recognise a
returning browser. Choosing one would buy a smaller privacy cost and a smaller answer, and the
smaller answer is the thing being bought. Where a hosted plan is free, its free tier is also a
commercial decision that can be withdrawn.

### Google Analytics in advanced consent mode

Considered because it is what most implementations use, and because it recovers a substantial part of
the data a refusal costs: the tag loads immediately, sends cookieless pings, and Google models the
gaps into the reports.

Rejected on the pings. They reach Google before the visitor has answered, and the reading this site
would have to defend is that they are processing without a legal basis. It also makes the site's
central promise unprovable: "nothing reaches Google before you accept" is a claim a check can hold,
while "something reaches Google but it is anonymous" is not.

### Google Analytics with no banner

Considered because it is the least work, gives complete data, and because the risk is the
maintainer's to take.

Rejected because the CNIL's position is not ambiguous and no configuration answers it, so this is not
a risk being weighed but a rule being ignored. It would also require deleting the privacy page's
cookie promises with nothing offered in their place, on a site whose privacy page is one of the
things it is for.

### One variable, empty to disable

Considered because it is the pattern the beacon token already uses, one variable is simpler than two,
and it needs no validation beyond presence.

Rejected because the two values are not one thing. Emptying the variable to switch the measurement off
discards the id, so switching it back on means going to the Google console to look it up again — a
reversible decision made expensive by its own switch. An absent variable is also indistinguishable
from a misconfigured one, which is exactly the ambiguity a state named in words removes.

## Consequences

### Positive

The question the landing page was built to ask becomes answerable along its whole length rather than
only at its exits, and the sixteen scenes stop being unmeasured.

The figures that must not stop cannot be stopped by this. Audience counts and conversion counts still
cover every visitor, so the refusal rate changes what is known about the journey and nothing about
the totals — and the conversion rate is still read against an unbiased denominator.

The permanent denial of the advertising signals is enforced by the content policy and by a browser
check, rather than by a console setting and a promise.

Switching the measurement off is a recorded, dated act in the repository, and it costs neither the id
nor a trip to the Google console.

§15.3 gains a third point of application: the ordinal is reported as a measured number and the scene
is identified by its stable name, as it already is in the artefact and at the collector.

### Negative

Google becomes a second subprocessor, outside the European Union, and the privacy page has to say so
in both locales. Four sentences it made — no tracking cookie, a tool that sets none, Cloudflare as
sole subprocessor, and nothing to erase — were true and are now conditional or false.

The site writes client-side persistent state for the first time, and asks a question before it has
finished being read for the first time. Both are visible product changes rather than plumbing.

The content policy names a third-party host on the path of every page, which is the cost ADR-0012
named and refused to pay.

A visitor who accepts downloads roughly ten times the audience beacon's weight from a third party.

Two repository variables become mandatory for every build, including builds that measure nothing, so
a fork or a fresh clone fails until both are set.

The journey is known only for the consenting fraction, so every path and funnel figure is a sample
rather than a census, and reading one as a census would be the mistake this arrangement invites.

### Risks

**A console setting no check can hold.** Enhanced measurement's page-view-on-history-change must be
switched off, because the landing page pushes history state on every in-page anchor click. Left on,
every chevron click reports a page view and silently inflates the landing page's figures. There is no
tag parameter for it and the browser checks stub the tag, so nothing here can detect it.

**Consent mode's shape is Google's to change.** The advertising signals are denied in this artefact,
but what a denied signal means is defined by Google, and it was redefined in June 2026. This is the
line to reread when it is redefined again.

**A third lane is a lane, and lanes accumulate.** The reason this one is defensible is that the two it
joins are untouched and unconditional. An edit that makes an audience figure depend on the consenting
lane would remove that, and would do it without failing anything.

## Follow-up Actions

* `scripts/verify-output.sh` gains the tag-and-policy assertion in three directions, each proved by
  being broken first: a tag the policy does not fully admit, a policy naming hosts no document
  carries, and — the direction the beacon never needed — a Google host appearing in a bundled chunk,
  which is what would silently undo the inline decision above.
* The same script asserts that every advertising consent signal is denied in the shipped document and
  granted nowhere, so the decision holds where the data is produced.
* `tests/browser/consent.spec.ts` holds the promise itself: nothing reaches Google before an answer,
  refusing loads nothing and is remembered, accepting loads the tag, and refusing is offered exactly
  as prominently as accepting. `tests/browser/policy.spec.ts` exercises the collect hosts with a real
  request and asserts the advertising hosts stay refused.
* `tests/browser/support/harness.ts` answers the Google hosts locally, or a release would report a
  suite's worth of invented journeys into the live property.
* `scripts/check-budgets.sh` declares the tag's weight in its informational block, since a budget that
  silently excludes part of what a visitor downloads reads as complete while being short by whatever
  it skipped.
* The [deployment guide](../deployment-en.md) gains the step that turns the lane on: the property, the
  two variables, the custom dimensions to register, and the enhanced-measurement setting named under
  Risks — which belongs there precisely because no check can hold it.
* Registering the custom dimensions is not optional and is not retroactive: a parameter not registered
  is not reportable, and registering it later does not backfill.
* Reading the data — the explorations, and what would be made of them — is not part of this decision.

## References

* [ADR-0012](0012-the-site-runs-one-worker-script-for-measurement-en.md) — the two lanes this one
  joins, and the rejected alternative it reopens
* [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) — the rule that keeps the banner out
  of a build with nothing to consent to
* [`docs/design/specification.md`](../../design/specification.md) §15 (measurement), §13.2 (the
  content policy), §13.3 (performance), §16 (what is verified, and by what)
* [The measurement plan](../measurement-plan-en.md) — the events, and the question each one answers
* The CNIL's position on audience measurement exempt from consent, and its published criteria
* Google's guidance on consent mode, and on using a tag under a Content Security Policy
