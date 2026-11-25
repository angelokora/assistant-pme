import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronUp, Mic } from "lucide-react";
import { Orb, spring } from "@elea/ds";
import { useDemo } from "../demo/demo";
import { DESTINATIONS, type DestinationId } from "./destinations";
import { useRadialHost } from "./radialHost";
import { useRadialMic } from "./useRadialMic";
import styles from "./RadialMenu.module.css";

type Props = {
  active: DestinationId | null;
  /** Pas d'orbe micro sur la page : orbe de secours (autres écrans). */
  needsFallbackOrb: boolean;
};

const ANGLES = [-50, -18, 18, 50];

/** Variante B : arc de navigation ancré sur l'orbe micro (ou orbe de secours). */
export function RadialMenu({ active, needsFallbackOrb }: Props) {
  const navigate = useNavigate();
  const open = useRadialHost((s) => s.open);
  const setOpen = useRadialHost((s) => s.setOpen);
  const anchor = useRadialHost((s) => s.anchor);
  const hintSeen = useDemo((s) => s.radialHintSeen);
  const setHintSeen = useDemo((s) => s.setRadialHintSeen);
  const [showHint, setShowHint] = useState(!hintSeen);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
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
        setOrigin(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchor, needsFallbackOrb, open, showHint]);

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

  const hintVisible = showHint && !open && !hintSeen && !!origin;

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
          origin &&
          DESTINATIONS.map((d, i) => {
            const rad = (ANGLES[i] * Math.PI) / 180;
            const r = 92;
            const x = Math.sin(rad) * r;
            const y = -Math.cos(rad) * r - 8;
            const Icon = d.icon;
            return (
              <motion.button
                key={d.id}
                type="button"
                className={[styles.dest, active === d.id && styles.destActive].filter(Boolean).join(" ")}
                style={{ left: origin.x, top: origin.y }}
                initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
                transition={{ ...spring.snappy, delay: i * 0.03 }}
                onClick={() => {
                  navigate(d.path);
                  setOpen(false);
                }}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden />
                <span>{d.label}</span>
              </motion.button>
            );
          })}
      </AnimatePresence>

      <AnimatePresence>
        {hintVisible && (
          <motion.p
            className={styles.hint}
            style={{ left: origin!.x, top: origin!.y }}
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
