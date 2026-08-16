import { expect, test } from './support/harness';

/**
 * Scenes arrive, everything arrives eventually, and a reader who asked for stillness gets it.
 *
 * ADR-0005 is checked today by reading the built markup for an attribute and the stylesheet
 * for a rule. Both were correct on the build where two groups sitting in the last 15% of the
 * document never entered the observer's shrunken root and stayed at zero opacity for good —
 * the page had content nobody could read, and it took scrolling the built page to the end to
 * find out. That is what this file automates.
 */
test.describe('the scenes', () => {

    test('start hidden and arrive as the reader scrolls', async ({ page }) => {
        await page.goto('/');

        // The arming is what the starting opacity hangs off. Without it every rule below is
        // inert and the rest of this check would pass on a page with no reveal at all.
        await expect(page.locator('html')).toHaveAttribute('data-reveal-armed', '');

        const last = page.locator('[data-reveal]').last();

        await expect(last).not.toHaveAttribute('data-revealed', /.*/);

        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

        await expect(last).toHaveAttribute('data-revealed', '');
        await expect(last).toHaveCSS('opacity', '1');
    });

    test('leave nothing behind at the bottom of the document', async ({ page }) => {
        await page.goto('/');

        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

        // Every group, not the last one: the defect was two groups in the final 15% of the
        // document, and checking only the last of them would have missed one.
        const groups = page.locator('[data-reveal]');
        const count: number = await groups.count();

        expect(count, 'the page declares nothing to reveal').toBeGreaterThan(0);

        for (let index: number = 0; index < count; index += 1) {
            await expect(groups.nth(index), `group ${index} never arrived`).toHaveAttribute('data-revealed', '');
        }
    });

});

test.describe('a reader who asked for no motion', () => {

    test('is given the content rather than made to wait for it', async ({ page }) => {
        // Emulated on the page rather than declared on the context. The context option was
        // written first and silently did nothing on the browser this repository develops
        // against — which is the failure mode a check like this must not have, because the
        // next assertion would then be reporting on a reader who never asked for anything.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/');

        expect(
            await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
            'the browser was never told the reader wants no motion',
        ).toBe(true);

        // Still armed — the attribute is what the reduced-motion rule itself hangs off — but
        // the group below the fold is already fully opaque, with nothing to wait for and no
        // scroll required. Opacity is animation too.
        await expect(page.locator('html')).toHaveAttribute('data-reveal-armed', '');
        await expect(page.locator('[data-reveal]').last()).toHaveCSS('opacity', '1');
        await expect(page.locator('[data-reveal]').last()).toHaveCSS('transition-duration', /^0s(, 0s)*$/);
    });

});
