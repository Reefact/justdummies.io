using System.Runtime.CompilerServices;

using JustDummies.Playground.Localization;

namespace JustDummies.PlaygroundI18nGuard;

/// <summary>
///     Forces <see cref="PlaygroundStrings" />' static constructor to run — which is the
///     entirety of the check (PlaygroundStrings.cs) — and reports what it finds.
/// </summary>
public static class Program {

    public static int Main() {
        try {
            // Any static member touches the type; Parse is picked because it takes no
            // argument that could itself be wrong. What actually runs first is the type
            // initializer, and that is the check.
            RuntimeHelpers.RunClassConstructor(typeof(PlaygroundStrings).TypeHandle);
        } catch (TypeInitializationException initialization) when (initialization.InnerException is not null) {
            Console.Error.WriteLine(initialization.InnerException.Message);

            return 1;
        }

        Console.WriteLine("playground-i18n-guard: PlaygroundStrings' locales agree.");

        return 0;
    }

}
