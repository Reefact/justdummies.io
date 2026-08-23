# ADR-0025 | Une seule question de consentement pour deux applications

🌍 🇫🇷 Français (ce fichier) · 🇬🇧 [English](0025-one-consent-question-for-two-applications-en.md)

**Status:** Accepted
**Proposed:** 2026-08-23
**Accepted:** 2026-08-23
**Decision Makers:** Reefact

## Context

ADR-0018 a placé le parcours derrière un oui explicite : le bootstrap du tag déclare tout signal de
consentement refusé et ne charge aucun script Google, et le script de consentement est le seul appelant
de la fonction qui le démarre. Rien n'atteint Google avant une réponse, et un retrait lève le drapeau
d'opt-out documenté par Google plutôt que de simplement révoquer le signal.

Cette mécanique vit à un seul endroit, `Measurement.astro`, et elle est bien plus qu'un oui et un non.
Elle porte la clé de stockage `jd:analytics-consent`, une rétention de six mois après laquelle le
bandeau redemande, une tolérance pour une horloge en avance au moment où la réponse a été écrite, une
revérification de la rétention à **chaque** rapport et non au seul chargement, et un contrôle
périodique pour qu'un onglet qui ne bouge jamais remarque quand même une expiration.

**Ce site est deux applications, et une seule en a quoi que ce soit.** Les pages Astro rendent le
bandeau et le tag ; `apps/playground/wwwroot/index.html` est une coquille écrite à la main qui ne rend
ni l'un ni l'autre — le constat établi par les travaux d'ADR-0023 et que le plan de mesure consigne
comme un manque.

**Ce sont pourtant une seule origine.** ADR-0002 a établi que le site répond sur un seul nom d'hôte, et
`/playground/` en est servi comme tout autre chemin. Le stockage local est porté par l'origine et non
par le document : la clé qu'une application écrit est celle que l'autre lit, sans rien de partagé entre
elles et sans rien à synchroniser.

**Le playground est atteignable sans passer par une page qui demande.** C'est un lien profond — un
`<a>` pointant vers `/playground/?lang=fr` depuis n'importe où —, si bien qu'un visiteur peut
rencontrer le playground d'abord et une page du site jamais.

**Ce dépôt répond déjà trois fois à « la même chrome dans les deux applications ».**
`SiteHeader.razor`, `SiteFooter.razor` et `DownloadFab.razor` sont les pendants Razor de composants
Astro ; le commentaire du contrôle de téléchargement nomme l'arrangement — *le pendant du
DownloadFab.astro du site […] Mêmes tokens, même forme, même coin que celui du site.* Aucun d'eux ne
partage son markup avec son jumeau. Tous partagent les design tokens, et chacun parle les chaînes de
sa propre application.

Le playground choisit sa langue à l'exécution. `LocaleState` lit `?lang=`, publie les changements par
un événement, et re-libelle la coquille via `jdSetDocumentLanguage` quand un visiteur change de langue
après le boot — un fragment rendu dans une seule locale au build ne pourrait donc pas suivre un
visiteur qui bascule.

`scripts/generate-headers.mjs` dérive la politique de contenu de chaque document HTML de l'artefact, la
coquille du playground comprise, et n'accorde les hôtes analytiques que là où un document porte
réellement le tag.

## Decision

**La question du consentement appartient à l'origine et non à un document : l'une ou l'autre
application peut la poser, les deux lisent et écrivent l'unique réponse stockée, et aucune ne la pose à
un visiteur qui a déjà répondu.**

## Rationale

Un consentement est donné à une finalité et à un responsable, pas à une URL. Un site qui pose deux fois
la même question n'est pas deux fois plus protecteur ; c'est un site qui a l'air d'avoir perdu la
première réponse. Un visiteur qui a accepté sur la page d'accueil et rencontre un bandeau identique sur
`/playground/` n'apprend rien et ne décide rien — il re-répond à une question à laquelle il a répondu,
et la seconde invite se lit comme un défaut. Le fait technique que ce site soit bâti avec deux chaînes
d'outillage est le nôtre, et un visiteur ne devrait jamais le payer.

