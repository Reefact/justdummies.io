# ADR-0026 | Les sujets de /docs s'épinglent au tag du train qui les possède

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0026-docs-topics-pin-to-the-tag-of-the-train-that-owns-them-en.md)

**Statut :** Proposé
**Proposé le :** 2026-08-23
**Décideurs :** Reefact

## Contexte

L'ADR-0013 a décidé que le contenu que ce site reprend de la bibliothèque est pris comme un
instantané atomique à un tag de release publié, et a laissé ouverte, comme un risque nommé et une
action de suivi, la question de savoir à quel tag un instantané de `/docs` — qui couvre quatre
trains versionnés indépendamment — devait s'ancrer : *« Quatre trains touchent un corpus partagé, si
bien que le tag auquel un instantané est pris ne se lit pas dans le corpus lui-même. Laissé non dit,
il devient ce que la première implémentation en a fait, ce qui est ainsi qu'une décision se
transforme en accident. »* Cette fiche est cette implémentation, transformée en décision plutôt
qu'en accident.

`doc/handwritten/for-users/` sur [`Reefact/just-dummies`](https://github.com/Reefact/just-dummies)
tient quatre natures de page : huit guides, une référence des generators en six pages, quatre pages
de paquets — une par paquet publié — et trente-trois pages de règles d'analyzer. Les quatre paquets
sont publiés sur des trains qui versionnent indépendamment, chacun coupé par son propre tag
(`lib-v*`, `xunit-v*`, `catalog-v*`, `cli-v*`) ; les analyzers sont embarqués à l'intérieur de
`JustDummies` lui-même, sur le train `lib` (`tools/trains.sh`). Les guides et la référence des
generators décrivent la bibliothèque dans son ensemble et n'appartiennent à aucun paquet en
particulier.

`/release-notes` (ADR-0019, ADR-0020) répond différemment à une question voisine : il prend le tag
le plus récent tous trains confondus, quel que soit celui qui l'a coupé, parce qu'une page de
release-notes d'un train doit quand même pouvoir se lire au regard de ce que chaque autre train a dit
le plus récemment. Une page de paquet de `/docs` n'a pas ce besoin — qui lit
`packages/justdummies-cli.md` lit à propos de la CLI, pas à propos du paquet qui a le plus
récemment publié.

Construire le générateur (`scripts/generate-docs.mjs`) a mis au jour un fait que le Contexte de
l'ADR-0013 ne pouvait pas connaître : `packages/justdummies-xunit.md` n'existe pas au tag
`xunit-v1.0.0-preview.1`, le seul que le train xunit ait jamais coupé — la page a été écrite après
cette release, et aucune release xunit ultérieure n'a eu lieu depuis. S'épingler strictement au « tag
le plus récent du propre train du sujet » n'est donc pas toujours une question à laquelle ce qui a
été publié permet de répondre.

## Décision

**Un guide, une page de référence des generators ou une règle d'analyzer s'épingle au tag le plus
récent du train `lib` ; une page de paquet s'épingle au tag le plus récent de son propre train qui
contient réellement le fichier, et retombe sur le tag le plus récent chronologiquement, tous trains
confondus, dans cet ordre, si son propre train n'en a aucun.**

## Justification

Épingler les pages de paquet à leur propre train, plutôt qu'au tag le plus récent unique que
`/release-notes` utilise, garde la numérotation de version d'une page pertinente pour la seule chose
que le lecteur de cette page est en train d'installer : `packages/justdummies-cli.md` nomme la
version propre de la CLI, pas celle du paquet ayant le plus récemment publié. Une release CLI seule
ne rafraîchit alors que l'épinglage de la page CLI, ce qui est le même resserrement que l'alternative
« reprendre par train, ou par section » de l'ADR-0013 rejetait *pour `/release-notes`* au motif
qu'elle compose des refs que la vérification liens-et-échantillons de la bibliothèque n'a jamais fait
tourner ensemble — une contrainte qui ne s'affaiblit pas ici : ce générateur refuse toujours de lire
les deux langues d'un même sujet à deux refs différentes (§6.4), il permet simplement à deux *sujets*
différents d'être épinglés à deux refs différentes, ce que `/release-notes` fait déjà aujourd'hui
entre trains.

Les guides, la référence des generators et les analyzers ne sont la documentation propre d'aucun
paquet — ils décrivent la bibliothèque — donc `lib`, le train qui publie la bibliothèque elle-même et
dont dépend chaque autre train, est le seul train dont une page à propos de `Any.Int32()` ou de
`JD014` puisse raisonnablement être dite dépendre.

Le repli inter-trains n'est pas une règle affaiblie adoptée par commodité ; c'est le même
raisonnement « le tag publié le plus récent qui contient réellement le fichier » que `fetchTopic`
applique déjà à l'intérieur d'un train, étendu au-delà de ce train seulement quand les tags de ce
train ne peuvent pas répondre. `main` n'est jamais lu — chaque candidat reste un tag qu'une exécution
de release a réellement coupé. L'alternative, refuser l'instantané purement et simplement tant que le
train xunit n'a pas republié, a été rejetée : elle laisserait dans le noir une page réelle, publiée et
correcte à cause d'un fait concernant *quand* un train différent a le plus récemment taggé — exactement
le genre de couplage accidentel que cette fiche existe pour nommer et trancher plutôt que reproduire.

## Alternatives envisagées

### Un seul tag pour tout l'instantané de /docs, comme le fait /release-notes

Envisagée parce que c'est le précédent existant (le choix antérieur de l'ADR-0013 lui-même) et la
règle la plus simple à énoncer : un seul ref, chaque page s'y épingle.

