// Read this site's own newest release note into apps/site/src/generated/site-release.json.
//
// WHAT IT READS is `RELEASE_NOTES-<en|fr>.md` at the root of this repository — what changed
// on justdummies.io, one section per `release/*` tag, written by hand before the tag that
// names it is pushed (ADR-0017, and the release-notes skill). Not the library's notes: those
// are a different product's, mirrored from a different repository by
// `generate-release-notes.mjs`, and the two must never be shown as one another. The same
// markdown grammar, though, so both go through `lib/release-notes-markdown.mjs`.
//
// ONLY THE NEWEST RELEASED SECTION, and deliberately not `## Unreleased`. That section is the
// drafting surface — it holds what will ship next, which on a deployed page would be a
// promise rather than a record. What /version shows is what shipped.
//
// UNLIKE ITS LIBRARY COUNTERPART, this one runs in build-site.sh and its output is committed.
// The distinction is the one that script's own header draws: this reads a file in this
// repository, so the same commit always produces the same bytes, and CI's "generated content
// is committed and current" check can hold it to that. No network, no other repository's
// schedule — nothing that could make an unrelated pull request go red.
//
//   node scripts/generate-site-release-note.mjs
//
// IT REFUSES RATHER THAN PUBLISHING SOMETHING INCOMPLETE: a file with no released section
// yet, a heading that names no version and no date, or two languages whose newest release
// disagrees. A page complete in English and short in French is what §6.4 exists to prevent.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { githubHrefResolver, releaseNotesReader } from './lib/release-notes-markdown.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const destination = join(root, 'apps', 'site', 'src', 'generated', 'site-release.json');

const REPOSITORY_URL = 'https://github.com/Reefact/justdummies.io';
/** Where this site is published — `site` in apps/site/astro.config.mjs. A release note
 *  linking to one of its own pages is not sending the reader away. */
const SITE_ORIGIN = 'https://justdummies.io';

/** Both halves of the file, always together: one without the other is what §6.4 forbids. */
const LOCALES = ['en', 'fr'];

function fileOf(locale) {
    return `RELEASE_NOTES-${locale}.md`;
}

function refuse(message) {
    throw new Error(`generate-site-release-note: ${message}`);
}

/**
 * A `## ` heading that is not a release — `## Unreleased`, and nothing else.
 *
 * Declined rather than refused, because a file carrying an Unreleased section is a correct
 * file: it is where the next release is drafted. What the parser refuses is a heading that
 * claims to be a release and then names no version.
 *
 * THE DECLINED SET IS NAMED, NOT INFERRED. This used to read `!heading.startsWith('release/')`,
 * which declined the one heading it meant to and every mistyping of a release heading along
 * with it. A capital that slipped — `## Release/2026-08-20T00-00-00Z — …` — was dropped as
 * silently as `## Unreleased` is, and /version went on publishing the release before it,
 * under the tag before it, linking into the tree before it. Nothing downstream could catch
 * that: the generated file stays consistent with itself, so CI's freshness check passes, and
 * the browser check reads only the tag's shape. A heading that is neither the drafting
 * surface nor a release now stops the build, where it is still one character to fix.
 */
function notARelease(heading, file) {
    if (heading === 'Unreleased') {
        return true;
    }

    if (!heading.startsWith('release/')) {
        refuse(`${file} heads a section "${heading}", which is neither "Unreleased" nor a release/ tag`);
    }

    return false;
}

/**
 * The tag the newest released section names, read before a single line is parsed.
 *
 * It has to come first because it is the ref every relative link in these notes resolves
 * against, and both languages have to resolve against the same one — a reader following the
 * English link and the French link should land in the same tree.
 */
function newestTagOf(markdown, file) {
    const match = /^## (release\/\S+)/m.exec(markdown);

    if (match === null) {
        refuse(`${file} names no released section yet — nothing has shipped for /version to show`);
    }

    return match[1];
}

const markdowns = Object.fromEntries(LOCALES.map((locale) => [locale, readFileSync(join(root, fileOf(locale)), 'utf8')]));

const published = newestTagOf(markdowns.en, fileOf('en'));

const { releasesOf, isoDateOf } = releaseNotesReader({
    refuse,
    // Relative links in these notes are written from the repository root — the file's own
    // intro links to an ADR that way, and a bullet could. Pinned to the release being
    // published rather than to a branch: a note that describes one release and links into
    // another tree is two statements, not one.
    resolveLink: githubHrefResolver({ repositoryUrl: REPOSITORY_URL, ref: published, relativeTo: '.', siteOrigin: SITE_ORIGIN }),
});

// Newest first, the order the file already writes them in. Only the first is published, and
// the rest are read purely to get past them.
const releases = Object.fromEntries(
    LOCALES.map((locale) => [
        locale,
        releasesOf(markdowns[locale], fileOf(locale), { skip: (heading) => notARelease(heading, fileOf(locale)) })[0],
    ]),
);

// The two languages are one document in two spellings, and the page joins them on the
// position of a rubric inside the release. A file that translated a different release, or
// gained a rubric, breaks that join silently — so it stops here instead, where the message
// can name both files.
if (releases.fr.version !== releases.en.version) {
    refuse(`${fileOf('en')} publishes ${releases.en.version} and ${fileOf('fr')} publishes ${releases.fr.version}`);
}
if (releases.fr.sections.length !== releases.en.sections.length) {
    refuse(
        `${fileOf('en')} and ${fileOf('fr')} disagree on ${releases.en.version}: ` +
            `${releases.en.sections.length} rubric(s) against ${releases.fr.sections.length}`,
    );
}

// Counting the rubrics was not enough. The join is positional all the way down — the page
// puts the English bullet and the French bullet of the same rubric on the same line of the
// same release — so a rubric written with three bullets in English and one in French passes
// a rubric count and then renders exactly the half-translated page this file's own header
// says §6.4 exists to prevent. The bullets are the unit a reader misses, so they are the
// unit that is counted.
releases.en.sections.forEach((section, index) => {
    const twin = releases.fr.sections[index];

    if (twin.items.length !== section.items.length) {
        refuse(
            `${fileOf('en')} and ${fileOf('fr')} disagree on ${releases.en.version}, rubric ${index + 1} ` +
                `("${section.label}" against "${twin.label}"): ` +
                `${section.items.length} bullet(s) against ${twin.items.length}`,
        );
    }
});

const document = {
    tag: releases.en.version,
    // One ISO date for both languages, read from the English file: the French twin spells the
    // same day as "19 août 2026", which is a spelling, not a second fact.
    date: isoDateOf(releases.en.date, fileOf('en')),
    locales: Object.fromEntries(
        LOCALES.map((locale) => [locale, { summaryHtml: releases[locale].summaryHtml, sections: releases[locale].sections }]),
    ),
};

writeFileSync(destination, `${JSON.stringify(document, null, 2)}\n`);

console.log(`  ${document.tag}  (${document.date})`);
console.log('  apps/site/src/generated/site-release.json');
