import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { press, spring } from "../../motion/springs";
import styles from "./Card.module.css";

type Props = Omit<HTMLMotionProps<"div">, "children"> & {
  interactive?: boolean;
  selected?: boolean;
  tone?: "surface" | "sunken" | "memory" | "info" | "presence";
  padding?: "sm" | "md" | "lg";
  children: ReactNode;
};

/** Surface de base. Interactive = survol, pression et focus. */
export function Card({ interactive, selected, tone = "surface", padding = "md", className, children, ...rest }: Props) {
  return (
    <motion.div
      whileTap={interactive ? press : undefined}
      transition={spring.snappy}
      tabIndex={interactive ? 0 : undefined}
      className={[styles.card, styles[tone], styles[`p-${padding}`], interactive && styles.interactive, selected && styles.selected, className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
