---
title: "Erreurs et conflits"
section: "guides"
slug: "errors-and-conflicts"
order: 5
locale: "fr"
sourcePath: "doc/handwritten/for-users/guides/errors-and-conflicts.fr.md"
sourceUrl: "https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.3/doc/handwritten/for-users/guides/errors-and-conflicts.fr.md"
ref: "lib-v1.0.0-preview.3"
---

JustDummies préfère refuser bruyamment plutôt que renvoyer une valeur que personne ne saurait
expliquer. Cette page décrit ce qu'elle refuse, ce que signifient les exceptions, et comment lire un
message qui nomme les deux côtés d'une contradiction.

## La hiérarchie d'exceptions


<svg width="884" xmlns="http://www.w3.org/2000/svg" class="jd-diagram" viewBox="0 0 883.3125 345" role="graphics-document document" aria-roledescription="flowchart-v2" aria-labelledby="chart-title-jd-fr-errors-and-conflicts-0" fill="rgb(51, 51, 51)" font-family="&quot;trebuchet ms&quot;, verdana, arial, sans-serif" font-size="16px" height="345"><title id="chart-title-jd-fr-errors-and-conflicts-0">La hiérarchie d'exceptions</title><g><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px"/></marker><marker id="jd-fr-errors-and-conflicts-0_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px" stroke-dasharray="1px, 0px"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M439.039,55L439.039,59.167C439.039,63.333,439.039,71.667,439.039,79.333C439.039,87,439.039,94,439.039,97.5L439.039,101" id="jd-fr-errors-and-conflicts-0-L_E_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_E_D_0" data-points="W3sieCI6NDM5LjAzOTA2MjUsInkiOjU1fSx7IngiOjQzOS4wMzkwNjI1LCJ5Ijo4MH0seyJ4Ijo0MzkuMDM5MDYyNSwieSI6MTA1fV0=" data-look="classic" marker-end="url(&quot;#jd-fr-errors-and-conflicts-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M316.031,172.847L285.868,179.406C255.704,185.965,195.378,199.082,165.214,212.075C135.051,225.067,135.051,237.933,135.051,244.367L135.051,250.8" id="jd-fr-errors-and-conflicts-0-L_D_A_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_D_A_0" data-points="W3sieCI6MzE2LjAzMTI1LCJ5IjoxNzIuODQ3MTM1NTE4NzUwMX0seyJ4IjoxMzUuMDUwNzgxMjUsInkiOjIxMi4xOTk5OTY5NDgyNDIyfSx7IngiOjEzNS4wNTA3ODEyNSwieSI6MjU0Ljc5OTk5OTIzNzA2MDU1fV0=" data-look="classic" marker-end="url(&quot;#jd-fr-errors-and-conflicts-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M439.039,187.2L439.039,191.367C439.039,195.533,439.039,203.867,439.039,211.533C439.039,219.2,439.039,226.2,439.039,229.7L439.039,233.2" id="jd-fr-errors-and-conflicts-0-L_D_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_D_C_0" data-points="W3sieCI6NDM5LjAzOTA2MjUsInkiOjE4Ny4xOTk5OTY5NDgyNDIyfSx7IngiOjQzOS4wMzkwNjI1LCJ5IjoyMTIuMTk5OTk2OTQ4MjQyMn0seyJ4Ijo0MzkuMDM5MDYyNSwieSI6MjM3LjE5OTk5Njk0ODI0MjJ9XQ==" data-look="classic" marker-end="url(&quot;#jd-fr-errors-and-conflicts-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M562.047,172.619L592.646,179.216C623.246,185.813,684.445,199.006,715.045,209.103C745.645,219.2,745.645,226.2,745.645,229.7L745.645,233.2" id="jd-fr-errors-and-conflicts-0-L_D_U_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_D_U_0" data-points="W3sieCI6NTYyLjA0Njg3NSwieSI6MTcyLjYxODgyMTY3NjE0NTJ9LHsieCI6NzQ1LjY0NDUzMTI1LCJ5IjoyMTIuMTk5OTk2OTQ4MjQyMn0seyJ4Ijo3NDUuNjQ0NTMxMjUsInkiOjIzNy4xOTk5OTY5NDgyNDIyfV0=" data-look="classic" marker-end="url(&quot;#jd-fr-errors-and-conflicts-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_E_D_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_D_A_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_D_C_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_D_U_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g></g><g class="nodes"><g class="node default" id="jd-fr-errors-and-conflicts-0-flowchart-E-0" data-look="classic" transform="translate(439.0390625, 31.5)"><rect class="basic label-container" x="-65.1328125" y="-23.5" width="130.265625" height="47" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -8.5)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Exception</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-errors-and-conflicts-0-flowchart-D-1" data-look="classic" transform="translate(439.0390625, 146.0999984741211)"><rect class="basic label-container" x="-123.0078125" y="-41.099998474121094" width="246.015625" height="82.19999694824219" fill="rgb(30, 33, 38)" stroke="rgb(199, 184, 255)"/><g class="label" transform="translate(0, -26.099998474121094)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">DummyException</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">abstraite</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> —</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> la</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> racine</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> de</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> la</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="2.1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">bibliothèque</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-errors-and-conflicts-0-flowchart-A-3" data-look="classic" transform="translate(135.05078125, 287.0999984741211)"><rect class="basic label-container" x="-127.05078125" y="-32.29999923706055" width="254.1015625" height="64.5999984741211" fill="rgb(30, 33, 38)" stroke="rgb(255, 184, 107)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">AnyGenerationException</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">un</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> tirage</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> n'a</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> pas</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> pu</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> aboutir</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-errors-and-conflicts-0-flowchart-C-5" data-look="classic" transform="translate(439.0390625, 287.0999984741211)"><rect class="basic label-container" x="-126.9375" y="-49.900001525878906" width="253.875" height="99.80000305175781" fill="rgb(30, 33, 38)" stroke="rgb(242, 131, 107)"/><g class="label" transform="translate(0, -34.900001525878906)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">ConflictingAnyConstraintEx</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">ception</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="2.1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">les</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> contraintes</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> n'admettent</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="3.2em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">aucune</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> valeur</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-errors-and-conflicts-0-flowchart-U-7" data-look="classic" transform="translate(745.64453125, 287.0999984741211)"><rect class="basic label-container" x="-129.66796875" y="-49.900001525878906" width="259.3359375" height="99.80000305175781" fill="rgb(30, 33, 38)" stroke="rgb(242, 131, 107)"/><g class="label" transform="translate(0, -34.900001525878906)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">UnsupportedRegexExceptio</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">n</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="2.1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">le</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> motif</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> sort</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> du</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="3.2em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">sous-ensemble</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> régulier</tspan></tspan></text></g></g></g></g></g></g><defs><filter id="jd-fr-errors-and-conflicts-0-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="jd-fr-errors-and-conflicts-0-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><linearGradient id="jd-fr-errors-and-conflicts-0-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(40.5882352941, 60%, 83.3333333333%)" stop-opacity="1"/><stop offset="100%" stop-color="hsl(-79.4117647059, 60%, 83.3333333333%)" stop-opacity="1"/></linearGradient></svg>


