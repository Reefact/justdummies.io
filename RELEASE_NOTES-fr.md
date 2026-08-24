# Release notes — justdummies.io

🌍 🇬🇧 [English](RELEASE_NOTES-en.md) · 🇫🇷 Français (ce fichier)

Ce qui a changé sur justdummies.io, une section par tag `release/*`, en langage clair — pour
une visiteuse, un contributeur, ou le mainteneur lui-même qui vérifie ce qui est nouveau. Ceci
n'est pas un journal de commits : on y décrit ce qu'une lectrice remarquerait, pas quelle pull
request l'a apporté. L'historique technique reste celui du dépôt ; rien ici n'est une note de
compatibilité, puisque rien ne consomme ce déploiement (voir
[ADR-0001](docs/for-maintainers/adr/0001-a-release-tag-publishes-not-a-merge-fr.md)).

## Unreleased

### 🙌 Améliorations

- Le hero de la page d'accueil illustre désormais la même expression que celle expliquée juste en dessous, plutôt qu'une expression différente — sa longueur se règle via deux champs modifiables, un minimum et un maximum, à la place de l'unique longueur exacte précédente.

### 🐛 Corrections

- Les liens de la documentation ne sont plus soulignés mot à mot : les cartes de sections sur /docs, la liste des sujets d'une section, la colonne de navigation et la paire précédent/suivant sont dessinées comme le reste du site dessine ses liens, et la colonne de navigation signale à nouveau en couleur la page en cours de lecture. Les liens à l'intérieur de la prose de la documentation, eux, gardent leur soulignement.

## release/2026-08-24T07-27-33Z — 24 août 2026

### ✨ Nouveautés

- La page /version dispose désormais d'une section « Releases précédentes », montrant les 5 releases publiées par ce site juste avant la dernière, avec un lien unique pour voir les releases suivantes sur GitHub.
- Un dummy se tient désormais à côté de la commande d'installation sur le premier écran de la page d'accueil, sur les fenêtres assez grandes pour lui faire de la place.
- La page À propos est désormais signée par un dummy adossé en fin de texte, sur les fenêtres larges : le bord droit de la prose épouse son inclinaison au lieu de lui passer dessus.
- Les clics sur le bouton flottant « Télécharger » sont désormais comptés, pour savoir si un appel à l'action permanent sur chaque page mérite sa place. La page vie privée dit exactement ce qui est enregistré — quelle section du site vous étiez en train de lire, la langue de la page, et le moment — et rien d'autre : aucun identifiant, aucune adresse, rien qui puisse remonter jusqu'à vous.
- Le playground est désormais compté lui aussi : ses visites, qui manquaient entièrement aux chiffres d'audience du site, et les expressions que les visiteurs construisent. Ce qui est enregistré d'une expression est sa forme sans les valeurs — `Any.String().StartingWith(?).Generate()` — si bien que rien de ce que vous y saisissez ne quitte votre navigateur, ce que la page vie privée énonce désormais.
- La question de consentement n'est plus posée qu'une fois pour tout le site, où que vous arriviez. Le playground la pose lui aussi — il ne demandait rien et n'était compté par rien — et une réponse donnée d'un côté est celle que suivent toutes les autres pages : la question ne vous est jamais posée deux fois. Si vous l'y acceptez, une chose de plus est enregistrée quand vous pressez Générer : qu'une pression a eu lieu, et rien de ce que vous avez tapé.
- Le site dispose désormais d'une section documentation. /docs reprend les guides de la bibliothèque, sa référence des générateurs, une page par package et une par règle d'analyzer, en français et en anglais — la documentation qui ne se lisait jusqu'ici que sur GitHub, avec ses diagrammes dessinés plutôt que laissés sous forme de source. Ce que vous y lisez décrit toujours la version que le site vous propose d'installer, et chaque page renvoie au fichier dont elle est tirée.

### 🙌 Améliorations

- Les deux titres de la page /version qui disaient la même chose (« Ce build » et « Dernière release ») n'en forment plus qu'un, « Dernière release ».
- Chaque lien « Voir sur GitHub » de la page /version ouvre désormais la liste des releases de GitHub à l'endroit de la release qu'il nomme, plutôt que la page propre à cette release.
- Les contraintes de casse de JustDummies s'appellent désormais `InUpperCase()` et `InLowerCase()` — dans le playground, la référence d'API et la documentation — suite à la version 1.0.0-preview.4 de la bibliothèque.
- Le package de catalogue de diagnostics documente désormais `JD031` à `JD033`, suite à sa propre version 1.0.0-preview.4.
- L'outil en ligne de commande `dum` proposé au téléchargement passe en 1.1.0-beta.3.

