// Forwards the playground's one census event to the site's collector.
//
// WHY THE PLAYGROUND HAS A FILE OF ITS OWN rather than loading the site's. The site's
// measurement is an Astro-bundled module that listens for DOM events its own components
// dispatch; nothing it listens for happens here, and nothing here dispatches into it. What
// the two genuinely share is the endpoint and the shape of a body, which is four lines —
// far less than a bundle, an import graph and a fingerprinted URL would cost to borrow.
// A consent decision would be the opposite case, and would have to be shared rather than
// copied: a retention window drifting between two applications is silent, where a
// duplicated `sendBeacon` cannot be. Nothing here is gated on consent — this lane asks
// nobody — so that question is not this file's.
//
// THE BODY IS BUILT HERE AND NOT IN C#, which keeps `System.Text.Json` and its reflection
// out of a WebAssembly payload that is already the largest thing this site asks anybody to
// download. C# hands over the two facts it alone knows — the reader's locale and the shape
// of the chain — and this file owns everything about the transport: the endpoint, the event
// name, and the decision to omit a field rather than send an empty one.
//
// IT IS FIRE-AND-FORGET, for the reason the site's is. `sendBeacon` hands the request to
// the browser and returns; there is no await, no retry, and no branch that reads the
// response. The visitor has their value by the time this runs.
//
// SINCE ADR-0025 IT REPORTS INTO TWO LANES, not one, and the difference between them is the
// whole reason both exist. The census event below asks nobody and counts everybody, so it is
// where the totals and the chain shapes live. The journey event asks first and counts only
// those who said yes, so it is where "how many presses per visitor" lives — a question the
// census lane cannot answer, because it recognises nobody by design.

/** The one path the collector answers on. Kept in step with worker/index.ts by hand. */
const JD_EVENT_ENDPOINT = '/_event';

/**
 * Reports one press of Generate.
 *
 * `chain` is the line the visitor read with every argument replaced by a question mark
 * (ADR-0024), or null when the chain outran what the collector's field holds. Null omits
 * the property rather than sending an empty one: the collector reads an absent chain as
 * "this event has no shape to report" and still counts the press, which is the whole point
 * of losing the shape rather than the count.
 *
 * @param {string} locale two letters, the language the reader chose
 * @param {string|null} chain the anonymised chain, or null when there is none to report
 */
window.jdReportGenerate = function jdReportGenerate(locale, chain) {
    const payload = {
        event: 'generate-clicked',
        // The playground is one document and one place; there is no finer "where" for it to
        // report, and §15.3 wants a name rather than a position in any case.
        placement: 'playground',
        locale: locale,
    };

    // Absent rather than empty, and only when there is something to say. An empty string
    // would be a value the collector's pattern refuses, which would cost the event rather
    // than its shape.
    if (typeof chain === 'string' && chain !== '') {
        payload.chain = chain;
    }

    // A Blob rather than a bare string, so the request carries a JSON content type and the
    // collector parses it without guessing. Same origin, so no CORS is involved.
    navigator.sendBeacon(JD_EVENT_ENDPOINT, new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    reportToJourney(locale);
};

/**
 * The same press, in the lane that can tell one visitor from another.
 *
 * ASKED OF THE SHARED MODULE, WHICH IS THE ONLY THING THAT MAY ANSWER. `jdConsent.reporting()`
 * re-reads the stored answer, reconciles this document when it has lapsed, and says no —
 * ADR-0018's promise, kept by one implementation for both applications rather than by a
 * second copy here. Absent module or absent tag means no report, which is the direction to
 * fail in.
 *
 * IT CARRIES NO CHAIN, deliberately. ADR-0024 put the shape in the census lane precisely
 * because a rate is only readable against the lane that covers everybody; sending it here as
 * well would widen what a third party is told for a figure that is already better answered
 * next door. What this lane adds is the visitor, not the detail.
 *
 * @param {string} locale two letters, the language the reader chose
 */
function reportToJourney(locale) {
    var consent = window.jdConsent;

    if (consent === undefined || !consent.reporting() || typeof window.gtag !== 'function') {
        return;
    }

    // `content_locale` is the parameter the site's own events carry, and the same name is
    // what lets one report read across both applications rather than two.
    window.gtag('event', 'playground_generated', { content_locale: locale });
}
