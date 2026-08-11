# Putting the site online on Cloudflare Workers

*🇫🇷 [Version française](deployment-fr.md)*

This guide starts from nothing: no Cloudflare account, no knowledge of the platform. By the end,
`justdummies.io` will be served by Cloudflare and every push to `main` will publish
automatically.

**Allow about two hours**, much of which is waiting (DNS propagation, first downloads). Nothing is
irreversible before step 8.

---

## How to read this guide

Every step has the same shape:

> **Why** — what the step is for, in two lines.
> **Do** — the commands, ready to copy.
> **✅ Check** — a command that proves the step worked, with the output to expect.

**Where to type what.** Every block is labelled, and the label says which machine it runs on:
**`powershell`** blocks are typed on the **Windows** side, **`bash`** blocks on the **Ubuntu** side,
inside WSL. A single step sometimes moves from one to the other.

`wsl` is a **Windows** command: run from an Ubuntu shell it answers `wsl: not found` — not because it
is missing, but because it does not exist on that side. `exit` returns you to Windows.

**Never skip a check.** This platform has the unpleasant property of accepting wrong
configurations without saying anything: the site deploys, answers 200, and part of it does not
work. The checks exist for exactly that — each one corresponds to a real failure that, without it,
only shows up in production.

Steps 1 to 6 are done by hand. Step 7 automates what you have just done by hand. That order is
not negotiable: automating a deployment nobody has watched succeed means debugging two things at
once.

---

## Step 0 — Prerequisites

### 0.1 Choosing your terminal

This matters, and it is not cosmetic: **building the site relies on bash scripts**. `pnpm build`
calls `scripts/build-site.sh`, and every `scripts/*.sh` carries the `#!/usr/bin/env bash` shebang.
All of them use `set -euo pipefail`, and some use process substitution `< <(...)` or `compgen`.
Neither `cmd.exe` nor PowerShell can run them — this is not a matter of preference, those constructs
have no equivalent.

*(The `scripts/*.mjs` are Node and would run anywhere; it is the shell scripts that require bash,
and they are the ones `pnpm build` chains together.)*

| Command | cmd / PowerShell | Git Bash | WSL2 | macOS / Linux |
|---|---|---|---|---|
| `pnpm install` | ✅ | ✅ | ✅ | ✅ |
| `pnpm dev`, `pnpm check` | ✅ | ✅ | ✅ | ✅ |
| `pnpm serve`, `preview`, `run deploy` | ✅ | ✅ | ✅ | ✅ |
| `pnpm build:playground` | ✅ | ✅ | ✅ | ✅ |
| **`pnpm build`** | ❌ | ⚠️ | ✅ | ✅ |
| `./scripts/*.sh` directly | ❌ | ✅ | ✅ | ✅ |

**On Windows, use WSL2.** It is exactly the CI environment (`runs-on: ubuntu-latest`): same
system, same bash, same scripts. "It works on my machine" then means something.

In PowerShell, once:

```powershell
wsl --install -d Ubuntu
```

Reboot if the installer asks, then open the **Ubuntu** terminal — that is where everything happens
from now on.

> ⚠️ **The most expensive trap.** Clone the repository into the Linux filesystem
> (`~/dev/justdummies.io`), **never** under `/mnt/c/...`. Every file access crossing the
> Windows↔Linux boundary pays a fixed cost, and this build writes a great many small ones — the
> .NET runtime alone accounts for over a hundred under `_framework`. On `/mnt/c`, a thirty-second
> build takes several minutes.

*On macOS or Linux there is nothing to do: your terminal already qualifies.*

If you really must stay on native Windows, pnpm can delegate to Git Bash:

```powershell
pnpm config set scriptShell "C:\Program Files\Git\bin\bash.exe"
```

That works, but you then build in a different bash from CI's, and Git Bash does not ship every
tool the scripts call. It is a fallback, not a choice.

### 0.2 The toolchain

Three tools, and **the repository pins the versions itself** — you do not choose them, you let them
be read:

| Tool | Version | Pinned by |
|---|---|---|
| Node | 22 | `.nvmrc` |
| pnpm | 10.33.0 | the `packageManager` field of `package.json` |
| .NET SDK | 10.0.100 | `global.json` |

**The order matters, and it is not the one you would guess.** `corepack` ships *with* Node, so it
does not exist before it; and `nvm install` reads `.nvmrc`, which lives *inside* the repository, so
it has nothing to read before the clone. Hence: system packages → nvm → .NET SDK → clone →
Node → pnpm.

Each block ends with its own check. **Do not move to the next one without it**: a step missed here
only shows up three commands later, under a message that does not name it.

#### a. The system packages

