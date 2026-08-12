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
 * and neither can read the other, so the two must be raised together until a
 * build step compares them. Until that step exists, this comment is the guard.
 */
export const site = {
    /**
     * A product name, not prose: it is spelled the same in every locale. Anything
     * that would be *translated* — the tagline, the subtitle, every sentence the
     * site says — lives in `i18n/ui.ts` instead, and nothing here is a candidate
     * for translation.
     */
    name: 'JustDummies',

    repository: 'https://github.com/Reefact/just-dummies',

    library: {
        /**
         * Availability is content, not a decision taken inside a component. Nothing
         * visible may lead nowhere without its state being said, and an interface
         * cannot say it if it has to guess it.
         */
        status: 'available',
        package: 'JustDummies',
        version: '1.0.0-preview.1',
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
     * The fourth slot of the install row, which has no target yet. It is declared
     * rather than omitted so the row is designed at its final width now, instead of
     * being redrawn the day the documentation exists.
     */
    documentation: {
        status: 'pending',
        url: null,
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
} as const;
