# ADR-0014 | Le parcours est mesuré dans une troisième voie, soumise au consentement

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0014-the-journey-is-measured-in-a-third-lane-gated-on-consent-en.md)

**Statut :** Accepté
**Proposé le :** 2026-08-17
**Accepté le :** 2026-08-17
**Décideurs :** Reefact

## Contexte

[ADR-0012](0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md) a tranché la façon dont §15 est
servi : Cloudflare Web Analytics pour les chiffres de fréquentation et de performance de §15.1, et un
collecteur Worker sur un seul chemin pour l'événement de copie dimensionné de §15.2. Les deux sont
gratuits, sans quota ou presque, et aucun ne dépose de cookie ni n'identifie personne. Cloudflare est
l'unique sous-traitant que la page vie privée ait à nommer.

Ces deux voies disent combien de personnes sont arrivées et combien ont copié une commande. Aucune ne
dit ce qui s'est passé entre les deux. La page principale est une narration en trois actes et seize
scènes nommées ; §15.2 énonce que l'information utile est **quel moment les a convaincus**, et un
compte de copies ne porte la réponse que pour les lecteurs ayant atteint un bouton de copie. Où un
lecteur s'est arrêté, quelles scènes il a lues avant celle qui l'a décidé, ce qu'il a comparé
d'abord, et si une seconde visite est la même personne qui revient sont tous hors de ce que l'une ou
l'autre voie sait exprimer. Web Analytics n'a aucune API d'événements personnalisés, et le collecteur
n'enregistre aucun identifiant, aucun horodatage au-delà du sien, et aucune dimension de page — par
construction, et c'est cette construction qui l'exempte de consentement.

Google Analytics 4 répond à ces questions, par des explorations de chemin et d'entonnoir à l'échelle
de la session. Il est gratuit au volume de ce site. Il écrit des cookies propriétaires portant un
identifiant client aléatoire, ce qui est ce qui permet à deux visites d'un même navigateur de compter
pour un lecteur.

La CNIL n'a jamais exempté Google Analytics de consentement, dans aucune version, et énonce
qu'aucune configuration ne satisfait les critères d'exemption : les cookies `_ga` n'ont pas la mesure
d'audience pour finalité exclusive. Depuis le 1er janvier 2026, le programme d'évaluation de la CNIL
est remplacé par une auto-évaluation contre des critères publiés, ce qui ne change pas ce constat. Un
mécanisme de consentement est donc requis, et ce dépôt n'en a aucun : il ne contient ni cookie, ni
`localStorage`, ni `sessionStorage`, ni la moindre occurrence du mot consentement.

Le mode consentement de Google a deux formes. La forme avancée charge la balise immédiatement et
envoie des pings sans cookie tant que le consentement est refusé, que Google modélise dans les
rapports. La forme basique ne charge rien tant que le consentement n'est pas accordé. Un ping sans
cookie atteint tout de même les serveurs de Google, et la lecture alignée sur l'EDPB est qu'il s'agit
d'un traitement demandant une base légale que le mode consentement ne fournit pas de lui-même.

Depuis le 15 juin 2026, `ad_storage` est le seul réglage gouvernant si les données collectées par une
balise Google atteignent un compte Google Ads ; l'interrupteur Google Signals de la console Analytics
ne restreint plus ce flux.

ADR-0012 a examiné puis rejeté « un service d'analytique tiers », sur trois coûts : un second
sous-traitant à nommer sur la page vie privée, un hôte tiers dans la politique de contenu sur le
chemin de chaque page, et soit un abonnement, soit un serveur à tenir. Tous les candidats qu'il a
pesés étaient sans cookie.

L'objection de §12.3 à un script serveur est un modèle de coût et de panne portant sur un script
placé sur le chemin du site. §13.2 interdit l'autorisation large dans la politique de contenu —
`unsafe-inline` et `unsafe-eval` — et exige que toute évolution de la politique soit validée par un
chargement réel plutôt que par une revue. §13.3 exige un budget chiffré pour le JavaScript propre à
la page principale, mesuré à chaque build.

