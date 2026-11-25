import { useState } from "react";
import { motion } from "motion/react";
import { BookmarkCheck } from "lucide-react";
import { ConfidenceBadge, type Confidence } from "../ConfidenceBadge/ConfidenceBadge";
import { spring } from "../../motion/springs";
import styles from "./NotedTag.module.css";

type Props = {
  targetLabel: string;
  text: string;
  confidence?: Confidence;
  editable?: boolean;
  onSave?: (text: string) => void;
  /** Attribut utilisé comme point de départ du vol vers la dimension. */
  sourceId?: string;
};

/** « Noté dans Mes finances » : ce qu'Éléa vient de retenir, corrigeable en place. */
export function NotedTag({ targetLabel, text, confidence, editable, onSave, sourceId }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <motion.div layout transition={spring.gentle} className={styles.tag} data-noted-source={sourceId}>
      <span className={styles.mark} aria-hidden>
        <BookmarkCheck size={16} strokeWidth={2} />
      </span>
      <div className={styles.content}>
        <span className={styles.eyebrow}>
          Noté dans <strong>{targetLabel}</strong>
        </span>
        {editing ? (
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              const value = draft.trim() || text;
              setSaved(value);
              onSave?.(value);
              setEditing(false);
            }}
          >
            <input autoFocus className={styles.input} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Corriger l'information" />
            <button type="submit" className={styles.save}>
              Enregistrer
            </button>
          </form>
        ) : (
          <span className={styles.text}>{saved ?? text}</span>
        )}
        {confidence && !editing && <ConfidenceBadge value={saved ? "confirmed" : confidence} />}
      </div>
      {editable && !editing && (
        <button type="button" className={styles.edit} onClick={() => setEditing(true)}>
          Modifier
        </button>
      )}
    </motion.div>
  );
}
