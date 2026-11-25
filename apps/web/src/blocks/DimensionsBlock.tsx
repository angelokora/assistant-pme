import { useEffect, useRef } from "react";
import { DimensionCard } from "@elea/ds";
import type { DimensionsBlock } from "../engine/types";
import { useMemory, useGauges } from "../memory/store";
import { Icon } from "./icons";
import { useStrip } from "./strip";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

export function DimensionGrid({ ids, compact }: { ids: string[]; compact?: boolean }) {
  const dimensions = useMemory((s) => s.dimensions);
  const shown = useGauges((s) => s.shown);
  const pulses = useGauges((s) => s.pulses);
  return (
    <div className={compact ? styles.dimStrip : styles.dimGrid}>
      {ids.map((id) => {
        const d = dimensions.find((x) => x.id === id);
        if (!d) return null;
        return (
          <DimensionCard
            key={d.id}
            id={d.id}
            label={d.label}
            icon={<Icon name={d.icon} />}
            tone={d.tone}
            summary={d.summary}
            progress={shown[d.id] ?? d.progress}
            status={d.status}
            pulseKey={pulses[d.id]}
            compact={compact}
          />
        );
      })}
    </div>
  );
}

export function DimensionsBlockView({ block }: BlockProps<DimensionsBlock>) {
  const ref = useRef<HTMLDivElement>(null);
  const setStrip = useStrip((s) => s.set);

  // Le bandeau collant n'apparaît que lorsque ce bloc sort de l'écran.
  useEffect(() => {
    setStrip({ ids: block.dimensionIds });
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStrip({ blockVisible: e.isIntersecting }), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [block.dimensionIds, setStrip]);

  return (
    <section ref={ref} className={styles.dimensions}>
      {(block.title || block.subtitle) && (
        <header className={styles.dimHeader}>
          {block.title && <h2 className="voice">{block.title}</h2>}
          {block.subtitle && <p className="muted">{block.subtitle}</p>}
        </header>
      )}
      <DimensionGrid ids={block.dimensionIds} compact={block.compact} />
    </section>
  );
}
