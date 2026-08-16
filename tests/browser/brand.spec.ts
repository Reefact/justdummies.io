import { expect, test } from './support/harness';
import type { Page } from '@playwright/test';

/**
 * The brand is drawn in the same place on every page that carries it.
 *
 * It is one component — the mark, the name, the claim — and that was supposed to be the end
 * of the matter. Twice it was not. Rendered as two bare siblings, the heading and the claim
 * became two items of whatever laid them out, so the landing page's flex column inserted its
 * own eight-pixel gap between them: 20 pixels apart there against 12 everywhere else. And
 * around the component, each page wrote its own `<main>`, its own measure and its own top
 * padding, so the block itself sat at a different height and a different width depending on
 * which page you were reading. One component, three geometries, and nothing here could see
 * it.
 *
 * So the whole placement is measured on each page and required to be the same. Not numbers
 * written here — numbers the pages have to agree on, which is the actual claim and survives
 * anybody moving the brand on purpose.
 *
 * Seen to fail: a single `padding-block-start` in the shared layout, keyed on the flag only
 * the landing pages pass, put them at y=102 against y=94 for the other four. All four windows
 * went red and named both sides; the other 90 checks in this suite stayed green.
 */
const PAGES: readonly string[] = [
    '/',
    '/fr/',
    '/version',
    '/fr/version',
    '/about',
    '/fr/about',
    '/privacy',
    '/fr/privacy',
    '/404.html',
    '/fr/404.html',
];

/**
 * Where the brand sits and how it is drawn, as one string to compare.
 *
 * Position and size together, because either alone lets the other drift: the heading was
 * 33.6px on the landing page and 51.2px on /version at the same window size, from a rule
 * about the brand that one page had written for itself.
 */
async function placement(page: Page): Promise<string> {
    return page.evaluate(() => {
        const heading: HTMLElement | null = document.querySelector('h1[data-brand-heading]');
        const claim: HTMLElement | null = document.querySelector('.tagline');

        if (heading === null || claim === null) {
            throw new Error('this page carries no brand heading');
        }

        const box: DOMRect = heading.getBoundingClientRect();

        return [
            `x=${box.x.toFixed(0)}`,
            `y=${box.y.toFixed(0)}`,
            `font=${getComputedStyle(heading).fontSize}`,
            `claim=${claim.getBoundingClientRect().y.toFixed(0)}`,
        ].join(' ');
    });
}

/**
 * Four windows, and each one of them has caught something. 1280x900 is where the landing
 * page and /version agreed by coincidence; 1280x800 is under the short-screen query, which
 * one page used to own; 390x844 is the narrow query, likewise; and a large window is the
 * case where nothing is tightened at all.
 */
const WINDOWS: ReadonlyArray<{ width: number; height: number }> = [
    { width: 1280, height: 900 },
    { width: 1280, height: 800 },
    { width: 1996, height: 1164 },
    { width: 390, height: 844 },
];

for (const window of WINDOWS) {

    test(`is drawn identically on every page at ${window.width}x${window.height}`, async ({ page }) => {
        const measured: Array<{ path: string; placement: string }> = [];

        for (const path of PAGES) {
            await page.setViewportSize(window);
            await page.goto(path);
            measured.push({ path, placement: await placement(page) });
        }

        const distinct: Set<string> = new Set(measured.map((one) => one.placement));
        const inventory: string = measured.map((one) => `${one.path} → ${one.placement}`).join('\n        ');

        expect(distinct.size, `the brand is not drawn the same on every page:\n        ${inventory}\n`).toBe(1);
    });

}

for (const path of PAGES) {

    test(`${path} carries the whole brand`, async ({ page }) => {
        await page.goto(path);

        // The three parts, on every page that shows it. A page that lost the mark or the
        // claim would still pass the spacing check above by agreeing with nobody.
        await expect(page.locator('h1[data-brand-heading]')).toHaveText(/JustDummies/);
        await expect(page.locator('h1[data-brand-heading] .mark')).toBeVisible();
        await expect(page.locator('.tagline')).toHaveText(/.+/);
    });

}
