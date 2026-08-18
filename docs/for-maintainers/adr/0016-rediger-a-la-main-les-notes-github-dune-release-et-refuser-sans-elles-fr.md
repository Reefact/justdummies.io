# ADR-0016 | Rédiger à la main les notes GitHub d'une release, et refuser sans elles

🌍 🇬🇧 [English](0016-draft-a-releases-github-notes-by-hand-and-refuse-without-them-en.md) · 🇫🇷 Français (ce fichier)

**Statut :** Proposé
**Proposé le :** 2026-08-18
**Décideurs :** Reefact

## Contexte

Depuis l'ADR-0001, la publication est conditionnée à un tag `release/*`, et le job `notes` de
`.github/workflows/build.yml` donne à ce tag une page GitHub Release une fois que le job de
déploiement l'a déjà publiée. Jusqu'ici, le corps de cette page provenait de
`gh release create ... --generate-notes` : la liste mécanique, produite par GitHub lui-même, des
pull requests fusionnées depuis le tag précédent.

Cette liste mélange les registres sans rien pour les distinguer. Le corps d'une release réelle
se lit, dans l'ordre : `ci: bump the codeql-action group across 1 directory with 2 updates` par
`@dependabot[bot]`, `fix(ci): use rebase merge method in dependabot auto-merge workflow`,
`Rebuild the playground around the landing page's code card`, `docs: ratify ADR-0014` — une
mise à jour de dépendance, une correction de maintenance CI, la seule ligne qui pourrait
intéresser une visiteuse, et une note de gouvernance documentaire, présentées comme quatre
puces de même poids. Vingt-quatre releases existent à la date de cette fiche, et le motif se
répète dans la plupart d'entre elles : plusieurs ne contiennent que des mises à jour de
dépendances et des ajustements CI, sous une liste de titres de PR qui ne permet pas de le
distinguer d'une release ayant changé ce que montre le site.

Le titre d'une pull request est écrit pour la personne qui relit ce diff précis — il nomme le
changement, pas ce qu'une lectrice remarquerait du résultat. Le guide de déploiement (étape 7)
défendait la liste mécanique sur l'affirmation exactement inverse : *« Ce qu'apporte une
release, c'est la liste des commits qu'elle embarque, et la CI publie exactement cette liste sur
la page de release. »* Cette affirmation traite « ce qu'apporte une release » et « les commits
qu'elle embarque » comme un seul et même fait ; ce sont deux questions différentes, et rien dans
le pipeline ne les distinguait.

Le dépôt jumeau, `Reefact/just-dummies`, a rencontré le même problème pour ses propres GitHub
Releases et a consigné sa propre réponse : rédiger les notes de release à la main, à partir du
changelog (là-bas, un document soigné), et refuser de publier plutôt que de retomber sur quoi
que ce soit dérivé des commits quand ce brouillon manque (son ADR-0074). `justdummies.io` diffère
sur deux points qui changent l'adaptation, pas la conclusion :

* Il publie un seul artefact, pas quatre packages versionnés indépendamment
  (`CONTRIBUTING.md`, « No release trains ») — une seule paire de fichiers de notes de
  release, pas une par package.
* Il ne tient aucun `CHANGELOG.md` soigné dont partir pour rédiger — rien ici ne relit un
  historique technique avant une release comme le fait le workflow `changelog` de la
  bibliothèque — la source doit donc être lue directement dans les commits et les pull requests
  fusionnées, pas dans un document intermédiaire.
* Ses tags de release sont des horodatages UTC décidés au moment même du tag (ADR-0001), pas des
  numéros de version qu'une mainteneuse connaît déjà à l'avance — une section rédigée à la main
  ne peut donc recevoir son identité définitive qu'au moment où le tag est sur le point d'être
  poussé.

Le job `notes` s'exécute après `deploy` (`needs: deploy`) : au moment où il peut échouer,
l'artefact que cette release nomme est déjà en ligne. Une note manquante ou vide fait donc échouer
la page de release, pas le déploiement.

## Décision

Les notes d'une GitHub Release publiée sont lues verbatim dans `RELEASE_NOTES-en.md`, un fichier
versionné, rédigé à la main, orienté produit, conservé à la racine du dépôt, et le job `notes`
refuse de publier — plutôt que de retomber sur quoi que ce soit dérivé des commits ou des pull
requests — quand la section correspondant au tag publié n'existe pas.

## Justification

**Le titre d'une pull request et une note de release répondent à deux questions différentes.**
L'un explique un diff à une relectrice ; l'autre explique une release à une lectrice qui décide si
cela vaut le coup d'y jeter un œil. Les faits du Contexte montrent ce que produit la dérivation
mécanique du second à partir du premier : une mise à jour de dépendance à côté de la seule ligne
qui intéresserait une visiteuse, sans rien pour les distinguer. Lire réellement les commits et les
pull requests à la main, et ne garder que ce qu'une lectrice remarquerait, est une étape de mise en
forme qu'une mainteneuse (ou un agent, relu avant d'être fusionné) effectue une fois par release —
pas une étape de génération que le pipeline effectuerait sans relecture.

**Refuser sur une section manquante suit le précédent déjà posé par l'ADR-0074 de
`just-dummies`**, pour la même raison : une release publiée avec un substitut dérivé des commits
ressemble à une note de release sans en être une, tandis qu'un job `notes` en échec est visible,
immédiat, et pointe exactement ce qui manque. Comme ce job s'exécute déjà après `deploy`, ce coût —
faire échouer la page, jamais le déploiement — était déjà accepté ; refuser ici n'y ajoute rien.

