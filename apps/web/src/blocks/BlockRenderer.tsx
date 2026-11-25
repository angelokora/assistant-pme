import type { ComponentType } from "react";
import { motion } from "motion/react";
import { blockItem } from "@elea/ds";
import type { Block } from "../engine/types";
import { LeadBlockView } from "./LeadBlock";
import { QuestionBlockView } from "./QuestionBlock";
import { NotedBlockView } from "./NotedBlock";
import { DimensionsBlockView } from "./DimensionsBlock";
import { CalloutBlockView } from "./CalloutBlock";
import { SuggestionsBlockView } from "./SuggestionsBlock";
import { ConnectorBlockView } from "./ConnectorBlock";
import { AuthBlockView } from "./AuthBlock";
import { AnalysisBlockView } from "./AnalysisBlock";
import { ExtractionBlockView } from "./ExtractionBlock";
import styles from "./blocks.module.css";

/** Props communes à tous les rendus de bloc. `active` = le bloc appartient au tour en attente de réponse. */
export type BlockProps<B extends Block = Block> = { block: B; active: boolean };

// Chaque type de bloc du catalogue (docs/BLOCKS.md) a un rendu. Les autres arrivent avec leurs tickets.
const RENDERERS: Partial<Record<Block["type"], ComponentType<BlockProps<never>>>> = {
  lead: LeadBlockView,
  question: QuestionBlockView,
  noted: NotedBlockView,
  dimensions: DimensionsBlockView,
  callout: CalloutBlockView,
  suggestions: SuggestionsBlockView,
  connector: ConnectorBlockView,
  auth: AuthBlockView,
  analysis: AnalysisBlockView,
  extraction: ExtractionBlockView,
};

export function BlockRenderer({ block, active }: BlockProps) {
  const R = RENDERERS[block.type] as ComponentType<BlockProps> | undefined;
  if (!R) {
    if (import.meta.env.DEV) {
      console.warn(`[blocks] pas de rendu pour « ${block.type} »`);
      return (
        <motion.div variants={blockItem} className={styles.pending}>
          Bloc <code>{block.type}</code> : rendu à venir (voir le backlog)
        </motion.div>
      );
    }
    return null;
  }
  return (
    <motion.div variants={blockItem} layout="position" data-block={block.type}>
      <R block={block} active={active} />
    </motion.div>
  );
}
