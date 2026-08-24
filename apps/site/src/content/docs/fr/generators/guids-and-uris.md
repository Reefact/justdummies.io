---
title: "Identifiants et URI"
section: "generators"
slug: "guids-and-uris"
order: 5
locale: "fr"
sourcePath: "doc/handwritten/for-users/generators/guids-and-uris.fr.md"
sourceUrl: "https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-users/generators/guids-and-uris.fr.md"
ref: "lib-v1.0.0-preview.4"
---

Deux générateurs pour les deux sortes d'identifiants qui apparaissent dans presque tous les tests :
l'opaque, et le structuré.

## Guid

```csharp
Guid id       = Any.Guid().Generate();
Guid nonEmpty = Any.Guid().NonEmpty().Generate();
Guid empty    = Any.Guid().Empty().Generate();        // toujours Guid.Empty
Guid notThis  = Any.Guid().DifferentFrom(Guid.Empty).Generate();
Guid oneOf    = Any.Guid().OneOf(Guid.Parse("11111111-1111-1111-1111-111111111111"),
                                 Guid.Parse("22222222-2222-2222-2222-222222222222")).Generate();
```

`Empty()` mérite sa place parce que `Guid.Empty` est un cas distinct dans la plupart des domaines :
l'identifiant pas encore attribué. Un test couvrant « que se passe-t-il quand l'identifiant
manque ? » se lit mieux en `Any.Guid().Empty()` qu'en littéral, car il reste dans le même vocabulaire
que ses voisins.

`NonEmpty()` en est le miroir, et c'est celui à saisir par défaut : une entité qui existe a un
identifiant, et laisser le tirage errer jusqu'à `Guid.Empty` testerait occasionnellement un état que
votre domaine ne possède pas.

## URI

`Any.Uri()` est le point d'entrée et, non contraint, il couvre tout l'espace d'URI sûr — une URI web,
WebSocket, FTP ou mailto absolue, ou une référence relative :

```csharp
Uri anything = Any.Uri().Generate();
```

Se restreindre à une **famille** renvoie un constructeur n'exposant que les composants que cette
famille possède réellement. C'est tout l'intérêt de cette conception : une combinaison impossible —
un port sur un `mailto:`, un fragment sur une URI WebSocket — ne peut même pas s'écrire.


