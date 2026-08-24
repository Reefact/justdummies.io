---
title: "Errors and conflicts"
section: "guides"
slug: "errors-and-conflicts"
order: 5
locale: "en"
sourcePath: "doc/handwritten/for-users/guides/errors-and-conflicts.en.md"
sourceUrl: "https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-users/guides/errors-and-conflicts.en.md"
ref: "lib-v1.0.0-preview.4"
---

JustDummies would rather refuse loudly than return a value nobody can explain. This page is about
what it refuses, what the exceptions mean, and how to read a message that names both sides of a
contradiction.

## The exception hierarchy


<svg width="867" xmlns="http://www.w3.org/2000/svg" class="jd-diagram" viewBox="0 0 866.2109375 327.4000244140625" role="graphics-document document" aria-roledescription="flowchart-v2" aria-describedby="chart-desc-jd-en-errors-and-conflicts-0" aria-labelledby="chart-title-jd-en-errors-and-conflicts-0" fill="rgb(51, 51, 51)" font-family="&quot;trebuchet ms&quot;, verdana, arial, sans-serif" font-size="16px" height="328"><title id="chart-title-jd-en-errors-and-conflicts-0">The library's exception hierarchy</title><desc id="chart-desc-jd-en-errors-and-conflicts-0">DummyException is abstract and derives from Exception. Three concrete types derive from it. AnyGenerationException, when a draw could not be completed. ConflictingAnyConstraintException, when the constraints admit no value. UnsupportedRegexException, when the pattern falls outside the regular subset.</desc><g><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px"/></marker><marker id="jd-en-errors-and-conflicts-0_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px" stroke-dasharray="1px, 0px"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M421.938,55L421.938,59.167C421.938,63.333,421.938,71.667,421.938,79.333C421.938,87,421.938,94,421.938,97.5L421.938,101" id="jd-en-errors-and-conflicts-0-L_E_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_E_D_0" data-points="W3sieCI6NDIxLjkzNzUsInkiOjU1fSx7IngiOjQyMS45Mzc1LCJ5Ijo4MH0seyJ4Ijo0MjEuOTM3NSwieSI6MTA1fV0=" data-look="classic" marker-end="url(&quot;#jd-en-errors-and-conflicts-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M294.09,162.096L266.158,167.513C238.227,172.931,182.363,183.765,154.432,194.149C126.5,204.533,126.5,214.467,126.5,219.433L126.5,224.4" id="jd-en-errors-and-conflicts-0-L_D_A_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_D_A_0" data-points="W3sieCI6Mjk0LjA4OTg0Mzc1LCJ5IjoxNjIuMDk2MDA3MjEwMjY5N30seyJ4IjoxMjYuNSwieSI6MTk0LjU5OTk5ODQ3NDEyMTF9LHsieCI6MTI2LjUsInkiOjIyOC40MDAwMDE1MjU4Nzg5fV0=" data-look="classic" marker-end="url(&quot;#jd-en-errors-and-conflicts-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M421.938,169.6L421.938,173.767C421.938,177.933,421.938,186.267,421.938,193.933C421.938,201.6,421.938,208.6,421.938,212.1L421.938,215.6" id="jd-en-errors-and-conflicts-0-L_D_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_D_C_0" data-points="W3sieCI6NDIxLjkzNzUsInkiOjE2OS41OTk5OTg0NzQxMjExfSx7IngiOjQyMS45Mzc1LCJ5IjoxOTQuNTk5OTk4NDc0MTIxMX0seyJ4Ijo0MjEuOTM3NSwieSI6MjE5LjU5OTk5ODQ3NDEyMTF9XQ==" data-look="classic" marker-end="url(&quot;#jd-en-errors-and-conflicts-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M549.785,161.193L579.578,166.761C609.371,172.329,668.957,183.464,698.75,192.532C728.543,201.6,728.543,208.6,728.543,212.1L728.543,215.6" id="jd-en-errors-and-conflicts-0-L_D_U_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_D_U_0" data-points="W3sieCI6NTQ5Ljc4NTE1NjI1LCJ5IjoxNjEuMTkyODIzNTczOTg3Nzd9LHsieCI6NzI4LjU0Mjk2ODc1LCJ5IjoxOTQuNTk5OTk4NDc0MTIxMX0seyJ4Ijo3MjguNTQyOTY4NzUsInkiOjIxOS41OTk5OTg0NzQxMjExfV0=" data-look="classic" marker-end="url(&quot;#jd-en-errors-and-conflicts-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_E_D_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_D_A_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_D_C_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_D_U_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g></g><g class="nodes"><g class="node default" id="jd-en-errors-and-conflicts-0-flowchart-E-0" data-look="classic" transform="translate(421.9375, 31.5)"><rect class="basic label-container" x="-65.1328125" y="-23.5" width="130.265625" height="47" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -8.5)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Exception</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-errors-and-conflicts-0-flowchart-D-1" data-look="classic" transform="translate(421.9375, 137.29999923706055)"><rect class="basic label-container" x="-127.84765625" y="-32.29999923706055" width="255.6953125" height="64.5999984741211" fill="rgb(30, 33, 38)" stroke="rgb(199, 184, 255)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">DummyException</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">abstract</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> —</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> the</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> library's</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> root</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-errors-and-conflicts-0-flowchart-A-3" data-look="classic" transform="translate(126.5, 269.5)"><rect class="basic label-container" x="-118.5" y="-41.099998474121094" width="237" height="82.19999694824219" fill="rgb(30, 33, 38)" stroke="rgb(255, 184, 107)"/><g class="label" transform="translate(0, -26.099998474121094)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">AnyGenerationException</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">a</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> draw</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> could</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> not</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> be</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="2.1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">completed</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-errors-and-conflicts-0-flowchart-C-5" data-look="classic" transform="translate(421.9375, 269.5)"><rect class="basic label-container" x="-126.9375" y="-49.900001525878906" width="253.875" height="99.80000305175781" fill="rgb(30, 33, 38)" stroke="rgb(242, 131, 107)"/><g class="label" transform="translate(0, -34.900001525878906)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">ConflictingAnyConstraintEx</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">ception</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="2.1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">the</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> constraints</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> admit</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> no</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="3.2em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">value</tspan></tspan></text></g></g></g><g class="node default" id="jd-en-errors-and-conflicts-0-flowchart-U-7" data-look="classic" transform="translate(728.54296875, 269.5)"><rect class="basic label-container" x="-129.66796875" y="-49.900001525878906" width="259.3359375" height="99.80000305175781" fill="rgb(30, 33, 38)" stroke="rgb(242, 131, 107)"/><g class="label" transform="translate(0, -34.900001525878906)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">UnsupportedRegexExceptio</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">n</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="2.1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">the</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> pattern</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> is</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> outside</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> the</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="3.2em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">regular</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> subset</tspan></tspan></text></g></g></g></g></g></g><defs><filter id="jd-en-errors-and-conflicts-0-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="jd-en-errors-and-conflicts-0-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><linearGradient id="jd-en-errors-and-conflicts-0-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(40.5882352941, 60%, 83.3333333333%)" stop-opacity="1"/><stop offset="100%" stop-color="hsl(-79.4117647059, 60%, 83.3333333333%)" stop-opacity="1"/></linearGradient></svg>


