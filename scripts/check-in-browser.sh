#!/usr/bin/env bash
# Check what the artefact does in a real browser.
#
# The three checks beside this one read: verify-output.sh reads the artefact on disk,
# check-served-headers.sh reads the host's response headers, check-narrative.sh reads the
# built document. None of them renders a page, and a page has facts that only exist once it
# is rendered — a WebAssembly application that starts, a policy the browser agrees to, a
# control that is absent until its script arrives, a document no wider than its viewport.
#
# This one renders. The suite it runs, and the reasoning behind Playwright rather than the
# alternatives, is ADR-0009.
#
# It serves dist/ through the same runtime production uses rather than through a dev server,
# for the reason check-served-headers.sh was written down: a rule file in this repository was
# present, well formed and silently ignored by the runtime for months, while every check that
# read the artefact passed. The serving is Playwright's own webServer, configured in
# playwright.config.ts.
#
#     scripts/check-in-browser.sh                 every check
#     scripts/check-in-browser.sh controls        the checks whose file name matches
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d "${root}/dist" ]; then
  echo "check-in-browser: no dist/ to serve. Run 'pnpm build' first." >&2
  exit 1
fi

if [ ! -f "${root}/dist/playground/index.html" ]; then
  echo "check-in-browser: dist/ carries no playground, and one of the checks is that it runs." >&2
  echo "  Run 'pnpm build' rather than 'pnpm build:site'." >&2
  exit 1
fi

# The half of the flake policy that can be enforced rather than remembered.
#
# ADR-0009 keeps retries at zero, so an intermittent red is a defect to fix rather than noise
# to absorb. That only holds while no check waits on a fixed delay: a sleep is either too
# short on a slow machine, which is the flake, or wasted on a fast one, which is the slowness
# that makes somebody add a retry. Playwright's assertions retry against a deadline on their
# own, so a wait written by hand is a sign the check should be written differently.
#
# `test.setTimeout` is not one of those. It raises the budget a check is allowed to take
# and waits for nothing; the first version of this guard refused it, which is how a
# measurement that needed two minutes ran into a rule written for something else.
sleeps="$(grep -rnE 'waitForTimeout\(|setTimeout\(' "${root}/tests/browser" | grep -v 'test\.setTimeout(' || true)"

if [ -n "${sleeps}" ]; then
  echo "check-in-browser: a check waits on a fixed delay." >&2
  printf '%s\n' "${sleeps}" | sed 's|^'"${root}"'/|  |' >&2
  echo "  Wait on the condition instead — expect(...) retries until its deadline (ADR-0009)." >&2
  exit 1
fi

# Every spec takes its `test` from the harness, and the failure of not doing so is silent.
#
# tests/browser/support/harness.ts holds two things no spec should have to remember: it keeps
# the run off the measurement hosts, so a release does not post a burst of synthetic page
# views into the real audience figures, and it hands the browser the .NET runtime from disk,
# so the dev server is never asked to stream the hundred and fifty megabytes that kill it.
#
# A spec importing straight from '@playwright/test' silently opts out of both. Neither
# failure shows up as a red check: the first shows up weeks later as visits nobody made, the
# second as an unrelated check reporting ERR_CONNECTION_REFUSED. chrome-parity.spec.ts did
# exactly this, and both consequences were live.
#
# Types are fine — `import type { Page }` imports no runner.
strays="$(grep -rnE "^import .*from '@playwright/test'" "${root}/tests/browser"/*.spec.ts | grep -vE "^[^:]+:[0-9]+:import type " || true)"

if [ -n "${strays}" ]; then
  echo "check-in-browser: a check takes its test runner from Playwright rather than the harness." >&2
  printf '%s\n' "${strays}" | sed 's|^'"${root}"'/|  |' >&2
  echo "  Import { expect, test } from './support/harness' instead." >&2
  exit 1
fi

# A browser this machine already has, when it has one, so a container that ships Chromium
# does not download a second copy. CI leaves it unset and uses the one it installed.
if [ -z "${CHROMIUM_PATH:-}" ] && [ -x /opt/pw-browsers/chromium ]; then
  export CHROMIUM_PATH=/opt/pw-browsers/chromium
fi

echo "▸ Rendering the artefact"

cd "${root}"
exec npx playwright test "$@"
