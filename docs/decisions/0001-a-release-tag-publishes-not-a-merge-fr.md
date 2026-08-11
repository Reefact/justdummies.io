# 0001 — Un tag de release publie, pas une fusion

*🇬🇧 [English version](0001-a-release-tag-publishes-not-a-merge-en.md)*

**Décidé le** 2026-08-11 · **Vit dans** `.github/workflows/build.yml`, et à l'étape 7 du guide de
déploiement.

## Décision

La publication est conditionnée à un marqueur de release délibéré, pas à l'intégration.

Une poussée sur `main` construit l'artefact et le vérifie, et ne publie rien. Un tag qui correspond
à `release/*` publie. Le nom du tag est un horodatage UTC — `release/2026-08-11T19-33-42Z` — et le
tag est annoté, donc il porte la raison pour laquelle la release a été coupée.

```bash
git tag -a "release/$(date -u +%Y-%m-%dT%H-%M-%SZ)" -m "ce que cette mise en ligne apporte"
git push origin --tags
```

La condition, c'est la référence seule, `refs/tags/release/*`. Aucun événement ne peut publier
quelque chose qui n'a jamais été tagué, et un tag atteint le job qu'il ait été poussé ou choisi dans
la boîte de dialogue *Run workflow* — republier une release ne demande donc aucun second mécanisme.

## Contexte

Le pipeline a d'abord été livré en publiant à chaque poussée sur `main`. Rien n'était faux
là-dedans : un site statique sans script serveur et sans consommateur peut être déployé en continu
sans danger, et l'artefact est vérifié deux fois avant de partir.

Ce qui le rendait faux ici, c'est ce que `main` reçoit. Ce dépôt fusionne des corrections de
documentation, des changements de formulation, des ajustements d'outillage — le jour où cela a été
décidé, huit pull requests ont atterri en moins de trois heures, toutes des corrections à un guide
d'installation. Chacune d'elles a déplacé le site en ligne. La publication était devenue un effet de
bord de l'intégration plutôt qu'un acte.

La contre-question mérite d'être consignée, car elle sera reposée : si chaque fusion est vérifiée,
pourquoi ne pas publier chaque fusion ? Parce que « vérifié » et « voulu » ne sont pas la même
affirmation. Les contrôles prouvent que l'artefact est bien formé ; ils ne peuvent pas savoir si un
acte narratif à moitié écrit était déjà censé être lu par qui que ce soit.

## Conséquences

**Ce qui atteint la production porte un nom.** `wrangler deployments list` affiche des horodatages,
le tag aussi, donc les deux s'alignent directement. Avant cela, rapprocher un déploiement en ligne
d'un commit demandait de lire une horloge.

**`main` peut prendre indéfiniment de l'avance sur la production, et rien ne le dit.** C'est le coût
réel, et il n'a aucune atténuation en place. Un job qui comparerait le tag le plus récent à `main`
et annoterait l'exécution en fournirait une ; il n'existe pas encore.

**Un `Deploy` sauté sur une poussée vers `main` est l'état attendu.** Ce n'est pas un symptôme, et
tout ce qui apprendrait à un lecteur à prendre un job sauté pour une panne doit le dire — le guide
de déploiement a été corrigé exactement sur ce point, ayant brièvement enseigné le contraire.

**Publier est désormais une décision que quelqu'un prend.** C'est le but, et c'est aussi une étape
qu'on peut oublier. Le site en retard sur son dépôt est un mode de défaillance que cette conception
accepte, en échange de ne jamais publier par accident.

## Alternatives rejetées

**Publier à chaque poussée sur `main`** — ce qui existait. Rejeté ci-dessus : cela fait de la
publication une conséquence de la fusion.

**Les versions sémantiques, `v1.2.0`.** Ce que la formule « comme pour un paquet NuGet » suggère, et
la première chose construite. Semver répond à une question — *est-ce compatible avec ce que j'ai* —
et rien ne consomme ce site, donc la question ne se pose jamais. Ne reste que son coût : décider si
un changement sur une page d'accueil est un mineur ou un correctif, chaque fois, pour une réponse
que personne ne lit. À noter que c'est une propriété de *ce* dépôt et non de la bibliothèque à côté,
où semver justifie son existence.

**Une date avec un compteur intra-journalier, `2026-08-11.2`.** Proposée et abandonnée dans l'heure.
Elle était défendue au motif qu'une date se produit sans délibérer, puis elle exigeait de lire
`git tag` pour savoir si la prochaine release est `.1` ou `.2` — réintroduisant exactement la
délibération qu'elle prétendait supprimer. Un horodatage se produit avec `date -u` seul.

**Un simple compteur, `release-7`.** Ordonne les releases sans informer : il ne peut pas dire si le
site en ligne a trois jours ou huit mois.

**Refléter la version de la bibliothèque.** Le playground est livré contre un paquet JustDummies
publié, coupler les releases du site à celui-ci est donc tentant. Rejeté : le site change bien plus
souvent, et pour des raisons sans rapport avec la bibliothèque, ce qui forcerait des releases qui ne
signifient rien. Ce que le déploiement devrait consigner, c'est avec quelle version de la
bibliothèque il est parti — une métadonnée, pas un numéro de version, et le playground lit déjà cela
depuis ce qu'il a réellement chargé.

**Un semver dérivé des types de commit**, comme le font release-please et les outils similaires.
Ajoute un outil afin de calculer un numéro que, d'après le deuxième rejet ci-dessus, personne ne
lit.

## Quand ceci sera remis en question

À la première release que quelqu'un aura oublié de couper, en découvrant que le site a des semaines
de retard sur `main`. La réponse alors n'est pas de retirer le garde-fou, mais d'ajouter
l'avertissement que cette fiche déclare manquant.

Également dès qu'un environnement de prévisualisation sera voulu pour une branche. C'est un autre
mécanisme — `pnpm preview` téléverse une version sans la promouvoir — et confondre les deux
remettrait les déploiements de branche sur le chemin de la production.

## Relation avec les autres fiches

Ceci affine **D1** dans `docs/design/decisions-inventory.md`. Cette entrée sépare un dépôt qui
publie des paquets versionnés d'un dépôt qui publie un déploiement ; le déploiement a maintenant des
versions lui aussi. La séparation tient toujours — les deux dépôts versionnent des choses
différentes pour des raisons différentes, ce qui est la substance de D1, et non l'absence de
versions ici.
