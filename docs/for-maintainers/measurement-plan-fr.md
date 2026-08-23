# Le plan de mesure

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](measurement-plan-en.md)

À quoi sert chaque mesure, dans les trois voies. Écrit avant les événements, parce que la façon
habituelle dont une propriété d'analytique devient inutile est qu'on y ajoute des événements un à un,
chacun sensé pris seul, jusqu'à ce que personne ne sache plus à quoi l'un d'eux répond.

**La règle pour en ajouter un :** nommer la question d'abord. Si la question est déjà répondue par un
événement existant, ou si aucune décision ne changerait quel que soit le résultat, l'événement n'est
pas ajouté. Une dimension que personne ne lit n'est pas gratuite — c'est une chose de plus que chaque
lecteur futur devra écarter.

## Les trois voies

| Voie | Ce qu'elle porte | Consentement | Qui elle couvre |
|---|---|---|---|
| Cloudflare Web Analytics | les visites, et si les pages se chargent vite (§15.1) | non requis | tout le monde, playground compris |
| Le collecteur Worker sur `/_event` | les événements de sortie dimensionnés (§15.2) | non requis | tout le monde |
| Google Analytics 4 | le parcours entre les deux (ADR-0018) | **requis** | ceux qui acceptent |

Les deux premières sont les totaux ; la troisième est l'explication. **Lire un taux contre la voie
deux, jamais contre la voie trois** — le dénominateur de la voie trois est la fraction consentante,
donc un taux de conversion calculé là-bas est un taux parmi les gens qui ont accepté l'analytique, ce
qui n'est pas un fait au sujet de la page.

## Les événements que compte la voie deux

Deux, et ce sont les deux sorties dont le **taux** doit être lisible. La voie deux est la seule contre
laquelle un taux peut se calculer : une sortie mesurée seulement en voie trois est une sortie dont le
dénominateur est la fraction consentante — ce qui n'est pas un fait au sujet de la page.

| Événement | Se déclenche quand | Champs | La question |
|---|---|---|---|
| `install-command-copied` | une commande est copiée | `placement`, `variant`, `ordinal` | quel moment les a convaincus, et par quelle porte ? |
| `download-fab-clicked` | le contrôle de téléchargement flottant est cliqué | `placement` | un appel à l'action permanent sur chaque page mérite-t-il sa place ? |
| `generate-clicked` | Générer est pressé dans le playground | `placement`, `chain` | le playground est-il utilisé, et que viennent essayer les visiteurs ? |

`locale` voyage avec les deux. Les noms sont en kebab-case ici et en snake_case en voie trois parce
que chaque voie garde sa propre convention : GA4 rapporte sur un nom d'événement qu'il utilise aussi
pour les siens, et le collecteur écrit un blob que personne d'autre ne lit.

**Une variante est portée par l'événement qui en a une.** Une copie a deux portes derrière elle — le
CLI et la console Package Manager —, et laquelle a été prise est précisément ce que §15.2 demande. Le
contrôle de téléchargement n'en a qu'une : il n'envoie donc aucune variante, et le collecteur
enregistre une variante vide plutôt qu'un mot inventé
([ADR-0023](adr/0023-un-evenement-porte-une-variante-seulement-sil-a-une-porte-a-choisir-fr.md)).

**`chain` est l'expression construite par le visiteur, chaque argument remplacé par un point
d'interrogation** — `Any.String().StartingWith(?).Generate()`. Jamais une valeur : §10.3 interdit au
playground de persister une saisie hors du navigateur, et un argument en est une
([ADR-0024](adr/0024-le-playground-rapporte-la-forme-dune-chaine-pas-ses-valeurs-fr.md)). C'est le
seul champ ici qui ne soit pas un nom : il a donc son propre motif — un motif qui admet un point
d'interrogation là où se tiendrait un argument et rien d'autre, ce qui fait de l'anonymisation une
garantie plutôt qu'une convention. Il est absent, comme peut l'être une variante, quand la chaîne est
plus longue que ce que le champ tient : la pression compte toujours, seule sa forme est perdue.

