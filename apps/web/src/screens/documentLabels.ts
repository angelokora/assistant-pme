import type { DocKind, DocOrigin, EleaDocument, Finding } from "../engine/types";
import { foldText } from "../engine/router";

/** Libellé au singulier (carte). */
export const DOC_KIND_LABEL: Record<DocKind, string> = {
  facture: "Facture",
  devis: "Devis",
  contrat: "Contrat",
  releve: "Relevé",
  heures: "Heures",
  autre: "Autre",
};

/** Libellé au pluriel (puces de filtre). */
export const DOC_KIND_FILTER: Record<DocKind, string> = {
  facture: "Factures",
  devis: "Devis",
  contrat: "Contrats",
  releve: "Relevés",
  heures: "Heures",
  autre: "Autres",
};

export const DOC_KIND_ORDER: DocKind[] = ["facture", "devis", "contrat", "releve", "heures", "autre"];

export const DOC_ORIGIN_LABEL: Record<DocOrigin, string> = {
  import: "Import",
  gmail: "Gmail",
  drive: "Drive",
  outlook: "Outlook",
};

export const DOC_ORIGIN_ORDER: DocOrigin[] = ["import", "gmail", "drive", "outlook"];

export type DocPeriod = "all" | "month" | "previous" | "older";

export const DOC_PERIOD_LABEL: Record<DocPeriod, string> = {
  all: "Toute la période",
  month: "Ce mois-ci",
  previous: "Le mois dernier",
  older: "Plus ancien",
};

export function sortDocumentsRecent(docs: EleaDocument[]) {
  return [...docs].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/** Constats tirés du document qui existent encore dans la mémoire. */
export function documentFindingCount(doc: EleaDocument, findings: Finding[]) {
  const ids = new Set(findings.map((f) => f.id));
  return doc.findingIds.filter((id) => ids.has(id)).length;
}

function previousMonth(today: string) {
  const [y, m] = today.slice(0, 7).split("-").map(Number);
  const d = new Date(y!, (m ?? 1) - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function documentInPeriod(doc: EleaDocument, period: DocPeriod, today: string) {
  if (period === "all") return true;
  const month = doc.addedAt.slice(0, 7);
  const current = today.slice(0, 7);
  if (period === "month") return month === current;
  if (period === "previous") return month === previousMonth(today);
  return month < previousMonth(today);
}

/** Le document correspond à la saisie : nom, résumé ou type. */
export function documentMatchesQuery(doc: EleaDocument, query: string): boolean {
  const q = foldText(query).trim();
  if (!q) return true;
  const hay = foldText(`${doc.title} ${doc.summary ?? ""} ${DOC_KIND_LABEL[doc.kind]}`);
  return hay.includes(q);
}
