import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Keyboard, Mic, SendHorizontal } from "lucide-react";
import { IconButton, Orb, spring } from "@elea/ds";
import { motion } from "motion/react";
import { ROUTES, routeUtterance } from "../engine/router";
import { usePlayer } from "../engine/player";
import { useDemo } from "../demo/demo";
import { useSimulatedSpeech } from "../composer/useSimulatedSpeech";
import { useRadialMic } from "../shell/useRadialMic";
import { useComposerContext } from "../shell/composerContext";
import styles from "./HomeComposer.module.css";

const FALLBACK_SIMULATED = ROUTES.unknown.examples[0]?.utterance
  ?? "Je veux embaucher une vendeuse pour les week-ends. Je fais un CDD ou un CDI ?";

export type HomeComposerHandle = {
  listen: () => void;
};

type Props = {
  /** Ouvre le mode texte dès le montage (bouton composer de la barre). */
  forceOpen?: boolean;
  onHandled?: () => void;
  /** Accueil C + menu B : l'orbe de présence porte la voix ; pas de second micro. */
  hideVoiceOrb?: boolean;
  /** Signale une demande non reconnue (pour mettre en avant les jetons de l'accueil). */
  onUnknownChange?: (unknown: boolean) => void;
};

/**
 * Composer de l'accueil : aiguillage via `routeUtterance`, sinon phrase d'Éléa au-dessus.
 */
export const HomeComposer = forwardRef<HomeComposerHandle, Props>(function HomeComposer(
  { forceOpen, onHandled, hideVoiceOrb, onUnknownChange },
  ref,
) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const menuFromDemo = useDemo((s) => s.menuVariant);
  const menuB = (params.get("menu") === "b" ? true : params.get("menu") === "a" ? false : menuFromDemo === "b");
  const stop = usePlayer((s) => s.stop);
  const start = usePlayer((s) => s.start);
  const aboutTitle = useComposerContext((s) => s.aboutTitle);
  const clearAbout = useComposerContext((s) => s.clear);
  const [mode, setMode] = useState<"voice" | "listening" | "text">(forceOpen ? "text" : "voice");
  const [draft, setDraft] = useState("");
  const [unknown, setUnknown] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSimulatedSpeech(FALLBACK_SIMULATED);
  const startSpeech = speech.start;

  const setUnknownState = useCallback(
    (value: boolean) => {
      setUnknown(value);
      onUnknownChange?.(value);
    },
    [onUnknownChange],
  );

  const listen = useCallback(() => {
    setMode("listening");
    startSpeech();
  }, [startSpeech]);

  useImperativeHandle(ref, () => ({ listen }), [listen]);

  const radial = useRadialMic({
    enabled: menuB && !hideVoiceOrb && mode === "voice",
    onShortPress: listen,
  });

  useEffect(() => {
    const state = location.state as { openComposer?: boolean; draft?: string } | null;
    if (forceOpen || state?.openComposer) {
      setMode("text");
      if (state?.draft) setDraft(state.draft);
      onHandled?.();
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [forceOpen, location.state, onHandled]);

  function launch(scenarioId: string, utterance?: string) {
    stop();
    start(scenarioId, utterance ? { withUtterance: utterance } : undefined);
    navigate(`/besoin/${scenarioId}`);
    setUnknownState(false);
    setDraft("");
  }

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = routeUtterance(trimmed);
    if (id) {
      launch(id, trimmed);
      return;
    }
    setUnknownState(true);
  }

  function submitVoice() {
    speech.stop();
    submit(FALLBACK_SIMULATED);
    setMode("voice");
  }

  const showVoiceOrb = mode === "voice" && !hideVoiceOrb;

  return (
    <div className={styles.wrap}>
      {aboutTitle && (
        <div className={styles.about} role="status">
          <span className={styles.aboutLabel}>À propos de :</span> {aboutTitle}
          <button type="button" className={styles.aboutClear} onClick={clearAbout} aria-label="Retirer le contexte">
            ×
          </button>
        </div>
      )}

      {unknown && (
        <div className={styles.unknownLine} role="status">
          <Orb size={28} state="idle" decorative />
          <p className={styles.unknownText}>
            {ROUTES.unknown.title}. Essayez l'un des exemples ci-dessus.
          </p>
        </div>
      )}

      {showVoiceOrb && (
        <motion.div className={styles.voice} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring.gentle}>
          <button
            type="button"
            className={styles.mic}
            aria-label={menuB ? "Toucher pour parler, glisser ou appui long pour le menu" : "Toucher pour parler"}
            {...radial}
          >
            <Orb size={56} state="idle" decorative />
            <Mic size={22} strokeWidth={1.75} className={styles.micIcon} />
          </button>
          <button type="button" className={styles.switch} onClick={() => setMode("text")}>
            <Keyboard size={14} strokeWidth={1.75} /> Écrire plutôt
          </button>
        </motion.div>
      )}

      {mode === "voice" && hideVoiceOrb && (
        <button type="button" className={styles.switch} onClick={() => setMode("text")}>
          <Keyboard size={14} strokeWidth={1.75} /> Écrire plutôt
        </button>
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
              setUnknownState(false);
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
});
