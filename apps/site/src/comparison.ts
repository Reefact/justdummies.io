/**
 * The comparison's data (§11): "a content file validated by schema, dated" (§2).
 *
 * The schema is this module's own type declarations — the same mechanism `ui.ts` uses
 * for its guarantee (a missing or misshapen entry is a compile error, and `astro check`
 * runs in CI), rather than a second, runtime schema validator this repository has no
 * other use for.
 *
 * WHAT MOVED HERE, AND WHY. The first version of this file held two facts per axis: an
 * identifier and a label. Everything a reader needed in order to understand what the
 * label meant lived nowhere — not here, not in the component, not on the page. §11.4 now
 * requires an axis to carry its own teaching, so the question it settles, the sentence
 * that explains it and its technical term are fields, exactly like the ratings. A new
 * axis cannot be added without them: the type refuses.
 *
 * A rating and a note are two different kinds of thing. The rating is a fact about what a
 * tool does, so it lives here. The note is a sentence explaining that fact, so — like
 * every other sentence the site displays — it lives in `ui.ts` and is only *referenced*
 * here by key. Library names are proper nouns and are spelled as their authors spell them
 * (§11.10), the same way `site.name` is never run through a translator; the one entry
 * that is not a library (§11.2's competitor everyone forgets) names itself through a
 * translated key instead, because "writing values by hand" is prose, not a trademark.
 */
import type { UiKey } from './i18n/ui';

/**
 * The ten criteria. This union's order is nothing but a declaration order — what a reader
 * meets, and in what order, is `families` below (§11.5).
 */
export type AxisId =
    | 'invariants'
    | 'callSite'
    | 'testIntent'
    | 'reuse'
    | 'realism'
    | 'graph'
    | 'reproducibility'
    | 'compileTime'
    | 'codeGen'
    | 'exploration';

/**
 * A figure under an axis, named by identifier rather than written out.
 *
 * §14.3 and §14.5 mean published C# can only be *referenced*: the fields below are
 * `CodeSample`'s own props, so an axis can point at a compiled snippet and at the values
 * the build drew from it, and cannot point at anything else. There is no field through
 * which code could be typed into this file.
 */
export interface AxisFigure {
    /** The identifier marked in the validated C# source. */
    id: string;
    outcome?: 'value' | 'sequence' | 'refusal' | 'none';
    from?: 'snippet' | 'tool';
}

/**
 * One criterion, and everything a reader needs in order to know what it asks.
 *
 * `questionKey` and `explanationKey` are **required**, and that is the mechanical half of
 * §11.4: an axis added without them does not compile. `termKey` is optional because not
 * every criterion has a technical name — inventing one would be the opposite of the point.
 */
export interface Axis {
    id: AxisId;
    /** Plain language, no jargon. The heading of the criterion's own block. */
    labelKey: UiKey;
    /** The criterion as the reader would put it to themselves. */
    questionKey: UiKey;
    /** One or two sentences. One idea per sentence (§11.10). */
    explanationKey: UiKey;
    /** The technical term, secondary — it names the idea, it does not explain it. */
    termKey?: UiKey;
    /** Shown only where a figure teaches more than another sentence would. */
    figure?: AxisFigure;
    /**
     * Where to send a reader whose real need is outside all four options. §11.5: a row
     * where everyone answers the same thing still owes the reader an answer.
     */
    elsewhereKey?: UiKey;
}

