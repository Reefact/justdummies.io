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
