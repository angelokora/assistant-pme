import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Keyboard, Mic, SendHorizontal } from "lucide-react";
import { Callout, IconButton, Orb, spring } from "@elea/ds";
import { motion } from "motion/react";
import { routeUtterance } from "../engine/router";
import { SCENARIOS } from "../engine/scenarios";
import { usePlayer } from "../engine/player";
import { useMemory } from "../memory/store";
import { useSimulatedSpeech } from "../composer/useSimulatedSpeech";
import styles from "./HomeComposer.module.css";

const FALLBACK_SIMULATED = "Je veux embaucher une vendeuse pour les week-ends. Je fais un CDD ou un CDI ?";

type Props = {
  /** Ouvre le mode texte dès le montage (bouton composer de la barre). */
  forceOpen?: boolean;
  onHandled?: () => void;
};

/**
 * Composer de l'accueil : aiguillage via `routeUtterance`, sinon callout des besoins disponibles.
 */
export function HomeComposer({ forceOpen, onHandled }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const stop = usePlayer((s) => s.stop);
  const start = usePlayer((s) => s.start);
  const suggestions = useMemory((s) => s.home?.suggestions ?? []);
  const [mode, setMode] = useState<"voice" | "listening" | "text">(forceOpen ? "text" : "voice");
  const [draft, setDraft] = useState("");
  const [unknown, setUnknown] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSimulatedSpeech(FALLBACK_SIMULATED);

  useEffect(() => {
    if (forceOpen || (location.state as { openComposer?: boolean } | null)?.openComposer) {
      setMode("text");
      onHandled?.();
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [forceOpen, location.state, onHandled]);

  function launch(scenarioId: string) {
    stop();
    start(scenarioId);
    navigate(`/besoin/${scenarioId}`);
    setUnknown(false);
    setDraft("");
  }

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = routeUtterance(trimmed);
    if (id) {
      launch(id);
      return;
    }
    setUnknown(true);
  }

  function listen() {
    setMode("listening");
    speech.start();
  }

  function submitVoice() {
    speech.stop();
    submit(FALLBACK_SIMULATED);
    setMode("voice");
  }

  const available = suggestions.length
    ? suggestions
    : Object.keys(SCENARIOS)
        .filter((id) => id !== "onboarding")
        .map((id) => ({ id, label: SCENARIOS[id].title, scenarioId: id }));

  return (
    <div className={styles.wrap}>
      {unknown && (
        <div className={styles.unknown}>
          <Callout tone="info" title="Je n'ai pas reconnu cette demande">
            Essayez l'un de ces besoins de démonstration.
          </Callout>
          <div className={styles.links}>
            {available.map((s) => (
              <button key={s.id} type="button" className={styles.link} onClick={() => launch(s.scenarioId)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "voice" && (
        <motion.div className={styles.voice} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring.gentle}>
          <button type="button" className={styles.mic} aria-label="Toucher pour parler" onClick={listen}>
            <Orb size={56} state="idle" decorative />
            <Mic size={22} strokeWidth={1.75} className={styles.micIcon} />
          </button>
          <button type="button" className={styles.switch} onClick={() => setMode("text")}>
            <Keyboard size={14} strokeWidth={1.75} /> Écrire plutôt
          </button>
        </motion.div>
      )}

      {mode === "listening" && (
        <div className={styles.panel}>
          <Orb size={32} state="listening" level={speech.level} decorative />
          <p className={styles.listenLabel}>Je vous écoute…</p>
          <IconButton label="Envoyer" onClick={submitVoice}>
            <SendHorizontal size={16} />
          </IconButton>
        </div>
      )}

      {mode === "text" && (
        <div className={styles.panel}>
          <textarea
            ref={inputRef}
            className={styles.input}
            rows={2}
            value={draft}
            placeholder="Posez une question, donnez une info…"
            aria-label="Demander à Éléa"
            onChange={(e) => {
              setDraft(e.target.value);
              setUnknown(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(draft);
              }
              if (e.key === "Tab" && !draft.trim()) {
                e.preventDefault();
                setDraft(FALLBACK_SIMULATED);
              }
            }}
          />
          <div className={styles.row}>
            <button type="button" className={styles.switch} onClick={() => setMode("voice")}>
              <Mic size={14} strokeWidth={1.75} /> Parler
            </button>
            <IconButton label="Envoyer" disabled={!draft.trim()} onClick={() => submit(draft)}>
              <SendHorizontal size={16} />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
