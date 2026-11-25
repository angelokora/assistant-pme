const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** 58000 -> « 58 000 € » (espaces insécables, à la française). */
export function formatEuro(value: number): string {
  return euro.format(value);
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
