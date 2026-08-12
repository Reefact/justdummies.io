# ADR-0009 | Les contrôles navigateur sont pilotés par Playwright

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0009-the-browser-checks-are-driven-by-playwright-en.md)

**Statut :** Proposé
**Proposé le :** 2026-08-12
**Décideurs :** Reefact

## Contexte

Le dépôt n'a aucun contrôle navigateur et aucun lanceur de tests JavaScript, d'aucune sorte. Ce
qu'il a, ce sont trois scripts, et chacun lit une chose différente : `verify-output.sh` lit
l'artefact construit sur le disque, `check-served-headers.sh` demande ses en-têtes de réponse à
l'hôte en marche, et `check-narrative.sh` lit le document construit. Aucun des trois ne rend une
page.

Quatre défauts se tiennent hors de ce que ces trois-là peuvent voir, et trois se sont déjà produits
ici.

* **Le playground devient blanc.** Son `<base href>` doit correspondre à l'endroit où le playground
  a été copié, et quand ce n'est pas le cas, chaque asset part en 404 et la page ne rend rien du
  tout — sans erreur nulle part. `verify-output.sh` vérifie que les deux chaînes concordent, ce qui
  est une autre affirmation que « la page fonctionne ». Le défaut figure dans le tableau de
  dépannage du guide de déploiement parce qu'il a été rencontré.
* **Un fichier de règles peut être présent, bien formé, et ignoré.** Une règle de redirection de ce
  dépôt a été écartée par le runtime pendant des mois de constructions, alors que tous les contrôles
  sur disque passaient. `check-served-headers.sh` existe à cause de ça, et il ne referme le trou que
  pour les en-têtes.
* **Un contrôle peut partir en production mort.** La liste d'onglets d'installation est arrivée en
  production visible sans script, parce que le `display: flex` du composant battait l'attribut
  `hidden`. Elle a été trouvée en chargeant la page avec le script refusé. Rien dans le dépôt ne
  l'aurait attrapée, et le balisage se lisait correctement
  ([ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md)).
* **Une mesure peut être prise dans le mauvais navigateur, et crue.** Une barre de défilement
  horizontale signalée sur un poste de bureau a été mesurée absente deux fois, parce que Chromium
  headless dessine des barres en surimpression qui ne prennent aucune largeur, là où `100vw` en
  compte une classique. La page était fausse et la mesure disait qu'elle allait bien.

Deux décisions acceptées décrivent un comportement qui n'existe qu'une fois la page en marche.
L'ADR-0004 exige que tout contrôle scripté soit absent tant que son script n'a pas tourné, et que la
page dessous fonctionne sans lui.
L'[ADR-0005](0005-une-scene-arrive-au-lieu-doccuper-lecran-fr.md) exige que les scènes arrivent à
mesure que le lecteur défile. Les deux sont contrôlées aujourd'hui en lisant le balisage, c'est-à-dire
au niveau exact où le défaut de l'ADR-0004 paraissait correct.

La Content-Security-Policy du site pose `style-src 'self'` sans `unsafe-inline`, et les empreintes de
ses scripts sont calculées à la construction. Que le navigateur accepte le résultat n'est vérifié
nulle part.

Les contrôles qu'une telle suite demanderait sont asynchrones par nature : un runtime WebAssembly
finit de démarrer, un script démasque un contrôle, un défilement déclenche une apparition. L'attente
est donc une propriété de chacun d'eux, pas un détail accessoire de quelques-uns.

L'environnement est asymétrique. Le conteneur de développement porte déjà Chromium ; le runner de
GitHub ne porte aucun navigateur, donc toute suite navigateur ajoute une étape d'installation et des
minutes à chaque passage du pipeline.

Deux règles permanentes du dépôt pèsent sur le choix. Une dépendance ne s'ajoute pas sans raison
claire, et une décision arrive avec quelque chose qui échoue quand elle est enfreinte
([`CONTRIBUTING.md`](../../../CONTRIBUTING.md)).

Rien dans le dépôt n'énonce de matrice de navigateurs. Le site est un ensemble de documents statiques
plus une application WebAssembly, maintenu par une seule personne, déployé sur un seul hôte.

## Décision

**Les contrôles navigateur du site sont pilotés par Playwright, qui pilote Chromium directement.**

## Justification

Chaque défaut du Contexte est un fait sur une page rendue — une application blanche, une règle
écartée, un contrôle qui ne fait rien, un document plus large que sa fenêtre. Lire l'artefact n'en
voit aucun, et dans trois cas sur quatre l'artefact était correct. Cela règle le fait qu'un
navigateur doit faire le contrôle ; le reste de cette section porte sur le pilote, et la réponse
découle des deux faits qui font échouer les suites navigateur en pratique.

