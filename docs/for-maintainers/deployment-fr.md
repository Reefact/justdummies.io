# Mettre le site en ligne sur Cloudflare Workers

*🇬🇧 [English version](deployment-en.md)*

Ce guide part de zéro : aucun compte Cloudflare, aucune connaissance de la plateforme. À la fin,
`justdummies.io` sera servi par Cloudflare et chaque poussée sur `main` publiera automatiquement.

**Compte environ deux heures**, dont une bonne partie d'attente (propagation DNS, premiers
téléchargements). Rien n'est irréversible avant l'étape 8.

---

## Comment lire ce guide

Chaque étape a la même forme :

> **Pourquoi** — ce que l'étape sert à obtenir, en deux lignes.
> **Faire** — les commandes, à copier.
> **✅ Contrôle** — une commande qui prouve que l'étape a marché, avec la sortie attendue.

**Où taper quoi.** Chaque bloc porte une étiquette, et elle dit sur quelle machine il tourne : les
blocs **`powershell`** se tapent côté **Windows**, les blocs **`bash`** côté **Ubuntu**, dans WSL.
Une même étape passe parfois de l'un à l'autre.

`wsl` est une commande **Windows** : lancée depuis un shell Ubuntu, elle répond
`wsl: not found` — ce n'est pas qu'elle manque, c'est qu'elle n'existe pas de ce côté. `exit` ramène
côté Windows.

**Ne saute jamais un contrôle.** Cette plateforme a la propriété désagréable d'accepter des
configurations fausses sans rien dire : le site se déploie, répond 200, et une partie ne
fonctionne pas. Les contrôles existent exactement pour ça — chacun d'eux correspond à une panne
réelle qui, sans lui, ne se voit qu'en production.

Les étapes 1 à 6 se font à la main. L'étape 7 automatise ce que tu viens de faire à la main. Cet
ordre n'est pas négociable : automatiser un déploiement qu'on n'a jamais vu réussir, c'est
déboguer deux choses à la fois.

---

## Étape 0 — Les prérequis

### 0.1 Choisir son terminal

Le point important, et il n'est pas cosmétique : **la construction du site repose sur des scripts
bash**. `pnpm build` appelle `scripts/build-site.sh`, et chaque `scripts/*.sh` porte le shebang
`#!/usr/bin/env bash`. Tous utilisent `set -euo pipefail`, et certains la substitution de processus
`< <(...)` ou `compgen`. Ni `cmd.exe` ni PowerShell ne peuvent les exécuter — ce n'est pas une
question de préférence, ces constructions n'ont pas d'équivalent.

*(Les `scripts/*.mjs` sont du Node et tourneraient partout ; ce sont les scripts shell qui
imposent bash, et ce sont eux que `pnpm build` enchaîne.)*

| Commande | cmd / PowerShell | Git Bash | WSL2 | macOS / Linux |
|---|---|---|---|---|
| `pnpm install` | ✅ | ✅ | ✅ | ✅ |
| `pnpm dev`, `pnpm check` | ✅ | ✅ | ✅ | ✅ |
| `pnpm serve`, `preview`, `run deploy` | ✅ | ✅ | ✅ | ✅ |
| `pnpm build:playground` | ✅ | ✅ | ✅ | ✅ |
| **`pnpm build`** | ❌ | ⚠️ | ✅ | ✅ |
| `./scripts/*.sh` en direct | ❌ | ✅ | ✅ | ✅ |

**Sous Windows, utilise WSL2.** C'est exactement l'environnement de la CI
(`runs-on: ubuntu-latest`) : même système, même bash, mêmes scripts. « Ça marche chez moi » veut
alors dire quelque chose.

Dans PowerShell, une fois :

```powershell
wsl --install -d Ubuntu
```

Redémarre si l'installateur le demande, puis ouvre le terminal **Ubuntu** — c'est là que tout se
passe désormais.

> ⚠️ **Le piège qui coûte le plus cher.** Clone le dépôt dans le système de fichiers Linux
> (`~/dev/justdummies.io`), **jamais** sous `/mnt/c/...`. Chaque accès à un fichier traversant la
> frontière Windows↔Linux paie un coût fixe, et ce build en écrit énormément de petits — le seul
> runtime .NET en compte plus d'une centaine sous `_framework`. Sur `/mnt/c`, une construction de
> trente secondes en prend plusieurs minutes.

*Sur macOS ou Linux, il n'y a rien à faire : ton terminal convient déjà.*

Si tu tiens absolument à rester en Windows natif, pnpm sait déléguer à Git Bash :

```powershell
pnpm config set scriptShell "C:\Program Files\Git\bin\bash.exe"
```

Ça fonctionne, mais tu construis alors dans un bash différent de celui de la CI, et Git Bash
n'embarque pas tous les outils que les scripts appellent. C'est un repli, pas un choix.

### 0.2 La chaîne d'outils

Trois outils, et **le dépôt fixe lui-même les versions** — tu ne les choisis pas, tu les laisses
lire :

| Outil | Version | Fixée par |
|---|---|---|
| Node | 22 | `.nvmrc` |
| pnpm | 10.33.0 | le champ `packageManager` de `package.json` |
| .NET SDK | 10.0.100 | `global.json` |

**L'ordre compte, et ce n'est pas celui qu'on devine.** `corepack` est livré *avec* Node, donc il
n'existe pas avant lui ; et `nvm install` lit `.nvmrc`, qui est *dans* le dépôt, donc il ne peut
rien lire avant le clone. D'où cette séquence : paquets système → nvm → SDK .NET → clone →
Node → pnpm.

Chaque bloc se termine par sa propre vérification. **Ne passe pas au suivant sans elle** : une
étape ratée ici ne se manifeste que trois commandes plus loin, sous un message qui ne la nomme pas.

