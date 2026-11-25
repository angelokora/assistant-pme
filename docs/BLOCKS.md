# Catalogue des blocs

Un **bloc** est l'unité d'interface qu'Éléa affiche pendant un besoin. Le modèle (aujourd'hui le moteur de scénario) produit une liste de blocs ; le `BlockRenderer` les affiche. Ce document est le **contrat** entre les deux.

Règles :
- Un bloc ne contient que des données, jamais de logique propre à un cas d'usage.
- Chaque bloc a un `id` stable (pour les animations et les effets) et un `type`.
- Tous les textes sont fournis par le scénario. Le composant n'invente aucun libellé, sauf les libellés d'interface génériques (« Modifier », « Fermer »).
- Un bloc doit s'afficher correctement sur mobile, tablette et ordinateur.
- Le même bloc sert dans un besoin **et** dans le détail d'un finding (`Finding.body`).

```ts
type Block =
  | LeadBlock | QuestionBlock | NotedBlock | DimensionsBlock | AnalysisBlock
  | ChoiceBlock | PlanBlock | ConnectorBlock | UploadBlock | ExtractionBlock
  | AnswerBlock | FormBlock | AuthBlock | FindingRefBlock | SuggestionsBlock
  | CalloutBlock;

type BaseBlock = { id: string; type: string };
```

## 1. Conversation

### `lead` : la phrase d'Éléa
Courte phrase d'introduction, précédée de l'orbe de présence. Ex. : « Commençons par vos charges. »
```ts
type LeadBlock = BaseBlock & { type: "lead"; text: string };
```

### `question` : une question à l'utilisateur
Grande question en typographie de voix (Fraunces). Réponses rapides en puces. La saisie se fait par le composer, qui s'adapte aux `inputModes`.
```ts
type QuestionBlock = BaseBlock & {
  type: "question";
  text: string;
  hint?: string;                                // « Un ordre de grandeur suffit. »
  quickReplies?: { id: string; label: string }[]; // « Je ne sais pas », « Changer de sujet »
  inputModes?: ("voice" | "text")[];            // défaut : les deux, voix en premier
  attachments?: ("document" | "photo")[];       // boutons de dépôt proposés
};
```

Routage : l'`await` de type `input` accepte un `quickRoutes` optionnel (`Record<idRéponse, idÉtape>`). Sans entrée pour l'id, la réponse rapide suit `next` comme une saisie libre. Avec une entrée, le moteur va à l'étape indiquée (ex. noter « à vérifier » puis continuer). Voir `docs/ARCHITECTURE.md`.

### `noted` : « Noté dans… »
Confirme ce qui vient d'être retenu, avec la dimension ou le sujet de destination. **Animation signature** : l'étiquette s'envole vers la carte de sa dimension (`layoutId`), dont la jauge progresse. Bouton « Modifier » qui ouvre une correction en ligne.
```ts
type NotedBlock = BaseBlock & {
  type: "noted";
  target: { kind: "dimension" | "topic"; id: string; label: string }; // « Mes finances »
  text: string;                                   // « Charges : environ 58 000 € par mois »
  confidence?: "confirmed" | "estimated" | "to-check";
  editable?: boolean;
};
```

### `callout` : information de contexte
Encadré sobre pour une précision, un avertissement ou une réassurance.
```ts
type CalloutBlock = BaseBlock & {
  type: "callout";
  tone: "info" | "memory" | "warning" | "success";
  title?: string;
  text: string;
};
```

## 2. Connaissance de l'entreprise

### `dimensions` : les jauges
Grille de cartes (2 × 2 sur mobile, en ligne sur ordinateur). Chaque carte : icône, titre, résumé, jauge, statut. Cliquer ouvre le détail de la dimension. Une carte « En cours » est mise en avant.
```ts
type DimensionsBlock = BaseBlock & {
  type: "dimensions";
  title?: string;                    // « Approfondissons »
  subtitle?: string;
  compact?: boolean;                 // version réduite en tête de fil
  // Les valeurs viennent de la mémoire : le bloc ne liste que les ids à afficher.
  dimensionIds: string[];
};
```

### `analysis` : Éléa réfléchit
Liste d'étapes qui passent de « en attente » à « en cours » (spinner) puis « fait » (coche animée). Orbe 96 px en `thinking`, puis état `done` (l'orbe devient une coche) avec `layoutId` partagé vers le bloc suivant si celui-ci affiche un `eyebrow` de conclusion.
```ts
type AnalysisBlock = BaseBlock & {
  type: "analysis";
  title: string;                                   // « J'analyse ce que vous m'avez dit »
  steps: { id: string; label: string; durationMs: number }[];
};
```

## 3. Décision et action

