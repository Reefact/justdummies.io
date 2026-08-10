namespace JustDummies.SnippetValidation.Snippets;

using JustDummies.SnippetValidation.Domain;

/// <summary>
///     The first act of the narrative: a value that does not matter to the test, and that
///     the domain refuses unless it is valid anyway.
///
///     Each region between a <c>snippet</c> marker and its closing marker is what the site
///     may display. What surrounds it — the method, the return, the using directives — is
///     scaffolding so this compiles, and is never shown.
/// </summary>
public static class ActOne {

    /// <summary>The chain the third scene builds one link at a time.</summary>
    public static string ConstrainedReference() {
        // <snippet:constrained-reference>
        string reference = Any.String()
                              .NonEmpty()
                              .WithMaxLength(20)
                              .StartingWith("ORD-")
                              .Generate();
        // </snippet:constrained-reference>

        return reference;
    }

    /// <summary>The fourth scene: the constrained value becomes an object of the domain.</summary>
    public static OrderReference DerivedReference() {
        // <snippet:derived-reference>
        OrderReference reference = Any.String()
                                      .NonEmpty()
                                      .WithMaxLength(20)
                                      .StartingWith("ORD-")
                                      .As(OrderReference.Create)
                                      .Generate();
        // </snippet:derived-reference>

        return reference;
    }

    /// <summary>The fifth scene: valid values everywhere, and a test that still says too much.</summary>
    public static Order VerboseArrangement() {
        // <snippet:verbose-arrangement>
        Order order = new Order(
            reference: Any.String().NonEmpty().WithMaxLength(20).StartingWith("ORD-")
                          .As(OrderReference.Create).Generate(),
            customerId: Any.Guid().As(CustomerId.Create).Generate(),
            total: Any.Decimal().GreaterThan(0).WithScale(2).As(Money.Create).Generate(),
            status: OrderStatus.Pending);
        // </snippet:verbose-arrangement>

        return order;
    }

}
