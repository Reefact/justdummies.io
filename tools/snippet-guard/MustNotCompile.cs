namespace JustDummies.SnippetGuard;

/// <summary>
///     Expressions the library's analyzers must reject.
///
///     Without them, a clean build of the validation project proves nothing: "no
///     diagnostic found" and "no analyzer running" produce exactly the same silence.
///     Each entry names the rule it is there to provoke, and
///     scripts/validate-snippets.sh checks that every one of them is reported.
/// </summary>
public static class MustNotCompile {

    /// <summary>JD005 — a generator rendered as text instead of generated from.</summary>
    public static string GeneratorAsText() {
        return $"{Any.String()}";
    }

    /// <summary>JD015 — the required prefix cannot fit inside the maximum length.</summary>
    public static string ImpossibleString() {
        return Any.String().StartingWith("ORD-").WithMaxLength(3).Generate();
    }

    /// <summary>JD023 — bounds that cross, so no integer satisfies the chain.</summary>
    public static int ImpossibleInt() {
        return Any.Int32().GreaterThan(100).LessThan(50).Generate();
    }

    /// <summary>
    ///     JD024 — a constraint implied by one declared before it. Informational in the
    ///     library, raised to an error here, which is the point: this entry is what
    ///     proves the escalation in .editorconfig is doing something.
    /// </summary>
    public static int NarrowsNothing() {
        return Any.Int32().Between(5, 500).Positive().Generate();
    }

}
