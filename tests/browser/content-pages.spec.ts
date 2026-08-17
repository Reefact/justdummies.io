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
 * The positioning page, checked against its intentions rather than its wording.
 *
 * Every assertion below names a decision from §11 and would go red if that decision were
 * undone. None of them pins a sentence: the copy is expected to keep improving, and a test
 * that freezes a phrase is a test that makes the next editorial pass a chore. What is
 * frozen is structure — the criteria are taught, the ratings are defined, the honest
 * sections exist, and nothing essential waits for a script.
 */
const WHY_PAGES: ReadonlyArray<{ path: string; possible: string; solo: RegExp }> = [
    { path: '/why-justdummies', possible: 'Possible, with work', solo: /one developer/ },
    { path: '/fr/why-justdummies', possible: 'Possible, avec du travail', solo: /un seul développeur/ },
];

for (const { path, possible, solo } of WHY_PAGES) {

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

        // §11.6 — the three answers are defined on the page, before their first use.
        await expect(page.locator('.legend dd')).toHaveCount(3);
        await expect(page.locator('.legend')).toContainText(possible);

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
        expect(await page.locator('#not-for .not-for-item').count()).toBeGreaterThanOrEqual(4);

        // The admission the section is bought with: one person maintains this.
        await expect(page.locator('#not-for')).toContainText(solo);
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
 * §4bis wraps each of the four criterion families in a native `<details name="…">`, open by
 * default on only the first — a *script-free* default, not a script-gated one. The shared
 * `name` also makes the four mutually exclusive, natively: opening one always closes
 * whichever else was open, so unlike the first version of this test, "all ten visible at
 * once" is no longer a reachable state at all, script or no script. The bar this test holds
 * is what is actually true now: every criterion is reachable, one family's worth of clicking
 * at a time, and whichever family is open holds nothing back behind a further click.
 */
test('/why-justdummies is whole, and offers no dead control, without scripting', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto('/why-justdummies');

    await expect(page.locator('[data-duel-controls]:visible')).toHaveCount(0);

    // Nothing is missing, whether or not its family happens to be open.
    await expect(page.locator('.criterion')).toHaveCount(10);
    await expect(page.locator('.legend dd:visible')).toHaveCount(3);

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
    const autofixture = page.locator('.criterion .verdicts > li[data-competitor="autofixture"]').first();
    const bogus = page.locator('.criterion .verdicts > li[data-competitor="bogus"]').first();

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
