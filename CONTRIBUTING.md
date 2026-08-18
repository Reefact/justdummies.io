# Contributing to justdummies.io

This repository holds the official website of **JustDummies** — the landing
page, the playground, and the content pages around them. It is a separate
repository from the library, on purpose: the library publishes versioned
packages under an API contract, this one publishes a deployment.

What the two share is their history. The commit convention below is the
library's, adopted deliberately — a maintainer moving between the two
repositories should not have to remember which set of rules is in force. Only
the scope table differs, because the components differ.

## Language

The default is **English**: source, comments, commit messages, branch names,
pull request titles and descriptions, issues.

Three exceptions, bounded and named.

**Design documents under `docs/design/` are in French.** They continue a document
written in French for a reader who works in that language, and translating them
would cost a permanent synchronisation without adding a reader.

**What tells a maintainer how to operate this repository is kept as an
English/French pair** — everything under `docs/for-maintainers/`: the deployment
guide, and the decision records in `adr/`. They are paired because they are read
while doing the thing they describe, by whoever is doing it, and someone
following installation steps in a second language makes mistakes they would not
make in their own.

**What announces a release to a reader outside this repository is kept as the
same kind of pair** — `RELEASE_NOTES-en.md` and `RELEASE_NOTES-fr.md`, at the
repository root (see the `release-notes` skill and
[`ADR-0017`](docs/for-maintainers/adr/0017-draft-a-releases-github-notes-by-hand-and-refuse-without-them-en.md)).
Unlike the maintainer-facing pair above, this one is read by anyone glancing at a
GitHub Release, not only by whoever operates the repository — but a reader
deciding whether to look at what's new deserves it in their own language just as
much as someone following a deployment step does.

Both halves carry the same name under an explicit `-en` or `-fr` suffix —
`deployment-en.md`, `deployment-fr.md` — and each opens with a banner linking to
the other. Neither language hides in an unsuffixed filename: a reader who lands
on one knows, from the name alone, that a twin exists.

**The English half is authoritative** and the French one follows it, so a
divergence between the two has an answer rather than an argument.

The synchronisation the first exception refuses is the price of the second, and
it is not hypothetical: the deployment guide was corrected eight times in one
afternoon, every correction applied twice. **A change to one half is unfinished
until the other has it** — the halves are reviewed against each other, not each
against itself. Prefer a single file whenever the audience allows one.

Both exceptions stop at prose. A code comment, a commit message or a pull request
title is English, including when its subject is a French document.

They are written down because an exception nobody wrote down is not an exception,
it is the beginning of a repository in two languages.

The site's own user-facing copy is a different question again, settled by the
specification and not by this guide.

## Branches

### The rule

* A branch carries **one pull request**, and that pull request carries one
  coherent unit of work. Work unrelated to that unit takes its own branch.
* `main` is written **only** by merge. No commit lands on `main` directly.
* A branch MUST be cut from the **tip of `origin/main`**, freshly fetched —
  never from a local `main` that may lag, nor from another topic branch:

  ```
  git fetch origin
  git switch -c <author>/<short-description> origin/main
  ```
* A branch name MUST take the form `<author>/<short-description>`. The
  `<author>` is the branch owner's GitHub handle — the person or the tool the
  work belongs to: `sylvain/…`, `claude/…`, `dependabot/…`. The
  `<short-description>` MUST be English, lowercase, kebab-case, and name the
  change, not the file it touches: `sylvain/hero-scroll-timeline`, never
  `sylvain/Hero.astro`.
* A tool that generates its own branches owns its namespace and keeps its
  native layout beneath it — `dependabot/npm_and_yarn/astro-5.0.0`. Fighting a
  generator's scheme buys nothing.
* The branch name carries **no type**. The type is a property of each commit,
  checked there by the hook and by CI; a branch gathers commits of several
  types, and a single prefix would name one and hide the rest.
* A branch lives exactly as long as its pull request stays **open**. Once the
  pull request is merged or closed, the branch is finished — follow-up is a new
  branch, cut fresh from `origin/main`.
