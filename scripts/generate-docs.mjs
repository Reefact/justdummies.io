// Snapshot the library's own handwritten user documentation into
// apps/site/src/content/docs/, one Markdown file per topic and locale.
//
// WHAT IT READS is `doc/handwritten/for-users/<section>/<slug>.<en|fr>.md` in
// Reefact/just-dummies (`section` one of guides, generators, packages, analyzers) — the
// library's own prose for the people who use it, as opposed to `for-maintainers/`, which
// is not this site's concern. specification.md §7.5 fixes that the site does not write
// this content, only reproduces it.
//
// AT ONE TAG PER SECTION, not the library's single newest tag the way
// generate-release-notes.mjs pins: guides, generators and analyzers travel with the `lib`
// train (analyzers ship bundled inside JustDummies — tools/trains.sh), and each package
// page pins to its own train's newest tag, because a page documenting
// JustDummies.Cli should not move when only the library ships a release. ADR-0013 requires
// a pin; ADR-0026 records this per-section choice.
//
// THE TWO LANGUAGES ARE ONE DOCUMENT. §6.4 applies to this content in full (§7.5 says so
// explicitly) — a topic missing from either locale, or whose title cannot be read, stops
// the snapshot rather than publishing a page half-translated.
//
// IT IS NOT A MARKDOWN PARSER, same discipline as scripts/lib/release-notes-markdown.mjs
// and for the same reason (§13): the body is handed to Astro's own Markdown pipeline
// unparsed. What this script does is the part Astro cannot do for content that used to
// live in another repository — cut the parts that only made sense as a file in a folder
// (the H1, the per-file language switcher, the "back to README" footer) and rewrite every
// link that pointed at a sibling file into the route that file now has here, or into a
// pinned GitHub blob URL for anything this site does not mirror.
//
// Run it, read the diff, commit it:
//
//   node scripts/generate-docs.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mermaidRenderer } from './lib/mermaid-render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'apps', 'site', 'src', 'content', 'docs');

const REPOSITORY = 'Reefact/just-dummies';
const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
const DOC_ROOT = 'doc/handwritten/for-users';

const LOCALES = ['en', 'fr'];

function refuse(message) {
    throw new Error(`generate-docs: ${message}`);
}

/** One train per tag prefix — tools/trains.sh in the library. */
const TRAIN_TAG_PREFIX = {
    lib: 'lib-v',
    xunit: 'xunit-v',
    cli: 'cli-v',
    catalog: 'catalog-v',
};

/**
 * Every topic this site mirrors: which section it renders under, which train pins the tag
 * it is read at, and its position in the section's own reading order — the order the
 * library's own README files for these sections already read in, not alphabetical.
 */
const TOPICS = [
    ...['getting-started', 'core-concepts', 'design-principles', 'composition', 'reproducibility', 'errors-and-conflicts', 'inspecting-a-pool', 'faq'].map((slug, order) => ({
        section: 'guides',
        slug,
        train: 'lib',
        order,
    })),
    ...['numbers', 'strings', 'dates-and-times', 'collections', 'enums-and-choices', 'guids-and-uris'].map((slug, order) => ({
        section: 'generators',
        slug,
        train: 'lib',
        order,
    })),
    { section: 'packages', slug: 'justdummies', train: 'lib', order: 0 },
    { section: 'packages', slug: 'justdummies-xunit', train: 'xunit', order: 1 },
    { section: 'packages', slug: 'justdummies-diagnosticcatalog', train: 'catalog', order: 2 },
    { section: 'packages', slug: 'justdummies-cli', train: 'cli', order: 3 },
    ...Array.from({ length: 33 }, (_, index) => index + 1).map((n) => ({
        section: 'analyzers',
        slug: `JD${String(n).padStart(3, '0')}`,
        train: 'lib',
        order: n - 1,
    })),
];

/** Every tag the library carries, newest first, grouped by train. Mirrors the tag-listing
 *  half of generate-release-notes.mjs; unlike it, this keeps the whole list per train
 *  rather than only the newest, because a train's newest tag can predate a documentation
 *  restructure on `for-users/` — see fetchTopic below. */