Everything else depends on them, including this guide's own commands: `curl` downloads nvm **and**
the SDK, `git` fetches the repository, and the .NET SDK refuses to start without ICU. A fresh WSL
image does not necessarily have them all.

```bash
sudo apt-get update
sudo apt-get install -y curl git unzip libicu-dev
```

✅ **Check:** `curl --version | head -1` and `git --version` both answer. ICU has no check of its
own here — the SDK's check, in **c**, is what proves it.

> Without ICU, `dotnet` does not start *at all*: it stops on *"Couldn't find a valid ICU package
> installed on the system"*, with a stack trace that nowhere says the answer is a package to
> install.
>
> ⚠️ **The error message names two packages, neither of which exists on Ubuntu.** It advises
> *"install libicu (or icu-libs)"*: `apt-get install libicu` answers
> `E: Unable to locate package libicu`, and `icu-libs` is Alpine's name. Copying the name out of the
> error is the first thing anyone tries, and it fails.
>
> Hence **`libicu-dev`**: it is the only stable name, and it depends on the right runtime package
> (`Depends: libicu74` on Ubuntu 24.04). The runtime alone is called `libicu74` — with a number that
> changes with every release of the distribution. If you want the strict minimum, `libicu74` is
> enough and avoids the `icu-devtools` and `libc6-dev` that `libicu-dev` drags in; at the price of a
> name to correct at the next Ubuntu jump.
>
> And do **not** take the other escape the error offers, `System.Globalization.Invariant`: it starts
> the SDK with no globalization support, so it changes the build's behaviour instead of fixing the
> machine.

#### b. nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
exec "$SHELL"      # nvm adds itself to ~/.bashrc: without the reload it does not exist yet
```

✅ **Check:** `command -v nvm` prints `nvm`.

> `which nvm` will fail, and that failure means nothing: nvm is a **shell function**, not an
> executable. `command -v` is what answers correctly.

#### c. The .NET SDK

`dotnet-install.sh` downloads the SDK and **installs no system dependencies** — which is why ICU
came in **a**, and not here.

```bash
curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0
echo 'export PATH="$HOME/.dotnet:$PATH"' >> ~/.bashrc
exec "$SHELL"
```

✅ **Check:** `dotnet --version` prints `10.0.1xx`.

> If a *"Couldn't find…"* appears anyway, it names the library that is missing: same remedy,
> `sudo apt-get install -y <name>`.

#### d. The repository, on the Linux disk

From Ubuntu you can see **two** filesystems, and the guide asked you to pick one without saying how
you get there:

| Path | What it is | Speed |
|---|---|---|
| `~`, that is `/home/<you>` | the **Linux** disk | fast |
| `/mnt/c/...` | your **Windows** disk, mounted inside Linux | slow to cross |

The Ubuntu shell often starts in `/mnt/c/Users/<you>`, so on the wrong side. **There is nothing to
do about that**: what decides is the destination written in the command, not where you run it from.
`~/dev/justdummies.io` lands on the Linux disk even when typed from `/mnt/c`.

```bash
git clone https://github.com/Reefact/justdummies.io.git ~/dev/justdummies.io
cd ~/dev/justdummies.io
```

✅ **Check:** `pwd` prints `/home/<you>/dev/justdummies.io`, with no `/mnt/`.

> **Already cloned on the wrong side?** Move it rather than cloning again, or you keep two copies:
>
> ```bash
> mkdir -p ~/dev
> mv /mnt/c/path/to/justdummies.io ~/dev/
> cd ~/dev/justdummies.io
> ```
>
> If `node_modules/` was installed over there, delete it after the move and run `pnpm install`
> again. pnpm's internal links are relative and survive the move, but the launchers in
> `node_modules/.bin/` bake the repository's **absolute** path into their `NODE_PATH`, and so does
> `.pnpm-workspace-state-v1.json`. Moved, the tree keeps paths that no longer exist.
>
> ```bash
> rm -rf node_modules dist && pnpm install
> ```

> **From here on, every command in this guide runs from the repository root.** The `scripts/…` and
> `dist/…` paths depend on it, and so does `pnpm`.

#### e. Node, then pnpm — read from inside the repository

```bash
nvm install        # reads .nvmrc → Node 22
corepack enable    # corepack comes with Node, so after it
```

✅ **Check:** `node --version` prints `v22.x.x`.

#### f. The commit-message hook

```bash
git config core.hooksPath .githooks    # once per clone
```

### ✅ Checking the prerequisites

From the repository root:

```bash
node --version
pnpm --version          # must be run FROM the repository: see the table below
dotnet --version
git --version
bash --version | head -1
pwd | grep -q '^/mnt/' \
  && echo '⚠️  repository on the Windows disk — the build will be very slow' \
  || echo '✅ repository on the native filesystem'
