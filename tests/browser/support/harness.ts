import { test as base, expect, type BrowserContext } from '@playwright/test';

/**
 * The suite's own `test`, which differs from Playwright's in exactly one way: **no check
 * ever talks to the measurement hosts.**
 *
 * WHY IT HAS TO EXIST. The browser suite renders `dist/` — the same artefact the deploy job
 * publishes, downloaded rather than rebuilt, which is the whole point of ADR-0009. Once the
 * beacon token is configured, that artefact carries the production audience beacon, so every
 * page this suite opens would report a page view from `127.0.0.1` into the real Web
 * Analytics site. A release runs this suite over a dozen spec files, so the figures would
 * gain a burst of synthetic visits on the day of each release — into the one lane of §15
 * that is supposed to be trustworthy, and with nothing on the dashboard to say where they
 * came from.
 *
 * FULFILLED RATHER THAN ABORTED, and the difference matters here. An aborted request is a
 * *failed* request, and `support/watch.ts` collects those on behalf of checks that treat
 * them as defects — blocking the beacon by aborting it would make the policy and playground
 * checks report a failure this file caused. Answering the script with an empty body instead
 * is invisible to them: the tag loads, runs nothing, and posts nothing.
 *
 * It is not a substitute for the token being right. That is checked against the real
 * deployment, in step 10 of the deployment guide, which is the only place it can be.
 */

/** Where the audience beacon loads from, and where it reports to. Two hosts, not one. */
const MEASUREMENT_HOSTS: readonly string[] = ['static.cloudflareinsights.com', 'cloudflareinsights.com'];

async function refuseMeasurement(context: BrowserContext): Promise<void> {
    await context.route(
        (url: URL) => MEASUREMENT_HOSTS.includes(url.hostname),
        (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: '',
            }),
    );
}

/**
 * `auto: true` so no spec has to remember. A check that opts in is a check somebody forgets
 * to opt in, and the failure is silent — the run passes and the analytics are wrong.
 */
export const test = base.extend<{ measurementRefused: void }>({
    measurementRefused: [
        async ({ context }, use) => {
            await refuseMeasurement(context);
            await use();
        },
        { auto: true },
    ],
});

export { expect };
