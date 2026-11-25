import type { ChoiceBlock, Plan, PlanBlock } from "../engine/types";
import { formatDate } from "@elea/ds";

/** Résumé compact d'un choix terminé (docs/BLOCKS.md §7). */
export function choiceDoneSummary(
  block: ChoiceBlock,
  optionId: string,
  plans: { id: string; steps: unknown[] }[],
): string {
  const option = block.options.find((o) => o.id === optionId);
  const title = option?.title ?? optionId;
  if (block.sideDetail === "plan") {
    const prefix = block.doneLabel ?? "Plan retenu";
    const plan = plans.find((p) => p.id === optionId);
    const n = plan?.steps.length ?? 0;
    const steps = n <= 1 ? `${n} étape` : `${n} étapes`;
    return `${prefix} : ${title} · ${steps}`;
  }
  const prefix = block.doneLabel ?? "Priorité retenue";
  return `${prefix} : ${title}`;
}

/** Résumé compact d'un plan terminé (preview ou editable). */
export function planDoneSummary(block: PlanBlock, plan: Plan | undefined): string {
  if (block.mode === "preview") {
    return block.doneLabel ?? "Plan mis en place";
  }
  const prefix = block.doneLabel ?? "Plan démarré";
  if (!plan) return prefix;
  const n = plan.steps.length;
  const steps = n <= 1 ? `${n} étape` : `${n} étapes`;
  const firstDue = plan.steps[0]?.due ? formatDate(plan.steps[0].due, "weekday") : "";
  return firstDue
    ? `${prefix} : ${plan.title} · ${steps} · première échéance ${firstDue}`
    : `${prefix} : ${plan.title} · ${steps}`;
}
