import { useNavigate } from "react-router-dom";
import { AnswerCard } from "@elea/ds";
import type { AnswerBlock as AnswerBlockType } from "../engine/types";
import type { BlockProps } from "./BlockRenderer";

/** Fiche answer : rendu catalogue, navigable via savedTo. */
export function AnswerBlockView({ block }: BlockProps<AnswerBlockType>) {
  const navigate = useNavigate();
  return (
    <AnswerCard
      title={block.title}
      summary={block.summary}
      sections={block.sections}
      keyPoints={block.keyPoints}
      recommendation={block.recommendation}
      sources={block.sources}
      confidence={block.confidence}
      savedTo={
        block.savedTo
          ? {
              label: block.savedTo.label,
              onClick: () => {
                const dest = block.savedTo!.subjectId ?? block.savedTo!.dimensionId;
                navigate(dest ? `/sujet/${dest}` : "/entreprise");
              },
            }
          : undefined
      }
    />
  );
}
