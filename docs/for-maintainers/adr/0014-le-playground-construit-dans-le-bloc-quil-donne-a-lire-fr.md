# ADR-0014 | Le playground construit dans le bloc qu'il donne à lire

🌍 🇬🇧 [English](0014-the-playground-builds-inside-the-card-it-reads-en.md) · 🇫🇷 Français (ce fichier)

**Statut :** Acceptée — remplacée en partie par
[ADR-0022](0022-une-etape-se-fige-quand-elle-est-choisie-pas-quand-le-focus-part-fr.md)
**Proposée :** 2026-08-17
**Acceptée :** 2026-08-17
**Décideurs :** Reefact

> **Ce que l'ADR-0022 a remplacé, et ce qu'elle n'a pas touché.** La moitié qui est partie est la
> condition figurant dans *Risques* ci-dessous — *le `<select>` d'une étape en cours de choix
> survit tant qu'il a le focus* — qui protégeait l'utilisateur au clavier parcourant la liste des
> options en faisant attendre à tous les autres visiteurs un clic sans rapport avant que leur étape
> ne devienne du code. Le risque qu'elle nommait est toujours honoré, par une règle qui nomme le
> parcours lui-même au lieu d'en tenir lieu. La moitié qui tient est celle pour laquelle cet
> enregistrement a été écrit : la chaîne se construit dans le bloc qu'il donne à lire, et une étape
> choisie y est dessinée comme du C# et non comme un contrôle de formulaire.

## Contexte

La page d'accueil s'ouvre sur un bloc de code (spécification §9.8) : un cadre contenant une
expression réelle, un bandeau en dessous portant la valeur que cette expression a réellement
produite, et sous ce bandeau une rangée proposant d'exécuter la bibliothèque ici même. Presser cette
proposition remplace le bloc statique par un bloc vivant — le même, dessiné par l'application
playground à sa route `/hero`, les arguments de l'expression devenus des champs éditables. C'est la
première chose qu'un visiteur voit, et la forme qu'il emporte vers ce qu'il ouvre ensuite.

Le playground est ce qu'il ouvre ensuite. Jusqu'à cet enregistrement, il présentait l'idée centrale
du même produit sous une forme sans rapport : une colonne de `<select>` encadrés, un par étape,
chacun suivi de sa documentation en paragraphe de prose, et — sous la colonne — un bandeau distinct
imprimant en une seule ligne de C# la chaîne à laquelle ces contrôles aboutissaient, un bouton de
copie à sa droite. La chaîne était donc à l'écran deux fois, une fois en contrôles et une fois en
texte ; les contrôles étaient ce dans quoi le visiteur travaillait, le texte la seule forme qui
compilait, et aucune des deux n'était le bloc que la page d'accueil venait de montrer.

Les deux surfaces étaient par ailleurs dessinées selon des règles sans rapport. Le site donne à la
prose une mesure courte et laisse une figure prendre toute la largeur — sa propre page d'accueil
arrête son sous-titre bien avant la mesure et laisse l'expression en dessous courir toute la
largeur — tandis que le playground plaçait tout ce qu'il avait, figure comprise, dans la colonne
étroite où vit sa prose. Rien dans l'une des deux applications ne renvoyait à l'autre, et aucun
contrôle ne les comparait.

La spécification contraint ce qui peut être fait à ce sujet :

* **§10.2** — le visiteur doit pouvoir choisir une expression, générer une valeur, modifier une
  contrainte, régénérer immédiatement, copier le code complet, et comprendre une erreur sans rien
  savoir du parser ;
* **§11.5** — un contrôle est un contrôle natif, jamais un widget maison ;
* **§5.7** — il n'y a pas de survol sur un téléphone, donc rien ne peut n'être atteignable qu'en
  pointant dessus ;
* **§9.9** — un refus émis par la bibliothèque n'est jamais neutralisé ;
* **§13.4** — WCAG 2.2 AA dans toutes les locales : messages d'erreur associés à la zone qui les
  provoque, aucun contenu transmis par la seule couleur, navigation clavier complète.

