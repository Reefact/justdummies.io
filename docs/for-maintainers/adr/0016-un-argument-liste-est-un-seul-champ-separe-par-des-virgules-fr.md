# ADR-0016 | Un argument liste est un seul champ séparé par des virgules

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0016-a-list-argument-is-one-comma-separated-field-en.md)

**Statut :** Proposée
**Proposée :** 2026-08-18
**Décideurs :** Reefact

## Contexte

La spécification §10.5 exige un catalogue complet : chaque membre public y figure, ou en est exclu
avec un motif énoncé. Ce motif est une trace auditable, pas une fonctionnalité — un membre qui
n'apparaît jamais que dans le rapport d'exclusion est une contrainte que le playground ne sait pas
démontrer.

La première itération du catalogue dessinait un champ de formulaire par paramètre, et un champ
tenait une valeur. Tout paramètre nommant une collection échouait donc à la classification faute de
forme pour la demander, et quarante-cinq membres ont été exclus sur ce seul motif — `Except` et
`OneOf`, sur chacun des vingt-trois générateurs scalaires que publie la bibliothèque. Ces deux-là ne
sont pas marginaux : « une valeur prise dans cet ensemble » et « une valeur qui n'est aucune de
celles-ci » comptent parmi les premières contraintes qu'un lecteur cherche après avoir découvert la
bibliothèque, et aucune n'existait dans le playground.

La bibliothèque les déclare toutes deux en tableau `params` sur chaque générateur scalaire. Le seul
paramètre de collection déclaré autrement est la surcharge `IEnumerable<string>` de
`AnyString.OneOf`, qui exprime la même contrainte que sa jumelle `params` posée à côté d'elle.

Deux propriétés de la conception environnante pèsent sur la façon de demander un tel paramètre. Une
étape de chaîne est plate (ADR-0010) : ses arguments sont du texte brut positionnel, une chaîne par
paramètre, que la table de dispatch générée analyse et transmet. Et le bloc et la ligne en dessous se
partagent le travail (ADR-0014) : le bloc est la lecture de la chaîne, la barre de code est la ligne
qui compile et part au presse-papiers — la ligne qu'un lecteur aurait écrite lui-même.

## Décision

**Un paramètre déclaré en tableau `params` d'un type scalaire que le playground sait déjà analyser
est demandé au visiteur dans un seul champ séparé par des virgules, et réécrit dans la ligne copiée
sous forme de littéraux égrenés dans l'appel.**

## Justification

Cataloguer ces membres coûte un séparateur, pas une architecture. Un champ séparé par des virgules
maintient un paramètre à exactement un morceau de texte brut, ce que l'étape plate, son entrée de
dispatch et son rejeu prennent déjà — toute la modification atterrit donc dans l'analyse et le rendu,
et rien de la façon dont une chaîne est modélisée, exécutée ou rejouée ne bouge. Quarante-cinq
membres atteignent le visiteur au prix d'une forme, et ce sont les plus susceptibles d'être cherchés.

Analyser chaque valeur selon son propre type d'élément, plutôt que de traiter le champ comme un
nouveau genre de valeur, est ce qui rend ce coût honnête. Chaque valeur est tenue aux règles de son
type, à son propre plafond de bac à sable et à sa propre formulation, si bien qu'un champ liste dit
ce que dit tout autre champ de ce type. Le coût accepté est que le message nomme le type plutôt que
la position fautive ; le champ est une entrée unique que le visiteur a déjà sous les yeux, et un
vocabulaire partagé avec le reste du playground vaut mieux que l'indice.

Égrener les valeurs dans la ligne copiée suit le partage posé par l'ADR-0014. La barre promet la
ligne qu'un lecteur aurait écrite, et là où la bibliothèque déclare `params`, cette ligne ne contient
aucune construction de tableau. Tenir cette promesse implique que le catalogue ne peut accepter qu'un
paramètre tableau dont la déclaration autorise l'égrènement — un paramètre déclaré autrement est donc
exclu, motif à l'appui, plutôt qu'émis sous une seconde forme. Rien dans la bibliothèque n'est
déclaré ainsi aujourd'hui ; ce que la règle achète, c'est qu'un changement qui en introduirait un
soit signalé plutôt que mal émis en silence.

La surcharge de collection non tableau qui subsiste reste exclue parce que la cataloguer offrirait au
visiteur deux fois la même contrainte, sous un seul nom, sans rien pour les distinguer. La tenir hors
du combo n'est toutefois pas le fait de cette décision : l'ADR-0015 pose déjà qu'un nom ayant une
surcharge qui fonctionne est un nom qui fonctionne, si bien que la surcharge exclue est masquée par
celle que cette décision rend disponible. Les deux décisions se rencontrent là, et elles s'accordent :
ce que l'ADR-0015 aurait autrement nommé comme indisponible, celle-ci le rend offrable — le résultat
que ce record voulait sans pouvoir le produire seul.

Ce que coûte le séparateur est réel et borné : une valeur vide, ou portant une virgule ou des espaces
en bordure, ne s'écrit pas dans un tel champ. La barre de code imprime les valeurs exactement telles
qu'elles seront transmises, si bien qu'un visiteur qui rencontre un de ces cas voit ce qu'il a obtenu
au lieu de devoir le deviner.

## Alternatives considérées

