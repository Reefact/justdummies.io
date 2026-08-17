import { ANALYTICS_TAG_MARKER, expect, isAnalyticsHost, isAnalyticsTagHost, test } from './support/harness';
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
        if (isAnalyticsHost(new URL(request.url()).hostname)) {
            seen.push(request.url());
        }
    });

    return seen;
}

/** Whether this artefact carries the tag at all, decided from the page rather than from a flag. */
async function skipWithoutTag(page: Page): Promise<void> {
    const html: string = await page.content();

    test.skip(!html.includes(ANALYTICS_TAG_MARKER), 'this artefact was built without the analytics tag');
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

    /**
     * Answering in one tab settles the question in the other.
     *
     * Starting the measurement there without also taking the banner down would leave that
     * tab reporting while its own interface still asks whether it may — the state a
     * visitor would read as the site ignoring them.
     */
    test('answering in one tab takes the question down in the other', async ({ page, context }) => {
        await page.goto('/');
        await skipWithoutTag(page);
        await expect(page.locator('[data-consent]')).toBeVisible();

        const other = await context.newPage();

        await other.goto('/');
        await other.locator('[data-consent-accept]').click();

        await expect(page.locator('[data-consent]'), 'the other tab kept asking a question already answered').toBeHidden();

        await other.close();
    });

    test('accepting loads the tag, and the harness is what answers it', async ({ page }) => {
        const lengths: number[] = [];

        page.on('response', async (response: Response) => {
            if (!isAnalyticsTagHost(new URL(response.url()).hostname)) {
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
 * The dwell timer that fires while unanswered finds nothing to report and consumes
 * nothing — right, so a later acceptance can still count the scene. But `Scene.astro`
 * dispatches its event only on a fresh arrival, and a visitor who accepts without having
 * moved never produces one. Without a re-check at the moment reporting starts, the scene
 * likeliest to still be on screen when the banner is answered is the one silently missing
 * from every funnel.
 */
test.describe('when a scene is already held before answering', () => {
    test.use({ consent: 'unasked' });

    test('accepting without scrolling still reports the held scene', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await page.locator('[data-scene="the-seed"]').evaluate((scene: Element) => {
            scene.scrollIntoView({ block: 'center' });
        });

        await page.locator('[data-consent-accept]').click();

        // Bounded well under DWELL_MS on purpose. The scroll above also arms the ordinary
        // one-second dwell timer, which — reporting removed or not — will itself report this
        // same scene roughly a second later once accepting has made `reporting` true, through
        // a path this test is not the one exercising. A long poll would wait long enough for
        // that timer to save a broken fix; this only accepts a report that arrived promptly,
        // which only `start()`'s own re-check can produce.
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
                { message: 'the scene already held when accepting was not reported promptly', timeout: 500 },
            )
            .toContain('the-seed');
    });
});

/**
 * A grant reaches every open tab through `storage`, and starting all of them at the same
 * instant would fire a page_view from documents nobody was reading — the opposite of an
 * accurate journey. Exercised at startup rather than across two real tabs: the moment
 * `applyDecision()` reads a stored grant is deterministic on load, where a genuine
 * cross-tab `storage` event is not, and it is the same function either way.
 */
test.describe('when a tab is not the one being looked at', () => {
    test.use({ consent: 'granted' });

    test('a hidden tab defers starting until it becomes visible', async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
        });

        await page.goto('/');
        await skipWithoutTag(page);

        const startedWhileHidden: boolean = await page.evaluate(
            () => (window as unknown as { jdAnalyticsStarted?: boolean }).jdAnalyticsStarted === true,
        );

        expect(startedWhileHidden, 'a background tab started analytics before anyone looked at it').toBe(false);

        await page.evaluate(() => {
            Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
        });

        await expect
            .poll(
                () => page.evaluate(() => (window as unknown as { jdAnalyticsStarted?: boolean }).jdAnalyticsStarted === true),
                'the tab never started after becoming visible',
            )
            .toBe(true);
    });
});

/**
 * An answer that storage would not keep, kept anyway for the page that gave it.
 *
 * A browser that throws on `setItem` — private mode with storage blocked outright, a quota
 * already spent — leaves `remember()`'s write failing silently by design (its own comment says
 * so). Without a page-local fallback the next `visibilitychange` finds nothing to read: an
 * accepted session stops mid-page and a banner already answered comes back. Broken only after
 * the page has loaded, so the harness's own seeding is unaffected — this is about the write
 * `remember()` makes, not about storage in general.
 */
test.describe('when storage refuses to keep the answer', () => {
    test.use({ consent: 'unasked' });

    test('an accepted session survives storage rejecting the write', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await page.evaluate(() => {
            window.localStorage.setItem = () => {
                throw new DOMException('rejected for this test', 'QuotaExceededError');
            };
        });

        await page.locator('[data-consent-accept]').click();
        await expect(page.locator('[data-consent]')).toBeHidden();

        await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

        const trail: string[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'consent' && entry[1] === 'update')
                .map((entry: unknown[]) => (entry[2] as { analytics_storage?: string }).analytics_storage ?? '');
        });

        expect(
            trail[trail.length - 1],
            'the accepted session was silently stopped after storage rejected the write',
        ).toBe('granted');
        await expect(
            page.locator('[data-consent]'),
            'the banner reopened despite an answer already given this page',
        ).toBeHidden();
    });
});

