import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { FindingCard, type FindingType } from "@elea/ds";
import { useDetail } from "../shell/detailStore";
import { useMemory } from "../memory/store";
import { FilterBar, FilterChip, FilterSection } from "./FilterBar";
import { FINDING_TYPE_FILTER, sortFindingsRecent, typesPresent } from "./findings";
import styles from "./Topic.module.css";

type Props = {
  subjectId: string;
  subjectTitle: string;
  /** Constat ouvert : pas de layoutId sur sa carte (le panneau porte le shell). */
  openFindingId?: string;
};

/** Filtres + liste de constats d'un sujet traité (réutilisé par Topic et FindingPage). */
export function TopicFindings({ subjectId, subjectTitle, openFindingId }: Props) {
  const navigate = useNavigate();
  const openDetail = useDetail((s) => s.open);
  const findings = useMemory((s) => s.findings);
  const today = useMemory((s) => s.today);
  const [filter, setFilter] = useState<FindingType | "all">("all");

  const subjectFindings = useMemo(
    () => sortFindingsRecent(findings.filter((f) => f.subjectId === subjectId)),
    [findings, subjectId],
  );
  const present = useMemo(() => typesPresent(subjectFindings), [subjectFindings]);
  const visible = filter === "all" ? subjectFindings : subjectFindings.filter((f) => f.type === filter);

  return (
    <>
      <FilterSection>
        <FilterBar aria-label="Filtrer par type">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="Tous"
            count={subjectFindings.length}
            muted={subjectFindings.length === 0}
          />
          {present.map((t) => {
            const count = subjectFindings.filter((f) => f.type === t).length;
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
      </FilterSection>

      <LayoutGroup>
        <motion.ul className={styles.list} layout>
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((f) => {
              const isOpen = f.id === openFindingId;
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
                    topicLabel={subjectTitle}
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
    </>
  );
}
