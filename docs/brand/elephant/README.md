# Éléa, la mascotte éléphant

Fichiers de référence de la mascotte, dessinée pour le prototype. Ils font foi : le composant `Elephant` du design system les reprend tels quels, sans redessin.

## Fichiers

| Fichier | Usage |
|---|---|
| `elephant-detailed.svg` | Thème Vivant, tailles supérieures à 32 px (bouton micro, accueil, envol des « Noté ») |
| `elephant-simple.svg` | Thème Vivant, 32 px et moins (« Éléa est là », listes, puces) |
| `elephant-classic.svg` | Thème Classique, toutes tailles |
| `elephant.css` | Les quatre états et leurs animations |

## Géométrie

- `viewBox="-6 -4 112 108"` : la marge autour du dessin est volontaire. Elle laisse la place aux oreilles, à la tête inclinée et aux points de réflexion. Ne pas la rogner.
- Chaque oreille est un groupe (`ear-left`, `ear-right`) qui contient la forme et son pli intérieur, pour qu'ils bougent ensemble.
- Couleurs du thème Vivant par variables CSS : `--elephant-skin` (Cherry), `--elephant-ear` (Teal), `--elephant-ink` (encre).

## États

| État | `data-state` | Ce qui bouge |
|---|---|---|
| Repos | `idle` | Clignement des yeux, oreilles qui respirent |
| Écoute | `listening` | Oreilles qui battent, tête inclinée |
| Réflexion | `thinking` | Regard vers le haut, trompe qui s'enroule, trois points |
| Parole | `speaking` | Tête qui bouge, trompe qui se balance |

Règles :
- Une oreille ne dépasse jamais sa taille de repos (échelle maximale 1), pour ne jamais sortir du cadre.
- Le SVG est inséré en entier dans le DOM. Pas de `<use href>` : les animations ne s'appliqueraient pas.
- `prefers-reduced-motion` : aucune animation, et les trois points restent visibles en réflexion.
