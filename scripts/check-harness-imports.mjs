#!/usr/bin/env node
/**
 * Every browser check takes its `test` from the harness.
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

/** Playwright's own default `testMatch`, so this reads exactly the files it runs. */
const IS_CHECK = /\.(spec|test)\.[cm]?[jt]sx?$/;

/** Recursive, because `testDir` is: a check in a subdirectory is still a check. */
async function* checks(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
            yield* checks(path);
        } else if (IS_CHECK.test(entry.name)) {
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
     * would then import it from a neighbour and pass this guard on both sides. */
    if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
        return ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === RUNNER
            ? 're-exports the module'
            : null;
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

const strays = [];

for await (const file of checks(SUITE)) {
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);

    /* The whole tree, not just the top-level statements: a dynamic import is an expression and
     * can sit anywhere one can — inside a `test()` body, a helper, a conditional. */
    const visit = (node) => {
        const how = loadsRunner(node);

        if (how !== null) {
            const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));

            strays.push(`  ${relative(ROOT, file)}:${line + 1}  ${how}`);
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
