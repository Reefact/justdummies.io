using System.Text.Json;

using JustDummies.SnippetValidation.Domain;
using JustDummies.SnippetValidation.Snippets;

namespace JustDummies.SampleValues;

/// <summary>
///     Runs the site's published expressions and writes what they produced.
/// </summary>
public static class Program {

    /// <summary>
    ///     The seed, fixed, and that is the whole point.
    ///
    ///     Drawing freshly on every build would put a different value in the diff of
    ///     every commit, which teaches a reviewer to skip the file — and the day the
    ///     library's draw genuinely changes shape, nobody would look. Pinned, the file
    ///     moves only when something real moved, and the diff is worth reading.
    ///
    ///     The number itself carries no meaning and never needs to change.
    /// </summary>
    private const int Seed = 20260810;

    /// <summary>How many values the scene showing "arbitrary, but controlled" needs.</summary>
    private const int SequenceLength = 4;

    public static int Main(string[] args) {
        if (args.Length != 1) {
            Console.Error.WriteLine("usage: sample-values <output-file>");

            return 1;
        }

        // Pinned for the whole run. The expressions themselves draw from the ambient
        // context, exactly as a reader's test would, so nothing about them is special
        // here — which is what makes the value on the page the value the code produces.
        using IDisposable seeding = Any.UseSeed(Seed);

        SortedDictionary<string, string[]> values = new() {
            // The hero's pre-filled expression. Its exact length is what makes it safe
            // to display: every draw is twelve characters, never the bare prefix.
            ["hero-expression"] = Repeat(static () => Hero.PreFilledExpression()),

            // Scene three builds this chain one link at a time, and shows several draws
            // to make "arbitrary" visible before "constrained" is explained.
            ["constrained-reference"] = Repeat(static () => ActOne.ConstrainedReference()),

            // Scene four: the same chain, now producing an object of the domain. The
            // value shown is what the domain accepted, not what the string was.
            ["derived-reference"] = Repeat(static () => ActOne.DerivedReference().Value),

            // Scene five: the arrangement that works and still says too much.
            ["order-reference"] = [ActOne.VerboseArrangement().Reference.Value],
            ["order-total"]     = [ActOne.VerboseArrangement().Total.Amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)],
        };

        SortedDictionary<string, object> document = new() {
            ["seed"]   = Seed,
            ["values"] = values,
        };

        // Indented, sorted, and with a trailing newline: this file is committed and
        // read in review, so it is written to be read rather than to be small.
        string json = JsonSerializer.Serialize(document, new JsonSerializerOptions { WriteIndented = true });

        File.WriteAllText(args[0], json + Environment.NewLine);

        Console.WriteLine($"  {args[0]}  ({values.Count} expressions, seed {Seed})");

        return 0;
    }

    private static string[] Repeat(Func<string> expression) {
        string[] drawn = new string[SequenceLength];

        for (int index = 0; index < SequenceLength; index++) {
            drawn[index] = expression();
        }

        return drawn;
    }

}
