using System.Reflection;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Xml.Linq;

using JustDummies;
using JustDummies.Xunit;

namespace JustDummies.ApiCatalogue;

/// <summary>
///     Reflects on the published <c>JustDummies</c> and <c>JustDummies.Xunit</c> packages and
///     writes the catalogue the /api pages render.
///
///     What is derived: every signature, every summary, every parameter — read off the
///     assemblies and their XML documentation, never typed here. What is decided here: which
///     category a type belongs to. That grouping is an editorial call reflection cannot make on
///     its own, so it is a dictionary rather than a guess — and a type reflection finds that this
///     dictionary does not know fails the build (<see cref="CategoryOf" />), the same way an
///     undocumented diagnostic fails the build elsewhere in this repository. A silent catalogue
///     is worse than a build that stops to ask.
/// </summary>
public static class Program {

    public static int Main(string[] args) {
        if (args.Length != 1) {
            Console.Error.WriteLine("usage: api-catalogue <output-file>");

            return 1;
        }

        Assembly library = typeof(Any).Assembly;
        Assembly adapter = typeof(ReproducibleAttribute).Assembly;

        XmlDocCorpus docs = XmlDocs.Merge(XmlDocs.Load(library), XmlDocs.Load(adapter));

        Type[] types = library.GetExportedTypes().Concat(adapter.GetExportedTypes()).ToArray();

        CatalogueBuilder builder = new(docs);

        foreach (Type type in types) {
            builder.AddType(type);
        }

        builder.AddLooseAnyMembers(typeof(Any));

        CatalogueDocument document = builder.Build(
            new LibraryFacts(GetInformationalVersion(library), GetInformationalVersion(adapter)));

        // No DefaultIgnoreCondition: a null field is written as `null`, not omitted. apiCatalogue.ts
        // declares fields like `extends` and `entryPoints` as `T | null`, and the Astro components
        // branch on `!== null` — an omitted key would read back as `undefined`, which is `!== null`
        // too, and would make a page try to render a member list that was never there.
        JsonSerializerOptions jsonOptions = new() {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        };

        string json = JsonSerializer.Serialize(document, jsonOptions);

        File.WriteAllText(args[0], json + Environment.NewLine);

        int entryCount = document.Categories.Sum(category => category.Entries.Length);

        Console.WriteLine($"  {args[0]}  ({document.Categories.Length} categories, {entryCount} entries, {docs.Summaries.Count} doc comments)");

        return 0;
    }

    /// <summary>
    ///     The version a visitor would actually install, read off the assembly rather than typed
    ///     beside it — <c>Directory.Packages.props</c> makes the same argument for why this
    ///     matters and where the one spot to raise it lives.
    /// </summary>
    private static string GetInformationalVersion(Assembly assembly) {
        string? version = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;

        if (version is null) {
            throw new InvalidOperationException($"{assembly.GetName().Name} carries no informational version.");
        }

        // Local builds append a `+<commit sha>` metadata suffix that a NuGet version string
        // does not carry and a reader has no use for; `site.ts`'s own version string doesn't
        // carry one either.
        int plus = version.IndexOf('+');

        return plus < 0 ? version : version[..plus];
    }
}

/// <summary>A fact the /api pages state about where the documented surface comes from.</summary>
internal sealed record LibraryFacts(string LibraryVersion, string XunitVersion);

internal sealed record CatalogueDocument(LibraryFacts Library, CategoryDocument[] Categories);

internal sealed record CategoryDocument(string Slug, EntryDocument[] Entries);

internal sealed record EntryDocument(
    string Id,
    string Name,
    string Kind,
    string Signature,
    string? Summary,
    string? Extends,
    string[] Implements,
    MethodDocument[]? EntryPoints,
    PropertyDocument[] Properties,
    MethodDocument[] Constructors,
    MethodDocument[] Methods);

internal sealed record MethodDocument(string Signature, string? Summary);

internal sealed record PropertyDocument(string Signature, string? Summary);

/// <summary>
///     Every category this catalogue knows how to place a type or a loose static member into,
///     and the only place that ordering is decided — a page reads <see cref="CategoryDocument.Slug" />
///     to route the entry, and its position in this array is the ordering.
/// </summary>
internal static class Categories {
    public const string EntryPoint = "entry-point";
    public const string Primitives = "primitives";
    public const string Uris = "uris";
    public const string Collections = "collections";
    public const string Composition = "composition";
    public const string Reproducibility = "reproducibility";
    public const string PoolInspection = "pool-inspection";
    public const string Exceptions = "exceptions";

