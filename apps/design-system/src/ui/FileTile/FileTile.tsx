import { FileText, Image as ImageIcon, X } from "lucide-react";
import { motion } from "motion/react";
import { spring } from "../../motion/springs";
import styles from "./FileTile.module.css";

type Props = {
  name: string;
  /** 0 à 1 */
  progress: number;
  kind?: "pdf" | "image" | "other";
  /** URL d'aperçu (image). */
  previewUrl?: string;
  error?: string;
  onRemove?: () => void;
  removeLabel?: string;
};

/** Fichier en cours de dépôt : miniature, nom, barre de progression. */
export function FileTile({ name, progress, kind = "other", previewUrl, error, onRemove, removeLabel = "Retirer" }: Props) {
  const done = progress >= 1 && !error;
  return (
    <motion.div
      className={[styles.tile, error && styles.error, done && styles.done].filter(Boolean).join(" ")}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={spring.gentle}
    >
      <span className={styles.thumb} aria-hidden>
        {previewUrl ? (
          <img src={previewUrl} alt="" className={styles.preview} />
        ) : kind === "image" ? (
          <ImageIcon size={18} strokeWidth={1.75} />
        ) : (
          <FileText size={18} strokeWidth={1.75} />
        )}
      </span>
      <div className={styles.body}>
        <p className={styles.name}>{name}</p>
        {error ? (
          <p className={styles.err}>{error}</p>
        ) : (
          <div className={styles.track} role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={name}>
            <motion.span className={styles.bar} animate={{ scaleX: progress }} transition={spring.gauge} style={{ originX: 0 }} />
          </div>
        )}
      </div>
      {onRemove && (
        <button type="button" className={styles.remove} aria-label={removeLabel} onClick={onRemove}>
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}
