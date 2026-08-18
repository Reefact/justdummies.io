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
