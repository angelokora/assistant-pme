import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, animate, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { DimensionCard, blockItem, blockList, formatDate } from "@elea/ds";
import { Icon } from "../blocks/icons";
import { useMemory } from "../memory/store";
import { useTheme, type ThemeId } from "../theme/theme";
import { CompanySources } from "./CompanySources";
import { latestFindingDate } from "./findings";
import styles from "./Company.module.css";

function AnimatedCount({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const ctrl = animate(shown, value, {
      type: "spring",
      stiffness: 320,
      damping: 28,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => ctrl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from the last painted value
  }, [value]);
  return <span>{shown}</span>;
}

/** Écran Mon entreprise : dimensions, sujets, résumé des sources. */
export function Company() {
  const navigate = useNavigate();
  const location = useLocation();
  const company = useMemory((s) => s.company);

  useEffect(() => {
    if (location.hash !== "#sources") return;
    document.getElementById("sources")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);
  const dimensions = useMemory((s) => s.dimensions);
  const subjects = useMemory((s) => s.subjects);
  const findings = useMemory((s) => s.findings);
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.header variants={blockItem} className={styles.header}>
        <p className="eyebrow">Mon entreprise</p>
        <h1 className={["voice", styles.title].join(" ")}>{company.name}</h1>
        <p className={styles.meta}>
          {company.sector}
          {company.city ? (
            <>
              <span aria-hidden>·</span>
              {company.city}
            </>
          ) : null}
          {company.employees != null ? (
            <>
              <span aria-hidden>·</span>
              {company.employees} salariés
            </>
          ) : null}
        </p>
      </motion.header>

      <motion.section variants={blockItem} aria-labelledby="dims-title">
        <h2 id="dims-title" className={styles.sectionTitle}>
          Dimensions
        </h2>
        <div className={styles.dims}>
          {dimensions.map((d) => (
            <DimensionCard
              key={d.id}
              id={d.id}
              label={d.label}
              icon={<Icon name={d.icon} />}
              tone={d.tone}
              summary={d.summary}
              progress={d.progress}
              status={d.status}
            />
          ))}
        </div>
      </motion.section>

      <motion.section variants={blockItem} aria-labelledby="subjects-title">
        <h2 id="subjects-title" className={styles.sectionTitle}>
          Sujets traités
        </h2>
        {subjects.length === 0 ? (
          <p className={["voice", styles.emptyVoice].join(" ")}>
            Aucun sujet traité pour l'instant. Dès qu'une problématique se dessine, je la range ici.
          </p>
        ) : (
          <ul className={styles.topicList}>
            <AnimatePresence initial={false}>
              {subjects.map((s) => {
                const list = findings.filter((f) => f.subjectId === s.id);
                const latest = latestFindingDate(list);
                return (
                  <motion.li key={s.id} layout transition={{ type: "spring", stiffness: 420, damping: 32 }}>
                    <button type="button" className={styles.topicRow} onClick={() => navigate(`/entreprise/${s.id}`)}>
                      <span className={styles.topicIcon} aria-hidden>
                        <Icon name={s.icon} />
                      </span>
                      <span className={styles.topicBody}>
                        <span className={styles.topicLabel}>{s.title}</span>
                        <span className={styles.topicMeta}>
                          {list.length === 0
                            ? "Aucun constat"
                            : latest
                              ? `Dernier ajout ${formatDate(latest, "short")}`
                              : null}
                        </span>
                      </span>
                      <span className={styles.topicCount} aria-label={`${list.length} constats`}>
                        <AnimatedCount value={list.length} />
                      </span>
                      <ChevronRight size={18} strokeWidth={1.75} aria-hidden className={styles.chevron} />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      <motion.div variants={blockItem}>
        <CompanySources />
      </motion.div>

      <motion.section variants={blockItem} className={styles.prefs} aria-labelledby="prefs-title">
        <h2 id="prefs-title" className={styles.sectionTitle}>
          Préférences
        </h2>
        <fieldset className={styles.themeField}>
          <div className={styles.themeLegend} id="appearance-label">
            Apparence
          </div>
          <div className={styles.themeOptions} role="radiogroup" aria-labelledby="appearance-label">
            {(
              [
                { id: "vivant", label: "Vivant" },
                { id: "classic", label: "Classique" },
              ] as { id: ThemeId; label: string }[]
            ).map((opt) => (
              <label key={opt.id} className={[styles.themeOption, theme === opt.id && styles.themeOptionActive].filter(Boolean).join(" ")}>
                <input
                  type="radio"
                  name="appearance"
                  value={opt.id}
                  checked={theme === opt.id}
                  onChange={() => setTheme(opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      </motion.section>
    </motion.main>
  );
}
