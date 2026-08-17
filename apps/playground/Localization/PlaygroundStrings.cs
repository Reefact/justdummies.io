namespace JustDummies.Playground.Localization;

/// <summary>
///     Every string the playground displays, in every locale it supports.
///
///     Mirrors the intent of the site's own <c>i18n/ui.ts</c> — English is the source, a
///     locale is a complete translation of it, nothing falls back silently — without sharing
///     its code, because the two are different languages and different runtimes.
///
///     What does NOT belong here: anything a <c>DummyException</c> (or a subclass) says. Those
///     messages come from the published library, not from this project, and rewording them
///     would be the playground's opinion of the library's diagnostics rather than the
///     diagnostics themselves.
/// </summary>
public static class PlaygroundStrings {

    /// <summary>The locale named by a <c>?lang=</c> value, or <see cref="Locale.En" /> for anything else.</summary>
    public static Locale Parse(string? tag) {
        return tag?.Trim().ToLowerInvariant() switch {
            "fr" => Locale.Fr,
            _    => Locale.En,
        };
    }

    /// <summary>The <c>?lang=</c> value a locale round-trips through, for building a URL.</summary>
    public static string Tag(Locale locale) {
        return locale switch {
            Locale.Fr => "fr",
            _         => "en",
        };
    }

    /// <summary>
    ///     The name of a locale, written in that locale — "English", "Français" — never
    ///     translated into whichever one the reader is currently in. Mirrors
    ///     <c>localeNames</c> in the site's <c>i18n/ui.ts</c>: a language selector names its
    ///     options in the reader's possible destinations, not in the language they are leaving.
    /// </summary>
    public static string Name(Locale locale) {
        return locale switch {
            Locale.Fr => "Français",
            _         => "English",
        };
    }

    /// <summary>
    ///     A French string, paired with the exact English text it was translated from —
    ///     <see cref="TranslatedFrom" /> is a snapshot, not a live reference to <see cref="En" />.
    ///     The static constructor below compares that snapshot against the current English
    ///     value for the same key: if someone edits <see cref="En" /> without revisiting the
    ///     translation, the two stop matching, and this is what notices.
    /// </summary>
    private readonly record struct Translation(string Text, string TranslatedFrom);

