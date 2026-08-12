/**
 * Every string the site displays, in every locale.
 *
 * The specification requires that no component carry a hard-coded string (§7.6),
 * and that a key missing from a locale **fail the build** rather than fall back
 * silently to English (§28.4) — a silent fallback produces half-translated pages
 * that nobody notices.
 *
 * That guarantee is bought by the type annotation on `fr` below rather than by a
 * script. English is the source: its object defines the key set, and French is
 * declared as `Record<UiKey, string>`, so a missing key and an extra key are both
 * compile errors. `pnpm check` runs in CI, so the build is what fails.
 *
 * What belongs here is prose. Facts — package names, versions, install commands,
 * URLs — live in `site.ts` and are the same in every locale.
 */

export const locales = ['en', 'fr'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/** The name of each locale, written in that locale. Never a flag: a flag names a country. */
export const localeNames: Record<Locale, string> = {
    en: 'English',
    fr: 'Français',
};

/** The BCP 47 tags used for `<html lang>`, `hreflang` and Open Graph. */
export const localeTags: Record<Locale, string> = {
    en: 'en',
    fr: 'fr',
};

/** The Open Graph locale identifiers, which use an underscore rather than a hyphen. */
export const openGraphLocales: Record<Locale, string> = {
    en: 'en_US',
    fr: 'fr_FR',
};

const en = {
    'brand.tagline': 'Just dummies. Seriously powerful ones.',
    'brand.subtitle': 'Focused, fluent test values for .NET.',

    'nav.playground': 'Playground',
    'nav.github': 'GitHub',
    'nav.nuget': 'NuGet',
    'nav.primary': 'Primary',

    'language.label': 'Language',
    'language.switch': 'Read this page in',

    'home.install.label': 'Install the package',
    'home.meta.description':
        'JustDummies generates arbitrary test values for .NET that satisfy the constraints you declare, so a test can say what it is about and nothing else.',

    /**
     * ACT I — validity. The claim is that a value a test does not care about still has
     * to be valid, and that declaring what must be true is a different job from writing
     * a value down.
     */
    'act1.title': 'The value your test does not care about',
    'act1.summary': 'It still has to be valid.',

    'act1.test.title': 'Your test probably looks like this',
    'act1.test.body':
        'Two lines do the work: cancel the order, check that it was. The other three are named for any value and hand you one specific one, typed in by hand — you have to read the right of each assignment to notice, and none of it has anything to do with cancelling.',

    'act1.factories.title': 'One factory per value',
    'act1.factories.body':
        "The test reads at last: three names, and you know straight away what matters. But nothing moved underneath. AnyOrderReference still returns the same string it always did — the lie did not go away, it moved to another file.",

    'act1.careless.title': 'The factory stops lying',
    'act1.careless.body':
        "Any.String() draws a genuinely arbitrary string, so the name is finally true. The domain disagrees. It refuses the value the moment it is built — not three assertions later — and it says exactly what it was missing.",

    'act1.invariants.title': 'What the domain is asking for',
    'act1.invariants.body':
        "There's nothing exotic here, and it's written where it belongs. But each of these rules is now something your test has to satisfy without ever talking about it.",

    'act1.constraints.title': 'Declare the constraints, not the value',
    'act1.constraints.body':
        "One link per rule, inside the factory. What comes out is different every time, and valid every time. The chain describes what has to be true of the value — never what you're about to assert about it.",

    'act1.exit.title': 'That much is one package',
    'act1.exit.body':
        "Everything above is the library on its own. If that's what you came for, take it now — the rest of this page is about making all that setup disappear.",

    /**
     * ACT II — concision. The claim is that the arrangement can go away without the test
     * losing what it was about, and that the tool writes the part nobody wants to write.
     */
    'act2.title': 'Four lines of setup, and not one of them yours to write',
    'act2.summary': 'A generator that belongs to you, written from the type you already have.',

    'act2.install.title': 'One tool, once',
    'act2.install.body':
        'A global .NET tool. It reads your project the way the compiler does, so all it needs from you is the name of a type.',

    'act2.scaffold.title': 'It reads the type and writes the generator',
    'act2.scaffold.body':
        'It reads your own source and turns it into a recipe. The last column tells you what it worked out on its own, and where it stopped.',

    'act2.link.title': 'It stops where you already know the answer',
    'act2.link.body':
        "It marked that parameter rather than guess at it, so the file it wrote throws on every draw until you add the link. What goes there is the chain you already wrote, unchanged — you paste it once, into a file that's now yours.",

    'act2.concise.title': 'The test, and nothing else',
    'act2.concise.body':
        'Same test as before, right down to the assertion. One line of setup, naming the only thing this test needs to be true: the order is pending.',

    'act2.exit.title': 'A package and a tool',
    'act2.exit.body':
        "The tool is optional. Everything it removed here, the library on its own had already made possible. Take both if the setup was what bothered you; take the library alone if it wasn't.",

    /**
     * ACT III — reproducibility. The claim is that a test which forgot to constrain a value
     * fails now and then, that the failure hands back the seed, and that the seed brings the
     * same failure back. Never more than that: see §9.6.
     */
    'act3.hinge':
        "The test you just watched go green stays green, because one line in it says the only thing that test needs. Here's what happens when a test forgets one.",

    'act3.title': 'A red that comes back when you ask it to',
    'act3.summary':
        'Arbitrary values make a forgetful test fail every so often. When it fails, it hands you back the seed.',

    'act3.forgotten.title': 'One line lighter',
    'act3.forgotten.body':
        "The same test, with the status left arbitrary. Two of the three statuses can't be cancelled, so it goes red on roughly two runs in three. Nothing is broken. The test just stopped saying what it needed.",

    'act3.seed.title': 'The failure hands back its seed',
    'act3.seed.body':
        'One line, in the output of the test that failed: the seed those values came from, and the attribute that replays it.',

    'act3.replay.title': 'Paste it, and the red comes back',
    'act3.replay.body':
        'The same failure, on any machine — and these are the values that failed, not values that resemble them. Each test case draws its own seed, so a suite running in parallel hands you back the seed of the case that failed.',

    'act3.exit.title': 'A package, a tool, and an adapter',
    'act3.exit.body':
        "The adapter turns a red test into a seed you can replay, and it's the smallest of the three. Everything this page has shown you is here.",

    /**
     * The hero's loading contract (§9.8). The mention is required, not optional: a value
     * with no provenance reads as live, and the first press would then look like a refresh
     * rather than the moment the library started running in the visitor's browser.
     */
    'hero.builtValue': 'produced at build time',
    'hero.seed': 'seed',
    'hero.run': 'Run it here',
    'hero.loading': 'Loading the .NET runtime…',
    'hero.cost': 'about 1.2 MB, downloaded only if you ask',
    'hero.frameTitle': 'The JustDummies expression, running in your browser',
    /** The name of the chevron at the foot of the first screen. It is a link, so it needs one. */
    'hero.scrollCue': 'Find out more',

    'sample.produced': 'produced',
    'sample.producedEachRun': 'produced, run after run',
    'sample.refused': 'refused',

    'install.library': 'The library',
    'install.cli': '.NET CLI',
    'install.packageManager': 'Package Manager',
    'install.tool': 'The scaffolding tool',
    'install.adapter': 'The xUnit adapter',
    'install.nuget': 'View on NuGet',
    'install.nugetTool': 'The tool on NuGet',
    'install.nugetAdapter': 'The adapter on NuGet',
    'install.documentation': 'Documentation',
    'install.copy': 'Copy',
    'install.copyCommand': 'Copy this command',
    'install.copied': 'Copied',
    'install.copyFailed': 'Could not copy. Select the command and copy it manually.',
    /** Said where a Package Manager panel cannot offer a command, because none exists. */
    'install.toolIsCliOnly': 'A global .NET tool is installed from the command line.',

    /**
     * The state marker of §5.7. It is displayed next to the label, never behind a
     * hover, because there is no hover on a phone.
     */
    'state.comingSoon': 'coming soon',

    /**
     * Said in hidden text on the one link that leaves the site. A link that replaces the
     * window without warning is disorienting for anyone and unrecoverable for a reader
     * whose only way back was the button that no longer goes anywhere.
     */
    'state.newTab': 'opens in a new tab',

    'notfound.title': 'Page not found',
    'notfound.body': 'There is nothing at this address. It may have moved, or never existed.',
    'notfound.home': 'Go to the home page',
} as const;

/**
 * The key set. Derived from English rather than declared separately, so the two can
 * never disagree about what a key is.
 */
export type UiKey = keyof typeof en;

const fr: Record<UiKey, string> = {
    'brand.tagline': 'Juste des dummies. Redoutablement efficaces.',
    'brand.subtitle': 'Des valeurs de test fluides et ciblées, pour .NET.',

    'nav.playground': 'Playground',
    'nav.github': 'GitHub',
    'nav.nuget': 'NuGet',
    'nav.primary': 'Principale',

    'language.label': 'Langue',
    'language.switch': 'Lire cette page en',

    'home.install.label': 'Installer le package',
    'home.meta.description':
        "JustDummies produit pour .NET des valeurs de test arbitraires qui respectent les contraintes que vous déclarez, pour qu'un test dise ce dont il parle, et rien d'autre.",

    'act1.title': 'La valeur dont votre test se moque',
    'act1.summary': 'Elle doit quand même être valide.',

    'act1.test.title': 'En général, votre test ressemble à ça',
    'act1.test.body':
        "Deux lignes font le travail : annuler la commande, vérifier qu'elle l'est. Les trois autres portent le nom d'une valeur quelconque et vous en donnent une précise, tapée à la main — il faut lire la droite de chaque assignation pour s'en rendre compte, et rien là-dedans ne parle d'annulation.",

    'act1.factories.title': 'Une factory par valeur',
    'act1.factories.body':
        "Le test se lit enfin : trois noms, et on sait tout de suite ce qui compte. Mais rien n'a bougé en dessous. AnyOrderReference renvoie toujours la même chaîne qu'avant — le mensonge n'a pas disparu, il a changé de fichier.",

    'act1.careless.title': 'La factory arrête de mentir',
    'act1.careless.body':
        "Any.String() tire une chaîne vraiment quelconque, et le nom devient enfin vrai. Le domaine, lui, n'est pas d'accord. Il refuse la valeur au moment où elle est construite — pas trois assertions plus loin — et il dit exactement ce qui lui manquait.",

    'act1.invariants.title': 'Ce que le domaine réclame',
    'act1.invariants.body':
        "Rien d'exotique là-dedans, et c'est écrit au bon endroit. Sauf que chacune de ces règles est maintenant quelque chose que votre test doit respecter sans jamais en parler.",

    'act1.constraints.title': 'Déclarez les contraintes, pas la valeur',
    'act1.constraints.body':
        "Un maillon par règle, dans la factory. Ce qui en sort est différent à chaque fois, et valide à chaque fois. La chaîne décrit ce qui doit être vrai de la valeur, jamais ce que vous vous apprêtez à vérifier.",

    'act1.exit.title': 'Tout ça tient dans un package',
    'act1.exit.body':
        "Tout ce qui précède, c'est la bibliothèque seule. Si c'est ce que vous êtes venu chercher, prenez-la maintenant : la suite de cette page raconte comment faire disparaître toute cette préparation.",

    'act2.title': 'Quatre lignes de préparation, et pas une seule à écrire',
    'act2.summary': 'Un generator qui vous appartient, écrit à partir du type que vous avez déjà.',

    'act2.install.title': 'Un outil, une fois',
    'act2.install.body':
        "Un outil .NET global. Il lit votre projet comme le fait le compilateur : tout ce qu'il vous demande, c'est le nom d'un type.",

    'act2.scaffold.title': 'Il lit le type et écrit le generator',
    'act2.scaffold.body':
        "Il lit vos propres sources et les transforme en recette. La dernière colonne vous dit ce qu'il a déduit tout seul, et où il s'est arrêté.",

    'act2.link.title': "Il s'arrête là où vous savez déjà répondre",
    'act2.link.body':
        "Plutôt que de deviner, il a marqué ce paramètre : le fichier qu'il a écrit échoue à chaque tirage tant que vous n'avez pas ajouté le maillon. Ce qui va là, c'est la chaîne que vous avez déjà écrite, inchangée. Vous la collez une fois, dans un fichier qui est désormais le vôtre.",

    'act2.concise.title': 'Le test, et rien d’autre',
    'act2.concise.body':
        "Le même test qu'avant, jusqu'à l'assertion comprise. Une ligne de préparation, qui nomme la seule chose dont ce test a besoin : la commande est en attente.",

    'act2.exit.title': 'Un package et un outil',
    'act2.exit.body':
        "L'outil est facultatif. Tout ce qu'il a retiré ici, la bibliothèque seule l'avait déjà rendu possible. Prenez les deux si c'était la préparation qui vous gênait ; prenez la bibliothèque seule sinon.",

    'act3.hinge':
        "Le test que vous venez de voir passer au vert y reste, parce qu'une ligne y dit la seule chose dont ce test a besoin. Voici ce qui se passe quand un test oublie cette ligne.",

    'act3.title': 'Un rouge qui revient quand vous le demandez',
    'act3.summary':
        'Des valeurs arbitraires font échouer de temps en temps un test distrait. Quand il échoue, il vous rend son seed.',

    'act3.forgotten.title': 'Une ligne de moins',
    'act3.forgotten.body':
        "Le même test, avec le statut laissé arbitraire. Deux des trois statuts ne s'annulent pas, donc il passe au rouge environ deux fois sur trois. Rien n'est cassé. Le test a simplement cessé de dire ce dont il avait besoin.",

    'act3.seed.title': "L'échec rend son seed",
    'act3.seed.body':
        "Une ligne, dans la sortie du test qui a échoué : le seed d'où venaient ces valeurs, et l'attribut qui les rejoue.",

    'act3.replay.title': 'Collez-le, et le rouge revient',
    'act3.replay.body':
        "Le même échec, sur n'importe quelle machine — et ce sont bien les valeurs qui ont échoué, pas des valeurs qui leur ressemblent. Chaque cas de test tire son propre seed : une suite qui tourne en parallèle vous rend le seed du cas qui a échoué.",

    'act3.exit.title': 'Un package, un outil et un adaptateur',
    'act3.exit.body':
        "L'adaptateur transforme un test rouge en un seed rejouable, et c'est la plus petite des trois. Tout ce que cette page vous a montré est là.",

    'hero.builtValue': 'produite au build',
    'hero.seed': 'graine',
    'hero.run': 'Exécuter ici',
    'hero.loading': 'Chargement du runtime .NET…',
    'hero.cost': "environ 1,2 Mo, téléchargés seulement si vous le demandez",
    'hero.frameTitle': "L'expression JustDummies, exécutée dans votre navigateur",
    'hero.scrollCue': 'En savoir plus',

    'sample.produced': 'produit',
    'sample.producedEachRun': 'produit, exécution après exécution',
    'sample.refused': 'refusé',

    'install.library': 'La bibliothèque',
    'install.cli': 'CLI .NET',
    'install.packageManager': 'Console du gestionnaire de packages',
    'install.tool': "L'outil de scaffolding",
    'install.adapter': "L'adaptateur xUnit",
    'install.nuget': 'Voir sur NuGet',
    'install.nugetTool': "L'outil sur NuGet",
    'install.nugetAdapter': "L'adaptateur sur NuGet",
    'install.documentation': 'Documentation',
    'install.copy': 'Copier',
    'install.copyCommand': 'Copier cette commande',
    'install.copied': 'Copié',
    'install.copyFailed': 'Copie impossible. Sélectionnez la commande et copiez-la à la main.',
    'install.toolIsCliOnly': "Un outil .NET global s'installe en ligne de commande.",

    'state.comingSoon': 'en cours de construction',
    'state.newTab': 'ouvre un nouvel onglet',

    'notfound.title': 'Page introuvable',
    'notfound.body': "Il n'y a rien à cette adresse. Elle a pu changer, ou n'avoir jamais existé.",
    'notfound.home': "Aller à la page d'accueil",
};

const translations: Record<Locale, Record<UiKey, string>> = { en, fr };

/**
 * Returns the translator for a locale. Written as a factory so a page reads
 * `t('brand.tagline')` rather than repeating the locale at every call site.
 */
export function useTranslations(locale: Locale): (key: UiKey) => string {
    return function translate(key: UiKey): string {
        return translations[locale][key];
    };
}
