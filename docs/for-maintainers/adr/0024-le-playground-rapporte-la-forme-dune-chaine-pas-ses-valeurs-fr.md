# ADR-0024 | Le playground rapporte la forme d'une chaîne, pas ses valeurs

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0024-the-playground-reports-a-chains-shape-not-its-values-en.md)

**Status:** Accepted
**Proposed:** 2026-08-23
**Accepted:** 2026-08-23
**Decision Makers:** Reefact

## Context

Le playground n'est mesuré par rien. Les travaux d'ADR-0023 ont établi le fait contre l'artefact
construit : `apps/playground/wwwroot/index.html` ne porte ni balise d'audience, ni tag analytique, ni
bandeau de consentement, ni script collecteur, et une recherche de `_event`, `sendBeacon`, `gtag` ou
`dataLayer` dans `apps/playground/` ne renvoie rien du tout. Le
[plan de mesure](../measurement-plan-fr.md) nomme cela comme un manque et non une décision, sous ce
qui n'est pas mesuré.

**Deux règles bornent ce qui peut sortir de cette application, et ce ne sont pas les mêmes.**

§10.3 énumère ce que le playground ne fait jamais, et le dernier item est celui qui opère : *ou
persister une saisie ailleurs que dans le navigateur*. Sans nuance.

§15.1 est plus souple : *le contenu exact saisi dans le playground n'est jamais enregistré **par
défaut***. Le plan de mesure le reprend sans la nuance, et la page vie privée porte la plus forte des
trois affirmations, dans les deux langues : *Ce que vous y saisissez n'est jamais envoyé à un serveur
— il n'y a d'ailleurs aucun serveur à qui l'envoyer.*

Un argument écrit par un visiteur est une saisie dans chacune de ces trois lectures. Les arguments
sont conservés en texte brut — `ChainLinkState` tient une `List<string>` et jamais une valeur typée —
et certains sont du texte libre : `StartingWith("…")` et les arguments liste d'ADR-0016 acceptent tout
ce qu'on y tape, y compris une référence de commande, un nom ou une adresse qu'un visiteur colle
depuis son propre travail.

**La forme de la chaîne n'est pas un argument.** Le playground construit une chaîne à partir d'un
catalogue qui est du code C# généré (ADR-0010) : chaque étape qu'un visiteur peut choisir est un
`MemberDescriptor` portant un `MethodName` et une liste `Parameters`, et le générateur écrit la clé de
chacune sous la forme `{receiverTypeKey}::{MethodName}#{parameters.Count}` au moment du build. Ce
qu'un visiteur choisit est tiré de ce vocabulaire fermé ; ce qu'un visiteur saisit, ce sont les
arguments seuls.

`Home.razor` parcourt déjà cette structure une fois, dans `CodeSegments` : il itère sur les liens
choisis, émet le nom de méthode, les parenthèses et les séparateurs, et appelle
`FormatArgumentLiteral` pour chaque paramètre afin de produire la ligne que le visiteur lit et copie.

Le collecteur valide quatre champs contre une forme et borne chacun à 64 caractères. ADR-0023 a établi
qu'un champ peut être absent d'un événement qui n'en a pas, et que la variante répond à *quelle porte
a été prise* — une question qu'une chaîne ne pose pas. Le plan de mesure énonce qu'un taux se lit
contre la voie de recensement, dont le dénominateur est tout le monde, et jamais contre celle soumise
au consentement.

## Decision

**Le playground rapporte la chaîne qu'un visiteur a générée sous la forme de la ligne qu'il a lue, où
chaque argument est remplacé par un point d'interrogation, dans un champ à part, et ne rapporte jamais
la valeur d'un argument.**

## Rationale

La question mérite un événement au regard de la règle du plan de mesure : le playground est-il utilisé
tout court, et les visiteurs composent-ils des contraintes ou s'arrêtent-ils à un générateur nu ? Les
deux changent une décision — la première sur le fait de savoir si le playground mérite le méga et demi
qu'il coûte, la seconde sur ce par quoi le catalogue et la documentation devraient commencer. Aucune
n'est répondable aujourd'hui, puisque rien n'est enregistré.

