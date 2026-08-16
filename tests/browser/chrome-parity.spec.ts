import { expect, test, type Page } from '@playwright/test';

/**
 * The site and the playground draw the same page furniture in the same place.
 *
 * They are two applications — Astro renders one, Blazor WebAssembly the other — and they share
 * no markup and no stylesheet, only the design tokens underneath both. Everything above those
 * tokens is a copy: the header, the brand block, the measure the words are set in, the footer.
 * A copy is a thing that drifts, and this one had.
 *
 * Measured before this file existed, at 1440x900, against /fr/why-justdummies/:
 *
 *     the bar          ran the full window instead of the site's 60rem measure, so
 *                      "JustDummies" sat at x=16 against the site's x=248
 *     its links        were three, not four (no "Playground" entry, no rule before the
 *                      language switch) and drawn muted and unlined where the site draws
 *                      them in the accent colour and underlined
 *     the brand        was rendered at the small type size, semi-bold at 700 rather than 600
 *     the mark         was 40 pixels tall against the site's measured 52, and centred on the
 *                      line box rather than hung off the cap line
 *     everything else  sat 103 pixels to the right (a 60rem column against the site's 72rem
 *                      shell) and 17 pixels lower (space-12 of top padding against space-8,
 *                      plus a border under the bar the site does not draw)
 *
 * None of that was visible to any check in this suite: every one of those numbers was internally
 * consistent, and the two halves were simply never measured against each other.
 *
 * So this measures them against each other, and asserts nothing about what the numbers *are*.
 * A maintainer who moves the header on the site moves it here too and this file stays green;
 * a maintainer who moves it on one side only gets told which box, at which window, by how much.
 *
 * WHY /why-justdummies IS THE REFERENCE. It is the page the playground most resembles — a
 * heading, a claim, a subtitle and prose under it, with none of the landing page's full-bleed
 * acts — so its geometry is the geometry the playground is trying to be. Both locales are
 * checked because the header is the one strip whose contents change width with the language:
 * "Pourquoi JustDummies" is wider than "Why JustDummies", and §6.5 calls French the
 * unfavourable case for exactly this reason.
 */
const PAIRS: ReadonlyArray<{ locale: string; site: string; playground: string }> = [
    { locale: 'en', site: '/why-justdummies/', playground: '/playground/' },
    { locale: 'fr', site: '/fr/why-justdummies/', playground: '/playground/?lang=fr' },
];

/**
 * Four windows, chosen for the rules that change between them rather than for coverage: 1440
 * is the plain case, 1280x800 is under the short-screen query that shrinks the brand, 768 is
 * where the shell stops being wider than the window, and 375 is under the narrow query where
 * the bar stacks. Three of the four caught something the day this file was written.
 */
const WINDOWS: ReadonlyArray<{ width: number; height: number }> = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 768, height: 900 },
    { width: 375, height: 900 },
];

/**
 * Where the furniture sits, as one string per box.
 *
 * Rounded to the pixel on purpose. Both pages are laid out from `clamp()`ed type sizes, so a
 * box's height comes out at a fraction the two documents can agree on to the hundredth — but
 * asserting that hundredth would make this file fail on a browser that rounds a glyph
 * differently, which is not the defect it exists to catch.
 */
async function furniture(page: Page): Promise<Record<string, string>> {
    return page.evaluate(() => {
        const at = (selector: string): string => {
            const element: HTMLElement | null = document.querySelector(selector);

            if (element === null) {
                return 'absent';
            }

            const box: DOMRect = element.getBoundingClientRect();

            return `x=${box.x.toFixed(0)} y=${box.y.toFixed(0)} w=${box.width.toFixed(0)} h=${box.height.toFixed(0)} font=${getComputedStyle(element).fontSize} weight=${getComputedStyle(element).fontWeight}`;
        };

        /*
         * The bar's items by where they land rather than by what they say: the two
         * applications translate the same four entries through two different string tables,
         * and it is the row's geometry that has to agree, not the spelling. Their colour comes
         * along because a link drawn muted is a link the reader is not offered — which is what
         * the playground's bar used to do.
         */
        const items: string = Array.from(
            document.querySelectorAll<HTMLElement>('.site-nav > a, .site-nav .divider, .site-nav .language-selector summary'),
        )
            .map((element: HTMLElement) => {
                const box: DOMRect = element.getBoundingClientRect();
                const style: CSSStyleDeclaration = getComputedStyle(element);

                return `${box.x.toFixed(0)}→${box.right.toFixed(0)} @${box.y.toFixed(0)} ${style.color} ${style.textDecorationLine}`;
            })
            .join(' | ');

        return {
            'the bar': at('header.site-header'),
            'the brand in the bar': at('header.site-header .brand'),
            'the items in the bar': items,
            'the brand heading': at('h1[data-brand-heading]'),
            'the mark in it': at('h1[data-brand-heading] .mark'),
            'the claim under it': at('.brand-heading .tagline'),
            'the page’s own subtitle': at('main h2'),
            // The footer's y is the one number that legitimately differs: these are two pages of
            // different lengths, and where the bottom of a page falls is a fact about its
            // content. Its measure and its left edge are not, so only those are compared.
            'the footer’s measure': at('footer.site-footer').replace(/ y=\S+ /, ' ').replace(/ h=\S+/, ''),
        };
    });
}

/**
 * Both halves settle before they are measured, and they settle differently.
 *
 * The site is HTML: the mark's alignment script runs on parse. The playground is a WebAssembly
 * application whose header does not exist until the runtime has booted and its first render has
 * been through JS interop — so waiting for `load` there measures the boot shell, which carries
 * none of this furniture at all. Both are therefore waited for by the thing that is last to
 * happen: the mark receiving the measured height that `1cap` is only the fallback for.
 */
async function settled(page: Page): Promise<void> {
    await page.waitForSelector('h1[data-brand-heading] .mark', { timeout: 30_000 });
    await page.waitForFunction(
        () => document.querySelector<HTMLElement>('h1[data-brand-heading] .mark')?.style.height !== '',
        undefined,
        { timeout: 30_000 },
    );
    await page.waitForSelector('main h2', { timeout: 30_000 });
}

for (const pair of PAIRS) {

    for (const window of WINDOWS) {

        test(`the playground is drawn like ${pair.site} at ${window.width}x${window.height}`, async ({ page }) => {
            await page.setViewportSize(window);

            await page.goto(pair.site);
            await settled(page);
            const reference: Record<string, string> = await furniture(page);

            await page.goto(pair.playground);
            await settled(page);
            const measured: Record<string, string> = await furniture(page);

            const disagreements: string[] = Object.keys(reference)
                .filter((box: string) => reference[box] !== measured[box])
                .map((box: string) => `        ${box}\n          ${pair.site}\n            ${reference[box]}\n          ${pair.playground}\n            ${measured[box]}`);

            expect(
                disagreements,
                `the playground and ${pair.site} do not draw the same page furniture:\n${disagreements.join('\n')}\n`,
            ).toEqual([]);
        });

    }

}
