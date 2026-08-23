import { expect, test } from './support/harness';
import type { Page, Request } from '@playwright/test';

/**
 * What a press of Generate reports, and — the half this file exists for — what it does not
 * (ADR-0024).
 *
 * THE COLLECTOR ALREADY REFUSES AN ARGUMENT, so why check here at all. `worker/index.ts`
 * admits a question mark where an argument would stand and nothing else, which is a
 * guarantee against every sender rather than a promise about this one. What it cannot say
 * is whether *this* page sends something the endpoint would refuse: a playground that
 * assembled the real line and posted it would have its event dropped, silently, and the
 * measurement would simply be missing rather than wrong. §10.3's rule is that the value is
 * never persisted outside the browser; an event refused at the door still travelled. So the
 * body is read on the wire, before the collector ever sees it.
 *
 * IT ASSERTS THE ABSENCE BY NAME. A check that only compared the chain against the expected
 * template would pass on a body that carried the template *and* the typed value in some
 * other field — which is exactly the shape a careless addition would take. The typed value
 * is looked for in the whole body, not in the field it would be expected in.
 *
 * `wrangler dev` serves this suite, so `/_event` is the real collector and the request is a
 * real one; `page.on('request')` records it on the Node side, where nothing the page does
 * afterwards can lose it.
 */

/** The page's own posts to the collector, oldest first, parsed. */
function collectorPosts(page: Page): { body: string; parsed: Record<string, unknown> }[] {
    const posted: { body: string; parsed: Record<string, unknown> }[] = [];

    page.on('request', (request: Request) => {
        if (new URL(request.url()).pathname !== '/_event') {
            return;
        }

        const body: string = request.postData() ?? '';

        try {
            posted.push({ body, parsed: JSON.parse(body) as Record<string, unknown> });
        } catch {
            // Not one of ours, or not JSON. Recorded nowhere, so the assertions below fail on
            // "nothing was posted" rather than on a shape.
        }
    });

    return posted;
}

/**
 * Builds `Any.String().StartingWith("ORD-")` through the builder's own controls, the way
 * `playground.spec.ts` does, and presses Generate.
 *
 * The prefix is the interesting part: it is free text, it is the kind of argument a visitor
 * might paste real data into, and it is what must not appear in the request.
 */
async function generateAPrefixedString(page: Page, prefix: string): Promise<void> {
    await page.goto('/playground/');

    await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });
    await page.locator('.chain-link').nth(1).locator('select').selectOption({ label: 'StartingWith(prefix)' });
    await page.locator('.chain-link').nth(1).locator('input').fill(prefix);

    await page.getByRole('button', { name: 'Generate' }).click();
}

test.describe('the playground’s census event', () => {
    test('reports the chain a visitor built, as a shape', async ({ page }) => {
        const posted = collectorPosts(page);

        await generateAPrefixedString(page, 'ORD-');

        await expect.poll(() => posted.map((p) => p.parsed), 'nothing was posted to the collector').toContainEqual({
            event: 'generate-clicked',
            placement: 'playground',
            locale: 'en',
            chain: 'Any.String().StartingWith(?).Generate()',
        });
    });

    /**
     * The one that would have caught the defect ADR-0024 exists to prevent. A prefix nobody
     * would write by accident, looked for in the whole body rather than in one field.
     */
    test('and never the value the visitor typed, anywhere in the body', async ({ page }) => {
        const posted = collectorPosts(page);
        const secret = 'ZZTOP-42-SECRET';

        await generateAPrefixedString(page, secret);

        await expect.poll(() => posted.length, 'nothing was posted to the collector').toBeGreaterThan(0);

        expect(
            posted.filter((p) => p.body.includes(secret)),
            'the value a visitor typed into the playground left the browser',
        ).toEqual([]);
    });

    /**
     * A LIST ARGUMENT IS ONE FIELD AND SEVERAL ARGUMENTS (ADR-0016), and the count is the half
     * a naive walk loses. `OneOf` takes `params T[]`, so the bar spreads one comma-separated
     * field back into the call and the line a visitor reads carries three arguments where the
     * catalogue names one parameter. Reported per parameter it would read `OneOf(?)` — a shape
     * the bar can never draw, and one that flattens every list arity into a single row, which
     * is exactly what ADR-0024 chose the template form to avoid.
     *
     * Found in review rather than by a check, which is why this one exists. The values are
     * spelled so they could not appear by accident, because the second assertion is the one
     * that matters: counting them must not mean sending them.
     */
    test('reports one placeholder per value of a list argument, and none of the values', async ({ page }) => {
        const posted = collectorPosts(page);

        await page.goto('/playground/');
        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'String()' });

        const step = page.locator('.chain-link').nth(1);
        await step.locator('select').selectOption({ label: 'OneOf(values)' });
        await step.locator('input').fill('ZZRED, ZZGREEN, ZZBLUE');

        await page.getByRole('button', { name: 'Generate' }).click();

        await expect.poll(() => posted.map((p) => p.parsed), 'nothing was posted to the collector').toContainEqual({
            event: 'generate-clicked',
            placement: 'playground',
            locale: 'en',
            chain: 'Any.String().OneOf(?, ?, ?).Generate()',
        });

        expect(
            posted.filter((p) => /ZZ(RED|GREEN|BLUE)/.test(p.body)),
            'a value from the list left the browser',
        ).toEqual([]);
    });

    /**
     * A chain with no arguments at all, in the other locale. Two facts at once, because they
     * share a page load: an empty parameter list reports as `()` rather than as `(?)`, and the
     * locale reported is the reader's own rather than the document's default.
     */
    test('reports an argument-free chain, and the reader’s own locale', async ({ page }) => {
        const posted = collectorPosts(page);

        await page.goto('/playground/?lang=fr');
        await page.locator('.chain-link').nth(0).locator('select').selectOption({ label: 'Guid()' });
        await page.getByRole('button', { name: 'Générer' }).click();

        await expect.poll(() => posted.map((p) => p.parsed), 'nothing was posted to the collector').toContainEqual({
            event: 'generate-clicked',
            placement: 'playground',
            locale: 'fr',
            chain: 'Any.Guid().Generate()',
        });
    });
});

