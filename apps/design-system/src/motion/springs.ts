/**
 * Ressorts et variantes partagés (bibliothèque `motion`).
 * Règle : aucun composant ne définit son propre ressort. Il importe l'un de ceux-ci.
 * Voir DESIGN.md, section 5 « Mouvement ».
 */
import type { Transition, Variants } from "motion/react";

export const spring = {
  /** Retour tactile : pression, bascule, puce. Vif, sans rebond visible. */
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.7 } satisfies Transition,
  /** Entrée d'un bloc, ouverture d'une carte. Léger rebond qui donne de la vie. */
  gentle: { type: "spring", stiffness: 260, damping: 26, mass: 0.9 } satisfies Transition,
  /** Éléments qui voyagent (layoutId) : « Noté dans… » vers sa dimension. */
  travel: { type: "spring", stiffness: 180, damping: 22, mass: 1 } satisfies Transition,
  /** Feuilles et panneaux. Pas de rebond. */
  sheet: { type: "spring", stiffness: 340, damping: 38, mass: 1 } satisfies Transition,
  /** Jauges qui se remplissent. */
  gauge: { type: "spring", stiffness: 120, damping: 20, mass: 1 } satisfies Transition,
} as const;

/** Entrée en cascade des blocs d'un tour d'Éléa. */
export const blockList: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const blockItem: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { ...spring.gentle, filter: { duration: 0.3, ease: "easeOut" } } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16 } },
};

/** Pression sur un élément tactile. */
export const press = { scale: 0.97 } as const;
