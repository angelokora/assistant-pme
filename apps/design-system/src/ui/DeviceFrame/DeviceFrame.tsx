import type { CSSProperties, ReactNode } from "react";
import styles from "./DeviceFrame.module.css";

export type DeviceKind = "phone" | "tablet";
export type DeviceOrientation = "portrait" | "landscape";

export const DEVICE_SCREEN = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
} as const;

type Props = {
  kind: DeviceKind;
  orientation?: DeviceOrientation;
  /** Échelle visuelle (1 = taille réelle). */
  scale?: number;
  className?: string;
  children: ReactNode;
};

/** Cadre d'appareil générique (démo) : téléphone ou tablette, portrait ou paysage. */
export function DeviceFrame({ kind, orientation = "portrait", scale = 1, className, children }: Props) {
  const base = DEVICE_SCREEN[kind];
  const landscape = orientation === "landscape";
  const screenW = landscape ? base.height : base.width;
  const screenH = landscape ? base.width : base.height;

  return (
    <div
      className={[styles.wrap, className].filter(Boolean).join(" ")}
      style={{ ["--device-scale" as string]: String(scale) } as CSSProperties}
    >
      <div
        className={[styles.device, styles[kind], landscape && styles.landscape].filter(Boolean).join(" ")}
        style={
          {
            ["--screen-w" as string]: `${screenW}px`,
            ["--screen-h" as string]: `${screenH}px`,
          } as CSSProperties
        }
      >
        <div className={styles.bezel} aria-hidden>
          {kind === "phone" && <span className={styles.island} />}
          {kind === "phone" && (
            <>
              <span className={styles.sideBtn} data-side="left" data-pos="1" />
              <span className={styles.sideBtn} data-side="left" data-pos="2" />
              <span className={styles.sideBtn} data-side="right" data-pos="1" />
            </>
          )}
        </div>
        <div className={styles.screen}>{children}</div>
      </div>
    </div>
  );
}
