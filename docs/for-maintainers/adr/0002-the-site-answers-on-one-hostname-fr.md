# ADR-0002 | Le site répond sur un seul nom d'hôte

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0002-the-site-answers-on-one-hostname-en.md)

**Statut :** Accepté
**Proposé :** 2026-08-11
**Accepté :** 2026-08-12
**Décideurs :** Reefact

## Contexte

Le déploiement est un Worker qui sert des assets statiques. Un Worker est joignable par défaut sur
`<nom>.<sous-domaine>.workers.dev`, et séparément sur tout domaine personnalisé qui lui est
rattaché. Depuis que `justdummies.io` a été rattaché, les deux répondent — les mêmes octets, sous
deux noms, tous deux résolvables publiquement.

Le nom d'hôte `workers.dev` porte le sous-domaine du compte dans son nom : il nomme donc le compte
plutôt que le site.

Deux réglages wrangler gouvernent deux noms d'hôte différents, indépendamment : `workers_dev`
gouverne `<nom>.<sous-domaine>.workers.dev`, et `preview_urls` gouverne
`<version>-<nom>.<sous-domaine>.workers.dev`. Le mécanisme de prévisualisation — une version
téléversée sans être promue, ce que fait `pnpm preview` — utilise la seconde forme.

Le nom d'hôte `workers.dev` a été la seule adresse du site entre le premier déploiement et le jour
où le domaine a été rattaché. Les étapes 5 et 6 du guide de déploiement vérifient un déploiement
contre elle, et la mesure de compression de l'étape 6 y a été prise.

`preview_urls` n'a jamais été déclaré dans la configuration de ce dépôt, et son défaut est
désactivé. Un téléversement de version rend donc un identifiant de version et aucune URL. C'est
mesuré et non déduit : le premier téléversement après la désactivation du nom d'hôte de production
n'a affiché aucune URL, et le nom d'hôte qu'une URL de prévisualisation occuperait répond 404.

## Décision

Le nom d'hôte `workers.dev` est désactivé, de sorte que `justdummies.io` est la seule adresse
publique du site.

## Justification

Un second nom d'hôte public qui sert un contenu identique n'est pas une adresse de rechange, c'est
un second site que personne ne maintient. Les moteurs de recherche l'indexent, les visiteurs le
mettent en favori, et les liens écrits contre lui continuent de fonctionner — le doublon n'est donc
pas un état transitoire qui s'éteint, mais un état qui accumule des références. Rien dans le
déploiement ne distingue les deux, ce qui veut dire que rien n'incitera jamais celui qui trouve le
second à préférer le premier.

Le nom est aussi mauvais pour une adresse publique d'une façon qu'on ne peut pas corriger : il
contient le sous-domaine du compte, il annonce donc qui héberge le site plutôt que ce que le site
est.

Le garder n'achèterait qu'une chose — une adresse qui fonctionne avant qu'un domaine soit rattaché.
Cela vaut exactement un moment dans la vie du dépôt, le moment déjà passé, et c'est récupérable à
la demande par quiconque en aurait besoin à nouveau.

Le désactiver ne désactive pas la prévisualisation, parce que les deux noms d'hôte sont gouvernés
par deux réglages. C'est ce qui rend cette décision assez étroite pour être prise : elle retire une
adresse, pas un mécanisme. Un téléversement de version téléverse toujours une version — ce qu'il n'a
jamais fait ici, c'est rendre une URL, et cela vient de `preview_urls` désactivé, non de cette
décision.

## Alternatives considérées

### Garder les deux noms d'hôte

Considérée parce que l'adresse `workers.dev` ne coûte rien à laisser en place, et parce qu'elle est
réellement utile pour vérifier un déploiement sans impliquer le domaine — c'est ainsi que tous les
contrôles du guide ont été exécutés avant que le domaine existe.

Rejetée parce que l'utilité est occasionnelle et la duplication permanente. Un mainteneur qui a
besoin de l'adresse peut la récupérer en une ligne, tandis qu'un doublon indexé ne se retire plus
une fois qu'on lui a fait des liens.

### La garder en l'excluant de l'indexation

Considérée comme moyen de garder l'adresse en supprimant la conséquence côté moteurs de recherche —
un `robots.txt` ou un en-tête canonique conditionné à l'hôte.

