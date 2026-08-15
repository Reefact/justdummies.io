/**
 * What the library's own CHANGELOG.md files said, last time anyone asked.
 *
 * Read from `generated/release-notes.json`, written by `scripts/generate-release-notes.mjs`
 * — a snapshot, not a live view (see that script's own header for why). `generatedAt` is
 * what lets the page say so honestly instead of implying it is watching GitHub right now.
 */
import releaseNotesDocument from './generated/release-notes.json';

/** A release's `### Category` block: bullets in the source, or its own paragraphs — either
 *  way, one entry per fact worth a line. Every string is ready-to-display HTML. */
export interface ReleaseSection {
    readonly label: string;
    readonly items: readonly string[];
}

export interface Release {
    readonly version: string;
    /** True for the `[Unreleased]` section — work recorded ahead of the next tag. */
    readonly unreleased: boolean;
    /** `null` for the unreleased entry, which has not been cut yet. */
    readonly date: string | null;
    readonly maturity: 'preview' | 'beta' | 'alpha' | 'rc' | 'stable' | null;
    /** Where this exact release lives on GitHub — a tag once cut, a compare view before. */
    readonly tagUrl: string | null;
    /** The release's own "why", when it wrote one — each entry one paragraph of HTML. */
    readonly summaryHtml: readonly string[];
    readonly sections: readonly ReleaseSection[];
}

export type TrainKey = 'lib' | 'xunit' | 'catalog' | 'cli';

export interface Train {
    readonly key: TrainKey;
    readonly package: string;
    /** Newest first, as Keep a Changelog already orders them. */
    readonly releases: readonly Release[];
}

export interface ReleaseNotesDocument {
    readonly source: string;
    readonly generatedAt: string;
    readonly trains: readonly Train[];
}

export const releaseNotes: ReleaseNotesDocument = releaseNotesDocument as ReleaseNotesDocument;
