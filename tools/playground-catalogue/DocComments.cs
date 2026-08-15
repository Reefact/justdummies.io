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

            var summary = CleanText(member.Element("summary")?.Value);
            var parameters = member.Elements("param")
                                    .Select(p => (Name: (string?)p.Attribute("name"), Text: CleanText(p.Value)))
                                    .Where(p => p.Name is not null)
                                    .ToDictionary(p => p.Name!, p => p.Text);

            entries[name] = new DocEntry(summary, parameters);
        }

        return entries;
    }

    /// <summary>Doc XML wraps prose across lines with indentation; collapse it to one readable line.</summary>
    private static string CleanText(string? raw) {
        if (string.IsNullOrWhiteSpace(raw)) {
            return string.Empty;
        }

        var words = raw.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        return string.Join(' ', words);
    }

}
