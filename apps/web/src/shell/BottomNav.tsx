import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mic } from "lucide-react";
import { Orb, spring } from "@elea/ds";
import { DESTINATIONS, type DestinationId } from "./destinations";
import styles from "./BottomNav.module.css";

type Props = {
  active: DestinationId | null;
  /** Accueil C : un seul point d'entrée voix (orbe du contenu). */
  hideComposer?: boolean;
};

/** Barre basse mobile (variante A) : 4 destinations + composer au centre. */
export function BottomNav({ active, hideComposer }: Props) {
  const navigate = useNavigate();
  const left = DESTINATIONS.slice(0, 2);
  const right = DESTINATIONS.slice(2);

  return (
    <nav
      className={[styles.bar, hideComposer && styles.barNoComposer].filter(Boolean).join(" ")}
      aria-label="Navigation principale"
    >
      {left.map((d) => (
        <NavItem key={d.id} to={d.path} label={d.label} icon={d.icon} active={active === d.id} />
      ))}
      {!hideComposer && (
        <button
          type="button"
          className={styles.composer}
          aria-label="Demander à Éléa"
          onClick={() => navigate("/", { state: { openComposer: true } })}
        >
          <Orb size={56} state="idle" decorative className={styles.composerOrb} />
          <Mic size={20} strokeWidth={1.75} className={styles.composerMic} aria-hidden />
        </button>
      )}
      {right.map((d) => (
        <NavItem key={d.id} to={d.path} label={d.label} icon={d.icon} active={active === d.id} />
      ))}
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: (typeof DESTINATIONS)[number]["icon"];
  active: boolean;
}) {
  const topicFallback = to === "/entreprise";
  return (
    <NavLink
      to={to}
      data-topic-fallback={topicFallback ? "" : undefined}
      className={[styles.item, active && styles.itemActive].filter(Boolean).join(" ")}
      end={to === "/"}
    >
      <span className={styles.iconWrap}>
        {active && <motion.span layoutId="nav-active" className={styles.activePip} transition={spring.snappy} />}
        <Icon size={22} strokeWidth={1.75} aria-hidden />
      </span>
      <span className={styles.label}>{label}</span>
    </NavLink>
  );
}