**La réponse traverse déjà ; seuls la demande et l'action ne traversent pas.** Un seul nom d'hôte veut
dire une seule origine, donc un seul stockage local : le magasin n'a besoin de rien de plus pour être
partagé. Ce qui manque au playground, c'est un bandeau pour demander et un bootstrap pour agir sur la
réponse — et une fois qu'il a les deux, le partage joue dans les deux sens sans coût supplémentaire :
une réponse donnée sur le playground est celle que chaque page du site lit ensuite, exactement comme
l'inverse le ferait déjà.

**Le bandeau est de la chrome, et le playground a déjà un endroit où la chrome vit : sa coquille.**
`#blazor-error-ui` est dans `wwwroot/index.html`, traduit avant le boot par un script qui lit l'URL
d'ouverture, et re-libellé après un changement de langue par `LocaleState` via `js/locale.js`. La
question de consentement prend la même place, pour deux raisons dont le bandeau d'erreur n'a qu'à
moitié besoin. Elle doit être lisible avant que le runtime ne le soit — un visiteur en connexion lente
qui arrive sur le playground et repart est précisément le lecteur qu'il vaut la peine d'interroger, et
un bandeau attendant un mégaoctet et demi de WebAssembly ne l'atteindrait jamais. Et elle doit être
dans l'artefact, pour que le build puisse tenir ce document à la règle plus bas au lieu de lui faire
confiance.

**La décision, elle, n'est pas de la chrome, et cette moitié-là ne doit pas être dupliquée.** La
fenêtre de rétention, la tolérance d'horloge, la revérification à chaque rapport et le drapeau
d'opt-out ne sont pas de l'apparence — ce sont la promesse qu'a faite ADR-0018. Deux copies dérivent, et
la dérive est silencieuse dans la pire direction : un document continuerait de rapporter pour un
visiteur pour qui l'autre a déjà cessé. La décision est donc un module unique que les deux documents
chargent, et les deux bandeaux en sont deux vues.

Ce découpage garde aussi la garantie là où ADR-0018 l'a mise. Le module reste le seul appelant qui
démarre le tag, dans les deux documents ; un document qui rendrait un bandeau sans charger le module ne
démarrerait rien, ce qui est la bonne direction pour échouer.

## Alternatives Considered

### Donner au playground son propre bandeau, avec sa propre logique

Considérée parce que c'est le plus petit changement qui rende le playground capable de demander : aucun
remaniement du script du site, aucun module partagé, rien de déplacé.

Rejetée parce qu'elle duplique la partie qui ne doit pas l'être. La fenêtre de rétention et le chemin
de retrait existeraient deux fois, et le jour où l'une est corrigée sans l'autre, un visiteur ayant
retiré son accord sur le site serait encore rapporté depuis le playground. Elle duplique aussi la
question elle-même pour quiconque visite les deux moitiés, ce qui est précisément le résultat que cette
décision existe pour empêcher.

### Faire lire la réponse au playground sans jamais demander

Considérée en premier, et elle satisfait la lettre du « ne jamais demander deux fois » au moindre coût
: un petit script lit la réponse stockée, démarre le tag si c'est un oui frais, et ne rend rien.

Rejetée parce que le playground est un lien profond. Un visiteur qui y arrive directement n'a jamais
été interrogé, ne le serait jamais, et ne serait donc jamais compté — silencieusement, et précisément
pour les visites qui valent le plus d'être comptées. Refuser de demander n'est pas de la neutralité
quand c'est la porte d'entrée du visiteur.

### Injecter le bandeau rendu par Astro dans la coquille du playground au build

Considérée parce que c'est la lecture la plus littérale de « le même bandeau » : les mêmes octets rendus
dans les deux documents, extraits après le build du site et écrits dans la coquille, sans rien
réimplémenter.

Rejetée sur la localisation. Le bandeau Astro est rendu par page, dans la langue de cette page ; le
playground est un document unique qui choisit sa langue depuis `?lang=` à l'exécution et peut en
changer après le boot. Un fragment capturé au build est d'une seule locale, et en injecter deux pour en
cacher une réimplémenterait de toute façon le changement de langue — auquel point le bandeau de la
coquille est la chose la plus petite et la plus honnête.

