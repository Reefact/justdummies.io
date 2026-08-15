import { expect, test } from '@playwright/test';

/**
 * The bar that is on every page, and the one rule its links follow.
 *
 * A link that leaves the site opens a tab of its own; a link that stays keeps this one. That
 * is not a preference — a reader sent to GitHub from here has lost the page they were
 * reading, and getting it back costs them the back button and whatever they had scrolled to.
 * The playground is this site, so it does not get a tab.
 *
 * `noopener` is the half that is about safety rather than about comfort: without it the
 * opened tab keeps a handle on this one through `window.opener`, and can navigate it.
 *
 * The header comes from one layout, so one page would do. It is checked on all six because
 * the reason this suite exists at all is that "it comes from one layout" was true of the
 * brand too, and the brand was in three different places.
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

for (const path of PAGES) {

    test(`${path} sends the reader off-site in a new tab, and nowhere else`, async ({ page }) => {
        await page.goto(path);

        const outward = page.locator('.site-nav a[href^="https://github.com/"]');
        const inward  = page.locator('.site-nav a[href="/playground/"]');

        await expect(outward).toHaveAttribute('target', '_blank');
        await expect(outward).toHaveAttribute('rel', /noopener/);

        // The other half of the rule, and the half that would silently rot: a `target` added
        // to every link in the bar would pass everything above and be wrong.
        await expect(inward).not.toHaveAttribute('target', /.*/);
    });

}
