import { expect, test } from './support/harness';
import type { Locator, Page, Response } from '@playwright/test';

/**
 * /release-notes mirrors the library's own release-notes files — one page per train and
 * major version, the majors themselves a fact of the current snapshot rather than of this
 * suite (ADR-0019, ADR-0020). So nothing here lists them: the routes under test are read
 * from the section's own front page, which is also what makes a missing link on that page
 * a failing test rather than a quiet omission.
 */
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

    test(`${path} links to a page for every train and major, and each one answers`, async ({ page }) => {
        const routes = await majorRoutes(page, path);

        for (const route of routes) {
            const response: Response | null = await page.goto(route);

            expect(response?.status(), `${route} did not answer`).toBe(200);

            // Its own content, not a shell: the releases this major published.
            await expect(page.locator('.release'), `${route} shows no release`).not.toHaveCount(0);
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

test.describe('the French pages', () => {

    test('carry the library\'s French prose, not its English', async ({ page }) => {
        await page.goto('/release-notes/lib/v1/');

        const english: string[] = await page.locator('.rubric-label').allInnerTexts();

        await page.goto('/fr/release-notes/lib/v1/');

        const french: string[] = await page.locator('.rubric-label').allInnerTexts();

        expect(french.length, 'the French page shows no rubric at all').toBeGreaterThan(0);

        // The rubric headings are the library's own words, taken from its French file rather
        // than translated here — so the two locales cannot be showing the same strings
        // (ADR-0019). This is what goes red if the page ever reads the English changelog again.
        expect(french).not.toEqual(english);
    });

    test('mark no prose as English, because none of it is', async ({ page }) => {
        await page.goto('/fr/release-notes/lib/v1/');

        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page.locator('main [lang="en"]')).toHaveCount(0);
    });

    test('offer the same page in the other locale', async ({ page }) => {
        await page.goto('/fr/release-notes/lib/v1/');

        // The route is built from a parameterised file, which the routing module cannot read
        // from the file system — so this is what fails if it is ever left untaught.
        await expect(page.locator('a[hreflang="en"][href="/release-notes/lib/v1/"]')).toHaveCount(1);
    });

});
