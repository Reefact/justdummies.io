using System.Text;
using System.Xml.Linq;

namespace JustDummies.PlaygroundCatalogueGenerator;

/// <summary>One member's parsed XML documentation: its summary text and per-parameter text.</summary>
public sealed record DocEntry(string Summary, IReadOnlyDictionary<string, string> Parameters);

/// <summary>
///     Reads the XML documentation file the JustDummies NuGet package ships next to its assembly,
///     keyed by the standard compiler member ID ("M:Namespace.Type.Method(ParamType1,ParamType2)").
///     Specification §10.7: help text is extracted from the library's XML doc comments, never
///     written by hand on the site.
/// </summary>
public static class DocComments {

    public static IReadOnlyDictionary<string, DocEntry> Load(string xmlPath) {
        var doc = XDocument.Load(xmlPath);
        var entries = new Dictionary<string, DocEntry>();

        foreach (var member in doc.Descendants("member")) {
            var name = (string?)member.Attribute("name");
            if (name is null || !name.StartsWith("M:", StringComparison.Ordinal)) {
                continue;
            }

            var summary = CleanText(member.Element("summary"));
            var parameters = member.Elements("param")
                                    .Select(p => (Name: (string?)p.Attribute("name"), Text: CleanText(p)))
                                    .Where(p => p.Name is not null)
                                    .ToDictionary(p => p.Name!, p => p.Text);

            entries[name] = new DocEntry(summary, parameters);
        }

        return entries;
    }

    /// <summary>
    ///     Flattens a doc-comment element (e.g. <c>&lt;summary&gt;</c>) to one readable line of
    ///     prose. <c>XElement.Value</c> alone would drop the content of self-closing inline
    ///     elements like <c>&lt;paramref name="x"/&gt;</c> and <c>&lt;see cref="M:..."/&gt;</c> —
    ///     they carry their text in an attribute, not as a child text node — so this walks the
    ///     descendant nodes by hand and substitutes that attribute for such elements instead.
    /// </summary>
    private static string CleanText(XElement? element) {
        if (element is null) {
            return string.Empty;
        }

        var sb = new StringBuilder();
        foreach (var node in element.DescendantNodesAndSelf()) {
            switch (node) {
                case XText text:
                    sb.Append(text.Value).Append(' ');
                    break;
                case XElement { Name.LocalName: "paramref" or "typeparamref" } inline:
                    sb.Append((string?)inline.Attribute("name")).Append(' ');
                    break;
                case XElement { Name.LocalName: "see" or "seealso" } inline:
                    sb.Append(CrefText((string?)inline.Attribute("cref"))).Append(' ');
                    break;
            }
        }

        var words = sb.ToString().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        return string.Join(' ', words);
    }

    /// <summary>A <c>cref</c> attribute is a full XML-doc member ID (e.g.
    /// <c>"T:System.Guid"</c>); readers only need the simple name after the last separator.</summary>
    private static string CrefText(string? cref) {
        if (string.IsNullOrEmpty(cref)) {
            return string.Empty;
        }

        var withoutPrefix = cref.Length > 2 && cref[1] == ':' ? cref[2..] : cref;
        var parameterList = withoutPrefix.IndexOf('(');
        var withoutParameters = parameterList < 0 ? withoutPrefix : withoutPrefix[..parameterList];
        var lastSeparator = withoutParameters.LastIndexOf('.');
        return lastSeparator < 0 ? withoutParameters : withoutParameters[(lastSeparator + 1)..];
    }

}
