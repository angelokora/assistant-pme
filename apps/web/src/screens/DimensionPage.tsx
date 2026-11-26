import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { blockItem, blockList } from "@elea/ds";
import { motion } from "motion/react";
import { useMemory } from "../memory/store";
import { DimensionView } from "./DimensionView";
import styles from "./Topic.module.css";

/** Route `/entreprise/dimension/:dimensionId`. */
export function DimensionPage() {
  const { dimensionId = "" } = useParams();
  const dimension = useMemory((s) => s.dimensions.find((d) => d.id === dimensionId));

  if (!dimension) {
    return (
      <main className={styles.page}>
        <Link to="/entreprise" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
        <p className={styles.empty}>Cette dimension n'existe pas dans la mémoire.</p>
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
      <motion.div variants={blockItem}>
        <p className="eyebrow">Dimension</p>
        <h1 className={["voice", styles.title].join(" ")}>{dimension.label}</h1>
      </motion.div>
      <motion.div variants={blockItem}>
        <DimensionView dimensionId={dimension.id} />
      </motion.div>
    </motion.main>
  );
}
