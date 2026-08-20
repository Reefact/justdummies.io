import { expect, test } from './support/harness';
import type { Locator, Page, Response } from '@playwright/test';

/**
 * /release-notes mirrors the library's own release-notes files — one page per train and
 * major version, the majors themselves a fact of the current snapshot rather than of this
 * suite (ADR-0019, ADR-0020). So nothing here lists them: the routes under test are read
 * from the section's own front page, which is also what makes a missing link on that page
 * a failing test rather than a quiet omission.
 */
/** Where this site is published — `site` in apps/site/astro.config.mjs. A link on this origin
 *  is not sending the reader away, whatever protocol it is written with. */
const SITE_ORIGIN: string = 'https://justdummies.io';

const INDEXES: ReadonlyArray<{ path: string; heading: string; firstTrain: string }> = [
    { path: '/release-notes', heading: 'Release notes', firstTrain: 'Core library' },
    { path: '/fr/release-notes', heading: 'Release notes', firstTrain: 'Bibliothèque principale' },
];

async function majorRoutes(page: Page, indexPath: string): Promise<string[]> {
    await page.goto(indexPath);

    const hrefs: string[] = await page
        .locator('main a[href*="/release-notes/"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

    const routes = [...new Set(hrefs.filter((href) => /\/release-notes\/[a-z]+\/v\d+\/$/.test(href)))];

    expect(routes.length, `${indexPath} offers no train-and-major link at all`).toBeGreaterThan(0);

    return routes;
}

for (const { path, heading, firstTrain } of INDEXES) {

    test(`${path} answers, and wears the site's clothes`, async ({ page }) => {
        const response: Response | null = await page.goto(path);

        expect(response?.status(), `${path} did not answer`).toBe(200);

        await expect(page.locator('h1')).toHaveText(/JustDummies/);
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        await expect(page.locator('.site-footer')).toBeVisible();
    });

    test(`${path} presents every train, and names the tag it was taken at`, async ({ page }) => {
        await page.goto(path);

        // Four trains, each with its own card: the section's front page is the one view of
        // the four packages at once, which is the reason it is a page and not a redirect.
        await expect(page.locator('.train')).toHaveCount(4);
        await expect(page.locator('.train h3').first()).toHaveText(firstTrain);

        const tag: Locator = page.locator('.snapshot a[href^="https://github.com/Reefact/just-dummies/releases/tag/"]');

        await expect(tag).toBeVisible();
        await expect(tag).toHaveAttribute('rel', /noopener/);
    });

    /*
     * SCOPED TO THE RULE, NOT TO A CLASS, which is the whole reason this exists.
     *
     * site-header.spec.ts states the rule — a link that leaves the site opens in a new tab and
     * says so — and then asserts it against `.site-nav` alone. Every one of the site's other 79
     * outbound links happened to obey it; the 22 inside the mirrored prose did not, and nothing
     * looked. They arrive as finished HTML from a generator, so within one release card a screen
     * reader announced the tag link at the foot and stayed silent on the five links in the
     * bullets above it.
     *
     * This walks whatever `main` actually holds, on whatever majors the snapshot currently
     * publishes, so a link added by a future release of the library is covered on the day it
     * lands rather than on the day someone remembers to add it here.
     */
    test(`${path} sends every outbound link in a release off-site in a new tab, and says so`, async ({ page }) => {
        const routes = await majorRoutes(page, path);

        for (const route of routes) {
            await page.goto(route);

            /*
             * "Leaves this site", not "starts with http" — and the difference is a test that
             * would punish the right behaviour. A note may link to one of this site's own
             * pages by its full address, and the generator deliberately keeps that in the
             * reader's tab; asking every http link for `target="_blank"` would turn the day
             * that happens into a red run.
             */
            const outward: Locator = page.locator(`main a[href^="http"]:not([href^="${SITE_ORIGIN}"])`);
            const count: number = await outward.count();

            expect(count, `${route} carries no outbound link at all`).toBeGreaterThan(0);

            for (let index = 0; index < count; index += 1) {
                const link: Locator = outward.nth(index);
                const href: string | null = await link.getAttribute('href');

                await expect(link, `${route}: ${href} stays in the reader's tab`).toHaveAttribute('target', '_blank');
                await expect(link, `${route}: ${href} opens a tab without rel=noopener`).toHaveAttribute('rel', /noopener/);
                await expect(
                    link.locator('.visually-hidden'),
                    `${route}: ${href} opens a new tab without saying so`,
                ).not.toHaveCount(0);
            }
        }
    });

    /*
     * The snapshot is pinned to one tag (ADR-0013), and a link is part of the snapshot. Links
     * written into the library's prose were passed through exactly as authored, which meant all
     * 22 said `/blob/main/` while the line above them named the tag — so following one landed on
     * whatever main had become since.
     */
    test(`${path} pins every link into the library to the tag the snapshot names`, async ({ page }) => {
        const routes = await majorRoutes(page, path);

        await page.goto(path);

        const snapshotHref: string | null = await page
            .locator('.snapshot a[href*="/releases/tag/"]')
            .first()
            .getAttribute('href');
        const ref: string = (snapshotHref ?? '').split('/releases/tag/')[1] ?? '';

        expect(ref, `${path} names no snapshot tag to pin against`).not.toBe('');

        for (const route of routes) {
            await page.goto(route);

            const refs: string[] = await page
                .locator('main a[href*="/just-dummies/blob/"], main a[href*="/just-dummies/tree/"]')
                .evaluateAll((links) =>
                    links.map((link) => (link.getAttribute('href') ?? '').split(/\/(?:blob|tree)\//)[1]?.split('/')[0] ?? ''),
                );

            for (const named of refs) {
                expect(named, `${route} links into the library at ${named}, not at the pinned ${ref}`).toBe(ref);
            }
        }
    });

    /*
     * ASKED OF EVERY ROUTE, not of the one that happens to be written down elsewhere.
     *
     * This loop already discovers all ten majors from the index, and it used to ask them two
     * questions: did you answer, and is there a release on you. Every structural assertion in
     * this file was spent on /release-notes/lib/v1/ and its French twin, so eight of the twelve
     * routes were covered by "200, and shows at least one card".
     *
     * That is thinner than it sounds. The generator writes ten files from four different
     * upstream changelogs, and a shape only one train's file carries reaches the reader through
     * routes nobody looks at — a release whose tag was never published renders without its
     * footer link, and lib is the only train with two majors, so the chip that names the other
     * major exists on two routes and is asserted on one.
     *
     * The three invariants below are the cheap ones, and they hold by construction rather than
     * by content: the contents lists exactly the releases and rubrics the page draws, and every
     * entry points at something. They cost no extra page load — the routes are already being
     * visited here — and they are what turns "it answered" into "it is whole".
     */
    test(`${path} links to a page for every train and major, and each one answers`, async ({ page }) => {
        const routes = await majorRoutes(page, path);

        for (const route of routes) {
            const response: Response | null = await page.goto(route);

            expect(response?.status(), `${route} did not answer`).toBe(200);

            // Its own content, not a shell: the releases this major published.
            await expect(page.locator('.release'), `${route} shows no release`).not.toHaveCount(0);

            // One entry per release, one per rubric: a table of contents that lists fewer than
            // the page holds is the fold this section refused (ADR-0020) arriving by accident.
            await expect(
                page.locator('[data-release-contents] .release-link'),
                `${route} lists a different number of releases than it draws`,
            ).toHaveCount(await page.locator('.release').count());

            await expect(
                page.locator('[data-release-contents] .rubrics a'),
                `${route} lists a different number of rubrics than it draws`,
            ).toHaveCount(await page.locator('.rubric').count());

            // And every entry lands somewhere. An anchor is the one part of this page a reader
            // can put in a bookmark or a bug report, and a stale one fails silently: the link
            // works, the jump does nothing.
            const dangling: string[] = await page
                .locator('[data-release-contents] a[href^="#"]')
                .evaluateAll((links) =>
                    links
                        .map((link) => link.getAttribute('href') ?? '')
                        .filter((href) => href.length > 1 && document.getElementById(href.slice(1)) === null),
                );

            expect(dangling, `${route} points its table of contents at ${dangling.join(', ')}, which is not there`).toEqual([]);
        }
    });

}

test.describe('a major version page', () => {

    test('opens with its own major expanded and the others one line away', async ({ page }) => {
        await page.goto('/release-notes/lib/v1/');

        const contents = page.locator('[data-release-contents]');

        await expect(contents.locator('.major-label.current')).toHaveText(/1/);

        // The other majors are links out of this page, not anchors into it: a different
        // major is a different page.
        const other: Locator = contents.locator('a.major-label');

        await expect(other).toHaveCount(1);
        await expect(other).toHaveAttribute('href', '/release-notes/lib/v0/');

        // The expanded major carries its releases, and each release its rubrics.
        await expect(contents.locator('.release-link')).toHaveCount(await page.locator('.release').count());
        await expect(contents.locator('.rubrics a').first()).toBeVisible();
    });

    test('scrolls to the rubric a table-of-contents entry names', async ({ page }) => {
        await page.goto('/release-notes/lib/v1/');

        const entry: Locator = page.locator('[data-release-contents] .rubrics a').last();
        const anchor: string = (await entry.getAttribute('href')) ?? '';

        await entry.click();

        // `toHaveURL` retries; reading `page.url()` straight after the click races the
        // fragment navigation and reports the address the page had a moment earlier.
        await expect(page).toHaveURL(`/release-notes/lib/v1/${anchor}`);
        await expect(page.locator(anchor)).toBeInViewport();
    });

    test('hides nothing behind a fold', async ({ page }) => {
        await page.goto('/release-notes/lib/v1/');

        // The "+N more" disclosure is gone with the stacked page it existed for: a table of
        // contents that points at a rubric must point at all of it (ADR-0020).
        await expect(page.locator('details.more')).toHaveCount(0);

        for (const bullet of await page.locator('.bullets li').all()) {
            await expect(bullet).toBeVisible();
        }
    });

    test('switches package by navigating, with no widget in between', async ({ page }) => {
        await page.goto('/release-notes/lib/v1/');

        const current = page.locator('nav a[aria-current="page"]');

        await expect(current).toHaveText('Core library');

        // Links, not tabs: nothing here is built at run time, so nothing announces a role it
        // cannot honour (ADR-0004, ADR-0020).
        await expect(page.locator('[role="tab"]')).toHaveCount(0);
        await expect(page.locator('[role="tabpanel"]')).toHaveCount(0);

        await page.getByRole('link', { name: 'CLI — dum' }).click();

        await expect(page).toHaveURL(/\/release-notes\/cli\/v1\/$/);
        await expect(page.locator('nav a[aria-current="page"]')).toHaveText('CLI — dum');
    });

    test('links a release to its own tag on GitHub, safely', async ({ page }) => {
        await page.goto('/release-notes/lib/v1/');

        const link: Locator = page.locator('.release-foot a').first();

        await expect(link).toHaveAttribute('href', /^https:\/\/github\.com\/Reefact\/just-dummies\/releases\/tag\//);
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);
    });

    /*
     * THE ONLY SCRIPT ON THIS PAGE, RUN AT A WIDTH WHERE IT DOES SOMETHING.
     *
     * The table of contents is a column on a desktop and a closed disclosure on a phone, and
     * the flip is done by nine lines of script against `(max-width: 56rem)`. Every other test
     * in this file runs at the one viewport playwright.config.ts declares — Desktop Chrome,
     * 1280x720 — which is the open side of that transition, so the whole narrow branch and the
     * `change` handler that returns from it had never been executed by anything.
     *
     * The handler is not decoration. A `<details>` closed by script on a phone has only its
     * `<summary>` to reopen it, and that summary is `display: none` above the breakpoint — so a
     * reader who closes the list and then rotates, or widens a window, would be left with a
     * table of contents that is closed, invisible, and impossible to reopen. That is what the
     * component's own comment says the resize listener exists to prevent, and this is what
     * proves it still does.
     */
    test('folds its contents on a phone, and unfolds them again when the screen grows', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/release-notes/lib/v1/');

        const contents: Locator = page.locator('[data-release-contents]');

        // Narrow: closed, and the control that can reopen it is on screen.
        await expect(contents, 'the contents stayed open on a phone').not.toHaveAttribute('open', /.*/);
        await expect(contents.locator('> summary'), 'nothing on a phone can open the contents').toBeVisible();

        await page.setViewportSize({ width: 1280, height: 900 });

        // Wide: open again, by the `change` handler rather than by a reload — and the summary
        // steps aside, which is precisely why the handler has to force `open` back on.
        await expect(contents, 'the contents stayed folded after the screen grew').toHaveAttribute('open', /.*/);
        await expect(contents.locator('.release-link').first(), 'the contents did not come back').toBeVisible();
        await expect(contents.locator('> summary'), 'the phone control is still drawn on a desktop').toBeHidden();
    });

    test('needs no script to be read, navigated or left', async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();

        await page.goto('/release-notes/lib/v1/');

        // Everything this page is made of works before a script could have run: the notes
        // themselves, the table of contents beside them, and the way out to another train.
        await expect(page.locator('.release').first()).toBeVisible();
        await expect(page.locator('[data-release-contents] .release-link').first()).toBeVisible();
        await expect(page.locator('[data-release-contents] a.major-label').first()).toBeVisible();
        await expect(page.locator('nav a[aria-current="page"]')).toBeVisible();
        await expect(page.locator('.site-footer')).toBeVisible();

        await context.close();
    });

});

/*
 * EVERY FRENCH MAJOR, not the one that was easiest to name.
 *
 * All three checks below used to open '/fr/release-notes/lib/v1/' by hand, fourteen lines under
 * a header stating the opposite principle and under a helper that already discovers the routes.
 * The failure they exist to catch — a page served from the English file (ADR-0019) — is silent:
 * the page renders, the layout is right, only the language is wrong. And the corpus is ten
 * separate upstream files, so it would appear on one train and not its neighbour, which is
 * exactly the shape a single hardcoded route cannot see.
 */
test.describe('the French pages', () => {

    test('carry the library\'s French prose, not its English', async ({ page }) => {
        const routes = await majorRoutes(page, '/fr/release-notes');

        for (const route of routes) {
            // The English twin of a French route is the same path without the prefix: the two
            // locales are the same route schema by construction (§6.2), which is what lets this
            // pair them rather than list them.
            await page.goto(route.replace('/fr/', '/'));

            const english: string[] = await page.locator('.rubric-label').allInnerTexts();

            await page.goto(route);

            const french: string[] = await page.locator('.rubric-label').allInnerTexts();

            expect(french.length, `${route} shows no rubric at all`).toBeGreaterThan(0);

            // The rubric headings are the library's own words, taken from its French file rather
            // than translated here — so the two locales cannot be showing the same strings
            // (ADR-0019). This is what goes red if the page ever reads the English changelog again.
            expect(french, `${route} shows the English rubric headings`).not.toEqual(english);
        }
    });

    /*
     * The anchor is the same in both locales on purpose, and until now nothing said so.
     *
     * It is derived from the English label in either language, so a deep link survives a reader
     * switching language mid-page — release-notes.ts and the generator both state that intent,
     * and neither is a check. It is hard to break by accident today, one shared expression
     * inside the per-locale loop; it would be easy to break on purpose, and a generator taught
     * to slug the localised label would strand every deep link in one locale while every other
     * test in this file stayed green.
     */
    test('anchor both locales the same way, so a deep link survives a switch', async ({ page }) => {
        const routes = await majorRoutes(page, '/fr/release-notes');

        for (const route of routes) {
            await page.goto(route.replace('/fr/', '/'));

            const english: string[] = await page
                .locator('[data-release-contents] a[href^="#"]')
                .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

            await page.goto(route);

            const french: string[] = await page
                .locator('[data-release-contents] a[href^="#"]')
                .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

            expect(french.length, `${route} offers no anchor at all`).toBeGreaterThan(0);
            expect(french, `${route} anchors its contents differently from its English twin`).toEqual(english);
        }
    });

    test('mark no prose as English, because none of it is', async ({ page }) => {
        const routes = await majorRoutes(page, '/fr/release-notes');

        for (const route of routes) {
            await page.goto(route);

            await expect(page.locator('html'), route).toHaveAttribute('lang', 'fr');
            await expect(page.locator('main [lang="en"]'), `${route} marks some of its prose English`).toHaveCount(0);
        }
    });

    test('offer the same page in the other locale', async ({ page }) => {
        const routes = await majorRoutes(page, '/fr/release-notes');

        for (const route of routes) {
            await page.goto(route);

            // The route is built from a parameterised file, which the routing module cannot read
            // from the file system — so this is what fails if it is ever left untaught.
            await expect(
                page.locator(`a[hreflang="en"][href="${route.replace('/fr/', '/')}"]`),
                `${route} offers no English twin`,
            ).toHaveCount(1);
        }
    });

});
