import { defineConfig, devices } from '@playwright/test';

/**
 * The browser checks, and what they run against.
 *
 * Not `astro dev`. The suite talks to `dist/` served by the same runtime production uses,
 * because half of what it checks is applied by that runtime rather than written in the
 * artefact: the Content-Security-Policy and the cache rules come out of `_headers`, parsed
 * by workerd. A rule file in this repository was present, well formed and silently ignored
 * for months' worth of builds — `scripts/check-served-headers.sh` exists because of it, and
 * a browser suite pointed at a dev server would be the same mistake with a nicer report.
 *
 * The decision and the alternatives weighed against it are in ADR-0009.
 */

/**
 * A port of its own, not wrangler's default. A maintainer running `pnpm serve` in another
 * terminal is the normal state of this repository, and a suite that quietly attached to
 * whatever was already on 8787 would be checking a build nobody said it was checking.
 */
const PORT: number = 8788;
const BASE_URL: string = `http://127.0.0.1:${PORT}`;

/**
 * A browser this machine already has, when it has one. CI leaves this unset and uses the
 * Chromium that `playwright install` put where Playwright expects it; a development
 * container that ships its own browser points at it and skips the download.
 */
const executablePath: string | undefined = process.env.CHROMIUM_PATH;

export default defineConfig({
    testDir:      './tests/browser',
    fullyParallel: true,
    forbidOnly:   Boolean(process.env.CI),

    /**
     * Zero, deliberately, and it is half of the flake policy in ADR-0009.
     *
     * A retry turns an intermittent failure into a passing run with a footnote nobody
     * reads. Kept at zero, an intermittent red is a defect in the check — to be fixed or
     * the check deleted — and stays visible until somebody does one of the two. The other
     * half is that no check waits on a fixed delay, which `scripts/check-in-browser.sh`
     * refuses rather than trusts.
     */
    retries: 0,

    reporter: process.env.CI ? [['list'], ['github']] : [['list']],

    timeout: 30_000,
    expect:  { timeout: 10_000 },

    use: {
        baseURL:       BASE_URL,
        trace:         'retain-on-failure',
        launchOptions: executablePath === undefined ? {} : { executablePath },
    },

    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

    webServer: {
        command:             `pnpm serve --port ${PORT}`,
        url:                 BASE_URL,
        reuseExistingServer: false,
        timeout:             120_000,
        stdout:              'ignore',
        stderr:              'pipe',
    },
});
