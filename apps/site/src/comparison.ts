/**
 * The comparison table's data (§11): "a content file validated by schema, dated" (§2).
 *
 * The schema is this module's own type declarations — the same mechanism `ui.ts` uses
 * for its guarantee (a missing or misshapen entry is a compile error, and `astro check`
 * runs in CI), rather than a second, runtime schema validator this repository has no
 * other use for.
 *
 * A rating and a note are two different kinds of thing. The rating is a fact about what
 * a tool does, so it lives here. The note is a sentence explaining that fact, so — like
 * every other sentence the site displays — it lives in `ui.ts` and is only *referenced*
 * here by key. Library names are proper nouns and are spelled as their authors spell
 * them (§11.8), the same way `site.name` is never run through a translator; the one
 * entry that is not a library (§11.2's competitor everyone forgets) names itself through
 * a translated key instead, because "writing values by hand" is prose, not a trademark.
 */
import type { UiKey } from './i18n/ui';

/** Ordered from most to least differentiating (§11.3). */
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

export const axes: ReadonlyArray<{ id: AxisId; labelKey: UiKey }> = [
    { id: 'invariants', labelKey: 'why.axis.invariants' },
    { id: 'callSite', labelKey: 'why.axis.callSite' },
    { id: 'testIntent', labelKey: 'why.axis.testIntent' },
    { id: 'reuse', labelKey: 'why.axis.reuse' },
    { id: 'realism', labelKey: 'why.axis.realism' },
    { id: 'graph', labelKey: 'why.axis.graph' },
    { id: 'reproducibility', labelKey: 'why.axis.reproducibility' },
    { id: 'compileTime', labelKey: 'why.axis.compileTime' },
    { id: 'codeGen', labelKey: 'why.axis.codeGen' },
    { id: 'exploration', labelKey: 'why.axis.exploration' },
];

/**
 * `Record<AxisId, Cell>` already forces every `Ratings` object to carry all ten axes and no
 * others, but `axes` itself is a plain array — edited by hand, read by `ComparisonTable.astro`
 * to decide what rows to draw — so nothing stops it from dropping one or repeating another
 * while every `Ratings` object still type-checks, and the table's caption keeps promising ten.
 * This is the runtime half for `axes`, the same pattern the competitor `id` check above uses.
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

/** §11.4 — three values, and never a checkmark or a cross: the sign is never colour alone. */
export type Rating = 'core' | 'possible' | 'out-of-scope';

/**
 * A discriminated union rather than one shape with an optional `noteKey`: §11.4 requires a
 * `possible` cell to name its cost, and an optional field on every rating would let that rule
 * be silently skipped — a `{ rating: 'possible' }` with no note would compile. Making `noteKey`
 * a required companion of `'possible'` (and only `'possible'`) is what makes this type actually
 * carry the rule the comment used to just assert.
 */
export type Cell =
    | { rating: 'core'; noteKey?: UiKey }
    | { rating: 'possible'; noteKey: UiKey }
    | { rating: 'out-of-scope'; noteKey?: UiKey };

export type Ratings = Record<AxisId, Cell>;

interface CompetitorFields {
    id: string;
    /** A one-line description, close to how the project's own authors describe it. */
    descriptionKey: UiKey;
    /** §11.6 — "when to choose it instead of JustDummies". Mandatory, never empty, never ironic. */
    chooseInsteadKey: UiKey;
    ratings: Ratings;
}

/**
 * A discriminated union on `kind`, for the same reason `Cell` is one: a `library` with no
 * `name`/`repo`, or a `manual` entry with no `nameKey`, used to type-check and then render a
 * blank heading or a card silently missing its "view the repository" link. Each kind now
 * carries only the fields it can actually have — a library is a proper noun with a repository
 * to link to (§11.6), and the one entry that is not a library (§11.2) names itself through a
 * translated key instead, because "writing values by hand" is prose, not a trademark.
 */
export type Competitor =
    | (CompetitorFields & { kind: 'library'; name: string; repo: string })
    | (CompetitorFields & { kind: 'manual'; nameKey: UiKey });

/**
 * JustDummies is not a `Competitor`: it is the constant column every duel and every row
 * of the matrix compares against, never itself a choice in the `<select>`.
 */
export const justDummies: Ratings = {
    invariants: { rating: 'core' },
    callSite: { rating: 'core' },
    testIntent: { rating: 'core' },
    reuse: { rating: 'possible', noteKey: 'why.note.justdummies.reuse' },
    realism: { rating: 'out-of-scope', noteKey: 'why.note.justdummies.realism' },
    graph: { rating: 'possible', noteKey: 'why.note.justdummies.graph' },
    reproducibility: { rating: 'core' },
    compileTime: { rating: 'possible', noteKey: 'why.note.justdummies.compileTime' },
    codeGen: { rating: 'core' },
    exploration: { rating: 'out-of-scope', noteKey: 'why.note.justdummies.exploration' },
};

