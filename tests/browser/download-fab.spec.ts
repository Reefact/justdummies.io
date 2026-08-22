import { expect, test } from './support/harness';
import type { Page, Request } from '@playwright/test';

/**
 * What the floating download control reports, in both lanes that count it (#161, ADR-0023).
 *
 * WHY IT IS CHECKED IN A BROWSER AT ALL, when `verify-output.sh` already asserts that every
 * page drawing the control marks it with a placement. That assertion covers the half written
 * into the artefact; this covers the half that only exists once something runs. The attribute
 * can be present and read by nobody — the listener is delegated, so a selector that stops
 * matching, a script that fails to bundle, or a lane that silently refuses would each leave
 * the markup exactly as the build check likes it and the dataset exactly as empty as before.
 *
 * THE CLICK IS PREVENTED, NOT AVOIDED. The control is a link, so a real click leaves the page
 * — and `dataLayer` leaves with it. `preventDefault` cancels the navigation without stopping
 * propagation, so the site's own delegated listeners still run on the same event they would
 * have run on: what is skipped is the browser following the href, which is the one part of
 * this that is not being measured.
 *
 * THE CENSUS BEACON IS OBSERVED RATHER THAN STUBBED. `wrangler dev` serves this suite, and
 * the collector runs behind `/_event` on it, so the request is a real one to the real script;
 * `page.on('request')` records it on the Node side, where nothing the page does afterwards can
 * lose it. What cannot be asserted here is that the collector *accepted* it: it answers 204
 * for a rejection too, deliberately (worker/index.ts), which is why the deployment guide
 * checks the row rather than the status.
 */

/** The page's own posts to the collector, oldest first, parsed. */
function collectorPosts(page: Page): Record<string, unknown>[] {
    const posted: Record<string, unknown>[] = [];

    page.on('request', (request: Request) => {
        if (new URL(request.url()).pathname !== '/_event') {
            return;
        }

        try {
            posted.push(JSON.parse(request.postData() ?? '') as Record<string, unknown>);
        } catch {
            // A body that will not parse is not one of ours, and pushing nothing here lets
            // the assertion below fail on "no event was posted" rather than on a shape.
        }
    });

    return posted;
}

/** Cancels the navigation a link click would start, leaving the click itself untouched. */
async function holdTheReaderOnThePage(page: Page): Promise<void> {
    await page.evaluate(() => {
        document.addEventListener('click', (event: Event) => event.preventDefault(), true);
    });
}

/** What the journey lane was handed, for one event name. */
function reported(page: Page, name: string): Promise<Record<string, unknown>[]> {
    return page.evaluate((event: string) => {
        const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

        return queue
            .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
            .filter((entry: unknown[]) => entry[0] === 'event' && entry[1] === event)
            .map((entry: unknown[]) => entry[2] as Record<string, unknown>);
    }, name);
}

/**
 * The census lane, which asks nobody's permission — so this runs under the suite's default
 * refusal, and a refusal is exactly the case that must still be counted.
 */
test.describe('the census lane', () => {
    test('a click on the download control is posted with the section it came from', async ({ page }) => {
        const posted: Record<string, unknown>[] = collectorPosts(page);

        await page.goto('/about');
        await holdTheReaderOnThePage(page);
        await page.locator('.download-fab').click();

        await expect.poll(() => posted, 'nothing was posted to the collector').toContainEqual({
            event: 'download-fab-clicked',
            placement: 'about',
            locale: 'en',
        });
    });

    /**
     * `toContainEqual` above already fails on an extra key, which is what says no variant was
     * sent — but it fails with a whole-object diff, and the reason it matters is narrow enough
     * to deserve its own red line. A variant here would not be a wrong value; it would be a
     * word invented for a control with one door, which ADR-0023 exists to refuse.
     */
    test('and carries no variant, because there is one door behind it', async ({ page }) => {
        const posted: Record<string, unknown>[] = collectorPosts(page);

        await page.goto('/about');
        await holdTheReaderOnThePage(page);
        await page.locator('.download-fab').click();

        await expect.poll(() => posted.length, 'nothing was posted to the collector').toBeGreaterThan(0);

        expect(
            Object.keys(posted[0]).sort(),
            'the control sent a variant, or stopped sending a field every event carries',
        ).toEqual(['event', 'locale', 'placement']);
    });

    /**
     * The home page and the French half at once, because both are special: `/` is the one route
     * with no section of its own to name, and the locale is the field that says which half of
     * the site a reader was on when they left it.
     */
    test('the French home page reports its own section and its own locale', async ({ page }) => {
        const posted: Record<string, unknown>[] = collectorPosts(page);

        await page.goto('/fr/');
        await holdTheReaderOnThePage(page);
        await page.locator('.download-fab').click();

        await expect.poll(() => posted, 'nothing was posted to the collector').toContainEqual({
            event: 'download-fab-clicked',
            placement: 'home',
            locale: 'fr',
        });
    });
});

/**
 * The journey lane, for a visitor who accepted. It explains what the census lane counts, so
 * the placement is sent here too — the same key in both is what lets the two be read together
 * rather than one instead of the other.
 */
test.describe('the journey lane, once the visitor has accepted', () => {
    test.use({ consent: 'granted' });

    test('the same click is reported to the tag with its placement', async ({ page }) => {
        await page.goto('/about');

        const html: string = await page.content();

        test.skip(!html.includes('data-jd-analytics'), 'this artefact was built without the analytics tag');

        await holdTheReaderOnThePage(page);
        await page.locator('.download-fab').click();

        await expect
            .poll(() => reported(page, 'download_fab_clicked'), 'the exit was not reported to the tag')
            .toContainEqual(expect.objectContaining({ placement: 'about', content_locale: 'en' }));
    });
});

/**
 * The refusal, which is the half of ADR-0018 that is easy to ship broken: an event that reaches
 * the tag anyway costs nothing visible and is a transfer nobody agreed to. The census lane above
 * runs under the same refusal and must still count, so this also says the two lanes are genuinely
 * independent rather than one gate serving both.
 */
test.describe('the journey lane, for a visitor who refused', () => {
    test.use({ consent: 'denied' });

    test('the click is counted by the census lane and reported to nobody else', async ({ page }) => {
        const posted: Record<string, unknown>[] = collectorPosts(page);

        await page.goto('/about');
        await holdTheReaderOnThePage(page);
        await page.locator('.download-fab').click();

        await expect.poll(() => posted.length, 'the refusal cost the census lane its count').toBeGreaterThan(0);

        expect(await reported(page, 'download_fab_clicked'), 'a refused visitor was reported to the tag').toEqual(
            [],
        );
    });
});