**Lire la chaîne comme une longue traîne.** Une chaîne de quatre étapes tirée d'un catalogue de
plusieurs dizaines est une forme qui peut n'apparaître qu'une fois. Les lignes qui se regroupent
proprement sont les chaînes courtes ; la dispersion est le signal, pas un défaut.

**Le contrôle de téléchargement rapporte la section d'où il a été cliqué**, pas la page exacte —
`home`, `api`, `release-notes`, `not-found`. C'est la granularité à laquelle la décision se prend : un
contrôle flottant se garde ou se retire à l'échelle d'`/api/`, jamais sur une seule de ses pages
d'entrée. L'adresse exacte est l'affaire de la voie trois, qui la donne sans qu'on la demande.

## Les événements que rapporte la voie trois

`content_locale` est attaché à chacun d'eux, il n'est donc pas répété ci-dessous. C'est la langue du
document — la locale que le lecteur a choisie — et non celle du navigateur, que GA4 rapporte déjà
sous `language`. Ce qu'on veut savoir est quelle moitié du site a convaincu, pas où le lecteur était
assis.

| Événement | Se déclenche quand | Paramètres | La question |
|---|---|---|---|
| `scene_view` | une scène tient le milieu du viewport depuis environ une seconde | `scene_name`, `act`, `scene_ordinal` | où les lecteurs s'arrêtent-ils ? |
| `act_reached` | la première scène d'un acte est lue | `act` | l'entonnoir à trois marches |
| `install_command_copied` | une commande est copiée — le même événement DOM qu'écoute la voie deux | `placement`, `variant`, `scene_ordinal` | quel moment les a convaincus ? |
| `install_variant_switched` | l'onglet CLI ↔ Package Manager est changé | `placement`, `variant` | l'onglet par défaut est-il le bon ? |
| `nuget_link_clicked` | un lien NuGet est suivi | `placement`, `variant`, `link_url` | la sortie que personne ne regardait |
| `download_fab_clicked` | le lien de téléchargement flottant est cliqué | `placement` | un appel à l'action permanent sur chaque page porte-t-il son poids, ou est-ce du bruit visuel ? |
| `playground_started` | le bouton Run du hero est pressé | — | la plus forte intention de la page : accepter de télécharger le runtime |
| `comparison_narrowed` | le sélecteur de la page de positionnement est utilisé | `competitor` | à qui nous compare-t-on ? |
| `view_search_results` | la recherche API se stabilise sur un terme | `search_term` | ce qu'on cherche, et qu'on ne trouve pas |

`install_command_copied` est le **key event**. Lui et `download_fab_clicked` sont les deux rapportés
dans deux voies à la fois, délibérément : la voie deux compte chacun d'eux, la voie trois explique le
chemin qui y mène, et chaque paire se lit ensemble plutôt qu'une moitié à la place de l'autre.

`download_fab_clicked` porte la section comme `placement` parce que c'est ce que la voie deux peut
tenir ; cette voie-ci connaît déjà la page exacte, puisque GA4 attache l'adresse à tout ce qu'il
rapporte. Le paramètre est envoyé quand même, pour que la même clé relie les deux voies — ce qui est
la façon dont ce plan dit de les lire.

`view_search_results` porte du texte saisi par un visiteur. C'est le seul événement ici dans ce cas,
et c'est pourquoi il est nommé deux fois avant qu'on puisse y consentir : sur le bandeau lui-même, et
dans la section analytique de la page vie privée. Le dire sur le bandeau plutôt que seulement derrière
le lien est délibéré — un consentement à quelque chose qu'il faut suivre un lien pour découvrir n'est
pas un consentement éclairé. L'événement garde le nom recommandé par GA4, ce qui est ce qui le place
dans le rapport de recherche interne plutôt que parmi des événements personnalisés que personne
n'ouvre.

## Ce qu'il faut déclarer dans la console GA4

**Ni optionnel, ni rétroactif.** Un paramètre non déclaré en définition personnalisée est collecté
mais pas exploitable en rapport, et le déclarer plus tard ne remplit pas le passé — l'historique
antérieur à sa déclaration reste illisible. À déclarer avant le premier trafic réel, pas après la
première question.

