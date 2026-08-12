/**
 * What this build is: the release it belongs to, the commit it came from, and when it
 * was made.
 *
 * The same file the site serves at /version.json — imported here, copied there, one
 * generation per build (`scripts/generate-version.sh`, then `scripts/build-site.sh`).
 * That is the point: a page that displays the version and an endpoint that serves it
 * must not be able to name two different builds.
 *
 * Two of the three can be null, and a page has to say so rather than print nothing.
 * `release` is null whenever the build did not come from a release tag, which is every
 * build on a branch; `commit` is null only where there is no git at all, such as a
 * build from an exported tarball. `built` is always a time.
 */
import versionDocument from './generated/version.json';

export interface Version {
    /** The `release/*` tag this build belongs to, or null when it belongs to none. */
    readonly release: string | null;
    /** The full commit sha, or null where the build had no git metadata to read. */
    readonly commit: string | null;
    /** When the build ran, UTC, to the second. */
    readonly built: string;
}

export const version: Version = versionDocument as Version;

/** Where a commit of this repository is read on GitHub. */
export function commitUrl(commit: string): string {
    return `https://github.com/Reefact/justdummies.io/commit/${commit}`;
}

/**
 * The first seven characters, which is how a sha is read aloud and written down, with
 * the whole of it kept for the reader who wants to check it.
 */
export function shortCommit(commit: string): string {
    return commit.slice(0, 7);
}
