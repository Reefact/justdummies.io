# ADR-0009 | The browser checks are driven by Playwright

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0009-les-controles-navigateur-sont-pilotes-par-playwright-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-12
**Accepted:** 2026-08-12
**Decision Makers:** Reefact

## Context

The repository has no browser check and no JavaScript test runner of any kind. What it has is three
scripts, and each reads something different: `verify-output.sh` reads the built artefact on disk,
`check-served-headers.sh` asks the running host for its response headers, and `check-narrative.sh`
reads the built document. None of the three renders a page.

Four defects sit outside what those three can see, and three of them have already happened here.

* **The playground goes blank.** Its `<base href>` has to match where the playground was copied, and
  when it does not, every asset 404s and the page renders nothing at all — with no error anywhere.
  `verify-output.sh` checks that the two strings agree, which is a different claim from the page
  working. The failure is listed in the deployment guide's troubleshooting table because it has been
  met.
* **A rule file can be present, well formed, and ignored.** A redirect rule in this repository was
  discarded by the runtime for months' worth of builds while every on-disk check passed.
  `check-served-headers.sh` exists because of it, and it closes that hole for headers only.
* **A control can ship dead.** The install tablist reached production visible without scripting,
  because the component's own `display: flex` beat the `hidden` attribute. It was found by loading
  the page with scripting refused. Nothing in the repository would have caught it, and the markup
  read correctly ([ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md)).
* **A measurement can be taken in the wrong browser and believed.** A horizontal scrollbar reported
  on a desktop was measured as absent twice, because headless Chromium draws overlay scrollbars that
  take no width while `100vw` counts a classic one. The page was wrong and the measurement said it
  was fine.

Two accepted decisions describe behaviour that only exists once a page runs. ADR-0004 requires every
scripted control to be absent until its script has run, and the page beneath it to work without one.
[ADR-0005](0005-a-scene-arrives-rather-than-holding-the-screen-en.md) requires scenes to arrive as
the reader scrolls. Both are checked today by reading markup, which is the level at which the
ADR-0004 defect above looked correct.

The site's Content-Security-Policy sets `style-src 'self'` with no `unsafe-inline`, and its script
hashes are computed at build time. Whether a browser accepts the result is checked nowhere.

The checks such a suite would need are asynchronous by nature: a WebAssembly runtime finishes
booting, a script unhides a control, a scroll triggers a reveal. Waiting is therefore a property of
every one of them, not an incidental detail of a few.

The environment is asymmetric. The development container already carries Chromium; GitHub's runner
carries no browser, so any browser suite adds an install step and minutes to every pipeline run.

Two standing repository rules bear on the choice. A dependency is not added without a clear reason,
and a decision arrives with something that fails when it is broken
([`CONTRIBUTING.md`](../../../CONTRIBUTING.md)).

Nothing in the repository states a browser matrix. The site is a set of static documents plus one
WebAssembly application, maintained by one person, deployed to one host.

## Decision

**The site's browser checks are driven by Playwright, which drives Chromium directly.**

## Rationale

Every defect in Context is a fact about a rendered page — a blank application, a discarded rule, a
control that does nothing, a document wider than its viewport. Reading the artefact cannot see any of
them, and in three of the four cases the artefact was correct. That settles that a browser has to do
the checking; the rest of this section is about which driver, and the answer follows from the two
facts that make browser suites fail in practice.

The first is waiting. Every check named in Context lands after something asynchronous, so a driver
that answers only "what is on screen at this instant" hands the waiting back to the author — and the
wait an author writes under time pressure is a sleep. A suite built on sleeps is slow when it passes
and intermittent when it does not, and an intermittent red teaches a maintainer to ignore red, which
costs more than the suite returns. Playwright's assertions retry against a deadline, so waiting is
the tool's concern rather than a discipline this repository would have to keep. That is the single
reason that outweighs the others.

The second is that the checks Context asks for should be instructions rather than reconstructions.
Refusing scripting for a whole browsing context, emulating a viewport, emulating a reduced-motion
preference, and observing the violation a security policy raises are each things this suite needs
once or more, and each is something the chosen driver does rather than something the suite has to
simulate. A driver that lacks them does not make the checks impossible; it makes each one a small
piece of machinery to maintain, and machinery in a test suite is where the suite's own bugs live.

The cost is one dependency, and the driver ships versioned against the browser it drives. That
matters against the repository's dependency rule: a stack that pairs a driver binary with a browser
binary is two things to keep in step, and keeping them in step is maintenance bought in exchange for
running the same suite on browsers this site never claims to check.

The added CI time is real and it is the price of the class of defect above reaching production
unannounced. It is bounded — a browser download, cacheable, on a runner that would otherwise carry
none — and it buys the first check that the playground works at all, which today has none.

Finally, the portability that the alternatives sell is worth little here. One maintainer, one host,
no stated browser matrix: a second browser engine in the suite would add cost immediately and answer
a question nobody in this repository has asked.

## Alternatives Considered

### Selenium and the WebDriver protocol

