import { AnimatePresence, motion } from "motion/react";
import { spring } from "../../motion/springs";
import styles from "./StepList.module.css";

export type StepStatus = "pending" | "active" | "done";

export type StepItem = {
  id: string;
  label: string;
  status: StepStatus;
};

type Props = {
  steps: StepItem[];
  title?: string;
  className?: string;
};

/** Liste d'étapes (analyse, plan) : en attente, en cours (arc), fait (coche dessinée). */
export function StepList({ steps, title, className }: Props) {
  return (
    <div className={[styles.list, className].filter(Boolean).join(" ")} role="list" aria-label={title ?? "Étapes"}>
      {title && <p className={styles.title}>{title}</p>}
      <ol className={styles.items}>
        {steps.map((step) => (
          <li key={step.id} className={[styles.item, styles[step.status]].join(" ")} role="listitem">
            <span className={styles.marker} aria-hidden>
              <AnimatePresence mode="wait" initial={false}>
                {step.status === "done" ? (
                  <motion.svg
                    key="done"
                    viewBox="0 0 24 24"
                    className={styles.icon}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={spring.snappy}
                  >
                    <circle cx="12" cy="12" r="10" className={styles.doneRing} />
                    <motion.path
                      d="M7.5 12.5 10.5 15.5 16.5 9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 } as Record<string, number>}
                      animate={{ pathLength: 1 } as Record<string, number>}
                      transition={spring.snappy}
                    />
                  </motion.svg>
                ) : step.status === "active" ? (
                  <motion.span
                    key="active"
                    className={styles.spinner}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={spring.snappy}
                  >
                    <svg viewBox="0 0 24 24" className={styles.icon}>
                      <circle cx="12" cy="12" r="9" className={styles.track} />
                      <circle cx="12" cy="12" r="9" className={styles.arc} />
                    </svg>
                  </motion.span>
                ) : (
                  <motion.span
                    key="pending"
                    className={styles.pendingDot}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={spring.snappy}
                  />
                )}
              </AnimatePresence>
            </span>
            <span className={styles.label}>
              <span className="sr-only">
                {step.status === "done" ? "Fait : " : step.status === "active" ? "En cours : " : "En attente : "}
              </span>
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
