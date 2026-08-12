#!/usr/bin/env bash
# Record what the `dum` tool says when it scaffolds the site's demonstration type.
#
# The second act shows a terminal, and what is in that terminal is the tool's own output —
# captured by running it, never transcribed. It is the same rule as the rest of
# apps/site/src/generated/: an expression the site displays was compiled, a value it
# displays was drawn, and a command's output it displays was produced by that command.
#
# This one earns the rule twice over, because the recap is the point of the scene. It is
# where the tool says which parameters it inferred and which guard it could not read, and a
# transcribed version of that would be a claim about the tool rather than the tool speaking.
#
# The command recorded is the command the site shows — `dum generate Order`, which writes a
# file — and not `--dry-run`, whose recap ends on a line saying nothing was written. The
# write is aimed at a temporary directory so the committed, hand-completed AnyOrder.cs is
# never touched: the act is about editing that file, and a build that silently reverted the
# edit would delete the act.
#
# --dry-run also moves the recap to stderr, because stdout then carries the file. A real run
# prints it on stdout. Both were checked rather than read off the specification.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="${root}/tools/snippet-validation"
destination="${root}/apps/site/src/generated/tool-output.json"

# The version comes from .config/dotnet-tools.json, so the output on the page and the tool a
# maintainer runs cannot be different tools.
dotnet tool restore > /dev/null

scratch="$(mktemp -d)"
trap 'rm -rf "${scratch}"' EXIT

recap="$(cd "${project}" && dotnet dum generate Order --output "${scratch}" 2> /dev/null)"

if [ ! -f "${scratch}/AnyOrder.cs" ]; then
  echo "generate-tool-output: the tool reported no failure and wrote no file." >&2
  exit 1
fi

if [ -z "${recap}" ]; then
  echo "generate-tool-output: the tool printed no recap. The scene it feeds would be empty." >&2
  exit 1
fi

# The line naming the guard it could not read is the whole reason this scene exists. If a
# future version of the tool learns to read a prefix rule, this check fails and the act needs
# rewriting rather than quietly publishing a terminal that no longer says what the prose
# beside it claims.
if ! printf '%s' "${recap}" | grep -q 'unread guards'; then
  echo "generate-tool-output: the recap no longer reports 'unread guards' for the reference." >&2
  echo "  The second act is built on the tool saying where it stopped. Rewrite the act." >&2
  printf '%s\n' "${recap}" >&2
  exit 1
fi

# The scene beside that terminal shows the recipe the tool wrote, and it shows it from a
# compiled file rather than from the temporary directory above — everything this site
# publishes is compiled with the analyzers on, and lifting a figure out of a scratch
# directory would be the one exception.
#
# Which leaves the obvious hole: a copy is a transcription, and transcriptions go stale
# silently. So the copy is compared to what the tool has just written, on every build. A tool
# that changes its recipe fails here rather than leaving the page quoting a version of itself
# that no longer exists.
SCAFFOLDED="${scratch}/AnyOrder.cs" PUBLISHED="${root}/apps/site/src/generated/snippets.json" node <<'NODE'
const { readFileSync } = require('node:fs');

const file = readFileSync(process.env.SCAFFOLDED, 'utf8').split('\n');

// The public constructor: from its signature to the empty body that closes it. Found by what
// it is rather than by line number, so an added XML comment above it changes nothing.
const opens = file.findIndex((line) => line.trim() === 'public AnyOrder()');
const closes = file.findIndex((line, at) => at > opens && line.includes('{ }'));

if (opens < 0 || closes < 0) {
    console.error('generate-tool-output: no `public AnyOrder()` recipe in what the tool wrote.');
    console.error('  The second act shows that recipe. Read the file the tool produced and re-cut this.');
    process.exit(1);
}

const margin = file[opens].length - file[opens].trimStart().length;
const written = file.slice(opens, closes + 1).map((line) => line.slice(margin)).join('\n');
const published = JSON.parse(readFileSync(process.env.PUBLISHED, 'utf8'))['scaffolded-recipe'];

if (published !== written) {
    console.error('generate-tool-output: the published `scaffolded-recipe` is not what the tool writes.');
    console.error('  Match tools/snippet-validation/Domain/AnyOrderScaffolded.cs to it, then re-run.');
    console.error('\n  the tool wrote:\n');
    console.error(written.replace(/^/gm, '    '));
    console.error('\n  the site publishes:\n');
    console.error(String(published).replace(/^/gm, '    '));
    process.exit(1);
}
NODE

# Both through the environment rather than as arguments: the recap contains quotes,
# parentheses and non-ASCII, and bash's own quoting form is not JavaScript's — while a script
# read from stdin has `-` sitting in argv where its first argument would otherwise be, which
# is how an earlier version of this line wrote the file to a path called `-`.
RECAP="${recap}" DESTINATION="${destination}" node <<'NODE'
const { writeFileSync } = require('node:fs');

// The tool pads its columns to align them, which leaves trailing spaces no reader will ever
// see and every editor will strip on the next save. Removed here so the committed file does
// not change the first time somebody opens it.
const recap = process.env.RECAP.split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim();

// Indented, with a trailing newline: committed and read in review, like its neighbours.
writeFileSync(process.env.DESTINATION, `${JSON.stringify({ 'generate-order': recap }, null, 2)}\n`, 'utf8');
NODE

echo "  apps/site/src/generated/tool-output.json  (1 command)"
