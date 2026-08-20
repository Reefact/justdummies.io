/**
 * What the library's own release-notes files said, last time anyone asked.
 *
 * Read from `generated/release-notes/`, written by `scripts/generate-release-notes.mjs` —
 * a snapshot, not a live view (see that script's own header for why). It names the tag it
 * was taken at, which is what lets the page say so honestly instead of implying it is
 * watching GitHub right now (ADR-0013, ADR-0019).
 *
 * The prose is the library's, in both languages: `majors/<train>-v<major>.<locale>.json`
 * holds one major version's releases as the reader of that locale will see them, rubric
 * labels included. Nothing here translates anything — the file already is the translation.
 */
import indexDocument from './generated/release-notes/index.json';
import type { Locale, UiKey } from './i18n/ui';

export type TrainKey = 'lib' | 'xunit' | 'catalog' | 'cli';

export type Maturity = 'preview' | 'beta' | 'alpha' | 'rc' | 'stable';

/** A release's `### Rubric` block — `✨ New`, `🐛 Bug Fixes` — with its own anchor. The
 *  anchor is built from the English label in every locale, so it survives a reader
 *  switching language on a page they had already scrolled into. */
export interface ReleaseSection {
    readonly label: string;
    readonly anchor: string;
    /** One entry per fact worth a line. Every string is ready-to-display HTML. */
    readonly items: readonly string[];
}

export interface Release {
    readonly version: string;
    /** ISO, read from the English file and formatted per locale by whoever displays it. */
    readonly date: string;
    readonly maturity: Maturity;
    readonly anchor: string;
    /** Where this exact release lives on GitHub, or null for a version whose tag was never
     *  cut — the library has skipped a number after a failed release run. */
    readonly tagUrl: string | null;
    /** The release's own "why", when it wrote one — each entry one paragraph of HTML. */
    readonly summaryHtml: readonly string[];
    readonly sections: readonly ReleaseSection[];
}

/** One train's one major version, in one locale: everything that major ever published. */
export interface MajorNotes {
    readonly train: TrainKey;
    readonly major: number;
    readonly locale: Locale;
    /** Newest first, as the source file already orders them. */
    readonly releases: readonly Release[];
}

/** What the index says about a major without opening it — enough for a sidebar entry and
 *  for the section's own front page. */
export interface MajorSummary {
    readonly major: number;
    readonly releaseCount: number;
    readonly latest: {
        readonly version: string;
        readonly date: string;
        readonly maturity: Maturity;
    };
}

export interface Train {
    readonly key: TrainKey;
    readonly package: string;
    /** The technical record this train's notes summarise, pinned at the same tag. */
    readonly changelogUrl: string;
    /** Newest major first. */
    readonly majors: readonly MajorSummary[];
}

export interface ReleaseNotesIndex {
    readonly repository: string;
    /** The library tag this snapshot was taken at. */
    readonly ref: string;
    readonly refUrl: string;
    readonly refDate: string;
    readonly generatedAt: string;
    readonly trains: readonly Train[];
}

export const releaseNotes: ReleaseNotesIndex = indexDocument as ReleaseNotesIndex;

/**
 * Every major's notes, in both locales, imported eagerly: they are the page's content, not
 * something fetched later, and the set is whatever the generator last wrote rather than a
 * list repeated here (§2 — nothing the site displays is typed by hand).
 */
const majorModules = import.meta.glob('./generated/release-notes/majors/*.json', {
    eager: true,
    import: 'default',
}) as Record<string, MajorNotes>;

function keyOf(train: TrainKey, major: number, locale: Locale): string {
    return `${train}-v${major}.${locale}`;
}

const majors = new Map<string, MajorNotes>(
    Object.values(majorModules).map(function indexed(notes: MajorNotes): [string, MajorNotes] {
        return [keyOf(notes.train, notes.major, notes.locale), notes];
    }),
);

/** The URL segment a major version is published under: `v1`, never `1.x`. A dot in a path
 *  segment reads as a file extension to the host's canonicalisation (ADR-0020). */
export function majorSlug(major: number): string {
    return `v${major}`;
}

/** The train label each locale gives a package. The names themselves are the library's and
 *  live in the snapshot; what is translated is which product a train is. */
export const TRAIN_LABEL_KEY: Record<TrainKey, UiKey> = {
    lib: 'releaseNotes.train.lib',
    xunit: 'releaseNotes.train.xunit',
    catalog: 'releaseNotes.train.catalog',
    cli: 'releaseNotes.train.cli',
};

export function trainOf(key: TrainKey): Train {
    const train = releaseNotes.trains.find(function named(candidate: Train): boolean {
        return candidate.key === key;
    });

    if (train === undefined) {
        throw new Error(`release-notes: no train named ${key} in the snapshot`);
    }

    return train;
}

/** The major a train's page opens on: the one it is publishing today. */
export function latestMajorOf(train: Train): MajorSummary {
    return train.majors[0];
}

export function notesOf(train: TrainKey, major: number, locale: Locale): MajorNotes {
    const notes = majors.get(keyOf(train, major, locale));

    if (notes === undefined) {
        throw new Error(`release-notes: ${keyOf(train, major, locale)} is not in the snapshot`);
    }

    return notes;
}

/** Every train-and-major the section publishes, in display order — what `getStaticPaths`
 *  builds the routes from, and what `i18n/routing.ts` is taught so the language selector
 *  keeps working on a page whose path no file name spells out. */
export const publishedMajors: ReadonlyArray<{ readonly train: TrainKey; readonly major: number }> = releaseNotes.trains.flatMap(
    function ofTrain(train: Train) {
        return train.majors.map(function asRoute(major: MajorSummary) {
            return { train: train.key, major: major.major };
        });
    },
);
