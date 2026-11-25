import { Check } from "lucide-react";
import styles from "./blocks.module.css";

/** État « fait » compact après un événement de bloc (pas d'écho parole). */
export function BlockDone({ summary }: { summary: string }) {
  return (
    <p className={styles.blockDone} role="status">
      <Check size={16} strokeWidth={2.4} aria-hidden />
      <span>{summary}</span>
    </p>
  );
}
