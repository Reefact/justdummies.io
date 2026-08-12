# ADR-0006 | Le premier acte suit une seule factory, pas la surface de la bibliothèque

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0006-the-first-act-follows-one-factory-en.md)

**Statut :** Proposé
**Proposé le :** 2026-08-12
**Décideurs :** Reefact

## Contexte

Le §9.2 de la spécification décrit le premier acte en six temps, dont les deux derniers sont une
valeur qui devient un objet du domaine en une opération, et un test qui fonctionne mais en dit
encore trop. La page a été construite ainsi et les deux scènes fonctionnaient : le code compilait,
les valeurs étaient réelles, et aucune des deux ne disait quoi que ce soit de faux sur la
bibliothèque.

Elles ont pourtant été supprimées, lors d'une passe éditoriale sur l'acte entier. Cette passe
répondait au retour d'un lecteur sur l'acte dans son ensemble, et deux observations y touchent ces
deux scènes.

La première est que l'acte est long. Il faisait huit scènes ; un lecteur pas encore convaincu doit
toutes les traverser avant que la page ne lui propose quoi que ce soit, et la sortie est au bout.

La seconde porte sur ce que faisait chacune des deux scènes. Celle de l'opération unique montrait
un maillon qui transforme une chaîne tirée en objet du domaine — une vraie fonctionnalité, et la
chose la plus courte de la page. Sauf qu'à cet endroit le lecteur vient de voir une factory qui
rend déjà un objet du domaine ; le maillon est une façon plus propre d'écrire quelque chose qu'il
n'a encore aucune raison d'écrire, et l'acte devait expliquer la fonctionnalité au lieu de s'en
servir. Elle revient au deuxième acte, dans le fichier écrit par l'outil, là où le lecteur la
rencontre après avoir écrit la chaîne à la main. L'autre scène redisait la conclusion de l'acte :
un test qui fonctionne et en dit trop, c'est ce sur quoi l'acte s'ouvre et ce dont chaque scène
parlait depuis.

La même passe avait déjà établi ce qu'*est* l'acte : une factory, `AnyOrderReference`, suivie d'un
littéral tapé à la main jusqu'à une chaîne de contraintes déclarée, la source des extraits portant
trois états de cette unique classe pour que la page montre une classe qui évolue plutôt que trois
classes différentes.

## Décision

**Le premier acte est une factory suivie du littéral jusqu'à la chaîne déclarée, et une scène y
gagne sa place en faisant avancer cette transformation — une scène qui montre une capacité dont le
lecteur n'a pas encore l'usage, ou qui redit ce qu'une scène précédente a établi, est retirée.**

## Justification

Le travail de l'acte est de faire atterrir une proposition : une valeur dont votre test se moque
doit quand même être valide, et déclarer ce qui doit être vrai est un autre métier qu'écrire une
valeur. Tout ce qui sert cette proposition mérite son écran ; le reste lui fait concurrence, et les
deux scènes retirées lui faisaient concurrence des deux façons possibles.

Montrer `.As(...)` avant que le lecteur puisse s'en servir coûte plus que l'écran qu'il occupe. Une
page qui démontre une fonctionnalité doit l'expliquer, et une explication sur laquelle le lecteur
ne peut rien faire est le moment où l'acte cesse d'être une transformation pour devenir une visite
guidée de la bibliothèque. La différer ne la cache pas : elle arrive au deuxième acte, dans un
fichier que l'outil a écrit — c'est-à-dire là où un lecteur la rencontrera vraiment pour la
première fois, et au moment où il a déjà écrit la chaîne lui-même. La fonctionnalité est mieux
servie par l'attente.

Redire une conclusion est l'erreur la moins chère et la plus dommageable. Un lecteur qui a suivi
cinq scènes et à qui la sixième explique ce qu'il vient de comprendre apprend que cette page se
répète, et se met à survoler — la dernière chose que l'acte qui précède la première sortie puisse
se permettre.

