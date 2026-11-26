import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { formatEuro } from "@elea/ds";

const MONEY_CHUNK = /(\d[\d\s\u00a0\u202f]*[\s\u00a0\u202f]*€)/g;
const MONEY_ONE = /^([\d\s\u00a0\u202f]+)[\s\u00a0\u202f]*€$/;

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
  const parts = text.split(MONEY_CHUNK);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const m = part.match(MONEY_ONE);
        if (!m) return <span key={i}>{part}</span>;
        const value = Number(m[1].replace(/[\s\u00a0\u202f]/g, ""));
        if (Number.isNaN(value)) return <span key={i}>{part}</span>;
        return <AnimatedEuro key={`${i}-${value}`} value={value} />;
      })}
    </span>
  );
}
