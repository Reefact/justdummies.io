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
    'brand.subtitle': 'Focused test values through a fluent API, for .NET.',

    'nav.why': 'Why JustDummies',
    'nav.playground': 'Playground',
    'nav.docs': 'Docs',
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
     *
     * ONE HEADING OVER TWO STATEMENTS. The table below states what this build IS, and holds
     * only facts the build itself stamped; the release note under it states what the last
     * release CHANGED, which a build cut from a branch did not do and must not appear to. Two
     * separate headings once said this out loud, but a reader saw "This build" immediately
     * followed by "Latest release" and read them as two words for one idea — on this site a
     * build IS a release, so the distinction was invisible where it mattered and only added
     * noise. The two blocks keep their own lead sentence each, which is where that distinction
     * still lives.
     */
    'version.heading': 'Latest release',
    'version.lead': 'The site is serving this build.',
    'version.release': 'Release',
    'version.commit': 'Commit',
    'version.built': 'Built',
    'version.commitLink': 'Read this commit on GitHub',
    'version.meta.description': 'The release, the commit and the build time of the site you are reading, and what its latest release changed.',

    /**
     * The lead's whole job is to say which product it is about. This site publishes the
     * library's release notes too, under /release-notes, and a reader who takes one for the
     * other concludes that a website deployment changed the package they depend on.
     */
    'version.latest.lead': 'What changed on this site when it was last published — the site itself, not the library it documents.',

    /**
     * The second heading: the 5 releases published just before the one above, read from the
     * same RELEASE_NOTES-en.md. Their cards carry no link of their own — a single link closes
     * the section instead. That link names no count: GitHub's own list keeps going well past
     * these 5, so a label promising a number here would be wrong the moment a reader followed it.
     */
    'version.previous.heading': 'Previous releases',
    'version.previous.lead': "The 5 releases this site published just before its latest one, for the same reason as above — its own history, not the library's.",
    'version.previous.viewMoreOnGithub': 'See more releases on GitHub',

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
        'Every business rule becomes a call in the chain: starts with ORD-, uppercase alphanumeric after it, between eight and twenty characters long. The value it produces changes on every run, and it is valid every time. This is where drawing at random makes sense. That value was never the subject of the test, it only had to be valid. Any value that satisfies the rules will do. You describe what the value must satisfy, not what you are going to assert.',

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
        'The tool writes the whole file: the fields, a factory per parameter, the draw. It cannot read the ORD- prefix rule, so it wrote its best generator rather than guess, and planted a line that does not compile beside it. The file does not build until you have looked. You delete it and add .AlphaNumeric(), .InUpperCase() and .StartingWith("ORD-") to the reference factory, and that is the chain you already wrote, unchanged. The file is yours: read it, edit it, commit it.',

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
        "It doesn't need to know who you are to work. There's no account to create, and nothing we measure is ever sold. Most of what follows runs without any cookie at all and cannot tell one reader from another; the one thing that can asks you first, and does nothing until you answer.",
    /**
     * The same paragraph for a build with the analytics lane switched off, where the
     * sentence about something asking first would describe a question nobody is asked.
     * `PrivacyContent.astro` picks between the two — a page has to say what its own
     * artefact does, and "disabled" is a production state rather than a test case.
     */
    'privacy.tracking.bodyWithoutAnalytics':
        "It doesn't need to know who you are to work. There's no account to create, no cookie of any kind, and nothing we measure is ever sold or shared with anyone. Nothing described below can tell one reader from another.",
    'privacy.analytics.label': 'Audience measurement.',
    'privacy.analytics.body':
        "We use Cloudflare Web Analytics to know how many people visit the site and whether pages load quickly. This tool sets no cookie and doesn't identify anyone individually — it counts visits and load times, not people. Two further things are measured, deliberately. When you copy an install command, the site records which part of the page you copied it from, which command it was, the page's language, that part's position in the page, and when it happened. When you click the floating download button, it records which section of the site you were reading, the page's language, and when it happened. That is the whole of both records — no identifier, no address, nothing you typed, nothing that can be traced back to you. They answer one question, which is which parts of this site actually help. The playground records one thing of its own, described further down. None of this ever asks your permission, because none of it is capable of recognising you.",
    'privacy.playground.label': 'The playground.',
    'privacy.playground.body':
        "The playground runs the library entirely inside your browser, and nothing you type there is ever sent to a server — not a value you set on a constraint, and not text you paste into one. One thing is recorded when you press Generate: the shape of the expression you built, with the values left out. Where you wrote `StartingWith(\"ORD-\")` what is recorded is `StartingWith(?)` — a question mark, never what was in its place — along with the page's language and when it happened. It answers which parts of the library people come here to try. Like the two above, it sets no cookie and cannot tell one reader from another. The playground asks the Google Analytics question below like every other page, and if you accept it there, it also records that a Generate happened — the press alone, with none of the expression.",
    'privacy.hosting.label': 'What the host sees.',
    'privacy.hosting.body':
        "The site is hosted on Cloudflare, which necessarily receives every request in order to serve it — your IP address and the pages requested, for instance. That's an unavoidable part of any web hosting, not a measurement we add; Cloudflare is our subprocessor for hosting and for the audience measurement above.",
    'privacy.controller.label': "Who's responsible for this site.",
    'privacy.controller.body':
        "It's published by REEFACT, a single-member SARL registered under SIREN number 804 026 482, headquartered at 134 rue de Chevilly, 94240 L'Haÿ-les-Roses, France, represented by its manager Sylvain Aurat.",
    'privacy.consent.label': 'Google Analytics, if you allow it.',
    'privacy.consent.body':
        "To understand how this page is actually read — which moment convinces someone, where people stop — the site can use Google Analytics. It is off until you accept it, and if you never do, nothing about you reaches Google. If you accept, it stores a cookie holding a random identifier, so that two visits from the same browser count as one reader rather than two, and Google becomes a second processor alongside Cloudflare, with the transfers outside the European Union that this implies. What it records is how you move through the page: the scenes you reach, the install command you copy, the download button you press, the tool you compare us against — and, on the API pages, the words you type into the search box, because what readers look for and fail to find is the most useful thing this site can learn. It is configured never to feed advertising, and what it collects about you is erased fourteen months after your last visit. Your answer covers this whole site, the playground included: whichever page you answer on, you are asked once and every other page follows that answer. In the playground it records one thing more, a press of Generate — never what you typed into the expression. You can change your mind at any time, here:",
    'privacy.consent.change': 'Change your choice',
    'privacy.rights.label': 'Your rights.',
    'privacy.rights.body':
        "If you have never accepted Google Analytics, this site holds nothing that identifies you individually, and there is in practice nothing to correct or delete about you. If you have accepted it, refusing above stops the collection from that moment; to have what was already collected erased, or for any other question, write to privacy@reefact.net.",
    /** The same, for a build where there is no "above" to refuse. */
    'privacy.rights.bodyWithoutAnalytics':
        "This site collects nothing that identifies you individually, so there is in practice nothing to correct or delete about you. For any question on this, write to privacy@reefact.net.",
    'privacy.updated': 'Last updated: August 23, 2026.',

    /**
     * The consent banner (`ConsentBanner.astro`). It speaks only about Google: the
     * other two measurements set no cookie, recognise nobody, and are not what is
     * being asked about — saying otherwise would let a refusal read as "the site
     * now measures nothing", which would be false.
     */
    'consent.heading': 'How this page is read.',
    'consent.body':
        "The site would like to use Google Analytics to see which parts of this page actually help and where readers stop. That stores a cookie, sends your visit to Google, and on the API pages includes what you type into the search box. Refusing changes nothing about what you can read here, and the rest of the site's measurement — which sets no cookie and recognises nobody — runs either way.",
    'consent.accept': 'Accept',
    'consent.refuse': 'Refuse',
    'consent.more': 'What is measured',
    'consent.state.accepted': 'Google Analytics accepted.',
    'consent.state.refused': 'Google Analytics refused.',

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
    'api.nav.poolInspection': 'Pool inspection',
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
    'api.poolInspection.heading': 'Pool inspection',
    'api.poolInspection.lede':
        "What a generator's declared constraints leave of a value set you supplied yourself — the values still drawable, and the ones refused, each naming the constraint that refused it.",
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
     * /why-justdummies — the comparative positioning page (§11), read at four depths (§11.3).
     *
     * TWO RULES GOVERN EVERY STRING BELOW, and both were written after the first version of
     * this page was found to fail them.
     *
     * A criterion is taught before it is used (§11.4). Every axis therefore has four keys —
     * a plain-language `.label`, the `.question` it settles, an `.explanation`, and where one
     * exists the `.term` that names it — and the technical term always comes last, because it
     * names an idea rather than explaining one.
     *
     * A note is self-contained (§11.10). It never says "above" or "below", because the duel
     * hides columns and the matrix reorders nothing the reader can rely on; and it never
     * points at the landing page's narrative, because a reader who arrived here from a search
     * has not read it.
     */
    'why.heading': 'Why JustDummies',
    'why.meta.description':
        'When to reach for JustDummies, for Bogus, for AutoFixture, or for a value you write by hand — criterion by criterion, including where JustDummies loses.',

    'why.lede':
        'JustDummies generates the arbitrary values a test needs, and lets you state the rules those values have to satisfy.',

    'why.toc.label': 'On this page',

    'why.transition.body':
        'Not every value in a test carries the scenario. The ones that do not still have to respect the rules of the domain — that is the part JustDummies takes care of.',
    'why.transition.homeLink': 'See the full example, step by step.',

    'why.choose.heading': 'Which of these do you need?',
    'why.choose.lede':
        'These four are usually listed as rivals. They answer four different questions, and most projects ask more than one of them. Find the sentence you would say out loud.',

    'why.tool.repoLink': 'View the repository',

    'why.tool.justdummies.need': 'I do not care what this value is, but it has to be valid.',
    'why.tool.justdummies.description':
        'Arbitrary values for everything a test does not check, with the rules they must satisfy written where the value is asked for.',
    'why.tool.justdummies.concretely':
        'In practice: a reference that always starts with ORD-, is uppercase alphanumeric after that prefix, and is between eight and twenty characters long, drawn fresh on every run.',

    'why.tool.bogus.need': 'I need data that looks real.',
    'why.tool.bogus.description':
        'A simple fake data generator for C#, F#, and VB.NET — ported from the well-known faker.js.',
    'why.tool.bogus.concretely':
        'In practice: names, addresses, emails, phone numbers, product labels — locale-aware, and convincing to a person reading a screenshot or a demo database.',
    'why.tool.bogus.chooseInstead':
        'Choose Bogus when the data has to look real: names, addresses, emails, a demo database somebody will read. Its catalogue is locale-aware, which is work you would otherwise do by hand. JustDummies draws valid values, not believable ones.',
    'why.tool.bogus.checked':
        'Read: the locale-aware catalogue (Name, Address, Internet, Commerce), RuleFor and the rules that can be chained on a Faker<T> built inline, the bounded draws such as Random.Int(min, max), StrictMode and AssertConfigurationIsValid, UseSeed and Randomizer.Seed, and the paid Bogus Premium tier whose analyzer flags a missing RuleFor and can insert it.',

    'why.tool.autofixture.need': 'Just build me the object. I do not care what is in it.',
    'why.tool.autofixture.description':
        "A library that removes the need to hand-code anonymous variables when setting up a test's fixture.",
    'why.tool.autofixture.concretely':
        'In practice: one call returns a fully populated object, everything it holds filled in too, including types you did not write — with nothing declared anywhere.',
    'why.tool.autofixture.chooseInstead':
        'Choose AutoFixture when the test needs a whole object and has nothing to say about what is in it. One call fills the object and everything it holds, including types you did not write. JustDummies starts from the rules; where there are no rules to state, it adds a step and buys nothing.',
    'why.tool.autofixture.checked':
        'Read: anonymous rather than realistic values, automatic construction of values of virtually any type, the [Range], [StringLength] and [RegularExpression] annotations honoured with no configuration, the Build<T>().With(...) override, the separate ISpecimenBuilder and Customize<T>() path, and the still-open request for repeatable random values.',

    'why.tool.manual.name': 'Hardcoded value',
    'why.tool.manual.need': 'This exact value is what the test checks.',
    'why.tool.manual.description': 'No library at all: the value typed straight into the test, on the line that uses it.',
    'why.tool.manual.concretely':
        'In practice: the amount an assertion compares against, or the status a behaviour turns on. A reader sees it without leaving the test.',
    'why.tool.manual.chooseInstead':
        'Write the literal for the value the test is about — the amount an assertion compares against, the status a behaviour turns on. A reader sees the exact value on the line that uses it. A drawn value there would only ask them to take it on trust.',

    'why.compare.heading': 'JustDummies vs. the alternatives',
    'why.compare.lede':
        'Ten criteria, each one a question about your own tests, answered for all four options.',

    'why.legend.heading': 'The three answers',
    'why.legend.core': 'The tool is built for this, and does it with no extra setup.',
    'why.legend.possible': 'The tool can get there, but you write something to get there. The note says what.',
    'why.legend.outOfScope':
        'The tool does not do this. Sometimes its authors decided against it, sometimes nobody has built it yet — the note says which.',
    'why.legend.order':
        'The criteria are grouped by the questions you might ask in your own tests, not by what JustDummies is good at. And JustDummies deliberately does not try to cover every need: its goal is to do one thing well, generating the arbitrary and constrained values your tests need.',
    'why.legend.definitionsLabel': 'What each answer means',

    'why.rating.core': 'Built for this',
    'why.rating.possible': 'Possible, with work',
    'why.rating.outOfScope': 'Not what it does',

    'why.duel.label': 'Compare JustDummies with',
    'why.duel.everything': 'all three alternatives',
    'why.duel.showingOne': 'Showing JustDummies and',
    'why.duel.showingAll': 'Showing JustDummies and all three alternatives.',

    /**
     * The four questions the ten criteria are grouped under (§11.5). They are the reader's
     * questions, in the order a reader meets them — which is what replaced an ordering by
     * how well JustDummies scored.
     */
    'why.family.accepted': 'Will the value get through my own code?',
    'why.family.readable': 'Will my test still be readable?',
    'why.family.kind': 'What kind of value do I actually need?',
    'why.family.wrong': 'What happens when it goes wrong, and who writes the setup?',

    'why.axis.termLabel': 'Technical term:',

    'why.axis.invariants.label': 'Values your own code will accept',
    'why.axis.invariants.question': 'Will the generated value get past my own constructor?',
    'why.axis.invariants.explanation':
        'Most domain types refuse bad input. OrderReference.Create rejects a string that does not start with ORD-, one shorter than eight characters or longer than twenty, and one carrying anything but an uppercase letter or a digit after the prefix. A test that needs any reference still needs one that clears every check.',
    'why.axis.invariants.term': 'business invariant, or precondition in design by contract',

    'why.axis.callSite.label': 'Rules stated where the value is asked for',
    'why.axis.callSite.question': 'Can I write "any number between 1 and 100" on the line that needs it?',
    'why.axis.callSite.explanation':
        'Some rules belong to one test rather than to the domain: this quantity has to be at least two, this date has to be in the past. The question is whether you can say so on the spot, or have to declare a type, register a customisation or build a fixture first.',
    'why.axis.callSite.term': 'call site — the place in your code where the value is asked for',

    'why.axis.testIntent.label': 'Showing which value the test checks',
    'why.axis.testIntent.question': 'Can a reader tell which values the assertion depends on?',
    'why.axis.testIntent.explanation':
        'A test that builds an order from four arguments does not say which of the four it is about. Drawing three of them and writing the fourth as a literal answers that in the arrangement itself.',

    'why.axis.reuse.label': 'Describing a valid object once',
    'why.axis.reuse.question': 'The day my type gains a constructor parameter, how many test files do I reopen?',
    'why.axis.reuse.explanation':
        'Whatever describes a valid order — a chain of constraints, a set of rules, a builder — is worth writing once and calling from everywhere. The question is what that costs to set up, and how much of it the tool writes for you.',

    'why.axis.realism.label': 'Data that looks real',
    'why.axis.realism.question': 'Will a person look at this value, or only an assertion?',
    'why.axis.realism.explanation':
        'Valid and believable are two different jobs. A reference that clears every rule can still read as machine noise. That is fine in an assertion and wrong in a screenshot.',
    'why.axis.realism.term': 'fake data — the faker family of libraries',

    'why.axis.graph.label': 'Filling nested objects for you',
    'why.axis.graph.question': 'My type is three levels deep and the test cares about none of it — who fills it?',
    'why.axis.graph.explanation':
        'An order holds a customer, which holds an address. Either something inspects your class and populates every level, or you supply one generator per type and plug them together.',
    'why.axis.graph.term': 'object graph',

    'why.axis.reproducibility.label': 'Replaying the run that failed',
    'why.axis.reproducibility.question': 'CI went red on a drawn value. Can I get that exact value back?',
    'why.axis.reproducibility.explanation':
        'Values that change on every run mean a test can fail today and pass tomorrow. What makes that workable is a number the failing run reports, which draws the same values again when you paste it back.',
    'why.axis.reproducibility.term': 'seed',

    'why.axis.compileTime.label': 'Caught before the test runs',
    'why.axis.compileTime.question': 'Do I learn the setup is wrong in the editor, or ten minutes later?',
    'why.axis.compileTime.explanation':
        'A chain of constraints can contradict itself: at most three characters, and starting with ORD-. Nothing satisfies that. The question is whether it shows up as a build error or as an exception on the first run.',
    'why.axis.compileTime.term': 'Roslyn analyzer',

    'why.axis.codeGen.label': 'A tool writing the setup for you',
    'why.axis.codeGen.question': 'Do I hand-write a builder for each of my forty domain types?',
    'why.axis.codeGen.explanation':
        'The constraints for an order are a file somebody has to write, and rewrite the day the type gains a parameter. The question is whether a tool reads your own source and writes it. What it writes is ordinary C# in your test project: read it, edit it, commit it.',
    'why.axis.codeGen.term': 'scaffolding — not a source generator, which runs at build time and leaves you no file',

    'why.axis.exploration.label': 'Hunting for the value that breaks your code',
    'why.axis.exploration.question': 'Do I want one arbitrary value, or hundreds looking for a counter-example?',
    'why.axis.exploration.explanation':
        'One drawn value per run tells you the code held for that value. The opposite approach runs the same assertion over hundreds of generated inputs, then narrows any failure down to the smallest input that still fails.',
    'why.axis.exploration.term': 'property-based testing, and shrinking',
    'why.axis.exploration.elsewhere':
        'None of the four does this. In .NET the usual answers are FsCheck and CsCheck, and they sit beside any of these rather than replacing one.',

    'why.matrix.summary': 'The full comparison table',
    'why.matrix.intro':
        'Every answer at a glance, without the notes behind them. Each criterion links down to the block that explains it.',
    'why.table.caption': 'Four ways to get a test value, criterion by criterion.',
    'why.table.axisHeader': 'Criterion',

    'why.note.justdummies.reuse':
        "Write the generator once, in your own test project, and every test can call it. The dum tool — the library's own companion CLI — can write that file for you. Neither happens from a single call.",
    'why.note.justdummies.realism':
        'Valid, not believable. There is no catalogue of names, addresses or emails here.',
    'why.note.justdummies.graph':
        'You supply one generator per type and compose them. Nothing inspects your class and fills the levels underneath.',
    /**
     * The one note on the page that qualifies a "built for this" cell rather than a lesser
     * one, and it has to: the criterion is answered by the xUnit adapter, and a reader on
     * NUnit or MSTest would otherwise find that out after installing.
     */
    'why.note.justdummies.reproducibility':
        'A failing test case reports its seed, and that seed redraws exactly the same values. Each case seeds itself, so a suite running in parallel still hands back the seed of the one that failed. This comes from the xUnit adapter; there is no NUnit or MSTest adapter today.',
    'why.note.justdummies.compileTime':
        "The analyzers ship inside the main package at no extra cost — installing the library installs them, with no paid tier standing between you and them. They catch a self-contradictory constraint immediately, in the editor: at most three characters, say, and starting with ORD-. What stays out of reach here is a domain invariant nobody declared as a rule at all — enforced in ordinary constructor code, with no structured list of a type's own invariants for an analyzer to check completeness against. That is narrower than it sounds: Bogus Premium's analyzer can flag a property with no RuleFor, because a Faker<T>'s properties are a known, enumerable set. A hand-written constructor's own invariants are not.",
    'why.note.justdummies.codeGen':
        'The dum tool reads your type and writes the generator into your test project. The file is ordinary C#, and it is yours to edit and commit.',
    'why.note.justdummies.exploration':
        'One value is drawn per run, and you can draw it again. There is no systematic search for the input that fails.',

    'why.note.bogus.invariants':
        "A Faker<T> satisfies a domain rule once a RuleFor is written to match it — or a CustomInstantiator that calls the type's own factory. StrictMode(true) then checks that every property has a rule at all. What no check covers is whether a rule produces a value the domain would accept.",
    'why.note.bogus.callSite':
        'A Faker<T> can be built inline in the test, right before Generate, with its rules on it — Random.Int(min, max) and the like. You write those rules out again in every test that needs them.',
    'why.note.bogus.testIntent':
        'RuleFor(x => x.Prop, expected) pins the exact value the assertion checks, so the subject of the test is written down. The rules around it are written down just as visibly.',
    'why.note.bogus.reuse': 'A Faker<T> is defined once and reused across tests, the same way a JustDummies generator is.',
    'why.note.bogus.graph': 'A nested object is built by hand inside the rule that produces it. Bogus does not descend into it for you.',
    'why.note.bogus.reproducibility':
        'UseSeed on a Faker, or Randomizer.Seed for the whole run, makes a run repeatable.',
    'why.note.bogus.compileTime':
        'The free package catches a missing rule when the test runs: StrictMode(true) makes Generate throw, and AssertConfigurationIsValid checks on demand. Catching it while you type is the Bogus Premium analyzer, which is a paid licence.',
    'why.note.bogus.codeGen':
        'The same Premium analyzer offers the missing rule as a one-click fix in the editor. That is help of a different shape from a file a tool writes and you keep.',
    'why.note.bogus.exploration':
        'Bogus fills values. It does not run your test repeatedly looking for one that fails.',

    'why.note.autofixture.invariants':
        'A rule a type carries as an annotation — [Range], [StringLength], [RegularExpression] — is already honoured, with no configuration at all. A rule enforced inside a constructor is the other case: generation throws until a Register, a Customize<T> or an ISpecimenBuilder is written to satisfy it.',
    'why.note.autofixture.callSite':
        'A rule that lives on the type is honoured everywhere without a line in the test. A rule that belongs to this one test is written inline through Build<T>().With(x => x.Prop, value) — a pinned value, or a lambda you write, one property at a time.',
    'why.note.autofixture.testIntent':
        'This is the goal AutoFixture states for itself: the values a test does not care about disappear, because you never describe them. What disappears with them is any statement of what those values must satisfy.',
    'why.note.autofixture.reuse':
        'An ICustomization packages a set of rules once, in a class of its own, and every test that opts into it gets them.',
    'why.note.autofixture.realism':
        'The values are anonymous by design — a string comes out as a property name and a GUID. Looking real is not what AutoFixture is trying to do.',
    'why.note.autofixture.reproducibility':
        'There is no seed to set, so a run cannot be replayed value for value. That is a gap rather than a decision: repeatable random numbers are an open request on the project, filed in September 2023.',
    'why.note.autofixture.compileTime':
        'No analyzer ships with it. A customization that can never produce a value is found when the test runs.',
    'why.note.autofixture.codeGen':
        'Nothing writes a file for you, and the point is the opposite: with no rules to declare, there is no setup code to write.',
    'why.note.autofixture.exploration':
        'One anonymous value per request, not a search for the one that makes your code fail.',

    'why.note.manual.invariants':
        'Valid because a person chose a value they knew was valid. Nothing checks that it still is the day the rule changes.',
    'why.note.manual.callSite':
        'The rule is never stated. You pick a value that happens to satisfy it, and the rule stays in the head of whoever picked it.',
    'why.note.manual.testIntent':
        'It shows the value the test is about with no indirection at all. Used for the parameters around it as well, the arrangement grows a line per parameter and the subject stops standing out.',
    'why.note.manual.reuse':
        'A literal can move into a named constant or a helper and be shared. You then maintain it by hand, and every test that shares it runs on the same value.',
    'why.note.manual.realism':
        'As realistic as the value you type: marie.durand@acme.fr is every bit as convincing as a generated one. You type it again in the next test.',
    'why.note.manual.graph':
        'Every nested object is constructed by hand, level by level, and each constructor is a line you write and then maintain.',
    'why.note.manual.reproducibility':
        'The same value on every run, because it is the value you typed. Nothing to replay, and nothing that varies.',
    'why.note.manual.compileTime':
        'The compiler accepts any value of the right type — an overlong string, say. Only the domain constructor catches it, at run time.',
    'why.note.manual.codeGen': 'You type it. There is nothing to generate.',
    'why.note.manual.exploration': 'One value, chosen once, and the same one for the life of the test.',

    'why.instead.heading': 'When another tool is the better answer',
    'why.instead.lede': 'Three cases where one of the others is the right choice.',

    'why.notFor.heading': 'When not to use JustDummies',
    'why.notFor.lede': 'Cases where another tool, or no tool at all, is the better answer.',
    'why.notFor.realism.label': 'The data has to look real.',
    'why.notFor.realism.body':
        'A demo, a screenshot, a database somebody will browse. Reach for a fake-data generator. A valid value is not a believable one.',
    'why.notFor.exploration.label': 'You want the test to go looking for a counter-example.',
    'why.notFor.exploration.body':
        'Running one assertion over hundreds of generated inputs, then shrinking a failure to its smallest case, is property-based testing. JustDummies draws one value per run, and it is not that tool.',
    'why.notFor.secrets.label': 'You need a password, a token or a key.',
    'why.notFor.secrets.body':
        'The generators produce test values, not secrets. Nothing drawn here is fit to be used as a credential, in a test or anywhere else.',

    'why.tryIt.heading': 'Try it',
    'why.tryIt.body':
        'Add the package to a test project and change one line of one arrangement. Every other test stays as it is. Bogus, AutoFixture, your own builders and every literal you have already written keep working, in the same project and in the same file. If it does not earn its place, backing it out is deleting the lines you added.',
    'why.tryIt.install': 'Install the library',

    'why.sources.heading': 'How this comparison was checked',
    'why.sources.body':
        "Every claim about another project on this page comes from that project's own documentation or repository. What was read, and where, is below.",
    /** The date itself is never typed here — it comes from `comparison.ts`'s `comparisonVerifiedOn`, formatted per locale, so the two cannot disagree. */
    'why.verified.label': 'Last checked on',
    'why.sources.mentioned': 'Named but not compared',
    'why.sources.mentionedBody':
        'The two property-based testing libraries this page points to, for the one criterion none of the four options answers. Both were read to confirm they do what the page says.',
    'why.report.prompt':
        'If you maintain one of these projects and this page gets it wrong, an issue is the fastest way to have it corrected.',
    'why.report.label': 'Open an issue',

    /**
     * /release-notes — a snapshot of the library's own release-notes files, one train and
     * one major version per page (ADR-0019, ADR-0020). What a release actually says, rubric
     * headings included, is the library's prose in the reader's own locale and is never
     * translated here: what these keys carry is the chrome around it.
     */
    'releaseNotes.heading': 'Release notes',
    'releaseNotes.lead':
        "This page tracks what's new and changing in JustDummies, including new features, improvements, bug fixes, and deprecations. Use it to see what shipped in the most recent release, confirm when a capability became available, or review changes before upgrading.",
    'releaseNotes.meta.description': "What changed in JustDummies, release by release, across every package it publishes.",
    'releaseNotes.snapshotLabel': 'Snapshot taken at',
    'releaseNotes.viewSource': 'Read the technical changelog',

    'releaseNotes.train.lib': 'Core library',
    'releaseNotes.train.xunit': 'xUnit adapter',
    'releaseNotes.train.catalog': 'Diagnostic catalog',
    'releaseNotes.train.cli': 'CLI — dum',

    'releaseNotes.viewOnGithub': 'View on GitHub',

    /** The package switcher above the two columns, and the table of contents beside them. */
    'releaseNotes.packages': 'Packages',
    'releaseNotes.contents': 'Versions',
    /** Followed by the major version's own number: "Version 1". */
    'releaseNotes.majorLabel': 'Version',
    'releaseNotes.releases.one': 'release',
    'releaseNotes.releases.many': 'releases',

    /** The section's front page, which is the four trains and what each published last. */
    'releaseNotes.latestLabel': 'Latest',
    'releaseNotes.readNotes': 'Read the release notes',

    /**
     * /download — the install commands for every package this site vouches for (`site.ts`,
     * §14.1's single source), one train at a time, reached from any page through the
     * floating link `download.cta` names.
     */
    'download.heading': 'Download',
    'download.lead':
        'Every install command JustDummies offers, in whichever tool you already use — the .NET CLI or the Package Manager Console.',
    'download.meta.description':
        'Install commands for JustDummies: the library, the xUnit adapter, and the CLI — in the .NET CLI and the Package Manager Console.',
    'download.cta': 'Download',

    /**
     * /docs — the library's own handwritten user documentation, mirrored under this site
     * (specification §7.2, §7.5, ADR-0026). The section labels, descriptions and this
     * chrome are the site's own words; every leaf page's title and body are the library's,
     * read verbatim from `scripts/generate-docs.mjs`'s snapshot.
     */
    'docs.heading': 'Documentation',
    'docs.meta.description': 'Guides, the generator reference, the package overview and every analyzer rule — the full user documentation for JustDummies.',
    'docs.lead': 'The full user documentation for JustDummies: how to use it, what each generator draws, what each package is for, and what each analyzer rule catches.',
    'docs.nav.toggle': 'Documentation sections',
    'docs.nav.heading': 'Sections',

    'docs.section.guides.label': 'Guides',
    'docs.section.guides.description': 'From a first dummy to composing your own generators — the concepts and how they fit together.',
    'docs.section.generators.label': 'Generators',
    'docs.section.generators.description': 'Every Any.* factory, grouped by the kind of value it draws.',
    'docs.section.packages.label': 'Packages',
    'docs.section.packages.description': 'The four packages this library ships, and which of them a project actually needs.',
    'docs.section.analyzers.label': 'Analyzer rules',
    'docs.section.analyzers.description': 'The 33 build-time rules that ship inside the library, JD001 through JD033.',

    'docs.sourceLink': 'Read the source, or correct it there',
    'docs.pinnedAt': 'Mirrored from',

    /** The sitewide footer. */
    'footer.nav': 'Footer',
    'footer.about': 'About',
    'footer.privacy': 'Privacy',
    'footer.api': 'API',
    'footer.releaseNotes': 'Release notes',
    'footer.docs': 'Docs',
} as const;

