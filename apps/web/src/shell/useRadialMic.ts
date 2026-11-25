import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from "react";
import { useDemo } from "../demo/demo";
import { useRadialHost } from "./radialHost";

const HOLD_MS = 420;
const SWIPE_PX = 36;

type Options = {
  /** Si faux, pas de gestes menu (variante A). */
  enabled: boolean;
  /** Appui court : parler (ou action micro). */
  onShortPress: () => void;
};

type MicBind = {
  ref: (node: HTMLButtonElement | null) => void;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "menu";
  onPointerDown?: (e: PointerEvent) => void;
  onPointerUp?: () => void;
  onPointerCancel?: () => void;
  onPointerMove?: (e: PointerEvent) => void;
  onClick: (e: MouseEvent) => void;
};

/**
 * Enregistre l'orbe comme ancre du menu B et branche appui court / long / glisser.
 */
export function useRadialMic({ enabled, onShortPress }: Options): MicBind {
  const setAnchor = useRadialHost((s) => s.setAnchor);
  const setOpen = useRadialHost((s) => s.setOpen);
  const open = useRadialHost((s) => s.open);
  const hintSeen = useDemo((s) => s.radialHintSeen);
  const setHintSeen = useDemo((s) => s.setRadialHintSeen);
  const holdTimer = useRef<number | null>(null);
  const startY = useRef(0);
  const openedByGesture = useRef(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const releaseAnchor = useCallback(() => {
    useRadialHost.setState((s) => (s.anchor === btnRef.current ? { anchor: null } : s));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (btnRef.current) setAnchor(btnRef.current);
    return releaseAnchor;
  }, [enabled, setAnchor, releaseAnchor]);

  const openMenu = useCallback(() => {
    openedByGesture.current = true;
    setOpen(true);
    if (!hintSeen) setHintSeen(true);
  }, [hintSeen, setHintSeen, setOpen]);

  const clearHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const ref = useCallback(
    (node: HTMLButtonElement | null) => {
      if (!node && btnRef.current) releaseAnchor();
      btnRef.current = node;
      if (enabled && node) setAnchor(node);
    },
    [enabled, setAnchor, releaseAnchor],
  );

  if (!enabled) {
    return {
      ref,
      onClick: (e) => {
        e.preventDefault();
        onShortPress();
      },
    };
  }

  return {
    ref,
    "aria-expanded": open,
    "aria-haspopup": "menu",
    onPointerDown: (e) => {
      openedByGesture.current = false;
      startY.current = e.clientY;
      holdTimer.current = window.setTimeout(openMenu, HOLD_MS);
    },
    onPointerUp: clearHold,
    onPointerCancel: clearHold,
    onPointerMove: (e) => {
      if (startY.current - e.clientY > SWIPE_PX) {
        clearHold();
        openMenu();
      }
    },
    onClick: (e) => {
      e.preventDefault();
      if (open) {
        setOpen(false);
        return;
      }
      if (openedByGesture.current) {
        openedByGesture.current = false;
        return;
      }
      onShortPress();
    },
  };
}
