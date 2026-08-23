# ADR-0024 | The playground reports a chain's shape, never its values

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0024-le-playground-rapporte-la-forme-dune-chaine-pas-ses-valeurs-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-23
**Accepted:** 2026-08-23
**Decision Makers:** Reefact

## Context

The playground is measured by nothing. ADR-0023's work established the fact against the built
artefact: `apps/playground/wwwroot/index.html` carries no audience beacon, no analytics tag, no
consent banner and no collector script, and a search of `apps/playground/` for `_event`,
`sendBeacon`, `gtag` or `dataLayer` returns nothing at all. The
[measurement plan](../measurement-plan-en.md) names that as a gap rather than a decision, under what
is not measured.

**Two rules bound what may leave that application, and they are not the same rule.**

§10.3 lists what the playground never does, and the last item is the operative one: *ou persister une
saisie ailleurs que dans le navigateur* — never persist an input anywhere but the browser. It is
unhedged.

§15.1 is softer: *le contenu exact saisi dans le playground n'est jamais enregistré par défaut* —
never recorded **by default**. The measurement plan restates it without the hedge, and the privacy
page makes the strongest claim of the three, in both locales: *Nothing you type there is ever sent to
a server — there's no server to send it to.*

An argument a visitor writes is a saisie under any of the three readings. Arguments are held as raw
text — `ChainLinkState` keeps a `List<string>` and never a typed value — and some of them are free
text: `StartingWith("…")` and the list arguments of ADR-0016 accept whatever is typed into them,
including an order reference, a name or an address a visitor pastes out of their own work.

**The chain's shape is not an argument.** The playground builds a chain from a catalogue that is
generated C# source (ADR-0010): every step a visitor can choose is a `MemberDescriptor` carrying a
`MethodName` and a `Parameters` list, and the generator writes each one's key as
`{receiverTypeKey}::{MethodName}#{parameters.Count}` at build time. What a visitor chooses is drawn
from that closed vocabulary; what a visitor types is the arguments alone.

`Home.razor` already walks that structure once, in `CodeSegments`: it iterates the chosen links, emits
the method name, the parentheses and the separators, and calls `FormatArgumentLiteral` for each
parameter to produce the line the visitor reads and copies.

The collector validates four fields against a shape and bounds each at 64 characters. ADR-0023
settled that a field may be absent from an event that has none, and that the variant answers *which
door was taken* — a question a chain does not pose. The measurement plan states that a rate is read
against the census lane, whose denominator is everybody, and never against the consent-gated one.

## Decision

**The playground reports the chain a visitor generated as the line they read with every argument
replaced by a question mark, in a field of its own, and never reports an argument's value.**

## Rationale

The question is worth an event under the measurement plan's own rule: is the playground used at all,
and do visitors compose constraints or stop at a bare generator? Both change a decision — the first
about whether the playground earns the megabyte and a half it costs, the second about what the
catalogue and the documentation should lead with. Neither is answerable today, because nothing is
recorded.

**The shape carries the answer and the values do not.** Two stacked ranges is the interesting fact
about `Between(?, ?).Between(?, ?)`; which numbers were in them is not. That is not a privacy
concession made at the cost of the measurement — the values were never the signal. Dropping them
costs the question nothing.

**Every argument goes, including the numbers, and the absence of exceptions is the point.** A rule
that kept numeric arguments would have to judge each argument's sensitivity at the moment of sending,
and that judgement is made against a catalogue that grows: a generator taking a format string, a
pattern, or a list whose elements are typed as text but read as numbers would each need the rule
applied again, correctly, by whoever added it. A rule with no exceptions is one a reader can check in
a single glance, and one the collector can enforce without knowing anything about the catalogue.

**The template is the line the visitor read, minus the values, and that is why it is the right
shape.** It preserves what a compact key would flatten: how many arguments each step takes, and
therefore whether two steps of the same name were given the same arity. It is also the form a
maintainer reading a dashboard already knows how to read, because it is the form the code bar draws.
And it is produced by the walk that draws that bar — the same iteration over the same links, declining
to call the formatter — so the anonymisation is not a filter applied to a finished string but a value
that was never assembled.

