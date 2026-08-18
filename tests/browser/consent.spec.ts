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
 * The reader who stops just short of the middle, which is the reader this event exists to find.
 *
 * `Scene.astro` announces a scene the moment it touches a band spanning 45% to 55% of the
 * viewport; the dwell then asks, a second later, whether the scene is still there. The two have
 * to be asking about the same region. Asking a narrower question — the exact middle line —
 * loses a scene resting anywhere in the 5% overhang, and loses it twice over: arming for it
 * already cancelled whatever was pending, and the observer announces a scene once, so nothing
 * ever re-arms. Reading on for a minute produces no report at all.
 */
test.describe('when a scene comes to rest inside the band but short of the middle', () => {
    test.use({ consent: 'granted' });

    test('the scene the reader stopped on is still reported', async ({ page }) => {
        await page.clock.install();
        await page.goto('/');
        await skipWithoutTag(page);

        // Resting with its top just below the middle: inside the band the observer watches,
        // outside the line the dwell was asking about.
        await page.locator('[data-scene="the-seed"]').evaluate((scene: Element) => {
            window.scrollBy(0, scene.getBoundingClientRect().top - window.innerHeight * 0.52);
        });

        await expect(
            page.locator('[data-scene="the-seed"]'),
            'the scene never registered as arrived, so the band was not entered at all',
        ).toHaveAttribute('data-current', '');

        await page.clock.runFor(1400);

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
                'a scene the reader had stopped on was announced as arrived and then never reported',
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

    test('accepting without scrolling still reports the held scene, after it dwells', async ({ page }) => {
        await page.clock.install();
        await page.goto('/');
        await skipWithoutTag(page);

        const sceneNames = () =>
            page.evaluate(() => {
                const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

                return queue
                    .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                    .filter((entry: unknown[]) => entry[0] === 'event' && entry[1] === 'scene_view')
                    .map((entry: unknown[]) => (entry[2] as { scene_name?: string }).scene_name);
            });

        await page.locator('[data-scene="the-seed"]').evaluate((scene: Element) => {
            scene.scrollIntoView({ block: 'center' });
        });

        /*
         * The arrival has to have landed before the clock is moved, and `data-current` is the
         * observable proof that it has: `Scene.astro` sets it from the same callback that
         * dispatches the event this file listens for. Without waiting on it the timer was armed
         * after the first advance instead of before it, so the arrival's own dwell straddled the
         * click and reported the scene through the ordinary path — green with the catch-up
         * deleted, for the second time in this one check.
         */
        await expect(
            page.locator('[data-scene="the-seed"]'),
            'the scene never registered as arrived, so no dwell was armed to spend',
        ).toHaveAttribute('data-current', '');

        /*
         * The scroll is itself an arrival, and an arrival arms the ordinary dwell timer. That
         * timer has to be spent before accepting, or the ordinary path reports the scene a
         * second after the click and this check passes with the catch-up deleted — which is
         * precisely what it did, until the break test was run against it.
         *
         * Driven rather than waited on. A fixed delay is what ADR-0009 forbids and what this
         * repository's own runner rejects, and it would be the wrong tool anyway: the expiry
         * being waited for is deliberately unobservable, since the callback returns having done
         * nothing at all while the question is unanswered. Advancing the clock makes it a
         * transition this check causes rather than one it hopes for.
         */
        await page.clock.runFor(1400);

        expect(
            await sceneNames(),
            'the scene was reported while the question was still unanswered',
        ).not.toContain('the-seed');

        await page.locator('[data-consent-accept]').click();

        // Not yet, this soon after accepting — a scene held for only an instant is exactly
        // what the dwell delay exists to exclude, and reporting it immediately here would be
        // the same mistake as reporting one flicked past while scrolling.
        expect(await sceneNames(), 'the held scene was reported before it had dwelled').not.toContain('the-seed');

        await page.clock.runFor(1400);

        await expect
            .poll(sceneNames, 'the scene already held when accepting was never reported')
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
 * A stale record left by a failed write is a different problem from an absent one, and the
 * two need opposite answers: the in-memory answer has to win over a stubborn old record, but
 * lose to a genuine absence — which is what another tab clearing everything looks like from
 * here. Both are exercised against the same starting point, an already-granted session with a
 * real record on disk, because that is the only state either failure mode can corrupt.
 */
test.describe('when the stored record disagrees with what just happened', () => {
    test.use({ consent: 'granted' });

    test('a withdrawal is not undone by the stale grant a failed write left behind', async ({ page }) => {
        await page.goto('/privacy/');
        await skipWithoutTag(page);

        await page.evaluate(() => {
            window.localStorage.setItem = () => {
                throw new DOMException('rejected for this test', 'QuotaExceededError');
            };
        });

        await page.locator('[data-consent-reopen]').click();
        await page.locator('[data-consent-refuse]').click();

        await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

        const trail: string[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'consent' && entry[1] === 'update')
                .map((entry: unknown[]) => (entry[2] as { analytics_storage?: string }).analytics_storage ?? '');
        });

        expect(trail[trail.length - 1], 'the stale grant still on record overrode the withdrawal').toBe('denied');
    });

    /**
     * `localStorage.clear()` fires one `storage` event with `key: null` rather than one
     * naming this key, which a tab already reporting has to treat the same way — the visitor
     * or something acting for them just wiped every answer this origin held.
     */
    test('another tab clearing every key at once stops reporting here too', async ({ page }) => {
        await page.goto('/privacy/');
        await skipWithoutTag(page);

        await page.evaluate(() => {
            window.localStorage.clear();
            window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: window.localStorage }));
        });

        const trail: string[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'consent' && entry[1] === 'update')
                .map((entry: unknown[]) => (entry[2] as { analytics_storage?: string }).analytics_storage ?? '');
        });

        expect(trail[trail.length - 1], 'a cleared storage area was ignored, and reporting continued').toBe('denied');
        await expect(
            page.locator('[data-consent]'),
            'the banner did not return after storage was cleared',
        ).toBeVisible();
    });

    /**
     * The in-memory fallback does not survive navigation — a fresh page starts with none
     * of it — so a failed denial has to leave storage itself in a state that reads as
     * "unanswered" rather than as the grant it could not remove.
     */
    test('a failed refusal write removes the stale grant rather than leaving it', async ({ page }) => {
        await page.goto('/privacy/');
        await skipWithoutTag(page);

        await page.evaluate(() => {
            window.localStorage.setItem = () => {
                throw new DOMException('rejected for this test', 'QuotaExceededError');
            };
        });

        await page.locator('[data-consent-reopen]').click();
        await page.locator('[data-consent-refuse]').click();

        const stillGranted: boolean = await page.evaluate(() => {
            const raw: string | null = window.localStorage.getItem('jd:analytics-consent');

            return raw !== null && (JSON.parse(raw) as { choice?: string }).choice === 'granted';
        });

        expect(
            stillGranted,
            'the stale grant survived a failed refusal write, ready to restart on the next page',
        ).toBe(false);
    });
});

