#!/usr/bin/env node
/**
 * Every module under the browser suite takes its `test` from the harness — or takes none.
 *
 * WHY IT MATTERS. `tests/browser/support/harness.ts` holds two things no check should have to
 * remember: it keeps the run off the measurement hosts, so a release does not post a burst of
 * synthetic page views into the real audience figures, and it hands the browser the .NET
 * runtime from disk, so the dev server is never asked to stream the hundred and fifty
 * megabytes that kill it. A check importing `test` straight from Playwright opts out of both,
 * and **neither failure appears as a red check**: the first surfaces weeks later as visits
 * nobody made, the second as some unrelated check reporting ERR_CONNECTION_REFUSED.
 *
 * WHY THIS PARSES RATHER THAN GREPS. Because grepping was tried, twice, and leaked three
 * times. A line-oriented pattern misses a double-quoted specifier and named imports broken
 * across lines; flattening the file to fix that merges semicolonless imports into one record,
 * so a type-only import at the top hides a runner import below it; and both forms miss a
 * check filed in a subdirectory, which Playwright still discovers. Each hole was valid
 * TypeScript that nothing in this repository prohibits. A guard with a way around it is worse
 * than no guard, because it is the reason nobody looks — so this asks the compiler instead of
 * guessing, and the argument ends.
 *
 * WHAT IS FLAGGED, precisely. A static import of '@playwright/test' that binds `test` — under
 * any name, `{ test }` or `{ test as t }` — or that binds the whole module as a namespace,
 * which can reach it. And **every other way a module can be loaded**, because a guard that
 * covers one way is a guard that names the others as the route around it: a re-export, a
 * `require`, an `import x = require(…)`, and a dynamic `import()`. The tree is walked whole
 * rather than statement by statement, since a dynamic import is an expression and can sit
 * anywhere one can.
 *
 * A dynamic specifier this cannot read — a variable, a template, a concatenation — is refused
 * rather than waved through. What cannot be verified is not the same as what is fine, and no
 * check in this suite needs to load a module by a name computed at run time.
 *
 * Not flagged: `import type { Page }` and `import { type Page }`, which bind no runner and
 * TypeScript erases; a bare `import '@playwright/test'`, which binds nothing at all; and
 * `import { expect }`, which names the same assertion the harness re-exports and cannot
 * bypass anything.
 *
 * What remains outside its reach is `eval` and friends. Said rather than left implied — but a
 * check that reaches for eval to dodge a lint is not an accident anybody has by mistake.
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SUITE = join(ROOT, 'tests', 'browser');
const RUNNER = '@playwright/test';

/**
 * Every module under the suite, not only the files whose names end in `.spec`.
 *
 * Scanning the checks alone left the runner one hop away: a check importing `test` from an
 * ordinary helper passes, while the helper re-exports it from Playwright and is never opened.
 * Following each check's imports would work and would also have to follow the imports of what
 * it finds, and a dynamic one would slip past. Reading everything is both simpler and
 * stronger — nothing under this directory may bind the runner except the harness, and the
 * harness is one file.
 */
const IS_MODULE = /\.[cm]?[jt]sx?$/;

/** The one module allowed to import the runner, because it is what the rest import instead. */
const HARNESS = join(SUITE, 'support', 'harness.ts');

/** Recursive, because `testDir` is: a check in a subdirectory is still a check. */
async function* modules(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
            yield* modules(path);
        } else if (IS_MODULE.test(entry.name) && path !== HARNESS) {
            yield path;
        }
    }
}

/** How this declaration could reach the runner, or null if it cannot. */
function reachesRunner(declaration) {
    const clause = declaration.importClause;

    /* `import '@playwright/test'` binds nothing; `import type` is erased. */
    if (clause === undefined || clause.isTypeOnly) {
        return null;
    }

    if (clause.name !== undefined) {
        return `default as ${clause.name.text}`;
    }

    const named = clause.namedBindings;

    if (named === undefined) {
        return null;
    }

    if (ts.isNamespaceImport(named)) {
        return `* as ${named.name.text}`;
    }

    for (const element of named.elements) {
        /* `{ test as t }` names it in propertyName; `{ test }` in name. */
        const imported = (element.propertyName ?? element.name).text;

        if (imported === 'test' && !element.isTypeOnly) {
            return element.propertyName === undefined ? 'test' : `test as ${element.name.text}`;
        }
    }

    return null;
}

