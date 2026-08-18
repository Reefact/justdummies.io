# ADR-0015 | Le combo nomme ce que le playground ne peut pas offrir

🌍 🇬🇧 [English](0015-the-combo-names-what-the-playground-cannot-offer-en.md) · 🇫🇷 Français (ce fichier)

**Statut :** Proposée
**Proposée :** 2026-08-18
**Décideurs :** Reefact

## Contexte

Le combo de méthodes du playground est piloté par le catalogue généré (ADR-0010) : une passe de
réflexion au build sur l'assembly JustDummies publié décide, membre par membre, ce que v1 sait
exprimer comme étape de chaîne plate. Ce qu'elle ne sait pas exprimer est exclu avec un motif
déclaré (spécification §10.5/§10.6), et ces motifs sont réels — une méthode générique ouverte n'a
aucune instanciation fermée à appeler, un paramètre délégué ou `IAny<T>` imbriqué n'a aucun champ
de formulaire, un argument multi-valeurs n'a aucune forme en v1, un type de paramètre peut n'avoir
aucun parseur d'argument.

Soixante-dix-sept membres sont exclus ainsi aujourd'hui. Onze d'entre eux sont les générateurs
composites d'`Any` — `ListOf`, `SetOf`, `Combine`, `Enum`, `OneOf`, `PairOf`, `TripleOf`,
`ArrayOf`, `SequenceOf`, `DictionaryOf`, `ElementOf` — et deux autres, `.As(...)` et `.OrNull()`,
s'appliquent à tous les générateurs de la bibliothèque. Ce ne sont pas des membres marginaux.
C'est une part substantielle de ce à quoi JustDummies sert, et elle était invisible : le combo
listait ce que le playground savait exécuter et ne disait rien du reste.

Un visiteur n'a aucun moyen de le savoir. Le combo est la seule énumération de la surface de la
bibliothèque que la page propose, et il est lu comme telle — la page invite à « découvrir la
librairie JustDummies en la testant directement ici ». Quelqu'un qui ouvre le playground, cherche
comment tirer une liste et ne trouve rien apprend quelque chose de faux sur la bibliothèque plutôt
que quelque chose de vrai sur ce formulaire web.

La page porte déjà une note de périmètre disant que l'interface est plus étroite que la
bibliothèque. Une note en haut d'une page n'est pas lue au moment où la question se pose, c'est-à-dire
quand le combo est ouvert et qu'un nom y manque.

Les exclusions ne sont pas d'une seule sorte. Certains membres sont exclus parce que ce formulaire
ne sait pas demander leurs arguments ; d'autres — `Any.UseSeed(...)`, `Any.Reproducibly(...)`,
`Any.WithSeed(...)` — parce que leur type de retour n'est pas un builder chaînable du tout, si bien
qu'aucune expression ne pourrait se poursuivre à travers eux. Seule la première sorte est une
limite de l'interface. Certains noms sont par ailleurs exclus dans une surcharge et catalogués dans
une autre : `Any.StringMatching(string)` fonctionne ici, `Any.StringMatching(Regex)` non.

## Décision

**Un membre que l'interface web ne sait pas exprimer est nommé dans le combo comme une option
désactivée qui le dit, plutôt qu'omis.**

## Justification

Le combo est l'endroit où la question se pose réellement, donc c'est là que la réponse doit être.
Nommer le membre et le refuser transforme un silence que le visiteur doit interpréter en une phrase
qu'il peut lire : la capacité existe, cette page ne l'atteint pas. C'est l'affirmation que porte
déjà la note de périmètre de la page, délivrée au moment où elle sert plutôt que plusieurs
paragraphes plus tôt.

Ce qui rend ce silence coûteux, c'est la réputation qu'il engage. Le playground existe pour
démontrer la bibliothèque ; une démonstration qui sous-déclare discrètement la surface de son sujet
plaide contre lui. Les onze générateurs composites sont le cas le plus net — un visiteur qui évalue
JustDummies face à une bibliothèque capable de générer des collections cherchera exactement ceux-là,
et l'absence se lit comme une réponse.