/**
 * The key set. Derived from English rather than declared separately, so the two can
 * never disagree about what a key is.
 */
export type UiKey = keyof typeof en;

const fr: Record<UiKey, string> = {
    'brand.tagline': 'Juste des dummies, mais redoutablement efficaces.',
    'brand.subtitle': 'Des valeurs de test ciblées grâce à une API fluent, pour .NET.',

    'nav.why': 'Pourquoi JustDummies',
    'nav.playground': 'Playground',
    'nav.docs': 'Docs',
    'nav.github': 'GitHub',
    'nav.nuget': 'NuGet',
    'nav.primary': 'Principale',

    'language.label': 'Langue',
    'language.switch': 'Lire cette page en',

    'home.install.label': 'Installer le package',
    'home.meta.description':
        "JustDummies produit des valeurs de test arbitraires qui respectent les contraintes que vous déclarez. Vos tests ne disent plus que ce dont ils parlent.",

    'version.heading': 'Dernière release',
    'version.lead': 'Le site sert ce build.',
    'version.release': 'Release',
    'version.commit': 'Commit',
    'version.built': 'Construit le',
    'version.commitLink': 'Lire ce commit sur GitHub',
    'version.meta.description':
        "La release, le commit et la date de construction du site que vous lisez, et ce qu'a changé sa dernière release.",

    'version.latest.lead':
        "Ce qui a changé sur ce site lors de sa dernière publication — le site lui-même, pas la bibliothèque qu'il documente.",

    'version.previous.heading': 'Releases précédentes',
    'version.previous.lead':
        "Les 5 releases publiées par ce site juste avant la dernière, pour la même raison qu'au-dessus — son histoire à lui, pas celle de la bibliothèque.",
    'version.previous.viewMoreOnGithub': 'Voir plus de releases sur GitHub',

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
        "Chaque règle métier devient un appel dans la chaîne : commence par ORD-, alphanumérique en majuscules après le préfixe, d'une longueur comprise entre huit et vingt caractères. La valeur produite change à chaque exécution, et elle est valide à chaque fois. Le hasard prend son sens ici. Cette valeur n'a jamais été le sujet du test, elle devait seulement être valide. N'importe laquelle qui respecte les règles fait donc l'affaire. Vous décrivez ce que la valeur doit respecter, pas ce que vous allez vérifier.",

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
        "L'outil écrit tout le fichier : les champs, une factory par paramètre, le tirage. Il ne sait pas lire la règle du préfixe ORD-, alors plutôt que de l'inventer il écrit son meilleur générateur et plante à côté une ligne qui ne compile pas. Le fichier ne se construit pas tant que vous n'avez pas regardé. Vous supprimez cette ligne et ajoutez .AlphaNumeric(), .InUpperCase() et .StartingWith(\"ORD-\") sur la factory de reference : c'est la chaîne que vous avez déjà écrite, inchangée. Le fichier vous appartient : vous le lisez, vous le modifiez, vous le commitez.",

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
        "Il n'a pas besoin de savoir qui vous êtes pour fonctionner. Il n'y a pas de compte à créer, et rien de ce que nous mesurons n'est jamais revendu. L'essentiel de ce qui suit fonctionne sans aucun cookie et ne sait pas distinguer un lecteur d'un autre ; la seule chose qui en soit capable vous demande d'abord, et ne fait rien tant que vous n'avez pas répondu.",
    'privacy.tracking.bodyWithoutAnalytics':
        "Il n'a pas besoin de savoir qui vous êtes pour fonctionner. Il n'y a pas de compte à créer, aucun cookie d'aucune sorte, et rien de ce que nous mesurons n'est revendu ni partagé avec qui que ce soit. Rien de ce qui est décrit ci-dessous ne sait distinguer un lecteur d'un autre.",
    'privacy.analytics.label': "Mesure d'audience.",
    'privacy.analytics.body':
        "Nous utilisons Cloudflare Web Analytics pour savoir combien de personnes visitent le site et si les pages se chargent rapidement. Cet outil ne dépose aucun cookie et n'identifie personne individuellement : il compte des visites et des temps de chargement, pas des personnes. Deux choses de plus sont mesurées, délibérément. Quand vous copiez une commande d'installation, le site enregistre depuis quel endroit de la page vous l'avez copiée, de quelle commande il s'agit, la langue de la page, la position de cet endroit dans la page, et le moment. Quand vous cliquez sur le bouton de téléchargement flottant, il enregistre quelle section du site vous étiez en train de lire, la langue de la page, et le moment. C'est tout ce que contiennent ces deux enregistrements — aucun identifiant, aucune adresse, rien de ce que vous avez saisi, rien qui puisse remonter jusqu'à vous. Ils répondent à une seule question : quelles parties de ce site servent vraiment. Le playground enregistre une chose qui lui est propre, décrite plus bas. Aucune de ces mesures ne vous demande votre accord, parce qu'aucune n'est capable de vous reconnaître.",
    'privacy.playground.label': 'Le playground.',
    'privacy.playground.body':
        "Le playground exécute la bibliothèque entièrement dans votre navigateur, et ce que vous y saisissez n'est jamais envoyé à un serveur — ni une valeur que vous posez sur une contrainte, ni un texte que vous y collez. Une seule chose est enregistrée quand vous pressez Générer : la forme de l'expression que vous avez construite, sans les valeurs. Là où vous avez écrit `StartingWith(\"ORD-\")`, ce qui est enregistré est `StartingWith(?)` — un point d'interrogation, jamais ce qui était à sa place —, avec la langue de la page et le moment. Cela répond à quelles parties de la bibliothèque les gens viennent essayer ici. Comme les deux ci-dessus, cela ne dépose aucun cookie et ne sait pas distinguer un lecteur d'un autre. Le playground pose la question Google Analytics ci-dessous comme toutes les autres pages, et si vous l'y acceptez, il enregistre aussi qu'un Générer a eu lieu — la pression seule, sans rien de l'expression.",
    'privacy.hosting.label': "Ce que l'hébergeur voit.",
    'privacy.hosting.body':
        "Le site est hébergé chez Cloudflare, qui reçoit nécessairement chaque requête pour la servir — votre adresse IP et les pages demandées, par exemple. C'est un passage obligé de tout hébergement web, pas une mesure que nous ajoutons ; Cloudflare est notre sous-traitant pour l'hébergement comme pour la mesure d'audience ci-dessus.",
    'privacy.controller.label': 'Qui est responsable de ce site.',
    'privacy.controller.body':
        "Il est édité par REEFACT, SARL unipersonnelle immatriculée sous le numéro SIREN 804 026 482, dont le siège est situé 134 rue de Chevilly, 94240 L'Haÿ-les-Roses, représentée par son gérant Sylvain Aurat.",
    'privacy.consent.label': "Google Analytics, si vous l'autorisez.",
    'privacy.consent.body':
        "Pour comprendre comment cette page est réellement lue — quel moment convainc, où l'on s'arrête —, le site peut utiliser Google Analytics. Il est éteint tant que vous ne l'avez pas accepté, et si vous ne l'acceptez jamais, rien vous concernant n'arrive chez Google. Si vous l'acceptez, il dépose un cookie contenant un identifiant aléatoire, afin que deux visites depuis le même navigateur comptent pour un lecteur et non pour deux, et Google devient un second sous-traitant aux côtés de Cloudflare, avec les transferts hors de l'Union européenne que cela implique. Ce qu'il enregistre, c'est votre progression dans la page : les scènes que vous atteignez, la commande d'installation que vous copiez, le bouton de téléchargement que vous pressez, l'outil auquel vous nous comparez — et, sur les pages d'API, les mots que vous tapez dans le champ de recherche, parce que ce que les lecteurs cherchent sans le trouver est la chose la plus utile que ce site puisse apprendre. Il est configuré pour ne jamais alimenter la publicité, et ce qu'il collecte à votre sujet est effacé quatorze mois après votre dernière visite. Votre réponse vaut pour tout le site, playground compris : quelle que soit la page où vous répondez, la question n'est posée qu'une fois et toutes les autres pages suivent cette réponse. Dans le playground, une chose de plus est enregistrée, une pression sur Générer — jamais ce que vous avez tapé dans l'expression. Vous pouvez changer d'avis à tout moment, ici :",
    'privacy.consent.change': 'Modifier votre choix',
    'privacy.rights.label': 'Vos droits.',
    'privacy.rights.body':
        "Si vous n'avez jamais accepté Google Analytics, ce site ne détient rien qui vous identifie individuellement, et il n'y a en pratique rien à corriger ou à effacer vous concernant. Si vous l'avez accepté, le refuser ci-dessus arrête la collecte à partir de cet instant ; pour faire effacer ce qui a déjà été collecté, ou pour toute autre question, écrivez à privacy@reefact.net.",
    'privacy.rights.bodyWithoutAnalytics':
        "Ce site ne collecte aucune donnée qui vous identifie individuellement, il n'y a donc en pratique rien à corriger ou à effacer vous concernant. Pour toute question sur ce point, écrivez à privacy@reefact.net.",
    'privacy.updated': 'Dernière mise à jour : 23 août 2026.',

    'consent.heading': 'Comment cette page est lue.',
    'consent.body':
        "Le site aimerait utiliser Google Analytics pour voir quelles parties de cette page servent vraiment et où les lecteurs s'arrêtent. Cela dépose un cookie, envoie votre visite à Google, et inclut sur les pages d'API ce que vous tapez dans le champ de recherche. Refuser ne change rien à ce que vous pouvez lire ici, et le reste de la mesure du site — qui ne dépose aucun cookie et ne reconnaît personne — fonctionne dans les deux cas.",
    'consent.accept': 'Accepter',
    'consent.refuse': 'Refuser',
    'consent.more': 'Ce qui est mesuré',
    'consent.state.accepted': 'Google Analytics accepté.',
    'consent.state.refused': 'Google Analytics refusé.',

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
    'api.nav.reproducibility': 'Seeds et reproductibilité',
    'api.nav.poolInspection': 'Inspection de pool',
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
    'api.reproducibility.heading': 'Seeds et reproductibilité',
    'api.reproducibility.lede':
        "Ce qui rend un échec sur une valeur arbitraire exactement rejouable, plutôt qu'un mystère qui change d'apparence à chaque exécution.",
    'api.poolInspection.heading': 'Inspection de pool',
    'api.poolInspection.lede':
        "Ce que les contraintes déclarées d'un générateur laissent d'un ensemble de valeurs que vous avez fourni vous-même — celles encore tirables, et celles refusées, chacune nommant la contrainte qui l'a refusée.",
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

    /**
     * /why-justdummies — le français n'est pas une traduction de l'anglais, c'est la même
     * page écrite en français. Trois choix de vocabulaire tiennent la page entière :
     * « vraisemblable » et « valide » restent deux mots distincts, parce que la différence
     * entre les deux est le sujet du comparatif ; « le sujet du test » remplace toute
     * formule où le test « parlerait » de quelque chose ; « la préparation » remplace
     * « l'arrange », qui est un mot anglais porté en français sans rien pour l'expliquer.
     */
    /**
     * No question mark, and it was measured rather than argued. French would normally mark a
     * title opening on « Pourquoi », but this string is also the nav label and the page
     * title, and at 375px « Pourquoi JustDummies ? » needs 338 pixels of a 328-pixel column:
     * it wraps to two lines where the English heading and the playground's own take one, and
     * `chrome-parity.spec.ts` measures the two applications against each other on this very
     * page. Every place the page genuinely asks the reader something — the three questions at
     * the top, the four families, the ten criteria — keeps its mark.
     */
    'why.heading': 'Pourquoi JustDummies',
    'why.meta.description':
        "Quand choisir JustDummies, Bogus, AutoFixture ou une valeur écrite à la main — critère par critère, y compris là où les autres font mieux.",

    'why.lede':
        "JustDummies produit les valeurs arbitraires dont un test a besoin, et vous laisse énoncer les règles que ces valeurs doivent respecter.",

    'why.toc.label': 'Sur cette page',

    'why.transition.body':
        "Dans un test, toutes les valeurs ne portent pas le scénario. Celles qui ne le portent pas doivent quand même respecter les règles du domaine — c'est cette partie-là que JustDummies prend en charge.",
    'why.transition.homeLink': "Voir l'exemple complet, étape par étape.",

    'why.choose.heading': 'Lequel de ces besoins est le vôtre ?',
    'why.choose.lede':
        "Ces quatre réponses passent souvent pour des rivales. Elles répondent à quatre questions différentes, et la plupart des projets s'en posent plusieurs. Cherchez la phrase que vous diriez à voix haute.",

    'why.tool.repoLink': 'Voir le dépôt',

    'why.tool.justdummies.need': "Peu m'importe cette valeur, mais elle doit être valide.",
    'why.tool.justdummies.description':
        "Des valeurs arbitraires pour tout ce qu'un test ne vérifie pas, avec les règles qu'elles doivent respecter, écrites là où le test demande la valeur.",
    'why.tool.justdummies.concretely':
        "Concrètement : une référence commençant toujours par ORD-, alphanumérique en majuscules après ce préfixe, d'une longueur comprise entre huit et vingt caractères, et tirée à chaque exécution.",

    'why.tool.bogus.need': "J'ai besoin de données qui ont l'air vraies.",
    'why.tool.bogus.description':
        "Un générateur simple de fausses données pour C#, F# et VB.NET — le portage du célèbre faker.js.",
    'why.tool.bogus.concretely':
        "Concrètement : des noms, des adresses, des e-mails, des numéros de téléphone, des libellés de produits — adaptés à la locale, et crédibles pour qui regarde une capture d'écran ou une base de démonstration.",
    'why.tool.bogus.chooseInstead':
        "Choisissez Bogus quand les données doivent être vraisemblables : noms, adresses, e-mails, une base de démonstration que quelqu'un va lire. Son catalogue est adapté à la locale, un travail que vous feriez sinon à la main. JustDummies tire des valeurs valides, pas des valeurs crédibles.",
    'why.tool.bogus.checked':
        "Lu : le catalogue adapté à la locale (Name, Address, Internet, Commerce), RuleFor et les règles qui se chaînent sur un Faker<T> construit sur place, les tirages bornés comme Random.Int(min, max), StrictMode et AssertConfigurationIsValid, UseSeed et Randomizer.Seed, et l'offre payante Bogus Premium, dont l'analyseur signale un RuleFor manquant et sait l'insérer.",

    'why.tool.autofixture.need': "Construisez-moi l'objet, son contenu m'est égal.",
    'why.tool.autofixture.description':
        "Une bibliothèque qui vous dispense d'écrire à la main les variables anonymes dont la préparation d'un test a besoin.",
    'why.tool.autofixture.concretely':
        "Concrètement : un appel renvoie un objet entièrement rempli, y compris tout ce qu'il contient et les types dont vous n'avez pas le code — sans que vous ayez rien déclaré nulle part.",
    'why.tool.autofixture.chooseInstead':
        "Choisissez AutoFixture quand le test a besoin d'un objet entier et n'a rien à dire de son contenu. Un appel remplit l'objet et tout ce qu'il contient, y compris les types dont vous n'avez pas le code. JustDummies, lui, part des règles : là où il n'y a aucune règle à énoncer, il ajoute une étape et n'apporte rien.",
    'why.tool.autofixture.checked':
        "Lu : des valeurs anonymes plutôt que réalistes, la construction automatique de valeurs de presque n'importe quel type, la prise en compte des annotations [Range], [StringLength] et [RegularExpression] sans configuration, la surcharge Build<T>().With(...), la voie séparée ISpecimenBuilder et Customize<T>(), et la demande toujours ouverte d'un tirage aléatoire rejouable.",

    'why.tool.manual.name': 'Valeur en dur',
    'why.tool.manual.need': "Cette valeur précise, c'est ce que le test vérifie.",
    'why.tool.manual.description':
        "Aucune bibliothèque : la valeur tapée directement dans le test, sur la ligne qui l'utilise.",
    'why.tool.manual.concretely':
        "Concrètement : le montant qu'une assertion compare, ou le statut dont dépend un comportement. Le lecteur le voit sans quitter le test.",
    'why.tool.manual.chooseInstead':
        "Écrivez la valeur en clair quand elle est le sujet du test — le montant qu'une assertion compare, le statut dont dépend un comportement. Le lecteur voit la valeur exacte sur la ligne qui l'utilise. Une valeur tirée l'obligerait à croire sur parole qu'elle convient.",

    'why.compare.heading': 'JustDummies face aux alternatives',
    'why.compare.lede':
        "Dix critères, chacun posé comme une question sur vos propres tests, puis tranché pour les quatre options.",

    'why.legend.heading': 'Les trois réponses',
    'why.legend.core': "L'outil est fait pour ça, et il le fait sans configuration supplémentaire.",
    'why.legend.possible':
        "On y arrive, mais il faut écrire quelque chose pour y arriver. La note dit quoi.",
    'why.legend.outOfScope':
        "L'outil ne le fait pas. Parfois parce que ses auteurs en ont décidé ainsi, parfois parce que personne ne l'a encore écrit — la note précise lequel des deux.",
    'why.legend.order':
        "Les critères sont regroupés selon les questions que vous pouvez vous poser dans vos tests, pas selon les points forts de JustDummies. Et JustDummies ne cherche volontairement pas à répondre à tous les besoins : son objectif est de bien faire une seule chose, générer les valeurs arbitraires et contraintes dont vos tests ont besoin.",

    'why.legend.definitionsLabel': 'Ce que veut dire chaque réponse',

    'why.rating.core': 'Conçu pour ça',
    'why.rating.possible': 'Possible, avec du travail',
    'why.rating.outOfScope': "Ce n'est pas son rôle",

    'why.duel.label': 'Comparer JustDummies avec',
    'why.duel.everything': 'les trois autres options',
    'why.duel.showingOne': 'Affiché : JustDummies et',
    'why.duel.showingAll': 'Affiché : JustDummies et les trois autres options.',

    'why.family.accepted': 'La valeur passera-t-elle mon propre code ?',
    'why.family.readable': 'Mon test restera-t-il lisible ?',
    'why.family.kind': "De quelle nature de valeur ai-je besoin ?",
    'why.family.wrong': 'Que se passe-t-il quand ça casse, et qui écrit la préparation ?',

    'why.axis.termLabel': 'Terme technique :',

    'why.axis.invariants.label': 'Les valeurs que votre code accepte',
    'why.axis.invariants.question': 'La valeur produite passera-t-elle mon propre constructeur ?',
    'why.axis.invariants.explanation':
        "La plupart des types du domaine refusent ce qui ne leur convient pas. OrderReference.Create rejette une chaîne qui ne commence pas par ORD-, celles qui font moins de huit caractères ou plus de vingt, et celles qui portent après le préfixe autre chose qu'une lettre majuscule ou un chiffre. Un test qui a besoin d'une référence quelconque a quand même besoin d'une référence qui passe tous ces contrôles.",
    'why.axis.invariants.term': 'invariant métier, ou précondition en design par contrat',

    'why.axis.callSite.label': 'Des règles énoncées sur place',
    'why.axis.callSite.question':
        "Puis-je écrire « un nombre quelconque entre 1 et 100 » sur la ligne qui en a besoin ?",
    'why.axis.callSite.explanation':
        "Certaines règles appartiennent à un test plutôt qu'au domaine : cette quantité vaut au moins deux, cette date est passée. La question est de savoir si vous pouvez le dire là où le test demande la valeur, ou s'il faut d'abord déclarer un type, enregistrer une configuration ou monter une fixture.",
    'why.axis.callSite.term': "point d'appel — l'endroit exact du code où la valeur est demandée",

    'why.axis.testIntent.label': 'Voir quelle valeur le test vérifie',
    'why.axis.testIntent.question': "Un lecteur peut-il dire de quelles valeurs dépend l'assertion ?",
    'why.axis.testIntent.explanation':
        "Un test qui construit une commande à partir de quatre arguments ne dit pas sur lequel des quatre il porte. En tirer trois et écrire le quatrième en clair répond à la question dans la préparation elle-même.",

    'why.axis.reuse.label': 'Décrire un objet valide une seule fois',
    'why.axis.reuse.question':
        'Le jour où mon type gagne un paramètre de constructeur, combien de fichiers de test dois-je rouvrir ?',
    'why.axis.reuse.explanation':
        "Ce qui décrit une commande valide — une chaîne de contraintes, un jeu de règles, un builder — mérite d'être écrit une fois et appelé partout. La question est de savoir ce que cela coûte à mettre en place, et quelle part l'outil en écrit pour vous.",

    'why.axis.realism.label': 'Des données vraisemblables',
    'why.axis.realism.question': 'Cette valeur sera-t-elle lue par un humain, ou seulement par une assertion ?',
    'why.axis.realism.explanation':
        "Valide et vraisemblable ne sont pas la même chose. Une référence qui respecte toutes les règles peut très bien ressembler à du bruit. C'est sans importance dans une assertion, et gênant dans une capture d'écran.",
    'why.axis.realism.term': 'fausses données — la famille des bibliothèques faker',

    'why.axis.graph.label': 'Remplir les objets imbriqués à votre place',
    'why.axis.graph.question':
        "Mon type a trois niveaux d'imbrication et le test ne s'intéresse à aucun : qui les remplit ?",
    'why.axis.graph.explanation':
        "Une commande contient un client, qui contient une adresse. Soit un outil inspecte votre classe et remplit tous les niveaux, soit vous fournissez un générateur par type et vous les assemblez.",
    'why.axis.graph.term': "graphe d'objets",

    'why.axis.reproducibility.label': "Rejouer l'exécution qui a échoué",
    'why.axis.reproducibility.question':
        'La CI est passée au rouge sur une valeur tirée. Puis-je récupérer exactement cette valeur ?',
    'why.axis.reproducibility.explanation':
        "Des valeurs qui changent à chaque exécution, c'est un test qui peut échouer aujourd'hui et passer demain. Ce qui rend la chose vivable, c'est un numéro que l'exécution en échec rapporte, et qui retire exactement les mêmes valeurs quand vous le recollez.",
    'why.axis.reproducibility.term': 'seed',

    'why.axis.compileTime.label': "Détecté avant même de lancer le test",
    'why.axis.compileTime.question': "Est-ce que je l'apprends dans l'éditeur, ou dix minutes plus tard ?",
    'why.axis.compileTime.explanation':
        "Une chaîne de contraintes peut se contredire : trois caractères au plus, et commençant par ORD-. Rien ne satisfait les deux. La question est de savoir si cela apparaît comme une erreur de compilation, ou comme une exception à la première exécution.",
    'why.axis.compileTime.term': 'analyseur Roslyn',

    'why.axis.codeGen.label': 'Un outil qui écrit la préparation pour vous',
    'why.axis.codeGen.question':
        'Dois-je écrire à la main un builder pour chacun de mes quarante types du domaine ?',
    'why.axis.codeGen.explanation':
        "Les contraintes d'une commande, c'est un fichier que quelqu'un doit écrire, puis réécrire le jour où le type gagne un paramètre. La question est de savoir si un outil lit vos propres sources et l'écrit. Ce qu'il écrit est du C# ordinaire, dans votre projet de test : vous le lisez, vous le modifiez, vous le committez.",
    'why.axis.codeGen.term':
        "scaffolding — et non un générateur de source, qui tourne à la compilation et ne vous laisse aucun fichier",

    'why.axis.exploration.label': 'Chercher la valeur qui casse votre code',
    'why.axis.exploration.question':
        "Est-ce que je veux une valeur quelconque, ou des centaines à la recherche d'un contre-exemple ?",
    'why.axis.exploration.explanation':
        "Une valeur tirée par exécution vous dit que le code a tenu pour cette valeur-là. L'approche inverse exécute la même assertion sur des centaines d'entrées générées, puis réduit tout échec à la plus petite entrée qui échoue encore.",
    'why.axis.exploration.term': 'property-based testing, et shrinking',
    'why.axis.exploration.elsewhere':
        "Aucune des quatre options ne le fait. En .NET, on se tourne d'ordinaire vers FsCheck ou CsCheck, et ils cohabitent avec n'importe laquelle d'entre elles plutôt que de la remplacer.",

    'why.matrix.summary': 'Tableau comparatif complet',
    'why.matrix.intro':
        "Toutes les réponses en un coup d'œil, sans leurs notes. Chaque critère renvoie au bloc qui l'explique plus bas.",
    'why.table.caption': "Quatre façons d'obtenir une valeur de test, critère par critère.",
    'why.table.axisHeader': 'Critère',

    'why.note.justdummies.reuse':
        "Il faut d'abord écrire le générateur, dans votre propre projet de test ; ensuite, tous vos tests l'appellent. L'outil dum — le CLI compagnon de la bibliothèque — peut écrire ce fichier pour vous. Un simple appel ne le fait pas apparaître.",
    'why.note.justdummies.realism':
        "Valides, pas vraisemblables. Il n'y a ici aucun catalogue de noms, d'adresses ou d'e-mails.",
    'why.note.justdummies.graph':
        "Vous fournissez un générateur par type et vous les composez. Rien n'inspecte votre classe pour remplir les niveaux du dessous.",
    'why.note.justdummies.reproducibility':
        "Un cas de test qui échoue rapporte son seed, et ce seed retire exactement les mêmes valeurs. Chaque cas tire le sien : une suite qui tourne en parallèle vous rend donc bien celui du cas qui a échoué. C'est l'adaptateur xUnit qui le fournit ; il n'existe aujourd'hui ni adaptateur NUnit ni adaptateur MSTest.",
    'why.note.justdummies.compileTime':
        "Les analyseurs sont livrés gratuitement dans le paquet principal, sans palier payant : installer la bibliothèque les installe. Ils détectent immédiatement, dans l'éditeur, une contrainte contradictoire — par exemple trois caractères au plus, et devant commencer par ORD-. Ce qui reste hors de portée ici, c'est un invariant métier que personne n'a déclaré comme règle : il vit dans le code ordinaire d'un constructeur, sans liste structurée des invariants d'un type à laquelle un analyseur pourrait le confronter. C'est plus étroit qu'il n'y paraît : l'analyseur de Bogus Premium peut signaler une propriété sans RuleFor, parce que les propriétés d'un Faker<T> forment un ensemble connu et énumérable. Les invariants d'un constructeur écrit à la main ne le sont pas.",
    'why.note.justdummies.codeGen':
        "L'outil dum lit votre type et écrit le générateur dans votre projet de test. Le fichier est du C# ordinaire, et il vous appartient : à vous de le modifier et de le committer.",
    'why.note.justdummies.exploration':
        "Chaque exécution tire une valeur, et vous pouvez la tirer de nouveau à l'identique. Il n'y a pas de balayage systématique à la recherche de l'entrée qui échoue.",

    'why.note.bogus.invariants':
        "Un Faker<T> respecte une règle métier dès qu'un RuleFor est écrit pour elle — ou un CustomInstantiator qui appelle la fabrique du type. StrictMode(true) vérifie ensuite que chaque propriété a bien une règle. Ce qu'aucun contrôle ne couvre, c'est de savoir si une règle produit une valeur que le domaine accepterait.",
    'why.note.bogus.callSite':
        "Un Faker<T> peut être construit sur place dans le test, juste avant Generate, avec ses règles dessus — Random.Int(min, max) et consorts. Il faut simplement les réécrire dans chaque test qui en a besoin.",
    'why.note.bogus.testIntent':
        "RuleFor(x => x.Prop, expected) épingle la valeur exacte que vérifie l'assertion : le sujet du test est donc écrit noir sur blanc. Les règles autour le sont tout autant.",
    'why.note.bogus.reuse':
        "Un Faker<T> se définit une fois et se réutilise d'un test à l'autre, exactement comme un générateur JustDummies.",
    'why.note.bogus.graph':
        "Un objet imbriqué se construit à la main, dans la règle qui le produit. Bogus n'y descend pas à votre place.",
    'why.note.bogus.reproducibility':
        "UseSeed sur un Faker, ou Randomizer.Seed pour toute l'exécution, rend un tirage rejouable.",
    'why.note.bogus.compileTime':
        "Le paquet gratuit détecte une règle manquante à l'exécution : StrictMode(true) fait échouer Generate, et AssertConfigurationIsValid le vérifie à la demande. La détecter pendant que vous tapez, c'est l'analyseur de Bogus Premium, qui relève d'une licence payante.",
    'why.note.bogus.codeGen':
        "Le même analyseur Premium propose la règle manquante sous forme de correctif en un clic dans l'éditeur. C'est une aide d'une autre nature qu'un fichier écrit par un outil et que vous gardez.",
    'why.note.bogus.exploration':
        "Bogus remplit des valeurs. Il n'exécute pas votre test en boucle pour en trouver une qui échoue.",

    'why.note.autofixture.invariants':
        "Une règle que le type porte sous forme d'annotation — [Range], [StringLength], [RegularExpression] — est déjà respectée, sans aucune configuration. Une règle appliquée à l'intérieur d'un constructeur, c'est l'autre cas : la génération échoue tant qu'un Register, un Customize<T> ou un ISpecimenBuilder n'a pas été écrit pour la satisfaire.",
    'why.note.autofixture.callSite':
        "Une règle portée par le type est respectée partout, sans une ligne dans le test. Une règle propre à ce test-là s'écrit sur place via Build<T>().With(x => x.Prop, value) — une valeur épinglée, ou une lambda que vous écrivez, une propriété à la fois.",
    'why.note.autofixture.testIntent':
        "C'est l'objectif qu'AutoFixture se donne lui-même : les valeurs dont le test se moque disparaissent, parce que vous ne les décrivez jamais. Ce qui disparaît avec elles, c'est tout énoncé de ce que ces valeurs doivent respecter.",
    'why.note.autofixture.reuse':
        "Une ICustomization rassemble un jeu de règles écrit une seule fois, dans une classe à part, et chaque test qui l'active en hérite.",
    'why.note.autofixture.realism':
        "Les valeurs sont anonymes par conception — une chaîne, c'est un nom de propriété suivi d'un GUID. Ressembler à du réel n'est pas ce qu'AutoFixture cherche à faire.",
    'why.note.autofixture.reproducibility':
        "Il n'y a pas de seed à fixer : une exécution ne se rejoue pas valeur pour valeur. C'est un manque, pas une décision — le tirage aléatoire rejouable est une demande encore ouverte chez le projet, déposée en septembre 2023.",
    'why.note.autofixture.compileTime':
        "Aucun analyseur n'est livré avec. Une configuration incapable de produire une valeur se découvre à l'exécution du test.",
    'why.note.autofixture.codeGen':
        "Rien n'écrit de fichier à votre place, et c'est l'inverse qui est visé : sans règle à déclarer, il n'y a pas de code de préparation à écrire.",
    'why.note.autofixture.exploration':
        "Une valeur anonyme par demande, pas une recherche de celle qui met votre code en défaut.",

    'why.note.manual.invariants':
        "La valeur est valide parce que quelqu'un l'a choisie ainsi, et pour cette seule raison. Rien ne vérifie qu'elle l'est restée depuis.",
    'why.note.manual.callSite':
        "La règle n'est jamais énoncée. Vous choisissez une valeur qui la respecte, et la règle reste dans la tête de celui qui l'a choisie.",
    'why.note.manual.testIntent':
        "Elle montre sans détour la valeur qui est le sujet du test. Employée aussi pour les paramètres autour, la préparation gagne une ligne par paramètre, et le sujet cesse de ressortir.",
    'why.note.manual.reuse':
        "Une valeur peut être extraite dans une constante nommée ou un helper, puis partagée. Vous la maintenez alors à la main, et tous les tests qui la partagent tournent sur la même valeur.",
    'why.note.manual.realism':
        "Aussi vraisemblable que la valeur que vous tapez : marie.durand@acme.fr l'est autant qu'une valeur générée. Il faut la retaper au test suivant.",
    'why.note.manual.graph':
        "Chaque objet imbriqué se construit à la main, niveau par niveau, et le constructeur de chacun est une ligne que vous écrivez puis maintenez.",
    'why.note.manual.reproducibility':
        "La même valeur à chaque exécution, puisque c'est celle que vous avez tapée. Rien à rejouer, et rien qui varie.",
    'why.note.manual.compileTime':
        "Le compilateur accepte toute valeur du bon type — une chaîne trop longue, par exemple. Seul le constructeur du domaine l'arrête, à l'exécution.",
    'why.note.manual.codeGen': "Vous la tapez. Il n'y a rien à générer.",
    'why.note.manual.exploration': 'Une valeur, choisie une fois, et la même pour toute la vie du test.',

    'why.instead.heading': 'Quand un autre outil est la bonne réponse',
    'why.instead.lede': "Trois cas où l'une des autres options est le bon choix.",

    'why.notFor.heading': 'Quand ne pas utiliser JustDummies',
    'why.notFor.lede': 'Les cas où un autre outil, ou aucun outil, vaut mieux.',
    'why.notFor.realism.label': 'Les données doivent être vraisemblables.',
    'why.notFor.realism.body':
        "Une démo, une capture d'écran, une base que quelqu'un va parcourir. Prenez un générateur de fausses données. Une valeur valide n'est pas une valeur crédible.",
    'why.notFor.exploration.label': "Vous voulez que le test parte chercher un contre-exemple.",
    'why.notFor.exploration.body':
        "Exécuter une même assertion sur des centaines d'entrées générées, puis réduire un échec à son plus petit cas, c'est du property-based testing. JustDummies tire une valeur par exécution, et ce n'est pas cet outil-là.",
    'why.notFor.secrets.label': "Vous avez besoin d'un mot de passe, d'un jeton ou d'une clé.",
    'why.notFor.secrets.body':
        "Les générateurs produisent des valeurs de test, pas des secrets. Rien de ce qui est tiré ici n'est propre à servir d'élément d'authentification, dans un test comme ailleurs.",

    'why.tryIt.heading': 'Essayez-le',
    'why.tryIt.body':
        "Ajoutez le paquet à un projet de test et changez une ligne dans une seule préparation. Tous les autres tests restent tels quels. Bogus, AutoFixture, vos propres builders et toutes les valeurs que vous avez déjà écrites continuent de fonctionner, dans le même projet et dans le même fichier. S'il ne fait pas ses preuves, revenir en arrière consiste à supprimer les lignes ajoutées.",
    'why.tryIt.install': 'Installer la bibliothèque',

    'why.sources.heading': 'Comment ce comparatif a été vérifié',
    'why.sources.body':
        "Toute affirmation portant sur un autre projet vient de sa propre documentation ou de son dépôt. Ce qui a été lu, et où, figure ci-dessous.",
    'why.verified.label': 'Dernière vérification :',
    'why.sources.mentioned': 'Cités sans être comparés',
    'why.sources.mentionedBody':
        "Les deux bibliothèques de property-based testing vers lesquelles cette page renvoie, pour le seul critère auquel aucune des quatre options ne répond. Toutes deux ont été lues pour confirmer qu'elles font bien ce que la page en dit.",
    'why.report.prompt':
        "Si vous maintenez l'un de ces projets et que cette page le décrit mal, une issue est le moyen le plus rapide d'obtenir une correction.",
    'why.report.label': 'Ouvrir une issue',

    'releaseNotes.heading': 'Release notes',
    'releaseNotes.lead':
        "Cette page recense les nouveautés et les changements de JustDummies : nouvelles fonctionnalités, améliorations, corrections de bugs et dépréciations. Elle sert à voir ce qui a été livré dans la dernière release, à confirmer depuis quand une fonctionnalité est disponible, ou à passer en revue les changements avant de monter de version.",
    'releaseNotes.meta.description': 'Ce qui a changé dans JustDummies, release après release, pour chaque paquet publié.',
    'releaseNotes.snapshotLabel': 'Instantané pris au tag',
    'releaseNotes.viewSource': 'Lire le changelog technique',

    'releaseNotes.train.lib': 'Bibliothèque principale',
    'releaseNotes.train.xunit': 'Adaptateur xUnit',
    'releaseNotes.train.catalog': 'Catalogue de diagnostics',
    'releaseNotes.train.cli': 'CLI — dum',

    'releaseNotes.viewOnGithub': 'Voir sur GitHub',

    'releaseNotes.packages': 'Paquets',
    'releaseNotes.contents': 'Versions',
    'releaseNotes.majorLabel': 'Version',
    /* Not 'version'/'versions' — a card already reads 'Version 1' from majorLabel above, and
       counting its releases with the same word gave 'Version 1 · 2 versions', one noun for two
       different things on one row. 'release' is what this repository already calls the other
       one, in French, everywhere else it says it: the release-notes skill, ADR-0020's French
       text, and the lead two paragraphs above these cards (ui.ts, releaseNotes.lead). Kept as
       the English loanword on purpose — b9b2f43 decided this audience reads that word in
       English — and feminine in that use, agreeing with 'Dernière' below. */
    'releaseNotes.releases.one': 'release',
    'releaseNotes.releases.many': 'releases',

    'releaseNotes.latestLabel': 'Dernière',
    'releaseNotes.readNotes': 'Lire les release notes',

    'download.heading': 'Téléchargement',
    'download.lead':
        "Toutes les commandes d'installation de JustDummies, avec l'outil que vous utilisez déjà — la CLI .NET ou la console du gestionnaire de packages.",
    'download.meta.description':
        "Commandes d'installation de JustDummies : la bibliothèque, l'adaptateur xUnit et la CLI — en CLI .NET et en console du gestionnaire de packages.",
    'download.cta': 'Télécharger',

    'docs.heading': 'Documentation',
    'docs.meta.description': "Guides, la référence des générateurs, la présentation des packages et chaque règle d'analyseur — toute la documentation utilisateur de JustDummies.",
    'docs.lead':
        "Toute la documentation utilisateur de JustDummies : comment l'utiliser, ce que produit chaque générateur, à quoi sert chaque package, et ce que détecte chaque règle d'analyseur.",
    'docs.nav.toggle': 'Sections de la documentation',
    'docs.nav.heading': 'Sections',

    'docs.section.guides.label': 'Guides',
    'docs.section.guides.description': "Du premier dummy à la composition de vos propres générateurs — les concepts, et comment ils s'articulent.",
    'docs.section.generators.label': 'Générateurs',
    'docs.section.generators.description': 'Chaque factory Any.*, regroupée par nature de valeur produite.',
    'docs.section.packages.label': 'Packages',
    'docs.section.packages.description': "Les quatre packages publiés par cette bibliothèque, et celui dont un projet a réellement besoin.",
    'docs.section.analyzers.label': "Règles d'analyseur",
    'docs.section.analyzers.description': "Les 33 règles vérifiées à la compilation, embarquées dans la bibliothèque, de JD001 à JD033.",

    'docs.sourceLink': 'Lire la source, ou la corriger là-bas',
    'docs.pinnedAt': 'Repris depuis',

    'footer.nav': 'Pied de page',
    'footer.about': 'À propos',
    'footer.privacy': 'Confidentialité',
    'footer.api': 'API',
    'footer.releaseNotes': 'Release notes',
    'footer.docs': 'Docs',
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