Le *tag* analytique, lui, est bel et bien prélevé d'une page construite de cette manière-là, et la
différence est tout l'argument. `GoogleAnalytics.astro` garantit que son corps est identique octet pour
octet sur chaque page et ne porte aucune locale — c'est pourquoi un seul hash de ce corps entre jamais
dans la politique de contenu — si bien qu'une copie est l'original. Un bandeau rendu garantit
l'inverse : une locale par page, par construction. Prélever ce que le site promet invariant n'est pas
le même geste que prélever ce qu'il promet variable.

### Donner au playground un bandeau Razor, comme le reste de sa chrome

Considérée en premier, et c'est ce que font l'en-tête, le pied de page et le contrôle de
téléchargement : un composant Razor par chaîne d'outillage, partageant les design tokens plutôt que le
markup. Elle aurait suivi l'arrangement établi à la lettre, et la localisation serait venue
gratuitement de `LocalizedComponent`.

Rejetée sur le moment où elle apparaîtrait et sur ce qui pourrait la voir. Un composant Razor se rend
après le téléchargement et le démarrage du runtime WebAssembly : un visiteur qui arrive sur le
playground et repart avant n'est jamais interrogé — et ce visiteur n'est pas un cas limite, c'est la
connexion lente que le poids du runtime rend probable. Elle est en outre invisible au build : la
coquille livrée porterait le tag et aucun bandeau, et l'assertion plus bas ne pourrait passer qu'en ne
regardant pas ce document — le seul pour lequel elle existe.

### Servir le playground depuis une page Astro

Considérée parce qu'elle dissoudrait le problème au lieu de le résoudre : une seule chaîne d'outillage,
un seul bandeau, un seul tag, aucun jumeau de quoi que ce soit.

Rejetée comme bien plus vaste que la question posée. Le playground est une application Blazor avec sa
propre coquille, son propre routage et sa propre séquence de démarrage, et le réhéberger pour partager
un bandeau remettrait chacun de ces points en jeu pour un bénéfice que cette décision obtient sans y
toucher.

## Consequences

### Positive

Un visiteur est interrogé une fois, où qu'il arrive, et sa réponse vaut pour tout le site. Le découpage
technique cesse de lui être visible.

Un consentement donné sur le playground bénéficie à chaque page du site, et réciproquement, sans
qu'aucune des deux applications sache que l'autre existe — le stockage de l'origine est la seule chose
entre elles.

Le playground peut enfin porter la voie du parcours, ce qui est ce qui rend une lecture par visiteur
possible tout court.

L'invariant sur lequel repose ADR-0018 devient vérifiable sur tout l'artefact plutôt que vrai par
construction dans une seule chaîne d'outillage : un document qui porte le tag doit porter un bandeau.

### Negative

Il y a une seconde vue de bandeau à tenir en phase avec la première. Les tokens et le module partagé en
portent l'essentiel, mais le markup et le libellé sont deux fichiers de plus qu'un changement doit
visiter — et le libellé est lui-même déclaré deux fois à l'intérieur du playground : en littéraux dans
la coquille pour la traduction d'avant boot, et de nouveau dans `PlaygroundStrings.cs` pour le
changement d'après boot. C'est la duplication que `#blazor-error-ui` porte et documente déjà ; celle-ci
l'élargit plutôt qu'elle ne l'invente.

Le playground gagne le tag analytique : la politique de contenu accorde donc les hôtes de Google sur un
document qui ne les avait jamais contactés. La politique étant dérivée plutôt qu'écrite, elle suit
d'elle-même, mais l'exposition de l'artefact est réellement plus large qu'avant.

La coquille du playground grossit : un bandeau, un bootstrap et un module, sur un document dont le
premier paint est déjà en concurrence avec un téléchargement de runtime.

### Risks

