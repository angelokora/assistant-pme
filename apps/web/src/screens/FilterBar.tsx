import type { ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./FilterBar.module.css";

type SectionProps = {
  children: ReactNode;
  className?: string;
};

/** Enveloppe des barres de filtres : espace de groupe avant la liste. */
export function FilterSection({ children, className }: SectionProps) {
  return <div className={[styles.section, className].filter(Boolean).join(" ")}>{children}</div>;
}

type BarProps = {
  children: ReactNode;
  "aria-label": string;
  /** Titre visible au-dessus de la rangée (ex. dans une feuille de filtres). */
  title?: string;
};

/** Rangée de puces de filtre. */
export function FilterBar({ children, "aria-label": ariaLabel, title }: BarProps) {
  const bar = (
    <div className={styles.bar} role="toolbar" aria-label={ariaLabel}>
      {children}
    </div>
  );
  if (!title) return bar;
  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>{title}</p>
      {bar}
    </div>
  );
}

type ChipProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  /** Sans compteur : puce simple (ex. filtre actif retirable). */
  count?: number;
  /** Compteur à 0 : visible mais atténué, non cliquable. */
  muted?: boolean;
  /** Affiche une croix : un clic retire le filtre. */
  removable?: boolean;
};

export function FilterChip({ active, onClick, label, count, muted, removable }: ChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, active && styles.chipActive, muted && styles.chipMuted].filter(Boolean).join(" ")}
      onClick={muted ? undefined : onClick}
      disabled={muted}
      aria-pressed={removable ? undefined : active}
      aria-disabled={muted || undefined}
      aria-label={removable ? `Retirer le filtre ${label}` : undefined}
    >
      {label}
      {count !== undefined && <span className={styles.chipCount}>{count}</span>}
      {removable && <X size={14} strokeWidth={1.75} aria-hidden />}
    </button>
  );
}
