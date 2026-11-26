import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { blockItem, blockList } from "@elea/ds";
import { BlockRenderer } from "../blocks/BlockRenderer";
import type { PlanBlock } from "../engine/types";
import { useMemory } from "../memory/store";
import styles from "./PlanDetail.module.css";

/** Détail d'un plan : bloc plan en mode live. */
export function PlanDetail() {
  const { planId = "" } = useParams();
  const plan = useMemory((s) => s.plans.find((p) => p.id === planId));

  if (!plan) {
    return (
      <main className={styles.page}>
        <Link to="/plans" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Plans
        </Link>
        <p>Ce plan n'est plus dans la mémoire.</p>
      </main>
    );
  }

  const block: PlanBlock = {
    id: `live-${plan.id}`,
    type: "plan",
    planId: plan.id,
    mode: "live",
  };

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem}>
        <Link to="/plans" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Plans
        </Link>
      </motion.div>
      <motion.div variants={blockItem}>
        <BlockRenderer block={block} active={false} />
      </motion.div>
    </motion.main>
  );
}
