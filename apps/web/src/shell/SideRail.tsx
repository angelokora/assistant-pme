import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { spring } from "@elea/ds";
import { DESTINATIONS, type DestinationId } from "./destinations";
import styles from "./SideRail.module.css";

type Props = {
  active: DestinationId | null;
};

/** Rail vertical tablette (640–1023 px). */
export function SideRail({ active }: Props) {
  return (
    <nav className={styles.rail} aria-label="Navigation principale">
      <p className={styles.brand}>Éléa</p>
      <ul className={styles.list}>
        {DESTINATIONS.map((d) => {
          const Icon = d.icon;
          const isActive = active === d.id;
          return (
            <li key={d.id}>
              <NavLink
                to={d.path}
                end={d.path === "/"}
                className={[styles.item, isActive && styles.itemActive].filter(Boolean).join(" ")}
              >
                {isActive && <motion.span layoutId="nav-active-rail" className={styles.pip} transition={spring.snappy} />}
                <Icon size={20} strokeWidth={1.75} aria-hidden />
                <span>{d.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
