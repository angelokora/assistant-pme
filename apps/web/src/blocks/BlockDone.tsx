import { motion } from "motion/react";
import { Check } from "lucide-react";
import { spring } from "@elea/ds";
import styles from "./blocks.module.css";

type Props = {
  summary: string;
  /** Action secondaire sous le résumé (ex. « Voir le plan »). */
  action?: { label: string; onClick: () => void };
};

/** État « fait » compact : résumé de la décision, pas le libellé d'un bouton. */
export function BlockDone({ summary, action }: Props) {
  return (
    <motion.div className={styles.blockDoneWrap} layout transition={spring.gentle} role="status">
      <p className={styles.blockDone}>
        <Check size={16} strokeWidth={2.4} aria-hidden />
        <span>{summary}</span>
      </p>
      {action && (
        <button type="button" className={styles.blockDoneAction} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