/** Whether a node names the runner as a module, and how — or null if it does not. */
function loadsRunner(node) {
    /* `import … from '@playwright/test'` at any depth a declaration can appear. */
    if (ts.isImportDeclaration(node)) {
        return ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === RUNNER
            ? reachesRunner(node)
            : null;
    }

    /* `export … from '@playwright/test'` — re-exporting the runner hands it to a check that
     * would then import it from a neighbour and pass this guard on both sides.
     *
     * Which specifiers, not merely which module. An earlier version flagged the whole
     * declaration and so would have refused `export type { Page } from …` and
     * `export { expect } from …`, neither of which can hand anyone a runner. Nothing in the
     * suite writes either today, which is exactly why it was worth fixing before something
     * did: a guard that goes red on harmless code is one somebody switches off. */
    if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
        if (!ts.isStringLiteral(node.moduleSpecifier) || node.moduleSpecifier.text !== RUNNER || node.isTypeOnly) {
            return null;
        }

        const clause = node.exportClause;

        /* `export * from …` carries everything, `test` included. */
        if (clause === undefined) {
            return 're-exports the whole module';
        }

        /* `export * as pw from …` hands over an object with `test` on it. */
        if (ts.isNamespaceExport(clause)) {
            return `re-exports the module as ${clause.name.text}`;
        }

        for (const element of clause.elements) {
            const exported = (element.propertyName ?? element.name).text;

            if (exported === 'test' && !element.isTypeOnly) {
                return element.propertyName === undefined ? 're-exports test' : `re-exports test as ${element.name.text}`;
            }
        }

        return null;
    }

    /* `import runner = require('@playwright/test')`. */
    if (ts.isImportEqualsDeclaration(node)) {
        const reference = node.moduleReference;

        return ts.isExternalModuleReference(reference)
            && ts.isStringLiteral(reference.expression)
            && reference.expression.text === RUNNER
            ? `require as ${node.name.text}`
            : null;
    }

    if (!ts.isCallExpression(node)) {
        return null;
    }

    const dynamic = node.expression.kind === ts.SyntaxKind.ImportKeyword;
    const required = ts.isIdentifier(node.expression) && node.expression.text === 'require';

    if (!dynamic && !required) {
        return null;
    }

    const [specifier] = node.arguments;

    if (specifier !== undefined && ts.isStringLiteralLike(specifier)) {
        return specifier.text === RUNNER ? (dynamic ? 'import() of the module' : 'require() of the module') : null;
    }

    /* A specifier this cannot read — a variable, a template, a concatenation. Refused rather
     * than waved through: what cannot be verified is not the same as what is fine, and
     * nothing in this suite needs to load a module by a name computed at run time. */
    return dynamic ? 'import() of a specifier this check cannot read' : 'require() of a specifier this check cannot read';
}

/**
 * Where a check may take `test` from, and where the module graph may go.
 *
 * THE RULE ABOVE IS NOT ENOUGH ON ITS OWN, and Codex is what showed why — twice. It reads the
 * modules under `tests/browser`, so a helper filed outside — `tests/shared-runner.ts`, say —
 * is never opened, while Playwright loads it as an ordinary dependency.
 *
 * The first answer here refused a check that bound `test` from anything but the harness. That
 * caught `import { test } from '../shared-runner'` and missed
 * `import test from '../shared-runner'`, which Codex then found: a default import has no named
 * bindings, so the loop had nothing to walk. Patching the default case would have left
 * `import { runner } from '../shared-runner'` and `runner(…)`, which no rule about the name
 * `test` can ever see.
 *
 * So the name is the wrong thing to chase. **A relative import may not leave the suite.** With
 * that, the module graph a check reaches through relative paths is closed inside a directory
 * every file of which the rule above has already read — so what a helper is called, and what it
 * names what it re-exports, stops mattering. `tests/shared-runner.ts` is unreachable rather
 * than inspected.
 *
 * Bare specifiers stay allowed: `axe-core` and `@axe-core/playwright` are what the suite is
 * built on. A package could in principle re-export the runner, and if one is ever installed to
 * do that this rule will not catch it — but installing a dependency to smuggle a fixture past a
 * lint is not the accident this exists to prevent, and saying so beats implying otherwise.
 *
 * The `test`-by-name rule stays as well, default bindings included. It is now redundant with
 * the one above for anything inside the suite, and it is kept because it names the mistake in
 * the message a maintainer will actually read.
 */
