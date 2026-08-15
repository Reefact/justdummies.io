// Snapshot the library's own CHANGELOG.md files into apps/site/src/generated/release-notes.json.
//
// UNLIKE ITS NEIGHBOURS IN src/generated/, this is not run by build-site.sh and not
// asserted current by CI's "generated content is committed and current" check. Every
// other generator in that set is deterministic from this repository's own commit —
// running it twice on the same HEAD writes the same bytes. This one reads a file that
// moves on Reefact/just-dummies's own schedule, unrelated to this repository's history,
// so the same HEAD can legitimately produce two different snapshots a day apart. Wiring
// that into the mandatory build would make an unrelated PR's CI fail whenever the library
// ships a release between the maintainer's commit and CI's run, or whenever GitHub is
// briefly unreachable — a network dependency the build has never had.
//
// So refreshing this snapshot is a deliberate act, the same way ADR-0001 makes publishing
// this site a deliberate act rather than a side effect of something else. Run it, read the
// diff, commit it:
//
//   node scripts/generate-release-notes.mjs
//
// What it reads is the CHANGELOG.md beside each package — curated, Keep a Changelog
// prose — rather than the GitHub Releases API. The two exist for different readers
// (CONTRIBUTING.md: a release's GitHub notes are drafted from pull request titles); the
// changelog is the one written for someone deciding whether to upgrade, which is this
// page's whole job.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'apps', 'site', 'src', 'generated', 'release-notes.json');

const REPOSITORY = 'Reefact/just-dummies';
const BRANCH = 'main';

/** One entry per release train, in CONTRIBUTING.md's own scope table order. */
const TRAINS = [
    { key: 'lib', directory: 'JustDummies', package: 'JustDummies' },
    { key: 'xunit', directory: 'JustDummies.Xunit', package: 'JustDummies.Xunit' },
    { key: 'catalog', directory: 'JustDummies.DiagnosticCatalog', package: 'JustDummies.DiagnosticCatalog' },
    { key: 'cli', directory: 'JustDummies.Cli', package: 'JustDummies.Cli' },
];

/** What "no changes recorded yet" looks like, so an empty Unreleased section is dropped. */
const EMPTY_UNRELEASED = /^_.*no unreleased changes.*_$/i;

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * The four inline markdown forms these files actually use — code spans, bold, italics
 * and links — turned into safe, ready-to-display HTML. Not a markdown parser: it knows
 * nothing about block structure, lists or headings, because splitting on those happens
 * before this is ever called.
 *
 * `relativeTo` is the train's own directory in the source repository, which is what a
 * `../doc/…` link is written relative to. Resolved here, once, so the component that
 * renders this JSON never has to know the library repository's own layout.
 */
function inlineHtml(markdown, relativeTo) {
    const escaped = escapeHtml(markdown);

    const coded = escaped.replace(/`([^`]+)`/g, (_match, code) => `<code>${code}</code>`);
    const bolded = coded.replace(/\*\*([^*]+)\*\*/g, (_match, text) => `<strong>${text}</strong>`);
    // After bold consumes every `**` pair, a remaining single `*…*` is italic.
    const italicised = bolded.replace(/\*([^*]+)\*/g, (_match, text) => `<em>${text}</em>`);

    return italicised.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
        const resolved = /^https?:\/\//.test(href)
            ? href
            : `https://github.com/${REPOSITORY}/blob/${BRANCH}/${posix.normalize(posix.join(relativeTo, href))}`;

        return `<a href="${resolved}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });
}

/** `## [1.1.0-beta.1] - 2026-08-13` → `{ version: '1.1.0-beta.1', date: '2026-08-13' }`. */
const RELEASE_HEADING = /^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?/;

function maturityOf(version) {
    const match = /-(preview|beta|alpha|rc)(?:\.|$)/.exec(version);

    return match === null ? 'stable' : match[1];
}

/** Blank-line-separated paragraphs, each unwrapped onto one line. */
function paragraphsOf(lines) {
    const paragraphs = [];
    let current = [];

    for (const line of lines) {
        if (line.trim() === '') {
            if (current.length > 0) {
                paragraphs.push(current.join(' '));
                current = [];
            }
        } else {
            current.push(line.trim());
        }
    }
    if (current.length > 0) {
        paragraphs.push(current.join(' '));
    }

    return paragraphs;
}

/** A `- ` list's items, each joined with its own wrapped continuation lines — indented,
 *  not themselves starting a new `- ` — into the one logical item they are. */
function bulletsOf(lines) {
    const items = [];

    for (const line of lines) {
        if (/^- /.test(line)) {
            items.push(line.slice(2));
        } else if (items.length > 0 && /^\s+\S/.test(line)) {
            items[items.length - 1] += ` ${line.trim()}`;
        }
    }

    return items;
}

