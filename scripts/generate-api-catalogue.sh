#!/usr/bin/env bash
# Reflect on the published JustDummies and JustDummies.Xunit packages and write the
# catalogue the /api pages read.
#
# Same rule as every other file in apps/site/src/generated/: nothing here is typed by hand.
# The library ships forty-nine public types across two packages, documented in its own XML
# comments — retyping that surface into Astro would drift from the day it was written. See
# tools/api-catalogue/Program.cs for what "reflects" means here and why the category a type
# belongs to is the one thing this tool still asks a person to decide.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "${root}/apps/site/src/generated"

dotnet run \
  --project "${root}/tools/api-catalogue/JustDummies.ApiCatalogue.csproj" \
  --configuration Release \
  -- "${root}/apps/site/src/generated/api-catalogue.json"