* Rewriting a branch's history — a force-push, a `git rebase -i` — is fine
  while the branch is **yours alone**, and is how a commit message the lint
  rejected gets fixed, even mid-review: a rejected message cannot be corrected
  by a follow-up commit. Once anyone else may have based work on it, its
  history MUST NOT be rewritten.
* Before opening the pull request, **read the branch** against a fresh
  `origin/main`:

  ```
  git fetch origin
  git log  --oneline origin/main..HEAD     # the commits the request adds
  git diff --stat    origin/main...HEAD    # the files it touches
  ```

  If either shows something the request is not about, the branch has drifted —
  split it before review, not after.

### The doctrine

**The branch is the unit of work in progress; the pull request is what it
becomes.** One branch, one pull request, one unit of work.

**The name says who, the commits say what.** A branch may carry a feature, the
refactor that prepared it and its tests at once; no single type names it
honestly. The branch name adds the one thing the commits omit — whose work it
is.

**A branch is disposable.** Its commits are replayed onto `main` when it lands;
the ref itself is cut fresh and deleted on merge.

**Cut from the remote, not the local.** A local `main` lags silently, and a
branch cut from it drags that lag into every diff.

## Enabling the commit-message hook

A `commit-msg` hook checks every message against the convention below before it
is recorded. It is versioned under `.githooks/`; enable it once per clone:

```
git config core.hooksPath .githooks
```

The same check runs in CI on every pull request, so a bypassed hook
(`git commit --no-verify`) is caught before merge. Merge commits are exempt.
The check itself lives in `tools/commit-lint/lint-commit-message.sh`, shared by
the hook and CI so the two never diverge.

The hook lets `fixup!`, `squash!` and `amend!` commits through so you can build
an autosquash rebase; CI rejects them, so squash them away before merge.

## Commit messages

### Format

```
<type>[(<scope>)][!]: <description>

[body]

[footers]
```

* The commit MUST begin with a type, optionally followed by a scope and a `!`,
  then a colon and a space.
* Everything written in the message MUST be in English — header, body, footers.
* A commit MUST carry a single type, that of its intention. Two independent
  intentions MUST be two commits: the message forces the split that ought to
  happen.
* The description is imperative present, lowercase, with no trailing period:
  `add the hero scroll timeline`, never `Added the hero scroll timeline.`
* The whole header stays within **72 characters**.
* Leave a blank line between the header and the body. The body is prose, and it
  says **why** — the diff already says what.

### Types

The list is closed and identical to the library's.

| Type | When to use |
|---|---|
| `feat` | A new capability, visible to a visitor of the site |
| `fix` | The correction of a defective behaviour |
| `build` | Build system, dependencies, deployment artefacts |
| `chore` | What touches neither the site's code nor its delivery |
| `ci` | Pipeline configuration |
| `docs` | Documentation only — this repository's own docs, not the site's content |
| `perf` | A performance gain, at constant observable behaviour |
| `refactor` | Restructuring, at constant observable behaviour |
| `revert` | The reversal of an earlier commit |
| `style` | Formatting with no semantic effect |
| `test` | Tests only |

The type MUST be lowercase and belong to this table.

### Scope

The scope MAY be provided, and is **required** on `feat` and `fix`. When present
it MUST be lowercase and MUST be one of:

| Scope | Covers |
|---|---|
| `ci` | The pipeline as a subject — a `docs(ci)` explaining a workflow, not a change to the workflow itself, which is the `ci` type |
| `playground` | The Blazor WebAssembly playground and its parser |
| `site` | The Astro application — pages, layouts, components, content |
| `tokens` | The shared design tokens, consumed by both applications |

A scope names a **component**, never a file or a directory: `fix(site)`, never
`fix(Hero.astro)`. Several scopes are comma-separated, unique and alphabetical,
with no space: `feat(playground,tokens)`.

`feat` and `fix` require one because a capability added or a defect fixed always
belongs to a component, and the diff does not always say which — a change under
the design tokens serves both applications at once. Every other type keeps the
scope optional: what genuinely belongs to no component stays unscoped.

### Breaking changes

A `!` before the colon requires a `BREAKING CHANGE:` footer describing what
callers must do, and the footer requires the `!`. The two signals travel
together or not at all.

