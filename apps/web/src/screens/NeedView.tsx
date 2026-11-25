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

  // Hauteur réelle de l'en-tête (+ bandeau) → scroll-margin et padding bas du fil.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const root = document.documentElement;
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height) + 8;
      root.style.setProperty("--need-header-offset", `${h}px`);
      // Assez de marge pour amener le début d'un tour sous l'en-tête.
      root.style.setProperty("--need-scroll-pad", `${Math.max(0, window.innerHeight - h)}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--need-header-offset");
      root.style.removeProperty("--need-scroll-pad");
    };
  }, [strip.ids.length, strip.blockVisible]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (!programmaticScroll.current) {
        if (y + 48 < lastScrollY.current) pinnedUp.current = true;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (y >= max - 96) pinnedUp.current = false;
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Amène le début du dernier tour sous l'en-tête.
   * Ne cible jamais les boutons de l'ActionDock (hors fil).
   * Respecte un éventuel défilement manuel vers le haut.
   */
  useEffect(() => {
    if (pinnedUp.current) return;
    let cancelled = false;

    const bringTurnIntoView = () => {
      if (cancelled || pinnedUp.current) return;
      const flow = flowRef.current;
      const header = headerRef.current;
      if (!flow || !header) return;
      const turnsEls = flow.querySelectorAll<HTMLElement>("[data-turn]");
      const last = turnsEls[turnsEls.length - 1];
      if (!last) return;

      const headerH = header.getBoundingClientRect().height;
      const rect = last.getBoundingClientRect();
      // Déjà bien placé : début sous l'en-tête, dans la moitié haute de l'écran utile.
      const composerPx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--composer-offset")) || 120;
      const usefulBottom = window.innerHeight - composerPx;
      if (rect.top >= headerH + 2 && rect.top <= headerH + Math.max(120, (usefulBottom - headerH) * 0.45)) {
        return;
      }

      const absoluteTop = rect.top + window.scrollY;
      const target = Math.max(0, Math.round(absoluteTop - headerH - 8));
      if (Math.abs(window.scrollY - target) < 4) return;
      programmaticScroll.current = true;
      // Derniers passages en instant pour contrer les layouts tardifs (ActionDock).
      window.scrollTo({ top: target, behavior: "smooth" });
      window.setTimeout(() => {
        programmaticScroll.current = false;
        lastScrollY.current = window.scrollY;
      }, 500);
    };

    const bringInstant = () => {
      if (cancelled || pinnedUp.current) return;
      const flow = flowRef.current;
      const header = headerRef.current;
      if (!flow || !header) return;
      const last = flow.querySelectorAll<HTMLElement>("[data-turn]")[
        flow.querySelectorAll("[data-turn]").length - 1
      ];
      if (!last) return;
      const headerH = header.getBoundingClientRect().height;
      const absoluteTop = last.getBoundingClientRect().top + window.scrollY;
      const target = Math.max(0, Math.round(absoluteTop - headerH - 8));
      programmaticScroll.current = true;
      window.scrollTo({ top: target, behavior: "instant" });
      programmaticScroll.current = false;
      lastScrollY.current = window.scrollY;
    };

    // Passages échelonnés : entrée des blocs, puis ActionDock / padding.
    const t1 = window.setTimeout(bringTurnIntoView, 80);
    const t2 = window.setTimeout(bringTurnIntoView, 420);
    const t3 = window.setTimeout(bringInstant, 900);    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [turns.length, awaiting]);

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
