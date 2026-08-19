# Mettre le site en ligne sur Cloudflare Workers

*🇬🇧 [English version](deployment-en.md)*

Ce guide part de zéro : aucun compte Cloudflare, aucune connaissance de la plateforme. À la fin,
`justdummies.io` sera servi par Cloudflare, et un tag suffira à publier.

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
fiche **A1** (pourquoi Workers et pas Pages), et dans
[ADR-0012](adr/0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md) (pourquoi le seul script
qui existe reste hors du chemin du site). La seconde moitié était la fiche **A6**, qui a quitté cet
inventaire le jour où ADR-0012 a été accepté.

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
| `scripts/check-in-browser.sh` | Quarante-trois contrôles qui rendent l'artefact au lieu de le lire : le playground démarre, le navigateur accepte la politique, aucun contrôle n'est proposé à un lecteur sans script, rien n'est plus large que la fenêtre. Décision : [ADR-0009](adr/0009-les-controles-navigateur-sont-pilotes-par-playwright-fr.md). |
| `scripts/check-release-tag.sh` | Trois assertions sur le tag qui publie : il est annoté, son message est son nom, et son nom est le moment où il a été posé. Les huit premiers tags de release échouaient à la troisième. |
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

# La voie analytics est gouvernée par deux variables et le build exige les deux : cette étape
# échoue sans elles, si peu que vous comptiez mesurer. `disabled` ne mesure rien et ne contacte
# jamais l'identifiant — mais celui-ci doit rester bien formé, car un identifiant égaré pendant
# que la mesure est éteinte est une mémoire cassée, et le jour où on la rallume est trop tard
# pour s'en apercevoir. Les vraies valeurs sont posées à l'étape 11 ; celles-ci servent à
# construire en local.
export PUBLIC_GA_MEASUREMENT_STATE=disabled
export PUBLIC_GA_MEASUREMENT_ID=G-0000000000

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
/fr/               <title>JustDummies — Des valeurs de test ciblées grâce à une API fluent, pour .NET.</title>
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

Ce qui en sort nomme un script et un binding :

```
✨ Read N files from the assets directory /home/<toi>/dev/justdummies.io/dist
Total Upload: 1.79 KiB / gzip: 0.79 KiB
Your Worker has access to the following bindings:
Binding                                    Resource
env.MEASUREMENT (justdummies_measurement)  Analytics Engine Dataset

--dry-run: exiting now.
```

| Ligne | Ce qu'elle doit dire |
|---|---|
| `Read N files` | `N` se compte en **centaines**. **Ne le compare pas à un nombre écrit ici** : il change à chaque modification du playground, et ce n'est pas le nombre de fichiers téléversés — `--dry-run` n'applique pas `.assetsignore`, vérifié. Quelques fichiers seulement voudrait dire que `dist/` est incomplet. Le chemin doit commencer par `/home/`, pas par `/mnt/`. |
| `Total Upload` | **quelques kibioctets** — le collecteur, et rien d'autre. Voir ci-dessous. |
| le tableau des bindings | attendu, et attendu avec **exactement une ligne** : le jeu de données Analytics Engine où le collecteur écrit. Ni KV, ni D1, ni R2, ni variable. |
| `--dry-run: exiting now.` | rien n'a été publié. |

> **Le `Total Upload` n'est pas la taille de tes fichiers.** C'est celle du **script** Worker, dont ce
> site a exactement un exemplaire : le collecteur de mesure, ajouté délibérément et argumenté dans
> [ADR-0012](adr/0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md). Tes fichiers sont
> comptés à part, sur la ligne du dessus, et partent comme *static assets* — gratuits et illimités.
>
> **Cette ligne affichait `0.34 KiB` et `No bindings found`**, parce qu'il n'y avait aucun `main` et
> que wrangler fabriquait un `no-op-worker.js` pour en tenir lieu. Ce n'est plus ce que tu dois voir,
> et un guide qui le promettrait encore te ferait lire un déploiement correct comme un contrôle de
> sécurité en échec.
>
> Ce qu'on surveille sur cette ligne a changé avec elle. Ce n'est plus « tout script est une erreur »
> mais que **ce** script reste le seul et reste petit. Un `Total Upload` en dizaines ou centaines de
> kibioctets, ou un second binding sous le premier, signifie que le Worker a pris du travail qu'il
> était confiné à ne pas faire — et ce confinement, `run_worker_first` ne nommant qu'un seul chemin,
> est toute la raison pour laquelle ADR-0012 a pu répondre à l'objection de §12.3. Cette ligne et le
> troisième contrôle de l'étape 10 sont les deux endroits d'où on le voit de l'extérieur.

Ce contrôle ne prouve **pas** que tu es authentifié : `--dry-run` ne contacte pas Cloudflare. C'est
le contrôle de l'étape 4 qui le fait. Il ne vérifie pas non plus le *contenu* de `dist/` — il compte
des fichiers. C'est `pnpm build` et ses assertions qui le vérifient, à l'étape 1.

**Avant de publier, active Analytics Engine sur le compte.** C'est un réglage de compte, à faire une
fois, et rien de ce qui précède ne peut te dire qu'il manque : `--dry-run` ne contacte pas
Cloudflare, et la table des bindings qu'il imprime est lue dans `wrangler.jsonc` plutôt que
confrontée au compte. Tableau de bord → *Storage & databases* → *Analytics Engine* → **Enable**. Il
est rangé sous le stockage et non sous les Workers, ce qui n'est pas là qu'on le cherche ; `Ctrl-K`
et son nom est le chemin le plus court. Le palier dans lequel ce site est conçu pour tenir est celui
d'[ADR-0012](adr/0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md), et la page ne demande
rien de plus que ce bouton — ni plan, ni carte.

L'activation ouvre une boîte *Create Blank Dataset*. **La fermer.** `justdummies_measurement` se
crée à la première écriture du collecteur, et le binding qui le nomme est déjà dans
`wrangler.jsonc` ; un jeu de données saisi à la main est un endroit de plus où le nom peut diverger
de celui où le Worker écrit, et un collecteur qui écrit dans un jeu de données que personne
n'interroge ressemble exactement à un collecteur qui marche.

L'oublier coûte un déploiement, et l'échec arrive tard et trompeur :

```
✨ Success! Uploaded 59 files (167 already uploaded)
Total Upload: 1.79 KiB / gzip: 0.79 KiB
Your Worker has access to the following bindings:
env.MEASUREMENT (justdummies_measurement)  Analytics Engine Dataset

✘ [ERROR] A request to the Cloudflare API
          (/accounts/<id>/workers/scripts/justdummies-site/versions) failed.

  You need to enable Analytics Engine. Head to the Cloudflare Dashboard to enable:
  https://dash.cloudflare.com/<id>/workers/analytics-engine        [code: 10089]
```

