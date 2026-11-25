import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { spring } from "@elea/ds";
import { useMemory } from "../memory/store";
import { DESTINATIONS, type DestinationId } from "./destinations";
import styles from "./DesktopNav.module.css";

type Props = {
  active: DestinationId | null;
};

/** Colonne gauche desktop : navigation + sujets. */
export function DesktopNav({ active }: Props) {
  const topics = useMemory((s) => s.topics);
  const findings = useMemory((s) => s.findings);

  return (
    <aside className={styles.aside} aria-label="Navigation et sujets">
      <p className={styles.brand}>Éléa</p>
      <nav aria-label="Navigation principale">
        <ul className={styles.nav}>
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
                  {isActive && <motion.span layoutId="nav-active-desk" className={styles.pip} transition={spring.snappy} />}
                  <Icon size={18} strokeWidth={1.75} aria-hidden />
                  <span>{d.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.topics}>
        <p className={styles.topicsTitle}>Sujets</p>
        <ul className={styles.topicList}>
          {topics.map((t) => {
            const count = findings.filter((f) => f.topicId === t.id).length;
            return (
              <li key={t.id}>
                <NavLink to={`/entreprise/${t.id}`} className={styles.topic}>
                  <span>{t.label}</span>
                  <span className={styles.count}>{count}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
