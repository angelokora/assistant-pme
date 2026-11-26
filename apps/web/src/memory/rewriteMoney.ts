import { replaceMoneyAmount } from "@elea/ds";
import type { Block } from "../engine/types";

/** Remplace `from` → `to` dans les chaînes d'un bloc (titres, textes, listes). */
export function rewriteBlockMoney(block: Block, from: number, to: number): Block {
  const rewrite = (value: string) => replaceMoneyAmount(value, from, to);
  switch (block.type) {
    case "lead":
    case "noted":
      return { ...block, text: rewrite(block.text) };
    case "callout":
      return {
        ...block,
        ...(block.title ? { title: rewrite(block.title) } : {}),
        text: rewrite(block.text),
      };
    case "answer":
      return {
        ...block,
        title: rewrite(block.title),
        summary: rewrite(block.summary),
        ...(block.sections
          ? {
              sections: block.sections.map((s) => ({
                ...s,
                heading: rewrite(s.heading),
                text: rewrite(s.text),
              })),
            }
          : {}),
        ...(block.keyPoints ? { keyPoints: block.keyPoints.map(rewrite) } : {}),
        ...(block.recommendation ? { recommendation: rewrite(block.recommendation) } : {}),
      };
    case "extraction":
      return {
        ...block,
        title: rewrite(block.title),
        items: block.items.map((item) => ({ ...item, value: rewrite(item.value) })),
        ...(block.total ? { total: { ...block.total, value: rewrite(block.total.value) } } : {}),
      };
    default:
      return block;
  }
}

export function rewriteFindingBodyMoney(body: Block[], from: number, to: number): Block[] {
  return body.map((b) => rewriteBlockMoney(b, from, to));
}
