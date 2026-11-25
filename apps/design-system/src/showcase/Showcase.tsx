import { useEffect, useState } from "react";
import { Briefcase, Mic, Target, User, Wallet } from "lucide-react";
import {
  Button, Callout, Chip, ConfidenceBadge, DimensionCard, Gauge, IconButton, NotedTag, Orb, ProviderLogo, Sheet, StepList, TranscriptText, Waveform,
  type OrbState, type ProviderId, type StepItem, type StepStatus,
} from "../index";
import styles from "./Showcase.module.css";

const COLORS: { token: string; hex: string; role: string; on: string }[] = [
  { token: "--color-text", hex: "#011627", role: "Texte (Ink Black)", on: "#fbf8f3" },
  { token: "--color-text-muted", hex: "#5b6875", role: "Texte secondaire", on: "#fbf8f3" },
  { token: "--color-action", hex: "#087e8b", role: "Action, progrès (Teal)", on: "#ffffff" },
  { token: "--teal-600", hex: "#066a75", role: "Texte teal sur fonds teintés", on: "#e3f1f2" },
  { token: "--color-presence", hex: "#a30b37", role: "Présence d'Éléa (Cherry Rose)", on: "#fbf8f3" },
  { token: "--color-memory", hex: "#dda77b", role: "Mémoire, fonds uniquement (Light Bronze)", on: "#011627" },
  { token: "--color-memory-text", hex: "#8a5a2b", role: "Texte bronze", on: "#f7ebdd" },
  { token: "--color-info", hex: "#b1ddf1", role: "Information, fonds uniquement (Icy Blue)", on: "#011627" },
  { token: "--color-bg", hex: "#fbf8f3", role: "Fond papier", on: "#011627" },
];

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const SAMPLE = "Les salaires avec les charges, autour de 38 000. Le loyer 3 200, je dirais 58 000 en tout.";

