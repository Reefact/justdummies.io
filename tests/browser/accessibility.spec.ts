import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/harness';
import type { Page } from '@playwright/test';
import type { AxeResults, Result } from 'axe-core';

import { obscured } from './support/obscured';
import { PAGES } from './support/watch';

/**
 * The mechanical half of accessibility, checked mechanically.
 *
 * Automated rules catch the part of WCAG that can be read off a rendered document — a
 * control with no accessible name, a contrast ratio under the threshold, an ARIA attribute
 * on an element that cannot carry it, a heading level skipped. Commonly cited figures put
 * that at somewhere between a third and a half of the criteria, and the rest is judgement:
 * whether an `alt` says anything useful, whether the focus order makes sense, whether the
 * language menu is operable by someone who never touches a mouse. None of that is in here,
 * and nothing in this file should be read as claiming the site is accessible.
 *
 * What it does claim is that the mechanical half stays fixed once fixed. This site's
 * contrast is already argued from the design tokens, so the value here is elsewhere: the
 * controls attach their roles at run time, and a role attached to the wrong element or a
 * button left without a name is exactly what these rules see and nothing else in the
 * repository does.
 */
const STANDARD: readonly string[] = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** A violation as a line somebody can act on, rather than as a count. */
function readable(results: AxeResults): string {
    return results.violations
        .map((violation: Result) => {
            const where: string = violation.nodes
                .map((node) => node.target.join(' '))
                .slice(0, 4)
                .join('\n      ');

            return `  ${violation.id} (${violation.impact ?? 'no impact given'}) — ${violation.help}\n      ${where}`;
        })
        .join('\n');
}

async function scan(page: Page): Promise<AxeResults> {
    return new AxeBuilder({ page }).withTags([...STANDARD]).analyze();
}

/**
 * Wait until the page has stopped moving, and mean it.
 *
 * The contrast rule reads the colour a pixel actually has, and a group in the middle of its
 * seven-hundred-millisecond fade has a colour between the background and its own. The
 * dimmest thing on the page is a code comment at #848A94, which clears 4.5:1 by a margin
 * small enough that a fade half-finished takes it under — so a scan that lands mid-fade
 * reports a contrast violation on text that is perfectly legible once it arrives.
 *
 * That is not a hypothesis. The check went red on a release build and passed on the two
 * runs either side of it, naming `.tok-comment` and nothing else.
 *
 * So: scroll to the bottom, which reveals every group, then wait for every one of them to be
 * fully opaque. A condition, not a delay — and `every` on a page with nothing to reveal is
 * true straight away, which is what the 404s and the playground need.
 */
async function settle(page: Page): Promise<void> {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('[data-reveal]')).every(
            (element: Element) => getComputedStyle(element).opacity === '1',
        ),
    );
}

/*
 * The 404s are in the sweep because their headings were rearranged: the brand became the
 * `h1` and the refusal the `h2` under it, which is exactly the kind of change that produces
 * a skipped level or a second `h1` without anybody noticing.
 *
 * `/about`, `/release-notes`, `/why-justdummies` and `/privacy` are here too, unlike
 * `/version` — `/version` is a deliberate orphan nothing links to, while these four are
 * reachable from the site (the sitewide footer, or — for `/why-justdummies` — the header
 * nav), so they get the same automated sweep as everything else a reader can actually
 * reach. One release notes page of the second kind is in the sweep as well: the section's
 * front page and a train's own page are two different documents — the second nests a table
 * of contents beside four heading levels — and only the first would be covered otherwise.
 */
for (const path of PAGES.concat(
    '/playground/',
    '/about',
    '/fr/about',
    '/release-notes',
    '/fr/release-notes',
    '/release-notes/lib/v1/',
    '/fr/release-notes/lib/v1/',
    '/why-justdummies',
    '/fr/why-justdummies',
    '/privacy',
    '/fr/privacy',
    '/404.html',
    '/fr/404.html',
)) {

    test(`${path} breaks no automated WCAG A or AA rule`, async ({ page }) => {
        await page.goto(path);
        await settle(page);

        const results: AxeResults = await scan(page);

        expect(results.violations.length, `\n${readable(results)}\n`).toBe(0);
    });

}

test('breaks no rule with every control open', async ({ page }) => {
    await page.goto('/');

    // Settled before the controls are touched, and this is the test that taught the lesson:
    // the fix went to the loop above first and this one kept flaking, three runs in nine.
    await settle(page);

    // The state the static scan never sees. Each of these controls attaches its own ARIA at
    // run time — the roles, the selected tab, the expanded fold — so the markup on disk
    // carries none of it and the scan above is looking at a different page from the one a
    // reader who presses things ends up on.
    await page.locator('.install [data-tab="pm"]').first().click();
    await page.locator('.sample[data-folds] [data-fold]').first().click();
    await page.locator('.language-selector summary').click();

    await expect(page.locator('.language-selector details')).toHaveAttribute('open', '');

    // And again after them: opening the fold pushes the page around, which can bring a group
    // into view that had nothing to fade until now.
    await settle(page);

    const results: AxeResults = await scan(page);

    expect(results.violations.length, `\n${readable(results)}\n`).toBe(0);
});

/**
 * The site's half of WCAG 2.2 SC 2.4.11, which axe has no rule for.
 *
 * `DownloadFab.astro` is fixed to the bottom-right corner of every page but /download, and the
 * corner it owns is one the content scrolls through — so at ordinary window sizes a control the
 * keyboard has reached sits underneath it, drawn over rather than scrolled to, which is the one
 * thing the criterion names.
 *
 * Walked rather than aimed at a chosen control. The failure is a property of the corner and not
 * of any one element, so what is checked is every stop of a real Tab pass: the page is asked
 * after each press whether the link is drawn over whatever now holds the focus. A narrow window
 * because that is where the shell stops keeping the content clear of the corner on its own.
 */
test('the floating download link never covers the control the keyboard is on', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 600 });
    await page.goto('/');
    await settle(page);

    // The banner is answered first: it owns the highest claim on the stack and the link's own
    // offset tracks its height, so a pass driven under it would be measuring the wrong corner.
    const banner = page.locator('[data-consent]');

    if (await banner.isVisible()) {
        await page.locator('[data-consent-accept]').click();
        await expect(banner).toBeHidden();
    }

    await expect(page.locator('.download-fab')).toBeAttached();

    for (let step = 0; step < 40; step += 1) {
        await page.keyboard.press('Tab');

        expect(
            await obscured(page),
            `the download link is drawn over the control holding the focus, ${step + 1} tab(s) in`,
        ).toBe(false);
    }
});
