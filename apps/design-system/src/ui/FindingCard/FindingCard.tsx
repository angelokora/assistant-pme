import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { ConfidenceBadge, type Confidence } from "../ConfidenceBadge/ConfidenceBadge";
import { ProviderLogo, type ProviderId } from "../ProviderLogo/ProviderLogo";
import { press, spring } from "../../motion/springs";
import { formatRelativeDate } from "../../format";
import styles from "./FindingCard.module.css";

export type FindingType = "answer" | "fact" | "decision" | "plan" | "document" | "action";
export type FindingOrigin = "conversation" | "document" | "gmail" | "outlook" | "drive";

const PROVIDER_ORIGIN: Partial<Record<FindingOrigin, ProviderId>> = {
  gmail: "gmail",
  outlook: "outlook",
  drive: "drive",
};

const TYPE_LABEL: Record<FindingType, string> = {
  answer: "Réponse",
  fact: "Fait",
  decision: "Décision",
  plan: "Plan",
  document: "Document",
  action: "Action",
};

const ORIGIN_LABEL: Record<FindingOrigin, string> = {
  conversation: "Conversation",
  document: "Document",
  gmail: "Gmail",
  outlook: "Outlook",
  drive: "Drive",
};

type Props = Omit<HTMLMotionProps<"button">, "children" | "type"> & {
  findingType: FindingType;
  title: string;
  /** Remplace le titre texte (ex. termes surlignés dans la recherche). */
  titleNode?: ReactNode;
  topicLabel: string;
  createdAt: string;
  /** Date de référence pour le relatif (souvent `memory.today`). */
  today?: string;
  origin: FindingOrigin;
  confidence?: Confidence;
  summary?: string;
  variant?: "default" | "compact" | "expanded";
  children?: ReactNode;
};

/** Carte d'un finding : type, titre, sujet, date relative, origine, confiance. */
export function FindingCard({
  findingType,
  title,
  titleNode,
  topicLabel,
  createdAt,
  today,
  origin,
  confidence,
  summary,
  variant = "default",
  className,
  children,
  ...rest
}: Props) {
  const relative = formatRelativeDate(createdAt, today);
  return (
    <motion.button
      type="button"
      whileTap={press}
      transition={spring.snappy}
      className={[styles.card, styles.interactive, styles[variant], className].filter(Boolean).join(" ")}
      {...rest}
    >
      <div className={styles.meta}>
        <span className={styles.type}>{TYPE_LABEL[findingType]}</span>
        {confidence && <ConfidenceBadge value={confidence} />}
      </div>
      <p className={styles.title}>{titleNode ?? title}</p>
      {variant === "expanded" && (summary || children) && (
        <div className={styles.summary}>{summary || children}</div>
      )}
      <div className={styles.foot}>
        <span className={styles.topic}>{topicLabel}</span>
        <span aria-hidden>·</span>
        <time dateTime={createdAt}>{relative}</time>
        <span aria-hidden>·</span>
        <span className={styles.origin}>
          {PROVIDER_ORIGIN[origin] ? (
            <ProviderLogo provider={PROVIDER_ORIGIN[origin]!} size={14} labelled={false} />
          ) : null}
          {ORIGIN_LABEL[origin]}
        </span>
      </div>
    </motion.button>
  );
}
