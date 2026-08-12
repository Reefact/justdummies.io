# ADR-0004 | A control appears only when it can act

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-12
**Accepted:** 2026-08-12
**Decision Makers:** Reefact

## Context

Parts of the site need scripting to work: the copy button reaches the clipboard, and the install
block's tabs switch between two commands. The site is otherwise a set of static documents, and
§9.7 requires that a page render without JavaScript.

The pattern already in use is to hide such a control in the markup and let its own script unhide
it. The copy button has been built that way since the beginning.

The install tablist was built the same way and shipped visible anyway. `hidden` sets the user
agent's `display: none`, and the component's own `.tablist { display: flex }` beats it on
specificity: the attribute was set correctly and the stylesheet overruled it. What a reader without
scripting got was a row of tabs, none of which did anything, with the second install command
unreachable behind them.

Nothing in the repository would have caught it. It was found by loading the built page with
scripting refused; the markup, read on its own, looked right. `pnpm check` passed, the build
passed, and every browser that ran the script showed the correct page.

The same class of defect is available to every component the site adds: `hidden` loses to any
`display` a stylesheet sets, and the stylesheets are written per component while the failure is
only visible with scripting off.

## Decision

**A control that needs scripting is absent from the page until its script has run, and what it
enhances is a page that already works without it.**

## Rationale

Three parts follow from that sentence and all three are required, because each one alone passes
while the page is broken: the control ships `hidden`; `[hidden] { display: none !important }` is
declared once, globally, in `base.css`; and what the control enhances is present and usable in the
markup, so the tabs hide a stacked form that is already there rather than an empty box the script
would have to fill.

The global rule is the part that turns a convention into a guarantee. A `[hidden]` companion
written per component has to be remembered per component, and this one was not — that is the fact
in Context, not a hypothetical. Declared once and marked `!important`, nothing further down can
undo it, and the defect stops being possible rather than being tested for.

The third part is what makes hiding honest. Hiding a control that is the only route to some content
trades a dead button for missing content, which is worse than the defect being fixed. It costs
nothing here: the stacked form is the markup the tabs were always built from.

The same reasoning extends to the ARIA roles. `role="tab"` on a button that cannot switch anything
is a promise to a screen reader that the page cannot keep, so `tab` and `tabpanel` are attached by
the script too — a page whose scripting never arrives has no half-built widget in it to announce.

## Alternatives Considered

### A `[hidden]` companion rule in each component

Considered because it is local, needs no `!important`, and keeps each component's styling
self-contained. Rejected because the failure in Context *is* this option failing: the rule was not
written, nothing said so, and the defect reached production. A guarantee that depends on being
remembered is the thing that was not remembered.

### Render the tabs and hide the panels instead

Considered because it makes the widget complete in the markup, with no unhiding step at all.
Rejected because without scripting the tabs do not switch, so the panels they hide are unreachable:
it trades a dead control for lost content, which is the worse of the two.

### Drop the tabs and stack the commands, as the act exits do

Considered because it needs no scripting whatsoever and is what the rest of the page already does.
Rejected for this position only: the first screen has to hold the brand, a live expression, the
offer and the invitation to scroll above the fold, and the stacked form takes 254 pixels of the
roughly 800 it has. It remains the right form everywhere the screen is the reader's to spend.

### Accept it and rely on review

Considered because the repository already relies on review for several conventions. Rejected
because this one is invisible to review by construction — the markup reads correctly and the
defect only appears with scripting off, which is not a state a reviewer lands in by accident.

## Consequences

### Positive

The whole class of defect is closed for every component, present and future, rather than for the
one that exhibited it.

The no-scripting page gets better rather than merely unbroken: hiding the tablist reveals the
stacked form beneath it, so a reader without scripting reaches both commands and the link.

The build says so. Three assertions in `verify-output.sh` cover the three parts, so removing any
one of them fails the build rather than the page.

### Negative

`base.css` carries an `!important`, which is otherwise avoided. It is deliberate — the rule is a
floor, not a preference — but it is a real exception to a rule the stylesheet otherwise keeps.

A component that hides a control now owes the page a working form underneath it. That constrains
how such components are designed, not only how they are styled.

The site's scripts now do more: attaching roles at run time is more code than writing them in the
markup, and that code has to be right.

### Risks

`hidden="until-found"` cannot be used without revisiting this decision — it needs `display` to
stay, and the global rule takes it away. Nothing uses it today, and a future need for
find-in-page-revealed content would have to be weighed against reopening the hole.

The three assertions name the install tablist specifically. A second widget built to this pattern
is covered by the global rule but not by a check of its own, and adding one is on whoever adds the
widget.

## Follow-up Actions

- `scripts/verify-output.sh` asserts the three parts against the built artefact, and each
  assertion was checked by breaking it. It runs in the build.
- Any component added later that hides a control until its script runs should gain the equivalent
  markup assertion, next to the tablist's.

## References

- Specification §9.7 (the page renders without JavaScript), §7.4 (the install block's forms)
- [ADR-0003](0003-the-figure-carries-the-scene-en.md), which removed the layout's dependency on
  script for the same reason
- ARIA Authoring Practices, the tabs pattern — automatic activation, roving `tabindex`