export const axes: ReadonlyArray<Axis> = [
    {
        id: 'invariants',
        labelKey: 'why.axis.invariants.label',
        questionKey: 'why.axis.invariants.question',
        explanationKey: 'why.axis.invariants.explanation',
        termKey: 'why.axis.invariants.term',
        figure: { id: 'why-order-reference', outcome: 'sequence' },
    },
    {
        id: 'callSite',
        labelKey: 'why.axis.callSite.label',
        questionKey: 'why.axis.callSite.question',
        explanationKey: 'why.axis.callSite.explanation',
        termKey: 'why.axis.callSite.term',
        figure: { id: 'why-quantity', outcome: 'sequence' },
    },
    {
        id: 'testIntent',
        labelKey: 'why.axis.testIntent.label',
        questionKey: 'why.axis.testIntent.question',
        explanationKey: 'why.axis.testIntent.explanation',
    },
    {
        id: 'reuse',
        labelKey: 'why.axis.reuse.label',
        questionKey: 'why.axis.reuse.question',
        explanationKey: 'why.axis.reuse.explanation',
    },
    {
        id: 'realism',
        labelKey: 'why.axis.realism.label',
        questionKey: 'why.axis.realism.question',
        explanationKey: 'why.axis.realism.explanation',
        termKey: 'why.axis.realism.term',
    },
    {
        id: 'graph',
        labelKey: 'why.axis.graph.label',
        questionKey: 'why.axis.graph.question',
        explanationKey: 'why.axis.graph.explanation',
        termKey: 'why.axis.graph.term',
    },
    {
        id: 'reproducibility',
        labelKey: 'why.axis.reproducibility.label',
        questionKey: 'why.axis.reproducibility.question',
        explanationKey: 'why.axis.reproducibility.explanation',
        termKey: 'why.axis.reproducibility.term',
    },
    {
        /*
         * NO FIGURE HERE, AND NOT FOR WANT OF ONE. The example this criterion asks for is a
         * chain no value can satisfy — at least ten characters and at most five. §14.4
         * forbids publishing an expression that triggers one of the library's own
         * diagnostics, and the snippet project compiles with the analyzers on and warnings
         * as errors, so such a snippet cannot exist. It is described in prose, exactly as
         * the competitors' APIs are. Adding it as a code block fails the build.
         */
        id: 'compileTime',
        labelKey: 'why.axis.compileTime.label',
        questionKey: 'why.axis.compileTime.question',
        explanationKey: 'why.axis.compileTime.explanation',
        termKey: 'why.axis.compileTime.term',
    },
    {
        id: 'codeGen',
        labelKey: 'why.axis.codeGen.label',
        questionKey: 'why.axis.codeGen.question',
        explanationKey: 'why.axis.codeGen.explanation',
        termKey: 'why.axis.codeGen.term',
    },
    {
        id: 'exploration',
        labelKey: 'why.axis.exploration.label',
        questionKey: 'why.axis.exploration.question',
        explanationKey: 'why.axis.exploration.explanation',
        termKey: 'why.axis.exploration.term',
        elsewhereKey: 'why.axis.exploration.elsewhere',
    },
];

/**
 * `Record<AxisId, Cell>` already forces every `Ratings` object to carry all ten axes and no
 * others, but `axes` itself is a plain array — edited by hand, read by the page to decide
 * what blocks to draw — so nothing stops it from dropping one or repeating another while
 * every `Ratings` object still type-checks. This is the runtime half for `axes`, the same
 * pattern the tool `id` check below uses.
 */
const allAxisIds: readonly AxisId[] = [
    'invariants',
    'callSite',
    'testIntent',
    'reuse',
    'realism',
    'graph',
    'reproducibility',
    'compileTime',
    'codeGen',
    'exploration',
];

if (axes.length !== allAxisIds.length || allAxisIds.some((id) => !axes.some((axis) => axis.id === id))) {
    throw new Error('comparison.ts: axes must list every AxisId exactly once.');
}

/**
 * The criteria, grouped under the four questions a reader actually arrives with (§11.5).
 *
 * THIS REPLACES AN ORDERING BY OUR OWN MARGIN, and that is the whole reason it exists. The
 * axes used to run "from most to least differentiating", which sounds like rigour and is
 * really a ranking by how well JustDummies does: the first three criteria were three ways
 * of stating one strength, JustDummies took the top answer on all three, and no other
 * option took it on any of them. A reader who did not already believe the claim met three
 * consecutive wins before reaching a criterion anyone else could take — which is how a
 * comparison stops being read as one.
 *
 * Grouped by question, the order is the reader's rather than ours, and three of the four
 * families hold a criterion JustDummies does not win outright: AutoFixture takes `graph` in
 * the first, every option ties on `reuse` in the second, Bogus takes `realism` outright in
 * the third. The fourth is the one family where JustDummies rates "core" on all three of its
 * criteria — but two of the three notes still carry a real limit: `reproducibility` ships
 * through the xUnit adapter only, and `compileTime` catches a self-contradictory rule, never
 * a domain invariant nobody declared as a rule at all. That second limit is narrower than it
 * sounds and not a clean JustDummies-only gap either: Bogus Premium's analyzer can flag a
 * property with no RuleFor, because a Faker<T>'s properties are a known, enumerable set to
 * check completeness against — a hand-written constructor's own invariants are not, so
 * nothing here can flag one that was simply never written. Nothing was deleted to arrange
 * any of this; the ten criteria and their answers are the ones that were already here.
 */
