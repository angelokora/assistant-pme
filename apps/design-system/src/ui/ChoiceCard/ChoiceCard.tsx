import type { KeyboardEvent, ReactNode } from "react";
import { motion } from "motion/react";
import { press, spring } from "../../motion/springs";
import styles from "./ChoiceCard.module.css";

type Props = {
  /** Identifiant pour le radiogroup (navigation clavier). */
  id: string;
  title: string;
  body?: string;
  meta?: string;
  recommended?: boolean;
  selected?: boolean;
  /** Affaiblit la carte quand une autre est sélectionnée dans le groupe. */
  dimmed?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
  children?: ReactNode;
};

/** Option sélectionnable : radio personnalisé, badge recommandé, élévation à la sélection. */
export function ChoiceCard({
  id,
  title,
  body,
  meta,
  recommended,
  selected,
  dimmed,
  disabled,
  onSelect,
  className,
  children,
}: Props) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={!!selected}
      data-choice-id={id}
      disabled={disabled}
      whileTap={disabled ? undefined : press}
      transition={spring.snappy}
      onClick={onSelect}
      className={[
        styles.card,
        selected && styles.selected,
        dimmed && styles.dimmed,
        disabled && styles.disabled,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.radio} aria-hidden>
        <span className={styles.radioDot} />
      </span>
      <span className={styles.content}>
        <span className={styles.head}>
          <span className={styles.title}>{title}</span>
          {recommended && <span className={styles.badge}>Recommandé</span>}
        </span>
        {body && <span className={styles.body}>{body}</span>}
        {meta && <span className={styles.meta}>{meta}</span>}
        {children}
      </span>
    </motion.button>
  );
}

type GroupProps = {
  label: string;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Groupe radio accessible : flèches pour changer d'option, Espace / Entrée pour confirmer le focus.
 * Les enfants sont des ChoiceCard ; le parent gère la valeur.
 */
export function ChoiceGroup({ label, value, onChange, disabled, children, className }: GroupProps) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const root = e.currentTarget;
    const radios = [...root.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])')];
    if (!radios.length) return;
    const current = radios.findIndex((el) => el.getAttribute("aria-checked") === "true");
    const focused = radios.indexOf(document.activeElement as HTMLElement);
    const from = focused >= 0 ? focused : Math.max(0, current);

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = radios[(from + 1) % radios.length];
      next.focus();
      const id = next.dataset.choiceId;
      if (id) onChange(id);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = radios[(from - 1 + radios.length) % radios.length];
      next.focus();
      const id = next.dataset.choiceId;
      if (id) onChange(id);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const el = (document.activeElement as HTMLElement) ?? radios[Math.max(0, current)];
      const id = el?.dataset.choiceId;
      if (id) onChange(id);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-value={value}
      className={[styles.group, className].filter(Boolean).join(" ")}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}
