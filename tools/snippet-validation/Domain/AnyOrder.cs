// Scaffolded by dum (JustDummies). This file is yours: read it, edit it, commit it.
// `dum generate Order --force` overwrites it. This type is partial, so members you add in a
// neighbouring file survive.

// ---------------------------------------------------------------------------------------
// Everything above this line is the tool's. Everything below has been edited exactly once,
// and the site's second act is about that edit.
//
// `dum generate Order` marked `reference` as `unread guards`: the domain rejects a string
// that does not start with "ORD-", and a prefix rule is not in the closed set of guard
// idioms the tool reads (tool specification §5.3, and §9 names it as a non-goal). It
// therefore emitted the neutral recipe, said so in as many words, and did not guess — so
// the file it wrote compiles cleanly and throws on every draw until the missing link is
// added. Verified: eight consecutive draws, eight AnyGenerationException.
//
// The link added below is the chain of the first act, unchanged. That is the point of the
// second: the tool writes the part nobody wants to write, and stops where the developer
// already knows the answer.
//
// A re-run with --force would overwrite this file, edit and snippet markers alike. The
// tool's own header says so on line 2, which is the warning working as intended.
// ---------------------------------------------------------------------------------------

using JustDummies;

namespace JustDummies.SnippetValidation.Domain;

/// <summary>
///     A generator of arbitrary <see cref="Order" /> values. It draws from the ambient random
///     context, so a reproducibility scope pins it; to draw from an isolated
///     <c>Any.WithSeed(...)</c> context, pass that context's generators through the
///     <c>With…</c> overloads.
/// </summary>
public sealed partial class AnyOrder : IAny<Order> {

    private readonly IAny<OrderReference> _reference;
    private readonly IAny<CustomerId>     _customerId;
    private readonly IAny<Money>          _total;
    private readonly IAny<OrderStatus>    _status;

    /// <summary>Creates the generator with a default recipe for every constructor parameter.</summary>
    // <snippet:completed-recipe>
    public AnyOrder()
        : this(reference:  Any.String().NonEmpty().WithMaxLength(20)
                              .StartingWith("ORD-")
                              .As(OrderReference.Create),
               customerId: Any.Guid().NonEmpty().As(CustomerId.Create),
               total:      Any.Decimal().Positive().As(Money.Create),
               status:     Any.Enum<OrderStatus>()) { }
    // </snippet:completed-recipe>

    private AnyOrder(IAny<OrderReference> reference,
                     IAny<CustomerId>     customerId,
                     IAny<Money>          total,
                     IAny<OrderStatus>    status) {
        _reference  = reference;
        _customerId = customerId;
        _total      = total;
        _status     = status;
    }

    /// <summary>Pins <c>reference</c> to a fixed value.</summary>
    public AnyOrder WithReference(OrderReference value) {
        return WithReference(new FixedValue<OrderReference>(value));
    }

    /// <summary>Draws <c>reference</c> from <paramref name="generator" />.</summary>
    public AnyOrder WithReference(IAny<OrderReference> generator) {
        return new AnyOrder(generator, _customerId, _total, _status);
    }

    /// <summary>Pins <c>customerId</c> to a fixed value.</summary>
    public AnyOrder WithCustomerId(CustomerId value) {
        return WithCustomerId(new FixedValue<CustomerId>(value));
    }

    /// <summary>Draws <c>customerId</c> from <paramref name="generator" />.</summary>
    public AnyOrder WithCustomerId(IAny<CustomerId> generator) {
        return new AnyOrder(_reference, generator, _total, _status);
    }

    /// <summary>Pins <c>total</c> to a fixed value.</summary>
    public AnyOrder WithTotal(Money value) {
        return WithTotal(new FixedValue<Money>(value));
    }

    /// <summary>Draws <c>total</c> from <paramref name="generator" />.</summary>
    public AnyOrder WithTotal(IAny<Money> generator) {
        return new AnyOrder(_reference, _customerId, generator, _status);
    }

    /// <summary>Pins <c>status</c> to a fixed value.</summary>
    public AnyOrder WithStatus(OrderStatus value) {
        return WithStatus(new FixedValue<OrderStatus>(value));
    }

    /// <summary>Draws <c>status</c> from <paramref name="generator" />.</summary>
    public AnyOrder WithStatus(IAny<OrderStatus> generator) {
        return new AnyOrder(_reference, _customerId, _total, generator);
    }

    /// <summary>Produces one arbitrary <see cref="Order" />.</summary>
    public Order Generate() {
        return new Order(_reference.Generate(),
                         _customerId.Generate(),
                         _total.Generate(),
                         _status.Generate());
    }

    private sealed class FixedValue<TValue> : IAny<TValue> {

        private readonly TValue _value;

        public FixedValue(TValue value) {
            _value = value;
        }

        public TValue Generate() {
            return _value;
        }

    }

}