```

Expected:

```
v22.x.x
10.33.0
10.0.1xx
git version 2.x.x
GNU bash, version 5.x.x(1)-release ...
✅ repository on the native filesystem
```

The three possible discrepancies, and their cause:

| Discrepancy | Cause |
|---|---|
| `nvm: command not found` | The shell was not reloaded after installing: `exec "$SHELL"`. |
| `pnpm --version` ≠ 10.33.0 | Command run outside the repository. The `packageManager` field pins the version, and corepack only reads it from here. |
| Node 20 or 24 | `pnpm install` will refuse, on the `engines` field. That is deliberate, not a bug to work around. |

---

## The vocabulary, in five words

| Word | What it is |
|---|---|
| **Worker** | A unit of deployment at Cloudflare. It can hold code, files, or — as here — only files. |
| **Static assets** | The files in `dist/`, served directly by Cloudflare's network. Those requests are **free and unlimited**. |
| **wrangler** | Cloudflare's command-line tool. Already among the repository's dependencies, pinned — never `npx wrangler@latest`. |
| **Version** | An upload. It exists, it has a URL, and it is not in production until it is promoted there. |
| **Deployment** | The version the domain actually serves. |

The most important point, and the one that explains half the repository's configuration:

> **This site has no server script.** `wrangler.jsonc` deliberately has no `main` field. Requests
> served as assets are free and unlimited; requests that invoke a script count against a quota,
> and on the free plan exhausting that quota answers an error rather than falling back to the
> assets. That is the difference between a site that degrades and a site that goes down.

The full reasoning is in [`design/decisions-inventory.md`](../design/decisions-inventory.md), entries
**A1** (why Workers rather than Pages) and **A6** (why no script).

---

## What the repository already does for you

None of this needs writing:

| File | Role |
|---|---|
| `wrangler.jsonc` | The Worker's name (`justdummies-site`), the directory to publish (`dist/`), the handling of 404s. |
| `dist/_headers` *(generated)* | The Content Security Policy and the cache rules. Regenerated by `scripts/generate-headers.mjs` on every build, because the policy has to name a hash only the build knows. |
| `apps/site/public/_redirects` | The rewrite that makes the playground's routes survive a cold request. |
| `apps/site/public/.assetsignore` | What must **never** go up in the upload. |
| `scripts/verify-output.sh` | Seventeen assertions on the artefact's shape, read from disk. Several exist only because their failure is invisible until a visitor meets it. |
| `scripts/check-served-headers.sh` | Six assertions on what the runtime **actually serves**: it starts the engine and asks it. A rules file can be present, well formed, and ignored — which is exactly what happened here. |
| `.github/workflows/build.yml` | Builds, verifies, then publishes — as soon as the credentials exist. |

On Workers, `_headers` and `_redirects` **are not served as files**: they are parsed, and their
rules are applied to responses. Excluding them from the upload would therefore not make them
private — they are not — but would make them *absent*, and the site would lose its security policy
while every page kept answering 200. That is what `.assetsignore` says, and what
`verify-output.sh` checks.

---

## Step 1 — Build the artefact

**Why** — Everything else starts from `dist/`. This step touches no network and needs no account:
it is the right place to discover a problem.

**Do**

```bash
pnpm install
pnpm build 2>&1 | tee /tmp/build.log
```

The first run is slow: it downloads the NuGet packages and compiles the playground.

### ✅ Check

```bash
tail -3 /tmp/build.log                                   # the conclusion
grep -c '  ✓' /tmp/build.log                             # passing assertions
grep '  ✗' /tmp/build.log || echo 'no failing assertion'
```

Expected:

```
▸ Artefact looks well formed.

