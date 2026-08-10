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
import { defaultLocale, locales, type Locale } from './ui';

/**
 * The page files, listed but never imported: only the keys are read. A lazy glob
 * is deliberate — an eager one would import every page, and pages import the
 * layout, which imports this module.
 */
const pageModules = import.meta.glob('/src/pages/**/*.{astro,md,mdx}');

/**
 * Known routes, normalised to a leading and trailing slash.
 *
 * Dynamic routes (`[slug].astro`) are not handled: none exist yet, and a
 * parameterised path cannot be resolved from a file name alone. Adding one means
 * teaching this function about it — deliberately, rather than by discovering that
 * a language selector quietly stopped appearing.
 */
const knownRoutes: ReadonlySet<string> = new Set(
    Object.keys(pageModules).map(function toRoute(file: string): string {
        const withoutRoot = file.replace(/^\/src\/pages/, '');
        const withoutExtension = withoutRoot.replace(/\.(astro|md|mdx)$/, '');
        const withoutIndex = withoutExtension.replace(/\/index$/, '/');

        return withoutIndex.endsWith('/') ? withoutIndex : `${withoutIndex}/`;
    }),
);

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
