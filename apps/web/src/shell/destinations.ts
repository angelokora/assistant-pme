import type { LucideIcon } from "lucide-react";
import { Building2, CalendarDays, ListChecks, Search } from "lucide-react";

export type DestinationId = "today" | "company" | "plans" | "search";

export type Destination = {
  id: DestinationId;
  label: string;
  /** Libellé court pour le menu radial (une ligne). */
  menuLabel: string;
  path: string;
  icon: LucideIcon;
  /** Ticket qui livrera l'écran (affiché sur les placeholders). */
  ticket?: { id: number; name: string };
};

export const DESTINATIONS: Destination[] = [
  { id: "today", label: "Aujourd'hui", menuLabel: "Aujourd'hui", path: "/", icon: CalendarDays },
  {
    id: "company",
    label: "Mon entreprise",
    menuLabel: "Entreprise",
    path: "/entreprise",
    icon: Building2,
    ticket: { id: 25, name: "Mon entreprise et sujets" },
  },
  { id: "plans", label: "Plans", menuLabel: "Plans", path: "/plans", icon: ListChecks, ticket: { id: 27, name: "Plans et sources" } },
  { id: "search", label: "Recherche", menuLabel: "Recherche", path: "/recherche", icon: Search, ticket: { id: 22, name: "Retrouver une information" } },
];

export function destinationForPath(pathname: string): DestinationId | null {
  if (pathname === "/" || pathname.startsWith("/besoin")) return "today";
  if (pathname.startsWith("/entreprise") || pathname.startsWith("/finding")) return "company";
  if (pathname.startsWith("/plans")) return "plans";
  if (pathname.startsWith("/recherche")) return "search";
  return null;
}
