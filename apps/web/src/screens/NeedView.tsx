import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Mic, Keyboard, X } from "lucide-react";
import { IconButton, blockList, spring } from "@elea/ds";
import { ACTION_AWAIT_KINDS, usePlayer, type Turn } from "../engine/player";
import { presetFor, SCENARIOS } from "../engine/scenarios";
import { useMemory } from "../memory/store";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { DimensionGrid } from "../blocks/DimensionsBlock";
import { useStrip } from "../blocks/strip";
import { Composer } from "../composer/Composer";
import styles from "./NeedView.module.css";

/** Un besoin en cours : le fil des tours d'Éléa et des réponses, et le composer. Aucun contenu en dur. */
export function NeedView() {
  const { scenarioId = "" } = useParams();
  const navigate = useNavigate();
  const { scenario, turns, start, stop } = usePlayer();
  const awaiting = usePlayer((s) => s.awaiting);
  const preset = useMemory((s) => s.preset);
  const reset = useMemory((s) => s.reset);
  const strip = useStrip();
  const flowRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (usePlayer.getState().scenario?.id === scenarioId) return;
    const wanted = presetFor(scenarioId);
    if (scenarioId === "onboarding" || preset !== wanted) reset(wanted);
    useStrip.setState({ ids: [], blockVisible: true });
    start(scenarioId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  // Suit le dernier tour ; si une action est attendue, assure qu'elle n'est pas sous le composer.
  useEffect(() => {
    const t = setTimeout(() => {
      const flow = flowRef.current;
      if (!flow) return;
      if (awaiting && ACTION_AWAIT_KINDS.has(awaiting.kind)) {
        const actions = flow.querySelectorAll("button");
        const lastAction = [...actions].reverse().find((b) => !b.disabled && b.offsetParent);
        if (lastAction) {
          lastAction.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return;
        }
      }
      const last = flow.lastElementChild?.previousElementSibling as HTMLElement | null;
      last?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(t);
  }, [turns.length, awaiting]);

  const lastElea = [...turns].reverse().find((t) => t.from === "elea")?.id;
  const showStrip = strip.ids.length > 0 && !strip.blockVisible;

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <span className={styles.brand}>Éléa</span>
        <span className={styles.title}>{scenario?.title ?? SCENARIOS[scenarioId]?.title}</span>
        <IconButton label="Fermer ce besoin" variant="soft" size="sm" onClick={() => (stop(), navigate("/"))}>
          <X size={18} />
        </IconButton>
        <AnimatePresence>
          {showStrip && (
            <motion.div
              className={styles.strip}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring.gentle}
            >
              <DimensionGrid ids={strip.ids} compact />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main ref={flowRef} className={styles.flow}>
        {turns.map((turn) => (
          <TurnView key={turn.id} turn={turn} active={turn.id === lastElea} />
        ))}
        <div className={styles.end} />
      </main>
      <Composer />
    </div>
  );
}

function TurnView({ turn, active }: { turn: Turn; active: boolean }) {
  if (turn.from === "user") {
    return (
      <motion.figure className={styles.user} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring.gentle}>
        <figcaption className={styles.userLabel}>
          {turn.mode === "voice" ? <Mic size={13} /> : <Keyboard size={13} />} Vous
        </figcaption>
        <blockquote>{turn.text}</blockquote>
      </motion.figure>
    );
  }
  return (
    <motion.section
      className={[styles.turn, !active && styles.past].filter(Boolean).join(" ")}
      variants={blockList}
      initial="hidden"
      animate="shown"
    >
      {turn.blocks.map((b) => (
        <BlockRenderer key={b.id} block={b} active={active} />
      ))}
    </motion.section>
  );
}
