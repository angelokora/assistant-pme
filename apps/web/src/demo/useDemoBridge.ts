import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMemory } from "../memory/store";
import { usePlayer } from "../engine/player";
import { presetFor } from "../engine/scenarios";
import { useDemo } from "./demo";
import { useTheme } from "../theme/theme";
import {
  applySafeInsets,
  initSafeInsetsFromUrl,
  isFrameMode,
  postDemoReady,
  subscribeDemoCommands,
  type DemoCommand,
  type DemoSyncState,
} from "./bridge";

function applySyncState(
  state: DemoSyncState,
  setters: {
    setHomeVariant: (v: DemoSyncState["homeVariant"]) => void;
    setMenuVariant: (v: DemoSyncState["menuVariant"]) => void;
    setFindVariant: (v: DemoSyncState["findVariant"]) => void;
    setAnimations: (v: boolean) => void;
    setMailInterrupted: (v: boolean) => void;
    setShowVariantPill: (v: boolean) => void;
    setTheme: (v: DemoSyncState["theme"]) => void;
  },
) {
  setters.setHomeVariant(state.homeVariant);
  setters.setMenuVariant(state.menuVariant);
  setters.setFindVariant(state.findVariant);
  setters.setAnimations(state.animations);
  setters.setMailInterrupted(state.mailInterrupted);
  setters.setShowVariantPill(false);
  if (state.theme) setters.setTheme(state.theme);
  applySafeInsets(state.safeTop, state.safeBottom);
}

/** Dans l'iframe appareil : poignée de main + exécution des commandes du panneau. */
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
  const setTheme = useTheme((s) => s.setTheme);

  useEffect(() => {
    if (!isFrameMode()) return;

    initSafeInsetsFromUrl();
    document.documentElement.dataset.frame = "1";
    postDemoReady();

    return () => {
      delete document.documentElement.dataset.frame;
    };
  }, []);

  useEffect(() => {
    if (!isFrameMode()) return;

    const setters = {
      setHomeVariant,
      setMenuVariant,
      setFindVariant,
      setAnimations,
      setMailInterrupted,
      setShowVariantPill,
      setTheme,
    };

    return subscribeDemoCommands((cmd: DemoCommand) => {
      switch (cmd.type) {
        case "sync":
          applySyncState(cmd.state, setters);
          break;
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
        case "setTheme":
          setTheme(cmd.value);
          break;
        case "setMailInterrupted":
          setMailInterrupted(cmd.value);
          break;
        case "setShowVariantPill":
          setShowVariantPill(false);
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
    setTheme,
  ]);
}