### `choice` : choisir parmi des options
Options en cartes (`ChoiceCard`), une seule sélectionnable, une recommandée (badge). L'option recommandée est présélectionnée. Bouton de confirmation (ActionDock sur mobile, sauf si `allowFreeInput` : le bouton reste dans le bloc pour laisser le composer accessible). L'écho dans le fil reprend le **titre de l'option**, pas le libellé du bouton.
```ts
type ChoiceBlock = BaseBlock & {
  type: "choice";
  title: string;
  subtitle?: string;
  /** Libellé au-dessus du titre, souvent après une analyse (« Analyse terminée »). */
  eyebrow?: string;
  options: {
    id: string;
    title: string;
    body?: string;
    recommended?: boolean;
    meta?: string;                 // « 3 étapes · 2 semaines »
  }[];
  confirmLabel: string;            // « Commencer par celle-ci »
  allowFreeInput?: boolean;
  /** Hint sous le choix quand allowFreeInput (« Ou dites-moi ce que vous aimeriez traiter »). */
  freeInputHint?: string;
  /** Transcription simulée si l'utilisateur parle plutôt que de confirmer une carte. */
  freeSimulated?: string;
  /**
   * Sur grand écran (≥ 1024 px) : panneau à droite mis à jour à la sélection, sans valider.
   * `"plan"` : l'id de l'option est un `planId` en mémoire ; le panneau montre titre, objectif et étapes.
   * Mobile / tablette : enchaînement normal (confirmation puis étape suivante).
   */
  sideDetail?: "plan";
};
```

