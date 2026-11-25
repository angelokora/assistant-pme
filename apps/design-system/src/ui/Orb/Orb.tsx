import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { spring } from "../../motion/springs";
import styles from "./Orb.module.css";

export type OrbState = "idle" | "listening" | "thinking" | "speaking" | "done";

const LABELS: Record<OrbState, string> = {
  idle: "Éléa est disponible",
  listening: "Éléa vous écoute",
  thinking: "Éléa réfléchit",
  speaking: "Éléa répond",
  done: "Éléa a terminé",
};

type Props = {
  state?: OrbState;
  /** Niveau sonore 0 à 1, utilisé en état listening. */
  level?: number;
  size?: 20 | 56 | 96 | number;
  className?: string;
  decorative?: boolean;
  /** Pour une transition partagée (ex. analyse → coche de validation). */
  layoutId?: string;
};

/**
 * L'orbe de présence : seule représentation d'Éléa (DESIGN.md, section 6).
 * Couches : halo, corps (blob morphé), voile de dégradé qui tourne, reflet.
 * État `done` : le blob cède la place à une coche de validation (sobre, sans confettis).
 */
export function Orb({ state = "idle", level = 0, size = 56, className, decorative, layoutId }: Props) {
  const reduce = useReducedMotion();
  const l = Math.max(0, Math.min(1, level));
  const scale =
    state === "listening" ? 1 + l * 0.16 : state === "thinking" ? 0.9 : state === "done" ? 1 : 1;

  return (
    <motion.span
      layoutId={layoutId}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : LABELS[state]}
      aria-hidden={decorative || undefined}
      className={[styles.orb, styles[state], className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, ["--level" as string]: l }}
      data-size={size <= 24 ? "s" : size <= 64 ? "m" : "l"}
      animate={reduce ? undefined : { scale }}
      transition={{ type: "spring", stiffness: state === "listening" ? 400 : 160, damping: state === "listening" ? 18 : 14 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" ? (
          <motion.span
            key="done"
            className={styles.doneMark}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={spring.gentle}
          >
            <svg viewBox="0 0 48 48" className={styles.doneSvg} aria-hidden>
              <circle cx="24" cy="24" r="22" className={styles.doneRing} />
              <motion.path
                d="M14 24.5 21 31.5 34 17"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 } as Record<string, number>}
                animate={{ pathLength: 1 } as Record<string, number>}
                transition={spring.gentle}
              />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="live"
            className={styles.live}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
          >
            <span className={styles.halo} />
            <span className={styles.body}>
              <span className={styles.swirl} />
              <span className={styles.sheen} />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}
