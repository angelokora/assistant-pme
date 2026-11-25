import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Chip } from "@elea/ds";
import type { SuggestionsBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

export function SuggestionsBlockView({ block }: BlockProps<SuggestionsBlock>) {
  const navigate = useNavigate();
  const start = usePlayer((s) => s.start);
  return (
    <div className={styles.quick}>
      {block.items.map((i) => (
        <Chip
          key={i.id}
          icon={<ArrowRight size={16} />}
          onClick={() => (i.action.kind === "route" ? navigate(i.action.target) : (start(i.action.target), navigate(`/besoin/${i.action.target}`)))}
        >
          {i.label}
        </Chip>
      ))}
    </div>
  );
}
