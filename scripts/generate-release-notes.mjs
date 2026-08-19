// Snapshot the library's own release-notes files into apps/site/src/generated/release-notes/.
//
// WHAT IT READS is `<Train>/RELEASE_NOTES-<major>.x.<en|fr>.md` in Reefact/just-dummies —
// the product-facing account of each release, drafted by hand there and published verbatim
// as that release's GitHub body — rather than the `CHANGELOG.md` beside it. The two exist
// for two readers, and this page has only one of them: the changelog is the technical
// record, the release-notes file is what someone deciding whether to upgrade reads. It is
// also the only one of the two that exists in French. Decision: ADR-0019.
//
// AT ONE REF, THE LIBRARY'S MOST RECENT TAG, whatever train cut it — ADR-0013's atomic
// snapshot rule, which this generator used to be the documented exception to. "Most recent"
// is chronological and cannot be computed from the tag names: the trains version
// independently, so `xunit-v1.0.0-preview.1` and `lib-v1.0.0-preview.2` are not comparable
// as numbers, and two tags cut twenty-nine minutes apart do not contain the same notes.
// Hence the tag dates below, fetched rather than guessed.
//
// UNLIKE ITS NEIGHBOURS IN src/generated/, this is not run by build-site.sh and not asserted
// current by CI's "generated content is committed and current" check. Every other generator
// in that set is deterministic from this repository's own commit — running it twice on the
// same HEAD writes the same bytes. This one reads a repository that moves on its own
// schedule, so the same HEAD can legitimately produce two different snapshots a day apart.
// Wiring that into the mandatory build would make an unrelated PR's CI fail whenever the
// library shipped a release between the maintainer's commit and CI's run, or whenever GitHub
// was briefly unreachable — a network dependency the build has never had.
//
// So refreshing this snapshot is a deliberate act, the same way ADR-0001 makes publishing
// this site a deliberate act rather than a side effect of something else. Run it, read the
// diff, commit it:
//
//   node scripts/generate-release-notes.mjs
//
// IT REFUSES RATHER THAN PUBLISHING SOMETHING INCOMPLETE: a major named by a tag whose notes
// file is missing, a release heading that does not name its version and date, or two
// languages holding different releases all stop it. A page complete in English and short in
// French is exactly what §6.4 exists to prevent, and it is invisible to everything else here.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'apps', 'site', 'src', 'generated', 'release-notes');

const REPOSITORY = 'Reefact/just-dummies';
const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;

/** One entry per release train, in CONTRIBUTING.md's own scope table order. The tag prefix is
 *  the library's `tools/trains.sh` partition, which is what makes a version a tag again. */
const TRAINS = [
    { key: 'lib', directory: 'JustDummies', package: 'JustDummies', tagPrefix: 'lib-v' },
    { key: 'xunit', directory: 'JustDummies.Xunit', package: 'JustDummies.Xunit', tagPrefix: 'xunit-v' },
    { key: 'catalog', directory: 'JustDummies.DiagnosticCatalog', package: 'JustDummies.DiagnosticCatalog', tagPrefix: 'catalog-v' },
    { key: 'cli', directory: 'JustDummies.Cli', package: 'JustDummies.Cli', tagPrefix: 'cli-v' },
];

/** Both halves of every file, always together: one without the other is what §6.4 forbids. */
const LOCALES = ['en', 'fr'];

function refuse(message) {
    throw new Error(`generate-release-notes: ${message}`);
}

/**
 * Every tag the library carries, newest first, with the date it was cut.
 *
 * `git ls-remote` would name them in one call and is not enough: it answers with names and
 * shas, and the ordering this needs is chronological. So the tags are fetched into a
 * throwaway repository — `--depth 1 --filter=blob:none`, which brings the tag objects and
 * their commits without a single file's content: 232 KB and about a second, measured, for a
 * repository whose working tree is a .NET solution.
 */
