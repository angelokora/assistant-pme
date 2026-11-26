import { useNavigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { IconButton, Sheet, formatDate } from "@elea/ds";
import { useMediaQuery } from "../composer/useMediaQuery";
import { useMemory } from "../memory/store";
import { FindingDetail } from "../screens/FindingDetail";
import { useDetail } from "./detailStore";
import styles from "./DetailPanel.module.css";

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
    kind === "finding" && finding ? (
      <FindingDetail finding={finding} showTitle={false} />
    ) : kind === "plan" ? (
      <div className={styles.stack}>
        <p className={styles.text}>{plan?.goal}</p>
        <ol className={styles.steps}>
          {plan?.steps.map((s) => (
            <li key={s.id}>
              <strong>{s.title}</strong>
              <span>{s.detail}</span>
            </li>
          ))}
        </ol>
      </div>
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
              <h2 className={styles.title}>{activePlan.title}</h2>
              <p className={styles.text}>{activePlan.goal}</p>
              <ol className={styles.steps}>
                {activePlan.steps.map((s) => (
                  <li key={s.id} data-status={s.status}>
                    <strong>{s.title}</strong>
                    <span>
                      {s.detail}
                      {s.due ? ` · ${formatDate(s.due, "short")}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
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
