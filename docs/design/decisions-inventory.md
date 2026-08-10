# Inventaire des décisions à acter

## Ce qu'est ce document

La liste des décisions que la [spécification](specification.md) applique sans les
consigner, et qui méritent chacune une fiche dans `docs/decisions/`.

**Il est transitoire, et c'est sa seule différence importante avec la spécification.**

La spécification signe un contrat avec elle-même : elle ne porte jamais d'état (§1.3).
Ce document-ci ne porte presque que ça — ce qui est acté, ce qui attend un arbitrage,
où une décision vit en attendant sa fiche. Il vieillit donc par construction, et c'est
voulu : **une ligne le quitte quand sa fiche existe.** Le jour où il est vide, il se
supprime.

Le confondre avec un second document durable serait réintroduire exactement ce que la
1.0 a retiré.

## Comment cette liste a été filtrée

Le test est celui qu'utilise déjà la base d'ADR de la bibliothèque :

> Si l'implémentation changeait mais que la décision tenait, la fiche devrait-elle
> être réécrite ? Si non, c'est un ADR.

Ce qui échoue à ce test reste dans la spécification : les règles de conception, les
principes éditoriaux, les plans de repli. Les en extraire viderait la spec de ce qui
fait sa valeur.

## Pourquoi ce document existe

La spécification 1.0 a retiré **tous les noms de technologies** pour ne pas vieillir —
« un hébergeur d'assets statiques », « un générateur de site statique », « une
application WebAssembly ». Son §17 promet que ces décisions vivent dans le registre.
Le registre est vide.

Il y a donc aujourd'hui un intervalle où des décisions structurantes ne sont écrites
nulle part, sinon dans un commentaire de code ou un message de commit. Ce document
couvre cet intervalle, et la colonne *où elle vit aujourd'hui* dit précisément à quel
point chacune est exposée.

**Leçon à retenir pour la suite :** une décision retirée d'un document doit être tracée
vers sa nouvelle maison **au moment où on la retire**, pas après. Sinon elle disparaît
entre les deux, et c'est exactement ce qui est arrivé ici.

---

## Rang 1 — à acter

### A. Plateforme et technologies

Ce groupe est celui que la spécification a délibérément vidé de ses noms propres. Il est
donc le plus exposé : ce que la spec ne dit plus, le registre ne le dit pas encore.

**A1 — Héberger sur Cloudflare Workers avec static assets**
*Remise en cause :* à chaque comparaison d'hébergeurs, et à chaque fois que le
mécanisme de preview de Workers frottera.
*Alternatives écartées :* Cloudflare **Pages**, retenu d'abord puis abandonné parce que
Cloudflare oriente désormais les nouveaux projets vers Workers et y concentre ses
évolutions ; en amont, Netlify, Vercel, GitHub Pages.
*Conséquences pratiques déjà rencontrées :* `.assetsignore` obligatoire, `node_modules`
non exclu automatiquement contrairement à Pages, mécanisme de preview différent (une
version téléversée sans être promue).
*Origine :* toi, 0.1 puis 0.2. · *Vit dans :* `wrangler.jsonc` et un message de commit.

**A2 — Blazor WebAssembly pour le playground**
*Remise en cause :* à chaque fois que le poids du runtime posera problème.
*Alternatives écartées :* un bac à sable JavaScript qui réimplémenterait la
bibliothèque — donc qui divergerait ; un backend exécutant le C#, donc un serveur à
tenir.
*Pourquoi elle mérite d'être la première fiche :* c'est elle qui **impose** l'exception
CSP, qui fixe le budget du playground, et qui rend nécessaire le pont catalogue (A5).
Sans WebAssembly et son élagage, la réflexion suffirait.
*Origine :* toi, 0.1. · *Vit dans :* le projet, et nulle part comme décision.

**A3 — Astro pour le site**
*Alternatives écartées :* un autre générateur statique ; du HTML écrit à la main.
*Origine :* toi, 0.1. · *Vit dans :* `package.json`.

**A4 — GSAP / ScrollTrigger pour la narration**
*Remise en cause :* les animations liées au scroll natives en CSS ont beaucoup progressé
depuis la rédaction ; la question se reposera.
*Origine :* toi, 0.1. · *Vit dans :* nulle part — la dépendance n'est même pas encore
installée.

