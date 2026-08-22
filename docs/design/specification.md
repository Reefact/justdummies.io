# JustDummies — Spécification du site officiel

**Version 1.0** — la 1.0 marque la rupture avec les brouillons 0.x, pas un jalon d'une
série. Ce document ne sera plus renuméroté : son historique est celui du dépôt, et
`git log docs/design/specification.md` répond mieux qu'un journal des modifications
recopié à la main, qui est lui-même une chose qui se périme.

**Langue :** français, par décision (§1.4).

---

## 1. Ce document

### 1.1 Ce qu'il est

La référence commune pour concevoir et construire le site de **JustDummies**,
bibliothèque .NET de génération de dummies contraints.

Il décrit **ce qui est décidé et pourquoi**. Il ne décrit jamais ce qui existe.

### 1.2 Pourquoi cette distinction est la première section

Les brouillons 0.1 à 0.3 ont vieilli en six semaines. L'examen de cette dérive donne
un résultat net, et c'est lui qui a dicté la structure de cette version :

> **Le raisonnement n'a pas bougé. Ce qui a pourri, ce sont les faits recopiés et la
> liste des tâches.**

Les trois actes de la narration, la règle de continuité, le pont catalogue du
playground, les règles éditoriales du comparatif : tout cela est resté juste. En
revanche le document annonçait un nombre de diagnostics faux, décrivait des paquets
non publiés qui l'étaient, citait une commande CLI qui n'a jamais existé sous cette
forme, et organisait le travail en phases dont la première était terminée avant que
l'encre sèche.

Aucune de ces erreurs ne venait d'un défaut de rédaction. Elles venaient toutes de la
même cause : **le document énonçait des choses dont il n'était pas la source.**

### 1.3 Ce qu'il ne contient jamais

Ces interdits sont la principale différence avec les brouillons. Ils sont des règles
sur le document lui-même.

| Interdit | Raison | Où ça vit à la place |
|---|---|---|
| **Un fait dont ce document n'est pas la source** — nombre de diagnostics, numéro de version, nom de paquet, syntaxe de commande, identifiant de règle | Ces choses changent sans que personne pense à rouvrir une spécification | §2, sous forme de renvoi à la source |
| **Un état** — ce qui est construit, publié, en cours, manquant | L'état est ce qui se périme le plus vite, et il se périme silencieusement | Le dépôt, les paquets, la CI |
| **Un calendrier** — phases, ordre des livraisons, ce qui entre dans quel lot | Un plan est faux dès la première surprise, et il en survient toujours une | Le suivi de projet, quelle qu'en soit la forme |
| **Un journal des modifications** | Le dépôt en tient déjà un, exact | `git log` |
| **Une décision sans son raisonnement** | Une décision dont on a perdu la raison sera défaite par accident | §17, le registre de décisions |

Test à appliquer à toute phrase qu'on veut ajouter : *si l'implémentation changeait
mais que la décision tenait, cette phrase devrait-elle être réécrite ?* Si oui, elle
n'a pas sa place ici.

### 1.4 Sa langue

Le français, en continuité des brouillons dont il descend, et parce que son lecteur
principal travaille dans cette langue.

C'est une exception assumée à la règle du dépôt, qui impose l'anglais partout
ailleurs — code, commentaires, commits, branches, pull requests. L'exception est
bornée aux documents de conception sous `docs/design/`, et `CONTRIBUTING.md` la
nomme. Une exception écrite est une règle ; une exception tacite est une dérive.

### 1.5 Ce qu'il ne fige pas

- la direction artistique détaillée ;
- les textes marketing définitifs ;
- le contenu de la documentation, qui appartient à la bibliothèque (§7.5) ;
- les détails internes du tool de génération.

---

## 2. Faits volatils et leurs sources

Cette section remplace toutes les valeurs que les brouillons recopiaient. **Aucun
chiffre, aucune version, aucune commande n'est écrit ici.** Chaque ligne dit où le
site va chercher la vérité, et par quel mécanisme.

| Fait | Source de vérité | Comment le site l'obtient |
|---|---|---|
| Versions des paquets | Le registre NuGet, et `Directory.Packages.props` pour celle que le playground exécute | Métadonnées centralisées, une seule déclaration (§14.1) |
| Commandes d'installation | Les métadonnées centralisées, dérivées du nom de paquet et de son état de publication | Rendues, jamais saisies dans une page (§14.1) |
| Nom et syntaxe des commandes du tool | Le tool lui-même, via son aide | Confronté en intégration continue à ce que le site affiche |
| Identifiants, titres et messages des diagnostics | Le paquet de catalogue de diagnostics publié par la bibliothèque | Consommé comme paquet, jamais recopié (§14.2) |
| **Nombre** de diagnostics, et leur répartition en familles | Le même catalogue | Compté à la génération. Le site n'énonce jamais un nombre qu'il n'a pas compté |
| Surface exposable du playground | L'assembly de la bibliothèque référencée | Catalogue généré au build (§10.4) |
| Valeurs générées affichées | La bibliothèque elle-même | Produites au build, seed fixe (§14.3) |
| Données du tableau comparatif | Un fichier de contenu validé par schéma, daté | Rendu depuis ce fichier (§11) |
| Contenu des pages de documentation | La documentation utilisateur de la bibliothèque, à un tag de release publié | Instantané atomique, jamais réécrit (§7.5) |

**Règle générale.** Si le site affiche une information dont la bibliothèque, un paquet
ou un outil est la source, cette information descend jusqu'au site par un mécanisme,
et le mécanisme échoue bruyamment quand la source change. Recopier est interdit, y
compris « provisoirement ».

C'est la règle la plus importante du document. Les autres décrivent un produit ;
celle-ci décrit ce qui empêche le produit et sa vitrine de diverger.

---

## 3. Vision produit

### 3.1 Ce que JustDummies n'est pas

- un framework de property-based testing ;
- un moteur de fuzzing ;
- un générateur de données réalistes ;
- une bibliothèque de mocks ;
- un constructeur automatique de graphes d'objets par réflexion ;
- un outil pour simuler un environnement métier complet.

### 3.2 La promesse

> **Produire facilement les valeurs arbitraires dont un test a besoin, tout en
> exprimant explicitement les contraintes que ces valeurs doivent respecter.**

Le mot « just » décrit le périmètre, pas la puissance. Le site doit rendre cette
lecture évidente : une bibliothèque qui assume ses limites est plus crédible qu'une
qui prétend tout couvrir.

### 3.3 Les six choses que le visiteur doit comprendre

1. une valeur peut être sans importance pour le comportement testé ;
2. elle doit néanmoins respecter les préconditions du code de production ;
3. JustDummies permet de décrire ces contraintes de façon fluide ;
4. une valeur contrainte devient un objet du domaine en une opération ;
5. le test final ne garde que ce qui compte pour son intention ;
6. **un échec reste rejouable** : une exécution séquentielle qui échoue rapporte son
   seed, et ce seed reproduit exactement les mêmes valeurs.

Le sixième point n'est pas une commodité. C'est, avec le refus explicite d'une
déclaration contradictoire, l'une des deux propriétés qui distinguent réellement la
bibliothèque de ses voisines. Le site les traite comme telles.

### 3.4 Les deux niveaux de détection

À énoncer distinctement, car ce sont deux arguments et non un :

- **à la déclaration**, à l'exécution : une chaîne de contraintes contradictoires
  échoue au moment où elle est déclarée, pas au moment où une valeur est tirée, et le
  message nomme les deux contraintes en cause ;
- **à la compilation** : des analyzers signalent le même défaut avant l'exécution.

Une bibliothèque qui échoue tôt et clairement est un argument. Une bibliothèque qui
fournit des analyzers en est un autre. Les confondre en perd un.

### 3.5 Les analyzers sont un argument de premier plan

Ils sont **embarqués dans le paquet principal** : les installer ne demande rien de
plus que d'installer la bibliothèque. C'est cette caractéristique qui en fait un
argument de vente et non une note de bas de page, et le site doit le dire
explicitement.

La promesse retenue :

> **JustDummies détecte les erreurs qui rendent vos dummies invalides, trompeurs ou
> impossibles à reproduire.**

