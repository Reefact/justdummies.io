// @ts-check
import { defineConfig } from 'astro/config';

/**
 * A fenced code block renders as `<pre>` with `overflow-x: auto` (`DocsTopicBody.astro`), so
 * a line wider than the column is reachable only by scrolling it — and axe's
 * `scrollable-region-focusable` rule is right that nothing makes that region reachable by
 * keyboard on its own. `tabindex="0"` here is the fix the rule itself names, set at build
 * time so it holds with no script.
 */
function rehypeMakeCodeBlocksFocusable() {
    /** @param {any} tree */
    return function transform(tree) {
        /** @param {any} node */
        function walk(node) {
            if (node !== null && typeof node === 'object') {
                if (node.type === 'element' && node.tagName === 'pre') {
                    node.properties = { ...node.properties, tabIndex: 0 };
                }
                if (Array.isArray(node.children)) {
                    node.children.forEach(walk);
                }
            }
        }

        walk(tree);
    };
}

export default defineConfig({
    site: 'https://justdummies.io',

    // /docs (ADR-0026) is the only place this site renders Markdown as content — every
    // other page is .astro. Shiki's default output colours tokens with inline `style`
    // attributes, which the site's own CSP forbids: `style-src 'self'` carries no
    // 'unsafe-inline' and, unlike script-src, generate-headers.mjs hashes no styles to
    // cover one either — the policy is kept clean today solely by never emitting an
    // inline style anywhere on the site. So syntax highlighting is off rather than
    // shipped broken; `DocsTopicBody.astro` styles `pre`/`code` plainly with the site's
    // own design tokens instead. Turning it back on is a CSP change, not a Markdown one.
    markdown: {
        syntaxHighlight: false,
        // An empty array still switches Markdown rendering onto @astrojs/markdown-remark's
        // older `unified` pipeline rather than Astro's newer default processor — deliberate,
        // not incidental. That default renders GFM table alignment (`:---:`) as
        // `style="text-align: …"` on `<th>`/`<td>`, which the site's CSP forbids the same
        // way it forbids Shiki's inline colours above: `style-src 'self'` carries no
        // 'unsafe-inline'. This pipeline emits the older `align="…"` attribute instead — a
        // presentational HTML attribute browsers still honour, and one CSP's style-src has
        // no say over because it is not CSS.
        rehypePlugins: [rehypeMakeCodeBlocksFocusable],
    },

    i18n: {
        defaultLocale: 'en',
        locales: ['en', 'fr'],
        routing: {
            // English is served at the root, unprefixed. `/fr/` carries the French.
            prefixDefaultLocale: false,
            // No automatic redirection: it breaks shared links and previews, and it
            // stops a French reader from deliberately reading the English page. The
            // language selector is explicit, and it is the only thing that moves a
            // visitor between locales.
            redirectToDefaultLocale: false,
        },
    },

    // The whole deployment is one static directory at the repository root, and the
    // published playground is copied into it under /playground/ afterwards
    // (scripts/build-site.sh). Building straight into it keeps the two halves from
    // ever being assembled in two different places.
    outDir: '../../dist',

    // Directory format writes /tooling/index.html rather than /tooling.html, so a
    // reader given either spelling of the address lands on the page.
    //
    // NOT "alike", which is what this comment claimed until somebody measured it. The
    // host redirects one spelling to the other: on the deployment, /version answers
    // 307 with `location: /version/`, and /version/ answers 200. No setting serves
    // both directly — Cloudflare's `html_handling` picks which spelling is the real
    // one, and its default sends the bare form to the slashed one. That is the right
    // way round here, because the slashed form is what /, /fr/ and /playground/
    // already use.
    //
    // Two consequences, worth knowing rather than rediscovering. The redirect is
    // temporary and carries no cache header, so the extra hop happens on every visit
    // to the bare form rather than only the first. And anything that does not follow
    // redirects — a monitor, a link checker, `curl` without -L — sees an empty 307
    // instead of the page.
    build: {
        format: 'directory',

        // Astro inlines small stylesheets into the document by default. Every one it
        // inlines is an inline <style>, and an inline <style> forces the Content
        // Security Policy to allow 'unsafe-inline' for styles — which disables the
        // protection for every stylesheet on the site, to save one request. Emitting
        // stylesheets as files keeps style-src at 'self'. scripts/verify-output.sh
        // asserts the result rather than trusting this setting.
        inlineStylesheets: 'never',
    },

    vite: {
        build: {
            // Same reasoning as inlineStylesheets, applied to everything else Astro
            // would fold into the document to save a request. An inlined script needs
            // its own hash in the policy, recomputed whenever its content changes; an
            // emitted file is covered by `script-src 'self'`, is cacheable, and is
            // counted by the size budget — an inlined one weighs nothing on paper and
            // is downloaded on every page view.
            assetsInlineLimit: 0,
        },
    },
});