**A5 — Le pont playground est un catalogue généré au build**
*Remise en cause :* le jour où la réflexion paraîtra plus simple. Elle l'est, jusqu'à
l'élagage.
*Alternatives écartées :* un registre écrit à la main, dont la dérive est une certitude
et surtout silencieuse ; la réflexion à l'exécution, dont les défaillances
n'apparaissent **pas** en développement où l'élagage est désactivé, mais sur l'artefact
publié.
*Origine :* toi, 0.2. · *Vit dans :* la spécification §10.4, qui est le bon endroit
pour le raisonnement mais pas pour la décision.

**A6 — Aucun script serveur**
*Remise en cause :* « un tout petit Worker pour une seule route, ça ne coûte rien ».
*Ce qu'il faut avoir écrit :* les requêtes servies comme assets sont gratuites et
illimitées ; celles qui invoquent un script comptent dans un quota, dont l'épuisement
répond par une erreur au lieu d'un repli. C'est la différence entre un site qui se
dégrade et un site qui tombe.
*Note :* cette décision survivrait à un changement d'hébergeur, contrairement à A1.
C'est pourquoi ce sont deux fiches et non une.
*Origine :* toi, 0.2. · *Vit dans :* `wrangler.jsonc`, en commentaire.

**A7 — L'intégration continue construit, l'hébergeur reçoit un artefact déjà bâti**
*Alternative écartée :* le CI intégré de l'hébergeur, qui ne convient pas ici parce que
le pipeline a besoin du SDK .NET **et** de Node dans le même environnement, plus des
étapes de génération de code préalables.
*Origine :* toi, 0.1. · *Vit dans :* `.github/workflows/build.yml`.

**A8 — Workspace pnpm, .NET 10, TypeScript épinglé en 5.x**
*Pourquoi l'épinglage :* un `pnpm add typescript` nu résout la 7.x, dont le compilateur
natif n'expose pas encore l'API programmatique dont `astro check` dépend ; la 6.x tourne
mais ne satisfait aucun peer range de la chaîne Astro.
*Origine :* moi, en construisant. · *Vit dans :* un message de commit.

### B. Contenu et gouvernance

**B1 — Rien de ce que le site affiche n'est saisi à la main**
*Remise en cause :* « juste cette valeur-là, provisoirement ». C'est exactement le
mécanisme qui a rendu un chiffre faux dans les brouillons.
*Portée :* valeurs générées, diagnostics, versions, commandes, descripteurs du
playground, données du comparatif.
*Origine :* toi, 0.2. · *Vit dans :* la spécification §2 et §14.

**B2 — Le playground référence un paquet publié, jamais une build de source**
*Remise en cause :* à chaque fois qu'une version traînera, un `ProjectReference` sera
tentant.
*Ce qui la protège aujourd'hui :* la séparation des dépôts (D1) rend le raccourci
impossible plutôt qu'interdit.
*Origine :* toi, 0.3, et renforcé en construisant. · *Vit dans :*
`Directory.Packages.props`, en commentaire.

**B3 — Une clé de traduction manquante fait échouer le build**
*Remise en cause :* la première fois qu'elle bloquera quelqu'un de pressé.
*Alternative écartée :* le repli silencieux sur l'anglais, qui produit des pages mixtes
que personne ne remarque.
*Origine :* toi, 0.2. · *Vit dans :* le typage de `apps/site/src/i18n/ui.ts`.

**B4 — `wasm-unsafe-eval` autorisé, `unsafe-eval` interdit, aucun script en ligne non couvert**
*Remise en cause :* à chaque fois que la politique bloquera quelque chose.
*Précision acquise en construisant :* Blazor écrit un importmap **en ligne**, donc la
politique doit nommer une empreinte, recalculée à chaque build puisqu'elle change à
chaque build. Les brouillons ne le prévoyaient pas.
*Origine :* toi, 0.2 ; l'empreinte est venue de la mesure.
*Vit dans :* `scripts/generate-headers.mjs` et un contrôle d'artefact.

### C. Narration et éditorial

**C1 — Trois actes, et l'acte III animé plutôt que statique**
*Remise en cause :* sous pression de calendrier, puisqu'il coûte douze variantes.
*Alternative écartée :* un bloc statique unique couvrant reproductibilité et analyzers,
pour deux variantes — écartée parce que la reproductibilité est une promesse de premier
niveau et qu'un bloc statique la ferait lire comme une annexe.
*Origine :* toi, 0.3. · *Vit dans :* la spécification §9.