export interface Family {
    id: string;
    /** The question, as the reader would ask it. It is the family's heading. */
    headingKey: UiKey;
    axes: readonly AxisId[];
}

export const families: ReadonlyArray<Family> = [
    { id: 'accepted', headingKey: 'why.family.accepted', axes: ['invariants', 'callSite', 'graph'] },
    { id: 'readable', headingKey: 'why.family.readable', axes: ['testIntent', 'reuse'] },
    { id: 'kind', headingKey: 'why.family.kind', axes: ['realism', 'exploration'] },
    { id: 'wrong', headingKey: 'why.family.wrong', axes: ['reproducibility', 'compileTime', 'codeGen'] },
];

/**
 * The runtime half for `families`, and it guards something the type cannot: that the
 * grouping is a partition. An axis listed twice would be compared twice, and an axis
 * listed nowhere would vanish from the page while every `Ratings` object still carried
 * its answer — a criterion silently dropped is the failure mode this whole file is built
 * to make impossible.
 */
const groupedAxisIds: readonly AxisId[] = families.flatMap((family) => family.axes);

if (
    groupedAxisIds.length !== allAxisIds.length ||
    allAxisIds.some((id) => groupedAxisIds.filter((grouped) => grouped === id).length !== 1)
) {
    throw new Error('comparison.ts: families must list every AxisId exactly once, across all families.');
}

/** The axis record for an id, so a family can render without a second lookup table. */
export function axisOf(id: AxisId): Axis {
    return axes.find((axis) => axis.id === id)!;
}

/** §11.6 — three values, and never a checkmark or a cross: the sign is never colour alone. */
export type Rating = 'core' | 'possible' | 'out-of-scope';

/**
 * A discriminated union rather than one shape with an optional `noteKey`.
 *
 * §11.6 requires every cell other than "built for this" to say what the work is or where
 * the limit lies, and an optional field on every rating would let that rule be silently
 * skipped — a `{ rating: 'out-of-scope' }` with no note would compile, and nine of them
 * did. A cell that says only "not its job" is the euphemism §11.5 forbids: it hides
 * whether the tool's authors decided against it or whether nobody has built it yet, and
 * those are different facts about a project.
 */
export type Cell =
    | { rating: 'core'; noteKey?: UiKey }
    | { rating: 'possible'; noteKey: UiKey }
    | { rating: 'out-of-scope'; noteKey: UiKey };

export type Ratings = Record<AxisId, Cell>;

/**
 * The three answers, with their definitions, as one list.
 *
 * The legend and the cells read the same array, so a rating word cannot exist on the page
 * without the sentence that defines it — which is what §11.6 asks for, expressed as data
 * rather than as a habit.
 */
export const ratings: ReadonlyArray<{ id: Rating; labelKey: UiKey; legendKey: UiKey }> = [
    { id: 'core', labelKey: 'why.rating.core', legendKey: 'why.legend.core' },
    { id: 'possible', labelKey: 'why.rating.possible', legendKey: 'why.legend.possible' },
    { id: 'out-of-scope', labelKey: 'why.rating.outOfScope', legendKey: 'why.legend.outOfScope' },
];

export type ToolId = 'justdummies' | 'bogus' | 'autofixture' | 'manual';

interface ToolFields {
    id: ToolId;
    /** The need in the reader's own voice — the line they recognise themselves in (§11.3). */
    needKey: UiKey;
    /** Its purpose, close to how its own authors would put it (§11.8). */
    descriptionKey: UiKey;
    /** What you actually get back. The half a reader can act on. */
    concretelyKey: UiKey;
    ratings: Ratings;
}

