import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, ChevronUp } from "lucide-react";
import {
  Button,
  Card,
  DimensionCard,
  FindingCard,
  Orb,
  Sheet,
  StepList,
  blockItem,
  blockList,
  formatDate,
  type FindingOrigin,
  type FindingType,
} from "@elea/ds";
import { Icon } from "../blocks/icons";
import { useDemo, type HomeVariant } from "../demo/demo";
import { useDetail } from "../shell/detailStore";
import { useMemory } from "../memory/store";
import { AnimatedMoneyText } from "./AnimatedEuro";
import { HomeComposer } from "./HomeComposer";
import styles from "./Home.module.css";

function greeting(firstName: string) {
  const h = new Date().getHours();
  return `${h >= 18 ? "Bonsoir" : "Bonjour"} ${firstName}`;
}

function planStepStatus(status: "todo" | "doing" | "done"): "pending" | "active" | "done" {
  if (status === "done") return "done";
  if (status === "doing") return "active";
  return "pending";
}

/** Accueil hors besoin : premier lancement, ou quotidien (variantes A/B/C). */
export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const demoVariant = useDemo((s) => s.homeVariant);
  const paramV = params.get("v");
  const variant: HomeVariant =
    paramV === "a" || paramV === "b" || paramV === "c" ? paramV : demoVariant;

  const owner = useMemory((s) => s.owner);
  const account = useMemory((s) => s.account);
  const today = useMemory((s) => s.today);
  const attention = useMemory((s) => s.attention);
  const plans = useMemory((s) => s.plans);
  const findings = useMemory((s) => s.findings);
  const dimensions = useMemory((s) => s.dimensions);
  const topics = useMemory((s) => s.topics);
  const home = useMemory((s) => s.home);
  const openDetail = useDetail((s) => s.open);

  const [composerHandled, setComposerHandled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const clearComposerState = useCallback(() => setComposerHandled(true), []);
  const openComposer =
    !composerHandled && !!(location.state as { openComposer?: boolean } | null)?.openComposer;

  const empty = !account.created && findings.length === 0;
  const activePlan = useMemo(() => plans.find((p) => p.status === "active") ?? plans[0], [plans]);
  const currentStep = useMemo(
    () => activePlan?.steps.find((s) => s.status === "doing") ?? activePlan?.steps.find((s) => s.status === "todo"),
    [activePlan],
  );
  const recentFindings = useMemo(
    () => [...findings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [findings],
  );
  const topicLabel = (id: string) => topics.find((t) => t.id === id)?.label ?? id;
  const suggestions = home?.suggestions ?? [];

  if (empty) {
    return (
      <motion.main className={styles.first} variants={blockList} initial="hidden" animate="shown">
        <motion.div variants={blockItem} className={styles.orb}>
          <Orb size={96} state="idle" />
        </motion.div>
        <motion.p variants={blockItem} className="eyebrow">
          Votre conseillère
        </motion.p>
        <motion.h1 variants={blockItem} className={["voice", styles.title].join(" ")}>
          Bonjour, je suis Éléa.
        </motion.h1>
        <motion.p variants={blockItem} className={styles.lede}>
          Je retiens tout ce qui compte pour votre entreprise, et je vous aide à décider. Faisons connaissance : cinq
          minutes suffisent.
        </motion.p>
        <motion.div variants={blockItem}>
          <Button size="lg" iconEnd={<ArrowRight size={18} />} onClick={() => navigate("/besoin/onboarding")}>
            Faisons connaissance
          </Button>
        </motion.div>
      </motion.main>
    );
  }

  const hello = greeting(owner.firstName || "Sophie");
  const dateLabel = formatDate(today, "weekday");

  const composer = <HomeComposer forceOpen={openComposer} onHandled={clearComposerState} />;

  const suggestionChips = (
    <div className={styles.suggestions} role="list">
      {suggestions.map((s) => (
        <button
          key={s.id}
          type="button"
          className={styles.suggestion}
          role="listitem"
          onClick={() => navigate(`/besoin/${s.scenarioId}`)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  if (variant === "c") {
    return (
      <motion.main className={styles.presence} variants={blockList} initial="hidden" animate="shown">
        <motion.div variants={blockItem} className={styles.orb}>
          <Orb size={96} state="idle" />
        </motion.div>
        <motion.p variants={blockItem} className="eyebrow">
          {hello} · {dateLabel}
        </motion.p>
        <motion.p variants={blockItem} className={["voice", styles.summary].join(" ")}>
          <AnimatedMoneyText text={home?.summary ?? ""} />
        </motion.p>
        <motion.div variants={blockItem}>{suggestionChips}</motion.div>
        <motion.div variants={blockItem} className={styles.composerSlot}>
          {composer}
        </motion.div>
        <motion.button
          variants={blockItem}
          type="button"
          className={styles.sheetCue}
          onClick={() => setSheetOpen(true)}
        >
          <ChevronUp size={18} strokeWidth={1.75} /> Voir le reste
        </motion.button>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Aujourd'hui">
          <AttentionList attention={attention} onOpen={openDetail} />
          {activePlan && (
            <PlanCard
              plan={activePlan}
              currentStepId={currentStep?.id}
              onOpen={() => openDetail("plan", activePlan.id)}
            />
          )}
          <FindingsList
            findings={recentFindings}
            topicLabel={topicLabel}
            today={today}
            onOpen={(id) => openDetail("finding", id)}
          />
        </Sheet>
      </motion.main>
    );
  }

  if (variant === "b") {
    return (
      <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
        <motion.header variants={blockItem} className={styles.header}>
          <p className="eyebrow">
            {hello} · {dateLabel}
          </p>
          <h1 className={["voice", styles.summary].join(" ")}>
            <AnimatedMoneyText text={home?.summary ?? ""} />
          </h1>
        </motion.header>
        <motion.section variants={blockItem} className={styles.dims} aria-label="Dimensions">
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
              compact
            />
          ))}
        </motion.section>
        <motion.section variants={blockItem} className={styles.topics} aria-label="Sujets">
          {topics.map((t) => {
            const count = findings.filter((f) => f.topicId === t.id).length;
            return (
              <button
                key={t.id}
                type="button"
                className={styles.topicRow}
                onClick={() => navigate(`/entreprise/${t.id}`)}
              >
                <Icon name={t.icon} />
                <span>{t.label}</span>
                <span className={styles.count}>{count}</span>
              </button>
            );
          })}
        </motion.section>
        <motion.div variants={blockItem}>{suggestionChips}</motion.div>
        <motion.div variants={blockItem} className={styles.composerSlot}>
          {composer}
        </motion.div>
      </motion.main>
    );
  }

  // Variante A — Fil du jour
  return (
    <motion.main className={styles.page} variants={blockList} initial="hidden" animate="shown">
      <motion.header variants={blockItem} className={styles.header}>
        <p className="eyebrow">{dateLabel}</p>
        <h1 className={["voice", styles.title].join(" ")}>{hello}</h1>
      </motion.header>

      <motion.section variants={blockItem} aria-labelledby="attention-title">
        <h2 id="attention-title" className={styles.sectionTitle}>
          À regarder aujourd'hui
        </h2>
        <AttentionList attention={attention} onOpen={openDetail} />
      </motion.section>

      {activePlan && (
        <motion.section variants={blockItem} aria-labelledby="plan-title">
          <h2 id="plan-title" className={styles.sectionTitle}>
            Plan en cours
          </h2>
          <PlanCard
            plan={activePlan}
            currentStepId={currentStep?.id}
            onOpen={() => openDetail("plan", activePlan.id)}
          />
        </motion.section>
      )}

      <motion.section variants={blockItem} aria-labelledby="findings-title">
        <h2 id="findings-title" className={styles.sectionTitle}>
          Derniers findings
        </h2>
        <FindingsList
          findings={recentFindings}
          topicLabel={topicLabel}
          today={today}
          onOpen={(id) => openDetail("finding", id)}
        />
      </motion.section>

      <motion.div variants={blockItem}>{suggestionChips}</motion.div>
      <motion.div variants={blockItem} className={styles.composerSlot}>
        {composer}
      </motion.div>
    </motion.main>
  );
}

function AttentionList({
  attention,
  onOpen,
}: {
  attention: ReturnType<typeof useMemory.getState>["attention"];
  onOpen: (kind: "attention" | "finding" | "plan", id: string) => void;
}) {
  if (!attention.length) return <p className={styles.empty}>Rien d'urgent pour aujourd'hui.</p>;
  return (
    <ul className={styles.stack}>
      {attention.map((a) => (
        <li key={a.id}>
          <Card
            interactive
            onClick={() => {
              if (a.kind === "finding" && a.findingId) onOpen("finding", a.findingId);
              else if (a.kind === "plan-step" && a.planId) onOpen("plan", a.planId);
              else onOpen("attention", a.id);
            }}
          >
            <p className={styles.cardTitle}>
              <AnimatedMoneyText text={a.title} />
            </p>
            <p className={styles.cardText}>
              <AnimatedMoneyText text={a.text} />
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function PlanCard({
  plan,
  currentStepId,
  onOpen,
}: {
  plan: NonNullable<ReturnType<typeof useMemory.getState>["plans"][number]>;
  currentStepId?: string;
  onOpen: () => void;
}) {
  return (
    <Card interactive onClick={onOpen} className={styles.planCard}>
      <p className={styles.cardTitle}>{plan.title}</p>
      <p className={styles.cardText}>{plan.goal}</p>
      <StepList
        steps={plan.steps.map((s) => ({
          id: s.id,
          label: s.title,
          status: planStepStatus(s.status),
          detail: s.id === currentStepId ? s.detail : undefined,
          due: formatDate(s.due, "short"),
        }))}
      />
    </Card>
  );
}

function FindingsList({
  findings,
  topicLabel,
  today,
  onOpen,
}: {
  findings: ReturnType<typeof useMemory.getState>["findings"];
  topicLabel: (id: string) => string;
  today: string;
  onOpen: (id: string) => void;
}) {
  if (!findings.length) return <p className={styles.empty}>Aucun finding pour l'instant.</p>;
  return (
    <ul className={styles.stack}>
      {findings.map((f) => (
        <li key={f.id}>
          <FindingCard
            findingType={f.type as FindingType}
            title={f.title}
            topicLabel={topicLabel(f.topicId)}
            createdAt={f.createdAt}
            today={today}
            origin={f.origin as FindingOrigin}
            confidence={f.confidence}
            variant="compact"
            onClick={() => onOpen(f.id)}
          />
        </li>
      ))}
    </ul>
  );
}
