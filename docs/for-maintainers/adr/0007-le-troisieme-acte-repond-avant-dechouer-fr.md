# ADR-0007 | Le troisième acte répond avant de montrer un échec

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0007-the-third-act-answers-before-it-fails-en.md)

**Statut :** Accepté — remplacé en partie par [ADR-0008](0008-une-scene-est-titree-par-ce-que-le-lecteur-y-gagne-fr.md)
**Proposé le :** 2026-08-12
**Accepté le :** 2026-08-12
**Décideurs :** Reefact

**Ce qui est parti et ce qui tient.** L'ordre tient : le troisième acte énonce sa proposition avant
que quoi que ce soit n'y échoue, et la vérification qui le protège est inchangée. Ce que l'ADR-0008
remplace, c'est la seconde moitié de la Décision ci-dessous — que la proposition est énoncée *en
nommant un attribut que le lecteur a déjà vu*. La scène d'ouverture énonce le bénéfice à la place,
et l'attribut reste dans la figure sans en être le sujet.

## Contexte

Le §9.2 de la spécification décrit le troisième acte en trois temps : le test vert redevient rouge
par intermittence, l'échec rend son seed, le même seed reproduit exactement le même échec. Le §9.4
rend une phrase de charnière obligatoire à son ouverture et dit ce qu'elle relie — un test vient de
passer au vert, et la page va montrer qu'il peut redevenir rouge. L'acte a été construit exactement
ainsi.

Lu dans cet ordre, l'acte s'ouvre en annonçant, à un lecteur qui est encore en train de décider
s'il fait confiance à tout ça, que son test échouera environ deux fois sur trois. Le rassurement —
l'échec rend un seed, et ce seed ramène ces valeurs-là et pas des valeurs qui leur ressemblent —
arrive deux scènes plus loin.

L'objection a été formulée comme une proposition de supprimer l'acte : quelqu'un qui ne comprend
pas déjà la reproductibilité peut prendre toute la section pour un avertissement, et cela demande
une vraie explication avant d'être montré. C'est une lecture juste de l'acte tel qu'il était. Ce
que l'acte démontre mérite pourtant d'être gardé : une bibliothèque qui tire des valeurs
différentes à chaque exécution doit répondre à « comment je récupère celle qui a échoué », et y
répondre est un argument de vente, pas une réserve.

Deux faits sur la page rendent un autre ordre possible. Les valeurs qui inquiètent le lecteur sont
tirées sur la page depuis le premier acte : la question est déjà dans sa tête quand le troisième
acte s'ouvre, il n'y a pas à la provoquer. Et chaque test publié qui tire ses valeurs porte
`[Reproducible]` dès le premier : le lecteur est passé deux fois devant la réponse sans qu'on lui
dise ce que c'était.

## Décision

**La proposition du troisième acte — une valeur tirée peut être récupérée à l'identique — est
énoncée avant que quoi que ce soit n'y échoue, et elle l'est en nommant un attribut que le lecteur
a déjà vu plutôt qu'en en introduisant un.**

## Justification

L'ordre dans lequel une page répond détermine ce que le lecteur fait de la réponse. Une objection
soulevée et laissée en suspens pendant deux scènes est une objection à laquelle il consacre ces
deux scènes ; soulevée et traitée dans la même phrase, c'est une fonctionnalité. Rien du matériel
ne change ici — même test intermittent, même seed, même rejeu — seulement lequel des trois le
lecteur rencontre en premier.

Nommer un attribut que le lecteur a déjà vu est ce qui rend ce réordonnancement gratuit. L'acte n'a
pas à enseigner `[Reproducible]` avant de rassurer : il peut désigner quelque chose qui est sur la
page et dire à quoi ça servait, ce qui est une prétention plus petite et plus forte. Cela ne
fonctionne que parce que l'attribut est dans chaque test depuis le premier tirage : la page
n'introduit pas un mécanisme après coup, elle en nomme un qui était là depuis le début. Une page qui
aurait montré des valeurs tirées sans lui puis l'aurait sorti au troisième acte décrirait une autre
bibliothèque que celle qu'elle démontrait.

Le test qui échoue reste, et reste non dramatisé (§9.5). C'est la moitié honnête : un test qui
laisse une valeur arbitraire finira par tomber sur une valeur qu'il ne survit pas, et c'est le test
qui trouve un trou, pas la bibliothèque qui en crée un. Ce qui change, c'est que le lecteur y
arrive en tenant déjà la réponse — la différence entre « ça casse des tests » et « ça trouve les
tests qui ne disaient pas ce dont ils avaient besoin ».

La charnière du §9.4 sort intacte, et son raisonnement avec elle : la couture entre le deuxième et
le troisième acte reste la plus délicate de la page, et un lecteur qui la franchit sans phrase pour
relier les deux prend toujours le troisième acte pour un second site. Ce que dit la charnière est
éditorial et porte désormais la question du lecteur ; qu'elle existe est la décision, et elle n'est
pas touchée.

Le §9.6 est intact à tous les sens du terme. Le seed rejoue le cas de test qui l'a rapporté, et
avancer la promesse ne l'élargit pas.

