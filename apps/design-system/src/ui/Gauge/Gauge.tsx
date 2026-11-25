import { motion } from "motion/react";
import { spring } from "../../motion/springs";
import styles from "./Gauge.module.css";

type Props = { value: number; status?: "todo" | "active" | "enough"; label?: string; className?: string };

/** Jauge de connaissance. Remplissage au ressort, reflet qui passe quand la valeur monte. */
export function Gauge({ value, status = "todo", label, className }: Props) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className={[styles.track, styles[status], className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <motion.div className={styles.fill} initial={false} animate={{ scaleX: Math.max(v, 0.04) }} transition={spring.gauge}>
        <motion.span key={Math.round(v * 100)} className={styles.glint} initial={{ x: "-120%" }} animate={{ x: "220%" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }} />
      </motion.div>
    </div>
  );
}