La distinction entre les deux sortes d'exclusion est ce qui garde les nouvelles entrées honnêtes,
et c'est pourquoi elle est modélisée dans le catalogue plutôt qu'en attribut désactivé choisi dans
le balisage. Un membre exclu parce que son type de retour n'est pas un builder n'est pas une étape
de chaîne du tout ; l'offrir dans une liste dont chaque entrée signifie « l'appel suivant dans
cette expression » serait une erreur de catégorie, pas une limite déclarée. Porter l'état de prise
en charge comme donnée laisse le générateur trancher une fois, là où sont les faits de réflexion,
et laisse quiconque lit le catalogue voir laquelle des deux une entrée est. Un drapeau au niveau de
l'interface devrait le redériver à partir de rien.

L'occultation découle du même souci de ce qu'une entrée affirme. Un nom qui a une surcharge
fonctionnelle est un nom fonctionnel ; lister la surcharge qui ne marche pas à côté de celle qui
marche se lirait comme une contradiction plutôt que comme une limite. Et puisque les entrées
désactivées n'impriment aucun argument — ne pas savoir demander d'arguments est ce qui les a mises
là —, les surcharges d'un même nom seraient des répétitions d'une seule ligne morte : une entrée
par nom et par receveur est la seule forme qui porte de l'information.

Le coût est une liste plus longue contenant des entrées inutilisables, coût réel et précisément
celui contre lequel le titre d'ADR-0004 met en garde. Il est accepté ici parce que le sujet de
cette décision était autre : un contrôle qui ne fait silencieusement rien quand son script
n'arrive jamais, en masquant du contenu derrière lui. Une option désactivée ne fait rien
*visiblement*, dit pourquoi, et ne masque rien — la sémantique `disabled` de la plateforme atteint
le pointeur, le clavier et le lecteur d'écran sans que nous ayons rien à inventer.

## Alternatives envisagées

### Laisser le combo tel quel, et laisser la note de périmètre porter la réserve

Envisagée parce que la note existe déjà, ne coûte rien par entrée, et garde le combo exempt
d'entrées que personne ne peut choisir.

Rejetée parce qu'une note en haut de page et un nom absent d'une liste sont lus à plusieurs
minutes d'intervalle, dans cet ordre. La note dit au visiteur qu'il manque quelque chose ; elle ne
peut pas lui dire quoi, et le seul moment où il gagnerait à le savoir est celui où il le cherche.
Chaque entrée inutilisable que cette alternative économise est une question sans réponse qu'elle
crée.

### Montrer tous les membres exclus, sans distinguer les sortes

Envisagée parce que c'est la lecture la plus simple de « montrer ce qui manque », qu'elle ne
demande aucune modélisation nouvelle, et qu'on ne peut lui reprocher de cacher quoi que ce soit.

Rejetée parce qu'elle mettrait `UseSeed(...)` et `Reproducibly(...)` dans une liste d'étapes de
chaîne, où un visiteur ne pourrait que les lire comme des appels qu'il aurait pu enchaîner. Ce sont
de vrais membres que ce playground n'offre effectivement pas, mais ce ne sont pas des étapes d'une
expression, et le combo n'a aucun moyen de dire « réel, indisponible, et par ailleurs pas le genre
de chose dont cette liste parle ». Être exhaustif sur le mauvais ensemble n'est pas plus honnête
qu'être exact sur le bon.

### Rendre les entrées indisponibles dans une liste séparée et non interactive, à côté du combo

Envisagée parce qu'elle garde le combo purement actionnable et donne à la surface exclue la place
d'exposer ses motifs, ce dont un libellé d'option dispose peu.

Rejetée parce qu'elle sépare de nouveau la réponse de la question, dans l'espace au lieu du temps.
La valeur de nommer ces membres tient à ce qu'ils soient là où le visiteur les cherche —
alphabétiquement parmi leurs pairs, filtrés sur le type couramment en main. Une seconde liste doit
être trouvée, et elle repose le problème que la note de périmètre pose déjà.

