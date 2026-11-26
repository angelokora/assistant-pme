import { Elephant } from "@elea/ds";
import type { LeadBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

export function LeadBlockView({ block, active }: BlockProps<LeadBlock>) {
  const orb = usePlayer((s) => s.orb);
  return (
    <p className={styles.lead}>
      <Elephant size={24} state={active ? orb : "idle"} decorative />
      <span>{block.text}</span>
    </p>
  );
}
