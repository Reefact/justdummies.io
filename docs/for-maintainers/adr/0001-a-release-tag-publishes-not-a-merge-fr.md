# ADR-0001 | Un tag de release publie, pas une fusion

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0001-a-release-tag-publishes-not-a-merge-en.md)

**Statut :** Accepté
**Proposé :** 2026-08-11
**Accepté :** 2026-08-11
**Décideurs :** Reefact

## Contexte

Le site est un déploiement statique unique : une application construite dans un seul répertoire,
téléversée en entier. Il n'y a pas de script serveur, et pas de consommateur — aucun paquet ne
référence ce déploiement, aucune build n'en dépend, personne ne l'installe.

Le pipeline, tel qu'il a d'abord été construit, publiait à chaque poussée sur `main`. La
publication était sûre par construction : l'artefact est contrôlé sur le disque, contrôlé à nouveau
en démarrant le runtime pour lui demander ce qu'il sert réellement, et contrôlé une troisième fois
après l'aller-retour par le stockage d'artefacts — ce qui atteint la production a donc été vérifié
trois fois.

Ce que `main` reçoit, ce sont des corrections de documentation, des changements de formulation et
des ajustements d'outillage. Le jour où cela a été décidé, huit pull requests ont atterri en moins
de trois heures, chacune une correction à un guide d'installation. Chacune a déplacé le site en
ligne.

Le dépôt a une seule cible de déploiement. Il n'y a pas d'environnement de recette ; prévisualiser
est un mécanisme distinct, une version téléversée sans être promue.

Cloudflare rapporte les déploiements sous forme d'heures, pas de noms : la liste des déploiements
qu'un mainteneur consulte pour répondre à « qu'est-ce qui est en ligne ? » est une liste
d'horodatages.

Les références git ne peuvent pas contenir de deux-points, ce qui contraint tout horodatage utilisé
comme nom de tag.

Les identifiants qui publient vivent dans les secrets du dépôt, lisibles par n'importe quel job que
le workflow autorise à les lire.

## Décision

La publication est conditionnée à un tag `release/*` dont le nom est un horodatage UTC ; une poussée
sur n'importe quelle branche, `main` incluse, construit et vérifie mais ne publie rien.

## Justification

Publier à la fusion confondait deux affirmations que le contexte tient séparées. Les trois
contrôles établissent que l'artefact est *bien formé* ; aucun d'eux n'établit qu'il était *censé
être lu*. Un acte narratif à moitié écrit passe tous les contrôles existants, parce qu'aucun ne
porte sur cette question. Huit corrections à un guide déplaçant le site en ligne huit fois, c'est
cette confusion rendue observable : la publication était devenue un effet de bord de l'intégration
plutôt qu'un acte que quelqu'un accomplit.

Conditionner à un marqueur rétablit la distinction au seul endroit où le mainteneur peut l'exprimer
— une étape délibérée, prise une fois par release, sur le commit qu'il choisit.

Le marqueur est un horodatage plutôt qu'une version à cause de deux faits ci-dessus. Rien ne
consomme ce déploiement, donc la question à laquelle répond une version sémantique — *est-ce
compatible avec ce que j'ai* — ne se pose jamais ici ; ne resterait de semver que son coût,
l'arbitrage entre un mineur et un correctif, exigé à chaque release pour une réponse qu'aucun
lecteur n'a. Et Cloudflare rapporte des heures, donc un nom de release horodaté s'aligne
directement sur la liste que le mainteneur consulte pour voir ce qui est en ligne. S'aligner sur
cette liste est toute la raison de nommer des releases.

Un horodatage n'exige rien de connu avant de le produire : aucun tag existant n'a à être consulté
pour savoir quel est le nom suivant, deux releases ne peuvent pas entrer en collision, et l'ordre
lexical est l'ordre chronologique.

Le garde-fou est la référence, pas l'événement. Une seule condition couvre alors un tag qui a été
poussé et un tag qui a été sélectionné pour être rejoué, donc republier une release existante ne
demande aucun second mécanisme — et aucun événement, quoi qu'il le déclenche, ne peut publier
quelque chose qui n'a jamais été tagué.

Le tag est annoté plutôt que léger afin que la raison de la release voyage avec elle. La liste des
releases est le seul endroit où cette raison peut vivre ; un tag léger laisserait le registre
nommer le *quand* et jamais le *pourquoi*.

## Alternatives considérées

### Publier à chaque poussée sur `main`

Considérée parce que c'était ce qui fonctionnait déjà, et parce que c'est défendable en général :
un site statique sans script serveur et sans consommateur peut être déployé en continu sans danger,
et c'est pourquoi il a d'abord été construit ainsi.

Rejetée parce qu'elle fait de la publication une conséquence de la fusion. L'après-midi à huit pull
requests n'est pas un cas pathologique dont il faudrait se prémunir mais le trafic normal du dépôt,
et aucun garde-fou placé dans les contrôles ne peut distinguer une correction qui mérite d'être
livrée d'une correction qui passe simplement.

