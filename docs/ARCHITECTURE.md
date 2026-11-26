# Architecture technique du prototype

## 1. Principe

Le prototype imite le futur produit : **un modèle produit des données structurées, l'interface les affiche**. Ici, le modèle est remplacé par un **moteur de scénario** qui rejoue des fichiers JSON. Le code d'interface ne sait rien du bureau d'études : il sait seulement afficher des blocs et mettre à jour une mémoire.

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
  | { kind: "input"; simulated: string; next: string; quickRoutes?: Record<string, string> }
  | { kind: "choice"; blockId: string; routes: Record<string, string> }
  | { kind: "connector"; blockId: string; onConnect: string; onConnectGoogle?: string; onSkip: string }
  | { kind: "upload"; blockId: string; onUpload: string; onSkip: string }
  | { kind: "form"; blockId: string; next: string }
  | { kind: "auth"; next: string }
  | { kind: "plan"; blockId: string; next: string }; // démarrage d'un plan (événement "start")
```

Règles du moteur :
- **Saisie libre** : en mode voix, le moteur joue la transcription `simulated` mot à mot ; en mode texte, le champ est prérempli avec `simulated` en suggestion, mais l'utilisateur peut taper ce qu'il veut. Dans tous les cas, le scénario continue sur `next`.
- **Réponses rapides** (« Je ne sais pas », « Passer ») : par défaut, même étape que `next`. Si `quickRoutes` est fourni, l'id de la réponse rapide peut mener à une autre étape (ex. noter « à vérifier » avant de continuer).
- **Préférence de saisie du composer** : à chaque nouvelle question d'un besoin, le composer revient en mode voix, sauf si l'utilisateur a choisi le texte dans ce besoin (il reste alors en texte jusqu'à ce qu'il repasse en voix ou que le besoin se termine).
- **Choix avec `allowFreeInput`** : le composer reste disponible (hint + voix/texte) ; le bouton de confirmation reste dans le bloc (pas d'ActionDock) pour ne pas masquer la saisie libre.
- **Analyse → résultat** : l'orbe 96 px passe en état `done` (coche) ; le bloc suivant peut reprendre la présence via `layoutId: "elea-presence"` et un `eyebrow`.
- **Échos dans le fil** : une saisie libre et une réponse rapide s'affichent comme une parole de l'utilisateur. Un événement de bloc (`choice`, `connector`, `auth`, `upload`, `plan`) ne crée pas d'écho « Vous : … » pour la décision : le bloc se réduit en résumé compact (docs/BLOCKS.md §7). Une saisie libre sous un `choice` peut garder un écho des mots de l'utilisateur, en plus du résumé.
- **Délais** : chaque étape d'Éléa attend `delayMs` (défaut 600 ms) avec l'orbe en état « réfléchit », puis les blocs entrent en cascade.
- **Effets idempotents** : rejouer une étape ne duplique rien (identifiants stables).
- **Reset** : le panneau démo remet la mémoire à son état initial et relance le scénario.

**Lancer un besoin depuis le composer.** Sans vrai modèle, le composer doit deviner quel scénario jouer. L'aiguillage lit `engine/routes.json` (mots-clés → scénario) via `routeUtterance` ; la comparaison ignore accents et casse. Les jetons de suggestion de l'accueil passent par le même chemin. Une saisie non reconnue affiche un callout avec les trois exemples du fichier de routes.

**Les fichiers de scénario** sont listés dans `apps/web/src/scenarios/index.json`, avec la mémoire de départ (preset) adaptée :
- `memory-first-visit.json` : premier lancement, avant l'onboarding ;
- `memory-returning.json` : trois semaines plus tard (16 décembre 2026), pour l'accueil quotidien, la recherche, les questions et les informations.

## 4. La mémoire (`apps/web/src/memory`)

Un store `zustand`, persisté en `localStorage` pour survivre au rechargement.

```ts
type Memory = {
  company: Company;              // nom, secteur, ville, effectif, ancienneté
  owner: Owner;                  // prénom, rôle
  dimensions: Dimension[];       // Mon activité, Mes finances, Mon profil, Mes priorités (standard)
  subjects: Subject[];           // sujets traités : problématiques travaillées avec Éléa
  findings: Finding[];
  documents: EleaDocument[];     // documents de l'entreprise (page /documents), rattachables à un sujet
  sources: Source[];             // Gmail, Outlook, Drive, Documents déposés
  plans: Plan[];                 // schéma dans docs/BLOCKS.md
  attention: Attention[];        // ce que l'accueil met en avant aujourd'hui
  today: string;                 // date fictive de la démo (ISO), jamais la date système
  account: { created: boolean; method?: "google" | "apple" | "email" };
  home?: {                       // phrases d'Éléa pour l'accueil (preset returning)
    summary: string;             // synthèse variante B / phrase variante C
    suggestions: { id: string; label: string; scenarioId: string }[];
  };
};

