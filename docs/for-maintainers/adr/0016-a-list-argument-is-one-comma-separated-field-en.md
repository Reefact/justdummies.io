# ADR-0016 | A list argument is one comma-separated field

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0016-un-argument-liste-est-un-seul-champ-separe-par-des-virgules-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-18
**Decision Makers:** Reefact

## Context

Specification §10.5 asks the catalogue to be complete: every public member is either catalogued or
excluded with a stated reason. The reason is an audit trail, not a feature — a member that only
ever appears in the exclusion report is a constraint the playground cannot demonstrate.

The catalogue's first iteration drew one form field per parameter, and a field held one value. Every
parameter that named a collection therefore failed classification for want of a shape to ask it in,
and forty-five members were excluded on that single ground — `Except` and `OneOf`, on each of the
twenty-three scalar builders the library ships. Those two are not marginal members: "a value drawn
from this set" and "a value that is none of these" are among the first constraints a reader looks
for after meeting the library, and neither existed in the playground.

The library declares both as `params` arrays on every scalar builder. The one collection parameter
declared otherwise is `AnyString.OneOf`'s `IEnumerable<string>` overload, which expresses the same
constraint as its `params` sibling beside it.

Two properties of the surrounding design bear on how such a parameter could be asked for. A chain
step is flat (ADR-0010): its arguments are positional raw text, one string per parameter, which the
generated dispatch table parses and passes on. And the card and the line below it divide labour
(ADR-0014): the card is the reading of the chain, the code bar is the line that compiles and is
handed to the clipboard — the line a reader would have written themselves.

## Decision

**A parameter declared as a `params` array of a scalar type the playground already parses is asked
of the visitor as one comma-separated field, and written back into the copied line as a spread of
individual literals.**

## Rationale

Cataloguing these members costs a separator, not an architecture. A comma-separated field keeps a
parameter to exactly one piece of raw text, which is what the flat chain step, its dispatch entry
and its replay already take — so the whole of the change lands in parsing and rendering, and nothing
about how a chain is modelled, run or replayed moves. Forty-five members reach the visitor for the
price of a shape, and they are the members most likely to be looked for.

Parsing each value as its own element type, rather than treating the field as a new kind of value, is
what makes that cheap honest. Each value is held to its type's own rules, its own sandbox ceiling and
its own wording, so a list field says what every other field of that type says. The accepted cost is
that the message names the type rather than the offending position; the field is one input the
visitor is already looking at, and a vocabulary shared with the rest of the playground is worth more
than the index.

Spreading the values back into the copied line follows ADR-0014's division. The bar's promise is the
line a reader would have written, and where the library declares `params` that line has no array
construction in it. Honouring that promise means the catalogue can only accept an array parameter
whose declaration permits the spread — so a parameter declared otherwise is excluded, with its
reason, rather than emitted in a second shape. Nothing in the library is declared that way today;
what the rule buys is that a change making one so is reported rather than silently mis-emitted.

The remaining non-array collection overload stays excluded because cataloguing it would offer the
visitor the same constraint twice, under one name, with nothing to tell the two apart. Keeping it
out of the combo is not this decision's work, though: ADR-0015 already rules that a name with a
working overload is a working name, so the excluded one is shadowed by the one this decision makes
available. The two decisions meet there, and they agree — what ADR-0015 would otherwise have named
as unavailable, this one makes offerable, which is the outcome that record wanted and could not
produce on its own.

What the separator costs is real and bounded: a value that is empty, or that carries a comma or
edge whitespace, cannot be written in such a field. The code bar prints the values exactly as they
will be passed, so a visitor who meets one of those cases is shown what they got rather than left to
infer it.

## Alternatives Considered

### A repeating widget — one input per value, with controls to add and remove them

Considered because it expresses every value a `params` array can hold, including the ones a
separator swallows, and needs no convention explained to the visitor.

Rejected because it makes one parameter into an unknown number of inputs, and the whole chain is
built on the opposite: a step's arguments are positional raw text, one string per parameter, and the
dispatch table, the replay, the writability test and the card's own rendering all read them that
way. Every one of those would have to learn about a parameter whose input count varies, to buy an
escape for values a demonstration of the library rarely needs.

### Leave them excluded until composite generators arrive

Considered because both were excluded together in the first iteration, and a single later pass could
have covered them at once.

Rejected because the two have nothing in common but the date they were deferred. A composite
generator needs a generator nested inside a chain, which is a change to what a chain is; these need
a way to write several values in one field. Holding the cheap one behind the expensive one buys
nothing and postpones a gain that is available now.

### Always construct the array explicitly in the copied line

Considered because it drops the requirement that the declaration permit a spread, so a plain array
parameter would be catalogued too, and one emission shape would cover both.

Rejected because it spends the bar's promise to buy a case the library does not have. The line
handed over would stop being the line a reader would have written, on every member this decision
exists to add, so that a shape nothing declares today could also be covered.

## Consequences

### Positive

* Forty-five members move from the exclusion report into the catalogue, across every scalar builder
  at once, including the two constraints a reader is most likely to look for first.
* The chain model is untouched: a parameter is still one piece of raw text, so dispatch, replay and
  the card keep the shape ADR-0010 gave them.
* A value in a list is held to exactly the rules, ceilings and wording its type is held to
  everywhere else in the playground.

### Negative

* A value that is empty, or that carries a comma or leading/trailing whitespace, has no spelling in
  such a field.
* A failing value is named by its type, not by its position in the list.
* An array parameter whose declaration does not permit a spread is now a catalogue exclusion. No
  such parameter exists in the library today; if one appears, the constraint leaves the playground
  rather than being emitted in a shape the bar does not promise.

### Risks

* The separator is a convention, and a convention has to be learned. The field carries it where it
  can be read and the accessible name carries it in words, but a visitor who takes in neither meets
  it as an error message rather than before making the mistake.

## Follow-up Actions

* **An assertion in the build.** A browser check drives the field the way a visitor does and asserts
  both halves of the decision: that the values reach the library — the drawn value belongs to the
  set typed in — and that the copied line spreads them. It was watched go red (with the field's
  values no longer trimmed) and put back.
* **A guarantee by construction.** The generator itself refuses to catalogue an array parameter
  whose declaration does not permit the spread, so the emitted line cannot quietly become invalid
  C# through a library change; it becomes a stated exclusion instead.
* **A diff to read.** The exclusion report is regenerated and committed on every generation, so a
  member entering or leaving the catalogue is visible in review rather than discovered on the
  published artefact.

## References

* Specification §10.4–§10.7 — the catalogue, its completeness rule, and what it derives
* [ADR-0010](0010-the-playground-catalogue-is-generated-c-source-not-json-en.md) — the flat chain
  step and the generated dispatch table this decision keeps intact
* [ADR-0014](0014-the-playground-builds-inside-the-card-it-reads-en.md) — the division between the
  card as reading and the bar as code, which decides how a list is written back
* [ADR-0015](0015-the-combo-names-what-the-playground-cannot-offer-en.md) — names in the combo what
  this interface cannot express; forty-five of the members it counts become offerable here, and its
  shadowing rule is what keeps the redundant overload out of the list