    private static readonly Dictionary<string, string> En = new() {
        ["brand.tagline"] = "Just dummies — but seriously powerful ones.",

        ["nav.primary"]    = "Primary",
        ["nav.why"]        = "Why JustDummies",
        ["nav.playground"] = "Playground",
        ["nav.github"]     = "GitHub",
        ["language.label"] = "Language",

        ["hero.aria.prefix"]    = "prefix",
        ["hero.aria.contains"]  = "contained text",
        ["hero.aria.length"]    = "length",
        ["hero.generate"]       = "Generate",
        ["hero.running"]        = "running here, JustDummies {0}",
        ["hero.lengthRequired"] = "Enter a length to generate.",
        // Same word as the site's own "sample.produced" (ui.ts) — the label on the result
        // this widget replaces, so the two read as the same caption.
        ["hero.produced"]       = "produced",

        ["playground.title"] = "Playground",
        ["playground.lede"] =
            "Build an expression by choosing a method at each step — the supported scalar surface " +
            "is here, not a hand-picked few. Arguments are typed directly into the call; once at " +
            "least one step is chosen, <code>Generate</code> below draws a value.",
        ["playground.generate"]      = "Generate",
        ["playground.generateAgain"] = "Generate again",
        // What the result bar reads before anything has been drawn — a state the landing
        // page's hero never has, since its chain is compiled in and drawn on arrival.
        ["playground.notDrawnYet"]   = "no value drawn yet",
        // What the code bar reads instead of the chain, while an argument is one this playground
        // could not parse. Says what is wrong with the line rather than what to do about it: the
        // step that caused it already carries a flag saying which argument, and repeating that
        // here would be a second copy of a message that is one glance away.
        ["playground.notCompilable"]  = "Code does not compile",
        ["playground.copyCode"]      = "Copy code",
        ["playground.copied"]        = "copied to clipboard",
        ["playground.copyFailed"]    = "Could not copy. Select the code and copy it manually.",
        ["playground.chooseMethod"]  = "choose a method…",
        ["playground.deleteStep"]    = "remove this step and everything after it",
        ["playground.selectAria"]    = "method for step {0}",
        ["playground.docs"]          = "docs",
        // The accessible name of the flag that opens a step's message. Names the action, not
        // the state: `aria-expanded` on the same button already says whether it is open, and a
        // label that said so too would be read twice and disagree with itself half the time.
        ["playground.showError"]     = "show what is wrong with this step",

        ["argument.expectsBoolean"]                  = "true or false",
        ["argument.expectsByte"]                     = "a whole number between 0 and 255",
        ["argument.expectsWholeNumber"]               = "a whole number",
        ["argument.expectsWholeNumberNonNegative"]    = "a whole number, zero or more",
        ["argument.expectsInteger"]                   = "an integer",
        ["argument.expectsNumber"]                    = "a number",
        ["argument.expectsGuid"]                      = "a GUID, e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6",
        ["argument.expectsChar"]                      = "a single character",
        ["argument.expectsDate"]                      = "a date, e.g. 2026-08-15",
        ["argument.expectsDateTime"]                  = "a date, optionally with a time, e.g. 2026-08-15T14:30:00",
        ["argument.expectsDateTimeOffset"]             = "a date and time with an offset, e.g. 2026-08-15T14:30:00+02:00",
        ["argument.expectsTime"]                       = "a time, e.g. 14:30:00",
        ["argument.expectsDuration"]                   = "a duration, e.g. 01:30:00",
        ["argument.expectsWithinSandboxRange"]         = "a value no greater than 100,000 in magnitude — this playground caps it there; the library itself has no such limit",
        ["argument.expectsTextWithinSandboxLength"]    = "a text no longer than 200 characters — this playground caps it there; the library itself has no such limit",
        ["argument.template"]                          = "this argument expects {0}",

        ["limit.length"] = "This playground caps the length at {0} characters; the library itself has no such limit.",
        ["limit.text"]   = "This playground caps this field at {0} characters; the library itself has no such limit.",
        ["limit.quotes"] = "This playground strips quotes and backslashes here, so the expression shown stays valid C#.",

        ["notFound.title"] = "Not found",
        ["notFound.lede"] =
            "There is no such page in the playground. <a href=\"{0}\">Start over</a>, " +
            "or <a href=\"{1}\">go back to the site</a>.",

        ["footer.nav"]          = "Footer",
        ["footer.about"]        = "About",
        ["footer.releaseNotes"] = "Release notes",
        ["footer.privacy"]      = "Privacy",
        ["footer.repository"]   = "Source code",
        ["state.newTab"]      = "opens in a new tab",

        // The one piece of the pre-boot shell (wwwroot/index.html) that still has to be
        // relocalized after boot: #blazor-error-ui sits outside Blazor's render tree and is
        // translated once, synchronously, before the runtime even starts. These two keys are
        // what LocaleState.Set(...) hands back to that same banner when the reader switches
        // language afterwards — see the KNOWN DUPLICATION note in index.html for why the
        // pre-boot script still carries its own literal copy rather than awaiting this class.
        ["errorBanner.message"] = "Something went wrong.",
        ["errorBanner.reload"]  = "Reload",
    };

