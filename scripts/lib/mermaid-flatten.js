/*
 * flattenSvg(svg) — turn every style that reached an element into a presentation
 * ATTRIBUTE, then remove the CSS that carried it.
 *
 * This runs INSIDE the page, after the SVG mermaid produced has been put in the
 * document, because the only thing that knows what an element ended up looking like is
 * the browser that laid it out. getComputedStyle answers for the <style> block, the
 * style="" attributes and the UA defaults at once, so no rule of mermaid's has to be
 * understood, matched or reimplemented here.
 *
 * The output carries no <style> element and no style attribute, which is what
 * `style-src 'self'` requires and what scripts/verify-output.sh greps for.
 */
function flattenSvg(svg) {
    /* Properties with an equivalent presentation attribute, and which INHERIT — so a
     * value is written only where it differs from what the parent already carries.
     * Writing every property on every element would work and would also triple the file. */
    const INHERITED = [
        'fill', 'fill-opacity', 'fill-rule',
        'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'stroke-miterlimit',
        'font-family', 'font-size', 'font-style', 'font-weight', 'letter-spacing', 'word-spacing',
        'text-anchor', 'dominant-baseline', 'visibility', 'paint-order',
        'marker-end', 'marker-start', 'marker-mid',
    ];

    /* The initial value each property has when nothing sets it, so the root element is
     * compared against something rather than written unconditionally. */
    const INITIAL = {
        fill: 'rgb(0, 0, 0)', 'fill-opacity': '1', 'fill-rule': 'nonzero',
        stroke: 'none', 'stroke-width': '1px', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter',
        'stroke-dasharray': 'none', 'stroke-dashoffset': '0px', 'stroke-opacity': '1', 'stroke-miterlimit': '4',
        'font-style': 'normal', 'font-weight': '400', 'letter-spacing': 'normal', 'word-spacing': '0px',
        'text-anchor': 'start', 'dominant-baseline': 'auto', visibility: 'visible', 'paint-order': 'normal',
        'marker-end': 'none', 'marker-start': 'none', 'marker-mid': 'none',
    };

    /* Everything the style attributes were carrying that this does NOT convert. Reported
     * rather than swallowed: a property that silently stops applying is the failure mode
     * this whole approach has to not have. */
    const unconverted = new Set();

    /* `color` has no presentation attribute and needs none: in SVG it paints nothing on its
     * own, and the only thing that reads it is `currentColor`. Every paint here is resolved
     * to a literal by getComputedStyle before the CSS is dropped, so no `currentColor`
     * survives to consult it — verified against the corpus, which contains none. Listed
     * rather than ignored so that dropping it is a decision on the record, not an omission. */
    const INERT = ['color'];

    const CONVERTIBLE = new Set([...INHERITED, 'opacity', ...INERT]);

    for (const el of svg.querySelectorAll('[style]')) {
        for (const declaration of (el.getAttribute('style') || '').split(';')) {
            const property = declaration.split(':')[0].trim();
            if (property && !CONVERTIBLE.has(property)) { unconverted.add(property); }
        }
    }

    function walk(el, inheritedValues) {
        const computed = getComputedStyle(el);
        const mine = { ...inheritedValues };

        for (const property of INHERITED) {
            const value = computed.getPropertyValue(property);
            if (!value) { continue; }
            if (value !== (inheritedValues[property] ?? INITIAL[property])) {
                el.setAttribute(property, value);
                mine[property] = value;
            }
        }

        // opacity does not inherit, so it is compared against its own initial value.
        const opacity = computed.getPropertyValue('opacity');
        if (opacity && opacity !== '1') { el.setAttribute('opacity', opacity); }

        for (const child of el.children) { walk(child, mine); }
    }

    walk(svg, {});

    for (const styleEl of svg.querySelectorAll('style')) { styleEl.remove(); }
    for (const el of svg.querySelectorAll('[style]')) { el.removeAttribute('style'); }
    svg.removeAttribute('style');

    /* useMaxWidth wrote the sizing as style="max-width:Npx". The viewBox already scales,
     * so width/height attributes plus one class the site's own stylesheet can size do the
     * same job with no CSS in the document. */
    const viewBox = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    svg.setAttribute('width', String(Math.ceil(viewBox[2])));
    svg.setAttribute('height', String(Math.ceil(viewBox[3])));
    svg.setAttribute('class', 'jd-diagram');
    // The generated id is per-render and would collide with a second copy of the same
    // diagram on one page; the <title>/<desc> ids mermaid derives from it stay, because
    // aria-labelledby points at them.
    svg.removeAttribute('id');
    // Not an interactive graphic, and `color` only matters to currentColor, which nothing
    // here uses once the paints are explicit.
    svg.removeAttribute('color');

    return {
        svg: new XMLSerializer().serializeToString(svg),
        unconverted: [...unconverted],
    };
}
