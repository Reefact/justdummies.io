# Release notes — justdummies.io

🌍 🇬🇧 English (this file) · 🇫🇷 [Français](RELEASE_NOTES-fr.md)

What changed on justdummies.io, one section per `release/*` tag, in plain language — for a
visitor, a contributor, or the maintainer's own future self checking what's new. This is not a
commit log: it says what a reader would notice, not which pull request carried it. The technical
record is the repository's own history; nothing here is a compatibility note, because nothing
consumes this deployment (see [ADR-0001](docs/for-maintainers/adr/0001-a-release-tag-publishes-not-a-merge-en.md)).

## Unreleased

_Nothing pending yet._

## release/2026-08-21T10-08-43Z — August 21, 2026

### ✨ New
- The playground's code panel now prints a genuine C# literal for every argument type — strings, chars, booleans, all integer types, the three floating-point types, and `Half` — instead of falling back to a generic parsing call for most of them.
- The playground now has the same floating "Download" button as the rest of the site, on every one of its pages.
- A small "dummy driving" illustration now decorates the playground's card on very large screens.
- The /version page now shows what the site's own latest release changed, in English and French, below the build facts it already reported, linked to the matching GitHub release.

### 🙌 Improvements
- Redrew the "page not found" illustration for better contrast and a more readable face, and switched it to WebP — cutting its size by roughly 80%, so the error page loads faster.
- Clarified the wording explaining how the criteria are ordered on the "why JustDummies" comparison page.
- Switching language on a release notes page now keeps your place on the page instead of resetting you to the top.

### 🐛 Fixes
- In the playground, a step turns into code as soon as you pick its method, instead of staying a drop-down until you happen to click somewhere else on the card; the cursor lands where you're going to type next — the step's first argument, or the combo for the step after it.
- Playground: a refusal from the library could render without its usual error color, making it look like a normal value.
- Playground: its footer was missing the link to the API reference and showed a hardcoded legal name instead of the site's own.
- The floating "Download" button, present across the site, could stay hidden behind other content while still holding keyboard focus; it now releases focus properly.
- Release notes mirrored from the library: links pointed at the library's moving main branch instead of the published version, weren't announced as external links to screen readers, and some pre-release versions were mislabeled as stable.
- Release notes pages: fixed a run of layout issues — barely visible bullet markers, misaligned section icons, a table of contents that didn't stay in view while scrolling in some browsers, a page laid out as wide as an API reference page instead of prose, and a sideways scroll on the release notes index and its table of contents on narrow screens.
- Release notes pages: fixed several accessibility issues — links that shared the same name for a screen reader despite pointing elsewhere, markers that disappeared in forced-contrast mode, a browser-default focus outline instead of the site's own, and a page title sitting outside the page's main content region.
- Release notes pages: fixed a further batch of issues — jumping to a table-of-contents entry didn't move keyboard focus there, the wrong version was flagged as "you are here" on mobile, French used the same word for two different things, a "changelog" link claimed a source it didn't actually read, and the release date could land awkwardly under its badge on mobile.
- Release notes: a malformed code span could break the page's markdown rendering, and an invalid date (like November 31st) was silently rolled forward to the next day instead of being rejected.

## release/2026-08-19T11-50-00Z — August 19, 2026

### ✨ New
- Added a dedicated download page — one for each package (core library, xUnit adapter, CLI) — reachable from a persistent floating link on every other page, showing both install commands (.NET CLI and Package Manager Console) for the current package at once.
- The playground's Except and OneOf constraints now accept a comma-separated list of values, for every scalar generator that supports them.
- Published a new release notes section, with one page per package and major version and a table of contents, sourced directly from the library's own release notes in English and French.
- Added an optional analytics lane, based on Google Analytics, that reports how readers move through the site — it only starts once you accept it in the cookie banner, and stops the moment you withdraw consent.
- Updated the underlying JustDummies library to 1.0.0-preview.2, adding a "Pool inspection" category to the API reference.

