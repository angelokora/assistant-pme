import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Camera, FileUp, Upload } from "lucide-react";
import { press, spring } from "../../motion/springs";
import { motion } from "motion/react";
import styles from "./DropZone.module.css";

export type DropZoneAccept = "pdf" | "image";

type Props = {
  /** Libellé de la zone desktop (ex. « Déposer des fichiers »). */
  label: string;
  /** Indice desktop uniquement (glisser-déposer), visible à partir de 640 px. */
  desktopHint?: string;
  /** Libellé du bouton mobile « choisir ». */
  chooseLabel?: string;
  /** Libellé du bouton mobile « photo ». */
  photoLabel?: string;
  accept?: DropZoneAccept[];
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  onReject?: (names: string[]) => void;
  children?: ReactNode;
  className?: string;
};

const MIME: Record<DropZoneAccept, string[]> = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
};

/** Zone de dépôt générique : glisser-déposer sur ordinateur ; choisir / photo sur mobile. */
export function DropZone({
  label,
  desktopHint,
  chooseLabel = "Choisir un fichier",
  photoLabel = "Prendre une photo",
  accept = ["pdf", "image"],
  multiple = true,
  disabled,
  onFiles,
  onReject,
  children,
  className,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const allowPhoto = accept.includes("image");

  const acceptAttr = accept
    .flatMap((a) => (a === "pdf" ? [".pdf", "application/pdf"] : [".jpg", ".jpeg", ".png", ".webp", "image/*"]))
    .join(",");

  function filter(list: FileList | File[]) {
    const files = [...list];
    const ok: File[] = [];
    const bad: string[] = [];
    const allowed = new Set(accept.flatMap((a) => MIME[a]));
    const allowPdfExt = accept.includes("pdf");
    const allowImage = accept.includes("image");

    for (const f of files) {
      const byMime = allowed.has(f.type) || (allowImage && f.type.startsWith("image/"));
      const byExt = allowPdfExt && f.name.toLowerCase().endsWith(".pdf");
      if (byMime || byExt) ok.push(f);
      else bad.push(f.name);
    }
    if (bad.length) onReject?.(bad);
    if (ok.length) onFiles(ok);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!disabled) setOver(true);
  }
  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    setOver(false);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) filter(e.dataTransfer.files);
  }

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      {/* Desktop : une zone de dépôt */}
      <motion.button
        type="button"
        className={[styles.zone, styles.desktop, over && styles.over, disabled && styles.disabled].filter(Boolean).join(" ")}
        whileTap={disabled ? undefined : press}
        transition={spring.snappy}
        disabled={disabled}
        aria-label={label}
        onClick={() => fileRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className={styles.icon} aria-hidden>
          <Upload size={22} strokeWidth={1.75} />
        </span>
        <span className={styles.label}>{label}</span>
        {desktopHint && <span className={styles.hint}>{desktopHint}</span>}
      </motion.button>

      {/* Mobile : deux actions */}
      <div className={styles.mobile} role="group" aria-label={label}>
        <motion.button
          type="button"
          className={[styles.mobileBtn, disabled && styles.disabled].filter(Boolean).join(" ")}
          whileTap={disabled ? undefined : press}
          transition={spring.snappy}
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp size={18} strokeWidth={1.75} aria-hidden />
          {chooseLabel}
        </motion.button>
        {allowPhoto && (
          <motion.button
            type="button"
            className={[styles.mobileBtn, disabled && styles.disabled].filter(Boolean).join(" ")}
            whileTap={disabled ? undefined : press}
            transition={spring.snappy}
            disabled={disabled}
            onClick={() => photoRef.current?.click()}
          >
            <Camera size={18} strokeWidth={1.75} aria-hidden />
            {photoLabel}
          </motion.button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        className={styles.input}
        accept={acceptAttr}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) filter(e.target.files);
          e.target.value = "";
        }}
      />
      {allowPhoto && (
        <input
          ref={photoRef}
          type="file"
          className={styles.input}
          accept="image/*"
          capture="environment"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) filter(e.target.files);
            e.target.value = "";
          }}
        />
      )}
      {children}
    </div>
  );
}
