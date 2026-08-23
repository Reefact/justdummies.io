#!/usr/bin/env bash
# Assert the shape of the combined artefact before anything is uploaded.
#
# These are the checks whose failure is invisible until a visitor hits it: a
# playground whose base href no longer matches where it was copied, a framework
# directory that was never assembled, a site build that silently produced
# nothing. Each one has a cheap assertion and an expensive symptom.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist="${root}/dist"

failures=0
fail() {
  echo "  ✗ $1" >&2
  failures=$((failures + 1))
}
pass() {
  echo "  ✓ $1"
}

echo "▸ Verifying ${dist}"

# shellcheck disable=SC2015  # pass/fail only echo, so the else-branch reading never runs on a true left side
[ -f "${dist}/index.html" ] && pass "the site has an entry point" || fail "dist/index.html is missing"
# shellcheck disable=SC2015  # pass/fail only echo, so the else-branch reading never runs on a true left side
[ -f "${dist}/playground/index.html" ] && pass "the playground has an entry point" || fail "dist/playground/index.html is missing"
# shellcheck disable=SC2015  # pass/fail only echo, so the else-branch reading never runs on a true left side
[ -d "${dist}/playground/_framework" ] && pass "the .NET runtime is present" || fail "dist/playground/_framework is missing"

# The catalogue bridge (§10.4) has to actually ship, not just compile locally: catches
# "the ProjectReference was added but the assembly never made it into the published
# payload" before a visitor does.
if compgen -G "${dist}/playground/_framework/JustDummies.Playground.Catalogue*.wasm*" > /dev/null; then
  pass "the playground's method catalogue is in the published payload"
else
  fail "no JustDummies.Playground.Catalogue assembly under _framework — the playground's catalogue bridge did not ship"
fi

# The one mismatch that produces a blank page rather than an error: the document
# loads, and every relative asset URL resolves one directory too high.
if [ -f "${dist}/playground/index.html" ]; then
  if grep -q '<base href="/playground/" />' "${dist}/playground/index.html"; then
    pass "the playground's base href matches where it was copied"
  else
    fail "the playground's base href is not /playground/ — its assets will 404"
  fi
fi

# Brotli is what makes a WebAssembly payload tolerable over the wire (§19.3).
if compgen -G "${dist}/playground/_framework/*.br" > /dev/null; then
  pass "pre-compressed Brotli assets were produced"
else
  fail "no Brotli assets under _framework — the payload will be served uncompressed"
fi

# shellcheck disable=SC2015  # pass/fail only echo, so the else-branch reading never runs on a true left side
[ -f "${dist}/_redirects" ] && pass "the redirect rules were copied" || fail "dist/_redirects is missing"
# shellcheck disable=SC2015  # pass/fail only echo, so the else-branch reading never runs on a true left side
[ -f "${dist}/_headers" ] && pass "the response headers were generated" || fail "dist/_headers is missing"
# shellcheck disable=SC2015  # pass/fail only echo, so the else-branch reading never runs on a true left side
[ -f "${dist}/.assetsignore" ] && pass "the upload exclusions were copied" || fail "dist/.assetsignore is missing"

# The stamp that lets anyone ask the deployment what it is. Three ways it can be
# useless, and none of them is visible by looking at the file: absent, unparseable,
# or naming a commit other than the one that was built. The third is the dangerous
# one — a stamp that lies is worse than no stamp, because it will be believed.
if [ ! -f "${dist}/version.json" ]; then
  fail "dist/version.json is missing — the deployment cannot say which release it is"
elif ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' \
       "${dist}/version.json" 2> /dev/null; then
  fail "dist/version.json is not valid JSON — whatever reads it will fail on the live site"
