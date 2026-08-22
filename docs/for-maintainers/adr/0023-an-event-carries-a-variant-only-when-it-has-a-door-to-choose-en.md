# ADR-0023 | An event carries a variant only when it has a door to choose between

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0023-un-evenement-porte-une-variante-seulement-sil-a-une-porte-a-choisir-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-22
**Decision Makers:** Reefact

## Context

§15.2 asks the install-command copy to carry two dimensions. A **placement**, which is a stable
identifier of where the visitor was, independent of position. A **variant**, which the section
motivates in its own words: *disant ce qui a été copié, car la porte de sortie n'est pas la même* —
the CLI command and the Package Manager Console command are two different doors, and which one was
taken is the answer the event exists to give.

ADR-0012 built the collector that receives those events. It has been in service with exactly one
event reaching it, `install-command-copied`, and it validates four fields against a shape rather
than trusting them: the event name, the placement, the variant and the locale. All four are
required. The ordinal is the one field an event may omit, and §15.3 is why — the ordinal is a
convenience for reading a dashboard rather than part of the record.

The collector is a public endpoint. Anything reachable from a browser is reachable from a script, so
the validation is what protects the dataset, and a rejection is answered with the same 204 as an
acceptance: `sendBeacon` discards the response, and an endpoint that narrates why it refused an
input is an endpoint explaining how to craft an accepted one.

Analytics Engine stores each dimension as a blob, and the reporting queries in the
[deployment guide](../deployment-en.md) group by those blobs. A dimension is therefore a column
every later reader meets, on every row, whether or not it says anything.

The [measurement plan](../measurement-plan-en.md) states the rule for adding a measurement: name the
question first, and add nothing when no decision would change either way. It states the cost of the
opposite too — *an unread dimension is not free; it is one more thing every later reader has to rule
out.*

