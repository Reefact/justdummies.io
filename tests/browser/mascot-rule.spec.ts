import type { Page } from '@playwright/test';

import { expect, test } from './support/harness';

/**
 * The two halves of §5.8 a machine can hold: **one dummy per page**, and **no line of text ever
 * touches one**.
 *
 * WHY A CHECK AT ALL. The rule reads as common sense, and common sense is what drifts: every
 * drawing on this site was argued into place in its own stylesheet, each time from scratch, and
 * none of those arguments can see the next one. The first one to land on a paragraph will do so
 * because a measure moved, a translation grew, or a window nobody tried — never because someone
 * decided to put it there.
 *
 * IT IS COMPARED AGAINST THE PAINTED PIXELS, NOT AGAINST THE CSS. The first version of this file
 * measured the text against the `shape-outside` polygon, and was worth nothing: that polygon is
 * what puts the text where it is, so the two agreed by construction and the check could not fail.
 * What can fail is the polygon drifting from the artwork it was traced off — a recropped drawing,
 * a vertex moved by eye — and that is a claim about ink, so the ink is what it reads. The drawing
 * is decoded into a canvas at the size the page renders it, and its leftmost opaque pixel per row
 * becomes the line no text may cross.
 *
 * That also makes one rule cover two very different placements. The first screen's dummy is an
 * overlay that must not meet text at all; /about's is a float whose box the text is *supposed* to
 * enter — that overlap is what makes the measure follow his lean. Comparing rectangles would fail
 * the second or have to exempt it, which is the same as not checking it. Comparing ink asks both
 * the only question that matters: is there a letter on the drawing?
 *
 * TEXT RECTS, NOT ELEMENTS. A paragraph's box spans the whole measure whatever its lines do; only
 * the lines say where the ink is. They come from a Range over every text node, which is the one
 * thing that reports the boxes a reader actually sees.
 */

/**
 * Every page of the site that carries a drawing, in both locales — a translation's length is a
 * layout input, and the two 404s are here because the rule counts drawings the site owns, not
 * drawings written a particular way.
 */
const PAGES: readonly string[] = ['/', '/fr/', '/about/', '/fr/about/', '/404.html', '/fr/404.html'];

/**
 * WHAT COUNTS AS A DUMMY IS AN ATTRIBUTE, NOT A CLASS NAME. Two of the three are background
 * images on a `div.mascot` and the third is the 404's `img.crash`, so a selector on either name
 * would have counted some of them and quietly ignored the rest — which is how a guard advertised
 * as "one per page" lets a second drawing through. Marking them declares what they are, and a
 * drawing added later without the mark is the one thing this cannot catch; the specification says
 * so at §5.8.
 */
const DUMMY: string = '[data-dummy]';

/*
 * The playground's own dummy carries no mark and is not swept, for a reason worth writing down
 * rather than discovering: it is drawn by the Blazor application after its runtime boots, so a
 * check that opened /playground/ would be asserting §5.8 against another application's markup
 * and waiting on a megabyte of .NET to find out. `playground.spec.ts` owns that page. The rule
 * still binds it — a reviewer holds that half.
 */

/** Wide and tall enough that every drawing the site has is drawn. A window that hides them proves nothing. */
const WINDOW = { width: 2560, height: 1440 } as const;

interface Verdict {
    /** How many dummies the page draws. §5.8 allows one. */
    readonly drawn: number;

    /** Whether the drawing could be read back as pixels — a check that measured nothing must say so. */
    readonly readArtwork: boolean;

    /** The nearest line of text: how far past the artwork's edge it reached, and what it said. */
    readonly worst: { readonly over: number; readonly text: string } | null;
}

