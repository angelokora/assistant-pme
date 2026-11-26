import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button, Elephant, blockItem, blockList } from "@elea/ds";
import { Icon } from "../blocks/icons";
import { useMemory } from "../memory/store";
import { TopicFindings } from "./TopicFindings";
import styles from "./Topic.module.css";

/** Première suggestion d'accueil (mémoire) pour alimenter un sujet vide. */
function emptySuggestion(homeSuggestions: { label: string; scenarioId: string }[]) {
  return homeSuggestions[0] ?? null;
}

/** Liste des constats d'un sujet traité (ancienne mise en page, en attendant #38). */
export function Topic() {
  const { subjectId = "" } = useParams();
  const navigate = useNavigate();
  const subjects = useMemory((s) => s.subjects);
  const findings = useMemory((s) => s.findings);
  const home = useMemory((s) => s.home);
  const subject = subjects.find((t) => t.id === subjectId);

  const subjectFindings = useMemo(
    () => findings.filter((f) => f.subjectId === subjectId),
    [findings, subjectId],
  );
  const suggestion = emptySuggestion(home?.suggestions ?? []);

  if (!subject) {
    return (
      <main className={styles.page}>
        <Link to="/entreprise" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
        <p className={styles.empty}>Ce sujet traité n'existe pas dans la mémoire.</p>
      </main>
    );
  }

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem}>
        <Link to="/entreprise" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
      </motion.div>

      <motion.header variants={blockItem} className={styles.header}>
        <span className={styles.topicIcon} aria-hidden>
          <Icon name={subject.icon} />
        </span>
        <div>
          <p className="eyebrow">Sujet traité</p>
          <h1 className={["voice", styles.title].join(" ")}>{subject.title}</h1>
          <p className={styles.count}>
            {subject.summary}
            {" · "}
            {subjectFindings.length === 0
              ? "Aucun constat"
              : subjectFindings.length === 1
                ? "1 constat"
                : `${subjectFindings.length} constats`}
          </p>
        </div>
      </motion.header>

      {subjectFindings.length === 0 ? (
        <motion.section variants={blockItem} className={styles.emptyState}>
          <Elephant size={56} state="idle" decorative />
          <p className={["voice", styles.emptyVoice].join(" ")}>
            Je n'ai encore rien rangé dans «{"\u00a0"}
            {subject.title}
            {"\u00a0"}». Donnez-moi une information, je la note ici.
          </p>
          {suggestion && (
            <Button onClick={() => navigate(`/besoin/${suggestion.scenarioId}`)}>{suggestion.label}</Button>
          )}
          <button type="button" className={styles.composerLink} onClick={() => navigate("/", { state: { openComposer: true } })}>
            Ou ouvrir le composer
          </button>
        </motion.section>
      ) : (
        <motion.div variants={blockItem}>
          <TopicFindings subjectId={subject.id} subjectTitle={subject.title} />
        </motion.div>
      )}
    </motion.main>
  );
}