/**
 * The two checks above corrupt this tab's own record and then read it back on this same page —
 * proving the flag guards a stale local write. A second, healthy tab is a different claim: its
 * write never touches this tab's flag at all, so trusting it has to come from somewhere other
 * than `remembered()` noticing its own history. That somewhere is the `storage` listener itself,
 * and only a real second page exercises it — a `clear()` dispatched from inside this same page,
 * as above, never carries a write this tab did not make.
 */
test.describe('when a tab with a stuck reliability flag hears from another', () => {
    test.use({ consent: 'unasked' });

    test('a fresh cross-tab denial is not discarded for this tab\'s own stale write failure', async ({ page, context }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await page.evaluate(() => {
            window.localStorage.setItem = () => {
                throw new DOMException('rejected for this test', 'QuotaExceededError');
            };
        });

        await page.locator('[data-consent-accept]').click();
        await expect(page.locator('[data-consent]')).toBeHidden();

        const deniedCount = () =>
            page.evaluate(() => {
                const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

                return queue
                    .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                    .filter(
                        (entry: unknown[]) =>
                            entry[0] === 'consent' &&
                            entry[1] === 'update' &&
                            (entry[2] as { analytics_storage?: string }).analytics_storage === 'denied',
                    ).length;
            });

        const before: number = await deniedCount();

        const other = await context.newPage();

        await other.goto('/privacy/');
        await other.locator('[data-consent-refuse]').click();

        await expect
            .poll(deniedCount, 'this tab kept measuring after a healthy tab\'s denial, favouring its own stale write failure')
            .toBeGreaterThan(before);

        await other.close();
    });
});

