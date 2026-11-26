import { useEffect, useMemo, useState } from "react";
import { Button, ChoiceCard, ChoiceGroup, Elephant, StepList, formatDate, spring } from "@elea/ds";
import { motion } from "motion/react";
import type { ChoiceBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import { useMemory } from "../memory/store";
import { ActionSlot } from "./ActionSlot";
import { BlockDone } from "./BlockDone";
import { choiceDoneSummary } from "./doneSummary";
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

  function confirm(optionId: string = selected) {
    if (!canAct || !optionId) return;
    reply({
      kind: "event",
      blockId: block.id,
      value: optionId,
      doneLabel: choiceDoneSummary(block, optionId, plans),
      vars: block.sideDetail === "plan" ? { planId: optionId } : undefined,
    });
  }

  if (resolution) {
    return (
      <motion.section className={styles.choice} layout transition={spring.gentle}>
        <BlockDone summary={resolution.summary} />
      </motion.section>
    );
  }

  const selectedPlan = block.sideDetail === "plan" ? plans.find((p) => p.id === selected) : undefined;
  const showSide = block.sideDetail === "plan";
  // Une seule option, sans saisie libre : pas de carte à choisir, un bouton d'action suffit.
  const single = block.options.length === 1 && !block.allowFreeInput && !showSide ? block.options[0] : undefined;

  return (
    <motion.section
      className={[styles.choice, showSide && styles.choiceWithSide].filter(Boolean).join(" ")}
      layout
      transition={spring.gentle}
    >
      <div className={styles.choiceMain}>
        {(block.eyebrow || block.title) && (
          <header className={styles.choiceHeader}>
            {block.eyebrow && (
              <div className={styles.choiceEyebrow}>
                <Elephant size={56} state="done" layoutId="elea-presence" decorative />
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

        {single ? (
          <ActionSlot active={canAct}>
            <div className={styles.choiceActions}>
              <Button full onClick={() => confirm(single.id)} disabled={!canAct}>
                {single.title}
              </Button>
            </div>
          </ActionSlot>
        ) : (
          <>
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
                <Button full onClick={() => confirm()} disabled={!canAct || !selected}>
                  {block.confirmLabel}
                </Button>
              </div>
            </ActionSlot>

            {block.allowFreeInput && canAct && (
              <div className={styles.choiceActions}>
                <Button full onClick={() => confirm()} disabled={!selected}>
                  {block.confirmLabel}
                </Button>
              </div>
            )}
          </>
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
    </motion.section>
  );
}
