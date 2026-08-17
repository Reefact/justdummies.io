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

# §9.4 asks for a hinge and ADR-0007 says what it has to carry: the reader's own question,
# put to them before any figure on this page has failed. A hinge that announced the red
# instead would state the objection two scenes ahead of its answer, which is the ordering
# that decision reverses.
assert_prose "§9.4 / ADR-0007 the hinge asks the reader's own question" \
  "act3\.hinge[\s\S]{0,300}?change on every run[\s\S]{0,200}?made a test fail"
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
# The first exit ships two packages and has to say why the second one is there — a reader
# offered an adapter they have not been shown is a reader wondering what they are agreeing
# to. The tool is still not offered here (asserted on the built document below).
assert_prose "§9.3 the first exit offers the library, and says what the adapter is for" \
  "act1\.exit\.body[\s\S]{0,200}?the library on its own[\s\S]{0,200}?Take the adapter with it"
assert_prose "§9.3 the second exit calls the tool optional" \
  "act2\.exit\.body[\s\S]{0,200}?tool is optional"
assert_prose "§9.3 the third exit offers all three" \
  "act3\.exit\.body[\s\S]{0,200}?smallest of the three"
assert_prose "§9.2 the second act opens on the same test" \
  "act2\.concise\.body[\s\S]{0,200}?Same test as before"
# A scene is titled by what the reader gets from it, and this is the title where that
# matters most: named after the attribute, the third act opened on the least interesting
# thing about itself. Editorial, like every anchor above it — the specification is where
# rules of this kind live, and this line is the half of one that fails.
assert_prose "the third act opens on what the reader gets, not on the mechanism" \
  "act3\.attribute\.title[\s\S]{0,120}?before it reaches production"

# --- the positioning page's notes stand on their own (§11.10) --------------------
#
# Three rules that a rewording breaks silently, and that were all broken at once before
# this existed. A note said "the manual literal below" while the duel had that column
# hidden; two notes pointed at "Act I", which is a division of the landing page a reader
# arriving here from a search has never seen; and the intro explained to the reader why our
# own comparison was well built, which is a sentence written for us.
#
# Comments are stripped before the scan, deliberately: the note above this one uses the
# very words it forbids, and a check that cannot tell prose from the reasoning about prose
# would either fail on itself or be weakened until it failed on nothing.
# shellcheck disable=SC2016  # literal JS source in single quotes, not shell interpolation
selfcontained="$(node -e '
const { readFileSync } = require("node:fs");

const lines = readFileSync(process.argv[1], "utf8").split(/\r?\n/);
const entries = [];
let current = null;

for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("/**") || trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) {
        continue;
    }
    // A key at the indentation the object uses, quoted either way, then whatever follows
    // it on that line; continuation lines belong to the key above them.
    const keyed = /^ {4}.([a-zA-Z0-9.]+).:\s*(.*)$/.exec(line);

    if (keyed) {
        current = { key: keyed[1], text: keyed[2] };
        entries.push(current);
    } else if (current !== null) {
        current.text += " " + trimmed;
    }
}

const wrong = [];
const positional = /\b(above|below|ci-dessus|ci-dessous)\b/i;
const acts = /\b(act|acte)\s+(one|two|three|i{1,3})\b/i;
const meta = /\b(the comparison (below|above)|ce comparatif ci|le comparatif ci-dessous|not an oversight|pas comme un oubli)\b/i;

for (const { key, text } of entries) {
    if (!key.startsWith("why.")) { continue; }
    if (key.startsWith("why.note.") && positional.test(text)) {
        wrong.push(`${key} points at a position another view moves or hides`);
    }
    if (acts.test(text)) {
        wrong.push(`${key} cites the landing page acts, which this page never shows`);
    }
    if (meta.test(text)) {
        wrong.push(`${key} explains our own comparison to the reader instead of informing them`);
    }
}

// The scan is only worth anything if it found the strings at all.
if (entries.filter((entry) => entry.key.startsWith("why.note.")).length < 60) {
    wrong.push("the scan found fewer why.note.* entries than the two locales carry — it is reading the file wrong");
}

process.stdout.write(wrong.join("; "));
' "${strings}")"

if [ -z "${selfcontained}" ]; then
  pass "§11.10 every note on the positioning page stands on its own, in both locales"
else
  fail "${selfcontained}"
fi

# --- the first act shows nothing the reader cannot use yet (ADR-0006) ------------
#
# `.As(...)` was on this page once, in a first-act scene that worked. It came off because a
# reader has no use for it there, and it now arrives inside the file the tool writes — where
# it removes work they have just done by hand. Nothing about that is visible in prose, and
# putting it back is the change a well-meant editorial pass makes.
# shellcheck disable=SC2016  # literal JS source in single quotes, not shell interpolation
deferred="$(node -e '
const { readFileSync } = require("node:fs");
const dir = process.argv[1];
const snippets = JSON.parse(readFileSync(`${dir}/snippets.json`, "utf8"));
const written = JSON.parse(readFileSync(`${dir}/tool-written.json`, "utf8"));
const wrong = [];
const act = ["literal-test", "factory-test", "factory-handwritten", "factory-careless",
             "order-reference-invariants", "factory-constrained"];

for (const id of act) {
    if (String(snippets[id] ?? "").includes(".As(")) {
        wrong.push(`${id} uses .As(...) before the reader has any use for it`);
    }
}
// Not belt-and-braces: if the file the tool writes ever stops carrying it, the loop above
// passes on an empty premise and this check silently stops meaning anything.
if (!String(written["any-order"] ?? "").includes(".As(")) {
    wrong.push("the file the tool writes no longer uses .As(...), so the deferral checks nothing");
}
process.stdout.write(wrong.join("; "));
' "${root}/apps/site/src/generated")"

