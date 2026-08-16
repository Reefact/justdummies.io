#!/usr/bin/env bash
# Say whether a change is one that only a rendered page can check.
#
# The browser suite is the slowest thing in the pipeline by a wide margin — a browser
# to fetch and install, then a full Playwright run — so `build.yml` does not put it on
# every pull request. What it put it on instead was nothing: `workflow_dispatch` and
# release tags only, which meant a change to the layout of either application reached
# main having never been rendered anywhere but a maintainer's machine. The parity
# check between the site and the playground (tests/browser/chrome-parity.spec.ts) is
# the case that made that untenable: it is an invariant across two applications, held
# by numbers no file states, and nothing outside a browser can see it break.
#
# So this decides, per pull request, from what the change actually touches. It is a
# script rather than a `paths:` block on the workflow's trigger because a `paths:`
# filter gates the *whole* workflow — the build would be skipped too, and a pull
# request with no checks at all is worse than a slow one — and a script rather than an
# inline `if:` expression because the list below is the interesting part and wants
# room to say why each entry is on it.
#
# Usage:
#   changes-need-a-browser.sh <base-ref>    # compares <base-ref> against HEAD
#
# `build.yml` passes HEAD^1 — on a pull request Actions checks out the merge commit,
# whose first parent is the base — so the comparison needs no network and no history
# beyond the two commits the checkout already has.
#
# Prints its verdict, and writes `needed=true|false` to $GITHUB_OUTPUT when running
# under Actions. Exit status is 0 either way: "no browser needed" is an answer, not a
# failure.
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "changes-need-a-browser: usage: $0 <base-ref>" >&2
  exit 2
fi

base="$1"

# Answer "yes" to a question this cannot answer, and say so.
#
# The failure being avoided is silent and one-directional: a base that will not resolve
# — a clone shallower than the caller expected, a pull request with no merge commit to
# take a first parent from — makes every `git diff` empty, which reads exactly like
# "nothing here renders differently". The suite would then be skipped on the changes it
# exists for, and the run would be green. Rendering something that did not need it
# costs two minutes; not rendering something that did is the whole defect this file was
# written to prevent.
if ! git rev-parse --verify --quiet "${base}^{commit}" > /dev/null; then
  echo "▸ Cannot resolve '${base}', so this cannot tell what changed — rendering it to be sure."

  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "needed=true" >> "${GITHUB_OUTPUT}"
  fi

  exit 0
fi

# What a browser can see and no on-disk check can.
#
#   apps/playground          the whole application: its markup, its stylesheet, its
#                            scripts. It renders nothing until a WebAssembly runtime
#                            has booted, so every claim about it is a browser claim.
#   apps/site/src/components the header, the brand, the footer, the language control,
#                            the hero that frames the playground — the furniture the
#                            parity check measures on both sides.
#   apps/site/src/layouts    Base.astro and Page.astro: the bar's measure and the
#                            page's, the two numbers the playground copies.
#   apps/site/src/pages      a page can lose a component, or gain one, without any
#                            component changing.
#   apps/site/src/styles     base.css, which the playground's app.css mirrors.
#   apps/site/src/i18n       the labels, which is not the obvious entry and is on this
#                            list because of a real one: 79c9ac4 fixed a heading that
#                            wrapped to two lines at 375px by dropping a question mark
#                            from a French string, and touched nothing else. §6.5 makes
#                            French the unfavourable case on purpose, and the header
#                            row is laid out from its right edge, so a label's width is
#                            a layout input here whatever it looks like in the diff.
#   packages/design-tokens   the one file both applications read. A token moves both.
#   tests/browser            the suite itself: a check nobody ran is a check nobody
#                            can trust, and that includes a new one.
#   playwright.config.ts     how the suite is served and which browser runs it.
#   scripts/check-in-browser.sh   how the suite is invoked at all.
#   scripts/generate-headers.mjs  the Content-Security-Policy, which is enforced by
#                            the browser and by nothing else in this pipeline.
#   wrangler.jsonc           how every page the suite visits is served. The suite talks
#                            to `wrangler dev`, not to a static server (ADR-0009), so
#                            this file decides what answers a request at all — the 404
#                            fallback the not-found checks rely on, the asset routing
#                            the playground's cold links rely on.
#   worker                   and the script that now sits in front of those requests.
#   .github/workflows/build.yml   so a change to this gate is itself gated.
#
# The list is a judgement, and it will be wrong about something eventually — which is
# why `workflow_dispatch` stays: a maintainer who wants a pull request rendered gets it
# rendered, whatever this file thinks. Widen the list when a browser catches something
# on main that it should have caught on the pull request, and say in the entry which
# failure put it there, the way the i18n line above does.
#
# `git diff <base> HEAD` compares two trees directly and needs no history between
# them, which is what lets this run in the shallow clone Actions checks out.
matched="$(
  git diff --name-only "${base}" HEAD -- \
    apps/playground \
    apps/site/src/components \
    apps/site/src/layouts \
    apps/site/src/pages \
    apps/site/src/styles \
    apps/site/src/i18n \
    packages/design-tokens \
    tests/browser \
    playwright.config.ts \
    scripts/check-in-browser.sh \
    scripts/generate-headers.mjs \
    wrangler.jsonc \
    worker \
    .github/workflows/build.yml
)"

if [ -n "${matched}" ]; then
  needed=true
  echo "▸ This change has to be rendered. It touches:"
  # Printed rather than counted: a run that says "yes" without saying why is a run
  # somebody widens the list to silence.
  echo "${matched}" | sed 's/^/    /'
else
  needed=false
  echo "▸ Nothing here renders differently — the browser suite has nothing to add."
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "needed=${needed}" >> "${GITHUB_OUTPUT}"
fi
