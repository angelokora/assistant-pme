import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { spring } from "@elea/ds";
import { useDemo } from "./demo";
import { postDemoCommand } from "./bridge";
import { useMemory } from "../memory/store";
import { usePlayer } from "../engine/player";
import { useMediaQuery } from "../composer/useMediaQuery";
import { SCENARIO_INDEX, SCENARIOS, presetFor } from "../engine/scenarios";
import { useTheme, type ThemeId } from "../theme/theme";
import styles from "./DemoPanel.module.css";

type Props = {
  /** Hôte de l'émulateur : commande l'iframe via postMessage. */
  host?: boolean;
};

/** Panneau démo : variantes, reset, saut à une étape, appareil, Maj + D / appui long logo. */
export function DemoPanel({ host = false }: Props) {
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
    showVariantPill,
    setShowVariantPill,
    device,
    setDevice,
    orientation,
    setOrientation,
  } = useDemo();
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const reset = useMemory((s) => s.reset);
  const stop = usePlayer((s) => s.stop);
  const start = usePlayer((s) => s.start);
  const jumpTo = usePlayer((s) => s.jumpTo);
  const navigate = useNavigate();
  const desktop = useMediaQuery("(min-width: 1024px)");

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

  function runLocalOrHost(local: () => void, cmd: Parameters<typeof postDemoCommand>[0]) {
    if (host) postDemoCommand(cmd);
    else local();
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

          {desktop && (
            <>
              <p className={styles.group}>Appareil</p>
              {(
                [
                  ["desktop", "Ordinateur"],
                  ["phone", "Téléphone"],
                  ["tablet", "Tablette"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={[styles.item, device === id && styles.active].filter(Boolean).join(" ")}
                  onClick={() => setDevice(id)}
                >
                  {label}
                </button>
              ))}
              {device !== "desktop" && (
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => setOrientation(orientation === "portrait" ? "landscape" : "portrait")}
                >
                  Rotation : {orientation === "portrait" ? "portrait" : "paysage"}
                </button>
              )}
              <hr />
            </>
          )}

          <p className={styles.group}>Accueil</p>
          {(["a", "b", "c"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={[styles.item, homeVariant === v && styles.active].filter(Boolean).join(" ")}
              onClick={() => {
                setHomeVariant(v);
                runLocalOrHost(
                  () => {
                    stop();
                    reset("returning");
                    navigate(`/?v=${v}`);
                  },
                  { type: "setHomeVariant", value: v },
                );
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
              onClick={() => {
                setMenuVariant(v);
                if (host) postDemoCommand({ type: "setMenuVariant", value: v });
              }}
            >
              {v === "a" ? "A · Barre basse" : "B · Radial"}
            </button>
          ))}

          <p className={styles.group}>Recherche</p>
          {(["a", "b"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={[styles.item, findVariant === v && styles.active].filter(Boolean).join(" ")}
              onClick={() => {
                setFindVariant(v);
                if (host) postDemoCommand({ type: "setFindVariant", value: v });
              }}
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
              runLocalOrHost(
                () => {
                  stop();
                  reset(presetFor(jumpScenario));
                  jumpTo(jumpScenario, jumpStep);
                  navigate(`/besoin/${jumpScenario}`);
                },
                { type: "jumpTo", scenarioId: jumpScenario, stepId: jumpStep },
              );
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
                runLocalOrHost(
                  () => {
                    stop();
                    reset(presetFor(s.id));
                    start(s.id);
                    navigate(`/besoin/${s.id}`);
                  },
                  { type: "start", scenarioId: s.id },
                );
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
              runLocalOrHost(
                () => {
                  stop();
                  reset("first-visit");
                  navigate("/");
                },
                { type: "reset", preset: "first-visit" },
              );
              close();
            }}
          >
            Réinitialiser : premier lancement
          </button>
          <button
            type="button"
            className={styles.item}
            onClick={() => {
              runLocalOrHost(
                () => {
                  stop();
                  reset("returning");
                  navigate("/");
                },
                { type: "reset", preset: "returning" },
              );
              close();
            }}
          >
            Réinitialiser : trois semaines plus tard
          </button>

          <div className={styles.row} role="group" aria-label="Apparence">
            <span className={styles.rowLabel}>Apparence</span>
            <div className={styles.pills}>
              {(
                [
                  { id: "vivant", label: "Vivant" },
                  { id: "classic", label: "Classique" },
                ] as { id: ThemeId; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={theme === opt.id ? styles.pillActive : styles.pill}
                  aria-pressed={theme === opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    if (host) postDemoCommand({ type: "setTheme", value: opt.id });
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={animations}
              onChange={(e) => {
                const v = e.target.checked;
                setAnimations(v);
                if (host) postDemoCommand({ type: "setAnimations", value: v });
              }}
            />
            Animations
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={mailInterrupted}
              onChange={(e) => {
                const v = e.target.checked;
                setMailInterrupted(v);
                if (host) postDemoCommand({ type: "setMailInterrupted", value: v });
              }}
            />
            Connexion interrompue (simulée)
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showVariantPill}
              onChange={(e) => {
                const v = e.target.checked;
                setShowVariantPill(v);
                if (host) postDemoCommand({ type: "setShowVariantPill", value: v });
              }}
            />
            Pastille de variantes
          </label>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