async function inspect(page: Page): Promise<Verdict> {
    return page.evaluate(async (selector: string) => {
        const drawn: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>(selector))
            .filter((element: HTMLElement) => getComputedStyle(element).display !== 'none');

        if (drawn.length !== 1) {
            return { drawn: drawn.length, readArtwork: false, worst: null };
        }

        const mascot: HTMLElement = drawn[0];
        const box: DOMRect = mascot.getBoundingClientRect();

        /* A background on the two that hang in a margin, an `img` on the 404, whose drawing is the page. */
        const background: RegExpMatchArray | null = getComputedStyle(mascot).backgroundImage.match(/url\("?([^")]+)"?\)/);
        const file: string | null = background !== null
            ? background[1]
            : (mascot instanceof HTMLImageElement ? mascot.currentSrc : null);

        if (file === null) {
            return { drawn: drawn.length, readArtwork: false, worst: null };
        }

        const artwork: HTMLImageElement = new Image();
        artwork.src = file;
        await artwork.decode();

        /*
         * `contain` inside a box of the artwork's own ratio fills it, which is how both rules are
         * written — but the arithmetic is done rather than assumed, so a later `cover` or a box of
         * another ratio moves this check with the page instead of quietly measuring the wrong place.
         */
        const scale: number = Math.min(box.width / artwork.naturalWidth, box.height / artwork.naturalHeight);
        const width: number = Math.round(artwork.naturalWidth * scale);
        const height: number = Math.round(artwork.naturalHeight * scale);

        const canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context: CanvasRenderingContext2D = canvas.getContext('2d')!;
        context.drawImage(artwork, 0, 0, width, height);

        const pixels: Uint8ClampedArray = context.getImageData(0, 0, width, height).data;

        /** Where the painting starts on each of its own rows, or nothing on a row it does not reach. */
        const inkStartsAt: Array<number | null> = [];

        for (let row = 0; row < height; row++) {
            let first: number | null = null;

            for (let column = 0; column < width; column++) {
                if (pixels[(row * width + column) * 4 + 3] > 8) {
                    first = column;
                    break;
                }
            }

            inkStartsAt.push(first);
        }

        /* Where the drawing sits in the page: centred across, and on the bottom edge or centred down. */
        const [, vertical] = getComputedStyle(mascot).backgroundPosition.split(' ');
        const originX: number = box.left + (box.width - width) / 2;
        const originY: number = vertical?.trim() === '100%' || vertical?.trim() === 'bottom'
            ? box.bottom - height
            : box.top + (box.height - height) / 2;

        let worst: { over: number; text: string } | null = null;
        const walker: TreeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

        for (let node: Node | null = walker.nextNode(); node !== null; node = walker.nextNode()) {
            const content: string = (node.nodeValue ?? '').trim();

            if (content === '') {
                continue;
            }

            /*
             * `.visually-hidden` text is clipped to a point and read only aloud, but it keeps
             * laying out at its natural width — `white-space: nowrap` — so its range still
             * reports a full-length box, wherever the point happens to sit. That box is what
             * this check named first the one time it was made to fail on purpose: a collision
             * with "opens in a new tab", which no reader can see. What gives it away is the
             * clipped ancestor, not the text's own rect, so that is what is looked for.
             */
            let clipped: boolean = false;

            for (let parent: Element | null = node.parentElement; parent !== null; parent = parent.parentElement) {
                const around: DOMRect = parent.getBoundingClientRect();

                if (around.width <= 1 || around.height <= 1) {
                    clipped = true;
                    break;
                }
            }

            if (clipped) {
                continue;
            }

            const range: Range = document.createRange();
            range.selectNodeContents(node);

            for (const line of Array.from(range.getClientRects())) {
                /*
                 * A one-pixel box is `.visually-hidden` — a label a screen reader reads and
                 * nobody sees, clipped to a point that happens to sit under the drawing. Counting
                 * it would report a collision no reader can have, and it is what this check named
                 * first the one time it was made to fail on purpose.
                 */
                if (line.width < 2 || line.height < 2 || line.bottom <= originY || line.top >= originY + height) {
                    continue;
                }

                /*
                 * Every row the line box spans, not its middle: a leaning figure is nearest the
                 * text at one end of a line and furthest at the other, and the middle alone would
                 * miss exactly the case this exists to catch.
                 */
                const from: number = Math.max(0, Math.floor(line.top - originY));
                const to: number = Math.min(height - 1, Math.ceil(line.bottom - originY));

                for (let row = from; row <= to; row++) {
                    const ink: number | null = inkStartsAt[row];

                    if (ink === null) {
                        continue;
                    }

                    const over: number = line.right - (originX + ink);

                    if (worst === null || over > worst.over) {
                        worst = { over: Math.round(over), text: content.slice(0, 60) };
                    }
                }
            }
        }

        return { drawn: drawn.length, readArtwork: true, worst };
    }, DUMMY);
}

for (const path of PAGES) {

    test(`${path} draws exactly one dummy, and no text touches it`, async ({ page }) => {
        await page.setViewportSize(WINDOW);
        await page.goto(path);

        const verdict: Verdict = await inspect(page);

        /*
         * EXACTLY ONE, NOT AT MOST ONE. This window is roomy on purpose, so every page in the list
         * above is meant to draw its dummy here — and an early return on zero was letting the
         * opposite regression through: an element deleted, a scoped style renamed, a media query
         * mistyped, and both /about cases would have passed while drawing nothing at all.
         */
        expect(verdict.drawn, `${path} draws ${verdict.drawn} dummies at ${WINDOW.width}x${WINDOW.height}, and §5.8 asks for exactly one`).toBe(1);

        expect(verdict.readArtwork, `${path} draws a dummy this check could not read back as pixels`).toBe(true);

        expect(
            verdict.worst?.over ?? 0,
            `on ${path} a line of text runs ${verdict.worst?.over}px onto the dummy: "${verdict.worst?.text}"`,
        ).toBeLessThanOrEqual(0);
    });

}
