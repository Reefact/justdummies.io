namespace Ordering.Tests;

using JustDummies;
using JustDummies.SnippetValidation.Domain;
using JustDummies.Xunit;

using Xunit;

/// <summary>
///     The same test, replaying the seed a failing run reported. It fails every time, on any
///     machine, and that is the whole of the third act's claim.
///
///     The seed below is not decorative and was not chosen for how it reads. It came out of an
///     actual failing run of the test next door — the run whose report said
///     <c>Reproduce this run with [Reproducible(Seed = -1808250554)]</c> — and pasting it here
///     is exactly the gesture the act describes. Under it the order draws Cancelled, so
///     <c>Cancel()</c> refuses, and the failure is the one that was reported rather than a
///     failure that resembles it.
///
///     scripts/generate-reproducibility.sh runs this three times per build and fails if the
///     three outputs are not byte-identical.
/// </summary>
public sealed class OrderCancellationReplayed {

    // <snippet:replayed-test>
    [Fact, Reproducible(Seed = -1808250554)]
    public void A_pending_order_can_be_cancelled() {
        Order order = new AnyOrder().Generate();

        order.Cancel();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }
    // </snippet:replayed-test>

}
