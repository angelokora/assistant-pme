import styles from "./Skeleton.module.css";

type Props = {
  variant?: "line" | "block";
  width?: string | number;
  height?: string | number;
  className?: string;
  /** Nombre de lignes (variant line). */
  lines?: number;
};

/** Placeholder de chargement : ligne ou bloc. */
export function Skeleton({ variant = "line", width, height, className, lines = 1 }: Props) {
  if (variant === "block") {
    return (
      <span
        className={[styles.skeleton, styles.block, className].filter(Boolean).join(" ")}
        style={{ width, height }}
        aria-hidden
      />
    );
  }
  return (
    <span className={className} aria-hidden style={{ display: "grid", gap: 8 }}>
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className={[styles.skeleton, styles.line].join(" ")}
          style={{ width: i === lines - 1 && lines > 1 ? "72%" : width, height }}
        />
      ))}
    </span>
  );
}
