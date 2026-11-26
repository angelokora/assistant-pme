import { Check } from "lucide-react";
import type { EleaDocument, Subject } from "../engine/types";
import styles from "./DocumentAttach.module.css";

type Props = {
  document: EleaDocument;
  subjects: Subject[];
  onChange: (subjectId: string | undefined) => void;
};

/** Contenu de la feuille « Rattacher à un sujet » : un sujet traité à choisir, ou « Sans sujet ». */
export function DocumentAttach({ document, subjects, onChange }: Props) {
  const current = document.subjectId;
  return (
    <div className={styles.wrap}>
      <p className={styles.lede}>{document.title}</p>
      <ul className={styles.list} aria-label={`Sujet traité de ${document.title}`}>
        {subjects.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={[styles.option, current === s.id && styles.optionCurrent].filter(Boolean).join(" ")}
              aria-pressed={current === s.id}
              onClick={() => onChange(s.id)}
            >
              <span className={styles.optionLabel}>{s.title}</span>
              {current === s.id && <Check size={18} strokeWidth={1.75} aria-hidden />}
            </button>
          </li>
        ))}
        {current && (
          <li>
            <button type="button" className={[styles.option, styles.optionNone].join(" ")} onClick={() => onChange(undefined)}>
              <span className={styles.optionLabel}>Sans sujet</span>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
