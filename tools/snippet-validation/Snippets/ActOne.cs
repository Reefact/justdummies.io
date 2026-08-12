namespace JustDummies.SnippetValidation.Snippets;

using JustDummies.SnippetValidation.Domain;
using JustDummies.SnippetValidation.Snippets.Handwritten;

using Xunit;

/// <summary>
///     The test the first act is written around, and the hole in it.
///
///     It is a real test: the attribute and the assertion resolve to xUnit's, so what the
///     site displays is what a reader would get. Nothing here is ever executed — the
///     project is compiled and that is the whole of its job.
/// </summary>
public sealed class OrderCancellation {

    /// <summary>
    ///     The first scene: the test as it is written before any of this, with three
    ///     values named for what they are not.
    ///
    ///     The names say *any*, and every one of them is one specific value written by
    ///     hand. That is the lie the act pulls apart, and it has to be visible rather
    ///     than described — which is why the literals are here and not behind a helper.
    ///
    ///     The Arrange/Act/Assert markers appear in this snippet and the next one alone.
    ///     Where the page's point is that a test has become one line, three lines of
    ///     comment above it would be exactly the "everything else" that scene claims to
    ///     have removed.
    /// </summary>
    // <snippet:literal-test>
    [Fact]
    public void A_pending_order_can_be_cancelled() {
        // Arrange
        OrderReference anyReference  = OrderReference.Create("ORD-54XEM4545");
        CustomerId     anyCustomerId = CustomerId.Create(Guid.NewGuid());
        Money          anyTotal      = Money.Create(42.00m);

        Order order = new Order(anyReference, anyCustomerId, anyTotal,
                                OrderStatus.Pending);

        // Act
        order.Cancel();

        // Assert
        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }
    // </snippet:literal-test>

    /// <summary>
    ///     The second scene: the same test with the values moved behind factories.
    ///
    ///     It reads. That is the whole of what it buys, and the act says so plainly
    ///     before taking it away again — the factory is named `Any` and returns one
    ///     value, so the lie has moved rather than gone.
    /// </summary>
    // <snippet:factory-test>
    [Fact]
    public void A_pending_order_can_be_cancelled_with_factories() {
        // Arrange
        OrderReference anyReference  = AnyOrderReference.Generate();
        CustomerId     anyCustomerId = AnyCustomerId.Generate();
        Money          anyTotal      = AnyMoney.Generate();

        Order order = new Order(anyReference, anyCustomerId, anyTotal,
                                OrderStatus.Pending);

        // Act
        order.Cancel();

        // Assert
        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }
    // </snippet:factory-test>

}

/// <summary>
///     What the first act still needs compiled, now that its factories live beside it.
///
///     The scenes the act used to end on — the chain producing a domain object in one
///     link, and the four-argument arrangement — were removed from the page (ADR-0006).
///     `.As(OrderReference.Create)` returns later, in the recipe the tool writes, which
///     is where a reader meets it having already written the chain by hand.
/// </summary>
public static class ActOne {

    /// <summary>
    ///     The value the fourth scene shows several draws of. It is read through the
    ///     constrained factory rather than a chain of its own, so the value on the page is
    ///     produced by the code on the page.
    /// </summary>
    public static string ConstrainedReference() {
        return Constrained.AnyOrderReference.Generate().Value;
    }

    /// <summary>
    ///     The refusal the third scene is built on, provoked through the same factory the
    ///     page displays.
    /// </summary>
    public static OrderReference CarelessReference() {
        return Careless.AnyOrderReference.Generate();
    }

}
