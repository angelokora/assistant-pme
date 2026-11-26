/**
 * Contrat entre le « modèle » (aujourd'hui : le moteur de scénario) et l'interface.
 * Source : docs/BLOCKS.md et docs/ARCHITECTURE.md. Toute évolution se fait d'abord dans la doc.
 */

export type Confidence = "confirmed" | "estimated" | "to-check";
export type Intent = "onboarding" | "solve" | "ask" | "inform" | "find";

// ---------- Blocs ----------
type Base<T extends string> = { id: string; type: T };

export type LeadBlock = Base<"lead"> & { text: string };
export type QuestionBlock = Base<"question"> & {
  text: string;
  hint?: string;
  quickReplies?: { id: string; label: string }[];
  inputModes?: ("voice" | "text")[];
  attachments?: ("document" | "photo")[];
};
export type NotedBlock = Base<"noted"> & {
  target: { kind: "dimension" | "topic"; id: string; label: string };
  text: string;
  confidence?: Confidence;
  editable?: boolean;
};
export type CalloutBlock = Base<"callout"> & { tone: "info" | "memory" | "warning" | "success"; title?: string; text: string };
export type DimensionsBlock = Base<"dimensions"> & { title?: string; subtitle?: string; compact?: boolean; dimensionIds: string[] };
export type AnalysisBlock = Base<"analysis"> & { title: string; steps: { id: string; label: string; durationMs: number }[] };
export type ChoiceBlock = Base<"choice"> & {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  options: { id: string; title: string; body?: string; recommended?: boolean; meta?: string }[];
  confirmLabel: string;
  allowFreeInput?: boolean;
  freeInputHint?: string;
  freeSimulated?: string;
  sideDetail?: "plan";
  /** Préfixe du résumé une fois terminé (ex. « Priorité retenue », « Plan retenu »). */
  doneLabel?: string;
};
export type PlanBlock = Base<"plan"> & {
  planId: string;
  mode: "preview" | "editable" | "live";
  startLabel?: string;
  /** Préfixe ou libellé du résumé une fois terminé (ex. « Plan démarré », « Plan mis en place »). */
  doneLabel?: string;
};
export type FormBlock = Base<"form"> & {
  title?: string;
  fields: {
    id: string;
    label: string;
    kind: "text" | "number" | "currency" | "date" | "select" | "textarea";
    placeholder?: string;
    help?: string;
    options?: { value: string; label: string }[];
    required?: boolean;
    unit?: string;
  }[];
  submitLabel: string;
};
export type ConnectorBlock = Base<"connector"> & {
  title: string;
  why: string;
  providers: ("gmail" | "outlook" | "drive")[];
  willRead: string[];
  willNotRead: string[];
  reassurance: string[];
  skipLabel: string;
};
export type UploadBlock = Base<"upload"> & { title: string; why?: string; accept: ("pdf" | "image")[]; examples?: string[]; skipLabel?: string };
export type ExtractionBlock = Base<"extraction"> & {
  title: string;
  items: { id: string; label: string; value: string; source: string; confidence: Confidence }[];
  total?: { label: string; value: string };
};
export type AnswerBlock = Base<"answer"> & {
  title: string;
  summary: string;
  sections?: { heading: string; text: string }[];
  keyPoints?: string[];
  recommendation?: string;
  sources?: { label: string; detail?: string }[];
  savedTo?: { topicId: string; label: string };
};
export type FindingRefBlock = Base<"finding-ref"> & { findingId: string; reason?: string };
export type SuggestionsBlock = Base<"suggestions"> & {
  items: { id: string; label: string; action: { kind: "scenario" | "route"; target: string } }[];
};
export type AuthBlock = Base<"auth"> & {
  eyebrow?: string;
  title: string;
  text: string;
  recap?: { label: string; value: string; highlight?: string };
  /** Titre au-dessus de la liste (ex. « Avec votre compte, vous gardez »). */
  keepsTitle?: string;
  keeps: string[];
  consent?: {
    title: string;
    text: string;
    items: string[];
    confirmLabel: string;
    cancelLabel: string;
  };
};

export type Block =
  | LeadBlock | QuestionBlock | NotedBlock | CalloutBlock | DimensionsBlock | AnalysisBlock | ChoiceBlock
  | PlanBlock | FormBlock | ConnectorBlock | UploadBlock | ExtractionBlock | AnswerBlock | FindingRefBlock
  | SuggestionsBlock | AuthBlock;

