import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, FileText, Keyboard, Mic, SendHorizontal, X } from "lucide-react";
import { Button, IconButton, Orb, TranscriptText, Waveform, spring } from "@elea/ds";
import { usePlayer } from "../engine/player";
import type { QuestionBlock } from "../engine/types";
import { useSimulatedSpeech } from "./useSimulatedSpeech";
import styles from "./Composer.module.css";

type Mode = "voice" | "listening" | "text";

/**
 * Porte d'entrée unique (ticket #10) : voix, texte, dépôt.
 * Pendant un besoin, il répond à l'attente `input` du moteur ; sinon il affiche l'état d'Éléa.
 */
export function Composer() {
  const awaiting = usePlayer((s) => s.awaiting);
  const orb = usePlayer((s) => s.orb);
  const reply = usePlayer((s) => s.reply);
  const turns = usePlayer((s) => s.turns);
  const simulated = awaiting?.kind === "input" ? awaiting.simulated : "";
  const speech = useSimulatedSpeech(simulated);
  const [mode, setMode] = useState<Mode>("voice");
  const [draft, setDraft] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const holdTimer = useRef<number>();
  const holding = useRef(false);

  // Pièces jointes proposées par la dernière question.
  const lastQuestion = [...turns].reverse().flatMap((t) => (t.from === "elea" ? t.blocks : [])).find((b) => b.type === "question") as
    | QuestionBlock
    | undefined;
  const attachments = lastQuestion?.attachments ?? [];

  useEffect(() => {
    setDraft("");
    if (mode === "listening") setMode("voice");
    speech.stop();
    // Nouvelle attente : on revient au mode de départ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulated]);

  useEffect(() => {
    if (mode === "text") textRef.current?.focus();
  }, [mode]);

  // Barre d'espace maintenue = parler (hors champ texte).
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || awaiting?.kind !== "input" || mode !== "voice") return;
      if ((e.target as HTMLElement).closest("input, textarea, button")) return;
      e.preventDefault();
      listen();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  const inputOpen = awaiting?.kind === "input";

  function listen() {
    setMode("listening");
    speech.start();
  }
  function submitVoice() {
    speech.stop();
    reply({ kind: "text", text: simulated, mode: "voice" });
    setMode("voice");
  }
  function submitText() {
    const text = draft.trim() || simulated;
    reply({ kind: "text", text, mode: "text" });
    setDraft("");
  }

  return (
    <div className={styles.dock}>
      <AnimatePresence mode="popLayout" initial={false}>
        {!inputOpen ? (
          <motion.div
            key="status"
            className={styles.status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={spring.gentle}
          >
            <Orb size={20} state={orb} decorative />
            <span>{orb === "thinking" ? "Éléa réfléchit…" : orb === "speaking" ? "Éléa vous répond" : "Éléa est là"}</span>
          </motion.div>
        ) : mode === "voice" ? (
          <motion.div key="voice" className={styles.voice} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={spring.gentle}>
            <motion.button
              layoutId="composer-shell"
              className={styles.mic}
              aria-label="Toucher pour parler, maintenir pour parler en continu"
              whileTap={{ scale: 0.94 }}
              transition={spring.gentle}
              onPointerDown={() => {
                holding.current = false;
                holdTimer.current = window.setTimeout(() => {
                  holding.current = true;
                  listen();
                }, 380);
              }}
              onPointerUp={() => {
                window.clearTimeout(holdTimer.current);
                if (holding.current) submitVoice();
                else listen();
              }}
              onPointerLeave={() => window.clearTimeout(holdTimer.current)}
            >
              <Orb size={72} state="idle" decorative className={styles.micOrb} />
              <Mic className={styles.micIcon} size={26} strokeWidth={2} />
            </motion.button>
            <p className={styles.hint}>Toucher pour parler</p>
            <button className={styles.switch} onClick={() => setMode("text")}>
              Écrire plutôt
            </button>
            {attachments.length > 0 && <Attachments />}
          </motion.div>
        ) : mode === "listening" ? (
          <motion.div
            key="listening"
            layoutId="composer-shell"
            className={styles.panel}
            transition={spring.gentle}
          >
            <div className={styles.panelHead}>
              <Orb size={36} state="listening" level={speech.level} decorative />
              <div className={styles.listenLabel}>
                <strong>Je vous écoute…</strong>
                <Waveform level={speech.level} active={!speech.finished} />
              </div>
              <Button variant="inverse" size="sm" onClick={submitVoice} className={speech.finished ? styles.ready : undefined}>
                J'ai terminé
              </Button>
            </div>
            <IconButton label="Annuler" variant="soft" size="sm" className={styles.cancel} onClick={() => (speech.stop(), setMode("voice"))}>
              <X size={16} />
            </IconButton>
            <TranscriptText text={simulated} visibleWords={speech.visible} className={styles.transcript} />
            {attachments.length > 0 && <Attachments />}
          </motion.div>
        ) : (
          <motion.div key="text" layoutId="composer-shell" className={styles.textPanel} transition={spring.gentle}>
            <div className={styles.field}>
              {!draft && <span className={styles.ghost} aria-hidden>{simulated}</span>}
              <textarea
                ref={textRef}
                rows={3}
                value={draft}
                aria-label="Votre réponse"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === "Tab" || e.key === "ArrowRight") && !draft) {
                    e.preventDefault();
                    setDraft(simulated);
                  }
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitText();
                  }
                }}
              />
            </div>
            <div className={styles.textActions}>
              <IconButton label="Parler plutôt" variant="soft" onClick={() => setMode("voice")}>
                <Mic size={18} />
              </IconButton>
              <span className={styles.tip}>
                <Keyboard size={14} /> Tab pour reprendre la suggestion
              </span>
              <Button size="sm" icon={<SendHorizontal size={16} />} onClick={submitText}>
                Envoyer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Attachments() {
  return (
    <div className={styles.attachments}>
      <button className={styles.attach}>
        <FileText size={16} /> Ajouter un document
      </button>
      <button className={styles.attach}>
        <Camera size={16} /> Prendre une photo
      </button>
    </div>
  );
}
