import styles from "./ConfidenceBadge.module.css";

export type Confidence = "confirmed" | "estimated" | "to-check";
const LABEL: Record<Confidence, string> = { confirmed: "Confirmé", estimated: "Estimé", "to-check": "À vérifier" };

export function ConfidenceBadge({ value }: { value: Confidence }) {
  return (
    <span className={[styles.badge, styles[value]].join(" ")}>
      <span className={styles.dot} aria-hidden />
      {LABEL[value]}
    </span>
  );
}
