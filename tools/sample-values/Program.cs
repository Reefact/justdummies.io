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

            // Scene six: the arrangement that works and still says too much.
            ["order-reference"] = [ActOne.VerboseArrangement().Reference.Value],
            ["order-total"]     = [ActOne.VerboseArrangement().Total.Amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)],

            // The second act. Drawn through the scaffolded generator with the one link the
            // tool could not read added back, which is the whole of what the act shows: the
            // file the tool wrote throws on every draw until that line exists, so these
            // values existing at all is the claim being made.
            ["completed-recipe"]       = Repeat(static () => new AnyOrder().Generate().Reference.Value),
            ["scaffolded-arrangement"] = Repeat(static () => Arranged().Reference.Value),
        };

        // Scene two shows the domain refusing a careless value. What it refused with is
        // read off the exception rather than written beside it, for the same reason every
        // other value here is: a message typed onto a page is right on the day it is typed.
        SortedDictionary<string, string> refusals = new() {
            ["naive-reference"] = Refusal(static () => ActOne.NaiveReference()),
        };

        SortedDictionary<string, object> document = new() {
            ["seed"]     = Seed,
            ["refusals"] = refusals,
            ["values"]   = values,
        };

        // Indented, sorted, and with a trailing newline: this file is committed and
        // read in review, so it is written to be read rather than to be small. The
        // relaxed encoder is part of that — the default escapes an apostrophe to
        // ', and a refusal message is prose a reviewer has to be able to read.
        // Nothing here is ever interpolated into markup: the site imports it as a
        // module and Astro escapes what it renders.
        string json = JsonSerializer.Serialize(document, new JsonSerializerOptions {
            WriteIndented = true,
            Encoder       = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        });

        File.WriteAllText(args[0], json + Environment.NewLine);

        Console.WriteLine($"  {args[0]}  ({values.Count} expressions, {refusals.Count} refusal, seed {Seed})");

        return 0;
    }

    /// <summary>
    ///     Runs an expression the domain is expected to reject, and returns what it said.
    ///
    ///     An expression that succeeds here fails the build rather than being quietly
    ///     dropped. The scene it feeds is built entirely on the refusal happening; if the
    ///     draw ever stopped provoking one, the page would keep its sentence about being
    ///     refused and lose the evidence under it, which is worse than not shipping.
    /// </summary>
    private static string Refusal(Func<object> expression) {
        try {
            expression();
        } catch (ArgumentException refused) {
            return refused.Message;
        }

        throw new InvalidOperationException(
            "The expression the second scene shows being refused was accepted. Either the draw or the domain moved, "
          + "and the scene has to be rewritten rather than published without its evidence.");
    }

    /// <summary>
    ///     The second act's arrangement, drawn and then checked against the only thing its
    ///     test needs to be true.
    ///
    ///     The check is here rather than implied. The act's claim is that the arrangement
    ///     disappears without the test losing what it was about, and a page that says so
    ///     while the arrangement quietly produced a shipped order would be worse than one
    ///     that said nothing. This turns the claim into a build failure if it stops holding.
    /// </summary>
    private static Order Arranged() {
        Order order = ActTwo.PendingOrder();

        if (order.Status != OrderStatus.Pending) {
            throw new InvalidOperationException(
                $"The second act's arrangement drew an order in status {order.Status}, and the act's test is about "
              + "cancelling a pending one. The scene has to be rewritten rather than published beside a claim it no "
              + "longer supports.");
        }

        return order;
    }

    private static string[] Repeat(Func<string> expression) {
        string[] drawn = new string[SequenceLength];

        for (int index = 0; index < SequenceLength; index++) {
            drawn[index] = expression();
        }

        return drawn;
    }

}
