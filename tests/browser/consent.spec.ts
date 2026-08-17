import { expect, test } from './support/harness';
import type { Page, Request, Response } from '@playwright/test';

/**
 * The question, and the promise that nothing happens until it is answered.
 *
 * WHAT THIS IS REALLY DEFENDING. The whole legal footing of the analytics lane is that no
 * data reaches Google before an explicit yes — not a cookie, not a cookieless ping, nothing.
 * That is a claim about a negative, and a negative is exactly the kind of thing that stays
 * true in review and stops being true in a build: one library that self-initialises, one
 * `config` call moved above the gate, and the page is measuring people who never agreed while
 * every other check stays green.
 *
 * IT SKIPS ON A BUILD WITHOUT THE TAG, which is every build with the switch off. With no tag
 * in the artefact there is no banner, nothing to consent to, and nothing to assert.
 *
 * THE HARNESS ANSWERS GOOGLE, so accepting is safe here: the tag URL is requested and comes
 * back empty, exactly as the audience beacon does in `measurement.spec.ts`. That is also why
 * the accept check asserts a zero-length body rather than merely that a request happened —
 * the request is made whether or not the interception is in force; only the answer differs.
 */
function googleRequests(page: Page): string[] {
    const seen: string[] = [];

    page.on('request', (request: Request) => {
        if (new URL(request.url()).hostname.includes('google')) {
            seen.push(request.url());
        }
    });

    return seen;
}

/** Whether this artefact carries the tag at all, decided from the page rather than from a flag. */
async function skipWithoutTag(page: Page): Promise<void> {
    const html: string = await page.content();

    test.skip(!html.includes('www.googletagmanager.com'), 'this artefact was built without the analytics tag');
}

test.describe('with the question unanswered', () => {
    test.use({ consent: 'unasked' });

    test('the banner asks, and nothing reaches Google before an answer', async ({ page }) => {
        const requested: string[] = googleRequests(page);

        await page.goto('/');
        await skipWithoutTag(page);

        await expect(page.locator('[data-consent]')).toBeVisible();

        // Settled rather than sampled: a tag that self-started would do it during load, and
        // asserting the moment the navigation resolves could miss it by a frame.
        await page.waitForLoadState('networkidle');

        expect(requested, 'something reached Google before the visitor answered').toEqual([]);
    });

    test('refusing loads nothing, and is not asked again', async ({ page }) => {
        const requested: string[] = googleRequests(page);

        await page.goto('/');
        await skipWithoutTag(page);

        await page.locator('[data-consent-refuse]').click();
        await expect(page.locator('[data-consent]')).toBeHidden();

        await page.reload();
        await expect(page.locator('[data-consent]')).toBeHidden();
        await page.waitForLoadState('networkidle');

        expect(requested, 'a refusal still reached Google').toEqual([]);
    });

    /**
     * Escape is an answer, not a dismissal. Leaving the question open would bring the banner
     * back on the next page, which reads as nagging and quietly makes refusing the more
     * expensive of the two choices — the opposite of the parity the banner is built for.
     */
    test('escape records a refusal rather than leaving the question open', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await page.locator('[data-consent]').press('Escape');
        await expect(page.locator('[data-consent]')).toBeHidden();

        await page.reload();
        await expect(page.locator('[data-consent]')).toBeHidden();
    });

    test('accepting loads the tag, and the harness is what answers it', async ({ page }) => {
        const lengths: number[] = [];

        page.on('response', async (response: Response) => {
            if (!response.url().includes('googletagmanager.com')) {
                return;
            }
            // A body that cannot be read is not a body of length zero. -1 fails the
            // assertion on its own rather than passing a case this check has never seen.
            const body: Buffer | null = await response.body().catch(() => null);

            lengths.push(body === null ? -1 : body.length);
        });

        await page.goto('/');
        await skipWithoutTag(page);

        await page.locator('[data-consent-accept]').click();
        await expect(page.locator('[data-consent]')).toBeHidden();

        await expect.poll(() => lengths.length, 'accepting requested no tag at all').toBeGreaterThan(0);

        expect(lengths, 'the tag was answered by something other than the harness').toEqual(lengths.map(() => 0));
    });

    /**
     * The rule the CNIL states and that a design drifts away from one refinement at a time:
     * refusing has to be offered as prominently as accepting. Asserted on computed style
     * rather than on a class name, because a class name is what stays the same while a later
     * rule makes one of the two bigger, bolder or brighter than the other.
     */
    test('refusing is offered exactly as prominently as accepting', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        const appearance = (selector: string) =>
            page.locator(selector).evaluate((element: Element) => {
                const style: CSSStyleDeclaration = getComputedStyle(element);

                return {
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    padding: style.padding,
                    background: style.backgroundColor,
                    color: style.color,
                    border: style.border,
                };
            });

        expect(await appearance('[data-consent-refuse]')).toEqual(await appearance('[data-consent-accept]'));

        // And refusing comes first, so it is the one reached first by reading order and by tab.
        // Compared inside the page: `Node` is a browser global, and this file runs in Node.
        const refusalComesFirst: boolean = await page.locator('[data-consent]').evaluate((banner: Element) => {
            const refuse: Element | null = banner.querySelector('[data-consent-refuse]');
            const accept: Element | null = banner.querySelector('[data-consent-accept]');

            if (refuse === null || accept === null) {
                return false;
            }

            return (refuse.compareDocumentPosition(accept) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
        });

        expect(refusalComesFirst, 'accepting is offered before refusing').toBe(true);
    });
});