Le premier est l'attente. Chaque contrôle nommé au Contexte atterrit après quelque chose
d'asynchrone, donc un pilote qui ne répond qu'à « qu'y a-t-il à l'écran à cet instant » rend
l'attente à l'auteur — et l'attente qu'un auteur écrit sous contrainte de temps, c'est un `sleep`.
Une suite bâtie sur des `sleep` est lente quand elle passe et intermittente quand elle échoue, et un
rouge intermittent apprend au mainteneur à ignorer le rouge, ce qui coûte plus que la suite ne
rapporte. Les assertions de Playwright réessaient jusqu'à une échéance, donc l'attente est l'affaire
de l'outil plutôt qu'une discipline que ce dépôt devrait tenir. C'est la raison unique qui l'emporte
sur les autres.

Le second est que les contrôles demandés au Contexte devraient être des instructions plutôt que des
reconstitutions. Refuser le script pour tout un contexte de navigation, émuler une fenêtre, émuler
une préférence de mouvement réduit, et observer la violation que lève une politique de sécurité sont
chacun des besoins de cette suite, une fois ou plus, et chacun est quelque chose que le pilote choisi
*fait* plutôt que quelque chose que la suite doit simuler. Un pilote qui ne les a pas ne rend pas les
contrôles impossibles ; il fait de chacun une petite mécanique à maintenir, et la mécanique dans une
suite de tests, c'est là que vivent les bugs de la suite elle-même.

Le coût est d'une dépendance, et le pilote est versionné avec le navigateur qu'il pilote. Ça compte
face à la règle du dépôt sur les dépendances : une pile qui apparie un binaire de driver à un binaire
de navigateur, ce sont deux choses à tenir accordées, et les tenir accordées est de la maintenance
achetée en échange de faire tourner la même suite sur des navigateurs que ce site ne prétend jamais
contrôler.

Le temps de CI ajouté est réel, et c'est le prix de la classe de défaut ci-dessus qui atteint la
production sans s'annoncer. Il est borné — un téléchargement de navigateur, mis en cache, sur un
runner qui n'en porterait aucun — et il achète le premier contrôle disant que le playground
fonctionne, ce dont il n'en a aucun aujourd'hui.

Enfin, la portabilité que vendent les alternatives vaut peu ici. Un mainteneur, un hôte, aucune
matrice de navigateurs énoncée : un second moteur dans la suite ajouterait un coût immédiat et
répondrait à une question que personne dans ce dépôt n'a posée.

## Alternatives envisagées

### Selenium et le protocole WebDriver

Envisagé parce que c'est le standard, qu'il est neutre vis-à-vis des éditeurs, et qu'une suite écrite
contre lui tourne sur Firefox et Safari sans être réécrite — ce qui répondrait à la seule chose qu'une
suite Chromium seule ne peut pas, à savoir un défaut que seul un autre moteur montre.

Écarté parce que cette neutralité n'est pas gratuite et que ce dépôt ne dépense pas ce qu'elle
achète. Une pile WebDriver apparie un binaire de driver à chaque navigateur et versionne les deux
l'un contre l'autre, ce qui est de la maintenance permanente ; et elle laisse l'attente à l'auteur,
c'est-à-dire précisément là où les contrôles asynchrones du Contexte se transformeraient en `sleep`.
Payer de la maintenance pour une matrice de navigateurs qu'aucune exigence ne demande, dans la
monnaie du mode de panne le plus susceptible de tuer la suite, est le mauvais échange ici.

### Cypress

Envisagé parce que son ergonomie d'échec est la meilleure des candidats — un lanceur qui remonte le
temps et montre la page à chaque étape — et parce qu'une petite suite en profite plus qu'une grande.

Écarté pour deux raisons propres à ce site plutôt que générales. Il exécute le code de test à
l'intérieur de la page contrôlée, et il retire la content-security-policy de la réponse pour pouvoir
le faire ; une suite qui retire la politique ne peut pas être ce qui prouve que la politique est
appliquée, et c'est l'un des quatre contrôles. Et un contexte de navigation avec le script refusé
n'est pas quelque chose qu'il propose, puisqu'il a besoin du script pour tourner — donc l'exigence de
l'ADR-0004 ne pourrait pas être contrôlée dans l'état qui a exposé le défaut.

### Puppeteer

Envisagé parce qu'il pilote Chromium directement, comme la décision, avec une surface plus petite et
une couche d'abstraction en moins — et l'instinct du dépôt est de préférer le plus petit outil.

Écarté parce que ce qu'il laisse de côté est précisément ce pour quoi on choisit. L'attente d'un
sélecteur y est ; les assertions qui réessaient jusqu'à une échéance, non, ni la bibliothèque
d'assertions qui les porterait. L'adopter, c'est écrire cette couche ici, c'est-à-dire la mécanique
contre laquelle la Justification argumente, et la surface plus petite cesse de l'être une fois la
couche manquante comptée.

### jsdom ou happy-dom sous un lanceur de tests unitaires

