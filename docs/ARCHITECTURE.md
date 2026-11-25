# Architecture technique du prototype

## 1. Principe

Le prototype imite le futur produit : **un modèle produit des données structurées, l'interface les affiche**. Ici, le modèle est remplacé par un **moteur de scénario** qui rejoue des fichiers JSON. Le code d'interface ne sait rien de la pâtisserie : il sait seulement afficher des blocs et mettre à jour une mémoire.

```
 Saisie (voix, texte, choix, dépôt)
        │
        ▼
 ┌─────────────────┐   étapes JSON   ┌──────────────────────┐
 │ Moteur scénario │◄────────────────│ scenarios/*.json      │
 │ (engine)        │                 └──────────────────────┘
 └───────┬─────────┘
         │ blocs à afficher + effets
         ▼
 ┌─────────────────┐      effets     ┌──────────────────────┐
 │ Fil du besoin   │────────────────►│ Mémoire (store)      │
 │ (BlockRenderer) │                 │ dimensions, sujets,  │
 └─────────────────┘                 │ findings, sources,   │
                                     │ plans                │
                                     └──────────┬───────────┘
                                                │ lue par
                                                ▼
                          Accueil, Mon entreprise, Plans, Recherche
```

Quand on branchera un vrai modèle, seul le moteur change : il recevra les blocs d'un agent au lieu d'un fichier. Le schéma des blocs (`docs/BLOCKS.md`) est le contrat entre les deux.

## 2. Organisation du dépôt

```
assistant-pme/
├── AGENTS.md
├── package.json                  workspaces + scripts racine
├── docs/
│   ├── VISION.md
│   ├── ARCHITECTURE.md           ce fichier
│   ├── BLOCKS.md                 catalogue et schéma des blocs
│   ├── figma-parcours/           maquettes de départ
│   └── trancript-seance-23nov-lelio.txt
├── tickets/                      règles et tickets (non versionné)
└── apps/
    ├── design-system/
    │   ├── DESIGN.md
    │   ├── src/styles/tokens.css  couleurs, typo, espacements, mouvement
    │   ├── src/styles/base.css    reset, polices, styles globaux
    │   ├── src/ui/                composants (un dossier par composant)
    │   ├── src/motion/            ressorts et variantes d'animation partagés
    │   └── src/showcase/          vitrine (npm run ds)
    └── web/
        └── src/
            ├── app/               routes, layout responsive, providers
            ├── shell/             navigation (barre basse, rail, colonnes)
            ├── composer/          porte d'entrée unique voix / texte / dépôt
            ├── blocks/            un rendu par type de bloc + BlockRenderer
            ├── engine/            moteur de scénario, types, effets
            ├── memory/            store zustand + sélecteurs
            ├── screens/           Accueil, Mon entreprise, Sujet, Plans, Sources, Recherche
            ├── scenarios/         JSON des scénarios + données initiales
            └── demo/              panneau démo (variantes, reset, animations)
```

Le web importe le design system par alias (`@elea/ds`). Un composant générique va dans le design system ; un composant qui connaît le moteur ou la mémoire va dans `apps/web`.

## 3. Le moteur de scénario (`apps/web/src/engine`)