type Attention = {
  id: string;
  kind: "plan-step" | "finding";
  title: string;
  text: string;
  due: string | null;
  planId?: string; stepId?: string; findingId?: string;
};

type Dimension = {
  id: string;
  label: string;
  icon: string;
  tone: "icy" | "teal" | "cherry" | "bronze";
  progress: number;
  status: "todo" | "active" | "enough";
  summary: string;
  gaps?: { id: string; question: string; scenarioId?: string }[]; // « Ce qui manque »
};

type Subject = {
  id: string;
  title: string;
  icon: string;
  status: "active" | "paused" | "resolved";
  openedAt: string;
  lastExchangeAt: string;
  scenarioIds: string[];
  planIds: string[];
  summary: string;               // une phrase : où on en est
};

type Finding = {
  id: string;
  type: "answer" | "fact" | "decision" | "plan" | "document" | "action";
  dimensionId: string;           // obligatoire
  subjectId?: string;            // sujet traité, s'il y a lieu
  title: string;
  summary: string;
  createdAt: string;             // ISO, dates fictives cohérentes
  origin: "conversation" | "document" | "gmail" | "drive";
  confidence?: "confirmed" | "estimated" | "to-check";
  scenarioId?: string;           // besoin d'origine, pour le rouvrir
  body?: Block[];                // contenu détaillé, affiché par le même BlockRenderer
};