Envisagé parce que c'est de loin l'option la moins chère : pas de navigateur, pas d'installation en
CI, pas de minutes, et elle permettrait d'exercer les scripts du site, ce qui n'est pas le cas
aujourd'hui.

Écarté parce qu'il n'a ni moteur de rendu ni politique de sécurité. Le contrôle de débordement n'a
rien à mesurer, le contrôle de politique n'a rien à appliquer, l'apparition n'a pas de défilement, et
un playground dont tous les assets partent en 404 se parse parfaitement. Il rapporterait un succès
sur les quatre défauts du Contexte, ce qui le rend pire que pas de contrôle du tout : une suite verte
est une affirmation.

### Continuer à lire l'artefact, et n'ajouter aucun contrôle navigateur

Envisagé parce que les trois scripts existants sont bons, ne coûtent presque rien, et couvrent
beaucoup — et parce que la réponse honnête à « est-ce que ça doit exister » est parfois non.

Écarté parce que le Contexte liste quatre défauts qui ont atteint ou failli atteindre la production à
travers eux, et que dans trois cas l'artefact inspecté était correct. L'écart n'est pas un écart dans
le soin avec lequel ces scripts lisent ; c'est qu'ils lisent au lieu de rendre.

## Conséquences

### Positives

La classe de défaut se referme : les faits sur une page rendue sont contrôlés par quelque chose qui
rend la page. Trois des quatre pannes du Contexte deviennent impossibles à livrer en silence.

Le playground obtient son premier contrôle disant qu'il fonctionne. Jusqu'ici rien n'affirmait plus
que la cohérence de deux chaînes dans son balisage.

Deux décisions acceptées gagnent un contrôle qui les exerce au lieu de les inspecter. L'exigence sans
script de l'ADR-0004 peut être contrôlée dans l'état qui a exposé son défaut, et l'arrivée de
l'ADR-0005 peut l'être sur son état final plutôt que sur la présence d'un nom de classe.

### Négatives

Le dépôt gagne une seconde chaîne d'outils. Il n'a été que scripts bash et node depuis le début, et
un lanceur navigateur est un autre genre de chose à garder en marche, à mettre à jour et à déboguer.

Chaque passage du pipeline paie un navigateur dont il n'a pas besoin par ailleurs, en téléchargement
et en minutes.

La version du navigateur est épinglée par un paquet plutôt que choisie. Quand le paquet bouge, le
navigateur bouge, et un contrôle peut virer au rouge pour une raison qui n'a rien à voir avec le
site.

### Risques

**Le flake est la mort standard d'une suite navigateur**, et celle-ci n'y échappe pas. La parade est
une règle plutôt qu'un espoir : les reprises restent à zéro, donc un échec intermittent est un défaut
du contrôle, à corriger ou à supprimer, et aucun contrôle n'attend un délai fixe. Cette seconde
moitié est vérifiable et elle est vérifiée — voir les actions de suivi.

**Un seul moteur est contrôlé.** Un défaut que seuls Firefox ou Safari manifestent est hors de cette
suite, et aucune partie du dépôt ne doit se lire comme prétendant le contraire. Ajouter un second
moteur est une décision ultérieure avec son coût propre, pas un oubli dans celle-ci.

**La dérive vers les captures d'écran.** Le rendu des polices diffère entre le conteneur de
développement et le runner, donc la comparaison au pixel serait du flake avec un signal faible
attaché. Elle est refusée ici pour que l'ajouter plus tard soit une décision que quelqu'un prend
plutôt qu'une dérive que personne ne remarque.

## Actions de suivi

* Chaque contrôle est cassé exprès avant d'atterrir : casser ce qu'il protège, regarder le rouge,
  remettre. Ce qui a été cassé et ce qu'il a dit est consigné dans le commit qui l'ajoute, selon
  [`CONTRIBUTING.md`](../../../CONTRIBUTING.md#a-decision-comes-with-something-that-fails-when-it-is-broken).
* Le script qui lance la suite refuse un contrôle qui attend un délai fixe, si bien que la moitié
  « pas de sleep » de la règle sur le flake fait échouer la construction au lieu de reposer sur la
  relecture.
* La suite tourne dans le job de construction, sur l'artefact que la construction vient de produire,
  et un mainteneur lance le même script à la main. Contre quoi elle tourne, et comment, est de la
  spécification : c'est documenté dans le [guide de déploiement](../deployment-fr.md), pas ici.
* Un second moteur de navigateur, et des règles d'accessibilité automatisées, sont chacun leur propre
  décision. Aucun des deux n'est impliqué par celle-ci.

## Références

* [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md) — le contrôle parti mort en
  production, et l'exigence que cette suite peut désormais exercer
* [ADR-0005](0005-une-scene-arrive-au-lieu-doccuper-lecran-fr.md) — l'arrivée que cette suite
  contrôle sur son état final
* Le tableau de dépannage du guide de déploiement, qui liste le playground blanc comme une panne
  rencontrée
