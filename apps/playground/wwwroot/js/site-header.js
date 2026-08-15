// Closes the language menu when the reader clicks away from it, and on Escape — the gap the
// site's own LanguageSelector.astro documents and fixes the same way, for the same reason:
// <details> only closes by its own <summary> otherwise.
//
// This never touches the `open` attribute itself. Blazor renders it from `_open` in
// SiteHeader.razor, so a script that flipped the attribute directly would leave the DOM saying
// "closed" while the component still believed "open" — and the next unrelated render would
// snap it back open. Instead this only ever asks the component to change its own state.
window.jdSiteHeaderInit = function jdSiteHeaderInit(dotNetRef) {
    function openMenu() {
        return document.querySelector('.language-selector details[open]');
    }

    document.addEventListener('click', (event) => {
        const menu = openMenu();

        if (menu !== null && !menu.contains(event.target)) {
            dotNetRef.invokeMethodAsync('CloseLanguageMenu');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        const menu = openMenu();

        if (menu !== null) {
            // Focus goes back to the control that opened the menu, rather than being dropped
            // wherever it last landed inside the now-closing panel.
            menu.querySelector('summary')?.focus();
            dotNetRef.invokeMethodAsync('CloseLanguageMenu');
        }
    });
};
