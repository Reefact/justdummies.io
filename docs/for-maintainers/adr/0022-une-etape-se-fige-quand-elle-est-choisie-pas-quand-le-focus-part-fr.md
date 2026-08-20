# ADR-0022 | Une étape se fige quand elle est choisie, pas quand le focus la quitte

🌍 🇬🇧 [English](0022-a-step-settles-when-it-is-chosen-not-when-focus-leaves-en.md) · 🇫🇷 Français (ce fichier)

**Statut :** Acceptée
**Proposée :** 2026-08-20
**Acceptée :** 2026-08-20
**Décideurs :** Reefact

## Contexte

L'[ADR-0014](0014-le-playground-construit-dans-le-bloc-quil-donne-a-lire-fr.md) a décidé que le
playground construit sa chaîne à l'intérieur du bloc de code qu'il donne à lire, chaque étape
choisie y étant dessinée comme du C# et non comme un contrôle de formulaire : une étape est une
combo tant qu'aucune méthode n'est choisie, et du code ensuite. Sa section *Risques* attachait une
condition à ce dessin — le `<select>` d'une étape en cours de choix doit survivre tant qu'il a le
focus, sinon un utilisateur au clavier ne peut pas dépasser sa première option — et ses *Actions de
suivi* ont mis un parcours clavier complet à travers une étape dans la suite navigateur pour la
tenir.

Cette condition découle d'un fait de plateforme. Un `<select>` natif fermé émet son événement de
changement à chaque appui sur une flèche : un utilisateur au clavier qui parcourt la liste valide
donc chaque entrée l'une après l'autre en chemin vers celle qu'il veut. Vérifié dans le navigateur
que la suite fait tourner, et non supposé : le premier appui donne une méthode à l'étape alors que
le contrôle est toujours là, et le second atteint la deuxième entrée. La recherche par frappe — un
caractère imprimable seul, qu'un select natif utilise pour sauter à la première entrée qui commence
par lui — émet le même événement, et appartient donc au même parcours.

Entrée est ce même parcours mené à son terme, et la plateforme ne donne presque rien à la page pour
l'entendre. Puisque la valeur a déjà bougé à chaque appui sur une flèche, la touche qui veut dire
*celle-ci* n'émet aucun événement de changement — il ne reste rien à changer — et Chromium ne
délivre pas non plus de relâchement de touche pour elle sur ce contrôle. L'appui est tout ce qu'il
y a. Mesuré dans le même navigateur et sur le même bloc que les faits ci-dessus, non supposé.

Le focus est un fait différent. Une visiteuse qui valide depuis la liste déroulante laisse le focus
sur le contrôle : le navigateur n'a aucune raison de le déplacer, et rien d'autre sur le bloc ne le
réclame. Sous la condition de focus, cette visiteuse continuait de regarder une combo jusqu'à ce
qu'un clic ultérieur et sans rapport vienne la sortir du focus. Rien sur le bloc ne demandait ce
clic et rien ne disait à quoi il servait. C'est le défaut signalé sur le playground déployé, et
c'est le cas ordinaire : le pointeur est la façon dont la plupart des visiteurs atteignent ce
contrôle.

Les deux populations n'ont pas la même taille, et le dépôt a déjà pris position sur cette
asymétrie. La spécification §13.4 exige une navigation clavier complète dans toutes les locales,
au niveau WCAG 2.2 AA, et le parcours clavier ajouté par l'ADR-0014 est un contrôle permanent et
non une hypothèse. §5.7 refuse tout ce qui n'est atteignable que par un geste que la page n'a
jamais annoncé. §10.2 est ce à quoi le bloc sert : la visiteuse construit une chaîne, étape après
étape.

La plateforme sépare les deux gestes là où l'événement de changement les confond. Une frappe est
délivrée avant le changement qu'elle provoque, et un appui de pointeur avant le changement qu'il
provoque ; un événement de changement sans ni l'un ni l'autre devant lui ne vient pas d'une
visiteuse.

Figer une étape retire le contrôle sur lequel la visiteuse se tient. Si rien ne rattrape le focus
qu'elle lâche, le navigateur le rend au corps du document et le Tab suivant repart du haut de la
page. `Home.razor` porte déjà un mécanisme contre exactement cela, écrit pour la suppression, qui
retire des contrôles de la même façon.

## Décision

Une étape choisie se fige en code au moment où le choix est fait plutôt qu'au moment où son
`<select>` perd le focus, la combo ne survivant que tant que la visiteuse parcourt encore la liste
des options.

## Justification