/**
 * Withdrawal has to reach Google, not merely stop the site talking to it.
 *
 * A visitor who withdraws has already accepted, so Google's script is loaded and holds a
 * granted `analytics_storage`. Silencing `track` alone would leave the tag measuring from a
 * consent that had just been taken back — which the privacy page says stops the collection.
 * The revocation is asserted where it is observable: in the queue the tag reads.
 */
test.describe('when a visitor takes consent back', () => {
    test.use({ consent: 'granted' });

    test('refusing revokes the signal Google was given', async ({ page }) => {
        await page.goto('/privacy/');
        await skipWithoutTag(page);

        await page.locator('[data-consent-reopen]').click();
        await page.locator('[data-consent-refuse]').click();
        await expect(page.locator('[data-consent]')).toBeHidden();

        const denials: unknown[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter(
                    (entry: unknown[]) =>
                        entry[0] === 'consent' &&
                        entry[1] === 'update' &&
                        (entry[2] as { analytics_storage?: string }).analytics_storage === 'denied',
                );
        });

        expect(denials.length, 'the tag was never told the consent was withdrawn').toBeGreaterThan(0);
    });

    /**
     * And accepting again, without a reload, has to grant again.
     *
     * The tag loads once; the consent signal does not. Guarding both behind one flag made a
     * second acceptance in a page silently grant nothing — the banner said yes while Google
     * stayed denied. Asserted on the order of the queue rather than on its contents, because
     * a `granted` from the first acceptance is still in there.
     */
    test('accepting again after a withdrawal grants again', async ({ page }) => {
        await page.goto('/privacy/');
        await skipWithoutTag(page);

        await page.locator('[data-consent-reopen]').click();
        await page.locator('[data-consent-refuse]').click();
        await page.locator('[data-consent-reopen]').click();
        await page.locator('[data-consent-accept]').click();

        const trail: string[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'consent' && entry[1] === 'update')
                .map((entry: unknown[]) => (entry[2] as { analytics_storage?: string }).analytics_storage ?? '');
        });

        expect(trail[trail.length - 1], 'the last word to Google was not the visitor’s').toBe('granted');
    });

    /**
     * And the loaded tag is actually stopped, not merely put into another mode.
     *
     * Revoking `analytics_storage` on a tag that has already loaded does not silence it —
     * Google's documented behaviour for a denied analytics consent is to write no cookie
     * and send a cookieless payload instead. That is advanced consent mode, which is the
     * one thing ADR-0015 rejects by name, so a withdrawal built on the consent update
     * alone would have the site doing what its own decision record argues against.
     *
     * `ga-disable-<id>` is the opt-out the tag reads before sending anything. This asserts
     * the flag, because the flag is the part that stops transmission.
     */
    test('withdrawing raises the flag that stops the tag sending', async ({ page }) => {
        await page.goto('/privacy/');
        await skipWithoutTag(page);

        await page.locator('[data-consent-reopen]').click();
        await page.locator('[data-consent-refuse]').click();

        const disabled: boolean = await page.evaluate(() => {
            const carrier = document.querySelector<HTMLElement>('[data-jd-analytics]');
            const id: string = carrier?.dataset.jdAnalytics ?? '';

            return id !== '' && (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] === true;
        });

        expect(disabled, 'the tag was left free to keep sending after a withdrawal').toBe(true);
    });

    /**
     * A visitor with the site open twice, withdrawing in one of them.
     *
     * The `storage` event fires in every document of the origin except the one that wrote,
     * so the other tab is where the promise is kept or broken. This is the check that was
     * missing when the withdrawal path was first written — it held in the tab you were
     * looking at, and nowhere else.
     */
    test('refusing in one tab stops the analytics in another', async ({ page, context }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        const other = await context.newPage();

        await other.goto('/privacy/');

        await other.locator('[data-consent-reopen]').click();
        await other.locator('[data-consent-refuse]').click();

        await expect
            .poll(
                () =>
                    page.evaluate(() => {
                        const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

                        // `update` and not merely `consent`: the bootstrap's `default` call
                        // is a denial too, and it is in every queue from the first line of
                        // the page. Counting it would make this check pass on a tab that
                        // never heard anything — which it did, until the break test said so.
                        return queue
                            .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                            .filter(
                                (entry: unknown[]) =>
                                    entry[0] === 'consent' &&
                                    entry[1] === 'update' &&
                                    (entry[2] as { analytics_storage?: string }).analytics_storage === 'denied',
                            ).length;
                    }),
                'the other tab kept measuring after the visitor withdrew',
            )
            .toBeGreaterThan(0);

        await other.close();
    });
});

