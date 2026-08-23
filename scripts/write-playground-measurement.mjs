// Write the site's measurement into the playground's shell, inside the artefact.
//
// WHY THIS IS A STEP OF ITS OWN rather than a few lines in copy-playground.sh. That
// script promises, in its own header, that it copies the published directory across
// "rather than rewriting anything" — the two halves agree because they were built to
// agree. That promise is worth keeping, and this is genuinely a different job: not
// reconciling two build outputs, but giving one of them a configuration its own
// toolchain has no way to receive.
//
// WHY THE PLAYGROUND CANNOT READ THE TOKEN ITSELF. The site is Vite: `Measurement.astro`
// reads `import.meta.env.PUBLIC_CF_BEACON_TOKEN` and Astro inlines it at build time. The
// playground is `dotnet publish`, which has no equivalent — its shell is a hand-written
// file copied verbatim, and nothing in the .NET pipeline substitutes an environment
// variable into it. So the value has to be written in from outside, once, here.
//
// WHY IT RUNS BEFORE generate-headers.mjs, which is not a preference. That script derives
// the content policy from what the artefact actually contains, and grants the beacon's
// hosts only to a build whose documents carry it. Injecting after it would produce a
// document the policy blocks — visible only in a console nobody is watching.
//
// THE RULE IS THE ONE Measurement.astro APPLIES, and deliberately no stricter. A build
// with no token renders no beacon and is a normal build: a preview measures nothing
// rather than measuring into the wrong account (ADR-0004 applied to something invisible).
// There is no validation to share with the site here, because the site validates nothing
// about this token either — it is rendered into every page and meant to be read.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shell = join(root, 'dist', 'playground', 'index.html');

/**
 * The slot the shell declares for this. A marker rather than a pattern matched against
 * the markup: the shell says where its measurement goes, so this script fills a space
 * that was left for it rather than guessing at a place to splice into. Losing the marker
 * is a build failure below rather than a silent no-op — the shape of defect this whole
 * change exists to answer.
 */
const MARKER = '<!--jd:measurement-->';

/**
 * The token, made safe to sit inside a double-quoted HTML attribute.
 *
 * `&` first, or the escape would escape its own output. `<` and `>` cannot end an
 * attribute and are escaped anyway: a value that leaks into a context this file did not
 * anticipate should be inert there too, and the cost is four characters.
 *
 * The token is ours and none of this is likely; the point is that a token which did
 * carry a quote would corrupt the document rather than be reported, and a corrupted
 * shell is a playground that serves nothing.
 */