Ce n'est délibérément pas une règle sur la longueur des actes. Couper pour la longueur aurait
coupé la scène la plus courte ou la plus lointaine ; ce qui a été coupé, c'est ce qui ne faisait
pas avancer la transformation, et l'acte qui reste fait cinq scènes parce que c'est le nombre de
scènes qui faisaient quelque chose.

## Alternatives envisagées

### Garder les deux scènes en raccourcissant leur texte

Envisagé parce que les deux compilent, les deux sont vraies, et supprimer du matériel qui marche
est l'option coûteuse. Écarté parce que le problème d'aucune des deux n'était sa longueur. Une
version plus courte d'une étape dont le lecteur n'a pas l'usage reste une étape dont il n'a pas
l'usage, et une redite plus courte reste une redite.

### Garder la scène de l'opération unique et retirer `.As(...)` du deuxième acte

Envisagé parce que cela montre l'expression la plus courte de la bibliothèque au plus tôt, ce qui
est un vrai argument pour une page d'accueil. Écarté parce que cela inverse l'ordre dont le lecteur
a besoin : `.As(...)` gagne sa place en supprimant un travail que le lecteur vient de faire à la
main, et montré avant cela c'est une fonctionnalité qu'il doit croire sur parole. Cela affaiblirait
aussi le deuxième acte, dont tout le propos est que le fichier écrit par l'outil est la chaîne du
lecteur, inchangée.

### Déplacer les deux scènes dans une section « ce qu'elle fait d'autre » plus bas

Envisagé parce que cela conserve le matériel sans interrompre la transformation. Écarté parce que
la page n'a pas de section de ce genre et ne doit pas en faire pousser une : ceci est une
narration, et un catalogue boulonné à la fin est exactement la forme que le site existe pour
éviter. Ce que la bibliothèque fait au-delà de l'histoire relève de la documentation, qui est un
autre métier.

## Conséquences

### Positives

L'acte fait cinq scènes au lieu de huit, et chacune modifie la factory dont l'acte parle. Le
lecteur atteint la première sortie plus tôt, et tout ce qu'il a traversé en chemin portait quelque
chose.

`.As(...)` n'est plus introduit qu'une fois, à l'endroit où il supprime un travail que le lecteur a
déjà fait. Cela se lit comme une récompense au lieu d'une fonctionnalité.

La source des extraits reflète la page : trois espaces de noms portant trois états d'une même
classe, si bien que l'évolution que l'acte décrit est celle que le compilateur vérifie.

### Négatives

**Le §9.2 de la spécification ne décrit plus le premier acte.** Deux des six temps qu'il énumère ne
sont pas sur la page. Tant que le §9.2 n'est pas mis à jour, le document et le site se
contredisent, et ce compte rendu est le seul endroit qui dise pourquoi.

L'expression la plus courte de la bibliothèque n'est plus sur la page avant la première sortie. Un
lecteur qui part à cette sortie n'aura pas vu `.As(...)` du tout.

### Risques

Les scènes retirées sont faciles à remettre. Les deux sont petites, les deux se défendent
isolément, et l'argument pour placer `.As(...)` tôt est bon chaque fois qu'on le formule. Sans
vérification, cette décision se défait à force de bonnes intentions ordinaires.

## Actions de suivi

- `check-narrative.sh` vérifie ce report sur les extraits publiés : `.As(` apparaît dans la recette
  du deuxième acte et dans rien de ce que le premier acte publie. La vérification tourne dans le
  build, et elle a été contrôlée en la cassant.
- Le §9.2 de la spécification doit être mis à jour pour la séquence en cinq temps que porte la
  page. C'est l'édition du mainteneur, pas celle de ce compte rendu.

## Références

- [ADR-0007](0007-le-troisieme-acte-repond-avant-dechouer-fr.md), la décision de la même passe sur
  le troisième acte
- Spécification §9.2 (règle de continuité), §9.3 (chaque acte se termine par une sortie)
