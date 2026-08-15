# ADR-0010 | The playground catalogue is generated C# source, not JSON

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0010-le-catalogue-du-playground-est-du-code-c-genere-pas-du-json-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-15
**Accepted:** 2026-08-15
**Decision Makers:** Reefact

## Context

Specification §10.4 requires the playground's builder UI to be driven by a catalogue of the
library's public surface, generated at build time from the referenced assembly's metadata — never
a hand-written registry (drift is a near-certainty, and silent), and never reflection at runtime
(IL trimming, required to keep the WebAssembly payload small, removes anything reached only
through it; the failure appears on the published artefact, not in development, where trimming is
off).

The playground itself (`apps/playground`) is a Blazor WebAssembly application with trimming
enabled and no reflection permitted in its own code (§10.8) — a rule stricter than "avoid
reflection where convenient": a trim warning is treated as a build error.

A build-time tool can only see the library's shape through reflection — that reflection is
legitimate, since the tool itself runs on the .NET SDK, never ships, and is never trimmed. What it
produces for the playground to consume at runtime is a separate question, and two shapes were
considered: data the playground reads and interprets (e.g. JSON, deserialized and dispatched by
name at runtime), or source code compiled directly into the playground.

The library's chain-eligible builder types (`AnyString`, `AnyGuid`, `AnyInt32`, …) are closed,
concrete, public classes — confirmed by inspecting the published NuGet package directly, not
assumed — each implementing `IAny<T>` for one type and each instance method returning that same
concrete type again, which is what makes a flat chain possible without generic type inference at
runtime.

## Decision

**The catalogue is generated as C# source — two files compiled into `packages/playground-catalogue`
— rather than a data file (JSON or otherwise) interpreted at runtime.**

## Rationale

Trimming decides this before anything else does. A JSON catalogue read and dispatched at runtime
means resolving a member by name and invoking it — reflection, by definition, and exactly what
§10.8 forbids. Generated C# source, by contrast, contains ordinary, statically typed call sites
(`typed.StartingWith(prefix)`, not `method.Invoke(typed, args)`); the trimmer sees a normal method
call and keeps it, the same way it keeps any other call in the application. No annotation, no
trimmer-preservation attribute, and no runtime reflection API is needed anywhere in
`apps/playground`.

This also settles the two things §10.4 asks a catalogue to guarantee. No drift: the two generated
files come from one reflection pass over the pinned package version, so the descriptive data (used
to build the UI) and the dispatch table (used to run a chosen chain) can never disagree with each
other or with the assembly — the generator's own self-check compares their key sets before writing
either file. A library breaking change becomes a **site compile error**: renaming or removing a
method breaks the generated call site, which is a compiler diagnostic on the next build, not a
runtime surprise discovered by a visitor.

Confirming the library's builder types are closed, concrete, and public (not merely accessible
through an interface) is what makes the generated dispatch table's cast targets (`(AnyString)
receiver!`) legal from outside the library's own assembly — the design depends on this being true,
and it was checked against the real package rather than assumed from documentation.

## Alternatives Considered

### A hand-written registry mapping method names to delegates

Considered because it is the simplest thing that could work, and needs no build-time tool at all.

Rejected outright by §10.4 itself: nothing guarantees a generator added to the library is ever
added to this registry, and the drift is silent — the constraint simply "does not exist" in the
playground, with no error anywhere. This is a certainty a few library versions out, not a risk.

### JSON descriptors, dispatched via runtime reflection

Considered because it decouples the generator's output format from the consuming application's
language and keeps the generator simpler (no C# code-emission logic, only serialization).

Rejected because it reintroduces runtime reflection exactly where §10.8 forbids it. The trimmer
cannot see a `MethodInfo` resolved from a JSON-carried string at runtime, so it removes the method
being resolved — a defect invisible in development (trimming is off there) and only visible on the
published artefact, which is precisely the failure mode §10.4 already rejected for a hand-written
registry, arrived at by a different road.

### JSON descriptors for the UI, paired with a hand-written C# `switch` for dispatch

Considered as a middle ground: the UI-facing data stays simple JSON, and a small hand-written
dispatch layer avoids runtime reflection.

Rejected because the hand-written `switch` is exactly the hand-written registry already rejected
above, just positioned downstream of the reflection pass instead of upstream of it. It would need
updating by hand every time the library's surface changes, with the same silent-drift failure mode.

## Consequences

### Positive

* No runtime reflection anywhere in `apps/playground`'s own code; the trimmer's job is unchanged
  from any other Blazor WebAssembly application.
* The two generated files cannot drift from each other — enforced by the generator's own
  self-check, not by convention.
* A library breaking change is caught at the site's next build, not discovered by a visitor on the
  published artefact.

### Negative

* The generated dispatch file is large (one lambda per catalogued member — 279 entries for the v1
  scalar surface) and is committed, so a library update produces a correspondingly large, if
  mechanical, diff.
* Adding a new *kind* of catalogue entry (a composite generator, in a future iteration) means
  extending the generator's emission logic, not just its exclusion list — more than a JSON schema
  change would have cost.

### Risks

* The generator itself reflects over the library and is therefore the one place a subtle
  assumption about the library's shape (e.g. a builder type's public/concrete status) could go
  unnoticed until the assembly changes in a way that breaks it. Mitigated by the generator's own
  structural classification failing loudly (an unrecognised member category stops the build)
  rather than silently emitting something wrong.

## Follow-up Actions

* `tools/playground-catalogue` generates a companion report
  (`packages/playground-catalogue/Generated/PlaygroundCatalogue.Excluded.g.md`) listing every
  excluded member and its reason, auto-detected or manual — this is what makes §10.6's "mandatory
  reason" auditable without requiring a human to hand-list every exclusion.
* Composite/generic generators (`Enum<T>`, `OneOf`, `ListOf`, `Combine`, …) are deliberately out of
  the v1 scalar catalogue; extending the generator to represent nested-generator arguments is
  tracked as a later iteration, not implied by this decision.

## References

* Specification §10.4–§10.8
* `docs/design/decisions-inventory.md`, entry A5 — resolved by this ADR
* [ADR-0011](0011-the-playground-references-the-catalogue-as-a-project-reference-en.md) — the
  companion decision about how `apps/playground` consumes this generated project
