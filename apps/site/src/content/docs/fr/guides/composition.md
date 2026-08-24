---
title: "Composition"
section: "guides"
slug: "composition"
order: 3
locale: "fr"
sourcePath: "doc/handwritten/for-users/guides/composition.fr.md"
sourceUrl: "https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-users/guides/composition.fr.md"
ref: "lib-v1.0.0-preview.4"
---

Les générateurs fournis couvrent les primitifs. Votre code, lui, est fait de références de commande,
de montants, de clients et d'agrégats. Cette page traite du franchissement de cet écart : transformer
des primitifs contraints en dummies pour **vos** types, sans jamais produire une valeur que votre
propre constructeur refuserait.

## `.As(...)` : d'un primitif vers votre type

Un objet-valeur enveloppe généralement un primitif derrière une fabrique qui valide. Contraignez le
primitif pour qu'il satisfasse la fabrique, puis passez la fabrique à `.As(...)` :

```csharp
// OrderReference.Create exige le préfixe « ORD- » et une longueur de 12. Les contraintes
// sont choisies pour que toute chaîne tirée franchisse cette barre — jamais pour faire
// passer une assertion.
IAny<OrderReference> anyReference = Any.String()
                                       .StartingWith("ORD-")
                                       .WithLength(12)
                                       .As(OrderReference.Create);

OrderReference reference = anyReference.Generate();
```

`.As(...)` prend un `IAny<TSource>` et un `Func<TSource, TResult>` et renvoie un `IAny<TResult>` —
un générateur comme un autre, que l'on peut stocker, faire circuler, placer dans une collection ou
rendre nullable.

C'est la voie prévue vers un type au contrat plus strict, et elle a une propriété qui mérite d'être
nommée : la fabrique est la vraie. Si les contraintes sont trop lâches, la fabrique lève une
exception, et vous l'apprenez immédiatement au lieu de livrer un dummy qui n'aurait jamais pu
exister en production.

## `Any.Combine` : plusieurs générateurs en un seul

Quand un type demande plus d'une entrée, `Any.Combine` tire de chaque générateur et alimente un
composeur :


