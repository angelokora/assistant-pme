import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { spring } from "../../motion/springs";
import styles from "./ActionDock.module.css";

type Props = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
};

/**
 * Barre d'actions collante (mobile) : surface et entrée animée, sans logique métier.
 * Voir DESIGN.md, composant ActionDock.
 */
export function ActionDock({ children, className, ...rest }: Props) {
  return (
    <motion.div
      className={[styles.dock, className].filter(Boolean).join(" ")}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={spring.gentle}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
