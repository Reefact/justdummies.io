# ADR-0023 | Un événement porte une variante seulement s'il a une porte à choisir

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0023-an-event-carries-a-variant-only-when-it-has-a-door-to-choose-en.md)

**Status:** Accepted
**Proposed:** 2026-08-22
**Accepted:** 2026-08-22
**Decision Makers:** Reefact

## Context

§15.2 demande à la copie de la commande d'installation de porter deux dimensions. Un **emplacement**,
identifiant stable de l'endroit où était le visiteur, indépendant de la position. Une **variante**,
que la section motive dans ses propres mots : *disant ce qui a été copié, car la porte de sortie
n'est pas la même* — la commande du CLI et celle de la console Package Manager sont deux portes
différentes, et laquelle a été prise est la réponse pour laquelle l'événement existe.

ADR-0012 a construit le collecteur qui reçoit ces événements. Il est en service avec exactement un
événement qui lui parvient, `install-command-copied`, et il valide quatre champs contre une forme
plutôt que de leur faire confiance : le nom de l'événement, l'emplacement, la variante et la locale.
Les quatre sont obligatoires. L'ordinal est le seul champ qu'un événement peut omettre, et §15.3 dit
pourquoi — l'ordinal est une commodité de lecture d'un tableau de bord, pas une partie de
l'enregistrement.

Le collecteur est un point d'entrée public. Tout ce qui est atteignable depuis un navigateur l'est
depuis un script : la validation est donc ce qui protège le jeu de données, et un rejet est répondu
par le même 204 qu'une acceptation — `sendBeacon` jette la réponse, et un point d'entrée qui raconte
pourquoi il a refusé une entrée est un point d'entrée qui explique comment en fabriquer une
acceptée.

Analytics Engine range chaque dimension dans un blob, et les requêtes de lecture du
[guide de déploiement](../deployment-fr.md) regroupent par ces blobs. Une dimension est donc une
colonne que chaque lecteur futur rencontre, sur chaque ligne, qu'elle dise quelque chose ou non.

Le [plan de mesure](../measurement-plan-fr.md) énonce la règle pour ajouter une mesure : nommer la
question d'abord, et ne rien ajouter quand aucune décision ne changerait dans un sens ou dans
l'autre. Il énonce aussi le coût du contraire — *une dimension que personne ne lit n'est pas
gratuite ; c'est une chose de plus que chaque lecteur futur devra écarter.*