▸ Ready: /home/…/justdummies.io/dist
17
no failing assertion
```

The number of assertions will grow with the repository; **what matters is the absence of `✗` and
the presence of the last line.** If `pnpm build` stops on `./scripts/build-site.sh: not found` or
a syntax error, re-read step 0.1: you are not in bash.

Then check the shape of what was produced:

```bash
ls -a dist/ | head -20
ls dist/playground/_framework/ | wc -l
```

`dist/` must contain `index.html`, `404.html`, `_headers`, `_redirects`, `.assetsignore`, `fr/`,
`_astro/` and `playground/`. `_framework` holds over a hundred — the exact number moves with every
playground change, so do not compare it against a figure written here: what matters is that it is
not empty.

---

## Step 2 — Serve the site the way Cloudflare will

**Why** — This is the highest-return step in the guide. `pnpm serve` is **not** a static file
server: it is the Workers runtime locally, which **parses `_headers` and `_redirects`** and
applies their rules. No other local server has any opinion about those two files, and they are
the ones carrying the security policy and the playground's routing.

**Do** — two commands, in this order, and the order matters:

```bash
scripts/check-served-headers.sh   # 1. the automatic check: starts its runtime, asks it, stops it
pnpm serve                        # 2. then the server, to browse and for the manual checks
```

The script first, because it needs nothing and answers in one shot.

> ⚠️ **Never both at once.** They both want port 8787: the script launched on top of a running
> `pnpm serve` questions the other server instead of its own, or fails to start. If `pnpm serve` is
> already running, stop it (`Ctrl+C`) before the script.

`pnpm serve` does not return: the terminal stays busy for as long as the server runs, and `Ctrl+C`
stops it. While it runs it prints its URL — **read it, do not assume it**: the port is 8787 when
free, 8788, 8789… otherwise. Open that URL in your Windows browser — WSL forwards the port for you.

The manual checks 2a to 2d therefore need **a second terminal**. That means a second window onto the
distribution already running — nothing to reinstall.

| How | What to do | Reliability |
|---|---|---|
| **From any tab** | open a tab, PowerShell included, and type `wsl -d Ubuntu` | ✅ always works |
| Start menu | launch the **Ubuntu** application again | ✅ |
| Windows Terminal profile | the `⌄` chevron beside the `+`, then **Ubuntu** | ⚠️ only if the profile exists |

> ⚠️ **`-d Ubuntu` is not decoration.** Bare `wsl` opens the **default** distribution, which is not
> necessarily yours: Docker Desktop, Rancher Desktop and tools like them install their own, often
> running as `root` and with the Windows drives mounted somewhere other than `/mnt/`. You then
> believe you are in Ubuntu while working in a system that is not the right one — and no command
> fails to tell you.
>
> ```powershell
> wsl -l -v          # the list; the star marks the default distribution
> ```
>
> To make Ubuntu that default: `wsl --set-default Ubuntu`.

✅ **Check, before anything else in that terminal:**

```bash
whoami      # your user, NOT root
pwd         # /home/<you>
```

A `root`, or a `pwd` that does not look like your home directory, means you are in another
distribution. Leave with `exit` and start again with `-d Ubuntu`. **Do not try to "fix" that
distribution**: its `/etc/wsl.conf` belongs to the tool that created it.

> **No Ubuntu in the chevron?** Windows Terminal discovers WSL distributions **at startup**. Opened
> before Ubuntu was installed, it never saw the new one: close it entirely — every window, not just
> the tab — and reopen it. To confirm the distribution is registered while you are there, from
> PowerShell: `wsl -l -v` should list `Ubuntu` at `VERSION 2`.

> ⚠️ **That second terminal starts in your home directory, not in the repository.** First command to
> type there, without which every check looks for `dist/` and `scripts/` where they are not:
>
> ```bash
> cd ~/dev/justdummies.io
> ```

You can also **not open a second terminal at all**: check 2 below covers all four of them and needs
nothing running alongside it. The manual ones are there to show what is being verified and to
diagnose a red line — not to validate the build.

### ✅ Check 2 — in a single command

It is the script above, and CI runs it on every build. Expected:

```
▸ Starting the runtime
  Parsed 1 valid redirect rule
  Parsed 5 valid header rules
▸ Asking http://localhost:8787          ← 8788, 8789… if 8787 was busy
  ✓ / is served with a content security policy
  ✓ /fr/ is served with a content security policy
  ✓ /playground/ is served with a content security policy
  ✓ a fingerprinted asset gets both its own cache rule and the global policy
  ✓ a cold link to a playground route answers 200
  ✓ the runtime compresses the WebAssembly payload (br: 3002102 → 1197764 bytes)
▸ The host serves what the artefact intends.
```

**This is the check to remember.** The four that follow do the same work by hand, and keep two
uses: understanding *what* the script verifies, and diagnosing when one of its lines turns `✗`.

### ✅ Check 2a — are the rules loaded?

Read the two lines wrangler prints on startup:

```
✨ Parsed 1 valid redirect rule.
✨ Parsed 5 valid header rules.
```

**`Parsed 0 valid redirect rules` is a failure, not information.** The site deploys perfectly
without its rules; they simply do not exist. If you read `invalid redirect rule`, wrangler's
message says precisely what is wrong.

### ✅ Check 2b — the six URLs that matter

In the second terminal:

```bash
B=http://localhost:8787       # the port pnpm serve printed
for u in / /fr/ /playground/ /playground/not-found /does-not-exist /fr/does-not-exist; do
  printf '%-26s %s\n' "$u" "$(curl -so /dev/null -w '%{http_code}' $B$u)"
