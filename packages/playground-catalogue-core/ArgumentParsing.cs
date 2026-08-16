using System.Globalization;

namespace JustDummies.Playground.Catalogue;

/// <summary>
///     One parser per primitive parameter type the v1 catalogue's scalar generators actually take
///     (specification §10.7: "this parameter expects an integer"). Array- and
///     <c>IEnumerable&lt;T&gt;</c>-typed parameters are out of scope for v1 (see
///     tools/playground-catalogue/excluded-members.jsonc) — a single text input has no natural
///     multi-value shape, and every parameter the generator discovers must resolve to a parser
///     here or the generator fails the build rather than silently skip it.
///
///     A failed parse returns a <em>key</em>, not resolved text: this project cannot reference
///     <c>PlaygroundStrings</c> (apps/playground depends on this project, not the other way
///     around), and the message is the site's own wording — not the library's — so it follows
///     the same i18n rules as the rest of the playground's chrome (specification §6.4). Whoever
///     displays the key resolves it with <c>PlaygroundStrings.T(locale, key)</c>.
/// </summary>
public static class ArgumentParsing {

    public const string TypeKeyString         = "System.String";
    public const string TypeKeyBoolean        = "System.Boolean";
    public const string TypeKeyByte            = "System.Byte";
    public const string TypeKeySByte          = "System.SByte";
    public const string TypeKeyInt16          = "System.Int16";
    public const string TypeKeyUInt16         = "System.UInt16";
    public const string TypeKeyInt32          = "System.Int32";
    public const string TypeKeyUInt32         = "System.UInt32";
    public const string TypeKeyInt64          = "System.Int64";
    public const string TypeKeyUInt64         = "System.UInt64";
    public const string TypeKeyInt128         = "System.Int128";
    public const string TypeKeyUInt128        = "System.UInt128";
    public const string TypeKeySingle         = "System.Single";
    public const string TypeKeyDouble         = "System.Double";
    public const string TypeKeyHalf            = "System.Half";
    public const string TypeKeyDecimal        = "System.Decimal";
    public const string TypeKeyGuid            = "System.Guid";
    public const string TypeKeyChar            = "System.Char";
    public const string TypeKeyDateOnly       = "System.DateOnly";
    public const string TypeKeyDateTime       = "System.DateTime";
    public const string TypeKeyDateTimeOffset = "System.DateTimeOffset";
    public const string TypeKeyTimeOnly       = "System.TimeOnly";
    public const string TypeKeyTimeSpan       = "System.TimeSpan";

    /// <summary>The full set of parameter type keys v1 knows how to parse from one text input.</summary>
    public static readonly IReadOnlyCollection<string> KnownTypeKeys = new[] {
        TypeKeyString, TypeKeyBoolean, TypeKeyByte, TypeKeySByte, TypeKeyInt16, TypeKeyUInt16,
        TypeKeyInt32, TypeKeyUInt32, TypeKeyInt64, TypeKeyUInt64, TypeKeyInt128, TypeKeyUInt128,
        TypeKeySingle, TypeKeyDouble, TypeKeyHalf, TypeKeyDecimal, TypeKeyGuid, TypeKeyChar,
        TypeKeyDateOnly, TypeKeyDateTime, TypeKeyDateTimeOffset, TypeKeyTimeOnly, TypeKeyTimeSpan,
    };

    /// <summary>A <c>PlaygroundStrings</c> key naming what one parameter type expects, e.g. "argument.expectsInteger".</summary>
    public const string KeyExpectsBoolean                = "argument.expectsBoolean";
    public const string KeyExpectsByte                   = "argument.expectsByte";
    public const string KeyExpectsWholeNumber             = "argument.expectsWholeNumber";
    public const string KeyExpectsWholeNumberNonNegative  = "argument.expectsWholeNumberNonNegative";
    public const string KeyExpectsInteger                 = "argument.expectsInteger";
    public const string KeyExpectsNumber                  = "argument.expectsNumber";
    public const string KeyExpectsGuid                    = "argument.expectsGuid";
    public const string KeyExpectsChar                    = "argument.expectsChar";
    public const string KeyExpectsDate                    = "argument.expectsDate";
    public const string KeyExpectsDateTime                = "argument.expectsDateTime";
    public const string KeyExpectsDateTimeOffset          = "argument.expectsDateTimeOffset";
    public const string KeyExpectsTime                    = "argument.expectsTime";
    public const string KeyExpectsDuration                = "argument.expectsDuration";
    public const string KeyExpectsWithinSandboxRange       = "argument.expectsWithinSandboxRange";

    /// <summary>
    ///     A ceiling on the magnitude of any integer argument this playground will actually pass to
    ///     the library, independent of the parameter's own name or purpose. Nothing in the v1
    ///     scalar catalogue needs a value larger than this for a meaningful demonstration, and an
    ///     unbounded one — e.g. <c>Any.String().WithLength(2147483647)</c> — asks the WebAssembly
    ///     runtime to allocate multiple gigabytes and can terminate the page with an uncaught
    ///     <c>OutOfMemoryException</c>. Applied uniformly to every wide-enough integer type rather
    ///     than only to parameters that look length-related, since the catalogue carries no
    ///     per-parameter "this one drives an allocation" metadata to key a narrower rule on.
    /// </summary>
    public const int SandboxMagnitudeLimit = 100_000;

