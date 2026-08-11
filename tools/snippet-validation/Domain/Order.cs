namespace JustDummies.SnippetValidation.Domain;

/// <summary>
///     The domain the site's narrative is told through. It is a fixture, not a product:
///     its only job is to be the thing the published examples are examples *of*, and to
///     carry the invariants that make a constrained dummy necessary in the first place.
/// </summary>
public enum OrderStatus {

    Pending,
    Cancelled,
    Shipped

}

/// <summary>
///     A value object exposed through a factory rather than a public constructor, because
///     that is the shape the library's derivation operation consumes.
/// </summary>
public sealed record OrderReference {

    private OrderReference(string value) {
        Value = value;
    }

    public string Value { get; }

    // The site shows these guard clauses as they are written here, so their width is
    // now part of what they have to get right: the throws below are wrapped rather
    // than left on one line, because a code block a reader has to scroll sideways to
    // finish reads as broken whatever it says.
    //
    // Nothing between the markers is commentary. What a reader sees is the method.
    // <snippet:order-reference-invariants>
    public static OrderReference Create(string value) {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        if (!value.StartsWith("ORD-", StringComparison.Ordinal)) {
            throw new ArgumentException(
                "An order reference must start with ORD-.", nameof(value));
        }

        if (value.Length > 20) {
            throw new ArgumentException(
                "An order reference cannot exceed 20 characters.", nameof(value));
        }

        return new OrderReference(value);
    }
    // </snippet:order-reference-invariants>

}

public sealed record CustomerId {

    private CustomerId(Guid value) {
        Value = value;
    }

    public Guid Value { get; }

    public static CustomerId Create(Guid value) {
        if (value == Guid.Empty) {
            throw new ArgumentException("A customer identifier cannot be empty.", nameof(value));
        }

        return new CustomerId(value);
    }

}

public sealed record Money {

    private Money(decimal amount) {
        Amount = amount;
    }

    public decimal Amount { get; }

    public static Money Create(decimal amount) {
        if (amount <= 0) {
            throw new ArgumentOutOfRangeException(nameof(amount), "An amount must be strictly positive.");
        }

        return new Money(amount);
    }

}

public sealed class Order {

    public Order(OrderReference reference, CustomerId customerId, Money total, OrderStatus status) {
        Reference  = reference ?? throw new ArgumentNullException(nameof(reference));
        CustomerId = customerId ?? throw new ArgumentNullException(nameof(customerId));
        Total      = total ?? throw new ArgumentNullException(nameof(total));
        Status     = status;
    }

    public OrderReference Reference  { get; }
    public CustomerId     CustomerId { get; }
    public Money          Total      { get; }
    public OrderStatus    Status     { get; private set; }

    public void Cancel() {
        if (Status != OrderStatus.Pending) {
            throw new InvalidOperationException("Only a pending order can be cancelled.");
        }

        Status = OrderStatus.Cancelled;
    }

}
