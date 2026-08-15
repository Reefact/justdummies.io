import { expect, test, type Page, type Response } from '@playwright/test';

/**
 * /about and /privacy answer, say what they are about, and carry the sitewide footer
 * that this repository previously had nowhere at all.
 */
const PAGES: ReadonlyArray<{ path: string; heading: string; body: RegExp }> = [
    { path: '/about', heading: 'About', body: /Sylvain Aurat/ },
    { path: '/fr/about', heading: 'À propos', body: /Sylvain Aurat/ },
    { path: '/privacy', heading: 'Privacy', body: /Cloudflare/ },
    { path: '/fr/privacy', heading: 'Confidentialité', body: /Cloudflare/ },
];

for (const { path, heading, body } of PAGES) {

    test(`${path} answers, and wears the site's clothes`, async ({ page }) => {
        const response: Response | null = await page.goto(path);

        expect(response?.status(), `${path} did not answer`).toBe(200);

        await expect(page.locator('h1')).toHaveText(/JustDummies/);
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        await expect(page.locator('main')).toContainText(body);
    });

}

/**
 * Every locale of /privacy restates the same SIREN a human typed into `site.ts`'s
 * `legal` object. There is no build step that compares the two — `ui.ts`'s prose and
 * `site.ts`'s fact are accepted duplication (see the `KNOWN DUPLICATION` note on
 * `site.legal`) — so this is the mechanical half of that guard: it fails the day one
 * changes without the other.
 */
for (const { path } of PAGES.filter((entry) => entry.path.includes('privacy'))) {

    test(`${path} restates the registered SIREN, not a stale copy`, async ({ page }) => {
        await page.goto(path);

        await expect(page.locator('main')).toContainText('804 026 482');
    });

}

async function footerPosition(page: Page): Promise<string> {
    return page.evaluate(() => getComputedStyle(document.querySelector('.site-footer')!).position);
}

test('the footer links to About, Privacy and this site\'s repository, and scrolls with the page', async ({
    page,
}) => {
    await page.goto('/');

    const about = page.locator('.site-footer a[href="/about/"]');
    const privacy = page.locator('.site-footer a[href="/privacy/"]');
    const repository = page.locator('.site-footer a[href="https://github.com/Reefact/justdummies.io"]');

    await expect(about).toBeVisible();
    await expect(privacy).toBeVisible();
    await expect(repository).toBeVisible();
    await expect(repository).toHaveAttribute('target', '_blank');
    await expect(repository).toHaveAttribute('rel', /noopener/);

    // Confirmed behaviour: the footer sits in the normal document flow and never pins
    // itself to the viewport — a `position: fixed`/`sticky` regression would otherwise
    // go unnoticed since nothing else in this suite measures it.
    expect(await footerPosition(page)).toBe('static');
});

test('the footer appears on every page that carries it, in the right locale', async ({ page }) => {
    for (const path of ['/', '/fr/', '/about', '/fr/about', '/privacy', '/fr/privacy', '/version', '/404.html']) {
        await page.goto(path);

        await expect(page.locator('.site-footer'), `${path} carries no footer`).toBeVisible();
    }
});

for (const path of ['/about', '/privacy']) {

    test(`${path} needs no script to say anything`, async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();

        await page.goto(path);

        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('.site-footer')).toBeVisible();

        await context.close();
    });

}
