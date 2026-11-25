import { Button, Card, ProviderLogo, type ProviderId } from "@elea/ds";
import { Check, EyeOff, ShieldCheck } from "lucide-react";
import type { ConnectorBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

const PROVIDER_LABEL: Record<"gmail" | "outlook" | "drive", string> = {
  gmail: "Gmail",
  outlook: "Outlook",
  drive: "Drive",
};

/** Écran de réassurance pour connecter une source (mails, Drive). */
export function ConnectorBlockView({ block, active }: BlockProps<ConnectorBlock>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const canAct = active && awaiting?.kind === "connector" && awaiting.blockId === block.id;

  function connect(provider: "gmail" | "outlook" | "drive") {
    if (!canAct) return;
    reply({
      kind: "event",
      blockId: block.id,
      value: "connect",
      label: PROVIDER_LABEL[provider],
    });
  }

  function skip() {
    if (!canAct) return;
    reply({ kind: "event", blockId: block.id, value: "skip", label: block.skipLabel });
  }

  return (
    <section className={styles.connector}>
      <header className={styles.connectorHeader}>
        <h2 className="voice">{block.title}</h2>
        <p className={styles.connectorWhy}>{block.why}</p>
      </header>

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

      <ul className={styles.reassurance}>
        {block.reassurance.map((line) => (
          <li key={line}>
            <ShieldCheck size={16} strokeWidth={2.2} aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className={styles.connectorActions}>
        <div className={styles.providers} role="group" aria-label="Choisir un compte">
          {block.providers.map((provider) => (
            <Button
              key={provider}
              variant="secondary"
              full
              disabled={!canAct}
              className={styles.providerBtn}
              icon={<ProviderLogo provider={provider as ProviderId} size={22} labelled={false} />}
              onClick={() => connect(provider)}
            >
              {PROVIDER_LABEL[provider]}
            </Button>
          ))}
        </div>

        <Button variant="secondary" full disabled={!canAct} onClick={skip}>
          {block.skipLabel}
        </Button>
      </div>
    </section>
  );
}
