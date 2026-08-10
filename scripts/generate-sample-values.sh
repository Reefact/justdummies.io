#!/usr/bin/env bash
# Run the site's published expressions and write what they produced.
#
# The values are drawn under a pinned seed, so the file changes only when something
# real changed — the library's draw, or an expression. A fresh draw on every build
# would put a diff in every commit and teach everyone to skip the file, which is the
# opposite of the point.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "${root}/apps/site/src/generated"

# The options stay minimal on purpose: `dotnet run` forwards what it does not
# recognise, and an option it forwards arrives as an argument to the program, which
# then sees the wrong argument count and refuses.
dotnet run \
  --project "${root}/tools/sample-values/JustDummies.SampleValues.csproj" \
  --configuration Release \
  -- "${root}/apps/site/src/generated/sample-values.json"
