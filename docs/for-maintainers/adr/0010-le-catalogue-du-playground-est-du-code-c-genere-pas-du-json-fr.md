# ADR-0010 | Le catalogue du playground est du code C# généré, pas du JSON

🌍 🇬🇧 [English](0010-the-playground-catalogue-is-generated-c-source-not-json-en.md) · 🇫🇷 Français (ce fichier)

**Statut :** Acceptée
**Proposée :** 2026-08-15
**Acceptée :** 2026-08-15
**Décideurs :** Reefact

## Contexte

La spécification §10.4 exige que l'interface du constructeur du playground soit pilotée par un
catalogue de la surface publique de la bibliothèque, généré au build depuis les métadonnées de
l'assembly référencé — jamais un registre écrit à la main (la dérive est une quasi-certitude, et
silencieuse), et jamais de la réflexion à l'exécution (l'élagage IL, nécessaire pour garder le
payload WebAssembly de taille raisonnable, supprime tout ce qui n'est atteint que par ce biais ; la
défaillance apparaît sur l'artefact publié, pas en développement, où l'élagage est désactivé).

Le playground lui-même (`apps/playground`) est une application Blazor WebAssembly avec l'élagage
activé et aucune réflexion autorisée dans son propre code (§10.8) — une règle plus stricte
qu'« éviter la réflexion quand c'est pratique » : un avertissement d'élagage est traité comme une
erreur de build.

Un outil exécuté au build ne peut voir la forme de la bibliothèque que par réflexion — cette
réflexion est légitime, puisque l'outil lui-même tourne sur le SDK .NET, n'est jamais publié, et
n'est jamais élagué. Ce qu'il produit pour que le playground le consomme à l'exécution est une
question séparée, et deux formes ont été envisagées : des données que le playground lit et
interprète (par ex. du JSON, désérialisé et dispatché par nom à l'exécution), ou du code source
compilé directement dans le playground.

Les types de builder de la bibliothèque éligibles à la chaîne (`AnyString`, `AnyGuid`,
`AnyInt32`, …) sont des classes publiques, concrètes et fermées — confirmé en inspectant
directement le paquet NuGet publié, pas supposé — chacune implémentant `IAny<T>` pour un seul
type, et chaque méthode d'instance retournant à nouveau ce même type concret, ce qui rend possible
une chaîne plate sans inférence de type générique à l'exécution.

## Décision

**Le catalogue est généré comme du code source C# — deux fichiers compilés dans
`packages/playground-catalogue`** — plutôt qu'un fichier de données (JSON ou autre) interprété à
l'exécution.

## Justification

L'élagage tranche avant toute autre considération. Un catalogue JSON lu et dispatché à
l'exécution suppose de résoudre un membre par son nom puis de l'invoquer — de la réflexion, par
définition, exactement ce que §10.8 interdit. Le code C# généré, à l'inverse, contient des points
d'appel ordinaires et typés statiquement (`typed.StartingWith(prefix)`, pas
`method.Invoke(typed, args)`) ; l'élagueur voit un appel de méthode normal et le conserve, comme
n'importe quel autre appel de l'application. Aucune annotation, aucun attribut de préservation
pour l'élagueur, aucune API de réflexion à l'exécution n'est nécessaire nulle part dans
`apps/playground`.

Cela règle aussi les deux garanties que §10.4 demande à un catalogue. Aucune dérive : les deux
fichiers générés proviennent d'une seule passe de réflexion sur la version épinglée du paquet, donc
les données descriptives (pour l'interface) et la table de dispatch (pour exécuter une chaîne
choisie) ne peuvent jamais diverger entre elles ni de l'assembly — l'auto-vérification du
générateur compare leurs ensembles de clés avant d'écrire l'un ou l'autre fichier. Un changement
incompatible de la bibliothèque devient une **erreur de compilation du site** : renommer ou
supprimer une méthode casse le point d'appel généré, ce qui est un diagnostic du compilateur au
build suivant, pas une surprise à l'exécution découverte par un visiteur.

Confirmer que les types de builder de la bibliothèque sont fermés, concrets et publics (pas
seulement accessibles via une interface) est ce qui rend légales les cibles de cast de la table de
dispatch générée (`(AnyString)receiver!`) depuis l'extérieur de l'assembly de la bibliothèque — la
conception en dépend, et cela a été vérifié contre le vrai paquet plutôt que supposé depuis la
documentation.

## Alternatives envisagées

