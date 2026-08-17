# ADR-0014 | The playground builds inside the card it reads

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0014-le-playground-construit-dans-le-bloc-quil-donne-a-lire-fr.md)

**Status:** Proposed
**Proposed:** 2026-08-17
**Decision Makers:** Reefact

## Context

The landing page opens on a code card (specification §9.8): a bordered block holding one real
expression, a bar under it holding the value that expression really produced, and a row under that
offering to run the library here and now. Pressing that offer replaces the static block with a live
one — the same card, drawn by the playground application at its `/hero` route, with the expression's
arguments turned into editable fields. It is the first thing a visitor sees and the shape they
carry to whatever they open next.

The playground is what they open next. Until this record it presented the same product's central
idea in an unrelated shape: a stacked column of bordered `<select>` controls, one per step, each
with its documentation as a paragraph of prose underneath, and — below the column — a separate strip
printing the chain the controls added up to as a single line of C#, with a copy button at its right.
The chain was therefore on screen twice, once as controls and once as text; the controls were what
the visitor worked in, the text was the only form that compiled, and neither was the card the
landing page had just shown.

The two surfaces were also drawn from unrelated rules. The site sets prose narrow and lets a figure
take the whole shell — its own landing page caps its subtitle well short of the measure and lets the
expression below it run the full width — while the playground put every element it had, figure
included, in the narrower column its prose sits in. Nothing in either application referred to the
other, and no check compared them.

The specification constrains what may be done about this:

* **§10.2** — the visitor must be able to choose an expression, generate a value, modify a
  constraint, regenerate immediately, copy the complete code, and understand an error without
  knowing anything about the parser;
* **§11.5** — a control is a native one, never a custom widget;
* **§5.7** — there is no hover on a phone, so nothing may be reachable by pointing at it alone;
* **§9.9** — a refusal the library raises is never neutralised;
* **§13.4** — WCAG 2.2 AA in every locale: error messages associated with the zone that provokes
  them, nothing conveyed by colour alone, complete keyboard navigation.

Two facts about the builder as it stood bear on what a change may cost. Choosing a different method
for a step already discarded every step after it, because a chain is typed and what follows a step
may not exist once that step changes — so "change this step" was never a local edit. And a closed
native `<select>` raises its change event on every arrow press, so a keyboard user browsing its
options commits each one in turn.

## Decision

The playground builds its chain inside the same code card the landing page opens with, drawing each
step that has been chosen as C# rather than as a form control.

## Rationale

A visitor reaches the playground from a card. Meeting an unrelated shape there costs the product the
one thing §9.8's card was built to buy — the sense that the landing page and the application behind
it are one thing — and it costs it at the exact moment the visitor has decided to look further. The
card is what the two surfaces have to share, and sharing it is what this decision is.

Once the builder is a card, the strip below it stops being a second rendering of the same thing and
becomes a zone of the card with a job of its own. The block holds the chain the way it is built —
arguments in fields, summaries in comments, wrapped over as many lines as that takes. The bar under
it holds the same chain as the one line that compiles, with no comments and every argument
re-emitted as a real C# literal. Those are two different strings on purpose, and the visitor needs
both: one to work in, one to take away.

That division decides where the copy control goes, and the answer is not the corner of the block. A
control whose whole promise is *you get exactly what you see* must be attached to the thing that
shows it; on the block it was attached to the one thing showing something else. On the bar the
promise is literal, and it is made literal by construction rather than by care — the bar and the
clipboard are drawn from one list of runs, so they cannot say different things.

Drawing a chosen step as code rather than as a control is what makes the block readable, and it is
affordable because of a fact already true: choosing a different method discarded the rest of the
chain anyway. What the visitor loses is one gesture — a step is now removed and re-chosen rather
than re-picked — and not a capability, because the state they arrive at is the state they always
arrived at. The `<select>` remains, native, on the one step that is still being chosen, which is
where §11.5's rule actually bites: that is the only place something is still being asked.

The documentation becomes a comment for the same reason the rest became code. A summary lifted from
the library's own XML documentation is the library documenting itself, and a comment is where a
reader of C# already looks for that — while costing the card nothing, since a comment is exactly
what the eye skips when it wants the code. It stays in the flow rather than behind a hover, which
§5.7 requires of it.

Errors are the one place where a single treatment would have been wrong, because the builder carries
two failures that are not the same kind of thing. An argument the site itself could not parse is the
site's own text about a value being typed at that moment: it fires on a keystroke, it is a rail
rather than a result, and folding it behind a marker on the step keeps the block legible while it is
being filled in. A refusal the library raised is the opposite — §9.9 calls it the demonstration
defending itself — and a message nobody sees until they press the control that reveals it is
neutralised in every way that matters. So the refusal is printed under the card, in the bar where a
drawn value would otherwise be, exactly as the landing page's own widget prints the one it gets, and
the marker on the step says only which step. §13.4 is served either way: the step that caused a
failure carries a visible mark, that mark is a glyph and not merely a colour, and the message is
attached to the offending field whether or not anything has been pressed.

