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
calls `scripts/build-site.sh`, and the repository's five scripts use bash-only constructs
(`set -euo pipefail`, process substitution `< <(...)`, `compgen`). Neither `cmd.exe` nor
PowerShell can run them — this is not a matter of preference, those constructs have no equivalent.

| Command | cmd / PowerShell | Git Bash | WSL2 | macOS / Linux |
|---|---|---|---|---|
| `pnpm install` | ✅ | ✅ | ✅ | ✅ |
| `pnpm dev`, `pnpm check` | ✅ | ✅ | ✅ | ✅ |
| `pnpm serve`, `preview`, `deploy` | ✅ | ✅ | ✅ | ✅ |
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
> Windows↔Linux boundary pays a fixed cost, and this build writes thousands of small files — 129
> in `_framework` alone. On `/mnt/c`, a thirty-second build takes several minutes.

*On macOS or Linux there is nothing to do: your terminal already qualifies.*

If you really must stay on native Windows, pnpm can delegate to Git Bash:

```powershell
pnpm config set scriptShell "C:\Program Files\Git\bin\bash.exe"
```

That works, but you then build in a different bash from CI's, and Git Bash does not ship every
tool the scripts call. It is a fallback, not a choice.

### 0.2 The toolchain

Three tools, and **the repository pins the versions itself** — do not choose them, let them be
read:

| Tool | Version | Pinned by |
|---|---|---|
| Node | 22 | `.nvmrc` |
| pnpm | 10.33.0 | the `packageManager` field of `package.json` |
| .NET SDK | 10.0.100 | `global.json` |

On Ubuntu (WSL) or Linux:

```bash
# Node — install nvm by following its README, then, inside the repository:
#   https://github.com/nvm-sh/nvm#installing-and-updating
nvm install          # reads .nvmrc, so it installs the version the repository requires

# pnpm — corepack ships with Node and reads the packageManager field
corepack enable

# .NET SDK — the channel matches global.json
curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0
echo 'export PATH="$HOME/.dotnet:$PATH"' >> ~/.bashrc
exec "$SHELL"
```

Then get the repository and enable the commit-message hook:

```bash
git clone https://github.com/Reefact/justdummies.io.git
cd justdummies.io
git config core.hooksPath .githooks    # once per clone
```

### ✅ Checking the prerequisites

```bash
node --version
pnpm --version
dotnet --version
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
GNU bash, version 5.x.x(1)-release ...
✅ repository on the native filesystem
```

A `node: command not found` after `nvm install` means the shell has not reloaded its environment:
`exec "$SHELL"`. A Node 20 or 24 instead of 22 will make `pnpm install` fail on the `engines`
field — that is deliberate.

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

The full reasoning is in [`design/decisions-inventory.md`](design/decisions-inventory.md), entries
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
| `scripts/verify-output.sh` | Seventeen assertions on the artefact's shape. Several exist only because their failure is invisible until a visitor meets it. |
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
`_astro/` and `playground/`. The `_framework` count sits around 130 files.

---

## Step 2 — Serve the site the way Cloudflare will

**Why** — This is the highest-return step in the guide. `pnpm serve` is **not** a static file
server: it is the Workers runtime locally, which **parses `_headers` and `_redirects`** and
applies their rules. No other local server has any opinion about those two files, and they are
the ones carrying the security policy and the playground's routing.

**Do**

```bash
pnpm serve       # holds the terminal — serves on http://localhost:8787
```

> This command does not return. **Open a second terminal** for the checks.

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
B=http://localhost:8787
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
B=http://localhost:8787
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
B=http://localhost:8787
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

Stop the server with `Ctrl+C` once all four checks pass.

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

Expected: `✨ Read 158 files from the assets directory …/dist` — the number will move, but it must
be counted in hundreds, not in units.

Then publish:

```bash
pnpm build && pnpm deploy
```

`pnpm deploy` publishes `dist/` **as built** and does not rebuild it: so always `pnpm build`
first. On the first deployment, Cloudflare may ask you to choose a `workers.dev` subdomain — it is
an account identifier, take what you like.

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

Then open `/playground/` in a browser and look at the console. A blank page *without* a network
error but *with* a Content Security Policy error means the importmap's hash has not kept up; that
is what `generate-headers.mjs` computes on every build.

---

## Step 6 — The measurement that settles an open question

**Why** — The repository deliberately left a question unanswered, in the comment of
`.assetsignore`: the Blazor publish emits a pre-compressed `.br` twin of every framework file,
which the .NET loader never requests. Excluding them would cut the upload by roughly two thirds —
**provided** Cloudflare compresses `application/wasm` at its edge. The local server cannot answer
that; only the edge can.

**Do**

```bash
B=https://justdummies-site.<your-subdomain>.workers.dev
W=$(basename $(ls dist/playground/_framework/dotnet.native.*.wasm | head -1))
curl -sD - -o /dev/null -H 'Accept-Encoding: br, gzip' "$B/playground/_framework/$W" \
  | grep -iE 'content-encoding|content-length|content-type'
```

### ✅ How to read the result

| Output | Conclusion |
|---|---|
| `content-encoding: br` or `gzip` | The edge compresses. The `.br` twins are dead weight: you can exclude them in `.assetsignore`. |
| *no* `content-encoding` | **Do not exclude them.** The runtime would go up uncompressed, against a 3 MiB budget for the whole first load. |

Record the result in `.assetsignore`, where the question is asked. A settled question that is not
written down gets asked again next time.

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

1. **build** — installs, validates the snippets, type-checks, builds, verifies the shape, checks
   the budgets, uploads the artefact.
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
once the previous seven are green.

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
| 1 | `Artefact looks well formed.`, zero `✗` | The artefact has the expected shape. |
| 2a | `Parsed 1 valid redirect rule.` | The rules are loaded, not silently rejected. |
| 2b | the six HTTP codes | Routing, the 404s and the playground rewrite all work. |
| 2c | the titles + the CSP header | Right content, right language, policy applied. |
| 2d | `text/javascript`, ~50 kB | No rule is swallowing the framework's files. |
| 4 | `wrangler whoami` | Authenticated, on the right account. |
| 5 | the six codes on the real URL | The platform behaves like the local runtime. |
| 6 | `content-encoding` of the `.wasm` | Settles the question of the `.br` twins. |
| 7 | the **Deploy** job + `deployments list` | CI really publishes, with the right secrets. |
| 8 | `HTTP/2 200` on the domain | DNS, TLS and the Worker attachment are in place. |
| 9 | `deployments list` unchanged | A preview does not touch production. |

---

## Troubleshooting

| Symptom | Most likely cause |
|---|---|
| `./scripts/build-site.sh: not found`, syntax errors | You are not in bash. See 0.1. |
| `pnpm install` refuses the Node version | `engines` requires Node ≥ 22: `nvm install`. |
| The build takes several minutes | Repository under `/mnt/c/`. See the warning in 0.1. |
| `Parsed 0 valid redirect rules` | A rule is rejected. A target that canonicalises back into its own pattern gives "Infinite loop detected". |
| Cold link to the playground answers **307** | The rule targets `index.html`. Target the directory. |
| Cold link to the playground answers **404** | Route declared in Blazor, missing from `_redirects`. `pnpm build` now says so. |
| The runtime comes back as `text/html` | A rule is swallowing `_framework`. Check 2d. |
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
