// Mermaid fences, turned into inline SVG the site's Content-Security-Policy accepts.
//
// WHY THIS RUNS AT GENERATION TIME AND NOT AT BUILD TIME. `generate-docs.mjs` is a
// deliberate manual act (ADR-0013, ADR-0026) whose output is committed, so the SVG is in
// the repository before CI ever sees it. A rehype plugin doing the same work at `astro
// build` would put mermaid — 84 MB unpacked, 113 transitive packages — and a headless
// browser into every CI run, three times over, to recompute bytes that never change
// between commits. Here the cost is paid once, by the maintainer refreshing the mirror.
//
// WHY THE SVG CARRIES NO CSS. The site sets `style-src 'self'` with no 'unsafe-inline',
// `scripts/verify-output.sh` asserts no inline `<style>` survives, and mermaid's own
// output is CSS from end to end: a `<style>` block, `style=""` attributes, and HTML labels
// inside `<foreignObject>`. Every one of those is refused at run time. So three things
// happen before the SVG is kept:
//
//   1. `htmlLabels: false` — a label becomes SVG `<text>` rather than HTML in a
//      `<foreignObject>`, whose `display: table-cell` and `white-space` have no attribute
//      form and so could never be flattened.
//   2. The labels are rewritten from HTML (`<br/>`, `<i>`) into mermaid's own
//      markdown-string form, which says the same thing and comes out as `font-style`.
//   3. `mermaid-flatten.js` resolves every computed style into a presentation ATTRIBUTE —
//      `fill=`, `stroke=`, `font-style=` — which is not CSS and which `style-src` has no
//      say over, then deletes the CSS that carried it.
//
// Flattening is done by the browser rather than by parsing mermaid's stylesheet, because
// the only thing that reliably knows what an element ended up looking like is the engine
// that laid it out. Nothing of mermaid's is matched or reimplemented, so a mermaid upgrade
// changes the input to this, never its correctness.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const require_ = createRequire(import.meta.url);

const MERMAID_DIR = join(root, 'scripts', 'mermaid');
const MERMAID_BUNDLE = join(MERMAID_DIR, 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');
const FLATTEN_SOURCE = join(here, 'mermaid-flatten.js');

/**
 * The four palettes the corpus hard-codes. Each is a light fill written for a white page,
 * and this site is near-black — so the surface becomes the site's own and the hue the
 * author chose is kept as the border, which is what carries the meaning (a generator, a
 * drawn value, a refusal, a caution). Values are the design tokens, read from
 * packages/design-tokens/tokens.css.
 *
 * This is presentation, not content: §7.5 forbids correcting what the library WROTE, and
 * a colour chosen for a white background is not a defect in the prose. A palette the map
 * does not know stops the run rather than shipping an unreadable diagram.
 */
const PALETTE = {
    'fill:#e8eaf6,stroke:#3f51b5,color:#1a237e': 'fill:#1E2126,stroke:#C7B8FF,color:#F4F2ED',
    'fill:#e8f5e9,stroke:#43a047,color:#1b5e20': 'fill:#1E2126,stroke:#7FD3C1,color:#F4F2ED',
    'fill:#ffebee,stroke:#e53935,color:#b71c1c': 'fill:#1E2126,stroke:#F2836B,color:#F4F2ED',
    'fill:#fff8e1,stroke:#f9a825,color:#e65100': 'fill:#1E2126,stroke:#FFB86B,color:#F4F2ED',
};

const TOKEN_COLOURS = /#(1E2126|C7B8FF|7FD3C1|F2836B|FFB86B|F4F2ED)/i;

/** `<br/>` and `<i>` are HTML, and HTML labels are the one form that cannot be flattened.
 *  mermaid's markdown-string form — a backtick-quoted label — says both in a form the SVG
 *  text renderer understands and emits as a `font-style` attribute. */
function rewriteLabels(source, refuse) {
    return source.replace(/"([^"]*)"/g, (whole, label) => {
        if (!/<br\s*\/?>|<\/?(i|b|em|strong)>/.test(label)) {
            return whole;
        }

        const rewritten = label
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<i>(.*?)<\/i>/g, '*$1*')
            .replace(/<em>(.*?)<\/em>/g, '*$1*')
            .replace(/<b>(.*?)<\/b>/g, '**$1**')
            .replace(/<strong>(.*?)<\/strong>/g, '**$1**');

        // Markup this rewrite does not know would ship as literal angle brackets inside a
        // diagram. Refuse instead, the same discipline the rest of this generator applies.
        if (/<[^>]+>/.test(rewritten)) {
            refuse(`a diagram label carries markup this renderer does not handle: ${label}`);
        }

        return `"\`${rewritten}\`"`;
    });
}

function rewritePalette(source, refuse) {
    let out = source;

    for (const [light, dark] of Object.entries(PALETTE)) {
        out = out.split(light).join(dark);
    }

    for (const line of out.match(/style\s+\S+\s+(fill|stroke|color):[^\n]*/g) ?? []) {
        if (!TOKEN_COLOURS.test(line)) {
            refuse(`a diagram sets a colour this renderer has no dark equivalent for: ${line.trim()}`);
        }
    }

    return out;
}

