#!/usr/bin/env bash
# Build the whole deployment: the Astro site, then the playground inside it.
#
# One artefact, assembled in one place (§14.3). The order matters — Astro clears
# its output directory, so the playground must be copied in after the site is
# built, never before.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Before the site is built, because the site imports what these produce. All three write
# into apps/site/src/generated/, and all three are committed: the values only move when
# something real moves, so the diff is worth reading rather than noise to skip.
echo "▸ Extracting the validated snippets"
node "${root}/scripts/extract-snippets.mjs"

echo "▸ Generating the sample values"
"${root}/scripts/generate-sample-values.sh"

echo "▸ Recording what the tool prints"
"${root}/scripts/generate-tool-output.sh"

echo "▸ Building the site"
pnpm --filter @justdummies/site build

# Astro special-cases only the 404 at the root of src/pages, emitting it as
# 404.html. A localised one is an ordinary page, so with directory-format builds
# it lands at fr/404/index.html — a name the host will never look for. Workers
# serves the *nearest* file literally called 404.html, so the French page is
# renamed to that and its directory removed, leaving exactly one URL rather than
# the same page answering at two.
if [ -f "${root}/dist/fr/404/index.html" ]; then
  echo "▸ Flattening the French 404 to the name the host looks for"
  mv "${root}/dist/fr/404/index.html" "${root}/dist/fr/404.html"
  rmdir "${root}/dist/fr/404"
fi

"${root}/scripts/copy-playground.sh"

# After the playground, never before: the policy names a hash of the shell that
# the publish has just written.
echo "▸ Generating the response headers"
node "${root}/scripts/generate-headers.mjs"

"${root}/scripts/verify-output.sh"

echo
echo "▸ Ready: ${root}/dist"
