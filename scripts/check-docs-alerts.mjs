#!/usr/bin/env node
/**
 * The alert transform, run over trees written by hand.
 *
 * WHY THIS EXISTS. `apps/site/src/docs-alerts.mjs` implements a rule with cases no page in the
 * corpus reaches: the mirror uses the notation once, at the top level of one guide, while the
 * rule is about everywhere else too — a `> [!NOTE]` indented under a list item, which GitHub
 * renders as a blockquote with its marker showing and this site renders as the alert its author
 * meant. Nothing downstream can catch a mistake there: `verify-output.sh` reads the artefact,
 * and an alert converted where it should not have been leaves no marker behind to find. It
 * looks exactly like a correct one.
 *
 * WHY HERE AND NOT IN THE BROWSER SUITE. `tests/browser/` renders `dist/`, and `dist/` holds
 * the corpus — which is generated from the library and cannot be given a fixture page without
 * writing prose this repository does not write (§7.5). The transform is a pure function of a
 * tree, so it is checked as one.
 *
 * `scripts/build-site.sh` runs it, so it fails `pnpm build` and every CI job that builds.
 *
 *   node scripts/check-docs-alerts.mjs
 */
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { ALERT_KINDS, renderGithubAlerts } = await import(join(root, 'apps', 'site', 'src', 'docs-alerts.mjs'));

/** The five, as one locale would supply them. */
const LABELS = Object.fromEntries(ALERT_KINDS.map((kind) => [kind, `«${kind}»`]));

const text = (value) => ({ type: 'text', value });
const el = (tagName, children) => ({ type: 'element', tagName, properties: {}, children });
/** A document root, with the newlines the Markdown pipeline leaves between blocks. */
const doc = (...children) => ({ type: 'root', children: children.flatMap((child) => [text('\n'), child]) });
/** A blockquote opening on `marker`, then prose — the shape `> [!NOTE]\n> text` arrives in. */
const quote = (opening) => el('blockquote', [text('\n'), el('p', [text(opening)]), text('\n')]);

let failures = 0;

function check(what, run) {
    try {
        run();
        console.log(`  ✓ ${what}`);
    } catch (error) {
        console.error(`  ✗ ${what}\n    ${error.message.split('\n')[0]}`);
        failures += 1;
    }
}

console.log('▸ The documentation\'s alert transform');

check('a top-level alert becomes a labelled callout', () => {
    const tree = doc(quote('[!NOTE]\nProperty-based testing is a different kind of test.'));

    renderGithubAlerts(tree, LABELS);

    const converted = tree.children[1];
    assert.equal(converted.tagName, 'div');
    assert.deepEqual(converted.properties.className, ['jd-alert', 'jd-alert--note']);
    assert.equal(converted.children[0].children[0].value, '«note»');
    assert.equal(converted.children[2].children[0].value, 'Property-based testing is a different kind of test.');
});

check('every kind the site names is converted', () => {
    for (const kind of ALERT_KINDS) {
        const tree = doc(quote(`[!${kind.toUpperCase()}]\nSomething.`));

        renderGithubAlerts(tree, LABELS);

        assert.deepEqual(tree.children[1].properties.className, ['jd-alert', `jd-alert--${kind}`], kind);
    }
});

check('a marker alone on its line leaves no empty paragraph', () => {
    const tree = doc(el('blockquote', [text('\n'), el('p', [text('[!TIP]')]), text('\n'), el('p', [text('Something.')]), text('\n')]));

    renderGithubAlerts(tree, LABELS);

    const converted = tree.children[1];
    const paragraphs = converted.children.filter((child) => child.type === 'element');
    assert.equal(paragraphs.length, 2);
    assert.equal(paragraphs[0].children[0].value, '«tip»');
    assert.equal(paragraphs[1].children[0].value, 'Something.');
});

// THE REGRESSION THIS FILE WAS WRITTEN FOR. An alert is one object wherever it was written:
// GitHub renders none under a list item, and this site renders the same callout it renders
// anywhere else — same element, same label, and (in DocsTopicBody.astro) the same width, so a
// reader never meets `[!NOTE]` as leaked markup because its author indented it.
check('an alert written under a list item is still an alert', () => {
    const nested = quote('[!NOTE]\nIndented under a list item.');
    const tree = doc(el('ul', [text('\n'), el('li', [text('item'), text('\n'), nested]), text('\n')]));

    renderGithubAlerts(tree, LABELS);

    assert.equal(nested.tagName, 'div');
    assert.deepEqual(nested.properties.className, ['jd-alert', 'jd-alert--note']);
    assert.equal(nested.children[0].children[0].value, '«note»');
});

check('an alert written inside another blockquote is still an alert', () => {
    const nested = quote('[!WARNING]\nQuoted inside a quote.');
    const tree = doc(el('blockquote', [text('\n'), el('p', [text('Outer.')]), text('\n'), nested]));

    renderGithubAlerts(tree, LABELS);

    assert.equal(nested.tagName, 'div');
    assert.deepEqual(nested.properties.className, ['jd-alert', 'jd-alert--warning']);
    // The blockquote around it is prose, not a marker, and stays what it was.
    assert.equal(tree.children[1].tagName, 'blockquote');
});

check('a kind the site does not name is left alone', () => {
    const tree = doc(quote('[!EXAMPLE]\nA kind GitHub does not know either.'));

    renderGithubAlerts(tree, LABELS);

    assert.equal(tree.children[1].tagName, 'blockquote');
});

check('a marker that is not the blockquote\'s opening is left alone', () => {
    const tree = doc(quote('See [!NOTE] below.'), quote('**A rule, in bold.**'));

    renderGithubAlerts(tree, LABELS);

    assert.equal(tree.children[1].tagName, 'blockquote');
    assert.equal(tree.children[3].tagName, 'blockquote');
});

if (failures > 0) {
    console.error(`check-docs-alerts: ${failures} check(s) failed.`);
    process.exit(1);
}

console.log('▸ An alert is the same object wherever it was written.');
