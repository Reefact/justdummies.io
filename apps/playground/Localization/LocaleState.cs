using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace JustDummies.Playground.Localization;

/// <summary>
///     The locale the playground is currently showing itself in, and the one place that
///     changes it.
///
///     Read once from the page's own <c>?lang=</c> at construction — set by the site embedding
///     the hero, or by the nav link to the standalone playground (§6.4) — and from then on
///     changed only by the language selector in this app's own header. A component that
///     displays translated text injects this rather than reading the query string itself, and
///     listens to <see cref="Changed" /> to redraw when another component switches it.
/// </summary>
public sealed class LocaleState {

    private readonly NavigationManager _navigation;
    private readonly IJSRuntime        _js;

    public LocaleState(NavigationManager navigation, IJSRuntime js) {
        _navigation = navigation;
        _js         = js;
        Current     = PlaygroundStrings.Parse(QueryLang(navigation.Uri));

        // Fire-and-forget: wwwroot/index.html ships with <html lang="en">, read before a byte
        // of .NET runs, and this is the first chance to correct it for a page that opened in
        // French. Nothing downstream waits on it — a screen reader that queries the attribute a
        // frame later is the only reader of this call.
        _ = ApplyDocumentLanguage(Current);
    }

    public Locale Current { get; private set; }

    /// <summary>Raised after <see cref="Current" /> changes, so a component can redraw.</summary>
    public event Action? Changed;

    public void Set(Locale locale) {
        if (locale == Current) {
            return;
        }

        Current = locale;
        Changed?.Invoke();
        _ = ApplyDocumentLanguage(locale);

        // Kept in the URL, not only in memory: a reader who copies the link, reloads, or opens
        // the hero again gets back the language they chose, not whatever the page started in.
        string uri = _navigation.GetUriWithQueryParameter("lang", PlaygroundStrings.Tag(locale));
        _navigation.NavigateTo(uri, replace: true);
    }

    /// <summary>
    ///     Beyond <c>&lt;html lang&gt;</c>, this also re-words the two pieces of chrome that
    ///     live in <c>wwwroot/index.html</c> rather than in this app's render tree: the banner
    ///     Blazor reveals on an unhandled error, and the consent question (ADR-0025).
    ///     <c>index.html</c>'s own pre-boot script only ever translates them once, from the
    ///     query string the page opened with. Without repeating that here, a reader who opened
    ///     in English and then switched to French through this app's own selector would see
    ///     them in the language they left — the exact mixed-language interface this class
    ///     exists to prevent, and in the error banner's case seen only if the runtime later
    ///     fails, which is the one moment reading it matters most.
    ///
    ///     The consent banner is the more consequential of the two, because a reader answers
    ///     it: a question read in one language and announced in another is a choice made
    ///     against a sentence they did not read.
    /// </summary>
    private async Task ApplyDocumentLanguage(Locale locale) {
        await _js.InvokeVoidAsync(
            "jdSetDocumentLanguage",
            PlaygroundStrings.Tag(locale),
            new Dictionary<string, string> {
                ["errorMessage"]       = PlaygroundStrings.T(locale, "errorBanner.message"),
                ["errorReload"]        = PlaygroundStrings.T(locale, "errorBanner.reload"),
                ["consentHeading"]     = PlaygroundStrings.T(locale, "consent.heading"),
                ["consentBody"]        = PlaygroundStrings.T(locale, "consent.body"),
                ["consentMore"]        = PlaygroundStrings.T(locale, "consent.more"),
                ["consentAccept"]      = PlaygroundStrings.T(locale, "consent.accept"),
                ["consentRefuse"]      = PlaygroundStrings.T(locale, "consent.refuse"),
                ["consentAccepted"]    = PlaygroundStrings.T(locale, "consent.state.accepted"),
                ["consentRefused"]     = PlaygroundStrings.T(locale, "consent.state.refused"),
                // The site's own address for the page the banner links to, derived here for the
                // reason DownloadFab.razor derives its own: the French prefix belongs to the
                // site's routing, which this application knows about and does not share.
                ["consentPrivacyHref"] = locale == Locale.Fr ? "/fr/privacy/" : "/privacy/",
            });
    }

    /// <summary>
    ///     The <c>lang</c> query parameter of <paramref name="uri" />, read by hand rather than
    ///     through <c>Microsoft.AspNetCore.WebUtilities</c>: one parameter does not earn a
    ///     dependency the standalone client app does not otherwise need.
    /// </summary>
    private static string? QueryLang(string uri) {
        string query = new Uri(uri).Query; // "" or "?a=1&b=2"

        if (query.Length <= 1) {
            return null;
        }

        foreach (string pair in query[1..].Split('&')) {
            int    equals = pair.IndexOf('=');
            string key    = equals < 0 ? pair : pair[..equals];

            if (key != "lang") {
                continue;
            }

            return Uri.UnescapeDataString(equals < 0 ? string.Empty : pair[(equals + 1)..]);
        }

        return null;
    }

}
