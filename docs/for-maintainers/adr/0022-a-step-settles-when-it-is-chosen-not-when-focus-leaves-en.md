# ADR-0022 | A step settles when it is chosen, not when it loses focus

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0022-une-etape-se-fige-quand-elle-est-choisie-pas-quand-le-focus-part-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-20
**Accepted:** 2026-08-20
**Decision Makers:** Reefact

## Context

[ADR-0014](0014-the-playground-builds-inside-the-card-it-reads-en.md) decided that the playground
builds its chain inside the code card it gives to read, each chosen step drawn as C# rather than as
a form control: a step is a combo until a method is chosen, and code after that. Its *Risks*
section attached one condition to that drawing — the `<select>` of a step being chosen has to
survive as long as it has focus, or a keyboard user cannot arrow past its first option — and its
*Follow-up Actions* put a full keyboard pass through a step in the browser suite to hold it.

The condition follows from a fact about the platform. A closed native `<select>` raises its change
event on every arrow press, so a keyboard user walking the list commits each entry in turn on the
way to the one they want. Confirmed in the browser the suite runs rather than assumed: the first
press gives the step a method while the control is still standing, and the second reaches the
second entry. Type-ahead — a bare printable character, which a native select uses to jump to the
first entry beginning with it — raises the same event, and so belongs to the same run.

Enter is that same list walked to its end, and the platform gives the page almost nothing to act
on. Because the value has already moved on every arrow press, the key that means *this one* raises
no change event — there is nothing left for it to change — and Chromium delivers no key-up for it
on this control either. The key-down is the whole of it. Measured in the same browser and on the
same card as the facts above, not assumed.

Focus is a different fact. A visitor who commits from the drop-down leaves focus on the control:
the browser has no reason to move it, and nothing else on the card asks for it. Under the focus
condition, that visitor went on looking at a combo until some later and unrelated click happened
to blur it. Nothing on the card asked for that click and nothing said what it was for. This is the
defect reported against the deployed playground, and it is the ordinary case: the pointer is how
most visitors reach this control.

The two populations are not symmetric in size, and the repository has already taken a position on
that asymmetry. Specification §13.4 requires full keyboard navigation in every locale, to WCAG 2.2
AA, and the keyboard pass ADR-0014 added is a standing check rather than a hypothesis. §5.7 refuses
anything reachable only by a gesture the page never announced. §10.2 is what the card is for: the
visitor builds a chain, step after step.

The platform separates the two gestures even though the change event does not. A keystroke is
delivered before the change it provokes, and a pointer press before the change it provokes; a
change event with neither in front of it did not come from a visitor at all.

Settling a step removes the control the visitor is standing on. Where nothing catches the focus it
drops, the browser returns it to the document body and the next forward Tab restarts at the top of
the page. `Home.razor` already carries a mechanism against exactly that, written for the deletion
path, which removes controls the same way.

## Decision

A chosen step settles into code at the moment the choice is made rather than at the moment its
`<select>` loses focus, the combo surviving only while the visitor is still walking the option
list.

## Rationale

**The focus condition was a proxy, and the wrong one.** What a keyboard user needs protected is the
browsing — the run of unmeant commits between opening the list and settling on an entry. Focus
outlives that run for a pointer user, who has stopped browsing the moment the drop-down closes, so
the condition charged the keyboard's problem to everybody else. Replacing the proxy with the thing
it stood for costs the keyboard nothing: the browsing run is exactly as long as it was, and the
list is arrowed past its first entry exactly as before.

**The gestures are separable from facts already stated.** What precedes a change event says which
gesture produced it, so the step no longer has to infer an answer from a state that means two
things at once. This is the argument that makes the decision available at all; without it, the only
choice would have been between the keyboard's defect and the pointer's.

**A step that stays a control after being chosen contradicts ADR-0014 while appearing to honour
it.** That record's decision is that a chosen step is code, and the card is drawn as though it
were. A visitor cannot learn the missing gesture, because the card never mentions it — which is
what §5.7 refuses. The defect is not that the settling is late; it is that the rule governing it is
unstateable to the person it governs.

**The focus that settling takes has to go somewhere, and where is not a free choice.** Letting it
fall to the document body is the renavigate-from-the-top the deletion path already exists to
prevent, and it is §13.4's full keyboard navigation that prevention serves. The first argument,
when the step has one, is where the visitor was about to type; the step the choice opens, when it
has none, is the only control that did not exist a moment before. Both are the next thing under
§10.2, and neither moves a focus that had anywhere to stay.

## Alternatives Considered

### Settle on every change the `<select>` raises

The whole fix in one line, and what a reader naturally expects the control to mean: an event named
*change* reports a change.

Rejected because on the platforms where a closed control commits per arrow press, the step would
settle on the first of them and the list could never be arrowed past its first entry. The reachable
part of the catalogue would be whichever methods happen to sort first, and only for a visitor with
a pointer. That is precisely the failure §13.4 and ADR-0014's keyboard pass exist to prevent.

### Keep the focus condition and explain the extra click

It changes no behaviour and no code, and what it costs the visitor is a delay rather than a lost
capability — the cheapest possible answer if the defect is merely cosmetic.

Rejected because the explanation would have to say that a chosen step becomes code once something
unrelated is clicked, which is not a rule a visitor can hold or a page can usefully print. It also
leaves ADR-0014's own decision untrue for as long as the visitor does nothing else, which is the
part that makes this more than cosmetic.

