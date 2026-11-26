import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMediaQuery } from "../composer/useMediaQuery";
import { useDetail } from "../shell/detailStore";
import { useMemory } from "../memory/store";
import styles from "./FindingPage.module.css";

/**
 * Route `/finding/:findingId` : ouvre le DetailPanel (colonne ou feuille).
 * Le fond (sujet) reste accessible via le lien de retour.
 */
export function FindingPage() {
  const { findingId = "" } = useParams();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const open = useDetail((s) => s.open);
  const finding = useMemory((s) => s.findings.find((f) => f.id === findingId));
  const topic = useMemory((s) => s.topics.find((t) => t.id === finding?.topicId));

  useEffect(() => {
    if (!findingId || !finding) return;
    open("finding", findingId);
  }, [findingId, finding, open]);

  if (!finding) {
    return (
      <main className={styles.page}>
        <Link to="/entreprise" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
        <p>Ce constat n'est plus dans la mémoire.</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link to={topic ? `/entreprise/${topic.id}` : "/entreprise"} className={styles.back}>
        <ArrowLeft size={18} strokeWidth={1.75} /> {topic?.label ?? "Mon entreprise"}
      </Link>
      <p className={styles.hint}>
        {desktop ? "Le constat est ouvert dans le panneau de droite." : finding.title}
      </p>
    </main>
  );
}
