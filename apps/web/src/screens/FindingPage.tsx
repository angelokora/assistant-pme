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
 * Bureau : sujet + filtres au centre ; mobile : fond sous la feuille.
 */
export function FindingPage() {
  const { findingId = "" } = useParams();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const open = useDetail((s) => s.open);
  const finding = useMemory((s) => s.findings.find((f) => f.id === findingId));
  const topic = useMemory((s) => s.topics.find((t) => t.id === finding?.topicId));
  const findings = useMemory((s) => s.findings);
  const count = findings.filter((f) => f.topicId === finding?.topicId).length;

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

  if (!desktop) {
    return (
      <main className={pageStyles.page}>
        <Link to={topic ? `/entreprise/${topic.id}` : "/entreprise"} className={pageStyles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> {topic?.label ?? "Mon entreprise"}
        </Link>
        <p className={pageStyles.hint}>{finding.title}</p>
      </main>
    );
  }

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem}>
        <Link to={topic ? `/entreprise/${topic.id}` : "/entreprise"} className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> {topic?.label ?? "Mon entreprise"}
        </Link>
      </motion.div>
      {topic && (
        <motion.header variants={blockItem} className={styles.header}>
          <span className={styles.topicIcon} aria-hidden>
            <Icon name={topic.icon} />
          </span>
          <div>
            <p className="eyebrow">Sujet</p>
            <h1 className={["voice", styles.title].join(" ")}>{topic.label}</h1>
            <p className={styles.count}>
              {count === 0 ? "Aucun constat" : count === 1 ? "1 constat" : `${count} constats`}
            </p>
          </div>
        </motion.header>
      )}
      {topic && (
        <motion.div variants={blockItem}>
          <TopicFindings topicId={topic.id} topicLabel={topic.label} openFindingId={findingId} />
        </motion.div>
      )}
    </motion.main>
  );
}
