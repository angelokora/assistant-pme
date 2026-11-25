import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mic } from "lucide-react";
import { spring } from "@elea/ds";
import { DESTINATIONS, type DestinationId } from "./destinations";
import styles from "./BottomNav.module.css";

type Props = {
  active: DestinationId | null;
};

/** Barre basse mobile (variante A) : 4 destinations + composer au centre. */
export function BottomNav({ active }: Props) {
  const navigate = useNavigate();
  const left = DESTINATIONS.slice(0, 2);
  const right = DESTINATIONS.slice(2);

  return (
    <nav className={styles.bar} aria-label="Navigation principale">
      {left.map((d) => (
        <NavItem key={d.id} to={d.path} label={d.label} icon={d.icon} active={active === d.id} />
      ))}
      <button
        type="button"
        className={styles.composer}
        aria-label="Demander à Éléa"
        onClick={() => navigate("/", { state: { openComposer: true } })}
      >
        <Mic size={22} strokeWidth={1.75} />
      </button>
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
  return (
    <NavLink to={to} className={[styles.item, active && styles.itemActive].filter(Boolean).join(" ")} end={to === "/"}>
      <span className={styles.iconWrap}>
        {active && <motion.span layoutId="nav-active" className={styles.activePip} transition={spring.snappy} />}
        <Icon size={22} strokeWidth={1.75} aria-hidden />
      </span>
      <span className={styles.label}>{label}</span>
    </NavLink>
  );
}
