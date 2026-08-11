# ADR-0003 | The figure carries the scene

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0003-la-figure-porte-la-scene-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-12
**Decision Makers:** Reefact

## Context

The specification describes the narrative as a scrollytelling sequence with sticky panels and the
same code transforming as the reader scrolls (§9.1). Two layouts were built against that
description within an hour of each other, and the second replaced the first.

The first put each scene's prose in a left column and its figure in a right one, then lifted the
figures of an act into a single sticky panel driven by whichever scene crossed the middle of the
viewport. It worked as designed and produced two defects on the deployed page:

- a code block in half the measure needs a horizontal scrollbar. Several published figures are
  wider than half the page: the longest snippet is 78 characters, and the two recorded terminals
  are 128 and 130;
- and a figure beside its prose has to be paired up by eye. A scene short enough to share the
  screen with three others gets that pairing wrong — a reported screenshot shows the heading
  *"Déclarez les contraintes"* next to the `new Order(...)` belonging to the scene three below it.
  The panel was showing the scene crossing the middle of the viewport, which was not the scene the
  reader was looking at.

The second defect is the one that matters. It is not a tuning problem: any layout that puts a
figure beside prose, in a page where several scenes fit on one screen, leaves the reader to guess
which figure belongs to which words.

## Decision

**A scene is a figure at full width, under its own heading, with the commentary beneath it. A
scene holds the screen.**

No sticky panel, no second column, no script in the layout at all.

## Rationale

Under its own heading there is nothing left to pair. The association between a figure and the
words about it stops being something the reader infers from position and becomes something the
document states.

The full measure removes the scrollbar rather than managing it: every published figure fits
across the page, and none of them fits across half of it.

What the sticky panel was for survives, and more cheaply. A scene that holds the screen puts its
figure in roughly the same place from one scene to the next — measured between 261 px and 384 px
across the six scenes of the first act — so scrolling reads as the same code changing rather than
as a new block arriving. That is §9.1's continuous transformation, obtained from the layout
instead of from a script.

And it collapses §9.7's four builds into one. The panel needed script, a viewport width and a
motion preference, and it moved figures out of the document position their prose belongs to. This
needs none of those: desktop, mobile, reduced motion and no-JavaScript render the same document,
and the only thing script still adds is the marker saying which scene the reader is on.

## Alternatives Considered

### Keep the panel and widen its column

Considered because it is the smallest change and preserves the specification's sticky-panel
reading. Rejected because it addresses only the scrollbar: the pairing defect survives untouched,
and it is the worse of the two.

### Keep the panel and make every scene taller, so only one is ever on screen

Considered because it fixes the pairing while keeping the mechanism. Rejected because it fixes the
pairing by making the panel redundant — if one scene fills the viewport, its figure has nowhere
else to be — so what remains is script, a viewport width and a motion preference, paying for
nothing.

### Keep the two-column layout and narrow the terminals

Considered because it would let the figures fit the half-measure and leave the layout as designed.
Rejected because the recap's width is not decoration: the two words that make that scene worth
showing — `unread guards` — sit at the end of its longest line. Narrowing it hides the point of the
scene.

## Consequences

### Positive

The association between a figure and the words about it is stated by the document instead of
inferred from position, so it cannot be got wrong by a scene that is short or a viewport that is
tall.

Every published figure fits across the page, so no scene needs a horizontal scrollbar.

Four builds collapse into one: desktop, mobile, reduced motion and no-JavaScript render the same
document, and the only thing script still adds is the marker saying which scene the reader is on.

### Negative

The page is much longer. That is intended — scrolling advances the story rather than sliding a
document past — but it is a real cost for a reader who wanted to skim.

The `wide` scene variant is removed. It existed so two figures could span the full measure while
the rest sat in a column, and there is no column left for it to be an exception to.

The commentary needs a reading measure of its own rather than inheriting the figure's width, so
the two now carry different widths inside one scene.

### Risks

A figure wider than the measure would bring the scrollbar back, silently, in one scene. The guard
is the width assertion in `check-narrative.sh`; the margin today is zero, the widest published
figure being exactly the 130 characters the measure holds.

Scroll snapping is **not** adopted, and adopting it later would be a new decision rather than a
tweak: it applies to the root scroller, which would make the hero snap too.

## Follow-up Actions

- `scripts/check-narrative.sh` asserts the two properties this decision rests on: no published
  figure exceeds the width the measure holds, and every figure sits under its own heading. It runs
  in the build.

## References

- Specification §9.1 (narrative technology), §9.7 (what a scene costs), §5.3 (movement must
  explain)
- The layout this supersedes, and the reasoning it was built on, are in the pull request that
  introduced it
