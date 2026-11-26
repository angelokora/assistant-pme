import { motion } from "motion/react";
import { Mic } from "lucide-react";
import { CLASSIC, DETAILED, SIMPLE, VIEWBOX } from "./svgs";
import styles from "./Elephant.module.css";

export type ElephantState = "idle" | "listening" | "thinking" | "speaking" | "done";

/** Pastille micro : à côté de la tête (défaut) ou sous la trompe. */
export type ElephantMic = "badge" | "trunk" | "none";

const LABELS: Record<ElephantState, string> = {
  idle: "Éléa est disponible",
  listening: "Éléa vous écoute",
  thinking: "Éléa réfléchit",
  speaking: "Éléa répond",
  done: "Éléa a terminé",
};

type Props = {
  state?: ElephantState;
  /** Conservé pour compatibilité avec l'ancienne Orb (non utilisé par le SVG). */
  level?: number;
  size?: number;
  className?: string;
  decorative?: boolean;
  layoutId?: string;
  /** Afficher une pastille micro (bouton composer). Défaut : badge. */
  mic?: ElephantMic;
};

/**
 * Mascotte Éléa (tête d'éléphant). SVG complets dans le DOM (pas de use href).
 * Variante via CSS : détaillée / simplifiée (Vivant) ou classique.
 */
export function Elephant({
  state = "idle",
  size = 56,
  className,
  decorative,
  layoutId,
  mic = "none",
}: Props) {
  const animState: Exclude<ElephantState, "done"> = state === "done" ? "idle" : state;
  const compact = size <= 32;
  const sizeBucket = size <= 24 ? "s" : size <= 64 ? "m" : "l";
  const showMic = mic !== "none" && sizeBucket !== "s";

  return (
    <motion.span
      layoutId={layoutId}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : LABELS[state]}
      aria-hidden={decorative || undefined}
      className={[styles.root, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      data-state={animState}
      data-compact={compact || undefined}
      data-size={sizeBucket}
    >
      <svg
        className={[styles.svg, styles.detailed].join(" ")}
        viewBox={VIEWBOX}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: DETAILED }}
      />
      <svg
        className={[styles.svg, styles.simple].join(" ")}
        viewBox={VIEWBOX}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: SIMPLE }}
      />
      <svg
        className={[styles.svg, styles.classic].join(" ")}
        viewBox={VIEWBOX}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: CLASSIC }}
      />
      {showMic && (
        <span className={mic === "trunk" ? styles.micTrunk : styles.micBadge} aria-hidden>
          <Mic strokeWidth={2} />
        </span>
      )}
    </motion.span>
  );
}