else
  pass "the artefact is stamped with a parseable version"

  head_commit="$(git -C "${root}" rev-parse HEAD 2> /dev/null || true)"
  stamped="$(node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).commit))' \
             "${dist}/version.json" 2> /dev/null || true)"

  # Skipped rather than failed without git: an exported tarball has no HEAD to compare
  # against, and the stamp says so itself by carrying a null commit.
  if [ -z "${head_commit}" ]; then
    pass "no git metadata to check the stamp against, and the stamp does not claim one"
  elif [ "${stamped}" = "${head_commit}" ]; then
    pass "the stamped commit is the one that was built"
  else
    fail "version.json names ${stamped:-null}, but HEAD is ${head_commit} — the stamp would misreport what is live"
  fi

  # The failure this cannot afford to miss: the run publishes a release and the stamp
  # does not name it. Reading the tag out of the checkout is not guaranteed to work, so
  # the outcome is asserted rather than the mechanism trusted — a null release on a
  # release build is a deployment that cannot say which release it is, on the one
  # deployment where that is the whole question.
  case "${GITHUB_REF_TYPE:-}:${GITHUB_REF_NAME:-}" in
    tag:release/*)
      stamped_release="$(node -e 'process.stdout.write(String(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).release))' \
                         "${dist}/version.json" 2> /dev/null || true)"
      if [ "${stamped_release}" = "${GITHUB_REF_NAME}" ]; then
        pass "the stamp names the release this run publishes (${GITHUB_REF_NAME})"
      else
        fail "this run publishes ${GITHUB_REF_NAME} but the stamp says ${stamped_release:-null} — the live site would not name its own release"
      fi
      ;;
  esac
fi

# The host's own migration guide invites this mistake, so it is checked rather
# than trusted. On Workers, _headers and _redirects are never served as assets:
# they are parsed, and their rules are applied to asset responses. Excluding them
# from the upload does not make them private — they already are — it makes them
# absent, and the site loses its policy, its cache rules and the playground
# rewrite while every page keeps answering 200.
if [ -f "${dist}/.assetsignore" ]; then
  # `grep -c` rather than `grep -q`: the quiet form exits at the first match and
  # closes the pipe under it, which makes the upstream grep fail to write and, with
  # `set -o pipefail`, fails the build for the wrong reason. Counting reads to the
  # end and cannot.
  excluded="$(grep -vE '^[[:space:]]*#' "${dist}/.assetsignore" | grep -cE '(^|/)_(headers|redirects)[[:space:]]*$' || true)"
  if [ "${excluded}" -gt 0 ]; then
    fail ".assetsignore excludes _headers or _redirects — those are parsed, not served, and excluding them deletes the policy"
  else
    pass "_headers and _redirects are not excluded from the upload"
  fi
fi

# The playground's client-side routes and the rewrites that make them survive a cold
# request have to agree, and nothing but this check makes them.
#
# Three ways they come apart. None of them fails the build on its own, none shows up
# in a click-through, and all three reach a visitor who pastes a link:
#
#   A splat over /playground/* is discarded by the host as an infinite loop, because
#   its target canonicalises back into its own pattern. Zero rules are parsed and the
#   deployment succeeds regardless.
#
#   A rewrite whose target is index.html answers 307 to the directory instead of 200
#   with the shell, so the URL the rewrite existed to preserve is thrown away before
#   Blazor ever sees it.
#
#   A route declared in Blazor with no rewrite here works in every click-through,
#   because the router is already running by then, and 404s only when entered cold.
if [ -f "${dist}/_redirects" ]; then
  if grep -qE '^/playground/\*([[:space:]]|$)' "${dist}/_redirects"; then
    fail "_redirects splats over /playground/* — the host discards it as an infinite loop, so no playground route gets a rewrite at all"
  else
    pass "no splat over /playground/ is silently discarded"
  fi

  if grep -qE '^/playground[^[:space:]]*[[:space:]]+[^[:space:]]*index\.html' "${dist}/_redirects"; then
    fail "a playground rewrite targets index.html — the host canonicalises that to the directory and answers 307, destroying the URL the rewrite exists to preserve"
  else
    pass "playground rewrites target the directory, not index.html"
  fi

  # `/` is excluded: it is dist/playground/index.html, served as the directory index.
  routes="$(grep -rhoE '@page[[:space:]]+"[^"]*"' "${root}/apps/playground" --include='*.razor' \
    | sed -E 's/.*"(.*)"/\1/' | grep -vxF '/' || true)"

  # No route at all means the extraction broke, not that the application has none:
  # Home.razor has carried `@page "/"` since the shell was added. A check that
  # silently passes when it stops looking is worse than no check.
  if [ -z "$(grep -rhoE '@page[[:space:]]+"[^"]*"' "${root}/apps/playground" --include='*.razor' || true)" ]; then
    fail "no @page directive found under apps/playground — this check has stopped looking rather than found nothing"
  else
    missing=0
    for route in ${routes}; do
      grep -qE "^/playground${route}[[:space:]]" "${dist}/_redirects" \
        || { fail "the playground declares @page \"${route}\" but _redirects has no rewrite for /playground${route} — a cold link to it will 404"; missing=1; }
    done
    [ "${missing}" -eq 0 ] && pass "every playground route has a rewrite that survives a cold request"
  fi
fi

# An element that leads nowhere must say so, and stay reachable while saying it.
# The `disabled` attribute takes a control out of the tab order, which makes its
# explanation unreachable by keyboard and invisible to a screen reader — so a
# pending element carries `aria-disabled` and a tabindex instead. Both halves are
# checked, because getting one right and the other wrong looks correct on screen.
pending_html="$(grep -rl 'aria-disabled="true"' "${dist}" --include='*.html' || true)"
if [ -n "${pending_html}" ]; then
  bad_focus=0
  for page in ${pending_html}; do
    # Every element carrying aria-disabled must also carry a tabindex.
    total="$(grep -o 'aria-disabled="true"' "${page}" | wc -l)"
    focusable="$(grep -oE '<[^>]*aria-disabled="true"[^>]*>' "${page}" | grep -c 'tabindex' || true)"
    [ "${total}" -eq "${focusable}" ] || { fail "a pending element in ${page#"${dist}"/} is not focusable — its state cannot be reached by keyboard"; bad_focus=1; }
    # And none may also carry the real disabled attribute.
    if grep -qE '<[^>]*aria-disabled="true"[^>]*[[:space:]]disabled[[:space:]=>]' "${page}"; then
      fail "a pending element in ${page#"${dist}"/} carries the disabled attribute, which removes it from the tab order"
      bad_focus=1
    fi
  done
  [ "${bad_focus}" -eq 0 ] && pass "pending elements stay focusable and say their state"
fi

# A control that needs scripting is hidden until its script proves it can act, and what
# makes that real is the `[hidden] { display: none !important }` in base.css: a
# component's own layout rule beats the user agent's, so without it the attribute is set,
# the control is shown anyway, and a reader with no scripting gets exactly the dead
# control the pattern exists to prevent. That is how it failed once (ADR-0004).
#
# Three assertions, because each one alone passes while the feature is broken: the rule
# survives the build, the shipped markup really does hide the widget, and what is left
# once it is hidden is the whole offer rather than an empty box.
css="$(find "${dist}/_astro" -name '*.css' 2> /dev/null || true)"
if [ -n "${css}" ]; then
  # shellcheck disable=SC2086 # deliberately split: there is one stylesheet per build, but never assume it.
  if grep -qE '\[hidden\][^{]*\{[^}]*display: *none *!important' ${css}; then
    pass "hidden means hidden — no component's display can overrule it"
  else
    fail "base.css's [hidden] { display: none !important } did not survive the build, so a control hidden until its script runs will be shown before it can act"
  fi
fi

home="${dist}/index.html"
if [ -f "${home}" ]; then
  if grep -qE '<div[^>]*role="tablist"[^>]*[[:space:]]hidden' "${home}"; then
    pass "the install tablist ships hidden, so no tab appears before it can switch"
  else
    fail "the install tablist does not ship hidden — without scripting it is a row of buttons that do nothing"
  fi

  # Hiding the tabs is only honest because the stacked form is underneath them.
  stacked="$(grep -oE 'data-panel="[a-z]+"' "${home}" | wc -l)"
  if [ "${stacked}" -ge 2 ]; then
    pass "and every command those tabs would switch between is in the page regardless"
  else
    fail "the install block ships ${stacked} panel(s), so with the tablist hidden a reader without scripting reaches only that many commands"
  fi
fi

# The reveal hides what has not been scrolled to yet, and the one way that fails
# silently is by hiding it for a reader who will never be un-hidden. Two halves,
# because either one alone lets the blank page through (ADR-0005).
if [ -n "${css}" ]; then
  # Every rule that hides a reveal group must be gated behind the arming attribute a
  # script sets. Move the `opacity: 0` onto the bare selector — the obvious
  # simplification, correct-looking in any browser that runs the script — and a reader
  # without scripting gets an empty document instead of an unanimated one.
  ungated=0
  for sheet in ${css}; do
    # Selectors mentioning [data-reveal] but not the arming attribute, whose block sets
    # opacity to 0. tr splits the minified sheet into one rule per line first.
    if tr '}' '\n' < "${sheet}" | grep -E '\[data-reveal[]=]' | grep -v 'data-reveal-armed' | grep -q 'opacity: *0[^.]'; then
      ungated=1
    fi
  done
  if [ "${ungated}" -eq 0 ]; then
    pass "nothing is hidden for a reader whose scripting never arrives"
  else
    fail "a rule hides a [data-reveal] group without waiting for [data-reveal-armed] — without scripting that content never appears"
  fi
fi

# And the arming attribute must be absent from the shipped markup. Written into the
# HTML it would hide everything before any script could reveal it, which is the same
# blank page reached from the other side.
armed_in_markup="$(grep -rl 'data-reveal-armed' "${dist}" --include='*.html' | xargs -r grep -lE '<html[^>]*data-reveal-armed' || true)"
if [ -z "${armed_in_markup}" ]; then
  pass "and the reveal is armed at run time, never in the markup"
else
  fail "data-reveal-armed is in the shipped markup of ${armed_in_markup} — the page would hide itself before any script could show it"
fi

# not_found_handling is set to "404-page" in wrangler.jsonc, and it serves the
# nearest 404.html. Without the files, the setting points at nothing and a
# mistyped URL gets the host's default page rather than the site's.
# shellcheck disable=SC2015  # pass/fail only echo, so the else-branch reading never runs on a true left side
[ -f "${dist}/404.html" ] && pass "the English 404 page exists" || fail "dist/404.html is missing, and wrangler.jsonc asks for it"
# shellcheck disable=SC2015  # pass/fail only echo, so the else-branch reading never runs on a true left side
[ -f "${dist}/fr/404.html" ] && pass "the French 404 page exists" || fail "dist/fr/404.html is missing, so a mistyped French URL answers in English"

# The tallest figure on the page folds, and the button that unfolds it is attached by the
# script. Two things have to be true of the shipped markup, and neither is visible in a
# screenshot: the file is in the page whole, and the button is `hidden` until something can
# act on it (ADR-0004). A reader whose scripting never arrives reads a hundred and one lines
# rather than a clipped block no button will ever reopen.
if grep -q 'data-fold' "${dist}/index.html"; then
  if grep -qE '<button[^>]*class="fold"[^>]*hidden' "${dist}/index.html"; then
    pass "the fold's button ships hidden, so no dead control appears without scripting"
  else
    fail "the fold's button is not hidden in the markup — without scripting it does nothing"
  fi

  if grep -q 'max-height' "${dist}/index.html"; then
    fail "the shipped markup clips the folded figure — a reader without scripting could never open it"
  else
    pass "and the figure ships unfolded, clipped only once the button can reopen it"
  fi
else
  fail "no folded figure in the shipped page — the file the tool writes is the one that needs it"
fi

# The positioning page teaches its criteria, and does it in the markup (§11.4).
#
# Three assertions per locale, and each one alone passes while the page is broken. The
# first is that all ten criteria reached the document — a criterion silently dropped by a
# refactor is a comparison the reader cannot audit. The second is ADR-0004 on the duel
# control. The third is that the always-open matrix carries the whole comparison, gated
# behind no `<details>`, so a reader who scrolls this far and clicks nothing still sees
# every verdict — the family accordion below it stays a second, deeper copy (one family
# open by default, so it still says something on the narrow widths where the matrix itself
# is CSS-hidden), not the only place a rating can be read.
for locale in "" "/fr"; do
  why="${dist}${locale}/why-justdummies/index.html"

  if [ ! -f "${why}" ]; then
    fail "${why#"${dist}"/} is missing — the positioning page does not exist in this locale"
    continue
  fi

  taught="$(grep -oE 'id="criterion-[a-zA-Z]+"' "${why}" | wc -l)"
  if [ "${taught}" -eq 10 ]; then
    pass "the positioning page carries its ten criteria${locale:+ (${locale#/})}"
  else
    fail "${why#"${dist}"/} carries ${taught} criterion block(s), not the ten the comparison rates"
  fi

  if grep -qE '<div[^>]*data-duel-controls[^>]*[[:space:]]hidden' "${why}"; then
    pass "and the control that narrows it ships hidden, so it never appears dead${locale:+ (${locale#/})}"
  else
    fail "${why#"${dist}"/} ships the comparison control visible — without scripting it filters nothing"
  fi

  # shellcheck disable=SC2016  # single-quoted on purpose: the ${...} below are JS template literals for node -e, not bash parameters
  matrix_gating="$(node -e '
const { readFileSync } = require("node:fs");
const page = readFileSync(process.argv[1], "utf8");
const wrong = [];

if (!/<div class="matrix"/.test(page)) {
    wrong.push("no <div class=\"matrix\"> found — the condensed table should say everything with no click required");
}
if (/<details class="matrix"/.test(page)) {
    wrong.push("the matrix is wrapped in a <details> — it must ship permanently open, not collapsible");
}

// Ten criteria times four tools, once in the matrix `<td>` cells and once more in the
// criterion card `<li>` verdicts beneath it — 40 of each. Counted separately and by tag,
// not as one combined `data-rating="..."` count: a `<td>` cell wraps a <RatingIcon> that
// carries its own `data-rating` on an inner `<span>`, so a single un-scoped count matches
// the matrix twice and would still clear 80 even with every criterion card `<li>` deleted.
const matrixCells = (page.match(/<td\b[^>]*\sdata-rating="(?:core|possible|out-of-scope)"/g) ?? []).length;
const verdictItems = (page.match(/<li\b[^>]*\sdata-rating="(?:core|possible|out-of-scope)"/g) ?? []).length;
if (matrixCells < 40) {
    wrong.push(`only ${matrixCells} rated matrix cell(s) found, fewer than the 40 the matrix should carry`);
}
if (verdictItems < 40) {
    wrong.push(`only ${verdictItems} rated criterion verdict(s) found, fewer than the 40 the criterion cards should carry`);
}

process.stdout.write(wrong.join("; "));
' "${why}")"

  if [ -z "${matrix_gating}" ]; then
    pass "and the matrix says the whole comparison with nothing collapsed${locale:+ (${locale#/})}"
  else
    fail "${why#"${dist}"/}: ${matrix_gating}"
  fi
done

# `100vw` is the viewport *including* the classic scrollbar, so anything sized by it on a
# desktop showing one comes out about fifteen pixels wider than the page — and the document
# scrolls sideways for no visible reason. It was the full-bleed act grounds, it was reported
# twice, and it cannot be caught in a browser here: headless Chromium draws overlay
# scrollbars that take no width, so the page measures clean on this machine and wrong on a
# reader's. Nothing on this site needs the unit; the fractional `vw` inside the type scale's
# `clamp()` is a different thing and is not matched.
#
# Matched by size rather than by property, which is what makes the two cases separable: a
# layout written in `vw` uses tens of them — `50vw`, `100vw` — and the type scale uses
# fractions of one, `0.12vw` through `2vw`. Two digits with something other than a digit or
# a decimal point in front is the first and never the second.
viewport_units="$(grep -roE '[^0-9.][0-9]{2,}vw' "${dist}"/_astro/*.css 2> /dev/null || true)"
if [ -z "${viewport_units}" ]; then
  pass "no layout is sized in vw, which would be wide by the width of the scrollbar"
else
  fail "vw used for layout in the shipped CSS: ${viewport_units} — that is wider than the page whenever a scrollbar is showing"
fi

# The code is coloured with classes rather than with the inline styles every
# off-the-shelf highlighter writes, precisely because of the policy asserted just below.
# Two ways that can silently come undone: the markup stops being produced, or it is
# produced and nothing colours it. Both leave a page that looks like the one before any of
# this was built, so both are checked here.
coloured="$(grep -l 'class="tok-keyword"' "${dist}"/index.html "${dist}"/fr/index.html 2> /dev/null | wc -l)"
if [ "${coloured}" -eq 2 ]; then
  pass "the code on both home pages is marked up for colouring"
else
  fail "only ${coloured} of the two home pages carry highlighted code — highlight.ts is not reaching them"
fi

if grep -rqs "\.tok-keyword{" "${dist}"/_astro/*.css; then
  pass "and a stylesheet colours those marks"
else
  fail "nothing in the shipped CSS colours .tok-keyword, so the code renders in one colour"
fi

# The policy claims style-src 'self'. That claim is only true while no document
# carries an inline <style>, and one inlined stylesheet turns the whole policy into
# a lie that shows up as unstyled pages in production and nowhere else.
if [ -f "${dist}/_headers" ] && grep -q "style-src 'self'" "${dist}/_headers"; then
  inlined="$(grep -rl '<style' "${dist}" --include='*.html' || true)"
  if [ -z "${inlined}" ]; then
    pass "no inline <style> survives, so style-src can stay at 'self'"
  else
    fail "inline <style> found, which style-src 'self' will block: ${inlined}"
  fi
fi

# Likewise for the script policy: every inline script in the shipped HTML must be
# covered by a hash in the policy, or it is blocked at run time.
#
# The scan is scripts/lib/inline-scripts.mjs, the same module generate-headers.mjs writes
# the policy from — literally the same code, not a second copy of the same idea. Two copies
# is what this was, and both were wrong in the same way twice: first hashing a `<script>`
# that only ever appeared inside a comment, then mangling a script whose body contains
# `<!--`. A shared implementation can be held to a shared test, which is the check below.
if [ -f "${dist}/_headers" ]; then
  node "${root}/scripts/lib/inline-scripts.mjs" --self-test || fail "the inline-script scan no longer obeys the tokenizer"

  uncovered=0
  while IFS= read -r shell; do
    hash="$(node "${root}/scripts/lib/inline-scripts.mjs" "${shell}")"
    for h in ${hash}; do
      grep -q "sha256-${h}" "${dist}/_headers" || { fail "inline script in ${shell#"${dist}"/} is not covered by a policy hash"; uncovered=1; }
    done
  done < <(find "${dist}" -name '*.html')
  [ "${uncovered}" -eq 0 ] && pass "every inline script is covered by a policy hash"
fi

# --- What the measurement may not lose (§15) --------------------------------------
#
# Every element that reports itself carries a placement, and the ones with a door to
# choose between carry a variant too (ADR-0023). §15 puts two rules on that pair, and
# neither is visible by reading a component: both are properties of the whole built
# page, which is why they are checked here.
#
# One node pass rather than a grep, because both attributes have to come off the same
# tag and their order in the markup is the author's, not a guarantee.
# shellcheck disable=SC2046  # deliberate: each HTML path becomes its own argv entry for node's process.argv.slice(1)
measurement="$(node -e '
  const { readFileSync } = require("node:fs");
  for (const page of process.argv.slice(1)) {
    const html = readFileSync(page, "utf8");
    // The locale this document is served in, which every locale-bearing address on it
    // is prefixed with (§7.2). Read off the document rather than from a list, so a
    // third locale needs nothing added here.
    const lang = html.match(/<html[^>]*\blang="([a-z]{2})"/);
    for (const match of html.matchAll(/<[a-zA-Z][^>]*>/g)) {
      const tag = match[0];
      const placement = tag.match(/\bdata-placement="([^"]*)"/);
      if (!placement) { continue; }
      const variant = tag.match(/\bdata-variant="([^"]*)"/);
      // What the element actually does, which is how the pair is judged below: the
      // command a button copies, or the address a link opens.
      const payload = tag.match(/\bdata-command="([^"]*)"/) ?? tag.match(/\bhref="([^"]*)"/);
      let door = payload ? payload[1] : "";
      // A route is the same in every locale but its prefix (§7.2), so the French twin of
      // a page is the same door as the English one and must not read as a second thing
      // the pair means. The dataset separates the two anyway: the collector writes the
      // locale in a blob of its own. Only a prefix matching this document is dropped, so
      // an address that merely starts with two letters is left alone.
      if (lang && door.startsWith("/" + lang[1] + "/")) { door = door.slice(lang[1].length + 1); }
      console.log([page, placement[1], variant ? variant[1] : "", door].join("\t"));
    }
  }' $(find "${dist}" -name '*.html') 2> /dev/null || true)"

if [ -z "${measurement}" ]; then
  fail "no element in the artefact reports a placement — §15.2's events carry no dimension"
else
  # §15.3, and the reason is empirical rather than stylistic: the page went from
  # eleven scenes to fourteen between two drafts and the final exit changed ordinal.
  # An identifier carrying that position would have made two measurement periods
  # incomparable. `act-one-exit` spells the number as a word to stay outside this.
  positional="$(printf '%s\n' "${measurement}" | awk -F'\t' '$2 ~ /[0-9]/ { print $2 }' | sort -u || true)"
  if [ -z "${positional}" ]; then
    pass "no measurement placement is indexed on a position"
  else
    fail "placement carries a digit, which §15.3 forbids as an identifier: ${positional}"
  fi

  # §15.2 asks the pair to say which door was taken from which moment, so a pair must
  # never mean two different things at once — the symptom of that is a dashboard number
  # which is quietly the sum of two doors.
  #
  # NOT "a pair appears once". It appears more than once by design, and this check was
  # written the wrong way round first and caught it: the NuGet link is deliberately
  # repeated in both install panels, and its variant deliberately names the package
  # rather than the panel, so that the names already recorded keep their meaning
  # (InstallTabs.astro). Two elements reporting one pair are correct precisely when they
  # do the same thing. What is checked is therefore the payload, not the count.
  #
  # ACROSS THE WHOLE ARTEFACT, not per page, and the page field is dropped before the
  # comparison for that reason. The dataset has no page dimension: the collector writes
  # a placement and a variant, and the reporting query groups by those two alone. So a
  # pair meaning one thing on / and another on /fr/ is ambiguous in exactly the way this
  # check exists to refuse, while a per-page key would call each of them unique and
  # report nothing.
  ambiguous="$(printf '%s\n' "${measurement}" \
    | awk -F'\t' '{ print $2 "\t" $3 "\t" $4 }' | sort -u \
    | awk -F'\t' '{ print $1 "\t" $2 }' | uniq -d \
    | awk -F'\t' '{ print $1 "/" $2 }' | sort -u | paste -sd' ' - || true)"
  if [ -z "${ambiguous}" ]; then
    pass "no placement and variant pair reports two different things"
  else
    fail "one placement and variant pair covers two different commands or links, so the dashboard cannot separate them: ${ambiguous}"
  fi
fi

# The floating download control reports, on every page that draws one.
#
# THIS IS THE DEFECT IT EXISTS FOR, not a shape rule like the two above. That control
# shipped standing on every page with no measurement of any kind on it, in all three
# lanes at once (#161) — an exit nobody was watching, and nothing anywhere went red
# about it. What makes the omission catchable is that the control's markup is what says
# it reports: lose the placement and the click still works, still leads to the same
# page, and stops being counted silently. So the artefact is asked directly.
#
# PER PAGE, unlike the checks above. The control is deliberately absent from /download/
# itself (ADR-0004 applied to navigation), so what is asserted is a conditional — a page
# that draws one must mark it — rather than a count.
#
# IT SEES THE ARTEFACT, WHICH IS NOT EVERY CONTROL ON THE SITE. The playground draws its
# own counterpart (DownloadFab.razor) at run time, from a shell this scan finds empty, so
# nothing here covers it — and nothing needs to yet: that document carries no lane at all,
# beacon and consent banner included. The measurement plan names that gap under what is
# not measured, so this comment is the second half of the same admission rather than the
# only place it is written down.
# shellcheck disable=SC2046  # deliberate: each HTML path becomes its own argv entry for node's process.argv.slice(1)
unmarked="$(node -e '
  const { readFileSync } = require("node:fs");
  for (const page of process.argv.slice(1)) {
    const html = readFileSync(page, "utf8");
    for (const match of html.matchAll(/<a\b[^>]*>/g)) {
      const tag = match[0];
      if (!/\bclass="[^"]*\bdownload-fab\b[^"]*"/.test(tag)) { continue; }
      if (!/\bdata-placement="[^"]*"/.test(tag)) { console.log(page); }
    }
  }' $(find "${dist}" -name '*.html') 2> /dev/null || true)"

if [ -z "${unmarked}" ]; then
  pass "every page drawing the download control marks it with a placement"
else
  fail "the download control is drawn without a placement, so its clicks are recorded nowhere: $(printf '%s\n' "${unmarked}" | sed "s#^${dist}/##" | paste -sd' ' -)"
fi

# The audience beacon and the policy that has to admit it, checked against each other
# in both directions. A beacon the policy blocks loads nothing and says so only in a
# console nobody is watching; a policy naming hosts the artefact never contacts is
# permission granted to something that is not there. generate-headers.mjs derives one
# from the other, so this asserts that it did.
if [ -f "${dist}/_headers" ]; then
  if grep -rqs 'static\.cloudflareinsights\.com' "${dist}" --include='*.html'; then
    if grep -q "script-src[^;]*https://static\.cloudflareinsights\.com" "${dist}/_headers" \
      && grep -q "connect-src[^;]*https://cloudflareinsights\.com" "${dist}/_headers"; then
      pass "the audience beacon is present and the policy admits both of its hosts"
    else
      fail "the artefact carries the audience beacon but the policy does not admit it — it will be blocked"
    fi
  elif grep -q 'cloudflareinsights' "${dist}/_headers"; then
    fail "the policy names the analytics hosts, but no document carries the beacon"
  else
    pass "no audience beacon was built in, and the policy grants it nothing"
  fi
fi

# The playground is measured on the same terms as every other page, or this says so.
#
# THE DEFECT THIS ANSWERS SHIPPED. The playground is a second application with a shell of
# its own, and for as long as it has existed that shell carried no beacon at all — so its
# visits were missing from every audience figure while every Astro page was counted, and
# nothing anywhere went red. #161 found it by reading the file, which is not a method.
#
# ASSERTED AS AGREEMENT RATHER THAN AS PRESENCE, because a build with no token is a normal
# build: what must never happen is the two halves disagreeing about whether this site is
# measured. That covers the regression in both directions — a shell that loses the slot,
# and a shell that keeps a beacon a token-less build should not have written.
if [ -f "${dist}/playground/index.html" ]; then
  pages_carry=0
  # Every document but the playground's own, so the shell cannot answer for itself.
  while IFS= read -r page; do
    case "${page}" in "${dist}/playground/"*) continue ;; esac
    if grep -qs 'static\.cloudflareinsights\.com' "${page}"; then
      pages_carry=1
      break
    fi
  done < <(find "${dist}" -name '*.html')

  shell_carries=0
  grep -qs 'static\.cloudflareinsights\.com' "${dist}/playground/index.html" && shell_carries=1

  if [ "${pages_carry}" -eq "${shell_carries}" ]; then
    if [ "${shell_carries}" -eq 1 ]; then
      pass "the playground carries the audience beacon, like every other page"
    else
      pass "this build measures nobody, and the playground agrees with its own pages"
    fi
  elif [ "${pages_carry}" -eq 1 ]; then
    fail "every page carries the audience beacon and the playground does not, so its visits are counted nowhere"
  else
    fail "the playground carries an audience beacon this build's own pages do not — it would report into an account nothing else reports to"
  fi
fi

# The analytics tag and the policy that has to admit it — the same shape as the beacon
# block above, plus a third direction the beacon never needed.
#
# THE THIRD DIRECTION IS THE ONE THAT COST SOMETHING TO LEARN. The beacon is a tag in a
# document, so "is it in the artefact" and "is it in a document" are one question. A
# bundled module is not: Astro collects every <script> from the module graph rather than
# the render tree, so a tag written as a bundled script leaves a chunk under _astro/
# even on a build that renders it nowhere — a chunk no document loads, no policy admits,
# and the size budget counts in full. That is why GoogleAnalytics.astro is is:inline,
# and this is what says it still is.
if [ -f "${dist}/_headers" ]; then
  in_documents=0
  grep -rqs 'www\.googletagmanager\.com' "${dist}" --include='*.html' && in_documents=1

  in_chunks=0
  for chunk in "${dist}"/_astro/*.js; do
    [ -f "${chunk}" ] || continue
    if grep -qs -e 'googletagmanager\.com' -e 'google-analytics\.com' -e 'analytics\.google\.com' "${chunk}"; then
      in_chunks=1
      break
    fi
  done

  if [ "${in_chunks}" -eq 1 ]; then
    fail "a bundled chunk under _astro/ names a Google host — the analytics tag must stay is:inline, or the artefact carries a host the policy cannot honestly admit"
  elif [ "${in_documents}" -eq 1 ]; then
    if grep -q "script-src[^;]*https://www\.googletagmanager\.com" "${dist}/_headers" \
      && grep -q "connect-src[^;]*https://\*\.google-analytics\.com" "${dist}/_headers" \
      && grep -q "connect-src[^;]*https://\*\.analytics\.google\.com" "${dist}/_headers" \
      && grep -q "connect-src[^;]*https://www\.googletagmanager\.com" "${dist}/_headers" \
      && grep -q "img-src[^;]*https://\*\.google-analytics\.com" "${dist}/_headers"; then
      pass "the analytics tag is present and the policy admits every host it uses"
    else
      fail "the artefact carries the analytics tag but the policy does not admit all of its hosts — it will be blocked"
    fi
  elif grep -q 'googletagmanager\|google-analytics\|analytics\.google' "${dist}/_headers"; then
    fail "the policy names the Google hosts, but no document carries the analytics tag"
  else
    pass "no analytics tag was built in, and the policy grants Google nothing"
  fi

  # And the artefact against the state it was BUILT FOR, which nothing above can see.
  #
  # Every check above derives both of its sides from dist/ — the tag from the documents, the
  # policy from _headers, which generate-headers.mjs derived from those same documents. So they
  # agree by construction in either state, and "no tag at all" is a valid outcome to them. That
  # leaves the switch itself unguarded in the direction that matters: with the repository
  # variable set to enabled, a tag that stopped rendering — an inverted ternary in
  # measurement.ts, a dropped component in Measurement.astro, a page on a layout that bypasses
  # Base.astro — produces a green build that measures nobody. The browser suite cannot catch it
  # either: consent.spec.ts decides whether to run by looking for the tag in the page, so the
  # same absence turns all thirty-odd of its checks into skips, invisible in a passing run.
  #
  # Guarded on the variable being set rather than run unconditionally, because the deploy job
  # re-runs this script against a downloaded artefact with no build variables in scope. There
  # the artefact is genuinely all there is, and the checks above still hold on their own.
  if [ -n "${PUBLIC_GA_MEASUREMENT_STATE:-}" ]; then
    case "${PUBLIC_GA_MEASUREMENT_STATE}" in
      enabled)
        if [ "${in_documents}" -eq 1 ]; then
          pass "the lane is switched on, and the artefact carries the tag"
        else
          fail "PUBLIC_GA_MEASUREMENT_STATE is enabled, but no document carries the tag — this artefact would measure nobody, and every consent check would skip rather than fail"
        fi
        ;;
      disabled)
        if [ "${in_documents}" -eq 0 ]; then
          pass "the lane is switched off, and no document carries the tag"
        else
          fail "PUBLIC_GA_MEASUREMENT_STATE is disabled, but a document carries the tag — this artefact measures people the recorded decision says it would not"
        fi
        ;;
      *)
        fail "PUBLIC_GA_MEASUREMENT_STATE is '${PUBLIC_GA_MEASUREMENT_STATE}', which is neither enabled nor disabled"
        ;;
    esac
  fi

  # The three advertising signals are denied permanently and are never updated: since
  # June 2026 ad_storage is the only thing keeping tag data out of Google Ads, so the
  # denial cannot live in a console setting nothing here can read. The tag is inline,
  # which means the built document IS the source — what is asserted is what ships.
  if [ "${in_documents}" -eq 1 ]; then
    advertising="$(
      node -e '
        const fs = require("node:fs");
        const html = fs.readFileSync(process.argv[1], "utf8");
        const signals = ["ad_storage", "ad_user_data", "ad_personalization"];
        const missing = signals.filter((k) => !new RegExp(k + "\\s*:\\s*.denied.").test(html));
        const granted = signals.filter((k) => new RegExp(k + "\\s*:\\s*.granted.").test(html));
        if (missing.length) { console.log("never denied: " + missing.join(", ")); }
        if (granted.length) { console.log("granted somewhere: " + granted.join(", ")); }
      ' "${dist}/index.html"
    )"
    if [ -z "${advertising}" ]; then
      pass "every advertising consent signal is denied, and none is ever granted"
    else
      fail "the advertising consent signals are not what the measurement decision requires — ${advertising}"
    fi

    # privacy.tracking.body's "nothing measured is ever shared with anyone" is a claim the
    # very same page contradicts once the lane is on: privacy.consent.body discloses Google
    # as a second processor a few paragraphs down. A build that ships the tag has to ship a
    # privacy page that agrees with itself.
    contradiction=0
    for privacy_page in "${dist}/privacy/index.html" "${dist}/fr/privacy/index.html"; do
      [ -f "${privacy_page}" ] || continue
      grep -qs -e 'shared with anyone' -e 'partagé avec qui que ce soit' "${privacy_page}" && contradiction=1
    done

    if [ "${contradiction}" -eq 0 ]; then
      pass "the privacy page does not claim no sharing on a build that discloses Google"
    else
      fail "the privacy page still claims nothing is ever shared, on a build that discloses Google as a processor"
    fi
  fi
fi

if [ "${failures}" -ne 0 ]; then
  echo "verify-output: ${failures} check(s) failed." >&2
  exit 1
fi

echo "▸ Artefact looks well formed."