Le site présente les diagnostics **par familles**, et l'ordre de présentation est
lui-même une information : la famille la plus nombreuse vient en premier, parce que
c'est celle qui prolonge l'acte III de la narration. Le nombre de familles, leur
composition et leur cardinalité viennent du catalogue (§2) — jamais d'ici.

### 3.6 Avertissement de sécurité

À publier sur le site, pas seulement dans la documentation : les generators
produisent des **valeurs de test, pas des secrets**. Aucun mot de passe, jeton, clé ou
identifiant de sécurité ne doit en être tiré. La bibliothèque le dit ; le site le
répète.

---

## 4. Publics

Chaque public correspond à un livrable qui le sert. Une exigence d'audience sans page
qui la porte est une intention, pas une décision.

| Public | Ce qu'il doit pouvoir faire | Livrable |
|---|---|---|
| **Développeur .NET qui découvre** | Comprendre ce qu'est un dummy contraint, et installer | Page principale, actes I et II |
| **Développeur test / DDD / design by contract** | Reconnaître le problème des paramètres obligatoires sans intérêt, et les invariants des value objects | Page principale, scènes 1 à 5 |
| **Lead ou architecte** | Percevoir une API cohérente, sans magie à l'exécution | Page principale, écosystème, documentation |
| **Contributeur** | Trouver le dépôt, les règles, les issues | Pied de page, liens externes |
| **Développeur déjà équipé** | Répondre en une minute : ça remplace ou ça complète ? qu'est-ce que mon outil ne fait pas ? puis-je l'essayer sur un seul test ? | Page de positionnement (§11) |

La réponse à la troisième question du dernier public est **oui**, et le site doit le
dire explicitement. C'est le principal levier d'adoption d'une bibliothèque de test :
pouvoir l'essayer sur un fichier sans engager l'équipe.

« En une minute » est une contrainte, pas une figure de style. Elle interdit que la page
de positionnement ouvre sur l'appareil comparatif qu'elle construit : les trois questions
sont répondues avant le premier critère, et §11.3 en tire l'ordre de la page.

---

## 5. Principes UX et éditoriaux

### 5.1 Montrer avant d'expliquer

Du vrai code, des transformations visibles, de vraies valeurs, un test qui évolue, un
playground utilisable. Les longs paragraphes marketing sont proscrits sur la page
principale.

### 5.2 Le code est l'objet visuel principal

La direction graphique ne dépend d'aucune illustration générique — développeurs,
robots, cubes 3D, images décoratives. Les éléments visuels sont le code C#, les
valeurs produites, les contraintes, les états du test, le terminal, les fichiers
produits, et les transitions entre une construction verbeuse et une intention concise.

### 5.3 Le mouvement doit expliquer

Toute animation répond à une question fonctionnelle : qu'est-ce qui compte dans ce
test ? quelles contraintes sont nécessaires ? comment la valeur devient-elle valide ?
que fait cette opération ? quelle complexité disparaît ?

Une animation qui ne répond à aucune question est décorative, et les animations
décoratives restent rares et discrètes.

### 5.4 Une seule idée forte par écran

Chaque étape porte un message court, une transformation principale, un point focal
unique. C'est la règle qui arbitre quand deux éléments se disputent l'attention.

### 5.5 La page principale vend, la documentation explique

La page principale ne documente ni les conventions internes du tool, ni ses cas
d'échec, ni la liste exhaustive des diagnostics, ni le catalogue de l'API, ni le
détail du comparatif.

### 5.6 Aucune bibliothèque tierce dans les exemples publics

Les exemples visibles depuis la page principale, le hero, le playground et l'image de
partage utilisent le runner et les assertions les plus banals possible.

Ce n'est pas un jugement sur les bibliothèques d'assertion. C'est §5.4 appliqué : un
visiteur qui découvre en même temps la notion de dummy contraint, la syntaxe `Any.` et
une bibliothèque d'assertion qu'il ne connaît pas a trois points focaux, donc aucun.
L'assertion doit être invisible.

Les pages de documentation et d'exemples, où l'intégration *est* le sujet, montrent
les autres bibliothèques.

### 5.7 Rien de visible ne mène nulle part sans que son état soit dit

Un composant, une commande ou un lien présenté sur le site est soit disponible, soit
accompagné d'un libellé d'état lisible.

Modalités, qui sont des exigences d'accessibilité autant que d'honnêteté :

- l'état est affiché **en clair**, jamais réservé au survol — il n'y a pas de survol
  sur mobile ;
- un élément en attente reste **focalisable** et porte `aria-disabled`, jamais
  l'attribut `disabled`, qui le retire de la navigation clavier et rend son
  explication inatteignable ;
- aucune commande copiable n'est proposée pour ce qui n'est pas installable ;
- l'état de chaque composant est une donnée de contenu, pas une décision prise dans un
  composant d'interface ;
- **contrôlé en intégration continue** : un composant présenté comme disponible dont
  la version n'est pas résoluble fait échouer le build. C'est ce contrôle qui fait la
  différence entre une règle et une intention.

### 5.8 Le dummy est la figure de la maison, jamais le sujet

Le mannequin de crash-test est l'objet que le nom du produit désigne. Il peut donc revenir
d'une page à l'autre sans contredire §5.2 : ce que §5.2 refuse, c'est qu'une direction
graphique repose sur des images empruntées — développeurs souriants, robots génériques,
cubes 3D —, pas qu'un produit montre la chose qu'il nomme.

La distinction n'est pas un jeu de mots, c'est elle qui décide si les dessins du site sont
une identité ou une facilité. Les modalités ci-dessous sont ce qui garde la première
réponse vraie.

- **Un seul par page.** Deux dessins sur un même écran, et la page parle d'eux.
- **Seulement là où la page n'a rien à montrer** : une 404, une marge que la mise en page
  laisse vide, une colonne que la mesure du texte n'atteint pas. Jamais sur un écran qui
  démontre quelque chose (§5.4).
- **Jamais devant du texte ni devant du code.** Il passe derrière, ou il n'est pas là. La
  seule proximité permise est celle que le texte a choisie : sur /about, la prose longe sa
  silhouette parce que la mise en page le lui demande, et ne le touche jamais.
- **Il disparaît plutôt que de rétrécir.** En dessous de la place qu'il lui faut, il n'est
  pas dessiné du tout : une figure dont la taille dépend de la fenêtre est une figure dont
  personne ne connaît la taille.
- **Une seule famille graphique** — même origine, même palette, même lumière. Un dessin
  d'une autre facture ferait de la série une collection.
- **Contrôlé en intégration continue** : un second dessin sur une même page, ou un dessin
  qu'une ligne de texte touche, fait échouer la suite navigateur — qui compare le texte aux
  pixels peints, pas au CSS qui les place. Les deux premières modalités cessent ainsi d'être
  des intentions.

  Le contrôle voit les dessins qui se déclarent comme tels, par un attribut. Un dessin ajouté
  sans cette marque lui échappe : c'est la limite du garde-fou, et elle est écrite ici plutôt
  que découverte. Les autres modalités relèvent de la relecture, et ce paragraphe est l'endroit
  où elles sont énoncées plutôt que supposées.

---

## 6. Langues

### 6.1 Locales

L'anglais est la **source de vérité éditoriale** et est servi à la racine, sans
préfixe. Le français est une traduction, servie sous un préfixe de locale.

### 6.2 Schéma d'URL

Les segments de route sont **identiques dans toutes les locales**. Pas de slug
traduit : le gain de référencement ne compense ni la table de correspondance à
maintenir, ni l'impossibilité d'un sélecteur de langue qui reste sur la page courante.

Toute route ajoutée l'est simultanément dans le schéma de chaque locale, même si la
traduction n'existe pas encore.

### 6.3 Négociation

**Aucune redirection automatique** fondée sur l'en-tête de langue ou la
géolocalisation. Elle casse le partage de liens, les previews et le référencement, et
empêche un francophone de lire délibérément la version anglaise.

Le sélecteur de langue est explicite, présent dans l'en-tête, et conduit à la page
équivalente dans l'autre locale. Un choix mémorisé côté client ne sert qu'à
présélectionner ce sélecteur ; il ne redirige jamais.

