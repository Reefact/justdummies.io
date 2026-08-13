import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type { AxeResults, Result } from 'axe-core';

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

/*
 * The 404s are in the sweep because their headings were rearranged: the brand became the
 * `h1` and the refusal the `h2` under it, which is exactly the kind of change that produces
 * a skipped level or a second `h1` without anybody noticing.
 */
for (const path of PAGES.concat('/playground/', '/404.html', '/fr/404.html')) {

    test(`${path} breaks no automated WCAG A or AA rule`, async ({ page }) => {
        await page.goto(path);

        // After the reveal: a group still at zero opacity is not what a reader meets, and
        // the contrast rules would be measuring a colour nobody sees.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForLoadState('networkidle');

        const results: AxeResults = await scan(page);

        expect(results.violations.length, `\n${readable(results)}\n`).toBe(0);
    });

}

test('breaks no rule with every control open', async ({ page }) => {
    await page.goto('/');

    // The state the static scan never sees. Each of these controls attaches its own ARIA at
    // run time — the roles, the selected tab, the expanded fold — so the markup on disk
    // carries none of it and the scan above is looking at a different page from the one a
    // reader who presses things ends up on.
    await page.locator('.install [data-tab="pm"]').first().click();
    await page.locator('.sample[data-folds] [data-fold]').first().click();
    await page.locator('.language-selector summary').click();

    await expect(page.locator('.language-selector details')).toHaveAttribute('open', '');

    const results: AxeResults = await scan(page);

    expect(results.violations.length, `\n${readable(results)}\n`).toBe(0);
});
