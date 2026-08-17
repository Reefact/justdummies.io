# justdummies.io

The official website of **[JustDummies](https://github.com/Reefact/just-dummies)** — a .NET library
that generates explicit, constrained, domain-respecting dummies for tests.

The site is one static deployment: an Astro application, with a Blazor WebAssembly playground
mounted under `/playground/`. There is no application server.

> **Status: skeleton.** The build pipeline is real and verified end to end. The landing page's
> scrollytelling narrative and the playground's parser are specified and not yet built.

## Layout

```
apps/
  site/          Astro — landing page and content pages
  playground/    Blazor WebAssembly — runs the real library in the browser
packages/
  design-tokens/ Colour, space, type and motion, shared by both applications
docs/
  for-maintainers/ Operating this repository — the deployment guide, and adr/, the
                   decision records; both in English and French
  design/          The specification, and the decisions still awaiting a record
scripts/         Build the two halves and assemble them into one artefact
tools/           Repository tooling (the commit-message linter)
```

## Requirements

| | |
|---|---|
| Node | ≥ 22, with pnpm (`packageManager` pins the version) |
| .NET SDK | pinned by `global.json` |

## Building

```bash
pnpm install

# The analytics lane is governed by two variables, and the build expects both. Nothing is
# measured with the state `disabled`, and the id is never contacted — but it still has to
# be a well-formed one, because an id that has gone missing while the measurement is off is
# a broken memory, and finding out on the day it is switched back on is finding out too
# late. Use the placeholder below unless you are building for the real property.
export PUBLIC_GA_MEASUREMENT_STATE=disabled
export PUBLIC_GA_MEASUREMENT_ID=G-0000000000

pnpm build
```

That runs the whole pipeline: it builds the site into `dist/`, publishes the playground, copies it
to `dist/playground/`, and verifies the artefact's shape. The halves can also be built separately
with `pnpm build:site` and `pnpm build:playground`.

With `PUBLIC_GA_MEASUREMENT_STATE=disabled` the artefact carries no analytics tag, no consent
banner, and a content policy that grants Google nothing — `grep -r googletagmanager dist/` returns
nothing at all. That is the state to build in unless you are deploying. The reasoning is
[ADR-0014](docs/for-maintainers/adr/0014-the-journey-is-measured-in-a-third-lane-gated-on-consent-en.md);
turning it on is step 11 of the [deployment guide](docs/for-maintainers/deployment-en.md).

`dist/` is the deployment — the directory uploaded to Cloudflare Workers, exactly as built.

## Checking it in a browser

```bash
pnpm test:browser          # every check
pnpm test:browser controls # the checks whose file name matches
```

The scripts the build runs read the artefact. This one renders it, against `dist/` served by the
runtime production uses, and checks what only a rendered page can say: the playground starts and
draws a value, the browser agrees to the Content-Security-Policy, no control is offered to a reader
whose scripting never arrives, nothing is wider than the viewport. It needs a full `pnpm build`
first, because one of the checks is that the playground runs. Playwright rather than the
alternatives: [ADR-0009](docs/for-maintainers/adr/0009-the-browser-checks-are-driven-by-playwright-en.md).

## Deploying

```bash
pnpm serve      # serve dist/ the way Workers will, parsing _headers and _redirects
pnpm preview    # upload a version without promoting it — no URL, see the guide's step 9
pnpm run deploy # publish dist/ as built — it does not rebuild, so build first
```

`pnpm serve` is not a static file server: it is the Workers runtime locally, so the response
headers and the redirect rules are the real ones. Prefer it over any other local server when
checking anything that depends on them.

Pushing to `main` builds and verifies. **A `release/*` tag publishes** — a branch never does. The
tag is named after the UTC instant it was made and its message repeats that name; the deployment
guide gives the command for PowerShell and for bash, and `./scripts/check-release-tag.sh` reads the
tag back once you have pushed it.

`curl -s https://justdummies.io/version.json` says which release is live, with the commit it was
built from. The build stamps it, `verify-output.sh` asserts it, and it is served `no-store`.

The step-by-step setup — prerequisites, account, API token, GitHub secrets, custom domain — with a
check to run after every step:
[`docs/for-maintainers/deployment-en.md`](docs/for-maintainers/deployment-en.md) ·
[`docs/for-maintainers/deployment-fr.md`](docs/for-maintainers/deployment-fr.md).

On Windows, build under WSL2: `pnpm build` runs bash scripts, which `cmd.exe` and PowerShell
cannot execute. The guide's step 0 covers it.

## How the two halves meet

The playground's project file sets `StaticWebAssetBasePath` to `playground`, and its `index.html`
carries the matching `<base href="/playground/" />`. Both are asserted by
`scripts/verify-output.sh`, because a mismatch produces a blank page rather than an error: the
document loads, and every asset URL resolves one directory too high.

## The library version

The playground references a **published** JustDummies package, never a source build — a playground
running the library's `main` would offer constraints that exist in no package a visitor can install.
The version is declared once, in `Directory.Packages.props`, and the interface reads what it
actually loaded rather than a string typed beside it.

## Contributing

Commit convention, branch rules and pull request titles: [`CONTRIBUTING.md`](CONTRIBUTING.md).
Enable the commit-message hook once per clone:

```bash
git config core.hooksPath .githooks
```

## Licence

[Apache 2.0](LICENSE).
