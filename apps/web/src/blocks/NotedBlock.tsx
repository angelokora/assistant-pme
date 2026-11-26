import { useEffect, useRef } from "react";
import { NotedTag, parseMoneyPhrase, replaceMoneyAmount, useToast } from "@elea/ds";
import type { NotedBlock } from "../engine/types";
import { rewriteFindingBodyMoney } from "../memory/rewriteMoney";
import { useGauges, useMemory } from "../memory/store";
import { findTarget, useFlights } from "./flight/flights";
import type { BlockProps } from "./BlockRenderer";

/** « Noté dans… » : à l'apparition, une pastille s'envole vers la dimension ou le sujet. */
export function NotedBlockView({ block }: BlockProps<NotedBlock>) {
  const ref = useRef<HTMLDivElement>(null);
  const launch = useFlights((s) => s.launch);
  const patchFinding = useMemory((s) => s.patchFinding);
  const { show } = useToast();

  useEffect(() => {
    const targetKind = block.target.kind;
    const targetId = block.target.id;
    const t = setTimeout(() => {
      const from = ref.current?.getBoundingClientRect();
      const target = findTarget(targetKind, targetId);
      if (from && target) {
        launch({
          id: block.id,
          targetKind,
          targetId,
          from,
          to: target.getBoundingClientRect(),
          label: block.target.label,
        });
      } else if (targetKind === "dimension") {
        useGauges.getState().land(targetId);
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
        onSave={(text) => {
          if (block.findingId) {
            const current = useMemory.getState().findings.find((f) => f.id === block.findingId);
            const nextMoney = parseMoneyPhrase(text);
            const prevMoney = parseMoneyPhrase(block.text);
            if (current && nextMoney && prevMoney) {
              const from = prevMoney.amount;
              const to = nextMoney.amount;
              patchFinding(block.findingId, {
                title: text,
                summary: replaceMoneyAmount(current.summary, from, to),
                ...(current.body ? { body: rewriteFindingBodyMoney(current.body, from, to) } : {}),
                confidence: "confirmed",
              });
            } else {
              patchFinding(block.findingId, {
                title: text,
                summary: current?.summary ?? text,
                confidence: "confirmed",
              });
            }
          }
          show("C'est noté, j'ai mis à jour ce que j'avais retenu.");
        }}
      />
    </div>
  );
}
