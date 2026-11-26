# Éléa : design system

Source de vérité pour toute interface du prototype. Les valeurs sont dans `src/styles/tokens.css` et `src/motion/springs.ts`. Un composant ou un motif absent d'ici doit y être ajouté **avant** d'être utilisé dans une fonctionnalité (voir `tickets/README.md`, section Design system).

## 1. Direction : deux thèmes, une voix

Éléa n'est pas un tableau de bord ni un chat. C'est le **carnet d'un conseiller** : chaleureux, posé, qui écoute, note et range sous les yeux du dirigeant.

Le thème par défaut est **Vivant** (néo-brutal doux) : fond jaune franc, contours d'encre, ombres dures, aplats pleins, Bricolage Grotesque. L'ancien rendu reste disponible sous le nom **Classique**.

Cinq principes :

1. **Une voix, pas une machine.** Les questions et titres d'Éléa utilisent `--font-voice` (Bricolage 800 en Vivant, Fraunces en Classique).
2. **La mémoire se voit.** Chaque fois qu'Éléa retient quelque chose, un mouvement le montre.
3. **Un geste, une animation, une raison.** Aucune animation décorative.
4. **Tokens uniquement.** Le thème passe par `data-theme` sur `<html>`. Aucun composant ne teste le thème dans son code.
5. **Calme sur mobile, dense sur ordinateur.**

À éviter : Inter, les dégradés violets, les ombres grises froides, les emojis dans l'interface, brancher un composant sur `data-theme`.

## 2. Thèmes

Pilotage : `document.documentElement.dataset.theme = "vivant" | "classic"`.

| Token clé | Vivant (défaut) | Classique |
| --- | --- | --- |
| `--color-bg` | `#ffe066` | Papier `#fbf8f3` |
| `--color-surface` | Blanc | Blanc |
| `--color-surface-side` | Blanc (colonnes bureau) | Papier (comme le fond) |
| `--color-border` | Encre `#011627` | `#e6e1d8` |
| `--border-width` | `2px` | `1px` |
| `--border-width-strong` | `2px` | `1.5px` |
| `--shadow-card` | `3px 3px 0` encre | ombre douce actuelle |
| `--shadow-raised` | `4px 4px 0` encre | ombre douce niveau 2 |
| `--press-shift` / `--press-shadow` | `2px` / ombre réduite | `0` / inchangé |
| `--font-voice` / `--font-ui` | Bricolage Grotesque | Fraunces / Instrument Sans |
| `--radius-md` | `12px` | `14px` |
| Softs (action, mémoire…) | aplats pleins | lavis pâles |

### Contrastes AA (WCAG 2.1)

Texte courant ≥ 4,5 ; grand texte / icônes ≥ 3.

#### Vivant

| Paire | Contraste | Verdict |
| --- | --- | --- |
| Encre `#011627` sur jaune `#ffe066` | ≈ 12,6 | AAA |
| Texte secondaire `#3d4a57` sur jaune | ≈ 7,0 | AAA |
| Blanc sur Teal `#087e8b` | 4,8 | AA |
| Blanc sur Cherry `#a30b37` | ≈ 7,2 | AAA |
| Encre sur Icy `#b1ddf1` | 12,6 | AAA |
| Encre sur Bronze `#dda77b` | 8,6 | AAA |
| Teal `#087e8b` sur jaune (lien) | ≈ 4,6 | AA |
| Bronze ou Icy en texte seul sur jaune | < 3 | **Interdit** |

#### Classique

| Paire | Contraste | Verdict |
| --- | --- | --- |
| Ink sur papier | 17,3 | AAA |
| Texte secondaire `#5b6875` sur papier | 5,4 | AA |
| Blanc sur Teal | 4,8 | AA |
| Teal `#087e8b` sur papier | 4,5 | AA (limite) : préférer `--teal-600` |
| Cherry sur papier | 7,5 | AAA |
| Ink sur Bronze / Icy | 8,6 / 12,6 | AAA |
| Bronze ou Icy en texte sur clair | 1,5 à 2,1 | **Interdit** |