if [ -z "${deferred}" ]; then
  pass "ADR-0006 .As(...) waits for the file the tool writes, and appears in no first-act figure"
else
  fail "${deferred}"
fi

# --- the attribute appears the moment the library draws --------------------------
#
# A test on this page that draws its values carries [Reproducible], and one that does not
# draw them does not carry it. Both halves matter: the first is the answer to the question
# the third act asks, put in front of the reader before they ask it, and the second is what
# keeps it from being decoration — an attribute on the hand-written literals of the first
# act would say the library was already at work when it was not.
# shellcheck disable=SC2016  # literal JS source in single quotes, not shell interpolation
drawn="$(node -e '
const { readFileSync } = require("node:fs");
const snippets = JSON.parse(readFileSync(`${process.argv[1]}/snippets.json`, "utf8"));
// Matches it in every spelling a snippet may reasonably use — `[Fact, Reproducible]`,
// `[Reproducible]` on its own line, `[Reproducible(Seed = ...)]` — and in none of the
// prose around them, because the word only ever appears here as the attribute.
const carries = (id) => /\bReproducible\b/.test(String(snippets[id] ?? ""));
const wrong = [];
for (const id of ["wanted-test", "concise-test", "intermittent-test", "replayed-test"]) {
    if (!carries(id)) { wrong.push(`${id} draws its values and does not carry [Reproducible]`); }
}
for (const id of ["literal-test", "factory-test"]) {
    if (carries(id)) { wrong.push(`${id} carries [Reproducible] before the library draws anything`); }
}
process.stdout.write(wrong.join("; "));
' "${root}/apps/site/src/generated")"

if [ -z "${drawn}" ]; then
  pass "every published test that draws its values carries [Reproducible], and only those"
else
  fail "${drawn}"
fi

# --- the figures fit the measure they are given ----------------------------------
#
# The width a full-measure figure holds, in characters. Not a preference: a figure wider
# than this needs a horizontal scrollbar, which is how the two-column layout was found to
# be wrong in the first place. A snippet that exceeds it is a snippet to re-wrap, or a
# measurement to redo — either way a decision, not an accident.
readonly WIDEST=130

# shellcheck disable=SC2016  # literal JS source in single quotes, not shell interpolation
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
  # shellcheck disable=SC2016  # literal JS source in single quotes, not shell interpolation
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

  # --- the third act answers before it fails anything (ADR-0007) ------------------
  #
  # Prose can be reworded; an ordering cannot be checked by reading it. This asserts the
  # decision itself on the built page: in the third act the attribute comes first, and the
  # scene where a test goes red comes after it. Moving the red back to the front is exactly
  # the change this record was written to stop, and it would pass every prose check above.
  # shellcheck disable=SC2016  # literal JS source in single quotes, not shell interpolation
  ordering="$(node -e '
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
    const act = page.indexOf(`id="act-three"`);
    if (act < 0) { continue; }

    const scenes = [...page.slice(act).matchAll(/data-scene="([^"]+)"/g)].map((m) => m[1]);
    const attribute = scenes.indexOf("the-attribute");
    const red = scenes.indexOf("the-forgotten-line");

    if (attribute !== 0) { bad.push(`${file}: the third act opens on ${scenes[0]}, not the attribute`); }
    else if (red >= 0 && red < attribute) { bad.push(`${file}: a test goes red before the attribute explains it`); }
}
process.stdout.write(bad.join(", "));
' "${dist}")"

  if [ -z "${ordering}" ]; then
    pass "ADR-0007 the third act names the attribute before anything in it fails"
  else
    fail "${ordering}"
  fi

  # --- an exit offers what the reader has been shown, and no more (§9.3) ----------
  #
  # Read off the measurement attributes rather than off position, so the check survives the
  # block moving. The first exit ships the adapter — the reader has been drawing values for
  # a whole act by then — and does not ship the tool, which has not appeared at all.
  # shellcheck disable=SC2016  # literal JS source in single quotes, not shell interpolation
  offer="$(node -e '
const { readFileSync } = require("node:fs");
const page = readFileSync(process.argv[1], "utf8");
const bad = [];

const at = (placement) => [...page.matchAll(new RegExp(`<[^>]*data-placement="${placement}"[^>]*>`, "g"))].map((m) => m[0]);
const first = at("act-one-exit");

if (!first.some((tag) => tag.includes("JustDummies.Xunit"))) {
    bad.push("the first exit does not offer the adapter");
}
if (first.some((tag) => tag.includes("tool install") || tag.includes("JustDummies.Cli"))) {
    bad.push("the first exit offers the tool, which no scene above it has shown");
}
if (!at("act-two-exit").some((tag) => tag.includes("tool install"))) {
    bad.push("the second exit does not offer the tool it has just demonstrated");
}
process.stdout.write(bad.join("; "));
' "${dist}/index.html")"

  if [ -z "${offer}" ]; then
    pass "§9.3 each exit offers what its act has shown — the adapter from the first, the tool from the second"
  else
    fail "${offer}"
  fi
else
  echo "  · dist/ not built, so the document checks were skipped"
fi

if [ "${failures}" -ne 0 ]; then
  echo "check-narrative: ${failures} check(s) failed." >&2
  exit 1
fi

echo "▸ The narrative still carries what it must."
