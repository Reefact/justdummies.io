# ADR-0012 | Le site exécute un script Worker, et seulement pour la mesure

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0012-the-site-runs-one-worker-script-for-measurement-en.md)

**Status:** Accepted
**Proposed:** 2026-08-16
**Accepted:** 2026-08-16
**Decision Makers:** Reefact

## Contexte

La spécification demande deux choses différentes à la mesure. §15.1 demande des chiffres de
fréquentation et de performance respectueux de la vie privée. §15.2 demande quelque chose de plus
étroit et de plus difficile : un événement portant un **emplacement** et une **variante**, parce
qu'une copie de commande d'installation émise sans dimension ne dit que « des gens copient », alors
que la question que la page principale est construite pour poser est quel moment les a convaincus et
par quelle porte ils sont sortis. §15.3 interdit l'ordinal de scène comme identifiant, sur un motif
empirique — la page est passée de onze à quatorze scènes entre deux brouillons et la sortie finale a
changé d'ordinal — et ne l'autorise qu'en champ secondaire.

La moitié de tout cela existe déjà. `CopyableCommand.astro` émet un événement DOM portant un
emplacement et une variante, et n'appelle délibérément aucune bibliothèque d'analytique ; son
commentaire dit que le composant n'a pas à savoir qui écoute. Personne n'écoute. Les emplacements en
service sont `hero`, `act-one-exit`, `act-two-exit` et `act-three-exit` : des noms stables, aucun
ordinal.

La page vie privée affirme aujourd'hui que Cloudflare Web Analytics est utilisé et qu'aucune mesure
plus fine — « savoir quel bouton précis vous avez cliqué, par exemple » — n'est activée.

Cloudflare Web Analytics est gratuit, ne dépose aucun cookie, n'identifie personne, et n'a de quota
d'aucune sorte. Il fournit des comptes de visites et les Core Web Vitals. Il n'a **aucune API
d'événements personnalisés** : sa propre documentation répond « Not yet, but we may add support for
this in the future », et il refuse les envois que son beacon n'a pas émis — « all requests should
originate from our beacon JavaScript ». Il sert donc §15.1 et ne peut pas servir §15.2.

§12.3 énonce que le site n'exécute aucun script serveur, et en donne la raison : les requêtes
servies comme assets statiques sont gratuites et illimitées, celles qui invoquent un script comptent
dans un quota, et l'épuisement de ce quota répond par une erreur plutôt que par un repli sur les
assets — « la différence entre un script et pas de script est celle entre un site qui se dégrade et
un site qui tombe ». La même section énonce qu'en introduire un est « une décision à prendre exprès,
jamais à découvrir dans un diff ». `wrangler.jsonc` portait ce raisonnement et aucun `main`.

La façon dont Cloudflare route un Worker qui a à la fois un script et des assets statiques porte
directement sur ce modèle de coût. Une requête qui correspond à un asset est servie depuis le
magasin d'assets **sans invoquer le script**, et reste gratuite et illimitée. Une requête qui ne
correspond à aucun asset est traitée par `not_found_handling` — également sans l'invoquer.
`run_worker_first` accepte une liste de motifs de chemin, et seuls les chemins qu'elle nomme
atteignent le script.

Les allocations du plan gratuit sont de 100 000 requêtes de script par jour et, pour Workers
Analytics Engine, 100 000 points de données écrits et 10 000 requêtes de lecture par jour.
Cloudflare énonce qu'il ne facture pas l'usage d'Analytics Engine aujourd'hui et annonce qu'il le
fera. Un compte sur le plan gratuit n'est pas basculé sur un plan payant par un dépassement : la
réponse à l'épuisement est le refus, pas une facture.

Zaraz propose `zaraz.track()`, appartient à Cloudflare, et est servi depuis `/cdn-cgi/` sur l'origine
même de ce site. Son allocation gratuite est d'un million d'événements par mois, **les pages vues
comptant dedans**, et le dépassement désactive Zaraz jusqu'au cycle de facturation suivant.

Deux contraintes ont été posées pour cette décision : rien qui coûte de l'argent, et rien qui
s'arrête.

