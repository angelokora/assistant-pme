import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Button, DropZone, FileTile, type DropZoneAccept } from "@elea/ds";
import type { UploadBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import { ActionSlot } from "./ActionSlot";
import { BlockDone } from "./BlockDone";
import { useUploadInbox } from "./uploadInbox";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

type Entry = {
  id: string;
  file: File;
  progress: number;
  previewUrl?: string;
  kind: "pdf" | "image" | "other";
};

/** Dépôt de documents : zone, exemples, progression, puis continuer ou refuser. */
export function UploadBlockView({ block, active }: BlockProps<UploadBlock>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const resolution = usePlayer((s) => s.resolutions[block.id]);
  const canAct = active && awaiting?.kind === "upload" && awaiting.blockId === block.id;
  const inbox = useUploadInbox((s) => s.files);
  const takeInbox = useUploadInbox((s) => s.take);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [rejectMsg, setRejectMsg] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const accept = (block.accept ?? ["pdf", "image"]) as DropZoneAccept[];
  const ready = entries.length > 0 && entries.every((e) => e.progress >= 1);

  useEffect(() => () => {
    timers.current.forEach(clearInterval);
    entries.forEach((e) => e.previewUrl && URL.revokeObjectURL(e.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fichiers venant du composer (pièces jointes) ou d'un événement global.
  useEffect(() => {
    if (!canAct || inbox.length === 0) return;
    addFiles(takeInbox());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbox, canAct]);

  useEffect(() => {
    const onExternal = (e: Event) => {
      const files = (e as CustomEvent<File[]>).detail;
      if (canAct && files?.length) addFiles(files);
    };
    window.addEventListener("elea:upload-files", onExternal);
    return () => window.removeEventListener("elea:upload-files", onExternal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAct]);

  function addFiles(files: File[]) {
    if (!canAct || !files.length) return;
    setRejectMsg(null);
    const next: Entry[] = files.map((file) => {
      const kind: Entry["kind"] = file.type.startsWith("image/") ? "image" : file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "other";
      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        progress: 0,
        kind,
        previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
      };
    });
    setEntries((prev) => [...prev, ...next]);
    for (const entry of next) animateProgress(entry.id);
  }

  function animateProgress(id: string) {
    let p = 0;
    const timer = window.setInterval(() => {
      p = Math.min(1, p + 0.16 + Math.random() * 0.12);
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, progress: p } : e)));
      if (p >= 1) window.clearInterval(timer);
    }, 140);
    timers.current.push(timer);
  }

  function remove(id: string) {
    setEntries((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((e) => e.id !== id);
    });
  }

  function continueUpload() {
    if (!canAct || !ready) return;
    const n = entries.length;
    reply({
      kind: "event",
      blockId: block.id,
      value: "upload",
      doneLabel: n > 1 ? `${n} documents déposés` : "Document déposé",
      vars: {
        fileCount: String(n),
        fileCountLabel: n === 1 ? "1 document" : `${n} documents`,
      },
    });
  }

  function skip() {
    if (!canAct || !block.skipLabel) return;
    reply({ kind: "event", blockId: block.id, value: "skip", doneLabel: block.skipLabel });
  }

  if (resolution) {
    return (
      <section className={styles.upload}>
        <BlockDone summary={resolution.summary} />
      </section>
    );
  }

  return (
    <section className={styles.upload}>
      <header className={styles.uploadHeader}>
        <h2 className="voice">{block.title}</h2>
        {block.why && <p className={styles.uploadWhy}>{block.why}</p>}
      </header>

      {block.examples && block.examples.length > 0 && (
        <ul className={styles.uploadExamples} aria-label="Exemples">
          {block.examples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ul>
      )}

      <DropZone
        label="Déposer des fichiers"
        desktopHint="PDF ou photo. Glisser-déposer pour ajouter."
        accept={accept}
        disabled={!canAct}
        onFiles={addFiles}
        onReject={(names) => setRejectMsg(`Format non accepté : ${names.join(", ")}`)}
      />

      {rejectMsg && (
        <p className={styles.uploadReject} role="alert">
          {rejectMsg}
        </p>
      )}

      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <FileTile
            key={e.id}
            name={e.file.name}
            progress={e.progress}
            kind={e.kind}
            previewUrl={e.previewUrl}
            onRemove={canAct ? () => remove(e.id) : undefined}
          />
        ))}
      </AnimatePresence>

      <ActionSlot active={canAct}>
        <div className={styles.uploadActions}>
          <Button full disabled={!canAct || !ready} onClick={continueUpload}>
            Continuer
          </Button>
          {block.skipLabel && (
            <Button variant="secondary" full disabled={!canAct} onClick={skip}>
              {block.skipLabel}
            </Button>
          )}
        </div>
      </ActionSlot>
    </section>
  );
}