/**
 * The searches that worked are the ones the settle delay would lose, because a visitor who
 * finds what they wanted clicks a result before it expires. Exercised by sending the same
 * signal a real departure sends, so the check needs neither a navigation nor a fixed wait.
 */
test.describe('when a search is cut short by leaving', () => {
    test.use({ consent: 'granted' });

    test('the pending term is still reported', async ({ page }) => {
        await page.goto('/api/');
        await skipWithoutTag(page);

        await page.locator('#api-search-input').fill('Uri');
        await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

        const terms: unknown[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'event' && entry[1] === 'view_search_results')
                .map((entry: unknown[]) => (entry[2] as { search_term?: string }).search_term);
        });

        expect(terms, 'a search abandoned by leaving reported nothing').toContain('Uri');
    });

    /**
     * The default is prevented on the link itself, so the click still bubbles to the
     * delegated listener but never starts a real navigation — this only needs to know the
     * report fired, and a destroyed page after navigating would have nothing left to read
     * it back from.
     */
    test('clicking a result flushes the settling term', async ({ page }) => {
        await page.goto('/api/');
        await skipWithoutTag(page);

        await page.locator('#api-search-input').fill('Uri');
        await page.locator('#api-search-results a').first().evaluate((link: HTMLElement) => {
            link.addEventListener('click', (event: Event) => event.preventDefault(), { once: true });
            link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        });

        const terms: unknown[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'event' && entry[1] === 'view_search_results')
                .map((entry: unknown[]) => (entry[2] as { search_term?: string }).search_term);
        });

        expect(terms, 'clicking a result did not flush the settling search').toContain('Uri');
    });

    /**
     * Escape clears the box through a plain `.value` write, which fires no `input` event
     * of its own — the signal this file's settle timer is armed by, and the only one
     * `Measurement.astro` listens for to know a pending term was withdrawn.
     */
    test('a search cancelled with Escape is not reported', async ({ page }) => {
        await page.goto('/api/');
        await skipWithoutTag(page);

        await page.locator('#api-search-input').fill('Uri');
        await page.locator('#api-search-input').press('Escape');
        await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

        const terms: unknown[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'event' && entry[1] === 'view_search_results')
                .map((entry: unknown[]) => (entry[2] as { search_term?: string }).search_term);
        });

        expect(terms, 'a search cancelled with Escape was reported anyway').toEqual([]);
    });
});

/**
 * `hidden` covers far more than a departure — a tab switch, a locked screen, an app
 * backgrounded for a moment — and the page the visitor is still typing into never fires
 * `pagehide` for any of them. Reported here through the one thing that tells old and new
 * behaviour apart: a term still being typed when the tab hides, extended after it is shown
 * again. The old listener would have sent the unfinished term on `hidden` alone, so the
 * settled one arrives second — two entries where the settled-term semantics promise one.
 */
test.describe('when a search is merely backgrounded, not left', () => {
    test.use({ consent: 'granted' });

    test('hiding the tab does not finalize a term still being typed', async ({ page }) => {
        await page.goto('/api/');
        await skipWithoutTag(page);

        await page.locator('#api-search-input').fill('Uri');
        await page.evaluate(() => {
            Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
            Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        });
        await page.locator('#api-search-input').fill('UriBuilder');
        await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

        const terms: unknown[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'event' && entry[1] === 'view_search_results')
                .map((entry: unknown[]) => (entry[2] as { search_term?: string }).search_term);
        });

        expect(terms, 'backgrounding reported a partial term instead of waiting for the settled one').toEqual([
            'UriBuilder',
        ]);
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
