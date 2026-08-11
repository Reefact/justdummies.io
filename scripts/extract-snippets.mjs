// Extract the marked regions of the validated C# snippets so the site can display
// them without anyone retyping one.
//
// The site shows two things about an expression: the code, and what it produced.
// The value comes from running it (tools/sample-values); the code comes from here.
// Both descend from the same file, which compiled with the analyzers enabled — so a
// snippet cannot reach a page without having been proven publishable.
//
// The alternative is a person copying the expression into the content, and being
// right about it on the day they copy. That is the failure this whole arrangement
// exists to remove, and it is not removed by being careful.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'tools', 'snippet-validation');
const destination = join(root, 'apps', 'site', 'src', 'generated', 'snippets.json');

/** Build output, which contains copies of nothing this cares about. */
const SKIPPED = new Set(['bin', 'obj']);

/**
 * Every C# file of the project, not only the ones under `Snippets/`.
 *
 * The site shows the domain's own guard clauses, and it shows them because they are the
 * reason a constrained dummy is needed at all. Extracting them from the file the snippets
 * compile against is what keeps the invariant on the page and the invariant in the code
 * from being two things — a copy would look identical on the day it was made and drift
 * on the day the domain changed.
 */
function csharpFilesIn(directory) {
    const found = [];

    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isDirectory()) {
            if (!SKIPPED.has(entry.name)) {
                found.push(...csharpFilesIn(join(directory, entry.name)));
            }
        } else if (entry.name.endsWith('.cs')) {
            found.push(join(directory, entry.name));
        }
    }

    return found;
}

const OPEN = /^\s*\/\/\s*<snippet:([a-z0-9-]+)>\s*$/;
const CLOSE = /^\s*\/\/\s*<\/snippet:([a-z0-9-]+)>\s*$/;

/**
 * Re-indents a region to its own left margin. The code sits inside a method in the
 * source file, and that method's indentation is scaffolding the reader never sees.
 */
function dedent(lines) {
    const margins = lines
        .filter((line) => line.trim().length > 0)
        .map((line) => line.length - line.trimStart().length);
    const margin = margins.length > 0 ? Math.min(...margins) : 0;

    return lines.map((line) => line.slice(margin)).join('\n').trim();
}

const snippets = {};

for (const path of csharpFilesIn(source)) {
    const file = relative(root, path);
    const lines = readFileSync(path, 'utf8').split(/\r?\n/);

    let collecting = null;
    let collected = [];

    for (const line of lines) {
        const opened = OPEN.exec(line);
        const closed = CLOSE.exec(line);

        if (opened) {
            if (collecting) {
                throw new Error(`${file}: snippet "${opened[1]}" opens inside "${collecting}".`);
            }
            collecting = opened[1];
            collected = [];
            continue;
        }

        if (closed) {
            if (closed[1] !== collecting) {
                throw new Error(`${file}: snippet "${closed[1]}" closes but "${collecting ?? 'nothing'}" is open.`);
            }
            if (snippets[collecting] !== undefined) {
                throw new Error(`snippet "${collecting}" is defined twice.`);
            }
            snippets[collecting] = dedent(collected);
            collecting = null;
            continue;
        }

        if (collecting) {
            collected.push(line);
        }
    }

    if (collecting) {
        throw new Error(`${file}: snippet "${collecting}" is never closed.`);
    }
}

if (Object.keys(snippets).length === 0) {
    console.error('extract-snippets: no snippet found. The markers are // <snippet:id> … // </snippet:id>.');
    process.exit(1);
}

// Sorted, indented, with a trailing newline: this file is committed and read in
// review, so it is written to be read.
const ordered = Object.fromEntries(Object.entries(snippets).sort(([a], [b]) => a.localeCompare(b)));

writeFileSync(destination, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');

console.log(`  apps/site/src/generated/snippets.json  (${Object.keys(ordered).length} snippets)`);
