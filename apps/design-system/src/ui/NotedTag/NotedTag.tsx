import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { BookmarkCheck } from "lucide-react";
import { ConfidenceBadge, type Confidence } from "../ConfidenceBadge/ConfidenceBadge";
import { formatEuro, hardenMoneySpaces } from "../../format";
import { spring } from "../../motion/springs";
import styles from "./NotedTag.module.css";

const MONEY_RE = /(\d[\d\s\u00a0\u202f]*)[\s\u00a0\u202f]*€/;

function splitMoney(text: string): { label: string; amount: number | null } {
  const m = text.match(MONEY_RE);
  if (!m || m.index === undefined) return { label: text, amount: null };
  const amount = Number(m[1].replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
  if (Number.isNaN(amount)) return { label: text, amount: null };
  const label = `${text.slice(0, m.index).trimEnd()} ${text.slice(m.index + m[0].length).trimStart()}`.trim();
  return { label: label || text.replace(MONEY_RE, "").trim(), amount };
}

function joinMoney(label: string, amount: number | null): string {
  const clean = label.trim();
  if (amount === null) return hardenMoneySpaces(clean);
  const money = formatEuro(amount);
  if (!clean) return money;
  // « label, amount » si le libellé n'a pas déjà de ponctuation finale.
  if (/[,:]$/.test(clean)) return hardenMoneySpaces(`${clean} ${money}`);
  return hardenMoneySpaces(`${clean}, ${money}`);
}

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
  const split = splitMoney(text);
  const [labelDraft, setLabelDraft] = useState(split.label);
  const [amountDraft, setAmountDraft] = useState(split.amount !== null ? String(split.amount) : "");
  const [saved, setSaved] = useState<string | null>(null);
  const display = saved ?? text;

  useEffect(() => {
    if (editing) return;
    const next = splitMoney(saved ?? text);
    setLabelDraft(next.label);
    setAmountDraft(next.amount !== null ? String(next.amount) : "");
  }, [text, saved, editing]);

  function beginEdit() {
    const next = splitMoney(saved ?? text);
    setLabelDraft(next.label);
    setAmountDraft(next.amount !== null ? String(next.amount) : "");
    setEditing(true);
  }

  function commit() {
    const amount =
      amountDraft.trim() === ""
        ? null
        : Number(amountDraft.replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
    const value = joinMoney(labelDraft, amount !== null && !Number.isNaN(amount) ? amount : split.amount);
    setSaved(value);
    onSave?.(value);
    setEditing(false);
  }

  const hasAmount = split.amount !== null || amountDraft.trim() !== "";

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
            <input
              autoFocus
              className={styles.input}
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              aria-label="Corriger l'information"
            />
            {hasAmount && (
              <input
                className={[styles.input, styles.amount].join(" ")}
                type="text"
                inputMode="decimal"
                value={amountDraft}
                onChange={(e) => setAmountDraft(e.target.value)}
                aria-label="Montant en euros"
                placeholder="Montant"
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
