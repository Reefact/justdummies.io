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

export interface SiteRelease {
    /** The `release/*` tag this note describes — the same string /version.json reports as
     *  `release` on a build cut from it. */
    readonly tag: string;
    /** ISO, read from the English file: the French twin spells the same day differently,
     *  which is a spelling and not a second fact. */
    readonly date: string;
    readonly locales: Readonly<Record<Locale, SiteReleaseProse>>;
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

/**
 * Where a release of this repository is read on GitHub — `commitUrl` in `version.ts`, for the
 * other half of the same page.
 *
 * COMPUTED RATHER THAN STORED, and unconditionally, which is the one thing worth explaining.
 * Its counterpart for the library's notes stores a `tagUrl` that can be null, because the
 * library has pushed a tag whose release run then failed, and a link to a version that was
 * skipped is worse than no link. That reasoning does not reach here: GitHub answers
 * /releases/tag/<tag> for any tag it holds, published release or not — measured, on this
 * repository, at a moment when release/2026-08-19T11-50-00Z was a tag with no release behind
 * it. The tag is what the link needs, and a `## release/*` section naming one that was never
 * pushed would be a release note for something that never shipped.
 */
export function releaseUrl(tag: string): string {
    return `${site.siteRepository}/releases/tag/${tag}`;
}
