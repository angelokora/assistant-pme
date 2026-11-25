import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { Check, ChevronRight } from "lucide-react";
import { Gauge } from "../Gauge/Gauge";
import { press, spring } from "../../motion/springs";
import styles from "./DimensionCard.module.css";

export type DimensionTone = "icy" | "teal" | "cherry" | "bronze";

type Props = {
  id: string;
  label: string;
  icon: ReactNode;
  tone: DimensionTone;
  summary: string;
  progress: number;
  status: "todo" | "active" | "enough";
  /** Incrémenter pour déclencher le battement de réception (« Noté dans… » qui arrive). */
  pulseKey?: number;
  compact?: boolean;
  onClick?: () => void;
};

const STATUS_LABEL = { todo: "", active: "En cours", enough: "Suffisant" } as const;

/** Carte d'une dimension de connaissance (Mon activité, Mes finances…). Cible des vols « Noté dans… ». */
export function DimensionCard({ id, label, icon, tone, summary, progress, status, pulseKey = 0, compact, onClick }: Props) {
  const controls = useAnimationControls();
  const [ripple, setRipple] = useState(0);

  useEffect(() => {
    if (!pulseKey) return;
    setRipple((r) => r + 1);
    controls.start({ scale: [1, 1.035, 1], transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } });
  }, [pulseKey, controls]);

  return (
    <motion.button
      type="button"
      animate={controls}
      whileTap={press}
      onClick={onClick}
      data-dimension-target={id}
      className={[styles.card, compact && styles.compact, status === "active" && styles.active].filter(Boolean).join(" ")}
      aria-label={`${label} : ${summary}`}
    >
      <AnimatePresence>
        {ripple > 0 && (
          <motion.span
            key={ripple}
            className={styles.ripple}
            initial={{ opacity: 0.55, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>
      <span className={styles.top}>
        <span className={[styles.icon, styles[tone]].join(" ")}>{icon}</span>
        {!compact && (
          <span className={styles.chevron} aria-hidden>
            <ChevronRight size={16} strokeWidth={2} />
          </span>
        )}
      </span>
      <span className={styles.titleRow}>
        <span className={styles.title}>{label}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          {status !== "todo" && (
            <motion.span
              key={status}
              className={[styles.status, styles[`status-${status}`]].join(" ")}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={spring.snappy}
            >
              {status === "enough" ? <Check size={14} strokeWidth={2.6} aria-label={STATUS_LABEL.enough} /> : STATUS_LABEL[status]}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {!compact && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={summary}
            className={styles.summary}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
          >
            {summary}
          </motion.span>
        </AnimatePresence>
      )}
      <Gauge value={progress} status={status} label={`Connaissance : ${label}`} className={styles.gauge} />
    </motion.button>
  );
}
