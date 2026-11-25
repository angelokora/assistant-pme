import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ACTION_AWAIT_KINDS, usePlayer } from "../engine/player";
import { useActionDockHost } from "../composer/actionDockHost";
import { useMediaQuery } from "../composer/useMediaQuery";

type Props = {
  /** Le bloc est celui du tour en attente de réponse. */
  active: boolean;
  children: ReactNode;
};

/**
 * Affiche les actions dans le bloc (≥ 640 px) ou les porte vers l'ActionDock mobile.
 * Une seule instance active à la fois : pas de duplication.
 */
export function ActionSlot({ active, children }: Props) {
  const mobile = useMediaQuery("(max-width: 639px)");
  const awaiting = usePlayer((s) => s.awaiting);
  const host = useActionDockHost((s) => s.host);
  const dock = active && mobile && !!awaiting && ACTION_AWAIT_KINDS.has(awaiting.kind);

  if (!active) return null;
  // Tant que l'hôte mobile n'est pas prêt, on garde les actions dans le fil
  // (un instant) pour qu'elles existent dès que le portail peut les prendre.
  if (dock && host) return createPortal(children, host);
  return <>{children}</>;
}
