import { useEffect, useMemo, useState } from "react";
import { Button, ChoiceCard, ChoiceGroup, Orb, StepList, formatDate, spring } from "@elea/ds";
import { motion } from "motion/react";
import type { ChoiceBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import { useMemory } from "../memory/store";
import { ActionSlot } from "./ActionSlot";
import { BlockDone } from "./BlockDone";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

/** Choix parmi des options (priorités, plans). */
export function ChoiceBlockView({ block, active }: BlockProps<ChoiceBlock>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const resolution = usePlayer((s) => s.resolutions[block.id]);
  const plans = useMemory((s) => s.plans);
  const recommended = useMemo(
    () => block.options.find((o) => o.recommended)?.id ?? block.options[0]?.id ?? "",
    [block.options],
  );
  const [selected, setSelected] = useState(recommended);
  const canAct = active && awaiting?.kind === "choice" && awaiting.blockId === block.id;

  useEffect(() => {
    setSelected(recommended);
  }, [recommended, block.id]);

  function confirm() {
    if (!canAct || !selected) return;
    const option = block.options.find((o) => o.id === selected);
    reply({
      kind: "event",
      blockId: block.id,
      value: selected,
      label: option?.title ?? selected,
      vars: block.sideDetail === "plan" ? { planId: selected } : undefined,
    });
  }

  if (resolution) {
    return (
      <section className={styles.choice}>
        <BlockDone summary={resolution.summary} />
      </section>
    );
  }

  // Tour passé : l'écho porte le titre de l'option ; on ne garde pas les cartes.
  if (!active) return null;

  const selectedPlan = block.sideDetail === "plan" ? plans.find((p) => p.id === selected) : undefined;
  const showSide = block.sideDetail === "plan";

  return (
    <section className={[styles.choice, showSide && styles.choiceWithSide].filter(Boolean).join(" ")}>
      <div className={styles.choiceMain}>
        {(block.eyebrow || block.title) && (
          <header className={styles.choiceHeader}>
            {block.eyebrow && (
              <div className={styles.choiceEyebrow}>
                <Orb size={56} state="done" layoutId="elea-presence" decorative />
                <p className={styles.choiceEyebrowLabel}>{block.eyebrow}</p>
              </div>
            )}
            <motion.h2
              className="voice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.gentle}
            >
              {block.title}
            </motion.h2>
            {block.subtitle && <p className={styles.choiceSubtitle}>{block.subtitle}</p>}
          </header>
        )}

        <ChoiceGroup label={block.title} value={selected} onChange={setSelected} disabled={!canAct}>
          {block.options.map((opt) => (
            <ChoiceCard
              key={opt.id}
              id={opt.id}
              title={opt.title}
              body={opt.body}
              meta={opt.meta}
              recommended={opt.recommended}
              selected={selected === opt.id}
              dimmed={selected !== opt.id}
              disabled={!canAct}
              onSelect={() => setSelected(opt.id)}
            />
          ))}
        </ChoiceGroup>

        <ActionSlot active={canAct && !block.allowFreeInput}>
          <div className={styles.choiceActions}>
            <Button full onClick={confirm} disabled={!canAct || !selected}>
              {block.confirmLabel}
            </Button>
          </div>
        </ActionSlot>

        {/* allowFreeInput : bouton dans le bloc pour laisser le composer accessible. */}
        {block.allowFreeInput && canAct && (
          <div className={styles.choiceActions}>
            <Button full onClick={confirm} disabled={!selected}>
              {block.confirmLabel}
            </Button>
          </div>
        )}
      </div>

      {showSide && (
        <aside className={styles.choiceSide} aria-live="polite">
          {selectedPlan ? (
            <div className={styles.planPreview}>
              <p className={styles.planEyebrow}>Aperçu</p>
              <h3 className={styles.planTitle}>{selectedPlan.title}</h3>
              <p className={styles.planGoal}>{selectedPlan.goal}</p>
              <StepList
                steps={selectedPlan.steps.map((s) => ({
                  id: s.id,
                  label: s.title,
                  detail: s.detail,
                  due: formatDate(s.due, "weekday"),
                  status: "pending" as const,
                }))}
              />
            </div>
          ) : (
            <div className={styles.planPreview}>
              <p className={styles.planEyebrow}>Aperçu</p>
              <h3 className={styles.planTitle}>{block.options.find((o) => o.id === selected)?.title}</h3>
              <p className={styles.planGoal}>{block.options.find((o) => o.id === selected)?.body}</p>
              {block.options.find((o) => o.id === selected)?.meta && (
                <p className={styles.planMeta}>{block.options.find((o) => o.id === selected)?.meta}</p>
              )}
            </div>
          )}
        </aside>
      )}
    </section>
  );
}
