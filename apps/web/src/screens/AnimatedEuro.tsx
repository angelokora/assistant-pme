import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { formatEuro } from "@elea/ds";

/** Compteur euro animé à l'apparition (accueil). */
export function AnimatedEuro({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, value, {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [value]);
  return (
    <span className={className} aria-label={formatEuro(value)}>
      {formatEuro(shown)}
    </span>
  );
}

/**
 * Rend un texte en animant chaque montant « N € » / « N NNN € ».
 * Le reste du texte reste inchangé (données mémoire, pas de scénario).
 */
export function AnimatedMoneyText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\d[\d\s]*\s*€)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const m = part.match(/^([\d\s]+)\s*€$/);
        if (!m) return <span key={i}>{part}</span>;
        const value = Number(m[1].replace(/\s/g, ""));
        if (Number.isNaN(value)) return <span key={i}>{part}</span>;
        return <AnimatedEuro key={`${i}-${value}`} value={value} />;
      })}
    </span>
  );
}
