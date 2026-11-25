import type { ReactNode } from "react";
import { BookmarkCheck, CircleCheck, Info, TriangleAlert } from "lucide-react";
import styles from "./Callout.module.css";

type Tone = "info" | "memory" | "warning" | "success";
const ICON: Record<Tone, ReactNode> = {
  info: <Info size={18} strokeWidth={2} />,
  memory: <BookmarkCheck size={18} strokeWidth={2} />,
  warning: <TriangleAlert size={18} strokeWidth={2} />,
  success: <CircleCheck size={18} strokeWidth={2} />,
};

export function Callout({ tone, title, children }: { tone: Tone; title?: string; children: ReactNode }) {
  return (
    <div className={[styles.callout, styles[tone]].join(" ")} role={tone === "warning" ? "alert" : undefined}>
      <span className={styles.icon}>{ICON[tone]}</span>
      <div>
        {title && <p className={styles.title}>{title}</p>}
        <p className={styles.text}>{children}</p>
      </div>
    </div>
  );
}
