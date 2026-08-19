# ADR-0021 | Un tag de release est vérifié par rapport à la pull request qui l'a nommé, pas à sa propre horloge de création

🌍 🇬🇧 [English](0021-a-release-tag-is-verified-against-the-pr-that-named-it-en.md) · 🇫🇷 Français (ce fichier)

**Statut :** Accepté
**Proposé le :** 2026-08-19
**Accepté le :** 2026-08-19
**Décideurs :** Reefact

## Contexte

L'ADR-0001 donne le rituel de tag : lire l'horloge une fois, nommer le tag
`release/<horodatage UTC>`, le créer, le pousser. L'ADR-0017 ajoute une exigence par-dessus ce
rituel — avant que le tag soit poussé, la section `## Unreleased` de `RELEASE_NOTES-en.md`/`fr.md`
doit déjà être retitrée avec ce tag exact, parce que le job `notes` lit la section correspondant
au tag publié et refuse sans elle. Retitrer suppose de connaître le nom final du tag avant que le
tag existe — quelque chose doit donc décider ce nom avant même la commande `git tag`.

Dans la pratique de ce dépôt, ce quelque chose est un agent : la mainteneuse demande la
préparation d'une release, l'agent lit les commits depuis le tag précédent, rédige les deux
fichiers `RELEASE_NOTES`, calcule `release/<horodatage UTC>` à cet instant, retitre `##
Unreleased` avec ce nom, et ouvre une pull request portant ce commit. La mainteneuse relit,
fusionne, et ce n'est qu'ensuite qu'elle exécute elle-même les commandes de tag — séparément,
souvent plusieurs minutes plus tard, parfois davantage, sans autre borne que la vitesse à
laquelle elle s'en occupe.

