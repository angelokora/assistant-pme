import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { FindingCard, blockItem, blockList } from "@elea/ds";
import { motion } from "motion/react";
import { useMediaQuery } from "../composer/useMediaQuery";
import { useDetail } from "../shell/detailStore";
import { useMemory } from "../memory/store";
import { sortFindingsRecent } from "./findings";
import styles from "./FindingPage.module.css";

/**
 * Route `/finding/:findingId` : ouvre le DetailPanel.
 * Bureau : le sujet reste visible au centre (exigence #25 / #26).
 * Mobile / tablette : fond léger sous la feuille.
 */
export function FindingPage() {
  const { findingId = "" } = useParams();
  const navigate = useNavigate();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const open = useDetail((s) => s.open);
  const finding = useMemory((s) => s.findings.find((f) => f.id === findingId));
  const topic = useMemory((s) => s.topics.find((t) => t.id === finding?.topicId));
  const findings = useMemory((s) => s.findings);
  const today = useMemory((s) => s.today);
  const topicFindings = sortFindingsRecent(findings.filter((f) => f.topicId === finding?.topicId));

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

  if (!desktop) {
    return (
      <main className={styles.page}>
        <Link to={topic ? `/entreprise/${topic.id}` : "/entreprise"} className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> {topic?.label ?? "Mon entreprise"}
        </Link>
        <p className={styles.hint}>{finding.title}</p>
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
          <p className="eyebrow">Sujet</p>
          <h1 className={["voice", styles.title].join(" ")}>{topic.label}</h1>
        </motion.header>
      )}
      <motion.ul variants={blockItem} className={styles.list}>
        {topicFindings.map((f) => (
          <li key={f.id}>
            <FindingCard
              layoutId={`finding-${f.id}`}
              findingType={f.type}
              title={f.title}
              topicLabel={topic?.label ?? ""}
              createdAt={f.createdAt}
              today={today}
              origin={f.origin}
              confidence={f.confidence}
              variant="compact"
              className={f.id === findingId ? styles.activeCard : undefined}
              onClick={() => {
                open("finding", f.id);
                navigate(`/finding/${f.id}`, { replace: true });
              }}
            />
          </li>
        ))}
      </motion.ul>
    </motion.main>
  );
}