/**
 * A discriminated union on `kind`, for the same reason `Cell` is one: a `library` with no
 * `name`/`repo`, or a `manual` entry with no `nameKey`, used to type-check and then render
 * a blank heading or an entry silently missing its repository link.
 *
 * `self` is the addition. JustDummies used to be a bare `Ratings` — the constant column of
 * every row, and the only thing on a page about it that was never described. It is a tool
 * among the four now, with the same need line and the same one-sentence purpose; what it
 * does not have is a `chooseInsteadKey`, because "when to choose it instead of
 * JustDummies" is not a question it can be asked.
 */
export type Tool =
    | (ToolFields & { kind: 'self'; name: string; repo: string })
    | (ToolFields & {
          kind: 'library';
          name: string;
          repo: string;
          chooseInsteadKey: UiKey;
          /** §11.10 — what was checked against that repository, shown rather than kept in a comment. */
          checkedKey: UiKey;
          sources: readonly string[];
      })
    | (ToolFields & { kind: 'manual'; nameKey: UiKey; chooseInsteadKey: UiKey });

/** Every tool except the one the page is about. */
export type Competitor = Exclude<Tool, { kind: 'self' }>;

const justDummies: Tool = {
    id: 'justdummies',
    kind: 'self',
    name: 'JustDummies',
    repo: 'https://github.com/Reefact/just-dummies',
    needKey: 'why.tool.justdummies.need',
    descriptionKey: 'why.tool.justdummies.description',
    concretelyKey: 'why.tool.justdummies.concretely',
    ratings: {
        invariants: { rating: 'core' },
        callSite: { rating: 'core' },
        testIntent: { rating: 'core' },
        reuse: { rating: 'possible', noteKey: 'why.note.justdummies.reuse' },
        realism: { rating: 'out-of-scope', noteKey: 'why.note.justdummies.realism' },
        graph: { rating: 'possible', noteKey: 'why.note.justdummies.graph' },
        reproducibility: { rating: 'core', noteKey: 'why.note.justdummies.reproducibility' },
        compileTime: { rating: 'core', noteKey: 'why.note.justdummies.compileTime' },
        codeGen: { rating: 'core', noteKey: 'why.note.justdummies.codeGen' },
        exploration: { rating: 'out-of-scope', noteKey: 'why.note.justdummies.exploration' },
    },
};

/**
 * Verified against the project's own README at https://github.com/bchavez/Bogus —
 * realistic locale-aware data (Name, Address, Internet, Commerce…), rules — including
 * bounded generators like `Random.Int(min, max)` — that can be chained on a `Faker<T>`
 * built inline, right before `Generate()`, as readily as configured up front;
 * `UseSeed()`/`Randomizer.Seed` for reproducible runs; and a paid "Bogus Premium" tier
 * whose Roslyn analyzer flags and can insert a missing `RuleFor()`.
 *
 * That paragraph is no longer only here: `checkedKey` and `sources` put it on the page,
 * where the reader §11.10 wrote the rule for can actually read it.
 */
const bogus: Tool = {
    id: 'bogus',
    kind: 'library',
    name: 'Bogus',
    repo: 'https://github.com/bchavez/Bogus',
    /* The pages actually read, not the project's front door: the Premium claim comes from
       the wiki page that describes the tier, and the free tier's own check comes from the
       source file that declares it. */
    sources: [
        'https://github.com/bchavez/Bogus',
        'https://github.com/bchavez/Bogus/wiki/Bogus-Premium',
        'https://github.com/bchavez/Bogus/blob/master/Source/Bogus/Faker%5BT%5D.cs',
    ],
    needKey: 'why.tool.bogus.need',
    descriptionKey: 'why.tool.bogus.description',
    concretelyKey: 'why.tool.bogus.concretely',
    chooseInsteadKey: 'why.tool.bogus.chooseInstead',
    checkedKey: 'why.tool.bogus.checked',
    ratings: {
        invariants: { rating: 'possible', noteKey: 'why.note.bogus.invariants' },
        callSite: { rating: 'possible', noteKey: 'why.note.bogus.callSite' },
        testIntent: { rating: 'possible', noteKey: 'why.note.bogus.testIntent' },
        reuse: { rating: 'possible', noteKey: 'why.note.bogus.reuse' },
        realism: { rating: 'core' },
        graph: { rating: 'possible', noteKey: 'why.note.bogus.graph' },
        reproducibility: { rating: 'core', noteKey: 'why.note.bogus.reproducibility' },
        compileTime: { rating: 'possible', noteKey: 'why.note.bogus.compileTime' },
        codeGen: { rating: 'possible', noteKey: 'why.note.bogus.codeGen' },
        exploration: { rating: 'out-of-scope', noteKey: 'why.note.bogus.exploration' },
    },
};

