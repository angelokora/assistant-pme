import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMemory } from "../memory/store";
import { usePlayer } from "../engine/player";
import { presetFor } from "../engine/scenarios";
import { useDemo } from "./demo";
import { isFrameMode, subscribeDemoCommands, type DemoCommand } from "./bridge";

/** Dans l'iframe (`?frame=1`), exécute les commandes du panneau hôte. */
export function useDemoBridge() {
  const navigate = useNavigate();
  const reset = useMemory((s) => s.reset);
  const stop = usePlayer((s) => s.stop);
  const start = usePlayer((s) => s.start);
  const jumpTo = usePlayer((s) => s.jumpTo);
  const setHomeVariant = useDemo((s) => s.setHomeVariant);
  const setMenuVariant = useDemo((s) => s.setMenuVariant);
  const setFindVariant = useDemo((s) => s.setFindVariant);
  const setAnimations = useDemo((s) => s.setAnimations);
  const setMailInterrupted = useDemo((s) => s.setMailInterrupted);
  const setShowVariantPill = useDemo((s) => s.setShowVariantPill);

  useEffect(() => {
    if (!isFrameMode()) return;

    const params = new URLSearchParams(window.location.search);
    const top = params.get("safeTop");
    const bottom = params.get("safeBottom");
    const root = document.documentElement;
    if (top) root.style.setProperty("--safe-top", `${top}px`);
    if (bottom) root.style.setProperty("--safe-bottom", `${bottom}px`);
    root.dataset.frame = "1";

    return () => {
      root.style.removeProperty("--safe-top");
      root.style.removeProperty("--safe-bottom");
      delete root.dataset.frame;
    };
  }, []);

  useEffect(() => {
    if (!isFrameMode()) return;

    return subscribeDemoCommands((cmd: DemoCommand) => {
      switch (cmd.type) {
        case "reset":
          stop();
          reset(cmd.preset);
          navigate("/");
          break;
        case "start":
          stop();
          reset(presetFor(cmd.scenarioId));
          start(cmd.scenarioId);
          navigate(`/besoin/${cmd.scenarioId}`);
          break;
        case "jumpTo":
          stop();
          reset(presetFor(cmd.scenarioId));
          jumpTo(cmd.scenarioId, cmd.stepId);
          navigate(`/besoin/${cmd.scenarioId}`);
          break;
        case "navigate":
          navigate(cmd.path);
          break;
        case "setHomeVariant":
          setHomeVariant(cmd.value);
          stop();
          reset("returning");
          navigate(`/?v=${cmd.value}`);
          break;
        case "setMenuVariant":
          setMenuVariant(cmd.value);
          break;
        case "setFindVariant":
          setFindVariant(cmd.value);
          break;
        case "setAnimations":
          setAnimations(cmd.value);
          break;
        case "setMailInterrupted":
          setMailInterrupted(cmd.value);
          break;
        case "setShowVariantPill":
          setShowVariantPill(cmd.value);
          break;
      }
    });
  }, [
    navigate,
    reset,
    stop,
    start,
    jumpTo,
    setHomeVariant,
    setMenuVariant,
    setFindVariant,
    setAnimations,
    setMailInterrupted,
    setShowVariantPill,
  ]);
}
