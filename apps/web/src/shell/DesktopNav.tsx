import { NavLink, useLocation, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { spring } from "@elea/ds";
import { EleaLogo } from "../demo/EleaLogo";
import { useMemory } from "../memory/store";
import { DESTINATIONS, type DestinationId } from "./destinations";
import styles from "./DesktopNav.module.css";

type Props = {
  active: DestinationId | null;
};

/** Colonne gauche desktop : navigation + sujets traités. */
export function DesktopNav({ active }: Props) {
  const location = useLocation();
  const params = useParams();
  const subjects = useMemory((s) => s.subjects);
  const findings = useMemory((s) => s.findings);

  const subjectFromPath = location.pathname.match(/^\/entreprise\/([^/]+)/)?.[1];
  const findingFromPath = location.pathname.match(/^\/finding\/([^/]+)/)?.[1];
  const activeSubjectId =
    subjectFromPath ??
    (findingFromPath ? findings.find((f) => f.id === findingFromPath)?.subjectId : undefined) ??
    (typeof params.subjectId === "string" ? params.subjectId : undefined);

  return (
    <aside className={styles.aside} aria-label="Navigation et sujets traités">
      <EleaLogo className={styles.brand} />
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
        <p className={styles.topicsTitle}>Sujets traités</p>
        <ul className={styles.topicList}>
          {subjects.map((s) => {
            const count = findings.filter((f) => f.subjectId === s.id).length;
            const subjectActive = activeSubjectId === s.id;
            return (
              <li key={s.id}>
                <NavLink
                  to={`/sujet/${s.id}`}
                  data-subject-target={s.id}
                  className={[styles.topic, subjectActive && styles.topicActive].filter(Boolean).join(" ")}
                  aria-current={subjectActive ? "page" : undefined}
                >
                  <span>{s.title}</span>
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