**A list argument counts once per value, not once per parameter.** `OneOf` and `Except` take
`params T[]`, and ADR-0016 gives them one comma-separated field; the code bar spreads that field back
into the call, so `OneOf("red", "green", "blue")` is a line carrying three arguments where the
catalogue names one parameter. Reported per parameter it would read `OneOf(?)` — a shape the bar can
never draw, and one that flattens every list arity into the same row, which is the flattening this
form was chosen to avoid. So the walk asks `SplitList` — the same function that cuts the values for
the parser and for the bar — for its count alone, and drops the values it returns.

**It needs a field of its own rather than the variant's.** ADR-0023 has just settled what a variant
means, and a chain is not a door; reusing the field would make the one query that groups doors
meaningless. The variant's own pattern could not carry it either — a chain is a shape with
parentheses and separators, not a lowercase name — and 64 characters is short for a chain of any
length.

**The field is optional, for the reason ADR-0023 made one optional.** A chain longer than the field
allows loses its shape rather than its count: the event still lands, still counts toward the total,
and reports no chain. Losing the rare long chain's shape is a smaller loss than losing the fact that
it happened, and an event that silently failed validation would have lost both.

The census lane is where this belongs, and not the consent-gated one, because the plan is explicit
that a rate is only readable against the lane that covers everybody — and because this event records
nothing about a person to begin with. It sets no cookie, recognises nobody, and asks nothing.

## Alternatives Considered

### Record the generated line verbatim

Considered because it is what a maintainer would most like to read, and because the line already
exists in `CodeSegments` — sending it would cost a single property.

Rejected because §10.3 forbids it in as many words: an argument is a saisie, and sending it persists
one outside the browser. The privacy page would have to stop promising, in both locales, that nothing
typed there is ever sent to a server — and that promise is not a detail of the copy but the reason a
visitor can paste their own data into the playground to see what the library makes of it.

### Report only the generator, not the chain

Considered because it is the smallest thing that answers "is the playground used": `Any.Byte()` alone,
no steps, no arguments, nothing to anonymise, and no new field.

Rejected because it drops precisely the half that changes a decision. Whether visitors compose
constraints — and which ones they compose together — is the question the catalogue's shape and the
documentation's ordering would actually be revised on. A generator count says the playground is used
and nothing about what for.

### Report the list of catalogue keys

Considered because the keys already exist, are already anonymised by construction
(`AnyByte::Between#2` names a receiver, a method and an arity, and can hold nothing else), and would
need no formatting code at all.

Rejected on readability rather than on safety, which is where the two are close: the information is
the same, but a dashboard row reading `AnyByte::Between#2>AnyByte::Between#2` is a form nobody on this
project reads anywhere else, while the template is the form the code bar draws on every visit. The
keys also spell the receiver on every step, which is redundant once the steps are in order.

### Keep numeric arguments and anonymise only the text ones

Considered seriously, and it is the alternative with a real argument behind it: a `5` in
`Between(5, 50)` is a test bound, not personal data, and keeping it would say which ranges visitors
reach for.

Rejected because it makes the rule conditional on a judgement, and the judgement is the part that
drifts. It would have to be re-applied by whoever adds the next generator, against a catalogue that
grows on the library's schedule rather than this repository's; a text argument that reads as a number,
or a numeric one that carries a formatted date, would each be a new case to get right. It also buys
little: which bounds a visitor picked answers no question this event was added for.

## Consequences

### Positive

The playground stops being the one part of the site nobody can say anything about. The total answers
whether it is used; the shapes answer what it is used for.

The anonymisation is a guarantee rather than a promise. The collector's pattern for the field admits
`?` and nothing else where an argument would stand, so an argument value cannot be recorded even by a
sender that tried — including a sender that is not this site.

