import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { spring } from "@elea/ds";
import { useDemo } from "./demo";
import { useMemory } from "../memory/store";
import { usePlayer } from "../engine/player";
import { SCENARIO_INDEX, SCENARIOS, presetFor } from "../engine/scenarios";
import styles from "./DemoPanel.module.css";

/** Panneau démo : variantes, reset, saut à une étape, Maj + D / appui long logo. */
export function DemoPanel() {
  const {
    open,
    toggle,
    setOpen,
    animations,
    setAnimations,
    homeVariant,
    setHomeVariant,
    menuVariant,
    setMenuVariant,
    findVariant,
    setFindVariant,
    mailInterrupted,
    setMailInterrupted,
  } = useDemo();
  const reset = useMemory((s) => s.reset);
  const stop = usePlayer((s) => s.stop);
  const start = usePlayer((s) => s.start);
  const jumpTo = usePlayer((s) => s.jumpTo);
  const navigate = useNavigate();

  const [jumpScenario, setJumpScenario] = useState(SCENARIO_INDEX[0]?.id ?? "onboarding");
  const [jumpStep, setJumpStep] = useState("");

  const stepIds = useMemo(() => {
    const steps = SCENARIOS[jumpScenario]?.steps ?? {};
    return Object.keys(steps);
  }, [jumpScenario]);

  useEffect(() => {
    setJumpStep((prev) => (stepIds.includes(prev) ? prev : (stepIds[0] ?? "")));
  }, [stepIds]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "d" && !(e.target as HTMLElement).closest("input, textarea, select")) {
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  function close() {
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className={styles.panel}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={spring.sheet}
          role="dialog"
          aria-label="Panneau démo"
        >
          <div className={styles.head}>
            <p className={styles.title}>Démo</p>
            <button type="button" className={styles.close} onClick={close}>
              Fermer
            </button>
          </div>

          <p className={styles.group}>Accueil</p>
          {(["a", "b", "c"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={[styles.item, homeVariant === v && styles.active].filter(Boolean).join(" ")}
              onClick={() => {
                setHomeVariant(v);
                stop();
                reset("returning");
                navigate(`/?v=${v}`);
              }}
            >
              {v === "a" ? "A · Fil du jour" : v === "b" ? "B · Carnet" : "C · Présence"}
            </button>
          ))}

          <p className={styles.group}>Menu</p>
          {(["a", "b"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={[styles.item, menuVariant === v && styles.active].filter(Boolean).join(" ")}
              onClick={() => setMenuVariant(v)}
            >
              {v === "a" ? "A · Barre basse" : "B · Radial"}
            </button>
          ))}

          <p className={styles.group}>Retrouver (à venir #22)</p>
          {(["a", "b"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={[styles.item, findVariant === v && styles.active].filter(Boolean).join(" ")}
              onClick={() => setFindVariant(v)}
            >
              {v === "a" ? "A · Liste" : "B · Carte"}
            </button>
          ))}

          <hr />

          <p className={styles.group}>Saut à une étape</p>
          <label className={styles.field}>
            <span>Scénario</span>
            <select
              value={jumpScenario}
              onChange={(e) => setJumpScenario(e.target.value)}
              className={styles.select}
            >
              {SCENARIO_INDEX.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.entry} ({s.id})
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Étape</span>
            <select value={jumpStep} onChange={(e) => setJumpStep(e.target.value)} className={styles.select}>
              {stepIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={styles.item}
            disabled={!jumpStep}
            onClick={() => {
              stop();
              reset(presetFor(jumpScenario));
              jumpTo(jumpScenario, jumpStep);
              navigate(`/besoin/${jumpScenario}`);
              close();
            }}
          >
            Aller à cette étape
          </button>

          <hr />

          <p className={styles.group}>Lancer un scénario</p>
          {SCENARIO_INDEX.map((s) => (
            <button
              key={s.id}
              type="button"
              className={styles.item}
              onClick={() => {
                stop();
                reset(presetFor(s.id));
                start(s.id);
                navigate(`/besoin/${s.id}`);
                close();
              }}
            >
              {s.entry} <span>{s.id}</span>
            </button>
          ))}

          <hr />

          <button
            type="button"
            className={styles.item}
            onClick={() => {
              stop();
              reset("first-visit");
              navigate("/");
              close();
            }}
          >
            Réinitialiser : premier lancement
          </button>
          <button
            type="button"
            className={styles.item}
            onClick={() => {
              stop();
              reset("returning");
              navigate("/");
              close();
            }}
          >
            Réinitialiser : trois semaines plus tard
          </button>

          <label className={styles.toggle}>
            <input type="checkbox" checked={animations} onChange={(e) => setAnimations(e.target.checked)} />
            Animations
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={mailInterrupted}
              onChange={(e) => setMailInterrupted(e.target.checked)}
            />
            Connexion interrompue (simulée)
          </label>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
