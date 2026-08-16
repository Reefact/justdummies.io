using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace JustDummies.ApiCatalogue;

/// <summary>
///     Every <c>&lt;summary&gt;</c> an assembly's doc file carries, plus the member keys whose own
///     entry was only <c>&lt;inheritdoc/&gt;</c> with no <c>cref</c> — resolved lazily by
///     <see cref="XmlDocs.For(MethodBase, XmlDocCorpus)" /> and
///     <see cref="XmlDocs.For(PropertyInfo, XmlDocCorpus)" />, which is the first point in this
///     tool that holds the real reflected member rather than the doc file's own text spelling of
///     one. Matching "what does this override or implement" needs <see cref="Type.GetInterfaces" />
///     on that real member, not a second pass over XML.
/// </summary>
internal sealed record XmlDocCorpus(Dictionary<string, string> Summaries, HashSet<string> InheritedKeys);

/// <summary>
///     Reads an assembly's XML documentation file into the prose the /api pages show, resolving
///     the <c>&lt;see cref="…"&gt;</c> and <c>&lt;paramref&gt;</c> elements a raw <c>.Value</c>
///     read would silently drop — an untreated cross-reference reads as "arbitrary  generator",
///     the referenced word simply missing, which is worse than not documenting the member at all.
/// </summary>
internal static class XmlDocs {

    /// <summary>
    ///     Every <c>&lt;summary&gt;</c> in the assembly's doc file, keyed by the same member ID
    ///     the file itself uses (<c>T:</c>, <c>M:</c>, <c>P:</c> — see <see cref="TypeKey" />
    ///     and its siblings).
    /// </summary>
    public static XmlDocCorpus Load(Assembly assembly) {
        string xmlPath = FindXmlDocumentationFile(assembly);

        Dictionary<string, string> summaries = new();
        List<(string Key, string? Cref)> pendingInheritance = [];
        // PreserveWhitespace, or a single space sitting between two elements with nothing else
        // around it — <b>valid</b> <see cref="…"/> — is silently dropped as "insignificant",
        // and "valid" runs straight into the word the cref resolves to.
        XDocument document = XDocument.Load(xmlPath, LoadOptions.PreserveWhitespace);

        foreach (XElement member in document.Descendants("member")) {
            string? name = member.Attribute("name")?.Value;

            if (name is null) {
                continue;
            }

            if (member.Element("summary") is XElement summary) {
                summaries[name] = Regex.Replace(Render(summary), @"\s+", " ").Trim();
            } else if (member.Element("inheritdoc") is XElement inheritdoc) {
                // <inheritdoc/> replaces a member's own doc entirely rather than sitting beside a
                // <summary> — every concrete Generate() a housed type declares to satisfy IAny<T>
                // carries nothing else, and reading only <summary> left every one of them null.
                pendingInheritance.Add((name, inheritdoc.Attribute("cref")?.Value));
            }
        }

        HashSet<string> inheritedKeys = [];

        // A second pass, not resolved inline above: the XML file is not topologically sorted, so
        // an <inheritdoc cref="…"/> read early can name a member this loop has not reached yet.
        foreach ((string key, string? cref) in pendingInheritance) {
            if (cref is not null && summaries.TryGetValue(cref, out string? viaCref)) {
                summaries[key] = viaCref;
            } else if (cref is null) {
                // No cref: "inherit from whatever this member overrides or implements", which
                // only the real reflected member can answer — see ResolveInherited* below.
                inheritedKeys.Add(key);
            }
        }

        return new XmlDocCorpus(summaries, inheritedKeys);
    }

    /// <summary>Combines two assemblies' corpora — <c>JustDummies</c> and <c>JustDummies.Xunit</c> are catalogued together.</summary>
    public static XmlDocCorpus Merge(XmlDocCorpus first, XmlDocCorpus second) {
        Dictionary<string, string> summaries = new(first.Summaries);

        foreach (KeyValuePair<string, string> entry in second.Summaries) {
            summaries[entry.Key] = entry.Value;
        }

        return new XmlDocCorpus(summaries, [.. first.InheritedKeys, .. second.InheritedKeys]);
    }

    public static string? For(Type type, XmlDocCorpus docs) => docs.Summaries.GetValueOrDefault(TypeKey(type));

    public static string? For(MethodBase method, XmlDocCorpus docs) {
        string key = MethodKey(method);

        if (docs.Summaries.TryGetValue(key, out string? own)) {
            return own;
        }

        return docs.InheritedKeys.Contains(key) ? ResolveInheritedMethodSummary(method, docs) : null;
    }

    public static string? For(PropertyInfo property, XmlDocCorpus docs) {
        string key = PropertyKey(property);

        if (docs.Summaries.TryGetValue(key, out string? own)) {
            return own;
        }

        return docs.InheritedKeys.Contains(key) ? ResolveInheritedPropertySummary(property, docs) : null;
    }

