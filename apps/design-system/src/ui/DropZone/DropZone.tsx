import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { press, spring } from "../../motion/springs";
import { motion } from "motion/react";
import styles from "./DropZone.module.css";

export type DropZoneAccept = "pdf" | "image";

type Props = {
  /** Libellé principal (ex. « Déposer des fichiers »). */
  label: string;
  hint?: string;
  accept?: DropZoneAccept[];
  multiple?: boolean;
  disabled?: boolean;
  /** Capture appareil photo (mobile). */
  capture?: boolean;
  onFiles: (files: File[]) => void;
  /** Fichiers refusés (type non accepté). */
  onReject?: (names: string[]) => void;
  children?: ReactNode;
  className?: string;
};

const MIME: Record<DropZoneAccept, string[]> = {
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
};

/** Zone de dépôt générique : glisser-déposer, clic, ou capture photo. */
export function DropZone({
  label,
  hint,
  accept = ["pdf", "image"],
  multiple = true,
  disabled,
  capture,
  onFiles,
  onReject,
  children,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

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
      <motion.button
        type="button"
        className={[styles.zone, over && styles.over, disabled && styles.disabled].filter(Boolean).join(" ")}
        whileTap={disabled ? undefined : press}
        transition={spring.snappy}
        disabled={disabled}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className={styles.icon} aria-hidden>
          <Upload size={22} strokeWidth={1.75} />
        </span>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </motion.button>
      <input
        ref={inputRef}
        type="file"
        className={styles.input}
        accept={acceptAttr}
        multiple={multiple}
        capture={capture ? "environment" : undefined}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) filter(e.target.files);
          e.target.value = "";
        }}
      />
      {children}
    </div>
  );
}