Nothing about the visitor is recorded, so this reaches the lane that covers everybody, and the usage
figures stay readable as a rate rather than as a rate among the consenting.

### Negative

The collector grows a fifth field and a fifth pattern, on a public endpoint. Every later reader of
`worker/index.ts` meets one more thing to understand.

The dataset gains a long tail. A chain of four steps chosen from a catalogue of dozens is a shape that
may occur once, so the rows that group cleanly will be the short chains and the rest will be
scattered. That is the signal rather than a defect, but a dashboard built on it has to expect it.

A chain longer than the field's bound reports no shape at all. How long is long enough is a number
picked once, and picked without traffic to pick it against.

### Risks

**A shape could in principle be rarer than a name.** A visitor building an unusual chain contributes a
row that occurs once, and a row that occurs once is closer to identifying than a row that occurs a
thousand times. What bounds it is that every element of the shape comes from a closed, published
catalogue, that no argument, address, identifier or timing beyond the event's own is recorded beside
it, and that the row cannot be joined to anything — the census lane recognises nobody, so there is no
second row to join it to.

**A list's arity is a number the visitor chose, and every other part of the shape is not.** A method
name comes from a closed catalogue; how many values somebody put in a list does not. It is still a
count rather than a value, it is bounded at the sandbox's fifty, and a chain long enough to be
distinctive that way loses its shape to the field's own bound before it lands. What it costs is
admitted here rather than left to be discovered: a row reading `OneOf(?, ?, ?, …)` with an unusual
number of marks is rarer than the same step with two.

**The catalogue may one day carry a method name that is itself revealing.** The pattern admits any
method name the catalogue can produce, because it must; if a generator is ever named after something
that should not be reported, the guard is this record and the review, not the regex.

## Follow-up Actions

* **What fails when this is broken, by construction rather than by check:** the collector's pattern
  for the chain field admits a question mark where an argument stands and admits no other character
  there. A payload carrying `Any.String().StartingWith("ORD-")` does not fail a comparison — it fails
  to match, and is refused at the endpoint exactly as a malformed variant is. That is the guarantee
  CONTRIBUTING prefers over an assertion, and it holds against any sender rather than only against
  this one.
* **And what fails as a check, because a guarantee at the endpoint says nothing about what the page
  sends:** a browser check builds a chain carrying a text argument, presses Generate, and asserts that
  the posted body carries the template and does not contain the typed value anywhere. Break-tested
  before the pull request, per CONTRIBUTING.
* The [measurement plan](../measurement-plan-en.md) gains the event in the census lane's table, in
  both locales, and loses the part of its playground gap that this closes.
* The privacy page states what is now recorded from the playground, in both locales, and its revision
  date moves with it. The sentence promising that nothing typed there is ever sent to a server stays
  true and is worth keeping in those words — this decision is what makes it remain true.
* The [deployment guide](../deployment-en.md) states the new field's position in the dataset and what
  an absent chain means on a row that has one.

## References

* [ADR-0023](0023-an-event-carries-a-variant-only-when-it-has-a-door-to-choose-en.md) — the field that
  may be absent, and the variant this deliberately does not reuse
* The journey lane is deliberately out of scope here and is a decision of its own: reaching it from the
  playground means a consent banner in a document that has none, which lands with its own record
* [ADR-0012](0012-the-site-runs-one-worker-script-for-measurement-en.md) — the collector this extends
* [ADR-0010](0010-the-playground-catalogue-is-generated-c-source-not-json-en.md) — the generated
  catalogue the shape is drawn from
* [ADR-0016](0016-a-list-argument-is-one-comma-separated-field-en.md) — a list argument, and why an
  argument is free text
* [`docs/design/specification.md`](../../design/specification.md) §10.3 (what the playground never
  does), §15.1 (what is never recorded), §15.2 (the dimensioned event)
* [The measurement plan](../measurement-plan-en.md) — the rule for adding an event, and the gap this
  closes
