#!/usr/bin/env node
// Compare what this repository declares about JustDummies' packages against what
// nuget.org actually publishes, and report every package that has drifted.
//
// ADR-0013 pins mirrored library content to a release tag rather than trusting an
// elapsed-time delay, precisely because staleness here shows up as a VERSION gap, not
// a date. Measured at the ADR's own writing: the site advertised JustDummies.Cli
// 1.0.0-beta.1 while nuget.org served 1.1.0-beta.1, and the release-notes snapshot
// behind it was not old — no rule expressed in elapsed days would have found that
// gap. This script is the mechanism §2 demands instead: it reads the registry itself
// and fails loudly (in its report, never in the build — see below) when the source
// has moved.
//
// A package can be declared in up to two places that must agree with each other:
//   - apps/site/src/site.ts, the single place §14.1 asks install commands to come from;
//   - Directory.Packages.props, which is what the playground actually restores.
// site.ts's own header has carried a "KNOWN DUPLICATION ... until a build step
// compares them" comment since before this script existed. Reading both and reporting
// a disagreement is that build step; the comment names this file now.
//
// Never exits non-zero over a package being behind the registry, never published at
// all, withdrawn after publication, or over the two local sources disagreeing —
// ADR-0013 draws that distinction on purpose, the same one §11.8 draws for the
// comparison table: an external fact moving is a warning and an issue, never a failed
// publish. It exits non-zero only when this
// script's own assumptions about the repository's shape stop holding (a version
// string it cannot parse, a package declared where its own PACKAGES list does not
// expect one, a source file restructured out from under its regexes) — a defect in
// the check itself, not a finding it exists to report.
//
// Usage:
//   node scripts/check-package-freshness.mjs [--out <path>]
//
// Always prints a human report to stdout. With --out, also writes a JSON summary —
// including a ready-to-post markdown body — for a CI step to open or update an issue
// from, without reimplementing this script's logic in YAML.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Every package this repository could declare a version for, and where to look.
 * JustDummies.DiagnosticCatalog is deliberately absent from every source below —
 * nothing in this repository states a version for it today (tracked as its own
 * question, not one this script decides) — so it is reported as `undeclared` rather
 * than compared against nothing.
 */
const PACKAGES = [
    { id: 'JustDummies', siteTsKey: 'library', inPackagesProps: true },
    { id: 'JustDummies.Xunit', siteTsKey: 'xunit', inPackagesProps: true },
    { id: 'JustDummies.Cli', siteTsKey: 'cli', inPackagesProps: false },
    { id: 'JustDummies.DiagnosticCatalog', siteTsKey: null, inPackagesProps: false },
];

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Where each `JustDummies.*` id actually appears, found by content shape rather than
 * looked up by name — a `Map<id, { inSiteTs, inPackagesProps }>`.
 *
 * ID membership in `PACKAGES` is not enough to trust it: `JustDummies.DiagnosticCatalog`
 * is pre-seeded there specifically because it is undeclared *today*, with
 * `siteTsKey: null`. The day a real `site.ts` entry is added for it without also
 * updating that placeholder, checking "is this id known" would say yes and
 * `checkPackage` would still follow the stale `siteTsKey: null` — silently checking
 * nothing while a real declaration sat right next to it. `main()` compares what this
 * function finds against what each `PACKAGES` entry expects, not just whether the id
 * is present, and treats any mismatch — a wholly new id, or a known one now declared
 * somewhere its own entry does not expect — as the same class of defect as an
 * unparseable version: this script's own assumptions about the repository's shape,
 * stale.
 */
function declaredLocations(siteTs, packagesProps) {
    const locations = new Map();
    const at = (id) => {
        let entry = locations.get(id);
        if (entry === undefined) {
            entry = { inSiteTs: false, inPackagesProps: false };
            locations.set(id, entry);
        }
        return entry;
    };

    for (const m of siteTs.matchAll(/package:\s*'(JustDummies[^']*)'/g)) at(m[1]).inSiteTs = true;
    for (const m of packagesProps.matchAll(/<PackageVersion Include="(JustDummies[^"]*)"/g)) at(m[1]).inPackagesProps = true;

    return locations;
}

/**
 * `package: 'X',` anchors the block; `version: '...'` follows within it. The trailing
 * quote after the package id is load-bearing: without it, `'JustDummies'` would also
 * match inside `'JustDummies.Xunit'`.
 */
function siteTsVersion(text, packageId) {
    const re = new RegExp(`package:\\s*'${escapeRegExp(packageId)}',[\\s\\S]{0,200}?version:\\s*'([^']+)'`);
    return re.exec(text)?.[1] ?? null;
}

