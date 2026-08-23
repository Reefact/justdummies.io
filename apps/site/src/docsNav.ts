/**
 * The `/docs` section's own map: which sections exist, and which topic lives in each, in
 * reading order.
 *
 * This mirrors `TOPICS` in `scripts/generate-docs.mjs` — the generator is the source of
 * truth for what actually got mirrored, this is the small, static shape a page needs to
 * lay out a section's sidebar without reading the content collection asynchronously
 * everywhere one is built. A topic the generator drops without this list being updated
 * would 404 its own nav entry; `tests/browser/` following every docs link is what would
 * catch that going out of sync, the same way nothing else here re-derives this by hand.
 */
export const DOCS_SECTIONS = ['guides', 'generators', 'packages', 'analyzers'] as const;

export type DocsSection = (typeof DOCS_SECTIONS)[number];

export const DOCS_TOPICS: Record<DocsSection, string[]> = {
    guides: ['getting-started', 'core-concepts', 'design-principles', 'composition', 'reproducibility', 'errors-and-conflicts', 'inspecting-a-pool', 'faq'],
    generators: ['numbers', 'strings', 'dates-and-times', 'collections', 'enums-and-choices', 'guids-and-uris'],
    packages: ['justdummies', 'justdummies-xunit', 'justdummies-diagnosticcatalog', 'justdummies-cli'],
    analyzers: Array.from({ length: 33 }, (_, index) => `JD${String(index + 1).padStart(3, '0')}`),
};

export function isDocsSection(value: string): value is DocsSection {
    return (DOCS_SECTIONS as readonly string[]).includes(value);
}
