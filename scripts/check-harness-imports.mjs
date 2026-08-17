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
 * WHAT IS FLAGGED, precisely: an import from '@playwright/test' that binds `test` — under any
 * name, `{ test }` or `{ test as t }` — or that binds the whole module as a namespace, which
 * can reach it. Nothing else. `import type { Page }` and `import { type Page }` bind no
 * runner and TypeScript erases them; `import { expect }` names the same assertion the harness
 * re-exports and cannot bypass anything.
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

const strays = [];

for await (const file of checks(SUITE)) {
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);

    for (const statement of source.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
            continue;
        }

        if (statement.moduleSpecifier.text !== RUNNER) {
            continue;
        }

        const binding = reachesRunner(statement);

        if (binding !== null) {
            const { line } = source.getLineAndCharacterOfPosition(statement.getStart(source));

            strays.push(`  ${relative(ROOT, file)}:${line + 1}  binds ${binding}`);
        }
    }
}

if (strays.length > 0) {
    console.error('check-in-browser: a check takes its test runner from Playwright rather than the harness.');

    for (const stray of strays) {
        console.error(stray);
    }

    console.error("  Import { expect, test } from './support/harness' instead.");
    process.exit(1);
}
