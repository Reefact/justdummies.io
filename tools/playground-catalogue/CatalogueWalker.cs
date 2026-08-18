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

/// <summary>
///     Why a discovered member is not a catalogued chain step. Two causes, and only one of them
///     is something the playground should name to a visitor.
/// </summary>
public enum ExclusionCause {

    /// <summary>
    ///     Not a step at all: its return type is not a chain-eligible builder, so no expression
    ///     could continue through it — <c>Any.UseSeed(...)</c>, <c>Any.Reproducibly(...)</c>. These
    ///     belong to a different part of the library's surface, and offering one in a combo whose
    ///     every entry is "the next call in this expression" would be a category error rather than
    ///     a limitation honestly declared.
    /// </summary>
    NotAChainStep,

    /// <summary>
    ///     A real chain step this web form cannot express — an open generic, a lambda, a nested
    ///     generator, a multi-value argument. This is the cause that becomes a named, disabled
    ///     option (<see cref="PlaygroundSupport.UnavailableInPlayground" />).
    /// </summary>
    InterfaceCannotExpress,

}

/// <summary>One member of the real library the interface cannot offer, kept so the combo can name
/// it. Carries only what naming it takes — the receiver whose combo it belongs in, and the method
/// name. There are no arguments to describe: not being able to ask for them is the reason it is
/// here.</summary>
public sealed record UnavailableEntry(string Key, string MethodName, string ReceiverTypeKey);

public sealed class WalkResult {
    public required IReadOnlyList<CatalogueEntry>  EntryPoints     { get; init; }
    public required IReadOnlyList<CatalogueEntry>  Members         { get; init; }
    public required IReadOnlyList<UnavailableEntry> Unavailable    { get; init; }
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

        // Named but not offered (PlaygroundSupport.UnavailableInPlayground). Two collections
        // because the two are found at different moments: one is attributable to a receiver on
        // sight, the other only once every receiver type is known — see step 3.
        var unavailable          = new List<UnavailableEntry>();
        var unavailableOnEvery   = new List<string>();

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

                    if (classification.Cause is ExclusionCause.InterfaceCannotExpress) {
                        // WHERE THIS STATIC METHOD BELONGS IN THE UI IS NOT WHERE IT WAS FOUND.
                        // Every public static class is scanned here, and they hold two different
                        // kinds of thing: Any's own methods, which open a chain, and extension
                        // methods on IAny<T> (AnyExtensions.As, NullableExtensions.OrNull), which
                        // continue one. Filing the second kind under the entry-point receiver
                        // would put `.OrNull()` in the combo that picks a generator, where it is
                        // not a thing a visitor could ever have written.
                        if (ExtendsAnyGenerator(method)) {
                            unavailableOnEvery.Add(method.Name);
                        } else if (staticClass == typeof(Any)) {
                            unavailable.Add(new UnavailableEntry(
                                UnavailableKeyOf(CatalogueKeys.EntryPointReceiver, method.Name),
                                method.Name,
                                CatalogueKeys.EntryPointReceiver));
                        }
                    }

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

                    if (classification.Cause is ExclusionCause.InterfaceCannotExpress) {
                        unavailable.Add(new UnavailableEntry(UnavailableKeyOf(receiverKey, method.Name), method.Name, receiverKey));
                    }

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

        // 3. An extension method on IAny<T> is callable on every generator there is, so it is
        //    unavailable on every one of them. Done here rather than in the loop above because the
        //    set of receivers is only complete once the breadth-first walk has finished.
        foreach (var receiverKey in receiverTypes.Keys) {
            foreach (var methodName in unavailableOnEvery) {
                unavailable.Add(new UnavailableEntry(UnavailableKeyOf(receiverKey, methodName), methodName, receiverKey));
            }
        }

        var unusedManualExclusions = _manualExclusions.UnusedKeys(_usedManualExclusionKeys);

