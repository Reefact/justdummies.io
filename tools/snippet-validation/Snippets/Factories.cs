namespace JustDummies.SnippetValidation.Snippets.Handwritten;

using JustDummies.SnippetValidation.Domain;

/// <summary>
///     The factories the second scene introduces, before the library exists.
///
///     THREE NAMESPACES FOR THREE STATES OF THE SAME CLASS. The act follows one factory
///     as it stops lying, and the page has to show <c>AnyOrderReference</c> three times
///     with three different bodies. C# will not hold three classes of one name, so each
///     state gets a namespace of its own and the snippet markers sit inside it — the
///     namespace line is never displayed, so a reader sees the same class evolving.
///
///     Only the first state needs all three factories: it is the one the displayed test
///     calls. The later states follow the reference alone, which is the value the act is
///     about.
/// </summary>
// <snippet:factory-handwritten>
public static class AnyOrderReference {

    public static OrderReference Generate() {
        return OrderReference.Create("ORD-54XEM4545");
    }

}

// ... and AnyCustomerId and AnyMoney, which say the same thing
// </snippet:factory-handwritten>

public static class AnyCustomerId {

    public static CustomerId Generate() {
        return CustomerId.Create(Guid.Parse("6f4d2e1a-9b3c-4d5e-8f7a-1c2b3d4e5f60"));
    }

}

public static class AnyMoney {

    public static Money Generate() {
        return Money.Create(42.00m);
    }

}