### Un widget répétable — une entrée par valeur, avec des contrôles pour en ajouter et en retirer

Considérée parce qu'elle exprime toute valeur qu'un tableau `params` peut contenir, y compris celles
qu'un séparateur avale, et n'impose aucune convention à expliquer au visiteur.

Rejetée parce qu'elle transforme un paramètre en un nombre inconnu d'entrées, alors que toute la
chaîne repose sur l'inverse : les arguments d'une étape sont du texte brut positionnel, une chaîne
par paramètre, et la table de dispatch, le rejeu, le test d'écrivabilité et le rendu du bloc les
lisent tous ainsi. Chacun d'eux devrait apprendre l'existence d'un paramètre au nombre d'entrées
variable, pour acheter une échappatoire à des valeurs dont une démonstration de la bibliothèque n'a
que rarement besoin.

### Les laisser exclus jusqu'aux générateurs composites

Considérée parce que les deux ont été exclus ensemble à la première itération, et qu'une passe
ultérieure unique aurait pu les couvrir d'un coup.

Rejetée parce que les deux n'ont en commun que la date à laquelle ils ont été reportés. Un générateur
composite réclame un générateur imbriqué dans une chaîne, ce qui change ce qu'est une chaîne ; ceux-ci
réclament de quoi écrire plusieurs valeurs dans un champ. Retenir le bon marché derrière le coûteux
n'achète rien et repousse un gain disponible aujourd'hui.

### Construire toujours le tableau explicitement dans la ligne copiée

Considérée parce qu'elle supprime l'exigence que la déclaration autorise l'égrènement : un paramètre
tableau ordinaire serait catalogué lui aussi, et une seule forme d'émission couvrirait les deux.

Rejetée parce qu'elle dépense la promesse de la barre pour acheter un cas que la bibliothèque n'a
pas. La ligne transmise cesserait d'être celle qu'un lecteur aurait écrite, sur chacun des membres
que cette décision existe pour ajouter, afin qu'une forme que rien ne déclare aujourd'hui soit
couverte aussi.

## Conséquences

### Positives

* Quarante-cinq membres passent du rapport d'exclusion au catalogue, sur tous les générateurs
  scalaires à la fois, dont les deux contraintes qu'un lecteur cherche le plus probablement en
  premier.
* Le modèle de chaîne est intact : un paramètre reste un morceau de texte brut, si bien que le
  dispatch, le rejeu et le bloc gardent la forme que l'ADR-0010 leur a donnée.
* Une valeur dans une liste est tenue exactement aux règles, aux plafonds et à la formulation
  auxquels son type est tenu partout ailleurs dans le playground.

### Négatives

* Une valeur vide, ou portant une virgule ou des espaces de bordure, ne s'écrit pas dans un tel
  champ.
* Une valeur fautive est nommée par son type, pas par sa position dans la liste.
* Un paramètre tableau dont la déclaration n'autorise pas l'égrènement devient une exclusion du
  catalogue. Aucun tel paramètre n'existe dans la bibliothèque aujourd'hui ; s'il en apparaît un, la
  contrainte quitte le playground plutôt que d'être émise sous une forme que la barre ne promet pas.

### Risques

* Le séparateur est une convention, et une convention s'apprend. Le champ la porte là où elle se lit
  et le nom accessible la porte en toutes lettres, mais un visiteur qui ne prend ni l'un ni l'autre
  la rencontre comme un message d'erreur plutôt qu'avant de se tromper.

## Actions de suivi

* **Une assertion dans le build.** Une vérification navigateur pilote le champ comme le ferait un
  visiteur et vérifie les deux moitiés de la décision : que les valeurs atteignent la bibliothèque —
  la valeur tirée appartient à l'ensemble saisi — et que la ligne copiée les égrène. Elle a été
  regardée passer au rouge (les valeurs du champ n'étant plus détourées) puis remise en état.
* **Une garantie par construction.** Le générateur lui-même refuse de cataloguer un paramètre tableau
  dont la déclaration n'autorise pas l'égrènement, de sorte que la ligne émise ne peut pas devenir
  silencieusement du C# invalide par un changement de la bibliothèque ; elle devient une exclusion
  énoncée.
* **Un diff à lire.** Le rapport d'exclusion est régénéré et committé à chaque génération, si bien
  qu'un membre qui entre au catalogue ou en sort est visible en revue plutôt que découvert sur
  l'artefact publié.

## Références

* Spécification §10.4–§10.7 — le catalogue, sa règle de complétude, et ce qu'il permet de dériver
* [ADR-0010](0010-le-catalogue-du-playground-est-du-code-c-genere-pas-du-json-fr.md) — l'étape de
  chaîne plate et la table de dispatch générée que cette décision laisse intactes
* [ADR-0014](0014-le-playground-construit-dans-le-bloc-quil-donne-a-lire-fr.md) — le partage entre le
  bloc comme lecture et la barre comme code, qui décide de la réécriture d'une liste
* [ADR-0015](0015-le-combo-nomme-ce-que-le-playground-ne-peut-pas-offrir-fr.md) — nomme dans le combo
  ce que cette interface ne sait pas exprimer ; quarante-cinq des membres qu'il compte deviennent
  offrables ici, et sa règle de masquage est ce qui tient la surcharge redondante hors de la liste