done
```

Expected — **exactly** these codes:

```
/                          200
/fr/                       200
/playground/               200
/playground/not-found      200
/does-not-exist            404
/fr/does-not-exist         404
```

The fourth is the only surprising one, and the most important: a **307** or a **404** on that line
means the playground's rewrite is broken. See the box below.

### ✅ Check 2c — the right content, in the right language

```bash
B=http://localhost:8787       # the port pnpm serve printed
curl -sD - -o /dev/null $B/ | grep -i '^content-security-policy' | cut -c1-60
for u in / /fr/ /playground/ /does-not-exist /fr/does-not-exist; do
  printf '%-20s %s\n' "$u" "$(curl -s $B$u | grep -o '<title>[^<]*</title>')"
done
```

Expected:

```
content-security-policy: default-src 'self'; base-uri 'self'
/                    <title>JustDummies — Focused, fluent test values for .NET.</title>
/fr/                 <title>JustDummies — Des valeurs de test fluides et ciblées, pour .NET.</title>
/playground/         <title>Playground — JustDummies</title>
/does-not-exist      <title>Page not found — JustDummies</title>
/fr/does-not-exist   <title>Page introuvable — JustDummies</title>
```

The last two lines verify a deliberate subtlety: `not_found_handling` serves the **nearest**
`404.html`, so an invalid French URL answers in French.

### ✅ Check 2d — the .NET runtime is served as itself

```bash
B=http://localhost:8787       # the port pnpm serve printed
J=$(basename $(ls dist/playground/_framework/dotnet.*.js | head -1))
curl -so /dev/null -w '%{http_code} %{content_type} %{size_download} bytes\n' \
  "$B/playground/_framework/$J"
