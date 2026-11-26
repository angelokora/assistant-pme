import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Button, FindingCard, Elephant, blockItem, blockList, type FindingType } from "@elea/ds";
import { Icon } from "../blocks/icons";
import { useSimulatedSpeech } from "../composer/useSimulatedSpeech";
import { foldText } from "../engine/router";
import { useDemo, type FindVariant } from "../demo/demo";
import { useMemory } from "../memory/store";
import { useDetail } from "../shell/detailStore";
import { FilterBar, FilterChip, FilterSection } from "./FilterBar";
import { FINDING_TYPE_FILTER, sortFindingsRecent, typesPresent } from "./findings";
import { HighlightText } from "./HighlightText";
import { findingMatchesQuery } from "./searchText";
import styles from "./Search.module.css";

const VOICE_SAMPLE = "Qu'est-ce qu'on avait dit sur le prix des bûches ?";

/** Libellés filtre recherche (ticket : information = faits). */
const SEARCH_TYPE_FILTER: Partial<Record<FindingType, string>> = {
  ...FINDING_TYPE_FILTER,
  fact: "Informations",
};

/** Écran Recherche : variante A (liste) ou B (tuiles sujets), filtrage local instantané. */
export function Search() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const findFromDemo = useDemo((s) => s.findVariant);
  const variant: FindVariant =
    params.get("find") === "b" ? "b" : params.get("find") === "a" ? "a" : findFromDemo;

  const topics = useMemory((s) => s.topics);
  const findings = useMemory((s) => s.findings);
  const today = useMemory((s) => s.today);
  const openDetail = useDetail((s) => s.open);

  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | "all">("all");
  const [typeFilter, setTypeFilter] = useState<FindingType | "all">("all");
  const [listening, setListening] = useState(false);
  const speech = useSimulatedSpeech(VOICE_SAMPLE);

  /** Résultats selon la saisie seule (avant filtres sujet/type). */
  const queryMatches = useMemo(
    () => findings.filter((f) => findingMatchesQuery(f.title, f.summary, query)),
    [findings, query],
  );

  const matched = useMemo(() => {
    let list = queryMatches;
    if (topicFilter !== "all") list = list.filter((f) => f.topicId === topicFilter);
    if (typeFilter !== "all") list = list.filter((f) => f.type === typeFilter);
    return sortFindingsRecent(list);
  }, [queryMatches, topicFilter, typeFilter]);

  const presentTypes = useMemo(() => typesPresent(findings), [findings]);

  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of queryMatches) map.set(f.topicId, (map.get(f.topicId) ?? 0) + 1);
    return map;
  }, [queryMatches]);

  const typeCounts = useMemo(() => {
    const map = new Map<FindingType, number>();
    for (const f of queryMatches) map.set(f.type, (map.get(f.type) ?? 0) + 1);
    return map;
  }, [queryMatches]);

  useEffect(() => {
    if (topicFilter !== "all" && (topicCounts.get(topicFilter) ?? 0) === 0) setTopicFilter("all");
  }, [topicFilter, topicCounts]);

  useEffect(() => {
    if (typeFilter !== "all" && (typeCounts.get(typeFilter) ?? 0) === 0) setTypeFilter("all");
  }, [typeFilter, typeCounts]);

  const grouped = useMemo(() => {
    const byTopic = new Map<string, typeof matched>();
    for (const f of matched) {
      const bucket = byTopic.get(f.topicId) ?? [];
      bucket.push(f);
      byTopic.set(f.topicId, bucket);
    }
    return topics
      .map((t) => ({ topic: t, items: byTopic.get(t.id) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [matched, topics]);

  const tiles = useMemo(() => {
    const q = foldText(query).trim();
    return topics
      .map((t) => {
        const all = findings.filter((f) => f.topicId === t.id);
        const items = q
          ? sortFindingsRecent(all.filter((f) => findingMatchesQuery(f.title, f.summary, query)))
          : [];
        const show = !q || items.length > 0;
        return { topic: t, count: all.length, items, show };
      })
      .filter((t) => t.show);
  }, [topics, findings, query]);

  function openFinding(id: string) {
    openDetail("finding", id);
    navigate(`/finding/${id}`);
  }

  function startVoice() {
    setListening(true);
    speech.start();
  }

  function commitVoice() {
    speech.stop();
    setQuery(VOICE_SAMPLE);
    setListening(false);
  }

  function askOtherwise() {
    navigate("/", { state: { openComposer: true, draft: query } });
  }

  const empty =
    variant === "a"
      ? matched.length === 0 && (query.trim().length > 0 || typeFilter !== "all" || topicFilter !== "all")
      : query.trim().length > 0 && tiles.every((t) => t.items.length === 0);

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.header variants={blockItem} className={styles.header}>
        <p className="eyebrow">Mémoire</p>
        <h1 className={["voice", styles.title].join(" ")}>Recherche</h1>
        <p className={styles.lede}>Retrouvez un constat sans feuilleter des conversations.</p>
      </motion.header>

      <motion.div variants={blockItem} className={styles.searchBar}>
        <textarea
          className={styles.input}
          rows={1}
          value={query}
          placeholder="Un mot, un client, une décision…"
          aria-label="Rechercher dans la mémoire"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) e.preventDefault();
          }}
        />
        <button type="button" className={styles.voiceBtn} aria-label="Parler" onClick={startVoice}>
          <Elephant size={36} state={listening ? "listening" : "idle"} level={speech.level} decorative mic="badge" />
        </button>
      </motion.div>

      {listening && (
        <motion.div variants={blockItem} className={styles.listening}>
          <Elephant size={24} state="listening" level={speech.level} decorative />
          <span>Je vous écoute…</span>
          <Button size="sm" onClick={commitVoice}>
            Utiliser
          </Button>
        </motion.div>
      )}

      {variant === "a" && (
        <motion.div variants={blockItem}>
          <FilterSection>
            <FilterBar aria-label="Filtrer par sujet">
              <FilterChip
                active={topicFilter === "all"}
                onClick={() => setTopicFilter("all")}
                label="Tous les sujets"
                count={queryMatches.length}
                muted={queryMatches.length === 0}
              />
              {topics.map((t) => {
                const count = topicCounts.get(t.id) ?? 0;
                return (
                  <FilterChip
                    key={t.id}
                    active={topicFilter === t.id}
                    onClick={() => setTopicFilter(t.id)}
                    label={t.label}
                    count={count}
                    muted={count === 0}
                  />
                );
              })}
            </FilterBar>
            <FilterBar aria-label="Filtrer par type">
              <FilterChip
                active={typeFilter === "all"}
                onClick={() => setTypeFilter("all")}
                label="Tous"
                count={queryMatches.length}
                muted={queryMatches.length === 0}
              />
              {presentTypes.map((t) => {
                const count = typeCounts.get(t) ?? 0;
                return (
                  <FilterChip
                    key={t}
                    active={typeFilter === t}
                    onClick={() => setTypeFilter(t)}
                    label={SEARCH_TYPE_FILTER[t] ?? FINDING_TYPE_FILTER[t]}
                    count={count}
                    muted={count === 0}
                  />
                );
              })}
            </FilterBar>
          </FilterSection>
        </motion.div>
      )}

      {empty ? (
        <motion.div variants={blockItem} className={styles.empty}>
          <p className={styles.emptyText}>
            {query.trim()
              ? `Je ne trouve rien pour « ${query.trim()} ». Reformulez, ou demandez-moi autrement.`
              : "Aucun constat ne correspond à ces filtres."}
          </p>
          {query.trim() && (
            <Button onClick={askOtherwise}>Demander autrement</Button>
          )}
        </motion.div>
      ) : variant === "a" ? (
        <LayoutGroup>
          {grouped.map(({ topic, items }) => (
            <motion.section key={topic.id} variants={blockItem} className={styles.group} aria-labelledby={`topic-${topic.id}`}>
              <h2 id={`topic-${topic.id}`} className={styles.groupTitle}>
                {topic.label}
              </h2>
              <ul className={styles.list}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((f) => (
                    <motion.li
                      key={f.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <FindingCard
                        layoutId={`finding-shell-${f.id}`}
                        findingType={f.type}
                        title={f.title}
                        titleNode={query.trim() ? <HighlightText text={f.title} query={query} /> : undefined}
                        topicLabel={topic.label}
                        createdAt={f.createdAt}
                        today={today}
                        origin={f.origin}
                        confidence={f.confidence}
                        variant="compact"
                        onClick={() => openFinding(f.id)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          ))}
        </LayoutGroup>
      ) : (
        <motion.div variants={blockItem} className={styles.tiles}>
          {tiles.map(({ topic, count, items }) => (
            <article key={topic.id} className={styles.tile}>
              <div className={styles.tileHead}>
                <span className={styles.tileIcon}>
                  <Icon name={topic.icon} size={22} />
                </span>
                <div>
                  <h2 className={styles.tileTitle}>{topic.label}</h2>
                  <p className={styles.tileCount}>
                    {count} {count > 1 ? "constats" : "constat"}
                    {query.trim() && items.length
                      ? ` · ${items.length} trouvé${items.length > 1 ? "s" : ""}`
                      : ""}
                  </p>
                </div>
              </div>
              {items.length > 0 && (
                <ul className={styles.tileFindings}>
                  {items.map((f) => (
                    <li key={f.id}>
                      <FindingCard
                        layoutId={`finding-shell-${f.id}`}
                        findingType={f.type}
                        title={f.title}
                        titleNode={<HighlightText text={f.title} query={query} />}
                        topicLabel={topic.label}
                        createdAt={f.createdAt}
                        today={today}
                        origin={f.origin}
                        confidence={f.confidence}
                        variant="compact"
                        onClick={() => openFinding(f.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </motion.div>
      )}
    </motion.main>
  );
}
