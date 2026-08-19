/**
 * Which packages the download page offers, and where each train's page lives.
 *
 * Three of the release notes section's four trains, not four: `catalog` has no install
 * command anywhere in this repository today (see `scripts/check-package-freshness.mjs`'s
 * own `PACKAGES` list, which tracks the same gap on purpose rather than guessing at it),
 * so a page offering to install it would be offering something this site cannot back up.
 * The day that changes, the entry belongs here first — this list, not the release notes
 * section, is what decides which trains the download page shows.
 */
import type { UiKey } from './i18n/ui';
import { site } from './site';

export type DownloadTrainKey = 'lib' | 'xunit' | 'cli';

export const DOWNLOAD_TRAINS: readonly DownloadTrainKey[] = ['lib', 'xunit', 'cli'];

export interface PackageOffer {
    readonly label: UiKey;
    readonly nuget: string;
    readonly installCommand: string;
    readonly packageManagerCommand?: string;
    readonly instead?: UiKey;
}

/** One entry per train — never more than one: a train the download page offers is a
 *  single ordinary package here, not the compound "library plus what came before it"
 *  offer the home page's own exits build (see `InstallTabs.astro`'s file header). */
export const DOWNLOAD_PACKAGES: Record<DownloadTrainKey, readonly PackageOffer[]> = {
    lib: [
        {
            label: 'install.library',
            nuget: site.library.nuget,
            installCommand: site.library.installCommand,
            packageManagerCommand: site.library.packageManagerCommand,
        },
    ],
    xunit: [
        {
            label: 'install.adapter',
            nuget: site.xunit.nuget,
            installCommand: site.xunit.installCommand,
            packageManagerCommand: site.xunit.packageManagerCommand,
        },
    ],
    cli: [
        {
            label: 'install.tool',
            nuget: site.cli.nuget,
            installCommand: site.cli.installCommand,
            // No Package Manager Console equivalent — a global .NET tool is installed
            // from the command line. Same fact InstallTabs already states for this
            // package on the home page's own exits.
            instead: 'install.toolIsCliOnly',
        },
    ],
};

/** The train label each locale gives a package, reusing the release notes section's own
 *  words — the two pages talk about the same trains and should not name them twice. */
export const DOWNLOAD_TRAIN_LABEL_KEY: Record<DownloadTrainKey, UiKey> = {
    lib: 'releaseNotes.train.lib',
    xunit: 'releaseNotes.train.xunit',
    cli: 'releaseNotes.train.cli',
};

/** Where a train's own download page lives, English segment names — `pathForLocale`
 *  translates the locale prefix, not the segment, same as every other route (§7.1). */
export function downloadPathFor(train: DownloadTrainKey): string {
    return train === 'lib' ? '/download/' : `/download/${train}/`;
}
