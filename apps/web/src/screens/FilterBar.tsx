import type { ReactNode } from "react";
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
};

/** Rangée de puces de filtre. */
export function FilterBar({ children, "aria-label": ariaLabel }: BarProps) {
  return (
    <div className={styles.bar} role="toolbar" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

type ChipProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  /** Compteur à 0 : visible mais atténué, non cliquable. */
  muted?: boolean;
};

export function FilterChip({ active, onClick, label, count, muted }: ChipProps) {
  return (
    <button
      type="button"
      className={[styles.chip, active && styles.chipActive, muted && styles.chipMuted].filter(Boolean).join(" ")}
      onClick={muted ? undefined : onClick}
      disabled={muted}
      aria-pressed={active}
      aria-disabled={muted || undefined}
    >
      {label}
      <span className={styles.chipCount}>{count}</span>
    </button>
  );
}