function packagesPropsVersion(text, packageId) {
    const re = new RegExp(`<PackageVersion Include="${escapeRegExp(packageId)}" Version="([^"]+)"`);
    return re.exec(text)?.[1] ?? null;
}

/**
 * SemVer 2.0.0 precedence, the subset this repository's versions actually use:
 * major.minor.patch, plus a dot-separated prerelease. No build metadata (`+...`)
 * appears in any version here, so it is not parsed. Returns null on anything that
 * does not fit — callers treat that as "cannot verify", never as "equal" or "behind".
 */
function parseVersion(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(version);

    if (match === null) {
        return null;
    }

    const [, major, minor, patch, prerelease] = match;

    return {
        core: [major, minor, patch].map(Number),
        prerelease: prerelease === undefined ? null : prerelease.split('.'),
    };
}

/** -1 / 0 / 1, by SemVer precedence. Assumes both parsed successfully. */
function compareVersions(a, b) {
    for (let i = 0; i < 3; i++) {
        if (a.core[i] !== b.core[i]) {
            return a.core[i] < b.core[i] ? -1 : 1;
        }
    }

    // Equal major.minor.patch: no prerelease outranks any prerelease.
    if (a.prerelease === null && b.prerelease === null) return 0;
    if (a.prerelease === null) return 1;
    if (b.prerelease === null) return -1;

    const length = Math.max(a.prerelease.length, b.prerelease.length);

    for (let i = 0; i < length; i++) {
        const x = a.prerelease[i];
        const y = b.prerelease[i];

        if (x === undefined) return -1; // Fewer identifiers, all preceding equal: lower.
        if (y === undefined) return 1;
        if (x === y) continue;

        const xNum = /^\d+$/.test(x);
        const yNum = /^\d+$/.test(y);

        if (xNum && yNum) return Number(x) < Number(y) ? -1 : 1;
        if (xNum !== yNum) return xNum ? -1 : 1; // Numeric identifiers always sort lower.

        return x < y ? -1 : 1;
    }

    return 0;
}

async function fetchJson(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) {
        throw new Error(`${url} answered ${response.status}`);
    }
    return response.json();
}

/**
 * Every catalog entry nuget.org has ever published for this package, listed or not.
 *
 * The flat-container index (`v3-flatcontainer/{id}/index.json`) this used to read is
 * just an array of version strings — it carries no `listed` flag, so a version
 * withdrawn after publication (a bad release, pulled) is indistinguishable from one
 * still installable by default. The registration resource is the one that carries
 * that fact, at the cost of being paged: a package with enough versions splits into
 * pages nuget.org returns as `{ "@id": <url>, "count": N }` with no inline `items`,
 * which this follows rather than assumes away — none of this repository's own
 * packages are anywhere near that threshold today, but a check that silently
 * mishandled it the day one crossed it would be exactly the class of defect this
 * file exists to catch elsewhere.
 */
async function registrationEntries(packageId) {
    const index = await fetchJson(`https://api.nuget.org/v3/registration5-gz-semver2/${packageId.toLowerCase()}/index.json`);

    const entries = [];
    for (const page of index.items ?? []) {
        const items = page.items ?? (await fetchJson(page['@id'])).items ?? [];
        for (const item of items) entries.push(item.catalogEntry);
    }
    return entries;
}

async function latestPublished(packageId) {
    let entries;
    try {
        entries = await registrationEntries(packageId);
    } catch (error) {
        return { error: `could not reach nuget.org's registration for ${packageId}: ${error.message}` };
    }

    if (entries.length === 0) {
        return { error: `nuget.org's registration lists no version for ${packageId}` };
    }

    // `listed` is absent (not `false`) on entries from before the field existed, and
    // absence means listed — only an explicit `false` means withdrawn.
    const listed = entries.filter((e) => e.listed !== false);
    const parsedListed = listed.map((e) => ({ raw: e.version, parsed: parseVersion(e.version) })).filter((v) => v.parsed !== null);

    if (parsedListed.length === 0) {
        return { error: `nuget.org lists no currently-listed, parseable version for ${packageId}` };
    }

    const latest = parsedListed.reduce((best, candidate) => (compareVersions(candidate.parsed, best.parsed) > 0 ? candidate : best));

    // Every version this package has ever had, mapped to whether it is still listed —
    // not just the ones that fed `latest` above. A declared version that is absent
    // here never existed; one that is present but maps to `false` did exist and was
    // pulled, which `latest` alone cannot distinguish from simply being older.
    const byVersion = new Map(entries.map((e) => [e.version, e.listed !== false]));

    return { byVersion, latest: latest.raw };
}

