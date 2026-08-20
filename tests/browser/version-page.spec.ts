import { expect, test } from './support/harness';
import type { Page, Response } from '@playwright/test';

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

const PAGES: ReadonlyArray<{ path: string; heading: string; built: string; latest: string }> = [
    { path: '/version', heading: 'This build', built: 'Built', latest: 'Latest release' },
    { path: '/fr/version', heading: 'Ce build', built: 'Construit le', latest: 'Dernière release' },
];

async function cell(page: Page, field: string): Promise<string> {
    return (await page.locator(`[data-field="${field}"]`).innerText()).trim();
}

for (const { path, heading, built, latest } of PAGES) {

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

    test(`${path} shows what the last release changed`, async ({ page }) => {
        await page.goto(path);

        const note = page.locator('.latest');

        await expect(page.getByRole('heading', { name: latest, exact: true })).toBeVisible();

        // The tag names the release, and it is the same string /version.json reports as
        // `release` on a build cut from that tag. Only its shape is asserted: this page is
        // built from a branch as often as from a tag, and on a branch the two differ for a
        // reason — see the check below.
        await expect(note.locator('.version')).toHaveText(/^release\/\d{4}-\d{2}-\d{2}T/);
        await expect(note.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);

        // A rubric with no bullets under it is what a parser that swallowed a list looks
        // like from here, and it is invisible to a check that only asks whether the section
        // rendered. The emoji is the label's own, arriving already translated.
        const rubrics = note.locator('.rubric');

        expect(await rubrics.count()).toBeGreaterThan(0);

        for (const rubric of await rubrics.all()) {
            await expect(rubric.locator('.rubric-label')).toHaveText(/\S/);
            expect(await rubric.locator('.bullets li').count()).toBeGreaterThan(0);
        }
    });

    test(`${path} links the note to its own release, in a new tab, safely`, async ({ page }) => {
        await page.goto(path);

        const link = page.locator('.latest .release-foot a');
        const tag: string = (await page.locator('.latest .version').innerText()).trim();

        // The card names the tag; the link has to name the same one. Built from that string
        // rather than hard-coded, so a check that passes proves the page agrees with itself
        // rather than proving both agree with this file.
        await expect(link).toHaveAttribute('href', `https://github.com/Reefact/justdummies.io/releases/tag/${tag}`);
        await expect(link).toHaveAttribute('target', '_blank');

        // `noopener` is the half that matters: without it the opened tab keeps a handle on
        // this one through `window.opener`, and can navigate it.
        await expect(link).toHaveAttribute('rel', /noopener/);
    });

    test(`${path} keeps the note out of the table's claim`, async ({ page }) => {
        await page.goto(path);

        // The table says what this build IS; the note says what shipped LAST. They are the
        // same fact only on a build cut from a release tag, and every build on a branch is
        // the case that would expose the two being conflated — a `#null` release above a
        // note that names a tag has to read as two statements, not as one contradiction.
        //
        // So what is asserted is the separation itself: the note is its own labelled
        // section, outside the table, rather than a fourth row inside it.
        await expect(page.locator('.build .facts .latest')).toHaveCount(0);
        await expect(page.locator('.latest .facts')).toHaveCount(0);
        await expect(page.locator('.latest')).toHaveAttribute('aria-labelledby', 'latest-heading');
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

    // The note is read out of a file at build time like the figures above it, so it is here
    // for the same reason they are: nothing on this page may become a thing a reader without
    // scripting is left out of.
    expect(await page.locator('.latest .bullets li').count()).toBeGreaterThan(0);

    await context.close();
});

/**
 * The note is the widest thing this page holds, and this page is not in layout.spec.ts's
 * sweep — it is a deliberate orphan nothing links to, and that sweep covers what a reader
 * can reach.
 *
 * It still has to survive a phone. The hazard is specific and it is new: a release tag is a
 * 28-character timestamp with nowhere to break, set in mono as a heading, sitting in a flex
 * row beside a date that must not wrap — the same shape as the commit hash in the table
 * above, which took this page sideways once already.
 *
 * The measurement is layout.spec.ts's, for its reason: `100vw` includes a classic
 * scrollbar's width and the browser doing the measuring may draw overlay scrollbars that
 * take none, so `scrollWidth` against `clientWidth` is what cannot be fooled.
 */
for (const width of [320, 360] as const) {

    for (const path of ['/version', '/fr/version'] as const) {

        test(`${path} does not scroll sideways at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(path);

            const overflow: { scrollWidth: number; clientWidth: number } = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));

            expect(
                overflow.scrollWidth,
                `${path} is ${overflow.scrollWidth - overflow.clientWidth}px wider than its viewport at ${width}px`,
            ).toBeLessThanOrEqual(overflow.clientWidth);
        });

    }

}
