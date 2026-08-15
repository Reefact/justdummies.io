using Microsoft.AspNetCore.Components;

namespace JustDummies.Playground.Localization;

/// <summary>
///     A component that displays translated text and stays mounted across a language switch.
///
///     This app has one page per route, not one per locale, so switching language never
///     re-creates the component tree the way navigating to <c>/fr/…</c> does on the site.
///     <see cref="LocaleState.Changed" /> is what tells an already-rendered component that the
///     text it drew a moment ago is now the wrong language.
/// </summary>
public abstract class LocalizedComponent : ComponentBase, IDisposable {

    [Inject]
    protected LocaleState LocaleState { get; set; } = null!;

    protected override void OnInitialized() {
        LocaleState.Changed += OnLocaleChanged;
    }

    public void Dispose() {
        LocaleState.Changed -= OnLocaleChanged;
    }

    private void OnLocaleChanged() {
        InvokeAsync(StateHasChanged);
    }

}
