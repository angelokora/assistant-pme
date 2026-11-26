import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ChevronRight, MessageCircleQuestion, Search } from "lucide-react";
import { Button, Elephant, Gauge, blockItem, blockList, formatDate } from "@elea/ds";
import type { SubjectStatus } from "../engine/types";
import { SCENARIOS } from "../engine/scenarios";
import { Icon } from "../blocks/icons";
import { useMemory } from "../memory/store";
import { useComposerContext } from "../shell/composerContext";
import { TopicFindings } from "./TopicFindings";
import { findingMatchesQuery } from "./searchText";
import styles from "./Topic.module.css";

const STATUS_LABEL: Record<SubjectStatus, string> = {
  active: "En cours",
  paused: "En pause",
  resolved: "Résolu",
};

const INTENT_LABEL: Record<string, string> = {
  onboarding: "Faire connaissance",
  ask: "Poser une question",
  inform: "Donner une information",
  find: "Retrouver",
};

/** Page d'un sujet traité : où on en est, plans, constats, échanges. */
export function Topic() {
  const { subjectId = "" } = useParams();
  const navigate = useNavigate();
  const setAbout = useComposerContext((s) => s.setAbout);
  const subjects = useMemory((s) => s.subjects);
  const findings = useMemory((s) => s.findings);
  const plans = useMemory((s) => s.plans);
  const patchSubject = useMemory((s) => s.patchSubject);
  const subject = subjects.find((t) => t.id === subjectId);

  const [query, setQuery] = useState("");

  const subjectFindings = useMemo(
    () => findings.filter((f) => f.subjectId === subjectId),
    [findings, subjectId],
  );

  const subjectPlans = useMemo(
    () => plans.filter((p) => p.subjectId === subjectId || subject?.planIds.includes(p.id)),
    [plans, subjectId, subject],
  );

  const exchanges = useMemo(() => {
    if (!subject) return [];
    return subject.scenarioIds.map((id) => {
      const scenario = SCENARIOS[id];
      return {
        id,
        title: scenario?.title ?? id,
        intent: scenario?.intent ?? "ask",
        date: subject.lastExchangeAt,
      };
    });
  }, [subject]);

  const filteredExchanges = useMemo(() => {
    const q = query.trim();
    if (!q) return exchanges;
    return exchanges.filter((e) => findingMatchesQuery(e.title, INTENT_LABEL[e.intent] ?? "", q));
  }, [exchanges, query]);

  if (!subject) {
    return (
      <main className={styles.page}>
        <Link to="/entreprise" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
        <p className={styles.empty}>Ce sujet traité n'existe pas dans la mémoire.</p>
      </main>
    );
  }

  function askAboutSubject() {
    setAbout(subject!.title);
    navigate("/", { state: { openComposer: true } });
  }

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem}>
        <Link to="/entreprise" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
      </motion.div>

      <motion.header variants={blockItem} className={styles.header}>
        <span className={styles.topicIcon} aria-hidden>
          <Icon name={subject.icon} />
        </span>
        <div className={styles.headerBody}>
          <p className="eyebrow">Sujet traité</p>
          <h1 className={["voice", styles.title].join(" ")}>{subject.title}</h1>
          <div className={styles.statusRow}>
            <label>
              <span className="sr-only">Statut</span>
              <select
                className={styles.statusSelect}
                value={subject.status}
                onChange={(e) => patchSubject(subject.id, { status: e.target.value as SubjectStatus })}
                aria-label="Statut du sujet"
              >
                {(Object.keys(STATUS_LABEL) as SubjectStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <span className={styles.dates}>
              Ouvert {formatDate(subject.openedAt, "short")}
              {" · "}
              Dernier échange {formatDate(subject.lastExchangeAt, "short")}
            </span>
          </div>
        </div>
      </motion.header>

      <motion.section variants={blockItem} className={styles.where} aria-labelledby="where-title">
        <h2 id="where-title" className={styles.sectionTitle}>
          Où on en est
        </h2>
        <p className={["voice", styles.whereText].join(" ")}>{subject.summary}</p>
      </motion.section>

      <motion.div variants={blockItem} className={styles.askDock}>
        <Button full onClick={askAboutSubject}>
          <MessageCircleQuestion size={18} strokeWidth={1.75} aria-hidden />
          Poser une question sur ce sujet
        </Button>
      </motion.div>

      <motion.div variants={blockItem} className={styles.searchWrap}>
        <Search size={18} strokeWidth={1.75} aria-hidden className={styles.searchIcon} />
        <input
          type="search"
          className={styles.search}
          placeholder="Chercher dans ce sujet…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Chercher dans ce sujet"
        />
      </motion.div>

      {subjectPlans.length > 0 && (
        <motion.section variants={blockItem} aria-labelledby="plans-title">
          <h2 id="plans-title" className={styles.sectionTitle}>
            Plans
          </h2>
          <ul className={styles.planList}>
            {subjectPlans.map((plan) => {
              const done = plan.steps.filter((s) => s.status === "done").length;
              const total = plan.steps.length || 1;
              const next =
                plan.steps.find((s) => s.status === "doing") ?? plan.steps.find((s) => s.status === "todo");
              return (
                <li key={plan.id}>
                  <button type="button" className={styles.planRow} onClick={() => navigate(`/plans/${plan.id}`)}>
                    <div className={styles.planTop}>
                      <strong>{plan.title}</strong>
                      <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
                    </div>
                    <Gauge
                      value={done / total}
                      segments={total}
                      status={done >= total ? "enough" : done > 0 ? "active" : "todo"}
                      label={`${done} sur ${total}`}
                      className={styles.planGauge}
                    />
                    {next && (
                      <p className={styles.planNext}>
                        Prochaine étape : {next.title}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      <motion.section variants={blockItem} aria-labelledby="findings-title">
        <h2 id="findings-title" className={styles.sectionTitle}>
          Constats
        </h2>
        {subjectFindings.length === 0 ? (
          <div className={styles.emptyState}>
            <Elephant size={56} state="idle" decorative />
            <p className={["voice", styles.emptyVoice].join(" ")}>
              Je n'ai encore rien rangé dans «{"\u00a0"}
              {subject.title}
              {"\u00a0"}».
            </p>
          </div>
        ) : (
          <TopicFindings
            subjectId={subject.id}
            subjectTitle={subject.title}
            query={query}
            showDimensionFilter
          />
        )}
      </motion.section>

      {filteredExchanges.length > 0 && (
        <motion.section variants={blockItem} aria-labelledby="exchanges-title">
          <h2 id="exchanges-title" className={styles.sectionTitle}>
            Échanges
          </h2>
          <ul className={styles.exchangeList}>
            {filteredExchanges.map((e) => (
              <li key={e.id}>
                <button type="button" className={styles.exchangeRow} onClick={() => navigate(`/besoin/${e.id}`)}>
                  <span className={styles.exchangeBody}>
                    <span className={styles.exchangeTitle}>{e.title}</span>
                    <span className={styles.exchangeMeta}>
                      {INTENT_LABEL[e.intent] ?? e.intent}
                      {" · "}
                      {formatDate(e.date, "short")}
                    </span>
                  </span>
                  <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      <motion.section variants={blockItem} aria-labelledby="docs-title">
        <h2 id="docs-title" className={styles.sectionTitle}>
          Documents
        </h2>
        <p className={["voice", styles.emptyVoice].join(" ")}>
          Aucun document rattaché pour l'instant. Ils arriveront avec l'import (#41).
        </p>
      </motion.section>
    </motion.main>
  );
}