#### a. Les paquets système

Tout le reste en dépend, y compris les commandes de ce guide : `curl` télécharge nvm **et** le SDK,
`git` récupère le dépôt, et le SDK .NET refuse de démarrer sans ICU. Une image WSL fraîche ne les a
pas forcément tous.

```bash
sudo apt-get update
sudo apt-get install -y curl git unzip libicu-dev
```

✅ **Contrôle :** `curl --version | head -1` et `git --version` répondent. ICU n'a pas de contrôle
propre ici — c'est celui du SDK, en **c**, qui le prouve.

> Sans ICU, `dotnet` ne démarre pas *du tout* : il s'arrête sur « *Couldn't find a valid ICU package
> installed on the system* », avec une trace d'appels qui ne dit nulle part qu'il s'agit d'un paquet
> à installer.
>
> ⚠️ **Le message d'erreur nomme deux paquets qui n'existent ni l'un ni l'autre sur Ubuntu.** Il
> conseille « *install libicu (or icu-libs)* » : `apt-get install libicu` répond
> `E: Unable to locate package libicu`, et `icu-libs` est le nom Alpine. Recopier le nom de l'erreur
> est le premier réflexe, et il échoue.
>
> D'où **`libicu-dev`** : c'est le seul nom stable, et il dépend du bon paquet runtime
> (`Depends: libicu74` sur Ubuntu 24.04). Le runtime seul s'appelle `libicu74` — avec un numéro qui
> change à chaque version de la distribution. Si tu veux le strict minimum, `libicu74` suffit et
> évite `icu-devtools` et `libc6-dev` que `libicu-dev` entraîne ; au prix d'un nom à corriger au
> prochain saut d'Ubuntu.
>
> Et ne prends **pas** l'autre échappatoire que l'erreur propose, `System.Globalization.Invariant` :
> ça fait démarrer le SDK sans support de globalisation, donc en changeant le comportement du build
> au lieu de réparer la machine.

#### b. nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
exec "$SHELL"      # nvm s'ajoute à ~/.bashrc : sans rechargement, il n'existe pas encore
```

✅ **Contrôle :** `command -v nvm` affiche `nvm`.

> `which nvm` échouera, et cet échec ne veut rien dire : nvm est une **fonction shell**, pas un
> exécutable. C'est `command -v` qui répond juste.

#### c. Le SDK .NET

`dotnet-install.sh` télécharge le SDK et **n'installe aucune dépendance système** — c'est pour ça
qu'ICU est venu en **a**, et non ici.

```bash
curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 10.0
echo 'export PATH="$HOME/.dotnet:$PATH"' >> ~/.bashrc
exec "$SHELL"
```

✅ **Contrôle :** `dotnet --version` affiche `10.0.1xx`.

> Si un « *Couldn't find…* » apparaît malgré tout, il nomme la bibliothèque qui manque : même
> remède, `sudo apt-get install -y <nom>`.

#### d. Le dépôt, dans le disque Linux

Depuis Ubuntu, tu vois **deux** systèmes de fichiers, et le guide t'a demandé d'en choisir un sans
te dire comment on y va :

| Chemin | Ce que c'est | Vitesse |
|---|---|---|
| `~`, c'est-à-dire `/home/<toi>` | le disque **Linux** | rapide |
| `/mnt/c/...` | ton disque **Windows**, monté dans Linux | lent à traverser |

Le shell Ubuntu démarre souvent dans `/mnt/c/Users/<toi>`, donc du mauvais côté. **Il n'y a rien à
faire pour ça** : ce qui décide, c'est la destination écrite dans la commande, pas l'endroit d'où tu
la lances. `~/dev/justdummies.io` atterrit sur le disque Linux même en tapant depuis `/mnt/c`.

```bash
git clone https://github.com/Reefact/justdummies.io.git ~/dev/justdummies.io
cd ~/dev/justdummies.io
```

✅ **Contrôle :** `pwd` affiche `/home/<toi>/dev/justdummies.io`, sans `/mnt/`.

> **Déjà cloné du mauvais côté ?** Déplace-le au lieu de recloner, sinon tu gardes deux copies :
>
> ```bash
> mkdir -p ~/dev
> mv /mnt/c/chemin/vers/justdummies.io ~/dev/
> cd ~/dev/justdummies.io
> ```
>
> Si `node_modules/` a déjà été installé là-bas, supprime-le après le déplacement et refais
> `pnpm install`. Les liens internes de pnpm sont relatifs et survivent au déplacement, mais les
> lanceurs de `node_modules/.bin/` embarquent le chemin **absolu** du dépôt dans leur `NODE_PATH`,
> et `.pnpm-workspace-state-v1.json` aussi. Déplacé, l'arbre garde des chemins qui n'existent plus.
>
> ```bash
> rm -rf node_modules dist && pnpm install
> ```

> **À partir d'ici, toutes les commandes de ce guide se lancent depuis la racine du dépôt.** Les
> chemins `scripts/…` et `dist/…` en dépendent, et `pnpm` aussi.

#### e. Node, puis pnpm — lus dans le dépôt

```bash
nvm install        # lit .nvmrc → Node 22
corepack enable    # corepack vient avec Node, donc après lui
```

✅ **Contrôle :** `node --version` affiche `v22.x.x`.

#### f. Le hook de message de commit

```bash
git config core.hooksPath .githooks    # une fois par clone
```

### ✅ Contrôle des prérequis

Depuis la racine du dépôt :

```bash
node --version
pnpm --version          # doit être lancé DEPUIS le dépôt : voir le tableau ci-dessous
dotnet --version
git --version
bash --version | head -1
pwd | grep -q '^/mnt/' \
  && echo '⚠️  dépôt sur le disque Windows — le build sera très lent' \
  || echo '✅ dépôt sur le système de fichiers natif'
