namespace JustDummies.SnippetValidation.Snippets;

using JustDummies.SnippetValidation.Domain;

using Xunit;

/// <summary>
///     The test the first act is written around, and the hole in it.
///
///     It is a real test: the attribute and the assertion resolve to xUnit's, so what the
///     site displays is what a reader would get. Nothing here is ever executed — the
///     project is compiled and that is the whole of its job.
/// </summary>
public sealed class OrderCancellation {

    /// <summary>The first scene: three lines about cancelling, and one about everything else.</summary>
    // <snippet:incomplete-test>
    [Fact]
    public void A_pending_order_can_be_cancelled() {
        Order order = APendingOrder();

        order.Cancel();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }
    // </snippet:incomplete-test>

    /// <summary>
    ///     The hole the act fills. It is deliberately the last scene's arrangement, so the
    ///     file tells the same story as the page: the test above is already finished, and
    ///     what remains is getting an order to hand it.
    /// </summary>
    private static Order APendingOrder() {
        return ActOne.VerboseArrangement();
    }

}

/// <summary>
///     The first act of the narrative: a value that does not matter to the test, and that
///     the domain refuses unless it is valid anyway.
///
///     Each region between a <c>snippet</c> marker and its closing marker is what the site
///     may display. What surrounds it — the method, the return, the using directives — is
///     scaffolding so this compiles, and is never shown.
/// </summary>
public static class ActOne {

    /// <summary>
    ///     The second scene: the shortest thing that could work, and the domain's answer to
    ///     it. This is the one expression in the repository written to fail — it compiles,
    ///     it runs, and it throws, which is precisely what the scene is about.
    /// </summary>
    public static OrderReference NaiveReference() {
        // <snippet:naive-reference>
        OrderReference reference = OrderReference.Create(Any.String().Generate());
        // </snippet:naive-reference>

        return reference;
    }

    /// <summary>The chain the fourth scene builds one link at a time.</summary>
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

    /// <summary>The fifth scene: the constrained value becomes an object of the domain.</summary>
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

    /// <summary>
    ///     The sixth scene: valid values everywhere, and a test that still says too much.
    ///
    ///     Wrapped to stay inside the width the site gives a figure. This one is the
    ///     punchline of the act — the arrangement that works and reads like a description
    ///     of the constructor — and a line clipped at the right edge reads as a broken
    ///     page rather than as the point being made.
    /// </summary>
    public static Order VerboseArrangement() {
        // <snippet:verbose-arrangement>
        Order order = new Order(
            reference: Any.String().NonEmpty().WithMaxLength(20)
                          .StartingWith("ORD-")
                          .As(OrderReference.Create).Generate(),
            customerId: Any.Guid().As(CustomerId.Create).Generate(),
            total: Any.Decimal().GreaterThan(0).WithScale(2)
                      .As(Money.Create).Generate(),
            status: OrderStatus.Pending);
        // </snippet:verbose-arrangement>

        return order;
    }

}