export function Showcase() {
  const [orb, setOrb] = useState<OrbState>("idle");
  const [level, setLevel] = useState(0.4);
  const [progress, setProgress] = useState(0.35);
  const [pulse, setPulse] = useState(0);
  const [words, setWords] = useState(0);
  const [chip, setChip] = useState("a");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stepDemo, setStepDemo] = useState(0);

  useEffect(() => {
    if (orb !== "listening") return;
    const id = setInterval(() => setLevel(0.25 + Math.random() * 0.7), 140);
    return () => clearInterval(id);
  }, [orb]);

  useEffect(() => {
    const total = SAMPLE.split(" ").length;
    const id = setInterval(() => setWords((w) => (w >= total + 8 ? 0 : w + 1)), 160);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Orb size={56} state="idle" />
        <div>
          <p className="eyebrow">Design system</p>
          <h1 className="voice">Éléa, l'atelier vivant</h1>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.h2}>Couleurs et contrastes</h2>
        <div className={styles.swatches}>
          {COLORS.map((c) => {
            const ratio = contrast(c.hex, c.on);
            return (
              <div key={c.token} className={styles.swatch}>
                <span className={styles.chip} style={{ background: c.hex, color: c.on }}>Aa</span>
                <div>
                  <p className={styles.token}>{c.token}</p>
                  <p className="muted">{c.role}</p>
                  <p className={styles.ratio}>
                    {ratio.toFixed(1)} · {ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA grand texte" : "décor"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Typographie</h2>
        <p className="eyebrow">Question d'Éléa · Fraunces</p>
        <p className="voice" style={{ fontSize: "var(--text-2xl)", maxWidth: 560 }}>
          Combien vous coûtent environ vos charges chaque mois ?
        </p>
        <p className="eyebrow" style={{ marginTop: 24 }}>Interface · Instrument Sans</p>
        <p style={{ maxWidth: 560 }}>
          Un ordre de grandeur suffit. Je fais le tri et je range ce que vous me dites dans <strong>Mes finances</strong>.
          Montant : <span className="tabular">58 000 €</span>.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Orbe de présence</h2>
        <div className={styles.row}>
          {(["idle", "listening", "thinking", "speaking", "done"] as OrbState[]).map((s) => (
            <Chip key={s} selected={orb === s} onClick={() => setOrb(s)}>{s}</Chip>
          ))}
        </div>
        <div className={styles.orbs}>
          <Orb size={96} state={orb} level={level} />
          <Orb size={56} state={orb} level={level} />
          <Orb size={20} state={orb} level={level} />
          <Waveform level={orb === "listening" ? level : 0} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Boutons et puces</h2>
        <div className={styles.row}>
          <Button>Commencer par celle-ci</Button>
          <Button variant="secondary">Je préfère déposer mes factures</Button>
          <Button variant="ghost">Plus tard</Button>
          <Button variant="inverse">J'ai terminé</Button>
          <Button loading>Envoi</Button>
          <IconButton label="Micro" variant="soft"><Mic size={20} /></IconButton>
        </div>
        <div className={styles.row}>
          <Chip selected={chip === "a"} onClick={() => setChip("a")}>Je ne sais pas</Chip>
          <Chip selected={chip === "b"} onClick={() => setChip("b")}>Changer de sujet</Chip>
          <ConfidenceBadge value="confirmed" />
          <ConfidenceBadge value="estimated" />
          <ConfidenceBadge value="to-check" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Mémoire</h2>
        <div className={styles.row}>
          <Button variant="secondary" onClick={() => { setProgress((p) => (p >= 1 ? 0.1 : Math.min(1, p + 0.3))); setPulse((n) => n + 1); }}>
            Faire progresser
          </Button>
          <div style={{ width: 200 }}><Gauge value={progress} status={progress >= 1 ? "enough" : "active"} /></div>
        </div>
        <div className={styles.dims}>
          <DimensionCard id="a" label="Mon activité" icon={<Briefcase size={18} />} tone="icy" summary="Pâtisserie-boulangerie, 12 salariés" progress={0.4} status="active" />
          <DimensionCard id="f" label="Mes finances" icon={<Wallet size={18} />} tone="teal" summary="Charges connues" progress={progress} status={progress >= 1 ? "enough" : "active"} pulseKey={pulse} />
          <DimensionCard id="p" label="Mon profil" icon={<User size={18} />} tone="cherry" summary="À découvrir" progress={0.02} status="todo" />
          <DimensionCard id="t" label="Mes priorités" icon={<Target size={18} />} tone="bronze" summary="2 sujets identifiés" progress={0.3} status="active" compact />
        </div>
        <div style={{ maxWidth: 520, display: "grid", gap: 12 }}>
          <NotedTag targetLabel="Mes finances" text="Charges : environ 58 000 € par mois" confidence="estimated" editable />
          <Callout tone="memory" title="Il reste novembre">La facture de novembre arrive à échéance le 30 décembre.</Callout>
          <Callout tone="success" title="C'est parti">Je vous rappelle la première étape jeudi matin.</Callout>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Transcription</h2>
        <div style={{ maxWidth: 520 }}><TranscriptText text={SAMPLE} visibleWords={words} /></div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Étapes (StepList)</h2>
        <div className={styles.row}>
          <Button variant="secondary" size="sm" onClick={() => setStepDemo((n) => (n + 1) % 4)}>
            Avancer ({stepDemo}/3)
          </Button>
        </div>
        <div style={{ maxWidth: 420 }}>
          <StepList title="J'analyse ce que vous m'avez dit" steps={demoSteps(stepDemo)} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Logos fournisseurs</h2>
        <div className={styles.row}>
          {(["gmail", "outlook", "drive", "google", "apple"] as ProviderId[]).map((p) => (
            <div key={p} className={styles.provider}>
              <ProviderLogo provider={p} size={32} />
              <span>{p}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Feuille (Sheet)</h2>
        <div className={styles.row}>
          <Button onClick={() => setSheetOpen(true)}>Ouvrir la feuille</Button>
          <span className="muted">Bas sur mobile, panneau latéral à partir de 1024 px. Glisser pour fermer.</span>
        </div>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Connexion sécurisée">
          <p style={{ marginBottom: 16 }}>
            Lecture seule : Éléa n'envoie et ne supprime rien. Vous pouvez couper l'accès à tout moment.
          </p>
          <Button full onClick={() => setSheetOpen(false)}>
            J'ai compris
          </Button>
        </Sheet>
      </section>
    </div>
  );
}

function demoSteps(activeIndex: number): StepItem[] {
  const labels = [
    "Je repère les factures des trois derniers mois…",
    "Je lis les montants et les échéances…",
    "Je classe vos charges par nature…",
  ];
  return labels.map((label, i) => {
    let status: StepStatus = "pending";
    if (i < activeIndex) status = "done";
    else if (i === activeIndex) status = "active";
    return { id: `s-${i}`, label, status };
  });
}