/**
 * The same press, in the lane that can tell one visitor from another (ADR-0025).
 *
 * WHY THIS IS A SEPARATE DESCRIBE. Every other check in this file runs with the harness's
 * default refusal, which is the state where no Google script is even asked for. This one
 * needs the opposite, and needs it before the page loads.
 *
 * READ OFF `dataLayer` RATHER THAN OFF THE NETWORK. `gtag` pushes its arguments into that
 * array synchronously and the transport batches afterwards, so asserting on a request would
 * be asserting on Google's own scheduling — the shape of check ADR-0009 refuses. What is
 * being defended here is that this playground reports the press at all, and to the right
 * event name.
 */
test.describe('a press of Generate, for a visitor who accepted', () => {
    test.use({ consent: 'granted' });

    test('reaches the journey lane, and carries no chain there', async ({ page }) => {
        await generateAPrefixedString(page, 'ORD-');

        const pushed = await page.evaluate(() => {
            const layer = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return layer
                .map((entry) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry) => entry[0] === 'event' && entry[1] === 'playground_generated');
        });

        expect(pushed, 'the press did not reach the journey lane').toHaveLength(1);
        expect(pushed[0][2], 'the journey event did not carry the locale').toMatchObject({ content_locale: 'en' });

        // ADR-0024 puts the shape in the lane that covers everybody, deliberately. Sending it
        // here as well would widen what a third party is told for a figure already answered
        // next door — so the absence is the decision, and it is asserted as one.
        expect(
            JSON.stringify(pushed[0][2]),
            'the journey event carried the chain, which belongs to the census lane alone',
        ).not.toContain('Any.');
    });
});

/**
 * WHERE THE BEACON LOADS FROM, AND WHY THIS IS A HOSTNAME RATHER THAN A SUBSTRING.
 * `support/harness.ts` already states the rule for these two checks and this file did
 * not follow it: a URL *containing* `static.cloudflareinsights.com` is not a request to
 * that host — `https://elsewhere.invalid/?ref=static.cloudflareinsights.com` contains it
 * and is somebody else. Compared against the parsed hostname, the predicate says what it
 * means, which is also how `consent.spec.ts` and `download-fab.spec.ts` ask their
 * version of this question.
 */
const BEACON_HOST = 'static.cloudflareinsights.com';

/**
 * AND WHAT SAYS A DOCUMENT CARRIES THE BEACON, which is not a host at all — it is the
 * tag's own attribute. `generate-headers.mjs` gives the reason where it reads the
 * analytics tag: a host is a string a page could one day mention in prose, a privacy
 * page naming its subprocessors say, and a check that reads one cannot tell a tag from a
 * paragraph. The attribute appears on the tag and nowhere else.
 */
const BEACON_TAG = 'data-cf-beacon';

/**
 * The framed hero, which is the same shell at a second address.
 *
 * `_redirects` rewrites `/playground/hero` to `/playground/` with a 200, so both routes are
 * served the one document — and `LiveHero.astro` loads that address into an iframe the
 * moment a visitor presses Run on the landing page. A beacon written as a plain tag fires
 * in an iframe exactly as it does in a tab, so every Run would have reported a playground
 * visit nobody made, into the one figure the beacon was added to establish. Worse than
 * noise: the census event comes from `Home.razor` alone, so the denominator would have
 * grown against a numerator that never moves.
 *
 * Found in review rather than by this check, which is why the check exists.
 */
test.describe('the framed hero', () => {
    test('does not report a visit of its own', async ({ page }) => {
        const beacons: string[] = [];

        page.on('request', (request: Request) => {
            if (new URL(request.url()).hostname === BEACON_HOST) {
                beacons.push(request.url());
            }
        });

        await page.goto('/');

        const html: string = await page.content();

        test.skip(!html.includes(BEACON_TAG), 'this artefact was built without a beacon token');

        // The landing page is a document a visitor navigated to, so it reports — and its
        // request is the baseline the assertion below is measured against.
        await expect.poll(() => beacons.length, 'the landing page reported no visit at all').toBe(1);

        await page.locator('[data-hero-run]').click();

        // Awaited on the frame rather than on a delay: the shell has to have loaded for the
        // question to mean anything, and ADR-0009 refuses a fixed wait.
        await expect(page.locator('.frame iframe')).toBeAttached();
        await page.frameLocator('.frame iframe').locator('#app').waitFor({ state: 'attached' });

        expect(beacons, 'the framed playground reported a visit nobody made').toHaveLength(1);
    });
});
