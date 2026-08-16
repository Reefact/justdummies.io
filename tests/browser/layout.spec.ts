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
for (const path of PAGES.concat(
    '/playground/',
    '/about',
    '/fr/about',
    '/privacy',
    '/fr/privacy',
    '/why-justdummies',
    '/fr/why-justdummies',
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

            const overflow: { scrollWidth: number; clientWidth: number } = await page.evaluate(() => ({
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
            }));

            expect(
                overflow.scrollWidth,
                `${path} is ${overflow.scrollWidth - overflow.clientWidth}px wider than its viewport at ${width}px`,
            ).toBeLessThanOrEqual(overflow.clientWidth);
        });

    }

}

test('names the element that overflows, when one does', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // Not an assertion about the page so much as about this file: an overflow reported as a
    // number is a bug report nobody can act on. This walks the document and returns the
    // elements that stick out, so a red run says which one — and it is checked against a
    // deliberately over-wide element, so the walk itself is known to work.
    const culprits: string[] = await page.evaluate(() => {
        const injected: HTMLElement = document.createElement('div');

        injected.id = 'deliberately-too-wide';
        injected.style.width = '3000px';
        injected.style.height = '1px';
        document.body.appendChild(injected);

        const limit: number = document.documentElement.clientWidth;

        return Array.from(document.querySelectorAll<HTMLElement>('body *'))
            .filter((element: HTMLElement) => element.getBoundingClientRect().right > limit + 1)
            .map((element: HTMLElement) => element.id || element.className || element.tagName)
            .slice(0, 10);
    });

    expect(culprits, 'the overflow walk found nothing while an element three times the viewport was on the page')
        .toContain('deliberately-too-wide');
});
