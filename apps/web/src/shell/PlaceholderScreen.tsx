import { motion } from "motion/react";
import { blockItem, blockList } from "@elea/ds";
import styles from "./PlaceholderScreen.module.css";

type Props = {
  title: string;
  ticketId: number;
  ticketName: string;
};

/** Écran d'attente sobre pour les routes pas encore construites. */
export function PlaceholderScreen({ title, ticketId, ticketName }: Props) {
  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.p variants={blockItem} className="eyebrow">
        Bientôt
      </motion.p>
      <motion.h1 variants={blockItem} className={["voice", styles.title].join(" ")}>
        {title}
      </motion.h1>
      <motion.p variants={blockItem} className={styles.text}>
        Cet écran sera construit dans le ticket #{ticketId} « {ticketName} ».
      </motion.p>
    </motion.main>
  );
}
