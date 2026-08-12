# ADR-0008 | A scene is titled by what the reader gets, not by the mechanism

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0008-une-scene-est-titree-par-ce-que-le-lecteur-y-gagne-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-12
**Decision Makers:** Reefact

Supersedes part of [ADR-0007](0007-the-third-act-answers-before-it-fails-en.md).

## Context

The narrative's scene titles were written from the inside. A reader walking down the page met
*One line lighter*, *The failure hands back its seed*, *The attribute you have already seen* and
*The tool as well* — four titles that describe, accurately, what the machinery is doing at that
point.

Read from the outside they say almost nothing. *One line lighter* names an edit to a code sample.
*The failure hands back its seed* uses a word a developer who has never met property-based
testing has no meaning for, at the exact moment the page is trying to reassure them. *The
attribute you have already seen* points at a mechanism and asks the reader to care about it before
saying why. *The tool as well* is a shopping list where the reader is being invited to leave with
something.

[ADR-0007](0007-the-third-act-answers-before-it-fails-en.md) settled the order of the third act —
that it makes its claim before it shows anything failing — and settled it, in the same sentence,
by naming the attribute the reader had already been shown. The ordering was right and is not in
question. The instrument was not: naming the attribute is still describing the machinery, one
scene earlier.

The scene titles are also the page's outline. They are what a screen reader lists, what a reader
skimming sees, and the only text guaranteed to be read.

## Decision

**A scene is titled by what the reader gets from it; the mechanism that delivers it belongs in the
scene's own words, and never in its title.**

## Rationale

A title is read by someone who has not yet decided to read the scene, which is precisely the
reader who cannot be assumed to know the vocabulary. *Catching a bug before it reaches production*
is a claim anyone can weigh; *The attribute you have already seen* asks for trust the page has not
earned yet, and *The failure hands back its seed* asks for a word the page has not defined yet.

This does not make the titles vaguer. The mechanism is still on the page, one line lower, where
there is room to say it properly — the seed gets a sentence explaining that it is a number and
what the number does, which is more than its title ever conveyed.

It also settles the half of ADR-0007 it replaces. The third act still answers before it fails
anything: what changes is that the opening scene states the benefit rather than pointing at the
attribute. The attribute is still there, in the figure, still carried by every drawing test since
the second act — the reader meets it, they are simply not asked to admire it.

The rule is narrow on purpose: it governs titles, not prose. A scene's own words are where a
mechanism is named, and the page would be worse if they stopped naming it.

## Alternatives Considered

### Leave the titles as they are and explain the vocabulary in the prose

Considered because the prose already does explain it, and because the titles are accurate. Rejected
because accuracy is not the property a title needs. A reader who skims the outline reads titles and
nothing else, and an outline of mechanisms tells them what the page is made of rather than what it
is for.

### Title every scene as a benefit, prose included

Considered as the consistent version of the same idea. Rejected because it would empty the scenes:
the prose beside a figure is where a mechanism has room to be named and explained, and a page whose
every sentence sells is a page a developer stops believing.

### Keep ADR-0007's instrument and reword only the weakest titles

Considered because it is the smaller change, and ADR-0007 is a day old. Rejected because the
weakest title *is* the one ADR-0007 prescribed, and leaving the record standing while contradicting
it in the page is how a decision base stops being worth reading.

## Consequences

### Positive

The outline reads as a set of claims: what a reader gets from the library, in the order they get
it. That is the page's own argument, which the previous outline did not carry.

The third act's opening no longer depends on a reader having noticed an attribute two acts
earlier — a dependency that was always optimistic.

`seed` is explained where it is introduced instead of appearing first in a heading.

### Negative

**It replaces half of a decision ratified the day before.** ADR-0007 is a day old and its second
clause is already superseded; a reader of the base will find two records on the same act, and the
first one's Decision sentence is only half true.

A title that sells is a title that can oversell, and this rule pushes in that direction on every
scene. Nothing here checks the claim in a title against what the scene shows.

### Risks

"What the reader gets" is a judgement, and two people will place the line differently — *The
failing test tells you how to replay it* is a benefit stated mechanically, and defensible either
way. The rule reduces the range of the argument; it does not settle it.

## Follow-up Actions

- `check-narrative.sh` asserts the one title where this decision is load-bearing: the third act's
  opening scene names what the reader gets rather than the attribute. It runs in the build and was
  checked by breaking it. The rest of the titles rest on review, and this record says so rather
  than implying a check that does not exist.
- ADR-0007 carries the link to this record next to its status, and is marked as superseded **in
  part**: its ordering — the act answers before it fails anything — stands, and the assertion that
  protects it is untouched.

## References

- [ADR-0007](0007-the-third-act-answers-before-it-fails-en.md), whose ordering stands and whose
  instrument this replaces
- Specification §9.2 (continuity), §9.3 (each act ends with an exit)