### 🙌 Improvements
- Corrected the privacy page's description of how long analytics data is kept, and dropped an inaccurate claim that nothing is ever shared with anyone.

### 🐛 Fixes
- Fixed the French UI translating "release notes" as "Notes de version" instead of keeping the English term.
- Removed a double punctuation mark in one of the playground's notes.

## release/2026-08-18T14-49-42Z — August 18, 2026

_The playground gets clearer about its own limits, and its introduction reads properly in French again._

### ✨ New
- The playground's method list now shows library features it can't run there (like composite generators) as grayed-out options with an explanation, instead of leaving them out entirely.

### 🐛 Fixes
- Rewrote the playground's introductory text in both English and French — the French version had become nonsensical — and added a note clarifying it's a narrower interface to the real library.
- The note beside the "Generate" button now explicitly says the code runs locally in your browser, instead of the vague "running here".

## release/2026-08-18T12-53-33Z — August 18, 2026

_Wording and layout corrections across the homepage and the playground, nothing structural._

### 🙌 Improvements
- Replaced the "problem it solves" section on the why-justdummies page with a short transition sentence, since it had shrunk to little more than a link.

### 🐛 Fixes
- Fixed the playground's opening paragraph being sized and stretched full-width like a headline instead of normal body text.
- Corrected the English homepage subtitle, which had described the test values themselves as "fluent" instead of the API that generates them.

## release/2026-08-17T20-58-25Z — August 17, 2026

_The playground's code view now matches the one on the homepage._

### 🙌 Improvements
- Redesigned the playground to match the landing page's code card, showing your chosen steps as syntax-highlighted code with a one-line, copyable snippet of the full chain.

## release/2026-08-17T20-39-18Z — August 17, 2026

_One section of the comparison page trimmed down to what still holds up._

### 🙌 Improvements
- Simplified the "when not to use JustDummies" section on the why-justdummies page, dropping three points that no longer held up.

## release/2026-08-17T19-31-39Z — August 17, 2026

_The comparison page's summary table is easier to find, and a misaligned API page header is fixed._

### 🙌 Improvements
- On the why-justdummies comparison page, the summary table now appears right at the top of that section, so a reader sees the full comparison without expanding anything.
- The rating icons' definitions now show up as tooltips instead of a separate legend box, and the top of the page reads calmer with less color clutter.

### 🐛 Fixes
- Fixed the API pages' logo and heading being misaligned compared to the rest of the site.

## release/2026-08-17T09-26-07Z — August 17, 2026

_A round of polish on the comparison page after maintainer review._

### 🙌 Improvements
- Polished the comparison page based on maintainer review: opening one criterion now closes the previous one and keeps your place on the page, the full comparison table is always visible instead of collapsible, and the rating icons are now plain black-and-white shapes with tooltips instead of color-coded.

## release/2026-08-17T07-43-58Z — August 17, 2026

_Another pass on the comparison page, plus a corrected claim about JustDummies' own compile-time checks._

### 🙌 Improvements
- Redesigned the why-justdummies comparison page again: a simpler introduction, criteria you can expand one at a time, and a plain check/wrench/dash icon set for ratings.

### 🐛 Fixes
- Fixed the landing page's code sample so it no longer visibly jumps when the live playground widget replaces it.
- Corrected the comparison table entry for compile-time checks, which had understated what JustDummies' built-in analyzers catch for free.
- Fixed an awkward French homepage tagline.

## release/2026-08-16T19-18-07Z — August 16, 2026

_Lightweight analytics on install links, and the comparison page explains its own criteria before showing the matrix._

### ✨ New
- Added lightweight, privacy-friendly analytics that record which install command or link visitors use, so future decisions can be guided by what actually leads people to install (details are explained on the privacy page).

### 🙌 Improvements
- Reworked the why-justdummies comparison page so it explains each comparison criterion in plain language before showing the matrix, and corrected several inaccurate claims made about competing tools.

### 🐛 Fixes
- Fixed the playground page's header, footer, spacing, and opening paragraph so they match the rest of the site instead of looking like a separate app.

