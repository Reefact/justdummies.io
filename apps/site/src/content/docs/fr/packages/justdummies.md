---
title: "JustDummies"
section: "packages"
slug: "justdummies"
order: 0
locale: "fr"
sourcePath: "doc/handwritten/for-users/packages/justdummies.fr.md"
sourceUrl: "https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-users/packages/justdummies.fr.md"
ref: "lib-v1.0.0-preview.4"
---

La bibliothèque elle-même : le point d'entrée `Any`, tous les générateurs, les portées de
reproductibilité, et les 33 règles qui veillent au bon usage.

## Installation

```bash
dotnet add package JustDummies
```

Il ne prend **aucune dépendance à l'exécution**. L'ajouter place un assembly et un jeu d'analyzers
dans votre projet de test, et rien d'autre dans votre graphe de dépendances.

## Ce que vous obtenez

| | |
| --- | --- |
| `Any.*` | une fabrique par primitif du BCL, plus les collections, les URI et les choix |
| `IAny<T>` | la couture qu'implémente tout générateur, et la monnaie d'échange de la composition |
| `Any.Reproducibly` / `UseSeed` / `WithSeed` | les portées de reproductibilité |
| `AnyContext` | un monde isolé et graîné, portant les mêmes fabriques |
| `DummyException` et ses trois sous-types | le vocabulaire des échecs |
| 33 règles Roslyn | embarquées dans le paquet, actives dès la compilation suivante |

## Les analyzers voyagent dans le paquet

Les règles sont empaquetées sous `analyzers/dotnet/cs`, la convention que NuGet lit pour charger des
analyzers automatiquement. Référencer `JustDummies` constitue donc toute l'installation : il n'y a
pas de paquet d'analyzers compagnon à retenir, ni de version à maintenir en phase
([ADR-0023](https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-maintainers/adr/0023-ship-justdummies-analyzers.fr.md)).

Ils existent parce que le système de types n'atteint pas l'endroit où vivent ces erreurs — un
générateur rendu sous forme de texte, une contrainte dont le résultat est jeté, une graine épinglée
hors de sa portée, une chaîne n'admettant aucune valeur. Voir
l'[index des règles](/fr/docs/analyzers/) pour les 33, et
[JD005](/fr/docs/analyzers/JD005/) pour celle qui attrape le faux pas le plus courant.

Pour ajuster une sévérité, utilisez `.editorconfig` :

```ini
# activer une règle optionnelle
dotnet_diagnostic.JD011.severity = warning

# ou en faire taire une dont vous ne voulez pas
dotnet_diagnostic.JD024.severity = none
```

## Frameworks cibles

| Asset | Porte |
| --- | --- |
| `netstandard2.0` | toute la bibliothèque, moins les cinq fabriques de types modernes |
| `net8.0` | la même, plus `Any.DateOnly()`, `Any.TimeOnly()`, `Any.Int128()`, `Any.UInt128()`, `Any.Half()` |

Ces cinq fabriques sont absentes en deçà parce que les **types** le sont : `DateOnly`, `TimeOnly`,
`Int128`, `UInt128` et `Half` sont arrivés après `netstandard2.0`. Rien n'est émulé, et c'est
pourquoi une valeur tirée sur l'un ou l'autre asset est le vrai type plutôt qu'un substitut.

Le plancher .NET Framework supporté est **4.7.2**, exercé en CI contre l'asset `netstandard2.0` que
les consommateurs .NET Framework chargent réellement
([ADR-0007](https://github.com/Reefact/just-dummies/blob/lib-v1.0.0-preview.4/doc/handwritten/for-maintainers/adr/0007-floor-the-library-on-net-framework-4-7-2.fr.md)).

## Tour d'horizon

```csharp
// Un scalaire, contraint par les invariants de son domaine.
int quantity = Any.Int32().Between(1, 100).Generate();

// Un objet-valeur, construit via sa vraie fabrique.
OrderReference reference = Any.String().StartingWith("ORD-").WithLength(12)
                              .As(OrderReference.Create)
                              .Generate();

// Une collection de ces objets.
List<OrderReference> basket = Any.ListOf(Any.String().StartingWith("ORD-").WithLength(12)
                                            .As(OrderReference.Create))
                                 .WithCountBetween(1, 4)
                                 .Generate();

// Le tout rejouable depuis un seul entier.
Any.Reproducibly(() => Assert.InRange(Any.Int32().Between(1, 100).Generate(), 1, 100));
```

Pour aller plus loin :

* [Démarrer](/fr/docs/guides/getting-started/) — la rampe d'accès en dix minutes
* [Référence des générateurs](/fr/docs/generators/) — chaque fabrique et ses contraintes
* [Composition](/fr/docs/guides/composition/) — des dummies pour vos propres types
* [Reproductibilité](/fr/docs/guides/reproducibility/) — graines, portées et rejeu
