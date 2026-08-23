/**
 * The measurement collector — the only server-side code this site runs, and the
 * reason ADR-0012 exists.
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
 * reachable from a script. Three of the four are required of every event; the
 * variant is required of the events that have one, which is ADR-0023 and is
 * written out where the check is.
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

/**
 * What a field an event does not have is recorded as, and the reason it is empty
 * rather than a word. A word would be a value: it would sort among the real ones, it
 * would have to be excluded from every query by name, and the first reader to meet it
 * would have to find out whether `none` was a door somebody could take. Empty reads as
 * what it is.
 *
 * Two fields reach it. The variant, of an event with one door and no choice to report
 * (ADR-0023). The chain, of every event but the playground's — and of that one too when
 * the chain outran what the field holds (ADR-0024).
 */
const ABSENT = '';

/** Matches the site's own locale tags without this file having to list them. */
const LOCALE = /^[a-z]{2}$/;

/**
 * THE SHAPE OF A PLAYGROUND CHAIN, AND THE REASON IT IS A PATTERN RATHER THAN A
 * PROMISE. §10.3 forbids the playground persisting a saisie outside the browser, and
 * an argument is a saisie — `StartingWith("…")` accepts whatever a visitor pastes into
 * it. ADR-0024 answers that by reporting the line they read with every argument
 * replaced by a question mark, and this is where that stops being a convention the
 * sender is trusted to follow.
 *
 * A question mark is the only thing admitted where an argument would stand. Not
 * "arguments are stripped before sending" — that is a sentence about one sender, and
 * this endpoint is public. A body carrying `Any.String().StartingWith("ORD-")` does not
 * fail a comparison here; it fails to match, and is refused exactly as a malformed
 * variant is. The guarantee holds against a sender that never read the decision.
 *
 * It ends in `.Generate()` because a chain that never generated a value is not an
 * event this records, and requiring the ending costs nothing a real chain has.
 */
const CHAIN = /^Any(?:\.[A-Z][A-Za-z0-9]*\((?:\?(?:, \?)*)?\))*\.Generate\(\)$/;

/**
 * Longer than a name, because a chain is a line rather than a word: four or five steps
 * with their arguments outrun the 64 above long before a visitor would call the chain
 * unusual.
 *
 * KEPT IN STEP WITH THE PLAYGROUND BY HAND, like the endpoint above is kept in step
 * with wrangler.jsonc. `Home.razor` reports no chain rather than an over-long one, and
 * it measures against this number; if the two ever disagree in the wrong direction the
 * event is refused outright rather than landing without its shape — the count lost as
 * well as the detail.
 */
const MAX_CHAIN = 256;

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

        const { event, placement, variant, locale, ordinal, chain } = payload as Record<string, unknown>;

        if (!isName(event, VARIANT) || !isName(placement, PLACEMENT)) {
            return accepted;
        }
        if (!isName(locale, LOCALE)) {
            return accepted;
        }

        // ABSENT IS A SHAPE HERE; MALFORMED IS STILL A REFUSAL. §15.2 asks the copy event
        // for a variant because a copy has two doors behind it and the question is which
        // one was taken. An event whose exit is single has no such answer to give, and
        // ADR-0023 is the decision to let it say so rather than invent a word. What is not
        // relaxed is the check on a variant that did arrive: recording a malformed one as
        // absent would make rubbish and a legitimate silence read identically here, which
        // is the one thing the dataset could never recover from.
        if (variant !== undefined && !isName(variant, VARIANT)) {
            return accepted;
        }

        const door: string = typeof variant === 'string' ? variant : ABSENT;

        // Absent on every event but the playground's, and absent on that one too when the
        // chain outran MAX_CHAIN — ADR-0024 chooses losing the shape over losing the count,
        // for the reason ADR-0023 made the variant optional. Present and malformed is still
        // a refusal: a chain that does not match carries something a chain may not carry.
        if (chain !== undefined && !(typeof chain === 'string' && chain.length <= MAX_CHAIN && CHAIN.test(chain))) {
            return accepted;
        }

        const shape: string = typeof chain === 'string' ? chain : ABSENT;

        // Absent is fine, and for its own reason rather than the variant's above: §15.3
        // makes the ordinal a convenience for reading a dashboard rather than part of the
        // record, so no event has ever been required to carry one.
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
            blobs: [event, placement, door, locale, shape],
            doubles: [position],
            indexes: [placement],
        });

        return accepted;
    },
};
