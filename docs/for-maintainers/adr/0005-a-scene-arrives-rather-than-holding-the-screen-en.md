# ADR-0005 | A scene arrives rather than holding the screen

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0005-une-scene-arrive-au-lieu-doccuper-lecran-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-12
**Accepted:** 2026-08-12

Supersedes part of [ADR-0003](0003-the-figure-carries-the-scene-en.md).

**Decision Makers:** Reefact

## Context

[ADR-0003](0003-the-figure-carries-the-scene-en.md) settled two things at once. A scene is a
figure at full width, under its own heading, with the commentary beneath it — and a scene holds
the screen, `min-height: 100vh`.

The first half fixed two reported defects and is not in question here. The second half was the
answer to a different problem: with the sticky panel gone, nothing was left to make scrolling feel
like advancing through a story rather than sliding a document past. A scene the height of the
viewport put the figure in roughly the same place from one scene to the next, which reads as the
same code changing. ADR-0003 records this as obtained "from the layout instead of from a script",
and lists the page being much longer under Consequences as intended.

Three days of use say the trade was wrong. The emptiness was reported before the effect was
noticed: roughly a screen of nothing between every pair of code blocks, eighteen scenes deep, and
the report was that the acts "go to pieces — there is no effect any more". A reader scrolling
through a viewport of blank ground does not read it as a beat; they read it as the page having
ended.

The comparison offered was Apple's product pages, where a section that is not on screen yet
arrives — it fades and rises into place as it crosses into view. That effect does the job the
height was bought for, and it does it in the space the content already occupies.

The page also has three acts that the reader is meant to feel passing between, and nothing marked
those seams but a hairline rule.

## Decision

**A scene occupies the height its content needs and reveals itself as it enters the viewport; the
ground changes at the seam between acts and nowhere else.**

## Rationale

The height and the reveal were bought for the same thing, and only one of them is paid for in
space. Removing `min-height: 100vh` takes the first act from 6.8 screens to 4.2 and the whole page
from 17.1 to 11, measured at 1400×900; the reveal adds nothing to the page's length at all.
Where ADR-0003 traded emptiness for a sense of movement, this trades nothing for it.

The reveal is also the more honest signal. A scene of fixed height says "a beat is a screen",
which is a claim about the layout; a scene that arrives says "here is the next thing", which is a
claim about the reading. That the scenes are now of different heights is correct — they hold
different amounts.

The ground changing per act rather than per scene follows from what an act is. Scenes inside an
act are one continuous argument — six views of one transformation — and giving each its own panel
would cut that argument into cards. An act is where the argument changes, and it is the one seam
worth marking. Three points of luminosity is enough to register while scrolling past and not
enough to look at, which is the register this page uses everywhere else.

Enlarging the scene titles belongs to the same decision rather than to taste: at the size they
had, a heading read as a caption for the block below it, and a scene's heading is the claim its
figure is evidence for. The act titles move up a step with them, because otherwise an act would
open on a heading no larger than the six beats inside it.

## Alternatives Considered

### Keep the full-height scenes and add the reveal to them

Considered because it is purely additive and contradicts no existing record. Rejected because the
emptiness is the reported defect, and this keeps every pixel of it. The reveal would fire against
a screen of blank ground, which makes the wait longer, not shorter.

### Shorten the scenes without adding the reveal

Considered because it needs no script at all, which is what ADR-0003 valued most. Rejected
because it removes the sense of advancing without replacing it: scenes would follow one another
down the page as an ordinary document, which is exactly what the narrative is not meant to be.
The height was doing something, and taking it away for nothing gives back the problem ADR-0003
was solving.

### Scroll snapping instead of the reveal

Considered because it is the other way to make scrolling feel like moving between beats, and
ADR-0003 named it as deliberately not adopted. Rejected on the same grounds it was then: snapping
applies to the root scroller, so the hero would snap too, and it takes the scroll away from the
reader — a page that decides where the scroll stops fights anyone skimming.

### A ground per scene rather than per act

Considered because it marks every beat and is the strongest version of the effect. Rejected
because it cuts one continuous argument into eighteen cards. The scenes of an act are six views
of one transformation, and a panel around each says they are six separate things.

## Consequences

### Positive

The page loses a third of its height — 15 373 pixels to 9 918 — without losing a scene, a figure
or a sentence. The acts lose between a third and two-fifths each.

Every seam the reader is meant to feel is now marked by something they can see: the reveal at each
beat, the ground at each act.

The scene titles carry the weight of the claims they are, rather than reading as captions.

### Negative

**Script is back in the layout, and ADR-0003 counted removing it as a benefit.** That is a real
reversal and it is the cost of this decision. What limits it is that the script only ever *adds*:
the page without it is complete, laid out, and readable — it is missing an animation, not
content. The arming attribute is set by an inline script in the head precisely so that a page
whose scripting never arrives never enters the hidden state at all.

Four renderings of a scene become four again — desktop, mobile, reduced motion, no scripting —
and two of them now differ from the other two in whether the reveal happens. ADR-0003 had reduced
this to one.

A new shared token, `--jd-surface-sunken`, enters a palette both applications consume, for
something only the site uses today.

### Risks

**Getting the reveal's default wrong turns the page blank.** If the `opacity: 0` is ever moved off
`[data-reveal-armed]` — the obvious simplification, and it looks correct in every browser that
runs the script — a reader without scripting gets an empty document rather than an unanimated
one. This is the single way this change can fail silently, and it fails for exactly the readers
least able to report it.

The reveal has a second silent failure: a group that never enters the observer's shrunken root
stays at zero opacity for good. One existed in the first implementation — two groups sat in the
last 15% of the document, where the page runs out of scroll before they qualify — and it was
found by scrolling the built page to the end, not by reading the code. The bottom-of-document
backstop exists for that and has to survive any later tuning of the margin.

## Follow-up Actions

- `verify-output.sh` asserts both halves of the blank-page risk against the built artefact: every
  rule that hides a reveal group is gated behind the arming attribute, and no shipped page carries
  that attribute in its markup. Both were checked by breaking them. They run in the build.
- ADR-0003 carries the link to this record next to its status, and is marked as superseded **in
  part**: its full-width figure under its own heading is untouched and remains the standing
  decision.

## References

- [ADR-0003](0003-the-figure-carries-the-scene-en.md), whose first half stands unchanged
- [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md), whose rule the arming attribute
  applies — the page works, then the script improves it
- Specification §9.1 (narrative technology), §9.7 (what a scene costs), §5.3 (movement must
  explain)
