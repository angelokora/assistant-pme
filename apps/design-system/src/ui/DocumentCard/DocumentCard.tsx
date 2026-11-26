import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { ProviderLogo, type ProviderId } from "../ProviderLogo/ProviderLogo";
import { formatDate } from "../../format";
import styles from "./DocumentCard.module.css";

export type DocumentOrigin = "import" | "gmail" | "drive" | "outlook";

const PROVIDER: Partial<Record<DocumentOrigin, ProviderId>> = { gmail: "gmail", outlook: "outlook", drive: "drive" };
const ORIGIN_LABEL: Record<DocumentOrigin, string> = { import: "Import", gmail: "Gmail", outlook: "Outlook", drive: "Drive" };

type Props = {
  title: string;
  /** Remplace le titre texte (ex. termes surlignés dans la recherche). */
  titleNode?: ReactNode;
  /** « Facture », « Contrat »… */
  kindLabel: string;
  /** ISO date ou date-heure. */
  addedAt: string;
  origin: DocumentOrigin;
  /** Sujet traité rattaché (sinon « Sans sujet »). */
  subjectLabel?: string;
  /** Remplace le libellé du sujet (ex. lien vers la page du sujet). Hors zone `onOpen`. */
  subjectNode?: ReactNode;
  findingCount: number;
  summary?: string;
  variant?: "default" | "compact";
  /** Mis en avant (arrivée depuis la recherche). */
  highlighted?: boolean;
  /** Rend la zone principale cliquable. */
  onOpen?: () => void;
  /** Zone d'actions sous la carte (rattacher, détacher). */
  actions?: ReactNode;
  id?: string;
};

/** Carte d'un document de l'entreprise : nom, type, date, source, sujet rattaché, constats tirés. */
export function DocumentCard({
  title,
  titleNode,
  kindLabel,
  addedAt,
  origin,
  subjectLabel,
  subjectNode,
  findingCount,
  summary,
  variant = "default",
  highlighted,
  onOpen,
  actions,
  id,
}: Props) {
  const body = (
    <>
      <span className={styles.icon} aria-hidden>
        <FileText size={20} strokeWidth={1.75} />
      </span>
      <span className={styles.body}>
        <span className={styles.kind}>{kindLabel}</span>
        <span className={styles.title}>{titleNode ?? title}</span>
        {variant === "default" && summary && <span className={styles.summary}>{summary}</span>}
        <span className={styles.foot}>
          <span className={[styles.subject, !subjectLabel && !subjectNode && styles.subjectNone].filter(Boolean).join(" ")}>
            {subjectNode ?? subjectLabel ?? "Sans sujet"}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={addedAt}>{formatDate(addedAt, "short")}</time>
          <span aria-hidden>·</span>
          <span className={styles.origin}>
            {PROVIDER[origin] ? <ProviderLogo provider={PROVIDER[origin]!} size={14} labelled={false} /> : null}
            {ORIGIN_LABEL[origin]}
          </span>
          <span aria-hidden>·</span>
          <span className={styles.count}>
            {findingCount === 0 ? "Aucun constat" : findingCount === 1 ? "1 constat" : `${findingCount} constats`}
          </span>
        </span>
      </span>
    </>
  );

  return (
    <article
      id={id}
      className={[styles.card, styles[variant], highlighted && styles.highlighted].filter(Boolean).join(" ")}
    >
      {onOpen ? (
        <button type="button" className={[styles.main, styles.interactive].join(" ")} onClick={onOpen}>
          {body}
        </button>
      ) : (
        <div className={styles.main}>{body}</div>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  );
}
