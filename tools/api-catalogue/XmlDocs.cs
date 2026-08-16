using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace JustDummies.ApiCatalogue;

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
    public static Dictionary<string, string> Load(Assembly assembly) {
        string xmlPath = FindXmlDocumentationFile(assembly);

        Dictionary<string, string> docs = new();
        // PreserveWhitespace, or a single space sitting between two elements with nothing else
        // around it — <b>valid</b> <see cref="…"/> — is silently dropped as "insignificant",
        // and "valid" runs straight into the word the cref resolves to.
        XDocument document = XDocument.Load(xmlPath, LoadOptions.PreserveWhitespace);

        foreach (XElement member in document.Descendants("member")) {
            string? name = member.Attribute("name")?.Value;
            XElement? summary = member.Element("summary");

            if (name is not null && summary is not null) {
                docs[name] = Regex.Replace(Render(summary), @"\s+", " ").Trim();
            }
        }

        return docs;
    }

    public static string? For(Type type, Dictionary<string, string> docs) => docs.GetValueOrDefault(TypeKey(type));

    public static string? For(MethodBase method, Dictionary<string, string> docs) => docs.GetValueOrDefault(MethodKey(method));

    public static string? For(PropertyInfo property, Dictionary<string, string> docs) => docs.GetValueOrDefault(PropertyKey(property));

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
