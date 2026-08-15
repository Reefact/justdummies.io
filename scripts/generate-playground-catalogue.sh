#!/usr/bin/env bash
# Reflect over the referenced JustDummies assembly and (re)write the playground's
# catalogue — the build-time bridge specification §10.4 requires.
#
# Committed, like apps/site/src/generated/*.json: the diff is how a library change
# becomes visible, rather than a silent drift nobody notices until the playground is
# missing something it should offer.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

dotnet run \
  --project "${root}/tools/playground-catalogue/JustDummies.PlaygroundCatalogue.csproj" \
  --configuration Release \
  -- "${root}/packages/playground-catalogue/Generated" "${root}/tools/playground-catalogue/excluded-members.jsonc"
