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
 * The bytes a browser hashes are exactly those between the script tag and its
 * closing tag — no trimming, no re-indenting.
 */
function inlineScriptHashes(html) {
    const pattern = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
    const hashes = [];

    for (const match of html.matchAll(pattern)) {
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

for (const document of htmlDocuments(dist)) {
    const html = readFileSync(document, 'utf8');

    for (const hash of inlineScriptHashes(html)) {
        hashes.add(hash);
    }

    if (html.includes('static.cloudflareinsights.com')) {
        carriesBeacon = true;
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
    "img-src 'self' data:",
    "font-src 'self'",
    // Kept at 'self' by emitting every stylesheet as a file: see inlineStylesheets in
    // astro.config.mjs, and the assertion in verify-output.sh.
    "style-src 'self'",
    // The playground makes no network call at all, so 'self' covers the framework
    // fetching its own assets and the §15.2 events posting to this site's collector.
    // The report host is the audience beacon's, and only when the artefact carries it.
    `connect-src 'self'${carriesBeacon ? ` ${BEACON_REPORT_HOST}` : ''}`,
    // 'wasm-unsafe-eval' is what compiling a WebAssembly module requires, and it is
    // NOT 'unsafe-eval': it permits WebAssembly compilation and nothing else — no
    // eval, no Function constructor, no inline script execution.
    `script-src 'self' 'wasm-unsafe-eval' ${scriptHashes.join(' ')}${carriesBeacon ? ` ${BEACON_SCRIPT_HOST}` : ''}`,
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

writeFileSync(join(dist, '_headers'), headers, 'utf8');

// The beacon line is printed either way. A build that measures nothing is a normal
// outcome — a preview, a local build — but it is not one to discover from a silent
// dashboard three weeks later.
console.log(
    `  dist/_headers  (${scriptHashes.length} inline script hash(es) pinned, ` +
        `audience beacon ${carriesBeacon ? 'present' : 'absent'})`,
);