/**
 * Verified against the project's own README and wiki cheat sheet at
 * https://github.com/AutoFixture/AutoFixture — anonymous (not realistic) values,
 * automatic graph construction ("create values of virtually any type"), a per-call
 * override on the `Build<T>()` chain (`.With(x => x.Prop, value)` — a pinned value or a
 * hand-written generator lambda, not a declarative constraint) alongside the separate,
 * reusable `ISpecimenBuilder`/`Customize<T>()` path, and no built-in seeding: repeatable
 * random values remain an open feature request (github.com/AutoFixture/AutoFixture/issues/1406).
 *
 * That last one is why the third rating word describes a scope and never an intention
 * (§11.6). An open request is not a decision, and a cell reading "deliberately not" would
 * attribute to AutoFixture's maintainers a position their own tracker contradicts.
 *
 * TWO CLAIMS WERE WRONG HERE AND ARE NAMED SO THEY ARE NOT REINTRODUCED. The `invariants`
 * note used to say generation throws until a customization is written; the default
 * `Fixture` already honours a type's own `[Range]`, `[StringLength]` and
 * `[RegularExpression]` annotations with no configuration at all, and only a rule enforced
 * inside a constructor needs one. And `testIntent` used to be rated "possible" on a
 * criterion the project's own description names as its primary goal.
 */
const autoFixture: Tool = {
    id: 'autofixture',
    kind: 'library',
    name: 'AutoFixture',
    repo: 'https://github.com/AutoFixture/AutoFixture',
    sources: [
        'https://github.com/AutoFixture/AutoFixture',
        'https://autofixture.io/api/AutoFixture.DataAnnotations.html',
        'https://github.com/AutoFixture/AutoFixture/issues/1406',
    ],
    needKey: 'why.tool.autofixture.need',
    descriptionKey: 'why.tool.autofixture.description',
    concretelyKey: 'why.tool.autofixture.concretely',
    chooseInsteadKey: 'why.tool.autofixture.chooseInstead',
    checkedKey: 'why.tool.autofixture.checked',
    ratings: {
        invariants: { rating: 'possible', noteKey: 'why.note.autofixture.invariants' },
        callSite: { rating: 'possible', noteKey: 'why.note.autofixture.callSite' },
        /*
         * "Built for this", and it was rated "possible" until the project's own description
         * was read back: AutoFixture states its primary goal as letting developers focus on
         * what is being tested rather than on setting the scenario up. That is this
         * criterion, in its authors' words. Rating it anything less was a criterion bent to
         * favour the page it appears on, and §11.1 costs more than the row was worth.
         */
        testIntent: { rating: 'core', noteKey: 'why.note.autofixture.testIntent' },
        reuse: { rating: 'possible', noteKey: 'why.note.autofixture.reuse' },
        realism: { rating: 'out-of-scope', noteKey: 'why.note.autofixture.realism' },
        graph: { rating: 'core' },
        reproducibility: { rating: 'out-of-scope', noteKey: 'why.note.autofixture.reproducibility' },
        compileTime: { rating: 'out-of-scope', noteKey: 'why.note.autofixture.compileTime' },
        codeGen: { rating: 'out-of-scope', noteKey: 'why.note.autofixture.codeGen' },
        exploration: { rating: 'out-of-scope', noteKey: 'why.note.autofixture.exploration' },
    },
};

