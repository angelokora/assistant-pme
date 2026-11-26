import { useState } from "react";
import { motion } from "motion/react";
import {
  Button,
  ConfidenceBadge,
  MoneyPhraseEditor,
  ProviderLogo,
  Sheet,
  blockItem,
  blockList,
  formatAmountDraft,
  formatRelativeDate,
  parseMoneyPhrase,
  replaceMoneyAmount,
  type FindingOrigin,
  type FindingType,
  type ProviderId,
  useToast,
} from "@elea/ds";
import type { Finding } from "../engine/types";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { SCENARIOS } from "../engine/scenarios";
import { usePlayer } from "../engine/player";
import { rewriteFindingBodyMoney } from "../memory/rewriteMoney";
import { useMemory } from "../memory/store";
import { useComposerContext } from "../shell/composerContext";
import { useDetail } from "../shell/detailStore";
import { useNavigate } from "react-router-dom";
import styles from "./FindingDetail.module.css";

const TYPE_LABEL: Record<FindingType, string> = {
  answer: "Réponse",
  fact: "Fait",
  decision: "Décision",
  plan: "Plan",
  document: "Document",
  action: "Action",
};

const ORIGIN_LABEL: Record<FindingOrigin, string> = {
  conversation: "Conversation",
  document: "Document",
  gmail: "Gmail",
  outlook: "Outlook",
  drive: "Drive",
};

const PROVIDER_ORIGIN: Partial<Record<FindingOrigin, ProviderId>> = {
  gmail: "gmail",
  outlook: "outlook",
  drive: "drive",
};

type Props = {
  finding: Finding;
  /** Affiche le titre (desktop panneau a déjà un header). */
  showTitle?: boolean;
};

