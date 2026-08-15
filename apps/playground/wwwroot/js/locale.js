// The document's own `lang` starts as "en" (wwwroot/index.html, served before a byte of .NET
// runs) and LocaleState calls this once it knows better — at startup, from `?lang=`, and again
// on every switch — so a screen reader and the browser's own language tools see what the page
// is actually showing rather than what it opened with.
window.jdSetDocumentLanguage = function jdSetDocumentLanguage(tag) {
    document.documentElement.lang = tag;
};
