# ADR-0006 | The first act follows one factory, not the library's surface

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0006-le-premier-acte-suit-une-seule-factory-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-12
**Accepted:** 2026-08-12
**Decision Makers:** Reefact

## Context

Specification §9.2 lists the first act as six beats, and the last two of them are a value
becoming a domain object in one operation, and a test that works but still says too much. The
page was built that way and both scenes worked: the code compiled, the values were real, and
neither was wrong about the library.

They were removed all the same, during an editorial pass on the whole act. What the pass was
answering was a reader's report on the act as a whole, and two observations in it bear on these
two scenes.

The first is that the act is long. It was eight scenes; a reader who is not yet convinced has to
walk all of them before the page offers anything, and the exit sits at the end of them.

The second is what each of the two scenes was doing. The one-operation scene showed a link
that turns a drawn string into a domain object — a real feature, and the shortest thing on the
page. But at that point the reader has just been shown a factory that returns a domain object
already; the link is a tidier way to write something they have no reason to write yet, and the
act had to explain the feature rather than use it. It reappears in the second act, inside the
file the tool writes, where a reader meets it having written the chain by hand first. The other
scene restated the act's own conclusion: a test that works, and says too much, is what the act
opened on and what every scene since had been about.

The same pass had already established what the act *is*: one factory, `AnyOrderReference`,
followed from a hand-typed literal to a declared chain, with the snippet source holding three
states of that one class so the page shows a class evolving rather than three different classes.

## Decision

**The first act is one factory followed from a literal to a declared chain, and a scene earns its
place in it by moving that transformation forward — a scene that shows a capability the reader has
no use for yet, or that restates what an earlier scene established, is cut.**

## Rationale

The act's job is to make one claim land: a value your test does not care about still has to be
valid, and declaring what must be true is a different job from writing a value down. Everything
that serves that claim is worth its screen; everything else is competing with it, and the two
removed scenes were competing with it in the two ways available.

Showing `.As(...)` before the reader can use it costs more than the screen it takes. A page that
demonstrates a feature has to explain it, and an explanation the reader cannot act on is the
moment the act stops being a transformation and starts being a tour of the library. Deferring it
does not hide it: it arrives in the second act inside a file the tool wrote, which is both where a
reader will actually first meet it and the point at which they have already written the chain
themselves. The feature is better served by waiting.

Restating a conclusion is the cheaper mistake and the more damaging one. A reader who has followed
five scenes and is shown a sixth that tells them what they just worked out learns that this page
repeats itself, and starts skimming — which is the last thing the act before the first exit can
afford.

This is deliberately not a rule about act length. Cutting for length would have cut the shortest
scene or the one furthest down; what was cut is what did not move the transformation, and the act
that remains is five scenes because that is how many were doing something.

## Alternatives Considered

### Keep both scenes and shorten their prose

Considered because both compile, both are true, and deleting working material is the expensive
option. Rejected because neither scene's problem was its length. A shorter version of a step the
reader cannot use is still a step they cannot use, and a shorter restatement is still a
restatement.

### Keep the one-operation scene and drop `.As(...)` from the second act instead

Considered because it shows the library's shortest expression at the earliest possible moment,
which is a real argument for a landing page. Rejected because it inverts the order the reader
needs: `.As(...)` earns its place by removing work the reader has just done by hand, and shown
before that it is a feature they must take on trust. It would also weaken the second act, whose
whole point is that the file the tool writes is the reader's own chain, unchanged.

### Move both scenes into a "what else it does" section further down

Considered because it keeps the material without interrupting the transformation. Rejected
because the page has no such section and should not grow one: this is a narrative, and a
catalogue bolted to the end of it is the shape the site exists to avoid. What the library does
beyond the story belongs in documentation, which is a different job.

## Consequences

### Positive

The act is five scenes rather than eight, and every one of them changes the factory the act is
about. A reader reaches the first exit sooner, and everything they walked past on the way was
load-bearing.

`.As(...)` is now introduced exactly once, at the point where it removes work the reader has
already done. It reads as a payoff instead of a feature.

The snippet source mirrors the page: three namespaces holding three states of one class, so the
evolution the act describes is the evolution the compiler checks.

### Negative

**The specification's §9.2 lists six beats and the page carries five.** The document is staying as
it is: §17 sends a decision that deserves to outlive it to this base, and that is what this record
is. So a reader of §9.2 alone finds a sequence the page no longer follows and has to come here to
learn why — the price of the specification keeping the reasoning it recorded rather than turning
into a description of the site.

The library's shortest expression is no longer on the page before the first exit. A reader who
leaves at that exit has not seen `.As(...)` at all.

### Risks

The removed scenes are easy to re-add. Both are small, both are defensible in isolation, and the
argument for putting `.As(...)` early is a good one every time it is made. Without a check, this
decision comes undone by ordinary good intentions.

## Follow-up Actions

- `check-narrative.sh` asserts the deferral on the published snippets: `.As(` appears in the
  second act's recipe and in nothing the first act publishes. It runs in the build, and it was
  checked by breaking it.
- §9.2's first-act sequence is deliberately left as written. The specification keeps the reasoning
  it recorded; this base carries the decision that replaced part of it (§17), and the check above
  is what holds the page to it.

## References

- [ADR-0007](0007-the-third-act-answers-before-it-fails-en.md), the same pass's decision about the
  third act
- Specification §9.2 (continuity), §9.3 (each act ends with an exit)
