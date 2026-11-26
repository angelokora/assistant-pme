import { motion } from "motion/react";
import { spring } from "../../motion/springs";
import styles from "./Gauge.module.css";

type Props = {
  value: number;
  /** Nombre de segments (défaut 5). Un plan passe le nombre d'étapes. */
  segments?: number;
  status?: "todo" | "active" | "enough";
  label?: string;
  className?: string;
};

/** Jauge segmentée. En Classique, gap 0 → rendu continu. */
export function Gauge({ value, segments = 5, status = "todo", label, className }: Props) {
  const v = Math.max(0, Math.min(1, value));
  const count = Math.max(1, Math.round(segments));
  return (
    <div
      className={[styles.track, styles[status], className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      {Array.from({ length: count }, (_, i) => {
        const fill = Math.max(0, Math.min(1, v * count - i));
        return (
          <div key={i} className={styles.seg}>
            <motion.div
              className={styles.fill}
              initial={false}
              animate={{ scaleX: fill }}
              transition={spring.gauge}
            />
          </div>
        );
      })}
    </div>
  );
}
