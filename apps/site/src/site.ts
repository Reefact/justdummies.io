/**
 * The facts about JustDummies that the site states out loud.
 *
 * The specification requires install commands to come from central metadata and
 * forbids a NuGet version from being typed in several places (§24.1). This module
 * is that single place: a page renders `site.library.installCommand`, never a
 * command spelled out in its own markup.
 *
 * KNOWN DUPLICATION: `library.version` also exists in Directory.Packages.props,
 * which is what the playground actually restores. They are two package managers
 * and neither can read the other, so the two must be raised together — and
 * `scripts/check-package-freshness.mjs` is the build step that compares them, per
 * ADR-0013's Follow-up Actions. It reports a disagreement; it does not fail this
 * build over one, the same way it does not fail over a version lagging nuget.org.
 * This comment stays as the fact a reader raising a version reads first — the
 * script is what raising it without its counterpart now gets caught by.
 */
export const site = {
    /**
     * A product name, not prose: it is spelled the same in every locale. Anything
     * that would be *translated* — the tagline, the subtitle, every sentence the
     * site says — lives in `i18n/ui.ts` instead, and nothing here is a candidate
     * for translation.
     */
    name: 'JustDummies',

    /** The library's own repository — not this site's. See `siteRepository` below. */
    repository: 'https://github.com/Reefact/just-dummies',

    /**
     * This site's own repository, as opposed to the library's above. The About page's
     * "this site" link, the sitewide footer, and `version.ts`'s `commitUrl` all read
     * this rather than each spelling out the URL on its own.
     */
    siteRepository: 'https://github.com/Reefact/justdummies.io',

    library: {
        /**
         * Availability is content, not a decision taken inside a component. Nothing
         * visible may lead nowhere without its state being said, and an interface
         * cannot say it if it has to guess it.
         */
        status: 'available',
        package: 'JustDummies',
        version: '1.0.0-preview.3',
        nuget: 'https://www.nuget.org/packages/JustDummies',
        /**
         * The prerelease flag is not decoration: every JustDummies package is a
         * pre-release today, so a bare `dotnet add package JustDummies` resolves
         * nothing. It comes off the day a stable version ships, here and nowhere
         * else.
         */
        installCommand: 'dotnet add package JustDummies --prerelease',
        /**
         * The Package Manager Console form. The casing is PowerShell's convention
         * and nuget.org's own label, and this string will be pasted a very large
         * number of times: it has to be exact.
         */
        packageManagerCommand: 'Install-Package JustDummies -IncludePrerelease',
    },

    /**
     * The xUnit v3 adapter. It is what makes a failing test report the seed it drew from,
     * and the third act cannot be told without it. Every exit offers it, the first one
     * included: a reader who leaves with the library leaves able to draw a value, and the
     * package that names the seed behind a draw is not something to learn about two acts
     * later.
     */
    xunit: {
        status: 'available',
        package: 'JustDummies.Xunit',
        version: '1.0.0-preview.1',
        nuget: 'https://www.nuget.org/packages/JustDummies.Xunit',
        installCommand: 'dotnet add package JustDummies.Xunit --prerelease',
        /* Same shape as the library's, because the adapter is an ordinary package. The
           tool is not, and has no line here: a global .NET tool is installed from the
           command line and the console offers no equivalent. */
        packageManagerCommand: 'Install-Package JustDummies.Xunit -IncludePrerelease',
    },

    cli: {
        status: 'available',
        /** The package installed, which is not the command typed. */
        package: 'JustDummies.Cli',
        /** The command typed, which is not the package installed. */
        command: 'dum',
        version: '1.0.0-beta.1',
        nuget: 'https://www.nuget.org/packages/JustDummies.Cli',
        installCommand: 'dotnet tool install --global JustDummies.Cli --prerelease',
        example: 'dum generate Order',
    },

    /**
     * The legal identity behind this site, for the Privacy page's "who's responsible"
     * section and the sitewide footer's copyright line.
     *
     * KNOWN DUPLICATION: `i18n/ui.ts`'s `privacy.controller.body` and
     * `privacy.rights.body` restate `siren`, `address`, `manager` and `contactEmail` as
     * fluent, locale-specific prose rather than interpolating them — the two locales
     * build the sentence around those facts differently, and splicing a value into the
     * middle of a sentence is the same "clipped fragment" this site's copy avoids
     * elsewhere. Raise this object and that prose together, the same way `library.version`
     * above is raised together with `Directory.Packages.props`. The playground's own
     * footer (`apps/playground/Layout/SiteFooter.razor`) restates `entity` a third time,
     * in hard-coded English — TypeScript and C# cannot read each other's constants.
     */
    legal: {
        entity: 'REEFACT',
        legalForm: 'SARL unipersonnelle',
        siren: '804 026 482',
        address: "134 rue de Chevilly, 94240 L'Haÿ-les-Roses, France",
        manager: 'Sylvain Aurat',
        contactEmail: 'privacy@reefact.net',
    },
} as const;
