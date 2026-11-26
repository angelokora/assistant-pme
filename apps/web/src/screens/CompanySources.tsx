import { useState } from "react";
import { Button, Card, ProviderLogo, Sheet, formatDate, type ProviderId, useToast } from "@elea/ds";
import { Check, EyeOff, ShieldCheck } from "lucide-react";
import type { ConnectorBlock, Source } from "../engine/types";
import { SCENARIOS } from "../engine/scenarios";
import { useMemory } from "../memory/store";
import styles from "./CompanySources.module.css";

const PROVIDER_MAP: Record<string, ProviderId> = {
  gmail: "gmail",
  outlook: "outlook",
  drive: "drive",
};

const STATUS_LABEL: Record<Source["status"], string> = {
  connected: "Connectée",
  available: "Disponible",
  disconnected: "Déconnectée",
};

/** Reprend le bloc connector de l'onboarding pour la feuille Outlook. */
function outlookConnector(): ConnectorBlock | null {
  const scenario = SCENARIOS.onboarding;
  if (!scenario) return null;
  for (const step of Object.values(scenario.steps)) {
    const block = step.blocks.find((b): b is ConnectorBlock => b.type === "connector");
    if (block) return block;
  }
  return null;
}

type ConfirmState = { source: Source } | null;

/** Section sources de Mon entreprise : états, sync, couper / reconnecter / connecter. */
export function CompanySources() {
  const sources = useMemory((s) => s.sources);
  const setSourceStatus = useMemory((s) => s.setSourceStatus);
  const { show } = useToast();
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const connector = outlookConnector();

  function disconnect(source: Source) {
    setSourceStatus(source.id, "disconnected", { detail: source.detail });
    setConfirm(null);
    show(`${source.label} déconnectée. Vos constats restent.`);
  }

  function reconnect(source: Source) {
    setSourceStatus(source.id, "connected", {
      detail: source.detail,
      lastSync: new Date().toISOString().slice(0, 19),
    });
    show(`${source.label} reconnectée.`);
  }

  function connectOutlook() {
    setSourceStatus("outlook", "connected", {
      detail: "sophie.martin@outlook.com",
      lastSync: new Date().toISOString().slice(0, 19),
    });
    setConnectOpen(false);
    show("Outlook connectée.");
  }

  return (
    <section id="sources" aria-labelledby="sources-title" className={styles.section}>
      <h2 id="sources-title" className={styles.sectionTitle}>
        Sources
      </h2>
      <ul className={styles.list}>
        {sources.map((s) => (
          <li key={s.id} className={styles.row}>
            {PROVIDER_MAP[s.provider] ? (
              <ProviderLogo provider={PROVIDER_MAP[s.provider]} size={32} />
            ) : (
              <span className={styles.fallback} aria-hidden />
            )}
            <div className={styles.body}>
              <div className={styles.top}>
                <strong>{s.label}</strong>
                <span className={styles.status} data-status={s.status}>
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              {s.detail && <p className={styles.detail}>{s.detail}</p>}
              {s.lastSync && s.status === "connected" && (
                <p className={styles.sync}>Dernière sync. {formatDate(s.lastSync, "short")}</p>
              )}
            </div>
            <div className={styles.actions}>
              {s.status === "connected" && (
                <Button variant="ghost" size="sm" onClick={() => setConfirm({ source: s })}>
                  Couper l'accès
                </Button>
              )}
              {s.status === "disconnected" && (
                <Button variant="secondary" size="sm" onClick={() => reconnect(s)}>
                  Reconnecter
                </Button>
              )}
              {s.status === "available" && s.provider === "outlook" && (
                <Button size="sm" onClick={() => setConnectOpen(true)}>
                  Connecter
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Sheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm ? `Couper l'accès à ${confirm.source.label}` : undefined}
      >
        {confirm && (
          <div className={styles.confirm}>
            <p className={styles.confirmLead}>
              Vous gardez tout ce qui est déjà rangé dans votre mémoire. Je ne lirai plus {confirm.source.label} tant
              que vous ne reconnecterez pas.
            </p>
            <Card tone="info" padding="md">
              <p className={styles.confirmTitle}>
                <Check size={16} strokeWidth={2.2} aria-hidden /> Ce qui est conservé
              </p>
              <ul>
                <li>Les constats et documents déjà notés</li>
                <li>Les plans et décisions liés</li>
              </ul>
            </Card>
            <Card tone="sunken" padding="md">
              <p className={styles.confirmTitle}>
                <EyeOff size={16} strokeWidth={2.2} aria-hidden /> Ce qui ne sera plus lu
              </p>
              <ul>
                <li>Nouveaux messages et fichiers de {confirm.source.label}</li>
                <li>Synchronisations automatiques</li>
              </ul>
            </Card>
            <p className={styles.reversible}>
              <ShieldCheck size={16} strokeWidth={2.2} aria-hidden /> Réversible : un bouton « Reconnecter » suffit.
            </p>
            <div className={styles.confirmActions}>
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Annuler
              </Button>
              <Button onClick={() => disconnect(confirm.source)}>Couper l'accès</Button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={connectOpen} onClose={() => setConnectOpen(false)} title={connector?.title ?? "Connecter Outlook"}>
        {connector && (
          <div className={styles.connector}>
            <p className={styles.connectorWhy}>{connector.why}</p>
            <div className={styles.connectorCols}>
              <Card tone="info" padding="md">
                <p className={styles.confirmTitle}>
                  <Check size={16} strokeWidth={2.2} aria-hidden /> Ce que je lis
                </p>
                <ul>
                  {connector.willRead.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </Card>
              <Card tone="sunken" padding="md">
                <p className={styles.confirmTitle}>
                  <EyeOff size={16} strokeWidth={2.2} aria-hidden /> Ce que je ne lis pas
                </p>
                <ul>
                  {connector.willNotRead.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </Card>
            </div>
            <ul className={styles.reassurance}>
              {connector.reassurance.map((line) => (
                <li key={line}>
                  <ShieldCheck size={16} strokeWidth={2.2} aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Button onClick={connectOutlook}>
              <ProviderLogo provider="outlook" size={18} labelled={false} /> Connecter Outlook
            </Button>
          </div>
        )}
      </Sheet>
    </section>
  );
}
