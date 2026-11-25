import type { FindVariant, HomeVariant, MenuVariant } from "./demo";
import type { PresetId } from "../engine/scenarios";

export const DEMO_CHANNEL = "elea-demo";

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
  | { type: "setShowVariantPill"; value: boolean };

let channel: BroadcastChannel | null = null;

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(DEMO_CHANNEL);
  return channel;
}

/** Envoie une commande au prototype (iframe ou même fenêtre). */
export function postDemoCommand(cmd: DemoCommand) {
  getChannel()?.postMessage(cmd);
}

/** Écoute les commandes du panneau hôte. */
export function subscribeDemoCommands(handler: (cmd: DemoCommand) => void) {
  const ch = getChannel();
  if (!ch) return () => undefined;
  const onMessage = (e: MessageEvent<DemoCommand>) => {
    if (e.data && typeof e.data === "object" && "type" in e.data) handler(e.data);
  };
  ch.addEventListener("message", onMessage);
  return () => ch.removeEventListener("message", onMessage);
}

export function isFrameMode() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("frame") === "1";
}

export const DEVICE_SAFE = {
  phone: { top: 47, bottom: 34 },
  tablet: { top: 24, bottom: 20 },
} as const;
