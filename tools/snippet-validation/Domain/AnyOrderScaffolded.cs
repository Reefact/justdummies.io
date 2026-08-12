// Scaffolded by dum (JustDummies). This file is yours: read it, edit it, commit it.
// `dum generate Order --force` overwrites it. This type is partial, so members you add in a
// neighbouring file survive.

using JustDummies;

namespace JustDummies.SnippetValidation.Domain.Scaffolded;

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
    public AnyOrder()
        : this(reference:  Any.String().NonEmpty().WithMaxLength(20).As(OrderReference.Create),
               customerId: Any.Guid().NonEmpty().As(CustomerId.Create),
               total:      Any.Decimal().Positive().As(Money.Create),
               status:     Any.Enum<OrderStatus>()) { }

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
