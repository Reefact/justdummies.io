# Architecture Decision Records

Dated records of significant decisions — their context, the option chosen, and the consequences. An
ADR is a historical log: once accepted it is not edited in place; a decision is revisited by writing
a **new** ADR that supersedes the old one, and the old one's status changes to *Superseded* with a
link to its successor.

**This format is the library's, adopted deliberately** — it is the ADR base of
[`Reefact/first-class-errors`](https://github.com/Reefact/first-class-errors/tree/main/doc/handwritten/for-maintainers/adr),
reproduced here so a maintainer moving between the two repositories reads the same shape twice. The
same reasoning as the commit convention in [`CONTRIBUTING.md`](../../../CONTRIBUTING.md). Where the
library's base carries a rule this one does not, the library's is the one to follow; the local
differences are named at the bottom of this file.

## When is an ADR written?

The test for "significant" is the one
[`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md) already applies:

> If the implementation changed but the decision stood, would the record need rewriting? If not, it
> is an ADR.

What fails that test stays in the specification: design rules, editorial principles, fallback plans.

A new decision is **recorded** here. A decision that replaces another is written as a
**superseding** ADR. A change that **conflicts** with an accepted ADR is raised for the maintainer
rather than merged quietly.

For an agent: draft one ADR per decision from [`template.md`](template.md) with
**`Status: Proposed`**, add it to the index below, and link it from the pull request. Never edit an
accepted ADR in place and never flip a status yourself — accepted records are immutable, and
ratifying one is the maintainer's act.

## An ADR is a decision record, not a specification

An ADR captures a **decision and the reasoning behind it** — not how that decision is implemented.
Implementation mechanics (code, configuration, YAML, exact flags, command snippets, step-by-step
walkthroughs) live in the code and in the reference documentation the ADR links to — for example the
[deployment guide](../deployment-en.md) — never in the ADR itself.

In particular, **Rationale is argument, not a design document**: if a paragraph explains *how
something is built* rather than *why the decision is right*, it belongs in the reference docs, and
the ADR links to it. Naming a mechanism's role and why it exists is argument and belongs here;
documenting how it is wired is specification and does not.

## File conventions

* One decision per record, under `docs/for-maintainers/adr/`, as a `-en`/`-fr` pair:
  `NNNN-short-title-en.md` and `NNNN-short-title-fr.md` — a four-digit sequence number, a
  lowercase kebab-case title, then the language. Both halves carry a banner linking to the other.
* The number is a **sequence**, assigned in the order records are written. It ranks nothing.
* **The English half is authoritative** and the French one follows it. Nothing is settled by
  reading only the French.
* Every ADR follows the format below; [`template.md`](template.md) is a copy-ready skeleton.

## Format

### Title and header

```markdown
# ADR-{number} | {Short Title}

**Status:** Proposed | Accepted | Superseded | Deprecated
**Proposed:** YYYY-MM-DD
**Accepted:** YYYY-MM-DD
**Decision Makers:** {Names or team}
```

The header carries **one dated line per state the decision actually reached in this repository**,
and no date is ever overwritten. A record drafted as *Proposed* carries `Proposed:` alone; accepting
it adds `Accepted:` below and leaves the first line untouched. Both dates then stay for good: when
the thinking happened and when it was ratified are different facts, and a log that keeps only the
second cannot say how long a decision waited, nor which ones were ratified on sight.

A supersession adds nothing — **it moves no date and introduces none**. The decision was taken when
it was taken, and that is what the record keeps; the new date belongs to the successor. What
connects the two is the link, not the date: a *Superseded* ADR links to the ADR that supersedes it,
next to the status.

### Context

Everything that led to the decision, so that someone unfamiliar with the project understands why a
decision had to be made. Include every relevant aspect when applicable: business context;
functional requirements; technical, architectural and operational constraints; security;
performance; cost; team skills; existing limitations; organizational constraints; external
dependencies; deadlines; known risks.

This section contains **facts only**. It does not justify or explain the chosen solution.

### Decision

The decision in **one single sentence** — no justification, no alternatives, no history, and no
implementation detail unless it is part of the decision itself.

> The application will use PostgreSQL as its primary relational database.

### Rationale

Why this decision is the best choice given the Context. Every argument must be traceable to a fact
already stated in Context; if an argument needs a fact that is missing, add the fact to Context
first.

It explains why the decision satisfies the requirements, which constraints it addresses, which
trade-offs were accepted, and why the expected benefits outweigh the drawbacks. It is **argument
only** — see the section above on what belongs in the reference docs instead.

### Alternatives Considered

Every serious alternative that was evaluated, one `###` subsection each, stating **why it was
considered** and **why it was ultimately rejected** — not simply that it was rejected.

### Consequences

Under three subheadings:

* **Positive** — the benefits the decision delivers;
* **Negative** — the costs and limitations accepted with it;
* **Risks** — what could go wrong later, and any mitigation in place.

### Follow-up Actions

Work that becomes necessary because of this decision: documentation to update, components to
migrate, guidelines to write, something to monitor, a review to schedule.

It also names **what will fail when this decision is broken**, and that thing exists before the
pull request is opened — a global rule that makes the mistake unavailable, an assertion in
`verify-output.sh` or `check-narrative.sh`, or, where neither is possible, a measurement recorded
in the commit message. An assertion nobody has seen fail is not evidence: break what it protects,
watch it go red, put it back. Where a decision genuinely admits no check, say so here rather than
leaving the section empty. The rule and its reasoning are in
[`CONTRIBUTING.md`](../../../CONTRIBUTING.md#a-decision-comes-with-something-that-fails-when-it-is-broken).

### References

Optional supporting material: related ADRs, specifications, benchmarks, design documents, pull
requests, issues, diagrams.

## Index

| ADR | Title | Status |
|---|---|---|
| [ADR-0001](0001-a-release-tag-publishes-not-a-merge-en.md) | A release tag publishes, not a merge | Accepted |
| [ADR-0002](0002-the-site-answers-on-one-hostname-en.md) | The site answers on one hostname | Proposed |
| [ADR-0003](0003-the-figure-carries-the-scene-en.md) | The figure carries the scene | Proposed |
| [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) | A control appears only when it can act | Proposed |

## How this base differs from the library's

Named rather than left to be discovered:

* **The directory drops one level**, `docs/for-maintainers/adr/` rather than
  `doc/handwritten/for-maintainers/adr/`. Nothing here is generated, so there is no generated
  documentation to separate hand-written documentation from.
* **Both languages are suffixed**, `-en` and `-fr`, where the library leaves English unsuffixed and
  marks only the translation. This repository's existing pair — the deployment guide — was written
  that way before this base existed, and one twinning convention beats matching the library on a
  filename.
* **The records are paired; this file and the template are not.** The pairing rule in
  `CONTRIBUTING.md` covers the records a maintainer reads to understand a decision, not the format
  spec they read once.
* **No automated ADR check.** The library runs a manual, advisory workflow that asks a model whether
  a branch embarks a decision worth recording. Nothing equivalent runs here, so the check is
  whatever the reviewer does.

## Relation to the design documents

The specification's registry of decisions is what this directory is. Until it is populated,
[`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md) lists the decisions the
specification applies without recording — **a line leaves that inventory when its record exists
here**. It is transitional by construction, and the day it is empty it deletes itself.
