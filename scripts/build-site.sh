#!/usr/bin/env bash
# Build the whole deployment: the Astro site, then the playground inside it.
#
# One artefact, assembled in one place (§14.3). The order matters — Astro clears
# its output directory, so the playground must be copied in after the site is
# built, never before.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Before the site is built, because the site imports what these produce. All five write
# into apps/site/src/generated/, and all five are committed: what they hold only moves when
# something real moves, so the diff is worth reading rather than noise to skip.
#
# Two of them are checks as much as generators. The reproducibility step runs the third act's
# suite until it goes red and then replays the reported seed three times, and the tool step
# fails if the scaffolder stops reporting the guard it cannot read. Both would rather stop the
# build than let the page keep a claim whose evidence has moved.
echo "▸ Extracting the validated snippets"
node "${root}/scripts/extract-snippets.mjs"

echo "▸ Generating the sample values"
"${root}/scripts/generate-sample-values.sh"

echo "▸ Checking the third act still holds"
"${root}/scripts/generate-reproducibility.sh"

echo "▸ Recording what the tool prints"
"${root}/scripts/generate-tool-output.sh"

echo "▸ Reflecting on the published packages for the API catalogue"
"${root}/scripts/generate-api-catalogue.sh"

# Also before the build, and the odd one out of the five: it is not committed, because
# it changes on every build. It moved here from after the build the day /version had to
# display it — Astro clears its output directory, so a page cannot read a file written
# once the build is over. Copied into the artefact below, from this same file, so the
# page and the endpoint cannot name two different builds.
echo "▸ Stamping this build with its version"
"${root}/scripts/generate-version.sh"

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

# Before copy-playground.sh, not after: no reason to publish a playground whose own
# check already knows it disagrees with itself. This is PlaygroundStrings.cs's parity
# check (§6.4) actually executed rather than merely compiled — a static constructor
# proves nothing on its own, since `dotnet build` never runs one.
echo "▸ Checking the playground's locale keys agree"
dotnet run --project "${root}/tools/playground-i18n-guard/JustDummies.PlaygroundI18nGuard.csproj"

"${root}/scripts/copy-playground.sh"

# After the playground, never before: the policy names a hash of the shell that
# the publish has just written.
echo "▸ Generating the response headers"
node "${root}/scripts/generate-headers.mjs"

# Before verify-output.sh, which asserts it: the stamp is part of the artefact's
# shape, not an afterthought bolted on at upload time.
#
# A copy of the file the page was built from, never a second stamping. Two runs of the
# generator would put two `built` times on one build, and the version the site displays
# would differ from the version it serves — by seconds, which is exactly long enough to
# waste an afternoon on.
echo "▸ Serving that stamp from the artefact"
cp "${root}/apps/site/src/generated/version.json" "${root}/dist/version.json"

"${root}/scripts/verify-output.sh"

# After verify-output.sh, which is about the artefact's shape; this one is about what the
# narrative says, and it reads the built pages as well as the strings behind them.
"${root}/scripts/check-narrative.sh"

echo
echo "▸ Ready: ${root}/dist"