Un **scénario** est un graphe d'étapes. Chaque étape :
- affiche une liste de blocs (le « tour » d'Éléa) ;
- applique des **effets** sur la mémoire (noter une information, créer un finding, avancer une jauge, connecter une source, créer un plan) ;
- attend éventuellement une **saisie** et choisit l'étape suivante selon la réponse.

```ts
type Scenario = {
  id: string;                 // "onboarding", "ask-contract", ...
  intent: Intent;             // "onboarding" | "solve" | "ask" | "inform" | "find"
  title: string;              // titre du besoin, affiché en tête
  userUtterance?: string;     // ce que l'utilisateur a dit pour lancer le besoin (hors onboarding)
  start: string;              // id de la première étape
  steps: Record<string, Step>;
};

type Step = {
  blocks: Block[];            // ce qu'Éléa affiche (docs/BLOCKS.md)
  effects?: Effect[];         // appliqués à l'entrée de l'étape
  delayMs?: number;           // temps de « réflexion » simulé avant affichage
  await?: Await;              // saisie attendue ; absent = étape suivante automatique
  next?: string;              // étape suivante si pas d'await
};

type Await =
  | { kind: "input"; simulated: string; next: string }       // voix ou texte libre
  | { kind: "choice"; blockId: string; routes: Record<string, string> }
  | { kind: "connector"; blockId: string; onConnect: string; onSkip: string }
  | { kind: "upload"; blockId: string; onUpload: string; onSkip: string }
  | { kind: "form"; blockId: string; next: string }
  | { kind: "auth"; next: string };
```

Règles du moteur :
- **Saisie libre** : en mode voix, le moteur joue la transcription `simulated` mot à mot ; en mode texte, le champ est prérempli avec `simulated` en suggestion, mais l'utilisateur peut taper ce qu'il veut. Dans tous les cas, le scénario continue sur `next`.
- **Réponses rapides** (« Je ne sais pas », « Changer de sujet ») : routées comme un choix.
- **Délais** : chaque étape d'Éléa attend `delayMs` (défaut 600 ms) avec l'orbe en état « réfléchit », puis les blocs entrent en cascade.
- **Effets idempotents** : rejouer une étape ne duplique rien (identifiants stables).
- **Reset** : le panneau démo remet la mémoire à son état initial et relance le scénario.

**Lancer un besoin depuis le composer.** Sans vrai modèle, le composer doit deviner quel scénario jouer. Le prototype utilise un aiguillage simple (`engine/router.ts`) : mots-clés vers scénario (« CDD », « CDI », « embaucher » : `ask-contract` ; « payé », « réglé » : `inform-payment` ; « qu'avait-on dit », « retrouver », « bûche » : `find-buches`). Les suggestions de l'accueil lancent directement le scénario voulu. Une saisie non reconnue affiche un bloc `callout` qui propose les besoins disponibles.

**Les fichiers de scénario** sont listés dans `apps/web/src/scenarios/index.json`, avec la mémoire de départ (preset) adaptée :
- `memory-first-visit.json` : premier lancement, avant l'onboarding ;
- `memory-returning.json` : trois semaines plus tard (16 décembre 2026), pour l'accueil quotidien, la recherche, les questions et les informations.

## 4. La mémoire (`apps/web/src/memory`)

Un store `zustand`, persisté en `localStorage` pour survivre au rechargement.

```ts
type Memory = {
  company: Company;              // nom, secteur, ville, effectif, ancienneté
  owner: Owner;                  // prénom, rôle
  dimensions: Dimension[];       // Mon activité, Mes finances, Mon profil, Mes priorités
  topics: Topic[];               // Finances, Clients, Équipe, Production, Juridique...
  findings: Finding[];
  sources: Source[];             // Gmail, Outlook, Drive, Documents déposés
  plans: Plan[];                 // schéma dans docs/BLOCKS.md
  attention: Attention[];        // ce que l'accueil met en avant aujourd'hui
  today: string;                 // date fictive de la démo (ISO), jamais la date système
  account: { created: boolean; method?: "google" | "apple" | "email" };
};

type Attention = {
  id: string;
  kind: "plan-step" | "finding";
  title: string;
  text: string;
  due: string | null;
  planId?: string; stepId?: string; findingId?: string;
};

type Finding = {
  id: string;
  type: "answer" | "fact" | "decision" | "plan" | "document" | "action";
  topicId: string;
  title: string;
  summary: string;
  createdAt: string;             // ISO, dates fictives cohérentes
  origin: "conversation" | "document" | "gmail" | "drive";
  confidence?: "confirmed" | "estimated" | "to-check";
  scenarioId?: string;           // besoin d'origine, pour le rouvrir
  body?: Block[];                // contenu détaillé, affiché par le même BlockRenderer
};
```

Les écrans Accueil, Mon entreprise, Sujet, Plans et Recherche **ne lisent que la mémoire**. Ils n'ont aucune donnée en dur.

## 5. Navigation et mise en page

Pas de liste de conversations. Quatre destinations, plus une porte d'entrée toujours visible :

| Destination | Contenu |
| --- | --- |
| **Aujourd'hui** | Accueil hors besoin : ce qui demande attention, plan en cours, derniers findings, suggestions |
| **Mon entreprise** | Les dimensions, les sujets et leurs findings, les sources connectées |
| **Plans** | Les plans en cours et terminés, avec leurs étapes |
| **Recherche** | Retrouver n'importe quel finding (texte ou voix) |
| **Demander** (composer) | La porte d'entrée unique : voix, texte, dépôt de document |

Un **besoin en cours** s'ouvre par-dessus la navigation (feuille plein écran sur mobile, colonne centrale sur ordinateur). Fermer un besoin le range : ses findings restent dans la mémoire, et il est rouvrable depuis le finding.

| Largeur | Mise en page |
| --- | --- |
| < 640 px (mobile) | Une colonne, barre de navigation basse, composer flottant, besoin en feuille plein écran |
| 640 à 1023 px (tablette) | Rail de navigation à gauche, contenu sur une colonne large, panneau de détail en feuille latérale |
| ≥ 1024 px (ordinateur) | Trois colonnes : navigation et sujets, besoin ou écran principal, panneau de détail (finding, plan, document) |

Routes (`react-router`) : `/`, `/entreprise`, `/entreprise/:topicId`, `/plans`, `/plans/:planId`, `/recherche`, `/besoin/:scenarioId`, `/finding/:findingId`. Le paramètre `?v=a|b|c` choisit la variante des écrans qui en ont.

## 6. Mouvement

- Bibliothèque `motion`. Les ressorts et durées sont des tokens (`apps/design-system/src/motion`).
- `layoutId` partagé pour les éléments qui voyagent : l'étiquette « Noté dans… » vole vers la carte de sa dimension ; une carte de finding s'agrandit en panneau de détail.
- `AnimatePresence` pour les entrées et sorties de blocs ; entrée en cascade de 60 ms entre blocs.
- Les animations restent actives par défaut, même si le système demande de les réduire. Un interrupteur du panneau démo les coupe (`MotionConfig reducedMotion="always"`).

## 7. Panneau démo (`apps/web/src/demo`)

Caché derrière un raccourci (`Shift + D`) ou un appui long sur le logo :
- relancer un scénario depuis le début, réinitialiser la mémoire ;
- passer d'une variante à l'autre (accueil, menu, retrouver) ;
- couper les animations ;
- sauter à une étape (pour les démos).

## 8. Évolutions prévues (hors prototype)

- Remplacer le moteur par un agent réel qui renvoie des blocs (même schéma), avec un harness existant pour la longue conversation, la compaction, le cache de prompt et la gestion de la mémoire (exigence de Lélio : ne pas réinventer la roue).
- Connecteurs réels (OAuth Gmail, Outlook, Drive), extraction OCR des factures.
- Lien partageable (Vercel ou Netlify) pour les tests avec un design partner.
