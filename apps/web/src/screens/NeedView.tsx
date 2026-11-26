import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Mic, Keyboard, X } from "lucide-react";
import { IconButton, blockList, spring } from "@elea/ds";
import { usePlayer, type Turn } from "../engine/player";
import { presetFor, SCENARIOS } from "../engine/scenarios";
import { useMemory } from "../memory/store";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { DimensionGrid } from "../blocks/DimensionsBlock";
import { useStrip } from "../blocks/strip";
import { Composer } from "../composer/Composer";
import { EleaLogo } from "../demo/EleaLogo";
import styles from "./NeedView.module.css";

function composerOffsetPx() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--composer-offset")) || 120;
}

/** Conteneur qui défile : feuille mobile (overflow) ou la fenêtre. */
function scrollParentOf(el: HTMLElement | null): HTMLElement | Window {
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

function readScrollTop(target: HTMLElement | Window) {
  return target === window ? window.scrollY : (target as HTMLElement).scrollTop;
}

function writeScrollTop(target: HTMLElement | Window, top: number, behavior: ScrollBehavior) {
  if (target === window) window.scrollTo({ top, behavior });
  else (target as HTMLElement).scrollTo({ top, behavior });
}

/** Un besoin en cours : le fil des tours d'Éléa et des réponses, et le composer. Aucun contenu en dur. */
export function NeedView() {
  const { scenarioId = "" } = useParams();
  const navigate = useNavigate();
  const { scenario, turns, start, stop } = usePlayer();
  const awaiting = usePlayer((s) => s.awaiting);
  const currentStep = usePlayer((s) => s.currentStep);
  const preset = useMemory((s) => s.preset);
  const reset = useMemory((s) => s.reset);
  const strip = useStrip();
  const flowRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  /** L'utilisateur remonte volontairement dans le fil : on ne force pas le suivi. */
  const pinnedUp = useRef(false);
  const lastScrollY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const programmaticScroll = useRef(false);

  useEffect(() => {
    if (usePlayer.getState().scenario?.id === scenarioId) return;
    const wanted = presetFor(scenarioId);
    if (scenarioId === "onboarding" || preset !== wanted) reset(wanted);
    useStrip.setState({ ids: [], blockVisible: true });
    start(scenarioId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  // Hauteur réelle de l'en-tête (+ bandeau) → scroll-margin.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height) + 8;
      root.style.setProperty("--need-header-offset", `${h}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--need-header-offset");
    };
  }, [strip.ids.length, strip.blockVisible]);

  useEffect(() => {
    const scroller = scrollParentOf(flowRef.current);
    const onScroll = () => {
      const y = readScrollTop(scroller);
      if (!programmaticScroll.current) {
        if (y + 48 < lastScrollY.current) pinnedUp.current = true;
        const max =
          scroller === window
            ? document.documentElement.scrollHeight - window.innerHeight
            : (scroller as HTMLElement).scrollHeight - (scroller as HTMLElement).clientHeight;
        if (y >= max - 96) pinnedUp.current = false;
      }
      lastScrollY.current = y;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Quand une étape attend une réponse, le bloc actif (bas du dernier tour)
   * doit être entièrement au-dessus de la zone du bas (composer / dock).
   * Un changement d'étape (saut démo inclus) force le suivi.
   */
  useEffect(() => {
    pinnedUp.current = false;
    let cancelled = false;

    const bringActiveIntoView = (behavior: ScrollBehavior) => {
      if (cancelled || pinnedUp.current) return;
      const flow = flowRef.current;
      const header = headerRef.current;
      if (!flow || !header) return;
      const turnsEls = flow.querySelectorAll<HTMLElement>("[data-turn]");
      const last = turnsEls[turnsEls.length - 1];
      if (!last) return;

      const scroller = scrollParentOf(flow);
      const headerH = header.getBoundingClientRect().height;
      const composerPx = composerOffsetPx();
      const usefulBottom = window.innerHeight - composerPx - 8;
      const rect = last.getBoundingClientRect();

      // Bas du bloc sous la zone utile → on remonte pour le dégager.
      let delta = 0;
      if (rect.bottom > usefulBottom) {
        delta = rect.bottom - usefulBottom;
      }
      // Haut du bloc sous l'en-tête → on descend un peu (tour court).
      if (rect.top < headerH + 2 && rect.height <= usefulBottom - headerH) {
        delta = Math.min(delta, rect.top - headerH - 8);
      }

      if (Math.abs(delta) < 4) return;
      const current = readScrollTop(scroller);
      const target = Math.max(0, Math.round(current + delta));
      if (Math.abs(current - target) < 4) return;
      programmaticScroll.current = true;
      writeScrollTop(scroller, target, behavior);
      window.setTimeout(() => {
        programmaticScroll.current = false;
        lastScrollY.current = readScrollTop(scroller);
      }, behavior === "smooth" ? 500 : 0);
    };

    const t1 = window.setTimeout(() => bringActiveIntoView("smooth"), 80);
    const t2 = window.setTimeout(() => bringActiveIntoView("smooth"), 420);
    const t3 = window.setTimeout(() => bringActiveIntoView("instant"), 900);
    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [turns.length, awaiting, currentStep]);

  const lastElea = [...turns].reverse().find((t) => t.from === "elea")?.id;
  const showStrip = strip.ids.length > 0 && !strip.blockVisible;

  return (
    <div className={styles.page}>
      <header ref={headerRef} className={styles.top}>
        <EleaLogo className={styles.brand} />
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
      <motion.figure
        data-turn="user"
        className={styles.user}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
      >
        <figcaption className={styles.userLabel}>
          {turn.mode === "voice" ? <Mic size={13} /> : <Keyboard size={13} />} Vous
        </figcaption>
        <blockquote>{turn.text}</blockquote>
      </motion.figure>
    );
  }
  return (
    <motion.section
      data-turn="elea"
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
