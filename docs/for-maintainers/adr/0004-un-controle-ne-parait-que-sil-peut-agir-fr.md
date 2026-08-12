# ADR-0004 | Un contrôle ne paraît que s'il peut agir

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0004-a-control-appears-only-when-it-can-act-en.md)

**Statut :** Accepté
**Proposé le :** 2026-08-12
**Accepté le :** 2026-08-12
**Décideurs :** Reefact

## Contexte

Certaines parties du site ont besoin du script pour fonctionner : le bouton de copie atteint le
presse-papiers, et les onglets du bloc d'installation basculent entre deux commandes. Le site est
par ailleurs un ensemble de documents statiques, et le §9.7 exige qu'une page s'affiche sans
JavaScript.

Le motif déjà en usage consiste à masquer un tel contrôle dans le balisage et à laisser son propre
script le révéler. Le bouton de copie est construit ainsi depuis le début.

La liste d'onglets d'installation a été construite de la même façon et a été livrée visible quand
même. `hidden` pose le `display: none` de l'agent utilisateur, et le `.tablist { display: flex }` du
composant l'emporte en spécificité : l'attribut était bien posé et la feuille de style le
contredisait. Ce qu'obtenait un lecteur sans script était une rangée d'onglets dont aucun ne faisait
rien, la seconde commande d'installation restant inatteignable derrière eux.

Rien dans le dépôt ne l'aurait rattrapé. Le défaut a été trouvé en chargeant la page construite avec
le script refusé ; le balisage, lu seul, paraissait juste. `pnpm check` passait, le build passait,
et tout navigateur exécutant le script affichait la bonne page.

La même classe de défaut est ouverte à chaque composant que le site ajoutera : `hidden` perd contre
tout `display` posé par une feuille de style, et les feuilles de style s'écrivent par composant
tandis que la défaillance n'est visible que le script coupé.

## Décision

**Un contrôle qui a besoin du script est absent de la page tant que son script n'a pas tourné, et
ce qu'il enrichit est une page qui fonctionne déjà sans lui.**

## Justification

Trois parties découlent de cette phrase et toutes trois sont nécessaires, car chacune prise seule
passe pendant que la page est cassée : le contrôle est livré `hidden` ;
`[hidden] { display: none !important }` est déclaré une fois, globalement, dans `base.css` ; et ce
que le contrôle enrichit est présent et utilisable dans le balisage, de sorte que les onglets
masquent une forme empilée déjà là plutôt qu'une boîte vide que le script devrait remplir.

La règle globale est la part qui transforme une convention en garantie. Une règle `[hidden]`
compagnon écrite par composant doit être retenue par composant, et celle-ci ne l'a pas été — c'est
le fait rapporté au Contexte, non une hypothèse. Déclarée une fois et marquée `!important`, rien en
aval ne peut la défaire, et le défaut cesse d'être possible au lieu d'être testé.

La troisième partie est ce qui rend le masquage honnête. Masquer un contrôle qui est le seul accès à
un contenu échange un bouton mort contre un contenu manquant, ce qui est pire que le défaut corrigé.
Ici cela ne coûte rien : la forme empilée est le balisage à partir duquel les onglets ont toujours
été construits.

Le même raisonnement s'étend aux rôles ARIA. `role="tab"` sur un bouton qui ne peut rien basculer
est une promesse faite au lecteur d'écran que la page ne peut pas tenir ; `tab` et `tabpanel` sont
donc posés par le script eux aussi — une page dont le script n'arrive jamais n'a pas en elle un
composant à moitié construit à annoncer.

## Alternatives envisagées

### Une règle `[hidden]` compagnon dans chaque composant

Envisagée parce qu'elle est locale, se passe d'`!important` et garde le style de chaque composant
autonome. Rejetée parce que la défaillance rapportée au Contexte *est* cette option qui échoue : la
règle n'a pas été écrite, rien ne l'a signalé, et le défaut est parti en production. Une garantie
qui repose sur le fait qu'on s'en souvienne est précisément ce dont on ne s'est pas souvenu.

### Afficher les onglets et masquer les panneaux à la place

Envisagée parce qu'elle rend le composant complet dans le balisage, sans étape de révélation.
Rejetée parce que sans script les onglets ne basculent pas : les panneaux qu'ils masquent sont donc
inatteignables. On échange un contrôle mort contre un contenu perdu, ce qui est le pire des deux.

### Abandonner les onglets et empiler les commandes, comme le font les sorties d'acte

Envisagée parce qu'elle ne réclame aucun script et que c'est déjà ce que fait le reste de la page.
Rejetée pour cette position seulement : le premier écran doit tenir la marque, une expression
vivante, l'offre et l'invitation à défiler au-dessus de la ligne de flottaison, et la forme empilée
prend 254 pixels sur les quelque 800 dont il dispose. Elle reste la bonne forme partout où l'écran
appartient au lecteur.

### L'accepter et s'en remettre à la relecture

Envisagée parce que le dépôt s'en remet déjà à la relecture pour plusieurs conventions. Rejetée
parce que celle-ci est invisible à la relecture par construction — le balisage se lit correctement
et le défaut n'apparaît que le script coupé, état dans lequel un relecteur n'atterrit pas par
hasard.

## Conséquences

### Positives

Toute la classe de défaut est refermée pour chaque composant, présent et à venir, et non pour le
seul qui l'a manifestée.

La page sans script s'améliore au lieu d'être simplement réparée : masquer la liste d'onglets
découvre la forme empilée en dessous, si bien qu'un lecteur sans script atteint les deux commandes
et le lien.

Le build le dit. Trois vérifications dans `verify-output.sh` couvrent les trois parties : en retirer
une casse le build plutôt que la page.

### Négatives

`base.css` porte un `!important`, ce qui est par ailleurs évité. C'est délibéré — la règle est un
plancher, non une préférence — mais c'est une exception réelle à une règle que la feuille de style
tient partout ailleurs.

Un composant qui masque un contrôle doit désormais à la page une forme fonctionnelle en dessous.
Cela contraint la conception d'un tel composant, pas seulement son style.

Les scripts du site en font davantage : poser des rôles à l'exécution représente plus de code que
les écrire dans le balisage, et ce code doit être juste.

### Risques

`hidden="until-found"` ne peut pas être employé sans revenir sur cette décision — il a besoin que
`display` demeure, et la règle globale le lui retire. Rien ne l'utilise aujourd'hui, et un besoin
futur de contenu révélé par la recherche dans la page devrait être pesé contre la réouverture de la
brèche.

Les trois vérifications nomment la liste d'onglets d'installation en particulier. Un second
composant bâti sur ce motif est couvert par la règle globale mais par aucune vérification propre, et
l'ajouter revient à qui ajoute le composant.

## Actions de suivi

- `scripts/verify-output.sh` vérifie les trois parties sur l'artefact construit, et chaque
  vérification a été éprouvée en la cassant. Le contrôle tourne dans le build.
- Tout composant ajouté par la suite qui masque un contrôle jusqu'à l'exécution de son script
  devrait recevoir la vérification de balisage équivalente, à côté de celle de la liste d'onglets.

## Références

- Spécification §9.7 (la page s'affiche sans JavaScript), §7.4 (les formes du bloc d'installation)
- [ADR-0003](0003-la-figure-porte-la-scene-fr.md), qui a retiré à la mise en page sa dépendance au
  script pour la même raison
- ARIA Authoring Practices, le motif d'onglets — activation automatique, `tabindex` glissant
