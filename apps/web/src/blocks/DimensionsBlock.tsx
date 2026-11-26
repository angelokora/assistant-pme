import { useEffect, useRef, useState } from "react";
import { DimensionCard, Sheet } from "@elea/ds";
import type { DimensionsBlock } from "../engine/types";
import { useMemory, useGauges } from "../memory/store";
import { Icon } from "./icons";
import { useStrip } from "./strip";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

export function DimensionGrid({ ids, compact }: { ids: string[]; compact?: boolean }) {
  const dimensions = useMemory((s) => s.dimensions);
  const findings = useMemory((s) => s.findings);
  const shown = useGauges((s) => s.shown);
  const pulses = useGauges((s) => s.pulses);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = dimensions.find((d) => d.id === openId);
  const openFindings = open
    ? findings.filter((f) => f.dimensionId === open.id)
    : [];

  return (
    <>
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
              onClick={compact ? undefined : () => setOpenId(d.id)}
            />
          );
        })}
      </div>
      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.label}>
        {open && (
          <div className={styles.dimSheet}>
            <p className={styles.dimSheetLead}>
              {open.summary && open.summary !== "À découvrir"
                ? open.summary
                : "Je n'ai encore rien de précis sur cette dimension."}
            </p>
            {openFindings.length > 0 ? (
              <ul className={styles.dimSheetList}>
                {openFindings.map((f) => (
                  <li key={f.id}>
                    <strong>{f.title}</strong>
                    <span>{f.summary}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.dimSheetEmpty}>Aucun constat rangé pour l'instant.</p>
            )}
          </div>
        )}
      </Sheet>
    </>
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
