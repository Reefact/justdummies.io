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
| Cloudflare Web Analytics | les visites, et si les pages se chargent vite (§15.1) | non requis | tout le monde |
| Le collecteur Worker sur `/_event` | l'événement de copie dimensionné (§15.2) | non requis | tout le monde |
| Google Analytics 4 | le parcours entre les deux (ADR-0014) | **requis** | ceux qui acceptent |

Les deux premières sont les totaux ; la troisième est l'explication. **Lire un taux contre la voie
deux, jamais contre la voie trois** — le dénominateur de la voie trois est la fraction consentante,
donc un taux de conversion calculé là-bas est un taux parmi les gens qui ont accepté l'analytique, ce
qui n'est pas un fait au sujet de la page.

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
| `playground_started` | le bouton Run du hero est pressé | — | la plus forte intention de la page : accepter de télécharger le runtime |
| `comparison_narrowed` | le sélecteur de la page de positionnement est utilisé | `competitor` | à qui nous compare-t-on ? |
| `view_search_results` | la recherche API se stabilise sur un terme | `search_term` | ce qu'on cherche, et qu'on ne trouve pas |

`install_command_copied` est le **key event**. C'est aussi le seul événement rapporté dans deux voies
à la fois, délibérément : la voie deux compte chaque copie, la voie trois explique le chemin qui y
mène, et les deux se lisent ensemble plutôt que l'une à la place de l'autre.

`view_search_results` porte du texte saisi par un visiteur. C'est le seul événement ici dans ce cas,
il est décrit sur la page vie privée, et c'est le nom recommandé par GA4 — ce qui est ce qui le place
dans le rapport de recherche interne plutôt que parmi des événements personnalisés que personne
n'ouvre.

## Ce qu'il faut déclarer dans la console GA4

**Ni optionnel, ni rétroactif.** Un paramètre non déclaré en définition personnalisée est collecté
mais pas exploitable en rapport, et le déclarer plus tard ne remplit pas le passé — l'historique
antérieur à sa déclaration reste illisible. À déclarer avant le premier trafic réel, pas après la
première question.

Dimensions personnalisées, portée événement : `placement`, `variant`, `scene_name`, `act`,
`content_locale`, `competitor`, `link_url`. Sept des cinquante qu'autorise une propriété standard.

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
  — voir les Risques d'ADR-0014.
* Google Signals désactivé, personnalisation publicitaire désactivée, rétention 14 mois.
* Un filtre de trafic interne pour le mainteneur.

## Ce qui n'est délibérément pas mesuré

* **Aucune profondeur de défilement au-delà des scènes.** `scene_view` dit déjà jusqu'où un lecteur
  est allé, dans l'unité dont la page est réellement faite. Un pourcentage serait une seconde réponse
  à la même question, dans une unité que rien d'autre n'emploie.
* **Rien de ce qui est saisi dans le playground.** §15.1 énonce que ce qui y est tapé n'est jamais
  enregistré, et le playground tourne entièrement dans le navigateur — il n'y a aucun serveur à qui
  l'envoyer.
* **Aucun signal publicitaire, jamais.** Ils sont refusés en permanence au lieu de suivre le
  consentement, et la politique de contenu ne nomme aucun hôte publicitaire, si bien qu'un changement
  d'avis fait échouer un contrôle plutôt que d'être livré.