type EleaDocument = {
  id: string;
  title: string;                 // nom du fichier
  kind: "facture" | "devis" | "contrat" | "releve" | "heures" | "autre";
  origin: "import" | "gmail" | "drive" | "outlook";
  addedAt: string;               // ISO datetime
  subjectId?: string;            // sujet traité rattaché (ou détaché : absent)
  findingIds: string[];          // constats tirés du document
  summary?: string;
};
```

Effets associés : `{ kind: "document", document }` (création ou fusion par `id`) et `{ kind: "update-document", documentId, patch }` (rattachement, détachement). Le scénario `add-document` joue le dépôt, la lecture, les « Noté dans… » puis le choix du sujet. La page `/documents` (liste, filtres type, source, sujet, période) et la page d'un sujet rattachent ou détachent via `patchDocument`.

Les écrans Accueil, Mon entreprise, sujet traité, Plans et Recherche **ne lisent que la mémoire**. Ils n'ont aucune donnée en dur.

## 5. Navigation et mise en page

Pas de liste de conversations. Quatre destinations, plus une porte d'entrée toujours visible :

| Destination | Contenu |
| --- | --- |
| **Aujourd'hui** | Accueil hors besoin : ce qui demande attention, plan en cours, derniers findings, suggestions |
| **Mon entreprise** | Les dimensions, les sujets et leurs findings, les documents, les sources connectées |
| **Plans** | Les plans en cours et terminés, avec leurs étapes |
| **Recherche** | Retrouver n'importe quel finding (texte ou voix) |
| **Demander** (composer) | La porte d'entrée unique : voix, texte, dépôt de document |

Un **besoin en cours** s'ouvre par-dessus la navigation (feuille plein écran sur mobile, colonne centrale sur ordinateur). Fermer un besoin le range : ses findings restent dans la mémoire, et il est rouvrable depuis le finding.

| Largeur | Mise en page |
| --- | --- |
| < 640 px (mobile) | Une colonne, barre de navigation basse, composer flottant, besoin en feuille plein écran |
| 640 à 1023 px (tablette) | Rail de navigation à gauche, contenu sur une colonne large, panneau de détail en feuille latérale |
| ≥ 1024 px (ordinateur) | Trois colonnes : navigation et sujets, besoin ou écran principal, panneau de détail (finding, plan, document) |

**Panneau de détail (colonne droite, ≥ 1024 px).** Quand un finding, un plan ou un élément d'attention est ouvert, la colonne affiche ce détail (fermable). Quand rien n'est ouvert, elle n'est pas un vide : elle montre un **contexte utile** lu dans la mémoire (plan actif et ses étapes, sources connectées). Si la mémoire n'a ni plan ni source (premier lancement), la colonne se replie et la colonne centrale s'élargit. Sur tablette, le détail reste une feuille latérale (ouverte seulement sur demande).

**Porte d'entrée (composer).** Sur mobile, la barre basse (menu A) ou l'orbe micro (menu B) ouvre le composer. Sur tablette et ordinateur, le composer reste visible dans la colonne centrale (ancré en bas de l'accueil). Un seul point d'entrée voix à la fois : sur l'accueil variante C, le bouton micro de la barre basse est masqué ; en menu B, l'orbe de présence porte aussi la voix et le menu.

**Menu B.** Une seule orbe : celle du micro (composer, présence C, ou orbe de secours hors accueil/besoin). Appui court = parler ; glisser vers le haut ou appui long = ouvrir l'arc de navigation. Pas d'orbe flottante séparée quand un micro est déjà à l'écran.

**Hauteur réservée à la navigation basse.** `--nav-offset` (hauteur de la barre, ou de l'orbe de secours + zone de sécurité) est appliqué en `padding-bottom` du contenu mobile hors besoin.

**Pastille de variantes (≥ 1024 px).** Sur les écrans qui en ont (accueil, retrouver), une pastille discrète en bas à droite permet de changer de variante sans ouvrir le panneau démo. Un réglage du panneau démo la masque pour les démonstrations.

**Barre d'actions (`ActionDock`).** Sur mobile, quand l'`await` attend un événement de bloc (`choice`, `connector`, `upload`, `auth`, `form`, `plan`) et non une saisie libre, le composer cède la place à une barre collante qui affiche les actions du bloc actif (portail React depuis le bloc, sans duplication). Sur tablette et ordinateur, les actions restent dans le fil. Voir `DESIGN.md`, composant `ActionDock`.

**Variables d'étape.** Une réponse peut enrichir le contexte du moteur (`provider`, `providerLabel`, `fileCount`, `fileCountLabel`…). Les jetons `{{nom}}` sont remplacés à la fois dans les **effets** et dans les **blocs** de l'étape suivante (titre, texte, consentement…). Ainsi un écran d'auth peut nommer le fournisseur choisi, et une extraction peut annoncer le bon nombre de documents déposés, sans texte codé en dur.

Jetons courants :
- `{{provider}}` / `{{providerLabel}}` : fournisseur connecté (gmail, Outlook…)
- `{{fileCount}}` : nombre de fichiers déposés (chiffre)
- `{{fileCountLabel}}` : libellé accordé (« 1 document », « 3 documents »)
- `{{planId}}` : plan choisi (id en mémoire)
- `{{planTitle}}` : titre du plan
- `{{planFirstStep}}` : titre de la première étape
- `{{planStepCount}}` / `{{planStepCountLabel}}` : nombre d'étapes (« 4 étapes »)

Quand `planId` est posé (choix de plan), le moteur enrichit automatiquement les jetons à partir de la mémoire. Ils sont rafraîchis à l'entrée de chaque étape (utile après édition des dates ou de l'ordre).

**Auth déjà faite.** Si l'étape attend un `await.kind === "auth"` et que `account.created` est vrai en mémoire (compte créé plus tôt, p.ex. au connecteur), le moteur saute l'étape sans afficher le bloc.

Routes (`react-router`) : `/`, `/entreprise`, `/entreprise/dimension/:dimensionId`, `/sujet/:subjectId` (redirection depuis `/entreprise/:subjectId`), `/profil`, `/documents` (`?doc=` met un document en avant), `/plans`, `/plans/:planId`, `/recherche`, `/besoin/:scenarioId`, `/finding/:findingId`. Le paramètre `?v=a|b|c` choisit la variante de l'accueil ; `?menu=a|b` le menu mobile ; `?find=a|b` la variante Recherche (liste ou tuiles). Les choix du panneau démo sont persistés et utilisés en l'absence de paramètre d'URL.

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
- sauter à une étape (pour les démos) ;
- masquer la pastille de variantes ;
- choisir un appareil (ordinateur, téléphone, tablette) sur écran ≥ 1024 px.

### Émulateur d'appareil

Sur ordinateur (≥ 1024 px), le panneau peut afficher le prototype dans un cadre téléphone (390 × 844) ou tablette (820 × 1180), pour de vraies media queries mobiles.

**Iframe de même origine.** La page hôte (`device !== desktop`) n'affiche que le fond, le `DeviceFrame` et le panneau démo. Le prototype tourne dans une iframe `/?frame=1` (avec `safeTop` / `safeBottom`). Dans l'iframe : panneau démo et pastille de variantes masqués. C'est la seule façon d'avoir la mise en page mobile réelle (barre basse, ActionDock, feuilles).

**Mode cadre.** `isFrameMode()` = `window.self !== window.top` uniquement. Pas de clé `sessionStorage` : le stockage de session est partagé entre l'hôte et une iframe de même origine, ce qui faisait basculer l'hôte en « cadré ».

**Pilotage.** Les stores vivent dans l'iframe. L'hôte envoie des commandes ciblées via `postMessage` à `iframe.contentWindow` (origine exacte ; protocole typé dans `demo/bridge.ts`) : `reset`, `start`, `jumpTo`, `navigate`, `set*`, `sync`. L'iframe n'accepte que les messages de `window.parent` de la même origine. Au démarrage (et après chaque rechargement), l'iframe envoie `ready` ; l'hôte répond par `sync` avec l'état courant du panneau (source de vérité). Dans l'iframe, le store démo ne persiste pas dans `localStorage` (partagé avec l'hôte) : le panneau pilote via `sync`. Le choix d'appareil et l'orientation sont persistés côté hôte uniquement.

**Zones de sécurité.** `env(safe-area-inset-*)` vaut 0 dans une iframe. L'iframe pose `--safe-top` et `--safe-bottom` en mémoire (URL initiale, puis `sync`) : pas de `sessionStorage`. Les composants utilisent `max(env(safe-area-inset-bottom, 0px), var(--safe-bottom, 0px))` (idem pour le haut).

**Échelle.** Si la fenêtre est trop basse, la tablette (et éventuellement le téléphone) est mise à l'échelle (affichée dans le panneau). En dessous de 60 %, un message invite à agrandir la fenêtre.

## 8. Évolutions prévues (hors prototype)

- Remplacer le moteur par un agent réel qui renvoie des blocs (même schéma), avec un harness existant pour la longue conversation, la compaction, le cache de prompt et la gestion de la mémoire (exigence de Lélio : ne pas réinventer la roue).
- Connecteurs réels (OAuth Gmail, Outlook, Drive), extraction OCR des factures.
- Lien partageable (Vercel ou Netlify) pour les tests avec un design partner.