/**
 * Two ways for `at` to fail to place a record in time, both landing on the same fix. A
 * missing or non-numeric `at` is not "very old" — `Date.now() - NaN` is `NaN`, and
 * `NaN > REMEMBER_FOR_MS` is false. A future `at` fails the opposite way — the subtraction
 * stays negative, and therefore under the retention window, for as long as it does, which
 * would make the six-month re-prompt postponable by however far out it is dated. Both are
 * treated the same as a missing or garbled choice: not a valid answer at all.
 */
test.describe('when a stored record carries no usable timestamp', () => {
    test.use({ consent: 'unasked' });

    test('a record without a valid "at" is not trusted as a live grant', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await page.evaluate(() => {
            window.localStorage.setItem('jd:analytics-consent', JSON.stringify({ v: 1, choice: 'granted' }));
            document.dispatchEvent(new Event('visibilitychange'));
        });

        const started: boolean = await page.evaluate(
            () => (window as unknown as { jdAnalyticsStarted?: boolean }).jdAnalyticsStarted === true,
        );

        expect(started, 'a record with no timestamp was trusted as a live grant').toBe(false);
    });

    test('a record dated into the future is not trusted as a live grant', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await page.evaluate(() => {
            const farFuture = Date.now() + 1000 * 60 * 60 * 24 * 365;

            window.localStorage.setItem(
                'jd:analytics-consent',
                JSON.stringify({ v: 1, choice: 'granted', at: farFuture }),
            );
            document.dispatchEvent(new Event('visibilitychange'));
        });

        const started: boolean = await page.evaluate(
            () => (window as unknown as { jdAnalyticsStarted?: boolean }).jdAnalyticsStarted === true,
        );

        expect(started, 'a record dated a year into the future was trusted as a live grant').toBe(false);
    });
});

/**
 * The six-month retention is rechecked on a `storage` event, on becoming visible again, on
 * `applyDecision()`'s own periodic re-arm, and — belt and suspenders — before every site
 * event `track()` sends. Only the last of those is exercised by staying on one scene: it is
 * the one path that cannot wait for an external trigger this test controls, which is also
 * why the periodic re-arm exists at all — nothing here can wait 24 hours for it to prove
 * itself, so it stands on the reasoning in its own comment rather than on a check of its own.
 */
test.describe('when the retention window has quietly closed', () => {
    test.use({ consent: 'granted' });

    test('an event does not report once the grant has quietly expired', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        // The record this tab started with is overwritten with one already past its
        // retention — simulating six months passing while this tab simply stayed open,
        // without the hidden-then-visible transition the other recheck relies on.
        await page.evaluate(() => {
            window.localStorage.setItem('jd:analytics-consent', JSON.stringify({ v: 1, choice: 'granted', at: 0 }));
        });

        await page.locator('[data-scene="the-seed"]').evaluate((scene: Element) => {
            scene.scrollIntoView({ block: 'center' });
        });

        await expect(
            page.locator('[data-consent]'),
            'the banner never returned once the grant had quietly expired',
        ).toBeVisible();

        const sceneViews: unknown[] = await page.evaluate(() => {
            const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

            return queue
                .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                .filter((entry: unknown[]) => entry[0] === 'event' && entry[1] === 'scene_view');
        });

        expect(sceneViews, 'a scene was reported under a grant whose retention had already lapsed').toEqual([]);
    });

    /**
     * Enhanced measurement's `scroll` is Google's own script watching the page, not a call
     * this file makes — `track()` re-validating cannot reach it, only the hard-stop flag
     * `stop()` raises does. Asserted directly, because "this site sent nothing" does not by
     * itself say the tag was silenced rather than merely unused.
     */
    test('the tag itself is stopped, not only this site\'s own events', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await page.evaluate(() => {
            window.localStorage.setItem('jd:analytics-consent', JSON.stringify({ v: 1, choice: 'granted', at: 0 }));
            document.dispatchEvent(new Event('visibilitychange'));
        });

        const disabled: boolean = await page.evaluate(() => {
            const carrier = document.querySelector<HTMLElement>('[data-jd-analytics]');
            const id: string = carrier?.dataset.jdAnalytics ?? '';

            return id !== '' && (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] === true;
        });

        expect(disabled, 'an expired grant left the tag itself free to keep sending').toBe(true);
    });
});