Deux faits sur le builder tel qu'il était pèsent sur ce qu'un changement peut coûter. Choisir une
autre méthode pour une étape écartait déjà toutes les étapes suivantes, parce qu'une chaîne est
typée et que ce qui suit une étape peut ne plus exister une fois cette étape changée — « modifier
cette étape » n'a donc jamais été une édition locale. Et un `<select>` natif fermé émet son
événement de changement à chaque appui sur une flèche : un utilisateur au clavier qui parcourt ses
options les valide donc une à une.

## Décision

Le playground construit sa chaîne à l'intérieur du même bloc de code que celui sur lequel s'ouvre la
page d'accueil, chaque étape choisie y étant dessinée comme du C# et non comme un contrôle de
formulaire.

## Justification

Un visiteur arrive au playground depuis un bloc. Y rencontrer une forme sans rapport coûte au
produit la seule chose que le bloc de §9.8 a été construit pour acheter — le sentiment que la page
d'accueil et l'application derrière elle sont une même chose — et le lui coûte au moment précis où
le visiteur a décidé d'aller voir plus loin. Le bloc est ce que les deux surfaces doivent partager,
et le partager, c'est cette décision.

Une fois le builder devenu un bloc, le bandeau en dessous cesse d'être un second rendu de la même
chose et devient une zone de la carte avec un rôle propre. Le bloc porte la chaîne telle qu'elle se
construit — arguments en champs, résumés en commentaires, répartie sur autant de lignes qu'il faut.
Le bandeau en dessous porte la même chaîne sous la forme de l'unique ligne qui compile, sans
commentaires et avec chaque argument réémis en littéral C# véritable. Ce sont deux chaînes de
caractères différentes, délibérément, et le visiteur a besoin des deux : l'une pour travailler,
l'autre pour emporter.

Cette répartition décide où va le contrôle de copie, et la réponse n'est pas le coin du bloc. Un
contrôle dont toute la promesse est *vous obtenez exactement ce que vous voyez* doit être posé sur
ce qui le montre ; sur le bloc, il était posé sur la seule chose qui montrait autre chose. Sur le
bandeau la promesse est littérale, et elle l'est par construction plutôt que par soin — le bandeau
et le presse-papiers sont dessinés depuis une même liste de fragments, ils ne peuvent donc pas dire
deux choses différentes.

Un bandeau qui prétend porter la ligne qui compile doit pouvoir refuser. Un argument que le site n'a
pas su analyser n'a aucune forme littérale : il n'y a rien à écrire à sa place et la ligne n'existe
pas — le plus souvent pendant qu'une étape fraîchement choisie a encore ses arguments vides, état
par lequel toute chaîne passe. Le bandeau le dit, et le contrôle de copie s'éteint à côté de la
phrase qui le dit, plutôt que d'imprimer une ligne trouée et de proposer de la remettre. Un refus
émis par la bibliothèque n'est pas ce cas et ne doit pas être traité comme tel : cette ligne-là
compile et lève, ce qui est la démonstration même — elle continue donc de s'imprimer et reste
copiable, et la coller reproduit le refus, ce qui est la chose la plus utile qu'elle puisse faire.

Dessiner une étape choisie comme du code plutôt que comme un contrôle est ce qui rend le bloc
lisible, et c'est abordable en raison d'un fait déjà vrai : choisir une autre méthode écartait de
toute façon le reste de la chaîne. Ce que le visiteur perd est un geste — une étape se supprime et
se rechoisit au lieu de se re-sélectionner — et non une capacité, puisque l'état auquel il arrive
est celui auquel il est toujours arrivé. Le `<select>` demeure, natif, sur la seule étape encore en
train d'être choisie, ce qui est exactement là où la règle de §11.5 mord : c'est le seul endroit où
quelque chose est encore demandé.

La documentation devient un commentaire pour la raison qui a fait du reste du code. Un résumé tiré
de la documentation XML de la bibliothèque, c'est la bibliothèque qui se documente elle-même, et un
commentaire est là où un lecteur de C# cherche déjà cela — sans rien coûter au bloc, puisqu'un
commentaire est précisément ce que l'œil saute quand il veut le code. Il reste dans le flux plutôt
que derrière un survol, ce que §5.7 exige de lui.