Tout ce qui précède l'erreur a réussi — les assets sont envoyés, `Total Upload` et la table des
bindings s'affichent exactement comme cette étape le promet. Seul le dernier appel, celui qui crée
la version, a été refusé. Le réflexe qu'invite la forme de cette sortie — chercher ce qui cloche
dans l'artefact ou dans le binding — est donc le mauvais : rien dans le dépôt ne peut y remédier.

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

> ⚠️ **Ce dépôt ne publie sur aucun nom d'hôte `workers.dev`.** `wrangler.jsonc` fixe
> `"workers_dev": false`, donc une fois l'étape 8 passée et `justdummies.io` rattaché, le site
> répond là et nulle part ailleurs — le raisonnement est
> [ADR-0002](adr/0002-the-site-answers-on-one-hostname-fr.md).
>
> Ce qui laisse un premier déploiement **sans adresse à contrôler**, puisque le domaine n'est pas
> encore rattaché. Deux issues, et la seconde est la plus honnête :
>
> * Mets `"workers_dev": true` le temps de cette étape, déploie, lance le contrôle ci-dessous contre
>   `https://justdummies-site.<ton-sous-domaine>.workers.dev`, puis remets `false`. Rien d'autre dans
>   le dépôt ne dépend de cette valeur.
> * Ou fais l'étape 8 maintenant et reviens. L'ordre de ce guide n'est pas porteur ici : rattacher un
>   domaine à un Worker déployé et déployer sur un domaine déjà rattaché aboutissent au même état.
>
> Dans les deux cas le contrôle ci-dessous est le même bloc, avec `B` sur l'adresse que tu as.

Le Worker prend le nom déclaré dans `wrangler.jsonc` — avec `workers_dev` activé, c'est :

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

**Pourquoi** — La CI construit et vérifie déjà à chaque poussée. Le job `deploy` publie dès que
deux secrets existent, et **seulement sur un tag `release/*`** ; sans eux, il annonce ce qui manque et
n'échoue pas.

### 7.1 Le jeton d'API

1. Dashboard → avatar en haut à droite → **My Profile** → **API Tokens**.
2. **Create Token**.
3. Modèle **Edit Cloudflare Workers** — le chemin documenté par Cloudflare.

Le modèle préremplit treize permissions et **laisse vides deux champs qui bloquent la création** :

| Champ | À faire | Pourquoi |
|---|---|---|
| **Account Resources** | `Include` → **ton compte** | un jeton sans compte associé n'a aucune portée, et wrangler échouerait |
| **Zone Resources** | `Include` → **All zones from an account** → ton compte | le modèle inclut une permission de zone (`Workers Routes`), et Cloudflare refuse une permission de zone sans zone |
| **TTL** | **laisse vide** | un jeton qui expire fait échouer la CI des mois plus tard, sur un message d'authentification qui ne dit pas « expiré » |

Pour `Zone Resources`, l'autre issue est de **supprimer** la ligne `Zone · Workers Routes · Edit`
avec son `✕` : `wrangler.jsonc` ne déclare aucune route, publier ne touche donc aucune zone. Le
domaine personnalisé de l'étape 8 s'attache depuis le dashboard et reste attaché d'un déploiement à
l'autre — ce jeton ne le gère jamais.

4. **Continue to summary** → **Create Token** → **copie le jeton**. Il ne s'affiche qu'une fois :
   garde l'onglet ouvert jusqu'à l'avoir déposé en 7.3.

> Ce jeton vaut le droit de publier sur ton compte, et le modèle accorde bien plus que ce dépôt
> n'utilise — KV, R2, Pages, Containers, Observability, tous en écriture. Le minimum strict serait
> *Account · Workers Scripts · Edit*.
>
> **Ne taille pas dedans maintenant.** Un déploiement qui échouerait sur une permission manquante
> serait un problème de plus à isoler, au moment précis où tu essaies d'en valider un autre. Le
> resserrage est inscrit dans « Ce qui reste à trancher », à faire une fois le déploiement
> automatique éprouvé.
>
> Le jeton ne va **que** dans les secrets GitHub, jamais dans un fichier du dépôt.

### 7.2 L'identifiant de compte

Celui affiché par `pnpm wrangler whoami` à l'étape 4, ou : Dashboard → **Workers & Pages** →
panneau latéral droit.

### 7.3 Les déposer

`Reefact/justdummies.io` → **Settings** → **Secrets and variables** → **Actions** → **New
repository secret**. Deux entrées, ces noms exactement :

| Nom | Valeur |
|---|---|
| `CLOUDFLARE_API_TOKEN` | le jeton de 7.1 |
| `CLOUDFLARE_ACCOUNT_ID` | l'identifiant de 7.2 |

> ⚠️ **Onglet Secrets, pas Variables.** La page en propose deux, et ce sont deux espaces de noms
> distincts : le workflow lit `${{ secrets.… }}`, donc une valeur créée comme *variable* lui est
> invisible. Le job répondrait « Deployment skipped » sans que rien n'indique que la valeur existe
> à côté.
>
> L'identifiant de compte n'est pourtant pas une donnée d'accès — `vars` serait le rangement juste,
> et le workflow le lirait en clair dans ses logs au lieu de le masquer. Il est en `secrets` parce
> que c'est la forme de l'exemple de Cloudflare, recopiée. À revoir, mais pas pendant la mise en
> place.

### ✅ Contrôle

**Le nom du tag est décidé avant que le tag existe, dans une pull request —
[`ADR-0021`](adr/0021-un-tag-de-release-est-verifie-par-rapport-a-la-pr-qui-la-nomme-fr.md).**
Demande la préparation d'une release. Un agent lit ce qui a changé depuis le tag précédent, rédige
ou rafraîchit `RELEASE_NOTES-en.md`/`fr.md`, calcule `release/<horodatage UTC>` à cet instant,
retitre la section `## Unreleased` avec ce nom, et ouvre une pull request titrée
`ci: prepare <tag>` — qui te remet les commandes de tag ci-dessous, déjà remplies avec ce nom
exact, une par bloc. Relis et fusionne d'abord cette PR, par rebase, comme ce dépôt fusionne
toujours.
[`ADR-0017`](adr/0017-rediger-a-la-main-les-notes-github-dune-release-et-refuser-sans-elles-fr.md)
explique pourquoi la note de release doit exister avant même le tag.

