// Scaffolded by dum (JustDummies). This file is yours: read it, edit it, commit it.
// `dum generate Order --force` overwrites it. This type is partial, so members you add in a
// neighbouring file survive.

// ---------------------------------------------------------------------------------------
// Everything above this line is the tool's. Everything below has been edited exactly once,
// and the site's second act is about that edit.
//
// `dum generate Order` marked `reference` as `unread guards`: the domain rejects a string
// that does not start with "ORD-" or that holds a character other than a letter, a digit or
// a hyphen past that prefix, and neither rule is in the closed set of guard idioms the tool
// reads (tool specification §5.3, and §9 names it as a non-goal). It therefore emitted the
// neutral recipe, said so in as many words, and did not guess — so the file it wrote
// compiles cleanly and throws on every draw until the missing links are added. Verified:
// eight consecutive draws, eight AnyGenerationException.
//
// The links added below are the chain of the first act, unchanged. That is the point of
// the second: the tool writes the part nobody wants to write, and stops where the
// developer already knows the answer.
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

    // Every letter and digit, plus the hyphen the prefix itself needs: WithChars restricts
    // the whole string, not just what comes after the prefix, so the pool has to admit ORD-'s
    // own dash or the two constraints would contradict each other before a single value is
    // drawn (ConflictingAnyConstraintException).
    private const string ReferenceAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-";

    /// <summary>Creates the generator with a default recipe for every constructor parameter.</summary>
    //
    // The whole of the difference with the recipe the tool wrote is the two links named in
    // the page's prose: `.StartingWith("ORD-")` and `.WithChars(ReferenceAlphabet)`. The
    // chain no longer fits the one line that used to make that difference visible by itself,
    // so the prose is what carries it now.
    //
    // No snippet markers: the page publishes the tool's own file, and this one is the edited
    // copy the second act is *about* rather than a figure of its own.
    public AnyOrder()
        : this(reference:  Any.String()
                               .NonEmpty()
                               .WithMinLength(8)
                               .WithMaxLength(20)
                               .StartingWith("ORD-")
                               .WithChars(ReferenceAlphabet)
                               .As(OrderReference.Create),
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
