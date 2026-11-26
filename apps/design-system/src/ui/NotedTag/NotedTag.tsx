import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookmarkCheck } from "lucide-react";
import { ConfidenceBadge, type Confidence } from "../ConfidenceBadge/ConfidenceBadge";
import {
  applyMoneyAmount,
  formatAmountDraft,
  MoneyPhraseEditor,
  parseMoneyPhrase,
} from "../MoneyPhrase/MoneyPhrase";
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
  const [saved, setSaved] = useState<string | null>(null);
  const display = saved ?? text;
  const parts = parseMoneyPhrase(display);
  const [amountDraft, setAmountDraft] = useState(parts ? formatAmountDraft(parts.amount) : "");
  const [textDraft, setTextDraft] = useState(display);

  useEffect(() => {
    if (editing) return;
    const next = parseMoneyPhrase(saved ?? text);
    setAmountDraft(next ? formatAmountDraft(next.amount) : "");
    setTextDraft(saved ?? text);
  }, [text, saved, editing]);

  function beginEdit() {
    const current = saved ?? text;
    const next = parseMoneyPhrase(current);
    setAmountDraft(next ? formatAmountDraft(next.amount) : "");
    setTextDraft(current);
    setEditing(true);
  }

  function commit() {
    let value = textDraft.trim() || display;
    if (parts) {
      const amount = Number(amountDraft.replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
      if (!Number.isNaN(amount)) value = applyMoneyAmount(display, amount);
    }
    setSaved(value);
    onSave?.(value);
    setEditing(false);
  }

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
              commit();
            }}
          >
            {parts ? (
              <MoneyPhraseEditor
                before={parts.before}
                after={parts.after}
                amountDraft={amountDraft}
                onAmountChange={setAmountDraft}
                className={styles.phrase}
              />
            ) : (
              <input
                autoFocus
                className={styles.input}
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                aria-label="Corriger l'information"
              />
            )}
            <button type="submit" className={styles.save}>
              Enregistrer
            </button>
          </form>
        ) : (
          <span className={styles.text}>{display}</span>
        )}
        {confidence && !editing && <ConfidenceBadge value={saved ? "confirmed" : confidence} />}
      </div>
      {editable && !editing && (
        <button type="button" className={styles.edit} onClick={beginEdit}>
          Modifier
        </button>
      )}
    </motion.div>
  );
}
