import { expect, test } from '@playwright/test';

/**
 * The controls, in both directions.
 *
 * A control is tested one way round more often than it deserves: the fold opens, the tab
 * switches, the menu drops down. The way back is where they break, and the way back is what
 * a reader does second. Every check below therefore exercises the return trip, and one of
 * them was written red — the fold opened and never closed again, because clearing a data
 * attribute by assigning `undefined` writes the string "undefined" rather than removing it.
 */
test.describe('the fold', () => {

    test('opens the file and closes it again', async ({ page }) => {
        await page.goto('/');

        const figure = page.locator('.sample[data-folds]').first();
        const button = figure.locator('[data-fold]');
        const code   = figure.locator('[data-code]');

        // Shipped hidden and unhidden by the script that can act on it: ADR-0004, checked
        // here on the rendered page rather than in the markup.
        await expect(button).toBeVisible();
        await expect(button).toHaveAttribute('aria-expanded', 'false');
        await expect(figure).toHaveAttribute('data-folded', '');

        const clipped: number = (await code.boundingBox())?.height ?? 0;

        await button.click();

        await expect(button).toHaveAttribute('aria-expanded', 'true');
        await expect(figure).not.toHaveAttribute('data-folded', /.*/);

        const whole: number = (await code.boundingBox())?.height ?? 0;

        expect(whole, 'opening the fold showed no more of the file').toBeGreaterThan(clipped);

        // The return trip. This is the assertion that was red when it was written.
        await button.click();

        await expect(button).toHaveAttribute('aria-expanded', 'false');
        await expect(figure).toHaveAttribute('data-folded', '');

        const reclipped: number = (await code.boundingBox())?.height ?? 0;

        expect(reclipped, 'the fold would not close again').toBeLessThan(whole);
    });

    test('leaves the reader where they were reading', async ({ page }) => {
        await page.goto('/');

        const figure = page.locator('.sample[data-folds]').first();
        const button = figure.locator('[data-fold]');

        await button.scrollIntoViewIfNeeded();
        await button.click();
        await expect(figure).not.toHaveAttribute('data-folded', /.*/);

        // At the end of the open file, hand on the button — the state the report described.
        await button.scrollIntoViewIfNeeded();

        /*
         * READ, CLOSED AND READ AGAIN WITHOUT LEAVING THE PAGE, and that is what makes this
         * check measure the fold rather than the harness.
         *
         * Split into three round trips — measure, `button.click()`, measure — it does not.
         * Delivering a click is not only dispatching one: Playwright scrolls the element into
         * view first, and here it does, by up to several hundred pixels, because the scene
         * around the fold is still finishing its reveal when the first measurement is taken.
         * `before` then describes a viewport the page has already left, and the difference
         * that comes out is that scroll. Recorded over 24 throttled trials: the button read
         * 324px down the viewport, the page scrolled 364px between the reading and the click,
         * and the check reported a 348px drift on a fold that had moved the reader by nothing
         * at all — the handler pinned the button to 672.5px and left it there, exactly, on
         * every single trial. That is the intermittent red this check has been raising, most
         * recently against release/2026-08-16T01-37-43Z: the measurement, not the fold.
         *
         * So both readings are taken either side of the click, in the page, in one go. The
         * correction is synchronous — the handler scrolls before it returns — so the second
         * reading is the settled one, and nothing gets between the two.
         */
        const drift: number = await button.evaluate((element: HTMLElement) => {
            const before: number = element.getBoundingClientRect().top;

            element.click();

            return element.getBoundingClientRect().top - before;
        });

        await expect(figure).toHaveAttribute('data-folded', '');

        /*
         * Closing takes about sixteen hundred pixels out of the document. Left alone, the
         * browser keeps scrollY and everything below rises by that much: measured before the
         * fix, this button went from 337px down the viewport to -1304, and the reader landed
         * far below what they were reading. Two pixels of tolerance for sub-pixel layout.
         */
        expect(Math.abs(drift), `the button moved ${drift.toFixed(0)}px when the fold closed`).toBeLessThan(2);
    });

    test('names what each press will do', async ({ page }) => {
        await page.goto('/');

        const figure = page.locator('.sample[data-folds]').first();
        const button = figure.locator('[data-fold]');

        // A closed fold says how much is behind it, because that is what decides whether the
        // reader opens it. An open one does not repeat the count: a reader looking at the
        // whole file can see how long it is.
        await expect(button).toHaveText(/\(\d+ lines\)|\(\d+ lignes\)/);

        await button.click();

        await expect(button).not.toHaveText(/\(\d+ lines\)|\(\d+ lignes\)/);
    });

});

