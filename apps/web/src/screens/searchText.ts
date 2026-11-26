import { foldText } from "../engine/router";

/** Plages [start, end) dans le texte original qui correspondent à la requête (sans accents ni casse). */
export function matchRanges(text: string, query: string): [number, number][] {
  const q = foldText(query).trim();
  if (!q) return [];
  const map: number[] = [];
  let folded = "";
  for (let i = 0; i < text.length; i++) {
    const piece = foldText(text[i] ?? "");
    for (let j = 0; j < piece.length; j++) map.push(i);
    folded += piece;
  }
  const ranges: [number, number][] = [];
  let from = 0;
  while (from < folded.length) {
    const idx = folded.indexOf(q, from);
    if (idx < 0) break;
    const start = map[idx] ?? 0;
    const endIdx = map[idx + q.length - 1];
    const end = endIdx === undefined ? text.length : endIdx + 1;
    ranges.push([start, end]);
    from = idx + Math.max(q.length, 1);
  }
  return ranges;
}

/** Le finding matche la requête sur titre ou résumé. */
export function findingMatchesQuery(title: string, summary: string, query: string): boolean {
  const q = foldText(query).trim();
  if (!q) return true;
  return foldText(title).includes(q) || foldText(summary).includes(q);
}
