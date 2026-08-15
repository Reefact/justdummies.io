using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace JustDummies.PlaygroundCatalogueGenerator;

/// <summary>One manually authored exclusion, read from excluded-members.jsonc (specification §10.6).</summary>
public sealed record ManualExclusionEntry(
    [property: JsonPropertyName("member")] string Member,
    [property: JsonPropertyName("reason")] string Reason);

/// <summary>
///     The editorial exclusion list: entries a human chose to leave out of the catalogue, keyed by
///     the generator's own "{Type}.{Method}" / "{Type}.{Method}(Param1,Param2)" format (see the
///     header comment in excluded-members.jsonc). Most exclusions never need an entry here — the
///     generator auto-detects and excludes anything structurally out of scope for v1.
/// </summary>
public sealed class ManualExclusions {

    private readonly Dictionary<string, string> _reasonsByKey;

    private ManualExclusions(Dictionary<string, string> reasonsByKey) {
        _reasonsByKey = reasonsByKey;
    }

    public static ManualExclusions Load(string path) {
        var jsonc = File.ReadAllText(path);
        var json  = StripLineComments(jsonc);

        var entries = JsonSerializer.Deserialize<ManualExclusionEntry[]>(json)
                      ?? throw new InvalidDataException($"'{path}' did not deserialize to an array of exclusion entries.");

        var reasonsByKey = new Dictionary<string, string>();
        foreach (var entry in entries) {
            if (string.IsNullOrWhiteSpace(entry.Reason)) {
                throw new InvalidDataException($"'{path}': exclusion for '{entry.Member}' has an empty reason.");
            }

            reasonsByKey[entry.Member] = entry.Reason;
        }

        return new ManualExclusions(reasonsByKey);
    }

    /// <summary>Looks up a manual exclusion by one of its two key forms (precise or name-only).</summary>
    public bool TryGet(string key, out string reason) => _reasonsByKey.TryGetValue(key, out reason!);

    /// <summary>
    ///     Entries in the file that never matched a discovered member — a stale exclusion, most
    ///     often because the library renamed or removed what it used to name. Kept visible rather
    ///     than silently tolerated, since a stale entry is a claim about the library that is no
    ///     longer true.
    /// </summary>
    public IReadOnlyList<string> UnusedKeys(IReadOnlySet<string> usedKeys) =>
        _reasonsByKey.Keys.Where(key => !usedKeys.Contains(key)).OrderBy(key => key, StringComparer.Ordinal).ToList();

    private static string StripLineComments(string jsonc) {
        // excluded-members.jsonc uses only whole-line `//` comments; a small, deliberate
        // subset of JSONC rather than a general parser, since that is all the file needs.
        return Regex.Replace(jsonc, @"^\s*//.*$", string.Empty, RegexOptions.Multiline);
    }

}