/**
 * mermaid's own accessibility directives, which emit `<title>`/`<desc>` and wire
 * `aria-labelledby`/`aria-describedby` onto the root. The corpus carries neither, and this
 * site may not invent prose for it (§7.5) — so the name is DERIVED rather than written:
 * the section the diagram sits under, which is a fact of the document. Reported upstream
 * as Reefact/just-dummies#120 so the real thing can come from the author.
 */
function withAccessibleName(source, name) {
    const lines = source.split('\n');

    lines.splice(1, 0, `    accTitle: ${name.replace(/[\n:]/g, ' ')}`);

    return lines.join('\n');
}

/**
 * mermaid, fetched if it is not already here.
 *
 * WHY THIS INSTALLS RATHER THAN TELLING SOMEBODY TO. `scripts/mermaid/node_modules` is
 * gitignored and every environment this repository is worked in is a fresh checkout, so
 * "install it once" is not once — it is once per machine, per container, per clone, and it
 * lands on whoever happens to be refreshing the mirror at the time. A prerequisite that has
 * to be remembered is a prerequisite that will be forgotten, and the symptom is a refusal
 * in the middle of a regeneration rather than anything a reader of this file would predict.
 *
 * It is a narrow thing to do automatically and stays narrow: `npm ci` installs exactly what
 * `scripts/mermaid/package-lock.json` pins — no resolution, no drift, nothing new decided
 * here — into a directory outside the pnpm workspace that nothing else reads. It runs only
 * once a diagram has actually been met, so a corpus with no fences never pays for it, and
 * CI never reaches this path at all: the SVG it produces is committed.
 *
 * It says what it is doing. An 84 MB download that happens in silence is worse than one
 * that announces itself, and the manual command stays in the failure message for the case
 * this cannot help with — no network, no npm.
 */
function installMermaidIfMissing(refuse) {
    if (existsSync(MERMAID_BUNDLE)) {
        return;
    }

    console.log('  mermaid is not installed here — fetching it (npm ci, scripts/mermaid, once per checkout)…');

    try {
        execFileSync('npm', ['ci', '--prefix', MERMAID_DIR, '--no-audit', '--no-fund'], {
            stdio: ['ignore', 'ignore', 'pipe'],
        });
    } catch (cause) {
        refuse(
            `mermaid could not be installed, and the mirror carries diagrams that need it: ${cause.stderr?.toString().trim() || cause.message}. ` +
                'Install it by hand with `npm ci --prefix scripts/mermaid` — it sits outside the pnpm workspace on purpose, ' +
                'so that CI never resolves it (see scripts/mermaid/package.json).',
        );
    }

    if (!existsSync(MERMAID_BUNDLE)) {
        refuse(`npm reported success but ${MERMAID_BUNDLE} is still not there.`);
    }
}

function resolveChromium(refuse) {
    if (process.env.JD_CHROMIUM !== undefined) {
        return process.env.JD_CHROMIUM;
    }

    const { chromium } = require_(join(root, 'node_modules', '@playwright', 'test'));
    const resolved = chromium.executablePath();

    if (existsSync(resolved)) {
        return resolved;
    }

    refuse(
        `Playwright names ${resolved} as its Chromium and there is nothing there. ` +
            'Run `pnpm exec playwright install chromium`, or point JD_CHROMIUM at a Chromium binary.',
    );
}

/**
 * Opens one browser for the whole run and hands back a renderer over it, because starting
 * Chromium costs about a second and the corpus holds eighteen diagrams.
 *
 * `render(code, { name, id })` answers with ready-to-embed SVG markup.
 */
export async function mermaidRenderer({ refuse }) {
    installMermaidIfMissing(refuse);

    const { chromium } = require_(join(root, 'node_modules', '@playwright', 'test'));
    const browser = await chromium.launch({ executablePath: resolveChromium(refuse) });
    const page = await browser.newPage();

    await page.setContent('<!doctype html><html><body></body></html>');
    await page.addScriptTag({ path: MERMAID_BUNDLE });

    const flattenSource = readFileSync(FLATTEN_SOURCE, 'utf8');

    return {
        async render(code, { name, id }) {
            const prepared = withAccessibleName(rewritePalette(rewriteLabels(code, refuse), refuse), name);

            const result = await page.evaluate(
                async ({ source, elementId, flatten }) => {
                    const host = document.createElement('div');

                    document.body.append(host);

                    // eslint-disable-next-line no-undef
                    window.mermaid.initialize({
                        startOnLoad: false,
                        htmlLabels: false,
                        flowchart: { htmlLabels: false },
                        markdownAutoWrap: false,
                        securityLevel: 'strict',
                        theme: 'base',
                        deterministicIds: true,
                        deterministicIDSeed: elementId,
                    });

                    // eslint-disable-next-line no-undef
                    const { svg } = await window.mermaid.render(elementId, source);

                    host.innerHTML = svg;

                    const flattenFn = new Function(`${flatten}; return flattenSvg;`)();
                    const report = flattenFn(host.querySelector('svg'));

                    host.remove();

                    return report;
                },
                { source: prepared, elementId: id, flatten: flattenSource },
            );

            // A property the flattener could not turn into an attribute is a style that
            // silently stops applying — the one failure this approach must not have.
            if (result.unconverted.length > 0) {
                refuse(`diagram "${name}" uses CSS with no presentation-attribute form: ${result.unconverted.join(', ')}`);
            }

            return result.svg;
        },

        async close() {
            await browser.close();
        },
    };
}