Dimensions personnalisées, portée événement : `placement`, `variant`, `scene_name`, `act`,
`content_locale`, `competitor`, `link_url`. Sept des cinquante qu'autorise une propriété standard.

`download_fab_clicked` n'en ajoute aucune : il rapporte sous `placement`, qui figure déjà sur cette
liste. Un événement qui ne demande aucune déclaration nouvelle est un événement dont l'historique est
lisible dès son premier jour, ce qui est le seul genre que cette section puisse promettre.

Métrique personnalisée : `scene_ordinal`.

**`scene_ordinal` est une métrique et jamais une dimension**, et c'est §15.3 appliqué ici plutôt
qu'une préférence. La page est déjà passée de onze scènes à quatorze et la sortie finale a changé
d'ordinal ; un entonnoir indexé sur la position aurait rendu les deux périodes incomparables. Le
collecteur fait la même séparation en écrivant l'ordinal parmi ses doubles et jamais parmi ses index.
Regrouper par `scene_name` ; ne lire `scene_ordinal` que pour trier un tableau.

## Les réglages qui font partie du plan

* **Enhanced Measurement : les pages vues sur événement d'historique doivent être DÉSACTIVÉES.** La
  page principale intercepte chaque clic sur une ancre interne et pousse un état d'historique ;
  laissé actif, chaque clic de chevron rapporte une page vue. Rien dans ce dépôt ne peut le détecter
  — voir les Risques d'ADR-0018.
* Personnalisation publicitaire désactivée. **Google Signals reste éteint, ce qui sur une propriété
  neuve veut dire le laisser tranquille et non le désactiver** — il est livré inactif et propose de
  l'activer. Depuis juin 2026 il ne gouverne plus que l'enrichissement démographique, pas la remontée
  vers Google Ads, et il masque les chiffres derrière des seuils d'échantillonnage à faible trafic.
* **Rétention : 14 mois pour les données d'événement, 14 mois pour les données utilisateur, et
  « réinitialiser lors d'une nouvelle activité » laissé actif.** C'est donc une fenêtre glissante —
  les données d'un visiteur sont effacées quatorze mois après sa *dernière* visite et non après la
  collecte —, ce que la page vie privée énonce dans ces termes. Changer l'un oblige à changer
  l'autre.
* Un filtre de trafic interne pour le mainteneur.

## Ce qui n'est délibérément pas mesuré

* **Aucune profondeur de défilement à nous.** Le `scroll` de la mesure améliorée est laissé actif et
  suffit. Sur la page principale, `scene_view` dit la même chose bien mieux, dans l'unité dont la
  page est réellement faite — mais les scènes n'existent que là, et sur la vingtaine d'autres routes
  le `scroll` est le seul signal disant si une page a été lue. Le réglage est par flux et non par
  page, donc le désactiver pour éviter une redondance sur deux pages supprimerait la seule réponse
  sur toutes les autres. Lire `scene_view` sur la narration et `scroll` partout ailleurs ; ce sont
  deux granularités d'une même question, pas deux réponses à celle-ci.
* **Rien de ce qui est saisi dans le playground.** §15.1 énonce que ce qui y est tapé n'est jamais
  enregistré, et le playground tourne entièrement dans le navigateur — il n'y a aucun serveur à qui
  l'envoyer.
* **Le contrôle de téléchargement flottant propre au playground, pour l'instant.** `/playground/` est
  un document Blazor séparé qui rend son propre `DownloadFab.razor`, lequel ne porte aucun
  emplacement : ses clics n'atteignent donc aucune des deux voies, alors que le même contrôle est
  compté partout ailleurs. C'est nommé ici plutôt que laissé à découvrir, et c'est désormais la plus petite
  moitié du manque : le document porte la balise d'audience, donc ses visites sont au dénominateur,
  et il ne manque que le numérateur.
* **Aucun signal publicitaire, jamais.** Ils sont refusés en permanence au lieu de suivre le
  consentement, et la politique de contenu ne nomme aucun hôte publicitaire, si bien qu'un changement
  d'avis fait échouer un contrôle plutôt que d'être livré.
