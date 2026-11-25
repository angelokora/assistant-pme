/**
 * Aiguillage du composer hors besoin (le prototype n'a pas de modèle).
 * docs/ARCHITECTURE.md, section 3.
 */
const RULES: { scenario: string; words: RegExp }[] = [
  { scenario: "ask-contract", words: /\b(cdd|cdi|embauch|contrat|vendeuse|recrut)/i },
  { scenario: "inform-payment", words: /\b(pay[ée]|r[ée]gl[ée]|vers[ée]|encaiss)/i },
  { scenario: "find-buches", words: /(qu'avait|on avait dit|retrouv|b[ûu]che|rappelle)/i },
];

export function routeUtterance(text: string): string | null {
  return RULES.find((r) => r.words.test(text))?.scenario ?? null;
}