Le sélecteur ne porte pas de drapeau : un drapeau désigne un pays, pas une langue.

### 6.4 Traduction partielle

Une page n'existe dans une locale que si elle y est réellement traduite.

- pas de page à moitié traduite, pas de mélange de langues sur une page ;
- une locale où la page n'existe pas **n'apparaît pas** dans le sélecteur pour cette
  page : une offre qui mène à une page absente est pire que pas d'offre ;
- **une clé de contenu absente dans une locale fait échouer le build.** Elle ne se
  replie pas silencieusement sur l'anglais — un repli silencieux produit des pages
  mixtes que personne ne remarque ;
- une modification du contenu anglais marque sa traduction obsolète, et
  l'intégration continue le signale.

**L'interface du playground suit les mêmes règles i18n que le reste du site.** Labels,
boutons, titres de page, et les messages que le playground compose lui-même (une limite de
saisie propre au bac à sable, par exemple) sont traduits comme n'importe quel contenu du
site — mêmes règles ci-dessus, y compris l'échec de build sur une clé manquante.

Seul **tout contenu dont la bibliothèque JustDummies est la source** reste en anglais dans
toutes les locales — qu'il soit levé à l'exécution (`DummyException` et ses sous-classes) ou
extrait de sa documentation XML au moment du build (noms de méthode, résumés, descriptions de
paramètre affichés par le playground, §10.7). Dans les deux cas, ce texte vient d'un paquet
publié hors de ce dépôt et reflète des identifiants et une documentation d'API anglais, pas du
contenu écrit ici — le dépôt du site n'a pas la main dessus. Cette exception est assumée et
documentée, pas subie — la retraduire serait le playground formulant son propre avis sur le
contenu de la librairie plutôt que de le montrer tel quel.

### 6.5 Conséquences techniques

Routage i18n configuré avant la première page. Collections de contenu par locale.
`hreflang` réciproques et `x-default` vers l'anglais. `<html lang>` correct. URL
canonique par locale, **jamais croisée**. Un sitemap par locale, agrégé dans un index.
Les design tokens et les composants d'interface sont indépendants de la locale, et
aucune chaîne affichée n'est écrite en dur dans un composant.

Le texte français est en moyenne 15 à 20 % plus long que l'anglais : les gabarits, les
boutons et les cartes se valident avec le français, qui est le cas défavorable.

---

## 7. Architecture de l'information

### 7.1 Navigation

Elle reste courte. Elle porte le positionnement comparatif, le playground, la
documentation et le dépôt.

La **commande d'installation est présente en permanence dans l'en-tête** dès que le
hero est dépassé, sous forme compacte avec bouton de copie. Elle n'apparaît pas au
niveau du hero, qui porte déjà son propre appel à l'action.

Motif : répéter le bloc d'installation complet à chaque moment fort produit une cécité
au bloc, et chaque occurrence entre en concurrence avec le point focal de sa scène, ce
qui contredit §5.4. Une commande permanente offre une meilleure disponibilité — à tout
instant, et pas seulement aux moments de récompense — pour un coût visuel bien
moindre.

### 7.2 Arborescence

Exprimée pour une locale, et reproduite à l'identique dans les autres.

```text
/
├── playground
├── why-justdummies
├── docs
│   ├── guides
│   ├── generators
│   ├── packages
│   └── analyzers
├── examples
├── api
├── release-notes
│   └── {train}
│       └── v{majeure}
├── about
├── privacy
└── 404
```

Les sections de `/docs` sont des **décisions de route** : le schéma d'URL est décidé ici,
et §6.2 impose qu'il soit identique dans toutes les locales. Les **pages feuilles**, elles,
viennent de l'instantané (§7.5) et ne sont jamais énumérées ici — les lister serait
recopier un fait dont ce document n'est pas la source (§1.3).

La distinction est ce qui fait tenir l'ajout : décider que les règles d'analyzer vivent
sous `/docs/analyzers` est une décision d'architecture, qui survit à n'importe quel
changement de la bibliothèque ; écrire combien il y en a n'en est pas une.

`/release-notes` suit la même règle. Les quatre trains de release sont une décision de
route — ils survivent à n'importe quelle publication de la bibliothèque — et la majeure
est un segment de route, `v1`, jamais un point dans un chemin. Quelles majeures existent
à un instant donné vient de l'instantané (§7.5) et ne s'écrit pas ici. `/release-notes`
elle-même est une page : elle présente les trains et ce que chacun a publié en dernier,
et ne redirige vers aucun d'eux (ADR-0020).

### 7.3 Condition de publication d'une route

Ce document ne dit pas *quand* une route est publiée — c'est du calendrier (§1.3). Il
dit à quelles conditions elle *peut* l'être :

- son contenu est réellement utile à quelqu'un, et pas une page d'attente ;
- elle satisfait §6.4 dans chaque locale où elle apparaît ;
- ce qu'elle présente satisfait §5.7 ;
- elle n'apparaît dans la navigation que si les trois conditions précédentes tiennent.

### 7.4 Bloc d'installation

Composant unique, instancié aux moments de récompense de la narration et dans
l'en-tête sous forme réduite.

Il est conçu comme une **rangée à emplacements**, pas comme une composition figée :
son contenu s'étoffera — un lien vers la documentation, un vers le tool — et redessiner
la rangée à ce moment-là coûterait plus que la prévoir maintenant. Un emplacement dont
la cible n'existe pas encore suit §5.7.

Le contenu de chaque emplacement — nom de paquet, commande, URL — vient des
métadonnées centralisées (§2, §14.1).

### 7.5 Contenu repris de la bibliothèque

Les routes sous `/docs` rendent un contenu que **le site n'écrit pas**. Il est repris de
la documentation utilisateur de la bibliothèque, qui en reste l'unique auteur.

La reprise est **atomique et épinglée à un tag de release publié** — la version que le
site propose d'installer, de sorte que la documentation et la commande d'installation
soient deux affirmations sur le même artefact. Le raisonnement, les alternatives écartées
et le tag qui ancre l'instantané vivent dans le registre de décisions (§17), pas ici.

Trois conséquences, qui sont des règles et non des commodités :

- **§6.4 s'applique, et son exception ne couvre pas la reprise.** L'exception de §6.4 vise
  le contenu que la bibliothèque ne publie **qu'en anglais** — messages levés à
  l'exécution, documentation XML — et son motif est que le dépôt du site n'a alors aucun
  français à servir. La documentation utilisateur n'est pas dans ce cas : la bibliothèque
  la publie appariée et la tient à cette parité chez elle. Le lecteur reçoit donc sa
  locale, et c'est §6.4 qui s'applique, pas son exception. Le critère est là, et il porte
  sur **ce que la source publie**, jamais sur la nature du contenu. Le jour où la source
  cesserait d'être appariée, c'est la reprise qui échoue — pas une page qui part à moitié
  traduite ;
- **`/api` n'est pas concernée.** Sa source est la surface publique réfléchie depuis
  l'assembly (§2, §10.4), pas de la prose. Les deux répondent à deux questions distinctes
  — ce que l'API expose, et comment on s'en sert — et se citent sans se dupliquer ;
- **la péremption avertit, elle ne bloque pas.** Une documentation qui décrit une version
  dépassée est signalée, jamais transformée en échec de publication : le même régime que
  la fraîcheur du comparatif (§11.8), et pour un motif que §17 porte.

Rien de ce qui est repris n'est corrigé ici. Un défaut trouvé dans une page reprise se
corrige à la source, sans quoi la correction disparaît au prochain instantané.

---

## 8. Direction artistique

### 8.1 Positionnement

Produit développeur premium : précision, confiance, API expressive, puissance
maîtrisée, une personnalité qui ne verse pas dans l'enfantin. L'inspiration peut
emprunter le rythme narratif et l'espace de certaines pages produit, la précision d'un
outil comme Linear, les conventions visuelles d'un éditeur de code moderne — sans
copier aucun site existant.

### 8.2 Palette

Fond sombre presque noir, légèrement chaud. Surfaces graphite. Texte blanc cassé. Une
couleur d'accent vive et distinctive. Une couleur secondaire pour les valeurs
générées. Le vert réservé aux validations et au passage du test. Un corail ou rouge
doux réservé aux erreurs. Un ton neutre dédié aux marqueurs d'état de §5.7, distinct de
l'accent comme de l'erreur.

