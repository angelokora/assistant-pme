import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { press, spring } from "../../motion/springs";
import styles from "./Button.module.css";

type Props = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: "primary" | "secondary" | "ghost" | "inverse";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  iconEnd?: ReactNode;
  full?: boolean;
  loading?: boolean;
  children?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", icon, iconEnd, full, loading, children, className, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : press}
      transition={spring.snappy}
      className={[styles.button, styles[variant], styles[size], full && styles.full, className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : icon}
      {children && <span>{children}</span>}
      {iconEnd}
    </motion.button>
  );
});

type IconButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  label: string;
  children: ReactNode;
  variant?: "plain" | "soft" | "inverse";
  size?: "sm" | "md";
};

export function IconButton({ label, children, variant = "plain", size = "md", className, ...rest }: IconButtonProps) {
  return (
    <motion.button
      whileTap={press}
      transition={spring.snappy}
      aria-label={label}
      title={label}
      className={[styles.icon, styles[`icon-${variant}`], styles[`icon-${size}`], className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
