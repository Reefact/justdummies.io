#!/usr/bin/env bash
# Prove the third act's claim, then record the half of it that is deterministic.
#
# The act says three things. A test that forgot to constrain a value goes red now and then;
# the failure hands back the seed that produced it; and that seed brings the same failure
# back. All three are checked here on every build, because a page that says them while the
# adapter had quietly stopped doing them would be the worst thing this repository could ship.
#
#   CHECK A — a failing run reports its seed.
#     The unpinned test is run until it goes red, which takes a run or two: two of the three
#     statuses an order can hold cannot be cancelled. Its output must carry the report line.
#     Nothing from this run is recorded — its seed is drawn, so recording it would put a
#     different number in the diff of every build and teach a reviewer to skip the file.
#
#   CHECK B — the same seed reproduces the same failure.
#     The replayed test is run three times and the three outputs must be byte-identical.
#     That one *is* recorded, and it is what the site shows.
#
# What gets recorded is the runner's failure block without its stack trace: the scene is
# about the seed coming back, and four frames of reflection plumbing between the exception
# and the report is noise the reader has to look past. Nothing else is trimmed, and no line
# is rewritten.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="${root}/tools/reproducibility"
destination="${root}/apps/site/src/generated/reproducibility.json"

readonly INTERMITTENT='Ordering.Tests.OrderCancellation.A_pending_order_can_be_cancelled'
readonly REPLAYED='Ordering.Tests.OrderCancellationReplayed.A_pending_order_can_be_cancelled'
readonly REPORT='\[JustDummies\] These arbitrary values were seeded with'

# Bounded, so a build cannot hang on a run of luck. Two chances in three of going red each
# time, which puts twelve consecutive passes at about one in five hundred thousand — rare
# enough to be worth failing on rather than retrying forever, because if it ever happens the
# far likelier explanation is that the test stopped being intermittent.
readonly ATTEMPTS=12

# Built once. `dotnet run` would restore and build on every invocation, and this script runs
# the suite five times.
dotnet build "${project}" --configuration Release --nologo --verbosity quiet > /dev/null
runner="${project}/bin/Release/net10.0/JustDummies.Reproducibility"

# The runner colours its output, and the escape sequences would end up in a JSON file that is
# read by a person in review.
run() {
  "${runner}" -method "$1" 2>&1 | sed 's/\x1b\[[0-9;]*m//g' || true
}

# The failure block: from the test's [FAIL] line to the report line, which is the last line
# of it — with the stack trace dropped and the trailing whitespace the runner pads with
# removed.
#
# The range ends on the report rather than on the first blank line. Ending it on a blank line
# swept up the run summary, whose elapsed time differs by a millisecond between runs, and
# check B duly failed on it — which is the check doing its job on the wrong subject, and a
# reminder that "byte-identical" includes bytes nobody meant to compare.
failure_block() {
  printf '%s\n' "$1" \
    | sed -n "/\[FAIL\]/,/${REPORT}/p" \
    | grep -vE '^[[:space:]]+(Stack Trace:|at |.*\.cs\([0-9]+,[0-9]+\): at )' \
    | sed 's/[[:space:]]*$//' \
    | sed '/^$/d'
}

echo "  check A: an unpinned failure reports its seed"

reported=""
for attempt in $(seq 1 "${ATTEMPTS}"); do
  output="$(run "${INTERMITTENT}")"

  if printf '%s' "${output}" | grep -qE "${REPORT}"; then
    reported="${output}"
    echo "    red on attempt ${attempt}, and it named its seed"
    break
  fi
done

if [ -z "${reported}" ]; then
  echo "generate-reproducibility: the test passed ${ATTEMPTS} times running." >&2
  echo "  Either the draw stopped being arbitrary or the test stopped depending on it." >&2
  echo "  Both make the third act false, so this fails rather than publishing it." >&2
  exit 1
fi

echo "  check B: the recorded seed reproduces the same failure"

first=""
for repeat in 1 2 3; do
  block="$(failure_block "$(run "${REPLAYED}")")"

  if [ -z "${block}" ]; then
    echo "generate-reproducibility: the replayed test did not fail. The seed no longer reproduces the run it was taken from." >&2
    exit 1
  fi

  if ! printf '%s' "${block}" | grep -qE "${REPORT}"; then
    echo "generate-reproducibility: the replayed failure carried no seed report." >&2
    printf '%s\n' "${block}" >&2
    exit 1
  fi

  if [ -z "${first}" ]; then
    first="${block}"
  elif [ "${block}" != "${first}" ]; then
    echo "generate-reproducibility: run ${repeat} of the replayed test differed from run 1." >&2
    echo "  A pinned seed that does not reproduce its own run is the one thing the act promises." >&2
    diff <(printf '%s\n' "${first}") <(printf '%s\n' "${block}") >&2 || true
    exit 1
  fi
done

echo "    three runs, byte-identical"

BLOCK="${first}" DESTINATION="${destination}" node <<'NODE'
const { writeFileSync } = require('node:fs');

// Re-indented to its own left margin, keeping the runner's relative shape. Trimming the
// block instead would pull only its first line flush and leave the rest hanging.
const lines = process.env.BLOCK.split('\n');
const margins = lines.filter((line) => line.trim().length > 0).map((line) => line.length - line.trimStart().length);
const margin = margins.length > 0 ? Math.min(...margins) : 0;
const block = lines.map((line) => line.slice(margin)).join('\n').trim();

writeFileSync(process.env.DESTINATION, `${JSON.stringify({ 'replayed-failure': block }, null, 2)}\n`, 'utf8');
NODE

echo "  apps/site/src/generated/reproducibility.json  (1 run)"
