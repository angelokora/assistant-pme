import type { FindVariant, HomeVariant, MenuVariant } from "./demo";
import type { PresetId } from "../engine/scenarios";

export const DEMO_SOURCE = "elea-demo";

export type DemoSyncState = {
  homeVariant: HomeVariant;
  menuVariant: MenuVariant;
  findVariant: FindVariant;
  animations: boolean;
  mailInterrupted: boolean;
  showVariantPill: boolean;
  safeTop: number;
  safeBottom: number;
};

export type DemoCommand =
  | { type: "reset"; preset: PresetId }
  | { type: "start"; scenarioId: string }
  | { type: "jumpTo"; scenarioId: string; stepId: string }
  | { type: "navigate"; path: string }
  | { type: "setHomeVariant"; value: HomeVariant }
  | { type: "setMenuVariant"; value: MenuVariant }
  | { type: "setFindVariant"; value: FindVariant }
  | { type: "setAnimations"; value: boolean }
  | { type: "setMailInterrupted"; value: boolean }
  | { type: "setShowVariantPill"; value: boolean }
  | { type: "sync"; state: DemoSyncState };

type Envelope = { source: typeof DEMO_SOURCE } & (DemoCommand | { type: "ready" });

let iframeWindow: Window | null = null;

export const DEVICE_SAFE = {
  phone: { top: 47, bottom: 34 },
  tablet: { top: 24, bottom: 20 },
} as const;

/** Vrai uniquement dans une iframe imbriquée. Ne pas utiliser de stockage (partagé avec l'hôte). */
export function isFrameMode() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** Nettoie les clés héritées d'une version précédente (hôte uniquement). */
export function clearLegacyFrameKeys() {
  if (typeof window === "undefined" || isFrameMode()) return;
  sessionStorage.removeItem("elea-frame");
  sessionStorage.removeItem("elea-frame-safe");
}

/** Applique les zones de sécurité depuis l'URL initiale (mémoire CSS uniquement). */
export function initSafeInsetsFromUrl() {
  if (!isFrameMode()) return;
  const params = new URLSearchParams(window.location.search);
  const top = Number(params.get("safeTop")) || 0;
  const bottom = Number(params.get("safeBottom")) || 0;
  if (top || bottom) applySafeInsets(top, bottom);
}

/** Pose les variables CSS ; pas de sessionStorage (partagé avec l'hôte). */
export function applySafeInsets(top: number, bottom: number) {
  const root = document.documentElement;
  root.style.setProperty("--safe-top", `${top}px`);
  root.style.setProperty("--safe-bottom", `${bottom}px`);
}

/** Enregistre la fenêtre de l'iframe (hôte uniquement). */
export function registerDemoIframe(win: Window | null) {
  iframeWindow = win;
}

/** Envoie une commande à l'iframe (postMessage ciblé, même origine). */
export function postDemoCommand(cmd: DemoCommand) {
  if (!iframeWindow || iframeWindow.closed) return;
  const envelope: Envelope = { source: DEMO_SOURCE, ...cmd };
  iframeWindow.postMessage(envelope, window.location.origin);
}

export function postDemoReady() {
  if (!isFrameMode() || window.parent === window) return;
  const envelope: Envelope = { source: DEMO_SOURCE, type: "ready" };
  window.parent.postMessage(envelope, window.location.origin);
}

function isEnvelope(data: unknown): data is Envelope {
  return !!data && typeof data === "object" && (data as Envelope).source === DEMO_SOURCE && "type" in (data as object);
}

/** Écoute les commandes du parent (iframe). */
export function subscribeDemoCommands(handler: (cmd: DemoCommand) => void) {
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if (e.source !== window.parent) return;
    if (!isEnvelope(e.data) || e.data.type === "ready") return;
    handler(e.data);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

/** Écoute le « ready » de l'iframe (hôte) et renvoie un sync. */
export function subscribeDemoReady(getState: () => DemoSyncState) {
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if (!iframeWindow || e.source !== iframeWindow) return;
    if (!isEnvelope(e.data) || e.data.type !== "ready") return;
    postDemoCommand({ type: "sync", state: getState() });
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