### Les versions sémantiques

Considérée parce que « publier comme un paquet NuGet » était la forme demandée, et parce que la
bibliothèque à côté de ce dépôt versionne effectivement ainsi — la convention était donc sous la
main.

Rejetée parce que la question de semver n'est pas posée ici. Son coût, en revanche, est prélevé à
chaque release : décider si un changement sur une page d'accueil est un mineur ou un correctif.
C'est une propriété de *ce* dépôt, pas de la bibliothèque, où le même schéma justifie son existence
parce que des consommateurs dépendent de la réponse.

### Une date avec un compteur intra-journalier

Considérée parce qu'une date se produit sans délibérer, ce qui est exactement la propriété qui
manque à semver.

Rejetée parce que le compteur réintroduit la délibération que la date avait retirée : nommer la
release suivante exige d'apprendre si le jour en compte déjà une. C'est une consultation avant
chaque release, pour une distinction qui ne porte aucune information qu'un horodatage ne porte pas.

### Un simple compteur incrémental

Considérée parce que c'est la plus petite chose qui ordonne des releases.

Rejetée parce qu'elle ordonne sans informer. Elle ne peut pas dire si le site en ligne a trois
jours ou huit mois, ce qui est la question à laquelle le nom de release existe pour répondre.

### Refléter la version de la bibliothèque

Considérée parce que le playground est livré contre un paquet publié de la bibliothèque, les deux
sont donc réellement liés.

Rejetée parce que le site change bien plus souvent que la bibliothèque, et pour des raisons sans
rapport. Coupler les noms forcerait des releases qui ne signifient rien et priverait de nom les
releases qui signifient quelque chose. Ce qu'un déploiement devrait consigner, c'est avec quelle
version de la bibliothèque il est parti — et c'est une métadonnée que le playground lit déjà depuis
ce qu'il a réellement chargé, pas un numéro de version pour le site.

### Des versions sémantiques dérivées des types de commit

Considérée parce que des outils existent pour les calculer, ce qui retirerait l'arbitrage qui a
coulé l'option semver simple.

Rejetée parce qu'elle ajoute un outil afin de produire un numéro que, d'après cette même option,
aucun lecteur ne consomme.

## Conséquences

### Positives

* Ce qui est en ligne porte un nom qu'un mainteneur y a mis, et ce nom s'aligne sur la liste des
  déploiements sans traduction. Avant cela, rapprocher un déploiement en ligne d'un commit
  demandait de lire une horloge.
* Publier est un acte avec un auteur, une date et une raison énoncée, consignés dans le tag.
* Republier une release est le même mécanisme que la publier, parce que le garde-fou est la
  référence.
* Une branche ne peut plus atteindre la production, quel que soit l'événement qui lance le
  pipeline.

### Négatives

* `main` peut prendre indéfiniment de l'avance sur la production, et rien dans le pipeline ne le
  dit.
* Publier est une étape qui peut être oubliée, là où elle ne pouvait pas l'être avant.
* Un job de déploiement sauté est désormais le résultat attendu d'une poussée, ce qui en fait un
  signal plus faible qu'avant : il ne distingue plus « rien à publier » de « mal configuré ».

### Risques

* **Le site prend silencieusement du retard sur son dépôt.** Aucune atténuation en place. La dérive
  est invisible jusqu'à ce que quelqu'un regarde les deux, et le pipeline est l'endroit naturel
  pour la faire remonter.
* **Un job sauté est lu comme une panne.** Le guide de déploiement a enseigné le contraire pendant
  un temps et a été corrigé ; tout autre document décrivant le pipeline doit énoncer qu'un
  déploiement sauté sur une branche est normal, sinon il produira de fausses alertes.
* **Une release est coupée depuis un commit non voulu.** Le tag nomme un commit, et rien ne vérifie
  que ce commit est celui que le mainteneur visait. Le message annoté est le seul registre de
  l'intention.

## Actions de suivi

* Faire remonter la dérive que nomme la section Négatives : comparer le tag de release le plus
  récent à `main` et annoter l'exécution, pour qu'un dépôt en avance sur la production le dise sans
  qu'on le lui demande.
* Énoncer dans le guide de déploiement, à l'endroit où le lecteur la rencontre, qu'un job de
  déploiement sauté sur une branche est l'état attendu.

## Références

* L'étape 7 du guide de déploiement, qui est la moitié opératoire de cette décision —
  [Français](../deployment-fr.md) · [English](../deployment-en.md).
* `.github/workflows/build.yml`, où vit le garde-fou.
* **D1** dans [`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md) — un dépôt
  qui publie des paquets versionnés face à un dépôt qui publie un déploiement. Cette fiche l'affine
  plutôt qu'elle ne la retire : le déploiement a maintenant des noms de release lui aussi, et la
  séparation que trace D1 tient toujours, parce que les deux dépôts nomment des choses différentes
  pour des raisons différentes.
