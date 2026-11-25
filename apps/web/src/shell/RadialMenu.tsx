import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Orb, spring } from "@elea/ds";
import { DESTINATIONS, type DestinationId } from "./destinations";
import styles from "./RadialMenu.module.css";

type Props = {
  active: DestinationId | null;
};

const ANGLES = [-50, -18, 18, 50]; // degrés autour du bas

/** Variante B : un orbe ; appui long ou glissement vers le haut ouvre l'arc. */
export function RadialMenu({ active }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const startY = useRef(0);

  function openMenu() {
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className={styles.wrap}>
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