function readTagsPerTrain() {
    const workspace = mkdtempSync(join(tmpdir(), 'just-dummies-tags-'));

    try {
        const git = (...args) => execFileSync('git', ['-C', workspace, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

        execFileSync('git', ['init', '-q', workspace], { stdio: ['ignore', 'pipe', 'pipe'] });
        git('remote', 'add', 'origin', `${REPOSITORY_URL}.git`);
        git('fetch', '-q', '--depth', '1', '--filter=blob:none', '--no-tags', 'origin', 'refs/tags/*:refs/tags/*');

        const listing = git('for-each-ref', '--sort=-creatordate', '--format=%(creatordate:iso-strict)\t%(refname:short)', 'refs/tags');
        const tags = listing
            .split('\n')
            .filter((line) => line.trim() !== '')
            .map((line) => {
                const [date, name] = line.split('\t');

                return { name, date };
            });

        const byTrain = {};

        for (const [train, prefix] of Object.entries(TRAIN_TAG_PREFIX)) {
            const trainTags = tags.filter((candidate) => candidate.name.startsWith(prefix));

            if (trainTags.length === 0) {
                refuse(`no ${prefix}* tag exists, so the ${train} train has published nothing to pin this snapshot to`);
            }

            byTrain[train] = trainTags;
        }

        // WHAT FAILS WHEN THIS SNAPSHOT SILENTLY STOPS BEING THE CORPUS.
        //
        // `TOPICS` above is a hand-written membership list, and nothing about fetching 51
        // known paths can notice a 52nd. Left alone, the library adding
        // `analyzers/JD034.{en,fr}.md` produces a clean run, an empty diff and a `/docs`
        // that is quietly one rule short — the failure mode with no symptom, which is the
        // one this repository asks a decision to come with a check against.
        //
        // `--filter=blob:none` brought the trees but none of their contents, so listing the
        // corpus is free here and needs no second clone: `ls-tree` reads names.
        const corpus = git('ls-tree', '-r', '--name-only', byTrain.lib[0].name, '--', `${DOC_ROOT}/`)
            .split('\n')
            .filter((path) => /\/[^/]+\.(en|fr)\.md$/.test(path) || /\/README(\.(en|fr))?\.md$/.test(path));

        const named = new Set(TOPICS.map((topic) => `${topic.section}/${topic.slug}`));
        const strayed = [
            ...new Set(
                corpus
                    .map((path) => path.slice(DOC_ROOT.length + 1).replace(/\.(en|fr)\.md$/, '').replace(/\.md$/, ''))
                    // A section README is the site's own index page, written here, never mirrored;
                    // anything at the corpus root (its own README, CONTRIBUTING, SECURITY) likewise.
                    .filter((topic) => !topic.endsWith('/README') && topic.includes('/'))
                    .filter((topic) => !named.has(topic)),
            ),
        ];

        if (strayed.length > 0) {
            refuse(
                `${byTrain.lib[0].name} carries ${strayed.length} topic(s) this snapshot does not name: ${strayed.join(', ')}. ` +
                    'Add them to TOPICS (and to apps/site/src/docsNav.ts, which the routes are read from) or this mirror is not the corpus.',
            );
        }

        return byTrain;
    } finally {
        rmSync(workspace, { recursive: true, force: true });
    }
}

async function fetchAt(path, ref) {
    const url = `https://raw.githubusercontent.com/${REPOSITORY}/${ref}/${path}`;
    const response = await fetch(url);

    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        refuse(`${url} answered ${response.status}`);
    }

    return await response.text();
}

/**
 * The newest tag of the topic's own train that actually carries this file — not simply the
 * train's newest tag. A train's tag pins a *package* release, not a documentation change:
 * `for-users/` moves on its own schedule, so the newest xunit-v* tag can predate a topic
 * added to `for-users/packages/` afterwards. Searching newest-first still never reaches
 * past a published tag onto a moving branch (ADR-0013's rule), it just finds the most
 * recent one where the file in question was already there.
 *
 * FALLING BACK ACROSS TRAINS is the second half of that same search, for the case that
 * search alone cannot cover: a train that has published only once, before the topic was
 * even written — `xunit-v1.0.0-preview.1` predates `packages/justdummies-xunit.md`
 * entirely, and no newer xunit tag exists to search instead. `doc/handwritten/` is one
 * tree shared by the whole (monorepo) library, so any train's tag names a real, published
 * commit that carries it just as validly; this reaches for the chronologically newest one
 * across every train rather than only the topic's own, still never a branch.
 */
async function fetchTopic(topic, locale, trainTags, allTagsNewestFirst) {
    const path = `${DOC_ROOT}/${topic.section}/${topic.slug}.${locale}.md`;

    for (const tag of trainTags) {
        const markdown = await fetchAt(path, tag.name);

        if (markdown !== null) {
            return { path, markdown, ref: tag.name };
        }
    }

    for (const tag of allTagsNewestFirst) {
        const markdown = await fetchAt(path, tag.name);

        if (markdown !== null) {
            console.log(`  ${path}: no ${topic.train} tag carries it yet — pinned to ${tag.name} instead`);

            return { path, markdown, ref: tag.name };
        }
    }

    refuse(`${path} does not exist at any published tag`);
}

/**
 * The H1 and the per-file language switcher paragraph right under it — both meaningless
 * once the file is a page reached through a locale-aware route rather than opened from a
 * file listing next to its own translation.
 */
function extractTitleAndBody(markdown, sourcePath) {
    const lines = markdown.split('\n');

    if (!lines[0]?.startsWith('# ')) {
        refuse(`${sourcePath} does not open on a level-1 heading`);
    }

    // The title is used as PLAIN TEXT everywhere it lands — the page's h2, the sidebar
    // label, the <title>, the meta description — none of which renders Markdown. Four of
    // the package pages open on a code-span heading (`# \`JustDummies.Cli\``), which
    // reached all four of those places with its backticks intact. Only the inline forms
    // this corpus actually uses in a heading are unwrapped, and nothing else is touched:
    // a heading is one line of prose, not a document to parse (§13).
    const title = lines[0]
        .slice(2)
        .trim()
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1');
    let index = 1;

    while (index < lines.length && lines[index].trim() === '') {
        index += 1;
    }

    if (lines[index]?.includes('🌍')) {
        while (index < lines.length && lines[index].trim() !== '') {
            index += 1;
        }
        while (index < lines.length && lines[index].trim() === '') {
            index += 1;
        }
    }

    return { title, body: lines.slice(index).join('\n') };
}

/** The trailing `---` / `[← …](…) · […]` footer nav — this site draws its own. */
function stripFooterNav(markdown) {
    return markdown.replace(/\n+---\n+\[←[^\n]*\]\([^)]*\)(?:\s*·\s*\[[^\]]*\]\([^)]*\))*\s*$/, '\n');
}

