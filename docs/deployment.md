# Mettre le site en ligne sur Cloudflare Workers

Ce guide part de zéro : aucun compte Cloudflare, aucune connaissance de la plateforme. À la
fin, `justdummies.io` sera servi par Cloudflare et chaque poussée sur `main` publiera
automatiquement.

Il se lit dans l'ordre. Les étapes 1 à 4 se font une fois, à la main, et t'apprennent ce que
la plateforme fait ; l'étape 5 automatise ce que tu viens de faire à la main. Ne saute pas
l'ordre : automatiser un déploiement qu'on n'a jamais vu réussir revient à déboguer deux
choses à la fois.

---

## Le modèle mental, en cinq mots

| Mot | Ce que c'est |
|---|---|
| **Worker** | Une unité de déploiement chez Cloudflare. Elle peut contenir du code, des fichiers, ou — comme ici — seulement des fichiers. |
| **Static assets** | Les fichiers de `dist/`, servis directement par le réseau de Cloudflare. Les requêtes sur ces fichiers sont **gratuites et illimitées**. |
| **wrangler** | L'outil en ligne de commande de Cloudflare. Il est déjà dans les dépendances du dépôt, épinglé — jamais `npx wrangler@latest`. |
| **Version** | Un téléversement. Il existe, il a une URL, et il n'est pas en production tant qu'on ne l'y promeut pas. |
| **Déploiement** | La version que le domaine sert réellement. |

Le point le plus important, et celui qui explique la moitié de la configuration du dépôt :

> **Ce site n'a aucun script serveur.** `wrangler.jsonc` n'a délibérément pas de champ `main`.
> Les requêtes servies comme assets sont gratuites et illimitées ; celles qui invoquent un
> script comptent dans un quota, et sur le plan gratuit l'épuisement de ce quota répond une
> erreur au lieu de se replier sur les fichiers. C'est la différence entre un site qui se
> dégrade et un site qui tombe.

Le raisonnement complet est dans `docs/design/decisions-inventory.md`, fiches **A1** (pourquoi
Workers et pas Pages) et **A6** (pourquoi aucun script).

---

## Ce que le dépôt fait déjà pour toi

Rien de tout ceci n'est à écrire — c'est déjà en place et vérifié :

| Fichier | Rôle |
|---|---|
| `wrangler.jsonc` | Le nom du Worker (`justdummies-site`), le dossier à publier (`dist/`), et le traitement des 404. |
| `apps/site/public/_headers` *(généré)* | La Content Security Policy et les règles de cache. Généré à chaque build par `scripts/generate-headers.mjs`, parce que la politique doit nommer un hash que seul le build connaît. |
| `apps/site/public/_redirects` | La réécriture qui fait survivre les routes du playground à un lien à froid. |
| `apps/site/public/.assetsignore` | Ce qui ne doit **jamais** monter dans le téléversement. |
| `scripts/verify-output.sh` | Vingt assertions sur la forme de l'artefact, dont plusieurs n'existent que parce que leur échec est invisible jusqu'à ce qu'un visiteur le rencontre. |
| `.github/workflows/build.yml` | Construit, vérifie, puis publie — dès que les identifiants existeront. |

Sur Workers, `_headers` et `_redirects` **ne sont pas servis comme des fichiers** : ils sont
analysés, et leurs règles sont appliquées aux réponses. C'est pourquoi les exclure du
téléversement ne les rendrait pas privés — ils ne le sont pas — mais les ferait disparaître,
et le site perdrait sa politique de sécurité sans qu'aucune page cesse de répondre 200.
`.assetsignore` le dit, et `verify-output.sh` le vérifie.

---

## Étape 1 — Voir le site comme Cloudflare le verra

**Aucun compte n'est nécessaire.** Commence par là.

```bash
pnpm install
pnpm build      # construit dist/ : le site, le playground dedans, les en-têtes, puis vérifie
pnpm serve      # sert dist/ exactement comme Workers le fera, sur http://localhost:8787
```

