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

[ -f "${dist}/index.html" ] && pass "the site has an entry point" || fail "dist/index.html is missing"
[ -f "${dist}/playground/index.html" ] && pass "the playground has an entry point" || fail "dist/playground/index.html is missing"
[ -d "${dist}/playground/_framework" ] && pass "the .NET runtime is present" || fail "dist/playground/_framework is missing"

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

[ -f "${dist}/_redirects" ] && pass "the redirect rules were copied" || fail "dist/_redirects is missing"
[ -f "${dist}/_headers" ] && pass "the response headers were generated" || fail "dist/_headers is missing"
[ -f "${dist}/.assetsignore" ] && pass "the upload exclusions were copied" || fail "dist/.assetsignore is missing"

# The host's own migration guide invites this mistake, so it is checked rather
# than trusted. On Workers, _headers and _redirects are never served as assets:
# they are parsed, and their rules are applied to asset responses. Excluding them
# from the upload does not make them private — they already are — it makes them
# absent, and the site loses its policy, its cache rules and the playground
# rewrite while every page keeps answering 200.
if [ -f "${dist}/.assetsignore" ]; then
  if grep -vE '^[[:space:]]*#' "${dist}/.assetsignore" | grep -qE '(^|/)_(headers|redirects)[[:space:]]*$'; then
    fail ".assetsignore excludes _headers or _redirects — those are parsed, not served, and excluding them deletes the policy"
  else
    pass "_headers and _redirects are not excluded from the upload"
  fi
fi

# not_found_handling is set to "404-page" in wrangler.jsonc, and it serves the
# nearest 404.html. Without the files, the setting points at nothing and a
# mistyped URL gets the host's default page rather than the site's.
[ -f "${dist}/404.html" ] && pass "the English 404 page exists" || fail "dist/404.html is missing, and wrangler.jsonc asks for it"
[ -f "${dist}/fr/404.html" ] && pass "the French 404 page exists" || fail "dist/fr/404.html is missing, so a mistyped French URL answers in English"

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
if [ -f "${dist}/_headers" ]; then
  uncovered=0
  while IFS= read -r shell; do
    hash="$(node -e '
      const { createHash } = require("node:crypto");
      const html = require("node:fs").readFileSync(process.argv[1], "utf8");
      for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
        if (m[1].length) { console.log(createHash("sha256").update(m[1], "utf8").digest("base64")); }
      }' "${shell}")"
    for h in ${hash}; do
      grep -q "sha256-${h}" "${dist}/_headers" || { fail "inline script in ${shell#"${dist}"/} is not covered by a policy hash"; uncovered=1; }
    done
  done < <(find "${dist}" -name '*.html')
  [ "${uncovered}" -eq 0 ] && pass "every inline script is covered by a policy hash"
fi

if [ "${failures}" -ne 0 ]; then
  echo "verify-output: ${failures} check(s) failed." >&2
  exit 1
fi

echo "▸ Artefact looks well formed."