        return new WalkResult {
            EntryPoints            = entryPoints,
            Members                = members,
            Unavailable            = NameOncePerReceiver(unavailable, entryPoints.Concat(members)),
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

    /// <summary>
    ///     One entry per name per receiver, and never a name the same receiver already offers.
    ///
    ///     BOTH HALVES ARE ABOUT OVERLOADS, which the combo has no way to show apart — its
    ///     unavailable entries print a bare <c>Name()</c>, because not being able to ask for the
    ///     arguments is why they are unavailable in the first place. Seven overloads of
    ///     <c>Combine</c> would therefore be seven identical dead lines.
    ///
    ///     The shadowing half is the one that would otherwise lie. <c>Any.StringMatching(string)</c>
    ///     is catalogued and works; <c>Any.StringMatching(Regex)</c> has no parser and does not.
    ///     Listing the second would put "StringMatching() — not available in the playground"
    ///     directly under a working "StringMatching(pattern)", which reads as a contradiction and
    ///     resolves, for a visitor, into "some of this is broken". A name with any working overload
    ///     is an available name; what an unavailable option means is that nothing behind this name
    ///     can be called here at all.
    /// </summary>
    private static IReadOnlyList<UnavailableEntry> NameOncePerReceiver(
        IEnumerable<UnavailableEntry> unavailable,
        IEnumerable<CatalogueEntry> catalogued) {
        var offered = catalogued
            .Select(entry => (entry.ReceiverTypeKey, entry.MethodName))
            .ToHashSet();

        return unavailable
            .Where(entry => !offered.Contains((entry.ReceiverTypeKey, entry.MethodName)))
            .GroupBy(entry => entry.Key, StringComparer.Ordinal)
            .Select(group => group.First())
            .OrderBy(entry => entry.ReceiverTypeKey, StringComparer.Ordinal)
            .ThenBy(entry => entry.MethodName, StringComparer.Ordinal)
            .ToList();
    }

    /// <summary>
    ///     Deliberately without the <c>#arity</c> marker a catalogued key carries: this key names a
    ///     method name on a receiver, not one overload of it (see <see cref="NameOncePerReceiver" />).
    ///     The shape still cannot collide with a catalogued key, since every one of those ends in
    ///     that marker.
    /// </summary>
    private static string UnavailableKeyOf(string receiverTypeKey, string methodName) => $"{receiverTypeKey}::{methodName}";

    /// <summary>Whether this static method is an extension method whose receiver is a generator —
    /// <c>this IAny&lt;T&gt; source</c>. Those chain onto every builder rather than opening a
    /// chain, which is what step 3 of <see cref="Walk" /> does with them.</summary>
    private static bool ExtendsAnyGenerator(MethodInfo method) =>
        method.IsDefined(typeof(System.Runtime.CompilerServices.ExtensionAttribute), inherit: false)
        && method.GetParameters() is [var first, ..]
        && (IsAnyOfType(first.ParameterType) || first.ParameterType.GetInterfaces().Any(IsAnyOfType));

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

    /// <summary>
    ///     The cause rides on the first test that rejects, so the order of the tests decides it —
    ///     and the open-generic test is deliberately first. What stops <c>Any.ListOf&lt;T&gt;(...)</c>
    ///     is the type argument this form cannot ask for, not anything about its return type, and
    ///     reaching the return-type test at all would file it under <see cref="ExclusionCause.NotAChainStep" />
    ///     — the one cause the UI keeps to itself (ADR-0015).
    /// </summary>
    private (bool Eligible, string? Reason, ExclusionCause? Cause, Type? ReturnType) Classify(MethodInfo method, Type? receiver) {
        if (method.IsGenericMethodDefinition) {
            return (false, "open generic method — no closed instantiation is expressible as a flat chain step in v1", ExclusionCause.InterfaceCannotExpress, null);
        }

        if (!IsChainEligibleType(method.ReturnType)) {
            return (false, $"return type '{method.ReturnType.Name}' does not implement IAny<T> — not a chain-eligible step", ExclusionCause.NotAChainStep, null);
        }

        foreach (var parameter in method.GetParameters()) {
            var parameterReason = ClassifyParameter(parameter);
            if (parameterReason is not null) {
                return (false, parameterReason, ExclusionCause.InterfaceCannotExpress, null);
            }
        }

        return (true, null, null, method.ReturnType);
    }

    /// <summary>
    ///     Whether one parameter has a shape the playground can ask a visitor for, and the reason
    ///     it does not when it does not (specification §10.6 — an omission states why).
    ///
    ///     A SCALAR IS ONE TEXT INPUT; A <c>params T[]</c> OF SCALARS IS ONE TEXT INPUT TOO,
    ///     comma-separated (see <c>ArgumentParsing.SplitList</c>). That second form is what brings
    ///     <c>Except</c> and <c>OneOf</c> into the catalogue — every scalar builder in the library
    ///     declares both as <c>params</c>, and neither needs anything of the chain but the flat
    ///     step it already was.
    /// </summary>
    private string? ClassifyParameter(ParameterInfo parameter) {
        var parameterType = parameter.ParameterType;

        if (typeof(Delegate).IsAssignableFrom(parameterType)) {
            return "takes a delegate parameter — not expressible through a form input, and forbidden by §10.3 (compiling visitor-submitted code)";
        }

        if (IsAnyOfType(parameterType)) {
            return "takes an IAny<T> parameter — composing a nested generator has no flat-chain representation in v1";
        }

        if (parameterType.IsArray) {
            var elementType = parameterType.GetElementType()!;

            if (typeof(Delegate).IsAssignableFrom(elementType) || IsAnyOfType(elementType) || elementType.IsArray) {
                return $"takes an array of '{elementType.Name}' — only an array of scalars has a comma-separated input shape";
            }

            // The emitted C# spreads the values into the call — OneOf("red", "green") — which is
            // both what a visitor would write themselves and what the code bar has room to print.
            // A plain (non-params) array parameter would need `new[] { ... }` instead, so it is
            // excluded rather than emitted in a second shape: nothing in the library declares one
            // today, and if that ever changes this report is where it says so.
            if (!parameter.IsDefined(typeof(ParamArrayAttribute), inherit: false)) {
                return "takes a non-params array parameter — the catalogue's list form emits a params spread, which a plain array parameter cannot take";
            }
        } else if (IsEnumerableType(parameterType)) {
            return "takes a non-array collection parameter — the catalogue's list form covers params arrays only";
        }

        var typeKey = TypeKeyOf(parameterType);
        if (!ArgumentParsing.IsKnownTypeKey(typeKey)) {
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
