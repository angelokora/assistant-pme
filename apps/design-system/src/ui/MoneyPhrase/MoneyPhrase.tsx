import { formatEuro, hardenMoneySpaces } from "../../format";
import styles from "./MoneyPhrase.module.css";

const MONEY_RE = /(\d[\d\s\u00a0\u202f]*)([\s\u00a0\u202f]*€)/;

/** Affiche un montant saisi avec les espaces fines FR (sans symbole €). */
export function formatAmountDraft(value: number): string {
  return formatEuro(value).replace(/[\s\u00a0\u202f]*€$/, "");
}

/** Parse un brouillon de montant (espaces FR acceptés). */
export function parseAmountDraft(raw: string): number {
  return Number(raw.replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
}

export type MoneyParts = {
  before: string;
  amount: number;
  /** Du symbole € jusqu'à la fin (ex. « € de ventes par jour »). */
  after: string;
};

/** Découpe la première occurrence d'un montant « N € » dans une phrase. */
export function parseMoneyPhrase(text: string): MoneyParts | null {
  const m = text.match(MONEY_RE);
  if (!m || m.index === undefined) return null;
  const amount = Number(m[1].replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
  if (Number.isNaN(amount)) return null;
  return {
    before: text.slice(0, m.index),
    amount,
    after: `${m[2]}${text.slice(m.index + m[0].length)}`,
  };
}

/** Remplace le premier montant de la phrase par `amount` (formatEuro). */
export function applyMoneyAmount(text: string, amount: number): string {
  if (!MONEY_RE.test(text)) return hardenMoneySpaces(text);
  return hardenMoneySpaces(text.replace(MONEY_RE, formatEuro(amount)));
}

/**
 * Remplace uniquement les occurrences du montant `from` (valeur numérique)
 * par `to` ; les autres montants de la phrase restent intacts.
 */
export function replaceMoneyAmount(text: string, from: number, to: number): string {
  return hardenMoneySpaces(
    text.replace(new RegExp(MONEY_RE.source, "g"), (full, digits: string) => {
      const value = Number(String(digits).replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
      if (Number.isNaN(value) || value !== from) return full;
      return formatEuro(to);
    }),
  );
}

type EditorProps = {
  before: string;
  after: string;
  amountDraft: string;
  onAmountChange: (value: string) => void;
  /** Libellé accessible du champ montant. */
  amountLabel?: string;
  className?: string;
};

/** Phrase éditable : le montant est un champ numérique inline à sa place. */
export function MoneyPhraseEditor({
  before,
  after,
  amountDraft,
  onAmountChange,
  amountLabel = "Montant en euros",
  className,
}: EditorProps) {
  function reformat() {
    const amount = parseAmountDraft(amountDraft);
    if (!Number.isNaN(amount)) onAmountChange(formatAmountDraft(amount));
  }

  return (
    <span className={[styles.phrase, className].filter(Boolean).join(" ")}>
      {before}
      <input
        className={styles.amount}
        type="text"
        inputMode="decimal"
        value={amountDraft}
        onChange={(e) => onAmountChange(e.target.value)}
        onBlur={reformat}
        aria-label={amountLabel}
        size={Math.max(amountDraft.length, 3)}
      />
      {after}
    </span>
  );
}