`scripts/generate-headers.mjs` dérive les hôtes tiers de l'artefact construit plutôt que d'un
drapeau, afin que la politique ne soit jamais plus large que ce qui a été construit.
`scripts/verify-output.sh` éprouve le beacon et la politique l'un contre l'autre dans les deux sens.

Astro collecte les balises `<script>` bundlées depuis le graphe de modules et non depuis l'arbre de
rendu, et enregistre chacune comme point d'entrée de build. Un script dans un composant qui n'est
jamais rendu est donc tout de même émis en chunk.

## Décision

**Le parcours est mesuré par Google Analytics dans une troisième voie qui ne démarre que sur un oui
explicite, en laissant les deux voies existantes intactes et sans rien demander à personne, et
gouvernée par un commutateur de build distinct de l'identifiant de mesure.**

## Justification

La question que §15.2 existe pour poser — quel moment a convaincu un lecteur — n'est qu'à moitié
répondue par un compte de copies, parce qu'un compte ne dit rien des lecteurs qui n'en ont jamais
atteint une. La page est construite comme une suite de temps nommés, et c'est sur cette suite que
repose la revendication éditoriale. Comme aucune des deux voies existantes ne sait exprimer un
parcours, ou bien la question reste à moitié répondue, ou bien quelque chose qui sait en exprimer un
est ajouté. C'est là tout ce qu'il fallait trancher.

L'ajouter en **troisième voie plutôt qu'en remplacement** est ce qui garde le coût proportionné. Les
chiffres qui ne doivent pas s'arrêter sont déjà portés par la voie sans quota, et le compte de
conversions est déjà porté par un collecteur qui mesure tout le monde ; laisser les deux intactes
signifie qu'un refus coûte un parcours et jamais un total. Cela signifie aussi que la mesure la plus
susceptible d'être refusée est celle dont la perte est la moins chère, et que les totaux du site
restent non biaisés par le taux de refus — ce qu'une installation Google en voie unique ne serait
pas, son dénominateur devenant la fraction consentante.

Le consentement n'est pas ici un choix de conception mais la position énoncée de la CNIL, donc le
seul vrai choix est celui du mode. **Le mode basique est retenu contre l'avancé** parce que les pings
sans cookie de l'avancé sont précisément ce que ce site défendrait le plus mal : un transfert vers
Google avant que le visiteur ait répondu, en échange de chiffres modélisés. Que rien ne charge avant
une réponse est aussi la seule version de la promesse qu'un contrôle sache éprouver, et elle est
éprouvée plutôt qu'affirmée.

Les trois signaux publicitaires restent refusés en permanence au lieu de suivre la réponse, parce
qu'`ad_storage` est désormais le seul verrou du flux vers Ads et que ce site n'a aucune finalité
publicitaire à servir. Garder les hôtes publicitaires hors de la politique de contenu fait de ce refus
quelque chose que le navigateur applique : un signal accordé produit une requête refusée et une
violation rapportée, plutôt qu'un changement de comportement silencieux. Cela transforme la partie la
plus faible de la décision — un réglage de console que personne ici ne peut lire — en une assertion
d'artefact et un contrôle navigateur.

Les trois coûts d'ADR-0012 sont assumés plutôt qu'écartés par l'argument, et l'un d'eux est pire qu'il
ne l'était là-bas : tous les candidats qu'il a pesés étaient sans cookie, et celui-ci ne l'est pas. Ce
qui a changé n'est pas le prix mais le besoin — cet ADR répondait à §15.1 et §15.2, et ni l'une ni
l'autre ne demande un parcours. Les deux coûts de politique sont par ailleurs plus petits qu'ils ne se
lisent : l'interdit de §13.2 porte sur l'autorisation large, et rien ici n'en demande — la balise est
un hôte nommé, et le seul script en ligne qu'elle ajoute est couvert par une empreinte comme tous les
autres. Ce qui s'élargit réellement, c'est que la politique nomme un hôte tiers sur le chemin de
chaque page.

