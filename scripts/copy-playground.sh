#!/usr/bin/env bash
# Publish the Blazor playground and place it inside the site's artefact.
#
# The playground's project file sets StaticWebAssetBasePath to `playground`, so
# the publish already nests the application one level down and every asset URL it
# writes is rooted at /playground/. This script therefore copies that directory
# across rather than rewriting anything: the two halves agree because they were
# built to agree, not because a script patched one of them.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project="${root}/apps/playground/JustDummies.Playground.csproj"
staging="${root}/artifacts/playground"
destination="${root}/dist/playground"

echo "▸ Publishing the playground"
dotnet publish "${project}" --configuration Release --output "${staging}" --nologo

published="${staging}/wwwroot/playground"
if [ ! -d "${published}" ]; then
  echo "copy-playground: expected ${published} to exist." >&2
  echo "  StaticWebAssetBasePath in the project file is what nests it; check that first." >&2
  exit 1
fi

echo "▸ Copying it into the artefact"
# Replaced wholesale rather than merged: a stale asset left behind by an earlier
# build is served with the same confidence as a fresh one, and is far harder to
# notice than a missing file.
rm -rf "${destination}"
mkdir -p "$(dirname "${destination}")"
cp -R "${published}" "${destination}"

echo "  ${destination}"
