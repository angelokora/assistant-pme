import { motion, useReducedMotion } from "motion/react";
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
};

/**
 * L'orbe de présence : seule représentation d'Éléa (DESIGN.md, section 6).
 * Couches : halo, corps (blob morphé), voile de dégradé qui tourne, reflet.
 */
export function Orb({ state = "idle", level = 0, size = 56, className, decorative }: Props) {
  const reduce = useReducedMotion();
  const l = Math.max(0, Math.min(1, level));
  const scale =
    state === "listening" ? 1 + l * 0.16 : state === "thinking" ? 0.9 : state === "done" ? 1.06 : 1;

  return (
    <motion.span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : LABELS[state]}
      aria-hidden={decorative || undefined}
      className={[styles.orb, styles[state], className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, ["--level" as string]: l }}
      data-size={size <= 24 ? "s" : size <= 64 ? "m" : "l"}
      animate={reduce ? undefined : { scale }}
      transition={{ type: "spring", stiffness: state === "listening" ? 400 : 160, damping: state === "listening" ? 18 : 14 }}
    >
      <span className={styles.halo} />
      <span className={styles.body}>
        <span className={styles.swirl} />
        <span className={styles.sheen} />
      </span>
    </motion.span>
  );
}
