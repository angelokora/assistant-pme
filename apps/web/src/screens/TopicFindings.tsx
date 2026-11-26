import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { FindingCard, type FindingType } from "@elea/ds";
import { useDetail } from "../shell/detailStore";
import { useMemory } from "../memory/store";
import { FilterBar, FilterChip, FilterSection } from "./FilterBar";
import { FINDING_TYPE_FILTER, sortFindingsRecent, typesPresent } from "./findings";
import { findingMatchesQuery } from "./searchText";
import styles from "./Topic.module.css";

type Props = {
  subjectId: string;
  subjectTitle: string;
  openFindingId?: string;
  /** Filtre texte (page sujet). */
  query?: string;
  /** Affiche aussi un filtre par dimension. */
  showDimensionFilter?: boolean;
};

/** Filtres + liste de constats d'un sujet traité. */
export function TopicFindings({
  subjectId,
  subjectTitle,
  openFindingId,
  query = "",
  showDimensionFilter,
}: Props) {
  const navigate = useNavigate();
  const openDetail = useDetail((s) => s.open);
  const findings = useMemory((s) => s.findings);
  const dimensions = useMemory((s) => s.dimensions);
  const today = useMemory((s) => s.today);
  const [filter, setFilter] = useState<FindingType | "all">("all");
  const [dimensionFilter, setDimensionFilter] = useState<string | "all">("all");

  const subjectFindings = useMemo(
    () => sortFindingsRecent(findings.filter((f) => f.subjectId === subjectId)),
    [findings, subjectId],
  );

  const searched = useMemo(() => {
    const q = query.trim();
    if (!q) return subjectFindings;
    return subjectFindings.filter((f) => findingMatchesQuery(f.title, f.summary, q));
  }, [subjectFindings, query]);

  const present = useMemo(() => typesPresent(searched), [searched]);
  const presentDims = useMemo(() => {
    const ids = new Set(searched.map((f) => f.dimensionId));
    return dimensions.filter((d) => ids.has(d.id));
  }, [searched, dimensions]);

  const visible = useMemo(() => {
    let list = searched;
    if (filter !== "all") list = list.filter((f) => f.type === filter);
    if (dimensionFilter !== "all") list = list.filter((f) => f.dimensionId === dimensionFilter);
    return list;
  }, [searched, filter, dimensionFilter]);

  return (
    <>
      <FilterSection>
        <FilterBar aria-label="Filtrer par type">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Tous"
            count={searched.length}
            muted={searched.length === 0}
          />
          {present.map((t) => {
            const count = searched.filter((f) => f.type === t).length;
            return (
              <FilterChip
                key={t}
                active={filter === t}
                onClick={() => setFilter(t)}
                label={FINDING_TYPE_FILTER[t]}
                count={count}
                muted={count === 0}
              />
            );
          })}
        </FilterBar>
        {showDimensionFilter && presentDims.length > 1 && (
          <FilterBar aria-label="Filtrer par dimension">
            <FilterChip
              active={dimensionFilter === "all"}
              onClick={() => setDimensionFilter("all")}
              label="Toutes dimensions"
              count={searched.length}
            />
            {presentDims.map((d) => {
              const count = searched.filter((f) => f.dimensionId === d.id).length;
              return (
                <FilterChip
                  key={d.id}
                  active={dimensionFilter === d.id}
                  onClick={() => setDimensionFilter(d.id)}
                  label={d.label}
                  count={count}
                />
              );
            })}
          </FilterBar>
        )}
      </FilterSection>

      {visible.length === 0 ? (
        <p className={styles.empty}>Aucun constat ne correspond.</p>
      ) : (
        <LayoutGroup>
          <motion.ul className={styles.list} layout>
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((f) => {
                const isOpen = f.id === openFindingId;
                const dim = dimensions.find((d) => d.id === f.dimensionId);
                return (
                  <motion.li
                    key={f.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  >
                    <FindingCard
                      layoutId={isOpen ? undefined : `finding-shell-${f.id}`}
                      findingType={f.type}
                      title={f.title}
                      topicLabel={showDimensionFilter ? (dim?.label ?? subjectTitle) : subjectTitle}
                      createdAt={f.createdAt}
                      today={today}
                      origin={f.origin}
                      confidence={f.confidence}
                      variant="compact"
                      className={isOpen ? styles.activeCard : undefined}
                      onClick={() => {
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
      )}
    </>
  );
}