```

Expected — a real JavaScript file of some tens of kilobytes:

```
200 text/javascript; charset=utf-8 50017 bytes
```

If you get `text/html` and about two kilobytes, the HTML shell was served instead of the runtime:
a rule in `_redirects` is swallowing the framework's files, and the playground will stay a blank
page.

> ### 📎 The rewrite trap, and why these checks exist
>
> The playground is a single-page application: its routes exist only once Blazor is running. A
> *cold* request to one of them must therefore receive the application shell. Two shapes of rule
> look correct and fail:
>
> ```
> /playground/*  /playground/index.html  200
> ```
> is **rejected** by the platform — "*Infinite loop detected*". Cloudflare canonicalises
> `/playground/index.html` to `/playground/`, which the splat matches again. Zero rules parsed,
> deployment successful, no route covered.
>
> ```
> /playground/not-found  /playground/index.html  200
> ```
> is accepted and answers **307** to `/playground/`. That is the same canonicalisation, and it
> destroys the URL the rewrite existed to preserve: Blazor boots at its root, the route is gone.
>
> The shape that works targets the **directory**:
> ```
> /playground/not-found  /playground/  200
> ```
>
> `verify-output.sh` now refuses both wrong shapes and requires one rule per declared `@page`. The
> comment at the top of `_redirects` tells the whole story. **A new route in the playground needs
> a new line in `_redirects`** — without it, it works by clicking and fails on a shared link.

Stop the server with `Ctrl+C` once checks 2a to 2d pass.

---

## Step 3 — Create the Cloudflare account

**Why** — An account is needed to publish. Nothing more at this step.

**Do**

1. Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Create the account, confirm the email.
3. The **Free** plan is enough: static assets are free and unlimited on it.

**Create nothing in the interface.** The Worker will be created by `wrangler` from
`wrangler.jsonc`: the repository's file is what must be the source of truth, not boxes ticked in a
browser.

---

## Step 4 — Authenticate

**Do**

```bash
pnpm wrangler login
```

A browser opens, you authorise. wrangler keeps a token in your home directory — nothing is written
into the repository.

> Under WSL, if no browser opens, wrangler prints a URL: paste it into your Windows browser and
> the authorisation comes back to the terminal.

### ✅ Check

```bash
pnpm wrangler whoami
```

Expected: your email address, and the account with its **Account ID**. Note that identifier, it is
needed at step 7.

---

## Step 5 — The first deployment

**Why** — See the site live on a real URL before automating anything.

**Do**

First look at what would go up, without publishing:

```bash
pnpm wrangler deploy --dry-run
```

Four lines come out, and the third one always causes alarm:

```
✨ Read N files from the assets directory /home/<you>/dev/justdummies.io/dist
Total Upload: 0.34 KiB / gzip: 0.24 KiB
No bindings found.
--dry-run: exiting now.
```

| Line | What it has to say |
|---|---|
| `Read N files` | `N` is counted in **hundreds**. **Do not compare it against a figure written here**: it changes with every playground change, and it is not the number of files uploaded — `--dry-run` does not apply `.assetsignore`, verified. A handful of files would mean `dist/` is incomplete. The path must start with `/home/`, not `/mnt/`. |
| `Total Upload` | **under a kibibyte, and that is correct** — see below. |
| `No bindings found.` | expected: this Worker has no KV, no D1, no R2, no variables. |
| `--dry-run: exiting now.` | nothing was published. |

> **`Total Upload` is not the size of your files.** It is the size of the Worker **script** — and
> since this site has none (`wrangler.jsonc` deliberately carries no `main`), wrangler generates one
> that does nothing. You can see it:
>
> ```bash
> pnpm wrangler deploy --dry-run --outdir /tmp/wdry && ls /tmp/wdry
> ```
>
> It writes `no-op-worker.js`: that is what those 0.34 KiB weigh. Your files are counted separately,
> on the line above, and go up as *static assets* — free and unlimited.
>
> A `Total Upload` in the hundreds of kibibytes would be the opposite signal: a script has crept into
> the configuration, and requests would start consuming a quota. That is decision **A6**, and this
> line is the only place it is visible from outside.

This check does **not** prove you are authenticated: `--dry-run` never contacts Cloudflare. Step 4's
check is what does. Nor does it verify the *contents* of `dist/` — it counts files. `pnpm build` and
its assertions do that, back in step 1.

Then publish:

```bash
pnpm build && pnpm run deploy
```

`pnpm run deploy` publishes `dist/` **as built** and does not rebuild it: so always `pnpm build`
first. On the first deployment, Cloudflare may ask you to choose a `workers.dev` subdomain — it is
an account identifier, take what you like.

> ⚠️ **`run` is not optional here.** `pnpm deploy` without `run` does **not** run this script:
> `deploy` is a built-in pnpm command, it wins, and it answers
> `ERR_PNPM_NOTHING_TO_DEPLOY  No project was selected for deployment`. The message mentions neither
> wrangler nor Cloudflare, so nothing tells you the script exists and was never called.
>
> `serve` and `preview` do not have this problem — verified, no pnpm command carries those names —
> and so are written without `run`. `deploy` is the special case, not the other way round.

The Worker takes the name declared in `wrangler.jsonc`:

```
https://justdummies-site.<your-subdomain>.workers.dev
```

### ✅ Check

Replay checks 2b, 2c and 2d against the real URL — the same block, with a different `B`:

```bash
B=https://justdummies-site.<your-subdomain>.workers.dev
for u in / /fr/ /playground/ /playground/not-found /does-not-exist /fr/does-not-exist; do
  printf '%-26s %s\n' "$u" "$(curl -so /dev/null -w '%{http_code}' $B$u)"
done
```

All six codes must match step 2's. **If they differ, the difference is the real platform, not your
machine** — and that is exactly the information this step exists to produce.

The script takes a base URL, which replays check 2's six assertions against the deployment rather
than against your machine:

```bash
scripts/check-served-headers.sh https://justdummies-site.<your-subdomain>.workers.dev
```

Then open `/playground/` in a browser and look at the console. A blank page *without* a network
error but *with* a Content Security Policy error means the importmap's hash has not kept up; that
is what `generate-headers.mjs` computes on every build.

---

## Step 6 — The measurement that settles an open question

**Why** — The repository keeps a question open in the comment of `.assetsignore`: the Blazor
publish emits a pre-compressed `.br` twin of every framework file, which the .NET loader never
requests. Excluding them would cut the upload by roughly two thirds.

The local runtime has already answered for its part, measured rather than assumed: **3,002,102
bytes become 1,197,764 with `Content-Encoding: br`**. The twins are therefore unused *and*
unnecessary locally. What remains to confirm is the edge — the local runtime is not it, and the
artefact's own checks would not notice the difference, because they measure files rather than
transfers.

**Do** — nothing new: **you already ran the command in step 5's check**, and it is the one
`.assetsignore` names. Re-read its last `✓`/`✗` line. If you no longer have it in front of you:

```bash
scripts/check-served-headers.sh https://justdummies-site.<your-subdomain>.workers.dev
```

### ✅ How to read the result

| Line | Conclusion |
|---|---|
| `✓ the runtime compresses the WebAssembly payload (br: … → …)` | The edge compresses. The twins are dead weight: delete the corresponding paragraph from `.assetsignore` and add `*.br` and `*.gz` below it. |
| `✗ the WebAssembly payload is served uncompressed` | **Do not exclude them.** The runtime would go up uncompressed, against a 3 MiB budget for the whole first load. |

Write the answer into `.assetsignore`, where the question is asked — the file says what to do with
it. A settled question that is not written down gets asked again next time.

---

## Step 7 — Automate

**Why** — CI already builds and verifies on every push. The `deploy` job publishes on `main` as
soon as two secrets exist; without them it announces what is missing and does not fail.

### 7.1 The API token

1. Dashboard → avatar, top right → **My Profile** → **API Tokens**.
2. **Create Token**.
3. The **Edit Cloudflare Workers** template — the path Cloudflare documents. The strict minimum is
   *Account · Workers Scripts · Edit*; you will tighten it once the automatic deployment is
   proven.
4. Check that the target account is the right one, create the token, **copy it**. It is shown
   once.

> This token is the right to publish on your account. It goes **only** into the GitHub secrets,
> never into a file in the repository.

### 7.2 The account identifier

The one `pnpm wrangler whoami` printed at step 4, or: Dashboard → **Workers & Pages** → right-hand
panel.

### 7.3 Store them

`Reefact/justdummies.io` → **Settings** → **Secrets and variables** → **Actions** → **New
repository secret**. Two secrets, exactly these names:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from 7.1 |
| `CLOUDFLARE_ACCOUNT_ID` | the identifier from 7.2 |

### ✅ Check

Push anything to `main` (or re-run the workflow from the **Actions** tab — `workflow_dispatch` is
enabled), then open the **Deploy** job:

- **Expected:** the *Publish to Cloudflare Workers* step ends on a wrangler deployment.
- A "**Deployment skipped**" annotation naming a secret ⇒ that secret is missing or misspelled.
- "**Authentication error**" ⇒ token expired, revoked, or created on an account other than
  `CLOUDFLARE_ACCOUNT_ID`.

Finally, check the publication really came from CI:

```bash
pnpm wrangler deployments list
```

The most recent deployment must match your workflow's time, not your manual attempt from step 5.

### What CI does, and why this way

On every push to `main`:

1. **build** — validates the published snippets, installs, type-checks, builds, verifies the
   committed generated content is current, checks the size budgets, **asks the runtime what it
   actually serves** (step 2's script), then uploads the artefact.
2. **deploy** — fetches **that** artefact rather than rebuilding, replays `verify-output.sh` on
   the downloaded bytes, then runs `pnpm run deploy`.

Three choices that do not guess themselves:

- **The deploy job does not rebuild.** It publishes the artefact the checks examined; a job that
  rebuilds publishes bytes no check has seen.
- **It re-verifies after download.** `upload-artifact` ignores hidden files by default, and
  `dist/.assetsignore` is one. The workflow therefore passes `include-hidden-files: true`, and the
  re-verification is what turns that line into a guarantee rather than an intention.
- **No `wrangler-action`.** The repository pins one wrangler in `package.json`; a pipeline that
  downloads another publishes with a version nobody has tested.

A pull request cannot publish: the job is conditioned on a `push` to `main`.

---

## Step 8 — Attach `justdummies.io`

**Why** — This is the first step that is hard to undo: it changes the domain's nameservers. Do it
once every previous step is green.

A custom domain requires the **zone to be active at Cloudflare**.

**If the domain is registered elsewhere** (OVH, Gandi, Namecheap…):

1. Dashboard → **Add a domain** → `justdummies.io` → Free plan.
2. Cloudflare scans the existing DNS records. **Read them back**, especially the `MX` ones if an
   email address uses this domain: a forgotten MX cuts off the mail.
3. Cloudflare shows two nameservers. At your registrar, replace its own with those.
4. Propagation takes minutes to hours. The zone becomes **Active**.

**Then attach the Worker:**

1. **Workers & Pages** → `justdummies-site` → **Settings** → **Domains & Routes** → **Add** →
   **Custom Domain**.
2. `justdummies.io`. Repeat for `www.justdummies.io` if you want both.
3. Cloudflare creates the DNS record and issues the TLS certificate on its own.

A **Custom Domain** sends every path of the domain to the Worker — what a site wants. A **Route**
sends only part of it: not needed here. Nothing to change in `wrangler.jsonc`.

### ✅ Check

```bash
B=https://justdummies.io
curl -sI $B/ | head -1                       # is the certificate valid, does the site answer?
for u in / /fr/ /playground/ /playground/not-found /does-not-exist; do
  printf '%-26s %s\n' "$u" "$(curl -so /dev/null -w '%{http_code}' $B$u)"
done
```

Expected: `HTTP/2 200`, then the same codes as at steps 2 and 5. A certificate error immediately
after adding the domain is normal — Cloudflare takes a few minutes to issue it. A
`curl: (6) Could not resolve host` means the zone is not active yet, or the nameservers were not
changed at the registrar.

---

## Step 9 — Preview without publishing

**Why** — To have a visual change reviewed before merging it.

**Do**

```bash
pnpm build
pnpm preview                             # uploads a version, without promoting it
pnpm preview --preview-alias my-branch   # with a readable name
```

The command returns the version's URL. This is the Workers preview mechanism, and it differs from
Pages': here a version *exists and waits*, instead of a per-branch deployment being created
automatically.

### ✅ Check

Open the returned URL, then verify production has **not** moved:

```bash
pnpm wrangler deployments list
```

The active deployment must be unchanged — that is the whole point of an unpromoted version.

---

## Every check, in one table

| # | Step | What it proves |
|---|---|---|
| 0 | versions + clone path | The toolchain matches the repository, and the disk is not the wrong one. |
| 1 | `Artefact looks well formed.`, zero `✗` | The artefact has the expected shape, on disk. |
| **2** | **`check-served-headers.sh`** | **What the runtime really serves — the check to remember.** |
| 2a | `Parsed 1 valid redirect rule.` | The rules are loaded, not silently rejected. |
| 2b | the six HTTP codes | Routing, the 404s and the playground rewrite all work. |
| 2c | the titles + the CSP header | Right content, right language, policy applied. |
| 2d | `text/javascript`, ~50 kB | No rule is swallowing the framework's files. |
| 4 | `wrangler whoami` | Authenticated, on the right account. |
| 5 | the six codes, then the script on the real URL | The platform behaves like the local runtime. |
| 6 | the script against the deployment | Settles the question of the `.br` twins. |
| 7 | the **Deploy** job + `deployments list` | CI really publishes, with the right secrets. |
| 8 | `HTTP/2 200` on the domain | DNS, TLS and the Worker attachment are in place. |
| 9 | `deployments list` unchanged | A preview does not touch production. |

---

## Troubleshooting

| Symptom | Most likely cause |
|---|---|
| `./scripts/build-site.sh: not found`, syntax errors | You are not in bash. See 0.1. |
| `dotnet --version`: "Couldn't find a valid ICU package" | A missing system dependency, not an SDK problem: `sudo apt-get install -y libicu-dev`. See 0.2a. |
| `E: Unable to locate package libicu` | The name came from the error message and does not exist on Ubuntu. It is `libicu-dev` (or `libicu74`). See 0.2a. |
| `ERR_PNPM_NOTHING_TO_DEPLOY` | `pnpm deploy` called pnpm's built-in command, not the script. It is `pnpm run deploy`. See step 5. |
| `pnpm install` refuses the Node version | `engines` requires Node ≥ 22: `nvm install`. |
| The build takes several minutes | Repository under `/mnt/c/`. See the warning in 0.1. |
| `Parsed 0 valid redirect rules` | A rule is rejected. A target that canonicalises back into its own pattern gives "Infinite loop detected". |
| Cold link to the playground answers **307** | The rule targets `index.html`. Target the directory. |
| Cold link to the playground answers **404** | Route declared in Blazor, missing from `_redirects`. `pnpm build` now says so. |
| The runtime comes back as `text/html` | A rule is swallowing `_framework`. Check 2d. |
| `check-served-headers.sh`: `served with NO content security policy` | The host is ignoring `_headers`. Check the file is at the root of `dist/` and not excluded by `.assetsignore`. |
| `check-served-headers.sh`: `rules replace rather than merge` | A specific rule overwrote the general one instead of adding to it: fingerprinted assets would lose the policy while gaining their cache lifetime. |
| Playground blank, no network error | Content Security Policy. A hand-edited `_headers` breaks the playground on the next build, because the hash is recomputed. |
| Playground blank, every asset 404 | The `<base href>` no longer matches where the playground was copied. `verify-output.sh` catches it. |
| CI: "Deployment skipped" | A secret is missing. Its name is in the annotation. |
| CI: `Authentication error` | Token absent, expired, or created on another account. |
| `curl: (6) Could not resolve host` | Zone not **Active** yet, or nameservers unchanged at the registrar. |
| The domain still serves the old site | Same cause, or a local DNS cache. |

---

## Still to be settled

- **The framework's `.br` twins.** An open question, asked in `.assetsignore`, to be settled with
  the measurement in step 6.
- **Tightening the API token.** The "Edit Cloudflare Workers" template is broader than a
  script-less Worker needs. To be reduced once the automatic deployment is proven.
- **Previews in CI.** They are made by hand today (step 9). Automating them on pull requests would
  mean giving a pull request access to the token — not a configuration decision, a security
  decision.