A second event now has a question worth asking. The floating download control introduced with
`DownloadFab.astro` stands on every page but `/download/` itself and was shipped with no measurement
in any of the three lanes (issue #161). The question it raises — whether a permanent call to action
on every page earns its place, or is visual noise — is a rate, and the plan states that a rate is
read against the census lane and never against the consent-gated one, whose denominator is the
consenting fraction. So the census lane is where that event has to land.

**That event has one door.** The control leads to the download page, from everywhere, always. There
is no second destination for a variant to distinguish, and no value it could carry that would not be
the same on every row.

## Decision

**The collector requires a placement of every event and a variant only of an event that has one, and
records an event with none as carrying an empty variant.**

## Rationale

The requirement being relaxed was never §15.2's. §15.2 asks the *copy* event for a variant, and
gives a reason that is specific to it: there are two commands behind one control, and the useful
fact is which was taken. The collector generalised that into a rule about every event because for as
long as it has existed there has been one event, and a rule derived from a sample of one is a
coincidence rather than a constraint. What the section actually asks for is that an event say which
door was taken **when there is more than one** — and this decision is that sentence read as written.

The alternative to relaxing it is inventing a value, and the measurement plan already prices that.
A constant variant is an unread dimension: it appears on every row of the new event, it sorts among
the real variants, it has to be excluded by name from any query that groups doors, and the first
maintainer to meet it has to establish that `none` was never a door somebody could take. Empty says
the same thing in a way that needs no explanation and costs no query a clause.

The relaxation is narrow enough to leave the endpoint's protection where it was. A variant that
arrives still has to be a name of the right shape, and a malformed one is refused exactly as before
— which matters more here than it looks: recording a rejected value as an absent one would make
rubbish and a legitimate silence identical in the dataset, and no later reader could tell them apart.
The placement stays required of everything, because every event has a where, and it is the field
§15.3's prohibition is enforced on.

Requiring the placement is also what keeps the new event answering more than a total. The dataset has
no page dimension — it never had one, because the copy event's placement already said where it
happened — so the placement is the only field that can carry the origin of a click, and the control
reports the section it was clicked from under it. Section rather than exact page, because the
decision the measurement informs is taken per section: a floating control is kept or dropped across
`/api/`, never on one entry page of it. It keeps the identifier digit-free as §15.3 requires, which
the exact route would not: a release-notes major is published under `v1`.

## Alternatives Considered

### Invent a variant for the events that have none

Considered first, because it costs no change to the collector, no record, and no reasoning: a word
like `none`, `default` or `download-page` would satisfy the existing validation on the day it was
written.

Rejected because the measurement plan's own rule refuses it. The value would never vary, so it
answers no question and changes no decision, and the plan states that a dimension nobody reads is
not free — every later reader has to rule it out. Worse, it is indistinguishable from a real variant
at the point where it matters: a query grouping by door would silently show it beside `cli` and `pm`
as though a visitor had chosen it.

### Leave the collector alone and measure the control only in the consent-gated lane

Considered because that lane needs no schema at all — it attaches the page address to everything it
reports, and it already carries the site's other exits, so the control could have joined them with
nothing else touched.

Rejected because it would not answer the question that motivated the measurement. Whether a
permanent call to action earns its place is a rate, and the measurement plan is explicit that a rate
read against the consent-gated lane is a rate among the people who accepted analytics, which is not
a fact about the page. The lane that counts everybody is the one that can answer it, and reaching it
means reaching the collector.

### Add a second endpoint, or a second event shape, for events without a variant

Considered because it would leave the existing contract untouched: the collector that has been in
service since ADR-0012 would keep refusing anything that does not carry all four fields, and the new
shape would live beside it.

Rejected because it doubles the surface for one optional field. Two endpoints are two things to
route, to validate, to keep in step and to remember when reading the dataset — and both would write
into the same dataset anyway, so the blob that is empty here would be empty there. It buys strictness
on a contract nothing else depends on, and pays for it in every later query and every later reader.

## Consequences

### Positive

The largest unwatched exit on the site is watched. Every page but one carried a control that led
somewhere and counted nothing, in all three lanes at once; it is now counted in the lane that covers
everybody and explained in the lane that knows the exact page.

The dataset says what it means. An event with no door reads as having none, rather than as having
taken one nobody offered.

The rule the collector enforces is now the rule §15.2 states, rather than a stricter one inherited
from having had a single event to enforce it against.

Nothing has to be registered in the GA4 console for the new event: it reports under `placement`,
which the measurement plan already lists among the registered custom dimensions. Its history is
readable from the first day, which is what that section exists to guarantee.

### Negative

The collector's contract is looser than it was. A field that was required of everything is now
required of some things, and "which things" is a judgement each new event makes for itself rather
than something the endpoint can decide.

A query that assumed every row carries a variant will meet an empty one. Nothing in this repository
makes that assumption, but the queries in the deployment guide are copied into shells and adapted.

### Risks

**The exemption is easier to take than to justify.** The next event with a variant that is merely
awkward to name can now omit it instead, and nothing at the endpoint distinguishes "has one door"
from "did not think about it". What guards against that is this record and the measurement plan's
rule for adding an event — neither of which is a mechanism.

**A section is a coarser origin than a page.** If the answer to #161's question turns out to depend
on which page inside a section, the census lane cannot give it and the consent-gated lane's
denominator is the consenting fraction. The exact page is available there, and it is the finer
reading to reach for; a finer census would need the placement to change, which changes what the
recorded history means.

## Follow-up Actions

* **What fails when this is broken.** `scripts/verify-output.sh` asserts that every page drawing the
  download control marks it with a placement — the omission this decision exists to answer was
  precisely a control that led somewhere and reported nothing, and losing the attribute again would
  be silent in every other way. Break-tested: the attribute was removed, the build went red naming
  the pages, and it was put back.
* The same script's existing rule — that one placement and variant pair never covers two different
  commands or links — now compares addresses with the document's own locale prefix removed. A route
  is the same in every locale but its prefix (§7.2), so the two locale twins of one destination are
  one door and not two; the dataset separates them regardless, since the collector writes the locale
  in a field of its own.
* The [measurement plan](../measurement-plan-en.md) gains the census lane's own events table, naming
  both events and the question each answers, in both locales.
* The privacy page's audience section named the copy event and stated that it was the whole of what
  is recorded without asking. That sentence is now false, and it is rewritten in both locales rather
  than left to be discovered — the same cost ADR-0012 paid in the copy, for the same reason.
* The [deployment guide](../deployment-en.md) states the field order the collector writes; its
  reporting query and its post-deploy check are updated to say what an absent variant looks like.

## References

* [ADR-0012](0012-the-site-runs-one-worker-script-for-measurement-en.md) — the collector whose schema
  this widens
* [ADR-0018](0018-the-journey-is-measured-in-a-third-lane-gated-on-consent-en.md) — the consent-gated
  lane, and why a rate is not read against it
* [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) — the rule the download control
  applies to navigation, and the one #161 proposes acting on if the answer is poor
* [`docs/design/specification.md`](../../design/specification.md) §15.2 (the dimensioned event),
  §15.3 (the ordinal is never a key), §7.2 (a route is the same in every locale)
* [The measurement plan](../measurement-plan-en.md) — the rule for adding an event, and the lanes a
  rate may be read against
* Issue [#161](https://github.com/Reefact/justdummies.io/issues/161) — the download control is
  unmeasured on every page