    /// <summary>
    ///     Parses <paramref name="raw" /> as <paramref name="typeKey" />, or returns the
    ///     <c>PlaygroundStrings</c> key naming what was expected.
    /// </summary>
    public static bool TryParse(string typeKey, string raw, out object? value, out string? errorKey) {
        switch (typeKey) {
            case TypeKeyString:
                value    = raw;
                errorKey = null;
                return true;
            case TypeKeyBoolean:
                return TryParse(raw, KeyExpectsBoolean, (string s, out bool v) => bool.TryParse(s, out v), out value, out errorKey);
            case TypeKeyByte:
                return TryParse(raw, KeyExpectsByte, (string s, out byte v) => byte.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeySByte:
                return TryParse(raw, KeyExpectsWholeNumber, (string s, out sbyte v) => sbyte.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyInt16:
                return TryParse(raw, KeyExpectsWholeNumber, (string s, out short v) => short.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyUInt16:
                return TryParse(raw, KeyExpectsWholeNumberNonNegative, (string s, out ushort v) => ushort.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyInt32:
                return TryParseCapped(raw, KeyExpectsInteger, (string s, out int v) => int.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyUInt32:
                return TryParseCapped(raw, KeyExpectsWholeNumberNonNegative, (string s, out uint v) => uint.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyInt64:
                return TryParseCapped(raw, KeyExpectsWholeNumber, (string s, out long v) => long.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyUInt64:
                return TryParseCapped(raw, KeyExpectsWholeNumberNonNegative, (string s, out ulong v) => ulong.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyInt128:
                return TryParseCapped(raw, KeyExpectsWholeNumber, (string s, out Int128 v) => Int128.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyUInt128:
                return TryParseCapped(raw, KeyExpectsWholeNumberNonNegative, (string s, out UInt128 v) => UInt128.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeySingle:
                return TryParse(raw, KeyExpectsNumber, (string s, out float v) => float.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyDouble:
                return TryParse(raw, KeyExpectsNumber, (string s, out double v) => double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyHalf:
                return TryParse(raw, KeyExpectsNumber, (string s, out Half v) => Half.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyDecimal:
                return TryParse(raw, KeyExpectsNumber, (string s, out decimal v) => decimal.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyGuid:
                return TryParse(raw, KeyExpectsGuid, (string s, out Guid v) => Guid.TryParse(s, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyChar:
                return TryParse(raw, KeyExpectsChar, (string s, out char v) => { v = default; if (s.Length != 1) { return false; } v = s[0]; return true; }, out value, out errorKey);
            case TypeKeyDateOnly:
                return TryParse(raw, KeyExpectsDate, (string s, out DateOnly v) => DateOnly.TryParse(s, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyDateTime:
                return TryParse(raw, KeyExpectsDateTime, (string s, out DateTime v) => DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out v), out value, out errorKey);
            case TypeKeyDateTimeOffset:
                return TryParse(raw, KeyExpectsDateTimeOffset, (string s, out DateTimeOffset v) => DateTimeOffset.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out v), out value, out errorKey);
            case TypeKeyTimeOnly:
                return TryParse(raw, KeyExpectsTime, (string s, out TimeOnly v) => TimeOnly.TryParse(s, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            case TypeKeyTimeSpan:
                return TryParse(raw, KeyExpectsDuration, (string s, out TimeSpan v) => TimeSpan.TryParse(s, CultureInfo.InvariantCulture, out v), out value, out errorKey);
            default:
                // Unreachable in practice: the generator (tools/playground-catalogue) fails the
                // build the moment it discovers a parameter type not in KnownTypeKeys, so this
                // branch never ships against a real catalogue. Not localized — it names a
                // generator bug, not something a visitor caused.
                value    = null;
                errorKey = null;
                throw new InvalidOperationException($"no argument parser registered for type key '{typeKey}'");
        }
    }

    private delegate bool Parser<T>(string raw, out T value);

    private static bool TryParse<T>(string raw, string expectedKey, Parser<T> parser, out object? value, out string? errorKey) {
        if (parser(raw, out var parsed)) {
            value    = parsed;
            errorKey = null;
            return true;
        }

        value    = null;
        errorKey = expectedKey;
        return false;
    }

    /// <summary>Like <see cref="TryParse{T}" />, but also rejects a value whose magnitude exceeds
    /// <see cref="SandboxMagnitudeLimit" /> — see that constant's own comment for why.</summary>
    private static bool TryParseCapped<T>(string raw, string expectedKey, Parser<T> parser, out object? value, out string? errorKey)
        where T : System.Numerics.INumber<T> {
        if (!TryParse(raw, expectedKey, parser, out value, out errorKey)) {
            return false;
        }

        // Compared directly against both bounds rather than via T.Abs(parsed): the signed
        // minimum of a capped type (e.g. Int32.MinValue) has no positive representation, so
        // Abs(parsed) would itself throw OverflowException on exactly the input this check
        // exists to catch.
        var parsed = (T)value!;
        if (parsed > T.CreateSaturating(SandboxMagnitudeLimit) || parsed < T.CreateSaturating(-SandboxMagnitudeLimit)) {
            value    = null;
            errorKey = KeyExpectsWithinSandboxRange;
            return false;
        }

        return true;
    }

}
