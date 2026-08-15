import { expect, test, type Locator, type Page, type Response } from '@playwright/test';

/**
 * /release-notes reads a snapshot of the library's own CHANGELOG.md files (see
 * release-notes.ts and scripts/generate-release-notes.mjs), laid out one train at a
 * time behind a tab widget that follows InstallTabs.astro's own pattern — which is
 * what these checks mostly exist to confirm still holds on a second component built
 * the same way.
 */
const PAGES: ReadonlyArray<{ path: string; heading: string; firstTrain: string }> = [
    { path: '/release-notes', heading: 'Release notes', firstTrain: 'Core library' },
    { path: '/fr/release-notes', heading: 'Notes de version', firstTrain: 'Bibliothèque principale' },
];

for (const { path, heading, firstTrain } of PAGES) {

    test(`${path} answers, and wears the site's clothes`, async ({ page }) => {
        const response: Response | null = await page.goto(path);

        expect(response?.status(), `${path} did not answer`).toBe(200);

        await expect(page.locator('h1')).toHaveText(/JustDummies/);
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        await expect(page.locator('.site-footer')).toBeVisible();
    });

    test(`${path} opens on the core library, tab selected and its releases showing`, async ({ page }) => {
        await page.goto(path);

        const firstTab = page.locator('[data-tab]').first();

        await expect(page.locator('[data-tablist]')).toBeVisible();
        await expect(firstTab).toHaveAttribute('aria-selected', 'true');
        await expect(firstTab).toHaveText(firstTrain);
        await expect(page.locator('[data-panel]').first()).toBeVisible();
    });

    test(`${path} needs no script to reach every train`, async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false });
        const p = await context.newPage();

        await p.goto(path);

        // ADR-0004, checked the same way content-pages.spec.ts checks it for About and
        // Privacy: the tablist is a control this reader cannot honour, so it stays
        // absent, and what it would have hidden is in the page regardless — all four
        // trains, stacked, not just the one behind the default tab.
        await expect(p.locator('[data-tablist]:visible')).toHaveCount(0);
        await expect(p.locator('[data-panel]')).toHaveCount(4);

        for (const panel of await p.locator('[data-panel]').all()) {
            await expect(panel).toBeVisible();
        }

        await expect(p.locator('main')).toBeVisible();
        await expect(p.locator('.site-footer')).toBeVisible();

        await context.close();
    });

}

test.describe('the train tabs', () => {

    async function trainKeys(page: Page): Promise<string[]> {
        return page.locator('[data-tab]').evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute('data-tab') ?? ''));
    }

    test('switch between trains, and back, showing exactly one at a time', async ({ page }) => {
        await page.goto('/release-notes');

        const keys = await trainKeys(page);
        const [lib, xunit] = keys;

        const libTab = page.locator(`[data-tab="${lib}"]`);
        const xunitTab = page.locator(`[data-tab="${xunit}"]`);
        const libPanel = page.locator(`[data-panel="${lib}"]`);
        const xunitPanel = page.locator(`[data-panel="${xunit}"]`);

        await expect(libPanel).toBeVisible();
        await expect(xunitPanel).toBeHidden();

        await xunitTab.click();

        await expect(xunitTab).toHaveAttribute('aria-selected', 'true');
        await expect(libTab).toHaveAttribute('aria-selected', 'false');
        await expect(xunitPanel).toBeVisible();
        await expect(libPanel).toBeHidden();

        await libTab.click();

        await expect(libTab).toHaveAttribute('aria-selected', 'true');
        await expect(libPanel).toBeVisible();
        await expect(xunitPanel).toBeHidden();
    });

    test('are announced as tabs, and their panel stops repeating the label, only once they can switch', async ({
        page,
    }) => {
        await page.goto('/release-notes');

        const tab = page.locator('[data-tab]').first();
        const panel = page.locator('[data-panel]').first();

        await expect(tab).toHaveAttribute('role', 'tab');
        await expect(panel).toHaveAttribute('role', 'tabpanel');
        await expect(panel).toHaveAttribute('aria-labelledby', await tab.getAttribute('id'));

        // The panel's own heading duplicated the tab once scripting could not be relied
        // on to remove it — see InstallTabs.astro's identical panel-label treatment.
        await expect(panel.locator('[data-panel-label]')).toBeHidden();
    });

    test('every train reachable by keyboard from any other', async ({ page }) => {
        await page.goto('/release-notes');

        const keys = await trainKeys(page);
        const lastTab = page.locator(`[data-tab="${keys[keys.length - 1]}"]`);

        await page.locator('[data-tab]').first().focus();
        await page.keyboard.press('ArrowLeft');

        await expect(lastTab).toBeFocused();
        await expect(lastTab).toHaveAttribute('aria-selected', 'true');
    });

});

test.describe('a section with more than three entries', () => {

    test('folds the rest behind a native disclosure, openable without scripting', async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();

        await page.goto('/release-notes');

        const count = await page.locator('details.more').count();

        // Whether any section overflows is a fact of the current snapshot, not of this
        // component — nothing to fold, nothing to check, on a day every section is short.
        test.skip(count === 0, 'no section in the current snapshot has more than three entries');

        const details = page.locator('details.more').first();
        const hiddenItem = details.locator('.bullets li').first();

        await expect(hiddenItem).toBeHidden();

        await details.locator('summary').click();

        await expect(hiddenItem).toBeVisible();

        await context.close();
    });

});

test('a release links to its own tag or comparison on GitHub, safely', async ({ page }) => {
    await page.goto('/release-notes');

    const link: Locator = page.locator('[data-panel] .release-foot a').first();

    await expect(link).toHaveAttribute('href', /^https:\/\/github\.com\/Reefact\/just-dummies\//);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
});

test('the page names the changelog it was read from, and says when', async ({ page }) => {
    await page.goto('/release-notes');

    const source = page.locator('.snapshot a');

    await expect(source).toHaveAttribute('href', 'https://github.com/Reefact/just-dummies');
    await expect(page.locator('.snapshot time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/);
});
