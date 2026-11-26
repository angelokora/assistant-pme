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

  const subjects = useMemory((s) => s.subjects);
  const findings = useMemory((s) => s.findings);
  const today = useMemory((s) => s.today);
  const openDetail = useDetail((s) => s.open);

  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | "all">("all");
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
    if (subjectFilter !== "all") list = list.filter((f) => f.subjectId === subjectFilter);
    if (typeFilter !== "all") list = list.filter((f) => f.type === typeFilter);
    return sortFindingsRecent(list);
  }, [queryMatches, subjectFilter, typeFilter]);

  const presentTypes = useMemo(() => typesPresent(findings), [findings]);

  const subjectCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of queryMatches) {
      if (!f.subjectId) continue;
      map.set(f.subjectId, (map.get(f.subjectId) ?? 0) + 1);
    }
    return map;
  }, [queryMatches]);

  const typeCounts = useMemo(() => {
    const map = new Map<FindingType, number>();
    for (const f of queryMatches) map.set(f.type, (map.get(f.type) ?? 0) + 1);
    return map;
  }, [queryMatches]);

  useEffect(() => {
    if (subjectFilter !== "all" && (subjectCounts.get(subjectFilter) ?? 0) === 0) setSubjectFilter("all");
  }, [subjectFilter, subjectCounts]);

  useEffect(() => {
    if (typeFilter !== "all" && (typeCounts.get(typeFilter) ?? 0) === 0) setTypeFilter("all");
  }, [typeFilter, typeCounts]);

  const grouped = useMemo(() => {
    const bySubject = new Map<string, typeof matched>();
    const orphans: typeof matched = [];
    for (const f of matched) {
      if (!f.subjectId) {
        orphans.push(f);
        continue;
      }
      const bucket = bySubject.get(f.subjectId) ?? [];
      bucket.push(f);
      bySubject.set(f.subjectId, bucket);
    }
    const groups = subjects
      .map((s) => ({
        id: s.id,
        title: s.title,
        icon: s.icon,
        items: bySubject.get(s.id) ?? [],
      }))
      .filter((g) => g.items.length > 0);
    if (orphans.length) {
      groups.push({ id: "_dimension", title: "Autres constats", icon: "briefcase", items: orphans });
    }
    return groups;
  }, [matched, subjects]);

  const tiles = useMemo(() => {
    const q = foldText(query).trim();
    return subjects
      .map((s) => {
        const all = findings.filter((f) => f.subjectId === s.id);
        const items = q
          ? sortFindingsRecent(all.filter((f) => findingMatchesQuery(f.title, f.summary, query)))
          : [];
        const show = !q || items.length > 0;
        return { subject: s, count: all.length, items, show };
      })
      .filter((t) => t.show);
  }, [subjects, findings, query]);

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
      ? matched.length === 0 && (query.trim().length > 0 || typeFilter !== "all" || subjectFilter !== "all")
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
            <FilterBar aria-label="Filtrer par sujet traité">
              <FilterChip
                active={subjectFilter === "all"}
                onClick={() => setSubjectFilter("all")}
                label="Tous les sujets"
                count={queryMatches.length}
                muted={queryMatches.length === 0}
              />
              {subjects.map((s) => {
                const count = subjectCounts.get(s.id) ?? 0;
                return (
                  <FilterChip
                    key={s.id}
                    active={subjectFilter === s.id}
                    onClick={() => setSubjectFilter(s.id)}
                    label={s.title}
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
              ? `Je ne trouve rien pour «\u00a0${query.trim()}\u00a0». Reformulez, ou demandez-moi autrement.`
              : "Aucun constat ne correspond à ces filtres."}
          </p>
          {query.trim() && (
            <Button onClick={askOtherwise}>Demander autrement</Button>
          )}
        </motion.div>
      ) : variant === "a" ? (
        <LayoutGroup>
          {grouped.map(({ id, title, items }) => (
            <motion.section key={id} variants={blockItem} className={styles.group} aria-labelledby={`subject-${id}`}>
              <h2 id={`subject-${id}`} className={styles.groupTitle}>
                {title}
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
                        topicLabel={title}
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
          {tiles.map(({ subject, count, items }) => (
            <article key={subject.id} className={styles.tile}>
              <div className={styles.tileHead}>
                <span className={styles.tileIcon}>
                  <Icon name={subject.icon} size={22} />
                </span>
                <div>
                  <h2 className={styles.tileTitle}>{subject.title}</h2>
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
                        topicLabel={subject.title}
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