Les valeurs exactes vivent dans les design tokens, jamais dans ce document : ce sont
des faits que le code possède.

### 8.3 Typographie

Une sans-serif lisible et expressive, une monospace hautement lisible pour le code, le
terminal et les valeurs. Titres courts et généreux. Peu de capitales. Tailles fluides
entre mobile et desktop.

Les polices sont auto-hébergées si les licences le permettent, limitées en graisses,
accompagnées de fallbacks système solides, et **couvrantes pour les diacritiques
français**, capitales accentuées et guillemets compris — plusieurs polices de
développeur populaires ont une couverture Latin Extended incomplète, et c'est à
vérifier au moment du choix, pas après.

### 8.4 Mode clair

Le site peut être conçu en mode sombre d'abord. Mais les tokens doivent permettre un
mode clair, et l'architecture CSS ne doit pas le rendre impossible : chaque couleur est
nommée par ce qu'elle fait, jamais par ce qu'elle est. Un futur thème clair redéfinit
les mêmes noms ; il n'a pas à chasser des littéraux dans les composants.

### 8.5 Identité

Marque typographique, symbole lisible à 16 px utilisable en favicon et en avatar,
déclinaison monochrome, gabarit d'image de partage par locale. L'image de partage
contenant le logo, le logo la précède.

---

## 9. La narration

C'est le cœur du site, et la partie de ce document qui a le mieux résisté au temps.

### 9.1 Technologie narrative

Le scroll pilote une narration visuelle continue : sections longues, panneaux
adhérents, timeline liée à la progression, transformation progressive du même code,
transitions de focus entre test, value object, chaîne de contraintes, terminal et
sortie de test.

Le parallax peut créer de la profondeur mais n'est pas la technologie principale.

### 9.2 Règle de continuité

Le visiteur ne doit pas avoir l'impression de consulter une succession de slides
indépendantes. La séquence est **une seule transformation**, en trois actes.

```text
ACTE I — la validité
  un test incomplet
  → une valeur sans importance mais qui doit être valide
  → les invariants du value object
  → la chaîne de contraintes qui les satisfait
  → la valeur devient un objet du domaine, en une opération
  → le test fonctionne, mais il en dit encore trop

ACTE II — la concision
  → l'installation
  → un generator d'objet métier, engendré par le tool
  → le test réduit à son intention
  → le test passe au vert

ACTE III — la reproductibilité
  → le test vert redevient rouge par intermittence
  → l'échec rend son seed
  → le même seed reproduit exactement le même échec
```

### 9.3 Chaque acte se termine par une sortie

Un visiteur convaincu à la fin de l'acte I n'a aucune raison de continuer, et la page
doit le laisser partir avec la commande d'installation en main.

Les sorties sont **graduées** : chacune correspond à ce que le visiteur a compris à cet
instant — la bibliothèque seule, puis la bibliothèque et le tool, puis l'offre
complète. Une sortie qui propose ce que le visiteur n'a pas encore vu est du bruit.

### 9.4 La charnière de l'acte III

C'est le point de couture le plus délicat de la page : le test vient de passer au
vert, et on va montrer qu'il peut redevenir rouge. Sans phrase de charnière explicite,
le lecteur croit à un second site collé au premier.

Une phrase de charnière est donc **obligatoire** à l'ouverture de l'acte III. Elle
n'est pas décorative : elle est ce qui relie les deux actes. Sa formulation est un
travail éditorial ; son existence est une décision.

### 9.5 Le rouge n'est pas dramatisé

L'intermittence est un constat sur la nature des valeurs arbitraires, pas un échec de
la bibliothèque. L'acte III explique une propriété ; il ne met pas en scène un
problème que le produit aurait créé.

### 9.6 Ce que l'acte III ne promet pas

La reproductibilité est garantie pour les exécutions **séquentielles**. Le parallélisme
exige un seed par unité de travail. La page ne promet jamais plus que la bibliothèque,
et la formulation retenue doit rester compatible avec la description du paquet.

### 9.7 Ce que la narration coûte

Chaque scène animée doit être construite **quatre fois** : desktop, mobile, mouvement
réduit, et sans JavaScript. C'est le vrai coût d'une scène, et il se budgète avant
d'écrire la première.

Quand ce coût devient intenable, les ajustements se font dans cet ordre, du moins
coûteux au plus coûteux pour la narration :

1. fusionner deux scènes structurellement proches d'un même acte ;
2. fusionner la charnière et la scène qui la suit ;
3. rétrograder un acte entier en bloc statique.

L'ordre est délibéré, et le décider d'avance évite de le décider sous contrainte.

### 9.8 Le hero

Il présente la marque et permet une première interaction, sur une expression
pré-remplie modifiable.

L'expression retenue doit enchaîner **plusieurs maillons** et combiner **plusieurs
natures de contrainte**, pour montrer le DSL fluide plutôt qu'un appel isolé. Une
expression triviale se lit comme un équivalent d'une fonction du framework et gaspille
les premières secondes.

Contraintes de chargement :

- le contenu principal est disponible sans charger le runtime .NET ;
- le premier affichage n'en dépend pas ;
- le runtime n'est **jamais** chargé sans action explicite du visiteur ;
- avant chargement, la valeur affichée est une vraie valeur produite au build par la
  vraie bibliothèque (§14.3) ; après chargement, les valeurs sont produites en direct.

**Il n'existe qu'un seul producteur de valeurs, la bibliothèque.** Aucun générateur
n'est écrit en JavaScript, donc aucune divergence n'est possible.

### 9.9 Le comportement à ne pas neutraliser

Le champ étant modifiable, un visiteur peut composer une déclaration contradictoire et
recevoir le refus explicite de la bibliothèque, à la déclaration. **La démonstration se
défend elle-même**, et ce comportement ne doit pas être neutralisé au prétexte
d'éviter une erreur en page d'accueil.

C'est l'unique exception à §14.4 : la règle porte sur ce que le site publie, pas sur ce
qu'un visiteur saisit.

---

## 10. Le playground

### 10.1 Nature

Une application exécutée **entièrement dans le navigateur**, sans backend. Le visiteur
ne saisit pas un programme complet : l'interface affiche un préfixe et un suffixe
fixes, et il édite ce qui se trouve entre les deux.

### 10.2 Ce que le visiteur doit pouvoir faire

Choisir ou saisir une expression, générer une valeur, modifier une contrainte,
régénérer immédiatement, copier le code complet, et **comprendre une erreur sans rien
savoir de l'implémentation du parser**.

### 10.3 Ce qu'il ne fait jamais

Exécuter du JavaScript saisi par le visiteur, compiler du code libre, effectuer un
appel réseau arbitraire, accéder au système de fichiers, ou persister une saisie
ailleurs que dans le navigateur.

### 10.4 Le pont vers la bibliothèque

C'est la décision structurante du playground, et celle qui détermine s'il reste
synchronisé avec la bibliothèque ou dérive en silence.

**Décision : un catalogue de code, généré au build depuis les métadonnées de
l'assembly référencé.**

Les deux options écartées, avec leur motif :

- **un registre écrit à la main** — rien ne garantit qu'un generator ajouté à la
  bibliothèque soit ajouté au playground. La dérive n'est pas un risque, c'est une
  certitude à quelques versions d'échéance, et elle est silencieuse : rien ne casse,
  la contrainte « n'existe pas », voilà tout ;
- **la réflexion à l'exécution** — l'élagage IL, indispensable pour qu'une application
  WebAssembly reste d'une taille acceptable, supprime ce qui n'est atteint que par
  réflexion. Les défaillances n'apparaissent **pas** en développement, où l'élagage est
  désactivé : elles apparaissent sur l'artefact publié, souvent après la mise en ligne.
  Sécuriser cette voie exigerait d'annoter chaque point d'entrée, c'est-à-dire de
  reconstituer à la main le registre qu'on voulait éviter.

Ce que le catalogue apporte :

- **aucune réflexion à l'exécution**, donc compatibilité avec l'élagage ;
- **aucune dérive possible** : il est régénéré à chaque build depuis la version
  épinglée ;
