#!/usr/bin/env bash
# Emit ONE release's product-facing note, read verbatim from RELEASE_NOTES-en.md — a
# hand-drafted rewrite of what changed, reviewed by a human before the tag that names it
# is ever pushed (see the release-notes skill).
#
# This deliberately does NOT derive anything from `git log` or the pull requests a release
# embarks: a PR title is a record for a reviewer of that one diff, not an announcement for
# someone deciding whether to look at what's new on the site, and mixing the two is exactly
# what `--generate-notes` used to produce — see ADR-0017.
#
# Usage: scripts/release-notes.sh <tag>
#   Emits Markdown on stdout: the "## <tag> ..." section of RELEASE_NOTES-en.md matching
#   <tag> exactly.
#
#   Refuses (exit 1) rather than emitting a fallback when RELEASE_NOTES-en.md, or the
#   section for this tag, does not exist: an untagged release is the wrong moment to
#   discover that nobody wrote what it actually contains.
set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "$1" ]; then
  echo "usage: scripts/release-notes.sh <tag>" >&2
  exit 2
fi
tag="$1"

case "${tag}" in
  release/*) ;;
  *)
    echo "error: '${tag}' is not a release tag; expected release/<UTC timestamp>" >&2
    exit 2
    ;;
esac

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
notes_file="${root}/RELEASE_NOTES-en.md"

if [ ! -f "${notes_file}" ]; then
  echo "error: ${notes_file} does not exist — write this release's notes (see the release-notes skill) before tagging" >&2
  exit 1
fi

# Escape the tag for use as a literal in an ERE: it is data (a git ref name), not a
# pattern, and both '.' and '-' are meaningful in a regex.
tag_pattern="$(printf '%s' "${tag}" | sed 's/[.[\*^$/-]/\\&/g')"

# The tag's own section: from its "## <tag>" heading (word-boundary after it, so one tag
# can never accidentally match another's heading) up to the next "## " heading or EOF.
notes="$(awk -v heading="^## ${tag_pattern}([[:space:]]|\$)" '
  $0 ~ heading { in_section = 1; print; next }
  in_section && /^## / { exit }
  in_section { print }
' "${notes_file}")"

if [ -z "${notes}" ]; then
  echo "error: ${notes_file} has no '## ${tag}' section — write it (see the release-notes skill) before tagging" >&2
  exit 1
fi

printf '%s\n' "${notes}"
