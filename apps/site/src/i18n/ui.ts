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
    'home.progress.note':
        'The three acts are built. What the specification still describes and this page does not carry: the comparison table, the reduced install block in the header, and the playground beyond its shell.',

    /**
     * ACT I — validity. The claim is that a value a test does not care about still has
     * to be valid, and that declaring what must be true is a different job from writing
     * a value down.
     */
    'act1.label': 'Act I',
    'act1.title': 'The value your test does not care about',
    'act1.summary': 'It still has to be valid.',

    'act1.test.title': 'The test is already written',
    'act1.test.body':
        'Everything it is about fits in three lines: a pending order, cancelled, ends up cancelled. The one thing it does not say is where that order comes from — and that is the line that will take all the work.',

    'act1.careless.title': 'The shortest thing that could work',
    'act1.careless.body':
        'The test does not care what the reference is. The domain does, and it says so at the moment the value is built rather than three assertions later. Any string will not do.',

    'act1.invariants.title': 'What the domain is asking for',
    'act1.invariants.body':
        'Not much, and nothing unusual: not blank, a prefix, a maximum length. Written once, as guard clauses, where they belong. Each one is now a rule your test has to satisfy without ever mentioning it.',

    'act1.constraints.title': 'Declare the constraints, not the value',
    'act1.constraints.body':
        'One link per rule. What comes out is arbitrary — a different reference every run — and valid every run. The chain says what must be true of the value, never what the test is about to assert.',

    'act1.derivation.title': 'One more link, and it is a domain object',
    'act1.derivation.body':
        'The derivation hands the drawn value to the factory the domain already exposes. No constructor added for tests, no visibility widened, no second copy of the rules to keep in step. The type on the left changes; nothing else does.',

    'act1.verbose.title': 'It works. And it says far too much.',
    'act1.verbose.body':
        'Every value is valid, and not one of them is about cancelling an order. Four lines of arrangement for one line of behaviour: the test passes, and reads like a description of the constructor.',

    'act1.exit.title': 'That much is one package',
    'act1.exit.body':
        'Everything above is the library on its own. If it is what you came for, take it now — the rest of this page is about making that arrangement disappear.',

    /**
     * ACT II — concision. The claim is that the arrangement can go away without the test
     * losing what it was about, and that the tool writes the part nobody wants to write.
     */
    'act2.label': 'Act II',
    'act2.title': 'Four lines of arrangement, and none of them yours to write',
    'act2.summary': 'A generator you own, scaffolded from the type you already have.',

    'act2.install.title': 'One tool, once',
    'act2.install.body':
        'A global .NET tool. It reads your project the way the compiler does, so it needs nothing from you but the name of a type.',

    'act2.scaffold.title': 'It reads the type and writes the generator',
    'act2.scaffold.body':
        'The constructor, every parameter, the factory each value object exposes, and the guard clauses behind them — read from your own source and turned into a recipe. Note the last column: it says what it inferred, and where it stopped.',

    'act2.link.title': 'It stops where you already know the answer',
    'act2.link.body':
        'A prefix rule is not one of the guard shapes it reads, so it marked that parameter and left the recipe neutral rather than guessing — which means the file it wrote throws on every draw until you add the link. That link is the chain from the first act, unchanged. You paste it once, into a file that is now yours.',

    'act2.concise.title': 'The test, and nothing else',
    'act2.concise.body':
        'Same test as before, down to the assertion. One line of arrangement, and it names the only thing the test needs to be true: the order is pending. Everything else about that order is arbitrary, valid, and none of the test’s business.',

    'act2.exit.title': 'A package and a tool',
    'act2.exit.body':
        'The tool is optional — everything the second act removed, the first act had already made possible. Take both if the arrangement was your complaint; take the library alone if it was not.',

    /**
     * ACT III — reproducibility. The claim is that a test which forgot to constrain a value
     * fails now and then, that the failure hands back the seed, and that the seed brings the
     * same failure back. Never more than that: see §9.6.
     */
    'act3.hinge':
        'The test you just watched go green stays green. It stays green because one line in it says the only thing the test needs to be true, and the last act spent four scenes putting that line there. What follows is what happens when a test forgets one.',

    'act3.label': 'Act III',
    'act3.title': 'A red that comes back when you ask it to',
    'act3.summary': 'Arbitrary values fail a forgetful test now and then. The failure hands back the seed.',

    'act3.forgotten.title': 'One line lighter',
    'act3.forgotten.body':
        'The same test, with the status left arbitrary. An order can be pending, cancelled or shipped, and two of those cannot be cancelled — so it goes red on roughly two runs in three. Nothing is broken here. The test simply stopped saying what it needed.',

    'act3.seed.title': 'The failure hands back its seed',
    'act3.seed.body':
        'Not a screenshot to compare against, and not a value to dig out of a diff. One line, in the output of the test that failed, naming the seed those values were drawn from and the attribute that replays it.',

    'act3.replay.title': 'Paste it, and the red comes back',
    'act3.replay.body':
        'The same failure, on any machine, for as long as that line stays there — the values are the ones that failed, not values resembling them. Each test case draws its own seed, so a suite running in parallel still hands back the seed of the case that failed rather than one shared across the run.',

    'act3.exit.title': 'A package, a tool, and an adapter',
    'act3.exit.body':
        'The adapter is the piece that turns a red test into a seed you can replay, and it is the smallest of the three. Everything this page has shown is here.',

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

    'sample.produced': 'produced',
    'sample.producedEachRun': 'produced, run after run',
    'sample.refused': 'refused',

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

    /**
     * The state marker of §5.7. It is displayed next to the label, never behind a
     * hover, because there is no hover on a phone.
     */
    'state.comingSoon': 'coming soon',

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
    'home.progress.note':
        "Les trois actes sont construits. Ce que la spécification décrit encore et que cette page ne porte pas : le tableau comparatif, le bloc d'installation réduit dans l'en-tête, et le playground au-delà de sa coquille.",

    'act1.label': 'Acte I',
    'act1.title': 'La valeur dont votre test se moque',
    'act1.summary': 'Elle doit quand même être valide.',

    'act1.test.title': 'Le test est déjà écrit',
    'act1.test.body':
        "Tout ce dont il parle tient en trois lignes : une commande en attente, annulée, finit annulée. La seule chose qu'il ne dit pas, c'est d'où vient cette commande — et c'est cette ligne-là qui va demander tout le travail.",

    'act1.careless.title': 'Le plus court qui pourrait marcher',
    'act1.careless.body':
        "Le test se moque de ce que vaut la référence. Le domaine, non, et il le dit au moment où la valeur est construite plutôt que trois assertions plus loin. N'importe quelle chaîne ne fera pas l'affaire.",

    'act1.invariants.title': 'Ce que le domaine réclame',
    'act1.invariants.body':
        "Peu de chose, et rien d'inhabituel : non vide, un préfixe, une longueur maximale. Écrites une fois, en clauses de garde, à leur place. Chacune est désormais une règle que votre test doit satisfaire sans jamais en parler.",

    'act1.constraints.title': 'Déclarez les contraintes, pas la valeur',
    'act1.constraints.body':
        "Un maillon par règle. Ce qui en sort est arbitraire — une référence différente à chaque exécution — et valide à chaque exécution. La chaîne dit ce qui doit être vrai de la valeur, jamais ce que le test s'apprête à vérifier.",

    'act1.derivation.title': "Un maillon de plus, et c'est un objet du domaine",
    'act1.derivation.body':
        "La dérivation passe la valeur tirée à la fabrique que le domaine expose déjà. Aucun constructeur ajouté pour les tests, aucune visibilité élargie, aucune seconde copie des règles à tenir à jour. Le type à gauche change ; rien d'autre.",

    'act1.verbose.title': "Ça marche. Et ça en dit beaucoup trop.",
    'act1.verbose.body':
        "Chaque valeur est valide, et pas une ne parle d'annuler une commande. Quatre lignes d'arrangement pour une ligne de comportement : le test passe, et se lit comme une description du constructeur.",

    'act1.exit.title': 'Tout ça tient dans un package',
    'act1.exit.body':
        "Tout ce qui précède, c'est la bibliothèque seule. Si c'est ce que vous êtes venu chercher, prenez-la maintenant — la suite de cette page parle de faire disparaître cet arrangement.",

    'act2.label': 'Acte II',
    'act2.title': "Quatre lignes d'arrangement, et aucune à écrire",
    'act2.summary': 'Un generator qui vous appartient, engendré depuis le type que vous avez déjà.',

    'act2.install.title': 'Un outil, une fois',
    'act2.install.body':
        "Un outil .NET global. Il lit votre projet comme le fait le compilateur : il n'attend de vous que le nom d'un type.",

    'act2.scaffold.title': 'Il lit le type et écrit le generator',
    'act2.scaffold.body':
        "Le constructeur, chaque paramètre, la fabrique que chaque value object expose, et les clauses de garde derrière — lus dans vos propres sources et transformés en recette. Regardez la dernière colonne : elle dit ce qu'il a déduit, et où il s'est arrêté.",

    'act2.link.title': "Il s'arrête là où vous savez déjà répondre",
    'act2.link.body':
        "Une règle de préfixe ne fait pas partie des formes de garde qu'il sait lire : il a donc marqué ce paramètre et laissé la recette neutre plutôt que de deviner — ce qui veut dire que le fichier qu'il a écrit échoue à chaque tirage tant que vous n'avez pas ajouté le maillon. Ce maillon, c'est la chaîne du premier acte, inchangée. Vous la collez une fois, dans un fichier qui est désormais le vôtre.",

    'act2.concise.title': 'Le test, et rien d’autre',
    'act2.concise.body':
        "Le même test qu'avant, jusqu'à l'assertion. Une ligne d'arrangement, et elle nomme la seule chose que le test a besoin de voir vraie : la commande est en attente. Tout le reste de cette commande est arbitraire, valide, et ne regarde pas le test.",

    'act2.exit.title': 'Un package et un outil',
    'act2.exit.body':
        "L'outil est facultatif — tout ce que le second acte a retiré, le premier l'avait déjà rendu possible. Prenez les deux si c'était l'arrangement qui vous gênait ; prenez la bibliothèque seule sinon.",

    'act3.hinge':
        "Le test que vous venez de voir passer au vert y reste. Il y reste parce qu'une ligne y dit la seule chose dont le test a besoin, et l'acte précédent a passé quatre scènes à mettre cette ligne. Ce qui suit, c'est ce qui arrive quand un test en oublie une.",

    'act3.label': 'Acte III',
    'act3.title': 'Un rouge qui revient quand vous le demandez',
    'act3.summary':
        "Des valeurs arbitraires font échouer par intermittence un test distrait. L'échec rend le seed.",

    'act3.forgotten.title': 'Une ligne de moins',
    'act3.forgotten.body':
        "Le même test, avec le statut laissé arbitraire. Une commande peut être en attente, annulée ou expédiée, et deux de ces trois-là ne s'annulent pas — il passe donc au rouge environ deux fois sur trois. Rien n'est cassé ici. Le test a simplement cessé de dire ce dont il avait besoin.",

    'act3.seed.title': "L'échec rend son seed",
    'act3.seed.body':
        "Pas une capture d'écran à comparer, ni une valeur à retrouver dans un diff. Une ligne, dans la sortie du test qui a échoué, qui nomme le seed d'où venaient ces valeurs et l'attribut qui les rejoue.",

    'act3.replay.title': 'Collez-le, et le rouge revient',
    'act3.replay.body':
        "Le même échec, sur n'importe quelle machine, tant que cette ligne est là — ce sont les valeurs qui ont échoué, pas des valeurs qui leur ressemblent. Chaque cas de test tire son propre seed : une suite qui s'exécute en parallèle rend donc le seed du cas qui a échoué, pas un seed partagé par toute l'exécution.",

    'act3.exit.title': 'Un package, un outil et un adaptateur',
    'act3.exit.body':
        "L'adaptateur est la pièce qui transforme un test rouge en un seed rejouable, et c'est la plus petite des trois. Tout ce que cette page a montré est là.",

    'hero.builtValue': 'produite au build',
    'hero.seed': 'graine',
    'hero.run': 'Exécuter ici',
    'hero.loading': 'Chargement du runtime .NET…',
    'hero.cost': "environ 1,2 Mo, téléchargés seulement si vous le demandez",
    'hero.frameTitle': "L'expression JustDummies, exécutée dans votre navigateur",

    'sample.produced': 'produit',
    'sample.producedEachRun': 'produit, exécution après exécution',
    'sample.refused': 'refusé',

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

    'state.comingSoon': 'en cours de construction',

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
