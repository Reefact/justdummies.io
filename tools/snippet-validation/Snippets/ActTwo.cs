namespace JustDummies.SnippetValidation.Snippets;

using JustDummies.SnippetValidation.Domain;

using Xunit;

/// <summary>
///     The second act: the same test as the first, with the arrangement gone.
///
///     It is deliberately the same test method, word for word in its act and its assert.
///     What changed is the one line the first act spent six scenes filling in — and the
///     point of the act is that the line went away rather than got shorter.
/// </summary>
public sealed class ConciseOrderCancellation {

    // <snippet:concise-test>
    [Fact]
    public void A_pending_order_can_be_cancelled() {
        Order order = new AnyOrder().WithStatus(OrderStatus.Pending).Generate();

        order.Cancel();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }
    // </snippet:concise-test>

}

/// <summary>
///     The expressions the second act's figures are drawn from. As in the first act, only
///     the marked regions reach a page; the methods around them are scaffolding.
/// </summary>
public static class ActTwo {

    /// <summary>
    ///     The arrangement, once the tool has written the generator: one line, and it names
    ///     the only thing the test actually needs to be true.
    /// </summary>
    public static Order PendingOrder() {
        // <snippet:scaffolded-arrangement>
        Order order = new AnyOrder().WithStatus(OrderStatus.Pending).Generate();
        // </snippet:scaffolded-arrangement>

        return order;
    }

}
