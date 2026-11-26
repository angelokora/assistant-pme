import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { DimensionCard, FindingCard, Gauge, type FindingType } from "@elea/ds";
import { Icon } from "../blocks/icons";
import { useMemory } from "../memory/store";
import { useDetail } from "../shell/detailStore";
import { FilterBar, FilterChip, FilterSection } from "./FilterBar";
import { FINDING_TYPE_FILTER, sortFindingsRecent, typesPresent } from "./findings";
import styles from "./DimensionView.module.css";

type Props = {
  dimensionId: string;
  /** Dans une feuille (onboarding) : pas de retour, en-tête compact. */
  embedded?: boolean;
  openFindingId?: string;
};

/** Contenu d'une dimension : savoir, manques, sujets liés. */
export function DimensionView({ dimensionId, embedded, openFindingId }: Props) {
  const navigate = useNavigate();
  const openDetail = useDetail((s) => s.open);
  const dimension = useMemory((s) => s.dimensions.find((d) => d.id === dimensionId));
  const findings = useMemory((s) => s.findings);
  const subjects = useMemory((s) => s.subjects);
  const today = useMemory((s) => s.today);
  const [filter, setFilter] = useState<FindingType | "all">("all");

  const dimFindings = useMemo(
    () => sortFindingsRecent(findings.filter((f) => f.dimensionId === dimensionId)),
    [findings, dimensionId],
  );
  const present = useMemo(() => typesPresent(dimFindings), [dimFindings]);
  const visible = filter === "all" ? dimFindings : dimFindings.filter((f) => f.type === filter);

  const linkedSubjects = useMemo(() => {
    const ids = new Set(dimFindings.map((f) => f.subjectId).filter(Boolean) as string[]);
    return subjects.filter((s) => ids.has(s.id));
  }, [dimFindings, subjects]);

  const gaps = dimension?.gaps ?? [];

  if (!dimension) {
    return <p className={styles.empty}>Cette dimension n'existe pas dans la mémoire.</p>;
  }

  return (
    <div className={[styles.view, embedded && styles.embedded].filter(Boolean).join(" ")}>
      {!embedded && (
        <header className={styles.header}>
          <DimensionCard
            id={dimension.id}
            label={dimension.label}
            icon={<Icon name={dimension.icon} />}
            tone={dimension.tone}
            summary={dimension.summary}
            progress={dimension.progress}
            status={dimension.status}
          />
        </header>
      )}

      {embedded && (
        <div className={styles.embedHead}>
          <p className={styles.embedSummary}>{dimension.summary}</p>
          <Gauge value={dimension.progress} status={dimension.status} label={`Connaissance : ${dimension.label}`} />
        </div>
      )}

      <section aria-labelledby={`know-${dimensionId}`}>
        <h2 id={`know-${dimensionId}`} className={styles.sectionTitle}>
          Ce qu'Éléa sait
        </h2>
        {dimFindings.length === 0 ? (
          <p className={["voice", styles.emptyVoice].join(" ")}>
            Je n'ai encore rien de précis sur {dimension.label.toLowerCase()}.
          </p>
        ) : (
          <>
            <FilterSection>
              <FilterBar aria-label="Filtrer par type">
                <FilterChip
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                  label="Tous"
                  count={dimFindings.length}
                />
                {present.map((t) => {
                  const count = dimFindings.filter((f) => f.type === t).length;
                  return (
                    <FilterChip
                      key={t}
                      active={filter === t}
                      onClick={() => setFilter(t)}
                      label={FINDING_TYPE_FILTER[t]}
                      count={count}
                    />
                  );
                })}
              </FilterBar>
            </FilterSection>
            <LayoutGroup>
              <motion.ul className={styles.list} layout>
                <AnimatePresence mode="popLayout" initial={false}>
                  {visible.map((f) => {
                    const subject = subjects.find((s) => s.id === f.subjectId);
                    const isOpen = f.id === openFindingId;
                    return (
                      <motion.li
                        key={f.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      >
                        <FindingCard
                          layoutId={isOpen || embedded ? undefined : `finding-shell-${f.id}`}
                          findingType={f.type}
                          title={f.title}
                          topicLabel={subject?.title ?? dimension.label}
                          createdAt={f.createdAt}
                          today={today}
                          origin={f.origin}
                          confidence={f.confidence}
                          variant="compact"
                          onClick={() => {
                            if (embedded) return;
                            openDetail("finding", f.id);
                            navigate(`/finding/${f.id}`);
                          }}
                        />
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            </LayoutGroup>
          </>
        )}
      </section>

      {gaps.length > 0 && (
        <section aria-labelledby={`miss-${dimensionId}`}>
          <h2 id={`miss-${dimensionId}`} className={styles.sectionTitle}>
            Ce qui manque
          </h2>
          <ul className={styles.gapList}>
            {gaps.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  className={styles.gapRow}
                  onClick={() => {
                    if (g.scenarioId) navigate(`/besoin/${g.scenarioId}`);
                    else navigate("/", { state: { openComposer: true, draft: g.question } });
                  }}
                >
                  <span className={styles.gapText}>{g.question}</span>
                  <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby={`subj-${dimensionId}`}>
        <h2 id={`subj-${dimensionId}`} className={styles.sectionTitle}>
          Sujets traités liés
        </h2>
        {linkedSubjects.length === 0 ? (
          <p className={["voice", styles.emptyVoice].join(" ")}>
            Aucun sujet traité ne touche encore cette dimension.
          </p>
        ) : (
          <ul className={styles.subjectList}>
            {linkedSubjects.map((s) => {
              const count = findings.filter((f) => f.subjectId === s.id).length;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={styles.subjectRow}
                    onClick={() => {
                      if (embedded) return;
                      navigate(`/entreprise/${s.id}`);
                    }}
                  >
                    <span className={styles.subjectIcon} aria-hidden>
                      <Icon name={s.icon} />
                    </span>
                    <span className={styles.subjectBody}>
                      <span className={styles.subjectLabel}>{s.title}</span>
                      <span className={styles.subjectMeta}>{s.summary}</span>
                    </span>
                    <span className={styles.subjectCount}>{count}</span>
                    {!embedded && <ChevronRight size={18} strokeWidth={1.75} aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
