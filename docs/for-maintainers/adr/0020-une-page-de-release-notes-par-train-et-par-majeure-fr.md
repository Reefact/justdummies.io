# ADR-0020 | Une page de release notes par train et par majeure

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0020-one-release-notes-page-per-train-and-major-en.md)

**Statut :** Accepté
**Proposé le :** 2026-08-18
**Accepté le :** 2026-08-19
**Décideurs :** Reefact

## Contexte

`/release-notes` est une page unique qui porte tout ce que la bibliothèque a jamais publié. Les
quatre trains y sont empilés dans le balisage, un panneau chacun, et un script les transforme en
widget d'onglets à l'exécution — il pose `role="tab"`, `role="tabpanel"` et l'état de sélection,
puis démasque la barre d'onglets, ce qui est la forme que
l'[ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md) impose à un contrôle incapable
d'agir sans script.

À l'intérieur d'un panneau, toutes les releases du train sont rendues, et chaque section montre
trois puces avant de replier le reste sous un `<details>` intitulé « +N de plus ». Ce repli existe
parce que la page porte d'un coup l'histoire complète de quatre trains.

L'[ADR-0019](0019-la-page-des-release-notes-reprend-les-fichiers-de-notes-de-la-bibliotheque-fr.md)
change ce dont la page est faite : un fichier par train et par version majeure, dix aujourd'hui,
`lib` en portant deux et les trois autres trains une chacun. La structure de ces fichiers a trois
niveaux — la majeure, ses releases, et les rubriques de chaque release.

L'autre section de référence du site est déjà un ensemble de pages sœurs : `/api`, huit routes qui
partagent une barre latérale collante, laquelle se replie en disclosure natif sous 56rem, sans aucun
widget à construire à l'exécution.

`/release-notes` est liée depuis le pied de page de toutes les pages du site.

Les segments de route sont identiques dans toutes les locales et la locale par défaut n'est pas
préfixée (§7.1, §7.2). `apps/site/src/i18n/routing.ts` lit l'ensemble des routes connues dans les
fichiers de pages eux-mêmes, au build, et énonce que les routes dynamiques ne sont pas gérées : en
ajouter une, c'est en instruire ce module délibérément, plutôt que de découvrir qu'un sélecteur de
langue a silencieusement cessé de paraître.

`public/_redirects` est écrit à la main et porte quarante lignes qui documentent deux comportements
de Cloudflare mesurés plutôt que raisonnés — une règle en `*` silencieusement écartée comme boucle
infinie, et une cible de réécriture qui détruit l'URL qu'elle est censée préserver. Les redirections
y sont évaluées avant `_headers`. Le site construit en `format: 'directory'`, et l'hôte canonicalise
l'écriture sans barre finale vers celle avec barre, par un 307 temporaire et non caché.

## Décision

**Les release notes sont publiées à raison d'une page par train et par version majeure, à
`/release-notes/{train}/v{majeure}`, `/release-notes` étant un index des trains et non une
redirection vers l'un d'eux.**

## Justification

Une page bornée à une majeure est une page dont le poids cesse de croître avec le produit. Le repli
du contexte s'en va avec elle — il était le symptôme de l'empilement de quatre histoires, et il coûte
plus qu'il ne rapporte dès lors qu'une table des matières pointe dans la page : un lien qui atterrit
sur une rubrique montrant trois puces sur huit, le reste derrière un contrôle, est un lien qui
trompe, et la recherche du navigateur ne trouve pas le texte replié.

Faire des trains des liens plutôt que des onglets satisfait l'ADR-0004 en retirant le contrôle au
lieu de le cacher. Un lien agit avant tout script, ne demande aucun rôle posé à l'exécution, et ne
peut pas présenter un widget qui s'annonce et ne fait rien. Cela rend aussi l'état adressable : un
lecteur peut envoyer `/release-notes/cli/v1`, ce qu'aucune sélection d'onglet n'a jamais permis.

L'index mérite sa place au lieu de tenir lieu de redirection. `/release-notes` est dans le pied de
page de toutes les pages : une redirection mettrait un saut supplémentaire, non caché, sur le chemin
normal et non sur un cas limite, et sa cible bougerait à chaque nouvelle majeure — donc il faudrait
générer une partie d'un fichier écrit à la main dont les quarante lignes existent précisément parce
que ses règles sont subtiles et qu'elles ont été manquées deux fois. Et l'index répond à ce
qu'aucune page de train ne répond : ce qui a bougé le plus récemment, tous trains confondus, qui est
la question du visiteur arrivant par le pied de page.