    private static readonly Dictionary<string, Translation> Fr = new() {
        ["brand.tagline"] = new("Juste des dummies, mais redoutablement efficaces.", "Just dummies — but seriously powerful ones."),

        ["nav.primary"]    = new("Principale", "Primary"),
        ["nav.why"]        = new("Pourquoi JustDummies", "Why JustDummies"),
        ["nav.playground"] = new("Playground", "Playground"),
        ["nav.github"]     = new("GitHub", "GitHub"),
        ["language.label"] = new("Langue", "Language"),

        ["hero.aria.prefix"]    = new("préfixe", "prefix"),
        ["hero.aria.contains"]  = new("texte contenu", "contained text"),
        ["hero.aria.length"]    = new("longueur", "length"),
        ["hero.generate"]       = new("Générer", "Generate"),
        ["hero.running"]        = new("s'exécute ici, JustDummies {0}", "running here, JustDummies {0}"),
        ["hero.lengthRequired"] = new("Indiquez une longueur pour générer.", "Enter a length to generate."),
        ["hero.produced"]       = new("produit", "produced"),

        ["playground.title"] = new("Playground", "Playground"),
        ["playground.lede"] = new(
            "Construisez une expression en choisissant une méthode à chaque étape — la surface " +
            "scalaire prise en charge est proposée ici, pas une poignée choisie à la main. Les " +
            "arguments se saisissent directement dans l'appel ; une fois au moins une étape choisie, " +
            "<code>Generate</code> ci-dessous tire une valeur.",
            "Build an expression by choosing a method at each step — the supported scalar surface " +
            "is here, not a hand-picked few. Arguments are typed directly into the call; once at " +
            "least one step is chosen, <code>Generate</code> below draws a value."),
        ["playground.generate"]      = new("Générer", "Generate"),
        ["playground.generateAgain"] = new("Générer à nouveau", "Generate again"),
        ["playground.notDrawnYet"]   = new("aucune valeur tirée pour l'instant", "no value drawn yet"),
        ["playground.notCompilable"]  = new("Code non compilable", "Code does not compile"),
        ["playground.copyCode"]      = new("Copier le code", "Copy code"),
        ["playground.copied"]        = new("copié dans le presse-papiers", "copied to clipboard"),
        ["playground.copyFailed"]    = new("Copie impossible. Sélectionnez le code et copiez-le à la main.", "Could not copy. Select the code and copy it manually."),
        ["playground.chooseMethod"]  = new("choisir une méthode…", "choose a method…"),
        ["playground.deleteStep"]    = new("supprimer cette étape et tout ce qui suit", "remove this step and everything after it"),
        ["playground.selectAria"]    = new("méthode pour l'étape {0}", "method for step {0}"),
        ["playground.docs"]          = new("doc", "docs"),
        ["playground.showError"]     = new("afficher ce qui ne va pas dans cette étape", "show what is wrong with this step"),

        ["argument.expectsBoolean"]                = new("true ou false", "true or false"),
        ["argument.expectsByte"]                   = new("un nombre entier entre 0 et 255", "a whole number between 0 and 255"),
        ["argument.expectsWholeNumber"]             = new("un nombre entier", "a whole number"),
        ["argument.expectsWholeNumberNonNegative"]  = new("un nombre entier, zéro ou plus", "a whole number, zero or more"),
        ["argument.expectsInteger"]                 = new("un entier", "an integer"),
        ["argument.expectsNumber"]                  = new("un nombre", "a number"),
        ["argument.expectsGuid"]                    = new("un GUID, ex. 3fa85f64-5717-4562-b3fc-2c963f66afa6", "a GUID, e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"),
        ["argument.expectsChar"]                    = new("un seul caractère", "a single character"),
        ["argument.expectsDate"]                    = new("une date, ex. 2026-08-15", "a date, e.g. 2026-08-15"),
        ["argument.expectsDateTime"]                = new("une date, éventuellement avec une heure, ex. 2026-08-15T14:30:00", "a date, optionally with a time, e.g. 2026-08-15T14:30:00"),
        ["argument.expectsDateTimeOffset"]           = new("une date et une heure avec décalage, ex. 2026-08-15T14:30:00+02:00", "a date and time with an offset, e.g. 2026-08-15T14:30:00+02:00"),
        ["argument.expectsTime"]                     = new("une heure, ex. 14:30:00", "a time, e.g. 14:30:00"),
        ["argument.expectsDuration"]                 = new("une durée, ex. 01:30:00", "a duration, e.g. 01:30:00"),
        ["argument.expectsWithinSandboxRange"]       = new(
            "une valeur d'une magnitude d'au plus 100 000 — ce playground la limite là ; la librairie elle-même n'impose aucune limite",
            "a value no greater than 100,000 in magnitude — this playground caps it there; the library itself has no such limit"),
        ["argument.expectsTextWithinSandboxLength"]  = new(
            "un texte d'au plus 200 caractères — ce playground le limite là ; la librairie elle-même n'impose aucune limite",
            "a text no longer than 200 characters — this playground caps it there; the library itself has no such limit"),
        ["argument.template"]                        = new("cet argument attend {0}", "this argument expects {0}"),

        ["limit.length"] = new(
            "Ce playground limite la longueur à {0} caractères ; la librairie elle-même n'impose aucune limite.",
            "This playground caps the length at {0} characters; the library itself has no such limit."),
        ["limit.text"] = new(
            "Ce playground limite ce champ à {0} caractères ; la librairie elle-même n'impose aucune limite.",
            "This playground caps this field at {0} characters; the library itself has no such limit."),
        ["limit.quotes"] = new(
            "Ce playground retire les guillemets et les antislashs ici, pour que l'expression affichée reste du C# valide.",
            "This playground strips quotes and backslashes here, so the expression shown stays valid C#."),

        ["notFound.title"] = new("Introuvable", "Not found"),
        ["notFound.lede"] = new(
            "Cette page n'existe pas dans le playground. <a href=\"{0}\">Recommencer</a>, " +
            "ou <a href=\"{1}\">revenir sur le site</a>.",
            "There is no such page in the playground. <a href=\"{0}\">Start over</a>, " +
            "or <a href=\"{1}\">go back to the site</a>."),

        ["footer.nav"]          = new("Pied de page", "Footer"),
        ["footer.about"]        = new("À propos", "About"),
        ["footer.releaseNotes"] = new("Notes de version", "Release notes"),
        ["footer.privacy"]      = new("Confidentialité", "Privacy"),
        ["footer.repository"]   = new("Code source", "Source code"),
        ["state.newTab"]      = new("ouvre un nouvel onglet", "opens in a new tab"),

        ["errorBanner.message"] = new("Une erreur est survenue.", "Something went wrong."),
        ["errorBanner.reload"]  = new("Recharger", "Reload"),
    };