## release/2026-08-21T22-42-04Z — 21 août 2026

### 🐛 Corrections

- Le générateur de chaîne du playground n'oppose plus un refus lorsqu'une contrainte de famille de caractères (`AlphaNumeric()` et consorts) est combinée à un littéral ancré comme `StartingWith("ORD-")` — les deux se composent désormais au lieu de lever une erreur à la déclaration, suite à la version 1.0.0-preview.3 de JustDummies.

## release/2026-08-21T10-08-43Z — 21 août 2026

### ✨ Nouveautés
- Le panneau de code du playground affiche désormais un vrai littéral C# pour la plupart des types d'argument — chaînes, caractères, booléens, entiers dans leur plage, et valeurs flottantes finies — au lieu d'un appel de parsing générique ; `Half` s'affiche désormais comme un cast explicite, faute de syntaxe de littéral en C#, et quelques types (`Guid`, dates et heures, entiers 128 bits hors plage) restent affichés comme un appel de parsing.
- Le playground dispose désormais du même bouton flottant « Télécharger » que le reste du site, sur toutes ses pages.
- Une petite illustration d'un dummy au volant décore désormais la carte du playground sur très grand écran.
- La page /version affiche désormais ce qu'a changé la dernière release du site lui-même, en anglais et en français, sous les informations de build qu'elle donnait déjà, avec un lien vers la publication GitHub correspondante.

### 🙌 Améliorations
- Redessiné l'illustration de la page « page introuvable » pour un meilleur contraste et un visage plus lisible, et basculé son chargement en WebP — environ 80 % plus léger, pour un affichage plus rapide de la page d'erreur.
- Clarifié le texte expliquant l'ordre des critères sur la page comparative « pourquoi JustDummies ».
- Changer de langue sur une page de release notes conserve désormais une position de table des matières ou de lien profond au lieu de revenir en haut de page ; une simple position de défilement sans ancre y ramène toujours.

### 🐛 Corrections
- Dans le playground, une étape se transforme en code dès que sa méthode est choisie, au lieu de rester une liste déroulante jusqu'à ce qu'on clique par hasard ailleurs sur le bloc. Le curseur se pose là où l'on va écrire ensuite : le premier argument de l'étape, ou la combo de l'étape suivante.
- Playground : un refus de la bibliothèque pouvait s'afficher sans sa couleur d'erreur habituelle, ressemblant à une valeur normale.
- Playground : son pied de page ne comportait pas le lien vers la référence API, présent dans le reste du pied de page du site.
- Naviguer au clavier pouvait faire défiler l'un des contrôles d'une page — le bouton Copier du playground, ou les liens du pied de page du site — sous le bouton flottant « Télécharger » du site ; la page laisse désormais assez de marge pour qu'un contrôle focalisé ne s'y retrouve plus.
- Les release notes reprises de la bibliothèque : les liens pointaient vers la branche principale mouvante de la bibliothèque plutôt que vers la version publiée, n'étaient pas annoncés comme des liens externes pour les lecteurs d'écran, et certaines versions préliminaires étaient étiquetées à tort comme stables.
- Pages de release notes : correction d'une série de défauts de mise en page — puces à peine visibles, icônes de rubrique mal alignées, table des matières qui ne restait pas fixée à l'écran au défilement dans certains navigateurs, page aussi large qu'une page de référence API alors qu'il s'agit de prose, et défilement latéral parasite sur l'index des release notes et sa table des matières sur petit écran.
- Pages de release notes : correction de plusieurs défauts d'accessibilité — liens partageant le même nom pour un lecteur d'écran malgré des destinations différentes, marqueurs invisibles en mode contraste renforcé, anneau de focus par défaut du navigateur au lieu de celui du site, et titre de page situé hors de la zone de contenu principal.
- Pages de release notes : correction d'une nouvelle série de défauts — un saut vers une entrée de la table des matières ne déplaçait pas le focus clavier, la mauvaise version était signalée comme « vous êtes ici » sur mobile, le français employait le même mot pour deux notions différentes, un lien « changelog » prétendait mener vers une source qu'il ne lisait pas réellement, et la date de publication pouvait se placer maladroitement sous son badge sur mobile.
- Release notes : un span de code mal formé pouvait corrompre le rendu markdown, et une date invalide (comme le 31 novembre) était silencieusement recalée au jour suivant au lieu d'être rejetée.

