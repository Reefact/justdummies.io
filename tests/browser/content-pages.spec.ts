import { expect, test } from './support/harness';
import type { Page, Response } from '@playwright/test';

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

test('the footer links to API, Release notes, About and Privacy, and scrolls with the page', async ({
    page,
}) => {
    await page.goto('/');

    const about = page.locator('.site-footer a[href="/about/"]');
    const api = page.locator('.site-footer a[href="/api/"]');
    const releaseNotes = page.locator('.site-footer a[href="/release-notes/"]');
    const privacy = page.locator('.site-footer a[href="/privacy/"]');

    await expect(about).toBeVisible();
    await expect(api).toBeVisible();
    await expect(releaseNotes).toBeVisible();
    await expect(privacy).toBeVisible();

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

/**
 * The footer sits in the same place on every page, and this exists because it did not.
 *
 * A decoration on /about was floated so that it hung past the section holding it and into the
 * band the footer occupies. A footer establishes its own formatting context, so it does not pass
 * under a float — it was laid out *beside* that one instead, narrowed to what was left and then
 * re-centred inside it by its own `margin: 0 auto`. The result was a footer 515 pixels to the
 * left of where it sits everywhere else, with its rule stopping short of the drawing, on two
 * pages of the site.
 *
 * Every check in this suite passed on that build. The footer was visible, in the right locale,
 * carrying the right links, `static` rather than fixed, and each of those is what was asserted
 * about it. Where it *was* had never been worth writing down until something moved it, and the
 * one thing that would have caught it is the comparison no single-page test can make: this page
 * against the others.
 *
 * Wide on purpose. The shell stops growing at 72rem, so past that width every footer is the same
 * box to the pixel and any difference is a defect rather than a consequence of the viewport.
 */
test('the footer occupies the same box on every page', async ({ page }) => {
    const boxes = new Map<string, string>();

    for (const path of ['/', '/fr/', '/about', '/fr/about', '/privacy', '/why-justdummies', '/404.html']) {
        await page.setViewportSize({ width: 2560, height: 1440 });
        await page.goto(path);

        const box: string = await page.evaluate(() => {
            const rect: DOMRect = document.querySelector('.site-footer')!.getBoundingClientRect();

            return `${Math.round(rect.left)}..${Math.round(rect.right)}`;
        });

        boxes.set(path, box);
    }

    const found: string[] = Array.from(new Set(boxes.values()));
    const report: string = Array.from(boxes, ([path, box]) => `${path} ${box}`).join(', ');

    expect(found, `the footer is not the same box on every page: ${report}`).toHaveLength(1);
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
 * The positioning page, checked against its intentions rather than its wording.
 *
 * Every assertion below names a decision from §11 and would go red if that decision were
 * undone. None of them pins a sentence: the copy is expected to keep improving, and a test
 * that freezes a phrase is a test that makes the next editorial pass a chore. What is
 * frozen is structure — the criteria are taught, the ratings are defined, the honest
 * sections exist, and nothing essential waits for a script.
 */
const WHY_PAGES: ReadonlyArray<{ path: string; possible: string }> = [
    { path: '/why-justdummies', possible: 'Possible, with work' },
    { path: '/fr/why-justdummies', possible: 'Possible, avec du travail' },
];

for (const { path, possible } of WHY_PAGES) {

    test(`${path} teaches every criterion it compares on`, async ({ page }) => {
        await page.goto(path);

        // §11.4 — ten criteria, and not one of them is a bare label: each carries the
        // question it settles and the sentence that explains it, both visible.
        await expect(page.locator('.criterion')).toHaveCount(10);
        await expect(page.locator('.criterion .question')).toHaveCount(10);
        await expect(page.locator('.criterion .explanation')).toHaveCount(10);

        // §11.5 — grouped under the reader's four questions, not ranked by our own margin.
        // The heading lives inside the summary (not replaced by it), so a reader navigating
        // by heading still finds all four families, disclosure or not.
        await expect(page.locator('.family > summary > h4')).toHaveCount(4);

        // §11.6 — the three answers are named on the page, before their first use — in the
        // matrix's own compact legend now that the standalone boxed one is gone.
        await expect(page.locator('.matrix-legend')).toContainText(possible);

        // Four options on every criterion, JustDummies included and never hideable.
        await expect(page.locator('.criterion .verdicts > li')).toHaveCount(40);
        await expect(page.locator('.criterion .verdicts > li[data-self]')).toHaveCount(10);
    });

    test(`${path} says where it is the wrong choice`, async ({ page }) => {
        await page.goto(path);

        // §11.8 — "when to choose it over JustDummies", one per competitor, never empty.
        const instead = page.locator('#instead .instead-card');

        await expect(instead).toHaveCount(3);

        for (const text of await instead.locator('p').allInnerTexts()) {
            expect(text.trim().length, 'a competitor is listed with nothing said about it').toBeGreaterThan(40);
        }

        // §11.8 — its own section, not buried, and enumerated case by case.
        await expect(page.locator('#not-for .not-for-item').first()).toBeVisible();
        expect(await page.locator('#not-for .not-for-item').count()).toBe(3);
    });

    test(`${path} shows what was checked, when, and how to say it is wrong`, async ({ page }) => {
        await page.goto(path);

        // §11.10 — the sources are on the page, not in a code comment.
        await expect(page.locator('#sources a[href*="github.com/bchavez/Bogus"]').first()).toBeVisible();
        await expect(page.locator('#sources a[href*="github.com/AutoFixture/AutoFixture"]').first()).toBeVisible();

        // The date, formatted per locale from one source, and the right of reply.
        await expect(page.locator('#sources .verified')).toContainText('2026');
        await expect(page.locator('#sources a[href*="/issues/new"]')).toBeVisible();
    });

}

/**
 * ADR-0004 on this page: the `<select>` that narrows the comparison is absent until its
 * script can act, and what it enhances — all four options, every rating, every note — is
 * already there. A reader without scripting loses a convenience, never an answer.
 *
 * The matrix leads the comparison now and is never a `<details>`, so it alone already
 * answers the "without scripting" bar for the whole comparison — all forty verdicts, on the
 * page, with nothing to click. §4bis still wraps each of the four criterion families in a
 * native `<details name="…">`, all four closed by default; the shared `name` makes them
 * mutually exclusive, so "all ten criteria's full explanation visible at once" is not a
 * reachable state, script or no script — that was never the matrix's job to begin with. The
 * bar this test holds for the families is narrower and still real: every criterion is
 * reachable, one family's worth of clicking at a time, and whichever family is open holds
 * nothing back behind a further click.
 */
test('/why-justdummies is whole, and offers no dead control, without scripting', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/why-justdummies');

    await expect(page.locator('[data-duel-controls]:visible')).toHaveCount(0);

    // The matrix already says the whole comparison — every rated cell, no click required.
    await expect(page.locator('.matrix:visible')).toHaveCount(1);
    await expect(page.locator('.matrix .matrix-legend:visible')).toHaveCount(1);
    await expect(page.locator('.matrix td[data-rating]:visible')).toHaveCount(40);

    // And nothing is missing from the criterion blocks, whether or not their family is open.
    await expect(page.locator('.criterion')).toHaveCount(10);

    // Visit each family in turn — clicking a closed one's own summary is itself a native,
    // no-script action — and record every criterion id seen while it was the one open.
    const seenIds = new Set<string>();
    const details = page.locator('details.family');
    const familyCount = await details.count();

    for (let i = 0; i < familyCount; i++) {
        const thisFamily = details.nth(i);

        if ((await thisFamily.getAttribute('open')) === null) {
            await thisFamily.locator('> summary').click();
        }

        const ids = await page.locator('.criterion:visible').evaluateAll((els) => els.map((el) => el.id));
        for (const id of ids) {
            seenIds.add(id);
        }

        // Whatever family is open holds back nothing further: every one of its own
        // criteria carries its question and all four verdicts, all visible together.
        await expect(page.locator('.criterion:visible .question')).toHaveCount(ids.length);
        await expect(page.locator('.criterion:visible .verdicts > li')).toHaveCount(ids.length * 4);
    }

    expect(seenIds.size, 'every criterion should be reachable across the four families').toBe(10);

    await context.close();
});

/**
 * A phone gets the same markup and all of it. The matrix is the one thing a narrow screen
 * does not get — it is a grid, and there is no grid — and §11.7 asks for it to be
 * *replaced* rather than shrunk, so this checks that what replaces it holds every rating
 * the grid would have shown.
 */
test('/why-justdummies keeps every verdict on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/why-justdummies');

    await expect(page.locator('.criterion .verdicts > li')).toHaveCount(40);
    await expect(page.locator('.matrix')).toBeHidden();
});

test('/why-justdummies narrows to one alternative, and back to all of them', async ({ page }) => {
    await page.goto('/why-justdummies');

    const select = page.locator('[data-compare-select]');
    const status = page.locator('[data-duel-status]');
    // The matrix, not a criterion block: it is never behind a click, where every family's
    // accordion now starts closed and a criterion's own verdicts would be hidden along
    // with it — unrelated to whichever alternative the duel is narrowed to.
    const autofixture = page.locator('.matrix td[data-competitor="autofixture"]').first();
    const bogus = page.locator('.matrix td[data-competitor="bogus"]').first();

    // §11.7 — the scripted page opens where the unscripted one stops: everything shown.
    await expect(select).toBeVisible();
    await expect(bogus).toBeVisible();
    await expect(autofixture).toBeVisible();

    await select.selectOption('autofixture');
    await expect(autofixture).toBeVisible();
    await expect(bogus).toBeHidden();

    // §11.7 — and the change is said in words, not only by a column going away.
    await expect(status).toContainText('AutoFixture');

    await select.selectOption('all');
    await expect(bogus).toBeVisible();
    await expect(autofixture).toBeVisible();
});

test('/why-justdummies keeps JustDummies on screen in every mode', async ({ page }) => {
    await page.goto('/why-justdummies');

    await page.locator('[data-compare-select]').selectOption('bogus');

    // The constant column of the comparison carries no `data-competitor`, so no choice can
    // take it away — checked here rather than trusted, because a single attribute added by
    // a well-meant refactor would make the page compare JustDummies with nothing. Checked
    // against whichever family is open, and then again for every other family in turn —
    // §4bis's exclusive accordion means at most one is ever visible at once, so "in every
    // mode" now means "for every family", not "with all ten on screen together".
    const details = page.locator('details.family');
    const familyCount = await details.count();

    for (let i = 0; i < familyCount; i++) {
        const thisFamily = details.nth(i);

        if ((await thisFamily.getAttribute('open')) === null) {
            await thisFamily.locator('> summary').click();
        }

        const visibleCriteria = await page.locator('.criterion:visible').count();
        await expect(page.locator('.criterion .verdicts > li[data-self]:visible')).toHaveCount(visibleCriteria);
    }
});
