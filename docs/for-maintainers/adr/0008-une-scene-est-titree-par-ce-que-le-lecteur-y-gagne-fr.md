# ADR-0008 | Une scène est titrée par ce que le lecteur y gagne, pas par le mécanisme

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0008-a-scene-is-titled-by-what-the-reader-gets-en.md)

**Statut :** Proposé
**Proposé le :** 2026-08-12
**Décideurs :** Reefact

Remplace une partie d'[ADR-0007](0007-le-troisieme-acte-repond-avant-dechouer-fr.md).

## Contexte

Les titres de scène de la narration étaient écrits de l'intérieur. Un lecteur qui descendait la
page rencontrait *Une ligne de moins*, *L'échec rend son seed*, *Cet attribut que vous avez déjà
vu* et *L'outil en plus* — quatre titres qui décrivent, correctement, ce que la mécanique fait à
cet endroit.

Lus de l'extérieur, ils ne disent presque rien. *Une ligne de moins* nomme une modification dans
un extrait de code. *L'échec rend son seed* emploie un mot qui n'a aucun sens pour un développeur
qui n'a jamais croisé le test à base de propriétés, au moment précis où la page essaie de le
rassurer. *Cet attribut que vous avez déjà vu* désigne un mécanisme et demande au lecteur de s'y
intéresser avant de lui dire pourquoi. *L'outil en plus* est une liste de courses là où le lecteur
est invité à repartir avec quelque chose.

L'[ADR-0007](0007-le-troisieme-acte-repond-avant-dechouer-fr.md) a tranché l'ordre du troisième
acte — il énonce sa proposition avant de montrer quoi que ce soit qui échoue — et l'a tranché, dans
la même phrase, en nommant l'attribut que le lecteur avait déjà vu. L'ordre était juste et n'est
pas remis en cause. L'instrument, si : nommer l'attribut, c'est encore décrire la mécanique, une
scène plus tôt.

Les titres de scène sont aussi le plan de la page. C'est ce qu'un lecteur d'écran énumère, ce que
voit un lecteur qui survole, et le seul texte dont on est certain qu'il est lu.

## Décision

**Une scène est titrée par ce que le lecteur y gagne ; le mécanisme qui le lui apporte appartient
au texte de la scène, jamais à son titre.**

## Justification

Un titre est lu par quelqu'un qui n'a pas encore décidé de lire la scène — c'est-à-dire exactement
le lecteur dont on ne peut pas supposer qu'il a le vocabulaire. *Attraper un bug avant qu'il
n'arrive en production* est une proposition que n'importe qui peut peser ; *Cet attribut que vous
avez déjà vu* réclame une confiance que la page n'a pas encore gagnée, et *L'échec rend son seed*
réclame un mot que la page n'a pas encore défini.

Cela ne rend pas les titres plus vagues. Le mécanisme reste sur la page, une ligne plus bas, là où
il y a la place de le dire correctement — le seed obtient une phrase qui explique que c'est un
numéro et ce que ce numéro fait, soit davantage que ce que son titre a jamais transmis.

Cela règle aussi la moitié d'ADR-0007 que ce compte rendu remplace. Le troisième acte répond
toujours avant d'échouer : ce qui change, c'est que la scène d'ouverture énonce le bénéfice au lieu
de désigner l'attribut. L'attribut est toujours là, dans la figure, toujours porté par chaque test
qui tire depuis le deuxième acte — le lecteur le croise, on ne lui demande simplement plus de
l'admirer.

La règle est volontairement étroite : elle gouverne les titres, pas la prose. Le texte d'une scène
est l'endroit où l'on nomme un mécanisme, et la page serait moins bonne s'il cessait de le faire.

## Alternatives envisagées

### Laisser les titres tels quels et expliquer le vocabulaire dans la prose

Envisagé parce que la prose l'explique déjà, et parce que les titres sont exacts. Écarté parce que
l'exactitude n'est pas la propriété dont un titre a besoin. Un lecteur qui survole lit les titres
et rien d'autre, et un plan fait de mécanismes lui dit de quoi la page est faite plutôt qu'à quoi
elle sert.

### Titrer chaque scène par un bénéfice, prose comprise

Envisagé comme la version cohérente de la même idée. Écarté parce que cela viderait les scènes : le
texte à côté d'une figure est l'endroit où un mécanisme a la place d'être nommé et expliqué, et une
page dont chaque phrase vend est une page qu'un développeur cesse de croire.

### Garder l'instrument d'ADR-0007 et ne reformuler que les titres les plus faibles

Envisagé parce que c'est le plus petit changement, et qu'ADR-0007 a un jour. Écarté parce que le
titre le plus faible *est* celui qu'ADR-0007 prescrivait, et que laisser le compte rendu debout en
le contredisant dans la page est la façon dont une base de décisions cesse de mériter d'être lue.

## Conséquences

### Positives

Le plan se lit comme une suite de propositions : ce que le lecteur gagne, dans l'ordre où il le
gagne. C'est l'argument même de la page, que le plan précédent ne portait pas.

L'ouverture du troisième acte ne dépend plus de ce qu'un lecteur ait remarqué un attribut deux
actes plus tôt — une dépendance qui a toujours été optimiste.

Le mot « seed » est expliqué là où il est introduit, au lieu d'apparaître d'abord dans un titre.

### Négatives

**Cela remplace la moitié d'une décision ratifiée la veille.** L'ADR-0007 a un jour et sa seconde
proposition est déjà remplacée ; un lecteur de la base trouvera deux comptes rendus sur le même
acte, dont le premier n'a plus qu'une phrase de Décision à moitié vraie.

Un titre qui vend est un titre qui peut survendre, et cette règle pousse dans ce sens à chaque
scène. Rien ici ne confronte la promesse d'un titre à ce que la scène montre.

### Risques

« Ce que le lecteur y gagne » est un jugement, et deux personnes placeront la limite différemment —
*Le test qui échoue vous dit comment le rejouer* est un bénéfice énoncé mécaniquement, et se
défend dans les deux sens. La règle réduit l'étendue du débat ; elle ne le tranche pas.

## Actions de suivi

- `check-narrative.sh` vérifie le seul titre où cette décision porte quelque chose : la scène
  d'ouverture du troisième acte nomme ce que le lecteur y gagne plutôt que l'attribut. La
  vérification tourne dans le build et a été contrôlée en la cassant. Les autres titres reposent
  sur la relecture, et ce compte rendu le dit plutôt que de laisser croire à une vérification qui
  n'existe pas.
- L'ADR-0007 porte le lien vers ce compte rendu à côté de son statut, et est marqué comme remplacé
  **en partie** : son ordre — l'acte répond avant d'échouer — tient, et la vérification qui le
  protège n'est pas touchée.

## Références

- [ADR-0007](0007-le-troisieme-acte-repond-avant-dechouer-fr.md), dont l'ordre tient et dont ce
  compte rendu remplace l'instrument
- Spécification §9.2 (règle de continuité), §9.3 (chaque acte se termine par une sortie)