`scripts/check-release-tag.sh`, ajouté dans le cadre de l'ADR-0017, vérifiait que l'horodatage de
création de l'objet tag lui-même (`%(taggerdate)`) tombait à moins de 60 secondes de l'instant
UTC que son nom prétend être. Cette borne est correcte pour le rituel que décrit l'ADR-0001 — une
seule commande lit l'horloge et crée le tag dans le même souffle — et fausse pour celui qui vient
d'être décrit, où le nom est décidé au moment de préparer la pull request et le tag est fait
ensuite par une autre personne. Ce n'était pas théorique : `release/2026-08-19T11-50-00Z` a été
nommé à `11:50:00`, préparé dans une pull request, fusionné, puis taggé par la mainteneuse à
`11:54:40` — un écart de 280 secondes qu'une release honnête sous ce protocole produit
couramment — et `check-release-tag.sh` l'a rejeté. Comme ce contrôle vit dans le job `notes`
(`needs: deploy`, selon l'ADR-0017), le rejet est arrivé *après* que Cloudflare avait déjà publié
la release ; le déploiement observé pendant cette session n'a jamais été en danger, mais un tag
qui aurait réellement mérité d'être rejeté aurait été livré d'abord, et privé de page de release
ensuite seulement.

Ce que le processus de la mainteneuse a réellement besoin de voir vérifié ne dépend pas du temps
écoulé : le commit que nomme le tag doit être exactement le commit de fusion de la pull request
qui a choisi son nom — `ci: prepare <tag>` — et rien d'autre. Si un autre commit atteint `main`
entre la fusion de cette PR et le moment où la mainteneuse tag — une seconde PR, une fusion
automatique de Dependabot — le `git pull origin main` qui précède le tag (étape 7) le récupère
silencieusement, et le tag poussé publierait un travail que personne n'a relu au titre de cette
release, sous un nom qui ne promettait que ce que la PR décrivait.

## Décision

`scripts/check-release-tag.sh` vérifie un tag de release en demandant à GitHub quelle pull
request fusionnée a produit le commit visé par le tag
(`gh api repos/{owner}/{repo}/commits/<sha>/pulls`), et exige exactement une correspondance
titrée `ci: prepare <tag>` dont le `merge_commit_sha` est égal au commit du tag — remplaçant le
contrôle précédent, qui vérifiait que l'horodatage de création du tag tombait à moins de 60
secondes de son nom. Ce contrôle passe dans un nouveau job `verify-tag`, exécuté avant `build`, et
qui conditionne `build`, `browser-tests` et `deploy` — plutôt que de vivre dans le job `notes`,
après `deploy`.

## Rationale

**L'identité du commit est l'invariant dont dépend réellement ce protocole ; le temps écoulé n'en
est pas un.** Une fois qu'un nom est délibérément décidé avant le tag, dans une pull request
relue, aucune durée entre cette décision et le moment où le tag est poussé n'est en soi suspecte —
une mainteneuse qui relit avec soin avant de fusionner n'est pas un défaut. Ce qui en serait un,
c'est que le tag finisse ailleurs que sur le résultat propre de cette PR, parce qu'y parvenir a
supposé d'inclure quelque chose que la PR ne décrivait pas.

**Déplacer le contrôle avant `deploy` referme exactement l'écart rencontré pendant cette
session.** L'ADR-0017 a délibérément accepté que `notes` s'exécute après `deploy`, pour qu'une
page de release nomme quelque chose qui a effectivement été livré ; cette acceptation ne
s'étendait jamais au contrôle de véracité du tag lui-même — son exécution à cet endroit venait
d'avant que les deux contrôles ne soient distingués. Un tag qui échoue à la vérification bloque
désormais le déploiement qu'il aurait autrement déclenché, pas seulement la page décrivant un
déploiement déjà en ligne.

**Chercher par commit, plutôt qu'en recherchant des titres de PR, évite une seconde source
d'instabilité.** `gh api repos/{owner}/{repo}/commits/<sha>/pulls` renvoie les pull requests que
GitHub associe déjà à ce commit précis — exact et disponible dès que le commit atteint la branche
par défaut. Une recherche par titre (`gh pr list --search`) est tokenisée et approximative, et son
index n'est que cohérent à terme ; l'une ou l'autre propriété pourrait produire un faux négatif
juste après une fusion pourtant légitime — exactement le genre d'échec que cette fiche existe pour
cesser d'introduire.

**L'isolation du token en écriture établie par l'ADR-0017 n'est pas affectée.** `verify-tag` n'a
besoin que de lire une pull request (`pull-requests: read`) ; `contents: write` — nécessaire pour
créer la page de release — reste confiné à `notes` seul, inchangé.

## Alternatives envisagées

### Élargir la tolérance de 60 secondes plutôt que remplacer le contrôle

Envisagé parce que c'est un changement d'une ligne. Rejeté : toute borne fixe reste un indicateur
indirect de la propriété qui compte réellement, et en choisir une échange un nombre arbitraire
contre un autre — trop courte pour une mainteneuse qui relit avec soin, trop longue pour
signifier quoi que ce soit si elle est élargie au point de ne plus jamais se déclencher. L'écart
qui a fait échouer cette session était de 280 secondes ; rien ne dit que le prochain ne sera pas
de 28 minutes.

### Garder le contrôle d'horodatage en plus du nouveau

Envisagé comme filet de sécurité supplémentaire. Rejeté : une fois l'identité du commit vérifiée,
l'horodatage n'ajoute aucune sécurité que le contrôle d'identité ne fournit pas déjà, et le garder
reproduirait exactement l'échec artificiel qui a motivé cette fiche, sur chaque release où la
relecture prend plus d'une minute.

### Rechercher les titres de pull request (`gh pr list --search`) plutôt que l'endpoint commit → PR

Envisagé parce que cela ne demande pas de recherche par commit. Rejeté : la recherche GitHub est
tokenisée plutôt qu'exacte même avec une expression entre guillemets, et son index n'est cohérent
qu'à terme — deux propriétés que ce contrôle ne peut pas se permettre juste après une fusion,
alors que le pipeline qu'il conditionne est déjà en train de s'exécuter.

### Faire lire l'horloge et tagger d'abord par la mainteneuse, puis faire retitrer les notes de release par un agent et pousser un commit de suivi avant que le tag ne compte comme définitif

Envisagé pour garder le rituel de l'ADR-0001 exactement tel qu'il est écrit. Rejeté : `##
Unreleased` doit porter le nom exact du tag avant que le job `notes` puisse le lire (ADR-0017), un
tag fait en premier nécessiterait donc quand même un second aller-retour synchronisé ensuite —
plus lent, et pas plus sûr que de décider le nom une seule fois, en amont, dans la pull request
qu'il faut de toute façon rédiger.

### Laisser le contrôle dans le job `notes`, en changeant seulement sa logique

Envisagé comme le plus petit diff possible. Rejeté : cela satisfait la lettre de « vérifier le
tag » tout en manquant le point de cette fiche, à savoir qu'un mauvais tag doit être refusé
*avant* `deploy`, pas à côté d'une page de release pour un déploiement déjà survenu.

## Conséquences

### Positives

* Un tag de release ne peut plus publier un travail arrivé sur `main` entre la fusion de la PR de
  préparation et le push du tag, qu'il s'agisse d'une seconde PR ou d'une fusion automatisée.
* Un tag qui échoue à la vérification bloque le déploiement lui-même, pas seulement la page de
  release décrivant un déploiement déjà survenu.
* C'est désormais le processus réel de la mainteneuse — préparer dans une PR, tagger séparément —
  que le contrôle mesure, plutôt qu'une hypothèse qui ne tenait plus.

### Négatives

* Chaque release nécessite désormais une pull request titrée exactement `ci: prepare <tag>` ; un
  tag poussé sans elle, ou associé à une PR titrée différemment ou fusionnée autrement, est
  refusé même si le commit sous-jacent est par ailleurs correct.
* Le contrôle dépend de l'API GitHub plutôt que du seul état git local. Ce n'est pas une nouvelle
  catégorie de dépendance pour le pipeline dans son ensemble — `notes` avait déjà besoin de `gh`
  pour créer la release — mais `check-release-tag.sh` lui-même pouvait auparavant s'exécuter
  entièrement hors ligne, et ne le peut plus.

### Risques

* **L'association commit → PR de GitHub pourrait accuser un bref retard juste après une
  fusion.** Aucun retard de ce type n'a été observé à l'échelle de ce dépôt ; si cela arrivait, la
  mitigation est de réessayer une fois plutôt que d'élargir le contrôle vers ce qu'il remplace.
* **Ce mécanisme n'a pas encore été exercé contre un tag qu'il a été écrit pour accepter** — la
  seule release préparée jusqu'ici sous ce protocole (`release/2026-08-19T11-50-00Z`) lui est
  antérieure et était titrée `docs: prepare <tag>`, pas `ci: prepare <tag>`. La prochaine release
  est le premier vrai passage de ce contrôle dans les deux sens ; une mainteneuse surveillant
  `verify-tag` sur ce tag-là est la mitigation en attendant.
* **Deux pull requests pourraient, par erreur, porter le même titre.** La branche « plus d'une
  correspondance » du script échoue bruyamment plutôt que d'en choisir une silencieusement.

## Actions de suivi

* Le rituel de pré-tag du skill `.claude/skills/release-notes/SKILL.md` est réécrit pour le
  protocole à deux personnes que suppose cette fiche : un agent calcule le tag, rédige et retitre
  les notes de release, et ouvre une PR titrée `ci: prepare <tag>` ; la mainteneuse relit,
  fusionne, et exécute elle-même les commandes de tag, remises une par bloc copiable.
* L'étape 7 du guide de déploiement (les deux langues) est mise à jour pour décrire ce
  déroulement comme le chemin principal, aux côtés des commandes directes `date -u`/PowerShell
  qu'il documente déjà pour exécuter la partie tag à la main.
* Ce qui échoue quand cette décision est enfreinte : `scripts/check-release-tag.sh`, exécuté par
  le job `verify-tag` à chaque push d'un tag `release/*`, avant que `build`/`browser-tests`/
  `deploy` ne soient autorisés à s'exécuter — voir les Risques ci-dessus pour le seul point sur
  lequel cela n'a pas encore été observé échouer correctement sur un tag réel.

## Références

* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-en.md) — non affecté dans son affirmation
  centrale qu'un tag publie ; cette fiche change ce qui rend un tag assez digne de confiance pour
  atteindre cette porte, pas le fait que l'atteindre publie.
* [ADR-0017](0017-draft-a-releases-github-notes-by-hand-and-refuse-without-them-en.md) — non
  affecté dans son comportement de refus sur note manquante, ni dans le fait de confiner
  `contents: write` à `notes` ; cette fiche déplace seulement le contrôle de véracité du tag, hors
  de ce job et avant `deploy`.
* `.claude/skills/release-notes/SKILL.md`, `scripts/check-release-tag.sh`,
  `.github/workflows/build.yml` (job `verify-tag`) — où vit le mécanisme.
* Étape 7 du guide de déploiement — [English](../deployment-en.md) ·
  [Français](../deployment-fr.md) — mise à jour en même temps que cette fiche.
