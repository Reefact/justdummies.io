---
title: "Composition"
section: "guides"
slug: "composition"
order: 3
locale: "en"
sourcePath: "doc/handwritten/for-users/guides/composition.en.md"
sourceUrl: "https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-users/guides/composition.en.md"
ref: "lib-v1.0.0-preview.4"
---

The built-in generators cover primitives. Your code is made of order references, money, customers
and aggregates. This page is about crossing that gap — turning constrained primitives into dummies
for **your** types, without ever producing a value your own constructor would reject.

## `.As(...)`: from a primitive to your type

A value object usually wraps a primitive behind a factory that validates. Constrain the primitive so
that it satisfies the factory, then hand the factory to `.As(...)`:

```csharp
// OrderReference.Create demands the "ORD-" prefix and a length of 12. The constraints
// are chosen so that every drawn string clears that bar — never so an assertion passes.
IAny<OrderReference> anyReference = Any.String()
                                       .StartingWith("ORD-")
                                       .WithLength(12)
                                       .As(OrderReference.Create);

OrderReference reference = anyReference.Generate();
```

`.As(...)` takes an `IAny<TSource>` and a `Func<TSource, TResult>` and returns an `IAny<TResult>` —
a generator like any other, which can be stored, passed around, put in a collection, or made
nullable.

This is the supported route to a type with a stricter contract, and it has a property worth naming:
the factory is your real one. If the constraints are too loose, the factory throws, and you find out
immediately rather than shipping a dummy that could never exist in production.

## `Any.Combine`: several generators into one

When a type needs more than one input, `Any.Combine` draws from each generator and feeds a composer:


