import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Gauge, blockItem, blockList, formatDate } from "@elea/ds";
import type { Plan } from "../engine/types";
import { useMemory } from "../memory/store";
import styles from "./Plans.module.css";

/** Sections affichées : En cours, En attente, Terminés (pas de brouillons ni d'alerte de surcharge). */
const STATUS_ORDER = ["active", "waiting", "done"] as const;
const STATUS_LABEL: Record<(typeof STATUS_ORDER)[number], string> = {
  active: "En cours",
  waiting: "En attente",
  done: "Terminés",
};

function nextStep(plan: Plan) {
  return plan.steps.find((s) => s.status === "doing") ?? plan.steps.find((s) => s.status === "todo");
}

function ProgressBar({ plan }: { plan: Plan }) {
  const done = plan.steps.filter((s) => s.status === "done").length;
  const total = plan.steps.length || 1;
  return (
    <div className={styles.progress}>
      <Gauge
        value={done / total}
        segments={total}
        status={done >= total ? "enough" : done > 0 ? "active" : "todo"}
        label={`${done} sur ${total} étapes`}
        className={styles.progressGauge}
      />
      <span className={styles.progressLabel}>
        {done}/{total}
      </span>
    </div>
  );
}

/** Liste des plans : actifs, en attente, terminés. */
export function Plans() {
  const navigate = useNavigate();
  const plans = useMemory((s) => s.plans);
  const subjects = useMemory((s) => s.subjects);

  const groups = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      items: plans.filter((p) => p.status === status),
    })).filter((g) => g.items.length > 0);
  }, [plans]);

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.header variants={blockItem} className={styles.header}>
        <p className="eyebrow">Suivi</p>
        <h1 className={["voice", styles.title].join(" ")}>Plans</h1>
      </motion.header>

      {groups.length === 0 ? (
        <motion.p variants={blockItem} className={styles.empty}>
          Aucun plan pour l'instant.
        </motion.p>
      ) : (
        groups.map((g) => (
          <motion.section key={g.status} variants={blockItem} aria-labelledby={`plans-${g.status}`}>
            <h2 id={`plans-${g.status}`} className={styles.sectionTitle}>
              {STATUS_LABEL[g.status]}
            </h2>
            <ul className={styles.list}>
              {g.items.map((plan) => {
                const next = nextStep(plan);
                const subject = subjects.find((s) => s.id === plan.subjectId);
                return (
                  <li key={plan.id}>
                    <button type="button" className={styles.card} onClick={() => navigate(`/plans/${plan.id}`)}>
                      <div className={styles.cardTop}>
                        <strong className={styles.cardTitle}>{plan.title}</strong>
                        <ChevronRight size={18} strokeWidth={1.75} aria-hidden className={styles.chevron} />
                      </div>
                      <p className={styles.goal}>{plan.goal}</p>
                      {subject ? <p className={styles.subject}>Sujet : {subject.title}</p> : null}
                      <ProgressBar plan={plan} />
                      {plan.status === "done" && plan.completedAt ? (
                        <p className={styles.completed}>Terminé le {formatDate(plan.completedAt, "short")}</p>
                      ) : null}
                      {next && plan.status !== "done" ? (
                        <p className={styles.next}>
                          Prochaine étape : {next.title}
                          {next.due ? ` · ${formatDate(next.due, "short")}` : ""}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        ))
      )}
    </motion.main>
  );
}
