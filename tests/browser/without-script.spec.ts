import { expect, test } from './support/harness';

import { PAGES } from './support/watch';

/**
 * The page without scripting: whole, and with nothing dead on it.
 *
 * ADR-0004 was written after the install tablist reached production visible without
 * scripting, because the component's own `display: flex` beat the `hidden` attribute. The
 * markup was right, the build was green, and the defect was found by loading the page with
 * scripting refused — a state nothing in this repository could enter.
 *
 * This is that state, entered on purpose. The ADR names three parts and each is checked here
 * against the rendered page rather than against the markup that already looked correct.
 */
test.describe('without scripting', () => {

    test.use({ javaScriptEnabled: false });

    for (const path of PAGES) {

        test(`${path} offers no control it cannot honour`, async ({ page }) => {
            await page.goto(path);

            // Each of these is unhidden by its own script. With no script, a visible one is a
            // promise the page cannot keep: a tablist that switches nothing, a fold that
            // folds nothing, a copy button that copies nothing.
            //
            // Counted rather than taken one at a time: this page carries four install blocks
            // and sixteen copy buttons, and the defect ADR-0004 was written for appeared on
            // one component while its neighbours were correct.
            await expect(page.locator('[data-tablist]:visible')).toHaveCount(0);
            await expect(page.locator('[data-fold]:visible')).toHaveCount(0);
            await expect(page.locator('[data-copy]:visible')).toHaveCount(0);

            // And they are there to be hidden. Without this, a page that had lost its install
            // block entirely would pass the three assertions above with room to spare.
            expect(await page.locator('[data-tablist]').count()).toBeGreaterThan(0);
            expect(await page.locator('[data-copy]').count()).toBeGreaterThan(0);
        });

        test(`${path} still reaches both install commands`, async ({ page }) => {
            await page.goto(path);

            // The second half of ADR-0004, and the half that makes hiding honest: what the
            // tablist hides is a stacked form that is already in the markup. Hiding a control
            // that is the only route to some content would trade a dead button for missing
            // content, which is worse than the defect being fixed.
            await expect(page.locator('[data-panel="cli"]').first()).toBeVisible();
            await expect(page.locator('[data-panel="pm"]').first()).toBeVisible();
        });

    }

    test('shows the scaffolded file whole', async ({ page }) => {
        await page.goto('/');

        // The fold is applied by script and only by script, so a reader without one gets the
        // file entire rather than a clipped block with no way to open it. 101 lines stand
        // several times taller than the 32rem the script clips to.
        const code = page.locator('.sample[data-folds] [data-code]');

        await expect(code).toBeVisible();

        const height: number = (await code.boundingBox())?.height ?? 0;

        expect(height, 'the file is clipped for a reader who cannot unclip it').toBeGreaterThan(1_000);
    });

    test('shows every scene', async ({ page }) => {
        await page.goto('/');

        // ADR-0005's arrival is armed by an inline script in the head, which sets the
        // attribute the CSS hangs the starting opacity on. No script, no arming — and the
        // page must be readable rather than a column of invisible paragraphs.
        await expect(page.locator('html')).not.toHaveAttribute('data-reveal-armed', /.*/);
        await expect(page.locator('[data-reveal]').last()).toBeVisible();
    });

});
