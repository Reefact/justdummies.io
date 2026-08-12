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

    'act1.careless.title': 'Making the factory tell the truth',
    'act1.careless.body':
        "Any.String() draws a genuinely arbitrary string, so the name is finally true. Drawing at random in a test looks like the wrong instinct — a value you typed is at least a value you know — but that is also the whole of what it proves: that the test passes with that one. The domain, meanwhile, disagrees. It refuses the value the moment it is built, not three assertions later, and it says exactly what was missing.",

    'act1.invariants.title': 'What the domain is asking for',
    'act1.invariants.body':
        "There's nothing exotic here, and it's written where it belongs. But each of these rules is now something your test has to satisfy without ever talking about it.",

    'act1.constraints.title': 'Declare the constraints, not the value',
    'act1.constraints.body':
        "One link per rule, inside the factory. What comes out is different every time, and valid every time — and that is where drawing at random earns its place. This value was never what the test was about; it only ever had to be valid. Any value that satisfies the rules says exactly what this test had to say, and nothing more. The chain describes what has to be true of the value — never what you're about to assert about it.",

    'act1.exit.title': 'All of that is the library',
    'act1.exit.body':
        "Everything above is the library on its own. If that's what you came for, take it now — and take the adapter with it: that is what hands you back the exact draw, the day an arbitrary value makes a test fail. The rest of this page is about making all that setup disappear.",

    /**
     * ACT II — concision. The claim is that the arrangement can go away without the test
     * losing what it was about, and that the tool writes the part nobody wants to write.
     */
    'act2.title': 'Most of that setup, a tool writes for you',
    'act2.summary': 'It reads your type, writes the generator, and says where it stopped. The file is yours from then on.',

    'act2.wanted.title': 'What we would like to write',
    'act2.wanted.body':
        'One line for the arrangement, saying the one thing this test needs. You can write that helper yourself — it is the first act\'s chain, in a file of your own, and yours to keep in step with the type. The rest of this act is a tool writing it instead.',

    'act2.scaffold.title': 'It reads the type and writes the generator',
    'act2.scaffold.body':
        'A global .NET tool, run once per type. It works from your own source and decides, parameter by parameter, how to draw a value — and the last column says what it worked out on its own, and where it stopped.',

    'act2.link.title': 'What it could not work out, you have already written',
    'act2.link.body':
        "Above, the recipe as the tool wrote it. The ORD- prefix rule is not among the guards it reads, so it marked that parameter rather than guess at it — and the file it wrote throws on every draw until you add the link. Below, the same recipe one link longer: the chain you already wrote, unchanged, pasted once into a file that is now yours.",

    'act2.concise.title': 'One line, and it tells the truth',
    'act2.concise.body':
        'Same test as before, right down to the assertion. One line of setup, naming the only thing this test needs to be true: the order is pending. Everything else is drawn, valid, and different on every run — nothing on that line pretends to be something it is not.',

    'act2.exit.title': 'Install all of it',
    'act2.exit.body':
        "The tool is optional. Everything it removed here, the library on its own had already made possible — what the tool saves you is the writing of it.",

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
        'A test that goes red when everything about it was arranged to be green has just told you something: the value drawn that day found a case your code does not hold. That is a bug that would otherwise have shipped. And that draw is not lost — the next two scenes are about getting it back, exactly, in one line.',

    'act3.forgotten.title': 'Take an example',
    'act3.forgotten.body':
        "The same test, with the status left arbitrary. Two of the three statuses can't be cancelled, so it goes red on roughly two runs in three. Nothing is broken. The test has just found out it wasn't saying what it needed.",

    'act3.seed.title': 'The failing test tells you how to replay it',
    'act3.seed.body':
        'One line, in the output of the test that failed — the line you read in your build. It carries a number, the seed, and that number is all it takes to draw those same values again.',

    'act3.replay.title': 'Paste it, and you get the same draw back',
    'act3.replay.body':
        'The seed your build reported, pasted into the test on your own machine: the same failure, and these are the values that failed rather than values resembling them. Each test case draws its own seed, so a suite running in parallel hands you back the seed of the case that failed.',

    'act3.exit.title': 'Want to try it?',
    'act3.exit.lead': 'Three packages, none of them large, and you have seen what each of them does.',
    'act3.exit.body':
        "The adapter turns a red test into a draw you can replay, and it's the smallest of the three. All three are here.",

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
        "JustDummies produit pour .NET des valeurs de test arbitraires qui respectent les contraintes que vous déclarez, pour qu'un test dise ce dont il parle, et rien d'autre.",

    'act1.title': 'La valeur dont votre test se moque',
    'act1.summary': 'Elle doit quand même être valide.',

    'act1.test.title': 'En général, votre test ressemble à ça',
    'act1.test.body':
        "Deux lignes font le travail : annuler la commande, vérifier qu'elle l'est. Les trois autres portent le nom d'une valeur quelconque et vous en donnent une précise, tapée à la main — il faut lire la droite de chaque assignation pour s'en rendre compte, et rien là-dedans ne parle d'annulation.",

    'act1.factories.title': 'Une factory par valeur',
    'act1.factories.body':
        "Le test se lit enfin : trois noms, et on sait tout de suite ce qui compte. Mais rien n'a bougé en dessous. AnyOrderReference renvoie toujours la même chaîne qu'avant — le mensonge n'a pas disparu, il a changé de fichier.",

    'act1.careless.title': 'Faire dire vrai à la factory',
    'act1.careless.body':
        "Any.String() tire une chaîne vraiment quelconque, et le nom devient enfin vrai. Tirer au hasard dans un test paraît contre-intuitif — une valeur qu'on a tapée, au moins, on sait ce qu'elle vaut — mais c'est aussi tout ce qu'elle démontre : que le test passe avec celle-là. Le domaine, lui, n'est pas d'accord. Il refuse la valeur au moment où elle est construite, pas trois assertions plus loin, et il dit exactement ce qui lui manquait.",

    'act1.invariants.title': 'Ce que le domaine réclame',
    'act1.invariants.body':
        "Rien d'exotique là-dedans, et c'est écrit au bon endroit. Sauf que chacune de ces règles est maintenant quelque chose que votre test doit respecter sans jamais en parler.",

    'act1.constraints.title': 'Déclarez les contraintes, pas la valeur',
    'act1.constraints.body':
        "Un maillon par règle, dans la factory. Ce qui en sort est différent à chaque fois, et valide à chaque fois — et c'est là que le hasard prend tout son sens. Cette valeur n'a jamais été le sujet du test ; elle devait seulement être valide. N'importe quelle valeur qui respecte les règles dit donc exactement ce que ce test avait à dire, et rien de plus. La chaîne décrit ce qui doit être vrai de la valeur, jamais ce que vous vous apprêtez à vérifier.",

    'act1.exit.title': "Tout ça, c'est la bibliothèque",
    'act1.exit.body':
        "Tout ce qui précède, c'est la bibliothèque seule. Si c'est ce que vous êtes venu chercher, prenez-la maintenant — et prenez l'adaptateur avec : c'est lui qui vous rendra le tirage exact, le jour où une valeur quelconque fera échouer un test. La suite de cette page raconte comment faire disparaître toute cette préparation.",

    'act2.title': "L'essentiel de cette préparation, un outil l'écrit",
    'act2.summary': "Il lit votre type, écrit le générateur, et dit où il s'est arrêté. À partir de là, le fichier est le vôtre.",

    'act2.wanted.title': 'Ce qu\'on aimerait écrire',
    'act2.wanted.body':
        "Une ligne de préparation, qui dit la seule chose dont ce test a besoin. Ce helper, vous pouvez l'écrire vous-même — c'est la chaîne du premier acte, dans un fichier à vous, qu'il faudra tenir à jour avec le type. La suite de cet acte, c'est un outil qui l'écrit à votre place.",

    'act2.scaffold.title': 'Il lit le type et écrit le générateur',
    'act2.scaffold.body':
        "Un outil .NET global, lancé une fois par type. Il part de vos propres sources et décide, paramètre par paramètre, comment tirer une valeur — et la dernière colonne dit ce qu'il a trouvé tout seul, et où il s'est arrêté.",

    'act2.link.title': "Ce qu'il n'a pas su deviner, vous l'avez déjà écrit",
    'act2.link.body':
        "En haut, la recette telle que l'outil l'a écrite. La règle du préfixe ORD- ne fait pas partie des gardes qu'il sait lire : plutôt que de deviner, il a marqué ce paramètre — et le fichier qu'il a écrit échoue à chaque tirage tant que le maillon manque. En bas, la même recette avec un maillon de plus : la chaîne que vous avez déjà écrite, inchangée, collée une fois dans un fichier qui est désormais le vôtre.",

    'act2.concise.title': 'Une ligne, et elle dit vrai',
    'act2.concise.body':
        "Le même test qu'avant, jusqu'à l'assertion comprise. Une ligne de préparation, qui nomme la seule chose dont ce test a besoin : la commande est en attente. Tout le reste est tiré, valide, et différent à chaque exécution — plus rien sur cette ligne ne prétend être ce qu'il n'est pas.",

    'act2.exit.title': 'Installer tout ça',
    'act2.exit.body':
        "L'outil est facultatif. Tout ce qu'il a retiré ici, la bibliothèque seule l'avait déjà rendu possible — ce que l'outil vous épargne, c'est de l'écrire.",

    'act3.hinge':
        'Une question se pose forcément ici : si les valeurs changent à chaque exécution, comment revenir sur celle qui a fait échouer un test ?',

    'act3.title': "Un tirage qui se rejoue à l'identique",
    'act3.summary':
        "Les valeurs changent à chaque exécution. Le jour où l'une d'elles fait échouer un test, vous récupérez exactement celle-là.",

    'act3.attribute.title': "Attraper un bug avant qu'il n'arrive en production",
    'act3.attribute.body':
        "Un test qui passe au rouge alors que tout, en lui, était fait pour qu'il soit vert vient de vous apprendre quelque chose : la valeur tirée ce jour-là a trouvé un cas que votre code ne tient pas. C'est un bug qui serait parti en production. Et ce tirage n'est pas perdu : les deux étapes qui suivent servent à le récupérer, à l'identique, en une ligne.",

    'act3.forgotten.title': 'Prenons un exemple',
    'act3.forgotten.body':
        "Le même test, avec le statut laissé arbitraire. Deux des trois statuts ne s'annulent pas, donc il passe au rouge environ deux fois sur trois. Rien n'est cassé. Le test vient simplement de découvrir qu'il ne disait pas ce dont il avait besoin.",

    'act3.seed.title': 'Le test qui échoue vous dit comment le rejouer',
    'act3.seed.body':
        "Une ligne, dans la sortie du test qui a échoué — celle que vous lisez dans votre build. Elle porte un numéro, le seed, et ce numéro suffit à retirer exactement les mêmes valeurs.",

    'act3.replay.title': 'Collez-le, et vous retrouvez le même tirage',
    'act3.replay.body':
        "Le seed rapporté par votre build, collé dans le test sur votre machine : le même échec, et ce sont bien les valeurs qui ont échoué, pas des valeurs qui leur ressemblent. Chaque cas de test tire son propre seed : une suite qui tourne en parallèle vous rend le seed du cas qui a échoué.",

    'act3.exit.title': 'Envie d\'essayer ?',
    'act3.exit.lead': "Trois packages, aucun n'est gros, et vous avez vu ce que chacun fait.",
    'act3.exit.body':
        "L'adaptateur transforme un test rouge en un tirage que vous rejouez, et c'est la plus petite des trois pièces. Elles sont toutes là.",

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