**La condition de focus était un intermédiaire, et le mauvais.** Ce qu'un utilisateur au clavier a
besoin de voir protégé, c'est le parcours — la série de validations non voulues entre l'ouverture
de la liste et l'arrêt sur une entrée. Le focus survit à ce parcours pour un utilisateur au
pointeur, qui a cessé de parcourir dès que la liste déroulante s'est refermée : la condition
facturait donc le problème du clavier à tous les autres. Remplacer l'intermédiaire par ce qu'il
représentait ne coûte rien au clavier — le parcours dure exactement aussi longtemps qu'avant, et la
liste se dépasse à la flèche exactement comme avant.

**Les gestes sont séparables à partir de faits déjà énoncés.** Ce qui précède un événement de
changement dit quel geste l'a produit, de sorte que l'étape n'a plus à déduire une réponse d'un
état qui veut dire deux choses à la fois. C'est l'argument qui rend cette décision disponible ;
sans lui, le seul choix serait entre le défaut du clavier et celui du pointeur.

**Une étape qui reste un contrôle après avoir été choisie contredit l'ADR-0014 tout en ayant l'air
de l'honorer.** La décision de cet enregistrement est qu'une étape choisie est du code, et le bloc
est dessiné comme si elle l'était. Une visiteuse ne peut pas apprendre le geste manquant, puisque
le bloc n'en parle jamais — ce que §5.7 refuse. Le défaut n'est pas que la transformation soit
tardive ; c'est que la règle qui la gouverne est inénonçable à la personne qu'elle gouverne.

**Le focus que la transformation emporte doit aller quelque part, et ce quelque part n'est pas
libre.** Le laisser retomber sur le corps du document, c'est la renavigation depuis le haut que le
chemin de suppression existe déjà pour empêcher, et c'est la navigation clavier complète de §13.4
que cette prévention sert. Le premier argument, quand l'étape en a un, est là où la visiteuse
allait écrire ; l'étape que le choix ouvre, quand elle n'en a pas, est le seul contrôle qui
n'existait pas l'instant d'avant. Les deux sont la suite au sens de §10.2, et aucun des deux ne
déplace un focus qui avait où rester.

## Alternatives envisagées

### Figer l'étape à chaque changement émis par le `<select>`

Le correctif entier en une ligne, et ce qu'un lecteur attend naturellement du contrôle : un
événement nommé *change* signale un changement.

Écartée parce que, sur les plateformes où le contrôle fermé valide à chaque appui sur une flèche,
l'étape se figerait au premier d'entre eux et la liste ne pourrait jamais être dépassée à la
flèche. La part atteignable du catalogue serait celle des méthodes qui se trouvent trier en
premier, et seulement pour une visiteuse munie d'un pointeur. C'est exactement l'échec que §13.4 et
le parcours clavier de l'ADR-0014 existent pour empêcher.

### Garder la condition de focus et expliquer le clic supplémentaire

Cela ne change ni comportement ni code, et ce que cela coûte à la visiteuse est un délai plutôt
qu'une capacité perdue — la réponse la moins chère possible si le défaut n'est que cosmétique.

Écartée parce que l'explication devrait dire qu'une étape choisie devient du code une fois qu'on a
cliqué sur quelque chose sans rapport, ce qui n'est ni une règle qu'une visiteuse peut retenir ni
une phrase qu'une page peut utilement imprimer. Elle laisse aussi la décision propre de l'ADR-0014
fausse tant que la visiteuse ne fait rien d'autre, et c'est cette part qui rend le défaut plus que
cosmétique.

### Remplacer le `<select>` natif par un composant sur mesure qui sépare parcours et validation

L'ambiguïté appartient au contrôle natif ; un composant écrit pour la tâche émettrait un événement
pour le parcours et un autre pour le choix, et la question ne se poserait pas.

Écartée parce que cela échange un défaut contre toute une catégorie. La position affichée du dépôt
sur cette classe de contrôle — §11.7, écrite pour le sélecteur de la page de comparaison — est un
contrôle de formulaire natif plutôt qu'un composant sur mesure au clavier approximatif, et c'est la
plateforme qui donne gratuitement à cette combo son comportement clavier, sa sémantique pour les
lecteurs d'écran et sa présentation sur un téléphone. Rien ici n'a besoin de ce composant : les
gestes sont séparables sans lui.

### Rendre le focus à l'étape figée plutôt qu'à la combo suivante

La destination la moins surprenante — la visiteuse reste sur ce qui vient de changer — et elle
garde les contrôles de suppression et de documentation de l'étape figée devant un Tab avant plutôt
que derrière lui.

Écartée parce que le bloc existe pour construire une chaîne (§10.2), et que chaque étape sans
argument coûterait alors deux frappes de plus pour dépasser ses propres contrôles avant d'atteindre
la suivante. Rien ne devient inatteignable en passant le focus en avant : les contrôles sautés
gardent leur place dans l'ordre de tabulation du document, un pas en arrière les atteint, et un
parcours de la page depuis le haut les rencontre tous. Le coût est payé une fois, par une visiteuse
qui veut revenir sur une étape ; l'alternative le facture à chaque étape de chaque chaîne.