async function checkPackage(pkg, siteTs, packagesProps) {
    const declarations = [];
    if (pkg.siteTsKey !== null) {
        const v = siteTsVersion(siteTs, pkg.id);
        if (v !== null) declarations.push({ source: 'site.ts', version: v });
        else return { id: pkg.id, status: 'unparseable', reason: `site.ts: no version found for package '${pkg.id}'` };
    }
    if (pkg.inPackagesProps) {
        const v = packagesPropsVersion(packagesProps, pkg.id);
        if (v !== null) declarations.push({ source: 'Directory.Packages.props', version: v });
        else return { id: pkg.id, status: 'unparseable', reason: `Directory.Packages.props: no PackageVersion found for '${pkg.id}'` };
    }

    if (declarations.length === 0) {
        return { id: pkg.id, status: 'undeclared', declarations };
    }

    const distinctVersions = [...new Set(declarations.map((d) => d.version))];
    if (distinctVersions.length > 1) {
        return { id: pkg.id, status: 'inconsistent', declarations };
    }

    const declared = distinctVersions[0];
    if (parseVersion(declared) === null) {
        return { id: pkg.id, status: 'unparseable', declarations, reason: `'${declared}' is not a version this script can parse` };
    }

    const registry = await latestPublished(pkg.id);
    if (registry.error !== undefined) {
        return { id: pkg.id, status: 'unknown', declarations, declared, reason: registry.error };
    }

    // Ahead of the registry is not "fresh": a version this repository declares but
    // nuget.org has never published — a typo, or a tag whose release run failed
    // before packing (ADR-0013's own Context names exactly this case) — does not
    // become installable by outranking everything that does exist.
    if (!registry.byVersion.has(declared)) {
        return {
            id: pkg.id,
            status: 'unpublished',
            declarations,
            declared,
            latest: registry.latest,
            reason: `'${declared}' does not exist on nuget.org for ${pkg.id} — nearest published version is ${registry.latest}`,
        };
    }

    // Existed, but no longer does: this exact version was published and later pulled.
    // It can still outrank every remaining listed version (a withdrawn newest
    // release), so this has to be checked before the ordinary staleness comparison
    // below, not folded into it — "outranks the latest listed version" and "is a
    // version anyone should still be declaring" are different questions.
    if (registry.byVersion.get(declared) === false) {
        return {
            id: pkg.id,
            status: 'withdrawn',
            declarations,
            declared,
            latest: registry.latest,
            reason: `'${declared}' was published then withdrawn from nuget.org for ${pkg.id} — nearest still-listed version is ${registry.latest}`,
        };
    }

    const isStale = compareVersions(parseVersion(declared), parseVersion(registry.latest)) < 0;

    return { id: pkg.id, status: isStale ? 'stale' : 'fresh', declarations, declared, latest: registry.latest };
}

function humanReport(results) {
    const lines = ['▸ Package freshness against nuget.org', ''];
    const widest = Math.max(...results.map((r) => r.id.length));

    for (const r of results) {
        const label = r.id.padEnd(widest);
        switch (r.status) {
            case 'fresh':
                lines.push(`  ✓ ${label}  ${r.declared} (registry: ${r.latest})`);
                break;
            case 'stale':
                lines.push(`  ✗ ${label}  ${r.declared} — nuget.org has ${r.latest}`);
                break;
            case 'unpublished':
                lines.push(`  ✗ ${label}  ${r.declared} does not exist on nuget.org (nearest: ${r.latest})`);
                break;
            case 'withdrawn':
                lines.push(`  ✗ ${label}  ${r.declared} was withdrawn from nuget.org (nearest listed: ${r.latest})`);
                break;
            case 'inconsistent':
                lines.push(`  ✗ ${label}  disagrees between sources: ${r.declarations.map((d) => `${d.source}=${d.version}`).join(', ')}`);
                break;
            case 'undeclared':
                lines.push(`  · ${label}  no declared version in this repository`);
                break;
            case 'unknown':
                lines.push(`  ? ${label}  ${r.reason}`);
                break;
            case 'unparseable':
                lines.push(`  ! ${label}  ${r.reason}`);
                break;
            case 'undiscovered':
                lines.push(`  ! ${label}  ${r.reason}`);
                break;
        }
    }

    return lines.join('\n');
}

