import { ANALYTICS_TAG_MARKER, expect, test } from './support/harness';
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

    /**
     * The analytics hosts, exercised rather than read.
     *
     * The harness answers the tag with an empty script, so accepting never makes the tag
     * issue a single collect request — which means loading a page proves nothing about the
     * `connect-src` and `img-src` entries the tag needs. They would be wrong in exactly the
     * way that only shows up in production, on a visitor who accepted.
     *
     * So the request is made here on purpose, the same way the inline style below is
     * injected on purpose. The policy is enforced in the renderer before the request ever
     * reaches Playwright's routing, so a missing `connect-src` entry raises a violation and
     * never gets as far as the stub.
     */
    test('admits the hosts the analytics tag collects to', async ({ page }) => {
        const complaints: PageComplaints = await watch(page);

        await page.goto('/');

        const html: string = await page.content();

        test.skip(!html.includes(ANALYTICS_TAG_MARKER), 'this artefact was built without the analytics tag');

        await page.evaluate(async () => {
            await fetch('https://region1.google-analytics.com/g/collect', { method: 'POST' }).catch(() => undefined);
        });

        expect(await complaints.violations(), 'the policy refuses a host the tag has to reach').toEqual([]);
    });

    /**
     * And the advertising hosts stay refused. They are deliberately absent from the policy
     * and deliberately not stubbed by the harness, because the permanent denial of the three
     * advertising consent signals is a decision no build step can enforce on its own. This is
     * the browser enforcing it: whatever the tag is configured to do, a request to an
     * advertising host cannot leave this page.
     */
    test('refuses the advertising hosts, whatever the tag decides', async ({ page }) => {
        const complaints: PageComplaints = await watch(page);

        await page.goto('/');

        await page.evaluate(async () => {
            await fetch('https://stats.g.doubleclick.net/g/collect', { method: 'POST' }).catch(() => undefined);
        });

        const violations: string[] = await complaints.violations();

        expect(violations.join('\n'), 'an advertising host was reachable from this page').toContain('connect-src');
    });

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