`DummyException` est abstraite : l'attraper attrape donc tout ce que cette bibliothèque lève, et
rien d'autre :

<!-- jd:allow=JD023 -->
```csharp
try {
    int impossible = Any.Int32().Between(1, 10).MultipleOf(50).Generate();
} catch (DummyException exception) {
    Console.Error.WriteLine(exception.Message);
}
```

Les erreurs d'argument ordinaires ne font **pas** partie de cette hiérarchie. Passer `null` là où un
générateur est attendu, ou une longueur négative, lève les habituelles `ArgumentNullException` /
`ArgumentException` — ce sont des bogues du code appelant, pas des affirmations sur un jeu de
contraintes.

## `ConflictingAnyConstraintException` : aucune valeur possible

C'est celle que vous rencontrerez le plus, et c'est une fonctionnalité, non un défaut. Parce que les
valeurs sont construites pour satisfaire toute la spécification au lieu d'être tirées puis filtrées,
une spécification qui ne satisfait rien est détectée au lieu d'être parcourue en boucle :

<!-- jd:allow=JD023 -->
```csharp
// Aucun entier n'est à la fois supérieur à 100 et inférieur à 10.
int impossible = Any.Int32().GreaterThan(100).LessThan(10).Generate();
```

**Le message nomme les deux côtés du conflit.** C'est une garantie du produit, non un hasard de
formulation : un message se contentant de dire « aucune valeur n'est possible » vous laisserait
relire une chaîne de douze appels pour trouver lesquels se contredisent.

Les conflits prennent quelques formes reconnaissables :

| Forme | Exemple |
| --- | --- |
| bornes qui se croisent | `.GreaterThan(100).LessThan(10)` |
| un treillis sans point dans l'intervalle | `.Between(1, 10).MultipleOf(50)` |
| des exclusions qui vident le domaine | `Any.Boolean().Except(true, false)` |
| une longueur trop courte pour les fragments | `.StartingWith("ORDER-").WithLength(3)` |
| un effectif qu'aucun vivier ne peut remplir | 100 valeurs distinctes depuis un vivier de trois |

## Attrapés à la compilation

Beaucoup de ces chaînes sont décidables à partir de constantes que le compilateur voit déjà, et les
analyzers embarqués dans le paquet les signalent **avant** que le test ne s'exécute. C'est la
différence entre un build rouge et un test rouge à trois heures du matin :

