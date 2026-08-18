# ADR-0015 | The combo names what the playground cannot offer

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0015-le-combo-nomme-ce-que-le-playground-ne-peut-pas-offrir-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-18
**Decision Makers:** Reefact

## Context

The playground's method combo is driven by the generated catalogue (ADR-0010): a build-time
reflection pass over the published JustDummies assembly decides, member by member, what v1 can
express as a flat chain step. What it cannot express is excluded with a stated reason
(specification §10.5/§10.6), and the reasons are real — an open generic method has no closed
instantiation to call, a delegate or a nested `IAny<T>` parameter has no form input, a
multi-value argument has no v1 shape, a parameter type may have no argument parser.

Seventy-seven members are excluded that way today. Eleven of them are `Any`'s composite
generators — `ListOf`, `SetOf`, `Combine`, `Enum`, `OneOf`, `PairOf`, `TripleOf`, `ArrayOf`,
`SequenceOf`, `DictionaryOf`, `ElementOf` — and two more, `.As(...)` and `.OrNull()`, extend
every generator the library has. These are not marginal members. They are a substantial part of
what JustDummies is for, and they were invisible: the combo listed what the playground could
run and said nothing about the rest.

A visitor has no way to know that. The combo is the only enumeration of the library's surface
the page offers, and it is read as one — the page invites them to "discover the JustDummies
library by trying it directly here". Someone who opens the playground, looks for a way to draw
a list, and does not find one, learns something false about the library rather than something
true about this web form.

The page already carries a scope note saying the interface is narrower than the library. A note
at the top of a page is not read at the moment the question is asked, which is when the combo is
open and a name is missing from it.

The exclusions are not one kind of thing. Some members are excluded because this form cannot ask
for their arguments; others — `Any.UseSeed(...)`, `Any.Reproducibly(...)`, `Any.WithSeed(...)` —
because their return type is not a chain-eligible builder at all, so no expression could continue
through them. Only the first kind is a limitation of the interface. Some names are also excluded
in one overload and catalogued in another: `Any.StringMatching(string)` works here,
`Any.StringMatching(Regex)` does not.

## Decision

**A member the web interface cannot express is named in the combo as a disabled option that says
so, rather than omitted from it.**

## Rationale

The combo is where the question is actually asked, so it is where the answer belongs. Naming the
member and refusing it converts a silence a visitor must interpret into a sentence they can read:
the capability exists, this page cannot reach it. That is the same claim the page's scope note
makes, delivered at the moment it is needed rather than several paragraphs earlier.

What makes the silence worth fixing is whose reputation it costs. The playground exists to
demonstrate the library; a demonstration that quietly under-reports its subject's surface argues
against it. The eleven composite generators are the clearest case — a visitor evaluating
JustDummies against a library that generates collections will look for exactly those, and the
absence reads as an answer.

The distinction between the two kinds of exclusion is what keeps the new entries honest, and it
is why this is modelled in the catalogue rather than as a disabled attribute chosen in the markup.
A member excluded because its return type is not a builder is not a chain step at all; offering it
in a list whose every entry means "the next call in this expression" would be a category error, not
a limitation declared. Carrying the support state as data lets the generator make that call once,
where the reflection facts are, and lets anyone reading the catalogue see which of the two an entry
is. A UI-level flag would have to re-derive it from nothing.

Shadowing follows from the same concern for what an entry claims. A name with a working overload
is a working name; listing the overload that does not work beside the one that does would read as
a contradiction rather than a limit. And since the disabled entries print no arguments — being
unable to ask for arguments is what put them there — overloads of a single name would be repeats
of one dead line, so one entry per name per receiver is the only form that carries information.

The cost is a longer list with unusable entries in it, which is a real cost and the one ADR-0004's
title warns about. It is accepted here because that decision's subject was different: a control
that silently does nothing when its script never arrives, hiding content behind it. A disabled
option does nothing *visibly*, says why, and hides nothing — the platform's own disabled semantics
reach the pointer, the keyboard and the screen reader without anything of ours being invented.

## Alternatives Considered

### Leave the combo as it is, and let the scope note carry the caveat

Considered because the note already exists, costs nothing per entry, and keeps the combo free of
entries nobody can pick.

