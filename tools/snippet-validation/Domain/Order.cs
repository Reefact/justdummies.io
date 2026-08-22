using System.Linq;

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

    // The site shows these guard clauses as they are written here, so their width is part
    // of what they have to get right. One line each, dedented to the region's own margin,
    // well inside the 130 the page's measure holds, and a throw broken in two makes a
    // reader assemble a sentence that always fitted.
    //
    // The last guard is not cosmetic: a real order reference is uppercase alphanumeric past
    // its separator, the same way a real one starts with ORD- and stays between 8 and 20
    // characters — the shape a barcode carries and a human reads back over the phone.
    // Declared here, it is what lets the generator's own .AlphaNumeric().UpperCase()
    // (Snippets/Why.cs, Snippets/Hero.cs, Snippets/FactoriesConstrained.cs,
    // Domain/AnyOrder.cs) remain a fact about this domain rather than a constraint invented
    // to keep a displayed value legible.
    //
    // Nothing between the markers is commentary. What a reader sees is the method.
    // <snippet:order-reference-invariants>
    public static OrderReference Create(string value) {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        if (!value.StartsWith("ORD-", StringComparison.Ordinal)) {
            throw new ArgumentException("An order reference must start with ORD-.", nameof(value));
        }

        if (value.Length < 8) {
            throw new ArgumentException("An order reference cannot be shorter than 8 characters.", nameof(value));
        }

        if (value.Length > 20) {
            throw new ArgumentException("An order reference cannot exceed 20 characters.", nameof(value));
        }

        if (!value[4..].All(character => char.IsAsciiLetterUpper(character) || char.IsAsciiDigit(character))) {
            throw new ArgumentException("An order reference holds only uppercase letters and digits after ORD-.", nameof(value));
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
