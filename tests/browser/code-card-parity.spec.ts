import { expect, test } from './support/harness';
import type { Locator, Page } from '@playwright/test';

/**
 * The playground's code card and the landing page's are the same card.
 *
 * WHY THIS IS A TEST AND NOT A COMMENT. Both are drawn from `.code-widget` in the playground's
 * own app.css, so the box, its padding, the bar under it and the button under that are declared
 * once — a shared class already stops those from drifting, and asserting them here would be
 * asserting that CSS applies. What a shared class cannot state is the one thing a visitor
 * actually notices: how wide the card ends up on the page it is on. That is decided by two
 * different documents in two different runtimes — the Astro landing page puts its figure in a
 * 72rem shell, and the Blazor playground has to put its own in the same one rather than in the
 * 60rem column its prose sits in. Nothing in either file mentions the other. This does.
 *
 * WIDTH, NEVER HEIGHT. The hero runs one compiled chain of a fixed shape; the playground's grows
 * a line every time a step is chosen. They are the same card holding different amounts of code,
 * and a height assertion would be a bug the day somebody adds a step to either.
 *
 * TWO REFERENCES, BECAUSE THEY ANSWER DIFFERENT QUESTIONS:
 *
 *   - the LANDING PAGE (`/`) answers "how wide, and how far above the button" — it is the
 *     document whose measure is in question, and its static `.sample` occupies exactly the box
 *     the live widget drops into once "Run" is pressed (LiveHero.astro's `.frame` adds no
 *     padding and the iframe inside it is `width: 100%`);
 *   - the HERO WIDGET ITSELF (`/playground/hero`) answers "the same button" — it and the
 *     playground draw the same label in the same monospace face at the same size, so their
 *     buttons are comparable box for box, which the landing page's own accent-filled "Run" is
 *     not: that one is a different control, in the sans face, saying something else.
 *
 * Every measurement is taken at one viewport, and that is not incidental — the type scale is
 * fluid (`--jd-text-sm` is a `clamp()` with a `vw` term), so a button measured at two widths is
 * two different buttons.
 */
const VIEWPORT = { width: 1280, height: 900 } as const;

/** Sub-pixel layout rounding, and nothing more: every number compared here is meant to be equal. */
const TOLERANCE_PX = 1;

interface Box {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

async function boxOf(locator: Locator, what: string): Promise<Box> {
    const box = await locator.boundingBox();

    if (box === null) {
        throw new Error(`${what} is not rendered`);
    }

    return box;
}

/** The air between the bottom of a card and the top of the row of controls under it. */
function gapBetween(card: Box, controls: Box): number {
    return controls.y - (card.y + card.height);
}

async function colours(locator: Locator): Promise<{ background: string; border: string }> {
    return locator.evaluate((element: Element) => {
        const style = window.getComputedStyle(element);

        return { background: style.backgroundColor, border: style.borderTopColor };
    });
}

/**
 * The playground, loaded and booted.
 *
 * Waiting on the card rather than on a load state: the page ships a pre-runtime shell and
 * replaces it once the WebAssembly runtime arrives, so "the document is ready" is true a good
 * while before there is anything here to measure.
 */
async function openPlayground(page: Page): Promise<void> {
    await page.setViewportSize(VIEWPORT);
    await page.goto('/playground/');
    await expect(page.locator('.playground-widget .card')).toBeVisible();
}

test.describe('the playground card and the landing page card', () => {

    test('are the same width, the same distance above their button, on the same ground', async ({ page }) => {
        await page.setViewportSize(VIEWPORT);
        await page.goto('/');

        // Settled, the way layout.spec.ts and hero-width.spec.ts take their own measurements: a
        // group still holding its starting transform sits somewhere it is about to leave.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForLoadState('networkidle');

        const heroCard: Box = await boxOf(page.locator('.hero-expression .sample'), "the landing page's code sample");
        const heroInvite: Box = await boxOf(page.locator('.hero-expression .invite'), "the landing page's run offer");
        const heroColours = await colours(page.locator('.hero-expression .sample'));

        await openPlayground(page);

        const card: Box = await boxOf(page.locator('.playground-widget .card'), "the playground's code card");
        const controls: Box = await boxOf(page.locator('.playground-widget .controls'), "the playground's controls");
        const cardColours = await colours(page.locator('.playground-widget .card'));

        expect(
            Math.abs(card.width - heroCard.width),
            `the playground's code card is ${card.width}px wide and the landing page's is ${heroCard.width}px`,
        ).toBeLessThanOrEqual(TOLERANCE_PX);

        expect(
            Math.abs(gapBetween(card, controls) - gapBetween(heroCard, heroInvite)),
            'the playground puts its button at a different distance under its card than the landing page does',
        ).toBeLessThanOrEqual(TOLERANCE_PX);

        expect(cardColours, 'the two cards are not drawn on the same ground').toEqual(heroColours);
    });

    test('carry the same Generate button, box for box', async ({ page }) => {
        await page.setViewportSize(VIEWPORT);
        await page.goto('/playground/hero');

        const heroButton: Box = await boxOf(page.locator('.hero-widget .generate'), "the hero widget's button");
        const heroMention: string = (await page.locator('.hero-widget .live').textContent()) ?? '';

        await openPlayground(page);

        // Before any draw, deliberately: the playground's button says "Generate again" once it
        // has drawn something, and a longer label is a wider box for a reason that has nothing
        // to do with the two disagreeing.
        const button: Box = await boxOf(page.locator('.playground-widget .generate'), "the playground's button");

        expect(
            Math.abs(button.width - heroButton.width),
            `the playground's button is ${button.width}px wide and the hero's is ${heroButton.width}px`,
        ).toBeLessThanOrEqual(TOLERANCE_PX);

        expect(
            Math.abs(button.height - heroButton.height),
            `the playground's button is ${button.height}px tall and the hero's is ${heroButton.height}px`,
        ).toBeLessThanOrEqual(TOLERANCE_PX);

        // The same sentence, not a paraphrase of it — both read it out of the same
        // PlaygroundStrings key, and both fill it from the assembly actually loaded.
        await expect(page.locator('.playground-widget .live')).toHaveText(heroMention);
        await expect(page.locator('.playground-widget .live')).toHaveText(/running here, JustDummies \S+/);
        await expect(page.locator('.playground-widget .live')).not.toHaveText(/unknown/);
    });

});
