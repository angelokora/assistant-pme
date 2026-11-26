import { useState, type ReactNode } from "react";
import { ChevronDown, BookmarkCheck } from "lucide-react";
import { ConfidenceBadge, type Confidence } from "../ConfidenceBadge/ConfidenceBadge";
import styles from "./AnswerCard.module.css";

export type AnswerSection = { heading: string; text: string };
export type AnswerSource = { label: string; detail?: string };

type Props = {
  title: string;
  summary: string;
  sections?: AnswerSection[];
  keyPoints?: string[];
  recommendation?: string;
  sources?: AnswerSource[];
  confidence?: Confidence;
  savedTo?: { label: string; onClick?: () => void };
  /** Contenu additionnel sous la fiche (ex. suggestions). */
  children?: ReactNode;
};

/** Fiche de réponse structurée (pas une bulle) : titre, résumé, sections, recommandation. */
export function AnswerCard({
  title,
  summary,
  sections,
  keyPoints,
  recommendation,
  sources,
  confidence,
  savedTo,
  children,
}: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((sections ?? []).map((_, i) => [String(i), i === 0])),
  );

  return (
    <article className={styles.card}>
      <header className={styles.head}>
        <div className={styles.headRow}>
          <p className={styles.eyebrow}>Réponse</p>
          {confidence && <ConfidenceBadge value={confidence} />}
        </div>
        <h2 className={["voice", styles.title].join(" ")}>{title}</h2>
        <p className={styles.summary}>{summary}</p>
      </header>

      {keyPoints && keyPoints.length > 0 && (
        <ul className={styles.keys}>
          {keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      )}

      {sections && sections.length > 0 && (
        <div className={styles.sections}>
          {sections.map((s, i) => {
            const id = String(i);
            const isOpen = open[id];
            return (
              <div key={s.heading} className={styles.section}>
                <button
                  type="button"
                  className={styles.sectionToggle}
                  aria-expanded={isOpen}
                  onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))}
                >
                  <span>{s.heading}</span>
                  <ChevronDown size={18} strokeWidth={1.75} className={isOpen ? styles.chevronOpen : undefined} aria-hidden />
                </button>
                {isOpen && <p className={styles.sectionText}>{s.text}</p>}
              </div>
            );
          })}
        </div>
      )}

      {recommendation && (
        <div className={styles.reco}>
          <p className={styles.recoLabel}>Recommandation</p>
          <p className={styles.recoText}>{recommendation}</p>
        </div>
      )}

      {sources && sources.length > 0 && (
        <ul className={styles.sources}>
          {sources.map((s) => (
            <li key={s.label}>
              <strong>{s.label}</strong>
              {s.detail && <span>{s.detail}</span>}
            </li>
          ))}
        </ul>
      )}

      {savedTo && (
        <button type="button" className={styles.saved} onClick={savedTo.onClick} disabled={!savedTo.onClick}>
          <BookmarkCheck size={16} strokeWidth={2} aria-hidden />
          Rangé dans {savedTo.label}
        </button>
      )}

      {children}
    </article>
  );
}
