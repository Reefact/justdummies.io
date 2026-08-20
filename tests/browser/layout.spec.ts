import type { Page } from '@playwright/test';

import { expect, test } from './support/harness';

import { PAGES } from './support/watch';

/**
 * Nothing on the page is wider than the page.
 *
 * A horizontal scrollbar was reported on a desktop and measured absent twice before the
 * cause was found: `100vw` includes the width of a classic scrollbar, and the browser doing
 * the measuring drew overlay scrollbars that take no width at all. The page was wrong and
 * the measurement said it was fine, which is the worst of the two failures.
 *
 * So the measurement here is `scrollWidth` against `clientWidth` on the document element.
 * That comparison is about the content and the box that holds it; it does not care what kind
 * of scrollbar the browser draws, so it cannot be fooled the way the earlier one was.
 */
const WIDTHS: readonly number[] = [320, 360, 768, 1024, 1280, 1440];

interface Overflow {
    readonly scrollWidth: number;
    readonly limit: number;
    readonly scrolledBy: number;
    readonly culprits: readonly string[];
}

/*
 * WHY THE LIMIT IS `getBoundingClientRect().width` AND NOT `clientWidth`.
 *
 * base.css gives the document `scrollbar-gutter: stable`, so a page with no scrollbar drawn
 * still has that gutter reserved — and `clientWidth` counts it while the layout cannot use it.
 * The gap is 15px under this project's Desktop Chrome, in the direction that hides bugs: the
 * release notes index scored -7 here at 375px while really scrolling 8px, a clean pass on a
 * page a visitor can push sideways with a thumb. The rect is the box the layout actually got.
 *
 * The docstring above says this comparison "cannot be fooled the way the earlier one was".
 * It could, by this site's own stylesheet, which is why `scrolledBy` is now asked first.
 */
async function measureOverflow(page: Page): Promise<Overflow> {
    return page.evaluate(() => {
        const root: HTMLElement = document.documentElement;
        const limit: number = root.getBoundingClientRect().width;

        const before: number = window.scrollX;
        window.scrollTo(99_999, window.scrollY);
        const scrolledBy: number = Math.round(window.scrollX);
        window.scrollTo(before, window.scrollY);

        /*
         * Outermost offenders only. An over-wide element takes every descendant out with it, and
         * a list opening with 38 children of the one box that is actually wrong is a bug report
         * nobody reads to the end.
         */
        const over: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('body *'))
            .filter((element: HTMLElement) => element.getBoundingClientRect().right > limit + 1);

        const names: string[] = over
            .filter((element: HTMLElement) => !over.includes(element.parentElement as HTMLElement))
            .map((element: HTMLElement) => element.id || element.className || element.tagName);

        // Deduplicated, because four cards of one grid are one bug wearing four names.
        const culprits: string[] = Array.from(new Set(names)).slice(0, 6);

        return { scrollWidth: root.scrollWidth, limit, scrolledBy, culprits };
    });
}

function describe(culprits: readonly string[]): string {
    return culprits.length === 0 ? 'no element sticks out, so the overflow is the document itself' : `widest: ${culprits.join(', ')}`;
}

/*
 * The 404s are in the sweep because their drawing takes the full width of the page. An image
 * told to fill its container is the ordinary way a page starts scrolling sideways on a
 * phone, and this is the page nobody visits on purpose to find out.
 *
 * `/about` and `/privacy` are here for the same reason as in accessibility.spec.ts: reachable
 * from the sitewide footer, so covered like any other real page rather than left an orphan
 * the way `/version` deliberately is.
 */
/*
 * `/why-justdummies` is in the sweep for a reason of its own, and it is the page most
 * likely to break this: it carries a five-column grid, ten code-bearing criterion blocks
 * and a list of raw source URLs, each of which is a way to be wider than a phone. One of
 * them was — a repository URL is one unbreakable word, and it took the whole document
 * sideways at 360px before `overflow-wrap` was put on the list that holds them.
 */
/*
 * The release notes routes are named here rather than added to PAGES, and the distinction is
 * load-bearing: hero-width.spec.ts and without-script.spec.ts sweep PAGES too, and they assert
 * furniture only the landing page has — `#act-one .sample`, `[data-tablist]` — so a release
 * notes route in PAGES is not a wider sweep, it is those files going red on absent controls,
 * and a duplicate test title aborts the whole run. These are the same four strings
 * accessibility.spec.ts already lists, for the same reason.
 *
 * They are here because they were not, and it cost the section two overflows. The bullets on a
 * major page held their card open by 34px at 320px and shipped; the index held its own by 63px
 * and was still live months later. Neither page had ever been measured at a phone width by
 * anything in this repository.
 */
for (const path of PAGES.concat(
    '/playground/',
    '/about',
    '/fr/about',
    '/privacy',
    '/fr/privacy',
    '/why-justdummies',
    '/fr/why-justdummies',
    '/release-notes',
    '/fr/release-notes',
    '/release-notes/lib/v1/',
    '/fr/release-notes/lib/v1/',
    '/404.html',
    '/fr/404.html',
)) {

    for (const width of WIDTHS) {

        test(`${path} does not scroll sideways at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto(path);

            // After the reveal, not before: a group still holding its starting `translateY`
            // is in a different position from the one it settles in, and the page is meant to
            // be measured settled.
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            await page.waitForLoadState('networkidle');

            const overflow = await measureOverflow(page);

            /*
             * What a visitor can actually do, asked first, because it is the one measurement
             * with no theory behind it: scroll the document right and see whether it moves.
             */
            expect(
                overflow.scrolledBy,
                `${path} scrolls ${overflow.scrolledBy}px sideways at ${width}px — ${describe(overflow.culprits)}`,
            ).toBe(0);

            expect(
                overflow.scrollWidth,
                `${path} is ${overflow.scrollWidth - overflow.limit}px wider than its viewport at ${width}px — ${describe(overflow.culprits)}`,
            ).toBeLessThanOrEqual(overflow.limit);
        });

    }

}

test('names the element that overflows, when one does', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // Not an assertion about the page so much as about this file: an overflow reported as a
    // number is a bug report nobody can act on. The sweep above names the element instead, and
    // this is that walk — the same function, not a second copy of it — run against a
    // deliberately over-wide element so the walk itself is known to work.
    await page.evaluate(() => {
        const injected: HTMLElement = document.createElement('div');

        injected.id = 'deliberately-too-wide';
        injected.style.width = '3000px';
        injected.style.height = '1px';
        document.body.appendChild(injected);
    });

    const overflow = await measureOverflow(page);

    expect(overflow.culprits, 'the overflow walk found nothing while an element three times the viewport was on the page')
        .toContain('deliberately-too-wide');

    // And that it reports the box that is wrong rather than everything that box drags with it.
    expect(overflow.culprits.length, `the walk named ${overflow.culprits.length} elements for one over-wide div: ${overflow.culprits.join(', ')}`)
        .toBe(1);
});