    public static readonly string[] Order = [EntryPoint, Primitives, Uris, Collections, Composition, Reproducibility, PoolInspection, Exceptions];
}

/// <summary>
///     Turns reflected types and their XML documentation into <see cref="CatalogueDocument" />.
///
///     Two kinds of entry end up here. Most types become one entry each, housing the static
///     entry-point method on <see cref="Any" /> that produces them (<see cref="AddType" /> finds
///     it by matching return types — <c>Any.String()</c> returns <see cref="AnyString" />, so it
///     is attached there rather than repeated on its own). A handful of static members on
///     <see cref="Any" /> do not return a type this catalogue documents on its own — <c>Combine</c>,
///     <c>PairOf</c>, <c>TripleOf</c>, <c>UseSeed</c>, <c>Reproducibly</c>, <c>ReproduciblyAsync</c>
///     — and <see cref="AddLooseAnyMembers" /> gives each of those its own entry instead, grouping
///     overloads under one name.
/// </summary>
internal sealed class CatalogueBuilder {

    /// <summary>
    ///     Every exported type this catalogue knows how to place, and where. A type reflection
    ///     finds that is missing here fails the build (<see cref="CategoryOf" />) rather than
    ///     being silently left off the page — the same "an omission fails the build" rule the
    ///     specification asks of the diagnostics catalogue.
    /// </summary>
    private static readonly Dictionary<string, string> TypeCategory = new() {
        ["Any"] = Categories.EntryPoint,
        ["AnyContext"] = Categories.EntryPoint,
        ["IAny`1"] = Categories.EntryPoint,

        ["AnyString"] = Categories.Primitives,
        ["AnyPattern"] = Categories.Primitives,
        ["AnyBoolean"] = Categories.Primitives,
        ["AnyGuid"] = Categories.Primitives,
        ["AnyChar"] = Categories.Primitives,
        ["AnyEnum`1"] = Categories.Primitives,
        ["AnySByte"] = Categories.Primitives,
        ["AnyByte"] = Categories.Primitives,
        ["AnyInt16"] = Categories.Primitives,
        ["AnyUInt16"] = Categories.Primitives,
        ["AnyInt32"] = Categories.Primitives,
        ["AnyUInt32"] = Categories.Primitives,
        ["AnyInt64"] = Categories.Primitives,
        ["AnyUInt64"] = Categories.Primitives,
        ["AnyInt128"] = Categories.Primitives,
        ["AnyUInt128"] = Categories.Primitives,
        ["AnyHalf"] = Categories.Primitives,
        ["AnySingle"] = Categories.Primitives,
        ["AnyDouble"] = Categories.Primitives,
        ["AnyDecimal"] = Categories.Primitives,
        ["AnyDateTime"] = Categories.Primitives,
        ["AnyDateTimeOffset"] = Categories.Primitives,
        ["AnyDateOnly"] = Categories.Primitives,
        ["AnyTimeOnly"] = Categories.Primitives,
        ["AnyTimeSpan"] = Categories.Primitives,

        ["AnyUri"] = Categories.Uris,
        ["AnyWebUri"] = Categories.Uris,
        ["AnyWebSocketUri"] = Categories.Uris,
        ["AnyFtpUri"] = Categories.Uris,
        ["AnyMailtoUri"] = Categories.Uris,
        ["AnyRelativeUri"] = Categories.Uris,

        ["AnyCollection`3"] = Categories.Collections,
        ["AnyArray`1"] = Categories.Collections,
        ["AnyList`1"] = Categories.Collections,
        ["AnySequence`1"] = Categories.Collections,
        ["AnySet`1"] = Categories.Collections,
        ["AnyDictionary`2"] = Categories.Collections,

        ["AnyExtensions"] = Categories.Composition,
        ["NullableExtensions"] = Categories.Composition,
        ["NullableReferenceExtensions"] = Categories.Composition,
        ["AnyOneOf`1"] = Categories.Composition,

        ["ReproducibleAttribute"] = Categories.Reproducibility,

        ["DeclaredConstraint"] = Categories.PoolInspection,
        ["IPoolInspection`1"] = Categories.PoolInspection,
        ["PoolRejection`1"] = Categories.PoolInspection,

        ["DummyException"] = Categories.Exceptions,
        ["ConflictingAnyConstraintException"] = Categories.Exceptions,
        ["AnyGenerationException"] = Categories.Exceptions,
        ["UnsupportedRegexException"] = Categories.Exceptions,
    };

