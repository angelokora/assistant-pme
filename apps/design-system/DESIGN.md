# Éléa : design system

Source de vérité pour toute interface du prototype. Les valeurs sont dans `src/styles/tokens.css` et `src/motion/springs.ts`. Un composant ou un motif absent d'ici doit y être ajouté **avant** d'être utilisé dans une fonctionnalité (voir `tickets/README.md`, section Design system).

## 1. Direction : l'atelier vivant

Éléa n'est pas un tableau de bord ni un chat. C'est le **carnet d'un conseiller** : chaleureux, posé, qui écoute, note et range sous les yeux du dirigeant.

Cinq principes :

1. **Une voix, pas une machine.** Les questions et les titres d'Éléa sont en serif (Fraunces), comme une parole. L'interface autour est en sans-serif discret.
2. **La mémoire se voit.** Chaque fois qu'Éléa retient quelque chose, un mouvement le montre (« Noté dans… » qui rejoint sa case, jauge qui se remplit). C'est la promesse de l'éléphant.
3. **Un geste, une animation, une raison.** Aucune animation décorative. Chacune dit : j'écoute, je réfléchis, j'ai noté, c'est rangé, c'est à vous.
4. **Le papier, pas l'écran.** Fond papier chaud, encre profonde, cartes blanches légèrement levées. Pas de dégradés criards, pas de verre dépoli, pas de violet générique.
5. **Calme sur mobile, dense sur ordinateur.** Une chose à la fois sur téléphone ; sur ordinateur, le contexte (sujets, détail) reste visible autour du besoin.

À éviter : Inter, les dégradés violets, les cartes à bordure colorée sur un seul côté, les emojis dans l'interface, les ombres grises froides, les rayons identiques partout, les textes centrés en série.

## 2. Couleurs

### Rôles

| Rôle | Token | Couleur | Usage |
| --- | --- | --- | --- |
| Texte | `--color-text` | Ink Black `#011627` | Tout le texte principal |
| Texte secondaire | `--color-text-muted` | `#5b6875` | Sous-titres, métadonnées |
| Fond | `--color-bg` | Papier `#fbf8f3` | Fond de l'app |
| Surface | `--color-surface` | Blanc | Cartes, feuilles |
| Action | `--color-action` | Teal `#087e8b` | Boutons principaux, liens, progrès, validé |
| Présence | `--color-presence` | Cherry Rose `#a30b37` | L'orbe, la voix, l'écoute. **Jamais** pour un bouton standard |
| Mémoire | `--color-memory` | Light Bronze `#dda77b` | « Noté dans… », ce qu'Éléa retient. **Fonds uniquement** |
| Information | `--color-info` | Icy Blue `#b1ddf1` | Sources, documents, informations. **Fonds uniquement** |

### Contrastes vérifiés (WCAG 2.1, AA = 4,5 pour le texte courant, 3 pour le grand texte et les icônes)

| Paire | Contraste | Verdict |
| --- | --- | --- |
| Ink sur papier | 17,3 | AAA |
| Texte secondaire `#5b6875` sur papier | 5,4 | AA |
| Texte secondaire sur les fonds teintés | 4,8 à 5,1 | AA |
| Blanc sur Teal (bouton) | 4,8 | AA |
| Teal `#087e8b` sur papier | 4,5 | AA (limite) : préférer `--teal-600` pour le petit texte |
| `--teal-600` `#066a75` sur fonds teintés | 5,3 à 6,0 | AA |
| Cherry sur papier | 7,5 | AAA |
| `--bronze-700` `#8a5a2b` sur fonds teintés | 4,9 à 5,5 | AA |
| Ink sur Bronze | 8,6 | AAA |
| Ink sur Icy | 12,6 | AAA |
| Bronze ou Icy en texte sur clair | 1,5 à 2,1 | **Interdit** |
| Cherry sur Teal | 1,6 | **Interdit** (ne jamais juxtaposer) |

### Règles

