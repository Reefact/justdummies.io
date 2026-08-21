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

    That rejection is why this script asks GitHub the same question before it tags anything,
    instead of letting CI ask it first. `verify-tag` can only refuse a tag that already exists on
    the remote, and undoing one means deleting it on both sides by hand. The question is the one
    `scripts/check-release-tag.sh` asks of a tag — which merged pull requests produced this
    commit, and is exactly one of them titled `ci: prepare <tag>` — asked here of `HEAD`, which is
    the commit the tag is about to be put on. It needs `gh` on PATH and authenticated; without
    one the check cannot be made, and this stops rather than tagging blind.

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

# `gh` is not optional here. The check below — that HEAD is the merge commit of the merged
# `ci: prepare <tag>` pull request — is the one property CI rejects a tag on, and asking GitHub
# is the only way to answer it. Skipping it whenever `gh` happens to be absent would mean the
# answer arrives from `verify-tag` instead, with the tag already on the remote, which is the
# whole situation this check exists to avoid.
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Fail "gh is not on PATH, so the 'ci: prepare <tag>' pull request cannot be checked - and that is the one thing CI's verify-tag job refuses a release tag for, by which point the tag is on the remote and has to be deleted from both sides by hand. Install the GitHub CLI and run 'gh auth login', or tag by hand with the commands in docs/for-maintainers/deployment-en.md, step 7."
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

    # ADR-0021's rule, asked here rather than discovered from CI. The fast-forward above is what
    # walks into the gap that record describes: anything that reached main between the
    # `ci: prepare <tag>` pull request merging and this run — a second pull request, a Dependabot
    # auto-merge — has just been pulled in silently, so HEAD is that commit and not the one the
    # release note was reviewed against. The shape checked at the top of this script cannot see
    # it, because the tag's name is still perfectly well formed.
    #
    # Deliberately the same question `scripts/check-release-tag.sh` asks, in the same terms, so
    # the two cannot disagree about what a good tag is: which merged pull requests produced this
    # commit, and is exactly one of them titled for this tag? Asked of HEAD rather than of a tag,
    # since the tag does not exist yet. Looked up by commit rather than by searching titles, for
    # the reason that script gives — GitHub's commit-to-PR association is exact and immediate
    # once the commit is on the default branch, where a title search is fuzzy and briefly
    # unindexed.
    $prTitle = "ci: prepare $Tag"

    # `{owner}` and `{repo}` are gh's own placeholders, filled from origin — left literal because
    # PowerShell interpolates `$`, never braces. The output is joined back into one string first:
    # a native command hands PowerShell one array element per line, and ConvertFrom-Json reads a
    # whole document rather than a line at a time.
    $pullsJson = (gh api "repos/{owner}/{repo}/commits/$headSha/pulls" 2>$null) -join "`n"

    # $ErrorActionPreference does not cover native commands, so gh failing to reach GitHub — or
    # running unauthenticated — returns here quietly. $LASTEXITCODE is the only thing that says
    # so, and a lookup that never got an answer must not be read as an answer of "no such pull
    # request".
    if ($LASTEXITCODE -ne 0) {
        Fail "gh api repos/{owner}/{repo}/commits/$headSha/pulls failed. Run 'gh auth login' and try again - a lookup that never got an answer is not the same as a pull request that is not there."
    }

    # The shell script's `|| echo '[]'`: an empty body is no pull requests, not a parse error.
    if (-not $pullsJson) {
        $pullsJson = '[]'
    }

    # @() keeps a single match an array. A one-item pipeline unrolls to the item itself, and
    # .Count on a lone object answers a different question than the one being asked.
    $preparePrs = @(($pullsJson | ConvertFrom-Json) | Where-Object { $_.title -eq $prTitle -and $null -ne $_.merged_at })

    if ($preparePrs.Count -eq 0) {
        Fail "No merged pull request titled '$prTitle' produced HEAD ($headSha). A release tag's name is only trustworthy if the pull request that chose it exists, merged, and is what the tag points at - that PR is where RELEASE_NOTES-en.md/fr.md were reviewed. CI's verify-tag job refuses the tag for exactly this, once it is already on the remote."
    }

    if ($preparePrs.Count -gt 1) {
        Fail "$($preparePrs.Count) merged pull requests are titled '$prTitle'. A release tag names exactly one pull request; this name was reused."
    }

    $mergeCommit = $preparePrs[0].merge_commit_sha

    if ($headSha -ne $mergeCommit) {
        Fail "HEAD is not the merge commit of the '$prTitle' pull request - HEAD is $headSha, that PR merged as $mergeCommit. Something else reached main between the PR merging and now, and tagging here would publish it unreviewed. Tag that merge commit by hand, or ask for a fresh 'ci: prepare' pull request for what is on main now."
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
