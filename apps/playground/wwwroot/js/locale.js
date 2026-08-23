// The document's own `lang` starts as "en" (wwwroot/index.html, served before a byte of .NET
// runs) and LocaleState calls this once it knows better — at startup, from `?lang=`, and again
// on every switch — so a screen reader and the browser's own language tools see what the page
// is actually showing rather than what it opened with.
//
// It also re-words the two pieces of chrome that live outside Blazor's own render tree, in
// index.html: #blazor-error-ui and the consent banner. Both are translated once by a pre-boot
// script that only ever reads the URL the page opened with, so a switch made afterwards would
// leave them in the language the reader left. Their strings are sourced from
// PlaygroundStrings.cs and passed in here rather than duplicated as literals in this file.
//
// ONE OBJECT RATHER THAN A LIST OF ARGUMENTS. Two strings were a signature; ten are a place to
// pass the wrong one. Named on both sides, a key that goes missing is a value that reads as
// undefined at the one element it belongs to, rather than every string after it shifting along.

/**
 * @param {string} tag two letters, the language the reader chose
 * @param {Record<string, string>} strings every piece of shell chrome, already translated
 */
window.jdSetDocumentLanguage = function jdSetDocumentLanguage(tag, strings) {
    document.documentElement.lang = tag;

    write('#blazor-error-ui .message', strings.errorMessage);
    write('#blazor-error-ui .reload', strings.errorReload);

    write('[data-consent-heading]', strings.consentHeading);
    write('[data-consent-sentence]', strings.consentBody);
    write('[data-consent-more]', strings.consentMore);

    var more = document.querySelector('[data-consent-more]');
    if (more && strings.consentPrivacyHref) {
        more.setAttribute('href', strings.consentPrivacyHref);
    }

    // The announcement travels on the attribute the site's own banner uses, and `consent.js`
    // reads it when the button is pressed rather than when it was wired — which is what makes
    // re-wording it here reach a reader who switches language and then answers.
    announce('[data-consent-refuse]', strings.consentRefuse, strings.consentRefused);
    announce('[data-consent-accept]', strings.consentAccept, strings.consentAccepted);
};

function write(selector, text) {
    var element = document.querySelector(selector);

    if (element && typeof text === 'string') {
        element.textContent = text;
    }
}

function announce(selector, label, announcement) {
    write(selector, label);

    var element = document.querySelector(selector);

    if (element && typeof announcement === 'string') {
        element.setAttribute('data-announce', announcement);
    }
}