/**
 * A returning visitor who lands part-way down the narrative, which is the deepest the startup
 * path ever reaches into this file.
 *
 * A grant already on record starts analytics during the script's first synchronous pass, and
 * `start()` reaches from there into the journey code to catch the scene being read. Everything
 * on that path therefore has to be declared before the startup call — a `let` or `const` below
 * it is still in its temporal dead zone, and reading one throws at module top level, which
 * silently abandons every listener registered after it. The tag is already loaded and
 * reporting by then, so the failure costs a withdrawal rather than a measurement: this tab
 * would never hear the `storage` event again.
 *
 * Asserted through the storage listener rather than through the absence of an error, because
 * the listener is what a visitor actually loses, and it is registered after the throw would
 * happen. The held scene is asserted first: without one across the middle at load the startup
 * path stops short of the journey code and the check would pass without reaching anything.
 */
test.describe('when a stored grant starts reporting on a page opened at a scene', () => {
    test.use({ consent: 'granted' });

    test('the listeners after the startup call are still registered', async ({ page }) => {
        const threw: string[] = [];

        page.on('pageerror', (error: Error) => threw.push(error.message));

        /*
         * The scene has to be across the middle at the instant the deferred module runs, and
         * arranging that is the whole difficulty of this check. Three ways do not work, and two
         * of them pass against the very defect this exists for: a fragment in the URL is applied
         * only after the deferred scripts have run, a scroll performed mid-parse is undone by
         * the navigation, and no viewport is tall enough to reach the first scene, which always
         * begins a full screen down whatever the height.
         *
         * `readystatechange` to `interactive` is the one moment that qualifies. The parser fires
         * it after the document is parsed and BEFORE the deferred scripts execute, so a scroll
         * made here is in place when the consent script runs — which is exactly the state a
         * returning reader lands in when their browser restores where they had got to.
         */
        await page.addInitScript(() => {
            document.addEventListener('readystatechange', () => {
                if (document.readyState !== 'interactive') {
                    return;
                }

                document.querySelector('[data-scene]')?.scrollIntoView({ block: 'center' });
            });
        });

        await page.goto('/');
        await skipWithoutTag(page);

        const held: boolean = await page.evaluate(() => {
            const middle: number = window.innerHeight / 2;

            return Array.from(document.querySelectorAll<HTMLElement>('[data-scene]')).some((scene: HTMLElement) => {
                const box: DOMRect = scene.getBoundingClientRect();

                return box.top <= middle && box.bottom >= middle;
            });
        });

        expect(held, 'no scene held the middle at load, so this check never reached the path it guards').toBe(true);

        // Another tab withdrawing. Only the listener registered after the startup call can
        // carry this, so it is the cheapest proof the script ran to the end.
        await page.evaluate(() => {
            window.localStorage.setItem(
                'jd:analytics-consent',
                JSON.stringify({ v: 1, choice: 'denied', at: Date.now() }),
            );
            window.dispatchEvent(
                new StorageEvent('storage', { key: 'jd:analytics-consent', storageArea: window.localStorage }),
            );
        });

        const disabled: boolean = await page.evaluate(() => {
            const carrier = document.querySelector<HTMLElement>('[data-jd-analytics]');
            const id: string = carrier?.dataset.jdAnalytics ?? '';

            return id !== '' && (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] === true;
        });

        expect(threw, 'the consent script threw while starting up').toEqual([]);
        expect(disabled, 'a withdrawal made in another tab never reached this one').toBe(true);
    });
});

/**
 * The banner is fixed to the bottom of the viewport, and the page has to make room for it.
 *
 * Out of flow means the document does not know it is there, so at the foot of the page it
 * simply lies on top of the footer and takes its clicks — About, API, Release notes, the
 * repository. A keyboard reader fares worse: Tab still reaches those links and the browser
 * still scrolls them into view, behind an opaque panel, so the focus ring is invisible.
 *
 * The suite has known this since before it was a defect: `harness.ts` seeds a refusal into
 * every other spec precisely so the banner is never up while something at the bottom of a page
 * is being clicked. That made the checks pass and left the page as it was.
 *
 * `trial: true` asks Playwright for the actionability check without the click, so this stays a
 * question about whether the link can be reached rather than a navigation.
 */
test.describe('while the question is still on screen', () => {
    test.use({ consent: 'unasked' });

    test('the footer underneath it can still be used', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        await expect(page.locator('[data-consent]')).toBeVisible();

        await page.locator('.site-footer').scrollIntoViewIfNeeded();

        await page
            .locator('.footer-nav a')
            .first()
            .click({ trial: true, timeout: 5000 });
    });
});