`pnpm serve` n'est pas un serveur de fichiers statiques. C'est le moteur de Workers en local :
il **analyse `_headers` et `_redirects`** et applique leurs règles. La différence est tout
sauf théorique — c'est cette commande qui a révélé que l'ancienne règle de réécriture du
playground était rejetée par la plateforme et n'avait jamais fonctionné.

Au démarrage, lis les deux lignes que wrangler affiche :

```
✨ Parsed 1 valid redirect rule.
✨ Parsed 5 valid header rules.
```

**`Parsed 0 valid redirect rules` est un échec silencieux**, pas une information. Le site se
déploie très bien sans ses règles ; simplement, elles n'existent pas. Si tu vois `invalid
redirect rule`, lis le message : wrangler explique précisément ce qui cloche.

Puis vérifie les quatre choses qui comptent :

```bash
# 1. L'accueil répond, et porte sa politique de sécurité
curl -sD - -o /dev/null http://localhost:8787/ | grep -i content-security-policy

# 2. Une URL inventée donne la page 404 du site, dans la bonne langue
curl -s http://localhost:8787/nexiste-pas   | grep -o '<title>[^<]*</title>'
curl -s http://localhost:8787/fr/nexiste-pas | grep -o '<title>[^<]*</title>'

# 3. Le playground démarre
open http://localhost:8787/playground/