§13.2 exige qu'aucun script ni style en ligne ne reste non couvert par la politique, et que toute
évolution de la politique soit validée par un chargement réel plutôt que par une revue. §12.5 liste
les propriétés que seul un déploiement réel tranche.

## Décision

**Le site exécute un script Worker, joignable sur un seul chemin et utilisé uniquement pour
enregistrer les événements dimensionnés de §15.2 dans Workers Analytics Engine, pendant que chaque
page, chaque asset et la 404 continuent d'être servis sans l'invoquer.**

## Justification

§15.2 n'est pas un ornement posé sur §15.1 ; c'est la partie de la mesure qui répond à la question
que la page principale existe pour poser. Web Analytics ne peut pas la porter, et ce n'est pas une
lacune à contourner mais un refus documenté à deux endroits — aucune API d'événements
personnalisés, et un point d'entrée qui rejette ce que son beacon n'a pas envoyé. Donc, ou bien
§15.2 reste non servi, ou bien autre chose le reçoit. C'est là tout ce qu'il fallait décider.

L'objection de §12.3 à un script est un modèle de coût et de panne, et ce modèle porte sur un script
qui se trouve **sur le chemin du site**. C'est ce qui rend l'épuisement catastrophique : si le script
répond pour les pages, son quota est le quota du site. Ce n'est pas ce qui est construit ici. Le
script confiné à un seul chemin, une requête de page, une requête d'asset et une 404 atteignent
chacune leur réponse sans que le script ne s'exécute, si bien que le quota que ce script peut épuiser
est le sien. L'objection est levée par construction plutôt que par promesse, et cette distinction est
la raison pour laquelle cet ADR peut exister sans contredire §12.3 — qui, de toute façon, demande une
décision délibérée plutôt qu'il n'en interdit une.

Les deux contraintes départagent ensuite les candidats. Rien ici ne coûte d'argent : chaque
allocation nommée dans le Contexte est celle du plan gratuit, et chaque réponse au dépassement est un
refus plutôt qu'une facture. « Rien qui s'arrête » est la contrainte qui discrimine réellement, et
c'est pourquoi la mesure est construite en **deux voies indépendantes** plutôt qu'en une. La moitié
qui ne doit jamais s'arrêter — les chiffres de fréquentation et de performance — repose sur le seul
produit sans aucun quota. La moitié qui a une allocation est celle dont la perte coûte une seule
dimension, et son seuil est de 100 000 commandes copiées en une journée, sur un site dont les pages
vues ne la consomment pas puisqu'elles sont servies comme assets.

C'est ce cadrage qui écarte Zaraz, qui conviendrait par ailleurs bien. Son allocation est consommée
par les pages vues autant que par les événements, donc son compteur avance que quelqu'un copie ou
non ; et son dépassement désactive Zaraz purement et simplement. Comme ce serait le même produit qui
porterait les deux voies, son mode de panne atteint la moitié qui ne doit pas s'arrêter. C'est le
seul candidat qui puisse réellement s'arrêter, et il arrête tout.

Garder le collecteur sur cette origine immobilise deux autres choses. Cloudflare reste l'unique
sous-traitant que la page vie privée ait à nommer, et les événements n'ajoutent rien à la politique
de contenu, puisque `connect-src 'self'` couvre déjà un envoi vers un chemin de ce site. Le seul
élargissement de politique de ce travail revient au beacon d'audience, et il est dérivé de l'artefact
construit pour que la politique ne soit jamais plus large que ce qui a été construit.

Le coût réel n'est pas architectural. La phrase de la page vie privée promettant qu'aucune mesure
plus fine n'est activée devient fausse le jour où le premier événement part, et elle doit être
réécrite dans les deux locales. C'est le prix de §15.2, et il se paie dans les textes.

## Alternatives considérées

### Cloudflare Web Analytics seul, en laissant §15.2 non servi

Considérée parce que c'est réellement la réponse honnête la moins chère : gratuite, illimitée, sans
script, sans ADR, sans texte de vie privée à réécrire, et elle sert §15.1 complètement. Laisser
l'émetteur existant émettre vers personne serait même défendable dans l'esprit d'ADR-0004 — rien ne
prétendrait mesurer ce que rien ne mesure.

