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
 * did. `resolveLink` is given EVERY destination these notes carry, absolute ones included,
 * and answers with the URL to publish and whether it leaves this site — the repository it
 * resolves against and the ref it pins to are the caller's, and the two callers do not
 * share either.
 *
 * The absolute ones used to bypass it, emitted exactly as written, and that quietly undid
 * the pinning this whole snapshot exists for: every one of the 22 links in the library's
 * mirrored prose said `/blob/main/`, on a page whose own line above them named the tag the
 * snapshot was taken at. A reader following one landed on whatever main had become since —
 * the drift ADR-0013's atomicity argument names in as many words. Only the caller can tell
 * its own repository from a stranger's, which is why the branch moved out here rather than
 * teaching this parser what a GitHub URL looks like.
 */
export function releaseNotesReader({ refuse, resolveLink }) {
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
        /*
         * WHAT IS BETWEEN BACKTICKS IS A LITERAL, and the only thing that may happen to it is
         * HTML escaping. Code spans used to be wrapped in place, first of the four passes,
         * which left their contents in the string for bold, italics and links to read as
         * markup of their own: ``glob `*.cs` and `*.md` `` came out as
         * `<code><em>.cs</code> and <code></em>.md</code>` — mis-nested markup on its way into
         * a `set:html` — and a link written inside a code span came out as a live anchor
         * pointing wherever it said. No file generated here trips it today, but the library's
         * notes are mirrored from a repository this one does not control (ADR-0019).
         *
         * So each span is lifted out to a numbered hole before the other passes run and put
         * back after they have. A hole is delimited by NUL, which none of the three regexes
         * treats as special and which a notes file has no business carrying — it is stripped
         * from the text first, so a line cannot write a hole that steals another span's
         * contents. Lifting out rather than splitting on the spans keeps emphasis that spans
         * one working: `**a `b` c**` is still one `<strong>`.
         */
        const escaped = escapeHtml(markdown.replace(/\0/g, ''));

        /*
         * The quote is escaped GOING IN, not coming out, and that is the whole of why this is
         * safe. A hole is opaque to every pass that follows, including the one that builds an
         * `href="…"` — so a span lifted out of a link destination would be put back *after*
         * `escapeQuotes` had already run on that destination, and its contents would land inside
         * the attribute unescaped. ``[x](foo/`" ping="https://example.test`)`` closed the href on
         * that quote and turned the rest into real attributes; with an event-handler name it is
         * the same shape with worse contents, refused by the policy at run time but not by
         * anything here. Escaping at extraction means a hole is safe wherever it lands, text or
         * attribute, and `&quot;` inside a `<code>` renders as the quote the author typed.
         */
        const codes = [];
        const coded = escaped.replace(/`([^`]+)`/g, (_match, code) => `\0${codes.push(escapeQuotes(code)) - 1}\0`);

        const bolded = coded.replace(/\*\*([^*]+)\*\*/g, (_match, text) => `<strong>${text}</strong>`);
        // After bold consumes every `**` pair, a remaining single `*…*` is italic.
        const italicised = bolded.replace(/\*([^*]+)\*/g, (_match, text) => `<em>${text}</em>`);

        const linked = italicised.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
            const link = resolveLink(href, { absolute: /^https?:\/\//.test(href) });

            /*
             * A link that leaves the site says so, the way every other outbound link here
             * does — and these were the only ones that did not. Within a single release card
             * a reader met one link announced and the next silent, because the guard that
             * enforces the rule is scoped to `.site-nav` rather than to the rule itself.
             *
             * `rel` is inert without `target`, so the two are emitted together or not at all.
             * The words that say it out loud are the site's, not this script's: the component
             * adds them at build time, where the reader's locale is already known.
             */
            const away = link.external ? ' target="_blank" rel="noopener noreferrer"' : '';

            return `<a href="${escapeQuotes(link.href)}"${away}>${text}</a>`;
        });

        return linked.replace(/\0(\d+)\0/g, (_match, index) => `<code>${codes[Number(index)]}</code>`);
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

        const year = Number(match[3]);
        const day = Number(match[2]);

        /*
         * The shape above says the parts are a month name, one or two digits and four more.
         * It does not say the day exists. "November 31, 2026" satisfied it and was written
         * out as 2026-11-31, which every consumer hands to `new Date` and which `new Date`
         * rolls over: the page then read "December 1" beneath a `datetime` attribute naming
         * the 31st — a date the note itself never claimed, on a page whose whole job is to
         * say when something shipped. "January 99, 2026" satisfied it too and produced an
         * Invalid Date, which takes the build down inside a component, naming neither the
         * file nor the text.
         *
         * Building the day and asking UTC to hand back the same three parts is the only check
         * that catches a day the calendar does not have, and it costs one comparison. UTC
         * rather than local time because the value being checked is a calendar date, not a
         * moment: a local-time round trip shifts it across a day boundary for half the world.
         */
        const built = new Date(Date.UTC(year, month, day));

        if (built.getUTCFullYear() !== year || built.getUTCMonth() !== month || built.getUTCDate() !== day) {
            refuse(`${file} dates a release "${text}", which is not a day the calendar has`);
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
 * A destination resolved against one repository at one ref, the way GitHub serves it: a link
 * written with a trailing slash names a directory, and those live under /tree/, never /blob/.
 *
 * `relativeTo` is the directory the link was written relative to — a train's own folder in
 * the library, or the repository root for this site's notes. `siteOrigin` is where this site
 * itself is published, so a link to one of its own pages is not called outbound.
 *
 * AN ABSOLUTE LINK INTO THE SAME REPOSITORY IS PINNED TOO, and that is the half that was
 * missing. Upstream's authoring habit is to write these out in full — all 25 markdown links
 * in the library's notes are absolute and none is relative — so the relative branch above is
 * the one that almost never fires, and the branch that does fire was passing `main` through
 * untouched. Rewriting the ref segment is safe by construction here: the snapshot already
 * refuses unless every file it reads exists at this ref, and these links name files in that
 * same tree.
 *
 * A link to anywhere else is left exactly as written. This knows one repository — its
 * caller's — and has no business editing a stranger's URL.
 */
export function githubHrefResolver({ repositoryUrl, ref, relativeTo, siteOrigin }) {
    /* Already at the pinned ref, matched as a whole prefix rather than parsed.
     *
     * A ref is not one path segment: this site's own are `release/2026-08-19T11-50-00Z`, with
     * a slash in the middle, and a URL already pinned to one of those would be read as the ref
     * `release` followed by a path starting `2026-…`, then "repinned" onto itself — the date
     * appearing twice and the link pointing at nothing. Asking whether the whole prefix is
     * already there settles that without having to know where a ref ends. */
    const pinnedTo = (kind) => `${repositoryUrl}/${kind}/${ref}/`;

    /* `/blob/<ref>/` or `/tree/<ref>/` for a ref that is NOT the pinned one, which is the only
       case left to rewrite. The ref is taken as a single segment, and that is exact for what
       these notes actually carry — `main`, which is what all 22 of the library's links name,
       and what this repository's own authoring rule mandates. It cannot be exact in general:
       a link written against a branch with a slash in its name, `feature/foo`, is
       indistinguishable from a one-segment ref followed by a directory, and would be rewritten
       onto the wrong path. Nothing here can tell the two apart from the URL alone — only the
       repository's ref list could — so the limit is written down rather than papered over.

       The path after the ref is optional. `…/tree/main` names a branch's root, which is an
       ordinary thing for a note to link to, and requiring a slash after the ref let exactly
       that form keep pointing at a moving branch — the drift this whole resolver exists to
       stop, escaping through the shortest URL of the lot. */
    const otherRef = new RegExp(`^${repositoryUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(blob|tree)/([^/]+)(?:/(.*))?$`);

    return function resolved(href, { absolute } = { absolute: false }) {
        if (!absolute) {
            const kind = href.endsWith('/') ? 'tree' : 'blob';

            return { href: `${repositoryUrl}/${kind}/${ref}/${posix.normalize(posix.join(relativeTo, href))}`, external: true };
        }

        /* A link to this site is not a link away from it. Without this the note would open
           its own page in a new tab and tell a screen reader it had left, which is worse than
           saying nothing: the announcement would be false rather than missing.
           The origin on its own counts — `https://justdummies.io` with nothing after it is the
           site's front page, and a first version of this asked for a trailing slash and so sent
           exactly that link away with a false announcement attached. */
        if (siteOrigin !== undefined && (href === siteOrigin || href.startsWith(`${siteOrigin}/`))) {
            return { href, external: false };
        }

        if (href.startsWith(pinnedTo('blob')) || href.startsWith(pinnedTo('tree'))) {
            return { href, external: true };
        }

        const match = otherRef.exec(href);

        if (match === null) {
            return { href, external: true };
        }

        const [, kind, , path] = match;

        return { href: `${repositoryUrl}/${kind}/${ref}/${path ?? ''}`, external: true };
    };
}
