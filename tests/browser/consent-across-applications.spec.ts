import { ANALYTICS_TAG_MARKER, expect, isAnalyticsHost, test } from './support/harness';
import type { Page, Request } from '@playwright/test';

/**
 * One question, two applications — the crossing ADR-0025 exists for, and the half no static
 * reading of the artefact can establish.
 *
 * `verify-output.sh` can say that a document carrying the tag carries a banner and the module
 * that acts on it. What it cannot say is that an answer given in one document is the answer
 * the other finds: that is one origin, one storage key and two toolchains agreeing at run
 * time, which is exactly the kind of agreement that holds in review and stops holding on the
 * day one of them changes its key, its shape or its retention.
 *
 * BOTH DIRECTIONS, because they are not the same claim. The playground is a deep link, so it
 * is a first page as often as a second one; a visitor may answer on either side first, and
 * the one that reads second must not ask again.
 *
 * `test.use({ consent: 'unasked' })` throughout: the harness answers "denied" for every other
 * spec, which is the state where no banner is drawn at all. These checks need the question
 * open.
 */
test.use({ consent: 'unasked' });

/** Every request this page makes to a Google host, recorded on the Node side. */
function googleRequests(page: Page): string[] {
    const seen: string[] = [];

    page.on('request', (request: Request) => {
        if (isAnalyticsHost(new URL(request.url()).hostname)) {
            seen.push(request.url());
        }
    });

    return seen;
}

/** Whether this artefact carries the tag at all, decided from the page rather than from a flag. */
async function skipWithoutTag(page: Page): Promise<void> {
    const html: string = await page.content();

    test.skip(!html.includes(ANALYTICS_TAG_MARKER), 'this artefact was built without the analytics tag');
}

test.describe('an answer given in the playground', () => {
    test('is the answer the site finds, and the site does not ask again', async ({ page }) => {
        await page.goto('/playground/');
        await skipWithoutTag(page);

        // The banner is in the shell rather than in the Blazor tree, so it is up before the
        // runtime is — which is the reason it is there and is worth asserting as such.
        const banner = page.locator('[data-consent]');
        await expect(banner).toBeVisible();

        await page.locator('[data-consent-accept]').click();
        await expect(banner).toBeHidden();

        // A second document, on the same origin, that never asked anything itself.
        const requested: string[] = googleRequests(page);
        await page.goto('/');

        await expect(page.locator('[data-consent]'), 'the site asked a question already answered').toBeHidden();

        // Asserted on what the tag does rather than only on what the banner does not: an
        // answer that crossed but started nothing would be a banner correctly hidden and a
        // measurement silently missing.
        await expect
            .poll(() => requested.length, 'the site did not start the tag on an answer given in the playground')
            .toBeGreaterThan(0);
    });

    test('carries a refusal across too, and the site asks Google for nothing', async ({ page }) => {
        await page.goto('/playground/');
        await skipWithoutTag(page);

        await page.locator('[data-consent-refuse]').click();
        await expect(page.locator('[data-consent]')).toBeHidden();

        const requested: string[] = googleRequests(page);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-consent]'), 'the site asked a question already refused').toBeHidden();
        expect(requested, 'the site reached Google after a refusal given in the playground').toEqual([]);
    });
});

test.describe('an answer given on the site', () => {
    test('is the answer the playground finds, and the playground does not ask again', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await expect(page.locator('[data-consent]')).toBeVisible();
        await page.locator('[data-consent-accept]').click();

        const requested: string[] = googleRequests(page);
        await page.goto('/playground/');

        await expect(page.locator('[data-consent]'), 'the playground asked a question already answered').toBeHidden();
        await expect
            .poll(() => requested.length, 'the playground did not start the tag on an answer given on the site')
            .toBeGreaterThan(0);
    });
});

test.describe('the playground’s banner', () => {
    /**
     * The shell's chrome is translated twice: once before boot, from the URL the page opened
     * with, and again by `LocaleState` when a reader switches language afterwards. The second
     * path is the one that only exists because somebody wrote it, and a question read in one
     * language and answered in another is a choice made against a sentence nobody read.
     */
    test('follows a language switch made after boot', async ({ page }) => {
        await page.goto('/playground/');
        await skipWithoutTag(page);

        const heading = page.locator('[data-consent-heading]');
        await expect(heading).toHaveText('How the playground is used.');

        // Through the application's own selector, which is what makes this the after-boot
        // path rather than the pre-boot one `?lang=fr` would take. It is a `<details>` menu
        // rather than a `<select>`, so the summary opens it and the button inside chooses.
        await page.locator('.language-selector summary').click();
        await page.locator('.language-selector button[lang="fr"]').click();

        await expect(heading).toHaveText('Comment le playground est utilisé.');
        await expect(page.locator('[data-consent-more]')).toHaveAttribute('href', '/fr/privacy/');
    });

    /**
     * The framed hero is this same shell at a second address — `_redirects` rewrites
     * `/playground/hero` to `/playground/` with a 200 — so everything the shell does happens
     * again inside the iframe `LiveHero.astro` opens. A banner there would be a second copy of
     * the question on one screen, asking what the page behind it is already asking; a tag
     * there would report a visit to a document nobody navigated to.
     *
     * The beacon written into the same shell is keyed on the same property, and was found by
     * review rather than by a check. This is that check, for the other half.
     */
    test('does not appear inside the framed hero', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await expect(page.locator('[data-consent]')).toBeVisible();

        await page.locator('[data-hero-run]').click();

        await expect(page.locator('.frame iframe')).toBeAttached();
        const frame = page.frameLocator('.frame iframe');
        await frame.locator('#app').waitFor({ state: 'attached' });

        await expect(frame.locator('[data-consent]'), 'the framed hero asked a question of its own').toBeHidden();
    });
});
