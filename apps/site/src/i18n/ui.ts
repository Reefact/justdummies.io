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
    'brand.tagline': 'Just dummies — but seriously powerful ones.',
    'brand.subtitle': 'Focused, fluent test values for .NET.',

    'nav.playground': 'Playground',
    'nav.github': 'GitHub',
    'nav.nuget': 'NuGet',
    'nav.primary': 'Primary',

    'language.label': 'Language',
    'language.switch': 'Read this page in',

    'home.install.label': 'Install the package',
    'home.meta.description':
        'JustDummies produces arbitrary test values that satisfy the constraints you declare. Your tests then say what they are about, and nothing else.',

    /**
     * ACT I — validity. The claim is that a value a test does not care about still has
     * to be valid, and that declaring what must be true is a different job from writing
     * a value down.
     */
    'act1.title': 'The value your test does not care about',
    'act1.summary': 'It still has to be valid.',

    'act1.test.title': 'Your test probably looks like this',
    'act1.test.body':
        'This test is hard to read, and the arrangement is why. Three of its lines build values the test has no interest in: the constructor demands them, and that is the only reason. The one useful piece of information comes last, and it is two words long: the order is pending.',

    'act1.factories.title': 'A first tidy-up',
    'act1.factories.body':
        'Better already: the factories say any, the variables say it too, and the arrangement is three lines that announce their intent. A good start — except nothing moved underneath. AnyOrderReference still returns the string it always did: the code announces any and hands you one, always the same one. The lie did not go away, it moved to another file.',

    'act1.careless.title': 'Making the factory tell the truth',
    'act1.careless.body':
        'The factory now calls the library: Any.String() draws a genuinely arbitrary string, different on every run. The name AnyOrderReference stops lying. Drawing at random is surprising, but a value you typed proves only one thing: that the test passes with that one. The domain refuses the string it drew. That string does not start with ORD-, and OrderReference.Create says so as the value is built, not three assertions later.',

    'act1.invariants.title': 'What the domain is asking for',
    'act1.invariants.body':
        'These rules are not exotic, and they are written where they belong. But every one of them has to be satisfied. It is the generator\'s job to satisfy them, without the test having to mention any of it.',

    'act1.constraints.title': 'Declare the constraints, not the value',
    'act1.constraints.body':
        'Every business rule becomes a call in the chain: not empty, twenty characters at most, starts with ORD-. The value it produces changes on every run, and it is valid every time. This is where drawing at random makes sense. That value was never the subject of the test, it only had to be valid. Any value that satisfies the rules will do. You describe what the value must satisfy, not what you are going to assert.',

    'act1.exit.title': 'Install it now',
    'act1.exit.body':
        'Everything above is the library on its own. If that is what you came for, install it now. Take the adapter with it: it makes your draws replayable, and the page comes back to that further down. What follows shows how all this setup disappears.',

    /**
     * ACT II — concision. The claim is that the arrangement can go away without the test
     * losing what it was about, and that the tool writes the part nobody wants to write.
     */
    'act2.title': 'Simpler still',
    'act2.summary': 'A tool reads your type and writes the generator. The file it produces is yours.',

    'act2.wanted.title': 'What we would like to write',
    'act2.wanted.body':
        'CreateAnyPendingOrder() replaces the three lines of arrangement, and the test says only what matters: the order is pending. You can write that helper yourself: it holds the chain of constraints you have just written, in a file of your own test project. The day Order gains a parameter, you are the one reopening that file. What follows is a tool that writes it, and rewrites it.',

    'act2.scaffold.title': 'The tool reads your type and writes the generator',
    'act2.scaffold.body':
        'dum is a global .NET tool. You run it once per type. It reads your own source and decides, parameter by parameter, how to draw a value. The last column says what it worked out on its own, and where it stopped.',

    'act2.link.title': 'Generated to help you, and yours to change',
    'act2.link.body':
        'The tool writes the whole file: the fields, the recipe, one With… per parameter, the draw. It cannot read the ORD- prefix rule, so it marked that parameter rather than guess at it. The file compiles, and it throws on every draw until you add the link. You add .StartingWith("ORD-") to the reference parameter, and that is the chain you already wrote, unchanged. The file is yours: read it, edit it, commit it.',

    'act2.concise.title': 'A test that is explicit at last, and does not lie',
    'act2.concise.body':
        'Same test as before, right down to the assertion. The arrangement is one line, and that line names the only thing the test needs: the order is pending. The rest is drawn on every run, and stays valid. Nothing here is called any while handing back the same value every time.',

    'act2.exit.title': 'Install all of it',
    'act2.exit.body':
        'The tool is optional. The library on its own already made all of this possible. The tool only saves you the writing.',

    /**
     * ACT III — reproducibility. The claim is that a drawn value can be got back exactly,
     * and the act says so before it shows anything failing (ADR-0007): the reader arrives
     * here with the question "what happens when one of these values breaks a test", and an
     * act that opens on a red answers it two scenes late.
     *
     * The promise is never widened: the seed replays the test case that reported it, and
     * that is what the page says and no more (§9.6).
     */
    'act3.hinge':
        'A question comes up here on its own: if the values change on every run, how do you get back the one that made a test fail?',

    'act3.title': 'A draw you can replay exactly',
    'act3.summary':
        'The values change on every run. The day one of them makes a test fail, you get that exact one back.',

    'act3.attribute.title': 'Catching a bug before it reaches production',
    'act3.attribute.body':
        'Your build goes red although nothing changed in the code. The value drawn that day found a case your code does not hold. That is a bug that would have shipped. The draw is not lost: the next two scenes get it back exactly, in one line.',

    'act3.forgotten.title': 'Take an example',
    'act3.forgotten.body':
        'This test is the same, but the status is left arbitrary. Two of the three statuses cannot be cancelled, so it goes red on roughly two runs in three. Nothing is broken. The test has just found out it was not saying what it needed.',

    'act3.seed.title': 'The failing test tells you how to replay it',
    'act3.seed.body':
        "The test that failed writes one line into your build's output. That line carries a number: the seed. That number is all it takes to draw exactly the same values again.",

    'act3.replay.title': 'Paste it, and you get the same draw back',
    'act3.replay.body':
        'You paste the seed your build reported into the test, and the failure comes back on your machine. These are the values that failed, not values that resemble them. Each test case draws its own seed, so a suite running in parallel hands you back the seed of the case that failed.',

    'act3.exit.title': 'Want to try it?',
    'act3.exit.lead': 'Three packages. None of them is large, and you have seen what each one does.',
    'act3.exit.body':
        'The adapter turns a red test into a draw you can replay. It is the smallest of the three packages. All three are here.',

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
    'sample.whenItRuns': 'what the build got when it ran it',
    /** The fold on a figure too tall for a scene. The count is appended by the script. */
    'sample.showWholeFile': 'Show the whole file',
    'sample.fold': 'Fold',
    'sample.lines': 'lines',

    'install.library': 'The library',
    'install.cli': '.NET CLI',
    'install.packageManager': 'Package Manager',
    'install.tool': 'The scaffolding tool',
    'install.adapter': 'The xUnit adapter',
    'install.nuget': 'View on NuGet',
    'install.copy': 'Copy',
    'install.copyCommand': 'Copy this command',
    'install.copied': 'Copied',
    'install.copyFailed': 'Could not copy. Select the command and copy it manually.',
    /** Said where a Package Manager panel cannot offer a command, because none exists. */
    'install.toolIsCliOnly': 'A global .NET tool is installed from the command line.',

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
    'brand.tagline': 'Juste des dummies, mais redoutablement efficaces.',
    'brand.subtitle': 'Des valeurs de test fluides et ciblées, pour .NET.',

    'nav.playground': 'Playground',
    'nav.github': 'GitHub',
    'nav.nuget': 'NuGet',
    'nav.primary': 'Principale',

    'language.label': 'Langue',
    'language.switch': 'Lire cette page en',

    'home.install.label': 'Installer le package',
    'home.meta.description':
        "JustDummies produit des valeurs de test arbitraires qui respectent les contraintes que vous déclarez. Vos tests ne disent plus que ce dont ils parlent.",

    'act1.title': 'La valeur dont votre test se moque',
    'act1.summary': 'Elle doit quand même être valide.',

    'act1.test.title': 'En général, votre test ressemble à ça',
    'act1.test.body':
        "Ce test est difficile à lire, et l'arrange en est la cause. Trois lignes y construisent des valeurs dont le test n'a rien à faire : le constructeur les exige, c'est tout. La seule information utile arrive en dernier, et elle tient en deux mots : la commande est en attente.",

    'act1.factories.title': 'Un premier nettoyage',
    'act1.factories.body':
        "C'est déjà mieux : les factories disent « any », les variables aussi, et l'arrange tient sur trois lignes qui annoncent leur intention. Un bon début — sauf que rien n'a bougé en dessous. AnyOrderReference renvoie toujours la même chaîne qu'avant : le code annonce « n'importe laquelle » et en donne une seule, toujours la même. Le mensonge n'a pas disparu, il a changé de fichier.",

    'act1.careless.title': 'Faire dire vrai à la factory',
    'act1.careless.body':
        "La factory appelle maintenant la bibliothèque : Any.String() tire une chaîne vraiment quelconque, différente à chaque exécution. Le nom AnyOrderReference ne ment plus. Tirer au hasard surprend, mais une valeur tapée à la main ne prouve qu'une chose : que le test passe avec celle-là. Le domaine, lui, refuse la chaîne tirée. Elle ne commence pas par ORD-, et OrderReference.Create le dit dès la construction, pas trois assertions plus loin.",

    'act1.invariants.title': 'Ce que le domaine réclame',
    'act1.invariants.body':
        "Ces règles n'ont rien d'exotique, et elles sont écrites au bon endroit. Mais chacune doit être respectée. C'est donc au générateur de s'y conformer, sans que le test ait à en parler.",

    'act1.constraints.title': 'Déclarez les contraintes, pas la valeur',
    'act1.constraints.body':
        "Chaque règle métier devient un appel dans la chaîne : non vide, vingt caractères au plus, commence par ORD-. La valeur produite change à chaque exécution, et elle est valide à chaque fois. Le hasard prend son sens ici. Cette valeur n'a jamais été le sujet du test, elle devait seulement être valide. N'importe laquelle qui respecte les règles fait donc l'affaire. Vous décrivez ce que la valeur doit respecter, pas ce que vous allez vérifier.",

    'act1.exit.title': 'Installez-la maintenant',
    'act1.exit.body':
        "Tout ce qui précède, c'est la bibliothèque seule. Si c'est ce que vous cherchiez, installez-la maintenant. Prenez l'adaptateur xUnit avec : il rend vos tirages rejouables, et la page y revient plus bas. La suite montre comment faire disparaître toute cette préparation.",

    'act2.title': 'Simplifions encore',
    'act2.summary': 'Un outil lit votre type et écrit le générateur. Le fichier produit est le vôtre.',

    'act2.wanted.title': 'Ce qu\'on aimerait écrire',
    'act2.wanted.body':
        "CreateAnyPendingOrder() remplace les trois lignes d'arrange, et le test ne dit plus que l'essentiel : la commande est en attente. Ce helper, vous pouvez l'écrire vous-même : il contient la chaîne de contraintes que vous venez d'écrire, dans un fichier de votre projet de test. Le jour où Order gagne un paramètre, c'est vous qui rouvrez ce fichier. La suite montre un outil qui l'écrit, et qui le réécrit.",

    'act2.scaffold.title': 'L\'outil lit votre type et écrit le générateur',
    'act2.scaffold.body':
        "dum est un outil .NET global. Vous le lancez une fois par type. Il lit vos propres sources et décide, paramètre par paramètre, comment tirer une valeur. La dernière colonne dit ce qu'il a trouvé seul, et où il s'est arrêté.",

    'act2.link.title': 'Généré pour vous aider, vous gardez la main',
    'act2.link.body':
        "L'outil écrit tout le fichier : les champs, la recette, un With… par paramètre, le tirage. Il ne sait pas lire la règle du préfixe ORD-, alors il la signale au lieu de l'inventer. Le fichier compile, et il échoue à chaque tirage tant que le maillon manque. Vous ajoutez .StartingWith(\"ORD-\") sur le paramètre reference : c'est la chaîne que vous avez déjà écrite, inchangée. Le fichier vous appartient : vous le lisez, vous le modifiez, vous le commitez.",

    'act2.concise.title': 'Un test enfin explicite, et qui ne ment pas',
    'act2.concise.body':
        "Le même test qu'avant, jusqu'à l'assertion comprise. La préparation tient sur une ligne, et cette ligne nomme la seule chose dont le test a besoin : la commande est en attente. Le reste est tiré à chaque exécution, et reste valide. Plus rien ici ne s'appelle « any » en rendant toujours la même valeur.",

    'act2.exit.title': 'Installer tout ça',
    'act2.exit.body':
        "L'outil est facultatif. La bibliothèque seule rendait déjà tout cela possible. L'outil vous épargne seulement de l'écrire.",

    'act3.hinge':
        'Une question se pose forcément ici : si les valeurs changent à chaque exécution, comment revenir sur celle qui a fait échouer un test ?',

    'act3.title': "Un tirage qui se rejoue à l'identique",
    'act3.summary':
        "Les valeurs changent à chaque exécution. Le jour où l'une d'elles fait échouer un test, vous récupérez exactement celle-là.",

    'act3.attribute.title': "Attraper un bug avant qu'il n'arrive en production",
    'act3.attribute.body':
        "Votre build passe au rouge alors que rien n'a changé dans le code. La valeur tirée ce jour-là a trouvé un cas que votre code ne tient pas. C'est un bug qui serait parti en production. Ce tirage n'est pas perdu : les deux étapes qui suivent le récupèrent à l'identique, en une ligne.",

    'act3.forgotten.title': 'Prenons un exemple',
    'act3.forgotten.body':
        "Ce test est le même, mais le statut reste arbitraire. Deux des trois statuts ne s'annulent pas, donc il passe au rouge environ deux fois sur trois. Rien n'est cassé. Le test vient de découvrir qu'il ne disait pas ce dont il avait besoin.",

    'act3.seed.title': 'Le test qui échoue vous dit comment le rejouer',
    'act3.seed.body':
        "Le test qui a échoué écrit une ligne dans la sortie de votre build. Cette ligne porte un numéro : le seed. Ce numéro suffit à retirer exactement les mêmes valeurs.",

    'act3.replay.title': 'Collez-le, et vous retrouvez le même tirage',
    'act3.replay.body':
        "Vous collez dans le test le seed rapporté par votre build, et l'échec revient sur votre machine. Ce sont les valeurs qui ont échoué, pas des valeurs qui leur ressemblent. Chaque cas de test tire son propre seed, donc une suite qui tourne en parallèle vous rend le seed du cas qui a échoué.",

    'act3.exit.title': 'Envie d\'essayer ?',
    'act3.exit.lead': "Trois packages. Aucun n'est gros, et vous avez vu ce que chacun fait.",
    'act3.exit.body':
        "L'adaptateur transforme un test rouge en un tirage que vous rejouez. C'est le plus petit des trois packages. Les trois sont ici.",

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
    'sample.whenItRuns': "ce que le build a obtenu en l'exécutant",
    'sample.showWholeFile': 'Afficher tout le fichier',
    'sample.fold': 'Réduire',
    'sample.lines': 'lignes',

    'install.library': 'La bibliothèque',
    'install.cli': 'CLI .NET',
    'install.packageManager': 'Console du gestionnaire de packages',
    'install.tool': "L'outil de scaffolding",
    'install.adapter': "L'adaptateur xUnit",
    'install.nuget': 'Voir sur NuGet',
    'install.copy': 'Copier',
    'install.copyCommand': 'Copier cette commande',
    'install.copied': 'Copié',
    'install.copyFailed': 'Copie impossible. Sélectionnez la commande et copiez-la à la main.',
    'install.toolIsCliOnly': "Un outil .NET global s'installe en ligne de commande.",

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
