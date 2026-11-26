import type { Finding } from "../engine/types";
import type { FindingType } from "@elea/ds";

/** Libellés de filtre (pluriel) pour les types présents dans un sujet. */
export const FINDING_TYPE_FILTER: Record<FindingType, string> = {
  answer: "Réponses",
  fact: "Faits",
  decision: "Décisions",
  plan: "Plans",
  document: "Documents",
  action: "Actions",
};

export function sortFindingsRecent(findings: Finding[]) {
  return [...findings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function typesPresent(findings: Finding[]): FindingType[] {
  const order: FindingType[] = ["answer", "fact", "decision", "document", "plan", "action"];
  const seen = new Set(findings.map((f) => f.type));
  return order.filter((t) => seen.has(t));
}

export function latestFindingDate(findings: Finding[]) {
  if (!findings.length) return null;
  return sortFindingsRecent(findings)[0]?.createdAt ?? null;
}
