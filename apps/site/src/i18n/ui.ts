/**
 * Every string the site displays, in every locale.
 *
 * The specification requires that no component carry a hard-coded string (§7.6),
 * and that a key missing from a locale **fail the build** rather than fall back
 * silently to English (§28.4) — a silent fallback produces half-translated pages
 * that nobody notices.
 *
 * That guarantee is bought by the type annotation on `fr` below rather than by a
 * script. English is the source: its object defines the key set, and French is
 * declared as `Record<UiKey, string>`, so a missing key and an extra key are both
 * compile errors. `pnpm check` runs in CI, so the build is what fails.
 *
 * What belongs here is prose. Facts — package names, versions, install commands,
 * URLs — live in `site.ts` and are the same in every locale.
 */

export const locales = ['en', 'fr'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** The name of each locale, written in that locale. Never a flag: a flag names a country. */
export const localeNames: Record<Locale, string> = {
    en: 'English',
    fr: 'Français',
};

/** The BCP 47 tags used for `<html lang>`, `hreflang` and Open Graph. */
export const localeTags: Record<Locale, string> = {
    en: 'en',
    fr: 'fr',
};

/** The Open Graph locale identifiers, which use an underscore rather than a hyphen. */
export const openGraphLocales: Record<Locale, string> = {
    en: 'en_US',
    fr: 'fr_FR',
};

const en = {
    'brand.tagline': 'Just dummies — but seriously powerful ones.',
    'brand.subtitle': 'Focused, fluent test values for .NET.',

    'nav.why': 'Why JustDummies',
    'nav.playground': 'Playground',
    'nav.github': 'GitHub',
    'nav.nuget': 'NuGet',
    'nav.primary': 'Primary',

    'language.label': 'Language',
    'language.switch': 'Read this page in',

    'home.install.label': 'Install the package',
    'home.meta.description':
        'JustDummies produces arbitrary test values that satisfy the constraints you declare. Your tests then say what they are about, and nothing else.',

    /**
     * /version — what the deployment says about itself. The three labels name the three
     * fields of version.json, which the page reads at build time out of the same file the
     * site serves.
     */
    'version.heading': 'This build',
    'version.lead': 'The site is serving this build.',
    'version.release': 'Release',
    'version.commit': 'Commit',
    'version.built': 'Built',
    'version.commitLink': 'Read this commit on GitHub',
    'version.meta.description': 'The release, the commit and the build time of the site you are reading.',

    /**
     * ACT I — validity. The claim is that a value a test does not care about still has
     * to be valid, and that declaring what must be true is a different job from writing
     * a value down.
     */
    'act1.title': 'The value your test does not care about',
    'act1.summary': 'It still has to be valid.',

    'act1.test.title': 'Your test probably looks like this',
    'act1.test.body':
        'What is this test about? A pending order can be cancelled — but you have to go looking to see it. Three of its four arrangement lines build a reference, a customer and a total that the test never mentions again: the constructor demands them, that is all. And they lie: ORD-54XEM4545 and 42.00 read as values somebody chose, when any valid ones would have done. The subject of the test is the last argument of the line that builds the order.',

    'act1.factories.title': 'A first tidy-up',
    'act1.factories.body':
        'Better already: the factories say any, the variables say it too, and the arrangement is three lines that announce their intent. A good start — except nothing moved underneath. AnyOrderReference still returns the string it always did: the code announces any and hands you one, always the same one. The lie did not go away, it moved to another file.',

    'act1.careless.title': 'Making the factory tell the truth',
    'act1.careless.body':
        'The factory now calls the library: Any.String() draws a genuinely arbitrary string, different on every run. The name AnyOrderReference stops lying. Drawing at random is surprising, but a value you typed proves only one thing: that the test passes with that one. The domain refuses the string it drew. That string does not start with ORD-, and OrderReference.Create says so as the value is built, not three assertions later.',

    'act1.invariants.title': 'What the domain is asking for',
    'act1.invariants.body':
        'These rules are not exotic, and they are written where they belong. But every one of them has to be satisfied. It is the generator\'s job to satisfy them, without the test having to mention any of it.',

    'act1.constraints.title': 'Declare the constraints, not the value',
    'act1.constraints.body':
        'Every business rule becomes a call in the chain: not empty, twenty characters at most, starts with ORD-. The value it produces changes on every run, and it is valid every time. This is where drawing at random makes sense. That value was never the subject of the test, it only had to be valid. Any value that satisfies the rules will do. You describe what the value must satisfy, not what you are going to assert.',

    'act1.exit.title': 'Install it now',
    'act1.exit.body':
        'Everything above is the library on its own. If that is what you came for, install it now. Take the adapter with it: it makes your draws replayable, and the page comes back to that further down. What follows shows how all this setup disappears.',

    /**
     * ACT II — concision. The claim is that the arrangement can go away without the test
     * losing what it was about, and that the tool writes the part nobody wants to write.
     */
    'act2.title': 'Simpler still',
    'act2.summary': 'A tool reads your type and writes the generator. The file it produces is yours.',

    'act2.wanted.title': 'What we would like to write',
    'act2.wanted.body':
        'CreateAnyPendingOrder() replaces the three lines of arrangement, and the test says only what matters: the order is pending. You can write that helper yourself: it holds the chain of constraints you have just written, in a file of your own test project. The day Order gains a parameter, you are the one reopening that file. What follows is a tool that writes it, and rewrites it.',

    'act2.scaffold.title': 'The tool reads your type and writes the generator',
    'act2.scaffold.body':
        'dum is a global .NET tool. You run it once per type. It reads your own source and decides, parameter by parameter, how to draw a value. The last column says what it worked out on its own, and where it stopped.',

    'act2.link.title': 'Generated to help you, and yours to change',
    'act2.link.body':
        'The tool writes the whole file: the fields, the recipe, one With… per parameter, the draw. It cannot read the ORD- prefix rule, so it marked that parameter rather than guess at it. The file compiles, and it throws on every draw until you add the link. You add .StartingWith("ORD-") to the reference parameter, and that is the chain you already wrote, unchanged. The file is yours: read it, edit it, commit it.',

    'act2.concise.title': 'A test that is explicit at last, and does not lie',
    'act2.concise.body':
        'Same test as before, right down to the assertion. The arrangement is one line, and that line names the only thing the test needs: the order is pending. The rest is drawn on every run, and stays valid. Nothing here is called any while handing back the same value every time.',

    'act2.exit.title': 'Install all of it',
    'act2.exit.body':
        'The tool is optional. The library on its own already made all of this possible. The tool only saves you the writing.',

    /**
     * ACT III — reproducibility. The claim is that a drawn value can be got back exactly,
     * and the act says so before it shows anything failing (ADR-0007): the reader arrives
     * here with the question "what happens when one of these values breaks a test", and an
     * act that opens on a red answers it two scenes late.
     *
     * The promise is never widened: the seed replays the test case that reported it, and
     * that is what the page says and no more (§9.6).
     */
    'act3.hinge':
        'A question comes up here on its own: if the values change on every run, how do you get back the one that made a test fail?',

    'act3.title': 'A draw you can replay exactly',
    'act3.summary':
        'The values change on every run. The day one of them makes a test fail, you get that exact one back.',

    'act3.attribute.title': 'Catching a bug before it reaches production',
    'act3.attribute.body':
        'Your build goes red although nothing changed in the code. The value drawn that day found a case your code does not hold. That is a bug that would have shipped. The draw is not lost: the next two scenes get it back exactly, in one line.',

    'act3.forgotten.title': 'Take an example',
    'act3.forgotten.body':
        'This test is the same, but the status is left arbitrary. Two of the three statuses cannot be cancelled, so it goes red on roughly two runs in three. Nothing is broken. The test has just found out it was not saying what it needed.',

    'act3.seed.title': 'The failing test tells you how to replay it',
    'act3.seed.body':
        "The test that failed writes one line into your build's output. That line carries a number: the seed. That number is all it takes to draw exactly the same values again.",

    'act3.replay.title': 'Paste it, and you get the same draw back',
    'act3.replay.body':
        'You paste the seed your build reported into the test, and the failure comes back on your machine. These are the values that failed, not values that resemble them. Each test case draws its own seed, so a suite running in parallel hands you back the seed of the case that failed.',

    'act3.exit.title': 'Want to try it?',
    'act3.exit.lead': 'Three packages. None of them is large, and you have seen what each one does.',
    'act3.exit.body':
        'The adapter turns a red test into a draw you can replay. It is the smallest of the three packages. All three are here.',

    'hero.run': 'Run it here',
    'hero.loading': 'Loading the .NET runtime…',
    'hero.cost': 'about 1.2 MB, downloaded only if you ask',
    'hero.frameTitle': 'The JustDummies expression, running in your browser',
    /** The name of the chevron at the foot of the first screen. It is a link, so it needs one. */
    'hero.scrollCue': 'Find out more',

    'sample.produced': 'produced',
    'sample.producedEachRun': 'produced, run after run',
    'sample.refused': 'refused',
    'sample.whenItRuns': 'what the build got when it ran it',
    /** The fold on a figure too tall for a scene. The count is appended by the script. */
    'sample.showWholeFile': 'Show the whole file',
    'sample.fold': 'Fold',
    'sample.lines': 'lines',

    'install.library': 'The library',
    'install.cli': '.NET CLI',
    'install.packageManager': 'Package Manager',
    'install.tool': 'The scaffolding tool',
    'install.adapter': 'The xUnit adapter',
    'install.nuget': 'View on NuGet',
    'install.copy': 'Copy',
    'install.copyCommand': 'Copy this command',
    'install.copied': 'Copied',
    'install.copyFailed': 'Could not copy. Select the command and copy it manually.',
    /** Said where a Package Manager panel cannot offer a command, because none exists. */
    'install.toolIsCliOnly': 'A global .NET tool is installed from the command line.',

    /**
     * Said in hidden text on the one link that leaves the site. A link that replaces the
     * window without warning is disorienting for anyone and unrecoverable for a reader
     * whose only way back was the button that no longer goes anywhere.
     */
    'state.newTab': 'opens in a new tab',

    'notfound.title': 'Page not found',
    'notfound.body': 'Oops — this page is gone, or never existed.',
    'notfound.home': 'Click here to return to the home page.',

    /**
     * /about — why the library exists, and who built it.
     */
    'about.heading': 'About',
    'about.meta.description': 'Why JustDummies exists, and who built it.',
    'about.origin':
        "After twenty-five years of writing code, the way I write tests has changed a lot — and along the way, one need kept coming back: generating test values that respect the domain's rules, without wasting time on parameters that don't matter to the test at hand. No existing library matched that approach, so I kept rewriting the same helpers on every new project. After doing it one too many times, I got tired of it and decided to write a library that solved the problem for good — hoping it might be useful to other developers too.",
    'about.philosophy':
        "My name is Sylvain Aurat, I'm a .NET engineer, and Reefact is the name of my company. Domain-Driven Design and software craftsmanship have shaped the way I design code. To me, a domain object shouldn't be able to exist in an invalid state — it's not up to whoever uses it to be careful, it's up to the object to protect itself. JustDummies applies that same requirement to test data: a generated value has to be just as valid as a real one, never a shortcut you hope stays harmless.",
    'about.linksIntro':
        'The code is public, and the package is on NuGet. A question, a bug? The relevant repository is right below.',
    'about.links.library': 'JustDummies library',
    'about.links.site': 'This site',
    'about.links.nuget': 'NuGet package',

    /**
     * /privacy — what this site measures about a visitor, and what it doesn't. Each
     * section is a `.label`/`.body` pair rather than one key: no key here ever carries
     * markup, so the bold lead phrase becomes a heading in the component instead of an
     * inline `**...**` that would render literally.
     */
    'privacy.heading': 'Privacy',
    'privacy.meta.description': "What this site measures about you, and what it doesn't.",
    'privacy.tracking.label': "This site doesn't track you.",
    'privacy.tracking.body':
        "It doesn't need to know who you are to work. There's no account to create, no tracking cookie, and nothing we measure is ever sold or shared with anyone.",
    'privacy.analytics.label': 'Audience measurement.',
    'privacy.analytics.body':
        "We use Cloudflare Web Analytics to know how many people visit the site and whether pages load quickly. This tool sets no cookie and doesn't identify anyone individually — it counts visits and load times, not people. No finer-grained measurement — knowing which button you clicked, for instance — is active today.",
    'privacy.playground.label': 'The playground.',
    'privacy.playground.body':
        "The playground, which runs the library, works entirely inside your browser. Nothing you type there is ever sent to a server — there's no server to send it to.",
    'privacy.hosting.label': 'What the host sees.',
    'privacy.hosting.body':
        "The site is hosted on Cloudflare, which necessarily receives every request in order to serve it — your IP address and the pages requested, for instance. That's an unavoidable part of any web hosting, not a measurement we add; Cloudflare is our only subprocessor, for hosting as well as audience measurement.",
    'privacy.controller.label': "Who's responsible for this site.",
    'privacy.controller.body':
        "It's published by REEFACT, a single-member SARL registered under SIREN number 804 026 482, headquartered at 134 rue de Chevilly, 94240 L'Haÿ-les-Roses, France, represented by its manager Sylvain Aurat.",
    'privacy.rights.label': 'Your rights.',
    'privacy.rights.body':
        "Since this site doesn't collect any data that identifies you individually, there's in practice nothing to correct or delete about you. For any question on this, write to privacy@reefact.net.",
    'privacy.updated': 'Last updated: August 15, 2026.',

    /**
     * /api — the public surface of the JustDummies and JustDummies.Xunit packages, reflected
     * from the published NuGet packages rather than written by hand (`apiCatalogue.ts`).
     *
     * The catalogue's own prose — every signature, every doc comment `apiCatalogue.ts` reads —
     * stays in English in both locales: it comes from a package published outside this
     * repository and reflects that package's own English identifiers, the same reasoning
     * `about.origin`'s neighbour, the DummyException note, already applies to exception
     * messages. Only the chrome around it — headings, labels, this whole block — is translated.
     */
    'api.meta.description': 'The public surface of JustDummies and JustDummies.Xunit: every generator, every constraint, reflected from the published packages.',
    'api.english.note':
        "The signatures and doc comments below stay in English on every page, in every locale: they are read off the published packages themselves, not written for this site.",

    'api.nav.heading': 'Sections',
    'api.nav.overview': 'Overview',
    'api.nav.entryPoint': 'Entry point',
    'api.nav.primitives': 'Primitive generators',
    'api.nav.uris': 'URIs',
    'api.nav.collections': 'Collections',
    'api.nav.composition': 'Composition',
    'api.nav.reproducibility': 'Seeds & reproducibility',
    'api.nav.exceptions': 'Exceptions',
    'api.nav.toggle': 'API sections',

    'api.search.label': 'Search the API catalogue',
    'api.search.placeholder': 'Search a member…',
    'api.search.empty': 'No member matches.',

    'api.index.heading': 'API',
    'api.index.lede':
        'A coherent API with no magic at runtime: one entry point, generators that compose through fluent methods, and a value produced only on the final call.',

    'api.entryPoint.heading': 'Entry point',
    'api.entryPoint.lede':
        "One door in, and the contract every generator it produces satisfies — from the simplest primitive to a generator composed of several.",
    'api.primitives.heading': 'Primitive generators',
    'api.primitives.lede': 'The basic generators: one fluent constraint at a time, and nothing drawn until Generate is called.',
    'api.uris.heading': 'URIs',
    'api.uris.lede': 'Every URI family the library can draw, each narrowed to only the components that family actually has.',
    'api.collections.heading': 'Collections',
    'api.collections.lede': 'Arrays, lists, sequences, sets and dictionaries, each built over a generator for its elements.',
    'api.composition.heading': 'Composition',
    'api.composition.lede': 'Turning several generators into one — through a factory, a tuple, a closed set of choices, or an optional value.',
    'api.reproducibility.heading': 'Seeds & reproducibility',
    'api.reproducibility.lede':
        'What makes a failure on an arbitrary value replayable exactly, instead of a mystery that looks different on every run.',
    'api.exceptions.heading': 'Exceptions',
    'api.exceptions.lede': 'The family the library throws on its own behalf, and which member appears for which kind of refusal.',

    'api.field.extends': 'Extends',
    'api.field.implements': 'Implements',
    'api.field.entryPoint': 'Constructed via',
    'api.field.properties': 'Properties',
    'api.field.constructors': 'Constructors',
    'api.field.methods': 'Methods',

    'api.pagination.previous': 'Previous section',
    'api.pagination.next': 'Next section',
    'api.pagination.overview': 'Overview',

    'api.seeAlso.heading': 'See also',
    'api.seeAlso.playground': 'Playground — try it live',

    /**
     * /why-justdummies — the comparative positioning page (§11). Axis labels and rating
     * words are deliberately short: they are table headers and cells, read many times
     * down a column, not sentences.
     */
    'why.heading': 'Why JustDummies',
    'why.meta.description':
        'How JustDummies compares with Bogus, AutoFixture, and writing values by hand — including where it loses.',
    'why.intro.p1':
        'JustDummies asks for no migration. It works on a single test, coexists with whatever you already use in the same codebase, and asks you to remove nothing to try it.',
    'why.intro.p2':
        'For most of what a dummy-data library replaces, the real alternative is not another library — it is a value typed by hand. The comparison below treats that as a genuine option, not an oversight.',

    'why.axis.invariants': 'Business invariants',
    'why.axis.callSite': 'Constraints at the call site',
    'why.axis.testIntent': 'What the test is about',
    'why.axis.reuse': 'Reuse across tests',
    'why.axis.realism': 'Realistic data',
    'why.axis.graph': 'A complete object graph',
    'why.axis.reproducibility': 'Reproducibility',
    'why.axis.compileTime': 'Compile-time detection',
    'why.axis.codeGen': 'Code generation',
    'why.axis.exploration': 'Exploring the input space',

    'why.rating.core': 'Core',
    'why.rating.possible': 'Possible',
    'why.rating.outOfScope': 'Out of scope',

    'why.table.caption': 'JustDummies compared across ten axes.',
    'why.table.axisHeader': 'Axis',

    'why.duel.label': 'Compare JustDummies with',
    'why.duel.showMatrix': 'Show the full comparison',
    'why.duel.showDuel': 'Back to one-on-one',

    'why.library.repoLink': 'View the repository',
    'why.library.chooseHeading': 'Choose it instead when',

    'why.bogus.description':
        'A simple fake data generator for C#, F#, and VB.NET — ported from the well-known faker.js.',
    'why.bogus.chooseInstead':
        "Reach for Bogus when a test, a demo, or a seeded database needs data that looks real — names, addresses, emails — rather than data that merely satisfies a domain rule. That is Bogus's actual subject, and JustDummies does not compete with it there.",

    'why.autofixture.description':
        "A library that removes the need to hand-code anonymous variables when setting up a test's fixture — any object of the right shape, with no configuration.",
    'why.autofixture.chooseInstead':
        "Reach for AutoFixture when a test truly does not care what is inside an object — any value, anywhere in the graph, will do — and you want the whole graph populated automatically, including types you don't own. JustDummies asks you to say what must be true first; a test with nothing to say there has nothing to gain from it.",

    'why.manual.name': 'Writing values by hand',
    'why.manual.description': "No library: the value a test needs, typed directly into its arrangement.",
    'why.manual.chooseInstead':
        "Write a plain literal for the one value a test is actually about — the thing its assertion checks. A reader sees the exact number; a generated one would only ask them to trust that it is valid. JustDummies is for every parameter around it, the ones the test does not care about.",

    'why.note.justdummies.reuse':
        'A generator becomes reusable once it is written — by hand, or scaffolded once by the dum tool — not automatically from a single call.',
    'why.note.justdummies.realism':
        'Values are arbitrary, not realistic-looking — a name generator is not what this library is for.',
    'why.note.justdummies.graph':
        'A full graph is built by composing one generator per type; nothing walks the graph for you.',
    'why.note.justdummies.compileTime':
        'The analyzers bundled in the main package catch a chain of constraints that admits no value — a contradiction — at compile time. A missing constraint is a different defect: it still only throws once a value is drawn.',
    'why.note.justdummies.exploration':
        'One arbitrary, reproducible value is drawn per run, not a systematic search of the input space.',

    'why.note.bogus.invariants':
        "Only if every RuleFor() is written by hand to match the domain's rules — nothing checks that it does.",
    'why.note.bogus.callSite':
        'A RuleFor() — including a bounded generator like Random.Int(min, max) — can sit on a Faker<T> built inline, right before Generate(), at the cost of writing it by hand each time.',
    'why.note.bogus.testIntent':
        'Only for a RuleFor(x => x.Prop, expected) that pins the exact value an assertion checks — the same scope credited to the AutoFixture override and the manual literal below.',
    'why.note.bogus.reuse': 'A Faker<T> can be defined once and reused across tests, the same way a JustDummies generator can.',
    'why.note.bogus.graph': 'Nested objects are composed by hand inside the rules, not built automatically.',
    'why.note.bogus.compileTime':
        "Bogus Premium's analyzer flags a missing RuleFor() at build time — a paid add-on, not part of the free package.",
    'why.note.bogus.codeGen': 'The same Premium analyzer can insert a missing RuleFor() as a code fix.',

    'why.note.autofixture.invariants':
        "Generation throws until a Customization or an ISpecimenBuilder is written to satisfy the constructor's guard clauses.",
    'why.note.autofixture.callSite':
        'Only through Build<T>().With(x => x.Prop, value) — pinning an exact value or a hand-written generator lambda inline, not a declarative business constraint.',
    'why.note.autofixture.testIntent':
        'Only for a Build<T>().With(x => x.Prop, expected) that names the value an assertion actually checks — the same scope the manual literal above is credited for.',
    'why.note.autofixture.reuse': 'An ICustomization packages a set of rules once, for reuse across tests.',

    'why.note.manual.invariants':
        'Valid only because a person chose a value they knew to be valid — nothing checks that it stayed that way.',
    'why.note.manual.testIntent':
        'Only for the one value the test is actually about; used for the parameters around it too, it becomes exactly the boilerplate Act I opens on.',
    'why.note.manual.reuse':
        'A literal can be pulled into a named constant or a helper and reused across tests — at the cost of maintaining it by hand, and of every test that reuses it losing whatever variation a generator would have given it.',
    'why.note.manual.realism': 'As realistic as whoever is typing bothers to make it, by hand, every time.',
    'why.note.manual.graph': "Every nested object is constructed by hand — the arrangement Act I opens on.",
    'why.note.manual.compileTime':
        'The compiler accepts any value of the right type — an overlong string, say — and only the domain constructor catches it, at run time.',

    'why.notFor.heading': 'When not to use JustDummies',
    'why.notFor.body':
        "Not when a test needs data that looks real rather than data that is merely valid — reach for a fake-data generator instead. Not when a type carries no domain invariant worth declaring — a plain anonymous-object library does that with less ceremony. And every package is still pre-release: an API that is still moving is a cost worth knowing about before it sits under a large test suite.",

    /** The date itself is never typed here — it comes from `comparison.ts`'s `comparisonVerifiedOn`, formatted per locale, so the two cannot disagree. */
    'why.verified.label': 'Comparisons last verified:',
    'why.report.label': 'Spotted something inaccurate about a library listed here? Open an issue.',

    /**
     * /release-notes — a snapshot of the library's own CHANGELOG.md files, one train at
     * a time. `releaseNotes.category.*` translates the `### Category` headings those
     * files use, which are always written in English regardless of the reader's locale.
     */
    'releaseNotes.heading': 'Release notes',
    'releaseNotes.lead': 'What shipped in the library, and why — read from its own changelog, one package at a time.',
    'releaseNotes.meta.description': "What changed in JustDummies, release by release, across every package it publishes.",
    'releaseNotes.snapshotLabel': 'Snapshot taken',
    'releaseNotes.viewSource': 'Read the changelog this came from',

    'releaseNotes.train.lib': 'Core library',
    'releaseNotes.train.xunit': 'xUnit adapter',
    'releaseNotes.train.catalog': 'Diagnostic catalog',
    'releaseNotes.train.cli': 'CLI — dum',

    'releaseNotes.viewOnGithub': 'View on GitHub',
    'releaseNotes.more': 'more',

    'releaseNotes.category.added': 'Added',
    'releaseNotes.category.changed': 'Changed',
    'releaseNotes.category.fixed': 'Fixed',
    'releaseNotes.category.deprecated': 'Deprecated',
    'releaseNotes.category.removed': 'Removed',
    'releaseNotes.category.security': 'Security',
    'releaseNotes.category.documentation': 'Documentation',
    'releaseNotes.category.notes': 'Notes',
    'releaseNotes.category.requires': 'Requires',
    'releaseNotes.category.refusedOnPurpose': 'Refused, on purpose',

    /** The sitewide footer. */
    'footer.nav': 'Footer',
    'footer.about': 'About',
    'footer.privacy': 'Privacy',
    'footer.api': 'API',
    'footer.releaseNotes': 'Release notes',
    'footer.repository': 'Source code',
} as const;

/**
 * The key set. Derived from English rather than declared separately, so the two can
 * never disagree about what a key is.
 */
export type UiKey = keyof typeof en;

const fr: Record<UiKey, string> = {
    'brand.tagline': 'Juste des dummies, mais redoutablement efficaces.',
    'brand.subtitle': 'Des valeurs de test fluides et ciblées, pour .NET.',

    'nav.why': 'Pourquoi JustDummies',
    'nav.playground': 'Playground',
    'nav.github': 'GitHub',
    'nav.nuget': 'NuGet',
    'nav.primary': 'Principale',

    'language.label': 'Langue',
    'language.switch': 'Lire cette page en',

    'home.install.label': 'Installer le package',
    'home.meta.description':
        "JustDummies produit des valeurs de test arbitraires qui respectent les contraintes que vous déclarez. Vos tests ne disent plus que ce dont ils parlent.",

    'version.heading': 'Ce build',
    'version.lead': 'Le site sert ce build.',
    'version.release': 'Release',
    'version.commit': 'Commit',
    'version.built': 'Construit le',
    'version.commitLink': 'Lire ce commit sur GitHub',
    'version.meta.description': 'La release, le commit et la date de construction du site que vous lisez.',

    'act1.title': 'La valeur dont votre test se moque',
    'act1.summary': 'Elle doit quand même être valide.',

    'act1.test.title': 'En général, votre test ressemble à ça',
    'act1.test.body':
        "De quoi parle ce test ? Une commande en attente peut être annulée — mais il faut chercher pour le voir. Trois de ses quatre lignes d'arrange construisent une référence, un client et un total dont le test ne reparlera jamais : le constructeur les exige, c'est tout. Et elles mentent : ORD-54XEM4545 et 42.00 se lisent comme des valeurs choisies, alors que n'importe lesquelles auraient fait l'affaire, pourvu qu'elles soient valides. Le sujet du test, lui, est le dernier argument de la ligne qui construit la commande.",

    'act1.factories.title': 'Un premier nettoyage',
    'act1.factories.body':
        "C'est déjà mieux : les factories disent « any », les variables aussi, et l'arrange tient sur trois lignes qui annoncent leur intention. Un bon début — sauf que rien n'a bougé en dessous. AnyOrderReference renvoie toujours la même chaîne qu'avant : le code annonce « n'importe laquelle » et en donne une seule, toujours la même. Le mensonge n'a pas disparu, il a changé de fichier.",

    'act1.careless.title': 'Faire dire vrai à la factory',
    'act1.careless.body':
        "La factory appelle maintenant la bibliothèque : Any.String() tire une chaîne vraiment quelconque, différente à chaque exécution. Le nom AnyOrderReference ne ment plus. Tirer au hasard surprend, mais une valeur tapée à la main ne prouve qu'une chose : que le test passe avec celle-là. Le domaine, lui, refuse la chaîne tirée. Elle ne commence pas par ORD-, et OrderReference.Create le dit dès la construction, pas trois assertions plus loin.",

    'act1.invariants.title': 'Ce que le domaine réclame',
    'act1.invariants.body':
        "Ces règles n'ont rien d'exotique, et elles sont écrites au bon endroit. Mais chacune doit être respectée. C'est donc au générateur de s'y conformer, sans que le test ait à en parler.",

    'act1.constraints.title': 'Déclarez les contraintes, pas la valeur',
    'act1.constraints.body':
        "Chaque règle métier devient un appel dans la chaîne : non vide, vingt caractères au plus, commence par ORD-. La valeur produite change à chaque exécution, et elle est valide à chaque fois. Le hasard prend son sens ici. Cette valeur n'a jamais été le sujet du test, elle devait seulement être valide. N'importe laquelle qui respecte les règles fait donc l'affaire. Vous décrivez ce que la valeur doit respecter, pas ce que vous allez vérifier.",

    'act1.exit.title': 'Installez-la maintenant',
    'act1.exit.body':
        "Tout ce qui précède, c'est la bibliothèque seule. Si c'est ce que vous cherchiez, installez-la maintenant. Prenez l'adaptateur xUnit avec : il rend vos tirages rejouables, et la page y revient plus bas. La suite montre comment faire disparaître toute cette préparation.",

    'act2.title': 'Simplifions encore',
    'act2.summary': 'Un outil lit votre type et écrit le générateur. Le fichier produit est le vôtre.',

    'act2.wanted.title': 'Ce qu\'on aimerait écrire',
    'act2.wanted.body':
        "CreateAnyPendingOrder() remplace les trois lignes d'arrange, et le test ne dit plus que l'essentiel : la commande est en attente. Ce helper, vous pouvez l'écrire vous-même : il contient la chaîne de contraintes que vous venez d'écrire, dans un fichier de votre projet de test. Le jour où Order gagne un paramètre, c'est vous qui rouvrez ce fichier. La suite montre un outil qui l'écrit, et qui le réécrit.",

    'act2.scaffold.title': 'L\'outil lit votre type et écrit le générateur',
    'act2.scaffold.body':
        "dum est un outil .NET global. Vous le lancez une fois par type. Il lit vos propres sources et décide, paramètre par paramètre, comment tirer une valeur. La dernière colonne dit ce qu'il a trouvé seul, et où il s'est arrêté.",

    'act2.link.title': 'Généré pour vous aider, vous gardez la main',
    'act2.link.body':
        "L'outil écrit tout le fichier : les champs, la recette, un With… par paramètre, le tirage. Il ne sait pas lire la règle du préfixe ORD-, alors il la signale au lieu de l'inventer. Le fichier compile, et il échoue à chaque tirage tant que le maillon manque. Vous ajoutez .StartingWith(\"ORD-\") sur le paramètre reference : c'est la chaîne que vous avez déjà écrite, inchangée. Le fichier vous appartient : vous le lisez, vous le modifiez, vous le commitez.",

    'act2.concise.title': 'Un test enfin explicite, et qui ne ment pas',
    'act2.concise.body':
        "Le même test qu'avant, jusqu'à l'assertion comprise. La préparation tient sur une ligne, et cette ligne nomme la seule chose dont le test a besoin : la commande est en attente. Le reste est tiré à chaque exécution, et reste valide. Plus rien ici ne s'appelle « any » en rendant toujours la même valeur.",

    'act2.exit.title': 'Installer tout ça',
    'act2.exit.body':
        "L'outil est facultatif. La bibliothèque seule rendait déjà tout cela possible. L'outil vous épargne seulement de l'écrire.",

    'act3.hinge':
        'Une question se pose forcément ici : si les valeurs changent à chaque exécution, comment revenir sur celle qui a fait échouer un test ?',

    'act3.title': "Un tirage qui se rejoue à l'identique",
    'act3.summary':
        "Les valeurs changent à chaque exécution. Le jour où l'une d'elles fait échouer un test, vous récupérez exactement celle-là.",

    'act3.attribute.title': "Attraper un bug avant qu'il n'arrive en production",
    'act3.attribute.body':
        "Votre build passe au rouge alors que rien n'a changé dans le code. La valeur tirée ce jour-là a trouvé un cas que votre code ne tient pas. C'est un bug qui serait parti en production. Ce tirage n'est pas perdu : les deux étapes qui suivent le récupèrent à l'identique, en une ligne.",

    'act3.forgotten.title': 'Prenons un exemple',
    'act3.forgotten.body':
        "Ce test est le même, mais le statut reste arbitraire. Deux des trois statuts ne s'annulent pas, donc il passe au rouge environ deux fois sur trois. Rien n'est cassé. Le test vient de découvrir qu'il ne disait pas ce dont il avait besoin.",

    'act3.seed.title': 'Le test qui échoue vous dit comment le rejouer',
    'act3.seed.body':
        "Le test qui a échoué écrit une ligne dans la sortie de votre build. Cette ligne porte un numéro : le seed. Ce numéro suffit à retirer exactement les mêmes valeurs.",

    'act3.replay.title': 'Collez-le, et vous retrouvez le même tirage',
    'act3.replay.body':
        "Vous collez dans le test le seed rapporté par votre build, et l'échec revient sur votre machine. Ce sont les valeurs qui ont échoué, pas des valeurs qui leur ressemblent. Chaque cas de test tire son propre seed, donc une suite qui tourne en parallèle vous rend le seed du cas qui a échoué.",

    'act3.exit.title': 'Envie d\'essayer ?',
    'act3.exit.lead': "Trois packages. Aucun n'est gros, et vous avez vu ce que chacun fait.",
    'act3.exit.body':
        "L'adaptateur transforme un test rouge en un tirage que vous rejouez. C'est le plus petit des trois packages. Les trois sont ici.",

    'hero.run': 'Exécuter ici',
    'hero.loading': 'Chargement du runtime .NET…',
    'hero.cost': "environ 1,2 Mo, téléchargés seulement si vous le demandez",
    'hero.frameTitle': "L'expression JustDummies, exécutée dans votre navigateur",
    'hero.scrollCue': 'En savoir plus',

    'sample.produced': 'produit',
    'sample.producedEachRun': 'produit, exécution après exécution',
    'sample.refused': 'refusé',
    'sample.whenItRuns': "ce que le build a obtenu en l'exécutant",
    'sample.showWholeFile': 'Afficher tout le fichier',
    'sample.fold': 'Réduire',
    'sample.lines': 'lignes',

    'install.library': 'La bibliothèque',
    'install.cli': 'CLI .NET',
    'install.packageManager': 'Console du gestionnaire de packages',
    'install.tool': "L'outil de scaffolding",
    'install.adapter': "L'adaptateur xUnit",
    'install.nuget': 'Voir sur NuGet',
    'install.copy': 'Copier',
    'install.copyCommand': 'Copier cette commande',
    'install.copied': 'Copié',
    'install.copyFailed': 'Copie impossible. Sélectionnez la commande et copiez-la à la main.',
    'install.toolIsCliOnly': "Un outil .NET global s'installe en ligne de commande.",

    'state.newTab': 'ouvre un nouvel onglet',

    'notfound.title': 'Page introuvable',
    'notfound.body': "Oups — cette page a disparu, ou n'a jamais existé.",
    'notfound.home': "Cliquez ici pour retourner à la page d'accueil.",

    'about.heading': 'À propos',
    'about.meta.description': "Pourquoi JustDummies existe, et qui l'a créé.",
    'about.origin':
        "Après vingt-cinq ans à écrire du code, ma façon de tester a beaucoup évolué — et avec elle, un besoin précis a fini par s'imposer : pouvoir générer des valeurs de test qui respectent les règles du domaine, sans perdre de temps sur des paramètres qui n'ont aucune importance pour le test. Les bibliothèques existantes ne correspondaient pas à cette façon de faire, alors je recodais les mêmes « helpers » à chaque nouvelle mission. À force de recommencer, je m'en suis lassé, et j'ai décidé d'écrire une bibliothèque qui règle le problème une bonne fois pour toutes — en espérant qu'elle serve aussi à d'autres développeurs.",
    'about.philosophy':
        "Je m'appelle Sylvain Aurat, ingénieur .NET, et Reefact est le nom de ma société. Le Domain-Driven Design et le software craftsmanship ont façonné ma façon de concevoir le code. Pour moi, un objet métier ne devrait pas pouvoir exister dans un état invalide — ce n'est pas à celui qui l'utilise de faire attention, c'est à l'objet de se protéger lui-même. JustDummies applique cette même exigence aux données de test : une valeur générée doit être aussi valide qu'une valeur réelle, jamais un raccourci qu'on espère inoffensif.",
    'about.linksIntro':
        'Le code est public, et le paquet est sur NuGet. Une question, un bug ? Le dépôt concerné est juste en dessous.',
    'about.links.library': 'Bibliothèque JustDummies',
    'about.links.site': 'Ce site',
    'about.links.nuget': 'Paquet NuGet',

    'privacy.heading': 'Confidentialité',
    'privacy.meta.description': "Ce que ce site mesure à votre sujet, et ce qu'il ne mesure pas.",
    'privacy.tracking.label': 'Ce site ne vous suit pas.',
    'privacy.tracking.body':
        "Il n'a pas besoin de savoir qui vous êtes pour fonctionner. Il n'y a pas de compte à créer, pas de cookie de suivi, et rien de ce que nous mesurons n'est revendu ni partagé avec qui que ce soit.",
    'privacy.analytics.label': "Mesure d'audience.",
    'privacy.analytics.body':
        "Nous utilisons Cloudflare Web Analytics pour savoir combien de personnes visitent le site et si les pages se chargent rapidement. Cet outil ne dépose aucun cookie et n'identifie personne individuellement : il compte des visites et des temps de chargement, pas des personnes. Aucune mesure plus fine — savoir quel bouton précis vous avez cliqué, par exemple — n'est activée aujourd'hui.",
    'privacy.playground.label': 'Le playground.',
    'privacy.playground.body':
        "Le playground, qui exécute la bibliothèque, tourne entièrement dans votre navigateur. Ce que vous y saisissez n'est jamais envoyé à un serveur — il n'y a d'ailleurs aucun serveur à qui l'envoyer.",
    'privacy.hosting.label': "Ce que l'hébergeur voit.",
    'privacy.hosting.body':
        "Le site est hébergé chez Cloudflare, qui reçoit nécessairement chaque requête pour la servir — votre adresse IP et les pages demandées, par exemple. C'est un passage obligé de tout hébergement web, pas une mesure que nous ajoutons ; Cloudflare est notre unique sous-traitant, pour l'hébergement comme pour la mesure d'audience.",
    'privacy.controller.label': 'Qui est responsable de ce site.',
    'privacy.controller.body':
        "Il est édité par REEFACT, SARL unipersonnelle immatriculée sous le numéro SIREN 804 026 482, dont le siège est situé 134 rue de Chevilly, 94240 L'Haÿ-les-Roses, représentée par son gérant Sylvain Aurat.",
    'privacy.rights.label': 'Vos droits.',
    'privacy.rights.body':
        "Comme ce site ne collecte aucune donnée qui vous identifie individuellement, il n'y a en pratique rien à corriger ou à effacer vous concernant. Pour toute question sur ce point, écrivez à privacy@reefact.net.",
    'privacy.updated': 'Dernière mise à jour : 15 août 2026.',

    'api.meta.description': "La surface publique de JustDummies et JustDummies.Xunit : chaque générateur, chaque contrainte, reflétés depuis les paquets publiés.",
    'api.english.note':
        "Les signatures et les commentaires de documentation ci-dessous restent en anglais sur toutes les pages, dans toutes les locales : ils sont lus directement dans les paquets publiés, et non écrits pour ce site.",

    'api.nav.heading': 'Sections',
    'api.nav.overview': 'Aperçu',
    'api.nav.entryPoint': "Point d'entrée",
    'api.nav.primitives': 'Générateurs de primitives',
    'api.nav.uris': 'URI',
    'api.nav.collections': 'Collections',
    'api.nav.composition': 'Composition',
    'api.nav.reproducibility': 'Graines et reproductibilité',
    'api.nav.exceptions': 'Exceptions',
    'api.nav.toggle': "Sections de l'API",

    'api.search.label': "Chercher dans le catalogue de l'API",
    'api.search.placeholder': 'Chercher un membre…',
    'api.search.empty': 'Aucun membre ne correspond.',

    'api.index.heading': 'API',
    'api.index.lede':
        "Une API cohérente et sans magie à l'exécution : un point d'entrée, des générateurs qui se composent par méthode fluide, et une valeur produite seulement au dernier appel.",

    'api.entryPoint.heading': "Point d'entrée",
    'api.entryPoint.lede':
        "Une seule porte d'entrée, et le contrat que respecte tout ce qu'elle produit — du générateur le plus simple au plus composé.",
    'api.primitives.heading': 'Générateurs de primitives',
    'api.primitives.lede': "Les générateurs de base : une contrainte fluide à la fois, et rien n'est tiré avant l'appel à Generate.",
    'api.uris.heading': 'URI',
    'api.uris.lede': "Toutes les familles d'URI que la bibliothèque sait tirer, chacune réduite aux seuls composants que cette famille possède réellement.",
    'api.collections.heading': 'Collections',
    'api.collections.lede': 'Tableaux, listes, séquences, ensembles et dictionnaires, chacun construit sur un générateur pour ses éléments.',
    'api.composition.heading': 'Composition',
    'api.composition.lede': 'Transformer plusieurs générateurs en un seul — par une fabrique, un tuple, un ensemble de choix fermé, ou une valeur optionnelle.',
    'api.reproducibility.heading': 'Graines et reproductibilité',
    'api.reproducibility.lede':
        "Ce qui rend un échec sur une valeur arbitraire exactement rejouable, plutôt qu'un mystère qui change d'apparence à chaque exécution.",
    'api.exceptions.heading': 'Exceptions',
    'api.exceptions.lede': "La famille que la bibliothèque lève elle-même, et quel membre apparaît pour quelle nature de refus.",

    'api.field.extends': 'Hérite de',
    'api.field.implements': 'Implémente',
    'api.field.entryPoint': 'Construit via',
    'api.field.properties': 'Propriétés',
    'api.field.constructors': 'Constructeurs',
    'api.field.methods': 'Méthodes',

    'api.pagination.previous': 'Section précédente',
    'api.pagination.next': 'Section suivante',
    'api.pagination.overview': 'Aperçu',

    'api.seeAlso.heading': 'Voir aussi',
    'api.seeAlso.playground': 'Playground — essayer en direct',

    'why.heading': 'Pourquoi JustDummies',
    'why.meta.description':
        "Comment JustDummies se compare à Bogus, AutoFixture et l'écriture à la main — y compris là où il perd.",
    'why.intro.p1':
        "JustDummies ne demande aucune migration. Il s'installe sur un seul test, coexiste avec ce que vous utilisez déjà dans la même base de code, et ne vous demande de retirer rien pour l'essayer.",
    'why.intro.p2':
        "Pour la plupart de ce qu'une bibliothèque de données de test remplace, le vrai concurrent n'est pas une autre bibliothèque — c'est une valeur tapée à la main. Le comparatif ci-dessous la traite comme une option à part entière, pas comme un oubli.",

    'why.axis.invariants': 'Invariants métier',
    'why.axis.callSite': "Contraintes au point d'appel",
    'why.axis.testIntent': 'Ce que le test décrit',
    'why.axis.reuse': 'Réutilisation entre tests',
    'why.axis.realism': 'Données réalistes',
    'why.axis.graph': "Un graphe d'objets complet",
    'why.axis.reproducibility': 'Reproductibilité',
    'why.axis.compileTime': 'Détection à la compilation',
    'why.axis.codeGen': 'Génération de code',
    'why.axis.exploration': "Exploration de l'espace d'entrée",

    'why.rating.core': 'Cœur de métier',
    'why.rating.possible': 'Possible',
    'why.rating.outOfScope': 'Hors périmètre',

    'why.table.caption': 'JustDummies comparé sur dix axes.',
    'why.table.axisHeader': 'Axe',

    'why.duel.label': 'Comparer JustDummies à',
    'why.duel.showMatrix': 'Afficher le comparatif complet',
    'why.duel.showDuel': 'Revenir au duel',

    'why.library.repoLink': 'Voir le dépôt',
    'why.library.chooseHeading': 'À choisir à la place quand',

    'why.bogus.description':
        "Un générateur de fausses données simple, pour C#, F# et VB.NET — porté du célèbre faker.js.",
    'why.bogus.chooseInstead':
        "Choisissez Bogus quand un test, une démo ou une base de données de démonstration a besoin de données qui ressemblent à du réel — noms, adresses, e-mails — plutôt que de données qui respectent seulement une règle métier. C'est le vrai sujet de Bogus, et JustDummies ne s'y mesure pas.",

    'why.autofixture.description':
        "Une bibliothèque qui évite d'écrire à la main des variables anonymes pour préparer un test — n'importe quel objet de la bonne forme, sans configuration.",
    'why.autofixture.chooseInstead':
        "Choisissez AutoFixture quand un test ne se soucie vraiment pas de ce que contient un objet — n'importe quelle valeur, n'importe où dans le graphe, convient — et que vous voulez que tout le graphe soit rempli automatiquement, y compris des types que vous ne possédez pas. JustDummies vous demande d'abord de dire ce qui doit être vrai ; un test qui n'a rien à en dire n'a rien à y gagner.",

    'why.manual.name': 'Écrire les valeurs à la main',
    'why.manual.description': "Aucune bibliothèque : la valeur dont un test a besoin, tapée directement dans son arrange.",
    'why.manual.chooseInstead':
        "Écrivez une simple valeur à la main pour celle dont le test parle vraiment — celle que son assertion vérifie. Le lecteur voit le nombre exact ; une valeur générée ne ferait que lui demander de croire qu'elle est valide. JustDummies s'occupe de tous les autres paramètres, ceux dont le test se moque.",

    'why.note.justdummies.reuse':
        "Un générateur devient réutilisable une fois écrit — à la main, ou généré une fois par l'outil dum — pas automatiquement depuis un seul appel.",
    'why.note.justdummies.realism':
        "Les valeurs sont quelconques, pas réalistes — un générateur de noms n'est pas ce à quoi sert cette bibliothèque.",
    'why.note.justdummies.graph':
        "Un graphe complet se construit en composant un générateur par type ; rien ne parcourt le graphe à votre place.",
    'why.note.justdummies.compileTime':
        "Les analyseurs embarqués dans le paquet principal détectent à la compilation une chaîne de contraintes qui n'admet aucune valeur — une contradiction. Une contrainte manquante est un défaut différent : elle n'échoue toujours qu'au tirage d'une valeur.",
    'why.note.justdummies.exploration':
        "Une valeur arbitraire et reproductible est tirée par exécution, pas une exploration systématique de l'espace d'entrée.",

    'why.note.bogus.invariants':
        "Seulement si chaque RuleFor() est écrit à la main pour respecter les règles du domaine — rien ne le vérifie.",
    'why.note.bogus.callSite':
        "Un RuleFor() — y compris un générateur borné comme Random.Int(min, max) — peut se placer sur un Faker<T> construit à la volée, juste avant Generate(), au prix de l'écrire à la main à chaque fois.",
    'why.note.bogus.testIntent':
        "Seulement pour un RuleFor(x => x.Prop, expected) qui épingle la valeur exacte qu'une assertion vérifie — la même portée que celle créditée à AutoFixture et à la valeur manuelle ci-dessous.",
    'why.note.bogus.reuse': "Un Faker<T> peut être défini une fois et réutilisé entre les tests, comme un générateur JustDummies.",
    'why.note.bogus.graph': "Les objets imbriqués sont composés à la main dans les règles, pas construits automatiquement.",
    'why.note.bogus.compileTime':
        "L'analyseur de Bogus Premium détecte un RuleFor() manquant à la compilation — un module payant, absent du paquet gratuit.",
    'why.note.bogus.codeGen': "Le même analyseur Premium peut insérer le RuleFor() manquant sous forme de correctif de code.",

    'why.note.autofixture.invariants':
        "La génération échoue tant qu'une Customization ou un ISpecimenBuilder n'est pas écrit pour satisfaire les clauses de garde du constructeur.",
    'why.note.autofixture.callSite':
        "Seulement via Build<T>().With(x => x.Prop, value) — épingler une valeur exacte ou une lambda génératrice écrite à la main, pas une contrainte métier déclarative.",
    'why.note.autofixture.testIntent':
        "Seulement pour un Build<T>().With(x => x.Prop, expected) qui nomme la valeur qu'une assertion vérifie réellement — la même portée que celle créditée à la valeur manuelle ci-dessus.",
    'why.note.autofixture.reuse': "Une ICustomization regroupe un ensemble de règles une fois, pour les réutiliser entre les tests.",

    'why.note.manual.invariants':
        "Valide seulement parce qu'une personne a choisi une valeur qu'elle savait valide — rien ne vérifie qu'elle l'est restée.",
    'why.note.manual.testIntent':
        "Seulement pour la valeur dont le test parle vraiment ; utilisée aussi pour les paramètres autour, elle redevient exactement le boilerplate sur lequel s'ouvre l'acte I.",
    'why.note.manual.reuse':
        "Une valeur peut être extraite dans une constante nommée ou un helper et réutilisée entre les tests — au prix de la maintenir à la main, et pour chaque test qui la réutilise, de perdre la variation qu'un générateur lui aurait donnée.",
    'why.note.manual.realism': "Aussi réaliste que ce que la personne qui tape prend la peine d'écrire, à la main, à chaque fois.",
    'why.note.manual.graph': "Chaque objet imbriqué est construit à la main — l'arrange sur lequel s'ouvre l'acte I.",
    'why.note.manual.compileTime':
        "Le compilateur accepte toute valeur du bon type — une chaîne trop longue, par exemple — et seul le constructeur du domaine l'attrape, à l'exécution.",

    'why.notFor.heading': 'Quand ne pas utiliser JustDummies',
    'why.notFor.body':
        "Pas quand un test a besoin de données qui ressemblent à du réel plutôt que de données simplement valides — un générateur de fausses données fera mieux l'affaire. Pas non plus quand un type ne porte aucun invariant métier qui vaille la peine d'être déclaré — une bibliothèque de valeurs anonymes fait le travail avec moins de cérémonie. Et chaque paquet est encore en préversion : une API qui bouge encore est un coût qu'il vaut mieux connaître avant de la mettre sous une grande suite de tests.",

    'why.verified.label': 'Comparatif vérifié pour la dernière fois le',
    'why.report.label': 'Une inexactitude sur une bibliothèque citée ici ? Ouvrez une issue.',

    'releaseNotes.heading': 'Notes de version',
    'releaseNotes.lead':
        "Ce qui a changé dans la bibliothèque, et pourquoi — lu dans son propre changelog, un paquet à la fois.",
    'releaseNotes.meta.description': 'Ce qui a changé dans JustDummies, release après release, pour chaque paquet publié.',
    'releaseNotes.snapshotLabel': 'Instantané pris le',
    'releaseNotes.viewSource': "Lire le changelog dont ceci provient",

    'releaseNotes.train.lib': 'Bibliothèque principale',
    'releaseNotes.train.xunit': 'Adaptateur xUnit',
    'releaseNotes.train.catalog': 'Catalogue de diagnostics',
    'releaseNotes.train.cli': 'CLI — dum',

    'releaseNotes.viewOnGithub': 'Voir sur GitHub',
    'releaseNotes.more': 'de plus',

    'releaseNotes.category.added': 'Ajouté',
    'releaseNotes.category.changed': 'Changé',
    'releaseNotes.category.fixed': 'Corrigé',
    'releaseNotes.category.deprecated': 'Déprécié',
    'releaseNotes.category.removed': 'Retiré',
    'releaseNotes.category.security': 'Sécurité',
    'releaseNotes.category.documentation': 'Documentation',
    'releaseNotes.category.notes': 'Notes',
    'releaseNotes.category.requires': 'Requiert',
    'releaseNotes.category.refusedOnPurpose': 'Refusé, volontairement',

    'footer.nav': 'Pied de page',
    'footer.about': 'À propos',
    'footer.privacy': 'Confidentialité',
    'footer.api': 'API',
    'footer.releaseNotes': 'Notes de version',
    'footer.repository': 'Code source',
};

const translations: Record<Locale, Record<UiKey, string>> = { en, fr };

/**
 * Returns the translator for a locale. Written as a factory so a page reads
 * `t('brand.tagline')` rather than repeating the locale at every call site.
 */
export function useTranslations(locale: Locale): (key: UiKey) => string {
    return function translate(key: UiKey): string {
        return translations[locale][key];
    };
}
