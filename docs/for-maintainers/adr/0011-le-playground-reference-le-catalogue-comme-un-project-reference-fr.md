# ADR-0011 | Le playground référence le catalogue comme un ProjectReference

🌍 🇬🇧 [English](0011-the-playground-references-the-catalogue-as-a-project-reference-en.md) · 🇫🇷 Français (ce fichier)

**Statut :** Acceptée
**Proposée :** 2026-08-15
**Acceptée :** 2026-08-15
**Décideurs :** Reefact

## Contexte

`Directory.Packages.props`, l'entrée B2 de `docs/design/decisions-inventory.md`, et la référence
au paquet JustDummies dans le fichier de projet d'`apps/playground` lui-même énoncent tous la même
règle : **le playground référence un paquet NuGet publié de la bibliothèque qu'il démontre, jamais
une build source de celle-ci.** Le raisonnement est énoncé dans `Directory.Packages.props`
lui-même — ce dépôt est délibérément séparé de celui de la bibliothèque précisément pour qu'une
référence de projet vers la bibliothèque ne soit même pas possible, parce qu'un playground
exécutant le `main` de la bibliothèque offrirait des contraintes qui n'existent dans aucun paquet
publié, et un visiteur les trouverait absentes quelques minutes après l'installation.

L'ADR-0010 introduit `packages/playground-catalogue`, un nouveau projet généré par
`tools/playground-catalogue` (qui référence lui-même `JustDummies` de façon normale, épinglée par
paquet) et consommé par `apps/playground` via `<ProjectReference>` — une `ProjectReference`, dans
la même solution, vers quelque chose qui n'est pas publié comme paquet NuGet.

Lue seulement par sa forme, cela ressemble exactement à ce que B2 interdit :
`apps/playground` gagnant une `ProjectReference` vers du code qu'il n'a pas installé comme paquet.

## Décision

**La `ProjectReference` d'`apps/playground` vers `packages/playground-catalogue` ne rouvre pas
B2.** `packages/playground-catalogue` est de la colle générée propre au site qui dépend elle-même
de `JustDummies` de façon ordinaire, épinglée par paquet (via la propre `PackageReference` de
`tools/playground-catalogue`) — ce n'est pas, et cela ne devient jamais, un substitut à
l'installation de la bibliothèque.

## Justification

La véritable préoccupation de B2 porte sur ce que le playground *démontre* : une contrainte ou un
générateur visible dans le playground doit exister dans le paquet publié qu'un visiteur est sur le
point d'installer, ce qui échoue dès l'instant où le playground peut atteindre du code que le
paquet ne porte pas. Une `ProjectReference` d'`apps/playground` vers *la bibliothèque elle-même*
ferait exactement cela — le playground exécuterait ce qui est sur `main`, pas ce qui est publié, et
les deux dériveraient silencieusement l'un de l'autre.

`packages/playground-catalogue` ne porte aucun code de bibliothèque en propre. Ses deux fichiers
générés (`PlaygroundCatalogue.Descriptors.g.cs`, `PlaygroundCatalogue.Dispatch.g.cs`) sont produits
en reflétant ce même assembly `JustDummies` épinglé par paquet qu'`apps/playground` référence
lui-même — la propre `PackageReference Include="JustDummies"` du générateur ne porte aucune
`Version` locale, donc elle se résout depuis la même épingle centrale de
`Directory.Packages.props` que n'importe quel autre consommateur de ce dépôt. Rien dans ce chemin
ne permet à `apps/playground` d'atteindre une contrainte que le paquet publié n'a pas : ce que la
table de dispatch générée peut appeler est borné exactement par ce que l'assembly de ce paquet
épinglé expose.