### Un registre écrit à la main associant noms de méthode et délégués

Envisagé parce que c'est la chose la plus simple qui puisse fonctionner, et ne demande aucun outil
de build.

Rejeté d'emblée par §10.4 lui-même : rien ne garantit qu'un générateur ajouté à la bibliothèque
soit un jour ajouté à ce registre, et la dérive est silencieuse — la contrainte « n'existe » tout
simplement pas dans le playground, sans erreur nulle part. C'est une certitude à quelques versions
d'échéance, pas un risque.

### Des descripteurs JSON, dispatchés par réflexion à l'exécution

Envisagé parce que cela découple le format de sortie du générateur du langage de l'application
consommatrice, et garde le générateur plus simple (pas de logique d'émission de code C#,
seulement de la sérialisation).

Rejeté parce que cela réintroduit la réflexion à l'exécution exactement là où §10.8 l'interdit.
L'élagueur ne peut pas voir un `MethodInfo` résolu à partir d'une chaîne portée par du JSON à
l'exécution, donc il supprime la méthode qu'on cherche à résoudre — un défaut invisible en
développement (l'élagage y est désactivé) et visible seulement sur l'artefact publié, exactement
le mode de défaillance que §10.4 rejette déjà pour un registre écrit à la main, atteint par un
autre chemin.

### Des descripteurs JSON pour l'interface, associés à un `switch` C# écrit à la main pour le dispatch

Envisagé comme compromis : les données destinées à l'interface restent en JSON simple, et une
petite couche de dispatch écrite à la main évite la réflexion à l'exécution.

Rejeté parce que le `switch` écrit à la main est exactement le registre écrit à la main déjà
rejeté ci-dessus, simplement positionné en aval de la passe de réflexion plutôt qu'en amont. Il
faudrait le mettre à jour à la main à chaque changement de la surface de la bibliothèque, avec le
même mode de dérive silencieuse.

## Conséquences

### Positives

* Aucune réflexion à l'exécution nulle part dans le code propre à `apps/playground` ; le travail
  de l'élagueur ne diffère pas de celui sur n'importe quelle autre application Blazor
  WebAssembly.
* Les deux fichiers générés ne peuvent pas diverger entre eux — garanti par l'auto-vérification
  du générateur, pas par convention.
* Un changement incompatible de la bibliothèque est détecté au build suivant du site, pas
  découvert par un visiteur sur l'artefact publié.

### Négatives

* Le fichier de dispatch généré est volumineux (une lambda par membre catalogué — 279 entrées
  pour la surface scalaire v1) et est committé, donc une mise à jour de la bibliothèque produit
  un diff conséquent, quoique mécanique.
* Ajouter un nouveau *genre* d'entrée de catalogue (un générateur composite, dans une itération
  future) demande d'étendre la logique d'émission du générateur, pas seulement sa liste
  d'exclusion — plus coûteux qu'un changement de schéma JSON ne l'aurait été.

### Risques

* Le générateur lui-même reflète la bibliothèque et est donc le seul endroit où une hypothèse
  subtile sur la forme de la bibliothèque (par ex. le caractère public/concret d'un type de
  builder) pourrait passer inaperçue jusqu'à ce que l'assembly change d'une façon qui la casse.
  Atténué par le fait que la classification structurelle du générateur échoue bruyamment (une
  catégorie de membre non reconnue arrête le build) plutôt que d'émettre silencieusement quelque
  chose d'incorrect.

## Actions de suivi

* `tools/playground-catalogue` génère un rapport compagnon
  (`packages/playground-catalogue/Generated/PlaygroundCatalogue.Excluded.g.md`) listant chaque
  membre exclu et son motif, auto-détecté ou manuel — c'est ce qui rend le « motif obligatoire »
  du §10.6 auditable sans exiger qu'un humain liste chaque exclusion à la main.
* Les générateurs composites/génériques (`Enum<T>`, `OneOf`, `ListOf`, `Combine`, …) sont
  délibérément hors du catalogue scalaire v1 ; étendre le générateur pour représenter des
  arguments de générateur imbriqués est tracé comme une itération future, non impliquée par
  cette décision.

## Références

* Spécification §10.4–§10.8
* `docs/design/decisions-inventory.md`, entrée A5 — résolue par cette ADR
* [ADR-0011](0011-le-playground-reference-le-catalogue-comme-un-project-reference-fr.md) — la
  décision compagnon sur la façon dont `apps/playground` consomme ce projet généré
