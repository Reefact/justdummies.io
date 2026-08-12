# ADR-0005 | Une scène arrive au lieu d'occuper l'écran

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0005-a-scene-arrives-rather-than-holding-the-screen-en.md)

**Statut :** Proposé
**Proposé le :** 2026-08-12

Remplace une partie d'[ADR-0003](0003-la-figure-porte-la-scene-fr.md).

**Décideurs :** Reefact

## Contexte

L'[ADR-0003](0003-la-figure-porte-la-scene-fr.md) a tranché deux choses à la fois. Une scène est
une figure en pleine largeur, sous son propre titre, avec le commentaire en dessous — et une scène
occupe l'écran, `min-height: 100vh`.

La première moitié corrigeait deux défauts signalés et n'est pas en cause ici. La seconde
répondait à un autre problème : le panneau adhérent parti, il ne restait rien pour que le
défilement donne la sensation d'avancer dans une histoire plutôt que de faire glisser un document.
Une scène de la hauteur de l'écran plaçait la figure à peu près au même endroit d'une scène à
l'autre, ce qui se lit comme le même code qui change. L'ADR-0003 note que c'est obtenu « de la
mise en page plutôt que d'un script », et range la page bien plus longue dans les conséquences
voulues.

Trois jours d'usage disent que l'échange était mauvais. Le vide a été signalé avant que l'effet
soit remarqué : environ un écran de rien entre chaque paire de blocs de code, sur dix-huit scènes,
et le retour a été que les actes « partent en n'importe quoi — il n'y a plus d'effet ». Un lecteur
qui traverse un écran de fond vide n'y lit pas un temps de la narration ; il y lit une page qui
s'est terminée.

La comparaison proposée était celle des pages produit d'Apple, où une section qui n'est pas encore
à l'écran arrive : elle apparaît en fondu et remonte à mesure qu'elle entre dans le champ. Cet
effet fait le travail pour lequel la hauteur avait été payée, et il le fait dans l'espace que le
contenu occupe déjà.

La page compte par ailleurs trois actes entre lesquels le lecteur est censé sentir qu'il passe, et
rien ne marquait ces coutures qu'un filet d'un pixel.

## Décision

**Une scène occupe la hauteur dont son contenu a besoin et se révèle en entrant dans l'écran ; le
fond change à la couture entre deux actes et nulle part ailleurs.**

## Justification

La hauteur et le fondu ont été achetés pour la même chose, et un seul des deux se paie en espace.
Retirer `min-height: 100vh` fait passer le premier acte de 6,8 écrans à 4,2 et la page entière de
17,1 à 11, mesuré en 1400×900 ; le fondu n'ajoute rien du tout à la longueur de la page.
Là où l'ADR-0003 échangeait du vide contre une sensation de mouvement, celui-ci l'obtient contre
rien.

Le fondu est aussi le signal le plus honnête. Une scène de hauteur fixe dit « un temps, c'est un
écran », ce qui est une affirmation sur la mise en page ; une scène qui arrive dit « voici la
suite », ce qui est une affirmation sur la lecture. Que les scènes aient désormais des hauteurs
différentes est juste : elles ne contiennent pas la même chose.

Que le fond change par acte et non par scène découle de ce qu'est un acte. Les scènes d'un acte
forment un seul raisonnement continu — six vues d'une même transformation — et donner à chacune
son panneau découperait ce raisonnement en cartes. L'acte est l'endroit où le raisonnement change,
et c'est la seule couture qui mérite d'être marquée. Trois points de luminosité suffisent à se
remarquer en défilant sans qu'on ait envie de les regarder, ce qui est le registre de toute la
page.

Agrandir les titres de scène relève de la même décision et non du goût : à leur taille précédente,
un titre se lisait comme la légende du bloc placé dessous, alors qu'un titre de scène est la
proposition dont la figure est la preuve. Les titres d'acte montent d'un cran avec eux, faute de
quoi un acte s'ouvrirait sur un titre pas plus grand que les six temps qu'il contient.

## Alternatives envisagées

### Garder les scènes pleine hauteur et leur ajouter le fondu

Envisagée parce qu'elle est purement additive et ne contredit aucun enregistrement existant.
Rejetée parce que le vide est le défaut signalé, et qu'elle en conserve chaque pixel. Le fondu se
déclencherait contre un écran de fond vide, ce qui allonge l'attente au lieu de la raccourcir.

### Raccourcir les scènes sans ajouter le fondu