**Les deux vues de bandeau peuvent dériver** en libellé ou en apparence pendant que la décision
sous-jacente reste identique — le mode de défaillance qu'a toujours la duplication, déplacé plutôt que
supprimé. Ce qui le borne : la dérive est visible (deux bandeaux qu'un mainteneur peut regarder) plutôt
que silencieuse, contrairement à ce qu'aurait été une dérive de la fenêtre de rétention.

**Un bandeau laissé ouvert dans un onglet ignore qu'un autre onglet a répondu.** Le site relit déjà la
réponse stockée sur événement de stockage pour sa logique d'expiration ; un bandeau qui reste à l'écran
après que la question a été répondue ailleurs est un défaut moindre qu'un rapport erroné, mais c'en est
un que le visiteur voit, et le refermer vaut mieux que le supposer.

**Le changement de langue du playground intervient après le dessin du bandeau.** Le bandeau doit le
suivre, comme le fait le reste de la chrome du playground ; un bandeau restant dans la langue de boot
après une bascule serait le défaut même que `jdSetDocumentLanguage` existe pour empêcher sur la
bannière d'erreur.

## Follow-up Actions

* **Ce qui échoue quand la décision est cassée, dans le build :** `scripts/verify-output.sh` gagne une
  assertion selon laquelle tout document portant le tag analytique porte aussi un bandeau de
  consentement *et* le module qui agit dessus. C'est l'invariant sur lequel repose ADR-0018, il n'a été
  vrai que parce qu'une seule chaîne d'outillage rendait les deux, et c'est exactement ce qu'une
  seconde chaîne peut casser silencieusement. Les deux moitiés sont vérifiées parce qu'elles échouent
  différemment : un document taggé sans bandeau n'interroge personne et ne rapporte personne, tandis
  qu'un document taggé sans module ne démarre rien du tout — silencieux plutôt que dangereux, et
  toujours une défaillance. Testé en le cassant avant la pull request, comme l'exige CONTRIBUTING.
* **Ce qui échoue par construction :** la décision est un module unique. Une fenêtre de rétention, une
  tolérance d'horloge ou un chemin de retrait ne peuvent pas dériver entre les deux applications,
  puisqu'il n'y en a qu'un exemplaire de chaque dont dériver.
* **Et ce qu'un build ne peut pas voir :** un contrôle navigateur répond à la question sur le
  playground et vérifie qu'une page du site la trouve ensuite déjà répondue, puis l'inverse — la
  traversée pour laquelle cette décision existe, qu'aucune lecture statique de l'artefact ne peut
  établir.
* Le [plan de mesure](../measurement-plan-fr.md) consigne que le playground porte désormais les trois
  voies, et perd le manque qu'il nommait.
* La page vie privée et la copie du bandeau lui-même énoncent que le playground est couvert, dans les
  deux langues.
* Le [guide de déploiement](../deployment-fr.md) note que les hôtes analytiques sont désormais accordés
  sur le document du playground aussi, afin que le contrôle console post-déploiement le couvre.

## References

* [ADR-0018](0018-le-parcours-est-mesure-dans-une-troisieme-voie-soumise-au-consentement-fr.md) — la
  voie que ceci étend, et la promesse que le module partagé tient
* [ADR-0002](0002-the-site-answers-on-one-hostname-en.md) — un seul nom d'hôte, donc une seule origine
  et un seul magasin
* [ADR-0023](0023-un-evenement-porte-une-variante-seulement-sil-a-une-porte-a-choisir-fr.md) — là où
  l'absence du playground de toutes les voies a été établie
* [ADR-0024](0024-le-playground-rapporte-la-forme-dune-chaine-pas-ses-valeurs-fr.md) — la moitié
  recensement du même travail, qui ne demande aucun consentement et atterrit indépendamment
* [ADR-0004](0004-un-controle-ne-parait-que-sil-peut-agir-fr.md) — pourquoi un bandeau n'est pas rendu
  par un build sans identifiant de mesure à qui rapporter
* [`docs/design/specification.md`](../../design/specification.md) §15.4 (le parcours, et ce qu'il
  demande d'abord), §6.5 (le document unique du playground et son `?lang=`)
