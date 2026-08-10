#!/usr/bin/env bash
# Build the whole deployment: the Astro site, then the playground inside it.
#
# One artefact, assembled in one place (§14.3). The order matters — Astro clears
# its output directory, so the playground must be copied in after the site is
# built, never before.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "▸ Building the site"
pnpm --filter @justdummies/site build

"${root}/scripts/copy-playground.sh"

# After the playground, never before: the policy names a hash of the shell that
# the publish has just written.
echo "▸ Generating the response headers"
node "${root}/scripts/generate-headers.mjs"

"${root}/scripts/verify-output.sh"

echo
echo "▸ Ready: ${root}/dist"