## Conséquences

### Positives

* Une étape choisie est du code dès l'instant où elle est choisie — ce que l'ADR-0014 a décidé, et
  ce que le bloc a toujours eu l'air d'affirmer.
* Le focus se pose là où la visiteuse va ensuite, de sorte qu'une chaîne se construit sans que le
  pointeur ait à revenir sur le bloc entre deux étapes.
* La protection du clavier est désormais énoncée comme ce qu'elle est. Un lecteur du code trouve
  *la combo survit tant que la liste est parcourue* plutôt qu'une règle de focus dont il faut
  reconstruire l'objet depuis une puce de risque dans un autre document.

### Négatives

* Le dessin dépend maintenant de l'ordre dans lequel la plateforme délivre une frappe et le
  changement qu'elle provoque. Cet ordre est stable et spécifié, mais c'est une chose de plus sur
  laquelle reposer qu'un simple drapeau de focus.
* Un Tab avant depuis une étape sans argument qui vient de se figer ne rencontre plus les contrôles
  de suppression et de documentation de cette étape. On les atteint en revenant en arrière, ou par
  un parcours de la page. C'est l'échange consigné dans la dernière alternative ci-dessus, accepté
  délibérément.

### Risques

* Une plateforme où le contrôle fermé validerait à chaque appui sur une flèche *sans* délivrer la
  frappe d'abord figerait l'étape sur un parcours. Aucune n'est connue. La suite navigateur est là
  où cela se verrait, puisque le contrôle qui tient cette décision parcourt la liste avec de vraies
  frappes plutôt qu'en fixant la valeur du contrôle — une distinction qui compte, car fixer la
  valeur est précisément ce qui masquerait le défaut.
* Classer une frappe comme parcours est un jugement sur un comportement natif et non la lecture
  d'une spécification. Une touche qui parcourt une liste sur une plateforme et ne serait pas classée
  ici figerait une étape encore en cours de parcours. Ce que cela coûte est l'ancien défaut pour
  cette touche-là, pas une capacité perdue.
* Entrée doit être entendue à l'appui de la touche, puisque c'est tout ce que la plateforme envoie
  pour elle sur un contrôle fermé. Là où une liste déroulante ouverte émet bien un changement sur
  Entrée, l'étape se figera sur l'option qu'elle tenait déjà, puis de nouveau sur celle réellement
  validée. L'état final est dans les deux cas la méthode choisie par la visiteuse ; ce que cela
  coûte est un rendu que personne n'a demandé, et seulement pour une visiteuse qui a parcouru la
  liste fermée avant de l'ouvrir.

## Actions de suivi

* `tests/browser/playground.spec.ts` est ce qui échoue quand cette décision est cassée, et cela
  échoue des deux côtés. Un contrôle parcourt la liste des options avec de vraies frappes et
  affirme que l'étape gagne une méthode alors que la combo tient, que le second appui atteint une
  entrée différente, et que la recherche par frappe se comporte comme les flèches ; un autre sort
  par Tab d'une combo encore debout vers le premier argument de l'étape. Un troisième parcourt la
  liste puis appuie sur Entrée, le geste dont la plateforme dit le moins et donc celui qui se perd
  le plus facilement. Deux autres tiennent la moitié opposée : une étape paramétrée se fige sur le choix et garde le focus sur son premier
  argument, une étape sans argument se fige et le garde sur la combo qu'elle ouvre — ni l'une ni
  l'autre avec quoi que ce soit d'autre de cliqué, de sorte qu'un retour à la transformation au
  flou échoue à la ligne qui suit le choix.
* Vu échouer avant d'être cru. Avec la classification du parcours neutralisée de façon à ce que
  toute frappe se lise comme un choix, les deux contrôles clavier passent au rouge et rien d'autre
  ne bouge dans la suite ; rétablie, la suite est verte.
* L'ADR-0014 garde sa décision et perd une puce de sa section *Risques*. Son statut porte la
  supersession partielle, et un bloc sous son en-tête nomme quelle moitié est partie et laquelle
  tient.
* Aucun contrôle ne peut voir si le focus se pose là où une visiteuse trouve cela *sensé*, par
  opposition à un endroit réel et atteignable. Celui-là est laissé à la relecture, et nommé ici
  plutôt que laissé en section vide.

## Références

* [ADR-0014](0014-le-playground-construit-dans-le-bloc-quil-donne-a-lire-fr.md) — l'enregistrement
  que celui-ci remplace en partie.
* Spécification §5.7, §10.2, §11.7, §13.4.
* `apps/playground/Components/ChainLink.razor` et `apps/playground/Pages/Home.razor` — où le
  mécanisme vit, et où il est documenté.
* Pull request [#138](https://github.com/Reefact/justdummies.io/pull/138).