<svg width="835" xmlns="http://www.w3.org/2000/svg" class="jd-diagram" viewBox="0 0 834.0625 177.60000610351562" role="graphics-document document" aria-roledescription="flowchart-v2" aria-describedby="chart-desc-jd-fr-guids-and-uris-0" aria-labelledby="chart-title-jd-fr-guids-and-uris-0" fill="rgb(51, 51, 51)" font-family="&quot;trebuchet ms&quot;, verdana, arial, sans-serif" font-size="16px" height="178"><title id="chart-title-jd-fr-guids-and-uris-0">Les sortes d'URI que Any.Uri() sait tirer</title><desc id="chart-desc-jd-fr-guids-and-uris-0">Any.Uri() se ramifie vers Web pour http et https, WebSocket pour ws et wss, Ftp pour ftp, Mailto pour mailto, et Relative pour un chemin tel que /a/b/c.</desc><g><marker id="jd-fr-guids-and-uris-0_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" stroke-width="0px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" stroke-width="2px" stroke-dasharray="1px, 0px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px"/></marker><marker id="jd-fr-guids-and-uris-0_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto" fill="rgb(11, 11, 11)" stroke="rgb(11, 11, 11)"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" stroke-width="2.5px" stroke-dasharray="1px, 0px"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M376.398,39.618L325.855,46.348C275.313,53.078,174.227,66.539,123.684,76.77C73.141,87,73.141,94,73.141,97.5L73.141,101" id="jd-fr-guids-and-uris-0-L_U_W_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_U_W_0" data-points="W3sieCI6Mzc2LjM5ODQzNzUsInkiOjM5LjYxNzY2NDA5MjY2NDA5fSx7IngiOjczLjE0MDYyNSwieSI6ODB9LHsieCI6NzMuMTQwNjI1LCJ5IjoxMDV9XQ==" data-look="classic" marker-end="url(&quot;#jd-fr-guids-and-uris-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M376.398,48.592L357.728,53.826C339.057,59.061,301.716,69.531,283.046,78.265C264.375,87,264.375,94,264.375,97.5L264.375,101" id="jd-fr-guids-and-uris-0-L_U_S_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_U_S_0" data-points="W3sieCI6Mzc2LjM5ODQzNzUsInkiOjQ4LjU5MTc0ODcxMjg1MzR9LHsieCI6MjY0LjM3NSwieSI6ODB9LHsieCI6MjY0LjM3NSwieSI6MTA1fV0=" data-look="classic" marker-end="url(&quot;#jd-fr-guids-and-uris-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M437.359,55L437.359,59.167C437.359,63.333,437.359,71.667,437.359,79.333C437.359,87,437.359,94,437.359,97.5L437.359,101" id="jd-fr-guids-and-uris-0-L_U_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_U_F_0" data-points="W3sieCI6NDM3LjM1OTM3NSwieSI6NTV9LHsieCI6NDM3LjM1OTM3NSwieSI6ODB9LHsieCI6NDM3LjM1OTM3NSwieSI6MTA1fV0=" data-look="classic" marker-end="url(&quot;#jd-fr-guids-and-uris-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M498.32,50.753L513.754,55.628C529.188,60.502,560.055,70.251,575.488,78.626C590.922,87,590.922,94,590.922,97.5L590.922,101" id="jd-fr-guids-and-uris-0-L_U_M_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_U_M_0" data-points="W3sieCI6NDk4LjMyMDMxMjUsInkiOjUwLjc1MzQzNDA2NTkzNDA2Nn0seyJ4Ijo1OTAuOTIxODc1LCJ5Ijo4MH0seyJ4Ijo1OTAuOTIxODc1LCJ5IjoxMDV9XQ==" data-look="classic" marker-end="url(&quot;#jd-fr-guids-and-uris-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/><path d="M498.32,40.612L542.238,47.177C586.156,53.741,673.992,66.871,717.91,76.935C761.828,87,761.828,94,761.828,97.5L761.828,101" id="jd-fr-guids-and-uris-0-L_U_R_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" data-edge="true" data-et="edge" data-id="L_U_R_0" data-points="W3sieCI6NDk4LjMyMDMxMjUsInkiOjQwLjYxMjE0MjQ0NDM4MDI0fSx7IngiOjc2MS44MjgxMjUsInkiOjgwfSx7IngiOjc2MS44MjgxMjUsInkiOjEwNX1d" data-look="classic" marker-end="url(&quot;#jd-fr-guids-and-uris-0_flowchart-v2-pointEnd&quot;)" fill="none" stroke="rgb(11, 11, 11)" stroke-dasharray="0px"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_U_W_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_U_S_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_U_F_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_U_M_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g><g class="edgeLabel"><g class="label" data-id="L_U_R_0" transform="translate(0, 0)"><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em" text-anchor="middle"/></text></g></g><g><rect class="background"/></g></g><g class="nodes"><g class="node default" id="jd-fr-guids-and-uris-0-flowchart-U-0" data-look="classic" transform="translate(437.359375, 31.5)"><rect class="basic label-container" x="-60.9609375" y="-23.5" width="121.921875" height="47" fill="rgb(30, 33, 38)" stroke="rgb(199, 184, 255)"/><g class="label" transform="translate(0, -8.5)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" fill="rgb(244, 242, 237)" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Any.Uri()</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-guids-and-uris-0-flowchart-W-1" data-look="classic" transform="translate(73.140625, 137.29999923706055)"><rect class="basic label-container" x="-65.140625" y="-32.29999923706055" width="130.28125" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Web()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">http,</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> https</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-guids-and-uris-0-flowchart-S-3" data-look="classic" transform="translate(264.375, 137.29999923706055)"><rect class="basic label-container" x="-76.09375" y="-32.29999923706055" width="152.1875" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">WebSocket()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">ws,</tspan><tspan font-style="italic" class="text-inner-tspan" font-weight="normal"> wss</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-guids-and-uris-0-flowchart-F-5" data-look="classic" transform="translate(437.359375, 137.29999923706055)"><rect class="basic label-container" x="-46.890625" y="-32.29999923706055" width="93.78125" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Ftp()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">ftp</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-guids-and-uris-0-flowchart-M-7" data-look="classic" transform="translate(590.921875, 137.29999923706055)"><rect class="basic label-container" x="-56.671875" y="-32.29999923706055" width="113.34375" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Mailto()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">mailto</tspan></tspan></text></g></g></g><g class="node default" id="jd-fr-guids-and-uris-0-flowchart-R-9" data-look="classic" transform="translate(761.828125, 137.29999923706055)"><rect class="basic label-container" x="-64.234375" y="-32.29999923706055" width="128.46875" height="64.5999984741211" fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g class="label" transform="translate(0, -17.299999237060547)"><rect fill="rgb(255, 244, 221)" stroke="rgb(238, 222, 187)"/><g><rect class="background" fill="rgb(255, 244, 221)"/><text y="-10.1" text-anchor="middle"><tspan class="text-outer-tspan row" x="0" y="-0.1em" dy="1.1em"><tspan font-style="normal" class="text-inner-tspan" font-weight="normal">Relative()</tspan></tspan><tspan class="text-outer-tspan row" x="0" y="1em" dy="1.1em"><tspan font-style="italic" class="text-inner-tspan" font-weight="normal">/a/b/c</tspan></tspan></text></g></g></g></g></g></g><defs><filter id="jd-fr-guids-and-uris-0-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="jd-fr-guids-and-uris-0-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><linearGradient id="jd-fr-guids-and-uris-0-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(40.5882352941, 60%, 83.3333333333%)" stop-opacity="1"/><stop offset="100%" stop-color="hsl(-79.4117647059, 60%, 83.3333333333%)" stop-opacity="1"/></linearGradient></svg>


