import { Chip } from "@elea/ds";
import type { QuestionBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

export function QuestionBlockView({ block, active }: BlockProps<QuestionBlock>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const canReply = active && !!awaiting;
  return (
    <div className={styles.question}>
      <h2 className="voice">{block.text}</h2>
      {block.hint && <p className={styles.hint}>{block.hint}</p>}
      {block.quickReplies && (
        <div className={styles.quick}>
          {block.quickReplies.map((q) => (
            <Chip
              key={q.id}
              disabled={!canReply}
              onClick={() =>
                awaiting?.kind === "choice"
                  ? reply({ kind: "event", blockId: block.id, value: q.id, label: q.label })
                  : reply({ kind: "quick", id: q.id, label: q.label })
              }
            >
              {q.label}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