Un deuxième événement a maintenant une question qui vaut d'être posée. Le contrôle de téléchargement
flottant introduit avec `DownloadFab.astro` se tient sur chaque page sauf `/download/` elle-même, et
a été livré sans aucune mesure dans aucune des trois voies (issue #161). La question qu'il soulève —
un appel à l'action permanent sur chaque page mérite-t-il sa place, ou est-ce du bruit visuel — est
un taux, et le plan énonce qu'un taux se lit contre la voie de recensement et jamais contre celle
soumise au consentement, dont le dénominateur est la fraction consentante. C'est donc dans la voie de
recensement que cet événement doit atterrir.

**Cet événement n'a qu'une porte.** Le contrôle mène à la page de téléchargement, depuis partout,
toujours. Il n'y a pas de seconde destination qu'une variante distinguerait, ni de valeur qu'elle
pourrait porter qui ne serait pas la même sur chaque ligne.

## Decision

**Le collecteur exige un emplacement de tout événement et une variante seulement d'un événement qui
en a une, et enregistre un événement qui n'en a pas comme portant une variante vide.**

## Rationale

L'exigence qu'on relâche n'a jamais été celle de §15.2. §15.2 demande une variante à l'événement de
*copie*, et en donne une raison qui lui est propre : il y a deux commandes derrière un seul contrôle,
et le fait utile est de savoir laquelle a été prise. Le collecteur a généralisé cela en une règle
valant pour tout événement parce que, depuis qu'il existe, il n'y en a eu qu'un — et une règle tirée
d'un échantillon de un est une coïncidence, pas une contrainte. Ce que la section demande réellement,
c'est qu'un événement dise quelle porte a été prise **quand il y en a plus d'une** ; cette décision
est cette phrase lue telle qu'elle est écrite.

L'alternative au relâchement est d'inventer une valeur, et le plan de mesure en donne déjà le prix.
Une variante constante est une dimension que personne ne lit : elle apparaît sur chaque ligne du
nouvel événement, elle se trie parmi les vraies variantes, il faut l'exclure par son nom de toute
requête qui regroupe les portes, et le premier mainteneur qui la rencontre doit établir que `none`
n'a jamais été une porte que quelqu'un pouvait prendre. Vide dit la même chose sans rien demander à
expliquer et sans coûter une clause à une seule requête.

Le relâchement est assez étroit pour laisser la protection du point d'entrée là où elle était. Une
variante qui arrive doit toujours être un nom de la bonne forme, et une variante malformée est
refusée exactement comme avant — ce qui compte ici plus qu'il n'y paraît : enregistrer une valeur
rejetée comme une valeur absente rendrait le rebut et un silence légitime identiques dans le jeu de
données, et aucun lecteur futur ne pourrait les distinguer. L'emplacement, lui, reste exigé de tout,
parce que tout événement a un *où*, et parce que c'est le champ sur lequel l'interdit de §15.3 est
appliqué.

Exiger l'emplacement est aussi ce qui permet au nouvel événement de répondre plus qu'un total. Le jeu
de données n'a pas de dimension de page — il n'en a jamais eu, parce que l'emplacement de
l'événement de copie disait déjà où cela s'était produit —, si bien que l'emplacement est le seul
champ qui puisse porter l'origine d'un clic : le contrôle y rapporte la section d'où il a été cliqué.
La section et non la page exacte, parce que la décision que la mesure éclaire se prend par section :
un contrôle flottant se garde ou se retire à l'échelle d'`/api/`, jamais sur une seule de ses pages
d'entrée. Cela garde aussi l'identifiant sans chiffre comme §15.3 l'exige, ce que la route exacte ne
ferait pas : une majeure de release notes est publiée sous `v1`.

## Alternatives Considered

### Inventer une variante pour les événements qui n'en ont pas

Considérée en premier, parce qu'elle ne coûte aucun changement au collecteur, aucun record et aucun
raisonnement : un mot comme `none`, `default` ou `download-page` satisferait la validation existante
le jour où il serait écrit.

Rejetée parce que la règle du plan de mesure la refuse. La valeur ne varierait jamais : elle ne
répond à aucune question et ne change aucune décision, et le plan énonce qu'une dimension que
personne ne lit n'est pas gratuite — chaque lecteur futur devra l'écarter. Pire, elle est
indiscernable d'une vraie variante là où cela compte : une requête regroupant par porte l'afficherait
silencieusement à côté de `cli` et de `pm` comme si un visiteur l'avait choisie.

### Laisser le collecteur tranquille et ne mesurer le contrôle que dans la voie soumise au consentement

Considérée parce que cette voie ne demande aucun schéma : elle attache l'adresse de la page à tout ce
qu'elle rapporte, et elle porte déjà les autres sorties du site — le contrôle aurait pu les rejoindre
sans que rien d'autre ne bouge.

Rejetée parce qu'elle ne répondrait pas à la question qui motive la mesure. Savoir si un appel à
l'action permanent mérite sa place est un taux, et le plan de mesure est explicite : un taux lu
contre la voie soumise au consentement est un taux parmi les gens qui ont accepté l'analytique, ce
qui n'est pas un fait au sujet de la page. La voie qui couvre tout le monde est celle qui peut y
répondre, et l'atteindre veut dire atteindre le collecteur.

### Ajouter un second point d'entrée, ou une seconde forme d'événement, pour ceux sans variante

Considérée parce qu'elle laisserait le contrat existant intact : le collecteur en service depuis
ADR-0012 continuerait de refuser tout ce qui ne porte pas les quatre champs, et la nouvelle forme
vivrait à côté.

Rejetée parce qu'elle double la surface pour un seul champ optionnel. Deux points d'entrée, ce sont
deux choses à router, à valider, à tenir en phase et à se rappeler en lisant le jeu de données — et
tous deux écriraient dans le même jeu de données de toute façon, si bien que le blob vide ici le
serait là aussi. Elle achète de la rigueur sur un contrat dont rien d'autre ne dépend, et la paie
dans chaque requête et chaque lecteur à venir.

## Consequences

### Positive

La plus grande sortie non surveillée du site l'est désormais. Chaque page sauf une portait un
contrôle qui menait quelque part et ne comptait rien, dans les trois voies à la fois ; il est
maintenant compté dans la voie qui couvre tout le monde et expliqué dans celle qui connaît la page
exacte.

Le jeu de données dit ce qu'il veut dire. Un événement sans porte se lit comme n'en ayant aucune,
plutôt que comme en ayant pris une que personne ne lui offrait.

La règle que le collecteur applique est maintenant celle qu'énonce §15.2, et non une règle plus
stricte héritée de n'avoir eu qu'un seul événement contre lequel l'appliquer.

Rien n'est à déclarer dans la console GA4 pour le nouvel événement : il rapporte sous `placement`,
que le plan de mesure liste déjà parmi les dimensions personnalisées déclarées. Son historique est
lisible dès le premier jour, ce qui est exactement ce que cette section existe pour garantir.

### Negative

Le contrat du collecteur est plus lâche qu'avant. Un champ exigé de tout est désormais exigé de
certaines choses, et « lesquelles » est un jugement que chaque nouvel événement porte lui-même plutôt
qu'une chose que le point d'entrée puisse trancher.

Une requête qui supposait que chaque ligne porte une variante en rencontrera une vide. Rien dans ce
dépôt ne fait cette supposition, mais les requêtes du guide de déploiement sont recopiées dans des
shells et adaptées.

### Risks

**L'exemption est plus facile à prendre qu'à justifier.** Le prochain événement dont la variante est
seulement pénible à nommer peut désormais l'omettre, et rien au point d'entrée ne distingue « n'a
qu'une porte » de « n'y a pas réfléchi ». Ce qui s'y oppose est ce record et la règle du plan de
mesure pour ajouter un événement — dont aucun n'est un mécanisme.

**Une section est une origine plus grossière qu'une page.** Si la réponse à la question de #161
dépend de la page précise à l'intérieur d'une section, la voie de recensement ne peut pas la donner
et le dénominateur de la voie soumise au consentement est la fraction consentante. La page exacte y
est disponible, et c'est la lecture fine vers laquelle se tourner ; un recensement plus fin
demanderait de changer l'emplacement, ce qui change le sens de l'historique déjà enregistré.

## Follow-up Actions

* **Ce qui échoue quand la décision est cassée.** `scripts/verify-output.sh` vérifie que chaque page
  qui dessine le contrôle de téléchargement le marque d'un emplacement — l'omission à laquelle cette
  décision répond était précisément un contrôle qui menait quelque part et ne rapportait rien, et
  reperdre l'attribut serait silencieux de toutes les autres manières. Testé en le cassant :
  l'attribut a été retiré, le build est passé au rouge en nommant les pages, et il a été remis.
* La règle existante du même script — une paire emplacement/variante ne couvre jamais deux commandes
  ou deux liens différents — compare désormais les adresses privées du préfixe de locale du document.
  Une route est la même dans chaque locale au préfixe près (§7.2), donc les deux jumelles d'une même
  destination sont une porte et non deux ; le jeu de données les sépare de toute façon, puisque le
  collecteur écrit la locale dans un champ à elle.
* Le [plan de mesure](../measurement-plan-fr.md) gagne le tableau des événements de la voie de
  recensement, nommant les deux événements et la question à laquelle chacun répond, dans les deux
  langues.
* La section « mesure d'audience » de la page vie privée nommait l'événement de copie et affirmait
  que c'était tout ce qui est enregistré sans rien demander. Cette phrase est désormais fausse : elle
  est réécrite dans les deux langues plutôt que laissée à découvrir — le même coût qu'ADR-0012 a payé
  dans la copie, pour la même raison.
* Le [guide de déploiement](../deployment-fr.md) énonce l'ordre des champs qu'écrit le collecteur ;
  sa requête de lecture et son contrôle post-déploiement sont mis à jour pour dire à quoi ressemble
  une variante absente.

## References

* [ADR-0012](0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md) — le collecteur dont ceci
  élargit le schéma
* [ADR-0018](0018-le-parcours-est-mesure-dans-une-troisieme-voie-soumise-au-consentement-fr.md) — la
  voie soumise au consentement, et pourquoi un taux ne se lit pas contre elle
* [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md) — la règle que le contrôle de
  téléchargement applique à la navigation, et celle que #161 propose d'appliquer si la réponse est
  mauvaise
* [`docs/design/specification.md`](../../design/specification.md) §15.2 (l'événement dimensionné),
  §15.3 (l'ordinal n'est jamais une clé), §7.2 (une route est la même dans chaque locale)
* [Le plan de mesure](../measurement-plan-fr.md) — la règle pour ajouter un événement, et les voies
  contre lesquelles un taux peut se lire
* Issue [#161](https://github.com/Reefact/justdummies.io/issues/161) — le contrôle de téléchargement
  n'est mesuré sur aucune page
