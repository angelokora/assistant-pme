import { motion, type HTMLMotionProps } from "motion/react";
import { press, spring } from "../../motion/springs";
import styles from "./Avatar.module.css";

type Props = Omit<HTMLMotionProps<"button">, "children"> & {
  /** Initiales affichées (ex. « TM »). */
  initials: string;
  /** Libellé accessible. */
  label: string;
  size?: "sm" | "md";
  active?: boolean;
};

/** Avatar initiales : accès au profil (pas un onglet de navigation). */
export function Avatar({ initials, label, size = "md", active, className, ...rest }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={press}
      transition={spring.snappy}
      className={[styles.avatar, styles[size], active && styles.active, className].filter(Boolean).join(" ")}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      {...rest}
    >
      <span aria-hidden>{initials}</span>
    </motion.button>
  );
}
