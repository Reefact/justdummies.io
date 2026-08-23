/**
 * The `docs` collection: the library's handwritten user documentation, mirrored under
 * `/docs` (specification §7.2, §7.5). `scripts/generate-docs.mjs` is the only writer of
 * `src/content/docs/**` — every file there is generated, atomic and pinned to a release
 * tag the same way `src/generated/release-notes/` is, and is committed rather than built
 * on the fly for the same reason (ADR-0013).
 *
 * The schema is deliberately narrow: everything a page needs to render one topic and place
 * it in its section's order, nothing a page would otherwise have hard-coded.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
    // The default id Astro's glob loader would pick is the frontmatter `slug` field when
    // one exists — which every topic here has, and shares with its own locale twin, so
    // every pair collided under one id. The file's own path, `<locale>/<section>/<slug>`,
    // is unique by construction and is what every page already keys lookups on.
    loader: glob({ pattern: '**/*.md', base: './src/content/docs', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
    schema: z.object({
        title: z.string(),
        section: z.enum(['guides', 'generators', 'packages', 'analyzers']),
        slug: z.string(),
        order: z.number(),
        locale: z.enum(['en', 'fr']),
        /** The file this topic was mirrored from, at the pinned tag — `JustDummies/doc/…`. */
        sourcePath: z.string(),
        /** The same file, as a GitHub blob URL pinned to `ref`. Where a correction belongs. */
        sourceUrl: z.string(),
        /** The tag this section's snapshot is pinned to. */
        ref: z.string(),
    }),
});

export const collections = { docs };
