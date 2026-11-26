import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ListFilter, Plus } from "lucide-react";
import { Button, DocumentCard, Elephant, Sheet, blockItem, blockList, useToast } from "@elea/ds";
import type { DocKind, DocOrigin, EleaDocument } from "../engine/types";
import { usePlayer } from "../engine/player";
import { useMemory } from "../memory/store";
import { useMediaQuery } from "../composer/useMediaQuery";
import { DocumentAttach } from "./DocumentAttach";
import { FilterBar, FilterChip, FilterSection } from "./FilterBar";
import {
  DOC_KIND_FILTER,
  DOC_KIND_LABEL,
  DOC_KIND_ORDER,
  DOC_ORIGIN_LABEL,
  DOC_ORIGIN_ORDER,
  DOC_PERIOD_LABEL,
  documentFindingCount,
  documentInPeriod,
  sortDocumentsRecent,
  type DocPeriod,
} from "./documentLabels";
import styles from "./Documents.module.css";

type Filters = {
  kind: DocKind | "all";
  origin: DocOrigin | "all";
  /** Id d'un sujet, « none » (sans sujet) ou « all ». */
  subject: string;
  period: DocPeriod;
};

const NO_FILTER: Filters = { kind: "all", origin: "all", subject: "all", period: "all" };
const PERIODS: DocPeriod[] = ["all", "month", "previous", "older"];

function applyFilters(docs: EleaDocument[], f: Filters, today: string, skip?: keyof Filters) {
  return docs.filter(
    (d) =>
      (skip === "kind" || f.kind === "all" || d.kind === f.kind) &&
      (skip === "origin" || f.origin === "all" || d.origin === f.origin) &&
      (skip === "subject" || f.subject === "all" || (f.subject === "none" ? !d.subjectId : d.subjectId === f.subject)) &&
      (skip === "period" || documentInPeriod(d, f.period, today)),
  );
}

