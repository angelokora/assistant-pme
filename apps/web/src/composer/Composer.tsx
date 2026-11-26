import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Camera, FileText, Keyboard, Mic, SendHorizontal, X } from "lucide-react";
import { ActionDock, Button, IconButton, Elephant, TranscriptText, Waveform, spring } from "@elea/ds";
import { pickFiles } from "../blocks/pickFiles";
import { useUploadInbox } from "../blocks/uploadInbox";
import { useDemo } from "../demo/demo";
import { ACTION_AWAIT_KINDS, usePlayer } from "../engine/player";
import type { ChoiceBlock, QuestionBlock } from "../engine/types";
import { useRadialMic } from "../shell/useRadialMic";
import { useActionDockHost } from "./actionDockHost";
import { useMediaQuery } from "./useMediaQuery";
import { useSimulatedSpeech } from "./useSimulatedSpeech";
import styles from "./Composer.module.css";

type Mode = "voice" | "listening" | "text";

const DEFAULT_FREE_HINT = "Ou dites-moi ce que vous aimeriez traiter";

/**
 * Porte d'entrée unique (ticket #10) : voix, texte, dépôt.
 * Mode compact quand l'attente n'est pas `input` mais qu'une saisie libre est permise (choix).
 */
export function Composer() {
  const awaiting = usePlayer((s) => s.awaiting);
  const orb = usePlayer((s) => s.orb);
  const reply = usePlayer((s) => s.reply);
  const turns = usePlayer((s) => s.turns);
  const activeChoice =
    awaiting?.kind === "choice"
      ? ([...turns].reverse().flatMap((t) => (t.from === "elea" ? t.blocks : [])).find((b) => b.type === "choice" && b.id === awaiting.blockId) as
          | ChoiceBlock
          | undefined)
      : undefined;
  const choiceFree = !!activeChoice?.allowFreeInput;
  const freeHint = activeChoice?.freeInputHint ?? DEFAULT_FREE_HINT;
  const simulated =
    awaiting?.kind === "input" ? awaiting.simulated : choiceFree ? (activeChoice?.freeSimulated ?? "") : "";
  const speech = useSimulatedSpeech(simulated);
  const mobile = useMediaQuery("(max-width: 639px)");
  const [params] = useSearchParams();
  const menuFromDemo = useDemo((s) => s.menuVariant);
  const menuB = mobile && (params.get("menu") === "b" || (params.get("menu") !== "a" && menuFromDemo === "b"));
  const setDockHost = useActionDockHost((s) => s.setHost);
  const dockClaimed = useActionDockHost((s) => s.claimed > 0);
  const scenarioId = usePlayer((s) => s.scenario?.id);
  const [mode, setMode] = useState<Mode>("voice");
  const [draft, setDraft] = useState("");
  /** Compact développé (focus ou micro) ; sinon barre une ligne. */
  const [compactOpen, setCompactOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const compactInputRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number>();
  const holding = useRef(false);
  /** Préférence saisie dans ce besoin : voix par défaut ; texte seulement si l'utilisateur l'a choisi. */
  const inputPreference = useRef<"voice" | "text">("voice");
  // Dock uniquement si un ActionSlot a une action à y porter (pas de barre vide).
  const showActionDock = mobile && dockClaimed && !choiceFree;
  /** Attente dont les actions sont dans le fil (ex. quick replies) : pas de chrome bas. */
  const silentAwait =
    mobile && !!awaiting && ACTION_AWAIT_KINDS.has(awaiting.kind) && !dockClaimed && !choiceFree;

  useEffect(() => {
    inputPreference.current = "voice";
    setMode("voice");
    setCompactOpen(false);
  }, [scenarioId]);

  // Ne pas vider le host dans le cleanup d'un effet qui se rejoue : le ref le remplit
  // au commit, puis le cleanup précédent l'effacerait juste après.
  useEffect(() => {
    if (!showActionDock) setDockHost(null);
  }, [showActionDock, setDockHost]);

  useEffect(() => () => setDockHost(null), [setDockHost]);

  // Hauteur réelle du dock → padding du fil (NeedView). Sans chrome : offset retiré.
  useEffect(() => {
    const el = dockRef.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => {
      if (silentAwait) {
        root.style.removeProperty("--composer-offset");
        root.style.removeProperty("--need-scroll-pad");
        return;
      }
      const h = Math.ceil(el.getBoundingClientRect().height);
      root.style.setProperty("--composer-offset", `${h}px`);
      root.style.setProperty("--need-scroll-pad", `${h}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--composer-offset");
      root.style.removeProperty("--need-scroll-pad");
    };
  }, [showActionDock, silentAwait, choiceFree, mode, compactOpen, awaiting?.kind]);

  // Pièces jointes proposées par la dernière question.
  const lastQuestion = [...turns].reverse().flatMap((t) => (t.from === "elea" ? t.blocks : [])).find((b) => b.type === "question") as
    | QuestionBlock
    | undefined;
  const attachments = lastQuestion?.attachments ?? [];

  useEffect(() => {
    setDraft("");
    speech.stop();
    setCompactOpen(false);
    if (awaiting?.kind === "input") {
      setMode(inputPreference.current === "text" ? "text" : "voice");
    } else if (choiceFree) {
      // Sous un choix : on reste en mode texte compact (pas le gros micro).
      setMode("text");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulated, choiceFree, awaiting?.kind]);

  useEffect(() => {
    if (awaiting?.kind === "input" || choiceFree) return;
    speech.stop();
    if (mode === "listening") setMode(inputPreference.current === "text" ? "text" : "voice");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaiting?.kind, choiceFree]);

  const inputOpen = awaiting?.kind === "input" || choiceFree;
  const useCompact = choiceFree && mode !== "listening";

  useEffect(() => {
    if (inputOpen && mode === "text" && !useCompact) textRef.current?.focus();
  }, [mode, inputOpen, useCompact]);

  useEffect(() => {
    if (useCompact && compactOpen) compactInputRef.current?.focus();
  }, [useCompact, compactOpen]);

  // Barre d'espace maintenue = parler (hors champ texte) — saisie libre pleine uniquement.
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

  function listen() {
    setMode("listening");
    setCompactOpen(true);
    speech.start();
  }

  const radial = useRadialMic({
    enabled: menuB && mode === "voice" && !choiceFree && !!inputOpen,
    onShortPress: listen,
  });
  function submitVoice() {
    speech.stop();
    if (!inputOpen) {
      setMode(choiceFree ? "text" : inputPreference.current === "text" ? "text" : "voice");
      setCompactOpen(false);
      return;
    }
    reply({ kind: "text", text: simulated || draft.trim(), mode: "voice" });
    setMode(choiceFree ? "text" : inputPreference.current === "text" ? "text" : "voice");
    setCompactOpen(false);
    setDraft("");
  }
  function submitText() {
    if (!inputOpen) return;
    const text = draft.trim() || simulated;
    if (!text) return;
    reply({ kind: "text", text, mode: "text" });
    setDraft("");
    setCompactOpen(false);
  }

  function onCompactBlur() {
    // Laisse le temps au clic micro / Envoyer de prendre le focus.
    window.setTimeout(() => {
      if (document.activeElement?.closest(`.${styles.dock}`)) return;
      if (!draft.trim()) setCompactOpen(false);
    }, 120);
  }

  return (
    <div ref={dockRef} className={[styles.dock, silentAwait && styles.dockEmpty].filter(Boolean).join(" ")}>
      {showActionDock ? (
        <ActionDock key="actions" role="region" aria-label="Actions">
          <div ref={(el) => setDockHost(el)} className={styles.actionHost} />
        </ActionDock>
      ) : silentAwait ? null : !inputOpen ? (
        <div className={styles.status}>
          <Elephant size={24} state={orb} decorative />
          <span>{orb === "thinking" ? "Éléa réfléchit…" : orb === "speaking" ? "Éléa vous répond" : "Éléa est là"}</span>
        </div>
      ) : useCompact && !compactOpen ? (
        <div className={styles.compact}>
          <input
            ref={compactInputRef}
            className={styles.compactInput}
            value={draft}
            placeholder={freeHint}
            aria-label={freeHint}
            onFocus={() => setCompactOpen(true)}
            onChange={(e) => {
              setDraft(e.target.value);
              if (e.target.value) setCompactOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitText();
              }
            }}
          />
          <button
            type="button"
            className={styles.compactMic}
            aria-label="Parler"
            onClick={() => {
              inputPreference.current = "voice";
              listen();
            }}
          >
            <Elephant size={32} state="idle" decorative mic="badge" />
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          {mode === "voice" && !choiceFree ? (
            <motion.div key="voice" className={styles.voice} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={spring.gentle}>
              {menuB ? (
                <motion.button
                  layoutId="composer-shell"
                  className={styles.mic}
                  aria-label="Toucher pour parler, glisser ou appui long pour le menu"
                  whileTap={{ scale: 0.94 }}
                  transition={spring.gentle}
                  {...radial}
                >
                  <Elephant size={72} state="idle" decorative mic="badge" className={styles.micOrb} />
                </motion.button>
              ) : (
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
                  <Elephant size={72} state="idle" decorative mic="badge" className={styles.micOrb} />
                </motion.button>
              )}
              <p className={styles.hint}>{menuB ? "Toucher pour parler · glisser pour le menu" : "Toucher pour parler"}</p>
              <button
                className={styles.switch}
                onClick={() => {
                  inputPreference.current = "text";
                  setMode("text");
                }}
              >
                Écrire plutôt
              </button>
              {attachments.length > 0 && <Attachments kinds={attachments} />}
            </motion.div>
          ) : mode === "listening" ? (
            <motion.div key="listening" layoutId="composer-shell" className={styles.panel} transition={spring.gentle}>
              <div className={styles.panelHead}>
                <Elephant size={36} state="listening" level={speech.level} decorative />
                <div className={styles.listenLabel}>
                  <strong>Je vous écoute…</strong>
                  <Waveform level={speech.level} active={!speech.finished} />
                </div>
                <Button variant="inverse" size="sm" onClick={submitVoice} className={speech.finished ? styles.ready : undefined}>
                  J'ai terminé
                </Button>
              </div>
              <IconButton
                label="Annuler"
                variant="soft"
                size="sm"
                className={styles.cancel}
                onClick={() => {
                  speech.stop();
                  setMode(choiceFree ? "text" : "voice");
                  setCompactOpen(false);
                }}
              >
                <X size={16} />
              </IconButton>
              <TranscriptText text={simulated} visibleWords={speech.visible} className={styles.transcript} />
              {attachments.length > 0 && <Attachments kinds={attachments} />}
            </motion.div>
          ) : choiceFree ? (
            <motion.div
              key="compact-open"
              className={styles.textPanel}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={spring.gentle}
              onBlur={onCompactBlur}
            >
              <div className={styles.field}>
                {!draft && <span className={styles.ghost} aria-hidden>{simulated || freeHint}</span>}
                <textarea
                  ref={textRef}
                  rows={2}
                  value={draft}
                  aria-label={freeHint}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={onCompactBlur}
                  onKeyDown={(e) => {
                    if ((e.key === "Tab" || e.key === "ArrowRight") && !draft && simulated) {
                      e.preventDefault();
                      setDraft(simulated);
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitText();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      if (!draft.trim()) setCompactOpen(false);
                    }
                  }}
                />
              </div>
              <div className={styles.textActions}>
                <IconButton
                  label="Parler"
                  variant="soft"
                  onClick={() => {
                    inputPreference.current = "voice";
                    listen();
                  }}
                >
                  <Mic size={18} />
                </IconButton>
                <span className={styles.tip}>
                  <Keyboard size={14} /> {freeHint}
                </span>
                <Button size="sm" icon={<SendHorizontal size={16} />} onClick={submitText} disabled={!draft.trim() && !simulated}>
                  Envoyer
                </Button>
              </div>
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
                <IconButton
                  label="Parler plutôt"
                  variant="soft"
                  onClick={() => {
                    inputPreference.current = "voice";
                    setMode("voice");
                  }}
                >
                  <Mic size={18} />
                </IconButton>
                <span className={styles.tip}>
                  <Keyboard size={14} /> Tab pour reprendre la suggestion
                </span>
                <Button size="sm" icon={<SendHorizontal size={16} />} onClick={submitText}>
                  Envoyer
                </Button>
              </div>
              {attachments.length > 0 && <Attachments kinds={attachments} />}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function Attachments({ kinds }: { kinds: ("document" | "photo")[] }) {
  const push = useUploadInbox((s) => s.push);
  const awaiting = usePlayer((s) => s.awaiting);

  async function pick(kind: "document" | "photo") {
    const files = await pickFiles({
      accept: kind === "photo" ? ["image"] : ["pdf", "image"],
      multiple: true,
      capture: kind === "photo",
    });
    if (!files.length) return;
    if (awaiting?.kind === "upload") push(files);
  }

  return (
    <div className={styles.attachments}>
      {kinds.includes("document") && (
        <button type="button" className={styles.attach} onClick={() => void pick("document")}>
          <FileText size={16} /> Ajouter un document
        </button>
      )}
      {kinds.includes("photo") && (
        <button type="button" className={styles.attach} onClick={() => void pick("photo")}>
          <Camera size={16} /> Prendre une photo
        </button>
      )}
    </div>
  );
}
