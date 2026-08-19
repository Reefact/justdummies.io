// Generate dist/_headers, the response headers Cloudflare serves the artefact with.
//
// It is generated rather than versioned for one reason: the Content Security Policy
// has to name a hash that only the build knows.
//
// Blazor writes an inline <script type="importmap"> into the playground's shell,
// carrying the fingerprinted asset names and their integrity hashes. It is inline,
// so a policy of `script-src 'self'` blocks it, and a blocked importmap means the
// runtime resolves nothing and the playground never starts — with a blank page and a
// console message as the only symptom. The escapes are 'unsafe-inline', which would
// disable inline-script protection across the whole site to accommodate one tag, or
// a hash of that exact tag. This takes the hash, and recomputes it every build
// because the fingerprints inside it change every build.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

/**
 * A page with its HTML comments removed, because a comment that merely *mentions* a
 * script tag is not a script.
 *
 * `ApiCategoryNav.astro` carries one: a comment explaining that the search results are
 * written by "the plain <script> above via innerHTML". The scanner below matched that
 * `<script>` and then ran to the next real `</script>`, so what it hashed was the whole
 * of the page's main content — different on every page, and therefore a distinct hash
 * per page. Eighteen of the twenty-seven hashes the policy carried were that: not
 * scripts, and not protecting anything.
 *
 * A browser never executes a commented-out tag, so nothing is lost by dropping these
 * before the scan. The one shape this would mishandle is a real script whose body
 * contains `<!--` (the pre-HTML5 idiom for hiding source from ancient browsers); no page
 * here uses it, and `verify-output.sh` would fail if one appeared, because the hash it
 * demands would no longer be in the policy.
 */
function withoutComments(html) {
    return html.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * The bytes a browser hashes are exactly those between the script tag and its
 * closing tag — no trimming, no re-indenting.
 */
function inlineScriptHashes(html) {
    const pattern = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
    const hashes = [];

    for (const match of withoutComments(html).matchAll(pattern)) {
        const body = match[1];
        if (body.length === 0) {
            continue;
        }
        hashes.push(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
    }

    return hashes;
}

/** Every HTML document in the artefact, because the policy applies to all of them. */
function htmlDocuments(directory) {
    const found = [];

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
            found.push(...htmlDocuments(path));
        } else if (entry.name.endsWith('.html')) {
            found.push(path);
        }
    }

    return found;
}

// Scanned across the whole artefact rather than the playground shell alone. The
// shell is where the importmap lives and was the only known case, but a generator
// that covers less than the policy it writes is a policy that is wrong somewhere
// nobody looked — and verify-output.sh checks every document, so the two would
// have disagreed the first time a page gained an inline script.
const hashes = new Set();

/**
 * Where the audience beacon is loaded from, and where it reports to. Two different
 * hosts, which is easy to miss and fails in two different ways: the wrong script
 * host and the beacon never loads, the wrong report host and it loads, runs, and
 * silently posts nothing.
 */
const BEACON_SCRIPT_HOST = 'https://static.cloudflareinsights.com';
const BEACON_REPORT_HOST = 'https://cloudflareinsights.com';

/**
 * Where the analytics tag is loaded from, and where it collects to.
 *
 * THE COLLECT HOSTS ARE REGION-ROUTED AT RUN TIME — region1.google-analytics.com and
 * its siblings — so they can only be named by wildcard. The bare
 * `analytics.google.com` is listed alongside its wildcard because a CSP wildcard
 * matches at least one label and therefore does not cover the domain itself; Google's
 * own guidance covers that host through `https://*.google.com`, which is an
 * advertising host this policy deliberately refuses.
 *
 * THE TAG HOST BELONGS IN ALL THREE DIRECTIVES. It serves the script, the tag beacons
 * back to it, and it is one of the hosts the pixel transport falls back to.
 *
 * WHAT IS DELIBERATELY ABSENT IS THE POINT. Google's guidance also lists
 * *.g.doubleclick.net, *.google.com and every *.google.<TLD> — the Advertising
 * Features hosts. The tag never contacts them while its three advertising consent
 * signals are denied, and they are denied permanently (GoogleAnalytics.astro). Leaving
 * them out is "as wide as the artefact and no wider", and it turns that decision into
 * something a browser enforces: the day an ad signal is granted, the request is
 * refused and tests/browser/policy.spec.ts reports the violation.
 */