```

Attendu :

```
v22.x.x
10.33.0
10.0.1xx
git version 2.x.x
GNU bash, version 5.x.x(1)-release ...
✅ dépôt sur le système de fichiers natif
```

Les trois écarts possibles, et leur cause :

| Écart | Cause |
|---|---|
| `nvm: command not found` | Le shell n'a pas été rechargé après l'installation : `exec "$SHELL"`. |
| `pnpm --version` ≠ 10.33.0 | Commande lancée hors du dépôt. C'est le champ `packageManager` qui fixe la version, et corepack ne le lit que d'ici. |
| Node en 20 ou 24 | `pnpm install` refusera, sur le champ `engines`. C'est voulu, pas un bug à contourner. |

---

## Le vocabulaire, en cinq mots

| Mot | Ce que c'est |
|---|---|
| **Worker** | Une unité de déploiement chez Cloudflare. Elle peut contenir du code, des fichiers, ou — comme ici — seulement des fichiers. |
| **Static assets** | Les fichiers de `dist/`, servis directement par le réseau de Cloudflare. Ces requêtes sont **gratuites et illimitées**. |
| **wrangler** | L'outil en ligne de commande de Cloudflare. Déjà dans les dépendances du dépôt, épinglé — jamais `npx wrangler@latest`. |
| **Version** | Un téléversement. Il existe, il a une URL, et il n'est pas en production tant qu'on ne l'y promeut pas. |
| **Déploiement** | La version que le domaine sert réellement. |

Le point le plus important, celui qui explique la moitié de la configuration du dépôt :

> **Ce site n'a aucun script serveur.** `wrangler.jsonc` n'a délibérément pas de champ `main`.
> Les requêtes servies comme assets sont gratuites et illimitées ; celles qui invoquent un script
> comptent dans un quota, et sur le plan gratuit l'épuisement de ce quota répond une erreur au
> lieu de se replier sur les fichiers. C'est la différence entre un site qui se dégrade et un
> site qui tombe.

Le raisonnement complet est dans [`design/decisions-inventory.md`](../design/decisions-inventory.md),
fiches **A1** (pourquoi Workers et pas Pages) et **A6** (pourquoi aucun script).

---

## Ce que le dépôt fait déjà pour toi

Rien de tout ceci n'est à écrire :

| Fichier | Rôle |
|---|---|
| `wrangler.jsonc` | Le nom du Worker (`justdummies-site`), le dossier à publier (`dist/`), le traitement des 404. |
| `dist/_headers` *(généré)* | La Content Security Policy et les règles de cache. Régénéré à chaque build par `scripts/generate-headers.mjs`, parce que la politique doit nommer un hash que seul le build connaît. |
| `apps/site/public/_redirects` | La réécriture qui fait survivre les routes du playground à un lien à froid. |
| `apps/site/public/.assetsignore` | Ce qui ne doit **jamais** monter dans le téléversement. |
| `scripts/verify-output.sh` | Dix-sept assertions sur la forme de l'artefact, lue sur le disque. Plusieurs n'existent que parce que leur échec est invisible jusqu'à ce qu'un visiteur le rencontre. |
| `scripts/check-served-headers.sh` | Six assertions sur ce que le runtime **sert réellement** : il démarre le moteur et l'interroge. Un fichier de règles peut être présent, bien formé, et ignoré — c'est exactement ce qui est arrivé ici. |
| `.github/workflows/build.yml` | Construit, vérifie, puis publie — dès que les identifiants existeront. |

Sur Workers, `_headers` et `_redirects` **ne sont pas servis comme des fichiers** : ils sont
analysés, et leurs règles sont appliquées aux réponses. Les exclure du téléversement ne les
rendrait donc pas privés — ils ne le sont pas — mais les ferait *disparaître*, et le site
perdrait sa politique de sécurité sans qu'aucune page cesse de répondre 200. C'est ce que dit
`.assetsignore`, et ce que `verify-output.sh` vérifie.

---

## Étape 1 — Construire l'artefact

**Pourquoi** — Tout le reste part de `dist/`. Cette étape ne touche pas au réseau et ne demande
aucun compte : c'est le bon endroit pour découvrir un problème.

**Faire**

```bash
pnpm install
pnpm build 2>&1 | tee /tmp/build.log
```

La première exécution est longue : elle télécharge les paquets NuGet et compile le playground.

### ✅ Contrôle

```bash
tail -3 /tmp/build.log                                   # la conclusion
grep -c '  ✓' /tmp/build.log                             # assertions réussies
grep '  ✗' /tmp/build.log || echo 'aucune assertion en échec'
```

Attendu :

```
▸ Artefact looks well formed.