test.describe('the install tabs', () => {

    test('switch between the two commands, and back', async ({ page }) => {
        await page.goto('/');

        const block = page.locator('.install').first();
        const cli   = block.locator('[data-tab="cli"]');
        const pm    = block.locator('[data-tab="pm"]');

        await expect(block.locator('[data-tablist]')).toBeVisible();
        await expect(cli).toHaveAttribute('aria-selected', 'true');
        await expect(block.locator('[data-panel="cli"]')).toBeVisible();
        await expect(block.locator('[data-panel="pm"]')).toBeHidden();

        await pm.click();

        await expect(pm).toHaveAttribute('aria-selected', 'true');
        await expect(cli).toHaveAttribute('aria-selected', 'false');
        await expect(block.locator('[data-panel="pm"]')).toBeVisible();
        await expect(block.locator('[data-panel="cli"]')).toBeHidden();

        await cli.click();

        await expect(cli).toHaveAttribute('aria-selected', 'true');
        await expect(block.locator('[data-panel="cli"]')).toBeVisible();
    });

    test('are announced as tabs only once they can switch', async ({ page }) => {
        await page.goto('/');

        // `role="tab"` on a button that switches nothing is a promise to a screen reader the
        // page cannot keep, so the roles are attached by the same script that makes the tabs
        // work. With the script run, they are there.
        await expect(page.locator('.install [data-tab="cli"]').first()).toHaveAttribute('role', 'tab');
        await expect(page.locator('.install [data-panel="cli"]').first()).toHaveAttribute('role', 'tabpanel');
    });

});

test.describe('the language menu', () => {

    test('closes when the reader clicks away from it', async ({ page }) => {
        await page.goto('/');

        const menu = page.locator('.language-selector details');

        await expect(menu).not.toHaveAttribute('open', /.*/);

        await menu.locator('summary').click();

        await expect(menu).toHaveAttribute('open', '');

        // Clicking elsewhere on the page closes it. A native `<details>` does not do this on
        // its own — it stays open until its own summary is pressed again — which is why the
        // component adds it, and why nothing but a browser can check it.
        await page.locator('h1').first().click();

        await expect(menu).not.toHaveAttribute('open', /.*/);
    });

    test('closes on Escape', async ({ page }) => {
        await page.goto('/');

        const menu = page.locator('.language-selector details');

        await menu.locator('summary').click();
        await expect(menu).toHaveAttribute('open', '');

        await page.keyboard.press('Escape');

        await expect(menu).not.toHaveAttribute('open', /.*/);
    });

});

test.describe('the copy button', () => {

    test('puts the command it names on the clipboard', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        await page.goto('/');

        const button = page.locator('[data-copy][data-placement="hero"][data-variant="dotnet-cli"]');

        await expect(button).toBeVisible();

        const command: string = (await button.getAttribute('data-command')) ?? '';

        expect(command, 'the copy button names no command').not.toEqual('');

        await button.click();

        // What the button says happened, and what actually happened. The label alone would
        // pass on a button that announces success and copies nothing.
        await expect(button).toHaveText(/Copied|Copié/);

        const clipboard: string = await page.evaluate(() => navigator.clipboard.readText());

        expect(clipboard, 'the clipboard holds something other than the command shown').toEqual(command);
    });

});