## release/2026-08-19T11-50-00Z — 19 août 2026

### ✨ Nouveautés
- Ajout d'une page de téléchargement dédiée — une par paquet (bibliothèque principale, adaptateur xUnit, CLI) — accessible depuis un lien flottant persistant sur chaque autre page, montrant les deux commandes d'installation (.NET CLI et Package Manager Console) du paquet courant en même temps.
- Les contraintes Except et OneOf du playground acceptent désormais une liste de valeurs séparées par des virgules, pour chaque générateur scalaire qui les propose.
- Publication d'une nouvelle section release notes, avec une page par paquet et version majeure ainsi qu'une table des matières, alimentée directement par les release notes de la bibliothèque elle-même, en anglais et en français.
- Ajout d'une voie d'analyse optionnelle, basée sur Google Analytics, qui mesure le parcours des lectrices et lecteurs sur le site — elle ne démarre qu'après acceptation dans le bandeau de consentement, et s'arrête dès le retrait du consentement.
- Mise à jour de la bibliothèque JustDummies sous-jacente vers 1.0.0-preview.2, ajoutant une catégorie « Pool inspection » à la référence API.

### 🙌 Améliorations
- Correction de la description de la page de confidentialité sur la durée de conservation des données d'analyse, et suppression d'une affirmation inexacte selon laquelle rien n'est jamais partagé avec personne.

### 🐛 Corrections
- Corrigé l'interface française qui traduisait « release notes » par « Notes de version » au lieu de garder le terme anglais.
- Retiré une double ponctuation dans une des notes du playground.

## release/2026-08-18T14-49-42Z — 18 août 2026

_Le playground devient plus clair sur ses propres limites, et son introduction se lit de nouveau correctement en français._

### ✨ Nouveautés
- La liste de méthodes du playground affiche désormais les fonctionnalités de la bibliothèque qu'il ne peut pas exécuter (comme les générateurs composites) comme des options grisées avec une explication, plutôt que de les omettre.

### 🐛 Corrections
- Réécrit le texte d'introduction du playground en anglais et en français — la version française n'avait plus de sens — et ajouté une précision indiquant qu'il s'agit d'une interface plus restreinte que la bibliothèque elle-même.
- La note à côté du bouton « Generate » indique désormais explicitement que le code s'exécute localement dans le navigateur, au lieu du vague « running here ».

## release/2026-08-18T12-53-33Z — 18 août 2026

_Corrections de formulation et de mise en page sur la page d'accueil et le playground, rien de structurel._

### 🙌 Améliorations
- Remplacé la section « le problème qu'elle résout » de la page why-justdummies par une courte phrase de transition, celle-ci s'étant réduite à peu près à un simple lien.

### 🐛 Corrections
- Corrigé le paragraphe d'ouverture du playground, dont la taille et la largeur en faisaient un titre plutôt qu'un texte normal.
- Corrigé le sous-titre anglais de la page d'accueil, qui décrivait les valeurs de test elles-mêmes comme « fluent » au lieu de l'API qui les génère.

## release/2026-08-17T20-58-25Z — 17 août 2026

_La vue de code du playground correspond désormais à celle de la page d'accueil._

### 🙌 Améliorations
- Le playground reprend désormais la carte de code de la page d'accueil : les étapes choisies s'affichent en code coloré, avec un extrait copiable tenant sur une seule ligne pour la chaîne complète.

## release/2026-08-17T20-39-18Z — 17 août 2026

_Une section de la page de comparaison réduite à ce qui tient encore debout._

### 🙌 Améliorations
- Simplifié la section « quand ne pas utiliser JustDummies » de la page why-justdummies, en retirant trois points qui ne tenaient plus.

## release/2026-08-17T19-31-39Z — 17 août 2026

_Le tableau récapitulatif de la page de comparaison est plus facile à trouver, et un en-tête mal aligné sur les pages API est corrigé._

### 🙌 Améliorations
- Sur la page de comparaison why-justdummies, le tableau récapitulatif apparaît désormais tout en haut de cette section, pour une vue d'ensemble sans rien avoir à déplier.
- Les définitions des icônes de notation s'affichent désormais en infobulle plutôt que dans une légende séparée, et le haut de la page paraît plus calme, avec moins de couleurs.

