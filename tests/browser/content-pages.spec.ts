import { expect, test, type Page, type Response } from '@playwright/test';

/**
 * /about, /privacy and /why-justdummies answer, say what they are about, and carry the
 * sitewide footer that this repository previously had nowhere at all.
 */
const PAGES: ReadonlyArray<{ path: string; heading: string; body: RegExp }> = [
    { path: '/about', heading: 'About', body: /Sylvain Aurat/ },
    { path: '/fr/about', heading: 'À propos', body: /Sylvain Aurat/ },
    { path: '/privacy', heading: 'Privacy', body: /Cloudflare/ },
    { path: '/fr/privacy', heading: 'Confidentialité', body: /Cloudflare/ },
    { path: '/why-justdummies', heading: 'Why JustDummies', body: /Bogus/ },
    { path: '/fr/why-justdummies', heading: 'Pourquoi JustDummies', body: /Bogus/ },
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

test('the footer links to About, Release notes, Privacy and this site\'s repository, and scrolls with the page', async ({
    page,
}) => {
    await page.goto('/');

    const about = page.locator('.site-footer a[href="/about/"]');
    const releaseNotes = page.locator('.site-footer a[href="/release-notes/"]');
    const privacy = page.locator('.site-footer a[href="/privacy/"]');
    const repository = page.locator('.site-footer a[href="https://github.com/Reefact/justdummies.io"]');

    await expect(about).toBeVisible();
    await expect(releaseNotes).toBeVisible();
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
    for (const path of [
        '/',
        '/fr/',
        '/about',
        '/fr/about',
        '/release-notes',
        '/fr/release-notes',
        '/why-justdummies',
        '/fr/why-justdummies',
        '/privacy',
        '/fr/privacy',
        '/version',
        '/404.html',
    ]) {
        await page.goto(path);

        await expect(page.locator('.site-footer'), `${path} carries no footer`).toBeVisible();
    }
});

for (const path of ['/about', '/privacy', '/why-justdummies']) {

    test(`${path} needs no script to say anything`, async ({ browser }) => {
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();

        await page.goto(path);

        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('.site-footer')).toBeVisible();

        await context.close();
    });

}

/**
 * The comparison table follows the same ADR-0004 contract `InstallTabs` does: without
 * scripting, the `<select>` and the mode toggle stay hidden — a control that would
 * filter nothing is worse than no control — and what a reader gets instead is the full
 * matrix, every competitor's column already there.
 */
test('/why-justdummies shows the full matrix, and no dead control, without scripting', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/why-justdummies');

    await expect(page.locator('[data-duel-controls]:visible')).toHaveCount(0);
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('thead th[data-competitor]')).toHaveCount(3);
    await expect(page.locator('thead th[data-competitor]:visible')).toHaveCount(3);

    await context.close();
});

test('/why-justdummies narrows to one competitor, and back to the full matrix', async ({ page }) => {
    await page.goto('/why-justdummies');

    const select = page.locator('[data-compare-select]');
    const toggle = page.locator('[data-mode-toggle]');
    const autofixtureColumn = page.locator('thead th[data-competitor="autofixture"]');
    const bogusColumn = page.locator('thead th[data-competitor="bogus"]');

    // Duel is the default once scripting runs (§11.5), narrowed to the select's own
    // first option.
    await expect(select).toBeVisible();
    await expect(bogusColumn).toBeVisible();
    await expect(autofixtureColumn).toBeHidden();

    await select.selectOption('autofixture');
    await expect(autofixtureColumn).toBeVisible();
    await expect(bogusColumn).toBeHidden();

    await toggle.click();
    await expect(bogusColumn).toBeVisible();
    await expect(autofixtureColumn).toBeVisible();
});
