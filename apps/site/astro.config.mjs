// @ts-check
import { defineConfig } from 'astro/config';

import { useTranslations } from './src/i18n/ui.ts';
import { highlight } from './src/highlight.ts';

/** Where this site is published — `site` below. A mirrored link to one of its own pages
 *  is not a link away from it, and must not be dressed as one. */
const SITE_ORIGIN = 'https://justdummies.io';

/**
 * What the corpus's fences call a language, in the terms `src/highlight.ts` reasons about.
 * A fence whose language is absent here is left uncoloured rather than guessed at — `ini`,
 * `json` and `xml` between them are 14 of the corpus's 392 fences, and a tokeniser applied
 * to a grammar it was not written for publishes code nobody wrote.
 */
const HIGHLIGHTED = { csharp: 'csharp', bash: 'shell', text: 'output' };

/**
 * The mirrored code blocks, coloured by the site's OWN highlighter.
 *
 * Astro's Markdown pipeline colours with Shiki, and Shiki writes `style="color:#…"` on
 * every span — which `style-src 'self'` drops, leaving code in one flat colour: the failure
 * that looks exactly like nothing having been attempted. `src/highlight.ts` exists because
 * this site already met that problem and answered it, emitting `.tok-*` classes that
 * `base.css` colours from the design tokens. Those classes are declared globally there,
 * deliberately, so nothing further is needed to make them apply here.
 *
 * So `syntaxHighlight: false` below is not a decision to publish uncoloured code — it turns
 * Shiki off so that this can do the same job the rest of the site already does, with no
 * dependency and no CSS in the document.
 *
 * `highlight()` verifies itself: it strips its own markup back off and throws unless the
 * result is the input character for character. On this corpus that guarantee is worth more
 * than on the thirteen hand-written snippets it was built for — these 392 fences are the
 * library's, not this repository's, and a highlighter that dropped a character would be
 * publishing code a reader is invited to paste.
 */
function rehypeColourCodeBlocks() {
    /** @param {any} tree */
    return function transform(tree) {
        /** @param {any} node */
        function walk(node) {
            if (node === null || typeof node !== 'object') {
                return;
            }

            if (node.type === 'element' && node.tagName === 'pre') {
                const code = (node.children ?? []).find((child) => child.type === 'element' && child.tagName === 'code');
                const className = code?.properties?.className ?? [];
                const named = className.map(String).find((name) => name.startsWith('language-'));
                const language = HIGHLIGHTED[named?.slice('language-'.length)];

                if (language !== undefined && code.children?.length === 1 && code.children[0].type === 'text') {
                    code.children = [{ type: 'raw', value: highlight(code.children[0].value, language) }];

                    return;
                }
            }

            if (Array.isArray(node.children)) {
                node.children.forEach(walk);
            }
        }

        walk(tree);
    };
}

/**
 * A link in mirrored prose that leaves this site opens in a new tab, carries `rel=noopener`,
 * and SAYS SO.
 *
 * The rule is the site's, not this section's: `tests/browser/release-notes.spec.ts` already
 * enforces all three on the other corpus this repository mirrors, and `ReleaseCard.astro`
 * pairs a generator that emits the attributes with a component that adds the words. That
 * split exists because the generator has no locale. This one does — the frontmatter
 * `scripts/generate-docs.mjs` writes carries it — so both halves happen here, and the words
 * are still the site's own, read from `i18n/ui.ts` rather than spelled out again (§7.6).
 *
 * "Leaves this site", not "starts with http": a mirrored page may name one of this site's
 * own addresses in full, and sending that off in a new tab would announce a departure that
 * never happens. Same distinction release-notes.spec.ts draws, and for the same reason.
 */
function rehypeAnnounceOutboundLinks() {
    /**
     * @param {any} tree
     * @param {any} file
     */
    return function transform(tree, file) {
        const locale = file?.data?.astro?.frontmatter?.locale === 'fr' ? 'fr' : 'en';
        const note = useTranslations(locale)('state.newTab');

        /** @param {any} node */
        function walk(node) {
            if (node !== null && typeof node === 'object') {
                const href = node.type === 'element' && node.tagName === 'a' ? node.properties?.href : undefined;

                if (typeof href === 'string' && /^https?:\/\//.test(href) && href !== SITE_ORIGIN && !href.startsWith(`${SITE_ORIGIN}/`)) {
                    node.properties = { ...node.properties, target: '_blank', rel: ['noopener', 'noreferrer'] };
                    node.children = [
                        ...(node.children ?? []),
                        {
                            type: 'element',
                            tagName: 'span',
                            properties: { className: ['visually-hidden'] },
                            children: [{ type: 'text', value: ` ${note}` }],
                        },
                    ];

                    // Not walked into: the span just added is the only child that could match
                    // again, and an anchor cannot nest another anchor.
                    return;
                }

                if (Array.isArray(node.children)) {
                    node.children.forEach(walk);
                }
            }
        }

        walk(tree);
    };
}

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
        rehypePlugins: [rehypeMakeCodeBlocksFocusable, rehypeAnnounceOutboundLinks, rehypeColourCodeBlocks],
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
