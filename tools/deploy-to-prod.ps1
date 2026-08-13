<#
.SYNOPSIS
    Cuts and pushes the release tag that publishes justdummies.io.

.DESCRIPTION
    A release tag is what publishes (ADR-0001) — pushing to `main` only builds and verifies.
    This is that tag, made the one way this repository accepts: annotated, on the commit
    `origin/main` is actually at, named after the UTC instant it was made, with a message that
    repeats the name exactly.

    The name comes from [DateTime]::UtcNow rather than `Get-Date -UFormat`, on purpose:
    PowerShell's `-UFormat` formats the *local* clock while still printing the `Z` UTC suffix,
    which is how this repository's first eight release tags ended up lying about their own
    time by two hours. `scripts/check-release-tag.sh` exists to catch exactly that, and CI runs
    it on every tag before writing the release page — this script exists so the check has
    nothing to catch.

    Only the tag itself is pushed, never `--tags`: this clone may hold other tags (one made on a
    branch and never meant to ship, for instance), and `--tags` would publish all of them.

.PARAMETER Force
    Skip the confirmation prompt. For scripted use — an interactive run should see what it is
    about to publish.

.PARAMETER DryRun
    Print the tag that would be made and pushed, and stop there.

.EXAMPLE
    ./tools/deploy-to-prod.ps1

.EXAMPLE
    ./tools/deploy-to-prod.ps1 -DryRun
#>
[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Fail([string]$Message) {
    Write-Error $Message
    exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail "git is not on PATH."
}

# Resolved from the script's own location, not the caller's working directory — this must
# work the same whether it is run from inside the repo or invoked by a full path from
# anywhere else.
$repoRoot = (git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) {
    Fail "tools/deploy-to-prod.ps1 is not inside a git repository."
}
Push-Location $repoRoot
try {
    $remoteUrl = git remote get-url origin 2>$null
    if ($remoteUrl -notmatch 'justdummies\.io') {
        Fail "origin ($remoteUrl) does not look like justdummies.io — refusing to tag."
    }

    if (git status --porcelain) {
        Fail "Working tree is not clean. Commit, stash or discard changes first — a release tag names a commit, and an uncommitted change next to it is easy to mistake for part of the release."
    }

    Write-Host "Fetching origin/main..." -ForegroundColor DarkGray
    git fetch origin main --quiet
    if ($LASTEXITCODE -ne 0) { Fail "git fetch origin main failed." }

    $currentBranch = git rev-parse --abbrev-ref HEAD
    if ($currentBranch -ne 'main') {
        Write-Host "Switching from '$currentBranch' to 'main'..." -ForegroundColor DarkGray
        git checkout main --quiet
        if ($LASTEXITCODE -ne 0) { Fail "git checkout main failed." }
    }

    # Fast-forward only: a merge commit here would tag something `main` never actually reached
    # by a push, and a failure is the honest outcome when local and origin have diverged.
    git merge --ff-only origin/main --quiet
    if ($LASTEXITCODE -ne 0) {
        Fail "main could not fast-forward to origin/main. Resolve that by hand, then re-run."
    }

    # Fast-forwarding only pulls origin/main in — it says nothing about local commits origin
    # does not have yet. Tagging those anyway would push a tag CI can never check out, since
    # actions/checkout only sees what is already on the remote.
    $headSha = git rev-parse HEAD
    $originMainSha = git rev-parse origin/main
    if ($headSha -ne $originMainSha) {
        Fail "main is ahead of origin/main. Push main first (git push origin main), then re-run."
    }

    # UTC read once and reused for both the tag's name and its message, so the two cannot
    # disagree — the whole point being that the message is checked against the name later.
    $utcNow = [DateTime]::UtcNow
    $tag = 'release/{0:yyyy-MM-dd}T{0:HH-mm-ss}Z' -f $utcNow
    $commit = git rev-parse --short HEAD
    $commitSubject = git log -1 --format=%s

    Write-Host ""
    Write-Host "  tag      $tag" -ForegroundColor Cyan
    Write-Host "  commit   $commit — $commitSubject"
    Write-Host "  remote   $remoteUrl"
    Write-Host ""

    if ($DryRun) {
        Write-Host "Dry run: nothing tagged, nothing pushed." -ForegroundColor Yellow
        return
    }

    if (-not $Force) {
        $answer = Read-Host "Push this tag and publish it to production? [y/N]"
        if ($answer -notmatch '^[Yy]') {
            Write-Host "Aborted — nothing tagged." -ForegroundColor Yellow
            return
        }
    }

    git tag -a $tag -m $tag
    if ($LASTEXITCODE -ne 0) { Fail "git tag failed." }

    git push origin $tag
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Push failed. Deleting the local tag so a re-run does not collide with it."
        git tag -d $tag | Out-Null
        Fail "git push origin $tag failed."
    }

    Write-Host ""
    Write-Host "Pushed $tag — CI will build, verify, render it in a browser, then deploy." -ForegroundColor Green
    Write-Host "Actions: https://github.com/Reefact/justdummies.io/actions"
}
finally {
    Pop-Location
}
