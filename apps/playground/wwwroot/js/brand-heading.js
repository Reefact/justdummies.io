// Puts the mark on the same two lines as the `J` beside it — the site's own measurement
// (apps/site/src/components/BrandHeading.astro), carried over so the lockup is drawn at the
// same size and the same height in both halves of the product.
//
// ALIGNED TO THE J, WHICH IS NOT THE SAME AS SITTING ON THE BASELINE. An image has no
// descender and the `J` has one, so CSS can put the mark's top on the cap line or its bottom
// on the baseline, but not its bottom on the bottom of the `J`. The size of that drop is a
// property of the resolved font, and the font stack is the platform's own — SF Pro on one
// machine, Segoe UI on another. A number written into app.css would be right on the machine it
// was measured on and wrong everywhere else.
//
// The stylesheet's `1cap` is what shows until this runs, and if it never runs: a mark on the
// cap line, ending on the baseline. Top edge exact, bottom edge short by the descender — a
// normal-looking lockup rather than a broken one (ADR-0004).
//
// Called from BrandHeading.razor's first render rather than on DOMContentLoaded: the heading is
// drawn by Blazor, minutes of app-time after this file is parsed, so there is nothing to
// measure until the component says there is.
window.jdBrandHeadingAlign = function jdBrandHeadingAlign() {
    const heading = document.querySelector('[data-brand-heading]');
    const mark = document.querySelector('[data-brand-heading] .mark');

    if (mark === null || heading === null) {
        return;
    }

    const canvas = document.createElement('canvas').getContext('2d');

    const align = () => {
        if (canvas === null) {
            return;
        }

        const style = getComputedStyle(heading);

        // The shorthand canvas accepts, which is not the one CSS reports: a line height in it
        // is either ignored or refused depending on the engine.
        canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

        const metrics = canvas.measureText('J');
        const above = metrics.actualBoundingBoxAscent;
        const below = metrics.actualBoundingBoxDescent;

        if (!Number.isFinite(above) || !Number.isFinite(below) || above <= 0) {
            return;
        }

        mark.style.height = `${above + below}px`;
        // Negative moves it down: `vertical-align` is measured up from the baseline, and the
        // mark's bottom has to land where the tail of the `J` lands.
        mark.style.verticalAlign = `${-below}px`;
    };

    align();

    // Once per document, not once per call. Blazor re-renders this component on every language
    // switch, and a listener added each time would leave one measurement running per switch for
    // the rest of the session.
    if (window.jdBrandHeadingWatching !== true) {
        window.jdBrandHeadingWatching = true;

        // The heading is smaller on a short screen and on a phone, so the glyph it has to match
        // changes with the viewport rather than only at load.
        let pending;

        window.addEventListener('resize', () => {
            if (pending !== undefined) {
                cancelAnimationFrame(pending);
            }

            pending = requestAnimationFrame(align);
        });

        // A face that arrives after first paint changes every number above. None is loaded here
        // today — the stack is the platform's own — and that is a fact about today.
        if (document.fonts !== undefined) {
            document.fonts.ready.then(align);
        }
    }
};