Rejetée parce qu'elle se contente de la moitié de §15 qui n'a jamais fait débat en abandonnant celle
pour laquelle la section a été écrite. §15.2 en donne la raison dans ses propres mots : un événement
de copie sans dimension ne dit que « des gens copient ». Une mesure incapable de dire quel moment a
convaincu un lecteur laisse sans mesure la revendication éditoriale centrale de la page, qui est
précisément ce que toute la narration est construite pour éprouver.

### Zaraz

Considérée sérieusement, et c'est l'alternative la plus proche. `zaraz.track()` est exactement l'API
d'événements personnalisés qu'il faut ici ; c'est du Cloudflare, donc la page vie privée continue de
nommer un seul sous-traitant ; il est servi depuis `/cdn-cgi/` sur cette origine, donc
`script-src 'self'` l'admet déjà ; et il ne demande aucun script à écrire ni à maintenir ici.

Rejetée sur la contrainte « rien qui s'arrête » précisément. Son allocation mensuelle compte les
pages vues à côté des événements personnalisés, donc le compteur avance sur le trafic ordinaire
plutôt que seulement sur l'événement rare qui intéresse ce site — et le dépassement désactive Zaraz
jusqu'au cycle suivant. Comme un seul produit porterait alors les deux voies, cet arrêt emporterait
les chiffres de fréquentation en même temps que les événements. Tous les autres candidats échouent au
pire en perdant une dimension ; celui-ci échoue en perdant la mesure.

### Un service d'analytique tiers

Considérée parce que plusieurs sont sans cookie, savent porter des événements, et ne demanderaient
aucun code serveur ici — y compris des options auto-hébergeables, qui répondent autrement à la
contrainte de coût.

Rejetée parce qu'elle n'achète rien que le collecteur n'achète, et coûte trois choses qu'il ne coûte
pas. Elle ajoute un second sous-traitant à nommer sur la page vie privée, elle ajoute un hôte tiers à
la politique de contenu sur le chemin de chaque page, et elle est soit un abonnement, soit un serveur
à tenir. Là où une offre hébergée est gratuite, sa gratuité est une décision commerciale révocable,
ce qui est un appui plus faible qu'une allocation de plateforme documentée.

### Émettre vers un chemin qui ne correspond à aucun asset, et lire les journaux de l'hébergeur

Considérée parce qu'elle ne demande aucun script du tout : un beacon vers `/_e/<emplacement>/<variante>`
serait traité par la gestion de 404 existante, et les dimensions survivraient dans l'analytique de
l'hébergeur.

Rejetée parce que c'est de la mesure par effet de bord. Chaque événement coûterait une page 404
complète en réponse, les dimensions ne vivraient que comme la forme d'une URL dans des journaux ayant
leur propre rétention et leur propre granularité, et rien ne relierait les deux moitiés de la paire.
Cela fonctionne exactement jusqu'à ce que quelqu'un range la gestion des 404, et cela échouerait
silencieusement ce jour-là.

## Conséquences

### Positives

§15.2 obtient une réponse, et l'émetteur qui parlait à une pièce vide depuis qu'il a été écrit a
enfin un auditeur. La question que la page principale a été construite pour poser devient une
question que le mainteneur peut lire.

La moitié de la mesure qui ne doit jamais s'arrêter repose sur le seul produit sans quota à épuiser.
Perdre la voie des événements coûte une dimension ; cela ne coûte ni les chiffres de fréquentation,
ni quoi que ce soit que voit un visiteur.

§15.3 gagne un second point d'application. Le build refuse déjà de livrer un emplacement portant un
chiffre ; le collecteur refuse désormais d'en enregistrer un, donc la règle tient là où la donnée
entre autant que là où elle est produite. L'ordinal est écrit parmi les nombres mesurés plutôt que
parmi les dimensions de regroupement, ce qui inscrit l'interdiction dans la forme de la donnée au
lieu d'un commentaire au-dessus.

Cloudflare reste l'unique sous-traitant, et les événements n'ajoutent rien à la politique de contenu.

### Négatives

Le dépôt contient désormais du code côté serveur. Il a été un artefact statique et un ensemble de
scripts depuis le début, et c'est une autre nature de chose à raisonner, à tester et à maintenir.

