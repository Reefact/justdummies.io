namespace JustDummies.SnippetValidation.Snippets;

/// <summary>
///     The expressions the positioning page publishes.
///
///     They are here rather than beside the narrative's because they answer a different
///     question. The narrative shows a test being transformed; this page shows what a
///     single criterion means, one idea per figure, with nothing else in the frame.
/// </summary>
public static class Why {

    /// <summary>
    ///     The whole of the page's first claim, in four lines: the rules are said, the value
    ///     is not. Every constraint here is one the domain's own <c>OrderReference.Create</c>
    ///     enforces, which is what makes it an example rather than a demonstration of syntax.
    /// </summary>
    public static string OrderReference() {
        // <snippet:why-order-reference>
        string reference = Any.String()
                              .NonEmpty()
                              .WithMaxLength(20)
                              .StartingWith("ORD-")
                              .Printable()
                              .Generate();
        // </snippet:why-order-reference>

        return reference;
    }

    /// <summary>
    ///     The smallest form of the same idea, for the criterion about saying the rule where
    ///     the value is asked for: one line, no setup, no type to declare first.
    /// </summary>
    public static int Quantity() {
        // <snippet:why-quantity>
        int quantity = Any.Int32().Between(1, 100).Generate();
        // </snippet:why-quantity>

        return quantity;
    }

}