**Exécute ensuite les commandes qu'on t'a remises. La chaîne du tag est celle que la PR a nommée —
jamais recalculée.** Relire l'horloge à cet instant produirait un nom différent de celui que
portent déjà la PR fusionnée et la note de release qu'elle a retitrée ; le job `verify-tag` refuse
un tag qui n'est pas le commit de fusion d'une pull request titrée `ci: prepare <tag>` pour ce nom
exact ([`ADR-0021`](adr/0021-un-tag-de-release-est-verifie-par-rapport-a-la-pr-qui-la-nomme-fr.md)).
Copie le tag depuis le titre de la PR, ou depuis le titre `## release/…` qu'elle a ajouté à
`RELEASE_NOTES-en.md`, et utilise-le tel quel — ne relance pas `date -u` (ni
`[DateTime]::UtcNow`).

Une commande par bloc ci-dessous, pour que chacune soit un copier-coller unique. En PowerShell,
qui est le shell depuis lequel les releases de ce dépôt sont taguées :

```powershell
git checkout main
```

```powershell
git pull origin main
```

```powershell
$tag = 'release/2026-08-19T11-50-00Z'   # le tag exact que la PR fusionnée a nommé
```

```powershell
git tag -a $tag -m $tag
```

```powershell
git push origin $tag
```

Les mêmes, en bash, sous Linux, macOS ou WSL :

```bash
git checkout main
```

```bash
git pull origin main
```

```bash
tag="release/2026-08-19T11-50-00Z"   # le tag exact que la PR fusionnée a nommé
```

```bash
git tag -a "$tag" -m "$tag"
```

```bash
git push origin "$tag"
```

`git tag -a $tag -m $tag` réutilise une seule variable pour le nom et le message plutôt que de
taper la chaîne deux fois — un tag dont le message diffère de son nom a l'air trafiqué, et
`check-release-tag.sh` le refuse à vue.

La dernière commande pousse **ce tag-là**, pas `--tags`. `git push origin --tags` publie tous les
tags du clone, y compris celui que tu as posé sur une branche sans jamais vouloir l'envoyer — une
erreur que ce dépôt a déjà commise une fois.

**Un tag poussé sans pull request `ci: prepare <tag>` fusionnée est refusé avant que quoi que ce
soit ne se déploie.** Le job `verify-tag` s'exécute en premier et conditionne `build`,
`browser-tests` et `deploy` — il n'existe plus de chemin qui tague et publie sans que cette PR ait
d'abord été fusionnée.

Le nom du tag est un **horodatage UTC**, pas un numéro de version. Rien ne consomme ce site, donc la
question à laquelle répond le semver — « est-ce compatible avec ce que j'ai ? » — ne se pose jamais,
tandis que l'arbitrage qu'il exige (mineure ou patch, pour une page d'accueil ?) est un coût sec.
L'horloge produit le nom sans que tu aies à consulter `git tag` d'abord, il ne peut pas entrer en
collision, et l'ordre lexical suit l'ordre chronologique.

Il correspond surtout à l'unité que Cloudflare te rend : `wrangler deployments list` affiche des
horodatages, donc un tag horodaté s'aligne dessus directement — ce qui est toute la raison de nommer
des releases.

> ⚠️ **`date -u` lit la mauvaise horloge sous PowerShell, et ne le dit pas.** Windows PowerShell
> résout `date` vers son alias `Get-Date`, et `-u` se lie à `-UFormat`. `-UFormat` formate l'horloge
> **locale** et écrit le `Z` comme une lettre ordinaire. Sous `Europe/Paris` en août,
> `Get-Date -UFormat "+%Y-%m-%dT%H-%M-%SZ"` a répondu `2026-08-12T17-06-40Z` alors qu'UTC affichait
> `15:06:41`. Les huit premiers tags de release de ce dépôt portent ce mensonge de deux heures dans
> leur nom. PowerShell 7, lui, rejette `-u` comme ambigu — `-UFormat` et `-UnixTimeSeconds`
> correspondent tous les deux — donc une même ligne bash échoue sur une machine et ment sur la
> suivante. `[DateTime]::UtcNow` est de l'UTC sur toutes les versions, et c'est pour ça que le bloc
> ci-dessus l'utilise.

Le tag est **annoté** (`-a -m`) et non léger : il porte un auteur et une date de création, là où un
tag léger ne porte ni l'un ni l'autre. Cette date est ce qui rend le nom vérifiable — c'est le moment
où le tag a réellement été posé, donc le nom peut être confronté à elle.

Le message reprend le nom, et ne dit rien d'autre volontairement. Ce qu'une mise en ligne apporte a
déjà été écrit, avant le tag, dans `RELEASE_NOTES-en.md` — lu verbatim par le job `notes`, jamais
dérivé des commits ou des pull requests
([`ADR-0017`](adr/0017-rediger-a-la-main-les-notes-github-dune-release-et-refuser-sans-elles-fr.md)).
Une phrase tapée à `git tag -m` redirait cela de mémoire, une fois, et jamais plus, pour aucune
lectrice qui ne lirait pas déjà le fichier qu'elle répète. La release GitHub prend son titre dans le
message, donc le titre est le nom du tag lui aussi ; son corps vient du fichier.

Relis le tag dès que tu l'as poussé — depuis WSL sous Windows, comme tout ce qui est sous
`scripts/` :

```bash
./scripts/check-release-tag.sh
```

Il prend le dernier tag `release/*`, et il échoue quand le tag est léger, quand le message n'est pas
le nom, ou quand le nom s'écarte de plus d'une minute du moment où le tag a été posé. La CI lance le
même script sur le tag publié, dans le job **Release notes**, avant d'écrire la page de release.

Pourquoi un tag plutôt qu'une fusion, ce que ça coûte, et les schémas de nommage écartés en
chemin : [`ADR-0001`](adr/0001-a-release-tag-publishes-not-a-merge-fr.md).

> ⚠️ **Ceci publie en production.** Ce n'est pas un essai à blanc. Une poussée sur `main`, elle, ne
> publie rien : elle construit et vérifie.

Le tag déclenche un run complet — `build` puis `Deploy`. Tu peux aussi le rejouer plus tard sans
retaguer : **Actions** → workflow **build** → **Run workflow**, et choisis le **tag** dans le
sélecteur de référence, qui liste les tags autant que les branches.

> **`Deploy` apparaît « skipped » ?** Sur une branche, y compris `main`, **c'est normal** — seul un
> tag `release/*` publie. Sauté *depuis un tag*, c'est autre chose : vérifie que le nom commence bien
> par `release/`. Un job sauté ne dit jamais pourquoi, c'est la façon la moins bavarde de ne pas
> déployer, et la seule manière de trancher est de lire le `if:` du job.

Puis ouvre le job **Deploy** :

- **Attendu :** l'étape *Publish to Cloudflare Workers* se termine sur un déploiement wrangler.
- Une annotation « **Deployment skipped** » nommant un secret ⇒ ce secret manque ou son nom est
  mal orthographié.
- « **Authentication error** » ⇒ jeton expiré, révoqué, ou créé sur un autre compte que
  `CLOUDFLARE_ACCOUNT_ID`.

Vérifie enfin que la publication vient bien de la CI :

```bash
pnpm wrangler deployments list
```

Le déploiement le plus récent doit correspondre à l'heure de ton workflow, pas à ton essai manuel
de l'étape 5. Comme c'est un tag qui a publié, tu peux aussi aligner cette liste sur `git tag` :
chaque déploiement porte un nom, pas seulement une date.

Ou demande-le au site lui-même, ce qui ne demande ni identifiants ni wrangler :

```bash
curl -s https://justdummies.io/version.json
```

```json
{
  "release": "release/2026-08-11T20-33-42Z",
  "commit": "672fc88e799cb06d688b82f9fed3e4a3a5c2b924",
  "built": "2026-08-11T20:41:22Z"
}
```

Trois propriétés de ce fichier méritent d'être connues avant de s'y fier :

- **`release` vaut `null` sauf si le commit portait un tag `release/*`.** Il est lu avec
  `git tag --points-at HEAD`, jamais `git describe`, il nomme donc la release que *ce* commit est —
  jamais la plus proche derrière lui. En CI, il se replie sur la référence pour laquelle
  l'exécution a été déclenchée, parce qu'un checkout n'est pas obligé de laisser une ref de tag
  locale derrière lui, et un build de release qui estampillerait `null` serait faux sur le seul
  déploiement pour lequel ce fichier existe. Si les deux sources se contredisent, la build
  s'arrête au lieu d'en choisir une.
- **Il est écrit par la build, pas par le job de déploiement.** Ce dernier publie l'artefact qu'il a
  téléchargé et ne reconstruit jamais : un fichier estampillé au moment du téléversement serait le
  seul octet du déploiement qu'aucun contrôle n'aurait examiné. L'engendrer dans la build fait que
  `verify-output.sh` l'assertionne, y compris que son commit est bien celui qui a été construit.
- **Il est servi en `no-store`.** Une estampille en cache répond « ce qui était en ligne la dernière
  fois que tu as demandé », qui est la seule réponse qu'elle ne doit jamais donner.
  `check-served-headers.sh` vérifie l'en-tête sur une vraie réponse, parce qu'une règle peut être
  présente sur le disque et ignorée par l'hébergeur.

Il répond *ce qui est en ligne*. Il ne peut pas te dire si `main` a bougé depuis — c'est l'écart que
la décision du tag de release laisse ouvert délibérément, et comparer les deux reste un second
geste.

### Ce que fait la CI, et pourquoi ainsi

À chaque poussée sur `main` **et** sur chaque tag `release/*` :

1. **build** — valide les extraits publiés, installe, contrôle les types, construit, vérifie que
   le contenu généré committé est à jour, contrôle les budgets de taille, **demande au runtime ce
   qu'il sert vraiment** (le script de l'étape 2), **rend l'artefact dans un navigateur**, puis le
   téléverse.