La page vie privée doit en dire plus qu'avant, dans les deux locales, et la phrase qui promettait
qu'aucune mesure plus fine n'était activée disparaît.

Analytics Engine ne livre aucun tableau de bord. Lire ce qui a été enregistré demande d'écrire du SQL
contre son API, et ce qui affichera la réponse est un travail que cette décision crée sans le faire.

Le confinement dans `wrangler.jsonc` devient porteur d'une façon qu'une ligne de configuration ne
laisse pas voir. Élargir `run_worker_first`, ou le retirer, remet le site devant le quota et rouvre
tout ce à quoi §12.3 objectait.

### Risques

**Cloudflare a annoncé qu'Analytics Engine serait facturé.** L'allocation du plan gratuit est
documentée et ce site en est très loin, et un compte sur le plan gratuit répond à l'épuisement par un
refus plutôt que par une facture — mais les conditions appartiennent à Cloudflare, et c'est ici la
ligne à relire le jour où elles changent.

**Un confinement est une configuration, et les configurations s'élargissent.** La prochaine personne
ayant une raison d'exécuter le Worker sur un second chemin ne trouvera qu'un commentaire en travers.
C'est nommé ici pour que l'élargir soit une décision que quelqu'un prend plutôt qu'une dérive que
personne ne remarque.

**Le comportement de routage et les hôtes du beacon sont affirmés d'après la documentation, pas
d'après ce déploiement.** Que ces deux hôtes soient les bons, et qu'une requête de page n'invoque
jamais le script, relèvent exactement de la classe de propriétés que §12.5 dit ne se trancher que par
un déploiement réel. En attendant, ce sont des attentes documentées, et les Actions de suivi disent
comment elles se vérifient.

## Actions de suivi

* `scripts/verify-output.sh` gagne trois assertions, chacune éprouvée en la cassant avant d'atterrir :
  aucun emplacement de l'artefact ne porte de chiffre (§15.3), aucune paire emplacement/variante ne
  désigne deux commandes ou deux liens différents (§15.2) — la paire est délibérément répétée là où
  deux éléments font la même chose, donc ce qui est vérifié est la charge utile et non le nombre — et
  le beacon d'audience et la politique de contenu s'accordent dans les
  deux sens : un beacon que la politique bloquerait fait échouer le build, et une politique nommant
  des hôtes qu'aucun document ne contacte le fait échouer aussi.
* Le collecteur valide chaque champ contre une forme plutôt que de lui faire confiance, et refuse un
  emplacement portant un chiffre, de sorte que §15.3 est appliqué au point où la donnée entre dans le
  jeu de données.
* Le [guide de déploiement](../deployment-fr.md) gagne l'étape qui allume la mesure — le site du
  tableau de bord, le jeton public du beacon, et le jeu de données. La façon dont c'est câblé est de
  la spécification et vit là-bas, pas ici.
* Déclarer le binding rend un réglage de compte obligatoire pour **tout** déploiement, mesure ou
  non : Analytics Engine doit être activé sur le compte, une fois, sans quoi l'API refuse de créer
  une version. C'est l'étape 5 du guide qui le porte, parce qu'il précède la première publication
  plutôt que la mesure.
* Deux choses à confirmer sur un déploiement réel, et à ajouter à la liste de §12.5 en attendant : que
  le beacon se charge et rapporte sous la politique générée, et qu'une requête de page n'invoque
  jamais le Worker.
* Lire la donnée — la requête, et ce qui l'afficherait — ne fait pas partie de cette décision et n'en
  découle pas.

## Références

* [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md) — la règle qui tient le beacon hors
  d'un build sans jeton vers qui rapporter
* [`docs/design/specification.md`](../../design/specification.md) §15 (mesure), §12.3 (aucun script
  serveur), §12.5 (ce qu'un déploiement réel tranche), §13.2 (la politique de contenu)
* La FAQ de Cloudflare Web Analytics, sur l'absence d'événements personnalisés et le refus des envois
  directs
* La documentation Cloudflare Workers sur le routage des assets statiques, `run_worker_first`, et les
  allocations du plan gratuit pour Workers et Analytics Engine
