import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { IconButton } from "../Button/Button";
import { spring } from "../../motion/springs";
import styles from "./Sheet.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Largeur du panneau latéral (ordinateur). */
  width?: number;
  /** Libellé du bouton de fermeture. */
  closeLabel?: string;
};

const DESKTOP = "(min-width: 1024px)";

/**
 * Feuille du bas sur mobile (glisser pour fermer), panneau latéral sur ordinateur.
 * Voir DESIGN.md, section 7.
 */
export function Sheet({ open, onClose, title, children, width = 400, closeLabel = "Fermer" }: Props) {
  const titleId = useId();
  const dragControls = useDragControls();
  const [desktop, setDesktop] = useState(() => (typeof window !== "undefined" ? window.matchMedia(DESKTOP).matches : false));

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function onDragEnd(_: unknown, info: PanInfo) {
    if (desktop) return;
    if (info.offset.y > 90 || info.velocity.y > 650) onClose();
  }

  if (typeof document === "undefined") return null;

  const enter = desktop ? { x: "100%", y: 0 } : { y: "100%", x: 0 };
  const shown = { x: 0, y: 0 };
  const exit = desktop ? { x: "100%", y: 0 } : { y: "100%", x: 0 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={styles.root} data-mode={desktop ? "side" : "bottom"}>
          <motion.button
            type="button"
            className={styles.backdrop}
            aria-label={closeLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            className={styles.panel}
            style={{ ["--sheet-w" as string]: `${width}px` }}
            initial={enter}
            animate={shown}
            exit={exit}
            transition={spring.sheet}
            drag={desktop ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={onDragEnd}
          >
            {!desktop && (
              <div
                className={styles.handleZone}
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className={styles.handle} aria-hidden />
                <span className="sr-only">Glisser vers le bas pour fermer</span>
              </div>
            )}
            <header className={styles.header}>
              {title ? (
                <h2 id={titleId} className={styles.title}>
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <IconButton label={closeLabel} size="sm" variant="soft" onClick={onClose}>
                <X size={16} />
              </IconButton>
            </header>
            <div className={styles.body}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
