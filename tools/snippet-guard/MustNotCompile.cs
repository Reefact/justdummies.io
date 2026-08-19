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

    /// <summary>
    ///     JD029 — a value in a caller-supplied pool that a declared constraint refuses, so
    ///     it can never be drawn and the pool quietly means less than it reads. Informational
    ///     in the library and raised here, like JD024 above: it arrived with preview.2, and
    ///     without an entry the escalation that covers it would be a line nothing exercises.
    /// </summary>
    public static int PooledValueNeverDraws() {
        return Any.Int32().OneOf(1, 2, 300).Between(1, 10).Generate();
    }

    /// <summary>
    ///     JD030 — a string dummy that settles no length, and therefore draws anything from
    ///     zero to 1024 characters. Also preview.2, also informational, and the one rule of
    ///     the four with a deliberate exception on the published side: the first act's
    ///     careless factory is exactly this expression, and is suppressed there by name
    ///     (tools/snippet-validation/GlobalSuppressions.cs).
    ///
    ///     NOT THE ONLY WITNESS, and the comment used to claim otherwise. JD030 also fires on
    ///     <see cref="GeneratorAsText" /> above, whose <c>Any.String()</c> settles no length
    ///     either, so validate-snippets.sh's expectation would still hold with this method
    ///     deleted — measured, not assumed. It is here to name the rule the way every other
    ///     entry in this file names one, so a reader looking for JD030 finds it rather than
    ///     inferring it from a scene about JD005.
    /// </summary>
    public static string StringWithoutLength() {
        return Any.String().StartingWith("ORD-").Generate();
    }

}
