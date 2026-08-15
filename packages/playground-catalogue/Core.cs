namespace JustDummies.Playground.Catalogue;

/// <summary>One argument a catalogued method takes, described for the UI.</summary>
public sealed record ParameterDescriptor(string Name, string TypeKey, string Placeholder);

/// <summary>
///     One catalogued member — either a static entry point on <c>Any</c> (ReceiverTypeKey is
///     <see cref="PlaygroundCatalogue.EntryPointReceiver" />) or an instance method on a chain-eligible
///     builder type.
/// </summary>
public sealed record MemberDescriptor(
    string                              Key,
    string                              MethodName,
    string                              ReceiverTypeKey,
    string                              ReturnTypeKey,
    IReadOnlyList<ParameterDescriptor>  Parameters,
    string                              Summary,
    string                              HelpUrl);

/// <summary>
///     What running one chain step produced: the new receiver (or the same one, on a parse/refusal
///     failure) and its type key, plus at most one of two distinct kinds of failure.
///
///     The two are never the same text and must never be confused: <see cref="ArgumentErrorKey" />
///     is text the site itself writes (e.g. "this argument expects an integer" for bad input) —
///     a <c>PlaygroundStrings</c> key, resolved with the visitor's current locale by whoever
///     displays it. <see cref="LibraryRefusalText" /> is a <c>DummyException</c>/<c>ArgumentException</c>
///     message the library itself worded — shown verbatim, in English, in every locale (specification
///     §6.4/§9.9), never run through a translation table.
/// </summary>
public readonly record struct ChainResult(object? Value, string TypeKey, string? ArgumentErrorKey, string? LibraryRefusalText) {

    public bool HasError => ArgumentErrorKey is not null || LibraryRefusalText is not null;

}

/// <summary>A generated chain step: takes the current receiver and raw argument text, returns the result.</summary>
public delegate ChainResult ChainStep(object? receiver, IReadOnlyList<string> rawArguments);

/// <summary>
///     The descriptive half of the catalogue (specification §10.4/§10.7), generated at build time into
///     <c>Generated/PlaygroundCatalogue.Descriptors.g.cs</c> from the referenced JustDummies assembly's
///     metadata. This file only declares the constant every entry point is keyed under and a lookup
///     helper — the data itself is generated, never hand-written (an omission there fails the build).
/// </summary>
public static partial class PlaygroundCatalogue {

    /// <summary>The receiver type key used for <c>Any.</c>'s own static entry points.</summary>
    public const string EntryPointReceiver = "Any";

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
