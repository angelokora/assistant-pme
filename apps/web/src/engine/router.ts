/**
 * Aiguillage du composer hors besoin (le prototype n'a pas de modèle).
 * Les règles vivent dans `routes.json` (données), pas en dur dans le code.
 * docs/ARCHITECTURE.md, section 3.
 */
import routesData from "./routes.json";

export type RouteExample = {
  id: string;
  label: string;
  utterance: string;
};

export type RoutesConfig = {
  unknown: { title: string; text: string; examples: RouteExample[] };
  routes: { scenarioId: string; keywords: string[] }[];
};

export const ROUTES: RoutesConfig = routesData;

/** Normalise pour comparer sans accents ni casse. */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Retourne l'id de scénario correspondant, ou null. */
export function routeUtterance(text: string): string | null {
  const folded = foldText(text);
  for (const rule of ROUTES.routes) {
    if (rule.keywords.some((kw) => folded.includes(foldText(kw)))) {
      return rule.scenarioId;
    }
  }
  return null;
}
