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
 * THE ANALYTICS LANE MADE THIS SHARPER, NOT MERELY LONGER. The audience beacon reports into
 * a dashboard; the analytics tag reports into a property with sessions, paths and funnels, so
 * a burst of synthetic runs would not just inflate a count but invent journeys nobody took.
 * Its collect endpoint is region-routed and cannot be named exactly, which is why the
 * predicate below matches by suffix rather than by a list of hosts.
 *
 * THE ADVERTISING HOSTS ARE DELIBERATELY NOT STUBBED. Nothing here answers for
 * `*.g.doubleclick.net` or `*.google.com`, because stubbing them would hide the one
 * regression the permanent denial of the advertising signals exists to prevent. Left alone,
 * a request to one is refused by the content policy — which has no such host in it — and
 * surfaces as a violation in `policy.spec.ts`.
 *
 * It is not a substitute for the token being right. That is checked against the real
 * deployment, in step 10 of the deployment guide, which is the only place it can be.
 */

/** Where the audience beacon loads from, and where it reports to. Two hosts, not one. */
const BEACON_HOSTS: readonly string[] = ['static.cloudflareinsights.com', 'cloudflareinsights.com'];

/** Where the analytics tag loads from. Exact hosts: this repository writes the URL. */
const ANALYTICS_TAG_HOSTS: readonly string[] = ['www.googletagmanager.com', 'googletagmanager.com'];

/**
 * Where the analytics tag collects to. Matched by suffix rather than by name, because
 * the collect endpoint is region-routed at run time — `region1.google-analytics.com`
 * and its siblings — and no fixed list would hold.
 *
 * Suffix and not `includes`: `google-analytics.com.example.invalid` contains that
 * string and is not Google. The one-label-at-a-time form is what makes the predicate
 * say what it means.
 */
const ANALYTICS_COLLECT_DOMAINS: readonly string[] = ['google-analytics.com', 'analytics.google.com'];

/** What a stubbed host should be answered with — the two need different replies. */
type Stub = 'script' | 'collect' | undefined;

function stubFor(hostname: string): Stub {
    if (BEACON_HOSTS.includes(hostname) || ANALYTICS_TAG_HOSTS.includes(hostname)) {
        return 'script';
    }

    if (ANALYTICS_COLLECT_DOMAINS.some((domain: string) => hostname === domain || hostname.endsWith(`.${domain}`))) {
        return 'collect';
    }

    return undefined;
}

async function refuseMeasurement(context: BrowserContext): Promise<void> {
    await context.route(
        (url: URL) => stubFor(url.hostname) !== undefined,
        (route, request) =>
            stubFor(new URL(request.url()).hostname) === 'collect'
                ? // A collect endpoint answers with no body and no type, so "the body was
                  // empty" stays the proof that the answer came from here.
                  route.fulfill({ status: 204 })
                : route.fulfill({
                      status: 200,
                      contentType: 'application/javascript',
                      body: '',
                  }),
    );
}

/**
 * Whether a hostname is the analytics tag's own, exactly.
 *
 * Exported because the specs need the same answer and reaching for `url.includes('…')`
 * there would be a different, looser question — one that a host merely *containing* the
 * string would pass. Asked once, correctly, in the one place that already had to get it
 * right for the routing above.
 */
export function isAnalyticsTagHost(hostname: string): boolean {
    return ANALYTICS_TAG_HOSTS.includes(hostname);
}

/** Whether a hostname belongs to Google's analytics at all — the tag or its collectors. */
export function isAnalyticsHost(hostname: string): boolean {
    return stubFor(hostname) !== undefined && !BEACON_HOSTS.includes(hostname);
}

/**
 * What marks a document as carrying the tag: the tag's own attribute, never its host.
 * A page is free to mention `googletagmanager.com` in prose one day — a privacy page
 * listing subprocessors would — and a check keyed on the host would then read that
 * paragraph as a tag. `generate-headers.mjs` derives the policy the same way.
 */
export const ANALYTICS_TAG_MARKER = 'data-jd-analytics';

/** Where the site remembers the visitor's answer. Mirrors `Measurement.astro`. */
const CONSENT_KEY = 'jd:analytics-consent';

/** What a check wants the visitor to have already answered before the page loads. */
export type Consent = 'granted' | 'denied' | 'unasked';

/**
 * Puts the visitor's answer in place before the page can read it. Two things about how,
 * both of which were found by the checks going red rather than by reasoning.
 *
 * IT APPLIES ONCE PER CONTEXT, NOT ONCE PER NAVIGATION. An init script runs on every load,
 * so a seed written plainly would rewrite storage on every reload — and a check that clicks
 * "refuse" and reloads to prove the answer stuck would find the seed's answer waiting for it
 * instead of the visitor's. The session-scoped sentinel is what makes the seed a starting
 * state rather than a standing instruction.
 *
 * IT TAKES ITS OWN SENTINEL, so that two seeds can be layered. Playwright builds its injected
 * context by calling `browser.newContext()` — the method patched below — so every context is
 * seeded with the default before a spec's own option is consulted. Distinct sentinels let the
 * option run after the default and win, on the one navigation where either applies; sharing
 * one would make the default win and `test.use({ consent: 'unasked' })` silently mean
 * "denied", which is a banner check that skips past a working banner.
 */
async function seedConsent(context: BrowserContext, consent: Consent, sentinel: string): Promise<void> {
    await context.addInitScript(
        ([key, choice, once]: [string, string, string]) => {
            try {
                if (window.sessionStorage.getItem(once) !== null) {
                    return;
                }

                window.sessionStorage.setItem(once, '1');

                if (choice === 'unasked') {
                    window.localStorage.removeItem(key);
                } else {
                    window.localStorage.setItem(key, JSON.stringify({ v: 1, choice, at: Date.now() }));
                }
            } catch {
                // An origin that refuses storage simply gets the banner, which is the
                // same thing a real visitor there would get.
            }
        },
        [CONSENT_KEY, consent, sentinel] as [string, string, string],
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
export const test = base.extend<{ routed: void; consent: Consent; consentSeeded: void }, { browser: Browser }>({
    routed: [
        async ({ context }, use) => {
            await install(context);
            await use();
        },
        { auto: true },
    ],

    /**
     * What the visitor has already answered. Overridden per spec with
     * `test.use({ consent: 'unasked' })` to exercise the banner itself.
     */
    consent: ['denied', { option: true }],

    /**
     * Answered before the page loads, for the same "nobody has to remember" reason as
     * the fixture above — and for a second one that is specific to this banner.
     *
     * It is fixed to the bottom of the viewport, so on a release-built artefact it sits
     * over whatever is at the bottom of the page and swallows clicks meant for it. The
     * checks that copy an install command out of the last act's exit block are exactly
     * the ones that would start failing, and the failure would read as a broken copy
     * button rather than as a banner in the way.
     *
     * Refused rather than granted by default: a refusal is the state in which no Google
     * script is even asked for, which keeps every unrelated check as far from the tag
     * as it was before the tag existed.
     */
    consentSeeded: [
        async ({ context, consent }, use) => {
            await seedConsent(context, consent, 'jd:test-consent-option');
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
                // Always the default here, never the per-spec option: this fixture is
                // worker-scoped and cannot see a test-scoped one. The option is layered on
                // top by `consentSeeded`, under its own sentinel, and wins where both apply.
                await seedConsent(context, 'denied', 'jd:test-consent-default');

                return context;
            };

            await use(browser);

            browser.newContext = openContext;
        },
        { scope: 'worker' },
    ],
});

export { expect };
