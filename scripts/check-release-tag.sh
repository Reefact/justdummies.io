#!/usr/bin/env bash
# Check that a release tag tells the truth about itself.
#
# A release tag carries a UTC timestamp as its name, and nothing reads that name back. It is
# therefore the one piece of this repository a maintainer can get wrong in silence — which is
# exactly what happened. The first eight release tags were named two hours ahead of the moment
# they were created, because the deployment guide gave a bash command and the maintainer runs
# PowerShell: `date` resolves there to the `Get-Date` alias, `-u` binds to `-UFormat`, and
# `-UFormat` formats the local clock while printing the `Z` as an ordinary letter. The command
# did not fail. It answered, with Paris time, under a suffix claiming UTC.
#
# So this script reads the tag back. It checks three things, and each one is a mistake that
# has already been made here:
#
#   * the tag is annotated — a lightweight tag carries no author and no date, so nothing below
#     could be checked at all;
#   * its message repeats its name — the convention, and a message that says anything else is
#     a tag made by a command other than the documented one;
#   * its name matches its own creation time in UTC — the two-hour lie, and any other clock
#     the name might have been read off.
#
# CI runs it on the tag being published, before writing the release page. Run it locally the
# moment you have tagged, with no argument: it takes the most recent release/* tag.
#
#   ./scripts/check-release-tag.sh
#   ./scripts/check-release-tag.sh release/2026-08-12T14-59-33Z
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
  echo "  It carries no author and no date, so nothing can check the moment it was made." >&2
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

# The moment the tag object was written, as an epoch. Git stores that instant plus the offset
# of the clock that produced it, so this is UTC whatever timezone the maintainer sits in — and
# comparing it against the name is the whole check.
made="$(git for-each-ref "refs/tags/${tag}" --format='%(taggerdate:unix)')"

# The name read as the UTC instant it claims to be. It is cut apart rather than handed to
# `date` whole: the name carries hyphens where a timestamp carries colons, because a colon is
# not legal in a git ref name, and `date -u -d 2026-08-12T14-59-33Z` answers "invalid date".
claimed="$(date -u -d "${stamp:0:10} ${stamp:11:2}:${stamp:14:2}:${stamp:17:2}" +%s)"

drift=$(( made - claimed ))
[ "${drift}" -lt 0 ] && drift=$(( -drift ))

# A minute, not a second. The name and the tag object are written by the same command, so the
# honest gap is zero or one second; a minute absorbs a slow machine without letting a clock
# read off the wrong timezone through — the smallest such lie is a half-hour offset.
if [ "${drift}" -gt 60 ]; then
  echo "check-release-tag: ${tag} is not named after the moment it was made." >&2
  echo "    the name claims: ${stamp}" >&2
  echo "    the tag was made: $(date -u -d "@${made}" +%Y-%m-%dT%H-%M-%SZ) (UTC)" >&2
  echo "    difference:       ${drift}s" >&2
  echo "  A name read off a local clock is the documented trap. Use the guide's command:" >&2
  echo "    \$tag = 'release/{0:yyyy-MM-dd}T{0:HH-mm-ss}Z' -f [DateTime]::UtcNow   (PowerShell)" >&2
  echo "    tag=\"release/\$(date -u +%Y-%m-%dT%H-%M-%SZ)\"                          (bash)" >&2
  exit 1
fi

echo "  ${tag}  annotated, message matches its name, made ${drift}s from the time it claims."