### Règles couleur

- Bronze et Icy ne portent jamais de texte « décor » : utiliser `--color-on-memory` / `--color-on-info`.
- Cherry reste réservé à la présence d'Éléa. Sur aplat Cherry (Vivant), texte `--color-on-presence` (blanc).
- Une donnée chiffrée ne se signale jamais par la couleur seule.

## 3. Typographie

| Usage | Vivant | Classique |
| --- | --- | --- |
| Question / titre (`voice`) | Bricolage 800 | Fraunces 500 + `--voice-variation` |
| Texte courant | Bricolage 400–600 | Instrument Sans 400–600 |
| Montants | `tabular-nums`, espaces fines FR | idem |

## 4. Espace, forme, profondeur

- Grille de 4 px. Marges : 20 / 32 / 40 px.
- Contours : `inset 0 0 0 var(--border-width) …` ou `border: var(--border-width) solid …`.
- Ombres : `var(--shadow-card)` / `var(--shadow-raised)`. Vivant : dures, sans flou.
- Appui : `translate(var(--press-shift), var(--press-shift))` + `var(--press-shadow)`.
- Progression : jauge à segments (`--gauge-gap`, `--gauge-seg-border`) : gap 0 en Classique (rendu continu), segments visibles en Vivant.
- Cible tactile : 44 × 44 px.

## 5. Mouvement

L'interface doit être **vivante**. Les animations restent actives même si le système demande de les réduire ; le panneau démo permet de les couper.

| Moment | Mouvement | Ressort |
| --- | --- | --- |
| Entrée des blocs | Montée + fondu, cascade 60 ms | `spring.gentle` |
| Éléa écoute / réfléchit / parle | États de la mascotte (#33) ou orbe (Classique, dépréciée) | CSS |
| « Noté dans… » | Vol vers la dimension | `spring.travel` |
| Appui | Enfoncement vers l'ombre | tokens `--press-*` |

Règles : jamais plus de 450 ms pour une transition d'interface ; rien ne bouge pendant la lecture d'un texte.

## 6. Signature : mascotte Éléa

Composant `Elephant` : tête d'éléphant (SVG de `docs/brand/elephant/`), états `idle | listening | thinking | speaking`. Variante CSS (détaillée / simplifiée ≤ 32 px / classique). Micro option 1 (pastille) ou 2 (sous la trompe). `Orb` reste disponible, dépréciée.

## 7. Composants

Chaque composant vit dans `src/ui/{Nom}/` avec `Nom.tsx`, `Nom.module.css` et une entrée dans la vitrine. La vitrine permet de basculer Vivant / Classique.

Voir le tableau historique des composants dans le dépôt ; les nouveautés (#33) s'ajoutent ici au fil des tickets.

### ActionDock

Quand le moteur attend un événement de bloc, les actions principales restent accessibles sur mobile via `ActionDock`.

### DocumentCard

Carte d'un document de l'entreprise (#41) : icône de fichier, type, nom, sujet traité rattaché (« Sans sujet » sinon), date, source (Import, Gmail, Drive, Outlook) et nombre de constats tirés. Variantes `default` (avec résumé) et `compact` (recherche, page d'un sujet). La zone principale devient un bouton avec `onOpen` ; l'emplacement `actions` accueille le rattachement ou le détachement (jamais un bouton imbriqué dans la zone principale). `subjectNode` remplace le libellé du sujet, par exemple par un lien vers sa page (à n'utiliser que sans `onOpen`, pour ne pas imbriquer un lien dans un bouton).

## 8. Accessibilité

- Contrastes de la section 2. Focus visible (`--ring-focus`).
- Toute action accessible au clavier.
- La présence d'Éléa a un libellé vocal d'état.
- Les jauges ont `aria-valuenow`.
- Le mode voix a toujours une alternative texte.

## 9. Variantes à comparer

- **Accueil** : A / B / C (`?v=`)
- **Menu** : A barre basse, B radial
- **Recherche** : A filtres, B carte des sujets

Le détail est dans les tickets correspondants.
