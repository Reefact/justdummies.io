/**
 * Locale-aware routing.
 *
 * The specification fixes two rules that this module implements and depends on:
 * route segments are **identical in every locale** (no `/fr/pourquoi-justdummies`),
 * and the default locale is **not prefixed** (§7.1, §7.2). Together they mean a
 * path can be translated by adding or removing one segment, which is what makes a
 * language selector that stays on the current page possible at all.
 *
 * The third rule is §7.4: a page exists in a locale only if it is really
 * translated there. Rather than maintain a list of which pages exist where — a
 * list that would go stale on the first page added — the set of routes is read
 * from the page files themselves at build time.
 */
import { majorSlug, publishedMajors } from '../release-notes';
import { DOCS_SECTIONS, DOCS_TOPICS } from '../docsNav';
import { defaultLocale, locales, type Locale } from './ui';

/**
 * The page files, listed but never imported: only the keys are read. A lazy glob
 * is deliberate — an eager one would import every page, and pages import the
 * layout, which imports this module.
 */
const pageModules = import.meta.glob('/src/pages/**/*.{astro,md,mdx}');

/**
 * The routes a page file spells out on its own — every page whose path is its file
 * name, which is all of them but the release notes.
 */
const fileRoutes: string[] = Object.keys(pageModules)
    .filter(function isNotParameterised(file: string): boolean {
        // `/src/pages/release-notes/[train]/[major].astro` names no route by itself;
        // the routes it stands for are added below, from the same snapshot its own
        // `getStaticPaths` reads.
        return !file.includes('[');
    })
    .map(function toRoute(file: string): string {
        const withoutRoot = file.replace(/^\/src\/pages/, '');
        const withoutExtension = withoutRoot.replace(/\.(astro|md|mdx)$/, '');
        const withoutIndex = withoutExtension.replace(/\/index$/, '/');

        return withoutIndex.endsWith('/') ? withoutIndex : `${withoutIndex}/`;
    });

/**
 * The release notes' own routes, one per train and major (ADR-0020), in every locale.
 *
 * This is the deliberate teaching the paragraph above used to say a dynamic route would
 * need: a parameterised path cannot be resolved from a file name, so a section built with
 * one is invisible to the glob, and what goes missing is not the page — Astro still builds
 * it — but the language selector, which offers a locale only for a route it knows about
 * (§7.4). Both locales always exist together here, because the generator refuses a major
 * whose two languages disagree.
 */
const releaseNotesRoutes: string[] = locales.flatMap(function inLocale(locale: Locale): string[] {
    return publishedMajors.map(function toRoute(published: { train: string; major: number }): string {
        const route = `/release-notes/${published.train}/${majorSlug(published.major)}/`;

        return locale === defaultLocale ? route : `/${locale}${route}`;
    });
});

/**
 * `/docs`'s own routes — one section index and one topic page per entry of `docsNav.ts`,
 * in every locale. Parameterised the same way `[train]/[major].astro` is, so invisible to
 * the glob above for the same reason (§7.4).
 */
const docsRoutes: string[] = locales.flatMap(function inLocale(locale: Locale): string[] {
    const prefix = locale === defaultLocale ? '' : `/${locale}`;
    const sectionRoutes = DOCS_SECTIONS.map((section) => `${prefix}/docs/${section}/`);
    const topicRoutes = DOCS_SECTIONS.flatMap((section) => DOCS_TOPICS[section].map((slug) => `${prefix}/docs/${section}/${slug}/`));

    return [...sectionRoutes, ...topicRoutes];
});

/** Known routes, normalised to a leading and trailing slash. */
const knownRoutes: ReadonlySet<string> = new Set([...fileRoutes, ...releaseNotesRoutes, ...docsRoutes]);

function segmentsOf(pathname: string): string[] {
    return pathname.split('/').filter(function isNotEmpty(segment: string): boolean {
        return segment.length > 0;
    });
}

function isLocalePrefix(segment: string | undefined): segment is Locale {
    // The default locale is never a prefix, so `/en/…` is not a locale path but an
    // ordinary route that happens to start with those two letters.
    return segment !== undefined && segment !== defaultLocale && (locales as readonly string[]).includes(segment);
}

/** The locale a path is served in, which is the default one unless a prefix says otherwise. */
export function localeFromPath(pathname: string): Locale {
    const first = segmentsOf(pathname)[0];

    return isLocalePrefix(first) ? first : defaultLocale;
}

/** The path with its locale prefix removed: the part that is the same in every locale. */
export function routeWithoutLocale(pathname: string): string {
    const parts = segmentsOf(pathname);

    if (isLocalePrefix(parts[0])) {
        parts.shift();
    }

    return parts.length > 0 ? `/${parts.join('/')}/` : '/';
}

/** The same page, served in another locale. */
export function pathForLocale(pathname: string, target: Locale): string {
    const route = routeWithoutLocale(pathname);

    return target === defaultLocale ? route : `/${target}${route}`;
}

/**
 * The locales this particular page really exists in.
 *
 * This is what keeps §7.4 honest: an untranslated page is not offered in the
 * selector and is not announced by an `hreflang`, rather than being linked to a
 * 404 or to a page in the wrong language.
 */
export function translatedLocales(pathname: string): Locale[] {
    return locales.filter(function existsInLocale(locale: Locale): boolean {
        return knownRoutes.has(pathForLocale(pathname, locale));
    });
}