/** Contenu du détail d'un constat : méta, résumé, body en lecture, correction, suppression. */
export function FindingDetail({ finding, showTitle = true }: Props) {
  const navigate = useNavigate();
  const { show } = useToast();
  const close = useDetail((s) => s.close);
  const today = useMemory((s) => s.today);
  const topic = useMemory((s) => s.topics.find((t) => t.id === finding.topicId));
  const patchFinding = useMemory((s) => s.patchFinding);
  const removeFinding = useMemory((s) => s.removeFinding);
  const restoreFinding = useMemory((s) => s.restoreFinding);
  const reopen = usePlayer((s) => s.reopen);
  const stop = usePlayer((s) => s.stop);
  const setAbout = useComposerContext((s) => s.setAbout);
  const provider = PROVIDER_ORIGIN[finding.origin];
  const answerLed = finding.body?.some((b) => b.type === "answer") ?? false;

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleParts = parseMoneyPhrase(finding.title);
  const [amountDraft, setAmountDraft] = useState(titleParts ? formatAmountDraft(titleParts.amount) : "");
  const [titleDraft, setTitleDraft] = useState(finding.title);
  const [summaryDraft, setSummaryDraft] = useState(finding.summary);

  function beginEdit() {
    const parts = parseMoneyPhrase(finding.title);
    setAmountDraft(parts ? formatAmountDraft(parts.amount) : "");
    setTitleDraft(finding.title);
    setSummaryDraft(finding.summary);
    setEditing(true);
  }

  function saveEdit() {
    let title = titleDraft.trim() || finding.title;
    let summary = summaryDraft.trim() || finding.summary;
    let body = finding.body;
    if (titleParts) {
      const amount = Number(amountDraft.replace(/[\s\u00a0\u202f]/g, "").replace(",", "."));
      if (!Number.isNaN(amount)) {
        const from = titleParts.amount;
        title = replaceMoneyAmount(finding.title, from, amount);
        summary = replaceMoneyAmount(summaryDraft.trim() || finding.summary, from, amount);
        if (body?.length) {
          body = rewriteFindingBodyMoney(body, from, amount);
        }
      }
    }
    patchFinding(finding.id, {
      title,
      summary,
      ...(body ? { body } : {}),
      confidence: "confirmed",
    });
    setEditing(false);
    show("C'est noté, j'ai mis à jour ce que j'avais retenu.");
  }

  function confirmForget() {
    const snapshot = removeFinding(finding.id);
    setConfirmDelete(false);
    close();
    navigate(topic ? `/entreprise/${topic.id}` : "/entreprise");
    if (!snapshot) return;
    show("J'ai oublié ce constat.", {
      durationMs: 5000,
      action: {
        label: "Annuler",
        onClick: () => {
          restoreFinding(snapshot);
          show("Le constat est de retour.");
        },
      },
    });
  }

  function reopenNeed() {
    const scenarioId = finding.scenarioId;
    if (!scenarioId) return;
    if (!SCENARIOS[scenarioId]) {
      show("Ce besoin n'est plus disponible.");
      return;
    }
    close();
    stop();
    reopen(scenarioId);
    navigate(`/besoin/${scenarioId}`);
  }

  function askElea() {
    close();
    setAbout(finding.title);
    navigate("/", { state: { openComposer: true } });
  }

  const editParts = parseMoneyPhrase(finding.title);

  return (
    <motion.div className={styles.root} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem} className={styles.meta}>
        <span className={styles.type}>{TYPE_LABEL[finding.type]}</span>
        {finding.confidence && <ConfidenceBadge value={finding.confidence} />}
      </motion.div>

      {editing ? (
        <motion.form
          variants={blockItem}
          className={styles.editForm}
          onSubmit={(e) => {
            e.preventDefault();
            saveEdit();
          }}
        >
          <label className={styles.field}>
            <span>Titre</span>
            {editParts ? (
              <MoneyPhraseEditor
                before={editParts.before}
                after={editParts.after}
                amountDraft={amountDraft}
                onAmountChange={setAmountDraft}
                className={["voice", styles.titleEdit].join(" ")}
              />
            ) : (
              <input
                className={styles.input}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                aria-label="Titre du constat"
              />
            )}
          </label>
          <label className={styles.field}>
            <span>Résumé</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              aria-label="Résumé du constat"
            />
          </label>
          <div className={styles.editActions}>
            <Button type="submit">Enregistrer</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </motion.form>
      ) : (
        <>
          {showTitle && !answerLed && (
            <motion.h2 variants={blockItem} className={["voice", styles.title].join(" ")}>
              {finding.title}
            </motion.h2>
          )}

          {!answerLed && (
            <motion.p variants={blockItem} className={styles.summary}>
              {finding.summary}
            </motion.p>
          )}

          {finding.body && finding.body.length > 0 && (
            <motion.div variants={blockItem} className={styles.body} aria-label="Contenu du constat">
              {finding.body.map((b) => (
                <BlockRenderer key={b.id} block={b} active={false} />
              ))}
            </motion.div>
          )}
        </>
      )}

      <motion.dl variants={blockItem} className={styles.facts}>
        <div>
          <dt>Origine</dt>
          <dd className={styles.origin}>
            {provider ? <ProviderLogo provider={provider} size={16} labelled={false} /> : null}
            {ORIGIN_LABEL[finding.origin]}
          </dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>
            <time dateTime={finding.createdAt}>{formatRelativeDate(finding.createdAt, today)}</time>
          </dd>
        </div>
        {topic && (
          <div>
            <dt>Sujet</dt>
            <dd>{topic.label}</dd>
          </div>
        )}
      </motion.dl>

      {!editing && (
        <motion.div variants={blockItem} className={styles.actions}>
          {finding.scenarioId && (
            <Button variant="secondary" onClick={reopenNeed}>
              Rouvrir le besoin
            </Button>
          )}
          <Button onClick={askElea}>Demander à Éléa</Button>
          <Button variant="ghost" onClick={beginEdit}>
            Modifier
          </Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            Ce n'est pas juste, oubliez-le
          </Button>
        </motion.div>
      )}

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Oublier ce constat ?">
        <p className={styles.confirmText}>
          Je retirerai «{"\u00a0"}
          {finding.title}
          {"\u00a0"}» de la mémoire. Vous pourrez annuler pendant quelques secondes.
        </p>
        <div className={styles.editActions}>
          <Button onClick={confirmForget}>Oublier</Button>
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Garder
          </Button>
        </div>
      </Sheet>
    </motion.div>
  );
}
