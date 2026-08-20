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
//
// HOW IT READS THE MARKDOWN is `scripts/lib/release-notes-markdown.mjs`, shared with the
// generator that reads this repository's own notes: two sources written to one grammar, and
// one place that knows the grammar. What stays here is everything only a library release
// has — the trains, the tags, the maturity a semver version carries.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { githubHrefResolver, releaseNotesReader } from './lib/release-notes-markdown.mjs';

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

/*
 * The pill is the page's one-word answer to "can I put this in production", and it used to
 * answer `stable` to anything it did not recognise. `2.0.0-next.1`, `1.0.0-rc1` and
 * `1.0.0-beta-2` all came back stable, because the old pattern looked for a closed list of
 * identifiers and read "no match" as "no pre-release" — a guess, and the one guess that runs
 * in the reassuring direction. Nothing upstream constrains the identifier: versions come from
 * git tags, not from the notes files this generator otherwise refuses over.
 *
 * So the identifier is captured rather than matched, and an unknown one stops the snapshot the
 * way an unparseable date does. Anchored to the pre-release field — everything up to the first
 * `-` or `+` is the version core — so build metadata cannot be mistaken for it: `1.0.0+2026-08-18`
 * has no pre-release at all, and a looser pattern would have captured `2026` out of it.
 */
const MATURITIES = ['preview', 'beta', 'alpha', 'rc'];

function maturityOf(version) {
    const match = /^[^-+]+-([0-9A-Za-z]+)/.exec(version);

    if (match === null) {
        return 'stable';
    }

    if (!MATURITIES.includes(match[1])) {
        refuse(`${version} carries a pre-release identifier this snapshot has no word for: ${match[1]}. Known: ${MATURITIES.join(', ')}`);
    }

    return match[1];
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

    // One reader per train, because a `../doc/…` link in these notes is written relative to
    // the train's own directory. Resolved against the pinned tag rather than a branch — a
    // mirror that names one ref and links to another describes two different trees.
    const { releasesOf, isoDateOf } = releaseNotesReader({
        refuse,
        resolveLink: githubHrefResolver({ repositoryUrl: REPOSITORY_URL, ref: ref.name, relativeTo: `${train.directory}/` }),
    });

    for (const major of majors) {
        const perLocale = {};

        for (const locale of LOCALES) {
            const { path, markdown } = await fetchNotes(train, major, locale, ref.name);

            perLocale[locale] = { path, releases: releasesOf(markdown, path) };
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
                // Everything the reader could not know: a library version's maturity is in its
                // semver suffix, and an anchor has to be the same string in both locales.
                const anchor = versionSlug(source.version);

                return {
                    version: source.version,
                    date: isoDateOf(source.date, english.path),
                    maturity: maturityOf(source.version),
                    anchor,
                    // Only a tag that exists is linked: a release can be written up in the
                    // notes file before its tag is cut, and a link to a tag that is not there
                    // yet is worse than no link.
                    //
                    // It does NOT catch what this comment used to claim — a tag pushed whose
                    // release run then failed, catalog-v1.0.0-preview.1 being the real case.
                    // That tag exists, so this test passes and the link is emitted; the thing
                    // that is missing is the GitHub Release, which is not what `refs/tags`
                    // answers. Querying releases rather than tags is what would close it.
                    // ADR-0013 records the risk and it stays open, which is worth saying
                    // plainly rather than leaving a comment that implies otherwise.
                    tagUrl: tagNames.has(tag) ? `${REPOSITORY_URL}/releases/tag/${tag}` : null,
                    summaryHtml: release.summaryHtml,
                    sections: release.sections.map((section, rubric) => ({
                        label: section.label,
                        anchor: `${anchor}-${rubricSlug(source.sections[rubric].label)}`,
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
            latest: { version: newest.version, date: isoDateOf(newest.date, english.path), maturity: maturityOf(newest.version) },
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
