import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { ChevronRight } from "lucide-react";
import { DimensionCard, ProviderLogo, blockItem, blockList, formatDate, type ProviderId } from "@elea/ds";
import { Icon } from "../blocks/icons";
import { useMemory } from "../memory/store";
import { latestFindingDate } from "./findings";
import styles from "./Company.module.css";

const PROVIDER_MAP: Record<string, ProviderId> = {
  gmail: "gmail",
  outlook: "outlook",
  drive: "drive",
};

function AnimatedCount({ value }: { value: number }) {
  const springValue = useSpring(0, { stiffness: 320, damping: 28 });
  const display = useTransform(springValue, (v) => Math.round(v));
  useEffect(() => {
    springValue.set(value);
  }, [springValue, value]);
  return <motion.span>{display}</motion.span>;
}

/** Écran Mon entreprise : dimensions, sujets, résumé des sources. */
export function Company() {
  const navigate = useNavigate();
  const company = useMemory((s) => s.company);
  const dimensions = useMemory((s) => s.dimensions);
  const topics = useMemory((s) => s.topics);
  const findings = useMemory((s) => s.findings);
  const sources = useMemory((s) => s.sources);
  const connected = sources.filter((s) => s.status === "connected");

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.header variants={blockItem} className={styles.header}>
        <p className="eyebrow">Mon entreprise</p>
        <h1 className={["voice", styles.title].join(" ")}>{company.name}</h1>
        <p className={styles.meta}>
          {company.sector}
          <span aria-hidden>·</span>
          {company.city}
          <span aria-hidden>·</span>
          {company.employees} salariés
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

      <motion.section variants={blockItem} aria-labelledby="topics-title">
        <h2 id="topics-title" className={styles.sectionTitle}>
          Sujets
        </h2>
        <ul className={styles.topicList}>
          <AnimatePresence initial={false}>
            {topics.map((t) => {
              const list = findings.filter((f) => f.topicId === t.id);
              const latest = latestFindingDate(list);
              return (
                <motion.li key={t.id} layout transition={{ type: "spring", stiffness: 420, damping: 32 }}>
                  <button type="button" className={styles.topicRow} onClick={() => navigate(`/entreprise/${t.id}`)}>
                    <span className={styles.topicIcon} aria-hidden>
                      <Icon name={t.icon} />
                    </span>
                    <span className={styles.topicBody}>
                      <span className={styles.topicLabel}>{t.label}</span>
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
      </motion.section>

      <motion.section variants={blockItem} id="sources" aria-labelledby="sources-title">
        <h2 id="sources-title" className={styles.sectionTitle}>
          Sources connectées
        </h2>
        <ul className={styles.sourceList}>
          {connected.length === 0 ? (
            <li className={styles.sourceEmpty}>Aucune source connectée pour l'instant.</li>
          ) : (
            connected.map((s) => (
              <li key={s.id} className={styles.sourceRow}>
                {PROVIDER_MAP[s.provider] ? (
                  <ProviderLogo provider={PROVIDER_MAP[s.provider]} size={28} />
                ) : (
                  <span className={styles.sourceFallback} aria-hidden />
                )}
                <span className={styles.sourceBody}>
                  <strong>{s.label}</strong>
                  <span>
                    {s.detail ?? "Connectée"}
                    {s.lastSync ? ` · sync. ${formatDate(s.lastSync, "short")}` : ""}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      </motion.section>
    </motion.main>
  );
}