- une **source unique** alimentant l'interpréteur, la validation sémantique, les
  messages d'erreur, les exemples et une future autocomplétion ;
- un bris de compatibilité de la bibliothèque devient une **erreur de compilation du
  site**, pas un défaut en production.

### 10.5 Catalogue complet, interface sélective

Trois règles distinctes, et les confondre est l'erreur à éviter :

- **le catalogue est complet.** Toute la surface publique y figure, et une omission
  fait échouer le build ;
- **le parser accepte tout le catalogue.** Un visiteur qui saisit un élément peu mis en
  avant obtient un résultat correct ;
- **l'interface ne met en avant qu'une sélection.** Exemples, suggestions et aide en
  ligne ne couvrent qu'un sous-ensemble choisi.

C'est l'inverse d'une politique d'opt-in, et c'est délibéré. En opt-in, un élément
oublié produit un playground silencieusement incomplet — un défaut invisible. Ici, il
produit une erreur de build immédiate, dont la résolution prend une minute : soit on
l'expose, soit on documente pourquoi non.

### 10.6 Où vit l'exclusion

Un élément peut être exclu du catalogue, avec un motif obligatoire.

**Cette liste d'exclusions vit dans le dépôt du site**, pas dans la bibliothèque. La
bibliothèque n'a à porter aucune préoccupation liée au site : c'est une bibliothèque
sans dépendance, et un attribut dont l'existence n'a de sens que pour une vitrine en
serait une, fût-elle immatérielle. Le coût est de perdre la proximité entre le membre
et son motif ; le gain est une bibliothèque qui ignore que le site existe.

### 10.7 Ce que le catalogue permet de dériver

| Fonction | Source |
|---|---|
| Résolution d'un appel | Table de dispatch typée |
| « Cette contrainte n'est pas disponible pour ce generator » | Applicabilité déclarée |
| « Ce paramètre attend un entier » | Type du paramètre |
| « Vouliez-vous dire… ? » | Liste des noms valides |
| Exemples prédéfinis | Exemples canoniques |
| Aide en ligne, autocomplétion | Descripteurs et documentation XML |

Les textes d'aide sont extraits de la documentation XML de la bibliothèque. Une
bibliothèque bien documentée produit donc mécaniquement un playground bien documenté,
ce qui aligne deux efforts qui divergent d'habitude.

### 10.8 Contraintes d'élagage

Élagage activé. **Avertissements d'élagage traités comme des erreurs**, et non
regroupés, pour que chacun soit visible. Aucune réflexion dans le code du playground.

Et la règle qui compte plus que les précédentes réunies : **les tests de bout en bout
s'exécutent sur l'artefact publié**, jamais sur un build de développement. C'est la
seule qui attrape la classe de défauts qui n'existe qu'après élagage.

### 10.9 Chargement

Le shell s'affiche immédiatement. Le téléchargement du runtime est visible par un état
de chargement avec **progression réelle**, non simulée. Ce qui n'est pas requis pour le
premier exemple est chargé paresseusement si le gain est mesuré.

La compilation anticipée n'est pas activée par défaut, et ne sera envisagée qu'après
mesure du compromis entre taille téléchargée et vitesse d'exécution.

---

## 11. Positionnement comparatif

### 11.1 Principe directeur

Une page de comparaison ne convainc que si elle est manifestement capable de dire du
bien des autres. Ce principe prime sur l'envie de gagner chaque ligne.

### 11.2 Le concurrent qu'il ne faut pas oublier

Le comparatif couvre les bibliothèques du domaine **et l'écriture à la main**. Le
concurrent réel de la plupart des bibliothèques de données de test n'est pas une autre
bibliothèque, c'est une constante codée en dur. Une comparaison qui l'ignore parle à
côté de son lecteur.

### 11.3 La conclusion d'abord, la preuve ensuite

§4 demande à un développeur déjà équipé de répondre **en une minute** : est-ce que ça
remplace ou est-ce que ça complète ? qu'est-ce que mon outil ne fait pas ? puis-je
l'essayer sur un seul test ?

La première version de cette page respectait le reste de §11 à la lettre et ne répondait
à aucune des trois. Elle ouvrait sur une matrice de dix axes, et une matrice de dix axes
ne se lit pas en une minute : elle demande d'abord d'apprendre dix critères, puis de les
appliquer soi-même. Le lecteur devait reconstituer la conclusion à partir des preuves.

Ce n'est pas un défaut de rédaction, c'est un ordre. **La page conclut, puis prouve.**

Elle se lit à quatre profondeurs, et **aucune n'est le prérequis de la précédente** :

| Profondeur | Ce que le lecteur en repart avec |
|---|---|
| **le problème** | ce que fait la bibliothèque et pourquoi elle existe, sans comparatif ni vocabulaire spécialisé |
| **le besoin** | quatre situations de test, une par option, pour se reconnaître avant de comparer quoi que ce soit ; la coexistence ; l'essai sur un seul test |
| **les critères** | chaque critère enseigné là où il sert, puis appliqué aux quatre options |
| **la preuve** | les nuances, les limites, la matrice, les sources, la date, le droit de réponse |

La richesse n'est pas retirée, elle est rangée. Une page courte qui suppose son
vocabulaire acquis n'est pas plus claire qu'une page longue qui l'enseigne ; elle est
seulement plus courte.

### 11.4 Aucun critère n'est affiché sans être enseigné

C'est la règle qui manquait à cette section, et c'est la plus importante après §11.1.

« Invariants métier », « contraintes au point d'appel » : ces intitulés ont un sens
précis. Avoir un sens précis n'est pas être compréhensible. Le lecteur visé connaît C# et
les tests unitaires ; il ne pratique pas nécessairement le DDD, ni le design par contrat,
ni le property-based testing, et il n'a aucune raison de connaître le modèle conceptuel
de ce comparatif.

Chaque axe porte donc, **en donnée et non en balisage** :

- un **intitulé en langue courante**, lisible sans expertise préalable ;
- la **question concrète** qu'il tranche, posée comme le lecteur se la poserait ;
- une **explication courte**, une idée par phrase ;
- le **terme technique**, quand il en existe un, en information secondaire ;
- un **exemple**, facultatif, et seulement quand il apprend plus qu'une phrase de plus.

Le terme technique vient après l'idée, jamais à sa place : « invariant métier » est le mot
juste, ce n'est pas une explication.

L'intitulé, la question et l'explication sont **visibles**. Ce qui approfondit peut être
replié, à trois conditions : le mécanisme est natif, il s'ouvre au clavier, et il se voit
sans survol. Il n'y a pas de survol sur mobile, et une information indispensable rangée
dans une infobulle est une information absente.

### 11.5 Axes, et l'ordre dans lequel ils arrivent

Dix. Ce que cette section fixe, c'est ce que chacun compare ; leurs intitulés définitifs
sont du contenu et vivent avec lui (§2) :

les valeurs que le code appelant accepte ; la règle énoncée là où la valeur est demandée ;
la distinction entre la valeur que l'assertion vérifie et celles qui l'entourent ; la
recette écrite une seule fois ; les données réalistes ; les objets imbriqués remplis sans
qu'on les décrive ; le rejeu exact de l'exécution qui a échoué ; ce que le compilateur
signale avant l'exécution ; le code de préparation écrit par un outil ; la recherche de la
valeur qui casse le code.

**Ils sont regroupés sous les quatre questions que le lecteur se pose en arrivant**, et
non classés « du plus différenciant au moins différenciant ». Cette première règle
d'ordonnancement est révoquée, et le motif est le même que celui de §11.1.

Classer par pouvoir différenciant revient à classer par notre propre marge. Appliquée,
la règle mettait en tête trois axes qui disent une seule et même force sous trois angles —
la valeur satisfait les règles du code appelant, la règle s'énonce là où la valeur est
demandée, le test montre son sujet. JustDummies prenait la meilleure note aux trois, aucune
autre option n'en prenait une seule, et un lecteur qui n'adhérait pas encore à la promesse
en lisait trois d'affilée avant d'atteindre un critère qu'un autre outil pouvait gagner.
Une comparaison qui commence par trois victoires cesse d'être lue comme une comparaison.

