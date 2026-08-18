namespace JustDummies.Playground.Catalogue;

/// <summary>Keys shared between the generator and the generated code, so both name the same
/// thing without the generator depending on the partial classes Generated/ completes.</summary>
public static class CatalogueKeys {

    /// <summary>The receiver type key used for <c>Any.</c>'s own static entry points.</summary>
    public const string EntryPointReceiver = "Any";

}

/// <summary>One argument a catalogued method takes, described for the UI.</summary>
public sealed record ParameterDescriptor(string Name, string TypeKey, string Placeholder);

/// <summary>
///     Whether this playground can offer a catalogued member, or only name it.
///
///     THE LIMIT IS THIS WEB INTERFACE'S, NEVER THE LIBRARY'S, and the whole point of modelling
///     it here rather than disabling an option in the markup is that the difference survives into
///     the data. An <see cref="UnavailableInPlayground" /> member is a real, supported, documented
///     part of JustDummies; what it lacks is a shape this form can express — a type argument, a
///     lambda, a nested generator, a multi-value argument. Anyone reading the catalogue can tell
///     which of the two they are looking at, and the combo says so in words rather than leaving a
///     visitor to guess why an entry is greyed.
///
///     Omitting them instead was the other option, and it is what the catalogue did until now: it
///     lets the combo pass for the library's whole surface, which is the misreading the
///     playground's own scope note (<c>playground.note</c>) was written to prevent. Naming a
///     capability and refusing it here is the honest form of that note.
/// </summary>
public enum PlaygroundSupport {

    /// <summary>Catalogued, dispatchable, selectable — the playground runs it.</summary>
    Supported,

    /// <summary>Real in the library, named here, and not selectable: this interface has no way to
    /// ask for its arguments.</summary>
    UnavailableInPlayground,

}

/// <summary>
///     One catalogued member — either a static entry point on <c>Any</c> (ReceiverTypeKey is
///     <see cref="CatalogueKeys.EntryPointReceiver" />) or an instance method on a chain-eligible
///     builder type.
/// </summary>
public sealed record MemberDescriptor(
    string                              Key,
    string                              MethodName,
    string                              ReceiverTypeKey,
    string                              ReturnTypeKey,
    IReadOnlyList<ParameterDescriptor>  Parameters,
    string                              Summary,
    string                              HelpUrl,
    PlaygroundSupport                   Support = PlaygroundSupport.Supported) {

    /// <summary>Whether this member can actually be chosen and run here — see
    /// <see cref="PlaygroundSupport" />. An unavailable one carries no <see cref="Parameters" />,
    /// no <see cref="Summary" /> and no dispatch entry: nothing but the name the combo shows and
    /// the receiver it would have been called on.</summary>
    public bool IsAvailableInPlayground => Support is PlaygroundSupport.Supported;

}

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
///
///     <see cref="ArgumentErrorIndex" /> names which of the step's arguments <see cref="ArgumentErrorKey" />
///     is about, so the UI can point a screen reader at that one input instead of every input in
///     the step — it is <c>null</c> for <see cref="LibraryRefusalText" />, which is about the whole
///     call, not one argument.
/// </summary>
public readonly record struct ChainResult(object? Value, string TypeKey, string? ArgumentErrorKey, string? LibraryRefusalText, int? ArgumentErrorIndex = null) {

    public bool HasError => ArgumentErrorKey is not null || LibraryRefusalText is not null;

}

/// <summary>A generated chain step: takes the current receiver and raw argument text, returns the result.</summary>
public delegate ChainResult ChainStep(object? receiver, IReadOnlyList<string> rawArguments);
