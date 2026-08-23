# ADR-0025 | One consent question for two applications

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](0025-une-seule-question-de-consentement-pour-deux-applications-fr.md)

**Status:** Accepted
**Proposed:** 2026-08-23
**Accepted:** 2026-08-23
**Decision Makers:** Reefact

## Context

ADR-0018 put the journey behind an explicit yes: the tag's bootstrap declares every consent signal
denied and loads no Google script, and the consent script is the only caller of the function that
starts it. Nothing reaches Google before an answer, and a withdrawal raises Google's own opt-out flag
rather than merely revoking the signal.

That machinery lives in one place, `Measurement.astro`, and it is more than a yes and a no. It holds
the storage key `jd:analytics-consent`, a six-month retention after which the banner asks again, a
tolerance for a clock that was fast when the answer was written, a re-check of the retention on every
single report rather than at load alone, and a periodic check so a tab that never moves still notices
an expiry.

**This site is two applications, and only one of them has any of it.** The Astro pages render the
banner and the tag; `apps/playground/wwwroot/index.html` is a hand-written shell that renders neither
— the finding ADR-0023's work established and the measurement plan records as a gap.

**They are nonetheless one origin.** ADR-0002 settled that the site answers on one hostname, and
`/playground/` is served from it like every other path. Local storage is scoped to an origin rather
than to a document, so the key one application writes is the key the other reads, with nothing shared
between them and nothing to synchronise.

**The playground is reachable without passing through a page that asks.** It is a deep link — an
`<a>` pointing at `/playground/?lang=fr` from anywhere — so a visitor may meet the playground first
and a site page never.

**This repository already answers "the same chrome in both applications" three times over.**
`SiteHeader.razor`, `SiteFooter.razor` and `DownloadFab.razor` are Razor counterparts of Astro
components; the download control's own comment names the arrangement — *the playground's counterpart
to the site's DownloadFab.astro […] Same tokens, same shape, same corner as the site's.* None of them
shares markup with its twin. All of them share the design tokens, and each speaks its own
application's strings.

The playground picks its language at run time. `LocaleState` reads `?lang=`, publishes changes through
an event, and re-words the shell through `jdSetDocumentLanguage` when a visitor switches language
after boot — so a fragment rendered in one locale at build time could not follow a visitor who
switches.

`scripts/generate-headers.mjs` derives the content policy from every HTML document in the artefact,
the playground shell included, and grants the analytics hosts only where a document actually carries
the tag.

## Decision

**The consent question belongs to the origin and not to a document: either application may ask it,
both read and write the one stored answer, and neither ever asks a visitor who has already
answered.**

## Rationale

A consent is given to a purpose and a controller, not to a URL. One site asking the same question
twice is not twice as protective; it is a site that appears to have lost the first answer. A visitor
who accepted on the landing page and meets an identical banner on `/playground/` learns nothing and
decides nothing — they re-answer a question they have answered, and the second prompt reads as a
defect. The technical fact that this site is built from two toolchains is ours, and a visitor should
never pay for it.

**The answer already crosses; only the asking and the acting do not.** One hostname means one origin
means one local storage, so the store needs nothing added to be shared. What is missing from the
playground is a banner to ask with and a bootstrap to act on the answer — and once it has both, the
sharing runs in both directions at no extra cost: an answer given on the playground is the answer
every site page reads next, exactly as the reverse already would be.

**The banner is chrome, and this repository has already decided how chrome is shared.** The header,
the footer and the floating download control each exist twice, once per toolchain, sharing the design
tokens rather than the markup. A fourth piece of chrome following the same arrangement is the
consistent answer, not a new one. It also survives what an injected fragment would not: the playground
chooses its language after the build and can change it after boot, so a banner rendered once in one
locale would be wrong for half its readers and unable to follow the other half.

**The decision itself is not chrome, and that half must not be duplicated.** The retention window, the
skew tolerance, the re-check on every report and the opt-out flag are not appearance — they are the
promise ADR-0018 made. Two copies of them drift, and the drift is silent in the worst direction: one
document would go on reporting for a visitor the other had already stopped reporting for. So the
decision is one module that both documents load, and the two banners are two views onto it.

That split also keeps the guarantee where ADR-0018 put it. The module stays the only caller that
starts the tag, in both documents; a document that renders a banner but fails to load the module
starts nothing, which is the safe direction to fail in.

## Alternatives Considered

### Give the playground a banner of its own, with its own logic

Considered because it is the smallest change that makes the playground able to ask: no refactor of the
site's script, no shared module, nothing moved.

Rejected because it duplicates the part that must not be duplicated. The retention window and the
withdrawal path would exist twice, and the day one is corrected and the other is not, a visitor who
withdrew on the site would still be reported from the playground. It also duplicates the question
itself for anyone who visits both halves, which is the outcome this decision exists to prevent.

### Have the playground read the answer and never ask

Considered first, and it satisfies the letter of "never ask twice" at the lowest cost: a small script
reads the stored answer, starts the tag if it is a fresh yes, and renders nothing.

