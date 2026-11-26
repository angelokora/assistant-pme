import { useNavigate } from "react-router-dom";
import { FindingCard } from "@elea/ds";
import type { FindingRefBlock as FindingRefBlockType } from "../engine/types";
import { useMemory } from "../memory/store";
import { useDetail } from "../shell/detailStore";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

/** Renvoi vers un finding existant : carte cliquable, ouvre le détail (#26). */
export function FindingRefBlockView({ block }: BlockProps<FindingRefBlockType>) {
  const navigate = useNavigate();
  const finding = useMemory((s) => s.findings.find((f) => f.id === block.findingId));
  const subject = useMemory((s) => s.subjects.find((t) => t.id === finding?.subjectId));
  const dimension = useMemory((s) => s.dimensions.find((d) => d.id === finding?.dimensionId));
  const today = useMemory((s) => s.today);
  const openDetail = useDetail((s) => s.open);

  if (!finding) {
    return (
      <p className={styles.hint} role="status">
        Constat introuvable.
      </p>
    );
  }

  return (
    <div className={styles.findingRef}>
      {block.reason && <p className={styles.hint}>{block.reason}</p>}
      <FindingCard
        layoutId={`finding-shell-${finding.id}`}
        findingType={finding.type}
        title={finding.title}
        topicLabel={subject?.title ?? dimension?.label ?? finding.dimensionId}
        createdAt={finding.createdAt}
        today={today}
        origin={finding.origin}
        confidence={finding.confidence}
        summary={finding.summary}
        variant="compact"
        onClick={() => {
          openDetail("finding", finding.id);
          navigate(`/finding/${finding.id}`);
        }}
      />
    </div>
  );
}