<svg width="765" xmlns="http://www.w3.org/2000/svg" class="jd-diagram" viewBox="0 0 764.0625 195.19998168945312" role="graphics-document document" aria-roledescription="flowchart-v2" aria-describedby="chart-desc-jd-fr-composition-0" aria-labelledby="chart-title-jd-fr-composition-0" fill="rgb(51, 51, 51)" font-family="&quot;trebuchet ms&quot;, verdana, arial, sans-serif" font-size="16px" height="196"><title id="chart-title-jd-fr-composition-0">Comment Any.Combine compose deux générateurs en un seul</title><desc id="chart-desc-jd-fr-composition-0">Un générateur de decimal borné entre 0 et 1000 et un choix parmi EUR, USD et GBP sont composés en un seul IAny de Money, qui tire un Money tel que 412,75 EUR.</desc><g><marker id="jd-fr-composition-0_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px"/></marker><marker id="jd-fr-composition-0_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px" stroke-dasharray="1px, 0px"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M196.055,40.3L200.512,40.3C204.969,40.3,213.883,40.3,227.017,46.864C240.15,53.429,257.504,66.558,266.18,73.122L274.857,79.687" id="jd-fr-composition-0-L_A_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_A_C_0" data-points="W3sieCI6MTk2LjA1NDY4NzUsInkiOjQwLjI5OTk5OTIzNzA2MDU1fSx7IngiOjIyMi43OTY4NzUsInkiOjQwLjI5OTk5OTIzNzA2MDU1fSx7IngiOjI3OC4wNDcwNzkyMzMyODk2LCJ5Ijo4Mi4wOTk5OTg0NzQxMjExfV0=" data-look="classic" marker-end="url(&quot;#jd-fr-composition-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M197.797,154.9L201.964,154.9C206.13,154.9,214.464,154.9,227.302,148.496C240.141,142.092,257.485,129.284,266.157,122.88L274.829,116.476" id="jd-fr-composition-0-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MTk3Ljc5Njg3NSwieSI6MTU0Ljg5OTk5NzcxMTE4MTY0fSx7IngiOjIyMi43OTY4NzUsInkiOjE1NC44OTk5OTc3MTExODE2NH0seyJ4IjoyNzguMDQ3MDc5MjMzMjg5NiwieSI6MTE0LjA5OTk5ODQ3NDEyMTExfV0=" data-look="classic" marker-end="url(&quot;#jd-fr-composition-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M350.219,98.1L354.302,98.017C358.385,97.933,366.552,97.767,374.135,97.683C381.719,97.6,388.719,97.6,392.219,97.6L395.719,97.6" id="jd-fr-composition-0-L_C_M_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_C_M_0" data-points="W3sieCI6MzUwLjIxODc1LCJ5Ijo5OC4wOTk5OTg0NzQxMjExfSx7IngiOjM3NC43MTg3NSwieSI6OTcuNTk5OTk4NDc0MTIxMX0seyJ4IjozOTkuNzE4NzUsInkiOjk3LjU5OTk5ODQ3NDEyMTF9XQ==" data-look="classic" marker-end="url(&quot;#jd-fr-composition-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M558.453,97.6L562.62,97.6C566.786,97.6,575.12,97.6,582.786,97.6C590.453,97.6,597.453,97.6,600.953,97.6L604.453,97.6" id="jd-fr-composition-0-L_M_V_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_M_V_0" data-points="W3sieCI6NTU4LjQ1MzEyNSwieSI6OTcuNTk5OTk4NDc0MTIxMX0seyJ4Ijo1ODMuNDUzMTI1LCJ5Ijo5Ny41OTk5OTg0NzQxMjExfSx7IngiOjYwOC40NTMxMjUsInkiOjk3LjU5OTk5ODQ3NDEyMTF9XQ==" data-look="classic" marker-end="url(&quot;#jd-fr-composition-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_C_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_C_M_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_M_V_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g></g><g class="nodes"><g class="node default" id="jd-fr-composition-0-flowchart-A-0" data-look="classic" transform="translate(102.8984375, 40.29999923706055)"><rect class="basic label-container" x="-93.15625" y="-32.29999923706055" width="186.3125" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Any.Decimal()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Between(0,</tspan><tspan font-style="normal" class="text-inner-tspan" font-weight="normal"> 1000)</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-composition-0-flowchart-C-1" data-look="classic" transform="translate(298.7578125, 97.5999984741211)"><polygon points="8,0 93.921875,0 101.921875,-16 93.921875,-32 8,-32 0,-16" class="label-container" transform="translate(-50.9609375,16)" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -8.5)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">composer</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-composition-0-flowchart-B-2" data-look="classic" transform="translate(102.8984375, 154.89999771118164)"><rect class="basic label-container" x="-94.8984375" y="-32.29999923706055" width="189.796875" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Any.OneOf</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">(EUR,</tspan><tspan font-style="normal" class="text-inner-tspan" font-weight="normal"> USD,</tspan><tspan font-style="normal" class="text-inner-tspan" font-weight="normal"> GBP)</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-composition-0-flowchart-M-5" data-look="classic" transform="translate(479.0859375, 97.5999984741211)"><rect class="basic label-container" x="-79.3671875" y="-23.5" width="158.734375" height="47" fill="rgb(30, 33, 38)" stroke="rgb(199, 184, 255)"/><g class="label" transform="translate(0, -8.5)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">IAny&lt;Money&gt;</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-composition-0-flowchart-V-7" data-look="classic" transform="translate(682.2578125, 97.5999984741211)"><rect class="basic label-container" x="-73.8046875" y="-32.29999923706055" width="147.609375" height="64.5999984741211" fill="rgb(30, 33, 38)" stroke="rgb(127, 211, 193)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Money</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">412,75</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> EUR</tspan></tspan></text></g></g></g></g></g></g><defs><filter id="jd-fr-composition-0-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="jd-fr-composition-0-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><linearGradient id="jd-fr-composition-0-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(40.5882352941, 60%, 83.3333333333%)" stop-opacity="1"/><stop offset="100%" stop-color="hsl(-79.4117647059, 60%, 83.3333333333%)" stop-opacity="1"/></linearGradient></svg>


```csharp
IAny<Money> anyMoney = Any.Combine(
    Any.Decimal().Between(0m, 1_000m).WithScale(2),
    Any.OneOf("EUR", "USD", "GBP"),
    Money.Create);

Money price = anyMoney.Generate();
```

Le composeur peut être un groupe de méthodes, comme ci-dessus, ou une lambda quand la forme demande
un ajustement. Des surcharges existent de deux à huit générateurs.

Chaque opérande doit être réellement **utilisé** par le composeur. Un opérande tiré puis jeté est
presque toujours une erreur — un paramètre resté non lu après un remaniement — d'où le diagnostic
[JD027](/fr/docs/analyzers/JD027/). Quand le tirage est vraiment délibéré, nommez le paramètre `_`
pour le dire.

## Quand huit ne suffit pas

L'arité s'arrête à huit volontairement
([ADR-0005](https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-maintainers/adr/0005-cap-any-combine-at-arity-eight.fr.md)). Un type réclamant
plus de huit entrées indépendantes est un type qui appelle une structure intermédiaire, et composer
cette structure est à la fois le contournement et la meilleure conception :

```csharp
// Composez d'abord les parties...
IAny<Money>          anyPrice     = Any.Combine(Any.Decimal().Between(0m, 1_000m).WithScale(2),
                                                Any.OneOf("EUR", "USD", "GBP"),
                                                Money.Create);
IAny<OrderReference> anyReference = Any.String().StartingWith("ORD-").WithLength(12).As(OrderReference.Create);

// ...puis combinez les parties, non les primitifs.
IAny<string> anySummary = Any.Combine(
    anyReference,
    anyPrice,
    Any.Enum<OrderStatus>(),
    (orderRef, price, status) => $"{orderRef} — {price} — {status}");
```

Un générateur composé est un `IAny<T>` ordinaire : il alimente un autre `Combine`, une collection ou
un `.As(...)` exactement comme un générateur primitif. C'est ce qui fait du plafond une contrainte
de forme plutôt qu'une limite.

## `Any.PairOf` et `Any.TripleOf`

Quand seul le tuple vous intéresse et qu'aucun composeur n'apporterait quoi que ce soit, deux
raccourcis existent :

```csharp
IAny<(int Quantity, decimal UnitPrice)> anyLine = Any.PairOf(
    Any.Int32().Between(1, 100),
    Any.Decimal().Between(0.01m, 500m).WithScale(2));

(int quantity, decimal unitPrice) = anyLine.Generate();

IAny<(Guid, string, OrderStatus)> anyRow = Any.TripleOf(
    Any.Guid().NonEmpty(),
    Any.String().Alpha().WithLengthBetween(3, 20),
    Any.Enum<OrderStatus>());
```

## `.OrNull()` : les valeurs optionnelles

Un champ optionnel mérite un dummy parfois absent — sinon la branche nulle n'est jamais exercée.
`.OrNull()` produit `null` environ une fois sur deux et, sinon, une valeur satisfaisant tout ce qui
a été déclaré en amont :

```csharp
// Types valeur : int?, DateTime?, Guid?, une énumération...
int?      discount  = Any.Int32().Between(0, 100).OrNull().Generate();
DateTime? cancelled = Any.DateTime().Before(new DateTime(2030, 1, 1)).OrNull().Generate();

// Types référence : une chaîne nullable, ou un objet-valeur construit via .As(...)
string?         note      = Any.String().Alpha().WithLengthBetween(1, 40).OrNull().Generate();
OrderReference? reference = Any.String().StartingWith("ORD-").WithLength(12)
                               .As(OrderReference.Create)
                               .OrNull()
                               .Generate();
```

Deux classes d'extension se cachent derrière cette écriture unique — `NullableExtensions` pour les
types valeur et `NullableReferenceExtensions` pour les types référence — car une surcharge contrainte
à `struct` et une autre à `class` entreraient en collision. Vous ne choisissez jamais entre elles :
le compilateur le fait, d'après le type que vous générez.

La décision « null ou valeur » tire du même contexte aléatoire que le générateur enveloppé : une
exécution graînée la rejoue donc exactement. Un tirage `null` ne consomme pas de valeur du
générateur enveloppé.

## Construire un agrégat entier

En rassemblant tout, voici un dummy pour un enregistrement à trois champs, dont aucun n'est un
primitif nu sur le site d'appel :

```csharp
IAny<Customer> anyCustomer = Any.Combine(
    Any.Guid().NonEmpty(),
    Any.String().Alpha().WithLengthBetween(3, 20),
    Any.String().Alpha().InLowerCase().WithLengthBetween(3, 12),
    (id, name, localPart) => new Customer(id, name, $"{localPart}@example.test"));

Customer customer = anyCustomer.Generate();

// Un générateur est une recette : le même produit donc toute une liste de clients distincts.
List<Customer> customers = Any.ListOf(anyCustomer).WithCountBetween(2, 5).Generate();
```

Conservez un tel générateur dans un champ `static readonly` de votre classe de test et chaque test
du fichier obtient un client valide en un appel — sans état mutable partagé, puisque les générateurs
sont immuables.