/**
 * §11.2 — "the competitor not to forget": most of what a dummy-data library replaces is
 * not another library, it is a value typed by hand. Its ratings need no external source:
 * they follow from what a literal is, not from a project's documentation, which is why it
 * is the one entry with no `sources`.
 */
const manual: Tool = {
    id: 'manual',
    kind: 'manual',
    nameKey: 'why.tool.manual.name',
    needKey: 'why.tool.manual.need',
    descriptionKey: 'why.tool.manual.description',
    concretelyKey: 'why.tool.manual.concretely',
    chooseInsteadKey: 'why.tool.manual.chooseInstead',
    ratings: {
        invariants: { rating: 'possible', noteKey: 'why.note.manual.invariants' },
        callSite: { rating: 'out-of-scope', noteKey: 'why.note.manual.callSite' },
        testIntent: { rating: 'possible', noteKey: 'why.note.manual.testIntent' },
        reuse: { rating: 'possible', noteKey: 'why.note.manual.reuse' },
        realism: { rating: 'possible', noteKey: 'why.note.manual.realism' },
        graph: { rating: 'possible', noteKey: 'why.note.manual.graph' },
        reproducibility: { rating: 'core', noteKey: 'why.note.manual.reproducibility' },
        compileTime: { rating: 'out-of-scope', noteKey: 'why.note.manual.compileTime' },
        codeGen: { rating: 'out-of-scope', noteKey: 'why.note.manual.codeGen' },
        exploration: { rating: 'out-of-scope', noteKey: 'why.note.manual.exploration' },
    },
};

/**
 * Every option the page compares, JustDummies first — it is the column no view ever
 * hides. The rest are in source order: Bogus leads because it is the closer call for most
 * readers, and the hand-written literal closes because it is the one nobody names but
 * almost everybody uses.
 */
export const tools: readonly Tool[] = [justDummies, bogus, autoFixture, manual];

/** The one the page is about, and the constant term of every comparison on it. */
export const self: Tool = justDummies;

/** The three it is compared against — the `<select>`'s options, and nothing else. */
export const competitors: readonly Competitor[] = tools.filter(
    (tool): tool is Competitor => tool.kind !== 'self',
);

/**
 * `id` cannot be made unique by the type system — TypeScript has no way to constrain
 * sibling literals in an array against each other — so this is the runtime half of the
 * same guarantee, the same way `PlaygroundStrings`' static constructor checks what its own
 * type declarations cannot. A duplicate would make two tools appear together under one
 * `<select>` option and one `data-tool` match, with neither reachable alone; this fails
 * the build instead, the moment a page imports this module.
 */
const duplicateToolId = tools.map((entry) => entry.id).find((id, index, ids) => ids.indexOf(id) !== index);

if (duplicateToolId !== undefined) {
    throw new Error(`comparison.ts: duplicate tool id "${duplicateToolId}" — every tool id must be unique.`);
}

/**
 * Projects the page names without comparing them.
 *
 * One criterion — hunting for the input that breaks your code — is answered by none of the
 * four options, and §11.5 says a row like that owes the reader the name of the family that
 * does answer it. Naming a project is a claim about it, so the claim carries its source
 * here like every other: verified against each repository, both being property-based
 * testing libraries for .NET that shrink a failing case.
 */
export const mentioned: readonly string[] = [
    'https://github.com/fscheck/FsCheck',
    'https://github.com/AnthonyLloyd/CsCheck',
];

/**
 * §11.10 — a content date, not a code comment: `WhyJustDummiesContent.astro` reads this both
 * to warn at build time once it goes stale, and to format the date `why.verified` displays
 * (§6.5's locale rules) — one source rather than a hand-typed date that could disagree with
 * the value the staleness check itself trusts.
 */
export const comparisonVerifiedOn = '2026-08-16';

/**
 * How long a verification is trusted before the build starts saying so.
 *
 * A hundred and twenty days rather than a hundred and eighty. What this page claims about
 * other projects includes the contents of a paid tier and the state of an open feature
 * request — facts that move on their own, without anyone here touching a file. Half a year
 * is longer than either of them can be trusted to hold still.
 */
export const comparisonStaleAfterDays = 120;
