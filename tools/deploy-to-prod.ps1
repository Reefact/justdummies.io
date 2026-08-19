<#
.SYNOPSIS
    Pushes the release tag a `ci: prepare <tag>` pull request already named, publishing
    justdummies.io.

.DESCRIPTION
    A release tag is what publishes (ADR-0001) — pushing to `main` only builds and verifies.
    This is that tag, made the one way this repository accepts: annotated, on the commit
    `origin/main` is actually at, with a message that repeats the name exactly.

    Since ADR-0021, the tag's name is not computed here. It is decided ahead of time by whoever
    prepares the release — reading the commits since the previous tag, drafting
    RELEASE_NOTES-en.md/fr.md, and opening a pull request titled `ci: prepare <tag>` that carries
    the exact string. `Tag` below must be that PR's tag, copied verbatim: CI's `verify-tag` job
    refuses any tag that is not the merge commit of a pull request titled `ci: prepare <tag>` for
    that exact name, so a tag computed fresh here — from `[DateTime]::UtcNow` or otherwise — has
    no matching PR and is rejected before anything deploys.

    Only the tag itself is pushed, never `--tags`: this clone may hold other tags (one made on a
    branch and never meant to ship, for instance), and `--tags` would publish all of them.

.PARAMETER Tag
    The exact tag the merged `ci: prepare <tag>` pull request named — e.g.
    release/2026-08-19T11-50-00Z. Required; not computed by this script.

.PARAMETER Force
    Skip the confirmation prompt. For scripted use — an interactive run should see what it is
    about to publish.

.PARAMETER DryRun
    Print the tag that would be made and pushed, and stop there.

.EXAMPLE
    ./tools/deploy-to-prod.ps1 -Tag release/2026-08-19T11-50-00Z

.EXAMPLE
    ./tools/deploy-to-prod.ps1 -Tag release/2026-08-19T11-50-00Z -DryRun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Tag,
    [switch]$Force,
    [switch]$DryRun
)

if ($Tag -notmatch '^release/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$') {
    Write-Error "Tag '$Tag' is not shaped like release/YYYY-MM-DDTHH-MM-SSZ. Copy it verbatim from the 'ci: prepare <tag>' pull request — do not type it from memory."
    exit 1
}

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

    # $Tag came from the caller (the 'ci: prepare <tag>' PR), validated above — not computed
    # here. It is still what names both the tag and its message, so the two cannot disagree.
    $tag = $Tag
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