La dépendance que cette ADR clarifie est donc orthogonale à celle de B2, pas une variante de
celle-ci : `apps/playground` → `packages/playground-catalogue` → (`PackageReference`) →
`JustDummies`. La bibliothèque est toujours atteinte par exactement un seul chemin, le paquet, et
la garantie de B2 — le playground n'offre jamais une contrainte que le paquet publié n'a pas —
tient indépendamment du nombre de projets intermédiaires propres au site placés entre
`apps/playground` et son propre `Program.cs`.

## Alternatives envisagées

### Intégrer les fichiers générés directement dans `apps/playground`, sans projet séparé

Envisagé parce que cela supprime entièrement la `ProjectReference`, ce qui rendrait cette ADR
inutile — rien à clarifier s'il n'y a qu'un seul projet.

Rejeté sur son propre mérite, indépendamment de B2 : `tools/playground-catalogue` (le générateur)
a déjà besoin des formes d'enregistrement descripteur/dispatch et de `ArgumentParsing` contre
lesquelles émettre, et un projet générateur ne peut pas dépendre de l'application Blazor
WebAssembly pour laquelle il génère du code — ce serait circulaire (le générateur aurait besoin
qu'`apps/playground` compile, et `apps/playground` a besoin de la sortie du générateur pour
compiler). Un projet séparé, léger en dépendances, que le générateur et le playground peuvent tous
deux référencer, est ce qui casse le cycle ; intégrer les fichiers dans `apps/playground` seul le
réintroduit.

### Publier `packages/playground-catalogue` comme son propre paquet NuGet, référencé comme l'est `JustDummies`

Envisagé parce que cela rendrait chaque dépendance de la solution identique en apparence —
tout en `PackageReference`, rien en simple `ProjectReference` — arguablement une uniformité plus
disciplinée que celle sur laquelle cette décision se contente.

Rejeté comme résolvant un problème que B2 n'a pas. La garantie de B2 porte sur *la bibliothèque*
(`JustDummies`) n'étant jamais atteinte autrement que par ce qui est livré aux visiteurs ; elle ne
dit rien sur le fait que l'outillage de build propre au site aurait besoin du même traitement.
Empaqueter et versionner un projet régénéré à chaque build, jamais consommé hors de ce dépôt, et
jamais destiné à être installé par qui que ce soit ajouterait un vrai processus (une cadence de
publication, un numéro de version, un flux) pour répondre à une préoccupation qui ne le concerne
pas.

## Conséquences

### Positives

* La garantie de B2 n'est pas affectée : la bibliothèque est toujours atteinte par exactement un
  seul chemin, le paquet NuGet épinglé, depuis chaque projet de la solution qui la touche.
* Le générateur et le playground partagent un seul jeu de types (`MemberDescriptor`, `ChainStep`,
  `ChainResult`, `ArgumentParsing`) sans que l'un dépende de l'autre.

### Négatives

* Un futur contributeur parcourant les références de projet d'`apps/playground` pour savoir « est-ce
  que ceci atteint quelque chose hors d'un paquet publié » a besoin de cette ADR (ou du
  raisonnement qu'elle consigne) pour distinguer les deux situations qui ont la même forme de
  `ProjectReference` — la forme seule ne le dit pas.

### Risques

* Si `packages/playground-catalogue` en vient un jour à porter une logique qui ne dérive pas de
  l'assembly `JustDummies` épinglé — de la logique métier écrite à la main sans rapport avec le
  catalogue, par exemple — le raisonnement de cette décision ne tiendrait plus et devrait être
  révisé. Rien dans le code actuel ne fait cela ; c'est nommé ici comme la condition qui rouvrirait
  la question.

## Actions de suivi

* Aucune au-delà de ce que l'ADR-0010 trace déjà.

## Références

* [ADR-0010](0010-le-catalogue-du-playground-est-du-code-c-genere-pas-du-json-fr.md) — pourquoi le
  catalogue est du code source C# généré en premier lieu
* `docs/design/decisions-inventory.md`, entrée B2 — clarifiée, pas remplacée, par cette ADR
* `Directory.Packages.props` — énonce le raisonnement de B2 en ligne