const HARNESS_SPECIFIER = /^(\.\/|\.\.\/)+support\/harness(\.[cm]?[jt]s)?$/;

/** Playwright's own default `testMatch`: the files it registers tests from. */
const IS_CHECK = /\.(spec|test)\.[cm]?[jt]sx?$/;

/** A binding of `test` from anywhere that is not the harness, or null. */
function bindsTestElsewhere(node) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
        return null;
    }

    const from = node.moduleSpecifier.text;

    if (from === RUNNER || HARNESS_SPECIFIER.test(from)) {
        return null;
    }

    const clause = node.importClause;

    if (clause === undefined || clause.isTypeOnly) {
        return null;
    }

    /* `import test from '…'` — a default import binds a name and has no named bindings, so the
     * loop below never sees it. What matters is the local name, since that is what a check
     * calls. */
    if (clause.name !== undefined && clause.name.text === 'test') {
        return `binds test from '${from}' rather than the harness`;
    }

    const named = clause.namedBindings;

    if (named === undefined || ts.isNamespaceImport(named)) {
        return null;
    }

    for (const element of named.elements) {
        /* Either side: `{ test }`, `{ test as x }` and `{ x as test }` all put the runner
         * within reach of a check that means to use it. */
        const imported = (element.propertyName ?? element.name).text;

        if ((imported === 'test' || element.name.text === 'test') && !element.isTypeOnly) {
            return `binds test from '${from}' rather than the harness`;
        }
    }

    return null;
}

/** A relative specifier that resolves outside the suite, or null. */
function leavesTheSuite(node, file) {
    const specifier = ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined)
        ? node.moduleSpecifier
        : undefined;

    if (specifier === undefined || !ts.isStringLiteral(specifier) || !specifier.text.startsWith('.')) {
        return null;
    }

    const target = resolve(dirname(file), specifier.text);

    return target === SUITE || target.startsWith(`${SUITE}/`)
        ? null
        : `reaches '${specifier.text}', outside the suite this check reads`;
}

const strays = [];

for await (const file of modules(SUITE)) {
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const isCheck = IS_CHECK.test(file);

    const note = (node, how) => {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));

        strays.push(`  ${relative(ROOT, file)}:${line + 1}  ${how}`);
    };

    /* The whole tree, not just the top-level statements: a dynamic import is an expression and
     * can sit anywhere one can — inside a `test()` body, a helper, a conditional. */
    const visit = (node) => {
        const loads = loadsRunner(node);

        if (loads !== null) {
            note(node, loads);
        }

        /* Applies to every module, check or helper: one module reaching out is enough to put
         * the runner back within reach of the check that imports it. */
        const outside = leavesTheSuite(node, file);

        if (outside !== null) {
            note(node, outside);
        }

        /* This one is about the files Playwright registers tests from. A helper may pass `test`
         * around; a check has to have taken it from the harness. */
        if (isCheck) {
            const elsewhere = bindsTestElsewhere(node);

            if (elsewhere !== null) {
                note(node, elsewhere);
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(source);
}

if (strays.length > 0) {
    console.error('check-in-browser: a check takes its test runner from Playwright rather than the harness.');

    for (const stray of strays) {
        console.error(stray);
    }

    console.error("  Import { expect, test } from './support/harness' instead.");
    process.exit(1);
}
