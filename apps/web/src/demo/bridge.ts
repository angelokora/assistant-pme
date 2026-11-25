import type { FindVariant, HomeVariant, MenuVariant } from "./demo";
import type { PresetId } from "../engine/scenarios";

export const DEMO_SOURCE = "elea-demo";

const FRAME_KEY = "elea-frame";
const SAFE_KEY = "elea-frame-safe";

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

/** Au chargement : mémorise le mode cadre (URL initiale ou nested frame) pour toute la vie de l'iframe. */
export function detectAndPersistFrameMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  let nested = false;
  try {
    nested = window.self !== window.top;
  } catch {
    nested = true;
  }
  if (params.get("frame") === "1" || nested) {
    sessionStorage.setItem(FRAME_KEY, "1");
    const top = params.get("safeTop");
    const bottom = params.get("safeBottom");
    if (top || bottom) {
      sessionStorage.setItem(SAFE_KEY, JSON.stringify({ top: top ?? "0", bottom: bottom ?? "0" }));
    }
  }
  return isFrameMode();
}

export function isFrameMode() {
  if (typeof window === "undefined") return false;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  return sessionStorage.getItem(FRAME_KEY) === "1";
}

export function readStoredSafeInsets(): { top: number; bottom: number } {
  try {
    const raw = sessionStorage.getItem(SAFE_KEY);
    if (!raw) return { top: 0, bottom: 0 };
    const parsed = JSON.parse(raw) as { top?: string; bottom?: string };
    return { top: Number(parsed.top) || 0, bottom: Number(parsed.bottom) || 0 };
  } catch {
    return { top: 0, bottom: 0 };
  }
}

export function applySafeInsets(top: number, bottom: number) {
  const root = document.documentElement;
  root.style.setProperty("--safe-top", `${top}px`);
  root.style.setProperty("--safe-bottom", `${bottom}px`);
  sessionStorage.setItem(SAFE_KEY, JSON.stringify({ top: String(top), bottom: String(bottom) }));
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