/**
 * The journey actually being recorded, for a visitor who accepted.
 *
 * READ OUT OF `dataLayer` RATHER THAN OFF THE WIRE. The harness answers the tag with an empty
 * script, so nothing is ever sent and no request can be inspected — but the inline bootstrap
 * defines `gtag` itself, and everything it is handed lands in `dataLayer` whether or not
 * Google's script arrived. That queue is therefore exactly what the site reports, observed
 * before it leaves the page.
 *
 * IT NAMES A SCENE INSTEAD OF COUNTING EVENTS. A count passes on any sixteen events, including
 * sixteen of the wrong one; naming `the-seed` fails if the dispatch in `Scene.astro` is
 * removed, if the detail loses its name, or if the ordinal quietly becomes the identifier that
 * §15.3 forbids.
 */
test.describe('once the visitor has accepted', () => {
    test.use({ consent: 'granted' });

    test('a scene that was read is reported by name', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await page.locator('[data-scene="the-seed"]').scrollIntoViewIfNeeded();
        await page.locator('[data-scene="the-seed"]').evaluate((scene: Element) => {
            scene.scrollIntoView({ block: 'center' });
        });

        // Polled rather than delayed: the report waits for the scene to hold the middle of
        // the viewport for a moment, and ADR-0009 refuses a fixed wait for exactly this.
        await expect
            .poll(
                () =>
                    page.evaluate(() => {
                        const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

                        return queue
                            .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                            .filter((entry: unknown[]) => entry[0] === 'event' && entry[1] === 'scene_view')
                            .map((entry: unknown[]) => (entry[2] as { scene_name?: string }).scene_name);
                    }),
                'no scene was reported by name',
            )
            .toContain('the-seed');
    });
});

/**
 * The way back, for a visitor who has already answered. Without it a refusal would be
 * permanent and a consent irrevocable, which is the state the banner exists to avoid — and
 * the control is hidden in the markup, so this also says the script that can honour it ran.
 */
test('the privacy page can reopen the question', async ({ page }) => {
    await page.goto('/privacy/');
    await skipWithoutTag(page);

    await expect(page.locator('[data-consent]')).toBeHidden();

    await page.locator('[data-consent-reopen]').click();

    await expect(page.locator('[data-consent]')).toBeVisible();
});