| Règle | Détecte |
| --- | --- |
| [JD014](/fr/docs/analyzers/JD014/) | un argument constant que la garde du générateur refuse |
| [JD015](/fr/docs/analyzers/JD015/) | une chaîne de caractères qui lève : fragments trop longs, ou value set vidé par une contrainte |
| [JD016](/fr/docs/analyzers/JD016/) | des effectifs de collection incompatibles entre eux |
| [JD017](/fr/docs/analyzers/JD017/) | une contrainte d'énumération sortant des membres déclarés |
| [JD023](/fr/docs/analyzers/JD023/) | une chaîne entière réduite à rien |
| [JD024](/fr/docs/analyzers/JD024/) | une contrainte qui ne restreint rien du tout |

Les vérifications à l'exécution restent en place dans tous les cas : elles couvrent tout argument
qu'un analyzer ne peut pas voir — calculé, lu dans un champ, ou reçu en paramètre.

## `AnyGenerationException` : un tirage qui n'a pas abouti

Quelques contraintes ne peuvent pas être honorées par construction. Exclure des valeurs d'un
intervalle continu, satisfaire une expression régulière et remplir une collection d'éléments
distincts aboutissent au même endroit : tirer un candidat, le vérifier, recommencer s'il ne convient
pas.

Sans borne, c'est une boucle qui peut ne jamais finir. JustDummies la borne — un nombre fixe de
tentatives, puis un refus :

```csharp
// Deux décimales entre 0 et 1 laissent 101 candidats ; en exclure 100 n'en laisse qu'un.
decimal[] excluded = Enumerable.Range(0, 100).Select(index => index / 100m).ToArray();

try {
    decimal awkward = Any.Decimal().Between(0m, 1m).WithScale(2).Except(excluded).Generate();
} catch (AnyGenerationException exception) {
    // exception.Seed porte la graine de l'exécution, si une graine était épinglée — l'échec se rejoue donc.
    Console.Error.WriteLine($"{exception.Message} (seed: {exception.Seed})");
}
```

`AnyGenerationException` porte une propriété `Seed` nullable. Quand le tirage a eu lieu dans une
portée reproductible, la graine qui l'a produit figure sur l'exception : un échec de retirage borné
est donc aussi rejouable que n'importe quel autre échec.

En rencontrer un signifie généralement que la spécification est plus serrée que prévu, et non que la
bibliothèque a abandonné trop tôt. Élargissez l'intervalle, retirez une exclusion, ou demandez moins
d'éléments distincts.

## `UnsupportedRegexException` : hors du sous-ensemble régulier

`Any.StringMatching` construit une valeur à partir du motif au lieu de tester des candidats contre
lui, et c'est pourquoi il peut garantir la correspondance. Construire exige que le motif soit
**régulier**, et la bibliothèque le dit plutôt que de deviner :

```csharp
try {
    // Une référence arrière n'est pas une construction régulière : aucun automate fini ne la porte.
    string impossible = Any.StringMatching(@"(\w+)\s\1").Generate();
} catch (UnsupportedRegexException exception) {
    Console.Error.WriteLine(exception.Message);
}
```

Les constructions acceptées — et celles refusées — sont listées dans
[Chaînes et motifs](/fr/docs/generators/strings/). La décision d'analyser un sous-ensemble régulier
avec l'analyseur syntaxique de la bibliothèque, plutôt que de prendre une dépendance à un automate
d'expressions régulières pour élargir la couverture, est
[ADR-0008](https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.3/doc/handwritten/for-maintainers/adr/0008-generate-strings-from-a-home-grown-regular-subset.fr.md).

## Symptôme, cause, remède

| Symptôme | Cause probable | Remède |
| --- | --- | --- |
| `ConflictingAnyConstraintException` à la ligne d'arrangement | deux contraintes se contredisent | lisez le message — il nomme les deux — et retirez celle qui n'est pas un invariant du domaine |
| `AnyGenerationException` après une pause | un retirage borné a épuisé ses tentatives | élargissez le domaine, ou demandez moins de valeurs distinctes |
| `UnsupportedRegexException` | le motif utilise une construction non régulière | réécrivez-le dans le sous-ensemble régulier, ou construisez la chaîne avec les contraintes d'`Any.String()` |
| une valeur que votre fabrique refuse | les contraintes sont plus lâches que la fabrique | resserrez les contraintes jusqu'à ce qu'elles impliquent le contrat de la fabrique |
| un test qui passe à la relance | les valeurs en échec ont disparu | enveloppez le corps dans `Any.Reproducibly` pour que le prochain échec nomme sa graine |
| un avertissement de build `JD0NN` | une erreur décidable à la compilation | ouvrez la page de règle liée depuis le diagnostic |
