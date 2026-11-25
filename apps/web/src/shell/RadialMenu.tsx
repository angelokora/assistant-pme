import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronUp, Mic } from "lucide-react";
import { Orb, spring } from "@elea/ds";
import { useDemo } from "../demo/demo";
import { DESTINATIONS, type DestinationId } from "./destinations";
import { fanOffset, layoutRadialFan } from "./radialLayout";
import { useRadialHost } from "./radialHost";
import { useRadialMic } from "./useRadialMic";
import styles from "./RadialMenu.module.css";

type Props = {
  active: DestinationId | null;
  /** Pas d'orbe micro sur la page : orbe de secours (autres écrans). */
  needsFallbackOrb: boolean;
};

type AnchorBox = { x: number; y: number; rect: DOMRect };

/** Variante B : arc de navigation ancré sur l'orbe micro (ou orbe de secours). */
export function RadialMenu({ active, needsFallbackOrb }: Props) {
  const navigate = useNavigate();
  const open = useRadialHost((s) => s.open);
  const setOpen = useRadialHost((s) => s.setOpen);
  const anchor = useRadialHost((s) => s.anchor);
  const hintSeen = useDemo((s) => s.radialHintSeen);
  const setHintSeen = useDemo((s) => s.setRadialHintSeen);
  const [showHint, setShowHint] = useState(!hintSeen);
  const [anchorBox, setAnchorBox] = useState<AnchorBox | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fallback = useRadialMic({
    enabled: needsFallbackOrb,
    onShortPress: () => navigate("/", { state: { openComposer: true } }),
  });

  useEffect(() => {
    if (hintSeen) setShowHint(false);
    else setShowHint(true);
  }, [hintSeen]);

  useEffect(() => {
    if (open) {
      setShowHint(false);
      if (!hintSeen) setHintSeen(true);
    }
  }, [open, hintSeen, setHintSeen]);

  useLayoutEffect(() => {
    const measure = () => {
      const el =
        anchor ??
        (needsFallbackOrb ? wrapRef.current?.querySelector<HTMLElement>(`.${styles.orbBtn}`) : null);
      if (!el) {
        setAnchorBox(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setAnchorBox({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, rect });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchor, needsFallbackOrb, open, showHint]);

  const fan = useMemo(() => {
    if (!open || !anchorBox) return null;
    return layoutRadialFan(anchorBox.rect, DESTINATIONS.length, {
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, [open, anchorBox]);

  useEffect(() => {
    if (!needsFallbackOrb) {
      document.documentElement.style.removeProperty("--nav-offset");
      return;
    }
    const el = wrapRef.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      root.style.setProperty("--nav-offset", `${Math.max(h, 96)}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--nav-offset");
    };
  }, [needsFallbackOrb, showHint]);

  const hintVisible = showHint && !open && !hintSeen && !!anchorBox;

  return (
    <div ref={wrapRef} className={[styles.wrap, needsFallbackOrb && styles.wrapFallback].filter(Boolean).join(" ")}>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            className={styles.scrim}
            aria-label="Fermer le menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open &&
          anchorBox &&
          fan &&
          DESTINATIONS.map((d, i) => {
            const offset = fanOffset(fan, i);
            const Icon = d.icon;
            return (
              <motion.button
                key={d.id}
                type="button"
                className={[styles.dest, active === d.id && styles.destActive].filter(Boolean).join(" ")}
                style={{ left: anchorBox.x + offset.x, top: anchorBox.y + offset.y }}
                aria-label={d.label}
                initial={{ opacity: 0, scale: 0.6, x: -offset.x, y: -offset.y }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: -offset.x * 0.3, y: -offset.y * 0.3 }}
                transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.7, delay: i * 0.03 }}
                onClick={() => {
                  navigate(d.path);
                  setOpen(false);
                }}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden />
                <span>{d.menuLabel}</span>
              </motion.button>
            );
          })}
      </AnimatePresence>

      <AnimatePresence>
        {hintVisible && (
          <motion.p
            className={styles.hint}
            style={{ left: anchorBox!.x, top: anchorBox!.y }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={spring.gentle}
          >
            <ChevronUp size={14} strokeWidth={1.75} aria-hidden />
            <span>Glisser ou appui long</span>
          </motion.p>
        )}
      </AnimatePresence>

      {needsFallbackOrb && (
        <button
          type="button"
          className={styles.orbBtn}
          aria-label={open ? "Fermer le menu" : "Toucher pour parler, glisser ou appui long pour le menu"}
          {...fallback}
        >
          <Orb size={52} state="idle" decorative />
          <Mic size={20} strokeWidth={1.75} className={styles.orbMic} aria-hidden />
        </button>
      )}
    </div>
  );
}