<svg width="759" xmlns="http://www.w3.org/2000/svg" class="jd-diagram" viewBox="0 0 758.1640625 195.19998168945312" role="graphics-document document" aria-roledescription="flowchart-v2" aria-describedby="chart-desc-jd-en-composition-0" aria-labelledby="chart-title-jd-en-composition-0" fill="rgb(51, 51, 51)" font-family="&quot;trebuchet ms&quot;, verdana, arial, sans-serif" font-size="16px" height="196"><title id="chart-title-jd-en-composition-0">How Any.Combine composes two generators into one</title><desc id="chart-desc-jd-en-composition-0">A decimal generator bounded between 0 and 1000 and a choice among EUR, USD and GBP are composed into one IAny of Money, which draws a Money such as 412.75 EUR.</desc><g><marker id="jd-en-composition-0_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-composition-0_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px"/></marker><marker id="jd-en-composition-0_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px" stroke-dasharray="1px, 0px"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M196.055,40.3L200.512,40.3C204.969,40.3,213.883,40.3,226.67,46.854C239.457,53.409,256.117,66.518,264.448,73.072L272.778,79.627" id="jd-en-composition-0-L_A_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_A_C_0" data-points="W3sieCI6MTk2LjA1NDY4NzUsInkiOjQwLjI5OTk5OTIzNzA2MDU1fSx7IngiOjIyMi43OTY4NzUsInkiOjQwLjI5OTk5OTIzNzA2MDU1fSx7IngiOjI3NS45MjEzNzcwNzM2NjEyMywieSI6ODIuMDk5OTk4NDc0MTIxMX1d" data-look="classic" marker-end="url(&quot;#jd-en-composition-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M197.797,154.9L201.964,154.9C206.13,154.9,214.464,154.9,226.956,148.506C239.448,142.112,256.098,129.324,264.424,122.93L272.749,116.536" id="jd-en-composition-0-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MTk3Ljc5Njg3NSwieSI6MTU0Ljg5OTk5NzcxMTE4MTY0fSx7IngiOjIyMi43OTY4NzUsInkiOjE1NC44OTk5OTc3MTExODE2NH0seyJ4IjoyNzUuOTIxMzc3MDczNjYxMiwieSI6MTE0LjA5OTk5ODQ3NDEyMTF9XQ==" data-look="classic" marker-end="url(&quot;#jd-en-composition-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M344.32,98.1L348.404,98.017C352.487,97.933,360.654,97.767,368.237,97.683C375.82,97.6,382.82,97.6,386.32,97.6L389.82,97.6" id="jd-en-composition-0-L_C_M_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_C_M_0" data-points="W3sieCI6MzQ0LjMyMDMxMjUsInkiOjk4LjA5OTk5ODQ3NDEyMTF9LHsieCI6MzY4LjgyMDMxMjUsInkiOjk3LjU5OTk5ODQ3NDEyMTF9LHsieCI6MzkzLjgyMDMxMjUsInkiOjk3LjU5OTk5ODQ3NDEyMTF9XQ==" data-look="classic" marker-end="url(&quot;#jd-en-composition-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M552.555,97.6L556.721,97.6C560.888,97.6,569.221,97.6,576.888,97.6C584.555,97.6,591.555,97.6,595.055,97.6L598.555,97.6" id="jd-en-composition-0-L_M_V_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_M_V_0" data-points="W3sieCI6NTUyLjU1NDY4NzUsInkiOjk3LjU5OTk5ODQ3NDEyMTF9LHsieCI6NTc3LjU1NDY4NzUsInkiOjk3LjU5OTk5ODQ3NDEyMTF9LHsieCI6NjAyLjU1NDY4NzUsInkiOjk3LjU5OTk5ODQ3NDEyMTF9XQ==" data-look="classic" marker-end="url(&quot;#jd-en-composition-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_C_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_C_M_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_M_V_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g></g><g class="nodes"><g class="node default" id="jd-en-composition-0-flowchart-A-0" data-look="classic" transform="translate(102.8984375, 40.29999923706055)"><rect class="basic label-container" x="-93.15625" y="-32.29999923706055" width="186.3125" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Any.Decimal()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Between(0,</tspan><tspan font-style="normal" class="text-inner-tspan" font-weight="normal"> 1000)</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-composition-0-flowchart-C-1" data-look="classic" transform="translate(295.80859375, 97.5999984741211)"><polygon points="8,0 88.0234375,0 96.0234375,-16 88.0234375,-32 8,-32 0,-16" class="label-container" transform="translate(-48.01171875,16)" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -8.5)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">compose</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-composition-0-flowchart-B-2" data-look="classic" transform="translate(102.8984375, 154.89999771118164)"><rect class="basic label-container" x="-94.8984375" y="-32.29999923706055" width="189.796875" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Any.OneOf</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">(EUR,</tspan><tspan font-style="normal" class="text-inner-tspan" font-weight="normal"> USD,</tspan><tspan font-style="normal" class="text-inner-tspan" font-weight="normal"> GBP)</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-composition-0-flowchart-M-5" data-look="classic" transform="translate(473.1875, 97.5999984741211)"><rect class="basic label-container" x="-79.3671875" y="-23.5" width="158.734375" height="47" fill="rgb(30, 33, 38)" stroke="rgb(199, 184, 255)"/><g class="label" transform="translate(0, -8.5)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">IAny&lt;Money&gt;</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-composition-0-flowchart-V-7" data-look="classic" transform="translate(676.359375, 97.5999984741211)"><rect class="basic label-container" x="-73.8046875" y="-32.29999923706055" width="147.609375" height="64.5999984741211" fill="rgb(30, 33, 38)" stroke="rgb(127, 211, 193)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Money</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">412.75</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> EUR</tspan></tspan></text></g></g></g></g></g></g><defs><filter id="jd-en-composition-0-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="jd-en-composition-0-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><linearGradient id="jd-en-composition-0-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(40.5882352941, 60%, 83.3333333333%)" stop-opacity="1"/><stop offset="100%" stop-color="hsl(-79.4117647059, 60%, 83.3333333333%)" stop-opacity="1"/></linearGradient></svg>


```csharp
IAny<Money> anyMoney = Any.Combine(
    Any.Decimal().Between(0m, 1_000m).WithScale(2),
    Any.OneOf("EUR", "USD", "GBP"),
    Money.Create);

Money price = anyMoney.Generate();
```

The composer can be a method group, as above, or a lambda when the shape needs adjusting. Overloads
exist for two through eight generators.

Every operand must actually be **used** by the composer. An operand that is drawn and thrown away is
almost always a mistake — a parameter left unread after a refactor — so it is diagnostic
[JD027](/docs/analyzers/JD027/). When the draw really is deliberate, name the parameter `_` to say
so.

## When eight is not enough

The arity stops at eight on purpose
([ADR-0005](https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-maintainers/adr/0005-cap-any-combine-at-arity-eight.md)). A type needing more
than eight independent inputs is a type that wants intermediate structure, and composing that
structure is both the workaround and the better design:

```csharp
// Compose the parts first...
IAny<Money>          anyPrice     = Any.Combine(Any.Decimal().Between(0m, 1_000m).WithScale(2),
                                                Any.OneOf("EUR", "USD", "GBP"),
                                                Money.Create);
IAny<OrderReference> anyReference = Any.String().StartingWith("ORD-").WithLength(12).As(OrderReference.Create);

// ...then combine the parts, not the primitives.
IAny<string> anySummary = Any.Combine(
    anyReference,
    anyPrice,
    Any.Enum<OrderStatus>(),
    (orderRef, price, status) => $"{orderRef} — {price} — {status}");
```

A composed generator is an ordinary `IAny<T>`, so it feeds another `Combine`, a collection, or an
`.As(...)` exactly like a primitive one does. That is what makes the cap a shape constraint rather
than a ceiling.

## `Any.PairOf` and `Any.TripleOf`

When all you want is the tuple, and no composer would add anything, two shorthands exist:

```csharp
IAny<(int Quantity, decimal UnitPrice)> anyLine = Any.PairOf(
    Any.Int32().Between(1, 100),
    Any.Decimal().Between(0.01m, 500m).WithScale(2));

(int quantity, decimal unitPrice) = anyLine.Generate();

IAny<(Guid, string, OrderStatus)> anyRow = Any.TripleOf(
    Any.Guid().NonEmpty(),
    Any.String().Alpha().WithLengthBetween(3, 20),
    Any.Enum<OrderStatus>());
```

## `.OrNull()`: optional values

An optional field deserves a dummy that is sometimes absent — otherwise the null branch is never
exercised. `.OrNull()` yields `null` about half the time and, otherwise, a value satisfying
everything declared upstream:

```csharp
// Value types: int?, DateTime?, Guid?, an enum...
int?      discount  = Any.Int32().Between(0, 100).OrNull().Generate();
DateTime? cancelled = Any.DateTime().Before(new DateTime(2030, 1, 1)).OrNull().Generate();

// Reference types: a nullable string, or a value object built through .As(...)
string?         note      = Any.String().Alpha().WithLengthBetween(1, 40).OrNull().Generate();
OrderReference? reference = Any.String().StartingWith("ORD-").WithLength(12)
                               .As(OrderReference.Create)
                               .OrNull()
                               .Generate();
```

There are two extension classes behind that single spelling — `NullableExtensions` for value types
and `NullableReferenceExtensions` for reference types — because one overload constrained to `struct`
and another to `class` would collide. You never pick between them: the compiler does, from the type
you are generating.

The null-versus-value decision draws from the same random context as the wrapped generator, so a
seeded run replays it exactly. A `null` draw does not consume a value from the wrapped generator.

## Building a whole aggregate

Putting it together, here is a dummy for a record with three fields, none of which is a bare
primitive at the call site:

```csharp
IAny<Customer> anyCustomer = Any.Combine(
    Any.Guid().NonEmpty(),
    Any.String().Alpha().WithLengthBetween(3, 20),
    Any.String().Alpha().InLowerCase().WithLengthBetween(3, 12),
    (id, name, localPart) => new Customer(id, name, $"{localPart}@example.test"));

Customer customer = anyCustomer.Generate();

// A generator is a recipe, so the same one produces a whole list of distinct customers.
List<Customer> customers = Any.ListOf(anyCustomer).WithCountBetween(2, 5).Generate();
```

Keep such a generator in a `static readonly` field of your test class and every test in the file
gets a valid customer for one call — with no shared mutable state, because generators are immutable.
