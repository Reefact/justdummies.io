import { expect, test } from './support/harness';
import type { Response } from '@playwright/test';

import { PAGES, watch, type PageComplaints } from './support/watch';

/**
 * The Content-Security-Policy is delivered, enforced, and broken by nothing on the page.
 *
 * `generate-headers.mjs` computes a hash for every inline script at build time,
 * `verify-output.sh` checks each one is covered, and `check-served-headers.sh` checks the
 * host applies the rules at all. All three read; none of them asks the browser whether it
 * agreed. That gap is where a policy tight enough to be worth having goes wrong: the site
 * sets `style-src 'self'` with no `unsafe-inline`, so a single inline style attribute — the
 * ordinary output of half the syntax highlighters on npm — is refused at run time and shows
 * up as a page that renders slightly wrong.
 */
test.describe('the content-security-policy', () => {

    for (const path of PAGES.concat('/playground/')) {

        test(`is enforced on ${path}, and nothing on the page breaks it`, async ({ page }) => {
            const complaints: PageComplaints = await watch(page);

            const response: Response | null = await page.goto(path);

            expect(response, `${path} was not answered at all`).not.toBeNull();

            // Asserted first, and it is not a formality. With no policy delivered there is
            // nothing to violate, so the assertion below would pass on a site that had lost
            // its policy entirely — the check would be at its greenest exactly when the thing
            // it protects was gone.
            const policy: string | undefined = (await response?.allHeaders())?.['content-security-policy'];

            expect(policy, `${path} was served with no content-security-policy`).toBeTruthy();
            expect(policy).toContain("style-src 'self'");
            expect(policy).not.toContain('unsafe-inline');

            // The page has to have finished doing whatever it does before its refusals can be
            // read; a violation raised by a late script is still a violation.
            await page.waitForLoadState('networkidle');

            expect(await complaints.violations(), `${path} broke its own policy`).toEqual([]);
            expect(complaints.errors, `${path} threw while loading`).toEqual([]);
        });

    }

    test('refuses an inline style, so the check above is checking something', async ({ page }) => {
        const complaints: PageComplaints = await watch(page);

        await page.goto('/');

        // The suite's own control. Every assertion above is the absence of something, and an
        // absence proves nothing until the presence has been shown to be detectable: this
        // does to the page exactly what a careless component would do, and the browser must
        // refuse it. If this ever passes silently, the policy is not being enforced and the
        // three checks above are decoration.
        await page.evaluate(() => {
            const injected: HTMLElement = document.createElement('div');

            injected.setAttribute('style', 'color: rebeccapurple');
            document.body.appendChild(injected);
        });

        const violations: string[] = await complaints.violations();

        expect(violations.join('\n'), 'the browser accepted an inline style the policy forbids').toContain('style-src');
    });

});