2. **deploy** — récupère **cet artefact-là** plutôt que de reconstruire, rejoue
   `verify-output.sh` sur les octets téléchargés, puis lance `pnpm run deploy`.
3. **Release notes** — relit le tag avec `check-release-tag.sh`, puis écrit la page de release à
   partir des commits que le tag embarque. Il ne tourne que sur les tags, et il est le dernier des
   trois.

Trois choix qui ne se devinent pas :

- **Le job de déploiement ne reconstruit pas.** Il publie l'artefact que les vérifications ont
  examiné ; un job qui reconstruit publie des octets qu'aucun contrôle n'a vus.
- **Il revérifie après téléchargement.** `upload-artifact` ignore les fichiers cachés par défaut,
  et `dist/.assetsignore` en est un. Le workflow passe donc `include-hidden-files: true`, et la
  revérification est ce qui transforme cette ligne en garantie plutôt qu'en intention.
- **Pas de `wrangler-action`.** Le dépôt épingle un wrangler dans `package.json` ; un pipeline qui
  en télécharge un autre publie avec une version que personne n'a testée.

Et **une branche ne publie pas** — ni une pull request, ni `main`. Le job est conditionné à
`refs/tags/release/*`, donc ce qui atteint la production porte toujours un horodatage que tu as posé.

Le coût de ce choix mérite d'être dit : `main` peut prendre de l'avance sur la production
indéfiniment, et rien ici ne te le signalera. Un `Deploy` sauté sur `main` est l'état attendu, pas
un symptôme.

---

## Étape 8 — Brancher `justdummies.io`

**Pourquoi** — Un domaine personnalisé exige que la **zone soit active chez Cloudflare**. L'y amener
est la seule partie de ce guide qui soit difficile à défaire, parce qu'elle change les serveurs de
noms du domaine. Savoir si tu as à le faire du tout est donc la première chose à établir.

**Commence par regarder, pas par ajouter.** Sur <https://dash.cloudflare.com/>, l'accueil du compte
affiche la liste **Websites** — les zones DNS que Cloudflare détient pour toi. Ce n'est pas la même
liste que **Workers & Pages** : un Worker peut exister sans aucun domaine rattaché, et c'est
exactement l'état dans lequel l'étape 5 t'a laissé.

| Ce que montre la zone | Ce qu'il reste à faire |
|---|---|
| `justdummies.io`, **Active**, *DNS Setup: Full* | Rien. Saute le bloc ci-dessous. |
| `justdummies.io`, **Pending Nameserver Update** | Les serveurs de noms ne sont pas basculés — bloc ci-dessous, à partir de 3. |
| Absent de la liste | Tout le bloc ci-dessous. |

**Seulement si la zone n'y est pas encore**, et que le domaine est enregistré ailleurs (OVH, Gandi,
Namecheap…) :

1. Dashboard → **Add a domain** → `justdummies.io` → plan Free.
2. Cloudflare scanne les enregistrements DNS existants. **Relis-les**, surtout les `MX` si une
   adresse e-mail utilise ce domaine : un MX oublié coupe le courrier.