## Alternatives envisagées

### Supprimer le troisième acte

Envisagé en premier, et par le mainteneur. L'argument : la reproductibilité demande une explication
dont la page n'a pas la place, et une demi-explication effraie plus de lecteurs qu'elle n'en
convainc. Écarté parce que la question à laquelle l'acte répond est la première qu'un lecteur
sceptique se pose sur des valeurs arbitraires, et qu'une page qui n'y répond pas le laisse
imaginer le pire. Le problème était l'ordre, et supprimer l'acte est un remède plus lourd que le
réordonner.

### Garder l'ordre et adoucir le texte de la scène qui échoue

Envisagé parce que c'est le plus petit changement possible et qu'il ne touche à aucune structure.
Écarté parce que la scène n'est pas le problème : elle est déjà non dramatisée, elle dit déjà que
rien n'est cassé, et l'adoucir encore la rendrait fuyante. On ne répond pas à l'inquiétude d'un
lecteur par une description plus douce de ce qui l'inquiète.

### Expliquer l'attribut au deuxième acte, là où il apparaît

Envisagé parce que cela place l'explication à la première apparition de l'attribut, l'endroit
conventionnel. Écarté parce que le deuxième acte parle de la préparation qui disparaît, et qu'une
explication des seeds à l'intérieur y introduit un second sujet au moment où cet acte fait son
propre point. Cela dépenserait aussi le rassurement avant que le lecteur en ait besoin :
inexpliqué au deuxième acte, l'attribut devient quelque chose que le troisième peut nommer, ce qui
est tout le nouveau début.

### Montrer un rejeu qui passe au lieu d'un échec

Envisagé parce que cela retire le rouge de l'acte entièrement. Écarté parce que cela retire la
démonstration avec : un seed qui rejoue un test vert ne prouve rien qui intéresse le lecteur. La
promesse est qu'un *échec* revient, et une page ne peut pas faire cette promesse sans en montrer
un.

## Conséquences

### Positives

Un lecteur qui arrive avec l'inquiétude ordinaire sur les valeurs arbitraires rencontre la réponse
dans le titre, le résumé, la charnière et la première scène — avant que la page ne montre quoi que
ce soit qui échoue.

`[Reproducible]` acquiert une raison d'être. Il était déjà dans chaque test qui tire et
inexpliqué ; l'acte dépense désormais cette mise en place au lieu de la laisser se lire comme du
bruit.

L'acte garde sa démonstration entière. Rien n'a été retiré pour obtenir le rassurement.

### Négatives

**Le §9.2 de la spécification ne décrit plus le troisième acte, et le rôle que le §9.4 prête à la
charnière ne correspond plus à ce qu'elle dit.** Ni l'un ni l'autre n'est modifié : le §17 du
document envoie vers cette base une décision qui mérite de lui survivre, si bien que les §9.2 et
§9.4 gardent le raisonnement qu'ils ont consigné et que ce compte rendu porte ce qui en a remplacé
une partie. Un lecteur de ces seules sections ne le saura pas, et devra venir ici.

L'acte fait quatre scènes au lieu de trois, sur une page dont la longueur est déjà une
préoccupation constante (ADR-0005).

La dernière figure du deuxième acte et la première du troisième sont le même test. Cette répétition
est délibérée — c'est elle qui rend vrai « cet attribut que vous avez déjà vu » — mais c'est une
répétition, et c'est la sortie entre les deux qui l'empêche de se lire comme une erreur.

### Risques

Le réordonnancement est invisible pour toute vérification qui lit de la prose, et les deux scènes
concernées sont plausibles dans les deux positions. Une passe éditoriale ultérieure pourrait
remettre l'échec en tête sans s'apercevoir qu'elle vient d'inverser une décision — c'est exactement
ainsi que cet acte a été construit la première fois.

## Actions de suivi

- `check-narrative.sh` vérifie l'ordre sur le document construit — le troisième acte s'ouvre sur
  l'attribut, et la scène où un test passe au rouge vient après — et vérifie que chaque test publié
  qui tire ses valeurs porte `[Reproducible]` tandis que ceux écrits avant que la bibliothèque ne
  tire quoi que ce soit ne le portent pas. Les deux ont été contrôlées en les cassant, et elles
  tournent dans le build.
- La séquence du troisième acte au §9.2 et la description de ce que relie la charnière au §9.4
  sont délibérément laissées telles quelles. La spécification garde le raisonnement qu'elle a
  consigné ; cette base porte la décision qui en a remplacé une partie (§17), et les vérifications
  ci-dessus sont ce qui tient la page à cette décision.

## Références

- [ADR-0006](0006-le-premier-acte-suit-une-seule-factory-fr.md), la décision de la même passe sur
  le premier acte
- [ADR-0005](0005-une-scene-arrive-au-lieu-doccuper-lecran-fr.md), dont cette décision dépense une
  scène contre la préoccupation de longueur
- Spécification §9.2 (règle de continuité), §9.4 (la charnière), §9.5 (le rouge n'est pas
  dramatisé), §9.6 (ce que le troisième acte ne promet pas)
