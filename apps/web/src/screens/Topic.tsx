import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Button, FindingCard, Orb, blockItem, blockList, type FindingType } from "@elea/ds";
import { Icon } from "../blocks/icons";
import { useDetail } from "../shell/detailStore";
import { useMemory } from "../memory/store";
import { FINDING_TYPE_FILTER, sortFindingsRecent, typesPresent } from "./findings";
import styles from "./Topic.module.css";

/** Première suggestion d'accueil (mémoire) pour alimenter un sujet vide. */
function emptySuggestion(homeSuggestions: { label: string; scenarioId: string }[]) {
  return homeSuggestions[0] ?? null;
}

/** Liste des constats d'un sujet, avec filtre par type. */
export function Topic() {
  const { topicId = "" } = useParams();
  const navigate = useNavigate();
  const openDetail = useDetail((s) => s.open);
  const topics = useMemory((s) => s.topics);
  const findings = useMemory((s) => s.findings);
  const today = useMemory((s) => s.today);
  const home = useMemory((s) => s.home);
  const topic = topics.find((t) => t.id === topicId);
  const [filter, setFilter] = useState<FindingType | "all">("all");

  const topicFindings = useMemo(
    () => sortFindingsRecent(findings.filter((f) => f.topicId === topicId)),
    [findings, topicId],
  );
  const present = useMemo(() => typesPresent(topicFindings), [topicFindings]);
  const visible = filter === "all" ? topicFindings : topicFindings.filter((f) => f.type === filter);
  const suggestion = emptySuggestion(home?.suggestions ?? []);

  if (!topic) {
    return (
      <main className={styles.page}>
        <Link to="/entreprise" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
        <p className={styles.empty}>Ce sujet n'existe pas dans la mémoire.</p>
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
          <Icon name={topic.icon} />
        </span>
        <div>
          <p className="eyebrow">Sujet</p>
          <h1 className={["voice", styles.title].join(" ")}>{topic.label}</h1>
          <p className={styles.count}>
            {topicFindings.length === 0
              ? "Aucun constat"
              : topicFindings.length === 1
                ? "1 constat"
                : `${topicFindings.length} constats`}
          </p>
        </div>
      </motion.header>

      {topicFindings.length === 0 ? (
        <motion.section variants={blockItem} className={styles.emptyState}>
          <Orb size={56} state="idle" decorative />
          <p className={["voice", styles.emptyVoice].join(" ")}>
            Je n'ai encore rien rangé dans « {topic.label} ». Donnez-moi une information, je la note ici.
          </p>
          {suggestion && (
            <Button
              onClick={() => {
                navigate(`/besoin/${suggestion.scenarioId}`);
              }}
            >
              {suggestion.label}
            </Button>
          )}
          <button type="button" className={styles.composerLink} onClick={() => navigate("/", { state: { openComposer: true } })}>
            Ou ouvrir le composer
          </button>
        </motion.section>
      ) : (
        <>
          <motion.div variants={blockItem} className={styles.filters} role="toolbar" aria-label="Filtrer par type">
            <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Tous" count={topicFindings.length} />
            {present.map((t) => (
              <FilterChip
                key={t}
                active={filter === t}
                onClick={() => setFilter(t)}
                label={FINDING_TYPE_FILTER[t]}
                count={topicFindings.filter((f) => f.type === t).length}
              />
            ))}
          </motion.div>

          <LayoutGroup>
            <motion.ul className={styles.list} layout>
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((f) => (
                  <motion.li
                    key={f.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  >
                    <FindingCard
                      layoutId={`finding-${f.id}`}
                      findingType={f.type}
                      title={f.title}
                      topicLabel={topic.label}
                      createdAt={f.createdAt}
                      today={today}
                      origin={f.origin}
                      confidence={f.confidence}
                      variant="compact"
                      onClick={() => {
                        openDetail("finding", f.id);
                        navigate(`/finding/${f.id}`);
                      }}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          </LayoutGroup>
        </>
      )}
    </motion.main>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button type="button" className={[styles.chip, active && styles.chipActive].filter(Boolean).join(" ")} onClick={onClick} aria-pressed={active}>
      {label}
      <span className={styles.chipCount}>{count}</span>
    </button>
  );
}
