---
title: "Getting started"
section: "guides"
slug: "getting-started"
order: 0
locale: "en"
sourcePath: "doc/handwritten/for-users/guides/getting-started.en.md"
sourceUrl: "https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-users/guides/getting-started.en.md"
ref: "lib-v1.0.0-preview.4"
---

Ten minutes from an empty test project to a test that reads better, covers more, and tells you
exactly how to reproduce itself when it goes red. No prior knowledge of dummy generators assumed.

## What is a dummy?

A **dummy** is a value a test needs but does not care about.

Every test has them. A test about discounts needs an order reference, but any order reference will
do. A test about shipping needs a customer name, but the name is irrelevant. Traditionally those
values get typed in by hand:

```csharp
string reference = "ORD-12345678";
int    quantity  = 3;
```

Hand-picked literals cause two specific problems.

The first is that they **lie about what matters**. A reader cannot tell whether `3` is essential to
the test or whether `7` would do just as well. Every literal looks equally load-bearing, so nobody
dares change one, and the test becomes harder to read than the code it covers.

The second is that they **only ever test one case**. `"ORD-12345678"` never has a leading zero,
never has repeated characters, and is always exactly that. A defect that needs a different shape of
input is a defect this test can never find.

JustDummies replaces the literal with a **declaration of what the value must satisfy**:

```csharp
string reference = Any.String().StartingWith("ORD-").WithLength(12).Generate();
int    quantity  = Any.Int32().Between(1, 100).Generate();
```

Now the test says what it means. The reference must start with `ORD-` and be twelve characters long
because *that is what an order reference is* — and everything else about it is free to vary.

## Install

```bash
dotnet add package JustDummies
```

That is the whole install. The package also carries its 33 analyzer rules inside it, so the guards on
correct usage start working on your next build with nothing further to configure.

## Your first dummy

```csharp
int      quantity  = Any.Int32().Between(1, 100).Generate();
string   name      = Any.String().Alpha().WithLengthBetween(3, 20).Generate();
Guid     id        = Any.Guid().NonEmpty().Generate();
DateTime orderedAt = Any.DateTime().Before(new DateTime(2030, 1, 1)).Generate();
```

Every line follows the same three-step shape, and it is worth naming the steps because the rest of
the library is just more of them.


