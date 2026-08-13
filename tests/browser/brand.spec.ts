import { expect, test, type Page } from '@playwright/test';

/**
 * The brand looks the same on every page that carries it.
 *
 * It is one component — the mark, the name, the claim — and that was supposed to be the end
 * of the matter. It was not: rendered as two bare siblings, the heading and the claim became
 * two items of whatever laid them out, so the landing page's flex column inserted its own
 * eight-pixel gap between them and the pair sat 20 pixels apart there against 12 everywhere
 * else. One component, two spacings, and nothing in the repository could see it.
 *
 * So the spacing is measured on each page and required to be the same. Not a number written
 * here — a number the pages have to agree on, which is the actual claim and survives anybody
 * changing the component's own spacing on purpose.
 */
const PAGES: readonly string[] = ['/', '/fr/', '/version', '/fr/version', '/404.html', '/fr/404.html'];

/** The gap between the bottom of the name and the top of the claim, as rendered. */
async function spacing(page: Page): Promise<number> {
    return page.evaluate(() => {
        const heading: HTMLElement | null = document.querySelector('h1[data-brand-heading]');
        const claim: HTMLElement | null = document.querySelector('.tagline');

        if (heading === null || claim === null) {
            throw new Error('this page carries no brand heading');
        }

        return claim.getBoundingClientRect().top - heading.getBoundingClientRect().bottom;
    });
}

test('sits the same distance from its claim on every page', async ({ page }) => {
    const measured: Array<{ path: string; gap: number }> = [];

    for (const path of PAGES) {
        await page.goto(path);
        measured.push({ path, gap: await spacing(page) });
    }

    const inventory: string = measured.map((one) => `${one.path} ${one.gap.toFixed(1)}px`).join(', ');
    const widest: number = Math.max(...measured.map((one) => one.gap));
    const narrowest: number = Math.min(...measured.map((one) => one.gap));

    expect(widest - narrowest, `the brand is spaced differently across pages: ${inventory}`).toBeLessThan(1);
});

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