▸ Ready: /home/…/justdummies.io/dist
17
aucune assertion en échec
```

Le nombre d'assertions grandira avec le dépôt ; **ce qui compte est l'absence de `✗` et la
présence de la dernière ligne.** Si `pnpm build` s'arrête sur
`./scripts/build-site.sh: not found` ou une erreur de syntaxe, relis l'étape 0.1 : tu n'es pas
dans bash.

Vérifie ensuite la forme de ce qui a été produit :

```bash
ls -a dist/ | head -20
ls dist/playground/_framework/ | wc -l
```

`dist/` doit contenir `index.html`, `404.html`, `_headers`, `_redirects`, `.assetsignore`, `fr/`,
`_astro/` et `playground/`. `_framework` en compte plus d'une centaine — le nombre exact bouge à
chaque changement du playground, donc ne le compare pas à une valeur écrite ici : ce qui compte est
qu'il ne soit pas vide.

---

## Étape 2 — Servir le site comme Cloudflare le servira

**Pourquoi** — C'est l'étape la plus rentable du guide. `pnpm serve` n'est **pas** un serveur de
fichiers : c'est le moteur de Workers en local, qui **analyse `_headers` et `_redirects`** et
applique leurs règles. Aucun autre serveur local n'a d'opinion sur ces deux fichiers, et ce sont
eux qui portent la politique de sécurité et le routage du playground.

**Faire** — deux commandes, dans cet ordre, et l'ordre compte :

```bash
scripts/check-served-headers.sh   # 1. le contrôle automatique : démarre son runtime, l'interroge, s'arrête
pnpm serve                        # 2. puis le serveur, pour naviguer et pour les contrôles manuels
```

Le script en premier, parce qu'il ne demande rien et répond d'un coup.

> ⚠️ **Jamais les deux en même temps.** Ils veulent tous les deux le port 8787 : le script lancé
> par-dessus un `pnpm serve` en cours interroge le serveur de l'autre au lieu du sien, ou échoue à
> démarrer. Si `pnpm serve` tourne déjà, arrête-le (`Ctrl+C`) avant le script.

`pnpm serve` ne rend pas la main : le terminal reste occupé tant que le serveur tourne. `Ctrl+C`
l'arrête. Pendant qu'il tourne, il affiche son URL — **lis-la, ne la suppose pas** : le port est
8787 s'il est libre, 8788, 8789… sinon. Ouvre cette URL dans ton navigateur Windows —
WSL expose le port automatiquement.

Les contrôles manuels 2a à 2d demandent donc **un second terminal**. Il s'agit d'une deuxième
fenêtre sur la distribution qui tourne déjà — rien à réinstaller.

| Comment | Ce qu'il faut faire | Fiabilité |
|---|---|---|
| **Depuis n'importe quel onglet** | ouvre un onglet, même PowerShell, et tape `wsl -d Ubuntu` | ✅ marche toujours |
| Menu Démarrer | relance l'application **Ubuntu** | ✅ |
| Profil Windows Terminal | le chevron `⌄` à côté du `+`, puis **Ubuntu** | ⚠️ seulement si le profil existe |

> ⚠️ **`-d Ubuntu` n'est pas décoratif.** `wsl` tout court ouvre la distribution **par défaut**, qui
> n'est pas forcément la tienne : Docker Desktop, Rancher Desktop et les outils du même genre
> installent la leur, souvent en `root`, et avec les disques Windows montés ailleurs que sous
> `/mnt/`. On se croit alors dans Ubuntu et on travaille dans un système qui n'est pas le bon —
> sans qu'aucune commande n'échoue pour le signaler.
>
> ```powershell
> wsl -l -v          # la liste ; l'étoile marque la distribution par défaut
> ```
>
> Pour qu'Ubuntu devienne ce défaut : `wsl --set-default Ubuntu`.

✅ **Contrôle, avant toute autre chose dans ce terminal :**

```bash
whoami      # ton utilisateur, PAS root
pwd         # /home/<toi>
```

Un `root`, ou un `pwd` qui ne ressemble pas à ton dossier personnel, veut dire que tu es dans une
autre distribution. Sors avec `exit` et recommence avec `-d Ubuntu`. **N'essaie pas de « réparer »
cette distribution-là** : son `/etc/wsl.conf` appartient à l'outil qui l'a créée.

> **Ubuntu n'apparaît pas dans le chevron ?** Windows Terminal découvre les distributions WSL **à
> son démarrage**. Ouvert avant l'installation d'Ubuntu, il n'a jamais vu la nouvelle : ferme-le
> entièrement — toutes les fenêtres, pas seulement l'onglet — et rouvre-le. Pour confirmer au
> passage que la distribution est bien enregistrée, depuis PowerShell : `wsl -l -v` doit lister
> `Ubuntu` en `VERSION 2`.

> ⚠️ **Ce second terminal démarre dans ton dossier personnel, pas dans le dépôt.** Première commande
> à y taper, sans quoi tous les contrôles cherchent `dist/` et `scripts/` là où ils ne sont pas :
>
> ```bash
> cd ~/dev/justdummies.io
> ```

Tu peux aussi **ne pas ouvrir de second terminal du tout** : le contrôle 2 ci-dessous les couvre
tous les quatre et n'a besoin de rien en parallèle. Les manuels servent à comprendre ce qui est
vérifié et à diagnostiquer une ligne rouge — pas à valider le build.

### ✅ Contrôle 2 — en une seule commande

C'est le script ci-dessus, et la CI l'exécute à chaque build. Attendu :

```
▸ Starting the runtime
  Parsed 1 valid redirect rule
  Parsed 5 valid header rules
▸ Asking http://localhost:8787          ← 8788, 8789… si 8787 était occupé
  ✓ / is served with a content security policy
  ✓ /fr/ is served with a content security policy
  ✓ /playground/ is served with a content security policy
  ✓ a fingerprinted asset gets both its own cache rule and the global policy
  ✓ a cold link to a playground route answers 200
  ✓ the runtime compresses the WebAssembly payload (br: 3002102 → 1197764 bytes)
▸ The host serves what the artefact intends.
```

**C'est le contrôle à retenir.** Les quatre suivants font la même chose à la main, et gardent deux
usages : comprendre *ce que* le script vérifie, et diagnostiquer quand une de ses lignes passe au
`✗`.

### ✅ Contrôle 2a — les règles sont-elles chargées ?

Lis les deux lignes que wrangler affiche au démarrage :

```
✨ Parsed 1 valid redirect rule.
✨ Parsed 5 valid header rules.
```

**`Parsed 0 valid redirect rules` est un échec, pas une information.** Le site se déploie
parfaitement sans ses règles ; simplement, elles n'existent pas. Si tu lis
`invalid redirect rule`, le message de wrangler dit précisément ce qui cloche.

### ✅ Contrôle 2b — les six URL qui comptent

Dans le second terminal :

```bash
B=http://localhost:8787       # le port que pnpm serve a affiché
for u in / /fr/ /playground/ /playground/not-found /nexiste-pas /fr/nexiste-pas; do
  printf '%-24s %s\n' "$u" "$(curl -so /dev/null -w '%{http_code}' $B$u)"
