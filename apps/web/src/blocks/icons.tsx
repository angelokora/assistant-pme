import { Briefcase, Croissant, Handshake, Scale, Target, User, Users, Wallet, type LucideIcon } from "lucide-react";

/** Noms d'icônes utilisés dans les JSON (mémoire, scénarios) vers les icônes lucide. */
const MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  wallet: Wallet,
  user: User,
  target: Target,
  handshake: Handshake,
  users: Users,
  croissant: Croissant,
  scale: Scale,
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const C = MAP[name] ?? Target;
  return <C size={size} strokeWidth={1.75} />;
}
