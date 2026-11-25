import { X } from "lucide-react";
import { IconButton, Sheet } from "@elea/ds";
import { useMediaQuery } from "../composer/useMediaQuery";
import { useMemory } from "../memory/store";
import { useDetail } from "./detailStore";
import styles from "./DetailPanel.module.css";

/** Panneau de détail : colonne droite (≥1024) ou feuille latérale (tablette). */
export function DetailPanel() {
  const { kind, id, close } = useDetail();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const finding = useMemory((s) => s.findings.find((f) => f.id === id));
  const plan = useMemory((s) => s.plans.find((p) => p.id === id));
  const attention = useMemory((s) => s.attention.find((a) => a.id === id));
  const open = kind !== null && id !== null;

  const title =
    kind === "finding"
      ? finding?.title ?? "Finding"
      : kind === "plan"
        ? plan?.title ?? "Plan"
        : attention?.title ?? "Détail";

  const body =
    kind === "finding" ? (
      <p className={styles.text}>{finding?.summary}</p>
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
    if (!open) return <aside className={styles.empty} aria-hidden />;
    return (
      <aside className={styles.panel} aria-label="Détail">
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <IconButton label="Fermer le détail" size="sm" variant="soft" onClick={close}>
            <X size={18} />
          </IconButton>
        </header>
        {body}
      </aside>
    );
  }

  return (
    <Sheet open={open} onClose={close} title={title}>
      {body}
    </Sheet>
  );
}
