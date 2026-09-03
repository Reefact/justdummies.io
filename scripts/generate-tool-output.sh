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

# The scene beside that terminal shows the whole file the tool wrote, and it shows it from
# the run above rather than from a copy — a transcription of a hundred lines is a
# transcription that goes stale in silence.
#
# What the compiled copy under tools/snippet-validation is for, then, is the other half:
# everything this site publishes is compiled with the analyzers on, and this file is no
# exception. The two are compared here, on every build. They differ by exactly one line —
# the namespace — because the copy cannot declare the same partial class twice.
SCAFFOLDED="${scratch}/AnyOrder.cs" COMPILED="${root}/tools/snippet-validation/Domain.UnitTests/AnyOrderScaffolded.cs" \
DESTINATION="${root}/apps/site/src/generated/tool-written.json" node <<'NODE'
const { readFileSync, writeFileSync } = require('node:fs');

const written = readFileSync(process.env.SCAFFOLDED, 'utf8').replace(/\s+$/, '');
const compiled = readFileSync(process.env.COMPILED, 'utf8').replace(/\s+$/, '');

// The one line allowed to differ, and the only one. Comparing with it blanked out on both
// sides means a namespace that drifts somewhere else still fails.
const withoutNamespace = (file) => file.split('\n').map((line) => (line.startsWith('namespace ') ? 'namespace …' : line));

// The second allowed difference, and the reason it exists: for a parameter it could not
// vouch for, the tool plants an identifier that does not resolve, so the file it wrote
// cannot be built past without a look — and its own comment says to delete that line once
// the generator has been verified. Deleting it is what a developer does, and what the
// compiled copy here must do to be compiled at all. Dropped from the tool's side before the
// comparison, so every OTHER line still has to match exactly.
const withoutPlantedLine = (lines) => lines.filter((line) => !line.trimStart().startsWith('_ = TODO_'));

const tool = withoutPlantedLine(withoutNamespace(written));
const ours = withoutPlantedLine(withoutNamespace(compiled));
const at = tool.findIndex((line, index) => line !== ours[index]);

if (at >= 0 || tool.length !== ours.length) {
    const line = at >= 0 ? at + 1 : Math.min(tool.length, ours.length) + 1;

    console.error('generate-tool-output: the compiled copy is no longer what the tool writes.');
    console.error('  Copy tools/snippet-validation/Domain.UnitTests/AnyOrderScaffolded.cs from the tool\'s output again,');
    console.error('  changing nothing but the namespace, then re-run.');
    console.error(`\n  line ${line}:`);
    console.error(`    the tool wrote:     ${tool[at] ?? '(nothing — its file is shorter)'}`);
    console.error(`    the site compiles:  ${ours[at] ?? '(nothing — the copy is shorter)'}`);
    process.exit(1);
}

// The tool's own file is what gets published, namespace included: the page shows what `dum`
// writes, not what this repository had to do to compile it.
writeFileSync(process.env.DESTINATION, `${JSON.stringify({ 'any-order': written }, null, 2)}\n`, 'utf8');
console.log(`  apps/site/src/generated/tool-written.json  (${written.split('\n').length} lines)`);
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
