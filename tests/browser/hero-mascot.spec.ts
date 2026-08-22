import type { Page } from '@playwright/test';

import { expect, test } from './support/harness';

/**
 * The dummy standing on the first screen is drawn only where the page has room for it, and
 * fetched only where it is drawn.
 *
 * BOTH HALVES ARE PROMISES THE STYLESHEET MAKES IN PROSE, and neither is visible in the
 * artefact: the rule that hides it and the rule that fetches it are the same media query, so
 * a later edit that splits them — an `<img>` for the width attribute, a `visibility: hidden`
 * for a transition — would keep the drawing off small screens while still making every phone
 * pay for it. That regression looks like nothing at all on screen, which is why it is checked
 * here rather than left to a reviewer.
 *
 * WHAT "ROOM" MEANS is the geometry the second group measures. The figure hangs in the space
 * the hero's two auto margins open up, and the numbers behind its size were taken off this
 * same built page; a change to the card above, to the install block below, or to either
 * locale's line count moves them. The checks are written against what must stay true —
 * clear of the card, clear of the install block, inside the page — rather than against the
 * pixel values themselves, which would fail on every deliberate change and say nothing.
 */

/** The artwork's file name, as the media query asks for it. */
const ARTWORK: string = 'dummy-look-at-this.webp';

/** The one height the figure is ever drawn at. It does not scale; below its room it is absent. */
const FIGURE: number = 300;

/**
 * Windows with no room: too short for the figure, or too narrow for the column it stands in.
 * 1920x1200 is here on purpose — it is a large desktop by any measure, and its free box is
 * exactly 300 pixels, which would put the figure's head on the card. A window can be big and
 * still not be big enough, and that is the case a threshold picked by eye gets wrong.
 */
const CRAMPED: ReadonlyArray<readonly [number, number]> = [
    [1440, 900],
    [1920, 1080],
    [1920, 1200],
    [1199, 1400],
];

/** Windows the query draws on: the threshold itself, a 1440p screen's real viewport, and a full 1440. */
const ROOMY: ReadonlyArray<readonly [number, number]> = [
    [1200, 1280],
    [2560, 1306],
    [2560, 1440],
];

interface Box {
    readonly top: number;
    readonly bottom: number;
    readonly left: number;
    readonly right: number;
}

interface Screen {
    readonly drawn: boolean;
    readonly mascot: Box | null;
    readonly expression: Box;
    readonly install: Box;
    readonly offer: Box;
    readonly cue: Box;
}

async function firstScreen(page: Page): Promise<Screen> {
    return page.evaluate(() => {
        const box = (selector: string): Box => {
            const rect: DOMRect = document.querySelector(selector)!.getBoundingClientRect();

            return {
                top:    Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                left:   Math.round(rect.left),
                right:  Math.round(rect.right),
            };
        };

        const mascot: HTMLElement = document.querySelector<HTMLElement>('.mascot')!;
        const drawn: boolean = getComputedStyle(mascot).display !== 'none';

        return {
            drawn,
            mascot:     drawn ? box('.mascot') : null,
            expression: box('.hero-expression'),
            install:    box('.hero .install'),
            offer:      box('.offer'),
            cue:        box('.cue'),
        };
    });
}

/** Whether the page asked for the artwork at any point while it loaded. */
function watchForArtwork(page: Page): () => boolean {
    let asked: boolean = false;

    page.on('request', (request) => {
        if (request.url().includes(ARTWORK)) {
            asked = true;
        }
    });

    return () => asked;
}

for (const [width, height] of CRAMPED) {

    test(`a ${width}x${height} window is given no dummy, and fetches none`, async ({ page }) => {
        const fetched: () => boolean = watchForArtwork(page);

        await page.setViewportSize({ width, height });
        await page.goto('/');

        const screen: Screen = await firstScreen(page);

        expect(screen.drawn, `the dummy was drawn at ${width}x${height}, where the page has no room for it`).toBe(false);
        expect(fetched(), `${ARTWORK} was downloaded at ${width}x${height}, where nothing draws it`).toBe(false);
    });

}

for (const path of ['/', '/fr/']) {

    for (const [width, height] of ROOMY) {

        test(`${path} stands the dummy clear of everything at ${width}x${height}`, async ({ page }) => {
            const fetched: () => boolean = watchForArtwork(page);

            await page.setViewportSize({ width, height });
            await page.goto(path);

            const screen: Screen = await firstScreen(page);

            expect(screen.drawn, `no dummy at ${width}x${height}, where the page has room for one`).toBe(true);
            expect(fetched(), `${ARTWORK} was not downloaded at ${width}x${height}, where it is drawn`).toBe(true);

            const mascot: Box = screen.mascot!;

            /*
             * ONE SIZE, ON EVERY WINDOW THAT DRAWS IT. This is the promise the earlier
             * `clamp()` broke: between 1280 and 1440 the box grows by 80 pixels, and none of
             * them reach the figure. Asserted as an exact number rather than a range, because
             * "it did not shrink" is the whole claim and a range would let it shrink a little.
             */
            expect(mascot.bottom - mascot.top, 'the dummy changed size with the window').toBe(FIGURE);

            /*
             * Clear of the expression above it. The stylesheet budgets 40 of these pixels for
             * the card growing after the visitor presses Run — a refusal is taller than a
             * value — so what is asserted is the whole margin, not the part left over.
             */
            expect(
                mascot.top - screen.expression.bottom,
                'the dummy is against the card the first screen exists to show',
            ).toBeGreaterThanOrEqual(32);

            /* Clear of the install block, which is what the free column is free of. */
            expect(mascot.left, 'the dummy overlaps the install block').toBeGreaterThan(screen.install.right);

            /* Inside the page, and standing on the block's own bottom line rather than near it. */
            expect(mascot.right, 'the dummy sticks out past the first screen').toBeLessThanOrEqual(screen.offer.right + 1);
            expect(Math.abs(mascot.bottom - screen.offer.bottom), 'the dummy floats off the line it stands on').toBeLessThanOrEqual(1);

            /* And never over the one control this screen ends on. */
            const acrossTheCue: boolean = mascot.left < screen.cue.right && mascot.right > screen.cue.left;

            expect(
                acrossTheCue && mascot.bottom > screen.cue.top,
                'the dummy covers the chevron that invites the reader on',
            ).toBe(false);
        });

    }

}
