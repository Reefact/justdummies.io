import type { Page } from '@playwright/test';

/**
 * Whether the floating download link is drawn over whatever holds the keyboard focus.
 *
 * WCAG 2.2 SC 2.4.11 (Focus Not Obscured, Minimum, AA) says the focused control may not be
 * *entirely* hidden by author-created content. A control fixed to a corner of the viewport owns
 * that corner whatever is underneath it, and both applications put one there — so both need the
 * same question asked, and it is asked here rather than twice.
 *
 * IT READS BEHAVIOUR, NOT A DECLARATION. There is more than one honest way for a fixed control
 * to stay out of the way — it can move, it can fade, it can be told to reserve room — so what
 * is measured is the pair of facts the criterion actually cares about: does the link's box
 * cover the focused one, and is the link drawn at all. Either answer being no is a pass, and
 * how the stylesheet gets there is its own business.
 *
 * `opacity` and `visibility` are read from the computed style rather than inferred from a
 * class, for the same reason: a rule written differently tomorrow should still be measured
 * correctly today.
 */
export async function obscured(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        const focused: Element | null = document.activeElement;
        const link: Element | null = document.querySelector('.download-fab');

        if (focused === null || link === null || focused === link || focused === document.body) {
            return false;
        }

        const target: DOMRect = focused.getBoundingClientRect();
        const box: DOMRect = link.getBoundingClientRect();
        const style: CSSStyleDeclaration = getComputedStyle(link);

        const overlaps: boolean =
            box.left < target.right && box.right > target.left && box.top < target.bottom && box.bottom > target.top;
        const drawn: boolean = Number(style.opacity) > 0 && style.visibility !== 'hidden' && style.display !== 'none';

        return overlaps && drawn;
    });
}