/**
 * A scene is spent when it is reported, not when it is offered.
 *
 * `armDwell` already refuses to consume a scene while nothing is being measured, and says so:
 * a reader who scrolls first and accepts afterwards must not have those scenes struck off. The
 * same rule has a second gate behind it — `track()` re-reads the record on every call and can
 * decline — and the dedup sets were being written before that gate rather than after it. A
 * grant lapsing mid-read therefore burns the scene the reader is on and, worse, the act it
 * belongs to: every later scene of that act reports normally while `act_reached` never fires,
 * which reads as scenes belonging to an act nobody entered.
 */
test.describe('when the grant lapses between arriving at a scene and reporting it', () => {
    test.use({ consent: 'granted' });

    test('the scene is not struck off, and is reported once the visitor accepts again', async ({ page }) => {
        await page.goto('/');
        await skipWithoutTag(page);

        // Aged out in place, with nothing told about it: `reporting` stays true, so the dwell
        // timer will run and `track()` is the first thing to notice the record has lapsed.
        await page.evaluate(() => {
            window.localStorage.setItem('jd:analytics-consent', JSON.stringify({ v: 1, choice: 'granted', at: 0 }));
        });

        await page.locator('[data-scene="the-seed"]').evaluate((scene: Element) => {
            scene.scrollIntoView({ block: 'center' });
        });

        // The banner returning is the proof that the dwell fired and `track()` declined, which
        // is the exact moment the scene was at risk of being consumed for nothing.
        await expect(page.locator('[data-consent]'), 'the lapsed grant never reopened the question').toBeVisible();

        await page.locator('[data-consent-accept]').click();

        await expect
            .poll(
                () =>
                    page.evaluate(() => {
                        const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

                        return queue
                            .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                            .filter(
                                (entry: unknown[]) =>
                                    entry[0] === 'event' &&
                                    entry[1] === 'scene_view' &&
                                    (entry[2] as { scene_name?: string }).scene_name === 'the-seed',
                            ).length;
                    }),
                'the scene was struck off by a report that was never sent, so accepting could not recover it',
            )
            .toBeGreaterThan(0);
    });
});

/**
 * The question the visitor opened themselves, which is not the same question the banner asks
 * on its own account.
 *
 * The banner has two reasons to be up — nobody has answered yet, and the visitor pressed
 * "change your choice" on the privacy page — and reconciling it against the stored answer
 * cannot tell them apart. A stored answer exists in the second case by definition, so every
 * reconciliation wants to close the banner, and the reconciliations are not rare: coming back
 * to the tab is one, and so is the periodic re-check. Closing it there takes away a dialogue
 * the visitor deliberately opened, without recording an answer and without saying anything,
 * and drops focus to the body on the way out.
 */
test.describe('when the visitor reopens the question themselves', () => {
    test.use({ consent: 'granted' });

    test('coming back to the tab does not close it under them', async ({ page }) => {
        await page.goto('/privacy/');
        await skipWithoutTag(page);

        await page.locator('[data-consent-reopen]').click();
        await expect(page.locator('[data-consent]')).toBeVisible();

        // The same transition a tab switch, a locked phone or a backgrounded app produces.
        await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));

        await expect(
            page.locator('[data-consent]'),
            'the reopened question was closed without the visitor answering it',
        ).toBeVisible();

        const holdsFocus: boolean = await page.evaluate(
            () => document.activeElement?.closest('[data-consent]') !== null,
        );

        expect(holdsFocus, 'focus was dropped out of the reopened banner').toBe(true);
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

        // `update` and not merely `consent`: the bootstrap's `default` call is a denial
        // too, and it is in every queue from the first line of the page. Counting it would
        // make this check pass on a tab that never heard anything — which it did, until the
        // break test said so.
        const deniedCount = () =>
            page.evaluate(() => {
                const queue: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [];

                return queue
                    .map((entry: unknown) => Array.from(entry as ArrayLike<unknown>))
                    .filter(
                        (entry: unknown[]) =>
                            entry[0] === 'consent' &&
                            entry[1] === 'update' &&
                            (entry[2] as { analytics_storage?: string }).analytics_storage === 'denied',
                    ).length;
            });

        // Baselined once the second tab has loaded and before it is asked anything, so a
        // harness seed race that briefly writes and overwrites its own answer while that
        // tab starts up cannot be mistaken for the withdrawal this check is actually about.
        const before: number = await deniedCount();

        await other.locator('[data-consent-reopen]').click();
        await other.locator('[data-consent-refuse]').click();

        await expect.poll(deniedCount, 'the other tab kept measuring after the visitor withdrew').toBeGreaterThan(before);

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
