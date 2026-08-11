# ADR-0003 | La figure porte la scène

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0003-the-figure-carries-the-scene-en.md)

**Statut :** Proposé
**Proposé le :** 2026-08-12
**Décideurs :** Reefact

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

**Garder le panneau et élargir sa colonne.** Cela supprime la barre de défilement et laisse le
défaut d'appariement, qui est le pire des deux.

**Garder le panneau et rendre chaque scène plus haute,** pour qu'une seule soit jamais à l'écran.
Cela corrige l'appariement en rendant le panneau superflu — si une scène remplit l'écran, sa figure
n'a nulle part ailleurs où être.

**Garder les deux colonnes et rétrécir les terminaux.** La largeur du récapitulatif n'est pas
décorative : les deux mots qui rendent cette scène digne d'être montrée — `unread guards` — sont à
la fin de sa plus longue ligne. La rétrécir masque l'intérêt de la scène.

## Conséquences

La variante de scène `wide` disparaît. Elle existait pour que deux figures puissent occuper la
pleine mesure pendant que les autres restaient en colonne ; toutes les figures ont la pleine mesure
désormais.

La page est bien plus longue, et c'est voulu : le défilement fait avancer l'histoire au lieu de
faire glisser un document.

Le commentaire garde une mesure de lecture qui lui est propre plutôt que d'hériter de la largeur de
la figure. Un paragraphe aussi large qu'un bloc de code est un paragraphe que personne ne termine.

Le *scroll snapping* n'est **pas** adopté. Les scènes pleine hauteur donnent la sensation d'avancer
sans lui, et le snap s'applique au scroller racine, ce qui ferait aussi snapper le hero.

## Actions de suivi

- `scripts/check-narrative.sh` vérifie les deux propriétés sur lesquelles cette décision repose :
  aucune figure publiée ne dépasse la largeur que la mesure accepte, et chaque figure se trouve
  sous son propre titre. Il s'exécute dans le build.

## Références

- Spécification §9.1 (technologie narrative), §9.7 (ce que coûte une scène), §5.3 (le mouvement
  doit expliquer)
- La mise en page que celle-ci remplace, et le raisonnement qui l'avait produite, sont dans la
  pull request qui l'a introduite
