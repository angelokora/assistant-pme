import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { blockItem, blockList } from "@elea/ds";
import { motion } from "motion/react";
import { useMediaQuery } from "../composer/useMediaQuery";
import { useDetail } from "../shell/detailStore";
import { useMemory } from "../memory/store";
import { Icon } from "../blocks/icons";
import { TopicFindings } from "./TopicFindings";
import styles from "./Topic.module.css";
import pageStyles from "./FindingPage.module.css";

/**
 * Route `/finding/:findingId` : ouvre le DetailPanel.
 * Bureau : sujet traité + filtres au centre ; mobile : fond sous la feuille.
 */
export function FindingPage() {
  const { findingId = "" } = useParams();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const open = useDetail((s) => s.open);
  const finding = useMemory((s) => s.findings.find((f) => f.id === findingId));
  const subject = useMemory((s) => s.subjects.find((t) => t.id === finding?.subjectId));
  const dimension = useMemory((s) => s.dimensions.find((d) => d.id === finding?.dimensionId));
  const findings = useMemory((s) => s.findings);
  const count = subject
    ? findings.filter((f) => f.subjectId === subject.id).length
    : findings.filter((f) => f.dimensionId === finding?.dimensionId).length;

  useEffect(() => {
    if (!findingId || !finding) return;
    open("finding", findingId);
  }, [findingId, finding, open]);

  if (!finding) {
    return (
      <main className={pageStyles.page}>
        <Link to="/entreprise" className={pageStyles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
        <p>Ce constat n'est plus dans la mémoire.</p>
      </main>
    );
  }

  const backLabel = subject?.title ?? dimension?.label ?? "Mon entreprise";
  const backTo = subject ? `/entreprise/${subject.id}` : "/entreprise";

  if (!desktop) {
    return (
      <main className={pageStyles.page}>
        <Link to={backTo} className={pageStyles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> {backLabel}
        </Link>
        <p className={pageStyles.hint}>{finding.title}</p>
      </main>
    );
  }

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem}>
        <Link to={backTo} className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> {backLabel}
        </Link>
      </motion.div>
      {subject && (
        <motion.header variants={blockItem} className={styles.header}>
          <span className={styles.topicIcon} aria-hidden>
            <Icon name={subject.icon} />
          </span>
          <div>
            <p className="eyebrow">Sujet traité</p>
            <h1 className={["voice", styles.title].join(" ")}>{subject.title}</h1>
            <p className={styles.count}>
              {count === 0 ? "Aucun constat" : count === 1 ? "1 constat" : `${count} constats`}
            </p>
          </div>
        </motion.header>
      )}
      {subject && (
        <motion.div variants={blockItem}>
          <TopicFindings subjectId={subject.id} subjectTitle={subject.title} openFindingId={findingId} />
        </motion.div>
      )}
    </motion.main>
  );
}
