// The markdown a release-notes file is written in, read into structure.
//
// TWO GENERATORS READ THE SAME SHAPE. `generate-release-notes.mjs` mirrors the library's
// `RELEASE_NOTES-<major>.x.<locale>.md` from another repository; `generate-site-release.mjs`
// reads this repository's own `RELEASE_NOTES-<locale>.md`. Different sources, different
// subjects, one grammar: `## <version> — <date>`, an optional summary paragraph in italics,
// then `### Rubric` blocks of `- ` bullets. Parsing it twice would let the two drift, and
// the drift would show as one page rendering a bullet the other swallowed.
//
// WHAT IT RETURNS IS STRUCTURE, NOT A PAGE. A release comes back as its version, its date
// as written, its summary and its rubrics — nothing else. Anchors, maturity pills and tag
// URLs are what a particular section makes of a release, and the two callers disagree about
// every one of them: the library's versions are semver and carry a maturity, this site's are
// timestamps and carry none. So each generator decorates what it gets here, and this file
// stays the half they actually share.
//
// IT IS NOT A MARKDOWN PARSER. It knows the block forms these files use and no others,
// which is the whole reason this repository has no markdown dependency to keep current. A
// file that starts using tables or nested lists is a file this stops being right about, and
// the fix is to teach it that form rather than to reach for a library (§13).
import { posix } from 'node:path';

/**
 * A reader bound to one caller's two decisions: how it refuses, and where a relative link
 * in these notes points.
 *
 * `refuse` carries the calling generator's own name into the message, because a maintainer
 * reading a failed build needs to know which snapshot stopped, not merely that some parse
 * did. `resolveHref` is given a relative destination and a hint of whether it names a
 * directory, and answers with the absolute URL to publish — the repository it resolves
 * against and the ref it pins to are the caller's, and the two callers do not share either.
 */
export function releaseNotesReader({ refuse, resolveHref }) {
    function escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /**
     * The one escape `escapeHtml` does not do, because nothing needed it until an attribute
     * did: a literal quote in a link destination closes a `href="…"` early and lets whatever
     * follows be read as markup or a second attribute.
     */
    function escapeQuotes(text) {
        return text.replace(/"/g, '&quot;');
    }

    /**
     * The inline markdown these files actually use — code spans, bold, italics and links —
     * turned into safe, ready-to-display HTML. Not a markdown parser: it knows nothing about
     * block structure, lists or headings, because splitting on those happens before this is
     * called.
     */
    function inlineHtml(markdown) {
        const escaped = escapeHtml(markdown);

        const coded = escaped.replace(/`([^`]+)`/g, (_match, code) => `<code>${code}</code>`);
        const bolded = coded.replace(/\*\*([^*]+)\*\*/g, (_match, text) => `<strong>${text}</strong>`);
        // After bold consumes every `**` pair, a remaining single `*…*` is italic.
        const italicised = bolded.replace(/\*([^*]+)\*/g, (_match, text) => `<em>${text}</em>`);

        return italicised.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
            if (/^https?:\/\//.test(href)) {
                return `<a href="${escapeQuotes(href)}">${text}</a>`;
            }

            return `<a href="${escapeQuotes(resolveHref(href))}">${text}</a>`;
        });
    }

    /**
     * A paragraph, with the one block-level form these files use handled first: a release's
     * own summary is written as a whole line in italics, `_like this_`. Underscores are read
     * only in that position, never mid-sentence, so an identifier with one in it is left
     * alone.
     */
    function paragraphHtml(paragraph) {
        const italic = /^_(.+)_$/.exec(paragraph.trim());

        return italic === null ? inlineHtml(paragraph) : `<em>${inlineHtml(italic[1])}</em>`;
    }

    /**
     * One file's releases, newest first — the order the file already writes them in, trusted
     * rather than re-sorted by a comparator neither caller could share anyway: one numbers
     * its releases with semver, the other with timestamps.
     *
     * Everything above the first `## ` is dropped: a notes file opens with its own title and
     * a paragraph of links to its translation and its changelog, which is that file's
     * navigation rather than this site's.
     *
     * `skip` is asked about each heading before it is parsed, and is how a caller declines a
     * section that is not a release — this repository's own file opens with `## Unreleased`,
     * which names no version and dates nothing, and which a page describing what shipped must
     * not show. Refusing it here instead would be refusing a file that is perfectly correct.
     */
    function releasesOf(markdown, file, { skip = () => false } = {}) {
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
                summaryHtml: paragraphsOf(summaryLines).map(paragraphHtml),
                sections: sections.map((section) => ({
                    label: section.label,
                    items: blockItemsOf(section.lines).map(inlineHtml),
                })),
            });
        }

        for (const line of lines) {
            const release = /^## (.+)/.exec(line);

            if (release !== null) {
                flush();
                heading = skip(release[1].trim()) ? null : release[1].trim();
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

    /**
     * `August 18, 2026` → `2026-08-18`.
     *
     * Read from the English file only, and reused for both languages: the French twin writes
     * the same day as `18 août 2026`, and a page that formats an ISO date with the reader's
     * own locale needs one date, not two spellings of it.
     */
    function isoDateOf(text, file) {
        const match = /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(text.trim());
        const month = match === null ? -1 : MONTHS.indexOf(match[1].toLowerCase());

        if (match === null || month === -1) {
            refuse(`${file} dates a release "${text}", which is not a month, day and year in English`);
        }

        return `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }

    return { inlineHtml, paragraphHtml, releasesOf, isoDateOf };
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
 * A relative destination resolved against one repository at one ref, the way GitHub serves
 * it: a link written with a trailing slash names a directory, and those live under /tree/,
 * never /blob/.
 *
 * `relativeTo` is the directory the link was written relative to — a train's own folder in
 * the library, or the repository root for this site's notes.
 */
export function githubHrefResolver({ repositoryUrl, ref, relativeTo }) {
    return function resolved(href) {
        const kind = href.endsWith('/') ? 'tree' : 'blob';

        return `${repositoryUrl}/${kind}/${ref}/${posix.normalize(posix.join(relativeTo, href))}`;
    };
}
