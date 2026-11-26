import type { EleaDocument, Subject } from "../engine/types";
import styles from "./DocumentAttach.module.css";

type Props = {
  document: EleaDocument;
  subjects: Subject[];
  onChange: (subjectId: string | undefined) => void;
};

/** Rattacher un document à un sujet traité, ou le détacher (« Sans sujet »). */
export function DocumentAttach({ document, subjects, onChange }: Props) {
  return (
    <label className={styles.field}>
      <span>Sujet traité</span>
      <select
        className={styles.select}
        value={document.subjectId ?? ""}
        aria-label={`Sujet traité de ${document.title}`}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">Sans sujet</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
    </label>
  );
}
