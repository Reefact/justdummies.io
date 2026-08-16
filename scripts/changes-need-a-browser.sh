#!/usr/bin/env bash
# Say whether a change is one that only a rendered page can check.
#
# The browser suite is the slowest thing in the pipeline by a wide margin — a browser to
# fetch and install, then a full Playwright run — so `build.yml` does not put it on every
# pull request. What it put it on instead was nothing: `workflow_dispatch` and release tags
# only, which meant a change to the layout of either application reached main having never
# been rendered anywhere but a maintainer's machine. The parity check between the site and
# the playground (tests/browser/chrome-parity.spec.ts) is the case that made that
# untenable: an invariant across two applications, held by numbers no file states, that
# nothing outside a browser can see break. It broke, on main, and this pipeline was the
# last to know.
#
# It is a script rather than a `paths:` block on the workflow's trigger because a `paths:`
# filter gates the *whole* workflow — the build would be skipped too, and a pull request
# with no checks at all is worse than a slow one.
#
# WHAT IS LISTED IS WHAT DOES NOT RENDER, AND THAT IS THE SECOND ATTEMPT.
#
# The first listed what does. It read well — one entry per thing a browser can see, each
# saying why it was there — and it was wrong five times, every time in the same direction:
# a change that alters what a page renders, matching nothing, skipping the suite, and
# reporting green. i18n (a heading rewrapped by editing a French string), the top of
# apps/site/src (site.ts owns links two specs assert), apps/site/public (404.png, whose
# dimensions notfound.spec.ts measures), the catalogue packages the playground compiles
# against, and the manifest that pins Playwright itself. Four of those five were found by
# review rather than by this file, which is the part that settles it: the list could not be
# kept true by the people writing it.
#
# So the question is inverted, because the two failures are not symmetrical. An allowlist
# that misses something skips a check silently and passes. A denylist that misses something
# runs a suite that had nothing to say, and costs two minutes. Only one of those is a
# defect, and it is not the slow one.
#
# The measurement, over the last sixty commits on main: the allowlist skipped 8 of them,
# this skips 6. Two commits of savings was what the enumeration was buying, against five
# known holes and no way to count the rest. All six this skips are documentation, which is
# what the exclusions below are.
#
# Usage:
#   changes-need-a-browser.sh <base-ref>    # compares <base-ref> against HEAD
#
# `build.yml` passes HEAD^1 — on a pull request Actions checks out the merge commit, whose
# first parent is the base — so the comparison needs no network and no history beyond the
# two commits the checkout already has.
#
# Prints its verdict, and writes `needed=true|false` to $GITHUB_OUTPUT when running under
# Actions. Exit status is 0 either way: "no browser needed" is an answer, not a failure.
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "changes-need-a-browser: usage: $0 <base-ref>" >&2
  exit 2
fi

base="$1"

# Answer "yes" to a question this cannot answer, and say so.
#
# The failure being avoided is silent and one-directional: a base that will not resolve — a
# clone shallower than the caller expected, a pull request with no merge commit to take a
# first parent from — makes every `git diff` empty, which reads exactly like "nothing here
# renders differently". The suite would then be skipped on the changes it exists for, and
# the run would be green.
if ! git rev-parse --verify --quiet "${base}^{commit}" > /dev/null; then
  echo "▸ Cannot resolve '${base}', so this cannot tell what changed — rendering it to be sure."

  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "needed=true" >> "${GITHUB_OUTPUT}"
  fi

  exit 0
fi

# What cannot reach a rendered page, and the whole of it.
#
#   docs                  the specification, the ADRs, the deployment guides. Read by
#                         maintainers, built into nothing.
#   *.md                  every markdown file in the repository is one of those, plus
#                         README and CONTRIBUTING. Astro declares no content collection
#                         here and `apps/site` holds no markdown at all, so there is no
#                         path from any of them into a page. Re-check that the day a
#                         collection appears — it would make this line false in one commit.
#   .githooks             a maintainer's local commit hook.
#   LICENSE               the file, not the footer line naming it.
#   .github/workflows/commit-lint.yml   the other pipeline, which builds nothing.
#
# Everything else renders until proven otherwise, and proving otherwise means adding a line
# here with the argument on it. The bar is deliberately higher than the old list's: this
# file is now about what a check *cannot* see, so an entry that is merely probably inert
# does not belong on it.
#
# `git diff <base> HEAD` compares two trees directly and needs no history between them,
# which is what lets this run in the shallow clone Actions checks out.
matched="$(
  git diff --name-only "${base}" HEAD -- . \
    ':(exclude)docs' \
    ':(exclude)*.md' \
    ':(exclude).githooks' \
    ':(exclude)LICENSE' \
    ':(exclude).github/workflows/commit-lint.yml'
)"

if [ -n "${matched}" ]; then
  needed=true
  echo "▸ This change has to be rendered. It touches:"
  # Printed rather than counted: a run that says "yes" without saying why is a run somebody
  # widens the exclusions to silence. Capped, because "yes" is the common answer now and a
  # large refactor would otherwise bury the rest of the log under its own file list.
  echo "${matched}" | head -20 | sed 's/^/    /'
  over="$(( $(echo "${matched}" | wc -l) - 20 ))"

  if [ "${over}" -gt 0 ]; then
    echo "    …and ${over} more"
  fi
else
  needed=false
  echo "▸ Documentation only — nothing here reaches a rendered page."
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "needed=${needed}" >> "${GITHUB_OUTPUT}"
fi
