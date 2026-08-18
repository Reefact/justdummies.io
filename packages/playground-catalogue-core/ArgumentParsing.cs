using System.Globalization;

namespace JustDummies.Playground.Catalogue;

/// <summary>
///     One parser per primitive parameter type the catalogue's generators actually take
///     (specification §10.7: "this parameter expects an integer"), plus the list form of each of
///     them — the type key <c>"System.Int32[]"</c> parses one text input as a comma-separated
///     <c>int[]</c>. Every parameter the generator discovers must resolve to a parser here or the
///     generator fails the build rather than silently skip it.
///
///     THE LIST FORM IS WHAT <c>Except</c> AND <c>OneOf</c> NEEDED. Both take
///     <c>params T[]</c> on every scalar builder in the library, and both were excluded from the
///     v1 catalogue for want of a multi-value input shape — which left the playground unable to
///     show two of the constraints a visitor is most likely to reach for ("a status among these
///     three", "any identifier but the ones already taken"). A comma-separated single field is
///     the shape that costs nothing structurally: the chain stays flat, one parameter is still
///     one <c>rawArguments[i]</c>, and each element goes through the very same scalar parser
///     below, so an element inherits its type's own error message and its own sandbox caps for
///     free.
///
///     <c>IEnumerable&lt;T&gt;</c> parameters are still out of scope, and deliberately: the one
///     that exists (<c>AnyString.OneOf(IEnumerable&lt;string&gt;)</c>) is the same constraint as
///     its <c>params</c> sibling, so cataloguing it would offer the visitor the identical step
///     twice.
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

    /// <summary>The full set of <em>scalar</em> parameter type keys, each parsed from one text
    /// input into one value. A list parameter's key is one of these with
    /// <see cref="ListTypeKeySuffix" /> appended — see <see cref="IsListTypeKey" />, and
    /// <see cref="IsKnownTypeKey" /> for the question the generator actually asks.</summary>
    public static readonly IReadOnlyCollection<string> KnownTypeKeys = new[] {
        TypeKeyString, TypeKeyBoolean, TypeKeyByte, TypeKeySByte, TypeKeyInt16, TypeKeyUInt16,
        TypeKeyInt32, TypeKeyUInt32, TypeKeyInt64, TypeKeyUInt64, TypeKeyInt128, TypeKeyUInt128,
        TypeKeySingle, TypeKeyDouble, TypeKeyHalf, TypeKeyDecimal, TypeKeyGuid, TypeKeyChar,
        TypeKeyDateOnly, TypeKeyDateTime, TypeKeyDateTimeOffset, TypeKeyTimeOnly, TypeKeyTimeSpan,
    };

    /// <summary>
    ///     What a list parameter's type key ends with: <c>"System.Int32[]"</c> is a comma-separated
    ///     <c>int[]</c>. Chosen to be exactly what <c>Type.FullName</c> already returns for an array
    ///     type, so the generated dispatch table's cast — <c>(global::System.Int32[])arg0!</c> —
    ///     needs no special case at all and stays the ordinary, statically typed call site §10.8
    ///     requires.
    /// </summary>
    public const string ListTypeKeySuffix = "[]";

    /// <summary>What separates one value from the next inside a list field. A comma, because the
    /// line the code bar prints beside the field separates the same values the same way — the
    /// field reads as the argument list it becomes.</summary>
    public const char ListSeparator = ',';

    /// <summary>Whether <paramref name="typeKey" /> names a list parameter rather than a scalar one.</summary>
    public static bool IsListTypeKey(string typeKey) => typeKey.EndsWith(ListTypeKeySuffix, StringComparison.Ordinal);

    /// <summary>The scalar type key each element of <paramref name="listTypeKey" /> is parsed as.</summary>
    public static string ElementTypeKeyOf(string listTypeKey) =>
        IsListTypeKey(listTypeKey) ? listTypeKey[..^ListTypeKeySuffix.Length] : listTypeKey;

    /// <summary>Whether <paramref name="typeKey" /> — scalar or list — has a parser here. This is
    /// the question tools/playground-catalogue asks of every parameter it discovers, and a "no"
    /// is what puts a member in the exclusion report instead of the catalogue.</summary>
    public static bool IsKnownTypeKey(string typeKey) => KnownTypeKeys.Contains(ElementTypeKeyOf(typeKey));

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
    public const string KeyExpectsTextWithinSandboxLength  = "argument.expectsTextWithinSandboxLength";

    /// <summary>What an empty list field expects. Deliberately a parse error rather than an empty
    /// array handed to the library: a freshly chosen step's arguments are empty, and every scalar
    /// parameter answers that state with "this argument expects an integer" — quiet, and clearly
    /// "you have not filled this in yet". Passing <c>OneOf()</c> with nothing in it instead would
    /// open the step on the library's own refusal, which is a louder thing to say about a field
    /// nobody has typed in.</summary>
    public const string KeyExpectsAtLeastOneValue           = "argument.expectsAtLeastOneValue";

    /// <summary>What a list field longer than <see cref="SandboxListLengthLimit" /> expects.</summary>
    public const string KeyExpectsListWithinSandboxLength   = "argument.expectsListWithinSandboxLength";

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
    ///     A ceiling on the length of any free-form text argument (e.g. <c>StartingWith</c>'s
    ///     prefix, <c>StringMatching</c>'s pattern text) this playground will store, replay
    ///     through the library, and re-embed into the copied code. Unlike the integer cap above,
    ///     an unbounded string has no natural failure mode inside the library itself — the risk
    ///     is entirely on this playground's own side, where every keystroke re-parses the whole
    ///     chain and rewrites <c>CodeText</c>, so a pasted multi-megabyte value would repeat that
    ///     work on every input event.
    /// </summary>
    public const int SandboxTextLengthLimit = 200;

    /// <summary>
    ///     A second, much larger ceiling the UI truncates raw input to at capture time —
    ///     deliberately not the same number as <see cref="SandboxTextLengthLimit" />. If the UI
    ///     truncated to that visible limit directly, every over-limit paste would already be
    ///     exactly at the limit by the time it reached <see cref="TryParse" />, and the "too
    ///     long" error this class exists to report would never actually fire — the chain would
    ///     just run silently on a value the visitor never typed. This ceiling exists only to
    ///     bound worst-case memory for a pathological multi-megabyte paste; anything under it,
    ///     however far over <see cref="SandboxTextLengthLimit" />, still reaches <see cref="TryParse" />
    ///     unmodified and gets the real, visible error.
    /// </summary>
    public const int SandboxTextLengthHardCeiling = 4_000;

    /// <summary>
    ///     A ceiling on how many values one list argument may carry. The third of this class's
    ///     sandbox caps, and it exists for the same reason as the other two rather than for the
    ///     library's sake: every keystroke in a chain re-parses every argument in it
    ///     (<c>IsWritableAsCode</c>) and rewrites the copied line (<c>CodeSegments</c>), so a
    ///     field holding a thousand values would repeat a thousand parses and a thousand literal
    ///     emissions on each one. Fifty is well past the point where the printed line
    ///     <c>OneOf("a", "b", …)</c> stopped being something a visitor reads, so the cap binds
    ///     long after the demonstration has stopped demonstrating anything.
    /// </summary>
    public const int SandboxListLengthLimit = 50;

    /// <summary>
    ///     Cuts a list field's raw text into the values it names: split on
    ///     <see cref="ListSeparator" />, each trimmed, empties dropped.
    ///
    ///     PUBLIC BECAUSE THE CODE BAR MUST CUT IT THE SAME WAY. <c>Home.razor</c> emits one C#
    ///     literal per value, and a bar that split differently from the parser would print a line
    ///     that does not produce what the playground just produced. One function, called by both,
    ///     makes that agreement structural rather than a pair of implementations that currently
    ///     match.
    ///
    ///     TRIMMED, so "red, green, blue" means the three words a visitor obviously meant rather
    ///     than one word and two with a leading space. EMPTIES DROPPED, so a trailing comma is
    ///     what it looks like mid-typing — an unfinished list — rather than an extra empty value
    ///     silently joining it.
    ///
    ///     WHAT THAT COSTS, stated rather than hidden: a value that is itself empty, or that
    ///     carries a leading/trailing space or a comma of its own, cannot be written in this
    ///     field — <c>Any.Char().Except(',')</c> has no spelling here. The code bar under the
    ///     card always prints the values as they will actually be passed, so a visitor who hits
    ///     one of these sees exactly what they got rather than wondering.
    /// </summary>
    public static IReadOnlyList<string> SplitList(string raw) {
        var values = new List<string>();

        foreach (var piece in raw.Split(ListSeparator)) {
            var trimmed = piece.Trim();
            if (trimmed.Length > 0) {
                values.Add(trimmed);
            }
        }

        return values;
    }

    /// <summary>
    ///     Parses <paramref name="raw" /> as <paramref name="typeKey" />, or returns the
    ///     <c>PlaygroundStrings</c> key naming what was expected.
    /// </summary>
    public static bool TryParse(string typeKey, string raw, out object? value, out string? errorKey) {
        if (IsListTypeKey(typeKey)) {
            return TryParseList(ElementTypeKeyOf(typeKey), raw, out value, out errorKey);
        }

        switch (typeKey) {
            case TypeKeyString:
                if (raw.Length > SandboxTextLengthLimit) {
                    value    = null;
                    errorKey = KeyExpectsTextWithinSandboxLength;
                    return false;
                }

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
                // DateTimeStyles.None still silently converts a zone-bearing input (a trailing
                // "Z" or explicit offset) through the host's local time zone, so the same input
                // could parse to a different instant depending on where the playground — or the
                // copied code — happens to run. DateTime doesn't carry a zone of its own; a
                // visitor who needs one is pointed at DateTimeOffset instead. It also fills in
                // a missing date from today's date, so a time-only input like "14:30" is
                // rejected too — the playground's own text asks for "a date and time", and an
                // accepted one would mean a different value on a different day.
                return TryParse(raw, KeyExpectsDateTime, (string s, out DateTime v) => {
                    v = default;
                    return !HasExplicitOffset(s) && HasExplicitDate(s) && DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out v);
                }, out value, out errorKey);
            case TypeKeyDateTimeOffset:
                // DateTimeOffset.TryParse silently fills in a missing offset with the host's
                // local one — the playground's own text promises "a date and time with an
                // offset", so an input without one is rejected before that silent fill-in can
                // make the same displayed chain mean a different instant depending on which
                // time zone parsed it (the browser's now, or wherever copied code runs later).
                // It fills in a missing date from today's date the same way, so an input like
                // "14:30+02:00" is rejected too — otherwise the same chain would mean a
                // different instant depending on which day it was entered or replayed on.
                return TryParse(raw, KeyExpectsDateTimeOffset, (string s, out DateTimeOffset v) => {
                    v = default;
                    return HasExplicitOffset(s) && HasExplicitDate(s) && DateTimeOffset.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out v);
                }, out value, out errorKey);
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

    /// <summary>
    ///     Parses one list field into the typed array its parameter takes.
    ///
    ///     THE ELEMENTS GO THROUGH <see cref="TryParse" /> ITSELF, one at a time, which is what
    ///     makes this cheap: an element inherits its own type's parsing rules (the invariant
    ///     culture, the offset and date requirements the date/time family enforces), its own
    ///     sandbox caps (<see cref="SandboxMagnitudeLimit" />, <see cref="SandboxTextLengthLimit" />)
    ///     and its own error key — so a visitor who types "1, x, 3" into an <c>int[]</c> field is
    ///     told "this argument expects an integer", in the very words every other integer field in
    ///     the playground uses. Naming the offending position too was the alternative; it would
    ///     need a message this playground writes only for lists, where the field is one input the
    ///     visitor is already looking at, and the shared vocabulary is worth more than the index.
    ///
    ///     The per-element type switch is written out rather than reached through
    ///     <c>Array.CreateInstance</c>: §10.8 forbids runtime reflection in the playground, and
    ///     each arm below is an ordinary <c>new T[]</c> the trimmer keeps like any other.
    /// </summary>
    private static bool TryParseList(string elementTypeKey, string raw, out object? value, out string? errorKey) {
        var values = SplitList(raw);

        if (values.Count == 0) {
            value    = null;
            errorKey = KeyExpectsAtLeastOneValue;
            return false;
        }

        if (values.Count > SandboxListLengthLimit) {
            value    = null;
            errorKey = KeyExpectsListWithinSandboxLength;
            return false;
        }

        switch (elementTypeKey) {
            case TypeKeyString:         return TryParseElements<string>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyBoolean:        return TryParseElements<bool>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyByte:           return TryParseElements<byte>(values, elementTypeKey, out value, out errorKey);
            case TypeKeySByte:          return TryParseElements<sbyte>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyInt16:          return TryParseElements<short>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyUInt16:         return TryParseElements<ushort>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyInt32:          return TryParseElements<int>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyUInt32:         return TryParseElements<uint>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyInt64:          return TryParseElements<long>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyUInt64:         return TryParseElements<ulong>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyInt128:         return TryParseElements<Int128>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyUInt128:        return TryParseElements<UInt128>(values, elementTypeKey, out value, out errorKey);
            case TypeKeySingle:         return TryParseElements<float>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyDouble:         return TryParseElements<double>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyHalf:           return TryParseElements<Half>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyDecimal:        return TryParseElements<decimal>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyGuid:           return TryParseElements<Guid>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyChar:           return TryParseElements<char>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyDateOnly:       return TryParseElements<DateOnly>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyDateTime:       return TryParseElements<DateTime>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyDateTimeOffset: return TryParseElements<DateTimeOffset>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyTimeOnly:       return TryParseElements<TimeOnly>(values, elementTypeKey, out value, out errorKey);
            case TypeKeyTimeSpan:       return TryParseElements<TimeSpan>(values, elementTypeKey, out value, out errorKey);
            default:
                // Unreachable for the same reason the scalar switch's own default is — the
                // generator fails the build on a parameter type nobody registered here.
                throw new InvalidOperationException($"no argument parser registered for type key '{elementTypeKey}{ListTypeKeySuffix}'");
        }
    }

    private static bool TryParseElements<T>(IReadOnlyList<string> values, string elementTypeKey, out object? value, out string? errorKey) {
        var parsed = new T[values.Count];

        for (var i = 0; i < values.Count; i++) {
            if (!TryParse(elementTypeKey, values[i], out var element, out errorKey)) {
                value = null;
                return false;
            }

            parsed[i] = (T)element!;
        }

        value    = parsed;
        errorKey = null;
        return true;
    }

    /// <summary>True if <paramref name="raw" /> ends with an explicit UTC/offset marker
    /// ("Z"/"z", or "+HH:mm"/"-HH:mm"/"+HH"/"-HH") <em>on a value that also carries a
    /// time</em> — the shapes ISO 8601 allows for a <c>DateTimeOffset</c>'s offset component.
    /// Checked before trusting
    /// <see cref="DateTimeOffset.TryParse(string, IFormatProvider, DateTimeStyles, out DateTimeOffset)" />,
    /// which accepts an offsetless string just as happily by silently assuming the host's own
    /// local offset.</summary>
    private static bool HasExplicitOffset(string raw) {
        var trimmed = raw.TrimEnd();

        // A time-of-day component is required by both branches below. A DateTimeOffset names
        // an instant, and the field asks for "a date and time with an offset" — "2026-08-15Z"
        // is a date wearing an offset, which TryParse would happily complete to midnight.
        // Every representation carrying a real time has a ':' in it; a bare date never does.
        if (trimmed.EndsWith('Z') || trimmed.EndsWith('z')) {
            return trimmed.Contains(':');
        }

        // "+HH:mm" / "-HH:mm" / "+HH" / "-HH", anchored to the end of the string — a plain
        // "-" appearing earlier (a date separator, e.g. the one in "2026-08-15" itself) must
        // not satisfy this.
        var signIndex = trimmed.Length - 6 >= 0 && (trimmed[^6] is '+' or '-') ? trimmed.Length - 6
            : trimmed.Length - 3 >= 0 && (trimmed[^3] is '+' or '-')           ? trimmed.Length - 3
            : -1;

        if (signIndex < 0) {
            return false;
        }

        // A date-only value's own separators ("2026-08-15") can land a '+'/'-' exactly 3
        // characters from the end too — "-15" reads the same as a "-HH" offset would. Requiring
        // a ':' somewhere before the sign rules that out: every representation with a real
        // time-of-day component carries one (e.g. "14:30:00"), and a bare date never does.
        if (!trimmed[..signIndex].Contains(':')) {
            return false;
        }

        return trimmed[(signIndex + 1)..].All(c => c is (>= '0' and <= '9') or ':');
    }

    /// <summary>True if <paramref name="raw" /> contains an ISO 8601 date component
    /// (<c>YYYY-MM-DD</c>) somewhere in it. Checked alongside <see cref="HasExplicitOffset" />
    /// for <c>DateTimeOffset</c>: <see cref="DateTimeOffset.TryParse(string, IFormatProvider, DateTimeStyles, out DateTimeOffset)" />
    /// fills in a missing date from today's date just as readily as it fills in a missing
    /// offset from the host's local one, so a time-only input like "14:30+02:00" would
    /// otherwise mean a different instant depending on which day it was entered or replayed
    /// on.</summary>
    private static bool HasExplicitDate(string raw) {
        for (var i = 0; i + 10 <= raw.Length; i++) {
            if (raw[i + 4] == '-' && raw[i + 7] == '-'
                && char.IsAsciiDigit(raw[i]) && char.IsAsciiDigit(raw[i + 1]) && char.IsAsciiDigit(raw[i + 2]) && char.IsAsciiDigit(raw[i + 3])
                && char.IsAsciiDigit(raw[i + 5]) && char.IsAsciiDigit(raw[i + 6])
                && char.IsAsciiDigit(raw[i + 8]) && char.IsAsciiDigit(raw[i + 9])) {
                return true;
            }
        }

        return false;
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