Considered because it is the standard, it is vendor-neutral, and a suite written against it runs on
Firefox and Safari without being rewritten — which would answer the one thing a Chromium-only suite
cannot, namely a defect that only another engine shows.

Rejected because that neutrality is not free and this repository does not spend what it buys. A
WebDriver stack pairs a driver binary with each browser and versions the two against each other,
which is standing maintenance; and it leaves waiting to the author, which is precisely where the
asynchronous checks in Context would turn into sleeps. Paying maintenance for a browser matrix that
no requirement asks for, in the currency of the failure mode most likely to kill the suite, is the
wrong trade here.

### Cypress

Considered because its failure ergonomics are the best of the candidates — a time-travelling runner
that shows the page at each step — and because a small suite benefits from that more than a large
one does.

Rejected for two reasons that are specific to this site rather than general. It executes the test
code inside the page under test, and it removes the response's content-security-policy in order to
do so; a suite that strips the policy cannot be the thing that proves the policy is enforced, and
that is one of the four checks. And a browsing context with scripting refused is not something it
offers, because it needs scripting to run at all — so ADR-0004's requirement could not be checked in
the state that exposed the defect.

### Puppeteer

Considered because it drives Chromium directly, as the decision does, with a smaller surface and one
fewer layer of abstraction — and the repository's instinct is to prefer the smaller tool.

Rejected because the part it leaves out is the part being chosen for. Waiting for a selector is
there; assertions that retry until a deadline are not, and neither is the assertion library that
would carry them. Adopting it means writing that layer here, which is the machinery the Rationale
argues against, and the smaller surface stops being smaller once the missing layer is counted.

### jsdom or happy-dom under a unit test runner

Considered because it is by far the cheapest option: no browser, no CI install, no minutes, and it
would let the site's scripts be exercised at all, which today they are not.

Rejected because it has no layout engine and no security policy. The overflow check has nothing to
measure, the policy check has nothing to enforce, the reveal has no scroll, and a playground whose
assets all 404 parses perfectly. It would report success on all four defects in Context, which makes
it worse than no check: a green suite is a claim.

### Keep reading the artefact, and add no browser check

Considered because the three existing scripts are good, cost almost nothing, and cover a great deal
— and because the honest answer to "should this exist" is sometimes no.

Rejected because Context lists four defects that reached or nearly reached production through them,
and in three the artefact under inspection was correct. The gap is not a gap in how carefully those
scripts read; it is that they read rather than render.

## Consequences

### Positive

The class of defect closes: facts about a rendered page get checked by something that renders the
page. Three of the four failures in Context become impossible to ship silently.

The playground gets its first check that it works at all. Until now nothing has asserted more than
the consistency of two strings in its markup.

Two accepted decisions gain a check that exercises them instead of inspecting them. ADR-0004's
no-scripting requirement can be checked in the state that exposed its defect, and ADR-0005's arrival
can be checked at its end state rather than by the presence of a class name.

### Negative

The repository gains a second toolchain. It has been bash and node scripts throughout, and a browser
runner is a different kind of thing to keep working, upgrade and debug.

Every pipeline run pays for a browser it does not otherwise need, in download and in minutes.

The browser's version is pinned by a package rather than chosen. When the package moves, the browser
moves, and a check can go red for a reason that has nothing to do with the site.

### Risks

**Flake is the standard death of a browser suite**, and this one is not immune. The mitigation is a
policy rather than a hope: retries stay at zero, so an intermittent failure is a defect in the check
to be fixed or the check to be deleted, and no check waits on a fixed delay. That second half is
enforceable and is enforced — see Follow-up Actions.

**One engine is checked.** A defect only Firefox or Safari exhibits is outside this suite, and no
part of the repository should be read as claiming otherwise. Adding a second engine is a later
decision with its own cost, not an oversight in this one.

**Scope creep toward visual snapshots.** Font rendering differs between the development container
and the runner, so pixel comparison would be flake with a weak signal attached. It is refused here so
that adding it later is a decision somebody makes rather than a drift nobody notices.

## Follow-up Actions

* Each check is break-tested before it lands: break what it protects, watch it go red, restore. What
  was broken and what it said is recorded in the commit that adds it, per
  [`CONTRIBUTING.md`](../../../CONTRIBUTING.md#a-decision-comes-with-something-that-fails-when-it-is-broken).
* The suite's own runner script refuses a check that waits on a fixed delay, so the no-sleep half of
  the flake policy fails the build rather than relying on review.
* The suite runs in the build job, on the artefact the build has just produced, and a maintainer runs
  the same script by hand. Where it runs against, and how, is specification: it is documented in the
  [deployment guide](../deployment-en.md), not here.
* A second browser engine, and automated accessibility rules, are each their own decision. Neither is
  implied by this one.

## References

* [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) — the control that shipped dead, and
  the requirement this suite can now exercise
* [ADR-0005](0005-a-scene-arrives-rather-than-holding-the-screen-en.md) — the arrival this suite
  checks at its end state
* The deployment guide's troubleshooting table, which lists the blank playground as a met failure