Envisagée parce qu'elle ne réclame aucun script, ce que l'ADR-0003 valorisait le plus. Rejetée
parce qu'elle retire la sensation d'avancer sans la remplacer : les scènes se suivraient sur la
page comme un document ordinaire, ce que la narration n'est justement pas censée être. La hauteur
faisait quelque chose, et la retirer sans contrepartie rend le problème que l'ADR-0003 résolvait.

### Le *scroll snapping* plutôt que le fondu

Envisagée parce que c'est l'autre façon de faire sentir qu'on passe d'un temps à l'autre, et que
l'ADR-0003 la désignait comme délibérément écartée. Rejetée pour les mêmes raisons qu'alors : le
snap s'applique au scroller racine, donc le hero snapperait aussi, et il retire le défilement au
lecteur — une page qui décide où le défilement s'arrête se bat contre quiconque parcourt.

### Un fond par scène plutôt que par acte

Envisagée parce qu'elle marque chaque temps et constitue la version la plus forte de l'effet.
Rejetée parce qu'elle découpe un raisonnement continu en dix-huit cartes. Les scènes d'un acte
sont six vues d'une même transformation, et un panneau autour de chacune dit qu'il s'agit de six
choses distinctes.

## Conséquences

### Positives

La page perd un tiers de sa hauteur — 15 373 pixels contre 9 918 — sans perdre une scène, une
figure ni une phrase. Chaque acte en perd entre un tiers et deux cinquièmes.

Chaque couture que le lecteur est censé sentir est désormais marquée par quelque chose qu'il voit :
le fondu à chaque temps, le fond à chaque acte.

Les titres de scène portent le poids des propositions qu'ils sont, au lieu de se lire comme des
légendes.

### Négatives

**Le script revient dans la mise en page, et l'ADR-0003 comptait son retrait comme un bénéfice.**
C'est un vrai retour en arrière et c'est le prix de cette décision. Ce qui le borne, c'est que le
script ne fait qu'*ajouter* : la page sans lui est complète, mise en page et lisible — il lui
manque une animation, pas du contenu. L'attribut d'armement est posé par un script en ligne dans
l'en-tête précisément pour qu'une page dont le script n'arrive jamais n'entre jamais dans l'état
masqué.

Les quatre rendus d'une scène redeviennent quatre — bureau, mobile, mouvement réduit, sans script
— et deux d'entre eux diffèrent désormais des deux autres par la présence du fondu. L'ADR-0003
avait ramené cela à un seul.

Un nouveau token partagé, `--jd-surface-sunken`, entre dans une palette que les deux applications
consomment, pour un usage que seul le site a aujourd'hui.

### Risques

**Se tromper sur l'état par défaut du fondu rend la page blanche.** Si l'`opacity: 0` est un jour
sortie de `[data-reveal-armed]` — la simplification évidente, et elle paraît correcte dans tout
navigateur qui exécute le script — un lecteur sans script obtient un document vide au lieu d'un
document sans animation. C'est la seule façon dont ce changement peut échouer en silence, et il
échoue précisément pour les lecteurs les moins en mesure de le signaler.

Le fondu a une seconde défaillance silencieuse : un groupe qui n'entre jamais dans la racine
rétrécie de l'observateur reste à opacité nulle pour de bon. Il en existait dans la première
implémentation — deux groupes situés dans les derniers 15 % du document, là où la page n'a plus de
défilement avant qu'ils ne remplissent la condition — et cela a été trouvé en faisant défiler la
page construite jusqu'au bout, pas en lisant le code. Le garde-fou en bas de document existe pour
ça et doit survivre à tout réglage ultérieur de la marge.

## Actions de suivi

- `verify-output.sh` vérifie les deux moitiés du risque de page blanche sur l'artefact construit :
  toute règle qui masque un groupe de fondu est conditionnée à l'attribut d'armement, et aucune
  page livrée ne porte cet attribut dans son balisage. Les deux ont été éprouvées en les cassant.
  Le contrôle tourne dans le build.
- Le statut de l'ADR-0003 et son lien vers cet enregistrement appartiennent au mainteneur, comme
  celui-ci.

## Références

- [ADR-0003](0003-la-figure-porte-la-scene-fr.md), dont la première moitié reste inchangée
- [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md), dont l'attribut d'armement
  applique la règle — la page fonctionne, puis le script l'améliore
- Spécification §9.1 (technologie narrative), §9.7 (ce que coûte une scène), §5.3 (le mouvement
  doit expliquer)