### `plan` : un plan d'action
Titre, objectif, étapes avec échéance (dates en français, ex. « jeu. 27 nov. », via `formatDate`).
- `preview` (#17) : lecture seule, bouton de mise en place.
- `editable` (#18) : échéances via `DateField`, réordonnancement (glisser + flèches clavier), bouton « Démarrer le plan » avec célébration sobre puis événement `"start"`.
- `live` (#27) : suivi.
```ts
type PlanBlock = BaseBlock & {
  type: "plan";
  planId: string;                  // le plan vit dans la mémoire (souvent « {{planId}} »)
  mode: "preview" | "editable" | "live";
  startLabel?: string;             // « Mettre en place ce plan » / « Démarrer le plan »
};
```

### `form` : formulaire généré
Champs typés produits par le modèle. Validation simple côté client.
```ts
type FormBlock = BaseBlock & {
  type: "form";
  title?: string;
  fields: {
    id: string;
    label: string;
    kind: "text" | "number" | "currency" | "date" | "select" | "textarea";
    placeholder?: string;
    help?: string;
    options?: { value: string; label: string }[];
    required?: boolean;
    unit?: string;                 // « € / mois »
  }[];
  submitLabel: string;
};
```

## 4. Sources et documents

### `connector` : demander une connexion
Écran de réassurance (exigence de Lélio) : ce qui sera lu, ce qui ne le sera pas, à quoi ça sert, sécurité, et un refus toujours possible sans pénalité. Plusieurs fournisseurs au choix.
```ts
type ConnectorBlock = BaseBlock & {
  type: "connector";
  title: string;                   // « Retrouver vos factures dans vos mails ? »
  why: string;
  providers: ("gmail" | "outlook" | "drive")[];
  willRead: string[];              // « Les factures et relevés reçus »
  willNotRead: string[];           // « Vos échanges personnels »
  reassurance: string[];           // « Lecture seule », « Chiffré », « Révocable à tout moment »
  skipLabel: string;               // « Plus tard »
};
```

### `upload` : déposer des documents
Zone de dépôt (glisser-déposer sur ordinateur, sélection ou photo sur mobile). Les fichiers apparaissent avec une progression.
```ts
type UploadBlock = BaseBlock & {
  type: "upload";
  title: string;                   // « Déposez vos dernières factures »
  why?: string;
  accept: ("pdf" | "image")[];
  examples?: string[];             // « Loyer », « Électricité », « Fournisseurs »
  skipLabel?: string;
};
```

### `extraction` : ce qui a été trouvé dans les documents
Une seule carte contenant une liste compacte : libellé, montant aligné à droite (chiffres tabulaires), source et badge de confiance en seconde ligne. Toucher une ligne ouvre sa correction en place. Total en pied de carte. Animation : les lignes apparaissent une à une comme si elles étaient lues.
```ts
type ExtractionBlock = BaseBlock & {
  type: "extraction";
  title: string;                   // « J'ai trouvé 7 factures »
  items: {
    id: string;
    label: string;                 // « Loyer »
    value: string;                 // « 3 200 € / mois »
    source: string;                // « Facture SCI Bellecour, oct. 2026 »
    confidence: "confirmed" | "estimated" | "to-check";
  }[];
  total?: { label: string; value: string };
};
```

## 5. Réponses et mémoire

### `answer` : réponse à une question
Réponse structurée, pas une bulle de chat : un titre, un résumé en une phrase, des points clés, une recommandation, les sources. Indique dans quel sujet la réponse est rangée.
```ts
type AnswerBlock = BaseBlock & {
  type: "answer";
  title: string;
  summary: string;
  sections?: { heading: string; text: string }[];
  keyPoints?: string[];
  recommendation?: string;
  sources?: { label: string; detail?: string }[];
  savedTo?: { topicId: string; label: string };
};
```

### `finding-ref` : renvoi vers un finding
Carte compacte d'un finding existant (type, titre, date, sujet). Utilisée dans les résultats de recherche et quand Éléa rappelle quelque chose. Cliquer ouvre le détail.
```ts
type FindingRefBlock = BaseBlock & { type: "finding-ref"; findingId: string; reason?: string };
```

### `suggestions` : relances possibles
Puces d'actions suivantes (« Prévoir une relance », « Voir le plan »). Chaque puce lance un scénario ou une navigation.
```ts
type SuggestionsBlock = BaseBlock & {
  type: "suggestions";
  items: { id: string; label: string; action: { kind: "scenario" | "route"; target: string } }[];
};
```

## 6. Compte

### `auth` : créer un compte au bon moment
Rappel de ce que le compte permet de garder (récapitulatif du plan), puis Google, Apple ou e-mail. Simulé. Si `consent` est présent, une feuille de confirmation s'ouvre après le choix de la méthode ; sinon la méthode crée le compte immédiatement. Si le compte existe déjà en mémoire, le moteur saute l'étape (`await.auth.next`).
```ts
type AuthBlock = BaseBlock & {
  type: "auth";
  eyebrow?: string;                 // « Dernière étape »
  title: string;                    // « Gardez votre plan, Sophie. »
  text: string;
  recap?: { label: string; value: string; highlight?: string };
  keepsTitle?: string;              // « Avec votre compte, vous gardez »
  keeps: string[];                  // « Votre synthèse », « Votre plan et ses {{planStepCountLabel}} »
  consent?: {
    title: string;                  // « Autoriser la lecture »
    text: string;
    items: string[];
    confirmLabel: string;           // « Autoriser »
    cancelLabel: string;            // « Annuler »
  };
};
```

## 7. Effets sur la mémoire

Les étapes d'un scénario déclarent des effets, appliqués par le moteur :

```ts
type Effect =
  | { kind: "progress"; dimensionId: string; to: number; status?: "todo" | "active" | "enough"; summary?: string }
  | { kind: "finding"; finding: Finding }
  | { kind: "update-finding"; findingId: string; patch: Partial<Finding> }
  | { kind: "source"; source: Source }
  | { kind: "plan"; plan: Plan }
  | { kind: "update-plan"; planId: string; patch: Partial<Plan> }
  | { kind: "plan-step"; planId: string; stepId: string; status: "todo" | "doing" | "done" }
  | { kind: "account"; method: "google" | "apple" | "email" };

type Plan = {
  id: string;
  title: string;
  goal: string;
  status: "draft" | "active" | "waiting" | "done";
  topicId: string;
  steps: { id: string; title: string; detail: string; due: string; status: "todo" | "doing" | "done" }[];
};
```

Événements émis par les blocs interactifs (lus par le `await` de l'étape) :

| Bloc | Événement | Valeur | Écho dans le fil |
| --- | --- | --- | --- |
| `question` | réponse rapide | id de la réponse rapide (routé via `await.input.next` ou `await.input.quickRoutes[id]`) | Oui (libellé de la puce) |
| `choice` | confirmation | id de l'option choisie | Oui (titre de l'option, pas un libellé de bouton) |
| `plan` | bouton de démarrage | `"start"` | Non : état « fait » compact sur le bloc |
| `connector` | connexion ou refus | `"connect:{provider}"` (`gmail` \| `outlook` \| `drive`) ou `"skip"` | Non : état « fait » (ex. « Outlook connecté ») |
| `upload` | dépôt ou refus | `"upload"` (avec les fichiers) ou `"skip"` | Non : état « fait » compact |
| `form` | envoi | valeurs du formulaire | Selon le cas |
| `auth` | compte créé | `"google"` \| `"apple"` \| `"email"` ; le moteur applique l'effet `account` | Non : état « fait » (ex. « Compte créé avec Google ») |

Le fournisseur choisi par `connector` est disponible pour les effets suivants via les jetons `{{provider}}` et `{{providerLabel}}` (voir `docs/ARCHITECTURE.md`).

## 8. Ajouter un bloc

1. Décrire le bloc ici (rôle, schéma, comportement, animation).
2. Créer ou réutiliser les composants dans `apps/design-system`.
3. Ajouter le rendu dans `apps/web/src/blocks` et le brancher dans le `BlockRenderer`.
4. L'utiliser dans un scénario.
