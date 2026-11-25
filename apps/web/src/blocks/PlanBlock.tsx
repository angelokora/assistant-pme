import { Button, StepList, formatDate } from "@elea/ds";
import type { PlanBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import { useMemory } from "../memory/store";
import { ActionSlot } from "./ActionSlot";
import { BlockDone } from "./BlockDone";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

/** Plan d'action : aperçu (#17), édition et suivi (#18, #27). */
export function PlanBlockView({ block, active }: BlockProps<PlanBlock>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const resolution = usePlayer((s) => s.resolutions[block.id]);
  const plan = useMemory((s) => s.plans.find((p) => p.id === block.planId));
  const canAct =
    active &&
    ((awaiting?.kind === "choice" && awaiting.blockId === block.id) ||
      (awaiting?.kind === "plan" && awaiting.blockId === block.id));

  function start() {
    if (!canAct) return;
    reply({
      kind: "event",
      blockId: block.id,
      value: "start",
      doneLabel: block.startLabel ?? "Plan mis en place",
    });
  }

  if (resolution) {
    return (
      <section className={styles.plan}>
        <BlockDone summary={resolution.summary} />
      </section>
    );
  }

  if (!plan) {
    return (
      <section className={styles.plan}>
        <p className="muted">Plan introuvable.</p>
      </section>
    );
  }

  // Modes editable / live : #18 et #27.
  if (block.mode !== "preview") {
    return (
      <section className={styles.plan}>
        <h2 className="voice">{plan.title}</h2>
        <p className={styles.planGoal}>{plan.goal}</p>
        <p className="muted">Mode {block.mode} : prévu aux tickets #18 et #27.</p>
      </section>
    );
  }

  return (
    <section className={styles.plan}>
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
    </section>
  );
}