Rejetée parce qu'il faudrait que le déploiement distingue les deux noms d'hôte, ce qu'un Worker
sans script ne peut pas faire : les distinguer signifie inspecter la requête, et inspecter la
requête signifie ajouter un script. Le Worker n'a délibérément aucun script (le raisonnement est
consigné dans `wrangler.jsonc`), cette alternative échangerait donc un nom d'hôte en doublon contre
un chemin de requête facturé et un site qui tombe quand un quota s'épuise.

### Rediriger `workers.dev` vers `justdummies.io`

Considérée parce qu'elle garderait les anciens liens fonctionnels tout en rendant le domaine
canonique.

Rejetée pour la même raison : un Worker sans script n'a rien qui puisse émettre une redirection
conditionnée à l'hôte. Les règles de redirection qu'il analyse, elles, portent sur les chemins et
s'appliquent à tous les noms d'hôte sur lesquels le Worker répond.

## Conséquences

### Positives

* Le site a une adresse, un lien vers lui est donc sans ambiguïté et rien n'indexe de doublon.
* L'adresse publique cesse de nommer le compte d'hébergement.

### Négatives

* **Un premier déploiement n'a plus aucun nom d'hôte** jusqu'à ce qu'un domaine personnalisé soit
  rattaché. Quiconque part de zéro ne peut pas vérifier l'étape 5 comme le guide la décrit sans
  rattacher le domaine d'abord ou réactiver le réglage temporairement.
* Le confort de vérifier un déploiement sans toucher au domaine disparaît.

### Risques

* **La prévisualisation a été contrôlée et n'est pas un dommage collatéral** — pour une raison qui
  mérite d'être consignée, parce que ce n'est pas celle qu'on attendait. Un téléversement de version
  après le changement n'a affiché aucune URL, et le nom d'hôte qu'elle occuperait répond 404. Mais
  `preview_urls` n'avait jamais été déclaré : aucun téléversement de ce dépôt n'a donc jamais produit
  d'URL. Rien n'a été perdu ici parce qu'il n'y avait rien à perdre. Ce que le contrôle a réellement
  trouvé, c'est une affirmation fausse dans le guide de déploiement, qui promettait une URL que la
  commande n'a jamais rendue. Le guide est corrigé ; décider de déclarer `preview_urls: true` est une
  question ouverte ci-dessous, pas quelque chose que cette décision tranche.
* **Rien n'a pris effet avant qu'une release soit coupée.** Le réglage est appliqué par un
  déploiement, et la publication est conditionnée à un tag `release/*` (ADR-0001). Entre la fusion
  de ceci et le tag, le second nom d'hôte est resté en ligne — un lecteur qui aurait vérifié dans
  cette fenêtre aurait conclu que le changement n'avait pas fonctionné. Tranché sur
  `release/2026-08-11T23-48-02Z` : le nom d'hôte répond 404, et `/version.json` nomme ce tag.

## Actions de suivi

* ~~Confirmer que le nom d'hôte `workers.dev` cesse de répondre, plutôt que de supposer que le
  réglage a été appliqué.~~ Fait à la première release : `404` là où il répondait `200`.
* **Décider s'il faut déclarer `preview_urls: true`.** Laissé ouvert ici volontairement. Faire
  relire une modification visuelle sur une URL partageable avant de fusionner est un besoin réel, et
  aujourd'hui rien ne le sert — `pnpm serve` fait tourner le même runtime en local, mais seulement
  pour qui le lance. Activer les URL de prévisualisation remet un nom d'hôte `workers.dev`, mais pas
  celui que cette fiche a retiré : une URL de prévisualisation est par version et non annoncée, donc
  l'argument du doublon d'adresse ci-dessus ne s'y applique pas tel quel. C'est une décision à part
  entière, et il lui faut sa propre fiche.

## Références

* `wrangler.jsonc`, où vivent le réglage et son raisonnement.
* Les étapes 5, 6 et 9 du guide de déploiement, là où le coût atterrit —
  [Français](../deployment-fr.md) · [English](../deployment-en.md).
* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-fr.md) — pourquoi ceci prend effet sur un tag
  et non à la fusion.
* **A6** dans [`docs/design/decisions-inventory.md`](../../design/decisions-inventory.md), le Worker
  sans script servant des assets, qui est ce qui écarte les deux alternatives qui auraient gardé le
  nom d'hôte.
