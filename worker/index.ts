/**
 * The measurement collector — the only server-side code this site runs, and the
 * reason ADR-0010 exists.
 *
 * WHY THERE IS A SCRIPT HERE AT ALL. §15.2 asks a question the page is built to
 * answer: not "do people copy the install command" but "which moment convinced
 * them". Answering it needs an event carrying a placement and a variant, and
 * Cloudflare Web Analytics has no way to accept one — it has no custom-event API,
 * and its own endpoint refuses anything that did not come from its beacon. So the
 * dimensioned half of §15 needs somewhere of its own to land, and this is it.
 *
 * WHY IT CANNOT TAKE THE SITE DOWN, which is the objection §12.3 raises and the
 * one that had to be answered before this file could exist. A request that matches
 * a static asset is served from the asset store without invoking this script, and
 * a request that matches none is answered by `not_found_handling` — also without
 * invoking it. `run_worker_first` in wrangler.jsonc names one path, so this script
 * sits behind that path and nothing else. Every page, every asset and the 404 are
 * outside it. Its quota, its bugs and its outages reach the measurement and stop
 * there.
 *
 * WHAT IT REFUSES TO RECORD. No address, no identifier, no cookie, nothing the
 * visitor typed. Four fields, each validated against a shape rather than trusted,
 * because this is a public endpoint and anything reachable from a browser is
 * reachable from a script.
 */

/**
 * Declared here rather than pulled from `@cloudflare/workers-types`. One file
 * needs three method signatures, and a dependency whose whole contribution is
 * those signatures is a dependency to keep in step for nothing.
 */
interface AnalyticsEngineDataset {
    writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

interface Env {
    MEASUREMENT: AnalyticsEngineDataset;
}

/** The one path this script answers on. Kept in step with wrangler.jsonc by hand. */
const ENDPOINT = '/_event';

/**
 * Long enough for every name the site emits, short enough that the dataset cannot
 * be filled with prose by whoever finds this endpoint.
 */
const MAX_LENGTH = 64;

/**
 * A PLACEMENT CARRIES NO DIGIT, and that is §15.3 enforced where the data enters
 * rather than only where it is built. The rule has an empirical motive: the page
 * went from eleven scenes to fourteen between two drafts and the final exit changed
 * ordinal, so an identifier indexed on position would have made two measurement
 * periods incomparable. `act-one-exit` spells the number as a word for exactly this
 * reason, and this pattern is what keeps the next one from being `act-1-exit`.
 *
 * scripts/verify-output.sh asserts the same rule against the built artefact, so a
 * violation fails the build rather than arriving here. This is the second half:
 * the build check protects what the site emits, and this protects the dataset.
 */
const PLACEMENT = /^[a-z]+(?:-[a-z]+)*$/;

/**
 * A variant may carry a digit, and the difference from a placement is deliberate.
 * §15.3 forbids indexing on position; it says nothing about a package name, and
 * `xunit-v3-adapter` is a variant this site could plausibly emit tomorrow.
 */
const VARIANT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Matches the site's own locale tags without this file having to list them. */
const LOCALE = /^[a-z]{2}$/;

/**
 * The ordinal §15.3 permits as a secondary field. Bounded because it is only ever a
 * position within one page, and an unbounded number from a public endpoint is a
 * number somebody will send `1e308` to.
 */
const MAX_ORDINAL = 1000;

function isName(value: unknown, shape: RegExp): value is string {
    return typeof value === 'string' && value.length <= MAX_LENGTH && shape.test(value);
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // Belt and braces: `run_worker_first` should mean nothing else reaches this
        // script, and a 404 here is what says so if that ever stops being true.
        if (url.pathname !== ENDPOINT) {
            return new Response(null, { status: 404 });
        }

        if (request.method !== 'POST') {
            return new Response(null, { status: 405, headers: { allow: 'POST' } });
        }

        // The beacon is same-origin, so a request announcing another origin is not
        // the site's. This turns away casual cross-site noise; it is not a security
        // boundary, and nothing downstream treats it as one.
        const origin = request.headers.get('origin');
        if (origin !== null && origin !== url.origin) {
            return new Response(null, { status: 403 });
        }

        // 204 WHATEVER HAPPENS BELOW. `sendBeacon` discards the response, so an error
        // status would reach no one and be recorded nowhere; and a public endpoint
        // that narrates why it rejected an input is a public endpoint explaining how
        // to craft an accepted one. What protects the dataset is the validation, and
        // what makes a rejection visible to a maintainer is the build check, which
        // fails before anything can be sent.
        const accepted = new Response(null, { status: 204 });

        let payload: unknown;
        try {
            payload = await request.json();
        } catch {
            return accepted;
        }

        if (typeof payload !== 'object' || payload === null) {
            return accepted;
        }

        const { event, placement, variant, locale, ordinal } = payload as Record<string, unknown>;

        if (!isName(event, VARIANT) || !isName(placement, PLACEMENT) || !isName(variant, VARIANT)) {
            return accepted;
        }
        if (!isName(locale, LOCALE)) {
            return accepted;
        }

        // Absent is fine — the ordinal is the one optional field, because §15.3 makes
        // it a convenience for reading a dashboard rather than part of the record.
        const position: number =
            typeof ordinal === 'number' && Number.isInteger(ordinal) && ordinal >= 0 && ordinal <= MAX_ORDINAL
                ? ordinal
                : -1;

        /**
         * THE ORDINAL IS A DOUBLE AND THE IDENTIFIERS ARE BLOBS, which is §15.3
         * written into the shape of the data rather than into a comment above it.
         * Blobs are what this dataset groups and filters by; doubles are measured,
         * not grouped. Putting the ordinal among the doubles means a query that
         * tried to key on position would have to work at it, and would look wrong
         * while doing so.
         */
        env.MEASUREMENT.writeDataPoint({
            blobs: [event, placement, variant, locale],
            doubles: [position],
            indexes: [placement],
        });

        return accepted;
    },
};