Les erreurs sont le seul endroit où un traitement unique aurait été faux, parce que le builder porte
deux échecs qui ne sont pas de même nature. Un argument que le site lui-même n'a pas su analyser,
c'est le texte du site à propos d'une valeur en train d'être saisie : il se déclenche à la frappe,
c'est un garde-fou et non un résultat, et le replier derrière un marqueur sur l'étape garde le bloc
lisible pendant qu'on le remplit. Un refus émis par la bibliothèque est l'inverse — §9.9 l'appelle
la démonstration qui se défend elle-même — et un message que personne ne voit tant qu'il n'a pas
pressé le contrôle qui le révèle est neutralisé de toutes les manières qui comptent. Le refus est
donc imprimé sous le bloc, dans le bandeau où se trouverait autrement une valeur tirée, exactement
comme le widget de la page d'accueil imprime celui qu'il reçoit, et le marqueur sur l'étape ne dit
plus que de quelle étape il s'agit. §13.4 est servi dans les deux cas : l'étape fautive porte une
marque visible, cette marque est un glyphe et pas seulement une couleur, et le message est rattaché
au champ fautif que quoi que ce soit ait été pressé ou non.

Enfin, les deux blocs partagent une déclaration unique plutôt que deux déclarations concordantes.
Deux copies d'un bloc, c'est ainsi que les deux surfaces en sont venues à diverger : rien dans l'un
des deux fichiers ne mentionnait l'autre, donc rien ne l'a remarqué. Déclaré une fois, tout ce qui
est à l'intérieur du bloc est égal par construction, et la seule affirmation qui reste à vérifier
est celle qu'une déclaration partagée ne peut pas porter — la largeur à laquelle le bloc finit sur
la page où il est, que deux documents distincts dans deux runtimes distincts décident séparément.

## Alternatives considérées

### Restyler le bandeau imprimé et laisser le builder en formulaire

Le plus petit changement disponible, et le seul qui ne modifie aucune interaction : le bandeau sous
le builder aurait pu recevoir le cadre, le fond et le bandeau de résultat du bloc, et rester là.

Rejetée parce qu'elle habille la mauvaise moitié. Le bandeau prendrait le bloc de la page d'accueil
tandis que la colonne au-dessus — la surface dans laquelle le visiteur travaille réellement —
resterait une pile de contrôles de formulaire : la forme qu'il reconnaît serait celle qu'il ne peut
pas toucher, et celle dont il se sert ne ressemblerait à rien. Deux rendus d'une chaîne ne sont pas
le problème, et la décision prise ici en conserve deux délibérément ; lequel des deux est le bloc,
voilà le problème.

### Garder une combo éditable sur chaque étape choisie, habillée en code

Considérée parce qu'elle préserve la seule chose que cette décision abandonne : changer la méthode
d'une étape en un seul geste, sans la supprimer d'abord.

Rejetée pour deux raisons. Un contrôle qui se lit comme du code et se comporte comme un formulaire
est pire que l'un ou l'autre — le visiteur ne peut plus dire lesquelles des choses du bloc il peut
cliquer, ce qui est exactement la confusion à laquelle le bloc doit mettre fin. Et le geste préservé
n'a jamais été le geste bon marché qu'il paraissait : il écartait déjà toutes les étapes suivant
celle qu'on changeait, si bien que le geste unique n'achetait pas plus au visiteur que les deux.

### Replier toutes les erreurs, refus de la bibliothèque compris, derrière le marqueur

Considérée parce que c'est le bloc le plus net : il reste du code et la prose n'apparaît que sur
demande, et elle traite les deux échecs uniformément plutôt que de demander au lecteur d'apprendre
une distinction.

Rejetée parce que §9.9 l'interdit précisément. Le refus est l'argument le plus fort que le produit
avance — la bibliothèque déclinant une déclaration contradictoire, dans ses propres mots, au moment
où elle est déclarée — et une page qui le cache pour rester nette a supprimé sa meilleure preuve. La
distinction que le lecteur doit apprendre est réelle : l'un des deux messages est ce site parlant
d'une frappe au clavier, l'autre est la bibliothèque parlant du code.

### Copier les règles du bloc du hero dans un bloc propre au playground

Considérée parce qu'elle ne change rien à la page d'accueil, et qu'un changement qui ne peut pas
atteindre le premier écran est un changement qui ne peut pas le casser.

