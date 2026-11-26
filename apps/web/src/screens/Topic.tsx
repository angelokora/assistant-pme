import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ChevronRight, MessageCircleQuestion, Search } from "lucide-react";
import { Button, DocumentCard, Elephant, Gauge, Sheet, blockItem, blockList, formatDate, useToast } from "@elea/ds";
import type { SubjectStatus } from "../engine/types";
import { SCENARIOS } from "../engine/scenarios";
import { Icon } from "../blocks/icons";
import { useMediaQuery } from "../composer/useMediaQuery";
import { useMemory } from "../memory/store";
import { useComposerContext } from "../shell/composerContext";
import { HomeComposer } from "./HomeComposer";
import { TopicFindings } from "./TopicFindings";
import { findingMatchesQuery } from "./searchText";
import { DOC_KIND_LABEL, documentFindingCount, documentMatchesQuery, sortDocumentsRecent } from "./documentLabels";
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
  const clearAbout = useComposerContext((s) => s.clear);
  const subjects = useMemory((s) => s.subjects);
  const findings = useMemory((s) => s.findings);
  const plans = useMemory((s) => s.plans);
  const patchSubject = useMemory((s) => s.patchSubject);
  const documents = useMemory((s) => s.documents);
  const patchDocument = useMemory((s) => s.patchDocument);
  const toast = useToast();
  const subject = subjects.find((t) => t.id === subjectId);
  const desktop = useMediaQuery("(min-width: 1024px)");

  const [query, setQuery] = useState("");
  const [askOpen, setAskOpen] = useState(false);

  const subjectFindings = useMemo(
    () => findings.filter((f) => f.subjectId === subjectId),
    [findings, subjectId],
  );

  const subjectPlans = useMemo(
    () => plans.filter((p) => p.subjectId === subjectId || subject?.planIds.includes(p.id)),
    [plans, subjectId, subject],
  );

  const subjectDocuments = useMemo(
    () =>
      sortDocumentsRecent(documents.filter((d) => d.subjectId === subjectId)).filter((d) =>
        documentMatchesQuery(d, query),
      ),
    [documents, subjectId, query],
  );
  const attachable = useMemo(() => sortDocumentsRecent(documents.filter((d) => !d.subjectId)), [documents]);

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

  function attachDocument(documentId: string) {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return;
    patchDocument(documentId, { subjectId: subject!.id });
    toast.show(`«\u00a0${doc.title}\u00a0» est rattaché à ce sujet.`);
  }

  function detachDocument(documentId: string) {
    const doc = documents.find((d) => d.id === documentId);
    patchDocument(documentId, { subjectId: undefined });
    if (doc) toast.show(`«\u00a0${doc.title}\u00a0» n'est plus rattaché à ce sujet.`);
  }

  function askAboutSubject() {
    setAbout(subject!.title);
    setAskOpen(true);
  }

  function closeAsk() {
    setAskOpen(false);
    clearAbout();
  }

  const askComposer = (
    <HomeComposer
      forceOpen
      onHandled={() => {
        /* reste sur la page ; le lancement navigue vers /besoin */
      }}
    />
  );

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
        {askOpen && desktop ? (
          <div className={styles.askInline}>
            <div className={styles.askInlineTop}>
              <p className={styles.askInlineTitle}>Question sur ce sujet</p>
              <button type="button" className={styles.askClose} onClick={closeAsk}>
                Fermer
              </button>
            </div>
            {askComposer}
          </div>
        ) : (
          <Button full onClick={askAboutSubject}>
            <MessageCircleQuestion size={18} strokeWidth={1.75} aria-hidden />
            Poser une question sur ce sujet
          </Button>
        )}
      </motion.div>

      {!desktop && (
        <Sheet open={askOpen} onClose={closeAsk} title="Poser une question">
          <div className={styles.askSheet}>{askComposer}</div>
        </Sheet>
      )}

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
        {subjectDocuments.length === 0 ? (
          <p className={["voice", styles.emptyVoice].join(" ")}>
            {query.trim() ? "Aucun document ne correspond." : "Aucun document rattaché pour l'instant."}
          </p>
        ) : (
          <ul className={styles.docList}>
            {subjectDocuments.map((d) => (
              <li key={d.id}>
                <DocumentCard
                  variant="compact"
                  title={d.title}
                  kindLabel={DOC_KIND_LABEL[d.kind]}
                  addedAt={d.addedAt}
                  origin={d.origin}
                  subjectLabel={subject.title}
                  findingCount={documentFindingCount(d, findings)}
                  onOpen={() => navigate(`/documents?doc=${d.id}`)}
                  actions={
                    <Button size="sm" variant="secondary" onClick={() => detachDocument(d.id)}>
                      Détacher
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
        {attachable.length > 0 && (
          <label className={styles.attachField}>
            <span>Rattacher un document</span>
            <select
              className={styles.statusSelect}
              value=""
              aria-label="Rattacher un document à ce sujet"
              onChange={(e) => e.target.value && attachDocument(e.target.value)}
            >
              <option value="">Choisir un document…</option>
              {attachable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </motion.section>
    </motion.main>
  );
}