`DummyException` is abstract, so catching it catches everything this library throws and nothing else:

<!-- jd:allow=JD023 -->
```csharp
try {
    int impossible = Any.Int32().Between(1, 10).MultipleOf(50).Generate();
} catch (DummyException exception) {
    Console.Error.WriteLine(exception.Message);
}
```

Ordinary argument mistakes are **not** in that hierarchy. Passing `null` where a generator is
required, or a negative length, throws the usual `ArgumentNullException` / `ArgumentException` —
those are bugs in the calling code, not statements about a constraint set.

## `ConflictingAnyConstraintException`: the constraints admit no value

This is the one you will meet most, and it is a feature rather than a defect. Because values are
built to satisfy the whole specification rather than drawn and filtered, a specification satisfying
nothing is detected instead of looped over:

<!-- jd:allow=JD023 -->
```csharp
// No integer is both above 100 and below 10.
int impossible = Any.Int32().GreaterThan(100).LessThan(10).Generate();
```

**The message names both sides of the conflict.** That is a product guarantee, not an accident of
how the exception happened to be worded: a message saying only "no value is possible" would leave
you re-reading a twelve-call chain to find which two calls disagree.

Conflicts come in a few recognisable shapes:

| Shape | Example |
| --- | --- |
| bounds that cross | `.GreaterThan(100).LessThan(10)` |
| a lattice with no point in range | `.Between(1, 10).MultipleOf(50)` |
| exclusions that empty the domain | `Any.Boolean().Except(true, false)` |
| a length that cannot hold the fragments | `.StartingWith("ORDER-").WithLength(3)` |
| a count no element pool can fill | 100 distinct values from a pool of three |