Rejetée parce que la version d'une page de paquet se lirait alors comme celle du train ayant le plus
récemment publié, sans rapport avec le paquet dont la page parle réellement — une page CLI pourrait
porter un tag `lib-v*` le jour où la bibliothèque publie et pas la CLI, ce qui trahit exactement ce
que « épinglé à un tag de release » est censé promettre : la version que l'on dit au lecteur
d'installer.

### Refuser l'instantané quand le propre train d'un sujet n'a aucun tag le contenant

Envisagée comme la lecture la plus stricte de « épinglé à un tag publié » : si le train xunit n'a pas
republié depuis que sa propre page de paquet a été écrite, `/docs` ne devrait pas prétendre le
contraire.

Rejetée parce que le fichier est réel, publié, et correct à un tag réel — simplement pas un tag propre
à xunit. Refuser tout l'instantané pour ce fait bloque 50 sujets sans rapport pour la cadence de
release d'un seul train, et le fait silencieusement : rien dans le *contenu* n'est faux, seul le
train ayant le plus récemment taggé diffère.

## Conséquences

### Positives

Le tag épinglé d'une page de paquet est, le plus souvent — le cas courant, où un train a republié
depuis que sa propre documentation a été touchée — la version qui importe réellement à un lecteur
installant ce paquet.

Les guides, les generators et les analyzers se déplacent avec les releases de la bibliothèque
elle-même, ce qu'ils décrivent.

### Négatives

Le `ref` du frontmatter d'une page n'est pas toujours prévisible à partir de sa seule `section` — le
repli inter-trains signifie qu'une page de paquet peut occasionnellement porter le tag d'un train
différent, et un lecteur qui inspecte l'épinglage doit le lire plutôt que le déduire de l'URL de la
page.

### Risques

**Le repli peut masquer un train qui a réellement cessé de publier.** Un paquet dont le train ne
retague plus jamais continue de servir indéfiniment une page ancienne épinglée au tag d'un autre
train, sans rien qui le signale — la même péremption que l'ADR-0013 attribue à
`scripts/check-package-freshness.mjs`, qui ne lit pas encore cet instantané.

## Actions de suivi

* `scripts/check-package-freshness.mjs` (ADR-0013) ne lit pas l'instantané de `/docs`. L'étendre pour
  comparer le `ref` épinglé de chaque page de paquet au dernier tag publié de ce train ferait
  apparaître le risque ci-dessus de la même façon qu'il le fait déjà pour `site.ts`.
* `JustDummies.Documentation.UnitTests`, que le Contexte de l'ADR-0013 nomme comme les quatre
  contrats qu'une reprise hérite, vérifie le corpus à un seul ref à la fois, dans le dépôt propre de
  la bibliothèque. Chaque sujet de `/docs` ici est épinglé indépendamment, donc la garantie que ce
  site hérite est « chaque sujet a été vérifié au ref auquel il est épinglé », pas « tout le corpus
  de `/docs` a été vérifié ensemble » — à énoncer précisément si un futur lecteur suppose le
  contraire.

## Références

* [ADR-0013](0013-le-contenu-repris-de-la-bibliotheque-est-epingle-a-un-tag-fr.md) — la règle
  d'épinglage dont cette fiche tranche la question laissée ouverte, et le risque qu'elle nomme
* [ADR-0019](0019-la-page-des-release-notes-reprend-les-fichiers-de-notes-de-la-bibliotheque-fr.md),
  [ADR-0020](0020-une-page-de-release-notes-par-train-et-par-majeure-fr.md) — l'épinglage propre de
  `/release-notes`, mis en regard du choix par train ici
* `tools/trains.sh` sur `Reefact/just-dummies` — la partition en trains, et où les analyzers sont
  déclarés embarqués dans `lib`
* `scripts/generate-docs.mjs` — le générateur que cette décision gouverne
