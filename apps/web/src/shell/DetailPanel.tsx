import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { IconButton, Sheet, spring } from "@elea/ds";
import { useMediaQuery } from "../composer/useMediaQuery";
import { useMemory } from "../memory/store";
import { BlockRenderer } from "../blocks/BlockRenderer";
import type { PlanBlock } from "../engine/types";
import { FindingDetail } from "../screens/FindingDetail";
import { useDetail } from "./detailStore";
import styles from "./DetailPanel.module.css";

/** Conteneur partagé (layoutId) + contenu en fondu, pour ne pas embarquer le détail dans la carte. */
function FindingPanelBody({ findingId, finding }: { findingId: string; finding: NonNullable<ReturnType<typeof useMemory.getState>["findings"][number]> }) {
  return (
    <motion.div layoutId={`finding-shell-${findingId}`} className={styles.sharedShell} transition={spring.gentle}>
      <motion.div
        key={findingId}
        className={styles.sharedContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, delay: 0.14 }}
      >
        <FindingDetail finding={finding} showTitle={false} />
      </motion.div>
    </motion.div>
  );
}

/** Panneau de détail : colonne droite (≥1024) ou feuille (tablette / mobile). */
export function DetailPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { kind, id, close } = useDetail();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const finding = useMemory((s) => s.findings.find((f) => f.id === id));
  const plan = useMemory((s) => s.plans.find((p) => p.id === id));
  const attention = useMemory((s) => s.attention.find((a) => a.id === id));
  const plans = useMemory((s) => s.plans);
  const sources = useMemory((s) => s.sources);
  const open = kind !== null && id !== null;

  const activePlan = plans.find((p) => p.status === "active") ?? plans.find((p) => p.status === "waiting");
  const connected = sources.filter((s) => s.status === "connected");
  const hasIdleContext = !!activePlan || connected.length > 0;

  function handleClose() {
    close();
    if (location.pathname.startsWith("/finding/")) {
      const topicId = finding?.topicId;
      navigate(topicId ? `/entreprise/${topicId}` : "/entreprise");
    }
  }

  const title =
    kind === "finding"
      ? (finding?.title ?? "Constat")
      : kind === "plan"
        ? (plan?.title ?? "Plan")
        : (attention?.title ?? "Détail");

  const body =
    kind === "finding" && finding && id ? (
      <FindingPanelBody findingId={id} finding={finding} />
    ) : kind === "plan" && plan ? (
      <BlockRenderer
        block={
          {
            id: `panel-plan-${plan.id}`,
            type: "plan",
            planId: plan.id,
            mode: "live",
          } satisfies PlanBlock
        }
        active={false}
      />
    ) : (
      <p className={styles.text}>{attention?.text}</p>
    );

  if (desktop) {
    if (!open && !hasIdleContext) {
      return <aside className={styles.empty} aria-hidden />;
    }
    if (!open) {
      return (
        <aside className={styles.panel} aria-label="Contexte">
          {activePlan && (
            <section className={styles.stack}>
              <p className={styles.eyebrow}>Plan en cours</p>
              <BlockRenderer
                block={
                  {
                    id: `idle-plan-${activePlan.id}`,
                    type: "plan",
                    planId: activePlan.id,
                    mode: "live",
                  } satisfies PlanBlock
                }
                active={false}
              />
            </section>
          )}
          {connected.length > 0 && (
            <section className={styles.stack}>
              <p className={styles.eyebrow}>Sources</p>
              <ul className={styles.sources}>
                {connected.map((s) => (
                  <li key={s.id}>
                    <strong>{s.label}</strong>
                    {s.detail && <span>{s.detail}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      );
    }
    return (
      <aside className={styles.panel} aria-label="Détail">
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <IconButton label="Fermer le détail" size="sm" variant="soft" onClick={handleClose}>
            <X size={18} />
          </IconButton>
        </header>
        {body}
      </aside>
    );
  }

  return (
    <Sheet open={open} onClose={handleClose} title={title}>
      {body}
    </Sheet>
  );
}
