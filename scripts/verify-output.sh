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

if [ "${failures}" -ne 0 ]; then
  echo "verify-output: ${failures} check(s) failed." >&2
  exit 1
fi

echo "▸ Artefact looks well formed."
