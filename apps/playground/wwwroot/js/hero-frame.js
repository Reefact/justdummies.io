// Tells the document framing this page how tall it has become.
//
// The frame cannot measure its own content across a document boundary without reading
// into it, so the measurement travels the other way: the page reports, the frame
// resizes. Same origin both ways, and the message names itself so a listener cannot
// mistake somebody else's postMessage for this one.
window.jdHeroReportHeight = function jdHeroReportHeight() {
    if (window.parent === window) {
        return;
    }

    const height = Math.ceil(document.documentElement.getBoundingClientRect().height);

    window.parent.postMessage({ type: 'jd:hero-height', height }, window.location.origin);
};

// Rendering is not the only thing that changes this page's height. Narrowing the window
// wraps the expression onto more lines, and the frame around it, sized once at the width
// it was opened at, then grows a scrollbar down the side of the widget — 83 pixels of
// overshoot at 390, measured. Blazor does not re-render for that: nothing about the
// component changed, only the room it had.
//
// So the page watches its own box rather than waiting to be asked. The observer fires
// once on observe, which covers the first report as well; the call from the component
// stays because it costs nothing and answers for the browser that has no observer.
if (window.parent !== window && typeof ResizeObserver === 'function') {
    new ResizeObserver(() => window.jdHeroReportHeight()).observe(document.documentElement);
}

// A framed widget is not a page, and must not reserve a page's scrollbar.
//
// app.css sets `scrollbar-gutter: stable` on <html> so the standalone playground and the site
// are laid out in viewports of the same width — without it the short playground page keeps the
// fifteen pixels the tall site page gives up, and every centred measure below lands seven and a
// half pixels off the page it is matching. This document is the same document: /hero and /
// share one shell, so the rule reaches the widget too, where it takes those fifteen pixels off
// a width the framing document has already decided and rewraps the expression inside it.
//
// Set through the CSSOM rather than in the stylesheet, because the stylesheet cannot tell the
// two apart — only `window.parent` can.
if (window.parent !== window) {
    document.documentElement.style.scrollbarGutter = 'auto';
}