/** Documents de l'entreprise : liste, filtres, ajout, rattachement à un sujet traité. */
export function Documents() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const documents = useMemory((s) => s.documents);
  const subjects = useMemory((s) => s.subjects);
  const findings = useMemory((s) => s.findings);
  const today = useMemory((s) => s.today);
  const patchDocument = useMemory((s) => s.patchDocument);
  const stop = usePlayer((s) => s.stop);
  const focusId = params.get("doc");

  const desktop = useMediaQuery("(min-width: 1024px)");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [attachDocId, setAttachDocId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTER);
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((f) => ({ ...f, [key]: value }));

  const visible = useMemo(
    () => sortDocumentsRecent(applyFilters(documents, filters, today)),
    [documents, filters, today],
  );

  const kindCounts = useMemo(() => {
    const base = applyFilters(documents, filters, today, "kind");
    return new Map(DOC_KIND_ORDER.map((k) => [k, base.filter((d) => d.kind === k).length]));
  }, [documents, filters, today]);
  const originCounts = useMemo(() => {
    const base = applyFilters(documents, filters, today, "origin");
    return new Map(DOC_ORIGIN_ORDER.map((o) => [o, base.filter((d) => d.origin === o).length]));
  }, [documents, filters, today]);
  const subjectCounts = useMemo(() => {
    const base = applyFilters(documents, filters, today, "subject");
    const map = new Map<string, number>([["none", base.filter((d) => !d.subjectId).length]]);
    for (const s of subjects) map.set(s.id, base.filter((d) => d.subjectId === s.id).length);
    return map;
  }, [documents, subjects, filters, today]);
  const periodCounts = useMemo(() => {
    const base = applyFilters(documents, filters, today, "period");
    return new Map(PERIODS.map((p) => [p, base.filter((d) => documentInPeriod(d, p, today)).length]));
  }, [documents, filters, today]);

  const presentKinds = DOC_KIND_ORDER.filter((k) => documents.some((d) => d.kind === k));
  const presentOrigins = DOC_ORIGIN_ORDER.filter((o) => documents.some((d) => d.origin === o));
  const subjectsWithDocs = subjects.filter((s) => documents.some((d) => d.subjectId === s.id));

  // Un filtre actif qui n'a plus de résultat (après un rattachement) se relâche.
  useEffect(() => {
    setFilters((f) => {
      const next = { ...f };
      if (f.kind !== "all" && (kindCounts.get(f.kind) ?? 0) === 0) next.kind = "all";
      if (f.origin !== "all" && (originCounts.get(f.origin) ?? 0) === 0) next.origin = "all";
      if (f.subject !== "all" && (subjectCounts.get(f.subject) ?? 0) === 0) next.subject = "all";
      if (f.period !== "all" && (periodCounts.get(f.period) ?? 0) === 0) next.period = "all";
      return JSON.stringify(next) === JSON.stringify(f) ? f : next;
    });
  }, [kindCounts, originCounts, subjectCounts, periodCounts]);

  // Arrivée depuis la recherche : on amène le document dans la vue.
  useEffect(() => {
    if (!focusId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`doc-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    return () => window.clearTimeout(t);
  }, [focusId]);

  function addDocument() {
    stop();
    navigate("/besoin/add-document");
  }

  function attach(doc: EleaDocument, subjectId: string | undefined) {
    patchDocument(doc.id, { subjectId });
    const subject = subjects.find((s) => s.id === subjectId);
    toast.show(subject ? `Rattaché à «\u00a0${subject.title}\u00a0».` : "Document détaché de son sujet.");
    setAttachDocId(null);
  }

  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_FILTER);
  const attachDoc = documents.find((d) => d.id === attachDocId);

  // Filtres actifs (mobile) : libellé et retrait de chacun.
  const activeFilters: { key: keyof Filters; label: string }[] = [];
  if (filters.kind !== "all") activeFilters.push({ key: "kind", label: DOC_KIND_FILTER[filters.kind] });
  if (filters.origin !== "all") activeFilters.push({ key: "origin", label: DOC_ORIGIN_LABEL[filters.origin] });
  if (filters.subject !== "all") {
    activeFilters.push({
      key: "subject",
      label: filters.subject === "none" ? "Sans sujet" : (subjects.find((s) => s.id === filters.subject)?.title ?? "Sujet"),
    });
  }
  if (filters.period !== "all") activeFilters.push({ key: "period", label: DOC_PERIOD_LABEL[filters.period] });

  const renderFilterBars = (titled: boolean) => (
    <>
      <FilterBar aria-label="Filtrer par type" title={titled ? "Type" : undefined}>
        <FilterChip
          active={filters.kind === "all"}
          onClick={() => set("kind", "all")}
          label="Tous les types"
          count={applyFilters(documents, filters, today, "kind").length}
        />
        {presentKinds.map((k) => (
          <FilterChip
            key={k}
            active={filters.kind === k}
            onClick={() => set("kind", k)}
            label={DOC_KIND_FILTER[k]}
            count={kindCounts.get(k) ?? 0}
            muted={(kindCounts.get(k) ?? 0) === 0}
          />
        ))}
      </FilterBar>
      <FilterBar aria-label="Filtrer par source" title={titled ? "Source" : undefined}>
        <FilterChip
          active={filters.origin === "all"}
          onClick={() => set("origin", "all")}
          label="Toutes les sources"
          count={applyFilters(documents, filters, today, "origin").length}
        />
        {presentOrigins.map((o) => (
          <FilterChip
            key={o}
            active={filters.origin === o}
            onClick={() => set("origin", o)}
            label={DOC_ORIGIN_LABEL[o]}
            count={originCounts.get(o) ?? 0}
            muted={(originCounts.get(o) ?? 0) === 0}
          />
        ))}
      </FilterBar>
      <FilterBar aria-label="Filtrer par sujet traité" title={titled ? "Sujet traité" : undefined}>
        <FilterChip
          active={filters.subject === "all"}
          onClick={() => set("subject", "all")}
          label="Tous les sujets"
          count={applyFilters(documents, filters, today, "subject").length}
        />
        {subjectsWithDocs.map((s) => (
          <FilterChip
            key={s.id}
            active={filters.subject === s.id}
            onClick={() => set("subject", s.id)}
            label={s.title}
            count={subjectCounts.get(s.id) ?? 0}
            muted={(subjectCounts.get(s.id) ?? 0) === 0}
          />
        ))}
        <FilterChip
          active={filters.subject === "none"}
          onClick={() => set("subject", "none")}
          label="Sans sujet"
          count={subjectCounts.get("none") ?? 0}
          muted={(subjectCounts.get("none") ?? 0) === 0}
        />
      </FilterBar>
      <FilterBar aria-label="Filtrer par période" title={titled ? "Période" : undefined}>
        {PERIODS.map((p) => (
          <FilterChip
            key={p}
            active={filters.period === p}
            onClick={() => set("period", p)}
            label={DOC_PERIOD_LABEL[p]}
            count={periodCounts.get(p) ?? 0}
            muted={p !== "all" && (periodCounts.get(p) ?? 0) === 0}
          />
        ))}
      </FilterBar>
    </>
  );

  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem}>
        <Link to="/entreprise" className={styles.back}>
          <ArrowLeft size={18} strokeWidth={1.75} /> Mon entreprise
        </Link>
      </motion.div>

      <motion.header variants={blockItem} className={styles.header}>
        <div className={styles.headerBody}>
          <p className="eyebrow">Mon entreprise</p>
          <h1 className={["voice", styles.title].join(" ")}>Documents</h1>
          <p className={styles.lede}>Ce que vous m'avez confié, et ce que j'en ai retenu.</p>
        </div>
        <Button icon={<Plus size={18} strokeWidth={1.75} />} onClick={addDocument}>
          Ajouter un document
        </Button>
      </motion.header>

      {documents.length === 0 ? (
        <motion.div variants={blockItem} className={styles.emptyState}>
          <Elephant size={56} state="idle" decorative />
          <p className={["voice", styles.emptyVoice].join(" ")}>
            Aucun document pour l'instant. Déposez une facture, un devis ou un contrat : je le lis et je range ce qu'il contient.
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={blockItem}>
            {desktop ? (
              <FilterSection>{renderFilterBars(false)}</FilterSection>
            ) : (
              <div className={styles.mobileFilters}>
                <Button
                  variant="secondary"
                  icon={<ListFilter size={18} strokeWidth={1.75} />}
                  onClick={() => setFiltersOpen(true)}
                  aria-haspopup="dialog"
                >
                  {activeFilters.length > 0 ? `Filtres (${activeFilters.length})` : "Filtres"}
                </Button>
                {activeFilters.length > 0 && (
                  <div className={styles.activeFilters} role="group" aria-label="Filtres actifs">
                    {activeFilters.map((f) => (
                      <FilterChip key={f.key} active removable label={f.label} onClick={() => set(f.key, "all")} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {visible.length === 0 ? (
            <motion.div variants={blockItem} className={styles.emptyState}>
              <p className={["voice", styles.emptyVoice].join(" ")}>Aucun document ne correspond à ces filtres.</p>
              {filtered && (
                <Button variant="secondary" onClick={() => setFilters(NO_FILTER)}>
                  Réinitialiser les filtres
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.ul variants={blockItem} className={styles.list}>
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map((doc) => (
                  <motion.li
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <DocumentCard
                      id={`doc-${doc.id}`}
                      title={doc.title}
                      kindLabel={DOC_KIND_LABEL[doc.kind]}
                      addedAt={doc.addedAt}
                      origin={doc.origin}
                      summary={doc.summary}
                      subjectNode={
                        doc.subjectId && subjects.some((s) => s.id === doc.subjectId) ? (
                          <Link to={`/sujet/${doc.subjectId}`}>{subjects.find((s) => s.id === doc.subjectId)?.title}</Link>
                        ) : undefined
                      }
                      findingCount={documentFindingCount(doc, findings)}
                      highlighted={focusId === doc.id}
                      actions={
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setAttachDocId(doc.id)}>
                            {doc.subjectId ? "Changer de sujet" : "Rattacher à un sujet"}
                          </Button>
                          {doc.subjectId && (
                            <Button size="sm" variant="ghost" onClick={() => attach(doc, undefined)}>
                              Détacher
                            </Button>
                          )}
                        </>
                      }
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </>
      )}

      <Sheet open={filtersOpen && !desktop} onClose={() => setFiltersOpen(false)} title="Filtres">
        <div className={styles.filterSheet}>
          <FilterSection className={styles.filterSheetGroups}>{renderFilterBars(true)}</FilterSection>
          <div className={styles.filterSheetActions}>
            <Button full onClick={() => setFiltersOpen(false)}>
              {visible.length === 0
                ? "Aucun document"
                : visible.length === 1
                  ? "Voir 1 document"
                  : `Voir ${visible.length} documents`}
            </Button>
            {filtered && (
              <Button full variant="ghost" onClick={() => setFilters(NO_FILTER)}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </div>
      </Sheet>

      <Sheet
        open={!!attachDoc}
        onClose={() => setAttachDocId(null)}
        title={attachDoc?.subjectId ? "Changer de sujet" : "Rattacher à un sujet"}
      >
        {attachDoc && <DocumentAttach document={attachDoc} subjects={subjects} onChange={(id) => attach(attachDoc, id)} />}
      </Sheet>
    </motion.main>
  );
}
