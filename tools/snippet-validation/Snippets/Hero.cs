namespace JustDummies.SnippetValidation.Snippets;

/// <summary>
///     The expression the hero arrives pre-filled with.
///
///     It is chosen, not picked: it chains five links across four kinds of constraint —
///     an alphabet and its casing, an anchored prefix, a required fragment whose position
///     is free, an exact length — and is unambiguously satisfiable, since eight of its
///     twelve characters are imposed and four are free.
///
///     The exact length is what makes it safe to display. A chain that only bounds a
///     maximum can legitimately draw the prefix and nothing else, which is correct and
///     reads as broken.
/// </summary>
public static class Hero {

    public static string PreFilledExpression() {
        // <snippet:hero-expression>
        string reference = Any.String()
                              .AlphaNumeric()
                              .UpperCase()
                              .StartingWith("ORD-")
                              .Containing("2026")
                              .WithLength(12)
                              .Generate();
        // </snippet:hero-expression>

        return reference;
    }

}