    /// <summary>
    ///     The static members of <see cref="Any" /> that do not return a type this catalogue
    ///     houses on its own (<see cref="AddType" /> would have nowhere to attach them), so
    ///     <see cref="AddLooseAnyMembers" /> gives each name its own entry instead. A method on
    ///     <see cref="Any" /> that is neither auto-housed nor listed here fails the build.
    /// </summary>
    private static readonly Dictionary<string, string> LooseMemberCategory = new() {
        ["Combine"] = Categories.Composition,
        ["PairOf"] = Categories.Composition,
        ["TripleOf"] = Categories.Composition,
        ["UseSeed"] = Categories.Reproducibility,
        ["Reproducibly"] = Categories.Reproducibility,
        ["ReproduciblyAsync"] = Categories.Reproducibility,
    };

    private readonly XmlDocCorpus docs;
    private readonly Dictionary<string, EntryBuilder> entriesByTypeName = new();
    private readonly List<EntryBuilder> looseEntries = [];

    public CatalogueBuilder(XmlDocCorpus docs) {
        this.docs = docs;
    }

    public void AddType(Type type) {
        string category = CategoryOf(type);
        EntryBuilder entry = EntryBuilder.From(type, category, docs);

        entriesByTypeName[Signatures.SimpleName(type)] = entry;
    }

    /// <summary>
    ///     Walks every public static method of <see cref="Any" />: houses it under the entry
    ///     for the type it returns when that type is catalogued, or gives it its own entry under
    ///     <see cref="LooseMemberCategory" /> when it is not. Every method must resolve one way
    ///     or the other.
    /// </summary>
    public void AddLooseAnyMembers(Type anyType) {
        var overloadsByName = anyType
            .GetMethods(BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Where(method => !method.IsSpecialName)
            .GroupBy(method => method.Name);

        foreach (var overloads in overloadsByName) {
            MethodInfo[] methods = overloads.ToArray();
            Type returnType = methods[0].ReturnType;
            string returnTypeName = Signatures.SimpleName(returnType);

            // The bare contract is never a housing target: Type.Name carries no generic
            // arguments, so Combine/PairOf/TripleOf — which return IAny<TResult> for whatever
            // TResult the caller composes — would otherwise match the interface's own entry by
            // name alone and read as though IAny<T> is how you construct one, rather than the
            // shape every generator happens to satisfy.
            bool returnsTheBareContract = returnType.IsGenericType && returnType.GetGenericTypeDefinition() == typeof(IAny<>);

            if (!returnsTheBareContract && entriesByTypeName.TryGetValue(returnTypeName, out EntryBuilder? housing)) {
                housing.AddEntryPoints(methods, docs);

                continue;
            }

            if (!LooseMemberCategory.TryGetValue(overloads.Key, out string? category)) {
                throw new InvalidOperationException(
                    $"Any.{overloads.Key} returns {Signatures.Friendly(returnType)}, which this catalogue does not house and " +
                    $"which is not in {nameof(LooseMemberCategory)}. Categorise it — this is exactly the omission the build " +
                    "is here to catch.");
            }

            looseEntries.Add(EntryBuilder.FromLooseMethods(overloads.Key, category, methods, docs));
        }
    }

    public CatalogueDocument Build(LibraryFacts library) {
        var byCategory = entriesByTypeName.Values.Concat(looseEntries)
            .GroupBy(entry => entry.Category)
            .ToDictionary(group => group.Key, group => group.OrderBy(entry => entry.Name, StringComparer.Ordinal).ToArray());

        CategoryDocument[] categories = Categories.Order
            .Select(slug => new CategoryDocument(slug, byCategory.GetValueOrDefault(slug, []).Select(entry => entry.ToDocument()).ToArray()))
            .ToArray();

        return new CatalogueDocument(library, categories);
    }

    private static string CategoryOf(Type type) {
        string simpleName = Signatures.SimpleName(type);

        if (!TypeCategory.TryGetValue(simpleName, out string? category)) {
            throw new InvalidOperationException(
                $"{type.FullName} is exported by the library but {nameof(TypeCategory)} does not place it anywhere. " +
                "Decide which /api category it belongs to — the whole point of reflecting on the assembly is that " +
                "this is the only kind of gap it can still have.");
        }

        return category;
    }
}