3. Cloudflare affiche deux serveurs de noms. Chez ton registrar, remplace les siens par ceux-là.
4. La propagation prend de quelques minutes à quelques heures. La zone passe **Active**.

**Puis rattache le Worker.** Attention au premier geste : la page de la zone n'a pas de menu
Workers, parce qu'un Worker appartient au compte et non à un domaine. Clique le nom du compte, en
haut à gauche, pour sortir de la zone.

1. **Workers & Pages** — libellé **Compute (Workers)** selon la version du dashboard.
2. `justdummies-site` → **Settings** → **Domains & Routes** → **Add** → **Custom Domain**.
3. `justdummies.io`, sans `https://` et sans `www`.
4. Cloudflare crée l'enregistrement DNS et émet le certificat TLS tout seul.

Un **Custom Domain** envoie tous les chemins du domaine vers le Worker — ce que veut un site. Une
**Route** n'envoie que la partie qui correspond à un motif : si tu tombes sur un formulaire qui
demande un motif avec une `*`, tu n'es pas dans le bon. Rien à changer dans `wrangler.jsonc`.

Le panneau DNS de la zone propose un bouton **Connect Worker**, qui ressemble à un raccourci vers la
même chose. Préfère le chemin ci-dessus : il nomme Custom Domain explicitement, et ce guide n'a pas
mesuré ce que le raccourci crée.

**Ton courrier n'est pas menacé.** Un Custom Domain crée ou remplace l'enregistrement d'adresse *de
cet hôte-là uniquement*. Les `MX` ne sont pas touchés. Si Cloudflare propose de remplacer un
enregistrement existant pour `justdummies.io`, c'est l'invite attendue — accepte.

`www.justdummies.io` est une décision séparée et un Custom Domain séparé. Tant que tu n'en ajoutes
pas un, le nom ne résout pas du tout — un `000` de `curl` là-dessus est l'absence d'enregistrement,
pas une panne.

### ✅ Contrôle

```bash
B=https://justdummies.io
curl -sI $B/ | head -1                       # le certificat est-il valide, le site répond-il ?
for u in / /fr/ /playground/ /playground/not-found /nexiste-pas; do
  printf '%-24s %s\n' "$u" "$(curl -so /dev/null -w '%{http_code}' $B$u)"
done
```

Attendu : `HTTP/2 200`, puis les mêmes codes qu'aux étapes 2 et 5 — `200` pour les quatre premiers,
y compris le lien à froid du playground, et `404` pour le dernier. Une erreur de certificat juste
après l'ajout est normale — Cloudflare met quelques minutes à l'émettre. Un `curl: (6) Could not
resolve host` signifie que la zone n'est pas encore active ou que les serveurs de noms n'ont pas
été changés chez le registrar.

`scripts/check-served-headers.sh https://justdummies.io` lance le contrôle complet contre le
domaine — mais **lis un de ses échecs avant de le croire**. Il prend un actif empreinté dans le
`dist/` local, donc si ta copie de travail a été reconstruite depuis la mise en ligne, ce nom de
fichier n'existe pas en ligne et le script le dit :

```
✗ …/dotnet.native.<hash>.wasm answers 404, so its compression was measured on
  whatever the host sent instead
```

C'est le garde-fou qui fait son travail, pas un déploiement cassé : les empreintes .NET hachent le
contenu, et une reconstruction sur un autre correctif du SDK renomme le fichier. Reconstruis et
redéploie, ou pointe le script sur l'URL que tu as réellement déployée. Pour vérifier la compression
à la main, prends le nom dans ce que le chargeur en ligne référence, pas sur ton disque.

---

## Étape 9 — Prévisualiser sans publier

**Pourquoi** — Téléverser un déploiement candidat sans le mettre devant les visiteurs.

> ⚠️ **Cette étape ne te donne pas de lien à partager.** Elle prétendait le contraire, et c'était
> faux — corrigé après l'avoir exécutée : `pnpm preview` affiche un identifiant de version et aucune
> URL. Une URL de prévisualisation exige `preview_urls` activé, ce dépôt ne l'a jamais déclaré, et
> son défaut est désactivé — donc **aucun téléversement ici n'en a jamais produit.** ADR-0002 laisse
> son activation comme une décision ouverte.
>
> Pour regarder une modification toi-même avant de fusionner, `pnpm serve` est la réponse et l'a
> toujours été : il fait tourner le même runtime Workers en local, avec les vrais en-têtes et les
> vraies règles de redirection. Ce qui manque, c'est seulement l'URL *partageable* qu'un autre
> pourrait ouvrir.

**Faire**

```bash
pnpm build
pnpm preview                              # téléverse une version, sans la promouvoir
pnpm preview --preview-alias ma-branche   # la nomme, pour la liste des déploiements
```

`pnpm build` d'abord, toujours : `preview` téléverse `dist/` tel quel, donc sans lui tu téléverses ce
que ta dernière build y a laissé. La commande répond par un **Worker Version ID**, et t'indique que
la promouvoir demande `wrangler versions deploy`. C'est le mécanisme de preview de Workers, et il
diffère de celui de Pages : ici une version *existe et attend*, au lieu qu'un déploiement par branche
soit créé automatiquement.

### ✅ Contrôle

Vérifie que la production **n'a pas bougé** :

```bash
pnpm wrangler deployments list
curl -s https://justdummies.io/version.json
```

Le déploiement actif doit être inchangé, et `version.json` doit toujours nommer la release en ligne —
c'est tout l'intérêt d'une version non promue. La seconde commande est la plus forte des deux : elle
interroge le site, pas le compte.

---

## Étape 10 — Allumer la mesure

**Pourquoi** — La mesure est à moitié allumée, et il vaut la peine d'être exact sur laquelle des
deux moitiés.

Les **événements** de §15.2 ont une destination depuis que le Worker a été déployé à l'étape 5 : le
binding est inconditionnel, la page émet vers `/_event` qu'un beacon existe ou non, et le jeu de
données se crée à la première écriture. Un visiteur qui copie une commande est déjà enregistré, et
quiconque teste le collecteur à la main l'est aussi — dans le jeu de données que la production
utilisera.

Ce qui manque est la moitié **audience**. Le beacon n'est pas rendu, faute de jeton vers qui
rapporter, et le jeton vit dans le tableau de bord et non dans le dépôt — ce qui explique que
construire et déployer ne l'allume pas. À quoi sert
chaque moitié, et pourquoi il y en a deux, c'est
[ADR-0012](adr/0012-le-site-execute-un-script-worker-pour-la-mesure-fr.md).

**Faire**

