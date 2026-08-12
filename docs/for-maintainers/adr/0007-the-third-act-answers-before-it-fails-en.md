# ADR-0007 | The third act answers before it shows a failure

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0007-le-troisieme-acte-repond-avant-dechouer-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-12
**Accepted:** 2026-08-12
**Decision Makers:** Reefact

## Context

Specification §9.2 lists the third act as three beats: the green test goes red now and then, the
failure hands back its seed, the same seed brings the same failure back. §9.4 makes a hinge
sentence compulsory at its opening and says what that hinge is joining — a test has just gone
green, and the page is about to show it going red. The act was built exactly that way.

Read in that order, the act opens by telling a reader who is still deciding whether to trust this
that their test will fail on roughly two runs in three. The reassurance — that the failure hands
back a seed, and that the seed brings back those values and not values resembling them — arrives
two scenes later.

The objection was raised as a proposal to delete the act outright: someone who does not already
understand reproducibility could take the whole section as a warning, and it needs a real
explanation before it can be shown. That is a fair reading of the act as it stood. What the act
demonstrates is worth keeping — a library that draws different values every run has to answer
"how do I get the failing one back", and answering it is a selling point, not a caveat.

Two facts about the page make a different ordering available. The values a reader is worried about
have been drawn on the page since the first act, so the question is already in their head by the
time the third act opens — it does not need to be provoked. And every published test that draws
its values carries `[Reproducible]` from the first one onward: the reader has walked past the
answer twice without being told what it was.

## Decision

**The third act's claim — that a drawn value can be got back exactly — is made before anything in
it fails, and it is made by naming an attribute the reader has already been shown rather than by
introducing one.**

## Rationale

The order in which a page answers determines what a reader does with the answer. An objection
raised and left standing for two scenes is an objection the reader spends those two scenes on;
raised and answered in the same breath, it is a feature. Nothing about the material changes here —
the same intermittent test, the same seed, the same replay — only which of them the reader meets
first.

Naming an attribute the reader has already seen is what makes the reordering cost nothing. The act
does not have to teach `[Reproducible]` before it can reassure: it can point at something on the
page and say what it was for, which is a smaller claim and a stronger one. That works only because
the attribute is in every test from the first draw, so the page is not introducing a mechanism
retroactively — it is naming one that was always there. A page that showed drawn values without it
and produced it in the third act would be describing a different library from the one it had been
demonstrating.

The failing test stays, and stays undramatised (§9.5). It is the honest half: a test that leaves a
value arbitrary will meet one it does not survive, and that is the test finding a gap rather than
the library creating one. What changes is that the reader reaches it already holding the answer,
which is the difference between "this breaks tests" and "this finds tests that were not saying
what they needed".

§9.4's hinge survives this intact, and its reasoning survives with it: the seam between the second
and third acts is still the most delicate on the page, and a reader crossing it without a sentence
joining the two still takes the third act for a second site. What the hinge says is editorial and
now carries the reader's own question; that it exists is the decision, and that is untouched.

§9.6 is untouched in every sense. The seed replays the test case that reported it, and moving the
promise earlier does not widen it.

## Alternatives Considered

### Delete the third act

Considered first, and by the maintainer. The argument is that reproducibility needs an
explanation the page does not have room for, and that a half-explanation frightens more readers
than it convinces. Rejected because the question the act answers is the first one a sceptical
reader asks about arbitrary values, and a page that does not answer it leaves them to assume the
worst. The problem was the order, and deleting the act is a heavier fix than reordering it.

### Keep the order and soften the failing scene's prose

Considered because it is the smallest possible change and touches no structure. Rejected because
the scene is not the problem: it is already undramatised, it already says nothing is broken, and
softening it further would make it evasive. A reader's worry is not addressed by a gentler
description of the thing they are worried about.

### Explain the attribute in the second act, where it first appears

Considered because it puts the explanation at the attribute's first sighting, which is the
conventional place for it. Rejected because the second act is about the arrangement disappearing,
and an explanation of seeds inside it introduces a second subject at the moment that act makes its
own point. It also spends the reassurance before the reader needs it: unexplained in the second
act, the attribute becomes something the third act can name, which is the whole of the new
opening.

### Show a passing replay instead of a failing one

Considered because it removes red from the act altogether. Rejected because it removes the
demonstration with it: a seed that replays a green test proves nothing a reader cares about. The
promise is that a *failure* comes back, and a page cannot make that promise without showing one.

## Consequences

### Positive

A reader who arrives with the ordinary worry about arbitrary values meets the answer in the title,
the summary, the hinge and the first scene — before the page shows anything failing.

`[Reproducible]` acquires a purpose. It was already in every drawing test and unexplained; the act
now spends that setup rather than letting it read as noise.

The act keeps its demonstration whole. Nothing was removed to obtain the reassurance.

### Negative

**The specification's §9.2 no longer describes the third act, and §9.4's stated purpose for the
hinge no longer matches what the hinge says.** Neither is being edited: §17 sends a decision that
deserves to outlive the document to this base, so §9.2 and §9.4 keep the reasoning they recorded
and this record carries what replaced part of it. A reader of those sections alone will not know
that, and has to come here.

The act is four scenes rather than three, on a page whose length is already a standing concern
(ADR-0005).

The second act's last figure and the third act's first are the same test. That repetition is
deliberate — it is what makes "the attribute you have already seen" true — but it is a repetition,
and the exit between them is what keeps it from reading as an error.

### Risks

The reordering is invisible to every check that reads prose, and both scenes involved are
plausible in either position. A later editorial pass could move the failure back to the front
without noticing it had reversed a decision — which is exactly how this act was built in the first
place.

## Follow-up Actions

- `check-narrative.sh` asserts the ordering on the built document — the third act opens on the
  attribute, and the scene where a test goes red comes after it — and asserts that every published
  test drawing its values carries `[Reproducible]` while the ones written before the library draws
  anything do not. Both were checked by breaking them, and they run in the build.
- §9.2's third-act sequence and §9.4's description of what the hinge joins are deliberately left
  as written. The specification keeps the reasoning it recorded; this base carries the decision
  that replaced part of it (§17), and the checks above are what hold the page to it.

## References

- [ADR-0006](0006-the-first-act-follows-one-factory-en.md), the same pass's decision about the
  first act
- [ADR-0005](0005-a-scene-arrives-rather-than-holding-the-screen-en.md), whose concern about the
  page's length this decision spends a scene against
- Specification §9.2 (continuity), §9.4 (the hinge), §9.5 (the red is not dramatised), §9.6 (what
  the third act does not promise)