### Replace the native `<select>` with a custom widget that separates browsing from committing

The ambiguity belongs to the native control; a widget built for the job would raise one event for
browsing and another for choosing, and the question would not arise.

Rejected because it trades one defect for a category of them. The repository's stated position on
this class of control — §11.7, written for the comparison page's own selector — is a native form
control rather than a bespoke component with approximate keyboard support, and the platform is what
gives this combo its keyboard behaviour, its screen-reader semantics and its presentation on a
phone at no cost. Nothing here needs the widget: the gestures are separable without one.

### Return the focus to the settled step rather than to the next combo

The least surprising destination — the visitor stays on the thing that just changed — and it keeps
the settled step's own delete and documentation controls in front of a forward Tab rather than
behind it.

Rejected because the card exists to build a chain (§10.2), and every parameterless step would then
cost two extra keystrokes to get past its own controls before reaching the next one. Nothing
becomes unreachable by handing the focus forward instead: the skipped controls keep their place in
the document's tab order, a step backwards reaches them, and a pass through the page from the top
meets every one. The cost is paid once, by a visitor who wants to revisit a step; the alternative
charges it to every step of every chain.

## Consequences

### Positive

* A chosen step is code from the moment it is chosen — what ADR-0014 decided, and what the card has
  always looked like it was claiming.
* The focus lands where the visitor is going next, so a chain can be built without the pointer
  having to return to the card between steps.
* The keyboard's protection is now stated as the thing it is. A reader of the code finds *the combo
  survives while the list is being walked* rather than a focus rule whose purpose has to be
  reconstructed from a risk bullet in another document.

### Negative

* The drawing now depends on the order in which the platform delivers a keystroke and the change it
  provokes. That order is stable and specified, but it is one more thing to rest on than a focus
  flag was.
* A forward Tab out of a settled parameterless step no longer meets that step's own delete and
  documentation controls. They are reached by stepping backwards, or by a pass through the page.
  This is the trade recorded in the last alternative above, accepted deliberately.

### Risks

* A platform on which the closed control commits per arrow press *without* delivering the keystroke
  first would settle on a browse. None is known. The browser suite is where it would surface, since
  the check that holds this walks the list with real key presses rather than by setting the
  control's value — a distinction that matters, because setting the value is exactly what would
  hide it.
* Classifying a keystroke as browsing is a judgement about a native behaviour rather than a reading
  of a specification. A key that walks a list on some platform and is not classified here would
  settle a step the visitor was still browsing. What that costs is the old defect for that one key,
  not a lost capability.
* Enter has to be answered from its key-down, since that is all the platform sends for it on a
  closed control. Where an open drop-down does raise a change on Enter, the step will settle on the
  option it was already holding and then again on the one actually committed. The end state is the
  method the visitor chose either way; what it costs is a render nobody asked for, and only for a
  visitor who walked the closed list before opening it.
* **One gesture still settles nothing, and it is left alone deliberately.** A visitor who walks the
  closed list to an option, then opens the drop-down with the pointer and clicks that same option
  to confirm it, produces no change event — the value did not move — and does not blur the control
  either, so the combo stands until they do something else. This is not new: the same sequence
  behaved the same way under the focus rule. What is new is that the decision above now promises
  otherwise for a pointer, and this is the one case where it does not deliver.

  It is left alone because no fix for it can be held by a check. The browser suite drives a
  headless engine, which never opens a native drop-down, so nothing that happens inside one can be
  asserted — and a click on an option of an open drop-down is precisely what would have to be
  observed. A repository that requires a decision to come with something that fails when it is
  broken cannot take a fix whose only evidence would be that it looked right. The visitor is not
  stuck: the choice is already committed, the card already shows the method's summary and its
  delete control, and Enter, Tab or any click elsewhere settles the step. Recorded here so the next
  person meets it as a known cost rather than as a discovery.

## Follow-up Actions

* `tests/browser/playground.spec.ts` is what fails when this decision is broken, and it fails from
  both sides. One check walks the option list with real key presses and asserts that the step gains
  a method while the combo stands, that the second press reaches a different entry, and that
  type-ahead behaves as the arrows do; another tabs out of a combo that is still standing into the
  step's first argument. A third walks the list and then presses Enter, which is the gesture the
  platform reports least about and therefore the one most easily lost. Two more hold the other
  half: a parameterized step settles on the choice and holds the focus on its first argument, a
  parameterless one settles and holds it on the combo it opens — neither with anything else
  clicked, so a return to settling on blur fails on the line after the choice.
* Watched failing before it was trusted. With the browsing classification stubbed out so that every
  keystroke reads as a choice, both keyboard checks go red and nothing else in the suite moves;
  restored, the suite is green.
* ADR-0014 keeps its decision and loses one bullet of its *Risks* section. Its status carries the
  partial supersession, and a block under its header names which half went and which stands.
* No check can see whether the focus lands somewhere a visitor finds *sensible*, as opposed to
  somewhere real and reachable. That one is left to review, and named here rather than left as an
  empty section.

## References

* [ADR-0014](0014-the-playground-builds-inside-the-card-it-reads-en.md) — the record this one
  supersedes in part.
* Specification §5.7, §10.2, §11.7, §13.4.
* `apps/playground/Components/ChainLink.razor` and `apps/playground/Pages/Home.razor` — where the
  mechanism lives, and where it is documented.
* Pull request [#138](https://github.com/Reefact/justdummies.io/pull/138).