Le commutateur est en **deux variables parce qu'elles font deux métiers**. Un identifiant est une
valeur cherchée une fois et conservée ; un état est une décision. Les fondre en une seule signifierait
qu'éteindre la mesure coûte l'identifiant et que la rallumer demande d'aller le rechercher, ce qui
rend cher — et donc improbable — ce qui devait être réversible. Les deux sont exigées et une faute de
frappe fait échouer le build, parce qu'une variable d'état dont la faute signifie silencieusement
« éteint » n'achète rien de l'explicite pour lequel elle a été choisie. C'est plus strict que le jeton
du beacon d'à côté, et l'asymétrie est le propos : un jeton absent ne peut que mesurer moins, tandis
qu'un état absent laisse la question répondue par une absence.

Faire du commutateur un réglage de build le garde dans l'artefact et dans l'historique du dépôt, de
sorte qu'éteindre la mesure est un acte enregistré plutôt qu'un réglage de console que personne ne
peut dater. C'est l'option la plus lente, et elle est choisie en le sachant ; le levier immédiat,
quand il en faut un, est hors de ce dépôt et consiste à supprimer le flux de données.

La balise est en ligne plutôt que bundlée pour une raison qui n'est pas de style. Comme Astro
enregistre les scripts depuis le graphe de modules, une balise bundlée laisserait un chunk nommant un
hôte Google sur un build qui ne la rend nulle part — un hôte qu'aucun document ne charge, qu'aucune
politique ne peut honnêtement admettre, et que le budget de taille compte en entier. En ligne,
elle n'entre jamais dans le graphe, donc « éteint signifie que la chaîne est absente » tient par
construction. Porter l'identifiant sur un attribut plutôt que dans le corps garde les octets hachés
identiques d'une page et d'un build à l'autre, si bien que faire tourner l'identifiant ne remue pas la
politique.

## Alternatives considérées

### Laisser §15 tel qu'ADR-0012 l'a tranché

Considérée parce que c'est la réponse honnête la moins chère, et parce qu'ADR-0012 est récent,
cohérent, et paie déjà §15.1 et §15.2 en entier. Elle ne coûte ni bandeau de consentement, ni second
sous-traitant, ni cookie, ni réécriture d'une page vie privée réécrite la veille.

Rejetée parce que la question que la page principale est construite pour poser n'est pas entièrement
répondue par ce qu'il tranche. Un compte de copies décrit les lecteurs arrivés jusqu'à une offre et ne
dit rien de ceux partis avant — qui sont le groupe le plus nombreux, et celui dont le comportement
changerait la page. La revendication éditoriale selon laquelle c'est la narration qui convainc est
exactement celle qui reste sans mesure.

### Un service d'analytique tiers sans cookie

Considérée parce que plusieurs existent, que plusieurs savent exprimer un parcours, que plusieurs ne
demanderaient aucun bandeau, et que l'un d'eux laisserait intactes les promesses de la page vie
privée sur les cookies. C'est aussi l'option que décrivait réellement l'alternative rejetée
d'ADR-0012.

Rejetée parce que l'exploration dont ce site a besoin — où un lecteur s'est arrêté, par quel chemin, à
travers les sessions — est la partie que ces outils font le moins bien, la plupart refusant
délibérément de reconnaître un navigateur qui revient. En choisir un achèterait un coût de vie privée
plus petit et une réponse plus petite, et c'est la réponse plus petite qui est achetée. Là où une
offre hébergée est gratuite, sa gratuité reste une décision commerciale révocable.

### Google Analytics en mode consentement avancé

Considérée parce que c'est ce qu'utilisent la plupart des implémentations, et parce qu'elle récupère
une part substantielle de ce qu'un refus coûte : la balise charge tout de suite, envoie des pings sans
cookie, et Google modélise les trous dans les rapports.