<svg width="574" xmlns="http://www.w3.org/2000/svg" class="jd-diagram" viewBox="0 0 573.296875 80.5999984741211" role="graphics-document document" aria-roledescription="flowchart-v2" aria-describedby="chart-desc-jd-en-getting-started-0" aria-labelledby="chart-title-jd-en-getting-started-0" fill="rgb(51, 51, 51)" font-family="&quot;trebuchet ms&quot;, verdana, arial, sans-serif" font-size="16px" height="81"><title id="chart-title-jd-en-getting-started-0">From a generator to a drawn value</title><desc id="chart-desc-jd-en-getting-started-0">Any.Int32() gives a generator, Between(1, 100) gives a new generator, and Generate() gives a value.</desc><g><marker id="jd-en-getting-started-0_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px"/></marker><marker id="jd-en-getting-started-0_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px" stroke-dasharray="1px, 0px"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M150.516,40.3L154.682,40.3C158.849,40.3,167.182,40.3,174.849,40.3C182.516,40.3,189.516,40.3,193.016,40.3L196.516,40.3" id="jd-en-getting-started-0-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTUwLjUxNTYyNSwieSI6NDAuMjk5OTk5MjM3MDYwNTV9LHsieCI6MTc1LjUxNTYyNSwieSI6NDAuMjk5OTk5MjM3MDYwNTV9LHsieCI6MjAwLjUxNTYyNSwieSI6NDAuMjk5OTk5MjM3MDYwNTV9XQ==" data-look="classic" marker-end="url(&quot;#jd-en-getting-started-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M377.922,40.3L382.089,40.3C386.255,40.3,394.589,40.3,402.255,40.3C409.922,40.3,416.922,40.3,420.422,40.3L423.922,40.3" id="jd-en-getting-started-0-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6Mzc3LjkyMTg3NSwieSI6NDAuMjk5OTk5MjM3MDYwNTV9LHsieCI6NDAyLjkyMTg3NSwieSI6NDAuMjk5OTk5MjM3MDYwNTV9LHsieCI6NDI3LjkyMTg3NSwieSI6NDAuMjk5OTk5MjM3MDYwNTV9XQ==" data-look="classic" marker-end="url(&quot;#jd-en-getting-started-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g></g><g class="nodes"><g class="node default" id="jd-en-getting-started-0-flowchart-A-0" data-look="classic" transform="translate(79.2578125, 40.29999923706055)"><rect class="basic label-container" x="-71.2578125" y="-32.29999923706055" width="142.515625" height="64.5999984741211" fill="rgb(30, 33, 38)" stroke="rgb(199, 184, 255)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Any.Int32()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">a</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> generator</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-getting-started-0-flowchart-B-1" data-look="classic" transform="translate(289.21875, 40.29999923706055)"><rect class="basic label-container" x="-88.703125" y="-32.29999923706055" width="177.40625" height="64.5999984741211" fill="rgb(30, 33, 38)" stroke="rgb(199, 184, 255)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Between(1,</tspan><tspan font-style="normal" class="text-inner-tspan" font-weight="normal"> 100)</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">a</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> new</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> generator</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-getting-started-0-flowchart-C-3" data-look="classic" transform="translate(496.609375, 40.29999923706055)"><rect class="basic label-container" x="-68.6875" y="-32.29999923706055" width="137.375" height="64.5999984741211" fill="rgb(30, 33, 38)" stroke="rgb(127, 211, 193)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Generate()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">a</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> value</tspan></tspan></text></g></g></g></g></g></g><defs><filter id="jd-en-getting-started-0-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="jd-en-getting-started-0-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><linearGradient id="jd-en-getting-started-0-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(40.5882352941, 60%, 83.3333333333%)" stop-opacity="1"/><stop offset="100%" stop-color="hsl(-79.4117647059, 60%, 83.3333333333%)" stop-opacity="1"/></linearGradient></svg>


1. **`Any.Int32()` opens a generator.** A generator is a *recipe* — a description of the values that
   would be acceptable. It is not a value, and no value has been drawn yet.
2. **`.Between(1, 100)` adds a constraint.** It does not modify the generator; it returns a **new**
   generator carrying one more requirement. The original is untouched.
3. **`.Generate()` draws a value.** This is the only step that produces something concrete, and it
   is the only step that involves randomness.

That second point is the one newcomers trip over, so it is worth seeing directly:

```csharp
AnyInt32 anyQuantity = Any.Int32().Between(1, 100);

// Adding a constraint returns a NEW generator; anyQuantity still means "1 to 100".
AnyInt32 anyEvenQuantity = anyQuantity.MultipleOf(2);

int     quantity = anyQuantity.Generate();     // 1..100, odd or even
int evenQuantity = anyEvenQuantity.Generate(); // 1..100, even
```

Because a generator is immutable, you can safely keep one in a field, hand it around, and build
variations from it without any of them interfering.

## A real test, before and after

Here is an ordinary test for a discount rule. The rule is simple: applying a percentage discount to
an amount must never produce a negative price.

Written with literals, it checks exactly one arithmetic case:

<!-- jd:declarations -->
```csharp
public sealed class DiscountTests {

    [Fact]
    public void A_discount_never_produces_a_negative_price() {
        decimal amount     = 100m;
        int     percentage = 20;

        decimal discounted = Discount.Apply(amount, percentage);

        Assert.Equal(80m, discounted);
    }

}

internal static class Discount {

    public static decimal Apply(decimal amount, int percentage) {
        return amount - (amount * percentage / 100m);
    }

}
```

The test name promises something about *every* discount; the body delivers one. Nothing here would
notice a rule that breaks at 100 %, or at an amount of zero.

Written with dummies, the body finally says what the name says:

<!-- jd:declarations -->
```csharp
public sealed class DiscountTests {

    [Fact]
    public void A_discount_never_produces_a_negative_price() {
        // An order amount is non-negative and has two decimal places: that is the domain,
        // not the assertion. A percentage runs from 0 to 100 for the same reason.
        decimal amount     = Any.Decimal().Between(0m, 10_000m).WithScale(2).Generate();
        int     percentage = Any.Int32().Between(0, 100).Generate();

        decimal discounted = Discount.Apply(amount, percentage);

        Assert.InRange(discounted, 0m, amount);
    }

}

internal static class Discount {

    public static decimal Apply(decimal amount, int percentage) {
        return amount - (amount * percentage / 100m);
    }

}
```

Read the comment in that sample again, because it is the single most important habit in this
library:

> **A constraint states an invariant of the domain. It never restates what the test asserts.**

The amount is constrained to be non-negative because *amounts are non-negative*, not because the
assertion would fail otherwise. If you ever find yourself adding a constraint to make an assertion
pass, the constraint is in the wrong place — and usually the assertion has just found a real defect.

## Making a failure reproducible

A test that draws a different value every run is more powerful than one that does not — and it is
only acceptable if a failure can be replayed exactly. That is what `Any.Reproducibly` is for:

```csharp
Any.Reproducibly(() => {
    decimal amount     = Any.Decimal().Between(0m, 10_000m).WithScale(2).Generate();
    int     percentage = Any.Int32().Between(0, 100).Generate();

    Assert.InRange(amount - (amount * percentage / 100m), 0m, amount);
});
```

While the body runs, every draw comes from one pinned seed. If the body throws, the seed is reported
before the failure propagates:

```text
[JustDummies] These arbitrary values were seeded with 1743029518. Reproduce this run with Any.Reproducibly(1743029518, ...).
```

Copy that number in front of the body. Nothing else moves — same test, one argument more — and the
exact run comes back, value for value:

```csharp
Any.Reproducibly(1743029518, () => {
    // the same draws as the run that failed
});
```

Debug against those exact values, fix the defect, then delete the seed so the test varies again.

If you use xUnit v3, the [`JustDummies.Xunit`](/docs/packages/justdummies-xunit/) package does
this for you with a `[Reproducible]` attribute, so no test body needs wrapping by hand.

## Where to go next

| If you want to… | Read |
| --- | --- |
| understand generators properly before going further | [Core concepts](/docs/guides/core-concepts/) |
| replay a failing run, or pin a seed | [Reproducibility](/docs/guides/reproducibility/) |
| build a dummy for one of *your* types | [Composition](/docs/guides/composition/) |
| know what happens when constraints contradict | [Errors and conflicts](/docs/guides/errors-and-conflicts/) |
| look up every constraint on a given type | [Generator reference](/docs/generators/) |
| know why the library refuses some things on purpose | [Design principles](/docs/guides/design-principles/) |
| get a short answer to a specific question | [FAQ](/docs/guides/faq/) |
