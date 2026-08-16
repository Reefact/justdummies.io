# ADR-0013 | Le contenu repris de la bibliothèque est épinglé à un tag de release

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0013-mirrored-library-content-is-pinned-to-a-release-tag-en.md)

**Statut :** Proposé
**Proposé le :** 2026-08-16
**Décideurs :** Reefact

## Contexte

L'arborescence des routes de la spécification (§7.2) mentionne `/docs`. Aucune route de ce nom
n'existe dans `apps/site/src/pages/`, et la documentation qu'un visiteur y lirait existe déjà
ailleurs.

La bibliothèque tient sa documentation utilisateur dans `doc/handwritten/for-users/`, sur
[`Reefact/just-dummies`](https://github.com/Reefact/just-dummies). Mesuré le 2026-08-16, c'est 104
fichiers Markdown, chaque page formant une paire anglais/français : huit guides, une référence des
generators en six pages plus un index, quatre pages de paquets plus un index, et vingt-neuf pages de
règles d'analyzer plus un index.

Ce corpus n'est pas de la prose laissée à elle-même. `JustDummies.Documentation.UnitTests` le tient à
quatre contrats, que la suite nomme dans ses propres termes : la moitié française est *« a twin of the
English one, not a subset of it that drifted »* ; chaque lien relatif résout vers quelque chose qui
existe ; chaque extrait C# *« is real code that binds against the shipped packages »* ; et les
extraits *« obey the analyzers this product ships »*. La suite lit l'arbre de travail : chaque
contrat est donc vérifié sur un seul ref du corpus à la fois.

La bibliothèque publie quatre paquets sur des trains qui se versionnent indépendamment, chacun coupé
par son propre tag : `lib-v*`, `xunit-v*`, `catalog-v*`, `cli-v*`.

Ce dépôt reprend déjà une chose de la bibliothèque. `/release-notes` est construit par
`scripts/generate-release-notes.mjs`, qui lit le `CHANGELOG.md` de chaque paquet sur la branche `main`
de la bibliothèque et estampille l'instant où il a tourné. Ce script est délibérément hors de la
construction obligatoire, pour un motif qu'il énonce : il lit un fichier qui bouge au rythme d'un
autre dépôt, donc le câbler dans la construction ferait échouer des pull requests sans rapport chaque
fois que la bibliothèque publierait entre un commit et le passage de la CI. Le rafraîchir est donc un
acte manuel, et rien dans ce dépôt ne signale quand il est dû.

`apps/site/src/site.ts` est l'endroit unique où sont écrits les noms de paquets, les versions et les
commandes d'installation (§14.1). Mesuré le 2026-08-16, face à nuget.org :

| Paquet | `site.ts` | Dernière publiée |
|---|---|---|
| `JustDummies` | 1.0.0-preview.1 | 1.0.0-preview.1 |
| `JustDummies.Xunit` | 1.0.0-preview.1 | 1.0.0-preview.1 |
| `JustDummies.Cli` | 1.0.0-beta.1 | **1.1.0-beta.1** |
| `JustDummies.DiagnosticCatalog` | *(non énoncée)* | 1.0.0-preview.2 |

Le site annonce une version de l'outil qui a été remplacée. Rien dans le dépôt ne l'a signalé, et
l'instantané derrière `/release-notes` n'est pas vieux — l'écart est dans une version, pas dans une
date.

Un tag n'est pas la preuve d'une publication. `apps/site/src/generated/release-notes.json` consigne un
cas tiré de l'histoire de la bibliothèque : un tag `catalog-v1.0.0-preview.1` a été poussé, son
exécution de release a échoué à la résolution de version, avant d'empaqueter ou de pousser quoi que ce
soit, et le numéro a été sauté plutôt que réutilisé.

Quatre règles de la spécification pèsent sur le choix. Une information dont la bibliothèque est la
source descend jusqu'au site par un mécanisme qui échoue bruyamment quand la source change, et
recopier est interdit (§2). Une page n'existe dans une locale que si elle y est réellement traduite, et
une clé de contenu absente fait échouer le build (§6.4). Un composant présenté comme disponible dont
la version n'est pas résoluble fait échouer le build (§5.7, §16). La fraîcheur du comparatif, à
l'inverse, est un **avertissement** de build au-delà d'un délai déclaré (§11.8).

L'[ADR-0001](0001-a-release-tag-publishes-not-a-merge-fr.md) fait du tag `release/*` l'acte de
publication, et le job de déploiement publie un artefact qu'il télécharge et ne reconstruit jamais.

`docs/design/decisions-inventory.md` consigne que les deux dépôts sont séparés à dessein (D1). Le coût
qu'il nomme pour cette séparation est la dérive, « qu'il faut alors combattre par des mécanismes » —
les mécanismes étant B1, que rien de ce que le site affiche n'est saisi à la main.

## Décision

**Le contenu que ce site reprend de la bibliothèque est pris comme un instantané atomique unique, à un
tag de release publié, et l'instantané consigne les versions de paquets qu'il décrit.**

## Justification

Le corpus du Contexte arrive en portant quatre vérifications. Une reprise hérite des quatre : les
pages que le site sert sont les pages dont le français est tenu à la parité, dont les liens résolvent,
dont les extraits compilent contre les paquets publiés, et dont les extraits ne déclenchent aucun
analyzer que le produit embarque — ce dernier point étant §14.4 satisfait gratuitement, en amont, sur
104 pages que ce dépôt devrait sinon compiler lui-même. Réécrire la documentation ici abandonne
chacune de ces quatre vérifications et recrée exactement la dérive que D1 nomme comme le prix de deux
dépôts séparés. §6.4 est le cas le plus net : elle n'est satisfaisable que parce que la source est
déjà intégralement appariée ; écrite ici, la charge de traduction retomberait sur ce dépôt, page pour
page.

Le tag, plutôt qu'une branche, découle de ce que le site promet. La commande d'installation et la
documentation sont deux affirmations sur le même artefact, et seul un tag en fait une seule
affirmation : une branche décrit un travail qui peut n'être pas installable, donc un lecteur qui la
suit peut rencontrer une factory qui ne résout vers rien dans le paquet qu'on vient de lui dire
d'installer. C'est le défaut même que B2 écarte pour le playground, qui référence un paquet publié
plutôt qu'une build de source, et il est pire dans une documentation que dans un playground parce que
le lecteur, lui, la recopie dans son propre test.

L'atomicité découle de l'endroit où le contrat de liens tient. La suite vérifie les liens sur un seul
ref : une reprise assemblée depuis plusieurs refs compose donc des pages qui ont chacune passé un
contrôle qui n'a jamais tourné sur la combinaison — un lien pris dans une section résolvant vers une
autre qui a depuis renommé sa cible. Rien en aval ne l'attraperait, parce que le contrôle qui l'aurait
fait a tourné en amont, sur un arbre qui n'a jamais existé ici. Le train reste une bonne raison de
**rafraîchir** la reprise, et une mauvaise façon d'en **limiter** la portée.

Consigner les versions est ce qui transforme la péremption d'un jugement en une comparaison. L'écart
mesuré au Contexte est l'argument : le CLI a une version mineure de retard, et aucune règle de délai
écoulé ne l'aurait trouvé, parce que l'âge de l'instantané n'a jamais été le problème. Un instantané
qui nomme ce qu'il décrit peut être confronté au registre et répondre oui ou non, ce qui est
exactement l'exigence de §2 — un mécanisme qui échoue quand la source bouge — exprimée dans la seule
monnaie dans laquelle la source bouge réellement.

Le compromis accepté est un retard délibéré : la documentation du site traîne derrière la `main` de la
bibliothèque, et une correction fusionnée en amont reste invisible jusqu'à ce qu'une version qui la
porte soit publiée. C'est le même retard que la commande d'installation a toujours eu, et le payer à
un seul endroit plutôt qu'à deux est précisément ce qui maintient les deux d'accord.

## Alternatives envisagées

### Écrire ici la documentation du site

Envisagée parce que c'est la seule option qui laisse façonner la documentation pour le site — sa
narration, ses liens croisés, sa voix éditoriale — et parce qu'elle ne couple ce dépôt à rien.

Écartée parce qu'elle abandonne les quatre contrats du Contexte et en adopte le coût à la place. La
parité de traduction sur 104 pages, la résolution des liens, la compilation des extraits contre les
paquets publiés et leur conformité aux analyzers devraient toutes être reconstruites ici, contre une
bibliothèque dont ce dépôt ne voit pas les entrailles — et jusque-là, §6.4 et §14.4 reposeraient sur
l'attention. C'est la dérive contre laquelle D1 prévient, choisie exprès.

### Reprendre depuis `main`, comme le fait `/release-notes`

Envisagée parce que c'est le précédent existant dans ce dépôt, la chose la plus simple qui fonctionne,
et celle qui montre au lecteur la documentation la plus fraîche disponible.

Écartée parce que la documentation la plus fraîche n'est pas la documentation du paquet proposé. Une
branche peut décrire une factory, une contrainte ou un drapeau qu'aucune version publiée ne porte, et
le lecteur qui la recopie s'est vu dire d'installer quelque chose où elle n'existe pas. Elle laisse
aussi la péremption indétectable sous la seule forme qu'elle a réellement prise ici : l'écart mesuré
est un écart de version, et un instantané estampillé du seul instant où il a tourné ne sait pas
l'exprimer.

### Reprendre par train, ou par section

Envisagée parce qu'elle épouse la façon dont la bibliothèque publie réellement — quatre trains,
versionnés indépendamment — de sorte qu'une release du CLI pourrait rafraîchir les seules pages du CLI
et laisser le reste intact, ce qui est à la fois moins coûteux et plus facile à relire.

Écartée parce qu'elle compose des refs qui n'ont jamais été vérifiés ensemble, pour la raison donnée
en Justification. L'économie est faible — le corpus fait une centaine de fichiers texte — et elle
s'achète en abandonnant le seul contrat qui rend une reprise digne de confiance d'une page à l'autre.

### Faire échouer le build quand l'instantané est en retard

Envisagée parce que c'est la lecture la plus forte de §2 : un mécanisme qui échoue bruyamment quand la
source change, exactement comme §5.7 et §16 le font déjà pour un composant dont la version n'est pas
résoluble.

Écartée parce que l'échec tomberait sur le mauvais acte. L'ADR-0001 fait du tag de release le moment
de la publication : un build qui le refuse refuse de publier un changement sans rapport, au nom d'un
fait qui concerne un autre dépôt — et la page périmée qu'il conteste est déjà en ligne, donc bloquer
n'enlève rien. §11.8 a déjà tracé cette ligne pour la fraîcheur du comparatif : ce qui est périmé
avertit. Le mécanisme doit tout de même atteindre une personne, ce qui est une suite à donner, pas une
raison de faire échouer la publication.

## Conséquences

### Positives

La documentation que le site sert hérite de quatre vérifications amont qu'il n'a pas payées, dont
§14.4 sur l'ensemble du corpus.

La documentation et la commande d'installation nomment un seul artefact. Un lecteur qui suit les deux
ne s'entend jamais parler de quelque chose que la version proposée n'a pas.

La péremption devient une question exacte sur une version plutôt qu'un jugement sur un délai écoulé, et
l'écart mesuré au Contexte devient signalable au lieu d'être invisible.

La décision se généralise. `/release-notes` reprend la même bibliothèque sous le même problème, et peut
passer sur ce pied sans qu'une seconde décision soit prise.

### Négatives

La documentation du site retarde sur la `main` de la bibliothèque par construction, et une correction
fusionnée en amont est invisible ici jusqu'à ce qu'une version qui la porte soit publiée. Une coquille
corrigée dans la bibliothèque est une coquille servie par le site jusqu'à la release suivante.

Le dépôt gagne un corpus repris à tenir, d'un ordre de grandeur plus gros que celui qu'il tient
aujourd'hui, et il sera lu comme l'écriture propre de ce site quelle qu'en soit la provenance.

L'instantané est épinglé à un ref unique tout en décrivant quatre paquets qui se versionnent
indépendamment : le tag qui ancre le corpus et les versions qu'il documente ne sont donc pas le même
fait, et les deux doivent être consignés.

### Risques

**Un tag peut nommer une release qui n'a jamais publié.** L'histoire de la bibliothèque en compte un,
consigné dans l'instantané des release notes de ce dépôt : un tag poussé, une exécution de release
échouée avant l'empaquetage, un numéro sauté. Un instantané ancré sur la seule liste des tags peut donc
documenter une version qu'aucun consommateur ne peut installer. L'atténuation est que la comparaison
de fraîcheur lit le registre, pas la liste des tags.

**Une reprise se lit comme une écriture.** Un lecteur qui trouve un défaut dans une page reprise le
signalera ici, et un mainteneur qui le corrige ici verra sa correction écrasée par l'instantané
suivant. L'atténuation est que chaque page reprise nomme sa source et pointe vers elle, comme
`/release-notes` le fait déjà.

**Le tag d'ancrage est un jugement, la première fois.** Quatre trains touchent un corpus partagé : le
tag auquel un instantané est pris ne se lit donc pas sur le corpus lui-même. Laissé non énoncé, il
devient ce qu'en a fait la première implémentation, ce qui est la façon dont une décision se change en
accident.

## Suites à donner

* **Ce qui échoue quand cette décision est rompue :** `scripts/check-package-freshness.mjs`, lancé par
  `.github/workflows/package-freshness.yml` sur une planification et de nouveau lors d'une release de
  ce site. Il compare les versions que ce dépôt déclare (`site.ts`, `Directory.Packages.props`) au
  registre nuget.org et **ouvre ou met à jour une issue** plutôt que de faire échouer la publication —
  selon l'ADR-0001 et §11.8 ci-dessus. Un avertissement dans un pipeline vert n'est lu par personne, et
  le défaut dont on se garde ici est précisément un défaut que personne n'a remarqué. Il ne lit pas
  encore un instantané de contenu repris, puisqu'aucun n'existe — il compare directement les versions
  que le site déclare lui-même, ce qui est le même fait pour chaque paquet dont ce dépôt ne reprend
  rien aujourd'hui, et c'est la brique que le futur contrôle de fraîcheur de l'instantané prolongera
  plutôt que remplacera.
* **Le contrôle existe désormais, et le statut `Proposed` de ce record est une décision de
  ratification, pas une pièce manquante.** Il a été éprouvé par la casse avant d'atterrir, selon
  [`CONTRIBUTING.md`](../../../CONTRIBUTING.md#a-decision-comes-with-something-that-fails-when-it-is-broken) :
  lancé contre l'arbre de travail tel qu'il était, il a signalé `JustDummies.Cli` déclaré en
  `1.0.0-beta.1` contre `1.1.0-beta.1` sur nuget.org — exactement l'écart mesuré au Contexte, trouvé
  automatiquement plutôt qu'à la main. Un désaccord volontaire entre `site.ts` et
  `Directory.Packages.props` a été signalé comme `inconsistent`, et une chaîne de version que les
  expressions régulières du script ne pouvaient pas localiser a été le seul cas qui fait échouer le
  contrôle, les trois restaurés ensuite. La §16 de la spécification porte de nouveau une ligne pour la
  règle, cette fois vers un mécanisme réel.
* `/release-notes` reprend `main` et précède ce record. Le faire passer sur ce pied est un travail que
  cette décision rend nécessaire, pas une décision séparée.
* Quel tag ancre un instantané couvrant quatre trains se règle là où le mécanisme est documenté, et
  n'est pas laissé à la première implémentation — voir le troisième risque.
* `site.ts` porte une duplication connue de `library.version` avec `Directory.Packages.props`, gardée
  aujourd'hui par un commentaire qui réclame « a build step that compares them ». Le même contrôle lit
  les deux faits et peut la refermer.
* L'ensemble des pages que `/docs` publie, et sa relation à `/tooling` et `/api`, relève de
  l'architecture de l'information : cela appartient à la spécification (§7.2) et aux issues qui la
  suivent, pas à ce record.

## Références

* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-fr.md) — le tag de release comme acte de
  publication, et pourquoi ce contrôle avertit au lieu de bloquer
* Spécification §2 (faits volatils et leurs sources), §5.7 et §16 (l'état, et ce qui le vérifie), §6.4
  (traduction partielle), §11.8 (la fraîcheur comme avertissement), §14 (gouvernance du contenu)
* [`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md) — B1 (rien n'est saisi à
  la main), B2 (le playground référence un paquet publié), D1 (dépôts séparés, et la dérive comme leur
  prix)
* `JustDummies.Documentation.UnitTests` dans `Reefact/just-dummies` — les quatre contrats dont une
  reprise hérite
* Issue [#76](https://github.com/Reefact/justdummies.io/issues/76) — `/docs`, la route que cette
  décision alimente, et que la §7.5 de la spécification décrit désormais