### 🐛 Corrections
- Corrigé le logo et le titre des pages API, qui n'étaient pas alignés avec le reste du site.

## release/2026-08-17T09-26-07Z — 17 août 2026

_Une passe de polish sur la page de comparaison après relecture du mainteneur._

### 🙌 Améliorations
- Page de comparaison retravaillée après relecture du mainteneur : ouvrir un critère referme désormais le précédent et garde la position sur la page, le tableau comparatif complet reste toujours visible plutôt que repliable, et les icônes de notation sont maintenant de simples formes en noir et blanc avec infobulle plutôt que codées par couleur.

## release/2026-08-17T07-43-58Z — 17 août 2026

_Une nouvelle passe sur la page de comparaison, et une affirmation corrigée sur les propres contrôles à la compilation de JustDummies._

### 🙌 Améliorations
- Nouvelle refonte de la page de comparaison why-justdummies : une introduction plus simple, des critères que l'on déplie un par un, et un jeu d'icônes coche/clé/tiret pour les notations.

### 🐛 Corrections
- Corrigé l'exemple de code de la page d'accueil, qui se décalait visiblement quand le widget du playground en direct le remplaçait.
- Corrigé l'entrée du tableau comparatif sur les contrôles à la compilation, qui sous-estimait ce que les analyseurs intégrés de JustDummies détectent gratuitement.
- Corrigé une formulation maladroite dans l'accroche française de la page d'accueil.

## release/2026-08-16T19-18-07Z — 16 août 2026

_Une mesure d'audience légère sur les liens d'installation, et la page de comparaison explique désormais ses propres critères avant de montrer le tableau._

### ✨ Nouveautés
- Ajout d'une mesure d'audience légère et respectueuse de la vie privée, qui enregistre quelle commande d'installation ou quel lien les visiteurs utilisent, pour orienter les prochaines décisions sur ce qui mène réellement à l'installation (détails sur la page de confidentialité).

### 🙌 Améliorations
- Retravaillé la page de comparaison why-justdummies pour qu'elle explique chaque critère en langage clair avant de montrer le tableau, et corrigé plusieurs affirmations inexactes sur les outils concurrents.

### 🐛 Corrections
- Corrigé l'en-tête, le pied de page, les espacements et le paragraphe d'ouverture du playground pour qu'ils correspondent au reste du site, au lieu de ressembler à une application séparée.

## release/2026-08-16T07-42-03Z — 16 août 2026

_Le playground passe d'un exemple figé à la construction, étape par étape, d'une véritable chaîne de générateurs._

### ✨ Nouveautés
- Le playground permet désormais de construire une véritable chaîne de générateurs étape par étape, à partir des méthodes réelles de la bibliothèque, plutôt que de montrer un seul exemple figé.

## release/2026-08-16T06-55-58Z — 16 août 2026

_Deux nouvelles pages : une comparaison sur dix critères avec d'autres outils, et une référence API complète._

### ✨ Nouveautés
- Ajout de la page « Why JustDummies », qui compare la bibliothèque à Bogus, AutoFixture et aux données de test écrites à la main sur dix critères.
- Ajout d'une section de référence API complète documentant chaque méthode de la bibliothèque, générée directement à partir du package publié.

### 🐛 Corrections
- La page Release notes n'affiche plus d'entrée « Unreleased » vide.

## release/2026-08-16T01-00-35Z — 16 août 2026

_Une page Release Notes pour la bibliothèque voit le jour, et la démo en direct de la page d'accueil correspond désormais à son pendant statique._

### ✨ Nouveautés
- Ajout d'une page Release notes montrant l'historique du changelog de la bibliothèque, pour chacun de ses packages.

### 🐛 Corrections
- Corrigé plusieurs décalages visuels dans la démo de code en direct de la page d'accueil, pour qu'elle corresponde à l'exemple statique qu'elle remplace (mise en forme, couleurs, alignement).

## release/2026-08-15T22-12-07Z — 15 août 2026

_Des pages About et Privacy, un pied de page sur tout le site, et le playground parle désormais aussi français._

### ✨ Nouveautés
- Ajout de pages dédiées « About » et « Privacy », avec un pied de page présent sur tout le site pour y accéder.
- Le playground est désormais disponible en français comme en anglais, à l'image du reste du site.

### 🙌 Améliorations
- La page autonome du playground partage désormais le même en-tête et la même identité visuelle que le reste du site.

