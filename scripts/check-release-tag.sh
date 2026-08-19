#!/usr/bin/env bash
# Check that a release tag names something that is actually about to be published.
#
# The tag's name is decided before the tag exists: the maintainer asks for a release, an agent
# drafts RELEASE_NOTES-en.md/fr.md, titles the "Unreleased" section with the tag it computes at
# that moment, and opens a PR named `ci: prepare <tag>`. The maintainer reviews, merges, then
# runs the tag commands themselves — often minutes later. Checking the tag object's own creation
# clock does not survive that gap: release/2026-08-19T11-50-00Z was named at 11:50:00 and the tag
# was made at 11:54:40, a 280-second difference an honest release under this process produces
# routinely. A clock check would refuse every release this process makes.
#
# What actually has to hold is narrower, and does not care how much time passed: the commit the
# tag points at must be exactly the merge commit of the PR that chose its name, and nothing else.
# If another commit reaches main between that PR merging and the maintainer tagging — a second
# PR, a Dependabot auto-merge — a `git pull` before tagging picks it up silently, and the tag
# would publish work nobody reviewed as part of this release. That is the one thing this script
# refuses, by asking GitHub which merged pull request produced the commit the tag names.
#
# It also keeps two checks unrelated to timing:
#
#   * the tag is annotated — a lightweight tag carries no message, so there is nothing to
#     publish as the release's title;
#   * its message repeats its name — the convention, and a message that says anything else is a
#     tag made by a command other than the documented one.
#
# CI runs it in the `verify-tag` job of build.yml, before build and deploy even start — a tag
# that fails here blocks the release outright, rather than being cleaned up after the fact. It
# needs `gh` authenticated (GH_TOKEN) to look up the pull request.
#
#   ./scripts/check-release-tag.sh
#   ./scripts/check-release-tag.sh release/2026-08-19T11-50-00Z
set -euo pipefail

tag="${1:-}"

if [ -z "${tag}" ]; then
  tag="$(git for-each-ref refs/tags/release/ --sort=-creatordate --count=1 --format='%(refname:short)')"
fi

if [ -z "${tag}" ]; then
  echo "check-release-tag: this clone holds no release/* tag." >&2
  exit 1
fi

if ! git rev-parse --verify --quiet "refs/tags/${tag}" > /dev/null; then
  echo "check-release-tag: no tag named ${tag}." >&2
  exit 1
fi

# `%(objecttype)` on a ref is the type of the object it points at: `tag` for an annotated tag,
# `commit` for a lightweight one.
if [ "$(git for-each-ref "refs/tags/${tag}" --format='%(objecttype)')" != "tag" ]; then
  echo "check-release-tag: ${tag} is a lightweight tag." >&2
  echo "  It carries no message, so there is nothing to publish as the release's title." >&2
  echo "  Delete it and tag again with -a, as the deployment guide's command does." >&2
  exit 1
fi

subject="$(git for-each-ref "refs/tags/${tag}" --format='%(contents:subject)')"

if [ "${subject}" != "${tag}" ]; then
  echo "check-release-tag: ${tag} carries a message that is not its name." >&2
  echo "    message: ${subject}" >&2
  echo "  The convention is \`git tag -a \$tag -m \$tag\`, one variable used twice. The release" >&2
  echo "  page takes its title from this message, and its notes already list what went out." >&2
  exit 1
fi

stamp="${tag#release/}"

if ! printf '%s' "${stamp}" | grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}-[0-9]{2}-[0-9]{2}Z$'; then
  echo "check-release-tag: ${tag} is not named after a UTC timestamp." >&2
  echo "  Expected release/YYYY-MM-DDTHH-MM-SSZ, read ${stamp}." >&2
  exit 1
fi

# The commit this tag actually points at.
tag_commit="$(git rev-parse "refs/tags/${tag}^{commit}")"

# The one PR allowed to have named this tag, and the commit its merge produced. Looked up by the
# commit rather than by searching PR titles: GitHub's commit-to-PR association is exact and
# immediate once the commit reaches the default branch, where a title search can be fuzzy and
# briefly unindexed.
pr_title="ci: prepare ${tag}"
prs_json="$(gh api "repos/{owner}/{repo}/commits/${tag_commit}/pulls" 2> /dev/null || echo '[]')"
matches="$(printf '%s' "${prs_json}" | jq --arg title "${pr_title}" '[.[] | select(.title == $title and .merged_at != null)]')"
match_count="$(printf '%s' "${matches}" | jq 'length')"

if [ "${match_count}" -eq 0 ]; then
  echo "check-release-tag: no merged pull request titled '${pr_title}' produced ${tag_commit}." >&2
  echo "  A release tag's name is only trustworthy if the PR that chose it exists, merged, and" >&2
  echo "  is what the tag actually points at — that PR is where RELEASE_NOTES-en.md/fr.md were" >&2
  echo "  reviewed." >&2
  exit 1
fi

if [ "${match_count}" -gt 1 ]; then
  echo "check-release-tag: ${match_count} merged pull requests are titled '${pr_title}'." >&2
  echo "  A release tag names exactly one PR; this name was reused." >&2
  exit 1
fi

merge_commit="$(printf '%s' "${matches}" | jq -r '.[0].merge_commit_sha')"

if [ "${tag_commit}" != "${merge_commit}" ]; then
  echo "check-release-tag: ${tag} does not point at '${pr_title}''s own merge commit." >&2
  echo "    tag points at:  ${tag_commit}" >&2
  echo "    PR merged as:   ${merge_commit}" >&2
  echo "  Something else reached main between that PR merging and this tag being made — a" >&2
  echo "  second PR, a Dependabot auto-merge — and this tag would publish it unreviewed." >&2
  echo "  Retag the PR's own merge commit, or open a fresh 'ci: prepare' PR for what's on main" >&2
  echo "  now." >&2
  exit 1
fi

echo "  ${tag}  annotated, message matches its name, points at '${pr_title}''s own merge commit."
