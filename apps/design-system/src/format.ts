/** Espace fine insécable entre les milliers. */
export const NNBSP = "\u202f";
/** Espace insécable avant €. */
export const NBSP = "\u00a0";

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  useGrouping: true,
});

/** Groupe la partie entière à la française (espace fine dès 1 000). */
function groupIntDigits(intDigits: string): string {
  const bare = intDigits.replace(/[\s\u00a0\u202f]/g, "");
  if (!/^\d+$/.test(bare) || bare.length <= 3) return bare;
  // 2170 -> 2<NNBSP>170 ; 57400 -> 57<NNBSP>400
  return bare.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
}

/**
 * 58000 -> montant FR : NNBSP (\u202f) entre milliers, NBSP (\u00a0) avant euro.
 * Intl fr-FR le fait déjà ; hardenMoneySpaces garantit le groupement même si
 * la chaîne d'entrée était « 2170 € » sans séparateur.
 */
export function formatEuro(value: number): string {
  if (!Number.isFinite(value)) return hardenMoneySpaces(String(value));
  return hardenMoneySpaces(euro.format(Math.round(value)));
}

/**
 * Normalise les montants dans un texte :
 * - espace fine insécable entre milliers dès 1 000 (même sur « 2170 € ») ;
 * - espace insécable classique avant €.
 * Les décimales FR (« 15,10 € ») sont préservées.
 */
export function hardenMoneySpaces(text: string): string {
  return text.replace(/(\d[\d\s\u00a0\u202f]*(?:,\d+)?)([\s\u00a0\u202f]*€)/g, (_full, rawAmount: string) => {
    const cleaned = rawAmount.replace(/[\s\u00a0\u202f]/g, "");
    const comma = cleaned.indexOf(",");
    const intPart = comma === -1 ? cleaned : cleaned.slice(0, comma);
    const fracPart = comma === -1 ? null : cleaned.slice(comma + 1);
    if (!/^\d+$/.test(intPart) || (fracPart != null && !/^\d+$/.test(fracPart))) {
      return `${rawAmount}${NBSP}€`;
    }
    const grouped = groupIntDigits(intPart);
    const amount = fracPart != null ? `${grouped},${fracPart}` : grouped;
    return `${amount}${NBSP}€`;
  });
}

function parseDay(iso: string) {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Date ISO -> « 25 nov. », « jeu. 27 nov. » ou « 25 novembre 2026 ». */
export function formatDate(iso: string, style: "short" | "weekday" | "long" = "short"): string {
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (style === "long") {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  if (style === "weekday") {
    const raw = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    // « jeu. 27 nov. » (espace fine homogène)
    return raw.replace(/\u202f/g, " ").replace(/\.$/, "");
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/**
 * Date relative en français par rapport à `today` (ISO jour ou date-heure).
 * Ex. « aujourd'hui », « hier », « il y a 3 jours », sinon date courte.
 */
export function formatRelativeDate(iso: string, todayIso?: string): string {
  const day = parseDay(iso);
  const today = parseDay(todayIso ?? new Date().toISOString().slice(0, 10));
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return "hier";
  if (diff > 1 && diff < 7) return `il y a ${diff} jours`;
  if (diff === -1) return "demain";
  return formatDate(iso, "short");
}
