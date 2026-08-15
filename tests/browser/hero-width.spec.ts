import { expect, test, type Locator, type Page } from '@playwright/test';

import { PAGES } from './support/watch';

/**
 * The hero's expression and its install offer read as the opening of the same page Act One
 * continues — not a narrower prologue to it. Scene.astro's own rule ("the figure is the
 * scene, and it is full width") applies to the hero's code sample too: nothing here asserts a
 * measure in rem or pixels, because the point is not one particular number but that the
 * hero's figure reaches as far right as Act One's own first scene does.
 *
 * A left edge is not part of that check. Act One's scenes carry a rail for the reader's
 * position down their left side and the hero carries no such rail — so a scene's figure
 * starts a little right of the hero's, by design, and asserting equal left edges would be
 * asserting the wrong thing. The right edge is what a reader's eye catches when a block
 * stops narrower than its neighbours, and it is unaffected by the rail either way.
 *
 * The install command is a different shape of block and gets a different check. It carries
 * its own measure (InstallTabs.astro's `.install`), narrower than a figure's and anchored to
 * its container's left edge rather than stretched to fill it — so its right edge moves with
 * whatever rail sits to its left, by the same design the figure check above works around, and
 * comparing right edges here would fail on the rail rather than on a real regression. What
 * has to match between the hero's offer and the rest is its own width.
 *
 * That width already matched before the hero's own fix: `.install`'s 46rem cap sits below
 * both the old 56rem hero and the 72rem shell, so nothing here regresses on the code this
 * file's sibling commit changes. It stays as a standing guard against a narrower regression
 * in `.install` itself, which the figure check above cannot see.
 */
const VIEWPORT = { width: 1280, height: 900 } as const;
const TOLERANCE_PX = 1;

async function rightEdge(locator: Locator): Promise<number> {
    const box = await locator.boundingBox();

    if (box === null) {
        throw new Error('element is not rendered');
    }

    return box.x + box.width;
}

async function width(locator: Locator): Promise<number> {
    const box = await locator.boundingBox();

    if (box === null) {
        throw new Error('element is not rendered');
    }

    return box.width;
}

for (const path of PAGES) {

    test(`${path} lines up the hero's blocks with the rest of the page`, async ({ page }: { page: Page }) => {
        await page.setViewportSize(VIEWPORT);
        await page.goto(path);

        // After the reveal, not before: a group still holding its starting transform sits in a
        // different place than the one it settles in, and these measurements are meant to be
        // taken settled — even though only the vertical offset moves, matching layout.spec.ts
        // here keeps this check reading the same way that one does.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForLoadState('networkidle');

        // Act One's own first scene is the figure reference: it already sits at the measure
        // Scene.astro promises, and the hero's expression is asked to reach exactly as far
        // right as it does.
        const figureMeasure: number = await rightEdge(page.locator('#act-one .sample').first());
        const heroSampleEdge: number = await rightEdge(page.locator('.hero-expression .sample').first());

        expect(
            Math.abs(heroSampleEdge - figureMeasure),
            "the hero's code sample does not reach the page's measure",
        ).toBeLessThanOrEqual(TOLERANCE_PX);

        // Each door of the first act's exit, in turn — a stacked form with no scripting would
        // show both at once, but the tab widget above them shows one, so each is selected
        // before its command is measured. The hero's own tabs default to the first door, which
        // is the CLI's, so only that one is read there.
        const exitTabs: Locator = page.locator('#act-one-exit [data-install-tabs]');

        const doors: ReadonlyArray<readonly [string, string]> = [
            ['cli', 'the .NET CLI command'],
            ['pm', 'the Package Manager Console command'],
        ];

        for (const [door, label] of doors) {
            await exitTabs.locator(`[data-tab="${door}"]`).click();

            const laterCommandWidth: number = await width(exitTabs.locator(`[data-panel="${door}"] .command`).first());
            const heroCommandWidth: number = await width(page.locator('header.hero .command').first());

            expect(
                Math.abs(heroCommandWidth - laterCommandWidth),
                `the hero's install command is not the same width as ${label}`,
            ).toBeLessThanOrEqual(TOLERANCE_PX);
        }
    });

}
