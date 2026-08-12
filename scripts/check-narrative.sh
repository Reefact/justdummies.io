#!/usr/bin/env bash
# Assert what the narrative may not lose.
#
# This file exists because of a specific failure. During an editorial pass the same ten
# assertions below were written, run once, pasted into a pull request, and thrown away.
# The decision they encode — that these elements survive any rewording — was real,
# structural, and afterwards guaranteed by nothing at all. The next person shortening a
# sentence would have found out from a reader.
#
# A decision that is only written down is a decision that drifts. What is here is the
# half that fails.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
strings="${root}/apps/site/src/i18n/ui.ts"
dist="${root}/dist"

failures=0
fail() { echo "  ✗ $1" >&2; failures=$((failures + 1)); }
pass() { echo "  ✓ $1"; }

echo "▸ Checking what the narrative may not lose"

# --- the load-bearing prose ------------------------------------------------------
#
# Each of these is a sentence the specification requires, and each names the rule it
# serves. A rewrite that drops one is a rewrite that broke a decision, and the message
# says which.
assert_prose() {
  if grep -Pzoq "$2" "${strings}"; then
    pass "$1"
  else
    fail "$1 — the prose that carried this is gone"
  fi
}

assert_prose "§9.4 the hinge joins a test going green to the same test going red" \
  "act3\.hinge[\s\S]{0,300}?go green stays green[\s\S]{0,200}?forgets one"
assert_prose "§9.9 the tool marked the parameter rather than guess" \
  "act2\.link\.body[\s\S]{0,200}?rather than guess"
assert_prose "§9.9 the file it wrote throws until the link is added" \
  "act2\.link\.body[\s\S]{0,260}?throws on every draw until you add the link"
# The wording moved when the page dropped its act numbering — "the first act" named a
# division that only ever existed in the specification. What §9.2 requires is that the
# link be identified as the chain the reader already wrote, not that it be called an act.
assert_prose "§9.2 that link is the chain the reader already wrote" \
  "act2\.link\.body[\s\S]{0,400}?chain you already wrote, unchanged"
assert_prose "§9.5 the red is not dramatised — nothing is broken" \
  "act3\.forgotten\.body[\s\S]{0,300}?Nothing is broken"
assert_prose "§9.6 a seed per test case, and no wider a promise" \
  "act3\.replay\.body[\s\S]{0,300}?Each test case draws its own seed"
assert_prose "§9.3 the first exit offers the library alone" \
  "act1\.exit\.body[\s\S]{0,200}?the library on its own"
assert_prose "§9.3 the second exit calls the tool optional" \
  "act2\.exit\.body[\s\S]{0,200}?tool is optional"
assert_prose "§9.3 the third exit offers all three" \
  "act3\.exit\.body[\s\S]{0,200}?smallest of the three"
assert_prose "§9.2 the second act opens on the same test" \
  "act2\.concise\.body[\s\S]{0,200}?Same test as before"

# --- the figures fit the measure they are given ----------------------------------
#
# The width a full-measure figure holds, in characters. Not a preference: a figure wider
# than this needs a horizontal scrollbar, which is how the two-column layout was found to
# be wrong in the first place. A snippet that exceeds it is a snippet to re-wrap, or a
# measurement to redo — either way a decision, not an accident.
readonly WIDEST=130

widest="$(node -e '
const { readFileSync } = require("node:fs");
const dir = process.argv[1];
const all = {};
for (const file of ["snippets.json", "tool-output.json", "reproducibility.json"]) {
    Object.assign(all, JSON.parse(readFileSync(`${dir}/${file}`, "utf8")));
}
let worst = 0, name = "";
for (const [id, text] of Object.entries(all)) {
    for (const line of String(text).split("\n")) {
        if (line.length > worst) { worst = line.length; name = id; }
    }
}
process.stdout.write(`${worst} ${name}`);
' "${root}/apps/site/src/generated")"

characters="${widest%% *}"
culprit="${widest#* }"

if [ "${characters}" -le "${WIDEST}" ]; then
  pass "the widest published figure is ${characters} characters (${culprit}), within the ${WIDEST} the measure holds"
else
  fail "${culprit} is ${characters} characters wide, past the ${WIDEST} the measure holds — it will need a horizontal scrollbar"
fi

# --- every figure sits under its own heading -------------------------------------
#
# The defect this replaces was not a scrollbar. A figure beside its prose gets paired up
# by eye, and when several scenes share the screen the eye pairs a heading with the code
# of a scene three below it. Under its own heading there is nothing left to pair — and
# that is a property of the document, checkable here rather than in a browser.
if [ -d "${dist}" ]; then
  orphans="$(node -e '
const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");

function html(directory) {
    const found = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) { found.push(...html(path)); }
        else if (entry.name.endsWith(".html")) { found.push(path); }
    }
    return found;
}

const bad = [];
for (const file of html(process.argv[1])) {
    const page = readFileSync(file, "utf8");
    for (const scene of page.matchAll(/<section[^>]*data-scene="([^"]+)"[\s\S]*?<\/section>/g)) {
        const [whole, name] = scene;
        const heading = whole.search(/<h3[\s>]/);
        const figure = whole.search(/class="figure/);
        if (heading < 0 || figure < 0 || heading > figure) { bad.push(`${name} in ${file}`); }
    }
}
process.stdout.write(bad.join(", "));
' "${dist}")"

  if [ -z "${orphans}" ]; then
    pass "every figure sits under the heading it belongs to"
  else
    fail "a figure comes before its heading, so a reader has to pair them by eye: ${orphans}"
  fi
else
  echo "  · dist/ not built, so the document checks were skipped"
fi

if [ "${failures}" -ne 0 ]; then
  echo "check-narrative: ${failures} check(s) failed." >&2
  exit 1
fi

echo "▸ The narrative still carries what it must."
