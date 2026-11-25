const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** 58000 -> « 58 000 € » (espaces insécables, à la française). */
export function formatEuro(value: number): string {
  return euro.format(value);
}

/** Date ISO -> « 25 nov. » ou « 25 novembre 2026 ». */
export function formatDate(iso: string, style: "short" | "long" = "short"): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", style === "short" ? { day: "numeric", month: "short" } : { day: "numeric", month: "long", year: "numeric" });
}
