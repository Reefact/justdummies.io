/**
 * A date written the way the reader's own locale writes one.
 *
 * Every date the site displays is stored once, in ISO, and spelled per locale here — never
 * stored twice, once per language. "2026-08-19" is a fact; "19 August 2026" and "19 août
 * 2026" are two spellings of it, and a repository that keeps both eventually keeps two
 * different days (§2).
 *
 * It lives in `i18n/` rather than beside any one of its callers because more than one thing
 * dates a release now: the library's release-notes pages, mirrored from another repository,
 * and this site's own note on /version. Neither owns the other's formatter.
 */
import type { Locale } from './ui';

/** Built once per locale rather than once per date: a release-notes page formats one for
 *  every release it holds, and `Intl.DateTimeFormat` is the expensive half. */
const dateFormats = new Map<Locale, Intl.DateTimeFormat>();

export function formatReleaseDate(iso: string, locale: Locale): string {
    let format = dateFormats.get(locale);

    if (format === undefined) {
        format = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
        });
        dateFormats.set(locale, format);
    }

    return format.format(new Date(iso));
}
