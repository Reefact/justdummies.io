/**
 * What this site last shipped, in the reader's own language.
 *
 * Read from `generated/site-release.json`, written by `scripts/generate-site-release-note.mjs`
 * out of the `RELEASE_NOTES-<locale>.md` files at the root of this repository — the newest
 * `## release/*` section of each, never the `## Unreleased` one above it. The prose is the
 * maintainer's, written by hand before the tag that names it was pushed (ADR-0017), and
 * nothing here translates anything: the file already is the translation.
 *
 * NOT THE LIBRARY'S RELEASE NOTES. Those are `release-notes.ts` beside this, mirrored from
 * Reefact/just-dummies and published under /release-notes. Two products, two changelogs, and
 * the only thing they share is the shape of a release — showing one as the other would tell a
 * reader that a website deployment changed the library they depend on.
 */
import siteReleaseDocument from './generated/site-release.json';
import type { Locale } from './i18n/ui';
import { site } from './site';

/** A `### Rubric` block — `✨ New`, `🐛 Fixes` — as that locale's file writes it. */
export interface SiteReleaseRubric {
    readonly label: string;
    /** One entry per fact worth a line. Every string is ready-to-display HTML. */
    readonly items: readonly string[];
}

/** One locale's half of the release: the prose, and only the prose. */
export interface SiteReleaseProse {
    /** The release's own "why", when it wrote one — each entry one paragraph of HTML. */
    readonly summaryHtml: readonly string[];
    readonly sections: readonly SiteReleaseRubric[];
}

/** One older release, kept for the "previous releases" section: the same shape as the
 *  newest one, minus nothing — its card renders exactly like the newest one's, just without
 *  a link of its own (see `VersionContent.astro`). */
export interface SiteReleaseSummary {
    readonly tag: string;
    readonly date: string;
    readonly locales: Readonly<Record<Locale, SiteReleaseProse>>;
}

export interface SiteRelease {
    /** The `release/*` tag this note describes — the same string /version.json reports as
     *  `release` on a build cut from it. */
    readonly tag: string;
    /** ISO, read from the English file: the French twin spells the same day differently,
     *  which is a spelling and not a second fact. */
    readonly date: string;
    readonly locales: Readonly<Record<Locale, SiteReleaseProse>>;
    /** The 5 releases published just before this one, newest first. */
    readonly previous: readonly SiteReleaseSummary[];
    /** The tag of the release right after `previous`'s last entry — where the "previous
     *  releases" section's closing link lands, so a reader continuing past it on GitHub picks
     *  up exactly where this page's own listing stops. */
    readonly moreTag: string;
}

export const siteRelease: SiteRelease = siteReleaseDocument as SiteRelease;

/** The note as a page reads it: the prose of the locale asked for, and the two facts that
 *  are the same in every one. */
export interface LocalisedSiteRelease extends SiteReleaseProse {
    readonly tag: string;
    readonly date: string;
}

export function siteReleaseIn(locale: Locale): LocalisedSiteRelease {
    return { tag: siteRelease.tag, date: siteRelease.date, ...siteRelease.locales[locale] };
}

/** The 5 previous releases, newest first, in the locale asked for — the "previous releases"
 *  section's cards. */
export function previousSiteReleasesIn(locale: Locale): readonly LocalisedSiteRelease[] {
    return siteRelease.previous.map((release) => ({ tag: release.tag, date: release.date, ...release.locales[locale] }));
}

/**
 * Where a release of this repository is read on GitHub — `commitUrl` in `version.ts`, for the
 * other half of the same page.
 *
 * THE RELEASES LIST, ANCHORED, RATHER THAN THE RELEASE'S OWN PAGE. GitHub gives every release
 * on /releases an `id="release-<tag>"` (verified against this repository's own listing) — a
 * fragment that scrolls a reader straight to that entry without leaving the page every other
 * release on this site links to. The same list serves the "previous releases" section's
 * closing link, whose tag names a release this page never shows a card for, so linking to that
 * release's OWN page (as this used to) would have taken a reader somewhere this page never
 * mentions; the shared list is where both belong.
 *
 * COMPUTED RATHER THAN STORED, and unconditionally, which is the one thing worth explaining.
 * Its counterpart for the library's notes stores a `tagUrl` that can be null, because the
 * library has pushed a tag whose release run then failed, and a link to a version that was
 * skipped is worse than no link. That reasoning barely reaches here: a tag with no GitHub
 * release behind it — measured, on this repository, at a moment when
 * release/2026-08-19T11-50-00Z was exactly that — still gets an anchor, but one that matches
 * nothing on the page; GitHub does not 404 on an unknown fragment the way /releases/tag/<tag>
 * 404s on an unpublished tag, it just lands the reader at the top of the list instead of the
 * entry named by the URL.
 */
export function releaseUrl(tag: string): string {
    return `${site.siteRepository}/releases#release-${tag}`;
}
