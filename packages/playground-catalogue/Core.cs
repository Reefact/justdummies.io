namespace JustDummies.Playground.Catalogue;

/// <summary>
///     The descriptive half of the catalogue (specification §10.4/§10.7), generated at build time into
///     <c>Generated/PlaygroundCatalogue.Descriptors.g.cs</c> from the referenced JustDummies assembly's
///     metadata. This file only declares a lookup helper — the data itself is generated, never
///     hand-written (an omission there fails the build).
/// </summary>
public static partial class PlaygroundCatalogue {

    /// <summary>The receiver type key used for <c>Any.</c>'s own static entry points.</summary>
    public const string EntryPointReceiver = CatalogueKeys.EntryPointReceiver;

    /// <summary>The methods available on the given receiver type key, or none if it is terminal.</summary>
    public static IReadOnlyList<MemberDescriptor> StepsFor(string receiverTypeKey) {
        return StepsByReceiverTypeKey.TryGetValue(receiverTypeKey, out var steps) ? steps : Array.Empty<MemberDescriptor>();
    }

}

/// <summary>
///     The executable half of the catalogue: a dispatch table of ordinary, statically typed call
///     sites, generated alongside <see cref="PlaygroundCatalogue" /> from the same reflection pass so
///     the two can never drift from each other (enforced by the generator's own self-check).
/// </summary>
public static partial class PlaygroundDispatch {

    public static ChainResult Invoke(string key, object? receiver, IReadOnlyList<string> rawArguments) {
        return StepsByKey.TryGetValue(key, out var step)
            ? step(receiver, rawArguments)
            : throw new KeyNotFoundException($"no catalogued chain step '{key}'");
    }

}
