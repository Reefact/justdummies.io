import { expect, test, type Page, type Response } from '@playwright/test';

/**
 * The page a visitor gets for an address that is not there.
 *
 * It is the one page of this site nobody navigates to on purpose, which is exactly why it
 * is worth checking in a browser: it is served by the host rather than linked, under a URL
 * that does not exist, and every earlier check in this repository reads pages by their own
 * addresses. A 404 that stopped being served, or stopped carrying its picture, would look
 * fine everywhere except where it is met.
 */
const PAGES: ReadonlyArray<{ path: string; home: string; refusal: string; claim: RegExp }> = [
    {
        path: '/404.html',
        home: '/',
        refusal: 'Page not found',
        claim: /Just dummies — but seriously powerful ones\./,
    },
    {
        path: '/fr/404.html',
        home: '/fr/',
        refusal: 'Page introuvable',
        claim: /Juste des dummies, mais redoutablement efficaces\./,
    },
];

async function topOf(page: Page, selector: string): Promise<number> {
    const box = await page.locator(selector).boundingBox();

    expect(box, `${selector} has no box on this page`).not.toBeNull();

    return box!.y;
}

for (const { path, home, refusal, claim } of PAGES) {

    test(`${path} says whose site refused, in the reader's language`, async ({ page }) => {
        await page.goto(path);

        // A visitor here arrived by an address that does not exist and may have no idea
        // whose site turned them away. The brand is the same component the landing page and
        // /version use, so this also says the three have not drifted apart.
        await expect(page.locator('h1')).toHaveText(/JustDummies/);
        await expect(page.locator('.mark')).toBeVisible();
        await expect(page.locator('.tagline')).toHaveText(claim);

        // The refusal is the h2 under it, not a second h1: the page is about JustDummies,
        // and what it says about itself is that this address holds nothing.
        await expect(page.getByRole('heading', { level: 2, name: refusal })).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    });

    test(`${path} shows the dummy between the sentence and the way out`, async ({ page }) => {
        await page.goto(path);

        const image = page.locator('img.crash');

        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute('src', '/404.png');

        // Where it sits is the requirement, not merely that it is on the page. Measured on
        // the rendered page rather than read from the markup, because a stylesheet can move
        // a picture the DOM order says is in the right place.
        const sentence: number = await topOf(page, '.body');
        const drawing: number = await topOf(page, 'img.crash');
        // Scoped to `main`: the site header's brand points home too, and it sits above
        // everything here — comparing against that one would pass whatever the page did.
        const wayOut: number = await topOf(page, `main a[href="${home}"]`);

        expect(drawing, 'the drawing is above the sentence it follows').toBeGreaterThan(sentence);
        expect(wayOut, 'the way out is above the drawing it follows').toBeGreaterThan(drawing);
    });

    test(`${path} draws it whole, at the file's own shape`, async ({ page }) => {
        await page.goto(path);

        const natural: { width: number; height: number } = await page
            .locator('img.crash')
            .evaluate((image: HTMLImageElement) => ({ width: image.naturalWidth, height: image.naturalHeight }));

        // A file that failed to decode reports zero, and an `img` whose source 404s is still
        // "visible" to a layout check — this is what tells the two apart from a picture that
        // actually arrived.
        expect(natural, 'the drawing did not arrive').toEqual({ width: 1253, height: 637 });

        const box = await page.locator('img.crash').boundingBox();
        const ratio: number = box!.width / box!.height;

        expect(ratio, 'the drawing is being stretched').toBeCloseTo(1253 / 637, 1);
    });

}

test('an address that does not exist is answered by that page', async ({ page }) => {
    const response: Response | null = await page.goto('/there-is-nothing-here');

    // The host's own rule (`not_found_handling`), not a link anybody follows. It is asserted
    // because the page above can be perfect while nothing routes a visitor to it.
    expect(response?.status(), 'an unknown address did not answer 404').toBe(404);

    await expect(page.locator('img.crash')).toBeVisible();
});

test('the 404 says what it costs', async ({ page }) => {
    const bytes: number[] = [];

    page.on('response', async (response: Response) => {
        try {
            bytes.push((await response.body()).length);
        } catch {
            // A response the browser kept no body for.
        }
    });

    await page.goto('/404.html');
    await page.waitForLoadState('networkidle');

    const total: number = bytes.reduce((sum: number, length: number) => sum + length, 0);

    // Printed rather than budgeted, and the difference is deliberate. The drawing is a
    // supplied file and its weight is the maintainer's call, not this suite's; what a check
    // can honestly do is make the number visible on every run instead of leaving it to be
    // discovered. The landing page's images are budgeted next door, where the figure is the
    // suite's business.
    console.log(`      /404.html weighs ${(total / 1024).toFixed(0)} KiB, of which the drawing is 710 KiB`);

    expect(total).toBeGreaterThan(0);
});