const ANALYTICS_TAG_HOST = 'https://www.googletagmanager.com';
const ANALYTICS_COLLECT_HOSTS = 'https://*.google-analytics.com https://*.analytics.google.com https://analytics.google.com';

/**
 * THE POLICY IS AS WIDE AS THE ARTEFACT AND NO WIDER. The beacon is only rendered
 * when a token was configured (see Measurement.astro), so a preview built without
 * one carries no beacon — and naming a third-party host in its policy anyway would
 * be permission granted to something that is not there. Read from what was built
 * rather than from a flag, for the same reason the script hashes are.
 *
 * The dimensioned events of §15.2 need nothing here: they post to this site's own
 * origin, which `connect-src 'self'` already covers.
 */
let carriesBeacon = false;

/**
 * The same rule, read the same way, for the analytics lane.
 *
 * This grep only works because the tag is `is:inline`, which is not a detail: Astro
 * registers a bundled <script> from the module graph rather than the render tree, so
 * written that way the tag would leave an `_astro/` chunk naming this host on builds
 * that render nothing — and the policy would then be read from a file no document
 * loads. `GoogleAnalytics.astro` explains the choice, and verify-output.sh fails the
 * build if a chunk ever names a Google host again.
 *
 * IT LOOKS FOR THE TAG'S OWN ATTRIBUTE, NOT FOR THE HOST. The attribute appears on the
 * tag and nowhere else, whereas the host is a string a page could one day mention in
 * prose — a privacy page naming its subprocessors, say — and a policy widened by a
 * paragraph would be a policy wider than its artefact. verify-output.sh checks the host
 * itself, so the two derive the same answer from two different witnesses.
 */
const ANALYTICS_TAG_MARKER = 'data-jd-analytics';

let carriesAnalytics = false;

for (const document of htmlDocuments(dist)) {
    const html = readFileSync(document, 'utf8');

    for (const hash of inlineScriptHashes(html)) {
        hashes.add(hash);
    }

    if (html.includes('static.cloudflareinsights.com')) {
        carriesBeacon = true;
    }

    if (html.includes(ANALYTICS_TAG_MARKER)) {
        carriesAnalytics = true;
    }
}

const scriptHashes = [...hashes].sort();

if (scriptHashes.length === 0) {
    console.error('generate-headers: no inline script found anywhere in the artefact.');
    console.error('  The playground shell has always carried an importmap. Either the template');
    console.error('  changed and the policy can tighten, or the artefact was not built.');
    process.exit(1);
}

const contentSecurityPolicy = [
    "default-src 'self'",
    // The landing page frames the playground's hero route once the visitor asks for it
    // (§9.8). Same origin and no wider: the policy names 'self', so a third-party frame
    // is refused even if something on the page tried to add one.
    "frame-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // 'self' rather than 'none', and the change is worth stating because it narrows a
    // security rule that used to be absolute.
    //
    // 'none' means no document anywhere may frame these pages — including these pages. The
    // landing page frames the playground's hero route to run the library in the visitor's
    // browser (§9.8), and under 'none' the browser refuses to render it: the frame stays
    // blank and the refusal appears only in the console. Measured rather than reasoned
    // about — that is exactly how this line was found.
    //
    // 'self' keeps every third-party frame refused, which is all the rule was defending
    // against: an attacker's page cannot embed this site to trick a visitor into clicking
    // through it, because their origin is not ours. What it now permits is this origin
    // framing itself, which an attacker has no way to arrange.
    "frame-ancestors 'self'",
    // The site posts no form anywhere. The day it does, this is the line to revisit.
    "form-action 'none'",
    // The analytics hosts are here for the pixel the tag falls back to when sendBeacon
    // is unavailable — a fallback that is invisible until the day it is taken.
    `img-src 'self' data:${carriesAnalytics ? ` https://*.google-analytics.com ${ANALYTICS_TAG_HOST}` : ''}`,
    "font-src 'self'",
    // Kept at 'self' by emitting every stylesheet as a file: see inlineStylesheets in
    // astro.config.mjs, and the assertion in verify-output.sh.
    "style-src 'self'",
    // The playground makes no network call at all, so 'self' covers the framework
    // fetching its own assets and the §15.2 events posting to this site's collector.
    // The report host is the audience beacon's, and only when the artefact carries it.
    `connect-src 'self'${carriesBeacon ? ` ${BEACON_REPORT_HOST}` : ''}${carriesAnalytics ? ` ${ANALYTICS_COLLECT_HOSTS} ${ANALYTICS_TAG_HOST}` : ''}`,
    // 'wasm-unsafe-eval' is what compiling a WebAssembly module requires, and it is
    // NOT 'unsafe-eval': it permits WebAssembly compilation and nothing else — no
    // eval, no Function constructor, no inline script execution.
    `script-src 'self' 'wasm-unsafe-eval' ${scriptHashes.join(' ')}${carriesBeacon ? ` ${BEACON_SCRIPT_HOST}` : ''}${carriesAnalytics ? ` ${ANALYTICS_TAG_HOST}` : ''}`,
    "worker-src 'self' blob:",
].join('; ');