Finally, the two cards share one declaration rather than two matching ones. Two copies of a card is
how the two surfaces came to disagree in the first place: nothing in either file mentioned the
other, so nothing noticed. Declared once, everything inside the card is equal by construction, and
the only claim left to check is the one a shared declaration cannot make — how wide the card ends up
on the page it is on, which two different documents in two different runtimes decide separately.

## Alternatives Considered

### Restyle the printed strip, leave the builder a form

The smallest change available, and the only one that alters no interaction at all: the strip below
the builder could have been given the card's border, ground and result bar and left there.

Rejected because it dresses the wrong half. The strip would take the landing page's card while the
column above it — the surface the visitor actually works in — would stay a stack of form controls,
so the shape they recognise would be the one they cannot touch and the shape they use would be the
one that matches nothing. Two renderings of a chain are not the problem, and the decision taken here
keeps two of them on purpose; which of the two is the card is the problem.

### Keep an editable combo on every chosen step, styled as code

Considered because it preserves the one thing this decision gives up: changing a step's method in a
single gesture, without removing it first.

Rejected on two counts. A control that reads as code and behaves as a form is worse than either —
the visitor cannot tell which of the things in the block they may click, which is the confusion the
card is meant to end. And the gesture it preserves was never the cheap one it looked like: it
already discarded every step after the one being changed, so the single gesture bought a visitor no
more than the two do.

### Fold every error, including the library's refusal, behind the marker

Considered because it is the tidier card: the block stays code and prose only appears on request,
and it treats the two failures uniformly rather than asking the reader to learn a distinction.

Rejected because §9.9 forbids exactly this. The refusal is the strongest argument the product makes
— the library declining a contradictory declaration, in its own words, at the moment it is declared
— and a page that hides it to stay tidy has removed its own best evidence. The distinction the
reader has to learn is real: one of the two messages is this site talking about a keystroke, and the
other is the library talking about the code.

### Copy the hero's card rules into a playground-specific block

Considered because it changes nothing about the landing page, and a change that cannot reach the
first screen is a change that cannot break it.

Rejected because it reproduces the cause rather than the effect. The two surfaces disagreed because
each declared its own shapes and neither referred to the other; a second copy would put the two
cards one edit apart from disagreeing again, and the edit would be invisible until somebody looked
at both pages side by side.

## Consequences

### Positive

* The chain is on screen in the shape the visitor already met on the landing page, and the line
  they can paste is printed under it rather than assembled out of sight.
* Everything inside the two cards is equal because it is declared once, not because two files
  currently agree.
* The documentation sits where a reader of C# looks for it, without a hover and without competing
  with the code for the reader's attention.
* The copy control is on the thing it copies, and the two cannot drift apart.

### Negative

* Changing a chosen step's method takes two gestures rather than one.
* The block is taller than the bare chain: every chosen step carries its summary as a trailing
  comment, which runs on from the step where it fits and takes a line of its own where it does not.
* The card has three zones where the landing page's has two. They stay the same card — everything
  the two share is declared once — but the playground's is the taller of them by a bar.
* The chain is on screen in two forms, the block's and the bar's, and they differ character for
  character. Several argument types have no bare literal in C#, so the block shows the typed value
  between quotes while the line that compiles carries a parse call several times longer. This is
  the cost of the block being editable and the bar being copyable at once; what makes it bearable
  is that both are visible, side by side, rather than one being a hidden reinterpretation of the
  other.

### Risks

* The `<select>` on a step being chosen has to survive as long as it has focus, or a keyboard user
  cannot arrow past its first option — the control commits on every arrow press, and one that
  vanished on the first commit would make most of the catalogue unreachable without a pointer. The
  browser suite drives a full keyboard pass through a step to hold this.
* A long chain is a long column of comments. Nothing caps it today; if it becomes the complaint, the
  answer is a rule about which summaries are shown, not a return to hover.

## Follow-up Actions

* `tests/browser/code-card-parity.spec.ts` is what fails when this decision is broken from the
  layout side: it loads both documents at one viewport and compares the card's width, the distance
  from the card to the button under it, the button's own box, and the ground both cards are drawn
  on. Verified by returning the playground's card to the prose column it used to sit in and watching
  the width comparison go red before putting it back.
* `tests/browser/playground.spec.ts` is what fails when it is broken from the behaviour side: a
  chosen step that kept its combo, a summary that stopped being a comment, a refusal that stopped
  being printed under the card, or a marker that stopped opening and closing its message each fail a
  check of their own.
* Neither check can see a comment column that has grown unreadable. That one is left to review.

## References

* `docs/design/specification.md` §5.7, §9.8, §9.9, §10.2, §11.5, §13.4
* [ADR-0003](0003-the-figure-carries-the-scene-en.md) — the site's rule that a figure takes the
  measure rather than the prose column, which the playground's card now follows too
* [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) — the same reasoning applied to the
  copy control, which is offered only while there is a chain that compiles
* [ADR-0009](0009-the-browser-checks-are-driven-by-playwright-en.md) — why the checks named above
  run in a browser against the published artefact
