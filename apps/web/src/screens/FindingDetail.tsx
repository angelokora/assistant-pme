import { motion } from "motion/react";
import {
  Button,
  ConfidenceBadge,
  ProviderLogo,
  blockItem,
  blockList,
  formatRelativeDate,
  type FindingOrigin,
  type FindingType,
  type ProviderId,
  useToast,
} from "@elea/ds";
import type { Finding } from "../engine/types";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { SCENARIOS } from "../engine/scenarios";
import { usePlayer } from "../engine/player";
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

/** Contenu du détail d'un constat : méta, résumé, body en lecture, actions. Pas de layoutId ici. */
export function FindingDetail({ finding, showTitle = true }: Props) {
  const navigate = useNavigate();
  const { show } = useToast();
  const close = useDetail((s) => s.close);
  const today = useMemory((s) => s.today);
  const topic = useMemory((s) => s.topics.find((t) => t.id === finding.topicId));
  const reopen = usePlayer((s) => s.reopen);
  const stop = usePlayer((s) => s.stop);
  const setAbout = useComposerContext((s) => s.setAbout);
  const provider = PROVIDER_ORIGIN[finding.origin];
  /** Si le body porte déjà une fiche answer, on évite le double titre / résumé. */
  const answerLed = finding.body?.some((b) => b.type === "answer") ?? false;

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

  return (
    <motion.div className={styles.root} variants={blockList} initial="hidden" animate="shown">
      <motion.div variants={blockItem} className={styles.meta}>
        <span className={styles.type}>{TYPE_LABEL[finding.type]}</span>
        {finding.confidence && <ConfidenceBadge value={finding.confidence} />}
      </motion.div>

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

      <motion.div variants={blockItem} className={styles.actions}>
        {finding.scenarioId && (
          <Button variant="secondary" onClick={reopenNeed}>
            Rouvrir le besoin
          </Button>
        )}
        <Button onClick={askElea}>Demander à Éléa</Button>
        <Button variant="ghost" onClick={() => show("Bientôt disponible")}>
          Modifier
        </Button>
      </motion.div>
    </motion.div>
  );
}
