import { AnimatePresence, motion } from "motion/react";
import { spring } from "../../motion/springs";
import styles from "./StepList.module.css";

export type StepStatus = "pending" | "active" | "done";

export type StepItem = {
  id: string;
  label: string;
  status: StepStatus;
  /** Détail sous le titre (plans). */
  detail?: string;
  /** Échéance déjà formatée (ex. « jeu. 27 nov. »). */
  due?: string;
};

type Props = {
  steps: StepItem[];
  title?: string;
  className?: string;
  /** Mode suivi : une étape non faite devient cliquable. */
  onStepComplete?: (stepId: string) => void;
};

function StepMarker({ status }: { status: StepStatus }) {
  return (
    <span className={styles.marker} aria-hidden>
      <AnimatePresence mode="wait" initial={false}>
        {status === "done" ? (
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
              className={styles.doneCheck}
              d="M7.5 12.5 10.5 15.5 16.5 9"
              fill="none"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 } as Record<string, number>}
              animate={{ pathLength: 1 } as Record<string, number>}
              transition={spring.snappy}
            />
          </motion.svg>
        ) : status === "active" ? (
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
  );
}

function StepCopy({ step }: { step: StepItem }) {
  return (
    <span className={styles.copy}>
      <span className={styles.label}>
        <span className="sr-only">
          {step.status === "done" ? "Fait : " : step.status === "active" ? "En cours : " : "En attente : "}
        </span>
        {step.label}
      </span>
      {step.detail && <span className={styles.detail}>{step.detail}</span>}
      {step.due && <span className={styles.due}>{step.due}</span>}
    </span>
  );
}

/**
 * Liste d'étapes (analyse, plan) : en attente, en cours (arc), fait (coche).
 * Même grille pour les trois états (done / active / pending), cliquables ou non.
 */
export function StepList({ steps, title, className, onStepComplete }: Props) {
  return (
    <div className={[styles.list, className].filter(Boolean).join(" ")} role="list" aria-label={title ?? "Étapes"}>
      {title && <p className={styles.title}>{title}</p>}
      <ol className={styles.items}>
        {steps.map((step) => {
          const canComplete = !!onStepComplete && step.status !== "done";
          const body = (
            <>
              <StepMarker status={step.status} />
              <StepCopy step={step} />
            </>
          );
          return (
            <li key={step.id} className={[styles.item, styles[step.status]].filter(Boolean).join(" ")} role="listitem">
              {canComplete ? (
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => onStepComplete(step.id)}
                  aria-label={`Marquer « ${step.label} » comme faite`}
                >
                  {body}
                </button>
              ) : (
                <div className={styles.row}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
