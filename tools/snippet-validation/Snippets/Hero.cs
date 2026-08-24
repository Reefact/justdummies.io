namespace JustDummies.SnippetValidation.Snippets;

/// <summary>
///     The expression the hero arrives pre-filled with.
///
///     It is chosen, not picked: it chains four links and combines four different kinds
///     of constraint — a character family, a casing, an anchored prefix, a length range
///     — and is unambiguously satisfiable, since the prefix alone fits inside the
///     shortest length the range allows.
///
///     It is the same chain Act I explains right below the hero (Snippets/FactoriesConstrained.cs,
///     Snippets/Why.cs), deliberately: the hero previews what the page is about to demonstrate,
///     rather than a different expression the reader has to reconcile with it.
/// </summary>
public static class Hero {

    public static string PreFilledExpression() {
        // <snippet:hero-expression>
        string reference = Any.String()
                              .AlphaNumeric()
                              .InUpperCase()
                              .StartingWith("ORD-")
                              .WithLengthBetween(8, 20)
                              .Generate();
        // </snippet:hero-expression>

        return reference;
    }

}
