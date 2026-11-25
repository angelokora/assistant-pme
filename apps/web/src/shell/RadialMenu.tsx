import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronUp } from "lucide-react";
import { Orb, spring } from "@elea/ds";
import { useDemo } from "../demo/demo";
import { DESTINATIONS, type DestinationId } from "./destinations";
import styles from "./RadialMenu.module.css";

type Props = {
  active: DestinationId | null;
};

const ANGLES = [-50, -18, 18, 50];

/** Variante B : un orbe ; appui long ou glissement vers le haut ouvre l'arc. */
export function RadialMenu({ active }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const hintSeen = useDemo((s) => s.radialHintSeen);
  const setHintSeen = useDemo((s) => s.setRadialHintSeen);
  const [showHint, setShowHint] = useState(!hintSeen);
  const holdTimer = useRef<number | null>(null);
  const startY = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (hintSeen) return;
    const t = window.setTimeout(() => {
      setShowHint(false);
      setHintSeen(true);
    }, 5200);
    return () => window.clearTimeout(t);
  }, [hintSeen, setHintSeen]);

  function openMenu() {
    setOpen(true);
    if (!hintSeen) {
      setShowHint(false);
      setHintSeen(true);
    }
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            className={styles.scrim}
            aria-label="Fermer le menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open &&
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
                initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
                transition={{ ...spring.snappy, delay: i * 0.03 }}
                onClick={() => {
                  navigate(d.path);
                  closeMenu();
                }}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden />
                <span>{d.label}</span>
              </motion.button>
            );
          })}
      </AnimatePresence>

      <AnimatePresence>
        {showHint && !open && (
          <motion.p
            className={styles.hint}
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

      <button
        type="button"
        className={styles.orbBtn}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu (appui long)"}
        aria-expanded={open}
        onPointerDown={(e) => {
          startY.current = e.clientY;
          holdTimer.current = window.setTimeout(openMenu, 420);
        }}
        onPointerUp={() => {
          if (holdTimer.current) window.clearTimeout(holdTimer.current);
        }}
        onPointerCancel={() => {
          if (holdTimer.current) window.clearTimeout(holdTimer.current);
        }}
        onPointerMove={(e) => {
          if (startY.current - e.clientY > 36) {
            if (holdTimer.current) window.clearTimeout(holdTimer.current);
            openMenu();
          }
        }}
        onClick={() => {
          if (open) closeMenu();
          else navigate("/", { state: { openComposer: true } });
        }}
      >
        <Orb size={52} state="idle" decorative />
      </button>
    </div>
  );
}
