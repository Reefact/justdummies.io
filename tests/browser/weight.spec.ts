import { expect, test, type Response } from '@playwright/test';

import { PAGES } from './support/watch';

/**
 * What the first view actually costs, in the only place that can say: the browser.
 *
 * `check-budgets.sh` reads the artefact and budgets the landing page's JavaScript, the file
 * count and the largest asset. None of those noticed that the mark in the heading was a
 * 512-pixel PNG of 173 KiB drawn at 32 CSS pixels — it broke no budget, it was not the
 * largest file in the artefact, and on disk it looked like one icon among several.
 *
 * Measured before the fix: 268.1 KiB for the first view, of which 173.0 KiB was that one
 * file — 65% of everything a visitor downloaded to read the page. After: 103.4 KiB, of which
 * 8.1 KiB is the mark, fetched once for the heading and once as the tab icon.
 *
 * So the budget lives here, where the fetching happens.
 */

/**
 * Room for the 128 that a three-times screen takes, and for a second image somebody adds
 * later, and nothing like room for a 173 KiB one. The number is deliberately not the
 * measurement plus a hair: a budget that fails on every ordinary change gets raised without
 * being thought about, which is worse than not having one.
 */
const MAX_IMAGE_KIB: number = 32;

for (const path of PAGES) {

    test(`${path} draws its first view without heavy images`, async ({ page }) => {
        const images: Array<{ url: string; bytes: number }> = [];

        page.on('response', async (response: Response) => {
            const url: string = new URL(response.url()).pathname;

            if (!/\.(png|ico|jpe?g|svg|webp|gif|avif)$/.test(url)) {
                return;
            }

            try {
                images.push({ url, bytes: (await response.body()).length });
            } catch {
                // A response whose body the browser did not keep — nothing to weigh.
            }
        });

        await page.goto(path);
        await page.waitForLoadState('networkidle');

        const total: number = images.reduce((sum: number, image) => sum + image.bytes, 0);
        const kib: number = total / 1024;

        // Printed on every run, passing or not: a budget nobody can see is a budget nobody
        // tunes, which is the same reason check-budgets.sh prints its figures.
        console.log(`      ${path} first view: ${kib.toFixed(1)} KiB of images / ${MAX_IMAGE_KIB} KiB`);

        const inventory: string = images.map((image) => `${image.url} ${(image.bytes / 1024).toFixed(1)} KiB`).join(', ');

        expect(kib, `${path} downloaded ${kib.toFixed(1)} KiB of images: ${inventory}`).toBeLessThanOrEqual(MAX_IMAGE_KIB);
    });

    test(`${path} does not fetch the 512-pixel mark`, async ({ page }) => {
        const asked: string[] = [];

        page.on('request', (request) => {
            asked.push(new URL(request.url()).pathname);
        });

        await page.goto(path);
        await page.waitForLoadState('networkidle');

        // Named rather than left to the budget above, because this is the specific mistake:
        // the file is the right artwork at the wrong size, so it looks correct everywhere
        // except on the wire. It stays in the artefact as the master, under a name that says
        // which size it is; nothing a visitor loads should reach for it.
        //
        // The name matters to this assertion more than it looks. It first read
        // `/favicon.png`, and the rename that followed would have left it asserting the
        // absence of a path that could no longer exist — a check that cannot fail, which is
        // worse than no check because it still reports green.
        expect(asked, `${path} still reaches for /favicon-512.png`).not.toContain('/favicon-512.png');
    });

}

test('takes the sharper file when the screen is worth it', async ({ browser }) => {
    const context = await browser.newContext({ deviceScaleFactor: 3, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const asked: string[] = [];

    page.on('request', (request) => {
        asked.push(new URL(request.url()).pathname);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The other half of the decision, and the half a size check alone would let rot: the
    // heading renders the mark at 32 CSS pixels, so a three-times screen needs 96 and the
    // 64 would be visibly soft. The `srcset` is what answers that, and this is what says
    // the browser is reading it.
    expect(asked, 'a three-times screen was served the 64-pixel mark').toContain('/favicon-128.png');

    await context.close();
});