**C2 — Le comparatif dit du bien des concurrents**
*Remise en cause :* « pourquoi aider les autres ? ».
*Ce qui est en jeu :* « quand la choisir plutôt que JustDummies », jamais vide, jamais
ironique, plus un droit de réponse public visible sur la page.
*Origine :* toi, 0.2. · *Vit dans :* la spécification §11.

**C3 — Bilingue dès le départ, anglais à la racine sans préfixe, aucune redirection automatique**
*Remise en cause :* structure d'URL — la rétrofiter casse les liens entrants.
*Alternatives écartées :* la redirection sur l'en-tête de langue, qui casse le partage
de liens et les previews ; les slugs traduits, qui imposent une table de correspondance
et rendent impossible un sélecteur restant sur la page courante.
*Origine :* toi, 0.2. · *Vit dans :* `astro.config.mjs` et `apps/site/src/i18n/`.

### D. Dépôt

**D1 — Le site vit dans un dépôt séparé de la bibliothèque**
*Remise en cause :* à chaque friction de synchronisation.
*Ce que la séparation achète :* elle rend le `ProjectReference` de B2 impossible plutôt
qu'interdit, elle isole le rayon de souffle de la CI, et elle sépare deux gouvernances
— l'une publie des paquets versionnés, l'autre un déploiement.
*Ce qu'elle coûte :* la dérive, qu'il faut alors combattre par des mécanismes (B1).
*Origine :* moi (proposé), toi (décidé). · *Vit dans :* nulle part.

**D2 — Le dépôt du site reprend la convention de commit de la bibliothèque**
*Portée :* mêmes types, table de scopes propre (`site`, `playground`, `tokens`, `ci`),
même linter partagé entre le hook local et la CI.
*Origine :* toi. · *Vit dans :* `CONTRIBUTING.md`.

---

## Rang 2 — de vraies décisions, enjeu moindre

Elles peuvent attendre, ou rester dans la spécification si le registre doit rester
resserré.

- catalogue complet ≠ ce que le parser accepte ≠ ce que l'interface met en avant ;
- commande d'installation permanente dans l'en-tête plutôt que le bloc répété ;
- l'événement de copie porte emplacement et variante, **jamais** l'ordinal de scène ;
- avertissements d'élagage traités comme des erreurs, et tests de bout en bout sur
  l'artefact publié ;
- aucune bibliothèque d'assertion tierce dans les exemples publics ;
- sombre d'abord, mais tokens nommés sémantiquement pour garder le mode clair possible ;
- trois sorties graduées, une par acte ;
- le hero ne charge jamais le runtime sans action explicite du visiteur ;
- le pipeline exécute les mêmes scripts qu'un mainteneur, jamais une réimplémentation.

---

## Ce qui n'est pas un ADR

La phrase de charnière obligatoire de l'acte III · une seule idée forte par écran ·
l'ordre de fusion des scènes sous contrainte de calendrier · l'absence d'illustrations
génériques · la couverture des diacritiques français par les polices · le vocabulaire à
trois valeurs des cellules du comparatif.

Ce sont des règles de conception, pas des décisions d'architecture. Leur maison est la
spécification.

---

## En attente d'arbitrage

Trois décisions ont été prises en rédigeant, pas en décidant. Elles ont besoin d'un oui
ou d'un non avant d'être actées.

| Décision | Statut |
|---|---|
| **La liste d'exclusion du playground vit dans le dépôt du site, pas dans la bibliothèque** | ⚠️ **Contredit la 0.3**, qui plaçait un attribut `[PlaygroundIgnore]` dans la bibliothèque. Le motif du changement : une bibliothèque sans dépendance ne devrait pas porter une préoccupation de vitrine. Le coût : perdre la proximité entre le membre exclu et son motif. **Cette décision touche l'autre dépôt** |
| **Les documents de conception sont en français, tout le reste en anglais** | Inscrit dans `CONTRIBUTING.md`, borné à `docs/design/` |
| **Trois artefacts : ADR, spécification de conception, suivi du travail** | C'est le §17 de la spécification, et c'est ce qui rend cet inventaire possible |

---

## Décompte

**Seize décisions de rang 1, dont treize viennent des brouillons** et trois ont été
prises en construisant. La spécification 1.0 n'a rien inventé : elle a réorganisé.

Aucune n'a de fiche à ce jour.
