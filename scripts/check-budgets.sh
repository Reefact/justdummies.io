#!/usr/bin/env bash
# Report the artefact's size against the limits that matter, and fail on the ones
# that are facts rather than preferences.
#
# Two kinds of number live here and they are not treated alike. The platform limits
# are Cloudflare's, and exceeding one means the deployment is rejected — those fail
# the build. The performance budget comes from the specification, which says itself
# that it is to be refined against the prototype; it fails too, but its measured
# value is always printed, because a budget nobody can see is a budget nobody tunes.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist="${root}/dist"

# Cloudflare's published limits for a static deployment.
MAX_FILES=20000
MAX_FILE_BYTES=$((25 * 1024 * 1024))
# The specification's initial target for the landing page's own JavaScript (§19.2).
MAX_LANDING_JS_BYTES=$((150 * 1024))

failures=0
report() { printf '  %-46s %s\n' "$1" "$2"; }

# Integer division reports a real value under one kibibyte as "0 KiB", which reads
# as "nothing" rather than as "a little". A budget exists to be watched, and a
# number that rounds itself away cannot be.
kib() { awk -v bytes="$1" 'BEGIN { printf (bytes < 10240 ? "%.2f KiB" : "%.0f KiB"), bytes / 1024 }'; }
fail() { echo "  ✗ $1" >&2; failures=$((failures + 1)); }

echo "▸ Budgets for ${dist}"

# --- Platform: file count -------------------------------------------------------
files="$(find "${dist}" -type f | wc -l | tr -d ' ')"
report "files in the artefact" "${files} / ${MAX_FILES}"
[ "${files}" -le "${MAX_FILES}" ] || fail "too many files for one Cloudflare deployment"

# --- Platform: largest single asset ---------------------------------------------
largest_file="$(find "${dist}" -type f -printf '%s\t%p\n' | sort -rn | head -1)"
largest_bytes="${largest_file%%$'\t'*}"
largest_path="${largest_file#*$'\t'}"
report "largest asset" "$(kib "${largest_bytes}") — ${largest_path#"${dist}"/}"
[ "${largest_bytes}" -le "${MAX_FILE_BYTES}" ] || fail "an asset exceeds Cloudflare's per-file limit"

# --- Performance: the landing page's own JavaScript -----------------------------
# The playground is deliberately excluded: the specification requires no Blazor
# resource in the landing page's critical path, and a visitor who only reads the
# presentation never downloads the runtime. Measured compressed, which is how it
# travels.
landing_js=0
while IFS= read -r asset; do
  landing_js=$((landing_js + $(gzip -c "${asset}" | wc -c)))
done < <(find "${dist}/_astro" -name '*.js' 2>/dev/null || true)
report "landing page JavaScript (gzipped)" "$(kib "${landing_js}") / $(kib "${MAX_LANDING_JS_BYTES}")"
[ "${landing_js}" -le "${MAX_LANDING_JS_BYTES}" ] || fail "the landing page's JavaScript exceeds its budget"

# --- Informational: the playground's weight -------------------------------------
# Not a gate. It is the number the lazy-loading and AOT decisions will be argued
# from, and it is worth watching from the first build rather than the first
# complaint.
if [ -d "${dist}/playground/_framework" ]; then
  framework_br="$(find "${dist}/playground/_framework" -name '*.br' -printf '%s\n' | awk '{ total += $1 } END { print total + 0 }')"
  report "playground runtime, Brotli (informational)" "$(kib "${framework_br}")"
fi

if [ "${failures}" -ne 0 ]; then
  echo "check-budgets: ${failures} budget(s) exceeded." >&2
  exit 1
fi

echo "▸ Within budget."