Rejetée sur les pings. Ils atteignent Google avant que le visiteur ait répondu, et la lecture que ce
site devrait défendre est qu'il s'agit d'un traitement sans base légale. Cela rend aussi invérifiable
la promesse centrale du site : « rien n'atteint Google avant votre accord » est une affirmation qu'un
contrôle sait tenir, « quelque chose atteint Google mais c'est anonyme » ne l'est pas.

### Google Analytics sans bandeau

Considérée parce que c'est le moins de travail, que cela donne des données complètes, et parce que le
risque appartient au mainteneur.

Rejetée parce que la position de la CNIL n'est pas ambiguë et qu'aucune configuration n'y répond : ce
n'est donc pas un risque que l'on pèse mais une règle que l'on ignore. Cela demanderait aussi de
supprimer les promesses de la page vie privée sur les cookies sans rien offrir à la place, sur un site
dont la page vie privée est l'une des raisons d'être.

### Une seule variable, vide pour désactiver

Considérée parce que c'est le motif qu'utilise déjà le jeton du beacon, qu'une variable est plus
simple que deux, et que cela ne demande aucune validation au-delà de la présence.

Rejetée parce que les deux valeurs ne sont pas une seule chose. Vider la variable pour éteindre la
mesure jette l'identifiant, donc la rallumer demande d'aller le rechercher dans la console Google —
une décision réversible rendue chère par son propre commutateur. Une variable absente est en outre
indiscernable d'une variable mal configurée, ce qui est exactement l'ambiguïté qu'un état nommé en
toutes lettres supprime.

## Conséquences

### Positives

La question que la page principale a été construite pour poser devient répondable sur toute sa
longueur plutôt qu'à ses seules sorties, et les seize scènes cessent d'être sans mesure.

Les chiffres qui ne doivent pas s'arrêter ne peuvent pas être arrêtés par ceci. Les comptes de
fréquentation et de conversion couvrent toujours chaque visiteur, donc le taux de refus change ce que
l'on sait du parcours et rien des totaux — et le taux de conversion se lit toujours contre un
dénominateur non biaisé.

Le refus permanent des signaux publicitaires est appliqué par la politique de contenu et par un
contrôle navigateur, plutôt que par un réglage de console et une promesse.

Éteindre la mesure est un acte enregistré et daté dans le dépôt, et cela ne coûte ni l'identifiant ni
un aller-retour dans la console Google.

§15.3 gagne un troisième point d'application : l'ordinal est rapporté comme un nombre mesuré et la
scène est identifiée par son nom stable, comme elle l'est déjà dans l'artefact et au collecteur.

### Négatives

Google devient un second sous-traitant, hors de l'Union européenne, et la page vie privée doit le dire
dans les deux locales. Quatre de ses phrases — aucun cookie de suivi, un outil qui n'en dépose aucun,
Cloudflare unique sous-traitant, et rien à effacer — étaient vraies et deviennent conditionnelles ou
fausses.

Le site écrit pour la première fois un état persistant côté client, et pose pour la première fois une
question avant d'avoir fini d'être lu. Ce sont deux changements de produit visibles, pas de la
plomberie.

La politique de contenu nomme un hôte tiers sur le chemin de chaque page, ce qui est le coût
qu'ADR-0012 avait nommé et refusé de payer.

Un visiteur qui accepte télécharge environ dix fois le poids du beacon d'audience depuis un tiers.

Deux variables de dépôt deviennent obligatoires pour tout build, y compris ceux qui ne mesurent rien,
si bien qu'un fork ou un clone neuf échoue tant que les deux ne sont pas posées.

Le parcours n'est connu que pour la fraction consentante, donc chaque chiffre de chemin et
d'entonnoir est un échantillon et non un recensement, et le lire comme un recensement serait l'erreur
que cet arrangement invite à commettre.

### Risques