Rejetée parce qu'elle reproduit la cause au lieu de l'effet. Les deux surfaces divergeaient parce
que chacune déclarait ses propres formes sans renvoyer à l'autre ; une seconde copie mettrait les
deux blocs à une modification de la divergence, et cette modification resterait invisible jusqu'à ce
que quelqu'un regarde les deux pages côte à côte.

## Conséquences

### Positives

* La chaîne est à l'écran sous la forme que le visiteur a déjà rencontrée sur la page d'accueil, et
  la ligne qu'il peut coller est imprimée en dessous plutôt qu'assemblée hors de sa vue.
* Tout ce qui est à l'intérieur des deux blocs est égal parce que c'est déclaré une fois, et non
  parce que deux fichiers concordent pour l'instant.
* La documentation se trouve là où un lecteur de C# la cherche, sans survol et sans disputer au code
  l'attention du lecteur.
* Le contrôle de copie est posé sur ce qu'il copie, et les deux ne peuvent pas diverger.

### Négatives

* Changer la méthode d'une étape choisie demande deux gestes au lieu d'un.
* Le bloc est plus haut que la chaîne seule : chaque étape choisie porte son résumé en commentaire
  de fin de ligne, qui se poursuit sur la ligne de l'étape là où il tient et prend une ligne propre
  là où il ne tient pas.
* La carte a trois zones là où celle de la page d'accueil en a deux. Elles restent la même carte —
  tout ce que les deux partagent est déclaré une fois — mais celle du playground est plus haute
  d'un bandeau.
* La chaîne est à l'écran sous deux formes, celle du bloc et celle du bandeau, qui diffèrent
  caractère pour caractère. Plusieurs types d'argument n'ont aucun littéral nu en C# : le bloc
  montre donc la valeur saisie entre guillemets tandis que la ligne qui compile porte un appel
  d'analyse plusieurs fois plus long. C'est le prix d'un bloc éditable et d'un bandeau copiable à
  la fois ; ce qui le rend supportable est que les deux sont visibles, côte à côte, plutôt que
  l'un une réinterprétation cachée de l'autre.

### Risques

* Le `<select>` d'une étape en cours de choix doit survivre tant qu'il a le focus, sinon un
  utilisateur au clavier ne peut pas dépasser sa première option — le contrôle valide à chaque appui
  sur une flèche, et un contrôle qui disparaîtrait à la première validation rendrait l'essentiel du
  catalogue inatteignable sans pointeur. La suite navigateur exécute un parcours clavier complet à
  travers une étape pour tenir cela.
* Une longue chaîne est une longue colonne de commentaires. Rien ne la plafonne aujourd'hui ; si
  cela devient la plainte, la réponse est une règle sur les résumés affichés, pas un retour au
  survol.

## Actions de suivi

* `tests/browser/code-card-parity.spec.ts` est ce qui échoue quand cette décision est cassée du côté
  mise en page : il charge les deux documents à un même viewport et compare la largeur du bloc, la
  distance entre le bloc et le bouton en dessous, la boîte du bouton lui-même, et le fond sur lequel
  les deux blocs sont dessinés. Vérifié en replaçant le bloc du playground dans la colonne de prose
  où il se trouvait, en regardant la comparaison de largeur passer au rouge, puis en le remettant.
* `tests/browser/playground.spec.ts` est ce qui échoue quand elle est cassée du côté comportement :
  une étape choisie qui garderait sa combo, un résumé qui cesserait d'être un commentaire, un refus
  qui cesserait d'être imprimé sous le bloc, ou un marqueur qui cesserait d'ouvrir et de fermer son
  message échouent chacun à un contrôle propre.
* Aucun de ces contrôles ne peut voir une colonne de commentaires devenue illisible. Celle-là est
  laissée à la relecture.

## Références

* `docs/design/specification.md` §5.7, §9.8, §9.9, §10.2, §11.5, §13.4
* [ADR-0003](0003-la-figure-porte-la-scene-fr.md) — la règle du site voulant qu'une figure prenne la
  mesure plutôt que la colonne de prose, que le bloc du playground suit désormais aussi
* [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md) — le même raisonnement appliqué au
  contrôle de copie, proposé seulement tant qu'il existe une chaîne qui compile
* [ADR-0009](0009-les-controles-navigateur-sont-pilotes-par-playwright-fr.md) — pourquoi les
  contrôles nommés ci-dessus s'exécutent dans un navigateur contre l'artefact publié
