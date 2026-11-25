import { useEffect, useRef } from "react";
import styles from "./Waveform.module.css";

type Props = { level: number; active?: boolean; bars?: number };

/** Visualisation de la voix : barres qui suivent le niveau, avec une ondulation organique. */
export function Waveform({ level, active = true, bars = 22 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const el = ref.current;
      if (el) {
        const t = (now - start) / 1000;
        const l = active ? levelRef.current : 0;
        el.childNodes.forEach((node, i) => {
          const wave = 0.5 + 0.5 * Math.sin(t * 7 + i * 0.7) * Math.cos(t * 3.1 + i * 0.33);
          const center = 1 - Math.abs(i - bars / 2) / (bars / 2);
          const h = 0.12 + l * (0.35 + 0.65 * wave) * (0.45 + 0.55 * center);
          (node as HTMLElement).style.transform = `scaleY(${Math.min(1, h)})`;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, bars]);

  return (
    <div ref={ref} className={styles.wave} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className={styles.bar} style={{ ["--i" as string]: i / bars }} />
      ))}
    </div>
  );
}
