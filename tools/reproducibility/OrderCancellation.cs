namespace Ordering.Tests;

using JustDummies;
using JustDummies.SnippetValidation.Domain;
using JustDummies.Xunit;

using Xunit;

/// <summary>
///     The third act's test, and it is meant to fail — some of the time.
///
///     It is the second act's test with one thing removed: the line that pinned the status.
///     Nothing else changed. The order it draws is arbitrary and valid, and two of the three
///     statuses an order can hold cannot be cancelled, so this goes red on roughly two runs
///     in three.
///
///     That is not a defect in the library and the act does not present it as one. It is what
///     an arbitrary value does to a test that forgot to say what it needed — and the point of
///     the act is what happens next, which is that the failure hands back the seed that
///     produced it.
/// </summary>
public sealed class OrderCancellation {

    // <snippet:intermittent-test>
    [Fact, Reproducible]
    public void A_pending_order_can_be_cancelled() {
        Order order = new AnyOrder().Generate();

        order.Cancel();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }
    // </snippet:intermittent-test>

}
