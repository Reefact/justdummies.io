# ADR-0019 | La page des release notes reprend les fichiers de notes de la bibliothèque

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0019-the-release-notes-page-mirrors-the-librarys-release-notes-files-en.md)

**Statut :** Proposé
**Proposé le :** 2026-08-18
**Décideurs :** Reefact

## Contexte

`/release-notes` est construite par `scripts/generate-release-notes.mjs`, qui lit le `CHANGELOG.md`
de chaque paquet sur la branche `main` de la bibliothèque et en tire
`apps/site/src/generated/release-notes.json`. Le script énonce lui-même pourquoi il lit le changelog
plutôt que les corps de release de GitHub : à l'époque où il a été écrit, les notes GitHub d'une
release étaient dérivées des titres de pull requests, et le changelog était le seul écrit destiné à
quelqu'un qui décide s'il doit monter de version.

Cette prémisse ne tient plus en amont. L'ADR-0074 de la bibliothèque impose que les notes GitHub
d'une release soient rédigées à la main et refuse de taguer sans elles, et son workflow de release
lit ces notes dans un fichier commité : `<Train>/RELEASE_NOTES-<majeure>.x.en.md`, un par train de
release et par version majeure. Mesuré le 2026-08-18, au tag `catalog-v1.0.0-preview.3`, la
bibliothèque en porte dix — quatre trains, cinq majeures, chacun avec son jumeau français :

| Train | Fichiers |
|---|---|
| `lib` | `JustDummies/RELEASE_NOTES-0.x.{en,fr}.md`, `RELEASE_NOTES-1.x.{en,fr}.md` |
| `xunit` | `JustDummies.Xunit/RELEASE_NOTES-1.x.{en,fr}.md` |
| `catalog` | `JustDummies.DiagnosticCatalog/RELEASE_NOTES-1.x.{en,fr}.md` |
| `cli` | `JustDummies.Cli/RELEASE_NOTES-1.x.{en,fr}.md` |

Chaque fichier porte un titre `#`, puis un `##` par release (`1.0.0-preview.2 — August 18, 2026`),
puis un `###` par rubrique — `⚠️ Breaking changes`, `✨ New`, `🙌 Improvements`, `🐛 Bug Fixes`, et
dans le jumeau français `⚠️ Changements cassants`, `✨ Nouveautés`, `🙌 Améliorations`,
`🐛 Corrections`. Sur les dix fichiers, le balisage se limite aux titres, aux puces `- ` et à quatre
formes en ligne : code, gras, italique et liens. Les deux langues portent les mêmes releases et les
mêmes rubriques, release par release.

Les changelogs que ces fichiers résument suivent Keep a Changelog : `### Added`, `### Changed`,
`### Fixed`, `### Notes`, `### Requires`, `### Refused, on purpose`. Ils n'existent qu'en anglais.
Pour les afficher, ce dépôt porte une table de dix clés de traduction (`releaseNotes.category.*`) et
un repli sur le libellé anglais brut pour une catégorie qu'il ne reconnaît pas.

`/fr/release-notes` affiche donc aujourd'hui de la prose anglaise, marquée `lang="en"` pour qu'un
lecteur d'écran change de prononciation. §6.4 exige qu'une page n'existe dans une locale que si elle
y est réellement traduite.

L'[ADR-0013](0013-le-contenu-repris-de-la-bibliotheque-est-epingle-a-un-tag-fr.md) a décidé que le
contenu repris de la bibliothèque est pris comme un instantané atomique à un tag de release publié,
et cite le miroir depuis `main` de cette page comme le précédent qu'il ne suit délibérément pas.

Les tags de la bibliothèque portent leur propre horodatage, et les trains sont coupés
indépendamment. Mesuré le 2026-08-18 : `catalog-v1.0.0-preview.3` à 22:31 et `lib-v1.0.0-preview.2`
à 22:02. Au tag `lib`, les notes de `catalog` s'arrêtent une release trop tôt ; au tag `catalog`,
les deux trains sont complets. L'instantané que ce dépôt embarque aujourd'hui a été pris le
2026-08-16 et ne contient ni l'une ni l'autre.

## Décision

**Ce que publie `/release-notes`, ce sont les fichiers de release notes de la bibliothèque, lus
dans les deux langues au tag de release le plus récent de celle-ci.**

## Justification

Les deux documents du contexte s'adressent à deux lecteurs, et cette page n'en a qu'un. Le changelog
est le registre technique — chaque contrainte, chaque cas limite, chaque ADR, selon les mots de
l'en-tête des fichiers de notes eux-mêmes — tandis que le fichier de notes est l'écrit destiné à
quelqu'un qui décide s'il doit monter de version, ce que le chapeau de la page promet déjà. Publier
le changelog, c'était lire le bon dépôt et le mauvais document.

§6.4 est le gain le plus net. La moitié française du corpus existe, elle est complète, et sa parité
est vérifiée en amont ; la reprendre satisfait d'un coup ce dont `lang="en"` n'est aujourd'hui que
l'aveu. Le même geste supprime la table de dix clés : une rubrique arrive dans la langue du lecteur
parce que le fichier dont elle vient est déjà dans cette langue, si bien qu'une rubrique inventée
l'an prochain par la bibliothèque arrive traduite au lieu de retomber sur son texte anglais.

