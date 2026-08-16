import { expect, test } from './support/harness';

/**
 * The audience beacon never reaches Cloudflare from a browser check.
 *
 * `support/harness.ts` answers the measurement hosts locally so that a suite rendering a
 * token-carrying artefact does not report a burst of visits from `127.0.0.1` into the real
 * Web Analytics site on the day of every release. That interception is invisible when it
 * works and equally invisible when it stops working — the run stays green either way, and
 * the only symptom is figures nobody can explain weeks later. This is the check that makes
 * it visible.
 *
 * IT ASSERTS THE BODY, NOT THE REQUEST. Playwright's own routing is what answers the
 * request, so the URL is requested whether or not the harness is in force; what differs is
 * what comes back. The real `beacon.min.js` is several kilobytes, and the harness answers
 * with nothing, so a zero-length body is the proof that the answer was local.
 *
 * Both ways of breaking it were run, and they go red differently — worth writing down,
 * because the message you get names the wrong cause if you do not expect it:
 *
 *   harness removed      no response at all, and the poll times out. In a sandbox with no
 *                        route to Cloudflare that is why; on a machine with one it is the
 *                        real script arriving with a length, and the final assertion is
 *                        what fails instead. Red either way, different line.
 *   fulfil made an abort no response at all, and the poll times out.
 *
 * IT SKIPS ON A BUILD WITH NO TOKEN, which is every local build and every pull request. That
 * is not a gap being papered over — with no beacon in the artefact there is nothing to
 * intercept and nothing to assert. The runs where it matters are exactly the runs where it
 * is active: a release, on the artefact that is about to be published.
 */
test('the audience beacon never reaches Cloudflare from a browser check', async ({ page }) => {
    const lengths: number[] = [];

    page.on('response', async (response) => {
        if (!response.url().includes('cloudflareinsights.com')) {
            return;
        }
        // A body that cannot be read is not a body of length zero, and calling it one would
        // turn this check green on a case it has never seen. -1 says "read failed" and fails
        // the assertion below on its own.
        const body: Buffer | null = await response.body().catch(() => null);
        lengths.push(body === null ? -1 : body.length);
    });

    await page.goto('/');

    const html: string = await page.content();
    test.skip(!html.includes('static.cloudflareinsights.com'), 'this artefact was built without a beacon token');

    // Polled rather than waited on: the tag is deferred, so the request is in flight after
    // the navigation settles. ADR-0009 refuses a fixed delay, and check-in-browser.sh
    // enforces that refusal.
    await expect.poll(() => lengths.length).toBeGreaterThan(0);

    expect(lengths, 'the beacon was answered by something other than the harness').toEqual(
        lengths.map(() => 0),
    );
});