// ---------- Mémoire ----------
export type DimensionStatus = "todo" | "active" | "enough";
export type Dimension = {
  id: string;
  label: string;
  icon: string;
  tone: "icy" | "teal" | "cherry" | "bronze";
  progress: number;
  status: DimensionStatus;
  summary: string;
};
export type Topic = { id: string; label: string; icon: string };
export type Finding = {
  id: string;
  type: "answer" | "fact" | "decision" | "plan" | "document" | "action";
  topicId: string;
  title: string;
  summary: string;
  createdAt: string;
  origin: "conversation" | "document" | "gmail" | "outlook" | "drive";
  confidence?: Confidence;
  scenarioId?: string;
  body?: Block[];
};
export type Source = {
  id: string;
  provider: "gmail" | "outlook" | "drive" | "upload";
  label: string;
  status: "connected" | "available" | "disconnected";
  detail?: string;
  lastSync?: string;
};
export type PlanStep = { id: string; title: string; detail: string; due: string; status: "todo" | "doing" | "done" };
export type Plan = {
  id: string;
  title: string;
  goal: string;
  status: "draft" | "active" | "waiting" | "done";
  topicId: string;
  steps: PlanStep[];
};
export type Attention = {
  id: string;
  kind: "plan-step" | "finding";
  title: string;
  text: string;
  due: string | null;
  planId?: string;
  stepId?: string;
  findingId?: string;
};

/** Phrases d'Éléa pour l'accueil hors besoin (pas de texte de scénario dans le code). */
export type HomeContent = {
  summary: string;
  suggestions: { id: string; label: string; scenarioId: string }[];
};

export type Memory = {
  today: string;
  company: { name: string; sector: string; city: string; employees: number | null; since: string | null };
  owner: { firstName: string; lastName: string };
  dimensions: Dimension[];
  topics: Topic[];
  findings: Finding[];
  sources: Source[];
  plans: Plan[];
  attention: Attention[];
  account: { created: boolean; method?: "google" | "apple" | "email" };
  /** Accueil quotidien (preset returning). Absent au premier lancement. */
  home?: HomeContent;
};

// ---------- Effets ----------
export type Effect =
  | { kind: "progress"; dimensionId: string; to: number; status?: DimensionStatus; summary?: string }
  | { kind: "finding"; finding: Finding }
  | { kind: "update-finding"; findingId: string; patch: Partial<Finding> }
  | { kind: "source"; source: Source }
  | { kind: "plan"; plan: Plan }
  | { kind: "update-plan"; planId: string; patch: Partial<Plan> }
  | { kind: "plan-step"; planId: string; stepId: string; status: PlanStep["status"] }
  | { kind: "account"; method: "google" | "apple" | "email" };

// ---------- Scénario ----------
export type Await =
  | { kind: "input"; simulated: string; next: string; quickRoutes?: Record<string, string> }
  | { kind: "choice"; blockId: string; routes: Record<string, string> }
  | { kind: "connector"; blockId: string; onConnect: string; onSkip: string }
  | { kind: "upload"; blockId: string; onUpload: string; onSkip: string }
  | { kind: "form"; blockId: string; next: string }
  | { kind: "auth"; next: string }
  | { kind: "plan"; blockId: string; next: string };

export type Step = { blocks: Block[]; effects?: Effect[]; delayMs?: number; await?: Await; next?: string };

export type Scenario = {
  id: string;
  intent: Intent;
  title: string;
  userUtterance?: string;
  start: string;
  steps: Record<string, Step>;
  /**
   * Rouverture d'un besoin déjà joué : blocs affichés après l'historique (lecture seule),
   * avec jetons mémoire ({{planTitle}}, {{planDoneCount}}, …).
   */
  resume?: { blocks: Block[] };
};

/** Ce que l'utilisateur renvoie au moteur. */
export type Reply =
  | { kind: "text"; text: string; mode: "voice" | "text" }
  | { kind: "quick"; id: string; label: string }
  | { kind: "event"; blockId: string; value: string; label?: string; doneLabel?: string; vars?: StepVars };

/** Variables d'étape (ex. fournisseur choisi), utilisées pour interpoler les effets `{{jeton}}`. */
export type StepVars = Record<string, string>;

/** Résolution d'un bloc interactif : état « fait » compact, sans écho « Vous : … ». */
export type BlockResolution = { summary: string };