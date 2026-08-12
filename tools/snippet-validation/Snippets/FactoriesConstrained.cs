namespace JustDummies.SnippetValidation.Snippets.Constrained;

using JustDummies.SnippetValidation.Domain;

// The same factory again, with the constraints the domain asked for declared as a
// chain. What comes out is different every time and valid every time.
// <snippet:factory-constrained>
using JustDummies;

public static class AnyOrderReference {

    public static OrderReference Generate() {
        string reference = Any.String()
                              .NonEmpty()
                              .WithMaxLength(20)
                              .StartingWith("ORD-")
                              .Generate();

        return OrderReference.Create(reference);
    }

}
// </snippet:factory-constrained>