**La forme porte la réponse, les valeurs non.** Deux intervalles empilés est le fait intéressant à
propos de `Between(?, ?).Between(?, ?)` ; quels nombres s'y trouvaient ne l'est pas. Ce n'est pas une
concession faite à la vie privée au prix de la mesure — les valeurs n'ont jamais été le signal. Les
laisser tomber ne coûte rien à la question.

**Tous les arguments partent, les nombres compris, et l'absence d'exception est le point.** Une règle
qui garderait les arguments numériques devrait juger la sensibilité de chaque argument au moment de
l'envoi, et ce jugement est la partie qui dérive : il faudrait le réappliquer, correctement, par
quiconque ajoute le prochain générateur, contre un catalogue qui grandit au rythme de la bibliothèque
et non de ce dépôt. Une règle sans exception est une règle qu'un lecteur vérifie d'un coup d'œil, et
que le collecteur applique sans rien savoir du catalogue.

**Le template est la ligne que le visiteur a lue, moins les valeurs, et c'est pourquoi c'est la bonne
forme.** Il préserve ce qu'une clé compacte aplatirait : combien d'arguments prend chaque étape, et
donc si deux étapes du même nom ont reçu la même arité. C'est aussi la forme qu'un mainteneur lisant
un tableau de bord sait déjà lire, puisque c'est celle que dessine la barre de code. Et il est produit
par le parcours qui dessine cette barre — la même itération sur les mêmes liens, en refusant d'appeler
le formateur —, si bien que l'anonymisation n'est pas un filtre appliqué à une chaîne finie mais une
valeur qui n'a jamais été assemblée.

**Un argument de liste compte une fois par valeur, pas une fois par paramètre.** `OneOf` et `Except`
prennent `params T[]`, et ADR-0016 leur donne un seul champ séparé par des virgules ; la barre de code
réétale ce champ dans l'appel, si bien que `OneOf("red", "green", "blue")` est une ligne portant trois
arguments là où le catalogue nomme un paramètre. Rapporté par paramètre, cela donnerait `OneOf(?)` —
une forme que la barre ne peut jamais dessiner, et qui aplatit toutes les arités de liste sur la même
ligne, c'est-à-dire précisément l'aplatissement que cette forme a été choisie pour éviter. Le parcours
demande donc à `SplitList` — la fonction même qui découpe les valeurs pour l'analyseur et pour la
barre — son seul compte, et jette les valeurs qu'elle retourne.

**Il lui faut un champ à lui plutôt que celui de la variante.** ADR-0023 vient d'établir ce que veut
dire une variante, et une chaîne n'est pas une porte ; réutiliser le champ rendrait vide de sens la
seule requête qui regroupe les portes. Le motif de la variante ne pourrait pas le porter non plus —
une chaîne est une forme avec des parenthèses et des séparateurs, pas un nom en minuscules — et 64
caractères est court pour une chaîne d'une longueur quelconque.

**Le champ est optionnel, pour la raison qui en a rendu un optionnel dans ADR-0023.** Une chaîne plus
longue que ce que le champ autorise perd sa forme plutôt que son compte : l'événement atterrit quand
même, compte toujours dans le total, et ne rapporte aucune chaîne. Perdre la forme d'une longue chaîne
rare est une perte moindre que perdre le fait qu'elle a eu lieu, et un événement qui aurait
silencieusement échoué à la validation aurait perdu les deux.

C'est dans la voie de recensement que cela appartient, et non dans celle soumise au consentement,
parce que le plan est explicite : un taux n'est lisible que contre la voie qui couvre tout le monde —
et parce que cet événement n'enregistre rien au sujet d'une personne pour commencer. Il ne dépose
aucun cookie, ne reconnaît personne, et ne demande rien.

## Alternatives Considered

### Enregistrer la ligne générée telle quelle

Considérée parce que c'est ce qu'un mainteneur aimerait le plus lire, et parce que la ligne existe
déjà dans `CodeSegments` — l'envoyer coûterait une seule propriété.

