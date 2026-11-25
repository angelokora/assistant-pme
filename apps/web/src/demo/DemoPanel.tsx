import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { spring } from "@elea/ds";
import { useDemo } from "./demo";
import { useMemory } from "../memory/store";
import { usePlayer } from "../engine/player";
import { SCENARIO_INDEX, presetFor } from "../engine/scenarios";
import styles from "./DemoPanel.module.css";

/** Panneau démo minimal (version complète : ticket #11). Raccourci : Maj + D. */
export function DemoPanel() {
  const { open, toggle, animations, setAnimations } = useDemo();
  const reset = useMemory((s) => s.reset);
  const stop = usePlayer((s) => s.stop);
  const start = usePlayer((s) => s.start);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "d" && !(e.target as HTMLElement).closest("input, textarea")) toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside className={styles.panel} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={spring.sheet}>
          <p className={styles.title}>Démo</p>
          {SCENARIO_INDEX.map((s) => (
            <button
              key={s.id}
              className={styles.item}
              onClick={() => {
                stop();
                reset(presetFor(s.id));
                start(s.id);
                navigate(`/besoin/${s.id}`);
                toggle();
              }}
            >
              {s.entry} <span>{s.id}</span>
            </button>
          ))}
          <hr />
          <button className={styles.item} onClick={() => (stop(), reset("first-visit"), navigate("/"), toggle())}>
            Réinitialiser : premier lancement
          </button>
          <button className={styles.item} onClick={() => (stop(), reset("returning"), navigate("/"), toggle())}>
            Réinitialiser : trois semaines plus tard
          </button>
          <label className={styles.toggle}>
            <input type="checkbox" checked={animations} onChange={(e) => setAnimations(e.target.checked)} /> Animations
          </label>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