Rejected because a note at the top of the page and a name missing from a list are read minutes
apart, in that order. The note tells a visitor that something is missing; it cannot tell them
which thing, and the one moment they would benefit from knowing is the moment they are looking
for it. Every unusable entry this alternative saves is an unanswered question it creates.

### Show every excluded member, without distinguishing the kinds

Considered because it is the simplest reading of "show what is missing", needs no new modelling,
and cannot be accused of hiding anything.

Rejected because it would put `UseSeed(...)` and `Reproducibly(...)` in a list of chain steps,
where a visitor could only read them as calls they might have chained. Those are real members
that this playground genuinely does not offer, but they are not steps in an expression, and the
combo has no way to say "real, unavailable, and also not the kind of thing this list is about".
Being exhaustive about the wrong set is not more honest than being exact about the right one.

### Render the unavailable entries as a separate, non-interactive list beside the combo

Considered because it keeps the combo purely actionable and gives the excluded surface room for
its reasons, which a single option label has little of.

Rejected because it separates the answer from the question again, in space instead of in time.
The value of naming these members comes from their being where a visitor looks for them —
alphabetically among their siblings, filtered to the type currently in hand. A second list has to
be found, and it re-poses the problem the scope note already has.

## Consequences

### Positive

A visitor searching the combo for a capability the library has now finds it, with the reason it is
unavailable attached, instead of finding nothing and drawing their own conclusion.

The catalogue distinguishes "cannot be expressed by this interface" from "is not a chain step",
which was implicit in prose reasons before and is now a value anything reading the catalogue can
act on.

The exclusion report says which excluded members the UI names, so an audit of what was left out
can tell hidden from shown without reading the generator.

The interface's own limits become visible and therefore reviewable: an entry that should be
selectable and is not now shows up as a wrong answer on the page rather than as an absence nobody
can see.

### Negative

Every builder's combo is longer, by two entries (`.As(...)`, `.OrNull()`) plus whatever
constraints its type excludes, and some of that length is unusable by construction.

The generated catalogue now carries members the dispatch table has no call site for, so
"described" and "dispatchable" are no longer the same set. The generator's self-check had to be
narrowed to the second, which is a genuine weakening of a check that used to compare everything it
emitted.

An unavailable entry carries no summary and no documentation link, so the one thing a curious
visitor might want next — what does `ListOf` actually do — is not offered here. The API pages have
it; this page does not link them per entry.

### Risks

The support state is carried by a trailing argument on the emitted descriptor literal, and the
generator's self-check tells dispatchable members from named ones by reading that argument back
out of the emitted text. An emitter change that split a literal across lines would silently widen
the check's input. The literals are written one per line today and the check depends on it.

A future member excluded for a reason that is neither of the two kinds this decision names would
be classified by whichever branch it falls into rather than by a deliberate choice. The
classification is a closed enumeration, so adding a cause is a compile-time prompt to decide;
mapping a new structural reason onto an existing cause is not.

## Follow-up Actions

- `tests/browser/playground.spec.ts` asserts that a real, unsupported member is listed and
  disabled, that its label carries the reason, and that the supported members beside it stay
  selectable. It was verified by removing the `disabled` attribute, watching the check go red on a
  rebuilt artefact, and restoring it. It runs in the build (`scripts/check-in-browser.sh`).
- The generator's self-check (`tools/playground-catalogue`) continues to fail the build if a
  dispatchable descriptor has no call site or a call site has no descriptor.
- Nothing checks that the *reason* for an exclusion is classified correctly — that a future
  structurally-excluded member lands on the cause a human would have chosen. Named here as a gap
  rather than left implied: the enumeration makes the question unavoidable when a new cause is
  added, and invisible when an existing one is reused.

## References

- Specification §10.4 (the catalogue drives the builder), §10.5/§10.6 (an omission is excluded
  with a stated reason), §10.7 (what the catalogue derives)
- [ADR-0010](0010-the-playground-catalogue-is-generated-c-source-not-json-en.md), which made the
  catalogue generated C# source and gave this decision a place to live
- [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md), whose subject is the control that
  silently does nothing — the case this one is distinguished from
