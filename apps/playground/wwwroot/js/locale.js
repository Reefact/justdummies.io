// The document's own `lang` starts as "en" (wwwroot/index.html, served before a byte of .NET
// runs) and LocaleState calls this once it knows better — at startup, from `?lang=`, and again
// on every switch — so a screen reader and the browser's own language tools see what the page
// is actually showing rather than what it opened with.
//
// It also re-words #blazor-error-ui: that banner lives outside Blazor's own render tree, in
// index.html, translated once by a pre-boot script that only ever reads the URL the page
// opened with. Passing its two strings here — sourced from PlaygroundStrings.cs, not
// duplicated as literals in this file — is what keeps the banner in step with a later switch.
window.jdSetDocumentLanguage = function jdSetDocumentLanguage(tag, errorMessage, errorReload) {
    document.documentElement.lang = tag;

    var message = document.querySelector('#blazor-error-ui .message');
    var reload = document.querySelector('#blazor-error-ui .reload');

    if (message) {
        message.textContent = errorMessage;
    }
    if (reload) {
        reload.textContent = errorReload;
    }
};