1. **Web Analytics** — dans le tableau de bord, *Web Analytics* → *Add a site* → `justdummies.io`.
   Ouvrir *Manage site* et copier le **jeton** depuis l'extrait affiché. Ne coller l'extrait nulle
   part : le site rend sa propre balise, et seul le jeton est utile.

2. **Donner le jeton à l'intégration continue, comme variable et non comme secret.** Dans les
   réglages du dépôt, ajouter `PUBLIC_CF_BEACON_TOKEN` sous *Variables*. Sa place est là parce qu'il
   est réellement public — il est rendu dans chaque page du site et il est fait pour être lu. Rangé
   comme secret, il serait masqué dans les journaux de build pour rien, et la personne suivante le
   prendrait pour quelque chose à protéger.

   Il n'y a rien d'autre à câbler : `.github/workflows/build.yml` le passe déjà à l'étape qui
   construit l'artefact. Ce mappage n'est pas décoratif — une variable de dépôt n'est *pas*
   automatiquement une variable d'environnement de processus, et sans lui le jeton resterait
   configuré et jamais lu, chaque artefact promu par le pipeline ne mesurant aucune audience.

   Un build sans lui est un build normal : pas de beacon, pas de chiffres de fréquentation, et une
   politique qui n'accorde rien aux hôtes d'analytique. `generate-headers.mjs` imprime laquelle des
   deux il a produite, de sorte qu'un build qui a silencieusement cessé de mesurer se voit dans le
   journal plutôt que trois semaines plus tard sur un tableau de bord vide.

3. **Le jeu de données ne demande aucune étape de création — le produit, si.** Analytics Engine crée
   `justdummies_measurement` à la première écriture, et le binding est déjà déclaré dans
   `wrangler.jsonc`. Ce qui n'a jamais été automatique, c'est Analytics Engine lui-même : il
   s'active une fois par compte, à l'étape 5, et tant qu'il ne l'est pas, *tout* déploiement est
   refusé avec `[code: 10089]`. Arriver à cette étape signifie que l'étape 5 a publié, donc qu'il
   est déjà actif — il n'y a rien à faire ici.

4. Déployer, puis passer les contrôles ci-dessous.

### ✅ Contrôle

Les deux premiers sont peu coûteux. C'est le troisième qui compte.

```bash
# 1 — le beacon est dans la page
curl -s https://justdummies.io/ | grep -c 'static.cloudflareinsights.com'      # attendu : 1

# 2 — le collecteur accepte un événement bien formé, et seulement lui.
#     PAS un install-command-copied : cette ligne est écrite dans le même jeu de
#     données que la production, et un contrôle qui fabrique une copie de la
#     commande du hero met dans les chiffres une conversion que personne n'a faite
#     — pire à faible trafic, c'est-à-dire précisément quand on les lit de près.
#     La requête plus bas filtre sur le nom de l'événement : un contrôle nommé à
#     part est un contrôle exclu.
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://justdummies.io/_event \
  -H 'content-type: application/json' \
  -d '{"event":"deployment-check","placement":"hero","variant":"dotnet-cli","locale":"fr","ordinal":0}'
                                                                               # attendu : 204
curl -s -o /dev/null -w '%{http_code}\n' https://justdummies.io/_event         # attendu : 405

# 3 — le Worker n'est sur le chemin de rien d'autre. Le statut seul ne peut pas le
#     dire : le collecteur répond 404 pour un chemin qui n'est pas le sien,
#     exactement comme la couche d'assets, donc un run_worker_first élargi
#     passerait un contrôle de statut. Ce qui les sépare est le corps — la couche
#     d'assets sert la *page* 404, le Worker ne sert rien du tout.
curl -s https://justdummies.io/nexiste-pas | grep -c '<html'                   # attendu : 1, jamais 0
```

Le contrôle suivant et la requête en fin d'étape appellent tous deux l'API de Cloudflare, et aucun
ne fonctionne avec ce que les étapes précédentes te laissent en main : la 7.2 te fait seulement
*noter* l'identifiant de compte, et la 7.1 dit en toutes lettres que le jeton de déploiement ne va
**que** dans les secrets GitHub. Rien n'a jamais mis l'un ou l'autre dans un shell.

```bash
export CLOUDFLARE_ACCOUNT_ID='<identifiant noté en 7.2>'
export CLOUDFLARE_API_TOKEN='<jeton portant Analytics Read — pas celui de déploiement, voir plus bas>'
```

> **Le jeton de déploiement ne peut pas faire ça**, et s'en servir répond une erreur
> d'authentification plutôt qu'un compte de lignes — ce qui se lit comme un collecteur cassé alors
> qu'il ne l'est pas. Le modèle *Edit Cloudflare Workers* de la 7.1 ne porte aucune permission
> d'analytique, et l'API SQL réclame un **Analytics · Read** au niveau du compte (Cloudflare le
> range sous *Account Analytics*).
>
> Ajoute cette permission au jeton de déploiement, ou crée un second jeton ne portant qu'elle. La
> seconde option est meilleure et coûte une minute : un jeton d'analytique en lecture seule est
> l'identifiant le moins dangereux de ce guide, et elle garde le jeton de publication sur la
> trajectoire de *resserrement* que « Ce qui reste à trancher » lui promet déjà.

Un dernier, et c'est celui que le contrôle 2 ne peut pas remplacer :

```bash
# 2b — la ligne a réellement atterri. Le 204 ci-dessus ne prouve que l'arrivée de la
#      requête : le collecteur répond 204 pour un corps malformé et pour chaque rejet
#      de validation aussi, délibérément, donc une charge utile qui aurait dérivé du
#      schéma ressemblerait exactement à un succès. C'est ceci qui les distingue.
curl -s "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -d "SELECT count() AS rows
      FROM justdummies_measurement
      WHERE blob1 = 'deployment-check'
        AND timestamp > now() - INTERVAL '10' MINUTE"
                                                                               # attendu : rows >= 1
```

Laisser passer quelques secondes avant d'interroger : l'écriture est mise en file, pas synchrone. Un
`rows` à zéro après un 204 est l'échec intéressant — la requête a été acceptée et la ligne n'a pas
été écrite, ce qu'un code de statut ne peut par construction jamais signaler.

Ouvrir ensuite le site dans un navigateur, copier une commande d'installation, et **regarder la
console**. §13.2 exige que toute évolution de la politique de contenu soit validée par un chargement
réel plutôt que par une revue, et c'est ce chargement-là : un beacon bloqué se signale là et nulle
part ailleurs. Rien ne doit être signalé.

