import { motion } from "motion/react";
import { Mic } from "lucide-react";
import { CLASSIC, DETAILED, SIMPLE, VIEWBOX } from "./svgs";
import styles from "./Elephant.module.css";

export type ElephantState = "idle" | "listening" | "thinking" | "speaking" | "done";

/** Pastille micro : à côté de la tête (défaut) ou sous la trompe. */
export type ElephantMic = "badge" | "trunk" | "none";

/** En dessous : pas d'éléphant (trop petit pour la version simplifiée). */
export const ELEPHANT_MIN_SIZE = 22;

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
  /** Afficher une pastille micro (bouton composer). Défaut : none. */
  mic?: ElephantMic;
  /**
   * Si true et size < ELEPHANT_MIN_SIZE : point Cherry à la place.
   * Sinon : rien n'est rendu.
   */
  fallbackDot?: boolean;
};

/**
 * Mascotte Éléa (tête d'éléphant). SVG complets dans le DOM (pas de use href).
 * Variante via CSS : détaillée / simplifiée (Vivant) ou classique.
 * Taille minimale de la version simplifiée : 22 px.
 */
export function Elephant({
  state = "idle",
  size = 56,
  className,
  decorative,
  layoutId,
  mic = "none",
  fallbackDot = false,
}: Props) {
  if (size < ELEPHANT_MIN_SIZE) {
    if (!fallbackDot) return null;
    return (
      <span
        className={[styles.dot, className].filter(Boolean).join(" ")}
        style={{ width: size, height: size }}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : LABELS[state]}
        aria-hidden={decorative || undefined}
      />
    );
  }

  const animState: Exclude<ElephantState, "done"> = state === "done" ? "idle" : state;
  const compact = size <= 32;
  const sizeBucket = size <= 24 ? "s" : size <= 64 ? "m" : "l";
  const showMic = mic !== "none";

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
      data-mic={showMic ? mic : undefined}
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