## Caught at compile time instead

Many of those chains are decidable from constants the compiler can already see, and the analyzers
shipped in the package report them **before** the test ever runs. That is the difference between a
red build and a red test at 3 a.m.:

| Rule | Catches |
| --- | --- |
| [JD014](/docs/analyzers/JD014/) | a constant argument the generator's own guard refuses |
| [JD015](/docs/analyzers/JD015/) | a string chain that throws: fragments too long, or a value set a constraint empties |
| [JD016](/docs/analyzers/JD016/) | collection counts that cannot all hold |
| [JD017](/docs/analyzers/JD017/) | an enum constraint stepping outside the declared members |
| [JD023](/docs/analyzers/JD023/) | an integer chain narrowed to nothing |
| [JD024](/docs/analyzers/JD024/) | a constraint that narrows nothing at all |

The run-time checks stay in place regardless: they cover every argument an analyzer cannot see —
anything computed, read from a field, or passed in as a parameter.

## `AnyGenerationException`: a draw that could not be completed

A few constraints cannot be honoured by construction. Excluding values from a continuous range,
matching a regular expression, and filling a collection with distinct elements all end in the same
place: draw a candidate, check it, and try again if it does not fit.

Left unbounded, that is a loop that may never end. JustDummies bounds it — a fixed number of
attempts, then a refusal:

```csharp
// Two decimal places between 0 and 1 leave 101 candidates; excluding 100 of them leaves one.
decimal[] excluded = Enumerable.Range(0, 100).Select(index => index / 100m).ToArray();

try {
    decimal awkward = Any.Decimal().Between(0m, 1m).WithScale(2).Except(excluded).Generate();
} catch (AnyGenerationException exception) {
    // exception.Seed carries the seed of the run, when one was pinned — so the failure replays.
    Console.Error.WriteLine($"{exception.Message} (seed: {exception.Seed})");
}
```

`AnyGenerationException` carries a nullable `Seed`. When the draw happened inside a reproducible
scope, the seed that produced it is on the exception, so a bounded-redraw failure is as replayable
as any other failure.

Meeting one usually means the specification is tighter than intended rather than that the library
gave up early. Widen the interval, drop an exclusion, or ask for fewer distinct elements.

## `UnsupportedRegexException`: outside the regular subset

`Any.StringMatching` builds a value from the pattern rather than testing candidates against it,
which is why it can guarantee a match. Building requires the pattern to be **regular**, and the
library says so rather than guessing:

```csharp
try {
    // A back-reference is not a regular construct: no finite automaton can carry it.
    string impossible = Any.StringMatching(@"(\w+)\s\1").Generate();
} catch (UnsupportedRegexException exception) {
    Console.Error.WriteLine(exception.Message);
}
```

The supported constructs — and the refused ones — are listed in
[Strings and patterns](/docs/generators/strings/). The decision to parse a regular subset with the
library's own parser, rather than taking a regex-automaton dependency to widen coverage, is
[ADR-0008](https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-maintainers/adr/0008-generate-strings-from-a-home-grown-regular-subset.md).

## Symptom, cause, fix

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `ConflictingAnyConstraintException` at the arrange line | two constraints disagree | read the message — it names both — and drop the one that is not a domain invariant |
| `AnyGenerationException` after a pause | a bounded redraw exhausted its attempts | widen the domain, or ask for fewer distinct values |
| `UnsupportedRegexException` | the pattern uses a non-regular construct | rewrite it within the regular subset, or build the string with `Any.String()` constraints |
| a value your factory rejects | the constraints are looser than the factory | tighten the constraints until they imply the factory's contract |
| a test that passes on rerun | the failing values are gone | wrap the body in `Any.Reproducibly` so the next failure names its seed |
| a build warning `JD0NN` | a mistake decidable at compile time | open the rule page linked from the diagnostic |