Rejetée parce que §10.3 l'interdit en toutes lettres : un argument est une saisie, et l'envoyer en
persiste une hors du navigateur. La page vie privée devrait cesser de promettre, dans les deux
langues, que rien de ce qui y est saisi n'est jamais envoyé à un serveur — et cette promesse n'est pas
un détail de rédaction mais la raison pour laquelle un visiteur peut coller ses propres données dans
le playground pour voir ce que la bibliothèque en fait.

### Ne rapporter que le générateur, pas la chaîne

Considérée parce que c'est la plus petite chose qui réponde à « le playground est-il utilisé » :
`Any.Byte()` seul, pas d'étapes, pas d'arguments, rien à anonymiser, et aucun champ nouveau.

Rejetée parce qu'elle abandonne précisément la moitié qui change une décision. Savoir si les visiteurs
composent des contraintes — et lesquelles ils composent ensemble — est la question sur laquelle la
forme du catalogue et l'ordre de la documentation seraient réellement revus. Un compte de générateurs
dit que le playground sert, et rien sur ce à quoi.

### Rapporter la liste des clés du catalogue

Considérée parce que les clés existent déjà, sont déjà anonymisées par construction
(`AnyByte::Between#2` nomme un récepteur, une méthode et une arité, et ne peut rien contenir d'autre),
et ne demanderaient aucun code de formatage.

Rejetée sur la lisibilité plutôt que sur la sûreté, là où les deux sont proches : l'information est la
même, mais une ligne de tableau de bord affichant `AnyByte::Between#2>AnyByte::Between#2` est une
forme que personne sur ce projet ne lit ailleurs, tandis que le template est celle que la barre de
code dessine à chaque visite. Les clés répètent en outre le récepteur à chaque étape, ce qui est
redondant dès lors que les étapes sont dans l'ordre.

### Garder les arguments numériques et n'anonymiser que le texte

Considérée sérieusement, et c'est l'alternative qui a un vrai argument derrière elle : un `5` dans
`Between(5, 50)` est une borne de test, pas une donnée personnelle, et le garder dirait vers quels
intervalles les visiteurs se tournent.

Rejetée parce qu'elle rend la règle conditionnelle à un jugement, et que le jugement est la partie qui
dérive. Un argument texte qui se lit comme un nombre, ou un argument numérique portant une date
formatée, seraient chacun un nouveau cas à traiter correctement. Elle achète en outre peu de chose :
savoir quelles bornes un visiteur a choisies ne répond à aucune question pour laquelle cet événement a
été ajouté.

## Consequences

### Positive

Le playground cesse d'être la seule partie du site dont personne ne peut rien dire. Le total répond à
« est-il utilisé » ; les formes répondent à « pour quoi faire ».

L'anonymisation est une garantie et non une promesse. Le motif du collecteur pour ce champ admet `?`
et rien d'autre là où se tiendrait un argument, si bien qu'une valeur d'argument ne peut pas être
enregistrée même par un émetteur qui essaierait — y compris un émetteur qui n'est pas ce site.

Rien concernant le visiteur n'est enregistré, donc cela atteint la voie qui couvre tout le monde, et
les chiffres d'usage restent lisibles comme un taux plutôt que comme un taux parmi les consentants.

### Negative

Le collecteur gagne un cinquième champ et un cinquième motif, sur un point d'entrée public. Chaque
lecteur futur de `worker/index.ts` rencontre une chose de plus à comprendre.

Le jeu de données gagne une longue traîne. Une chaîne de quatre étapes choisies dans un catalogue de
plusieurs dizaines est une forme qui peut n'apparaître qu'une fois : les lignes qui se regroupent
proprement seront les chaînes courtes, et le reste sera dispersé. C'est le signal plutôt qu'un défaut,
mais un tableau de bord bâti dessus doit s'y attendre.

Une chaîne plus longue que la borne du champ ne rapporte aucune forme. Où placer cette borne est un
nombre choisi une fois, et choisi sans trafic contre lequel le choisir.

### Risks

**Une forme pourrait en principe être plus rare qu'un nom.** Un visiteur construisant une chaîne
inhabituelle contribue une ligne qui n'apparaît qu'une fois, et une ligne unique est plus proche
d'identifier qu'une ligne vue mille fois. Ce qui la borne : chaque élément de la forme vient d'un
catalogue fermé et publié, aucun argument, adresse, identifiant ni horodatage au-delà de celui de
l'événement n'est enregistré à côté, et la ligne ne peut être jointe à rien — la voie de recensement
ne reconnaît personne, il n'y a donc aucune seconde ligne à laquelle la joindre.

**L'arité d'une liste est un nombre choisi par le visiteur, ce que n'est aucune autre partie de la
forme.** Un nom de méthode vient d'un catalogue fermé ; combien de valeurs quelqu'un a mises dans une
liste, non. Cela reste un compte et non une valeur, c'est borné aux cinquante du bac à sable, et une
chaîne assez longue pour être distinctive de cette façon perd sa forme sur la borne du champ avant
d'atterrir. Ce que cela coûte est admis ici plutôt que laissé à découvrir : une ligne lisant
`OneOf(?, ?, ?, …)` avec un nombre inhabituel de marques est plus rare que la même étape avec deux.

**Le catalogue pourrait un jour porter un nom de méthode lui-même révélateur.** Le motif admet
n'importe quel nom de méthode que le catalogue peut produire, parce qu'il le doit ; si un générateur
est un jour nommé d'après quelque chose qui ne devrait pas être rapporté, le garde-fou est ce record
et la revue, pas la regex.

## Follow-up Actions

* **Ce qui échoue quand la décision est cassée, par construction plutôt que par contrôle :** le motif
  du collecteur pour le champ chaîne admet un point d'interrogation là où se tient un argument, et
  n'admet aucun autre caractère à cet endroit. Une charge utile portant
  `Any.String().StartingWith("ORD-")` n'échoue pas à une comparaison — elle échoue à correspondre, et
  est refusée au point d'entrée exactement comme une variante malformée. C'est la garantie que
  CONTRIBUTING préfère à une assertion, et elle tient contre n'importe quel émetteur plutôt que contre
  celui-ci seulement.
* **Et ce qui échoue comme contrôle, parce qu'une garantie au point d'entrée ne dit rien de ce que la
  page envoie :** un contrôle navigateur construit une chaîne portant un argument texte, presse
  Generate, et vérifie que le corps posté porte le template et ne contient nulle part la valeur
  saisie. Testé en le cassant avant la pull request, comme l'exige CONTRIBUTING.
* Le [plan de mesure](../measurement-plan-fr.md) gagne l'événement dans le tableau de la voie de
  recensement, dans les deux langues, et perd la part de son manque playground que ceci comble.
* La page vie privée énonce ce qui est désormais enregistré depuis le playground, dans les deux
  langues, et sa date de révision bouge avec. La phrase promettant que rien de ce qui y est saisi
  n'est jamais envoyé à un serveur reste vraie et mérite d'être gardée dans ces termes — cette
  décision est ce qui la maintient vraie.
* Le [guide de déploiement](../deployment-fr.md) énonce la position du nouveau champ dans le jeu de
  données et ce que signifie une chaîne absente sur une ligne qui devrait en avoir une.

## References

* [ADR-0023](0023-un-evenement-porte-une-variante-seulement-sil-a-une-porte-a-choisir-fr.md) — le
  champ qui peut être absent, et la variante que ceci ne réutilise délibérément pas
* La voie du parcours est délibérément hors périmètre ici et relève d'une décision à part : l'atteindre
  depuis le playground suppose un bandeau de consentement dans un document qui n'en a pas, ce qui
  arrivera avec son propre record
* [ADR-0012](0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md) — le collecteur que ceci
  étend
* [ADR-0010](0010-le-catalogue-du-playground-est-du-code-c-genere-pas-du-json-fr.md) — le catalogue
  généré d'où la forme est tirée
* [ADR-0016](0016-un-argument-liste-est-un-seul-champ-separe-par-des-virgules-fr.md) — un argument
  liste, et pourquoi un argument est du texte libre
* [`docs/design/specification.md`](../../design/specification.md) §10.3 (ce que le playground ne fait
  jamais), §15.1 (ce qui n'est jamais enregistré), §15.2 (l'événement dimensionné)
* [Le plan de mesure](../measurement-plan-fr.md) — la règle pour ajouter un événement, et le manque
  que ceci comble