const LINK = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

/**
 * Every relative link a topic carries, rewritten to the route its target now has under
 * `/docs`, or to a pinned GitHub blob URL for anything outside `for-users/` — an ADR, the
 * repository README, the analyzer release-tracking file — which this site does not mirror.
 * Absolute links and in-page anchors pass through untouched.
 */
function rewriteLinks(markdown, { fromDir, locale, ref }) {
    return markdown.replace(LINK, (whole, text, href) => {
        if (/^([a-z][a-z0-9+.-]*:|#)/i.test(href)) {
            return whole;
        }

        const [hrefPath, fragment] = href.split('#');
        const resolved = posix.normalize(posix.join(DOC_ROOT, fromDir, hrefPath));
        const prefix = locale === 'en' ? '' : '/fr';
        const anchor = fragment !== undefined ? `#${fragment}` : '';

        if (resolved.startsWith(`${DOC_ROOT}/`)) {
            const rest = resolved.slice(DOC_ROOT.length + 1);

            // `README.md` AND `README.fr.md` alike. The corpus names its English index
            // unsuffixed and its French one `README.fr.md`, so matching only the first form
            // let every French index link fall through to the topic matcher below, which
            // read `README` as a topic slug and emitted `/fr/docs/analyzers/README/` — four
            // links to routes that do not exist. The suffix is optional, never required.
            if (/^README(\.(en|fr))?\.md$/.test(rest)) {
                return `[${text}](${prefix}/docs/${anchor})`;
            }

            const sectionReadme = /^([a-z-]+)\/README(?:\.(?:en|fr))?\.md$/.exec(rest);

            if (sectionReadme !== null) {
                return `[${text}](${prefix}/docs/${sectionReadme[1]}/${anchor})`;
            }

            const topicFile = /^([a-z-]+)\/([A-Za-z0-9._-]+)\.(en|fr)\.md$/.exec(rest);

            if (topicFile !== null) {
                return `[${text}](${prefix}/docs/${topicFile[1]}/${topicFile[2]}/${anchor})`;
            }

            refuse(`${fromDir}: cannot resolve link target ${href} (resolves to ${rest} under ${DOC_ROOT})`);
        }

        return `[${text}](${REPOSITORY_URL}/blob/${ref}/${resolved}${anchor})`;
    });
}

const MERMAID_FENCE = /^```mermaid[ \t]*\n([\s\S]*?)^```[ \t]*$/gm;

/**
 * Every ```mermaid fence, replaced by the diagram it describes.
 *
 * The SVG is emitted inline rather than as a file behind `<img>`: inline text is
 * selectable and searchable, it carries the site's own colours rather than a second copy
 * of them, and it costs no request. `scripts/lib/mermaid-render.mjs` is what makes that
 * survivable under `style-src 'self'`.
 *
 * The accessible name is derived from the heading the diagram sits under, because the
 * upstream fences declare none and this site does not write prose for mirrored content
 * (§7.5). A fence before any heading falls back to the topic's own title.
 */
async function renderDiagrams(markdown, { renderer, topicTitle, slug, locale }) {
    const fences = [...markdown.matchAll(MERMAID_FENCE)];

    if (fences.length === 0) {
        return { markdown, count: 0 };
    }

    let out = markdown;
    const draw = await renderer();

    // Replaced last-first, so an earlier replacement cannot move a later fence's offsets.
    for (const [position, fence] of [...fences.entries()].reverse()) {
        const before = markdown.slice(0, fence.index);
        const headings = [...before.matchAll(/^#{2,6}[ \t]+(.+?)[ \t]*$/gm)];
        const section = headings.length > 0 ? headings[headings.length - 1][1] : topicTitle;
        const svg = await draw.render(fence[1], {
            name: section.replace(/[`*_]/g, ''),
            id: `jd-${locale}-${slug}-${position}`.replace(/[^A-Za-z0-9-]/g, '-'),
        });

        // A blank line each side: this is raw HTML in Markdown, and without them the
        // renderer folds it into an adjacent paragraph.
        out = `${out.slice(0, fence.index)}\n${svg}\n${out.slice(fence.index + fence[0].length)}`;
    }

    return { markdown: out, count: fences.length };
}

const tagsByTrain = readTagsPerTrain();
const allTagsNewestFirst = Object.values(tagsByTrain)
    .flat()
    .sort((left, right) => right.date.localeCompare(left.date));

for (const [train, tags] of Object.entries(tagsByTrain)) {
    console.log(`  ${train.padEnd(8)} ${tags[0].name}  (${tags[0].date})`);
}

rmSync(destination, { recursive: true, force: true });

// Opened on the first diagram met and not before: a corpus with no fences must not need
// mermaid installed, and starting Chromium costs about a second.
let renderer = null;
let diagramCount = 0;

async function diagramRenderer() {
    renderer ??= await mermaidRenderer({ refuse });

    return renderer;
}

for (const topic of TOPICS) {
    const trainTags = tagsByTrain[topic.train];
    // English decides the ref this topic pins to; French is then read at that exact same
    // ref, never a newer or older one — the two languages are one document (§6.4).
    const english = await fetchTopic(topic, 'en', trainTags, allTagsNewestFirst);
    const ref = english.ref;
    const frenchMarkdown = await fetchAt(`${DOC_ROOT}/${topic.section}/${topic.slug}.fr.md`, ref);

    if (frenchMarkdown === null) {
        refuse(`${DOC_ROOT}/${topic.section}/${topic.slug}.fr.md does not exist at ${ref}, though its English twin does`);
    }

    const perLocale = {
        en: { path: english.path, markdown: english.markdown },
        fr: { path: `${DOC_ROOT}/${topic.section}/${topic.slug}.fr.md`, markdown: frenchMarkdown },
    };

    for (const locale of LOCALES) {
        const { path, markdown } = perLocale[locale];
        const { title, body } = extractTitleAndBody(markdown, path);
        const withoutFooter = stripFooterNav(body);
        const rewritten = rewriteLinks(withoutFooter, { fromDir: topic.section, locale, ref });
        const drawn = await renderDiagrams(rewritten, {
            // A function, not a renderer: `renderDiagrams` calls it only once it has found
            // a fence, which is what keeps mermaid unneeded by a corpus that has none.
            renderer: diagramRenderer,
            topicTitle: title,
            slug: topic.slug,
            locale,
        });

        diagramCount += drawn.count;

        perLocale[locale] = { path, title, body: drawn.markdown.trim() };
    }

    // A page whose title exists only in one language is exactly the half-translated page
    // §6.4 exists to prevent, and it is invisible to anything that renders one locale at a
    // time — so it stops here, where both files are still in hand.
    if ((perLocale.en.title === '') !== (perLocale.fr.title === '')) {
        refuse(`${perLocale.en.path} and ${perLocale.fr.path} disagree on whether a title exists`);
    }

    for (const locale of LOCALES) {
        const { path, title, body } = perLocale[locale];
        const sectionDir = join(destination, locale, topic.section);

        mkdirSync(sectionDir, { recursive: true });

        const frontmatter = {
            title,
            section: topic.section,
            slug: topic.slug,
            order: topic.order,
            locale,
            sourcePath: path,
            sourceUrl: `${REPOSITORY_URL}/blob/${ref}/${path}`,
            ref,
        };
        const yaml = Object.entries(frontmatter)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n');

        writeFileSync(join(sectionDir, `${topic.slug}.md`), `---\n${yaml}\n---\n\n${body}\n`);
    }
}

await renderer?.close();

console.log(`  apps/site/src/content/docs/  (${TOPICS.length} topics × ${LOCALES.length} locales, ${diagramCount} diagram(s))`);
