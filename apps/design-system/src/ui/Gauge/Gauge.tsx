import { motion } from "motion/react";
import { spring } from "../../motion/springs";
import styles from "./Gauge.module.css";

const SEGMENTS = 5;

type Props = { value: number; status?: "todo" | "active" | "enough"; label?: string; className?: string };

/** Jauge de connaissance. Segments tokenisés (continus en Classique via gap 0). */
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
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const fill = Math.max(0, Math.min(1, v * SEGMENTS - i));
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
