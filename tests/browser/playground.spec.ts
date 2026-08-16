import { expect, test } from '@playwright/test';

import { watch, type PageComplaints } from './support/watch';

/**
 * The playground's builder works.
 *
 * This is the check with the least competition. `verify-output.sh` asserts that the
 * playground's `<base href>` matches where the playground was copied, which is a claim about
 * two strings agreeing; the failure it guards against is every asset answering 404 and the
 * page rendering nothing at all, with no error printed anywhere. Those are not the same
 * claim, and the deployment guide lists the blank playground in its troubleshooting table
 * because the difference has been met.
 *
 * So this one loads it and uses it. The library is compiled to WebAssembly and executes in
 * the browser with no backend behind it; if the chain is whole, a value comes back that
 * satisfies the constraints the page declares. These checks build the same chain
 * (`Any.String().StartingWith("ORD-")`) by driving the builder's own controls — the native
 * `<select>`s and inputs a visitor uses — never by injecting a pre-built expression.
 */
test.describe('the playground', () => {

    test('draws a value for a chain built entirely by selecting', async ({ page }) => {
        const complaints: PageComplaints = await watch(page);

        await page.goto('/playground/');

        const firstSelect = page.locator('.chain-link').nth(0).locator('select');
        await firstSelect.selectOption({ label: 'String()' });

        const secondSelect = page.locator('.chain-link').nth(1).locator('select');
        await secondSelect.selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-');

        await page.getByRole('button', { name: 'Generate' }).click();

        const value = page.locator('.generate-controls .value');
        await expect(value).toHaveText(/^"ORD-.*"$/);

        // Nothing may have 404'd on the way. This is the blank-page defect stated as an
        // assertion: the base href and the copy destination disagree, every asset misses, and
        // the page renders — empty, and quietly.
        expect(complaints.failed, 'the playground asked for something that was not there').toEqual([]);
        expect(complaints.errors, 'the playground threw while starting').toEqual([]);
    });

    test('draws again when asked, without changing the chain', async ({ page }) => {
        await page.goto('/playground/');

        // NonEmpty() rather than the bare unconstrained String(): an unconstrained draw can
        // legitimately come back as the empty string (specification-adjacent behaviour, not a
        // defect — a 0-length value renders a genuinely empty <output>, which several browsers
        // register as zero-size and therefore "not visible"). The constraint keeps this test's
        // visibility assertion meaningful on every draw rather than flaky roughly one press in
        // seventeen.
        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'NonEmpty()' });
        await page.getByRole('button', { name: 'Generate' }).click();

        const value = page.locator('.generate-controls .value');
        await expect(value).toBeVisible();

        const drawn: string[] = [];
        const button = page.getByRole('button', { name: 'Generate again' });

        for (let press = 0; press < 10; press += 1) {
            await button.click();
            await expect(value).toBeVisible();
            drawn.push((await value.textContent()) ?? '');
        }

        expect(new Set(drawn).size, `ten presses drew one value: ${drawn[0]}`).toBeGreaterThan(1);

        // The chain itself never grew an extra line just from pressing Generate.
        await expect(page.locator('.chain-link')).toHaveCount(3);
    });

    test('offers only the methods valid for the type currently in hand', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Int32()' });

        const secondOptions = await page
            .locator('.chain-link')
            .nth(1)
            .locator('select option')
            .allTextContents();

        // Positive() belongs to AnyInt32; NonEmpty() belongs to AnyString. Offering the wrong
        // one is the failure mode this catalogue's whole design (specification §10.4/§10.7)
        // exists to prevent.
        expect(secondOptions.some(o => o.startsWith('Positive'))).toBe(true);
        expect(secondOptions.some(o => o.startsWith('NonEmpty'))).toBe(false);
    });

    test('shows the library’s own refusal for a contradictory chain, unneutralised', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-12345');
        await page.locator('.chain-link').nth(2).locator('select').selectOption({ label: 'WithMaxLength(length)' });
        await page.locator('.chain-link').nth(2).locator('input').fill('2');

        // The refusal is attached to the step that caused it (specification §13.4), visible
        // without hovering or focusing anything.
        await expect(page.locator('.chain-link').nth(2).locator('.error')).toBeVisible();
    });

    test('removing a step truncates the chain from there on', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-');
        await page.locator('.chain-link').nth(2).locator('select').selectOption({ label: 'NonEmpty()' });

        await expect(page.locator('.chain-link')).toHaveCount(4);

        await page.locator('.chain-link').nth(1).locator('.delete').click();

        // Deleting StartingWith() also removed NonEmpty() after it and the trailing empty
        // selector collapses back to one: just the first line (String()) plus a fresh one.
        await expect(page.locator('.chain-link')).toHaveCount(2);
    });

    test('the doc for a chosen method is visible without hovering or focusing anything', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });

        const doc = page.locator('.chain-link').nth(0).locator('.doc');
        await expect(doc).toBeVisible();
        expect((await doc.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
    });

    test('the help link opens the library’s repository in a new, unprivileged tab', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });

        const help = page.locator('.chain-link').nth(0).locator('a.help');
        await expect(help).toHaveAttribute('target', '_blank');
        const rel = await help.getAttribute('rel');
        expect(rel).toContain('noopener');
        await expect(help.locator('.visually-hidden')).toHaveText(/opens in a new tab/);
    });

    test('copying the code puts the exact chain on the clipboard, with accessible feedback', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
        await page.locator('.chain-link').nth(1).locator('input').fill('ORD-');

        await page.getByRole('button', { name: 'Copy code' }).click();

        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboard).toBe('Any.String().StartingWith("ORD-").Generate();');

        await expect(page.locator('.generate-controls .visually-hidden[role="status"]')).toHaveText(/copied/);
    });

    test('a full keyboard-only pass reaches the select, the delete button and the next select', async ({ page }) => {
        await page.goto('/playground/');

        const select = page.locator('.chain-link').nth(0).locator('select');
        await select.focus();
        await expect(select).toBeFocused();
        await select.selectOption({ label: 'String()' });

        // String() takes no arguments, so the next stops are this step's own delete button and
        // help link, then the second line's select — proving the keyboard path is unbroken end
        // to end rather than merely present in the DOM.
        await page.keyboard.press('Tab');
        await expect(page.locator('.chain-link').nth(0).locator('.delete')).toBeFocused();

        await page.keyboard.press('Tab');
        await expect(page.locator('.chain-link').nth(0).locator('a.help')).toBeFocused();

        await page.keyboard.press('Tab');
        const secondSelect = page.locator('.chain-link').nth(1).locator('select');
        await expect(secondSelect).toBeFocused();
    });

    test('says which version of the library it is running', async ({ page }) => {
        await page.goto('/playground/');

        // Read off the loaded assembly rather than written beside it, so the claim cannot go
        // stale — the check is that the reading worked, not that a particular version shipped.
        await expect(page.locator('.version')).toHaveText(/Generated by JustDummies \S+, running in this browser\./);
        await expect(page.locator('.version')).not.toHaveText(/unknown/);
    });

    test('shows no framework error banner', async ({ page }) => {
        await page.goto('/playground/');

        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
        await expect(page.locator('.chain-link').nth(0).locator('.doc')).toBeVisible();

        // Blazor's own unhandled-error element. It ships in the markup and stays hidden; a
        // visible one means the runtime gave up, and it says so in a corner of the screen
        // rather than by failing to render.
        await expect(page.locator('#blazor-error-ui')).toBeHidden();
    });

    /**
     * The playground counts as part of the site, so it carries the same footer — rebuilt
     * in Blazor (Layout/MainLayout.razor) rather than shared, since Astro and Blazor have
     * no rendering system in common. What both halves must still agree on is that a link
     * back to the site survives `<base href="/playground/" />`: a bare "about" would
     * resolve to /playground/about, a page that does not exist, so the links are asserted
     * root-relative rather than merely present.
     */
    test('carries the site\'s footer, with links that survive its own <base href>', async ({ page }) => {
        await page.goto('/playground/');

        const footer = page.locator('.site-footer');

        await expect(footer).toBeVisible();
        await expect(footer.locator('a[href="/about/"]')).toBeVisible();
        await expect(footer.locator('a[href="/release-notes/"]')).toBeVisible();
        await expect(footer.locator('a[href="/privacy/"]')).toBeVisible();

        const repository = footer.locator('a[href="https://github.com/Reefact/justdummies.io"]');

        await expect(repository).toBeVisible();
        await expect(repository).toHaveAttribute('target', '_blank');
        await expect(repository).toHaveAttribute('rel', /noopener/);
    });

    test('carries the same footer on its own not-found page', async ({ page }) => {
        await page.goto('/playground/not-found');

        await expect(page.locator('.site-footer')).toBeVisible();
    });

    test('carries no footer inside the hero widget embedded in the landing page', async ({ page }) => {
        await page.goto('/playground/hero');

        // BareLayout, deliberately: the widget already sits inside a page that carries the
        // real footer around it, so a second one here would be a duplicate, not a match.
        await expect(page.locator('.site-footer')).toHaveCount(0);
    });

});
