using System.Reflection;

namespace JustDummies.ApiCatalogue;

/// <summary>
///     The mutable state behind one <see cref="EntryDocument" /> while the catalogue is being
///     assembled — mutable only in the one way it needs to be, because <see cref="CatalogueBuilder.AddLooseAnyMembers" />
///     visits <see cref="Any" /> after every type has already been added and has to attach the
///     entry-point method it finds onto a type's entry after the fact.
/// </summary>
internal sealed class EntryBuilder {

    /// <summary>
    ///     Declared methods are suppressed for this type — not omitted from the catalogue,
    ///     redistributed instead. Every one of <see cref="Any" />'s own static methods ends up
    ///     as the <c>entryPoints</c> of the type it returns, or as its own loose entry when it
    ///     returns nothing this catalogue houses (<see cref="CatalogueBuilder.AddLooseAnyMembers" />);
    ///     listing them here too would print each one twice. <see cref="AnyContext" /> is
    ///     deliberately NOT in this set even though it mirrors nearly all forty of them under an
    ///     isolated seed: nothing redistributes an <see cref="AnyContext" /> instance method
    ///     anywhere else, so suppressing them here would make them vanish from the catalogue
    ///     rather than move — its entry lists its own methods like any other type.
    /// </summary>
    private static readonly HashSet<string> MethodsSuppressed = ["Any"];

    public string Category { get; }
    public string Name { get; }

    private readonly string id;
    private readonly string kind;
    private readonly string signature;
    private readonly string? summary;
    private readonly string? extends;
    private readonly string[] implements;
    private readonly PropertyDocument[] properties;
    private readonly MethodDocument[] constructors;
    private readonly MethodDocument[] methods;
    private readonly List<MethodDocument> entryPoints = [];

    private EntryBuilder(
        string category,
        string name,
        string id,
        string kind,
        string signature,
        string? summary,
        string? extends,
        string[] implements,
        PropertyDocument[] properties,
        MethodDocument[] constructors,
        MethodDocument[] methods) {
        Category = category;
        Name = name;
        this.id = id;
        this.kind = kind;
        this.signature = signature;
        this.summary = summary;
        this.extends = extends;
        this.implements = implements;
        this.properties = properties;
        this.constructors = constructors;
        this.methods = methods;
    }

    public static EntryBuilder From(Type type, string category, XmlDocCorpus docs) {
        PropertyDocument[] properties = type
            .GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Select(property => new PropertyDocument(Signatures.PropertySignature(property), XmlDocs.For(property, docs)))
            .ToArray();

        MethodDocument[] constructors = type
            .GetConstructors(BindingFlags.Public | BindingFlags.Instance)
            .Select(constructor => new MethodDocument(Signatures.ConstructorSignature(constructor), XmlDocs.For(constructor, docs)))
            .ToArray();

        MethodDocument[] methods = MethodsSuppressed.Contains(type.Name)
            ? []
            : type
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
                .Where(method => !method.IsSpecialName)
                .Select(method => new MethodDocument(Signatures.MethodSignature(method), XmlDocs.For(method, docs)))
                .ToArray();

        return new EntryBuilder(
            category,
            Signatures.Declared(type),
            Signatures.Slug(type.Name),
            Signatures.Kind(type),
            Signatures.TypeSignature(type),
            XmlDocs.For(type, docs),
            Signatures.MeaningfulBase(type),
            Signatures.Implements(type),
            properties,
            constructors,
            methods);
    }

    /// <summary>
    ///     A loose static member of <see cref="Any" /> — <c>Combine</c>, <c>PairOf</c>,
    ///     <c>UseSeed</c> and the like — that returns nothing this catalogue houses on its own,
    ///     so it gets an entry of its own instead. Its overloads become its <c>methods</c>
    ///     rather than an <c>entryPoints</c> annotation on someone else's entry, because there is
    ///     no someone else here.
    /// </summary>
    public static EntryBuilder FromLooseMethods(string name, string category, MethodInfo[] overloads, XmlDocCorpus docs) {
        MethodDocument[] methods = overloads
            .Select(method => new MethodDocument(Signatures.MethodSignature(method, "Any"), XmlDocs.For(method, docs)))
            .ToArray();
        string? summary = overloads.Select(method => XmlDocs.For(method, docs)).FirstOrDefault(doc => doc is not null);

        return new EntryBuilder(category, name, Signatures.Slug(name), "static method", methods[0].Signature, summary, null, [], [], [], methods);
    }

    /// <summary>Attaches the static <see cref="Any" /> method(s) that construct this entry's type — <c>Any.String()</c> onto <c>AnyString</c>.</summary>
    public void AddEntryPoints(MethodInfo[] overloads, XmlDocCorpus docs) {
        entryPoints.AddRange(overloads.Select(method => new MethodDocument(Signatures.MethodSignature(method, "Any"), XmlDocs.For(method, docs))));
    }

    public EntryDocument ToDocument() => new(
        id,
        Name,
        kind,
        signature,
        summary,
        extends,
        implements,
        entryPoints.Count > 0 ? entryPoints.ToArray() : null,
        properties,
        constructors,
        methods);
}