    /// <summary>
    ///     Walks the declaring type's interfaces and base types for a member of the same name and
    ///     arity — a concrete <c>AnyBoolean.Generate()</c> satisfying <c>IAny&lt;bool&gt;.Generate()</c>
    ///     — and takes that member's own summary. Matched by name and parameter count rather than
    ///     exact parameter types: the contract's own parameter can be an unbound generic parameter
    ///     (<c>T</c>) where the implementation's is the closed type it was built for (<c>bool</c>),
    ///     which a strict type comparison would treat as two different signatures.
    /// </summary>
    private static string? ResolveInheritedMethodSummary(MethodBase method, XmlDocCorpus docs) {
        if (method.DeclaringType is null || method is not MethodInfo info) {
            return null;
        }

        foreach (Type contract in Contracts(method.DeclaringType)) {
            MethodInfo? match = contract.GetMethods()
                .FirstOrDefault(candidate => candidate.Name == info.Name && candidate.GetParameters().Length == info.GetParameters().Length);

            if (match is not null && docs.Summaries.TryGetValue(MethodKey(match), out string? inherited)) {
                return inherited;
            }
        }

        return null;
    }

    private static string? ResolveInheritedPropertySummary(PropertyInfo property, XmlDocCorpus docs) {
        if (property.DeclaringType is null) {
            return null;
        }

        foreach (Type contract in Contracts(property.DeclaringType)) {
            PropertyInfo? match = contract.GetProperties().FirstOrDefault(candidate => candidate.Name == property.Name);

            if (match is not null && docs.Summaries.TryGetValue(PropertyKey(match), out string? inherited)) {
                return inherited;
            }
        }

        return null;
    }

    /// <summary>
    ///     Everything a type's member could be inheriting documentation from: the interfaces it
    ///     implements, then its base chain.
    ///
    ///     Reduced to generic type DEFINITIONS, which is the whole point: reflection hands back the
    ///     constructed <c>IAny&lt;bool&gt;</c>, whose <c>FullName</c> spells out its argument
    ///     (<c>JustDummies.IAny`1[[System.Boolean, …]]</c>), while the doc file keys the member off
    ///     the open definition (<c>JustDummies.IAny`1</c>). Looking the constructed form up finds
    ///     nothing, silently — which is exactly what left all 33 concrete <c>Generate()</c> methods
    ///     undocumented on the first attempt at this.
    /// </summary>
    private static IEnumerable<Type> Contracts(Type type) {
        foreach (Type contract in type.GetInterfaces()) {
            yield return contract.IsGenericType ? contract.GetGenericTypeDefinition() : contract;
        }

        for (Type? ancestor = type.BaseType; ancestor is not null && ancestor != typeof(object); ancestor = ancestor.BaseType) {
            yield return ancestor.IsGenericType ? ancestor.GetGenericTypeDefinition() : ancestor;
        }
    }

    /// <summary>
    ///     The doc file for a loaded assembly, found in the NuGet cache rather than beside
    ///     <see cref="Assembly.Location" />: the SDK copies a referenced package's .dll to this
    ///     tool's own output but not that sibling file (see the .csproj's
    ///     <c>RuntimeHostConfigurationOption</c> comment for why). A package can carry more than
    ///     one target framework's build under its root, so the match is not "the file exists" but
    ///     "the file exists beside a .dll the same size as the one that is actually loaded" — the
    ///     one honest way to tell two builds of the same doc file apart without hard-coding which
    ///     framework folder NuGet chose.
    /// </summary>
    private static string FindXmlDocumentationFile(Assembly assembly) {
        string assemblyName = assembly.GetName().Name!;
        string configurationKey = $"{assemblyName}.PackageRoot";
        string? packageRoot = AppContext.GetData(configurationKey) as string;

        if (string.IsNullOrEmpty(packageRoot) || !Directory.Exists(packageRoot)) {
            throw new InvalidOperationException(
                $"No usable '{configurationKey}' runtime configuration option. The .csproj's RuntimeHostConfigurationOption " +
                "for this package is missing, or GeneratePathProperty didn't resolve — check dotnet build's restore output.");
        }

        long loadedSize = new FileInfo(assembly.Location).Length;
        string[] candidates = Directory.GetFiles(packageRoot, $"{assemblyName}.xml", SearchOption.AllDirectories);

        string? match = candidates.FirstOrDefault(
            candidate => File.Exists(Path.ChangeExtension(candidate, ".dll"))
                         && new FileInfo(Path.ChangeExtension(candidate, ".dll")).Length == loadedSize);

        if (match is null) {
            throw new FileNotFoundException(
                $"No {assemblyName}.xml under {packageRoot} sits beside a .dll the same size as the loaded assembly " +
                $"({loadedSize} bytes). Candidates found: {(candidates.Length == 0 ? "none" : string.Join(", ", candidates))}. " +
                "The catalogue has nothing to quote without it.");
        }

        return match;
    }