**La génération a lieu avant le tag, jamais contre lui.** La checklist « avant de taguer » de la
compétence release-notes — retitrer `## Unreleased` avec le tag sur le point d'être poussé,
committer, attendre que la CI passe au vert, *puis* taguer — garde entièrement la rédaction de ce
fichier hors du pipeline déclenché par le tag. Aucun appel à un modèle, et aucune rédaction à la
main, ne se retrouve jamais en course avec la publication d'un déploiement immuable et déjà en
ligne.

**Une seule paire de fichiers, pas une par train de release**, parce que `CONTRIBUTING.md` a déjà
tranché que ce dépôt publie un artefact unique — reproduire ici la structure à quatre fichiers de
`just-dummies` construirait une mécanique pour une partition qui n'existe pas.

## Alternatives envisagées

### Garder `--generate-notes`, et resserrer plutôt la convention des messages de commit

Envisagé parce que cela ne demande ni nouveau fichier ni nouvelle étape manuelle ; l'étape 7 du
guide de déploiement défendait déjà cette option sur cette base. Rejeté : un titre de pull request
est fait pour décrire un diff — aucune convention de formulation ne transforme
`ci: bump the codeql-action group across 1 directory with 2 updates` en quelque chose qu'une
lectrice qui hésite à regarder le site voudrait lire, sans inventer un contenu que ce titre n'a
jamais été écrit pour porter.

### Générer la note de release en CI au moment du tag, à partir du diff depuis la release précédente

Envisagé parce que cela ne demande aucune étape manuelle au-delà de bien écrire les messages de
commit. Rejeté pour la même raison que l'ADR-0074 de `just-dummies` a rejeté son équivalent : le
job `notes` s'exécute contre une release dont le déploiement est déjà en ligne ; atteindre ce point
avec une prose fraîchement générée et non relue, sur le point de devenir le texte public de la
release, supprime la seule vérification — un brouillon humain ou d'un agent, relu avant d'être
committé — que cette décision cherche à préserver.

### Garder la liste dérivée des commits comme repli quand la section rédigée à la main manque

Envisagé comme un atterrissage plus doux qu'un refus pur et simple. Rejeté : un repli qui produit
silencieusement l'artefact même que cette décision cherche à écarter annule l'intérêt d'en rédiger
un à la main. Une note de release manquante doit apparaître comme un manque à combler avant le
prochain tag, pas être discrètement comblée par le mécanisme qu'elle remplace.

### Une paire de fichiers `RELEASE_NOTES` par zone du site (site, playground, référence API)

Envisagé par analogie avec les trains par package de `just-dummies`. Rejeté sur un fait déjà
tranché par `CONTRIBUTING.md` : ce dépôt n'a pas de trains de release, parce qu'il publie un
artefact unique — inventer une telle partition ici serait précisément l'importation par mimétisme
que ce document met déjà en garde contre.

## Conséquences

### Positives

* Le corps d'une GitHub Release devient lisible pour qui décide de regarder ce qui est nouveau sur
  le site, au lieu d'une liste de titres de PR mêlant mises à jour de dépendances et changements
  visibles.
* Une note de release manquante est détectée par un job `notes` en échec, avant que la page de
  release ne soit écrite, plutôt que publiée silencieusement comme un mur de titres de commits.
* L'étape 7 du guide de déploiement n'a plus à défendre une liste mécanique comme si elle était
  l'annonce ; elle peut décrire ce que l'annonce dit réellement.

### Négatives

* Rédiger la note de release devient une étape manuelle — la checklist « avant de taguer » de la
  compétence release-notes — qu'une mainteneuse ou un agent doit penser à exécuter ; plus rien
  dans le dépôt ne la produit de bout en bout automatiquement comme le faisait
  `--generate-notes`.
* `RELEASE_NOTES-en.md` peut diverger du diff réel depuis le tag précédent si la note est rédigée
  sans soin ; rien d'autre que la relecture ne le détecte, comme pour tout autre document qui
  vieillit mal ailleurs dans ce dépôt.

### Risques

* **Un tag poussé avant que sa section soit retitrée fait échouer la release purement et
  simplement.** Mitigation : les étapes « avant de taguer » de la compétence release-notes
  placent ceci avant le rituel du tag, et l'échec bruyant ici est le but recherché, pas un défaut
  à contourner.
* **La nature toujours horodatée d'un tag de release (ADR-0001) signifie que le titre de la
  section ne peut être écrit qu'une fois la mainteneuse déjà en train de publier.** Mitigation :
  le rituel de la compétence limite cela à un commit supplémentaire — retitrer, committer,
  attendre le vert de la CI, puis taguer — pas un second cycle de relecture.

## Actions de suivi

* Aucune requise. `.claude/skills/release-notes/SKILL.md` porte l'instruction opérationnelle,
  `scripts/release-notes.sh` fait respecter le refus, et le job `notes` l'appelle au moment du
  tag.

## Références

* [ADR-0001](0001-a-release-tag-publishes-not-a-merge-fr.md) — non affectée ; continue de régir le
  tag comme porte de publication. Cette fiche change ce qui remplit la page de release qu'un tag
  produit déjà, pas si un tag publie.
* `Reefact/just-dummies`, ADR-0074 (« Draft a release's GitHub notes by hand from the changelog,
  and refuse without them ») — le précédent que cette fiche adapte à un artefact unique, sans
  changelog soigné, et à des tags nommés par horodatage.
* `CONTRIBUTING.md`, « What this repository does not inherit » — « No release trains », le fait
  sur lequel repose la forme à une seule paire de fichiers de cette fiche.
* `.claude/skills/release-notes/SKILL.md`, `scripts/release-notes.sh` — où vivent le format et la
  procédure.
* Étape 7 du guide de déploiement — [English](../deployment-en.md) ·
  [Français](../deployment-fr.md) — mise à jour en même temps que cette fiche pour décrire le
  nouveau mécanisme.