Groupé par question, l'ordre est celui du lecteur, et **chaque famille contient au moins un
critère que JustDummies ne gagne pas**. C'est une contrainte sur le regroupement, pas un
arrangement des notes : aucune note ne bouge pour la satisfaire, et si un jour aucun
regroupement honnête ne la satisfait plus, c'est le comparatif qui a un problème, pas la
règle.

Les axes que JustDummies ne gagne pas restent **à leur rang, sans euphémisme**. Leur
présence est ce qui rend les autres crédibles.

Un axe où les quatre options répondent la même chose n'est pas un axe raté : il apprend au
lecteur que sa question relève d'une autre famille d'outils. La page **nomme alors cette
famille** au lieu de le laisser sans réponse.

### 11.6 Vocabulaire des cellules

Trois valeurs, et **aucune croix** : l'outil est *conçu pour ça* ; c'est *possible, avec du
travail*, et ce travail est nommé ; *ce n'est pas son rôle*.

Les trois mots doivent se comprendre seuls, et une **légende les définit malgré tout**,
une fois, avant leur première apparition. C'est ce qui a écarté la formulation
précédente : « cœur de métier » désigne en français courant l'activité principale d'une
entreprise, et se lisait à un mot de « invariants métier » dans le même tableau.

Le troisième mot décrit un **périmètre, jamais une intention**. Une bibliothèque qui ne
fait pas quelque chose ne l'a pas nécessairement décidé : ce peut être une demande encore
ouverte chez elle. Écrire « délibérément non » lui prêterait une position que son propre
dépôt contredit, ce que §11.10 interdit.

*Ce n'est pas son rôle* n'est pas un défaut. JustDummies porte cette mention sur plusieurs
axes, et c'est exactement le sens du mot « just » (§3.2). La page rend cette cohérence
visible plutôt que de la masquer.

Une cellule qui ne dit que sa valeur ne dit rien : **toute cellule autre que « conçu pour
ça » porte une note**, qui nomme le travail à fournir ou la limite rencontrée. C'est une
contrainte de type, pas une consigne de rédaction — une cellule muette ne compile pas.

Le sens n'est jamais porté par la seule couleur.

### 11.7 Trois rendus d'une même source

- **Le rendu principal est la comparaison critère par critère.** Un bloc par critère : son
  enseignement, puis la position des quatre options avec leurs notes. Il est identique à
  toutes les largeurs, il ne défile jamais latéralement, et il ne demande aucun script.
- **Le duel** réduit ces mêmes blocs à JustDummies et à l'outil que le visiteur désigne.
  C'est sa question réelle, qui n'est jamais « comment se comparent quatre options » mais
  « comment ça se compare à **la mienne** ». Le sélecteur est un contrôle de formulaire
  natif, jamais un composant sur mesure au clavier approximatif, et le changement
  d'affichage est **annoncé en texte** : une colonne qui disparaît n'informe pas celui qui
  ne la voyait pas.

  Le duel n'est plus l'état par défaut. Il l'était tant que le rendu principal était un
  tableau à cinq colonnes, illisible autrement ; le rendu par blocs se lit à toutes les
  largeurs avec les quatre options affichées. Un script dont le premier geste est de retirer
  deux des quatre options que la page vient de présenter, et d'en choisir une à la place du
  lecteur, répond à une question qui n'a pas encore été posée. **La page scriptée ouvre donc
  là où la page non scriptée s'arrête** : tout est affiché, et « les trois autres options »
  est la première entrée du sélecteur, qui est aussi le chemin du retour.
- **La matrice** est le rendu secondaire, d'un coup d'œil, pour qui veut tout voir en même
  temps. Elle n'apporte que la mise en grille : chaque notation qu'elle affiche est déjà
  lisible, avec son explication, dans le rendu principal. Elle n'est donc présentée que là
  où une grille se lit ; en dessous elle est **remplacée** par ce rendu principal, jamais
  rétrécie, jamais mise à défiler latéralement.

### 11.8 La fiche par outil

JustDummies compris — c'était l'oubli de la première version : la colonne constante de
toutes les lignes était la seule chose de la page qui n'était jamais décrite.

Chaque outil dispose d'un bloc court : une phrase décrivant son objectif comme ses auteurs
le formuleraient, une phrase disant concrètement ce qu'on en obtient, un lien vers son
dépôt officiel, et surtout :

> **« Quand la choisir plutôt que JustDummies »** — obligatoire, jamais vide, jamais
> ironique.

C'est la partie la plus importante de la page. Elle coûte quelques conversions et
achète la crédibilité de tout le reste. Sans elle, le tableau est une publicité et sera
lu comme telle.

Une section **« quand ne pas utiliser JustDummies »** existe en propre, non enfouie. Elle
énumère ses cas un par un, et n'est pas un paragraphe qui les enchaîne : c'est la section
qu'un lecteur sceptique lit le plus attentivement, donc la dernière où entasser des idées.

La première version portait aussi ce qu'elle présentait comme un fait sur le projet :
**« JustDummies est écrit et maintenu par une seule personne. »** Ce n'est plus le cas.
Un fait ne convainc que s'il pointe un risque réel, et le nombre de mainteneurs n'en
est pas un en soi : rien dans cette phrase ne dit au lecteur si le projet est bien
maintenu, seulement combien de personnes s'en chargent, deux choses que rien ne relie.
L'écrire revenait à se décrédibiliser soi-même sur un critère qui ne mesure rien —
l'inverse de ce que demande §11.1.

### 11.9 Coexistence

À dire explicitement et **tôt**, parce que c'est le principal frein à l'essai :
JustDummies n'exige aucune migration, s'introduit sur **un seul test**, coexiste avec
l'outillage existant dans la même base de code, et n'oblige à rien retirer.

Tôt ne veut pas dire en premier. La phrase répond à une objection, et une objection sans
désir n'existe pas encore : la première version de la page ouvrait dessus, devant un
lecteur qui n'avait pas encore appris de quoi on lui parlait. Le haut de page dit donc ce
que fait la bibliothèque, puis répond en une ligne à chacune des trois questions de §4 —
dont celle-ci. La section qui en fait une action, commande d'installation comprise, arrive
après les raisons de ne pas l'utiliser : c'est là qu'elle convertit.

### 11.10 Règles éditoriales et gouvernance

- ton factuel, aucune formulation dépréciative, aucun superlatif comparatif ;
- **une idée principale par phrase** : une phrase qui affirme, nuance, excepte, justifie et
  conclut à la fois se découpe ;
- **le concret avant l'abstrait** — la situation de test avant le nom théorique ;
- **aucun métadiscours** : une phrase affichée aide à comprendre, à choisir ou à
  approfondir ; elle ne commente jamais la façon dont ce comparatif a été construit ;
- **aucun renvoi qu'un autre rendu peut casser** : une note ne dit ni « ci-dessus » ni
  « ci-dessous », puisque le duel masque des colonnes ; et elle ne renvoie pas à la
  narration de la page d'accueil, que son lecteur n'a peut-être pas lue ;
- **rien de décoratif** : toute phrase affichée apporte une information ;
- toute affirmation sur une bibliothèque tierce est **vérifiable dans sa documentation
  officielle ou son dépôt, et datée** — et la page **montre ces sources** au lieu de les
  garder dans un commentaire de code ;
- les noms et la casse retenus par leurs auteurs sont respectés ;
- une remarque sur l'activité d'un projet n'est admise que sous forme de fait daté et
  sourçable ;
- une **date de dernière vérification** est affichée, et c'est une donnée de contenu :
  au-delà d'un délai déclaré, le build émet un avertissement ;
- une issue dédiée invite les auteurs des bibliothèques citées à signaler toute
  inexactitude, et **cette invitation est visible sur la page**. Une comparaison qui
  offre publiquement un droit de réponse est lue tout autrement que celle qui ne le
  fait pas.

Les données du comparatif sont un fichier structuré validé par schéma (§2), pas du
balisage — l'enseignement de chaque axe compris. La comparaison critère par critère, le
duel et la matrice sont trois rendus d'une même source.

---

## 12. Architecture technique

### 12.1 Découpage

