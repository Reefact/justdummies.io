#!/usr/bin/env bash
# Stamp the artefact with what it is: dist/version.json.
#
# It answers one question the deployment could not answer about itself — which
# release is live. ADR-0001 makes a release/* tag the unit of publication, and
# Cloudflare's deployment list reports times, so before this the only way to match
# what a visitor is being served against a commit was to read a clock.
#
# Written by the BUILD, from git, not by the deploy job. The deploy job publishes
# the artefact it downloads and never rebuilds, precisely so that nothing reaches
# production unverified; a file written after verification would be the one byte in
# the upload no check had ever seen. Generating it here means verify-output.sh
# asserts it, and the deployment publishes exactly what was checked.
#
# Every build produces one, not just a release build. A file that exists only
# sometimes is a file every reader has to test for, and `release: null` says "this
# is not a release" more usefully than a 404 does.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist="${root}/dist"

if [ ! -d "${dist}" ]; then
  echo "generate-version: no dist/ to stamp. This runs after the site is built." >&2
  exit 1
fi

# --points-at rather than `git describe`: a release is the tag on this exact commit,
# never the nearest one behind it. `describe` would label a commit that came after
# release/…Z with that release's name, which is the opposite of the fact this file
# exists to state. Two release tags on one commit is a mistake, and taking the first
# reports it rather than inventing a merged name.
release="$(git -C "${root}" tag --points-at HEAD 2> /dev/null | grep '^release/' | head -1 || true)"
commit="$(git -C "${root}" rev-parse HEAD 2> /dev/null || true)"

# Second source, because the first is not guaranteed. CI checks a tag out as a
# detached HEAD, and whether the checkout also leaves a local tag ref behind is the
# checkout action's business, not a promise the build can rely on. Without this, a
# release build on a tagless checkout stamps `release: null` and says nothing — the
# stamp would be silently wrong on exactly the deployment it exists for.
#
# GITHUB_REF_NAME states the ref the run was triggered for, which is the fact wanted.
ci_release=""
case "${GITHUB_REF_TYPE:-}:${GITHUB_REF_NAME:-}" in
  tag:release/*) ci_release="${GITHUB_REF_NAME}" ;;
esac

if [ -z "${release}" ] && [ -n "${ci_release}" ]; then
  release="${ci_release}"
  echo "  ! no local tag ref, so the release name comes from GITHUB_REF_NAME" >&2
elif [ -n "${release}" ] && [ -n "${ci_release}" ] && [ "${release}" != "${ci_release}" ]; then
  # Two sources naming different releases means the checkout is not at the commit the
  # run is for. Guessing either way would publish a stamp that misreports what is
  # live, which is the one outcome worse than having no stamp.
  echo "generate-version: HEAD carries ${release}, but this run is for ${ci_release}." >&2
  echo "  Refusing to guess which one is being published." >&2
  exit 1
fi

# A checkout with no git — an exported tarball — still builds and still deploys.
# Losing the stamp is worth a warning, not a failed build: the artefact is not wrong,
# it just cannot say what it came from.
if [ -z "${commit}" ]; then
  echo "  ! no git metadata here, so version.json cannot name a commit" >&2
fi

json_or_null() {
  if [ -z "$1" ]; then printf 'null'; else printf '"%s"' "$1"; fi
}

cat > "${dist}/version.json" <<JSON
{
  "release": $(json_or_null "${release}"),
  "commit": $(json_or_null "${commit}"),
  "built": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

echo "  dist/version.json  (release: ${release:-none}, commit: ${commit:0:7})"
