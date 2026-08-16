using System.Reflection;
using JustDummies.Playground.Catalogue;

namespace JustDummies.PlaygroundCatalogueGenerator;

/// <summary>One catalogued member together with the reflection data the emitters need.</summary>
public sealed record CatalogueEntry(
    string      Key,
    string      MethodName,
    string      ReceiverTypeKey,
    string      ReturnTypeKey,
    Type?       ReceiverClrType, // null for entry points
    MethodInfo  Method,
    IReadOnlyList<ParameterDescriptor> Parameters,
    string      Summary,
    bool        IsTerminal);

/// <summary>One member the walker chose not to catalogue, with a human-readable reason.</summary>
public sealed record ExcludedEntry(string Member, string Reason, bool WasManual);

public sealed class WalkResult {
    public required IReadOnlyList<CatalogueEntry>  EntryPoints     { get; init; }
    public required IReadOnlyList<CatalogueEntry>  Members         { get; init; }
    public required IReadOnlyDictionary<string, Type> ReceiverTypes { get; init; }
    public required IReadOnlyList<ExcludedEntry>   AutoExcluded    { get; init; }
    public required IReadOnlyList<ExcludedEntry>   ManuallyExcluded { get; init; }
    public required IReadOnlyList<string>          UnusedManualExclusions { get; init; }
}

/// <summary>
///     Reflects over the JustDummies assembly and builds the v1 scalar catalogue: every static
///     entry point on a public static class (<c>Any</c> and its extension classes) whose return
///     type is a chain-eligible builder, and every public instance method reachable from there
///     whose parameters and return type v1 can express (specification §10.4, §10.5, §10.7).
/// </summary>
public sealed class CatalogueWalker {

    private static readonly HashSet<string> ObjectMethodNames = new() { "Equals", "GetHashCode", "ToString", "GetType" };

    private readonly Assembly _libraryAssembly;
    private readonly IReadOnlyDictionary<string, DocEntry> _docs;
    private readonly ManualExclusions _manualExclusions;
    private readonly HashSet<string> _usedManualExclusionKeys = new();

    public CatalogueWalker(Assembly libraryAssembly, IReadOnlyDictionary<string, DocEntry> docs, ManualExclusions manualExclusions) {
        _libraryAssembly = libraryAssembly;
        _docs = docs;
        _manualExclusions = manualExclusions;
    }

    public WalkResult Walk() {
        var entryPoints  = new List<CatalogueEntry>();
        var members      = new List<CatalogueEntry>();
        var receiverTypes = new Dictionary<string, Type>();
        var autoExcluded = new List<ExcludedEntry>();
        var manuallyExcluded = new List<ExcludedEntry>();
        var seenKeys     = new HashSet<string>();
        var toVisit      = new Queue<Type>();
        var enqueued     = new HashSet<Type>();

        // 1. Static entry points: every public static class (Any itself, and its extension classes)
        //    is scanned the same way — a static class in this library never carries anything but
        //    generator entry points and extension methods, so no name list is needed.
        foreach (var staticClass in _libraryAssembly.GetExportedTypes().Where(IsStaticClass)) {
            foreach (var method in staticClass.GetMethods(BindingFlags.Public | BindingFlags.Static).Where(m => !m.IsSpecialName)) {
                var docId = DocIdOf(method);

                if (TryApplyManualExclusion(docId, staticClass.Name, method, manuallyExcluded)) {
                    continue;
                }

                var classification = Classify(method, receiver: null);

                if (!classification.Eligible) {
                    autoExcluded.Add(new ExcludedEntry(docId, classification.Reason!, WasManual: false));
                    continue;
                }

                var entry = ToEntry(method, CatalogueKeys.EntryPointReceiver, receiverClrType: null, isTerminal: false);
                if (!seenKeys.Add(entry.Key)) {
                    throw new InvalidOperationException($"two eligible entry points share the key '{entry.Key}' — overload resolution is not supported in v1.");
                }

                entryPoints.Add(entry);
                Enqueue(classification.ReturnType!, toVisit, enqueued);
            }
        }

        // 2. Chain-eligible builder types reachable from those entry points, breadth-first.
        while (toVisit.Count > 0) {
            var receiverType = toVisit.Dequeue();
            var receiverKey  = receiverType.Name;
            if (!receiverTypes.TryAdd(receiverKey, receiverType)) {
                continue;
            }

            foreach (var method in receiverType.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly).Where(m => !m.IsSpecialName)) {
                if (ObjectMethodNames.Contains(method.Name)) {
                    continue;
                }

                var isTerminalGenerate = method.Name == "Generate" && method.GetParameters().Length == 0;
                var docId = DocIdOf(method);

                if (TryApplyManualExclusion(docId, receiverType.Name, method, manuallyExcluded)) {
                    continue;
                }

                if (isTerminalGenerate) {
                    var terminalEntry = ToEntry(method, receiverKey, receiverType, isTerminal: true);
                    if (!seenKeys.Add(terminalEntry.Key)) {
                        throw new InvalidOperationException($"duplicate key '{terminalEntry.Key}'.");
                    }

                    members.Add(terminalEntry);
                    continue;
                }

                var classification = Classify(method, receiverType);

                if (!classification.Eligible) {
                    autoExcluded.Add(new ExcludedEntry(docId, classification.Reason!, WasManual: false));
                    continue;
                }

                var entry = ToEntry(method, receiverKey, receiverType, isTerminal: false);
                if (!seenKeys.Add(entry.Key)) {
                    throw new InvalidOperationException($"two eligible members share the key '{entry.Key}' on '{receiverKey}' — overload resolution is not supported in v1.");
                }

                members.Add(entry);
                Enqueue(classification.ReturnType!, toVisit, enqueued);
            }
        }

