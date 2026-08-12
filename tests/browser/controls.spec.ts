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