Chaque composant est tiré parmi les caractères ASCII non réservés et l'URI est assemblée directement :
une valeur est donc valide par construction. Les hôtes internationalisés (IDN) et le schéma `file`
sont volontairement hors du tirage non contraint : ni l'un ni l'autre ne fait l'aller-retour à
l'identique selon la cible, ce qui casserait le contrat de déterminisme.

### URI web

```csharp
Uri page     = Any.Uri().Web().Generate();
Uri secure   = Any.Uri().Web().UsingHttps().WithHost("api.example.com").Generate();
Uri insecure = Any.Uri().Web().UsingHttp().Generate();
Uri deep     = Any.Uri().Web().WithPathSegments(3).Generate();          // /a/b/c
Uri bare     = Any.Uri().Web().WithoutPath().Generate();
Uri onAPort  = Any.Uri().Web().WithPort(8080).Generate();
Uri anyPort  = Any.Uri().Web().WithPort().Generate();                   // un port, non précisé
Uri queried  = Any.Uri().Web().WithQuery().WithFragment().Generate();
Uri withAuth = Any.Uri().Web().WithUserInfo("alice", "secret").Generate();
```

`WithPort()` sans argument demande qu'*un* port soit présent sans dire lequel — la contrainte qu'il
vous faut quand le code testé doit gérer un port explicite mais que le numéro n'a aucune importance.
`WithUserInfo` a trois formes : sans argument, avec un utilisateur, ou avec un utilisateur et un mot
de passe.

### URI WebSocket

```csharp
Uri socket = Any.Uri().WebSocket().Generate();                    // ws:// ou wss://
Uri secure = Any.Uri().WebSocket().UsingWss().WithHost("live.example.com").Generate();
Uri plain  = Any.Uri().WebSocket().UsingWs().WithPathSegments(2).WithQuery().Generate();
```

Une URI WebSocket n'a pas de fragment : il n'y a donc pas de `WithFragment` à appeler.

### URI FTP

```csharp
Uri archive = Any.Uri().Ftp().Generate();
Uri hosted  = Any.Uri().Ftp().WithHost("files.example.com").WithPathSegments(2).Generate();
Uri account = Any.Uri().Ftp().WithUserInfo("alice").WithPort(2121).Generate();
Uri root    = Any.Uri().Ftp().WithoutPath().Generate();
```

### URI mailto

```csharp
Uri mail    = Any.Uri().Mailto().Generate();
Uri toAlice = Any.Uri().Mailto().WithLocalPart("alice").WithDomain("example.com").Generate();
Uri withCc  = Any.Uri().Mailto().WithHeaders().Generate();
```

Un `mailto:` n'a ni hôte, ni port, ni chemin — il a une partie locale, un domaine et des en-têtes
optionnels — et le constructeur expose exactement cela.

### Références relatives

```csharp
Uri relative = Any.Uri().Relative().Generate();
Uri rooted   = Any.Uri().Relative().Rooted().Generate();                    // /a/b/c
Uri deep     = Any.Uri().Relative().WithPathSegments(3).Generate();
Uri queried  = Any.Uri().Relative().WithPathSegments(1).WithQuery().WithFragment().Generate();
```

Une combinaison mérite d'être connue : une référence relative sans segment de chemin, sans requête,
sans fragment et sans racine est la **référence vide**. Elle est licite, et n'est presque jamais ce
qu'un test voulait dire — d'où son propre diagnostic, [JD026](/fr/docs/analyzers/JD026/). C'est la
seule chaîne d'URI dont l'échec atterrit au moment de l'action plutôt qu'à la ligne d'arrangement, et
c'est la raison d'être de l'analyzer.

## Composer un identifiant dans votre propre type

Les deux générateurs alimentent `.As(...)` comme n'importe quel autre :

```csharp
IAny<Customer> anyCustomer = Any.Combine(
    Any.Guid().NonEmpty(),
    Any.String().Alpha().WithLengthBetween(3, 20),
    Any.Uri().Mailto().WithDomain("example.test"),
    (id, name, mail) => new Customer(id, name, mail.ToString()));

Customer customer = anyCustomer.Generate();
```