# 4. Un lien à froid vers une route du playground répond 200, pas 307 ni 404
curl -so /dev/null -w '%{http_code}\n' http://localhost:8787/playground/not-found
```

Le dernier point mérite son explication, parce que c'est le piège le plus coûteux de cette
plateforme et qu'il a deux formes qui se ressemblent :

- Une règle `/playground/*  /playground/index.html  200` est **rejetée** par Cloudflare
  (« Infinite loop detected ») : la plateforme normalise `/playground/index.html` en
  `/playground/`, qui correspond de nouveau au motif. Zéro règle analysée, déploiement
  réussi, aucune route couverte.
- Une règle qui cible `index.html` répond **307** vers le dossier. Elle est acceptée, et elle
  détruit l'URL que la réécriture existait pour préserver : Blazor démarre à sa racine et la
  route a disparu.

La forme qui fonctionne cible le **dossier** : `/playground/not-found  /playground/  200`.
`verify-output.sh` refuse désormais les deux autres, et exige qu'une règle existe pour chaque
`@page` déclaré par le playground. Le commentaire en tête de `_redirects` raconte tout.

---

## Étape 2 — Créer le compte Cloudflare

1. Va sur [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Crée le compte avec ton adresse, valide l'e-mail.
3. Le plan **Free** suffit : les assets statiques y sont gratuits et illimités.

Ne rien créer dans l'interface pour l'instant. Le Worker sera créé par `wrangler` à l'étape
suivante, à partir de `wrangler.jsonc` — c'est le fichier du dépôt qui doit être la source de
vérité, pas des cases cochées dans un navigateur.

---

## Étape 3 — Le premier déploiement, à la main

```bash
pnpm wrangler login
```

Un navigateur s'ouvre, tu autorises, et wrangler garde un jeton local dans ton dossier
personnel. Rien n'est écrit dans le dépôt.

```bash
pnpm build     # toujours avant : `deploy` publie dist/ tel quel, il ne le reconstruit pas
pnpm deploy
```

Au premier déploiement, Cloudflare peut te demander de choisir un sous-domaine `workers.dev`
— c'est un identifiant pour ton compte, choisis ce que tu veux. Le Worker prend le nom
déclaré dans `wrangler.jsonc`, `justdummies-site`, et le site devient accessible sur :

```
https://justdummies-site.<ton-sous-domaine>.workers.dev
```

Si tu veux voir ce qui serait téléversé sans rien publier :

```bash
pnpm wrangler deploy --dry-run
```

---

## Étape 4 — Vérifier ce qui ne se voit pas

Rejoue la liste de l'étape 1 contre l'URL réelle, en remplaçant `localhost:8787`. Puis les
deux vérifications qui ne peuvent se faire **que** sur un déploiement réel, parce que le
serveur local ne les reproduit pas :

**a. La compression du runtime .NET.** C'est une question ouverte que le dépôt a délibérément
laissée ouverte, dans le commentaire de `.assetsignore` : la publication Blazor émet un jumeau
`.br` de chaque fichier du framework (une grande partie de l'artefact) que le chargeur .NET ne
demande jamais. Les exclure allégerait beaucoup le téléversement — à condition que Cloudflare
compresse `application/wasm` à sa périphérie. Réponds-y avec une mesure, pas au jugé :

```bash
URL=https://justdummies-site.<ton-sous-domaine>.workers.dev
WASM=$(basename $(ls dist/playground/_framework/dotnet.native.*.wasm | head -1))
curl -sD - -o /dev/null -H 'Accept-Encoding: br, gzip' "$URL/playground/_framework/$WASM" \
  | grep -iE 'content-encoding|content-length|content-type'
```

- `content-encoding: br` ou `gzip` → la périphérie compresse, les jumeaux `.br` sont du poids
  mort et peuvent être exclus.
- Aucun `content-encoding` → **ne les exclus pas** : le runtime partirait non compressé,
  contre un budget de 3 Mio pour le premier chargement.

Note le résultat dans `.assetsignore`, puisque c'est là que la question est posée.

**b. Le playground démarre vraiment.** Ouvre `/playground/` et regarde la console du
navigateur. Une page blanche sans erreur réseau mais avec une erreur de Content Security
Policy signifie que le hash de l'importmap n'a pas suivi — c'est ce que
`generate-headers.mjs` calcule à chaque build, et `verify-output.sh` vérifie.

---

## Étape 5 — Automatiser : deux secrets, et c'est tout

La CI construit déjà l'artefact et le vérifie à chaque poussée. Le job `deploy` s'exécute sur
`main` uniquement, et publie dès que ces deux secrets existent — sans eux, il annonce ce qui
manque et n'échoue pas.

### 5a. Le jeton d'API

1. Dashboard → avatar en haut à droite → **My Profile** → **API Tokens**.
2. **Create Token**.
3. Choisis le modèle **Edit Cloudflare Workers**. C'est le chemin documenté par Cloudflare ; il
   accorde ce qu'il faut pour publier un Worker. Le minimum strict est
   *Account · Workers Scripts · Edit* — tu pourras resserrer plus tard, une fois le premier
   déploiement automatique réussi.
4. Vérifie que le compte visé est le bon, crée le jeton, **copie-le**. Il ne s'affiche
   qu'une fois.

Ce jeton vaut le droit de publier sur ton compte. Il ne doit jamais être écrit dans un
fichier du dépôt : il ne va que dans les secrets GitHub.

### 5b. L'identifiant de compte

Dashboard → **Workers & Pages** → l'**Account ID** est dans le panneau latéral droit. Ce n'est
pas un secret au sens strict, mais on le range au même endroit.

### 5c. Les déposer dans GitHub

Dans `Reefact/justdummies.io` → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**. Deux secrets, ces noms exactement :

| Nom | Valeur |
|---|---|
| `CLOUDFLARE_API_TOKEN` | le jeton de 5a |
| `CLOUDFLARE_ACCOUNT_ID` | l'identifiant de 5b |

### Ce que fait la CI ensuite

À chaque poussée sur `main` :

1. **build** — installe, contrôle les types, construit l'artefact, vérifie sa forme, contrôle
   les budgets de taille, et le téléverse comme artefact GitHub.
2. **deploy** — récupère **cet artefact-là** plutôt que de reconstruire, rejoue
   `verify-output.sh` sur les octets téléchargés, puis lance `pnpm run deploy`.

Deux choix méritent d'être compris, parce qu'ils ne se devinent pas :

- **Le job de déploiement ne reconstruit pas.** Il publie l'artefact que les vérifications ont
  examiné. Un job qui reconstruit publie des octets qu'aucun contrôle n'a jamais vus.
- **Il revérifie après téléchargement.** `upload-artifact` ignore les fichiers cachés par
  défaut, et `dist/.assetsignore` en est un ; le workflow passe donc
  `include-hidden-files: true`, et la revérification est ce qui transforme cette ligne en
  garantie plutôt qu'en intention.

Une pull request ne peut pas publier : le job est conditionné à `push` sur `main`.

---

## Étape 6 — Brancher `justdummies.io`

Un domaine personnalisé exige que la **zone soit active chez Cloudflare** — c'est-à-dire que
les serveurs de noms du domaine pointent vers Cloudflare.

**Si le domaine est enregistré ailleurs** (OVH, Gandi, Namecheap…) :

1. Dashboard → **Add a domain** → saisis `justdummies.io` → plan Free.
2. Cloudflare scanne les enregistrements DNS existants ; relis-les, surtout les MX si une
   adresse e-mail utilise ce domaine.
3. Cloudflare affiche deux serveurs de noms. Va chez ton registrar et remplace les siens par
   ceux-là.
4. La propagation prend de quelques minutes à quelques heures. La zone passe **Active**.

**Puis, pour rattacher le Worker :**

1. **Workers & Pages** → `justdummies-site` → **Settings** → **Domains & Routes** → **Add** →
   **Custom Domain**.
2. Saisis `justdummies.io`. Recommence pour `www.justdummies.io` si tu veux les deux.
3. Cloudflare crée l'enregistrement DNS et émet le certificat TLS tout seul.

Un **Custom Domain** envoie tous les chemins du domaine vers le Worker, ce qui est exactement
ce que veut un site. Une **Route** sert à n'en envoyer qu'une partie — inutile ici.

Rien à changer dans `wrangler.jsonc` : le rattachement d'un domaine se fait côté compte, et le
déploiement continue de fonctionner à l'identique.

---

## Étape 7 — Prévisualiser sans publier

```bash
pnpm build
pnpm preview     # = wrangler versions upload
```

Cette commande téléverse une **version** et renvoie son URL, **sans** la promouvoir en
production. C'est le mécanisme de preview de Workers, et il diffère de celui de Pages : ici
une version existe et attend, au lieu qu'un déploiement par branche soit créé
automatiquement. On peut lui donner un nom lisible :

```bash
pnpm preview --preview-alias ma-branche
```

C'est le bon outil pour faire relire une modification visuelle avant de la fusionner.

---

## Dépannage

| Symptôme | Cause la plus probable |
|---|---|
| `Parsed 0 valid redirect rules` | Une règle est rejetée. Lis l'avertissement de wrangler : une cible qui se normalise vers son propre motif produit « Infinite loop detected ». |
| Un lien à froid vers le playground répond **307** | La règle cible `index.html`. Cible le dossier. |
| Un lien à froid vers le playground répond **404** | La route est déclarée dans Blazor mais absente de `_redirects`. `pnpm build` le dit maintenant. |
| Playground blanc, aucune erreur réseau | Content Security Policy. Regarde la console : le hash de l'importmap est recalculé à chaque build, donc un `_headers` modifié à la main casse le playground au build suivant. |
| Playground blanc, tous les assets en 404 | Le `<base href>` ne correspond plus à l'endroit où le playground a été copié. `verify-output.sh` l'attrape. |
| `Authentication error` en CI | Jeton absent, expiré, ou créé sur un autre compte que `CLOUDFLARE_ACCOUNT_ID`. |
| Le job `deploy` annonce « Deployment skipped » | Un des deux secrets manque. Le nom manquant est dans l'annotation. |
| Le domaine sert encore l'ancien site | La zone n'est pas encore **Active**, ou les serveurs de noms n'ont pas été changés chez le registrar. |

---

## Ce qui reste à trancher

- **Les jumeaux `.br` du framework.** Question ouverte, posée dans `.assetsignore`, à régler
  avec la mesure de l'étape 4a.
- **Resserrer le jeton d'API.** Le modèle « Edit Cloudflare Workers » est plus large que
  nécessaire pour un Worker sans script. À réduire une fois le déploiement automatique
  éprouvé.
- **Les previews en CI.** Elles se font à la main aujourd'hui (étape 7). Les automatiser sur
  les pull requests demanderait de donner à une PR l'accès au jeton, ce qui n'est pas une
  décision de configuration mais une décision de sécurité.