    /// <summary>
    ///     TypeScript gives the site's own dictionary the key-parity half of this guarantee for
    ///     free — <c>fr</c> declared as <c>Record&lt;UiKey, string&gt;</c> makes a missing or
    ///     extra key a compile error (<c>i18n/ui.ts</c>). C# has no equivalent structural check,
    ///     so this is the closest a plain static class gets: an explicit static constructor runs
    ///     before <em>any</em> member of this type is first touched, so a key added to one locale
    ///     and not the other, or an English string revised without its translation, surfaces the
    ///     moment the playground starts — in every environment, not only the one where a French
    ///     reader happens to hit it first. <c>tools/playground-i18n-guard</c> forces this
    ///     constructor to run during the build itself, so a stale translation fails CI rather
    ///     than only ever failing at someone's runtime (§6.4).
    /// </summary>
    static PlaygroundStrings() {
        string[] onlyInEn = En.Keys.Except(Fr.Keys).OrderBy(key => key, StringComparer.Ordinal).ToArray();
        string[] onlyInFr = Fr.Keys.Except(En.Keys).OrderBy(key => key, StringComparer.Ordinal).ToArray();

        if (onlyInEn.Length > 0 || onlyInFr.Length > 0) {
            throw new InvalidOperationException(
                "PlaygroundStrings: En and Fr must declare exactly the same keys (§6.4)."
                + (onlyInEn.Length > 0 ? $" Missing from Fr: {string.Join(", ", onlyInEn)}." : string.Empty)
                + (onlyInFr.Length > 0 ? $" Missing from En: {string.Join(", ", onlyInFr)}." : string.Empty));
        }

        // §6.4: "a modification of the English content marks its translation stale, and CI
        // reports it." A key present on both sides can still ship a French string answering a
        // question the English no longer asks — this is what catches that, by comparing what
        // French says it was translated from against what English actually says today.
        string[] stale = Fr
            .Where(entry => En[entry.Key] != entry.Value.TranslatedFrom)
            .Select(entry => entry.Key)
            .OrderBy(key => key, StringComparer.Ordinal)
            .ToArray();

        if (stale.Length > 0) {
            throw new InvalidOperationException(
                "PlaygroundStrings: the French translation is stale for keys whose English text changed "
                + $"since it was translated (§6.4): {string.Join(", ", stale)}.");
        }
    }

    /// <summary>
    ///     The string named by <paramref name="key" />, in <paramref name="locale" />, with
    ///     <paramref name="args" /> substituted into it.
    ///
    ///     A missing key throws <see cref="KeyNotFoundException" /> rather than falling back to
    ///     English: a silent fallback is exactly the half-translated page the site's own i18n
    ///     rules (§6.4) refuse to ship.
    /// </summary>
    public static string T(Locale locale, string key, params object[] args) {
        string template = locale == Locale.Fr ? Fr[key].Text : En[key];

        return args.Length == 0 ? template : string.Format(template, args);
    }

}
