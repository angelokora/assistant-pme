import { useState } from "react";
import { Button, Card, ProviderLogo, Sheet } from "@elea/ds";
import { BookmarkCheck, Mail } from "lucide-react";
import type { AuthBlock } from "../engine/types";
import { usePlayer } from "../engine/player";
import type { BlockProps } from "./BlockRenderer";
import styles from "./blocks.module.css";

type Method = "google" | "apple" | "email";

const METHOD_LABEL: Record<Method, string> = {
  google: "Continuer avec Google",
  apple: "Continuer avec Apple",
  email: "Continuer avec mon e-mail",
};

/**
 * Création de compte (version courte pour le connecteur, ou complète avec récap).
 * Après Google : feuille de consentement simulée, sobre, sans imiter la marque.
 */
export function AuthBlockView({ block, active }: BlockProps<AuthBlock>) {
  const reply = usePlayer((s) => s.reply);
  const awaiting = usePlayer((s) => s.awaiting);
  const canAct = active && awaiting?.kind === "auth";
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState<Method | null>(null);

  function choose(method: Method) {
    if (!canAct) return;
    if (method === "google") {
      setPending(method);
      setConsent(true);
      return;
    }
    confirm(method);
  }

  function confirm(method: Method) {
    setConsent(false);
    setPending(null);
    reply({ kind: "event", blockId: block.id, value: method, label: METHOD_LABEL[method] });
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

      <ul className={styles.keeps}>
        {block.keeps.map((line) => (
          <li key={line}>
            <BookmarkCheck size={16} strokeWidth={2.2} aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

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

      <Sheet
        open={consent}
        onClose={() => {
          setConsent(false);
          setPending(null);
        }}
        title="Autoriser la lecture"
      >
        <div className={styles.consent}>
          <p className={styles.consentLead}>
            Éléa demande l'accès en lecture seule à votre boîte mail pour retrouver vos factures.
          </p>
          <ul className={styles.consentList}>
            <li>Lecture des messages contenant une facture ou un relevé</li>
            <li>Aucune modification, aucun envoi</li>
            <li>Accès révocable à tout moment depuis Mon entreprise</li>
          </ul>
          <div className={styles.consentActions}>
            <Button
              full
              disabled={!pending}
              onClick={() => pending && confirm(pending)}
            >
              Autoriser
            </Button>
            <Button
              variant="secondary"
              full
              onClick={() => {
                setConsent(false);
                setPending(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Sheet>
    </section>
  );
}
