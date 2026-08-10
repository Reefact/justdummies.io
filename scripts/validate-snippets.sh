#!/usr/bin/env bash
# Prove that every C# expression the site may publish compiles, and that the
# library's own analyzers have nothing to say about it.
#
# Two builds, and the second is the one people forget. Compiling the snippets and
# finding no diagnostic proves nothing on its own: "the snippets are clean" and "the
# analyzers never ran" produce exactly the same silence. So a second project holds
# expressions that must be rejected, and this script fails if any of them is
# accepted.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
snippets="${root}/tools/snippet-validation/JustDummies.SnippetValidation.csproj"
guard="${root}/tools/snippet-guard/JustDummies.SnippetGuard.csproj"

# The rules the guard must provoke. Adding an entry here without adding the
# expression that triggers it fails the run, which is the intended direction.
EXPECTED_DIAGNOSTICS="JD005 JD015 JD023 JD024"

echo "▸ Compiling the published snippets"
if ! dotnet build "${snippets}" --configuration Release --nologo --verbosity quiet; then
  echo >&2
  echo "validate-snippets: a snippet does not compile, or the library diagnoses it." >&2
  echo "  Either way it cannot be published: a reader would paste it." >&2
  exit 1
fi
echo "  no diagnostic"

echo "▸ Checking the analyzers are actually running"
guard_log="$(mktemp)"
trap 'rm -f "${guard_log}"' EXIT

# This build is expected to fail; its failure is the assertion.
if dotnet build "${guard}" --configuration Release --nologo --verbosity quiet > "${guard_log}" 2>&1; then
  echo >&2
  echo "validate-snippets: the guard project compiled, and it must not." >&2
  echo "  Every expression in it is one the analyzers are supposed to reject, so a" >&2
  echo "  clean build means they are not running — and the check above proved nothing." >&2
  exit 1
fi

missing=""
for rule in ${EXPECTED_DIAGNOSTICS}; do
  # grep -c rather than -q: the quiet form closes the pipe under whatever feeds it.
  found="$(grep -c "error ${rule}" "${guard_log}" || true)"
  if [ "${found}" -eq 0 ]; then
    missing="${missing} ${rule}"
  fi
done

if [ -n "${missing}" ]; then
  echo >&2
  echo "validate-snippets: the guard failed, but not for every expected reason." >&2
  echo "  Not reported:${missing}" >&2
  echo "  A rule that stopped firing is a rule the snippets are no longer held to." >&2
  exit 1
fi

echo "  reported:${EXPECTED_DIAGNOSTICS// / }"
echo
echo "▸ Snippets are publishable."
