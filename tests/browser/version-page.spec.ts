import { expect, test, type Page, type Response } from '@playwright/test';

/**
 * /version says what the site is serving, and says the same thing the site serves.
 *
 * The page reads `version.json` at build time and the site serves that same file at
 * /version.json — one generation, copied. The point of checking it in a browser is that
 * "one generation, copied" is a claim about the build script, and this is where it stops
 * being a claim: the page is read, the file is fetched, and the two are compared.
 *
 * It is also the first page of this site nothing links to. That is deliberate and it is
 * not what these checks are about — a page reachable only by its address still has to
 * work, in both languages, for a reader arriving with the address.
 */
interface Served {
    release: string | null;
    commit: string | null;
    built: string;
}

const PAGES: ReadonlyArray<{ path: string; heading: string; built: string }> = [
    { path: '/version', heading: 'This build', built: 'Built' },
    { path: '/fr/version', heading: 'Ce build', built: 'Construit le' },
];

async function cell(page: Page, field: string): Promise<string> {
    return (await page.locator(`[data-field="${field}"]`).innerText()).trim();
}

for (const { path, heading, built } of PAGES) {

    test(`${path} answers, and wears the site's clothes`, async ({ page }) => {
        const response: Response | null = await page.goto(path);

        // Asked for without the trailing slash, on purpose: that is the address a reader is
        // given, and a directory-format build serves it only because the host resolves it.
        expect(response?.status(), `${path} did not answer`).toBe(200);

        // The same heading and the same claim as the landing page — not similar ones. Both
        // come from one component now, and this is what says the extraction held.
        await expect(page.locator('h1')).toHaveText(/JustDummies/);
        await expect(page.locator('.mark')).toBeVisible();
        await expect(page.getByRole('heading', { name: heading })).toBeVisible();
        await expect(page.locator('.tagline')).toHaveText(/.+/);
    });

    test(`${path} shows what /version.json serves`, async ({ page }) => {
        await page.goto(path);

        const served: Served = await (await page.request.get('/version.json')).json();

        // The whole reason this page is checked in a browser rather than read off disk.
        expect(await cell(page, 'release')).toBe(served.release ?? '#null');
        expect(await cell(page, 'commit')).toBe(served.commit ?? '#null');
        expect(await cell(page, 'built')).toBe(served.built);
    });

    test(`${path} carries its own label on every row`, async ({ page }) => {
        await page.goto(path);

        // The labels are the one thing on this page that is translated, so the French page
        // showing an English one is the failure this catches — and it is invisible to every
        // check that only compares values.
        await expect(page.getByRole('rowheader', { name: built, exact: true })).toBeVisible();
    });

}

test('the commit links to the commit, in a new tab, safely', async ({ page }) => {
    await page.goto('/version');

    const served: Served = await (await page.request.get('/version.json')).json();
    const link = page.locator('[data-field="commit"] a');

    if (served.commit === null) {
        // A build with no git behind it has nothing to link to, and the page says `#null`
        // rather than pointing at a commit that does not exist.
        await expect(link).toHaveCount(0);

        return;
    }

    await expect(link).toHaveAttribute('href', `https://github.com/Reefact/justdummies.io/commit/${served.commit}`);
    await expect(link).toHaveAttribute('target', '_blank');

    // `noopener` is the half that matters: without it the opened tab keeps a handle on this
    // one through `window.opener`, and can navigate it.
    await expect(link).toHaveAttribute('rel', /noopener/);
});

test('/version needs no script to say anything', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/version');

    // The page fetches nothing and runs nothing, which is why this holds. It is worth
    // asserting rather than assuming: the day somebody makes the figures live, this is what
    // says the reader without scripting was left behind.
    await expect(page.locator('[data-field="release"]')).toHaveText(/.+/);
    await expect(page.locator('[data-field="commit"]')).toHaveText(/.+/);
    await expect(page.locator('[data-field="built"]')).toHaveText(/.+/);

    await context.close();
});