**Un réglage de console qu'aucun contrôle ne peut tenir.** La page vue sur changement d'historique de
l'Enhanced Measurement doit être désactivée, parce que la page principale pousse un état d'historique
à chaque clic sur une ancre interne. Laissée active, chaque clic de chevron rapporte une page vue et
gonfle silencieusement tous les chiffres de la page principale. Aucun paramètre de balise ne le règle,
et les contrôles navigateur neutralisent la balise, donc rien ici ne peut le détecter.

**La forme du mode consentement appartient à Google.** Les signaux publicitaires sont refusés dans cet
artefact, mais ce que signifie un signal refusé est défini par Google, et cela a été redéfini en juin
2026. C'est la ligne à relire le jour où ce sera redéfini à nouveau.

**Une troisième voie est une voie, et les voies s'accumulent.** Ce qui rend celle-ci défendable est que
les deux qu'elle rejoint sont intactes et inconditionnelles. Une modification qui ferait dépendre un
chiffre de fréquentation de la voie consentante retirerait cela, et le ferait sans rien faire échouer.

## Actions de suivi

* `scripts/verify-output.sh` gagne l'assertion balise/politique en trois directions, chacune éprouvée
  en la cassant d'abord : une balise que la politique n'admet pas entièrement, une politique nommant
  des hôtes qu'aucun document ne porte, et — la direction dont le beacon n'a jamais eu besoin — un
  hôte Google apparaissant dans un chunk bundlé, ce qui est ce qui déferait silencieusement la
  décision « en ligne » ci-dessus.
* Le même script vérifie que chaque signal de consentement publicitaire est refusé dans le document
  livré et accordé nulle part, de sorte que la décision tient là où la donnée est produite.
* `tests/browser/consent.spec.ts` tient la promesse elle-même : rien n'atteint Google avant une
  réponse, refuser ne charge rien et est mémorisé, accepter charge la balise, et refuser est offert
  exactement aussi visiblement qu'accepter. `tests/browser/policy.spec.ts` éprouve les hôtes de
  collecte par une vraie requête et vérifie que les hôtes publicitaires restent refusés.
* `tests/browser/support/harness.ts` répond localement aux hôtes Google, sans quoi une release
  rapporterait une suite entière de parcours inventés dans la propriété réelle.
* `scripts/check-budgets.sh` déclare le poids de la balise dans son bloc informatif, puisqu'un budget
  qui exclut silencieusement une partie de ce qu'un visiteur télécharge se lit comme complet tout en
  étant court de ce qu'il a sauté.
* Le [guide de déploiement](../deployment-fr.md) gagne l'étape qui allume la voie : la propriété, les
  deux variables, les dimensions personnalisées à déclarer, et le réglage d'Enhanced Measurement nommé
  dans les Risques — qui a sa place là précisément parce qu'aucun contrôle ne peut le tenir.
* Déclarer les dimensions personnalisées n'est ni optionnel ni rétroactif : un paramètre non déclaré
  n'est pas exploitable en rapport, et le déclarer plus tard ne remplit pas le passé.
* Lire la donnée — les explorations, et ce qu'on en ferait — ne fait pas partie de cette décision.

## Références

* [ADR-0012](0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md) — les deux voies que
  celle-ci rejoint, et l'alternative rejetée qu'elle rouvre
* [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md) — la règle qui tient le bandeau hors
  d'un build n'ayant rien à faire consentir
* [`docs/design/specification.md`](../../design/specification.md) §15 (mesure), §13.2 (la politique
  de contenu), §13.3 (performance), §16 (ce qui est vérifié, et par quoi)
* [Le plan de mesure](../measurement-plan-fr.md) — les événements, et la question à laquelle chacun
  répond
* La position de la CNIL sur la mesure d'audience exemptée de consentement, et ses critères publiés
* La documentation de Google sur le mode consentement, et sur l'usage d'une balise sous une politique
  de sécurité du contenu