### 🐛 Corrections
- Corrigé un contour de focus parasite qui apparaissait autour du titre « Playground » en accédant à cette page.
- Corrigé le champ de longueur du playground, qui pouvait accepter des valeurs dépassant sa limite annoncée de 64 caractères.

## release/2026-08-15T09-50-18Z — 15 août 2026

_Deux corrections de mise en page : un saut de page au repli, et une démo de la page d'accueil plus étroite que le reste de la page._

### 🐛 Corrections
- Corrigé un saut de page occasionnel en repliant la vue étendue d'un exemple de code.
- Corrigé l'exemple de code en direct et la commande d'installation de la page d'accueil, plus étroits que le reste de la page.

## release/2026-08-13T11-42-04Z — 13 août 2026

_Petites corrections de mise en page autour des barres de défilement, sur la page 404 et ailleurs._

### 🐛 Corrections
- Corrigé un léger décalage de mise en page lors du passage d'une page avec barre de défilement à une page sans, qui déplaçait légèrement le contenu.
- La page « page introuvable » n'affiche plus de barre de défilement superflue, et son message se lit désormais comme une seule légende sous l'illustration, au lieu d'être scindé au-dessus et en dessous.

## release/2026-08-13T09-31-22Z — 13 août 2026

_Passe de cohérence : la marque se positionne pareil partout, et les liens externes se comportent de façon prévisible._

### 🙌 Améliorations
- La marque JustDummies apparaît désormais exactement à la même position sur chaque page, au lieu de légèrement varier selon la page.
- Le lien GitHub de l'en-tête s'ouvre désormais dans un nouvel onglet, pour ne pas perdre sa place sur le site ; le lien vers le playground continue de s'ouvrir dans le même onglet.
- Clarifié, dans la scène d'ouverture du playground, ce que l'étape de préparation de l'exemple laisse de côté.

## release/2026-08-13T08-16-25Z — 13 août 2026

_La page 404 reçoit la marque JustDummies et une illustration pleine largeur au lieu d'un simple message._

### 🙌 Améliorations
- Les pages « page introuvable » s'ouvrent désormais sur la marque JustDummies, pour qu'on sache clairement quel site on visite, au lieu d'un simple message « Page not found ».
- L'illustration des pages « page introuvable » occupe désormais toute la largeur de la page, au lieu d'une petite vignette.
- L'espacement entre le nom JustDummies et son slogan est désormais identique sur chaque page, au lieu de varier entre la page d'accueil et le reste du site.

### 🐛 Corrections
- Un exemple de code du playground s'écrit désormais `Any.Order()`, conformément au style de nommage utilisé dans le reste du parcours.

## release/2026-08-12T21-42-23Z — 12 août 2026

_Une page /version montre ce qui est réellement en ligne, et la page 404 reçoit sa propre illustration._

### ✨ Nouveautés
- Ajout d'une page /version montrant la release, le commit et l'heure de build actuels du site.
- Ajout d'une illustration personnalisée à l'écran « page introuvable ».

## release/2026-08-12T20-33-58Z — 12 août 2026

_Des icônes plus légères à charger, et un bouton de code qui peut de nouveau se replier._

### 🙌 Améliorations
- Réduit sensiblement la taille des images d'icône du site, pour un chargement plus rapide de la page.

### 🐛 Corrections
- Corrigé le bouton « afficher le fichier complet » d'un exemple de code, qui ne pouvait plus se replier une fois déplié.

## release/2026-08-12T14-59-33Z — 12 août 2026

_Un exemple de code peut désormais s'étendre jusqu'à son fichier généré complet, et le texte français se lit plus naturellement._

### ✨ Nouveautés
- Ajout d'une option pour déplier un exemple de code et voir le fichier généré dans son intégralité, plutôt qu'un simple extrait.

### 🙌 Améliorations
- Réécrit le texte français de la page dans un langage plus simple et plus naturel.

## release/2026-08-12T13-50-58Z — 12 août 2026

_Les exemples de code reçoivent une coloration syntaxique et un panneau montrant l'échec de test réel qu'ils produisent._

### ✨ Nouveautés
- Ajout de la coloration syntaxique dans les exemples de code (mots-clés, types, chaînes, nombres).
- Ajout d'un panneau sous un exemple de code montrant l'échec de test réel qu'il produit.

### 🙌 Améliorations
- Mise à jour d'une figure pour montrer côte à côte les versions avant et après d'un changement de code.
- Retravaillé plusieurs titres de section et passages explicatifs pour plus de clarté.