function readTags() {
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

        if (tags.length === 0) {
            refuse(`${REPOSITORY} answered with no tags at all — nothing to pin this snapshot to`);
        }

        return tags;
    } finally {
        rmSync(workspace, { recursive: true, force: true });
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * The one escape `escapeHtml` does not do, because nothing needed it until an attribute did:
 * a literal quote in a link destination closes a `href="…"` early and lets whatever follows
 * be read as markup or a second attribute.
 */
function escapeQuotes(text) {
    return text.replace(/"/g, '&quot;');
}

/**
 * The inline markdown these files actually use — code spans, bold, italics and links — turned
 * into safe, ready-to-display HTML. Not a markdown parser: it knows nothing about block
 * structure, lists or headings, because splitting on those happens before this is called.
 *
 * `relativeTo` is the train's own directory in the library, which is what a `../doc/…` link
 * would be written relative to. Resolved here, once, against the pinned tag rather than a
 * branch — a mirror that names one ref and links to another describes two different trees.
 */
function inlineHtml(markdown, relativeTo, ref) {
    const escaped = escapeHtml(markdown);

    const coded = escaped.replace(/`([^`]+)`/g, (_match, code) => `<code>${code}</code>`);
    const bolded = coded.replace(/\*\*([^*]+)\*\*/g, (_match, text) => `<strong>${text}</strong>`);
    // After bold consumes every `**` pair, a remaining single `*…*` is italic.
    const italicised = bolded.replace(/\*([^*]+)\*/g, (_match, text) => `<em>${text}</em>`);

    return italicised.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
        if (/^https?:\/\//.test(href)) {
            return `<a href="${escapeQuotes(href)}">${text}</a>`;
        }

        // A source link written with a trailing slash names a directory, and GitHub serves
        // those under /tree/, never /blob/.
        const kind = href.endsWith('/') ? 'tree' : 'blob';
        const resolved = posix.normalize(posix.join(relativeTo, href));

        return `<a href="${escapeQuotes(`${REPOSITORY_URL}/${kind}/${ref}/${resolved}`)}">${text}</a>`;
    });
}

/**
 * A paragraph, with the one block-level form these files use handled first: a release's own
 * summary is written as a whole line in italics, `_like this_`. Underscores are read only in
 * that position, never mid-sentence, so an identifier with one in it is left alone.
 */
function paragraphHtml(paragraph, relativeTo, ref) {
    const italic = /^_(.+)_$/.exec(paragraph.trim());

    return italic === null ? inlineHtml(paragraph, relativeTo, ref) : `<em>${inlineHtml(italic[1], relativeTo, ref)}</em>`;
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

/**
 * The items of one `### Rubric` block, in the order they were written — a `- ` line starts a
 * bullet, a blank line ends whatever is open, and any other line extends it. That one rule
 * covers every shape these files use without asking which shape a block is first.
 */
function blockItemsOf(lines) {
    const items = [];
    let current = null;

    for (const line of lines) {
        const bullet = /^- (.*)/.exec(line);

        if (bullet !== null) {
            if (current !== null) {
                items.push(current);
            }
            current = bullet[1];
        } else if (line.trim() === '') {
            if (current !== null) {
                items.push(current);
                current = null;
            }
        } else if (current !== null) {
            current += ` ${line.trim()}`;
        } else {
            current = line.trim();
        }
    }
    if (current !== null) {
        items.push(current);
    }

    return items;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * `August 18, 2026` → `2026-08-18`.
 *
 * Read from the English file only, and reused for both languages: the French twin writes the
 * same day as `18 août 2026`, and a page that formats an ISO date with the reader's own
 * locale needs one date, not two spellings of it.
 */
function isoDateOf(text, file) {
    const match = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(text.trim());
    const month = match === null ? -1 : MONTHS.indexOf(match[1].toLowerCase());

    if (match === null || month === -1) {
        refuse(`${file} dates a release "${text}", which is not a month, day and year in English`);
    }

    return `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
}

function maturityOf(version) {
    const match = /-(preview|beta|alpha|rc)(?:\.|$)/.exec(version);

    return match === null ? 'stable' : match[1];
}

/** `1.0.0-preview.2` → `v1-0-0-preview-2`: an id a stylesheet can select and a URL can carry,
 *  and one that starts with a letter rather than a digit. */
function versionSlug(version) {
    return `v${version.replace(/[^A-Za-z0-9]+/g, '-')}`;
}

/** `⚠️ Breaking changes` → `breaking-changes`. Taken from the English label in both locales,
 *  so an anchor survives a reader switching language mid-page. */
function rubricSlug(label) {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * One file's releases, newest first — the order the file already writes them in, trusted
 * rather than re-sorted by a semver comparator this repository has no other use for.
 *
 * Everything above the first `## ` is dropped: the file's own title and its paragraph of
 * links back to the changelog and the previous major are the library's navigation, not this
 * site's, and the section this page builds says both things in its own words.
 */
function releasesOf(markdown, file, relativeTo, ref) {
    const lines = markdown.split('\n');
    const releases = [];
    let heading = null;
    let body = [];

    function flush() {
        if (heading === null) {
            return;
        }

        const match = /^(\S+)\s+—\s+(.+)$/.exec(heading);

        if (match === null) {
            refuse(`${file} heads a release "${heading}", where "<version> — <date>" was expected`);
        }

        const [, version, date] = match;
        const firstRubric = body.findIndex((line) => /^### /.test(line));
        const summaryLines = firstRubric === -1 ? body : body.slice(0, firstRubric);

        const sections = [];
        let current = null;

        for (const line of body) {
            const rubric = /^### (.+)/.exec(line);

            if (rubric !== null) {
                current = { label: rubric[1].trim(), lines: [] };
                sections.push(current);
            } else if (current !== null) {
                current.lines.push(line);
            }
        }

        if (sections.length === 0 && summaryLines.every((line) => line.trim() === '')) {
            refuse(`${file} carries a release ${version} with neither a summary nor a rubric`);
        }

        releases.push({
            version,
            date,
            maturity: maturityOf(version),
            anchor: versionSlug(version),
            summaryHtml: paragraphsOf(summaryLines).map((paragraph) => paragraphHtml(paragraph, relativeTo, ref)),
            sections: sections.map((section) => ({
                label: section.label,
                items: blockItemsOf(section.lines).map((item) => inlineHtml(item, relativeTo, ref)),
            })),
        });
    }

    for (const line of lines) {
        const release = /^## (.+)/.exec(line);

        if (release !== null) {
            flush();
            heading = release[1].trim();
            body = [];
        } else if (heading !== null) {
            body.push(line);
        }
    }
    flush();

    if (releases.length === 0) {
        refuse(`${file} holds no release at all`);
    }

    return releases;
}

async function fetchNotes(train, major, locale, ref) {
    const path = `${train.directory}/RELEASE_NOTES-${major}.x.${locale}.md`;
    const url = `https://raw.githubusercontent.com/${REPOSITORY}/${ref}/${path}`;
    const response = await fetch(url);

    if (response.status === 404) {
        refuse(`${path} does not exist at ${ref}, though a ${train.tagPrefix}${major}.* tag says that major was released`);
    }
    if (!response.ok) {
        refuse(`${url} answered ${response.status}`);
    }

    return { path, markdown: await response.text() };
}

const tags = readTags();
const ref = tags[0];

console.log(`  ref  ${ref.name}  (${ref.date})`);

const tagNames = new Set(tags.map((tag) => tag.name));

rmSync(destination, { recursive: true, force: true });
mkdirSync(join(destination, 'majors'), { recursive: true });

const index = [];

for (const train of TRAINS) {
    const versions = tags.filter((tag) => tag.name.startsWith(train.tagPrefix)).map((tag) => tag.name.slice(train.tagPrefix.length));

    if (versions.length === 0) {
        refuse(`no ${train.tagPrefix}* tag exists, so the ${train.key} train has published nothing to mirror`);
    }

    const majors = [...new Set(versions.map((version) => Number.parseInt(version, 10)))].sort((left, right) => right - left);
    const described = [];

    for (const major of majors) {
        const perLocale = {};

        for (const locale of LOCALES) {
            const { path, markdown } = await fetchNotes(train, major, locale, ref.name);

            perLocale[locale] = { path, releases: releasesOf(markdown, path, `${train.directory}/`, ref.name) };
        }

        // The two languages are one document in two spellings, and the site joins them on the
        // version and on the position of a rubric inside its release. A file that lost a
        // release in translation, or gained a rubric, breaks that join silently — so it stops
        // here instead, where the message can name both files.
        const english = perLocale.en;
        const french = perLocale.fr;

        if (english.releases.length !== french.releases.length) {
            refuse(`${english.path} holds ${english.releases.length} release(s) and ${french.path} holds ${french.releases.length}`);
        }

        english.releases.forEach((release, position) => {
            const twin = french.releases[position];

            if (twin.version !== release.version) {
                refuse(`${english.path} and ${french.path} disagree at release ${position + 1}: ${release.version} against ${twin.version}`);
            }
            if (twin.sections.length !== release.sections.length) {
                refuse(`${english.path} and ${french.path} disagree on ${release.version}: ${release.sections.length} rubric(s) against ${twin.sections.length}`);
            }
        });

        for (const locale of LOCALES) {
            const releases = perLocale[locale].releases.map((release, position) => {
                const source = english.releases[position];
                const tag = `${train.tagPrefix}${source.version}`;

                return {
                    version: source.version,
                    date: isoDateOf(source.date, english.path),
                    maturity: source.maturity,
                    anchor: source.anchor,
                    // Only a tag that exists is linked. The library has pushed a tag whose
                    // release run then failed before publishing anything (catalog-v1.0.0-preview.1),
                    // and a link to a number that was skipped is worse than no link.
                    tagUrl: tagNames.has(tag) ? `${REPOSITORY_URL}/releases/tag/${tag}` : null,
                    summaryHtml: release.summaryHtml,
                    sections: release.sections.map((section, rubric) => ({
                        label: section.label,
                        anchor: `${source.anchor}-${rubricSlug(source.sections[rubric].label)}`,
                        items: section.items,
                    })),
                };
            });

            writeFileSync(
                join(destination, 'majors', `${train.key}-v${major}.${locale}.json`),
                `${JSON.stringify({ train: train.key, major, locale, releases }, null, 2)}\n`,
            );
        }

        const newest = english.releases[0];

        described.push({
            major,
            releaseCount: english.releases.length,
            latest: { version: newest.version, date: isoDateOf(newest.date, english.path), maturity: newest.maturity },
        });
    }

    console.log(`  ${train.key.padEnd(8)} ${described.map((major) => `v${major.major} (${major.releaseCount})`).join(', ')}`);

    index.push({
        key: train.key,
        package: train.package,
        changelogUrl: `${REPOSITORY_URL}/blob/${ref.name}/${train.directory}/CHANGELOG.md`,
        majors: described,
    });
}

writeFileSync(
    join(destination, 'index.json'),
    `${JSON.stringify(
        {
            repository: REPOSITORY_URL,
            ref: ref.name,
            refUrl: `${REPOSITORY_URL}/releases/tag/${ref.name}`,
            refDate: ref.date,
            generatedAt: new Date().toISOString(),
            trains: index,
        },
        null,
        2,
    )}\n`,
);

console.log(`  apps/site/src/generated/release-notes/`);