## release/2026-08-16T07-42-03Z — August 16, 2026

_The playground moves from one fixed example to building a real generator chain step by step._

### ✨ New
- The playground now lets you build a real generator chain step by step from the library's actual methods, instead of showing one fixed example.

## release/2026-08-16T06-55-58Z — August 16, 2026

_Two new pages: a ten-criteria comparison with other tools, and a full API reference._

### ✨ New
- Added a "Why JustDummies" page comparing the library to Bogus, AutoFixture, and hand-written test data across ten criteria.
- Added a full API reference section documenting every method in the library, generated directly from the published package.

### 🐛 Fixes
- The Release Notes page no longer shows an empty "Unreleased" entry.

## release/2026-08-16T01-00-35Z — August 16, 2026

_A Release Notes page for the library ships, and the homepage's live demo now matches its static twin._

### ✨ New
- Added a Release Notes page showing the library's changelog history for each of its packages.

### 🐛 Fixes
- Fixed several visual mismatches in the homepage's live code demo so it now matches the static example it replaces, including formatting, colors, and alignment.

## release/2026-08-15T22-12-07Z — August 15, 2026

_About and Privacy pages, a sitewide footer, and the playground now speaks French too._

### ✨ New
- Added dedicated About and Privacy pages, along with a footer linking to them from every page on the site.
- The playground is now available in French as well as English, matching the rest of the site.

### 🙌 Improvements
- The standalone playground page now shares the same header and branding as the rest of the site.

### 🐛 Fixes
- Fixed a stray focus outline that appeared around the "Playground" heading when navigating to that page.
- Fixed the playground's length field, which could accept values longer than its stated 64-character limit.

## release/2026-08-15T09-50-18Z — August 15, 2026

_Two layout fixes: a page jump on collapse, and a homepage demo narrower than the rest of the page._

### 🐛 Fixes
- Fixed an occasional page jump when collapsing a code sample's expanded view.
- Fixed the homepage's live code example and install command being narrower than the rest of the page.

## release/2026-08-13T11-42-04Z — August 13, 2026

_Small layout fixes around scrollbars, on the 404 page and elsewhere._

### 🐛 Fixes
- Fixed a small layout shift where navigating between a page with a scrollbar and one without would nudge the content sideways.
- The "page not found" page no longer shows an unnecessary scrollbar, and its message now reads as a single caption beneath the illustration instead of being split above and below it.

## release/2026-08-13T09-31-22Z — August 13, 2026

_Consistency pass: the brand sits the same way everywhere, and external links behave predictably._

### 🙌 Improvements
- The JustDummies brand now appears in exactly the same position on every page, instead of shifting slightly depending on which page you're on.
- The GitHub link in the site header now opens in a new tab, so you don't lose your place on the site; the playground link still opens in the same tab.
- Clarified the wording in the playground's opening scene about what the example's setup step is hiding.

## release/2026-08-13T08-16-25Z — August 13, 2026

_The 404 page gets the JustDummies brand and a full-width illustration instead of a bare message._

### 🙌 Improvements
- The "page not found" pages now open with the JustDummies brand, so it's clear whose site you've landed on, instead of a bare "Page not found" message.
- The illustration on the "page not found" pages now fills the width of the page instead of appearing as a small thumbnail.
- The spacing between the JustDummies name and its tagline is now the same on every page, rather than varying between the homepage and the rest of the site.

### 🐛 Fixes
- A code example in the playground now reads `Any.Order()`, matching the naming style used throughout the rest of the walkthrough.

## release/2026-08-12T21-42-23Z — August 12, 2026

_A /version page shows what's actually live, and the 404 page gets its own illustration._

### ✨ New
- Added a /version page showing the site's current release, commit, and build time.
- Added a custom illustration to the "page not found" screen.

## release/2026-08-12T20-33-58Z — August 12, 2026

_Faster-loading icons, and a code toggle that can be closed again._

### 🙌 Improvements
- Reduced the size of the site's icon images significantly, making the page load faster.

