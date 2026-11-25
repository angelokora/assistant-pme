import { motion } from "motion/react";
import styles from "./TranscriptText.module.css";

type Props = { text: string; visibleWords: number; className?: string };

/** Transcription qui s'écrit mot à mot (chaque mot apparaît en fondu). */
export function TranscriptText({ text, visibleWords, className }: Props) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <p className={[styles.text, className].filter(Boolean).join(" ")} aria-live="polite">
      {visibleWords > 0 && <span aria-hidden>« </span>}
      {words.slice(0, visibleWords).map((w, i) => (
        <motion.span key={i} initial={{ opacity: 0, filter: "blur(3px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.18 }}>
          {w}{" "}
        </motion.span>
      ))}
      {visibleWords >= words.length && words.length > 0 && <span aria-hidden>»</span>}
      {visibleWords < words.length && <span className={styles.caret} aria-hidden />}
    </p>
  );
}