done
```

Attendu — **exactement** ces codes :

```
/                        200
/fr/                     200
/playground/             200
/playground/not-found    200
/nexiste-pas             404
/fr/nexiste-pas          404
```

Le quatrième est le seul qui surprenne, et c'est le plus important : un **307** ou un **404** à
cette ligne signifie que la réécriture du playground est cassée. Voir l'encadré ci-dessous.

### ✅ Contrôle 2c — le bon contenu, dans la bonne langue

```bash
B=http://localhost:8787       # le port que pnpm serve a affiché
curl -sD - -o /dev/null $B/ | grep -i '^content-security-policy' | cut -c1-60
for u in / /fr/ /playground/ /nexiste-pas /fr/nexiste-pas; do
  printf '%-18s %s\n' "$u" "$(curl -s $B$u | grep -o '<title>[^<]*</title>')"
done
```

Attendu :

```
content-security-policy: default-src 'self'; base-uri 'self'
/                  <title>JustDummies — Focused, fluent test values for .NET.</title>
/fr/               <title>JustDummies — Des valeurs de test fluides et ciblées, pour .NET.</title>
/playground/       <title>Playground — JustDummies</title>
/nexiste-pas       <title>Page not found — JustDummies</title>
/fr/nexiste-pas    <title>Page introuvable — JustDummies</title>
```

Les deux dernières lignes vérifient une subtilité voulue : `not_found_handling` sert le `404.html`
**le plus proche**, donc une URL française invalide répond en français.

### ✅ Contrôle 2d — le runtime .NET est servi tel quel

```bash
B=http://localhost:8787       # le port que pnpm serve a affiché
J=$(basename $(ls dist/playground/_framework/dotnet.*.js | head -1))
curl -so /dev/null -w '%{http_code} %{content_type} %{size_download} octets\n' \
  "$B/playground/_framework/$J"