    private static string TypeKey(Type type) => $"T:{type.FullName}";

    private static string PropertyKey(PropertyInfo property) => $"P:{property.DeclaringType!.FullName}.{property.Name}";

    /// <summary>
    ///     The compiler's own member-ID format: <c>M:</c>, the declaring type, the member name
    ///     (<c>#ctor</c> for a constructor), the method's own generic arity when it has one
    ///     (<c>``3</c> — <b>double</b>-backtick, which is also how a reference to one of that
    ///     method's own type parameters is spelled inside the parameter list, as opposed to the
    ///     single backtick a type-level parameter uses), and a parenthesised, comma-joined
    ///     parameter-type list when there are parameters.
    /// </summary>
    private static string MethodKey(MethodBase method) {
        string name = method is ConstructorInfo ? "#ctor" : method.Name;
        int methodArity = method is MethodInfo { IsGenericMethodDefinition: true } generic ? generic.GetGenericArguments().Length : 0;
        string arity = methodArity > 0 ? $"``{methodArity}" : "";
        ParameterInfo[] parameters = method.GetParameters();

        if (parameters.Length == 0) {
            return $"M:{method.DeclaringType!.FullName}.{name}{arity}";
        }

        string parameterList = string.Join(",", parameters.Select(parameter => DocParameterType(parameter.ParameterType)));

        return $"M:{method.DeclaringType!.FullName}.{name}{arity}({parameterList})";
    }

    private static string DocParameterType(Type type) {
        if (type.IsGenericParameter) {
            string marker = type.IsGenericMethodParameter ? "``" : "`";

            return $"{marker}{type.GenericParameterPosition}";
        }

        // Recurse before the generic-type branch below, or an open array like T[] falls through
        // to type.FullName — null for a type built from an unbound generic parameter — and the
        // lookup silently misses. OneOf(T[])/Except(T[]) had exactly this: a null summary in the
        // committed catalogue where the non-generic overloads resolved fine.
        if (type.IsArray) {
            return $"{DocParameterType(type.GetElementType()!)}[]";
        }

        if (type.IsGenericType) {
            string definition = type.GetGenericTypeDefinition().FullName!;
            string bareName = definition[..definition.IndexOf('`')];
            string arguments = string.Join(",", type.GetGenericArguments().Select(DocParameterType));

            return $"{bareName}{{{arguments}}}";
        }

        return type.FullName ?? type.Name;
    }

    /// <summary>
    ///     Flattens a documentation element to prose: text nodes pass through, <c>&lt;see&gt;</c>
    ///     and <c>&lt;paramref&gt;</c> resolve to the word a reader would use instead of vanishing,
    ///     and everything else recurses — the doc comments in this corpus do not nest deeply, but
    ///     nothing here assumes they cannot.
    /// </summary>
    private static string Render(XElement element) {
        StringBuilder rendered = new();

        foreach (XNode node in element.Nodes()) {
            if (node is XText text) {
                rendered.Append(text.Value);

                continue;
            }

            if (node is not XElement child) {
                continue;
            }

            switch (child.Name.LocalName) {
                case "see" or "seealso":
                    rendered.Append(child.Attribute("langword")?.Value ?? LastSegment(child.Attribute("cref")?.Value ?? ""));

                    break;
                case "paramref" or "typeparamref":
                    rendered.Append(child.Attribute("name")?.Value ?? "");

                    break;
                case "c":
                    // Recurse rather than read .Value: this corpus nests <typeparamref> inside
                    // <c> — "the value tuple (<typeparamref name="T1"/>, ...)" — and .Value
                    // would flatten straight past that element to its attribute-only content,
                    // rendering "(, , )" with every name silently dropped.
                    rendered.Append(Render(child));

                    break;
                default:
                    rendered.Append(Render(child));

                    break;
            }
        }

        return rendered.ToString();
    }

    /// <summary>
    ///     A <c>cref</c> down to the name a reader recognises: <c>M:JustDummies.AnyString.WithLength(System.Int32)</c>
    ///     becomes <c>WithLength</c>, and <c>T:JustDummies.IAny`1</c> becomes <c>IAny</c> rather
    ///     than <c>IAny`1</c> — the arity marker is for the compiler, not for prose.
    /// </summary>
    private static string LastSegment(string cref) {
        string withoutPrefix = cref.Contains(':') ? cref[(cref.IndexOf(':') + 1)..] : cref;
        string withoutParameters = withoutPrefix.Contains('(') ? withoutPrefix[..withoutPrefix.IndexOf('(')] : withoutPrefix;
        string lastSegment = withoutParameters.Contains('.') ? withoutParameters[(withoutParameters.LastIndexOf('.') + 1)..] : withoutParameters;

        return Regex.Replace(lastSegment, "`{1,2}[0-9]+$", "");
    }
}
