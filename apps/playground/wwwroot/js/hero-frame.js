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