function markdownBody(results, generatedAt) {
    const stale = results.filter((r) => r.status === 'stale');
    const unpublished = results.filter((r) => r.status === 'unpublished');
    const withdrawn = results.filter((r) => r.status === 'withdrawn');
    const inconsistent = results.filter((r) => r.status === 'inconsistent');
    const unknown = results.filter((r) => r.status === 'unknown');
    const undeclared = results.filter((r) => r.status === 'undeclared');

    const sections = [];

    if (stale.length > 0) {
        sections.push(
            [
                '### Behind the registry',
                '',
                '| Package | Declared here | Published on nuget.org |',
                '|---|---|---|',
                ...stale.map((r) => `| \`${r.id}\` | ${r.declared} | [${r.latest}](https://www.nuget.org/packages/${r.id}/${r.latest}) |`),
            ].join('\n'),
        );
    }

    if (unpublished.length > 0) {
        sections.push(
            [
                '### Declared here, does not exist on nuget.org',
                '',
                'Not merely stale — this exact version has never been published, or was pulled. A typo, or a',
                'release tag whose run failed before packing.',
                '',
                ...unpublished.map((r) => `- \`${r.id}\`: declares \`${r.declared}\`, nearest published version is \`${r.latest}\``),
            ].join('\n'),
        );
    }

    if (withdrawn.length > 0) {
        sections.push(
            [
                '### Declared here, withdrawn from nuget.org',
                '',
                'Published once, then pulled — a version this repository still declares is no longer',
                'something nuget.org will hand out.',
                '',
                ...withdrawn.map((r) => `- \`${r.id}\`: declares \`${r.declared}\`, nearest still-listed version is \`${r.latest}\``),
            ].join('\n'),
        );
    }

    if (inconsistent.length > 0) {
        sections.push(
            [
                '### Disagree with themselves',
                '',
                'Same package, two files, two different versions — this repository is inconsistent about',
                'what it declares before the registry even enters into it.',
                '',
                ...inconsistent.map((r) => `- \`${r.id}\`: ${r.declarations.map((d) => `${d.source} says ${d.version}`).join(', ')}`),
            ].join('\n'),
        );
    }

    if (unknown.length > 0) {
        sections.push(['### Could not be verified', '', ...unknown.map((r) => `- \`${r.id}\`: ${r.reason}`)].join('\n'));
    }

    if (undeclared.length > 0) {
        sections.push(
            [
                '### No declared version',
                '',
                'Not stale — nothing here claims a version for these, so there is nothing to compare:',
                '',
                ...undeclared.map((r) => `- \`${r.id}\``),
            ].join('\n'),
        );
    }

    return [
        `_Generated ${generatedAt} by \`scripts/check-package-freshness.mjs\`, comparing this repository's declared package versions against nuget.org._`,
        '',
        sections.join('\n\n'),
    ].join('\n');
}

async function main() {
    const outIndex = process.argv.indexOf('--out');
    const outPath = outIndex === -1 ? null : process.argv[outIndex + 1];

    const siteTs = readFileSync(join(root, 'apps/site/src/site.ts'), 'utf8');
    const packagesProps = readFileSync(join(root, 'Directory.Packages.props'), 'utf8');

    const results = await Promise.all(PACKAGES.map((pkg) => checkPackage(pkg, siteTs, packagesProps)));

    for (const [id, foundAt] of declaredLocations(siteTs, packagesProps)) {
        const known = PACKAGES.find((p) => p.id === id);

        if (known === undefined) {
            results.push({
                id,
                status: 'undiscovered',
                reason: `declared in this repository but not in this script's own PACKAGES list — add it`,
            });
        } else if (foundAt.inSiteTs && known.siteTsKey === null) {
            results.push({
                id,
                status: 'undiscovered',
                reason: `declared in site.ts, but its PACKAGES entry has siteTsKey: null — update it to check what is actually declared`,
            });
        } else if (foundAt.inPackagesProps && !known.inPackagesProps) {
            results.push({
                id,
                status: 'undiscovered',
                reason: `declared in Directory.Packages.props, but its PACKAGES entry has inPackagesProps: false — update it to check what is actually declared`,
            });
        }
    }

    console.log(humanReport(results));

    // Both mean the same thing: this script's own assumptions about the repository's
    // shape stopped holding — a version it cannot parse, a package it does not know
    // to look for — rather than a finding about the packages themselves.
    const scriptDefects = results.filter((r) => r.status === 'unparseable' || r.status === 'undiscovered');
    if (scriptDefects.length > 0) {
        console.error('');
        console.error('This script could not verify its own assumptions about the repository:');
        for (const r of scriptDefects) console.error(`  - ${r.reason}`);
    }

    if (outPath !== null) {
        const generatedAt = new Date().toISOString();
        const summary = {
            generatedAt,
            packages: results,
            anyStale: results.some((r) => ['stale', 'unpublished', 'withdrawn', 'inconsistent', 'unknown'].includes(r.status)),
            markdownBody: markdownBody(results, generatedAt),
        };
        writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`);
        console.log(`\n  ${outPath}`);
    }

    process.exit(scriptDefects.length > 0 ? 1 : 0);
}

await main();
