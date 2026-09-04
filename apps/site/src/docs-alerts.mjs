// @ts-check
/**
 * GitHub's alert notation, applied to the mirrored documentation's hast tree.
 *
 * It lives apart from `astro.config.mjs` for one reason: the rule this implements has a case no
 * page in the corpus exercises today — an alert written under a list item, which GitHub renders
 * as a blockquote with its marker showing and this renders as the callout its author meant —
 * and a rule with an unexercised case needs somewhere to be exercised. `scripts/check-docs-alerts.mjs` imports this and runs it over trees written by
 * hand, which is possible only while the transform depends on nothing but its arguments: no
 * locale, no i18n module, no Astro. The labels arrive already translated.
 */

/** The five kinds GitHub accepts, and nothing else. */
export const ALERT_KINDS = ['note', 'tip', 'important', 'warning', 'caution'];

/** The marker, alone on the blockquote's first line — the only placement GitHub accepts. */
const ALERT_MARKER = /^\[!([A-Za-z]+)\][ \t]*(?:\n|$)/;

/**
 * Every eligible blockquote opening on an alert marker, rewritten into a labelled callout.
 *
 * ELIGIBLE MEANS OPENING ON A MARKER, wherever it sits — deliberately wider than GitHub, whose
 * own rule is that "alerts cannot be nested within other elements". Written under a list item,
 * the notation gets a reader a blockquote with `[!NOTE]` showing in it; an author who writes
 * that meant an alert and made a mistake, and leaked markup is not what a renderer should hand
 * back to them. So the mirror draws one — and draws it at the width every other alert has
 * (`DocsTopicBody.astro`): a callout is one object, and where it was written changes nothing
 * about what it is.
 *
 * That is a passage this site draws and GitHub does not, so it is worth naming what it buys.
 * `verify-output.sh` refuses a marker that reaches a reader as prose, and every remaining way
 * for one to get there — a kind nobody named, this transform ceasing to match — is now this
 * repository's own bug. A rule that also fired on the library's typos would be this build
 * refusing to publish over another repository's markdown, which ADR-0013 already ruled out.
 *
 * @param {any} tree The hast root of one mirrored topic.
 * @param {Record<string, string>} labels The word announcing each kind, in this page's locale.
 *        A kind absent from this map is left untouched, the same as a marker GitHub does not
 *        know: `scripts/verify-output.sh` is what refuses the page it would produce.
 */
export function renderGithubAlerts(tree, labels) {
    /** @param {any} node */
    function walk(node) {
        if (node === null || typeof node !== 'object') {
            return;
        }

        if (node.type === 'element' && node.tagName === 'blockquote') {
            // The first ELEMENT, never `children[0]`: the pipeline keeps its own newlines
            // between them, so a blockquote's children open on a text node of whitespace.
            const paragraph = (node.children ?? []).find(/** @param {any} child */ (child) => child.type === 'element');
            const opening = paragraph?.tagName === 'p' ? paragraph.children?.[0] : undefined;
            const marker = opening?.type === 'text' ? ALERT_MARKER.exec(opening.value) : null;

            // Nested rather than combined into one condition: narrowing `marker` to non-null is
            // what lets `marker[0]` be read below without a cast, and `// @ts-check` above is
            // enforced by `pnpm check` in CI.
            if (marker !== null && marker !== undefined) {
                const kind = marker[1].toLowerCase();

                if (Object.hasOwn(labels, kind)) {
                    opening.value = opening.value.slice(marker[0].length);

                    // A marker on a line of its own leaves an empty paragraph behind it, which is
                    // a blank line nobody typed sitting between the label and the prose.
                    if (paragraph.children.length === 1 && opening.value === '') {
                        node.children = node.children.filter(/** @param {any} child */ (child) => child !== paragraph);
                    }

                    node.tagName = 'div';
                    node.properties = { ...node.properties, className: ['jd-alert', `jd-alert--${kind}`] };
                    node.children = [
                        {
                            type: 'element',
                            tagName: 'p',
                            properties: { className: ['jd-alert-label'] },
                            children: [{ type: 'text', value: labels[kind] }],
                        },
                        ...node.children,
                    ];
                }
            }
        }

        if (Array.isArray(node.children)) {
            node.children.forEach(walk);
        }
    }

    walk(tree);
}
