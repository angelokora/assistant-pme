import { useEffect, useRef } from "react";
import { NotedTag } from "@elea/ds";
import type { NotedBlock } from "../engine/types";
import { useGauges } from "../memory/store";
import { findTarget, useFlights } from "./flight/flights";
import type { BlockProps } from "./BlockRenderer";

/** « Noté dans… » : à l'apparition, une pastille s'envole vers la carte de la dimension. */
export function NotedBlockView({ block }: BlockProps<NotedBlock>) {
  const ref = useRef<HTMLDivElement>(null);
  const launch = useFlights((s) => s.launch);

  useEffect(() => {
    if (block.target.kind !== "dimension") return;
    const dimensionId = block.target.id;
    const t = setTimeout(() => {
      const from = ref.current?.getBoundingClientRect();
      const target = findTarget(dimensionId);
      if (from && target) {
        launch({ id: block.id, dimensionId, from, to: target.getBoundingClientRect(), label: block.target.label });
      } else {
        useGauges.getState().land(dimensionId);
      }
    }, 750);
    return () => clearTimeout(t);
  }, [block, launch]);

  return (
    <div ref={ref}>
      <NotedTag
        sourceId={block.id}
        targetLabel={block.target.label}
        text={block.text}
        confidence={block.confidence}
        editable={block.editable}
        // La répercussion de la correction dans la mémoire est traitée par le ticket #23.
        onSave={() => undefined}
      />
    </div>
  );
}
