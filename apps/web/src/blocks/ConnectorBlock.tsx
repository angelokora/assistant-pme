import { useState } from "react";
import { Button, Callout, Card, ProviderLogo, type ProviderId } from "@elea/ds";
import { Check, EyeOff, ShieldCheck } from "lucide-react";
import type { ConnectorBlock } from "../engine/types";
import { useDemo } from "../demo/demo";
import { usePlayer } from "../engine/player";
import { useMemory } from "../memory/store";
import { ActionSlot } from "./ActionSlot";
import { BlockDone } from "./BlockDone";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

const PROVIDER_LABEL: Record<"gmail" | "outlook" | "drive", string> = {
  gmail: "Gmail",
  outlook: "Outlook",
  drive: "Drive",
};

type ConnectChoice = "gmail" | "outlook" | "drive" | "google";

/**
 * Écran de réassurance pour connecter une source (mails, Drive).
 * Avec `googleOneGesture` et un compte Google, un seul geste connecte Gmail et Drive.
 */
export function ConnectorBlockView({ block, active }: BlockProps<ConnectorBlock>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const resolution = usePlayer((s) => s.resolutions[block.id]);
  const accountMethod = useMemory((s) => s.account.method);
  const oneGesture = !!block.googleOneGesture && accountMethod === "google";
  const mailInterrupted = useDemo((s) => s.mailInterrupted);
  const [interrupted, setInterrupted] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<ConnectChoice | null>(null);
  const canAct = active && awaiting?.kind === "connector" && awaiting.blockId === block.id;

  function connect(provider: ConnectChoice, { force = false }: { force?: boolean } = {}) {
    if (!canAct) return;
    if (mailInterrupted && !force) {
      setPendingProvider(provider);
      setInterrupted(true);
      return;
    }
    setInterrupted(false);
    setPendingProvider(null);
    const label = provider === "google" ? "Gmail et Drive" : PROVIDER_LABEL[provider];
    reply({
      kind: "event",
      blockId: block.id,
      value: `connect:${provider}`,
      doneLabel: provider === "google" ? `${label} choisis` : `${label} choisi`,
    });
  }

  function skip() {
    if (!canAct) return;
    reply({ kind: "event", blockId: block.id, value: "skip", doneLabel: block.skipLabel });
  }

  if (resolution) {
    return (
      <section className={styles.connector}>
        <BlockDone summary={resolution.summary} />
      </section>
    );
  }

  return (
    <section className={styles.connector}>
      <header className={styles.connectorHeader}>
        <h2 className="voice">{block.title}</h2>
        <p className={styles.connectorWhy}>{block.why}</p>
      </header>

      {!oneGesture && (
        <div className={styles.connectorColumns}>
          <Card tone="info" padding="md" className={styles.connectorCol}>
            <p className={styles.connectorColTitle}>
              <Check size={16} strokeWidth={2.2} aria-hidden />
              Ce que je lis
            </p>
            <ul className={styles.connectorList}>
              {block.willRead.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>
          <Card tone="sunken" padding="md" className={styles.connectorCol}>
            <p className={styles.connectorColTitle}>
              <EyeOff size={16} strokeWidth={2.2} aria-hidden />
              Ce que je ne lis pas
            </p>
            <ul className={styles.connectorList}>
              {block.willNotRead.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <ul className={styles.reassurance}>
        {block.reassurance.map((line) => (
          <li key={line}>
            <ShieldCheck size={16} strokeWidth={2.2} aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {interrupted && (
        <Callout tone="warning" title="Connexion interrompue">
          La connexion a été interrompue (simulation démo). Vous pouvez réessayer ou passer au dépôt de documents.
        </Callout>
      )}

      <ActionSlot active={canAct}>
        <div className={styles.connectorActions}>
          {interrupted ? (
            <>
              <Button
                variant="primary"
                full
                disabled={!canAct || !pendingProvider}
                onClick={() => pendingProvider && connect(pendingProvider, { force: true })}
              >
                Réessayer
              </Button>
              <Button variant="secondary" full disabled={!canAct} onClick={skip}>
                Passer au dépôt
              </Button>
            </>
          ) : oneGesture ? (
            <>
              <Button
                variant="primary"
                full
                disabled={!canAct}
                icon={<ProviderLogo provider="google" size={20} labelled={false} />}
                onClick={() => connect("google")}
              >
                Utiliser votre compte Google
              </Button>
              <p className={styles.connectorWhy}>Gmail et Drive, en lecture seule.</p>
              <Button variant="secondary" full disabled={!canAct} onClick={skip}>
                {block.skipLabel}
              </Button>
            </>
          ) : (
            <>
              <div className={styles.providers} role="group" aria-label="Choisir un compte">
                {block.providers.map((provider) => (
                  <Button
                    key={provider}
                    variant="secondary"
                    size="sm"
                    disabled={!canAct}
                    className={styles.providerBtn}
                    icon={<ProviderLogo provider={provider as ProviderId} size={18} labelled={false} />}
                    onClick={() => connect(provider)}
                  >
                    {PROVIDER_LABEL[provider]}
                  </Button>
                ))}
              </div>
              <Button variant="secondary" full disabled={!canAct} onClick={skip}>
                {block.skipLabel}
              </Button>
            </>
          )}
        </div>
      </ActionSlot>
    </section>
  );
}
