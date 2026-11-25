import { useEffect, useState } from "react";
import { Orb, StepList, type StepItem, type StepStatus } from "@elea/ds";
import type { AnalysisBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

/** Éléa réfléchit : étapes qui s'enchaînent, orbe en « thinking ». */
export function AnalysisBlockView({ block, active }: BlockProps<AnalysisBlock>) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      // Tour passé : tout est fait.
      setIndex(block.steps.length);
      setDone(true);
      return;
    }

    setIndex(0);
    setDone(false);
    usePlayer.setState({ orb: "thinking" });

    let cancelled = false;
    let timer = 0;
    let i = 0;

    const run = () => {
      if (cancelled) return;
      if (i >= block.steps.length) {
        setDone(true);
        usePlayer.setState({ orb: "idle" });
        return;
      }
      setIndex(i);
      const duration = block.steps[i].durationMs;
      timer = window.setTimeout(() => {
        i += 1;
        setIndex(i);
        run();
      }, duration);
    };

    run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, block.steps]);

  const steps: StepItem[] = block.steps.map((step, i) => {
    let status: StepStatus = "pending";
    if (done || i < index) status = "done";
    else if (i === index) status = "active";
    return { id: step.id, label: step.label, status };
  });

  return (
    <section className={styles.analysis}>
      <div className={styles.analysisHead}>
        <Orb size={56} state={active && !done ? "thinking" : "idle"} decorative />
        <StepList title={block.title} steps={steps} />
      </div>
    </section>
  );
}
