import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { press, spring } from "../../motion/springs";
import styles from "./Chip.module.css";

type Props = Omit<HTMLMotionProps<"button">, "children"> & { selected?: boolean; icon?: ReactNode; children: ReactNode };

/** Réponse rapide, filtre ou suggestion. */
export function Chip({ selected, icon, children, className, ...rest }: Props) {
  return (
    <motion.button
      whileTap={press}
      transition={spring.snappy}
      aria-pressed={selected}
      className={[styles.chip, selected && styles.selected, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}
