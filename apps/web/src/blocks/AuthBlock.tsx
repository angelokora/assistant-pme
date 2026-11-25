import { useState } from "react";
import { Button, Card, ProviderLogo, Sheet } from "@elea/ds";
import { BookmarkCheck, Mail } from "lucide-react";
import type { AuthBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import { ActionSlot } from "./ActionSlot";
import { BlockDone } from "./BlockDone";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

type Method = "google" | "apple" | "email";

const METHOD_LABEL: Record<Method, string> = {
  google: "Continuer avec Google",
  apple: "Continuer avec Apple",
  email: "Continuer avec mon e-mail",
};

const DONE_LABEL: Record<Method, string> = {
  google: "Compte créé avec Google",
  apple: "Compte créé avec Apple",
  email: "Compte créé avec e-mail",
};

/**
 * Création de compte (version courte pour le connecteur, ou complète avec récap).
 * Si `consent` est fourni par le scénario, une feuille s'ouvre après le choix de méthode.
 */
export function AuthBlockView({ block, active }: BlockProps<AuthBlock>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const resolution = usePlayer((s) => s.resolutions[block.id]);
  const canAct = active && awaiting?.kind === "auth";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, setPending] = useState<Method | null>(null);

  function choose(method: Method) {
    if (!canAct) return;
    if (block.consent) {
      setPending(method);
      setSheetOpen(true);
      return;
    }
    confirm(method);
  }

  function confirm(method: Method) {
    setSheetOpen(false);
    setPending(null);
    reply({ kind: "event", blockId: block.id, value: method, doneLabel: DONE_LABEL[method] });
  }

  if (resolution) {
    return (
      <section className={styles.auth}>
        <BlockDone summary={resolution.summary} />
      </section>
    );
  }

  return (
    <section className={styles.auth}>
      {block.eyebrow && <p className="eyebrow">{block.eyebrow}</p>}
      <h2 className="voice">{block.title}</h2>
      <p className={styles.authText}>{block.text}</p>

      {block.recap && (
        <Card tone="memory" padding="md" className={styles.authRecap}>
          <p className={styles.authRecapLabel}>{block.recap.label}</p>
          <p className={styles.authRecapValue}>{block.recap.value}</p>
          {block.recap.highlight && <p className={styles.authRecapHighlight}>{block.recap.highlight}</p>}
        </Card>
      )}

      {(block.keepsTitle || block.keeps.length > 0) && (
        <div className={styles.keepsBlock}>
          {block.keepsTitle && <p className={styles.keepsTitle}>{block.keepsTitle}</p>}
          <ul className={styles.keeps}>
            {block.keeps.map((line) => (
              <li key={line}>
                <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ActionSlot active={canAct}>
        <div className={styles.authMethods} role="group" aria-label="Créer un compte">
          <Button
            variant="secondary"
            full
            disabled={!canAct}
            icon={<ProviderLogo provider="google" size={20} labelled={false} />}
            onClick={() => choose("google")}
          >
            {METHOD_LABEL.google}
          </Button>
          <Button
            variant="secondary"
            full
            disabled={!canAct}
            icon={<ProviderLogo provider="apple" size={20} labelled={false} />}
            onClick={() => choose("apple")}
          >
            {METHOD_LABEL.apple}
          </Button>
          <Button variant="ghost" full disabled={!canAct} icon={<Mail size={18} strokeWidth={1.75} />} onClick={() => choose("email")}>
            {METHOD_LABEL.email}
          </Button>
        </div>
      </ActionSlot>

      {block.consent && (
        <Sheet
          open={sheetOpen}
          onClose={() => {
            setSheetOpen(false);
            setPending(null);
          }}
          title={block.consent.title}
        >
          <div className={styles.consent}>
            <p className={styles.consentLead}>{block.consent.text}</p>
            <ul className={styles.consentList}>
              {block.consent.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className={styles.consentActions}>
              <Button full disabled={!pending} onClick={() => pending && confirm(pending)}>
                {block.consent.confirmLabel}
              </Button>
              <Button
                variant="secondary"
                full
                onClick={() => {
                  setSheetOpen(false);
                  setPending(null);
                }}
              >
                {block.consent.cancelLabel}
              </Button>
            </div>
          </div>
        </Sheet>
      )}
    </section>
  );
}
