import { Callout } from "@elea/ds";
import type { CalloutBlock } from "../engine/types";
import type { BlockProps } from "./BlockRenderer";

export function CalloutBlockView({ block }: BlockProps<CalloutBlock>) {
  return (
    <Callout tone={block.tone} title={block.title}>
      {block.text}
    </Callout>
  );
}