### 🐛 Fixes
- Fixed the "show full file" toggle on a code example so it can be collapsed again after being expanded.

## release/2026-08-12T14-59-33Z — August 12, 2026

_A code example can now be expanded to its full generated file, and the French text reads more naturally._

### ✨ New
- Added an option to expand a code example and see the entire generated file instead of just an excerpt.

### 🙌 Improvements
- Rewrote the French text throughout the page in plainer, more natural language.

## release/2026-08-12T13-50-58Z — August 12, 2026

_Code examples get syntax highlighting and a panel showing the real test failure they produce._

### ✨ New
- Added syntax highlighting to code examples, coloring keywords, types, strings, and numbers.
- Added a panel under one code example showing the actual recorded test failure it produces.

### 🙌 Improvements
- Updated a figure to show both the before and after versions of a code change side by side.
- Reworked several section titles and passages of explanatory text for clarity.

### 🐛 Fixes
- Fixed a sideways scrollbar that appeared on some desktop screens.

## release/2026-08-12T11-43-07Z — August 12, 2026

_A wide layout and wording pass across the homepage, plus a code example that now actually compiles._

### 🙌 Improvements
- Placed each package's link next to its name for easier reference.
- Fixed a horizontal scrollbar that appeared on some screen widths.
- Fixed uneven spacing on the first screen so elements are evenly balanced.
- Updated the site's tagline.
- Simplified a code example into a single, cleaner block.
- Widened the text column so paragraphs no longer look cramped next to full-width headings.
- Rewrote two tutorial sections in plainer language, and reordered one so it reassures readers before showing a failing test.

### 🐛 Fixes
- Fixed a code example that referenced the wrong namespace and wouldn't compile.

## release/2026-08-12T10-05-28Z — August 12, 2026

_The first tutorial section rebuilds step by step, and several small interaction rough edges get smoothed out._

### 🙌 Improvements
- Reworked the first tutorial section to build up its code example one step at a time.
- Removed the numbered "Act" labels in favor of plainer navigation wording.
- Fixed section headings that were wrapping awkwardly, and made background shading consistent at every section break.
- Smoothed the scrolling animation triggered by the down-arrow button.
- The language menu now closes when you click elsewhere or press Escape.
- Grouped install instructions by tool rather than by package, so every command for a given tool appears together.

### 🐛 Fixes
- Fixed a few spots where markdown formatting symbols were showing up as literal text instead of being rendered properly.

## release/2026-08-12T08-54-47Z — August 12, 2026

_A language selector arrives, and the homepage's text is rewritten throughout in both languages._

### ✨ New
- Added a language selector so visitors can switch between English and French.

### 🙌 Improvements
- Rewrote the site's text throughout, in both English and French, for a clearer and more natural voice.
- Content now reveals itself in stages as you scroll instead of loading all at once, making the page feel noticeably shorter.

## release/2026-08-12T02-20-31Z — August 12, 2026

_The site's first public version: a bilingual homepage narrative, a live in-browser demo, and the library's own icon._

### ✨ New
- The site now exists in English and French, with equivalent content, metadata, and navigation in both languages.
- A homepage narrative in three acts walks through the library — declaring a constrained value, generating one automatically, and reproducing a failing test from its seed — using real generated output rather than hand-written examples.
- An interactive hero lets visitors run the library directly in their own browser and draw fresh values live, on demand.
- A copyable install command on the homepage.
- The site now has its own icon, shown consistently on the homepage and in the playground.

### 🙌 Improvements
- Reworked the first screen: it now opens as its own full-height scene, the code example spans the full width and visually transforms scene by scene as you scroll, and the install command moved behind tabs with a separate link out to NuGet.
- Trimmed a good portion of the narrative's prose and removed an internal "under construction" note that had been visible on the public page.

### 🐛 Fixes
- Fixed a layout bug that made the homepage scroll sideways on narrow phone screens.
- Fixed the live in-browser demo occasionally showing a stray scrollbar when the window was resized.
- Fixed the install command's tabs briefly appearing, non-functional, before the page's script finished loading.