/**
 * Verified against the project's own README at
 * https://github.com/bchavez/Bogus — realistic locale-aware data (Name, Address,
 * Internet, Commerce…), rules — including bounded generators like `Random.Int(min, max)` —
 * that can be chained on a `Faker<T>` built inline, right before `Generate()`, as readily
 * as configured up front; `UseSeed()`/`Randomizer.Seed` for reproducible runs; and a paid
 * "Bogus Premium" tier whose Roslyn analyzer flags and can insert a missing `RuleFor()`.
 */
const bogus: Competitor = {
    id: 'bogus',
    kind: 'library',
    name: 'Bogus',
    repo: 'https://github.com/bchavez/Bogus',
    descriptionKey: 'why.bogus.description',
    chooseInsteadKey: 'why.bogus.chooseInstead',
    ratings: {
        invariants: { rating: 'possible', noteKey: 'why.note.bogus.invariants' },
        callSite: { rating: 'possible', noteKey: 'why.note.bogus.callSite' },
        testIntent: { rating: 'out-of-scope' },
        reuse: { rating: 'possible', noteKey: 'why.note.bogus.reuse' },
        realism: { rating: 'core' },
        graph: { rating: 'possible', noteKey: 'why.note.bogus.graph' },
        reproducibility: { rating: 'core' },
        compileTime: { rating: 'possible', noteKey: 'why.note.bogus.compileTime' },
        codeGen: { rating: 'possible', noteKey: 'why.note.bogus.codeGen' },
        exploration: { rating: 'out-of-scope' },
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
 */
const autoFixture: Competitor = {
    id: 'autofixture',
    kind: 'library',
    name: 'AutoFixture',
    repo: 'https://github.com/AutoFixture/AutoFixture',
    descriptionKey: 'why.autofixture.description',
    chooseInsteadKey: 'why.autofixture.chooseInstead',
    ratings: {
        invariants: { rating: 'possible', noteKey: 'why.note.autofixture.invariants' },
        callSite: { rating: 'possible', noteKey: 'why.note.autofixture.callSite' },
        testIntent: { rating: 'possible', noteKey: 'why.note.autofixture.testIntent' },
        reuse: { rating: 'possible', noteKey: 'why.note.autofixture.reuse' },
        realism: { rating: 'out-of-scope' },
        graph: { rating: 'core' },
        reproducibility: { rating: 'out-of-scope' },
        compileTime: { rating: 'out-of-scope' },
        codeGen: { rating: 'out-of-scope' },
        exploration: { rating: 'out-of-scope' },
    },
};

/**
 * §11.2 — "the competitor not to forget": most of what a dummy-data library replaces is
 * not another library, it is a value typed by hand. Its ratings need no external source:
 * they follow from what a literal is, not from a project's documentation.
 */
const manual: Competitor = {
    id: 'manual',
    kind: 'manual',
    nameKey: 'why.manual.name',
    descriptionKey: 'why.manual.description',
    chooseInsteadKey: 'why.manual.chooseInstead',
    ratings: {
        invariants: { rating: 'possible', noteKey: 'why.note.manual.invariants' },
        callSite: { rating: 'out-of-scope' },
        testIntent: { rating: 'possible', noteKey: 'why.note.manual.testIntent' },
        reuse: { rating: 'out-of-scope' },
        realism: { rating: 'possible', noteKey: 'why.note.manual.realism' },
        graph: { rating: 'possible', noteKey: 'why.note.manual.graph' },
        reproducibility: { rating: 'core' },
        compileTime: { rating: 'out-of-scope', noteKey: 'why.note.manual.compileTime' },
        codeGen: { rating: 'out-of-scope' },
        exploration: { rating: 'out-of-scope' },
    },
};

/** Duel order is source order: Bogus first, because it is the closer call for most readers. */
export const competitors: readonly Competitor[] = [bogus, autoFixture, manual];

/**
 * `id` cannot be made unique by the type system — TypeScript has no way to constrain
 * sibling literals in an array against each other — so this is the runtime half of the
 * same guarantee, the same way `PlaygroundStrings`' static constructor checks what its own
 * type declarations cannot. A duplicate would make two competitors appear together under
 * one `<select>` option and one `data-competitor` match, with neither reachable alone; this
 * fails the build instead, the moment a page imports this module.
 */
const duplicateCompetitorId = competitors
    .map((entry) => entry.id)
    .find((id, index, ids) => ids.indexOf(id) !== index);

if (duplicateCompetitorId !== undefined) {
    throw new Error(`comparison.ts: duplicate competitor id "${duplicateCompetitorId}" — every competitor id must be unique.`);
}

/**
 * §11.8 — a content date, not a code comment: `WhyJustDummiesContent.astro` reads this both
 * to warn at build time once it goes stale, and to format the date `why.verified` displays
 * (§6.5's locale rules) — one source rather than a hand-typed date that could disagree with
 * the value the staleness check itself trusts.
 */
export const comparisonVerifiedOn = '2026-08-15';

/** How long a verification is trusted before the build starts saying so. */
export const comparisonStaleAfterDays = 180;