La majeure s'écrit `v1`, et non `1.x`, bien que le fichier amont s'appelle `RELEASE_NOTES-1.x`. Un
point dans un segment d'URL se lit comme une extension de fichier pour la canonicalisation de
l'hôte, et ce dépôt a déjà payé deux fois pour avoir supposé comment cette canonicalisation se
comporte. `v1` ne porte pas cette ambiguïté, et la correspondance avec le fichier regarde le
générateur, pas le lecteur.

Instruire `routing.ts` de ces routes est l'acte délibéré que son propre commentaire réclame, et il
est peu coûteux ici parce que les deux locales existent toujours ensemble : le générateur de
l'ADR-0019 refuse une majeure dont les deux langues divergent, donc une route qui existe dans une
locale existe dans l'autre.

## Alternatives envisagées

### Garder une page unique et changer de majeure côté client

Envisagé parce que cela ne change aucune route, que le lien du pied de page continue d'atterrir sur
du contenu, et que les données sont déjà découpées par majeure après l'ADR-0019.

Rejeté parce qu'il faudrait un script pour atteindre le contenu — précisément la défaillance que
l'ADR-0004 existe pour empêcher — et parce que le poids de la page continuerait de croître avec
chaque release publiée, ce que le repli avait été inventé pour masquer.

### Une page par train, toutes majeures empilées

Envisagé parce que cela fait moins de routes, ne demande pas d'index, et garde toute l'histoire d'un
train au même endroit pour qui veut la faire défiler.

Rejeté parce que cela recrée la page sans borne, un train à la fois, et parce que cela rend
décoratif le niveau « majeure » du sommaire : chaque entrée serait une ancre dans le même document,
et le lecteur n'obtiendrait jamais une page qui parle d'une majeure.

### Rediriger `/release-notes` vers la dernière majeure de `lib`

Envisagé parce que c'est le chemin le plus court vers le contenu pour qui clique le pied de page, et
que cela conserve une seule URL annoncée pour la section.

Rejeté pour le coût nommé dans la justification : une cible mouvante à l'intérieur d'un fichier de
règles écrit à la main, et un saut non caché sur la route la plus liée du site. L'index donne au même
lecteur une page utile plutôt qu'une attente.

## Conséquences

### Positives

* Aucun script n'est nécessaire pour atteindre une note de version, quel que soit le train ou la
  majeure.
* Chaque majeure a une URL partageable, indexable et liable depuis la documentation de la
  bibliothèque.
* Le poids d'une page est borné par une majeure, et non par toute l'histoire du produit.
* Le repli « +N de plus » disparaît : ce que le sommaire désigne est ce que le lecteur voit.

### Négatives

* La section passe de deux routes à douze, et chacune doit exister dans les deux locales.
* Qui clique le lien du pied de page atterrit désormais sur un index et choisit un train, là où les
  notes de la bibliothèque principale étaient déjà à l'écran.
* `routing.ts` acquiert la connaissance d'une forme de route qu'il ne lit pas dans le système de
  fichiers.

### Risques

* **Une majeure est publiée et sa route n'apparaît jamais**, parce que l'index dont les routes sont
  tirées n'a pas été rafraîchi. C'est le même rafraîchissement que l'ADR-0019 gouverne déjà, et la
  page énonce le tag auquel elle a été prise.
* **Le segment `v{majeure}` se comporte autrement que prévu sur l'hôte**, comme deux autres
  hypothèses de chemin avant lui. Les contrôles navigateur demandent chaque route générée et
  vérifient un 200 au lieu de faire confiance au build.

## Suites à donner

* `tests/browser/release-notes.spec.ts` demande chaque route train × majeure dans les deux locales
  et vérifie qu'elle répond 200 avec son propre contenu — c'est ce qui échoue si une route cesse
  d'être générée ou si l'hôte malmène le segment.
* La même suite vérifie qu'une page de train est atteignable et lisible avec le script refusé, ce
  qui échouerait si un contrôle revenait s'interposer entre le lecteur et le contenu.
* `docs/design/specification.md` §7.2 enregistre la forme des routes de la section ; les majeures,
  elles, sont des faits d'instantané et ne sont pas énumérées, comme §7.2 l'exige déjà des pages
  feuilles.

## Références

* [ADR-0019](0019-la-page-des-release-notes-reprend-les-fichiers-de-notes-de-la-bibliotheque-fr.md)
  — ce dont les pages sont faites.
* [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md) — un contrôle ne paraît que s'il
  peut agir.
