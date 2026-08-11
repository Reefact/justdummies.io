#!/usr/bin/env bash
# Check what the host actually serves, by asking the host.
#
# scripts/verify-output.sh reads the artefact on disk: the policy file exists, its
# rules look right, every inline script is covered. All of that can be true while the
# host ignores the file completely — and that is not a hypothetical. A redirect rule
# in this repository was silently discarded by the runtime for months' worth of
# builds, while every on-disk check passed, because "the file is there" and "the file
# does something" are different claims.
#
# So this one starts the real runtime and asks it. It answers three questions no
# amount of reading the artefact can:
#
#   * are the response headers applied at all, and to assets as well as documents;
#   * do a general rule and a specific rule merge, or does one replace the other;
#   * is the WebAssembly payload compressed on the way out.
#
# By default it runs against `wrangler dev`. Pass a base URL to run it against a
# deployment instead, which is how the last question gets its final answer:
#
#     scripts/check-served-headers.sh https://justdummies.io
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
base="${1:-}"
runtime_pid=""
runtime_pgid=""
runtime_log=""

failures=0
fail() { echo "  ✗ $1" >&2; failures=$((failures + 1)); }
pass() { echo "  ✓ $1"; }

# The runtime is a tree, not a process: pnpm spawns node, node spawns wrangler,
# wrangler spawns workerd. Killing the one process this script started leaves the
# rest running — it holds its port, so the next run finds it busy and reports on a
# server nobody meant to still be there. Under CI it surfaces as the runner
# terminating orphan workerd processes after the step has already reported success.
#
# So the runtime is started in its own process group, and the whole group is what
# gets signalled.
cleanup() {
  if [ -n "${runtime_pgid}" ]; then
    kill -- "-${runtime_pgid}" 2> /dev/null || true
    wait 2> /dev/null || true
  fi
  [ -n "${runtime_log}" ] && rm -f "${runtime_log}"
}
trap cleanup EXIT

if [ -z "${base}" ]; then
  if [ ! -d "${root}/dist" ]; then
    echo "check-served-headers: no dist/ to serve. Run 'pnpm build' first." >&2
    exit 1
  fi

  runtime_log="$(mktemp)"
  echo "▸ Starting the runtime"
  setsid bash -c "cd '${root}' && exec pnpm serve" > "${runtime_log}" 2>&1 &
  runtime_pid=$!

  # setsid makes the child a session leader, so its process group id is its own pid —
  # read back rather than assumed, because a setsid that had to fork would leave $!
  # pointing at the wrapper.
  sleep 1
  runtime_pgid="$(ps -o pgid= -p "${runtime_pid}" 2> /dev/null | tr -d ' ' || true)"
  runtime_pgid="${runtime_pgid:-${runtime_pid}}"

  # Waiting on the line the runtime prints, rather than on a fixed sleep: a sleep is
  # either too short on a slow machine or wasted on a fast one.
  for _ in $(seq 1 60); do
    if grep -q 'Ready on http' "${runtime_log}" 2> /dev/null; then
      break
    fi
    sleep 1
  done

  base="$(grep -oE 'http://localhost:[0-9]+' "${runtime_log}" | sed -n 1p || true)"

  if [ -z "${base}" ]; then
    echo "check-served-headers: the runtime never became ready." >&2
    tail -20 "${runtime_log}" >&2
    exit 1
  fi

  # The runtime says how many rules it accepted, and the number is worth reading: a
  # rule it rejects is reported here and nowhere else.
  grep -oE 'Parsed [0-9]+ valid (redirect|header) rules?' "${runtime_log}" | sed 's/^/  /' || true
fi

echo "▸ Asking ${base}"

header_of() {
  curl -sSI --max-time 20 "${base}$1" | grep -i "^$2:" | sed 's/^[^:]*: *//' | tr -d '\r' | sed -n 1p || true
}

status_of() {
  curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${base}$1" || echo 000
}