The site publishes no package, so a breaking change here is rarer than in the
library and means something narrower: a URL that no longer resolves, a
redirect removed, a public asset path that moved.

### Issue references

When a GitHub issue exists, reference it in a footer:

```
Refs: #42
```

Issue-closing keywords (`Closes #42`) belong in the pull request description,
not in a commit — the commit is the unit of the change, the issue is the unit of
the request, and only the pull request closes one.

## Pull request titles

A pull request MAY gather several commits, of several types. Its title is read
in the list of open pull requests, and it never becomes a commit — this
repository lands pull requests by rebase, so GitHub writes no
`Merge pull request #NN`. It is **not** linted; it stands on the review, as the
code does.

* The title MUST be in **English** and name the **whole** pull request, not one
  of its commits.
* **One intention** — the title mirrors the commit header it collapses to:
  `<type>[(<scope>)]: <description>`, under the rules above. A one-commit pull
  request's title is that commit's header, verbatim.
* **Several intentions** — the title MUST NOT borrow a single `type:` prefix: it
  would name one commit and hide the rest. State the subject in plain words,
  with an initial capital and no trailing period.
* Keep it within **72 characters**.
* The issue reference lives in the description, never the title.

## Decision records

A pull request that embarks an architectural decision records it as an ADR under
[`docs/for-maintainers/adr/`](docs/for-maintainers/adr/README.md). The format is
the library's, and so is the test for whether a decision is significant enough to
record: *if the implementation changed but the decision stood, would the record
need rewriting?*

Most pull requests embark no decision and add no ADR. What is expected is that
the question was asked, not that the artefact exists.

An accepted record is never edited in place — a decision is revisited by writing
a new record that supersedes it. Drafting one leaves it `Proposed`; accepting it
is the maintainer's act.

### A decision comes with something that fails when it is broken

A record says what was decided. It does not keep the decision true. Between the
two sits the thing this repository keeps learning: **a rule nobody can check is a
rule that drifts, and the drift is silent.** The tablist that shipped visible
without scripting was written to a pattern the repository already followed, in a
file whose own comment said so, and it was wrong anyway.

So a record's *Follow-up Actions* names what will fail when the decision is
broken, and that thing exists before the pull request is opened. In order of
preference:

* **A guarantee by construction**, which beats a check — a rule declared once,
  globally, so the mistake is no longer available. ADR-0004's
  `[hidden] { display: none !important }` is one.
* **An assertion in the build**, in `verify-output.sh` for the artefact's shape
  or `check-narrative.sh` for what the page says. Both run in CI, so a branch
  that breaks the decision does not merge.
* **A measurement recorded in the commit message**, when the property is real but
  not mechanically checkable — the seven viewport sizes behind the first screen's
  layout. It does not fail on its own; it gives the next person the number to
  compare against.

An assertion nobody has seen fail is not evidence. **Break what the check
protects, watch it go red, then put it back.** That is how the four assertions
behind ADR-0004 were written, and one of them was blind on the first attempt —
it reported a pass against a file the edit had never reached. Say in the pull
request that this was done.

Where a decision genuinely admits no check, say so in *Follow-up Actions* rather
than leaving the section empty: a named gap is one somebody can close.

## What this repository does not inherit

The library's guide carries rules that follow from publishing packages. They do
not apply here, and importing them would be cargo cult:

* **No public API baseline.** Nothing here is referenced by a consumer's build.
* **No release trains.** The library partitions commits into trains by scope so
  each package publishes independently. This repository publishes one artefact,
  so the scope is a reading aid, not a routing key.
* **No blanket French twin.** The library pairs every user-facing page. Here the
  pairing is bounded to what the Language section names, and everything else —
  source, comments, commit messages, issues — is English only; the site's content
  language is settled by the specification.
* **No mutation testing, no analyzer release tracking.**

One exception is recorded rather than hidden: the repository's first commit,
which added the licence, predates this guide and the hook that enforces it. It
was written to the convention after the fact. Everything from this guide onward
follows the rule that `main` is written only by merge.
