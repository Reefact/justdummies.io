# Security policy

This repository holds a **website**, not the library. It is one static deployment — an Astro
application and a Blazor WebAssembly playground, served by a Cloudflare Worker with no application
server behind it, no account, and no visitor data to reach. What can go wrong here is narrower than
in a package: a script that runs where the Content-Security-Policy should have refused it, a
redirect that sends a visitor somewhere it should not, a secret that reached the built artefact.

Report any of those **privately**. Not as an issue: the tracker is public from the moment the form
is submitted, so an issue is a disclosure before it is a report.

**Use [Report a vulnerability](https://github.com/Reefact/justdummies.io/security/advisories/new).**
It opens a thread that only the maintainer can read, and it stays closed until there is something
to publish.

A vulnerability in the **library itself** — the `JustDummies` packages the playground loads —
belongs to [its own repository](https://github.com/Reefact/just-dummies), not here. The playground
runs a published package; a defect in it is a defect there, and reaches every user of the library
rather than only a visitor to this site.

## What to expect

One maintainer, working in the open. Expect an acknowledgement within a week and an honest answer
about whether and when it will be fixed — not a service-level agreement this repository has no way
to keep.

## Supported versions

There is one version: whatever the last `release/*` tag deployed to <https://justdummies.io>.
Nothing older is served, so there is nothing older to patch.
