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

/**
 * The links a chain calls, in order.
 *
 * Read off `.tok-member`, which both sides already emit: the landing page's figure is run
 * through `highlight()` at build time and the widget's expression is written in the same
 * tokens by hand, precisely so the two can be styled by one rule. That makes the method names
 * comparable without either side parsing C#, and it ignores what the visitor can edit — a
 * prefix typed into an `<input>` is not a link.
 */
async function chainOf(expression: Locator): Promise<string[]> {
    return expression.locator('.tok-member').allTextContents();
}

/** Every ASCII character a card can actually show: space (0x20) through `~` (0x7E). */
const PRINTABLE = /^[\x20-\x7E]*$/;

test.describe('the landing page figure and the live widget behind it', () => {

    /**
     * The card a visitor reads and the card that replaces it say the same thing.
     *
     * WHY THIS IS A TEST AND NOT A COMMENT. The measurements below compare the playground with
     * the landing page. This compares the landing page against ITSELF, either side of "Run":
     * `LiveHero.astro` ships a static figure built from the validated snippet
     * (`tools/snippet-validation/Snippets/Hero.cs`, extracted into `snippets.json`), and on the
     * press it sets `[data-hero-static]` hidden and drops `/playground/hero` into its place.
     * The two are one card in the visitor's eyes and two files that never mention each other in
     * ours — one generated from a compiled snippet, one hand-written Blazor.
     *
     * They drifted the day the library's unconstrained draw widened to the whole of ASCII: the
     * snippet was given the constraint that answers it and the widget was not, so the chain on
     * screen lost a link the instant the runtime arrived. Nothing was red. This is the
     * assertion that would have been.
     */
    test('run the same chain, link for link', async ({ page }) => {
        await page.setViewportSize(VIEWPORT);
        await page.goto('/');

        const published: string[] = await chainOf(page.locator('.hero-expression [data-hero-static] pre code'));

        // The comparison is only worth anything if the figure was found at all: an empty list
        // on both sides would agree about nothing.
        expect(published, 'the landing page shows no chain to compare the widget against').not.toEqual([]);

        await page.goto('/playground/hero');
        await expect(page.locator('.hero-widget .expression')).toBeVisible();

        const live: string[] = await chainOf(page.locator('.hero-widget .expression'));

        expect(
            live,
            `the live widget runs ${live.join('.')} where the figure it replaces publishes ${published.join('.')}`,
        ).toEqual(published);
    });

    /**
     * And the value it draws is one the card can render.
     *
     * The chain check above states the rule; this states what breaking it looks like. The
     * widget writes `_value` into `<output>` raw — no quoting, unlike the playground's own
     * result bar — so a control character reaches the page as a control character: a line
     * break mid-value, or a glyph that is simply not there. Twelve draws rather than one
     * because the defect this pins was probabilistic, not constant.
     */
    test('never draw a value the card cannot show', async ({ page }) => {
        await page.setViewportSize(VIEWPORT);
        await page.goto('/playground/hero');

        const value: Locator = page.locator('.hero-widget .result-bar .value');
        const generate: Locator = page.locator('.hero-widget .generate');

        // The widget draws once as it initialises, so the reading before the first press is a
        // draw like any other and is checked like one.
        await expect(value).toBeVisible();

        for (let press = 0; press < 12; press += 1) {
            await expect(value, 'the live hero drew a value the card cannot render').toHaveText(PRINTABLE);
            await generate.click();
        }
    });

    /**
     * And the fields stay usable by the visitor the site is half written for.
     *
     * A literal a caller writes — `StartingWith`'s argument here — is exempt from every
     * character constraint the chain declares (ADR-0079), so under `AlphaNumeric().InUpperCase()`
     * `café-` is not a contradiction at all: the library would draw it exactly as typed, filler
     * included, no refusal. This site is bilingual, so that is the right answer for the library
     * to give.
     *
     * It is still the wrong answer for this widget to *display* unfiltered: a control
     * character reaching the result bar raw is this page failing to render, not a lesson about
     * the library (see the previous test). An accent is not a control character, but `Cap`
     * draws one line around both — printable ASCII only — rather than two rules a visitor would
     * have to tell apart. So the field still strips it and says so.
     */
    test('keep drawing when a visitor types an accent', async ({ page }) => {
        await page.setViewportSize(VIEWPORT);
        await page.goto('/playground/hero');

        const prefix: Locator = page.locator('.hero-widget .expression input[type="text"]').first();
        await expect(prefix).toBeVisible();

        await prefix.fill('café-');
        await page.locator('.hero-widget .generate').click();

        await expect(
            page.locator('.hero-widget .result-bar .refusal'),
            'an accent in the prefix turned the demonstration into a refusal',
        ).toHaveCount(0);
        await expect(page.locator('.hero-widget .result-bar .value')).toHaveText(PRINTABLE);

        // Dropped, but never in silence: the hint is what makes the field honest about it.
        await expect(prefix).toHaveValue('caf-');
        await expect(page.locator('.hero-widget #cap-hint')).toContainText(/printable ASCII/i);
    });

    /**
     * And a disabled Generate always has a reason on screen.
     *
     * Two number fields can be invalid at once now, where the one field this replaced never
     * could be — WithLengthBetween's minimum and maximum are independent, unlike the single
     * length before them. #cap-hint has one owner, so fixing one field's own complaint calls
     * ClearHint for it; if the *other* field is still empty, that clears the only sentence on
     * the page explaining why Generate stays disabled, on a visitor's cue that nothing is
     * required of them.
     */
    test('keeps a bound named when its sibling is fixed and it is still empty', async ({ page }) => {
        await page.setViewportSize(VIEWPORT);
        await page.goto('/playground/hero');

        const numbers: Locator = page.locator('.hero-widget .expression input[type="number"]');
        const min: Locator = numbers.nth(0);
        const max: Locator = numbers.nth(1);
        await expect(max).toBeVisible();

        await min.fill('');
        await max.fill('');
        await max.fill('15');

        await expect(page.locator('.hero-widget .generate')).toBeDisabled();
        await expect(
            page.locator('.hero-widget #cap-hint'),
            'Generate is disabled and nothing on the page says why',
        ).not.toBeEmpty();
        await expect(min).toHaveAttribute('aria-describedby', 'cap-hint');
    });

});

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
        await expect(page.locator('.playground-widget .live')).toHaveText(/Runs locally in your browser with JustDummies \S+/);
        await expect(page.locator('.playground-widget .live')).not.toHaveText(/unknown/);
    });

});
