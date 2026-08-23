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
import { readFileSync, writeFileSync } from 'node:fs';
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

const token = (process.env.PUBLIC_CF_BEACON_TOKEN ?? '').trim();

const html = readFileSync(shell, 'utf8');

if (!html.includes(MARKER)) {
    console.error(`write-playground-measurement: ${MARKER} is missing from the playground shell.`);
    console.error('  apps/playground/wwwroot/index.html declares it; the publish copies it verbatim.');
    console.error('  Without it the playground is served unmeasured, which is what this step exists to prevent.');
    process.exit(1);
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
 * THE HOST IS STILL WRITTEN LITERALLY, which is load-bearing twice over:
 * `generate-headers.mjs` grants the beacon's hosts to a document that names them, and
 * `verify-output.sh` asserts the shell and the site's pages agree. Both read the string.
 *
 * The token is embedded through JSON.stringify twice — once for the attribute's JSON,
 * once for the JavaScript string literal holding it — so a token carrying a quote cannot
 * break out of either. The token is ours and the risk is theoretical; the alternative was
 * a template literal that would have looked equally correct while being one bad character
 * away from a broken document.
 */
const beacon = token === ''
    ? ''
    : `<script>
        if (window.self === window.top) {
            var beacon = document.createElement('script');
            beacon.defer = true;
            beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
            beacon.setAttribute('data-cf-beacon', ${JSON.stringify(JSON.stringify({ token }))});
            document.head.appendChild(beacon);
        }
    </script>`;

writeFileSync(shell, html.replace(MARKER, beacon), 'utf8');

console.log(token === ''
    ? '  no beacon token, so the playground shell measures nobody — as every page of this build does'
    : '  dist/playground/index.html  (audience beacon written in)');