Un générateur de site statique porte la page principale, la narration, les pages de
contenu, l'internationalisation et le référencement. Une application WebAssembly porte
le playground, et **uniquement là où l'exécution réelle de la bibliothèque apporte une
valeur**.

La page principale n'impose jamais le téléchargement du runtime .NET au visiteur qui
consulte seulement la présentation.

### 12.2 Un seul artefact

Le site est livré comme **un seul répertoire statique**, construit en un seul endroit,
le playground étant assemblé dedans sous son préfixe. Les deux moitiés s'accordent sur
ce préfixe par construction — configuration de build d'un côté, base de résolution des
URL de l'autre — et non par une correction appliquée après coup.

Ce désaccord-là ne produit pas d'erreur : le document se charge, chaque URL relative
résout un niveau trop haut, et le visiteur voit une page blanche. Il est donc **vérifié
à chaque build**.

### 12.3 Hébergement

Un hébergeur d'assets statiques, sans serveur applicatif.

**Aucun script serveur.** Les requêtes servies comme assets statiques sont gratuites et
illimitées ; celles qui invoquent un script comptent dans un quota, dont l'épuisement
répond par une erreur plutôt que par un repli sur les assets. La différence entre un
script et pas de script est celle entre un site qui se dégrade et un site qui tombe.

En introduire un est une décision à prendre exprès, jamais à découvrir dans un diff.
Le cas qui tentera de le faire est celui des URL partageables du playground : encoder
l'état dans le fragment d'URL ne coûte rien côté serveur et reste la réponse préférée.

### 12.4 Construction et déploiement

Le build et la validation s'exécutent dans l'intégration continue, et l'hébergeur reçoit
un répertoire **déjà construit et déjà vérifié**. Cela permet de maîtriser les versions
des toolchains, de construire toutes les moitiés dans le même pipeline, et de tester
l'artefact final avant de le publier.

Le pipeline exécute **les mêmes scripts qu'un mainteneur exécute**, jamais une
réimplémentation en YAML : un pipeline qui redit le build local dérive de lui, et la
dérive ne se découvre que lorsque l'un des deux est déjà faux.

Chaque pull request produit une URL de prévisualisation isolée, non indexée, servie
avec les mêmes en-têtes de sécurité que la production.

### 12.5 Ce qui doit être validé par un déploiement réel

Certaines propriétés ne se vérifient pas en local, et les supposer est le meilleur
moyen de les découvrir en production :

- la prise en compte effective des fichiers d'en-têtes et de redirections ;
- l'ordre entre le service d'un asset et l'application d'une règle de réécriture ;
- l'unicité, la stabilité et la rétention des URL de prévisualisation ;
- la compression réellement appliquée aux ressources WebAssembly.

Chacune est marquée comme telle là où elle est configurée, pour que la vérification ait
un lecteur.

---

## 13. Sécurité, performance, accessibilité

### 13.1 En-têtes

Politique de sécurité du contenu, protection contre le sniffing de type, politique de
référent, politique de permissions, protection contre l'intégration en iframe, et
transport strict une fois le domaine validé.

Le cache distingue trois régimes : le HTML est **toujours revalidé**, car c'est le
document qui nomme les assets empreintés ; les assets empreintés sont immuables ; ce
qui n'est pas empreinté prend une durée courte.

### 13.2 La politique de contenu et WebAssembly

Une politique qui interdit toute évaluation dynamique rend le playground impossible :
un runtime WebAssembly ne démarre pas sans autorisation d'instancier un module.

L'autorisation requise est **étroite** — elle permet la compilation WebAssembly et rien
d'autre, ni évaluation de chaîne, ni construction de fonction, ni script en ligne.
Elle est **autorisée et documentée** ; l'autorisation large reste **interdite**.

Deux règles complètent :

- **aucun script ni style en ligne non couvert.** Ce qui reste en ligne malgré tout est
  couvert par une empreinte nommée dans la politique, et cette empreinte est recalculée
  à chaque build puisqu'elle change à chaque build ;
- **toute évolution de la politique est validée par un chargement réel** du playground,
  jusqu'à la génération d'une valeur. Une politique correcte au regard d'une revue de
  code peut être fausse au regard du navigateur.

### 13.3 Performance

Objectifs de Core Web Vitals au 75e percentile lorsque les données terrain existent.

Pour la page principale : aucune ressource du playground dans le chemin critique,
budget chiffré pour le JavaScript initial, animation et scrollytelling chargés
seulement là où ils servent, images vectorielles préférées, polices limitées.

Pour le playground, la contrainte qui compte n'est pas la limite de taille de la
plateforme — elle ne sera jamais atteinte — mais **le temps que le visiteur attend
avant sa première valeur générée**. Ce délai est budgété, mesuré à chaque build, et
mesuré séparément à froid et avec cache.

Ce qui n'est pas négociable, c'est qu'un budget chiffré existe et soit mesuré à chaque
build : sans cela, le poids d'une application WebAssembly ne fait que croître.

### 13.4 Accessibilité

Cible **WCAG 2.2 niveau AA**, dans toutes les locales.

Navigation clavier complète, ordre de focus logique, focus visible, contrastes
conformes, labels explicites, titres hiérarchisés, liens externes identifiables.

**Aucun contenu transmis par la seule couleur** — cela vaut pour le passage au vert du
test, pour les marqueurs d'état de §5.7 et pour les cellules du comparatif, qui portent
toutes un texte en plus de leur traitement visuel.

Le code est accessible aux lecteurs d'écran, un terminal animé est aussi représenté
comme texte, les boutons de copie ont un retour accessible, et les messages d'erreur
sont associés à la zone qui les provoque.

### 13.5 Le scrollytelling accessible

Le DOM contient les informations dans un ordre logique, indépendamment des animations.
Le contenu n'est jamais rendu inaccessible par un positionnement hors écran, par un
ordre DOM différent de l'ordre visuel, par une narration qui dépend d'un scroll précis,
ou par du texte intégré à une image.

**Sans JavaScript, une version linéaire simplifiée de l'histoire reste
compréhensible.**

Sous préférence de mouvement réduit : pas de scrub continu, pas de mouvement
automatique persistant, les zooms et déplacements remplacés par des fondus courts ou
des changements instantanés, chaque étape présentée dans l'ordre du document, et
**l'intégralité de l'information conservée**.

---

## 14. Gouvernance du contenu

C'est la section qui empêche le site de mentir sur son propre produit, et §2 en est le
résumé exécutable.

### 14.1 Métadonnées centralisées

Noms de paquets, versions, commandes d'installation, URL de registre et état de
publication vivent en **un seul endroit**. Aucune page ne les écrit.

### 14.2 Diagnostics

Les identifiants, titres et liens d'aide des analyzers sont **consommés depuis la
source publiée par la bibliothèque**, jamais recopiés. Leur nombre et leur répartition
en familles sont **comptés**, jamais énoncés.

### 14.3 Valeurs générées

**Toute valeur générée affichée sur le site est produite au build par la vraie
bibliothèque.**

Une valeur écrite à la main dans le contenu est un mensonge à retardement : le jour où
le format produit évolue, la page continue d'afficher l'ancien. L'exécution est
**déterministe**, avec un seed fixe, pour qu'un build ne produise pas une différence
gratuite à chaque commit.

Bénéfice secondaire, qui vaut la peine d'être nommé : ce mécanisme est un test de bout
en bout permanent de la bibliothèque. Si une expression mise en avant sur la page
d'accueil cesse de produire une valeur, le build du site échoue.

### 14.4 Aucun snippet ne déclenche de diagnostic

> Aucune expression publiée sur le site ne doit déclencher l'un des diagnostics de la
> bibliothèque, ni provoquer un refus à la déclaration.

Mise en œuvre : les snippets sont compilés en intégration continue avec les analyzers
activés et **les avertissements traités comme des erreurs**. Le contrôle est gratuit,
puisque les analyzers voyagent avec le paquet.

Une bibliothèque dont la page d'accueil déclencherait ses propres diagnostics perdrait
plus de crédibilité que n'importe quel argument n'en gagnerait.

Deux exceptions, et toutes deux nommées quelque part où on les trouve.

La première est celle de §9.9 : ce qu'un visiteur saisit lui appartient.

