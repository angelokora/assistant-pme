import { useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import { Check, GripVertical } from "lucide-react";
import { Button, DateField, StepList, formatDate, spring } from "@elea/ds";
import type { PlanBlock as PlanBlockType, PlanStep } from "../engine/types";
import { usePlayer } from "../engine/player";
import { useMemory } from "../memory/store";
import { ActionSlot } from "./ActionSlot";
import { BlockDone } from "./BlockDone";
import { planDoneSummary } from "./doneSummary";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

/** Plan d'action : aperçu (#17), édition (#18), suivi (#27). */
export function PlanBlockView({ block, active }: BlockProps<PlanBlockType>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const resolution = usePlayer((s) => s.resolutions[block.id]);
  const plan = useMemory((s) => s.plans.find((p) => p.id === block.planId));
  const patchPlanSteps = useMemory((s) => s.patchPlanSteps);
  const [celebrating, setCelebrating] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const canAct =
    active &&
    !celebrating &&
    ((awaiting?.kind === "choice" && awaiting.blockId === block.id) ||
      (awaiting?.kind === "plan" && awaiting.blockId === block.id));

  function start() {
    if (!canAct) return;
    const summary = planDoneSummary(block, plan);
    if (block.mode === "editable") {
      setCelebrating(true);
      window.setTimeout(() => {
        reply({
          kind: "event",
          blockId: block.id,
          value: "start",
          doneLabel: summary,
        });
      }, 900);
      return;
    }
    reply({
      kind: "event",
      blockId: block.id,
      value: "start",
      doneLabel: summary,
    });
  }

  if (resolution) {
    const showLink = block.mode === "editable" && !!plan;
    return (
      <motion.section className={styles.plan} layout transition={spring.gentle}>
        <BlockDone
          summary={resolution.summary}
          action={
            showLink
              ? {
                  label: detailOpen ? "Masquer le plan" : "Voir le plan",
                  onClick: () => setDetailOpen((o) => !o),
                }
              : undefined
          }
        />
        <AnimatePresence>
          {detailOpen && plan && (
            <motion.div
              key="plan-detail"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring.gentle}
            >
              <header className={styles.planHeader}>
                <h2 className="voice">{plan.title}</h2>
                <p className={styles.planGoal}>{plan.goal}</p>
              </header>
              <StepList
                steps={plan.steps.map((s) => ({
                  id: s.id,
                  label: s.title,
                  detail: s.detail,
                  due: formatDate(s.due, "weekday"),
                  status: "pending" as const,
                }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    );
  }

  if (!plan) {
    return (
      <section className={styles.plan}>
        <p className="muted">Plan introuvable.</p>
      </section>
    );
  }

  if (block.mode === "live") {
    return (
      <section className={styles.plan}>
        <h2 className="voice">{plan.title}</h2>
        <p className={styles.planGoal}>{plan.goal}</p>
        <p className="muted">Mode live : prévu au ticket #27.</p>
      </section>
    );
  }

  if (block.mode === "editable") {
    return (
      <motion.section className={styles.plan} layout transition={spring.gentle}>
        <AnimatePresence>
          {celebrating && (
            <motion.div
              className={styles.planCelebrate}
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={spring.gentle}
            >
              <span className={styles.planCelebrateMark}>
                <Check size={36} strokeWidth={2.4} aria-hidden />
              </span>
              <p>C'est noté. On démarre.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <header className={styles.planHeader}>
          <p className={styles.planEyebrow}>Votre plan</p>
          <h2 className="voice">{plan.title}</h2>
          <p className={styles.planGoal}>{plan.goal}</p>
        </header>

        <Reorder.Group
          as="ol"
          axis="y"
          values={plan.steps}
          onReorder={(steps) => patchPlanSteps(plan.id, steps)}
          className={styles.planReorder}
          aria-label="Étapes du plan"
        >
          {plan.steps.map((step, index) => (
            <EditableStep
              key={step.id}
              step={step}
              index={index}
              disabled={!canAct}
              onDue={(due) => {
                const next = plan.steps.map((s) => (s.id === step.id ? { ...s, due } : s));
                patchPlanSteps(plan.id, next);
              }}
              onMove={(dir) => {
                const i = plan.steps.findIndex((s) => s.id === step.id);
                const j = i + dir;
                if (j < 0 || j >= plan.steps.length) return;
                const next = [...plan.steps];
                const [item] = next.splice(i, 1);
                next.splice(j, 0, item);
                patchPlanSteps(plan.id, next);
              }}
            />
          ))}
        </Reorder.Group>

        <ActionSlot active={canAct}>
          <div className={styles.choiceActions}>
            <Button full onClick={start} disabled={!canAct}>
              {block.startLabel ?? "Démarrer le plan"}
            </Button>
          </div>
        </ActionSlot>
      </motion.section>
    );
  }

  return (
    <motion.section className={styles.plan} layout transition={spring.gentle}>
      <header className={styles.planHeader}>
        <p className={styles.planEyebrow}>Votre plan</p>
        <h2 className="voice">{plan.title}</h2>
        <p className={styles.planGoal}>{plan.goal}</p>
      </header>
      <StepList
        steps={plan.steps.map((s) => ({
          id: s.id,
          label: s.title,
          detail: s.detail,
          due: formatDate(s.due, "weekday"),
          status: "pending" as const,
        }))}
      />
      <ActionSlot active={canAct}>
        <div className={styles.choiceActions}>
          <Button full onClick={start} disabled={!canAct}>
            {block.startLabel ?? "Mettre en place ce plan"}
          </Button>
        </div>
      </ActionSlot>
    </motion.section>
  );
}

function EditableStep({
  step,
  index,
  disabled,
  onDue,
  onMove,
}: {
  step: PlanStep;
  index: number;
  disabled?: boolean;
  onDue: (iso: string) => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={step} dragListener={false} dragControls={controls} className={styles.planStep} as="li">
      <button
        type="button"
        className={styles.planHandle}
        aria-label={`Réordonner l'étape ${index + 1}`}
        disabled={disabled}
        onPointerDown={(e) => {
          if (!disabled) controls.start(e);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onMove(-1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onMove(1);
          }
        }}
      >
        <GripVertical size={18} strokeWidth={1.75} aria-hidden />
      </button>
      <div className={styles.planStepBody}>
        <p className={styles.planStepTitle}>{step.title}</p>
        <p className={styles.planStepDetail}>{step.detail}</p>
        <DateField value={step.due.slice(0, 10)} onChange={onDue} disabled={disabled} label="Échéance" />
      </div>
    </Reorder.Item>
  );
}