Rejected because the playground is a deep link. A visitor who arrives there directly has never been
asked, would never be asked, and would therefore never be counted — silently, and precisely for the
visits most likely to be worth counting. Refusing to ask is not neutrality when it is the visitor's
entry point.

### Inject the Astro-rendered banner into the playground shell at build time

Considered because it is the most literal reading of "the same banner": the same rendered bytes in
both documents, extracted after the site build and written into the shell, with nothing reimplemented.

Rejected on localisation. The Astro banner is rendered per page, in that page's language; the
playground is one document that chooses its language from `?lang=` at run time and can change it after
boot. A fragment captured at build time is one locale, and injecting both and hiding one would
reimplement the language switch anyway — at which point the Razor twin is the smaller and more
honest thing. The build-time coupling would also be new: nothing today reads the site's output to
assemble the playground's.

### Serve the playground from an Astro page

Considered because it would dissolve the problem rather than solve it: one toolchain, one banner, one
tag, no twin of anything.

Rejected as far larger than the question being answered. The playground is a Blazor application with
its own shell, its own routing and its own boot sequence, and rehosting it to share a banner would put
every one of those in play for a benefit this decision obtains without touching them.

## Consequences

### Positive

A visitor is asked once, wherever they arrive, and their answer holds across the whole site. The
technical split stops being visible to them.

A consent given on the playground benefits every site page, and the reverse, without either
application knowing the other exists — the origin's storage is the only thing between them.

The playground can finally carry the journey lane, which is what makes a per-visitor reading of it
possible at all.

The invariant ADR-0018 rests on becomes checkable across the whole artefact rather than true by
construction in one toolchain: a document that carries the tag must carry a banner.

### Negative

There is a second banner view to keep in step with the first — a fourth after the header, the footer
and the download control. The tokens and the shared module carry most of it, but the wording and the
markup are two files that a change has to visit twice.

The playground gains the analytics tag, so the content policy grants Google's hosts on a document that
never contacted them before. The policy is derived rather than written, so it follows on its own, but
the artefact's exposure is genuinely wider than it was.

The playground's shell grows: a banner, a bootstrap and a module, on a document whose first paint is
already competing with a runtime download.

### Risks

**The two banner views can drift in wording or appearance** while the decision underneath stays
identical — the failure mode that duplication always has, moved rather than removed. What bounds it is
that the drift is visible (two banners a maintainer can look at) rather than silent, unlike a drift in
the retention window would have been.

**A banner left open in one tab does not know another tab answered.** The site already re-reads the
stored answer on a storage event for its expiry logic; a banner that stays on screen after the
question was answered elsewhere is a smaller defect than a wrong report, but it is one a visitor can
see, and closing it is worth doing rather than assuming.

**The playground's language switch happens after the banner is drawn.** The banner has to follow it,
like the rest of the playground's chrome does; a banner that stays in the boot language after a switch
would be the same defect `jdSetDocumentLanguage` exists to prevent for the error banner.

## Follow-up Actions

* **What fails when this is broken, in the build:** `scripts/verify-output.sh` gains an assertion that
  every document carrying the analytics tag also carries a consent banner. It is the invariant
  ADR-0018 rests on, it has been true only because one toolchain rendered both, and it is exactly what
  a second toolchain can break silently. Break-tested before the pull request, per CONTRIBUTING.
* **What fails by construction:** the decision is one module. A retention window, a skew tolerance or
  a withdrawal path cannot drift between the two applications, because there is only one of each to
  drift from.
* **And what a build cannot see:** a browser check answers the question on the playground and asserts
  that a site page then finds it already answered, and the reverse — the crossing this decision is
  for, which no static reading of the artefact can establish.
* The [measurement plan](../measurement-plan-en.md) records that the playground now carries all three
  lanes, and loses the gap it named.
* The privacy page and the consent banner's own copy state that the playground is covered, in both
  locales.
* The [deployment guide](../deployment-en.md) notes that the analytics hosts are now granted on the
  playground document too, so the post-deploy console check covers it.

## References

* [ADR-0018](0018-the-journey-is-measured-in-a-third-lane-gated-on-consent-en.md) — the lane this
  extends, and the promise the shared module keeps
* [ADR-0002](0002-the-site-answers-on-one-hostname-en.md) — one hostname, and therefore one origin and
  one store
* [ADR-0023](0023-an-event-carries-a-variant-only-when-it-has-a-door-to-choose-en.md) — where the
  playground's absence from every lane was established
* [ADR-0024](0024-the-playground-reports-a-chains-shape-not-its-values-en.md) — the census half of the
  same work, which needs no consent and lands independently
* [ADR-0004](0004-a-control-appears-only-when-it-can-act-en.md) — why a banner is not rendered by a
  build with no measurement id to report to
* [`docs/design/specification.md`](../../design/specification.md) §15.4 (the journey, and what it asks
  first), §6.5 (the playground's one document and its `?lang=`)