### 🐛 Corrections
- Corrigé une barre de défilement horizontale apparaissant sur certains écrans de bureau.

## release/2026-08-12T11-43-07Z — 12 août 2026

_Une passe de mise en page et de formulation sur la page d'accueil, et un exemple de code qui compile enfin._

### 🙌 Améliorations
- Placé le lien de chaque package juste à côté de son nom, pour un accès plus direct.
- Corrigé une barre de défilement horizontale apparaissant à certaines largeurs d'écran.
- Corrigé un espacement inégal du premier écran, désormais équilibré.
- Mis à jour le slogan du site.
- Simplifié un exemple de code en un seul bloc, plus net.
- Élargi la colonne de texte pour que les paragraphes ne paraissent plus à l'étroit à côté des titres pleine largeur.
- Réécrit deux sections du tutoriel dans un langage plus simple, et réordonné l'une d'elles pour rassurer avant de montrer un test qui échoue.

### 🐛 Corrections
- Corrigé un exemple de code référençant le mauvais espace de noms et qui ne compilait pas.

## release/2026-08-12T10-05-28Z — 12 août 2026

_La première section du tutoriel se reconstruit étape par étape, et plusieurs petites aspérités d'interaction sont lissées._

### 🙌 Améliorations
- Retravaillé la première section du tutoriel pour construire son exemple de code étape par étape.
- Retiré la numérotation des « actes » au profit d'un intitulé de navigation plus simple.
- Corrigé des titres de section qui se repliaient maladroitement, et uniformisé l'ombrage de fond à chaque rupture de section.
- Adouci l'animation de défilement déclenchée par la flèche vers le bas.
- Le menu de langue se ferme désormais au clic ailleurs ou à la touche Échap.
- Regroupé les instructions d'installation par outil plutôt que par package, pour que toutes les commandes d'un même outil apparaissent ensemble.

### 🐛 Corrections
- Corrigé plusieurs endroits où des symboles de mise en forme markdown s'affichaient comme du texte brut au lieu d'être interprétés.

## release/2026-08-12T08-54-47Z — 12 août 2026

_Un sélecteur de langue arrive, et le texte de la page d'accueil est réécrit dans son ensemble, dans les deux langues._

### ✨ Nouveautés
- Ajout d'un sélecteur de langue permettant de basculer entre l'anglais et le français.

### 🙌 Améliorations
- Réécrit le texte du site dans son ensemble, en anglais comme en français, pour une voix plus claire et plus naturelle.
- Le contenu se révèle désormais par étapes au défilement plutôt que de tout charger d'un coup, ce qui rend la page nettement plus courte à l'écran.

## release/2026-08-12T02-20-31Z — 12 août 2026

_La toute première version publique du site : un récit bilingue sur la page d'accueil, une démo en direct dans le navigateur, et l'icône propre à la bibliothèque._

### ✨ Nouveautés
- Le site existe désormais en anglais et en français, avec un contenu, des métadonnées et une navigation équivalents dans les deux langues.
- Un récit en trois actes sur la page d'accueil parcourt la bibliothèque — déclarer une valeur contrainte, en générer une automatiquement, puis reproduire un test en échec à partir de sa graine — avec de vrais résultats générés plutôt que des exemples écrits à la main.
- Un module interactif en tête de page permet aux visiteurs d'exécuter la bibliothèque directement dans leur navigateur et de tirer de nouvelles valeurs en direct, à la demande.
- Une commande d'installation copiable sur la page d'accueil.
- Le site a désormais sa propre icône, affichée de façon cohérente sur la page d'accueil et dans le playground.

### 🙌 Améliorations
- Retravaillé le premier écran : il s'ouvre désormais comme une scène à part entière en pleine hauteur, l'exemple de code occupe toute la largeur et se transforme visuellement scène après scène au défilement, et la commande d'installation est passée derrière des onglets avec un lien séparé vers NuGet.
- Réduit une bonne partie du texte du récit et retiré une mention interne « en construction » qui restait visible sur la page publique.

### 🐛 Corrections
- Corrigé un défaut de mise en page qui faisait défiler la page d'accueil horizontalement sur les écrans de téléphone étroits.
- Corrigé une barre de défilement parasite apparaissant parfois dans la démo en direct au redimensionnement de la fenêtre.
- Corrigé les onglets de la commande d'installation, qui apparaissaient brièvement, non fonctionnels, avant que le script de la page ait fini de charger.