const headers = `# GENERATED by scripts/generate-headers.mjs — do not edit by hand.
#
# The Content Security Policy below names a hash of the playground's inline
# importmap, which changes whenever an asset fingerprint changes. Editing this file
# by hand therefore breaks the playground at the next build.

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: ${contentSecurityPolicy}

# HTML is always revalidated: it is the document that names every fingerprinted
# asset, so a stale copy pins stale assets no matter how they are cached.
/*.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate

# version.json exists to answer "what is live right now". A cached copy answers
# "what was live when you last asked", which is the one answer it must never give —
# and the reader most likely to be misled is whoever is checking whether a release
# went out. no-store rather than must-revalidate: this file is 90 bytes, so there is
# nothing to save by revalidating, and no-store cannot be satisfied by a stale copy.
/version.json
  Cache-Control: no-store

# Astro fingerprints everything under /_astro/, so a changed file is a changed URL
# and the old one can be kept forever.
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# The framework is fingerprinted too, but the publish also emits unfingerprinted
# aliases beside the fingerprinted files (dotnet.js next to dotnet.<hash>.js). A
# week is long enough to matter and short enough that an alias cannot pin a stale
# runtime. Revisit with measurements rather than by feel.
/playground/_framework/*
  Cache-Control: public, max-age=604800
`;

/**
 * The longest line the host will accept in a rules file.
 *
 * Past it the runtime does not complain and does not truncate: it discards the rule and
 * serves the page with no policy at all, while still reporting the file as parsed. The
 * failure therefore looks nothing like its cause — `check-served-headers.sh` reports
 * "the host is ignoring _headers" on a file that is present, well formed, and passes
 * every on-disk check.
 *
 * Measured rather than taken on faith: a policy line of 2031 characters was dropped,
 * one of 1927 was applied. The limit is checked here, where the line is built and where
 * the message can say which directive grew, rather than three steps later against a
 * running server.
 */
const LONGEST_RULE_LINE = 2000;

const overlong = headers
    .split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => line.length > LONGEST_RULE_LINE);

if (overlong.length > 0) {
    for (const { line, number } of overlong) {
        console.error(
            `generate-headers: line ${number} is ${line.length} characters, past the ${LONGEST_RULE_LINE} the host accepts — ` +
                `it would be discarded and the response served with no such header.\n` +
                `  ${line.slice(0, 120)}…`,
        );
    }
    console.error(
        '  The script-src hash list is what grows here. A page gaining a genuinely new inline script is a real cost;\n' +
            '  eighteen hashes of one comment were not, which is the defect this limit was added alongside.',
    );
    process.exit(1);
}

writeFileSync(join(dist, '_headers'), headers, 'utf8');

// Both lines are printed either way. A build that measures nothing is a normal
// outcome — a preview, a local build, or the analytics switch deliberately off — but
// it is not one to discover from a silent dashboard three weeks later.
console.log(
    `  dist/_headers  (${scriptHashes.length} inline script hash(es) pinned, ` +
        `audience beacon ${carriesBeacon ? 'present' : 'absent'}, ` +
        `analytics tag ${carriesAnalytics ? 'present' : 'absent'})`,
);
