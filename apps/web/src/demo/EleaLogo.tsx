import { useRef } from "react";
import { useDemo } from "./demo";
import styles from "./EleaLogo.module.css";

type Props = {
  className?: string;
};

/** Marque Éléa : appui long 1 s ouvre le panneau démo (en plus de Maj + D). */
export function EleaLogo({ className }: Props) {
  const setOpen = useDemo((s) => s.setOpen);
  const timer = useRef<number>();

  return (
    <button
      type="button"
      className={[styles.logo, className].filter(Boolean).join(" ")}
      aria-label="Éléa"
      onPointerDown={() => {
        timer.current = window.setTimeout(() => setOpen(true), 1000);
      }}
      onPointerUp={() => window.clearTimeout(timer.current)}
      onPointerLeave={() => window.clearTimeout(timer.current)}
      onPointerCancel={() => window.clearTimeout(timer.current)}
    >
      Éléa
    </button>
  );
}