export function asAttribute(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/**
 * The same beacon the site renders, and the same attribute shape — Cloudflare reads its
 * configuration out of `data-cf-beacon` as JSON — but added by a script rather than
 * written as a tag, because one condition has to be answered first.
 *
 * IT REPORTS A VISIT ONLY WHEN IT IS THE DOCUMENT THAT WAS VISITED. This shell answers on
 * two addresses: `/playground/`, which a visitor navigates to, and `/playground/hero`,
 * which `_redirects` rewrites to the same file and `LiveHero.astro` loads into an iframe
 * the moment somebody presses Run on the landing page. A beacon written as a plain tag
 * fires in both, so every Run on the landing page would report a playground visit nobody
 * made — and would do it to the one figure this whole change exists to establish. The
 * denominator would grow with an event that has no matching numerator, since the census
 * event is emitted by `Home.razor` alone and never by the hero widget.
 *
 * `window.self === window.top` rather than a test against the path, because the property
 * that matters is being embedded rather than being one particular route. A second
 * embedding added later is covered without this file learning its address, and the check
 * is safe across origins where reading `frameElement` would throw.
 *
 * THE TOKEN TRAVELS ON AN ATTRIBUTE, NOT IN THE BODY, which is the rule
 * `GoogleAnalytics.astro` states for the analytics id and it holds for the same reason
 * here. The content policy names a hash of each inline script's body, computed from the
 * built artefact; a body carrying the token would mean a new hash on the day the token is
 * rotated, and a policy that has to be regenerated for a value that is not code. Read
 * from `dataset` instead, this body is byte-identical across every build and every
 * account, and the only thing that changes is an attribute the hash never sees.
 *
 * THE HOST IS STILL WRITTEN LITERALLY, which is load-bearing twice over:
 * `generate-headers.mjs` grants the beacon's hosts to a document that names them, and
 * `verify-output.sh` asserts the shell and the site's pages agree. Both read the string.
 */
export function beaconTag(token) {
    return token === ''
        ? ''
        : `<script data-cf-beacon-token="${asAttribute(token)}">
        (function () {
            var tag = document.currentScript;
            var token = tag && tag.dataset ? tag.dataset.cfBeaconToken : '';

            if (!token || window.self !== window.top) {
                return;
            }

            var beacon = document.createElement('script');
            beacon.defer = true;
            beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
            beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: token }));
            document.head.appendChild(beacon);
        })();
    </script>`;
}

/**
 * The attribute `GoogleAnalytics.astro` puts the measurement id on, and the one thing that
 * identifies its tag in a built page. `generate-headers.mjs` looks for the same string, and
 * says why it looks for the attribute rather than for the host.
 */
const ANALYTICS_TAG_MARKER = 'data-jd-analytics';

/**
 * The site's analytics tag, lifted out of a built page whole.
 *
 * WHY LIFTED RATHER THAN WRITTEN AGAIN. That tag is the promise ADR-0018 made: it declares
 * every consent signal denied, it loads no Google script until `jdAnalyticsStart` is called,
 * and its withdrawal path raises Google's own opt-out flag rather than merely revoking the
 * signal. A second copy of it in this file would be a second copy of that promise, free to
 * drift from the first — and the drift would be silent in the worst direction. Copying the
 * bytes keeps one implementation.
 *
 * IT IS THE SAME BYTES ON EVERY PAGE, which is not luck. `GoogleAnalytics.astro` puts the id
 * on an attribute and never in the body, precisely so that the body is identical everywhere
 * and exactly one hash of it ever enters the content policy. That is what makes a page an
 * interchangeable source for this, and what makes the copy cost the policy nothing:
 * `generate-headers.mjs` runs after this step, hashes every document, and finds the hash it
 * already had.
 *
 * @param {string} html a document that may carry the tag
 * @returns {string} the tag, opening angle bracket to closing tag, or '' when there is none
 */
export function analyticsTagIn(html) {
    const marker = html.indexOf(ANALYTICS_TAG_MARKER);

    if (marker === -1) {
        return '';
    }

    // Walked outwards from the attribute rather than matched with a pattern: an attribute is
    // a fixed string in a place a regex would have to guess at, and the two ends are
    // unambiguous. A `</script>` cannot appear inside the body — the tag has no string
    // literal that could carry one — so the first one after the attribute is this tag's.
    const opening = html.lastIndexOf('<script', marker);
    const closing = html.indexOf('</script>', marker);

    if (opening === -1 || closing === -1) {
        return '';
    }

    return html.slice(opening, closing + '</script>'.length);
}

/** Every `.html` under a directory, the playground's own excluded. */
function siteDocuments(directory) {
    const found = [];

    for (const entry of readdirSync(directory)) {
        const path = join(directory, entry);

        if (statSync(path).isDirectory()) {
            if (path !== join(root, 'dist', 'playground')) {
                found.push(...siteDocuments(path));
            }
        } else if (entry.endsWith('.html')) {
            found.push(path);
        }
    }

    return found;
}

/**
 * The tag this build's own pages carry, or '' when they carry none.
 *
 * ASKED OF THE ARTEFACT RATHER THAN OF THE ENVIRONMENT, which is the rule the beacon check in
 * `verify-output.sh` already applies: what must never happen is the two halves of one site
 * disagreeing about whether it is measured. Reading the built pages means the shell agrees
 * with them by construction rather than by two conditions that happen to match today.
 */
function analyticsTagFromSite() {
    for (const document of siteDocuments(join(root, 'dist'))) {
        const tag = analyticsTagIn(readFileSync(document, 'utf8'));

        if (tag !== '') {
            return tag;
        }
    }

    return '';
}

/**
 * The slot filled, as a value rather than as a file.
 *
 * A FUNCTION AS THE REPLACEMENT, NOT A STRING. `String.prototype.replace` reads `$&`,
 * `$'` and their siblings out of a replacement string, so a token carrying one of them
 * would splice part of this document into itself instead of the literal value — and the
 * escaping above cannot help, because `&` escapes to `&amp;` and `$&amp;` still starts
 * with a pattern. A function's return value is used as-is, which is the only form of
 * this call that means what it looks like it means.
 */
export function fill(html, token, analyticsTag = '') {
    return html.replace(MARKER, () => beaconTag(token) + analyticsTag);
}

/** Fills the shell's slot, in place. The step build-site.sh runs. */
function write() {
    const token = (process.env.PUBLIC_CF_BEACON_TOKEN ?? '').trim();
    const html = readFileSync(shell, 'utf8');

    if (!html.includes(MARKER)) {
        console.error(`write-playground-measurement: ${MARKER} is missing from the playground shell.`);
        console.error('  apps/playground/wwwroot/index.html declares it; the publish copies it verbatim.');
        console.error('  Without it the playground is served unmeasured, which is what this step exists to prevent.');
        process.exit(1);
    }

    const analyticsTag = analyticsTagFromSite();

    writeFileSync(shell, fill(html, token, analyticsTag), 'utf8');

    const written = [token === '' ? null : 'audience beacon', analyticsTag === '' ? null : 'analytics tag'].filter(
        (part) => part !== null,
    );

    console.log(written.length === 0
        ? '  no measurement configured, so the playground shell measures nobody — as every page of this build does'
        : `  dist/playground/index.html  (${written.join(' and ')} written in)`);
}

/** Everything between the tag's `>` and its `</script>` — what the policy hashes. */
function bodyOf(tag) {
    return tag.slice(tag.indexOf('>') + 1, tag.lastIndexOf('</script>'));
}

/**
 * The rules above, asserted — the shape `lib/inline-scripts.mjs` uses, and for its
 * reason: a paragraph explaining why the token sits on an attribute is not something a
 * later edit trips over, and both of the defects these cover were found by reading the
 * output rather than by anything going red.
 *
 * The hash rule is the load-bearing one. `generate-headers.mjs` names a sha256 of each
 * inline script's body, so the day the body starts carrying the token is the day the
 * policy has to be regenerated for a value that is not code.
 */
const CASES = [
    ['no token writes nothing at all', () => beaconTag('') === ''],
    [
        'the body does not carry the token, so its hash does not move',
        () => bodyOf(beaconTag('token-one')) === bodyOf(beaconTag('a-completely-different-token-9999')),
    ],
    ['the host is still written literally', () => beaconTag('t').includes('https://static.cloudflareinsights.com/beacon.min.js')],
    [
        'a token carrying a replacement pattern lands literally',
        () => beaconTag('ab$&cd').includes('data-cf-beacon-token="ab$&amp;cd"'),
    ],
    ['a token carrying a quote cannot end its attribute', () => beaconTag('a"b').includes('data-cf-beacon-token="a&quot;b"')],
    [
        'and does not splice the document into itself on the way in',
        () => !fill(`<head>${MARKER}</head>`, 'ab$&cd').includes(MARKER),
    ],
    ['a document with no analytics tag yields none', () => analyticsTagIn('<p>nothing here</p>') === ''],
    [
        'a tag is lifted whole, its attribute with it',
        () => analyticsTagIn(`<p>x</p>${ANALYTICS_TAG}<p>y</p>`) === ANALYTICS_TAG,
    ],
    [
        'and is lifted past a script that came before it',
        () => analyticsTagIn(`<script>var a = 1;</script>${ANALYTICS_TAG}`) === ANALYTICS_TAG,
    ],
    [
        'the slot carries both when both are configured',
        () => {
            const filled = fill(MARKER, 'a-token', ANALYTICS_TAG);

            return filled.includes('data-cf-beacon-token="a-token"') && filled.includes(ANALYTICS_TAG);
        },
    ],
];

/** A tag shaped like the one `GoogleAnalytics.astro` renders, for the rules above. */
const ANALYTICS_TAG = '<script is:inline data-jd-analytics="G-EXAMPLE1">(function () { var t = 1; })();</script>';

function selfTest() {
    const broken = CASES.filter(([, holds]) => !holds()).map(([name]) => name);

    for (const name of broken) {
        console.error(`  ✗ ${name}`);
    }

    if (broken.length > 0) {
        console.error(`write-playground-measurement: ${broken.length} of ${CASES.length} rules broken.`);
        process.exit(1);
    }

    console.log(`  ✓ the playground's measurement is written in the way it must be (${CASES.length} rules)`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
    if (process.argv[2] === '--self-test') {
        selfTest();
    } else {
        write();
    }
}
