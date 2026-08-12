namespace JustDummies.SnippetValidation.Snippets;

using JustDummies.SnippetValidation.Domain;
using JustDummies.Xunit;

// `global::` because this file's own namespace begins with `JustDummies`, and a plain
// `using Xunit;` is resolved against the enclosing namespaces first: it binds to
// JustDummies.Xunit, and [Fact] stops existing. A reader's test file sits in a namespace
// of their own, where the ordinary spelling works — which is why the snippet region below
// starts under the attribute and not at the top of the file.
using global::Xunit;

/// <summary>
///     What the second act opens by wishing for: an arrangement of one line, naming the only
///     thing the test needs to be true and nothing else.
///
///     A CLASS OF ITS OWN, for the same reason the first act's factories have namespaces of
///     their own — the test method has to keep its name. §9.2's continuity rule is that this
///     is the same test throughout, word for word, and C# will not hold two methods of one
///     name in one class. The class name is never displayed.
///
///     The helper below is what makes the wish compile, and it is deliberately the first
///     act's own chain: that is what a reader has at this point, and writing it is exactly
///     the work this act removes. It sits outside the markers — the page shows the line a
///     reader wants, not the ten behind it.
/// </summary>
public sealed class WantedOrderCancellation {

    // <snippet:wanted-test>
    [Fact, Reproducible]
    public void A_pending_order_can_be_cancelled() {
        Order order = CreateAnyPendingOrder();   // one line, and this is the one we want

        order.Cancel();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }
    // </snippet:wanted-test>

    private static Order CreateAnyPendingOrder() {
        return new Order(Constrained.AnyOrderReference.Generate(),
                         Handwritten.AnyCustomerId.Generate(),
                         Handwritten.AnyMoney.Generate(),
                         OrderStatus.Pending);
    }

}

/// <summary>
///     The second act: the same test as the first, with the arrangement gone.
///
///     It is deliberately the same test method, word for word in its act and its assert.
///     What changed is the one line the first act spent six scenes filling in — and the
///     point of the act is that the line went away rather than got shorter.
///
///     [Reproducible] appears here without a word said about it. This is the first test the
///     page shows in which the library draws the values, and a drawn value that cannot be
///     replayed is the objection a reader raises on their own — so the answer is in the
///     snippet from the first time the question can be asked. The third act is where they
///     find out what it does.
/// </summary>
public sealed class ConciseOrderCancellation {

    // <snippet:concise-test>
    [Fact, Reproducible]
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
