namespace JustDummies.SnippetValidation.Snippets.Careless;

using JustDummies.SnippetValidation.Domain;

// The `using JustDummies;` below sits inside the snippet on purpose: this scene is the
// first time the library appears on the page, and a reader has to see where it comes
// from. Every using still precedes the type, so the file compiles as written.
//
// This is also the one expression in the repository written to fail. It compiles, it
// runs, and it throws, which is precisely what the scene is about: the name stops lying
// and the domain immediately says what it needs.
// <snippet:factory-careless>
using JustDummies;

public static class AnyOrderReference {

    public static OrderReference Generate() {
        return OrderReference.Create(Any.String().Generate());
    }

}
// </snippet:factory-careless>
