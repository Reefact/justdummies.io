// The published snippets are held to every analyzer rule the library ships, informational
// ones included (.editorconfig raises those to errors). This file is where a snippet is let
// out of one, by name, with the reason attached.
//
// ASSEMBLY-LEVEL RATHER THAN INLINE, and not as a matter of taste: the suppression has to sit
// outside the `// <snippet:...>` markers. Everything between them is published verbatim, so an
// attribute written above the class would appear on the page — a reader would be shown a
// scene about a careless factory with a suppression pragma stapled to it, which teaches the
// opposite of the scene. Out here it constrains the build and says nothing to the reader.
//
// Scope it as tightly as the rule allows. A suppression that reads "this rule is off for this
// project" is the escalation undone in a file nobody rereads; each entry below names one
// member, so the rule still fires everywhere else — including on the very next snippet
// somebody writes.

using System.Diagnostics.CodeAnalysis;

[assembly: SuppressMessage(
    "Usage",
    "JD030:A string dummy declares no length",
    Scope = "member",
    Target = "~M:JustDummies.SnippetValidation.Snippets.Careless.AnyOrderReference.Generate~JustDummies.SnippetValidation.Domain.OrderReference",
    Justification =
        "The first act's careless factory is this diagnostic, on purpose. Its scene is a call " +
        "that declares nothing and is refused for it, so the expression the site publishes has " +
        "to be the unconstrained one — the rule is right about it, and that is the point being " +
        "made. Suppressed here rather than left unraised globally so JD030 still holds every " +
        "other published expression, and so this exception is one line somebody can find.")]

// The four published chains below all declare AlphaNumeric() then write "ORD-" as an anchored
// prefix, and JD033 is right to name it: the family governs what is drawn, the hyphen is not
// drawn, so it survives only because it was written, not because the chain permits it (ADR-0079).
// That reading is deliberate, not accidental, and it is the library's own documented example of
// a fixed separator (JD033's own page shows this pairing almost verbatim as "legal, and it stays
// legal"). Suppressed by name, once per site, so JD033 still holds everywhere a filler
// genuinely might be misread.

[assembly: SuppressMessage(
    "Constraints",
    "JD033:AnchoredLiteralOutsideCharacterFamily",
    Scope = "member",
    Target = "~M:JustDummies.SnippetValidation.Snippets.Hero.PreFilledExpression~System.String",
    Justification =
        "The hero previews the same chain Act I explains right below it (Snippets/FactoriesConstrained.cs), " +
        "so the two have to agree on this, not merely both be legal on their own.")]

[assembly: SuppressMessage(
    "Constraints",
    "JD033:AnchoredLiteralOutsideCharacterFamily",
    Scope = "member",
    Target = "~M:JustDummies.SnippetValidation.Snippets.Constrained.AnyOrderReference.Generate~JustDummies.SnippetValidation.Domain.OrderReference",
    Justification =
        "The first act's constrained factory: AlphaNumeric() is what the reference's free " +
        "characters must be, ORD- is the separator a reader chose, and the two are declared " +
        "together on purpose.")]

[assembly: SuppressMessage(
    "Constraints",
    "JD033:AnchoredLiteralOutsideCharacterFamily",
    Scope = "member",
    Target = "~M:JustDummies.SnippetValidation.Snippets.Why.OrderReference~System.String",
    Justification =
        "The positioning page's own figure for the same rule the constrained factory " +
        "demonstrates — same reasoning, same separator.")]

[assembly: SuppressMessage(
    "Constraints",
    "JD033:AnchoredLiteralOutsideCharacterFamily",
    Scope = "member",
    Target = "~M:JustDummies.SnippetValidation.Domain.UnitTests.AnyOrder.ReferenceFactory~JustDummies.IAny{JustDummies.SnippetValidation.Domain.OrderReference}",
    Justification =
        "The second act's corrected factory, once the reader has added the links dum could " +
        "not infer — the three links of the first act's chain, unchanged, including this one.")]