- Bronze et Icy ne portent jamais de texte : ce sont des surfaces. Le texte posé dessus est Ink ou leur version 700.
- Le rouge Cherry évoque une perte dans un contexte de gestion. Il est réservé à la présence d'Éléa. Les erreurs utilisent `--color-danger` **avec une icône et un texte explicite**, jamais la couleur seule.
- Une donnée chiffrée positive ou négative ne se signale jamais par la couleur seule (flèche, signe, libellé).

## 3. Typographie

| Usage | Police | Taille | Graisse |
| --- | --- | --- | --- |
| Question d'Éléa | Fraunces | `--text-2xl` (28) mobile, 32 à 36 desktop | 500, `--voice-variation` |
| Titre d'écran | Fraunces | `--text-xl` à `--text-3xl` | 500 |
| Phrase d'Éléa (`lead`) | Instrument Sans | `--text-md` | 500, couleur muted |
| Titre de carte | Instrument Sans | `--text-lg` | 600 |
| Texte courant | Instrument Sans | `--text-md` | 400 |
| Métadonnées, eyebrow | Instrument Sans | `--text-xs`, capitales, `--tracking-eyebrow` | 600 |
| Montants | Instrument Sans | selon contexte | `font-variant-numeric: tabular-nums` |

- Les montants s'écrivent à la française : `58 000 €` (espace fine insécable avant €, espace insécable des milliers).
- Pas plus de deux niveaux de titre dans un même bloc.

## 4. Espace, forme, profondeur

- Grille de 4 px. Marges d'écran : 20 px mobile, 32 px tablette, 40 px desktop.
- Rayons : `--radius-md` pour les cartes, `--radius-lg` pour les feuilles, `--radius-full` pour les puces et boutons ronds. Les cartes imbriquées ont un rayon plus petit que leur parent.
- Profondeur : le papier est au niveau 0, les cartes au niveau 1 (`--shadow-1` + bordure `--color-border`), les éléments flottants (composer, feuilles) au niveau 3.
- Cible tactile minimale : 44 × 44 px.

## 5. Mouvement

L'interface doit être **vivante** : c'est une exigence produit. Les animations restent actives même si le système demande de les réduire ; le panneau démo permet de les couper.

| Moment | Mouvement | Ressort |
| --- | --- | --- |
| Entrée des blocs d'un tour | Montée de 14 px + fondu + flou qui se dissipe, cascade de 60 ms | `spring.gentle` |
| Éléa réfléchit | L'orbe se contracte et tourne lentement, halo qui pulse | CSS, `--dur-breath` |
| Éléa écoute | L'orbe s'étire selon le volume, waveform sous la transcription | motion, valeurs simulées |
| Mot transcrit | Chaque mot apparaît avec un fondu de 120 ms | CSS |
| « Noté dans… » | L'étiquette apparaît, puis vole vers sa carte de dimension (`layoutId`) ; la jauge se remplit ; la carte « pulse » une fois | `spring.travel`, `spring.gauge` |
| Étape d'analyse | Spinner en arc, puis coche qui se dessine (`pathLength`) | `spring.snappy` |
| Choix d'une option | La carte s'élève, le bouton radio se remplit, les autres s'estompent légèrement | `spring.snappy` |
| Ouverture d'un finding | La carte s'agrandit en panneau de détail (`layoutId`) | `spring.sheet` |
| Bascule voix / texte | Le bouton micro se transforme en champ texte (morphing de forme) | `spring.gentle` |
| Pression | Échelle 0,97 | `spring.snappy` |

Règles : jamais plus de 450 ms pour une transition d'interface ; aucune animation en boucle hors de l'orbe ; rien ne bouge pendant la lecture d'un texte.

## 6. Signature : l'orbe de présence

L'orbe est le seul élément qui représente Éléa. Dégradé `--gradient-presence`, forme organique légèrement irrégulière (pas un cercle parfait), ombre `--shadow-presence`.