## Conséquences

### Positives

Un visiteur qui cherche dans le combo une capacité que la bibliothèque possède la trouve désormais,
avec le motif de son indisponibilité attaché, au lieu de ne rien trouver et d'en tirer sa propre
conclusion.

Le catalogue distingue « inexprimable par cette interface » de « n'est pas une étape de chaîne », ce
qui était implicite dans des motifs en prose et devient une valeur sur laquelle tout lecteur du
catalogue peut agir.

Le rapport d'exclusion dit quels membres exclus l'interface nomme, si bien qu'un audit de ce qui a
été laissé de côté peut distinguer le caché du montré sans lire le générateur.

Les limites de l'interface deviennent visibles et donc relisibles : une entrée qui devrait être
sélectionnable et ne l'est pas apparaît maintenant comme une mauvaise réponse sur la page plutôt
que comme une absence que personne ne peut voir.

### Négatives

Le combo de chaque builder est plus long, de deux entrées (`.As(...)`, `.OrNull()`) plus les
contraintes que son type exclut, et une part de cette longueur est inutilisable par construction.

Le catalogue généré porte désormais des membres pour lesquels la table de dispatch n'a aucun point
d'appel : « décrit » et « dispatchable » ne sont plus le même ensemble. L'auto-vérification du
générateur a dû être restreinte au second, ce qui affaiblit réellement un contrôle qui comparait
auparavant tout ce qu'il émettait.

Une entrée indisponible ne porte ni résumé ni lien de documentation : la seule chose qu'un visiteur
curieux voudrait ensuite — que fait `ListOf` au juste — n'est pas offerte ici. Les pages d'API la
portent ; cette page ne les lie pas entrée par entrée.

### Risques

L'état de prise en charge est porté par un argument final du littéral de descripteur émis, et
l'auto-vérification du générateur distingue les membres dispatchables des membres seulement nommés
en relisant cet argument dans le texte émis. Un changement d'émetteur qui couperait un littéral sur
plusieurs lignes élargirait silencieusement l'entrée de ce contrôle. Les littéraux sont écrits un
par ligne aujourd'hui, et le contrôle en dépend.

Un futur membre exclu pour un motif qui n'est ni l'une ni l'autre des sortes que cette décision
nomme serait classé par la branche où il tombe plutôt que par un choix délibéré. La classification
est une énumération fermée, donc ajouter une cause est une invitation à trancher au moment de la
compilation ; faire entrer un nouveau motif structurel dans une cause existante ne l'est pas.

## Actions de suivi

- `tests/browser/playground.spec.ts` vérifie qu'un membre réel et non pris en charge est listé et
  désactivé, que son libellé porte le motif, et que les membres pris en charge à côté restent
  sélectionnables. Il a été vérifié en retirant l'attribut `disabled`, en regardant le contrôle
  passer au rouge sur un artefact reconstruit, puis en le remettant. Il tourne dans le build
  (`scripts/check-in-browser.sh`).
- L'auto-vérification du générateur (`tools/playground-catalogue`) continue de faire échouer le
  build si un descripteur dispatchable n'a pas de point d'appel, ou l'inverse.
- Rien ne vérifie que le *motif* d'une exclusion est classé correctement — qu'un futur membre exclu
  structurellement tombe sur la cause qu'un humain aurait choisie. Nommé ici comme une lacune
  plutôt que laissé implicite : l'énumération rend la question inévitable quand une cause est
  ajoutée, et invisible quand une cause existante est réutilisée.

## Références

- Spécification §10.4 (le catalogue pilote le constructeur), §10.5/§10.6 (une omission est exclue
  avec un motif déclaré), §10.7 (ce que le catalogue permet de dériver)
- [ADR-0010](0010-le-catalogue-du-playground-est-du-code-c-genere-pas-du-json-fr.md), qui a fait du
  catalogue du code C# généré et donné à cette décision un endroit où vivre
- [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md), dont le sujet est le contrôle qui
  ne fait silencieusement rien — le cas dont celle-ci se distingue