Le contrôle 3 est celui qui éprouve la décision plutôt que le câblage, et il lit le corps justement
parce que le statut ne prouve rien : les deux chemins finissent en 404. Une page qui revient signifie
que la couche d'assets a répondu sans que le Worker s'exécute, ce qui est exactement ce qui tient le
quota du script à l'écart du site. Un corps vide signifie que le Worker a répondu, que
`run_worker_first` a été élargi, et que la thèse centrale d'ADR-0012 ne tient plus.

### Lire ce qui a été enregistré

Analytics Engine ne livre aucun tableau de bord. La donnée s'interroge via son API SQL, et les champs
sont dans l'ordre où le collecteur les écrit — `blob1` le nom de l'événement, puis l'emplacement, la
variante et la locale, l'ordinal étant `double1` :

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -d "SELECT blob2 AS placement, blob3 AS variant, sum(_sample_interval) AS copies
      FROM justdummies_measurement
      WHERE blob1 = 'install-command-copied'
        AND timestamp > now() - INTERVAL '7' DAY
      GROUP BY placement, variant
      ORDER BY copies DESC"
```

Deux détails de cette requête sont porteurs et non stylistiques.

**`sum(_sample_interval)`, pas `count()`.** Analytics Engine échantillonne un jeu de données dès
qu'il devient chargé, et `count()` compte alors les lignes retenues plutôt que les copies qui ont eu
lieu — silencieusement, et en dessous de la vérité. Chaque ligne retenue porte dans
`_sample_interval` le poids de celles qu'elle représente : sommer cette colonne est ce qui donne un
total juste. Au volume de ce site rien n'est encore échantillonné et les deux coïncident, ce qui est
précisément pourquoi le mauvais choix ne se verrait pas avant que les chiffres comptent.

**Le filtre sur `blob1`.** Le collecteur accepte n'importe quel nom d'événement bien formé, et le
contrôle de déploiement ci-dessus en envoie délibérément un autre. Sans cette ligne, chaque contrôle
jamais passé compterait comme une installation.

Cette requête est tout l'objet de §15.2 : elle dit quel moment de la page a envoyé quelqu'un
installer, et par quelle porte. Grouper sur `placement` seul pour le moment, sur `variant` seul pour
la porte.

Ne pas grouper sur `double1`. C'est l'ordinal, il est là pour qu'un tableau de bord puisse afficher
les scènes dans l'ordre de la page, et §15.3 l'interdit comme clé — la page est déjà passée une fois
de onze à quatorze scènes, et deux périodes mesurées par position ne seraient pas comparables.

---

## Étape 11 — Allumer le parcours

### Pourquoi

Les étapes 5 et 10 ont donné à §15 ses deux voies : combien de personnes viennent, et combien copient
une commande d'installation. Aucune ne dit ce qui s'est passé entre les deux — quelles scènes ont été
lues, où un lecteur s'est arrêté, ce qu'il a comparé d'abord. C'est la voie trois, et
[ADR-0018](adr/0018-le-parcours-est-mesure-dans-une-troisieme-voie-soumise-au-consentement-fr.md) dit
pourquoi elle existe et ce qu'elle coûte.

Contrairement aux deux autres, celle-ci **demande d'abord au visiteur** et ne fait rien du tout tant
qu'il n'a pas dit oui. C'est aussi la seule voie que l'on puisse éteindre depuis le dépôt, ce qui est
la raison pour laquelle elle prend deux variables et non une.

### Faire

**1. Créer la propriété.** Google Analytics → *Admin* → créer une propriété pour `justdummies.io` et
un flux de données **Web** sur ce nom d'hôte. Copier l'identifiant de mesure — la valeur `G-…`. Ne
coller l'extrait d'installation nulle part : le site rend sa propre balise, et seul l'identifiant est
utile.

**2. Désactiver les pages vues sur événement d'historique.** *Admin* → *Flux de données* → le flux →
*Enhanced measurement* → l'engrenage à côté de **Pages vues** → décocher **Page changes based on
browser history events**.

Ce n'est ni optionnel ni cosmétique. La page principale intercepte chaque clic sur une ancre interne
et pousse un état d'historique ; laissé actif, **chaque clic de chevron rapporte une page vue** et
gonfle silencieusement tous les chiffres de la page que l'on veut justement lire. Aucun contrôle de ce
dépôt ne peut le détecter : aucun paramètre de balise ne le règle, et la suite navigateur répond à la
balise par un script vide. C'est nommé dans les Risques d'ADR-0018 pour exactement cette raison.

**Google Signals : rien à désactiver, et rien à activer.** Il est éteint par défaut sur une propriété
neuve et se présente comme une invitation à l'activer, non comme un interrupteur déjà mis — donc ne
pas partir en quête d'un contrôle à éteindre, et ne pas accepter l'invitation. Depuis le 15 juin 2026
il ne gouverne plus la remontée vers Google Ads (c'est `ad_storage`, que la balise refuse en
permanence) ; il ne fait plus qu'enrichir les rapports démographiques à partir des utilisateurs Google
connectés. Cela n'achète rien ici — l'âge et le genre des lecteurs ne changeront aucune décision
éditoriale — et cela introduit des seuils d'échantillonnage qui masquent les chiffres à faible trafic,
ce qui est exactement la situation de départ de cette propriété.

Personnalisation publicitaire : **désactivée**.

La rétention vit sous *Collecte et modification des données* → *Conservation des données*, et il y a
deux menus déroulants, pas un : les **données d'événement** sont à 2 mois par défaut et doivent
passer à **14 mois** ; les **données utilisateur** y sont déjà. Laisser **« réinitialiser lors d'une
nouvelle activité »** actif — la rétention est alors une fenêtre glissante, effaçant les données d'un
visiteur quatorze mois après sa *dernière* visite, ce que la page vie privée dit exactement. Les deux
se changent ensemble, sans quoi l'une des deux se met à mentir.

**3. Déclarer les définitions personnalisées.** *Admin* → *Définitions personnalisées*. Dimensions à
portée événement : `placement`, `variant`, `scene_name`, `act`, `content_locale`, `competitor`,
`link_url`. Une métrique personnalisée : `scene_ordinal`.

À faire **avant** le premier trafic réel. Un paramètre non déclaré est collecté mais pas exploitable
en rapport, et le déclarer plus tard ne remplit pas le passé — l'historique antérieur reste illisible.
`scene_ordinal` est une *métrique* et jamais une dimension ; le [plan de mesure](measurement-plan-fr.md)
dit pourquoi, et c'est §15.3.

**4. Donner les deux variables à la CI.** *Settings* du dépôt → *Secrets and variables* → *Actions* →
**Variables**, à côté de `PUBLIC_CF_BEACON_TOKEN` :

| Variable | Valeur |
|---|---|
| `PUBLIC_GA_MEASUREMENT_ID` | l'identifiant `G-…` |
| `PUBLIC_GA_MEASUREMENT_STATE` | `enabled` ou `disabled` |

Des variables et non des secrets, pour la même raison que le jeton du beacon : l'identifiant est rendu
dans chaque page qui porte la balise et il est fait pour être lu.

**Les deux sont exigées, à chaque build, y compris les builds qui ne mesurent rien.** C'est plus
strict que le jeton du beacon, délibérément — un jeton absent ne peut que mesurer moins, tandis qu'un
état absent laisse « Google est-il allumé ? » répondu par une absence. Le build échoue, et dit quelle
variable et quoi écrire.

L'identifiant est conservé même quand l'état est `disabled`. C'est toute la raison d'en avoir deux :
éteindre la mesure ne doit jamais coûter l'identifiant, et la rallumer ne doit jamais signifier revenir
ici le rechercher.

Seuls `enabled` et `disabled` sont acceptés. `true`, `yes`, `1` et `Enabled` font échouer le build
plutôt que de signifier « éteint » en silence.

**5. Reconstruire et publier.** La balise est rendue au build, donc les variables prennent effet au
prochain tag de release — pas au prochain déploiement d'un artefact construit avant elles.

### ✅ Contrôle

Avec l'état `enabled`, sur le déploiement :

```bash
curl -s https://justdummies.io/ | grep -c 'www.googletagmanager.com'   # attendu 1
curl -sI https://justdummies.io/ | grep -i 'content-security-policy' | grep -c 'googletagmanager'   # attendu 1
```

Avec l'état `disabled`, les deux attendent `0` — et c'est le contrôle qui vaut d'être fait une fois,
parce que toute la valeur du commutateur est qu'éteint signifie *absent*, pas *présent et inerte*.

Ouvrir ensuite le site dans un navigateur, console affichée. §13.2 exige que toute évolution de la
politique de contenu soit validée par un chargement réel plutôt que par une revue, et c'est ce
chargement :

* le bandeau apparaît, une fois ;
* **refuser** — l'onglet Réseau ne montre absolument rien vers un hôte Google ;
* recharger — le bandeau ne revient pas ;
* *Confidentialité* → **Modifier votre choix** → **accepter** — `gtag/js` charge, et la console ne
  rapporte aucune violation de politique ;
* copier une commande d'installation — elle est enregistrée dans les deux voies.

Enfin, GA4 → *Admin* → **DebugView**, avec l'extension Google Analytics Debugger active, et lire
`scene_view` arriver avec un `scene_name`. Confirmer que les paramètres arrivent **avant** de faire
confiance aux rapports, parce que les définitions personnalisées déclarées à l'étape 3 ne s'appliquent
qu'à partir du moment où elles ont existé.

### S'il faut arrêter la mesure

Par ordre de rapidité :

1. **Immédiat, sans toucher au dépôt** — supprimer le flux de données dans la console GA4. La collecte
   s'arrête pour tout le monde d'un coup.
2. **La voie enregistrée** — mettre `PUBLIC_GA_MEASUREMENT_STATE` à `disabled` et publier un tag de
   release. Plus lent, et cela laisse une trace datée dans l'historique du dépôt plutôt que dans une
   console que personne ne peut dater. C'est l'échange autour duquel le commutateur a été conçu.
3. **Pour un visiteur** — *Confidentialité* → *Modifier votre choix* → *Refuser*, avec effet immédiat.

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
| 10 | le beacon dans la page, puis `204`, `405`, `404` | La mesure est allumée, et le Worker est hors du chemin de tout le reste. |
| 11 | la balise dans la page, les hôtes dans la politique, puis refuser → rien vers Google | Le parcours est allumé, et il demande avant de mesurer. |

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
| `PUBLIC_GA_MEASUREMENT_STATE is not set, and this build expects it` | Les deux variables analytics sont exigées par tout build, y compris un build qui ne mesure rien. L'étape 1 porte les deux lignes `export` pour une construction locale ; l'étape 11 donne les vraies valeurs. |
| Aucun beacon dans la page, aucun chiffre de fréquentation | `PUBLIC_CF_BEACON_TOKEN` n'était pas défini quand l'artefact a été construit. Le journal de build dit laquelle des deux variantes il a produite. Il faut reconstruire : la balise est rendue au build, pas à la requête. |
| La console signale une violation de politique nommant `cloudflareinsights` | `_headers` a été modifié à la main, ou une balise beacon a été ajoutée à un build fait sans le jeton. La politique est dérivée de l'artefact ; reconstruire plutôt que rustiner. |
| `wrangler deploy` : `You need to enable Analytics Engine` `[code: 10089]` | Un réglage de compte, pas une faute du dépôt — les assets sont envoyés et les bindings affichés avant l'échec. Voir l'étape 5. |
| `/_event` répond **404** | `run_worker_first` ne le nomme plus, ou le Worker n'a pas été déployé. `wrangler deploy` annonce le binding quand il l'est. |
| Les événements répondent `204` mais le jeu de données est vide | Le nom interrogé n'est pas celui qui est lié. Le binding et le nom du jeu de données sont tous deux dans `wrangler.jsonc`. |

---

## Ce qui reste à trancher

- **Les jumeaux `.br` du framework.** Question ouverte, posée dans `.assetsignore`, à régler avec
  la mesure de l'étape 6.
- **Resserrer le jeton d'API.** Le modèle « Edit Cloudflare Workers » est plus large que
  nécessaire pour un Worker sans script. À réduire une fois le déploiement automatique éprouvé.
- **Les previews en CI.** Elles se font à la main aujourd'hui (étape 9). Les automatiser sur les
  pull requests demanderait de donner à une PR l'accès au jeton — pas une décision de
  configuration, une décision de sécurité.
- **Qu'une requête de page n'invoque jamais le Worker.** Affirmé d'après la documentation
  Cloudflare et d'après `run_worker_first`, pas encore d'après ce déploiement. Cela relève de la
  liste de §12.5 tant que le contrôle 3 de l'étape 10 n'a pas été passé contre le site réel, car
  la thèse centrale d'ADR-0012 repose dessus.
- **Les deux hôtes du beacon.** Que l'hôte du script et l'hôte de report soient les deux que la
  politique nomme est documenté, pas observé. La console du navigateur sur un chargement réel
  tranche.