La seconde est la factory négligente du premier acte, dont la scène **est** un appel qui
ne déclare rien. Elle déclenche JD030 depuis que la bibliothèque le signale, et la règle a
raison de le dire — c'est précisément le propos de la scène. Abaisser la règle pour
l'accommoder la ferait cesser de tenir tous les autres snippets, ce qui est l'essentiel de
son intérêt ; elle est donc escaladée comme les autres, et cette expression seule en est
sortie par son nom, dans `tools/snippet-validation/GlobalSuppressions.cs`. Une exception
qui tient sur une ligne qu'un lecteur peut retrouver vaut mieux qu'une règle qu'on baisse.

### 14.5 Snippets vérifiables

Les exemples publiés compilent dans un projet de validation, contre la version de la
bibliothèque réellement utilisée. Le code est **identique dans toutes les locales** :
seul le texte narratif autour est traduit.

### 14.6 Contenu provisoire

Un texte provisoire est autorisé pendant la conception, à condition d'être **marqué
comme tel et centralisé**. Aucun faux-texte n'est livré.

---

## 15. Mesure

### 15.1 Approche

Des métriques de fréquentation et de performance respectueuses de la vie privée. Le
contenu exact saisi dans le playground n'est jamais enregistré par défaut.

### 15.2 Les événements qui portent une dimension

Un événement de copie de la commande d'installation, émis sans dimension, ne dit que
« des gens copient ». L'information utile est **quel moment les a convaincus**, qui est
précisément ce pour quoi la page est construite.

L'événement porte donc :

- un **emplacement**, identifiant stable et **indépendant de la position** ;
- une **variante**, disant ce qui a été copié, car la porte de sortie n'est pas la même.

### 15.3 Le numéro de scène n'est jamais une clé

Interdit, et pour un motif empirique : entre deux brouillons, la page est passée de
onze à quatorze scènes et la sortie finale a changé d'ordinal. Un événement indexé sur
la position aurait rendu incomparables deux périodes de mesure portant sur le même
moment narratif.

L'ordinal peut voyager en champ secondaire, pour la lisibilité d'un tableau de bord.
Jamais comme identifiant.

### 15.4 Le parcours, et ce qu'il demande d'abord

Les deux mesures ci-dessus ne demandent leur accord à personne, parce qu'aucune ne
sait reconnaître un lecteur. Elles disent combien arrivent et combien copient ; elles
ne disent rien de ce qui s'est passé entre les deux.

Le parcours — quelles scènes ont été lues, où l'on s'arrête, ce qui a été comparé
avant de se décider — demande une mesure capable de relier deux visites, donc capable
de reconnaître. **Elle est soumise au consentement**, et le consentement est un oui
explicite : rien n'est chargé, et rien n'est envoyé, avant qu'il soit donné. Un site
qui promet cela doit pouvoir le prouver, et non l'affirmer.

Elle est une **troisième voie, et elle est séparée**. Les deux premières n'en dépendent
jamais : un refus coûte un parcours et jamais un total. C'est ce qui garde un taux
lisible, puisque son dénominateur reste celui de la voie que personne ne refuse.

Ce qu'elle mesure ne sert jamais la publicité. Cette exclusion est portée par la
politique de contenu, de sorte qu'un changement d'avis casse un contrôle au lieu
d'être livré.

Le refus est offert aussi visiblement que l'accord, et se révise à tout moment.

---

## 16. Ce qui est vérifié, et par quoi

Une règle dont rien ne vérifie l'application est un vœu. Ce tableau est la liste des
vœux transformés en contrôles ; il est aussi la liste de ce qu'on saura *ne pas* avoir
cassé.

| Règle | §  | Contrôle |
|---|---|---|
| Les deux moitiés s'accordent sur le préfixe du playground | 12.2 | Vérification de l'artefact |
| Aucun script ni style en ligne non couvert par la politique | 13.2 | Vérification de l'artefact |
| Le playground démarre sous la politique de production | 13.2 | Test de bout en bout dédié |
| Une clé de contenu manquante dans une locale | 6.4 | Échec de compilation |
| Un membre public ni exposé ni exclu avec motif | 10.5 | Échec de build |
| Un composant présenté comme disponible sans version résoluble | 5.7 | Échec de build |
| Aucun snippet ne déclenche de diagnostic | 14.4 | Compilation des snippets, avertissements en erreurs |
| Toute valeur affichée vient de la bibliothèque | 14.3 | Génération au build ; l'absence de valeur casse le build |
| Budgets de taille et de délai | 13.3 | Mesuré à chaque build |
| Accessibilité | 13.4 | Audit automatisé, dans chaque locale |
| Liens internes et réciprocité des `hreflang` | 6.5 | Vérification de l'artefact |
| Fraîcheur du comparatif | 11.10 | Avertissement de build au-delà du délai déclaré |
| Chaque axe porte son enseignement — question et explication | 11.4 | Échec de compilation : le type de l'axe les exige |
| Toute cellule autre que « conçu pour ça » porte une note | 11.6 | Échec de compilation : le type de la cellule l'exige |
| Les critères et leur enseignement restent lisibles sans script | 11.7 | Vérification du document, et test de navigateur sans script |
| Aucune note ne renvoie à ce qu'un autre rendu masque | 11.10 | Vérification des chaînes, dans les deux locales |
| Un emplacement de mesure indexé sur une position | 15.3 | Vérification de l'artefact, et refus du collecteur |
| Une paire emplacement/variante qui désigne deux choses | 15.2 | Vérification de l'artefact |
| Le beacon d'audience et la politique qui doit l'admettre | 15.1, 13.2 | Vérification de l'artefact, dans les deux sens |
| La balise de parcours et la politique qui doit l'admettre | 15.4, 13.2 | Vérification de l'artefact, dans les trois sens |
| Rien n'atteint le tiers avant que le visiteur ait accepté | 15.4 | Test de navigateur dédié |
| La mesure de parcours ne sert jamais la publicité | 15.4 | Vérification de l'artefact, et refus du navigateur |
| Une version de paquet déclarée en retard sur le registre, ou en désaccord avec elle-même | 7.5 | `scripts/check-package-freshness.mjs`, sur planification et à chaque release ; avertissement et issue, jamais un échec de publication |

Quand une règle de ce document n'a pas de ligne ici, c'est qu'elle repose sur
l'attention. Le dire est plus utile que de faire semblant.

---

## 17. Où vivent les décisions

Ce document porte les décisions **de conception du site**. Deux catégories vivent
ailleurs, et confondre les trois est ce qui a fait vieillir les brouillons.

| | Où | Nature |
|---|---|---|
| **Décisions durables d'architecture** | `docs/for-maintainers/adr/` | Ce qu'un futur mainteneur remettra en cause : le choix d'hébergement, l'absence de script serveur, le pont catalogue, la source de vérité éditoriale. Une décision, son contexte, ses conséquences, ses alternatives écartées |
| **Conception du site** | Ce document | La narration, les règles éditoriales, l'architecture de l'information, les principes |
| **Le travail à faire** | Le suivi de projet | Petit, fermable, daté |

Une décision consignée ici et qui mérite de survivre à ce document migre vers
`docs/for-maintainers/adr/`. Une tâche qui apparaît ici est une erreur de rangement.

---

## 18. Le message

Le site doit être une vitrine de marque, une démonstration narrative, un outil d'essai
réel, une réponse honnête à « pourquoi pas ce que j'utilise déjà », et une base durable
pour la documentation.

La page principale ne se limite pas à énumérer des fonctionnalités : elle fait vivre
une transformation, d'un test encombré de données obligatoires mais sans importance
vers un test concentré sur son comportement.

Trois règles traversent ce document et suffiraient à le résumer :

1. **Le site ne montre rien qu'on ne puisse installer** — sinon il fait une promesse à
   la place du produit.
2. **Rien de ce que le site affiche n'est saisi à la main** — ni les snippets, ni les
   valeurs, ni les descripteurs, ni les diagnostics. Tout descend de la bibliothèque au
   moment du build, sinon la vitrine et le produit divergent, toujours.
3. **La comparaison dit du bien des autres** — c'est la seule façon d'être cru quand
   elle dit du bien de soi.

> **Only describe what matters. JustDummies generates the rest.**
