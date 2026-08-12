# ADR-0003 | La figure porte la scène

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0003-the-figure-carries-the-scene-en.md)

**Statut :** Accepté — remplacé en partie par
[ADR-0005](0005-une-scene-arrive-au-lieu-doccuper-lecran-fr.md)
**Proposé le :** 2026-08-12
**Accepté le :** 2026-08-12
**Décideurs :** Reefact

> **Ce que l'ADR-0005 a remplacé, et ce qu'il n'a pas touché.** La moitié qui disparaît est *une
> scène occupe l'écran* — `min-height: 100vh` —, qui achetait la sensation d'avancer au prix d'un
> écran de fond vide entre chaque paire de blocs de code. La moitié qui demeure est celle pour
> laquelle cet enregistrement a été écrit : une figure en pleine largeur, sous son propre titre,
> avec le commentaire en dessous.

## Contexte

La spécification décrit la narration comme une séquence au défilement, avec des panneaux adhérents
et le même code qui se transforme à mesure que le lecteur avance (§9.1). Deux mises en page ont été
construites contre cette description à une heure d'intervalle, et la seconde a remplacé la première.

La première plaçait la prose de chaque scène dans une colonne de gauche et sa figure dans une
colonne de droite, puis élevait les figures d'un acte dans un panneau adhérent unique, piloté par
la scène qui traversait le milieu de l'écran. Elle fonctionnait comme prévu et a produit deux
défauts sur la page déployée :

- un bloc de code dans une demi-mesure réclame une barre de défilement horizontale. Plusieurs
  figures publiées sont plus larges qu'une demi-page : le plus long snippet fait 78 caractères, et
  les deux terminaux enregistrés 128 et 130 ;
- et une figure posée à côté de sa prose doit être appariée à l'œil. Une scène assez courte pour
  partager l'écran avec trois autres fait rater cet appariement — une capture d'écran remontée
  montre le titre « Déclarez les contraintes » à côté du `new Order(...)` appartenant à la scène
  trois plus bas. Le panneau montrait la scène qui traversait le milieu de l'écran, laquelle
  n'était pas celle que le lecteur regardait.

Le second défaut est celui qui compte. Ce n'est pas un problème de réglage : toute mise en page qui
pose une figure à côté d'une prose, dans une page où plusieurs scènes tiennent sur un écran, laisse
au lecteur le soin de deviner quelle figure va avec quels mots.

## Décision

**Une scène est une figure en pleine largeur, sous son propre titre, avec le commentaire en
dessous. Une scène tient l'écran.**

Pas de panneau adhérent, pas de seconde colonne, aucun script dans la mise en page.

## Justification

Sous son propre titre, il n'y a plus rien à apparier. Le lien entre une figure et les mots qui en
parlent cesse d'être quelque chose que le lecteur déduit d'une position pour devenir quelque chose
que le document énonce.

La pleine mesure supprime la barre de défilement au lieu de la gérer : toutes les figures publiées
tiennent en travers de la page, et aucune ne tient en travers de la moitié.

Ce à quoi servait le panneau adhérent survit, et pour moins cher. Une scène qui tient l'écran pose
sa figure à peu près au même endroit d'une scène à l'autre — mesuré entre 261 px et 384 px sur les
six scènes du premier acte — de sorte que le défilement se lit comme le même code qui change plutôt
que comme un nouveau bloc qui arrive. C'est la transformation continue de §9.1, obtenue par la mise
en page plutôt que par un script.

Et cela ramène les quatre constructions de §9.7 à une seule. Le panneau exigeait un script, une
largeur d'écran et une préférence de mouvement, et il sortait les figures de la position, dans le
document, où vit leur prose. Celle-ci n'exige rien de tout cela : desktop, mobile, mouvement réduit
et sans JavaScript rendent le même document, et la seule chose que le script ajoute encore est le
repère disant sur quelle scène se trouve le lecteur.

## Alternatives envisagées

### Garder le panneau et élargir sa colonne

Envisagée parce que c'est le plus petit changement et qu'elle préserve la lecture en panneau
adhérent de la spécification. Rejetée parce qu'elle ne traite que la barre de défilement : le défaut
d'appariement survit intact, et c'est le pire des deux.

### Garder le panneau et rendre chaque scène plus haute, pour qu'une seule soit jamais à l'écran

Envisagée parce qu'elle corrige l'appariement tout en gardant le mécanisme. Rejetée parce qu'elle
corrige l'appariement en rendant le panneau superflu — si une scène remplit l'écran, sa figure n'a
nulle part ailleurs où être — et qu'il ne reste alors qu'un script, une largeur d'écran et une
préférence de mouvement qui ne paient plus rien.

### Garder les deux colonnes et rétrécir les terminaux

Envisagée parce qu'elle ferait tenir les figures dans la demi-mesure et laisserait la mise en page
telle qu'elle était conçue. Rejetée parce que la largeur du récapitulatif n'est pas décorative : les
deux mots qui rendent cette scène digne d'être montrée — `unread guards` — sont à la fin de sa plus
longue ligne. La rétrécir masque l'intérêt de la scène.

## Conséquences

### Positives

Le lien entre une figure et les mots qui la commentent est énoncé par le document au lieu d'être
déduit de la position : il ne peut donc plus être faussé par une scène courte ou un écran haut.

Chaque figure publiée tient dans la largeur de la page, si bien qu'aucune scène ne réclame de barre
de défilement horizontale.

Quatre rendus se réduisent à un : bureau, mobile, mouvement réduit et sans JavaScript affichent le
même document, et la seule chose que le script ajoute encore est le repère disant sur quelle scène
se trouve le lecteur.

### Négatives

La page est bien plus longue. C'est voulu — le défilement fait avancer l'histoire au lieu de faire
glisser un document — mais c'est un coût réel pour un lecteur qui voulait parcourir.

La variante de scène `wide` disparaît. Elle existait pour que deux figures puissent occuper la
pleine mesure pendant que les autres restaient en colonne, et il ne reste plus de colonne dont elle
serait l'exception.

Le commentaire réclame une mesure de lecture qui lui est propre plutôt que d'hériter de la largeur
de la figure : deux largeurs coexistent donc désormais au sein d'une même scène.

### Risques

Une figure plus large que la mesure ramènerait la barre de défilement, en silence, dans une seule
scène. Le garde-fou est la vérification de largeur de `check-narrative.sh` ; la marge est nulle
aujourd'hui, la figure publiée la plus large faisant exactement les 130 caractères que la mesure
accepte.

Le *scroll snapping* n'est **pas** adopté, et l'adopter plus tard serait une nouvelle décision
plutôt qu'un réglage : il s'applique au scroller racine, ce qui ferait aussi snapper le hero.

## Actions de suivi

- `scripts/check-narrative.sh` vérifie les deux propriétés sur lesquelles cette décision repose :
  aucune figure publiée ne dépasse la largeur que la mesure accepte, et chaque figure se trouve
  sous son propre titre. Il s'exécute dans le build.

## Références

- Spécification §9.1 (technologie narrative), §9.7 (ce que coûte une scène), §5.3 (le mouvement
  doit expliquer)
- La mise en page que celle-ci remplace, et le raisonnement qui l'avait produite, sont dans la
  pull request qui l'a introduite