Lire à un tag plutôt que sur `main`, c'est l'argument de l'ADR-0013 appliqué là où l'ADR-0013 disait
qu'il ne l'était pas encore, et cela ne coûte rien ici qu'il ne coûtait déjà pour la documentation.
Que le ref soit le tag le plus récent *quel que soit le train qui l'a coupé* découle de la mesure du
contexte : deux tags séparés de vingt-neuf minutes ne contiennent pas les mêmes notes, et seul le
plus tardif contient tout ce qui est publié à ce jour.

Rien là-dedans n'affaiblit la garantie qu'aucun fait affiché par le site n'est saisi à la main. Le
miroir échoue bruyamment à la place : une majeure nommée par un tag dont le fichier de notes manque,
ou deux langues portant des ensembles de releases différents, arrêtent le générateur au lieu de
publier une page complète dans une langue et tronquée dans l'autre.

## Alternatives envisagées

### Continuer à lire les changelogs

Envisagé parce que c'est le précédent en place, que cela ne demande aucun changement, et que le
changelog porte strictement plus de détail que les notes — chaque entrée, y compris celles qu'une
note de version résume en une phrase.

Rejeté parce que ce détail n'est pas le travail de cette page, et parce qu'il n'existe qu'en
anglais. Le publier, c'est soit garder `/fr/release-notes` en anglais, ce que §6.4 interdit dès lors
qu'une source traduite existe, soit traduire ici un corpus déjà traduit en amont — la duplication
que D1 nomme comme le prix de deux dépôts séparés, payée pour rien.

### Lire l'API Releases de GitHub

Envisagé parce que le corps d'une release sur GitHub est littéralement ce que la bibliothèque publie
à ses lecteurs, et que c'est le même texte que cette décision reprend.

Rejeté parce que c'est le même texte par un chemin moins bon. Les corps de release sont en anglais
seul, puisque le script d'empaquetage de la bibliothèque émet le fichier `-en` ; une lecture d'API
porte un quota et une histoire d'authentification qu'une lecture de fichier n'a pas ; et ce que
l'API renvoie a été figé au moment de la coupe, si bien qu'une correction apportée ensuite au
fichier de notes n'atteindrait jamais le site. Les fichiers sont la source dont les corps de release
sont eux-mêmes tirés.

### Reprendre les deux — les notes pour la prose, le changelog pour le détail

Envisagé parce que cela ne perd rien : la page pourrait ouvrir sur la note de version et offrir les
entrées du changelog en dessous, pour qui veut le registre complet.

Rejeté parce que deux récits d'une même release sur une même page obligent le lecteur à démêler
lequel est lequel, et que le second est celui qui n'a pas de français. Le changelog reste à un clic,
lié par train, là où le lecteur qui veut le registre technique a déjà l'habitude de le trouver.

## Conséquences

### Positives

* `/fr/release-notes` devient réellement française, et `lang="en"` disparaît de la prose.
* Les clés `releaseNotes.category.*` et leur repli disparaissent ; les rubriques ne sont plus à
  traduire ici.
* La page montre l'écrit que la bibliothèque destine à ses consommateurs, le même que les corps de
  release GitHub d'où le lecteur arrive peut-être.
* L'instantané enregistre le tag auquel il a été pris : le retard devient une comparaison de
  versions plutôt qu'un jugement sur une date.

### Négatives

* Les notes du site traînent derrière le `main` de la bibliothèque, par construction : une
  correction fusionnée en amont reste invisible tant qu'un tag ne la porte pas. C'est la latence que
  l'ADR-0013 a déjà acceptée pour la documentation.
* Le générateur a désormais besoin de la liste des tags de la bibliothèque, et plus seulement d'un
  chemin de fichier — une chose de plus qui peut être injoignable au moment où il tourne.

### Risques

* **La forme des fichiers amont change** — une rubrique en `##` au lieu de `###`, un titre de
  release qui cesse de nommer sa date. Le générateur refuse au lieu de publier une section vide, et
  le refus nomme le fichier.
* **Un train est ajouté en amont** sans que rien ici ne le remarque, et ses notes ne sont jamais
  publiées. Les trains sont nommés dans ce dépôt, comme ils le sont déjà ; l'écart devient visible
  dès que le tag du nouveau train apparaît dans la liste sans train correspondant.

## Suites à donner

* `scripts/generate-release-notes.mjs` lit les fichiers de notes au dernier tag de la bibliothèque
  et refuse sur un fichier manquant ou une discordance entre les langues — ce refus est ce qui
  échoue quand la décision est brisée, et il s'éprouve en pointant le générateur sur un tag dont les
  fichiers sont incomplets.
* `tests/browser/release-notes.spec.ts` vérifie que la page française affiche un libellé de rubrique
  français, ce qui passerait au rouge si la page revenait au changelog anglais.
* `docs/design/specification.md` §7.2 enregistre les routes de la section ; voir
  l'[ADR-0020](0020-une-page-de-release-notes-par-train-et-par-majeure-fr.md) pour ce qu'elles
  sont.

## Références

* [ADR-0013](0013-le-contenu-repris-de-la-bibliotheque-est-epingle-a-un-tag-fr.md) — le contenu
  repris de la bibliothèque est épinglé à un tag de release.
* [ADR-0017](0017-rediger-a-la-main-les-notes-github-dune-release-et-refuser-sans-elles-fr.md) — la
  même décision, prise ici pour les releases de ce dépôt.
* `Reefact/just-dummies`, ADR-0074 — rédiger à la main les notes GitHub d'une release, et refuser
  sans elles.