        var unusedManualExclusions = _manualExclusions.UnusedKeys(_usedManualExclusionKeys);

        return new WalkResult {
            EntryPoints            = entryPoints,
            Members                = members,
            ReceiverTypes          = receiverTypes,
            AutoExcluded           = autoExcluded,
            ManuallyExcluded       = manuallyExcluded,
            UnusedManualExclusions = unusedManualExclusions,
        };
    }

    /// <summary>
    ///     Checked before structural classification, for every discovered member — not only ones
    ///     classification already rejected. A member editorially excluded via
    ///     excluded-members.jsonc (specification §10.6) can be structurally eligible; checking only
    ///     after an automatic rejection would mean that entry never matches, and would report as
    ///     stale a manual exclusion that is doing exactly what it was written to do.
    /// </summary>
    private bool TryApplyManualExclusion(string docId, string declaringTypeName, MethodInfo method, List<ExcludedEntry> manuallyExcluded) {
        var precise  = PreciseKeyOf(declaringTypeName, method);
        var nameOnly = NameOnlyKeyOf(declaringTypeName, method);

        if (_manualExclusions.TryGet(precise, out var reason)) {
            _usedManualExclusionKeys.Add(precise);
            manuallyExcluded.Add(new ExcludedEntry(docId, reason, WasManual: true));
            return true;
        }

        if (_manualExclusions.TryGet(nameOnly, out reason)) {
            _usedManualExclusionKeys.Add(nameOnly);
            manuallyExcluded.Add(new ExcludedEntry(docId, reason, WasManual: true));
            return true;
        }

        return false;
    }

    private static bool IsStaticClass(Type t) => t is { IsAbstract: true, IsSealed: true, IsClass: true };

    private static void Enqueue(Type type, Queue<Type> toVisit, HashSet<Type> enqueued) {
        if (enqueued.Add(type)) {
            toVisit.Enqueue(type);
        }
    }

    private CatalogueEntry ToEntry(MethodInfo method, string receiverTypeKey, Type? receiverClrType, bool isTerminal) {
        var docId = DocIdOf(method);
        var doc   = _docs.GetValueOrDefault(docId) ?? throw new InvalidOperationException($"no XML documentation found for '{docId}'.");

        // IAny<T>.Generate() is documented once, on the interface; every concrete generator's own
        // override carries only <inheritdoc/>, which this reader does not resolve generally — the
        // interface's own doc entry is the one real case worth resolving by hand.
        if (string.IsNullOrWhiteSpace(doc.Summary) && isTerminal) {
            doc = _docs.GetValueOrDefault($"M:JustDummies.IAny`1.{method.Name}")
                  ?? throw new InvalidOperationException($"'{docId}' has no <summary>, and its inherited source 'IAny<T>.{method.Name}' was not found either.");
        }

        if (string.IsNullOrWhiteSpace(doc.Summary)) {
            throw new InvalidOperationException($"'{docId}' has no <summary> in the shipped XML documentation.");
        }

        var parameters = method.GetParameters().Select(p => {
            var typeKey     = TypeKeyOf(p.ParameterType);
            var placeholder = doc.Parameters.TryGetValue(p.Name!, out var text) && !string.IsNullOrWhiteSpace(text)
                ? text
                : p.Name!;

            return new ParameterDescriptor(p.Name!, typeKey, placeholder);
        }).ToList();

        var returnTypeKey = isTerminal ? "Terminal:" + method.ReturnType.FullName : method.ReturnType.Name;

        // Some members are overloaded on arity alone (e.g. AnyWebUri.WithUserInfo() / (string) /
        // (string, string)) — arity keeps the key unique without needing full overload resolution,
        // which v1 does not support. The Blazor UI distinguishes them for the visitor using each
        // entry's own Parameters list, not this key.
        var key = $"{receiverTypeKey}::{method.Name}#{parameters.Count}";

        return new CatalogueEntry(key, method.Name, receiverTypeKey, returnTypeKey, receiverClrType, method, parameters, doc.Summary, isTerminal);
    }

    private (bool Eligible, string? Reason, Type? ReturnType) Classify(MethodInfo method, Type? receiver) {
        if (method.IsGenericMethodDefinition) {
            return (false, "open generic method — no closed instantiation is expressible as a flat chain step in v1", null);
        }

        if (!IsChainEligibleType(method.ReturnType)) {
            return (false, $"return type '{method.ReturnType.Name}' does not implement IAny<T> — not a chain-eligible step", null);
        }

        foreach (var parameter in method.GetParameters()) {
            var parameterReason = ClassifyParameter(parameter.ParameterType);
            if (parameterReason is not null) {
                return (false, parameterReason, null);
            }
        }

        return (true, null, method.ReturnType);
    }

    private string? ClassifyParameter(Type parameterType) {
        if (typeof(Delegate).IsAssignableFrom(parameterType)) {
            return "takes a delegate parameter — not expressible through a form input, and forbidden by §10.3 (compiling visitor-submitted code)";
        }

        if (IsAnyOfType(parameterType)) {
            return "takes an IAny<T> parameter — composing a nested generator has no flat-chain representation in v1";
        }

        if (parameterType != typeof(string) && (parameterType.IsArray || IsEnumerableType(parameterType))) {
            return "takes a collection-typed parameter — no v1 form-input shape for a multi-value argument";
        }

        var typeKey = TypeKeyOf(parameterType);
        if (!ArgumentParsing.KnownTypeKeys.Contains(typeKey)) {
            return $"parameter type '{typeKey}' has no known argument parser";
        }

        return null;
    }

    private static bool IsChainEligibleType(Type t) =>
        t is { IsPublic: true, IsClass: true } && t.GetInterfaces().Any(IsAnyOfType);

    private static bool IsAnyOfType(Type t) => t.IsGenericType && t.GetGenericTypeDefinition() == typeof(IAny<>);

    private static bool IsEnumerableType(Type t) =>
        t != typeof(string) && (t.GetInterfaces().Prepend(t).Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>))
                                 || typeof(System.Collections.IEnumerable).IsAssignableFrom(t));

    private static string TypeKeyOf(Type t) => t.FullName ?? t.Name;

    /// <summary>
    ///     The standard XML-doc member ID for <paramref name="method" /> — "M:Namespace.Type.Method"
    ///     or "M:Namespace.Type.Method(Param1,Param2)", matching the keys JustDummies.xml itself
    ///     uses. Handles generic methods and generic parameter types explicitly (double-backtick
    ///     method type-parameter markers, single-backtick declaring-type markers, braces for
    ///     constructed generic types) rather than relying on <see cref="Type.FullName" />, which is
    ///     <c>null</c> for an open generic parameter — every excluded generic member would otherwise
    ///     collapse to the same empty-parenthesis ID, indistinguishable from its siblings in the
    ///     exclusion report (specification §10.6 needs that report to actually name what it excludes).
    /// </summary>
    private static string DocIdOf(MethodInfo method) {
        var declaring = method.DeclaringType!.FullName;
        var name = method.IsGenericMethodDefinition
            ? $"{method.Name}``{method.GetGenericArguments().Length}"
            : method.Name;

        var parameters = method.GetParameters();
        if (parameters.Length == 0) {
            return $"M:{declaring}.{name}";
        }

        var paramList = string.Join(",", parameters.Select(p => DocTypeName(p.ParameterType)));
        return $"M:{declaring}.{name}({paramList})";
    }

    /// <summary>The doc-ID form of a type: itself for an ordinary closed type, a backtick-indexed
    /// marker for a generic parameter, or "Namespace.Type{Arg1,Arg2}" for a constructed generic type.</summary>
    private static string DocTypeName(Type t) {
        if (t.IsGenericMethodParameter) {
            return $"``{t.GenericParameterPosition}";
        }

        if (t.IsGenericTypeParameter) {
            return $"`{t.GenericParameterPosition}";
        }

        if (t.IsArray) {
            return DocTypeName(t.GetElementType()!) + "[]";
        }

        if (t.IsGenericType && !t.IsGenericTypeDefinition) {
            var definitionName = t.GetGenericTypeDefinition().FullName!;
            var arityMarker    = definitionName.IndexOf('`');
            var baseName       = arityMarker < 0 ? definitionName : definitionName[..arityMarker];
            var args           = string.Join(",", t.GetGenericArguments().Select(DocTypeName));
            return $"{baseName}{{{args}}}";
        }

        return t.FullName ?? t.Name;
    }

    private static string PreciseKeyOf(string declaringTypeName, MethodInfo method) {
        var parameters = method.GetParameters();
        if (parameters.Length == 0) {
            return $"{declaringTypeName}.{method.Name}";
        }

        var paramList = string.Join(",", parameters.Select(p => p.ParameterType.Name));
        return $"{declaringTypeName}.{method.Name}({paramList})";
    }

    private static string NameOnlyKeyOf(string declaringTypeName, MethodInfo method) => $"{declaringTypeName}.{method.Name}";

}