```

Attendu — un vrai fichier JavaScript de plusieurs dizaines de kilo-octets :

```
200 text/javascript; charset=utf-8 50017 octets
```

Si tu obtiens `text/html` et environ deux kilo-octets, le shell HTML a été servi à la place du
runtime : une règle de `_redirects` avale les fichiers du framework, et le playground restera une
page blanche.

> ### 📎 Le piège des réécritures, et pourquoi ces contrôles existent
>
> Le playground est une application monopage : ses routes n'existent qu'une fois Blazor démarré.
> Une requête *à froid* sur l'une d'elles doit donc recevoir le shell de l'application. Deux
> formes de règle paraissent correctes et échouent :
>
> ```
> /playground/*  /playground/index.html  200
> ```
> est **rejetée** par la plateforme — « *Infinite loop detected* ». Cloudflare normalise
> `/playground/index.html` en `/playground/`, qui correspond de nouveau au motif. Zéro règle
> analysée, déploiement réussi, aucune route couverte.
>
> ```
> /playground/not-found  /playground/index.html  200
> ```
> est acceptée et répond **307** vers `/playground/`. C'est la même normalisation, et elle détruit
> l'URL que la réécriture existait pour préserver : Blazor démarre à sa racine, la route a
> disparu.
>
> La forme qui fonctionne cible le **dossier** :
> ```
> /playground/not-found  /playground/  200
> ```
>
> `verify-output.sh` refuse désormais les deux mauvaises formes et exige une règle par `@page`
> déclaré. Le commentaire en tête de `_redirects` raconte tout. **Une nouvelle route dans le
> playground demande une nouvelle ligne dans `_redirects`** — sans quoi elle marche à la souris et
> échoue sur un lien partagé.

Arrête le serveur avec `Ctrl+C` quand les contrôles 2a à 2d passent.

---

## Étape 3 — Créer le compte Cloudflare

**Pourquoi** — Il faut un compte pour publier. Rien de plus à cette étape.

**Faire**

1. Va sur [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Crée le compte, valide l'e-mail.
3. Le plan **Free** suffit : les assets statiques y sont gratuits et illimités.

**Ne crée rien dans l'interface.** Le Worker sera créé par `wrangler` à partir de
`wrangler.jsonc` : c'est le fichier du dépôt qui doit être la source de vérité, pas des cases
cochées dans un navigateur.

---

## Étape 4 — S'authentifier

**Faire**

```bash
pnpm wrangler login
```

Un navigateur s'ouvre, tu autorises. wrangler garde un jeton dans ton dossier personnel — rien
n'est écrit dans le dépôt.

> Sous WSL, si aucun navigateur ne s'ouvre, wrangler affiche une URL : copie-la dans ton
> navigateur Windows, l'autorisation revient au terminal.

### ✅ Contrôle

```bash
pnpm wrangler whoami
```

Attendu : ton adresse e-mail, et le compte avec son **Account ID**. Note cet identifiant, il
servira à l'étape 7.

---

## Étape 5 — Le premier déploiement

**Pourquoi** — Voir le site vivre sur une URL réelle avant d'automatiser quoi que ce soit.

**Faire**

Regarde d'abord ce qui partirait, sans rien publier :

```bash
pnpm wrangler deploy --dry-run
```

Quatre lignes en sortent, et la troisième inquiète toujours :

```
✨ Read N files from the assets directory /home/<toi>/dev/justdummies.io/dist
Total Upload: 0.34 KiB / gzip: 0.24 KiB
No bindings found.
--dry-run: exiting now.
```

| Ligne | Ce qu'elle doit dire |
|---|---|
| `Read N files` | `N` se compte en **centaines**. **Ne le compare pas à un nombre écrit ici** : il change à chaque modification du playground. Quelques fichiers seulement voudrait dire que `dist/` est incomplet. Le chemin doit commencer par `/home/`, pas par `/mnt/`. |
| `Total Upload` | **moins d'un kibioctet, et c'est normal** — voir ci-dessous. |
| `No bindings found.` | attendu : ce Worker n'a ni KV, ni D1, ni R2, ni variable. |
| `--dry-run: exiting now.` | rien n'a été publié. |

> **Le `Total Upload` n'est pas la taille de tes fichiers.** C'est celle du **script** Worker — et
> comme ce site n'en a aucun (`wrangler.jsonc` est délibérément sans champ `main`), wrangler en
> fabrique un qui ne fait rien. Tu peux le voir :
>
> ```bash
> pnpm wrangler deploy --dry-run --outdir /tmp/wdry && ls /tmp/wdry
> ```
>
> Il écrit `no-op-worker.js` : voilà ce que pèsent ces 0,34 KiB. Tes fichiers sont comptés à part, sur
> la ligne du dessus, et partent comme *static assets* — gratuits et illimités.
>
> Un `Total Upload` en centaines de kibioctets serait le signal inverse : un script s'est glissé dans
> la configuration, et les requêtes se mettraient à consommer un quota. C'est la décision **A6**, et
> cette ligne est le seul endroit où on la voit de l'extérieur.

Ce contrôle ne prouve **pas** que tu es authentifié : `--dry-run` ne contacte pas Cloudflare. C'est
le contrôle de l'étape 4 qui le fait. Il ne vérifie pas non plus le *contenu* de `dist/` — il compte
des fichiers. C'est `pnpm build` et ses assertions qui le vérifient, à l'étape 1.

Puis publie :

```bash
pnpm build && pnpm run deploy
```

`pnpm run deploy` publie `dist/` **tel quel** et ne le reconstruit pas : `pnpm build` d'abord,
toujours. Au premier déploiement, Cloudflare peut demander de choisir un sous-domaine
`workers.dev` — c'est un identifiant de compte, prends ce que tu veux.

> ⚠️ **`run` n'est pas optionnel ici.** `pnpm deploy` sans `run` ne lance **pas** ce script :
> `deploy` est une commande interne de pnpm, qui l'emporte et répond
> `ERR_PNPM_NOTHING_TO_DEPLOY  No project was selected for deployment`. Le message ne mentionne ni
> wrangler ni Cloudflare, donc rien n'indique que le script existe et n'a pas été appelé.
>
> `serve` et `preview` n'ont pas ce problème — vérifié, aucune commande pnpm ne porte ces noms — et
> s'écrivent donc sans `run`. C'est `deploy` qui est le cas particulier, pas l'inverse.

Le Worker prend le nom déclaré dans `wrangler.jsonc` :

```
https://justdummies-site.<ton-sous-domaine>.workers.dev
```

### ✅ Contrôle

Rejoue les contrôles 2b, 2c et 2d contre l'URL réelle — c'est le même bloc, avec un `B`
différent :

```bash
B=https://justdummies-site.<ton-sous-domaine>.workers.dev
for u in / /fr/ /playground/ /playground/not-found /nexiste-pas /fr/nexiste-pas; do
  printf '%-24s %s\n' "$u" "$(curl -so /dev/null -w '%{http_code}' $B$u)"
done
```

Les six codes doivent être identiques à ceux de l'étape 2. **S'ils diffèrent, la différence est
la plateforme réelle, pas ton poste** — et c'est exactement l'information que cette étape sert à
produire.

Le script accepte une URL de base, ce qui rejoue les six assertions du contrôle 2 contre le
déploiement plutôt que contre ton poste :

```bash
scripts/check-served-headers.sh https://justdummies-site.<ton-sous-domaine>.workers.dev
```

Ouvre ensuite `/playground/` dans un navigateur et regarde la console. Une page blanche *sans*
erreur réseau mais *avec* une erreur de Content Security Policy signifie que le hash de
l'importmap n'a pas suivi ; c'est ce que `generate-headers.mjs` calcule à chaque build.

---

## Étape 6 — La mesure qui tranche une question ouverte

**Pourquoi** — Le dépôt garde une question ouverte dans le commentaire de `.assetsignore` : la
publication Blazor émet un jumeau `.br` pré-compressé de chaque fichier du framework, que le
chargeur .NET ne demande jamais. Les exclure allégerait le téléversement des deux tiers.

Le runtime local a déjà répondu pour sa part, mesuré plutôt que supposé : **3 002 102 octets
deviennent 1 197 764 avec `Content-Encoding: br`**. Les jumeaux sont donc inutilisés *et* inutiles
en local. Ce qui reste à confirmer, c'est la périphérie — le runtime local n'est pas elle, et les
contrôles de l'artefact ne verraient pas la différence, puisqu'ils mesurent des fichiers et non
des transferts.

**Faire** — rien de nouveau : **tu as déjà lancé la commande au contrôle de l'étape 5**, et c'est
celle que `.assetsignore` nomme. Relis sa dernière ligne `✓`/`✗`. Si tu ne l'as plus sous les yeux :

```bash
scripts/check-served-headers.sh https://justdummies-site.<ton-sous-domaine>.workers.dev
```

### ✅ Comment lire le résultat

| Ligne | Conclusion |
|---|---|
| `✓ the runtime compresses the WebAssembly payload (br: … → …)` | La périphérie compresse. Les jumeaux sont du poids mort : supprime le paragraphe correspondant de `.assetsignore` et ajoute `*.br` et `*.gz` en dessous. |
| `✗ the WebAssembly payload is served uncompressed` | **Ne les exclus pas.** Le runtime partirait non compressé, contre un budget de 3 Mio pour le premier chargement. |

Écris la réponse dans `.assetsignore`, là où la question est posée — le fichier dit lui-même quoi
en faire. Une question tranchée qui n'est pas écrite se repose au prochain passage.

---

## Étape 7 — Automatiser

**Pourquoi** — La CI construit et vérifie déjà à chaque poussée. Le job `deploy` publie sur
`main` dès que deux secrets existent ; sans eux, il annonce ce qui manque et n'échoue pas.

### 7.1 Le jeton d'API

1. Dashboard → avatar en haut à droite → **My Profile** → **API Tokens**.
2. **Create Token**.
3. Modèle **Edit Cloudflare Workers** — le chemin documenté par Cloudflare. Le minimum strict est
   *Account · Workers Scripts · Edit* ; tu resserreras une fois le déploiement automatique
   éprouvé.
4. Vérifie que le compte visé est le bon, crée le jeton, **copie-le**. Il ne s'affiche qu'une
   fois.

> Ce jeton vaut le droit de publier sur ton compte. Il ne va **que** dans les secrets GitHub,
> jamais dans un fichier du dépôt.

### 7.2 L'identifiant de compte

Celui affiché par `pnpm wrangler whoami` à l'étape 4, ou : Dashboard → **Workers & Pages** →
panneau latéral droit.

### 7.3 Les déposer

`Reefact/justdummies.io` → **Settings** → **Secrets and variables** → **Actions** → **New
repository secret**. Deux secrets, ces noms exactement :

| Nom | Valeur |
|---|---|
| `CLOUDFLARE_API_TOKEN` | le jeton de 7.1 |
| `CLOUDFLARE_ACCOUNT_ID` | l'identifiant de 7.2 |

### ✅ Contrôle

Pousse n'importe quoi sur `main` (ou relance le workflow depuis l'onglet **Actions** —
`workflow_dispatch` est activé), puis ouvre le job **Deploy** :

- **Attendu :** l'étape *Publish to Cloudflare Workers* se termine sur un déploiement wrangler.
- Une annotation « **Deployment skipped** » nommant un secret ⇒ ce secret manque ou son nom est
  mal orthographié.
- « **Authentication error** » ⇒ jeton expiré, révoqué, ou créé sur un autre compte que
  `CLOUDFLARE_ACCOUNT_ID`.

Vérifie enfin que la publication vient bien de la CI :

```bash
pnpm wrangler deployments list
```

Le déploiement le plus récent doit correspondre à l'heure de ton workflow, pas à ton essai
manuel de l'étape 5.

### Ce que fait la CI, et pourquoi ainsi

À chaque poussée sur `main` :

1. **build** — valide les extraits publiés, installe, contrôle les types, construit, vérifie que
   le contenu généré committé est à jour, contrôle les budgets de taille, **demande au runtime ce
   qu'il sert vraiment** (le script de l'étape 2), puis téléverse l'artefact.
2. **deploy** — récupère **cet artefact-là** plutôt que de reconstruire, rejoue
   `verify-output.sh` sur les octets téléchargés, puis lance `pnpm run deploy`.

Trois choix qui ne se devinent pas :

- **Le job de déploiement ne reconstruit pas.** Il publie l'artefact que les vérifications ont
  examiné ; un job qui reconstruit publie des octets qu'aucun contrôle n'a vus.
- **Il revérifie après téléchargement.** `upload-artifact` ignore les fichiers cachés par défaut,
  et `dist/.assetsignore` en est un. Le workflow passe donc `include-hidden-files: true`, et la
  revérification est ce qui transforme cette ligne en garantie plutôt qu'en intention.
- **Pas de `wrangler-action`.** Le dépôt épingle un wrangler dans `package.json` ; un pipeline qui
  en télécharge un autre publie avec une version que personne n'a testée.

Une pull request ne peut pas publier : le job est conditionné à un `push` sur `main`.

---

## Étape 8 — Brancher `justdummies.io`

**Pourquoi** — C'est la première étape difficile à défaire : elle change les serveurs de noms du
domaine. Fais-la quand toutes les précédentes sont vertes.

Un domaine personnalisé exige que la **zone soit active chez Cloudflare**.

**Si le domaine est enregistré ailleurs** (OVH, Gandi, Namecheap…) :

1. Dashboard → **Add a domain** → `justdummies.io` → plan Free.
2. Cloudflare scanne les enregistrements DNS existants. **Relis-les**, surtout les `MX` si une
   adresse e-mail utilise ce domaine : un MX oublié coupe le courrier.
3. Cloudflare affiche deux serveurs de noms. Chez ton registrar, remplace les siens par ceux-là.
4. La propagation prend de quelques minutes à quelques heures. La zone passe **Active**.

**Puis rattache le Worker :**

1. **Workers & Pages** → `justdummies-site` → **Settings** → **Domains & Routes** → **Add** →
   **Custom Domain**.
2. `justdummies.io`. Recommence pour `www.justdummies.io` si tu veux les deux.
3. Cloudflare crée l'enregistrement DNS et émet le certificat TLS tout seul.

Un **Custom Domain** envoie tous les chemins du domaine vers le Worker — ce que veut un site. Une
**Route** n'en envoie qu'une partie : inutile ici. Rien à changer dans `wrangler.jsonc`.

### ✅ Contrôle

```bash
B=https://justdummies.io
curl -sI $B/ | head -1                       # le certificat est-il valide, le site répond-il ?
for u in / /fr/ /playground/ /playground/not-found /nexiste-pas; do
  printf '%-24s %s\n' "$u" "$(curl -so /dev/null -w '%{http_code}' $B$u)"
done
```

Attendu : `HTTP/2 200`, puis les mêmes codes qu'aux étapes 2 et 5. Une erreur de certificat juste
après l'ajout est normale — Cloudflare met quelques minutes à l'émettre. Un `curl: (6) Could not
resolve host` signifie que la zone n'est pas encore active ou que les serveurs de noms n'ont pas
été changés chez le registrar.

---

## Étape 9 — Prévisualiser sans publier

**Pourquoi** — Faire relire une modification visuelle avant de la fusionner.

**Faire**

```bash
pnpm build
pnpm preview                              # téléverse une version, sans la promouvoir
pnpm preview --preview-alias ma-branche   # avec un nom lisible
```

La commande renvoie l'URL de la version. C'est le mécanisme de preview de Workers, et il diffère
de celui de Pages : ici une version *existe et attend*, au lieu qu'un déploiement par branche
soit créé automatiquement.

### ✅ Contrôle

Ouvre l'URL renvoyée, puis vérifie que la production **n'a pas bougé** :

```bash
pnpm wrangler deployments list
```

Le déploiement actif doit être inchangé — c'est tout l'intérêt d'une version non promue.

---

## Récapitulatif des contrôles

| # | Étape | Ce que ça prouve |
|---|---|---|
| 0 | versions + chemin du clone | La chaîne d'outils correspond au dépôt, et le disque n'est pas le mauvais. |
| 1 | `Artefact looks well formed.`, zéro `✗` | L'artefact a la forme attendue, sur le disque. |
| **2** | **`check-served-headers.sh`** | **Ce que le runtime sert vraiment — le contrôle à retenir.** |
| 2a | `Parsed 1 valid redirect rule.` | Les règles sont chargées, pas silencieusement rejetées. |
| 2b | les six codes HTTP | Le routage, les 404 et la réécriture du playground fonctionnent. |
| 2c | les titres + l'en-tête CSP | Le bon contenu, la bonne langue, la politique appliquée. |
| 2d | `text/javascript`, ~50 ko | Aucune règle n'avale les fichiers du framework. |
| 4 | `wrangler whoami` | Authentifié, sur le bon compte. |
| 5 | les six codes, puis le script sur l'URL réelle | La plateforme se comporte comme le local. |
| 6 | le script contre le déploiement | Tranche la question des jumeaux `.br`. |
| 7 | le job **Deploy** + `deployments list` | La CI publie vraiment, avec les bons secrets. |
| 8 | `HTTP/2 200` sur le domaine | DNS, TLS et rattachement du Worker en place. |
| 9 | `deployments list` inchangé | Une preview ne touche pas la production. |

---

## Dépannage

| Symptôme | Cause la plus probable |
|---|---|
| `./scripts/build-site.sh: not found`, erreurs de syntaxe | Tu n'es pas dans bash. Voir 0.1. |
| `dotnet --version` : « Couldn't find a valid ICU package » | Dépendance système absente, pas un problème de SDK : `sudo apt-get install -y libicu-dev`. Voir 0.2a. |
| `E: Unable to locate package libicu` | Le nom vient du message d'erreur et n'existe pas sur Ubuntu. C'est `libicu-dev` (ou `libicu74`). Voir 0.2a. |
| `ERR_PNPM_NOTHING_TO_DEPLOY` | `pnpm deploy` a appelé la commande interne de pnpm, pas le script. C'est `pnpm run deploy`. Voir l'étape 5. |
| `pnpm install` refuse la version de Node | `engines` exige Node ≥ 22 : `nvm install`. |
| Le build met plusieurs minutes | Dépôt sous `/mnt/c/`. Voir l'avertissement en 0.1. |
| `Parsed 0 valid redirect rules` | Une règle est rejetée. Une cible qui se normalise vers son propre motif donne « Infinite loop detected ». |
| Lien à froid vers le playground en **307** | La règle cible `index.html`. Cible le dossier. |
| Lien à froid vers le playground en **404** | Route déclarée dans Blazor, absente de `_redirects`. `pnpm build` le dit maintenant. |
| Le runtime revient en `text/html` | Une règle avale `_framework`. Contrôle 2d. |
| `check-served-headers.sh` : `served with NO content security policy` | L'hôte ignore `_headers`. Vérifie que le fichier est bien à la racine de `dist/` et qu'il n'est pas exclu par `.assetsignore`. |
| `check-served-headers.sh` : `rules replace rather than merge` | Une règle spécifique a écrasé la règle générale au lieu de s'y ajouter : les assets empreintés perdraient la politique en gagnant leur durée de cache. |
| Playground blanc, aucune erreur réseau | Content Security Policy. Un `_headers` modifié à la main casse le playground au build suivant, car le hash est recalculé. |
| Playground blanc, tous les assets en 404 | Le `<base href>` ne correspond plus à l'endroit où le playground a été copié. `verify-output.sh` l'attrape. |
| CI : « Deployment skipped » | Un secret manque. Son nom est dans l'annotation. |
| CI : `Authentication error` | Jeton absent, expiré, ou créé sur un autre compte. |
| `curl: (6) Could not resolve host` | Zone pas encore **Active**, ou serveurs de noms inchangés chez le registrar. |
| Le domaine sert encore l'ancien site | Même cause, ou cache DNS local. |

---

## Ce qui reste à trancher

- **Les jumeaux `.br` du framework.** Question ouverte, posée dans `.assetsignore`, à régler avec
  la mesure de l'étape 6.
- **Resserrer le jeton d'API.** Le modèle « Edit Cloudflare Workers » est plus large que
  nécessaire pour un Worker sans script. À réduire une fois le déploiement automatique éprouvé.
- **Les previews en CI.** Elles se font à la main aujourd'hui (étape 9). Les automatiser sur les
  pull requests demanderait de donner à une PR l'accès au jeton — pas une décision de
  configuration, une décision de sécurité.