/**
 * The items of one `### Category` block, whichever of the two shapes this changelog
 * used for it: most are a `- ` list, but a prose category — Notes, Requires — is
 * written as ordinary paragraphs instead (checked here rather than assumed from the
 * label, since Documentation is a single bullet in one file and would be prose in
 * another). Read as whichever the block actually contains, so each becomes one item:
 * a paragraph reads as one card entry exactly as a bullet does.
 */
function blockItemsOf(lines) {
    return lines.some((line) => /^- /.test(line)) ? bulletsOf(lines) : paragraphsOf(lines);
}

/** Known `### …` labels, normalised so a differently-cased heading still matches. */
const KNOWN_CATEGORIES = new Set([
    'added',
    'changed',
    'fixed',
    'deprecated',
    'removed',
    'security',
    'documentation',
    'notes',
    'requires',
    'refused, on purpose',
]);

function sectionsOf(bodyLines, relativeTo) {
    const sections = [];
    let current = null;

    for (const line of bodyLines) {
        const heading = /^### (.+)/.exec(line);

        if (heading !== null) {
            current = { label: heading[1].trim(), lines: [] };
            sections.push(current);
        } else if (current !== null) {
            current.lines.push(line);
        }
    }

    return sections
        .filter((section) => KNOWN_CATEGORIES.has(section.label.toLowerCase()))
        .map((section) => ({
            label: section.label,
            items: blockItemsOf(section.lines).map((item) => inlineHtml(item, relativeTo)),
        }));
}

/** The prose before the first `### `, which is the release's own "why", when it wrote one. */
function summaryOf(bodyLines, relativeTo) {
    const firstCategoryIndex = bodyLines.findIndex((line) => /^### /.test(line));
    const lines = firstCategoryIndex === -1 ? bodyLines : bodyLines.slice(0, firstCategoryIndex);

    return paragraphsOf(lines).map((paragraph) => inlineHtml(paragraph, relativeTo));
}

/**
 * Splits a CHANGELOG.md on its `## [version]` headings and returns one entry per
 * release, newest first — the order Keep a Changelog already writes them in, trusted
 * rather than re-sorted by a semver comparator this file has no other use for.
 */
function releasesOf(markdown, relativeTo) {
    // The trailing `[label]: https://…` reference definitions carry the one fact the
    // prose above them never states — where this exact release lives on GitHub. Read
    // before they are stripped, so the last release in the file does not absorb them
    // as body text once they are gone.
    const tagUrls = new Map();

    for (const match of markdown.matchAll(/^\[([^\]]+)\]:\s*(https?:\/\/\S+)$/gm)) {
        tagUrls.set(match[1], match[2]);
    }

    const withoutReferences = markdown.replace(/^\[[^\]]+\]:\s*https?:\/\/\S+$/gm, '');
    const lines = withoutReferences.split('\n');

    const releases = [];
    let currentHeading = null;
    let currentLines = [];

    function flush() {
        if (currentHeading === null) {
            return;
        }

        const [, version, date] = currentHeading;
        const unreleased = version === 'Unreleased';

        if (unreleased && currentLines.every((line) => line.trim() === '' || EMPTY_UNRELEASED.test(line.trim()))) {
            return; // Nothing recorded yet — no card to show for it.
        }

        releases.push({
            version,
            unreleased,
            date: date ?? null,
            maturity: unreleased ? null : maturityOf(version),
            tagUrl: tagUrls.get(version) ?? null,
            summaryHtml: summaryOf(currentLines, relativeTo),
            sections: sectionsOf(currentLines, relativeTo),
        });
    }

    for (const line of lines) {
        const heading = RELEASE_HEADING.exec(line);

        if (heading !== null) {
            flush();
            currentHeading = heading;
            currentLines = [];
        } else if (currentHeading !== null) {
            currentLines.push(line);
        }
    }
    flush();

    return releases;
}

async function fetchChangelog(train) {
    const url = `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/${train.directory}/CHANGELOG.md`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`generate-release-notes: ${url} answered ${response.status}`);
    }

    return response.text();
}

const trains = await Promise.all(
    TRAINS.map(async (train) => {
        const markdown = await fetchChangelog(train);
        const releases = releasesOf(markdown, `${train.directory}/`);

        console.log(`  ${train.key.padEnd(8)} ${releases.length} release(s)`);

        return { key: train.key, package: train.package, releases };
    }),
);

const document = {
    source: `https://github.com/${REPOSITORY}`,
    generatedAt: new Date().toISOString(),
    trains,
};

mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, `${JSON.stringify(document, null, 2)}\n`);

console.log(`  apps/site/src/generated/release-notes.json`);
