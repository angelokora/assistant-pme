import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ConfidenceBadge, spring } from "@elea/ds";
import type { ExtractionBlock } from "../engine/types";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

const REVEAL_MS = 380;

/** Valeurs extraites : une carte, lignes compactes qui apparaissent comme si elles étaient lues. */
export function ExtractionBlockView({ block, active }: BlockProps<ExtractionBlock>) {
  const [visible, setVisible] = useState(active ? 0 : block.items.length);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!active) {
      setVisible(block.items.length);
      return;
    }
    setVisible(0);
    let cancelled = false;
    let n = 0;
    let timer = 0;

    const tick = () => {
      if (cancelled) return;
      n += 1;
      setVisible(n);
      if (n < block.items.length) {
        timer = window.setTimeout(tick, REVEAL_MS);
      }
    };

    timer = window.setTimeout(tick, REVEAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, block.items.length]);

  const showTotal = visible >= block.items.length && block.total;

  return (
    <section className={styles.extraction}>
      <h2 className="voice">{block.title}</h2>
      <div className={styles.extractionCard}>
        <ul className={styles.extractionList}>
          <AnimatePresence initial={false}>
            {block.items.slice(0, visible).map((item) => {
              const value = edits[item.id] ?? item.value;
              const isEditing = editing === item.id;
              return (
                <motion.li
                  key={item.id}
                  className={styles.extractionItem}
                  initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...spring.gentle, filter: { duration: 0.3, ease: "easeOut" } }}
                  layout
                >
                  {isEditing ? (
                    <form
                      className={styles.extractionForm}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const next = draft.trim() || item.value;
                        setEdits((prev) => ({ ...prev, [item.id]: next }));
                        setEditing(null);
                      }}
                    >
                      <span className={styles.extractionLabel}>{item.label}</span>
                      <input
                        autoFocus
                        className={styles.extractionInput}
                        value={draft}
                        aria-label={`Corriger ${item.label}`}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => {
                          const next = draft.trim() || item.value;
                          setEdits((prev) => ({ ...prev, [item.id]: next }));
                          setEditing(null);
                        }}
                      />
                      <button type="submit" className={styles.extractionSave}>
                        Enregistrer
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className={styles.extractionRow}
                      onClick={() => {
                        setEditing(item.id);
                        setDraft(value);
                      }}
                    >
                      <span className={styles.extractionMain}>
                        <span className={styles.extractionLabel}>{item.label}</span>
                        <span className={styles.extractionValue}>{value}</span>
                      </span>
                      <span className={styles.extractionMeta}>
                        <span className={styles.extractionSource}>{item.source}</span>
                        <ConfidenceBadge value={edits[item.id] ? "confirmed" : item.confidence} />
                      </span>
                    </button>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {showTotal && block.total && (
          <motion.div
            className={styles.extractionTotal}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
          >
            <span>{block.total.label}</span>
            <strong className="tabular">{block.total.value}</strong>
          </motion.div>
        )}
      </div>
    </section>
  );
}
