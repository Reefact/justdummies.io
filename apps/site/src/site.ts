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
    name: 'JustDummies',

    /** Provisional wording. §28 lists the final slogan as still to be settled. */
    tagline: 'Just dummies. Seriously powerful ones.',
    /** Provisional wording. */
    subtitle: 'Focused, fluent test values for .NET.',

    repository: 'https://github.com/Reefact/just-dummies',

    library: {
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
    },

    cli: {
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
