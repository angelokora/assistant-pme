/** Espace fine insécable (milliers et avant €), comme Intl fr-FR. */
export const NNBSP = "\u202f";

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/**
 * 58000 -> « 58 000 € » avec espaces fines insécables (NNBSP), à la française.
 * Utiliser partout pour les montants calculés ; dans les JSON, préférer aussi `\u202f`.
 */
export function formatEuro(value: number): string {
  return euro.format(value);
}

/** Remplace les espaces cassables d'un montant déjà écrit (« 2 170 € ») par des espaces fines insécables. */
export function hardenMoneySpaces(text: string): string {
  return text.replace(/(\d)\s+(?=\d)/g, `$1${NNBSP}`).replace(/(\d)\s+€/g, `$1${NNBSP}€`);
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
