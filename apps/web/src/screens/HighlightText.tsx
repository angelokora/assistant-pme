import type { ReactNode } from "react";
import { matchRanges } from "./searchText";
import styles from "./Search.module.css";

/** Surligne les termes de la requête dans un texte (accents et casse ignorés). */
export function HighlightText({ text, query }: { text: string; query: string }) {
  const ranges = matchRanges(text, query);
  if (!ranges.length) return <>{text}</>;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <mark key={`${start}-${i}`} className={styles.mark}>
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}