# Every check below reads headers off a response, and a 404 page has headers too — the
# same policy, the same compression, everything but the thing that was asked for. So each
# one establishes that the resource is actually there before believing anything else about
# it, and says which of the two went wrong.
#
# This is not hypothetical. Run against a deployment built from a different commit, the
# WebAssembly check asked for a fingerprint that no longer existed, was handed the 404 page,
# found it compressed, and reported a cheerful green: "the runtime compresses the
# WebAssembly payload (br: 1858 → 735 bytes)". Two kilobytes. The figure was absurd and the
# tick was wrong, and nothing in the run said so.
#
# A path that 404s against a deployment is worth its own message rather than a silent skip:
# it means the artefact on disk and the artefact on the host are different builds, which is
# something the person running this needs told.
present() {
  actual="$(status_of "$1")"

  if [ "${actual}" = "200" ]; then
    return 0
  fi

  fail "$1 answers ${actual}, so $2 was measured on whatever the host sent instead"
  return 1
}

# --- the policy reaches documents and assets alike ------------------------------
for path in "/" "/fr/" "/playground/"; do
  present "${path}" "its policy" || continue

  policy="$(header_of "${path}" "content-security-policy")"
  if [ -n "${policy}" ]; then
    pass "${path} is served with a content security policy"
  else
    fail "${path} is served with NO content security policy — the host is ignoring _headers"
  fi
done

# --- a specific rule must add to the general one, not replace it -----------------
# If they replaced each other, every fingerprinted asset would lose the policy while
# gaining its cache lifetime, and nothing on disk would look wrong.
astro_asset="$(cd "${root}/dist" && find _astro -name '*.js' | sed -n 1p || true)"
if [ -n "${astro_asset}" ] && present "/${astro_asset}" "the merging of its rules"; then
  policy="$(header_of "/${astro_asset}" "content-security-policy")"
  cache="$(header_of "/${astro_asset}" "cache-control")"

  case "${cache}" in
    *immutable*) cached=1 ;;
    *) cached=0 ;;
  esac

  if [ -n "${policy}" ] && [ "${cached}" -eq 1 ]; then
    pass "a fingerprinted asset gets both its own cache rule and the global policy"
  elif [ "${cached}" -eq 0 ]; then
    fail "a fingerprinted asset is not served immutable — its own rule did not apply"
  else
    fail "a fingerprinted asset lost the policy — rules replace rather than merge"
  fi
fi

# --- a cold link into the playground survives ------------------------------------
status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${base}/playground/not-found" || true)"
if [ "${status}" = "200" ]; then
  pass "a cold link to a playground route answers 200"
else
  fail "a cold link to a playground route answers ${status} — the rewrite is not in force"
fi

# --- the WebAssembly payload is compressed on the way out ------------------------
# This is what decides whether the pre-compressed twins the publish emits are worth
# uploading. If the runtime compresses, they are dead weight; if it does not,
# removing them would ship a multi-megabyte runtime uncompressed.
wasm="$(cd "${root}/dist" && find playground/_framework -name 'dotnet.native.*.wasm' | sed -n 1p || true)"
if [ -n "${wasm}" ] && present "/${wasm}" "its compression"; then
  encoding="$(curl -sSI --max-time 30 -H 'Accept-Encoding: br, gzip' "${base}/${wasm}" | grep -i '^content-encoding:' | sed 's/^[^:]*: *//' | tr -d '\r' | sed -n 1p || true)"

  if [ -n "${encoding}" ]; then
    plain="$(curl -sS -o /dev/null -w '%{size_download}' --max-time 30 "${base}/${wasm}" || echo 0)"
    sent="$(curl -sS -o /dev/null -w '%{size_download}' --max-time 30 --compressed "${base}/${wasm}" || echo 0)"
    pass "the runtime compresses the WebAssembly payload (${encoding}: ${plain} → ${sent} bytes)"
  else
    fail "the WebAssembly payload is served uncompressed — the pre-compressed twins have to stay"
  fi
fi

if [ "${failures}" -ne 0 ]; then
  echo "check-served-headers: ${failures} check(s) failed." >&2
  exit 1
fi

echo "▸ The host serves what the artefact intends."