| État | Comportement |
| --- | --- |
| `idle` | Respiration lente (échelle 1 à 1,04, 3,2 s) |
| `listening` | Déformation réactive au volume, halo Cherry doux |
| `thinking` | Contraction, rotation lente du dégradé |
| `speaking` | Pulsations courtes au rythme du texte qui apparaît |
| `done` | Un battement, puis retour au repos |

Tailles : 20 px (devant une phrase d'Éléa), 56 px (composer), 96 px (accueil, analyse).

## 7. Composants

Chaque composant vit dans `src/ui/{Nom}/` avec `Nom.tsx`, `Nom.module.css` et une entrée dans la vitrine. Liste de départ :

| Composant | Rôle | États |
| --- | --- | --- |
| `Orb` | Présence d'Éléa | idle, listening, thinking, speaking, done |
| `Button` | Action | primary (teal), secondary (contour), ghost, danger ; tailles sm, md, lg ; loading |
| `IconButton` | Action icône seule | default, active ; libellé accessible obligatoire |
| `Chip` | Réponse rapide, filtre | default, selected, disabled |
| `Card` | Surface de base | default, interactive (hover, press), selected |
| `Gauge` | Jauge de progression | todo, active, enough |
| `DimensionCard` | Carte de dimension (icône, titre, résumé, jauge, statut) | todo, active, enough ; compact |
| `NotedTag` | « Noté dans… » + Modifier | default, editing |
| `ChoiceCard` | Option sélectionnable avec badge recommandé | default, selected, recommended |
| `StepList` | Étapes (analyse, plan) | pending, active, done |
| `Sheet` | Feuille du bas (mobile), panneau latéral (desktop) | ouverte, fermée |
| `Waveform` | Visualisation de la voix | active, idle |
| `TranscriptText` | Texte transcrit mot à mot | streaming, done |
| `ConfidenceBadge` | Confirmé, estimé, à vérifier | 3 variantes |
| `FindingCard` | Carte d'un finding (type, titre, sujet, date) | default, compact, expanded |
| `ProviderLogo` | Gmail, Outlook, Drive, Google, Apple | |
| `ActionDock` | Barre d'actions collante (mobile) | ouverte, fermée |
| `DropZone` | Zone de dépôt de fichiers | idle, survol, disabled |
| `FileTile` | Fichier déposé (miniature, progression) | en cours, fait, erreur |
| `Skeleton` | Chargement | ligne, bloc |
| `Toast` | Confirmation discrète | |

### ActionDock

Quand le moteur attend un événement de bloc (`choice`, `connector`, `upload`, `auth`, `form`, ou `plan` avec démarrage), les actions principales ne doivent pas disparaître sous le pli sur mobile.

- **Mobile (< 640 px)** : les actions du bloc actif sont rendues dans `ActionDock`, à la place du composer, au-dessus de la zone de sécurité iOS. Même entrée animée que le composer (`spring.gentle`). Le bloc garde son contenu dans le fil, sans dupliquer les boutons.
- **Tablette et ordinateur (≥ 640 px)** : les actions restent dans le bloc.
- Le composant design system est purement présentationnel (surface, espacement, accès clavier). Le portail et le branchement au moteur vivent dans `apps/web`.

Les blocs (`docs/BLOCKS.md`) sont construits dans `apps/web` à partir de ces composants.

## 8. Accessibilité

- Contrastes de la section 2. Focus visible partout (`--ring-focus`).
- Toute action est accessible au clavier sur ordinateur.
- L'orbe a un libellé vocal qui décrit l'état (« Éléa vous écoute »).
- Les jauges ont une valeur textuelle (`aria-valuenow`).
- Le mode voix a toujours une alternative texte visible.

## 9. Variantes à comparer

Les écrans suivants existent en plusieurs variantes (`?v=a|b|c`, panneau démo) :
- **Accueil** : A « Fil du jour », B « Carnet », C « Présence ».
- **Menu** : A barre basse, B menu radial autour du composer.
- **Retrouver une information** : A recherche avec filtres par sujet, B carte des sujets.

Le détail de chaque variante est dans le ticket correspondant.
