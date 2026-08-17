import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test as base, expect, type Browser, type BrowserContext, type BrowserContextOptions, type Route } from '@playwright/test';

/**
 * The suite's own `test`, which differs from Playwright's in two ways: **no check ever talks
 * to the measurement hosts**, and **no check asks the dev server to stream the .NET runtime.**
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
 * The .NET runtime's binaries, handed to the browser from `dist/` rather than fetched from
 * the dev server.
 *
 * WHY. `wrangler dev` puts a ProxyWorker between the browser and workerd, and that proxy
 * cannot survive this suite's traffic. Around thirty checks boot the playground, each pulling
 * roughly five megabytes of runtime — a hundred and fifty megabytes a run — and somewhere in
 * that the ProxyWorker posts an error to its controller, which treats it as fatal and takes
 * the whole server down mid-run. Every check still to come then reports
 * ERR_CONNECTION_REFUSED, which is how one failure became two hundred and six.
 *
 * Measured on this machine before this route existed: three consecutive runs, two of them
 * red — 206 failed, then 208 passed, then 22 failed. The stack is always the same, and it is
 * wrangler's rather than this repository's:
 *
 *     at ProxyController2.emitErrorEvent
 *     at ProxyController2.onProxyWorkerMessage
 *     at async #handleLoopbackCustomFetchService (miniflare)
 *
 * The `kj … Broken pipe` line that usually accompanies it is a symptom and not the cause:
 * the run that failed worst logged no broken pipe at all, and wrangler 4.123.0 already
 * survives that one — the fatal path is the proxy's, and there is no flag that removes it.
 *
 * WHAT THIS COSTS, stated rather than buried: the browser suite no longer proves that the
 * runtime serves these files correctly. `scripts/check-served-headers.sh` is what does, on
 * every build — it asks the host for **every** file under `_framework`, all sixty-seven, and
 * compares each served length against the artefact.
 *
 * It did not, when this route was written, and the comment claimed it did. It asked for one
 * `dotnet.native.*.wasm`; then, once that was caught, for that and the three ICU files. Both
 * were samples, and Codex showed twice over that a sample is no cover here — a rule swallowing
 * `_framework`, or one assembly missing, passes a check that looks at its neighbours. The
 * lesson belongs beside the route that caused it rather than only in the script that carries
 * it: **taking a file off the served path is free only once something else asks the host for
 * it, and asking about its neighbour is not asking about it.**
 *
 * That script reads no list from this file, deliberately. A superset that cannot drift beats a
 * list two files have to keep in step, so whatever this route grows to cover is covered there
 * already.
 *
 * WHAT IS DELIBERATELY LEFT ALONE. Only `.wasm` and `.dat` are served from disk — inert
 * binaries, and 99% of the bytes. `blazor.boot.json` and the loader scripts still come from
 * the runtime, because that manifest is what decides which files are fetched and verified:
 * a runtime that mis-served it would break the boot, and that is a signal worth keeping.
 *
 * The bytes are the artefact's own, so Blazor's integrity check against the hashes in
 * `blazor.boot.json` passes exactly as it does against the server. A path that is not on
 * disk is passed through rather than invented, so a missing file is still a real 404 from
 * the runtime instead of a lie told by this file.
 */
const FRAMEWORK: string = '/playground/_framework/';

const ARTEFACT: string = resolve(dirname(fileURLToPath(import.meta.url)), '../../../dist');

const BINARIES: Readonly<Record<string, string>> = {
    '.wasm': 'application/wasm',
    '.dat':  'application/octet-stream',
};

async function serveRuntimeFromDisk(context: BrowserContext): Promise<void> {
    await context.route(
        (url: URL) => url.pathname.startsWith(FRAMEWORK) && extname(url.pathname) in BINARIES,
        async (route: Route): Promise<void> => {
            const pathname: string = new URL(route.request().url()).pathname;
            const file: string = resolve(ARTEFACT, `.${pathname}`);

            /* Nothing outside the artefact, whatever the URL says. */
            if (!file.startsWith(`${ARTEFACT}/`)) {
                await route.continue();

                return;
            }

            try {
                await route.fulfill({
                    status: 200,
                    contentType: BINARIES[extname(pathname)],
                    body: await readFile(file),
                });
            } catch {
                await route.continue();
            }
        },
    );
}

async function install(context: BrowserContext): Promise<void> {
    await refuseMeasurement(context);
    await serveRuntimeFromDisk(context);
}

/**
 * `auto: true` so no spec has to remember. A check that opts in is a check somebody forgets
 * to opt in, and the failure is silent — the run passes and the analytics are wrong.
 */
export const test = base.extend<{ routed: void }, { browser: Browser }>({
    routed: [
        async ({ context }, use) => {
            await install(context);
            await use();
        },
        { auto: true },
    ],

    /**
     * The fixture above covers the `context` Playwright injects, and that is not every
     * context a run opens: `weight.spec.ts` builds its own with `browser.newContext()` to
     * emulate a three-times screen, and a context built that way never passes through it.
     * One page, loading `/`, reaching the real beacon — the leak this file exists to close,
     * left open in the one spec that does not take the ordinary route.
     *
     * Patching `newContext` covers it without asking that spec, or the next one like it, to
     * remember anything. The original is put back afterwards rather than left in place: this
     * fixture is worker-scoped because the one it overrides is, so the patch would otherwise
     * outlive the run it belongs to.
     */
    browser: [
        async ({ browser }, use) => {
            const openContext = browser.newContext.bind(browser);

            browser.newContext = async (options?: BrowserContextOptions): Promise<BrowserContext> => {
                const context: BrowserContext = await openContext(options);
                await install(context);

                return context;
            };

            await use(browser);

            browser.newContext = openContext;
        },
        { scope: 'worker' },
    ],
});

export { expect };
